import { rulesForYear } from "./taxRules";
/**
 * SISTER INVENTION SI-032: Multi-Generational Wealth Transfer Simulation Engine with
 * Dynasty Trust Modeling, Generation-Skipping Transfer Tax Optimization, and 100-Year
 * Wealth Trajectory Projection (MGWTSE)
 * Patent Reference: Integrates SI-014 (Family Tree Mapping), PAT-005 (Tax Waterfall),
 * PAT-013 (Monte Carlo), SI-008 (CRT-IUL)
 *
 * Distinct from SI-015 (generationalWealthEngine), which projects wealth across
 * generations without trust structure or transfer-tax optimization. MGWTSE adds three
 * interlocking components:
 *
 *   DTM   — Dynasty Trust Modeler: simulates trust performance across 3+ generations
 *           including trustee succession, distribution policy, and fee drag.
 *   GSTO  — GST Tax Optimizer: allocates the generation-skipping transfer exemption
 *           across trust structures to minimize multi-generational tax erosion.
 *   HYWTP — 100-Year Wealth Trajectory Projector: models four generations under
 *           multiple tax-law scenarios.
 *
 * Narrowed use case (per application): families with combined net worth exceeding
 * $25,000,000 seeking multi-generational preservation.
 */

// ─── Transfer tax constants ───────────────────────────────────────────────────
/**
 * Per-person GST exemption. The application cites the 2024 figure of $13.61M; the
 * 2026 inflation-adjusted amount is used as the current default. Both are exposed so
 * a caller can model either.
 */
export const GST_EXEMPTION_2024 = 13_610_000;
export const GST_EXEMPTION_CURRENT = 15_000_000;
/** Flat GST tax rate, IRC § 2641 — equal to the top estate tax rate. */
export const GST_TAX_RATE = 0.40;
/** Top federal estate tax rate, IRC § 2001(c). */
export const ESTATE_TAX_RATE = 0.40;
/**
 * The 2026 basic exclusion under current law, from the versioned rule set: P.L. 119-21
 * (July 2025) set it at $15,000,000 indexed, so the TCJA sunset to ~$7.5M no longer
 * exists. The name is kept for the scenario table and existing imports.
 */
export const SUNSET_EXEMPTION = rulesForYear(2026).estateBasicExclusion;

export type TaxLawScenario = "current_law_sunset" | "permanent_extension" | "increased_rates";

export interface TaxLawAssumption {
  scenario: TaxLawScenario;
  label: string;
  /** Exemption per person once the scenario takes effect. */
  exemption: number;
  estateRate: number;
  gstRate: number;
  /** Year of the projection in which the change takes effect. */
  effectiveYear: number;
}

export const TAX_LAW_SCENARIOS: TaxLawAssumption[] = [
  {
    scenario: "current_law_sunset",
    label: "Current law (P.L. 119-21): $15M exclusion, indexed — no sunset",
    exemption: SUNSET_EXEMPTION,
    estateRate: 0.40,
    gstRate: 0.40,
    effectiveYear: 2,
  },
  {
    scenario: "permanent_extension",
    label: "Current exemption made permanent",
    exemption: GST_EXEMPTION_CURRENT,
    estateRate: 0.40,
    gstRate: 0.40,
    effectiveYear: 0,
  },
  {
    scenario: "increased_rates",
    label: "Exemption reduced and rates increased",
    exemption: 5_000_000,
    estateRate: 0.55,
    gstRate: 0.55,
    effectiveYear: 4,
  },
];

export type DistributionPolicy = "income_only" | "haircut_principal" | "ascertainable_standard" | "full_discretion";

/**
 * Annual distribution rate by policy. Income-only preserves the most principal;
 * full discretion distributes the most and compounds the least.
 */
export const DISTRIBUTION_RATE: Record<DistributionPolicy, number> = {
  income_only: 0.025,
  haircut_principal: 0.035,
  ascertainable_standard: 0.045,
  full_discretion: 0.06,
};

export type TrusteeType = "individual_family" | "corporate" | "directed_with_advisor" | "private_family_trust_company";

/**
 * Annual trustee fee as a share of assets, and an investment-drag adjustment.
 * The application's second emergent capability turns on this: a 2% annual difference
 * compounds into an enormous divergence by Generation 4.
 */
export const TRUSTEE_PROFILE: Record<TrusteeType, { feeRate: number; investmentDrag: number; label: string }> = {
  individual_family:          { feeRate: 0.0000, investmentDrag: 0.0125, label: "Individual family trustee" },
  corporate:                  { feeRate: 0.0110, investmentDrag: 0.0035, label: "Corporate trustee" },
  directed_with_advisor:      { feeRate: 0.0055, investmentDrag: 0.0020, label: "Directed trustee with investment advisor" },
  private_family_trust_company: { feeRate: 0.0035, investmentDrag: 0.0025, label: "Private family trust company" },
};

export interface TrustStructure {
  id: string;
  label: string;
  /** Initial funding amount. */
  fundingAmount: number;
  trusteeType: TrusteeType;
  distributionPolicy: DistributionPolicy;
  /** Expected gross annual investment return, as a decimal. */
  grossReturn: number;
  /**
   * Whether the trust is GST-exempt-eligible. A trust that will terminate within one
   * generation cannot usefully absorb GST exemption.
   */
  gstEligible: boolean;
  /** Generations the trust is designed to span. */
  generationSpan: number;
}

export interface TrusteeSuccessionScenario {
  label: string;
  /** Generation at which the successor takes over. */
  atGeneration: number;
  successorType: TrusteeType;
}

export interface MGWTSEInput {
  familyName: string;
  /** Combined family net worth available for transfer planning. */
  netWorth: number;
  trusts: TrustStructure[];
  /** GST exemption available per person. */
  gstExemptionAvailable: number;
  /** Number of exemption holders — typically 2 for a married couple. */
  exemptionHolders: number;
  /** Years per generation. */
  generationLength: number;
  /** Projection horizon; the application specifies 100 years / 4 generations. */
  horizonYears: number;
  inflationRate: number;
  /** Annual family spending drawn from trust distributions. */
  annualFamilySpending: number;
  successionScenarios?: TrusteeSuccessionScenario[];
}

export interface TrustYearProjection {
  year: number;
  generation: number;
  beginningValue: number;
  investmentGrowth: number;
  trusteeFees: number;
  distributions: number;
  endingValue: number;
  /** Real (inflation-adjusted) ending value in year-0 dollars. */
  realEndingValue: number;
}

export interface DynastyTrustProjection {
  trustId: string;
  label: string;
  trusteeLabel: string;
  /** Gross return less trustee fee and investment drag. */
  netReturn: number;
  years: TrustYearProjection[];
  finalValue: number;
  finalRealValue: number;
  totalDistributions: number;
  totalTrusteeFees: number;
}

export interface GSTAllocation {
  trustId: string;
  label: string;
  exemptionAllocated: number;
  /** Inclusion ratio under IRC § 2642: 1 − (exemption ÷ value transferred). */
  inclusionRatio: number;
  /** Value protected from GST tax across the projection. */
  shelteredValue: number;
  /** GST tax avoided by this allocation over the horizon. */
  gstTaxAvoided: number;
  /** Tax avoided per exemption dollar — the ranking metric. */
  leverageMultiple: number;
}

export interface GSTOptimization {
  allocations: GSTAllocation[];
  totalExemptionUsed: number;
  totalExemptionAvailable: number;
  totalGstTaxAvoided: number;
  /** GST tax avoided under an equal-split allocation, for comparison. */
  equalAllocationTaxAvoided: number;
  /** Emergent Capability 1 — optimized ÷ equal allocation. */
  optimizationAdvantage: number;
}

export interface ScenarioTrajectory {
  scenario: TaxLawScenario;
  label: string;
  /** Family wealth at the end of each generation, nominal. */
  generationEndValues: number[];
  /** Same, in year-0 real dollars. */
  generationEndRealValues: number[];
  totalTransferTaxPaid: number;
  finalWealth: number;
  finalRealWealth: number;
}

export interface SuccessionComparison {
  label: string;
  atGeneration: number;
  successorLabel: string;
  /** Total family wealth at horizon under this succession plan. */
  finalWealth: number;
  /** Difference against the baseline (no succession change). */
  deltaVsBaseline: number;
}

export interface MGWTSEResult {
  familyName: string;
  trustProjections: DynastyTrustProjection[];
  gstOptimization: GSTOptimization;
  scenarios: ScenarioTrajectory[];
  successionComparisons: SuccessionComparison[];
  /** Emergent Capability 2 — wealth spread from a 2% annual fee difference by Gen 4. */
  feeDragImpact: {
    lowCostFinalWealth: number;
    highCostFinalWealth: number;
    spread: number;
    annualFeeDifference: number;
  };
  criticalFindings: string[];
  irsReferences: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function netReturnFor(trust: TrustStructure, trusteeType: TrusteeType): number {
  const profile = TRUSTEE_PROFILE[trusteeType];
  return trust.grossReturn - profile.feeRate - profile.investmentDrag;
}

/**
 * DTM — Dynasty Trust Modeler.
 *
 * Projects a trust year by year: growth on the beginning balance, trustee fees on
 * assets, then distributions under the trust's policy. Trustee succession swaps the
 * fee and drag profile at the specified generation, which is where the compounding
 * divergence originates.
 */
export function modelDynastyTrust(
  trust: TrustStructure,
  input: MGWTSEInput,
  succession?: TrusteeSuccessionScenario,
): DynastyTrustProjection {
  const years: TrustYearProjection[] = [];
  let value = trust.fundingAmount;
  let totalDistributions = 0;
  let totalTrusteeFees = 0;

  const distributionRate = DISTRIBUTION_RATE[trust.distributionPolicy];

  for (let y = 1; y <= input.horizonYears; y += 1) {
    const generation = Math.min(trust.generationSpan, Math.ceil(y / input.generationLength));

    // Trustee in force this year — succession takes effect at its generation.
    const trusteeType =
      succession && generation >= succession.atGeneration ? succession.successorType : trust.trusteeType;
    const profile = TRUSTEE_PROFILE[trusteeType];

    const beginningValue = value;
    // Growth is computed on gross return; the drag is expressed as a fee-like
    // reduction so the two costs stay separable in reporting.
    const investmentGrowth = beginningValue * (trust.grossReturn - profile.investmentDrag);
    const trusteeFees = beginningValue * profile.feeRate;
    const afterGrowth = beginningValue + investmentGrowth - trusteeFees;
    const distributions = Math.max(0, afterGrowth * distributionRate);
    const endingValue = Math.max(0, afterGrowth - distributions);

    totalDistributions += distributions;
    totalTrusteeFees += trusteeFees;
    value = endingValue;

    years.push({
      year: y,
      generation,
      beginningValue: round(beginningValue),
      investmentGrowth: round(investmentGrowth),
      trusteeFees: round(trusteeFees),
      distributions: round(distributions),
      endingValue: round(endingValue),
      realEndingValue: round(endingValue / Math.pow(1 + input.inflationRate, y)),
    });
  }

  const effectiveTrustee = succession?.successorType ?? trust.trusteeType;

  return {
    trustId: trust.id,
    label: trust.label,
    trusteeLabel: TRUSTEE_PROFILE[effectiveTrustee].label,
    netReturn: round(netReturnFor(trust, effectiveTrustee) * 10000) / 10000,
    years,
    finalValue: round(value),
    finalRealValue: round(value / Math.pow(1 + input.inflationRate, input.horizonYears)),
    totalDistributions: round(totalDistributions),
    totalTrusteeFees: round(totalTrusteeFees),
  };
}

/**
 * GSTO — GST Tax Optimizer.
 *
 * Allocates exemption to the trusts where each dollar shelters the most future value.
 * Leverage is driven by how far a trust compounds over its generation span: a dollar
 * of exemption in a long-horizon, low-fee, low-distribution trust shelters far more
 * than the same dollar in a trust that distributes out within a generation.
 *
 * Inclusion ratio follows IRC § 2642(a): 1 − (exemption allocated ÷ value transferred).
 */
export function optimizeGSTAllocation(input: MGWTSEInput): GSTOptimization {
  const eligible = input.trusts.filter(t => t.gstEligible);
  const totalAvailable = input.gstExemptionAvailable * input.exemptionHolders;

  // Projected future value per dollar funded, over the trust's generation span.
  const leverageFor = (t: TrustStructure) => {
    const net = netReturnFor(t, t.trusteeType) - DISTRIBUTION_RATE[t.distributionPolicy];
    const spanYears = Math.min(input.horizonYears, t.generationSpan * input.generationLength);
    return Math.pow(1 + Math.max(-0.5, net), spanYears);
  };

  // Rank by leverage, then fill exemption greedily — a dollar always belongs in the
  // highest-leverage trust that can still absorb it.
  const ranked = [...eligible].sort((a, b) => leverageFor(b) - leverageFor(a));

  let remaining = totalAvailable;
  const allocations: GSTAllocation[] = ranked.map(t => {
    const allocated = Math.min(remaining, t.fundingAmount);
    remaining -= allocated;

    const inclusionRatio = t.fundingAmount > 0 ? Math.max(0, 1 - allocated / t.fundingAmount) : 0;
    const futureValue = t.fundingAmount * leverageFor(t);
    const shelteredShare = t.fundingAmount > 0 ? allocated / t.fundingAmount : 0;
    const shelteredValue = futureValue * shelteredShare;
    // GST tax applies at each generational skip the trust spans beyond the first.
    const skips = Math.max(0, t.generationSpan - 1);
    const gstTaxAvoided = shelteredValue * (1 - Math.pow(1 - GST_TAX_RATE, skips));

    return {
      trustId: t.id,
      label: t.label,
      exemptionAllocated: round(allocated),
      inclusionRatio: Math.round(inclusionRatio * 1e4) / 1e4,
      shelteredValue: round(shelteredValue),
      gstTaxAvoided: round(gstTaxAvoided),
      leverageMultiple: Math.round(leverageFor(t) * 100) / 100,
    };
  });

  // Baseline for comparison: split the exemption equally across eligible trusts.
  const equalShare = eligible.length > 0 ? totalAvailable / eligible.length : 0;
  const equalAllocationTaxAvoided = eligible.reduce((sum, t) => {
    const allocated = Math.min(equalShare, t.fundingAmount);
    const futureValue = t.fundingAmount * leverageFor(t);
    const shelteredShare = t.fundingAmount > 0 ? allocated / t.fundingAmount : 0;
    const skips = Math.max(0, t.generationSpan - 1);
    return sum + futureValue * shelteredShare * (1 - Math.pow(1 - GST_TAX_RATE, skips));
  }, 0);

  const totalGstTaxAvoided = allocations.reduce((s, a) => s + a.gstTaxAvoided, 0);

  return {
    allocations,
    totalExemptionUsed: round(totalAvailable - remaining),
    totalExemptionAvailable: round(totalAvailable),
    totalGstTaxAvoided: round(totalGstTaxAvoided),
    equalAllocationTaxAvoided: round(equalAllocationTaxAvoided),
    optimizationAdvantage:
      equalAllocationTaxAvoided > 0 ? Math.round((totalGstTaxAvoided / equalAllocationTaxAvoided) * 100) / 100 : 0,
  };
}

/**
 * HYWTP — 100-Year Wealth Trajectory Projector.
 *
 * Projects family wealth across four generations under a given tax-law scenario,
 * applying transfer tax at each generational boundary on the portion of wealth that
 * is not sheltered by GST exemption.
 */
export function projectTrajectory(
  input: MGWTSEInput,
  law: TaxLawAssumption,
  gst: GSTOptimization,
): ScenarioTrajectory {
  const generations = Math.ceil(input.horizonYears / input.generationLength);
  const generationEndValues: number[] = [];
  const generationEndRealValues: number[] = [];
  let totalTransferTaxPaid = 0;

  // Blended net return across the family's trusts, weighted by funding.
  const totalFunding = input.trusts.reduce((s, t) => s + t.fundingAmount, 0);
  const blendedNet =
    totalFunding > 0
      ? input.trusts.reduce(
          (s, t) =>
            s + (netReturnFor(t, t.trusteeType) - DISTRIBUTION_RATE[t.distributionPolicy]) * (t.fundingAmount / totalFunding),
          0,
        )
      : 0;

  // Share of wealth shielded from transfer tax by allocated exemption.
  const shelteredShare = totalFunding > 0 ? Math.min(1, gst.totalExemptionUsed / totalFunding) : 0;

  let wealth = input.netWorth;
  for (let g = 1; g <= generations; g += 1) {
    const startYear = (g - 1) * input.generationLength;

    for (let y = 0; y < input.generationLength; y += 1) {
      const absoluteYear = startYear + y;
      if (absoluteYear >= input.horizonYears) break;
      wealth = Math.max(0, wealth * (1 + blendedNet) - input.annualFamilySpending * Math.pow(1 + input.inflationRate, absoluteYear));
    }

    // Transfer tax at the generational boundary, on the unsheltered portion above
    // the available exemption.
    const yearOfBoundary = g * input.generationLength;
    const rate = yearOfBoundary >= law.effectiveYear ? law.estateRate : ESTATE_TAX_RATE;
    const exemption = (yearOfBoundary >= law.effectiveYear ? law.exemption : GST_EXEMPTION_CURRENT) * input.exemptionHolders;

    const exposedWealth = wealth * (1 - shelteredShare);
    const taxableAmount = Math.max(0, exposedWealth - exemption);
    const tax = taxableAmount * rate;
    totalTransferTaxPaid += tax;
    wealth = Math.max(0, wealth - tax);

    generationEndValues.push(round(wealth));
    generationEndRealValues.push(round(wealth / Math.pow(1 + input.inflationRate, yearOfBoundary)));
  }

  return {
    scenario: law.scenario,
    label: law.label,
    generationEndValues,
    generationEndRealValues,
    totalTransferTaxPaid: round(totalTransferTaxPaid),
    finalWealth: round(wealth),
    finalRealWealth: round(wealth / Math.pow(1 + input.inflationRate, input.horizonYears)),
  };
}

/**
 * Run the full multi-generational transfer simulation.
 */
export function simulateMultiGenerationalTransfer(input: MGWTSEInput): MGWTSEResult {
  const criticalFindings: string[] = [];

  if (input.trusts.length === 0) {
    throw new Error("At least one trust structure is required to simulate multi-generational transfer.");
  }
  if (input.netWorth < 25_000_000) {
    criticalFindings.push(
      `This engine is calibrated for families above $25M net worth; at ` +
        `$${Math.round(input.netWorth).toLocaleString()} the exemption may already cover the estate, ` +
        `making dynasty trust complexity unnecessary.`,
    );
  }

  const trustProjections = input.trusts.map(t => modelDynastyTrust(t, input));
  const gstOptimization = optimizeGSTAllocation(input);
  const scenarios = TAX_LAW_SCENARIOS.map(law => projectTrajectory(input, law, gstOptimization));

  // Trustee succession comparison — the application requires at least 5 scenarios.
  const baselineWealth = trustProjections.reduce((s, p) => s + p.finalValue, 0);
  const defaultSuccessions: TrusteeSuccessionScenario[] = [
    { label: "Family trustee takes over at Gen 2", atGeneration: 2, successorType: "individual_family" },
    { label: "Corporate trustee at Gen 2", atGeneration: 2, successorType: "corporate" },
    { label: "Directed trustee with advisor at Gen 2", atGeneration: 2, successorType: "directed_with_advisor" },
    { label: "Private family trust company at Gen 2", atGeneration: 2, successorType: "private_family_trust_company" },
    { label: "Private family trust company at Gen 3", atGeneration: 3, successorType: "private_family_trust_company" },
  ];
  const successions = input.successionScenarios?.length ? input.successionScenarios : defaultSuccessions;

  const successionComparisons: SuccessionComparison[] = successions.map(s => {
    const finalWealth = input.trusts.reduce((sum, t) => sum + modelDynastyTrust(t, input, s).finalValue, 0);
    return {
      label: s.label,
      atGeneration: s.atGeneration,
      successorLabel: TRUSTEE_PROFILE[s.successorType].label,
      finalWealth: round(finalWealth),
      deltaVsBaseline: round(finalWealth - baselineWealth),
    };
  });

  // Emergent Capability 2 — hold everything constant except trustee cost and let it
  // compound across the full horizon.
  const lowCostTrusts = input.trusts.map(t => ({ ...t, trusteeType: "private_family_trust_company" as TrusteeType }));
  const highCostTrusts = input.trusts.map(t => ({ ...t, trusteeType: "corporate" as TrusteeType }));
  const lowCostFinalWealth = lowCostTrusts.reduce((s, t) => s + modelDynastyTrust(t, input).finalValue, 0);
  const highCostFinalWealth = highCostTrusts.reduce((s, t) => s + modelDynastyTrust(t, input).finalValue, 0);
  const annualFeeDifference =
    TRUSTEE_PROFILE.corporate.feeRate +
    TRUSTEE_PROFILE.corporate.investmentDrag -
    (TRUSTEE_PROFILE.private_family_trust_company.feeRate + TRUSTEE_PROFILE.private_family_trust_company.investmentDrag);

  if (gstOptimization.optimizationAdvantage > 1.5) {
    criticalFindings.push(
      `Optimized GST allocation preserves ${gstOptimization.optimizationAdvantage}x more multi-generational wealth ` +
        `than splitting the exemption equally — $${Math.round(gstOptimization.totalGstTaxAvoided).toLocaleString()} ` +
        `vs. $${Math.round(gstOptimization.equalAllocationTaxAvoided).toLocaleString()} of GST tax avoided.`,
    );
  }
  if (gstOptimization.totalExemptionUsed < gstOptimization.totalExemptionAvailable) {
    const unused = gstOptimization.totalExemptionAvailable - gstOptimization.totalExemptionUsed;
    criticalFindings.push(
      `$${Math.round(unused).toLocaleString()} of GST exemption is unallocated. Unused exemption does not carry ` +
        `over at death — fund additional dynasty trust capacity or the exemption is lost.`,
    );
  }
  const spread = Math.abs(lowCostFinalWealth - highCostFinalWealth);
  criticalFindings.push(
    `A ${(annualFeeDifference * 100).toFixed(2)}% annual difference in trustee cost compounds to a ` +
      `$${Math.round(spread).toLocaleString()} difference by year ${input.horizonYears} — ` +
      `a divergence invisible in single-generation planning.`,
  );
  const sunset = scenarios.find(s => s.scenario === "current_law_sunset");
  const permanent = scenarios.find(s => s.scenario === "permanent_extension");
  if (sunset && permanent && permanent.finalWealth > sunset.finalWealth) {
    criticalFindings.push(
      `Tax-law risk spread: $${Math.round(permanent.finalWealth - sunset.finalWealth).toLocaleString()} separates the ` +
        `permanent-extension and sunset scenarios. Exemption used before a sunset is not clawed back ` +
        `(Treas. Reg. § 20.2010-1(c)), so funding now locks in today's exemption.`,
    );
  }

  return {
    familyName: input.familyName,
    trustProjections,
    gstOptimization,
    scenarios,
    successionComparisons,
    feeDragImpact: {
      lowCostFinalWealth: round(lowCostFinalWealth),
      highCostFinalWealth: round(highCostFinalWealth),
      spread: round(spread),
      annualFeeDifference: Math.round(annualFeeDifference * 1e4) / 1e4,
    },
    criticalFindings,
    irsReferences: [
      "IRC § 2601 — Tax on generation-skipping transfers",
      "IRC § 2631 — GST exemption amount and allocation",
      "IRC § 2641 — Applicable GST rate",
      "IRC § 2642(a) — Inclusion ratio",
      "IRC § 2010(c) — Basic exclusion amount and portability",
      "IRC § 2001(c) — Estate tax rate schedule",
      "Treas. Reg. § 20.2010-1(c) — No clawback of exemption used before a reduction",
    ],
  };
}
