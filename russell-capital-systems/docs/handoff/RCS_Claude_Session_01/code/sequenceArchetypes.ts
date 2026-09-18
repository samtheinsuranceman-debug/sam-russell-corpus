// ============================================================
// SEQUENCE ARCHETYPES — the plans real households actually run, named.
//
// sequencePlanner.ts can enumerate tens of thousands of legal plans for a
// portfolio and rank them against a goal. That is the search. This file is
// the other half: the dozen shapes that the search keeps finding, written up
// once each so a person can recognise their own situation by name.
//
// Every archetype is a Situation preset plus a move sequence. The numbers on
// the page come from running the sequence through the planner at render time
// — nothing here carries a projected figure of its own, so the prose cannot
// drift from the arithmetic. A test asserts every archetype's sequence is
// legal against its own situation, so a rule change that breaks one fails the
// build rather than shipping a plan the covenants forbid.
//
// The "likelihood" score is the same scale as sequenceOrderings.ts: how many
// households, under ordinary circumstances, are actually in this position.
// The thirty-house operator is a 2. That is not a slight; it is a count.
// ============================================================

import { type Situation, type MoveId, THIRTY_HOUSE_OPERATOR, FIRST_TIME_HOUSEHOLD } from './sequencePlanner';

export interface Archetype {
  readonly id: string;
  readonly name: string;
  /** Who this is, in one sentence a person can recognise themselves in. */
  readonly who: string;
  readonly situation: Situation;
  readonly sequence: readonly MoveId[];
  /** Why this order and not another. */
  readonly whyThisOrder: string;
  /** The conditions under which this plan is the right one. */
  readonly shinesWhen: readonly string[];
  /** The condition that makes it the wrong one. */
  readonly failsWhen: string;
  /** What the sequence produces that no stage produces alone. */
  readonly emergent: string;
  /** 1–10. How well-supported the sequencing judgement is. */
  readonly confidence: number;
  /** 1–10. How many ordinary households are in this position. */
  readonly likelihood: number;
}

const rep = <T,>(x: T, n: number): T[] => Array.from({ length: n }, () => x);

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'thirty-house-clear-and-grow',
    name: 'Sell Eight, Clear a Third, Then Grow',
    who: 'Owns thirty rentals at about 60% LTV with a strong surplus, wants the mortgages gone and the portfolio bigger, and is willing to sell the weakest doors to get there.',
    situation: THIRTY_HOUSE_OPERATOR,
    sequence: ['brrrr:portfolio-blanket', 'velocity:first-lien', ...rep<MoveId>('sale:outright', 8), 'policy:fund', ...rep<MoveId>('brrrr:standard', 6), 'refi:single', ...rep<MoveId>('brrrr:standard', 4)],
    whyThisOrder: 'The blanket refinance first, because it releases the most capital in one closing and sets a partial-release schedule the sales then use. The first-lien line next so the whole primary balance sweeps while the sales run. Eight sales of the weakest yielders clear roughly a third of the debt in two years. Then, with the pool under 40% LTV, acquisition resumes on six-month BRRRR turns funded by rent, and a single-property refinance mid-run tops up the reserve.',
    shinesWhen: [
      'The weakest eight doors are genuinely the weakest — low yield, high maintenance, the ones a landlord would sell anyway.',
      'The market will absorb eight sales over two years without softening.',
      'Renovation uplift in the acquisition market clears 1.3, so the second phase grows rather than shrinks.',
      'The partial-release clause was negotiated before the blanket closed.',
    ],
    failsWhen: 'The blanket lender refuses releases. Then every sale requires paying off the whole loan, and the plan is a refinance with no exit.',
    emergent: 'The portfolio ends larger than it started with less debt than it started with, which no single mechanism can do: sales cut debt, BRRRR adds doors, and the blanket makes both possible from one closing.',
    confidence: 7,
    likelihood: 2,
  },
  {
    id: 'ten-house-doubler',
    name: 'The Doubler',
    who: 'Ten rentals, conventional financing maxed at the Fannie Mae cap, wants twenty.',
    situation: { ...THIRTY_HOUSE_OPERATOR, rentals: 10, avgRentalLtv: 0.55, monthlySurplus: 8_000, reserve: 120_000, goal: 'expand', horizonYears: 6 },
    sequence: ['brrrr:portfolio-blanket', ...rep<MoveId>('brrrr:standard', 5), 'refi:single', ...rep<MoveId>('brrrr:standard', 3), 'brrrr:portfolio-blanket', ...rep<MoveId>('brrrr:standard', 2)],
    whyThisOrder: 'The ten-property cap is the bottleneck, and a blanket loan removes it in one move while releasing the equity that funds the first five turns. A single refinance on the best-seasoned property refills the reserve mid-run. A second blanket at year four rolls the new properties in and funds the last turns.',
    shinesWhen: [
      'The household has hit the conventional cap and been told no by three banks.',
      'Uplift clears 1.3 in the target market.',
      'Rents cover the blanket at 1.20 with room, because institutional lenders test net cash flow.',
    ],
    failsWhen: 'Coverage on the pool is thin. A blanket at 1.20 on net cash flow is a harder gate than 1.0 on gross, and a pool that only just clears it has no room for a vacancy.',
    emergent: 'Twenty properties on two loans instead of twenty loans, with the release schedule doing the work twenty separate lenders would each have refused.',
    confidence: 7,
    likelihood: 3,
  },
  {
    id: 'mortgage-destroyer',
    name: 'The Mortgage Destroyer',
    who: 'Five rentals and a primary, a real surplus, and the single goal of owing nobody anything.',
    situation: { ...THIRTY_HOUSE_OPERATOR, rentals: 5, avgRentalLtv: 0.5, monthlySurplus: 6_000, reserve: 60_000, goal: 'payoff', horizonYears: 5, offMarketAccess: false },
    sequence: ['velocity:first-lien', 'sale:outright', 'sale:outright', 'refi:single'],
    whyThisOrder: 'Sweep the primary first, because it is the largest single balance and the line is cheap to open. Sell the two weakest rentals and route every dollar to the highest-LTV survivor. One refinance on the best rental pulls trapped equity into paydown on the rest. The plan ends with three rentals and a primary at low LTV, and the surplus finishing the job on schedule.',
    shinesWhen: [
      'Two of the five rentals were never good — the plan is honest about which ones.',
      'The household wants a payoff DATE, and is willing to shrink the portfolio to get one.',
      'The surplus is real and boring: W-2, monthly, unlikely to change.',
    ],
    failsWhen: 'The household will not sell. Velocity alone on five mortgages and a primary is a fifteen-year plan, and no amount of sweeping changes the arithmetic.',
    emergent: 'A payoff date that is a date. Selling two converts a fifteen-year plan into a five-year one, which is the single largest lever in the file and the one people least want to pull.',
    confidence: 8,
    likelihood: 5,
  },
  {
    id: 'landlord-exit',
    name: 'The Landlord Exit',
    who: 'Fifteen rentals, tired of tenants, wants the income without the management and a death benefit behind it.',
    situation: { ...THIRTY_HOUSE_OPERATOR, rentals: 15, avgRentalLtv: 0.35, monthlySurplus: 9_000, reserve: 100_000, goal: 'income', horizonYears: 8, offMarketAccess: true },
    sequence: ['policy:fund', ...rep<MoveId>('wrap:carry', 8), 'refi:single', 'wrap:carry', 'wrap:carry'],
    whyThisOrder: 'The policy first, so it has eight years to build while the conversion runs. Then eight rentals sold on terms over two years, each one trading a tenant for a payer and a spread. A refinance on a kept property tops up reserve. The final two carries bring it to ten notes and five held rentals.',
    shinesWhen: [
      'Rates are high enough that buyers who can pay but cannot qualify are plentiful.',
      'Existing mortgages are low-rate, so the spread on each wrap is real.',
      'A third-party servicer is used from the first note.',
    ],
    failsWhen: 'An underlying lender calls a loan. Ten wraps is ten due-on-sale exposures, and no exemption covers any of them. This plan carries the most legal exposure in the file and says so.',
    emergent: 'Income without management, an instalment-sale tax profile instead of ten lump gains, and a policy whose death benefit settles whatever balloons remain.',
    confidence: 6,
    likelihood: 3,
  },
  {
    id: 'thin-file-bootstrap',
    name: 'The Thin-File Bootstrap',
    who: 'A primary residence with real equity, income that will not document, and no rentals yet.',
    situation: { ...FIRST_TIME_HOUSEHOLD, primaryValue: 600_000, primaryLtv: 0.35, documentation: 'thin', monthlySurplus: 3_000, reserve: 25_000, offMarketAccess: true, renovationUplift: 1.3, avgRentalValue: 180_000, avgRent: 1_600 },
    sequence: ['equity:30y', 'brrrr:delayed-financing', 'brrrr:standard', 'wrap:buy-on-terms', 'refi:single'],
    whyThisOrder: 'The equity share first, because nothing else opens for a thin file, and the thirty-year term because a ten-year balloon on a household with no documentation is a deadline it cannot plan for. The advance funds a cash purchase refinanced under delayed financing — no seasoning, documented on rent. That property\'s rent is the income document the next DSCR loan needs. A seller-carried purchase and its refinance finish the sequence.',
    shinesWhen: [
      'Two hundred thousand or more of equity in the primary.',
      'Self-employment two years from a documentable return.',
      'A first deal that is genuinely below market, because the equity share\'s effective cost only makes sense against real uplift.',
    ],
    failsWhen: 'The first deal is ordinary. The equity share costs 9–16% effective and a BRRRR at 1.18 cannot carry it; the household then has a balloon on its home and a mediocre rental.',
    emergent: 'A documentation-poor household exits underwriting entirely, using the one product with no income test to create the asset that produces a documentable one.',
    confidence: 8,
    likelihood: 3,
  },
  {
    id: 'household-bank',
    name: 'The Household Bank',
    who: 'A documented household with a surplus and no property yet, building the durable version — no equity share, no balloon anywhere.',
    situation: { ...FIRST_TIME_HOUSEHOLD, monthlySurplus: 3_500, reserve: 90_000, avgRentalValue: 190_000, avgRent: 1_700 },
    sequence: ['velocity:standard', 'policy:fund', ...rep<MoveId>('brrrr:standard', 6), 'policy:borrow', 'brrrr:standard'],
    whyThisOrder: 'Velocity first because it costs nothing and needs no asset. The policy second so it is five years old by the time it is borrowed against. Six acquisitions on standard seasoning, each one funded by the surplus plus what the last refinance returned — at a 1.18 uplift each turn returns 11.5% less than it consumed, and the surplus covers the gap. The policy loan at year six funds the last turn while the cash value keeps compounding. This is a ten-year plan and it says so.',
    shinesWhen: [
      'A real monthly surplus that the household was leaving in checking.',
      'Thirties or forties, with time for the policy to finish ramping.',
      'W-2 income, so the DSCR loan is the easy part.',
    ],
    failsWhen: 'No surplus. The first stage produces nothing and every later stage was funded by it.',
    emergent: 'Three amortising obligations and one liquid sink, with no balloon on the primary at any point. The most structurally sound sequence in the file, and the one most people should actually run.',
    confidence: 8,
    likelihood: 6,
  },
  {
    id: 'off-market-operator',
    name: 'The Off-Market Operator',
    who: 'Five rentals, a skill for finding sellers who will carry, and a rate environment where seller terms beat the bank.',
    situation: { ...THIRTY_HOUSE_OPERATOR, rentals: 5, avgRentalLtv: 0.5, monthlySurplus: 7_000, reserve: 90_000, goal: 'expand', horizonYears: 5, offMarketAccess: true },
    sequence: ['wrap:buy-on-terms', 'wrap:buy-on-terms', 'wrap:buy-on-terms', 'refi:single', 'refi:single', 'refi:single', 'wrap:buy-on-terms', 'refi:single', 'brrrr:portfolio-blanket', 'wrap:buy-on-terms', 'refi:single'],
    whyThisOrder: 'Three seller-carried purchases at ten percent down consume less reserve than one bank deal. Each is then refinanced on a DSCR loan after seasoning, which retires the seller note and ends the due-on-sale exposure. Every note must be retired before the blanket — a lender will not pool a property a seller still holds paper on — so the fourth purchase is refinanced before the blanket closes, and the blanket funds the last.',
    shinesWhen: [
      'The household can actually find carry-back sellers — retiring landlords, estates, tired owners. This is the whole skill.',
      'Institutional purchase money is slow or expensive but refinance money is available.',
      'Each seller note has a balloon at least three years out, giving the refinance room to miss once.',
    ],
    failsWhen: 'The refinance misses coverage. A seller balloon then arrives with nowhere to go, and the household owns a property it cannot finance.',
    emergent: 'Acquisition entirely outside institutional credit, refinanced into it, with due-on-sale exposure confined to the months between purchase and refinance rather than the years a held wrap carries.',
    confidence: 6,
    likelihood: 2,
  },
  {
    id: 'delayed-financing-sprinter',
    name: 'The Delayed-Financing Sprinter',
    who: 'A large cash reserve — a sale, an inheritance, a liquidated position — and a market with real uplift.',
    situation: { ...FIRST_TIME_HOUSEHOLD, reserve: 650_000, monthlySurplus: 5_000, goal: 'expand', horizonYears: 3, renovationUplift: 1.42, avgRentalValue: 250_000, avgRent: 2_100 },
    sequence: [...rep<MoveId>('brrrr:delayed-financing', 3), 'brrrr:standard', 'brrrr:delayed-financing', 'refi:single', 'refi:single', 'brrrr:delayed-financing'],
    whyThisOrder: 'Delayed financing recovers the cash at month four instead of month nine, so three cash purchases turn in the time one standard BRRRR takes. The uplift stays in the property as equity — the exception caps the loan at documented cost. That equity is only harvestable later if cost is under about 72% of appraised value, which means an uplift above 1.4; at 1.3 the property sits at 77% LTV and a 75% cash-out releases nothing. This archetype needs the 1.4, and the planner refuses the refinance stage without it.',
    shinesWhen: [
      'Reserve large enough to buy outright, three times over.',
      'Speed matters more than extracting the uplift on the first pass.',
      'Six-month windows can be met — the refinance disburses inside them, not after.',
    ],
    failsWhen: 'The six-month window is missed. Then it is a standard cash-out with standard seasoning and the speed advantage was the whole point.',
    emergent: 'Three properties in the time of one, with the created equity banked rather than extracted, then harvested by refinance when it is seasoned.',
    confidence: 8,
    likelihood: 2,
  },
  {
    id: 'cap-escape',
    name: 'The Cap Escape',
    who: 'Ten conventionally financed rentals, full documentation, and a bank that has said the number ten out loud.',
    situation: { ...THIRTY_HOUSE_OPERATOR, rentals: 10, avgRentalLtv: 0.6, monthlySurplus: 7_000, reserve: 80_000, goal: 'expand', horizonYears: 4, offMarketAccess: false },
    sequence: ['brrrr:portfolio-blanket', 'velocity:standard', ...rep<MoveId>('brrrr:standard', 4)],
    whyThisOrder: 'The blanket is the escape: one loan, one lender, the ten-property cap gone. It also releases the equity that funds the first turn. Velocity holds that capital at a falling balance while the turns run.',
    shinesWhen: [
      'The household has literally been declined for property eleven.',
      'The ten are stabilised and would cover a blanket at 1.0 or better.',
    ],
    failsWhen: 'The pool is already at the blanket LTV cap. A refinance then releases nothing and the household has replaced ten loans with one for no capital.',
    emergent: 'A ceiling that was regulatory becomes a ceiling that is only arithmetic.',
    confidence: 8,
    likelihood: 3,
  },
  {
    id: 'income-converter',
    name: 'The Income Converter',
    who: 'Twenty rentals, most of the debt paid down, wants monthly income to replace a salary within three years.',
    situation: { ...THIRTY_HOUSE_OPERATOR, rentals: 20, avgRentalLtv: 0.3, monthlySurplus: 10_000, reserve: 120_000, goal: 'income', horizonYears: 3, offMarketAccess: true },
    sequence: ['policy:fund', ...rep<MoveId>('wrap:carry', 6), 'brrrr:portfolio-blanket', 'wrap:carry', 'wrap:carry'],
    whyThisOrder: 'Low-LTV rentals are the best wrap candidates — the spread between the note rate and the small underlying is nearly the whole payment. Six carries convert the weakest six to income streams. A blanket on the remaining fourteen releases equity for reserve. Two more carries finish it.',
    shinesWhen: [
      'Underlying mortgages are small, so the spread is fat and the due-on-sale downside is bounded.',
      'A servicer is engaged before the first note.',
      'The household wants income, not appreciation — this plan gives up upside for cash flow.',
    ],
    failsWhen: 'A payer stops. Eight notes is eight counterparties, and this household\'s salary replacement depends on all of them.',
    emergent: 'A salary from paper, on properties that used to produce a landlord\'s wage, with the appreciation traded away for certainty of payment.',
    confidence: 6,
    likelihood: 2,
  },
  {
    id: 'rescue',
    name: 'The Rescue',
    who: 'Eight rentals, a surplus that just vanished — job loss, a business that closed — and equity as the only asset.',
    situation: { ...THIRTY_HOUSE_OPERATOR, rentals: 8, avgRentalLtv: 0.65, monthlySurplus: 500, reserve: 15_000, documentation: 'thin', goal: 'payoff', horizonYears: 2, insurable: false, offMarketAccess: false },
    sequence: ['sale:outright', 'sale:outright', 'sale:outright', 'equity:30y', 'wrap:carry', 'wrap:carry'],
    whyThisOrder: 'Three sales first, because nothing else is available to a household with no surplus and no documentation, and each clears its own debt. The equity share on the primary next — the thirty-year term, because a ten-year balloon on a household in trouble is a second emergency scheduled in advance. Two carries convert the weakest survivors to payers.',
    shinesWhen: [
      'The household is honest that this is a rescue and not a strategy.',
      'The three sold are the three worst, chosen on yield and not on sentiment.',
    ],
    failsWhen: 'The advance is consumed by living expenses. Then there is a settlement and nothing bought with it — the worst outcome in this file.',
    emergent: 'A household with no income and no credit ends with five rentals at low LTV, two notes, and a primary it still lives in. It is a long road and it is a real one.',
    confidence: 7,
    likelihood: 2,
  },
  {
    id: 'unlocked-household',
    name: 'The Unlocked Household',
    who: 'One primary with equity, one rental, a surplus, income that will document next year but not this year.',
    situation: { ...FIRST_TIME_HOUSEHOLD, rentals: 1, avgRentalValue: 200_000, avgRentalLtv: 0.6, avgRent: 1_800, primaryLtv: 0.4, documentation: 'thin', monthlySurplus: 2_800, reserve: 40_000, offMarketAccess: false, renovationUplift: 1.28 },
    sequence: ['velocity:standard', 'equity:30y', 'brrrr:standard', 'refi:single', 'brrrr:standard', 'policy:fund'],
    whyThisOrder: 'The line FIRST, then the equity share behind it — the only order the covenant permits, and the reason this archetype exists. The advance funds an acquisition; the existing rental\'s refinance funds a second; the policy starts once the income documents and the premium is safe.',
    shinesWhen: [
      'The household read the covenant before signing and opened the line the month before the agreement.',
      'The existing rental is seasoned and below the cash-out cap.',
    ],
    failsWhen: 'The order is reversed. Equity share first, and the line never opens — the household then runs a plan with a hole where its working capital was.',
    emergent: 'Order alone turns an illegal plan into a legal one. Nothing about the tools changed; the month they were signed did.',
    confidence: 9,
    likelihood: 3,
  },
];

export function archetype(id: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

/** Most ordinary households first. */
export function byLikelihood(): Archetype[] {
  return [...ARCHETYPES].sort((a, b) => b.likelihood - a.likelihood || b.confidence - a.confidence);
}

export const ARCHETYPE_COUNT = ARCHETYPES.length;
export const LONGEST_ARCHETYPE = Math.max(...ARCHETYPES.map((a) => a.sequence.length));
