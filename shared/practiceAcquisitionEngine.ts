/**
 * SISTER INVENTION SI-033: Practice Acquisition Due Diligence Automation Engine with
 * Client Book Quality Scoring, Revenue Sustainability Analysis, and Integration Risk
 * Assessment for Insurance Advisory Practice M&A (PADDA)
 * Patent Reference: Integrates SI-017 (Succession Valuation), PAT-011 (Russell Number),
 * SI-012 (Churn Prevention)
 *
 * Automates evaluation of an insurance advisory practice being considered for
 * acquisition. Three interlocking components:
 *
 *   CBQS — Client Book Quality Scorer: scores the target's client base across 15
 *          dimensions, surfacing risks that never appear on a P&L.
 *   RSA  — Revenue Sustainability Analyzer: projects revenue durability from renewal
 *          probability, retention under new ownership, and commission trail decay.
 *   IRA  — Integration Risk Assessor: scores five integration dimensions and prices
 *          the cost of closing each gap.
 *
 * Narrowed use case (per application): practice acquisitions with annual revenue
 * exceeding $500,000.
 */

export interface ClientRecord {
  id: string;
  age: number;
  /** Annual revenue this client generates for the practice. */
  annualRevenue: number;
  tenureYears: number;
  /** Products held — diversity drives cross-sell penetration. */
  products: string[];
  /** Policy persistency: share of policies still in force after year 1, 0-1. */
  persistency: number;
  /** Referrals this client generated in the last 12 months. */
  referralsLast12Months: number;
  /** Satisfaction score, 0-100. */
  satisfactionScore: number;
}

export interface TargetPractice {
  name: string;
  clients: ClientRecord[];
  annualRevenue: number;
  /** Share of revenue that is recurring commission trail vs. new business. */
  trailRevenuePercent: number;
  /** Years the practice has operated. */
  yearsInOperation: number;
  /** Principal advisor's age — succession urgency. */
  principalAge: number;
  /** Whether the principal will stay through transition. */
  principalRetained: boolean;
  /** Months the principal commits to staying, if retained. */
  principalTransitionMonths: number;
  /** Russell Number (PAT-011) advisor quality metric, 0-100. */
  russellNumber: number;
  askingPrice: number;
}

export interface AcquirerProfile {
  /** Technology platform in use — compared against the target's. */
  technologyPlatform: string;
  targetTechnologyPlatform: string;
  /** Service model: how clients are serviced post-close. */
  serviceModel: "high_touch" | "hybrid" | "digital_first";
  targetServiceModel: "high_touch" | "hybrid" | "digital_first";
  /** Advisor compensation structure. */
  compensationStructure: "salary" | "commission" | "hybrid";
  targetCompensationStructure: "salary" | "commission" | "hybrid";
  /** Share of client geography that overlaps the acquirer's existing footprint, 0-1. */
  geographicOverlap: number;
  /** Acquirer's prior integration experience, 0-1. Higher reduces risk. */
  integrationExperience: number;
}

// ─── CBQS ─────────────────────────────────────────────────────────────────────
export interface BookDimension {
  key: string;
  label: string;
  /** Raw measured value, in the dimension's natural unit. */
  value: number;
  /** Normalized 0-100 score. */
  score: number;
  weight: number;
  /** Plain-language read on what the number means for the acquisition. */
  interpretation: string;
}

export interface ClientBookQuality {
  dimensions: BookDimension[];
  /** Weighted composite, 0-100. */
  compositeScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  /** Clients individually representing more than 5% of revenue. */
  concentrationRisks: Array<{ clientId: string; revenueShare: number }>;
  /** Combined share held by the top five clients. */
  top5ConcentrationShare: number;
  redFlags: string[];
}

// ─── RSA ──────────────────────────────────────────────────────────────────────
export interface RevenueSustainability {
  /** Projected revenue for each of the next five years under new ownership. */
  projectedRevenue: number[];
  /** Share of year-1 revenue expected to survive to year 5. */
  fiveYearSurvivalRate: number;
  /** Expected client attrition in year 1 from the ownership change. */
  year1AttritionRate: number;
  /** Annual decay on the commission trail book. */
  trailDecayRate: number;
  /** Net present value of the projected revenue stream. */
  revenueNPV: number;
  /** Revenue considered durable enough to underwrite a purchase price. */
  durableRevenue: number;
}

// ─── IRA ──────────────────────────────────────────────────────────────────────
export interface IntegrationDimension {
  key: string;
  label: string;
  /** Risk score 0-100, where higher is riskier. */
  riskScore: number;
  /** One-time cost to close this gap. */
  remediationCost: number;
  detail: string;
}

export interface IntegrationRisk {
  dimensions: IntegrationDimension[];
  /** Mean risk across dimensions, 0-100. */
  compositeRisk: number;
  totalIntegrationCost: number;
  /** Months to reach a stable integrated state. */
  estimatedIntegrationMonths: number;
}

export interface PADDAResult {
  practiceName: string;
  bookQuality: ClientBookQuality;
  sustainability: RevenueSustainability;
  integrationRisk: IntegrationRisk;
  /** Standard revenue-multiple valuation, before due diligence adjustments. */
  standardValuation: number;
  /** Valuation after integration cost and durability adjustments. */
  adjustedValuation: number;
  /** Emergent Capability 2 — how far the standard multiple overstates value. */
  valuationCorrectionPercent: number;
  askingPrice: number;
  /** Adjusted valuation less asking price. Negative means overpriced. */
  bidGap: number;
  recommendation: "proceed" | "proceed_with_conditions" | "renegotiate" | "walk_away";
  criticalFindings: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Clamp a value into 0-100. */
function clamp100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Scores a dimension where lower raw values are better, mapping `best` to 100 and
 * `worst` to 0 with linear interpolation between.
 */
function scoreInverse(value: number, best: number, worst: number): number {
  if (worst === best) return 50;
  return clamp100(((worst - value) / (worst - best)) * 100);
}

/** Scores a dimension where higher raw values are better. */
function scoreDirect(value: number, worst: number, best: number): number {
  if (best === worst) return 50;
  return clamp100(((value - worst) / (best - worst)) * 100);
}

/**
 * CBQS — Client Book Quality Scorer.
 *
 * Fifteen dimensions, weighted. The point of the component is that a practice can
 * show clean financials while carrying concentration, age, or persistency problems
 * that only surface when the book itself is examined client by client.
 */
export function scoreClientBook(practice: TargetPractice): ClientBookQuality {
  const clients = practice.clients;
  if (clients.length === 0) {
    throw new Error("Cannot score a client book with no clients.");
  }

  const totalRevenue = clients.reduce((s, c) => s + c.annualRevenue, 0);
  const n = clients.length;

  const avgAge = clients.reduce((s, c) => s + c.age, 0) / n;
  const avgTenure = clients.reduce((s, c) => s + c.tenureYears, 0) / n;
  const avgPersistency = clients.reduce((s, c) => s + c.persistency, 0) / n;
  const avgSatisfaction = clients.reduce((s, c) => s + c.satisfactionScore, 0) / n;
  const avgProducts = clients.reduce((s, c) => s + c.products.length, 0) / n;
  const referralRate = clients.reduce((s, c) => s + c.referralsLast12Months, 0) / n;
  const avgRevenuePerClient = totalRevenue / n;

  // Concentration: any single client above 5% of revenue is a flagged risk.
  const shares = clients
    .map(c => ({ clientId: c.id, revenueShare: totalRevenue > 0 ? c.annualRevenue / totalRevenue : 0 }))
    .sort((a, b) => b.revenueShare - a.revenueShare);
  const concentrationRisks = shares.filter(s => s.revenueShare > 0.05);
  const top5ConcentrationShare = shares.slice(0, 5).reduce((s, x) => s + x.revenueShare, 0);
  const maxShare = shares[0]?.revenueShare ?? 0;

  // Herfindahl index over revenue shares — a scale-free concentration measure.
  const hhi = shares.reduce((s, x) => s + x.revenueShare * x.revenueShare, 0);

  // Tenure dispersion: a book where everyone joined at once is more fragile than
  // one with a staggered, continuously replenished client base.
  const tenureVariance = clients.reduce((s, c) => s + Math.pow(c.tenureYears - avgTenure, 2), 0) / n;
  const tenureDispersion = Math.sqrt(tenureVariance);

  // Share of clients likely to enter decumulation or mortality within 10 years.
  const agingShare = clients.filter(c => c.age >= 70).length / n;
  // Share of revenue that is multi-product — stickier than single-product clients.
  const multiProductRevenueShare =
    totalRevenue > 0
      ? clients.filter(c => c.products.length >= 2).reduce((s, c) => s + c.annualRevenue, 0) / totalRevenue
      : 0;
  const lowSatisfactionShare = clients.filter(c => c.satisfactionScore < 60).length / n;
  const dormantShare = clients.filter(c => c.referralsLast12Months === 0 && c.satisfactionScore < 70).length / n;

  const dimensions: BookDimension[] = [
    {
      key: "avg_client_age", label: "Average client age", value: round(avgAge),
      score: scoreInverse(avgAge, 45, 78), weight: 0.09,
      interpretation: avgAge >= 68
        ? "Book is skewed to decumulation; revenue will decline as clients draw down and pass."
        : "Client age profile supports a multi-year revenue runway.",
    },
    {
      key: "aging_share", label: "Share of clients age 70+", value: round(agingShare * 100),
      score: scoreInverse(agingShare, 0.05, 0.55), weight: 0.06,
      interpretation: agingShare > 0.35
        ? "More than a third of the book is 70+, concentrating mortality and decumulation risk."
        : "Aging concentration is within normal range.",
    },
    {
      key: "policy_mix", label: "Average products per client", value: round(avgProducts),
      score: scoreDirect(avgProducts, 1, 3.5), weight: 0.08,
      interpretation: avgProducts < 1.4
        ? "Single-product book — clients have little switching friction and cross-sell is unproven."
        : "Multi-product relationships increase retention under new ownership.",
    },
    {
      key: "multi_product_revenue", label: "Revenue from multi-product clients", value: round(multiProductRevenueShare * 100),
      score: scoreDirect(multiProductRevenueShare, 0.15, 0.8), weight: 0.07,
      interpretation: "Multi-product revenue is materially stickier through an ownership transition.",
    },
    {
      key: "premium_concentration", label: "Largest single-client revenue share", value: round(maxShare * 100),
      score: scoreInverse(maxShare, 0.02, 0.25), weight: 0.11,
      interpretation: maxShare > 0.05
        ? `Largest client is ${Math.round(maxShare * 100)}% of revenue — above the 5% concentration threshold.`
        : "No single client exceeds the 5% concentration threshold.",
    },
    {
      key: "top5_concentration", label: "Top 5 client revenue share", value: round(top5ConcentrationShare * 100),
      score: scoreInverse(top5ConcentrationShare, 0.1, 0.65), weight: 0.09,
      interpretation: top5ConcentrationShare > 0.4
        ? "Top five clients carry the book; losing two of them post-close would be catastrophic."
        : "Revenue is reasonably distributed across the book.",
    },
    {
      key: "hhi", label: "Revenue Herfindahl index", value: Math.round(hhi * 1e4) / 1e4,
      score: scoreInverse(hhi, 0.01, 0.2), weight: 0.05,
      interpretation: "Scale-free measure of revenue concentration across the full book.",
    },
    {
      key: "avg_tenure", label: "Average client tenure (years)", value: round(avgTenure),
      score: scoreDirect(avgTenure, 1.5, 14), weight: 0.09,
      interpretation: avgTenure < 3
        ? "Short tenure — relationships are not yet durable enough to survive a change of advisor."
        : "Long tenure indicates durable relationships.",
    },
    {
      key: "tenure_dispersion", label: "Tenure dispersion (std dev)", value: round(tenureDispersion),
      score: scoreDirect(tenureDispersion, 0.5, 7), weight: 0.04,
      interpretation: tenureDispersion < 2
        ? "Clients were acquired in a narrow window — the book is not continuously replenished."
        : "Staggered acquisition history indicates ongoing new-client generation.",
    },
    {
      key: "persistency", label: "Average policy persistency", value: round(avgPersistency * 100),
      score: scoreDirect(avgPersistency, 0.6, 0.97), weight: 0.12,
      interpretation: avgPersistency < 0.82
        ? "Persistency below 82% signals placement quality problems and chargeback exposure."
        : "Persistency supports a durable commission trail.",
    },
    {
      key: "cross_sell", label: "Cross-sell penetration", value: round((avgProducts - 1) * 100),
      score: scoreDirect(avgProducts - 1, 0, 2.2), weight: 0.05,
      interpretation: "Headroom for the acquirer to deepen existing relationships.",
    },
    {
      key: "referral_rate", label: "Referrals per client per year", value: round(referralRate),
      score: scoreDirect(referralRate, 0, 0.85), weight: 0.06,
      interpretation: referralRate < 0.12
        ? "The book does not generate its own growth; all new business must be bought or prospected."
        : "Organic referral generation adds growth the multiple does not price.",
    },
    {
      key: "satisfaction", label: "Average satisfaction score", value: round(avgSatisfaction),
      score: clamp100(avgSatisfaction), weight: 0.05,
      interpretation: avgSatisfaction < 70
        ? "Satisfaction below 70 predicts elevated attrition the moment the advisor changes."
        : "Satisfaction supports retention through transition.",
    },
    {
      key: "dormant_share", label: "Dormant / disengaged client share", value: round(dormantShare * 100),
      score: scoreInverse(dormantShare, 0.03, 0.45), weight: 0.02,
      interpretation: "Disengaged clients rarely survive a servicing handoff.",
    },
    {
      key: "revenue_per_client", label: "Average revenue per client", value: round(avgRevenuePerClient),
      score: scoreDirect(avgRevenuePerClient, 400, 6_500), weight: 0.02,
      interpretation: "Servicing economics — low revenue per client raises the cost to serve post-close.",
    },
  ];

  const compositeScore = dimensions.reduce((s, d) => s + d.score * d.weight, 0);
  const grade: ClientBookQuality["grade"] =
    compositeScore >= 85 ? "A" : compositeScore >= 72 ? "B" : compositeScore >= 58 ? "C" : compositeScore >= 45 ? "D" : "F";

  const redFlags: string[] = [];
  if (concentrationRisks.length > 0) {
    redFlags.push(
      `${concentrationRisks.length} client(s) each exceed 5% of revenue; the largest is ` +
        `${Math.round(maxShare * 100)}%. This concentration is invisible in the practice's financial statements.`,
    );
  }
  if (top5ConcentrationShare > 0.4) {
    redFlags.push(
      `Top 5 clients represent ${Math.round(top5ConcentrationShare * 100)}% of revenue — catastrophic exposure ` +
        `if those relationships do not transfer.`,
    );
  }
  if (avgPersistency < 0.82) {
    redFlags.push(`Persistency of ${Math.round(avgPersistency * 100)}% implies chargeback exposure on recent placements.`);
  }
  if (avgAge >= 68) {
    redFlags.push(`Average client age of ${Math.round(avgAge)} means the book is in structural decline.`);
  }
  if (lowSatisfactionShare > 0.25) {
    redFlags.push(`${Math.round(lowSatisfactionShare * 100)}% of clients score below 60 on satisfaction.`);
  }

  return {
    dimensions,
    compositeScore: round(compositeScore),
    grade,
    concentrationRisks: concentrationRisks.map(c => ({ clientId: c.clientId, revenueShare: round(c.revenueShare * 100) })),
    top5ConcentrationShare: round(top5ConcentrationShare * 100),
    redFlags,
  };
}

/**
 * RSA — Revenue Sustainability Analyzer.
 *
 * Projects five years of revenue under new ownership. Year-1 attrition is driven by
 * book quality, whether the principal stays through transition, and the acquirer's
 * integration track record. Trail revenue decays at the book's persistency rate;
 * new business depends on retained production capability.
 */
export function analyzeRevenueSustainability(
  practice: TargetPractice,
  acquirer: AcquirerProfile,
  bookQuality: ClientBookQuality,
  discountRate = 0.12,
): RevenueSustainability {
  const avgPersistency =
    practice.clients.reduce((s, c) => s + c.persistency, 0) / Math.max(1, practice.clients.length);

  // Base attrition from an ownership change, reduced by book quality, principal
  // retention, and the acquirer's integration experience.
  const qualityRelief = (bookQuality.compositeScore / 100) * 0.16;
  const principalRelief = practice.principalRetained
    ? Math.min(0.12, 0.02 + practice.principalTransitionMonths * 0.006)
    : 0;
  const experienceRelief = acquirer.integrationExperience * 0.05;
  const year1AttritionRate = Math.max(0.03, Math.min(0.5, 0.28 - qualityRelief - principalRelief - experienceRelief));

  // Trail decays with persistency; a book that does not persist bleeds its trail.
  const trailDecayRate = Math.max(0.02, 1 - avgPersistency);

  const trailShare = practice.trailRevenuePercent;
  const newBusinessShare = 1 - trailShare;

  const projectedRevenue: number[] = [];
  for (let year = 1; year <= 5; year += 1) {
    // Attrition is heaviest in year 1 and tapers as the book stabilizes.
    const cumulativeRetention =
      (1 - year1AttritionRate) * Math.pow(1 - trailDecayRate, Math.max(0, year - 1));

    // New business capability collapses if the principal leaves and is not replaced.
    const newBusinessCapability = practice.principalRetained
      ? Math.max(0.35, 1 - (year - 1) * 0.1)
      : Math.max(0.15, 0.45 - (year - 1) * 0.08);

    const revenue =
      practice.annualRevenue * trailShare * cumulativeRetention +
      practice.annualRevenue * newBusinessShare * cumulativeRetention * newBusinessCapability;

    projectedRevenue.push(round(revenue));
  }

  const revenueNPV = projectedRevenue.reduce((s, r, i) => s + r / Math.pow(1 + discountRate, i + 1), 0);
  const fiveYearSurvivalRate = practice.annualRevenue > 0 ? projectedRevenue[4] / practice.annualRevenue : 0;

  // Durable revenue: what an underwriter would lend against — the stabilized
  // year-3 figure, which is past the transition shock but not yet speculative.
  const durableRevenue = projectedRevenue[2];

  return {
    projectedRevenue,
    fiveYearSurvivalRate: round(fiveYearSurvivalRate),
    year1AttritionRate: round(year1AttritionRate),
    trailDecayRate: round(trailDecayRate),
    revenueNPV: round(revenueNPV),
    durableRevenue: round(durableRevenue),
  };
}

/**
 * IRA — Integration Risk Assessor.
 *
 * Scores the five dimensions the application enumerates and prices remediation for
 * each. Integration cost is what turns a fair revenue multiple into an overpayment.
 */
export function assessIntegrationRisk(practice: TargetPractice, acquirer: AcquirerProfile): IntegrationRisk {
  const revenue = practice.annualRevenue;
  const experienceRelief = 1 - acquirer.integrationExperience * 0.4;

  const platformMismatch = acquirer.technologyPlatform !== acquirer.targetTechnologyPlatform;
  const serviceMismatch = acquirer.serviceModel !== acquirer.targetServiceModel;
  const compMismatch = acquirer.compensationStructure !== acquirer.targetCompensationStructure;

  const dimensions: IntegrationDimension[] = [
    {
      key: "technology",
      label: "Technology platform compatibility",
      riskScore: clamp100((platformMismatch ? 72 : 15) * experienceRelief),
      remediationCost: round((platformMismatch ? revenue * 0.09 + 22_000 : revenue * 0.015) * experienceRelief),
      detail: platformMismatch
        ? `Target runs ${acquirer.targetTechnologyPlatform} against the acquirer's ${acquirer.technologyPlatform}. ` +
          `Data migration, re-papering, and retraining are required.`
        : "Shared platform — client and policy data migrate without re-papering.",
    },
    {
      key: "service_model",
      label: "Service model alignment",
      riskScore: clamp100((serviceMismatch ? 68 : 12) * experienceRelief),
      remediationCost: round((serviceMismatch ? revenue * 0.07 : revenue * 0.01) * experienceRelief),
      detail: serviceMismatch
        ? `Clients accustomed to a ${acquirer.targetServiceModel.replace("_", " ")} model will be moved to ` +
          `${acquirer.serviceModel.replace("_", " ")}. Service-level change is a leading cause of post-close attrition.`
        : "Service models align; clients experience continuity of servicing.",
    },
    {
      key: "compensation",
      label: "Compensation structure compatibility",
      riskScore: clamp100((compMismatch ? 58 : 10) * experienceRelief),
      remediationCost: round((compMismatch ? revenue * 0.05 : revenue * 0.008) * experienceRelief),
      detail: compMismatch
        ? `Target advisors are on ${acquirer.targetCompensationStructure} while the acquirer runs ` +
          `${acquirer.compensationStructure}. Expect producer departures without a bridge arrangement.`
        : "Compensation structures match; no producer re-contracting required.",
    },
    {
      key: "geographic",
      label: "Geographic overlap",
      riskScore: clamp100((1 - acquirer.geographicOverlap) * 70 * experienceRelief),
      remediationCost: round(revenue * (1 - acquirer.geographicOverlap) * 0.05 * experienceRelief),
      detail:
        acquirer.geographicOverlap < 0.35
          ? `Only ${Math.round(acquirer.geographicOverlap * 100)}% geographic overlap — servicing the book requires ` +
            `new local presence or remote servicing clients did not sign up for.`
          : "Substantial geographic overlap; the existing service footprint covers the book.",
    },
    {
      key: "client_communication",
      label: "Client communication complexity",
      riskScore: clamp100(
        (practice.principalRetained ? 22 : 74) * experienceRelief +
          (practice.clients.length > 400 ? 12 : 0),
      ),
      remediationCost: round((practice.clients.length * (practice.principalRetained ? 38 : 95)) * experienceRelief),
      detail: practice.principalRetained
        ? `Principal stays ${practice.principalTransitionMonths} months and can personally introduce the acquirer ` +
          `to ${practice.clients.length} clients.`
        : `Principal exits at close — ${practice.clients.length} clients must be contacted cold by an unfamiliar advisor.`,
    },
  ];

  const compositeRisk = dimensions.reduce((s, d) => s + d.riskScore, 0) / dimensions.length;
  const totalIntegrationCost = dimensions.reduce((s, d) => s + d.remediationCost, 0);

  return {
    dimensions,
    compositeRisk: round(compositeRisk),
    totalIntegrationCost: round(totalIntegrationCost),
    estimatedIntegrationMonths: Math.round(6 + (compositeRisk / 100) * 18),
  };
}

/**
 * Run the full practice acquisition due diligence.
 *
 * The standard market valuation is a multiple of trailing revenue. The adjusted
 * valuation replaces trailing revenue with durable revenue, then subtracts the
 * integration cost — the correction the application's second emergent capability
 * describes.
 */
export function evaluatePracticeAcquisition(
  practice: TargetPractice,
  acquirer: AcquirerProfile,
  discountRate = 0.12,
): PADDAResult {
  const criticalFindings: string[] = [];

  if (practice.annualRevenue < 500_000) {
    criticalFindings.push(
      `This engine is calibrated for acquisitions above $500,000 in annual revenue; at ` +
        `$${Math.round(practice.annualRevenue).toLocaleString()} the diligence cost may exceed the risk it retires.`,
    );
  }

  const bookQuality = scoreClientBook(practice);
  const sustainability = analyzeRevenueSustainability(practice, acquirer, bookQuality, discountRate);
  const integrationRisk = assessIntegrationRisk(practice, acquirer);

  // Market multiple, adjusted by advisor quality (PAT-011 Russell Number).
  const baseMultiple = 2.2 + (practice.russellNumber / 100) * 0.9;
  const standardValuation = practice.annualRevenue * baseMultiple;

  // The durable-revenue multiple prices what actually survives the transition.
  const adjustedValuation = Math.max(
    0,
    sustainability.durableRevenue * baseMultiple - integrationRisk.totalIntegrationCost,
  );

  const valuationCorrectionPercent =
    standardValuation > 0 ? ((standardValuation - adjustedValuation) / standardValuation) * 100 : 0;

  const bidGap = adjustedValuation - practice.askingPrice;

  const recommendation: PADDAResult["recommendation"] =
    bidGap >= 0 && bookQuality.grade <= "B" && integrationRisk.compositeRisk < 50
      ? "proceed"
      : bidGap >= 0
        ? "proceed_with_conditions"
        : bidGap > -standardValuation * 0.25
          ? "renegotiate"
          : "walk_away";

  criticalFindings.push(...bookQuality.redFlags);

  if (valuationCorrectionPercent > 0) {
    criticalFindings.push(
      `Integration-adjusted valuation is ${Math.round(valuationCorrectionPercent)}% below the standard ` +
        `${round(baseMultiple)}x revenue multiple — $${Math.round(adjustedValuation).toLocaleString()} vs. ` +
        `$${Math.round(standardValuation).toLocaleString()}. The correction is invisible without combining ` +
        `due diligence with valuation.`,
    );
  }
  if (bidGap < 0) {
    criticalFindings.push(
      `Asking price of $${Math.round(practice.askingPrice).toLocaleString()} exceeds adjusted value by ` +
        `$${Math.round(Math.abs(bidGap)).toLocaleString()}. Renegotiate toward the durable-revenue basis or walk.`,
    );
  }
  if (!practice.principalRetained) {
    criticalFindings.push(
      `Principal exits at close. Modeled year-1 attrition rises to ` +
        `${Math.round(sustainability.year1AttritionRate * 100)}%; a retention agreement of 12+ months is the single ` +
        `highest-leverage term available in this negotiation.`,
    );
  }
  if (practice.principalAge >= 65 && !practice.principalRetained) {
    criticalFindings.push(
      `Principal is ${practice.principalAge} and leaving — verify whether clients have already begun moving ` +
        `in anticipation of retirement, which would make trailing revenue overstate the current book.`,
    );
  }

  return {
    practiceName: practice.name,
    bookQuality,
    sustainability,
    integrationRisk,
    standardValuation: round(standardValuation),
    adjustedValuation: round(adjustedValuation),
    valuationCorrectionPercent: round(valuationCorrectionPercent),
    askingPrice: round(practice.askingPrice),
    bidGap: round(bidGap),
    recommendation,
    criticalFindings,
  };
}
