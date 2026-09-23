/**
 * Indicator states and the event stream (A10, study §5). Offline; every series
 * here is a SYNTHETIC fixture built from deterministic arithmetic — no real
 * indicator data, no network.
 */
import { describe, expect, it } from "vitest";
import {
  A, MACRO_ASSUMPTIONS, assumption, toStates, rollingChangeZ,
  directionStates, levelStates, stateEvents, buildEventStream, monthlyGrid, percentileSorted,
  computeSeriesStates, statesCsv, eventsCsv, statesMethod, compareEvents,
  type MonthlyPoint,
} from "@shared/macro";

/** Month-end date for month index i counted from Jan 1950 (synthetic calendar). */
const monthEnd = (i: number) => new Date(Date.UTC(1950, i + 1, 0)).toISOString().slice(0, 10);

/** SYNTHETIC: a deterministic wavy series with cycles of 7, 23 and 61 months and a gentle trend. */
function synthetic(n: number, phase = 0): MonthlyPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    asOf: monthEnd(i),
    value: 100 + 0.05 * i + 3 * Math.sin((i + phase) / 7) + 5 * Math.sin((i + phase) / 23) + 8 * Math.sin((i + phase) / 61),
  }));
}

const CUT = 240;
/** Rewrite every value from month CUT onward — the "future" relative to the months before it. */
const alterFuture = (pts: MonthlyPoint[]) => pts.map((p, i) => (i >= CUT ? { ...p, value: p.value * -3 + 1000 + (i % 5) * 40 } : p));

describe("rules-table rows", () => {
  it("every threshold is a row with source and asOf", () => {
    for (const id of ["states.changeMonths", "states.windowMonths", "states.minWindowObs", "states.levelLowPct", "states.levelHighPct", "states.levelWindowMonths", "states.levelMinObs", "combo.stateZ"]) {
      expect(MACRO_ASSUMPTIONS.has(id), id).toBe(true);
      const a = assumption(id);
      expect(a.source.length).toBeGreaterThan(0);
      expect(a.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(A("states.changeMonths")).toBe(12);
    expect(A("states.windowMonths")).toBe(120);
    expect(A("states.levelLowPct")).toBe(10);
    expect(A("states.levelHighPct")).toBe(90);
    expect(statesMethod().join(" ")).toContain("[states.changeMonths");
  });
});

describe("no look-ahead", () => {
  const base = synthetic(420);
  const altered = alterFuture(base);

  it("altering future values leaves every past direction state, z and change unchanged", () => {
    const a = directionStates(base);
    const b = directionStates(altered);
    expect(a.slice(0, CUT)).toEqual(b.slice(0, CUT));
    // The alteration is real: later states do move.
    expect(a.slice(CUT).map(r => r.state)).not.toEqual(b.slice(CUT).map(r => r.state));
    // And the past is not trivially null.
    expect(a.slice(0, CUT).filter(r => r.state !== null).length).toBeGreaterThan(100);
  });

  it("altering future values leaves every past level state and band unchanged (expanding and rolling windows)", () => {
    for (const opts of [{}, { windowMonths: 120 }]) {
      const a = levelStates(base, opts);
      const b = levelStates(altered, opts);
      expect(a.slice(0, CUT)).toEqual(b.slice(0, CUT));
      expect(a.slice(CUT).map(r => r.state)).not.toEqual(b.slice(CUT).map(r => r.state));
    }
  });

  it("truncating the series at every cut gives the same states as the full run (prefix property)", () => {
    const full = directionStates(base);
    const fullLevel = levelStates(base);
    for (const cut of [80, 150, 239, 300, 419]) {
      expect(directionStates(base.slice(0, cut))).toEqual(full.slice(0, cut));
      expect(levelStates(base.slice(0, cut))).toEqual(fullLevel.slice(0, cut));
    }
  });

  it("events before the cut are unchanged in the merged stream", () => {
    const input = (pts: MonthlyPoint[]) => [
      { id: "syn-a", points: pts, speed: "slow" as const },
      { id: "syn-b", points: synthetic(420, 17), speed: "fast" as const },
    ];
    const cutMonth = monthEnd(CUT).slice(0, 7);
    const before = (evs: ReturnType<typeof buildEventStream>) => evs.filter(e => e.month < cutMonth);
    const a = buildEventStream(input(base));
    const b = buildEventStream(input(altered));
    expect(before(a).length).toBeGreaterThan(0);
    expect(before(a)).toEqual(before(b));
  });

  it("the z-score window excludes the month being classified", () => {
    // SYNTHETIC: flat 12-month change of 1 for 100 months, then one huge change.
    const vals = Array.from({ length: 112 }, (_, i) => i / 12);
    vals.push(vals[111] + 50);
    const { z } = rollingChangeZ(vals, { lag: 12, windowMonths: 120, minObs: 60 });
    // Zero spread in the prior window and a larger change: +Infinity, i.e. "up". Had the month itself
    // been in its own window, the spread would be non-zero and z finite.
    expect(z[112]).toBe(Infinity);
  });
});

describe("warm-up", () => {
  it("direction states are null until 12 + minWindowObs months, then known", () => {
    const rows = directionStates(synthetic(200));
    const first = 12 + A("states.minWindowObs");
    expect(rows.slice(0, first).every(r => r.state === null && r.z === null)).toBe(true);
    expect(rows[first].state).not.toBeNull();
    expect(rows.slice(0, 12).every(r => r.change === null)).toBe(true);
    expect(rows[12].change).not.toBeNull();
  });

  it("level states are null until levelMinObs prior readings", () => {
    const rows = levelStates(synthetic(200));
    const first = A("states.levelMinObs");
    expect(rows.slice(0, first).every(r => r.state === null && r.lo === null)).toBe(true);
    expect(rows[first].state).not.toBeNull();
  });

  it("too short a series is all null, never flat", () => {
    expect(directionStates(synthetic(40)).every(r => r.state === null)).toBe(true);
    expect(levelStates(synthetic(40)).every(r => r.state === null)).toBe(true);
    expect(directionStates([])).toEqual([]);
  });

  it("gaps count as missing months, not as shorter lags", () => {
    // SYNTHETIC: 22 monthly readings with months 5–7 missing.
    const pts = synthetic(22).filter((_, i) => i < 5 || i > 7);
    const g = monthlyGrid(pts);
    expect(g.months.length).toBe(22);
    expect(g.values.slice(5, 8)).toEqual([null, null, null]);
    const rows = directionStates(pts);
    expect(rows.slice(17, 20).every(r => r.change === null)).toBe(true); // lags onto months 5–7, missing
    expect(rows[16].change).toBeCloseTo(pts[13].value - pts[4].value, 9); // month 16 vs month 4 (index shift from the gap)
    expect(rows[20].change).not.toBeNull();
  });
});

describe("flat band", () => {
  it("a steady 12-month change is flat; a jump beyond the band is up, a drop is down", () => {
    // SYNTHETIC: linear growth — every 12-month change identical — then a step up, later a step down.
    const n = 200;
    const pts: MonthlyPoint[] = Array.from({ length: n }, (_, i) => ({ asOf: monthEnd(i), value: i + (i >= 150 ? 30 : 0) + (i >= 180 ? -80 : 0) }));
    const rows = directionStates(pts);
    const first = 12 + A("states.minWindowObs");
    expect(rows.slice(first, 150).every(r => r.state === "flat")).toBe(true);
    expect(rows[150].state).toBe("up");
    expect(rows[180].state).toBe("down");
  });

  it("the band is combo.stateZ and is inclusive at its edge", () => {
    // SYNTHETIC: prior changes alternate ±1 (mean 0, sd 1); a change of exactly +0.5 or −0.5 sits on the band.
    const mk = (last: number) => {
      const vals: number[] = [];
      for (let i = 0; i < 12; i++) vals.push(0);
      for (let i = 12; i < 80; i++) vals.push(vals[i - 12] + (i % 2 ? 1 : -1));
      vals.push(vals[80 - 12] + last);
      return vals;
    };
    const opts = { lag: 12, windowMonths: 120, minObs: 60 };
    expect(toStates(mk(0.5), A("combo.stateZ"), opts)[80]).toBe("up");
    expect(toStates(mk(-0.5), A("combo.stateZ"), opts)[80]).toBe("down");
    expect(toStates(mk(0.49), A("combo.stateZ"), opts)[80]).toBe("flat");
    expect(toStates(mk(0.49), 0.4, opts)[80]).toBe("up");
  });

  it("toStates without the rolling argument keeps the original full-sample behaviour", () => {
    const st = toStates([0, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 5]);
    expect(st[0]).toBeNull();
    expect(st[4]).toBe("up");
    expect(st[13]).toBe("down");
  });
});

describe("levels", () => {
  it("percentiles interpolate linearly (type 7)", () => {
    expect(percentileSorted([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentileSorted([0, 10], 90)).toBe(9);
  });

  it("a reading above every prior 90th percentile is extreme-high, below the 10th extreme-low", () => {
    // SYNTHETIC: 0..119 repeating, then 500, then −500.
    const pts: MonthlyPoint[] = Array.from({ length: 122 }, (_, i) => ({ asOf: monthEnd(i), value: i < 120 ? i % 120 : i === 120 ? 500 : -500 }));
    const rows = levelStates(pts);
    expect(rows[120].state).toBe("extreme-high");
    expect(rows[121].state).toBe("extreme-low");
    expect(rows[120].lo).toBeCloseTo(11.9, 6);
    expect(rows[120].hi).toBeCloseTo(107.1, 6);
  });
});

describe("events", () => {
  it("events only on changes; warm-up end and null gaps are not events", () => {
    const states = ["up", "up", "flat", "flat", null, "flat", "down", "down", "up"].map((s, i) => ({ month: `2000-${String(i + 1).padStart(2, "0")}`, state: s }));
    const withLead = [{ month: "1999-12", state: null }, ...states];
    const ev = stateEvents("syn-x", withLead);
    expect(ev).toEqual([
      { month: "2000-03", indicator: "syn-x", kind: "direction", from: "up", to: "flat" },
      { month: "2000-07", indicator: "syn-x", kind: "direction", from: "flat", to: "down" },
      { month: "2000-09", indicator: "syn-x", kind: "direction", from: "down", to: "up" },
    ]);
  });

  it("a constant state gives no events", () => {
    expect(stateEvents("syn-y", Array.from({ length: 50 }, (_, i) => ({ month: `m${i}`, state: "flat" })))).toEqual([]);
  });

  it("every event in a series' stream matches a change in its state rows", () => {
    const st = computeSeriesStates({ id: "syn-a", points: synthetic(300), speed: "slow" });
    const evs = stateEvents("syn-a", st.direction);
    expect(evs.length).toBeGreaterThan(0);
    for (const e of evs) {
      const i = st.direction.findIndex(r => r.month === e.month);
      expect(st.direction[i].state).toBe(e.to);
      const prev = st.direction.slice(0, i).reverse().find(r => r.state !== null);
      expect(prev?.state).toBe(e.from);
    }
  });
});

describe("the event stream", () => {
  const list = [
    { id: "syn-b", points: synthetic(360, 11), speed: "fast" as const },
    { id: "syn-a", points: synthetic(360), speed: "slow" as const },
    { id: "syn-c", points: synthetic(300, 40).map((p, i) => ({ ...p, asOf: monthEnd(i + 60) })), speed: "medium" as const },
  ];
  const stream = buildEventStream(list);

  it("is sorted by month, then indicator, then kind", () => {
    for (let i = 1; i < stream.length; i++) expect(compareEvents(stream[i - 1], stream[i])).toBeLessThanOrEqual(0);
  });

  it("merges every series' events; level events only for slow indicators", () => {
    const ids = new Set(stream.map(e => e.indicator));
    expect(Array.from(ids).sort()).toEqual(["syn-a", "syn-b", "syn-c"]);
    expect(stream.filter(e => e.kind === "level").every(e => e.indicator === "syn-a")).toBe(true);
    expect(stream.some(e => e.kind === "level")).toBe(true);
    const own = stateEvents("syn-b", directionStates(list[0].points));
    expect(stream.filter(e => e.indicator === "syn-b")).toEqual(own);
  });

  it("rejects duplicate ids", () => {
    expect(() => buildEventStream([list[0], list[0]])).toThrow(/Duplicate/);
  });

  it("renders states/<id>.csv and events.csv with unknowns empty", () => {
    const st = computeSeriesStates(list[1]);
    const csv = statesCsv(st).trim().split("\n");
    expect(csv[0]).toBe("month,value,change12,z,direction,levelLo,levelHi,level");
    expect(csv.length).toBe(361);
    expect(csv[1].split(",")[4]).toBe(""); // warm-up: unknown, not "flat"
    const ev = eventsCsv(stream).trim().split("\n");
    expect(ev[0]).toBe("month,indicator,kind,from,to");
    expect(ev.length).toBe(stream.length + 1);
  });
});
