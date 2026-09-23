// ─── RECIN — Real Estate Capacity Engine ────────────────────────────────────
// Borrower-side capital capacity. Answers the question an advisor actually
// gets asked: given these properties, liens, rents and reserves, how much can
// this client prudently borrow, through which instrument, and what breaks
// first?
//
// Deliberately separate from realEstateDealModel.ts, which models the
// sponsor side (LP/GP waterfall, promote, exit IRR). Same domain, different
// question, different contract.
//
// ── Conventions that change the answer ──────────────────────────────────────
//
//  · NOI is UNDERWRITTEN, never a seller's pro forma: effective gross income
//    uses the lesser of actual occupancy and (1 − assumed vacancy), and
//    operating expenses include taxes, insurance, HOA, management and the
//    maintenance reserve. Omitting the reserve is how pro formas flatter DSCR.
//
//  · DSCR sizing is tested on TOTAL coverage — NOI ÷ (existing + new debt
//    service) — not on the new loan in isolation. Incremental testing lets a
//    second lien pass while the property as a whole cannot carry itself.
//
//  · Debt yield is likewise tested on total debt. It is the one leverage test
//    that does not move with rates or cap rates, which is exactly why a
//    take-out lender will hold you to it at refinance.
//
//  · LENDER MAXIMUM and PRUDENT MAXIMUM are separate numbers and are reported
//    separately. The first is what someone will lend; the second is what
//    survives the policy thresholds for coverage, portfolio leverage and
//    reserves. The gap between them is the product.
//
//  · Reserves are counted ONCE. A balance already earmarked as a vacancy
//    reserve cannot simultaneously be the bridge interest reserve and the
//    retirement buffer. Only unallocated cash counts toward runway.
//
//  · Sale cash and taxable gain are computed in separate columns and never
//    netted. Debt payoff is a use of cash; it does not reduce taxable gain.
//
// Nothing here concludes that a loan is available, approved, suitable, or that
// any amount is deductible. Those are lender, advisor and CPA determinations;
// the engine emits review flags instead.

import { pmt } from "./realEstateDealModel";
import type {
  BindingConstraint,
  CapacityStressResult,
  DebtOption,
  DebtOptionOutcome,
  ExitAnalysis,
  Finding,
  LiquidityProfile,
  MissingInput,
  PaymentPoint,
  PortfolioMetric,
  PropertyInput,
  PropertyMetric,
  RealEstateCapitalScenarioInput,
  RealEstateCapitalScenarioResult,
  RealEstatePolicy,
  SaleAnalysis,
  ScenarioAssumptions,
  TaxFlag,
} from "./realEstateCapitalTypes";
import { DEFAULT_REAL_ESTATE_POLICY } from "./realEstateCapitalTypes";
import { generateCapacityFindings } from "./realEstateFindings";

export const CAPACITY_CALCULATION_VERSION = "recin-capacity-1.0.0";

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;
const clampPositive = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/* ═══ Defaults ═════════════════════════════════════════════════════════════ */

/**
 * Where the two take-out lending defaults come from. refinanceMaxLtv 0.75 is
 * Fannie Mae's single-family ceiling for a one-unit investment property
 * refinance, cash-out or limited cash-out; refinanceMinDscr 1.25 is Fannie
 * Mae Multifamily's minimum debt service coverage for a conventional property.
 * Every other default below is the firm's assumption (see RECIN_SOURCES).
 */
const TAKEOUT_LTV_SOURCE = {
  label: "Fannie Mae, Eligibility Matrix (incorporated in the Selling Guide), Standard Eligibility Requirements, Desktop Underwriter: investment property, 1 unit, cash-out and limited cash-out refinance, maximum LTV/CLTV/HCLTV 75%",
  url: "https://singlefamily.fanniemae.com/media/20786/display",
  asOf: "matrix dated 2026-08-05, read 2026-09-23",
  note: "The same matrix allows 80% for a one-unit principal residence cash-out refinance and 70% for a 2 to 4 unit investment property cash-out refinance.",
};
const TAKEOUT_DSCR_SOURCE = {
  label: "Fannie Mae Multifamily, Conventional Properties Term Sheet: minimum DSCR 1.25x, maximum LTV 80%",
  url: "https://multifamily.fanniemae.com/financing-options/conventional-properties-term-sheet",
  asOf: "read 2026-09-23",
};

export function getDefaultScenarioAssumptions(): ScenarioAssumptions {
  return {
    vacancyRate: 0.07,
    rentGrowth: 0.03,
    expenseGrowth: 0.03,
    propertyValueGrowth: 0.03,
    rateShockBps: 0,
    saleCostPct: 0.07,
    refinanceRate: 0.075,
    refinanceMaxLtv: 0.75,
    refinanceMinDscr: 1.25,
    taxReviewRequired: true,
  };
}

/* ═══ Property-level math ══════════════════════════════════════════════════ */

/** Total operating expenses, including the reserves a pro forma tends to drop. */
export function operatingExpenses(p: PropertyInput): number {
  return (
    p.annualOperatingExpenses +
    p.annualTaxes +
    p.annualInsurance +
    (p.annualHoa ?? 0) +
    (p.annualManagement ?? 0) +
    (p.annualMaintenanceReserve ?? 0)
  );
}

/**
 * Underwritten NOI. Occupancy is the lesser of what the client reports and
 * what the scenario assumes — an advisor's 100%-occupied claim does not
 * override a 12% vacancy stress.
 */
export function underwrittenNoi(
  p: PropertyInput,
  vacancyRate: number,
  expenseMultiplier = 1,
): { egi: number; opex: number; noi: number } {
  const effectiveOccupancy = Math.max(0, Math.min(p.occupancy, 1 - vacancyRate));
  const egi = p.annualGrossRent * effectiveOccupancy;
  const opex = operatingExpenses(p) * expenseMultiplier;
  return { egi, opex, noi: egi - opex };
}

/** Annual debt service per dollar borrowed, for a given option. */
export function annualDebtConstant(option: DebtOption, rateOverride?: number): number {
  const rate = rateOverride ?? option.rate;
  if (option.paymentMode === "deferred") return 0;
  if (option.paymentMode === "interest_only" || option.paymentMode === "cash_flow_waterfall") {
    return rate;
  }
  const amortMonths = option.amortizationMonths ?? option.termMonths;
  if (amortMonths <= 0) return rate;
  const monthly = pmt(rate / 12, amortMonths, 1);
  return monthly * 12;
}

/* ═══ Capacity sizing ══════════════════════════════════════════════════════ */

interface CapacityCandidates {
  byLtv: number;
  byCltv: number;
  byDscr: number | null;
  byDebtYield: number | null;
  byLtc: number | null;
  byArv: number | null;
}

function pickBinding(c: CapacityCandidates): {
  amount: number;
  constraint: BindingConstraint;
} {
  const entries: { amount: number; constraint: BindingConstraint }[] = [
    { amount: c.byLtv, constraint: "ltv" },
    { amount: c.byCltv, constraint: "cltv" },
  ];
  if (c.byDscr !== null) entries.push({ amount: c.byDscr, constraint: "dscr" });
  if (c.byDebtYield !== null) entries.push({ amount: c.byDebtYield, constraint: "debt_yield" });
  if (c.byLtc !== null) entries.push({ amount: c.byLtc, constraint: "ltc" });
  if (c.byArv !== null) entries.push({ amount: c.byArv, constraint: "arv" });

  return entries.reduce(
    (min, e) => (e.amount < min.amount ? e : min),
    { amount: Infinity, constraint: "unknown" as BindingConstraint },
  );
}

export function computePropertyMetric(
  p: PropertyInput,
  option: DebtOption,
  assumptions: ScenarioAssumptions,
  policy: RealEstatePolicy,
  overrides: { valueMultiplier?: number; expenseMultiplier?: number; rateOverride?: number } = {},
): PropertyMetric {
  const value = p.value * (overrides.valueMultiplier ?? 1);
  const { egi, opex, noi } = underwrittenNoi(
    p,
    assumptions.vacancyRate,
    overrides.expenseMultiplier ?? 1,
  );

  const senior = p.liens
    .filter((l) => l.lienPosition <= 1)
    .reduce((s, l) => s + l.currentBalance, 0);
  const junior = p.liens
    .filter((l) => l.lienPosition > 1)
    .reduce((s, l) => s + l.currentBalance, 0);
  const undrawn = p.liens.reduce((s, l) => s + (l.availableLine ?? 0), 0);
  const existingBalance = senior + junior;
  const existingDs = p.liens.reduce((s, l) => s + l.annualDebtService, 0);

  const maxLtv = option.maxLtv ?? 1;
  const maxCltv = option.maxCltv ?? maxLtv;

  const capacityByLtv = clampPositive(value * maxLtv - existingBalance);
  // Undrawn availability is live exposure: a lender counts the whole line.
  const capacityByCltv = clampPositive(value * maxCltv - existingBalance - undrawn);

  const constant = annualDebtConstant(option, overrides.rateOverride);
  const minDscr = option.minDscr ?? policy.targetMinimumDscr;

  let capacityByDscr: number | null = null;
  if (constant > 0 && minDscr > 0) {
    const maxTotalDs = noi / minDscr;
    capacityByDscr = clampPositive((maxTotalDs - existingDs) / constant);
  }

  let capacityByDebtYield: number | null = null;
  const minDebtYield = option.minimumDebtYield ?? null;
  if (minDebtYield !== null && minDebtYield > 0) {
    capacityByDebtYield = clampPositive(noi / minDebtYield - existingBalance);
  }

  const binding = pickBinding({
    byLtv: capacityByLtv,
    byCltv: capacityByCltv,
    byDscr: capacityByDscr,
    byDebtYield: capacityByDebtYield,
    byLtc: null,
    byArv: null,
  });

  return {
    propertyId: p.id,
    name: p.name,
    value: round2(value),
    effectiveGrossIncome: round2(egi),
    operatingExpenses: round2(opex),
    noi: round2(noi),
    existingSeniorBalance: round2(senior),
    existingJuniorBalance: round2(junior),
    undrawnAvailability: round2(undrawn),
    currentLtv: value > 0 ? round4(existingBalance / value) : 0,
    currentCltv: value > 0 ? round4((existingBalance + undrawn) / value) : 0,
    existingAnnualDebtService: round2(existingDs),
    currentDscr: existingDs > 0 ? round4(noi / existingDs) : Infinity,
    capacityByLtv: round2(capacityByLtv),
    capacityByCltv: round2(capacityByCltv),
    capacityByDscr: capacityByDscr === null ? null : round2(capacityByDscr),
    capacityByDebtYield: capacityByDebtYield === null ? null : round2(capacityByDebtYield),
    bindingCapacity: round2(Number.isFinite(binding.amount) ? binding.amount : 0),
    bindingConstraint: binding.constraint,
    isFreeAndClear: existingBalance <= 0 && undrawn <= 0,
    crossCollateralized: p.liens.some((l) => l.crossCollateralized === true),
  };
}

export function computePortfolioMetric(metrics: PropertyMetric[]): PortfolioMetric {
  const totalValue = metrics.reduce((s, m) => s + m.value, 0);
  const totalNoi = metrics.reduce((s, m) => s + m.noi, 0);
  const totalDebt = metrics.reduce(
    (s, m) => s + m.existingSeniorBalance + m.existingJuniorBalance,
    0,
  );
  const totalUndrawn = metrics.reduce((s, m) => s + m.undrawnAvailability, 0);
  const totalDs = metrics.reduce((s, m) => s + m.existingAnnualDebtService, 0);
  const crossed = metrics.filter((m) => m.crossCollateralized);

  return {
    totalValue: round2(totalValue),
    totalNoi: round2(totalNoi),
    totalExistingDebt: round2(totalDebt),
    totalUndrawnAvailability: round2(totalUndrawn),
    portfolioLtv: totalValue > 0 ? round4(totalDebt / totalValue) : 0,
    portfolioCltv: totalValue > 0 ? round4((totalDebt + totalUndrawn) / totalValue) : 0,
    totalExistingAnnualDebtService: round2(totalDs),
    portfolioDscr: totalDs > 0 ? round4(totalNoi / totalDs) : Infinity,
    crossCollateralizedCount: crossed.length,
    crossCollateralExposureValue: round2(crossed.reduce((s, m) => s + m.value, 0)),
  };
}

/* ═══ Liquidity ════════════════════════════════════════════════════════════ */

/**
 * Reserves net of every job the client has already assigned them.
 *
 * The collision this catches: a household with $150k of cash that is
 * simultaneously the vacancy reserve, the bridge interest reserve and the
 * retirement buffer has $150k, not $450k. Summing earmarks past the balance
 * produces a negative unallocated figure, which is the signal.
 */
export function unallocatedReserves(l: LiquidityProfile): {
  unallocated: number;
  totalEarmarked: number;
  overcommitted: boolean;
} {
  const totalEarmarked =
    (l.earmarkedVacancyReserve ?? 0) +
    (l.earmarkedBridgeInterestReserve ?? 0) +
    (l.earmarkedInsuranceReserve ?? 0) +
    (l.earmarkedRetirementBuffer ?? 0);
  const unallocated = l.totalLiquidReserves - totalEarmarked;
  return {
    unallocated: round2(unallocated),
    totalEarmarked: round2(totalEarmarked),
    overcommitted: unallocated < 0,
  };
}

export function reserveMonths(
  liquidity: LiquidityProfile,
  totalAnnualDebtService: number,
): number {
  const { unallocated } = unallocatedReserves(liquidity);
  const monthlyBurn =
    totalAnnualDebtService / 12 + (liquidity.monthlyFixedCostsOutsideProperty ?? 0);
  if (monthlyBurn <= 0) return Infinity;
  return round2(Math.max(0, unallocated) / monthlyBurn);
}

/* ═══ Payment schedule ═════════════════════════════════════════════════════ */

export function buildPaymentSchedule(
  principal: number,
  option: DebtOption,
  maxMonths?: number,
  rateOverride?: number,
): PaymentPoint[] {
  const rate = rateOverride ?? option.rate;
  const monthlyRate = rate / 12;
  const ioMonths = option.interestOnlyMonths ?? 0;
  const amortMonths = option.amortizationMonths ?? option.termMonths;
  const months = Math.min(option.termMonths, maxMonths ?? option.termMonths);

  const schedule: PaymentPoint[] = [];
  let balance = principal;
  let payment =
    option.paymentMode === "amortizing" ? pmt(monthlyRate, amortMonths, principal) : 0;

  for (let m = 1; m <= months; m++) {
    const beginning = balance;
    const interest = balance * monthlyRate;
    let principalPaid = 0;
    let paid: number;

    const inIo =
      option.paymentMode === "interest_only" ||
      option.paymentMode === "cash_flow_waterfall" ||
      (option.paymentMode === "amortizing" && m <= ioMonths);

    if (option.paymentMode === "deferred") {
      // Interest accrues to the balance rather than being paid.
      paid = 0;
      balance += interest;
    } else if (inIo) {
      paid = interest;
    } else {
      if (option.paymentMode === "amortizing" && m === ioMonths + 1 && ioMonths > 0) {
        payment = pmt(monthlyRate, Math.max(1, amortMonths - ioMonths), balance);
      }
      principalPaid = Math.max(0, Math.min(payment - interest, balance));
      paid = interest + principalPaid;
      balance -= principalPaid;
    }

    schedule.push({
      month: m,
      beginningBalance: round2(beginning),
      interest: round2(interest),
      principal: round2(principalPaid),
      payment: round2(paid),
      endingBalance: round2(balance),
      interestOnly: inIo,
    });
  }
  return schedule;
}

/* ═══ Prepayment ═══════════════════════════════════════════════════════════ */

export function prepaymentPenalty(option: DebtOption, balance: number, atMonth: number): number {
  const s = option.prepayment;
  switch (s.kind) {
    case "none":
      return 0;
    case "flat_pct":
      return balance * (s.flatPct ?? 0);
    case "step_down": {
      const year = Math.max(0, Math.ceil(atMonth / 12) - 1);
      const schedule = s.stepDownPctByYear ?? [];
      return balance * (schedule[year] ?? 0);
    }
    case "lockout":
      // Inside lockout, prepayment is barred rather than priced. Surfaced as a
      // finding; modelled here as the flat rate if one was supplied.
      return atMonth <= (s.lockoutMonths ?? 0) ? balance * (s.flatPct ?? 0) : 0;
    case "yield_maintenance":
    case "defeasance":
      // Both are rate-path dependent and cannot be computed without a live
      // curve. Returning 0 with a finding is honest; inventing a number is not.
      return 0;
    default:
      return 0;
  }
}

/* ═══ Exit / takeout readiness ═════════════════════════════════════════════ */

/**
 * Tests whether a bridge can actually be repaid.
 *
 * A bridge scenario is not "go" merely because the bridge itself pencils — the
 * permanent take-out has to pass its own LTV, DSCR and debt-yield tests under
 * its own stressed assumptions. An untested exit scores zero.
 */
export function computeExitAnalysis(
  principal: number,
  option: DebtOption,
  assumptions: ScenarioAssumptions,
  policy: RealEstatePolicy,
  exitContext: {
    exitValue: number;
    stabilizedNoi: number;
    saleMode: "sale" | "refinance";
  },
): ExitAnalysis {
  const exitMonths = assumptions.exitMonths ?? option.termMonths;
  const schedule = buildPaymentSchedule(principal, option, exitMonths);
  const payoff = schedule.length > 0 ? schedule[schedule.length - 1].endingBalance : principal;
  const penalty = prepaymentPenalty(option, payoff, exitMonths);

  // Refinance proceeds are constrained by BOTH the take-out LTV and its DSCR.
  const refiConstant = assumptions.refinanceRate > 0 ? assumptions.refinanceRate : 0.075;
  const byLtv = exitContext.exitValue * assumptions.refinanceMaxLtv;
  const byDscr =
    assumptions.refinanceMinDscr > 0
      ? exitContext.stabilizedNoi / assumptions.refinanceMinDscr / refiConstant
      : Infinity;
  const byDebtYield = policy.minimumDebtYield > 0
    ? exitContext.stabilizedNoi / policy.minimumDebtYield
    : Infinity;
  const refinanceProceeds = Math.max(0, Math.min(byLtv, byDscr, byDebtYield));

  const exitCosts =
    exitContext.saleMode === "sale" ? exitContext.exitValue * assumptions.saleCostPct : 0;
  const conservativeProceeds =
    exitContext.saleMode === "sale"
      ? exitContext.exitValue - exitCosts
      : refinanceProceeds;

  const required = payoff + penalty + exitCosts;
  const exitCoverage = required > 0 ? conservativeProceeds / required : Infinity;

  const blockers: string[] = [];
  const passesLtv = byLtv >= payoff + penalty;
  const passesDscr = byDscr >= payoff + penalty;
  const passesDebtYield = byDebtYield >= payoff + penalty;
  if (!passesLtv) blockers.push("Take-out LTV does not cover the payoff");
  if (!passesDscr) blockers.push("Take-out DSCR does not support the payoff");
  if (!passesDebtYield) blockers.push("Take-out debt yield does not support the payoff");
  if (exitContext.stabilizedNoi <= 0) blockers.push("No stabilized NOI supplied for the take-out");

  const passCount = [passesLtv, passesDscr, passesDebtYield].filter(Boolean).length;
  const coverageScore = Math.max(0, Math.min(1, exitCoverage / policy.minimumBridgeExitCoverage));
  const score =
    exitContext.stabilizedNoi <= 0 ? 0 : round4((passCount / 3) * 0.6 + coverageScore * 0.4);

  return {
    exitMonths,
    payoffAtExit: round2(payoff),
    prepaymentPenalty: round2(penalty),
    conservativeProceeds: round2(conservativeProceeds),
    exitCosts: round2(exitCosts),
    exitCoverage: Number.isFinite(exitCoverage) ? round4(exitCoverage) : Infinity,
    takeoutReadiness: {
      refinanceProceeds: round2(refinanceProceeds),
      passesLtv,
      passesDscr,
      passesDebtYield,
      score,
      blockers,
    },
  };
}

/* ═══ Sale: cash and tax, never netted ═════════════════════════════════════ */

export function computeSaleAnalysis(
  p: PropertyInput,
  assumptions: ScenarioAssumptions,
  salePriceOverride?: number,
): SaleAnalysis {
  const grossSalePrice = salePriceOverride ?? p.value;
  const saleCosts = grossSalePrice * assumptions.saleCostPct;
  const debtPayoff = p.liens.reduce((s, l) => s + l.currentBalance, 0);
  const netCashToOwner = grossSalePrice - saleCosts - debtPayoff;

  const accumulatedDepreciation = p.accumulatedDepreciation ?? 0;
  // Basis is reduced by depreciation taken; that reduction is what creates the
  // recapture component of the gain.
  const adjustedBasis = (p.adjustedBasis ?? 0) - accumulatedDepreciation;
  const totalGain = grossSalePrice - saleCosts - adjustedBasis;
  const depreciationRecaptured = Math.max(0, Math.min(accumulatedDepreciation, totalGain));
  const capitalGain = totalGain - depreciationRecaptured;

  return {
    grossSalePrice: round2(grossSalePrice),
    saleCosts: round2(saleCosts),
    debtPayoff: round2(debtPayoff),
    netCashToOwner: round2(netCashToOwner),
    adjustedBasis: round2(adjustedBasis),
    depreciationRecaptured: round2(depreciationRecaptured),
    capitalGain: round2(capitalGain),
    note:
      "Cash and tax are separate columns. Debt payoff reduces sale proceeds; it does NOT reduce taxable gain. Gain is computed from sale price less selling costs less adjusted basis, with depreciation recaptured at its own rate. CPA review required.",
  };
}

/* ═══ Stress ═══════════════════════════════════════════════════════════════ */

function runCapacityStress(
  label: CapacityStressResult["label"],
  input: RealEstateCapitalScenarioInput,
  option: DebtOption,
  policy: RealEstatePolicy,
): CapacityStressResult {
  const base = input.assumptions;
  const stress =
    label === "base"
      ? { vacancy: base.vacancyRate, shockBps: base.rateShockBps, decline: 0, expense: 0 }
      : label === "conservative"
        ? {
            vacancy: Math.max(base.vacancyRate, policy.vacancyRateConservative),
            shockBps: policy.rateShockBpsConservative,
            decline: policy.valueDeclineConservative,
            expense: policy.expenseIncreaseConservative,
          }
        : {
            vacancy: Math.max(base.vacancyRate, policy.vacancyRateSevere),
            shockBps: policy.rateShockBpsSevere,
            decline: policy.valueDeclineSevere,
            expense: policy.expenseIncreaseSevere,
          };

  const assumptions: ScenarioAssumptions = { ...base, vacancyRate: stress.vacancy };
  // Only variable-rate paper reprices. Fixed debt is insulated until maturity,
  // where the exposure is refinance risk instead.
  const shocked =
    option.rateType === "fixed" ? option.rate : option.rate + stress.shockBps / 10_000;

  const metrics = input.properties.map((p) =>
    computePropertyMetric(p, option, assumptions, policy, {
      valueMultiplier: 1 - stress.decline,
      expenseMultiplier: 1 + stress.expense,
      rateOverride: shocked,
    }),
  );
  const portfolio = computePortfolioMetric(metrics);
  const supported = metrics.reduce((s, m) => s + m.bindingCapacity, 0);

  const constant = annualDebtConstant(option, shocked);
  const newDs = supported * constant;
  const totalDs = portfolio.totalExistingAnnualDebtService + newDs;
  const totalDebt = portfolio.totalExistingDebt + supported;

  const dscr = totalDs > 0 ? portfolio.totalNoi / totalDs : Infinity;
  const debtYield = totalDebt > 0 ? portfolio.totalNoi / totalDebt : Infinity;
  const ltv = portfolio.totalValue > 0 ? totalDebt / portfolio.totalValue : 0;
  const cltv =
    portfolio.totalValue > 0
      ? (totalDebt + portfolio.totalUndrawnAvailability) / portfolio.totalValue
      : 0;
  const months = reserveMonths(input.liquidity, totalDs);

  const failures: string[] = [];
  if (dscr < policy.targetMinimumDscr) {
    failures.push(`DSCR ${dscr.toFixed(2)}x below policy ${policy.targetMinimumDscr}x`);
  }
  if (debtYield < policy.minimumDebtYield) {
    failures.push(
      `Debt yield ${(debtYield * 100).toFixed(1)}% below policy ${(policy.minimumDebtYield * 100).toFixed(1)}%`,
    );
  }
  if (ltv > policy.maxPrudentPortfolioLtv) {
    failures.push(
      `Portfolio LTV ${(ltv * 100).toFixed(1)}% above policy ${(policy.maxPrudentPortfolioLtv * 100).toFixed(1)}%`,
    );
  }
  if (months < policy.targetReserveMonths) {
    failures.push(
      `Reserves ${months.toFixed(1)} months below policy ${policy.targetReserveMonths} months`,
    );
  }

  return {
    label,
    assumptions: {
      vacancyRate: stress.vacancy,
      rateShockBps: option.rateType === "fixed" ? 0 : stress.shockBps,
      valueDecline: stress.decline,
      expenseIncrease: stress.expense,
    },
    supportedProceeds: round2(supported),
    dscr: Number.isFinite(dscr) ? round4(dscr) : Infinity,
    debtYield: Number.isFinite(debtYield) ? round4(debtYield) : Infinity,
    ltv: round4(ltv),
    cltv: round4(cltv),
    annualDebtService: round2(totalDs),
    reserveMonths: months,
    exitCoverage: null,
    passesPolicy: failures.length === 0,
    failures,
  };
}

/* ═══ Option evaluation ════════════════════════════════════════════════════ */

function evaluateOption(
  input: RealEstateCapitalScenarioInput,
  option: DebtOption,
  policy: RealEstatePolicy,
): DebtOptionOutcome {
  const metrics = input.properties.map((p) =>
    computePropertyMetric(p, option, input.assumptions, policy),
  );
  const portfolio = computePortfolioMetric(metrics);

  const collateralCapacity = metrics.reduce((s, m) => s + m.capacityByLtv, 0);
  const cltvCapacity = metrics.reduce((s, m) => s + m.capacityByCltv, 0);
  const dscrCapacities = metrics.map((m) => m.capacityByDscr).filter((x): x is number => x !== null);
  const incomeCapacity =
    dscrCapacities.length > 0 ? dscrCapacities.reduce((s, x) => s + x, 0) : null;

  // Acquisition constraints, when proceeds fund a purchase.
  let byLtc: number | null = null;
  let byArv: number | null = null;
  const acq = input.acquisition;
  if (acq) {
    if (option.maxLtc !== undefined) {
      const totalCost =
        acq.purchasePrice + (acq.verifiedRehab ?? 0) + (acq.eligibleClosingCosts ?? 0);
      byLtc = clampPositive(totalCost * option.maxLtc);
    }
    if (option.maxArv !== undefined && acq.afterRepairValue !== undefined) {
      byArv = clampPositive(acq.afterRepairValue * option.maxArv);
    }
  }

  const binding = pickBinding({
    byLtv: collateralCapacity,
    byCltv: cltvCapacity,
    byDscr: incomeCapacity,
    byDebtYield: metrics.every((m) => m.capacityByDebtYield === null)
      ? null
      : metrics.reduce((s, m) => s + (m.capacityByDebtYield ?? 0), 0),
    byLtc,
    byArv,
  });

  const scenarios = {
    base: runCapacityStress("base", input, option, policy),
    conservative: runCapacityStress("conservative", input, option, policy),
    severe: runCapacityStress("severe", input, option, policy),
  };

  // Prudent capacity is the LENDER maximum cut down to what survives the
  // conservative stress. This is the number that should drive advice.
  const lenderMax = Number.isFinite(binding.amount) ? binding.amount : 0;
  const prudent = Math.max(
    0,
    Math.min(lenderMax, scenarios.conservative.supportedProceeds),
  );

  const constant = annualDebtConstant(option);
  const annualDs = prudent * constant;
  const upfrontCosts =
    prudent * ((option.pointsPct ?? 0) + (option.closingCostsPct ?? 0));

  const ineligibleReasons: string[] = [];
  if (lenderMax <= 0) ineligibleReasons.push("No collateral or income capacity available");
  if (option.minDscr !== undefined && scenarios.base.dscr < option.minDscr) {
    ineligibleReasons.push(
      `Base-case DSCR ${scenarios.base.dscr.toFixed(2)}x below the option's ${option.minDscr}x minimum`,
    );
  }

  // Bridge and hard-money options must prove their exit.
  let exitAnalysis: ExitAnalysis | undefined;
  if (option.category === "bridge" || option.category === "hard_money") {
    const stabilizedNoi =
      acq?.projectedAnnualGrossRent !== undefined
        ? acq.projectedAnnualGrossRent * (1 - input.assumptions.vacancyRate) -
          (acq.projectedAnnualOperatingExpenses ?? 0)
        : portfolio.totalNoi;
    const exitValue = acq?.afterRepairValue ?? portfolio.totalValue;
    exitAnalysis = computeExitAnalysis(prudent, option, input.assumptions, policy, {
      exitValue,
      stabilizedNoi,
      saleMode: "refinance",
    });
    scenarios.base.exitCoverage = exitAnalysis.exitCoverage;
  }

  return {
    optionId: option.id,
    label: option.label ?? option.category,
    category: option.category,
    eligible: ineligibleReasons.length === 0,
    ineligibleReasons,
    maximumCollateralCapacity: round2(collateralCapacity),
    maximumIncomeSupportedCapacity: incomeCapacity === null ? null : round2(incomeCapacity),
    recommendedMaximumPrudentCapacity: round2(prudent),
    bindingConstraint: binding.constraint,
    annualDebtService: round2(annualDs),
    upfrontCosts: round2(upfrontCosts),
    netProceedsAfterCosts: round2(prudent - upfrontCosts),
    paymentSchedule: buildPaymentSchedule(prudent, option, Math.min(option.termMonths, 120)),
    exitAnalysis,
    scenarios,
  };
}

/* ═══ Tax flags and missing inputs ═════════════════════════════════════════ */

function buildTaxFlags(input: RealEstateCapitalScenarioInput): TaxFlag[] {
  const flags: TaxFlag[] = [];
  const categories = new Set(input.debtOptions.map((o) => o.category));

  if (categories.has("heloc") || categories.has("home_equity_loan")) {
    flags.push({
      code: "INTEREST_IS_DEDUCTION_NOT_CREDIT",
      message:
        "Interest on a HELOC or home-equity loan is at most a deduction against income — it is not a tax credit, and it does not make borrowed money tax-free income. Borrowed principal is not income; it is a liability.",
      requiresCpaReview: true,
    });
    flags.push({
      code: "TRACING_REQUIRED",
      message:
        "Deductibility follows the USE of the proceeds, not the property pledged as collateral. Every draw must be traced to its use; commingling personal and investment use can disallow the deduction entirely.",
      requiresCpaReview: true,
    });
  }

  if (input.properties.some((p) => (p.accumulatedDepreciation ?? 0) > 0)) {
    flags.push({
      code: "DEPRECIATION_RECAPTURE_APPLIES",
      message:
        "Depreciation taken to date reduces basis and is recaptured on sale at its own rate, separately from capital gain.",
      requiresCpaReview: true,
    });
  }

  flags.push({
    code: "DEBT_PAYOFF_IS_NOT_GAIN_REDUCTION",
    message:
      "Paying off a loan at sale reduces the CASH you receive. It does not reduce taxable gain. These are reported as separate columns and must never be netted against each other.",
    requiresCpaReview: true,
  });

  if (input.properties.some((p) => p.useType !== "primary" && p.useType !== "second_home")) {
    flags.push({
      code: "PASSIVE_LOSS_LIMITATION_MAY_APPLY",
      message:
        "Rental losses may be limited by the passive activity rules depending on participation level and income. Modelled deductions assume CPA confirmation.",
      requiresCpaReview: true,
    });
  }

  if (input.properties.some((p) => p.ownershipType !== "personal")) {
    flags.push({
      code: "ENTITY_CHARACTERIZATION_REVIEW",
      message:
        "Entity-held property changes interest characterization, business-interest limitation exposure, and allocation rules. Structure review required.",
      requiresCpaReview: true,
    });
  }

  flags.push({
    code: "CPA_REVIEW_REQUIRED",
    message:
      "Every tax treatment shown is a modelling ASSUMPTION requiring CPA confirmation. Nothing here is a tax conclusion.",
    requiresCpaReview: true,
  });

  return flags;
}

function findMissingInputs(input: RealEstateCapitalScenarioInput): MissingInput[] {
  const missing: MissingInput[] = [];

  for (const p of input.properties) {
    if (p.adjustedBasis === undefined) {
      missing.push({
        field: `properties.${p.id}.adjustedBasis`,
        whyItMatters:
          "Without basis, taxable gain on a sale cannot be computed and only the cash column can be shown.",
        blocksCalculation: false,
      });
    }
    if (!p.valueAsOf) {
      missing.push({
        field: `properties.${p.id}.valueAsOf`,
        whyItMatters:
          "Every capacity figure scales off value. An undated value cannot be aged, and stale values silently overstate capacity.",
        blocksCalculation: false,
      });
    }
  }

  const needsArv = input.debtOptions.some(
    (o) => (o.category === "hard_money" || o.category === "bridge") && o.maxArv !== undefined,
  );
  if (needsArv && input.acquisition?.afterRepairValue === undefined) {
    missing.push({
      field: "acquisition.afterRepairValue",
      whyItMatters:
        "Hard-money sizing is constrained by after-repair value. Without it the ARV limit cannot bind and capacity will be overstated.",
      blocksCalculation: true,
    });
  }

  if (input.liquidity.totalLiquidReserves === undefined) {
    missing.push({
      field: "liquidity.totalLiquidReserves",
      whyItMatters: "Reserve runway is a hard constraint on prudent capacity.",
      blocksCalculation: true,
    });
  }

  return missing;
}

const DISCLAIMERS = [
  "This analysis is decision support, not a loan approval, commitment, or offer of credit. Eligibility and terms are determined solely by a lender on live application.",
  "Loan terms shown without a live source are illustrative only and are not quotes.",
  "No output here states or implies that any strategy is tax-free, deductible, suitable, or guaranteed. Tax treatment requires CPA confirmation; legal structure requires attorney review.",
  "Property values are estimates unless supported by a current appraisal, and every capacity figure scales directly off value.",
  "Projections are model output under stated assumptions and will differ from actual results.",
];

/* ═══ Main entry point ═════════════════════════════════════════════════════ */

export function analyzeRealEstateCapitalScenario(
  input: RealEstateCapitalScenarioInput,
): RealEstateCapitalScenarioResult {
  const policy: RealEstatePolicy = { ...DEFAULT_REAL_ESTATE_POLICY, ...(input.policy ?? {}) };

  const options = input.debtOptions.map((o) => evaluateOption(input, o, policy));

  // Portfolio metrics are option-independent; compute them against the first
  // option purely for its LTV ceilings, then report the shared figures.
  const referenceOption = input.debtOptions[0];
  const propertyMetrics = referenceOption
    ? input.properties.map((p) =>
        computePropertyMetric(p, referenceOption, input.assumptions, policy),
      )
    : [];
  const portfolioMetrics = computePortfolioMetric(propertyMetrics);

  const eligible = options.filter((o) => o.eligible);
  const pool = eligible.length > 0 ? eligible : options;

  const best = pool.reduce(
    (a, b) => (b.recommendedMaximumPrudentCapacity > a.recommendedMaximumPrudentCapacity ? b : a),
    pool[0],
  );

  const maxCollateral = options.reduce((m, o) => Math.max(m, o.maximumCollateralCapacity), 0);
  const incomeCaps = options
    .map((o) => o.maximumIncomeSupportedCapacity)
    .filter((x): x is number => x !== null);
  const maxIncome = incomeCaps.length > 0 ? Math.max(...incomeCaps) : null;

  const prudent = best?.recommendedMaximumPrudentCapacity ?? 0;
  const minReserve = options.reduce(
    (m, o) => Math.min(m, o.scenarios.severe.reserveMonths),
    Infinity,
  );

  const saleAnalysis =
    input.properties.length > 0 && input.properties[0].adjustedBasis !== undefined
      ? computeSaleAnalysis(input.properties[0], input.assumptions)
      : undefined;

  const result: RealEstateCapitalScenarioResult = {
    summary: {
      maximumCollateralCapacity: round2(maxCollateral),
      maximumIncomeSupportedCapacity: maxIncome === null ? null : round2(maxIncome),
      recommendedMaximumPrudentCapacity: round2(prudent),
      bindingConstraint: best?.bindingConstraint ?? "unknown",
      minimumReserveMonths: Number.isFinite(minReserve) ? minReserve : 0,
      shortfallAgainstRequest:
        input.requestedProceeds !== undefined
          ? round2(input.requestedProceeds - prudent)
          : null,
    },
    metrics: {
      propertyMetrics,
      portfolioMetrics,
      taxFlags: buildTaxFlags(input),
      saleAnalysis,
    },
    options,
    findings: [],
    requiredInputs: findMissingInputs(input),
    disclaimers: DISCLAIMERS,
    policyUsed: policy,
    calculationVersion: CAPACITY_CALCULATION_VERSION,
  };

  result.findings = generateCapacityFindings(input, result, policy);
  return result;
}

/** Rank options for the §15 comparison workflow, safest-first. */
export function compareStrategies(
  result: RealEstateCapitalScenarioResult,
): { optionId: string; label: string; prudentCapacity: number; fragility: number; rank: number }[] {
  const scored = result.options.map((o) => {
    // Fragility: how much capacity evaporates under stress, plus policy misses.
    const decay =
      o.scenarios.base.supportedProceeds > 0
        ? 1 - o.scenarios.severe.supportedProceeds / o.scenarios.base.supportedProceeds
        : 1;
    const policyMisses =
      (o.scenarios.base.passesPolicy ? 0 : 1) +
      (o.scenarios.conservative.passesPolicy ? 0 : 1) +
      (o.scenarios.severe.passesPolicy ? 0 : 1);
    const exitPenalty = o.exitAnalysis ? 1 - o.exitAnalysis.takeoutReadiness.score : 0;
    return {
      optionId: o.optionId,
      label: o.label,
      prudentCapacity: o.recommendedMaximumPrudentCapacity,
      fragility: round4(
        Math.max(0, Math.min(1, decay * 0.4 + (policyMisses / 3) * 0.4 + exitPenalty * 0.2)),
      ),
      rank: 0,
    };
  });

  // Least fragile first; capacity breaks ties. Never rank by capacity alone —
  // "borrow the most" is the wrong objective.
  scored.sort((a, b) => a.fragility - b.fragility || b.prudentCapacity - a.prudentCapacity);
  scored.forEach((s, i) => (s.rank = i + 1));
  return scored;
}

/* ═══ Sources ══════════════════════════════════════════════════════════════ */

/**
 * Every source this engine's typed-in numbers rest on, and every number that
 * is the firm's own choice, said so in words. Policy thresholds (target DSCR,
 * debt yield, portfolio LTV, reserves) live in DEFAULT_REAL_ESTATE_POLICY in
 * realEstateCapitalTypes.ts, not here.
 */
export const RECIN_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  TAKEOUT_LTV_SOURCE,
  TAKEOUT_DSCR_SOURCE,
  { label: "Assumption: vacancy = 7% of gross rent, chosen by the firm as an underwriting stress between full occupancy and a weak market; no external source" },
  { label: "Assumption: rent, expense and property value growth = 3% a year each, chosen by the firm as a round long-run nominal figure; no external source" },
  { label: "Assumption: selling costs = 7% of sale price (commission, transfer tax, closing), chosen by the firm; no external source" },
  { label: "Assumption: take-out refinance rate = 7.5% (default and the fallback when none is given), chosen by the firm as a conservative investor-loan rate; no external source" },
  { label: "Assumption: take-out readiness score = 60% on the share of the three take-out tests passed plus 40% on exit coverage, and fragility = 40% capacity decay under the severe scenario plus 40% policy misses plus 20% exit weakness, chosen by the firm as scoring weights; no external source" },
  { label: "Assumption: payment schedules printed for at most 120 months (10 years), chosen by the firm for display; no external source" },
];
