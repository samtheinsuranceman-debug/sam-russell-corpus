// ============================================================
// THE RENTAL ENTERPRISE — one plan, every moving part, wired to the record.
//
// Given what the client has (income, cash, credit, debts) and what the Zip
// Engine knows (every zip's typical value, rent, appreciation over the
// chosen window, and the county's hazard record), this engine:
//   1. sizes the purchasing power from the client's own numbers and the
//      lender's published limits;
//   2. picks candidates two ways with the same purchasing power — one large
//      property in the strongest zip, or three to four smaller ones across
//      the strongest zips (a wider resale market);
//   3. dates the purchases (staggered by months), writes each loan (amount,
//      rate from the record, interest-only or amortising, total interest),
//      and runs a 20- or 30-year pro-forma per property and for the whole
//      enterprise: rent from the zip's record grown at the zip's rent trend,
//      value grown at the zip's appreciation over the window the client
//      chose (six years since COVID, or the whole record), expenses grown at
//      the CPI ladder, the hundred hours of material participation, cost
//      segregation and bonus depreciation, and the tax saved at the client's
//      marginal rate;
//   4. recycles that tax-free cash through the trust: premiums into an
//      indexed universal life policy credited by the backtester's history,
//      policy loans out to the trustee, principal-only payments on the
//      properties, and a new policy each time the loan capacity allows it.
// Every number is arithmetic on the inputs printed above the table or on a
// series read from a named public file; nothing is estimated for the client.
// ============================================================
import { amortisation, lookbackRates, valueAt, lastYear, type AnnualSeries } from "./zipEngine";

// ─── Inputs ─────────────────────────────────────────────────────────────────
export type ZipCandidate = {
  zip: string; state?: string; city?: string; county?: string; metro?: string;
  /** Typical home value, latest year of the Zillow record (dollars). */
  value: number; valueYear: number;
  /** Typical monthly rent, latest year of the Zillow rent record (dollars), when published. */
  rent: number | null; rentYear: number | null;
  /** Annualised appreciation over the chosen window (fraction) and over the whole record. */
  appreciationWindow: number | null; appreciationRecord: number | null; windowYears: number;
  /** Annualised rent growth over the record (fraction), when published. */
  rentGrowth: number | null;
  /** Worst peak-to-trough fall in the record (fraction, negative). */
  worstDrawdown: number | null;
  /** FEMA National Risk Index for the county: overall rating and the hazards that matter to a landlord (ratings as published, 'Very High' … 'Very Low'). */
  hazard?: { rating: string; expectedAnnualLossBuilding: number | null; hail: string | null; wildfire: string | null; riverineFlood: string | null; coastalFlood: string | null; hurricane: string | null; tornado: string | null; source: string; asOf: string } | null;
};

export type Capacity = {
  annualIncome: number; cashAvailable: number; monthlyDebts: number; creditScore: number | null;
  /** Lender rules the client agreed to: max debt-to-income, min down on an investment property. Cited on the page. */
  maxDti: number; minDownPct: number; closingPct: number; reservesMonths: number;
  /** Rate for a new loan today, from the record (Freddie Mac PMMS, plus the investor spread the client typed). */
  ratePct: number; termYears: number;
};
export type CapacityResult = {
  cashLimitedPrice: number; incomeLimitedPrice: number; purchasingPower: number; bindingConstraint: "cash" | "income";
  lines: string[];
};

/** Purchasing power from the client's own numbers: cash carries down + closing + reserves; income carries the payment under the DTI cap. The smaller wins and is named. */
export function purchasingPower(c: Capacity, opts: { grossRentCreditPct?: number; estRentPerMonth?: number; taxInsPctOfPrice?: number } = {}): CapacityResult {
  const down = c.minDownPct / 100, close = c.closingPct / 100;
  const reserves = c.reservesMonths; // months of PITI held back
  // Cash: price × (down + close) + reserves × monthly payment(price) ≤ cash. Solve by iteration.
  const payFor = (price: number) => amortisation(price * (1 - down), c.ratePct, c.termYears).monthlyPayment + price * ((opts.taxInsPctOfPrice ?? 1.5) / 100) / 12;
  let lo = 0, hi = 50_000_000;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (mid * (down + close) + reserves * payFor(mid) <= c.cashAvailable) lo = mid; else hi = mid; }
  const cashLimitedPrice = Math.floor(lo);
  // Income: (existing debts + new payment − rent credit) ≤ DTI × monthly income.
  const monthlyIncome = c.annualIncome / 12;
  const rentCredit = (opts.estRentPerMonth ?? 0) * ((opts.grossRentCreditPct ?? 75) / 100);
  const room = c.maxDti * monthlyIncome - c.monthlyDebts + rentCredit;
  lo = 0; hi = 50_000_000;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (payFor(mid) <= room) lo = mid; else hi = mid; }
  const incomeLimitedPrice = Math.max(0, Math.floor(lo));
  const purchasing = Math.min(cashLimitedPrice, incomeLimitedPrice);
  const binding = cashLimitedPrice <= incomeLimitedPrice ? "cash" : "income";
  return {
    cashLimitedPrice, incomeLimitedPrice, purchasingPower: purchasing, bindingConstraint: binding,
    lines: [
      `Cash ${Math.round(c.cashAvailable).toLocaleString("en-US")} carries ${c.minDownPct}% down, ${c.closingPct}% closing and ${reserves} months of payments: price up to ${cashLimitedPrice.toLocaleString("en-US")}.`,
      `Income ${Math.round(c.annualIncome).toLocaleString("en-US")} a year with ${Math.round(c.monthlyDebts).toLocaleString("en-US")} a month of existing debt, at a ${Math.round(c.maxDti * 100)}% debt-to-income cap${rentCredit ? ` and ${Math.round(rentCredit).toLocaleString("en-US")} a month of rent credited` : ""}: price up to ${incomeLimitedPrice.toLocaleString("en-US")}.`,
      `Purchasing power ${purchasing.toLocaleString("en-US")}; the ${binding} rule binds.`,
    ],
  };
}

// ─── Candidate scoring ──────────────────────────────────────────────────────
export type Scored = ZipCandidate & { grossYield: number | null; score: number | null; reasons: string[] };

/** Score = gross rent yield + appreciation over the window − a hazard penalty − a drawdown penalty; every term is shown. Zips without a rent record cannot be scored for income and are kept only if the caller allows. */
export function scoreCandidates(cands: ZipCandidate[], opts: { hazardPenalty?: Partial<Record<string, number>>; requireRent?: boolean } = {}): Scored[] {
  const pen = { "Very High": 0.02, "Relatively High": 0.01, "Relatively Moderate": 0.005, "Relatively Low": 0, "Very Low": 0, ...(opts.hazardPenalty ?? {}) } as Record<string, number>;
  return cands.map((c) => {
    const grossYield = c.rent != null && c.value > 0 ? (c.rent * 12) / c.value : null;
    const reasons: string[] = [];
    if (grossYield == null) { reasons.push("no rent record for this zip"); return { ...c, grossYield, score: opts.requireRent === false && c.appreciationWindow != null ? c.appreciationWindow : null, reasons }; }
    let score = grossYield + (c.appreciationWindow ?? 0);
    reasons.push(`gross yield ${(grossYield * 100).toFixed(1)}%`, `appreciation ${((c.appreciationWindow ?? 0) * 100).toFixed(1)}%/yr over ${c.windowYears} years`);
    if (c.hazard?.rating && pen[c.hazard.rating]) { score -= pen[c.hazard.rating]!; reasons.push(`FEMA risk ${c.hazard.rating}: −${(pen[c.hazard.rating]! * 100).toFixed(1)}`); }
    if (c.worstDrawdown != null && c.worstDrawdown < -0.2) { score -= 0.005; reasons.push(`worst fall ${(c.worstDrawdown * 100).toFixed(0)}%: −0.5`); }
    return { ...c, grossYield, score, reasons };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

/** Plan A: one property near the full purchasing power, in the best-scoring zip whose typical value fits within ±30% of the budget. Plan B: n properties of budget ÷ n across the n best distinct zips that fit. */
export function pickPlans(scored: Scored[], budget: number, opts: { count?: number; tolerance?: number } = {}): { one: Scored | null; several: Scored[]; note: string } {
  const tol = opts.tolerance ?? 0.3, n = opts.count ?? 4;
  const fits = (c: Scored, target: number) => c.score != null && c.value >= target * (1 - tol) && c.value <= target * (1 + tol);
  const one = scored.find((c) => fits(c, budget)) ?? null;
  const each = budget / n;
  const several: Scored[] = [];
  for (const c of scored) { if (several.length >= n) break; if (fits(c, each) && !several.some((s) => s.zip === c.zip)) several.push(c); }
  return { one, several, note: `Plan A takes the best zip whose typical home is within ${Math.round(tol * 100)}% of ${Math.round(budget).toLocaleString("en-US")}. Plan B spreads the same money over ${n} zips whose typical home is near ${Math.round(each).toLocaleString("en-US")} each; a smaller house sells into a far wider pool of buyers, so its resale is the more permanent of the two.` };
}

// ─── The loan, month by month ───────────────────────────────────────────────
export type LoanTerms = { principal: number; ratePct: number; termYears: number; interestOnlyYears: number; startYear: number; startMonth: number };
export type LoanYear = { year: number; interest: number; principal: number; payment: number; balance: number; extraPrincipal: number };

/** Interest-only for the first N years (payment = interest), then level amortisation over the remaining term. Extra principal, when given per year, shortens the loan; the schedule stops when paid. */
export function loanSchedule(t: LoanTerms, years: number, extraPrincipalByYear: Record<number, number> = {}): { years: LoanYear[]; totalInterest: number; paidOffYear: number | null; monthlyPaymentAmortising: number } {
  const r = t.ratePct / 100 / 12;
  const amortMonths = (t.termYears - t.interestOnlyYears) * 12;
  const { monthlyPayment: amortPay } = amortisation(t.principal, t.ratePct, t.termYears - t.interestOnlyYears);
  let bal = t.principal, totalInterest = 0, paidOffYear: number | null = null;
  const out: LoanYear[] = [];
  let m = 0; // months elapsed since the loan began
  for (let y = 1; y <= years; y++) {
    let i = 0, p = 0, pay = 0;
    const extra = extraPrincipalByYear[t.startYear + y - 1] ?? 0;
    for (let k = 0; k < 12 && bal > 0.005; k++, m++) {
      const im = bal * r;
      const inIo = m < t.interestOnlyYears * 12;
      const pm = inIo ? 0 : Math.min(bal, amortPay - im);
      i += im; p += pm; pay += im + pm; bal -= pm;
    }
    if (extra > 0 && bal > 0) { const e = Math.min(extra, bal); bal -= e; p += e; }
    totalInterest += i;
    out.push({ year: t.startYear + y - 1, interest: i, principal: p, payment: pay, balance: Math.max(0, bal), extraPrincipal: extra });
    if (bal <= 0.005 && paidOffYear == null) { paidOffYear = t.startYear + y - 1; }
    if (m >= t.termYears * 12 && bal > 0.005) { /* loan ran past its term with IO period: remaining balance is the balloon */ }
    if (amortMonths <= 0 && m >= t.termYears * 12) break;
  }
  return { years: out, totalInterest, paidOffYear, monthlyPaymentAmortising: amortPay };
}

// ─── One property, year by year ─────────────────────────────────────────────
export type PropertyPlan = {
  zip: string; label: string; price: number; purchaseYear: number; purchaseMonth: number;
  downPct: number; closingPct: number; furnishing: number;
  loan: LoanTerms;
  /** Income: long-term rent from the record, or the short-term figures the client read from a registry site. */
  income: { kind: "ltr" | "str"; monthlyRent?: number; nightlyRate?: number; occupancyPct?: number; source: string; asOf: string };
  rentGrowthPct: number; appreciationPct: number; expenseGrowthPct: number;
  costs: { propertyTaxPct: number; insurancePerYear: number; hoaPerYear: number; maintenancePct: number; managementPct: number; utilitiesPerYear: number; platformFeePct: number; cleaningPerYear: number };
  tax: { buildingSharePct: number; costSegSharePct: number; bonusPct: number; marginalRatePct: number; depreciationYears: number };
};
export type PropertyYear = {
  year: number; owned: boolean; gross: number; operating: number; noi: number; interest: number; principal: number; extraPrincipal: number; cashFlow: number;
  depreciation: number; taxable: number; taxEffect: number; afterTax: number; value: number; loanBalance: number; equity: number;
};

export function runProperty(p: PropertyPlan, horizonYears: number, throughYear: number, extraPrincipalByYear: Record<number, number> = {}): { years: PropertyYear[]; loan: ReturnType<typeof loanSchedule>; cashInvested: number } {
  const sched = loanSchedule(p.loan, horizonYears, extraPrincipalByYear);
  const cashInvested = p.price * (p.downPct / 100) + p.price * (p.closingPct / 100) + p.furnishing;
  const depreciable = p.price * (p.tax.buildingSharePct / 100);
  const segregated = depreciable * (p.tax.costSegSharePct / 100);            // 5/7/15-year property found by the study
  const bonusYear1 = segregated * (p.tax.bonusPct / 100) + p.furnishing * (p.tax.bonusPct / 100);
  const straight = (depreciable - segregated) / p.tax.depreciationYears;      // the building's remaining basis
  const years: PropertyYear[] = [];
  let value = p.price;
  const firstYear = p.purchaseYear;
  for (let y = firstYear; y <= throughYear; y++) {
    const k = y - firstYear; // years since purchase, 0 = purchase year
    const owned = true;
    const monthsOwned = k === 0 ? 13 - p.purchaseMonth : 12; // purchase month counts
    const g = Math.pow(1 + p.rentGrowthPct / 100, k), e = Math.pow(1 + p.expenseGrowthPct / 100, k);
    value = k === 0 ? p.price * Math.pow(1 + p.appreciationPct / 100, monthsOwned / 12) : value * (1 + p.appreciationPct / 100);
    const grossFull = p.income.kind === "str" ? 365 * ((p.income.occupancyPct ?? 0) / 100) * (p.income.nightlyRate ?? 0) : 12 * (p.income.monthlyRent ?? 0);
    const gross = grossFull * g * (monthsOwned / 12);
    const c = p.costs;
    const operating = gross * ((c.managementPct + c.platformFeePct) / 100) + (c.insurancePerYear + c.hoaPerYear + c.utilitiesPerYear + c.cleaningPerYear) * e * (monthsOwned / 12) + value * ((c.propertyTaxPct + c.maintenancePct) / 100) * (monthsOwned / 12);
    const noi = gross - operating;
    const ly = sched.years[k];
    const interest = ly?.interest ?? 0, principal = ly?.principal ?? 0, extra = ly?.extraPrincipal ?? 0;
    const cashFlow = noi - interest - (principal - extra);
    const dep = k === 0 ? bonusYear1 + straight * (monthsOwned / 12) : k < p.tax.depreciationYears ? straight : 0;
    const taxable = noi - interest - dep;
    const taxEffect = taxable * (p.tax.marginalRatePct / 100); // negative = tax saved (sheltering other income under the STR rule)
    years.push({ year: y, owned, gross, operating, noi, interest, principal, extraPrincipal: extra, cashFlow, depreciation: dep, taxable, taxEffect, afterTax: cashFlow - taxEffect, value, loanBalance: ly?.balance ?? 0, equity: value - (ly?.balance ?? 0) });
  }
  return { years, loan: sched, cashInvested };
}

// ─── The trust loop: tax saved → IUL premium → policy loan → principal ───────
export type IulAssumption = {
  /** Credited rate each policy year, as a fraction, from the backtester's crediting history for the chosen index option and start year; or one flat rate. */
  creditedByYear: (policyYear: number) => number;
  /** Charges as a share of premium in the first years and of cash value after, as the carrier's own illustration shows; typed. */
  premiumLoadPct: number; annualChargePctOfValue: number;
  /** Policy loan rate and the first policy year a loan may be taken (1 if the carrier allows first-year loans). */
  loanRatePct: number; firstLoanYear: number; maxLoanPctOfValue: number;
  /** A new policy is opened when a year's available premium exceeds this. */
  newPolicyThreshold: number;
};
export type Policy = { openedYear: number; premiumsPaid: number; cashValue: number; loanBalance: number };
export type LoopYear = { year: number; premiumIn: number; policies: number; cashValue: number; loansTaken: number; loanBalance: number; toPrincipal: number; netValue: number };

/** Each year: the enterprise's tax-free cash (tax saved plus any after-tax cash the client assigns) becomes premium into the trust's policies; the trustee borrows against cash value up to the cap and pays principal on the properties; the loop's state is returned year by year. */
export function trustLoop(years: number[], premiumByYear: (year: number) => number, a: IulAssumption, opts: { paydownSharePct?: number } = {}): { years: LoopYear[]; extraPrincipalByYear: Record<number, number>; policies: Policy[] } {
  const policies: Policy[] = [];
  const extraPrincipalByYear: Record<number, number> = {};
  const out: LoopYear[] = [];
  for (const y of years) {
    const premium = Math.max(0, premiumByYear(y));
    let target = policies[policies.length - 1];
    if (!target || premium >= a.newPolicyThreshold) { target = { openedYear: y, premiumsPaid: 0, cashValue: 0, loanBalance: 0 }; policies.push(target); }
    let loansTaken = 0, toPrincipal = 0;
    for (const p of policies) {
      const isTarget = p === target;
      const prem = isTarget ? premium : 0;
      const policyYear = y - p.openedYear + 1;
      p.premiumsPaid += prem;
      p.cashValue += prem * (1 - a.premiumLoadPct / 100);
      p.cashValue *= 1 + a.creditedByYear(policyYear);
      p.cashValue -= p.cashValue * (a.annualChargePctOfValue / 100);
      p.loanBalance *= 1 + a.loanRatePct / 100;
      if (policyYear >= a.firstLoanYear) {
        const cap = p.cashValue * (a.maxLoanPctOfValue / 100) - p.loanBalance;
        const take = Math.max(0, cap) * ((opts.paydownSharePct ?? 100) / 100);
        if (take > 0) { p.loanBalance += take; loansTaken += take; toPrincipal += take; }
      }
    }
    extraPrincipalByYear[y] = toPrincipal;
    const cashValue = policies.reduce((s, p) => s + p.cashValue, 0), loanBalance = policies.reduce((s, p) => s + p.loanBalance, 0);
    out.push({ year: y, premiumIn: premium, policies: policies.length, cashValue, loansTaken, loanBalance, toPrincipal, netValue: cashValue - loanBalance });
  }
  return { years: out, extraPrincipalByYear, policies };
}

// ─── The enterprise: all properties, the loop, the totals ───────────────────
export type EnterpriseInput = { properties: PropertyPlan[]; horizonYears: number; startYear: number; iul: IulAssumption | null; assignAfterTaxCashPct: number };
export type EnterpriseYear = { year: number; gross: number; operating: number; noi: number; interest: number; principal: number; cashFlow: number; depreciation: number; taxSaved: number; afterTax: number; value: number; debt: number; equity: number; premiumIn: number; policyValue: number; policyLoans: number; toPrincipal: number; netWorth: number };
export type Enterprise = { years: EnterpriseYear[]; perProperty: Array<{ plan: PropertyPlan; result: ReturnType<typeof runProperty> }>; loop: ReturnType<typeof trustLoop> | null; totals: { interestPaidWithoutLoop: number; interestPaidWithLoop: number; interestSaved: number; taxSaved: number; cashInvested: number; endEquity: number; endNetWorth: number; firstPayoffYear: number | null; hoursPerYear: number } };

/** Two passes: first without the loop to know the tax saved each year, then with the loop paying principal from policy loans. The difference in interest is the loop's contribution. */
export function runEnterprise(x: EnterpriseInput): Enterprise {
  const endYear = x.startYear + x.horizonYears - 1;
  const years = Array.from({ length: x.horizonYears }, (_, i) => x.startYear + i);
  const base = x.properties.map((plan) => ({ plan, result: runProperty(plan, x.horizonYears, endYear) }));
  const taxSavedByYear: Record<number, number> = {}, afterTaxByYear: Record<number, number> = {};
  for (const y of years) { taxSavedByYear[y] = 0; afterTaxByYear[y] = 0; for (const b of base) { const r = b.result.years.find((k) => k.year === y); if (r) { taxSavedByYear[y]! += Math.max(0, -r.taxEffect); afterTaxByYear[y]! += r.afterTax; } } }
  let loop: ReturnType<typeof trustLoop> | null = null;
  let perProperty = base;
  if (x.iul) {
    loop = trustLoop(years, (y) => (taxSavedByYear[y] ?? 0) + Math.max(0, afterTaxByYear[y] ?? 0) * (x.assignAfterTaxCashPct / 100), x.iul);
    // Split each year's principal paydown across properties by remaining balance, largest first.
    const extraFor = (plan: PropertyPlan): Record<number, number> => {
      const out: Record<number, number> = {};
      for (const y of years) {
        const total = loop!.extraPrincipalByYear[y] ?? 0; if (!total) continue;
        const balances = base.map((b) => ({ zip: b.plan.zip, bal: b.result.years.find((k) => k.year === y)?.loanBalance ?? 0 }));
        const sum = balances.reduce((s, b) => s + b.bal, 0); if (sum <= 0) continue;
        out[y] = total * ((balances.find((b) => b.zip === plan.zip)?.bal ?? 0) / sum);
      }
      return out;
    };
    perProperty = x.properties.map((plan) => ({ plan, result: runProperty(plan, x.horizonYears, endYear, extraFor(plan)) }));
  }
  const rows: EnterpriseYear[] = years.map((y) => {
    const acc = { year: y, gross: 0, operating: 0, noi: 0, interest: 0, principal: 0, cashFlow: 0, depreciation: 0, taxSaved: 0, afterTax: 0, value: 0, debt: 0, equity: 0, premiumIn: 0, policyValue: 0, policyLoans: 0, toPrincipal: 0, netWorth: 0 };
    for (const p of perProperty) { const r = p.result.years.find((k) => k.year === y); if (!r) continue; acc.gross += r.gross; acc.operating += r.operating; acc.noi += r.noi; acc.interest += r.interest; acc.principal += r.principal; acc.cashFlow += r.cashFlow; acc.depreciation += r.depreciation; acc.taxSaved += Math.max(0, -r.taxEffect); acc.afterTax += r.afterTax; acc.value += r.value; acc.debt += r.loanBalance; acc.equity += r.equity; }
    const l = loop?.years.find((k) => k.year === y);
    if (l) { acc.premiumIn = l.premiumIn; acc.policyValue = l.cashValue; acc.policyLoans = l.loanBalance; acc.toPrincipal = l.toPrincipal; }
    acc.netWorth = acc.equity + acc.policyValue - acc.policyLoans;
    return acc;
  });
  const interestWithout = base.reduce((s, b) => s + b.result.loan.totalInterest, 0);
  const interestWith = perProperty.reduce((s, b) => s + b.result.loan.totalInterest, 0);
  const payoffs = perProperty.map((p) => p.result.loan.paidOffYear).filter((v): v is number => v != null);
  const last = rows[rows.length - 1];
  return { years: rows, perProperty, loop, totals: { interestPaidWithoutLoop: interestWithout, interestPaidWithLoop: interestWith, interestSaved: interestWithout - interestWith, taxSaved: rows.reduce((s, r) => s + r.taxSaved, 0), cashInvested: perProperty.reduce((s, p) => s + p.result.cashInvested, 0), endEquity: last?.equity ?? 0, endNetWorth: last?.netWorth ?? 0, firstPayoffYear: payoffs.length ? Math.min(...payoffs) : null, hoursPerYear: MATERIAL_PARTICIPATION_HOURS } };
}

/** The hundred hours: the test the plan is built to satisfy, with the log the client keeps. */
export const MATERIAL_PARTICIPATION_HOURS = 100;
export const PARTICIPATION_LOG = [
  "Recorded calls with guests and tenants (booking, questions, complaints)",
  "Screen recordings of listing, pricing and marketing work on the computer",
  "Calls and visits with cleaners between stays; walk-throughs after turnovers",
  "Bookkeeping, tax records, insurance and HOA correspondence",
  "Repairs arranged and inspected; supplies bought and restocked",
];
export const PARTICIPATION_SOURCES = [
  { label: "Treas. Reg. §1.469-5T(a): the seven material-participation tests, including 100 hours and more than any other individual", url: "https://www.law.cornell.edu/cfr/text/26/1.469-5T" },
  { label: "Treas. Reg. §1.469-1T(e)(3)(ii)(A): an average customer use of seven days or less is not a rental activity", url: "https://www.law.cornell.edu/cfr/text/26/1.469-1T" },
  { label: "IRC §168(k) as amended by the One Big Beautiful Bill Act §70301: 100% bonus depreciation for property acquired after 19 January 2025", url: "https://www.law.cornell.edu/uscode/text/26/168" },
];

/** A candidate from the Zip Engine's stored series, so the page and the server build it the same way. */
export function candidateFromSeries(zip: string, s: { levels: AnnualSeries | null; rent: AnnualSeries | null; meta?: { state?: string; city?: string; county?: string; metro?: string } | null; worstDrawdown?: number | null }, windowYears: number): ZipCandidate | null {
  if (!s.levels) return null;
  const ly = lastYear(s.levels); if (ly == null) return null;
  const value = valueAt(s.levels, ly); if (value == null) return null;
  const lb = lookbackRates(s.levels, [windowYears]);
  const rec = lookbackRates(s.levels, [Math.max(1, ly - s.levels.startYear)]);
  const rentYear = s.rent ? lastYear(s.rent) : null;
  const rent = s.rent && rentYear != null ? valueAt(s.rent, rentYear) : null;
  const rg = s.rent && rentYear != null ? lookbackRates(s.rent, [Math.max(1, rentYear - s.rent.startYear)]) : {};
  return { zip, state: s.meta?.state, city: s.meta?.city, county: s.meta?.county, metro: s.meta?.metro, value, valueYear: ly, rent, rentYear, appreciationWindow: lb[windowYears] ?? null, appreciationRecord: Object.values(rec)[0] ?? null, windowYears, rentGrowth: Object.values(rg)[0] ?? null, worstDrawdown: s.worstDrawdown ?? null };
}
