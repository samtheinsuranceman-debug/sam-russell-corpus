/**
 * SISTER INVENTION SI-029: IUL Policy Loan Optimization Engine with Variable Rate
 * Hedging, Wash Loan Arbitrage Detection, and Multi-Policy Loan Coordination (IPLOE)
 * Patent Reference: Integrates PAT-002 (HELOC-IUL Arbitrage), PAT-005 (Tax Waterfall),
 * PAT-013 (Monte Carlo)
 *
 * Extends SI-024 (policyLoanOptimizer), which optimizes loans within a SINGLE policy.
 * IPLOE operates across a portfolio of policies and adds three components that do not
 * exist at the single-policy level:
 *
 *   VRHM — Variable Rate Hedging Module: models variable loan rates against indexed
 *          crediting rates across a rate cycle, identifying the windows where the
 *          spread is maximally favorable rather than assuming a static rate.
 *   WLAD — Wash Loan Arbitrage Detector: finds policies whose wash provisions make
 *          borrowing effectively costless, and prices the arbitrage.
 *   MPLC — Multi-Policy Loan Coordinator: distributes a required income draw across
 *          policies to minimize aggregate loan cost, including the cross-policy move
 *          of borrowing from a wash-loan policy to fund premium on a higher-crediting
 *          policy.
 *
 * Narrowed use case (per application): policyholders with 2+ policies and combined
 * cash value above $500,000.
 */
import { optimizePolicyLoans, type PolicyLoanResult } from "./policyLoanOptimizer";

export type LoanType = "fixed" | "variable" | "wash";

export interface PolicyPosition {
  id: string;
  label: string;
  carrier: string;
  cashValue: number;
  deathBenefit: number;
  /** Illustrated indexed crediting rate, as a decimal. */
  creditingRate: number;
  /** Current loan rate charged by the carrier, as a decimal. */
  loanRate: number;
  loanType: LoanType;
  /**
   * True when the contract's wash provision credits the loaned portion at the loan
   * rate, making the net cost of borrowing zero.
   */
  hasWashProvision: boolean;
  /** Age at which the wash provision becomes available, if applicable. */
  washAvailableAtYear?: number;
  /** Policy year. Wash provisions typically vest after year 10. */
  policyYear: number;
  /** Maximum loan-to-cash-value the carrier permits. */
  maxLoanToValue: number;
  /** Outstanding loan balance already drawn. */
  existingLoanBalance: number;
  /** Annual premium still being paid into this policy. */
  annualPremium: number;
}

export interface IPLOEInput {
  policies: PolicyPosition[];
  currentAge: number;
  retirementAge: number;
  /** Annual tax-free income required from the portfolio. */
  annualIncomeNeeded: number;
  projectionYears: number;
  /** Marginal tax rate, used to value the tax-free nature of the income. */
  marginalTaxRate: number;
  /**
   * Expected rate-cycle amplitude for variable loans, as a decimal. Variable loan
   * rates move with the carrier's index; this is the peak-to-trough swing modeled.
   */
  rateCycleAmplitude: number;
  /** Length of a full rate cycle in years. */
  rateCycleYears: number;
}

// ─── VRHM ─────────────────────────────────────────────────────────────────────
export interface RateWindow {
  year: number;
  /** Modeled variable loan rate in this year. */
  variableLoanRate: number;
  creditingRate: number;
  /** Crediting rate less loan rate. Positive is favorable. */
  spread: number;
  /** True when the spread clears the 2% threshold in dependent claim 4. */
  favorable: boolean;
}

export interface RateHedgeAnalysis {
  windows: RateWindow[];
  /** Years where the spread clears the favorable threshold. */
  favorableYears: number[];
  bestYear: number;
  bestSpread: number;
  worstSpread: number;
  /**
   * Emergent Capability 2 — income from timing draws into favorable windows versus
   * drawing the same total on a flat schedule.
   */
  timedIncomeAdvantage: number;
  timedIncomeAdvantagePercent: number;
}

// ─── WLAD ─────────────────────────────────────────────────────────────────────
export interface WashArbitrageOpportunity {
  policyId: string;
  label: string;
  /** True once the wash provision has vested for this policy. */
  currentlyAvailable: boolean;
  availableInYears: number;
  /** Borrowable amount under the carrier's loan-to-value cap. */
  borrowableAmount: number;
  /** Net annual cost of borrowing — zero under a true wash. */
  netBorrowingCost: number;
  /** Annual value created by borrowing at zero net cost. */
  annualArbitrageValue: number;
  detail: string;
}

// ─── MPLC ─────────────────────────────────────────────────────────────────────
export interface LoanAllocation {
  policyId: string;
  label: string;
  loanType: LoanType;
  /** Annual draw assigned to this policy. */
  annualDraw: number;
  /** Net cost rate applied to this draw. */
  netCostRate: number;
  annualCost: number;
  /** Remaining borrowing capacity after the assignment. */
  remainingCapacity: number;
  lapseRisk: "safe" | "caution" | "danger";
}

export interface CrossPolicyMove {
  fromPolicyId: string;
  fromLabel: string;
  toPolicyId: string;
  toLabel: string;
  annualAmount: number;
  /** Net cost of borrowing from the source policy. */
  borrowCost: number;
  /** Crediting earned on the destination policy. */
  creditEarned: number;
  netAnnualGain: number;
  detail: string;
}

export interface IPLOEResult {
  rateHedge: RateHedgeAnalysis;
  washOpportunities: WashArbitrageOpportunity[];
  allocations: LoanAllocation[];
  crossPolicyMoves: CrossPolicyMove[];
  /** Aggregate annual loan cost under the coordinated allocation. */
  coordinatedAnnualCost: number;
  /** Aggregate annual cost if the draw were split evenly across policies. */
  naiveAnnualCost: number;
  /** Emergent Capability 1 — savings from coordination over naive splitting. */
  coordinationSavings: number;
  /** Per-policy single-policy projections from SI-024, for reference. */
  perPolicyProjections: Array<{ policyId: string; label: string; result: PolicyLoanResult }>;
  /** Value of the income being tax-free rather than taxable withdrawal. */
  taxAdvantageValue: number;
  criticalFindings: string[];
  irsReferences: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Net annual cost rate of borrowing from a policy, accounting for wash provisions. */
export function netCostRate(policy: PolicyPosition): number {
  // A vested wash provision credits the loaned portion at the loan rate, so the
  // borrower pays interest and receives an equal credit — net zero.
  if (policy.hasWashProvision && washVested(policy)) return 0;
  // Otherwise the true cost is the loan rate less whatever the loaned balance still
  // earns. Non-participating loans earn nothing on the collateralized portion.
  return Math.max(0, policy.loanRate - (policy.loanType === "wash" ? policy.creditingRate : 0));
}

export function washVested(policy: PolicyPosition): boolean {
  if (!policy.hasWashProvision) return false;
  return policy.policyYear >= (policy.washAvailableAtYear ?? 10);
}

/** Borrowing capacity remaining under the carrier's loan-to-value limit. */
export function borrowingCapacity(policy: PolicyPosition): number {
  return Math.max(0, policy.cashValue * policy.maxLoanToValue - policy.existingLoanBalance);
}

/**
 * VRHM — Variable Rate Hedging Module.
 *
 * Variable loan rates oscillate with the carrier's index while indexed crediting
 * rates are floored. Modeling the cycle rather than a point rate exposes windows
 * where the spread is widest, and drawing into those windows rather than on a flat
 * schedule produces materially more income for the same policy drain.
 */
export function analyzeRateHedge(input: IPLOEInput): RateHedgeAnalysis {
  // Use the variable-rate policies to set the baseline; fall back to the portfolio.
  const variablePolicies = input.policies.filter(p => p.loanType === "variable");
  const basis = variablePolicies.length > 0 ? variablePolicies : input.policies;
  const baseLoanRate = basis.reduce((s, p) => s + p.loanRate, 0) / Math.max(1, basis.length);
  const creditingRate = basis.reduce((s, p) => s + p.creditingRate, 0) / Math.max(1, basis.length);

  const windows: RateWindow[] = [];
  for (let year = 1; year <= input.projectionYears; year += 1) {
    // Sinusoidal rate cycle around the base loan rate.
    const phase = (2 * Math.PI * year) / Math.max(1, input.rateCycleYears);
    const variableLoanRate = Math.max(0, baseLoanRate + (input.rateCycleAmplitude / 2) * Math.sin(phase));
    const spread = creditingRate - variableLoanRate;
    windows.push({
      year,
      variableLoanRate: Math.round(variableLoanRate * 1e6) / 1e6,
      creditingRate: Math.round(creditingRate * 1e6) / 1e6,
      spread: Math.round(spread * 1e6) / 1e6,
      // Dependent claim 4: favorable windows carry at least a 2% positive differential.
      favorable: spread >= 0.02,
    });
  }

  const favorableYears = windows.filter(w => w.favorable).map(w => w.year);
  const best = windows.reduce((a, b) => (a.spread >= b.spread ? a : b));
  const worst = windows.reduce((a, b) => (a.spread <= b.spread ? a : b));

  // Flat schedule: the same total draw spread evenly, paying the average rate.
  const avgSpread = windows.reduce((s, w) => s + w.spread, 0) / Math.max(1, windows.length);
  // Timed schedule: concentrate draws into favorable windows, earning their spread.
  const timedSpread =
    favorableYears.length > 0
      ? windows.filter(w => w.favorable).reduce((s, w) => s + w.spread, 0) / favorableYears.length
      : avgSpread;

  const totalDraw = input.annualIncomeNeeded * input.projectionYears;
  const timedIncomeAdvantage = totalDraw * (timedSpread - avgSpread);

  return {
    windows,
    favorableYears,
    bestYear: best.year,
    bestSpread: best.spread,
    worstSpread: worst.spread,
    timedIncomeAdvantage: round(timedIncomeAdvantage),
    timedIncomeAdvantagePercent: totalDraw > 0 ? round((timedIncomeAdvantage / totalDraw) * 100) : 0,
  };
}

/**
 * WLAD — Wash Loan Arbitrage Detector.
 *
 * A vested wash provision means the loaned portion continues to be credited at the
 * loan rate, so borrowing costs nothing net. Money borrowed at zero cost and left to
 * compound elsewhere is pure arbitrage, and it is invisible unless the contract's
 * wash terms are read per policy.
 */
export function detectWashArbitrage(input: IPLOEInput): WashArbitrageOpportunity[] {
  return input.policies
    .filter(p => p.hasWashProvision)
    .map(p => {
      const vested = washVested(p);
      const availableInYears = Math.max(0, (p.washAvailableAtYear ?? 10) - p.policyYear);
      const borrowable = borrowingCapacity(p);
      const cost = netCostRate(p);

      // Value of borrowing at zero net cost: the spread captured against what the
      // borrower would otherwise pay on the same money.
      const annualArbitrageValue = vested ? borrowable * Math.max(0, p.loanRate - cost) : 0;

      return {
        policyId: p.id,
        label: p.label,
        currentlyAvailable: vested,
        availableInYears,
        borrowableAmount: round(borrowable),
        netBorrowingCost: Math.round(cost * 1e6) / 1e6,
        annualArbitrageValue: round(annualArbitrageValue),
        detail: vested
          ? `Wash provision vested in policy year ${p.washAvailableAtYear ?? 10}. ` +
            `$${Math.round(borrowable).toLocaleString()} borrowable at zero net cost — the loaned balance continues ` +
            `to be credited at the ${(p.loanRate * 100).toFixed(2)}% loan rate.`
          : `Wash provision vests in policy year ${p.washAvailableAtYear ?? 10}; ${availableInYears} year(s) away. ` +
            `Borrowing before vesting costs the full ${(p.loanRate * 100).toFixed(2)}% loan rate.`,
      };
    });
}

/**
 * MPLC — Multi-Policy Loan Coordinator.
 *
 * Fills the required annual draw from the cheapest borrowing source first. Because
 * wash-loan policies cost nothing net, they are exhausted before any policy that
 * charges a real spread — which is the coordination a single-policy optimizer
 * structurally cannot perform.
 */
export function coordinateLoans(input: IPLOEInput): {
  allocations: LoanAllocation[];
  coordinatedAnnualCost: number;
  naiveAnnualCost: number;
} {
  const ranked = [...input.policies].sort((a, b) => {
    const costDiff = netCostRate(a) - netCostRate(b);
    if (Math.abs(costDiff) > 1e-9) return costDiff;
    // Tie-break toward the policy with more headroom, to spread lapse risk.
    return borrowingCapacity(b) - borrowingCapacity(a);
  });

  let remaining = input.annualIncomeNeeded;
  const allocations: LoanAllocation[] = ranked.map(p => {
    // Annual draw is limited so the policy is not exhausted in a single year.
    const capacity = borrowingCapacity(p);
    const annualLimit = capacity / Math.max(1, input.projectionYears);
    const draw = Math.min(remaining, annualLimit);
    remaining -= draw;

    const cost = netCostRate(p);
    const projectedLTV = p.cashValue > 0 ? (p.existingLoanBalance + draw * input.projectionYears) / p.cashValue : 0;

    return {
      policyId: p.id,
      label: p.label,
      loanType: p.loanType,
      annualDraw: round(draw),
      netCostRate: Math.round(cost * 1e6) / 1e6,
      annualCost: round(draw * cost),
      remainingCapacity: round(capacity - draw * input.projectionYears),
      lapseRisk: projectedLTV >= p.maxLoanToValue ? "danger" : projectedLTV >= p.maxLoanToValue * 0.85 ? "caution" : "safe",
    };
  });

  const coordinatedAnnualCost = allocations.reduce((s, a) => s + a.annualCost, 0);

  // Naive baseline: split the draw evenly across every policy regardless of cost.
  const evenDraw = input.annualIncomeNeeded / Math.max(1, input.policies.length);
  const naiveAnnualCost = input.policies.reduce((s, p) => s + evenDraw * netCostRate(p), 0);

  return {
    allocations,
    coordinatedAnnualCost: round(coordinatedAnnualCost),
    naiveAnnualCost: round(naiveAnnualCost),
  };
}

/**
 * Identify cross-policy moves: borrow from a zero-cost wash policy to fund premium
 * on a policy crediting at a higher rate. This is the arbitrage the application
 * describes as impossible at the single-policy level.
 */
export function findCrossPolicyMoves(input: IPLOEInput): CrossPolicyMove[] {
  const sources = input.policies.filter(p => netCostRate(p) === 0 && borrowingCapacity(p) > 0);
  const moves: CrossPolicyMove[] = [];

  for (const source of sources) {
    // Destination: a different policy still taking premium, crediting above the
    // source's net borrowing cost.
    const destinations = input.policies
      .filter(d => d.id !== source.id && d.annualPremium > 0 && d.creditingRate > netCostRate(source))
      .sort((a, b) => b.creditingRate - a.creditingRate);

    const destination = destinations[0];
    if (!destination) continue;

    const capacity = borrowingCapacity(source) / Math.max(1, input.projectionYears);
    const annualAmount = Math.min(capacity, destination.annualPremium);
    if (annualAmount <= 0) continue;

    const borrowCost = annualAmount * netCostRate(source);
    const creditEarned = annualAmount * destination.creditingRate;

    moves.push({
      fromPolicyId: source.id,
      fromLabel: source.label,
      toPolicyId: destination.id,
      toLabel: destination.label,
      annualAmount: round(annualAmount),
      borrowCost: round(borrowCost),
      creditEarned: round(creditEarned),
      netAnnualGain: round(creditEarned - borrowCost),
      detail:
        `Borrow $${Math.round(annualAmount).toLocaleString()}/yr from ${source.label} at zero net cost ` +
        `(wash provision) and direct it to ${destination.label}, which credits ` +
        `${(destination.creditingRate * 100).toFixed(2)}%. Neither policy alone produces this.`,
    });
  }

  return moves;
}

/**
 * Run the full multi-policy IUL loan optimization.
 */
export function optimizeIULLoans(input: IPLOEInput): IPLOEResult {
  const criticalFindings: string[] = [];

  if (input.policies.length === 0) {
    throw new Error("At least one policy is required to optimize IUL loans.");
  }

  const combinedCashValue = input.policies.reduce((s, p) => s + p.cashValue, 0);
  if (input.policies.length < 2 || combinedCashValue < 500_000) {
    criticalFindings.push(
      `This engine is calibrated for 2+ policies with combined cash value above $500,000. ` +
        `Current: ${input.policies.length} polic${input.policies.length === 1 ? "y" : "ies"}, ` +
        `$${Math.round(combinedCashValue).toLocaleString()} cash value. Multi-policy coordination has limited room here.`,
    );
  }

  const rateHedge = analyzeRateHedge(input);
  const washOpportunities = detectWashArbitrage(input);
  const { allocations, coordinatedAnnualCost, naiveAnnualCost } = coordinateLoans(input);
  const crossPolicyMoves = findCrossPolicyMoves(input);

  // Per-policy single-policy projections, delegated to SI-024 rather than reimplemented.
  const perPolicyProjections = input.policies.map(p => ({
    policyId: p.id,
    label: p.label,
    result: optimizePolicyLoans({
      currentCashValue: p.cashValue,
      currentAge: input.currentAge,
      retirementAge: input.retirementAge,
      illustratedRate: p.creditingRate,
      loanRate: p.loanRate,
      loanType: p.loanType,
      annualIncomeNeeded: allocations.find(a => a.policyId === p.id)?.annualDraw ?? 0,
      maxLoanToValue: p.maxLoanToValue,
      projectionYears: input.projectionYears,
      annualPremium: p.annualPremium,
      premiumYearsRemaining: Math.max(0, input.retirementAge - input.currentAge),
      deathBenefit: p.deathBenefit,
    }),
  }));

  // Policy loans are not income under IRC § 72(e) so long as the contract does not
  // become a MEC and does not lapse with a loan outstanding.
  const taxAdvantageValue = input.annualIncomeNeeded * input.projectionYears * input.marginalTaxRate;

  const unfunded = Math.max(0, input.annualIncomeNeeded - allocations.reduce((s, a) => s + a.annualDraw, 0));
  if (unfunded > 0) {
    criticalFindings.push(
      `Portfolio capacity is short of the income target by $${Math.round(unfunded).toLocaleString()}/yr over ` +
        `${input.projectionYears} years. Extend the draw horizon, add premium, or reduce the target.`,
    );
  }

  const vestedWash = washOpportunities.filter(w => w.currentlyAvailable);
  if (vestedWash.length > 0) {
    criticalFindings.push(
      `${vestedWash.length} polic${vestedWash.length === 1 ? "y has" : "ies have"} a vested wash provision, ` +
        `offering $${Math.round(vestedWash.reduce((s, w) => s + w.borrowableAmount, 0)).toLocaleString()} of ` +
        `zero-net-cost borrowing. Exhaust these before drawing on any policy that charges a real spread.`,
    );
  }

  if (crossPolicyMoves.length > 0) {
    const totalGain = crossPolicyMoves.reduce((s, m) => s + m.netAnnualGain, 0);
    criticalFindings.push(
      `Cross-policy arbitrage available: $${Math.round(totalGain).toLocaleString()}/yr by borrowing from ` +
        `wash-provision policies to fund premium on higher-crediting policies.`,
    );
  }

  const dangerous = allocations.filter(a => a.lapseRisk === "danger");
  if (dangerous.length > 0) {
    criticalFindings.push(
      `${dangerous.map(d => d.label).join(", ")} would exceed the carrier's loan-to-value limit at this draw. ` +
        `A policy that lapses with a loan outstanding triggers immediate taxation of the entire gain under ` +
        `IRC § 72(e) — the single largest risk in this strategy.`,
    );
  }

  if (rateHedge.favorableYears.length > 0) {
    criticalFindings.push(
      `${rateHedge.favorableYears.length} of ${input.projectionYears} years carry a favorable spread of 2% or more ` +
        `(best in year ${rateHedge.bestYear} at ${(rateHedge.bestSpread * 100).toFixed(2)}%). Timing draws into ` +
        `those windows is worth $${Math.round(rateHedge.timedIncomeAdvantage).toLocaleString()} over a flat schedule.`,
    );
  }

  return {
    rateHedge,
    washOpportunities,
    allocations,
    crossPolicyMoves,
    coordinatedAnnualCost,
    naiveAnnualCost,
    coordinationSavings: round(naiveAnnualCost - coordinatedAnnualCost),
    perPolicyProjections,
    taxAdvantageValue: round(taxAdvantageValue),
    criticalFindings,
    irsReferences: [
      "IRC § 72(e) — Amounts not received as annuities; policy loans are not income while the contract stays in force",
      "IRC § 7702 — Life insurance contract definition",
      "IRC § 7702A — Modified endowment contract rules; a MEC loses favorable loan treatment",
      "IRC § 264(a)(3) — Limits on deducting interest on policy loans",
      "Rev. Rul. 2009-13 — Tax consequences of a life insurance contract surrender with an outstanding loan",
    ],
  };
}
