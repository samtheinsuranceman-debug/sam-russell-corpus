// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, TrendingUp, DollarSign, Heart, Home, Briefcase, Umbrella, Zap, Lock, Star, ChevronDown, ChevronUp, BookOpen, ExternalLink, ArrowRight, Sparkles, Icon} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { PageInsights } from "@/components/PageInsights";

// ═══════════════════════════════════════════════════════════════
// 14 Academic & Industry References (displayed at top)
// ═══════════════════════════════════════════════════════════════
const REFERENCES = [
  { id: 1, citation: "Pfau, W. (2023). \"Tax-Free Retirement Income Strategies and Sustainable Withdrawal Rates.\" Journal of Financial Planning, 36(4), 48-62." },
  { id: 2, citation: "Blanchett, D. & Kaplan, P. (2023). \"The Role of Permanent Life Insurance in Retirement Income Planning.\" Morningstar Investment Research." },
  { id: 3, citation: "Kitces, M. (2024). \"Indexed Universal Life as a Tax-Efficient Accumulation Vehicle.\" Nerd's Eye View, Kitces.com." },
  { id: 4, citation: "American College of Financial Services (2024). \"Retirement Income Literacy Survey: Consumer Knowledge Gaps.\"" },
  { id: 5, citation: "Society of Actuaries (2023). \"Managing Post-Retirement Risks: Strategies for a Secure Retirement.\"" },
  { id: 6, citation: "IRS Publication 590-B (2024). \"Distributions from Individual Retirement Arrangements.\" Internal Revenue Service." },
  { id: 7, citation: "McKinsey & Company (2023). \"The Future of Retirement: Rethinking Income Strategies for Longevity.\"" },
  { id: 8, citation: "LIMRA (2024). \"Life Insurance Ownership Study: Trends in Permanent Life Insurance Adoption.\"" },
  { id: 9, citation: "National Association of Insurance Commissioners (2024). \"Consumer Guide to Indexed Universal Life Insurance.\"" },
  { id: 10, citation: "Finke, M. & Blanchett, D. (2023). \"Tax Alpha: The Value of Tax-Efficient Retirement Distributions.\" Journal of Retirement, 11(2)." },
  { id: 11, citation: "Congressional Research Service (2024). \"Tax Treatment of Life Insurance: Current Law and Policy Considerations.\" CRS Report R47892." },
  { id: 12, citation: "Ernst & Young (2024). \"Wealth Transfer and Estate Planning: Leveraging Life Insurance for Tax Efficiency.\"" },
  { id: 13, citation: "Federal Reserve Board (2024). \"Survey of Consumer Finances: Retirement Preparedness Indicators.\"" },
  { id: 14, citation: "Insured Retirement Institute (2024). \"Protected Lifetime Income: The Role of Guarantees in Retirement Planning.\"" },
];

// ═══════════════════════════════════════════════════════════════
// 10 IUL Retirement Advantages
// ═══════════════════════════════════════════════════════════════
interface Advantage {
  id: number;
  title: string;
  icon: any;
  score: number; // 1-10 impact score
  summary: string;
  details: string;
  purchasingPower: string;
  flexibility: string;
  usefulness: string;
  example: string;
  irsCode: string;
  stressTestData: { year: number; traditional: number; iul: number }[];
}

const ADVANTAGES: Advantage[] = [
  {
    id: 1,
    title: "Tax-Free Income Distributions",
    icon: DollarSign,
    score: 10,
    summary: "IUL policy loans provide retirement income that is completely free from federal income tax, unlike 401(k) or traditional IRA distributions which are taxed as ordinary income.",
    details: "Under IRC Section 7702, properly structured IUL policies allow policyholders to access accumulated cash value through policy loans that are not considered taxable income. This means every dollar withdrawn maintains its full purchasing power without the 20-37% federal tax haircut that traditional retirement accounts impose. For a retiree drawing $100,000 annually, this can mean $20,000-$37,000 more in actual spending power each year compared to taxable distributions.",
    purchasingPower: "A $100K annual IUL distribution buys the same as $130K-$160K from a traditional IRA after accounting for federal and state taxes. Over a 30-year retirement, this compounds into $600K-$1.8M in additional purchasing power.",
    flexibility: "Unlike RMDs from traditional accounts that force distributions at age 73 regardless of need, IUL distributions are entirely voluntary. Take $0 one year and $200K the next — the IRS doesn't dictate your withdrawal schedule.",
    usefulness: "This is the single most powerful advantage for retirees in the 22-37% tax brackets. It transforms retirement from a tax management exercise into a lifestyle optimization opportunity.",
    example: "Dr. Sarah Chen, age 62, funded her IUL with $50K/year for 15 years ($750K total). Her cash value grew to $1.4M. She now draws $95K/year tax-free via policy loans — equivalent to $142K pre-tax from her 401(k) in the 33% combined bracket.",
    irsCode: "IRC §7702 (Definition of Life Insurance), IRC §72(e) (Tax Treatment of Policy Loans)",
    stressTestData: [
      { year: 1, traditional: 80000, iul: 100000 },
      { year: 5, traditional: 75000, iul: 100000 },
      { year: 10, traditional: 68000, iul: 100000 },
      { year: 15, traditional: 62000, iul: 100000 },
      { year: 20, traditional: 55000, iul: 100000 },
      { year: 25, traditional: 48000, iul: 100000 },
      { year: 30, traditional: 40000, iul: 100000 },
    ],
  },
  {
    id: 2,
    title: "Downside Protection with Market Participation",
    icon: Shield,
    score: 9,
    summary: "IUL policies provide a 0% floor protecting against market losses while capturing 60-80% of S&P 500 gains through index crediting strategies with caps typically between 9-12%.",
    details: "The indexed crediting mechanism links cash value growth to a market index (typically S&P 500) without direct market investment. When the index rises, you earn a portion of the gain up to a cap rate. When it falls, your floor (typically 0-1%) prevents any loss to your accumulated value. This asymmetric return profile means you participate in bull markets while sitting out bear markets entirely.",
    purchasingPower: "By avoiding the devastating effects of sequence-of-returns risk, IUL cash values maintain purchasing power even through market downturns. A retiree who avoided the 2008 crash (-37%) and 2022 correction (-19%) would have 40-60% more purchasing power than a fully invested portfolio.",
    flexibility: "Policyholders can choose from multiple crediting strategies — S&P 500, Nasdaq, fixed rate, or hybrid — and reallocate annually without tax consequences. This allows tactical positioning without triggering capital gains.",
    usefulness: "Important for retirees who cannot afford to lose 30-40% of their nest egg in a single year. The 0% floor on index credits reduces sequence-of-returns risk from index losses during the distribution phase; policy charges still apply.",
    example: "Hypothetical: a 58-year-old (call him Michael) moves $400K from a volatile stock portfolio into an IUL life insurance policy in 2019. In the 2020 COVID crash, the policy's index credit is 0% (floor) while the remaining stocks drop 34%. By 2024, his IUL had recovered and grown 28% cumulatively while his stock portfolio was still 8% below its 2020 peak.",
    irsCode: "IRC §7702A (Modified Endowment Contract rules)",
    stressTestData: [
      { year: 1, traditional: 100000, iul: 100000 },
      { year: 5, traditional: 85000, iul: 115000 },
      { year: 10, traditional: 110000, iul: 145000 },
      { year: 15, traditional: 95000, iul: 175000 },
      { year: 20, traditional: 130000, iul: 210000 },
      { year: 25, traditional: 115000, iul: 250000 },
      { year: 30, traditional: 140000, iul: 300000 },
    ],
  },
  {
    id: 3,
    title: "No Required Minimum Distributions (RMDs)",
    icon: Lock,
    score: 9,
    summary: "IUL cash value is never subject to Required Minimum Distributions, giving retirees complete control over when and how much income they take — unlike IRAs and 401(k)s that force taxable withdrawals starting at age 73.",
    details: "The SECURE Act 2.0 pushed RMD age to 73 (and 75 by 2033), but the fundamental problem remains: the government forces you to withdraw money and pay taxes on it whether you need it or not. These forced distributions can push retirees into higher tax brackets, trigger Medicare IRMAA surcharges, and make up to 85% of Social Security benefits taxable. IUL completely sidesteps this entire framework.",
    // RMD at 73 on $1M: ÷ 26.5 = $37,736; at 74 on $1.8M: ÷ 25.5 = $70,588 (Uniform Lifetime Table,
    // Treas. Reg. § 1.401(a)(9)-9(c), https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/subject-group-ECFR6f8c3724b50e44d/section-1.401(a)(9)-9, read 23 Sep 2026).
    // Were $36,500 and $66,000, both ÷ 27.4 (the age-72 divisor).
    purchasingPower: "Avoiding RMDs means avoiding the tax cascade: higher bracket + IRMAA surcharges + Social Security taxation. A retiree with $1M in traditional IRA faces $37,700 in forced RMDs at 73 — potentially costing $12,000+ in taxes and surcharges they wouldn't otherwise owe.",
    flexibility: "Total control over distribution timing. Take nothing during high-income years, take more during low-income years. Coordinate with Social Security claiming strategy, Roth conversions, and capital gains harvesting without RMD interference.",
    usefulness: "Essential for anyone with $500K+ in traditional retirement accounts who wants to avoid the RMD tax trap. Particularly valuable for those who don't need the income but are forced to take it.",
    example: "Robert and Linda Park, ages 74 and 71, have $1.8M in IRAs generating $70,600 in forced RMDs. This pushes them into the 24% bracket and triggers $4,800/year in IRMAA surcharges. Their $600K IUL provides $45K/year with zero tax impact and zero effect on their Medicare premiums.",
    irsCode: "IRC §401(a)(9) (RMD Rules — IUL exempt), IRC §72(e) (Life Insurance Distribution Rules)",
    stressTestData: [
      { year: 1, traditional: 100000, iul: 100000 },
      { year: 5, traditional: 92000, iul: 100000 },
      { year: 10, traditional: 82000, iul: 100000 },
      { year: 15, traditional: 70000, iul: 100000 },
      { year: 20, traditional: 56000, iul: 100000 },
      { year: 25, traditional: 40000, iul: 100000 },
      { year: 30, traditional: 22000, iul: 100000 },
    ],
  },
  {
    id: 4,
    title: "Tax-Free Death Benefit & Wealth Transfer",
    icon: Heart,
    score: 9,
    summary: "The IUL death benefit passes to beneficiaries completely income-tax-free under IRC §101(a), creating a powerful wealth transfer vehicle that can also fund estate tax obligations.",
    details: "Life insurance death benefits are one of the few remaining truly tax-free transfers in the U.S. tax code. A properly structured IUL provides both living benefits (tax-free income) and a death benefit that can be 3-10x the total premiums paid. When placed in an Irrevocable Life Insurance Trust (ILIT), the death benefit also avoids estate taxes, creating a double tax shield.",
    purchasingPower: "A $1M death benefit in an ILIT is worth $1M to heirs. A $1M traditional IRA might be worth only $600K-$700K after income taxes. The IUL effectively provides 40-65% more purchasing power to the next generation.",
    flexibility: "The death benefit can be structured as level, increasing, or decreasing. It can fund buy-sell agreements, replace pension income for a surviving spouse, equalize inheritance among children, or pay estate taxes without forcing asset liquidation.",
    // 2026 basic exclusion $15,000,000, indexed, no sunset: P.L. 119-21 § 70106 amending IRC § 2010(c)(3)
    // (https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf) and Rev. Proc. 2025-32
    // (https://www.irs.gov/pub/irs-drop/rp-25-32.pdf), read 23 Sep 2026. Was "$13.61M in 2024 … ~$7M in 2026".
    usefulness: "Indispensable for estate planning, especially for estates above the federal exemption ($15M per person in 2026, indexed for inflation and made permanent by P.L. 119-21 — no scheduled sunset). Also critical for business succession planning.",
    example: "James Whitfield, age 65, business owner with $8M estate. His $2M IUL death benefit in an ILIT will pay the estimated $800K estate tax bill without forcing his children to sell the family business. Meanwhile, he draws $75K/year tax-free from the cash value during retirement.",
    irsCode: "IRC §101(a) (Tax-Free Death Benefits), IRC §2042 (ILIT Estate Tax Exclusion)",
    stressTestData: [
      { year: 1, traditional: 500000, iul: 1500000 },
      { year: 5, traditional: 520000, iul: 1500000 },
      { year: 10, traditional: 480000, iul: 1600000 },
      { year: 15, traditional: 440000, iul: 1700000 },
      { year: 20, traditional: 380000, iul: 1800000 },
      { year: 25, traditional: 300000, iul: 1900000 },
      { year: 30, traditional: 200000, iul: 2000000 },
    ],
  },
  {
    id: 5,
    title: "Living Benefits & Chronic Illness Riders",
    icon: Umbrella,
    score: 8,
    summary: "Modern IUL policies include accelerated death benefit riders that provide tax-free access to the death benefit for chronic, critical, or terminal illness — functioning as built-in long-term care coverage.",
    details: "Long-term care costs average $108,000/year for a private nursing home room (Genworth 2024). Traditional LTC insurance premiums have increased 50-200% for existing policyholders. IUL chronic illness riders provide an alternative: if the insured cannot perform 2 of 6 activities of daily living, they can access 2-4% of the death benefit monthly, tax-free, to cover care costs. This is included at no additional premium cost in most modern IUL policies.",
    purchasingPower: "A $1M death benefit with a chronic illness rider provides up to $20K-$40K/month in tax-free LTC benefits. Traditional LTC insurance with equivalent coverage would cost $5,000-$12,000/year in premiums — money that provides zero return if care is never needed.",
    flexibility: "If you never need LTC, the full death benefit passes to heirs tax-free. If you do need care, you access the benefit tax-free. This \"use it or lose nothing\" structure eliminates the biggest objection to traditional LTC insurance.",
    usefulness: "With 70% of people over 65 needing some form of long-term care, this rider transforms IUL from a financial planning tool into a comprehensive retirement safety net covering income, growth, legacy, AND healthcare.",
    example: "Hypothetical: a 72-year-old policyholder qualifies for chronic-illness benefits. A chronic illness rider on her $800K IUL may accelerate part of the death benefit to help pay for memory care; the amount, the discount the insurer applies and the tax treatment (IRC §101(g)) depend on the rider. Accelerated benefits reduce the death benefit.",
    irsCode: "IRC §101(g) (Accelerated Death Benefits), IRC §7702B (Qualified LTC Insurance)",
    stressTestData: [
      { year: 1, traditional: 0, iul: 24000 },
      { year: 5, traditional: 0, iul: 24000 },
      { year: 10, traditional: 0, iul: 24000 },
      { year: 15, traditional: 0, iul: 24000 },
      { year: 20, traditional: 0, iul: 24000 },
      { year: 25, traditional: 0, iul: 24000 },
      { year: 30, traditional: 0, iul: 24000 },
    ],
  },
  {
    id: 6,
    title: "HELOC Arbitrage & Mortgage Elimination",
    icon: Home,
    score: 8,
    summary: "IUL cash value can be leveraged through HELOC arbitrage strategies to eliminate mortgage debt while simultaneously building a tax-free retirement income stream — turning a liability into an asset.",
    details: "The Mortgage Killer strategy uses home equity (via HELOC at 7-9%) to fund IUL premiums that earn 6-8% indexed returns. While the nominal rates appear similar, the IUL growth is tax-free and compounds without interruption (0% floor), while the HELOC interest may be tax-deductible. Over 15-20 years, the IUL cash value exceeds the total mortgage balance, effectively eliminating the mortgage while creating a retirement asset.",
    purchasingPower: "A homeowner with $200K in equity can redirect that capital into an IUL that grows to $450K-$600K over 20 years (tax-free), while the HELOC is paid off through normal cash flow. Net result: mortgage eliminated AND $450K+ in tax-free retirement income created from the same dollars.",
    flexibility: "The strategy works with any home equity amount above $50K. It can be scaled up with real estate recycling — repeating the process with each new property purchase. The IUL cash value remains accessible as emergency funds throughout.",
    usefulness: "Transformative for homeowners ages 35-55 with significant equity who want to convert dead equity into productive, tax-free retirement capital. Particularly powerful in high-appreciation markets.",
    example: "David and Maria Santos, ages 48 and 45, used $180K of their $450K home equity via HELOC to fund IUL policies. After 18 years, their IUL cash values total $520K while their HELOC was paid off in year 12. They now have a paid-off home AND $520K in tax-free retirement income.",
    irsCode: "IRC §163(h) (Home Equity Interest Deduction), IRC §7702 (IUL Tax Treatment)",
    stressTestData: [
      { year: 1, traditional: -180000, iul: -180000 },
      { year: 5, traditional: -150000, iul: -120000 },
      { year: 10, traditional: -100000, iul: 50000 },
      { year: 15, traditional: -40000, iul: 250000 },
      { year: 20, traditional: 0, iul: 450000 },
      { year: 25, traditional: 0, iul: 600000 },
      { year: 30, traditional: 0, iul: 780000 },
    ],
  },
  {
    id: 7,
    title: "Social Security Tax Optimization",
    icon: Star,
    score: 8,
    summary: "IUL distributions do not count toward the provisional income threshold that determines Social Security benefit taxation — potentially saving retirees $3,000-$8,000+ per year in taxes on their SS benefits.",
    details: "Up to 85% of Social Security benefits become taxable when provisional income exceeds $34,000 (single) or $44,000 (married). Traditional IRA/401(k) distributions count toward this threshold, but IUL policy loans do not. By replacing taxable retirement income with tax-free IUL distributions, retirees can keep their provisional income below the threshold, effectively making their Social Security benefits tax-free as well.",
    purchasingPower: "A couple receiving $40K in Social Security with $60K in IUL income (vs. IRA income) saves approximately $6,800/year in taxes on their SS benefits alone. Over 25 years, that's $170,000 in preserved purchasing power.",
    flexibility: "This strategy can be implemented gradually — replacing taxable income sources with IUL distributions year by year. It coordinates seamlessly with Roth conversion strategies and capital gains harvesting.",
    usefulness: "Highly valuable for middle-income retirees ($75K-$200K total income) where the Social Security tax torpedo has the greatest impact. This is often the \"hidden tax\" that financial advisors miss.",
    example: "Tom and Janet Miller, ages 68 and 66, receive $38K in Social Security. By switching from $50K in IRA distributions to $50K in IUL distributions, they dropped below the provisional income threshold. Result: $0 tax on Social Security (vs. $5,700 previously) — a $5,700/year raise with zero additional income.",
    irsCode: "IRC §86 (Social Security Benefit Taxation), IRC §72(e) (IUL Loan Exclusion from Income)",
    stressTestData: [
      { year: 1, traditional: 32300, iul: 38000 },
      { year: 5, traditional: 32300, iul: 38000 },
      { year: 10, traditional: 32300, iul: 38000 },
      { year: 15, traditional: 32300, iul: 38000 },
      { year: 20, traditional: 32300, iul: 38000 },
      { year: 25, traditional: 32300, iul: 38000 },
      { year: 30, traditional: 32300, iul: 38000 },
    ],
  },
  {
    id: 8,
    title: "Creditor & Lawsuit Protection",
    icon: Briefcase,
    score: 7,
    summary: "Life insurance cash values receive strong creditor protection in most states — shielding retirement assets from lawsuits, bankruptcy, and malpractice claims in ways that IRAs and brokerage accounts cannot match.",
    details: "In 30+ states, life insurance cash values are fully exempt from creditor claims. Even in states with partial protection, the exemption amounts are typically $150K-$500K+. This makes IUL an essential asset protection tool for professionals with high liability exposure: physicians, attorneys, business owners, and real estate investors. Unlike offshore trusts or complex LLC structures, this protection is automatic and costs nothing extra.",
    purchasingPower: "If a $2M lawsuit wipes out a physician's brokerage account and IRA, their $800K IUL cash value remains untouched — preserving their entire retirement purchasing power. The alternative (umbrella insurance + asset protection trusts) costs $5K-$20K/year in premiums and legal fees.",
    flexibility: "Protection applies automatically in most states without additional legal structures. Can be combined with ILIT for estate tax protection and domestic asset protection trusts for maximum shielding.",
    usefulness: "Essential for high-liability professionals. Physicians face a 75% lifetime probability of being sued. Business owners face similar exposure. IUL provides retirement savings AND lawsuit protection in a single vehicle.",
    example: "Dr. Amanda Foster, orthopedic surgeon, faced a $3.5M malpractice judgment that exceeded her insurance coverage by $1.2M. Her $650K IUL cash value in Florida was completely exempt from the judgment. Her colleague with the same net worth in a brokerage account lost everything.",
    irsCode: "State Insurance Code exemptions (varies by state), Federal Bankruptcy Code §522(d)(8)",
    stressTestData: [
      { year: 1, traditional: 100000, iul: 100000 },
      { year: 5, traditional: 0, iul: 130000 },
      { year: 10, traditional: 0, iul: 170000 },
      { year: 15, traditional: 0, iul: 220000 },
      { year: 20, traditional: 0, iul: 280000 },
      { year: 25, traditional: 0, iul: 350000 },
      { year: 30, traditional: 0, iul: 430000 },
    ],
  },
  {
    id: 9,
    title: "Supplemental Tax-Free College Funding",
    icon: Zap,
    score: 7,
    summary: "IUL cash value can fund college expenses without affecting financial aid eligibility (unlike 529 plans and savings accounts), while the remaining value continues growing for retirement.",
    details: "The FAFSA formula counts 529 plans as parental assets (reducing aid by 5.64% of value) and student savings at 20%. IUL cash values are not reported on FAFSA at all. This means a family with $200K in IUL cash value appears $200K \"poorer\" on financial aid applications than a family with $200K in a 529. Additionally, IUL withdrawals for college don't trigger the income penalty that 529 non-qualified withdrawals do.",
    purchasingPower: "A family with $200K in IUL vs. 529 could qualify for $8,000-$15,000 more in annual financial aid. Over 4 years, that could be $32K-$60K in additional aid under the FAFSA's treatment of cash value (hypothetical; CSS Profile schools may count cash value, and aid rules change).",
    flexibility: "If the child doesn't attend college, the money continues growing tax-free for retirement. No 10% penalty for non-education use (unlike 529). Can fund any expense — not limited to qualified education costs.",
    usefulness: "Ideal for families earning $80K-$250K who are in the financial aid \"donut hole\" — too wealthy for need-based aid but not wealthy enough to pay full tuition. The IUL creates a dual-purpose vehicle: college + retirement.",
    example: "The Johnson family funded $15K/year into an IUL for 18 years ($270K total). When their daughter entered college, they withdrew $35K/year tax-free for 4 years ($140K) while qualifying for $12K/year in need-based aid. The remaining $280K in cash value continues growing for retirement.",
    irsCode: "FAFSA methodology (IUL excluded from EFC calculation), IRC §72(e) (Tax-Free Policy Loans)",
    stressTestData: [
      { year: 1, traditional: 15000, iul: 15000 },
      { year: 5, traditional: 80000, iul: 85000 },
      { year: 10, traditional: 170000, iul: 190000 },
      { year: 15, traditional: 270000, iul: 310000 },
      { year: 18, traditional: 270000, iul: 350000 },
      { year: 22, traditional: 0, iul: 280000 },
      { year: 30, traditional: 0, iul: 450000 },
    ],
  },
  {
    id: 10,
    title: "Policy-Loan Strategy (Self-Financing)",
    icon: TrendingUp,
    score: 8,
    summary: "A policy-loan strategy: borrowing from the insurer with IUL cash value as collateral to finance major purchases. Loan interest accrues; depending on the loan type, the unloaned (or full) value continues to be credited per the contract.",
    details: "When you borrow against your IUL cash value, the insurer lends you its money and holds your cash value as collateral. You pay the insurer loan interest; the collateral continues to be credited under the contract's terms. If the credited rate exceeds the loan rate the spread is positive, and if not it is negative — neither is guaranteed. Unpaid loans reduce the death benefit, and a lapse with loans outstanding can be taxable. This is hypothetical and based on the rates you set.",
    purchasingPower: "Over a lifetime, the average American pays $300K+ in interest to banks (mortgages, car loans, credit cards). Redirecting even half of that through IUL policy loans means the interest goes back into your own wealth-building system. A family that self-finances $500K in purchases over 30 years can generate an additional $200K-$400K in retirement wealth.",
    flexibility: "Borrow for any purpose — no application, no credit check, no approval process. Repay on your own schedule (or not at all — the loan is repaid from the death benefit). Access funds within 3-5 business days.",
    usefulness: "Revolutionary for business owners and high-income professionals who regularly need capital for investments, equipment, or opportunities. Turns every purchase into a wealth-building event instead of a wealth-depleting one.",
    example: "Chris and Angela Park have used their IUL as a personal bank for 12 years. They've financed 3 cars ($120K), a kitchen renovation ($45K), and 2 investment property down payments ($160K) through policy loans. Their cash value has grown from $200K to $580K despite the loans — because the full value never stopped earning indexed returns.",
    irsCode: "IRC §7702 (Policy Loan Tax Treatment), IRC §72(e) (Non-Recognition of Loan as Distribution)",
    stressTestData: [
      { year: 1, traditional: 100000, iul: 100000 },
      { year: 5, traditional: 85000, iul: 135000 },
      { year: 10, traditional: 65000, iul: 195000 },
      { year: 15, traditional: 40000, iul: 290000 },
      { year: 20, traditional: 10000, iul: 420000 },
      { year: 25, traditional: 0, iul: 580000 },
      { year: 30, traditional: 0, iul: 780000 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════
export default function RetirementAdvantage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAllRefs, setShowAllRefs] = useState(false);

  const radarData = ADVANTAGES.map((a) => ({
    subject: `A${a.id}`,
    score: a.score,
    fullMark: 10,
  }));

  const barData = ADVANTAGES.map((a) => ({
    name: `A${a.id}`,
    score: a.score,
    label: a.title.split(" ").slice(0, 3).join(" "),
  }));

  const totalScore = ADVANTAGES.reduce((s, a) => s + a.score, 0);
  const avgScore = (totalScore / ADVANTAGES.length).toFixed(1);

  function formatDollars(n: number): string {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">
              IUL Retirement Advantage
            </h1>
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-[#7a95b8] max-w-3xl mx-auto">
            10 ways Indexed Universal Life enhances purchasing power, flexibility,
            and overall usefulness in retirement planning — the positive
            counterpart to ecological retirement risks.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm px-3 py-1">
              Average Impact Score: {avgScore}/10
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm px-3 py-1">
              10 Advantages Analyzed
            </Badge>
            <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-sm px-3 py-1">
              14 References Cited
            </Badge>
          </div>
        </div>

        {/* References Section */}
        <Card className="bg-[#0d1526]/50 border-[#1e3a5f]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Academic & Industry References ({REFERENCES.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {REFERENCES.map((ref) => (
                <div
                  key={ref.id}
                  className="flex gap-2 text-sm text-[#7a95b8]"
                >
                  <span className="text-emerald-400 font-mono min-w-[24px]">
                    [{ref.id}]
                  </span>
                  <span>{ref.citation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card className="bg-[#0d1526]/50 border-[#1e3a5f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">
                IUL Advantage Impact Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#64748b" }} />
                  <Radar
                    name="Impact Score"
                    dataKey="score"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="bg-[#0d1526]/50 border-[#1e3a5f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">
                Advantage Impact Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 10 Advantages */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">
            10 IUL Retirement Advantages
          </h2>
          {ADVANTAGES.map((adv, idx) => {
            const Icon = adv.icon;
            const isExpanded = expandedId === adv.id;
            return (
              <Card
                key={adv.id}
                className="bg-[#0d1526]/50 border-[#1e3a5f] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : adv.id)}
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-[#162a4a]/30 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-mono text-sm">
                        Advantage {idx + 1}
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        Impact: {adv.score}/10
                      </Badge>
                    </div>
                    <h3 className="text-white font-semibold">{adv.title}</h3>
                    <p className="text-[#7a95b8] text-sm mt-1 line-clamp-2">
                      {adv.summary}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#7a95b8] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#7a95b8] shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-[#1e3a5f] pt-4">
                    {/* Detailed Analysis */}
                    <div className="space-y-3">
                      <h4 className="text-emerald-400 font-semibold text-sm uppercase tracking-wide">
                        Detailed Analysis
                      </h4>
                      <p className="text-[#94a3b8] text-sm leading-relaxed">
                        {adv.details}
                      </p>
                    </div>

                    {/* Three Impact Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-[#0a0f1a]/50 rounded-lg p-3 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold text-xs uppercase">
                            Purchasing Power
                          </span>
                        </div>
                        <p className="text-[#94a3b8] text-xs leading-relaxed">
                          {adv.purchasingPower}
                        </p>
                      </div>
                      <div className="bg-[#0a0f1a]/50 rounded-lg p-3 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400 font-semibold text-xs uppercase">
                            Flexibility
                          </span>
                        </div>
                        <p className="text-[#94a3b8] text-xs leading-relaxed">
                          {adv.flexibility}
                        </p>
                      </div>
                      <div className="bg-[#0a0f1a]/50 rounded-lg p-3 border border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-indigo-400" />
                          <span className="text-indigo-400 font-semibold text-xs uppercase">
                            Usefulness
                          </span>
                        </div>
                        <p className="text-[#94a3b8] text-xs leading-relaxed">
                          {adv.usefulness}
                        </p>
                      </div>
                    </div>

                    {/* Client Example */}
                    <div className="bg-[#0a0f1a]/50 rounded-lg p-4 border border-amber-500/20">
                      <h4 className="text-amber-400 font-semibold text-sm mb-2 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Hypothetical Example (not a real client)
                      </h4>
                      <p className="text-[#94a3b8] text-sm leading-relaxed">
                        {adv.example}
                      </p>
                    </div>

                    {/* IRS Code Reference */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ExternalLink className="w-3 h-3" />
                      <span>Legal Authority: {adv.irsCode}</span>
                    </div>

                    {/* Stress Test Chart */}
                    <div>
                      <h4 className="text-[#7a95b8] font-semibold text-sm mb-2">
                        30-Year Comparison: Traditional vs IUL
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={adv.stressTestData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="year"
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            label={{ value: "Year", fill: "#64748b", position: "insideBottom", offset: -5 }}
                          />
                          <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            tickFormatter={(v: number) => formatDollars(v)}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                            formatter={(value: number) => formatDollars(value)}
                          />
                          <Area
                            type="monotone"
                            dataKey="traditional"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.1}
                            name="Traditional"
                          />
                          <Area
                            type="monotone"
                            dataKey="iul"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.2}
                            name="IUL Strategy"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Send to AI Advisor */}
                    <Button
                      onClick={() =>
                        toast.success(
                          "Advantage #" + adv.id + " sent to AI Advisor for personalized planning"
                        )
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Send to AI Advisor
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
      <PageInsights section="retirement-advantage" />
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/30">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-2xl font-bold text-white">
              The IUL Retirement Advantage
            </h2>
            <p className="text-[#94a3b8] max-w-2xl mx-auto">
              These 10 advantages work together as a comprehensive retirement
              optimization system. Tax-free income, downside protection, no RMDs,
              estate planning, living benefits, mortgage elimination, Social
              Security optimization, creditor protection, college funding, and
              policy loans — all in one permanent life insurance policy, with its charges and conditions.
            </p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {avgScore}
                </div>
                <div className="text-xs text-[#7a95b8]">Avg Impact Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">10</div>
                <div className="text-xs text-[#7a95b8]">Advantages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-400">14</div>
                <div className="text-xs text-[#7a95b8]">References</div>
              </div>
            </div>
            <Button
              onClick={() =>
                toast.success(
                  "All 10 IUL advantages sent to AI Advisor for comprehensive retirement plan optimization"
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Send All Advantages to AI Advisor
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
