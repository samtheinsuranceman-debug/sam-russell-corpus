/**
 * Local persistence for the Financial Fact Finder.
 *
 * Same contract as the intake storage: best-effort, never required. A person
 * can fill half of it tonight and the rest next week; nothing here depends on
 * a database or a sign-in. Every read tolerates absent or corrupt data.
 */

import type { FinancialContext } from "@shared/engines/psychFinancialBridge";
import type { CalcValues } from "@shared/finance/calc";
import { MAX_PAUSE_DAYS, type SelfPause } from "@shared/engines/readinessEvidence";

const KEY = "drbuddy.finance.factfinder.v1";

export type Filing = "single" | "mfj";
export type Occupation = "physician" | "surgeon" | "psychiatrist" | "dentist" | "other";

export interface FactFinderData {
  profile: {
    age: number | null;
    filing: Filing;
    state: string;
    dependents: number | null;
    occupation: Occupation;
    retireAge: number | null;
  };
  income: {
    salary: number | null;
    spouseIncome: number | null;
    otherIncome: number | null;
    bonus: number | null;
  };
  tax: {
    marginalRate: number | null;
    stateRate: number | null;
    priorYearTax: number | null;
  };
  cashflow: {
    monthlyExpenses: number | null;
    monthlySavings: number | null;
  };
  assets: {
    cash: number | null;
    brokerage: number | null;
    preTax: number | null;
    roth: number | null;
    hsa: number | null;
    homeValue: number | null;
    otherRealEstate: number | null;
    businessValue: number | null;
    lifeInsuranceCashValue: number | null;
  };
  debts: {
    mortgageBalance: number | null;
    mortgageRate: number | null;
    mortgageYearsLeft: number | null;
    studentLoans: number | null;
    studentLoanRate: number | null;
    otherDebt: number | null;
    otherDebtRate: number | null;
    heloc: number | null;
  };
  protection: {
    lifeInsuranceFace: number | null;
    disabilityMonthlyBenefit: number | null;
    hasLongTermCare: boolean;
    hasUmbrella: boolean;
    hasEstateDocuments: boolean;
  };
  goals: {
    priorities: string[];
    horizonYears: number | null;
    /** 1 (needs certainty) to 5 (comfortable with swings). */
    riskComfort: number | null;
    notes: string;
  };
}

export const PRIORITY_OPTIONS = [
  { id: "tax-free-income", label: "Tax-free retirement income" },
  { id: "mortgage-payoff", label: "Pay the mortgage off early" },
  { id: "divorce-protection", label: "Protect assets in a divorce" },
  { id: "legacy", label: "Leave something that lasts" },
  { id: "business", label: "Protect or sell a practice" },
  { id: "student-debt", label: "Get out from under student debt" },
  { id: "disability", label: "Income if I cannot work" },
  { id: "education", label: "Fund children's education" },
] as const;

export function emptyFactFinder(): FactFinderData {
  return {
    profile: { age: null, filing: "single", state: "", dependents: null, occupation: "physician", retireAge: null },
    income: { salary: null, spouseIncome: null, otherIncome: null, bonus: null },
    tax: { marginalRate: null, stateRate: null, priorYearTax: null },
    cashflow: { monthlyExpenses: null, monthlySavings: null },
    assets: {
      cash: null, brokerage: null, preTax: null, roth: null, hsa: null,
      homeValue: null, otherRealEstate: null, businessValue: null, lifeInsuranceCashValue: null,
    },
    debts: {
      mortgageBalance: null, mortgageRate: null, mortgageYearsLeft: null, studentLoans: null,
      studentLoanRate: null, otherDebt: null, otherDebtRate: null, heloc: null,
    },
    protection: {
      lifeInsuranceFace: null, disabilityMonthlyBenefit: null,
      hasLongTermCare: false, hasUmbrella: false, hasEstateDocuments: false,
    },
    goals: { priorities: [], horizonYears: null, riskComfort: null, notes: "" },
  };
}

export interface StoredFactFinder {
  data: FactFinderData;
  updatedAt: number;
  /** Last section the person was on, so "resume" lands them there. */
  section: number;
}

export function loadFactFinder(): StoredFactFinder | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFactFinder;
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    // Merge over an empty shape so a field added later never reads as undefined.
    const base = emptyFactFinder();
    const data = { ...base } as FactFinderData;
    for (const section of Object.keys(base) as Array<keyof FactFinderData>) {
      (data as unknown as Record<string, unknown>)[section] = { ...base[section], ...(parsed.data[section] ?? {}) };
    }
    return { data, updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0, section: parsed.section ?? 0 };
  } catch {
    return null;
  }
}

export function saveFactFinder(data: FactFinderData, section: number): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ data, updatedAt: Date.now(), section } satisfies StoredFactFinder));
    return true;
  } catch {
    return false;
  }
}

export function clearFactFinder(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/** Share of fields answered, 0..1. Booleans count as answered once true. */
export function factFinderProgress(data: FactFinderData): { answered: number; total: number; ratio: number } {
  let answered = 0;
  let total = 0;
  for (const section of Object.values(data)) {
    for (const [k, v] of Object.entries(section as Record<string, unknown>)) {
      if (k === "notes") continue;
      total++;
      if (Array.isArray(v)) {
        if (v.length > 0) answered++;
      } else if (typeof v === "boolean") {
        if (v) answered++;
      } else if (typeof v === "number") {
        answered++;
      } else if (typeof v === "string") {
        if (v.trim() !== "") answered++;
      }
    }
  }
  return { answered, total, ratio: total === 0 ? 0 : answered / total };
}

const sum = (...xs: Array<number | null>) => xs.reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0);

export function liquidAssets(d: FactFinderData): number {
  return sum(d.assets.cash, d.assets.brokerage, d.assets.roth, d.assets.hsa);
}

export function totalDebt(d: FactFinderData): number {
  return sum(d.debts.mortgageBalance, d.debts.studentLoans, d.debts.otherDebt, d.debts.heloc);
}

export function netWorth(d: FactFinderData): number {
  const a = d.assets;
  return (
    sum(a.cash, a.brokerage, a.preTax, a.roth, a.hsa, a.homeValue, a.otherRealEstate, a.businessValue, a.lifeInsuranceCashValue) -
    totalDebt(d)
  );
}

export function householdIncome(d: FactFinderData): number {
  return sum(d.income.salary, d.income.spouseIncome, d.income.otherIncome, d.income.bonus);
}

/** What the bridge needs to turn ratios into dollars. */
export function financialContextFrom(d: FactFinderData | null): FinancialContext {
  if (!d) return {};
  const ctx: FinancialContext = {};
  if (typeof d.cashflow.monthlyExpenses === "number") ctx.monthlyExpenses = d.cashflow.monthlyExpenses;
  const liquid = liquidAssets(d);
  if (liquid > 0) ctx.liquidAssets = liquid;
  const income = householdIncome(d);
  if (income > 0) ctx.annualIncome = income;
  const debt = totalDebt(d);
  if (debt > 0) ctx.totalDebt = debt;
  if (typeof d.assets.homeValue === "number" && typeof d.debts.mortgageBalance === "number") {
    ctx.homeEquity = Math.max(0, d.assets.homeValue - d.debts.mortgageBalance);
  }
  return ctx;
}

/**
 * Calculator defaults from the fact finder. Only keys whose meaning is the
 * same in every calculator are mapped; anything ambiguous (`balance`, `rate`)
 * is left to the calculator's own default rather than guessed.
 */
export function calcDefaultsFrom(d: FactFinderData | null): Partial<CalcValues> {
  if (!d) return {};
  const out: Partial<CalcValues> = {};
  const income = householdIncome(d);
  if (typeof d.profile.age === "number") out.age = d.profile.age;
  if (income > 0) out.income = income;
  if (typeof d.income.salary === "number") out.salary = d.income.salary;
  if (typeof d.tax.marginalRate === "number") {
    out.marginalRate = d.tax.marginalRate;
    out.taxRate = d.tax.marginalRate;
  }
  if (typeof d.tax.stateRate === "number") out.stateRate = d.tax.stateRate;
  if (typeof d.assets.preTax === "number") out.preTax = d.assets.preTax;
  if (typeof d.assets.lifeInsuranceCashValue === "number") out.cashValue = d.assets.lifeInsuranceCashValue;
  if (typeof d.protection.lifeInsuranceFace === "number") out.face = d.protection.lifeInsuranceFace;
  if (typeof d.assets.cash === "number") out.savings = d.assets.cash;
  const nw = netWorth(d);
  if (nw > 0) out.estate = nw;
  out.filing = d.profile.filing;
  return out;
}

// ─── A pause the person chose, and the public edition's check-ins ────────────

const PAUSE_KEY = "drbuddy.finance.pause.v1";
/** Written by /progress in the public wellness edition (WellnessProgressCheckIn). */
export const WELLNESS_CHECKINS_KEY = "doctorbuddy-wellness-checkins-v1";

export function loadPause(): SelfPause | null {
  try {
    const raw = localStorage.getItem(PAUSE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<SelfPause>;
    if (typeof p?.startedAt !== "number" || typeof p?.days !== "number") return null;
    if (!Number.isFinite(p.startedAt) || !Number.isFinite(p.days) || p.days <= 0) return null;
    return { startedAt: p.startedAt, days: Math.min(p.days, MAX_PAUSE_DAYS) };
  } catch {
    return null;
  }
}

export function savePause(p: SelfPause): boolean {
  try {
    localStorage.setItem(PAUSE_KEY, JSON.stringify({ startedAt: p.startedAt, days: Math.max(1, Math.min(p.days, MAX_PAUSE_DAYS)) }));
    return true;
  } catch {
    return false;
  }
}

export function clearPause(): void {
  try { localStorage.removeItem(PAUSE_KEY); } catch { /* nothing to clear */ }
}

/** The raw check-in list; the evidence adapter validates every entry. */
export function loadWellnessCheckins(): unknown {
  try {
    const raw = localStorage.getItem(WELLNESS_CHECKINS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
