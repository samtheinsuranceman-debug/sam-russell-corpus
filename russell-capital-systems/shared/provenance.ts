// ============================================================
// HOW A FIGURE GETS MADE — the provenance of a number, step by step.
//
// WHY THIS EXISTS. This firm's clients are physicians, surgeons and practice
// owners: high numeracy, low patience for a black box, and a professional
// habit of asking where a result came from before believing it. A projection
// they cannot audit is a projection they discount. The most valuable page on a
// site like this one is not the one with the biggest number on it — it is the
// one that shows how a number was made and invites them to find the mistake.
//
// WHAT MAKES THIS DIFFERENT FROM AN EXPLAINER. Every trace below carries a
// `verify()` that recomputes its own headline figure by calling the REAL
// engine — shared/mortgageLedger.ts, shared/qbiDeduction.ts,
// shared/balancedIndexedAccount.ts. server/provenance.test.ts asserts that
// verify() reproduces the figure the page displays. So the page cannot drift
// away from the engines: if an engine changes and this narrative no longer
// matches, the build fails. A hand-written walkthrough would silently rot.
//
// EVERY STEP DECLARES ITS OWN KIND, and the kinds are the point:
//   input      — the client typed it. We are not responsible for it, and if it
//                is wrong the figure is wrong; the page says so.
//   sourced    — it came from a named document with a date and, where one
//                exists, a URL.
//   rule       — it came from a statute, a regulation, or a carrier's filed
//                contract terms.
//   arithmetic — we did this to those, and the working is shown.
//   assumption — nobody knows this; we picked it, and we say we picked it.
//
// The distinction between `sourced` and `assumption` is the whole ethic of the
// system. Anything a reader could mistake for a fact has to be one.
// ============================================================

import { interestOnlyPayment, splitThisMonth, type LoanInput } from "./mortgageLedger";
import { computeQbiDeduction, QBI_THRESHOLDS_2026, QBI_SOURCE, type QbiInput } from "./qbiDeduction";
import { creditSegment, SEGMENT_ACCOUNTS } from "./balancedIndexedAccount";

export type StepKind = "input" | "sourced" | "rule" | "arithmetic" | "assumption";

export const STEP_KIND_LABELS: Record<StepKind, string> = {
  input: "You told us",
  sourced: "From a source",
  rule: "From the law",
  arithmetic: "We calculated",
  assumption: "We assumed",
};

export const STEP_KIND_MEANING: Record<StepKind, string> = {
  input: "A figure you entered. We did not check it against anything, and if it is wrong every number after it is wrong too.",
  sourced: "A figure lifted from a named document, with the date it was read. You can open it and check the transcription.",
  rule: "A threshold, a limit or a term set by a statute, a regulation or a filed contract. Not our choice and not negotiable.",
  arithmetic: "Something we did to the figures above. The working is shown so you can redo it.",
  assumption: "Nobody knows this figure. We picked one, and the result moves when you pick differently.",
};

export type TraceStep = {
  n: number;
  kind: StepKind;
  label: string;
  /** What this step produced, formatted as a reader would want it. */
  value: string;
  /** Where it came from. For an input, which field on which page. */
  from: string;
  /** For a sourced step: the document's own URL, when one exists. */
  url?: string;
  /** For a sourced step: when it was read. */
  asOf?: string;
  /** The arithmetic, written out so it can be redone by hand. */
  working?: string;
  /** What breaks if this step is wrong. Required — a step nobody can be wrong about is not a step. */
  ifWrong: string;
};

export type FigureTrace = {
  id: string;
  /** The sentence a client would actually say. */
  headline: string;
  /** The figure itself, as displayed. */
  figure: string;
  /** The question this figure answers. */
  question: string;
  /** Where on the site this figure appears. */
  page: string;
  pagePath: string;
  /** The module that computes it. */
  engine: string;
  steps: readonly TraceStep[];
  /**
   * Recompute the headline figure from the real engine. The test asserts this
   * equals `figure`, which is what stops the page drifting from the code.
   */
  verify: () => string;
  /** The honest limitation. Always present. */
  caveat: string;
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const usd0 = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number, d = 1) => `${n.toFixed(d)}%`;

/* ----------------------------------------------------------------
   TRACE 1 — the simplest possible chain.
   Four numbers the client reads off their own statement, one division,
   no external data and no assumptions at all. It exists to establish
   the format before the harder ones.
------------------------------------------------------------------- */

const LOAN: LoanInput = { balance: 412_500, annualRate: 0.0645, monthlyPayment: 2_594.18, termMonthsRemaining: 331 };

const mortgageTrace: FigureTrace = {
  id: "mortgage-interest-share",
  headline: "85 cents of every dollar you pay this month is interest",
  figure: "85%",
  question: "Of the payment leaving my account this month, how much is actually buying the house?",
  page: "The Mortgage Ledger",
  pagePath: "/portal/mortgage-ledger",
  engine: "shared/mortgageLedger.ts",
  steps: [
    { n: 1, kind: "input", label: "Current principal balance", value: usd0(LOAN.balance),
      from: "The balance line on your mortgage statement, typed into the Mortgage Ledger.",
      ifWrong: "Interest is computed directly from this. A balance that is out by $10,000 moves the monthly interest by about $54." },
    { n: 2, kind: "input", label: "Annual interest rate", value: pct(LOAN.annualRate * 100, 2),
      from: "The rate on your statement. The Ledger checks it: a rate typed as 6.45 rather than 0.0645 is repaired and flagged.",
      ifWrong: "This is the most consequential single input on the page, and the most commonly misread." },
    { n: 3, kind: "input", label: "Monthly payment, principal and interest only", value: usd(LOAN.monthlyPayment),
      from: "Your statement. Escrow is entered separately — a payment with taxes and insurance folded in would overstate the principal.",
      ifWrong: "The Ledger cross-checks this against what the balance, rate and term imply, and names escrow as the likely cause when it does not match." },
    { n: 4, kind: "rule", label: "How mortgage interest accrues", value: "annual rate ÷ 12, applied to the balance",
      from: "The standard US fixed-rate convention: twelve equal compounding periods a year, not an effective annual rate. It is how your servicer computes the bill.",
      ifWrong: "If your note uses a different convention — some do — every monthly figure here shifts slightly. The note itself is the authority." },
    { n: 5, kind: "arithmetic", label: "Interest for this month", value: usd(interestOnlyPayment(LOAN.balance, LOAN.annualRate)),
      from: "Balance × (rate ÷ 12).",
      working: `${usd0(LOAN.balance)} × (${pct(LOAN.annualRate * 100, 2)} ÷ 12) = ${usd0(LOAN.balance)} × ${(LOAN.annualRate / 12).toFixed(6)} = ${usd(interestOnlyPayment(LOAN.balance, LOAN.annualRate))}`,
      ifWrong: "This is one multiplication. If the three figures above are right, this is right." },
    { n: 6, kind: "arithmetic", label: "Principal for this month", value: usd(splitThisMonth(LOAN).principal),
      from: "Payment minus interest. Whatever the interest does not take, reduces the debt.",
      working: `${usd(LOAN.monthlyPayment)} − ${usd(interestOnlyPayment(LOAN.balance, LOAN.annualRate))} = ${usd(splitThisMonth(LOAN).principal)}`,
      ifWrong: "Nothing independent to be wrong about — it is the remainder." },
    { n: 7, kind: "arithmetic", label: "Share of the payment that is interest", value: pct(splitThisMonth(LOAN).interestShare * 100, 0),
      from: "Interest ÷ (interest + principal).",
      working: `${usd(interestOnlyPayment(LOAN.balance, LOAN.annualRate))} ÷ ${usd(LOAN.monthlyPayment)} = ${(splitThisMonth(LOAN).interestShare * 100).toFixed(1)}%`,
      ifWrong: "This is the headline. It carries the error in every step above it and nothing else." },
  ],
  verify: () => pct(splitThisMonth(LOAN).interestShare * 100, 0),
  caveat:
    "This is arithmetic on four numbers you supplied, not a forecast, and there is nothing in it we chose. It says " +
    "what this month looks like — it says nothing about whether paying the loan down faster is the best use of the money.",
};

/* ----------------------------------------------------------------
   TRACE 2 — a figure that depends on the law.
   Client inputs, a statutory threshold transcribed from a published IRS
   revenue procedure, and a phase-in rule from the Code. This is where a
   reader learns which parts of the answer are ours and which are Congress's.
------------------------------------------------------------------- */

const QBI: QbiInput = {
  filingStatus: "mfj",
  taxableIncomeBeforeQbi: 478_500,
  netCapitalGain: 0,
  businesses: [{ name: "Surgical practice", qbi: 420_000, w2Wages: 160_000, ubia: 0, isSSTB: true }],
};

const qbiResult = computeQbiDeduction(QBI);
const band = QBI_THRESHOLDS_2026.mfj;

const qbiTrace: FigureTrace = {
  id: "qbi-deduction",
  headline: `Your Section 199A deduction is ${usd0(qbiResult.deduction)} — half of what it would be under the threshold`,
  figure: usd0(qbiResult.deduction),
  question: "How much of the twenty percent pass-through deduction do I actually get, and what is taking the rest?",
  page: "QBI / Section 199A Optimizer",
  pagePath: "/portal/qbi-optimizer",
  engine: "shared/qbiDeduction.ts",
  steps: [
    { n: 1, kind: "input", label: "Taxable income before this deduction", value: usd0(QBI.taxableIncomeBeforeQbi),
      from: "Your figure, or read off an uploaded return.",
      ifWrong: "This decides where you sit in the phase-in band, which is the single biggest lever on the whole page." },
    { n: 2, kind: "input", label: "Qualified business income", value: usd0(QBI.businesses[0]!.qbi),
      from: "Net income from the practice, entered on the page.",
      ifWrong: "Twenty percent of this is the starting point. It is also the figure a CPA is most likely to restate." },
    { n: 3, kind: "input", label: "W-2 wages paid by the practice", value: usd0(QBI.businesses[0]!.w2Wages),
      from: "Your payroll figure.",
      ifWrong: "The wage limit is built from this. Under-reporting it understates the deduction." },
    { n: 4, kind: "input", label: "Is it a specified service business?", value: "Yes — a medical practice",
      from: "Declared on the page. Health, law, accounting, consulting and financial services are named in the statute.",
      ifWrong: "This single checkbox is worth more than any other field here. A non-service business at this income keeps far more." },
    { n: 5, kind: "rule", label: "The 2026 threshold for a joint return", value: usd0(band.threshold),
      from: `${QBI_SOURCE.thresholds}, the table headed "Qualified Business Income". Below this, no wage limit and no service haircut apply at all.`,
      url: QBI_SOURCE.url, asOf: "read 2026-09-17",
      ifWrong: "Transcribed from the published table. If it is wrong, it is a transcription error and the linked document settles it." },
    { n: 6, kind: "rule", label: "Where the phase-in completes", value: usd0(band.phaseInTop),
      from: `The same table. The band is $150,000 wide on a joint return, which ${QBI_SOURCE.statute} § 199A(b)(3)(B)(i) sets.`,
      url: QBI_SOURCE.url, asOf: "read 2026-09-17",
      ifWrong: "Same as above — a transcription you can check against the source." },
    { n: 7, kind: "arithmetic", label: "How far through the band you are", value: pct(qbiResult.phaseInFraction * 100, 0),
      from: "(taxable income − threshold) ÷ (phase-in top − threshold).",
      working: `(${usd0(QBI.taxableIncomeBeforeQbi)} − ${usd0(band.threshold)}) ÷ (${usd0(band.phaseInTop)} − ${usd0(band.threshold)}) = ${(qbiResult.phaseInFraction * 100).toFixed(0)}%`,
      ifWrong: "A pure ratio of the four figures above." },
    { n: 8, kind: "rule", label: "What that does to a service business", value: `Keeps ${pct((1 - qbiResult.phaseInFraction) * 100, 0)} of its income, wages and property`,
      from: "§ 199A(d)(3)(A): inside the band a specified service business keeps only the applicable percentage; above the top it keeps none.",
      ifWrong: "This is the statute, not our model. It is also why the answer is so sensitive to taxable income." },
    { n: 9, kind: "arithmetic", label: "Twenty percent of the income that survives", value: usd0(qbiResult.businesses[0]!.tentative),
      from: "20% × (QBI × applicable percentage).",
      working: `20% × (${usd0(QBI.businesses[0]!.qbi)} × ${pct((1 - qbiResult.phaseInFraction) * 100, 0)}) = ${usd0(qbiResult.businesses[0]!.tentative)}`,
      ifWrong: "Follows arithmetically from the income and the applicable percentage above; there is nothing independent here to be wrong about, but it inherits any error in either." },
    { n: 10, kind: "arithmetic", label: "The deduction, after the wage limit is applied in proportion", value: usd0(qbiResult.deduction),
      from: `The wage limit here is ${usd0(qbiResult.businesses[0]!.wageLimit)} (${qbiResult.businesses[0]!.wageLimitProng}). Because you are inside the band, only ${pct(qbiResult.phaseInFraction * 100, 0)} of the excess over it is taken away, per § 199A(b)(3)(B)(ii).`,
      working: `${usd0(qbiResult.businesses[0]!.tentative)} − ((${usd0(qbiResult.businesses[0]!.tentative)} − ${usd0(qbiResult.businesses[0]!.wageLimit)}) × ${pct(qbiResult.phaseInFraction * 100, 0)}) = ${usd0(qbiResult.deduction)}`,
      ifWrong: "The binding rule is named on the page itself, so you can see which of the three is costing you." },
  ],
  verify: () => usd0(computeQbiDeduction(QBI).deduction),
  caveat:
    "A projection from the figures entered, not a filing position. A CPA confirms the wage figures, the property basis " +
    "and whether each activity is a specified service trade or business before any of this is relied on. The thresholds " +
    "are the published 2026 amounts and change every year.",
};

/* ----------------------------------------------------------------
   TRACE 3 — a figure that depends on a document nobody else transcribes.
   The carrier's own filed terms, a real index history, and the distinction
   between a segment credit and an annual rate that almost every illustration
   blurs. This is the trace that shows the system doing something a
   spreadsheet would get wrong.
------------------------------------------------------------------- */

const SEGMENT = SEGMENT_ACCOUNTS[0]!;
// A real two-year window from the sourced S&P 500 price-return series.
const WINDOW_YEARS = [2019, 2020] as const;
const WINDOW_RETURNS = [28.9, 16.3] as const;
const segResult = creditSegment(SEGMENT, WINDOW_RETURNS, WINDOW_YEARS[0]);

const segmentTrace: FigureTrace = {
  id: "segment-credit",
  headline: `A two-year segment starting in ${WINDOW_YEARS[0]} credited ${pct(segResult.creditedPct, 2)} — which is ${pct(segResult.annualizedPct, 2)} a year, not ${pct(segResult.creditedPct / 2, 2)}`,
  figure: pct(segResult.annualizedPct, 2),
  question: "The flier shows a big number. Is that the annual rate, and is it before or after the carrier's charges?",
  page: "Index Strategy Comparison",
  pagePath: "/portal/index-strategies",
  engine: "shared/balancedIndexedAccount.ts",
  steps: [
    { n: 1, kind: "sourced", label: "The index's return in each year of the segment",
      value: `${WINDOW_YEARS[0]}: ${pct(WINDOW_RETURNS[0], 1)}, ${WINDOW_YEARS[1]}: ${pct(WINDOW_RETURNS[1], 1)}`,
      from: "S&P 500 price return by calendar year, the basis the carrier's account credits on. Dividends are not included, because the account does not credit them.",
      asOf: "series sourced and reconciled against the carrier's own published claims",
      ifWrong: "The whole credit is built on these two numbers. They are checked against the carrier's published figures before use." },
    { n: 2, kind: "rule", label: "Participation rate", value: `${SEGMENT.participationPct}%`,
      from: SEGMENT.source,
      ifWrong: "A filed contract term. If the transcription is wrong the source document settles it; if the carrier changes it, this is out of date and the page says when it was read." },
    { n: 3, kind: "rule", label: "Spread", value: `${SEGMENT.spreadPct}%, deducted over the whole segment`,
      from: `${SEGMENT.source}. Applied after participation, not before — the order matters and is easy to get backwards.`,
      ifWrong: "Reversing the order of participation and spread changes the answer. The order here is the carrier's." },
    { n: 4, kind: "rule", label: "Floor", value: `${SEGMENT.floorPct}%`,
      from: "The same document. A negative segment credits zero rather than a loss.",
      ifWrong: "Only matters in a losing window; in this one it does nothing." },
    { n: 5, kind: "arithmetic", label: "Compound the index over the two years", value: pct(segResult.indexCumulativePct, 2),
      from: "The two annual returns compounded, NOT added. Adding them would overstate it.",
      working: `(1 + ${(WINDOW_RETURNS[0] / 100).toFixed(3)}) × (1 + ${(WINDOW_RETURNS[1] / 100).toFixed(3)}) − 1 = ${pct(segResult.indexCumulativePct, 2)}`,
      ifWrong: "Compounding rather than adding is the first place a spreadsheet goes wrong on a multi-year segment." },
    { n: 6, kind: "arithmetic", label: "Apply participation, then subtract the spread", value: pct(segResult.creditedPct, 2),
      from: "This is the segment credit — what the account is credited over the two years in total.",
      working: `${pct(segResult.indexCumulativePct, 2)} × ${SEGMENT.participationPct}% − ${SEGMENT.spreadPct}% = ${pct(segResult.creditedPct, 2)}`,
      ifWrong: "Two operations in the carrier's stated order." },
    { n: 7, kind: "arithmetic", label: "Turn the segment credit into an annual rate", value: pct(segResult.annualizedPct, 2),
      from: "The geometric root over the term — NOT the credit divided by two. Halving a two-year credit overstates the annual rate, because it ignores compounding within the segment.",
      working: `(1 + ${(segResult.creditedPct / 100).toFixed(4)})^(1/${SEGMENT.termYears}) − 1 = ${pct(segResult.annualizedPct, 2)}, against ${pct(segResult.creditedPct / 2, 2)} if you simply halved it`,
      ifWrong: "This is the step the whole trace exists for. It is the difference between the figure on the flier and the rate you actually earn." },
  ],
  verify: () => pct(creditSegment(SEGMENT, WINDOW_RETURNS, WINDOW_YEARS[0]).annualizedPct, 2),
  caveat:
    "One historical window under one carrier's filed terms. It is a record of what those terms would have done, not a " +
    "projection of what they will do, and nothing here is guaranteed. Segment terms are set by the carrier and can change " +
    "on new segments.",
};

export const FIGURE_TRACES: readonly FigureTrace[] = [mortgageTrace, qbiTrace, segmentTrace];

export function trace(id: string): FigureTrace | undefined {
  return FIGURE_TRACES.find((t) => t.id === id);
}

/** How many steps of each kind a trace uses — the shape of its evidence. */
export function stepMix(t: FigureTrace): Record<StepKind, number> {
  const mix: Record<StepKind, number> = { input: 0, sourced: 0, rule: 0, arithmetic: 0, assumption: 0 };
  for (const s of t.steps) mix[s.kind] += 1;
  return mix;
}

/**
 * The standing promise this page makes, and the reason it is worth having.
 */
export const PROVENANCE_PROMISE = [
  "Every figure on this site can be traced to the step that produced it.",
  "Anything you typed is labelled as something you typed, and we do not check it for you.",
  "Anything from a document names the document and the date it was read, and links it where a link exists.",
  "Anything the law decides is marked as the law's, with the section number, not presented as our judgement.",
  "Anything we assumed is marked as an assumption — if nobody knows a number, we say nobody knows it.",
  "The arithmetic is written out so you can redo it by hand and find our mistake.",
] as const;

/**
 * The sources the shell prints for this page: every step the traces mark as
 * sourced, rule or assumption, with its document, URL and date where the step
 * carries them. Built from FIGURE_TRACES, so a new trace is printed without a
 * second edit. Input steps are the worked example's own statement figures and
 * are named as such.
 */
export const PROVENANCE_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = (() => {
  const seen = new Set<string>();
  const out: { label: string; url?: string; asOf?: string; note?: string }[] = [];
  for (const t of FIGURE_TRACES) {
    for (const s of t.steps) {
      if (s.kind !== "sourced" && s.kind !== "rule" && s.kind !== "assumption") continue;
      const label = `${t.page}, ${s.label}: ${s.from}`;
      if (seen.has(label)) continue;
      seen.add(label);
      out.push({ label, ...(s.url ? { url: s.url } : {}), ...(s.asOf ? { asOf: s.asOf } : {}) });
    }
  }
  out.push({ label: `${QBI_SOURCE.thresholds} (${QBI_SOURCE.statute})`, url: QBI_SOURCE.url, asOf: "read 2026-09-17" });
  out.push({ label: "The worked examples' inputs (a mortgage statement, a practice's income and wages) are illustrative figures a client would type in, labelled as inputs on the page; no external source" });
  return out;
})();
