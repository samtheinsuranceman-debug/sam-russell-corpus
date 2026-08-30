// ============================================================
// Tests for the patent-family shared components (software
// embodiments): hash-chained ledger, calibration-weighted
// consensus bus, compute fabric, per-dimension isolation.
// ============================================================
import { describe, expect, it } from "vitest";
import { canonicalJson, entryHash, verifyChain, GENESIS_HASH, type LedgerRow } from "./ledger";
import {
  calibrationWeight, weightedTrimmedMean, calibratedConsensus,
  calibrationObservations, equalWeights, MIN_SAMPLES,
} from "./calibrationBus";
import { consensusScores, type AxisScore } from "../scoring/consensus";
import { softwareFabric } from "./computeFabric";
import { isolateDimensions, forEachIsolatedDimension } from "./dimensionIsolation";

// ── Ledger ──────────────────────────────────────────────────────────────────

function buildChain(entries: Array<{ kind: string; payload: unknown }>): LedgerRow[] {
  const rows: LedgerRow[] = [];
  let prev = GENESIS_HASH;
  entries.forEach((e, i) => {
    const hash = entryHash(prev, e.kind, e.payload);
    rows.push({ id: i + 1, kind: e.kind, payload: e.payload, prevHash: prev, hash });
    prev = hash;
  });
  return rows;
}

describe("hash-chained ledger", () => {
  it("canonical JSON is key-order independent", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } }))
      .toBe(canonicalJson({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 }));
  });

  it("a well-formed chain verifies end to end", () => {
    const rows = buildChain([
      { kind: "score", payload: { assessmentId: 1, axes: [{ i: 0, s: 0.7 }] } },
      { kind: "match", payload: { userId: 9, served: [{ id: 2, score: 81 }] } },
      { kind: "norm_version", payload: { version: "2026.07-spiral-theoretical-v1" } },
    ]);
    expect(verifyChain(rows)).toEqual({ valid: true, badId: null, length: 3 });
  });

  it("editing any historical payload is detected at that entry", () => {
    const rows = buildChain([
      { kind: "score", payload: { assessmentId: 1, axes: [{ i: 0, s: 0.7 }] } },
      { kind: "score", payload: { assessmentId: 2, axes: [{ i: 0, s: 0.4 }] } },
      { kind: "score", payload: { assessmentId: 3, axes: [{ i: 0, s: 0.9 }] } },
    ]);
    (rows[1].payload as any).axes[0].s = 0.99; // tamper
    const v = verifyChain(rows);
    expect(v.valid).toBe(false);
    expect(v.badId).toBe(2);
  });

  it("deleting an entry breaks the chain at the next link", () => {
    const rows = buildChain([
      { kind: "score", payload: { a: 1 } },
      { kind: "score", payload: { a: 2 } },
      { kind: "score", payload: { a: 3 } },
    ]);
    const withDeletion = [rows[0], rows[2]];
    const v = verifyChain(withDeletion);
    expect(v.valid).toBe(false);
    expect(v.badId).toBe(3);
  });

  it("reordering entries breaks verification", () => {
    const rows = buildChain([
      { kind: "score", payload: { a: 1 } },
      { kind: "score", payload: { a: 2 } },
    ]);
    expect(verifyChain([rows[1], rows[0]]).valid).toBe(false);
  });
});

// ── Calibration bus ─────────────────────────────────────────────────────────

const mk = (v: number): AxisScore[] => [
  { axisIndex: 0, axisName: "Logical", score: v, confidence: 0.8 },
  { axisIndex: 1, axisName: "Verbal", score: v, confidence: 0.8 },
];

describe("calibration-weighted consensus bus", () => {
  it("cold start: below MIN_SAMPLES every model gets equal weight 1.0", () => {
    expect(calibrationWeight(undefined)).toBe(1.0);
    expect(calibrationWeight({ model: "m", axisIndex: 0, n: MIN_SAMPLES - 1, sumAbsErr: 0.01 })).toBe(1.0);
  });

  it("with history, lower mean error earns higher weight", () => {
    const sharp = calibrationWeight({ model: "a", axisIndex: 0, n: 20, sumAbsErr: 0.4 });   // mean .02
    const scattered = calibrationWeight({ model: "b", axisIndex: 0, n: 20, sumAbsErr: 4 }); // mean .20
    expect(sharp).toBeGreaterThan(scattered);
  });

  it("equal weights reproduce the classic trimmed-mean consensus exactly", () => {
    const perModel = [
      { model: "a", scores: mk(0.8) }, { model: "b", scores: mk(0.6) },
      { model: "c", scores: mk(0.7) }, { model: "d", scores: mk(0.9) },
    ];
    const classic = consensusScores(perModel.map((m) => m.scores));
    const bus = calibratedConsensus(perModel, equalWeights);
    classic.forEach((c, i) => {
      expect(bus[i].score).toBeCloseTo(c.score, 10);
      expect(bus[i].confidence).toBeCloseTo(c.confidence, 10);
    });
  });

  it("outlier trim still applies underneath the weights", () => {
    // Four models; the outlier (0.1) must be trimmed even when heavily weighted.
    const entries = [
      { value: 0.1, weight: 100 }, { value: 0.7, weight: 1 },
      { value: 0.72, weight: 1 }, { value: 0.9, weight: 1 },
    ];
    const v = weightedTrimmedMean(entries);
    expect(v).toBeGreaterThan(0.6);
    expect(v).toBeLessThan(0.8);
  });

  it("weights shift the surviving pool toward the better-calibrated model", () => {
    const perModel = [
      { model: "sharp", scores: mk(0.8) }, { model: "mid", scores: mk(0.6) },
      { model: "low", scores: mk(0.5) }, { model: "high", scores: mk(0.95) },
    ];
    const weights = (model: string) => (model === "sharp" ? 10 : 1);
    const out = calibratedConsensus(perModel, weights);
    const flat = calibratedConsensus(perModel, equalWeights);
    expect(out[0].score).toBeGreaterThan(flat[0].score); // pulled toward 0.8
  });

  it("observations measure each model's distance from the settled consensus", () => {
    const perModel = [{ model: "a", scores: mk(0.8) }, { model: "b", scores: mk(0.6) }];
    const consensus = calibratedConsensus(perModel, equalWeights);
    const obs = calibrationObservations(perModel, consensus);
    expect(obs).toHaveLength(4); // 2 models × 2 axes
    for (const o of obs) expect(o.absErr).toBeCloseTo(0.1, 10);
  });
});

// ── Compute fabric ──────────────────────────────────────────────────────────

describe("compute fabric", () => {
  it("preserves input order and runs every item", async () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const out = await softwareFabric.runParallel(items, async (n) => n * 2, { concurrency: 4 });
    expect(out).toEqual(items.map((n) => n * 2));
  });

  it("respects the concurrency bound", async () => {
    let inFlight = 0, peak = 0;
    await softwareFabric.runParallel(Array.from({ length: 12 }, (_, i) => i), async () => {
      inFlight++; peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
    }, { concurrency: 3 });
    expect(peak).toBeLessThanOrEqual(3);
  });
});

// ── Dimension isolation ─────────────────────────────────────────────────────

describe("per-dimension isolation", () => {
  const full = { axes: { 0: { notes: "logical only" }, 1: { notes: "verbal only" } } as Record<number, { notes: string }> };
  const axes = [{ axisIndex: 0, axisName: "Logical" }, { axisIndex: 1, axisName: "Verbal" }];

  it("each view carries only its own dimension's slice, frozen", async () => {
    const views = isolateDimensions(full, axes, (f, i) => f.axes[i]);
    expect(views[0].data.notes).toBe("logical only");
    expect((views[0].data as any).axes).toBeUndefined(); // no full-profile leak
    expect(Object.isFrozen(views[0])).toBe(true);
    expect(Object.isFrozen(views[0].data)).toBe(true);
    expect(() => { (views[0].data as any).notes = "tampered"; }).toThrow();
  });

  it("workers run per-view through the fabric and never see siblings", async () => {
    const views = isolateDimensions(full, axes, (f, i) => f.axes[i]);
    const seen = await forEachIsolatedDimension(views, async (v) => `${v.axisIndex}:${v.data.notes}`);
    expect(seen).toEqual(["0:logical only", "1:verbal only"]);
  });
});
