/**
 * The combination engine: states, mining with stability, predicted unseen
 * combinations, active and forming matches. Offline, synthetic history.
 */
import { describe, expect, it } from "vitest";
import { toStates, mineCombinations, alignMonthly, predictUnseen, comboKey, A, MACRO_ASSUMPTIONS, type Series, type MinedCombination } from "@shared/macro";

const N = 360;
const month = (i: number) => new Date(Date.UTC(1990, i + 1, 0)).toISOString().slice(0, 10);
// Deterministic pseudo-noise.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;

function synthetic(): Series[] {
  seed = 7;
  // Three drivers whose jumps are independent; the target jumps two months after A and B jump together.
  const a: number[] = [], b: number[] = [], c: number[] = [], d: number[] = [], y: number[] = [];
  let va = 0, vb = 0, vc = 0, vd = 0, vy = 0;
  const jumpA: boolean[] = [], jumpB: boolean[] = [];
  for (let i = 0; i < N; i++) {
    jumpA.push(i % 5 === 0 || i % 7 === 0);
    jumpB.push(i % 3 === 0);
    va += (jumpA[i] ? 3 : 0) + rnd() * 0.5;
    vb += (jumpB[i] ? 3 : 0) + rnd() * 0.5;
    vc += (i % 11 === 0 ? 3 : 0) + rnd() * 0.5;
    vd += rnd();
    const trigger = i >= 2 && jumpA[i - 2] && jumpB[i - 2];
    vy += (trigger ? 4 : 0) + rnd() * 0.5;
    a.push(va); b.push(vb); c.push(vc); d.push(vd); y.push(vy);
  }
  const s = (id: string, xs: number[]): Series => ({ indicatorId: id, points: xs.map((v, i) => ({ asOf: month(i), value: v })) });
  return [s("A", a), s("B", b), s("C", c), s("D", d), s("Y", y)];
}

describe("states", () => {
  it("turns small moves into symbols by their own z-score and refuses short series", () => {
    const st = toStates([0, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 5]);
    expect(st[0]).toBeNull();
    expect(st[4]).toBe("up");
    expect(st[13]).toBe("down");
    expect(toStates([1, 2, 3])).toEqual([null, null, null]);
  });
});

describe("mining", () => {
  it("finds the pair that precedes the event, stable in both halves, and ignores the noise series", () => {
    const r = mineCombinations(synthetic(), "Y", { targetState: "up", horizonMonths: 3 });
    expect(r.months).toBeGreaterThan(300);
    expect(r.baseRate).toBeGreaterThan(0);
    const keys = r.mined.map(m => comboKey(m.atoms));
    expect(keys.some(k => k.includes("A:up") && k.includes("B:up"))).toBe(true);
    const ab = r.mined.find(m => m.atoms.length === 2 && comboKey(m.atoms) === "A:up ∧ B:up")!;
    expect(ab.lift).toBeGreaterThanOrEqual(A("combo.minLift"));
    expect(ab.liftFirstHalf).toBeGreaterThanOrEqual(1);
    expect(ab.liftSecondHalf).toBeGreaterThanOrEqual(1);
    expect(ab.support).toBeGreaterThanOrEqual(A("combo.minSupport"));
    expect(ab.reading).toMatch(/→ Y up within 3 m/);
    expect(r.mined.every(m => m.atoms.every(a => a.series !== "Y"))).toBe(true);
    expect(r.method.some(l => /combo\.stateZ/.test(l))).toBe(true);
  });

  it("says so and mines nothing on short history", () => {
    const short = synthetic().map(s => ({ ...s, points: s.points.slice(0, 60) }));
    const r = mineCombinations(short, "Y");
    expect(r.mined).toEqual([]);
    expect(r.predicted).toEqual([]);
    expect(r.method.some(l => /Not enough history/.test(l))).toBe(true);
  });
});

describe("predicted, never-observed combinations", () => {
  const m = (atoms: string[], lift: number, support: number): MinedCombination => ({
    atoms: atoms.map(x => ({ series: x.split(":")[0], state: x.split(":")[1] as "up" | "down" })),
    support, hits: 0, precision: 0, lift, liftFirstHalf: lift, liftSecondHalf: lift, lastSeen: null, reading: "",
  });

  it("composes parents sharing a member, skips contradictions and anything already observed, caps lift and confidence", () => {
    const mined = [m(["A:up", "B:up"], 2, 30), m(["B:up", "C:down"], 3, 20), m(["A:down", "D:up"], 2, 20), m(["E:up", "F:up"], 5, 40)];
    const never = predictUnseen(mined, () => false, 0.2, "Y");
    const abc = never.find(p => comboKey(p.atoms) === "A:up ∧ B:up ∧ C:down")!;
    expect(abc).toBeTruthy();
    expect(abc.status).toBe("untested");
    expect(abc.estimatedLift).toBeLessThanOrEqual(A("combo.unseenLiftCap"));
    expect(abc.confidence).toBeLessThanOrEqual(A("combo.unseenConfidenceCap"));
    expect(abc.reading).toMatch(/^PREDICTED, never observed/);
    expect(never.some(p => p.atoms.some(a => a.series === "A" && a.state === "down") && p.atoms.some(a => a.series === "A" && a.state === "up"))).toBe(false);
    expect(never.some(p => comboKey(p.atoms).includes("E:up"))).toBe(false); // shares nothing
    expect(predictUnseen(mined, () => true, 0.2, "Y")).toEqual([]); // everything already happened
  });

  it("every constant is a rules-table row", () => {
    for (const id of ["combo.stateZ", "combo.minSupport", "combo.minLift", "combo.stableHalves", "combo.minMonths", "combo.unseenLiftCap", "combo.unseenConfidenceCap"]) expect(MACRO_ASSUMPTIONS.has(id), id).toBe(true);
  });

  it("with rolling states, changing the future does not change a past month's states (no look-ahead)", () => {
    // Synthetic test fixture, not data: two deterministic series over 360 months.
    const mkSeries = (id: string, f: (i: number) => number) => ({ indicatorId: id, points: Array.from({ length: 360 }, (_, i) => ({ asOf: `${1990 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}-28`, value: f(i) })) });
    const rolling = { lag: 12, windowMonths: 120, minObs: 60 };
    const cut = "2010-12";
    const statesBefore = (series: ReturnType<typeof mkSeries>[]) => {
      const { keys, matrix } = alignMonthly(series);
      const out: Record<string, Array<string | null>> = {};
      matrix.forEach((row, id) => (out[id] = toStates(row, 0.5, rolling).filter((_, i) => keys[i] <= cut)));
      return out;
    };
    const a = [mkSeries("X", i => Math.sin(i / 7) * 10 + i * 0.01), mkSeries("Y", i => Math.cos(i / 11) * 5)];
    const b = [mkSeries("X", i => (i >= 252 ? 999 : Math.sin(i / 7) * 10 + i * 0.01)), mkSeries("Y", i => (i >= 252 ? -999 : Math.cos(i / 11) * 5))];
    expect(statesBefore(b)).toEqual(statesBefore(a));
    // And the miner accepts the option end to end.
    const r = mineCombinations(a, "Y", { targetState: "up", horizonMonths: 3, rolling });
    expect(r).toBeTruthy();
  });
});
