/**
 * Every calculator is a pure CalcDef. Each one must compute from its own
 * defaults, from the bottom of every field's range, and from the top, without
 * throwing and without emitting a non-finite number where a number is due.
 * The deeper 10,000-run fuzz lives in test/chaos; this is the floor.
 */
import { describe, expect, it } from "vitest";
import { ALL_CALCS, calcById, calcsByCategory, type CalcDef, type CalcValues } from "@shared/finance/calc";
import { STRATEGIES, strategyBySlug } from "@shared/finance/strategies";

function values(def: CalcDef, pick: (f: CalcDef["fields"][number]) => number | string | boolean): CalcValues {
  const out: CalcValues = {};
  for (const f of def.fields) out[f.key] = pick(f);
  return out;
}

function assertFinite(def: CalcDef, v: CalcValues, label: string) {
  const r = def.compute(v);
  expect(Array.isArray(r.outputs), `${def.id} ${label}: outputs`).toBe(true);
  expect(r.outputs.length, `${def.id} ${label}: at least one output`).toBeGreaterThan(0);
  for (const o of r.outputs) {
    expect(typeof o.value, `${def.id} ${label}: ${o.label}`).toBe("string");
    expect(o.value, `${def.id} ${label}: ${o.label}`).not.toMatch(/NaN|Infinity|undefined|null/);
  }
  for (const row of r.chart?.data ?? []) {
    for (const [k, n] of Object.entries(row)) expect(Number.isFinite(n), `${def.id} ${label}: chart ${k}`).toBe(true);
  }
  for (const row of r.table?.rows ?? []) {
    for (const [k, n] of Object.entries(row)) {
      if (typeof n === "number") expect(Number.isFinite(n), `${def.id} ${label}: table ${k}`).toBe(true);
    }
  }
}

describe("finance calculators", () => {
  it("has a unique id and a category for every one of them", () => {
    const ids = new Set(ALL_CALCS.map(c => c.id));
    expect(ids.size).toBe(ALL_CALCS.length);
    expect(ALL_CALCS.length).toBeGreaterThanOrEqual(50);
    expect(calcsByCategory().reduce((n, g) => n + g.calcs.length, 0)).toBe(ALL_CALCS.length);
    for (const c of ALL_CALCS) expect(calcById(c.id)).toBe(c);
    expect(calcById("does-not-exist")).toBeUndefined();
  });

  for (const def of ALL_CALCS) {
    it(`${def.id} computes from defaults, minimums and maximums`, () => {
      assertFinite(def, values(def, f => f.default), "defaults");
      assertFinite(def, values(def, f => (f.type === "toggle" ? false : f.type === "select" ? (f.options?.[0]?.value ?? f.default) : (f.min ?? 0))), "minimums");
      assertFinite(def, values(def, f => (f.type === "toggle" ? true : f.type === "select" ? (f.options?.[f.options.length - 1]?.value ?? f.default) : (f.max ?? (typeof f.default === "number" ? f.default * 10 : f.default)))), "maximums");
    });
  }

  it("has a slug for every strategy and resolves them", () => {
    const slugs = new Set(STRATEGIES.map(s => s.slug));
    expect(slugs.size).toBe(STRATEGIES.length);
    for (const s of STRATEGIES) expect(strategyBySlug(s.slug)).toBe(s);
    expect(strategyBySlug("nope")).toBeUndefined();
  });
});
