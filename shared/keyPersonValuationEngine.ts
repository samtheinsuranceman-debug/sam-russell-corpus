/**
 * SISTER INVENTION SI-035: Key Person Insurance Valuation Engine for Medical
 * Practices (KPIVE)
 * Patent Reference: Integrates PAT-010 (Practice Revenue), PAT-004 (Wealth Genome),
 * SI-017 (Succession Valuation)
 *
 * Calculates appropriate key person coverage for a medical practice by modeling the
 * revenue impact, replacement cost, and continuity implications of losing a key
 * physician. Three interlocking components:
 *
 *   RAM  — Revenue Attribution Model: attributes practice revenue to each physician
 *          across five factors, not simple billing attribution.
 *   RCE  — Replacement Cost Estimator: recruitment, signing bonus, ramp-up revenue
 *          loss, and patient attrition across a 6-18 month replacement timeline.
 *   BCIA — Business Continuity Impact Assessor: the cascading effect on remaining
 *          physicians' workload, patient satisfaction, and practice valuation.
 *
 * Narrowed use case (per application): practices with 3-20 physicians where
 * individual physician revenue exceeds $1,000,000 annually.
 */

export type PayerMix = {
  /** Shares must sum to 1. Commercial reimburses highest, Medicaid lowest. */
  commercial: number;
  medicare: number;
  medicaid: number;
  selfPay: number;
};

/**
 * Relative collection yield by payer, expressed against commercial as 1.0.
 * A physician with a Medicaid-heavy panel collects materially less on the same
 * procedure volume, which is why gross billing overstates their contribution.
 */
export const PAYER_YIELD: Record<keyof PayerMix, number> = {
  commercial: 1.0,
  medicare: 0.78,
  medicaid: 0.52,
  selfPay: 0.64,
};

/** Procedure intensity multipliers by CPT-weighted mix. */
export type ProcedureMix = "primary_care" | "mixed" | "procedural" | "surgical";

export const PROCEDURE_INTENSITY: Record<ProcedureMix, number> = {
  primary_care: 1.0,
  mixed: 1.25,
  procedural: 1.6,
  surgical: 2.1,
};

export interface Physician {
  id: string;
  name: string;
  /** Revenue billed under this physician's NPI. */
  directBillings: number;
  /** Active patients on the physician's panel. */
  patientPanelSize: number;
  procedureMix: ProcedureMix;
  payerMix: PayerMix;
  /** Referrals generated to other physicians in the practice, per year. */
  referralsGeneratedPerYear: number;
  /** Average revenue the practice realizes per internal referral. */
  avgRevenuePerReferral: number;
  /** Ancillary revenue (imaging, labs, infusion) driven by this physician. */
  ancillaryRevenue: number;
  /** Years with the practice — drives patient loyalty on departure. */
  tenureYears: number;
  /** Ownership percentage, 0-1. Owners are harder and costlier to replace. */
  ownershipPercent: number;
  age: number;
}

export interface PracticeProfile {
  name: string;
  physicians: Physician[];
  /** Total practice collections for the year. */
  totalCollections: number;
  /** Fixed overhead that continues regardless of physician count. */
  annualFixedOverhead: number;
  /** Practice valuation multiple applied to EBITDA. */
  ebitdaMultiple: number;
  annualEbitda: number;
  specialty: string;
  /** Local market difficulty for recruiting, 0-1. Higher is harder. */
  recruitmentDifficulty: number;
}

export interface RevenueAttribution {
  physicianId: string;
  name: string;
  directBillings: number;
  /** Direct billings adjusted for payer yield and procedure intensity. */
  yieldAdjustedBillings: number;
  referralRevenue: number;
  ancillaryRevenue: number;
  /** Full attributed contribution — the RAM output. */
  trueContribution: number;
  /** Share of total practice collections this physician truly drives. */
  contributionShare: number;
  /** How far true contribution diverges from naive billing attribution. */
  attributionVariancePercent: number;
}

export interface ReplacementCost {
  physicianId: string;
  /** Months to recruit, credential, and ramp a replacement. */
  replacementMonths: number;
  recruitmentFees: number;
  signingBonus: number;
  /** Revenue lost while the seat is empty and during ramp-up. */
  rampUpRevenueLoss: number;
  /** Revenue lost to patients who follow the departing physician or leave. */
  patientAttritionLoss: number;
  /** Monthly revenue impact across the replacement timeline. */
  monthlyImpact: Array<{ month: number; revenueImpact: number; capacityPercent: number }>;
  totalReplacementCost: number;
}

export interface ContinuityImpact {
  physicianId: string;
  /** Additional panel load per remaining physician. */
  workloadIncreasePercent: number;
  /** Modeled drop in patient satisfaction from overload. */
  satisfactionDropPoints: number;
  /** Secondary revenue loss as overloaded physicians lose their own patients. */
  cascadeRevenueLoss: number;
  /** EBITDA decline driving the valuation hit. */
  ebitdaDecline: number;
  practiceValuationDecline: number;
  /** Emergent Capability 1 — valuation decline ÷ direct revenue lost. */
  cascadeMultiple: number;
}

export interface KeyPersonRecommendation {
  physicianId: string;
  name: string;
  /** Recommended key person face amount. */
  recommendedCoverage: number;
  /** How the coverage figure decomposes. */
  coverageBasis: {
    replacementCost: number;
    lostContribution: number;
    valuationProtection: number;
  };
  /** Estimated annual premium for the recommended face amount. */
  estimatedAnnualPremium: number;
  priority: "critical" | "high" | "moderate";
}

export interface KeyPersonResult {
  practiceName: string;
  attribution: RevenueAttribution[];
  replacementCosts: ReplacementCost[];
  continuityImpacts: ContinuityImpact[];
  recommendations: KeyPersonRecommendation[];
  totalRecommendedCoverage: number;
  totalEstimatedPremium: number;
  criticalFindings: string[];
  irsReferences: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function payerYield(mix: PayerMix): number {
  return (
    mix.commercial * PAYER_YIELD.commercial +
    mix.medicare * PAYER_YIELD.medicare +
    mix.medicaid * PAYER_YIELD.medicaid +
    mix.selfPay * PAYER_YIELD.selfPay
  );
}

/**
 * RAM — Revenue Attribution Model.
 *
 * Attributes revenue across the five factors the application claims: panel size,
 * CPT-weighted procedure mix, referral generation, payer mix, and ancillary
 * revenue. Standard financial reports credit only direct billings, which is why
 * true contribution routinely diverges 30-50% from the books.
 */
export function attributeRevenue(practice: PracticeProfile): RevenueAttribution[] {
  const raw = practice.physicians.map(p => {
    const intensity = PROCEDURE_INTENSITY[p.procedureMix];
    const yieldFactor = payerYield(p.payerMix);

    // Billings are scaled by collection yield; intensity weights the panel's
    // revenue density relative to a pure primary-care panel of the same size.
    const panelDensity = 1 + (intensity - 1) * 0.35;
    const yieldAdjustedBillings = p.directBillings * yieldFactor * panelDensity;

    const referralRevenue = p.referralsGeneratedPerYear * p.avgRevenuePerReferral;
    const trueContribution = yieldAdjustedBillings + referralRevenue + p.ancillaryRevenue;

    return { p, yieldAdjustedBillings, referralRevenue, trueContribution };
  });

  const totalTrue = raw.reduce((s, r) => s + r.trueContribution, 0);

  return raw.map(({ p, yieldAdjustedBillings, referralRevenue, trueContribution }) => ({
    physicianId: p.id,
    name: p.name,
    directBillings: round(p.directBillings),
    yieldAdjustedBillings: round(yieldAdjustedBillings),
    referralRevenue: round(referralRevenue),
    ancillaryRevenue: round(p.ancillaryRevenue),
    trueContribution: round(trueContribution),
    contributionShare: totalTrue > 0 ? round(trueContribution / totalTrue) : 0,
    attributionVariancePercent:
      p.directBillings > 0 ? round(((trueContribution - p.directBillings) / p.directBillings) * 100) : 0,
  }));
}

/**
 * RCE — Replacement Cost Estimator.
 *
 * Models a 6-18 month replacement timeline with month-by-month revenue impact.
 * The seat is empty during search and credentialing, then a replacement ramps to
 * full capacity — the practice does not return to baseline the day someone signs.
 */
export function estimateReplacementCost(
  physician: Physician,
  attribution: RevenueAttribution,
  practice: PracticeProfile,
): ReplacementCost {
  // Harder markets, senior physicians and owners all lengthen the search.
  const baseMonths = 6;
  const difficultyMonths = practice.recruitmentDifficulty * 8;
  const ownerMonths = physician.ownershipPercent > 0.1 ? 2 : 0;
  const replacementMonths = Math.min(18, Math.round(baseMonths + difficultyMonths + ownerMonths));

  // Search months where the seat generates nothing, then a ramp to full capacity.
  const searchMonths = Math.max(2, Math.round(replacementMonths * 0.45));
  const rampMonths = replacementMonths - searchMonths;

  const monthlyContribution = attribution.trueContribution / 12;

  // Longer-tenured physicians take more of their panel with them.
  const loyaltyAttrition = Math.min(0.45, 0.12 + physician.tenureYears * 0.015);

  const monthlyImpact: Array<{ month: number; revenueImpact: number; capacityPercent: number }> = [];
  let rampUpRevenueLoss = 0;
  for (let m = 1; m <= replacementMonths; m += 1) {
    const capacityPercent = m <= searchMonths ? 0 : Math.min(1, (m - searchMonths) / Math.max(1, rampMonths));
    const revenueImpact = monthlyContribution * (1 - capacityPercent);
    rampUpRevenueLoss += revenueImpact;
    monthlyImpact.push({
      month: m,
      revenueImpact: round(revenueImpact),
      capacityPercent: round(capacityPercent * 100),
    });
  }

  // Attrition is a permanent annual loss, priced over the first full year post-replacement.
  const patientAttritionLoss = attribution.trueContribution * loyaltyAttrition;

  // Recruitment economics scale with specialty compensation and market difficulty.
  const recruitmentFees = 30_000 + attribution.trueContribution * 0.05 * (1 + practice.recruitmentDifficulty);
  const signingBonus = 25_000 + attribution.trueContribution * 0.04 * (1 + practice.recruitmentDifficulty);

  return {
    physicianId: physician.id,
    replacementMonths,
    recruitmentFees: round(recruitmentFees),
    signingBonus: round(signingBonus),
    rampUpRevenueLoss: round(rampUpRevenueLoss),
    patientAttritionLoss: round(patientAttritionLoss),
    monthlyImpact,
    totalReplacementCost: round(recruitmentFees + signingBonus + rampUpRevenueLoss + patientAttritionLoss),
  };
}

/**
 * BCIA — Business Continuity Impact Assessor.
 *
 * Losing a physician does not simply subtract their revenue. The remaining
 * physicians absorb the panel, become overloaded, satisfaction falls, and their own
 * retention suffers — and practice valuation falls by a multiple of the direct loss.
 */
export function assessContinuityImpact(
  physician: Physician,
  attribution: RevenueAttribution,
  practice: PracticeProfile,
  replacement: ReplacementCost,
): ContinuityImpact {
  const remaining = practice.physicians.length - 1;
  if (remaining <= 0) {
    // A solo practice has no one to absorb the panel — the practice stops.
    const ebitdaDecline = practice.annualEbitda;
    return {
      physicianId: physician.id,
      workloadIncreasePercent: 100,
      satisfactionDropPoints: 100,
      cascadeRevenueLoss: round(attribution.trueContribution),
      ebitdaDecline: round(ebitdaDecline),
      practiceValuationDecline: round(ebitdaDecline * practice.ebitdaMultiple),
      cascadeMultiple: attribution.trueContribution > 0
        ? round((ebitdaDecline * practice.ebitdaMultiple) / attribution.trueContribution)
        : 0,
    };
  }

  const totalPanel = practice.physicians.reduce((s, p) => s + p.patientPanelSize, 0);
  const remainingPanel = totalPanel - physician.patientPanelSize;
  const workloadIncreasePercent = remainingPanel > 0 ? (physician.patientPanelSize / remainingPanel) * 100 : 0;

  // Satisfaction degrades non-linearly once overload passes roughly 15%.
  const overload = Math.max(0, workloadIncreasePercent - 15);
  const satisfactionDropPoints = Math.min(40, Math.pow(overload, 1.15) * 0.55);

  // Overloaded physicians lose some of their own patients — the cascade.
  const cascadeAttritionRate = Math.min(0.2, satisfactionDropPoints * 0.006);
  const remainingContribution = practice.totalCollections - attribution.trueContribution;
  const cascadeRevenueLoss = Math.max(0, remainingContribution * cascadeAttritionRate);

  // Fixed overhead does not fall when a physician leaves, so EBITDA takes the
  // full revenue hit rather than a margin-scaled share of it.
  const directRevenueLoss = attribution.trueContribution + replacement.patientAttritionLoss;
  const totalRevenueLoss = directRevenueLoss + cascadeRevenueLoss;
  const ebitdaDecline = Math.min(practice.annualEbitda, totalRevenueLoss);
  const practiceValuationDecline = ebitdaDecline * practice.ebitdaMultiple;

  return {
    physicianId: physician.id,
    workloadIncreasePercent: round(workloadIncreasePercent),
    satisfactionDropPoints: round(satisfactionDropPoints),
    cascadeRevenueLoss: round(cascadeRevenueLoss),
    ebitdaDecline: round(ebitdaDecline),
    practiceValuationDecline: round(practiceValuationDecline),
    cascadeMultiple:
      attribution.trueContribution > 0 ? round(practiceValuationDecline / attribution.trueContribution) : 0,
  };
}

/**
 * Estimated annual key person premium. Term rates rise steeply with age; this is a
 * planning estimate, not a carrier quote.
 */
function estimatePremium(faceAmount: number, age: number): number {
  const ratePerThousand = 0.9 + Math.pow(Math.max(0, age - 30) / 10, 2.1) * 0.85;
  return round((faceAmount / 1000) * ratePerThousand);
}

/**
 * Run the full key person valuation for a medical practice.
 */
export function valuateKeyPersonCoverage(practice: PracticeProfile): KeyPersonResult {
  const criticalFindings: string[] = [];

  if (practice.physicians.length === 0) {
    throw new Error("A practice must have at least one physician to valuate key person coverage.");
  }
  if (practice.physicians.length < 3 || practice.physicians.length > 20) {
    criticalFindings.push(
      `This engine is calibrated for practices of 3-20 physicians; this practice has ` +
        `${practice.physicians.length}. Cascade modeling is less reliable outside that range.`,
    );
  }

  const attribution = attributeRevenue(practice);
  const attributionById = new Map(attribution.map(a => [a.physicianId, a]));

  const replacementCosts = practice.physicians.map(p =>
    estimateReplacementCost(p, attributionById.get(p.id)!, practice),
  );
  const replacementById = new Map(replacementCosts.map(r => [r.physicianId, r]));

  const continuityImpacts = practice.physicians.map(p =>
    assessContinuityImpact(p, attributionById.get(p.id)!, practice, replacementById.get(p.id)!),
  );
  const continuityById = new Map(continuityImpacts.map(c => [c.physicianId, c]));

  const recommendations: KeyPersonRecommendation[] = practice.physicians.map(p => {
    const attr = attributionById.get(p.id)!;
    const repl = replacementById.get(p.id)!;
    const cont = continuityById.get(p.id)!;

    // Coverage protects three distinct exposures: the cost of replacing the seat,
    // the contribution lost while it is empty, and the equity value that evaporates.
    const replacementCost = repl.totalReplacementCost;
    const lostContribution = attr.trueContribution;
    // Valuation protection is the portion of the decline not already counted above.
    const valuationProtection = Math.max(0, cont.practiceValuationDecline - replacementCost - lostContribution);

    const recommendedCoverage = Math.round((replacementCost + lostContribution + valuationProtection) / 50_000) * 50_000;

    const priority: KeyPersonRecommendation["priority"] =
      attr.contributionShare > 0.3 || cont.cascadeMultiple >= 2.5
        ? "critical"
        : attr.contributionShare > 0.18
          ? "high"
          : "moderate";

    if (attr.contributionShare > 0.3) {
      criticalFindings.push(
        `${p.name} drives ${Math.round(attr.contributionShare * 100)}% of true practice contribution. ` +
          `Loss of this physician is an existential event, not a staffing gap.`,
      );
    }
    if (Math.abs(attr.attributionVariancePercent) >= 30) {
      criticalFindings.push(
        `${p.name}'s true contribution differs from booked billings by ` +
          `${attr.attributionVariancePercent > 0 ? "+" : ""}${Math.round(attr.attributionVariancePercent)}% — ` +
          `referral generation and ancillary revenue are invisible in standard financial reports.`,
      );
    }
    if (cont.cascadeMultiple >= 2) {
      criticalFindings.push(
        `${p.name}: practice valuation falls ${cont.cascadeMultiple}x their direct revenue contribution once ` +
          `cascading workload and satisfaction effects are modeled.`,
      );
    }

    return {
      physicianId: p.id,
      name: p.name,
      recommendedCoverage,
      coverageBasis: {
        replacementCost: round(replacementCost),
        lostContribution: round(lostContribution),
        valuationProtection: round(valuationProtection),
      },
      estimatedAnnualPremium: estimatePremium(recommendedCoverage, p.age),
      priority,
    };
  });

  return {
    practiceName: practice.name,
    attribution,
    replacementCosts,
    continuityImpacts,
    recommendations,
    totalRecommendedCoverage: recommendations.reduce((s, r) => s + r.recommendedCoverage, 0),
    totalEstimatedPremium: round(recommendations.reduce((s, r) => s + r.estimatedAnnualPremium, 0)),
    criticalFindings,
    irsReferences: [
      "IRC § 101(j) — Employer-owned life insurance; notice and consent requirements",
      "IRS Form 8925 — Report of Employer-Owned Life Insurance Contracts",
      "IRC § 264(a)(1) — Premiums on key person policies are not deductible",
      "IRC § 101(a) — Death benefit proceeds are received income-tax-free when § 101(j) is satisfied",
      "Rev. Rul. 59-60 — Valuation of closely held business interests",
    ],
  };
}
