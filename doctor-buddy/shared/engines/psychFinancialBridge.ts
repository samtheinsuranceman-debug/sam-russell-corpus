/**
 * Psychometric-Financial Bridge.
 *
 * The one thing no financial planning tool does: read the person's clinical
 * state before it reads their balance sheet. A strategy that is right on paper
 * is wrong for a patient in a crisis window, and a leveraged arbitrage that a
 * stable client executes calmly is a loaded weapon for someone whose vital
 * signs are swinging twenty points a week.
 *
 * This module turns the platform's clinical engines — the DSM-5 intake, the
 * vital-signs monitor, the crisis detector, the risk scorer, the mental credit
 * score — into three indices a financial engine can act on, then derives the
 * guardrails and the strategy gating from them.
 *
 *   anxietyIndex     0-100  how much the person is carrying right now
 *   stabilityIndex   0-100  how steady mood, control and engagement are
 *   volatilityIndex  0-100  how fast the picture is moving
 *
 * Design rules, in order of precedence:
 *
 *   1. Disclosure outranks behaviour. A stated safety signal (C-SSRS, crisis
 *      escalation) caps decision capacity no matter how good every other index
 *      looks. A protective hold cannot be argued out of by a strong balance
 *      sheet.
 *   2. Guardrails only ever tighten. Nothing in the clinical picture can raise
 *      leverage above the plan's own default or shorten a cooling-off period
 *      below it.
 *   3. Assumptions are named. Every field the snapshot did not observe is
 *      defaulted to a population-typical value AND listed in `assumptions`,
 *      so the reader knows which parts of the profile rest on data that was
 *      never collected.
 *   4. Deterministic. Same snapshot, same profile. No randomness, no clock.
 *
 * None of this is a diagnosis or a suitability determination. It is a set of
 * constraints a licensed advisor and a treating clinician review together.
 */

import type { IntakeResult } from "../intake/scoring";
import type { DerivedRiskFeatures } from "../intake/riskFeatures";
import type { VitalSignsReport, VitalSignVector } from "./vitalSigns";
import type { CrisisAssessment } from "./crisisDetection";
import type { RiskAssessment } from "./riskScoring";
import type { MCSResult, RiskZone } from "./mentalCreditScore";
import { STRATEGIES, type Strategy } from "../finance/strategies";
import { ALL_CALCS, type CalcDef } from "../finance/calc";

// ─── Clinical snapshot ────────────────────────────────────────────────────────

/**
 * Everything the bridge reads, normalised to one shape. Every clinical field is
 * optional: an adapter fills what its source genuinely observes and nothing
 * else. `observed` records which fields came from data.
 */
export interface ClinicalSnapshot {
  /** 0-100, higher = more anxious. */
  anxiety?: number;
  /** 0-100, higher = steadier mood. */
  moodStability?: number;
  /** 0-100, higher = more impulsive / less behavioural control. */
  impulsivity?: number;
  /** 0-100, how fast the clinical picture is moving. Longitudinal only. */
  volatility?: number;
  /** 0-100, rumination / intrusive-thought burden. */
  cognitiveLoad?: number;
  /** Treatment engagement / medication adherence, 0-1. */
  adherence?: number;
  /** Automated C-SSRS level, 0-5. */
  cssrsLevel?: number;
  /** Crisis escalation level, 0-4. */
  escalationLevel?: number;
  /** Ensemble risk band from the risk scorer. */
  riskBand?: RiskAssessment["band"];
  /** Mental credit score zone. */
  mcsZone?: RiskZone;
  /** Substance use days in the trailing 30. */
  substanceUseDays?: number;
  /** Where each value came from, for the audit trail. */
  sources: string[];
  /** Field names that were measured rather than defaulted. */
  observed: string[];
}

export const EMPTY_SNAPSHOT: ClinicalSnapshot = { sources: [], observed: [] };

/** Population-typical values, used only where nothing was observed. */
export const NEUTRAL: Required<
  Pick<
    ClinicalSnapshot,
    | "anxiety"
    | "moodStability"
    | "impulsivity"
    | "volatility"
    | "cognitiveLoad"
    | "adherence"
    | "cssrsLevel"
    | "escalationLevel"
    | "substanceUseDays"
  >
> = {
  anxiety: 35,
  moodStability: 60,
  impulsivity: 30,
  volatility: 25,
  cognitiveLoad: 30,
  adherence: 0.85,
  cssrsLevel: 0,
  escalationLevel: 0,
  substanceUseDays: 0,
};

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

// ─── Adapters ─────────────────────────────────────────────────────────────────

function domainSeverity(intake: IntakeResult, domain: string): number | null {
  const d = intake.domains.find(x => x.domain === domain);
  if (!d || d.scored === 0 || d.screenedOut) return null;
  return d.severity;
}

/**
 * From a scored DSM-5 intake. A questionnaire is a single point in time, so
 * it can establish anxiety, mood and impulsivity but never volatility — that
 * needs a series. Volatility is left unobserved here on purpose.
 */
export function snapshotFromIntake(intake: IntakeResult, derived?: DerivedRiskFeatures): ClinicalSnapshot {
  const snap: ClinicalSnapshot = { sources: ["dsm5-intake"], observed: [] };

  const anxiety = domainSeverity(intake, "Anxiety");
  if (anxiety !== null) {
    snap.anxiety = anxiety;
    snap.observed.push("anxiety");
  }

  const depression = domainSeverity(intake, "Depression");
  const bipolar = domainSeverity(intake, "Bipolar");
  const moodParts = [depression, bipolar].filter((x): x is number => x !== null);
  if (moodParts.length > 0) {
    snap.moodStability = clamp(100 - Math.max(...moodParts));
    snap.observed.push("moodStability");
  }

  // Impulsivity is the shared signal of four domains; take the strongest so a
  // single severe presentation is not diluted by three quiet ones.
  const impulsiveParts = ["Bipolar", "ADHD", "Substance Use", "Personality"]
    .map(d => domainSeverity(intake, d))
    .filter((x): x is number => x !== null);
  if (impulsiveParts.length > 0) {
    snap.impulsivity = Math.max(...impulsiveParts);
    snap.observed.push("impulsivity");
  }

  const loadParts = ["OCD", "PTSD"].map(d => domainSeverity(intake, d)).filter((x): x is number => x !== null);
  if (loadParts.length > 0) {
    snap.cognitiveLoad = Math.max(...loadParts);
    snap.observed.push("cognitiveLoad");
  }

  if (derived) {
    if (derived.observed.includes("cssrsLevel")) {
      snap.cssrsLevel = derived.features.cssrsLevel;
      snap.observed.push("cssrsLevel");
    }
    if (derived.observed.includes("substanceUseDays")) {
      snap.substanceUseDays = derived.features.substanceUseDays;
      snap.observed.push("substanceUseDays");
    }
  } else if (intake.safety.flagged) {
    // The two safety items give a floor, never a precise level.
    snap.cssrsLevel = intake.safety.urgency === "immediate" ? 4 : 1;
    snap.observed.push("cssrsLevel");
  } else if (intake.completeness > 0) {
    snap.cssrsLevel = 0;
    snap.observed.push("cssrsLevel");
  }

  return snap;
}

/**
 * Volatility of a vital-signs series: mean absolute successive difference
 * across the indices, on the 0-100 standardised scale. A flat series is 0; a
 * series that swings a full standard deviation (15 points) every step reads
 * as roughly 60; anything at or past two standard deviations saturates.
 */
export function volatilityFromHistory(history: VitalSignVector[]): number | null {
  if (history.length < 3) return null;
  let total = 0;
  let count = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const cur = history[i];
    for (const key of Object.keys(cur) as Array<keyof VitalSignVector>) {
      if (typeof prev[key] !== "number" || typeof cur[key] !== "number") continue;
      total += Math.abs(cur[key] - prev[key]);
      count++;
    }
  }
  if (count === 0) return null;
  const masd = total / count;
  return round1(clamp((masd / 25) * 100));
}

/** From the vital-signs monitor. Every index there is "higher is healthier". */
export function snapshotFromVitalSigns(report: VitalSignsReport): ClinicalSnapshot {
  const snap: ClinicalSnapshot = { sources: ["vital-signs"], observed: [] };
  const v = report.current;

  if (typeof v.anxietyBurden === "number") {
    snap.anxiety = clamp(100 - v.anxietyBurden);
    snap.observed.push("anxiety");
  }
  if (typeof v.moodStability === "number") {
    snap.moodStability = clamp(v.moodStability);
    snap.observed.push("moodStability");
  }
  if (typeof v.treatmentEngagement === "number") {
    snap.adherence = clamp(v.treatmentEngagement) / 100;
    snap.observed.push("adherence");
  }

  const vol = volatilityFromHistory(report.history);
  if (vol !== null) {
    // An anomaly flag is a step change the reconstruction could not explain;
    // it counts as motion even when the running average looks calm.
    snap.volatility = report.anomaly?.anomalyDetected ? clamp(Math.max(vol, 55)) : vol;
    snap.observed.push("volatility");
  }
  return snap;
}

/** From the crisis detector. Only the safety channel; nothing else is read. */
export function snapshotFromCrisis(assessment: CrisisAssessment): ClinicalSnapshot {
  return {
    sources: ["crisis-detection"],
    observed: ["cssrsLevel", "escalationLevel"],
    cssrsLevel: assessment.current.cssrsLevel,
    escalationLevel: assessment.escalation.level,
  };
}

export function snapshotFromRisk(assessment: RiskAssessment): ClinicalSnapshot {
  return { sources: ["risk-scoring"], observed: ["riskBand"], riskBand: assessment.band };
}

export function snapshotFromMCS(result: MCSResult): ClinicalSnapshot {
  return { sources: ["mental-credit-score"], observed: ["mcsZone"], mcsZone: result.riskZone };
}

const SAFETY_FIELDS = ["cssrsLevel", "escalationLevel"] as const;

/**
 * Merge snapshots. Later sources override earlier ones for ordinary fields, so
 * callers list the less reliable source first (an intake) and the more
 * reliable one last (longitudinal vital signs). Safety fields are different:
 * the worst reading wins regardless of order, because disclosure outranks
 * behaviour and a quieter later source must not erase a stated signal.
 */
export function mergeSnapshots(...parts: ClinicalSnapshot[]): ClinicalSnapshot {
  const out: ClinicalSnapshot = { sources: [], observed: [] };
  for (const p of parts) {
    for (const s of p.sources) if (!out.sources.includes(s)) out.sources.push(s);
    for (const key of Object.keys(p) as Array<keyof ClinicalSnapshot>) {
      if (key === "sources" || key === "observed") continue;
      const value = p[key];
      if (value === undefined) continue;
      if ((SAFETY_FIELDS as readonly string[]).includes(key)) {
        const prev = out[key as "cssrsLevel" | "escalationLevel"];
        out[key as "cssrsLevel" | "escalationLevel"] =
          prev === undefined ? (value as number) : Math.max(prev, value as number);
      } else {
        (out as unknown as Record<string, unknown>)[key] = value;
      }
      if (!out.observed.includes(key)) out.observed.push(key);
    }
  }
  return out;
}

// ─── Financial context (optional) ─────────────────────────────────────────────

/** What the fact finder knows. All optional; used to turn ratios into dollars. */
export interface FinancialContext {
  monthlyExpenses?: number;
  liquidAssets?: number;
  annualIncome?: number;
  totalDebt?: number;
  homeEquity?: number;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export type DecisionTier = "clear" | "measured" | "guarded" | "protective-hold";

export interface FinancialGuardrails {
  /** Days between deciding and executing anything that cannot be undone. */
  coolingOffDays: number;
  /** True: no irreversible financial action is to be initiated at all. */
  irreversibleLocked: boolean;
  /** Months of expenses that stay liquid before any strategy is funded. */
  liquidityFloorMonths: number;
  /** In dollars when monthlyExpenses is known. */
  liquidityFloorDollars: number | null;
  /** Multiplier on the plan's own leverage limit, 0-1. 0 means no borrowing. */
  leverageMultiplier: number;
  /** Largest share of liquid assets one decision may commit. */
  maxSingleDecisionShare: number;
  maxSingleDecisionDollars: number | null;
  /** Weight products with a contractual floor over market-exposed ones. */
  preferFloorProducts: boolean;
  /** Set contributions to run automatically rather than decision-by-decision. */
  preferAutomation: boolean;
  /** A second person — advisor plus treating clinician — signs off. */
  requireCoSignature: boolean;
  /** How often the profile is re-run against fresh clinical data. */
  reviewCadenceDays: number;
}

export type StrategyStatus = "recommended" | "conditional" | "deferred" | "blocked";

export interface StrategyGate {
  slug: string;
  title: string;
  status: StrategyStatus;
  /** 0-100 fit after the clinical penalties. */
  fit: number;
  reasons: string[];
}

export interface CalculatorRecommendation {
  id: string;
  name: string;
  category: string;
  /** Why it is on the list now. */
  reason: string;
}

export interface FinancialReadinessProfile {
  anxietyIndex: number;
  stabilityIndex: number;
  volatilityIndex: number;
  /** 0-100. The single number the rest of the plan hangs off. */
  decisionCapacity: number;
  tier: DecisionTier;
  /** What capped decisionCapacity, when a safety rule did. */
  cappedBy: string | null;
  guardrails: FinancialGuardrails;
  strategies: StrategyGate[];
  calculators: CalculatorRecommendation[];
  /** Fields that were defaulted, never measured. */
  assumptions: string[];
  /** For the advisor and the clinician, not the patient. */
  clinicalNote: string;
  /** Plain-language explanation for the person. */
  explanation: string[];
  sources: string[];
}

/** Attributes of each strategy the gating reasons over. All 0-1. */
export interface StrategyRiskProfile {
  irreversibility: number;
  leverage: number;
  complexity: number;
  marketExposure: number;
  /** Years before the strategy pays for itself. */
  horizonYears: number;
}

export const STRATEGY_RISK: Record<string, StrategyRiskProfile> = {
  "tax-free-retirement": { irreversibility: 0.6, leverage: 0.0, complexity: 0.5, marketExposure: 0.4, horizonYears: 10 },
  "mortgage-killer": { irreversibility: 0.5, leverage: 0.9, complexity: 0.7, marketExposure: 0.5, horizonYears: 7 },
  "divorce-shield": { irreversibility: 0.9, leverage: 0.1, complexity: 0.8, marketExposure: 0.2, horizonYears: 5 },
  "estate-legacy": { irreversibility: 0.9, leverage: 0.2, complexity: 0.8, marketExposure: 0.3, horizonYears: 15 },
  "business-owners": { irreversibility: 0.5, leverage: 0.4, complexity: 0.7, marketExposure: 0.4, horizonYears: 5 },
  physicians: { irreversibility: 0.4, leverage: 0.3, complexity: 0.6, marketExposure: 0.4, horizonYears: 8 },
};

const DEFAULT_STRATEGY_RISK: StrategyRiskProfile = {
  irreversibility: 0.5,
  leverage: 0.3,
  complexity: 0.5,
  marketExposure: 0.4,
  horizonYears: 7,
};

/** Calculators that model borrowing or irreversible moves, by id fragment. */
const LEVERAGE_MARKERS = ["heloc", "arbitrage", "premium-financ", "policy-loan", "equity-into", "banking-income", "leverage", "margin"];
const IRREVERSIBLE_MARKERS = [
  "roth-conversion", "1035", "1031", "surrender", "annuit", "ilit", "trust", "gift",
  "generational-transfer", "pension-vs-lump", "sale",
];
const PROTECTIVE_CATEGORIES = new Set(["Protection", "Debt & Mortgage", "Retirement"]);

function hasMarker(calc: CalcDef, markers: string[]): boolean {
  const hay = `${calc.id} ${calc.name}`.toLowerCase();
  return markers.some(m => hay.includes(m));
}

/** What a calculator models, so a page can show the matching guardrail. */
export function calculatorFlags(calc: CalcDef): { leverage: boolean; irreversible: boolean; protective: boolean } {
  const leverage = hasMarker(calc, LEVERAGE_MARKERS);
  const irreversible = hasMarker(calc, IRREVERSIBLE_MARKERS);
  return { leverage, irreversible, protective: PROTECTIVE_CATEGORIES.has(calc.category) && !leverage && !irreversible };
}

export function tierFor(capacity: number): DecisionTier {
  if (capacity < 25) return "protective-hold";
  if (capacity < 50) return "guarded";
  if (capacity < 75) return "measured";
  return "clear";
}

const TIER_ORDER: DecisionTier[] = ["protective-hold", "guarded", "measured", "clear"];
const tierRank = (t: DecisionTier) => TIER_ORDER.indexOf(t);

// ─── The bridge ───────────────────────────────────────────────────────────────

/** A dollar figure the guardrails can use: finite and non-negative, else absent. */
function dollars(v: unknown): number | undefined {
  // Capped at ten trillion: multiplying two figures must stay finite.
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.min(v, 1e13) : undefined;
}

export function assessFinancialReadiness(
  snapshot: ClinicalSnapshot,
  rawContext: FinancialContext = {},
): FinancialReadinessProfile {
  const src = (rawContext && typeof rawContext === "object" ? rawContext : {}) as FinancialContext;
  const context: FinancialContext = {
    monthlyExpenses: dollars(src.monthlyExpenses),
    liquidAssets: dollars(src.liquidAssets),
    annualIncome: dollars(src.annualIncome),
    totalDebt: dollars(src.totalDebt),
    homeEquity: typeof src.homeEquity === "number" && Number.isFinite(src.homeEquity) ? src.homeEquity : undefined,
  };
  snapshot = snapshot && typeof snapshot === "object" ? snapshot : EMPTY_SNAPSHOT;
  const assumptions: string[] = [];
  // The snapshot may come from a browser or a fuzzer: tolerate a missing or
  // malformed source list rather than trusting the type.
  const sources = Array.isArray(snapshot?.sources) ? snapshot.sources.filter((s): s is string => typeof s === "string") : [];
  const get = <K extends keyof typeof NEUTRAL>(key: K): number => {
    const v = snapshot[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    assumptions.push(key);
    return NEUTRAL[key];
  };

  const anxiety = clamp(get("anxiety"));
  const moodStability = clamp(get("moodStability"));
  const impulsivity = clamp(get("impulsivity"));
  const cognitiveLoad = clamp(get("cognitiveLoad"));
  const adherence = clamp(get("adherence"), 0, 1);
  const cssrs = clamp(get("cssrsLevel"), 0, 5);
  const escalation = clamp(get("escalationLevel"), 0, 4);
  const substanceDays = clamp(get("substanceUseDays"), 0, 30);

  // Volatility needs a series. When the snapshot has none, derive a proxy
  // from the cross-sectional picture and say so.
  let volatility: number;
  if (typeof snapshot.volatility === "number" && Number.isFinite(snapshot.volatility)) {
    volatility = clamp(snapshot.volatility);
  } else {
    volatility = clamp(0.5 * impulsivity + 0.3 * anxiety + 0.2 * (100 - moodStability));
    assumptions.push("volatility (derived from cross-sectional signals; no series observed)");
  }

  const anxietyIndex = round1(anxiety);
  const stabilityIndex = round1(
    clamp(0.5 * moodStability + 0.3 * (100 - impulsivity) + 0.2 * adherence * 100 - substanceDays * 0.5),
  );
  const volatilityIndex = round1(volatility);

  // Base capacity from the three indices plus cognitive load.
  let capacity = clamp(
    100 - (0.35 * anxietyIndex + 0.3 * volatilityIndex + 0.25 * (100 - stabilityIndex) + 0.1 * cognitiveLoad),
  );

  // Safety caps. These can only lower capacity — rule 1.
  let cappedBy: string | null = null;
  const cap = (limit: number, why: string) => {
    if (capacity > limit) {
      capacity = limit;
      cappedBy = why;
    }
  };
  if (cssrs >= 4 || escalation >= 3) cap(15, "active safety signal (C-SSRS ≥ 4 or escalation ≥ 3)");
  else if (cssrs >= 2 || escalation === 2) cap(40, "elevated safety signal (C-SSRS 2-3 or escalation 2)");
  else if (cssrs === 1 || escalation === 1) cap(60, "passive ideation or watch-level escalation");
  if (snapshot.riskBand === "severe") cap(30, "risk scorer: severe band");
  else if (snapshot.riskBand === "high") cap(50, "risk scorer: high band");
  if (snapshot.mcsZone === "critical") cap(30, "mental credit score: critical zone");
  else if (snapshot.mcsZone === "elevated") cap(55, "mental credit score: elevated zone");

  const decisionCapacity = round1(capacity);
  const tier = tierFor(decisionCapacity);

  // ── Guardrails. Every one tightens with the tier and never loosens past the
  //    plan's own default (tier "clear").
  const byTier = <T>(clear: T, measured: T, guarded: T, hold: T): T =>
    tier === "clear" ? clear : tier === "measured" ? measured : tier === "guarded" ? guarded : hold;

  let liquidityFloorMonths = byTier(3, 4, 6, 12);
  if (anxietyIndex > 60) liquidityFloorMonths = Math.max(liquidityFloorMonths, 6);
  if (volatilityIndex > 60) liquidityFloorMonths = Math.max(liquidityFloorMonths, 9);

  const guardrails: FinancialGuardrails = {
    coolingOffDays: byTier(1, 3, 14, 30),
    irreversibleLocked: tier === "protective-hold",
    liquidityFloorMonths,
    liquidityFloorDollars:
      typeof context.monthlyExpenses === "number" ? Math.round(context.monthlyExpenses * liquidityFloorMonths) : null,
    leverageMultiplier: byTier(1, 0.6, 0.25, 0),
    maxSingleDecisionShare: byTier(0.25, 0.15, 0.08, 0),
    maxSingleDecisionDollars: null,
    preferFloorProducts: anxietyIndex > 55 || volatilityIndex > 55 || tierRank(tier) <= tierRank("guarded"),
    preferAutomation: volatilityIndex > 45 || impulsivity > 50,
    requireCoSignature: tierRank(tier) <= tierRank("guarded"),
    reviewCadenceDays: byTier(90, 60, 30, 7),
  };
  if (typeof context.liquidAssets === "number") {
    guardrails.maxSingleDecisionDollars = Math.round(context.liquidAssets * guardrails.maxSingleDecisionShare);
  }

  // ── Strategy gating.
  const strategies: StrategyGate[] = STRATEGIES.map((s: Strategy) => {
    const risk = STRATEGY_RISK[s.slug] ?? DEFAULT_STRATEGY_RISK;
    const reasons: string[] = [];

    // Penalties: each clinical index bites the attribute it endangers.
    const leveragePenalty = risk.leverage * (100 - guardrails.leverageMultiplier * 100) * 0.6;
    const irreversiblePenalty = risk.irreversibility * (anxietyIndex * 0.35 + volatilityIndex * 0.35);
    const complexityPenalty = risk.complexity * (cognitiveLoad * 0.3 + (100 - stabilityIndex) * 0.2);
    const marketPenalty = risk.marketExposure * (guardrails.preferFloorProducts ? 20 : 5);
    const fit = round1(clamp(100 - leveragePenalty - irreversiblePenalty - complexityPenalty - marketPenalty));

    let status: StrategyStatus;
    if (guardrails.irreversibleLocked && (risk.irreversibility >= 0.5 || risk.leverage >= 0.5)) {
      status = "blocked";
      reasons.push("Protective hold: nothing irreversible or leveraged is initiated while a safety signal is active.");
    } else if (risk.leverage >= 0.5 && guardrails.leverageMultiplier < 0.5) {
      status = "deferred";
      reasons.push(`Borrowing capacity is limited to ${Math.round(guardrails.leverageMultiplier * 100)}% of the plan default at this tier.`);
    } else if (fit >= 70) {
      status = "recommended";
    } else if (fit >= 45) {
      status = "conditional";
    } else {
      status = "deferred";
    }

    if (risk.irreversibility >= 0.6 && guardrails.coolingOffDays >= 14 && status !== "blocked") {
      reasons.push(`Irreversible steps wait ${guardrails.coolingOffDays} days between decision and execution.`);
    }
    if (risk.marketExposure >= 0.4 && guardrails.preferFloorProducts) {
      reasons.push("Contractual-floor products are weighted ahead of market-exposed ones for this profile.");
    }
    if (risk.complexity >= 0.7 && cognitiveLoad > 50) {
      reasons.push("High complexity while cognitive load is elevated — implement in stages, one decision per review.");
    }
    if (reasons.length === 0) {
      if (status === "recommended") reasons.push("Fits the current clinical picture without special conditions.");
      else if (status === "conditional") reasons.push(`Fit ${fit} of 100 — usable inside the guardrails above, reviewed every ${guardrails.reviewCadenceDays} days.`);
      else reasons.push(`Fit ${fit} of 100 — below the threshold for this profile; revisit at the next review.`);
    }

    return { slug: s.slug, title: s.title, status, fit, reasons };
  }).sort((a, b) => b.fit - a.fit);

  // ── Calculator recommendations. Data-driven from the strategies that are
  //    open, plus a protective set that is always on the table.
  const calculators: CalculatorRecommendation[] = [];
  const seen = new Set<string>();
  const push = (calc: CalcDef, reason: string) => {
    if (seen.has(calc.id)) return;
    seen.add(calc.id);
    calculators.push({ id: calc.id, name: calc.name, category: calc.category, reason });
  };

  const openSlugs = new Set(strategies.filter(s => s.status === "recommended" || s.status === "conditional").map(s => s.slug));
  for (const calc of ALL_CALCS) {
    if (PROTECTIVE_CATEGORIES.has(calc.category) && !hasMarker(calc, LEVERAGE_MARKERS) && !hasMarker(calc, IRREVERSIBLE_MARKERS)) {
      push(calc, "Protective planning — appropriate at every tier.");
    }
  }
  for (const s of STRATEGIES) {
    if (!openSlugs.has(s.slug)) continue;
    for (const id of s.calculators) {
      const calc = ALL_CALCS.find(c => c.id === id);
      if (!calc) continue;
      if (guardrails.leverageMultiplier < 0.5 && hasMarker(calc, LEVERAGE_MARKERS)) continue;
      if (guardrails.irreversibleLocked && hasMarker(calc, IRREVERSIBLE_MARKERS)) continue;
      push(calc, `Part of ${s.title}, which is ${strategies.find(g => g.slug === s.slug)?.status ?? "open"} for this profile.`);
    }
  }

  // ── Narrative.
  const explanation: string[] = [];
  explanation.push(
    `Decision capacity is ${decisionCapacity} of 100 — ${tier.replace("-", " ")}.` +
      (cappedBy ? ` It was capped by: ${cappedBy}.` : ""),
  );
  explanation.push(
    `Anxiety ${anxietyIndex}, stability ${stabilityIndex}, volatility ${volatilityIndex}. ` +
      `Keep ${liquidityFloorMonths} months of expenses liquid before funding any strategy.`,
  );
  if (guardrails.irreversibleLocked) {
    explanation.push("Nothing that cannot be undone is started right now. Education and protection planning continue; execution waits.");
  } else {
    explanation.push(
      `Anything irreversible waits ${guardrails.coolingOffDays} day${guardrails.coolingOffDays === 1 ? "" : "s"} between deciding and doing. ` +
        `No single move commits more than ${Math.round(guardrails.maxSingleDecisionShare * 100)}% of liquid assets.`,
    );
  }
  if (guardrails.preferFloorProducts) explanation.push("Products with a contractual floor are favoured over market-exposed ones.");
  if (guardrails.requireCoSignature) explanation.push("Your advisor and your clinician both sign off before anything executes.");

  const clinicalNote =
    `Bridge profile from ${sources.join(", ") || "no clinical source"}: capacity ${decisionCapacity} (${tier})` +
    (cappedBy ? `, capped by ${cappedBy}` : "") +
    `. Indices — anxiety ${anxietyIndex}, stability ${stabilityIndex}, volatility ${volatilityIndex}. ` +
    (assumptions.length > 0
      ? `Defaulted (not observed): ${assumptions.join("; ")}. `
      : "All inputs observed. ") +
    `Guardrails: cooling-off ${guardrails.coolingOffDays}d, liquidity floor ${liquidityFloorMonths}mo, leverage ×${guardrails.leverageMultiplier}, ` +
    `max single decision ${Math.round(guardrails.maxSingleDecisionShare * 100)}%, review every ${guardrails.reviewCadenceDays}d. ` +
    `Strategies: ${strategies.map(s => `${s.title}=${s.status}`).join(", ")}. ` +
    `This is a constraint set for advisor–clinician review, not a suitability determination.`;

  return {
    anxietyIndex,
    stabilityIndex,
    volatilityIndex,
    decisionCapacity,
    tier,
    cappedBy,
    guardrails,
    strategies,
    calculators,
    assumptions,
    clinicalNote,
    explanation,
    sources,
  };
}

/**
 * Convenience: run the whole pipeline from whatever clinical evidence exists.
 * Order matters only for non-safety fields — see mergeSnapshots.
 */
export function readinessFromEvidence(
  evidence: {
    intake?: IntakeResult;
    derived?: DerivedRiskFeatures;
    vitalSigns?: VitalSignsReport;
    crisis?: CrisisAssessment;
    risk?: RiskAssessment;
    mcs?: MCSResult;
  },
  context: FinancialContext = {},
): FinancialReadinessProfile {
  const parts: ClinicalSnapshot[] = [];
  if (evidence.intake) parts.push(snapshotFromIntake(evidence.intake, evidence.derived));
  if (evidence.vitalSigns) parts.push(snapshotFromVitalSigns(evidence.vitalSigns));
  if (evidence.crisis) parts.push(snapshotFromCrisis(evidence.crisis));
  if (evidence.risk) parts.push(snapshotFromRisk(evidence.risk));
  if (evidence.mcs) parts.push(snapshotFromMCS(evidence.mcs));
  return assessFinancialReadiness(parts.length > 0 ? mergeSnapshots(...parts) : EMPTY_SNAPSHOT, context);
}
