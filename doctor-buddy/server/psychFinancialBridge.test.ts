import { describe, expect, it } from "vitest";
import {
  assessFinancialReadiness,
  mergeSnapshots,
  readinessFromEvidence,
  snapshotFromIntake,
  snapshotFromVitalSigns,
  volatilityFromHistory,
  tierFor,
  type ClinicalSnapshot,
} from "@shared/engines/psychFinancialBridge";
import type { IntakeResult } from "@shared/intake/scoring";
import type { VitalSignsReport, VitalSignVector } from "@shared/engines/vitalSigns";
import { STRATEGIES } from "@shared/finance/strategies";
import { ALL_CALCS } from "@shared/finance/calc";

const calm: ClinicalSnapshot = {
  sources: ["test"],
  observed: ["anxiety", "moodStability", "impulsivity", "volatility", "cognitiveLoad", "adherence", "cssrsLevel", "escalationLevel", "substanceUseDays"],
  substanceUseDays: 0,
  anxiety: 15,
  moodStability: 85,
  impulsivity: 15,
  volatility: 10,
  cognitiveLoad: 10,
  adherence: 0.95,
  cssrsLevel: 0,
  escalationLevel: 0,
};

function intakeWith(domains: Record<string, number>, safety: IntakeResult["safety"]["urgency"] = "none"): IntakeResult {
  return {
    candidates: [],
    domains: Object.entries(domains).map(([domain, severity]) => ({
      domain,
      severity,
      scored: 4,
      inPlay: 4,
      coverage: 1,
      confidence: 0.8,
      screenedOut: false,
      contributingIds: [],
    })),
    safety: { flagged: safety !== "none", endorsements: [], urgency: safety },
    answered: 80,
    inPlay: 100,
    completeness: 0.8,
    clinicalNote: "",
    sufficient: true,
  };
}

function vitalReport(history: VitalSignVector[], anomaly = false): VitalSignsReport {
  const current = history[history.length - 1];
  return {
    current,
    history,
    interpretation: [],
    anomaly: { anomalyDetected: anomaly, reconstructionError: 0, threshold: 1, perIndex: [], drivingIndices: [] },
    concerning: [],
    clinicalNote: "",
  };
}

const vec = (v: number): VitalSignVector => ({
  moodStability: v,
  anxietyBurden: v,
  socialEngagement: v,
  circadianIntegrity: v,
  treatmentEngagement: v,
});

describe("psychometric-financial bridge", () => {
  it("a calm, stable, fully-observed patient is clear with plan-default guardrails", () => {
    const p = assessFinancialReadiness(calm);
    expect(p.tier).toBe("clear");
    expect(p.cappedBy).toBeNull();
    expect(p.assumptions).toEqual([]);
    expect(p.guardrails.irreversibleLocked).toBe(false);
    expect(p.guardrails.leverageMultiplier).toBe(1);
    expect(p.guardrails.coolingOffDays).toBe(1);
    expect(p.guardrails.liquidityFloorMonths).toBe(3);
    expect(p.strategies.every(s => s.status !== "blocked")).toBe(true);
    expect(p.strategies.length).toBe(STRATEGIES.length);
  });

  it("names every defaulted field instead of silently assuming it", () => {
    const p = assessFinancialReadiness({ sources: [], observed: [] });
    expect(p.assumptions).toContain("anxiety");
    expect(p.assumptions).toContain("cssrsLevel");
    expect(p.assumptions.some(a => a.startsWith("volatility"))).toBe(true);
    expect(p.clinicalNote).toContain("Defaulted (not observed)");
  });

  it("an active safety signal forces a protective hold regardless of the other indices", () => {
    const p = assessFinancialReadiness({ ...calm, cssrsLevel: 4 });
    expect(p.tier).toBe("protective-hold");
    expect(p.decisionCapacity).toBeLessThanOrEqual(15);
    expect(p.cappedBy).toMatch(/safety signal/);
    expect(p.guardrails.irreversibleLocked).toBe(true);
    expect(p.guardrails.leverageMultiplier).toBe(0);
    expect(p.guardrails.maxSingleDecisionShare).toBe(0);
    expect(p.guardrails.coolingOffDays).toBe(30);
    expect(p.guardrails.requireCoSignature).toBe(true);
    // The leveraged and irreversible strategies are blocked outright.
    const mk = p.strategies.find(s => s.slug === "mortgage-killer")!;
    const ds = p.strategies.find(s => s.slug === "divorce-shield")!;
    expect(mk.status).toBe("blocked");
    expect(ds.status).toBe("blocked");
    // No leveraged or irreversible calculator is recommended.
    const ids = p.calculators.map(c => c.id);
    expect(ids).not.toContain("policy-loan");
    expect(ids).not.toContain("roth-conversion");
    expect(ids).not.toContain("exchange-1031");
    // Protective planning stays on the table.
    expect(ids).toContain("emergency-fund");
  });

  it("crisis escalation is a safety field: the worst reading wins in a merge, whatever the order", () => {
    const quiet: ClinicalSnapshot = { sources: ["b"], observed: ["escalationLevel"], escalationLevel: 0 };
    const loud: ClinicalSnapshot = { sources: ["a"], observed: ["escalationLevel"], escalationLevel: 3 };
    expect(mergeSnapshots(loud, quiet).escalationLevel).toBe(3);
    expect(mergeSnapshots(quiet, loud).escalationLevel).toBe(3);
    // Ordinary fields: later source overrides.
    const a: ClinicalSnapshot = { sources: ["a"], observed: ["anxiety"], anxiety: 20 };
    const b: ClinicalSnapshot = { sources: ["b"], observed: ["anxiety"], anxiety: 70 };
    expect(mergeSnapshots(a, b).anxiety).toBe(70);
    expect(mergeSnapshots(b, a).anxiety).toBe(20);
    expect(mergeSnapshots(a, b).sources).toEqual(["a", "b"]);
  });

  it("rising anxiety never raises decision capacity and tightens the liquidity floor", () => {
    let last = Infinity;
    for (const anxiety of [10, 30, 50, 70, 90]) {
      const p = assessFinancialReadiness({ ...calm, anxiety });
      expect(p.decisionCapacity).toBeLessThanOrEqual(last);
      last = p.decisionCapacity;
    }
    const anxious = assessFinancialReadiness({ ...calm, anxiety: 75 });
    expect(anxious.guardrails.liquidityFloorMonths).toBeGreaterThanOrEqual(6);
    expect(anxious.guardrails.preferFloorProducts).toBe(true);
  });

  it("high volatility limits borrowing and defers the leveraged strategy", () => {
    const p = assessFinancialReadiness({ ...calm, volatility: 80, impulsivity: 60 });
    expect(p.guardrails.leverageMultiplier).toBeLessThan(1);
    expect(p.guardrails.preferAutomation).toBe(true);
    expect(p.guardrails.liquidityFloorMonths).toBeGreaterThanOrEqual(9);
    const mk = p.strategies.find(s => s.slug === "mortgage-killer")!;
    expect(["deferred", "conditional", "blocked"]).toContain(mk.status);
  });

  it("turns dollars out of the fact-finder context", () => {
    const p = assessFinancialReadiness(calm, { monthlyExpenses: 10_000, liquidAssets: 400_000 });
    expect(p.guardrails.liquidityFloorDollars).toBe(30_000);
    expect(p.guardrails.maxSingleDecisionDollars).toBe(100_000);
  });

  it("is deterministic", () => {
    const a = assessFinancialReadiness({ ...calm, anxiety: 42, volatility: 33 });
    const b = assessFinancialReadiness({ ...calm, anxiety: 42, volatility: 33 });
    expect(a).toEqual(b);
  });

  it("tier boundaries", () => {
    expect(tierFor(90)).toBe("clear");
    expect(tierFor(75)).toBe("clear");
    expect(tierFor(74.9)).toBe("measured");
    expect(tierFor(50)).toBe("measured");
    expect(tierFor(49)).toBe("guarded");
    expect(tierFor(24)).toBe("protective-hold");
  });
});

describe("adapters", () => {
  it("reads anxiety, mood and impulsivity from an intake and refuses to invent volatility", () => {
    const snap = snapshotFromIntake(intakeWith({ Anxiety: 65, Depression: 40, Bipolar: 70, ADHD: 20 }));
    expect(snap.anxiety).toBe(65);
    expect(snap.moodStability).toBe(30); // 100 - max(40, 70)
    expect(snap.impulsivity).toBe(70);
    expect(snap.volatility).toBeUndefined();
    expect(snap.observed).not.toContain("volatility");
    // A completed intake with no safety endorsement is evidence of level 0.
    expect(snap.cssrsLevel).toBe(0);
  });

  it("maps an immediate safety endorsement to a C-SSRS floor of 4, which forces a hold downstream", () => {
    const snap = snapshotFromIntake(intakeWith({ Anxiety: 10 }, "immediate"));
    expect(snap.cssrsLevel).toBe(4);
    const p = assessFinancialReadiness(snap);
    expect(p.tier).toBe("protective-hold");
  });

  it("volatility of a flat series is zero and of a swinging series is high", () => {
    expect(volatilityFromHistory([vec(60), vec(60), vec(60), vec(60)])).toBe(0);
    const swing = volatilityFromHistory([vec(30), vec(70), vec(30), vec(70), vec(30)])!;
    expect(swing).toBeGreaterThan(60);
    expect(volatilityFromHistory([vec(60), vec(61)])).toBeNull();
  });

  it("reads vital signs as higher-is-healthier and flags an anomaly as motion", () => {
    const history = [vec(70), vec(71), vec(70), vec(72)];
    const snap = snapshotFromVitalSigns(vitalReport(history));
    expect(snap.anxiety).toBe(28); // 100 - anxietyBurden 72
    expect(snap.moodStability).toBe(72);
    expect(snap.adherence).toBeCloseTo(0.72, 5);
    expect(snap.volatility).toBeLessThan(10);
    const flagged = snapshotFromVitalSigns(vitalReport(history, true));
    expect(flagged.volatility).toBeGreaterThanOrEqual(55);
  });

  it("readinessFromEvidence lets longitudinal vital signs outrank an intake for ordinary fields", () => {
    const intake = intakeWith({ Anxiety: 80 });
    const vitals = vitalReport([vec(80), vec(80), vec(80), vec(80)]); // anxietyBurden 80 → anxiety 20
    const p = readinessFromEvidence({ intake, vitalSigns: vitals });
    expect(p.anxietyIndex).toBe(20);
    expect(p.sources).toEqual(["dsm5-intake", "vital-signs"]);
  });

  it("every recommended calculator id exists in the catalogue", () => {
    const p = assessFinancialReadiness(calm);
    const known = new Set(ALL_CALCS.map(c => c.id));
    for (const c of p.calculators) expect(known.has(c.id)).toBe(true);
    expect(p.calculators.length).toBeGreaterThan(10);
  });
});
