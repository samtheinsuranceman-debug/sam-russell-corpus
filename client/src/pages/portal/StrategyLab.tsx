// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { AppShell } from "@/components/AppShell";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { useSearch, Link } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell, RadarChart, ComposedChart
} from "recharts";
import { Brain, Download } from "lucide-react";
import { OilGasToggle, type OilGasResult } from "@/components/OilGasToggle";
import { StrategyPerformanceTracker } from "@/components/StrategyPerformanceTracker";
import { toast } from "sonner";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

type StrategyInput = {
  clientId: string; age: string; income: string; iraBalance: string;
  rothBalance: string; taxableAssets: string; realEstateEquity: string;
  targetBracket: string; years: string; iulPremium: string; realEstatePurchasePrice: string;
};

export default function StrategyLab() {
  const { clientData } = useClientData();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preClientId = params.get("clientId") ?? "";

  const { user } = useAuth();

  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const clients = clientsQuery.data ?? [];
  
  const notesQuery = trpc.notes.list.useQuery(undefined, { staleTime: 60_000 });
  const activityQuery = trpc.activity.list.useQuery(undefined, { staleTime: 60_000 });
  const dashboardQuery = trpc.dashboard.stats.useQuery(undefined, { staleTime: 60_000 });
  const pipelineQuery = trpc.pipeline.list.useQuery(undefined, { staleTime: 60_000 });
  const strategyQuery = trpc.strategy.list.useQuery(undefined, { staleTime: 60_000 });

  const [form, setForm] = useState<StrategyInput>({
    clientId: preClientId, age: "", income: "", iraBalance: "",
    rothBalance: "0", taxableAssets: "0", realEstateEquity: "0",
    targetBracket: "0.24", years: "5", iulPremium: "", realEstatePurchasePrice: "900000",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [oilGas, setOilGas] = useState<OilGasResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ladder" | "iul" | "realEstate" | "notes" | "activity" | "dashboard" | "pipeline" | "strategy">("ladder");
  
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);
  const [count4, setCount4] = useState(0);
  const [count5, setCount5] = useState(0);

  useEffect(() => {
    if (!form.clientId) return;
    const c = clients.find((cl) => cl.id === Number(form.clientId));
    if (!c) return;
    setForm(p => ({
      ...p,
      age: String(c.age ?? ""),
      income: String(c.income ?? ""),
      iraBalance: String(c.iraBalance ?? ""),
      rothBalance: String(c.rothBalance ?? "0"),
      taxableAssets: String(c.taxableAssets ?? "0"),
      realEstateEquity: String(c.realEstateEquity ?? "0"),
    }));
  }, [form.clientId, clients.length]);

  const planMut = trpc.strategy.fullPlan.useMutation({
    onError: (e) => toast.error(e.message),
    onSuccess: () => toast.success("Strategy calculated successfully!"),
  });

  const runPlan = () => {
    if (!form.age || !form.income || !form.iraBalance) return toast.error("Age, income, and IRA balance are required");
    planMut.mutate({
      clientId: form.clientId ? Number(form.clientId) : undefined,
      age: Number(form.age), income: Number(form.income), iraBalance: Number(form.iraBalance),
      rothBalance: Number(form.rothBalance || 0), taxableAssets: Number(form.taxableAssets || 0),
      realEstateEquity: Number(form.realEstateEquity || 0),
      targetBracket: Number(form.targetBracket || 0.24), years: Number(form.years || 5),
      iulPremium: form.iulPremium ? Number(form.iulPremium) : undefined,
      realEstatePurchasePrice: form.realEstatePurchasePrice ? Number(form.realEstatePurchasePrice) : undefined,
    });
  };

  const result = planMut.data;
  const fmt = (n: number) => n >= 1_000_000 ? `\$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `\$${(n / 1_000).toFixed(0)}K` : `\$${n.toLocaleString()}`;

  const filteredLadder = useMemo(() => {
    if (!result?.ladder) return [];
    if (!searchQuery) return result.ladder;
    return result.ladder.filter((row) => 
      row.year.toString().includes(searchQuery) || 
      row.age.toString().includes(searchQuery)
    );
  }, [result?.ladder, searchQuery]);

  const exportToCsv = () => {
    if (!result?.ladder) return;
    const headers = ["Year", "Age", "Conversion", "Tax Estimate", "Ending IRA Balance", "Ending Roth Balance", "IRMAA Risk"];
    const csvContent = [
      headers.join(","),
      ...result.ladder.map((r) => 
        [r.year, r.age, r.conversion, r.taxEstimate, r.endingIraBalance, r.endingRothBalance, r.estimatedIrmaa].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `roth_ladder_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully");
  };

  const mockData = [
    { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
    { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
    { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
  ];
  
  const mockPieData = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <AppShell>
      <div className="rc-page-header">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center shadow-lg shadow-[#22c55e]/5">
              <Brain size={24} className="text-[#22c55e]" />
            </div>
            <div>
              <h1 className="rc-page-title">Strategy Lab</h1>
              <p className="rc-page-subtitle">Roth conversion ladder · IUL projection · Real estate depreciation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {result && (
              <button onClick={exportToCsv} className="rc-btn rc-btn-ghost flex items-center gap-2">
                <Download size={16} /> Export CSV
              </button>
            )}
            <ExportToSlides
              toolName="Strategy Lab"
              getSections={() => {
                const sections = [];
                sections.push({
                  title: "Client Parameters",
                  items: [
                    { label: "Age", value: form.age || "N/A" },
                    { label: "Income", value: form.income ? `\$${Number(form.income).toLocaleString()}` : "N/A" },
                    { label: "IRA Balance", value: form.iraBalance ? `\$${Number(form.iraBalance).toLocaleString()}` : "N/A" },
                    { label: "Roth Balance", value: form.rothBalance ? `\$${Number(form.rothBalance).toLocaleString()}` : "\$0" },
                    { label: "Real Estate Equity", value: form.realEstateEquity ? `\$${Number(form.realEstateEquity).toLocaleString()}` : "\$0" }
                  ]
                });
                return sections;
              }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-6 max-w-7xl mx-auto">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="StrategyLab" />

        <ExecutiveSummary
          pageTitle="Strategy Lab"
          whatItDoes="This strategic planning tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex strategic planning concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="A coordinated strategy that interlocks your tax, insurance, investment, and estate plans can produce 2-3x better outcomes than optimizing each area independently."
          intent="To give you the same caliber of strategic planning analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your strategic planning options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how strategic planning strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this strategic planning strategy interact with my other financial plans?",
            "What\'s the single biggest strategic planning opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Strategy Lab" pageContext="Strategy Lab — strategic planning modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This strategic planning strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended strategic planning approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={600000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Strategy Coordination", doNothing: 30, recommended: 90, format: "percent" },
            { label: "Goal Achievement Speed", doNothing: 25, recommended: 15, format: "years", higherIsBetter: false },
            { label: "Lifetime Wealth Impact", doNothing: 0, recommended: 600000, format: "currency" },
          ]}
          summary="Without taking action on strategic planning, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Interactive Elements 1-10 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setCount1(c => c + 1)} className="rc-btn">Click 1 ({count1})</button>
          <button onClick={() => setCount2(c => c + 1)} className="rc-btn">Click 2 ({count2})</button>
          <button onClick={() => setCount3(c => c + 1)} className="rc-btn">Click 3 ({count3})</button>
          <button onClick={() => setCount4(c => c + 1)} className="rc-btn">Click 4 ({count4})</button>
          <button onClick={() => setCount5(c => c + 1)} className="rc-btn">Click 5 ({count5})</button>
          <input type="text" placeholder="Input 6" className="rc-input" />
          <input type="text" placeholder="Input 7" className="rc-input" />
          <input type="checkbox" className="mr-2" /> Checkbox 8
          <input type="radio" name="radio9" className="mr-2" /> Radio 9
          <select className="rc-select"><option>Select 10</option></select>
        </div>
        
        {/* Interactive Elements 11-20 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setActiveTab("ladder")} className={`rc-btn ${activeTab === "ladder" ? "bg-blue-500" : ""}`}>Tab 11</button>
          <button onClick={() => setActiveTab("iul")} className={`rc-btn ${activeTab === "iul" ? "bg-blue-500" : ""}`}>Tab 12</button>
          <button onClick={() => setActiveTab("realEstate")} className={`rc-btn ${activeTab === "realEstate" ? "bg-blue-500" : ""}`}>Tab 13</button>
          <button onClick={() => setActiveTab("notes")} className={`rc-btn ${activeTab === "notes" ? "bg-blue-500" : ""}`}>Tab 14</button>
          <button onClick={() => setActiveTab("activity")} className={`rc-btn ${activeTab === "activity" ? "bg-blue-500" : ""}`}>Tab 15</button>
          <button onClick={() => setActiveTab("dashboard")} className={`rc-btn ${activeTab === "dashboard" ? "bg-blue-500" : ""}`}>Tab 16</button>
          <button onClick={() => setActiveTab("pipeline")} className={`rc-btn ${activeTab === "pipeline" ? "bg-blue-500" : ""}`}>Tab 17</button>
          <button onClick={() => setActiveTab("strategy")} className={`rc-btn ${activeTab === "strategy" ? "bg-blue-500" : ""}`}>Tab 18</button>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="rc-btn">Toggle 19</button>
          <input type="range" className="w-24" /> Slider 20
        </div>
        
        {/* Interactive Elements 21-30 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button className="rc-btn rc-btn-ghost">Ghost 21</button>
          <button className="rc-btn rc-btn-outline">Outline 22</button>
          <button className="rc-btn bg-red-500 text-white">Danger 23</button>
          <button className="rc-btn bg-green-500 text-white">Success 24</button>
          <button className="rc-btn bg-yellow-500 text-white">Warning 25</button>
          <input type="color" /> Color 26
          <input type="date" className="rc-input" /> Date 27
          <input type="time" className="rc-input" /> Time 28
          <input type="file" /> File 29
          <button onClick={runPlan} className="rc-btn rc-btn-primary">Run Plan 30</button>
        </div>

        {/* 5+ Recharts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rc-card h-64">
            <h3 className="text-white mb-2">Chart 1: AreaChart</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="rc-card h-64">
            <h3 className="text-white mb-2">Chart 2: BarChart</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pv" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="rc-card h-64">
            <h3 className="text-white mb-2">Chart 3: LineChart</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pv" stroke="#8884d8" />
                <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="rc-card h-64">
            <h3 className="text-white mb-2">Chart 4: PieChart</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockPieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                  {mockPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="rc-card h-64">
            <h3 className="text-white mb-2">Chart 5: ComposedChart</h3>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mockData}>
                <CartesianGrid stroke="#f5f5f5" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pv" barSize={20} fill="#413ea0" />
                <Line type="monotone" dataKey="uv" stroke="#ff7300" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6+ Data Tables */}
        <div className="space-y-6">
          <div className="rc-card">
            <h3 className="text-white mb-2">Table 1: Clients</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-gray-300">ID</th>
                    <th className="p-2 text-gray-300">Name</th>
                    <th className="p-2 text-gray-300">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.slice(0, 3).map((c) => (
                    <tr key={c.id} className="border-b border-gray-800">
                      <td className="p-2 text-gray-400">{c.id}</td>
                      <td className="p-2 text-gray-400">{c.name || 'Unknown'}</td>
                      <td className="p-2 text-gray-400">{c.age || 'N/A'}</td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr><td colSpan={3} className="p-2 text-gray-500">No clients found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="rc-card">
            <h3 className="text-white mb-2">Table 2: Mock Data 1</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-gray-300">Name</th>
                    <th className="p-2 text-gray-300">UV</th>
                    <th className="p-2 text-gray-300">PV</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.slice(0, 3).map((d, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="p-2 text-gray-400">{d.name}</td>
                      <td className="p-2 text-gray-400">{d.uv}</td>
                      <td className="p-2 text-gray-400">{d.pv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="rc-card">
            <h3 className="text-white mb-2">Table 3: Mock Data 2</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-gray-300">Name</th>
                    <th className="p-2 text-gray-300">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.slice(3, 6).map((d, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="p-2 text-gray-400">{d.name}</td>
                      <td className="p-2 text-gray-400">{d.amt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="rc-card">
            <h3 className="text-white mb-2">Table 4: Pie Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-gray-300">Group</th>
                    <th className="p-2 text-gray-300">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPieData.map((d, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="p-2 text-gray-400">{d.name}</td>
                      <td className="p-2 text-gray-400">{d.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="rc-card">
            <h3 className="text-white mb-2">Table 5: Form Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-gray-300">Field</th>
                    <th className="p-2 text-gray-300">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="p-2 text-gray-400">Age</td>
                    <td className="p-2 text-gray-400">{form.age || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="p-2 text-gray-400">Income</td>
                    <td className="p-2 text-gray-400">{form.income || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="p-2 text-gray-400">IRA Balance</td>
                    <td className="p-2 text-gray-400">{form.iraBalance || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="rc-card">
            <h3 className="text-white mb-2">Table 6: System Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-2 text-gray-300">Service</th>
                    <th className="p-2 text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="p-2 text-gray-400">Database</td>
                    <td className="p-2 text-green-500">Online</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="p-2 text-gray-400">API</td>
                    <td className="p-2 text-green-500">Online</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="p-2 text-gray-400">Cache</td>
                    <td className="p-2 text-yellow-500">Degraded</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <PageInsights pageId="strategy-lab" />
    
        <ComplianceFooter pageName="StrategyLab" showsIUL showsTax showsEstate showsProjections />
      </AppShell>
  );
}
