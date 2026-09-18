/**
 * SISTER INVENTION SI-031: Disability Insurance Gap Analyzer with Income Replacement
 * Optimization, Occupation-Specific Disability Probability Modeling, and Multi-Policy
 * Coordination for High-Income Professionals (DIGA)
 * Patent Reference: Integrates SI-005 (Living Benefits), PAT-004 (Wealth Genome),
 * PAT-005 (Tax Waterfall)
 *
 * Distinct from SI-013 (disabilityGapEngine), which analyzes a single group policy
 * against income. DIGA adds occupation-specific actuarial probability and coordinates
 * coverage across three simultaneous sources. Three interlocking components:
 *
 *   OSDPM — Occupation-Specific Disability Probability Model: disability incidence by
 *           occupation category, age, and health status, from BLS/SSA/carrier bases.
 *   MPC   — Multi-Policy Coordinator: optimizes across employer group disability,
 *           individual disability, and IUL living benefit riders to close gaps
 *           without paying twice for overlapping coverage.
 *   Tax-aware gap analysis: employer-paid group benefits are taxable under IRC § 105
 *           while individually-paid benefits are tax-free under IRC § 104(a)(3) — a
 *           distinction that changes the optimal allocation.
 *
 * Narrowed use case (per application): professionals earning $300,000+ where the gap
 * between a capped group benefit and actual income creates catastrophic risk.
 */

// ─── OSDPM reference data ─────────────────────────────────────────────────────
/**
 * Occupation categories with base annual disability incidence and own-occupation
 * risk weighting. Incidence figures are calibrated to Social Security Administration
 * disability-insured worker incidence and carrier occupational class tables.
 *
 * `baseIncidence` is the annual probability of a disability lasting 90+ days for a
 * healthy 35-year-old in that category. `manualIntensity` raises incidence for
 * physically demanding work; `specialtyRisk` raises own-occupation exposure for
 * professionals whose income depends on fine motor skill or procedural capability.
 */
export interface OccupationCategory {
  key: string;
  label: string;
  /** Carrier occupational class: 6 = professional/lowest risk, 1 = highest risk. */
  occupationClass: 1 | 2 | 3 | 4 | 5 | 6;
  baseIncidence: number;
  manualIntensity: number;
  specialtyRisk: number;
}

export const OCCUPATION_CATEGORIES: OccupationCategory[] = [
  { key: "surgeon",            label: "Surgeon",                        occupationClass: 6, baseIncidence: 0.0072, manualIntensity: 0.15, specialtyRisk: 0.85 },
  { key: "interventional_cardiologist", label: "Interventional Cardiologist", occupationClass: 6, baseIncidence: 0.0074, manualIntensity: 0.15, specialtyRisk: 0.82 },
  { key: "anesthesiologist",   label: "Anesthesiologist",               occupationClass: 6, baseIncidence: 0.0070, manualIntensity: 0.12, specialtyRisk: 0.70 },
  { key: "dentist",            label: "Dentist",                        occupationClass: 6, baseIncidence: 0.0081, manualIntensity: 0.22, specialtyRisk: 0.88 },
  { key: "oral_surgeon",       label: "Oral & Maxillofacial Surgeon",   occupationClass: 6, baseIncidence: 0.0083, manualIntensity: 0.24, specialtyRisk: 0.88 },
  { key: "physician_primary",  label: "Primary Care Physician",         occupationClass: 6, baseIncidence: 0.0065, manualIntensity: 0.08, specialtyRisk: 0.45 },
  { key: "psychiatrist",       label: "Psychiatrist",                   occupationClass: 6, baseIncidence: 0.0061, manualIntensity: 0.04, specialtyRisk: 0.30 },
  { key: "radiologist",        label: "Radiologist",                    occupationClass: 6, baseIncidence: 0.0063, manualIntensity: 0.05, specialtyRisk: 0.55 },
  { key: "attorney",           label: "Attorney",                       occupationClass: 5, baseIncidence: 0.0058, manualIntensity: 0.03, specialtyRisk: 0.25 },
  { key: "cpa",                label: "CPA / Accountant",               occupationClass: 5, baseIncidence: 0.0056, manualIntensity: 0.03, specialtyRisk: 0.22 },
  { key: "executive",          label: "Corporate Executive",            occupationClass: 5, baseIncidence: 0.0060, manualIntensity: 0.05, specialtyRisk: 0.20 },
  { key: "business_owner",     label: "Business Owner",                 occupationClass: 4, baseIncidence: 0.0068, manualIntensity: 0.12, specialtyRisk: 0.35 },
  { key: "engineer",           label: "Engineer",                       occupationClass: 5, baseIncidence: 0.0059, manualIntensity: 0.08, specialtyRisk: 0.20 },
  { key: "software_engineer",  label: "Software Engineer",              occupationClass: 5, baseIncidence: 0.0055, manualIntensity: 0.04, specialtyRisk: 0.18 },
  { key: "veterinarian",       label: "Veterinarian",                   occupationClass: 5, baseIncidence: 0.0079, manualIntensity: 0.28, specialtyRisk: 0.60 },
  { key: "pharmacist",         label: "Pharmacist",                     occupationClass: 5, baseIncidence: 0.0062, manualIntensity: 0.10, specialtyRisk: 0.30 },
  { key: "chiropractor",       label: "Chiropractor",                   occupationClass: 4, baseIncidence: 0.0090, manualIntensity: 0.38, specialtyRisk: 0.80 },
  { key: "physical_therapist", label: "Physical Therapist",             occupationClass: 4, baseIncidence: 0.0088, manualIntensity: 0.40, specialtyRisk: 0.70 },
  { key: "sales_professional", label: "Sales Professional",             occupationClass: 4, baseIncidence: 0.0066, manualIntensity: 0.10, specialtyRisk: 0.25 },
  { key: "real_estate_broker", label: "Real Estate Broker",             occupationClass: 4, baseIncidence: 0.0067, manualIntensity: 0.10, specialtyRisk: 0.22 },
  { key: "airline_pilot",      label: "Airline Pilot",                  occupationClass: 3, baseIncidence: 0.0105, manualIntensity: 0.20, specialtyRisk: 0.95 },
  { key: "dental_hygienist",   label: "Dental Hygienist",               occupationClass: 3, baseIncidence: 0.0094, manualIntensity: 0.42, specialtyRisk: 0.75 },
  { key: "contractor",         label: "General Contractor",             occupationClass: 2, baseIncidence: 0.0128, manualIntensity: 0.62, specialtyRisk: 0.55 },
  { key: "skilled_trades",     label: "Skilled Trades",                 occupationClass: 2, baseIncidence: 0.0135, manualIntensity: 0.70, specialtyRisk: 0.55 },
  { key: "construction",       label: "Construction Labor",             occupationClass: 1, baseIncidence: 0.0162, manualIntensity: 0.85, specialtyRisk: 0.50 },
];

export type HealthStatus = "excellent" | "good" | "fair" | "poor";

/** Underwriting-style health multipliers applied to base incidence. */
export const HEALTH_MULTIPLIER: Record<HealthStatus, number> = {
  excellent: 0.82,
  good: 1.0,
  fair: 1.45,
  poor: 2.3,
};

export type DisabilityDefinition = "own_occupation" | "modified_own_occupation" | "any_occupation";

export interface GroupDisabilityPolicy {
  /** Percentage of income replaced, as a decimal (0.6 = 60%). */
  replacementPercent: number;
  /** Monthly benefit cap — the source of the gap for high earners. */
  monthlyCap: number;
  definition: DisabilityDefinition;
  eliminationPeriodDays: number;
  benefitPeriodMonths: number;
  /** True when the employer pays the premium, making benefits taxable. */
  employerPaid: boolean;
}

export interface IndividualDisabilityPolicy {
  monthlyBenefit: number;
  definition: DisabilityDefinition;
  eliminationPeriodDays: number;
  benefitPeriodMonths: number;
  /** True when premiums are paid with after-tax dollars (benefits tax-free). */
  afterTaxPremium: boolean;
  annualPremium: number;
}

export interface IULLivingBenefitRider {
  /** Total accelerated benefit available, typically a share of the death benefit. */
  maxAcceleratedBenefit: number;
  /** Monthly draw available under the rider. */
  monthlyBenefit: number;
  /** Months the rider will pay. */
  benefitPeriodMonths: number;
  eliminationPeriodDays: number;
}

export interface DIGAInput {
  annualIncome: number;
  age: number;
  occupationKey: string;
  healthStatus: HealthStatus;
  /** Marginal federal + state rate as a decimal. */
  marginalTaxRate: number;
  /** Monthly expenses that must be covered during disability. */
  monthlyExpenses: number;
  /** Age at which income would have ended anyway. */
  retirementAge: number;
  groupPolicy?: GroupDisabilityPolicy;
  individualPolicy?: IndividualDisabilityPolicy;
  iulRider?: IULLivingBenefitRider;
}

export interface DisabilityProbability {
  occupationLabel: string;
  occupationClass: number;
  /** Annual probability of a 90+ day disability at the client's current age. */
  annualProbability: number;
  /** Cumulative probability of at least one such disability before retirement. */
  cumulativeToRetirement: number;
  /** Expected duration in months given a disability occurs. */
  expectedDurationMonths: number;
  /** Share of disabilities that would prevent own-occupation work but not any work. */
  ownOccupationOnlyShare: number;
}

export type GapType = "income_replacement" | "benefit_period" | "definition_of_disability";

export interface CoverageGap {
  type: GapType;
  label: string;
  /** Monthly dollar gap, where the gap is expressed in dollars. */
  monthlyGap: number;
  /** Total exposure created by this gap over the relevant horizon. */
  totalExposure: number;
  severity: "critical" | "significant" | "minor" | "none";
  detail: string;
}

export interface TaxAwareGap {
  /** Monthly after-tax income the client currently lives on. */
  monthlyAfterTaxIncome: number;
  /** Pre-tax benefit total across all sources. */
  grossMonthlyBenefit: number;
  /** After-tax benefit, applying IRC § 105 vs § 104(a)(3) treatment per source. */
  netMonthlyBenefit: number;
  /**
   * The gap a naive analysis reports: gross benefit against gross income. Stated on
   * a pre-tax basis, so it is not directly comparable to `afterTaxGap` in dollars.
   */
  preTaxGap: number;
  /** The gap that actually exists: net benefit against after-tax income. */
  afterTaxGap: number;
  /**
   * Benefit lost to taxation each month — gross benefit less net benefit. This is
   * the distinction that changes optimal allocation: a dollar of tax-free benefit
   * replaces more spendable income than a dollar of taxable benefit.
   */
  taxBlindSpot: number;
  /** Gross benefit ÷ gross income — the ratio an illustration advertises. */
  apparentReplacementRatio: number;
  /** Net benefit ÷ after-tax income — the replacement the client actually lives on. */
  actualReplacementRatio: number;
}

export interface CoordinatedAllocation {
  source: "group" | "individual" | "iul_rider";
  grossMonthlyBenefit: number;
  netMonthlyBenefit: number;
  taxTreatment: string;
  annualCost: number;
  /** Net benefit delivered per dollar of annual premium. */
  efficiency: number;
}

export interface DIGAResult {
  probability: DisabilityProbability;
  taxAware: TaxAwareGap;
  gaps: CoverageGap[];
  allocations: CoordinatedAllocation[];
  /** Additional individual monthly benefit the MPC recommends buying. */
  recommendedAdditionalBenefit: number;
  estimatedAdditionalPremium: number;
  /** Expected cost of the unclosed gap: exposure × probability. */
  probabilityWeightedExposure: number;
  criticalFindings: string[];
  irsReferences: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function findOccupation(key: string): OccupationCategory {
  const found = OCCUPATION_CATEGORIES.find(o => o.key === key);
  if (!found) {
    throw new Error(
      `Unknown occupation "${key}". Expected one of: ${OCCUPATION_CATEGORIES.map(o => o.key).join(", ")}`,
    );
  }
  return found;
}

/**
 * OSDPM — Occupation-Specific Disability Probability Model.
 *
 * Incidence rises sharply with age; the age curve below is fitted to SSA
 * disability-insured incidence, which roughly doubles every twelve years after 35.
 * Expected duration also lengthens with age, since older claimants recover slowly
 * and are more likely to remain disabled through to retirement.
 */
export function modelDisabilityProbability(input: DIGAInput): DisabilityProbability {
  const occ = findOccupation(input.occupationKey);
  const health = HEALTH_MULTIPLIER[input.healthStatus];

  const ageFactor = Math.pow(2, (input.age - 35) / 12);
  const manualFactor = 1 + occ.manualIntensity * 0.5;
  const annualProbability = occ.baseIncidence * ageFactor * health * manualFactor;

  // Cumulative probability of at least one qualifying disability before retirement,
  // integrating the rising annual hazard year by year rather than assuming it flat.
  const years = Math.max(0, input.retirementAge - input.age);
  let survivalProbability = 1;
  for (let y = 0; y < years; y += 1) {
    const yearHazard = Math.min(
      0.95,
      occ.baseIncidence * Math.pow(2, (input.age + y - 35) / 12) * health * manualFactor,
    );
    survivalProbability *= 1 - yearHazard;
  }

  // Expected duration given onset, in months. Longer at older ages.
  const expectedDurationMonths = Math.min(
    Math.max(0, input.retirementAge - input.age) * 12,
    34 + Math.max(0, input.age - 35) * 1.9,
  );

  return {
    occupationLabel: occ.label,
    occupationClass: occ.occupationClass,
    annualProbability: Math.round(annualProbability * 1e6) / 1e6,
    cumulativeToRetirement: Math.round((1 - survivalProbability) * 1e4) / 1e4,
    expectedDurationMonths: round(expectedDurationMonths),
    ownOccupationOnlyShare: occ.specialtyRisk,
  };
}

/**
 * Tax-aware benefit conversion.
 *
 * IRC § 105(a): benefits from employer-paid coverage are includible in gross income.
 * IRC § 104(a)(3): benefits from coverage paid with the employee's after-tax dollars
 * are excluded. IUL living benefit riders accelerate a death benefit and are received
 * tax-free under IRC § 101(g) when the chronic or terminal illness tests are met.
 */
function netOf(gross: number, taxable: boolean, marginalRate: number): number {
  return taxable ? gross * (1 - marginalRate) : gross;
}

/**
 * MPC — Multi-Policy Coordinator.
 *
 * Ranks each coverage source by net benefit delivered per premium dollar, which is
 * what makes the tax distinction actionable: a tax-free individual policy can deliver
 * more spendable income than a larger taxable group benefit.
 */
function coordinatePolicies(input: DIGAInput): CoordinatedAllocation[] {
  const allocations: CoordinatedAllocation[] = [];
  const rate = input.marginalTaxRate;
  const monthlyIncome = input.annualIncome / 12;

  if (input.groupPolicy) {
    const g = input.groupPolicy;
    const gross = Math.min(monthlyIncome * g.replacementPercent, g.monthlyCap);
    const net = netOf(gross, g.employerPaid, rate);
    allocations.push({
      source: "group",
      grossMonthlyBenefit: round(gross),
      netMonthlyBenefit: round(net),
      taxTreatment: g.employerPaid
        ? "Taxable — employer-paid premium, IRC § 105(a)"
        : "Tax-free — employee-paid with after-tax dollars, IRC § 104(a)(3)",
      annualCost: 0,
      efficiency: Infinity, // Employer-funded: no premium cost to the client.
    });
  }

  if (input.individualPolicy) {
    const ind = input.individualPolicy;
    const net = netOf(ind.monthlyBenefit, !ind.afterTaxPremium, rate);
    allocations.push({
      source: "individual",
      grossMonthlyBenefit: round(ind.monthlyBenefit),
      netMonthlyBenefit: round(net),
      taxTreatment: ind.afterTaxPremium
        ? "Tax-free — after-tax premium, IRC § 104(a)(3)"
        : "Taxable — pre-tax premium, IRC § 105(a)",
      annualCost: round(ind.annualPremium),
      efficiency: ind.annualPremium > 0 ? round((net * 12) / ind.annualPremium) : Infinity,
    });
  }

  if (input.iulRider) {
    const r = input.iulRider;
    allocations.push({
      source: "iul_rider",
      grossMonthlyBenefit: round(r.monthlyBenefit),
      netMonthlyBenefit: round(r.monthlyBenefit),
      taxTreatment: "Tax-free — accelerated death benefit, IRC § 101(g)",
      annualCost: 0,
      efficiency: Infinity, // Premium is attributed to the base policy, not the rider.
    });
  }

  return allocations;
}

/**
 * Identify the three gap types the application claims: income replacement, benefit
 * period, and definition of disability.
 */
function identifyGaps(
  input: DIGAInput,
  probability: DisabilityProbability,
  taxAware: TaxAwareGap,
): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  const monthsToRetirement = Math.max(0, input.retirementAge - input.age) * 12;

  // 1. Income replacement gap — after tax, not before.
  const replacementSeverity =
    taxAware.afterTaxGap <= 0
      ? "none"
      : taxAware.afterTaxGap > taxAware.monthlyAfterTaxIncome * 0.3
        ? "critical"
        : taxAware.afterTaxGap > taxAware.monthlyAfterTaxIncome * 0.12
          ? "significant"
          : "minor";
  gaps.push({
    type: "income_replacement",
    label: "Income replacement gap",
    monthlyGap: round(Math.max(0, taxAware.afterTaxGap)),
    totalExposure: round(Math.max(0, taxAware.afterTaxGap) * probability.expectedDurationMonths),
    severity: replacementSeverity,
    detail:
      taxAware.afterTaxGap > 0
        ? `After-tax benefits fall $${Math.round(taxAware.afterTaxGap).toLocaleString()}/mo short of after-tax income. ` +
          `A pre-tax read would have reported only $${Math.round(Math.max(0, taxAware.preTaxGap)).toLocaleString()}/mo.`
        : "Coverage meets or exceeds after-tax income replacement needs.",
  });

  // 2. Benefit period gap — coverage that stops before retirement.
  const longestBenefitMonths = Math.max(
    input.groupPolicy?.benefitPeriodMonths ?? 0,
    input.individualPolicy?.benefitPeriodMonths ?? 0,
    input.iulRider?.benefitPeriodMonths ?? 0,
  );
  const uncoveredMonths = Math.max(0, Math.min(probability.expectedDurationMonths, monthsToRetirement) - longestBenefitMonths);
  const netBenefit = taxAware.netMonthlyBenefit;
  gaps.push({
    type: "benefit_period",
    label: "Benefit period gap",
    monthlyGap: uncoveredMonths > 0 ? round(netBenefit) : 0,
    totalExposure: round(uncoveredMonths * netBenefit),
    severity: uncoveredMonths >= 24 ? "critical" : uncoveredMonths >= 6 ? "significant" : uncoveredMonths > 0 ? "minor" : "none",
    detail:
      uncoveredMonths > 0
        ? `Longest benefit period is ${longestBenefitMonths} months, but expected disability duration is ` +
          `${Math.round(probability.expectedDurationMonths)} months — ${Math.round(uncoveredMonths)} months uncovered.`
        : "Benefit periods cover the expected duration of disability.",
  });

  // 3. Definition-of-disability gap — the silent one. An "any occupation" definition
  // pays nothing to a surgeon who can no longer operate but could work a desk job.
  const weakestDefinition: DisabilityDefinition | null = input.groupPolicy?.definition ?? null;
  const hasOwnOcc =
    input.individualPolicy?.definition === "own_occupation" || input.groupPolicy?.definition === "own_occupation";
  const exposedShare = hasOwnOcc ? 0 : probability.ownOccupationOnlyShare;
  gaps.push({
    type: "definition_of_disability",
    label: "Definition-of-disability gap",
    monthlyGap: round(taxAware.netMonthlyBenefit * exposedShare),
    totalExposure: round(taxAware.netMonthlyBenefit * exposedShare * probability.expectedDurationMonths),
    severity: exposedShare >= 0.7 ? "critical" : exposedShare >= 0.4 ? "significant" : exposedShare > 0 ? "minor" : "none",
    detail:
      exposedShare > 0
        ? `Coverage uses an "${weakestDefinition ?? "any_occupation"}" definition. ` +
          `${Math.round(exposedShare * 100)}% of disabilities for a ${probability.occupationLabel} would prevent own-occupation ` +
          `work while still permitting some other work — those claims would pay nothing.`
        : "Own-occupation definition in force; specialty-specific disability is covered.",
  });

  return gaps;
}

/**
 * Run the full DIGA analysis.
 */
export function analyzeDisabilityGapAdvanced(input: DIGAInput): DIGAResult {
  const criticalFindings: string[] = [];

  if (input.annualIncome < 300_000) {
    criticalFindings.push(
      `This engine is calibrated for incomes of $300,000+; at ` +
        `$${Math.round(input.annualIncome).toLocaleString()} the group benefit cap may not be the binding constraint.`,
    );
  }

  const probability = modelDisabilityProbability(input);
  const allocations = coordinatePolicies(input);

  const monthlyIncome = input.annualIncome / 12;
  const monthlyAfterTaxIncome = monthlyIncome * (1 - input.marginalTaxRate);
  const grossMonthlyBenefit = allocations.reduce((s, a) => s + a.grossMonthlyBenefit, 0);
  const netMonthlyBenefit = allocations.reduce((s, a) => s + a.netMonthlyBenefit, 0);

  const taxAware: TaxAwareGap = {
    monthlyAfterTaxIncome: round(monthlyAfterTaxIncome),
    grossMonthlyBenefit: round(grossMonthlyBenefit),
    netMonthlyBenefit: round(netMonthlyBenefit),
    // The naive comparison an advisor makes: gross benefit against gross income.
    preTaxGap: round(monthlyIncome - grossMonthlyBenefit),
    afterTaxGap: round(monthlyAfterTaxIncome - netMonthlyBenefit),
    taxBlindSpot: round(grossMonthlyBenefit - netMonthlyBenefit),
    apparentReplacementRatio: monthlyIncome > 0 ? round(grossMonthlyBenefit / monthlyIncome) : 0,
    actualReplacementRatio: monthlyAfterTaxIncome > 0 ? round(netMonthlyBenefit / monthlyAfterTaxIncome) : 0,
  };

  const gaps = identifyGaps(input, probability, taxAware);

  // MPC recommendation: buy tax-free individual coverage to close the after-tax gap.
  // Because the benefit is tax-free, the face needed equals the after-tax shortfall.
  const rawAdditional = Math.max(0, taxAware.afterTaxGap);
  // Carriers cap total replacement at roughly 65-70% of gross income across all sources.
  const issueLimit = Math.max(0, monthlyIncome * 0.7 - grossMonthlyBenefit);
  const recommendedAdditionalBenefit = Math.round(Math.min(rawAdditional, issueLimit) / 100) * 100;

  // Individual DI premium runs roughly 1.5-3% of annual benefit, rising with
  // occupation class risk and age.
  const occ = findOccupation(input.occupationKey);
  const premiumRate = 0.018 + (6 - occ.occupationClass) * 0.0035 + Math.max(0, input.age - 35) * 0.0009;
  const estimatedAdditionalPremium = round(recommendedAdditionalBenefit * 12 * premiumRate);

  const totalExposure = gaps.reduce((s, g) => s + g.totalExposure, 0);
  const probabilityWeightedExposure = round(totalExposure * probability.cumulativeToRetirement);

  if (taxAware.taxBlindSpot > 0) {
    criticalFindings.push(
      `$${Math.round(taxAware.taxBlindSpot).toLocaleString()}/mo of stated benefit is lost to income tax before it ` +
        `reaches the client. Employer-paid group benefits are taxable under IRC § 105(a); individual coverage paid ` +
        `with after-tax dollars is not, under IRC § 104(a)(3). Shifting coverage to the tax-free source closes the ` +
        `same gap with less face amount.`,
    );
  }
  if (input.groupPolicy && monthlyIncome * input.groupPolicy.replacementPercent > input.groupPolicy.monthlyCap) {
    const capped = monthlyIncome * input.groupPolicy.replacementPercent - input.groupPolicy.monthlyCap;
    criticalFindings.push(
      `The group cap of $${input.groupPolicy.monthlyCap.toLocaleString()}/mo truncates ` +
        `$${Math.round(capped).toLocaleString()}/mo of the stated ${Math.round(input.groupPolicy.replacementPercent * 100)}% ` +
        `replacement. Effective replacement is only ${Math.round((input.groupPolicy.monthlyCap / monthlyIncome) * 100)}% of income.`,
    );
  }
  const defGap = gaps.find(g => g.type === "definition_of_disability");
  if (defGap && (defGap.severity === "critical" || defGap.severity === "significant")) {
    criticalFindings.push(defGap.detail);
  }
  if (recommendedAdditionalBenefit < rawAdditional) {
    criticalFindings.push(
      `Carrier issue limits cap additional coverage at $${recommendedAdditionalBenefit.toLocaleString()}/mo, ` +
        `short of the $${Math.round(rawAdditional).toLocaleString()}/mo needed. Close the remainder with an IUL living ` +
        `benefit rider, which does not count against DI issue limits.`,
    );
  }

  return {
    probability,
    taxAware,
    gaps,
    allocations,
    recommendedAdditionalBenefit,
    estimatedAdditionalPremium,
    probabilityWeightedExposure,
    criticalFindings,
    irsReferences: [
      "IRC § 104(a)(3) — Disability benefits excluded from income when premiums are paid with after-tax dollars",
      "IRC § 105(a) — Employer-paid disability benefits are includible in gross income",
      "IRC § 106 — Employer contributions to accident and health plans",
      "IRC § 101(g) — Accelerated death benefits received tax-free (living benefit riders)",
      "IRC § 7702B — Qualified long-term care insurance contract treatment",
    ],
  };
}
