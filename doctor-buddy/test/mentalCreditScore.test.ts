/**
 * Mental Credit Score.
 *
 * The two failure modes this engine exists to avoid are ones the rest of this
 * codebase already got wrong once: treating absent data as healthy data, and
 * letting good behavioural signals outvote a crisis disclosure. These tests
 * hold both, and the determinism that makes the score reviewable.
 */
import { describe, it, expect } from "vitest";
import {
  computeMCS,
  zoneFor,
  WINDOW_DAYS,
  CRISIS_CAPS,
  type MCSObservations,
} from "../shared/engines/mentalCreditScore";

const NOW = new Date("2026-09-13T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

/** Uniformly healthy observations across every channel. */
function healthy(): MCSObservations {
  return {
    checkins: [1, 5, 9].map(d => ({ overallScore: 88, checkinDate: daysAgo(d) })),
    journal: [2, 6].map(d => ({ moodScore: 85, riskFlagged: false, createdAt: daysAgo(d) })),
    medicationLogs: Array.from({ length: 20 }, (_, i) => ({ skipped: false, takenAt: daysAgo(i) })),
    twinComposite: 86,
    prsScore: 860,
    crisisEvents: [],
  };
}

describe("zones", () => {
  it("maps the 0-1000 scale onto five bands", () => {
    expect(zoneFor(950)).toBe("optimal");
    expect(zoneFor(700)).toBe("resilient");
    expect(zoneFor(500)).toBe("guarded");
    expect(zoneFor(350)).toBe("elevated");
    expect(zoneFor(100)).toBe("critical");
  });

  it("never returns undefined for any score in range", () => {
    for (let s = 0; s <= 1000; s += 25) expect(typeof zoneFor(s)).toBe("string");
  });
});

describe("absent data is absent, not healthy", () => {
  it("returns zero coverage and no score when nothing is observed", () => {
    const r = computeMCS({}, NOW);
    expect(r.breakdown.coverage).toBe(0);
    expect(r.score).toBe(0);
    // Every component is present in the breakdown, each marked unobserved, so
    // the caller can see what is missing rather than what is merely low.
    expect(r.breakdown.components).toHaveLength(5);
    expect(r.breakdown.components.every(c => !c.observed)).toBe(true);
    expect(r.breakdown.components.every(c => c.value === null)).toBe(true);
  });

  it("does not let a missing channel drag the score down", () => {
    const full = computeMCS(healthy(), NOW);
    const onlyAdherence = computeMCS({ medicationLogs: healthy().medicationLogs }, NOW);
    // One perfect channel should still read as strong, not be diluted by four
    // absent ones scored as zero.
    expect(onlyAdherence.score).toBeGreaterThan(900);
    expect(full.score).toBeGreaterThan(800);
  });

  it("reports coverage so a thin score cannot pass for a complete one", () => {
    const thin = computeMCS({ twinComposite: 90 }, NOW);
    const full = computeMCS(healthy(), NOW);
    expect(thin.breakdown.coverage).toBeLessThan(full.breakdown.coverage);
    expect(full.breakdown.coverage).toBeCloseTo(1, 1);
  });

  it("ignores observations outside the window", () => {
    const stale = computeMCS(
      { checkins: [{ overallScore: 95, checkinDate: daysAgo(WINDOW_DAYS + 10) }] },
      NOW,
    );
    expect(stale.breakdown.components.find(c => c.key === "checkins")!.observed).toBe(false);
    expect(stale.breakdown.coverage).toBe(0);
  });
});

describe("disclosure outranks behaviour", () => {
  it("caps an otherwise excellent score after a tier-1 crisis", () => {
    const clean = computeMCS(healthy(), NOW);
    const withCrisis = computeMCS(
      { ...healthy(), crisisEvents: [{ tier: "tier1_emergency", createdAt: daysAgo(21) }] },
      NOW,
    );

    expect(clean.riskZone).toBe("optimal");
    expect(withCrisis.score).toBe(CRISIS_CAPS.tier1_emergency);
    expect(withCrisis.riskZone).toBe("elevated");
    expect(withCrisis.breakdown.cappedBy).toBe("tier1_emergency");
  });

  it("keeps the uncapped score so the adjustment is auditable", () => {
    const r = computeMCS(
      { ...healthy(), crisisEvents: [{ tier: "tier1_emergency", createdAt: daysAgo(3) }] },
      NOW,
    );
    expect(r.breakdown.rawScore).toBeGreaterThan(r.score);
    expect(r.breakdown.rawScore).toBeGreaterThan(800);
  });

  it("applies the worst tier when several crises are in the window", () => {
    const r = computeMCS(
      {
        ...healthy(),
        crisisEvents: [
          { tier: "tier3_elevated", createdAt: daysAgo(2) },
          { tier: "tier1_emergency", createdAt: daysAgo(40) },
        ],
      },
      NOW,
    );
    expect(r.score).toBe(CRISIS_CAPS.tier1_emergency);
    expect(r.breakdown.cappedBy).toBe("tier1_emergency");
  });

  it("only ever lowers — a cap above the raw score does nothing", () => {
    const poor: MCSObservations = {
      medicationLogs: Array.from({ length: 10 }, (_, i) => ({ skipped: true, takenAt: daysAgo(i) })),
      crisisEvents: [{ tier: "tier3_elevated", createdAt: daysAgo(5) }],
    };
    const r = computeMCS(poor, NOW);
    expect(r.score).toBe(r.breakdown.rawScore);
    expect(r.breakdown.cappedBy).toBeNull();
  });

  it("lets a crisis outside the window expire", () => {
    const r = computeMCS(
      { ...healthy(), crisisEvents: [{ tier: "tier1_emergency", createdAt: daysAgo(WINDOW_DAYS + 5) }] },
      NOW,
    );
    expect(r.breakdown.cappedBy).toBeNull();
    expect(r.riskZone).toBe("optimal");
  });
});

describe("component behaviour", () => {
  it("penalises risk-flagged journal entries regardless of mood score", () => {
    const base = computeMCS(
      { journal: [{ moodScore: 90, riskFlagged: false, createdAt: daysAgo(1) }] },
      NOW,
    );
    const flagged = computeMCS(
      { journal: [{ moodScore: 90, riskFlagged: true, createdAt: daysAgo(1) }] },
      NOW,
    );
    expect(flagged.score).toBeLessThan(base.score);
  });

  it("computes adherence as taken over logged", () => {
    const r = computeMCS(
      {
        medicationLogs: [
          ...Array.from({ length: 3 }, (_, i) => ({ skipped: true, takenAt: daysAgo(i) })),
          ...Array.from({ length: 7 }, (_, i) => ({ skipped: false, takenAt: daysAgo(i + 3) })),
        ],
      },
      NOW,
    );
    expect(r.breakdown.components.find(c => c.key === "adherence")!.value).toBe(70);
  });

  it("rescales PRS from the 0-1000 band scale onto 0-100", () => {
    const r = computeMCS({ prsScore: 640 }, NOW);
    expect(r.breakdown.components.find(c => c.key === "prs")!.value).toBe(64);
  });

  it("explains every component in words, observed or not", () => {
    const r = computeMCS({ twinComposite: 70 }, NOW);
    for (const c of r.breakdown.components) {
      expect(c.detail.length, `${c.key} has no detail`).toBeGreaterThan(0);
    }
  });
});

describe("determinism", () => {
  it("returns an identical result for identical observations", () => {
    expect(computeMCS(healthy(), NOW)).toEqual(computeMCS(healthy(), NOW));
  });

  it("does not read the wall clock when given a time", () => {
    // Same observations, evaluated a year later: everything falls out of window.
    const later = new Date(NOW.getTime() + 365 * 86_400_000);
    expect(computeMCS(healthy(), later).breakdown.coverage).toBeLessThan(
      computeMCS(healthy(), NOW).breakdown.coverage,
    );
  });
});
