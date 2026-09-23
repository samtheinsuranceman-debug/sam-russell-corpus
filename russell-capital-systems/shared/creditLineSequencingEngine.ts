/**
 * ═══════════════════════════════════════════════════════════════════
 * CREDIT-LINE SEQUENCING ENGINE (SI-028 candidate)
 * ═══════════════════════════════════════════════════════════════════
 * What it answers, for one qualified household:
 *   • which card issuers to apply to, in what order, and when
 *   • when to request a credit-line increase, and when to move to the next issuer
 *   • how much 0% promotional capital that sequence makes deployable, by route
 *   • a premium schedule that places that capital into a cash-value policy
 *   • a payoff schedule that clears every line BEFORE its promotional window ends
 *   • whether the household's cash flow can carry that payoff, and what it is worth
 *
 * What it refuses to do:
 *   • print a number for a household that fails the suitability gate
 *   • treat issuer velocity rules as verified — they are community-reported and
 *     flagged `verified: false`; the page must say so
 *   • pretend the deployed capital is free money: every dollar is repaid from
 *     cash flow inside the promo window, and the engine shows that burden first
 *
 * Deterministic: same input, same output. No randomness, no clock.
 * Every rate, fee, window and threshold lives in CREDIT_LINE_RULES with a
 * source and an as-of date, never in the page.
 */

// ─────────────────────────────────────────────────────────────────────
// RULES TABLE
// ─────────────────────────────────────────────────────────────────────
export const RULES_VERSION = "2026-09-22";

export interface Sourced<T> {
  value: T;
  /** true only when the figure is read from the institution's own publication. */
  verified: boolean;
  source: string;
  asOf: string;
  note?: string;
}

export type IssuerId = "chase" | "amex" | "citi" | "capital_one" | "bofa" | "wells_fargo" | "us_bank" | "discover";

export interface IssuerRule {
  id: IssuerId;
  name: string;
  /** Short label for the widely reported approval policy. */
  policy: string;
  /** Reject if the applicant opened this many cards (any issuer) in the window. */
  maxNewCardsAnyIssuer: { count: number; months: number } | null;
  /** Reject if the applicant opened this many cards at THIS issuer in the window. */
  maxNewCardsThisIssuer: { count: number; months: number } | null;
  /** Minimum days between two applications at this issuer. */
  minDaysBetweenApplications: number;
  /** Starting limit as a share of annual income, by score band. Community-reported ranges. */
  startingLimitShareOfIncome: { fico760: number; fico720: number };
  /** Cap on a single starting line. */
  startingLimitCap: number;
  /** 0% intro purchase-APR months typically offered on the issuer's no-fee cards. */
  introPurchaseAprMonths: number;
  /** Balance-transfer fee on promotional transfers, as a fraction. */
  balanceTransferFee: number;
  /** Whether promotional balance-transfer offers can be paid to a bank account (cash-out). */
  transferToBankAvailable: boolean;
  /** Months after opening before a credit-line-increase request is usually a soft pull. */
  cliRequestAfterMonths: number;
  /** Typical increase on a first request, as a fraction of the current line. */
  cliTypicalIncrease: number;
  verified: false;
  source: string;
  asOf: string;
}

const COMMUNITY = "Community-reported approval policy (not published by the issuer). Confirm with the issuer before applying.";

export const ISSUER_RULES: readonly IssuerRule[] = [
  { id: "chase", name: "Chase", policy: "5/24 (no approval with 5+ new cards in 24 months); ~2 per 30 days", maxNewCardsAnyIssuer: { count: 5, months: 24 }, maxNewCardsThisIssuer: { count: 2, months: 1 }, minDaysBetweenApplications: 30, startingLimitShareOfIncome: { fico760: 0.12, fico720: 0.08 }, startingLimitCap: 30_000, introPurchaseAprMonths: 15, balanceTransferFee: 0.05, transferToBankAvailable: false, cliRequestAfterMonths: 6, cliTypicalIncrease: 0.25, verified: false, source: COMMUNITY, asOf: "2026-09" },
  { id: "amex", name: "American Express", policy: "2 credit cards per 90 days; 1 card per 5 days", maxNewCardsAnyIssuer: null, maxNewCardsThisIssuer: { count: 2, months: 3 }, minDaysBetweenApplications: 5, startingLimitShareOfIncome: { fico760: 0.10, fico720: 0.07 }, startingLimitCap: 25_000, introPurchaseAprMonths: 15, balanceTransferFee: 0.03, transferToBankAvailable: false, cliRequestAfterMonths: 2, cliTypicalIncrease: 1.0, verified: false, source: COMMUNITY + " Amex 3x CLI requests after 61 days are widely reported.", asOf: "2026-09" },
  { id: "citi", name: "Citi", policy: "1 card per 8 days; 2 per 65 days", maxNewCardsAnyIssuer: null, maxNewCardsThisIssuer: { count: 2, months: 2 }, minDaysBetweenApplications: 8, startingLimitShareOfIncome: { fico760: 0.10, fico720: 0.06 }, startingLimitCap: 25_000, introPurchaseAprMonths: 21, balanceTransferFee: 0.05, transferToBankAvailable: true, cliRequestAfterMonths: 6, cliTypicalIncrease: 0.30, verified: false, source: COMMUNITY + " Citi convenience checks / transfer-to-bank offers are periodic, not guaranteed.", asOf: "2026-09" },
  { id: "capital_one", name: "Capital One", policy: "1 card per 6 months; sensitive to many recent inquiries", maxNewCardsAnyIssuer: null, maxNewCardsThisIssuer: { count: 1, months: 6 }, minDaysBetweenApplications: 180, startingLimitShareOfIncome: { fico760: 0.08, fico720: 0.05 }, startingLimitCap: 20_000, introPurchaseAprMonths: 15, balanceTransferFee: 0.03, transferToBankAvailable: false, cliRequestAfterMonths: 6, cliTypicalIncrease: 0.25, verified: false, source: COMMUNITY, asOf: "2026-09" },
  { id: "bofa", name: "Bank of America", policy: "2/3/4 (2 per 2 months, 3 per 12, 4 per 24)", maxNewCardsAnyIssuer: null, maxNewCardsThisIssuer: { count: 2, months: 2 }, minDaysBetweenApplications: 30, startingLimitShareOfIncome: { fico760: 0.10, fico720: 0.06 }, startingLimitCap: 25_000, introPurchaseAprMonths: 18, balanceTransferFee: 0.03, transferToBankAvailable: false, cliRequestAfterMonths: 6, cliTypicalIncrease: 0.25, verified: false, source: COMMUNITY, asOf: "2026-09" },
  { id: "wells_fargo", name: "Wells Fargo", policy: "1 card per 6 months; existing relationship helps", maxNewCardsAnyIssuer: null, maxNewCardsThisIssuer: { count: 1, months: 6 }, minDaysBetweenApplications: 180, startingLimitShareOfIncome: { fico760: 0.10, fico720: 0.06 }, startingLimitCap: 25_000, introPurchaseAprMonths: 21, balanceTransferFee: 0.05, transferToBankAvailable: false, cliRequestAfterMonths: 6, cliTypicalIncrease: 0.25, verified: false, source: COMMUNITY, asOf: "2026-09" },
  { id: "us_bank", name: "U.S. Bank", policy: "inquiry-sensitive; 1 card per 6 months", maxNewCardsAnyIssuer: null, maxNewCardsThisIssuer: { count: 1, months: 6 }, minDaysBetweenApplications: 180, startingLimitShareOfIncome: { fico760: 0.08, fico720: 0.05 }, startingLimitCap: 20_000, introPurchaseAprMonths: 18, balanceTransferFee: 0.03, transferToBankAvailable: false, cliRequestAfterMonths: 6, cliTypicalIncrease: 0.25, verified: false, source: COMMUNITY, asOf: "2026-09" },
  { id: "discover", name: "Discover", policy: "1 card per 12 months (2 cards max)", maxNewCardsAnyIssuer: null, maxNewCardsThisIssuer: { count: 1, months: 12 }, minDaysBetweenApplications: 365, startingLimitShareOfIncome: { fico760: 0.08, fico720: 0.05 }, startingLimitCap: 20_000, introPurchaseAprMonths: 15, balanceTransferFee: 0.03, transferToBankAvailable: false, cliRequestAfterMonths: 6, cliTypicalIncrease: 0.25, verified: false, source: COMMUNITY, asOf: "2026-09" },
];

export const CREDIT_LINE_RULES = {
  rulesVersion: RULES_VERSION,
  /** Post-promotional purchase APR assumed when a balance is NOT cleared in time. */
  postPromoApr: { value: 0.2924, verified: false, source: "Typical variable purchase APR range on no-annual-fee cards, mid-2026 issuer disclosures (upper end used deliberately).", asOf: "2026-09" } as Sourced<number>,
  /** Cash advances are never promotional; excluded as a route. */
  cashAdvanceApr: { value: 0.2999, verified: false, source: "Typical cash-advance APR on issuer disclosures; included only to show why the route is excluded.", asOf: "2026-09" } as Sourced<number>,
  /** Third-party bill-pay services that let a card pay a payee that does not accept cards. */
  billPayServiceFee: { value: 0.029, verified: false, source: "Published fee of the leading card-to-check bill-pay service, read 2026-09.", asOf: "2026-09" } as Sourced<number>,
  /** Score effects, from the scoring company's own consumer education pages. */
  hardInquiryPointsEach: { value: 5, verified: true, source: "myFICO: a hard inquiry typically costs fewer than five points; used as the upper bound.", asOf: "2026-09" } as Sourced<number>,
  utilizationWarnAbove: { value: 0.30, verified: true, source: "myFICO consumer education: keep revolving utilization under 30%.", asOf: "2026-09" } as Sourced<number>,
  utilizationIdealBelow: { value: 0.10, verified: true, source: "myFICO consumer education: single-digit utilization scores best.", asOf: "2026-09" } as Sourced<number>,
  /** Share of monthly household spend that can realistically move onto a card (rent, mortgage, most taxes cannot). */
  movableSpendShare: { value: 0.55, verified: false, source: "Engine assumption; the page lets the household override it.", asOf: "2026-09" } as Sourced<number>,
  /** Whether life carriers accept card payment for premiums (most do not beyond a first premium). */
  premiumByCardTypical: { value: false, verified: false, source: "Most carriers accept card payment for an initial premium only, if at all; treated as unavailable unless the household confirms.", asOf: "2026-09" } as Sourced<boolean>,
  /** Suitability floors. */
  minFico: { value: 720, verified: false, source: "Engine floor: below this, starting limits and 0% offers thin out and denials add inquiries for nothing.", asOf: "2026-09" } as Sourced<number>,
  maxDti: { value: 0.36, verified: true, source: "Conventional front/back-end underwriting norm (CFPB / Fannie Mae guidance); used as the ceiling for adding revolving lines.", asOf: "2026-09" } as Sourced<number>,
  minEmergencyFundMonths: { value: 6, verified: false, source: "Engine floor: the payoff schedule must survive an income interruption.", asOf: "2026-09" } as Sourced<number>,
  mortgageBlackoutMonths: { value: 12, verified: false, source: "New inquiries and new lines within a year of a mortgage application raise pricing and can cause denial; engine refuses to sequence inside that window.", asOf: "2026-09" } as Sourced<number>,
  /** Policy-side assumptions used only for the comparison, never for illustration. */
  policyLoadOnPremium: { value: 0.06, verified: false, source: "Premium load assumption consistent with shared/householdWealth.ts (6%).", asOf: "2026-09" } as Sourced<number>,
} as const;

// ─────────────────────────────────────────────────────────────────────
// INPUT / OUTPUT
// ─────────────────────────────────────────────────────────────────────
export interface CreditLineInput {
  fico: number;
  annualIncome: number;
  /** Total monthly household spend (all categories). */
  monthlyExpenses: number;
  /** Monthly debt service already committed (mortgage, auto, student loans). */
  monthlyDebtPayments: number;
  emergencyFundMonths: number;
  oldestAccountYears: number;
  latePaymentsLast24Months: number;
  /** Cards opened (any issuer) in the last 24 months, and their opening months ago. */
  recentCardOpenings: number[]; // months ago, e.g. [3, 14]
  /** Existing revolving limits and balances (for utilization). */
  existingRevolvingLimit: number;
  existingRevolvingBalance: number;
  /** Months until a planned mortgage application, or null. */
  mortgageApplicationInMonths: number | null;
  /** Annual premium the household wants to place into the policy. */
  targetAnnualPremium: number;
  /** Planning horizon in months (default 24). */
  horizonMonths: number;
  /** Crediting assumption for the comparison only (e.g. 0.06). */
  policyCreditingRate: number;
  /** Household confirms its carrier accepts card payment for premiums. */
  carrierAcceptsCard: boolean;
  /** Override of the movable-spend share, 0–1. */
  movableSpendShare?: number;
  /** Which issuers to consider (default: all). */
  issuers?: IssuerId[];
}

export interface SuitabilityCheck { test: string; pass: boolean; detail: string; }
export interface Suitability { suitable: boolean; score: number; checks: SuitabilityCheck[]; }

export type EventKind = "apply" | "cli_request" | "move_issuer" | "promo_ends" | "cleared";
export interface CalendarEvent {
  month: number;          // 1-based month in the plan
  kind: EventKind;
  issuer: IssuerId;
  issuerName: string;
  cardIndex: number;      // 1-based, the nth card in the sequence
  detail: string;
  amount?: number;        // limit granted / increase / balance cleared
  hardInquiry: boolean;
}

export type RouteId = "cash_flow_substitution" | "transfer_to_bank" | "bill_pay_service" | "premium_by_card";
export interface RouteCapacity {
  route: RouteId;
  label: string;
  plain: string;
  available: boolean;
  grossCapacity: number;   // dollars of 0% capital this route can produce over the horizon
  feeRate: number;
  fees: number;
  netCapital: number;      // gross - fees
  reason?: string;         // why unavailable
}

export interface CardLine {
  cardIndex: number;
  issuer: IssuerId;
  issuerName: string;
  openedMonth: number;
  promoMonths: number;
  promoEndsMonth: number;
  limit: number;           // after any CLI
  deployed: number;        // 0% capital drawn on this line
  fees: number;
  /** Required monthly payoff so the line is at zero by promoEndsMonth. */
  monthlyPayoff: number;
  clearedMonth: number;
}

export interface MonthRow {
  month: number;
  aggregateLimit: number;
  drawn: number;
  premiumPlaced: number;
  payoff: number;
  utilization: number;     // drawn / (existing + aggregate)
  cashFlowSurplus: number; // income/12 - expenses - debt - payoff
}

export interface Comparison {
  premiumPlaced: number;
  feesPaid: number;
  policyValueAtHorizon: number;      // premium net of load, credited at the rate, deterministic
  doNothingValueAtHorizon: number;   // same cash flow saved at 0% (it was going to be repaid anyway)
  netBenefit: number;
  breakEvenCreditingRate: number;    // rate at which policy value equals fees + premium
  peakMonthlyPayoff: number;
  cashFlowFeasible: boolean;
}

export interface CreditLineRisk { severity: "high" | "medium" | "low"; title: string; plain: string; }

export interface CreditLineResult {
  suitability: Suitability;
  calendar: CalendarEvent[];
  lines: CardLine[];
  routes: RouteCapacity[];
  months: MonthRow[];
  totals: { aggregateLimit: number; deployableGross: number; fees: number; deployableNet: number; hardInquiries: number; cardsOpened: number; };
  comparison: Comparison | null;
  risks: CreditLineRisk[];
  provenance: { rulesVersion: string; verifiedRules: string[]; unverifiedRules: string[]; note: string; };
}

// ─────────────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────────────
export function getDefaultCreditLineInput(): CreditLineInput {
  return {
    fico: 765,
    annualIncome: 420_000,
    monthlyExpenses: 14_000,
    monthlyDebtPayments: 5_200,
    emergencyFundMonths: 8,
    oldestAccountYears: 12,
    latePaymentsLast24Months: 0,
    recentCardOpenings: [],
    existingRevolvingLimit: 60_000,
    existingRevolvingBalance: 4_000,
    mortgageApplicationInMonths: null,
    targetAnnualPremium: 100_000,
    horizonMonths: 24,
    policyCreditingRate: 0.06,
    carrierAcceptsCard: false,
  };
}

// ─────────────────────────────────────────────────────────────────────
// SUITABILITY
// ─────────────────────────────────────────────────────────────────────
export function assessSuitability(input: CreditLineInput): Suitability {
  const R = CREDIT_LINE_RULES;
  const monthlyIncome = input.annualIncome / 12;
  const dti = monthlyIncome > 0 ? input.monthlyDebtPayments / monthlyIncome : 1;
  const utilization = input.existingRevolvingLimit > 0 ? input.existingRevolvingBalance / input.existingRevolvingLimit : 0;
  const checks: SuitabilityCheck[] = [
    { test: `FICO at or above ${R.minFico.value}`, pass: input.fico >= R.minFico.value, detail: `Score ${input.fico}.` },
    { test: `Debt-to-income at or below ${Math.round(R.maxDti.value * 100)}%`, pass: dti <= R.maxDti.value, detail: `DTI ${(dti * 100).toFixed(0)}%.` },
    { test: `Emergency fund of ${R.minEmergencyFundMonths.value}+ months`, pass: input.emergencyFundMonths >= R.minEmergencyFundMonths.value, detail: `${input.emergencyFundMonths} months on hand.` },
    { test: "No late payments in 24 months", pass: input.latePaymentsLast24Months === 0, detail: `${input.latePaymentsLast24Months} late.` },
    { test: "Oldest account 2+ years", pass: input.oldestAccountYears >= 2, detail: `${input.oldestAccountYears} years.` },
    { test: `Existing utilization under ${Math.round(R.utilizationWarnAbove.value * 100)}%`, pass: utilization < R.utilizationWarnAbove.value, detail: `${(utilization * 100).toFixed(0)}% today.` },
    { test: `No mortgage application inside ${R.mortgageBlackoutMonths.value} months`, pass: input.mortgageApplicationInMonths === null || input.mortgageApplicationInMonths > R.mortgageBlackoutMonths.value, detail: input.mortgageApplicationInMonths === null ? "None planned." : `Planned in ${input.mortgageApplicationInMonths} months.` },
    { test: "Positive monthly surplus after expenses and debt", pass: monthlyIncome - input.monthlyExpenses - input.monthlyDebtPayments > 0, detail: `$${Math.round(monthlyIncome - input.monthlyExpenses - input.monthlyDebtPayments).toLocaleString()} per month.` },
  ];
  const passed = checks.filter(c => c.pass).length;
  return { suitable: checks.every(c => c.pass), score: Math.round((passed / checks.length) * 100), checks };
}

// ─────────────────────────────────────────────────────────────────────
// SEQUENCING
// ─────────────────────────────────────────────────────────────────────
function startingLimit(rule: IssuerRule, input: CreditLineInput): number {
  const share = input.fico >= 760 ? rule.startingLimitShareOfIncome.fico760 : rule.startingLimitShareOfIncome.fico720;
  return Math.min(rule.startingLimitCap, Math.round((input.annualIncome * share) / 500) * 500);
}

/** Order issuers: 5/24-style issuers first (they must be approached before the count climbs), then by promo length and limit. */
function issuerOrder(rules: readonly IssuerRule[], input: CreditLineInput): IssuerRule[] {
  return [...rules].sort((a, b) => {
    const aStrict = a.maxNewCardsAnyIssuer ? 0 : 1;
    const bStrict = b.maxNewCardsAnyIssuer ? 0 : 1;
    if (aStrict !== bStrict) return aStrict - bStrict;
    const aScore = a.introPurchaseAprMonths * 1000 + startingLimit(a, input) / 1000;
    const bScore = b.introPurchaseAprMonths * 1000 + startingLimit(b, input) / 1000;
    return bScore - aScore;
  });
}

interface Opening { issuer: IssuerId; month: number; }

function canApply(rule: IssuerRule, month: number, openings: Opening[], priorOpeningsMonthsAgo: number[]): { ok: boolean; why?: string } {
  // Openings before the plan count as negative months.
  const all = [...openings, ...priorOpeningsMonthsAgo.map(m => ({ issuer: "prior" as IssuerId | "prior", month: 1 - m }))];
  if (rule.maxNewCardsAnyIssuer) {
    const { count, months } = rule.maxNewCardsAnyIssuer;
    const inWindow = all.filter(o => month - o.month < months).length;
    if (inWindow >= count) return { ok: false, why: `${rule.name}: ${inWindow} new cards inside ${months} months (limit ${count}).` };
  }
  if (rule.maxNewCardsThisIssuer) {
    const { count, months } = rule.maxNewCardsThisIssuer;
    const inWindow = openings.filter(o => o.issuer === rule.id && month - o.month < months).length;
    if (inWindow >= count) return { ok: false, why: `${rule.name}: ${inWindow} of its own cards inside ${months} months.` };
  }
  const last = openings.filter(o => o.issuer === rule.id).map(o => o.month).sort((a, b) => b - a)[0];
  if (last !== undefined && (month - last) * 30 < rule.minDaysBetweenApplications) return { ok: false, why: `${rule.name}: fewer than ${rule.minDaysBetweenApplications} days since its last application.` };
  return { ok: true };
}

export function runCreditLineSequence(input: CreditLineInput): CreditLineResult {
  const R = CREDIT_LINE_RULES;
  const suitability = assessSuitability(input);
  const rules = ISSUER_RULES.filter(r => !input.issuers || input.issuers.includes(r.id));
  const provenance = {
    rulesVersion: RULES_VERSION,
    verifiedRules: Object.entries(R).filter(([, v]) => typeof v === "object" && (v as Sourced<unknown>).verified).map(([k]) => k),
    unverifiedRules: [...Object.entries(R).filter(([, v]) => typeof v === "object" && !(v as Sourced<unknown>).verified).map(([k]) => k), ...rules.map(r => `issuer:${r.id}`)],
    note: "Issuer approval policies are community-reported and unverified. The household must confirm each with the issuer before applying. Nothing here is credit, tax or insurance advice.",
  };

  if (!suitability.suitable) {
    return {
      suitability, calendar: [], lines: [], routes: [], months: [],
      totals: { aggregateLimit: 0, deployableGross: 0, fees: 0, deployableNet: 0, hardInquiries: 0, cardsOpened: 0 },
      comparison: null,
      risks: [{ severity: "high", title: "Not suitable today", plain: "One or more suitability checks failed. No sequence is shown because applying would add inquiries and risk without the capacity to carry the payoff." }],
      provenance,
    };
  }

  const H = Math.max(6, Math.min(60, Math.round(input.horizonMonths)));
  const monthlyIncome = input.annualIncome / 12;
  const baseSurplus = monthlyIncome - input.monthlyExpenses - input.monthlyDebtPayments;
  const movableShare = input.movableSpendShare ?? R.movableSpendShare.value;
  const movableSpend = input.monthlyExpenses * movableShare;

  // ── Build the application calendar under the velocity rules ──
  const calendar: CalendarEvent[] = [];
  const lines: CardLine[] = [];
  const openings: Opening[] = [];
  const order = issuerOrder(rules, input);
  const usedIssuers = new Set<IssuerId>();
  let cardIndex = 0;
  const maxCards = 6; // beyond this the marginal line is small and the inquiry cost is not

  for (let month = 1; month <= H && lines.length < maxCards; month++) {
    // At most one application a month: spacing keeps every issuer's per-30-day rule satisfied and the score drift gradual.
    const candidate = order.find(r => !usedIssuers.has(r.id) && canApply(r, month, openings, input.recentCardOpenings).ok);
    if (!candidate) continue;
    // Do not open a line whose promo would end after the horizon (it could not be cleared inside the plan).
    if (month + candidate.introPurchaseAprMonths > H) { usedIssuers.add(candidate.id); month--; continue; }
    cardIndex++;
    const limit = startingLimit(candidate, input);
    openings.push({ issuer: candidate.id, month });
    usedIssuers.add(candidate.id);
    const promoEnds = month + candidate.introPurchaseAprMonths;
    lines.push({ cardIndex, issuer: candidate.id, issuerName: candidate.name, openedMonth: month, promoMonths: candidate.introPurchaseAprMonths, promoEndsMonth: promoEnds, limit, deployed: 0, fees: 0, monthlyPayoff: 0, clearedMonth: promoEnds });
    calendar.push({ month, kind: "apply", issuer: candidate.id, issuerName: candidate.name, cardIndex, detail: `Apply: ${candidate.name} 0% purchase-APR card (${candidate.introPurchaseAprMonths} months). Policy: ${candidate.policy}.`, amount: limit, hardInquiry: true });
    const cliMonth = month + candidate.cliRequestAfterMonths;
    if (cliMonth <= H) {
      const increase = Math.round((limit * candidate.cliTypicalIncrease) / 500) * 500;
      calendar.push({ month: cliMonth, kind: "cli_request", issuer: candidate.id, issuerName: candidate.name, cardIndex, detail: `Request a credit-line increase on card ${cardIndex} (${candidate.name}); usually a soft pull after ${candidate.cliRequestAfterMonths} months.`, amount: increase, hardInquiry: false });
      lines[lines.length - 1].limit += increase;
    }
    const next = order.find(r => !usedIssuers.has(r.id));
    if (next) calendar.push({ month: month + 1, kind: "move_issuer", issuer: next.id, issuerName: next.name, cardIndex, detail: `Move to the next issuer (${next.name}); do not reapply at ${candidate.name} inside its window.`, hardInquiry: false });
  }

  // ── Routes: how the lines become 0% capital ──
  const aggregateLimit = lines.reduce((s, l) => s + l.limit, 0);
  const routes: RouteCapacity[] = [];
  // (a) cash-flow substitution: monthly movable spend goes on the cards; the cash it frees is placed as premium. Fee 0.
  const subCapacity = lines.reduce((s, l) => s + Math.min(l.limit, movableSpend * l.promoMonths), 0);
  routes.push({ route: "cash_flow_substitution", label: "Cash-flow substitution", plain: "Everyday spending moves onto the 0% cards; the cash it frees is placed as premium. No fee.", available: movableSpend > 0 && lines.length > 0, grossCapacity: Math.min(subCapacity, aggregateLimit), feeRate: 0, fees: 0, netCapital: Math.min(subCapacity, aggregateLimit) });
  // (b) transfer to bank on issuers that offer it.
  const tbLines = lines.filter(l => rules.find(r => r.id === l.issuer)?.transferToBankAvailable);
  const tbGross = tbLines.reduce((s, l) => s + l.limit * 0.9, 0);
  const tbFee = tbLines.length ? (rules.find(r => r.id === tbLines[0].issuer)?.balanceTransferFee ?? 0.05) : 0;
  routes.push({ route: "transfer_to_bank", label: "Promotional transfer to bank", plain: "A promotional balance transfer paid to the household's bank account, then placed as premium. Fee applies; offers are periodic.", available: tbLines.length > 0, grossCapacity: tbGross, feeRate: tbFee, fees: tbGross * tbFee, netCapital: tbGross * (1 - tbFee), reason: tbLines.length ? undefined : "No sequenced issuer offers transfer-to-bank." });
  // (c) bill-pay service.
  const bpGross = aggregateLimit;
  routes.push({ route: "bill_pay_service", label: "Card-to-check bill-pay service", plain: "A service charges the card and mails a check to the carrier. Fee applies on every dollar.", available: aggregateLimit > 0, grossCapacity: bpGross, feeRate: R.billPayServiceFee.value, fees: bpGross * R.billPayServiceFee.value, netCapital: bpGross * (1 - R.billPayServiceFee.value) });
  // (d) direct premium by card.
  routes.push({ route: "premium_by_card", label: "Premium paid by card directly", plain: "Only if the carrier accepts card payment for premiums.", available: input.carrierAcceptsCard, grossCapacity: input.carrierAcceptsCard ? aggregateLimit : 0, feeRate: 0, fees: 0, netCapital: input.carrierAcceptsCard ? aggregateLimit : 0, reason: input.carrierAcceptsCard ? undefined : "Most carriers do not accept card payment for premiums; confirm with the carrier." });

  // Deployment plan: cheapest routes first, capped by aggregate limit and by the premium target over the horizon.
  const premiumTarget = input.targetAnnualPremium * (H / 12);
  let remainingLimit = aggregateLimit;
  let remainingTarget = premiumTarget;
  let deployableGross = 0;
  let fees = 0;
  for (const r of [...routes].filter(r => r.available).sort((a, b) => a.feeRate - b.feeRate)) {
    const take = Math.max(0, Math.min(r.grossCapacity, remainingLimit, remainingTarget));
    r.grossCapacity = take;
    r.fees = take * r.feeRate;
    r.netCapital = take - r.fees;
    deployableGross += take;
    fees += r.fees;
    remainingLimit -= take;
    remainingTarget -= take;
  }
  const deployableNet = deployableGross - fees;

  // Spread the drawn capital across lines in proportion to limit; payoff per line so it is cleared by promo end.
  for (const l of lines) {
    l.deployed = aggregateLimit > 0 ? Math.round((deployableGross * l.limit) / aggregateLimit) : 0;
    l.fees = aggregateLimit > 0 ? (fees * l.limit) / aggregateLimit : 0;
    const monthsToClear = Math.max(1, l.promoEndsMonth - l.openedMonth - 1); // one month of slack before the promo ends
    l.monthlyPayoff = l.deployed / monthsToClear;
    l.clearedMonth = l.openedMonth + monthsToClear;
    calendar.push({ month: l.clearedMonth, kind: "cleared", issuer: l.issuer, issuerName: l.issuerName, cardIndex: l.cardIndex, detail: `Card ${l.cardIndex} at zero, one month before its promo ends.`, amount: l.deployed, hardInquiry: false });
    calendar.push({ month: l.promoEndsMonth, kind: "promo_ends", issuer: l.issuer, issuerName: l.issuerName, cardIndex: l.cardIndex, detail: `Promo ends on card ${l.cardIndex}; any balance now accrues at ${(R.postPromoApr.value * 100).toFixed(2)}%.`, hardInquiry: false });
  }
  calendar.sort((a, b) => a.month - b.month || a.cardIndex - b.cardIndex);

  // ── Month rows ──
  const months: MonthRow[] = [];
  let peakPayoff = 0;
  let feasible = true;
  let cumPremium = 0;
  for (let m = 1; m <= H; m++) {
    const open = lines.filter(l => l.openedMonth <= m);
    const agg = open.reduce((s, l) => s + (m >= l.openedMonth + (rules.find(r => r.id === l.issuer)?.cliRequestAfterMonths ?? 6) ? l.limit : l.limit - Math.round((l.limit / (1 + (rules.find(r => r.id === l.issuer)?.cliTypicalIncrease ?? 0.25))) * (rules.find(r => r.id === l.issuer)?.cliTypicalIncrease ?? 0.25) / 500) * 500), 0);
    let drawn = 0, payoff = 0, placed = 0;
    for (const l of open) {
      if (m >= l.openedMonth && m < l.clearedMonth) {
        const drawMonths = Math.max(1, Math.min(3, l.clearedMonth - l.openedMonth)); // capital is drawn over the first three months of the line
        if (m < l.openedMonth + drawMonths) placed += l.deployed / drawMonths;
        const outstanding = Math.max(0, l.deployed - l.monthlyPayoff * (m - l.openedMonth));
        drawn += outstanding;
        payoff += l.monthlyPayoff;
      }
    }
    cumPremium += placed;
    const util = (input.existingRevolvingLimit + agg) > 0 ? (input.existingRevolvingBalance + drawn) / (input.existingRevolvingLimit + agg) : 0;
    const surplus = baseSurplus - payoff;
    if (surplus < 0) feasible = false;
    peakPayoff = Math.max(peakPayoff, payoff);
    months.push({ month: m, aggregateLimit: agg, drawn, premiumPlaced: placed, payoff, utilization: util, cashFlowSurplus: surplus });
  }

  // ── Comparison ──
  const netPremium = deployableNet * (1 - R.policyLoadOnPremium.value);
  const yearsInPolicy = H / 12 / 2; // capital is placed across the horizon; average time in the policy is half the horizon
  const policyValue = netPremium * Math.pow(1 + input.policyCreditingRate, yearsInPolicy);
  const doNothing = deployableGross; // the same repayments, kept as cash, are worth the principal (0% on cash by construction)
  const netBenefit = policyValue - doNothing;
  // Break-even crediting rate: netPremium (1+r)^y = deployableGross
  const breakEven = netPremium > 0 ? Math.pow(deployableGross / netPremium, 1 / Math.max(yearsInPolicy, 0.01)) - 1 : 0;
  const comparison: Comparison = { premiumPlaced: deployableGross, feesPaid: fees, policyValueAtHorizon: policyValue, doNothingValueAtHorizon: doNothing, netBenefit, breakEvenCreditingRate: breakEven, peakMonthlyPayoff: peakPayoff, cashFlowFeasible: feasible };

  // ── Risks ──
  const risks: CreditLineRisk[] = [];
  const hardInquiries = calendar.filter(e => e.hardInquiry).length;
  if (!feasible) risks.push({ severity: "high", title: "Payoff exceeds monthly surplus", plain: `Peak payoff of $${Math.round(peakPayoff).toLocaleString()} a month is more than the household's surplus. Reduce the premium target or the number of lines.` });
  if (hardInquiries > 0) risks.push({ severity: "medium", title: `${hardInquiries} hard inquiries`, plain: `Expect roughly ${hardInquiries * R.hardInquiryPointsEach.value} points off the score for up to a year, plus a younger average account age.` });
  const maxUtil = months.reduce((m, r) => Math.max(m, r.utilization), 0);
  if (maxUtil > R.utilizationWarnAbove.value) risks.push({ severity: "medium", title: "Utilization above 30% at peak", plain: `Peak utilization ${(maxUtil * 100).toFixed(0)}%. Scores recover as lines are cleared, but do not apply for a mortgage during the plan.` });
  risks.push({ severity: "high", title: "Promo end is a cliff", plain: `A balance left past a promo end accrues at about ${(R.postPromoApr.value * 100).toFixed(1)}%. The schedule clears each line one month early; missing it erases the benefit.` });
  risks.push({ severity: "medium", title: "Issuer rules are unverified", plain: "Approval policies here are community-reported. A denial still costs an inquiry. Confirm with each issuer first." });
  if (breakEven > input.policyCreditingRate) risks.push({ severity: "high", title: "Fees exceed the crediting benefit", plain: `Break-even crediting is ${(breakEven * 100).toFixed(1)}% against an assumed ${(input.policyCreditingRate * 100).toFixed(1)}%. The strategy loses money at these fees.` });
  risks.push({ severity: "low", title: "This is not free money", plain: "Every dollar placed is repaid from cash flow inside the promo window. The benefit is the time the capital spends compounding, not the capital itself." });

  return {
    suitability, calendar, lines, routes, months,
    totals: { aggregateLimit, deployableGross, fees, deployableNet, hardInquiries, cardsOpened: lines.length },
    comparison, risks, provenance,
  };
}

/** One-line summary for the results hub. */
export function summarizeCreditLine(r: CreditLineResult): Record<string, number | boolean | string> {
  return {
    suitable: r.suitability.suitable,
    suitabilityScore: r.suitability.score,
    cardsOpened: r.totals.cardsOpened,
    aggregateLimit: r.totals.aggregateLimit,
    deployableNet: r.totals.deployableNet,
    fees: r.totals.fees,
    peakMonthlyPayoff: r.comparison?.peakMonthlyPayoff ?? 0,
    netBenefit: r.comparison?.netBenefit ?? 0,
    cashFlowFeasible: r.comparison?.cashFlowFeasible ?? false,
    rulesVersion: r.provenance.rulesVersion,
  };
}
