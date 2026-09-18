// ─── Real Estate Capital Stack Engine ───────────────────────────────────────
// Models a levered real estate investment end to end: sources and uses, a
// monthly-accurate debt amortization aggregated to annual reporting periods,
// coverage and leverage metrics per year, disposition, and an IRR-lookback
// promote waterfall.
//
// Modelling decisions worth knowing, because they change the numbers:
//
//  · Debt amortizes MONTHLY and is rolled up to annual rows. Annual-only
//    amortization materially understates interest and overstates DSCR.
//  · DSCR is computed on NOI NET of the capital reserve. That is the
//    conservative lender definition; underwriting on gross NOI flatters
//    coverage by exactly the reserve.
//  · Exit value capitalizes FORWARD NOI (the year after disposition) at the
//    exit cap rate — the convention a buyer actually underwrites to.
//  · A tranche whose term expires before disposition keeps being serviced on
//    its existing terms. That implicitly assumes a refinance at the same rate,
//    which is optimistic, so `refinanceRequired` is set and the findings engine
//    raises it. The alternative — letting the debt vanish at maturity — would
//    silently hand the deal free money.
//  · The waterfall runs on the combined common equity pool (LP + GP co-invest).
//    Hurdle distributions are split pro-rata by contribution; the promote is
//    paid to the GP on top. This is how a real LP/GP deal settles.

import type {
  CapitalStackInput,
  CapitalStackResult,
  DebtLayer,
  DebtPeriodRow,
  ExitSummary,
  PeriodRow,
  SourcesAndUses,
  StackReturns,
  WaterfallSplit,
  WaterfallTier,
} from "./realEstateCapitalTypes";

/* ═══ Numeric helpers ══════════════════════════════════════════════════════ */

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Level payment for a fully amortizing loan. */
export function pmt(ratePerPeriod: number, periods: number, principal: number): number {
  if (periods <= 0) return 0;
  if (ratePerPeriod === 0) return principal / periods;
  return (principal * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -periods));
}

/** Net present value of a period-indexed cash flow vector (index 0 = today). */
export function npv(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

/**
 * Internal rate of return by bracketed bisection.
 *
 * Bisection rather than Newton: Newton diverges on the sign-flipping flows a
 * levered deal produces, and silently returning a wrong IRR is worse than
 * returning NaN.
 *
 * Returns NaN when no rate solves the vector (e.g. every flow is positive).
 */
export function irr(cashFlows: number[]): number {
  if (cashFlows.length < 2) return NaN;
  const hasPositive = cashFlows.some((c) => c > 0);
  const hasNegative = cashFlows.some((c) => c < 0);
  if (!hasPositive) return -1; // total loss
  if (!hasNegative) return NaN; // no capital at risk — IRR undefined

  let low = -0.9999;
  let high = 1;
  let fLow = npv(low, cashFlows);
  let fHigh = npv(high, cashFlows);

  // Expand the upper bracket before giving up.
  let expansions = 0;
  while (fLow * fHigh > 0 && expansions < 60) {
    high *= 2;
    fHigh = npv(high, cashFlows);
    expansions++;
  }
  if (fLow * fHigh > 0) return NaN;

  for (let i = 0; i < 300; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid, cashFlows);
    if (Math.abs(fMid) < 1e-9 || (high - low) / 2 < 1e-12) return mid;
    if (fLow * fMid <= 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return (low + high) / 2;
}

/* ═══ Debt amortization ════════════════════════════════════════════════════ */

/**
 * Amortize one tranche month by month, returning annual roll-ups.
 * Service continues past stated maturity (see header note); `matured` marks
 * those years so the caller can flag refinance exposure.
 */
export function amortizeLayer(layer: DebtLayer, holdYears: number): DebtPeriodRow[] {
  const monthlyRate = layer.rate / 12;
  const ioMonths = Math.round(layer.ioYears * 12);
  const amortMonths = Math.round(layer.amortYears * 12);
  const termMonths = Math.round(layer.termYears * 12);

  let balance = layer.principal;
  // For a straight amortizing loan the payment is struck at origination.
  let payment =
    layer.amortization === "amortizing" ? pmt(monthlyRate, amortMonths, layer.principal) : 0;

  const rows: DebtPeriodRow[] = [];

  for (let year = 1; year <= holdYears; year++) {
    const beginningBalance = balance;
    let yearInterest = 0;
    let yearPrincipal = 0;

    for (let m = 1; m <= 12; m++) {
      if (balance <= 1e-9) break;
      const monthIndex = (year - 1) * 12 + m;
      const interest = balance * monthlyRate;

      const interestOnlyThisMonth =
        layer.amortization === "interest_only"
          ? true
          : layer.amortization === "io_then_amortizing"
            ? monthIndex <= ioMonths
            : false;

      let principal = 0;
      if (!interestOnlyThisMonth) {
        // Strike the amortizing payment the month the IO runway ends.
        if (layer.amortization === "io_then_amortizing" && monthIndex === ioMonths + 1) {
          payment = pmt(monthlyRate, amortMonths, balance);
        }
        principal = Math.max(0, Math.min(payment - interest, balance));
      }

      yearInterest += interest;
      yearPrincipal += principal;
      balance -= principal;
    }

    rows.push({
      layerId: layer.id,
      year,
      beginningBalance: round2(beginningBalance),
      interest: round2(yearInterest),
      principal: round2(yearPrincipal),
      debtService: round2(yearInterest + yearPrincipal),
      endingBalance: round2(balance),
      matured: year * 12 > termMonths,
    });
  }

  return rows;
}

/* ═══ Promote waterfall ════════════════════════════════════════════════════ */

/**
 * IRR-lookback waterfall.
 *
 * At each distribution date a tier's shortfall is the amount the capital pool
 * still needs, right now, to have earned that tier's hurdle IRR on every dollar
 * contributed — contributions accreted forward at the hurdle, prior
 * distributions credited back at the same rate. Cash fills the lowest unmet
 * tier first, split at that tier's ratio, then spills to the next.
 *
 * Because the split applies to the whole dollar, satisfying an LP shortfall of
 * S at an 80/20 tier consumes S / 0.80 of cash — the GP's promote rides along.
 */
export function runWaterfall(
  contribution: number,
  distributions: number[], // index = year; year 0 unused
  tiers: WaterfallTier[],
): { capitalSide: number[]; promote: number[]; tierDetail: WaterfallSplit["tiers"] } {
  const capitalSide = new Array(distributions.length).fill(0);
  const promote = new Array(distributions.length).fill(0);
  const sorted = [...tiers].sort((a, b) => a.irrHurdle - b.irrHurdle);
  const tierDetail = sorted.map((t) => ({
    irrHurdle: t.irrHurdle,
    lpAllocated: 0,
    gpAllocated: 0,
  }));

  // Distributions credited to the capital pool so far, by year.
  const paidToCapital: { year: number; amount: number }[] = [];

  const shortfallAt = (hurdle: number, year: number): number => {
    if (!Number.isFinite(hurdle)) return Infinity;
    const accretedContribution = contribution * Math.pow(1 + hurdle, year);
    const accretedPaid = paidToCapital.reduce(
      (sum, p) => sum + p.amount * Math.pow(1 + hurdle, year - p.year),
      0,
    );
    return accretedContribution - accretedPaid;
  };

  for (let year = 1; year < distributions.length; year++) {
    let remaining = distributions[year];
    if (remaining <= 0) continue;

    for (let i = 0; i < sorted.length && remaining > 1e-9; i++) {
      const tier = sorted[i];
      const shortfall = shortfallAt(tier.irrHurdle, year);
      if (shortfall <= 1e-9) continue; // hurdle already cleared

      // Cash this tier can absorb. A zero LP share would never clear its
      // shortfall, so it takes whatever is left rather than looping forever.
      const cashForTier =
        tier.lpShare > 0 ? Math.min(remaining, shortfall / tier.lpShare) : remaining;

      const toCapital = cashForTier * tier.lpShare;
      const toPromote = cashForTier * tier.gpShare;

      capitalSide[year] += toCapital;
      promote[year] += toPromote;
      tierDetail[i].lpAllocated += toCapital;
      tierDetail[i].gpAllocated += toPromote;

      if (toCapital > 0) paidToCapital.push({ year, amount: toCapital });
      remaining -= cashForTier;
    }
  }

  return { capitalSide, promote, tierDetail };
}

/* ═══ Main engine ══════════════════════════════════════════════════════════ */

export function analyzeCapitalStack(input: CapitalStackInput): CapitalStackResult {
  const { property, debt, preferredEquity, commonEquity, waterfall } = input;
  const holdYears = Math.max(1, Math.round(property.holdYears));

  /* ── Sources and uses ── */
  const totalDebt = debt.reduce((s, d) => s + d.principal, 0);
  const originationFees = debt.reduce((s, d) => s + d.principal * d.originationFeePct, 0);
  const prefContribution = preferredEquity?.contribution ?? 0;
  const commonContribution = commonEquity.lpContribution + commonEquity.gpContribution;

  const sources = [
    ...debt.map((d) => ({ label: `${d.kind} — ${d.id}`, amount: d.principal })),
    ...(prefContribution > 0 ? [{ label: "Preferred equity", amount: prefContribution }] : []),
    { label: "Common equity", amount: commonContribution },
  ];
  const uses = [
    { label: "Purchase price", amount: property.purchasePrice },
    { label: "Closing costs", amount: property.purchasePrice * property.closingCostsPct },
    { label: "Capex budget", amount: property.capexBudget },
    { label: "Origination fees", amount: originationFees },
  ];
  const totalSources = sources.reduce((s, x) => s + x.amount, 0);
  const totalUses = uses.reduce((s, x) => s + x.amount, 0);

  const sourcesAndUses: SourcesAndUses = {
    sources,
    uses,
    totalSources: round2(totalSources),
    totalUses: round2(totalUses),
    surplus: round2(totalSources - totalUses),
    balanced: Math.abs(totalSources - totalUses) < 1,
  };

  /* ── Debt schedules ── */
  const debtSchedule: DebtPeriodRow[] = debt.flatMap((d) => amortizeLayer(d, holdYears));
  const byYear = (year: number) => debtSchedule.filter((r) => r.year === year);

  let refinanceYear: number | null = null;
  for (const d of debt) {
    if (d.termYears < holdYears) {
      const y = Math.ceil(d.termYears);
      refinanceYear = refinanceYear === null ? y : Math.min(refinanceYear, y);
    }
  }

  /* ── Operating schedule ── */
  const noiFor = (year: number) =>
    property.year1NOI * Math.pow(1 + property.noiGrowthRate, year - 1);

  const schedule: PeriodRow[] = [];
  const covenantBreachYears: number[] = [];

  // Preferred equity balance accretes on the unpaid (non-current-pay) stub.
  let prefBalance = prefContribution;
  const prefAccrualRate = preferredEquity
    ? Math.max(0, preferredEquity.rate - preferredEquity.currentPayRate)
    : 0;

  for (let year = 1; year <= holdYears; year++) {
    const noi = noiFor(year);
    const capexReserve = noi * property.capexReservePctOfNOI;
    const netOperatingCashFlow = noi - capexReserve;

    const rows = byYear(year);
    const interest = rows.reduce((s, r) => s + r.interest, 0);
    const principalAmortization = rows.reduce((s, r) => s + r.principal, 0);
    const debtService = interest + principalAmortization;
    const totalDebtBalance = rows.reduce((s, r) => s + r.endingBalance, 0);

    const cashFlowAfterDebtService = netOperatingCashFlow - debtService;

    // Current-pay preferred is serviced only from available cash.
    const prefCurrentPayDue = preferredEquity
      ? prefBalance * preferredEquity.currentPayRate
      : 0;
    const preferredCurrentPay = Math.max(
      0,
      Math.min(prefCurrentPayDue, Math.max(0, cashFlowAfterDebtService)),
    );
    // Anything due but unpaid accrues alongside the stated accrual stub.
    const prefShortfall = prefCurrentPayDue - preferredCurrentPay;
    if (preferredEquity) {
      const accrual = prefBalance * prefAccrualRate + prefShortfall;
      prefBalance = preferredEquity.compounding
        ? prefBalance + accrual
        : prefBalance + accrual;
    }

    const distributableToCommon = cashFlowAfterDebtService - preferredCurrentPay;

    // Coverage and leverage. Value marks to the exit cap on forward NOI.
    const dscr = debtService > 0 ? netOperatingCashFlow / debtService : Infinity;
    const debtYield = totalDebtBalance > 0 ? noi / totalDebtBalance : Infinity;
    const markValue = noiFor(year + 1) / property.exitCapRate;
    const ltv = markValue > 0 ? totalDebtBalance / markValue : 0;

    const covenantBreaches: string[] = [];
    for (const d of debt) {
      if (d.dscrCovenant === undefined) continue;
      const layerRow = rows.find((r) => r.layerId === d.id);
      if (!layerRow || layerRow.debtService <= 0) continue;
      // Each tranche is tested on coverage of debt service at its level and
      // everything senior to it — how an intercreditor agreement actually reads.
      const seniorIndex = debt.findIndex((x) => x.id === d.id);
      const throughThisLayer = rows
        .filter((r) => debt.findIndex((x) => x.id === r.layerId) <= seniorIndex)
        .reduce((s, r) => s + r.debtService, 0);
      const layerDscr = throughThisLayer > 0 ? netOperatingCashFlow / throughThisLayer : Infinity;
      if (layerDscr < d.dscrCovenant) covenantBreaches.push(d.id);
    }
    if (covenantBreaches.length > 0) covenantBreachYears.push(year);

    schedule.push({
      year,
      noi: round2(noi),
      capexReserve: round2(capexReserve),
      netOperatingCashFlow: round2(netOperatingCashFlow),
      interest: round2(interest),
      principalAmortization: round2(principalAmortization),
      debtService: round2(debtService),
      cashFlowAfterDebtService: round2(cashFlowAfterDebtService),
      preferredCurrentPay: round2(preferredCurrentPay),
      distributableToCommon: round2(distributableToCommon),
      totalDebtBalance: round2(totalDebtBalance),
      dscr: Number.isFinite(dscr) ? Math.round(dscr * 1000) / 1000 : Infinity,
      debtYield: Number.isFinite(debtYield) ? Math.round(debtYield * 10000) / 10000 : Infinity,
      ltv: Math.round(ltv * 10000) / 10000,
      covenantBreaches,
    });
  }

  /* ── Disposition ── */
  const forwardNOI = noiFor(holdYears + 1);
  const grossSalePrice = forwardNOI / property.exitCapRate;
  const saleCosts = grossSalePrice * property.saleCostPct;
  const finalRows = byYear(holdYears);
  const debtPayoff = finalRows.reduce((s, r) => s + r.endingBalance, 0);
  const prepaymentPenalties = debt.reduce((s, d) => {
    const row = finalRows.find((r) => r.layerId === d.id);
    return s + (row?.endingBalance ?? 0) * (d.prepaymentPenaltyPct ?? 0);
  }, 0);

  const proceedsBeforePref = grossSalePrice - saleCosts - debtPayoff - prepaymentPenalties;
  const preferredRedemption = Math.max(0, Math.min(prefBalance, Math.max(0, proceedsBeforePref)));
  const netProceedsToCommon = proceedsBeforePref - preferredRedemption;

  const exit: ExitSummary = {
    year: holdYears,
    grossSalePrice: round2(grossSalePrice),
    saleCosts: round2(saleCosts),
    debtPayoff: round2(debtPayoff),
    prepaymentPenalties: round2(prepaymentPenalties),
    preferredRedemption: round2(preferredRedemption),
    netProceedsToCommon: round2(netProceedsToCommon),
  };

  /* ── Cash flow vectors ── */
  const commonEquityCashFlows: number[] = [-commonContribution];
  for (let year = 1; year <= holdYears; year++) {
    const operating = schedule[year - 1].distributableToCommon;
    // Operating shortfalls are not capital calls in this model; they simply
    // produce no distribution. The DSCR findings carry that risk instead.
    const distribution = Math.max(0, operating);
    commonEquityCashFlows.push(
      year === holdYears ? distribution + netProceedsToCommon : distribution,
    );
  }

  const unleveredCashFlows: number[] = [-totalUses];
  for (let year = 1; year <= holdYears; year++) {
    const operating = schedule[year - 1].netOperatingCashFlow;
    unleveredCashFlows.push(
      year === holdYears ? operating + (grossSalePrice - saleCosts) : operating,
    );
  }

  /* ── Returns ── */
  const totalDistributions = commonEquityCashFlows.slice(1).reduce((s, c) => s + c, 0);
  const operatingYears = schedule.filter((r) => r.distributableToCommon > 0);
  const averageCashOnCash =
    commonContribution > 0 && operatingYears.length > 0
      ? operatingYears.reduce((s, r) => s + r.distributableToCommon, 0) /
        operatingYears.length /
        commonContribution
      : 0;

  const returns: StackReturns = {
    unleveredIrr: irr(unleveredCashFlows),
    leveredIrr: irr(commonEquityCashFlows),
    equityMultiple: commonContribution > 0 ? totalDistributions / commonContribution : 0,
    averageCashOnCash,
    minDscr: Math.min(...schedule.map((r) => r.dscr)),
    maxLtv: Math.max(...schedule.map((r) => r.ltv)),
    minDebtYield: Math.min(...schedule.map((r) => r.debtYield)),
    peakEquity: commonContribution,
  };

  /* ── Waterfall ── */
  const distributions = commonEquityCashFlows.map((c, i) => (i === 0 ? 0 : c));
  const { capitalSide, promote, tierDetail } = runWaterfall(
    commonContribution,
    distributions,
    waterfall,
  );

  const lpRatio =
    commonContribution > 0 ? commonEquity.lpContribution / commonContribution : 0;
  const gpRatio = 1 - lpRatio;

  const lpFlows = [-commonEquity.lpContribution];
  const gpFlows = [-commonEquity.gpContribution];
  for (let year = 1; year <= holdYears; year++) {
    lpFlows.push(capitalSide[year] * lpRatio);
    gpFlows.push(capitalSide[year] * gpRatio + promote[year]);
  }

  const lpDistributions = lpFlows.slice(1).reduce((s, c) => s + c, 0);
  const gpDistributions = gpFlows.slice(1).reduce((s, c) => s + c, 0);
  const totalProfit =
    lpDistributions + gpDistributions - commonContribution;
  const gpProfit = gpDistributions - commonEquity.gpContribution;

  const waterfallSplit: WaterfallSplit = {
    lpDistributions: round2(lpDistributions),
    gpDistributions: round2(gpDistributions),
    lpIrr: irr(lpFlows),
    gpIrr: irr(gpFlows),
    lpEquityMultiple:
      commonEquity.lpContribution > 0 ? lpDistributions / commonEquity.lpContribution : 0,
    gpEquityMultiple:
      commonEquity.gpContribution > 0 ? gpDistributions / commonEquity.gpContribution : 0,
    gpProfitShare: totalProfit > 0 ? gpProfit / totalProfit : 0,
    tiers: tierDetail.map((t) => ({
      irrHurdle: t.irrHurdle,
      lpAllocated: round2(t.lpAllocated),
      gpAllocated: round2(t.gpAllocated),
    })),
  };

  return {
    sourcesAndUses,
    schedule,
    debtSchedule,
    exit,
    commonEquityCashFlows: commonEquityCashFlows.map(round2),
    unleveredCashFlows: unleveredCashFlows.map(round2),
    returns,
    waterfall: waterfallSplit,
    covenantBreachYears,
    refinanceRequired: refinanceYear !== null,
    refinanceYear,
  };
}

/* ═══ Convenience ══════════════════════════════════════════════════════════ */

/** A conventional 8% pref / 20% promote over a 15% hurdle structure. */
export const STANDARD_WATERFALL: WaterfallTier[] = [
  { irrHurdle: 0.08, lpShare: 1.0, gpShare: 0.0 },
  { irrHurdle: 0.15, lpShare: 0.8, gpShare: 0.2 },
  { irrHurdle: Infinity, lpShare: 0.7, gpShare: 0.3 },
];

/** Going-in cap rate — NOI over total capitalization. */
export function goingInCapRate(input: CapitalStackInput): number {
  const totalCost =
    input.property.purchasePrice * (1 + input.property.closingCostsPct) +
    input.property.capexBudget;
  return totalCost > 0 ? input.property.year1NOI / totalCost : 0;
}

/**
 * Weighted average cost of the debt stack, annualized.
 * Used by the findings engine to detect negative leverage.
 */
export function weightedAverageDebtCost(debt: DebtLayer[]): number {
  const total = debt.reduce((s, d) => s + d.principal, 0);
  if (total <= 0) return 0;
  return debt.reduce((s, d) => s + d.rate * (d.principal / total), 0);
}

/**
 * Debt constant — annual debt service per dollar of debt. Compared against the
 * going-in cap rate, this is the cleanest negative-leverage test there is.
 */
export function debtConstant(debt: DebtLayer[]): number {
  const total = debt.reduce((s, d) => s + d.principal, 0);
  if (total <= 0) return 0;
  const annualService = debt.reduce((s, d) => {
    const monthlyRate = d.rate / 12;
    if (d.amortization === "interest_only") return s + d.principal * d.rate;
    const monthly = pmt(monthlyRate, Math.round(d.amortYears * 12), d.principal);
    return s + monthly * 12;
  }, 0);
  return annualService / total;
}
