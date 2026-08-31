// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  Shield, TrendingUp, CheckCircle2, Target, AlertTriangle, History, Save,
  BarChart3, ArrowRight, ArrowLeft, Gauge, Brain, Zap, DollarSign,
  Clock, Briefcase, CreditCard, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { RISK_QUESTIONS, RISK_CATEGORIES, type RiskQuestion } from "@/data/riskToleranceQuestions";
import { PageInsights } from "@/components/PageInsights";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { ExportToSlides } from "@/components/ExportToSlides";
import DepthSelector from "@/components/DepthSelector";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  financial_capacity: <DollarSign className="h-4 w-4" />,
  risk_attitude: <Brain className="h-4 w-4" />,
  time_horizon: <Clock className="h-4 w-4" />,
  investment_experience: <TrendingUp className="h-4 w-4" />,
  income_stability: <Briefcase className="h-4 w-4" />,
  debt_obligations: <CreditCard className="h-4 w-4" />,
  insurance_protection: <Shield className="h-4 w-4" />,
  tax_situation: <FileText className="h-4 w-4" />,
  goals_priorities: <Target className="h-4 w-4" />,
  behavioral_finance: <Zap className="h-4 w-4" />,
};

const PRODUCT_ALIGNMENT = [
  { minScore: 1, maxScore: 16, profile: "Ultra-Conservative", products: ["MYGA Fixed Annuities", "Treasury Bonds", "CD Ladders", "Money Market", "Short-Term Government Bonds"], iulAllocation: 0, annuityAllocation: 70, equityAllocation: 10, bondAllocation: 20, color: "text-blue-400", bgColor: "bg-blue-500" },
  { minScore: 17, maxScore: 33, profile: "Conservative", products: ["Fixed Index Annuities", "MYGA", "IUL (Conservative Index)", "Municipal Bonds", "Investment-Grade Corporate Bonds"], iulAllocation: 15, annuityAllocation: 40, equityAllocation: 20, bondAllocation: 25, color: "text-green-400", bgColor: "bg-green-500" },
  { minScore: 34, maxScore: 50, profile: "Moderate-Conservative", products: ["IUL (Balanced Index)", "FIA with Income Rider", "Balanced Funds", "REITs", "Dividend Aristocrats"], iulAllocation: 25, annuityAllocation: 25, equityAllocation: 30, bondAllocation: 20, color: "text-emerald-400", bgColor: "bg-emerald-500" },
  { minScore: 51, maxScore: 66, profile: "Moderate", products: ["IUL (S&P 500 Index)", "Growth Annuities", "Index Funds", "Real Estate", "International Equities"], iulAllocation: 30, annuityAllocation: 15, equityAllocation: 40, bondAllocation: 15, color: "text-amber-400", bgColor: "bg-amber-500" },
  { minScore: 67, maxScore: 83, profile: "Moderate-Aggressive", products: ["IUL (Uncapped Index)", "Variable Annuities", "Growth Stocks", "Alternative Investments", "Emerging Markets"], iulAllocation: 25, annuityAllocation: 10, equityAllocation: 50, bondAllocation: 15, color: "text-orange-400", bgColor: "bg-orange-500" },
  { minScore: 84, maxScore: 99, profile: "Aggressive", products: ["IUL (Multiplier Strategy)", "Crypto Allocation", "Growth Equities", "Leveraged Strategies", "Private Equity"], iulAllocation: 20, annuityAllocation: 5, equityAllocation: 65, bondAllocation: 10, color: "text-red-400", bgColor: "bg-red-500" },
];

function getCategoryAnalysis(categoryKey: string, pct: number): string {
  const level = pct >= 80 ? "high" : pct >= 50 ? "moderate" : "low";
  const analyses: Record<string, Record<string, string>> = {
    financial_capacity: {
      high: "Your financial capacity for risk is exceptionally strong. With substantial income, liquid reserves, and diversified assets, you have the financial foundation to absorb market volatility without materially impacting your lifestyle. This positions you well for growth-oriented strategies including IUL products with uncapped indexes, premium financing arrangements, and alternative investments. Your strong cash flow and savings rate provide a natural safety net that allows for longer recovery periods during market downturns.",
      moderate: "Your financial capacity for risk is moderate, suggesting a balanced approach is appropriate. While you have adequate income and reserves, there are areas where strengthening your financial foundation — such as building additional liquidity or reducing fixed obligations — could expand your investment options. Consider strategies that offer downside protection with growth potential, such as fixed index annuities or IUL products with floor protection.",
      low: "Your current financial capacity suggests a conservative approach to investment risk is prudent. Before pursuing growth-oriented strategies, focus on building your emergency fund to at least 6 months of expenses, reducing high-interest debt, and increasing your savings rate. Capital preservation should be your primary objective until your financial foundation is stronger. MYGA annuities and CD ladders can provide guaranteed returns while you build capacity.",
    },
    risk_attitude: {
      high: "Your psychological risk tolerance is high — you demonstrate the emotional discipline and conviction needed to weather market volatility without making panic-driven decisions. This is a valuable trait that allows you to capture the long-term equity risk premium. However, ensure your risk-taking is informed by analysis rather than overconfidence. Your comfort with uncertainty positions you well for strategies like uncapped IUL indexes, growth equities, and concentrated positions in high-conviction ideas.",
      moderate: "Your risk attitude reflects a balanced temperament — you can tolerate reasonable market fluctuations but prefer not to take unnecessary risks. This is a healthy approach that aligns well with diversified portfolios combining growth and protection. IUL products with moderate caps and floor protection, balanced index funds, and fixed index annuities with participation rates can provide the growth potential you seek while limiting downside exposure.",
      low: "Your responses indicate a strong preference for stability and predictability in your investments. This is not a weakness — it reflects a clear understanding of your emotional boundaries. Forcing yourself into volatile investments would likely lead to poor timing decisions during downturns. Focus on guaranteed products like MYGAs, fixed annuities, and conservative IUL strategies with strong floor protection. The peace of mind from stable returns often outperforms the theoretical gains from volatile strategies that investors abandon during market stress.",
    },
    time_horizon: {
      high: "Your long time horizon is one of your greatest financial assets. With decades before you need to draw on your investments, you can afford to ride out multiple market cycles and benefit from compound growth. This makes you an excellent candidate for growth-oriented IUL policies, equity-heavy allocations, and real estate strategies. Time is the great equalizer in investing — even aggressive strategies tend to converge toward positive outcomes over 20+ year periods. Consider maximizing contributions to tax-advantaged accounts and establishing a systematic investment plan.",
      moderate: "Your medium-term time horizon requires a thoughtful balance between growth and capital preservation. With 5-15 years before you need income, you have enough time to recover from a moderate downturn but not enough to be cavalier about major losses. A barbell approach — combining guaranteed income sources (annuities, bonds) with growth assets (IUL, equities) — can provide the best risk-adjusted outcome for your timeline. Begin transitioning a portion of your portfolio toward income-producing assets as you approach your target date.",
      low: "With a shorter time horizon, capital preservation and income generation should be your primary focus. You cannot afford a major drawdown close to when you need the money. Prioritize guaranteed income sources such as MYGA annuities, Social Security optimization, and pension maximization. If you have IUL policies, consider conservative index strategies with strong floor protection. Any equity exposure should be limited and focused on dividend-paying, low-volatility stocks. Sequence-of-returns risk is your biggest threat — having 2-3 years of expenses in cash or short-term bonds provides a critical buffer.",
    },
    investment_experience: {
      high: "Your extensive investment experience is a significant advantage. Having navigated multiple market cycles, you understand that volatility is the price of admission for superior long-term returns. Your familiarity with diverse asset classes — including alternatives, derivatives, and insurance-based products — means you can evaluate complex strategies on their merits. Consider sophisticated approaches like premium financing, multi-index IUL strategies, and tax-optimized asset location. Your experience also makes you a valuable partner in the planning process — leverage your knowledge while remaining open to strategies outside your historical comfort zone.",
      moderate: "You have a solid foundation of investment knowledge that positions you well for more sophisticated strategies. Your experience with stocks, bonds, and funds provides the context needed to understand how IUL products, annuities, and real estate investments fit into a comprehensive plan. Consider expanding your knowledge into areas like tax-loss harvesting, Roth conversion strategies, and insurance-based wealth building. Working closely with your advisor to understand the mechanics of each strategy will help you make more confident decisions.",
      low: "As a newer investor, building your financial literacy is as important as building your portfolio. Start with simple, well-diversified strategies like index funds and MYGA annuities while you learn. Avoid complex products until you fully understand their mechanics, costs, and risks. Your advisor should explain every recommendation in plain language — never invest in something you don't understand. The good news is that simple strategies often outperform complex ones, and your willingness to learn puts you ahead of many investors who never seek professional guidance.",
    },
    income_stability: {
      high: "Your highly stable and diversified income sources provide an exceptional foundation for investment risk-taking. With reliable cash flow from multiple sources, you can afford to lock up capital in longer-term strategies, weather market downturns without forced selling, and take advantage of opportunities that require patience. This stability makes you an excellent candidate for premium financing, real estate investment, and growth-oriented IUL strategies. Your income diversification also provides natural protection against industry-specific disruptions.",
      moderate: "Your income stability is adequate for a balanced investment approach. While your primary income is reasonably secure, consider strategies that don't require you to make additional contributions during periods of income disruption. Automated investment plans, dollar-cost averaging, and strategies with flexible premium options (like IUL) can accommodate income variability. Building passive income streams through dividend investments, rental properties, or annuity income riders can further strengthen your financial resilience.",
      low: "Income variability is a significant factor in your risk profile. Before pursuing aggressive investment strategies, focus on stabilizing your cash flow through emergency reserves, disability insurance, and income diversification. Variable income earners should avoid strategies that require fixed ongoing contributions. Instead, consider flexible strategies where you can increase contributions during good months and reduce them during lean periods. IUL policies with flexible premium features can accommodate this pattern. Building a larger cash reserve (12+ months) is especially important for variable-income households.",
    },
    debt_obligations: {
      high: "Your minimal debt position is a powerful financial advantage. Without the drag of high-interest payments, more of your income can flow toward wealth-building strategies. Your clean balance sheet also positions you favorably for leverage-based strategies like premium financing, where you can borrow at favorable rates to fund insurance policies that earn higher returns. Consider using your debt-free status to accelerate wealth building through maximized retirement contributions, IUL funding, and strategic real estate investment.",
      moderate: "Your debt level is manageable but warrants attention in your financial plan. Before allocating aggressively to growth investments, ensure your debt structure is optimized — refinance high-rate obligations, consider consolidation where it makes sense, and prioritize paying off anything above 6-7% interest. A parallel approach of debt reduction and wealth building can work well: fund your IUL and retirement accounts while systematically eliminating consumer debt. The psychological benefit of reducing debt often improves overall financial decision-making.",
      low: "Your current debt obligations significantly impact your risk capacity. High debt-to-income ratios and expensive interest rates create a drag on wealth building that no investment strategy can overcome. Prioritize an aggressive debt reduction plan — the guaranteed return from eliminating a 20% credit card balance far exceeds any investment return. Once high-interest debt is eliminated, redirect those payments toward wealth building. Consider debt consolidation, balance transfers, or refinancing to reduce interest costs immediately. Your financial advisor should help you create a debt elimination timeline before recommending growth-oriented investments.",
    },
    insurance_protection: {
      high: "Your comprehensive insurance and protection coverage creates a strong safety net that supports more aggressive investment strategies. With adequate life insurance, disability coverage, liability protection, and estate planning in place, you've effectively transferred many catastrophic risks to insurance companies. This means your investment portfolio doesn't need to serve as your emergency backstop — it can focus purely on growth and income generation. Review your coverage annually to ensure it keeps pace with your growing wealth and evolving needs.",
      moderate: "Your insurance coverage has some gaps that should be addressed as part of your comprehensive financial plan. Missing or inadequate coverage in areas like disability insurance, umbrella liability, or long-term care creates hidden risks that could derail your financial plan regardless of investment performance. Prioritize filling the most critical gaps — disability insurance (protecting your income) and adequate life insurance (protecting your family) — before increasing investment risk. The cost of proper insurance is almost always less than the cost of being uninsured when disaster strikes.",
      low: "Significant gaps in your insurance and protection coverage represent your most urgent financial priority. Without adequate life insurance, disability coverage, and estate planning, even a well-performing investment portfolio can be wiped out by a single catastrophic event. Before making any investment decisions, work with your advisor to establish: adequate life insurance (10-15x income), disability coverage (60-70% of income), an umbrella liability policy, and basic estate documents (will, power of attorney, healthcare directive). These protections form the foundation upon which all other financial planning is built.",
    },
    tax_situation: {
      high: "Your sophisticated tax planning and high tax bracket make tax-efficient strategies extremely valuable. Every dollar saved in taxes compounds over time, making tax planning one of the highest-return activities in your financial plan. You're well-positioned to benefit from IUL's tax-free loan provisions, Roth conversion ladders, charitable giving strategies (DAFs, CRTs), and strategic asset location across taxable, tax-deferred, and tax-free accounts. Consider working with your CPA and financial advisor together to identify multi-year tax planning opportunities that can save hundreds of thousands over your lifetime.",
      moderate: "Your tax situation offers meaningful optimization opportunities. Consider establishing or maximizing contributions to tax-advantaged accounts (401k, IRA, HSA), exploring Roth conversions during lower-income years, and implementing basic tax-loss harvesting. IUL policies can provide tax-free retirement income that doesn't increase your adjusted gross income — a powerful benefit as you approach higher tax brackets. Working with a CPA who does proactive planning (not just filing) can identify strategies that save significantly more than their cost.",
      low: "While your current tax bracket may be lower, this is actually an opportunity. Lower-bracket years are ideal for Roth conversions — paying taxes now at a lower rate to create tax-free income in retirement when your bracket may be higher. Maximize any employer match in retirement accounts, consider Roth IRA contributions, and explore whether IUL's tax-free growth and income features align with your long-term tax planning. Even basic strategies like maximizing standard deductions and timing income recognition can yield meaningful savings.",
    },
    goals_priorities: {
      high: "Your ambitious financial goals — wealth building, legacy creation, and lifestyle enhancement — align well with growth-oriented strategies. With clear objectives and the financial capacity to pursue them, you can implement a multi-pronged approach: aggressive retirement accumulation, IUL for tax-free legacy wealth, real estate for income and appreciation, and strategic philanthropy for tax optimization. The key is ensuring each strategy serves a specific goal and that your overall plan remains coordinated. Regular reviews with your advisor should track progress toward each goal and adjust allocations as priorities evolve.",
      moderate: "Your financial goals reflect a balanced set of priorities — maintaining your lifestyle, building retirement security, and leaving something for your heirs. This balanced approach calls for a diversified strategy that addresses multiple objectives simultaneously. IUL can serve dual purposes (retirement income and death benefit), balanced funds provide growth with stability, and income annuities can guarantee baseline retirement expenses. Prioritize your goals in order of urgency and allocate resources accordingly — retirement security typically comes first, followed by legacy and lifestyle goals.",
      low: "Your current financial priorities appropriately focus on foundational needs — debt elimination, emergency savings, and basic retirement funding. These are the building blocks that must be in place before pursuing more ambitious goals. Create a sequential plan: first build your emergency fund, then eliminate high-interest debt, then maximize employer retirement matches, then expand into growth strategies. Each milestone achieved unlocks the next level of financial planning. Don't be discouraged by the journey — every wealthy person started with these same foundational steps.",
    },
    behavioral_finance: {
      high: "Your behavioral profile suggests strong emotional discipline and a systematic approach to financial decision-making. You're less susceptible to common cognitive biases like loss aversion, herd mentality, and recency bias. This emotional intelligence is arguably more valuable than financial knowledge — studies consistently show that investor behavior is the single largest determinant of investment outcomes. Your disciplined temperament allows you to implement and stick with strategies that require patience, such as long-term IUL accumulation, systematic rebalancing, and contrarian investing during market downturns.",
      moderate: "Your behavioral profile shows a healthy balance of emotional awareness and rational decision-making. You recognize that emotions can influence financial decisions and take steps to manage them. To further strengthen your behavioral discipline, consider implementing systematic rules: automatic contributions, predetermined rebalancing triggers, and a written investment policy statement that guides decisions during emotional periods. Having a trusted advisor who can serve as a behavioral coach during market stress is one of the most valuable aspects of the advisory relationship.",
      low: "Your responses suggest that emotions play a significant role in your financial decision-making. This is extremely common — behavioral finance research shows that most investors are wired to make suboptimal decisions during periods of market stress. The most important step you can take is acknowledging this tendency and building systems to counteract it: automate contributions so you don't have to decide each month, avoid checking your portfolio during volatile periods, and establish a relationship with an advisor who can talk you through emotional moments. Consider simpler, more automated strategies that require fewer decisions — index funds, target-date funds, and guaranteed products like annuities can remove the temptation to make impulsive changes.",
    },
  };
  return analyses[categoryKey]?.[level] || "";
}

function getOverallAnalysis(score: number, profileName: string): string {
  if (score >= 84) {
    return `Your composite Risk Tolerance Score of ${score} places you in the ${profileName} category, indicating that you possess both the financial capacity and psychological temperament to pursue maximum-growth strategies. Your strong financial foundation, extensive investment experience, and emotional discipline create the ideal conditions for aggressive wealth building. However, even aggressive investors benefit from strategic diversification and downside protection — consider using IUL products with uncapped indexes as a tax-advantaged growth engine alongside your equity portfolio. The floor protection in IUL ensures that even in severe downturns, your policy value never decreases due to market losses, providing a behavioral anchor that helps you stay invested in your more volatile positions.`;
  }
  if (score >= 67) {
    return `Your composite Risk Tolerance Score of ${score} places you in the ${profileName} category, reflecting a strong growth orientation tempered by practical wisdom. You understand that higher returns require accepting volatility, but you also recognize the value of strategic protection. This profile is well-suited for a core-satellite approach: a core of diversified growth assets (index funds, growth IUL) surrounded by satellite positions in alternatives, real estate, and tactical opportunities. Your willingness to embrace calculated risk, combined with your financial capacity, positions you to build significant wealth over your investment horizon while maintaining enough protection to sleep well at night.`;
  }
  if (score >= 51) {
    return `Your composite Risk Tolerance Score of ${score} places you in the ${profileName} category — the most common profile among successful long-term investors. Your balanced approach to risk and reward, combined with adequate financial capacity, creates the foundation for a well-diversified portfolio that can grow steadily while protecting against catastrophic losses. Consider a balanced allocation across IUL (for tax-free growth and protection), index funds (for market participation), fixed index annuities (for guaranteed income), and real estate (for inflation protection). This diversified approach historically delivers strong risk-adjusted returns while limiting drawdowns to levels most investors can tolerate.`;
  }
  if (score >= 34) {
    return `Your composite Risk Tolerance Score of ${score} places you in the ${profileName} category, indicating a preference for stability with modest growth. This is a perfectly valid and often successful approach — many of the wealthiest retirees built their wealth through consistent, conservative strategies rather than aggressive risk-taking. Focus on strategies that provide downside protection with upside participation: fixed index annuities with income riders, conservative IUL strategies with strong floor protection, and high-quality dividend stocks. Your portfolio should prioritize capital preservation while still growing faster than inflation to maintain your purchasing power over time.`;
  }
  if (score >= 17) {
    return `Your composite Risk Tolerance Score of ${score} places you in the ${profileName} category, reflecting a strong preference for capital preservation and predictable returns. Your financial situation and/or emotional temperament suggest that guaranteed products should form the core of your portfolio. MYGA annuities, Treasury bonds, and CD ladders can provide reliable returns without market risk. If you're interested in modest growth potential, consider a small allocation to conservative IUL or fixed index annuities where your principal is protected by a 0% floor. The most important thing is that your investment strategy allows you to sleep at night — anxiety about investments often leads to worse decisions than the investments themselves.`;
  }
  return `Your composite Risk Tolerance Score of ${score} places you in the ${profileName} category, indicating that capital preservation is your absolute priority. This is especially appropriate if you're in or near retirement, have limited financial capacity for losses, or simply value peace of mind above all else. Focus exclusively on guaranteed products: MYGA annuities for competitive fixed rates, Treasury bonds for government-backed security, and FDIC-insured CDs for liquidity. Avoid any product with market risk until your financial situation or comfort level changes. Work with your advisor to ensure your guaranteed income sources (Social Security, pensions, annuities) cover your essential expenses before considering any growth-oriented investments.`;
}

export default function RiskToleranceScoring() {
  const { data: clientData } = useClientData();
  const [depthLevel, setDepthLevel] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionInCategory, setCurrentQuestionInCategory] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  const selectedClientId = clientData?.clientId ?? null;

  const saveSnapshotMut = trpc.riskProfile.saveSnapshot.useMutation();
  const historyQuery = trpc.riskProfile.getHistory.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const driftQuery = trpc.riskProfile.detectDrift.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId && showResults }
  );

  const filteredQuestions = useMemo(() => {
    if (!depthLevel) return RISK_QUESTIONS;
    return RISK_QUESTIONS.filter((q) => (q.priority ?? 1) <= depthLevel);
  }, [depthLevel]);

  if (!depthLevel) {
    return (
      <AppShell>
        <div className="container py-8">
          <DepthSelector
            onSelect={setDepthLevel}
            title="Risk Tolerance Assessment Depth"
            description="Choose how thorough you want the risk assessment to be. Each level adds 20 more questions."
          />
        </div>
      </AppShell>
    );
  }

  const questionsByCategory = useMemo(() => {
    const map: Record<string, RiskQuestion[]> = {};
    RISK_CATEGORIES.forEach((c) => { map[c.key] = []; });
    filteredQuestions.forEach((q) => {
      if (map[q.category]) map[q.category].push(q);
    });
    return map;
  }, [filteredQuestions]);

  const currentCategory = RISK_CATEGORIES[currentCategoryIndex];
  const currentCategoryQuestions = questionsByCategory[currentCategory?.key] || [];
  const currentQuestion = currentCategoryQuestions[currentQuestionInCategory];

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = filteredQuestions.length;
  const progress = (totalAnswered / totalQuestions) * 100;

  const score = useMemo(() => {
    const answered = Object.values(answers);
    if (answered.length === 0) return 0;
    const rawScore = answered.reduce((s, v) => s + v, 0);
    const maxPossible = answered.length * 5;
    return Math.max(1, Math.round((rawScore / maxPossible) * 99));
  }, [answers]);

  const categoryScores = useMemo(() => {
    return RISK_CATEGORIES.map((cat) => {
      const qs = questionsByCategory[cat.key];
      const answered = qs.filter((q) => answers[q.id] !== undefined);
      const total = answered.reduce((s, q) => s + (answers[q.id] || 0), 0);
      const pct = answered.length > 0 ? Math.round((total / (answered.length * 5)) * 100) : 0;
      return {
        ...cat,
        score: pct,
        answered: answered.length,
        total: qs.length,
        complete: answered.length === qs.length,
      };
    });
  }, [answers, questionsByCategory]);

  const profile = useMemo(() => {
    return PRODUCT_ALIGNMENT.find((p) => score >= p.minScore && score <= p.maxScore) || PRODUCT_ALIGNMENT[0];
  }, [score]);

  const allAnswered = totalAnswered === totalQuestions;

  const categoryAnsweredCount = (catKey: string) => {
    return questionsByCategory[catKey].filter((q) => answers[q.id] !== undefined).length;
  };

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (currentQuestionInCategory < currentCategoryQuestions.length - 1) {
      setTimeout(() => setCurrentQuestionInCategory(prev => prev + 1), 300);
    }
  };

  const goNextCategory = () => {
    if (currentCategoryIndex < RISK_CATEGORIES.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      setCurrentQuestionInCategory(0);
    } else if (allAnswered) {
      setShowResults(true);
    }
  };

  const goPrevCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
      setCurrentQuestionInCategory(0);
    }
  };

  const toggleCategoryExpand = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const resetAssessment = () => {
    setAnswers({});
    setCurrentCategoryIndex(0);
    setCurrentQuestionInCategory(0);
    setShowResults(false);
    setExpandedCategories(new Set());
  };

  return (
    <AppShell>
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gauge className="h-6 w-6 text-primary" />
              Comprehensive Risk Tolerance Assessment
            </h1>
            <p className="text-muted-foreground mt-1">
              100-question deep analysis across 10 dimensions — producing your personalized Risk Number (1-99)
            </p>
          </div>
          <div className="flex gap-2">
            {allAnswered && !showResults && (
              <Button onClick={() => setShowResults(true)}>
                <BarChart3 className="h-4 w-4 mr-1" /> View Full Results
              </Button>
            )}
            {showResults && (
              <div className="flex gap-2">
                <ExportToSlides
                  toolName="Risk Tolerance Assessment"
                  getSections={() => [
                    {
                      title: "Risk Profile Summary",
                      items: [
                        { label: "Risk Score", value: score.toString() },
                        { label: "Profile", value: profile.profile },
                      ],
                    },
                    {
                      title: "Recommended Allocation",
                      items: [
                        { label: "IUL / Cash Value Life Insurance", value: `${profile.iulAllocation}%` },
                        { label: "Annuities (MYGA, FIA, SPIA)", value: `${profile.annuityAllocation}%` },
                        { label: "Equities (Stocks, ETFs, Funds)", value: `${profile.equityAllocation}%` },
                        { label: "Fixed Income (Bonds, Treasuries)", value: `${profile.bondAllocation}%` },
                      ],
                    },
                    {
                      title: "Category Scores",
                      items: categoryScores.map((cat) => ({
                        label: cat.label,
                        value: `${cat.score}%`
                      }))
                    }
                  ]}
                />
                {selectedClientId && !snapshotSaved && (
                  <Button
                    onClick={async () => {
                      if (!selectedClientId) return;
                      setSavingSnapshot(true);
                      try {
                        const result = await saveSnapshotMut.mutateAsync({
                          clientId: selectedClientId,
                          overallScore: score,
                          depthLevel: depthLevel!,
                          questionsAnswered: totalAnswered,
                          categories: categoryScores.map((c) => ({ key: c.key, label: c.label, score: c.score })),
                          riskCategory: profile.profile.toLowerCase().replace(/[- ]/g, '_'),
                          trigger: 'client_requested',
                        });
                        setSnapshotSaved(true);
                        historyQuery.refetch();
                        driftQuery.refetch();
                        if (result.flaggedForReassessment) {
                          toast.warning(`Behavioral drift detected (${result.driftScore} pts) — reassessment recommended`);
                        } else {
                          toast.success('Risk snapshot saved to client profile');
                        }
                      } catch { toast.error('Failed to save snapshot'); }
                      setSavingSnapshot(false);
                    }}
                    disabled={savingSnapshot}
                  >
                    <Save className="h-4 w-4 mr-1" /> {savingSnapshot ? 'Saving...' : 'Save Snapshot'}
                  </Button>
                )}
                {snapshotSaved && <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Saved</Badge>}
                <Button variant="outline" onClick={() => { resetAssessment(); setSnapshotSaved(false); }}>
                  Retake Assessment
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Global Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">{totalAnswered} of {totalQuestions} questions answered</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 mb-4" />
            {/* Category Progress Pills */}
            <div className="flex flex-wrap gap-2">
              {RISK_CATEGORIES.map((cat, i) => {
                const answered = categoryAnsweredCount(cat.key);
                const total = questionsByCategory[cat.key].length;
                const isComplete = answered === total;
                const isCurrent = i === currentCategoryIndex && !showResults;
                return (
                  <button
                    key={cat.key}
                    onClick={() => { if (!showResults) { setCurrentCategoryIndex(i); setCurrentQuestionInCategory(0); } }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/10 text-primary"
                        : isComplete
                        ? "border-green-500/30 bg-green-500/10 text-green-600"
                        : answered > 0
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50"
                    }`}
                  >
                    {CATEGORY_ICONS[cat.key]}
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                    <span className="ml-1 opacity-70">{answered}/{total}</span>
                    {isComplete && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {!showResults ? (
          <div className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {CATEGORY_ICONS[currentCategory.key]}
              </div>
              <div className="flex-1">
                <div className="font-semibold">
                  Category {currentCategoryIndex + 1} of {RISK_CATEGORIES.length}: {currentCategory.label}
                </div>
                <div className="text-sm text-muted-foreground">{currentCategory.description}</div>
              </div>
              <Badge variant="outline">
                {categoryAnsweredCount(currentCategory.key)}/{currentCategoryQuestions.length}
              </Badge>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Question {currentQuestionInCategory + 1} of {currentCategoryQuestions.length}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Overall: {totalAnswered + (answers[currentQuestion.id] !== undefined ? 0 : 0)}/{totalQuestions}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2">{currentQuestion.text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(currentQuestion.id, option.value)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.detail}</div>
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentQuestionInCategory > 0) {
                      setCurrentQuestionInCategory(prev => prev - 1);
                    } else {
                      goPrevCategory();
                    }
                  }}
                  disabled={currentCategoryIndex === 0 && currentQuestionInCategory === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {currentCategoryIndex * 10 + currentQuestionInCategory + 1} / {totalQuestions}
              </div>

              <div className="flex gap-2">
                {currentQuestionInCategory < currentCategoryQuestions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionInCategory(prev => prev + 1)}
                    disabled={!currentQuestion || !answers[currentQuestion.id]}
                  >
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : currentCategoryIndex < RISK_CATEGORIES.length - 1 ? (
                  <Button onClick={goNextCategory}>
                    Next Category <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : allAnswered ? (
                  <Button onClick={() => setShowResults(true)}>
                    <BarChart3 className="h-4 w-4 mr-1" /> View Results
                  </Button>
                ) : (
                  <Button disabled>
                    Complete All Questions
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Jump — All Questions in Current Category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Jump — {currentCategory.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentCategoryQuestions.map((q, i) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = i === currentQuestionInCategory;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionInCategory(i)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium border transition-all ${
                          isCurrent
                            ? "border-primary bg-primary text-primary-foreground"
                            : isAnswered
                            ? "border-green-500/30 bg-green-500/10 text-green-600"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════
             RESULTS VIEW — Comprehensive Analysis
             ═══════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rc-card bg-card border rounded-lg p-4">
                <div className="text-sm font-semibold text-foreground mb-3">Category Scores</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={categoryScores.length ? categoryScores : [{ label: "Empty", score: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => val.substring(0, 4)} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                    <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rc-card bg-card border rounded-lg p-4">
                <div className="text-sm font-semibold text-foreground mb-3">Recommended Allocation</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const data = [
                          { name: "IUL", value: profile.iulAllocation },
                          { name: "Annuities", value: profile.annuityAllocation },
                          { name: "Equities", value: profile.equityAllocation },
                          { name: "Bonds", value: profile.bondAllocation },
                        ].filter((d) => d.value > 0);
                        return data.length ? data : [{ name: "Empty", value: 1 }];
                      })()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {["#22c55e", "#3b82f6", "#f0c040", "#a78bfa"].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Drift Alert */}
            {driftQuery.data?.hasDrift && (
              <Card className={driftQuery.data.driftScore >= 15 ? 'border-red-500/50 bg-red-500/5' : 'border-amber-500/50 bg-amber-500/5'}>
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 shrink-0 ${driftQuery.data.driftScore >= 15 ? 'text-red-500' : 'text-amber-500'}`} />
                  <div>
                    <div className="font-semibold text-sm">{driftQuery.data.message}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Previous score: {driftQuery.data.previousScore} → Current: {driftQuery.data.latestScore} ({driftQuery.data.direction === 'more_aggressive' ? '↑ More Aggressive' : '↓ More Conservative'}) • {driftQuery.data.daysBetween} days apart
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Snapshot History */}
            {historyQuery.data && historyQuery.data.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Risk Profile History ({historyQuery.data.length} snapshots)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {historyQuery.data.slice(0, 10).map((snap) => (
                      <div key={snap.id} className="shrink-0 p-2 rounded-lg border text-center min-w-[80px]">
                        <div className="text-lg font-bold">{snap.overallScore}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(snap.createdAt).toLocaleDateString()}</div>
                        {snap.flaggedForReassessment && <Badge variant="destructive" className="text-[9px] mt-1">DRIFT</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Score Display */}
            <Card className="border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Your Composite Risk Tolerance Score</div>
                <div className="relative inline-flex items-center justify-center w-48 h-48 mb-4">
                  <svg className="w-48 h-48 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                      className="text-primary"
                      strokeDasharray={`${score * 3.27} 327`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-5xl font-bold">{score}</div>
                    <div className="text-xs text-muted-foreground">out of 99</div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${profile.color}`}>{profile.profile}</div>
                <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
                  Based on 100 questions across 10 dimensions of financial risk assessment
                </p>
              </CardContent>
            </Card>

            {/* Overall Written Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Comprehensive Risk Profile Analysis
                </CardTitle>
                <CardDescription>
                  Personalized assessment based on your responses across all 10 categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {getOverallAnalysis(score, profile.profile)}
                </p>
              </CardContent>
            </Card>

            {/* Category-by-Category Breakdown with Written Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Category Analysis</CardTitle>
                <CardDescription>Click each category to read your personalized analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryScores.map((cat) => {
                  const isExpanded = expandedCategories.has(cat.key);
                  return (
                    <div key={cat.key} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategoryExpand(cat.key)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          {CATEGORY_ICONS[cat.key]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{cat.label}</div>
                          <Progress value={cat.score} className="h-2 mt-1" />
                        </div>
                        <div className="text-right shrink-0 mr-2">
                          <div className="text-lg font-bold">{cat.score}%</div>
                          <div className="text-xs text-muted-foreground">
                            {cat.score >= 80 ? "High" : cat.score >= 50 ? "Moderate" : "Low"}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t bg-muted/10">
                          <p className="text-sm leading-relaxed text-muted-foreground mt-3">
                            {getCategoryAnalysis(cat.key, cat.score)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Product Alignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Product Alignment & Recommended Allocation</CardTitle>
                <CardDescription>Based on your {profile.profile} risk profile, the following allocation and product mix is recommended</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-4">Recommended Asset Allocation</h4>
                    <div className="space-y-4">
                      {[
                        { label: "IUL / Cash Value Life Insurance", value: profile.iulAllocation, color: "bg-green-500" },
                        { label: "Annuities (MYGA, FIA, SPIA)", value: profile.annuityAllocation, color: "bg-blue-500" },
                        { label: "Equities (Stocks, ETFs, Funds)", value: profile.equityAllocation, color: "bg-amber-500" },
                        { label: "Fixed Income (Bonds, Treasuries)", value: profile.bondAllocation, color: "bg-purple-500" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item.label}</span>
                            <span className="font-bold">{item.value}%</span>
                          </div>
                          <div className="h-4 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Recommended Products</h4>
                    <div className="space-y-2">
                      {profile.products.map((product, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-card border">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">{product}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Profile Spectrum */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Profile Spectrum</CardTitle>
                <CardDescription>Where you fall on the risk tolerance spectrum compared to all profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {PRODUCT_ALIGNMENT.map((p) => {
                    const isActive = p.profile === profile.profile;
                    return (
                      <div key={p.profile} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isActive ? "border-primary bg-primary/5 ring-1 ring-primary/20" : ""}`}>
                        <div className="w-16 text-right shrink-0">
                          <span className="text-sm font-mono">{p.minScore}-{p.maxScore}</span>
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground/30"}`}
                              style={{ width: `${((p.maxScore - p.minScore) / 99) * 100}%`, marginLeft: `${(p.minScore / 99) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className={`w-48 text-sm font-medium shrink-0 ${isActive ? "text-primary" : ""}`}>
                          {p.profile} {isActive && <Badge className="ml-1 text-xs">YOU</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        <NAICDisclaimer variant="compact" showsProjections />
      </div>
          <PageInsights pageId="risk-tolerance" />
    </AppShell>
  );
}
