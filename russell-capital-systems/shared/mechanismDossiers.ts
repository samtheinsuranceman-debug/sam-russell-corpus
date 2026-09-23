// ============================================================
// MECHANISM DOSSIERS — the long-form file behind each of the five mechanisms.
//
// cycleEngine.ts carries the numbers a simulation needs: release rate, turn
// length, whether the obligation amortises. This file carries what a person
// needs before they sign anything — how the thing actually works step by step,
// who provides it, when it is the right tool and when it is not, and two
// ratings that are deliberately kept apart.
//
// ## The two ratings, and why they are two
//
//   valueRating     — 1–10. How much this is worth TO SOMEONE IT SUITS.
//   frequencyRating — 1–10. How often a normal household under ordinary
//                     circumstances actually has a use for it.
//
// Collapsing these into one number is the central dishonesty of financial
// marketing. A policy loan cycle rates 7 for value and 2 for frequency: it is
// genuinely good and almost nobody should run it. An equity share rates 4 for
// value and 2 for frequency and is still sometimes the only door that opens.
// One number cannot say either of those things.
//
// ## On the provider lists
//
// Names, what they do, and their own homepage. Nothing else.
//
// No phone numbers, no rates, no terms, no advance percentages. Those live in
// shared/altCredit/lenders.ts where every field is Verified<T> and carries the
// source it was read from and the date — and where most contact fields are
// deliberately marked notVerified rather than guessed. `registryId` points at
// that record when one exists, so this file never becomes a second, staler
// copy of contact data.
//
// A homepage is the one field a reader can use to check every other claim in
// ten seconds, which is why it is the only one repeated here. Rates and terms
// move weekly; anything quoted from memory would be wrong by the time it
// rendered. Inclusion is not endorsement and the lists are not exhaustive.
// ============================================================

import { type MechanismId, MECHANISMS } from './cycleEngine';

export interface MechanicStep {
  /** What happens, in order. */
  readonly step: string;
  /** What actually moves — money, collateral, title, paper. The part people skip. */
  readonly whatMoves: string;
  /** The term in the paperwork that governs this step, where one does. */
  readonly governedBy?: string;
}

export interface Provider {
  readonly name: string;
  /** The company's own site. The one field a reader can use to check the rest. */
  readonly homepage: string;
  /** What they do, categorically. No rates, no terms, no advance percentages. */
  readonly what: string;
  /** Points at the Verified<T> record in shared/altCredit/lenders.ts when one exists. */
  readonly registryId?: string;
  /** What to establish from their own material before relying on anything. */
  readonly askFirst: string;
}

export interface Interop {
  readonly with: MechanismId;
  /** How the two actually interact — mechanically, not thematically. */
  readonly how: string;
  /** 1–10. How much better they are together than apart. */
  readonly strength: number;
  /** The thing that goes wrong when they are combined carelessly. */
  readonly caution: string;
}

export interface Dossier {
  readonly id: MechanismId;
  /** Three or four sentences: what this is, for someone who has never heard of it. */
  readonly plainly: string;
  /** The mechanics, in the order they happen. */
  readonly mechanics: readonly MechanicStep[];
  /** The companies. Five to ten, named, with their own homepage and nothing else. */
  readonly providers: readonly Provider[];
  /** Conditions under which this is the right tool. */
  readonly bestWhen: readonly string[];
  /** Conditions under which it is the wrong one, stated as plainly. */
  readonly worstWhen: readonly string[];
  /** How it combines with each of the other four. */
  readonly interop: readonly Interop[];
  readonly valueRating: number;
  readonly valueWhy: string;
  readonly frequencyRating: number;
  readonly frequencyWhy: string;
  /** The question that decides whether this is for you. One question. */
  readonly decidingQuestion: string;
  /** Accent colour for the three-dimensional title treatment on the page. */
  readonly accent: { readonly base: string; readonly deep: string; readonly glow: string };
}

export const DOSSIERS: readonly Dossier[] = [
  /* ═══════════════════════ POLICY LOAN ═══════════════════════ */
  {
    id: 'policy-loan',
    plainly:
      'You overfund a permanent life insurance policy so it builds cash value faster than a normal one. When you need money you do not withdraw it — you borrow from the insurance company, which lends you its own money and holds your cash value as collateral. Your balance keeps earning the whole time the loan is outstanding. That is the entire trick, and it is real.',
    mechanics: [
      { step: 'Design the policy for cash value rather than for death benefit.', whatMoves: 'Nothing yet. The base death benefit is set as low as the carrier permits for the premium, and a paid-up-additions rider takes the rest, because commission follows the base and cash value follows the rider.', governedBy: 'Carrier product design; the agent chooses this and the client rarely sees the choice.' },
      { step: 'Fund it, staying under the seven-pay limit.', whatMoves: 'Premium out of the household, into the policy. A portion buys insurance and a portion becomes cash value; in the early years the split is unfavourable and cash value sits below premium paid.', governedBy: 'IRC §7702A. Exceed the seven-pay limit and the contract becomes a modified endowment contract — permanently, and retroactively.' },
      { step: 'Wait. Ten to fifteen years before the pool is worth borrowing against.', whatMoves: 'Dividends, if declared, buy more paid-up additions, which earn more dividends. This is the compounding the whole structure is built to protect.', governedBy: 'Nothing contractual. This step is why most policies designed for this purpose are abandoned before they work.' },
      { step: 'Request a loan against the cash value.', whatMoves: 'The insurer\'s general-account money, out to you. Your cash value does not move and is not withdrawn — it is pledged. It continues being credited.', governedBy: 'The policy loan provision. Read whether the contract is direct or non-direct recognition: on direct recognition the pledged portion is credited at a different rate, which narrows the advantage considerably.' },
      { step: 'Deploy the money, then repay on your own schedule.', whatMoves: 'Capital out to the deal, and cash back in when you choose. There is no amortisation schedule and no payment due date, which is the freedom and the trap in the same sentence.', governedBy: 'The loan provision again. Unpaid interest is added to the loan balance and compounds.' },
      { step: 'Watch the two lines.', whatMoves: 'The loan balance compounds upward at the loan rate; the cash value grows at the credited rate. If the loan rate exceeds the credited rate and interest is never paid, the lines converge.', governedBy: 'Nothing protects you here. When the loan balance reaches the cash value the policy lapses, and the entire gain becomes taxable in one year with no cash arriving to pay the bill.' },
    ],
    providers: [
      { name: 'MassMutual', homepage: 'https://www.massmutual.com', what: 'Mutual carrier; participating whole life with paid-up-additions riders.', askFirst: 'Ask for the design to be run as maximum-funded to the seven-pay limit, and ask what the base death benefit would be if it were minimised.' },
      { name: 'New York Life', homepage: 'https://www.newyorklife.com', what: 'Mutual carrier; participating whole life, custom whole life designs.', askFirst: 'Ask whether the loan provision is direct or non-direct recognition, in writing.' },
      { name: 'Northwestern Mutual', homepage: 'https://www.northwesternmutual.com', what: 'Mutual carrier; participating whole life.', askFirst: 'Ask for the guaranteed column of the illustration alone, with dividends set to zero.' },
      { name: 'Guardian Life', homepage: 'https://www.guardianlife.com', what: 'Mutual carrier; whole life with paid-up-additions riders.', askFirst: 'Ask for year-by-year cash value against cumulative premium, and find the year they cross.' },
      { name: 'Penn Mutual', homepage: 'https://www.pennmutual.com', what: 'Mutual carrier; whole life and accumulation-oriented designs.', askFirst: 'Ask for written confirmation the design stays outside modified endowment contract status at the planned funding level.' },
      { name: 'Lafayette Life', homepage: 'https://www.lafayettelife.com', what: 'Western & Southern member; whole life often used for accumulation designs.', askFirst: 'Ask what happens to the illustration if a single year\'s premium is missed.' },
      { name: 'Ameritas', homepage: 'https://www.ameritas.com', what: 'Mutual holding company structure; permanent life products.', askFirst: 'Ask for the surrender charge schedule by year, separately from the illustration.' },
      { name: 'Foresters Financial', homepage: 'https://www.foresters.com', what: 'Fraternal benefit society; whole life, including simplified-issue designs.', askFirst: 'Ask how membership status affects the policy and the dividend.' },
    ],
    bestWhen: [
      'You can fund it every year for ten to fifteen years including a bad one — size the premium to your worst plausible year, not your average.',
      'You are young enough and healthy enough that the cost of insurance is not eating the design.',
      'You want capital that stays deployed while you use it, which is a property nothing else on this list has.',
      'You have already filled tax-advantaged space and this is the next dollar, not the first one.',
      'The estate matters to you. The death benefit is not a side effect; for many households it is the actual reason.',
    ],
    worstWhen: [
      'The premium is a stretch. A policy abandoned in year four is a realised loss, not a paused plan.',
      'You need the money inside five years. This is the least liquid thing here for the first decade.',
      'Somebody sold you a design with a large base death benefit and no paid-up-additions rider, which is a commission product wearing this strategy\'s name.',
      'You intend to borrow and never pay the interest. That is the lapse scenario, and it ends with a tax bill and no policy.',
      'You are being told you "become your own bank" or "pay yourself the interest". You borrow from an insurance company and the interest goes to the insurance company.',
    ],
    interop: [
      { with: 'brrrr-dscr', how: 'The policy loan funds a down payment or a renovation, and the property\'s cash flow repays the loan while the cash value keeps compounding. The closest thing here to using the same dollar twice.', strength: 9, caution: 'A renovation overrun becomes unpaid loan interest, and unpaid loan interest is how policies lapse.' },
      { with: 'velocity-heloc', how: 'Velocity produces the surplus that pays the premium, which is the hardest part of this mechanism to sustain.', strength: 7, caution: 'Both compete for the same monthly surplus. Fund the premium first; it is the one with a fifteen-year commitment attached.' },
      { with: 'seller-wrap', how: 'Note income is the cleanest premium source available: contractual, monthly, and not dependent on a tenant or an appraisal.', strength: 8, caution: 'A payer who stops paying stops the premium too. Do not size a policy to income with a single counterparty behind it.' },
      { with: 'equity-share', how: 'The death benefit can settle the equity-share obligation, which converts a balloon into a funded liability.', strength: 6, caution: 'Only if the policy is old enough by the settlement date. Two ten-year clocks started at different times do not line up.' },
    ],
    valueRating: 7,
    valueWhy:
      'The collateral-keeps-compounding property is genuine and nothing else here offers it. The cost is a decade of illiquidity, front-loaded expenses, and a lapse failure mode that is severe and under-disclosed. Excellent for the household it suits; the suitability window is narrow.',
    frequencyRating: 2,
    frequencyWhy:
      'Most households should not run this. It requires a sustained surplus over ten to fifteen years, which most do not have, and it is oversold to many who do not. A 2 is not a criticism of the mechanism — it is an accurate statement about how many people it fits.',
    decidingQuestion: 'Can you pay this premium in your worst year for the next fifteen years without resenting it?',
    accent: { base: '#2f6f4f', deep: '#123524', glow: '#7fd4a3' },
  },

  /* ═══════════════════════ VELOCITY ═══════════════════════ */
  {
    id: 'velocity-heloc',
    plainly:
      'Instead of leaving your paycheque in a checking account earning nothing while a loan balance charges you interest, you put the paycheque straight against the loan and draw expenses back out as they come up. The balance is lower on more days of the month, so you pay less interest. It is arithmetic, not a product, and you can check it against your own bank statement before you do anything.',
    mechanics: [
      { step: 'Open a line of credit — a HELOC, a first-lien HELOC, or a personal line.', whatMoves: 'Nothing yet. This step is underwriting, and it is the step that fails for the households that would benefit most.', governedBy: 'The line agreement. Read the freeze and reduction clauses: lenders can and do cut lines, and they do it when property values fall, which is when you need it.' },
      { step: 'Direct income into the line rather than into checking.', whatMoves: 'Your whole paycheque, against the balance, on the day it arrives.', governedBy: 'Nothing. This is a payment instruction, which is why the mechanism needs no product.' },
      { step: 'Draw expenses back out as they occur through the month.', whatMoves: 'Money back out, a day or a week later than it went in. The gap between those two dates is the entire saving.', governedBy: 'The line\'s draw terms. Some lines charge per draw, which quietly eats the benefit — check this before starting.' },
      { step: 'The interest is computed on the average daily balance.', whatMoves: 'Interest, downward. You were previously paying on a static balance while cash sat idle; now you pay on a balance that drops every payday.', governedBy: 'The line\'s interest calculation method. Average daily balance is the one that makes this work; confirm it in writing.' },
      { step: 'Direct the saving to principal rather than absorbing it.', whatMoves: 'The saving, into the balance. Skip this step and the mechanism produces a slightly cheaper month rather than a shorter loan.', governedBy: 'Nothing but discipline, which is the actual binding constraint.' },
    ],
    providers: [
      { name: 'CMG Financial (All In One Loan)', homepage: 'https://www.cmgfi.com', what: 'First-lien home equity line that functions as a combined mortgage and sweep account — the product this mechanism describes, sold as one thing.', askFirst: 'Ask for the rate index and margin, and model it at three points above today\'s rate, because it floats for thirty years.' },
      { name: 'Figure', homepage: 'https://www.figure.com', what: 'Digital HELOC originator with a fast, largely automated process.', askFirst: 'Ask for the draw-period terms and any per-draw fee, which decide whether this mechanism works at all.' },
      { name: 'Aven', homepage: 'https://www.aven.com', what: 'Home-equity-backed credit card, which removes the friction of drawing funds back out.', askFirst: 'Ask what happens to the line if the home\'s value falls, and get the answer in writing.' },
      { name: 'Third Federal Savings & Loan', homepage: 'https://www.thirdfederal.com', what: 'Thrift with a long-standing home equity line programme.', askFirst: 'Ask whether the rate is fixed for any period and what it converts to afterwards.' },
      { name: 'PenFed Credit Union', homepage: 'https://www.penfed.org', what: 'Credit union home equity lines, open to members.', askFirst: 'Ask about membership requirements and the interest calculation method.' },
      { name: 'Bethpage Federal Credit Union', homepage: 'https://www.bethpagefcu.com', what: 'Credit union home equity lines with fixed-rate conversion options.', askFirst: 'Ask whether converting part of the balance to fixed disables the sweep behaviour this mechanism needs.' },
      { name: 'Spring EQ', homepage: 'https://www.springeq.com', what: 'Home equity lender, including second-lien products.', askFirst: 'Ask for the full fee schedule, including annual and inactivity fees.' },
      { name: 'Rocket Mortgage', homepage: 'https://www.rocketmortgage.com', what: 'Large originator offering home equity products alongside first mortgages.', askFirst: 'Ask whether the product is a line or a fixed loan — a fixed loan cannot run this mechanism.' },
    ],
    bestWhen: [
      'You already have a genuine monthly surplus sitting in checking doing nothing. This mechanism redirects a surplus; it cannot create one.',
      'Your income is regular and predictable, because the saving is a function of how early in the month the money lands.',
      'You have equity and a credit file good enough to get a line on decent terms.',
      'You want a result you can verify from your own statements rather than from an illustration.',
      'You are disciplined about not treating the available line as available money, which is the failure mode that matters.',
    ],
    worstWhen: [
      'You spend everything you earn. The engine has nothing to work with and you have added a line of credit and a monthly ritual for no gain.',
      'Your income is lumpy or seasonal — commission, contract, tips. The arithmetic depends on timing you do not control.',
      'You have a history of running balances up. This puts a large revolving line in front of that history.',
      'The line has per-draw fees or is not computed on average daily balance, which can erase the whole benefit.',
      'Somebody is selling you this as a way to "pay off your mortgage in five to seven years" without first showing you where the surplus comes from. That number is the surplus, not the mechanism.',
    ],
    interop: [
      { with: 'brrrr-dscr', how: 'Velocity builds and holds the down payment at a falling balance rather than a static one, so acquisition capital costs less while it waits.', strength: 8, caution: 'Do not let the line become the down payment itself. A frozen line mid-acquisition strands the deal.' },
      { with: 'policy-loan', how: 'The compression produces the surplus that funds the premium — this pairing solves the policy\'s hardest practical problem.', strength: 7, caution: 'They compete for the same dollars. The premium has the longer commitment and should be funded first.' },
      { with: 'seller-wrap', how: 'The surplus velocity builds becomes the reserve that covers the underlying mortgage in a month the payer misses.', strength: 6, caution: 'Build the reserve before carrying the paper, not after. The first year is when wraps fail.' },
      { with: 'equity-share', how: 'They do not combine. An equity-share agreement\'s no-further-encumbrance covenant blocks a line opened behind it.', strength: 1, caution: 'This is a hard ordering rule, not a preference. Open the line first or accept there will be no line.' },
    ],
    valueRating: 5,
    valueWhy:
      'Real, cheap, fast and verifiable — and modest. It saves the interest on idle cash, which for most households is meaningful but not transformative. It rates a 5 because the honest size of the effect is a 5, and it is routinely marketed as a 9.',
    frequencyRating: 6,
    frequencyWhy:
      'The most broadly applicable mechanism here. Any household with a line of credit and a surplus can run it this month, with no new asset and no ten-year commitment. The binding constraint is having a surplus at all, which is common enough to earn a 6.',
    decidingQuestion: 'How much cash sat in your checking account, on average, over the last three months?',
    accent: { base: '#1f5f8b', deep: '#0a2540', glow: '#6fc3ff' },
  },

  /* ═══════════════════════ BRRRR ═══════════════════════ */
  {
    id: 'brrrr-dscr',
    plainly:
      'Buy a property cheaply or in poor condition, renovate it so it appraises higher, put a tenant in, then refinance against the new value and pull your original money back out to do it again. The refinance is underwritten on the property\'s rent rather than on your income, which is why it works for people a bank would otherwise decline. The tenant pays the loan down.',
    mechanics: [
      { step: 'Acquire below market or in poor condition.', whatMoves: 'Your whole all-in cost — purchase, closing, and the renovation budget — out of reserve. All of it, not just a down payment. This is the step people model wrongly and it is why the arithmetic disappoints.', governedBy: 'Purchase contract. If the acquisition is financed with hard money, the clock on that loan starts here and it is short.' },
      { step: 'Renovate to raise the appraised value.', whatMoves: 'Money into the property, in the hope of coming back out as appraised value. The ratio of the second to the first is the renovation uplift, and it decides whether this mechanism makes or loses money.', governedBy: 'Nothing protects the uplift. An appraiser\'s opinion is the whole exit.' },
      { step: 'Place a tenant and establish rent.', whatMoves: 'A lease into existence. The rent number is now the thing the refinance will be underwritten on, which makes it the most important number in the deal.', governedBy: 'The lease. Most DSCR lenders want it signed and seasoned before they will count it.' },
      { step: 'Wait out the seasoning period.', whatMoves: 'Nothing. Typically six months of ownership before a lender will lend against current appraised value rather than your purchase price.', governedBy: 'Lender seasoning policy. It varies; confirm it before you buy, not after.' },
      { step: 'Refinance on a DSCR loan.', whatMoves: 'Roughly 75% of the after-repair value back to you as loan proceeds, and a new mortgage onto the property. Your capital comes back; the obligation stays.', governedBy: 'Debt service coverage ratio = rent ÷ PITIA. It must clear at the rate available on the day you close, not the rate you modelled. Run it half a point high.' },
      { step: 'The tenant retires the debt.', whatMoves: 'Rent in, debt service out, principal down every month. This is the only mechanism in this file where the obligation created pays itself off, and with someone else\'s money.', governedBy: 'The amortisation schedule — the most boring and most valuable document in the whole strategy.' },
      { step: 'Repeat with the returned capital.', whatMoves: 'The proceeds, into the next acquisition. The cycle continues only if the proceeds are at least the all-in cost, which requires an uplift near 1.34.', governedBy: 'Arithmetic. At 0.75 × 1.18 = 0.885, each turn returns less than it consumed and the cycle shrinks by 11.5% a turn.' },
    ],
    providers: [
      { name: 'Kiavi', homepage: 'https://www.kiavi.com', what: 'Bridge and DSCR rental loans for residential investors, at scale.', askFirst: 'Ask for their seasoning requirement and maximum cash-out LTV in writing before you buy anything.' },
      { name: 'Lima One Capital', homepage: 'https://www.limaone.com', what: 'Fix-and-flip, bridge and rental lending for investors.', askFirst: 'Ask whether the rehab draw schedule matches your contractor\'s payment schedule; a mismatch stalls projects.' },
      { name: 'Visio Lending', homepage: 'https://www.visiolending.com', what: 'DSCR specialist for long-term and short-term rental property, plus portfolio loans.', registryId: 'visio', askFirst: 'Ask which states they lend in and what their minimum DSCR is for your property type.' },
      { name: 'Ternus Lending', homepage: 'https://www.ternus.com', what: 'Long-term rental loans on 1–4 unit residential investment property, underwritten on DSCR.', registryId: 'ternus', askFirst: 'Ask for a written quote; the program page states terms but rates move weekly.' },
      { name: 'CoreVest Finance', homepage: 'https://www.corevestfinance.com', what: 'Single-family rental portfolio and bridge lending, typically at larger scale.', askFirst: 'Ask what portfolio size they start at — several of their programmes are not aimed at a first property.' },
      { name: 'Angel Oak Mortgage Solutions', homepage: 'https://angeloakms.com', what: 'Non-QM lender including DSCR investor products.', askFirst: 'Ask for the prepayment penalty structure; non-QM investor loans frequently carry one.' },
      { name: 'Easy Street Capital', homepage: 'https://www.easystreetcap.com', what: 'Private lender offering bridge and DSCR rental loans.', askFirst: 'Ask how they treat short-term rental income if that is your plan, since treatment varies widely.' },
      { name: 'New Silver', homepage: 'https://newsilver.com', what: 'Technology-led lender for fix-and-flip and rental investors.', askFirst: 'Ask how quickly they can close, and what documentation must exist before that clock starts.' },
      { name: 'Griffin Funding', homepage: 'https://griffinfunding.com', what: 'DSCR and non-QM lending for investment property.', askFirst: 'Ask for the minimum credit score and reserve requirement for cash-out.' },
      { name: 'Temple View Capital', homepage: 'https://www.templeviewcap.com', what: 'Private lender for residential investment, including bridge and rental.', askFirst: 'Ask whether they lend on properties in the condition yours will be in at acquisition.' },
    ],
    bestWhen: [
      'The renovation uplift in your market genuinely clears 1.34. Below that the cycle shrinks every turn — model your own number before you accept anyone\'s framework.',
      'You can underwrite a renovation accurately, which is a skill, not a spreadsheet.',
      'Rents in the area clear debt service with room — run the ratio half a point above your quoted rate.',
      'You want an obligation somebody else pays down. This is the only mechanism here that offers that.',
      'You have six months of patience for seasoning and a reserve that survives an overrun.',
    ],
    worstWhen: [
      'Your reserve is exactly the all-in cost. The first overrun ends the sequence, and there is always a first overrun.',
      'You are relying on appreciation rather than on forced value. Appreciation is not a plan; the renovation uplift is.',
      'Rates are moving against you mid-project. The refinance is priced on the day it closes, and a rise strands your capital in the property.',
      'You have never managed a renovation and are starting with a heavy one.',
      'You believe the cycle is infinite. It is not: at a 1.18 uplift it runs down, and the engine on /portal/infinite-banking will show you the year.',
    ],
    interop: [
      { with: 'velocity-heloc', how: 'The line holds acquisition capital at a falling balance and covers the gap between renovation spend and refinance proceeds.', strength: 8, caution: 'A lender can freeze the line mid-renovation. Never make the line the only route to completion.' },
      { with: 'policy-loan', how: 'The policy loan funds the down payment while the cash value keeps compounding, and rental cash flow repays the loan.', strength: 9, caution: 'Renovation overruns become unpaid policy loan interest, which compounds against a slower-growing cash value.' },
      { with: 'seller-wrap', how: 'Acquire on seller terms with little down, then let the DSCR refinance retire the seller note — the cheapest acquisition route available.', strength: 8, caution: 'If the refinance misses coverage, the seller\'s balloon arrives with nowhere to go.' },
      { with: 'equity-share', how: 'The equity share funds the first acquisition for a household with no documentable income. One-directional: it must come first.', strength: 6, caution: 'The equity share costs 9–16% effective. A cycle returning 0.885 a turn cannot carry that.' },
    ],
    valueRating: 8,
    valueWhy:
      'The only mechanism here whose obligation amortises, retired by a tenant. That single property makes it the one that stacks: ten of these is ten amortising loans, while ten equity shares is ten balloons. It loses points only for how completely it depends on an uplift most markets do not deliver.',
    frequencyRating: 3,
    frequencyWhy:
      'It requires capital, renovation competence and six months of patience. Plenty of households could do it once; few should do it repeatedly, and the marketing is aimed at people with none of the three.',
    decidingQuestion: 'In your market, what does a renovated comparable actually appraise at against your all-in cost — as a number you have checked, not estimated?',
    accent: { base: '#b4622a', deep: '#41190a', glow: '#ffb27a' },
  },

  /* ═══════════════════════ EQUITY SHARE ═══════════════════════ */
  {
    id: 'equity-share',
    plainly:
      'A company gives you cash today against a share of your home\'s value. There is no interest and no monthly payment, which is why it reaches households no lender will approve. In ten years, or when you sell, you settle — usually for a considerably larger share of what the home is then worth. It is not a loan, and that is both why it is available and why it is expensive.',
    mechanics: [
      { step: 'Appraisal and a risk adjustment to the starting value.', whatMoves: 'Nothing yet — but the value they book as the starting point is often below the appraisal. That discount is part of the cost and is rarely described as one.', governedBy: 'The agreement\'s starting-value definition. Find this clause and read it twice; it is where a large part of the price lives.' },
      { step: 'Cash advances to you — typically 10–30% of value.', whatMoves: 'Money in, and a recorded interest against your home. No payment schedule is created, which is the entire product.', governedBy: 'The agreement plus a recorded lien or deed restriction. It is not a mortgage, but it attaches to the property just as firmly.' },
      { step: 'No payments. Nothing amortises.', whatMoves: 'Nothing, for up to ten years. This is what makes it feel cheap, and it is the mechanism by which it becomes expensive: no payment means no principal reduction, ever.', governedBy: 'The agreement term, typically ten years.' },
      { step: 'Doors close behind you.', whatMoves: 'Your options. Most agreements prohibit further encumbrance without consent, so a line of credit behind one is usually refused, and the agreement settles on sale, so the property cannot be sold on terms without settling first.', governedBy: 'The no-further-encumbrance covenant and the settlement-on-sale clause. Both are in the paperwork; neither is in the marketing.' },
      { step: 'Settlement, at the earlier of sale or the term.', whatMoves: 'A lump sum out of you, sized to a share of the home\'s value at that date — not to what you received. On a $600,000 home with a $120,000 advance and a 1.80× multiplier, you settle about 36% of value; at 4% appreciation that is roughly $320,000 on $120,000 received, about 10.3% compounded.', governedBy: 'The settlement formula. Establish whether it is a share of TOTAL VALUE or a share of APPRECIATION — the difference is enormous and providers differ.' },
      { step: 'You cannot do it again on that house.', whatMoves: 'Nothing. One agreement per property. The next turn needs a new property and a new down payment, which is why this cannot be a cycle.', governedBy: 'Provider policy, near-universally.' },
    ],
    providers: [
      { name: 'Point', homepage: 'https://point.com', what: 'Home equity investment: cash for a share of the home\'s future value.', askFirst: 'Ask whether the settlement is a share of total value or of appreciation only, and get the worked example in writing.' },
      { name: 'Hometap', homepage: 'https://www.hometap.com', what: 'Home equity investment on primary residences, ten-year term.', registryId: 'hometap', askFirst: 'Ask for the starting-value discount applied to your appraisal, stated as a number.' },
      { name: 'Unison', homepage: 'https://www.unison.com', what: 'Home equity sharing agreements, long-established in this category.', registryId: 'unison', askFirst: 'Ask what happens if you want to renovate — improvements can affect the settlement calculation.' },
      { name: 'Unlock', homepage: 'https://www.unlock.com', what: 'Home equity agreements with partial buy-back options.', registryId: 'unlock', askFirst: 'Ask about partial settlement: being able to buy back in pieces is a materially different product.' },
      { name: 'Splitero', homepage: 'https://splitero.com', what: 'Home equity investments, concentrated in western US states.', askFirst: 'Ask which states they operate in and whether your property type qualifies.' },
      { name: 'Truehold', homepage: 'https://www.truehold.com', what: 'Sale-leaseback rather than equity share — you sell and remain as a tenant. A different instrument for a similar problem.', registryId: 'truehold', askFirst: 'Ask for the lease terms alongside the purchase price; the rent is where the economics actually sit.' },
    ],
    bestWhen: [
      'You have real equity and genuinely cannot service debt — self-employed, recently retired, commission-only, or already declined.',
      'You have a specific, near-certain use for the money that produces more than the effective cost.',
      'A liquidity event is already scheduled before the settlement date: a maturing note, a business sale, a planned downsize.',
      'You are using it once, as a tool, rather than as the first turn of something you have been told is a cycle.',
      'You have read the settlement formula and can state your own settlement figure at three different appreciation rates.',
    ],
    worstWhen: [
      'You expect strong appreciation. On a share-of-total-value agreement, the better your house does, the more this costs you.',
      'You have no plan for the settlement other than selling the house. That is not a plan; it is a deadline.',
      'You wanted a line of credit afterwards. The covenant closes that door and you will find out at the worst moment.',
      'You are being told this is how you build an infinite cycle. You cannot take a second agreement on the same house, most providers exclude investment property, and nothing amortises.',
      'The money is for living expenses. This is the most expensive way available to fund a shortfall that will still be there next year.',
    ],
    interop: [
      { with: 'brrrr-dscr', how: 'The only pairing that really justifies the cost: dead equity becomes an amortising asset a tenant pays down. Must come first.', strength: 6, caution: 'Only works if the renovation uplift genuinely exceeds the equity share\'s effective cost. Most do not.' },
      { with: 'seller-wrap', how: 'The advance funds a down payment on a seller-financed purchase, stretching further than it would on a bank deal. On a DIFFERENT property.', strength: 5, caution: 'The agreement settles on sale, so the encumbered property itself can never be the one you wrap.' },
      { with: 'policy-loan', how: 'The death benefit can settle the obligation, converting a balloon into a funded liability.', strength: 6, caution: 'Requires the policy to be old enough by the settlement date, which a policy started at the same time will not be.' },
      { with: 'velocity-heloc', how: 'They do not combine in this order. The no-further-encumbrance covenant blocks a line opened behind the agreement.', strength: 1, caution: 'Hard rule. Open the line first, or there will be no line.' },
    ],
    valueRating: 4,
    valueWhy:
      'Expensive, one-shot, and it closes doors behind it. It rates a 4 rather than a 2 because for a genuinely documentation-poor household with real equity it is sometimes the only instrument that exists, and being the only door is worth something. As a recurring engine it is a ten-year balloon ladder wearing a cycle\'s clothes.',
    frequencyRating: 2,
    frequencyWhy:
      'Most households should never use it, and most who are marketed it would be better served by a line of credit they have not yet applied for. A 2 reflects the narrow band of people for whom nothing else opens.',
    decidingQuestion: 'What is your settlement figure at 3%, 5% and 7% annual appreciation — and where is that money coming from?',
    accent: { base: '#8a4a7d', deep: '#2e1229', glow: '#e8a0da' },
  },

  /* ═══════════════════════ SELLER WRAP ═══════════════════════ */
  {
    id: 'seller-wrap',
    plainly:
      'The buyer and seller write the financing themselves, with no bank involved. On a wraparound, the seller keeps their existing mortgage in place and the buyer pays the seller on a new, larger note — the seller keeps the difference between the two rates. It is fast, flexible and available when nothing else is, and it almost always breaches the due-on-sale clause in the underlying mortgage.',
    mechanics: [
      { step: 'Buyer and seller agree terms directly.', whatMoves: 'Nothing yet, but everything is decided here: rate, amortisation, down payment, balloon date. There is no underwriter and no rate sheet, which is the freedom and the risk.', governedBy: 'The promissory note and the security instrument. These are the whole deal; have a real estate attorney draft them.' },
      { step: 'On a wrap, the underlying mortgage stays in place.', whatMoves: 'Title, usually to the buyer or into a trust. The underlying loan does not move and remains in the seller\'s name — the seller stays legally liable for a loan on a property they no longer own.', governedBy: 'The underlying mortgage\'s due-on-sale clause, which gives that lender the contractual right to call the loan in full on transfer. Historically rarely exercised; a lender holding a 3% note now has a reason it did not have before.' },
      { step: 'The buyer pays the seller; the seller pays the underlying lender.', whatMoves: 'Money through the seller, monthly. The spread between the two rates is the seller\'s yield and the reason wraps reappear whenever rates rise.', governedBy: 'Both notes at once. Use a third-party servicer so payments are documented and the underlying loan is paid whether or not the seller is organised.' },
      { step: 'The seller now holds a note rather than a property.', whatMoves: 'The asset class. Income without management, and an instalment-sale tax treatment that spreads the gain instead of landing it in one year.', governedBy: 'IRC §453 for instalment sale treatment. Confirm eligibility with a tax adviser before closing, not after.' },
      { step: 'Optionally, turn the note back into capital.', whatMoves: 'Capital in, via hypothecation — borrowing against the note — or a partial sale of some of the payments. The instrument survives; only some of its cash flow is sold.', governedBy: 'The note purchase or hypothecation agreement. Pricing depends heavily on seasoning: twelve months of documented payments is roughly the threshold at which a note becomes saleable at a sane discount.' },
      { step: 'The balloon arrives.', whatMoves: 'The remaining principal, whole, on a date set years earlier. Most seller notes carry one, typically three to seven years out.', governedBy: 'The note. This date arrives whether or not refinancing is available on it, which is the mechanism\'s central risk.' },
    ],
    providers: [
      { name: 'FCI Lender Services', homepage: 'https://www.trustfci.com', what: 'Third-party loan servicing for private and seller-carried notes, including wraps.', askFirst: 'Ask whether they will service a wrap specifically, and how they handle paying the underlying lender.' },
      { name: 'Madison Management Services', homepage: 'https://www.madisonmanagement.net', what: 'Servicing for private notes and seller financing.', askFirst: 'Ask what reporting the payer receives, since documented payment history is what makes the note saleable later.' },
      { name: 'Note Servicing Center', homepage: 'https://www.noteservicingcenter.com', what: 'Servicing for privately held real estate notes.', askFirst: 'Ask about their impound and tax/insurance monitoring — an unpaid property tax bill can unwind a wrap.' },
      { name: 'Del Toro Loan Servicing', homepage: 'https://www.deltoroloanservicing.com', what: 'Private money and seller-carry loan servicing.', askFirst: 'Ask how they handle default and what the cure process looks like before you need it.' },
      { name: 'Paperstac', homepage: 'https://paperstac.com', what: 'Marketplace for buying and selling mortgage notes, with the transaction handled on-platform.', askFirst: 'Ask what documentation a note needs to be listable — assemble it while you originate, not years later.' },
      { name: 'Amerinote Xchange', homepage: 'https://www.amerinotexchange.com', what: 'Buyer of performing seller-financed real estate notes.', askFirst: 'Ask for an indicative discount on a note with your seasoning and terms before you commit to carrying one.' },
      { name: 'Seascape Capital', homepage: 'https://seascapecapital.com', what: 'Note buyer, including partial purchases of payment streams.', askFirst: 'Ask about partial purchases specifically — selling some payments and keeping the rest is often better than selling the note.' },
    ],
    bestWhen: [
      'Rates are high enough that a seller\'s existing low-rate mortgage is worth more in place than paid off.',
      'The buyer can pay but cannot document — the classic and entirely legitimate wrap counterparty.',
      'The seller wants income without management and an instalment sale rather than a lump gain.',
      'Both sides have real legal representation. This is the mechanism where a cheap document costs the most.',
      'A third-party servicer is used, so payments are documented and the underlying loan is paid regardless.',
    ],
    worstWhen: [
      'The due-on-sale exposure has not been disclosed to and accepted by both sides in writing. This is not a technicality.',
      'The underlying lender has any reason to look — a missed payment, an insurance change of name, a recorded document they receive notice of.',
      'The buyer has no reserves. A wrap with a thin payer means the seller pays the underlying note out of pocket while foreclosing on their own buyer.',
      'The balloon has no identified refinance route. A date arriving with no plan is how these end badly.',
      'You are chaining several. Every link adds a due-on-sale exposure and a counterparty who has to keep paying.',
    ],
    interop: [
      { with: 'brrrr-dscr', how: 'Acquire on seller terms with little down, then let the DSCR refinance retire the seller note — which also extinguishes the due-on-sale exposure.', strength: 8, caution: 'If the refinance misses coverage, the balloon and the exposure both remain.' },
      { with: 'policy-loan', how: 'Note income is the steadiest premium source available: contractual, monthly, no tenant and no appraisal.', strength: 8, caution: 'Do not size a fifteen-year premium commitment to a single counterparty\'s payments.' },
      { with: 'velocity-heloc', how: 'The surplus velocity builds is the reserve that covers the underlying mortgage in a month the payer misses.', strength: 6, caution: 'Build the reserve before carrying the paper. The first year is when this fails.' },
      { with: 'equity-share', how: 'An advance on one property can fund the down payment on a seller-financed purchase of another.', strength: 5, caution: 'Never the encumbered property itself — the agreement settles on sale, which consumes the proceeds.' },
    ],
    valueRating: 6,
    valueWhy:
      'Genuinely flexible, genuinely fast, and it creates terms that exist nowhere else. Held down by a legal exposure on every wrap that most participants understate, a counterparty who must keep paying, and a balloon that arrives on schedule whether or not the market cooperates.',
    frequencyRating: 2,
    frequencyWhy:
      'Most households will never originate one, though rather more will encounter one as a buyer. It rises in high-rate environments and falls when institutional money is cheap, so a 2 is a long-run average rather than a constant.',
    decidingQuestion: 'If the underlying lender called the loan next month, what exactly would you do?',
    accent: { base: '#8a7320', deep: '#2f2606', glow: '#ffd96b' },
  },
];

export function dossier(id: MechanismId): Dossier | undefined {
  return DOSSIERS.find((d) => d.id === id);
}

/** Dossier plus the engine record it documents, which is what every page needs. */
export function mechanismWithDossier(id: MechanismId) {
  const mechanism = MECHANISMS.find((m) => m.id === id);
  const d = dossier(id);
  return mechanism && d ? { mechanism, dossier: d } : undefined;
}

/** Ranked by value, which is NOT the order they should be tried in. */
export function byValue(): Dossier[] {
  return [...DOSSIERS].sort((a, b) => b.valueRating - a.valueRating);
}

/** Ranked by how often a normal household actually needs them. Start here. */
export function byFrequency(): Dossier[] {
  return [...DOSSIERS].sort((a, b) => b.frequencyRating - a.frequencyRating);
}

export const PROVIDER_COUNT = DOSSIERS.reduce((n, d) => n + d.providers.length, 0);

export const PROVIDER_DISCLOSURE =
  'These lists name companies and link their own homepages. They carry no rates, no terms and no contact details, because those change weekly and a figure quoted from memory would be wrong by the time you read it. Where a company also appears in the verified lender directory, the link goes there and every field carries the source it was read from and the date. Inclusion is not endorsement, the lists are not exhaustive, and nothing here is a recommendation of a specific company.';

// ─── Sources the shell prints ────────────────────────────────────────────────

/**
 * The providers' own homepages, as named in each dossier, and the statutes the
 * mechanics name as governing a step. Built from DOSSIERS so the list moves
 * with them. Rates and terms are not carried here (see the header); the
 * dossiers' 1.34 and 1.18 uplift figures are cycleEngine's arithmetic, and its
 * sources are printed on that engine's page.
 */
export const MECHANISM_DOSSIERS_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = (() => {
  const seen = new Set<string>();
  const out: { label: string; url?: string; asOf?: string; note?: string }[] = [];
  for (const d of DOSSIERS) {
    const mech = MECHANISMS.find((m) => m.id === d.id)?.name ?? d.id;
    for (const p of d.providers) {
      if (seen.has(p.homepage)) continue;
      seen.add(p.homepage);
      out.push({ label: `${p.name} (${mech}): ${p.what}`, url: p.homepage });
    }
    for (const s of d.mechanics) {
      if (!s.governedBy || !/IRC|U\.S\.C|CFR|§/.test(s.governedBy) || seen.has(s.governedBy)) continue;
      seen.add(s.governedBy);
      out.push({ label: `${mech}, "${s.step}": ${s.governedBy}` });
    }
  }
  out.push({ label: 'Assumption: every valueRating, frequencyRating and interop strength (1 to 10) is the firm\'s own editorial judgment; no external source' });
  return out;
})();
