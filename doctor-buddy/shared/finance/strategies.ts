/**
 * Strategy pages.
 *
 * Each one is content plus a list of calculator ids. The detail page renders
 * every referenced calculator inline, so a strategy can never claim something
 * the suite cannot model — if the calculator is not there, neither is the claim.
 */
export interface StrategySection {
  heading: string;
  body: string[];
}

export interface Strategy {
  slug: string;
  kicker: string;
  title: string;
  summary: string;
  lede: string;
  sections: StrategySection[];
  /** Calculator ids rendered inline, in order. */
  calculators: string[];
  /** The uncomfortable part. Every strategy gets one. */
  caveats: string[];
}

export const STRATEGIES: Strategy[] = [
  {
    slug: 'tax-free-retirement',
    kicker: 'Income',
    title: 'Tax-Free Retirement',
    summary: 'Build an income stream that does not appear in provisional income, does not trigger IRMAA, and cannot be forced out at 73.',
    lede: 'Deferring tax is not the same as avoiding it. A pre-tax-only plan hands the rate-setting power to a future Congress and then forces the distributions anyway.',
    sections: [
      {
        heading: 'The three buckets, and why almost everyone is lopsided',
        body: [
          'Money is taxable, tax-deferred, or tax-free. Most high earners have spent twenty years filling the second bucket exclusively, because that is what a payroll deduction does by default.',
          'The consequence shows up at 73. Required minimum distributions arrive whether you need the income or not. They stack on top of Social Security, push a share of that benefit into taxation, and can cross a Medicare IRMAA cliff that costs thousands a year for two people.',
          'A balanced plan keeps enough in the third bucket to control the bracket — to fill the low brackets with taxable income and take the rest from sources the tax code does not count.',
        ],
      },
      {
        heading: 'What "does not count" actually means',
        body: [
          'Qualified Roth distributions and properly structured policy loans are excluded from provisional income, from MAGI, and from the IRMAA calculation. Municipal bond interest is not — it is specifically added back for the Social Security test.',
          'That exclusion is worth more than its face value. A dollar of tax-free income does not merely arrive untaxed; it declines to push any other dollar into a higher bracket.',
        ],
      },
      {
        heading: 'The sequence',
        body: [
          'Employer match first, without exception. HSA second, because it is the only triple-tax-advantaged account in the code. Then the backdoor and mega-backdoor Roth if the plan permits them.',
          'Roth conversions in the gap years between retirement and 73, sized to fill a bracket rather than to convert a balance.',
          'Only then does surplus income belong in a permanent contract — and only if a death benefit has a job to do.',
        ],
      },
    ],
    calculators: ['retirement-gap', 'roth-conversion', 'social-security-tax', 'irmaa', 'rmd-projector', 'tax-free-equivalent'],
    caveats: [
      'If you are in a low bracket now and expect a lower one later, deferral is the right answer and tax-free access is not worth paying for.',
      'Roth conversions raise this year\'s MAGI, which sets your IRMAA two years out. Convert without modelling that and the surcharge eats the benefit.',
    ],
  },
  {
    slug: 'mortgage-killer',
    kicker: 'Debt',
    title: 'Mortgage Killer',
    summary: 'Retire the mortgage decades early without stranding the capital in an illiquid house.',
    lede: 'Extra principal is a guaranteed return equal to the after-tax rate on the loan. That is a real return and it is often the right one — but it is paid in equity, which is the least accessible asset most families own.',
    sections: [
      {
        heading: 'The hurdle rate nobody states',
        body: [
          'Paying down a 6.5% mortgage earns you 6.5%, risk-free, guaranteed. If you itemize and deduct the interest, the real hurdle is the after-tax rate — around 4.4% at a 32% marginal rate.',
          'The comparison that matters is that number against what the same dollars earn elsewhere, adjusted for risk and for tax. Not against a headline equity return.',
        ],
      },
      {
        heading: 'Why equity is the wrong place to store the win',
        body: [
          'Home equity earns nothing. It does not compound, it is not liquid, and a lender will only release it on terms set by your circumstances at the moment you ask — which is usually the worst moment.',
          'Redundancy, illness and a business downturn are exactly when a bank declines a HELOC. The equity is real and it is unavailable.',
        ],
      },
      {
        heading: 'The structure',
        body: [
          'Route the extra payment into a liquid, floored vehicle instead. When the balance there exceeds the mortgage balance, retire the loan in one transaction — or do not, and keep the optionality.',
          'This takes longer than brute-force extra principal and it is not free. What it buys is the ability to change your mind, and access to the capital in the years you might actually need it.',
          'A recast is the underused tool here: a lump sum against principal, re-amortized at your existing rate, keeping the payoff date and lowering the payment for a few hundred dollars in fees.',
        ],
      },
    ],
    calculators: ['mortgage-killer', 'mortgage-recast-vs-refi', 'debt-payoff', 'emergency-fund'],
    caveats: [
      'This only works if the alternative vehicle genuinely outperforms the after-tax mortgage rate after its own costs. Model it at a rate you would defend, not a rate you would like.',
      'Nothing beats retiring high-interest consumer debt first. A 24% card is not a planning problem, it is an emergency.',
    ],
  },
  {
    slug: 'divorce-shield',
    kicker: 'Protection',
    title: 'Divorce Shield',
    summary: 'Quantify the exposure before it is contested, and secure the support obligation that dies with the payor.',
    lede: 'Roughly four in ten first marriages end in divorce, and it is the single largest uninsured financial event most families face. The planning window is open long before anyone is contemplating one.',
    sections: [
      {
        heading: 'Commingling is the controllable variable',
        body: [
          'Inherited and pre-marital property is generally separate — until it is mixed into a joint account, used for a joint purchase, or improved with marital funds. Then, in most states, its character is lost.',
          'Keeping separate property in its own titled account, with clean records, is the single cheapest protective act available. It costs nothing and it is almost never done.',
        ],
      },
      {
        heading: 'The obligation that is never insured',
        body: [
          'A support order is a stream of payments from a living person. If the payor dies, the stream stops. Most decrees require the obligation to be secured with life insurance and most people never buy it, or let it lapse once the decree is signed.',
          'The recipient is the party at risk and usually the one who should own the policy — an obligation secured by a policy the payor controls is not secured.',
        ],
      },
      {
        heading: 'Structures that work, and when',
        body: [
          'A prenuptial or postnuptial agreement is the direct instrument. It requires independent counsel on both sides and full disclosure, and it is contested on exactly those two points.',
          'Irrevocable trusts funded well before any marital difficulty can place assets outside the marital estate. Funded during or shortly before a proceeding, they invite a fraudulent transfer claim.',
          'Timing is the whole of it. Every one of these is a planning instrument, not a remedy.',
        ],
      },
    ],
    calculators: ['divorce-shield', 'life-insurance-need', 'alimony-tax'],
    caveats: [
      'Division rules are state-specific and a decree controls. Nothing modelled here is a legal opinion — this is for sizing the exposure, then taking it to counsel.',
      'Transfers made in contemplation of divorce can be unwound. Structures built after the fact tend to make things worse, not better.',
    ],
  },
  {
    slug: 'estate-legacy',
    kicker: 'Legacy',
    title: 'Estate & Legacy',
    summary: 'Pay the estate tax with dollars that were never taxed, and stop the bill repeating every generation.',
    lede: 'Federal estate tax is due nine months after death, in cash, at 40% above the exclusion. Illiquid estates are where families sell the business at a discount to pay it.',
    sections: [
      {
        heading: 'The sunset is the planning event',
        body: [
          'The elevated exclusion is scheduled to revert to roughly half its current level. An estate that is comfortably under today can be materially over afterwards, without growing at all.',
          'Planning to the lower number is the conservative posture and costs nothing if the exclusion holds.',
        ],
      },
      {
        heading: 'Liquidity, not avoidance',
        body: [
          'Most estate planning failures are liquidity failures. The value is real, the tax is real, and the assets are a building, a farm, or a closely held company that cannot be sold in nine months at a fair price.',
          'An irrevocable life insurance trust holding a death benefit outside the estate converts annual exclusion gifts into the exact sum required, arriving exactly when it is required, income and estate tax free.',
        ],
      },
      {
        heading: 'Two generations, not one',
        body: [
          'Transfer tax compounds in the wrong direction. Two 40% events leave roughly a third of the growth. A properly GST-exempt dynasty trust is taxed once, at funding, and then not again for the life of the trust.',
          'And hold appreciated assets until death. The step-up in basis is the most valuable feature of the code that costs nothing to use — gifting a low-basis asset during life throws it away.',
        ],
      },
    ],
    calculators: ['estate-tax', 'ilit', 'generational-transfer', 'step-up-basis'],
    caveats: [
      'An ILIT requires trust counsel and a trustee who is not you. Gifts need genuine Crummey notices, and a policy transferred into a trust within three years of death is pulled back under §2035.',
      'Irrevocable means irrevocable. These structures are hard to unwind and should be built slowly.',
    ],
  },
  {
    slug: 'business-owners',
    kicker: 'Business',
    title: 'Business Owners',
    summary: 'Value it properly, insure the people it depends on, fund the buy-sell, and shelter the profit while you still can.',
    lede: 'For most owners the business is 60-80% of net worth, uninsured against the death of the person who runs it, and governed by a buy-sell nobody has funded.',
    sections: [
      {
        heading: 'Know the number before someone else sets it',
        body: [
          'Three methods on the same financials produce a range, and a range is a negotiating position. A single multiple is an opinion.',
          'Customer concentration, owner dependence and unclean books take the multiple down before anyone argues about the number. All three are fixable with two years of notice and none are fixable in the month before a letter of intent.',
        ],
      },
      {
        heading: 'The buy-sell that is a contract to buy something you cannot afford',
        body: [
          'An unfunded buy-sell is the default state of most closely held businesses. The surviving owners are obligated to buy an interest they have no cash for, from a spouse who needs the money.',
          'Insurance funds it on day one for cents on the dollar. Cross-purchase gives the survivors a stepped-up basis in what they buy, which usually saves more in eventual capital gains than entity redemption saves in premiums.',
        ],
      },
      {
        heading: 'Sheltering the profit',
        body: [
          'An S-corp salary split saves payroll tax, and a salary set too low is the most commonly reclassified item in an exam. It also caps what a retirement plan can absorb.',
          'A cash balance plan is the largest deduction available to a profitable owner over 50, and capacity roughly doubles between 45 and 60. It commits you to funding it, which is why volatile profit is the main reason they get frozen.',
        ],
      },
    ],
    calculators: ['business-valuation', 'buy-sell', 'key-person', 'cash-balance-plan', 'business-owner-comp', 'qsbs'],
    caveats: [
      '§101(j) requires written notice and consent before a company-owned policy is issued. Miss it and the death benefit becomes taxable — an entirely avoidable, entirely unrecoverable mistake.',
      'QSBS qualification is a legal determination made years before the sale. Confirm it with counsel while it can still be fixed.',
    ],
  },
  {
    slug: 'physicians',
    kicker: 'Profession',
    title: 'Physicians & High Earners',
    summary: 'A late start, a large loan balance, a group disability policy that will not do the job, and no room left in a qualified plan.',
    lede: 'The financial shape of a medical career is distinctive: negative net worth until the mid-thirties, then a decade of compressed earnings that outruns every tax-advantaged account available.',
    sections: [
      {
        heading: 'The disability policy you think you have',
        body: [
          'Group long-term disability is typically 60% of income, capped at a monthly maximum, taxable when the employer pays the premium, rarely own-occupation, and gone when the job is.',
          'For a $400,000 earner that combination often replaces something closer to 35% of take-home. An individual own-occupation policy is portable and pays tax-free, because you paid the premium.',
        ],
      },
      {
        heading: 'The loan question is not a math question',
        body: [
          'PSLF requires 120 qualifying payments under qualifying employment. Leaving at payment 110 converts the remaining balance back into your problem.',
          'On a PSLF track, pre-tax contributions lower AGI, which lowers the payment, which increases the amount forgiven. Maximising deferrals is worth more than it looks.',
        ],
      },
      {
        heading: 'Where the surplus goes',
        body: [
          'Match, HSA, backdoor Roth, mega-backdoor if the plan permits it. For a practice owner, a cash balance plan on top of that.',
          'After all of it, a high earner in peak years still has surplus income with nowhere tax-advantaged left to go — and a permanent need for a death benefit while a family and a loan balance both exist. That is the narrow case where a properly funded permanent contract earns its place.',
        ],
      },
    ],
    calculators: ['disability-gap', 'student-loan', 'iul-vs-401k', 'cash-balance-plan', 'life-insurance-need'],
    caveats: [
      'Buy the disability policy during residency if you can. It is cheaper, and you are underwriting a body that has not yet been diagnosed with anything.',
      'A permanent policy is the last stop, not the first. If the match and the HSA are not maxed, this conversation is premature.',
    ],
  },
];

export const strategyBySlug = (slug: string): Strategy | undefined =>
  STRATEGIES.find(s => s.slug === slug);
