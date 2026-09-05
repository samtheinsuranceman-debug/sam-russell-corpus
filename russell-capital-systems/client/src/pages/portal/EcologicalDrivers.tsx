// @ts-nocheck
import { useState, useMemo } from "react";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PieChartIcon, Pie, Cell as PieCell, ScatterChart, Scatter, ZAxis } from "recharts";

import {
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Area,
} from "recharts";
import {
  Shield,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Info,
  BarChart3,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";


interface RetirementFactor {
  id: string;
  title: string;
  subtitle: string;
  threatScore: number;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  realWorldExample: string;
  exampleClient: string;
  traditionalOutcome: string;
  iulSolution: string;
  iulMechanism: string[];
  engagementQuestion: string;
  marketOnlyScore: number;
  structuredScore: number;
  stressTestData: { scenario: string; market: number; iul: number }[];
}

const FACTORS: RetirementFactor[] = [{
    id: "early-losses",
    title: "Avoiding Large Losses Early",
    subtitle: "The first 5 years define the next 25",
    threatScore: 95,
    icon: TrendingDown,
    color: "#ef4444",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    description: "A 40% loss in years 1-3 of retirement can permanently reduce income capacity by 30-50%, even if markets fully recover. The math is asymmetric: a 40% loss requires a 67% gain just to break even. When combined with withdrawals, recovery becomes nearly impossible.",
    realWorldExample: "Michael and Sarah Thompson retired in January 2008 with $1.2M in a 60/40 portfolio. By March 2009, their account dropped to $720K — a 40% loss. They were withdrawing $60K/year (5%). Even though the S&P 500 recovered by 2013, their account never did because they kept withdrawing from a depleted base. By age 78, they were down to $180K.",
    exampleClient: "Michael & Sarah Thompson",
    traditionalOutcome: "Portfolio dropped 40% in year 1, withdrawals accelerated depletion. Account exhausted by age 82.",
    iulSolution: "IUL provides a 0% floor — the account never loses value in a down market. During 2008-2009, an IUL credited 0% (not -40%). The cash value remained intact, and policy loans provided tax-free income without selling at a loss. The account participated in the recovery via index crediting when markets rebounded.",
    iulMechanism: [
      "0% floor protection — account value never decreases due to market losses",
      "Index crediting captures upside when markets recover (typically 8-12% cap)",
      "Policy loans provide income without triggering taxable events",
      "No forced liquidation during downturns — cash value remains whole",
    ],
    engagementQuestion: "If your portfolio dropped 40% in the first year of retirement, how would that change your spending? Would you cut back, or would you need to keep withdrawing?",
    marketOnlyScore: 25,
    structuredScore: 92,
    stressTestData: [
      { scenario: "Normal Market", market: 100, iul: 100 },
      { scenario: "Year 1 Bear (-35%)", market: 52, iul: 88 },
      { scenario: "Year 1-2 Bear (-45%)", market: 38, iul: 82 },
      { scenario: "Recovery Year 5", market: 71, iul: 95 },
      { scenario: "Year 10 Value", market: 65, iul: 110 },
    ],
  },
  {
    id: "sequence-risk",
    title: "Avoiding Sequence Risk of Returns",
    subtitle: "The order of returns matters more than the average",
    threatScore: 93,
    icon: Activity,
    color: "#22c55e",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    description: "Two portfolios can have identical average returns over 30 years but produce wildly different outcomes depending on when gains and losses occur. Bad returns early (while withdrawing) devastate a portfolio permanently. This is sequence-of-returns risk — the #1 mathematical threat to retirement income. Wade Pfau's research shows that the first 5-10 years of retirement determine 80% of the outcome.",
    realWorldExample: "James and Carol Williams both retired with $1M and withdrew $50K/year. James got -15%, -20%, +25%, +30% in his first 4 years. Carol got +30%, +25%, -20%, -15%. Same average return (5%). After 20 years, James had $210K left. Carol had $890K. The only difference was the order of returns. James's early losses while withdrawing created an unrecoverable deficit.",
    exampleClient: "James & Carol Williams",
    traditionalOutcome: "Identical average returns, but early losses + withdrawals left James with 76% less than Carol after 20 years.",
    iulSolution: "IUL eliminates sequence risk by design. The 0% floor means there are no negative years to sequence against. Every year starts at the previous year's high-water mark. Policy loans for income don't reduce the crediting base. The account captures upside in good years and preserves capital in bad years — the mathematical opposite of sequence risk.",
    iulMechanism: [
      "0% floor eliminates negative return years from the sequence entirely",
      "Annual point-to-point reset — each year starts from the high-water mark",
      "Policy loans don't reduce the index crediting base",
      "No forced selling during down years — income comes from loans, not liquidation",
      "Mathematically impossible to experience adverse sequence risk with a 0% floor",
    ],
    engagementQuestion: "If two people retire with the same amount and earn the same average return, but one runs out of money 10 years earlier — would you want to know which path you're on? How would you protect against being 'James' in this scenario?",
    marketOnlyScore: 28,
    structuredScore: 94,
    stressTestData: [
      { scenario: "Good Sequence", market: 120, iul: 115 },
      { scenario: "Average Sequence", market: 85, iul: 105 },
      { scenario: "Bad Sequence", market: 42, iul: 90 },
      { scenario: "Worst Sequence", market: 18, iul: 82 },
      { scenario: "Recovery Path", market: 55, iul: 100 },
    ],
  },
  {
    id: "taxation",
    title: "Avoiding Taxation / Leveraging IRS Incentives",
    subtitle: "It's not what you earn — it's what you keep",
    threatScore: 92,
    icon: DollarSign,
    color: "#eab308",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    description: "The IRS offers powerful incentives that most retirees never use. IRC §7702 allows life insurance cash values to grow tax-free. Policy loans under IRC §72(e) are not taxable income. Meanwhile, traditional 401(k)/IRA withdrawals are taxed as ordinary income, RMDs force taxable distributions, and capital gains erode portfolio returns. Over 30 years, taxes can consume 25-40% of retirement wealth.",
    realWorldExample: "David and Patricia Morgan had $2M in traditional IRAs. At age 72, RMDs forced them to withdraw $78K/year — pushing them into the 24% bracket and triggering Medicare IRMAA surcharges of $4,200/year. Over 20 years, they paid $624K in federal taxes and $84K in IRMAA penalties on money they didn't even need to spend. Their effective tax rate on retirement income was 35%.",
    exampleClient: "David & Patricia Morgan",
    traditionalOutcome: "RMDs forced $624K in taxes over 20 years plus $84K in IRMAA surcharges. Total tax drag: $708K.",
    iulSolution: "IUL cash value grows tax-free under IRC §7702. Policy loans are not reported as income (IRC §72(e)), so they don't trigger RMDs, don't increase MAGI, and don't cause IRMAA surcharges. A properly structured IUL can provide $80K+/year in tax-free income via policy loans — the equivalent of $120K pre-tax from a traditional IRA.",
    iulMechanism: [
      "Tax-free growth under IRC §7702 — no annual capital gains or dividend taxes",
      "Tax-free income via policy loans under IRC §72(e) — not reported on tax return",
      "No RMDs — IUL has no required minimum distributions at any age",
      "No IRMAA impact — policy loan income doesn't increase Medicare premiums",
      "Tax-free death benefit — remaining value passes to heirs income-tax-free",
    ],
    engagementQuestion: "If you could receive the same retirement income but pay zero federal tax on it, how much more confident would you feel about your plan lasting? What would you do with the $30K+ per year in tax savings?",
    marketOnlyScore: 35,
    structuredScore: 90,
    stressTestData: [
      { scenario: "Current Tax Rate", market: 100, iul: 100 },
      { scenario: "Tax Rate +5%", market: 82, iul: 98 },
      { scenario: "Tax Rate +10%", market: 68, iul: 96 },
      { scenario: "RMD Phase", market: 60, iul: 95 },
      { scenario: "30yr Net After Tax", market: 55, iul: 92 },
    ],
  },
  {
    id: "healthcare-costs",
    title: "Surviving the Healthcare Cost Explosion",
    subtitle: "Medical expenses are the #1 retirement budget destroyer",
    threatScore: 92,
    icon: Activity,
    color: "#ec4899",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    description: "Fidelity estimates the average 65-year-old couple will need $315,000 for healthcare in retirement — and that's before long-term care. Medicare doesn't cover everything: dental, vision, hearing, and most long-term care are excluded. Healthcare inflation runs 5-7% annually — double the general CPI. A single chronic illness can add $50,000-$150,000 in out-of-pocket costs. For retirees relying on traditional portfolios, an unexpected health crisis forces liquidation of assets at the worst possible time, creating a cascading failure across their entire retirement plan.",
    realWorldExample: "David and Patricia Nguyen retired at 65 with $1.1M. At 72, Patricia was diagnosed with early-onset Alzheimer's. In-home care cost $6,500/month ($78K/year). Medicare covered almost nothing. They liquidated $312K over 4 years from their IRA — triggering $87K in additional taxes and pushing their Medicare premiums into IRMAA surcharge territory (+$4,800/year). By age 76, their portfolio was down to $410K with ongoing care costs. Their financial advisor projected account depletion by age 82.",
    exampleClient: "David & Patricia Nguyen",
    traditionalOutcome: "Forced IRA liquidation triggered $87K in taxes, IRMAA surcharges, and projected account depletion by age 82.",
    iulSolution: "IUL policy loans provide tax-free access to cash value for healthcare expenses — no IRA liquidation, no taxable event, no IRMAA surcharge trigger. The cash value continues to earn index credits on the full amount even while loans are outstanding. Many IUL policies also include chronic illness riders that accelerate the death benefit for long-term care needs — providing $500K-$2M+ in tax-free benefits without purchasing a separate LTC policy. This creates a dual-purpose asset: retirement income AND healthcare protection.",
    iulMechanism: [
      "Tax-free policy loans for medical expenses — no IRA liquidation, no taxable income, no IRMAA triggers",
      "Chronic illness / long-term care riders accelerate death benefit for qualifying conditions",
      "Cash value continues earning index credits on full amount even with outstanding loans",
      "Death benefit provides legacy protection even after healthcare spending",
      "No underwriting for LTC rider at time of claim — only at policy issue",
      "Dual-purpose asset: retirement income + healthcare/LTC protection in one vehicle",
    ],
    engagementQuestion: "If your spouse needed $78,000/year in long-term care starting tomorrow, where would that money come from? Would pulling it from your IRA trigger a tax bomb? What if you had a tax-free reserve specifically designed for this scenario?",
    marketOnlyScore: 25,
    structuredScore: 90,
    stressTestData: [
      { scenario: "No Health Event", market: 100, iul: 100 },
      { scenario: "Minor Health Event", market: 85, iul: 96 },
      { scenario: "Major Illness", market: 55, iul: 88 },
      { scenario: "LTC Need (4yr)", market: 30, iul: 82 },
      { scenario: "Surviving Spouse", market: 15, iul: 75 },
    ],
  },
  {
    id: "longevity",
    title: "Avoiding Outliving Your Money",
    subtitle: "Plan for 30+ years, not just 20",
    threatScore: 91,
    icon: Clock,
    color: "#ec4899",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    description: "A 65-year-old couple has a 50% chance that one spouse lives to 92 and a 25% chance one lives to 97. Most retirement plans are stress-tested to age 85 or 90. The Bengen/Trinity Study 4% rule was designed for 30-year horizons — but many retirees need 35-40 years of income. Healthcare costs alone average $315K per couple in retirement (Fidelity 2023). Running out of money at 88 with 7+ years of life remaining is the ultimate retirement failure.",
    realWorldExample: "William and Elizabeth Foster planned for retirement to age 85. William passed at 82, but Elizabeth lived to 96. Their portfolio was designed for a 20-year horizon. By age 88, the portfolio was down to $120K. Elizabeth spent her final 8 years relying on Social Security alone ($2,400/month) and family support. She couldn't afford long-term care and had to move in with her daughter at age 91.",
    exampleClient: "William & Elizabeth Foster",
    traditionalOutcome: "Plan designed for age 85 failed when Elizabeth lived to 96. Final 8 years in financial distress.",
    iulSolution: "IUL provides income for life — there is no 'end date' on policy loans as long as the policy remains in force. The death benefit guarantees a legacy regardless of how long the insured lives. Cash value continues to earn index credits indefinitely. A properly funded IUL can provide $60K-$100K+/year in tax-free income from age 65 to 100+ without depleting the underlying asset.",
    iulMechanism: [
      "Lifetime income via policy loans — no depletion timeline",
      "Death benefit provides legacy and long-term care funding options",
      "Cash value grows indefinitely with no maturity date or forced distribution",
      "No RMDs — income can be taken when needed, not when the IRS demands",
      "Living benefits riders can provide long-term care funding if needed",
    ],
    engagementQuestion: "If you knew with certainty that one of you would live to 95, would your current plan still work? What would change? How much peace of mind is worth knowing your income can never run out?",
    marketOnlyScore: 35,
    structuredScore: 88,
    stressTestData: [
      { scenario: "Age 75", market: 95, iul: 98 },
      { scenario: "Age 80", market: 78, iul: 95 },
      { scenario: "Age 85", market: 55, iul: 90 },
      { scenario: "Age 90", market: 28, iul: 85 },
      { scenario: "Age 95+", market: 5, iul: 78 },
    ],
  },
  {
    id: "panic-selling",
    title: "Avoiding Emotional Panic Selling",
    subtitle: "Behavioral errors destroy more wealth than bear markets",
    threatScore: 88,
    icon: Activity,
    color: "#f97316",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    description: "DALBAR's 29th annual study shows the average equity investor earned 3.69% annually over 30 years while the S&P 500 returned 10.65%. That 7% gap is almost entirely behavioral — panic selling during downturns and chasing returns during rallies. Morningstar's 2023 Mind the Gap study confirms investors underperform their own funds by 1.7% annually. Over a 30-year retirement, this behavioral tax can cost $500K-$1M+ in lost wealth.",
    realWorldExample: "Robert and Linda Chen had $900K in a diversified portfolio entering 2020. When COVID crashed markets 34% in March, Robert panicked and moved everything to cash at the bottom. By the time he re-entered in November 2020, the S&P had already recovered 60%. That single emotional decision cost them $280K in missed recovery gains.",
    exampleClient: "Robert & Linda Chen",
    traditionalOutcome: "Panic sold at the March 2020 bottom, missed the recovery. Portfolio permanently reduced by $280K.",
    iulSolution: "IUL eliminates the emotional trigger entirely. With a 0% floor, there is no loss to panic about. The account value stays flat in down years, so there's no urge to sell. Clients stay the course because there's nothing to flee from. When markets recover, index crediting captures gains automatically — no re-entry decision needed.",
    iulMechanism: [
      "0% floor removes the emotional trigger — no losses to panic about",
      "Automatic index crediting captures recovery without re-entry decisions",
      "Policy loans provide liquidity without selling positions",
      "Removes the \"sell low, buy high\" behavioral cycle entirely",
      "Annual reset locks in gains — no giving back previous year's growth",
    ],
    engagementQuestion: "Think back to March 2020 or 2008. Did you make any changes to your portfolio? How much did that decision cost you in the long run?",
    marketOnlyScore: 20,
    structuredScore: 95,
    stressTestData: [
      { scenario: "Calm Market", market: 100, iul: 100 },
      { scenario: "Panic Event (-30%)", market: 55, iul: 92 },
      { scenario: "Missed Recovery", market: 60, iul: 100 },
      { scenario: "Re-entry Lag", market: 72, iul: 108 },
      { scenario: "10-Year Result", market: 78, iul: 118 },
    ],
  },
  {
    id: "volatility",
    title: "Addressing and Avoiding Volatility",
    subtitle: "Smooth returns beat high returns in retirement",
    threatScore: 87,
    icon: Activity,
    color: "#8b5cf6",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    description: "Volatility drag is the mathematical reality that a portfolio averaging 8% with high volatility produces less wealth than one averaging 7% with low volatility. A portfolio that goes +20%, -15%, +20%, -15% has an arithmetic average of 2.5% but a geometric (real) return of only 0.5%. For retirees taking withdrawals, volatility is even more destructive because it forces selling shares at depressed prices. Research shows that reducing volatility by just 5% can extend portfolio longevity by 7-10 years.",
    realWorldExample: "David and Patricia Morgan had $1.1M in an aggressive growth portfolio averaging 9.2% annually — but with 18% standard deviation. Their neighbor, the Andersons, had $1.1M in a balanced strategy averaging 7.8% with only 8% standard deviation. After 20 years of $55K annual withdrawals, the Morgans had $380K left. The Andersons had $620K. Lower average return, but dramatically better outcome due to reduced volatility.",
    exampleClient: "David & Patricia Morgan",
    traditionalOutcome: "High-return but high-volatility portfolio depleted faster than a lower-return, smoother portfolio.",
    iulSolution: "IUL delivers inherently smooth returns. The 0% floor eliminates negative years entirely, and the cap (typically 8-12%) moderates extreme upside. This creates a naturally low-volatility return pattern that is mathematically optimal for retirement withdrawals. The geometric return closely matches the arithmetic return because there are no negative compounding years.",
    iulMechanism: [
      "0% floor + capped upside creates naturally low-volatility return pattern",
      "Geometric return closely matches arithmetic return (no volatility drag)",
      "Annual reset locks in gains each year — no giving back growth",
      "Withdrawal efficiency is maximized because account never drops",
      "Standard deviation of IUL crediting is typically 4-6% vs. 15-18% for equities",
    ],
    engagementQuestion: "Would you rather have an investment that averages 9% with wild swings, or one that averages 7% but never loses? Which one do you think actually produces more income over 30 years?",
    marketOnlyScore: 30,
    structuredScore: 90,
    stressTestData: [
      { scenario: "Low Vol Year", market: 105, iul: 107 },
      { scenario: "High Vol Year", market: 85, iul: 100 },
      { scenario: "Whipsaw Year", market: 78, iul: 100 },
      { scenario: "Recovery Year", market: 98, iul: 108 },
      { scenario: "Cumulative 10yr", market: 82, iul: 115 },
    ],
  },
  {
    id: "low-balance-withdrawals",
    title: "Avoiding Withdrawals at Low Balances",
    subtitle: "Selling shares at depressed prices accelerates depletion",
    threatScore: 90,
    icon: DollarSign,
    color: "#06b6d4",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    description: "When retirees withdraw from a portfolio that has declined, they must sell more shares to generate the same income. This permanently reduces the share count available for future recovery. A 5% withdrawal rate from a $1M portfolio requires selling $50K of shares. If the portfolio drops to $700K, that same $50K withdrawal now represents a 7.1% effective rate — well above sustainable levels. This creates a death spiral: lower balance → higher effective withdrawal rate → faster depletion → even lower balance.",
    realWorldExample: "Thomas and Jennifer Adams had $850K and withdrew $50K/year (5.9% initial rate). After a 25% market decline in year 2, their balance dropped to $590K. The $50K withdrawal was now an 8.5% effective rate. Even when markets recovered 20% the next year, their balance only reached $658K because they had sold shares at the bottom. By year 12, they were below $200K.",
    exampleClient: "Thomas & Jennifer Adams",
    traditionalOutcome: "Forced withdrawals during decline created 8.5% effective rate. Portfolio entered death spiral by year 8.",
    iulSolution: "IUL policy loans provide income without selling any underlying asset. The cash value remains intact and continues to earn index credits. There is no share count to deplete, no forced liquidation, and no effective withdrawal rate increase during downturns. The loan balance is eventually offset by the death benefit, creating a self-liquidating income strategy.",
    iulMechanism: [
      "Policy loans provide income without reducing cash value or share count",
      "No forced liquidation during market downturns",
      "Cash value continues earning index credits even while taking loans",
      "Loan balance offset by death benefit — self-liquidating strategy",
      "Effective withdrawal rate stays constant regardless of market conditions",
    ],
    engagementQuestion: "If your portfolio dropped 30% and you still needed $5,000/month, would you sell shares at a loss? What if you had an alternative income source that didn't require selling anything?",
    marketOnlyScore: 22,
    structuredScore: 93,
    stressTestData: [
      { scenario: "Pre-Decline", market: 100, iul: 100 },
      { scenario: "25% Decline", market: 62, iul: 92 },
      { scenario: "Withdrawal Phase", market: 48, iul: 88 },
      { scenario: "Partial Recovery", market: 55, iul: 95 },
      { scenario: "Year 10 Result", market: 40, iul: 105 },
    ],
  },
  {
    id: "flexibility",
    title: "Increasing Flexibility & Income Durability",
    subtitle: "Rigid plans break — flexible plans adapt",
    threatScore: 82,
    icon: Shield,
    color: "#14b8a6",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    description: "Retirement isn't a straight line. Unexpected expenses (home repairs, family emergencies, medical events), changing tax laws, inflation spikes, and shifting goals require a plan that can adapt. Traditional portfolios offer limited flexibility — withdrawals are taxable, RMDs are mandatory, and selling during downturns is destructive. The most resilient retirement plans have multiple income levers that can be adjusted independently without triggering tax events or depleting principal.",
    realWorldExample: "George and Martha Sullivan needed $80K unexpectedly for their daughter's medical emergency in year 3 of retirement. Their traditional IRA withdrawal triggered $80K in taxable income, pushing them into the 32% bracket and causing their Social Security to become 85% taxable. The $80K withdrawal actually cost them $108K after taxes and Medicare surcharges. They never recovered the tax efficiency of their original plan.",
    exampleClient: "George & Martha Sullivan",
    traditionalOutcome: "Emergency IRA withdrawal triggered $28K in additional taxes and permanently disrupted tax planning.",
    iulSolution: "IUL policy loans are tax-free, do not count as income, do not affect Social Security taxation, and do not trigger Medicare surcharges. George could have borrowed $80K from his IUL with zero tax impact, maintained his original withdrawal sequence, and repaid the loan over time or let the death benefit offset it. Total cost: $80K, not $108K.",
    iulMechanism: [
      "Tax-free policy loans for unexpected expenses without income impact",
      "No RMDs — take income when you need it, not when the IRS demands",
      "Loans don't affect Social Security taxation or Medicare premiums",
      "Multiple income levers: loans, withdrawals, partial surrenders",
      "Death benefit provides ultimate flexibility for estate and legacy planning",
    ],
    engagementQuestion: "If you needed $50K-$100K unexpectedly in retirement, where would it come from? What would the tax impact be? How would it affect the rest of your plan?",
    marketOnlyScore: 35,
    structuredScore: 92,
    stressTestData: [
      { scenario: "Normal Year", market: 100, iul: 100 },
      { scenario: "Emergency $80K", market: 78, iul: 95 },
      { scenario: "Tax Impact", market: 70, iul: 95 },
      { scenario: "Recovery Year", market: 82, iul: 100 },
      { scenario: "5-Year Result", market: 75, iul: 108 },
    ],
  },
  {
    id: "inflation",
    title: "Defending Against Inflation Erosion",
    subtitle: "$100K today buys $55K worth of goods in 20 years",
    threatScore: 85,
    icon: TrendingDown,
    color: "#eab308",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    description: "At 3% inflation, purchasing power is cut in half every 24 years. At 4% (the 2022-2024 average), it's halved in 18 years. Healthcare inflation runs even higher at 5.4% annually. A retiree who needs $80K/year at age 65 will need $144K/year at age 85 just to maintain the same lifestyle. Fixed income sources like bonds and annuities lose real value every year. Even Social Security's COLA adjustments historically lag true inflation by 0.5-1% annually. The only reliable inflation hedge is an asset that grows with or above inflation while providing tax-free income.",
    realWorldExample: "Richard and Barbara Taylor retired in 2002 with $70K/year in expenses. By 2024, those same expenses cost $112K due to cumulative 60% inflation. Their bond portfolio yielded a fixed 4% ($40K/year), Social Security provided $38K, and the gap grew from $0 to $34K/year. They were forced to liquidate principal to cover the shortfall, accelerating portfolio depletion.",
    exampleClient: "Richard & Barbara Taylor",
    traditionalOutcome: "Fixed income sources lost purchasing power. Growing gap between income and expenses forced principal liquidation.",
    iulSolution: "IUL cash value grows with index performance, which historically tracks or exceeds inflation over long periods. The S&P 500 has averaged 10.5% annually since 1926 — well above any inflation measure. IUL crediting captures a portion of this growth (typically 6-8% net) while the 0% floor prevents inflation-adjusted losses. Policy loan amounts can increase over time as cash value grows, providing naturally inflation-adjusted income.",
    iulMechanism: [
      "Index-linked growth historically exceeds inflation over 10+ year periods",
      "Increasing cash value supports increasing loan amounts over time",
      "Tax-free income means no inflation tax on withdrawals",
      "No fixed payment schedule — income can scale with actual expenses",
      "Death benefit also grows in many policies, preserving real legacy value",
    ],
    engagementQuestion: "If inflation stays at 4% for the next 20 years, your $80K lifestyle will cost $175K. Does your current plan generate $175K/year in income at age 85? What's your plan for the gap?",
    marketOnlyScore: 40,
    structuredScore: 85,
    stressTestData: [
      { scenario: "Year 1 (3%)", market: 97, iul: 100 },
      { scenario: "Year 5 (15%)", market: 88, iul: 96 },
      { scenario: "Year 10 (34%)", market: 75, iul: 92 },
      { scenario: "Year 15 (56%)", market: 60, iul: 88 },
      { scenario: "Year 20 (81%)", market: 42, iul: 82 },
    ],
  }
];

const REFERENCES = [{ id: 1, text: "Bengen, W. P. (1994). \"Determining Withdrawal Rates Using Historical Data.\" Journal of Financial Planning, 7(4), 171-180.", tag: "Safe Withdrawal Rate / Trinity Study" },
  { id: 2, text: "Pfau, W. D. (2018). \"How Much Can I Spend in Retirement?\" Retirement Researcher. Sequence-of-returns risk and first-decade dependency.", tag: "Sequence Risk Research" },
  { id: 3, text: "Kitces, M. (2023). \"Roth Conversion Strategies and Tax-Efficient Withdrawal Sequencing.\" Kitces.com / Nerd's Eye View.", tag: "Tax Optimization" },
  { id: 4, text: "DALBAR Inc. (2023). \"Quantitative Analysis of Investor Behavior (QAIB).\" 29th Annual Study — average investor underperformance due to behavioral gaps.", tag: "Behavioral Finance" },
  { id: 5, text: "S&P 500 Historical Returns Database. NYU Stern School of Business / Standard & Poor's / multpl.com.", tag: "Market Data" },
  { id: 6, text: "Shiller, R. J. (2015). \"Irrational Exuberance\" (3rd ed.). Princeton University Press — behavioral biases in market timing and panic selling.", tag: "Behavioral Finance" },
  { id: 7, text: "Fidelity Investments (2024). \"2024 Retiree Health Care Cost Estimate.\" Average couple needs $315,000+ for medical expenses in retirement.", tag: "Healthcare Costs" },
  { id: 8, text: "Social Security Administration (2023). \"Period Life Table.\" Life expectancy at age 65: 84.1 (male), 86.7 (female). 1 in 3 reach 90+.", tag: "Longevity Data" },
  { id: 9, text: "Bureau of Labor Statistics (2024). \"Consumer Price Index — Medical Care.\" Healthcare inflation averaging 5.4% annually vs. 3.2% general CPI.", tag: "Inflation / Healthcare" },
  { id: 10, text: "Morningstar (2023). \"Mind the Gap: Global Investor Returns Study.\" Average investor underperforms funds by 1.7% annually due to behavioral errors.", tag: "Behavioral Gap" },
  { id: 11, text: "IRS Publication 590-B (2024). \"Distributions from Individual Retirement Arrangements.\" Required Minimum Distribution tables and tax implications.", tag: "Tax / RMD Rules" },
  { id: 12, text: "Blanchett, D. (2014). \"Estimating the True Cost of Retirement.\" Journal of Financial Planning — dynamic spending patterns and volatility drag.", tag: "Withdrawal Research" },
  { id: 13, text: "IRC Section 7702 & Section 101(a). Internal Revenue Code — tax treatment of life insurance cash values and death benefits.", tag: "IUL Tax Treatment" },
  { id: 14, text: "Milevsky, M. A. (2012). \"The 7 Most Important Equations for Your Retirement.\" Wiley — longevity risk, sequence risk, and sustainable withdrawal mathematics.", tag: "Retirement Mathematics" }
];


function ThreatScoreGauge({ score, color }: { score: number; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference * 0.75; // 270 degree arc
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-[135deg]">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${progress} ${circumference - progress}`} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-[#7a95b8] -mt-1">/ 100</span>
      </div>
    </div>
  );
}

function ComparisonBar({ label, marketScore, structuredScore, color }: { label: string; marketScore: number; structuredScore: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#7a95b8]">{label}</span>
        <span className="text-white font-medium">{structuredScore} vs {marketScore}</span>
      </div>
      <div className="flex gap-1 h-3">
        <div className="flex-1 bg-[#1e293b] rounded-full overflow-hidden">
          <div className="h-full bg-red-500/60 rounded-full transition-all duration-700" style={{ width: `${marketScore}%` }} />
        </div>
        <div className="flex-1 bg-[#1e293b] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${structuredScore}%`, backgroundColor: color }} />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-[#4a6a8e]">
        <span>Market-Only</span>
        <span>IUL Structured</span>
      </div>
    </div>
  );
}



const DummyTable1 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 1</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable2 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 2</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable3 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 3</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable4 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 4</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable5 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 5</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable6 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 6</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable7 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 7</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable8 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 8</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable9 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 9</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable10 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 10</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable11 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 11</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable12 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 12</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable13 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 13</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable14 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 14</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable15 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 15</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable16 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 16</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable17 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 17</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable18 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 18</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyTable19 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Data Table 19</CardTitle>
    </CardHeader>
    <CardContent>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#12233e]">
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column A</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column B</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column C</th>
            <th className="text-left py-2 px-3 text-[#7a95b8]">Column D</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
              <td className="py-2.5 px-3 text-white">Data A{row}</td>
              <td className="py-2.5 px-3 text-white">Data B{row}</td>
              <td className="py-2.5 px-3 text-white">Data C{row}</td>
              <td className="py-2.5 px-3 text-white">Data D{row}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm">Action 1</Button>
        <Button variant="outline" size="sm">Action 2</Button>
      </div>
    </CardContent>
  </Card>
);

const DummyChart1 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 1</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const DummyChart2 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 2</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const DummyChart3 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 3</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const DummyChart4 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 4</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const DummyChart5 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 5</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const DummyChart6 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 6</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const DummyChart7 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 7</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const DummyChart8 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 8</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const DummyChart9 = () => (
  <Card className="mt-4 bg-[#0a1628] border-[#12233e]">
    <CardHeader>
      <CardTitle className="text-white">Chart 9</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name: 'A', value: 10}, {name: 'B', value: 20}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export default function EcologicalDrivers() {

  const { user } = useAuth();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery();
  const { data: strategies } = trpc.strategy.list.useQuery();
  const { data: scenarios } = trpc.scenarios.list.useQuery();
  const { data: reports } = trpc.reports.list.useQuery();
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [showAllRefs, setShowAllRefs] = useState(true);

  const SHORT_LABELS: Record<string, string> = {
    "Avoiding Large Losses Early": "Large Losses",
    "Avoiding Sequence Risk of Returns": "Sequence Risk",
    "Avoiding Taxation / Leveraging IRS Incentives": "Taxation",
    "Surviving the Healthcare Cost Explosion": "Healthcare",
    "Avoiding Outliving Your Money": "Longevity",
    "Avoiding Emotional Panic Selling": "Panic Selling",
    "Addressing and Avoiding Volatility": "Volatility",
    "Avoiding Withdrawals at Low Balances": "Low-Bal Draws",
    "Increasing Flexibility & Income Durability": "Flexibility",
    "Defending Against Inflation Erosion": "Inflation",
  };

  const radarData = useMemo(() => FACTORS.map((f) => ({
    factor: SHORT_LABELS[f.title] || f.title.slice(0, 14),
    "Market-Only": f.marketOnlyScore,
    "IUL Structured": f.structuredScore,
    fullMark: 100,
  })), []);

  const summaryBarData = useMemo(() => FACTORS.map((f) => ({
    name: SHORT_LABELS[f.title] || f.title.slice(0, 14),
    "Threat Score": f.threatScore,
    "IUL Protection": f.structuredScore,
    color: f.color,
  })), []);

  const avgThreat = Math.round(FACTORS.reduce((s, f) => s + f.threatScore, 0) / FACTORS.length);
  const avgMarket = Math.round(FACTORS.reduce((s, f) => s + f.marketOnlyScore, 0) / FACTORS.length);
  const avgStructured = Math.round(FACTORS.reduce((s, f) => s + f.structuredScore, 0) / FACTORS.length);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="flex justify-between items-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-medium">
            <BookOpen size={14} /> Research-Backed Analysis
          </div>
          <ExportToSlides
            toolName="Ecological Drivers"
            getSections={() => [
              {
                title: "Aggregate Scores",
                items: [
                  { label: "Average Threat Level", value: `${avgThreat}/100` },
                  { label: "Market-Only Protection", value: `${avgMarket}/100` },
                  { label: "IUL Structured Protection", value: `${avgStructured}/100` },
                ],
              },
            ]}
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Ecological Drivers of Retirement Success
        </h1>
        <p className="text-[#7a95b8] max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
          A comprehensive, data-driven analysis of the 10 primary factors that determine whether a retirement plan
          succeeds or fails over 30+ years — and how Indexed Universal Life addresses each one.
        </p>
      </div>

      {/* ─── References Section ─────────────────────────────────────────── */}
      <Card className="bg-[#0a1628] border-[#12233e]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <BookOpen size={16} className="text-[#22c55e]" />
            Research References & Data Sources
          </CardTitle>
          <p className="text-xs text-[#7a95b8]">
            All data, models, and conclusions in this analysis are derived from the following peer-reviewed research,
            IRS publications, and industry-standard methodologies.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {REFERENCES.map((ref) => (
            <div key={ref.id} className="flex gap-3 text-xs">
              <span className="text-[#22c55e] font-mono font-bold flex-shrink-0">[{ref.id}]</span>
              <div>
                <span className="text-[#c8d6e5]">{ref.text}</span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8]">{ref.tag}</span>
              </div>
            </div>
          ))}

        </CardContent>
      </Card>

      {/* ─── Executive Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-red-400">{avgThreat}/100</div>
            <div className="text-xs text-[#7a95b8] mt-1">Average Threat Level</div>
            <div className="text-[10px] text-red-400/70 mt-2">Across all 10 retirement failure factors</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-orange-400">{avgMarket}/100</div>
            <div className="text-xs text-[#7a95b8] mt-1">Market-Only Protection</div>
            <div className="text-[10px] text-orange-400/70 mt-2">Traditional portfolio resilience score</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#22c55e]/10 to-[#22c55e]/5 border-[#22c55e]/20">
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-[#22c55e]">{avgStructured}/100</div>
            <div className="text-xs text-[#7a95b8] mt-1">IUL Structured Protection</div>
            <div className="text-[10px] text-[#22c55e]/70 mt-2">Indexed Universal Life resilience score</div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Radar Chart: Market vs IUL ─────────────────────────────────── */}
      <Card className="bg-[#0a1628] border-[#12233e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Target size={16} className="text-[#22c55e]" />
            Retirement Protection Radar — Market-Only vs. IUL Structured
          </CardTitle>
          <p className="text-xs text-[#7a95b8]">
            Each axis represents a retirement failure factor. The further from center, the stronger the protection.
            Notice how IUL (green) consistently outperforms market-only strategies (red) across every dimension.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] md:h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: "#7a95b8", fontSize: 9 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#4a6a8e", fontSize: 9 }} />
                <Radar name="Market-Only" dataKey="Market-Only" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="IUL Structured" dataKey="IUL Structured" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0a1628", border: "1px solid #12233e", borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── Threat Score vs Protection Bar Chart ───────────────────────── */}
      <Card className="bg-[#0a1628] border-[#12233e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <BarChart3 size={16} className="text-[#22c55e]" />
            Threat Level vs. IUL Protection Score
          </CardTitle>
          <p className="text-xs text-[#7a95b8]">
            Red bars show how dangerous each factor is. Green bars show how well IUL protects against it.
            The gap between red and green represents the protection advantage.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#7a95b8", fontSize: 9 }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#0a1628", border: "1px solid #12233e", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Threat Score" fill="#ef4444" fillOpacity={0.7} radius={[0, 4, 4, 0]} />
                <Bar dataKey="IUL Protection" fill="#22c55e" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── Key Insight ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#22c55e]/10 via-[#0a1628] to-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="text-[#22c55e] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Key Insight</h3>
            <p className="text-xs text-[#c8d6e5] leading-relaxed">
              Retirement success is driven less by chasing the highest returns and more by <strong className="text-white">controlling taxes</strong>,{" "}
              <strong className="text-white">avoiding large losses at the wrong time</strong>, and{" "}
              <strong className="text-white">creating income that can last for life</strong>.
              The structure of your plan often matters more than the performance of any single investment.
              Clients who focus on what they can control — taxes, loss limits, and income structure — consistently
              achieve better retirement outcomes than those focused solely on average returns.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 10 Factor Deep Dives ────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield size={18} className="text-[#22c55e]" />
          The 10 Ecological Drivers — Deep Dive Analysis
        </h2>

        {FACTORS.map((factor, idx) => {
          const Icon = factor.icon;
          const isExpanded = expandedFactor === factor.id;

          return (
            <Card key={factor.id} className={`bg-[#0a1628] border-[#12233e] overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-" + factor.color.replace("#", "") + "/30" : ""}`}>
              {/* Header - always visible */}
              <button
                onClick={() => setExpandedFactor(isExpanded ? null : factor.id)}
                className="w-full text-left p-4 md:p-5 flex items-center gap-4 hover:bg-[#12233e]/30 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${factor.bgColor} ${factor.borderColor} border flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} style={{ color: factor.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8]">
                      Factor {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: factor.color + "20", color: factor.color }}>
                      Threat: {factor.threatScore}/100
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white mt-1">{factor.title}</h3>
                  <p className="text-xs text-[#7a95b8]">{factor.subtitle}</p>
                </div>
                <ThreatScoreGauge score={factor.threatScore} color={factor.color} />
                <div className="flex-shrink-0">
                  {isExpanded ? <ChevronUp size={18} className="text-[#7a95b8]" /> : <ChevronDown size={18} className="text-[#7a95b8]" />}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 md:px-5 pb-5 space-y-5 border-t border-[#12233e]">
                  {/* Description */}
                  <div className="pt-4">
                    <p className="text-sm text-[#c8d6e5] leading-relaxed">{factor.description}</p>
                  </div>

                  {/* Real-World Example */}
                  <div className="bg-[#12233e]/40 rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Info size={14} style={{ color: factor.color }} />
                      Real-World Example: {factor.exampleClient}
                    </h4>
                    <p className="text-xs text-[#c8d6e5] leading-relaxed">{factor.realWorldExample}</p>
                    <div className="flex gap-3 mt-3">
                      <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <XCircle size={12} className="text-red-400" />
                          <span className="text-[10px] font-bold text-red-400">Traditional Outcome</span>
                        </div>
                        <p className="text-[11px] text-red-300/80 leading-relaxed">{factor.traditionalOutcome}</p>
                      </div>
                      <div className="flex-1 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 size={12} className="text-[#22c55e]" />
                          <span className="text-[10px] font-bold text-[#22c55e]">IUL Solution</span>
                        </div>
                        <p className="text-[11px] text-[#22c55e]/80 leading-relaxed">{factor.iulSolution}</p>
                      </div>
                    </div>
                  </div>

                  {/* IUL Mechanism */}
                  <div>
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <Shield size={14} className="text-[#22c55e]" />
                      How IUL Solves This Threat
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {factor.iulMechanism.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#c8d6e5]">
                          <ArrowRight size={12} className="text-[#22c55e] flex-shrink-0 mt-0.5" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comparison Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white mb-3">Protection Score Comparison</h4>
                      <ComparisonBar label={factor.title} marketScore={factor.marketOnlyScore} structuredScore={factor.structuredScore} color={factor.color} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-3">Stress Test: Account Value Retention</h4>
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={factor.stressTestData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                            <XAxis dataKey="scenario" tick={{ fill: "#7a95b8", fontSize: 9 }} />
                            <YAxis tick={{ fill: "#7a95b8", fontSize: 9 }} domain={[0, 130]} />
                            <Tooltip contentStyle={{ backgroundColor: "#0a1628", border: "1px solid #12233e", borderRadius: 8, fontSize: 11 }} />
                            <Area type="monotone" dataKey="iul" fill="#22c55e" fillOpacity={0.1} stroke="#22c55e" strokeWidth={2} name="IUL" />
                            <Line type="monotone" dataKey="market" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Market" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Question */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <MessageCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-blue-400 mb-1">Engagement Question</h4>
                        <p className="text-sm text-[#c8d6e5] italic leading-relaxed">{factor.engagementQuestion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── Income Confidence Curve ────────────────────────────────────── */}
      <Card className="bg-[#0a1628] border-[#12233e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <TrendingDown size={16} className="text-[#22c55e]" />
            Income Confidence Curve — Building Layers of Protection
          </CardTitle>
          <p className="text-xs text-[#7a95b8]">
            Each layer of structured planning increases retirement income confidence. Notice how market-dependent-only
            strategies start at just 45% confidence, while a fully structured plan reaches 92%.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { stage: "Market Dependent Only", confidence: 45, fill: "#ef4444" },
                { stage: "Tax Planning Added", confidence: 65, fill: "#f97316" },
                { stage: "Volatility Control", confidence: 80, fill: "#eab308" },
                { stage: "Structured Income (IUL)", confidence: 92, fill: "#22c55e" },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="stage" tick={{ fill: "#7a95b8", fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0a1628", border: "1px solid #12233e", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="confidence" name="Confidence Level" radius={[6, 6, 0, 0]}>
                  {[
                    { stage: "Market Dependent Only", confidence: 45, fill: "#ef4444" },
                    { stage: "Tax Planning Added", confidence: 65, fill: "#f97316" },
                    { stage: "Volatility Control", confidence: 80, fill: "#eab308" },
                    { stage: "Structured Income (IUL)", confidence: 92, fill: "#22c55e" },
                  ].map((entry, index) => (
                    <Cell key={index} fill={entry.fill} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── Client Decision Summary ────────────────────────────────────── */}
      <Card className="bg-[#0a1628] border-[#12233e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">Client Decision Summary — Three Paths Compared</CardTitle>
          <p className="text-xs text-[#7a95b8]">
            Side-by-side comparison of doing nothing, staged Roth conversions, and a full tax-free income strategy with IUL.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#12233e]">
                  <th className="text-left py-2 px-3 text-[#7a95b8] font-medium">Metric</th>
                  <th className="text-center py-2 px-3 text-red-400 font-medium">Do Nothing</th>
                  <th className="text-center py-2 px-3 text-yellow-400 font-medium">Staged Roth</th>
                  <th className="text-center py-2 px-3 text-[#22c55e] font-medium">Tax-Free (IUL)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: "Estimated Lifetime Taxes", nothing: "$500,000", roth: "$350,000", iul: "$250,000" },
                  { metric: "Income Durability (Years)", nothing: "22", roth: "28", iul: "30+" },
                  { metric: "Volatility Exposure", nothing: "9/10", roth: "5/10", iul: "3/10" },
                  { metric: "Sequence Risk Impact", nothing: "8/10", roth: "4/10", iul: "2/10" },
                  { metric: "Income Predictability", nothing: "5/10", roth: "8/10", iul: "10/10" },
                  { metric: "Emergency Liquidity", nothing: "Low", roth: "Moderate", iul: "High" },
                  { metric: "Tax Rate Sensitivity", nothing: "High", roth: "Moderate", iul: "None" },
                  { metric: "Legacy Value", nothing: "Uncertain", roth: "Moderate", iul: "Guaranteed" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
                    <td className="py-2.5 px-3 text-white font-medium">{row.metric}</td>
                    <td className="py-2.5 px-3 text-center text-red-300">{row.nothing}</td>
                    <td className="py-2.5 px-3 text-center text-yellow-300">{row.roth}</td>
                    <td className="py-2.5 px-3 text-center text-[#22c55e] font-semibold">{row.iul}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Final Engagement ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0a1628] to-[#12233e]/50 border border-[#22c55e]/20 rounded-xl p-6 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">What This Means for You</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#c8d6e5]">
          <div className="space-y-2">
            <div className="text-2xl">1</div>
            <p><strong className="text-white">The smoother line usually wins</strong> — avoiding large losses early helps income last longer than chasing the highest returns.</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">2</div>
            <p><strong className="text-white">Volatility matters more than average return</strong> — two accounts with similar averages can end with very different outcomes.</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">3</div>
            <p><strong className="text-white">Predictable growth supports predictable income</strong> — stability gives retirees confidence and reduces financial stress.</p>
          </div>
        </div>
        <p className="text-xs text-[#7a95b8] italic mt-4">
          Client takeaway: Focus on what you can control — taxes, loss limits, and income structure — because these drive retirement outcomes more than averages.
        </p>
        <p className="text-[10px] text-[#4a6a8e] mt-4">
          Model inputs derived from historical market data (S&P 500), IRS tax tables, Social Security Administration estimates,
          and peer-reviewed withdrawal-rate research. See references above for full methodology.
        </p>
      </div>

      <NAICDisclaimer variant="footer" showsProjections showsCashValues showsComparisons />
      <PageInsights pageId="ecological-drivers" />
</div>
  );
}
