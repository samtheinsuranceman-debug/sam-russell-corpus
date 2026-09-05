import { describe, it, expect } from "vitest";
import { effectivePotential } from "@shared/effectivePotential";

describe("effective performance potential — the Liebig-weighted number", () => {
  it("returns zeros for empty input", () => {
    expect(effectivePotential([])).toEqual({
      effective: 0,
      mean: 0,
      bottleneck: 0,
      drag: 0,
    });
  });

  it("ignores unscored (zero) lines", () => {
    const a = effectivePotential([0, 0, 0.8, 0.8]);
    const b = effectivePotential([0.8, 0.8]);
    expect(a.effective).toBeCloseTo(b.effective, 10);
    expect(a.mean).toBeCloseTo(0.8, 10);
  });

  it("sits below the mean when a weakness exists (bottleneck drags it down)", () => {
    // strong across the board except three crippling lines
    const scores = [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.2, 0.2, 0.2];
    const r = effectivePotential(scores);
    expect(r.effective).toBeLessThan(r.mean);
    expect(r.bottleneck).toBeCloseTo(0.2, 10);
    expect(r.drag).toBeGreaterThan(0);
  });

  it("equals the mean when every line is identical (no bottleneck, no drag)", () => {
    const r = effectivePotential([0.7, 0.7, 0.7, 0.7]);
    expect(r.effective).toBeCloseTo(0.7, 10);
    expect(r.mean).toBeCloseTo(0.7, 10);
    expect(r.bottleneck).toBeCloseTo(0.7, 10);
    expect(r.drag).toBeCloseTo(0, 10);
  });

  it("never reports negative drag", () => {
    const r = effectivePotential([0.1, 0.1, 0.1, 0.95, 0.95]);
    expect(r.drag).toBeGreaterThanOrEqual(0);
  });

  it("clamps bottleneckK to the number of scored lines", () => {
    // only two lines but K defaults to 3 — bottleneck must be their mean, not crash
    const r = effectivePotential([0.4, 0.6]);
    expect(r.bottleneck).toBeCloseTo(0.5, 10);
    expect(Number.isFinite(r.effective)).toBe(true);
  });

  it("a larger alpha punishes the bottleneck harder", () => {
    const scores = [0.9, 0.9, 0.9, 0.2, 0.2, 0.2];
    const soft = effectivePotential(scores, { alpha: 0.3 });
    const hard = effectivePotential(scores, { alpha: 0.8 });
    expect(hard.effective).toBeLessThan(soft.effective);
  });

  it("keeps every field within [0,1]", () => {
    for (const s of [[0.5], [0.1, 0.9], [0.3, 0.3, 0.3, 0.99, 0.01]]) {
      const r = effectivePotential(s);
      for (const v of [r.effective, r.mean, r.bottleneck]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
