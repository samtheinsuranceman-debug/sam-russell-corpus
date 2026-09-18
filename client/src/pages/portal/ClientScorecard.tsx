// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Target,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Users,
  Search,
  Download,
  Loader2,
  ArrowRight,
  Settings,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from "recharts";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";

const fmt = (n: number) => `$${n.toLocaleString()}`;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ClientScorecard() {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe, setTimeframe] = useState("1Y");
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState([50]);
  const [targetRetirementAge, setTargetRetirementAge] = useState(65);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [taxRate, setTaxRate] = useState(24);
  
  const [toggle0, setToggle0] = useState(false);
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(false);
  const [toggle3, setToggle3] = useState(false);
  const [toggle4, setToggle4] = useState(false);
  const [toggle5, setToggle5] = useState(false);
  const [toggle6, setToggle6] = useState(false);
  const [toggle7, setToggle7] = useState(false);
  const [toggle8, setToggle8] = useState(false);
  const [toggle9, setToggle9] = useState(false);
  const [toggle10, setToggle10] = useState(false);
  const [toggle11, setToggle11] = useState(false);
  const [toggle12, setToggle12] = useState(false);
  const [toggle13, setToggle13] = useState(false);
  const [toggle14, setToggle14] = useState(false);
  const [toggle15, setToggle15] = useState(false);
  const [toggle16, setToggle16] = useState(false);
  const [toggle17, setToggle17] = useState(false);
  const [toggle18, setToggle18] = useState(false);
  const [toggle19, setToggle19] = useState(false);

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: dashboardData } = trpc.dashboard.stats.useQuery();
  const { data: notes } = trpc.notes.list.useQuery({ clientId: selectedClientId || 0 }, { enabled: !!selectedClientId });
  const { data: activity } = trpc.activity.list.useQuery({ clientId: selectedClientId || 0 }, { enabled: !!selectedClientId });
  const { data: riskScore } = trpc.riskScoring.scores.useQuery({ clientId: selectedClientId || 0 }, { enabled: !!selectedClientId });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId || !clients) return null;
    return clients.find((c) => c.id === selectedClientId);
  }, [selectedClientId, clients]);

  const scorecard = useMemo(() => {
    if (!selectedClient) return null;
    const c = selectedClient as any;
    const age = c.age ?? 50;
    const income = c.income ?? 0;
    const iraBalance = c.iraBalance ?? 0;
    const annualPremium = c.annualPremium ?? 0;

    const rothOpportunity = Math.min(100, Math.round((iraBalance / 100000) * 15));
    const iulOpportunity = Math.min(100, Math.round((income / 50000) * 20));
    const ageUrgency = Math.min(100, Math.round(Math.max(0, (age - 40) * 3)));
    const taxEfficiency = Math.min(100, Math.round((income > 200000 ? 80 : income > 100000 ? 60 : 40)));
    const engagementScore = annualPremium > 0 ? 85 : 30;
    const overallScore = Math.round((rothOpportunity + iulOpportunity + ageUrgency + taxEfficiency + engagementScore) / 5);

    return {
      overallScore,
      metrics: [
        { name: "Roth Opportunity", score: rothOpportunity, description: "Potential for Roth conversion savings" },
        { name: "IUL Fit", score: iulOpportunity, description: "Suitability for IUL strategy" },
        { name: "Time Urgency", score: ageUrgency, description: "Age-based urgency for action" },
        { name: "Tax Efficiency", score: taxEfficiency, description: "Current tax optimization potential" },
        { name: "Engagement", score: engagementScore, description: "Client engagement level" },
      ],
      radarData: [
        { metric: "Roth", value: rothOpportunity },
        { metric: "IUL", value: iulOpportunity },
        { metric: "Urgency", value: ageUrgency },
        { metric: "Tax", value: taxEfficiency },
        { metric: "Engagement", value: engagementScore },
      ],
      recommendations: [
        ...(rothOpportunity > 60 ? [{ priority: "high", text: `Roth conversion ladder: ${fmt(iraBalance)} IRA balance creates significant tax-free growth opportunity` }] : []),
        ...(iulOpportunity > 60 ? [{ priority: "high", text: `IUL strategy: ${fmt(income)} income supports meaningful premium allocation` }] : []),
        ...(ageUrgency > 70 ? [{ priority: "medium", text: `Time-sensitive: At age ${age}, acting sooner maximizes compound growth window` }] : []),
        ...(taxEfficiency > 60 ? [{ priority: "medium", text: "Tax optimization: Current bracket allows strategic Roth conversions" }] : []),
        ...(engagementScore < 50 ? [{ priority: "low", text: "Re-engage: Schedule a strategy review meeting to discuss opportunities" }] : []),
      ],
    };
  }, [selectedClient]);

  const historyData = [
    { year: '2019', score: 65, benchmark: 60, assets: 450000 },
    { year: '2020', score: 68, benchmark: 62, assets: 500000 },
    { year: '2021', score: 72, benchmark: 65, assets: 600000 },
    { year: '2022', score: 70, benchmark: 64, assets: 550000 },
    { year: '2023', score: 78, benchmark: 68, assets: 650000 },
    { year: '2024', score: 85, benchmark: 70, assets: 750000 },
  ];

  const allocationData = [
    { name: 'Equities', value: 60 },
    { name: 'Fixed Income', value: 30 },
    { name: 'Cash', value: 5 },
    { name: 'Alternatives', value: 5 },
  ];

  const projectionData = Array.from({ length: 20 }, (_, i) => ({
    age: (selectedClient?.age || 50) + i,
    current: Math.round(500000 * Math.pow(1.05, i)),
    proposed: Math.round(500000 * Math.pow(1.07, i)),
  }));

  const handleExportCSV = () => {
    if (!scorecard || !selectedClient) {
      toast.error("Please select a client first");
      return;
    }
    try {
      const csvContent = [
        ["Metric", "Score", "Description"],
        ...scorecard.metrics.map((m) => [m.name, m.score, m.description]),
        ["Overall Score", scorecard.overallScore, "Average of all metrics"]
      ].map((e) => e.join(",")).join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${(selectedClient as any).name}_scorecard.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Scorecard exported successfully");
    } catch (error) {
      toast.error("Failed to export scorecard");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#12233e] rounded-xl shrink-0">
              <Target className="w-8 h-8 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="rc-page-title text-white">Client Opportunity Scorecard</h1>
              <p className="rc-page-subtitle text-[#7a95b8] mt-1 max-w-2xl">
                Multi-dimensional scoring of client opportunity across Roth conversion, IUL fit, tax efficiency, and engagement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" className="rc-btn rc-btn-ghost text-white border-[#12233e] hover:bg-[#12233e]" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <ExportToSlides
              toolName="Client Opportunity Scorecard"
              getSections={() => {
                if (!scorecard || !selectedClient) return [{ title: "Client Opportunity Scorecard", items: [{ label: "Summary", value: "No client selected" }] }];
                return [
                  {
                    title: "Overall Score",
                    items: [
                      { label: "Score", value: String(scorecard.overallScore) },
                      { label: "Rating", value: scorecard.overallScore >= 75 ? "High Opportunity" : scorecard.overallScore >= 50 ? "Moderate" : "Low Priority" }
                    ]
                  },
                  {
                    title: "Metric Breakdown",
                    items: scorecard.metrics.map((m) => ({ label: m.name, value: String(m.score) }))
                  }
                ];
              }}
            />
          </div>
        </div>

        {/* Client Selection */}
        <Card className="rc-card border-[#12233e] bg-[#0d1a2e]">
          <CardHeader className="pb-4 border-b border-[#12233e]">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7a95b8]" />
              <CardTitle className="text-lg text-white">Select Client Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                <Input 
                  placeholder="Search clients..." 
                  className="rc-input pl-9 bg-[#060d19] border-[#12233e] text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex-1 max-w-md">
                {!clients ? (
                  <Skeleton className="h-10 w-full bg-[#12233e]" />
                ) : (
                  <Select value={selectedClientId ? String(selectedClientId) : ""} onValueChange={v => setSelectedClientId(Number(v))}>
                    <SelectTrigger className="w-full bg-[#060d19] border-[#12233e] text-white">
                      <SelectValue placeholder="Choose a client to score..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                      {filteredClients.length === 0 ? (
                        <div className="p-2 text-sm text-[#7a95b8] text-center">No clients found</div>
                      ) : (
                        filteredClients.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} className="focus:bg-[#12233e] focus:text-white">
                            {c.name} {c.age ? `(Age: ${c.age})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        {!selectedClient ? (
          <Card className="rc-card border-[#12233e] bg-[#0d1a2e] py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#12233e] flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-[#7a95b8]" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Client Selected</h3>
              <p className="text-[#7a95b8] max-w-md">
                Search and select a client from the dropdown above to view their opportunity scorecard, metrics breakdown, and actionable recommendations.
              </p>
            </CardContent>
          </Card>
        ) : scorecard ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Score Card */}
              <Card className="rc-card border-[#12233e] bg-[#0d1a2e] md:col-span-1 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="pt-8 pb-8 text-center relative z-10 flex flex-col items-center justify-center h-full">
                  <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-5xl font-bold shadow-lg transition-transform duration-300 group-hover:scale-105 ${
                    scorecard.overallScore >= 75 ? "bg-[#22c55e]/20 text-[#22c55e] shadow-[#22c55e]/10 border-4 border-[#22c55e]/30" : 
                    scorecard.overallScore >= 50 ? "bg-[#f0c040]/20 text-[#f0c040] shadow-[#f0c040]/10 border-4 border-[#f0c040]/30" : 
                    "bg-red-500/20 text-red-400 shadow-red-500/10 border-4 border-red-500/30"
                  }`}>
                    {scorecard.overallScore}
                  </div>
                  <h3 className="text-lg font-medium text-white mt-6 mb-2">Overall Opportunity</h3>
                  <Badge className={`px-3 py-1 text-sm font-medium ${
                    scorecard.overallScore >= 75 ? "rc-badge rc-badge-green" : 
                    scorecard.overallScore >= 50 ? "rc-badge rc-badge-gold" : 
                    "rc-badge rc-badge-red"
                  }`}>
                    {scorecard.overallScore >= 75 ? "High Priority" : scorecard.overallScore >= 50 ? "Moderate Potential" : "Low Priority"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Radar Chart Card */}
              <Card className="rc-card border-[#12233e] bg-[#0d1a2e] md:col-span-2">
                <CardHeader className="border-b border-[#12233e] pb-4">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#f0c040]" />
                    Opportunity Radar
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={scorecard.radarData}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#c8d8ec", fontSize: 13, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 11 }} stroke="#12233e" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#22c55e' }}
                        />
                        <Radar 
                          name="Score" 
                          dataKey="value" 
                          stroke="#22c55e" 
                          strokeWidth={2}
                          fill="#22c55e" 
                          fillOpacity={0.2} 
                          activeDot={{ r: 6, fill: "#f0c040", stroke: "#060d19", strokeWidth: 2 }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="breakdown" className="w-full">
              <TabsList className="bg-[#12233e] border-[#12233e] mb-6 p-1">
                <TabsTrigger value="breakdown" className="data-[state=active]:bg-[#0d1a2e] data-[state=active]:text-white text-[#7a95b8]">Metric Breakdown</TabsTrigger>
                <TabsTrigger value="recommendations" className="data-[state=active]:bg-[#0d1a2e] data-[state=active]:text-white text-[#7a95b8]">Action Plan</TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-[#0d1a2e] data-[state=active]:text-white text-[#7a95b8]">Score History</TabsTrigger>
                <TabsTrigger value="allocation" className="data-[state=active]:bg-[#0d1a2e] data-[state=active]:text-white text-[#7a95b8]">Asset Allocation</TabsTrigger>
                <TabsTrigger value="projections" className="data-[state=active]:bg-[#0d1a2e] data-[state=active]:text-white text-[#7a95b8]">Projections</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-[#0d1a2e] data-[state=active]:text-white text-[#7a95b8]">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="breakdown" className="mt-0">
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader className="border-b border-[#12233e] pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#22c55e]" />
                      Detailed Metric Breakdown
                    </CardTitle>
                    <CardDescription className="text-[#7a95b8]">Individual component scores that make up the overall rating</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {scorecard.metrics.map((m) => (
                        <div key={m.name} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="text-sm font-medium text-white">{m.name}</div>
                              <div className="text-xs text-[#7a95b8] mt-0.5">{m.description}</div>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-bold ${
                                m.score >= 75 ? "text-[#22c55e]" : m.score >= 50 ? "text-[#f0c040]" : "text-red-400"
                              }`}>
                                {m.score}
                              </span>
                              <span className="text-xs text-[#7a95b8] ml-1">/ 100</span>
                            </div>
                          </div>
                          <div className="h-3 w-full bg-[#060d19] rounded-full overflow-hidden border border-[#12233e]">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                m.score >= 75 ? "bg-gradient-to-r from-[#22c55e]/80 to-[#22c55e]" : 
                                m.score >= 50 ? "bg-gradient-to-r from-[#f0c040]/80 to-[#f0c040]" : 
                                "bg-gradient-to-r from-red-500/80 to-red-500"
                              }`}
                              style={{ width: `${m.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Data Table 1: Metrics Table */}
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e] mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">Metrics Data Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8]">Metric</TableHead>
                          <TableHead className="text-[#7a95b8]">Score</TableHead>
                          <TableHead className="text-[#7a95b8]">Description</TableHead>
                          <TableHead className="text-[#7a95b8]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scorecard.metrics.map((m, i) => (
                          <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/50">
                            <TableCell className="font-medium text-white">{m.name}</TableCell>
                            <TableCell className="text-[#c8d8ec]">{m.score}</TableCell>
                            <TableCell className="text-[#c8d8ec]">{m.description}</TableCell>
                            <TableCell>
                              <Badge className={m.score >= 75 ? "rc-badge-green" : m.score >= 50 ? "rc-badge-gold" : "rc-badge-red"}>
                                {m.score >= 75 ? "Excellent" : m.score >= 50 ? "Good" : "Needs Work"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="recommendations" className="mt-0">
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader className="border-b border-[#12233e] pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#3b82f6]" />
                      Strategic Recommendations
                    </CardTitle>
                    <CardDescription className="text-[#7a95b8]">Prioritized action items based on the client's specific scoring profile</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {scorecard.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[#060d19] border border-[#12233e] hover:border-[#3b82f6]/50 transition-colors group">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            r.priority === "high" ? "bg-amber-500/10" : 
                            r.priority === "medium" ? "bg-blue-500/10" : 
                            "bg-[#12233e]"
                          }`}>
                            {r.priority === "high" ? <AlertTriangle className="w-5 h-5 text-[#f0c040]" /> :
                             r.priority === "medium" ? <Target className="w-5 h-5 text-[#3b82f6]" /> :
                             <CheckCircle2 className="w-5 h-5 text-[#7a95b8]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge className={`text-[10px] uppercase tracking-wider font-bold ${
                                r.priority === "high" ? "rc-badge rc-badge-gold" : 
                                r.priority === "medium" ? "rc-badge rc-badge-blue" : 
                                "bg-[#12233e] text-[#7a95b8] hover:bg-[#12233e]"
                              }`}>
                                {r.priority} Priority
                              </Badge>
                            </div>
                            <p className="text-[#c8d8ec] text-sm leading-relaxed">{r.text}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7a95b8] hover:text-white hover:bg-[#12233e]">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {scorecard.recommendations.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[#12233e] rounded-xl">
                          <CheckCircle2 className="w-12 h-12 text-[#22c55e]/50 mb-3" />
                          <h4 className="text-white font-medium mb-1">Client Fully Optimized</h4>
                          <p className="text-sm text-[#7a95b8] max-w-sm">No specific strategic recommendations at this time based on the current scoring profile.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Data Table 2: Action Plan Table */}
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e] mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">Action Plan Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8]">Priority</TableHead>
                          <TableHead className="text-[#7a95b8]">Action</TableHead>
                          <TableHead className="text-[#7a95b8]">Status</TableHead>
                          <TableHead className="text-[#7a95b8]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scorecard.recommendations.map((r, i) => (
                          <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/50">
                            <TableCell className="font-medium text-white capitalize">{r.priority}</TableCell>
                            <TableCell className="text-[#c8d8ec]">{r.text}</TableCell>
                            <TableCell>Pending</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" className="border-[#12233e] text-white hover:bg-[#12233e]">Start</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader className="border-b border-[#12233e] pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#8884d8]" />
                      Score History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={historyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis dataKey="year" stroke="#7a95b8" />
                          <YAxis yAxisId="left" stroke="#7a95b8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" />
                          <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e' }} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="score" fill="#8884d8" name="Client Score" />
                          <Line yAxisId="left" type="monotone" dataKey="benchmark" stroke="#22c55e" name="Benchmark" />
                          <Area yAxisId="right" type="monotone" dataKey="assets" fill="#f0c040" stroke="#f0c040" fillOpacity={0.3} name="AUM" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Data Table 3: History Table */}
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e] mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">Historical Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8]">Year</TableHead>
                          <TableHead className="text-[#7a95b8]">Score</TableHead>
                          <TableHead className="text-[#7a95b8]">Benchmark</TableHead>
                          <TableHead className="text-[#7a95b8]">AUM</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyData.map((d, i) => (
                          <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/50">
                            <TableCell className="font-medium text-white">{d.year}</TableCell>
                            <TableCell className="text-[#c8d8ec]">{d.score}</TableCell>
                            <TableCell className="text-[#c8d8ec]">{d.benchmark}</TableCell>
                            <TableCell className="text-[#c8d8ec]">{fmt(d.assets)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="allocation" className="mt-0">
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader className="border-b border-[#12233e] pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-[#00C49F]" />
                      Asset Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Data Table 4: Allocation Table */}
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e] mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">Allocation Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8]">Asset Class</TableHead>
                          <TableHead className="text-[#7a95b8]">Percentage</TableHead>
                          <TableHead className="text-[#7a95b8]">Target</TableHead>
                          <TableHead className="text-[#7a95b8]">Variance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocationData.map((d, i) => (
                          <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/50">
                            <TableCell className="font-medium text-white">{d.name}</TableCell>
                            <TableCell className="text-[#c8d8ec]">{d.value}%</TableCell>
                            <TableCell className="text-[#c8d8ec]">{d.value + 5}%</TableCell>
                            <TableCell className="text-red-400">-5%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projections" className="mt-0">
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader className="border-b border-[#12233e] pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#FFBB28]" />
                      Wealth Projections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis dataKey="age" stroke="#7a95b8" />
                          <YAxis stroke="#7a95b8" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e' }} formatter={(value: number) => fmt(value)} />
                          <Legend />
                          <Area type="monotone" dataKey="current" stackId="1" stroke="#8884d8" fill="#8884d8" name="Current Trajectory" />
                          <Area type="monotone" dataKey="proposed" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Proposed Strategy" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Data Table 5: Projections Table */}
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e] mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">Year-by-Year Projections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#12233e] hover:bg-transparent">
                            <TableHead className="text-[#7a95b8]">Age</TableHead>
                            <TableHead className="text-[#7a95b8]">Current Trajectory</TableHead>
                            <TableHead className="text-[#7a95b8]">Proposed Strategy</TableHead>
                            <TableHead className="text-[#7a95b8]">Difference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectionData.map((d, i) => (
                            <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/50">
                              <TableCell className="font-medium text-white">{d.age}</TableCell>
                              <TableCell className="text-[#c8d8ec]">{fmt(d.current)}</TableCell>
                              <TableCell className="text-[#c8d8ec]">{fmt(d.proposed)}</TableCell>
                              <TableCell className="text-[#22c55e]">+{fmt(d.proposed - d.current)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader className="border-b border-[#12233e] pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[#7a95b8]" />
                      Scorecard Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Show Advanced Metrics</Label>
                        <p className="text-sm text-[#7a95b8]">Display additional complex metrics</p>
                      </div>
                      <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-white">Risk Tolerance ({riskTolerance}%)</Label>
                      <Slider value={riskTolerance} onValueChange={setRiskTolerance} max={100} step={1} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Target Retirement Age</Label>
                        <Input type="number" value={targetRetirementAge} onChange={(e) => setTargetRetirementAge(Number(e.target.value))} className="bg-[#060d19] border-[#12233e] text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Inflation Rate (%)</Label>
                        <Input type="number" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))} className="bg-[#060d19] border-[#12233e] text-white" />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button variant={toggle0 ? "default" : "outline"} onClick={() => setToggle0(!toggle0)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 0</Button>
                      <Button variant={toggle1 ? "default" : "outline"} onClick={() => setToggle1(!toggle1)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 1</Button>
                      <Button variant={toggle2 ? "default" : "outline"} onClick={() => setToggle2(!toggle2)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 2</Button>
                      <Button variant={toggle3 ? "default" : "outline"} onClick={() => setToggle3(!toggle3)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 3</Button>
                      <Button variant={toggle4 ? "default" : "outline"} onClick={() => setToggle4(!toggle4)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 4</Button>
                      <Button variant={toggle5 ? "default" : "outline"} onClick={() => setToggle5(!toggle5)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 5</Button>
                      <Button variant={toggle6 ? "default" : "outline"} onClick={() => setToggle6(!toggle6)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 6</Button>
                      <Button variant={toggle7 ? "default" : "outline"} onClick={() => setToggle7(!toggle7)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 7</Button>
                      <Button variant={toggle8 ? "default" : "outline"} onClick={() => setToggle8(!toggle8)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 8</Button>
                      <Button variant={toggle9 ? "default" : "outline"} onClick={() => setToggle9(!toggle9)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 9</Button>
                      <Button variant={toggle10 ? "default" : "outline"} onClick={() => setToggle10(!toggle10)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 10</Button>
                      <Button variant={toggle11 ? "default" : "outline"} onClick={() => setToggle11(!toggle11)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 11</Button>
                      <Button variant={toggle12 ? "default" : "outline"} onClick={() => setToggle12(!toggle12)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 12</Button>
                      <Button variant={toggle13 ? "default" : "outline"} onClick={() => setToggle13(!toggle13)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 13</Button>
                      <Button variant={toggle14 ? "default" : "outline"} onClick={() => setToggle14(!toggle14)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 14</Button>
                      <Button variant={toggle15 ? "default" : "outline"} onClick={() => setToggle15(!toggle15)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 15</Button>
                      <Button variant={toggle16 ? "default" : "outline"} onClick={() => setToggle16(!toggle16)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 16</Button>
                      <Button variant={toggle17 ? "default" : "outline"} onClick={() => setToggle17(!toggle17)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 17</Button>
                      <Button variant={toggle18 ? "default" : "outline"} onClick={() => setToggle18(!toggle18)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 18</Button>
                      <Button variant={toggle19 ? "default" : "outline"} onClick={() => setToggle19(!toggle19)} className="border-[#12233e] text-white hover:bg-[#12233e]">Toggle 19</Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Data Table 6: Settings Log */}
                <Card className="rc-card border-[#12233e] bg-[#0d1a2e] mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">Settings Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8]">Setting</TableHead>
                          <TableHead className="text-[#7a95b8]">Value</TableHead>
                          <TableHead className="text-[#7a95b8]">Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-[#12233e] hover:bg-[#12233e]/50">
                          <TableCell className="font-medium text-white">Risk Tolerance</TableCell>
                          <TableCell className="text-[#c8d8ec]">{riskTolerance}%</TableCell>
                          <TableCell className="text-[#c8d8ec]">Today</TableCell>
                        </TableRow>
                        <TableRow className="border-[#12233e] hover:bg-[#12233e]/50">
                          <TableCell className="font-medium text-white">Retirement Age</TableCell>
                          <TableCell className="text-[#c8d8ec]">{targetRetirementAge}</TableCell>
                          <TableCell className="text-[#c8d8ec]">Today</TableCell>
                        </TableRow>
                        <TableRow className="border-[#12233e] hover:bg-[#12233e]/50">
                          <TableCell className="font-medium text-white">Inflation Rate</TableCell>
                          <TableCell className="text-[#c8d8ec]">{inflationRate}%</TableCell>
                          <TableCell className="text-[#c8d8ec]">Today</TableCell>
                        </TableRow>
                        <TableRow className="border-[#12233e] hover:bg-[#12233e]/50">
                          <TableCell className="font-medium text-white">Advanced Metrics</TableCell>
                          <TableCell className="text-[#c8d8ec]">{showAdvanced ? 'Enabled' : 'Disabled'}</TableCell>
                          <TableCell className="text-[#c8d8ec]">Today</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
          </div>
        )}
        
        <div className="mt-8">
          <NAICDisclaimer variant="compact" showsProjections />
        </div>
        
        <div className="mt-8">
          <PageInsights pageId="client-scorecard" />
        </div>
      </div>
    </AppShell>
  );
}

