/**
 * Amazing MYGA Waterfall Engine v4
 * ─────────────────────────────────
 * CYCLE LOGIC (per user spec):
 *
 * 1) Purchase 5-year MYGA → bank lends 70% LTV → invest in 10-12yr O&G at 15% withdrawals
 * 2) Years 1-5: O&G income pays LOAN INTEREST ONLY (no principal payments)
 * 3) Year 6 (MYGA matures): pay off loan PRINCIPAL from maturity value
 *    → remaining maturity value redeploys into a new 5-year MYGA
 *    → new 70% loan on the redeployed MYGA → new O&G tranche
 * 4) Repeat: each cycle creates a new O&G tranche that overlaps with previous ones
 * 5) When multiple O&G tranches overlap, combined income exceeds single loan interest
 *    → excess income pays down loan principal early
 *
 * v4 ADDITIONS:
 * - Annual income → earned income tax savings from O&G depreciation
 * - Home equity / HELOC fact finder
 * - 5 tax savings deployment options (user chooses where to invest extra tax money)
 * - Scenario comparison: runs all 5 strategies and shows optimal
 */

/* ─── TAX DEPLOYMENT OPTIONS ─── */
export type TaxDeploymentOption =
  | "payback_heloc"          // Pay back HELOC principal only
  | "pay_bank_interest"      // Pay bank loan interest only (reduces O&G burden)
  | "buy_more_myga"          // Purchase more MYGA → borrow → more O&G (same rates/terms)
  | "pay_bank_principal"     // Pay down bank loan principal
  | "optimal_blend";         // Engine picks the best blend each year

/* ─── INPUT ─── */
export interface MYGAWaterfallInput {
  /** Initial MYGA premium */
  mygaPremium: number;
  /** MYGA guaranteed annual rate (e.g. 7 = 7%) */
  mygaRate: number;
  /** MYGA term in years (default 5) */
  mygaTerm: number;
  /** Bank loan-to-value ratio (e.g. 0.70 = 70%) */
  bankLtv: number;
  /** Bank loan annual interest rate (e.g. 7 = 7%) */
  bankLoanRate: number;
  /** Bank loan term in years (default 5, interest-only) */
  bankLoanTerm: number;
  /** Oil & gas investment term in years (default 12) */
  oilGasTerm: number;
  /** Oil & gas annual return rate (e.g. 15 = 15%) */
  oilGasReturnRate: number;
  /** Oil & gas depreciation rate year 1 (e.g. 80 = 80% of investment) */
  oilGasDepreciationY1: number;
  /** Oil & gas depreciation rate years 2+ (e.g. 8 = 8% of investment per year) */
  oilGasDepreciationOngoing: number;
  /** Total projection years (default 25) */
  projectionYears: number;
  /** Cash equivalents from fact finder (CDs, money markets, checking) */
  cashEquivalents: {
    cds: number;
    moneyMarkets: number;
    checking: number;
    savings: number;
  };
  /** Additional MYGA amounts added in subsequent cycles */
  additionalMygaPerCycle: number;

  // ─── v4: Tax & Home Equity ───
  /** Annual earned income (for tax savings calculation) */
  annualIncome: number;
  /** Federal marginal tax rate (e.g. 32 = 32%) */
  federalTaxRate: number;
  /** State marginal tax rate (e.g. 5 = 5%) */
  stateTaxRate: number;
  /** Home value (for HELOC calculation) */
  homeValue: number;
  /** Current mortgage balance */
  mortgageBalance: number;
  /** HELOC interest rate (e.g. 8.5 = 8.5%) */
  helocRate: number;
  /** HELOC max LTV (e.g. 0.80 = 80%) */
  helocMaxLtv: number;
  /** Where to deploy tax savings */
  taxDeployment: TaxDeploymentOption;
}

/* ─── OUTPUT TYPES ─── */

/** One row per year in the cascading projection */
export interface WaterfallYearRow {
  year: number;
  cycle: number;
  cycleYear: number;

  // MYGA columns
  mygaStartValue: number;
  mygaInterestEarned: number;
  mygaEndValue: number;
  mygaRolloverAmount: number;

  // Bank loan columns
  bankLoanBalance: number;
  bankLoanInterestPaid: number;
  bankLoanPrincipalPaid: number;
  bankLoanEndBalance: number;
  bankLoanTotalPayment: number;

  // Oil & Gas columns
  oilGasInvestment: number;
  oilGasIncome: number;
  oilGasQuarterlyPayment: number;
  oilGasDepreciation: number;
  oilGasCumulativeIncome: number;
  oilGasActive: boolean;

  // Per-tranche O&G income
  ogTrancheIncome: Record<string, number>;
  activeTrancheCount: number;

  // Loan Wipeout Tracking
  ogVsLoanDelta: number;
  loanCoveredByOG: boolean;
  cumulativeOGTowardLoan: number;
  cumulativeOGPureProfit: number;
  excessOGToPrincipal: number;

  // Net cash flow
  netCashFlow: number;
  cumulativeNetCashFlow: number;

  // Cumulative totals
  totalMygaInterestEarned: number;
  totalBankInterestPaid: number;
  totalOilGasIncome: number;
  totalDepreciation: number;
  totalNetBenefit: number;

  isMaturityYear: boolean;
  maturityPrincipalPayoff: number;
  maturityRedeployAmount: number;

  // ─── v4: Tax & HELOC tracking ───
  /** O&G depreciation deduction this year */
  taxDeduction: number;
  /** Tax savings from depreciation (deduction × combined tax rate) */
  taxSavings: number;
  /** Cumulative tax savings */
  cumulativeTaxSavings: number;
  /** How the tax savings were deployed this year */
  taxDeploymentAction: string;
  /** Amount deployed from tax savings */
  taxDeploymentAmount: number;
  /** HELOC balance at end of year */
  helocBalance: number;
  /** HELOC interest paid this year */
  helocInterestPaid: number;
  /** HELOC principal paid this year (from tax savings or excess O&G) */
  helocPrincipalPaid: number;
  /** Extra MYGA purchased from tax savings this year */
  taxSavingsMygaPurchased: number;
  /** Extra O&G income from tax-savings-funded MYGAs */
  taxSavingsOGIncome: number;
  /** Cumulative tax savings that have been reinvested (deployed) — tracks the compounding reinvestment */
  cumulativeTaxSavingsReinvested: number;
}

/** Summary totals for the entire projection */
export interface WaterfallSummary {
  totalMygaPremiumInvested: number;
  totalMygaInterestEarned: number;
  totalBankInterestPaid: number;
  totalOilGasInvested: number;
  totalOilGasIncomeReceived: number;
  totalDepreciationCredits: number;
  totalNetBenefit: number;
  finalMygaValue: number;
  numberOfCycles: number;
  effectiveAnnualReturn: number;
  loanWipeoutYear: number | null;
  totalOGTowardLoan: number;
  totalOGPureProfit: number;
  totalExcessOGToPrincipal: number;
  // v4
  totalTaxSavings: number;
  totalHelocInterestPaid: number;
  helocPayoffYear: number | null;
  totalTaxSavingsMygaPurchased: number;
  totalTaxSavingsOGIncome: number;
  helocAmount: number;
  homeEquity: number;
  /** Total tax savings reinvested (deployed) across all years */
  totalTaxSavingsReinvested: number;
}

export interface MYGAWaterfallResult {
  input: MYGAWaterfallInput;
  projection: WaterfallYearRow[];
  summary: WaterfallSummary;
  cycles: CycleBreakdown[];
  trancheInfo: TrancheInfo[];
}

export interface CycleBreakdown {
  cycleNumber: number;
  startYear: number;
  endYear: number;
  mygaPremium: number;
  mygaRolloverIn: number;
  mygaCycleStartValue: number;
  mygaMaturityValue: number;
  mygaInterestEarned: number;
  bankLoanAmount: number;
  bankInterestPaid: number;
  principalPaidFromMaturity: number;
  redeployedToNextCycle: number;
  oilGasInvestment: number;
  oilGasIncomeTotal: number;
  oilGasDepreciationTotal: number;
}

export interface TrancheInfo {
  trancheKey: string;
  cycleNumber: number;
  investment: number;
  startYear: number;
  endYear: number;
  annualIncome: number;
  color: string;
}

/* ─── SCENARIO COMPARISON ─── */
export interface ScenarioResult {
  option: TaxDeploymentOption;
  label: string;
  summary: WaterfallSummary;
  /** Key metric for ranking: total net benefit including tax savings and HELOC savings */
  totalValue: number;
  /** Year-by-year net benefit for chart overlay */
  yearlyNetBenefit: number[];
  /** Year-by-year cumulative tax savings reinvested for chart overlay */
  yearlyTaxReinvested: number[];
}

export interface ScenarioComparison {
  scenarios: ScenarioResult[];
  optimal: TaxDeploymentOption;
  optimalLabel: string;
}

/* ─── ENGINE ─── */

const TRANCHE_COLORS = [
  "#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#6366f1", "#84cc16", "#e11d48", "#0ea5e9",
];

export function getDefaultInput(): MYGAWaterfallInput {
  return {
    mygaPremium: 500000,
    mygaRate: 7,
    mygaTerm: 5,
    bankLtv: 0.70,
    bankLoanRate: 7,
    bankLoanTerm: 5,
    oilGasTerm: 12,
    oilGasReturnRate: 15,
    oilGasDepreciationY1: 80,
    oilGasDepreciationOngoing: 8,
    projectionYears: 25,
    cashEquivalents: { cds: 0, moneyMarkets: 0, checking: 0, savings: 0 },
    additionalMygaPerCycle: 0,
    // v4 defaults
    annualIncome: 0,
    federalTaxRate: 32,
    stateTaxRate: 5,
    homeValue: 0,
    mortgageBalance: 0,
    helocRate: 8.5,
    helocMaxLtv: 0.80,
    taxDeployment: "optimal_blend",
  };
}

export function runMYGAWaterfall(input: MYGAWaterfallInput): MYGAWaterfallResult {
  const {
    mygaPremium, mygaRate, mygaTerm, bankLtv, bankLoanRate,
    oilGasTerm, oilGasReturnRate, oilGasDepreciationY1, oilGasDepreciationOngoing,
    projectionYears, additionalMygaPerCycle,
    annualIncome, federalTaxRate, stateTaxRate,
    homeValue, mortgageBalance, helocRate, helocMaxLtv, taxDeployment,
  } = input;

  const mygaRateDec = mygaRate / 100;
  const bankRateDec = bankLoanRate / 100;
  const oilGasRateDec = oilGasReturnRate / 100;
  const combinedTaxRate = (federalTaxRate + stateTaxRate) / 100;
  const helocRateDec = helocRate / 100;

  // Calculate HELOC amount
  const homeEquity = Math.max(0, homeValue - mortgageBalance);
  const maxHelocAmount = homeValue * helocMaxLtv - mortgageBalance;
  const helocAmount = Math.max(0, maxHelocAmount);
  let helocBalance = helocAmount;

  const projection: WaterfallYearRow[] = [];
  const cycles: CycleBreakdown[] = [];
  const trancheInfo: TrancheInfo[] = [];

  // ─── Active O&G tranches ───
  interface OGTranche {
    cycleNumber: number;
    trancheKey: string;
    investment: number;
    startYear: number;
    endYear: number;
    annualIncome: number;
    depreciationY1: number;
    depreciationOngoing: number;
    source: "primary" | "tax_savings";
  }
  const ogTranches: OGTranche[] = [];

  // ─── Active bank loans ───
  interface BankLoan {
    cycleNumber: number;
    originalPrincipal: number;
    balance: number;
    startYear: number;
    source: "primary" | "tax_savings";
  }
  const bankLoans: BankLoan[] = [];

  // Tax-savings MYGA accumulator (builds up until it reaches a cycle boundary)
  let taxSavingsMygaAccumulator = 0;
  let taxSavingsMygaCycleCounter = 0;

  // Running MYGA state
  let currentMygaValue = 0;
  let totalMygaPremiumInvested = 0;

  // Cumulative totals
  let cumMygaInterest = 0;
  let cumBankInterest = 0;
  let cumOGIncome = 0;
  let cumDepreciation = 0;
  let cumNetCashFlow = 0;
  let cumOGTowardLoan = 0;
  let cumOGPureProfit = 0;
  let cumExcessOGToPrincipal = 0;
  let cumTaxSavings = 0;
  let cumHelocInterest = 0;
  let cumTaxSavingsMygaPurchased = 0;
  let cumTaxSavingsOGIncome = 0;
  let cumTaxSavingsReinvested = 0;
  let loanWipeoutYear: number | null = null;
  let helocPayoffYear: number | null = null;

  const numberOfCycles = Math.ceil(projectionYears / mygaTerm);

  for (let year = 1; year <= projectionYears; year++) {
    const cycleNumber = Math.ceil(year / mygaTerm);
    const cycleYear = ((year - 1) % mygaTerm) + 1;

    let mygaRolloverAmount = 0;
    let isMaturityYear = false;
    let maturityPrincipalPayoff = 0;
    let maturityRedeployAmount = 0;

    // ═══════════════════════════════════════════════════════════════
    // START OF NEW CYCLE
    // ═══════════════════════════════════════════════════════════════
    if (cycleYear === 1) {
      const cyclePremium = cycleNumber === 1 ? mygaPremium : additionalMygaPerCycle;

      // ─── MATURITY ROLLOVER from previous cycle ───
      let rolloverAmount = 0;
      if (cycleNumber > 1 && currentMygaValue > 0) {
        const prevCycleIdx = cycleNumber - 2;
        const prevCycle = cycles[prevCycleIdx];

        const prevLoan = bankLoans.find(l => l.cycleNumber === cycleNumber - 1 && l.source === "primary" && l.balance > 0);
        let principalPayoff = 0;
        if (prevLoan) {
          principalPayoff = Math.min(currentMygaValue, prevLoan.balance);
          prevLoan.balance -= principalPayoff;
          maturityPrincipalPayoff = principalPayoff;
          if (prevCycle) {
            prevCycle.principalPaidFromMaturity = principalPayoff;
          }
        }

        rolloverAmount = currentMygaValue - principalPayoff;
        mygaRolloverAmount = rolloverAmount;
        maturityRedeployAmount = rolloverAmount;
        isMaturityYear = true;

        if (prevCycle) {
          prevCycle.redeployedToNextCycle = rolloverAmount;
        }
      }

      // New MYGA starts with: fresh premium + rolled-over amount
      currentMygaValue = cyclePremium + rolloverAmount;
      totalMygaPremiumInvested += cyclePremium;

      // ─── New bank loan: 70% LTV of the TOTAL new MYGA value ───
      const loanAmount = currentMygaValue * bankLtv;
      bankLoans.push({
        cycleNumber,
        originalPrincipal: loanAmount,
        balance: loanAmount,
        startYear: year,
        source: "primary",
      });

      // ─── New O&G investment from loan proceeds ───
      const ogInvestment = loanAmount;
      const ogAnnualIncome = ogInvestment * oilGasRateDec;
      const trancheKey = `og_tranche_${cycleNumber}`;
      ogTranches.push({
        cycleNumber,
        trancheKey,
        investment: ogInvestment,
        startYear: year,
        endYear: year + oilGasTerm - 1,
        annualIncome: ogAnnualIncome,
        depreciationY1: ogInvestment * (oilGasDepreciationY1 / 100),
        depreciationOngoing: ogInvestment * (oilGasDepreciationOngoing / 100),
        source: "primary",
      });

      trancheInfo.push({
        trancheKey,
        cycleNumber,
        investment: ogInvestment,
        startYear: year,
        endYear: year + oilGasTerm - 1,
        annualIncome: ogAnnualIncome,
        color: TRANCHE_COLORS[(cycleNumber - 1) % TRANCHE_COLORS.length],
      });

      cycles.push({
        cycleNumber,
        startYear: year,
        endYear: Math.min(year + mygaTerm - 1, projectionYears),
        mygaPremium: cyclePremium,
        mygaRolloverIn: rolloverAmount,
        mygaCycleStartValue: currentMygaValue,
        mygaMaturityValue: 0,
        mygaInterestEarned: 0,
        bankLoanAmount: loanAmount,
        bankInterestPaid: 0,
        principalPaidFromMaturity: 0,
        redeployedToNextCycle: 0,
        oilGasInvestment: ogInvestment,
        oilGasIncomeTotal: 0,
        oilGasDepreciationTotal: 0,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // MYGA INTEREST
    // ═══════════════════════════════════════════════════════════════
    const mygaStartValue = currentMygaValue;
    const mygaInterest = currentMygaValue * mygaRateDec;
    currentMygaValue += mygaInterest;
    cumMygaInterest += mygaInterest;

    const currentCycle = cycles[cycles.length - 1];
    currentCycle.mygaInterestEarned += mygaInterest;
    if (cycleYear === mygaTerm) {
      currentCycle.mygaMaturityValue = currentMygaValue;
    }

    // ═══════════════════════════════════════════════════════════════
    // O&G INCOME (all active tranches — overlap compounds)
    // ═══════════════════════════════════════════════════════════════
    let yearOGIncome = 0;
    let yearOGDepreciation = 0;
    let yearOGInvestment = 0;
    let anyOGActive = false;
    let activeTrancheCount = 0;
    const ogTrancheIncome: Record<string, number> = {};
    let yearTaxSavingsOGIncome = 0;

    for (const og of ogTranches) {
      if (year >= og.startYear && year <= og.endYear) {
        yearOGIncome += og.annualIncome;
        anyOGActive = true;
        activeTrancheCount++;
        ogTrancheIncome[og.trancheKey] = og.annualIncome;

        if (og.source === "tax_savings") {
          yearTaxSavingsOGIncome += og.annualIncome;
        }

        const ogYear = year - og.startYear + 1;
        if (ogYear === 1) {
          yearOGDepreciation += og.depreciationY1;
        } else {
          yearOGDepreciation += og.depreciationOngoing;
        }

        const ogCycle = cycles.find(c => c.cycleNumber === og.cycleNumber);
        if (ogCycle) {
          ogCycle.oilGasIncomeTotal += og.annualIncome;
          ogCycle.oilGasDepreciationTotal += (ogYear === 1 ? og.depreciationY1 : og.depreciationOngoing);
        }
      }
      if (year >= og.startYear && year <= og.endYear) {
        yearOGInvestment += og.investment;
      }
    }
    cumOGIncome += yearOGIncome;
    cumDepreciation += yearOGDepreciation;
    cumTaxSavingsOGIncome += yearTaxSavingsOGIncome;

    // ═══════════════════════════════════════════════════════════════
    // TAX SAVINGS from O&G depreciation
    // ═══════════════════════════════════════════════════════════════
    const taxDeduction = yearOGDepreciation;
    // Tax savings = min(deduction, annual income) × combined rate
    const effectiveDeduction = annualIncome > 0 ? Math.min(taxDeduction, annualIncome) : 0;
    const taxSavings = effectiveDeduction * combinedTaxRate;
    cumTaxSavings += taxSavings;

    // ═══════════════════════════════════════════════════════════════
    // HELOC INTEREST
    // ═══════════════════════════════════════════════════════════════
    let yearHelocInterest = 0;
    let yearHelocPrincipal = 0;
    if (helocBalance > 0) {
      yearHelocInterest = helocBalance * helocRateDec;
      cumHelocInterest += yearHelocInterest;
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAN PAYMENTS — INTEREST ONLY from O&G income
    // ═══════════════════════════════════════════════════════════════
    let yearBankInterest = 0;
    let yearBankPrincipal = 0;
    let yearBankTotalPayment = 0;
    let yearExcessOGToPrincipal = 0;

    // Step 1: Calculate total interest due across all active loans
    for (const loan of bankLoans) {
      if (loan.balance > 0) {
        yearBankInterest += loan.balance * bankRateDec;
      }
    }

    // Step 2: O&G income pays bank interest + HELOC interest first
    let ogRemaining = yearOGIncome;
    const bankInterestPaid = Math.min(ogRemaining, yearBankInterest);
    ogRemaining -= bankInterestPaid;

    // O&G also pays HELOC interest
    const helocInterestFromOG = Math.min(ogRemaining, yearHelocInterest);
    ogRemaining -= helocInterestFromOG;

    // Step 3: Excess O&G income pays down loan principal (oldest first)
    if (ogRemaining > 0) {
      const activeLoans = bankLoans
        .filter(l => l.balance > 0)
        .sort((a, b) => a.cycleNumber - b.cycleNumber);

      for (const loan of activeLoans) {
        if (ogRemaining <= 0) break;
        const principalPayment = Math.min(ogRemaining, loan.balance);
        loan.balance -= principalPayment;
        yearBankPrincipal += principalPayment;
        ogRemaining -= principalPayment;
        yearExcessOGToPrincipal += principalPayment;
      }
    }

    // Step 4: Any remaining O&G excess goes to HELOC principal
    if (ogRemaining > 0 && helocBalance > 0) {
      const helocPrincipalFromOG = Math.min(ogRemaining, helocBalance);
      helocBalance -= helocPrincipalFromOG;
      yearHelocPrincipal += helocPrincipalFromOG;
      ogRemaining -= helocPrincipalFromOG;
    }

    yearBankTotalPayment = bankInterestPaid + yearBankPrincipal;
    cumBankInterest += yearBankInterest;
    cumExcessOGToPrincipal += yearExcessOGToPrincipal;

    // Update cycle interest tracking
    for (const loan of bankLoans) {
      if (loan.balance > 0) {
        const loanCycle = cycles.find(c => c.cycleNumber === loan.cycleNumber);
        if (loanCycle) {
          loanCycle.bankInterestPaid += loan.balance * bankRateDec;
        }
      }
    }

    // ─── Loan Wipeout Tracking ───
    const ogVsLoanDelta = yearOGIncome - yearBankInterest;
    const loanCoveredByOG = ogVsLoanDelta >= 0;

    if (yearBankInterest > 0) {
      cumOGTowardLoan += Math.min(yearOGIncome, yearBankInterest);
      cumOGPureProfit += Math.max(0, yearOGIncome - yearBankInterest);
    } else {
      cumOGPureProfit += yearOGIncome;
    }

    if (loanWipeoutYear === null && ogVsLoanDelta > 0 && yearBankInterest > 0) {
      loanWipeoutYear = year;
    }

    // ═══════════════════════════════════════════════════════════════
    // DEPLOY TAX SAVINGS
    // ═══════════════════════════════════════════════════════════════
    let taxDeploymentAction = "none";
    let taxDeploymentAmount = 0;
    let yearTaxSavingsMygaPurchased = 0;

    if (taxSavings > 0) {
      const deployOption = taxDeployment;
      // Track all tax savings as reinvested (deployed into the strategy)
      cumTaxSavingsReinvested += taxSavings;

      if (deployOption === "payback_heloc" && helocBalance > 0) {
        // Pay back HELOC principal
        const payment = Math.min(taxSavings, helocBalance);
        helocBalance -= payment;
        yearHelocPrincipal += payment;
        taxDeploymentAction = "HELOC Principal";
        taxDeploymentAmount = payment;
      } else if (deployOption === "pay_bank_interest") {
        // Reduce bank loan interest burden (effectively pre-pay interest)
        // This reduces the O&G income needed for interest, freeing more for profit
        taxDeploymentAction = "Bank Interest Offset";
        taxDeploymentAmount = taxSavings;
        // The savings effectively add to net cash flow
      } else if (deployOption === "buy_more_myga") {
        // Accumulate tax savings into a MYGA fund
        taxSavingsMygaAccumulator += taxSavings;
        taxDeploymentAction = "MYGA Accumulator";
        taxDeploymentAmount = taxSavings;

        // Every 5 years, deploy the accumulated tax savings into a new MYGA → loan → O&G
        if (cycleYear === mygaTerm || year === projectionYears) {
          if (taxSavingsMygaAccumulator >= 10000) { // minimum threshold
            taxSavingsMygaCycleCounter++;
            const tsMygaPremium = taxSavingsMygaAccumulator;
            yearTaxSavingsMygaPurchased = tsMygaPremium;
            cumTaxSavingsMygaPurchased += tsMygaPremium;

            // Create loan against tax-savings MYGA
            const tsLoanAmount = tsMygaPremium * bankLtv;
            bankLoans.push({
              cycleNumber: 100 + taxSavingsMygaCycleCounter,
              originalPrincipal: tsLoanAmount,
              balance: tsLoanAmount,
              startYear: year + 1,
              source: "tax_savings",
            });

            // Create O&G tranche from tax-savings loan
            const tsOGInvestment = tsLoanAmount;
            const tsOGAnnualIncome = tsOGInvestment * oilGasRateDec;
            const tsTrancheKey = `og_tax_${taxSavingsMygaCycleCounter}`;
            ogTranches.push({
              cycleNumber: 100 + taxSavingsMygaCycleCounter,
              trancheKey: tsTrancheKey,
              investment: tsOGInvestment,
              startYear: year + 1,
              endYear: year + oilGasTerm,
              annualIncome: tsOGAnnualIncome,
              depreciationY1: tsOGInvestment * (oilGasDepreciationY1 / 100),
              depreciationOngoing: tsOGInvestment * (oilGasDepreciationOngoing / 100),
              source: "tax_savings",
            });

            trancheInfo.push({
              trancheKey: tsTrancheKey,
              cycleNumber: 100 + taxSavingsMygaCycleCounter,
              investment: tsOGInvestment,
              startYear: year + 1,
              endYear: year + oilGasTerm,
              annualIncome: tsOGAnnualIncome,
              color: TRANCHE_COLORS[(trancheInfo.length) % TRANCHE_COLORS.length],
            });

            taxSavingsMygaAccumulator = 0;
          }
        }
      } else if (deployOption === "pay_bank_principal") {
        // Pay down bank loan principal directly
        let remaining = taxSavings;
        const activeLoans = bankLoans
          .filter(l => l.balance > 0)
          .sort((a, b) => a.cycleNumber - b.cycleNumber);

        for (const loan of activeLoans) {
          if (remaining <= 0) break;
          const payment = Math.min(remaining, loan.balance);
          loan.balance -= payment;
          yearBankPrincipal += payment;
          remaining -= payment;
        }
        taxDeploymentAction = "Bank Principal";
        taxDeploymentAmount = taxSavings - remaining;
      } else if (deployOption === "optimal_blend") {
        // Optimal: prioritize highest-cost debt first, then growth
        let remaining = taxSavings;

        // 1. Pay HELOC first (typically highest rate)
        if (helocBalance > 0 && remaining > 0) {
          const helocPayment = Math.min(remaining, helocBalance);
          helocBalance -= helocPayment;
          yearHelocPrincipal += helocPayment;
          remaining -= helocPayment;
        }

        // 2. Pay bank loan principal (reduces interest burden)
        if (remaining > 0) {
          const activeLoans = bankLoans
            .filter(l => l.balance > 0)
            .sort((a, b) => a.cycleNumber - b.cycleNumber);

          for (const loan of activeLoans) {
            if (remaining <= 0) break;
            const halfRemaining = remaining * 0.5; // Split: 50% to principal, 50% to growth
            const payment = Math.min(halfRemaining, loan.balance);
            loan.balance -= payment;
            yearBankPrincipal += payment;
            remaining -= payment;
          }
        }

        // 3. Remaining into MYGA accumulator for growth
        if (remaining > 0) {
          taxSavingsMygaAccumulator += remaining;
          // Deploy at cycle boundaries
          if (cycleYear === mygaTerm || year === projectionYears) {
            if (taxSavingsMygaAccumulator >= 10000) {
              taxSavingsMygaCycleCounter++;
              const tsMygaPremium = taxSavingsMygaAccumulator;
              yearTaxSavingsMygaPurchased = tsMygaPremium;
              cumTaxSavingsMygaPurchased += tsMygaPremium;

              const tsLoanAmount = tsMygaPremium * bankLtv;
              bankLoans.push({
                cycleNumber: 100 + taxSavingsMygaCycleCounter,
                originalPrincipal: tsLoanAmount,
                balance: tsLoanAmount,
                startYear: year + 1,
                source: "tax_savings",
              });

              const tsOGInvestment = tsLoanAmount;
              const tsOGAnnualIncome = tsOGInvestment * oilGasRateDec;
              const tsTrancheKey = `og_tax_${taxSavingsMygaCycleCounter}`;
              ogTranches.push({
                cycleNumber: 100 + taxSavingsMygaCycleCounter,
                trancheKey: tsTrancheKey,
                investment: tsOGInvestment,
                startYear: year + 1,
                endYear: year + oilGasTerm,
                annualIncome: tsOGAnnualIncome,
                depreciationY1: tsOGInvestment * (oilGasDepreciationY1 / 100),
                depreciationOngoing: tsOGInvestment * (oilGasDepreciationOngoing / 100),
                source: "tax_savings",
              });

              trancheInfo.push({
                trancheKey: tsTrancheKey,
                cycleNumber: 100 + taxSavingsMygaCycleCounter,
                investment: tsOGInvestment,
                startYear: year + 1,
                endYear: year + oilGasTerm,
                annualIncome: tsOGAnnualIncome,
                color: TRANCHE_COLORS[(trancheInfo.length) % TRANCHE_COLORS.length],
              });

              taxSavingsMygaAccumulator = 0;
            }
          }
        }

        taxDeploymentAction = "Optimal Blend";
        taxDeploymentAmount = taxSavings;
      }
    }

    // Track HELOC payoff
    if (helocPayoffYear === null && helocAmount > 0 && helocBalance <= 0) {
      helocPayoffYear = year;
      helocBalance = 0;
    }

    // Calculate total loan balance at end of year
    const yearBankEndBalance = bankLoans.reduce((s, l) => s + Math.max(0, l.balance), 0);
    const yearBankStartBalance = yearBankEndBalance + yearBankPrincipal;

    // ─── Net cash flow ───
    const netCashFlow = yearOGIncome - yearBankTotalPayment - yearHelocInterest + taxSavings;
    cumNetCashFlow += netCashFlow;

    // ═══════════════════════════════════════════════════════════════
    // BUILD ROW
    // ═══════════════════════════════════════════════════════════════
    projection.push({
      year,
      cycle: cycleNumber,
      cycleYear,
      mygaStartValue: Math.round(mygaStartValue),
      mygaInterestEarned: Math.round(mygaInterest),
      mygaEndValue: Math.round(currentMygaValue),
      mygaRolloverAmount: Math.round(mygaRolloverAmount),
      bankLoanBalance: Math.round(yearBankStartBalance),
      bankLoanInterestPaid: Math.round(yearBankInterest),
      bankLoanPrincipalPaid: Math.round(yearBankPrincipal),
      bankLoanEndBalance: Math.round(yearBankEndBalance),
      bankLoanTotalPayment: Math.round(yearBankTotalPayment),
      oilGasInvestment: Math.round(yearOGInvestment),
      oilGasIncome: Math.round(yearOGIncome),
      oilGasQuarterlyPayment: Math.round(yearOGIncome / 4),
      oilGasDepreciation: Math.round(yearOGDepreciation),
      oilGasCumulativeIncome: Math.round(cumOGIncome),
      oilGasActive: anyOGActive,
      ogTrancheIncome: Object.fromEntries(
        Object.entries(ogTrancheIncome).map(([k, v]) => [k, Math.round(v)])
      ),
      activeTrancheCount,
      ogVsLoanDelta: Math.round(ogVsLoanDelta),
      loanCoveredByOG,
      cumulativeOGTowardLoan: Math.round(cumOGTowardLoan),
      cumulativeOGPureProfit: Math.round(cumOGPureProfit),
      excessOGToPrincipal: Math.round(yearExcessOGToPrincipal),
      netCashFlow: Math.round(netCashFlow),
      cumulativeNetCashFlow: Math.round(cumNetCashFlow),
      totalMygaInterestEarned: Math.round(cumMygaInterest),
      totalBankInterestPaid: Math.round(cumBankInterest),
      totalOilGasIncome: Math.round(cumOGIncome),
      totalDepreciation: Math.round(cumDepreciation),
      totalNetBenefit: Math.round(cumMygaInterest + cumOGIncome - cumBankInterest - cumHelocInterest + cumTaxSavings),
      isMaturityYear,
      maturityPrincipalPayoff: Math.round(maturityPrincipalPayoff),
      maturityRedeployAmount: Math.round(maturityRedeployAmount),
      // v4 fields
      taxDeduction: Math.round(taxDeduction),
      taxSavings: Math.round(taxSavings),
      cumulativeTaxSavings: Math.round(cumTaxSavings),
      taxDeploymentAction,
      taxDeploymentAmount: Math.round(taxDeploymentAmount),
      helocBalance: Math.round(Math.max(0, helocBalance)),
      helocInterestPaid: Math.round(yearHelocInterest),
      helocPrincipalPaid: Math.round(yearHelocPrincipal),
      taxSavingsMygaPurchased: Math.round(yearTaxSavingsMygaPurchased),
      taxSavingsOGIncome: Math.round(yearTaxSavingsOGIncome),
      cumulativeTaxSavingsReinvested: Math.round(cumTaxSavingsReinvested),
    });
  }

  // ─── Summary ───
  const totalOGInvested = ogTranches.reduce((s, t) => s + t.investment, 0);
  const totalNetBenefit = cumMygaInterest + cumOGIncome - cumBankInterest - cumHelocInterest + cumTaxSavings;
  const effectiveReturn = totalMygaPremiumInvested > 0
    ? (Math.pow((currentMygaValue + cumOGIncome - cumBankInterest - cumHelocInterest + cumTaxSavings) / totalMygaPremiumInvested, 1 / projectionYears) - 1) * 100
    : 0;

  const summary: WaterfallSummary = {
    totalMygaPremiumInvested: Math.round(totalMygaPremiumInvested),
    totalMygaInterestEarned: Math.round(cumMygaInterest),
    totalBankInterestPaid: Math.round(cumBankInterest),
    totalOilGasInvested: Math.round(totalOGInvested),
    totalOilGasIncomeReceived: Math.round(cumOGIncome),
    totalDepreciationCredits: Math.round(cumDepreciation),
    totalNetBenefit: Math.round(totalNetBenefit),
    finalMygaValue: Math.round(currentMygaValue),
    numberOfCycles,
    effectiveAnnualReturn: Math.round(effectiveReturn * 100) / 100,
    loanWipeoutYear,
    totalOGTowardLoan: Math.round(cumOGTowardLoan),
    totalOGPureProfit: Math.round(cumOGPureProfit),
    totalExcessOGToPrincipal: Math.round(cumExcessOGToPrincipal),
    // v4
    totalTaxSavings: Math.round(cumTaxSavings),
    totalHelocInterestPaid: Math.round(cumHelocInterest),
    helocPayoffYear,
    totalTaxSavingsMygaPurchased: Math.round(cumTaxSavingsMygaPurchased),
    totalTaxSavingsOGIncome: Math.round(cumTaxSavingsOGIncome),
    helocAmount: Math.round(helocAmount),
    homeEquity: Math.round(homeEquity),
    totalTaxSavingsReinvested: Math.round(cumTaxSavingsReinvested),
  };

  return { input, projection, summary, cycles, trancheInfo };
}

/* ─── SCENARIO COMPARISON ─── */

const DEPLOYMENT_LABELS: Record<TaxDeploymentOption, string> = {
  payback_heloc: "Pay Back HELOC Principal",
  pay_bank_interest: "Offset Bank Loan Interest",
  buy_more_myga: "Buy More MYGA → O&G",
  pay_bank_principal: "Pay Down Bank Principal",
  optimal_blend: "Optimal Blend (Auto)",
};

export function runScenarioComparison(baseInput: MYGAWaterfallInput): ScenarioComparison {
  const options: TaxDeploymentOption[] = [
    "payback_heloc",
    "pay_bank_interest",
    "buy_more_myga",
    "pay_bank_principal",
    "optimal_blend",
  ];

  const scenarios: ScenarioResult[] = options.map(option => {
    const result = runMYGAWaterfall({ ...baseInput, taxDeployment: option });
    // totalValue includes reinvested tax savings impact on net benefit
    const totalValue = result.summary.totalNetBenefit + result.summary.totalTaxSavingsReinvested;

    return {
      option,
      label: DEPLOYMENT_LABELS[option],
      summary: result.summary,
      totalValue,
      yearlyNetBenefit: result.projection.map(r => r.totalNetBenefit),
      yearlyTaxReinvested: result.projection.map(r => r.cumulativeTaxSavingsReinvested),
    };
  });

  // Find optimal
  const sorted = [...scenarios].sort((a, b) => b.totalValue - a.totalValue);
  const optimal = sorted[0];

  return {
    scenarios: sorted,
    optimal: optimal.option,
    optimalLabel: optimal.label,
  };
}
