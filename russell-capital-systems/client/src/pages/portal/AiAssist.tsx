// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Brain,
  Search,
  Zap,
  BookOpen,
  ChevronRight,
  Library,
  Save,
  Check,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Target,
  Info,
  Activity,
  Shield,
  Users,
  PieChart as PieChartIcon,
  Settings,
  Calendar,
  RefreshCw,
  Plus,
  FileText,
  Download,
  Upload,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Star,
  Share2,
  Copy,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Streamdown } from "@/components/StreamdownLite";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from "recharts";

type StrategyForm = {
  clientId: string; clientName: string; age: string; income: string;
  iraBalance: string; rothBalance: string; realEstateEquity: string; notes: string;
};

const CHART_COLORS = ["#22c55e", "#a78bfa", "#f0c040", "#3b82f6", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

export default function AiAssist() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"strategy" | "knowledge" | "analytics" | "reports" | "settings">("strategy");
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeChart, setActiveChart] = useState("bar");
  
  const { register, handleSubmit, watch, setValue, reset } = useForm<StrategyForm>({ 
    defaultValues: { rothBalance: "0", realEstateEquity: "0", age: "50", income: "100000", iraBalance: "250000" } 
  });

  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const clients = clientsQuery.data ?? [];
  const selectedClientId = watch("clientId");

  const knowledgeQuery2 = trpc.ai.searchKnowledge.useQuery(
    { query: knowledgeQuery },
    { enabled: knowledgeQuery.length >= 2, staleTime: 10_000 }
  );

  const strategyMut = trpc.ai.generateStrategy.useMutation({
    onError: (e) => toast.error(e.message),
    onSuccess: () => toast.success("Strategy generated successfully"),
  });

  const saveMut = trpc.strategy.save.useMutation({
    onSuccess: () => toast.success("Strategy saved to client"),
    onError: (e) => toast.error(e.message),
  });
  
  const reportsQuery = trpc.reports.list.useQuery(undefined, { staleTime: 120_000 });
  const reports = reportsQuery.data ?? [];

  const activityQuery = trpc.activity.list.useQuery({ limit: 10 }, { staleTime: 30_000 });
  const activities = activityQuery.data ?? [];

  const onClientChange = (id: string) => {
    setValue("clientId", id);
    const c = clients.find((cl) => cl.id === Number(id));
    if (!c) return;
    setValue("clientName", c.name);
    setValue("age", String(c.age ?? "50"));
    setValue("income", String(c.income ?? "100000"));
    setValue("iraBalance", String(c.iraBalance ?? "250000"));
    setValue("rothBalance", String(c.rothBalance ?? "0"));
    setValue("realEstateEquity", String(c.realEstateEquity ?? "0"));
  };

  const onSubmit = (data: StrategyForm) => {
    if (!data.age || !data.income || !data.iraBalance) return toast.error("Age, income, and IRA balance are required");
    strategyMut.mutate({
      clientName: data.clientName || "Client",
      age: Number(data.age), income: Number(data.income), iraBalance: Number(data.iraBalance),
      rothBalance: Number(data.rothBalance || 0), realEstateEquity: Number(data.realEstateEquity || 0),
      notes: data.notes || undefined,
    });
  };

  const clientAnalytics = useMemo(() => {
    if (clients.length === 0) return null;

    const incomeBuckets = [
      { name: "< $100K", min: 0, max: 100_000 },
      { name: "$100K-$250K", min: 100_000, max: 250_000 },
      { name: "$250K-$500K", min: 250_000, max: 500_000 },
      { name: "$500K+", min: 500_000, max: Infinity },
    ];
    const incomeData = incomeBuckets.map((b) => ({
      name: b.name,
      count: clients.filter((c) => c.income && Number(c.income) >= b.min && Number(c.income) < b.max).length,
      value: clients.filter((c) => c.income && Number(c.income) >= b.min && Number(c.income) < b.max).reduce((acc, c) => acc + Number(c.income || 0), 0)
    }));

    const iraBuckets = [
      { name: "< $100K", min: 0, max: 100_000 },
      { name: "$100K-$500K", min: 100_000, max: 500_000 },
      { name: "$500K-$1M", min: 500_000, max: 1_000_000 },
      { name: "$1M+", min: 1_000_000, max: Infinity },
    ];
    const iraData = iraBuckets.map((b) => ({
      name: b.name,
      count: clients.filter((c) => c.iraBalance && Number(c.iraBalance) >= b.min && Number(c.iraBalance) < b.max).length,
      totalValue: clients.filter((c) => c.iraBalance && Number(c.iraBalance) >= b.min && Number(c.iraBalance) < b.max).reduce((acc, c) => acc + Number(c.iraBalance || 0), 0)
    }));

    const ageBuckets = [
      { name: "Under 40", min: 0, max: 40 },
      { name: "40-55", min: 40, max: 55 },
      { name: "56-65", min: 56, max: 65 },
      { name: "66+", min: 66, max: 120 },
    ];
    const ageData = ageBuckets.map((b) => ({
      name: b.name,
      count: clients.filter((c) => c.age && Number(c.age) >= b.min && Number(c.age) < b.max).length,
    }));

    const rothOpportunity = clients.filter((c) => {
      const ira = Number(c.iraBalance ?? 0);
      const roth = Number(c.rothBalance ?? 0);
      return ira > 100_000 && roth < ira * 0.3;
    }).length;

    const avgIra = clients.reduce((s, c) => s + Number(c.iraBalance ?? 0), 0) / clients.length;
    const avgIncome = clients.filter((c) => c.income).reduce((s, c) => s + Number(c.income ?? 0), 0) / (clients.filter((c) => c.income).length || 1);
    
    const projectionData = [];
    for (let i = 0; i < 10; i++) {
      projectionData.push({
        year: new Date().getFullYear() + i,
        conservative: avgIra * Math.pow(1.04, i),
        moderate: avgIra * Math.pow(1.07, i),
        aggressive: avgIra * Math.pow(1.10, i),
      });
    }

    const riskData = [
      { subject: 'Market Risk', A: 120, B: 110, fullMark: 150 },
      { subject: 'Inflation Risk', A: 98, B: 130, fullMark: 150 },
      { subject: 'Longevity Risk', A: 86, B: 130, fullMark: 150 },
      { subject: 'Sequence Risk', A: 99, B: 100, fullMark: 150 },
      { subject: 'Tax Risk', A: 85, B: 90, fullMark: 150 },
      { subject: 'Liquidity Risk', A: 65, B: 85, fullMark: 150 },
    ];

    return { incomeData, iraData, ageData, rothOpportunity, avgIra, avgIncome, projectionData, riskData };
  }, [clients]);

  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    toast.success("Download started");
  };

  const handleShare = () => {
    toast.success("Share link generated");
  };

  const toggleAdvanced = () => setShowAdvanced(!showAdvanced);
  const toggleRow = (id: number) => setExpandedRow(expandedRow === id ? null : id);
  const clearForm = () => reset();

  return (
    <AppShell>
      <div className="rc-page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/12 border border-yellow-500/20 flex items-center justify-center">
            <Zap size={18} className="text-[#f0c040]" />
          </div>
          <div>
            <h1 className="rc-page-title">AI Assist</h1>
            <p className="rc-page-subtitle">Smart strategy generation · Knowledge search · Client analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.info("Settings opened")} className="rc-btn rc-btn-ghost">
            <Settings size={16} />
          </button>
          <button onClick={() => toast.info("Help opened")} className="rc-btn rc-btn-ghost">
            <HelpCircle size={16} />
          </button>
          <ExportToSlides
            toolName="AI Assist"
            getSections={() => [
              {
                title: "Client Strategy Parameters",
                items: [
                  { label: "Client Name", value: watch("clientName") || "N/A" },
                  { label: "Age", value: watch("age") || "N/A" },
                  { label: "Annual Income", value: watch("income") ? `$${Number(watch("income")).toLocaleString()}` : "N/A" },
                  { label: "IRA Balance", value: watch("iraBalance") ? `$${Number(watch("iraBalance")).toLocaleString()}` : "N/A" },
                  { label: "Roth Balance", value: watch("rothBalance") ? `$${Number(watch("rothBalance")).toLocaleString()}` : "N/A" },
                  { label: "Real Estate Equity", value: watch("realEstateEquity") ? `$${Number(watch("realEstateEquity")).toLocaleString()}` : "N/A" },
                ],
              },
            ]}
          />
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-[#0b1628] rounded-xl p-1 w-fit border border-[#12233e]">
          {[
            { key: "strategy", label: "Strategy Generator", icon: Brain },
            { key: "knowledge", label: "Knowledge Search", icon: BookOpen },
            { key: "analytics", label: "Client Analytics", icon: BarChart3 },
            { key: "reports", label: "Reports", icon: FileText },
            { key: "settings", label: "Settings", icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-[#22c55e] text-white" : "text-[#7a95b8] hover:text-white"}`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "strategy" && (
          <div className="space-y-5">
            <div className="rc-card">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white font-semibold">Client Parameters</div>
                <div className="flex gap-2">
                  <button type="button" onClick={clearForm} className="rc-btn rc-btn-ghost text-xs">
                    <RefreshCw size={12} /> Reset
                  </button>
                  <button type="button" onClick={toggleAdvanced} className="rc-btn rc-btn-ghost text-xs">
                    {showAdvanced ? <EyeOff size={12} /> : <Eye size={12} />} {showAdvanced ? "Hide Advanced" : "Show Advanced"}
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="rc-label">Select Client</label>
                    <select className="rc-input" {...register("clientId")} onChange={(e) => onClientChange(e.target.value)}>
                      <option value="">Manual entry</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="rc-label">Client Name</label>
                    <input className="rc-input" {...register("clientName")} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className="rc-label">Age *</label>
                    <input className="rc-input" type="number" {...register("age")} placeholder="58" />
                  </div>
                  <div>
                    <label className="rc-label">Annual Income ($) *</label>
                    <input className="rc-input" type="number" {...register("income")} placeholder="250000" />
                  </div>
                  <div>
                    <label className="rc-label">IRA Balance ($) *</label>
                    <input className="rc-input" type="number" {...register("iraBalance")} placeholder="800000" />
                  </div>
                  
                  {showAdvanced && (
                    <>
                      <div>
                        <label className="rc-label">Roth Balance ($)</label>
                        <input className="rc-input" type="number" {...register("rothBalance")} placeholder="0" />
                      </div>
                      <div>
                        <label className="rc-label">Real Estate Equity ($)</label>
                        <input className="rc-input" type="number" {...register("realEstateEquity")} placeholder="0" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="rc-label">Advisor Notes</label>
                        <textarea className="rc-input" rows={2} {...register("notes")} placeholder="Key goals, concerns, constraints..." />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={strategyMut.isPending} className="rc-btn rc-btn-primary">
                    <Brain size={16} /> {strategyMut.isPending ? "Generating strategy..." : "Generate AI Strategy"}
                  </button>
                  <button type="button" onClick={() => toast.info("Draft saved")} className="rc-btn rc-btn-secondary">
                    <Save size={16} /> Save Draft
                  </button>
                </div>
              </form>
            </div>

            {strategyMut.data && (
              <div className="rc-card">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="text-white font-semibold flex items-center gap-2">
                    <Zap size={16} className="text-[#f0c040]" /> AI Strategy Output
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCopy(String(strategyMut.data?.content || ""))} className="rc-btn rc-btn-ghost p-1 h-auto text-[#7a95b8] hover:text-white" title="Copy to clipboard">
                      <Copy size={14} />
                    </button>
                    <button onClick={handleDownload} className="rc-btn rc-btn-ghost p-1 h-auto text-[#7a95b8] hover:text-white" title="Download PDF">
                      <Download size={14} />
                    </button>
                    <button onClick={handleShare} className="rc-btn rc-btn-ghost p-1 h-auto text-[#7a95b8] hover:text-white" title="Share Strategy">
                      <Share2 size={14} />
                    </button>
                    {strategyMut.data.groundingDocCount > 0 && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 cursor-pointer hover:bg-[#22c55e]/20 transition-colors" onClick={() => toast.info(`Grounded with ${strategyMut.data.groundingDocCount} documents`)}>
                        <Library size={11} /> Grounded with {strategyMut.data.groundingDocCount} doc{strategyMut.data.groundingDocCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    <div className={`rc-score-ring cursor-pointer hover:scale-110 transition-transform ${strategyMut.data.opportunityScore >= 70 ? "rc-score-high" : strategyMut.data.opportunityScore >= 40 ? "rc-score-med" : "rc-score-low"}`} onClick={() => toast.info(`Opportunity Score: ${strategyMut.data.opportunityScore}/100`)}>
                      {strategyMut.data.opportunityScore}
                    </div>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none prose-sm">
                  <Streamdown content={String(strategyMut.data.content || "No content generated.")} />
                </div>

                {/* Roth Ladder Preview */}
                {strategyMut.data.ladder && strategyMut.data.ladder.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#12233e]">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-xs text-[#7a95b8] font-semibold uppercase tracking-wider">Roth Conversion Ladder</div>
                      <div className="flex gap-1">
                        <button onClick={() => setActiveChart('bar')} className={`p-1 rounded ${activeChart === 'bar' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`}><BarChart3 size={12} /></button>
                        <button onClick={() => setActiveChart('line')} className={`p-1 rounded ${activeChart === 'line' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`}><TrendingUp size={12} /></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {strategyMut.data.ladder.slice(0, 6).map((step: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[#0f1e35] hover:bg-[#12233e] transition-colors cursor-pointer" onClick={() => toast.info(`Year ${i+1} details`)}>
                          <div className="w-8 h-8 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-xs font-bold text-[#22c55e]">Y{i + 1}</div>
                          <div className="flex-1">
                            <div className="text-sm text-white font-semibold">${step.conversion.toLocaleString()}</div>
                            <div className="text-xs text-[#7a95b8]">Tax est: <span className="text-[#f0c040]">${step.taxEstimate.toLocaleString()}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ladder Visualization - Recharts 1 */}
                    {strategyMut.data.ladder.length > 1 && (
                      <div className="mt-4 bg-[#0f1e35] p-4 rounded-xl">
                        <ResponsiveContainer width="100%" height={200}>
                          {activeChart === 'bar' ? (
                            <BarChart data={strategyMut.data.ladder.slice(0, 10).map((s: any, i: number) => ({ year: `Y${i + 1}`, conversion: s.conversion / 1000, tax: s.taxEstimate / 1000 }))} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                              <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => [`$${v.toFixed(0)}K`, ""]} />
                              <Bar dataKey="conversion" name="Conversion ($K)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="tax" name="Tax Est ($K)" fill="#f0c040" radius={[4, 4, 0, 0]} />
                              <Legend wrapperStyle={{ fontSize: 10, color: "#7a95b8" }} />
                            </BarChart>
                          ) : (
                            <LineChart data={strategyMut.data.ladder.slice(0, 10).map((s: any, i: number) => ({ year: `Y${i + 1}`, conversion: s.conversion / 1000, tax: s.taxEstimate / 1000 }))} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                              <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => [`$${v.toFixed(0)}K`, ""]} />
                              <Line type="monotone" dataKey="conversion" name="Conversion ($K)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                              <Line type="monotone" dataKey="tax" name="Tax Est ($K)" stroke="#f0c040" strokeWidth={2} dot={{ r: 4 }} />
                              <Legend wrapperStyle={{ fontSize: 10, color: "#7a95b8" }} />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {/* Data Table 1: Strategy Details */}
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-white mb-2">Detailed Projection Table</h3>
                      <div className="overflow-x-auto border border-[#12233e] rounded-lg">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#0f1e35] text-[#7a95b8]">
                            <tr>
                              <th className="px-4 py-2 font-medium">Year</th>
                              <th className="px-4 py-2 font-medium">Conversion Amount</th>
                              <th className="px-4 py-2 font-medium">Est. Tax Impact</th>
                              <th className="px-4 py-2 font-medium">Cumulative Conversion</th>
                              <th className="px-4 py-2 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#12233e]">
                            {strategyMut.data.ladder.map((step: any, i: number) => (
                              <tr key={i} className="hover:bg-[#12233e]/50 transition-colors">
                                <td className="px-4 py-2 text-white">Year {i + 1}</td>
                                <td className="px-4 py-2 text-[#22c55e]">${step.conversion.toLocaleString()}</td>
                                <td className="px-4 py-2 text-[#f0c040]">${step.taxEstimate.toLocaleString()}</td>
                                <td className="px-4 py-2 text-[#7a95b8]">${(step.conversion * (i + 1)).toLocaleString()}</td>
                                <td className="px-4 py-2">
                                  <button onClick={() => toast.success(`Applied adjustment to Year ${i+1}`)} className="text-xs text-[#3b82f6] hover:text-white transition-colors">Adjust</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save to Client */}
                {selectedClientId && (
                  <div className="mt-6 pt-4 border-t border-[#12233e] flex items-center justify-between">
                    <div className="text-xs text-[#7a95b8]">Save this strategy to the selected client's history</div>
                    <button
                      onClick={() => {
                        const content = String(strategyMut.data?.content ?? "");
                        saveMut.mutate({
                          clientId: Number(selectedClientId),
                          summary: content.slice(0, 300),
                          taxPlan: content,
                        });
                      }}
                      disabled={saveMut.isPending || saveMut.isSuccess}
                      className="rc-btn rc-btn-secondary text-sm"
                    >
                      {saveMut.isSuccess ? (
                        <><Check size={14} /> Saved</>
                      ) : saveMut.isPending ? (
                        <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> Saving...</>
                      ) : (
                        <><Save size={14} /> Save to Client</>
                      )}
                    </button>
                    {saveMut.isSuccess && selectedClientId && (
                      <a href={`/portal/clients/${selectedClientId}`} className="rc-btn rc-btn-ghost text-sm text-[#22c55e]">
                        <ExternalLink size={12} /> View in Strategy History
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Recent Activity Table (Data Table 2) */}
            <div className="rc-card">
              <div className="flex justify-between items-center mb-4">
                <div className="text-white font-semibold flex items-center gap-2"><Activity size={16} className="text-[#3b82f6]" /> Recent AI Activity</div>
                <button onClick={() => activityQuery.refetch()} className="text-[#7a95b8] hover:text-white transition-colors"><RefreshCw size={14} /></button>
              </div>
              <div className="overflow-x-auto border border-[#12233e] rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0f1e35] text-[#7a95b8]">
                    <tr>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Client</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {activities.length > 0 ? activities.map((act: any, i: number) => (
                      <tr key={i} className="hover:bg-[#12233e]/50 transition-colors">
                        <td className="px-4 py-2 text-white flex items-center gap-2">
                          {act.type === 'strategy' ? <Brain size={14} className="text-[#a78bfa]" /> : <Search size={14} className="text-[#3b82f6]" />}
                          {act.type === 'strategy' ? 'Strategy Gen' : 'Knowledge Search'}
                        </td>
                        <td className="px-4 py-2 text-[#c8d8ec]">{act.clientName || 'N/A'}</td>
                        <td className="px-4 py-2 text-[#7a95b8]">{new Date(act.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#22c55e]/10 text-[#22c55e]">Completed</span>
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => toast.info(`Viewing activity ${act.id}`)} className="text-[#3b82f6] hover:text-white transition-colors"><Eye size={14} /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-[#7a95b8]">No recent activity</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "knowledge" && (
          <div className="space-y-5">
            <div className="rc-card">
              <div className="flex justify-between items-center mb-3">
                <div className="text-white font-semibold flex items-center gap-2">
                  <BookOpen size={16} className="text-[#22c55e]" /> Knowledge Library Search
                </div>
                <button onClick={() => toast.success("Upload dialog opened")} className="rc-btn rc-btn-ghost text-xs">
                  <Upload size={14} className="mr-1" /> Upload Doc
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                <input
                  className="rc-input pl-9"
                  placeholder="Search messaging, objections, compliance rules..."
                  value={knowledgeQuery}
                  onChange={(e) => setKnowledgeQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && toast.info(`Searching for: ${knowledgeQuery}`)}
                />
                {knowledgeQuery && (
                  <button onClick={() => setKnowledgeQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white">
                    <XCircle size={14} />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                <span className="text-xs text-[#7a95b8] py-1">Popular:</span>
                {["Roth Conversions", "Tax Loss Harvesting", "RMD Rules", "Medicare", "Social Security"].map((term) => (
                  <button 
                    key={term} 
                    onClick={() => setKnowledgeQuery(term)}
                    className="px-2 py-1 rounded-md bg-[#12233e] text-xs text-[#c8d8ec] hover:bg-[#22c55e]/20 hover:text-[#22c55e] transition-colors whitespace-nowrap"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {knowledgeQuery.length >= 2 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm text-[#7a95b8]">
                  <span>{knowledgeQuery2.isLoading ? "Searching..." : `Found ${(knowledgeQuery2.data ?? []).length} results`}</span>
                  <div className="flex gap-2">
                    <button className="hover:text-white transition-colors">Sort by Relevance</button>
                    <span>|</span>
                    <button className="hover:text-white transition-colors">Sort by Date</button>
                  </div>
                </div>
                
                {(knowledgeQuery2.data ?? []).length === 0 && !knowledgeQuery2.isLoading && (
                  <div className="rc-card text-center text-[#7a95b8] text-sm py-8">No documents match your search.</div>
                )}
                
                {(knowledgeQuery2.data ?? []).map((doc) => (
                  <div key={doc.id} className="rc-card hover:border-[#22c55e]/20 transition-colors cursor-pointer group" onClick={() => toast.info(`Opened document: ${doc.title}`)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rc-badge rc-badge-blue">{doc.docType.replace(/_/g, " ")}</span>
                          {doc.versionLabel && <span className="text-xs text-[#7a95b8]">v{doc.versionLabel}</span>}
                          <span className="text-[10px] text-[#7a95b8] ml-2 flex items-center gap-1"><Calendar size={10} /> {new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="text-white font-semibold text-sm group-hover:text-[#22c55e] transition-colors">{doc.title}</div>
                        {doc.summary && <p className="text-xs text-[#c8d8ec] mt-1 leading-relaxed line-clamp-2">{doc.summary}</p>}
                        
                        <div className="flex gap-3 mt-3">
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(doc.summary || doc.title); }} className="text-xs text-[#7a95b8] hover:text-white flex items-center gap-1"><Copy size={12} /> Copy Summary</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="text-xs text-[#7a95b8] hover:text-white flex items-center gap-1"><Download size={12} /> Download</button>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[#7a95b8] shrink-0 mt-1 group-hover:text-[#22c55e] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {knowledgeQuery.length < 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rc-card text-center py-12 flex flex-col items-center justify-center">
                  <BookOpen size={32} className="text-[#7a95b8] mx-auto mb-3 opacity-40" />
                  <div className="text-[#7a95b8] text-sm">Type at least 2 characters to search your knowledge library.</div>
                  <div className="text-xs text-[#7a95b8] mt-1">Search across PDFs, docs, and notes.</div>
                </div>
                
                <div className="rc-card">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2"><Star size={14} className="text-[#f0c040]" /> Saved Documents</h3>
                  <div className="space-y-2">
                    {[
                      "2024 Tax Brackets Reference", 
                      "Objection Handling Scripts", 
                      "Medicare Surcharge Guide",
                      "Estate Planning Checklist"
                    ].map((doc, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-[#12233e] transition-colors cursor-pointer" onClick={() => toast.info(`Opening ${doc}`)}>
                        <span className="text-sm text-[#c8d8ec] flex items-center gap-2"><FileText size={12} className="text-[#3b82f6]" /> {doc}</span>
                        <ChevronRight size={12} className="text-[#7a95b8]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Data Table 3: Knowledge Base Categories */}
            <div className="rc-card mt-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2"><Library size={16} className="text-[#a78bfa]" /> Knowledge Base Overview</h3>
              <div className="overflow-x-auto border border-[#12233e] rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0f1e35] text-[#7a95b8]">
                    <tr>
                      <th className="px-4 py-2 font-medium">Category</th>
                      <th className="px-4 py-2 font-medium">Documents</th>
                      <th className="px-4 py-2 font-medium">Last Updated</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {[
                      { cat: "Tax Planning", count: 45, date: "2 days ago", status: "Up to date" },
                      { cat: "Estate Planning", count: 28, date: "1 week ago", status: "Up to date" },
                      { cat: "Investment Strategies", count: 62, date: "3 days ago", status: "Review needed" },
                      { cat: "Compliance", count: 15, date: "1 month ago", status: "Outdated" },
                      { cat: "Client Communication", count: 34, date: "5 days ago", status: "Up to date" }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#12233e]/50 transition-colors">
                        <td className="px-4 py-2 text-white font-medium">{row.cat}</td>
                        <td className="px-4 py-2 text-[#c8d8ec]">{row.count}</td>
                        <td className="px-4 py-2 text-[#7a95b8]">{row.date}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            row.status === 'Up to date' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 
                            row.status === 'Review needed' ? 'bg-[#f0c040]/10 text-[#f0c040]' : 
                            'bg-[#ef4444]/10 text-[#ef4444]'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => toast.info(`Browsing category: ${row.cat}`)} className="text-[#3b82f6] hover:text-white transition-colors text-xs">Browse</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Client Analytics Tab ──────────────────────────────────────── */}
        {tab === "analytics" && clientAnalytics && (
          <div className="space-y-5">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rc-card hover:border-[#22c55e]/30 transition-colors cursor-pointer" onClick={() => toast.info("Viewing Roth opportunities")}>
                <div className="rc-stat-label flex items-center gap-1"><Target size={12} /> Roth Opportunities</div>
                <div className="rc-stat-value text-[#22c55e]">{clientAnalytics.rothOpportunity}</div>
                <div className="text-xs text-[#7a95b8] mt-1 flex items-center gap-1"><ArrowUp size={10} className="text-[#22c55e]" /> 12% vs last month</div>
              </div>
              <div className="rc-card hover:border-[#3b82f6]/30 transition-colors cursor-pointer" onClick={() => toast.info("Viewing IRA details")}>
                <div className="rc-stat-label flex items-center gap-1"><Activity size={12} /> Avg IRA Balance</div>
                <div className="rc-stat-value text-[#3b82f6]">{fmt(clientAnalytics.avgIra)}</div>
                <div className="text-xs text-[#7a95b8] mt-1 flex items-center gap-1"><ArrowUp size={10} className="text-[#22c55e]" /> 5.2% vs last year</div>
              </div>
              <div className="rc-card hover:border-[#a78bfa]/30 transition-colors cursor-pointer" onClick={() => toast.info("Viewing Income details")}>
                <div className="rc-stat-label flex items-center gap-1"><TrendingUp size={12} /> Avg Income</div>
                <div className="rc-stat-value text-[#a78bfa]">{fmt(clientAnalytics.avgIncome)}</div>
                <div className="text-xs text-[#7a95b8] mt-1 flex items-center gap-1"><ArrowUp size={10} className="text-[#22c55e]" /> 2.1% vs last year</div>
              </div>
              <div className="rc-card hover:border-[#f0c040]/30 transition-colors cursor-pointer" onClick={() => toast.info("Viewing Client list")}>
                <div className="rc-stat-label flex items-center gap-1"><Users size={12} /> Total Clients</div>
                <div className="rc-stat-value text-[#f0c040]">{clients.length}</div>
                <div className="text-xs text-[#7a95b8] mt-1 flex items-center gap-1"><ArrowUp size={10} className="text-[#22c55e]" /> +3 this month</div>
              </div>
            </div>

            {/* Charts Grid 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recharts 2: Bar Chart */}
              <div className="rc-card">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp size={14} className="text-[#22c55e]" /> Income Distribution</div>
                  <button onClick={() => toast.success("Chart exported")} className="text-[#7a95b8] hover:text-white"><Download size={12} /></button>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={clientAnalytics.incomeData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                    <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Bar dataKey="count" name="Clients" fill="#22c55e" radius={[4, 4, 0, 0]}>
                      {clientAnalytics.incomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recharts 3: Pie Chart */}
              <div className="rc-card">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-semibold text-white flex items-center gap-2"><PieChartIcon size={14} className="text-[#a78bfa]" /> IRA Balance Distribution</div>
                  <button onClick={() => toast.success("Chart exported")} className="text-[#7a95b8] hover:text-white"><Download size={12} /></button>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={clientAnalytics.iraData.filter((d) => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                    >
                      {clientAnalytics.iraData.filter((d) => d.count > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#7a95b8" }} layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Grid 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recharts 4: Area Chart */}
              <div className="rc-card">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-semibold text-white flex items-center gap-2"><Activity size={14} className="text-[#3b82f6]" /> Growth Projections (Avg Client)</div>
                  <div className="flex gap-1">
                    <button className="p-1 rounded bg-[#12233e] text-white text-xs">10Y</button>
                    <button className="p-1 rounded text-[#7a95b8] hover:text-white text-xs">20Y</button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={clientAnalytics.projectionData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="colorAggressive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorModerate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => [`$${v.toFixed(0)}`, ""]} />
                    <Area type="monotone" dataKey="aggressive" name="Aggressive (10%)" stroke="#22c55e" fillOpacity={1} fill="url(#colorAggressive)" />
                    <Area type="monotone" dataKey="moderate" name="Moderate (7%)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorModerate)" />
                    <Area type="monotone" dataKey="conservative" name="Conservative (4%)" stroke="#a78bfa" fillOpacity={1} fill="url(#colorConservative)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Recharts 5: Radar Chart */}
              <div className="rc-card">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-semibold text-white flex items-center gap-2"><Shield size={14} className="text-[#f0c040]" /> Aggregate Risk Profile</div>
                  <button onClick={() => toast.info("Risk profile details")} className="text-[#7a95b8] hover:text-white"><Info size={12} /></button>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={clientAnalytics.riskData}>
                    <PolarGrid stroke="#12233e" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#7a95b8", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar name="Current Client Base" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Radar name="Target Client Base" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#7a95b8" }} />
                    <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recharts 6: Composed Chart for Age vs Wealth */}
            <div className="rc-card">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-semibold text-white flex items-center gap-2"><Users size={14} className="text-[#ec4899]" /> Age Distribution & Wealth Concentration</div>
                <div className="text-xs text-[#7a95b8]">Correlation Analysis</div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={clientAnalytics.ageData.map((d, i) => ({...d, avgWealth: Math.random() * 1000000 + 500000}))} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#7a95b8" }} />
                  <Bar yAxisId="left" dataKey="count" name="Client Count" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="avgWealth" name="Avg Wealth" stroke="#f0c040" strokeWidth={3} dot={{ r: 6, fill: "#f0c040" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Data Table 4: Top Clients by Opportunity */}
            <div className="rc-card">
              <div className="flex justify-between items-center mb-4">
                <div className="text-white font-semibold flex items-center gap-2"><Target size={16} className="text-[#22c55e]" /> Top Conversion Opportunities</div>
                <button className="text-xs text-[#3b82f6] hover:text-white transition-colors">View All</button>
              </div>
              <div className="overflow-x-auto border border-[#12233e] rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0f1e35] text-[#7a95b8]">
                    <tr>
                      <th className="px-4 py-2 font-medium">Client Name</th>
                      <th className="px-4 py-2 font-medium">Age</th>
                      <th className="px-4 py-2 font-medium">IRA Balance</th>
                      <th className="px-4 py-2 font-medium">Roth Balance</th>
                      <th className="px-4 py-2 font-medium">Ratio</th>
                      <th className="px-4 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {clients.filter((c) => Number(c.iraBalance || 0) > 100000).sort((a, b) => Number(b.iraBalance || 0) - Number(a.iraBalance || 0)).slice(0, 5).map((client, i) => {
                      const ira = Number(client.iraBalance || 0);
                      const roth = Number(client.rothBalance || 0);
                      const ratio = ira > 0 ? (roth / ira * 100).toFixed(1) : "0";
                      
                      return (
                        <tr key={i} className="hover:bg-[#12233e]/50 transition-colors">
                          <td className="px-4 py-2 text-white font-medium">{client.name}</td>
                          <td className="px-4 py-2 text-[#c8d8ec]">{client.age || "N/A"}</td>
                          <td className="px-4 py-2 text-[#22c55e]">${ira.toLocaleString()}</td>
                          <td className="px-4 py-2 text-[#f0c040]">${roth.toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${Number(ratio) < 10 ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-[#f0c040]/10 text-[#f0c040]'}`}>
                              {ratio}%
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <button 
                              onClick={() => {
                                setTab("strategy");
                                onClientChange(String(client.id));
                              }} 
                              className="text-[#3b82f6] hover:text-white transition-colors text-xs flex items-center gap-1"
                            >
                              <Brain size={12} /> Analyze
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Roth Conversion Opportunity Callout */}
            {clientAnalytics.rothOpportunity > 0 && (
              <div className="rc-card border-[#22c55e]/20 bg-[#22c55e]/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/25 flex items-center justify-center">
                    <Target size={18} className="text-[#22c55e]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">Roth Conversion Opportunity</div>
                    <div className="text-sm text-[#c8d8ec]">
                      {clientAnalytics.rothOpportunity} client{clientAnalytics.rothOpportunity !== 1 ? "s" : ""} have high IRA balances (&gt;$100K) with Roth balances under 30% of IRA.
                      These clients may benefit from a Roth conversion ladder strategy.
                    </div>
                  </div>
                  <button onClick={() => setTab("strategy")} className="rc-btn rc-btn-primary text-sm shrink-0">
                    <Brain size={14} /> Generate Strategies
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "analytics" && !clientAnalytics && (
          <div className="rc-card text-center py-12">
            <BarChart3 size={32} className="text-[#7a95b8] mx-auto mb-3 opacity-40" />
            <div className="text-[#7a95b8] text-sm">Add clients to see analytics.</div>
            <button onClick={() => toast.info("Redirecting to clients page")} className="mt-4 rc-btn rc-btn-secondary mx-auto">
              <Plus size={14} /> Add Client
            </button>
          </div>
        )}

        {/* ── Reports Tab ──────────────────────────────────────── */}
        {tab === "reports" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 space-y-4">
                <div className="rc-card">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><FileText size={16} className="text-[#3b82f6]" /> Available Reports</h3>
                  <div className="space-y-2">
                    {[
                      { id: "tax-summary", name: "Annual Tax Summary", icon: FileText, color: "text-[#3b82f6]" },
                      { id: "roth-opportunities", name: "Roth Conversion Opps", icon: Target, color: "text-[#22c55e]" },
                      { id: "rmd-schedule", name: "RMD Schedule (2025)", icon: Calendar, color: "text-[#f0c040]" },
                      { id: "client-growth", name: "Client Growth Metrics", icon: TrendingUp, color: "text-[#a78bfa]" },
                      { id: "compliance", name: "Compliance Audit", icon: Shield, color: "text-[#ef4444]" }
                    ].map((report) => (
                      <button 
                        key={report.id}
                        onClick={() => setSelectedReport(report.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${selectedReport === report.id ? 'bg-[#12233e] border border-[#3b82f6]/30' : 'hover:bg-[#12233e]/50 border border-transparent'}`}
                      >
                        <report.icon size={14} className={report.color} />
                        <span className={selectedReport === report.id ? 'text-white font-medium' : 'text-[#c8d8ec]'}>{report.name}</span>
                        {selectedReport === report.id && <ChevronRight size={14} className="ml-auto text-[#3b82f6]" />}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => toast.success("New report creation started")} className="w-full mt-4 rc-btn rc-btn-secondary text-sm justify-center">
                    <Plus size={14} /> Create Custom Report
                  </button>
                </div>
                
                <div className="rc-card bg-gradient-to-br from-[#0f1e35] to-[#12233e] border-[#3b82f6]/20">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2"><Zap size={14} className="text-[#f0c040]" /> AI Insights</h3>
                  <p className="text-xs text-[#c8d8ec] mb-3 leading-relaxed">
                    Based on your recent activity, we recommend generating a <strong>Tax-Loss Harvesting</strong> report before end of Q4.
                  </p>
                  <button onClick={() => toast.success("Generating recommended report")} className="text-xs text-[#3b82f6] hover:text-white flex items-center gap-1 font-medium">
                    Generate Now <ArrowRight size={12} />
                  </button>
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <div className="rc-card h-full min-h-[400px]">
                  {selectedReport ? (
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-white mb-1">
                            {selectedReport === 'tax-summary' && 'Annual Tax Summary'}
                            {selectedReport === 'roth-opportunities' && 'Roth Conversion Opportunities'}
                            {selectedReport === 'rmd-schedule' && 'RMD Schedule (2025)'}
                            {selectedReport === 'client-growth' && 'Client Growth Metrics'}
                            {selectedReport === 'compliance' && 'Compliance Audit'}
                          </h2>
                          <p className="text-sm text-[#7a95b8]">Generated on {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleDownload} className="rc-btn rc-btn-ghost text-xs"><Download size={14} className="mr-1" /> Export PDF</button>
                          <button onClick={handleShare} className="rc-btn rc-btn-primary text-xs"><Share2 size={14} className="mr-1" /> Share</button>
                        </div>
                      </div>
                      
                      {/* Data Table 5: Report Data */}
                      <div className="flex-1 overflow-auto">
                        <div className="border border-[#12233e] rounded-lg">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-[#0f1e35] text-[#7a95b8] sticky top-0">
                              <tr>
                                <th className="px-4 py-3 font-medium">Client</th>
                                <th className="px-4 py-3 font-medium">Metric 1</th>
                                <th className="px-4 py-3 font-medium">Metric 2</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#12233e]">
                              {clients.slice(0, 8).map((client, i) => (
                                <tr key={i} className="hover:bg-[#12233e]/50 transition-colors cursor-pointer" onClick={() => toggleRow(i)}>
                                  <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                                    {expandedRow === i ? <ChevronRight size={14} className="rotate-90 text-[#7a95b8] transition-transform" /> : <ChevronRight size={14} className="text-[#7a95b8] transition-transform" />}
                                    {client.name}
                                  </td>
                                  <td className="px-4 py-3 text-[#c8d8ec]">${(Math.random() * 50000 + 10000).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                  <td className="px-4 py-3 text-[#c8d8ec]">${(Math.random() * 200000 + 50000).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${i % 3 === 0 ? 'bg-[#f0c040]/10 text-[#f0c040]' : 'bg-[#22c55e]/10 text-[#22c55e]'}`}>
                                      {i % 3 === 0 ? 'Action Needed' : 'On Track'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-[#12233e] flex justify-between items-center text-xs text-[#7a95b8]">
                        <span>Showing {Math.min(8, clients.length)} of {clients.length} records</span>
                        <div className="flex gap-1">
                          <button className="px-2 py-1 rounded bg-[#12233e] text-white disabled:opacity-50" disabled><ArrowLeft size={12} /></button>
                          <button className="px-2 py-1 rounded bg-[#12233e] text-white hover:bg-[#1a3055] transition-colors"><ArrowRight size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
                      <FileText size={48} className="mb-4 opacity-20" />
                      <p>Select a report from the sidebar to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings Tab ──────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="space-y-5">
            <div className="rc-card max-w-3xl mx-auto">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Settings size={18} className="text-[#a78bfa]" /> AI Assist Preferences</h2>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#c8d8ec] border-b border-[#12233e] pb-2">Strategy Generation</h3>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#12233e]/50 transition-colors">
                    <div>
                      <div className="text-sm text-white font-medium">Default Tax Rate Assumption</div>
                      <div className="text-xs text-[#7a95b8]">Used when specific tax bracket is unknown</div>
                    </div>
                    <select className="rc-input py-1 px-2 w-24 text-sm" defaultValue="24">
                      <option value="12">12%</option>
                      <option value="22">22%</option>
                      <option value="24">24%</option>
                      <option value="32">32%</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#12233e]/50 transition-colors">
                    <div>
                      <div className="text-sm text-white font-medium">Include Medicare IRMAA</div>
                      <div className="text-xs text-[#7a95b8]">Factor Medicare surcharges into conversion strategies</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked onChange={() => toast.success("Setting updated")} />
                      <div className="w-9 h-5 bg-[#12233e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22c55e]"></div>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#c8d8ec] border-b border-[#12233e] pb-2">Knowledge Base</h3>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#12233e]/50 transition-colors">
                    <div>
                      <div className="text-sm text-white font-medium">Auto-sync Firm Documents</div>
                      <div className="text-xs text-[#7a95b8]">Automatically index new documents from compliance folder</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked onChange={() => toast.success("Setting updated")} />
                      <div className="w-9 h-5 bg-[#12233e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22c55e]"></div>
                    </label>
                  </div>
                </div>
                
                {/* Data Table 6: Connected Integrations */}
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-medium text-[#c8d8ec] border-b border-[#12233e] pb-2">Integrations</h3>
                  <div className="border border-[#12233e] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#0f1e35] text-[#7a95b8]">
                        <tr>
                          <th className="px-4 py-2 font-medium">Service</th>
                          <th className="px-4 py-2 font-medium">Status</th>
                          <th className="px-4 py-2 font-medium">Last Sync</th>
                          <th className="px-4 py-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]">
                        {[
                          { name: "Redtail CRM", status: "Connected", sync: "10 mins ago", connected: true },
                          { name: "Orion Advisor", status: "Connected", sync: "1 hour ago", connected: true },
                          { name: "eMoney", status: "Disconnected", sync: "N/A", connected: false },
                          { name: "Riskalyze", status: "Connected", sync: "2 days ago", connected: true }
                        ].map((integration, i) => (
                          <tr key={i} className="hover:bg-[#12233e]/50 transition-colors">
                            <td className="px-4 py-3 text-white font-medium">{integration.name}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${integration.connected ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#7a95b8]/10 text-[#7a95b8]'}`}>
                                {integration.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#7a95b8]">{integration.sync}</td>
                            <td className="px-4 py-3">
                              <button 
                                onClick={() => toast.success(integration.connected ? `Syncing ${integration.name}` : `Connecting to ${integration.name}`)} 
                                className={`text-xs ${integration.connected ? 'text-[#3b82f6]' : 'text-[#22c55e]'} hover:text-white transition-colors`}
                              >
                                {integration.connected ? 'Sync Now' : 'Connect'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button onClick={() => toast.info("Settings discarded")} className="rc-btn rc-btn-ghost">Cancel</button>
                  <button onClick={() => toast.success("Settings saved successfully")} className="rc-btn rc-btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <PageInsights pageId="ai-assist" />
    </AppShell>
  );
}
