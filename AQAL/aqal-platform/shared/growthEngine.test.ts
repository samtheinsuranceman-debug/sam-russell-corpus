import { describe, it, expect } from "vitest";
import {
  QUICK_WINS, LADDER_TIERS, DOSE_CURVE, STRENGTH_CHALLENGES,
  challengeForWeek, whatWouldItTake, dayStreak, monthStreak, scanForCrisis,
} from "./growthEngine";
import { ALL_AXES } from "./axisModes";

describe("strength challenges", () => {
  it("covers all 32 lines", () => {
    for (const a of ALL_AXES) expect(STRENGTH_CHALLENGES[a], `missing challenge for ${a}`).toBeTruthy();
  });
  it("rotates deterministically by week among top lines", () => {
    const d = new Date("2026-08-10T12:00:00Z");
    const a = challengeForWeek(["Logical", "Humor"], d);
    const b = challengeForWeek(["Logical", "Humor"], d);
    expect(a).toEqual(b);
    expect(["Logical", "Humor"]).toContain(a!.line);
  });
  it("returns null with no usable lines", () => {
    expect(challengeForWeek([])).toBeNull();
  });
});

describe("whatWouldItTake", () => {
  const stages = [
    { name: "A", done: true }, { name: "B", done: false },
    { name: "C", done: false }, { name: "D", done: false },
  ];
  it("prices only the remaining stages and sums to the remaining baseline", () => {
    const r = whatWouldItTake(stages, 40);
    expect(r.rows.map((x) => x.stage)).toEqual(["B", "C", "D"]);
    expect(r.rows.reduce((s, x) => s + x.months, 0)).toBeCloseTo(r.totalMonths, 6);
    expect(r.totalMonths).toBeCloseTo(30, 6); // 3/4 of 40
  });
  it("earlier stages weighted heavier", () => {
    const r = whatWouldItTake(stages, 40);
    expect(r.rows[0].months).toBeGreaterThan(r.rows[2].months);
  });
  it("done goal costs nothing", () => {
    expect(whatWouldItTake(stages.map((s) => ({ ...s, done: true })), 40).totalMonths).toBe(0);
  });
});

describe("streaks", () => {
  const today = new Date("2026-08-10T15:00:00Z");
  it("counts consecutive days ending today", () => {
    expect(dayStreak(["2026-08-08", "2026-08-09", "2026-08-10"], today)).toBe(3);
  });
  it("survives when today's rep isn't done yet", () => {
    expect(dayStreak(["2026-08-08", "2026-08-09"], today)).toBe(2);
  });
  it("breaks on a gap", () => {
    expect(dayStreak(["2026-08-06", "2026-08-09", "2026-08-10"], today)).toBe(2);
  });
  it("month streaks work the same way", () => {
    expect(monthStreak(["2026-06", "2026-07", "2026-08"], today)).toBe(3);
    expect(monthStreak(["2026-05", "2026-07"], today)).toBe(1);
  });
});

describe("crisis scan", () => {
  it("catches high-risk phrases", () => {
    expect(scanForCrisis("some days I just want to die")).toBe(true);
    expect(scanForCrisis("I've been cutting myself again")).toBe(true);
    expect(scanForCrisis("my husband hits me when he drinks")).toBe(true);
  });
  it("ignores ordinary dramatic language", () => {
    expect(scanForCrisis("this deadline is killing me")).toBe(false);
    expect(scanForCrisis("I'd kill for a pizza right now")).toBe(false);
    expect(scanForCrisis("the movie's villain wanted to end the world")).toBe(false);
  });
});

describe("static content sanity", () => {
  it("quick wins, ladder, dose curve are present and shaped", () => {
    expect(QUICK_WINS.length).toBe(3);
    expect(LADDER_TIERS.length).toBe(3);
    expect(DOSE_CURVE[DOSE_CURVE.length - 1].effect).toBeGreaterThan(DOSE_CURVE[0].effect);
  });
});
