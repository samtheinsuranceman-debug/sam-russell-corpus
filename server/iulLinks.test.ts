import { describe, expect, it } from "vitest";
import { ACCOUNT_VALUE_CREDITING, LIQUIDITY_CONTRAST, decemberOverDecember, pairYears, pearson, splitByMedian, taxEquivalentYield } from "@shared/iulLinks";

describe("tax-equivalent yield", () => {
  it("is the credited rate divided by one minus the combined rate, and never divides by zero", () => {
    expect(taxEquivalentYield(0.08, 0.35)).toBeCloseTo(0.08 / 0.65, 10);
    expect(taxEquivalentYield(0.08, 0.35, 0.05, 0.038)).toBeCloseTo(0.08 / (1 - 0.438), 10);
    expect(taxEquivalentYield(0.08, 0)).toBe(0.08);
    expect(Number.isFinite(taxEquivalentYield(0.08, 1))).toBe(true);
  });
});

describe("the record beside the credited rate", () => {
  const obs = (levels: Array<[number, number]>) => levels.flatMap(([y, dec]) => [{ date: `${y}-06-01`, value: dec - 1 }, { date: `${y}-12-01`, value: dec }]);
  it("folds monthly levels to December-over-December changes", () => {
    const yoy = decemberOverDecember(obs([[1993, 100], [1994, 102], [1995, 104.04]]));
    expect(yoy[1993]).toBeUndefined();
    expect(yoy[1994]).toBeCloseTo(0.02, 10);
    expect(yoy[1995]).toBeCloseTo(0.02, 10);
  });
  it("pairs each credited year with the CPI and M2 change for that year, null when absent", () => {
    const pairs = pairYears([{ year: 1994, creditedRate: 5 }, { year: 1995, creditedRate: 10 }], { 1994: 0.02 }, {});
    expect(pairs).toEqual([{ year: 1994, credited: 0.05, cpi: 0.02, m2: null }, { year: 1995, credited: 0.1, cpi: null, m2: null }]);
  });
  it("correlation needs eight years and is exact on a straight line; the median split reports both halves", () => {
    expect(pearson([1, 2, 3], [1, 2, 3])).toBeNull();
    const xs = Array.from({ length: 10 }, (_, i) => i), ys = xs.map((x) => 2 * x + 1);
    expect(pearson(xs, ys)).toBeCloseTo(1, 10);
    expect(pearson(xs, ys.map((y) => -y))).toBeCloseTo(-1, 10);
    expect(pearson(xs, xs.map(() => 3))).toBeNull();
    const pairs = xs.map((x, i) => ({ year: 1994 + i, credited: i < 5 ? 0.04 : 0.09, cpi: x / 100, m2: null }));
    const s = splitByMedian(pairs, "cpi")!;
    expect(s.median).toBeCloseTo(0.045, 10);
    expect(s.high).toMatchObject({ n: 5, meanCredited: 0.09 });
    expect(s.low).toMatchObject({ n: 5, meanCredited: 0.04 });
    expect(s.correlation!).toBeGreaterThan(0.8);
    expect(splitByMedian(pairs, "m2")).toBeNull();
    expect(splitByMedian(pairs.slice(0, 5), "cpi")).toBeNull();
  });
});

describe("the text", () => {
  it("cites a statute only where a statute governs, and names the loan types without a high-water-mark claim", () => {
    for (const r of LIQUIDITY_CONTRAST) if (r.authority) expect(r.authority.url).toMatch(/law\.cornell\.edu\/uscode\/text\/26\/72/);
    expect(LIQUIDITY_CONTRAST.filter((r) => r.authority == null).length).toBe(3);
    expect(ACCOUNT_VALUE_CREDITING.lines.join(" ")).toMatch(/non-direct-recognition/);
    expect(ACCOUNT_VALUE_CREDITING.lines.join(" ")).not.toMatch(/high.water/i);
  });
});
