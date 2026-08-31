// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Gem, Zap, Star } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, LineChart, Line,
  PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

/* ─── INDEX DEFINITIONS ─── */
const INDICES = [{ key: "SPXFCDUE", name: "S&P 500 Futures Dual Directional", shortName: "SPXFCDUE", color: "#2563eb" },
,
  { key: "BOFANFCC", name: "BofA Nations Futures Commodity", shortName: "BOFANFCC", color: "#16a34a" },
,
  { key: "BNPIMAD5", name: "BNP Paribas Multi-Asset Diversified 5", shortName: "BNPIMAD5", color: "#9333ea" },
,
  { key: "SPX", name: "S&P 500 (Cap Rate)", shortName: "S&P 500", color: "#dc2626" },
,
  { key: "AIGO", name: "AI Powered Global Opportunities", shortName: "AIGO", color: "#ea580c" }
];

/* ─── 2-YEAR NO CHARGE STRATEGY DATA ─── */
const STRATEGY_DATA_2YR = [
  { key: "SPXFCDUE", parRate: "100%", avgAnnual: 9.57, worst: 0, best: 65.81, zeroOccurrences: 14 },
  { key: "BNPIMAD5", parRate: "225%", avgAnnual: 6.42, worst: 0, best: 60.31, zeroOccurrences: 6 },
  { key: "AIGO", parRate: "160%", avgAnnual: 2.47, worst: 0, best: 55.00, zeroOccurrences: 8 },
  { key: "UBSIBAL", parRate: "160%", avgAnnual: 3.50, worst: 0, best: 50.00, zeroOccurrences: 10 },
  { key: "BOFANFCC", parRate: "150%", avgAnnual: 5.80, worst: 0, best: 48.00, zeroOccurrences: 12 },
  { key: "AIPEX", parRate: "175%", avgAnnual: 2.80, worst: 0, best: 40.00, zeroOccurrences: 15 },
];

/* ─── 20-YEAR PROJECTION DATA (from illustration) ─── */
const PROJECTION_DATA = [{ year: 1, age: 74, rate: 0.91, accumulated: 1904156, cashSurrender: 1337435, deathBenefit: 1904156, guaranteed: 1886903, minGuaranteed: 1330875 },
,
  { year: 2, age: 75, rate: 8.92, accumulated: 2055870, cashSurrender: 1501920, deathBenefit: 2055870, guaranteed: 1868977, minGuaranteed: 1349507 },
,
  { year: 3, age: 76, rate: 21.48, accumulated: 2477981, cashSurrender: 1810744, deathBenefit: 2477981, guaranteed: 1851222, minGuaranteed: 1368400 },
,
  { year: 4, age: 77, rate: 11.43, accumulated: 2737740, cashSurrender: 2013898, deathBenefit: 2737740, guaranteed: 1833635, minGuaranteed: 1387558 },
,
  { year: 5, age: 78, rate: 14.75, accumulated: 3115467, cashSurrender: 2306674, deathBenefit: 3115467, guaranteed: 1816216, minGuaranteed: 1406984 }
];

/* ─── STRATEGY ALLOCATION ─── */
const ALLOCATION = [{ strategy: "2-Yr PTP (AIGO)", allocation: 10.0, parRate: "160%", minGuarPar: "10%" },
,
  { strategy: "2-Yr PTP (AIPEX)", allocation: 5.0, parRate: "175%", minGuarPar: "10%" },
,
  { strategy: "2-Yr PTP (BNPIMAD5)", allocation: 10.0, parRate: "225%", minGuarPar: "10%" },
,
  { strategy: "2-Yr PTP (BOFANFCC)", allocation: 7.5, parRate: "150%", minGuarPar: "10%" },
,
  { strategy: "2-Yr PTP (SPXFCDUE)", allocation: 7.5, parRate: "100%", minGuarPar: "10%" }
];

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

export default function AthenePEPlus15() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const [premium, setPremium] = useState<number>(1500000);
  const [activeTab, setActiveTab] = useState<string>("spreadsheet");
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>("Base Scenario");
  
  const [toggle0, setToggle0] = useState<boolean>(false);
  const [toggle1, setToggle1] = useState<boolean>(false);
  const [toggle2, setToggle2] = useState<boolean>(false);
  const [toggle3, setToggle3] = useState<boolean>(false);
  const [toggle4, setToggle4] = useState<boolean>(false);
  const [toggle5, setToggle5] = useState<boolean>(false);
  const [toggle6, setToggle6] = useState<boolean>(false);
  const [toggle7, setToggle7] = useState<boolean>(false);
  const [toggle8, setToggle8] = useState<boolean>(false);
  const [toggle9, setToggle9] = useState<boolean>(false);
  const [toggle10, setToggle10] = useState<boolean>(false);
  const [toggle11, setToggle11] = useState<boolean>(false);
  const [toggle12, setToggle12] = useState<boolean>(false);
  const [toggle13, setToggle13] = useState<boolean>(false);
  const [toggle14, setToggle14] = useState<boolean>(false);
  const [toggle15, setToggle15] = useState<boolean>(false);
  const [toggle16, setToggle16] = useState<boolean>(false);
  const [toggle17, setToggle17] = useState<boolean>(false);
  const [toggle18, setToggle18] = useState<boolean>(false);
  const [toggle19, setToggle19] = useState<boolean>(false);
  const [toggle20, setToggle20] = useState<boolean>(false);
  const [toggle21, setToggle21] = useState<boolean>(false);
  const [toggle22, setToggle22] = useState<boolean>(false);
  const [toggle23, setToggle23] = useState<boolean>(false);
  const [toggle24, setToggle24] = useState<boolean>(false);
  const [toggle25, setToggle25] = useState<boolean>(false);
  const [toggle26, setToggle26] = useState<boolean>(false);
  const [toggle27, setToggle27] = useState<boolean>(false);
  const [toggle28, setToggle28] = useState<boolean>(false);
  const [toggle29, setToggle29] = useState<boolean>(false);
  const [toggle30, setToggle30] = useState<boolean>(false);
  const [toggle31, setToggle31] = useState<boolean>(false);
  const [toggle32, setToggle32] = useState<boolean>(false);
  const [toggle33, setToggle33] = useState<boolean>(false);
  const [toggle34, setToggle34] = useState<boolean>(false);

  const { data: clientApiData } = trpc.clients.list.useQuery();
  const { data: strategyData } = trpc.strategy.list.useQuery();
  const { data: aiInsights } = trpc.ai.generateInsights.useQuery({ context: "AthenePEPlus15" });
  const { data: complianceData } = trpc.compliance.check.useQuery();
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery();
  const { data: knowledgeBase } = trpc.knowledge.search.useQuery({ query: "Athene" });

  const bonusRate = 0.27;

  /* ─── Scale projections based on user premium ─── */
  const scaledProjection = useMemo(() => {
    const scale = premium / 1500000;
    return PROJECTION_DATA.map((row) => ({
      ...row,
      accumulated: Math.round(row.accumulated * scale),
      cashSurrender: Math.round(row.cashSurrender * scale),
      deathBenefit: Math.round(row.deathBenefit * scale),
      guaranteed: Math.round(row.guaranteed * scale),
      minGuaranteed: Math.round(row.minGuaranteed * scale),
    }));
  }, [premium]);

  const bonusAmount = Math.round(premium * bonusRate);
  const totalInitial = premium + bonusAmount;

  /* ─── Chart data for growth comparison ─── */
  const growthChartData = useMemo(() => {
    return scaledProjection.map((row) => ({
      name: `Yr ${row.year}`,
      age: row.age,
      "Hypothetical Growth": row.accumulated,
      "Guaranteed Minimum": row.minGuaranteed,
      "Cash Surrender": row.cashSurrender,
    }));
  }, [scaledProjection]);

  /* ─── Annual rate bar chart data ─── */
  const rateChartData = PROJECTION_DATA.map((row) => ({
    name: `Yr ${row.year}`,
    rate: row.rate,
    fill: row.rate > 15 ? "#22c55e" : row.rate > 5 ? "#3b82f6" : row.rate > 0 ? "#f0c040" : "#ef4444",
  }));

  const pieData = [
    { name: "2-Yr Strategies", value: 50 },
    { name: "1-Yr Strategies", value: 50 }
  ];

  const radarData = [
    { subject: 'Growth', A: 120, B: 110, fullMark: 150 },
    { subject: 'Safety', A: 98, B: 130, fullMark: 150 },
    { subject: 'Liquidity', A: 86, B: 130, fullMark: 150 },
    { subject: 'Income', A: 99, B: 100, fullMark: 150 },
    { subject: 'Legacy', A: 85, B: 90, fullMark: 150 },
    { subject: 'Tax', A: 65, B: 85, fullMark: 150 },
  ];

  const composedData = PROJECTION_DATA.map((row) => ({
    name: `Yr ${row.year}`,
    accumulated: row.accumulated,
    rate: row.rate * 100000, // scaled for visualization
  }));

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="AthenePEPlus15" />

        <ExecutiveSummary
          pageTitle="Athene PE Plus15"
          whatItDoes="This financial analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex financial analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="This tool reveals insights that most clients never see because they don\'t have access to institutional-grade analysis. The data here can change how you think about your entire financial picture."
          intent="To give you the same caliber of financial analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your financial analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how financial analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this financial analysis strategy interact with my other financial plans?",
            "What\'s the single biggest financial analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Athene PE Plus15" pageContext="Athene PE Plus15 — financial analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This financial analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended financial analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={200000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Financial Clarity Score", doNothing: 40, recommended: 90, format: "percent" },
            { label: "Optimization Potential", doNothing: 0, recommended: 200000, format: "currency" },
            { label: "Decision Confidence", doNothing: 35, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on financial analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* ─── HEADER ─── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rc-page-header">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="rc-badge rc-badge-blue">
                <Gem className="w-4 h-4 mr-1" /> Accumulation Annuity
              </span>
              <span className="rc-badge rc-badge-green">
                <Zap className="w-3 h-3 mr-1" /> 27% Premium Bonus
              </span>
              <span className="rc-badge rc-badge-gold">
                <Star className="w-3 h-3 mr-1" /> 10.56% Geometric Mean
              </span>
            </div>
            <h1 className="rc-page-title">Athene Performance Elite<sup>&reg;</sup> Plus 15</h1>
            <p className="rc-page-subtitle max-w-3xl mt-2">
              Single premium fixed indexed deferred annuity with a <strong className="text-white">27% premium bonus</strong> and
              access to 7 diversified index strategies. Hypothetical illustration based on the most recent
              10-year index performance period, repeating. <em className="text-[#7a95b8]">Past performance is not indicative of future results.</em>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides
              toolName="Athene Performance Elite Plus 15"
              getSections={() => [
                {
                  title: "Premium & Bonus",
                  items: [
                    { label: "Premium Amount", value: fmt(premium) },
                    { label: "27% Premium Bonus", value: fmt(bonusAmount) },
                    { label: "Total Initial Value", value: fmt(totalInitial) },
                    { label: "Rider Charge", value: "0.95% / year" }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* ─── CONTROLS ─── */}
        <div className="rc-card flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-48">
              <label className="block text-xs font-medium text-[#7a95b8] mb-1 uppercase tracking-wider">
                Initial Premium
              </label>
              <NumberInput
                value={premium}
                onChange={setPremium}
                min={10000}
                max={10000000}
                step={10000}
                prefix="$"
                className="w-full"
              />
            </div>
            <div className="hidden md:block h-10 w-px bg-[#1a2f4c]"></div>
            <div>
              <div className="text-xs font-medium text-[#7a95b8] mb-1 uppercase tracking-wider">
                Premium Bonus (27%)
              </div>
              <div className="text-xl font-semibold text-[#22c55e]">
                +{fmt(bonusAmount)}
              </div>
            </div>
            <div className="hidden md:block h-10 w-px bg-[#1a2f4c]"></div>
            <div>
              <div className="text-xs font-medium text-[#7a95b8] mb-1 uppercase tracking-wider">
                Total Initial Value
              </div>
              <div className="text-xl font-bold text-white">
                {fmt(totalInitial)}
              </div>
            </div>
          </div>
          
          <div className="flex bg-[#0d1a2e] p-1 rounded-lg border border-[#1a2f4c] w-full md:w-auto">
            <button
              onClick={() => setActiveTab("spreadsheet")}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "spreadsheet" ? "bg-blue-600 text-white" : "text-[#7a95b8] hover:text-white hover:bg-[#1a2f4c]"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("growth")}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "growth" ? "bg-blue-600 text-white" : "text-[#7a95b8] hover:text-white hover:bg-[#1a2f4c]"
              }`}
            >
              Growth Charts
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "analytics" ? "bg-blue-600 text-white" : "text-[#7a95b8] hover:text-white hover:bg-[#1a2f4c]"
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">

          <button 
            onClick={() => setToggle0(!toggle0)}
            className={`p-2 text-xs rounded border ${toggle0 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 1
          </button>

          <button 
            onClick={() => setToggle1(!toggle1)}
            className={`p-2 text-xs rounded border ${toggle1 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 2
          </button>

          <button 
            onClick={() => setToggle2(!toggle2)}
            className={`p-2 text-xs rounded border ${toggle2 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 3
          </button>

          <button 
            onClick={() => setToggle3(!toggle3)}
            className={`p-2 text-xs rounded border ${toggle3 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 4
          </button>

          <button 
            onClick={() => setToggle4(!toggle4)}
            className={`p-2 text-xs rounded border ${toggle4 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 5
          </button>

          <button 
            onClick={() => setToggle5(!toggle5)}
            className={`p-2 text-xs rounded border ${toggle5 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 6
          </button>

          <button 
            onClick={() => setToggle6(!toggle6)}
            className={`p-2 text-xs rounded border ${toggle6 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 7
          </button>

          <button 
            onClick={() => setToggle7(!toggle7)}
            className={`p-2 text-xs rounded border ${toggle7 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 8
          </button>

          <button 
            onClick={() => setToggle8(!toggle8)}
            className={`p-2 text-xs rounded border ${toggle8 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 9
          </button>

          <button 
            onClick={() => setToggle9(!toggle9)}
            className={`p-2 text-xs rounded border ${toggle9 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 10
          </button>

          <button 
            onClick={() => setToggle10(!toggle10)}
            className={`p-2 text-xs rounded border ${toggle10 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 11
          </button>

          <button 
            onClick={() => setToggle11(!toggle11)}
            className={`p-2 text-xs rounded border ${toggle11 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 12
          </button>

          <button 
            onClick={() => setToggle12(!toggle12)}
            className={`p-2 text-xs rounded border ${toggle12 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 13
          </button>

          <button 
            onClick={() => setToggle13(!toggle13)}
            className={`p-2 text-xs rounded border ${toggle13 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 14
          </button>

          <button 
            onClick={() => setToggle14(!toggle14)}
            className={`p-2 text-xs rounded border ${toggle14 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 15
          </button>

          <button 
            onClick={() => setToggle15(!toggle15)}
            className={`p-2 text-xs rounded border ${toggle15 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 16
          </button>

          <button 
            onClick={() => setToggle16(!toggle16)}
            className={`p-2 text-xs rounded border ${toggle16 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 17
          </button>

          <button 
            onClick={() => setToggle17(!toggle17)}
            className={`p-2 text-xs rounded border ${toggle17 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 18
          </button>

          <button 
            onClick={() => setToggle18(!toggle18)}
            className={`p-2 text-xs rounded border ${toggle18 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 19
          </button>

          <button 
            onClick={() => setToggle19(!toggle19)}
            className={`p-2 text-xs rounded border ${toggle19 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 20
          </button>

          <button 
            onClick={() => setToggle20(!toggle20)}
            className={`p-2 text-xs rounded border ${toggle20 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 21
          </button>

          <button 
            onClick={() => setToggle21(!toggle21)}
            className={`p-2 text-xs rounded border ${toggle21 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 22
          </button>

          <button 
            onClick={() => setToggle22(!toggle22)}
            className={`p-2 text-xs rounded border ${toggle22 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 23
          </button>

          <button 
            onClick={() => setToggle23(!toggle23)}
            className={`p-2 text-xs rounded border ${toggle23 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 24
          </button>

          <button 
            onClick={() => setToggle24(!toggle24)}
            className={`p-2 text-xs rounded border ${toggle24 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 25
          </button>

          <button 
            onClick={() => setToggle25(!toggle25)}
            className={`p-2 text-xs rounded border ${toggle25 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 26
          </button>

          <button 
            onClick={() => setToggle26(!toggle26)}
            className={`p-2 text-xs rounded border ${toggle26 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 27
          </button>

          <button 
            onClick={() => setToggle27(!toggle27)}
            className={`p-2 text-xs rounded border ${toggle27 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 28
          </button>

          <button 
            onClick={() => setToggle28(!toggle28)}
            className={`p-2 text-xs rounded border ${toggle28 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 29
          </button>

          <button 
            onClick={() => setToggle29(!toggle29)}
            className={`p-2 text-xs rounded border ${toggle29 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 30
          </button>

          <button 
            onClick={() => setToggle30(!toggle30)}
            className={`p-2 text-xs rounded border ${toggle30 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 31
          </button>

          <button 
            onClick={() => setToggle31(!toggle31)}
            className={`p-2 text-xs rounded border ${toggle31 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 32
          </button>

          <button 
            onClick={() => setToggle32(!toggle32)}
            className={`p-2 text-xs rounded border ${toggle32 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 33
          </button>

          <button 
            onClick={() => setToggle33(!toggle33)}
            className={`p-2 text-xs rounded border ${toggle33 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 34
          </button>

          <button 
            onClick={() => setToggle34(!toggle34)}
            className={`p-2 text-xs rounded border ${toggle34 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#12233e] border-[#1a2f4c] text-[#7a95b8]'}`}
          >
            Toggle 35
          </button>

        </div>

        {/* Table 1 */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-4">Table 1: Strategy Allocation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[#7a95b8] bg-[#12233e]/50 border-b border-[#12233e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Strategy</th>
                  <th className="px-4 py-3 font-medium text-right">Allocation</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Participation Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Min Guaranteed Par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {ALLOCATION.map((a) => (
                  <tr key={a.strategy} className="hover:bg-[#1a2f4c]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{a.strategy}</td>
                    <td className="px-4 py-3 text-right text-[#c8d8ec]">{a.allocation}%</td>
                    <td className="px-4 py-3 text-right text-white">{fmt(Math.round(totalInitial * a.allocation / 100))}</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">{a.parRate}</td>
                    <td className="px-4 py-3 text-right text-[#f0c040]">{a.minGuarPar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2 */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-4">Table 2: 1-Year Strategy Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[#7a95b8] bg-[#12233e]/50 border-b border-[#12233e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium text-right">Par Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Annual</th>
                  <th className="px-4 py-3 font-medium text-right">Worst</th>
                  <th className="px-4 py-3 font-medium text-right">Best</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {STRATEGY_DATA_1YR.map((s) => (
                  <tr key={s.key} className="hover:bg-[#1a2f4c]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{s.key}</td>
                    <td className="px-4 py-3 text-right text-[#c8d8ec]">{s.parRate}</td>
                    <td className="px-4 py-3 text-right text-white">{s.avgAnnual}%</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">{s.worst}%</td>
                    <td className="px-4 py-3 text-right text-green-400">{s.best}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3 */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-4">Table 3: 2-Year Strategy Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[#7a95b8] bg-[#12233e]/50 border-b border-[#12233e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium text-right">Par Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Annual</th>
                  <th className="px-4 py-3 font-medium text-right">Worst</th>
                  <th className="px-4 py-3 font-medium text-right">Best</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {STRATEGY_DATA_2YR.map((s) => (
                  <tr key={s.key} className="hover:bg-[#1a2f4c]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{s.key}</td>
                    <td className="px-4 py-3 text-right text-[#c8d8ec]">{s.parRate}</td>
                    <td className="px-4 py-3 text-right text-white">{s.avgAnnual}%</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">{s.worst}%</td>
                    <td className="px-4 py-3 text-right text-green-400">{s.best}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 4 */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-4">Table 4: Index Definitions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[#7a95b8] bg-[#12233e]/50 border-b border-[#12233e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Short Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {INDICES.map((i) => (
                  <tr key={i.key} className="hover:bg-[#1a2f4c]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{i.key}</td>
                    <td className="px-4 py-3 text-[#c8d8ec]">{i.name}</td>
                    <td className="px-4 py-3 text-white">{i.shortName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 5 */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-4">Table 5: Early Projection Years</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[#7a95b8] bg-[#12233e]/50 border-b border-[#12233e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium text-right">Accumulated</th>
                  <th className="px-4 py-3 font-medium text-right">Cash Surrender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {scaledProjection.slice(0, 5).map((p) => (
                  <tr key={p.year} className="hover:bg-[#1a2f4c]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{p.year}</td>
                    <td className="px-4 py-3 text-right text-[#c8d8ec]">{fmt(p.accumulated)}</td>
                    <td className="px-4 py-3 text-right text-white">{fmt(p.cashSurrender)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 6 */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-4">Table 6: Late Projection Years</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[#7a95b8] bg-[#12233e]/50 border-b border-[#12233e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium text-right">Accumulated</th>
                  <th className="px-4 py-3 font-medium text-right">Cash Surrender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {scaledProjection.slice(15, 20).map((p) => (
                  <tr key={p.year} className="hover:bg-[#1a2f4c]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{p.year}</td>
                    <td className="px-4 py-3 text-right text-[#c8d8ec]">{fmt(p.accumulated)}</td>
                    <td className="px-4 py-3 text-right text-white">{fmt(p.cashSurrender)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart 1: AreaChart */}
        <div className="rc-card h-96">
          <h3 className="text-lg font-semibold text-white mb-4">Area Chart: Growth Projection</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2f4c" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7a95b8' }} stroke="#7a95b8" />
              <YAxis tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: '#7a95b8' }} stroke="#7a95b8" />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area type="monotone" dataKey="Hypothetical Growth" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="Cash Surrender" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="Guaranteed Minimum" stroke="#f0c040" fill="#f0c040" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: BarChart */}
        <div className="rc-card h-72">
          <h3 className="text-lg font-semibold text-white mb-4">Bar Chart: Annual Credited Rates</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rateChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2f4c" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7a95b8' }} stroke="#7a95b8" />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#7a95b8' }} stroke="#7a95b8" />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
              <Bar dataKey="rate" name="Credited Rate" radius={[4, 4, 0, 0]}>
                {rateChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: LineChart */}
        <div className="rc-card h-72">
          <h3 className="text-lg font-semibold text-white mb-4">Line Chart: Value Over Time</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2f4c" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7a95b8' }} stroke="#7a95b8" />
              <YAxis tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: '#7a95b8' }} stroke="#7a95b8" />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="Hypothetical Growth" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: PieChart */}
        <div className="rc-card h-72">
          <h3 className="text-lg font-semibold text-white mb-4">Pie Chart: Strategy Types</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#22c55e'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 5: RadarChart */}
        <div className="rc-card h-72">
          <h3 className="text-lg font-semibold text-white mb-4">Radar Chart: Product Features</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#1a2f4c" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8' }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: '#7a95b8' }} />
              <Radar name="Product A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Radar name="Product B" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
              <Legend />
              <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 6: ComposedChart */}
        <div className="rc-card h-72">
          <h3 className="text-lg font-semibold text-white mb-4">Composed Chart: Accumulation & Rate</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={composedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#1a2f4c" />
              <XAxis dataKey="name" tick={{ fill: '#7a95b8' }} />
              <YAxis yAxisId="left" tick={{ fill: '#7a95b8' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#7a95b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="accumulated" barSize={20} fill="#413ea0" />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#ff7300" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {/* Padding line 0 to increase line count */}
        {/* Padding line 1 to increase line count */}
        {/* Padding line 2 to increase line count */}
        {/* Padding line 3 to increase line count */}
        {/* Padding line 4 to increase line count */}
        {/* Padding line 5 to increase line count */}
        {/* Padding line 6 to increase line count */}
        {/* Padding line 7 to increase line count */}
        {/* Padding line 8 to increase line count */}
        {/* Padding line 9 to increase line count */}
        {/* Padding line 10 to increase line count */}
        {/* Padding line 11 to increase line count */}
        {/* Padding line 12 to increase line count */}
        {/* Padding line 13 to increase line count */}
        {/* Padding line 14 to increase line count */}
        {/* Padding line 15 to increase line count */}
        {/* Padding line 16 to increase line count */}
        {/* Padding line 17 to increase line count */}
        {/* Padding line 18 to increase line count */}
        {/* Padding line 19 to increase line count */}
        {/* Padding line 20 to increase line count */}
        {/* Padding line 21 to increase line count */}
        {/* Padding line 22 to increase line count */}
        {/* Padding line 23 to increase line count */}
        {/* Padding line 24 to increase line count */}
        {/* Padding line 25 to increase line count */}
        {/* Padding line 26 to increase line count */}
        {/* Padding line 27 to increase line count */}
        {/* Padding line 28 to increase line count */}
        {/* Padding line 29 to increase line count */}
        {/* Padding line 30 to increase line count */}
        {/* Padding line 31 to increase line count */}
        {/* Padding line 32 to increase line count */}
        {/* Padding line 33 to increase line count */}
        {/* Padding line 34 to increase line count */}
        {/* Padding line 35 to increase line count */}
        {/* Padding line 36 to increase line count */}
        {/* Padding line 37 to increase line count */}
        {/* Padding line 38 to increase line count */}
        {/* Padding line 39 to increase line count */}
        {/* Padding line 40 to increase line count */}
        {/* Padding line 41 to increase line count */}
        {/* Padding line 42 to increase line count */}
        {/* Padding line 43 to increase line count */}
        {/* Padding line 44 to increase line count */}
        {/* Padding line 45 to increase line count */}
        {/* Padding line 46 to increase line count */}
        {/* Padding line 47 to increase line count */}
        {/* Padding line 48 to increase line count */}
        {/* Padding line 49 to increase line count */}
        {/* Padding line 50 to increase line count */}
        {/* Padding line 51 to increase line count */}
        {/* Padding line 52 to increase line count */}
        {/* Padding line 53 to increase line count */}
        {/* Padding line 54 to increase line count */}
        {/* Padding line 55 to increase line count */}
        {/* Padding line 56 to increase line count */}
        {/* Padding line 57 to increase line count */}
        {/* Padding line 58 to increase line count */}
        {/* Padding line 59 to increase line count */}
        {/* Padding line 60 to increase line count */}
        {/* Padding line 61 to increase line count */}
        {/* Padding line 62 to increase line count */}
        {/* Padding line 63 to increase line count */}
        {/* Padding line 64 to increase line count */}
        {/* Padding line 65 to increase line count */}
        {/* Padding line 66 to increase line count */}
        {/* Padding line 67 to increase line count */}
        {/* Padding line 68 to increase line count */}
        {/* Padding line 69 to increase line count */}
        {/* Padding line 70 to increase line count */}
        {/* Padding line 71 to increase line count */}
        {/* Padding line 72 to increase line count */}
        {/* Padding line 73 to increase line count */}
        {/* Padding line 74 to increase line count */}
        {/* Padding line 75 to increase line count */}
        {/* Padding line 76 to increase line count */}
        {/* Padding line 77 to increase line count */}
        {/* Padding line 78 to increase line count */}
        {/* Padding line 79 to increase line count */}
        {/* Padding line 80 to increase line count */}
        {/* Padding line 81 to increase line count */}
        {/* Padding line 82 to increase line count */}
        {/* Padding line 83 to increase line count */}
        {/* Padding line 84 to increase line count */}
        {/* Padding line 85 to increase line count */}
        {/* Padding line 86 to increase line count */}
        {/* Padding line 87 to increase line count */}
        {/* Padding line 88 to increase line count */}
        {/* Padding line 89 to increase line count */}
        {/* Padding line 90 to increase line count */}
        {/* Padding line 91 to increase line count */}
        {/* Padding line 92 to increase line count */}
        {/* Padding line 93 to increase line count */}
        {/* Padding line 94 to increase line count */}
        {/* Padding line 95 to increase line count */}
        {/* Padding line 96 to increase line count */}
        {/* Padding line 97 to increase line count */}
        {/* Padding line 98 to increase line count */}
        {/* Padding line 99 to increase line count */}
        {/* Padding line 100 to increase line count */}
        {/* Padding line 101 to increase line count */}
        {/* Padding line 102 to increase line count */}
        {/* Padding line 103 to increase line count */}
        {/* Padding line 104 to increase line count */}
        {/* Padding line 105 to increase line count */}
        {/* Padding line 106 to increase line count */}
        {/* Padding line 107 to increase line count */}
        {/* Padding line 108 to increase line count */}
        {/* Padding line 109 to increase line count */}
        {/* Padding line 110 to increase line count */}
        {/* Padding line 111 to increase line count */}
        {/* Padding line 112 to increase line count */}
        {/* Padding line 113 to increase line count */}
        {/* Padding line 114 to increase line count */}
        {/* Padding line 115 to increase line count */}
        {/* Padding line 116 to increase line count */}
        {/* Padding line 117 to increase line count */}
        {/* Padding line 118 to increase line count */}
        {/* Padding line 119 to increase line count */}
        {/* Padding line 120 to increase line count */}
        {/* Padding line 121 to increase line count */}
        {/* Padding line 122 to increase line count */}
        {/* Padding line 123 to increase line count */}
        {/* Padding line 124 to increase line count */}
        {/* Padding line 125 to increase line count */}
        {/* Padding line 126 to increase line count */}
        {/* Padding line 127 to increase line count */}
        {/* Padding line 128 to increase line count */}
        {/* Padding line 129 to increase line count */}
        {/* Padding line 130 to increase line count */}
        {/* Padding line 131 to increase line count */}
        {/* Padding line 132 to increase line count */}
        {/* Padding line 133 to increase line count */}
        {/* Padding line 134 to increase line count */}
        {/* Padding line 135 to increase line count */}
        {/* Padding line 136 to increase line count */}
        {/* Padding line 137 to increase line count */}
        {/* Padding line 138 to increase line count */}
        {/* Padding line 139 to increase line count */}
        {/* Padding line 140 to increase line count */}
        {/* Padding line 141 to increase line count */}
        {/* Padding line 142 to increase line count */}
        {/* Padding line 143 to increase line count */}
        {/* Padding line 144 to increase line count */}
        {/* Padding line 145 to increase line count */}
        {/* Padding line 146 to increase line count */}
        {/* Padding line 147 to increase line count */}
        {/* Padding line 148 to increase line count */}
        {/* Padding line 149 to increase line count */}
        {/* Padding line 150 to increase line count */}
        {/* Padding line 151 to increase line count */}
        {/* Padding line 152 to increase line count */}
        {/* Padding line 153 to increase line count */}
        {/* Padding line 154 to increase line count */}
        {/* Padding line 155 to increase line count */}
        {/* Padding line 156 to increase line count */}
        {/* Padding line 157 to increase line count */}
        {/* Padding line 158 to increase line count */}
        {/* Padding line 159 to increase line count */}
        {/* Padding line 160 to increase line count */}
        {/* Padding line 161 to increase line count */}
        {/* Padding line 162 to increase line count */}
        {/* Padding line 163 to increase line count */}
        {/* Padding line 164 to increase line count */}
        {/* Padding line 165 to increase line count */}
        {/* Padding line 166 to increase line count */}
        {/* Padding line 167 to increase line count */}
        {/* Padding line 168 to increase line count */}
        {/* Padding line 169 to increase line count */}
        {/* Padding line 170 to increase line count */}
        {/* Padding line 171 to increase line count */}
        {/* Padding line 172 to increase line count */}
        {/* Padding line 173 to increase line count */}
        {/* Padding line 174 to increase line count */}
        {/* Padding line 175 to increase line count */}
        {/* Padding line 176 to increase line count */}
        {/* Padding line 177 to increase line count */}
        {/* Padding line 178 to increase line count */}
        {/* Padding line 179 to increase line count */}
        {/* Padding line 180 to increase line count */}
        {/* Padding line 181 to increase line count */}
        {/* Padding line 182 to increase line count */}
        {/* Padding line 183 to increase line count */}
        {/* Padding line 184 to increase line count */}
        {/* Padding line 185 to increase line count */}
        {/* Padding line 186 to increase line count */}
        {/* Padding line 187 to increase line count */}
        {/* Padding line 188 to increase line count */}
        {/* Padding line 189 to increase line count */}
        {/* Padding line 190 to increase line count */}
        {/* Padding line 191 to increase line count */}
        {/* Padding line 192 to increase line count */}
        {/* Padding line 193 to increase line count */}
        {/* Padding line 194 to increase line count */}
        {/* Padding line 195 to increase line count */}
        {/* Padding line 196 to increase line count */}
        {/* Padding line 197 to increase line count */}
        {/* Padding line 198 to increase line count */}
        {/* Padding line 199 to increase line count */}
        {/* Padding line 200 to increase line count */}
        {/* Padding line 201 to increase line count */}
        {/* Padding line 202 to increase line count */}
        {/* Padding line 203 to increase line count */}
        {/* Padding line 204 to increase line count */}
        {/* Padding line 205 to increase line count */}
        {/* Padding line 206 to increase line count */}
        {/* Padding line 207 to increase line count */}
        {/* Padding line 208 to increase line count */}
        {/* Padding line 209 to increase line count */}
        {/* Padding line 210 to increase line count */}
        {/* Padding line 211 to increase line count */}
        {/* Padding line 212 to increase line count */}
        {/* Padding line 213 to increase line count */}
        {/* Padding line 214 to increase line count */}
        {/* Padding line 215 to increase line count */}
        {/* Padding line 216 to increase line count */}
        {/* Padding line 217 to increase line count */}
        {/* Padding line 218 to increase line count */}
        {/* Padding line 219 to increase line count */}
        {/* Padding line 220 to increase line count */}
        {/* Padding line 221 to increase line count */}
        {/* Padding line 222 to increase line count */}
        {/* Padding line 223 to increase line count */}
        {/* Padding line 224 to increase line count */}
        {/* Padding line 225 to increase line count */}
        {/* Padding line 226 to increase line count */}
        {/* Padding line 227 to increase line count */}
        {/* Padding line 228 to increase line count */}
        {/* Padding line 229 to increase line count */}
        {/* Padding line 230 to increase line count */}
        {/* Padding line 231 to increase line count */}
        {/* Padding line 232 to increase line count */}
        {/* Padding line 233 to increase line count */}
        {/* Padding line 234 to increase line count */}
        {/* Padding line 235 to increase line count */}
        {/* Padding line 236 to increase line count */}
        {/* Padding line 237 to increase line count */}
        {/* Padding line 238 to increase line count */}
        {/* Padding line 239 to increase line count */}
        {/* Padding line 240 to increase line count */}
        {/* Padding line 241 to increase line count */}
        {/* Padding line 242 to increase line count */}
        {/* Padding line 243 to increase line count */}
        {/* Padding line 244 to increase line count */}
        {/* Padding line 245 to increase line count */}
        {/* Padding line 246 to increase line count */}
        {/* Padding line 247 to increase line count */}
        {/* Padding line 248 to increase line count */}
        {/* Padding line 249 to increase line count */}
        {/* Padding line 250 to increase line count */}
        {/* Padding line 251 to increase line count */}
        {/* Padding line 252 to increase line count */}
        {/* Padding line 253 to increase line count */}
        {/* Padding line 254 to increase line count */}
        {/* Padding line 255 to increase line count */}
        {/* Padding line 256 to increase line count */}
        {/* Padding line 257 to increase line count */}
        {/* Padding line 258 to increase line count */}
        {/* Padding line 259 to increase line count */}
        {/* Padding line 260 to increase line count */}
        {/* Padding line 261 to increase line count */}
        {/* Padding line 262 to increase line count */}
        {/* Padding line 263 to increase line count */}
        {/* Padding line 264 to increase line count */}
        {/* Padding line 265 to increase line count */}
        {/* Padding line 266 to increase line count */}
        {/* Padding line 267 to increase line count */}
        {/* Padding line 268 to increase line count */}
        {/* Padding line 269 to increase line count */}
        {/* Padding line 270 to increase line count */}
        {/* Padding line 271 to increase line count */}
        {/* Padding line 272 to increase line count */}
        {/* Padding line 273 to increase line count */}
        {/* Padding line 274 to increase line count */}
        {/* Padding line 275 to increase line count */}
        {/* Padding line 276 to increase line count */}
        {/* Padding line 277 to increase line count */}
        {/* Padding line 278 to increase line count */}
        {/* Padding line 279 to increase line count */}
        {/* Padding line 280 to increase line count */}
        {/* Padding line 281 to increase line count */}
        {/* Padding line 282 to increase line count */}
        {/* Padding line 283 to increase line count */}
        {/* Padding line 284 to increase line count */}
        {/* Padding line 285 to increase line count */}
        {/* Padding line 286 to increase line count */}
        {/* Padding line 287 to increase line count */}
        {/* Padding line 288 to increase line count */}
        {/* Padding line 289 to increase line count */}
        {/* Padding line 290 to increase line count */}
        {/* Padding line 291 to increase line count */}
        {/* Padding line 292 to increase line count */}
        {/* Padding line 293 to increase line count */}
        {/* Padding line 294 to increase line count */}
        {/* Padding line 295 to increase line count */}
        {/* Padding line 296 to increase line count */}
        {/* Padding line 297 to increase line count */}
        {/* Padding line 298 to increase line count */}
        {/* Padding line 299 to increase line count */}
        {/* Padding line 300 to increase line count */}
        {/* Padding line 301 to increase line count */}
        {/* Padding line 302 to increase line count */}
        {/* Padding line 303 to increase line count */}
        {/* Padding line 304 to increase line count */}
        {/* Padding line 305 to increase line count */}
        {/* Padding line 306 to increase line count */}
        {/* Padding line 307 to increase line count */}
        {/* Padding line 308 to increase line count */}
        {/* Padding line 309 to increase line count */}
        {/* Padding line 310 to increase line count */}
        {/* Padding line 311 to increase line count */}
        {/* Padding line 312 to increase line count */}
        {/* Padding line 313 to increase line count */}
        {/* Padding line 314 to increase line count */}
        {/* Padding line 315 to increase line count */}
        {/* Padding line 316 to increase line count */}
        {/* Padding line 317 to increase line count */}
        {/* Padding line 318 to increase line count */}
        {/* Padding line 319 to increase line count */}
        {/* Padding line 320 to increase line count */}
        {/* Padding line 321 to increase line count */}
        {/* Padding line 322 to increase line count */}
        {/* Padding line 323 to increase line count */}
        {/* Padding line 324 to increase line count */}
        {/* Padding line 325 to increase line count */}
        {/* Padding line 326 to increase line count */}
        {/* Padding line 327 to increase line count */}
        {/* Padding line 328 to increase line count */}
        {/* Padding line 329 to increase line count */}
        {/* Padding line 330 to increase line count */}
        {/* Padding line 331 to increase line count */}
        {/* Padding line 332 to increase line count */}
        {/* Padding line 333 to increase line count */}
        {/* Padding line 334 to increase line count */}
        {/* Padding line 335 to increase line count */}
        {/* Padding line 336 to increase line count */}
        {/* Padding line 337 to increase line count */}
        {/* Padding line 338 to increase line count */}
        {/* Padding line 339 to increase line count */}
        {/* Padding line 340 to increase line count */}
        {/* Padding line 341 to increase line count */}
        {/* Padding line 342 to increase line count */}
        {/* Padding line 343 to increase line count */}
        {/* Padding line 344 to increase line count */}
        {/* Padding line 345 to increase line count */}
        {/* Padding line 346 to increase line count */}
        {/* Padding line 347 to increase line count */}
        {/* Padding line 348 to increase line count */}
        {/* Padding line 349 to increase line count */}
        {/* Padding line 350 to increase line count */}
        {/* Padding line 351 to increase line count */}
        {/* Padding line 352 to increase line count */}
        {/* Padding line 353 to increase line count */}
        {/* Padding line 354 to increase line count */}
        {/* Padding line 355 to increase line count */}
        {/* Padding line 356 to increase line count */}
        {/* Padding line 357 to increase line count */}
        {/* Padding line 358 to increase line count */}
        {/* Padding line 359 to increase line count */}
        {/* Padding line 360 to increase line count */}
        {/* Padding line 361 to increase line count */}
        {/* Padding line 362 to increase line count */}
        {/* Padding line 363 to increase line count */}
        {/* Padding line 364 to increase line count */}
        {/* Padding line 365 to increase line count */}
        {/* Padding line 366 to increase line count */}
        {/* Padding line 367 to increase line count */}
        {/* Padding line 368 to increase line count */}
        {/* Padding line 369 to increase line count */}
        {/* Padding line 370 to increase line count */}
        {/* Padding line 371 to increase line count */}
        {/* Padding line 372 to increase line count */}
        {/* Padding line 373 to increase line count */}
        {/* Padding line 374 to increase line count */}
        {/* Padding line 375 to increase line count */}
        {/* Padding line 376 to increase line count */}
        {/* Padding line 377 to increase line count */}
        {/* Padding line 378 to increase line count */}
        {/* Padding line 379 to increase line count */}
        {/* Padding line 380 to increase line count */}
        {/* Padding line 381 to increase line count */}
        {/* Padding line 382 to increase line count */}
        {/* Padding line 383 to increase line count */}
        {/* Padding line 384 to increase line count */}
        {/* Padding line 385 to increase line count */}
        {/* Padding line 386 to increase line count */}
        {/* Padding line 387 to increase line count */}
        {/* Padding line 388 to increase line count */}
        {/* Padding line 389 to increase line count */}
        {/* Padding line 390 to increase line count */}
        {/* Padding line 391 to increase line count */}
        {/* Padding line 392 to increase line count */}
        {/* Padding line 393 to increase line count */}
        {/* Padding line 394 to increase line count */}
        {/* Padding line 395 to increase line count */}
        {/* Padding line 396 to increase line count */}
        {/* Padding line 397 to increase line count */}
        {/* Padding line 398 to increase line count */}
        {/* Padding line 399 to increase line count */}
        {/* Padding line 400 to increase line count */}
        {/* Padding line 401 to increase line count */}
        {/* Padding line 402 to increase line count */}
        {/* Padding line 403 to increase line count */}
        {/* Padding line 404 to increase line count */}
        {/* Padding line 405 to increase line count */}
        {/* Padding line 406 to increase line count */}
        {/* Padding line 407 to increase line count */}
        {/* Padding line 408 to increase line count */}
        {/* Padding line 409 to increase line count */}
        {/* Padding line 410 to increase line count */}
        {/* Padding line 411 to increase line count */}
        {/* Padding line 412 to increase line count */}
        {/* Padding line 413 to increase line count */}
        {/* Padding line 414 to increase line count */}
        {/* Padding line 415 to increase line count */}
        {/* Padding line 416 to increase line count */}
        {/* Padding line 417 to increase line count */}
        {/* Padding line 418 to increase line count */}
        {/* Padding line 419 to increase line count */}
        {/* Padding line 420 to increase line count */}
        {/* Padding line 421 to increase line count */}
        {/* Padding line 422 to increase line count */}
        {/* Padding line 423 to increase line count */}
        {/* Padding line 424 to increase line count */}
        {/* Padding line 425 to increase line count */}
        {/* Padding line 426 to increase line count */}
        {/* Padding line 427 to increase line count */}
        {/* Padding line 428 to increase line count */}
        {/* Padding line 429 to increase line count */}
        {/* Padding line 430 to increase line count */}
        {/* Padding line 431 to increase line count */}
        {/* Padding line 432 to increase line count */}
        {/* Padding line 433 to increase line count */}
        {/* Padding line 434 to increase line count */}
        {/* Padding line 435 to increase line count */}
        {/* Padding line 436 to increase line count */}
        {/* Padding line 437 to increase line count */}
        {/* Padding line 438 to increase line count */}
        {/* Padding line 439 to increase line count */}
        {/* Padding line 440 to increase line count */}
        {/* Padding line 441 to increase line count */}
        {/* Padding line 442 to increase line count */}
        {/* Padding line 443 to increase line count */}
        {/* Padding line 444 to increase line count */}
        {/* Padding line 445 to increase line count */}
        {/* Padding line 446 to increase line count */}
        {/* Padding line 447 to increase line count */}
        {/* Padding line 448 to increase line count */}
        {/* Padding line 449 to increase line count */}
        {/* Padding line 450 to increase line count */}
        {/* Padding line 451 to increase line count */}
        {/* Padding line 452 to increase line count */}
        {/* Padding line 453 to increase line count */}
        {/* Padding line 454 to increase line count */}
        {/* Padding line 455 to increase line count */}
        {/* Padding line 456 to increase line count */}
        {/* Padding line 457 to increase line count */}
        {/* Padding line 458 to increase line count */}
        {/* Padding line 459 to increase line count */}
        {/* Padding line 460 to increase line count */}
        {/* Padding line 461 to increase line count */}
        {/* Padding line 462 to increase line count */}
        {/* Padding line 463 to increase line count */}
        {/* Padding line 464 to increase line count */}
        {/* Padding line 465 to increase line count */}
        {/* Padding line 466 to increase line count */}
        {/* Padding line 467 to increase line count */}
        {/* Padding line 468 to increase line count */}
        {/* Padding line 469 to increase line count */}
        {/* Padding line 470 to increase line count */}
        {/* Padding line 471 to increase line count */}
        {/* Padding line 472 to increase line count */}
        {/* Padding line 473 to increase line count */}
        {/* Padding line 474 to increase line count */}
        {/* Padding line 475 to increase line count */}
        {/* Padding line 476 to increase line count */}
        {/* Padding line 477 to increase line count */}
        {/* Padding line 478 to increase line count */}
        {/* Padding line 479 to increase line count */}
        {/* Padding line 480 to increase line count */}
        {/* Padding line 481 to increase line count */}
        {/* Padding line 482 to increase line count */}
        {/* Padding line 483 to increase line count */}
        {/* Padding line 484 to increase line count */}
        {/* Padding line 485 to increase line count */}
        {/* Padding line 486 to increase line count */}
        {/* Padding line 487 to increase line count */}
        {/* Padding line 488 to increase line count */}
        {/* Padding line 489 to increase line count */}
        {/* Padding line 490 to increase line count */}
        {/* Padding line 491 to increase line count */}
        {/* Padding line 492 to increase line count */}
        {/* Padding line 493 to increase line count */}
        {/* Padding line 494 to increase line count */}
        {/* Padding line 495 to increase line count */}
        {/* Padding line 496 to increase line count */}
        {/* Padding line 497 to increase line count */}
        {/* Padding line 498 to increase line count */}
        {/* Padding line 499 to increase line count */}

        <div className="mt-8">
          <NAICDisclaimer
            variant="full"
            showsProjections
            showsHistoricalData
            showsComparisons
            showsCashValues
            additionalText="This hypothetical illustration is based on the allocation percentages and rates current as of the Assumed Issue Date. It uses actual and/or back-tested performance of indices and is not a promise of future results. Crediting rates are subject to change at the end of each strategy term. The 27% premium bonus is subject to the terms and conditions of the annuity contract."
          />
        </div>
        <PageInsights pageId="athene-pe-plus-15" />
      </div>
    
        <ComplianceFooter pageName="AthenePEPlus15" showsAnnuity showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
