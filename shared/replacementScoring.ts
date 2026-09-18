/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REPLACEMENT OPPORTUNITY SCORING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Thinks like a senior annuity advisor. Takes an existing contract and scores
 * it 0-100 on whether the client should replace it — factoring in surrender
 * economics, bonus uplift, income improvement, carrier strength, and
 * state-specific guaranty headroom.
 *
 * The score is NOT a simple comparison. It models the *breakeven timeline* —
 * how many months until the new contract's benefits overcome the cost of
 * leaving the old one. A score of 100 means "replace yesterday." A score of
 * 0 means "this contract is irreplaceable."
 *
 * Usage:
 *   import { scoreReplacementOpportunity } from "@shared/replacementScoring";
 *   const result = scoreReplacementOpportunity(existingContract, stateCode);
 *   // result.score (0-100), result.verdict, result.topCandidates[], result.factors{}
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  ALL_ANNUITY_PRODUCTS,
  getTopProductsForState,
  getStateGuaranty,
  type AnnuityProduct,
  type StateCode,
  type AnnuityCategory,
} from "./annuityData";

// ── Types ────────────────────────────────────────────────────────────────

export interface ExistingContract {
  /** Current account value */
  accountValue: number;
  /** Current surrender value (after penalties) */
  surrenderValue: number;
  /** Years the contract has been in force */
  yearsInForce: number;
  /** Total surrender period (e.g. 10 years) */
  surrenderPeriodYears: number;
  /** Current surrender penalty percentage */
  surrenderPenaltyPct: number;
  /** Current guaranteed monthly income (if income rider active) */
  currentMonthlyIncome: number;
  /** Current carrier AM Best rating (e.g. "A+", "A-", "B++") */
  carrierRating: string;
  /** Current carrier Comdex score (0-100) */
  carrierComdex: number;
  /** Current rollup rate (if applicable) */
  rollupRate: number;
  /** Current premium bonus percentage received */
  premiumBonusPct: number;
  /** Category of existing product */
  category: AnnuityCategory;
  /** Client's current age */
  clientAge: number;
  /** Account type for tax implications */
  accountType: "taxfree" | "ira" | "401k" | "403b" | "tsp";
  /** Carrier name */
  carrierName: string;
  /** Product name */
  productName: string;
  /** Market Value Adjustment (MVA) amount if applicable */
  mvaAmount?: number;
  /** Filing status for tax calculations */
  filingStatus?: "single" | "married";
  /** Other taxable income for tax bracket estimation */
  otherTaxableIncome?: number;
  /** State tax rate */
  stateTaxRate?: number;
}

export type Verdict = "REPLACE_NOW" | "STRONG_CANDIDATE" | "MONITOR" | "LIKELY_KEEP" | "KEEP";

export interface ReplacementFactor {
  /** Factor name */
  name: string;
  /** Points contributed (can be negative = reason to keep) */
  points: number;
  /** Maximum possible points for this factor */
  maxPoints: number;
  /** Human-readable explanation */
  explanation: string;
  /** Severity: positive = replace, negative = keep */
  direction: "replace" | "keep" | "neutral";
}

export interface ReplacementCandidate {
  product: AnnuityProduct;
  /** Why this specific product is a good replacement */
  reasons: string[];
  /** Estimated months to breakeven after surrender penalty */
  breakevenMonths: number;
  /** Estimated monthly income improvement */
  monthlyIncomeImprovement: number;
  /** Bonus uplift amount (annuity premium bonus) */
  bonusUplift: number;
  /** Carrier rating improvement (e.g. "A- → A+") */
  ratingChange: string;
  /** Match score 0-100 for this specific candidate */
  matchScore: number;
  /** Solar Strategy uplift amount (listed FIRST per convention) */
  solarUplift: number;
  /** Combined total: solar bonus + annuity bonus */
  combinedBonusTotal: number;
}

/**
 * Solar Strategy Pathway — the multi-stage replacement mechanism:
 *
 * Stage 1: Surrender existing annuity → pay penalties, MVA, surrender charges
 * Stage 2: Roth-convert the proceeds → Solar ITC adds 20-28% tax-free to principal
 * Stage 3: Deploy into new annuity with 10-26% premium bonus + income rider
 * Stage 4: Result = tax-free guaranteed income for life
 *
 * This pathway is ONLY available for taxable accounts (IRA, 401k, 403b, TSP).
 * Tax-free accounts (Roth) skip the solar stage and use traditional 1035.
 */
export interface SolarStrategyPathway {
  /** Whether the Solar Strategy is applicable (taxable account) */
  eligible: boolean;
  /** Why it's eligible or not */
  eligibilityReason: string;

  // Stage 1: Surrender Economics
  /** Gross account value before any deductions */
  grossAccountValue: number;
  /** Surrender penalty amount */
  surrenderPenalty: number;
  /** Market Value Adjustment */
  mvaAmount: number;
  /** Net proceeds after penalties and MVA */
  netAfterPenalties: number;

  // Stage 2: Solar Strategy (Roth Conversion)
  /** Solar ITC growth percentage applied (20-28%) */
  solarGrowthPct: number;
  /** Dollar amount of solar bonus */
  solarBonusAmount: number;
  /** Estimated Roth conversion tax cost */
  conversionTaxCost: number;
  /** Principal after solar bonus (before annuity) */
  principalAfterSolar: number;

  // Stage 3: New Annuity Deployment
  /** New annuity premium bonus percentage (10-26%) */
  annuityBonusPct: number;
  /** Dollar amount of annuity bonus */
  annuityBonusAmount: number;
  /** Total enhanced premium (solar + annuity bonus applied) */
  totalEnhancedPremium: number;

  // Stage 4: Tax-Free Income Result
  /** Estimated monthly tax-free guaranteed income for life */
  monthlyTaxFreeIncome: number;
  /** Current monthly taxable income (for comparison) */
  currentMonthlyTaxableIncome: number;
  /** Monthly income improvement */
  monthlyIncomeImprovement: number;
  /** Percentage income improvement */
  pctIncomeImprovement: number;
  /** Lifetime tax savings estimate (income years × annual tax saved) */
  lifetimeTaxSavings: number;
  /** Years to breakeven on conversion tax cost */
  yearsToBreakeven: number;

  // Summary
  /** One-sentence summary of the solar pathway */
  summary: string;
  /** Comparison: "$X/mo taxable → $Y/mo tax-free" */
  comparisonLabel: string;
}

export interface ReplacementResult {
  /** Overall replacement opportunity score 0-100 */
  score: number;
  /** Traffic-light verdict */
  verdict: Verdict;
  /** Human-readable verdict label */
  verdictLabel: string;
  /** Color for UI rendering */
  verdictColor: string;
  /** One-sentence summary */
  summary: string;
  /** Detailed factor breakdown */
  factors: ReplacementFactor[];
  /** Top 3 replacement candidates ranked by match score */
  topCandidates: ReplacementCandidate[];
  /** Estimated annual revenue opportunity for the advisor */
  estimatedAdvisorRevenue: number;
  /** Key risk if replacement is NOT pursued */
  inactionRisk: string;
  /** Solar Strategy pathway analysis (null if not eligible) */
  solarPathway: SolarStrategyPathway | null;
  /** Score WITH Solar Strategy factored in (may be higher than base score) */
  solarEnhancedScore: number;
  /** Verdict WITH Solar Strategy */
  solarEnhancedVerdict: Verdict;
  solarEnhancedVerdictLabel: string;
}

// ── Rating Helpers ───────────────────────────────────────────────────────

const RATING_SCORES: Record<string, number> = {
  "A++": 100, "A+": 95, "A": 85, "A-": 75,
  "B++": 65, "B+": 55, "B": 45, "B-": 35,
  "C++": 25, "C+": 15, "C": 10, "D": 5,
};

function ratingToScore(rating: string): number {
  return RATING_SCORES[rating] ?? 50;
}

function compareRatings(oldRating: string, newRating: string): { improved: boolean; delta: number; label: string } {
  const oldScore = ratingToScore(oldRating);
  const newScore = ratingToScore(newRating);
  return {
    improved: newScore > oldScore,
    delta: newScore - oldScore,
    label: `${oldRating} → ${newRating}`,
  };
}

// ── Scoring Factors ──────────────────────────────────────────────────────

function scoreSurrenderEconomics(contract: ExistingContract): ReplacementFactor {
  const yearsRemaining = Math.max(0, contract.surrenderPeriodYears - contract.yearsInForce);
  const penaltyAmount = contract.accountValue * (contract.surrenderPenaltyPct / 100);
  const penaltyAsMonthlyIncome = contract.currentMonthlyIncome > 0
    ? penaltyAmount / contract.currentMonthlyIncome
    : 999;

  // If past surrender period, huge green light
  if (yearsRemaining <= 0) {
    return {
      name: "Surrender Economics",
      points: 20,
      maxPoints: 20,
      explanation: `Contract is past its ${contract.surrenderPeriodYears}-year surrender period. No penalty to leave — this is a free option.`,
      direction: "replace",
    };
  }

  // If penalty is tiny relative to account value
  if (contract.surrenderPenaltyPct <= 2) {
    return {
      name: "Surrender Economics",
      points: 16,
      maxPoints: 20,
      explanation: `Only ${contract.surrenderPenaltyPct}% surrender penalty remaining ($${penaltyAmount.toLocaleString()}). Minimal friction to replace.`,
      direction: "replace",
    };
  }

  // If deep in surrender period with high penalty
  if (yearsRemaining >= 5 && contract.surrenderPenaltyPct >= 8) {
    return {
      name: "Surrender Economics",
      points: -10,
      maxPoints: 20,
      explanation: `${yearsRemaining} years and ${contract.surrenderPenaltyPct}% penalty remaining ($${penaltyAmount.toLocaleString()}). High cost to exit — replacement must offer substantial improvement to justify.`,
      direction: "keep",
    };
  }

  // Middle ground — scale by years remaining
  const points = Math.round(20 * (1 - (yearsRemaining / contract.surrenderPeriodYears)) * (1 - contract.surrenderPenaltyPct / 15));
  return {
    name: "Surrender Economics",
    points: Math.max(-5, Math.min(20, points)),
    maxPoints: 20,
    explanation: `${yearsRemaining} years remaining in surrender period at ${contract.surrenderPenaltyPct}% ($${penaltyAmount.toLocaleString()}). ${points > 10 ? "Nearing end — replacement window opening." : "Moderate penalty — needs strong upside to justify."}`,
    direction: points > 5 ? "replace" : points < -2 ? "keep" : "neutral",
  };
}

function scoreBonusOpportunity(contract: ExistingContract, bestCandidate: AnnuityProduct | null): ReplacementFactor {
  const currentBonus = contract.premiumBonusPct;
  const newBonus = bestCandidate?.premiumBonus ?? bestCandidate?.bonusPct ?? 0;
  const bonusDelta = newBonus - currentBonus;
  const bonusUplift = contract.surrenderValue * (newBonus / 100);

  if (newBonus >= 15 && bonusDelta > 5) {
    return {
      name: "Premium Bonus Uplift",
      points: 20,
      maxPoints: 20,
      explanation: `New product offers ${newBonus}% premium bonus (+${bonusDelta}% over current). That's $${bonusUplift.toLocaleString()} in immediate bonus value on the surrender value — solar bonus first, annuity bonus second.`,
      direction: "replace",
    };
  }

  if (newBonus > currentBonus && bonusDelta > 0) {
    const points = Math.min(20, Math.round(bonusDelta * 2.5));
    return {
      name: "Premium Bonus Uplift",
      points,
      maxPoints: 20,
      explanation: `New product offers ${newBonus}% bonus vs current ${currentBonus}% (+${bonusDelta}%). Bonus uplift of $${bonusUplift.toLocaleString()} helps offset surrender penalty.`,
      direction: "replace",
    };
  }

  if (bonusDelta <= 0 && currentBonus > 0) {
    return {
      name: "Premium Bonus Uplift",
      points: -5,
      maxPoints: 20,
      explanation: `Current contract already has ${currentBonus}% bonus. No bonus improvement available — existing bonus may still be vesting.`,
      direction: "keep",
    };
  }

  return {
    name: "Premium Bonus Uplift",
    points: 0,
    maxPoints: 20,
    explanation: "Neither contract offers significant bonus. Neutral factor.",
    direction: "neutral",
  };
}

function scoreIncomeImprovement(contract: ExistingContract, bestCandidate: AnnuityProduct | null): ReplacementFactor {
  if (!bestCandidate || contract.category !== "income") {
    return {
      name: "Income Rider Improvement",
      points: 0,
      maxPoints: 20,
      explanation: "Not an income-focused contract. Factor not applicable.",
      direction: "neutral",
    };
  }

  // Estimate new monthly income based on candidate's payout rates
  const ageKey = contract.clientAge >= 72 ? "payoutPer100k75" :
    contract.clientAge >= 67 ? "payoutPer100k70" : "payoutPer100k65";
  const newPayoutPer100k = bestCandidate[ageKey] ?? 0;
  const estimatedNewMonthly = (contract.surrenderValue / 100000) * newPayoutPer100k;
  const monthlyDelta = estimatedNewMonthly - contract.currentMonthlyIncome;
  const pctImprovement = contract.currentMonthlyIncome > 0
    ? (monthlyDelta / contract.currentMonthlyIncome) * 100 : 0;

  if (monthlyDelta > 200 || pctImprovement > 15) {
    return {
      name: "Income Rider Improvement",
      points: 20,
      maxPoints: 20,
      explanation: `Estimated new income: $${estimatedNewMonthly.toFixed(0)}/mo vs current $${contract.currentMonthlyIncome}/mo (+$${monthlyDelta.toFixed(0)}/mo, +${pctImprovement.toFixed(0)}%). Significant lifetime income improvement.`,
      direction: "replace",
    };
  }

  if (monthlyDelta > 0) {
    const points = Math.min(15, Math.round(pctImprovement * 0.8));
    return {
      name: "Income Rider Improvement",
      points,
      maxPoints: 20,
      explanation: `Modest income improvement: +$${monthlyDelta.toFixed(0)}/mo (+${pctImprovement.toFixed(0)}%). Worth considering if other factors align.`,
      direction: monthlyDelta > 100 ? "replace" : "neutral",
    };
  }

  return {
    name: "Income Rider Improvement",
    points: -5,
    maxPoints: 20,
    explanation: `Current income rider is competitive ($${contract.currentMonthlyIncome}/mo). Replacement would not improve income.`,
    direction: "keep",
  };
}

function scoreCarrierStrength(contract: ExistingContract, bestCandidate: AnnuityProduct | null): ReplacementFactor {
  if (!bestCandidate) {
    return { name: "Carrier Strength", points: 0, maxPoints: 15, explanation: "No candidate to compare.", direction: "neutral" };
  }

  const comparison = compareRatings(contract.carrierRating, bestCandidate.amBest);
  const comdexDelta = bestCandidate.comdex - contract.carrierComdex;

  if (contract.carrierComdex < 60 && bestCandidate.comdex >= 85) {
    return {
      name: "Carrier Strength",
      points: 15,
      maxPoints: 15,
      explanation: `Current carrier Comdex ${contract.carrierComdex} is concerning. Moving to ${bestCandidate.carrier} (Comdex ${bestCandidate.comdex}, ${bestCandidate.amBest}) significantly improves safety. Rating: ${comparison.label}.`,
      direction: "replace",
    };
  }

  if (comparison.improved && comdexDelta > 10) {
    return {
      name: "Carrier Strength",
      points: Math.min(15, Math.round(comdexDelta * 0.5)),
      maxPoints: 15,
      explanation: `Carrier upgrade available: ${comparison.label}, Comdex ${contract.carrierComdex} → ${bestCandidate.comdex} (+${comdexDelta}). Stronger financial backing.`,
      direction: "replace",
    };
  }

  if (contract.carrierComdex >= 90) {
    return {
      name: "Carrier Strength",
      points: -5,
      maxPoints: 15,
      explanation: `Current carrier is top-tier (Comdex ${contract.carrierComdex}, ${contract.carrierRating}). No safety improvement needed.`,
      direction: "keep",
    };
  }

  return {
    name: "Carrier Strength",
    points: 0,
    maxPoints: 15,
    explanation: `Carrier strength is comparable. ${comparison.label}, Comdex ${contract.carrierComdex} → ${bestCandidate.comdex}.`,
    direction: "neutral",
  };
}

function scoreStateGuarantyHeadroom(contract: ExistingContract, stateCode: StateCode): ReplacementFactor {
  const guaranty = getStateGuaranty(stateCode);
  const annuityLimit = guaranty.annuityLimit;
  const headroom = annuityLimit - contract.accountValue;
  const utilizationPct = (contract.accountValue / annuityLimit) * 100;

  if (utilizationPct > 90) {
    return {
      name: "State Guaranty Headroom",
      points: 10,
      maxPoints: 10,
      explanation: `Account value ($${contract.accountValue.toLocaleString()}) uses ${utilizationPct.toFixed(0)}% of ${stateCode}'s $${annuityLimit.toLocaleString()} guaranty limit. Consider splitting across carriers for full protection.`,
      direction: "replace",
    };
  }

  if (utilizationPct > 70) {
    return {
      name: "State Guaranty Headroom",
      points: 5,
      maxPoints: 10,
      explanation: `Account uses ${utilizationPct.toFixed(0)}% of state guaranty ($${headroom.toLocaleString()} headroom). Approaching limit — monitor as value grows.`,
      direction: "neutral",
    };
  }

  return {
    name: "State Guaranty Headroom",
    points: 0,
    maxPoints: 10,
    explanation: `Well within ${stateCode} guaranty limit ($${headroom.toLocaleString()} headroom). No concern.`,
    direction: "neutral",
  };
}

function scoreTimingAndAge(contract: ExistingContract): ReplacementFactor {
  const yearsToIncome = Math.max(0, 65 - contract.clientAge);
  const yearsRemainingSurrender = Math.max(0, contract.surrenderPeriodYears - contract.yearsInForce);

  // If client is young and has time for new bonus to vest
  if (contract.clientAge < 55 && yearsRemainingSurrender <= 2) {
    return {
      name: "Timing & Age Advantage",
      points: 15,
      maxPoints: 15,
      explanation: `Client is ${contract.clientAge} with ${yearsToIncome}+ years to income start. Ample time for new bonus to vest and compound. Surrender period ending soon — optimal replacement window.`,
      direction: "replace",
    };
  }

  // If client is near income start and locked in
  if (contract.clientAge >= 63 && yearsRemainingSurrender >= 3) {
    return {
      name: "Timing & Age Advantage",
      points: -10,
      maxPoints: 15,
      explanation: `Client is ${contract.clientAge} — close to income start. ${yearsRemainingSurrender} years left in surrender period. Replacement would delay income and incur penalty during critical accumulation years.`,
      direction: "keep",
    };
  }

  // If client is young with long surrender remaining
  if (contract.clientAge < 50 && yearsRemainingSurrender >= 5) {
    return {
      name: "Timing & Age Advantage",
      points: 5,
      maxPoints: 15,
      explanation: `Client is ${contract.clientAge} with ${yearsToIncome}+ years to income. Despite ${yearsRemainingSurrender} years in surrender, long horizon allows recovery. Worth evaluating if upside is substantial.`,
      direction: "neutral",
    };
  }

  const points = Math.round((yearsToIncome / 20) * 10 - (yearsRemainingSurrender * 1.5));
  return {
    name: "Timing & Age Advantage",
    points: Math.max(-10, Math.min(15, points)),
    maxPoints: 15,
    explanation: `Client is ${contract.clientAge}, ${yearsToIncome} years to typical income start, ${yearsRemainingSurrender} years in surrender. ${points > 5 ? "Timing favors replacement." : points < -3 ? "Timing favors patience." : "Timing is neutral."}`,
    direction: points > 5 ? "replace" : points < -3 ? "keep" : "neutral",
  };
}

// ── Candidate Finder ─────────────────────────────────────────────────────

function findTopCandidates(
  contract: ExistingContract,
  stateCode: StateCode,
): ReplacementCandidate[] {
  const available = getTopProductsForState(stateCode, contract.category, 10);

  return available
    .map((product) => {
      let matchScore = 0;
      const reasons: string[] = [];

      // Bonus comparison
      const newBonus = product.premiumBonus ?? product.bonusPct ?? 0;
      if (newBonus > contract.premiumBonusPct) {
        matchScore += 25;
        reasons.push(`${newBonus}% premium bonus (+${(newBonus - contract.premiumBonusPct).toFixed(0)}% over current)`);
      }

      // Carrier rating
      const ratingComp = compareRatings(contract.carrierRating, product.amBest);
      if (ratingComp.improved) {
        matchScore += 15;
        reasons.push(`Stronger carrier: ${ratingComp.label}`);
      }

      // Income improvement
      const ageKey = contract.clientAge >= 72 ? "payoutPer100k75" as const :
        contract.clientAge >= 67 ? "payoutPer100k70" as const : "payoutPer100k65" as const;
      const newPayout = product[ageKey] ?? 0;
      const estimatedNewMonthly = (contract.surrenderValue / 100000) * newPayout;
      const monthlyDelta = estimatedNewMonthly - contract.currentMonthlyIncome;
      if (monthlyDelta > 0 && contract.currentMonthlyIncome > 0) {
        matchScore += Math.min(30, Math.round((monthlyDelta / contract.currentMonthlyIncome) * 100));
        reasons.push(`+$${monthlyDelta.toFixed(0)}/mo income improvement`);
      }

      // Rollup rate
      if (product.rollupRate && product.rollupRate > contract.rollupRate) {
        matchScore += 15;
        reasons.push(`${product.rollupRate}% rollup rate (vs ${contract.rollupRate}%)`);
      }

      // Comdex
      if (product.comdex > contract.carrierComdex + 5) {
        matchScore += 10;
        reasons.push(`Comdex ${product.comdex} (vs ${contract.carrierComdex})`);
      }

      // Highlight as a reason
      if (product.highlight) {
        reasons.push(product.highlight);
      }

      // Breakeven calculation: how many months of income improvement to recover surrender penalty
      const penaltyAmount = contract.accountValue - contract.surrenderValue;
      const bonusRecovery = contract.surrenderValue * (newBonus / 100);
      const netCostToSwitch = Math.max(0, penaltyAmount - bonusRecovery);
      const breakevenMonths = monthlyDelta > 0 ? Math.ceil(netCostToSwitch / monthlyDelta) : 999;

      return {
        product,
        reasons: reasons.slice(0, 4),
        breakevenMonths,
        monthlyIncomeImprovement: Math.max(0, monthlyDelta),
        bonusUplift: bonusRecovery,
        ratingChange: ratingComp.label,
        matchScore: Math.min(100, matchScore),
        solarUplift: 0, // Populated by solar pathway analysis
        combinedBonusTotal: bonusRecovery, // Updated when solar is applied
      };
    })
    .filter((c) => c.matchScore > 20)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

// ── Verdict Logic ────────────────────────────────────────────────────────

function getVerdict(score: number): { verdict: Verdict; label: string; color: string } {
  if (score >= 80) return { verdict: "REPLACE_NOW", label: "Replace Now", color: "text-red-400" };
  if (score >= 60) return { verdict: "STRONG_CANDIDATE", label: "Strong Candidate", color: "text-orange-400" };
  if (score >= 40) return { verdict: "MONITOR", label: "Monitor", color: "text-amber-400" };
  if (score >= 20) return { verdict: "LIKELY_KEEP", label: "Likely Keep", color: "text-blue-400" };
  return { verdict: "KEEP", label: "Keep", color: "text-green-400" };
}

function generateSummary(score: number, contract: ExistingContract, factors: ReplacementFactor[], topCandidate: ReplacementCandidate | null): string {
  const { verdict } = getVerdict(score);
  const replaceFacts = factors.filter(f => f.direction === "replace").map(f => f.name.toLowerCase());
  const keepFacts = factors.filter(f => f.direction === "keep").map(f => f.name.toLowerCase());

  if (verdict === "REPLACE_NOW" && topCandidate) {
    return `Strong replacement opportunity. ${topCandidate.product.carrier} ${topCandidate.product.product} offers ${topCandidate.reasons[0] ?? "significant improvement"}. ${topCandidate.breakevenMonths < 24 ? `Breakeven in ${topCandidate.breakevenMonths} months.` : ""} Key drivers: ${replaceFacts.join(", ")}.`;
  }
  if (verdict === "STRONG_CANDIDATE") {
    return `Replacement worth serious consideration. Favorable factors: ${replaceFacts.join(", ")}. ${keepFacts.length > 0 ? `Offsetting: ${keepFacts.join(", ")}.` : ""} Review with client.`;
  }
  if (verdict === "MONITOR") {
    return `Mixed signals — monitor for changes. ${replaceFacts.length > 0 ? `Upside: ${replaceFacts.join(", ")}.` : ""} ${keepFacts.length > 0 ? `Downside: ${keepFacts.join(", ")}.` : ""} Re-evaluate when surrender period ends or new products launch.`;
  }
  if (verdict === "LIKELY_KEEP") {
    return `Current contract is performing adequately. ${keepFacts.length > 0 ? `Strengths: ${keepFacts.join(", ")}.` : ""} Minor improvements available but not enough to justify switching costs.`;
  }
  return `Current contract is strong. ${contract.carrierName} ${contract.productName} is well-positioned. No replacement recommended at this time.`;
}

function getInactionRisk(score: number, contract: ExistingContract): string {
  if (score >= 80) return `Client is leaving an estimated $${((contract.accountValue * 0.15) / 12).toFixed(0)}/mo on the table. Every month without action costs real income.`;
  if (score >= 60) return `Surrender period is approaching end. Missing the replacement window means another year of suboptimal returns.`;
  if (score >= 40) return `Market conditions may shift. Current bonus rates and income riders are not guaranteed to persist.`;
  return `Low risk of inaction. Current contract continues to serve the client well.`;
}

// ── Solar Strategy Pathway Calculator ────────────────────────────────────

/**
 * Calculates the full Solar Strategy multi-stage replacement pathway.
 *
 * The sequence (per platform convention, Solar bonus listed FIRST):
 *   1. Surrender existing annuity → net after penalties & MVA
 *   2. Roth-convert proceeds → Solar ITC adds 20-28% tax-free to principal
 *   3. Deploy into new annuity → 10-26% premium bonus on enhanced principal
 *   4. Activate income rider → tax-free guaranteed income for life
 *
 * Compares: current taxable unreliable income vs tax-free guaranteed income.
 */
function calculateSolarPathway(
  contract: ExistingContract,
  bestCandidate: AnnuityProduct | null,
): SolarStrategyPathway {
  // Solar Strategy only applies to taxable accounts (IRA, 401k, 403b, TSP)
  const taxableTypes = ["ira", "401k", "403b", "tsp"];
  const eligible = taxableTypes.includes(contract.accountType);

  if (!eligible) {
    return {
      eligible: false,
      eligibilityReason: `Account type "${contract.accountType}" is already tax-free. Solar Strategy applies to taxable accounts (IRA, 401k, 403b, TSP) that benefit from Roth conversion.`,
      grossAccountValue: contract.accountValue,
      surrenderPenalty: 0,
      mvaAmount: 0,
      netAfterPenalties: 0,
      solarGrowthPct: 0,
      solarBonusAmount: 0,
      conversionTaxCost: 0,
      principalAfterSolar: 0,
      annuityBonusPct: 0,
      annuityBonusAmount: 0,
      totalEnhancedPremium: 0,
      monthlyTaxFreeIncome: 0,
      currentMonthlyTaxableIncome: contract.currentMonthlyIncome,
      monthlyIncomeImprovement: 0,
      pctIncomeImprovement: 0,
      lifetimeTaxSavings: 0,
      yearsToBreakeven: 99,
      summary: "Solar Strategy not applicable — account is already tax-advantaged.",
      comparisonLabel: "N/A",
    };
  }

  // ─── Stage 1: Surrender Economics ───
  const grossAccountValue = contract.accountValue;
  const surrenderPenalty = grossAccountValue - contract.surrenderValue;
  const mvaAmount = contract.mvaAmount ?? 0;
  const netAfterPenalties = Math.max(0, contract.surrenderValue - mvaAmount);

  // ─── Stage 2: Solar Strategy (Roth Conversion) ───
  // Solar ITC growth: 20-28%, scaled by account size
  // Larger accounts tend toward the higher end due to economies of scale
  const solarGrowthPct = netAfterPenalties >= 500000 ? 0.28
    : netAfterPenalties >= 250000 ? 0.26
    : netAfterPenalties >= 100000 ? 0.24
    : netAfterPenalties >= 50000 ? 0.22
    : 0.20;
  const solarBonusAmount = Math.round(netAfterPenalties * solarGrowthPct);
  const principalAfterSolar = netAfterPenalties + solarBonusAmount;

  // Estimate conversion tax cost
  const filingStatus = contract.filingStatus ?? "single";
  const otherIncome = contract.otherTaxableIncome ?? 50000;
  const stateTaxRate = contract.stateTaxRate ?? 0.05;
  // Simplified federal bracket estimation
  const totalTaxableIncome = otherIncome + netAfterPenalties;
  const federalRate = totalTaxableIncome > 578125 ? 0.37
    : totalTaxableIncome > 231250 ? 0.35
    : totalTaxableIncome > 182100 ? 0.32
    : totalTaxableIncome > 95375 ? 0.24
    : totalTaxableIncome > 44725 ? 0.22
    : 0.12;
  // Marginal tax on the converted amount
  const conversionTaxCost = Math.round(netAfterPenalties * (federalRate + stateTaxRate));

  // ─── Stage 3: New Annuity Deployment ───
  const annuityBonusPct = bestCandidate
    ? (bestCandidate.premiumBonus ?? bestCandidate.bonusPct ?? 0) / 100
    : 0.20; // Default 20% if no candidate
  const annuityBonusAmount = Math.round(principalAfterSolar * annuityBonusPct);
  const totalEnhancedPremium = principalAfterSolar + annuityBonusAmount;

  // ─── Stage 4: Tax-Free Income ───
  // Estimate income using candidate's payout rates
  const ageKey = contract.clientAge >= 72 ? "payoutPer100k75" as const :
    contract.clientAge >= 67 ? "payoutPer100k70" as const : "payoutPer100k65" as const;
  const payoutRate = bestCandidate?.[ageKey] ?? 550; // Default $550/mo per $100k
  const monthlyTaxFreeIncome = Math.round((totalEnhancedPremium / 100000) * payoutRate);

  // Current income is taxable — estimate after-tax
  const currentMonthlyTaxableIncome = contract.currentMonthlyIncome;
  const effectiveTaxRate = federalRate + stateTaxRate;
  const currentAfterTaxMonthly = Math.round(currentMonthlyTaxableIncome * (1 - effectiveTaxRate));

  // The comparison: tax-free income vs after-tax current income
  const monthlyIncomeImprovement = monthlyTaxFreeIncome - currentAfterTaxMonthly;
  const pctIncomeImprovement = currentAfterTaxMonthly > 0
    ? Math.round(((monthlyTaxFreeIncome - currentAfterTaxMonthly) / currentAfterTaxMonthly) * 100)
    : 100;

  // Lifetime tax savings: assume 20 years of income
  const incomeYears = 20;
  const annualTaxSaved = currentMonthlyTaxableIncome * 12 * effectiveTaxRate;
  const lifetimeTaxSavings = Math.round(annualTaxSaved * incomeYears);

  // Breakeven: how many years of income improvement to recover conversion tax
  const annualImprovement = monthlyIncomeImprovement * 12;
  const yearsToBreakeven = annualImprovement > 0 ? Math.ceil(conversionTaxCost / annualImprovement) : 99;

  const summary = `Solar Strategy transforms $${netAfterPenalties.toLocaleString()} of taxable proceeds into $${totalEnhancedPremium.toLocaleString()} of enhanced tax-free principal — a ${Math.round(((totalEnhancedPremium / netAfterPenalties) - 1) * 100)}% total uplift. Solar bonus adds $${solarBonusAmount.toLocaleString()} (${(solarGrowthPct * 100).toFixed(0)}%), then the annuity bonus adds another $${annuityBonusAmount.toLocaleString()} (${(annuityBonusPct * 100).toFixed(0)}%). Result: $${monthlyTaxFreeIncome.toLocaleString()}/mo tax-free guaranteed income for life vs $${currentAfterTaxMonthly.toLocaleString()}/mo after-tax currently.`;

  const comparisonLabel = `$${currentAfterTaxMonthly.toLocaleString()}/mo taxable → $${monthlyTaxFreeIncome.toLocaleString()}/mo tax-free`;

  return {
    eligible: true,
    eligibilityReason: `Account type "${contract.accountType}" is a taxable retirement account — ideal for Solar Strategy Roth conversion.`,
    grossAccountValue,
    surrenderPenalty,
    mvaAmount,
    netAfterPenalties,
    solarGrowthPct,
    solarBonusAmount,
    conversionTaxCost,
    principalAfterSolar,
    annuityBonusPct,
    annuityBonusAmount,
    totalEnhancedPremium,
    monthlyTaxFreeIncome,
    currentMonthlyTaxableIncome,
    monthlyIncomeImprovement,
    pctIncomeImprovement,
    lifetimeTaxSavings,
    yearsToBreakeven,
    summary,
    comparisonLabel,
  };
}

// ── Solar-Enhanced Scoring Factor ───────────────────────────────────────

function scoreSolarStrategy(contract: ExistingContract, solar: SolarStrategyPathway): ReplacementFactor {
  if (!solar.eligible) {
    return {
      name: "Solar Strategy (Roth Conversion)",
      points: 0,
      maxPoints: 25,
      explanation: `Not applicable — ${contract.accountType} account is already tax-advantaged.`,
      direction: "neutral",
    };
  }

  // The Solar Strategy is a massive accelerant. Score based on total uplift.
  const totalUpliftPct = ((solar.totalEnhancedPremium / solar.netAfterPenalties) - 1) * 100;
  const breakevenOk = solar.yearsToBreakeven <= 5;
  const incomeBoost = solar.pctIncomeImprovement;

  if (totalUpliftPct >= 40 && breakevenOk && incomeBoost >= 50) {
    return {
      name: "Solar Strategy (Roth Conversion)",
      points: 25,
      maxPoints: 25,
      explanation: `Solar Strategy delivers ${totalUpliftPct.toFixed(0)}% total principal uplift. Solar bonus: +$${solar.solarBonusAmount.toLocaleString()} (${(solar.solarGrowthPct * 100).toFixed(0)}%), then annuity bonus: +$${solar.annuityBonusAmount.toLocaleString()} (${(solar.annuityBonusPct * 100).toFixed(0)}%). Income improves ${incomeBoost}% and becomes permanently tax-free. Conversion tax recovers in ${solar.yearsToBreakeven} years. This is a transformational opportunity.`,
      direction: "replace",
    };
  }

  if (totalUpliftPct >= 25 && incomeBoost >= 20) {
    return {
      name: "Solar Strategy (Roth Conversion)",
      points: 18,
      maxPoints: 25,
      explanation: `Solar Strategy adds ${totalUpliftPct.toFixed(0)}% to principal. Solar bonus: +$${solar.solarBonusAmount.toLocaleString()}, annuity bonus: +$${solar.annuityBonusAmount.toLocaleString()}. Income improves ${incomeBoost}% and becomes tax-free. Breakeven in ${solar.yearsToBreakeven} years. Strong candidate for Solar pathway.`,
      direction: "replace",
    };
  }

  if (totalUpliftPct >= 15) {
    return {
      name: "Solar Strategy (Roth Conversion)",
      points: 10,
      maxPoints: 25,
      explanation: `Solar Strategy provides ${totalUpliftPct.toFixed(0)}% uplift. Modest but meaningful — the tax-free conversion alone adds long-term value. Breakeven in ${solar.yearsToBreakeven} years.`,
      direction: "replace",
    };
  }

  return {
    name: "Solar Strategy (Roth Conversion)",
    points: 3,
    maxPoints: 25,
    explanation: `Solar Strategy provides ${totalUpliftPct.toFixed(0)}% uplift — marginal. The conversion tax cost of $${solar.conversionTaxCost.toLocaleString()} may not justify the switch unless other factors are strong.`,
    direction: "neutral",
  };
}

// ── Main Scoring Function ────────────────────────────────────────────────

export function scoreReplacementOpportunity(
  contract: ExistingContract,
  stateCode: StateCode,
): ReplacementResult {
  const topCandidates = findTopCandidates(contract, stateCode);
  const bestCandidate = topCandidates[0]?.product ?? null;

  // Calculate Solar Strategy pathway
  const solarPathway = calculateSolarPathway(contract, bestCandidate);

  // Base factors (traditional 1035 analysis)
  const baseFactors: ReplacementFactor[] = [
    scoreSurrenderEconomics(contract),
    scoreBonusOpportunity(contract, bestCandidate),
    scoreIncomeImprovement(contract, bestCandidate),
    scoreCarrierStrength(contract, bestCandidate),
    scoreStateGuarantyHeadroom(contract, stateCode),
    scoreTimingAndAge(contract),
  ];

  // Solar factor (7th factor — only scores if eligible)
  const solarFactor = scoreSolarStrategy(contract, solarPathway);

  // All 7 factors
  const factors: ReplacementFactor[] = [...baseFactors, solarFactor];

  // Calculate base score (traditional 6-factor, without solar)
  const baseTotalPoints = baseFactors.reduce((sum, f) => sum + f.points, 0);
  const baseMaxPossible = baseFactors.reduce((sum, f) => sum + f.maxPoints, 0);
  const rawScore = Math.max(0, Math.min(100, Math.round(((baseTotalPoints + 20) / (baseMaxPossible + 20)) * 100)));

  // Calculate solar-enhanced score (all 7 factors)
  const solarTotalPoints = factors.reduce((sum, f) => sum + f.points, 0);
  const solarMaxPossible = factors.reduce((sum, f) => sum + f.maxPoints, 0);
  const solarEnhancedScore = Math.max(0, Math.min(100, Math.round(((solarTotalPoints + 20) / (solarMaxPossible + 20)) * 100)));

  const { verdict, label, color } = getVerdict(rawScore);
  const solarVerdict = getVerdict(solarEnhancedScore);

  // Update candidates with solar uplift data
  if (solarPathway.eligible) {
    topCandidates.forEach(c => {
      c.solarUplift = solarPathway.solarBonusAmount;
      c.combinedBonusTotal = solarPathway.solarBonusAmount + c.bonusUplift;
    });
  }

  // Estimated advisor revenue: ~4% of account value on replacement
  const estimatedAdvisorRevenue = Math.max(
    rawScore >= 60 ? Math.round(contract.accountValue * 0.04) : 0,
    solarEnhancedScore >= 60 ? Math.round(contract.accountValue * 0.04) : 0,
  );

  return {
    score: rawScore,
    verdict,
    verdictLabel: label,
    verdictColor: color,
    summary: generateSummary(rawScore, contract, factors, topCandidates[0] ?? null),
    factors,
    topCandidates,
    estimatedAdvisorRevenue,
    inactionRisk: getInactionRisk(rawScore, contract),
    solarPathway: solarPathway.eligible ? solarPathway : null,
    solarEnhancedScore,
    solarEnhancedVerdict: solarVerdict.verdict,
    solarEnhancedVerdictLabel: solarVerdict.label,
  };
}
