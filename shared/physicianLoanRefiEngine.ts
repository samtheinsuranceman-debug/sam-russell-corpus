/**
 * SISTER INVENTION SI-028: Physician Loan Refinancing Optimizer with IUL Cash Value
 * Collateral Integration, Student Loan Forgiveness Arbitrage, and Dual-Benefit Debt
 * Restructuring (PLRO)
 * Patent Reference: Integrates PAT-002 (HELOC-IUL Arbitrage), PAT-005 (Tax Waterfall),
 * PAT-004 (Wealth Genome)
 *
 * Models the three-way interaction between physician student loan refinancing, IUL
 * cash value used as supplemental collateral, and Public Service Loan Forgiveness.
 * Two interlocking components:
 *
 *   SLFAM — Student Loan Forgiveness Arbitrage Module: net present value of pursuing
 *           PSLF against refinancing, carrying an explicit probability that the
 *           program survives to the borrower's forgiveness date, and optimizing the
 *           income-driven repayment plan underneath it.
 *   ICIE  — IUL Collateral Integration Engine: models IUL cash value pledged as
 *           supplemental collateral to secure a lower refinancing rate, and the
 *           self-reinforcing cycle that follows.
 *
 * Narrowed use case (per application): physicians with student loan balances above
 * $100,000 where refinancing, PSLF eligibility and IUL collateral intersect.
 *
 * Note on scope: refinancing federal loans permanently forfeits PSLF eligibility,
 * loan discharge under § 108(f)(1), and federal income-driven repayment. That
 * irreversibility is why this engine exists — the decision cannot be walked back.
 */

// ─── Program constants ────────────────────────────────────────────────────────
/** PSLF requires 120 qualifying monthly payments — 34 CFR § 685.219. */
export const PSLF_QUALIFYING_PAYMENTS = 120;
/** PSLF forgiveness is excluded from gross income under IRC § 108(f)(1). */
export const PSLF_FORGIVENESS_TAXABLE = false;
/** Federal poverty guideline for a single filer, used by IDR formulas. */
export const FEDERAL_POVERTY_GUIDELINE_SINGLE = 15_650;

export type IDRPlan = "save" | "paye" | "ibr" | "icr" | "standard";

/**
 * Income-driven repayment plan parameters.
 *
 * `discretionaryMultiplier` is the multiple of the federal poverty guideline that is
 * protected before the payment rate applies; `paymentRate` is the share of the
 * remainder owed annually. Standard repayment is included as the non-IDR baseline.
 */
export const IDR_PLANS: Record<IDRPlan, {
  label: string;
  discretionaryMultiplier: number;
  paymentRate: number;
  qualifiesForPSLF: boolean;
  termMonths: number;
}> = {
  save:     { label: "SAVE",               discretionaryMultiplier: 2.25, paymentRate: 0.10, qualifiesForPSLF: true,  termMonths: 300 },
  paye:     { label: "PAYE",               discretionaryMultiplier: 1.50, paymentRate: 0.10, qualifiesForPSLF: true,  termMonths: 240 },
  ibr:      { label: "IBR",                discretionaryMultiplier: 1.50, paymentRate: 0.15, qualifiesForPSLF: true,  termMonths: 300 },
  icr:      { label: "ICR",                discretionaryMultiplier: 1.00, paymentRate: 0.20, qualifiesForPSLF: true,  termMonths: 300 },
  standard: { label: "Standard 10-year",   discretionaryMultiplier: 0,    paymentRate: 0,    qualifiesForPSLF: true,  termMonths: 120 },
};

export interface PLROInput {
  /** Outstanding federal student loan balance. */
  loanBalance: number;
  /** Weighted average rate on the existing federal loans, as a decimal. */
  currentRate: number;
  /** Current annual income. */
  annualIncome: number;
  /** Expected annual income growth, as a decimal. */
  incomeGrowthRate: number;
  /** Combined marginal tax rate, as a decimal. */
  marginalTaxRate: number;
  /** Household size, used by the IDR discretionary-income formula. */
  householdSize: number;
  /** Qualifying PSLF payments already made. */
  paymentsAlreadyMade: number;
  /** Whether the borrower is currently in qualifying public-service employment. */
  inQualifyingEmployment: boolean;
  /**
   * Probability the borrower remains in qualifying employment through forgiveness.
   * Separate from legislative risk below — this is a personal-career estimate.
   */
  employmentContinuityProbability: number;
  /** Probability PSLF survives legislatively to the forgiveness date. */
  programContinuationProbability: number;
  /** Probability the borrower keeps annual employment certification current. */
  certificationComplianceProbability: number;
  /** Best available private refinancing rate without collateral, as a decimal. */
  refinanceRate: number;
  /** Refinancing term in years. */
  refinanceTermYears: number;
  /** IUL cash value available to pledge as supplemental collateral. */
  iulCashValue: number;
  /** IUL illustrated crediting rate, as a decimal. */
  iulCreditingRate: number;
  /** Discount rate for net present value, as a decimal. */
  discountRate: number;
}

export interface IDRProjection {
  plan: IDRPlan;
  label: string;
  /** First-year monthly payment under this plan. */
  firstYearMonthlyPayment: number;
  /** Total paid across the remaining qualifying period. */
  totalPaidToForgiveness: number;
  /** Balance forgiven at month 120, after interest accrual. */
  balanceForgiven: number;
  /** Present value of payments made. */
  presentValueOfPayments: number;
  qualifiesForPSLF: boolean;
}

export interface PSLFAnalysis {
  monthsRemaining: number;
  /** Best IDR plan by present-value cost. */
  recommendedPlan: IDRPlan;
  projections: IDRProjection[];
  /** Combined probability PSLF actually pays off for this borrower. */
  jointProbability: number;
  /** NPV of the PSLF path, unadjusted for risk. */
  rawNPV: number;
  /** NPV weighted by the joint probability, with the refinance fallback on failure. */
  riskAdjustedNPV: number;
  /** Tax owed on forgiveness — zero federally under IRC § 108(f)(1). */
  forgivenessTax: number;
}

export interface CollateralAnalysis {
  /** Cash value pledged relative to the loan balance. */
  cashValueToLoanRatio: number;
  /** Rate reduction earned by pledging, in decimal (0.005 = 50bps). */
  rateReduction: number;
  /** Refinancing rate after the collateral reduction. */
  collateralizedRate: number;
  /** Interest saved over the refinancing term from the reduction alone. */
  interestSaved: number;
  /** Monthly payment before and after the collateral reduction. */
  monthlyPaymentBase: number;
  monthlyPaymentCollateralized: number;
  /** Monthly payment freed up, redirectable into IUL premium. */
  monthlyFreedCashFlow: number;
  /**
   * Emergent Capability 2 — the freed cash flow funds additional IUL premium, which
   * raises cash value, which raises the pledgeable ratio. This is the additional
   * cash value the cycle produces over the refinancing term.
   */
  reinforcingCycleCashValue: number;
}

export interface RefinanceAnalysis {
  rate: number;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  presentValueOfPayments: number;
  /** Forfeited by refinancing federal loans into a private loan. */
  forfeited: string[];
}

export type PLRORecommendation = "pursue_pslf" | "refinance_with_collateral" | "refinance" | "too_close_to_call";

export interface PLROResult {
  pslf: PSLFAnalysis;
  refinance: RefinanceAnalysis;
  collateral: CollateralAnalysis;
  /**
   * Emergent Capability 1 — PSLF pursued alongside IUL funding. Forgiveness clears
   * the debt while the IUL builds tax-free wealth from the payment differential.
   */
  dualBenefit: {
    /** Monthly differential between the refinance payment and the IDR payment. */
    monthlyDifferential: number;
    /** IUL cash value built from redirecting that differential to forgiveness. */
    iulValueAtForgiveness: number;
    /** Total position: debt forgiven plus IUL value accumulated. */
    combinedBenefit: number;
    /** Advantage over the better single strategy alone. */
    advantageOverBestSingle: number;
  };
  recommendation: PLRORecommendation;
  /** Present-value advantage of the recommended path over the alternative. */
  decisionMargin: number;
  criticalFindings: string[];
  irsReferences: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Standard amortizing payment. */
export function amortizedPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 12;
  const n = years * 12;
  if (n <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Annual IDR payment. Discretionary income is income less a multiple of the federal
 * poverty guideline for the household; the plan's rate applies to that remainder.
 */
export function idrAnnualPayment(plan: IDRPlan, income: number, householdSize: number, loanBalance: number, rate: number): number {
  const params = IDR_PLANS[plan];
  if (plan === "standard") return amortizedPayment(loanBalance, rate, 10) * 12;
  const poverty = FEDERAL_POVERTY_GUIDELINE_SINGLE * (1 + (householdSize - 1) * 0.35);
  const discretionary = Math.max(0, income - poverty * params.discretionaryMultiplier);
  return discretionary * params.paymentRate;
}

/**
 * SLFAM — Student Loan Forgiveness Arbitrage Module.
 *
 * Projects each IDR plan month by month to the 120-payment mark, accruing interest on
 * the unpaid balance. Under IDR, a physician's payment routinely falls below the
 * interest accrual in early years, so the balance grows — which is precisely what
 * makes forgiveness valuable and refinancing expensive.
 */
export function analyzePSLF(input: PLROInput): PSLFAnalysis {
  const monthsRemaining = Math.max(0, PSLF_QUALIFYING_PAYMENTS - input.paymentsAlreadyMade);

  const projections: IDRProjection[] = (Object.keys(IDR_PLANS) as IDRPlan[]).map(plan => {
    let balance = input.loanBalance;
    let income = input.annualIncome;
    let totalPaid = 0;
    let pv = 0;
    let firstYearMonthlyPayment = 0;

    for (let m = 1; m <= monthsRemaining; m += 1) {
      const yearIndex = Math.floor((m - 1) / 12);
      if (m % 12 === 1 && m > 1) income *= 1 + input.incomeGrowthRate;

      const annualPayment = idrAnnualPayment(plan, income, input.householdSize, input.loanBalance, input.currentRate);
      const monthlyPayment = annualPayment / 12;
      if (m === 1) firstYearMonthlyPayment = monthlyPayment;

      const monthlyInterest = balance * (input.currentRate / 12);
      // Payment applies to interest first; any excess reduces principal. When the
      // payment is short of interest, the shortfall capitalizes onto the balance.
      balance = Math.max(0, balance + monthlyInterest - monthlyPayment);

      totalPaid += monthlyPayment;
      pv += monthlyPayment / Math.pow(1 + input.discountRate / 12, m);

      if (balance === 0) break;
    }

    return {
      plan,
      label: IDR_PLANS[plan].label,
      firstYearMonthlyPayment: round(firstYearMonthlyPayment),
      totalPaidToForgiveness: round(totalPaid),
      balanceForgiven: round(balance),
      presentValueOfPayments: round(pv),
      qualifiesForPSLF: IDR_PLANS[plan].qualifiesForPSLF,
    };
  });

  // The best plan is the one with the lowest present-value cost to the borrower.
  const eligible = projections.filter(p => p.qualifiesForPSLF);
  const best = eligible.reduce((a, b) => (a.presentValueOfPayments <= b.presentValueOfPayments ? a : b));

  // Three independent risks compound: the program surviving, the borrower staying in
  // qualifying employment, and certification being kept current.
  const jointProbability = input.inQualifyingEmployment
    ? input.programContinuationProbability *
      input.employmentContinuityProbability *
      input.certificationComplianceProbability
    : 0;

  // IRC § 108(f)(1) excludes PSLF forgiveness from gross income.
  const forgivenessTax = PSLF_FORGIVENESS_TAXABLE ? best.balanceForgiven * input.marginalTaxRate : 0;

  // Value of the PSLF path is the debt erased less what was paid to get there.
  const rawNPV = best.balanceForgiven - best.presentValueOfPayments - forgivenessTax;

  // If PSLF fails, the borrower lands on the refinance path having already made IDR
  // payments — so failure is not neutral, it is the refinance cost plus sunk payments.
  const refinancePV = amortizedPayment(input.loanBalance, input.refinanceRate, input.refinanceTermYears) * 12 * input.refinanceTermYears;
  const failureNPV = -(refinancePV + best.presentValueOfPayments);
  const riskAdjustedNPV = jointProbability * rawNPV + (1 - jointProbability) * failureNPV;

  return {
    monthsRemaining,
    recommendedPlan: best.plan,
    projections,
    jointProbability: Math.round(jointProbability * 1e4) / 1e4,
    rawNPV: round(rawNPV),
    riskAdjustedNPV: round(riskAdjustedNPV),
    forgivenessTax: round(forgivenessTax),
  };
}

/**
 * ICIE — IUL Collateral Integration Engine.
 *
 * Pledged cash value reduces the lender's loss-given-default, which the application
 * prices at 25-75 basis points depending on the cash-value-to-loan ratio. The freed
 * monthly payment is then redirected into IUL premium, raising cash value and the
 * pledgeable ratio — the self-reinforcing cycle.
 */
export function analyzeCollateral(input: PLROInput): CollateralAnalysis {
  const ratio = input.loanBalance > 0 ? input.iulCashValue / input.loanBalance : 0;

  // Per dependent claim 5: 0.25%-0.75% reduction scaled by the collateral ratio,
  // reaching the full 75bps once pledged value covers half the loan.
  const rateReduction = ratio <= 0 ? 0 : Math.min(0.0075, 0.0025 + (Math.min(ratio, 0.5) / 0.5) * 0.005);
  const collateralizedRate = Math.max(0, input.refinanceRate - rateReduction);

  const monthlyPaymentBase = amortizedPayment(input.loanBalance, input.refinanceRate, input.refinanceTermYears);
  const monthlyPaymentCollateralized = amortizedPayment(input.loanBalance, collateralizedRate, input.refinanceTermYears);
  const months = input.refinanceTermYears * 12;
  const interestSaved = (monthlyPaymentBase - monthlyPaymentCollateralized) * months;
  const monthlyFreedCashFlow = monthlyPaymentBase - monthlyPaymentCollateralized;

  // The freed payment compounds inside the policy at the crediting rate.
  const r = input.iulCreditingRate / 12;
  const reinforcingCycleCashValue =
    r === 0 ? monthlyFreedCashFlow * months : monthlyFreedCashFlow * ((Math.pow(1 + r, months) - 1) / r);

  return {
    cashValueToLoanRatio: Math.round(ratio * 1e4) / 1e4,
    rateReduction: Math.round(rateReduction * 1e6) / 1e6,
    collateralizedRate: Math.round(collateralizedRate * 1e6) / 1e6,
    interestSaved: round(interestSaved),
    monthlyPaymentBase: round(monthlyPaymentBase),
    monthlyPaymentCollateralized: round(monthlyPaymentCollateralized),
    monthlyFreedCashFlow: round(monthlyFreedCashFlow),
    reinforcingCycleCashValue: round(reinforcingCycleCashValue),
  };
}

/**
 * Run the full physician loan refinancing optimization.
 */
export function optimizePhysicianLoanRefi(input: PLROInput): PLROResult {
  const criticalFindings: string[] = [];

  if (input.loanBalance < 100_000) {
    criticalFindings.push(
      `This engine is calibrated for balances above $100,000; at ` +
        `$${Math.round(input.loanBalance).toLocaleString()} the refinancing and collateral mechanics carry less weight.`,
    );
  }

  const pslf = analyzePSLF(input);
  const collateral = analyzeCollateral(input);

  const monthlyPayment = collateral.monthlyPaymentCollateralized;
  const months = input.refinanceTermYears * 12;
  const totalPaid = monthlyPayment * months;
  let refinancePV = 0;
  for (let m = 1; m <= months; m += 1) {
    refinancePV += monthlyPayment / Math.pow(1 + input.discountRate / 12, m);
  }

  const refinance: RefinanceAnalysis = {
    rate: collateral.collateralizedRate,
    monthlyPayment: round(monthlyPayment),
    totalPaid: round(totalPaid),
    totalInterest: round(totalPaid - input.loanBalance),
    presentValueOfPayments: round(refinancePV),
    forfeited: [
      "PSLF eligibility — permanently forfeited once federal loans are refinanced privately",
      "Income-driven repayment plans and their forgiveness at 20-25 years",
      "Federal deferment and forbearance protections",
      "Death and total permanent disability discharge under 34 CFR § 685.212",
    ],
  };

  // Emergent Capability 1 — the dual-benefit structure. A physician on IDR pays less
  // monthly than they would refinancing; that differential funds IUL premium while
  // forgiveness clears the debt.
  const bestIDR = pslf.projections.find(p => p.plan === pslf.recommendedPlan)!;
  const monthlyDifferential = Math.max(0, refinance.monthlyPayment - bestIDR.firstYearMonthlyPayment);
  const r = input.iulCreditingRate / 12;
  const iulValueAtForgiveness =
    r === 0
      ? monthlyDifferential * pslf.monthsRemaining
      : monthlyDifferential * ((Math.pow(1 + r, pslf.monthsRemaining) - 1) / r);
  const combinedBenefit = bestIDR.balanceForgiven + iulValueAtForgiveness;

  // The better single strategy: pure PSLF (debt erased, nothing invested), or pure
  // refinance paired with the collateral cycle.
  const bestSingle = Math.max(bestIDR.balanceForgiven, collateral.interestSaved + collateral.reinforcingCycleCashValue);

  // Decision: compare the risk-adjusted PSLF position against the refinance cost.
  const pslfPosition = pslf.riskAdjustedNPV;
  const refinancePosition = -refinance.presentValueOfPayments + collateral.reinforcingCycleCashValue;
  const decisionMargin = pslfPosition - refinancePosition;

  const marginThreshold = input.loanBalance * 0.05;
  const recommendation: PLRORecommendation =
    !input.inQualifyingEmployment
      ? collateral.rateReduction > 0
        ? "refinance_with_collateral"
        : "refinance"
      : Math.abs(decisionMargin) < marginThreshold
        ? "too_close_to_call"
        : decisionMargin > 0
          ? "pursue_pslf"
          : collateral.rateReduction > 0
            ? "refinance_with_collateral"
            : "refinance";

  if (!input.inQualifyingEmployment) {
    criticalFindings.push(
      "Borrower is not in qualifying public-service employment, so PSLF is unavailable on the current path. " +
        "Only a move to a 501(c)(3) or government employer would open it.",
    );
  } else if (pslf.jointProbability < 0.6) {
    criticalFindings.push(
      `Joint PSLF probability is only ${Math.round(pslf.jointProbability * 100)}% once program continuation, ` +
        `employment continuity and certification compliance are compounded. The headline forgiveness figure of ` +
        `$${Math.round(bestIDR.balanceForgiven).toLocaleString()} is not what should drive the decision.`,
    );
  }

  if (bestIDR.balanceForgiven > input.loanBalance) {
    criticalFindings.push(
      `Under ${bestIDR.label}, the balance grows from $${Math.round(input.loanBalance).toLocaleString()} to ` +
        `$${Math.round(bestIDR.balanceForgiven).toLocaleString()} because the IDR payment is below monthly interest ` +
        `accrual. This negative amortization is what makes forgiveness valuable — and refinancing irreversible.`,
    );
  }

  if (collateral.rateReduction > 0) {
    criticalFindings.push(
      `Pledging $${Math.round(input.iulCashValue).toLocaleString()} of IUL cash value ` +
        `(${Math.round(collateral.cashValueToLoanRatio * 100)}% of the balance) earns a ` +
        `${(collateral.rateReduction * 100).toFixed(2)}% rate reduction, freeing ` +
        `$${Math.round(collateral.monthlyFreedCashFlow).toLocaleString()}/mo that compounds to ` +
        `$${Math.round(collateral.reinforcingCycleCashValue).toLocaleString()} of additional cash value over the term.`,
    );
  }

  if (recommendation === "too_close_to_call") {
    criticalFindings.push(
      `The two paths are within $${Math.round(marginThreshold).toLocaleString()} in present value. ` +
        `Because refinancing forfeits PSLF permanently and the reverse is not possible, the asymmetry favors ` +
        `staying federal until the margin is decisive.`,
    );
  }

  return {
    pslf,
    refinance,
    collateral,
    dualBenefit: {
      monthlyDifferential: round(monthlyDifferential),
      iulValueAtForgiveness: round(iulValueAtForgiveness),
      combinedBenefit: round(combinedBenefit),
      advantageOverBestSingle: round(combinedBenefit - bestSingle),
    },
    recommendation,
    decisionMargin: round(decisionMargin),
    criticalFindings,
    irsReferences: [
      "IRC § 108(f)(1) — Student loan forgiveness under PSLF excluded from gross income",
      "34 CFR § 685.219 — Public Service Loan Forgiveness program requirements",
      "34 CFR § 685.209 — Income-driven repayment plans",
      "34 CFR § 685.212 — Discharge upon death or total and permanent disability",
      "IRC § 221 — Student loan interest deduction (phased out at physician income levels)",
      "IRC § 7702 — Life insurance contract definition governing IUL cash value",
      "IRC § 72(e) — Tax treatment of amounts received from life insurance contracts",
    ],
  };
}
