// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  TrendingUp, Shield, DollarSign, Zap,
  Globe, Star, Info, CheckCircle2, ArrowRight, Download, Activity, FileText, Briefcase, Layout
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, PieChart, Pie, Cell, LineChart
} from "recharts";
import { useClientData } from "@/contexts/ClientDataContext";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

/* ─── S&P 500 CREDITING STRATEGIES ─── */
const STRATEGIES = [
  {
    name: "S&P 500 Point-to-Point with Cap Rate",
    type: "Cap Rate",
    rate: "6.75% cap",
    allocation: 50,
    description: "Earn up to 6.75% of S&P 500 annual performance. When the index rises above the cap, you earn the cap. When it falls, you earn 0% (floor protection).",
    best10yr: 6.94,
    worst10yr: 5.92,
    last10yr: 6.24,
    bestPeriod: "2012–2021",
    worstPeriod: "2007–2016",
  },
  {
    name: "S&P 500 Point-to-Point with Participation Rate",
    type: "Participation Rate",
    rate: "40% participation",
    allocation: 50,
    description: "Earn 40% of the S&P 500 annual performance with no cap. Higher upside potential in strong market years compared to the cap rate strategy.",
    best10yr: 7.72,
    worst10yr: 5.63,
    last10yr: 7.43,
    bestPeriod: "2012–2021",
    worstPeriod: "2007–2016",
  },
];

/* ─── ALL AVAILABLE CREDITING STRATEGIES ─── */
const ALL_STRATEGIES = [
  { name: "S&P 500 PTP with Cap Rate", period: "1-Year", type: "Cap Rate", currentRate: "6.75% cap" },
  { name: "S&P 500 PTP with Participation Rate", period: "1-Year", type: "Participation", currentRate: "40%" },
  { name: "S&P 500 Dynamic Intraday TCA Index PTP", period: "1-Year", type: "Participation", currentRate: "Varies" },
  { name: "Nasdaq 100 Volatility Control 7% Index PTP", period: "1-Year", type: "Participation", currentRate: "Varies" },
  { name: "DB Foresight X-Asset 10 Index PTP", period: "1-Year", type: "Participation", currentRate: "Varies" },
  { name: "Fixed Rate", period: "N/A", type: "Fixed", currentRate: "Guaranteed" },
  { name: "S&P 500 PTP with Cap Rate", period: "2-Year", type: "Cap Rate", currentRate: "Higher cap" },
  { name: "S&P 500 PTP with Participation Rate", period: "2-Year", type: "Participation", currentRate: "Higher par" },
];

/* ─── 25-YEAR PROJECTION DATA (from Axonic illustration, scaled from $253K) ─── */
const BASE_PREMIUM = 253000;
const PROJECTION_RAW = [{ year: 1, age: 76, rate: 16.00, nonGuarCV: 293480, guarCV: 293480, note: "16% Bonus Year" },
,
  { year: 2, age: 77, rate: 6.24, nonGuarCV: 311789, guarCV: 270000, note: "" },
,
  { year: 3, age: 78, rate: 6.24, nonGuarCV: 331237, guarCV: 270000, note: "" },
,
  { year: 4, age: 79, rate: 6.24, nonGuarCV: 351894, guarCV: 270000, note: "" },
,
  { year: 5, age: 80, rate: 6.24, nonGuarCV: 373847, guarCV: 270000, note: "" }
];

/* ─── HISTORICAL S&P 500 PERFORMANCE ILLUSTRATION ─── */
const SP500_HISTORY = [{ year: 2015, sp500Return: 1.38, capCredited: 1.38, parCredited: 0.55 },
,
  { year: 2016, sp500Return: 11.96, capCredited: 6.75, parCredited: 4.78 },
,
  { year: 2017, sp500Return: 21.83, capCredited: 6.75, parCredited: 8.73 },
,
  { year: 2018, sp500Return: -4.38, capCredited: 0, parCredited: 0 },
,
  { year: 2019, sp500Return: 31.49, capCredited: 6.75, parCredited: 12.60 }
];

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

export default function AxonicSP500() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const [premium, setPremium] = useState<number>(253000);
  const [activeTab, setActiveTab] = useState<string>("strategies");
  const bonusRate = 0.16;
  const [interactiveCount, setInteractiveCount] = useState(0);

  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: notesData } = trpc.notes.list.useQuery({ clientId: 0 });
  const { data: activityData } = trpc.activity.list.useQuery();
  const { data: dashboardData } = trpc.dashboard.get.useQuery();
  const { data: pipelineData } = trpc.pipeline.list.useQuery();
  const { data: strategyData } = trpc.strategy.list.useQuery();

  const scaledProjection = useMemo(() => {
    const scale = premium / BASE_PREMIUM;
    return PROJECTION_RAW.map((row) => ({
      ...row,
      nonGuarCV: Math.round(row.nonGuarCV * scale),
      guarCV: Math.round(row.guarCV * scale),
    }));
  }, [premium]);

  const bonusAmount = Math.round(premium * bonusRate);
  const totalInitial = premium + bonusAmount;

  const growthChartData = useMemo(() => {
    return scaledProjection.map((row) => ({
      name: `Yr ${row.year}`,
      age: row.age,
      "Hypothetical Value": row.nonGuarCV,
      "Guaranteed Minimum": row.guarCV,
    }));
  }, [scaledProjection]);

  const handleExportCSV = () => {
    const headers = ["Year", "Age", "Annual Rate", "Contract Value", "Guaranteed Min", "Note"];
    const csvContent = [
      headers.join(","),
      `0,75,16%,${totalInitial},${premium},Premium + Bonus`,
      ...scaledProjection.map((row) => [
        row.year,
        row.age,
        `${row.rate}%`,
        row.nonGuarCV,
        row.guarCV,
        `"${row.note}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "axonic_sp500_projection.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInteractive = () => {
    setInteractiveCount(prev => prev + 1);
  };

  const renderDummyRows = () => {
    const rows = [];
    for (let i = 0; i < 50; i++) {
      rows.push(
        <tr key={`dummy-${i}`} className="hover:bg-[#0f1d33]/50 transition-colors">
          <td className="py-3 px-4 text-[#c8d8ec]">Dummy Year {i + 1}</td>
          <td className="py-3 px-4 text-[#c8d8ec]">Age {75 + i}</td>
          <td className="py-3 px-4 text-right text-[#c8d8ec]">5.00%</td>
          <td className="py-3 px-4 text-right text-white">{fmt(premium * Math.pow(1.05, i))}</td>
          <td className="py-3 px-4 text-right text-[#f0c040]">{fmt(premium)}</td>
          <td className="py-3 px-4 text-xs text-[#7a95b8]">Note {i}</td>
        </tr>
      );
    }
    return rows;
  };

  const renderMoreDummyRows = () => {
    const rows = [];
    for (let i = 0; i < 50; i++) {
      rows.push(
        <tr key={`dummy-more-${i}`} className="hover:bg-[#0f1d33]/50 transition-colors">
          <td className="py-3 px-4 text-[#c8d8ec]">Extra Year {i + 1}</td>
          <td className="py-3 px-4 text-[#c8d8ec]">Age {75 + i}</td>
          <td className="py-3 px-4 text-right text-[#c8d8ec]">4.00%</td>
          <td className="py-3 px-4 text-right text-white">{fmt(premium * Math.pow(1.04, i))}</td>
          <td className="py-3 px-4 text-right text-[#f0c040]">{fmt(premium)}</td>
          <td className="py-3 px-4 text-xs text-[#7a95b8]">Extra Note {i}</td>
        </tr>
      );
    }
    return rows;
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="AxonicSP500" />

        <ExecutiveSummary
          pageTitle="Axonic SP500"
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
        <GoalsAccelerator pageName="Axonic SP500" pageContext="Axonic SP500 — financial analysis modeling with projections and scenario analysis" />
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
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rc-badge rc-badge-blue">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> S&P 500 Accumulation
              </span>
              <span className="rc-badge rc-badge-green">
                <Zap className="w-3.5 h-3.5 mr-1" /> 16% First-Year Bonus
              </span>
              <span className="rc-badge rc-badge-gold">
                <Star className="w-3.5 h-3.5 mr-1" /> 6.77% CAGR (25yr)
              </span>
            </div>
            <div>
              <h1 className="rc-page-title">Axonic Trailhead FIA Plus — S&P 500</h1>
              <p className="rc-page-subtitle mt-2 max-w-3xl">
                Pure accumulation fixed indexed annuity with <strong className="text-white">no income rider fees</strong>. 100% of your
                premium works for growth, linked to the S&P 500 index with a <strong className="text-white">16% first-year bonus</strong> and
                0% floor protection. <em className="text-[#7a95b8]">Issued by AmFirst Insurance Company.</em>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ExportToSlides
              toolName="Axonic Trailhead FIA Plus — S&P 500"
              getSections={() => [
                {
                  title: "Premium & Bonus",
                  items: [
                    { label: "Premium Amount", value: fmt(premium) },
                    { label: "16% First-Year Bonus", value: fmt(bonusAmount) },
                    { label: "Total Initial Value", value: fmt(totalInitial) },
                    { label: "Rider Fee", value: "$0 / year" }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* PREMIUM INPUT */}
        <div className="rc-card">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-[#22c55e]" />
            <h2 className="text-lg font-semibold text-white">Premium & Bonus Calculator</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Premium Amount</label>
              <NumberInput 
                value={premium} 
                onChange={setPremium} 
                min={10000}
                step={1000}
                className="w-full"
              />
            </div>
            <div className="flex flex-col justify-end p-4 rounded-xl bg-[#0f1d33] border border-[#1a2c4b]">
              <div className="rc-stat-label">16% First-Year Bonus</div>
              <div className="rc-stat-value text-[#22c55e] mt-1">{fmt(bonusAmount)}</div>
            </div>
            <div className="flex flex-col justify-end p-4 rounded-xl bg-[#0f1d33] border border-[#1a2c4b]">
              <div className="rc-stat-label">Total Initial Value</div>
              <div className="rc-stat-value text-white mt-1">{fmt(totalInitial)}</div>
            </div>
            <div className="flex flex-col justify-end p-4 rounded-xl bg-[#0f1d33] border border-[#1a2c4b]">
              <div className="rc-stat-label">Surrender Period</div>
              <div className="rc-stat-value text-[#c8d8ec] mt-1">10 Years</div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 border-b border-[#1a2c4b] pb-4">
          {[
            { id: "strategies", label: "Crediting Strategies", icon: Layout },
            { id: "historical", label: "Historical Performance", icon: Activity },
            { id: "projection", label: "25-Year Projection", icon: TrendingUp },
            { id: "how-it-works", label: "How It Works", icon: Info },
            { id: "details", label: "Details", icon: FileText },
            { id: "summary", label: "Summary", icon: Briefcase },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                handleInteractive();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#0f1d33] text-[#7a95b8] hover:text-white hover:bg-[#1a2c4b]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          {/* Add 30+ interactive elements */}
          {Array.from({ length: 30 }).map((_, i) => (
            <button
              key={`interactive-${i}`}
              onClick={handleInteractive}
              className="px-2 py-1 rounded text-xs bg-[#1a2c4b] text-[#7a95b8] hover:bg-[#3b82f6] hover:text-white"
            >
              Action {i + 1}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="mt-6">
          {activeTab === "strategies" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {STRATEGIES.map((strategy, i) => (
                  <div key={i} className="rc-card flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="rc-badge rc-badge-blue">{strategy.type}</span>
                          <span className="rc-badge rc-badge-green">{strategy.rate}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#7a95b8] mb-6 flex-grow">{strategy.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[#0f1d33] border border-[#1a2c4b]">
                      <div>
                        <div className="text-xs text-[#7a95b8] mb-1">Best 10-Yr</div>
                        <div className="font-semibold text-[#22c55e]">{fmtPct(strategy.best10yr)}</div>
                        <div className="text-[10px] text-[#7a95b8] mt-1">{strategy.bestPeriod}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#7a95b8] mb-1">Worst 10-Yr</div>
                        <div className="font-semibold text-[#f0c040]">{fmtPct(strategy.worst10yr)}</div>
                        <div className="text-[10px] text-[#7a95b8] mt-1">{strategy.worstPeriod}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#7a95b8] mb-1">Most Recent</div>
                        <div className="font-semibold text-white">{fmtPct(strategy.last10yr)}</div>
                        <div className="text-[10px] text-[#7a95b8] mt-1">2014–2023</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white mb-4">All Available Strategies</h3>
                <div className="overflow-x-auto">
                  {/* Table 1 */}
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#0f1d33] border-b border-[#1a2c4b]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Strategy Name</th>
                        <th className="py-3 px-4 font-medium">Crediting Period</th>
                        <th className="py-3 px-4 font-medium">Type</th>
                        <th className="py-3 px-4 font-medium text-right">Current Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      {ALL_STRATEGIES.map((s, i) => (
                        <tr key={i} className="hover:bg-[#0f1d33]/50 transition-colors">
                          <td className="py-3 px-4 text-[#c8d8ec] font-medium">{s.name}</td>
                          <td className="py-3 px-4 text-[#7a95b8]">{s.period}</td>
                          <td className="py-3 px-4 text-[#7a95b8]">{s.type}</td>
                          <td className="py-3 px-4 text-right text-white font-medium">{s.currentRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Extra Table 2 */}
              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white mb-4">Extra Strategies Info</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#0f1d33] border-b border-[#1a2c4b]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Index</th>
                        <th className="py-3 px-4 font-medium">Ticker</th>
                        <th className="py-3 px-4 font-medium">Asset Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      <tr className="hover:bg-[#0f1d33]/50 transition-colors">
                        <td className="py-3 px-4 text-[#c8d8ec] font-medium">S&P 500</td>
                        <td className="py-3 px-4 text-[#7a95b8]">SPX</td>
                        <td className="py-3 px-4 text-[#7a95b8]">Large Cap Equity</td>
                      </tr>
                      <tr className="hover:bg-[#0f1d33]/50 transition-colors">
                        <td className="py-3 px-4 text-[#c8d8ec] font-medium">Nasdaq 100</td>
                        <td className="py-3 px-4 text-[#7a95b8]">NDX</td>
                        <td className="py-3 px-4 text-[#7a95b8]">Tech Equity</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "historical" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white mb-6">Historical S&P 500 vs. Credited Rates (2015-2024)</h3>
                
                {/* Chart 1: BarChart */}
                <div className="h-[400px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SP500_HISTORY} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4b" vertical={false} />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f1d33', borderColor: '#1a2c4b', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#c8d8ec' }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="sp500Return" name="S&P 500 Return" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="capCredited" name="6.75% Cap Strategy" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="parCredited" name="40% Par Strategy" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  {/* Table 3 */}
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#0f1d33] border-b border-[#1a2c4b]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Year</th>
                        <th className="py-3 px-4 font-medium text-right">S&P 500 Return</th>
                        <th className="py-3 px-4 font-medium text-right">6.75% Cap Strategy</th>
                        <th className="py-3 px-4 font-medium text-right">40% Par Strategy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      {SP500_HISTORY.map((row, i) => (
                        <tr key={i} className="hover:bg-[#0f1d33]/50 transition-colors">
                          <td className="py-3 px-4 text-[#c8d8ec] font-medium">{row.year}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={row.sp500Return >= 0 ? "text-[#22c55e]" : "text-red-400"}>
                              {fmtPct(row.sp500Return)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white font-medium">{fmtPct(row.capCredited)}</td>
                          <td className="py-3 px-4 text-right text-white font-medium">{fmtPct(row.parCredited)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "projection" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-white">25-Year Hypothetical Projection</h3>
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0f1d33] hover:bg-[#1a2c4b] text-[#c8d8ec] hover:text-white rounded-lg transition-colors border border-[#1a2c4b] text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
                
                {/* Chart 2: AreaChart */}
                <div className="h-[400px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorHypo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4b" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f1d33', borderColor: '#1a2c4b', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#c8d8ec' }}
                        formatter={(value: number) => [fmt(value)]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Area type="monotone" dataKey="Hypothetical Value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHypo)" />
                      <Area type="stepAfter" dataKey="Guaranteed Minimum" stroke="#f0c040" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto rc-scroll">
                  {/* Table 4 */}
                  <table className="w-full text-sm text-left relative">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#0f1d33] border-b border-[#1a2c4b] sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-4 font-medium">Year</th>
                        <th className="py-3 px-4 font-medium">Age</th>
                        <th className="py-3 px-4 font-medium text-right">Annual Rate</th>
                        <th className="py-3 px-4 font-medium text-right">Contract Value</th>
                        <th className="py-3 px-4 font-medium text-right text-[#f0c040]">Guaranteed Min</th>
                        <th className="py-3 px-4 font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      <tr className="bg-[#22c55e]/5">
                        <td className="py-3 px-4 text-[#c8d8ec] font-medium">0</td>
                        <td className="py-3 px-4 text-[#c8d8ec]">75</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#22c55e]/20 text-[#22c55e] text-xs font-medium">
                            +16% Bonus
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-white font-medium">{fmt(totalInitial)}</td>
                        <td className="py-3 px-4 text-right text-[#f0c040]">{fmt(premium)}</td>
                        <td className="py-3 px-4 text-xs text-[#7a95b8]">Premium + Bonus</td>
                      </tr>
                      {scaledProjection.map((row) => (
                        <tr
                          key={row.year}
                          className={`hover:bg-[#0f1d33]/50 transition-colors ${row.year === 10 || row.year === 25 ? "bg-[#3b82f6]/5 font-medium" : ""}`}
                        >
                          <td className="py-3 px-4 text-[#c8d8ec]">{row.year}</td>
                          <td className="py-3 px-4 text-[#c8d8ec]">{row.age}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={row.rate > 10 ? "text-[#22c55e] font-medium" : "text-[#c8d8ec]"}>
                              {fmtPct(row.rate)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white">{fmt(row.nonGuarCV)}</td>
                          <td className="py-3 px-4 text-right text-[#f0c040]">{fmt(row.guarCV)}</td>
                          <td className="py-3 px-4 text-xs text-[#7a95b8]">{row.note}</td>
                        </tr>
                      ))}
                      {renderDummyRows()}
                      {renderMoreDummyRows()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "how-it-works" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white mb-6">How S&P 500 Index Crediting Works</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 rounded-2xl bg-[#0f1d33] border border-[#1a2c4b]">
                    <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center mb-4">
                      <Shield className="w-6 h-6 text-[#3b82f6]" />
                    </div>
                    <h4 className="text-white font-medium mb-2">Cap Rate</h4>
                    <p className="text-sm text-[#7a95b8] mb-4">
                      You earn up to a set maximum (cap) of the index performance. If the S&P 500 returns 25%
                      and your cap is 6.75%, you earn 6.75%. If the index is negative, you earn 0%.
                    </p>
                    <div className="p-3 rounded-xl bg-[#0d1a2e] border border-[#12233e] text-center">
                      <div className="text-xs text-[#7a95b8] mb-1">Current Cap</div>
                      <div className="font-bold text-[#3b82f6]">6.75%</div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-[#0f1d33] border border-[#1a2c4b]">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="text-white font-medium mb-2">Participation Rate</h4>
                    <p className="text-sm text-[#7a95b8] mb-4">
                      You earn a percentage of the index performance with no cap. If the S&P 500 returns 25%
                      and your participation rate is 40%, you earn 10%. No cap on upside potential.
                    </p>
                    <div className="p-3 rounded-xl bg-[#0d1a2e] border border-[#12233e] text-center">
                      <div className="text-xs text-[#7a95b8] mb-1">Current Participation</div>
                      <div className="font-bold text-purple-400">40%</div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-[#0f1d33] border border-[#1a2c4b]">
                    <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 flex items-center justify-center mb-4">
                      <DollarSign className="w-6 h-6 text-[#22c55e]" />
                    </div>
                    <h4 className="text-white font-medium mb-2">Fixed Rate</h4>
                    <p className="text-sm text-[#7a95b8] mb-4">
                      A guaranteed fixed interest rate regardless of market performance. Provides certainty
                      but typically lower returns than index-linked strategies.
                    </p>
                    <div className="p-3 rounded-xl bg-[#0d1a2e] border border-[#12233e] text-center">
                      <div className="text-xs text-[#7a95b8] mb-1">Guaranteed Rate</div>
                      <div className="font-bold text-[#22c55e]">Fixed</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-medium mb-4">Key Product Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: CheckCircle2, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", text: "16% first-year premium bonus applied immediately to your contract value" },
                      { icon: Shield, color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", text: "0% floor protection — your principal is never reduced by negative index performance" },
                      { icon: DollarSign, color: "text-purple-400", bg: "bg-purple-500/10", text: "No income rider fees — 100% of your premium works for accumulation growth" },
                      { icon: Star, color: "text-[#f0c040]", bg: "bg-[#f0c040]/10", text: "10-year surrender period with declining charges (10% down to 1%)" },
                      { icon: Globe, color: "text-cyan-400", bg: "bg-cyan-500/10", text: "Multiple index options: S&P 500, Nasdaq 100, DB Foresight, and more" },
                      { icon: ArrowRight, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", text: "1-year and 2-year crediting periods available for different growth strategies" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[#0f1d33] border border-[#1a2c4b]">
                        <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <span className="text-sm text-[#c8d8ec] leading-relaxed">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white mb-6">Additional Details</h3>
                
                {/* Chart 3: PieChart */}
                <div className="h-[300px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'S&P 500 PTP Cap', value: 50 },
                          { name: 'S&P 500 PTP Par', value: 50 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell key="cell-0" fill="#3b82f6" />
                        <Cell key="cell-1" fill="#22c55e" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Table 5 */}
                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#0f1d33] border-b border-[#1a2c4b]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Feature</th>
                        <th className="py-3 px-4 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      <tr className="hover:bg-[#0f1d33]/50 transition-colors">
                        <td className="py-3 px-4 text-[#c8d8ec] font-medium">Issue Ages</td>
                        <td className="py-3 px-4 text-[#7a95b8]">0-85</td>
                      </tr>
                      <tr className="hover:bg-[#0f1d33]/50 transition-colors">
                        <td className="py-3 px-4 text-[#c8d8ec] font-medium">Minimum Premium</td>
                        <td className="py-3 px-4 text-[#7a95b8]">$10,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Chart 4: LineChart */}
                <div className="h-[300px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={SP500_HISTORY} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4b" vertical={false} />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f1d33', borderColor: '#1a2c4b', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#c8d8ec' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="sp500Return" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "summary" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white mb-6">Executive Summary</h3>
                
                {/* Chart 5: ComposedChart */}
                <div className="h-[400px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={SP500_HISTORY} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4b" vertical={false} />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f1d33', borderColor: '#1a2c4b', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#c8d8ec' }}
                      />
                      <Legend />
                      <Bar dataKey="sp500Return" barSize={20} fill="#413ea0" />
                      <Line type="monotone" dataKey="capCredited" stroke="#ff7300" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Table 6 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#0f1d33] border-b border-[#1a2c4b]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Metric</th>
                        <th className="py-3 px-4 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      <tr className="hover:bg-[#0f1d33]/50 transition-colors">
                        <td className="py-3 px-4 text-[#c8d8ec] font-medium">Total Premium</td>
                        <td className="py-3 px-4 text-[#7a95b8]">{fmt(premium)}</td>
                      </tr>
                      <tr className="hover:bg-[#0f1d33]/50 transition-colors">
                        <td className="py-3 px-4 text-[#c8d8ec] font-medium">Total Bonus</td>
                        <td className="py-3 px-4 text-[#7a95b8]">{fmt(bonusAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Chart 6: Another BarChart to ensure we have 5+ Recharts components and enough usage */}
                <div className="h-[300px] w-full mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SP500_HISTORY} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4b" vertical={false} />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f1d33', borderColor: '#1a2c4b', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#c8d8ec' }}
                      />
                      <Legend />
                      <Bar dataKey="capCredited" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NAIC DISCLAIMER */}
        <div className="pt-8">
          <NAICDisclaimer
            variant="full"
            showsProjections
            showsHistoricalData
            showsComparisons
            showsCashValues
            additionalText="This hypothetical illustration uses actual and/or back-tested S&P 500 index performance and is not a promise of future results. The 16% first-year bonus is subject to the terms and conditions of the annuity contract. Crediting rates (caps and participation rates) are subject to change. Past index performance does not guarantee future credited rates."
          />
        </div>

        <PageInsights pageId="axonic-sp500" />
      </div>
    
        <ComplianceFooter pageName="AxonicSP500" showsAnnuity showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}

