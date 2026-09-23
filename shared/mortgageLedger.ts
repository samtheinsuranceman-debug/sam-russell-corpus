// ============================================================
// THE MORTGAGE LEDGER — what the loan is actually doing, month by month.
//
// shared/mortgageKiller.ts models a STRATEGY: the recycle cycle, the policy
// flows, the HELOC. This file models the LOAN ITSELF, which nothing did. You
// cannot argue about a strategy until the client can see, in their own
// numbers, that the payment they have been making for nine years is still
// mostly interest.
//
// Everything here is closed-form or a straight month-by-month walk. No
// assumptions are hidden: the only inputs are balance, rate, payment and
// term, all four of which sit on the statement the client already has.
//
// THE ARITHMETIC
//   Monthly rate i = APR / 12. This is the US convention for a fixed-rate
//   fully amortising mortgage: 12 equal compounding periods, not an effective
//   annual rate. A statement's stated rate is the APR.
//
//   Interest for a month = balance * i.           <- the "interest-only" figure
//   Principal for a month = payment - interest.   <- what actually reduces debt
//
//   Payment that fully amortises B over n months:
//       P = B * i / (1 - (1+i)^-n)      (i > 0)
//       P = B / n                       (i = 0)
//
//   Months remaining at a given payment:
//       n = -ln(1 - B*i/P) / ln(1+i)
//   which is undefined when P <= B*i — the payment does not even cover the
//   interest and the loan never retires. That case is reported, not crashed
//   on, because it is real: it is what an interest-only loan is.
// ============================================================

export type LoanInput = {
  /** Current principal balance. */
  balance: number;
  /** Annual rate as a decimal, e.g. 0.0645. */
  annualRate: number;
  /** Scheduled monthly principal and interest. Escrow is NOT part of this. */
  monthlyPayment: number;
  /** Months left on the note per the statement. Used to cross-check the payment. */
  termMonthsRemaining: number;
  /** Extra principal paid every month, on top of the scheduled payment. */
  extraMonthly?: number;
  /** Monthly escrow (taxes and insurance). Carried for the full housing figure; never amortised. */
  monthlyEscrow?: number;
};

export type LedgerMonth = {
  month: number;
  openingBalance: number;
  interest: number;
  principal: number;
  extra: number;
  payment: number;
  closingBalance: number;
  /** Share of this month's payment that is interest. The number that changes the conversation. */
  interestShare: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
};

export type PayoffSummary = {
  monthsToPayoff: number | null;
  yearsToPayoff: number | null;
  totalInterest: number;
  totalPaid: number;
  /** True when the payment does not cover the interest and the balance never retires. */
  neverAmortises: boolean;
  /** The month the payment first puts more toward principal than interest. Null if it already does, or never. */
  crossoverMonth: number | null;
};

const EPS = 1e-9;

/**
 * The longest schedule anyone will ever read, and the horizon beyond which a
 * loan is not meaningfully amortising. 1,200 months is a hundred years. A
 * payment that clears the interest by a few dollars produces a term in the
 * hundreds of years, which is arithmetically true and practically the same as
 * never — so it is reported as never, once, by every function here rather
 * than differently by each.
 */
export const MAX_HORIZON_MONTHS = 1_200;

/**
 * The monthly-rate convention (APR / 12) is a rule, not a choice: Regulation Z
 * defines the annual percentage rate as the unit-period rate times the number
 * of unit-periods in a year, and treats all months as equal.
 */
const MONTHLY_RATE_RULE = {
  label: "Consumer Financial Protection Bureau, Regulation Z, 12 CFR Part 1026, Appendix J (Annual Percentage Rate Computations for Closed-End Credit Transactions), paragraph (b)(1) (APR = unit-period rate x unit-periods per year) and (b)(3)(iv) (all months considered equal)",
  url: "https://www.consumerfinance.gov/rules-policy/regulations/1026/j/",
  asOf: "current regulation, read 2026-09-23",
};
/** Why a rate above 25% is flagged as a misread: no 30-year fixed average has come near it. */
const RATE_CEILING_SOURCE = {
  label: "Freddie Mac, Primary Mortgage Market Survey: the 30-year fixed rate's record high was 18.63% (1981); the average was 6.65% on 2026-08-20",
  url: "https://myhome.freddiemac.com/buying/mortgage-rates",
  asOf: "read 2026-09-23",
};
const PMMS_SERIES_SOURCE = {
  label: "Freddie Mac, 30-Year Fixed Rate Mortgage Average in the United States (Primary Mortgage Market Survey), via FRED series MORTGAGE30US: 6.66% for the week of 2026-08-27",
  url: "https://fred.stlouisfed.org/series/MORTGAGE30US",
  asOf: "2026-08-27 observation, read 2026-09-23",
  note: "For comparison with a client's statement rate; no default rate is typed into this engine.",
};
/** For comparison with the 0.75 default in equityPosition. */
const LTV_REFERENCE_SOURCE = {
  label: "Fannie Mae, Eligibility Matrix (incorporated in the Selling Guide): maximum LTV 80% for a one-unit principal residence cash-out refinance, 75% for a one-unit investment property",
  url: "https://singlefamily.fanniemae.com/media/20786/display",
  asOf: "matrix dated 2026-08-05, read 2026-09-23",
  note: "equityPosition defaults to 75%, five points below the principal-residence cash-out ceiling.",
};

export function monthlyRate(annualRate: number): number {
  return annualRate / 12;
}

/** Interest for one month on a balance. This IS the interest-only payment. */
export function interestOnlyPayment(balance: number, annualRate: number): number {
  return balance * monthlyRate(annualRate);
}

/** The payment that fully retires `balance` over `months`. */
export function amortisingPayment(balance: number, annualRate: number, months: number): number {
  if (months <= 0) return balance;
  const i = monthlyRate(annualRate);
  if (Math.abs(i) < EPS) return balance / months;
  return (balance * i) / (1 - Math.pow(1 + i, -months));
}

/**
 * Months to retire `balance` at `payment`.
 *
 * Returns null when the payment does not exceed the first month's interest —
 * the loan never amortises. That is not an error state; it is what an
 * interest-only loan is, and the page says so in those words.
 */
export function monthsToPayoff(balance: number, annualRate: number, payment: number): number | null {
  if (balance <= 0) return 0;
  const i = monthlyRate(annualRate);
  if (Math.abs(i) < EPS) return payment > 0 ? Math.ceil(balance / payment) : null;
  if (payment <= balance * i + EPS) return null;
  const months = Math.ceil(-Math.log(1 - (balance * i) / payment) / Math.log(1 + i));
  return months > MAX_HORIZON_MONTHS ? null : months;
}

/**
 * The month-by-month walk.
 *
 * Capped at MAX_HORIZON_MONTHS so a pathological input cannot spin. The cap is
 * only ever reached by a loan `monthsToPayoff` has already reported as null,
 * because both use the same horizon.
 */
export function buildLedger(input: LoanInput, maxMonths = MAX_HORIZON_MONTHS): LedgerMonth[] {
  const i = monthlyRate(input.annualRate);
  const extra = Math.max(0, input.extraMonthly ?? 0);
  const rows: LedgerMonth[] = [];
  let balance = input.balance;
  let cumInterest = 0;
  let cumPrincipal = 0;

  for (let m = 1; m <= maxMonths && balance > 0.005; m++) {
    const interest = balance * i;
    // The final month pays only what is left, never more.
    const scheduledPrincipal = Math.min(Math.max(0, input.monthlyPayment - interest), balance);
    const extraPrincipal = Math.min(extra, Math.max(0, balance - scheduledPrincipal));
    const principal = scheduledPrincipal + extraPrincipal;
    const closing = balance - principal;
    const payment = interest + principal;

    cumInterest += interest;
    cumPrincipal += principal;
    rows.push({
      month: m, openingBalance: balance, interest, principal: scheduledPrincipal, extra: extraPrincipal,
      payment, closingBalance: closing,
      interestShare: payment > 0 ? interest / payment : 0,
      cumulativeInterest: cumInterest, cumulativePrincipal: cumPrincipal,
    });

    // A payment that does not cover interest leaves the balance growing; stop
    // rather than walking a hundred years of it.
    if (principal <= 0) break;
    balance = closing;
  }
  return rows;
}

export function summarise(input: LoanInput): PayoffSummary {
  const totalPayment = input.monthlyPayment + Math.max(0, input.extraMonthly ?? 0);
  const months = monthsToPayoff(input.balance, input.annualRate, totalPayment);
  if (months == null) {
    return {
      monthsToPayoff: null, yearsToPayoff: null,
      totalInterest: Number.POSITIVE_INFINITY, totalPaid: Number.POSITIVE_INFINITY,
      neverAmortises: true, crossoverMonth: null,
    };
  }
  const rows = buildLedger(input);
  const last = rows[rows.length - 1];
  const crossover = rows.find((r) => r.principal + r.extra > r.interest);
  const alreadyPrincipalHeavy = rows[0] ? rows[0].principal + rows[0].extra > rows[0].interest : false;
  return {
    monthsToPayoff: rows.length,
    yearsToPayoff: rows.length / 12,
    totalInterest: last?.cumulativeInterest ?? 0,
    totalPaid: (last?.cumulativeInterest ?? 0) + (last?.cumulativePrincipal ?? 0),
    neverAmortises: false,
    crossoverMonth: alreadyPrincipalHeavy ? null : (crossover?.month ?? null),
  };
}

/* ----------------------------------------------------------------
   WHERE THE PAYMENT IS GOING RIGHT NOW.
   The single most useful screen: of the payment made this month, how much
   is rent on the money and how much is buying the house.
------------------------------------------------------------------- */

export type PaymentSplit = {
  interest: number;
  principal: number;
  escrow: number;
  /** Principal + interest. What the note calls the payment. */
  principalAndInterest: number;
  /** Including escrow. What actually leaves the account. */
  totalOutlay: number;
  /** Interest ÷ principal-and-interest. */
  interestShare: number;
  principalShare: number;
  /** Interest expressed as a daily figure — it lands harder than a monthly one. */
  interestPerDay: number;
  /** Plain-language reading of the split. */
  reading: string;
};

export function splitThisMonth(input: LoanInput): PaymentSplit {
  const interest = interestOnlyPayment(input.balance, input.annualRate);
  const principal = Math.max(0, input.monthlyPayment - interest);
  const escrow = Math.max(0, input.monthlyEscrow ?? 0);
  const pi = interest + principal;
  const share = pi > 0 ? interest / pi : 0;
  const pct = Math.round(share * 100);
  const reading =
    principal <= 0
      ? `The scheduled payment does not cover this month's interest of ${fmt(interest)}. The balance is growing, not shrinking.`
      : share >= 0.75
      ? `${pct} cents of every dollar is interest. This payment is still overwhelmingly rent on the money rather than ownership of the house.`
      : share >= 0.5
      ? `${pct} cents of every dollar is interest — the loan has not yet crossed over to paying more principal than interest.`
      : `${pct} cents of every dollar is interest. The loan has crossed over; most of the payment now buys the house.`;
  return {
    interest, principal, escrow, principalAndInterest: pi,
    totalOutlay: pi + escrow,
    interestShare: share, principalShare: pi > 0 ? principal / pi : 0,
    interestPerDay: (interest * 12) / 365,
    reading,
  };
}

/* ----------------------------------------------------------------
   WHAT AN EXTRA PAYMENT BUYS.
   The client asked for the doubled-payment case specifically, and was right
   that the headline saving is smaller than the internet claims — because the
   saving is not free. It is the same money, paid earlier. The comparison
   below therefore reports BOTH the interest saved and the extra cash put in,
   so nobody mistakes one for the other.
------------------------------------------------------------------- */

export type ExtraPaymentScenario = {
  label: string;
  extraMonthly: number;
  monthsToPayoff: number | null;
  yearsToPayoff: number | null;
  totalInterest: number;
  /** Interest saved against the base case. */
  interestSaved: number;
  /** Months taken off the loan. */
  monthsSaved: number;
  /** Extra principal actually paid in over the life of the accelerated loan. */
  extraPaidIn: number;
  /**
   * Interest saved per extra dollar put in. The honest headline: below 1.0
   * the extra dollars did not "make" anything, they moved a cost forward.
   */
  savedPerDollar: number;
  /**
   * The rate of return the extra payments earned, as an annual percentage.
   * Prepaying a mortgage earns exactly the note rate, risk-free and after
   * tax only if the interest was not deductible — which is why this is
   * reported next to the note rate rather than instead of it.
   */
  effectiveAnnualReturn: number;
};

export function extraPaymentScenarios(
  base: LoanInput,
  extras: readonly { label: string; extraMonthly: number }[],
): ExtraPaymentScenario[] {
  const baseSummary = summarise({ ...base, extraMonthly: 0 });
  return extras.map(({ label, extraMonthly }) => {
    const s = summarise({ ...base, extraMonthly });
    const rows = buildLedger({ ...base, extraMonthly });
    const extraPaidIn = rows.reduce((sum, r) => sum + r.extra, 0);
    const interestSaved = Number.isFinite(baseSummary.totalInterest) && Number.isFinite(s.totalInterest)
      ? baseSummary.totalInterest - s.totalInterest : 0;
    const monthsSaved = baseSummary.monthsToPayoff != null && s.monthsToPayoff != null
      ? baseSummary.monthsToPayoff - s.monthsToPayoff : 0;
    return {
      label, extraMonthly,
      monthsToPayoff: s.monthsToPayoff, yearsToPayoff: s.yearsToPayoff,
      totalInterest: s.totalInterest,
      interestSaved, monthsSaved, extraPaidIn,
      savedPerDollar: extraPaidIn > 0 ? interestSaved / extraPaidIn : 0,
      // Prepayment earns the note rate by construction.
      effectiveAnnualReturn: base.annualRate,
    };
  });
}

/** The standard menu, including the doubled payment the client asked for. */
export function standardScenarios(base: LoanInput): ExtraPaymentScenario[] {
  const p = base.monthlyPayment;
  return extraPaymentScenarios(base, [
    { label: "+$100 a month", extraMonthly: 100 },
    { label: "+$250 a month", extraMonthly: 250 },
    { label: "+$500 a month", extraMonthly: 500 },
    { label: "Half again (1.5×)", extraMonthly: p * 0.5 },
    { label: "Double the payment (2×)", extraMonthly: p },
    { label: "One extra payment a year", extraMonthly: p / 12 },
  ]);
}

/* ----------------------------------------------------------------
   DOES THE STATEMENT ADD UP?
   An extracted statement is a set of claims. Before any of it reaches an
   engine it gets checked against itself: the payment implied by balance,
   rate and term should match the payment on the statement. When it does not,
   something was misread, the loan is not a simple fixed amortising note, or
   there is a fee inside the payment — and the client is told which rather
   than being shown a projection built on a number nobody verified.
------------------------------------------------------------------- */

export type StatementCheck = {
  ok: boolean;
  impliedPayment: number;
  statedPayment: number;
  /** Signed difference: stated minus implied. */
  difference: number;
  differencePct: number;
  /** Months the stated payment actually implies, versus the stated term. */
  impliedMonths: number | null;
  statedMonths: number;
  verdict: "consistent" | "interest-only or negative amortisation" | "payment exceeds schedule" | "payment below schedule" | "insufficient data";
  note: string;
};

/** Tolerance on the payment cross-check. 2% absorbs rounding and a small servicing fee. */
export const STATEMENT_TOLERANCE = 0.02;

export function checkStatement(input: LoanInput): StatementCheck {
  const { balance, annualRate, monthlyPayment, termMonthsRemaining } = input;
  if (balance <= 0 || annualRate < 0 || monthlyPayment <= 0 || termMonthsRemaining <= 0) {
    return {
      ok: false, impliedPayment: 0, statedPayment: monthlyPayment, difference: 0, differencePct: 0,
      impliedMonths: null, statedMonths: termMonthsRemaining, verdict: "insufficient data",
      note: "Balance, rate, payment and remaining term are all needed before anything can be checked. Whichever is missing should be read off the statement rather than estimated.",
    };
  }
  const implied = amortisingPayment(balance, annualRate, termMonthsRemaining);
  const difference = monthlyPayment - implied;
  const differencePct = implied > 0 ? difference / implied : 0;
  const impliedMonths = monthsToPayoff(balance, annualRate, monthlyPayment);
  const interestOnly = interestOnlyPayment(balance, annualRate);

  if (monthlyPayment <= interestOnly + EPS) {
    return { ok: false, impliedPayment: implied, statedPayment: monthlyPayment, difference, differencePct,
      impliedMonths, statedMonths: termMonthsRemaining, verdict: "interest-only or negative amortisation",
      note: `The payment of ${fmt(monthlyPayment)} does not exceed this month's interest of ${fmt(interestOnly)}. Either this is an interest-only loan, or the payment figure excludes principal, or the balance or rate was misread. Nothing should be projected from it until that is settled.` };
  }
  if (Math.abs(differencePct) <= STATEMENT_TOLERANCE) {
    return { ok: true, impliedPayment: implied, statedPayment: monthlyPayment, difference, differencePct,
      impliedMonths, statedMonths: termMonthsRemaining, verdict: "consistent",
      note: `The payment on the statement matches the payment that balance, rate and remaining term imply, within ${Math.round(STATEMENT_TOLERANCE * 100)}%. The figures hang together.` };
  }
  if (difference > 0) {
    return { ok: true, impliedPayment: implied, statedPayment: monthlyPayment, difference, differencePct,
      impliedMonths, statedMonths: termMonthsRemaining, verdict: "payment exceeds schedule",
      note: `The payment is ${fmt(difference)} a month above what the schedule requires. Either extra principal is already being paid — in which case the loan retires around month ${impliedMonths ?? "?"} rather than ${termMonthsRemaining} — or the figure includes escrow, which belongs in the escrow field rather than here.` };
  }
  return { ok: false, impliedPayment: implied, statedPayment: monthlyPayment, difference, differencePct,
    impliedMonths, statedMonths: termMonthsRemaining, verdict: "payment below schedule",
    note: `The payment is ${fmt(Math.abs(difference))} a month below what balance, rate and term imply. At this payment the loan runs to about month ${impliedMonths ?? "?"} rather than ${termMonthsRemaining}. Most often the rate or the remaining term was misread off the statement.` };
}

/* ----------------------------------------------------------------
   THE WHOLE PICTURE, IN ONE CALL.
------------------------------------------------------------------- */

export type MortgageLedgerReport = {
  check: StatementCheck;
  split: PaymentSplit;
  summary: PayoffSummary;
  scenarios: ExtraPaymentScenario[];
  /** The full schedule. Long; page it. */
  ledger: LedgerMonth[];
  /** Yearly roll-up, which is what anyone actually reads. */
  byYear: Array<{ year: number; interest: number; principal: number; endingBalance: number; interestShare: number }>;
  headlines: string[];
};

export function mortgageLedgerReport(input: LoanInput): MortgageLedgerReport {
  const check = checkStatement(input);
  const split = splitThisMonth(input);
  const summary = summarise(input);
  const ledger = buildLedger(input);
  const scenarios = standardScenarios(input);

  const byYear: MortgageLedgerReport["byYear"] = [];
  for (let y = 0; y * 12 < ledger.length; y++) {
    const slice = ledger.slice(y * 12, y * 12 + 12);
    const interest = slice.reduce((s, r) => s + r.interest, 0);
    const principal = slice.reduce((s, r) => s + r.principal + r.extra, 0);
    byYear.push({
      year: y + 1, interest, principal,
      endingBalance: slice[slice.length - 1]?.closingBalance ?? 0,
      interestShare: interest + principal > 0 ? interest / (interest + principal) : 0,
    });
  }

  const headlines: string[] = [];
  headlines.push(split.reading);
  if (summary.neverAmortises) {
    headlines.push("At this payment the balance never retires. The loan is interest-only in effect, whatever it is called.");
  } else {
    headlines.push(`On pace, this loan retires in ${Math.floor(summary.monthsToPayoff! / 12)} years and ${summary.monthsToPayoff! % 12} months, with ${fmt(summary.totalInterest)} of interest still to pay from here.`);
    if (summary.crossoverMonth != null) {
      const y = Math.floor(summary.crossoverMonth / 12), m = summary.crossoverMonth % 12;
      headlines.push(`The payment does not start putting more toward principal than interest until month ${summary.crossoverMonth} — ${y} years and ${m} months from now.`);
    }
  }
  const doubled = scenarios.find((s) => s.label.startsWith("Double"));
  if (doubled && Number.isFinite(doubled.interestSaved) && doubled.monthsSaved > 0) {
    headlines.push(`Doubling the payment saves ${fmt(doubled.interestSaved)} of interest and takes ${Math.floor(doubled.monthsSaved / 12)} years off — but it puts ${fmt(doubled.extraPaidIn)} of extra cash in to do it, a return of ${(doubled.savedPerDollar * 100).toFixed(0)} cents of interest saved per extra dollar. Prepaying earns the note rate, ${(input.annualRate * 100).toFixed(2)}%, and nothing more.`);
  }
  headlines.push("Every figure here comes from the balance, rate, payment and term entered. It is arithmetic on those four numbers, not a forecast, and it says nothing about whether prepaying is the best use of the money.");

  return { check, split, summary, scenarios, ledger, byYear, headlines };
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "an unbounded amount";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/* ----------------------------------------------------------------
   FROM AN EXTRACTED STATEMENT TO A LOAN INPUT.
   server/routers.ts extractStatement returns a claim set from a PDF. This is
   the only door it comes through, so a misread rate or a payment that
   includes escrow is caught here rather than propagating into every
   projection downstream.
------------------------------------------------------------------- */

export type ExtractedStatement = {
  mortgageBalance: number;
  mortgageRate: number;
  monthlyMortgagePayment: number;
  monthlyInterestOnlyPayment: number;
  totalInterestPayments: number;
  mortgageTermMonths: number;
  homeMarketValue: number;
  lenderName: string;
  propertyAddress: string;
  escrowBalance: number;
};

export type NormalisedStatement = {
  loan: LoanInput;
  /** Problems found while reading it. Empty means it read cleanly. */
  warnings: string[];
  /** Fields the extractor could not determine, so the page can ask for them. */
  missing: string[];
  /** Did the extractor's own interest-only figure agree with the arithmetic? */
  interestOnlyAgrees: boolean | null;
  homeMarketValue: number | null;
  lenderName: string | null;
  propertyAddress: string | null;
};

/**
 * Turn an extraction into something an engine may use.
 *
 * The extractor is told to write 0 for a number it cannot determine, so a 0
 * is a MISSING VALUE and not a real zero. Treating those as real is how a
 * client ends up looking at a projection of a loan with no interest.
 */
export function normaliseStatement(raw: ExtractedStatement): NormalisedStatement {
  const warnings: string[] = [];
  const missing: string[] = [];

  for (const [key, label] of [
    ["mortgageBalance", "current balance"], ["mortgageRate", "interest rate"],
    ["monthlyMortgagePayment", "monthly payment"], ["mortgageTermMonths", "remaining term"],
  ] as const) {
    if (!raw[key] || raw[key] <= 0) missing.push(label);
  }

  // A rate read as "6.5" instead of 0.065 is the single most common misread,
  // and it is unambiguous: no US mortgage carries a 650% rate.
  let rate = raw.mortgageRate;
  if (rate > 1) {
    warnings.push(`The rate was read as ${rate}, which is a percentage rather than a decimal. It has been taken as ${(rate / 100).toFixed(4)} — confirm against the statement.`);
    rate = rate / 100;
  }
  if (rate > 0.25) warnings.push(`A rate of ${(rate * 100).toFixed(2)}% is outside anything a US mortgage carries. It has almost certainly been misread.`);

  const loan: LoanInput = {
    balance: raw.mortgageBalance,
    annualRate: rate,
    monthlyPayment: raw.monthlyMortgagePayment,
    termMonthsRemaining: raw.mortgageTermMonths,
  };

  // Cross-check the extractor's own interest-only figure against ours.
  let interestOnlyAgrees: boolean | null = null;
  if (raw.monthlyInterestOnlyPayment > 0 && loan.balance > 0 && rate > 0) {
    const ours = interestOnlyPayment(loan.balance, rate);
    interestOnlyAgrees = Math.abs(raw.monthlyInterestOnlyPayment - ours) / ours <= 0.05;
    if (!interestOnlyAgrees) {
      warnings.push(`The statement's interest portion of ${fmt(raw.monthlyInterestOnlyPayment)} does not match the ${fmt(ours)} that this balance and rate produce. One of the three figures was misread.`);
    }
  }

  if (missing.length === 0) {
    const check = checkStatement(loan);
    if (!check.ok) warnings.push(check.note);
  }

  return {
    loan, warnings, missing, interestOnlyAgrees,
    homeMarketValue: raw.homeMarketValue > 0 ? raw.homeMarketValue : null,
    lenderName: raw.lenderName && raw.lenderName !== "Unknown" ? raw.lenderName : null,
    propertyAddress: raw.propertyAddress && raw.propertyAddress !== "Unknown" ? raw.propertyAddress : null,
  };
}

/** Equity available, and what a lender would typically lend against it at a given LTV. */
export function equityPosition(balance: number, marketValue: number, maxLtv = 0.75): {
  equity: number; currentLtv: number; maxLoan: number; availableToBorrow: number;
} {
  const equity = Math.max(0, marketValue - balance);
  const currentLtv = marketValue > 0 ? balance / marketValue : 0;
  const maxLoan = marketValue * maxLtv;
  return { equity, currentLtv, maxLoan, availableToBorrow: Math.max(0, maxLoan - balance) };
}

/**
 * Every source this engine's typed-in numbers rest on, and every number that
 * is the firm's own choice, said so in words.
 */
export const MORTGAGE_LEDGER_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  MONTHLY_RATE_RULE,
  RATE_CEILING_SOURCE,
  PMMS_SERIES_SOURCE,
  LTV_REFERENCE_SOURCE,
  { label: "Assumption: schedules stop at 1,200 months (100 years) and a payment that would take longer is reported as never amortising, chosen by the firm; no external source" },
  { label: "Assumption: a stated rate above 25% is flagged as a misread, chosen by the firm as a margin above the 18.63% record (Freddie Mac, above); no external source for 25% itself" },
  { label: "Assumption: tolerances = 2% on the statement payment cross-check and 5% on the extracted interest figure, chosen by the firm to absorb rounding and small servicing fees; no external source" },
  { label: "Assumption: equityPosition lends to 75% of market value unless told otherwise, chosen by the firm as a conservative home-equity ceiling; no external source" },
  { label: "Assumption: interest per day on a 365-day year, and the reading bands at 75% and 50% interest share, chosen by the firm for plain-language display; 50% is the crossover point by definition; no external source" },
  { label: "Assumption: extra-payment menu of $100, $250 and $500 a month, half again, double, and one extra payment a year, chosen by the firm as common examples; no external source" },
];
