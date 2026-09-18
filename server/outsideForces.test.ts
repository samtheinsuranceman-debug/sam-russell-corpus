import { describe, expect, it } from "vitest";
import { FORCES, HORIZONS, annualised, readForce, readSeries, weightedSources, _clearOutsideMemoForTests } from "./outsideForces";
import type { Observation } from "./_core/fred";

/** Series ids the platform has seen answer on FRED, or that are FRED's own published ids for these releases. */
const KNOWN = new Set(["CPIAUCSL", "CPILFESL", "T10YIE", "M2SL", "WALCL", "GFDEBTN", "CSUSHPINSA", "RHORUSQ156N", "MSPUS", "MEHOINUSA672N", "MORTGAGE30US", "FEDFUNDS", "DRTSCILM", "TOTLL", "NFCI", "BAMLH0A0HYM2", "GFDEGDQ188S", "FDHBFIN", "T10Y2Y", "TOTALSA", "ALTSALES", "CUSR0000SETA01", "CUSR0000SETA02", "TRFVOLUSM227NFWA", "CUSR0000SETG01"]);

function monthly(from: number, years: number, start: number, growth: number): Observation[] {
  const out: Observation[] = [];
  let v = start;
  for (let y = from; y < from + years; y++) for (let m = 1; m <= 12; m++) { out.push({ date: `${y}-${String(m).padStart(2, "0")}-01`, value: v }); v *= Math.pow(1 + growth, 1 / 12); }
  return out;
}

describe("outside forces — the registry", () => {
  it("has seven forces, each with a twelve-voice weighted panel and a caveat", () => {
    expect(FORCES.map((f) => f.id)).toEqual(["prices", "fiat", "home", "credit", "debt", "cars", "travel"]);
    for (const f of FORCES) {
      expect(f.sources.length, f.id).toBe(12);
      expect(f.caveat.length, f.id).toBeGreaterThan(60);
      const ids = f.sources.map((s) => s.id);
      expect(new Set(ids).size, `${f.id} repeats a source`).toBe(ids.length);
      for (const s of f.sources) {
        expect(s.url, s.id).toMatch(/^https:\/\//);
        expect(s.defaults.evidence).toBeGreaterThan(0); expect(s.defaults.evidence).toBeLessThanOrEqual(1);
        expect(s.publishes.length).toBeGreaterThan(10); expect(s.method.length).toBeGreaterThan(5);
      }
      const w = weightedSources(f);
      for (const s of w) { expect(s.weight).toBeGreaterThan(0); expect(s.weight).toBeLessThanOrEqual(1); }
      expect(Math.max(...w.map((s) => s.weight))).toBeGreaterThan(Math.min(...w.map((s) => s.weight))); // the panel is weighted, not flat
    }
  });

  it("only reads series the platform can name, and marks the one unconfirmed feed as a candidate", () => {
    for (const f of FORCES) for (const s of f.series) {
      if (s.candidate) continue;
      expect(KNOWN.has(s.id), `${f.id}: ${s.id} is not a series the platform has confirmed`).toBe(true);
    }
    const candidates = FORCES.flatMap((f) => f.series.filter((s) => s.candidate).map((s) => s.id));
    expect(candidates).toEqual(["AIRRPMTSI"]);
  });

  it("never lets a number in by hand: every series names its publisher and unit", () => {
    for (const f of FORCES) for (const s of f.series) { expect(s.publisher).toMatch(/via FRED/); expect(s.unit.length).toBeGreaterThan(0); }
  });
});

describe("outside forces — the arithmetic", () => {
  it("annualises growth and reports point changes for rates", () => {
    expect(annualised(100, 200, 10)).toBeCloseTo(0.0718, 4);
    const obs = monthly(1984, 42, 100, 0.03); // 3% a year, Jan 1984 .. Dec 2025
    const g = readSeries({ id: "X", label: "x", unit: "index", kind: "growth", publisher: "test via FRED" }, obs);
    for (const h of HORIZONS) expect(g.change[h], `${h}y`).toBeCloseTo(0.03, 3);
    expect(g.latest?.date).toBe("2025-12-01");
    expect(g.annual.length).toBe(41); // the 40-year line plus the current year
    const rate: Observation[] = [{ date: "2015-06-01", value: 0.25 }, { date: "2020-06-01", value: 0.05 }, { date: "2025-06-01", value: 4.33 }];
    const p = readSeries({ id: "R", label: "r", unit: "%", kind: "points", publisher: "test via FRED" }, rate);
    expect(p.change[5]).toBeCloseTo(4.28, 6);
    expect(p.change[10]).toBeCloseTo(4.08, 6);
    expect(p.change[1]).toBeUndefined();
  });

  it("falls to a quarterly or annual observation in the right year when the month is missing", () => {
    const q: Observation[] = [];
    for (let y = 2000; y <= 2025; y++) for (const m of ["01", "04", "07", "10"]) q.push({ date: `${y}-${m}-01`, value: 60 + (y - 2000) * 0.2 });
    const r = readSeries({ id: "Q", label: "q", unit: "%", kind: "points", publisher: "test via FRED" }, q);
    expect(r.change[10]).toBeCloseTo(2, 6);
  });

  it("reads a force with an injected feed and reports unavailable, never a guess, when a series is silent", async () => {
    _clearOutsideMemoForTests();
    const force = FORCES.find((f) => f.id === "cars")!;
    const feed = async (id: string) => (id === "TOTALSA" ? monthly(1984, 42, 12, 0.01) : []);
    const r = await readForce(force, feed);
    const total = r.series.find((s) => s.id === "TOTALSA")!;
    expect(total.source).toBe("live");
    expect(total.change[40]).toBeCloseTo(0.01, 3);
    for (const s of r.series.filter((s) => s.id !== "TOTALSA")) { expect(s.source).toBe("unavailable"); expect(s.latest).toBeNull(); expect(Object.keys(s.change)).toHaveLength(0); }
    expect(r.sources).toHaveLength(12);
  });
});
