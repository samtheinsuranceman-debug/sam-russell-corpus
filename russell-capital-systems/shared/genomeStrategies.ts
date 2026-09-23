/**
 * THE STRATEGIES THE GENOME IS SCORED AGAINST.
 *
 * Twenty-four of them. Each declares which of the twenty-one factors argue for
 * it and which argue against, with a stated reason per signal, so a fit score
 * can always be taken apart into the sentences that produced it.
 *
 * Four rules held throughout this file:
 *
 * 1. **Every strategy carries `whenItIsWrong`.** A registry where each entry
 *    explains only who it suits is a brochure with a schema.
 * 2. **Every strategy states the house position.** Whether this firm actually
 *    implements the thing, implements it with conditions, or declines it, is a
 *    fact the reader is entitled to and it is not always the same answer.
 * 3. **No product figure is asserted.** Bonus percentages, historical credits
 *    and carrier standings are recorded as `ProductClaim`s with a status. An
 *    unconfirmed claim renders as unconfirmed, on the page, in those words.
 * 4. **Signals reference real factors only.** A test resolves every `factorId`
 *    against `FACTORS`, so a signal on a factor that does not exist fails the
 *    build rather than silently scoring zero forever.
 */

import type { Strategy } from './genomeStrategyFit';

const P = {
  altCredit: '/portal/alt-credit',
  mortgageKiller: '/portal/mortgage-killer',
  houseRecycling: '/portal/house-recycling',
  mogul: '/portal/real-estate-mogul',
  ledger: '/portal/mortgage-ledger',
  str: '/portal/short-term-rentals',
  rentalEnterprise: '/portal/rental-enterprise',
  genome: '/portal/wealth-genome',
  lifetimeIncome: '/portal/lifetime-income',
  roth: '/portal/roth-conversion',
  iulVsRoth: '/portal/iul-vs-roth',
  oilGas: '/portal/oil-gas',
  erosion: '/portal/erosion',
  figure: '/portal/how-a-figure-is-made',
} as const;

export const STRATEGIES: readonly Strategy[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // METHOD
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'strategic-optimisation-engine',
    name: 'The Strategic Optimisation Engine',
    family: 'method',
    oneLine: 'Structure first: reduce the ways a plan can fail before trying to raise what it returns.',
    whatItIs: [
      'This is not a product and it is not an allocation. It is the order of operations this firm works in: identify every structural leak in a balance sheet — interest paid, tax paid, sequence risk, uninsured exposure, idle capital — and close them in the order of how much each one costs per year, before any conversation about what to buy.',
      'The reason it is listed here as a strategy rather than assumed as a preamble is that it genuinely fits some people and not others. It requires somebody willing to act on a schedule rather than react to a headline, who will make a decision at a crossover point and then leave it alone, and who is more interested in a result they can trace than in a story they can retell.',
      'What it is not is a promise of higher returns. Closing structural leaks is arithmetic, and arithmetic has a ceiling. Somebody who wants to beat a benchmark is in the wrong room; this room is about making the outcome depend on decisions you control rather than on outcomes you do not.',
    ],
    signals: [
      { factorId: 'institutional-trust', wants: 'low', weight: 0.7, why: 'Somebody who verifies everything is exactly who this suits — the whole method is auditable arithmetic rather than a manager to be trusted.' },
      { factorId: 'cognitive-durability', wants: 'high', weight: 0.8, why: 'The method asks you to hold a structure through years when nothing visible happens. That requires understanding why it is there.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.75, why: 'Structural work is slow and unexciting. The temptation to abandon it comes from boredom rather than from loss.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.6, why: 'Crossover points have to be acted on. A structure nobody reviews becomes a structure nobody controls.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.7, why: 'Compounding a closed leak is the entire return. Short horizons do not give the arithmetic room.' },
      { factorId: 'leverage', wants: 'low', weight: 0.5, why: 'A leveraged balance sheet has more leaks to close, so the method has more to work on.' },
    ],
    gates: [],
    whenItIsWrong: 'Wrong for somebody who wants to outperform. This method is indifferent to benchmarks and will underperform a rising market in a good year by design, because it is buying the removal of bad years rather than the addition of good ones. It is also wrong for somebody who will not engage: a structure that depends on acting at a crossover, run by somebody who will not open the statement, is worse than no structure.',
    housePosition: 'implements',
    housePositionWhy: 'This is the firm\'s own method and everything else on this page is evaluated inside it.',
    claims: [],
    relatedPaths: [P.figure, P.genome, P.erosion],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PROPERTY
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'long-term-rental-accumulation',
    name: 'Long-Term Rental Accumulation and Recycling',
    family: 'property',
    oneLine: 'Buy, stabilise, extract, repeat — with each property funding part of the next.',
    whatItIs: [
      'Acquire a rental, stabilise it, let rent and amortisation build equity, then extract a portion of that equity and use it toward the next acquisition. The cycle is the strategy: a portfolio built this way compounds through the recycling rather than through appreciation alone, which means it works in a flat market as well as a rising one.',
      'The engine is boring and reliable: a tenant pays down a loan you took out, the principal portion of every payment is a forced saving you did not have to feel, and the depreciation deduction shelters part of the cash flow along the way. None of that depends on the market doing anything.',
      'The constraint is almost never finding properties. It is documentation and financing capacity — the point at which conventional lenders stop counting your rental income and start counting your total number of financed properties. That wall is where the alternative-credit routes become relevant rather than optional.',
    ],
    signals: [
      { factorId: 'time-horizon', wants: 'high', weight: 1.0, why: 'Recycling needs cycles, and a cycle is five to seven years. A short horizon never completes one.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.8, why: 'Property is an operating business with tenants, repairs and vacancies. It does not run itself, whatever anyone says about passive income.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.7, why: 'A vacancy, an eviction and a $14,000 roof all arrive eventually, and usually together.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.75, why: 'Equity in property is not reachable in a week. Somebody who needs cash available will be forced to sell at the wrong time.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.7, why: 'Lenders underwrite you between properties, and carrying costs during a vacancy come from your own income.' },
      { factorId: 'tax-posture', wants: 'low', weight: 0.5, why: 'Somebody expecting a higher bracket later gains more from depreciation taken now against income taxed now.' },
      { factorId: 'inflation-exposure', wants: 'low', weight: 0.6, why: 'Fixed nominal income erodes; rents adjust. Property is the correction to that exposure, so the exposure argues for it.' },
    ],
    gates: [
      { id: 'operating-capacity', requirement: 'Willingness to run, or pay somebody to run, an operating business', why: 'Rental property is not an investment you hold. It is a business you operate, and every failure mode in it is operational.', external: true },
    ],
    whenItIsWrong: 'Wrong for somebody who wants passive income and means it. Wrong for somebody whose income is fragile, because carrying costs during a vacancy come from them and not from the property. And wrong at scale for somebody who will not delegate: the portfolio that breaks its owner is almost always the one where the owner was still taking the maintenance calls at door number nine.',
    housePosition: 'implements',
    housePositionWhy: 'The acquisition, financing and recycling arithmetic is modelled end to end in this application.',
    claims: [],
    relatedPaths: [P.mogul, P.rentalEnterprise, P.altCredit, P.ledger],
  },

  {
    id: 'short-term-rental-cashflow',
    name: 'Short-Term Rentals for Depreciation, Income and Appreciation',
    family: 'property',
    oneLine: 'Higher gross yield, materially more work, and a depreciation position a long-term rental cannot reach.',
    whatItIs: [
      'A short-term rental produces several times the gross revenue of the same property on a twelve-month lease, and consumes it again in cleaning, furnishing, platform fees, utilities, higher insurance and management. The net is usually better than a long-term rental and the variance is much higher, because occupancy is a seasonal and regulatory variable rather than a lease.',
      'The tax position is the part that changes the arithmetic rather than merely improving it. Where average guest stay is short enough and the owner materially participates, the activity can fall outside the passive-activity rules that normally quarantine rental losses — which means a cost segregation study and bonus depreciation can produce a deduction usable against other income rather than suspended against future rental profit. That is a materially different outcome, it turns on specific tests being met, and it is the reason this strategy exists in most portfolios.',
      'Regulation is the live risk and it is local. A city can restrict or ban short-term rentals between one acquisition and the next, and it will not compensate you. Underwrite the ordinance before the property.',
    ],
    signals: [
      { factorId: 'attention-budget', wants: 'high', weight: 1.0, why: 'This is hospitality. Guest messages, turnovers, pricing and reviews are a weekly job, not a quarterly one.' },
      { factorId: 'tax-posture', wants: 'low', weight: 0.9, why: 'The whole tax advantage is a large deduction taken now. It is worth most to somebody paying a high rate now and expecting to pay more later.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.7, why: 'Occupancy swings hard by season and a bad month looks like a broken strategy rather than a normal one.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.7, why: 'Furnishing, ramp-up and a soft first season all consume cash before anything comes back.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.6, why: 'A regulatory change can take the revenue to zero while the mortgage continues. Outside income is the shock absorber.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.6, why: 'Recapture on accelerated depreciation arrives at sale, so the benefit needs years of holding behind it to be worth taking.' },
      { factorId: 'business-ownership', wants: 'low', weight: 0.4, why: 'Somebody already running a business has the operating instincts this needs and often the entity structure too.' },
    ],
    gates: [
      { id: 'material-participation', requirement: 'Hours of genuine material participation, documented contemporaneously', why: 'The entire tax advantage rests on meeting a participation test. Without the hours and the log, the deduction is suspended and the strategy is just a harder rental.', external: true },
      { id: 'local-ordinance', requirement: 'A local ordinance that permits short-term rental at this address', why: 'Municipalities restrict and ban these. A property bought before the ordinance was read is a long-term rental bought at a short-term price.', external: true },
    ],
    whenItIsWrong: 'Wrong for somebody who cannot document material participation, because without it the depreciation is suspended and the extra work bought nothing. Wrong in a market with a hostile or unsettled ordinance at any price. And wrong for somebody who wanted property to be the calm part of their balance sheet.',
    housePosition: 'implements',
    housePositionWhy: 'Modelled against live market data in this application, with the ordinance and participation questions raised before the numbers.',
    claims: [
      { claim: 'Short-term rental losses can offset W-2 income.', status: 'needs-correction', note: 'True only where the specific tests are met — average guest stay short enough to fall outside the definition of a rental activity, plus material participation by the owner. It is not a property type that creates the outcome; it is a set of facts that must be true and documented. A CPA should confirm the position before the property is bought, not after.', settledBy: 'A written position from the CPA who will sign the return, on these facts.' },
    ],
    relatedPaths: [P.str, P.mogul, P.rentalEnterprise],
  },

  {
    id: 'mortgage-payoff-five-years',
    name: 'Paying Off the Mortgage in About Five Years Without Spending More',
    family: 'property',
    oneLine: 'Redirect the same dollars through a different structure so more of each payment lands on principal.',
    whatItIs: [
      'The premise is that most households are already sending enough money out each month to retire the mortgage far faster than the schedule, and what stops them is not the amount but the routing. Income sits idle in a checking account for weeks while interest accrues on a mortgage balance that the idle money could have been reducing.',
      'The mechanism uses a line of credit as the household operating account so that every dollar of income immediately reduces a balance that charges interest, and expenses are drawn back out as they occur. The saving is the interest on the average daily balance you were previously leaving idle, redirected to principal. It is arithmetic, not a product, and it can be modelled exactly.',
      'What it requires is a genuine surplus. The strategy accelerates a payoff using money that was already going to be left over; it cannot manufacture the surplus. Run against a household spending everything it earns, the arithmetic produces almost nothing while adding a line of credit and a discipline requirement. The honest version of the pitch is that this compresses a timeline for people who already had a surplus they were not deploying.',
    ],
    signals: [
      { factorId: 'spending-elasticity', wants: 'high', weight: 1.0, why: 'The engine runs on surplus. A household with nothing to cut and nothing left over has nothing for the structure to redirect.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.9, why: 'The household operating account becomes a line of credit. Stable income is what makes that safe rather than clever.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.8, why: 'This is a monthly discipline, not a set-and-forget. Somebody who will not run it will simply have a line of credit.' },
      { factorId: 'cognitive-durability', wants: 'high', weight: 0.7, why: 'It only gets held through year three by somebody who understands why it works.' },
      { factorId: 'leverage', wants: 'high', weight: 0.5, why: 'Room to open a line of credit is a precondition, and an already-stretched balance sheet does not have it.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.5, why: 'Watching a line of credit balance rise mid-month is uncomfortable the first several times, however well you understand it.' },
    ],
    gates: [
      { id: 'surplus-exists', requirement: 'A real monthly surplus, verified against actual statements rather than a budget', why: 'Without surplus the arithmetic produces almost nothing. This is the gate most often waved through and it is the one that decides the outcome.', external: true },
      { id: 'line-available', requirement: 'An available line of credit at a usable rate', why: 'The structure cannot be built without it, and on an investment property a bank line is frequently unavailable.', external: true },
    ],
    whenItIsWrong: 'Wrong for a household with no surplus — it adds a line of credit and a chore and saves very little. Wrong for somebody with unstable income, because the operating account is now debt. And wrong for somebody who would use an open line of credit for something other than the plan, which is a question about a person rather than about arithmetic.',
    housePosition: 'implements',
    housePositionWhy: 'The payoff arithmetic, the interest saved and the required surplus are computed from the client\'s own statement rather than from an illustration.',
    claims: [
      { claim: 'Pays off the mortgage in five years without spending a dollar more.', status: 'needs-correction', note: 'The timeline is a function of the surplus, not of the structure. Five years is achievable at a large surplus and not at a small one; the same mechanism on a household with a thin surplus produces a materially longer timeline. The honest statement names the surplus the figure assumes, and this application computes it from the client\'s own numbers.', settledBy: 'The client\'s own bank statements and the ledger output for their figures.' },
    ],
    relatedPaths: [P.mortgageKiller, P.ledger, P.altCredit],
  },

  {
    id: 'rental-every-five-years',
    name: 'A Paid-For Rental Every Five to Six Years',
    family: 'property',
    oneLine: 'Apply the same payoff engine to one property at a time and own each one outright before starting the next.',
    whatItIs: [
      'A sequencing strategy rather than a new mechanism. The same surplus-redirection that compresses a primary mortgage is aimed at one rental at a time: acquire it, accelerate it to zero, then redirect everything that was servicing it — now including its own rent, which has no debt against it — at the next one. Each completed property makes the next one faster, which is why the cadence tightens rather than holding steady.',
      'The reason this appeals to people who dislike leverage is that it inverts the usual portfolio shape. Instead of ten properties with ten mortgages and thin aggregate equity, it builds toward a small number of properties owned outright, each producing net rent with no debt service against it. The portfolio is smaller and the cash flow per property is far larger, and a vacancy is an inconvenience rather than a threat.',
      'The trade is real and should be stated. Paying properties off forgoes the leverage that would have bought more of them, and in a strongly appreciating market the leveraged portfolio will show a larger number. This strategy buys resilience with return, deliberately. Somebody who wants the largest possible balance sheet should not run it.',
    ],
    signals: [
      { factorId: 'spending-elasticity', wants: 'high', weight: 0.95, why: 'Same engine, same fuel. The cadence is a direct function of how much surplus there is to aim at it.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.95, why: 'Five to six years per property means the strategy needs two decades to show what it does.' },
      { factorId: 'leverage', wants: 'high', weight: 0.7, why: 'Somebody who dislikes debt is the natural owner of this, and somebody already stretched cannot start it.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.6, why: 'Years three and four of the first property are the test — the work is done and nothing looks finished yet.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.7, why: 'It is a redirection discipline plus a rental business, and both need attention.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.6, why: 'Every spare dollar is aimed at a mortgage balance. That is the opposite of keeping cash reachable.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.7, why: 'The cadence assumes the surplus continues. A gap in income does not break the plan, it just pauses it — but it pauses it for years.' },
    ],
    gates: [
      { id: 'surplus-sustained', requirement: 'A surplus that will still be there in year six', why: 'This strategy is a decade-long commitment of the same money. A surplus that exists this year and not next produces a half-finished property and a mortgage.', external: true },
    ],
    whenItIsWrong: 'Wrong for somebody optimising for portfolio size or for total return in an appreciating market — leverage wins that race and this strategy declines to run it. Wrong for somebody with a short horizon, since the first property alone takes five or six years. And wrong where the surplus is seasonal or uncertain.',
    housePosition: 'implements',
    housePositionWhy: 'The cadence, the compounding of each paid-off property into the next, and the total interest avoided are modelled from the client\'s figures.',
    claims: [
      { claim: 'Guaranteed to pay it off without spending any more than you are paying now.', status: 'needs-correction', note: 'The mechanism is arithmetic and the arithmetic is reliable, but "guaranteed" is the wrong word for an outcome that depends on the surplus continuing, the line of credit remaining available at a usable rate, and the discipline being run every month. State it as: reliable arithmetic, conditional on three things, all of which are named.', settledBy: 'The client\'s own ledger run, with the assumptions listed beside the result.' },
    ],
    relatedPaths: [P.mortgageKiller, P.houseRecycling, P.mogul, P.ledger],
  },

  {
    id: 'house-recycling-iul',
    name: 'Recycling Mortgages Through an Indexed Policy',
    family: 'property',
    oneLine: 'Route the payoff through a policy so the same dollars retire debt and build a tax-advantaged asset at once.',
    whatItIs: [
      'The acceleration engine retires a mortgage and leaves you with a paid-off house and no liquid asset. This variant routes the surplus through a properly structured indexed policy first, so the same dollars build cash value that can then be borrowed against to retire the mortgage — leaving both a reduced or eliminated loan and an asset that continues to compound.',
      'The appeal is that it converts a one-way expense into a two-way one. The counter-argument, which deserves equal space, is that it adds cost, complexity and a second contract to a plan that worked without them. Policy charges are real and front-loaded, and the structure only outperforms the plain payoff if the policy is designed for accumulation rather than for commission, funded to the limit, and held for decades.',
      'The single largest determinant of whether this is a good idea is whether the person can fund it every year for the full funding period. A policy abandoned in year four is worse than never having started, and that failure mode has nothing to do with markets.',
    ],
    signals: [
      { factorId: 'insurability', wants: 'high', weight: 1.0, why: 'Everything here depends on a policy being issued at a reasonable cost. This is the first question, not a detail.' },
      { factorId: 'income-durability', wants: 'high', weight: 1.0, why: 'A multi-year funding commitment against unstable income is a lapse with a date on it.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.9, why: 'Policy charges are front-loaded. The structure needs decades to get past them and into the part that works.' },
      { factorId: 'spending-elasticity', wants: 'high', weight: 0.8, why: 'Funding to the limit requires surplus, and this competes for the same surplus as the plain payoff.' },
      { factorId: 'cognitive-durability', wants: 'high', weight: 0.8, why: 'Two moving structures at once. Somebody who cannot re-derive why it is there will abandon it the first time a statement disappoints.' },
      { factorId: 'institutional-trust', wants: 'high', weight: 0.5, why: 'It requires relying on a carrier contract for decades, which somebody badly burned before will not do comfortably.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.6, why: 'An in-force review is not optional on a policy with loans against it.' },
    ],
    gates: [
      { id: 'insurable', requirement: 'Issuable at a cost that does not consume the advantage', factorId: 'insurability', test: { direction: 'atMost', score: -1.4 }, why: 'A rated or declined case removes the mechanism entirely. There is no version of this that works without a policy.' },
      { id: 'fundable', requirement: 'The full funding period is affordable, every year', factorId: 'income-durability', test: { direction: 'atMost', score: -1.4 }, why: 'An abandoned policy is a realised loss, not a paused plan.' },
    ],
    whenItIsWrong: 'Wrong for anybody who might stop funding. Wrong where the plain payoff achieves the goal, because the plain payoff has no charges and no contract. And wrong when the policy is designed as an insurance sale rather than as an accumulation vehicle — the same strategy name covers both, and only one of them works.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'Implemented only with mutual and mutual-holding carriers, only on a maximum-funded accumulation design, and only where the plain payoff has been modelled beside it so the client can see what the added complexity actually buys.',
    claims: [],
    relatedPaths: [P.houseRecycling, P.mortgageKiller, P.ledger],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INSURANCE STRUCTURE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'cash-flowing-multiple-iul',
    name: 'Cash-Flowing Multiple Indexed Policies Over Ten to Fifteen Years',
    family: 'insurance-structure',
    oneLine: 'Stack several maximum-funded accumulation policies with mutual carriers, over a decade or more.',
    whatItIs: [
      'Rather than one large policy, several are opened across years and carriers and each is funded to the maximum the tax code allows without becoming a modified endowment contract. The effect is to stagger the front-loaded charges, diversify carrier and crediting-method risk, and build several independent pools that can be borrowed against at different times for different purposes.',
      'Why mutual and mutual-holding carriers only: a mutual company has no outside shareholders with a claim on the margin, so surplus flows back to policyholders rather than being split with equity investors. That is a structural difference in whose interest the company is run in, not a performance guarantee — a mutual carrier can and does credit poorly. It changes the direction of the incentive, which over thirty years is the thing worth having.',
      'This is the strategy in this section that punishes inconsistency the hardest. Several simultaneous funding commitments across a decade, each of which is a realised loss if abandoned early, is a large bet on the stability of one household\'s income and discipline. It belongs to people whose income is genuinely durable, and to nobody else.',
    ],
    signals: [
      { factorId: 'insurability', wants: 'high', weight: 1.0, why: 'Several policies means several underwriting decisions, and a rating on the second one changes the whole plan.' },
      { factorId: 'income-durability', wants: 'high', weight: 1.0, why: 'Multiple simultaneous multi-year commitments. This is the factor that decides the strategy.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.95, why: 'Ten to fifteen years of funding, then decades of distribution. Nothing about this is short.' },
      { factorId: 'tax-posture', wants: 'low', weight: 0.8, why: 'The advantage is tax-free access later. That is worth most to somebody who expects to be in a higher bracket then.' },
      { factorId: 'spending-elasticity', wants: 'high', weight: 0.8, why: 'Funding to the limit requires a surplus that survives a bad year without the policies being the thing that gives.' },
      { factorId: 'institutional-trust', wants: 'high', weight: 0.6, why: 'Thirty-year reliance on carrier contracts and crediting practice. Somebody who will not rely on an institution will not hold this.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.6, why: 'Early cash surrender value is well below premium paid. Money needed inside five years must not be here.' },
      { factorId: 'legacy-intent', wants: 'low', weight: 0.5, why: 'The death benefit is a real part of the value, so somebody who cares what passes on gets more from the same premium.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.6, why: 'In-force reviews are how a policy with loans against it stays alive. Skipping them is the common failure.' },
    ],
    gates: [
      { id: 'insurable-multi', requirement: 'Issuable more than once, at reasonable cost', factorId: 'insurability', test: { direction: 'atMost', score: -1.2 }, why: 'Each policy is a fresh underwriting decision and the door can close between them.' },
      { id: 'sustained-funding', requirement: 'Funding sustainable for the full period on every policy', factorId: 'income-durability', test: { direction: 'atMost', score: -1.2 }, why: 'Early abandonment converts a long-term structure into a realised loss.' },
      { id: 'mutual-carrier-available', requirement: 'A mutual or mutual-holding carrier issuing the design in this state', why: 'The mutual-only condition is a firm policy, not a market fact — availability varies by state and by design.', external: true },
    ],
    whenItIsWrong: 'Wrong for anybody whose income might not carry the commitment for the full funding period. Wrong for money that might be needed inside five to seven years. Wrong where the design is an insurance sale dressed as accumulation — a policy sized for commission rather than for cash value fails this strategy entirely while carrying its name.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'Mutual and mutual-holding carriers only, maximum-funded accumulation designs only, and modelled against the plain alternative so the client can see the cost of the structure as well as its benefit.',
    claims: [
      { claim: 'Mutual carriers only — Pacific Life, Securian, Nationwide, Lafayette Life.', status: 'confirmed', note: 'All four sit under mutual or mutual-holding ownership, and the carrier registry in this application records the ownership form of each with the company\'s own source. Five more in the same category: Penn Mutual, Ameritas, Mutual of Omaha (United of Omaha), National Life Group, and Columbus Life — the Western & Southern sibling of Lafayette Life. MassMutual and Guardian are also mutual and issue indexed policies; both are recorded in the registry with their ownership form.', settledBy: 'shared/mutualIulCarriers.ts, each entry sourced to the carrier\'s own material.' },
    ],
    relatedPaths: [P.houseRecycling, P.lifetimeIncome],
  },

  {
    id: 'guaranteed-tax-free-income-for-life',
    name: 'Policy-Loan Income for Life (Conditions Apply)',
    family: 'insurance-structure',
    oneLine: 'An income stream from life insurance policy loans that does not appear on a tax return while the policy stays in force and is not a MEC.',
    whatItIs: [
      'Built from properly structured policy cash value accessed through loans and withdrawals rather than from an annuity, this produces income that is not reportable, does not raise the taxation of Social Security, and does not push Medicare premium surcharges. For a household that will be in a meaningful bracket in retirement, the tax character of the income is frequently worth more than the headline rate on the account it comes from.',
      'The mechanism has one unforgiving condition: the policy must remain in force for life. A lapse with a large outstanding loan triggers a taxable event on the full gain, in one year, with no cash arriving to pay it — which is the single worst outcome available in personal finance and it happens to people who stopped paying attention rather than to people who chose it.',
      'Sizing is the whole art. Too little and the structure is a rounding error; too much and the household has committed capital it will need for something else. The right proportion depends on how much other guaranteed income exists, how long the horizon is, and how much of the household\'s spending is genuinely fixed.',
    ],
    signals: [
      { factorId: 'insurability', wants: 'high', weight: 1.0, why: 'No policy, no mechanism. This is a gate before it is a signal.' },
      { factorId: 'tax-posture', wants: 'low', weight: 0.95, why: 'Tax-free income is worth precisely what the bracket it avoids is worth. Somebody expecting a low bracket later should hear a different plan.' },
      { factorId: 'longevity-expectation', wants: 'high', weight: 0.85, why: 'Income for life is worth most to somebody whose life is long. That is the entire pricing of the idea.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.9, why: 'Funding years come first, and they are years of paying rather than receiving.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.85, why: 'A structure that must be funded, then left alone, then drawn from. Each phase is measured in years.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.75, why: 'In the distribution phase an unreviewed policy with loans against it is a lapse being scheduled.' },
      { factorId: 'inflation-exposure', wants: 'low', weight: 0.5, why: 'Somebody with fixed nominal income elsewhere needs a source that is not also fixed and not also taxed.' },
      { factorId: 'spending-elasticity', wants: 'high', weight: 0.5, why: 'Funding competes with current spending for years before it pays anything back.' },
    ],
    gates: [
      { id: 'insurable-for-income', requirement: 'Issuable, and issuable at a cost that leaves the advantage intact', factorId: 'insurability', test: { direction: 'atMost', score: -1.4 }, why: 'The mechanism is a policy. A decline or a heavy rating does not make this expensive, it makes it unavailable.' },
      { id: 'lifetime-in-force', requirement: 'A commitment to keep the policy in force for life, with annual review once loans are outstanding', why: 'A lapse with a large loan outstanding triggers tax on the full gain in one year with no cash arriving to pay it. This is the worst outcome in the section and it is caused by inattention.', external: true },
    ],
    allocation: (fit) => ({
      minPct: Math.max(5, Math.round((fit - 20) * 0.22)),
      maxPct: Math.max(12, Math.round((fit - 20) * 0.42)),
      basis: 'A share of long-horizon capital, scaled by fit. Held below roughly 40% at any fit because a structure that must never lapse should never be the only thing a household has, and because the liquidity profile in the first several years is genuinely poor.',
    }),
    whenItIsWrong: 'Wrong for somebody who will be in a low bracket in retirement — they are paying for a benefit they will not use. Wrong where the funding period cannot be completed. And wrong for anybody who will not review it annually once loans are outstanding, because at that point the failure mode is inattention rather than markets.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'Implemented where the bracket arithmetic supports it, with the lapse risk modelled explicitly and an annual in-force review made part of the plan rather than left to memory.',
    claims: [],
    relatedPaths: [P.lifetimeIncome, P.erosion],
  },

  {
    id: 'guaranteed-income-for-life-annuity',
    name: 'Guaranteed Income for Life',
    family: 'insurance-structure',
    oneLine: 'A contractual floor under the spending that has to happen whatever the market does.',
    whatItIs: [
      'An insurer contracts to pay a stated income for as long as you live, in exchange for a sum now. What it buys is not return — it is the removal of two risks that portfolios handle badly: outliving the money, and being forced to sell into a bad market to eat.',
      'The research on this is more favourable than the industry\'s reputation. Households with a guaranteed floor under essential spending report higher satisfaction and spend more freely from the rest of their assets, because the part that has to be there is not exposed. That behavioural effect is measurable and it is usually larger than any return difference being argued about.',
      'The correct question is never whether to have any but how much. The floor should cover the spending that is genuinely non-negotiable — housing, food, insurance, care — and no more, because every dollar beyond that is a dollar bought out of a more flexible asset for a benefit the household did not need.',
    ],
    signals: [
      { factorId: 'longevity-expectation', wants: 'high', weight: 1.0, why: 'The contract pays for as long as you live. Its value is a direct function of that.' },
      { factorId: 'emotional-durability', wants: 'low', weight: 0.9, why: 'Somebody who sells in a drawdown needs a floor more than somebody who does not. This is the signal that most often points the other way from intuition.' },
      { factorId: 'spending-elasticity', wants: 'low', weight: 0.85, why: 'A household with nothing to cut needs contractual income. One that can cut spending has its own shock absorber already.' },
      { factorId: 'income-durability', wants: 'low', weight: 0.7, why: 'Fragile income is exactly the condition a contractual floor is for.' },
      { factorId: 'legacy-intent', wants: 'high', weight: 0.6, why: 'Income for life converts capital into a stream. Somebody who intends to spend it is unbothered; somebody focused on what passes on is buying against their own goal.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.7, why: 'Surrender periods outlast plans. Money that might be needed should not be in here.' },
      { factorId: 'institutional-trust', wants: 'high', weight: 0.6, why: 'It is a promise from a company for decades. Somebody who will not rely on an institution should not buy one.' },
      { factorId: 'cognitive-durability', wants: 'high', weight: 0.4, why: 'These contracts are genuinely complicated, and a contract not understood is a contract surrendered early.' },
    ],
    gates: [
      { id: 'surrender-survivable', requirement: 'The money can stay put for the whole surrender period', factorId: 'liquidity-need', test: { direction: 'atMost', score: -1.5 }, why: 'Surrender charges on money that has to come out early can exceed everything the contract earned. A contract broken early is a loss, not a change of mind.' },
      { id: 'carrier-strength', requirement: 'A carrier whose claims-paying strength supports a multi-decade promise', why: 'The guarantee is the carrier\'s, not an index\'s and not a regulator\'s. Rating and state guaranty limits both have to be looked at by name.', external: true },
    ],
    allocation: (fit) => ({
      minPct: Math.max(0, Math.round((fit - 35) * 0.30)),
      maxPct: Math.max(10, Math.round((fit - 35) * 0.60)),
      basis: 'Sized to cover non-negotiable spending, not to a percentage rule. The band scales with fit and is deliberately capped well short of a majority: a floor under essential spending is the goal, and capital committed past that point buys a benefit the household did not need at the cost of flexibility it did.',
    }),
    whenItIsWrong: 'Wrong for somebody whose priority is what passes on, since this converts capital into a stream that stops. Wrong for money that might be needed during the surrender period. And wrong in the quantity usually sold — the failure in this category is far more often too much than too little.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'Sized against the household\'s actual non-negotiable spending, with the payout rates and the surrender schedule compared across carriers rather than taken from one illustration.',
    claims: [],
    relatedPaths: [P.lifetimeIncome, P.erosion],
  },

  {
    id: 'bonus-fia-short-surrender',
    name: 'A Bonus Indexed Annuity With a Short Walk-Away Window',
    family: 'insurance-structure',
    oneLine: 'A premium bonus up front and a surrender schedule measured in a few years rather than ten.',
    whatItIs: [
      'Two features are being bought together here and they should be priced separately. The first is a premium bonus credited at issue, which raises the account value the crediting is then applied to. The second is a short surrender window — the ability to walk away after a few years without a surrender charge, where most of this category ties money up for seven to fifteen.',
      'The short window is the genuinely unusual feature and it is worth real money to a household that cannot confidently commit for a decade. The bonus is not free: bonus products are typically priced with lower caps, lower participation rates, or a vesting schedule that means the bonus is not fully yours until it has been earned back. Comparing a bonus product to a non-bonus one on the bonus alone is the mistake the design invites.',
      'Everything specific about any one contract — the bonus percentage, the crediting history, the exact walk-away terms and the state-by-state availability — has to come off the current rate sheet and the contract itself. Those change, they vary by state, and a figure from a client statement is a figure for one contract in one crediting period and not a rate of return.',
    ],
    signals: [
      { factorId: 'liquidity-need', wants: 'low', weight: 0.85, why: 'The short window is the whole point. It is worth most to somebody who could not otherwise commit.' },
      { factorId: 'time-horizon', wants: 'low', weight: 0.6, why: 'A shorter horizon is precisely where a ten-year surrender schedule fails and this does not.' },
      { factorId: 'emotional-durability', wants: 'low', weight: 0.7, why: 'A floor with an exit suits somebody who would otherwise sell at the wrong time and then be trapped by a surrender charge.' },
      { factorId: 'longevity-expectation', wants: 'high', weight: 0.5, why: 'Where the contract is being used for income rather than accumulation, longevity is still what it pays for.' },
      { factorId: 'institutional-trust', wants: 'high', weight: 0.6, why: 'Carrier strength matters more here than product features, and this is a promise for years.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.6, why: 'Caps, participation rates, spreads and bonus vesting interact. Without the arithmetic the bonus is the only visible feature and it is the least important one.' },
      { factorId: 'spending-elasticity', wants: 'low', weight: 0.4, why: 'A household with committed spending benefits most from principal protection with a real exit.' },
    ],
    gates: [
      { id: 'state-availability', requirement: 'The product, the bonus and the walk-away term as they exist in the client\'s issue state', why: 'Bonus percentages and surrender terms vary by state and by product version, and a figure quoted from another state is not a figure for this client.', external: true },
      { id: 'rate-sheet-current', requirement: 'A current rate sheet read on the day of application', why: 'Caps, participation rates and bonuses change. A product compared on last year\'s sheet is a product nobody has actually compared.', external: true },
    ],
    allocation: (fit) => ({
      minPct: Math.max(0, Math.round((fit - 40) * 0.25)),
      maxPct: Math.max(8, Math.round((fit - 40) * 0.5)),
      basis: 'A portion of the protected sleeve, not of total assets, and capped well short of it. Concentrating in one carrier and one crediting design is a single point of failure whatever the bonus is.',
    }),
    whenItIsWrong: 'Wrong for anybody buying it for the bonus. Wrong where the money has a decade to work and could be somewhere with more upside. And wrong for a household putting a large share of its assets into one carrier, which the headline features make tempting.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'Considered on the strength of the short surrender window, which is genuinely rare and useful. Any bonus and any historical credit is taken from the current rate sheet for the client\'s own state, never from a statement or a summary.',
    claims: [
      { claim: 'Athene 15 Elite Pro: 34% bonus in some states.', status: 'unconfirmed', note: 'Premium bonus percentages vary by state, by product version and by the income rider elected, and they change. This has not been read off a current rate sheet by this system, so it is not a figure here. Note also that bonus products typically carry lower caps or participation rates and a vesting schedule — the bonus is a pricing feature, not an addition to an otherwise identical contract.', settledBy: 'The current product rate sheet and contract for the client\'s issue state, on the day of application.' },
      { claim: 'A client statement showing 57% and 20% in the same crediting period.', status: 'needs-correction', note: 'A statement figure of that kind is normally an account-value change that includes a premium bonus and an index credit on one segment, over one crediting period. It is not an annualised rate of return and it cannot be presented as one or as indicative of future crediting. The underlying index credit, the cap or participation rate that produced it, and the bonus component must be separated before any figure is quoted at all.', settledBy: 'The statement itself with the bonus and the segment credit broken out, alongside the contract terms for that segment.' },
      { claim: 'Athene is the number one seller of annuities.', status: 'unconfirmed', note: 'Athene has ranked at or near the top of US annuity sales in recent industry tallies, but rankings move by year, by quarter and by product category, and the ranking source must be named for the claim to mean anything. Separately and importantly for this firm: Athene is not a mutual company — it is a subsidiary of Apollo Global Management. The mutual-only condition this firm applies to indexed life does not extend to this product line, and that difference should be stated to a client rather than left for them to assume.', settledBy: 'A named industry sales report (e.g. LIMRA) for a stated period and category.' },
      { claim: 'Walk away after four years without surrender penalties, charges or costs.', status: 'unconfirmed', note: 'A short or waived surrender window is the genuinely valuable feature here and the reason the product is worth examining. The exact term, the conditions attached to it, and whether any market value adjustment or rider charge survives the waiver all have to be read from the contract for the issue state.', settledBy: 'The contract and the state-specific disclosure for the issue state.' },
    ],
    relatedPaths: [P.lifetimeIncome],
  },

  {
    id: 'mirror-deposit-account',
    name: 'The Mirror Account',
    family: 'insurance-structure',
    oneLine: 'Keep the checking and savings accounts, and put a second structure alongside them that credits on a larger base.',
    whatItIs: [
      'The described arrangement leaves the household\'s banking exactly as it is and adds a second account that money passes through briefly, with crediting applied to a cumulative deposit base rather than to the balance currently sitting there. The attraction is that nothing is given up: the checking account still works, the high-yield savings still earns, and the second structure credits on a number built from everything that has ever passed through it.',
      'This is the item in this section with the least established detail, and it is being recorded rather than sold for that reason. A crediting base that grows with cumulative deposits rather than current balance behaves very differently from a bank account, and whether it is genuinely additive depends entirely on the contract behind it — what the base actually is, what the credit is applied to, what charges are deducted, what happens on withdrawal, and what the guarantees are when an index does nothing.',
      'The right next step is not a projection. It is the contract and a current illustration, read against the account it is being compared to, so that the comparison is between two things of the same kind.',
    ],
    signals: [
      { factorId: 'liquidity-need', wants: 'low', weight: 0.7, why: 'The premise is that banking liquidity is untouched, which is what makes it interesting to somebody who needs cash reachable.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.8, why: 'A crediting base that is not the balance is exactly the kind of structure that has to be understood before it is used.' },
      { factorId: 'institutional-trust', wants: 'high', weight: 0.6, why: 'It relies on a carrier contract rather than on a bank deposit, which is a different promise with a different backstop.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.6, why: 'A once-a-year mechanical step that nobody performs is a structure that quietly stops working.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.6, why: 'Crediting on a cumulative base only diverges from crediting on a balance after years of deposits.' },
      { factorId: 'insurability', wants: 'high', weight: 0.5, why: 'Where the structure is an insurance contract, issue is a precondition like any other policy.' },
    ],
    gates: [
      { id: 'contract-read', requirement: 'The contract, the definition of the crediting base, and a current illustration including the guaranteed column', why: 'Nothing about this structure can be evaluated without them, and nothing about it should be described to a client before they have been read. This gate is open on no genome reading at all — it is open when somebody has done the reading.', external: true },
    ],
    whenItIsWrong: 'Wrong for anybody who would treat it as a bank account, because it is not one and has neither the same access nor the same backstop. And wrong to act on at all before the contract has been read, which is the current state of it here.',
    housePosition: 'refers-out',
    housePositionWhy: 'Recorded as described, not yet verified. Until the contract, the crediting base definition and a current illustration have been read, this firm has nothing to implement — and a structure that cannot be shown cannot be sold.',
    claims: [
      { claim: 'Over 25% returns on the all-time account value in four of the last six years, with no risk of loss to principal or interest.', status: 'unconfirmed', note: 'No contract, illustration or statement supporting this has been read by this system, so it is not a figure here and must not be repeated to a client. Three things need separating before it means anything: what "all-time account value" is defined as in the contract, whether the credit is an index credit or includes a bonus or multiplier, and what the guaranteed floor actually is in a year the index does nothing. A no-loss guarantee is a guarantee of the carrier and is only as good as the carrier, which is a statement about claims-paying strength rather than about the index.', settledBy: 'The contract, a current carrier illustration including the guaranteed column, and a client statement with the crediting base and the credit shown separately.' }, // copy-ok: R10 claim recorded verbatim as 'unconfirmed' in the claims registry; its note says it must not be repeated to a client
    ],
    relatedPaths: [P.lifetimeIncome],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CREDIT AND ARBITRAGE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'alt-credit-arbitrage',
    name: 'Positive Arbitrage From Alternative Lines of Credit',
    family: 'credit-arbitrage',
    oneLine: 'Borrow at one rate against assets you already own, deploy at a higher one, and keep the difference.',
    whatItIs: [
      'Capital is raised against existing assets — property, securities, policy cash value, a note — through routes that do not run through a retail bank equity line, and deployed into secured lending at a higher rate. The spread is the return, and it is available because the borrowing is secured by something stable while the lending is secured by something the borrower could not finance conventionally.',
      'Three things decide whether the arbitrage is real. The spread has to survive fees and tax. The deployment has to be genuinely secured, because an unsecured yield funded by a secured borrowing is not an arbitrage, it is a leveraged bet with a house behind it. And the term mismatch has to be modelled: a line accrues interest for twelve months a year while a six-month deployment earns for six of them, and capital sitting idle between deployments is the single most common reason a spread that looked like five points delivers two.',
      'This is the most operationally demanding strategy in this section and the one where the difference between doing it well and doing it casually is largest. It is also the one where the failure mode is worst, because the borrowing is secured against assets the household needs.',
    ],
    signals: [
      { factorId: 'numeracy', wants: 'high', weight: 1.0, why: 'The entire strategy is a spread computation net of fees, tax, defaults and idle time. Without the arithmetic it is a story about a spread.' },
      { factorId: 'leverage', wants: 'high', weight: 0.95, why: 'It requires borrowing capacity to exist. An already-stretched balance sheet cannot start and should not.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.9, why: 'Borrowed money deployed into loans that occasionally default. The first default arrives before the spread has compounded into anything.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.9, why: 'The line accrues every month whether or not a deployment is performing. Outside income is what services it when one is not.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.85, why: 'Deal flow is the strategy. Capital that sits idle between deployments earns nothing and costs the full borrowing rate.' },
      { factorId: 'concentration', wants: 'high', weight: 0.6, why: 'Somebody whose wealth already rests on one thing should not pledge it to fund a second exposure.' },
      { factorId: 'cognitive-durability', wants: 'high', weight: 0.7, why: 'Two positions at once, each with its own failure mode, and they interact.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.7, why: 'Deployed capital is committed for the term. A call on the line while it is deployed is the scenario that ends badly.' },
    ],
    gates: [
      { id: 'borrowing-capacity', requirement: 'Real unused borrowing capacity against a stable asset', factorId: 'leverage', test: { direction: 'atMost', score: -1.2 }, why: 'Without capacity there is nothing to arbitrage, and adding a commitment to a stretched balance sheet compounds a fragility rather than exploiting a spread.' },
      { id: 'servicing-without-the-deployment', requirement: 'Ability to service the line from other income for a full year', why: 'The test is whether the household survives a year in which the deployment returns nothing. If the answer depends on the deployment, the spread is not the risk being taken.', external: true },
    ],
    whenItIsWrong: 'Wrong where the deployment is unsecured — the spread is not compensation for pledging a house against somebody else\'s unsecured credit. Wrong where the household cannot service the line without the deployment performing. And wrong for anybody who will not model the idle time, because that is where the difference between the projected and realised return almost always lives.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'Implemented only with secured deployments, only where the line can be serviced from other income, and only against a ten-thousand-path simulation that charges the borrowing cost for the idle days rather than assuming continuous deployment.',
    claims: [],
    relatedPaths: [P.altCredit, P.ledger, P.mogul],
  },

  {
    id: 'debt-into-cash-flow',
    name: 'Turning Debt Into Cash Flow',
    family: 'credit-arbitrage',
    oneLine: 'Restructure existing obligations so that servicing them produces an asset instead of only reducing a balance.',
    whatItIs: [
      'Most households service several debts at several rates with no structure between them: a mortgage, a car, a card, a student loan, each with its own payment and its own term. This strategy consolidates the servicing through one structure so that the order of repayment is optimised, the interest saved is captured rather than absorbed, and the freed cash flow is redirected into something that produces income rather than into general spending.',
      'The mechanism is unglamorous. Rank obligations by real cost including tax treatment, retire them in that order with the freed payment from each rolling into the next, and route the whole thing so the balance being charged interest is as low as possible on as many days as possible. The result is that the same money retires more debt faster and then keeps going as a funding stream once the debt is gone.',
      'What makes this a strategy rather than budgeting advice is the last step. The difference between a household that retires its debt and one that converts it is whether the freed payment gets captured the month the last obligation clears, or quietly becomes lifestyle. That decision is made once, and it is worth more than the interest optimisation that preceded it.',
    ],
    signals: [
      { factorId: 'leverage', wants: 'low', weight: 0.95, why: 'There has to be debt for the strategy to work on. Somebody with none has nothing to convert.' },
      { factorId: 'spending-elasticity', wants: 'high', weight: 0.85, why: 'The freed payment has to be captured rather than absorbed, which is the discipline the whole thing depends on.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.8, why: 'An accelerated schedule against uncertain income produces a missed payment rather than an early payoff.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.7, why: 'The rolling redirection has to actually happen each time an obligation clears.' },
      { factorId: 'cognitive-durability', wants: 'high', weight: 0.6, why: 'Retiring the highest real-cost debt first is often not the one that feels worst, and holding that ordering requires understanding it.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.5, why: 'The middle of the sequence is the hardest part: the small wins are done and the large balance is still there.' },
    ],
    gates: [],
    whenItIsWrong: 'Wrong for a household with no surplus, where the honest answer is an income or spending problem rather than a structuring one. Wrong where the freed payments will be absorbed rather than captured, which turns a decade of discipline into a slightly nicer standard of living. And wrong where debt is already low enough that the effort exceeds the saving.',
    housePosition: 'implements',
    housePositionWhy: 'The ordering, the interest saved and the redirection schedule are computed from the household\'s actual obligations rather than from a rule of thumb.',
    claims: [],
    relatedPaths: [P.ledger, P.mortgageKiller, P.altCredit],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TAX
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'oil-gas-drilling',
    name: 'Oil and Gas Drilling Participations',
    family: 'tax-alpha',
    oneLine: 'A large first-year deduction against ordinary income, and an income stream from wells that may or may not produce.',
    whatItIs: [
      'A direct participation in drilling programmes, where a large share of the investment is spent on intangible drilling costs — labour, fuel, site preparation, everything with no salvage value — which the code has long allowed to be deducted currently rather than capitalised. For a high-bracket W-2 or 1099 earner with no other way to reduce ordinary income, that first-year deduction is the reason the investment exists, and it is genuinely large.',
      'The arithmetic that makes it compelling is real: a physician with $400,000 of W-2 income and a large current-year liability can convert a portion of what would have gone to the government into an ownership position that also distributes. Depletion allowances continue the tax benefit in later years, and distributions run for as long as the wells produce.',
      'Everything after the deduction is where the caution belongs. These are illiquid private placements, generally sold under Regulation D to accredited investors, with no secondary market and no way out if you change your mind. Distributions depend on wells actually producing and on commodity prices nobody controls — a well can be dry, a programme can decline faster than projected, and a price collapse takes the income with it while the deduction has already been taken. Working-interest participations also bring liability exposure that a limited interest does not. The tax benefit is the most certain thing in the transaction and the return is the least.',
    ],
    signals: [
      { factorId: 'tax-posture', wants: 'low', weight: 1.0, why: 'The whole case is a deduction taken now. It is worth exactly what this year\'s marginal rate is worth, and nothing to somebody in a low bracket.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.9, why: 'A large current-year liability is a precondition, and it has to be there again next year for the strategy to repeat.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.95, why: 'There is no secondary market. Money in a drilling programme is gone until distributions arrive, if they arrive.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.85, why: 'Distributions are lumpy, commodity-linked and occasionally absent. A statement can be worse than the last one for reasons nobody controls.' },
      { factorId: 'concentration', wants: 'high', weight: 0.7, why: 'Adding an illiquid, commodity-linked position on top of an already concentrated balance sheet compounds a single point of failure.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.7, why: 'The after-tax return is the only number that matters and computing it needs the deduction, the bracket, the depletion allowance and a realistic decline curve.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.6, why: 'The income stream is measured in years and the capital is committed for all of them.' },
      { factorId: 'institutional-trust', wants: 'high', weight: 0.5, why: 'The sponsor is the investment. Somebody unwilling to rely on an operator they cannot supervise should not be here.' },
    ],
    gates: [
      { id: 'accredited', requirement: 'Accredited investor status', why: 'These are almost always Regulation D private placements. Without accreditation the offering is not available at any level of fit.', external: true },
      { id: 'current-liability', requirement: 'A large current-year ordinary-income tax liability', why: 'The deduction is the product. Without a liability to apply it against, the investment is an illiquid commodity position bought for a benefit that did not arrive.', external: true },
      { id: 'sponsor-diligence', requirement: 'A sponsor with an audited multi-programme record across a price cycle', why: 'Programme results vary enormously by operator, and the ones that went badly are not in the marketing. A record that begins after the last price collapse is not a record.', external: true },
    ],
    whenItIsWrong: 'Wrong for anybody not in a high bracket, because the deduction is the whole case. Wrong for money that might be needed, since there is no exit. Wrong as a large share of a balance sheet at any bracket. And wrong when bought on a projected distribution rate rather than on the deduction — the deduction is the reliable part and the distribution is not.',
    housePosition: 'refers-out',
    housePositionWhy: 'The tax arithmetic is modelled here so a client can see the after-tax position honestly. The placement itself belongs with a securities-licensed professional and a sponsor the client has diligenced independently.',
    claims: [
      { claim: 'Roughly 14–16% of the total deposit distributed every year over about 13 years.', status: 'unconfirmed', note: 'That is a sponsor projection, not a return. Distributions depend on wells producing and on commodity prices, both of which vary, and programmes decline over their life rather than paying level amounts. Any figure of this kind has to be tied to a specific programme, with its own decline assumptions and its own record across a price collapse, before it is repeated.', settledBy: 'The programme\'s offering documents and the sponsor\'s audited distribution history across prior programmes, including ones that underperformed.' },
      { claim: 'Wipes out half a $400,000 earner\'s tax, and can be repeated every year.', status: 'needs-correction', note: 'The intangible drilling cost deduction is real and can be a large share of the investment in year one. But the size of the deduction is a function of how much is invested and what proportion is allocated to intangible costs, and the tax saved depends on the client\'s own return — including how the deduction interacts with the alternative minimum tax, at-risk limits, passive-activity rules and whether the interest is a working interest or a limited one. "Half your taxes" is not a property of the strategy; it is an output of one client\'s return, computed by their CPA in advance.', settledBy: 'A projected return prepared by the client\'s own CPA on the specific programme and investment amount.' },
    ],
    relatedPaths: [P.oilGas, P.figure, P.erosion],
  },

  {
    id: 'heavy-equipment-leasing',
    name: 'Heavy Equipment Leasing',
    family: 'tax-alpha',
    oneLine: 'Own the machine, lease it to the business that uses it, and take the depreciation while collecting the payments.',
    whatItIs: [
      'You buy equipment and lease it to an operating business. Title stays with you throughout, so if the lessee stops paying you repossess something you already own rather than foreclosing on collateral you merely hold a lien against — which is the cleanest security position in commercial finance. The lease payments are the income, and the depreciation on the equipment is the tax benefit.',
      'Essential-use equipment is the whole game. A contractor\'s excavator, a trucking company\'s tractors, a practice\'s imaging equipment — a business stops paying nearly everything before it stops paying for the machine that earns its revenue, and those machines have a real resale market when it finally does. Specialised or single-customer equipment has neither property, and a lease written against it is an unsecured loan wearing a costume.',
      'The risk that decides outcomes is residual value, and it is assumed at the start and tested at the end. An aggressive residual makes the payments look attractive and leaves an unsecured tail nobody priced. Value at forced-liquidation value on a third-party opinion, and treat anything above that as upside.',
    ],
    signals: [
      { factorId: 'tax-posture', wants: 'low', weight: 0.85, why: 'Depreciation taken now against income taxed now is the tax half of the case, and it is worth most in a high bracket.' },
      { factorId: 'business-ownership', wants: 'low', weight: 0.7, why: 'Somebody who already runs a business understands lessee credit, essential use and what a used machine actually sells for.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.8, why: 'Lease terms run two to five years and the capital is committed for all of it.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.8, why: 'The residual assumption decides the outcome and it is the number most often taken on trust.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.6, why: 'Lessee monitoring, insurance verification and landlord waivers are ongoing work, not paperwork.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.6, why: 'A defaulted lease means carrying, repossessing and remarketing the machine out of your own pocket first.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.5, why: 'A repossession is an operational ordeal, not a line item.' },
    ],
    gates: [
      { id: 'essential-use', requirement: 'Equipment with a genuine third-party resale market', why: 'The security is the machine. On specialised equipment the machine is worth its scrap value and the transaction is unsecured lending priced as secured.', external: true },
    ],
    whenItIsWrong: 'Wrong where the equipment is specialised, because the collateral evaporates exactly when it is needed. Wrong for somebody who will not do the operational work of monitoring a lessee. And wrong when bought for the depreciation alone — an aggressive residual can turn a tax-advantaged secured position into an unsecured loss with a deduction attached.',
    housePosition: 'refers-out',
    housePositionWhy: 'The economics are modelled in the alternative-credit section. The transactions themselves belong with a lessor or fund the client has diligenced, and the tax treatment with their CPA.',
    claims: [],
    relatedPaths: [P.altCredit],
  },

  {
    id: 'roth-conversion-tax-neutralisation',
    name: 'Roth Conversions With the Tax Bill Neutralised',
    family: 'tax-alpha',
    oneLine: 'Move money into a tax-free account and offset the conversion income rather than simply paying it.',
    whatItIs: [
      'A Roth conversion trades a tax bill now for tax-free growth and tax-free withdrawals later, plus freedom from required minimum distributions. The arithmetic favours conversion when the rate paid now is lower than the rate that would have been paid later, which for many households is true and for some is not — and which depends on where rates go, not only on where the household\'s income goes.',
      'The obstacle is almost always the bill. A large conversion in one year pushes the household into a higher bracket, raises the taxable share of Social Security, and can trigger Medicare premium surcharges two years later. Those second-order effects routinely exceed what people budgeted for.',
      'What this strategy adds is pairing: sequencing conversions across years to fill brackets rather than jump them, and offsetting the conversion income with deductions generated in the same year — charitable structures, business deductions, depreciation from a property or an equipment position, or an oil and gas deduction where one is appropriate. Done well the effective rate on converted dollars can be driven very low. Whether it reaches zero depends entirely on what deductions the household legitimately has, and a plan that assumes zero before checking is a plan built backwards.',
    ],
    signals: [
      { factorId: 'tax-posture', wants: 'low', weight: 1.0, why: 'Conversion wins when the future rate is higher than today\'s. That expectation is the entire thesis.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.9, why: 'The converted money needs years of tax-free growth to repay the tax paid to move it.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.8, why: 'The tax should be paid from outside the account. Paying it from the conversion defeats most of the benefit.' },
      { factorId: 'legacy-intent', wants: 'low', weight: 0.7, why: 'A Roth is the best asset to inherit under the ten-year rule, so somebody focused on what passes on gains more than a spender does.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.7, why: 'Bracket filling, Social Security taxation and Medicare surcharge thresholds all interact, and the interaction is where the cost hides.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.7, why: 'It is a multi-year sequence with a decision every year, not a single transaction.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.5, why: 'The tax has to be paid from other resources in each conversion year.' },
      { factorId: 'longevity-expectation', wants: 'high', weight: 0.5, why: 'More years of tax-free compounding is what repays the cost of conversion.' },
    ],
    gates: [
      { id: 'outside-funds', requirement: 'Tax on the conversion payable from outside the retirement account', why: 'Paying the tax from the converted amount shrinks the balance being converted and, before 59½, can add a penalty. It removes most of the advantage the conversion was for.', external: true },
      { id: 'cpa-modelled', requirement: 'A multi-year projection from the client\'s own CPA', why: 'Bracket, Social Security taxation and Medicare surcharge effects are specific to one return. No general model can substitute for the actual projection.', external: true },
    ],
    whenItIsWrong: 'Wrong for somebody who will genuinely be in a lower bracket later. Wrong where the tax has to come out of the account being converted. Wrong in a single large conversion when a sequence across years would have filled brackets instead of jumping them. And wrong when the offsetting deductions are being manufactured for the purpose rather than legitimately arising.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'The conversion sequence and the bracket arithmetic are modelled here, against the erosion engine\'s view of where rates may go. The return itself is signed by the client\'s CPA, and the offsetting positions have to stand on their own merits before they are used as an offset.',
    claims: [
      { claim: 'Advanced strategies can take the Roth conversion tax liability as low as 0%.',  status: 'needs-correction', note: 'A very low effective rate on converted dollars is achievable where a household has large legitimate deductions arising in the same year. It is an outcome of a particular return, not a feature of a strategy, and it cannot be promised in advance of seeing the return. It also should never be the reason a deduction-generating position is bought: a position that only makes sense because of what it offsets is a position bought backwards, and that reasoning is what the promoted-arrangement rules exist to catch.', settledBy: 'The client\'s own CPA-prepared multi-year projection showing the conversion, the offsets and the resulting effective rate.' },
    ],
    relatedPaths: [P.roth, P.iulVsRoth, P.erosion, P.figure],
  },

  {
    id: 'beyond-1031',
    name: 'Getting Out of Appreciated Property Without a 1031',
    family: 'tax-alpha',
    oneLine: 'Exit a property without the exchange deadlines, and without writing the whole cheque to the government.',
    whatItIs: [
      'A 1031 exchange defers gain but imposes a hard structure: forty-five days to identify, one hundred and eighty to close, a qualified intermediary, like-kind replacement, and debt that has to be replaced too. For an owner who wants out of operating property rather than into more of it, those deadlines force decisions that produce bad purchases.',
      'There are legitimate alternatives, each with its own trade. A Delaware Statutory Trust interest qualifies as replacement property and removes the operating burden, at the cost of illiquidity and no control. A 721 UPREIT contribution can convert property into operating-partnership units in a REIT, deferring gain and diversifying, with its own timing rules. An instalment sale spreads the gain across the years payments are received. Qualified Opportunity Zone investment defers and, held long enough, can eliminate gain on the new investment. Charitable remainder structures convert an appreciated asset into an income stream with a deduction, permanently giving up the remainder. And in some cases the honest answer is simply to sell, pay the tax, and own the proceeds outright.',
      'What none of these do is eliminate the rule. They are different sections of the code with different conditions, and each one substitutes a new set of constraints for the exchange deadlines. The work is matching the constraint the owner can actually live with — not finding a way around a rule that does not have one.',
    ],
    signals: [
      { factorId: 'tax-posture', wants: 'low', weight: 0.9, why: 'Deferral is worth most to somebody who expects to face a higher rate, and the whole question is when the gain gets recognised.' },
      { factorId: 'attention-budget', wants: 'low', weight: 0.7, why: 'A large part of the reason to leave a 1031 behind is to stop operating property. Somebody happy to keep operating has less need of these.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.8, why: 'Most of the alternatives are more illiquid than the property was, not less. A DST interest cannot be sold.' },
      { factorId: 'legacy-intent', wants: 'low', weight: 0.7, why: 'Where the plan is to hold until death, the step-up changes the whole calculation and deferral may be all that is needed.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.7, why: 'Opportunity zone benefits and UPREIT structures are measured in years, and an instalment sale spreads across them.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.6, why: 'Depreciation recapture, state treatment and the net investment income tax all sit inside the answer and are routinely left out of it.' },
      { factorId: 'business-ownership', wants: 'low', weight: 0.4, why: 'Owners with operating interests often have the entity structures and the advisers that make these workable.' },
    ],
    gates: [
      { id: 'tax-counsel', requirement: 'A CPA and, for the trust and partnership structures, a tax attorney', why: 'Each of these is a different code section with its own conditions, and the ones that fail do so on technical grounds rather than on economics.', external: true },
    ],
    whenItIsWrong: 'Wrong when the owner actually wants more property, in which case a 1031 is simpler and better. Wrong where the replacement structure is more illiquid than the owner can tolerate, which is most of them. And wrong when chosen for the tax outcome before the underlying investment has been judged on its own merits.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'The comparison — gain, recapture, state treatment and net proceeds under each route — is modelled here so the client can see them side by side. The structures themselves are executed with the client\'s tax counsel.',
    claims: [
      { claim: 'Advanced strategies can eliminate the 1031 rule.', status: 'needs-correction', note: 'Nothing eliminates it. There are alternative code sections — 721 contributions, instalment sales, Opportunity Zones, charitable remainder structures, DST replacement property — each of which substitutes its own constraints for the exchange deadlines. Framing them as eliminating a rule oversells them and hides the constraint the client will actually live with.', settledBy: 'A side-by-side projection of each route for the specific property, prepared with tax counsel.' },
    ],
    relatedPaths: [P.mogul, P.figure],
  },

  {
    id: 'w2-federal-liability-reduction',
    name: 'Reducing Federal Liability on W-2 and 1099 Income',
    family: 'tax-alpha',
    oneLine: 'The legitimate levers a high earner actually has, and an honest account of how far they reach.',
    whatItIs: [
      'W-2 income is the hardest income in the code to shelter, by design. Withholding is immediate, the deductions available to employees were largely removed, and most of what gets marketed to high-earning employees either does not apply to them or does not work. That is the starting position and any plan that begins somewhere more optimistic is selling something.',
      'The levers that genuinely exist: maximising qualified plan contributions, and where self-employment income is present, a solo 401(k), a defined benefit or cash balance plan that can absorb very large contributions; health savings accounts; qualified charitable structures including donor-advised funds and appreciated-stock gifts; real estate depreciation where the participation tests are genuinely met; oil and gas intangible drilling costs where accreditation and appetite exist; and for 1099 income specifically, entity structure, reasonable compensation analysis and the qualified business income deduction. Timing matters too — bunching deductions, deferring compensation where a plan permits it, and harvesting losses.',
      'Where it stops: there is no structure that removes a W-2 employee\'s federal liability as a matter of course, and arrangements promising that outcome are the ones that appear on the IRS\'s own list of abusive transactions. The line between aggressive and abusive is not a matter of nerve, it is a matter of whether the position would survive examination — and the person who signs the return carries that, not the person who sold the idea.',
    ],
    signals: [
      { factorId: 'tax-posture', wants: 'low', weight: 1.0, why: 'The value of every lever here is the marginal rate it avoids.' },
      { factorId: 'business-ownership', wants: 'low', weight: 0.9, why: 'Nearly every large lever requires self-employment or business income. A pure W-2 earner has materially fewer of them, and that is the honest headline.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.7, why: 'Plan contributions and deferrals are multi-year commitments against income that has to keep arriving.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.7, why: 'The levers interact, and the interaction — phase-outs, AMT, the net investment income tax — is where the saving is won or lost.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.7, why: 'Most of these are annual decisions with deadlines, not a structure set up once.' },
      { factorId: 'institutional-trust', wants: 'low', weight: 0.5, why: 'A healthy scepticism is an asset here. This is the area of personal finance with the most confident bad advice in it.' },
      { factorId: 'state-exposure', wants: 'low', weight: 0.5, why: 'A high-tax state raises the value of every federal lever that also works at state level, and changes which ones do.' },
    ],
    gates: [
      { id: 'return-signer', requirement: 'A CPA who will sign the return with the position on it', why: 'Any strategy no preparer will sign is not a strategy. This gate removes the entire abusive-arrangement category without needing to argue about any individual one.', external: true },
    ],
    whenItIsWrong: 'Wrong as a headline promise to a pure W-2 earner with no business income — the levers are real but they are fewer and smaller than the marketing implies. And wrong wherever a position is taken that the client\'s own preparer will not sign, whatever anybody else says about it.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'The bracket, deduction and entity arithmetic is modelled here. Positions are taken only where the client\'s own CPA will sign the return, and this firm implements nothing that depends on a preparer being changed.',
    claims: [
      { claim: 'Advanced strategies can eliminate federal tax liability every year on W-2 or 1099 income.', status: 'needs-correction', note: 'For 1099 and business income there is a genuine and sometimes very large set of levers — retirement plan design, entity structure, the qualified business income deduction, depreciation, timing. For pure W-2 income the available levers are far fewer, and "eliminate every year" describes arrangements that appear on the IRS list of abusive transactions rather than a planning outcome. The correct framing is a modelled reduction the client\'s own preparer will sign, with the figure computed rather than promised.', settledBy: 'A CPA-prepared projection for the client, listing each position taken and the authority for it.' },
    ],
    relatedPaths: [P.figure, P.erosion],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DEBT ELIMINATION
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'total-debt-elimination',
    name: 'Getting Out of All Debt',
    family: 'debt-elimination',
    oneLine: 'Every obligation retired — cars, cards, student loans, mortgage — in an order chosen by arithmetic.',
    whatItIs: [
      'The goal state is a household with no obligations at all, and the strategy is the ordering and the routing that gets there fastest with the money already available. Obligations are ranked by real cost — including tax treatment, since a deductible mortgage and a non-deductible card at the same nominal rate are not the same debt — and retired in sequence, with each freed payment rolling into the next.',
      'The argument against is a real one and deserves stating: retiring cheap, fixed, long-dated debt to hold no debt at all forgoes a spread that could have been earned elsewhere, and in an inflationary period a fixed low-rate mortgage is an asset rather than a liability. Anybody who tells you otherwise is arguing a preference as though it were arithmetic.',
      'The argument for is also real and it is not arithmetic. A household with no obligations has an expense base that cannot rise, cannot be called, and does not depend on income continuing. That is optionality and resilience rather than return, and for some households it is worth more than the spread they gave up. The honest job is to size both and let the person choose with the numbers in front of them.',
    ],
    signals: [
      { factorId: 'leverage', wants: 'low', weight: 0.9, why: 'There has to be debt to eliminate, and the more expensive it is the stronger the case.' },
      { factorId: 'emotional-durability', wants: 'low', weight: 0.8, why: 'Somebody who sleeps badly with obligations gains something from this that no spread calculation captures.' },
      { factorId: 'income-durability', wants: 'low', weight: 0.75, why: 'Fragile income is the strongest argument for a fixed expense base that cannot be called.' },
      { factorId: 'spending-elasticity', wants: 'high', weight: 0.8, why: 'The acceleration is funded by surplus. Without it the sequence takes decades and the strategy is aspiration.' },
      { factorId: 'institutional-trust', wants: 'low', weight: 0.5, why: 'Somebody who prefers not to depend on lenders or institutions is buying exactly that with this.' },
      { factorId: 'time-horizon', wants: 'low', weight: 0.5, why: 'A shorter horizon strengthens the case, because there is less time for a retained spread to compound into anything.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.6, why: 'The rolling redirection has to be executed each time an obligation clears.' },
      { factorId: 'tax-posture', wants: 'high', weight: 0.4, why: 'Where deductions are worth less, retiring deductible debt costs less than it otherwise would.' },
    ],
    gates: [],
    whenItIsWrong: 'Wrong where it means retiring a cheap, fixed, long-dated mortgage that inflation is quietly retiring for you, while forgoing a spread that was genuinely available. Wrong where it consumes an emergency reserve on the way — a household with no debt and no cash is one repair away from new debt at a worse rate. And wrong when pursued past the point where the remaining debt costs less than the alternative use of the money, which is a calculation rather than a feeling.',
    housePosition: 'implements',
    housePositionWhy: 'The ordering, the timeline and the total interest avoided are computed from the household\'s own obligations, and the forgone-spread case is modelled beside it rather than omitted.',
    claims: [],
    relatedPaths: [P.ledger, P.mortgageKiller],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MARKETS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bitcoin-and-crypto',
    name: 'Bitcoin and Digital Assets',
    family: 'markets',
    oneLine: 'An asset with no cash flow, genuine scarcity, extreme volatility, and a real history of custodial failure.',
    whatItIs: [
      'Bitcoin has no earnings, pays no coupon, and has no intrinsic yield. Its value rests on scarcity and on adoption, which means it cannot be valued by discounting anything — every price is somebody\'s view of what somebody else will pay. That is not a criticism, it is a description, and it is why position sizing matters more here than analysis does.',
      'The volatility is not a phase. Drawdowns of seventy percent and more have happened repeatedly and there is no structural reason they will not happen again. Any position should be sized so that a seventy percent fall is survivable without changing anything else in the household, because at some point it will be tested.',
      'Custody is the risk that has actually destroyed the most retail capital, not price. Exchanges and lenders holding customer assets have failed repeatedly, and customers became unsecured creditors in bankruptcy. Self-custody moves that risk from a company to the owner\'s own key management, which is a different risk rather than a smaller one for most people. Whatever else is decided, this question deserves a real answer before any amount is bought.',
    ],
    signals: [
      { factorId: 'emotional-durability', wants: 'high', weight: 1.0, why: 'Seventy percent drawdowns. A holder who sells in one has converted volatility into a permanent loss.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.85, why: 'Any sensible holding period here is measured in market cycles, not years.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.8, why: 'Money that might be needed cannot sit in something that can halve in a quarter.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.6, why: 'Position sizing is the entire discipline, and sizing is arithmetic.' },
      { factorId: 'institutional-trust', wants: 'low', weight: 0.5, why: 'The original argument for the asset is a distrust of institutional custody of money. People who hold it well usually share that instinct.' },
      { factorId: 'income-durability', wants: 'high', weight: 0.6, why: 'It produces nothing, so it must be funded entirely from surplus.' },
      { factorId: 'dependents', wants: 'high', weight: 0.5, why: 'Money others rely on now does not belong in an asset that can halve, and key management creates an estate problem dependants may not be able to solve.' },
      { factorId: 'concentration', wants: 'high', weight: 0.5, why: 'Adding a volatile uncorrelated position to an already concentrated balance sheet raises total risk rather than diversifying it.' },
    ],
    gates: [
      { id: 'custody-settled', requirement: 'A settled answer on custody, and on what happens to the keys if you do not', why: 'Custodial failure, not price, has destroyed the most retail capital in this asset class. Self-custody moves the risk rather than removing it, and creates an estate problem dependants may be unable to solve.', external: true },
    ],
    allocation: (fit) => ({
      minPct: fit >= 55 ? 1 : 0,
      maxPct: Math.max(1, Math.min(10, Math.round((fit - 40) * 0.18))),
      basis: 'Sized so that a total loss changes nothing structural about the household. The ceiling is held in single digits at every fit level, because the position is un-valuable by any cash-flow method and a seventy percent drawdown has to be survivable without a decision.',
    }),
    whenItIsWrong: 'Wrong for anybody who would sell in a deep drawdown, which is most people who have not been through one. Wrong at a size where a total loss would matter. Wrong without a settled answer on custody. And wrong as a plan — it is a position, and a position is not a strategy.',
    housePosition: 'declines',
    housePositionWhy: 'This firm does not custody, advise on or transact digital assets. It is modelled here because a client\'s existing holding belongs in their picture and because borrowing against one is a live route in the credit section — but the position itself is the client\'s own, held elsewhere.',
    claims: [],
    relatedPaths: [P.altCredit, P.erosion],
  },

  {
    id: 'direct-equities',
    name: 'Direct Ownership of Individual Equities',
    family: 'markets',
    oneLine: 'Owning specific companies, with the full range of outcomes that implies.',
    whatItIs: [
      'Buying individual companies means accepting the risk that a single one of them is permanently impaired, which diversification exists to remove. The evidence on concentrated individual stock selection by non-professionals is not encouraging, and the most common version of this in a real household is not a chosen portfolio at all — it is an accumulated position in an employer, acquired through compensation and never sold.',
      'That employer concentration is the genuinely important case, because it correlates the household\'s savings with its income. The same event that ends the job takes the savings with it. This is the single most common structural flaw in a high-earning household\'s balance sheet and the one people are most reluctant to fix, for reasons that are about loyalty and tax rather than about risk.',
      'Where direct ownership does real work is tax: individual lots can be harvested for losses, gifted in kind, or held for a step-up in a way a fund cannot match. That is a genuine advantage and it is an argument about structure rather than about stock selection.',
    ],
    signals: [
      { factorId: 'emotional-durability', wants: 'high', weight: 0.9, why: 'Individual companies fall further and stay down longer than indexes, and sometimes do not come back.' },
      { factorId: 'concentration', wants: 'high', weight: 0.9, why: 'Somebody already concentrated should be reducing single-name exposure, not adding to it.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.7, why: 'Without it, direct holding becomes a collection of stories about companies.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.7, why: 'Individual positions need monitoring. A portfolio nobody looks at is a portfolio drifting by accident.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.7, why: 'Equity risk needs time to be compensated, and individual equity risk needs more of it.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.6, why: 'Liquidity is good, but selling into a drawdown to raise cash realises the loss.' },
      { factorId: 'tax-posture', wants: 'low', weight: 0.4, why: 'Lot-level control, loss harvesting and in-kind gifting are worth more at a higher rate.' },
    ],
    gates: [],
    allocation: (fit) => ({
      minPct: 0,
      maxPct: Math.max(0, Math.min(15, Math.round((fit - 45) * 0.3))),
      basis: 'Single-name exposure as a share of total assets, capped tightly. A ceiling in the low teens at the highest fit, because the failure mode is permanent impairment of one company rather than a drawdown that recovers — and an existing employer position counts against this ceiling rather than sitting outside it.',
    }),
    whenItIsWrong: 'Wrong as a large share of a household\'s wealth in any single name, and most wrong when that name is the employer, because it correlates savings with income. Wrong for somebody who will not monitor it. And wrong when it is really an unexamined inheritance of positions nobody chose.',
    housePosition: 'declines',
    housePositionWhy: 'This firm does not select securities or manage portfolios. Existing holdings are modelled as part of the picture — particularly concentration against employer — and the client\'s own adviser or custodian holds them.',
    claims: [],
    relatedPaths: [P.erosion],
  },

  {
    id: 'bonds-and-fixed-income',
    name: 'Bonds and Fixed Income',
    family: 'markets',
    oneLine: 'Contractual payments with credit and rate risk, and no protection against inflation unless it is bought explicitly.',
    whatItIs: [
      'A bond promises a stream of payments and a return of principal at maturity. Held to maturity from a solvent issuer, the outcome is known at purchase — which is the property nothing else in markets has, and it is the reason bonds exist in a plan at all.',
      'Two risks are usually understated. Rate risk is real and was demonstrated forcefully in the 2022 drawdown, when long-duration bonds fell further than most holders believed possible for an asset they thought of as safe. And inflation risk is total: a fixed nominal coupon loses purchasing power at whatever rate prices rise, with no mechanism to catch up. Inflation-protected issues address the second at the cost of yield.',
      'For a household with a genuine need for a known payment on a known date — a tuition bill, a purchase, a spending floor — a matched bond is often the cleanest instrument available, and better than a fund for that purpose because the maturity is the point.',
    ],
    signals: [
      { factorId: 'time-horizon', wants: 'low', weight: 0.85, why: 'Short horizons are where certainty of principal outweighs growth.' },
      { factorId: 'liquidity-need', wants: 'low', weight: 0.8, why: 'A household needing cash reachable on a schedule is the natural owner of matched maturities.' },
      { factorId: 'emotional-durability', wants: 'low', weight: 0.7, why: 'Somebody who cannot hold through equity drawdowns needs an asset whose outcome is known at purchase.' },
      { factorId: 'inflation-exposure', wants: 'high', weight: 0.8, why: 'A household whose income already adjusts with prices can hold fixed nominal payments. One whose income does not is doubling an exposure it already has.' },
      { factorId: 'spending-elasticity', wants: 'low', weight: 0.6, why: 'Committed spending needs predictable payments more than it needs expected return.' },
      { factorId: 'tax-posture', wants: 'high', weight: 0.4, why: 'Interest is taxed as ordinary income, which costs more in a high bracket and argues for municipal issues or a sheltered account.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.4, why: 'Duration, credit quality and real versus nominal yield are what separate a bond decision from a label.' },
    ],
    gates: [],
    allocation: (fit) => ({
      minPct: Math.max(0, Math.round((fit - 45) * 0.4)),
      maxPct: Math.max(10, Math.round((fit - 45) * 0.9)),
      basis: 'Scaled to the need for known payments on known dates rather than to an age rule. Where a guaranteed-income floor is already in place it does part of this job, and the two should be sized together rather than stacked without looking.',
    }),
    whenItIsWrong: 'Wrong as a large long-horizon holding for a household with fixed nominal income elsewhere, which doubles an inflation exposure rather than diversifying it. Wrong at long duration for money that might be needed, as 2022 demonstrated. And wrong when bought as "the safe part" without anybody having looked at duration or credit.',
    housePosition: 'declines',
    housePositionWhy: 'This firm does not manage portfolios or select securities. Fixed income is modelled where it competes with a guaranteed-income floor for the same job, so the client can see both, and it is implemented by their own adviser.',
    claims: [],
    relatedPaths: [P.erosion, P.lifetimeIncome],
  },

  {
    id: 'sixty-forty',
    name: 'The 60/40 Portfolio',
    family: 'markets',
    oneLine: 'Sixty percent equities, forty percent bonds, rebalanced — the default answer, and a defensible one.',
    whatItIs: [
      'The standard allocation, and it earned its standing honestly: it is cheap, it requires almost no decisions, it diversifies across the two largest asset classes, and it has produced reasonable long-run outcomes for people who left it alone. Anybody dismissing it should be made to say what they are replacing it with and why that is better after costs.',
      'The known weakness is that the diversification depends on equities and bonds not falling together, and in 2022 they did — a rising-rate inflationary shock hit both at once, and the allocation delivered its worst year in decades precisely when its owners needed the bond half to work. That is not a reason to abandon it; it is a reason to know what it does and does not protect against.',
      'This firm\'s position is a preference rather than a finding, and it should be labelled as one. A 60/40 leaves the outcome to markets and to sequence — the order returns arrive in, which nobody controls and which matters enormously in the years around retirement. The structural approach this firm runs instead accepts a lower expected return in exchange for removing decisions from the market\'s hands. That is a trade, not a proof, and a client who prefers the other side of it is not making a mistake.',
    ],
    signals: [
      { factorId: 'attention-budget', wants: 'low', weight: 0.8, why: 'Its greatest virtue is that it works for somebody who will not engage. Almost nothing else here does.' },
      { factorId: 'institutional-trust', wants: 'high', weight: 0.7, why: 'It requires being willing to leave money with a market and a manager and not interfere.' },
      { factorId: 'emotional-durability', wants: 'high', weight: 0.9, why: 'The whole return depends on not selling in a drawdown. There is no structural protection, only the holder\'s temperament.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.8, why: 'Sequence risk is what harms this allocation, and time is the only thing that mitigates it.' },
      { factorId: 'numeracy', wants: 'low', weight: 0.4, why: 'It demands little arithmetic from its owner, which is a genuine feature for many households.' },
      { factorId: 'spending-elasticity', wants: 'high', weight: 0.6, why: 'A household able to cut spending in a bad year can avoid selling into one, which is what makes this allocation survivable in drawdown.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.4, why: 'Fully liquid, which suits somebody who wants access — provided they accept selling at whatever price exists that day.' },
    ],
    gates: [],
    allocation: (fit) => ({
      minPct: 0,
      maxPct: Math.max(0, Math.min(100, Math.round(fit))),
      basis: 'Shown as the share of liquid assets a conventional allocation could reasonably occupy for this configuration. It is included at full range deliberately: for a household that will not engage and has a long horizon, this is a defensible answer and the page should not hide that.',
    }),
    whenItIsWrong: 'Wrong for a household approaching drawdown with no cutting room and no floor, where sequence risk does the damage and the allocation has no answer to it. Wrong for somebody who will sell in a drawdown, since the entire result depends on not doing that. And its weakness is exactly the 2022 case: an inflationary rate shock that takes both halves down together.',
    housePosition: 'declines',
    housePositionWhy: 'Not what this firm builds, and the reason is a stated preference rather than a claim of superiority: this method removes decisions from the market\'s hands and accepts a lower expected return for it. A client who prefers a conventional allocation is well served by a low-cost provider, and should be told so plainly.',
    claims: [],
    relatedPaths: [P.erosion],
  },

  {
    id: 'self-directed-retirement-deployment',
    name: 'Deploying Retirement Capital Into What You Already Understand',
    family: 'markets',
    oneLine: 'Use a self-directed plan to own property or make secured loans, inside the tax shelter.',
    whatItIs: [
      'Retirement capital is frequently the largest pool a household controls and the one least often deployed into the asset class they know best. A self-directed custodian holds the account, the property or the note is titled to the plan, income flows back to the plan, and gains compound sheltered — or, in a Roth, are never taxed at all.',
      'The structural fork matters more than anything else: an IRA that borrows to buy property incurs tax on the debt-financed portion of the income at trust rates, while a Solo 401(k) is exempt from that charge on leveraged real estate. On a leveraged purchase that single difference outweighs the rate, the location and the cap rate combined. A Solo 401(k) also permits a participant loan, which an IRA does not.',
      'The prohibited-transaction rules are strict and the penalty is disqualification of the whole account, not a fine. You cannot use the property, cannot do the repairs yourself, and cannot transact with a disqualified person. The cleanest use of the structure, and the most overlooked, is lending rather than owning: a plan making secured loans has income, collateral and almost no operational surface for a violation to occur on.',
    ],
    signals: [
      { factorId: 'cognitive-durability', wants: 'high', weight: 0.85, why: 'The prohibited-transaction rules are unintuitive and the penalty for misunderstanding them is the whole account.' },
      { factorId: 'attention-budget', wants: 'high', weight: 0.8, why: 'Every expense from the plan, every dollar of income back to it, no exceptions and no shortcuts.' },
      { factorId: 'business-ownership', wants: 'low', weight: 0.8, why: 'A Solo 401(k) requires genuine self-employment income, and that is the version of this structure that actually works with leverage.' },
      { factorId: 'time-horizon', wants: 'high', weight: 0.75, why: 'Sheltered compounding is the point, and the shelter is only worth anything over decades.' },
      { factorId: 'liquidity-need', wants: 'high', weight: 0.7, why: 'Plan assets are committed and the custodian is slow. This is not reachable money.' },
      { factorId: 'tax-posture', wants: 'low', weight: 0.6, why: 'The shelter is worth most where the alternative is income taxed at a high rate.' },
      { factorId: 'numeracy', wants: 'high', weight: 0.6, why: 'The debt-financed income charge is the deciding number and it has to be computed, not assumed away.' },
    ],
    gates: [
      { id: 'custodian-and-cpa', requirement: 'A self-directed custodian and a CPA on the file from the first transaction', why: 'A prohibited transaction can disqualify the entire account, making the whole balance taxable at once. This is not a risk to manage afterwards.', external: true },
      { id: 'plan-reserve', requirement: 'A cash reserve held inside the plan for the asset\'s worst plausible quarter', why: 'Paying a plan expense personally is the most common accidental violation, and it happens when the plan runs short.', external: true },
    ],
    whenItIsWrong: 'Wrong for anybody who would be tempted to use the property, do the work themselves or pay an invoice personally, because those are the violations that actually occur. Wrong for an IRA buying leveraged property where a Solo 401(k) was available. And wrong where the client needs the money reachable.',
    housePosition: 'implements-with-conditions',
    housePositionWhy: 'The structure comparison and the debt-financed income arithmetic are modelled here. The custody, the plan documents and the transaction review belong with a specialist custodian and the client\'s CPA.',
    claims: [],
    relatedPaths: [P.altCredit, P.mogul],
  },
];
