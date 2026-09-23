/**
 * State Tax Engine — All 50 States + DC
 * 2025/2026 tax brackets for physician-relevant income levels
 * Sources: Tax Foundation, state revenue departments
 */

export interface StateTaxBracket {
  min: number;
  max: number;
  rate: number; // decimal, e.g. 0.05 = 5%
}

export interface StateTaxInfo {
  abbr: string;
  name: string;
  brackets: StateTaxBracket[];
  standardDeduction: number; // single filer
  standardDeductionMFJ: number; // married filing jointly
  hasLocalTax: boolean;
  localTaxRate: number; // average local rate if applicable
  notes: string;
}

// Calculate state tax for a given income and filing status
export function calculateStateTax(
  income: number,
  stateAbbr: string,
  filingStatus: "single" | "mfj" = "single"
): { tax: number; effectiveRate: number; marginalRate: number; deduction: number } {
  const state = STATE_TAX_DATA[stateAbbr];
  if (!state) return { tax: 0, effectiveRate: 0, marginalRate: 0, deduction: 0 };

  const deduction = filingStatus === "mfj" ? state.standardDeductionMFJ : state.standardDeduction;
  const taxableIncome = Math.max(0, income - deduction);

  let tax = 0;
  let marginalRate = 0;

  for (const bracket of state.brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
    marginalRate = bracket.rate;
  }

  // Add local tax if applicable
  if (state.hasLocalTax) {
    tax += taxableIncome * state.localTaxRate;
  }

  const effectiveRate = income > 0 ? tax / income : 0;

  return { tax, effectiveRate, marginalRate, deduction };
}

// Get all states sorted by tax burden for a given income
export function rankStatesByTaxBurden(
  income: number,
  filingStatus: "single" | "mfj" = "single"
): Array<{ abbr: string; name: string; tax: number; effectiveRate: number }> {
  return Object.entries(STATE_TAX_DATA)
    .map(([abbr, state]) => {
      const result = calculateStateTax(income, abbr, filingStatus);
      return { abbr, name: state.name, tax: result.tax, effectiveRate: result.effectiveRate };
    })
    .sort((a, b) => a.tax - b.tax);
}

// Get physician-friendly state comparison
export function getPhysicianStateTaxComparison(income: number) {
  const ranked = rankStatesByTaxBurden(income);
  return {
    lowestTax: ranked.slice(0, 5),
    highestTax: ranked.slice(-5).reverse(),
    noIncomeTax: ranked.filter((s) => s.tax === 0),
    median: ranked[Math.floor(ranked.length / 2)],
  };
}

export const STATE_TAX_DATA: Record<string, StateTaxInfo> = {
  AL: {
    abbr: "AL", name: "Alabama",
    brackets: [
      { min: 0, max: 500, rate: 0.02 },
      { min: 500, max: 3000, rate: 0.04 },
      { min: 3000, max: Infinity, rate: 0.05 },
    ],
    standardDeduction: 2500, standardDeductionMFJ: 7500,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Alabama allows federal tax deduction on state return",
  },
  AK: {
    abbr: "AK", name: "Alaska",
    brackets: [],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No state income tax",
  },
  AZ: {
    abbr: "AZ", name: "Arizona",
    brackets: [
      { min: 0, max: Infinity, rate: 0.025 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat tax rate since 2023",
  },
  AR: {
    abbr: "AR", name: "Arkansas",
    brackets: [
      { min: 0, max: 4400, rate: 0.02 },
      { min: 4400, max: 8800, rate: 0.04 },
      { min: 8800, max: Infinity, rate: 0.044 },
    ],
    standardDeduction: 2340, standardDeductionMFJ: 4680,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Rate reduced to 4.4% for 2025",
  },
  CA: {
    abbr: "CA", name: "California",
    brackets: [
      { min: 0, max: 10412, rate: 0.01 },
      { min: 10412, max: 24684, rate: 0.02 },
      { min: 24684, max: 38959, rate: 0.04 },
      { min: 38959, max: 54081, rate: 0.06 },
      { min: 54081, max: 68350, rate: 0.08 },
      { min: 68350, max: 349137, rate: 0.093 },
      { min: 349137, max: 418961, rate: 0.103 },
      { min: 418961, max: 698271, rate: 0.113 },
      { min: 698271, max: 1000000, rate: 0.123 },
      { min: 1000000, max: Infinity, rate: 0.133 },
    ],
    standardDeduction: 5540, standardDeductionMFJ: 11080,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Highest top rate in US. Mental Health Services Tax adds 1% over $1M",
  },
  CO: {
    abbr: "CO", name: "Colorado",
    brackets: [
      { min: 0, max: Infinity, rate: 0.044 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat tax rate reduced to 4.4% for 2024+",
  },
  CT: {
    abbr: "CT", name: "Connecticut",
    brackets: [
      { min: 0, max: 10000, rate: 0.03 },
      { min: 10000, max: 50000, rate: 0.05 },
      { min: 50000, max: 100000, rate: 0.055 },
      { min: 100000, max: 200000, rate: 0.06 },
      { min: 200000, max: 250000, rate: 0.065 },
      { min: 250000, max: 500000, rate: 0.069 },
      { min: 500000, max: Infinity, rate: 0.0699 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No standard deduction; uses personal exemptions and credits",
  },
  DE: {
    abbr: "DE", name: "Delaware",
    brackets: [
      { min: 0, max: 2000, rate: 0.0 },
      { min: 2000, max: 5000, rate: 0.022 },
      { min: 5000, max: 10000, rate: 0.039 },
      { min: 10000, max: 20000, rate: 0.048 },
      { min: 20000, max: 25000, rate: 0.052 },
      { min: 25000, max: 60000, rate: 0.055 },
      { min: 60000, max: Infinity, rate: 0.066 },
    ],
    standardDeduction: 3250, standardDeductionMFJ: 6500,
    hasLocalTax: true, localTaxRate: 0.0125,
    notes: "Wilmington has 1.25% local wage tax",
  },
  FL: {
    abbr: "FL", name: "Florida",
    brackets: [],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No state income tax — popular physician relocation state",
  },
  GA: {
    abbr: "GA", name: "Georgia",
    brackets: [
      { min: 0, max: Infinity, rate: 0.0549 },
    ],
    standardDeduction: 12000, standardDeductionMFJ: 24000,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat tax rate since 2024",
  },
  HI: {
    abbr: "HI", name: "Hawaii",
    brackets: [
      { min: 0, max: 2400, rate: 0.014 },
      { min: 2400, max: 4800, rate: 0.032 },
      { min: 4800, max: 9600, rate: 0.055 },
      { min: 9600, max: 14400, rate: 0.064 },
      { min: 14400, max: 19200, rate: 0.068 },
      { min: 19200, max: 24000, rate: 0.072 },
      { min: 24000, max: 36000, rate: 0.076 },
      { min: 36000, max: 48000, rate: 0.079 },
      { min: 48000, max: 150000, rate: 0.0825 },
      { min: 150000, max: 175000, rate: 0.09 },
      { min: 175000, max: 200000, rate: 0.10 },
      { min: 200000, max: Infinity, rate: 0.11 },
    ],
    standardDeduction: 2200, standardDeductionMFJ: 4400,
    hasLocalTax: false, localTaxRate: 0,
    notes: "High top rate of 11% for income over $200K",
  },
  ID: {
    abbr: "ID", name: "Idaho",
    brackets: [
      { min: 0, max: Infinity, rate: 0.058 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat tax since 2023",
  },
  IL: {
    abbr: "IL", name: "Illinois",
    brackets: [
      { min: 0, max: Infinity, rate: 0.0495 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat tax; no standard deduction but has personal exemptions",
  },
  IN: {
    abbr: "IN", name: "Indiana",
    brackets: [
      { min: 0, max: Infinity, rate: 0.0305 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: true, localTaxRate: 0.015,
    notes: "County taxes range 0.5%-2.9%; using 1.5% average",
  },
  IA: {
    abbr: "IA", name: "Iowa",
    brackets: [
      { min: 0, max: Infinity, rate: 0.038 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat tax rate of 3.8% since 2026",
  },
  KS: {
    abbr: "KS", name: "Kansas",
    brackets: [
      { min: 0, max: 15000, rate: 0.031 },
      { min: 15000, max: 30000, rate: 0.0525 },
      { min: 30000, max: Infinity, rate: 0.057 },
    ],
    standardDeduction: 3500, standardDeductionMFJ: 8000,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Three-bracket system",
  },
  KY: {
    abbr: "KY", name: "Kentucky",
    brackets: [
      { min: 0, max: Infinity, rate: 0.04 },
    ],
    standardDeduction: 3160, standardDeductionMFJ: 6320,
    hasLocalTax: true, localTaxRate: 0.0225,
    notes: "Flat 4%; some cities levy occupational taxes",
  },
  LA: {
    abbr: "LA", name: "Louisiana",
    brackets: [
      { min: 0, max: 12500, rate: 0.0185 },
      { min: 12500, max: 50000, rate: 0.035 },
      { min: 50000, max: Infinity, rate: 0.0425 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Uses federal standard deduction amounts",
  },
  ME: {
    abbr: "ME", name: "Maine",
    brackets: [
      { min: 0, max: 24500, rate: 0.058 },
      { min: 24500, max: 58050, rate: 0.0675 },
      { min: 58050, max: Infinity, rate: 0.0715 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 7.15% for income over $58K",
  },
  MD: {
    abbr: "MD", name: "Maryland",
    brackets: [
      { min: 0, max: 1000, rate: 0.02 },
      { min: 1000, max: 2000, rate: 0.03 },
      { min: 2000, max: 3000, rate: 0.04 },
      { min: 3000, max: 100000, rate: 0.0475 },
      { min: 100000, max: 125000, rate: 0.05 },
      { min: 125000, max: 150000, rate: 0.0525 },
      { min: 150000, max: 250000, rate: 0.055 },
      { min: 250000, max: Infinity, rate: 0.0575 },
    ],
    standardDeduction: 2550, standardDeductionMFJ: 5100,
    hasLocalTax: true, localTaxRate: 0.032,
    notes: "County taxes add 2.25%-3.2%; using 3.2% average. High combined rate for physicians",
  },
  MA: {
    abbr: "MA", name: "Massachusetts",
    brackets: [
      { min: 0, max: 1000000, rate: 0.05 },
      { min: 1000000, max: Infinity, rate: 0.09 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Millionaire's tax adds 4% surtax on income over $1M (total 9%)",
  },
  MI: {
    abbr: "MI", name: "Michigan",
    brackets: [
      { min: 0, max: Infinity, rate: 0.0425 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: true, localTaxRate: 0.015,
    notes: "Some cities levy 1-2.4% income tax; Detroit is 2.4%",
  },
  MN: {
    abbr: "MN", name: "Minnesota",
    brackets: [
      { min: 0, max: 30070, rate: 0.0535 },
      { min: 30070, max: 98760, rate: 0.068 },
      { min: 98760, max: 183340, rate: 0.0785 },
      { min: 183340, max: Infinity, rate: 0.0985 },
    ],
    standardDeduction: 14575, standardDeductionMFJ: 29150,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 9.85% — one of the highest in the nation",
  },
  MS: {
    abbr: "MS", name: "Mississippi",
    brackets: [
      { min: 0, max: 10000, rate: 0.0 },
      { min: 10000, max: Infinity, rate: 0.047 },
    ],
    standardDeduction: 2300, standardDeductionMFJ: 4600,
    hasLocalTax: false, localTaxRate: 0,
    notes: "First $10K exempt; flat 4.7% above that",
  },
  MO: {
    abbr: "MO", name: "Missouri",
    brackets: [
      { min: 0, max: 1207, rate: 0.02 },
      { min: 1207, max: 2414, rate: 0.025 },
      { min: 2414, max: 3621, rate: 0.03 },
      { min: 3621, max: 4828, rate: 0.035 },
      { min: 4828, max: 6035, rate: 0.04 },
      { min: 6035, max: 7242, rate: 0.045 },
      { min: 7242, max: 8449, rate: 0.048 },
      { min: 8449, max: Infinity, rate: 0.048 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: true, localTaxRate: 0.01,
    notes: "Kansas City and St. Louis levy ~1% earnings tax",
  },
  MT: {
    abbr: "MT", name: "Montana",
    brackets: [
      { min: 0, max: 20500, rate: 0.047 },
      { min: 20500, max: Infinity, rate: 0.059 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Two-bracket system since 2024",
  },
  NE: {
    abbr: "NE", name: "Nebraska",
    brackets: [
      { min: 0, max: 3700, rate: 0.0246 },
      { min: 3700, max: 22170, rate: 0.0351 },
      { min: 22170, max: 35730, rate: 0.0501 },
      { min: 35730, max: Infinity, rate: 0.0584 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Rates being reduced gradually through 2027",
  },
  NV: {
    abbr: "NV", name: "Nevada",
    brackets: [],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No state income tax — popular physician relocation state",
  },
  NH: {
    abbr: "NH", name: "New Hampshire",
    brackets: [],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No income tax on wages (interest/dividends tax repealed 2025)",
  },
  NJ: {
    abbr: "NJ", name: "New Jersey",
    brackets: [
      { min: 0, max: 20000, rate: 0.014 },
      { min: 20000, max: 35000, rate: 0.0175 },
      { min: 35000, max: 40000, rate: 0.035 },
      { min: 40000, max: 75000, rate: 0.05525 },
      { min: 75000, max: 500000, rate: 0.0637 },
      { min: 500000, max: 1000000, rate: 0.0897 },
      { min: 1000000, max: Infinity, rate: 0.1075 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 10.75% over $1M. No standard deduction",
  },
  NM: {
    abbr: "NM", name: "New Mexico",
    brackets: [
      { min: 0, max: 5500, rate: 0.017 },
      { min: 5500, max: 11000, rate: 0.032 },
      { min: 11000, max: 16000, rate: 0.047 },
      { min: 16000, max: 210000, rate: 0.049 },
      { min: 210000, max: Infinity, rate: 0.059 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 5.9% for income over $210K",
  },
  NY: {
    abbr: "NY", name: "New York",
    brackets: [
      { min: 0, max: 8500, rate: 0.04 },
      { min: 8500, max: 11700, rate: 0.045 },
      { min: 11700, max: 13900, rate: 0.0525 },
      { min: 13900, max: 80650, rate: 0.055 },
      { min: 80650, max: 215400, rate: 0.06 },
      { min: 215400, max: 1077550, rate: 0.0685 },
      { min: 1077550, max: 5000000, rate: 0.0965 },
      { min: 5000000, max: 25000000, rate: 0.103 },
      { min: 25000000, max: Infinity, rate: 0.109 },
    ],
    standardDeduction: 8000, standardDeductionMFJ: 16050,
    hasLocalTax: true, localTaxRate: 0.03876,
    notes: "NYC adds 3.876% — combined top rate over 14% for NYC physicians",
  },
  NC: {
    abbr: "NC", name: "North Carolina",
    brackets: [
      { min: 0, max: Infinity, rate: 0.045 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat 4.5% — declining annually toward 3.99% by 2027",
  },
  ND: {
    abbr: "ND", name: "North Dakota",
    brackets: [
      { min: 0, max: Infinity, rate: 0.0195 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat 1.95% — one of the lowest in the nation",
  },
  OH: {
    abbr: "OH", name: "Ohio",
    brackets: [
      { min: 0, max: 26050, rate: 0.0 },
      { min: 26050, max: 100000, rate: 0.0275 },
      { min: 100000, max: Infinity, rate: 0.035 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: true, localTaxRate: 0.02,
    notes: "Many cities levy 1.5-2.5% municipal income tax",
  },
  OK: {
    abbr: "OK", name: "Oklahoma",
    brackets: [
      { min: 0, max: 1000, rate: 0.0025 },
      { min: 1000, max: 2500, rate: 0.0075 },
      { min: 2500, max: 3750, rate: 0.0175 },
      { min: 3750, max: 4900, rate: 0.0275 },
      { min: 4900, max: 7200, rate: 0.0375 },
      { min: 7200, max: Infinity, rate: 0.0475 },
    ],
    standardDeduction: 7350, standardDeductionMFJ: 14700,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 4.75%",
  },
  OR: {
    abbr: "OR", name: "Oregon",
    brackets: [
      { min: 0, max: 4050, rate: 0.0475 },
      { min: 4050, max: 10200, rate: 0.0675 },
      { min: 10200, max: 125000, rate: 0.0875 },
      { min: 125000, max: Infinity, rate: 0.099 },
    ],
    standardDeduction: 2745, standardDeductionMFJ: 5495,
    hasLocalTax: true, localTaxRate: 0.01,
    notes: "Top rate 9.9%. Portland metro area has additional 1% tax",
  },
  PA: {
    abbr: "PA", name: "Pennsylvania",
    brackets: [
      { min: 0, max: Infinity, rate: 0.0307 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: true, localTaxRate: 0.03,
    notes: "Flat 3.07%. Philadelphia adds ~3.75% wage tax",
  },
  RI: {
    abbr: "RI", name: "Rhode Island",
    brackets: [
      { min: 0, max: 73450, rate: 0.0375 },
      { min: 73450, max: 166950, rate: 0.0475 },
      { min: 166950, max: Infinity, rate: 0.0599 },
    ],
    standardDeduction: 10550, standardDeductionMFJ: 21150,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 5.99%",
  },
  SC: {
    abbr: "SC", name: "South Carolina",
    brackets: [
      { min: 0, max: 3460, rate: 0.0 },
      { min: 3460, max: 17330, rate: 0.03 },
      { min: 17330, max: Infinity, rate: 0.064 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 6.4% being reduced to 6.2% by 2027",
  },
  SD: {
    abbr: "SD", name: "South Dakota",
    brackets: [],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No state income tax",
  },
  TN: {
    abbr: "TN", name: "Tennessee",
    brackets: [],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No state income tax (Hall Tax on investment income repealed 2021)",
  },
  TX: {
    abbr: "TX", name: "Texas",
    brackets: [],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No state income tax — #1 physician relocation destination",
  },
  UT: {
    abbr: "UT", name: "Utah",
    brackets: [
      { min: 0, max: Infinity, rate: 0.0465 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Flat 4.65%. Uses taxpayer tax credit instead of standard deduction",
  },
  VT: {
    abbr: "VT", name: "Vermont",
    brackets: [
      { min: 0, max: 45400, rate: 0.0335 },
      { min: 45400, max: 110050, rate: 0.066 },
      { min: 110050, max: 229550, rate: 0.076 },
      { min: 229550, max: Infinity, rate: 0.0875 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 8.75%",
  },
  VA: {
    abbr: "VA", name: "Virginia",
    brackets: [
      { min: 0, max: 3000, rate: 0.02 },
      { min: 3000, max: 5000, rate: 0.03 },
      { min: 5000, max: 17000, rate: 0.05 },
      { min: 17000, max: Infinity, rate: 0.0575 },
    ],
    standardDeduction: 8000, standardDeductionMFJ: 16000,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 5.75% kicks in at just $17K",
  },
  WA: {
    abbr: "WA", name: "Washington",
    brackets: [
      { min: 0, max: 250000, rate: 0.0 },
      { min: 250000, max: Infinity, rate: 0.07 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No traditional income tax. 7% capital gains tax on gains over $250K",
  },
  WV: {
    abbr: "WV", name: "West Virginia",
    brackets: [
      { min: 0, max: 10000, rate: 0.0236 },
      { min: 10000, max: 25000, rate: 0.0315 },
      { min: 25000, max: 40000, rate: 0.0354 },
      { min: 40000, max: 60000, rate: 0.0472 },
      { min: 60000, max: Infinity, rate: 0.0512 },
    ],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Rates being reduced annually; top rate 5.12%",
  },
  WI: {
    abbr: "WI", name: "Wisconsin",
    brackets: [
      { min: 0, max: 14320, rate: 0.0354 },
      { min: 14320, max: 28640, rate: 0.0465 },
      { min: 28640, max: 315310, rate: 0.053 },
      { min: 315310, max: Infinity, rate: 0.0765 },
    ],
    standardDeduction: 13230, standardDeductionMFJ: 24440,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 7.65% for income over $315K",
  },
  WY: {
    abbr: "WY", name: "Wyoming",
    brackets: [],
    standardDeduction: 0, standardDeductionMFJ: 0,
    hasLocalTax: false, localTaxRate: 0,
    notes: "No state income tax",
  },
  DC: {
    abbr: "DC", name: "District of Columbia",
    brackets: [
      { min: 0, max: 10000, rate: 0.04 },
      { min: 10000, max: 40000, rate: 0.06 },
      { min: 40000, max: 60000, rate: 0.065 },
      { min: 60000, max: 250000, rate: 0.085 },
      { min: 250000, max: 500000, rate: 0.0925 },
      { min: 500000, max: 1000000, rate: 0.0975 },
      { min: 1000000, max: Infinity, rate: 0.1075 },
    ],
    standardDeduction: 14600, standardDeductionMFJ: 29200,
    hasLocalTax: false, localTaxRate: 0,
    notes: "Top rate 10.75% — high-tax jurisdiction for physician residents/fellows",
  },
};

// Convenience: list of all state abbreviations
export const ALL_STATES = Object.keys(STATE_TAX_DATA).sort();

// No-income-tax states
export const NO_INCOME_TAX_STATES = ["AK", "FL", "NV", "NH", "SD", "TN", "TX", "WA", "WY"];

// Highest-tax states for physicians (income > $300K)
export const HIGH_TAX_STATES = ["CA", "NY", "NJ", "OR", "MN", "HI", "DC", "VT", "MA", "MD"];
