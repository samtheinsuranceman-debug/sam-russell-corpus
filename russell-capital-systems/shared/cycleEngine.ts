/**
 * THE CYCLE ENGINE — what actually happens when you run a capital cycle for
 * twenty years, and the year it stops.
 *
 * ## Why this exists
 *
 * Every mechanism in this section is sold as a loop: release capital, deploy
 * it, release more, repeat. The loop is real. What is almost never modelled is
 * that most of these mechanisms create an OBLIGATION with a date on it, and
 * running the loop on a cadence stacks those dates on top of each other.
 *
 * Do one equity-share agreement a year for ten years and from year ten you have
 * one settlement landing every year, each one needing a sale or a buyout, each
 * funded from equity the previous agreement already consumed. That is not a
 * cycle. It is a balloon ladder, and it looks identical to a cycle for the
 * first nine years.
 *
 * So this engine models three things nobody else models together:
 *
 *   1. **Release** — what each turn actually puts in your hand, net of cost.
 *   2. **Obligation** — what each turn puts on the calendar, and when.
 *   3. **Clustering** — whether those dates pile up, and the year they exceed
 *      what the household can produce.
 *
 * `breakYear` is the output that matters. Everything else on this page is
 * decoration next to the question "which year does this stop working".
 *
 * ## The single most important distinction between mechanisms
 *
 * `amortises`. A mechanism whose obligation pays itself down over time
 * (a DSCR refinance, where a tenant retires the principal) can be stacked
 * almost indefinitely. A mechanism whose obligation does NOT amortise
 * (an equity-share agreement, a balloon, an interest-only bridge) accumulates,
 * and the accumulation is invisible until the settlement dates arrive.
 *
 * Two mechanisms with identical headline economics behave completely
 * differently over twenty years on this one property alone.
 *
 * ## What this is not
 *
 * Not a forecast. Appreciation, rates and rents are inputs the reader sets,
 * and the engine's job is to show what follows from those inputs — including,
 * and especially, when what follows is bad.
 */

// ─── Mechanisms ──────────────────────────────────────────────────────────────

export type MechanismId =
  | 'policy-loan'
  | 'velocity-heloc'
  | 'brrrr-dscr'
  | 'equity-share'
  | 'seller-wrap';

export const MECHANISM_ORDER: readonly MechanismId[] = [
  'policy-loan', 'velocity-heloc', 'brrrr-dscr', 'equity-share', 'seller-wrap',
];

export interface Mechanism {
  readonly id: MechanismId;
  readonly name: string;
  readonly shortName: string;
  readonly oneLine: string;
  /** What it actually is, honestly, in three or four paragraphs. */
  readonly what: readonly string[];
  /** Fraction of the asset it works on that one turn releases as usable capital. */
  readonly releaseRate: number;
  /** Months for one complete turn, at the pace a competent operator achieves. */
  readonly turnMonths: { readonly fast: number; readonly typical: number; readonly slow: number };
  /**
   * THE DIVIDING LINE. True when the obligation created pays itself down.
   * False when it sits, accrues, and lands whole on a date.
   */
  readonly amortises: boolean;
  /** Can the same asset be cycled again, or does each turn need a new one? */
  readonly repeatableOnSameAsset: boolean;
  /** Years until the obligation comes due as a lump. Null when it amortises away. */
  readonly settlementYears: number | null;
  /** Annualised all-in cost of the capital released, as a band. */
  readonly costOfCapital: { readonly low: number; readonly high: number; readonly note: string };
  /** The constraint this mechanism REMOVES. Why anybody runs it at all. */
  readonly relieves: string;
  /** What stops it. Every mechanism has one and most marketing omits it. */
  readonly bottleneck: string;
  /** How long before the mechanism produces anything worth having. */
  readonly rampYears: number;
  /** Where it is documented in this application. */
  readonly relatedPaths: readonly string[];
}

export const MECHANISMS: readonly Mechanism[] = [
  {
    id: 'policy-loan',
    name: 'Policy Loan Cycle (Infinite Banking)',
    shortName: 'Policy loan',
    oneLine: 'Fund a policy, borrow against the cash value, deploy, repay, repeat — with the collateral still compounding.',
    what: [
      'An overfunded participating whole life policy builds cash value. You borrow against that cash value from the insurer — not from yourself, and not from the policy — and the full cash value keeps earning while the loan is outstanding, because the insurer is lending its own general-account money against your balance as collateral.',
      'That last property is the one nothing else on this page has. Every other mechanism requires you to remove capital from the thing that was producing in order to use it. This one leaves the collateral working. It is the reason the strategy has a following, and it is genuine.',
      'The costs are equally genuine and front-loaded. Early cash value sits well below premium paid, the funding period runs ten to fifteen years before the pool is large enough to matter, and a loan whose interest is never paid compounds against a cash value growing more slowly — the date those two lines cross is the date the policy lapses, with the full gain taxable in one year and no cash arriving to pay it.',
      'Designed for accumulation with a paid-up-additions rider and kept inside the seven-pay limit, it works. Designed for commission, it does not, and the two carry the same name.',
    ],
    releaseRate: 0.9,
    turnMonths: { fast: 6, typical: 12, slow: 24 },
    amortises: false,
    repeatableOnSameAsset: true,
    settlementYears: null,
    costOfCapital: { low: 0.04, high: 0.08, note: 'Contractual loan rate, offset by continued crediting on the full cash value. On a direct-recognition contract the borrowed portion is credited less, which narrows the offset.' },
    relieves: 'The requirement to liquidate something in order to use capital. The collateral keeps compounding while borrowed against, which no other mechanism here offers.',
    bottleneck: 'Cash value. You can only borrow against what is there, and building a pool worth borrowing takes ten to fifteen years of funding you cannot interrupt without realising a loss.',
    rampYears: 10,
    relatedPaths: ['/portal/house-recycling', '/portal/lifetime-income'],
  },
  {
    id: 'velocity-heloc',
    name: 'Velocity Banking',
    shortName: 'Velocity',
    oneLine: 'Run the household through a line of credit so every dollar of income cuts an interest-bearing balance the day it lands.',
    what: [
      'Income goes straight against a line of credit rather than sitting in a checking account, and expenses are drawn back out as they occur. The saving is the interest on the average daily balance you were previously leaving idle, redirected to principal. It is arithmetic rather than a product, and it can be computed exactly from a bank statement.',
      'It is the fastest mechanism here and the cheapest to start, because it needs no new asset and no underwriting beyond the line itself.',
      'It is also entirely powered by surplus. The engine redirects money that was already going to be left over; it cannot manufacture the surplus. Run against a household spending everything it earns, it produces almost nothing while adding a line of credit and a monthly discipline. The honest claim is that it compresses a timeline for people who already had a surplus they were not deploying.',
    ],
    releaseRate: 0.12,
    turnMonths: { fast: 1, typical: 1, slow: 3 },
    amortises: true,
    repeatableOnSameAsset: true,
    settlementYears: null,
    costOfCapital: { low: 0.07, high: 0.11, note: 'The line\'s own rate, applied to a balance that is falling every time income lands. Floating, and the line can be frozen or reduced by the lender.' },
    relieves: 'Idle cash. Money sitting in a checking account earns nothing while a balance accrues interest; this closes that gap without changing what the household spends.',
    bottleneck: 'Surplus, and only surplus. No surplus, no effect — and a lender can freeze or reduce the line at the moment the plan depends on it.',
    rampYears: 0,
    relatedPaths: ['/portal/mortgage-killer', '/portal/mortgage-ledger'],
  },
  {
    id: 'brrrr-dscr',
    name: 'BRRRR with DSCR Refinance',
    shortName: 'BRRRR',
    oneLine: 'Buy, renovate, rent, refinance the capital back out, repeat — with a tenant retiring the debt.',
    what: [
      'Acquire below market or in poor condition, renovate to raise the appraised value, place a tenant, then refinance on a DSCR loan that qualifies on the property\'s rent rather than on your income — pulling most or all of the original capital back out to do it again.',
      'This is the only mechanism here where the obligation created pays itself down, and it does so with somebody else\'s money. That single property makes it the one that stacks safely: ten BRRRR properties is ten amortising loans, while ten equity-share agreements is ten balloons.',
      'The constraints are real and they set the cadence. Most DSCR lenders require six months of ownership before lending against the current appraised value rather than your purchase price. Maximum cash-out is typically 75% of value. And the property must clear a debt-service coverage ratio at the rate available on the day you refinance, not the rate you modelled — which is why a competent operator runs the ratio half a point above the quote before committing.',
    ],
    releaseRate: 0.72,
    turnMonths: { fast: 9, typical: 14, slow: 24 },
    amortises: true,
    repeatableOnSameAsset: false,
    settlementYears: null,
    costOfCapital: { low: 0.065, high: 0.095, note: 'DSCR mortgage rate plus points. The tenant services it, so the household cost is the gap between rent and debt service rather than the rate itself.' },
    relieves: 'The capital ceiling. Without a refinance, each property consumes a down payment permanently and the portfolio stops at the number of down payments you have.',
    bottleneck: 'Seasoning and coverage. Six months before a cash-out at appraised value, 75% LTV, and a DSCR of 1.0 at the prevailing rate. A rate rise mid-project can strand the capital in the property.',
    rampYears: 1,
    relatedPaths: ['/portal/real-estate-mogul', '/portal/rental-enterprise', '/portal/alt-credit'],
  },
  {
    id: 'equity-share',
    name: 'Equity Share Agreement',
    shortName: 'Equity share',
    oneLine: 'Take 10–30% of a home\'s value as cash now, with no monthly payment, and settle a larger share of its value in ten years.',
    what: [
      'A home equity investment company advances cash against a share of the home\'s value, with no interest and no monthly payment. Because there is no payment, there is no debt-service test — which is why it reaches households that no lender will underwrite, and why it looks like the mechanism that makes an infinite cycle possible.',
      'Work the settlement and the appearance changes. A $600,000 home, a $120,000 advance at 20% of value, and a settlement multiplier of 1.80× at year ten means you settle 36% of the home\'s value. At 4% appreciation the home is worth about $888,000, so the settlement is roughly $320,000 on $120,000 received — about 10.3% compounded, in one lump, on a date you do not choose.',
      'Three structural facts break the cycle premise. You cannot take a second agreement on the same house, so each turn needs a new property and a new down payment. Most providers restrict or exclude investment property entirely — these are largely primary-residence products. And most agreements prohibit further encumbrance without consent, so you cannot layer a line of credit behind one.',
      'As a one-time tool for a documentation-poor owner with real equity and no way to service debt, it is genuinely useful and sometimes the only option. As a recurring engine it is a ten-year balloon ladder that looks like a cycle until year ten.',
    ],
    releaseRate: 0.2,
    turnMonths: { fast: 12, typical: 24, slow: 36 },
    amortises: false,
    repeatableOnSameAsset: false,
    settlementYears: 10,
    costOfCapital: { low: 0.09, high: 0.16, note: 'Never expressed as a rate, which is why it does not feel expensive. Effective cost rises with appreciation on a share-of-total-value agreement and falls toward zero in a flat market on a share-of-appreciation one.' },
    relieves: 'The debt-service test. No payment means no DSCR and no income documentation — the only mechanism here available to a household that cannot service debt at all.',
    bottleneck: 'One per property, mostly primary residences only, no further encumbrance, and nothing amortises. Each turn adds a settlement date and consumes the equity the next turn would have used.',
    rampYears: 0,
    relatedPaths: ['/portal/alt-credit/home-equity-investment', '/portal/alt-credit'],
  },
  {
    id: 'seller-wrap',
    name: 'Seller Financing and Wraps',
    shortName: 'Seller wrap',
    oneLine: 'Buy and sell on paper the two parties write themselves, then finance the note you carried.',
    what: [
      'No institution is involved. The buyer pays the seller on a note the two of them write, with whatever rate, amortisation, balloon and down payment they agree. On a wraparound the seller\'s existing mortgage stays in place and they keep the spread between the two rates — which is the entire economic engine and the reason wraps reappear every time rates rise.',
      'It is the fastest mechanism here because there is no underwriting queue, no appraisal delay and no property-count cap. A note you carried can then be hypothecated or partially sold, turning an illiquid instrument back into capital without ending it.',
      'The central legal problem must be stated and disclosed: a wrap almost always violates the due-on-sale clause in the underlying mortgage, giving that lender the contractual right to call the loan in full. Historically rarely exercised, and in a rising-rate environment a lender holding a 3% note has an incentive to look that did not exist before. Every link in a chain adds one of these, plus a counterparty who has to keep paying.',
    ],
    releaseRate: 0.55,
    turnMonths: { fast: 3, typical: 8, slow: 18 },
    amortises: true,
    repeatableOnSameAsset: false,
    settlementYears: 5,
    costOfCapital: { low: 0.05, high: 0.12, note: 'Whatever the two parties agree. A seller carrying at below market is buying an instalment-sale tax treatment; a buyer paying above market is buying access.' },
    relieves: 'Institutional underwriting entirely — no income documentation, no property count, no appraisal timeline, and terms that exist nowhere else.',
    bottleneck: 'Due-on-sale exposure on every wrap, a counterparty who must keep paying, and a balloon on most seller notes that arrives whether or not a refinance is available.',
    rampYears: 0,
    relatedPaths: ['/portal/alt-credit/seller-financing-and-wraps', '/portal/alt-credit/note-hypothecation'],
  },
];

export const mechanism = (id: MechanismId): Mechanism | undefined =>
  MECHANISMS.find((m) => m.id === id);

// ─── The simulation ──────────────────────────────────────────────────────────

export interface CycleInput {
  /** The sequence run, in order. Repeats through the list as turns complete. */
  readonly sequence: readonly MechanismId[];
  /** Starting asset base the first turn works against. */
  readonly startingAsset: number;
  /** Years to run. */
  readonly years: number;
  /** Annual appreciation on property, as a decimal. */
  readonly appreciation: number;
  /** Annual household surplus available to service obligations. */
  readonly annualSurplus: number;
  /** Cash reserve at the start. */
  readonly reserve: number;
  /** Pace: 'fast' | 'typical' | 'slow' — which turnMonths figure to use. */
  readonly pace: 'fast' | 'typical' | 'slow';
  /**
   * After-repair value as a multiple of all-in cost on a BRRRR turn. The single
   * most decisive input in the whole engine: below about 1.34 the cycle shrinks
   * every turn, above it the cycle grows. 1.18 is an ordinary deal.
   */
  readonly renovationUplift: number;
  /**
   * How much of the capital sitting idle gets redeployed rather than held.
   *
   * This is what separates a cycle from a savings plan, and modelling it is
   * what makes the break year mean anything. An operator running a cycle does
   * not hold the proceeds — they put them back to work, which is the entire
   * point. So when a settlement lands, the money is in the ground.
   *
   * 0.85 is an aggressive operator. 0.5 leaves a real buffer. 0 is somebody
   * who is not actually cycling.
   */
  readonly redeployRate: number;
  /** Months of obligation cover held back before redeploying. The discipline that prevents the break. */
  readonly reserveFloorMonths: number;
}

export const DEFAULT_CYCLE: CycleInput = {
  sequence: ['brrrr-dscr'],
  startingAsset: 400_000,
  years: 20,
  appreciation: 0.035,
  annualSurplus: 36_000,
  reserve: 50_000,
  pace: 'typical',
  renovationUplift: 1.18,
  redeployRate: 0.85,
  reserveFloorMonths: 6,
};

export interface Obligation {
  readonly mechanismId: MechanismId;
  /** Year it lands, 1-indexed. */
  readonly dueYear: number;
  readonly amount: number;
  readonly amortises: boolean;
}

export interface CycleYear {
  readonly year: number;
  readonly turnsCompleted: number;
  readonly capitalReleased: number;
  readonly obligationsDue: number;
  readonly cumulativeObligation: number;
  readonly reserve: number;
  /** True when obligations due this year exceed surplus plus reserve. */
  readonly stressed: boolean;
}

export interface CycleResult {
  readonly years: readonly CycleYear[];
  readonly totalReleased: number;
  readonly totalObligations: number;
  /** The first year obligations due exceed what the household can produce. Null if never. */
  readonly breakYear: number | null;
  /** Years where two or more settlements land together. */
  readonly clusterYears: readonly number[];
  readonly peakObligationYear: number | null;
  readonly peakObligation: number;
  readonly turnsCompleted: number;
  /** Share of the sequence's mechanisms whose obligations amortise. */
  readonly amortisingShare: number;
  readonly verdict: string;
}

const round = (n: number) => Math.round(n);

/**
 * Run the cycle.
 *
 * The critical loop is not the capital release — that part is easy and every
 * spreadsheet does it. It is the obligation ledger: each non-amortising turn
 * writes a settlement into a future year, and the engine then asks, year by
 * year, whether the household can actually meet what landed.
 */
export function simulateCycle(input: CycleInput): CycleResult {
  const seq = input.sequence.length ? input.sequence : DEFAULT_CYCLE.sequence;
  const obligations: Obligation[] = [];
  const years: CycleYear[] = [];

  // THE STATE. An earlier version of this function tracked a single `asset`
  // number and let each turn release a fraction of it, then added the proceeds
  // back to the base. That compounds without bound and printed a portfolio of
  // three hundred trillion dollars — which is the exact fantasy this engine
  // exists to disprove, so it is worth naming rather than quietly fixing.
  //
  // Capital cycles are constrained by real things: a down payment you must
  // have before you can buy, a property that can carry only one equity-share
  // agreement, a policy whose cash value takes a decade to build, a line whose
  // limit does not move. The state below is those constraints.
  const properties: Array<{ value: number; debt: number; encumbered: boolean; ageMonths: number }> = [];
  let reserve = input.reserve;
  let policyCashValue = 0;
  let policyLoan = 0;
  let totalReleased = 0;
  let turnsCompleted = 0;
  let cumulativeObligation = 0;
  let monthsIntoTurn = 0;
  let seqIndex = 0;

  const monthlyAppreciation = Math.pow(1 + input.appreciation, 1 / 12) - 1;
  const monthlySurplus = input.annualSurplus / 12;
  const fundsPolicy = seq.includes('policy-loan');
  // A household funding a policy commits part of the surplus to premium; that
  // money is not also available to service obligations, which is a real
  // competition between mechanisms and the reason stacking them has a cost.
  const policyPremiumMonthly = fundsPolicy ? monthlySurplus * 0.35 : 0;

  // The first property is whatever they already own.
  properties.push({ value: input.startingAsset, debt: input.startingAsset * 0.45, encumbered: false, ageMonths: 120 });

  // A sequence containing an acquiring mechanism redeploys itself: every BRRRR
  // turn consumes the reserve to buy the next property, so there is no separate
  // redeployment step. A sequence without one releases capital that goes
  // somewhere else entirely, and that capital leaves the reserve.
  const selfRedeploying = seq.includes('brrrr-dscr');

  for (let year = 1; year <= input.years; year++) {
    let releasedThisYear = 0;
    let turnsThisYear = 0;

    // THE FLOOR — the discipline that decides whether this survives.
    //
    // Held back from acquisitions, not merely from spending. An operator who
    // puts the settlement reserve into the next deal has not made a mistake of
    // arithmetic; they have chosen growth over survival, and this line is where
    // that choice gets made. Sized to the obligations landing in the next two
    // years, scaled by how many months of cover they hold.
    const upcoming = obligations
      .filter((o) => o.dueYear > year && o.dueYear <= year + 2)
      .reduce((n, o) => n + o.amount, 0);
    const floor = (upcoming / 24) * input.reserveFloorMonths;

    for (let month = 0; month < 12; month++) {
      for (const p of properties) { p.value *= 1 + monthlyAppreciation; p.ageMonths += 1; }
      reserve += monthlySurplus - policyPremiumMonthly;
      if (fundsPolicy) {
        policyCashValue += policyPremiumMonthly * 0.72;          // early cash value lags premium
        policyCashValue *= 1 + (0.045 / 12);
        policyLoan *= 1 + (0.055 / 12);                          // unpaid loan interest compounds
      }

      const m = mechanism(seq[seqIndex % seq.length]!)!;
      monthsIntoTurn += 1;
      if (monthsIntoTurn < m.turnMonths[input.pace]) continue;
      monthsIntoTurn = 0;

      let released = 0;

      if (m.id === 'brrrr-dscr') {
        // THE ARITHMETIC THAT DECIDES WHETHER BRRRR CYCLES AT ALL.
        //
        // An earlier version subtracted only the down payment from reserve and
        // then credited the entire new mortgage back to it, which made every
        // turn multiply capital by about 2.8 and produced a two-trillion-dollar
        // portfolio. The real transaction is the opposite shape: you deploy the
        // whole all-in cost, and the refinance returns 75% of the after-repair
        // value. Whether that is more or less than you put in depends entirely
        // on the renovation spread.
        //
        //   cash back  =  0.75 x ARV  =  0.75 x uplift x all-in
        //
        // At a 1.18 uplift that is 0.885 — you recover 88.5% and the cycle
        // shrinks 11.5% per turn. At 1.34 it is break-even. Above that it
        // grows. This is why BRRRR operators talk about the buy rather than
        // the refinance, and why a cycle modelled on an average deal stalls.
        const allIn = Math.max(0, reserve - floor) * 0.9;
        if (allIn > 40_000) {
          const arv = allIn * input.renovationUplift;
          reserve -= allIn;
          const newDebt = arv * 0.75;                            // DSCR cash-out cap
          released = newDebt;
          properties.push({ value: arv, debt: newDebt, encumbered: false, ageMonths: 0 });
        }
      } else if (m.id === 'equity-share') {
        // One per property, and only on a property with real equity left.
        const target = properties.find((p) => !p.encumbered && p.value - p.debt > p.value * 0.3);
        if (target) {
          released = target.value * m.releaseRate;
          target.encumbered = true;
          const settle = released * Math.pow(1 + Math.max(input.appreciation, 0.02), m.settlementYears!) * 1.8;
          obligations.push({ mechanismId: m.id, dueYear: year + m.settlementYears!, amount: settle, amortises: false });
          cumulativeObligation += settle;
        }
      } else if (m.id === 'policy-loan') {
        // Bounded by cash value, net of what is already borrowed.
        const borrowable = Math.max(0, policyCashValue * 0.9 - policyLoan);
        if (borrowable > 5_000) { released = borrowable; policyLoan += borrowable; }
      } else if (m.id === 'velocity-heloc') {
        // Bounded by surplus. It accelerates, it does not create.
        released = Math.max(0, input.annualSurplus * 0.25);
      } else if (m.id === 'seller-wrap') {
        const target = properties.find((p) => !p.encumbered && p.value - p.debt > 60_000);
        if (target) {
          released = (target.value - target.debt) * m.releaseRate;
          target.encumbered = true;
          const settle = released * 0.45;
          obligations.push({ mechanismId: m.id, dueYear: year + m.settlementYears!, amount: settle, amortises: true });
          cumulativeObligation += settle;
        }
      }

      if (released > 0) {
        reserve += released;
        releasedThisYear += released;
        totalReleased += released;
        turnsCompleted += 1;
        turnsThisYear += 1;
      }
      seqIndex += 1;
    }

    // REDEPLOYMENT, and it is the step that makes the break year real.
    //
    // Capital that has been released does not sit in a bank account waiting for
    // a settlement — an operator running a cycle puts it back to work, which is
    // what makes it a cycle. When a settlement lands, the money is in the
    // ground. A sequence with an acquiring mechanism in it does this through
    // the acquisitions themselves, so only the others need the explicit step.
    if (!selfRedeploying) {
      const idle = Math.max(0, reserve - floor);
      const deployed = idle * input.redeployRate;
      reserve -= deployed;
      if (properties.length) properties[properties.length - 1]!.value += deployed;
    }

    const due = obligations.filter((o) => o.dueYear === year).reduce((n, o) => n + o.amount, 0);
    // A settlement larger than the reserve plus a year of surplus forces a
    // sale. That is the failure this engine exists to find.
    const capacity = reserve + input.annualSurplus;
    const stressed = due > capacity;
    reserve = Math.max(0, reserve - due);

    years.push({
      year, turnsCompleted: turnsThisYear,
      capitalReleased: round(releasedThisYear),
      obligationsDue: round(due),
      cumulativeObligation: round(cumulativeObligation),
      reserve: round(reserve), stressed,
    });
  }

  const breakYear = years.find((y) => y.stressed)?.year ?? null;
  const byYear = new Map<number, number>();
  for (const o of obligations) byYear.set(o.dueYear, (byYear.get(o.dueYear) ?? 0) + 1);
  const clusterYears = Array.from(byYear.entries())
    .filter(([y, n]) => n >= 2 && y <= input.years).map(([y]) => y).sort((a, b) => a - b);

  const peak = years.reduce<CycleYear | null>((best, y) =>
    !best || y.obligationsDue > best.obligationsDue ? y : best, null);

  const amortisingShare = seq.length
    ? seq.filter((id) => mechanism(id)?.amortises).length / seq.length : 0;
  const totalObligations = obligations.reduce((n, o) => n + o.amount, 0);

  const verdict = breakYear !== null
    ? `This sequence breaks in year ${breakYear}, when settlements due exceed the reserve and surplus available to meet them. That is not a market event — it is the cadence itself, and it is fixed by slowing the cycle, raising the amortising share above its current ${Math.round(amortisingShare * 100)}%, or holding a reserve sized to the largest settlement rather than to a month of expenses.`
    : amortisingShare >= 0.5
      ? `No break inside ${input.years} years. ${Math.round(amortisingShare * 100)}% of this sequence amortises, which is what makes it survivable: obligations that pay themselves down do not accumulate into a ladder.`
      : `No break inside ${input.years} years, but only ${Math.round(amortisingShare * 100)}% of this sequence amortises. Run it longer, or with worse appreciation, and the settlements stack. Check the cluster years before treating this as durable.`;

  return {
    years, totalReleased: round(totalReleased), totalObligations: round(totalObligations),
    breakYear, clusterYears, peakObligationYear: peak?.year ?? null,
    peakObligation: peak?.obligationsDue ?? 0, turnsCompleted,
    amortisingShare: Math.round(amortisingShare * 100) / 100, verdict,
  };
}

/** The standing note under every cycle output. */
export const CYCLE_DISCLOSURE =
  'A cycle is a cadence, not a guarantee. This engine takes the appreciation, surplus and pace you enter and shows what follows ' +
  'from them — including the year the sequence stops working, which is the output it exists to produce. It forecasts nothing. ' +
  'Every mechanism here has a bottleneck, every non-amortising mechanism writes a settlement into a future year, and no sequence ' +
  'is infinite: the word describes the shape of the loop, never the supply of capital. Confirm any structure with your own ' +
  'attorney and CPA, and read what each mechanism costs before reading what it releases.';


// ─── What people actually search ─────────────────────────────────────────────

/**
 * The questions people put into a search engine about infinite banking, with
 * answers that correct rather than repeat the common framing.
 *
 * Gathered 2026-09-18 from the recurring "people also ask" set across
 * betterwealth.com, bankingtruths.com, allstate.com, policyadvisor.com and
 * insurancegeek.com. Every question is kept under 65 characters so it can be
 * used as a heading, a meta description fragment, or a link title without
 * truncation.
 *
 * The single most important correction across all five sources: you borrow
 * FROM the insurance company AGAINST your cash value as collateral. You are
 * not borrowing from yourself and you are not paying yourself interest. Every
 * reputable source says this and most marketing says the opposite.
 */
export interface CommonQuestion {
  readonly question: string;
  readonly answer: string;
}

export const INFINITE_BANKING_QUESTIONS: readonly CommonQuestion[] = [
  {
    question: 'What is infinite banking?',
    answer:
      'Using an overfunded, dividend-paying whole life policy as a place to store capital and borrow against. You fund the policy, cash value builds, and when you need money you take a policy loan — the insurer lends you its own money using your cash value as collateral, so your full balance keeps compounding while the loan is outstanding. That last property is what nothing else offers, and it is the entire reason the strategy exists. It is a cash-flow management system, not an investment and not a way to beat a market.',
  },
  {
    question: 'Is infinite banking a scam?',
    answer:
      'No, and it is routinely oversold. The mechanism is real and the contracts are ordinary permanent life insurance. What is not real is the social-media version where you "become your own bank" and "pay yourself interest" — you borrow from an insurance company and the interest goes to the company. It is also expensive early, slow to build, and genuinely wrong for anyone who cannot fund it for ten to fifteen years. Judge a specific design, not the concept.',
  },
  {
    question: 'How much do you need to start infinite banking?',
    answer:
      'Most practitioners suggest a minimum around $10,000 a year to be worth the structure, and the more useful test is not the amount but the durability: can this premium be paid every year for the full funding period, including a bad year? A policy abandoned in year four is a realised loss, not a paused plan. Size the premium to the income floor rather than the average, and use a paid-up-additions rider so a good year can contribute without raising the base commitment.',
  },
  {
    question: 'Do you pay taxes on infinite banking?',
    answer:
      'Policy loans are not taxable income, which is the tax advantage the strategy rests on. Two things remove it. If the policy becomes a modified endowment contract — usually from being funded too fast against the seven-pay limit — distributions come out as income first and a penalty applies before 59½. And if the policy lapses with a loan outstanding, the full gain becomes taxable in one year with no cash arriving to pay it. Get written MEC confirmation from the carrier before borrowing.',
  },
  {
    question: 'Whole life or IUL for infinite banking?',
    answer:
      'Most practitioners favour dividend-paying whole life for this specific use, because the growth is contractual and the loan provisions are more predictable — an indexed policy introduces cap and participation-rate variability into a structure whose value comes from certainty. Indexed designs have their own case for accumulation. Either way the carrier should be mutual or mutual-holding, so surplus flows to policyholders rather than to outside shareholders, and the design should be maximum-funded for cash value rather than sized for commission.',
  },
];

/** The one-line definition used in the page description and meta tags. */
export const INFINITE_BANKING_DEFINITION =
  'Borrowing against an overfunded whole life policy so capital keeps compounding while you use it — and what happens when you run that loop, and four others, for twenty years.';
