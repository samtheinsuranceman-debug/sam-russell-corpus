/**
 * Reverse walk (Q6): eras, the shrinking toolkit, Wilson bounds, epoch cards,
 * the downward walk, break years, the two guards and the atlas.
 *
 * Every state, event and chronology below is a SYNTHETIC FIXTURE built by
 * hand to make the arithmetic checkable; none of it is market data. Offline,
 * deterministic.
 */
import { describe, expect, it } from "vitest";
import {
  REVERSE_WALK_RULES, REGIME_EVENTS, RESEARCH_100_CATALOGUE, walkRule,
  eraOf, indicatorsAvailable, inverseNormalCdf, wilsonLower, targetFollowed,
  epochCard, reverseWalk, breakYear, coincidingEvents, atlasMarkdown, epochCardFiles,
  bearStartTarget, isPreRegistered,
  type Pattern, type WalkInputs, type WalkIndicatorState, type PatternYear,
} from "@shared/macro";

const PROVENANCE = "SYNTHETIC FIXTURE — hand-built states and events, not market data";
const FIRST = 1887, LAST = 2025;
const mm = (y: number, m: number) => `${y}-${m < 10 ? "0" : ""}${m}`;

/** Every month FIRST..LAST: the active state in January of a firing year, the idle state otherwise. */
function series(fireYears: Set<number>, on: WalkIndicatorState, off: WalkIndicatorState): Record<string, WalkIndicatorState> {
  const s: Record<string, WalkIndicatorState> = {};
  for (let y = FIRST; y <= LAST; y++) for (let m = 1; m <= 12; m++) s[mm(y, m)] = m === 1 && fireYears.has(y) ? on : off;
  return s;
}
const years = (from: number, to: number, step = 1) => { const o: number[] = []; for (let y = from; y >= to; y -= step) o.push(y); return o; };

// P1: hits every 4th year 2025…1973, then fires every year 1971…1888 and misses → breaks near 1971.
const P1_HITS = years(2025, 1973, 4);
const P1_FIRE = new Set([...P1_HITS, ...years(1971, FIRST)]);
// P2: fires every 3rd year all the way back and always hits → held throughout.
const P2_FIRE = new Set(years(2025, FIRST, 3));
// P3/P4/P5: fire every January of every year.
const ALL = new Set(years(LAST, FIRST));

const coverage = { from: "1871-01", to: "2026-08" };
const base = (value: number) => ({ value, source: "SYNTHETIC FIXTURE base rate", asOf: "2026-09-23" });

const PATTERNS: Pattern[] = [
  { id: "P1", origin: "fixture", members: [{ indicator: "eq-cape", state: "extreme-high" }, { indicator: "rt-term-spread", state: "down" }], target: "evt-a", horizonMonths: 12, preRegisteredAt: "2026-09-23T09:00:00Z", baseRate: base(0.5) },
  { id: "P2", members: [{ indicator: "px-gold", state: "up" }, { indicator: "rt-long-yield", state: "up" }], target: "evt-b", horizonMonths: 12, preRegisteredAt: "2026-09-23", baseRate: base(0.3) },
  { id: "P3", members: [{ indicator: "rt-policy-rate", state: "up" }, { indicator: "px-cpi", state: "up" }], target: "evt-b", horizonMonths: 12, preRegisteredAt: "2026-09-23", baseRate: base(0.3) },
  { id: "P4", members: [{ indicator: "eq-dividend-yield", state: "up" }, { indicator: "px-wheat", state: "up" }], target: "evt-b", horizonMonths: 12, baseRate: base(0.3) },
  { id: "P5", members: [{ indicator: "px-oil", state: "up" }, { indicator: "px-wholesale", state: "up" }], target: "evt-b", horizonMonths: 12, preRegisteredAt: "some day", baseRate: base(0.3) },
];

const INPUTS: WalkInputs = {
  catalogue: RESEARCH_100_CATALOGUE,
  states: {
    "eq-cape": series(P1_FIRE, "extreme-high", "normal"),
    "rt-term-spread": series(P1_FIRE, "down", "up"),
    "px-gold": series(P2_FIRE, "up", "flat"),
    "rt-long-yield": series(P2_FIRE, "up", "flat"),
    // Deliberately supplied back to 1887 although the Fed policy rate starts in 1914: the guard must ignore it.
    "rt-policy-rate": series(ALL, "up", "flat"),
    "px-cpi": series(ALL, "up", "flat"),
    "eq-dividend-yield": series(ALL, "up", "flat"),
    "px-wheat": series(ALL, "up", "flat"),
    "px-oil": series(ALL, "up", "flat"),
    "px-wholesale": series(ALL, "up", "flat"),
  },
  patterns: PATTERNS,
  targets: {
    "evt-a": { events: P1_HITS.map(y => mm(y, 3)), coverage, source: "SYNTHETIC FIXTURE", asOf: "2026-09-23" },
    "evt-b": { events: Array.from(P2_FIRE).map(y => mm(y, 2)), coverage, source: "SYNTHETIC FIXTURE", asOf: "2026-09-23" },
  },
  chronology: {
    bears: [{ peak: "2007-10", trough: "2009-03" }, { peak: "1929-09", trough: "1932-06" }],
    coverage,
    source: "SYNTHETIC FIXTURE chronology (two bears only)",
    asOf: "2026-09-23",
  },
  provenance: PROVENANCE,
  asOf: "2026-09-23",
};

const RESULT = reverseWalk(2025, 1888, INPUTS);
const life = (id: string) => RESULT.lives.find(l => l.pattern.id === id)!;
const card = (y: number) => RESULT.cards.find(c => c.year === y)!;

describe("rules table", () => {
  it("every row carries source and asOf, and the eras tile the years with no gap", () => {
    for (const r of REVERSE_WALK_RULES) {
      expect(r.source.length).toBeGreaterThan(3);
      expect(r.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.basis.length).toBeGreaterThan(10);
    }
    expect(walkRule("walk.era.E1.last") + 1).toBe(walkRule("walk.era.E2.first"));
    expect(walkRule("walk.era.E2.first")).toBeLessThan(walkRule("walk.era.E3.first"));
    expect(walkRule("walk.era.E4.first")).toBeLessThan(walkRule("walk.era.E5.first"));
    expect(REVERSE_WALK_RULES.find(r => r.id === "walk.wilson.confidence")!.source).toMatch(/Wilson.*1927.*JASA/);
    expect(REVERSE_WALK_RULES.find(r => r.id === "walk.minFirings")!.source).toMatch(/Wilson.*1927.*JASA/);
    expect(() => walkRule("walk.nope")).toThrow();
  });

  it("regime events carry sources and cover the seven documented changes", () => {
    const starts = REGIME_EVENTS.map(e => e.from);
    for (const y of [1913, 1933, 1944, 1951, 1971, 1979, 2008]) expect(starts).toContain(y);
    for (const e of REGIME_EVENTS) { expect(e.source.length).toBeGreaterThan(10); expect(e.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
  });
});

describe("eras and the shrinking toolkit", () => {
  it("eraOf puts every boundary year in the right era", () => {
    const cases: Array<[number, string]> = [[1700, "E1"], [1888, "E1"], [1889, "E2"], [1935, "E2"], [1936, "E3"], [1961, "E3"], [1962, "E4"], [1989, "E4"], [1990, "E5"], [2025, "E5"]];
    for (const [y, e] of cases) expect(eraOf(y)).toBe(e);
    expect(() => eraOf(1990.5)).toThrow();
  });

  it("indicatorsAvailable reproduces the spec's counts from the 100-indicator catalogue", () => {
    expect(RESEARCH_100_CATALOGUE).toHaveLength(100);
    const spec: Array<[number, number]> = [[2025, 100], [2002, 100], [1990, 96], [1975, 93], [1960, 87], [1947, 81], [1935, 73], [1919, 67], [1900, 54], [1888, 41]];
    for (const [y, n] of spec) expect(indicatorsAvailable(y, RESEARCH_100_CATALOGUE)).toHaveLength(n);
    expect(indicatorsAvailable(1913)).not.toContain("rt-policy-rate");
    expect(indicatorsAvailable(1914)).toContain("rt-policy-rate");
    for (const c of RESEARCH_100_CATALOGUE) { expect(c.source.length).toBeGreaterThan(3); expect(c.asOf).toBe("2026-09-23"); }
  });
});

describe("Wilson lower bound", () => {
  it("matches hand-computed values", () => {
    expect(inverseNormalCdf(0.975)).toBeCloseTo(1.959964, 5);
    expect(inverseNormalCdf(0.005)).toBeCloseTo(-2.575829, 5);
    const z2 = 1.959964 ** 2;
    expect(wilsonLower(10, 10)!).toBeCloseTo(10 / (10 + z2), 6);
    expect(wilsonLower(5, 10)!).toBeCloseTo(0.2366, 4);
    expect(wilsonLower(0, 7)).toBe(0);
    expect(wilsonLower(0, 0)).toBeNull();
    expect(() => wilsonLower(3, 2)).toThrow();
  });
});

describe("epoch cards", () => {
  it("follow-through is true, false, or null when the window leaves the target's coverage", () => {
    const t = { events: ["2000-06"], coverage: { from: "1990-01", to: "2001-12" }, source: "SYNTHETIC FIXTURE", asOf: "2026-09-23" };
    expect(targetFollowed(t, "2000-01", 6)).toBe(true);
    expect(targetFollowed(t, "2000-06", 6)).toBe(false); // the event month itself is not "after"
    expect(targetFollowed(t, "1999-01", 3)).toBe(false);
    expect(targetFollowed(t, "2001-10", 6)).toBeNull();
    expect(targetFollowed(t, "1989-12", 3)).toBeNull();
    expect(targetFollowed(undefined, "2000-01", 6)).toBeNull();
  });

  it("records the fields the spec asks for, state changes only for indicators that existed, and the phase", () => {
    const c = epochCard(2025, INPUTS);
    expect(Object.keys(c)).toEqual(expect.arrayContaining(["year", "era", "indicatorsAvailable", "stateChanges", "phase", "firings"]));
    expect(c.era).toBe("E5");
    expect(c.firings.find(f => f.patternId === "P1")).toEqual({ patternId: "P1", month: "2025-01", followedBy: true });
    // P1 fires in January 2025 then goes idle: cape normal→extreme-high (Jan) and back (Feb).
    expect(c.stateChanges.filter(s => s.indicator === "eq-cape").map(s => s.month)).toEqual(["2025-01", "2025-02"]);

    const c1900 = epochCard(1900, INPUTS);
    expect(c1900.stateChanges.some(s => s.indicator === "rt-policy-rate")).toBe(false);
    expect(c1900.indicatorsAvailable).toHaveLength(54);

    expect(epochCard(2008, INPUTS).phase).toBe("bear");
    expect(epochCard(2007, INPUTS).phase).toBe("mixed");
    expect(epochCard(2007, INPUTS).phaseMonths).toEqual({ bull: 10, bear: 2 });
    expect(epochCard(2015, INPUTS).phase).toBe("bull");
    expect(epochCard(1930, INPUTS).phase).toBe("bear");
    expect(epochCard(1870, INPUTS).phase).toBe("unknown");
  });

  it("a pattern active for many months is one firing (onset only)", () => {
    const run: Record<string, WalkIndicatorState> = {};
    for (let m = 1; m <= 12; m++) run[mm(2010, m)] = m >= 3 && m <= 9 ? "up" : "flat";
    const c = epochCard(2010, { ...INPUTS, states: { "px-oil": run, "px-wholesale": run }, patterns: [{ ...PATTERNS[4], preRegisteredAt: "2026-09-23" }] });
    expect(c.firings.map(f => f.month)).toEqual(["2010-03"]);
  });
});

describe("the walk", () => {
  it("iterates downward one year at a time, 2025 to 1888", () => {
    expect(RESULT.cards).toHaveLength(2025 - 1888 + 1);
    RESULT.cards.forEach((c, i) => expect(c.year).toBe(2025 - i));
    expect(() => reverseWalk(1888, 2025, INPUTS)).toThrow(/DOWN/);
    expect(() => reverseWalk(2025, 2024, { ...INPUTS, patterns: [PATTERNS[0], PATTERNS[0]] })).toThrow(/Duplicate/);
  });

  it("keeps a running hit rate with a Wilson lower bound per pattern", () => {
    const h = life("P1").history;
    const y1973 = h.find(x => x.year === 1973)!;
    expect(y1973.cumulativeN).toBe(P1_HITS.length);
    expect(y1973.cumulativeHits).toBe(P1_HITS.length);
    expect(y1973.hitRate).toBe(1);
    const y1971 = h.find(x => x.year === 1971)!;
    expect(y1971.cumulativeN).toBe(P1_HITS.length + 1);
    expect(y1971.wilsonLower).toBeCloseTo(wilsonLower(P1_HITS.length, P1_HITS.length + 1)!, 12);
  });

  it("declares the break year where the lower bound first drops below the threshold after the minimum firings, and names what it coincides with", () => {
    // Independent re-computation: count misses from 1971 down until the bound falls below 0.5.
    const k = P1_HITS.length;
    let m = 0;
    while (wilsonLower(k, k + m)! >= 0.5 || k + m < walkRule("walk.minFirings")) m++;
    const expected = 1971 - (m - 1);
    const l = life("P1");
    expect(l.breakYear).toBe(expected);
    expect(expected).toBe(1966);
    expect(l.status).toBe("broke");
    expect(l.heldFrom).toBe(2025);
    expect(l.heldTo).toBe(1967);
    expect(l.coincidesWith.map(e => e.id)).toEqual(["end-convertibility"]);

    const p2 = life("P2");
    expect(p2.breakYear).toBeNull();
    expect(p2.status).toBe("held-throughout");
  });

  it("breakYear waits for the minimum firings even if the bound is already low", () => {
    const p = PATTERNS[0];
    const mk = (year: number, n: number, k: number): PatternYear => ({ year, scored: true, firings: 1, hits: 0, censored: 0, cumulativeN: n, cumulativeHits: k, hitRate: k / n, wilsonLower: wilsonLower(k, n) });
    const hist = [mk(2025, 1, 0), mk(2024, 5, 1), mk(2023, 9, 2), mk(2022, 10, 2)];
    expect(breakYear(hist, p)).toBe(2022);
    expect(breakYear(hist.slice(0, 3), p)).toBeNull();
    expect(coincidingEvents(2006).map(e => e.id)).toEqual(["zero-rates-qe"]);
    expect(coincidingEvents(1931).map(e => e.id)).toEqual(["gold-devaluation"]);
    expect(coincidingEvents(1960)).toEqual([]);
  });
});

describe("guards", () => {
  it("never scores a pattern in a year where a member indicator did not yet exist", () => {
    // P3 needs rt-policy-rate (catalogue: 1914). Its states were supplied back to 1887 and say "fire".
    for (const c of RESULT.cards) {
      const fired = c.firings.some(f => f.patternId === "P3");
      if (c.year < 1914) {
        expect(fired).toBe(false);
        expect(c.notScored).toContainEqual({ patternId: "P3", reason: "member-missing", missing: ["rt-policy-rate"] });
      } else {
        expect(fired).toBe(true);
      }
    }
    const h = life("P3").history;
    const n1914 = h.find(x => x.year === 1914)!.cumulativeN;
    for (const x of h.filter(x => x.year < 1914)) { expect(x.scored).toBe(false); expect(x.firings).toBe(0); expect(x.cumulativeN).toBe(n1914); }
  });

  it("a pattern without a valid preRegisteredAt cannot fire in a holdout year", () => {
    expect(isPreRegistered(PATTERNS[3])).toBe(false);
    expect(isPreRegistered(PATTERNS[4])).toBe(false);
    expect(isPreRegistered(PATTERNS[0])).toBe(true);
    for (const id of ["P4", "P5"]) {
      const fires = RESULT.cards.filter(c => c.firings.some(f => f.patternId === id)).map(c => c.year);
      expect(fires.length).toBe(2025 - 1990 + 1);
      expect(Math.min(...fires)).toBe(1990);
      expect(card(1989).notScored).toContainEqual({ patternId: id, reason: "not-pre-registered" });
      expect(card(1990).notScored.some(s => s.patternId === id)).toBe(false);
    }
    expect(card(1989).holdout).toBe(true);
    expect(card(1990).holdout).toBe(false);
  });
});

describe("outputs", () => {
  it("writes one epoch_cards/YYYY.json per year and the atlas, deterministically", () => {
    const files = epochCardFiles(RESULT);
    expect(files).toHaveLength(138);
    expect(files[0].path).toBe("epoch_cards/2025.json");
    expect(files[files.length - 1].path).toBe("epoch_cards/1888.json");
    const c = JSON.parse(files[0].content);
    expect(c.provenance).toBe(PROVENANCE);

    const atlas = atlasMarkdown(RESULT);
    expect(atlas).toContain("SYNTHETIC FIXTURE");
    expect(atlas).toContain("**broke 1966**");
    expect(atlas).toContain("End of dollar–gold convertibility");
    expect(atlas).toMatch(/\*\*P2\*\*.*no break to 1888/);
    expect(atlas).toMatch(/\*\*P4\*\*.*pre-registered NO — E5 only/);
    for (const r of REVERSE_WALK_RULES) expect(atlas).toContain(r.id);
    // One life line per pattern.
    expect(atlas.split("\n").filter(l => /^- `[=x.?]+` \*\*P/.test(l))).toHaveLength(PATTERNS.length);

    const again = reverseWalk(2025, 1888, INPUTS);
    expect(JSON.stringify(again)).toBe(JSON.stringify(RESULT));
    expect(atlasMarkdown(again)).toBe(atlas);
  });

  it("bearStartTarget turns a chronology into peak-month events", () => {
    const t = bearStartTarget(INPUTS.chronology);
    expect(t.events).toEqual(["2007-10", "1929-09"]);
    expect(targetFollowed(t, "2007-01", 12)).toBe(true);
  });
});
