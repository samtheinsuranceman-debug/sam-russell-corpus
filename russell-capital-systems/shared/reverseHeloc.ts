/**
 * Reverse-Engineered HELOC → IUL → MYGA → O&G Strategy Engine
 * ═══════════════════════════════════════════════════════════════
 *
 * STRATEGY FLOW:
 * 1) HELOC at 70% LTV on home equity → pays IUL premiums Year 1 & Year 2
 * 2) Month 13: Take 90% IUL policy loan at 5.5% → invest in 6.25%/yr MYGA (5-year)
 * 3) 70% of MYGA value → bank loan → invest in 10-12yr O&G at 15% withdrawals
 * 4) O&G income pays BOTH: HELOC interest + bank loan interest (interest-only)
 * 5) MYGA maturity → pay bank loan principal → redeploy → new O&G tranche
 * 6) Overlapping O&G tranches compound; excess pays down HELOC + loan balances
 *
 * TAX SAVINGS RECYCLING:
 * 7) O&G depreciation creates tax deductions against annual income
 * 8) Federal + state tax savings applied to IUL cash value each year
 * 9) Borrow 80% of tax-savings-boosted IUL → fund new 5-year MYGA
 * 10) New MYGA → 70% bank loan → new O&G tranche → more overlapping income
 */

/* ─── INPUT ─── */
export interface ReverseHelocInput {
  /** Home value for HELOC calculation */
  homeValue: number;
  /** HELOC LTV ratio (default 0.70 = 70%) */
  helocLtv: number;
  /** HELOC annual interest rate (e.g. 8.5 = 8.5%) */
  helocRate: number;
  /** Annual IUL premium (paid from HELOC, years 1 & 2) */
  iulPremium: number;
  /** IUL policy loan percentage at month 13 (default 0.90 = 90%) */
  iulLoanPct: number;
  /** IUL policy loan interest rate (default 5.5%) */
  iulLoanRate: number;
  /** IUL assumed annual growth rate for cash value (default 12%) */
  iulGrowthRate: number;
  /** MYGA annual rate (default 6.25%) */
  mygaRate: number;
  /** MYGA term in years (default 5) */
  mygaTerm: number;
  /** Bank loan LTV on MYGA (default 0.70 = 70%) */
  bankLtv: number;
  /** Bank loan annual interest rate (default 7%) */
  bankLoanRate: number;
  /** O&G investment term in years (default 12) */
  oilGasTerm: number;
  /** O&G annual return/withdrawal rate (default 15%) */
  oilGasReturnRate: number;
  /** O&G depreciation year 1 (default 80%) */
  oilGasDepreciationY1: number;
  /** O&G depreciation ongoing (default 8%) */
  oilGasDepreciationOngoing: number;
  /** Total projection years (default 25) */
  projectionYears: number;

  // ─── Tax Savings Recycling ───
  /** Annual gross income for tax calculation */
  annualIncome: number;
  /** Federal marginal tax rate (e.g. 37 = 37%) */
  federalTaxRate: number;
  /** State income tax rate (e.g. 5.75 = 5.75%) */
  stateTaxRate: number;
  /** IUL loan percentage on tax-savings-boosted IUL (default 0.80 = 80%) */
  taxSavingsIulLoanPct: number;
}

/* ─── OUTPUT TYPES ─── */

export interface ReverseHelocYearRow {
  year: number;

  // HELOC layer
  helocBalance: number;
  helocInterestPaid: number;
  helocPrincipalPaid: number;
  helocEndBalance: number;
  helocDrawn: number;

  // IUL layer
  iulCashValue: number;
  iulPremiumPaid: number;
  iulLoanBalance: number;
  iulLoanInterest: number;
  iulNetCashValue: number;

  // MYGA layer
  mygaStartValue: number;
  mygaInterest: number;
  mygaEndValue: number;
  mygaRolloverAmount: number;
  isMaturityYear: boolean;
  maturityPrincipalPayoff: number;
  maturityRedeployAmount: number;

  // Bank loan layer (on MYGA)
  bankLoanBalance: number;
  bankLoanInterestPaid: number;
  bankLoanPrincipalPaid: number;
  bankLoanEndBalance: number;

  // O&G layer
  ogIncome: number;
  ogTrancheIncome: Record<string, number>;
  activeTrancheCount: number;
  ogDepreciation: number;
  ogCumulativeIncome: number;

  // Tax savings layer
  taxSavingsFederal: number;
  taxSavingsState: number;
  taxSavingsTotal: number;
  taxSavingsAppliedToIul: number;
  taxSavingsIulLoanTaken: number;
  taxSavingsMygaFunded: number;
  cumTaxSavings: number;

  // Cash flow allocation
  ogUsedForHelocInterest: number;
  ogUsedForBankInterest: number;
  ogExcessToPrincipal: number;
  ogPureProfit: number;
  totalInterestDue: number;
  totalOGAvailable: number;
  netCashFlow: number;
  cumulativeNetCashFlow: number;

  // Loan wipeout tracking
  allInterestCovered: boolean;
  loanBalanceTotal: number;
  helocPaidOff: boolean;

  // Cumulative totals
  cumOGIncome: number;
  cumHelocInterest: number;
  cumBankInterest: number;
  cumIulLoanInterest: number;
  cumAllInterest: number;
  cumNetBenefit: number;
}

export interface ReverseHelocSummary {
  helocAmount: number;
  totalIulPremiums: number;
  iulLoanAmount: number;
  mygaInitialInvestment: number;
  totalOGInvested: number;
  totalOGIncome: number;
  totalHelocInterestPaid: number;
  totalBankInterestPaid: number;
  totalIulLoanInterestPaid: number;
  totalAllInterestPaid: number;
  totalDepreciation: number;
  totalTaxSavings: number;
  totalTaxSavingsAppliedToIul: number;
  totalTaxSavingsMygasFunded: number;
  finalMygaValue: number;
  finalIulCashValue: number;
  finalHelocBalance: number;
  finalBankLoanBalance: number;
  loanWipeoutYear: number | null;
  helocPaidOffYear: number | null;
  totalNetBenefit: number;
  numberOfCycles: number;
  totalExcessToPrincipal: number;
}

export interface ReverseHelocTrancheInfo {
  trancheKey: string;
  cycleNumber: number;
  investment: number;
  startYear: number;
  endYear: number;
  annualIncome: number;
  color: string;
  source: "myga" | "tax-savings"; // whether from MYGA cycle or tax savings recycling
}

export interface ReverseHelocResult {
  input: ReverseHelocInput;
  projection: ReverseHelocYearRow[];
  summary: ReverseHelocSummary;
  tranches: ReverseHelocTrancheInfo[];
}

/* ─── ENGINE ─── */

const TRANCHE_COLORS = [
  "#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#6366f1", "#84cc16", "#e11d48", "#0ea5e9",
];

const TAX_TRANCHE_COLORS = [
  "#22c55e", "#10b981", "#059669", "#047857", "#065f46",
];

export function getDefaultReverseHelocInput(): ReverseHelocInput {
  return {
    homeValue: 500000,
    helocLtv: 0.70,
    helocRate: 8.5,
    iulPremium: 50000,
    iulLoanPct: 0.90,
    iulLoanRate: 5.5,
    iulGrowthRate: 12,
    mygaRate: 6.25,
    mygaTerm: 5,
    bankLtv: 0.70,
    bankLoanRate: 7,
    oilGasTerm: 12,
    oilGasReturnRate: 15,
    oilGasDepreciationY1: 80,
    oilGasDepreciationOngoing: 8,
    projectionYears: 25,
    // Tax savings recycling defaults
    annualIncome: 250000,
    federalTaxRate: 37,
    stateTaxRate: 5.75,
    taxSavingsIulLoanPct: 0.80,
  };
}

export function runReverseHeloc(input: ReverseHelocInput): ReverseHelocResult {
  const {
    homeValue, helocLtv, helocRate, iulPremium, iulLoanPct, iulLoanRate,
    iulGrowthRate, mygaRate, mygaTerm, bankLtv, bankLoanRate,
    oilGasTerm, oilGasReturnRate, oilGasDepreciationY1, oilGasDepreciationOngoing,
    projectionYears, annualIncome, federalTaxRate, stateTaxRate, taxSavingsIulLoanPct,
  } = input;

  const helocRateDec = helocRate / 100;
  const iulLoanRateDec = iulLoanRate / 100;
  const iulGrowthDec = iulGrowthRate / 100;
  const mygaRateDec = mygaRate / 100;
  const bankRateDec = bankLoanRate / 100;
  const ogRateDec = oilGasReturnRate / 100;
  const fedRateDec = federalTaxRate / 100;
  const stateRateDec = stateTaxRate / 100;

  const projection: ReverseHelocYearRow[] = [];
  const tranches: ReverseHelocTrancheInfo[] = [];

  // ─── HELOC: 70% LTV on home → pays IUL premiums ───
  let helocBalance = 0;

  // ─── IUL state ───
  let iulCashValue = 0;
  let iulLoanBalance = 0;
  let iulLoanTaken = false;
  let taxSavingsAccumulatedInIul = 0; // tax savings deposited into IUL
  let taxSavingsIulLoanTakenTotal = 0;

  // ─── MYGA state (primary cycle from IUL loan) ───
  let mygaValue = 0;
  let mygaActive = false;
  let mygaCycleStartYear = 0;

  // ─── Tax-savings MYGAs (separate from primary) ───
  interface TaxMYGA {
    value: number;
    startYear: number;
    cycleNumber: number;
  }
  const taxMYGAs: TaxMYGA[] = [];

  // ─── Bank loans (interest-only, principal at maturity) ───
  interface BankLoan {
    cycleNumber: number;
    balance: number;
    originalPrincipal: number;
    source: "myga" | "tax-savings";
  }
  const bankLoans: BankLoan[] = [];

  // ─── O&G tranches ───
  interface OGTranche {
    cycleNumber: number;
    trancheKey: string;
    investment: number;
    startYear: number;
    endYear: number;
    annualIncome: number;
    source: "myga" | "tax-savings";
  }
  const ogTranches: OGTranche[] = [];

  // Cumulative trackers
  let cumOGIncome = 0;
  let cumHelocInterest = 0;
  let cumBankInterest = 0;
  let cumIulLoanInterest = 0;
  let cumNetCashFlow = 0;
  let cumExcessToPrincipal = 0;
  let cumTaxSavings = 0;
  let cumTaxSavingsApplied = 0;
  let cumTaxSavingsMygasFunded = 0;
  let loanWipeoutYear: number | null = null;
  let helocPaidOffYear: number | null = null;
  let cycleCount = 0;
  let taxCycleCount = 0;
  let totalOGInvested = 0;

  /** Helper: create a new O&G tranche from a bank loan */
  function createOGTranche(
    bankLoanAmount: number,
    year: number,
    cycle: number,
    source: "myga" | "tax-savings"
  ) {
    totalOGInvested += bankLoanAmount;
    const prefix = source === "tax-savings" ? "tax_og" : "og_tranche";
    const trancheKey = `${prefix}_${cycle}`;
    const annualIncome = bankLoanAmount * ogRateDec;

    ogTranches.push({
      cycleNumber: cycle,
      trancheKey,
      investment: bankLoanAmount,
      startYear: year,
      endYear: year + oilGasTerm - 1,
      annualIncome,
      source,
    });

    const colorArr = source === "tax-savings" ? TAX_TRANCHE_COLORS : TRANCHE_COLORS;
    const idx = source === "tax-savings" ? (cycle - 1) % colorArr.length : (cycle - 1) % colorArr.length;
    tranches.push({
      trancheKey,
      cycleNumber: cycle,
      investment: bankLoanAmount,
      startYear: year,
      endYear: year + oilGasTerm - 1,
      annualIncome,
      color: colorArr[idx],
      source,
    });
  }

  for (let year = 1; year <= projectionYears; year++) {
    let helocDrawn = 0;
    let iulPremiumPaid = 0;
    let mygaRolloverAmount = 0;
    let isMaturityYear = false;
    let maturityPrincipalPayoff = 0;
    let maturityRedeployAmount = 0;

    // ═══════════════════════════════════════════════════════════
    // LAYER 1: HELOC — Draw for IUL premiums (Year 1 & 2)
    // ═══════════════════════════════════════════════════════════
    if (year <= 2) {
      helocDrawn = iulPremium;
      helocBalance += helocDrawn;
      iulPremiumPaid = iulPremium;
    }

    // HELOC interest accrues every year on outstanding balance
    const helocInterest = helocBalance > 0 ? helocBalance * helocRateDec : 0;
    cumHelocInterest += helocInterest;

    // ═══════════════════════════════════════════════════════════
    // LAYER 2: IUL — Cash value grows, policy loan at month 13
    // ═══════════════════════════════════════════════════════════
    if (year <= 2) {
      const cvRatio = year === 1 ? 0.65 : 0.85;
      iulCashValue += iulPremium * cvRatio;
    }

    // Tax savings get deposited into IUL (from previous year's depreciation)
    // This happens at start of year (applied from prior year tax filing)
    // We'll calculate and apply below after O&G income is computed

    // IUL cash value grows at assumed rate
    iulCashValue *= (1 + iulGrowthDec);

    // Month 13 = start of Year 2: take 90% IUL policy loan
    let iulLoanInterest = 0;
    if (year === 2 && !iulLoanTaken) {
      iulLoanBalance = iulCashValue * iulLoanPct;
      iulLoanTaken = true;

      // ═══════════════════════════════════════════════════════
      // LAYER 3: MYGA — IUL loan proceeds → 6.25% MYGA
      // ═══════════════════════════════════════════════════════
      mygaValue = iulLoanBalance;
      mygaActive = true;
      mygaCycleStartYear = year;
      cycleCount = 1;

      // ═══════════════════════════════════════════════════════
      // LAYER 4: Bank loan (70% of MYGA) → O&G
      // ═══════════════════════════════════════════════════════
      const bankLoanAmount = mygaValue * bankLtv;
      bankLoans.push({
        cycleNumber: cycleCount,
        balance: bankLoanAmount,
        originalPrincipal: bankLoanAmount,
        source: "myga",
      });
      createOGTranche(bankLoanAmount, year, cycleCount, "myga");
    }

    // IUL loan interest accrues
    if (iulLoanBalance > 0) {
      iulLoanInterest = iulLoanBalance * iulLoanRateDec;
      cumIulLoanInterest += iulLoanInterest;
    }

    // ═══════════════════════════════════════════════════════════
    // MYGA GROWTH + MATURITY ROLLOVER (primary cycle)
    // ═══════════════════════════════════════════════════════════
    let mygaStartValue = mygaValue;
    let mygaInterest = 0;

    if (mygaActive && mygaValue > 0) {
      const yearsInCycle = year - mygaCycleStartYear;

      if (yearsInCycle > 0 && yearsInCycle % mygaTerm === 0) {
        // MYGA MATURED — pay off bank loan principal, redeploy remainder
        isMaturityYear = true;
        const currentCycleLoan = bankLoans.find(
          l => l.cycleNumber === cycleCount && l.balance > 0 && l.source === "myga"
        );

        if (currentCycleLoan) {
          maturityPrincipalPayoff = Math.min(mygaValue, currentCycleLoan.balance);
          currentCycleLoan.balance -= maturityPrincipalPayoff;
        }

        const redeployAmount = mygaValue - maturityPrincipalPayoff;
        maturityRedeployAmount = redeployAmount;
        mygaRolloverAmount = redeployAmount;

        // Start new MYGA cycle
        mygaValue = redeployAmount;
        mygaStartValue = mygaValue;
        mygaCycleStartYear = year;
        cycleCount++;

        // New bank loan on redeployed MYGA
        if (mygaValue > 0) {
          const newBankLoan = mygaValue * bankLtv;
          bankLoans.push({
            cycleNumber: cycleCount,
            balance: newBankLoan,
            originalPrincipal: newBankLoan,
            source: "myga",
          });
          createOGTranche(newBankLoan, year, cycleCount, "myga");
        }
      }

      // MYGA interest compounds
      mygaInterest = mygaValue * mygaRateDec;
      mygaValue += mygaInterest;
    }

    // ═══════════════════════════════════════════════════════════
    // TAX-SAVINGS MYGAs — maturity check + rollover
    // ═══════════════════════════════════════════════════════════
    let taxMygaFundedThisYear = 0;
    for (let i = taxMYGAs.length - 1; i >= 0; i--) {
      const tm = taxMYGAs[i];
      const yearsInCycle = year - tm.startYear;

      if (yearsInCycle > 0 && yearsInCycle % mygaTerm === 0 && tm.value > 0) {
        // Tax MYGA matured — pay off its bank loan, redeploy
        const taxLoan = bankLoans.find(
          l => l.cycleNumber === tm.cycleNumber && l.balance > 0 && l.source === "tax-savings"
        );
        if (taxLoan) {
          const payoff = Math.min(tm.value, taxLoan.balance);
          taxLoan.balance -= payoff;
          maturityPrincipalPayoff += payoff;
          const redeploy = tm.value - payoff;
          if (redeploy > 0) {
            taxCycleCount++;
            tm.value = redeploy;
            tm.startYear = year;
            tm.cycleNumber = 1000 + taxCycleCount;
            const newLoan = redeploy * bankLtv;
            bankLoans.push({
              cycleNumber: tm.cycleNumber,
              balance: newLoan,
              originalPrincipal: newLoan,
              source: "tax-savings",
            });
            createOGTranche(newLoan, year, taxCycleCount, "tax-savings");
          }
        }
      } else if (tm.value > 0) {
        // Tax MYGA grows
        tm.value *= (1 + mygaRateDec);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // O&G INCOME — All active tranches (overlapping = compounding)
    // ═══════════════════════════════════════════════════════════
    let yearOGIncome = 0;
    let yearOGDepreciation = 0;
    let activeTrancheCount = 0;
    const ogTrancheIncome: Record<string, number> = {};

    for (const og of ogTranches) {
      if (year >= og.startYear && year <= og.endYear) {
        yearOGIncome += og.annualIncome;
        activeTrancheCount++;
        ogTrancheIncome[og.trancheKey] = Math.round(og.annualIncome);

        const ogYear = year - og.startYear + 1;
        if (ogYear === 1) {
          yearOGDepreciation += og.investment * (oilGasDepreciationY1 / 100);
        } else {
          yearOGDepreciation += og.investment * (oilGasDepreciationOngoing / 100);
        }
      }
    }
    cumOGIncome += yearOGIncome;

    // ═══════════════════════════════════════════════════════════
    // TAX SAVINGS — O&G depreciation creates deductions
    // ═══════════════════════════════════════════════════════════
    const taxableIncomeReduction = Math.min(yearOGDepreciation, annualIncome);
    const taxSavingsFederal = taxableIncomeReduction * fedRateDec;
    const taxSavingsState = taxableIncomeReduction * stateRateDec;
    const taxSavingsTotal = taxSavingsFederal + taxSavingsState;
    cumTaxSavings += taxSavingsTotal;

    // Apply tax savings to IUL cash value
    let taxSavingsAppliedToIul = 0;
    let taxSavingsIulLoanThisYear = 0;
    if (taxSavingsTotal > 0 && year >= 3) {
      // Tax savings deposited into IUL
      taxSavingsAppliedToIul = taxSavingsTotal;
      iulCashValue += taxSavingsAppliedToIul;
      taxSavingsAccumulatedInIul += taxSavingsAppliedToIul;
      cumTaxSavingsApplied += taxSavingsAppliedToIul;

      // Every year with sufficient accumulated tax savings, borrow 80% → new MYGA → O&G
      // Minimum threshold: $10,000 accumulated before triggering a new cycle
      if (taxSavingsAccumulatedInIul >= 10000) {
        taxSavingsIulLoanThisYear = taxSavingsAccumulatedInIul * taxSavingsIulLoanPct;
        iulLoanBalance += taxSavingsIulLoanThisYear;
        taxSavingsIulLoanTakenTotal += taxSavingsIulLoanThisYear;

        // Fund a new tax-savings MYGA
        taxCycleCount++;
        const taxMygaValue = taxSavingsIulLoanThisYear;
        taxMygaFundedThisYear = taxMygaValue;
        cumTaxSavingsMygasFunded += taxMygaValue;

        taxMYGAs.push({
          value: taxMygaValue,
          startYear: year,
          cycleNumber: 1000 + taxCycleCount,
        });

        // 70% bank loan on tax MYGA → O&G
        const taxBankLoan = taxMygaValue * bankLtv;
        bankLoans.push({
          cycleNumber: 1000 + taxCycleCount,
          balance: taxBankLoan,
          originalPrincipal: taxBankLoan,
          source: "tax-savings",
        });
        createOGTranche(taxBankLoan, year, taxCycleCount, "tax-savings");

        taxSavingsAccumulatedInIul = 0; // reset accumulator
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CASH FLOW ALLOCATION — O&G pays HELOC interest + bank interest
    // Interest-only every year. Excess → principal paydown (HELOC first)
    // ═══════════════════════════════════════════════════════════
    let bankInterest = 0;
    for (const loan of bankLoans) {
      if (loan.balance > 0) {
        bankInterest += loan.balance * bankRateDec;
      }
    }
    cumBankInterest += bankInterest;

    const totalInterestDue = helocInterest + bankInterest + iulLoanInterest;
    let ogRemaining = yearOGIncome;

    // Pay HELOC interest first
    const ogForHeloc = Math.min(ogRemaining, helocInterest);
    ogRemaining -= ogForHeloc;

    // Pay bank loan interest
    const ogForBank = Math.min(ogRemaining, bankInterest);
    ogRemaining -= ogForBank;

    // Pay IUL loan interest (or it capitalizes)
    const ogForIulLoan = Math.min(ogRemaining, iulLoanInterest);
    ogRemaining -= ogForIulLoan;

    // Excess → pay down principal (HELOC first, then bank loans oldest first)
    let excessToPrincipal = 0;
    let helocPrincipalPaid = 0;
    let bankPrincipalPaid = 0;

    if (ogRemaining > 0) {
      // Pay down HELOC principal with excess O&G income
      const helocPaydown = Math.min(ogRemaining, helocBalance);
      helocBalance -= helocPaydown;
      helocPrincipalPaid = helocPaydown;
      ogRemaining -= helocPaydown;
      excessToPrincipal += helocPaydown;
    }

    if (ogRemaining > 0) {
      // Pay down bank loans (oldest first)
      const activeLoans = bankLoans
        .filter(l => l.balance > 0)
        .sort((a, b) => a.cycleNumber - b.cycleNumber);
      for (const loan of activeLoans) {
        if (ogRemaining <= 0) break;
        const paydown = Math.min(ogRemaining, loan.balance);
        loan.balance -= paydown;
        bankPrincipalPaid += paydown;
        ogRemaining -= paydown;
        excessToPrincipal += paydown;
      }
    }

    cumExcessToPrincipal += excessToPrincipal;
    const ogPureProfit = ogRemaining;

    const bankLoanEndBalance = bankLoans.reduce((s, l) => s + l.balance, 0);
    const helocEndBalance = helocBalance;
    const totalLoanBalance = helocEndBalance + bankLoanEndBalance + iulLoanBalance;
    const allInterestCovered = yearOGIncome >= totalInterestDue && totalInterestDue > 0;
    const helocPaidOff = helocBalance <= 0 && year > 2;

    if (loanWipeoutYear === null && allInterestCovered && year > 2) {
      loanWipeoutYear = year;
    }
    if (helocPaidOffYear === null && helocPaidOff) {
      helocPaidOffYear = year;
    }

    const netCashFlow = yearOGIncome - totalInterestDue;
    cumNetCashFlow += netCashFlow;

    const cumAllInterest = cumHelocInterest + cumBankInterest + cumIulLoanInterest;
    const cumNetBenefit = cumOGIncome - cumAllInterest;

    // ═══════════════════════════════════════════════════════════
    // BUILD ROW
    // ═══════════════════════════════════════════════════════════
    projection.push({
      year,
      helocBalance: Math.round(helocBalance + helocPrincipalPaid),
      helocInterestPaid: Math.round(helocInterest),
      helocPrincipalPaid: Math.round(helocPrincipalPaid),
      helocEndBalance: Math.round(helocEndBalance),
      helocDrawn: Math.round(helocDrawn),
      iulCashValue: Math.round(iulCashValue),
      iulPremiumPaid: Math.round(iulPremiumPaid),
      iulLoanBalance: Math.round(iulLoanBalance),
      iulLoanInterest: Math.round(iulLoanInterest),
      iulNetCashValue: Math.round(iulCashValue - iulLoanBalance),
      mygaStartValue: Math.round(mygaStartValue),
      mygaInterest: Math.round(mygaInterest),
      mygaEndValue: Math.round(mygaValue),
      mygaRolloverAmount: Math.round(mygaRolloverAmount),
      isMaturityYear,
      maturityPrincipalPayoff: Math.round(maturityPrincipalPayoff),
      maturityRedeployAmount: Math.round(maturityRedeployAmount),
      bankLoanBalance: Math.round(bankLoanEndBalance + bankPrincipalPaid),
      bankLoanInterestPaid: Math.round(bankInterest),
      bankLoanPrincipalPaid: Math.round(bankPrincipalPaid),
      bankLoanEndBalance: Math.round(bankLoanEndBalance),
      ogIncome: Math.round(yearOGIncome),
      ogTrancheIncome,
      activeTrancheCount,
      ogDepreciation: Math.round(yearOGDepreciation),
      ogCumulativeIncome: Math.round(cumOGIncome),
      // Tax savings
      taxSavingsFederal: Math.round(taxSavingsFederal),
      taxSavingsState: Math.round(taxSavingsState),
      taxSavingsTotal: Math.round(taxSavingsTotal),
      taxSavingsAppliedToIul: Math.round(taxSavingsAppliedToIul),
      taxSavingsIulLoanTaken: Math.round(taxSavingsIulLoanThisYear),
      taxSavingsMygaFunded: Math.round(taxMygaFundedThisYear),
      cumTaxSavings: Math.round(cumTaxSavings),
      // Cash flow
      ogUsedForHelocInterest: Math.round(ogForHeloc),
      ogUsedForBankInterest: Math.round(ogForBank),
      ogExcessToPrincipal: Math.round(excessToPrincipal),
      ogPureProfit: Math.round(ogPureProfit),
      totalInterestDue: Math.round(totalInterestDue),
      totalOGAvailable: Math.round(yearOGIncome),
      netCashFlow: Math.round(netCashFlow),
      cumulativeNetCashFlow: Math.round(cumNetCashFlow),
      allInterestCovered,
      loanBalanceTotal: Math.round(totalLoanBalance),
      helocPaidOff,
      cumOGIncome: Math.round(cumOGIncome),
      cumHelocInterest: Math.round(cumHelocInterest),
      cumBankInterest: Math.round(cumBankInterest),
      cumIulLoanInterest: Math.round(cumIulLoanInterest),
      cumAllInterest: Math.round(cumAllInterest),
      cumNetBenefit: Math.round(cumNetBenefit),
    });
  }

  // ─── Summary ───
  const summary: ReverseHelocSummary = {
    helocAmount: Math.round(iulPremium * 2),
    totalIulPremiums: Math.round(iulPremium * 2),
    iulLoanAmount: Math.round(iulCashValue * iulLoanPct),
    mygaInitialInvestment: Math.round(iulCashValue * iulLoanPct),
    totalOGInvested: Math.round(totalOGInvested),
    totalOGIncome: Math.round(cumOGIncome),
    totalHelocInterestPaid: Math.round(cumHelocInterest),
    totalBankInterestPaid: Math.round(cumBankInterest),
    totalIulLoanInterestPaid: Math.round(cumIulLoanInterest),
    totalAllInterestPaid: Math.round(cumHelocInterest + cumBankInterest + cumIulLoanInterest),
    totalDepreciation: Math.round(projection.reduce((s, r) => s + r.ogDepreciation, 0)),
    totalTaxSavings: Math.round(cumTaxSavings),
    totalTaxSavingsAppliedToIul: Math.round(cumTaxSavingsApplied),
    totalTaxSavingsMygasFunded: Math.round(cumTaxSavingsMygasFunded),
    finalMygaValue: Math.round(mygaValue),
    finalIulCashValue: Math.round(iulCashValue),
    finalHelocBalance: Math.round(helocBalance),
    finalBankLoanBalance: Math.round(bankLoans.reduce((s, l) => s + l.balance, 0)),
    loanWipeoutYear,
    helocPaidOffYear,
    totalNetBenefit: Math.round(cumOGIncome - cumHelocInterest - cumBankInterest - cumIulLoanInterest),
    numberOfCycles: cycleCount + taxCycleCount,
    totalExcessToPrincipal: Math.round(cumExcessToPrincipal),
  };

  return { input, projection, summary, tranches };
}
