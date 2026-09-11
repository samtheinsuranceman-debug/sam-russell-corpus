// Goal shelf: DEBT — get out of debt (sections 8200–8299).
// Verification: every DOI below was resolved against the Crossref record
// (api.crossref.org) on 2026-09-11. See types.ts for the contract.
import { doi, type GoalShelfCluster } from "./types";

export const SECTIONS: Record<string, string> = {
  "8200": "How to Read This Shelf",
  "8201": "Debt Order — Snowball, Avalanche & Small Wins",
  "8202": "Mental Accounting & the Working Budget",
  "8203": "Expense Tracking & Cash-Flow Visibility",
  "8204": "Payment Method — Cash, Card & the Pain of Paying",
  "8205": "The Minimum-Payment Anchor",
  "8206": "Windfalls & Tax Refunds",
  "8207": "Autopay, Reminders & Present Bias",
  "8208": "Financial Education — What Works, What Doesn't",
  "8209": "Debt, Stress, Health & Cognitive Bandwidth",
  "8210": "Credit Counseling & Debt-Management Plans",
  "8211": "Financial Coaching",
  "8212": "Financial Therapy — Money & Mental Health Together",
  "8213": "Payday & High-Cost Credit",
  "8214": "Medical Debt",
  "8215": "Student Loans & Repayment Plans",
  "8216": "Bankruptcy — the Fresh Start",
  "8217": "The Income Side — Asking for More & Extra Work",
  "8218": "Escalating Commitment — Pay More Tomorrow",
};

export const CLUSTERS: GoalShelfCluster[] = [
  {
    id: "gs-debt-read-me-first",
    goal: "debt", tier: "fundamental", section: "8200",
    title: "How to Read the Debt Shelf",
    subtitle: "Protocols, not lectures — pick one per tier each month",
    evidenceTag: "Strong",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    description:
      "Every protocol on this shelf is tagged fundamental, moderate, advanced or elite and carries a concrete action. The research on debt has one recurring lesson: knowing more changes very little on its own, while changing the structure of your money (what is automatic, what is visible, what is paid first) changes a lot. Start at the fundamental tier and let the others compound on it.",
    action: "This month, pick the one fundamental protocol on this shelf you are not already doing and run it for 30 days before adding anything else.",
    sources: [
      { cite: "Fernandes, D., Lynch, J. G., Jr., & Netemeyer, R. G. (2014). Financial literacy, financial education, and downstream financial behaviors. Management Science, 60(8), 1861–1883.", note: "Meta-analysis of 168 papers covering 201 studies: interventions to improve financial literacy explained only 0.1% of the variance in financial behaviors, and effects decayed with time — the reason this shelf is built from structural protocols rather than lessons.", link: doi("10.1287/mnsc.2013.1849"), kind: "doi" },
      { cite: "Gal, D., & McShane, B. B. (2012). Can small victories help win the war? Evidence from consumer debt management. Journal of Marketing Research, 49(4), 487–501.", note: "Using data from a debt-settlement firm, closing accounts predicted eventual debt elimination regardless of the dollar balance of the accounts closed — evidence that how you structure the goal matters as much as the arithmetic.", link: doi("10.1509/jmr.11.0272"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-snowball-order",
    goal: "debt", tier: "fundamental", section: "8201",
    title: "Choose a Payoff Order and Concentrate on One Account",
    subtitle: "Smallest-balance-first keeps you going; highest-rate-first costs less — the evidence on both",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    feeds: ["persistence", "goal focus", "sense of progress"],
    description:
      "Field and lab studies find that concentrating repayments into one account — especially the smallest — raises motivation and the fraction of debt repaid, because people read progress off the proportion of an account cleared. The honest boundary: paying small balances first while larger, higher-rate balances accrue interest is measurably more expensive; one Survey of Consumer Finances analysis put the extra interest at 1.8–4.3% for the average household. Pick concentration for the motivation and the highest-rate order when the rate gap is large.",
    action: "List every debt with balance and rate. This month choose one order (smallest balance first if you have stalled before; highest rate first if rates differ by a lot), pay minimums on the rest, and put every spare dollar on the one target account.",
    sources: [
      { cite: "Gal, D., & McShane, B. B. (2012). Can small victories help win the war? Evidence from consumer debt management. Journal of Marketing Research, 49(4), 487–501.", note: "In a debt-settlement firm's client data, the fraction of accounts closed predicted completing the program even controlling for the dollar fraction repaid; the dollar balance of closed accounts was not predictive once account closures were included.", link: doi("10.1509/jmr.11.0272"), kind: "doi" },
      { cite: "Kettle, K. L., Trudel, R., Blanchard, S. J., & Häubl, G. (2016). Repayment concentration and consumer motivation to get out of debt. Journal of Consumer Research, 43(3), 460–477.", note: "A field study of indebted consumers plus three experiments: concentrating monthly repayments into one account (rather than spreading them) increased motivation and subsequent repayment, most strongly when the concentration went to the smallest account.", link: doi("10.1093/jcr/ucw037"), kind: "doi" },
      { cite: "Brown, A. L., & Lahey, J. N. (2015). Small victories: Creating intrinsic motivation in task completion and debt repayment. Journal of Marketing Research, 52(6), 768–783.", note: "Lab test of the 'small victories' idea: people completed an unpleasant task faster when its parts were ordered smallest to largest, yet chose that ordering least often when given the choice — the motivational gain is real but must be deliberately set up.", link: doi("10.1509/jmr.14.0281"), kind: "doi" },
      { cite: "Amar, M., Ariely, D., Ayal, S., Cryder, C. E., & Rick, S. I. (2011). Winning the battle but losing the war: The psychology of debt management. Journal of Marketing Research, 48(SPL), S38–S50.", note: "Four incentive-compatible experiments documented 'debt account aversion': participants paid off small debts first even when larger debts carried higher rates; drawing attention to accrued interest helped them reduce total debt faster.", link: doi("10.1509/jmkr.48.spl.s38"), kind: "doi" },
      { cite: "Hamilton, B. (2022). Two steps forward, one step back? Quantifying the pecuniary costs of debt account aversion and the debt snowball. Southern Economic Journal, 89(3), 830–859.", note: "Using the 2016 Survey of Consumer Finances, following the debt snowball rather than minimizing interest cost the average household an additional 1.8–4.3% in interest, with larger penalties for lower-income households and those with more debts — the price of the motivation.", link: doi("10.1002/soej.12612"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-mental-budget",
    goal: "debt", tier: "fundamental", section: "8202",
    title: "Run a Written Budget with Named Accounts",
    subtitle: "Mental accounting is already happening — make it explicit so it works for you",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "low" },
    feeds: ["self-control", "spending awareness", "prioritization"],
    description:
      "People naturally sort money into mental accounts and treat those accounts as non-fungible; that is how a windfall gets spent while a credit card balance sits. Research shows mental budgets both restrain and distort spending, that consumers under financial constraint cope by prioritizing rather than cutting evenly, and that households who keep explicit mental budgets manage money with fewer problems. A written budget puts the categories on paper where you can see the trade-offs.",
    action: "Write a one-page budget this week with named categories and a line for debt payments. Review it once a week for 15 minutes and move money between categories on purpose rather than by default.",
    sources: [
      { cite: "Thaler, R. H. (1999). Mental accounting matters. Journal of Behavioral Decision Making, 12(3), 183–206.", note: "The foundational review of how people code, categorize and evaluate money in separate mental accounts, violating fungibility — the mechanism every budgeting protocol on this shelf either exploits or corrects.", link: doi("10.1002/(sici)1099-0771(199909)12:3<183::aid-bdm318>3.0.co;2-f"), kind: "doi" },
      { cite: "Heath, C., & Soll, J. B. (1996). Mental budgeting and consumer decisions. Journal of Consumer Research, 23(1), 40–52.", note: "Consumers set budgets for categories and then track expenses against them; because tracking is imperfect, they underconsume in some categories and overconsume in others — budgets shape spending even when they are only in the head.", link: doi("10.1086/209465"), kind: "doi" },
      { cite: "Fernbach, P. M., Kan, C., & Lynch, J. G., Jr. (2014). Squeezed: Coping with constraint through efficiency and prioritization. Journal of Consumer Research, 41(5), 1204–1227.", note: "Studies of how consumers cope with financial constraint: two strategies, efficiency planning and priority planning, with prioritizing tied to less stress — support for a budget built around ranked priorities rather than across-the-board cuts.", link: doi("10.1086/679118"), kind: "doi" },
      { cite: "Antonides, G., de Groot, I. M., & van Raaij, W. F. (2011). Mental budgeting and the management of household finance. Journal of Economic Psychology, 32(4), 546–555.", note: "Survey evidence on Dutch households linking the use of mental budgeting to the way household finances are managed and to fewer financial problems, especially among lower-income households.", link: doi("10.1016/j.joep.2011.04.001"), kind: "doi" },
      { cite: "Prelec, D., & Loewenstein, G. (1998). The red and the black: Mental accounting of savings and debt. Marketing Science, 17(1), 4–28.", note: "The 'double-entry' model of mental accounting: the pain of paying is coupled to consumption, which explains why debt-financed consumption feels different from cash and why prepaying and clearing balances feels good — useful for designing a budget you will keep.", link: doi("10.1287/mksc.17.1.4"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-expense-tracking",
    goal: "debt", tier: "fundamental", section: "8203",
    title: "See Every Dollar — Daily Expense Tracking and Cash-Flow Visibility",
    subtitle: "The exceptional expenses you don't plan for are where the budget breaks",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    feeds: ["attention", "spending awareness", "forecasting"],
    description:
      "Transaction-level data from personal-finance software shows that spending closely tracks income arrival even for people with liquid savings, and that access to spending information on a phone changes behavior. Consumers systematically underestimate 'exceptional' expenses because each one feels unique, and most budgets ignore them. Tracking every expense for a month and naming a category for irregular costs closes the gap between the budget on paper and the money that actually leaves.",
    action: "For the next 30 days log every purchase the day it happens (app, notebook or spreadsheet). At the end of week two add a monthly line for irregular expenses equal to what you have actually seen.",
    sources: [
      { cite: "Olafsson, A., & Pagel, M. (2018). The liquid hand-to-mouth: Evidence from personal finance management software. The Review of Financial Studies, 31(11), 4398–4446.", note: "Using transaction-level data from a personal-finance app, spending responds sharply to income arrival even among people holding liquid assets — the 'liquid hand-to-mouth' pattern that day-by-day tracking makes visible.", link: doi("10.1093/rfs/hhy055"), kind: "doi" },
      { cite: "Carlin, B., Olafsson, A., & Pagel, M. (2022). Mobile apps and financial decision making. Review of Finance, 27(3), 977–996.", note: "Studied what happened when a financial-aggregation service released a mobile app: users who gained easy access to their spending information changed their behavior, consistent with attention to one's own finances mattering.", link: doi("10.1093/rof/rfac040"), kind: "doi" },
      { cite: "Soll, J. B., Keeney, R. L., & Larrick, R. P. (2013). Consumer misunderstanding of credit card use, payments, and debt: Causes and solutions. Journal of Public Policy & Marketing, 32(1), 66–81.", note: "Documents systematic errors in how consumers understand how card payments translate into payoff time and cost, and tests presentation formats that reduce the errors — a case for seeing the arithmetic rather than guessing it.", link: doi("10.1509/jppm.11.061"), kind: "doi" },
      { cite: "Sussman, A. B., & Alter, A. L. (2012). The exception is the rule: Underestimating and overspending on exceptional expenses. Journal of Consumer Research, 39(4), 800–814.", note: "Consumers underestimate and overspend on exceptional expenses because they budget each one in isolation; presenting them as part of a broader category reduced the overspending.", link: doi("10.1086/665833"), kind: "doi" },
      { cite: "Zhang, C. Y., Sussman, A. B., Wang-Ly, N., & Lyu, J. K. (2022). How consumers budget. Journal of Economic Behavior & Organization, 204, 69–88.", note: "Survey and experimental evidence on how people actually construct budgets — which categories they use, how they set amounts and how they respond when a budget is exceeded — grounding the practical design of a tracking system.", link: doi("10.1016/j.jebo.2022.09.025"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-cash-not-card",
    goal: "debt", tier: "fundamental", section: "8204",
    title: "Pay With Cash or Debit for Discretionary Spending",
    subtitle: "Cards mute the pain of paying; that is the whole point, and the whole problem",
    evidenceTag: "Moderate",
    impact: { magnitude: 2, latency: "days", durability: "sustained", effort: "low" },
    feeds: ["self-control", "spending awareness"],
    description:
      "Experiments over two decades find that paying by credit card raises willingness to pay, weakens memory for past spending and tilts baskets toward impulsive purchases, while cash and other transparent forms of payment make the outlay feel more real. Neural evidence points to card cues activating reward pathways. The effect sizes vary by study and context, and cards carry real benefits (records, protection), so this is a protocol for discretionary categories, not for every payment.",
    action: "For the next 30 days, pay for groceries, eating out and entertainment with cash or a debit card only, and leave credit cards at home on non-essential shopping trips.",
    sources: [
      { cite: "Prelec, D., & Simester, D. (2001). Always leave home without it: A further investigation of the credit-card effect on willingness to pay. Marketing Letters, 12(1), 5–12.", note: "Auction experiments in which participants instructed to pay by credit card bid substantially more for the same items than those instructed to pay cash — the classic demonstration of the credit-card premium.", link: doi("10.1023/a:1008196717017"), kind: "doi" },
      { cite: "Raghubir, P., & Srivastava, J. (2008). Monopoly money: The effect of payment coupling and form on spending behavior. Journal of Experimental Psychology: Applied, 14(3), 213–225.", note: "Studies showing that less transparent forms of payment (cards, gift certificates) are treated like play money and spent more freely than cash; the form of payment, not just its timing, changes spending.", link: doi("10.1037/1076-898x.14.3.213"), kind: "doi" },
      { cite: "Soman, D. (2001). Effects of payment mechanism on spending behavior: The role of rehearsal and immediacy of payments. Journal of Consumer Research, 27(4), 460–474.", note: "Past card payments were recalled less accurately and weighed less in later spending decisions than cash or check payments, because they are neither rehearsed nor immediate.", link: doi("10.1086/319621"), kind: "doi" },
      { cite: "Shah, A. M., Eisenkraft, N., Bettman, J. R., & Chartrand, T. L. (2015). \"Paper or plastic?\": How we pay influences post-transaction connection. Journal of Consumer Research, 42(5), 688–708.", note: "Paying with cash rather than card increased the pain of paying and, in turn, people's psychological attachment to what they bought — one reason cash purchases are made more carefully.", link: doi("10.1093/jcr/ucv056"), kind: "doi" },
      { cite: "Thomas, M., Desai, K. K., & Seenivasan, S. (2011). How credit card payments increase unhealthy food purchases: Visceral regulation of vices. Journal of Consumer Research, 38(1), 126–139.", note: "Shopping-basket data and experiments: card payment increased purchases of impulsive, unhealthy items because the pain of paying with cash curbs impulsive urges.", link: doi("10.1086/657331"), kind: "doi" },
      { cite: "Banker, S., Dunfield, D., Huang, A., & Prelec, D. (2021). Neural mechanisms of credit card spending. Scientific Reports, 11(1).", note: "fMRI study of purchase decisions: credit-card purchases were associated with activation in reward-related regions relative to cash, offering a mechanism for the card premium.", link: doi("10.1038/s41598-021-83488-3"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-minimum-anchor-myth",
    goal: "debt", tier: "fundamental", section: "8205",
    title: "Myth: The Statement Minimum Is a Sensible Amount to Pay",
    subtitle: "The minimum is an anchor that pulls repayment down — set your own number instead",
    evidenceTag: "Strong",
    impact: { magnitude: 1, latency: "days", durability: "sustained", effort: "low" },
    callout:
      "Rated at the floor as a debunked belief: treating the minimum payment as guidance is one of the most expensive habits in consumer debt. Experiments show simply printing a minimum lowers the amount people choose to pay, administrative data show a large share of cardholders cluster at or near it, and disclosure nudges have had only modest effects. The protocol is to ignore the minimum as a target and fix your own higher amount.",
    description:
      "Neil Stewart's experiment found that showing a minimum payment on a mock statement anchored repayments downward among people who would otherwise pay more; follow-up work replicated the anchor and found that supplemental disclosures shift it only modestly. Credit-card account data show payments bunching at the minimum, and a balance-matching heuristic (spreading payments in proportion to balances) rather than paying high-rate cards first. None of this makes the minimum a plan.",
    action: "Pick a fixed monthly payment for each card that is well above the minimum and set it as an automatic payment; treat the statement minimum only as a floor you never touch.",
    sources: [
      { cite: "Stewart, N. (2009). The cost of anchoring on credit-card minimum repayments. Psychological Science, 20(1), 39–41.", note: "Experimental evidence that including a minimum payment on a credit-card statement reduced the repayment people chose to make relative to a statement with no minimum shown — the anchoring effect at the center of this cluster.", link: doi("10.1111/j.1467-9280.2008.02255.x"), kind: "doi" },
      { cite: "Navarro-Martinez, D., Salisbury, L. C., Lemon, K. N., Stewart, N., Matthews, W. J., & Harris, A. J. L. (2011). Minimum required payment and supplemental information disclosure effects on consumer debt repayment decisions. Journal of Marketing Research, 48(SPL), S60–S77.", note: "Experiments in the US and UK confirming that minimum-payment information lowers repayment amounts, while supplemental disclosures such as payoff-time information have only limited effects on the decision.", link: doi("10.1509/jmkr.48.spl.s60"), kind: "doi" },
      { cite: "Keys, B. J., & Wang, J. (2019). Minimum payments and debt paydown in consumer credit cards. Journal of Financial Economics, 131(3), 528–548.", note: "Large administrative credit-card data: a substantial share of accounts pay at or near the minimum, behavior that anchoring rather than liquidity constraints best explains for many borrowers.", link: doi("10.1016/j.jfineco.2018.09.009"), kind: "doi" },
      { cite: "Adams, P., Guttman-Kenney, B., Hayes, L., Hunt, S., Laibson, D., & Stewart, N. (2022). Do nudges reduce borrowing and consumer confusion in the credit card market? Economica, 89(S1).", note: "Field experiments with UK card issuers testing nudges aimed at minimum-payment behavior; the disclosures had limited effect on borrowing, which is why this shelf recommends a self-set fixed payment rather than relying on statement information.", link: doi("10.1111/ecca.12427"), kind: "doi" },
      { cite: "Gathergood, J., Mahoney, N., Stewart, N., & Weber, J. (2019). How do individuals repay their debt? The balance-matching heuristic. American Economic Review, 109(3), 844–875.", note: "UK cardholders with two cards allocated repayments roughly in proportion to balances rather than to the higher-rate card — a costly heuristic that a deliberate payoff order overrides.", link: doi("10.1257/aer.20180288"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-windfall-rule",
    goal: "debt", tier: "fundamental", section: "8206",
    title: "Pre-Commit Every Windfall Before It Arrives",
    subtitle: "Refunds, bonuses and rebates are spent differently from earned money unless you decide first",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "days", durability: "transient", effort: "low" },
    feeds: ["planning", "self-control"],
    description:
      "Windfalls are spent more readily than the same money earned, and even the label matters: money framed as a 'bonus' is spent more than money framed as a 'rebate'. Studies of tax rebates and stimulus payments find households spend a meaningful share quickly, though some pay down debt. Deciding the destination of a refund or bonus in writing before it lands turns a leak into a lump-sum payment.",
    action: "Before your next tax refund, bonus or rebate arrives, write down the percentage going to debt and set up the transfer the day it lands; treat anything not pre-committed as already spent.",
    sources: [
      { cite: "Arkes, H. R., Joyner, C. A., Pezzo, M. V., Nash, J. G., Siegel-Jacobs, K., & Stone, E. (1994). The psychology of windfall gains. Organizational Behavior and Human Decision Processes, 59(3), 331–347.", note: "Experiments showing that unanticipated money is spent more readily than anticipated money of the same amount — the basic windfall effect this protocol pre-empts.", link: doi("10.1006/obhd.1994.1063"), kind: "doi" },
      { cite: "Milkman, K. L., & Beshears, J. (2009). Mental accounting and small windfalls: Evidence from an online grocer. Journal of Economic Behavior & Organization, 71(2), 384–394.", note: "Online-grocery data: customers who received a small coupon windfall increased their spending on items they would not normally buy, consistent with windfalls being mentally booked to a separate, looser account.", link: doi("10.1016/j.jebo.2009.04.007"), kind: "doi" },
      { cite: "Epley, N., Mak, D., & Idson, L. C. (2006). Bonus of rebate?: The impact of income framing on spending and saving. Journal of Behavioral Decision Making, 19(3), 213–227.", note: "Identical payments framed as a 'bonus' were spent more than payments framed as a 'rebate' — labels alone move the spend-versus-save decision, so label your windfall before it arrives.", link: doi("10.1002/bdm.519"), kind: "doi" },
      { cite: "Agarwal, S., Liu, C., & Souleles, N. S. (2007). The reaction of consumer spending and debt to tax rebates—Evidence from consumer credit data. Journal of Political Economy, 115(6), 986–1019.", note: "Credit-card account data around the 2001 tax rebates: consumers initially paid down card debt, but spending later rose and balances returned — pre-commitment is what makes a rebate a durable paydown.", link: doi("10.1086/528721"), kind: "doi" },
      { cite: "Parker, J. A., Souleles, N. S., Johnson, D. S., & McClelland, R. (2013). Consumer spending and the economic stimulus payments of 2008. American Economic Review, 103(6), 2530–2553.", note: "Households spent a significant share of the 2008 stimulus payments within months of receipt, especially on durables — evidence of how quickly unplanned lump sums leave.", link: doi("10.1257/aer.103.6.2530"), kind: "doi" },
      { cite: "Sahm, C. R., Shapiro, M. D., & Slemrod, J. (2012). Check in the mail or more in the paycheck: Does the effectiveness of fiscal stimulus depend on how it is delivered? American Economic Journal: Economic Policy, 4(3), 216–250.", note: "Compared lump-sum rebate checks with the same money delivered through lower withholding: delivery form changed how much households reported spending versus saving or paying debt.", link: doi("10.1257/pol.4.3.216"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-autopay-fixed-payment",
    goal: "debt", tier: "moderate", section: "8207",
    title: "Automate a Fixed Above-Minimum Payment and Add Reminders",
    subtitle: "Present bias is why the plan slips; automation is how it doesn't",
    evidenceTag: "Strong",
    impact: { magnitude: 4, latency: "weeks", durability: "lasting", effort: "low" },
    feeds: ["follow-through", "self-control"],
    description:
      "People who are present-biased in experiments carry more credit-card debt and fail to follow their own paydown plans; those who can commit do better. Field experiments show reminder messages raise follow-through on savings commitments, and health-savings experiments show even simple earmarked accounts help people set money aside. Automation takes the decision out of each month; the honest caveat is that nudges have side effects and must be checked against your cash flow.",
    action: "Within two weeks, set an automatic payment on each debt for a fixed amount above the minimum timed two days after payday, and add a calendar reminder the day before to confirm the balance covers it.",
    sources: [
      { cite: "Kuchler, T., & Pagel, M. (2021). Sticking to your plan: The role of present bias for credit card paydown. Journal of Financial Economics, 139(2), 359–388.", note: "Using app data on planned versus actual card paydowns, present-biased individuals fell short of their own plans, and the shortfall was concentrated among those who were also not sophisticated about their bias — the case for automating rather than intending.", link: doi("10.1016/j.jfineco.2020.08.002"), kind: "doi" },
      { cite: "Meier, S., & Sprenger, C. (2010). Present-biased preferences and credit card borrowing. American Economic Journal: Applied Economics, 2(1), 193–210.", note: "Matched incentivized time-preference measures to credit-bureau data: present-biased individuals were more likely to carry credit-card debt and carried more of it.", link: doi("10.1257/app.2.1.193"), kind: "doi" },
      { cite: "Karlan, D., McConnell, M., Mullainathan, S., & Zinman, J. (2016). Getting to the top of mind: How reminders increase saving. Management Science, 62(12), 3393–3411.", note: "Field experiments with three banks: reminder messages increased attainment of savings commitments, and messages that mentioned the specific goal were particularly effective; late extra reminders added nothing.", link: doi("10.1287/mnsc.2015.2296"), kind: "doi" },
      { cite: "Medina, P. C. (2020). Side effects of nudging: Evidence from a randomized intervention in the credit card market. The Review of Financial Studies, 34(5), 2580–2607.", note: "A randomized reminder to avoid credit-card late fees worked, but some users then overdrew their checking accounts — the reason an autopay must be sized and timed to actual cash flow.", link: doi("10.1093/rfs/hhaa108"), kind: "doi" },
      { cite: "Jones, L. E., Loibl, C., & Tennyson, S. (2015). Effects of informational nudges on consumer debt repayment behaviors. Journal of Economic Psychology, 51, 16–33.", note: "Evaluated the informational nudges on US credit-card statements introduced by the CARD Act, finding measurable but limited effects on repayment — information alone is weaker than a standing instruction.", link: doi("10.1016/j.joep.2015.06.009"), kind: "doi" },
      { cite: "Dupas, P., & Robinson, J. (2013). Why don't the poor save more? Evidence from health savings experiments. American Economic Review, 103(4), 1138–1171.", note: "Field experiments in Kenya: even a simple lockbox earmarked for a goal raised saving, and social commitment devices raised it further — evidence that structure substitutes for willpower.", link: doi("10.1257/aer.103.4.1138"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-one-off-class-myth",
    goal: "debt", tier: "moderate", section: "8208",
    title: "Myth: A Financial-Literacy Class Will Get You Out of Debt",
    subtitle: "Generic, one-time education has tiny, decaying effects on behavior",
    evidenceTag: "Strong",
    impact: { magnitude: 1, latency: "months", durability: "transient", effort: "moderate" },
    callout:
      "Rated at the floor as popular advice the evidence does not support: the largest meta-analysis found financial-education interventions explain about 0.1% of the variance in financial behavior, with effects that decay to nothing within roughly 20 months. Education timed to a specific decision and delivered as simple rules performs better (see the next cluster), and mandatory high-school courses show some effects on young adults' credit — but a course by itself is not a payoff plan.",
    description:
      "Fernandes, Lynch and Netemeyer's meta-analysis of 201 studies and later meta-analyses agree that classroom-style financial education moves knowledge more than behavior, and that whatever behavioral effect exists fades. Boot-camp evidence from the US Army and state high-school mandates show modest, targeted effects on some outcomes. The consistent lesson is that structure (automation, defaults, commitment) beats instruction.",
    action: "Do not enroll in a generic money course expecting it to change your balances; if you take one, do it in the week before a real decision (a refinance, a repayment-plan choice) and pair it with one automated change the same week.",
    sources: [
      { cite: "Fernandes, D., Lynch, J. G., Jr., & Netemeyer, R. G. (2014). Financial literacy, financial education, and downstream financial behaviors. Management Science, 60(8), 1861–1883.", note: "Meta-analysis of 168 papers and 201 studies: financial-education interventions explained only 0.1% of the variance in downstream behaviors, with weaker effects in low-income samples and decay such that even many-hour programs had negligible effects 20 months later.", link: doi("10.1287/mnsc.2013.1849"), kind: "doi" },
      { cite: "Kaiser, T., & Menkhoff, L. (2017). Does financial education impact financial literacy and financial behavior, and if so, when? The World Bank Economic Review, 31(3), 611–630.", note: "Meta-analysis of financial-education studies finding effects on behavior that are heterogeneous — stronger for some outcomes and settings and when education is intensive and well timed, weaker for low-income participants.", link: doi("10.1093/wber/lhx018"), kind: "doi" },
      { cite: "Brown, M., Grigsby, J., van der Klaauw, W., Wen, J., & Zafar, B. (2016). Financial education and the debt behavior of the young. Review of Financial Studies, 29(9), 2490–2522.", note: "Using state changes in high-school graduation requirements and credit-bureau data, math and financial-education mandates shifted young adults' debt outcomes — modest, targeted effects rather than a cure.", link: doi("10.1093/rfs/hhw006"), kind: "doi" },
      { cite: "Skimmyhorn, W. (2016). Assessing financial education: Evidence from boot camp. American Economic Journal: Economic Policy, 8(2), 322–343.", note: "A mandatory personal-finance course for US Army enlistees raised retirement-plan participation and reduced some adverse credit outcomes in the near term, with effects that were specific rather than general.", link: doi("10.1257/pol.20140283"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-just-in-time-rules",
    goal: "debt", tier: "moderate", section: "8208",
    title: "Learn Rules of Thumb Just Before the Decision",
    subtitle: "Simple heuristics taught at the moment of use outperform comprehensive courses",
    evidenceTag: "Moderate",
    impact: { magnitude: 2, latency: "weeks", durability: "sustained", effort: "moderate" },
    feeds: ["financial judgment", "debt literacy"],
    description:
      "The updated meta-analytic evidence finds financial education does move knowledge and behavior when it is targeted, and a randomized trial found simple rules of thumb changed practice where standard accounting training did not. Debt-specific literacy — understanding compounding and minimum-payment arithmetic — is low and is linked to over-indebtedness and to self-control problems. The practical version is to learn one rule at a time, right before you need it.",
    action: "Before each debt decision this quarter (choosing a payoff order, a repayment plan, a balance transfer), spend 20 minutes learning the one rule that governs it — for example how compounding at your card's rate changes the payoff timeline — and write the rule on your budget page.",
    sources: [
      { cite: "Kaiser, T., Lusardi, A., Menkhoff, L., & Urban, C. (2022). Financial education affects financial knowledge and downstream behaviors. Journal of Financial Economics, 145(2), 255–272.", note: "Meta-analysis of randomized experiments finding that financial education has positive effects on financial knowledge and on downstream behaviors, larger than earlier reviews suggested — the honest counterweight to the one-off-class verdict.", link: doi("10.1016/j.jfineco.2021.09.022"), kind: "doi" },
      { cite: "Drexler, A., Fischer, G., & Schoar, A. (2014). Keeping it simple: Financial literacy and rules of thumb. American Economic Journal: Applied Economics, 6(2), 1–31.", note: "Randomized trial among microentrepreneurs: a simplified rules-of-thumb training changed financial practices, while a standard accounting course did not — simplicity and immediacy beat comprehensiveness.", link: doi("10.1257/app.6.2.1"), kind: "doi" },
      { cite: "Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. Journal of Economic Literature, 52(1), 5–44.", note: "Review of the financial-literacy literature: literacy is low worldwide, strongly correlated with planning and wealth, and the three core questions (compounding, inflation, diversification) predict outcomes — the knowledge floor this cluster targets.", link: doi("10.1257/jel.52.1.5"), kind: "doi" },
      { cite: "Lusardi, A., & Tufano, P. (2015). Debt literacy, financial experiences, and overindebtedness. Journal of Pension Economics and Finance, 14(4), 332–368.", note: "National survey measuring 'debt literacy': most respondents could not correctly reason about compounding on a credit card, and low debt literacy was associated with higher-cost borrowing and reported over-indebtedness.", link: doi("10.1017/s1474747215000232"), kind: "doi" },
      { cite: "Gathergood, J. (2012). Self-control, financial literacy and consumer over-indebtedness. Journal of Economic Psychology, 33(3), 590–602.", note: "UK household data: both poor self-control and low financial literacy predicted over-indebtedness, with self-control the stronger factor — knowledge helps, structure helps more.", link: doi("10.1016/j.joep.2011.11.006"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-bandwidth-protect",
    goal: "debt", tier: "fundamental", section: "8209",
    title: "Protect Your Bandwidth — Make Money Decisions When You Are Not Depleted",
    subtitle: "Scarcity may tax attention; the effect is real in some settings and contested in others",
    evidenceTag: "Mixed",
    impact: { magnitude: 2, latency: "days", durability: "transient", effort: "low" },
    feeds: ["attention", "decision quality"],
    description:
      "Mani and colleagues reported that prompting poorer shoppers to think about a large expense lowered their performance on cognitive tests, and that Indian farmers scored better after harvest than before; a Singapore study found debt relief improved cognitive functioning and decision-making. The evidence is contested: a Science comment challenged the analysis, a US study found no cognitive change around payday, and a 2021 audit of the scarcity literature found the broader evidence base weaker than its influence. Treat the mechanism as plausible, not settled, and organize money decisions for calm moments.",
    action: "Schedule a fixed 30-minute weekly money session at a time you are rested and fed, handle every financial decision in that window, and defer any unexpected money decision to the next session unless it is genuinely urgent.",
    sources: [
      { cite: "Mani, A., Mullainathan, S., Shafir, E., & Zhao, J. (2013). Poverty impedes cognitive function. Science, 341(6149), 976–980.", note: "Lower-income shoppers performed worse on reasoning tasks after considering an expensive hypothetical car repair while higher-income shoppers did not, and sugarcane farmers performed better after harvest than before — the headline evidence for a cognitive 'bandwidth tax'.", link: doi("10.1126/science.1238041"), kind: "doi" },
      { cite: "Shah, A. K., Mullainathan, S., & Shafir, E. (2012). Some consequences of having too little. Science, 338(6107), 682–685.", note: "Experiments in which scarcity of a resource focused attention on immediate needs and led to over-borrowing against the future — the behavioral pattern that debt itself can reinforce.", link: doi("10.1126/science.1222426"), kind: "doi" },
      { cite: "Ong, Q., Theseira, W., & Ng, I. Y. H. (2019). Reducing debt improves psychological functioning and changes decision-making in the poor. Proceedings of the National Academy of Sciences, 116(15), 7244–7249.", note: "Low-income Singaporeans whose debts were paid off by a charity showed improved cognitive functioning, lower anxiety and less present-biased decisions afterward — quasi-experimental evidence that reducing debt frees bandwidth.", link: doi("10.1073/pnas.1810901116"), kind: "doi" },
      { cite: "Wicherts, J. M., & Scholten, A. Z. (2013). Comment on \"Poverty impedes cognitive function\". Science, 342(6163), 1169.", note: "Technical comment questioning the analysis behind the shopping-mall experiments in Mani et al. — the start of the replication debate this cluster reports honestly.", link: doi("10.1126/science.1246680"), kind: "doi" },
      { cite: "Carvalho, L. S., Meier, S., & Wang, S. W. (2016). Poverty and economic decision-making: Evidence from changes in financial resources at payday. American Economic Review, 106(2), 260–284.", note: "Low-income US households surveyed before and after payday showed no differences in cognitive function or risk preferences, though before-payday respondents were more present-biased in money decisions — a partial non-replication of the bandwidth effect.", link: doi("10.1257/aer.20140481"), kind: "doi" },
      { cite: "O'Donnell, M., Dev, A. S., Antonoplis, S., Baum, S. M., Benedetti, A. H., Brown, N. D., Carrillo, B., … (2021). Empirical audit and review and an assessment of evidentiary value in research on the psychological consequences of scarcity. Proceedings of the National Academy of Sciences, 118(44).", note: "An empirical audit and set of replications of the scarcity literature found the evidentiary value of many published effects to be weaker than their influence suggests — why this cluster is rated Mixed.", link: doi("10.1073/pnas.2103313118"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-health-check",
    goal: "debt", tier: "moderate", section: "8209",
    title: "Treat Debt as a Health and Relationship Risk — Screen and Talk",
    subtitle: "Unsecured debt tracks depression, blood pressure and divorce; the payoff plan needs a support plan",
    evidenceTag: "Strong",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    feeds: ["mental health", "relationship quality", "sleep"],
    description:
      "A meta-analysis of 65 studies found people in debt had roughly three times the odds of a mental disorder and higher odds of depression and suicide; longitudinal data link unsecured debt to worse self-reported health and higher blood pressure; consumer debt predicts divorce and falling marital satisfaction. Causality runs both ways, but the associations are large enough that a payoff plan should include a monthly check on mood and a standing conversation with a partner.",
    action: "Once a month, rate your mood and sleep on a 1–10 scale on your budget page, and hold a 20-minute money conversation with your partner (or a trusted friend) with the balances on the table; if mood stays low for two months, book an appointment with a clinician.",
    sources: [
      { cite: "Richardson, T., Elliott, P., & Roberts, R. (2013). The relationship between personal unsecured debt and mental and physical health: A systematic review and meta-analysis. Clinical Psychology Review, 33(8), 1148–1162.", note: "Systematic review of 65 papers with pooled odds ratios: debt was associated with mental disorder (OR 3.24), depression (OR 2.77) and suicide completion (OR 7.9), with more severe debt tied to worse health; causality could not be established.", link: doi("10.1016/j.cpr.2013.08.009"), kind: "doi" },
      { cite: "Sweet, E., Nandi, A., Adam, E. K., & McDade, T. W. (2013). The high price of debt: Household financial debt and its impact on mental and physical health. Social Science & Medicine, 91, 94–100.", note: "US young adults with higher debt relative to assets reported worse perceived stress and depressive symptoms, worse self-rated health and had higher diastolic blood pressure.", link: doi("10.1016/j.socscimed.2013.05.009"), kind: "doi" },
      { cite: "Turunen, E., & Hiilamo, H. (2014). Health effects of indebtedness: A systematic review. BMC Public Health, 14(1), 489.", note: "Systematic review of studies on indebtedness and health: unpaid debt was consistently associated with poorer mental health, and there was evidence for physical-health effects as well.", link: doi("10.1186/1471-2458-14-489"), kind: "doi" },
      { cite: "Drentea, P., & Lavrakas, P. J. (2000). Over the limit: The association among health, race and debt. Social Science & Medicine, 50(4), 517–529.", note: "Ohio survey: credit-card debt and stress about debt were associated with worse physical health and self-reported health, independent of income.", link: doi("10.1016/s0277-9536(99)00298-1"), kind: "doi" },
      { cite: "Meltzer, H., Bebbington, P., Brugha, T., Jenkins, R., McManus, S., & Dennis, M. S. (2010). Personal debt and suicidal ideation. Psychological Medicine, 41(4), 771–778.", note: "National psychiatric morbidity survey of England: people in debt were markedly more likely to report suicidal thoughts, with the association persisting after adjustment for mental disorder.", link: doi("10.1017/s0033291710001261"), kind: "doi" },
      { cite: "Hojman, D. A., Miranda, Á., & Ruiz-Tagle, J. (2016). Debt trajectories and mental health. Social Science & Medicine, 167, 54–62.", note: "Chilean panel data: persistent over-indebtedness predicted later depressive symptoms, while short debt episodes did not — chronic debt is the health risk.", link: doi("10.1016/j.socscimed.2016.08.027"), kind: "doi" },
      { cite: "Dew, J. (2011). The association between consumer debt and the likelihood of divorce. Journal of Family and Economic Issues, 32(4), 554–565.", note: "Panel data on married couples: higher consumer debt predicted a higher likelihood of divorce, with financial disagreements a plausible pathway.", link: doi("10.1007/s10834-011-9274-z"), kind: "doi" },
      { cite: "Dew, J. (2008). Debt change and marital satisfaction change in recently married couples. Family Relations, 57(1), 60–71.", note: "Among newly married couples, increases in consumer debt over time were associated with declines in marital satisfaction, partly through time spent together and conflict over money.", link: doi("10.1111/j.1741-3729.2007.00483.x"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-credit-counseling",
    goal: "debt", tier: "advanced", section: "8210",
    title: "Nonprofit Credit Counseling and a Debt-Management Plan",
    subtitle: "Counseled borrowers improve on several credit measures; DMPs work for those who complete them",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "moderate" },
    feeds: ["financial structure", "accountability"],
    description:
      "The largest evaluation of credit counseling matched counseled borrowers to similar non-counseled borrowers and found improvements in credit profiles, particularly among those with the weakest credit at the start; clients in debt-management plans report better financial behaviors and lower stress. The boundaries: much of the evidence is observational, a primary-care trial of debt advice for depressed patients could not recruit enough people to test effects, and a DMP requires closing cards and several years of payments.",
    action: "Book a session with a nonprofit credit-counseling agency this month, bring your full debt list and budget, and ask them to model both a debt-management plan and a self-managed payoff so you can compare the monthly numbers.",
    sources: [
      { cite: "Elliehausen, G., Lundquist, E. C., & Staten, M. E. (2007). The impact of credit counseling on subsequent borrower behavior. Journal of Consumer Affairs, 41(1), 1–28.", note: "Compared counseled consumers with a matched sample over several years of credit-bureau data: counseling was associated with improved credit profiles and lower delinquency, with the largest gains among those with the lowest initial scores.", link: doi("10.1111/j.1745-6606.2006.00066.x"), kind: "doi" },
      { cite: "Xiao, J. J., Sorhaindo, B., & Garman, E. T. (2005). Financial behaviours of consumers in credit counselling. International Journal of Consumer Studies, 30(2), 108–121.", note: "Survey of credit-counseling clients in debt-management plans: engaging in recommended financial behaviors was associated with better financial well-being and lower reported stress.", link: doi("10.1111/j.1470-6431.2005.00455.x"), kind: "doi" },
      { cite: "Collins, J. M., & O'Rourke, C. M. (2010). Financial education and counseling—Still holding promise. Journal of Consumer Affairs, 44(3), 483–498.", note: "Review of the evaluation literature on financial education and counseling concluding that counseling shows promise but that rigorous, well-identified studies were scarce — the reason this cluster is rated Moderate.", link: doi("10.1111/j.1745-6606.2010.01179.x"), kind: "doi" },
      { cite: "Gabbay, M. B., Ring, A., Byng, R., Anderson, P., Taylor, R. S., Matthews, C., Harris, T., Berry, V., Byrne, P., … Warner, M. (2017). Debt Counselling for Depression in Primary Care: An adaptive randomised controlled pilot trial (DeCoDer study). Health Technology Assessment, 21(35), 1–164.", note: "A UK pilot trial adding debt advice to usual care for depressed patients with debt worries randomized 61 people but was terminated early for low recruitment; the qualitative work describes how debt and depression compound each other.", link: doi("10.3310/hta21350"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-financial-coaching",
    goal: "debt", tier: "advanced", section: "8211",
    title: "Work With a Financial Coach for Six Months",
    subtitle: "Randomized trials show coaching moves savings, debt and credit scores — where people show up",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "moderate" },
    feeds: ["accountability", "self-efficacy", "follow-through"],
    description:
      "The first randomized trials of financial coaching found significant effects on money management, debt, savings and perceived well-being, though which outcomes moved differed by site, and take-up of the offered coaching was far from universal. A youth credit-building coaching trial raised credit scores by 26 points over 18 months and reduced reliance on alternative financial services. Coaching works through goal-setting and accountability, so the protocol is a fixed schedule of sessions, not a single meeting.",
    action: "Engage a financial coach (a nonprofit program or a credentialed coach) for at least four sessions over six months, arrive at each with your tracked spending and balances, and leave each with one written commitment to be checked next time.",
    sources: [
      { cite: "Theodos, B., Stacy, C. P., & Daniels, R. (2018). Client led coaching: A random assignment evaluation of the impacts of financial coaching programs. Journal of Economic Behavior & Organization, 155, 140–158.", note: "First randomized evaluation of financial coaching at two sites: coaching produced significant effects on money management, debt, savings and perceived financial well-being — at one site mainly savings and credit scores, at the other mainly aggregate and delinquent debt.", link: doi("10.1016/j.jebo.2018.08.019"), kind: "doi" },
      { cite: "Modestino, A. S., Sederberg, R., & Tuller, L. (2019). Assessing the effectiveness of financial coaching: Evidence from the Boston Youth Credit Building Initiative. Journal of Consumer Affairs, 53(4), 1825–1873.", note: "Randomized trial of coaching for young adults using linked credit reports: after 18 months credit scores were 26 points higher for the treatment group, access to credit was up 10 percentage points within six months, and reliance on alternative financial services fell, with effects driven by self-efficacy.", link: doi("10.1111/joca.12265"), kind: "doi" },
      { cite: "Collins, J. M. (2013). The impacts of mandatory financial education: Evidence from a randomized field study. Journal of Economic Behavior & Organization, 95, 146–158.", note: "Randomized field study of mandatory financial education and counseling for low-income housing-program participants: treatment improved some self-reported behaviors and savings, with modest effects on credit measures — one-to-one support helped more than content alone.", link: doi("10.1016/j.jebo.2012.08.011"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-financial-therapy",
    goal: "debt", tier: "advanced", section: "8212",
    title: "Financial Therapy — Treat the Money Beliefs and the Mood Together",
    subtitle: "An emerging field: small pilots and one randomized trial, promising but thin",
    evidenceTag: "Emerging",
    impact: { magnitude: 2, latency: "months", durability: "sustained", effort: "high" },
    feeds: ["money beliefs", "anxiety regulation", "relationship communication"],
    description:
      "Financial therapy combines counseling techniques with money management. The evidence base is young: a solution-focused pilot with eight students, a 120-person randomized trial in India reporting higher financial well-being after six weeks, a 15-person feasibility study of web-based CBT for debt stress, and a UK case series of 32 patients receiving money advice alongside psychological therapy in which about a third recovered on both depression and anxiety measures. Money-script questionnaires give a vocabulary for the beliefs that drive spending. Reasonable to try when shame, avoidance or conflict is blocking the plan; not yet proven at scale.",
    action: "If you avoid opening statements, hide balances from a partner, or feel dread rather than resolve, book an initial session with a therapist who works on financial issues (or ask your therapist to add a money component) and commit to eight sessions before judging it.",
    sources: [
      { cite: "Klontz, B., Britt, S. L., Mentzer, J., & Klontz, T. (2011). Money beliefs and financial behaviors: Development of the Klontz Money Script Inventory. Journal of Financial Therapy, 2(1).", note: "Developed and validated an inventory of 'money scripts' (avoidance, worship, status, vigilance) and found the scripts were associated with income, net worth and revolving credit-card debt.", link: doi("10.4148/jft.v2i1.451"), kind: "doi" },
      { cite: "Archuleta, K. L., Burr, E. A., Bell Carlson, M., Ingram, J., Irwin Kruger, L., Grable, J., & Ford, M. (2015). Solution focused financial therapy: A brief report of a pilot study. Journal of Financial Therapy, 6(1).", note: "Pilot of solution-focused financial therapy with eight college students presenting budgeting and debt problems: psychological well-being and financial behaviors improved and financial distress fell at post-test and three months later.", link: doi("10.4148/1944-9771.1081"), kind: "doi" },
      { cite: "Mundi, H. S., & Apergis, N. (2025). Enhancing financial well-being: Solution-focused financial therapy intervention. International Social Science Journal, 75(258), 829–847.", note: "Randomized experiment with 120 adults in India: a six-week solution-focused financial therapy program raised financial well-being scores relative to a no-treatment control group.", link: doi("10.1111/issj.70013"), kind: "doi" },
      { cite: "Smail, D., Elison, S., Dubrow-Marshall, L., & Thompson, C. (2017). A mixed-methods study using a nonclinical sample to measure feasibility of Ostrich Community: A web-based cognitive behavioral therapy program for individuals with debt and associated stress. JMIR Mental Health, 4(2), e12.", note: "Feasibility study of an eight-week internet CBT program for debt-related stress with 15 participants: high satisfaction and improvements in well-being, stress and anxiety, in a nonclinical sample.", link: doi("10.2196/mental.6809"), kind: "doi" },
      { cite: "Belcher, H. L., Parri, L., Kilcoyne, I., Evans, J., Da Cunha Lewin, C., Lau, R., Bond, N., D'Arcy, C., Hatch, M., & Wykes, T. (2025). Feasibility and potential effects of a combined money advice and psychological therapy intervention within National Health Service Talking Therapies services. BJPsych Open, 11(4).", note: "Case series of 32 NHS therapy patients with problem debt who were also referred to a money advisor: one third recovered on both depression and anxiety measures and half improved, against a historical recovery estimate of 22% for people with problem debt.", link: doi("10.1192/bjo.2025.37"), kind: "doi" },
      { cite: "Belcher, H. L., Evans, J., Bond, N., Darcy, C., Hatch, M., Preece, G., & Wykes, T. (2022). Views of services users and staff on a combined money advice and psychological therapy service within IAPT. Journal of Mental Health, 33(3), 348–356.", note: "Qualitative study of patients and staff on combining money advice with psychological therapy: both groups saw the combination as acceptable and useful, and identified earlier screening for money worries as the key improvement.", link: doi("10.1080/09638237.2022.2069718"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-payday-bridge-myth",
    goal: "debt", tier: "fundamental", section: "8213",
    title: "Myth: A Payday Loan Is a Harmless Bridge to Next Paycheck",
    subtitle: "Access to payday credit worsens bill payment, job performance and bankruptcy risk for many borrowers",
    evidenceTag: "Mixed",
    impact: { magnitude: 1, latency: "days", durability: "lasting", effort: "low" },
    callout:
      "Rated at the floor as advice that harms in most of the evidence: households gaining access to payday loans had more difficulty paying mortgage, rent and utility bills; Air Force personnel near payday lenders performed worse and were more likely to be separated; marginal applicants were more likely to file for bankruptcy; and a structural study found most borrowers underestimate how long they will keep rolling over. The honest exception: payday credit has been found to help households hit by natural disasters, and one study found little effect on broad credit scores. Do not use it to bridge ordinary months.",
    description:
      "The most rigorous work compares households on either side of state borders or lending bans, or applicants just above and below a lender's approval cutoff. The weight of evidence is that repeat payday borrowing damages financial health, that borrowers are overconfident about their ability to stop, and that simple disclosures of the dollar cost of rollovers reduce borrowing. If a bridge is needed, the protocols on this shelf (an emergency line in the budget, a negotiated payment plan, nonprofit counseling) are the alternatives the research points toward.",
    action: "Write a rule on your budget page: no payday, title or high-cost installment loan; instead, this month build a one-line emergency buffer of even $100 by automatic transfer, and call each creditor for a payment arrangement before borrowing to pay them.",
    sources: [
      { cite: "Melzer, B. T. (2011). The real costs of credit access: Evidence from the payday lending market. The Quarterly Journal of Economics, 126(1), 517–555.", note: "Comparing households across state borders with and without access to payday lenders, access increased difficulty paying mortgage, rent and utility bills and delayed needed medical care — the core evidence against the 'harmless bridge' idea.", link: doi("10.1093/qje/qjq009"), kind: "doi" },
      { cite: "Morse, A. (2011). Payday lenders: Heroes or villains? Journal of Financial Economics, 102(1), 28–44.", note: "In California communities hit by natural disasters, access to payday lenders mitigated foreclosures and larcenies — the honest exception that payday credit can help with genuine, rare emergencies.", link: doi("10.1016/j.jfineco.2011.03.022"), kind: "doi" },
      { cite: "Bhutta, N. (2014). Payday loans and consumer financial health. Journal of Banking & Finance, 47, 230–242.", note: "Using credit-bureau data and variation in state laws, found little effect of payday-loan access on overall credit scores and delinquencies — evidence that the harms show up in bill payment and hardship rather than broad credit measures.", link: doi("10.1016/j.jbankfin.2014.04.024"), kind: "doi" },
      { cite: "Skiba, P. M., & Tobacman, J. (2019). Do payday loans cause bankruptcy? The Journal of Law and Economics, 62(3), 485–519.", note: "Regression-discontinuity design around a lender's approval cutoff: first-time applicants approved for a payday loan were more likely to file for Chapter 13 bankruptcy in the following years.", link: doi("10.1086/706201"), kind: "doi" },
      { cite: "Carrell, S., & Zinman, J. (2014). In harm's way? Payday loan access and military personnel performance. Review of Financial Studies, 27(9), 2805–2840.", note: "US Air Force personnel assigned to bases where payday lending was accessible showed worse job performance and readiness and were more likely to be separated for unsuitability.", link: doi("10.1093/rfs/hhu034"), kind: "doi" },
      { cite: "Bertrand, M., & Morse, A. (2011). Information disclosure, cognitive biases, and payday borrowing. The Journal of Finance, 66(6), 1865–1893.", note: "Field experiment at payday stores: showing borrowers the dollar cost of fees added up over repeated rollovers reduced subsequent borrowing — the cost is underestimated until it is made concrete.", link: doi("10.1111/j.1540-6261.2011.01698.x"), kind: "doi" },
      { cite: "Gathergood, J., Guttman-Kenney, B., & Hunt, S. (2018). How do payday loans affect borrowers? Evidence from the U.K. market. The Review of Financial Studies.", note: "UK regression-discontinuity study using near-universal lender data: receiving a payday loan raised subsequent missed payments, overdraft use and other borrowing over the following months.", link: doi("10.1093/rfs/hhy090"), kind: "doi" },
      { cite: "Allcott, H., Kim, J., Taubinsky, D., & Zinman, J. (2021). Are high-interest loans predatory? Theory and evidence from payday lending. The Review of Economic Studies, 89(3), 1041–1084.", note: "Combined a survey of borrowers with an experiment on their beliefs: borrowers substantially underestimated how likely they were to keep borrowing, and many valued a commitment to be prevented from future payday loans.", link: doi("10.1093/restud/rdab066"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-medical-bills",
    goal: "debt", tier: "moderate", section: "8214",
    title: "Handle Medical Bills as a Separate Process — Verify, Ask for Assistance, Then Arrange",
    subtitle: "Medical debt is the most common collection item in the US and behaves unlike other debt",
    evidenceTag: "Strong",
    impact: { magnitude: 3, latency: "weeks", durability: "sustained", effort: "moderate" },
    feeds: ["negotiation", "financial structure"],
    description:
      "Credit-bureau research shows medical debt in collections is the single largest category of collections in the US, concentrated in states that did not expand Medicaid; hospital admissions cause lasting drops in earnings and rises in unpaid bills, and insurance expansions sharply reduce medical collections. Medical collections are rarely repaid and often signal, rather than cause, wider financial distress. The protocol is administrative: get the itemized bill, ask about the provider's financial-assistance policy, and only then arrange a plan — before it reaches a collector.",
    action: "For any medical bill over $200, request the itemized statement within a week, ask the billing office in writing whether you qualify for financial assistance or a prompt-pay discount, and set up an interest-free payment plan with the provider rather than paying by credit card.",
    sources: [
      { cite: "Kluender, R., Mahoney, N., Wong, F., & Yin, W. (2021). Medical debt in the US, 2009–2020. JAMA, 326(3), 250.", note: "Credit-report analysis of a nationally representative panel: medical debt became the largest source of debt in collections, concentrated in low-income communities and in states that did not expand Medicaid.", link: doi("10.1001/jama.2021.8694"), kind: "doi" },
      { cite: "Dobkin, C., Finkelstein, A., Kluender, R., & Notowidigdo, M. J. (2018). The economic consequences of hospital admissions. American Economic Review, 108(2), 308–352.", note: "Event-study of hospital admissions using credit reports and hospital records: admissions led to persistent increases in unpaid medical bills and declines in earnings and access to credit, especially for the uninsured.", link: doi("10.1257/aer.20161038"), kind: "doi" },
      { cite: "Himmelstein, D. U., Thorne, D., Warren, E., & Woolhandler, S. (2009). Medical bankruptcy in the United States, 2007: Results of a national study. The American Journal of Medicine, 122(8), 741–746.", note: "National survey of bankruptcy filers in which a majority attributed their bankruptcy at least partly to medical bills or illness — the finding that made medical debt a distinct category in the debt literature.", link: doi("10.1016/j.amjmed.2009.04.012"), kind: "doi" },
      { cite: "Batty, M., Gibbs, C., & Ippolito, B. (2022). Health insurance, medical debt, and financial well-being. Health Economics, 31(5), 689–728.", note: "Two natural experiments (the ACA under-26 rule and Medicare eligibility) sharply reduced medical debt in collections, but did not systematically improve unrelated credit outcomes; medical collections were rarely repaid, suggesting they are often a symptom rather than a cause of distress.", link: doi("10.1002/hec.4472"), kind: "doi" },
      { cite: "Hu, L., Kaestner, R., Mazumder, B., Miller, S., & Wong, A. (2018). The effect of the affordable care act Medicaid expansions on financial wellbeing. Journal of Public Economics, 163, 99–112.", note: "Medicaid expansion reduced unpaid bills sent to collection and improved credit scores among low-income adults in expansion states — evidence that coverage is itself a debt-prevention tool.", link: doi("10.1016/j.jpubeco.2018.04.009"), kind: "doi" },
      { cite: "Brevoort, K., Grodzicki, D., & Hackmann, M. B. (2020). The credit consequences of unpaid medical bills. Journal of Public Economics, 187, 104203.", note: "Studied how medical collections affect credit scores and access to credit and the effect of coverage on them, finding medical collections had measurable credit consequences that insurance expansions reduced.", link: doi("10.1016/j.jpubeco.2020.104203"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-student-loan-plan",
    goal: "debt", tier: "moderate", section: "8215",
    title: "Review Your Student-Loan Repayment Plan Every Year",
    subtitle: "Income-driven plans cut delinquency and improve credit; the default option and complexity keep people out",
    evidenceTag: "Moderate",
    impact: { magnitude: 3, latency: "months", durability: "sustained", effort: "moderate" },
    feeds: ["financial structure", "cash-flow stability"],
    description:
      "Quasi-experimental and experimental studies of US federal student loans find that enrolling in income-driven repayment reduces delinquency and default, raises credit scores and improves borrowers' consumption stability; a field experiment with a servicer showed that simply making enrollment easier substantially increased take-up. Experiments on plan design show the default option and information complexity drive costly choices. Plans and their terms change, so this is a yearly review, not a one-time decision.",
    action: "Each year, on the anniversary of your first payment, log into your servicer and compare your current plan against every plan you are eligible for on monthly payment, total cost and forgiveness terms, and re-enroll or switch the same day.",
    sources: [
      { cite: "Herbst, D. (2023). The impact of income-driven repayment on student borrower outcomes. American Economic Journal: Applied Economics, 15(1), 1–25.", note: "Using quasi-random assignment of borrowers to servicer representatives, enrollment in income-driven repayment reduced delinquency, increased credit scores and raised homeownership relative to standard repayment.", link: doi("10.1257/app.20200362"), kind: "doi" },
      { cite: "Mueller, H., & Yannelis, C. (2021). Increasing enrollment in income-driven student loan repayment plans: Evidence from the Navient field experiment. The Journal of Finance, 77(1), 367–402.", note: "Field experiment with a large servicer: reducing the hassle of enrolling in income-driven repayment (pre-filled forms and outreach) raised enrollment substantially and lowered subsequent delinquency.", link: doi("10.1111/jofi.13088"), kind: "doi" },
      { cite: "Cox, J. C., Kreisman, D., & Dynarski, S. (2020). Designed to fail: Effects of the default option and information complexity on student loan repayment. Journal of Public Economics, 192, 104298.", note: "Lab experiment on repayment-plan choice: participants stuck with a costly default plan and complex information worsened choices, while a simplified presentation improved them.", link: doi("10.1016/j.jpubeco.2020.104298"), kind: "doi" },
      { cite: "Mueller, H. M., & Yannelis, C. (2019). The rise in student loan defaults. Journal of Financial Economics, 131(1), 1–19.", note: "Documents the rise in student-loan defaults after the Great Recession and links it to labor-market shocks and the growth of borrowing at for-profit institutions — context for why a repayment plan that flexes with income matters.", link: doi("10.1016/j.jfineco.2018.07.013"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-bankruptcy-fresh-start",
    goal: "debt", tier: "elite", section: "8216",
    title: "Know When the Fresh Start Is the Right Move",
    subtitle: "Consumer bankruptcy protection raises earnings, reduces mortality and restores credit access faster than people expect",
    evidenceTag: "Strong",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "high" },
    callout:
      "Nothing here is legal advice; bankruptcy law, exemptions and eligibility differ by state and change over time. What the studies establish is that for households in deep distress, protection has measurable benefits, and that the decision is often delayed by stigma and liquidity rather than by the numbers.",
    feeds: ["financial reset", "earnings recovery"],
    description:
      "Studies using random assignment of bankruptcy cases to judges find that Chapter 13 protection raised filers' subsequent earnings, reduced mortality and foreclosure, and improved credit access and scores compared with dismissed filers. Households often cannot afford to file until a tax rebate arrives, and post-bankruptcy borrowers regain access to credit more quickly than expected. Bankruptcy's implicit insurance also shapes how medical debt is collected. This is the elite-tier move because it is rare, consequential and requires expert guidance.",
    action: "If your unsecured debts exceed a year of take-home pay and the payoff plans on this shelf cannot clear them within five years, book a consultation with a bankruptcy attorney (many offer free initial consultations) and a nonprofit counselor in the same month, and decide with both opinions on the table.",
    sources: [
      { cite: "Dobbie, W., & Song, J. (2015). Debt relief and debtor outcomes: Measuring the effects of consumer bankruptcy protection. American Economic Review, 105(3), 1272–1311.", note: "Exploiting random assignment of Chapter 13 cases to judges, bankruptcy protection increased filers' annual earnings, raised employment and reduced mortality and foreclosure over the following years compared with dismissed filers.", link: doi("10.1257/aer.20130612"), kind: "doi" },
      { cite: "Dobbie, W., Goldsmith-Pinkham, P., & Yang, C. S. (2017). Consumer bankruptcy and financial health. The Review of Economics and Statistics, 99(5), 853–869.", note: "Using the same judge-assignment design with credit-bureau data, Chapter 13 protection reduced debt in collections and foreclosure and increased credit scores and access to credit relative to dismissal.", link: doi("10.1162/rest_a_00669"), kind: "doi" },
      { cite: "Han, S., & Li, G. (2011). Household borrowing after personal bankruptcy. Journal of Money, Credit and Banking, 43(2-3), 491–517.", note: "Survey of Consumer Finances analysis: households that filed for bankruptcy regained access to credit over time, though on less favorable terms and with more reliance on secured borrowing.", link: doi("10.1111/j.1538-4616.2010.00382.x"), kind: "doi" },
      { cite: "Gross, T., Notowidigdo, M. J., & Wang, J. (2014). Liquidity constraints and consumer bankruptcy: Evidence from tax rebates. Review of Economics and Statistics, 96(3), 431–443.", note: "Bankruptcy filings rose when households received tax rebates — evidence that many distressed households are too liquidity-constrained to afford the filing costs of the relief they need.", link: doi("10.1162/rest_a_00391"), kind: "doi" },
      { cite: "Fay, S., Hurst, E., & White, M. J. (2002). The household bankruptcy decision. American Economic Review, 92(3), 706–718.", note: "Panel data model of the filing decision: households were more likely to file when the financial benefit of filing was larger, and filings were also influenced by local filing rates — stigma and information matter alongside the numbers.", link: doi("10.1257/00028280260136327"), kind: "doi" },
      { cite: "Mahoney, N. (2015). Bankruptcy as implicit health insurance. American Economic Review, 105(2), 710–746.", note: "Shows that the ability to discharge medical debt in bankruptcy acts as implicit insurance: households with more seizable assets pay more of their medical bills, and hospitals' collection behavior responds to state exemption levels.", link: doi("10.1257/aer.20131408"), kind: "doi" },
      { cite: "Gross, T., Kluender, R., Liu, F., Notowidigdo, M. J., & Wang, J. (2021). The economic consequences of bankruptcy reform. American Economic Review, 111(7), 2309–2341.", note: "The 2005 bankruptcy reform reduced filings and shifted costs onto borrowers; the study estimates the reform's effects on credit access, borrowing costs and financial distress — context for why filing has become harder and rarer.", link: doi("10.1257/aer.20191311"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-ask-for-more",
    goal: "debt", tier: "elite", section: "8217",
    title: "Raise the Income Side — Negotiate Pay and Add a Second Stream",
    subtitle: "Asking works when it is expected; unrequested asks can backfire; extra work is flexible but modest",
    evidenceTag: "Moderate",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "high" },
    feeds: ["earning power", "negotiation", "agency"],
    description:
      "A large natural field experiment found that when job ads did not state that pay was negotiable, men were more likely to negotiate than women, and that stating negotiability closed the gap; survey and lab work find those who negotiate obtain higher starting pay, but that asking can carry social costs, especially for women, and that leaning in indiscriminately can lower outcomes. The 'ask gap' — what people say they want — explains much of the gender pay gap on a large hiring platform. Gig work offers flexible hours at modest, variable hourly earnings. Income moves are the highest-leverage lever on this shelf and the slowest to pay off.",
    action: "This quarter, prepare one evidence-based pay request (market data, your documented results, a specific number) and make it at your next review or job offer; in parallel, run a 90-day trial of one extra income stream and put 100% of its net earnings on your target debt.",
    sources: [
      { cite: "Leibbrandt, A., & List, J. A. (2015). Do women avoid salary negotiations? Evidence from a large-scale natural field experiment. Management Science, 61(9), 2016–2024.", note: "Natural field experiment with real job ads: when negotiability was not mentioned men negotiated more than women, but an explicit statement that wages were negotiable eliminated the gap — the setting determines who asks.", link: doi("10.1287/mnsc.2014.1994"), kind: "doi" },
      { cite: "Bowles, H. R., Babcock, L., & Lai, L. (2007). Social incentives for gender differences in the propensity to initiate negotiations: Sometimes it does hurt to ask. Organizational Behavior and Human Decision Processes, 103(1), 84–103.", note: "Experiments showing evaluators penalized women more than men for initiating salary negotiations — the social cost of asking that a well-framed request must manage.", link: doi("10.1016/j.obhdp.2006.09.001"), kind: "doi" },
      { cite: "Marks, M., & Harold, C. (2011). Who asks and who receives in salary negotiation. Journal of Organizational Behavior, 32(3), 371–394.", note: "Survey of recently hired employees: those who chose to negotiate their starting salary received higher pay than those who accepted the offer, and negotiation strategy predicted the size of the gain.", link: doi("10.1002/job.671"), kind: "doi" },
      { cite: "Exley, C. L., Niederle, M., & Vesterlund, L. (2020). Knowing when to ask: The cost of leaning in. Journal of Political Economy, 128(3), 816–854.", note: "Lab experiment on entering negotiations: women who chose not to negotiate were often those who would have done poorly, so forcing everyone to negotiate lowered average outcomes — ask when the case is strong, not indiscriminately.", link: doi("10.1086/704616"), kind: "doi" },
      { cite: "Roussille, N. (2024). The role of the ask gap in gender pay inequality. The Quarterly Journal of Economics, 139(3), 1557–1610.", note: "On a large engineering hiring platform where candidates state a desired salary, the gap in what women and men asked for explained nearly all of the gap in offers — evidence that the stated number itself drives outcomes.", link: doi("10.1093/qje/qjae004"), kind: "doi" },
      { cite: "Hall, J. V., & Krueger, A. B. (2017). An analysis of the labor market for Uber's driver-partners in the United States. ILR Review, 71(3), 705–732.", note: "Survey and administrative data on rideshare drivers: most drove part time alongside other work, valued the flexibility, and earned modest hourly amounts before expenses — a realistic baseline for what a side stream can contribute.", link: doi("10.1177/0019793917717222"), kind: "doi" },
    ],
  },

  {
    id: "gs-debt-escalating-commitment",
    goal: "debt", tier: "elite", section: "8218",
    title: "Build a Pay-More-Tomorrow System — Escalate Payments With Every Raise",
    subtitle: "Commit now to a bigger payment later, lock it to income growth, and add a peer or partner witness",
    evidenceTag: "Strong",
    impact: { magnitude: 4, latency: "months", durability: "lasting", effort: "moderate" },
    feeds: ["commitment", "long-horizon planning", "identity"],
    description:
      "Save More Tomorrow showed that people who commit in advance to raise contributions with each future pay increase end up saving several times more, because the increase never feels like a cut. A randomized commitment-savings product in the Philippines raised balances substantially for those who took it, a Chilean field experiment found peer-group commitment raised saving more than higher interest did, and vividly imagining one's future self increased willingness to allocate money to it. Applied to debt, the system is a written escalation schedule tied to raises, a commitment account, and a witness.",
    action: "Write a one-page escalation contract: your current automatic payment, the rule that half of every raise or bonus goes to debt automatically, and the date the next increase triggers; give a copy to your partner or a friend who will check it with you every quarter for two years.",
    sources: [
      { cite: "Thaler, R. H., & Benartzi, S. (2004). Save More Tomorrow: Using behavioral economics to increase employee saving. Journal of Political Economy, 112(S1), S164–S187.", note: "Employees who committed in advance to raise their savings rate with each future pay increase stayed in the program at high rates and raised contribution rates severalfold over a few years — the escalation mechanism this cluster applies to debt.", link: doi("10.1086/380085"), kind: "doi" },
      { cite: "Ashraf, N., Karlan, D., & Yin, W. (2006). Tying Odysseus to the mast: Evidence from a commitment savings product in the Philippines. The Quarterly Journal of Economics, 121(2), 635–672.", note: "Randomized offer of a savings account that restricted withdrawals until a goal was met: take-up was higher among people showing present-biased preferences, and the product raised savings balances substantially after a year.", link: doi("10.1162/qjec.2006.121.2.635"), kind: "doi" },
      { cite: "Bryan, G., Karlan, D., & Nelson, S. (2010). Commitment devices. Annual Review of Economics, 2(1), 671–698.", note: "Review of the theory and evidence on commitment devices: why people demand them, when they work, and the design features (hard versus soft, financial versus social penalties) that determine success.", link: doi("10.1146/annurev.economics.102308.124324"), kind: "doi" },
      { cite: "Kast, F., Meier, S., & Pomeranz, D. (2018). Saving more in groups: Field experimental evidence from Chile. Journal of Development Economics, 133, 275–294.", note: "Field experiment among low-income microentrepreneurs: a peer-group commitment with public goal-setting and feedback raised savings deposits far more than a substantially higher interest rate, and text-message feedback replicated part of the effect.", link: doi("10.1016/j.jdeveco.2018.01.006"), kind: "doi" },
      { cite: "Hershfield, H. E., Goldstein, D. G., Sharpe, W. F., Fox, J., Yeykelis, L., Carstensen, L. L., & Bailenson, J. N. (2011). Increasing saving behavior through age-progressed renderings of the future self. Journal of Marketing Research, 48(SPL), S23–S37.", note: "Participants who interacted with age-progressed images of themselves allocated more money to the future — a technique for making the debt-free future self vivid enough to commit to.", link: doi("10.1509/jmkr.48.spl.s23"), kind: "doi" },
    ],
  },
];
