/**
 * The readiness evidence seam between editions and the bridge.
 *
 * Public edition: the person's own 1-5 check-ins drive the guardrails, worse
 * ratings can only tighten them, a self-chosen pause can only tighten them,
 * and no clinical word ever reaches the screen.
 * Clinical edition: twin history is read under the domain ids the server
 * actually writes.
 */
import { describe, expect, it } from "vitest";
import { assessFinancialReadiness } from "@shared/engines/psychFinancialBridge";
import {
  PUBLIC_FORBIDDEN,
  adherenceFromLogs,
  applyPause,
  pauseActive,
  profileStrings,
  publicSafeProfile,
  snapshotFromTwinHistory,
  snapshotFromWellnessCheckins,
  vectorsFromTwin,
} from "@shared/engines/readinessEvidence";

const day = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-09-16T12:00:00Z");
const checkin = (scores: Record<string, number>, ageDays = 0) => ({ id: String(ageDays), createdAt: new Date(now - ageDays * day).toISOString(), scores });

describe("public edition: wellness check-ins", () => {
  it("reads nothing from nothing", () => {
    expect(snapshotFromWellnessCheckins(null, now)).toBeNull();
    expect(snapshotFromWellnessCheckins([], now)).toBeNull();
    expect(snapshotFromWellnessCheckins("garbage", now)).toBeNull();
    expect(snapshotFromWellnessCheckins([{ nope: true }, 42, null], now)).toBeNull();
  });

  it("maps a strong check-in to a steady, low-load snapshot and a weak one the other way", () => {
    const strong = snapshotFromWellnessCheckins([checkin({ mood: 5, energy: 5, sleep: 5, connection: 5, focus: 5 })], now)!;
    const weak = snapshotFromWellnessCheckins([checkin({ mood: 1, energy: 1, sleep: 1, connection: 1, focus: 1 })], now)!;
    expect(strong.moodStability).toBe(100);
    expect(strong.anxiety).toBe(0);
    expect(weak.moodStability).toBe(0);
    expect(weak.anxiety).toBe(100);
    expect(strong.sources).toEqual(["wellness-check-in"]);
    // A 1-5 rating never becomes a safety level.
    expect(weak.cssrsLevel).toBeUndefined();
    expect(weak.escalationLevel).toBeUndefined();
  });

  it("uses the newest check-in and ignores stale or future ones", () => {
    const snap = snapshotFromWellnessCheckins([
      checkin({ mood: 1, energy: 1, sleep: 1, connection: 1, focus: 1 }, -3), // three days in the future: ignored
      checkin({ mood: 5, energy: 5, sleep: 5, connection: 5, focus: 5 }, 1),
      checkin({ mood: 1, energy: 1, sleep: 1, connection: 1, focus: 1 }, 120), // older than 90 days: ignored
    ], now)!;
    expect(snap.moodStability).toBe(100);
    expect(snap.observed).not.toContain("volatility");
  });

  it("derives a change index only from three or more check-ins", () => {
    const flat = snapshotFromWellnessCheckins([1, 2, 3].map(d => checkin({ mood: 3, energy: 3, sleep: 3, connection: 3, focus: 3 }, d)), now)!;
    const swinging = snapshotFromWellnessCheckins([
      checkin({ mood: 5, energy: 5, sleep: 5, connection: 5, focus: 5 }, 1),
      checkin({ mood: 1, energy: 1, sleep: 1, connection: 1, focus: 1 }, 2),
      checkin({ mood: 5, energy: 5, sleep: 5, connection: 5, focus: 5 }, 3),
    ], now)!;
    expect(flat.volatility).toBe(0);
    expect(swinging.volatility).toBeGreaterThan(80);
  });

  it("worse ratings never loosen a guardrail (monotone in risk)", () => {
    let previous: ReturnType<typeof assessFinancialReadiness> | null = null;
    for (let r = 5; r >= 1; r--) {
      const snap = snapshotFromWellnessCheckins([checkin({ mood: r, energy: r, sleep: r, connection: r, focus: r })], now)!;
      const profile = assessFinancialReadiness(snap, { monthlyExpenses: 10_000, liquidAssets: 200_000 });
      if (previous) {
        expect(profile.decisionCapacity).toBeLessThanOrEqual(previous.decisionCapacity);
        expect(profile.guardrails.coolingOffDays).toBeGreaterThanOrEqual(previous.guardrails.coolingOffDays);
        expect(profile.guardrails.liquidityFloorMonths).toBeGreaterThanOrEqual(previous.guardrails.liquidityFloorMonths);
        expect(profile.guardrails.leverageMultiplier).toBeLessThanOrEqual(previous.guardrails.leverageMultiplier);
      }
      previous = profile;
    }
  });

  it("never lets a clinical word reach a public screen", () => {
    const snap = snapshotFromWellnessCheckins([checkin({ mood: 1, energy: 1, sleep: 1, connection: 1, focus: 1 })], now)!;
    const withSafety = { ...snap, cssrsLevel: 5, escalationLevel: 4, observed: [...snap.observed, "cssrsLevel", "escalationLevel"] };
    for (const s of [snap, withSafety]) {
      const profile = publicSafeProfile(assessFinancialReadiness(s, { monthlyExpenses: 5_000 }));
      for (const text of profileStrings(profile)) expect(text, text).not.toMatch(PUBLIC_FORBIDDEN);
      expect(profile.clinicalNote).toBe("");
    }
    // The numbers are untouched by the rewrite.
    const raw = assessFinancialReadiness(withSafety);
    const safe = publicSafeProfile(raw);
    expect(safe.decisionCapacity).toBe(raw.decisionCapacity);
    expect(safe.guardrails).toEqual(raw.guardrails);
    expect(safe.tier).toBe(raw.tier);
  });
});

describe("a pause the person chose", () => {
  const base = assessFinancialReadiness({ sources: [], observed: [] }, { monthlyExpenses: 8_000 });

  it("locks irreversible steps while active and lengthens, never shortens, the cooling-off", () => {
    const paused = applyPause(base, { startedAt: now - 2 * day, days: 7 }, now);
    expect(paused.guardrails.irreversibleLocked).toBe(true);
    expect(paused.guardrails.coolingOffDays).toBeGreaterThanOrEqual(base.guardrails.coolingOffDays);
    expect(paused.guardrails.coolingOffDays).toBeGreaterThanOrEqual(5);
    expect(paused.decisionCapacity).toBe(base.decisionCapacity);
    expect(paused.explanation[0]).toMatch(/paused/i);
  });

  it("does nothing once it has expired, is malformed, or is absurdly long", () => {
    expect(applyPause(base, { startedAt: now - 10 * day, days: 7 }, now)).toEqual(base);
    expect(applyPause(base, { startedAt: NaN, days: 7 }, now)).toEqual(base);
    expect(applyPause(base, { startedAt: now, days: -1 }, now)).toEqual(base);
    expect(applyPause(base, null, now)).toEqual(base);
    // Capped at 90 days, so a stray value cannot lock someone out for years.
    expect(pauseActive({ startedAt: now - 91 * day, days: 100_000 }, now)).toBe(false);
  });
});

describe("clinical edition: twin history", () => {
  it("reads the domain ids the server writes, not only the legacy ones", () => {
    const vectors = vectorsFromTwin([
      { timestamp: "2026-09-01", domainScores: { moodRegulation: 80, anxietyManagement: 70, sleepQuality: 60, socialEngagement: 50 } },
      { timestamp: "2026-09-08", domainScores: { mood: 20, anxiety: 30, sleep: 40, socialFunction: 10 } },
    ], 90);
    expect(vectors[0]).toMatchObject({ moodStability: 80, anxietyBurden: 30, circadianIntegrity: 60, socialEngagement: 50, treatmentEngagement: 90 });
    expect(vectors[1]).toMatchObject({ moodStability: 20, anxietyBurden: 70, circadianIntegrity: 40, socialEngagement: 10 });
  });

  it("builds a snapshot with adherence and volatility, or nothing at all", () => {
    expect(snapshotFromTwinHistory([], null)).toBeNull();
    expect(snapshotFromTwinHistory([], 50)).toMatchObject({ sources: ["medication-log"], adherence: 0.5 });
    const snap = snapshotFromTwinHistory([
      { timestamp: "2026-09-01", domainScores: { moodRegulation: 80, anxietyManagement: 70 } },
      { timestamp: "2026-09-08", domainScores: { moodRegulation: 40, anxietyManagement: 30 } },
      { timestamp: "2026-09-15", domainScores: { moodRegulation: 70, anxietyManagement: 60 } },
      { timestamp: "bad date", domainScores: { moodRegulation: 1 } },
      { timestamp: "2026-09-16", domainScores: null },
    ], 80)!;
    expect(snap.sources).toEqual(["digital-twin", "medication-log"]);
    expect(snap.anxiety).toBe(40);
    expect(snap.moodStability).toBe(70);
    expect(snap.adherence).toBe(0.8);
    expect(snap.observed).toContain("volatility");
  });

  it("scores adherence from the medication log", () => {
    expect(adherenceFromLogs(null)).toBeNull();
    expect(adherenceFromLogs([])).toBeNull();
    expect(adherenceFromLogs([{ skipped: false }, { skipped: true }, { skipped: false }, {}])).toBe(75);
  });
});
