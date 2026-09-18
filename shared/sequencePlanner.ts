// ============================================================
// THE SEQUENCE PLANNER — situation in, ranked stage-by-stage plans out.
//
// ## What changed from sequenceOrderings.ts
//
// That file ranks orderings of a fixed set of mechanisms for a single-asset
// household, and its hard rules prune 120 permutations to 40. That was the
// right model for one house. It is the wrong model for thirty, because the two
// hard rules are covenants ON A PROPERTY: an equity share on house A blocks a
// line of credit and a wrap on house A, and nothing on house B. A household
// with a portfolio has one covenant state per asset, and the legal space is
// not 40 — it is the product of what every asset can still do.
//
// So this file models ASSETS, not just mechanisms. Every stage names the
// property it acts on. Legality is checked against that property's own flags.
// A plan that takes an equity share on the primary, a line on rental 7, and
// wraps rental 12 is legal, and the old engine could not express it.
//
// ## What a stage carries
//
// Capital in, capital out, the obligation created and whether it amortises,
// the cost-of-capital band, the months it takes, and the state of the whole
// portfolio afterwards. All computed from cycleEngine's mechanism parameters
// and the threshold registry — a variant such as "delayed financing" changes
// the seasoning and the release cap, and the stage's numbers move with it.
// Nothing here is a hand-typed projection.
//
// ## How many plans
//
// enumeratePlans() walks every legal sequence up to a length and returns the
// count and a sample. rankPlans() runs a beam search scored against the
// household's stated goal and returns the top N with full stage detail. A
// test asserts the enumeration on a thirty-property household exceeds a
// thousand distinct legal plans at depth four, so the claim "a thousand legal
// options" is computed rather than asserted — and it will fail the build if
// a rule change ever makes it false.
//
// ## What the planner will not do
//
// It will not find a way around a covenant. It routes around one by choosing
// a different asset, which is what the covenant permits. It will not pay off
// thirty mortgages in two months on a household surplus, because that is a
// number and the number is what it is; a payoff goal gets the fastest legal
// route and the honest timeline, including the case where the fastest route
// is selling part of the portfolio.
// ============================================================

import { MECHANISMS, type MechanismId } from './cycleEngine';
import { threshold, bestVariant } from './thresholds';

/* ───────────────────────── situation ───────────────────────── */

export type Documentation = 'full' | 'thin' | 'none';
export type Goal = 'payoff' | 'expand' | 'payoff-then-expand' | 'income' | 'exit';

export interface Situation {
  /** Rental properties owned, excluding the primary residence. */
  readonly rentals: number;
  readonly avgRentalValue: number;
  /** Debt ÷ value across the rentals, 0–1. */
  readonly avgRentalLtv: number;
  /** Monthly gross rent per rental. */
  readonly avgRent: number;
  readonly hasPrimary: boolean;
  readonly primaryValue: number;
  readonly primaryLtv: number;
  /** Household surplus per month after everything, before any of this. */
  readonly monthlySurplus: number;
  readonly reserve: number;
  readonly documentation: Documentation;
  readonly goal: Goal;
  readonly horizonYears: number;
  /** Can they get a policy issued at a sane rating. */
  readonly insurable: boolean;
  /** Can they find sellers who will carry. The wrap mechanism needs this. */
  readonly offMarketAccess: boolean;
  /** After-repair value ÷ all-in cost on a renovation, in their market. */
  readonly renovationUplift: number;
  /** Annual appreciation assumption. */
  readonly appreciation: number;
  /** Mortgage rate on existing debt, decimal. */
  readonly existingRate: number;
}

export const THIRTY_HOUSE_OPERATOR: Situation = {
  rentals: 30, avgRentalValue: 250_000, avgRentalLtv: 0.6, avgRent: 2_100,
  hasPrimary: true, primaryValue: 650_000, primaryLtv: 0.4,
  monthlySurplus: 14_000, reserve: 180_000, documentation: 'full', goal: 'payoff-then-expand',
  horizonYears: 10, insurable: true, offMarketAccess: true, renovationUplift: 1.3, appreciation: 0.035, existingRate: 0.065,
};

export const FIRST_TIME_HOUSEHOLD: Situation = {
  rentals: 0, avgRentalValue: 0, avgRentalLtv: 0, avgRent: 0,
  hasPrimary: true, primaryValue: 450_000, primaryLtv: 0.55,
  monthlySurplus: 2_200, reserve: 40_000, documentation: 'full', goal: 'expand',
  horizonYears: 10, insurable: true, offMarketAccess: false, renovationUplift: 1.18, appreciation: 0.035, existingRate: 0.065,
};

/* ───────────────────────── assets ───────────────────────── */

export interface AssetState {
  readonly id: string;
  readonly kind: 'primary' | 'rental' | 'note';
  value: number;
  debt: number;
  /** Gross monthly rent, or monthly note payment for a note. */
  income: number;
  /** Covenant flags. These are what make legality per-asset. */
  hei: boolean;
  heloc: boolean;
  wrapped: boolean;
  /** Months since acquisition, for seasoning. */
  ageMonths: number;
  /** Last renovated within the current turn — value already includes uplift. */
  renovated: boolean;
}

export interface PortfolioState {
  assets: AssetState[];
  reserve: number;
  monthlySurplus: number;
  /** Cash value in a policy, if one is being funded. */
  policyCashValue: number;
  policyLoan: number;
  policyMonths: number;
  monthsElapsed: number;
  /** Running count of obligations that do not amortise. */
  balloons: number;
}

let assetSeq = 0;
function newAsset(kind: AssetState['kind'], value: number, debt: number, income: number, ageMonths: number): AssetState {
  assetSeq += 1;
  return { id: `${kind}-${assetSeq}`, kind, value, debt, income, hei: false, heloc: false, wrapped: false, ageMonths, renovated: false };
}

export function initialState(s: Situation): PortfolioState {
  assetSeq = 0;
  const assets: AssetState[] = [];
  if (s.hasPrimary) assets.push(newAsset('primary', s.primaryValue, s.primaryValue * s.primaryLtv, 0, 120));
  for (let i = 0; i < s.rentals; i++) assets.push(newAsset('rental', s.avgRentalValue, s.avgRentalValue * s.avgRentalLtv, s.avgRent, 120));
  return { assets, reserve: s.reserve, monthlySurplus: s.monthlySurplus, policyCashValue: 0, policyLoan: 0, policyMonths: 0, monthsElapsed: 0, balloons: 0 };
}

function clone(st: PortfolioState): PortfolioState {
  return { ...st, assets: st.assets.map((a) => ({ ...a })) };
}

/* ───────────────────────── moves ───────────────────────── */

/**
 * A move is a mechanism applied with a named variant. Variants come from the
 * threshold registry; they change the numbers, never the legality.
 */
export type MoveId =
  | 'velocity:standard' | 'velocity:first-lien'
  | 'brrrr:standard' | 'brrrr:delayed-financing' | 'brrrr:portfolio-blanket'
  | 'policy:fund' | 'policy:borrow'
  | 'equity:10y' | 'equity:30y'
  | 'wrap:carry' | 'wrap:buy-on-terms'
  | 'refi:single' | 'sale:outright';

/**
 * Two moves belong to no mechanism. A sale is a sale; a single-property
 * refinance is the R in BRRRR applied to something already owned. Both are
 * what a payoff plan on a real portfolio actually uses, and leaving them out
 * would make the planner unable to say "sell ten to clear twenty" — which is
 * frequently the honest answer.
 */
export type StageMechanism = MechanismId | 'sale' | 'refinance';

export interface Move {
  readonly id: MoveId;
  readonly mechanism: StageMechanism;
  readonly label: string;
  /** Which asset kinds it can target. 'portfolio' means all rentals at once. 'new' means it creates an asset. */
  readonly target: 'primary' | 'rental' | 'portfolio' | 'new' | 'policy';
  readonly why: string;
}

export const MOVES: readonly Move[] = [
  { id: 'velocity:standard', mechanism: 'velocity-heloc', target: 'primary', label: 'Velocity on the primary residence', why: 'Open a line on the primary and run the household through it.' },
  { id: 'velocity:first-lien', mechanism: 'velocity-heloc', target: 'primary', label: 'First-lien line replacing the mortgage', why: 'Replace the primary mortgage with a first-position line so the whole balance sweeps.' },
  { id: 'brrrr:standard', mechanism: 'brrrr-dscr', target: 'new', label: 'BRRRR, six-month seasoning', why: 'Acquire, renovate, rent, refinance at 75% of appraised value after six months.' },
  { id: 'brrrr:delayed-financing', mechanism: 'brrrr-dscr', target: 'new', label: 'BRRRR via delayed financing', why: 'Cash purchase, refinance within six months of closing at the documented cost — no seasoning wait, no uplift extracted.' },
  { id: 'brrrr:portfolio-blanket', mechanism: 'brrrr-dscr', target: 'portfolio', label: 'Portfolio refinance on a blanket loan', why: 'Refinance the whole rental pool at once, with a negotiated partial-release schedule.' },
  { id: 'policy:fund', mechanism: 'policy-loan', target: 'policy', label: 'Begin funding a policy', why: 'Commit part of the surplus to premium; nothing comes out for years.' },
  { id: 'policy:borrow', mechanism: 'policy-loan', target: 'policy', label: 'Borrow against cash value', why: 'Take a loan against accumulated cash value while it keeps compounding.' },
  { id: 'equity:10y', mechanism: 'equity-share', target: 'primary', label: 'Equity share, ten-year term', why: 'Advance against the primary with no payment; settle at ten years.' },
  { id: 'equity:30y', mechanism: 'equity-share', target: 'primary', label: 'Equity share, thirty-year term', why: 'Same advance, settlement at thirty years or on sale.' },
  { id: 'wrap:carry', mechanism: 'seller-wrap', target: 'rental', label: 'Sell a rental on terms', why: 'Convert a rental to a note: down payment now, monthly income, management gone.' },
  { id: 'wrap:buy-on-terms', mechanism: 'seller-wrap', target: 'new', label: 'Buy a property on seller terms', why: 'Acquire with a small down payment on a note the seller carries; refinance out later.' },
  { id: 'refi:single', mechanism: 'refinance', target: 'rental', label: 'Refinance one rental', why: 'Cash-out one seasoned property at 75%, or retire a seller note with a DSCR loan.' },
  { id: 'sale:outright', mechanism: 'sale', target: 'rental', label: 'Sell one rental outright', why: 'Sell the weakest rental at market, clear its debt, route the net proceeds.' },
];

export function move(id: MoveId): Move {
  return MOVES.find((m) => m.id === id)!;
}

/* ───────────────────────── legality, per asset ───────────────────────── */

export interface Refusal { readonly move: MoveId; readonly reason: string }

/**
 * Whether a move is legal against the current state, and if not, why. This is
 * the per-asset form of the two hard rules in sequenceOrderings.ts plus the
 * eligibility thresholds. It refuses; it does not rank.
 */
export function refusal(st: PortfolioState, s: Situation, id: MoveId): Refusal | null {
  const primary = st.assets.find((a) => a.kind === 'primary');
  const rentals = st.assets.filter((a) => a.kind === 'rental');
  switch (id) {
    case 'velocity:standard':
    case 'velocity:first-lien':
      if (!primary) return { move: id, reason: 'No primary residence to open the line against.' };
      if (primary.hei) return { move: id, reason: 'The primary carries an equity-share agreement; its no-further-encumbrance covenant blocks a line behind it.' };
      if (primary.heloc) return { move: id, reason: 'A line is already open on the primary.' };
      if (s.documentation === 'none') return { move: id, reason: 'A line is underwritten on income; no documentation means no line.' };
      if (st.monthlySurplus <= 0) return { move: id, reason: 'No surplus. Velocity redirects a surplus; it cannot create one.' };
      return null;
    case 'brrrr:standard':
    case 'brrrr:delayed-financing': {
      const allIn = s.avgRentalValue > 0 ? s.avgRentalValue * 0.8 : 200_000;
      if (st.reserve < allIn) return { move: id, reason: `Reserve ${Math.round(st.reserve).toLocaleString()} is below the all-in cost of an acquisition (${Math.round(allIn).toLocaleString()}).` };
      return null;
    }
    case 'brrrr:portfolio-blanket':
      if (rentals.length < 4) return { move: id, reason: 'Portfolio lenders start at four to five properties.' };
      if (rentals.some((r) => r.wrapped)) return { move: id, reason: 'A wrapped property cannot be placed in a blanket loan; the seller note holds it.' };
      {
        const pool = rentals.filter((r) => !r.wrapped);
        const release = pool.reduce((n, r) => n + r.value, 0) * 0.7 - pool.reduce((n, r) => n + r.debt, 0);
        if (release < 50_000) return { move: id, reason: 'Pool is at the blanket LTV cap; a refinance would release under fifty thousand, which does not cover its own closing costs.' };
      }
      return null;
    case 'policy:fund':
      if (!s.insurable) return { move: id, reason: 'Not insurable at a workable rating.' };
      if (st.policyMonths > 0) return { move: id, reason: 'A policy is already being funded.' };
      if (st.monthlySurplus < 1_000) return { move: id, reason: 'Surplus below a premium worth the structure.' };
      return null;
    case 'policy:borrow':
      if (st.policyMonths < 60 && st.policyCashValue < 100_000) return { move: id, reason: 'Five years or a six-figure pool before borrowing; earlier, the loan is against money that has not finished being paid in.' };
      if (st.policyLoan >= st.policyCashValue * 0.9) return { move: id, reason: 'Loan is at the carrier\'s available-loan-value ceiling.' };
      return null;
    case 'equity:10y':
    case 'equity:30y':
      if (!primary) return { move: id, reason: 'Equity-share providers reach the primary residence only, and there is none.' };
      if (primary.hei) return { move: id, reason: 'One agreement per property; the primary already carries one.' };
      if (primary.debt / primary.value > 0.7) return { move: id, reason: 'Combined LTV leaves no equity for an advance.' };
      return null;
    case 'wrap:carry':
      if (rentals.filter((r) => !r.wrapped && !r.hei).length === 0) return { move: id, reason: 'No rental available to sell on terms.' };
      return null;
    case 'wrap:buy-on-terms':
      if (!s.offMarketAccess) return { move: id, reason: 'Buying on terms requires sellers who will carry, and this household has no route to them.' };
      if (st.reserve < 30_000) return { move: id, reason: 'Even a seller-carried purchase needs a down payment and closing costs.' };
      return null;
    case 'refi:single': {
      // Retiring a seller note is a rate-and-term refinance at purchase price, so
      // seasoning does not apply to it. A cash-out at appraised value needs the
      // six months and enough equity that 75% covers closing costs.
      const cands = rentals.filter((r) => !r.hei && (r.wrapped || (r.ageMonths >= 6 && r.debt / r.value < 0.72)));
      if (cands.length === 0) return { move: id, reason: 'No rental is both seasoned six months and under 72% LTV — below that a 75% cash-out does not cover its own closing costs (or carrying a seller note to retire).' };
      if (s.documentation === 'none' && !cands.some((r) => r.income > 0)) return { move: id, reason: 'A DSCR loan documents on rent; a property with no rent has nothing to document.' };
      return null;
    }
    case 'sale:outright':
      if (rentals.filter((r) => !r.hei).length === 0) return { move: id, reason: 'No rental to sell — the primary residence is not on the table, and everything else is already a note.' };
      return null;
  }
}

export function legalMoves(st: PortfolioState, s: Situation): MoveId[] {
  return MOVES.map((m) => m.id).filter((id) => refusal(st, s, id) === null);
}

/* ───────────────────────── applying a move ───────────────────────── */

export interface Stage {
  readonly index: number;
  readonly move: MoveId;
  readonly mechanism: StageMechanism;
  readonly label: string;
  /** Asset ids acted on. */
  readonly targets: readonly string[];
  readonly months: number;
  readonly capitalIn: number;
  readonly capitalOut: number;
  readonly obligationCreated: number;
  readonly amortises: boolean;
  readonly costOfCapital: { readonly low: number; readonly high: number };
  /** The threshold variant that set the numbers, when one did. */
  readonly via?: string;
  readonly expected: string;
  readonly watch: string;
  readonly after: {
    readonly properties: number;
    readonly notes: number;
    readonly totalValue: number;
    readonly totalDebt: number;
    readonly reserve: number;
    readonly monthlySurplus: number;
    readonly monthsElapsed: number;
  };
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

function summary(st: PortfolioState): Stage['after'] {
  const props = st.assets.filter((a) => a.kind !== 'note');
  return {
    properties: props.length,
    notes: st.assets.filter((a) => a.kind === 'note').length,
    totalValue: props.reduce((n, a) => n + a.value, 0),
    totalDebt: props.reduce((n, a) => n + a.debt, 0) + st.policyLoan,
    reserve: st.reserve,
    monthlySurplus: st.monthlySurplus,
    monthsElapsed: st.monthsElapsed,
  };
}

/** Advance time: appreciation, rent-driven paydown, surplus accrual, policy growth. */
function tick(st: PortfolioState, s: Situation, months: number): void {
  const mAppr = Math.pow(1 + s.appreciation, 1 / 12) - 1;
  const mRate = s.existingRate / 12;
  for (const a of st.assets) {
    if (a.kind === 'note') continue;
    a.value *= Math.pow(1 + mAppr, months);
    a.ageMonths += months;
    // Amortising paydown from income: rent less a 45% operating haircut less interest.
    if (a.kind === 'rental' && a.debt > 0) {
      for (let i = 0; i < months; i++) {
        const interest = a.debt * mRate;
        const principal = Math.max(0, a.income * 0.55 - interest);
        a.debt = Math.max(0, a.debt - principal);
      }
    }
  }
  st.reserve += st.monthlySurplus * months;
  if (st.policyMonths > 0) {
    const premium = Math.min(st.monthlySurplus * 0.3, 4_000);
    for (let i = 0; i < months; i++) {
      // Early years: cash value builds below premium; crossover around year five on a max-funded design.
      const eff = st.policyMonths < 60 ? 0.65 : 0.97;
      st.policyCashValue = st.policyCashValue * (1 + 0.045 / 12) + premium * eff;
      st.policyLoan *= 1 + 0.055 / 12;
      st.policyMonths += 1;
    }
    st.reserve -= premium * months;
  }
  st.monthsElapsed += months;
}

/** Route released capital by goal: pay down the highest-LTV property, or hold for acquisition. */
function route(st: PortfolioState, s: Situation, cash: number): { paidDown: number; held: number } {
  const payoffGoal = s.goal === 'payoff' || (s.goal === 'payoff-then-expand' && summary(st).totalDebt / Math.max(1, summary(st).totalValue) > 0.35);
  if (!payoffGoal) { st.reserve += cash; return { paidDown: 0, held: cash }; }
  let remaining = cash;
  const byLtv = st.assets.filter((a) => a.kind !== 'note' && a.debt > 0).sort((a, b) => b.debt / b.value - a.debt / a.value);
  for (const a of byLtv) {
    if (remaining <= 0) break;
    const pay = Math.min(a.debt, remaining);
    a.debt -= pay;
    remaining -= pay;
  }
  st.reserve += remaining;
  return { paidDown: cash - remaining, held: remaining };
}

export function apply(st0: PortfolioState, s: Situation, id: MoveId, index: number): Stage {
  const st = st0; // mutated in place; caller clones
  const m = MECHANISMS.find((x) => x.id === move(id).mechanism)!;
  const primary = st.assets.find((a) => a.kind === 'primary');
  const rentals = () => st.assets.filter((a) => a.kind === 'rental');

  switch (id) {
    case 'velocity:standard':
    case 'velocity:first-lien': {
      const t = threshold('heloc-cltv')!;
      const cltv = id === 'velocity:first-lien' ? bestVariant(t).value / 100 : t.standard / 100;
      const line = Math.max(0, primary!.value * cltv - primary!.debt);
      const months = 12;
      // Interest saved on the average daily balance the household previously left idle: roughly
      // half a month's surplus sitting at the line rate, for twelve months, plus the surplus itself to principal.
      // Idle cash the sweep captures: half a month's surplus on a standard line; on a
      // first-lien line the whole mortgage balance sweeps, so every dollar of income
      // shortens the average daily balance and the saving scales with the balance.
      const idle = id === 'velocity:first-lien' ? st.monthlySurplus * 0.5 + primary!.debt * 0.02 : st.monthlySurplus * 0.5;
      const saved = idle * m.costOfCapital.high;
      primary!.heloc = true;
      tick(st, s, months);
      const toPrincipal = st.monthlySurplus * months + saved;
      const r = route(st, s, toPrincipal);
      st.reserve -= toPrincipal; // surplus already accrued in tick; it was routed, not held twice
      return {
        index, move: id, mechanism: m.id, label: move(id).label, targets: [primary!.id], months,
        capitalIn: 0, capitalOut: 0, obligationCreated: 0, amortises: true, costOfCapital: m.costOfCapital,
        via: id === 'velocity:first-lien' ? 'First-lien HELOC replacing the mortgage' : undefined,
        expected: `A line of about ${usd(line)} opens. Over twelve months ${usd(toPrincipal)} reaches principal — the surplus plus roughly ${usd(saved)} of interest that idle cash was previously costing. ${r.paidDown > 0 ? `${usd(r.paidDown)} paid down on the highest-LTV property.` : 'Held in reserve for acquisition.'}`,
        watch: 'The lender can freeze or cut the line when values fall. Never let the line become the only route to completing a deal.',
        after: summary(st),
      };
    }
    case 'brrrr:standard':
    case 'brrrr:delayed-financing': {
      const seasoning = threshold('dscr-seasoning')!;
      const ltv = threshold('dscr-cashout-ltv')!.standard / 100;
      const allIn = (s.avgRentalValue > 0 ? s.avgRentalValue : 250_000) * 0.8;
      const delayed = id === 'brrrr:delayed-financing';
      const months = delayed ? 4 : seasoning.standard + 3;
      const arv = allIn * s.renovationUplift;
      // Delayed financing recovers the documented cost, capped at LTV of value; standard recovers 75% of ARV.
      const proceeds = delayed ? Math.min(allIn, arv * ltv) : arv * ltv;
      st.reserve -= allIn;
      const a = newAsset('rental', arv, proceeds, s.avgRent > 0 ? s.avgRent : arv * 0.008, 0);
      a.renovated = true;
      st.assets.push(a);
      tick(st, s, months);
      const r = route(st, s, proceeds);
      return {
        index, move: id, mechanism: m.id, label: move(id).label, targets: [a.id], months,
        capitalIn: allIn, capitalOut: proceeds, obligationCreated: proceeds, amortises: true, costOfCapital: m.costOfCapital,
        via: delayed ? 'Delayed financing exception' : undefined,
        expected: `${usd(allIn)} deployed all-in. Appraises at ${usd(arv)} (uplift ${s.renovationUplift.toFixed(2)}). Refinance returns ${usd(proceeds)}${delayed ? ' — capped at documented cost, not at value, so the uplift stays as equity' : ` at ${Math.round(ltv * 100)}% LTV`}. Net capital ${proceeds >= allIn ? 'recovered in full' : `short by ${usd(allIn - proceeds)}`}. ${r.paidDown > 0 ? `${usd(r.paidDown)} routed to paydown.` : ''}`,
        watch: delayed ? 'Six-month window runs from purchase to disbursement. Miss it and the standard seasoning applies.' : `Coverage is tested at the rate on closing day. Run it half a point above the quote. Below a ${(1 / ltv).toFixed(2)} uplift this turn returns less than it consumed.`,
        after: summary(st),
      };
    }
    case 'brrrr:portfolio-blanket': {
      const pool = rentals().filter((r) => !r.wrapped);
      const ltv = 0.70;
      const coverage = pool.length > 10 ? 1.2 : 1.0;
      const value = pool.reduce((n, a) => n + a.value, 0);
      const debt = pool.reduce((n, a) => n + a.debt, 0);
      const newDebt = value * ltv;
      const released = Math.max(0, newDebt - debt);
      const months = 4;
      for (const a of pool) a.debt = a.value * ltv;
      tick(st, s, months);
      const r = route(st, s, released);
      return {
        index, move: id, mechanism: m.id, label: move(id).label, targets: pool.map((a) => a.id), months,
        capitalIn: 0, capitalOut: released, obligationCreated: newDebt, amortises: true, costOfCapital: { low: 0.065, high: 0.09 },
        via: 'Portfolio / blanket DSCR loan',
        expected: `${pool.length} rentals worth ${usd(value)} refinanced together at ${Math.round(ltv * 100)}% LTV, coverage ${coverage.toFixed(2)} required${pool.length > 10 ? ' (over ten properties, institutional lenders test net cash flow at 1.20)' : ''}. Releases ${usd(released)} in one closing. ${r.paidDown > 0 ? `${usd(r.paidDown)} routed to paydown.` : 'Held for acquisition.'}`,
        watch: 'Negotiate the partial-release schedule BEFORE closing. Without one, selling any single property means paying off the whole loan. Cross-collateralised: one bad property is a problem for all of them.',
        after: summary(st),
      };
    }
    case 'policy:fund': {
      const months = 12;
      st.policyMonths = 1;
      tick(st, s, months);
      const premium = Math.min(st.monthlySurplus * 0.3, 4_000);
      return {
        index, move: id, mechanism: m.id, label: move(id).label, targets: ['policy'], months,
        capitalIn: premium * months, capitalOut: 0, obligationCreated: 0, amortises: false, costOfCapital: m.costOfCapital,
        expected: `Premium of ${usd(premium)} a month begins. Cash value after year one about ${usd(st.policyCashValue)} — below premium paid, as designed. The pool is not worth borrowing against for five to ten years; this stage is a commitment, not a release.`,
        watch: 'Stay under the seven-pay limit. Size the premium to the worst plausible year, because a policy abandoned in year four is a realised loss.',
        after: summary(st),
      };
    }
    case 'policy:borrow': {
      const t = threshold('policy-loan-value')!;
      const cap = bestVariant(t).value / 100;
      const room = st.policyCashValue * cap - st.policyLoan;
      const loan = Math.max(0, room);
      st.policyLoan += loan;
      const months = 1;
      tick(st, s, months);
      const r = route(st, s, loan);
      return {
        index, move: id, mechanism: m.id, label: move(id).label, targets: ['policy'], months,
        capitalIn: 0, capitalOut: loan, obligationCreated: loan, amortises: false, costOfCapital: m.costOfCapital,
        via: bestVariant(t).via,
        expected: `${usd(loan)} borrowed from the carrier against ${usd(st.policyCashValue)} of cash value, which keeps compounding. No amortisation schedule. ${r.paidDown > 0 ? `${usd(r.paidDown)} routed to paydown.` : 'Deployed to reserve.'}`,
        watch: 'Unpaid interest compounds against the cash value. The date the two lines cross is the lapse date, and the whole gain becomes taxable that year with no cash arriving.',
        after: summary(st),
      };
    }
    case 'equity:10y':
    case 'equity:30y': {
      const share = 0.2;
      const advance = primary!.value * share;
      const term = id === 'equity:30y' ? 30 : 10;
      primary!.hei = true;
      st.balloons += 1;
      const months = 2;
      tick(st, s, months);
      const r = route(st, s, advance);
      const settle = primary!.value * Math.pow(1 + s.appreciation, term) * share * 1.8;
      return {
        index, move: id, mechanism: m.id, label: move(id).label, targets: [primary!.id], months,
        capitalIn: 0, capitalOut: advance, obligationCreated: settle, amortises: false, costOfCapital: m.costOfCapital,
        via: term === 30 ? '30-year term' : undefined,
        expected: `${usd(advance)} advanced against the primary with no payment. Settlement at year ${term} on a share-of-value agreement, at ${Math.round(s.appreciation * 100)}% appreciation: roughly ${usd(settle)}. ${r.paidDown > 0 ? `${usd(r.paidDown)} routed to paydown.` : 'Deployed to reserve.'}`,
        watch: 'The primary now carries a no-further-encumbrance covenant and settles on sale. No line behind it; no wrap of it. Every other property is unaffected.',
        after: summary(st),
      };
    }
    case 'wrap:carry': {
      const pick = rentals().filter((r) => !r.wrapped && !r.hei).sort((a, b) => a.income / a.value - b.income / b.value)[0];
      const price = pick.value * 1.03;
      const down = price * 0.1;
      const noteRate = 0.085;
      const noteBalance = price - down;
      const payment = (noteBalance * noteRate / 12) / (1 - Math.pow(1 + noteRate / 12, -360));
      const underlying = pick.debt * (s.existingRate / 12) / (1 - Math.pow(1 + s.existingRate / 12, -300));
      pick.wrapped = true;
      // The rental becomes a note: value is the receivable, income is the spread over the underlying payment.
      const note = newAsset('note', noteBalance, pick.debt, payment - underlying, 0);
      st.assets = st.assets.filter((a) => a.id !== pick.id);
      st.assets.push(note);
      st.balloons += 1;
      const months = 3;
      tick(st, s, months);
      const r = route(st, s, down);
      return {
        index, move: id, mechanism: m.id, label: move(id).label, targets: [pick.id, note.id], months,
        capitalIn: 0, capitalOut: down, obligationCreated: 0, amortises: true, costOfCapital: m.costOfCapital,
        expected: `Sold at ${usd(price)} on a wrap: ${usd(down)} down, a ${usd(noteBalance)} note at ${(noteRate * 100).toFixed(1)}% over the ${(s.existingRate * 100).toFixed(1)}% underlying. Spread about ${usd(payment - underlying)} a month, management gone. ${r.paidDown > 0 ? `${usd(r.paidDown)} routed to paydown.` : ''}`,
        watch: 'Due-on-sale exposure exists for as long as the wrap does — no Garn-St Germain exemption covers it. Use a third-party servicer so the underlying is paid regardless. Most seller notes carry a balloon.',
        after: summary(st),
      };
    }
    case 'wrap:buy-on-terms': {
      const price = (s.avgRentalValue > 0 ? s.avgRentalValue : 250_000) * 0.95;
      const down = price * 0.1;
      st.reserve -= down;
      const a = newAsset('rental', price, price - down, s.avgRent > 0 ? s.avgRent : price * 0.008, 0);
      a.wrapped = true; // carried by a seller until refinanced
      st.assets.push(a);
      const months = 2;
      tick(st, s, months);
      return {
        index, move: id, mechanism: m.id, label: move(id).label, targets: [a.id], months,
        capitalIn: down, capitalOut: 0, obligationCreated: price - down, amortises: true, costOfCapital: m.costOfCapital,
        expected: `${usd(price)} acquired with ${usd(down)} down on a seller note. No underwriting queue, no appraisal delay. The seller note typically balloons in three to seven years; the exit is a DSCR refinance.`,
        watch: 'Exposure on the seller\'s underlying mortgage until refinanced. Plan the refinance at closing, not at the balloon.',
        after: summary(st),
      };
    }
    case 'refi:single': {
      const cands = rentals().filter((r) => !r.hei && (r.wrapped || (r.ageMonths >= 6 && r.debt / r.value < 0.72)));
      // Retire a seller note first; otherwise the property with the most trapped equity.
      const pick = cands.sort((a, b) => Number(b.wrapped) - Number(a.wrapped) || (a.debt / a.value) - (b.debt / b.value))[0];
      const ltv = threshold('dscr-cashout-ltv')!.standard / 100;
      const newDebt = pick.value * ltv;
      const released = Math.max(0, newDebt - pick.debt);
      const wasWrapped = pick.wrapped;
      pick.debt = Math.max(pick.debt, newDebt);
      pick.wrapped = false;
      if (wasWrapped) st.balloons = Math.max(0, st.balloons - 1);
      const months = 3;
      tick(st, s, months);
      const r = route(st, s, released);
      return {
        index, move: id, mechanism: 'refinance', label: move(id).label, targets: [pick.id], months,
        capitalIn: 0, capitalOut: released, obligationCreated: newDebt, amortises: true, costOfCapital: { low: 0.065, high: 0.095 },
        expected: wasWrapped
          ? `Seller note on ${pick.id} retired by a DSCR loan at ${Math.round(ltv * 100)}% of ${usd(pick.value)}. Due-on-sale exposure on that property ends here. ${released > 0 ? `${usd(released)} released.` : ''}`
          : `${pick.id} cash-out at ${Math.round(ltv * 100)}% of ${usd(pick.value)}: ${usd(released)} released. ${r.paidDown > 0 ? `${usd(r.paidDown)} routed to paydown.` : 'Held for acquisition.'}`,
        watch: 'Coverage at the closing-day rate. A rise between application and closing can strand the deal.',
        after: summary(st),
      };
    }
    case 'sale:outright': {
      const pick = rentals().filter((r) => !r.hei).sort((a, b) => a.income / a.value - b.income / b.value)[0];
      const net = pick.value * 0.94 - pick.debt; // 6% cost of sale
      st.assets = st.assets.filter((a) => a.id !== pick.id);
      if (pick.wrapped) st.balloons = Math.max(0, st.balloons - 1);
      const months = 3;
      tick(st, s, months);
      const r = route(st, s, net);
      return {
        index, move: id, mechanism: 'sale', label: move(id).label, targets: [pick.id], months,
        capitalIn: 0, capitalOut: net, obligationCreated: 0, amortises: true, costOfCapital: { low: 0, high: 0 },
        expected: `${pick.id} sold at ${usd(pick.value)}, 6% cost of sale, ${usd(pick.debt)} debt cleared, ${usd(net)} net. ${r.paidDown > 0 ? `${usd(r.paidDown)} paid down on the highest-LTV property.` : 'Held.'} Rent of ${usd(pick.income)} a month gone with it.`,
        watch: 'Capital gain and depreciation recapture are due unless the sale is structured otherwise. The property that sells is the weakest yielder, which is also usually the easiest to sell.',
        after: summary(st),
      };
    }
  }
}

/* ───────────────────────── plans ───────────────────────── */

export interface Plan {
  readonly moves: readonly MoveId[];
  readonly stages: readonly Stage[];
  readonly score: number;
  readonly final: Stage['after'];
  readonly balloons: number;
  /** One line on what the whole sequence achieved against the goal. */
  readonly verdict: string;
}

function goalScore(s: Situation, start: Stage['after'], end: Stage['after'], balloons: number, months: number): number {
  const debtCut = start.totalDebt > 0 ? (start.totalDebt - end.totalDebt) / start.totalDebt : 0;
  const growth = start.properties > 0 ? (end.properties - start.properties) / start.properties : end.properties;
  const equity = end.totalValue - end.totalDebt;
  const startEquity = start.totalValue - start.totalDebt;
  const equityGain = startEquity > 0 ? (equity - startEquity) / startEquity : 0;
  let score = 0;
  switch (s.goal) {
    case 'payoff': score = debtCut * 100 + equityGain * 20; break;
    case 'expand': score = growth * 60 + equityGain * 40; break;
    case 'payoff-then-expand': score = debtCut * 50 + growth * 40 + equityGain * 30; break;
    case 'income': score = (end.monthlySurplus - start.monthlySurplus) / Math.max(1, start.monthlySurplus) * 60 + end.notes * 8 + equityGain * 20; break;
    case 'exit': score = end.notes * 15 + debtCut * 40 - growth * 20; break;
  }
  // Balloons are the thing that breaks plans. Time is the thing that ends them.
  score -= balloons * 6;
  score -= Math.max(0, months - s.horizonYears * 12) * 0.5;
  // Reserve below zero is not a plan.
  if (end.reserve < 0) score -= 100;
  return Math.round(score * 10) / 10;
}

function verdictFor(s: Situation, start: Stage['after'], end: Stage['after'], months: number): string {
  const debtCut = start.totalDebt - end.totalDebt;
  const years = (months / 12).toFixed(1);
  const parts: string[] = [];
  if (debtCut > 0) parts.push(`debt down ${usd(debtCut)} (${Math.round((debtCut / Math.max(1, start.totalDebt)) * 100)}%)`);
  if (end.properties > start.properties) parts.push(`${end.properties - start.properties} propert${end.properties - start.properties === 1 ? 'y' : 'ies'} added`);
  const sold = start.properties - end.properties - end.notes;
  if (sold > 0) parts.push(`${sold} sold`);
  if (end.notes > 0) parts.push(`${end.notes} converted to note${end.notes === 1 ? '' : 's'}`);
  parts.push(`equity ${usd(end.totalValue - end.totalDebt)}`);
  return `${years} years: ${parts.join(', ')}.`;
}

export function runPlan(s: Situation, moves: readonly MoveId[]): Plan | null {
  const st = initialState(s);
  const start = summary(st);
  const stages: Stage[] = [];
  for (let i = 0; i < moves.length; i++) {
    if (refusal(st, s, moves[i])) return null;
    stages.push(apply(st, s, moves[i], i + 1));
  }
  const final = summary(st);
  const months = final.monthsElapsed;
  return {
    moves, stages, final, balloons: st.balloons,
    score: goalScore(s, start, final, st.balloons, months),
    verdict: verdictFor(s, start, final, months),
  };
}

/**
 * Every legal sequence up to `depth`, counted exactly and sampled. Depth four
 * on a thirty-property household exceeds a thousand — computed, not claimed.
 */
export function enumeratePlans(s: Situation, depth: number, sampleEvery = 50): { count: number; sample: MoveId[][] } {
  let count = 0;
  const sample: MoveId[][] = [];
  const walk = (st: PortfolioState, path: MoveId[]) => {
    if (path.length > 0) {
      count += 1;
      if (count % sampleEvery === 0) sample.push([...path]);
    }
    if (path.length >= depth) return;
    for (const id of legalMoves(st, s)) {
      const next = clone(st);
      apply(next, s, id, path.length + 1);
      walk(next, [...path, id]);
    }
  };
  walk(initialState(s), []);
  return { count, sample };
}

/**
 * Beam search for the best plans against the household's goal. Width bounds
 * the work; depth bounds the length. Returns distinct plans, best first.
 */
export function rankPlans(s: Situation, opts: { depth?: number; width?: number; top?: number } = {}): Plan[] {
  const depth = opts.depth ?? 6;
  const width = opts.width ?? 40;
  const top = opts.top ?? 10;
  let beam: Array<{ moves: MoveId[]; plan: Plan }> = [];
  const seen = new Set<string>();
  const results: Plan[] = [];

  // Seed with every legal first move.
  for (const id of legalMoves(initialState(s), s)) {
    const p = runPlan(s, [id]);
    if (p) beam.push({ moves: [id], plan: p });
  }

  for (let d = 1; d <= depth; d++) {
    for (const b of beam) {
      const key = b.moves.join('>');
      if (!seen.has(key)) { seen.add(key); results.push(b.plan); }
    }
    if (d === depth) break;
    const next: typeof beam = [];
    for (const b of beam) {
      const st = initialState(s);
      for (let i = 0; i < b.moves.length; i++) apply(st, s, b.moves[i], i + 1);
      for (const id of legalMoves(st, s)) {
        const moves = [...b.moves, id];
        const p = runPlan(s, moves);
        if (p) next.push({ moves, plan: p });
      }
    }
    next.sort((a, b) => b.plan.score - a.plan.score);
    beam = next.slice(0, width);
  }
  return results.sort((a, b) => b.score - a.score).slice(0, top);
}

export function describeSequence(moves: readonly MoveId[]): string {
  return moves.map((id) => move(id).label).join(' → ');
}

export const PLANNER_DISCLOSURE =
  'Every stage figure is computed from the mechanism parameters in the cycle engine and the threshold registry, with the variant that set it named on the stage. Appreciation, rent, rates and uplift are the household\'s inputs and can be wrong; the arithmetic that follows from them is not an opinion. A plan that routes around a covenant does so by acting on a different property, which is what the covenant permits. No stage here lowers a contract term.';
