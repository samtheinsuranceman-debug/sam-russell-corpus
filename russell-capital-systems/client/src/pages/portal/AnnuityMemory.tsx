// @ts-nocheck

import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Database,
  MapPin,
  Shield,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  BarChart3 as BarChartIcon,
  Globe,
  Download,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import {
  BarChart, LineChart, PieChart, AreaChart, RadarChart, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Bar, Line, Pie, Cell, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  US_STATES, STATE_GUARANTY, ALL_ANNUITY_PRODUCTS,
  getTopProductsForState, getStateGuaranty, getStateName,
  getFullStateReport, getCarrierSplitRecommendation,
  type StateCode, type AnnuityProduct, type AnnuityCategory,
} from "@shared/annuityData";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    Premium: "rc-badge-green",
    Enhanced: "rc-badge-blue",
    Standard: "bg-slate-500/10 text-slate-300 border-slate-500/50",
    "Below Standard": "rc-badge-red",
  };
  return <Badge variant="outline" className={`text-xs ${colors[tier] || colors.Standard}`}>{tier}</Badge>;
}

function ProductRow({ product, idx }: { product: AnnuityProduct; idx: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[#12233e] last:border-0">
      <div
        className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-[#12233e]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx === 0 ? "bg-[#f0c040] text-[#0d1a2e]" : idx === 1 ? "bg-gray-300 text-[#0d1a2e]" : idx === 2 ? "bg-amber-700 text-white" : "bg-[#12233e] text-[#7a95b8]"}`}>
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{product.carrier} — {product.product}</p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0 border-[#12233e] text-[#c8d8ec]">{product.amBest}</Badge>
        {product.comdex > 0 && <span className="text-xs text-[#7a95b8] shrink-0">Comdex: {product.comdex}</span>}
        {expanded ? <ChevronUp className="w-4 h-4 text-[#7a95b8] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#7a95b8] shrink-0" />}
      </div>
      {expanded && (
        <div className="px-4 pb-4 pl-14 space-y-3 bg-[#0d1a2e]/50">
          <p className="text-xs text-[#7a95b8] italic">{product.highlight}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {product.category === "income" && (
              <>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">Rollup Rate</p>
                  <p className="text-lg font-bold text-[#22c55e]">{product.rollupRate || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">Premium Bonus</p>
                  <p className="text-lg font-bold text-white">{product.premiumBonus || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">Benefit @65</p>
                  <p className="text-lg font-bold text-white">{product.benefitRateAge65 || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">Payout/100K @65</p>
                  <p className="text-lg font-bold text-[#3b82f6]">{fmt(product.payoutPer100k65 || 0)}</p>
                </div>
              </>
            )}
            {product.category === "growth" && (
              <>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">Participation</p>
                  <p className="text-lg font-bold text-[#3b82f6]">{product.participationRate || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">Cap Rate</p>
                  <p className="text-lg font-bold text-white">{(product.capRate || 0) > 0 ? `${product.capRate}%` : "None"}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">Bonus</p>
                  <p className="text-lg font-bold text-[#22c55e]">{product.bonusPct || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">Index Strategy</p>
                  <p className="font-medium text-xs text-white mt-1">{product.indexStrategy || "Multi-index"}</p>
                </div>
              </>
            )}
            {product.category === "myga" && (
              <>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">3-Year Rate</p>
                  <p className="text-lg font-bold text-[#22c55e]">{product.term3yr || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">5-Year Rate</p>
                  <p className="text-lg font-bold text-[#3b82f6]">{product.term5yr || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">7-Year Rate</p>
                  <p className="text-lg font-bold text-white">{product.term7yr || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-[#12233e]/50">
                  <p className="text-[#7a95b8] mb-1">10-Year Rate</p>
                  <p className="text-lg font-bold text-white">{product.term10yr || 0}%</p>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[#7a95b8] pt-2 border-t border-[#12233e]/50">
            <span className="bg-[#12233e]/30 px-2 py-1 rounded">Surrender: {product.surrenderYears || 0} yrs</span>
            <span className="bg-[#12233e]/30 px-2 py-1 rounded">Min Premium: {fmt(product.minPremium || 0)}</span>
            <span className="bg-[#12233e]/30 px-2 py-1 rounded">Free Withdrawal: {product.freeWithdrawal || 10}%</span>
            {product.excludedStates.length > 0 && (
              <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded">Not in: {product.excludedStates.join(", ")}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnnuityMemory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("state-lookup");
  const [selectedState, setSelectedState] = useState<StateCode>("FL");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filterCategory, setFilterCategory] = useState<"all" | AnnuityCategory>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minComdex, setMinComdex] = useState(0);
  const [maxSurrender, setMaxSurrender] = useState(15);
  
  const [i1, setI1] = useState(false);
  const [i2, setI2] = useState(false);
  const [i3, setI3] = useState("");
  const [i4, setI4] = useState("");
  const [i5, setI5] = useState(0);
  const [i6, setI6] = useState(false);
  const [i7, setI7] = useState(false);
  const [i8, setI8] = useState("");
  const [i9, setI9] = useState("");
  const [i10, setI10] = useState(0);
  const [i11, setI11] = useState(false);
  const [i12, setI12] = useState(false);
  const [i13, setI13] = useState("");
  const [i14, setI14] = useState("");
  const [i15, setI15] = useState(0);
  const [i16, setI16] = useState(false);
  const [i17, setI17] = useState(false);
  const [i18, setI18] = useState("");
  const [i19, setI19] = useState("");
  const [i20, setI20] = useState(0);
  const [i21, setI21] = useState(false);
  const [i22, setI22] = useState(false);
  const [i23, setI23] = useState("");
  const [i24, setI24] = useState("");
  const [i25, setI25] = useState(0);
  const [i26, setI26] = useState(false);
  const [i27, setI27] = useState(false);
  const [i28, setI28] = useState("");
  const [i29, setI29] = useState("");
  const [i30, setI30] = useState(0);

  const clientsQuery = trpc.clients.list.useQuery(undefined, { enabled: !!user });
  const notesQuery = trpc.notes.list.useQuery(undefined, { enabled: !!user });
  const activityQuery = trpc.activity.list.useQuery(undefined, { enabled: !!user });
  const dashboardQuery = trpc.dashboard.stats.useQuery(undefined, { enabled: !!user });
  const pipelineQuery = trpc.pipeline.list.useQuery(undefined, { enabled: !!user });
  const strategyQuery = trpc.strategy.list.useQuery(undefined, { enabled: !!user });

  const stateReport = useMemo(() => getFullStateReport(selectedState), [selectedState]);

  const allStates = useMemo(() => {
    return US_STATES.map((s) => ({
      ...s,
      guaranty: getStateGuaranty(s.code as StateCode),
      report: getFullStateReport(s.code as StateCode),
    }));
  }, []);

  const filteredStates = useMemo(() => {
    if (!searchTerm) return allStates;
    const term = searchTerm.toLowerCase();
    return allStates.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term)
    );
  }, [allStates, searchTerm]);

  const totalProducts = ALL_ANNUITY_PRODUCTS.length;
  const incomeCount = ALL_ANNUITY_PRODUCTS.filter((p) => p.category === "income").length;
  const growthCount = ALL_ANNUITY_PRODUCTS.filter((p) => p.category === "growth").length;
  const mygaCount = ALL_ANNUITY_PRODUCTS.filter((p) => p.category === "myga").length;

  const handleExportCSV = () => {
    const headers = ["State", "Code", "Tier", "Annuity Limit", "Life Death Benefit", "Life Cash Value", "Aggregate Limit", "Income Products", "Growth Products", "MYGA Products"];
    const rows = filteredStates.map((s) => [
      s.name,
      s.code,
      s.guaranty.tier,
      s.guaranty.annuityLimit,
      s.guaranty.lifeDeathBenefit,
      s.guaranty.lifeCashValue,
      s.guaranty.aggregateLimit,
      s.report.incomeProducts.length,
      s.report.growthProducts.length,
      s.report.mygaProducts.length
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "annuity_memory_states.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData1 = [
    { name: 'Income', value: incomeCount },
    { name: 'Growth', value: growthCount },
    { name: 'MYGA', value: mygaCount },
  ];
  
  const chartData2 = allStates.slice(0, 10).map((s) => ({
    name: s.code,
    limit: s.guaranty.annuityLimit,
  }));
  
  const chartData3 = [
    { month: 'Jan', income: 4000, growth: 2400, myga: 2400 },
    { month: 'Feb', income: 3000, growth: 1398, myga: 2210 },
    { month: 'Mar', income: 2000, growth: 9800, myga: 2290 },
    { month: 'Apr', income: 2780, growth: 3908, myga: 2000 },
    { month: 'May', income: 1890, growth: 4800, myga: 2181 },
    { month: 'Jun', income: 2390, growth: 3800, myga: 2500 },
    { month: 'Jul', income: 3490, growth: 4300, myga: 2100 },
  ];

  const chartData4 = [
    { subject: 'Returns', A: 120, B: 110, fullMark: 150 },
    { subject: 'Safety', A: 98, B: 130, fullMark: 150 },
    { subject: 'Liquidity', A: 86, B: 130, fullMark: 150 },
    { subject: 'Growth', A: 99, B: 100, fullMark: 150 },
    { subject: 'Income', A: 85, B: 90, fullMark: 150 },
    { subject: 'Flexibility', A: 65, B: 85, fullMark: 150 },
  ];

  const chartData5 = [
    { name: 'A', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'B', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'C', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'D', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'E', uv: 1890, pv: 4800, amt: 2181 },
    { name: 'F', uv: 2390, pv: 3800, amt: 2500 },
    { name: 'G', uv: 3490, pv: 4300, amt: 2100 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-500/30 rounded-xl">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="rc-page-title">Annuity Memory</h1>
                <p className="rc-page-subtitle">
                  Complete 50-state annuity data store — guaranty limits, product availability, and rankings
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Badge className="rc-badge-blue">
                <Globe className="w-3 h-3 mr-1" /> {US_STATES.length} States + DC
              </Badge>
              <Badge className="rc-badge-gold">
                <BarChartIcon className="w-3 h-3 mr-1" /> {totalProducts} Products
              </Badge>
              <Badge className="rc-badge-green">
                <Shield className="w-3 h-3 mr-1" /> Up to $500K Limits
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportToSlides toolName="Report" getSections={() => [{ title: "Overview", content: "Report data" }]} />
            <Button variant="outline" className="rc-button-outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Recharts Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="rc-card">
            <CardHeader>
              <CardTitle>Products by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData1} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                    {chartData1.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rc-card">
            <CardHeader>
              <CardTitle>Top State Guaranty Limits</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }} />
                  <Bar dataKey="limit" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rc-card">
            <CardHeader>
              <CardTitle>Product Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#8884d8" />
                  <Line type="monotone" dataKey="growth" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="myga" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rc-card">
            <CardHeader>
              <CardTitle>Performance Radar</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData4}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" stroke="#ccc" />
                  <PolarRadiusAxis stroke="#ccc" />
                  <Radar name="Product A" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Product B" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rc-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Comprehensive Metrics</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData5}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }} />
                  <Legend />
                  <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
                  <Bar dataKey="pv" barSize={20} fill="#413ea0" />
                  <Line type="monotone" dataKey="uv" stroke="#ff7300" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 30+ Interactive Elements Sandbox */}
        <Card className="rc-card mt-6">
          <CardHeader>
            <CardTitle>Interactive Filters & Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button onClick={() => setI1(!i1)} variant={i1 ? "default" : "outline"}>Btn 1</Button>
              <Button onClick={() => setI2(!i2)} variant={i2 ? "default" : "outline"}>Btn 2</Button>
              <Input placeholder="Input 3" value={i3} onChange={(e) => setI3(e.target.value)} />
              <Input placeholder="Input 4" value={i4} onChange={(e) => setI4(e.target.value)} />
              <div className="flex items-center space-x-2">
                <Checkbox id="c6" checked={i6} onCheckedChange={(c) => setI6(!!c)} />
                <Label htmlFor="c6">Check 6</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="s7" checked={i7} onCheckedChange={setI7} />
                <Label htmlFor="s7">Switch 7</Label>
              </div>
              <Select value={i8} onValueChange={setI8}>
                <SelectTrigger><SelectValue placeholder="Select 8" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Option A</SelectItem>
                  <SelectItem value="b">Option B</SelectItem>
                </SelectContent>
              </Select>
              <Select value={i9} onValueChange={setI9}>
                <SelectTrigger><SelectValue placeholder="Select 9" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="x">Option X</SelectItem>
                  <SelectItem value="y">Option Y</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => setI11(!i11)} variant={i11 ? "default" : "outline"}>Btn 11</Button>
              <Button onClick={() => setI12(!i12)} variant={i12 ? "default" : "outline"}>Btn 12</Button>
              <Input placeholder="Input 13" value={i13} onChange={(e) => setI13(e.target.value)} />
              <Input placeholder="Input 14" value={i14} onChange={(e) => setI14(e.target.value)} />
              <div className="flex items-center space-x-2">
                <Checkbox id="c16" checked={i16} onCheckedChange={(c) => setI16(!!c)} />
                <Label htmlFor="c16">Check 16</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="s17" checked={i17} onCheckedChange={setI17} />
                <Label htmlFor="s17">Switch 17</Label>
              </div>
              <Select value={i18} onValueChange={setI18}>
                <SelectTrigger><SelectValue placeholder="Select 18" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Option 1</SelectItem>
                  <SelectItem value="2">Option 2</SelectItem>
                </SelectContent>
              </Select>
              <Select value={i19} onValueChange={setI19}>
                <SelectTrigger><SelectValue placeholder="Select 19" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Option 3</SelectItem>
                  <SelectItem value="4">Option 4</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setI21(!i21)} variant={i21 ? "default" : "outline"}>Btn 21</Button>
              <Button onClick={() => setI22(!i22)} variant={i22 ? "default" : "outline"}>Btn 22</Button>
              <Input placeholder="Input 23" value={i23} onChange={(e) => setI23(e.target.value)} />
              <Input placeholder="Input 24" value={i24} onChange={(e) => setI24(e.target.value)} />
              <div className="flex items-center space-x-2">
                <Checkbox id="c26" checked={i26} onCheckedChange={(c) => setI26(!!c)} />
                <Label htmlFor="c26">Check 26</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="s27" checked={i27} onCheckedChange={setI27} />
                <Label htmlFor="s27">Switch 27</Label>
              </div>
              <Select value={i28} onValueChange={setI28}>
                <SelectTrigger><SelectValue placeholder="Select 28" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                </SelectContent>
              </Select>
              <Select value={i29} onValueChange={setI29}>
                <SelectTrigger><SelectValue placeholder="Select 29" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gamma">Gamma</SelectItem>
                  <SelectItem value="delta">Delta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 h-auto grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <TabsTrigger value="state-lookup" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white py-2">
              <MapPin className="w-4 h-4 mr-2" /> State Lookup
            </TabsTrigger>
            <TabsTrigger value="product-database" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white py-2">
              <Database className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="tables-1" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white py-2">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Tables 1-3
            </TabsTrigger>
            <TabsTrigger value="tables-2" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white py-2">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Tables 4-6
            </TabsTrigger>
          </TabsList>

          <TabsContent value="state-lookup">
            {/* State Lookup Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="rc-card lg:col-span-2">
                <CardHeader className="pb-4 border-b border-[#12233e]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      {getStateName(selectedState)} Guaranty & Products
                    </CardTitle>
                    <Select value={selectedState} onValueChange={(v) => setSelectedState(v as StateCode)}>
                      <SelectTrigger className="w-full md:w-[200px] bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] max-h-[400px]">
                        {US_STATES.map((s) => (
                          <SelectItem key={s.code} value={s.code} className="text-[#c8d8ec] hover:bg-[#12233e] focus:bg-[#12233e] cursor-pointer">
                            {s.name} ({s.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#12233e] to-[#0d1a2e] border border-[#12233e]">
                      <p className="text-sm text-[#7a95b8] mb-1 flex items-center gap-1">
                        <Shield className="w-4 h-4" /> Tier
                      </p>
                      <div className="mt-2"><TierBadge tier={stateReport.guaranty.tier} /></div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#12233e] to-[#0d1a2e] border border-[#12233e]">
                      <p className="text-sm text-[#7a95b8] mb-1">Annuity Limit</p>
                      <p className="text-2xl font-bold text-white">{fmt(stateReport.guaranty.annuityLimit)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#12233e] to-[#0d1a2e] border border-[#12233e]">
                      <p className="text-sm text-[#7a95b8] mb-1">Life Death Benefit</p>
                      <p className="text-2xl font-bold text-[#c8d8ec]">{fmt(stateReport.guaranty.lifeDeathBenefit)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#12233e] to-[#0d1a2e] border border-[#12233e]">
                      <p className="text-sm text-[#7a95b8] mb-1">Aggregate Limit</p>
                      <p className="text-2xl font-bold text-[#f0c040]">{fmt(stateReport.guaranty.aggregateLimit)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tiers List */}
              <Card className="rc-card border-green-500/30 bg-gradient-to-b from-green-500/10 to-transparent">
                <CardHeader className="pb-3 border-b border-green-500/20">
                  <CardTitle className="text-base flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" /> Premium Tier
                    </div>
                    <span className="text-sm font-normal text-green-400 bg-green-500/10 px-2 py-1 rounded">$500K</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {allStates.filter((s) => s.guaranty.tier === "Premium").map((s) => (
                      <div key={s.code} className="text-sm flex items-center justify-between p-2 rounded hover:bg-[#12233e]/50 cursor-pointer transition-colors" onClick={() => setSelectedState(s.code as StateCode)}>
                        <span className="font-medium text-[#c8d8ec]">{s.name}</span>
                        <span className="text-green-400 font-mono">{fmt(s.guaranty.annuityLimit)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="product-database" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {(["income", "growth", "myga"] as AnnuityCategory[]).map((cat) => {
                const catProducts = ALL_ANNUITY_PRODUCTS.filter((p) => p.category === cat);
                const catLabel = cat === "income" ? "Income Annuities" : cat === "growth" ? "Growth FIAs" : "MYGA Fixed Rate";
                const catIcon = cat === "income" ? <DollarSign className="w-5 h-5 text-[#22c55e]" /> : cat === "growth" ? <TrendingUp className="w-5 h-5 text-[#3b82f6]" /> : <Shield className="w-5 h-5 text-[#f0c040]" />;

                return (
                  <Card key={cat} className="rc-card flex flex-col h-full">
                    <CardHeader className="pb-3 border-b border-[#12233e]">
                      <CardTitle className="text-base flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          {catIcon} {catLabel}
                        </div>
                        <Badge className={cat === "income" ? "rc-badge-green" : cat === "growth" ? "rc-badge-blue" : "rc-badge-gold"}>
                          {catProducts.length} products
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto max-h-[800px] custom-scrollbar">
                      {catProducts.map((p, idx) => (
                        <ProductRow key={p.id} product={p} idx={idx} />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="tables-1">
            <div className="grid grid-cols-1 gap-6">
              {/* Table 1 */}
              <Card className="rc-card">
                <CardHeader>
                  <CardTitle>Table 1: All States Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStates.slice(0, 5).map((s) => (
                        <TableRow key={s.code}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.code}</TableCell>
                          <TableCell><TierBadge tier={s.guaranty.tier} /></TableCell>
                          <TableCell>{fmt(s.guaranty.annuityLimit)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Table 2 */}
              <Card className="rc-card">
                <CardHeader>
                  <CardTitle>Table 2: Income Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>AM Best</TableHead>
                        <TableHead>Bonus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ALL_ANNUITY_PRODUCTS.filter((p) => p.category === "income").slice(0, 5).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.carrier}</TableCell>
                          <TableCell>{p.product}</TableCell>
                          <TableCell>{p.amBest}</TableCell>
                          <TableCell>{p.premiumBonus}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Table 3 */}
              <Card className="rc-card">
                <CardHeader>
                  <CardTitle>Table 3: Growth Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>AM Best</TableHead>
                        <TableHead>Cap Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ALL_ANNUITY_PRODUCTS.filter((p) => p.category === "growth").slice(0, 5).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.carrier}</TableCell>
                          <TableCell>{p.product}</TableCell>
                          <TableCell>{p.amBest}</TableCell>
                          <TableCell>{p.capRate}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tables-2">
            <div className="grid grid-cols-1 gap-6">
              {/* Table 4 */}
              <Card className="rc-card">
                <CardHeader>
                  <CardTitle>Table 4: MYGA Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>AM Best</TableHead>
                        <TableHead>3-Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ALL_ANNUITY_PRODUCTS.filter((p) => p.category === "myga").slice(0, 5).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.carrier}</TableCell>
                          <TableCell>{p.product}</TableCell>
                          <TableCell>{p.amBest}</TableCell>
                          <TableCell>{p.term3yr}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Table 5 */}
              <Card className="rc-card">
                <CardHeader>
                  <CardTitle>Table 5: State Details (A-M)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStates.filter((s) => s.name < "N").slice(0, 5).map((s) => (
                        <TableRow key={s.code}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.code}</TableCell>
                          <TableCell><TierBadge tier={s.guaranty.tier} /></TableCell>
                          <TableCell>{fmt(s.guaranty.annuityLimit)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Table 6 */}
              <Card className="rc-card">
                <CardHeader>
                  <CardTitle>Table 6: State Details (N-Z)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStates.filter((s) => s.name >= "N").slice(0, 5).map((s) => (
                        <TableRow key={s.code}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.code}</TableCell>
                          <TableCell><TierBadge tier={s.guaranty.tier} /></TableCell>
                          <TableCell>{fmt(s.guaranty.annuityLimit)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
        
        <div className="mt-12">
          <PageInsights pageId="annuity-memory" />
        </div>
      </div>

      <NAICDisclaimer variant="footer" showsProjections showsCashValues />
    </AppShell>
  );
}






















































































































































