// ============================================================
// ASSESSMENT → CALCULATOR BRIDGE
// Maps the client's completed Financial Assessment onto the flat data shape
// every portal calculator already consumes (ClientFactFinderData in
// client/src/contexts/ClientDataContext.tsx), so Mortgage Killer, Income Gap,
// Roth Strategies, Market Stress Test and the rest start pre-filled from the
// assessment instead of asking the client to retype. The assessment stays the
// single source of truth; nothing here invents a number — missing inputs stay
// at zero and are reported in `missing` so a page can say so.
// ============================================================
import { isBlank, type ClientFactFinder } from "./clientFactFinder";

export type AssessmentClientData = {
  clientId: number;
  clientName: string;
  email: string;
  phone: string;
  age: number;
  state: string;
  filingStatus: "single" | "joint" | "hoh";
  spouseName: string;
  spouseAge: number;
  dependents: number;
  annualIncome: number;
  spouseIncome: number;
  monthlyExpenses: number;
  cashSavings: number;
  taxableInvestments: number;
  realEstateEquity: number;
  homeValue: number;
  iraBalance: number;
  rothBalance: number;
  k401Balance: number;
  pensionIncome: number;
  socialSecurityEstimate: number;
  lifeInsuranceCv: number;
  lifeInsuranceDb: number;
  annualPremium: number;
  annuityValue: number;
  hasLTC: boolean;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsLeft: number;
  totalMortgageInterest: number;
  otherDebt: number;
  helocRate: number;
  helocMaxLtv: number;
  retirementAge: number;
  annualIncomeNeeded: number;
  legacyGoal: number;
  riskTolerance: number;
  children: never[];
  grandchildren: never[];
};

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

export function ageFromDob(dob: unknown, now = new Date()): number {
  if (typeof dob !== "string" || !dob) return 0;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000)));
}

/** Total interest still to be paid on a level-payment loan (0 when inputs are missing). */
export function remainingMortgageInterest(balance: number, annualRatePct: number, yearsLeft: number): number {
  if (balance <= 0 || yearsLeft <= 0) return 0;
  const n = Math.round(yearsLeft * 12);
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return 0;
  const payment = (balance * r) / (1 - Math.pow(1 + r, -n));
  return Math.max(0, Math.round(payment * n - balance));
}

export function riskToleranceScore(label: unknown): number {
  const s = str(label);
  if (/^Conservative/.test(s)) return 2;
  if (/Moderately conservative/.test(s)) return 4;
  if (/^Moderate$/.test(s)) return 5;
  if (/Moderately aggressive/.test(s)) return 7;
  if (/^Aggressive/.test(s)) return 9;
  return 5;
}

export type BridgeResult = { data: AssessmentClientData; missing: string[] };

/**
 * Build calculator inputs from the assessment. `missing` names the calculator
 * inputs the assessment could not supply (left at 0), so pages can flag them
 * instead of silently using a default.
 */
export function assessmentToClientData(ff: ClientFactFinder, opts: { fallbackName?: string; now?: Date } = {}): BridgeResult {
  const s = (id: string) => ff.sections?.[id] ?? {};
  const hh = s("household"), inc = s("income"), tax = s("taxes"), re = s("realEstate"), debt = s("debts"), inv = s("investments");
  const cash = s("cash"), flow = s("cashFlow"), ins = s("insurance"), ret = s("retirement");
  const missing: string[] = [];
  const need = (label: string, v: number) => { if (v <= 0) missing.push(label); return v; };

  const name = [hh.firstName, hh.lastName].filter((v) => !isBlank(v as never)).join(" ") || opts.fallbackName || "Client";
  const filing: AssessmentClientData["filingStatus"] = /jointly|surviving/i.test(str(tax.filingStatus)) ? "joint" : /head of household/i.test(str(tax.filingStatus)) ? "hoh" : "single";
  const annualIncome = need("Annual income", num(inc.w2Income) + num(inc.bonusIncome) + num(inc.contractorIncome) + num(inc.practiceDistributions) + num(inc.rsuOrEquityComp));
  const mortgageBalance = num(re.primaryMortgageBalance);
  const mortgageRate = num(re.primaryMortgageRate);
  const mortgageYearsLeft = num(re.primaryMortgageYearsRemaining);
  const monthlyExpenses = need("Monthly expenses", num(flow.monthlyFixedExpenses) + num(flow.monthlyDiscretionary));
  const retirementAge = need("Target retirement age", num(ret.targetRetirementAge));
  const annualIncomeNeeded = need("Retirement income target", num(ret.desiredRetirementIncomeMonthly) * 12);
  const age = need("Age (date of birth)", ageFromDob(hh.dateOfBirth, opts.now));

  const data: AssessmentClientData = {
    clientId: -1,
    clientName: name,
    email: str(hh.email),
    phone: str(hh.phone),
    age,
    state: str(hh.stateOfResidence) || "",
    filingStatus: filing,
    spouseName: str(hh.spouseFirstName),
    spouseAge: ageFromDob(hh.spouseDateOfBirth, opts.now),
    dependents: num(hh.dependents),
    annualIncome,
    spouseIncome: num(inc.spouseIncome),
    monthlyExpenses,
    cashSavings: num(cash.checking) + num(cash.savings) + num(cash.moneyMarketCds),
    taxableInvestments: num(inv.taxableBrokerage),
    realEstateEquity: num(re.homeEquity),
    homeValue: num(re.primaryHomeValue),
    iraBalance: num(inv.traditionalIra),
    rothBalance: num(inv.rothIra) + num(inv.roth401k),
    k401Balance: num(inv.employerPlanBalance),
    pensionIncome: num(ret.pensionIncome) * 12,
    socialSecurityEstimate: num(ret.socialSecuritySelf),
    lifeInsuranceCv: num(ins.permanentLifeCashValue),
    lifeInsuranceDb: num(ins.termLifeDeathBenefit) + num(ins.permanentLifeDeathBenefit),
    annualPremium: num(ins.lifePremiumAnnual),
    annuityValue: num(inv.annuities),
    hasLTC: Boolean(str(ins.ltcCoverage)) && !/None/.test(str(ins.ltcCoverage)),
    mortgageBalance,
    mortgageRate,
    mortgageYearsLeft,
    totalMortgageInterest: remainingMortgageInterest(mortgageBalance, mortgageRate, mortgageYearsLeft),
    otherDebt: num(debt.studentLoanBalance) + num(debt.practiceLoanBalance) + num(debt.autoLoans) + num(debt.creditCardBalance) + num(debt.personalLoans) + num(debt.otherDebt),
    helocRate: num(re.helocRate),
    helocMaxLtv: 80,
    retirementAge,
    annualIncomeNeeded,
    legacyGoal: 0,
    riskTolerance: riskToleranceScore(inv.riskTolerance),
    children: [],
    grandchildren: [],
  };
  return { data, missing };
}
