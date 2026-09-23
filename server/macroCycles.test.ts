/**
 * Bull and bear market dating (shared/macro/cycles.ts).
 *
 * EVERY PRICE SERIES IN THIS FILE IS A SYNTHETIC TEST FIXTURE: piecewise-linear
 * paths between hand-chosen anchor values, built so the correct dates are known
 * in advance. None of them is market data and none should be read as such.
 * The only real data exercised here is the NBER reference table itself.
 */
import { describe, expect, it } from "vitest";
import {
  dateBullBear,
  phaseAt,
  directionAt,
  compareRules,
  compareChronologies,
  nberOverlap,
  nberRecessions,
  monthsBetween,
  NBER_CHRONOLOGY,
  NBER_SOURCE,
  A,
  assumption,
  type MonthlyPoint,
  type BearMarket,
  type BullBearChronology,
} from "@shared/macro";

/** SYNTHETIC: month i of the fixture is 2000-01 + i (month-end dates). */
const month = (i: number) => new Date(Date.UTC(2000, i + 1, 0)).toISOString().slice(0, 10);
const key = (i: number) => month(i).slice(0, 7);

/** SYNTHETIC: linear interpolation between [monthIndex, value] anchors. */
function syntheticPath(anchors: Array<[number, number]>): MonthlyPoint[] {
  const out: MonthlyPoint[] = [];
  for (let s = 0; s + 1 < anchors.length; s++) {
    const [i0, v0] = anchors[s];
    const [i1, v1] = anchors[s + 1];
    for (let i = i0; i < i1; i++) out.push({ asOf: month(i), value: v0 + ((v1 - v0) * (i - i0)) / (i1 - i0) });
  }
  const [iLast, vLast] = anchors[anchors.length - 1];
  out.push({ asOf: month(iLast), value: vLast });
  return out;
}

const both = ["twenty-percent", "pagan-sossounov"] as const;

describe("rules table", () => {
  it("carries every cycle threshold with a Pagan & Sossounov (2003) citation", () => {
    expect(A("cycles.twenty.bearDecline")).toBe(0.2);
    expect(A("cycles.twenty.bullRise")).toBe(0.2);
    expect(A("cycles.ps.minPhase")).toBe(4);
    expect(A("cycles.ps.minCycle")).toBe(16);
    expect(A("cycles.ps.phaseOverride")).toBe(0.2);
    for (const id of ["cycles.twenty.bearDecline", "cycles.twenty.bullRise", "cycles.ps.window", "cycles.ps.endCensor", "cycles.ps.minPhase", "cycles.ps.minCycle", "cycles.ps.phaseOverride", "cycles.phase.earlyShare"]) {
      const row = assumption(id);
      expect(row.source, id).toMatch(/Pagan & Sossounov \(2003\).*J\. Applied Econometrics 18\(1\)/);
      expect(row.asOf, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.basis.length, id).toBeGreaterThan(20);
    }
  });
});

describe("dateBullBear: a synthetic 25 % bear", () => {
  // SYNTHETIC: 100 → 150 at month 30 (peak) → 112.5 at month 42 (−25 %) → 200 at month 80.
  const pts = syntheticPath([[0, 100], [30, 150], [42, 112.5], [80, 200]]);

  for (const rule of both) {
    it(`is dated peak month 30, trough month 42 under ${rule}`, () => {
      const c = dateBullBear(pts, rule);
      expect(c.bears).toHaveLength(1);
      const b = c.bears[0];
      expect(b.peak).toBe(key(30));
      expect(b.trough).toBe(key(42));
      expect(b.depth).toBeCloseTo(-0.25, 10);
      expect(b.months).toBe(12);
      // Linear climb 112.5 → 200 over 38 months first reaches 150 at month 59.
      expect(b.recoveryMonths).toBe(17);
      expect(b.recoveredMonth).toBe(key(59));
      expect(c.firstMonth).toBe(key(0));
      expect(c.lastMonth).toBe(key(80));
    });
  }

  it("reports the unconfirmed final high as pending under the twenty-percent rule, never as a turn", () => {
    const c = dateBullBear(pts, "twenty-percent");
    expect(c.turns.map(t => t.kind)).toEqual(["trough", "peak", "trough"]);
    expect(c.turns[0].month).toBe(key(0)); // the start is the low before a 20 % rise
    expect(c.pending).toMatchObject({ kind: "peak", month: key(80), value: 200 });
    expect(dateBullBear(pts, "pagan-sossounov").pending).toBeNull();
  });

  it("leaves an unrecovered bear with recoveryMonths null", () => {
    const c = dateBullBear(syntheticPath([[0, 100], [30, 150], [42, 112.5], [80, 140]]), "twenty-percent");
    expect(c.bears[0].recoveryMonths).toBeNull();
    expect(c.bears[0].recoveredMonth).toBeNull();
  });

  it("reduces daily input to month-ends and refuses a gapped grid", () => {
    const daily = pts.flatMap(p => [{ asOf: `${p.asOf.slice(0, 8)}01`, value: p.value * 0.5 }, p]);
    expect(dateBullBear(daily, "pagan-sossounov").bears[0].peak).toBe(key(30));
    const gapped = pts.filter((_, i) => i !== 50);
    expect(() => dateBullBear(gapped, "twenty-percent")).toThrow(/gap/);
  });
});

describe("a 15 % dip is not a bear", () => {
  // SYNTHETIC: 100 → 150 at month 30 → 127.5 at month 33 (−15 % in 3 months) → 220 at month 80.
  const pts = syntheticPath([[0, 100], [30, 150], [33, 127.5], [45, 170], [80, 220]]);
  for (const rule of both) {
    it(`under ${rule}`, () => {
      expect(dateBullBear(pts, rule).bears).toHaveLength(0);
    });
  }
});

describe("Pagan–Sossounov censoring", () => {
  it("drops a phase shorter than 4 months when the move is under 20 %", () => {
    // Covered by the 15 % dip above; here the same shape at 19 % is still dropped.
    const pts = syntheticPath([[0, 100], [30, 150], [33, 121.5], [45, 170], [80, 220]]);
    expect(dateBullBear(pts, "pagan-sossounov").bears).toHaveLength(0);
  });

  it("keeps a phase shorter than 4 months when the move is at least 20 % (the override)", () => {
    // SYNTHETIC: −30 % in two months.
    const pts = syntheticPath([[0, 100], [30, 150], [32, 105], [60, 200]]);
    for (const rule of both) {
      const c = dateBullBear(pts, rule);
      expect(c.bears, rule).toHaveLength(1);
      expect(c.bears[0].peak).toBe(key(30));
      expect(c.bears[0].trough).toBe(key(32));
      expect(c.bears[0].months).toBe(2);
    }
  });

  it("merges two bears whose peaks are under 16 months apart into one, keeping the lower trough", () => {
    // SYNTHETIC: peaks at 30 and 40 (10 months apart), troughs at 36 and 46.
    const pts = syntheticPath([[0, 100], [30, 150], [36, 110], [40, 140], [46, 100], [90, 250]]);
    const ps = dateBullBear(pts, "pagan-sossounov");
    expect(ps.bears).toHaveLength(1);
    expect(ps.bears[0]).toMatchObject({ peak: key(30), trough: key(46), months: 16 });
    expect(ps.bears[0].depth).toBeCloseTo(100 / 150 - 1, 10);
    // Every remaining cycle respects the minimum.
    for (let k = 0; k + 2 < ps.turns.length; k++) expect(monthsBetween(ps.turns[k].month, ps.turns[k + 2].month)).toBeGreaterThanOrEqual(A("cycles.ps.minCycle"));

    const tw = dateBullBear(pts, "twenty-percent");
    expect(tw.bears.map(b => [b.peak, b.trough])).toEqual([[key(30), key(36)], [key(40), key(46)]]);
  });

  it("drops a turn within 6 months of the start of the series", () => {
    // SYNTHETIC: peak at month 3, −33 % to month 15.
    const pts = syntheticPath([[0, 140], [3, 150], [15, 100], [60, 200]]);
    expect(dateBullBear(pts, "pagan-sossounov").bears).toHaveLength(0);
    expect(dateBullBear(pts, "twenty-percent").bears.map(b => b.peak)).toEqual([key(3)]);
  });

  it("turns always alternate peak, trough, peak", () => {
    const pts = syntheticPath([[0, 100], [20, 150], [30, 110], [34, 118], [38, 108], [60, 180], [70, 130], [110, 260]]);
    for (const rule of both) {
      const t = dateBullBear(pts, rule).turns;
      for (let k = 1; k < t.length; k++) expect(t[k].kind, rule).not.toBe(t[k - 1].kind);
    }
  });
});

describe("compareRules", () => {
  it("returns nothing when the rules agree", () => {
    expect(compareRules(syntheticPath([[0, 100], [30, 150], [42, 112.5], [80, 200]]))).toEqual([]);
  });

  it("records a split without choosing", () => {
    const d = compareRules(syntheticPath([[0, 100], [30, 150], [36, 110], [40, 140], [46, 100], [90, 250]]));
    expect(d).toHaveLength(1);
    expect(d[0].kind).toBe("split");
    expect(d[0].twentyPercent).toHaveLength(2);
    expect(d[0].paganSossounov).toHaveLength(1);
  });

  it("records a slow 15 % decline found only by Pagan–Sossounov", () => {
    // SYNTHETIC: −15 % over 12 months, full cycles longer than 16 months.
    const d = compareRules(syntheticPath([[0, 100], [30, 150], [42, 127.5], [80, 220]]));
    expect(d.map(x => x.kind)).toEqual(["only-pagan-sossounov"]);
    expect(d[0].paganSossounov[0]).toMatchObject({ peak: key(30), trough: key(42) });
  });

  it("records a bear found only by the twenty-percent rule (end-censored under Pagan–Sossounov)", () => {
    const d = compareRules(syntheticPath([[0, 140], [3, 150], [15, 100], [60, 200]]));
    expect(d.map(x => x.kind)).toEqual(["only-twenty-percent"]);
  });

  it("records peak- and trough-date disagreements with the months apart", () => {
    // SYNTHETIC chronologies built by hand (date disagreements need real-data texture to arise from one series).
    const bear = (peak: string, trough: string): BearMarket => ({ peak, trough, peakValue: 150, troughValue: 100, depth: -1 / 3, months: monthsBetween(peak, trough), recoveryMonths: null, recoveredMonth: null });
    const shell = (rule: "twenty-percent" | "pagan-sossounov", bears: BearMarket[]): BullBearChronology => ({ rule, firstMonth: "2000-01", lastMonth: "2010-12", turns: [], bears, bulls: [], pending: null });
    const d = compareChronologies(shell("twenty-percent", [bear("2002-03", "2003-01")]), shell("pagan-sossounov", [bear("2002-05", "2002-12")]));
    expect(d.map(x => [x.kind, x.monthsApart])).toEqual([["peak-date", 2], ["trough-date", -1]]);
  });
});

describe("phaseAt", () => {
  // SYNTHETIC: trough 0 (edge) · peak 20 · trough 30 · peak 60 · trough 70 · rising to 110.
  const pts = syntheticPath([[0, 100], [20, 150], [30, 110], [60, 180], [70, 130], [110, 260]]);
  const c = dateBullBear(pts, "pagan-sossounov");

  it("dates the fixture as expected", () => {
    expect(c.turns.map(t => [t.kind, t.month])).toEqual([["peak", key(20)], ["trough", key(30)], ["peak", key(60)], ["trough", key(70)]]);
  });

  it("splits each phase at its midpoint, the turn month closing the phase", () => {
    // Bear 20 → 30 (L = 10): months 21–25 early, 26–30 late.
    expect(phaseAt(c, month(21))).toBe("early-bear");
    expect(phaseAt(c, month(25))).toBe("early-bear");
    expect(phaseAt(c, month(26))).toBe("late-bear");
    expect(phaseAt(c, month(30))).toBe("late-bear"); // trough month
    // Bull 30 → 60 (L = 30): months 31–45 early, 46–60 late.
    expect(phaseAt(c, month(31))).toBe("early-bull");
    expect(phaseAt(c, month(45))).toBe("early-bull");
    expect(phaseAt(c, month(46))).toBe("late-bull");
    expect(phaseAt(c, month(60))).toBe("late-bull"); // peak month
    expect(phaseAt(c, month(61))).toBe("early-bear");
    // Accepts a bare month key and any day in the month.
    expect(phaseAt(c, key(61))).toBe("early-bear");
    expect(phaseAt(c, `${key(66)}-01`)).toBe("late-bear");
  });

  it("returns null where the phase is open (length unknown)", () => {
    expect(phaseAt(c, month(20))).toBeNull(); // on the first turn: the bull before it has no dated start
    expect(phaseAt(c, month(5))).toBeNull();
    expect(phaseAt(c, month(71))).toBeNull(); // after the last turn
  });

  it("directionAt answers bull or bear in the open tail", () => {
    expect(directionAt(c, month(71))).toBe("bull");
    expect(directionAt(c, month(25))).toBe("bear");
    expect(directionAt(c, month(5))).toBeNull();
    expect(directionAt(c, month(200))).toBeNull();
  });
});

describe("NBER_CHRONOLOGY", () => {
  it("is ordered, alternates peak and trough, and runs Dec 1854 trough to Apr 2020 trough", () => {
    expect(NBER_CHRONOLOGY[0]).toMatchObject({ kind: "trough", month: "1854-12" });
    expect(NBER_CHRONOLOGY[NBER_CHRONOLOGY.length - 1]).toMatchObject({ kind: "trough", month: "2020-04" });
    for (let k = 1; k < NBER_CHRONOLOGY.length; k++) {
      expect(monthsBetween(NBER_CHRONOLOGY[k - 1].month, NBER_CHRONOLOGY[k].month), NBER_CHRONOLOGY[k].month).toBeGreaterThan(0);
      expect(NBER_CHRONOLOGY[k].kind, NBER_CHRONOLOGY[k].month).not.toBe(NBER_CHRONOLOGY[k - 1].kind);
    }
    expect(nberRecessions()).toHaveLength(34);
  });

  it("carries source and asOf on every row", () => {
    for (const r of NBER_CHRONOLOGY) {
      expect(r.source).toBe(NBER_SOURCE);
      expect(r.source).toContain("nber.org/research/data/us-business-cycle-expansions-and-contractions");
      expect(r.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    }
  });
});

describe("nberOverlap", () => {
  it("counts overlapping months on the (peak, trough] convention", () => {
    // SYNTHETIC bear intervals, chosen only to straddle or miss NBER contractions.
    const [a, b, c] = nberOverlap([
      { peak: "1990-01", trough: "1990-10" }, // NBER 1990-07 → 1991-03: Aug, Sep, Oct 1990
      { peak: "1987-08", trough: "1987-11" }, // no contraction
      { peak: "1980-01", trough: "1982-11" }, // spans two contractions
    ]);
    expect(a.recessions).toEqual([{ peak: "1990-07", trough: "1991-03", overlapMonths: 3 }]);
    expect(a.leadMonths).toBe(6);
    expect(b.recessions).toEqual([]);
    expect(b.overlapMonths).toBe(0);
    expect(b.leadMonths).toBeNull();
    expect(c.recessions.map(r => r.peak)).toEqual(["1980-01", "1981-07"]);
    expect(c.overlapMonths).toBe(6 + 16);
    expect(c.leadMonths).toBe(0);
  });

  it("works directly on a chronology's bears", () => {
    const ch = dateBullBear(syntheticPath([[0, 100], [30, 150], [42, 112.5], [80, 200]]), "twenty-percent");
    const o = nberOverlap(ch.bears);
    expect(o).toHaveLength(1);
    expect(o[0].peak).toBe(key(30));
  });
});
