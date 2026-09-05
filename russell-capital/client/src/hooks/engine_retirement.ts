// Interfaces for retirement planning data structures
export interface EarningsYear {
  year: number;
  amount: number; // Annual earnings
}

export interface Person {
  birthYear: number;
  earnings: EarningsYear[]; // Array of earnings years
  claimingAge?: number; // Optional claiming age for Social Security
  otherPension?: number; // For WEP/GPO calculations
  spouse?: Person; // For spousal/survivor benefits
  portfolioValue: number; // Total investment portfolio
  accounts: {
    taxable: number; // Taxable accounts balance
    taxDeferred: number; // Tax-deferred accounts (e.g., 401k)
    roth: number; // Roth accounts
  };
  incomeNeeds: number; // Annual income required in retirement
}

export interface Bucket {
  name: string; // e.g., 'short-term', 'medium-term', 'long-term'
  amount: number; // Amount allocated to bucket
  durationYears: number; // Expected duration
}

// Helper constants for 2024 financial formulas
const SSA_BEND_POINTS_2024: [number, number] = [1174, 7078]; // 2024 PIA bend points
const NATIONAL_AVERAGE_WAGE_INDEX_2024: number = 66888; // Approximate 2024 national average wage index
const INFLATION_RATE_2024: number = 0.03; // Assumed 3% inflation for 2024
const DISCOUNT_RATE: number = 0.04; // 4% discount rate for NPV calculations
const GUYTON_KLINGER_CEILING: number = 0.20; // 20% ceiling for withdrawals
const GUYTON_KLINGER_FLOOR: number = 0.15; // 15% floor adjustment
const UNIFORM_LIFETIME_TABLE: Map<number, number> = new Map([
  [70, 27.4], [71, 26.5], [72, 25.6], [73, 24.7], [74, 23.8],
  [75, 22.9], [76, 22.0], [77, 21.2], [78, 20.3], [79, 19.5],
  [80, 18.7], [81, 17.9], [82, 17.1], [83, 16.3], [84, 15.5],
  [85, 14.8], [86, 14.1], [87, 13.4], [88, 12.7], [89, 12.0],
  [90, 11.4], [91, 10.8], [92, 10.2], [93, 9.6], [94, 9.1],
  [95, 8.6], [96, 8.1], [97, 7.6], [98, 7.1], [99, 6.7],
  [100, 6.3], [101, 5.9], [102, 5.5], [103, 5.2], [104, 4.9],
  [105, 4.5], [106, 4.2], [107, 3.9], [108, 3.6], [109, 3.4],
  [110, 3.1], [111, 2.9], [112, 2.6], [113, 2.4], [114, 2.2]
  // Table continues as per IRS, truncated for brevity but can be extended
]);

// 1. Social Security PIA calculation using 2024 bend points
export function calculatePIA(aime: number): number {
  let pia = 0;
  if (aime <= SSA_BEND_POINTS_2024[0]) {
    pia = aime * 0.90; // 90% of first bend point
  } else if (aime <= SSA_BEND_POINTS_2024[1]) {
    pia = (SSA_BEND_POINTS_2024[0] * 0.90) + ((aime - SSA_BEND_POINTS_2024[0]) * 0.32);
  } else {
    pia = (SSA_BEND_POINTS_2024[0] * 0.90) + ((SSA_BEND_POINTS_2024[1] - SSA_BEND_POINTS_2024[0]) * 0.32) + ((aime - SSA_BEND_POINTS_2024[1]) * 0.15);
  }
  return Math.round(pia * 100) / 100; // Round to cents
}

// 2. AIME calculation from 35 highest earning years (indexed to national average wage)
export function calculateAIME(earnings: EarningsYear[]): number {
  const indexedEarnings: number[] = earnings.map(e => {
    const wageIndexRatio = NATIONAL_AVERAGE_WAGE_INDEX_2024 / getNationalAverageWageForYear(e.year);
    return e.amount * wageIndexRatio;
  }).sort((a, b) => b - a).slice(0, 35); // Top 35 years

  const sum = indexedEarnings.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / 35 / 12) * 100) / 100; // Monthly AIME
}

function getNationalAverageWageForYear(year: number): number {
  // Approximate historical wages; use real data for accuracy
  const historicalWages: { [key: number]: number } = {
    1985: 17662, 1990: 21248, 1995: 25003, 2000: 32879, 2005: 36852,
    2010: 41989, 2015: 48877, 2020: 61172, 2023: 65895 // Up to 2023
  };
  return historicalWages[year] || NATIONAL_AVERAGE_WAGE_INDEX_2024; // Default to 2024 if not found
}

// 3. Early/late claiming adjustments
export function adjustForClaimingAge(pia: number, birthYear: number, claimingAge: number): number {
  const fra = getFRA(birthYear);
  if (claimingAge < fra) {
    const monthsEarly = Math.round((fra - claimingAge) * 12);
    const reduction = 1 - (0.059 * (monthsEarly > 36 ? 36 + (monthsEarly - 36) * 0.05 : monthsEarly));
    return pia * reduction;
  } else if (claimingAge > fra && claimingAge <= 70) {
    const monthsLate = Math.round((claimingAge - fra) * 12);
    const increase = 1 + (monthsLate * 0.00667); // 2/3% per month
    return pia * increase;
  }
  return pia; // No adjustment at FRA
}

// 4. Full Retirement Age lookup by birth year
export function getFRA(birthYear: number): number {
  if (birthYear >= 1960) return 67;
  if (birthYear >= 1955) return 66.5 + (birthYear - 1955) * 0.25; // Approximate
  if (birthYear >= 1943 && birthYear <= 1954) return 66;
  return 65; // Pre-1943
}

// 5. Spousal benefit calculation
export function calculateSpousalBenefit(higherEarnersPIA: number): number {
  return higherEarnersPIA * 0.50; // 50% of higher earner's PIA
}

// 6. Survivor benefit calculation
export function calculateSurvivorBenefit(deceasedPIA: number, survivorAge: number): number {
  const survivorFRA = getFRA(survivorAge);
  let benefit = deceasedPIA; // Full PIA if survivor is at or above FRA
  if (survivorAge < survivorFRA) {
    benefit *= 0.75; // Reduced for early claiming, simplified
  }
  return benefit;
}

// 7. Windfall Elimination Provision adjustment
export function applyWEP(pia: number, otherPension: number): number {
  if (otherPension > 0) {
    return pia * 0.50; // Simplified WEP reduction; real cases vary
  }
  return pia;
}

// 8. Government Pension Offset
export function applyGPO(spousalBenefit: number, governmentPension: number): number {
  return spousalBenefit - (governmentPension * 0.6667); // Two-thirds offset
}

// 9. Optimal claiming strategy comparison (NPV analysis)
export function optimalClaimingStrategy(person: Person): { age: number; npv: number }[] {
  const strategies: { age: number; npv: number }[] = [];
  for (let age = 62; age <= 70; age++) {
    const adjustedPIA = adjustForClaimingAge(calculatePIA(calculateAIME(person.earnings)), person.birthYear, age);
    const cashFlows: number[] = Array(25).fill(adjustedPIA * 12); // Assume 25 years of benefits
    const npv = cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + DISCOUNT_RATE, i), 0);
    strategies.push({ age, npv });
  }
  return strategies.sort((a, b) => b.npv - a.npv); // Return sorted by NPV
}

// 10. 4% Rule with Guyton-Klinger guardrails
export function fourPercentRule(portfolioValue: number, inflation: number): number {
  let withdrawal = portfolioValue * 0.04;
  if (withdrawal > portfolioValue * GUYTON_KLINGER_CEILING) {
    withdrawal = portfolioValue * GUYTON_KLINGER_CEILING;
  } else if (withdrawal < portfolioValue * GUYTON_KLINGER_FLOOR) {
    withdrawal *= (1 + inflation);
  }
  return withdrawal;
}

// 11. Required Minimum Distribution
export function calculateRMD(age: number, balance: number): number {
  if (UNIFORM_LIFETIME_TABLE.has(age)) {
    const divisor = UNIFORM_LIFETIME_TABLE.get(age) || 27.4; // Default to age 70
    return balance / divisor;
  }
  return 0; // Invalid age
}

// 12. Tax-efficient withdrawal sequencing
export function taxEfficientWithdrawal(accounts: { taxable: number; taxDeferred: number; roth: number }, neededAmount: number): { withdrawnFrom: string; amounts: { taxable: number; taxDeferred: number; roth: number } } {
  let remaining = neededAmount;
  const amounts: { taxable: number; taxDeferred: number; roth: number } = { taxable: 0, taxDeferred: 0, roth: 0 };

  if (remaining > 0 && accounts.taxable > 0) {
    amounts.taxable = Math.min(remaining, accounts.taxable);
    remaining -= amounts.taxable;
  }
  if (remaining > 0 && accounts.taxDeferred > 0) {
    amounts.taxDeferred = Math.min(remaining, accounts.taxDeferred);
    remaining -= amounts.taxDeferred;
  }
  if (remaining > 0 && accounts.roth > 0) {
    amounts.roth = Math.min(remaining, accounts.roth);
    remaining -= amounts.roth;
  }

  return { withdrawnFrom: 'taxable → tax-deferred → roth', amounts };
}

// 13. Bucket strategy implementation
export function bucketStrategy(assets: number, buckets: Bucket[]): Bucket[] {
  const totalDuration = buckets.reduce((sum, b) => sum + b.durationYears, 0);
  return buckets.map(bucket => ({
    ...bucket,
    amount: (assets * (bucket.durationYears / totalDuration))
  }));
}

// 14. Retirement income gap analysis
export function retirementIncomeGapAnalysis(incomeNeeds: number, incomeSources: { socialSecurity: number; pension: number; withdrawals: number }): number {
  const totalIncome = incomeSources.socialSecurity + incomeSources.pension + incomeSources.withdrawals;
  return incomeNeeds - totalIncome > 0 ? incomeNeeds - totalIncome : 0; // Positive gap only
}

// 15. Longevity risk: probability of outliving savings
export function longevityRiskProbability(currentAge: number, savings: number, withdrawalRate: number): number {
  const lifeExpectancy = 85 + (currentAge - 65) * 0.5; // Simplified estimate
  const yearsToDepletion = savings / (withdrawalRate * savings); // Approximate
  const probability = (lifeExpectancy - currentAge) / yearsToDepletion * 0.75; // Heuristic factor
  return Math.min(Math.max(probability, 0), 1); // Between 0 and 1
}