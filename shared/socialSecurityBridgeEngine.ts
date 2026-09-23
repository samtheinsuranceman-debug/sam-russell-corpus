/**
 * SISTER INVENTION SI-009: Social Security + IUL Bridge Strategy
 * Patent Reference: Extends PAT-001 (Monte Carlo IUL Engine)
 * 
 * Optimizes Social Security claiming age with IUL policy loans
 * as bridge income to maximize lifetime benefits.
 */

export interface SSBridgeInput {
  currentAge: number;
  gender: "male" | "female";
  ssaBenefitAt62: number;
  ssaBenefitAt67: number;
  ssaBenefitAt70: number;
  iulCashValue: number;
  iulLoanRate: number;
  iulCreditRate: number;
  otherRetirementIncome: number;
  monthlyExpenses: number;
  taxBracket: number;
  inflationRate: number;
  lifeExpectancy: number;
}

export interface ClaimingStrategy {
  claimAge: number;
  monthlyBenefit: number;
  bridgeNeeded: boolean;
  bridgeAmount: number;
  bridgeYears: number;
  iulLoanTotal: number;
  lifetimeBenefits: number;
  lifetimeNetIncome: number;
  breakEvenAge: number;
  taxEfficiency: number;   // 0-100
}

export interface SSBridgeYear {
  year: number;
  age: number;
  ssIncome: number;
  iulLoanIncome: number;
  otherIncome: number;
  totalIncome: number;
  taxes: number;
  netIncome: number;
  iulCashValue: number;
  iulLoanBalance: number;
  cumulativeNetIncome: number;
}

export interface SSBridgeResult {
  strategies: ClaimingStrategy[];
  optimalClaimAge: number;
  optimalLifetimeBenefit: number;
  yearlyProjections: Record<number, SSBridgeYear[]>;
  lifetimeAdvantage: number;
  recommendation: string;
  keyInsights: string[];
}

/**
 * Calculate Social Security bridge strategy
 */
export function calculateSSBridge(input: SSBridgeInput): SSBridgeResult {
  const claimAges = [62, 63, 64, 65, 66, 67, 68, 69, 70];
  const strategies: ClaimingStrategy[] = [];
  const yearlyProjections: Record<number, SSBridgeYear[]> = {};

  claimAges.forEach(claimAge => {
    // Interpolate benefit based on claim age
    let monthlyBenefit: number;
    if (claimAge <= 62) {
      monthlyBenefit = input.ssaBenefitAt62;
    } else if (claimAge <= 67) {
      const pct = (claimAge - 62) / 5;
      monthlyBenefit = input.ssaBenefitAt62 + (input.ssaBenefitAt67 - input.ssaBenefitAt62) * pct;
    } else {
      const pct = (claimAge - 67) / 3;
      monthlyBenefit = input.ssaBenefitAt67 + (input.ssaBenefitAt70 - input.ssaBenefitAt67) * pct;
    }

    const bridgeYears = Math.max(0, claimAge - 62);
    const bridgeNeeded = bridgeYears > 0;
    const annualExpenseGap = Math.max(0, input.monthlyExpenses * 12 - input.otherRetirementIncome);
    const bridgeAmount = annualExpenseGap * bridgeYears;

    // Year-by-year projection
    const years: SSBridgeYear[] = [];
    let iulCV = input.iulCashValue;
    let iulLoanBal = 0;
    let cumulativeNet = 0;
    let lifetimeBenefits = 0;

    for (let age = 62; age <= input.lifeExpectancy; age++) {
      const year = age - 62 + 1;
      const inflationFactor = Math.pow(1 + input.inflationRate, year - 1);

      // SS income (starts at claim age)
      const ssAnnual = age >= claimAge ? monthlyBenefit * 12 * inflationFactor : 0;
      lifetimeBenefits += ssAnnual;

      // IUL loan income (bridge period)
      let iulLoan = 0;
      if (age < claimAge && bridgeNeeded) {
        iulLoan = annualExpenseGap * inflationFactor;
        iulLoanBal += iulLoan;
      }

      // IUL cash value growth (continues even during loans)
      iulCV *= (1 + input.iulCreditRate);
      iulLoanBal *= (1 + input.iulLoanRate);

      const totalIncome = ssAnnual + iulLoan + input.otherRetirementIncome;

      // Tax calculation (SS may be partially taxable)
      const ssaTaxable = totalIncome > 44000 ? ssAnnual * 0.85
        : totalIncome > 34000 ? ssAnnual * 0.50 : 0;
      const taxes = (ssaTaxable + input.otherRetirementIncome) * input.taxBracket;
      // IUL loans are tax-free (IRC §72(e))

      const netIncome = totalIncome - taxes;
      cumulativeNet += netIncome;

      years.push({
        year,
        age,
        ssIncome: Math.round(ssAnnual),
        iulLoanIncome: Math.round(iulLoan),
        otherIncome: Math.round(input.otherRetirementIncome),
        totalIncome: Math.round(totalIncome),
        taxes: Math.round(taxes),
        netIncome: Math.round(netIncome),
        iulCashValue: Math.round(iulCV),
        iulLoanBalance: Math.round(iulLoanBal),
        cumulativeNetIncome: Math.round(cumulativeNet),
      });
    }

    yearlyProjections[claimAge] = years;

    // Break-even age (when delayed claiming catches up to early claiming)
    const early62Cumulative = strategies.find(s => s.claimAge === 62)?.lifetimeNetIncome ?? 0;
    const breakEven = early62Cumulative > 0 && cumulativeNet > early62Cumulative
      ? 62 + Math.ceil((early62Cumulative / (cumulativeNet / (input.lifeExpectancy - 62))))
      : input.lifeExpectancy;

    // Tax efficiency (IUL loans are tax-free vs taxable SS)
    const taxEff = iulLoanBal > 0
      ? Math.round(100 - (iulLoanBal * input.iulLoanRate / Math.max(cumulativeNet, 1)) * 100)
      : 80;

    strategies.push({
      claimAge,
      monthlyBenefit: Math.round(monthlyBenefit),
      bridgeNeeded,
      bridgeAmount: Math.round(bridgeAmount),
      bridgeYears,
      iulLoanTotal: Math.round(iulLoanBal),
      lifetimeBenefits: Math.round(lifetimeBenefits),
      lifetimeNetIncome: Math.round(cumulativeNet),
      breakEvenAge: breakEven,
      taxEfficiency: Math.min(100, Math.max(0, taxEff)),
    });
  });

  // Find optimal
  const optimal = strategies.reduce((best, s) => s.lifetimeNetIncome > best.lifetimeNetIncome ? s : best);
  const earlyStrategy = strategies.find(s => s.claimAge === 62)!;
  const advantage = optimal.lifetimeNetIncome - earlyStrategy.lifetimeNetIncome;

  const insights: string[] = [
    `Delaying to age ${optimal.claimAge} produces $${advantage.toLocaleString()} more lifetime income`,
    `Monthly benefit at ${optimal.claimAge}: $${optimal.monthlyBenefit.toLocaleString()} vs $${earlyStrategy.monthlyBenefit.toLocaleString()} at 62`,
    `Bridge funding needed: $${optimal.bridgeAmount.toLocaleString()} from IUL loans (tax-free under IRC §72(e))`,
    `Break-even age: ${optimal.breakEvenAge} — after this age, delayed claiming wins`,
    `Tax efficiency: IUL policy-loan bridge income is generally not taxable if the policy is not a MEC and stays in force, vs up to 85% of SS being taxable`,
  ];

  return {
    strategies,
    optimalClaimAge: optimal.claimAge,
    optimalLifetimeBenefit: optimal.lifetimeNetIncome,
    yearlyProjections,
    lifetimeAdvantage: advantage,
    recommendation: `Delay Social Security to age ${optimal.claimAge}, using $${optimal.bridgeAmount.toLocaleString()} in tax-free IUL policy loans as bridge income. This produces $${advantage.toLocaleString()} more lifetime income than claiming at 62.`,
    keyInsights: insights,
  };
}
