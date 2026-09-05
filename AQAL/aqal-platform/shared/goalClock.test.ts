import { describe, it, expect } from "vitest";
import { readClock, fmtMonths } from "./goalClock";
import { templateForGoal } from "./goalTemplates";

const base = { baselineMonths: 24, minMonthlyHours: 10, stages: [
  { name: "a", done: false }, { name: "b", done: false }, { name: "c", done: false }, { name: "d", done: false },
]};

describe("readClock", () => {
  it("unstarted until the first log", () => {
    const r = readClock({ ...base, monthlyHours: [] });
    expect(r.state).toBe("unstarted");
    expect(r.etaMonths).toBeNull();
  });

  it("on pace at recommended effort", () => {
    const r = readClock({ ...base, monthlyHours: [10, 10, 10] });
    expect(r.state).toBe("on_pace");
    expect(r.etaMonths).toBeCloseTo(24, 0);
  });

  it("the five-kids rule: months of zero effort → never", () => {
    const r = readClock({ ...base, monthlyHours: [0, 0, 0, 0, 0, 0] });
    expect(r.state).toBe("never");
    expect(r.headline).toContain("never");
  });

  it("double effort roughly halves the clock (capped at 2x)", () => {
    const r = readClock({ ...base, monthlyHours: [20, 20, 20] });
    expect(r.state).toBe("ahead");
    expect(r.etaMonths).toBeCloseTo(12, 0);
    const r2 = readClock({ ...base, monthlyHours: [80, 80, 80] });
    expect(r2.etaMonths).toBeCloseTo(12, 0); // cap prevents fantasy clocks
  });

  it("completed stages shorten the remaining clock", () => {
    const stages = base.stages.map((s, i) => ({ ...s, done: i < 2 })); // 50% done
    const r = readClock({ ...base, stages, monthlyHours: [10, 10, 10] });
    expect(r.etaMonths).toBeCloseTo(12, 0);
    expect(r.stageProgress).toBe(0.5);
  });

  it("all stages done = achieved", () => {
    const stages = base.stages.map((s) => ({ ...s, done: true }));
    expect(readClock({ ...base, stages, monthlyHours: [10] }).state).toBe("achieved");
  });

  it("recent pace dominates old history", () => {
    const r = readClock({ ...base, monthlyHours: [40, 40, 40, 0.4, 0.4, 0.4] });
    expect(["stalled", "never"]).toContain(r.state);
  });
});

describe("templateForGoal", () => {
  it("matches business goals", () => {
    expect(templateForGoal("I want to start my own business").key).toBe("own-business");
  });
  it("matches family goals", () => {
    expect(templateForGoal("get married and have five kids").key).toBe("family-kids");
  });
  it("falls back to the generic scaffold", () => {
    expect(templateForGoal("learn to blow glass").key).toBe("custom");
  });
});

describe("fmtMonths", () => {
  it("formats months and years readably", () => {
    expect(fmtMonths(3)).toBe("3 months");
    expect(fmtMonths(30)).toBe("2.5 years");
  });
});
