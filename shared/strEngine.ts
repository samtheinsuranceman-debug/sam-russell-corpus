// ============================================================
// SHORT-TERM RENTAL ENGINE — one property, year by year: what it earns, what
// it costs, what the loan takes, what the tax code allows, and what the
// owner keeps. Pure and deterministic. The market inputs (nightly rate,
// occupancy) are the client's own or copied from a market tool such as
// Rabbu's calculator, and are labelled with where they came from; the
// history inputs (value, appreciation, rent growth, mortgage rate) come from
// the Zip Engine's published record when the zip has one. Nothing here is a
// forecast: every line is arithmetic on the inputs printed above the table.
// ============================================================
import { amortisation } from "./zipEngine";

export type StrInputs = {
  purchasePrice: number;
  downPct: number;          // percent
  ratePct: number;          // annual mortgage rate, percent
  termYears: number;        // 30
  closingPct: number;       // percent of price, one-time
  furnishing: number;       // one-time setup
  nightlyRate: number;      // ADR, dollars
  occupancyPct: number;     // percent of nights booked
  avgStayNights: number;    // for cleaning turnovers
  cleaningPerTurnover: number;
  platformFeePct: number;   // host-side fee, percent of gross
  managementPct: number;    // percent of gross
  utilitiesPerYear: number;
  insurancePerYear: number;
  propertyTaxPct: number;   // percent of value per year
  maintenancePct: number;   // percent of value per year
  appreciationPct: number;  // percent per year (from the Zip Engine window when available)
  rentGrowthPct: number;    // percent per year applied to the nightly rate
  expenseGrowthPct: number; // percent per year on operating costs
  buildingSharePct: number; // share of price that is depreciable building (land excluded)
  depreciationYears: number; // 27.5 residential rental; 39 if treated as transient lodging
  marginalTaxPct: number;   // client's marginal rate for the tax line
  years: number;
};

export const STR_DEFAULTS: StrInputs = {
  purchasePrice: 500_000, downPct: 20, ratePct: 6.5, termYears: 30, closingPct: 3, furnishing: 25_000,
  nightlyRate: 250, occupancyPct: 60, avgStayNights: 3, cleaningPerTurnover: 150, platformFeePct: 3, managementPct: 0,
  utilitiesPerYear: 4_800, insurancePerYear: 3_000, propertyTaxPct: 1.0, maintenancePct: 1.0,
  appreciationPct: 3.5, rentGrowthPct: 3, expenseGrowthPct: 3, buildingSharePct: 80, depreciationYears: 27.5, marginalTaxPct: 37, years: 10,
};

export type StrYear = {
  year: number;
  grossRevenue: number; nightsBooked: number;
  operating: number;    // all operating costs incl. cleaning, fees, management, utilities, insurance, tax, maintenance
  noi: number;
  interest: number; principal: number; debtService: number;
  cashFlow: number;     // NOI − debt service
  depreciation: number;
  taxableIncome: number; // NOI − interest − depreciation (before the passive/STR rules, which the tax page covers)
  taxEffect: number;     // marginal rate × taxable income (negative when the loss shelters other income under the STR rules)
  afterTaxCashFlow: number;
  value: number; loanBalance: number; equity: number;
  cumulativeCash: number;
};

export type StrResult = {
  inputs: StrInputs;
  cashInvested: number;      // down + closing + furnishing
  loan: number;
  monthlyPayment: number;
  years: StrYear[];
  totals: { grossRevenue: number; cashFlow: number; interest: number; principal: number; depreciation: number; taxEffect: number };
  capRateYear1: number;      // NOI ÷ price
  cashOnCashYear1: number;   // cash flow ÷ cash invested
  equityMultiple: number;    // (equity at end + cumulative after-tax cash) ÷ cash invested
  annualisedReturn: number | null; // on cash invested, to the last year
};

/** The loan year by year: interest and principal paid, balance at year end. */
export function loanSchedule(principal: number, ratePct: number, termYears: number, years: number): Array<{ year: number; interest: number; principal: number; balance: number }> {
  const r = ratePct / 100 / 12, n = termYears * 12;
  const { monthlyPayment } = amortisation(principal, ratePct, termYears);
  let bal = principal;
  const out: Array<{ year: number; interest: number; principal: number; balance: number }> = [];
  for (let y = 1; y <= years; y++) {
    let i = 0, p = 0;
    for (let m = 0; m < 12 && bal > 0 && (y - 1) * 12 + m < n; m++) {
      const im = bal * r, pm = Math.min(bal, monthlyPayment - im);
      i += im; p += pm; bal -= pm;
    }
    out.push({ year: y, interest: i, principal: p, balance: Math.max(0, bal) });
  }
  return out;
}

export function runStr(input: Partial<StrInputs> = {}): StrResult {
  const x: StrInputs = { ...STR_DEFAULTS, ...input };
  const loan = x.purchasePrice * (1 - x.downPct / 100);
  const cashInvested = x.purchasePrice * (x.downPct / 100) + x.purchasePrice * (x.closingPct / 100) + x.furnishing;
  const { monthlyPayment } = amortisation(loan, x.ratePct, x.termYears);
  const sched = loanSchedule(loan, x.ratePct, x.termYears, x.years);
  const depreciable = x.purchasePrice * (x.buildingSharePct / 100) + x.furnishing; // furnishings are depreciable too; the tax page handles bonus/cost-seg
  const annualDep = x.depreciationYears > 0 ? depreciable / x.depreciationYears : 0;
  const years: StrYear[] = [];
  let value = x.purchasePrice, cum = 0;
  const totals = { grossRevenue: 0, cashFlow: 0, interest: 0, principal: 0, depreciation: 0, taxEffect: 0 };
  for (let y = 1; y <= x.years; y++) {
    const g = Math.pow(1 + x.rentGrowthPct / 100, y - 1), e = Math.pow(1 + x.expenseGrowthPct / 100, y - 1);
    value = y === 1 ? x.purchasePrice * (1 + x.appreciationPct / 100) : value * (1 + x.appreciationPct / 100);
    const nights = 365 * (x.occupancyPct / 100);
    const gross = nights * x.nightlyRate * g;
    const turnovers = x.avgStayNights > 0 ? nights / x.avgStayNights : 0;
    const operating = gross * ((x.platformFeePct + x.managementPct) / 100) + turnovers * x.cleaningPerTurnover * e + (x.utilitiesPerYear + x.insurancePerYear) * e + value * ((x.propertyTaxPct + x.maintenancePct) / 100);
    const noi = gross - operating;
    const s = sched[y - 1]!;
    const debtService = s.interest + s.principal;
    const cashFlow = noi - debtService;
    const dep = y <= Math.ceil(x.depreciationYears) ? annualDep : 0;
    const taxable = noi - s.interest - dep;
    const taxEffect = taxable * (x.marginalTaxPct / 100);
    const after = cashFlow - taxEffect;
    cum += after;
    years.push({ year: y, grossRevenue: gross, nightsBooked: nights, operating, noi, interest: s.interest, principal: s.principal, debtService, cashFlow, depreciation: dep, taxableIncome: taxable, taxEffect, afterTaxCashFlow: after, value, loanBalance: s.balance, equity: value - s.balance, cumulativeCash: cum });
    totals.grossRevenue += gross; totals.cashFlow += cashFlow; totals.interest += s.interest; totals.principal += s.principal; totals.depreciation += dep; totals.taxEffect += taxEffect;
  }
  const y1 = years[0];
  const last = years[years.length - 1];
  const endWealth = last ? last.equity + last.cumulativeCash : 0;
  const equityMultiple = cashInvested > 0 ? endWealth / cashInvested : 0;
  const annualisedReturn = cashInvested > 0 && endWealth > 0 && x.years > 0 ? Math.pow(endWealth / cashInvested, 1 / x.years) - 1 : null;
  return { inputs: x, cashInvested, loan, monthlyPayment, years, totals, capRateYear1: y1 ? y1.noi / x.purchasePrice : 0, cashOnCashYear1: y1 && cashInvested > 0 ? y1.cashFlow / cashInvested : 0, equityMultiple, annualisedReturn };
}

/** Where the market inputs are allowed to come from, in the words the page uses. */
export const STR_INPUT_SOURCES = [
  { id: "own", label: "Your own figures (a lease, a statement, a quote)" },
  { id: "rabbu", label: "Rabbu Airbnb calculator (rabbu.com/airbnb-calculator): nightly rate, occupancy and monthly revenue for the address, refreshed weekly, gross of fees" },
  { id: "market", label: "Rabbu market page for the city or zip (rabbu.com/markets)" },
] as const;

export const RABBU = {
  calculator: "https://rabbu.com/airbnb-calculator",
  markets: "https://rabbu.com/markets",
  note: "Rabbu publishes no historical series and no public API; its figures are a current estimate from live listings. The engine takes them as the client's typed inputs, dated, and never stores them as the record.",
} as const;
