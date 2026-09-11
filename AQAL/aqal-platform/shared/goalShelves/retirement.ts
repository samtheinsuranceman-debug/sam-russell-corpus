// Goal shelf: RETIREMENT — extra money for a meaningful, active retirement (sections 8400–8499).
// Verification: every DOI below was resolved against the Crossref record
// (api.crossref.org) on 2026-09-11. See types.ts for the contract.
import { doi, type GoalShelfCluster } from "./types";

export const SECTIONS: Record<string, string> = {
  "8400": "How to Read This Shelf",
  "8401": "Automatic Enrollment & Escalation",
  "8402": "The Contribution Floor — Match, Credit & Simplicity",
  "8403": "Fees & Index Investing",
  "8404": "Asset Allocation, Glide Paths & Diversification",
  "8405": "Stock Picking & Trading",
  "8406": "Market Timing & Newsletters",
  "8407": "Savings Adequacy — Knowing Your Number",
  "8408": "Withdrawal Rates & Sequence Risk",
  "8409": "Annuities, Longevity & the Income Floor",
  "8410": "Social Security Claiming Age",
  "8411": "Roth vs Traditional — Tax Diversification",
  "8412": "Financial Advice — What It Is Worth",
  "8413": "Retirement, Cognition & Health",
  "8414": "Purpose & Meaning",
  "8415": "Volunteering & Social Ties",
  "8416": "The Transition — Routine, Activity & Adjustment",
  "8417": "Working Longer & Phased Retirement",
  "8418": "Housing Wealth & Late-Life Health Costs",
};

export const CLUSTERS: GoalShelfCluster[] = [
  {
    id: "gs-retirement-read-me-first",
    goal: "retirement", tier: "fundamental", section: "8400",
    title: "How to Read the Retirement Shelf",
    subtitle: "Two halves — money that lasts, and a life worth funding",
    evidenceTag: "Strong",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description:
      "Half of this shelf is the money: defaults, fees, allocation, withdrawal, claiming. The other half is what the money is for: cognition, purpose, activity, social ties and work on your terms. The recurring lesson of the retirement-savings literature is that inertia decides outcomes — what happens automatically happens — so every fundamental protocol here changes a default rather than asking for willpower. Nothing on this shelf is investment, tax or legal advice; each cluster describes what the studies tested.",
    action: "This month, pick the one fundamental money protocol you are not already doing and the one fundamental life protocol you are not already doing, and run both for 30 days before adding anything.",
    sources: [
      { cite: "Madrian, B. C., & Shea, D. F. (2001). The power of suggestion: Inertia in 401(k) participation and savings behavior. The Quarterly Journal of Economics, 116(4), 1149–1187.", note: "When one large employer switched to automatic enrollment, participation jumped and most new participants stayed at the default contribution rate and default fund — the founding demonstration that defaults, not intentions, drive retirement saving.", link: doi("10.1162/003355301753265543"), kind: "doi" },
      { cite: "Benartzi, S., & Thaler, R. H. (2007). Heuristics and biases in retirement savings behavior. Journal of Economic Perspectives, 21(3), 81–104.", note: "Review of the behavioral evidence on retirement saving — inertia, naive diversification, loss aversion and framing — and of the plan-design fixes (defaults, escalation) that this shelf turns into individual protocols.", link: doi("10.1257/jep.21.3.81"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-automate-and-escalate",
    goal: "retirement", tier: "fundamental", section: "8401",
    title: "Enroll Automatically and Commit to Escalate With Every Raise",
    subtitle: "Defaults decide participation; pre-committed increases decide the rate",
    evidenceTag: "Strong",
    impact: { magnitude: 5, latency: "weeks", durability: "lasting", effort: "low" },
    feeds: ["saving rate", "follow-through"],
    description:
      "Automatic enrollment sharply raises participation and most people stay at whatever default they are given; the Save More Tomorrow program showed that employees who pre-commit to raise contributions with each future pay increase end up saving far more; and Danish administrative data show that automatic contributions raise total saving while price subsidies mostly shift it between accounts. Forcing an active decision can also work. The honest boundary: a low default is sticky too, so the protocol is to set the default and the escalation yourself.",
    action: "This week, confirm you are enrolled, set your contribution to at least the full employer match, and turn on automatic annual escalation (or write a dated rule to raise it by one percentage point at each raise) so the next increase happens without a decision.",
    sources: [
      { cite: "Madrian, B. C., & Shea, D. F. (2001). The power of suggestion: Inertia in 401(k) participation and savings behavior. The Quarterly Journal of Economics, 116(4), 1149–1187.", note: "Automatic enrollment at a large firm dramatically increased 401(k) participation, and participants clustered at the default contribution rate and default investment — inertia cut both ways.", link: doi("10.1162/003355301753265543"), kind: "doi" },
      { cite: "Carroll, G. D., Choi, J. J., Laibson, D., Madrian, B. C., & Metrick, A. (2009). Optimal defaults and active decisions. Quarterly Journal of Economics, 124(4), 1639–1674.", note: "Requiring employees to make an active enrollment choice raised participation substantially relative to a standard opt-in regime — a model for deciding on purpose rather than drifting.", link: doi("10.1162/qjec.2009.124.4.1639"), kind: "doi" },
      { cite: "Chetty, R., Friedman, J. N., Leth-Petersen, S., Nielsen, T. H., & Olsen, T. (2014). Active vs. passive decisions and crowd-out in retirement savings accounts: Evidence from Denmark. The Quarterly Journal of Economics, 129(3), 1141–1219.", note: "Using Danish population data, employer automatic contributions raised total saving with little offset elsewhere, while tax subsidies mostly moved money between accounts — most people are passive savers for whom automatic contributions do the work.", link: doi("10.1093/qje/qju013"), kind: "doi" },
      { cite: "Thaler, R. H., & Benartzi, S. (2004). Save More Tomorrow: Using behavioral economics to increase employee saving. Journal of Political Economy, 112(S1), S164–S187.", note: "Employees offered a plan that raised their savings rate automatically with each future raise joined at high rates, stayed in, and increased their contribution rates severalfold over a few years.", link: doi("10.1086/380085"), kind: "doi" },
      { cite: "Choi, J. J. (2015). Contributions to defined contribution pension plans. Annual Review of Financial Economics, 7(1), 161–178.", note: "Review of what determines contributions to defined-contribution plans — defaults, matches, simplification and peer effects — and how large each lever is.", link: doi("10.1146/annurev-financial-111914-041834"), kind: "doi" },
      { cite: "Bernheim, B. D., Fradkin, A., & Popov, I. (2015). The welfare economics of default options in 401(k) plans. American Economic Review, 105(9), 2798–2837.", note: "A structural analysis of how defaults affect welfare: because opting out is costly and attention is limited, the default rate itself matters a great deal — the case for choosing your own rather than accepting the plan's.", link: doi("10.1257/aer.20130907"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-capture-match",
    goal: "retirement", tier: "fundamental", section: "8402",
    title: "Never Leave the Match or the Credit on the Table",
    subtitle: "Unclaimed employer matches and savings credits are the highest-return money most people ever skip",
    evidenceTag: "Strong",
    impact: { magnitude: 4, latency: "weeks", durability: "lasting", effort: "low" },
    feeds: ["saving rate", "financial literacy"],
    description:
      "Studies of plan participants over the age at which withdrawals are penalty-free found many contributing below the match threshold, forgoing an arbitrage-like employer contribution; a field experiment offering matches at tax time raised retirement contributions strongly when the match was large and simple; and simplifying the enrollment decision to a single check-box raised participation. Low financial literacy explains part of the gap. The protocol is mechanical: contribute at least to the full match and claim any saver's credit for which you qualify.",
    action: "Before your next payroll cycle, read your plan's match formula, set your contribution to the level that captures the entire match, and check whether your income qualifies you for the federal saver's credit when you file.",
    sources: [
      { cite: "Choi, J. J., Laibson, D., & Madrian, B. C. (2011). $100 bills on the sidewalk: Suboptimal investment in 401(k) plans. Review of Economics and Statistics, 93(3), 748–763.", note: "Many employees over 59½ — who could withdraw contributions without penalty — still contributed below the employer-match threshold, forgoing free money; a survey intervention explaining this barely changed behavior.", link: doi("10.1162/rest_a_00100"), kind: "doi" },
      { cite: "Duflo, E., Gale, W., Liebman, J., Orszag, P., & Saez, E. (2006). Saving incentives for low- and middle-income families: Evidence from a field experiment with H&R Block. Quarterly Journal of Economics, 121(4), 1311–1346.", note: "Randomized offer of matching contributions to IRAs at tax-preparation offices: a large, clearly presented match raised both take-up and contribution amounts far more than the existing, more complex tax credit.", link: doi("10.1162/qjec.121.4.1311"), kind: "doi" },
      { cite: "Beshears, J., Choi, J. J., Laibson, D., & Madrian, B. C. (2013). Simplification and saving. Journal of Economic Behavior & Organization, 95, 130–145.", note: "Reducing enrollment to a single pre-set option (a 'Quick Enrollment' check-box) raised 401(k) participation among new hires — complexity itself suppresses saving.", link: doi("10.1016/j.jebo.2012.03.007"), kind: "doi" },
      { cite: "Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. Journal of Economic Literature, 52(1), 5–44.", note: "Survey of the financial-literacy literature: those who can answer basic questions on compounding, inflation and diversification are much more likely to plan for retirement and accumulate wealth.", link: doi("10.1257/jel.52.1.5"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-low-cost-index",
    goal: "retirement", tier: "fundamental", section: "8403",
    title: "Hold Low-Cost, Broadly Diversified Index Funds",
    subtitle: "After fees, the average active fund trails; persistence in winners is mostly momentum and luck",
    evidenceTag: "Strong",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "low" },
    feeds: ["net returns", "simplicity"],
    description:
      "From Jensen's 1968 study forward, the evidence is that the aggregate of actively managed funds underperforms after costs; Fama and French found few funds with enough skill to cover their fees, and Carhart found little persistence beyond momentum and expenses. Sharpe's arithmetic explains why: before costs the average active dollar equals the market, so after costs it must trail. Investors nonetheless pay very different prices for identical index funds and do not respond to expense ratios the way they do to visible loads. Costs are the one input you control.",
    action: "This month, list every fund you hold with its expense ratio; move any broad-market holding costing more than a low-cost index equivalent into that equivalent, and set new contributions to go there by default.",
    sources: [
      { cite: "Fama, E. F., & French, K. R. (2010). Luck versus skill in the cross-section of mutual fund returns. The Journal of Finance, 65(5), 1915–1947.", note: "Bootstrap simulations against the cross-section of US equity mutual funds: after costs, few funds show enough skill to cover their expenses, and the aggregate portfolio of active funds underperforms.", link: doi("10.1111/j.1540-6261.2010.01598.x"), kind: "doi" },
      { cite: "Carhart, M. M. (1997). On persistence in mutual fund performance. The Journal of Finance, 52(1), 57–82.", note: "Persistence in fund returns is largely explained by momentum in the stocks held and by expenses and transaction costs, not by skilled managers — past winners are not a reliable buy signal.", link: doi("10.1111/j.1540-6261.1997.tb03808.x"), kind: "doi" },
      { cite: "Jensen, M. C. (1968). The performance of mutual funds in the period 1945–1964. The Journal of Finance, 23(2), 389.", note: "The original risk-adjusted evaluation of mutual funds: on average funds did not outperform a buy-and-hold market strategy, even before deducting management expenses.", link: doi("10.2307/2325404"), kind: "doi" },
      { cite: "Sharpe, W. F. (1991). The arithmetic of active management. Financial Analysts Journal, 47(1), 7–9.", note: "The accounting identity behind indexing: before costs the return on the average actively managed dollar equals the market, so after costs the average active dollar must underperform the average passive dollar.", link: doi("10.2469/faj.v47.n1.7"), kind: "doi" },
      { cite: "Barber, B. M., Odean, T., & Zheng, L. (2005). Out of sight, out of mind: The effects of expenses on mutual fund flows. The Journal of Business, 78(6), 2095–2120.", note: "Fund investors avoid salient front-end loads but are largely insensitive to ongoing operating expenses — the fees that compound quietly are the ones people ignore.", link: doi("10.1086/497042"), kind: "doi" },
      { cite: "Choi, J. J., Laibson, D., & Madrian, B. C. (2009). Why does the law of one price fail? An experiment on index mutual funds. The Review of Financial Studies, 23(4), 1405–1432.", note: "Even elite students and staff choosing among S&P 500 index funds that differed only in fees mostly failed to minimize fees, especially when given fund-return histories to anchor on.", link: doi("10.1093/rfs/hhp097"), kind: "doi" },
      { cite: "Gil-Bazo, J., & Ruiz-Verdú, P. (2009). The relation between price and performance in the mutual fund industry. The Journal of Finance, 64(5), 2153–2183.", note: "Funds with worse before-fee performance charged higher fees — the price-performance relation runs the wrong way, so paying more buys less.", link: doi("10.1111/j.1540-6261.2009.01497.x"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-glide-path",
    goal: "retirement", tier: "moderate", section: "8404",
    title: "Set an Age-Based Allocation and Stop Owning Your Employer's Stock",
    subtitle: "A glide path, real diversification and no concentration in the company that pays you",
    evidenceTag: "Strong",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
    feeds: ["risk management", "diversification"],
    description:
      "Life-cycle models with labor income imply a high equity share when young that declines toward retirement, and target-date funds that implement such glide paths have improved the portfolios of plan participants who use them. The documented mistakes are the other side of the coin: splitting money evenly across whatever funds a plan offers, holding large stakes of employer stock because its past returns looked good, and tilting toward local companies. The allocation itself is a personal decision; the studies describe what tends to go wrong without a rule.",
    action: "Pick one written allocation rule (a target-date fund or an age-based stock/bond split), rebalance to it once a year on a fixed date, and cap employer stock at a small share of your retirement assets by selling down over the next 12 months.",
    sources: [
      { cite: "Cocco, J. F., Gomes, F. J., & Maenhout, P. J. (2005). Consumption and portfolio choice over the life cycle. Review of Financial Studies, 18(2), 491–533.", note: "Solved a realistic life-cycle model with uncertain labor income: because human capital acts like a bond, the optimal equity share is high early and falls with age — the theoretical basis of the glide path.", link: doi("10.1093/rfs/hhi017"), kind: "doi" },
      { cite: "Gomes, F., & Michaelides, A. (2005). Optimal life-cycle asset allocation: Understanding the empirical evidence. The Journal of Finance, 60(2), 869–904.", note: "Shows that a life-cycle model with fixed participation costs and heterogeneous risk aversion can match observed patterns of stock-market participation and allocation across ages and wealth.", link: doi("10.1111/j.1540-6261.2005.00749.x"), kind: "doi" },
      { cite: "Mitchell, O. S., & Utkus, S. P. (2021). Target-date funds and portfolio choice in 401(k) plans. Journal of Pension Economics and Finance, 21(4), 519–536.", note: "Using recordkeeper data on plan participants, adoption of target-date funds — especially as a default — moved portfolios toward age-appropriate equity shares and reduced extreme allocations.", link: doi("10.1017/s1474747221000263"), kind: "doi" },
      { cite: "Benartzi, S., & Thaler, R. H. (2001). Naive diversification strategies in defined contribution saving plans. American Economic Review, 91(1), 79–98.", note: "Many participants follow a '1/n' heuristic, spreading contributions evenly across the funds offered, so their asset allocation is driven by the plan menu rather than by any risk preference.", link: doi("10.1257/aer.91.1.79"), kind: "doi" },
      { cite: "Benartzi, S. (2001). Excessive extrapolation and the allocation of 401(k) accounts to company stock. The Journal of Finance, 56(5), 1747–1764.", note: "Employees allocated more to company stock after it had performed well, extrapolating past returns, and did not see the risk of holding their retirement savings in the firm that also pays their salary.", link: doi("10.1111/0022-1082.00388"), kind: "doi" },
      { cite: "Poterba, J. M. (2003). Employer stock and 401(k) plans. American Economic Review, 93(2), 398–404.", note: "Quantifies the cost of undiversified employer-stock holdings in retirement plans: a concentrated position in a single company carries substantially more risk for the same expected return.", link: doi("10.1257/000282803321947416"), kind: "doi" },
      { cite: "Coval, J. D., & Moskowitz, T. J. (1999). Home bias at home: Local equity preference in domestic portfolios. The Journal of Finance, 54(6), 2045–2073.", note: "Even within the United States, investors overweight companies headquartered near them — the familiarity bias that keeps portfolios less diversified than they look.", link: doi("10.1111/0022-1082.00181"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-stock-picking-myth",
    goal: "retirement", tier: "fundamental", section: "8405",
    title: "Myth: Picking Stocks and Trading Actively Will Grow the Nest Egg Faster",
    subtitle: "Individual investors who trade most earn least; the median stock underperforms Treasury bills",
    evidenceTag: "Strong",
    impact: { magnitude: 1, latency: "months", durability: "lasting", effort: "moderate" },
    callout:
      "Rated at the floor as advice the evidence does not support: brokerage-account studies show the households that trade most earn the lowest net returns, that overconfidence (measured by gender in one study) predicts turnover and underperformance, that the stocks investors sell go on to outperform the ones they buy, and that individual investors as a group lose to institutions. Because most individual stocks underperform Treasury bills over their lives, a concentrated portfolio is more likely to miss the few big winners than to catch them. Buy the whole market and leave it alone.",
    description:
      "Barber and Odean's account-level work established that turnover is hazardous to wealth; Odean showed investors hold losers and sell winners (the disposition effect) and that the stocks they buy subsequently underperform the ones they sell; Taiwanese market-wide data show individual investors' losses transferring to institutions; and Bessembinder showed that positive long-run stock-market returns come from a small minority of stocks. Dollar-weighted returns — what investors actually earned — trail the buy-and-hold returns quoted in the averages.",
    action: "Write down your retirement allocation rule, hold it in broad index funds, and set a calendar reminder to look at the accounts no more than quarterly; if you want to pick stocks, do it in a separate account capped at a small share you can afford to lose.",
    sources: [
      { cite: "Barber, B. M., & Odean, T. (2000). Trading is hazardous to your wealth: The common stock investment performance of individual investors. The Journal of Finance, 55(2), 773–806.", note: "In brokerage records for tens of thousands of households, the households that traded most earned the lowest net returns, with trading costs the main reason — the core evidence against active individual trading.", link: doi("10.1111/0022-1082.00226"), kind: "doi" },
      { cite: "Barber, B. M., & Odean, T. (2001). Boys will be boys: Gender, overconfidence, and common stock investment. The Quarterly Journal of Economics, 116(1), 261–292.", note: "Men traded more than women and earned lower net returns as a result, consistent with overconfidence driving excess trading.", link: doi("10.1162/003355301556400"), kind: "doi" },
      { cite: "Odean, T. (1999). Do investors trade too much? American Economic Review, 89(5), 1279–1298.", note: "The stocks individual investors bought went on to underperform the stocks they sold, even ignoring transaction costs — trading not only cost money, it moved money in the wrong direction.", link: doi("10.1257/aer.89.5.1279"), kind: "doi" },
      { cite: "Odean, T. (1998). Are investors reluctant to realize their losses? The Journal of Finance, 53(5), 1775–1798.", note: "Investors sold winning positions far more readily than losing ones (the disposition effect), and the winners they sold subsequently outperformed the losers they kept.", link: doi("10.1111/0022-1082.00072"), kind: "doi" },
      { cite: "Barber, B. M., Lee, Y.-T., Liu, Y.-J., & Odean, T. (2008). Just how much do individual investors lose by trading? Review of Financial Studies, 22(2), 609–632.", note: "Using complete trading records for the Taiwan Stock Exchange, individual investors' aggregate trading losses were large and were matched by gains to institutions.", link: doi("10.1093/rfs/hhn046"), kind: "doi" },
      { cite: "Bessembinder, H. (2018). Do stocks outperform Treasury bills? Journal of Financial Economics, 129(3), 440–457.", note: "Most individual US common stocks over their lifetimes delivered buy-and-hold returns below one-month Treasury bills; the market's positive premium came from a small fraction of stocks — the reason diversification, not selection, captures it.", link: doi("10.1016/j.jfineco.2018.06.004"), kind: "doi" },
      { cite: "Dichev, I. D. (2007). What are stock investors' actual historical returns? Evidence from dollar-weighted returns. American Economic Review, 97(1), 386–401.", note: "Dollar-weighted returns, which account for when investors actually put money in and took it out, were lower than buy-and-hold returns across major markets — investors' timing of flows cost them.", link: doi("10.1257/aer.97.1.386"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-market-timing-myth",
    goal: "retirement", tier: "moderate", section: "8406",
    title: "Myth: A Newsletter or Timing Service Can Tell You When to Get In and Out",
    subtitle: "Newsletter timing recommendations and fund-flow timing have no documented value",
    evidenceTag: "Strong",
    impact: { magnitude: 1, latency: "months", durability: "lasting", effort: "moderate" },
    callout:
      "Rated at the floor: studies of hundreds of investment newsletters found no evidence their asset-allocation calls could time the market, their stock picks did not beat benchmarks after costs, and fund investors' own timing of purchases and sales cost them relative to buy-and-hold. Checking the portfolio often makes it worse, because loss aversion over short horizons pushes people out of stocks at the wrong moments. Paying for timing signals is paying for noise.",
    description:
      "Graham and Harvey analyzed the equity-weight recommendations of newsletters and found no market-timing ability; Jaffe and Mahoney and Metrick examined newsletter stock selections and found no abnormal performance; Friesen and Sapp showed that mutual-fund investors' cash flows are timed badly enough to lower their realized returns. Benartzi and Thaler's myopic loss aversion explains why frequent evaluation makes equities feel riskier than they are over a retirement horizon.",
    action: "Cancel any paid timing or stock-tip subscription this month, put the money into your contribution, and move portfolio review to a fixed annual rebalancing date with quarterly glances at most.",
    sources: [
      { cite: "Graham, J. R., & Harvey, C. R. (1996). Market timing ability and volatility implied in investment newsletters' asset allocation recommendations. Journal of Financial Economics, 42(3), 397–421.", note: "Analyzed the equity-allocation recommendations of a large sample of investment newsletters and found no evidence that they could time the market; recommendations mostly followed past returns.", link: doi("10.1016/0304-405x(96)00878-1"), kind: "doi" },
      { cite: "Jaffe, J. F., & Mahoney, J. M. (1999). The performance of investment newsletters. Journal of Financial Economics, 53(2), 289–307.", note: "The stock recommendations of investment newsletters did not outperform appropriate benchmarks, and newsletters tended to recommend securities that had recently performed well.", link: doi("10.1016/s0304-405x(99)00023-9"), kind: "doi" },
      { cite: "Metrick, A. (1999). Performance evaluation with transactions data: The stock selection of investment newsletters. The Journal of Finance, 54(5), 1743–1775.", note: "Using detailed transaction-level data on newsletter recommendations, found no significant stock-selection ability on average and no persistence in the performance of individual newsletters.", link: doi("10.1111/0022-1082.00165"), kind: "doi" },
      { cite: "Friesen, G. C., & Sapp, T. R. A. (2007). Mutual fund flows and investor returns: An empirical examination of fund investor timing ability. Journal of Banking & Finance, 31(9), 2796–2816.", note: "Fund investors' timing of purchases and redemptions reduced their realized returns relative to buy-and-hold, with the worst timing among investors in funds with the strongest past performance.", link: doi("10.1016/j.jbankfin.2007.01.024"), kind: "doi" },
      { cite: "Benartzi, S., & Thaler, R. H. (1995). Myopic loss aversion and the equity premium puzzle. The Quarterly Journal of Economics, 110(1), 73–92.", note: "Combining loss aversion with frequent portfolio evaluation explains why investors demand such a high premium to hold stocks — and why looking less often makes a long-horizon equity allocation easier to keep.", link: doi("10.2307/2118511"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-adequacy-check",
    goal: "retirement", tier: "moderate", section: "8407",
    title: "Run Your Own Adequacy Check Once a Year",
    subtitle: "Most households are closer to on-track than the headlines say; the ones who are not usually know it",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    feeds: ["planning", "financial clarity"],
    description:
      "A life-cycle model matched to household data found that most older US households had accumulated at least as much wealth as an optimal plan implied, with the shortfalls concentrated among lower-wealth households; a companion review argued that the right target depends heavily on uncertain health costs and on what one wants retirement to look like. Retirees in fact draw down financial wealth slowly and hold much of their wealth in housing. An annual check — assets, expected income, a spending estimate — is how you find out which group you are in, and making the future self vivid helps people act on the answer.",
    action: "Each year on your birthday, total your retirement assets, estimate your expected Social Security and pension income, write a one-page retirement budget, and compare the gap to what your current contribution rate will produce; adjust the contribution the same day.",
    sources: [
      { cite: "Scholz, J. K., Seshadri, A., & Khitatrakun, S. (2006). Are Americans saving \"optimally\" for retirement? Journal of Political Economy, 114(4), 607–643.", note: "Solved an optimal life-cycle saving model household by household for a nationally representative sample and found most had wealth at or above their optimal target, with deficits concentrated among lower-lifetime-income households.", link: doi("10.1086/506335"), kind: "doi" },
      { cite: "Skinner, J. (2007). Are you sure you're saving enough for retirement? Journal of Economic Perspectives, 21(3), 59–80.", note: "Reviews the disagreement over whether Americans undersave and argues that uncertainty about health costs and about desired retirement consumption makes any single replacement-rate target unreliable — the case for a personal annual check.", link: doi("10.1257/jep.21.3.59"), kind: "doi" },
      { cite: "Hershfield, H. E., Goldstein, D. G., Sharpe, W. F., Fox, J., Yeykelis, L., Carstensen, L. L., & Bailenson, J. N. (2011). Increasing saving behavior through age-progressed renderings of the future self. Journal of Marketing Research, 48(SPL), S23–S37.", note: "People who interacted with age-progressed images of themselves allocated more to retirement in hypothetical and real choices — a technique for making the annual adequacy number feel personal.", link: doi("10.1509/jmkr.48.spl.s23"), kind: "doi" },
      { cite: "Poterba, J. M. (2014). Retirement security in an aging population. American Economic Review, 104(5), 1–30.", note: "Surveys the distribution of retirement resources across US households — Social Security, pensions, housing and financial assets — and shows how differently prepared households at different points of the wealth distribution are.", link: doi("10.1257/aer.104.5.1"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-withdrawal-rule",
    goal: "retirement", tier: "advanced", section: "8408",
    title: "Choose a Withdrawal Rule and Stress-Test It for Sequence Risk",
    subtitle: "The '4 percent' rule is a historical US result, not a law; low yields and early bad years change it",
    evidenceTag: "Moderate",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
    feeds: ["income security", "risk management"],
    description:
      "The popular 4 percent rule came from US historical simulations; later work shows the safe rate is sensitive to the starting level of bond yields and equity valuations, to fees, and to the order in which returns arrive (sequence risk). Analytical approaches give the probability that a given spending rate outlives a portfolio for a given horizon and allocation, and drawdown data show retirees in practice spend financial wealth slowly. A rule you have stress-tested and can adjust in bad years beats a rule you have only heard about.",
    action: "In the year before retirement, pick a starting withdrawal rate, model it against a poor first decade of returns using any free retirement calculator, and write down the specific trigger (for example a portfolio drop of a set percentage) at which you will cut spending by a set amount.",
    sources: [
      { cite: "Drew, M. E., & Walk, A. N. (2015). Just how safe are 'safe withdrawal rates' in retirement? Financial Planning Research Journal, 1(1), 22–32.", note: "Re-examines safe-withdrawal-rate research and shows how the 'safe' rate depends on the return history, allocation and horizon assumed, and how sequencing risk in early retirement drives failure.", link: doi("10.2478/fprj-2015-0002"), kind: "doi" },
      { cite: "Blanchett, D. M., Finke, M., & Pfau, W. D. (2013). Low bond yields and safe portfolio withdrawal rates. The Journal of Wealth Management, 16(2), 55–62.", note: "Simulations that start from the actual low bond yields of the period rather than long-run historical averages produced markedly lower sustainable withdrawal rates than the traditional 4 percent rule.", link: doi("10.3905/jwm.2013.16.2.055"), kind: "doi" },
      { cite: "Milevsky, M. A., & Robinson, C. (2005). A sustainable spending rate without simulation. Financial Analysts Journal, 61(6), 89–100.", note: "Derives an analytical formula for the probability that a retirement portfolio is exhausted before death given a spending rate, expected return, volatility and mortality — a way to see how each assumption moves the safe rate.", link: doi("10.2469/faj.v61.n6.2776"), kind: "doi" },
      { cite: "Poterba, J., Venti, S., & Wise, D. (2011). The composition and drawdown of wealth in retirement. Journal of Economic Perspectives, 25(4), 95–118.", note: "Documents that retirees hold much of their wealth in housing and draw down financial assets slowly, with large drawdowns concentrated around health shocks and the death of a spouse.", link: doi("10.1257/jep.25.4.95"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-annuity-floor",
    goal: "retirement", tier: "elite", section: "8409",
    title: "Build a Guaranteed Income Floor and Correct Your Longevity Estimate",
    subtitle: "Theory says annuitize more than people do; framing, pricing and survival pessimism explain the gap",
    evidenceTag: "Moderate",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "high" },
    callout:
      "Not financial advice. Annuity products differ enormously in cost, and the studies below measured specific markets and eras. What they establish is that lifetime-income products insure a real risk that most retirees underestimate, and that the decision depends on framing and on how long you expect to live.",
    feeds: ["income security", "longevity planning"],
    description:
      "Economic theory implies that people without strong bequest motives should annuitize much of their wealth, yet few do. Pricing studies found annuities offered reasonable value relative to their cost, especially for long-lived buyers; a framing experiment showed that describing annuities in terms of consumption rather than investment returns made them far more attractive; and survey work shows people — especially the young-old — underestimate their own survival, which depresses annuity demand. Delayed Social Security is the cheapest inflation-protected annuity most Americans can buy, which the next cluster covers.",
    action: "Two years before retiring, estimate your essential monthly expenses, compare them with your guaranteed income (Social Security, any pension), and get quotes for a simple lifetime-income product sized to cover the gap; look up an actuarial life table for your age before deciding.",
    sources: [
      { cite: "Mitchell, O. S., Poterba, J. M., Warshawsky, M. J., & Brown, J. R. (1999). New evidence on the money's worth of individual annuities. American Economic Review, 89(5), 1299–1318.", note: "Computed the expected present value of annuity payouts relative to premiums for US single-premium annuities and found the 'money's worth' reasonably high, particularly for annuitants with typical annuitant mortality.", link: doi("10.1257/aer.89.5.1299"), kind: "doi" },
      { cite: "Davidoff, T., Brown, J. R., & Diamond, P. A. (2005). Annuities and individual welfare. American Economic Review, 95(5), 1573–1590.", note: "Generalized the classic result that full annuitization is optimal: even with incomplete markets and imperfect products, a substantial degree of annuitization remains welfare-improving for people without bequest motives.", link: doi("10.1257/000282805775014281"), kind: "doi" },
      { cite: "Brown, J. R., Kling, J. R., Mullainathan, S., & Wrobel, M. V. (2008). Why don't people insure late-life consumption? A framing explanation of the under-annuitization puzzle. American Economic Review, 98(2), 304–309.", note: "Survey experiment: when annuities were described in a consumption frame (what you can spend each month for life) most respondents preferred them; in an investment frame (returns and risk of dying early) most did not.", link: doi("10.1257/aer.98.2.304"), kind: "doi" },
      { cite: "Benartzi, S., Previtero, A., & Thaler, R. H. (2011). Annuitization puzzles. Journal of Economic Perspectives, 25(4), 143–164.", note: "Reviews why so few retirees annuitize despite the theory, weighing rational explanations (bequests, pricing, Social Security) against behavioral ones (framing, loss aversion, mental accounting).", link: doi("10.1257/jep.25.4.143"), kind: "doi" },
      { cite: "Finkelstein, A., & Poterba, J. (2004). Adverse selection in insurance markets: Policyholder evidence from the U.K. annuity market. Journal of Political Economy, 112(1), 183–208.", note: "UK annuitant data show adverse selection on product features — longer-lived people chose contracts that pay more for longevity — which raises prices for everyone and shapes which products are good value.", link: doi("10.1086/379936"), kind: "doi" },
      { cite: "Hurd, M. D., & McGarry, K. (2002). The predictive validity of subjective probabilities of survival. The Economic Journal, 112(482), 966–985.", note: "Individuals' own survival probabilities in the Health and Retirement Study predicted actual mortality, but with systematic deviations from life tables — a reason to check your guess against actuarial data.", link: doi("10.1111/1468-0297.00065"), kind: "doi" },
      { cite: "O'Dea, C., & Sturrock, D. (2023). Survival pessimism and the demand for annuities. The Review of Economics and Statistics, 105(2), 442–457.", note: "People in their fifties and sixties underestimate their chances of surviving to older ages, and this pessimism substantially reduces the demand for annuities in a life-cycle model — correcting the estimate changes the decision.", link: doi("10.1162/rest_a_01048"), kind: "doi" },
      { cite: "Elder, T. E. (2012). The predictive validity of subjective mortality expectations: Evidence from the Health and Retirement Study. Demography, 50(2), 569–589.", note: "Subjective survival expectations track realized mortality but exhibit predictable biases by age and by focal responses (0, 50, 100 percent) — the errors a retiree should know about before pricing longevity.", link: doi("10.1007/s13524-012-0164-2"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-claiming-age",
    goal: "retirement", tier: "advanced", section: "8410",
    title: "Decide Your Social Security Claiming Age Deliberately",
    subtitle: "Delaying claiming buys inflation-protected lifetime income; the framing of 'full retirement age' pulls people early",
    evidenceTag: "Strong",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
    callout:
      "Program rules change and individual circumstances (health, spouse's record, other income) matter; this cluster describes what the studies measured, not what you should do.",
    feeds: ["income security", "longevity planning"],
    description:
      "Analyses of Social Security's actuarial adjustments find that delaying claiming raised expected lifetime benefits for many, especially primary earners in couples and in low-interest-rate environments, yet most people claim as early as allowed; the 'full retirement age' label acts as an anchor, and married men's early claiming raises the risk of widow poverty. Working a few more years has a larger effect on retirement income than most late-career saving increases.",
    action: "At least three years before you might claim, model claiming at 62, at full retirement age and at 70 for both spouses (the Social Security Administration's own calculators or any reputable tool), write down the break-even ages, and set a provisional claiming plan you revisit annually.",
    sources: [
      { cite: "Coile, C., Diamond, P., Gruber, J., & Jousten, A. (2002). Delays in claiming social security benefits. Journal of Public Economics, 84(3), 357–385.", note: "Modeled the value of delaying Social Security claiming and found that, for many workers — particularly married primary earners — delaying beyond 62 raised expected lifetime benefits, though most claimed soon after eligibility.", link: doi("10.1016/s0047-2727(01)00129-3"), kind: "doi" },
      { cite: "Shoven, J. B., & Slavov, S. N. (2013). Does it pay to delay social security? Journal of Pension Economics and Finance, 13(2), 121–144.", note: "Using recent benefit rules and interest rates, delaying claiming was actuarially advantageous for most individuals and especially for the higher earner in a couple, with the gains largest in a low-rate environment.", link: doi("10.1017/s1474747213000309"), kind: "doi" },
      { cite: "Behaghel, L., & Blau, D. M. (2012). Framing Social Security reform: Behavioral responses to changes in the full retirement age. American Economic Journal: Economic Policy, 4(4), 41–67.", note: "When the full retirement age rose, the spike in claiming moved with it even though the financial incentives barely changed — the label itself anchors the claiming decision.", link: doi("10.1257/pol.4.4.41"), kind: "doi" },
      { cite: "Sass, S. A., Sun, W., & Webb, A. (2013). Social Security claiming decision of married men and widow poverty. Economics Letters, 119(1), 20–23.", note: "Married men who claimed early left their surviving spouses with lower survivor benefits, and simulations show later claiming by husbands would reduce poverty among widows.", link: doi("10.1016/j.econlet.2013.01.007"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-tax-diversify",
    goal: "retirement", tier: "moderate", section: "8411",
    title: "Split Contributions Between Roth and Traditional Accounts",
    subtitle: "Front-loaded taxation did not reduce what people contributed; tax uncertainty argues for holding both",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "low" },
    callout:
      "Not tax advice: the right split depends on current and expected future tax rates, state taxes and program rules that change. The studies describe behavior and a diversification argument, not a recommendation.",
    feeds: ["tax flexibility", "planning"],
    description:
      "When employers added Roth 401(k) options, employees who chose them did not lower their contribution rates even though Roth dollars are after-tax — so total retirement consumption rose for those savers. A portfolio-theory analysis shows that because future tax rates are uncertain, holding both pre-tax and after-tax retirement assets diversifies that risk. Danish evidence that tax subsidies mostly reshuffle saving is a reminder that the account type matters less than the automatic contribution.",
    action: "If your plan offers both, direct new contributions in a fixed split (for example half Roth, half traditional) starting next payroll, and revisit the split only when your tax bracket changes.",
    sources: [
      { cite: "Beshears, J., Choi, J. J., Laibson, D., & Madrian, B. C. (2017). Does front-loading taxation increase savings? Evidence from Roth 401(k) introductions. Journal of Public Economics, 151, 84–95.", note: "After firms introduced Roth 401(k)s, total contribution rates did not fall for employees using the Roth option, implying that after-tax contributions raised their eventual retirement consumption — savers did not adjust for the tax difference.", link: doi("10.1016/j.jpubeco.2015.09.007"), kind: "doi" },
      { cite: "Brown, D. C., Cederburg, S., & O'Doherty, M. S. (2017). Tax uncertainty and retirement savings diversification. Journal of Financial Economics, 126(3), 689–712.", note: "Treats future tax rates as a risk and shows that allocating retirement savings across traditional and Roth accounts diversifies that risk, with the optimal mix depending on age and income.", link: doi("10.1016/j.jfineco.2017.10.001"), kind: "doi" },
      { cite: "Chetty, R., Friedman, J. N., Leth-Petersen, S., Nielsen, T. H., & Olsen, T. (2014). Active vs. passive decisions and crowd-out in retirement savings accounts: Evidence from Denmark. The Quarterly Journal of Economics, 129(3), 1141–1219.", note: "Tax subsidies for retirement accounts mostly shifted saving between accounts for the minority of active savers, while automatic contributions raised total saving — account type is second-order next to automation.", link: doi("10.1093/qje/qju013"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-advice-fiduciary",
    goal: "retirement", tier: "advanced", section: "8412",
    title: "Buy Advice by the Plan, Not by the Product",
    subtitle: "Commission-driven advisors underperform; planning-quality advice adds value through behavior, not stock selection",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "high" },
    feeds: ["decision quality", "discipline"],
    description:
      "Studies of advised accounts find that advisors compensated by product commissions steer clients into higher-cost, more actively traded portfolios that underperform; that advisors' own personal portfolios show the same expensive mistakes, suggesting misguided beliefs rather than pure conflict; and that free, unbiased advice offered to retail investors was rarely taken up and rarely followed. On the other side, planning-focused work quantifies value from withdrawal strategy, asset location and tax-aware sequencing rather than from picking funds, and advised investors trade less and diversify more. Pay for a written plan and behavioral discipline; do not pay for product selection.",
    action: "Before hiring anyone, ask in writing whether they are a fiduciary at all times, how they are paid, and what the all-in annual cost is; then engage them for a written retirement plan reviewed once a year rather than for managing fund selection.",
    sources: [
      { cite: "Hackethal, A., Haliassos, M., & Jappelli, T. (2012). Financial advisors: A case of babysitters? Journal of Banking & Finance, 36(2), 509–524.", note: "Brokerage data on advised and self-directed accounts: advised accounts earned lower net returns and higher trading volume; advisors were matched to wealthier, older, less experienced clients, but did not improve their performance.", link: doi("10.1016/j.jbankfin.2011.08.008"), kind: "doi" },
      { cite: "Foerster, S., Linnainmaa, J. T., Melzer, B. T., & Previtero, A. (2017). Retail financial advice: Does one size fit all? The Journal of Finance, 72(4), 1441–1482.", note: "Canadian advisor data: client portfolios mirrored the advisor's own preferences far more than the client's risk tolerance or age, and the fees charged were not matched by customization.", link: doi("10.1111/jofi.12514"), kind: "doi" },
      { cite: "Bhattacharya, U., Hackethal, A., Kaesler, S., Loos, B., & Meyer, S. (2012). Is unbiased financial advice to retail investors sufficient? Answers from a large field study. Review of Financial Studies, 25(4), 975–1032.", note: "A bank offered free, unbiased, individualized advice to a large sample of retail investors: few accepted, those who did were the ones who needed it least, and most who received it did not follow it.", link: doi("10.1093/rfs/hhr127"), kind: "doi" },
      { cite: "Linnainmaa, J. T., Melzer, B. T., & Previtero, A. (2020). The misguided beliefs of financial advisors. The Journal of Finance, 76(2), 587–621.", note: "Advisors' own personal portfolios showed the same costly behaviors they recommended to clients — frequent trading, return chasing, expensive active funds — suggesting sincere but mistaken beliefs rather than only conflicts of interest.", link: doi("10.1111/jofi.12995"), kind: "doi" },
      { cite: "Kramer, M. M. (2012). Financial advice and individual investor portfolio performance. Financial Management, 41(2), 395–428.", note: "Dutch brokerage data: advised portfolios were better diversified and less risky than self-directed ones, though risk-adjusted returns were not significantly different — the value showed up in structure, not alpha.", link: doi("10.1111/j.1755-053x.2012.01185.x"), kind: "doi" },
      { cite: "Blanchett, D., & Kaplan, P. (2013). Alpha, beta, and now… gamma. The Journal of Retirement, 1(2), 29–45.", note: "Quantifies the value of financial-planning decisions — asset location, withdrawal sequencing, annuity allocation, dynamic withdrawal — for a retiree, as distinct from investment selection.", link: doi("10.3905/jor.2013.1.2.029"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-keep-mind-working",
    goal: "retirement", tier: "fundamental", section: "8413",
    title: "Keep the Mind at Work — Schedule Cognitive Demand After You Stop",
    subtitle: "Retirement is followed by faster cognitive decline in several large datasets; the mechanism is use",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "moderate" },
    feeds: ["cognition", "engagement"],
    description:
      "Cross-country comparisons and panel studies that use pension eligibility ages to identify the effect find that retirement is followed by declines in memory and cognitive test scores, with the effect concentrated some years after leaving work and among those whose jobs were cognitively demanding. Not every study agrees on size, and the effect appears to run through reduced mental engagement rather than retirement itself. The protocol replaces the cognitive demand of work with scheduled, effortful activity.",
    action: "From the first month of retirement, put three effortful sessions a week on the calendar — learning a new skill, a language, a demanding volunteer role or part-time work — and treat them as appointments, not hobbies to fit in.",
    sources: [
      { cite: "Rohwedder, S., & Willis, R. J. (2010). Mental retirement. Journal of Economic Perspectives, 24(1), 119–138.", note: "Across the United States, England and Europe, countries where people retire earlier show lower memory scores at ages 60–64; using pension eligibility to isolate the effect, the authors argue retirement causes cognitive decline through disuse.", link: doi("10.1257/jep.24.1.119"), kind: "doi" },
      { cite: "Bonsang, E., Adam, S., & Perelman, S. (2012). Does retirement affect cognitive functioning? Journal of Health Economics, 31(3), 490–501.", note: "US panel data with eligibility ages as instruments: retirement had a negative effect on cognitive functioning that appeared with a lag rather than immediately.", link: doi("10.1016/j.jhealeco.2012.03.005"), kind: "doi" },
      { cite: "Mazzonna, F., & Peracchi, F. (2012). Ageing, cognitive abilities and retirement. European Economic Review, 56(4), 691–710.", note: "European panel data: retirement accelerated the age-related decline in cognitive abilities, and the effect varied with the cognitive demands of the job people left.", link: doi("10.1016/j.euroecorev.2012.03.004"), kind: "doi" },
      { cite: "Celidoni, M., Dal Bianco, C., & Weber, G. (2017). Retirement and cognitive decline. A longitudinal analysis using SHARE data. Journal of Health Economics, 56, 113–125.", note: "Longitudinal European data: retirement was associated with cognitive decline several years after the transition, more strongly for people who retired at the eligibility age than for those who left later.", link: doi("10.1016/j.jhealeco.2017.09.003"), kind: "doi" },
      { cite: "Coe, N. B., von Gaudecker, H.-M., Lindeboom, M., & Maurer, J. (2011). The effect of retirement on cognitive functioning. Health Economics, 21(8), 913–927.", note: "Using early-retirement-window offers as an instrument in US data, found no significant negative effect of retirement on cognition for blue-collar workers — the honest counterpoint that the effect is not universal.", link: doi("10.1002/hec.1771"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-health-transition",
    goal: "retirement", tier: "moderate", section: "8413",
    title: "Plan the Health Side of Retirement — the Effect Depends on Why and How You Leave",
    subtitle: "Voluntary, planned retirement tends to improve health; forced early retirement from some jobs does not",
    evidenceTag: "Mixed",
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "moderate" },
    feeds: ["physical health", "mental health"],
    description:
      "The causal literature disagrees in sign because it studies different retirements: European eligibility-age studies find improvements in self-reported health and reductions in depression, US data find worse outcomes for some retirees, a Dutch early-retirement offer reduced mortality, and Social Security eligibility at 62 in the US was associated with higher mortality among men, plausibly through lost work structure and activity. Mechanisms studied include sleep, physical activity and relief from job strain. The practical implication is to design the transition rather than let it happen.",
    action: "In the year before you retire, write a one-page plan covering how you will replace three things work provided — physical activity, daily structure and regular social contact — and start each replacement before your last day.",
    sources: [
      { cite: "Coe, N. B., & Zamarro, G. (2011). Retirement effects on health in Europe. Journal of Health Economics, 30(1), 77–86.", note: "Using statutory retirement ages across European countries as instruments, retirement led to improvements in self-reported general health — a health-preserving effect.", link: doi("10.1016/j.jhealeco.2010.11.002"), kind: "doi" },
      { cite: "Eibich, P. (2015). Understanding the effect of retirement on health: Mechanisms and heterogeneity. Journal of Health Economics, 43, 1–12.", note: "German panel data with a regression-discontinuity design: retirement improved self-rated health and mental health, with relief from work strain, more sleep and more physical activity as mechanisms.", link: doi("10.1016/j.jhealeco.2015.05.001"), kind: "doi" },
      { cite: "Insler, M. (2014). The health consequences of retirement. Journal of Human Resources, 49(1), 195–233.", note: "US Health and Retirement Study data with expectations-based instruments: retirement improved health, with declines in smoking and increases in exercise as channels.", link: doi("10.1353/jhr.2014.0000"), kind: "doi" },
      { cite: "Hessel, P. (2016). Does retirement (really) lead to worse health among European men and women across all educational levels? Social Science & Medicine, 151, 19–26.", note: "European data across education levels found retirement associated with better rather than worse self-rated health for most groups — addressing the concern that retirement harms health.", link: doi("10.1016/j.socscimed.2015.12.018"), kind: "doi" },
      { cite: "Bloemen, H., Hochguertel, S., & Zweerink, J. (2017). The causal effect of retirement on mortality: Evidence from targeted incentives to retire early. Health Economics, 26(12).", note: "A Dutch early-retirement offer to a specific cohort of civil servants reduced mortality over the following years — retirement can extend life when the exit is voluntary and financed.", link: doi("10.1002/hec.3493"), kind: "doi" },
      { cite: "Fitzpatrick, M. D., & Moore, T. J. (2018). The mortality effects of retirement: Evidence from Social Security eligibility at age 62. Journal of Public Economics, 157, 121–137.", note: "US mortality rose discretely at age 62 among men, coinciding with Social Security eligibility and the retirement it triggers — the caution that an unstructured early exit can carry a health cost.", link: doi("10.1016/j.jpubeco.2017.12.001"), kind: "doi" },
      { cite: "Rose, L. (2020). Retirement and health: Evidence from England. Journal of Health Economics, 73, 102352.", note: "English panel data around pension eligibility: retirement's health effects differed across outcomes and groups, reinforcing that how and why people retire shapes what happens to their health.", link: doi("10.1016/j.jhealeco.2020.102352"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-purpose-practice",
    goal: "retirement", tier: "fundamental", section: "8414",
    title: "Write Down a Purpose and Act on It Weekly",
    subtitle: "Purpose in life predicts lower mortality and more preventive care in large cohorts",
    evidenceTag: "Strong",
    impact: { magnitude: 3, latency: "weeks", durability: "lasting", effort: "low" },
    feeds: ["meaning", "motivation", "health behavior"],
    description:
      "In multiple longitudinal cohorts, people who score higher on purpose in life die later, have fewer cardiovascular events and use more preventive health care, with associations that hold across adulthood and after adjusting for health and wealth. These are observational findings, so purpose may partly reflect health rather than cause it. What retirement removes is the ready-made purpose of a job; the protocol replaces it with a written one and a weekly action.",
    action: "Write one sentence describing what you are for in this stage of life, put it where you see it daily, and schedule one concrete act toward it every week — a person served, a thing built, a skill passed on.",
    sources: [
      { cite: "Hill, P. L., & Turiano, N. A. (2014). Purpose in life as a predictor of mortality across adulthood. Psychological Science, 25(7), 1482–1486.", note: "In a national US sample followed for 14 years, higher purpose in life predicted lower mortality risk across the adult lifespan, not only in old age.", link: doi("10.1177/0956797614531799"), kind: "doi" },
      { cite: "Cohen, R., Bavishi, C., & Rozanski, A. (2016). Purpose in life and its relationship to all-cause mortality and cardiovascular events. Psychosomatic Medicine, 78(2), 122–133.", note: "Meta-analysis of prospective studies: a high sense of purpose was associated with reduced all-cause mortality and fewer cardiovascular events.", link: doi("10.1097/psy.0000000000000274"), kind: "doi" },
      { cite: "Alimujiang, A., Wiensch, A., Boss, J., Fleischer, N. L., Mondul, A. M., McLean, K., Mukherjee, B., & Pearce, C. L. (2019). Association between life purpose and mortality among US adults older than 50 years. JAMA Network Open.", note: "In the Health and Retirement Study, adults over 50 with the lowest life-purpose scores had markedly higher all-cause and cardiovascular mortality than those with the highest scores.", link: doi("10.1001/jamanetworkopen.2019.4270"), kind: "doi" },
      { cite: "Boyle, P. A., Barnes, L. L., Buchman, A. S., & Bennett, D. A. (2009). Purpose in life is associated with mortality among community-dwelling older persons. Psychosomatic Medicine, 71(5), 574–579.", note: "Among older adults in the Rush Memory and Aging Project, greater purpose in life was associated with a substantially reduced risk of death over the follow-up period.", link: doi("10.1097/psy.0b013e3181a5a7c0"), kind: "doi" },
      { cite: "Kim, E. S., Strecher, V. J., & Ryff, C. D. (2014). Purpose in life and use of preventive health care services. Proceedings of the National Academy of Sciences, 111(46), 16331–16336.", note: "Older adults with higher purpose in life were more likely to obtain preventive screenings and spent fewer nights in the hospital — one route by which purpose protects health.", link: doi("10.1073/pnas.1414826111"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-volunteer",
    goal: "retirement", tier: "moderate", section: "8415",
    title: "Take a Regular Volunteer Role and Protect Your Social Ties",
    subtitle: "Volunteering by older adults is associated with lower mortality and less disability; isolation is a mortality risk on par with smoking in meta-analysis",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "months", durability: "lasting", effort: "moderate" },
    feeds: ["social connection", "purpose", "physical function"],
    description:
      "Meta-analyses of older volunteers find lower mortality and better self-rated health and functioning, with the benefit strongest at moderate, regular hours; a large meta-analysis of social relationships found that stronger social ties predict survival with an effect comparable to well-known health risks. Selection is a concern — healthier people volunteer more — but longitudinal work controlling for prior health still finds less subsequent disability among volunteers. Regularity matters more than intensity.",
    action: "Within three months of retiring (or now, if you are retired), commit to one standing volunteer role of two to four hours a week with a fixed schedule and a team, and keep a standing weekly appointment with friends that does not depend on anyone else organizing it.",
    sources: [
      { cite: "Anderson, N. D., Damianakis, T., Kröger, E., Wagner, L. M., Dawson, D. R., Binns, M. A., Bernstein, S., Caspi, E., Cook, S. L., & The BRAVO Team. (2014). The benefits associated with volunteering among seniors: A critical review and recommendations for future research. Psychological Bulletin, 140(6), 1505–1533.", note: "Critical review of studies on volunteering in older adults: consistent associations with reduced depression, better self-reported health and functioning and lower mortality, with benefits plateauing at moderate hours.", link: doi("10.1037/a0037610"), kind: "doi" },
      { cite: "Okun, M. A., Yeung, E. W., & Brown, S. (2013). Volunteering by older adults and risk of mortality: A meta-analysis. Psychology and Aging, 28(2), 564–577.", note: "Meta-analysis of prospective studies: older adults who volunteered had a substantially lower risk of mortality than non-volunteers, with organizational volunteering showing the clearest association.", link: doi("10.1037/a0031519"), kind: "doi" },
      { cite: "Jenkinson, C. E., Dickens, A. P., Jones, K., Thompson-Coon, J., Taylor, R. S., Rogers, M., Bambra, C. L., Lang, I., & Richards, S. H. (2013). Is volunteering a public health intervention? A systematic review and meta-analysis of the health and survival of volunteers. BMC Public Health, 13(1), 773.", note: "Systematic review: observational cohorts show lower mortality and better well-being among volunteers, while the few experimental studies found smaller and less consistent effects — the honest evidence boundary.", link: doi("10.1186/1471-2458-13-773"), kind: "doi" },
      { cite: "Carr, D. C., Kail, B. L., & Rowe, J. W. (2017). The relation of volunteering and subsequent changes in physical disability in older adults. The Journals of Gerontology: Series B, 73(3), 511–521.", note: "Health and Retirement Study panel: older adults who volunteered regularly showed less subsequent increase in physical disability, with the strongest protection at moderate weekly hours.", link: doi("10.1093/geronb/gbx102"), kind: "doi" },
      { cite: "Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social relationships and mortality risk: A meta-analytic review. PLoS Medicine, 7(7), e1000316.", note: "Meta-analysis of 148 studies: people with stronger social relationships had a markedly higher likelihood of survival, an effect the authors compared to quitting smoking and larger than many other risk factors.", link: doi("10.1371/journal.pmed.1000316"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-transition-routine",
    goal: "retirement", tier: "moderate", section: "8416",
    title: "Design the First Year — Daily Movement, Weekly Structure, Honest Adjustment",
    subtitle: "Retirement adjustment follows several distinct paths; physical activity often rises then falls",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "moderate" },
    feeds: ["routine", "physical activity", "wellbeing"],
    description:
      "Longitudinal profiles of retirees show most maintain well-being, a minority decline, and some improve, with health, finances, marital quality and whether the exit was planned predicting the path; adjustment and satisfaction are related but distinct, and losing the work role hits hardest for those with few other roles. Reviews find leisure physical activity tends to rise at retirement (especially for higher-income retirees) while occupational activity is lost, so total movement can fall. The first year is when routines set.",
    action: "For the first 90 days of retirement, keep a fixed wake time, a daily 30-minute walk or equivalent, and a written weekly schedule with at least three standing commitments; review the schedule with your partner or a friend at the end of each month.",
    sources: [
      { cite: "Wang, M. (2007). Profiling retirees in the retirement transition and adjustment process: Examining the longitudinal change patterns of retirees' psychological well-being. Journal of Applied Psychology, 92(2), 455–474.", note: "Two national longitudinal datasets identified three patterns of well-being through retirement — maintaining, recovering and declining — predicted by health, finances, marital quality, retirement planning and bridge employment.", link: doi("10.1037/0021-9010.92.2.455"), kind: "doi" },
      { cite: "Pinquart, M., & Schindler, I. (2007). Changes of life satisfaction in the transition to retirement: A latent-class approach. Psychology and Aging, 22(3), 442–455.", note: "German panel data revealed distinct classes of life-satisfaction change around retirement; those with more resources and a planned exit fared best, while those leaving unemployment or poor health showed different trajectories.", link: doi("10.1037/0882-7974.22.3.442"), kind: "doi" },
      { cite: "van Solinge, H., & Henkens, K. (2008). Adjustment to and satisfaction with retirement: Two of a kind? Psychology and Aging, 23(2), 422–434.", note: "Dutch panel data: adjustment to retirement and satisfaction with retirement are related but distinct; involuntary retirement and loss of the work role hindered adjustment, while resources and control supported satisfaction.", link: doi("10.1037/0882-7974.23.2.422"), kind: "doi" },
      { cite: "Wang, M., & Shi, J. (2014). Psychological research on retirement. Annual Review of Psychology, 65(1), 209–233.", note: "Review of the psychology of retirement: planning, decision-making and adjustment, with resource-based models explaining who adjusts well — the framework behind a designed first year.", link: doi("10.1146/annurev-psych-010213-115131"), kind: "doi" },
      { cite: "Barnett, I., van Sluijs, E. M. F., & Ogilvie, D. (2012). Physical activity and transitioning to retirement: A systematic review. American Journal of Preventive Medicine, 43(3), 329–336.", note: "Systematic review of studies on the retirement transition: leisure-time physical activity generally increased after retirement, particularly among higher socioeconomic groups, while total activity could fall as work-related activity disappeared.", link: doi("10.1016/j.amepre.2012.05.026"), kind: "doi" },
      { cite: "Sjösten, N., Kivimäki, M., Singh-Manoux, A., Ferrie, J. E., Goldberg, M., Zins, M., Pentti, J., Westerlund, H., & Vahtera, J. (2012). Change in physical activity and weight in relation to retirement: The French GAZEL Cohort Study. BMJ Open, 2(1), e000522.", note: "In a large French occupational cohort, leisure physical activity increased around retirement, but the increase was not enough to prevent weight gain — movement has to be deliberate, not incidental.", link: doi("10.1136/bmjopen-2011-000522"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-work-longer",
    goal: "retirement", tier: "elite", section: "8417",
    title: "Work Longer on Your Terms — Bridge Jobs and Phased Retirement",
    subtitle: "A few extra working years beat decades of extra saving; bridge employment is linked to better health and satisfaction when chosen",
    evidenceTag: "Strong",
    impact: { magnitude: 5, latency: "months", durability: "lasting", effort: "high" },
    feeds: ["retirement income", "purpose", "health"],
    description:
      "Calculations of the trade-off show that delaying retirement by a few years raises sustainable retirement income more than substantially higher saving rates over a career, because it shortens the payout period, delays Social Security and adds contributions. Most Americans do not retire in one step — many take bridge jobs or return to work — and longitudinal studies link bridge employment to better physical and mental health and to higher life satisfaction, provided the retirement was voluntary and the work fits. Gradual exits with a sense of control are associated with greater happiness.",
    action: "Two to three years before your planned exit, negotiate one of three options with your employer or a new one — a reduced schedule, a consulting arrangement, or a bridge role in the same field — and set the date you will move to it in writing.",
    sources: [
      { cite: "Bronshtein, G., Scott, J., Shoven, J. B., & Slavov, S. N. (2019). The power of working longer. Journal of Pension Economics and Finance, 18(4), 623–644.", note: "Compares the effect of working a few months or years longer with the effect of saving more or paying lower fees: for a typical worker near retirement, additional working time raised the sustainable standard of living far more than plausible increases in saving.", link: doi("10.1017/s1474747219000088"), kind: "doi" },
      { cite: "Maestas, N. (2010). Back to work: Expectations and realizations of work after retirement. Journal of Human Resources, 45(3), 718–748.", note: "Health and Retirement Study data: a large share of retirees returned to work, and most of these 'unretirements' were anticipated in advance — a planned stage rather than a failure.", link: doi("10.1353/jhr.2010.0011"), kind: "doi" },
      { cite: "Cahill, K. E., Giandrea, M. D., & Quinn, J. F. (2006). Retirement patterns from career employment. The Gerontologist, 46(4), 514–523.", note: "Most older Americans leaving full-time career jobs moved to bridge jobs rather than directly out of the labor force, especially those in better health and with less pension wealth.", link: doi("10.1093/geront/46.4.514"), kind: "doi" },
      { cite: "Zhan, Y., Wang, M., Liu, S., & Shultz, K. S. (2009). Bridge employment and retirees' health: A longitudinal investigation. Journal of Occupational Health Psychology, 14(4), 374–389.", note: "Retirees who took bridge employment had fewer major diseases and functional limitations than those who fully retired, and career-related bridge work was also associated with better mental health.", link: doi("10.1037/a0015285"), kind: "doi" },
      { cite: "Calvo, E., Haverstick, K., & Sass, S. A. (2009). Gradual retirement, sense of control, and retirees' happiness. Research on Aging, 31(1), 112–135.", note: "Whether retirees perceived the transition as chosen mattered more for happiness than whether it was gradual or abrupt — control over the exit, not its shape, predicted well-being.", link: doi("10.1177/0164027508324704"), kind: "doi" },
      { cite: "Dingemans, E., & Henkens, K. (2013). Involuntary retirement, bridge employment, and satisfaction with life: A longitudinal investigation. Journal of Organizational Behavior, 35(4), 575–591.", note: "Dutch panel data: involuntary retirement lowered life satisfaction, and taking a bridge job afterward offset that loss for those who had been pushed out.", link: doi("10.1002/job.1914"), kind: "doi" },
    ],
  },

  {
    id: "gs-retirement-house-and-health-costs",
    goal: "retirement", tier: "elite", section: "8418",
    title: "Plan Housing Equity and Late-Life Health Costs as One Reserve",
    subtitle: "The elderly keep saving because medical costs are skewed and persistent; home equity is the reserve most never tap",
    evidenceTag: "Moderate",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "high" },
    callout:
      "Not financial or legal advice. Reverse mortgages, long-term-care insurance and home-equity decisions have large, product-specific costs and program rules that change; the studies describe the risks and how households behave, not which product to buy.",
    feeds: ["risk management", "housing security"],
    description:
      "Structural models fitted to the elderly find that the risk of large, persistent out-of-pocket medical and nursing-home costs late in life explains why retirees keep saving into their eighties; medical spending is highly skewed and rises steeply with age. Most retirees hold their largest asset as home equity and rarely draw on it, and analyses of reverse mortgages find welfare gains for some house-rich, cash-poor households despite their costs; home equity also acts as a substitute for long-term-care insurance. The elite protocol is to decide, in writing, how the house and the health-cost tail fit together.",
    action: "By your early sixties, write a one-page late-life plan: your estimate of a bad-case decade of medical and care costs, which of three tools would cover it (dedicated savings, long-term-care insurance, or home equity via downsizing or a reverse mortgage), and the age at which you will revisit it with a fiduciary planner.",
    sources: [
      { cite: "De Nardi, M., French, E., & Jones, J. B. (2010). Why do the elderly save? The role of medical expenses. Journal of Political Economy, 118(1), 39–75.", note: "A life-cycle model estimated on data for single retirees shows that the risk of large out-of-pocket medical expenses late in life, rising with age and income, explains why the elderly — especially the well-off — decumulate wealth so slowly.", link: doi("10.1086/651674"), kind: "doi" },
      { cite: "French, E., & Jones, J. B. (2004). On the distribution and dynamics of health care costs. Journal of Applied Econometrics, 19(6), 705–721.", note: "Estimated the distribution of out-of-pocket health costs among the elderly: the distribution is highly skewed, with a small share of households facing catastrophic and persistent expenses — the tail a plan must cover.", link: doi("10.1002/jae.790"), kind: "doi" },
      { cite: "De Nardi, M., French, E., Jones, J. B., & McCauley, J. (2016). Medical spending of the US elderly. Fiscal Studies, 37(3-4), 717–747.", note: "Documents how total and out-of-pocket medical spending of older Americans rises with age and is concentrated in the last years of life, and how much is covered by Medicare and Medicaid versus paid by households.", link: doi("10.1111/j.1475-5890.2016.12106"), kind: "doi" },
      { cite: "Venti, S. F., & Wise, D. A. (1991). Aging and the income value of housing wealth. Journal of Public Economics, 44(3), 371–397.", note: "Early evidence that older households rarely reduce housing equity to fund consumption, even when it is their largest asset — housing wealth as an untapped reserve.", link: doi("10.1016/0047-2727(91)90020-3"), kind: "doi" },
      { cite: "Nakajima, M., & Telyukova, I. A. (2017). Reverse mortgage loans: A quantitative analysis. The Journal of Finance, 72(2), 911–950.", note: "A structural model of retirees' housing and saving decisions finds that reverse mortgages deliver welfare gains for some house-rich, cash-poor households, with take-up limited by costs, bequest motives and the desire to keep the house as a buffer.", link: doi("10.1111/jofi.12489"), kind: "doi" },
      { cite: "Davidoff, T. (2010). Home equity commitment and long-term care insurance demand. Journal of Public Economics, 94(1-2), 44–49.", note: "Shows that home equity that is only spent when a person moves into care functions as a substitute for long-term-care insurance, which helps explain low insurance demand — and why the house belongs in the health-cost plan.", link: doi("10.1016/j.jpubeco.2009.09.006"), kind: "doi" },
    ],
  },
];
