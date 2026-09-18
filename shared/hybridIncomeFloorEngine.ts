/**
 * SISTER INVENTION SI-030: Indexed Annuity with IUL Hybrid Income Floor Strategy
 * Engine Using Guaranteed Income Layering, Upside Capture Optimization, and
 * Tax-Diversified Distribution Sequencing (IAIUL)
 * Patent Reference: Integrates PAT-005 (Tax Waterfall), PAT-013 (Monte Carlo),
 * SI-025 (Annuity Comparison)
 *
 * Combines an indexed annuity's guaranteed lifetime income rider with IUL tax-free
 * distributions to produce a layered retirement income strategy: a guaranteed floor
 * under essential expenses and tax-free upside for everything above it. Three
 * interlocking components:
 *
 *   GILM — Guaranteed Income Layering Module: allocates funding between annuity and
 *          IUL based on the client's essential vs. discretionary expense split, so
 *          the annuity is sized to the floor rather than to a rule of thumb.
 *   UCO  — Upside Capture Optimizer: models how IUL indexed crediting captures market
 *          upside above the annuity's guaranteed floor.
 *   TDDS — Tax-Diversified Distribution Sequencer: orders and times partially taxable
 *          annuity income against tax-free IUL distributions across three retirement
 *          phases to minimize lifetime tax.
 *
 * Narrowed use case (per application): pre-retirees aged 55-65 with $1M+ in
 * retirement assets seeking both guaranteed income and tax-free growth.
 */

// ─── Tax constants ────────────────────────────────────────────────────────────
/** Required minimum distributions begin at 75 for those born in 1960 or later — SECURE 2.0 § 107. */
export const RMD_AGE = 75;
/**
 * Uniform Lifetime Table divisors, abbreviated to the ages this engine projects.
 * Treas. Reg. § 1.401(a)(9)-9.
 */
export const UNIFORM_LIFETIME_DIVISORS: Record<number, number> = {
  75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5,
  83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2,
  91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
};

export type RetirementPhase = "early" | "mid" | "late";

export interface IAIULInput {
  currentAge: number;
  retirementAge: number;
  /** Age through which income is projected. */
  lifeExpectancyAge: number;
  /** Total retirement assets available to allocate between the two vehicles. */
  totalAssets: number;
  /** Annual expenses that must be covered regardless of markets. */
  essentialExpenses: number;
  /** Annual expenses that can flex with markets. */
  discretionaryExpenses: number;
  /** Additional legacy target to leave to heirs. */
  legacyTarget: number;
  /** Guaranteed lifetime withdrawal rate on the annuity's income rider, as a decimal. */
  annuityPayoutRate: number;
  /** Annual roll-up on the annuity's benefit base during deferral, as a decimal. */
  annuityRollupRate: number;
  /** Annual rider charge on the annuity, as a decimal. */
  annuityRiderFee: number;
  /** Portion of each annuity payment that is a return of basis (non-taxable). */
  annuityExclusionRatio: number;
  /** IUL illustrated crediting rate, as a decimal. */
  iulCreditingRate: number;
  /** IUL cap on indexed crediting, as a decimal. */
  iulCap: number;
  /** IUL floor — the contractual guarantee against market loss, as a decimal. */
  iulFloor: number;
  /** Annual policy charges as a share of cash value, as a decimal. */
  iulPolicyCharges: number;
  /** Existing qualified (pre-tax) balance subject to RMDs. */
  qualifiedBalance: number;
  /** Marginal tax rate in retirement, as a decimal. */
  marginalTaxRate: number;
  inflationRate: number;
}

export interface IncomeLayer {
  layer: "guaranteed_floor" | "tax_free_discretionary" | "legacy";
  source: "indexed_annuity" | "iul";
  /** Assets allocated to this layer. */
  allocation: number;
  /** Annual income this layer is designed to produce. */
  targetAnnualIncome: number;
  /** Share of the total allocation. */
  allocationPercent: number;
  rationale: string;
}

export interface LayeringResult {
  layers: IncomeLayer[];
  annuityAllocation: number;
  iulAllocation: number;
  /** Annual guaranteed income the annuity allocation produces at the payout rate. */
  guaranteedAnnualIncome: number;
  /** Whether the guaranteed floor fully covers essential expenses. */
  floorCoversEssentials: boolean;
  /** Shortfall in the floor, if any. */
  floorShortfall: number;
  /** Years of deferral before income begins, during which the base rolls up. */
  deferralYears: number;
  /** Annuity benefit base after deferral roll-up. */
  benefitBaseAtIncome: number;
}

export interface UpsideCapture {
  year: number;
  age: number;
  /** Hypothetical index return in this year. */
  indexReturn: number;
  /** Credited rate after cap and floor are applied. */
  creditedRate: number;
  /** Upside captured above the annuity's flat guaranteed floor. */
  upsideAboveFloor: number;
  iulCashValue: number;
}

export interface UpsideResult {
  years: UpsideCapture[];
  /** Cumulative upside captured above the guaranteed floor. */
  totalUpsideCaptured: number;
  /** Average credited rate after cap and floor. */
  averageCreditedRate: number;
  /** Years the floor protected against a negative index. */
  floorProtectedYears: number;
  /** Years the cap truncated the credited return. */
  capTruncatedYears: number;
  finalCashValue: number;
}

export interface DistributionYear {
  year: number;
  age: number;
  phase: RetirementPhase;
  /** Gross annuity income drawn. */
  annuityIncome: number;
  /** Taxable portion of the annuity income, after the exclusion ratio. */
  annuityTaxable: number;
  /** Tax-free IUL loan distribution. */
  iulDistribution: number;
  /** Required minimum distribution from qualified balances, fully taxable. */
  rmd: number;
  totalIncome: number;
  taxableIncome: number;
  taxOwed: number;
  afterTaxIncome: number;
  /** Expenses to be covered this year, inflated. */
  expensesNeeded: number;
  surplus: number;
}

export interface SequencingResult {
  years: DistributionYear[];
  phaseBoundaries: { earlyEnds: number; midEnds: number };
  totalLifetimeTax: number;
  totalAfterTaxIncome: number;
  /** Lifetime tax under an annuity-only strategy of equal gross income. */
  annuityOnlyLifetimeTax: number;
  /** Emergent Capability 2 — tax saved by phasing the mix. */
  taxSavings: number;
  taxSavingsPercent: number;
}

export interface IAIULResult {
  layering: LayeringResult;
  upside: UpsideResult;
  sequencing: SequencingResult;
  /**
   * Emergent Capability 1 — after-tax income from the hybrid against the better of
   * the two single-product strategies.
   */
  hybridAdvantage: {
    hybridAfterTaxIncome: number;
    annuityOnlyAfterTaxIncome: number;
    iulOnlyAfterTaxIncome: number;
    bestSingleProduct: number;
    advantage: number;
    advantagePercent: number;
  };
  criticalFindings: string[];
  irsReferences: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function phaseFor(age: number, retirementAge: number, lifeExpectancyAge: number): RetirementPhase {
  const span = Math.max(1, lifeExpectancyAge - retirementAge);
  const progress = (age - retirementAge) / span;
  if (progress < 1 / 3) return "early";
  if (progress < 2 / 3) return "mid";
  return "late";
}

function rmdFor(age: number, balance: number): number {
  if (age < RMD_AGE || balance <= 0) return 0;
  const divisor = UNIFORM_LIFETIME_DIVISORS[Math.min(95, age)] ?? 8.9;
  return balance / divisor;
}

/**
 * GILM — Guaranteed Income Layering Module.
 *
 * Per dependent claim 4: annuity funding covers 100% of essential expenses, IUL
 * funding covers discretionary expenses plus legacy. The annuity is therefore sized
 * backward from the floor requirement rather than set as a fixed share of assets.
 */
export function layerGuaranteedIncome(input: IAIULInput): LayeringResult {
  const deferralYears = Math.max(0, input.retirementAge - input.currentAge);

  // The benefit base rolls up during deferral, so a dollar allocated today supports
  // more guaranteed income than the payout rate alone suggests.
  const rollupMultiple = Math.pow(1 + input.annuityRollupRate, deferralYears);
  const incomePerDollarAllocated = rollupMultiple * input.annuityPayoutRate;

  // Essential expenses at the retirement date, inflated from today.
  const essentialsAtRetirement = input.essentialExpenses * Math.pow(1 + input.inflationRate, deferralYears);

  const requiredAnnuityAllocation =
    incomePerDollarAllocated > 0 ? essentialsAtRetirement / incomePerDollarAllocated : input.totalAssets;

  // The floor cannot consume everything — some assets must fund the tax-free layer.
  const annuityAllocation = Math.min(requiredAnnuityAllocation, input.totalAssets * 0.75);
  const iulAllocation = Math.max(0, input.totalAssets - annuityAllocation);

  const benefitBaseAtIncome = annuityAllocation * rollupMultiple;
  const guaranteedAnnualIncome = benefitBaseAtIncome * input.annuityPayoutRate;
  const floorShortfall = Math.max(0, essentialsAtRetirement - guaranteedAnnualIncome);

  const discretionaryAtRetirement = input.discretionaryExpenses * Math.pow(1 + input.inflationRate, deferralYears);

  // IUL allocation splits between funding discretionary income and the legacy target.
  const legacyShare = input.legacyTarget > 0 ? Math.min(0.4, input.legacyTarget / Math.max(1, input.totalAssets)) : 0;
  const iulIncomeAllocation = iulAllocation * (1 - legacyShare);
  const iulLegacyAllocation = iulAllocation * legacyShare;

  const layers: IncomeLayer[] = [
    {
      layer: "guaranteed_floor",
      source: "indexed_annuity",
      allocation: round(annuityAllocation),
      targetAnnualIncome: round(essentialsAtRetirement),
      allocationPercent: input.totalAssets > 0 ? round((annuityAllocation / input.totalAssets) * 100) : 0,
      rationale:
        `Sized to cover 100% of essential expenses ($${Math.round(essentialsAtRetirement).toLocaleString()}/yr at ` +
        `retirement) with guaranteed lifetime income that does not depend on market performance or sequence of returns.`,
    },
    {
      layer: "tax_free_discretionary",
      source: "iul",
      allocation: round(iulIncomeAllocation),
      targetAnnualIncome: round(discretionaryAtRetirement),
      allocationPercent: input.totalAssets > 0 ? round((iulIncomeAllocation / input.totalAssets) * 100) : 0,
      rationale:
        `Funds discretionary spending through tax-free policy loans under IRC § 72(e), which do not appear in ` +
        `provisional income and therefore do not push Social Security into taxation.`,
    },
    {
      layer: "legacy",
      source: "iul",
      allocation: round(iulLegacyAllocation),
      targetAnnualIncome: 0,
      allocationPercent: input.totalAssets > 0 ? round((iulLegacyAllocation / input.totalAssets) * 100) : 0,
      rationale:
        `Death benefit passes income-tax-free under IRC § 101(a), and the remaining cash value supports the ` +
        `$${Math.round(input.legacyTarget).toLocaleString()} legacy target.`,
    },
  ];

  return {
    layers,
    annuityAllocation: round(annuityAllocation),
    iulAllocation: round(iulAllocation),
    guaranteedAnnualIncome: round(guaranteedAnnualIncome),
    floorCoversEssentials: floorShortfall <= 0,
    floorShortfall: round(floorShortfall),
    deferralYears,
    benefitBaseAtIncome: round(benefitBaseAtIncome),
  };
}

/**
 * UCO — Upside Capture Optimizer.
 *
 * Applies the IUL's cap and floor to a deterministic index cycle. The floor is what
 * makes the pairing work: the annuity guarantees the essentials while the IUL never
 * credits below zero, so a bad market year reduces discretionary income but cannot
 * breach the floor.
 */
export function optimizeUpsideCapture(input: IAIULInput, layering: LayeringResult): UpsideResult {
  const years: UpsideCapture[] = [];
  let cashValue = layering.iulAllocation;
  let totalUpsideCaptured = 0;
  let floorProtectedYears = 0;
  let capTruncatedYears = 0;
  let creditedSum = 0;

  const totalYears = Math.max(0, input.lifeExpectancyAge - input.currentAge);

  for (let y = 1; y <= totalYears; y += 1) {
    const age = input.currentAge + y;

    // Deterministic index cycle around the illustrated rate — a repeatable stand-in
    // for the Monte Carlo path in PAT-013.
    const cyclePhase = (2 * Math.PI * y) / 7;
    const indexReturn = input.iulCreditingRate + 0.09 * Math.sin(cyclePhase) - 0.015 * Math.cos(cyclePhase * 2);

    // Cap and floor are the defining mechanics of indexed crediting.
    const creditedRate = Math.min(input.iulCap, Math.max(input.iulFloor, indexReturn));
    if (indexReturn < input.iulFloor) floorProtectedYears += 1;
    if (indexReturn > input.iulCap) capTruncatedYears += 1;
    creditedSum += creditedRate;

    const credited = cashValue * creditedRate;
    const charges = cashValue * input.iulPolicyCharges;
    cashValue = Math.max(0, cashValue + credited - charges);

    // Upside above the flat guaranteed floor: what indexed crediting earned beyond
    // what a guarantee alone would have produced.
    const upsideAboveFloor = Math.max(0, credited - cashValue * input.iulFloor);
    totalUpsideCaptured += upsideAboveFloor;

    years.push({
      year: y,
      age,
      indexReturn: Math.round(indexReturn * 1e4) / 1e4,
      creditedRate: Math.round(creditedRate * 1e4) / 1e4,
      upsideAboveFloor: round(upsideAboveFloor),
      iulCashValue: round(cashValue),
    });
  }

  return {
    years,
    totalUpsideCaptured: round(totalUpsideCaptured),
    averageCreditedRate: totalYears > 0 ? Math.round((creditedSum / totalYears) * 1e4) / 1e4 : 0,
    floorProtectedYears,
    capTruncatedYears,
    finalCashValue: round(cashValue),
  };
}

/**
 * TDDS — Tax-Diversified Distribution Sequencer.
 *
 * Per dependent claim 5, three phases: early retirement is annuity-heavy, mid is
 * balanced, and late is IUL-heavy so tax-free loans offset the RMDs that begin at 75.
 * That last phase is the point — RMDs are fully taxable and cannot be avoided, so
 * the tax-free layer is most valuable exactly when it arrives.
 */
export function sequenceDistributions(
  input: IAIULInput,
  layering: LayeringResult,
  upside: UpsideResult,
): SequencingResult {
  const years: DistributionYear[] = [];
  let qualifiedBalance = input.qualifiedBalance;
  let iulCashValue = layering.iulAllocation;
  let totalLifetimeTax = 0;
  let totalAfterTaxIncome = 0;

  const retirementYears = Math.max(0, input.lifeExpectancyAge - input.retirementAge);
  const span = Math.max(1, retirementYears);

  for (let y = 1; y <= retirementYears; y += 1) {
    const age = input.retirementAge + y - 1;
    const phase = phaseFor(age, input.retirementAge, input.lifeExpectancyAge);
    const yearsFromToday = layering.deferralYears + y;

    const expensesNeeded =
      (input.essentialExpenses + input.discretionaryExpenses) * Math.pow(1 + input.inflationRate, yearsFromToday);

    // Annuity income is level and guaranteed for life once turned on.
    const annuityIncome = layering.guaranteedAnnualIncome;
    const annuityTaxable = annuityIncome * (1 - input.annuityExclusionRatio);

    // RMDs are compulsory and fully taxable from age 75.
    const rmd = rmdFor(age, qualifiedBalance);
    qualifiedBalance = Math.max(0, (qualifiedBalance - rmd) * 1.05);

    // Phase weighting on the IUL draw: light early, heavier late to offset RMDs.
    const phaseWeight = phase === "early" ? 0.35 : phase === "mid" ? 0.7 : 1.15;
    const gap = Math.max(0, expensesNeeded - annuityIncome - rmd);
    const desiredIUL = gap * phaseWeight;

    // Draw is limited by available cash value; policy loans must not exhaust it.
    const maxDraw = iulCashValue * 0.06;
    const iulDistribution = Math.max(0, Math.min(desiredIUL, maxDraw));

    // Cash value grows at the credited rate net of charges, less the loan drawn.
    const creditedRate = upside.years[Math.min(upside.years.length - 1, layering.deferralYears + y - 1)]?.creditedRate
      ?? input.iulCreditingRate;
    iulCashValue = Math.max(0, iulCashValue * (1 + creditedRate - input.iulPolicyCharges) - iulDistribution);

    const totalIncome = annuityIncome + iulDistribution + rmd;
    // IUL loans are not income under IRC § 72(e); annuity income is taxable only to
    // the extent it exceeds the exclusion ratio; RMDs are fully taxable.
    const taxableIncome = annuityTaxable + rmd;
    const taxOwed = taxableIncome * input.marginalTaxRate;
    const afterTaxIncome = totalIncome - taxOwed;

    totalLifetimeTax += taxOwed;
    totalAfterTaxIncome += afterTaxIncome;

    years.push({
      year: y,
      age,
      phase,
      annuityIncome: round(annuityIncome),
      annuityTaxable: round(annuityTaxable),
      iulDistribution: round(iulDistribution),
      rmd: round(rmd),
      totalIncome: round(totalIncome),
      taxableIncome: round(taxableIncome),
      taxOwed: round(taxOwed),
      afterTaxIncome: round(afterTaxIncome),
      expensesNeeded: round(expensesNeeded),
      surplus: round(afterTaxIncome - expensesNeeded),
    });
  }

  // Annuity-only baseline: the same gross income drawn entirely from taxable sources.
  const annuityOnlyLifetimeTax = years.reduce(
    (s, yr) => s + yr.totalIncome * (1 - input.annuityExclusionRatio) * input.marginalTaxRate,
    0,
  );

  return {
    years,
    phaseBoundaries: {
      earlyEnds: Math.round(input.retirementAge + span / 3),
      midEnds: Math.round(input.retirementAge + (2 * span) / 3),
    },
    totalLifetimeTax: round(totalLifetimeTax),
    totalAfterTaxIncome: round(totalAfterTaxIncome),
    annuityOnlyLifetimeTax: round(annuityOnlyLifetimeTax),
    taxSavings: round(annuityOnlyLifetimeTax - totalLifetimeTax),
    taxSavingsPercent:
      annuityOnlyLifetimeTax > 0
        ? round(((annuityOnlyLifetimeTax - totalLifetimeTax) / annuityOnlyLifetimeTax) * 100)
        : 0,
  };
}

/**
 * Run the full hybrid annuity + IUL income floor strategy.
 */
export function buildHybridIncomeFloor(input: IAIULInput): IAIULResult {
  const criticalFindings: string[] = [];

  if (input.totalAssets <= 0) {
    throw new Error("Total retirement assets must be greater than zero.");
  }
  if (input.currentAge < 55 || input.currentAge > 65) {
    criticalFindings.push(
      `This engine is calibrated for pre-retirees aged 55-65; the client is ${input.currentAge}. ` +
        `Deferral roll-up and phase sequencing assume a shorter runway than a younger client has.`,
    );
  }
  if (input.totalAssets < 1_000_000) {
    criticalFindings.push(
      `Calibrated for $1M+ in retirement assets; at $${Math.round(input.totalAssets).toLocaleString()} splitting ` +
        `across two vehicles may leave neither layer adequately funded.`,
    );
  }

  const layering = layerGuaranteedIncome(input);
  const upside = optimizeUpsideCapture(input, layering);
  const sequencing = sequenceDistributions(input, layering, upside);

  // Emergent Capability 1 — compare the hybrid to each single-product strategy.
  const retirementYears = Math.max(1, input.lifeExpectancyAge - input.retirementAge);

  // Annuity-only: everything into the guaranteed income rider, all taxable above basis.
  const annuityOnlyBase = input.totalAssets * Math.pow(1 + input.annuityRollupRate, layering.deferralYears);
  const annuityOnlyGross = annuityOnlyBase * input.annuityPayoutRate;
  const annuityOnlyAfterTaxIncome =
    annuityOnlyGross * retirementYears * (1 - (1 - input.annuityExclusionRatio) * input.marginalTaxRate);

  // IUL-only: everything into the policy, tax-free draws but no guaranteed floor and
  // exposure to drawing down in a bad sequence.
  let iulOnlyValue = input.totalAssets;
  for (let y = 0; y < layering.deferralYears; y += 1) {
    iulOnlyValue *= 1 + input.iulCreditingRate - input.iulPolicyCharges;
  }
  const iulOnlyAfterTaxIncome = iulOnlyValue * 0.06 * retirementYears;

  const bestSingleProduct = Math.max(annuityOnlyAfterTaxIncome, iulOnlyAfterTaxIncome);
  const hybridAfterTaxIncome = sequencing.totalAfterTaxIncome;

  if (!layering.floorCoversEssentials) {
    criticalFindings.push(
      `Guaranteed floor falls $${Math.round(layering.floorShortfall).toLocaleString()}/yr short of essential ` +
        `expenses. The annuity allocation is capped at 75% of assets so the tax-free layer stays funded — ` +
        `close the gap with additional premium, a later income start date, or a reduced essential-expense budget.`,
    );
  } else {
    criticalFindings.push(
      `Guaranteed floor of $${Math.round(layering.guaranteedAnnualIncome).toLocaleString()}/yr fully covers ` +
        `essential expenses for life, independent of market performance or sequence of returns.`,
    );
  }

  if (upside.floorProtectedYears > 0) {
    criticalFindings.push(
      `The IUL's ${(input.iulFloor * 100).toFixed(0)}% floor prevented a negative credit in ` +
        `${upside.floorProtectedYears} of ${upside.years.length} modeled years, while the ` +
        `${(input.iulCap * 100).toFixed(0)}% cap truncated returns in ${upside.capTruncatedYears}. ` +
        `That asymmetry is the trade the pairing is built on.`,
    );
  }

  const lateYears = sequencing.years.filter(y => y.phase === "late");
  const rmdYears = sequencing.years.filter(y => y.rmd > 0);
  if (rmdYears.length > 0 && lateYears.length > 0) {
    const avgLateIUL = lateYears.reduce((s, y) => s + y.iulDistribution, 0) / lateYears.length;
    criticalFindings.push(
      `RMDs begin at age ${RMD_AGE} and are fully taxable. Shifting to an IUL-heavy draw in late retirement ` +
        `(averaging $${Math.round(avgLateIUL).toLocaleString()}/yr tax-free) offsets them without adding to ` +
        `taxable income — worth $${Math.round(sequencing.taxSavings).toLocaleString()} across retirement.`,
    );
  }

  return {
    layering,
    upside,
    sequencing,
    hybridAdvantage: {
      hybridAfterTaxIncome: round(hybridAfterTaxIncome),
      annuityOnlyAfterTaxIncome: round(annuityOnlyAfterTaxIncome),
      iulOnlyAfterTaxIncome: round(iulOnlyAfterTaxIncome),
      bestSingleProduct: round(bestSingleProduct),
      advantage: round(hybridAfterTaxIncome - bestSingleProduct),
      advantagePercent:
        bestSingleProduct > 0 ? round(((hybridAfterTaxIncome - bestSingleProduct) / bestSingleProduct) * 100) : 0,
    },
    criticalFindings,
    irsReferences: [
      "IRC § 72(e) — Policy loans are not taxable distributions while the contract remains in force",
      "IRC § 72(b) — Exclusion ratio for annuity payments",
      "IRC § 101(a) — Death benefit proceeds received income-tax-free",
      "IRC § 7702 / § 7702A — Life insurance contract definition and MEC limits",
      "IRC § 401(a)(9) — Required minimum distributions",
      "SECURE 2.0 Act § 107 — RMD beginning age raised to 75",
      "Treas. Reg. § 1.401(a)(9)-9 — Uniform Lifetime Table",
      "IRC § 86 — Taxation of Social Security benefits; tax-free loans stay out of provisional income",
    ],
  };
}
