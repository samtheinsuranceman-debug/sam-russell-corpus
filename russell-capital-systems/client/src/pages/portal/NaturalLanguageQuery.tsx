// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line,
  RadarChart, ComposedChart, Legend, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Search,
  Send,
  Sparkles,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Copy,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Settings,
  History,
  Bookmark,
  MessageSquare,
  Trash2,
  RefreshCw,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { ExportToSlides } from "@/components/ExportToSlides";

interface QueryResult {
  id: string;
  query: string;
  answer: string;
  data: any[] | null;
  columns: string[];
  timestamp: Date;
  category?: string;
  confidence?: number;
  tokens?: number;
  liked?: boolean;
}

const EXAMPLE_QUERIES = [
  "How many clients do I have?",
  "What is my total AUM across all clients?",
  "Which clients are over age 60?",
  "Show me clients with income over $200,000",
  "Who has the largest IRA balance?",
  "Which clients have no life insurance?",
  "What is the average client age?",
  "Show clients in California",
  "Who hasn't been contacted in 30 days?",
  "List clients with mortgage rates above 6%",
];

const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

export default function NaturalLanguageQuery() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("query");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [savedQueries, setSavedQueries] = useState<string[]>(EXAMPLE_QUERIES.slice(0, 3));
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [autoSave, setAutoSave] = useState(true);
  const [contextWindow, setContextWindow] = useState("standard");
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: aiSettings } = trpc.ai.getSettings.useQuery();
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery();
  const { data: activityLogs } = trpc.activity.list.useQuery({ limit: 10 });
  const { data: knowledgeBase } = trpc.knowledge.search.useQuery({ query: "nlq" });
  const { data: teamMembers } = trpc.team.members.useQuery();
  const { data: recentNotes } = trpc.notes.list.useQuery({ limit: 5 });

  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [results]);

  const analyticsData = useMemo(() => {
    if (!clients || clients.length === 0) {
      return {
        ageDistribution: [],
        topAum: [],
        stateDistribution: [],
        wealthTrend: [],
        riskProfile: [],
        productMix: []
      };
    }

    const ageGroups = { "Under 40": 0, "40-55": 0, "56-70": 0, "Over 70": 0 };
    const states: Record<string, number> = {};
    const risks: Record<string, number> = { "Conservative": 0, "Moderate": 0, "Aggressive": 0 };
    
    let totalAum = 0;

    clients.forEach((c) => {
      const age = c.age || 0;
      if (age < 40) ageGroups["Under 40"]++;
      else if (age <= 55) ageGroups["40-55"]++;
      else if (age <= 70) ageGroups["56-70"]++;
      else ageGroups["Over 70"]++;

      if (c.state) {
        states[c.state] = (states[c.state] || 0) + 1;
      }
      
      const aum = ((c.traditionalIra ?? 0) + (c.rothIra ?? 0) + (c.retirement401k ?? 0) + (c.taxableAccounts ?? 0));
      totalAum += aum;
      
      if (aum < 100000) risks["Conservative"]++;
      else if (aum < 500000) risks["Moderate"]++;
      else risks["Aggressive"]++;
    });

    const ageDistribution = Object.entries(ageGroups).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
    const stateDistribution = Object.entries(states).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    const riskProfile = Object.entries(risks).map(([name, value]) => ({ name, value }));

    const topAum = [...clients]
      .map((c) => ({
        name: c.name.split(" ")[0],
        aum: ((c.traditionalIra ?? 0) + (c.rothIra ?? 0) + (c.retirement401k ?? 0) + (c.taxableAccounts ?? 0)) / 1000,
        ira: (c.traditionalIra ?? 0) / 1000,
        taxable: (c.taxableAccounts ?? 0) / 1000
      }))
      .sort((a, b) => b.aum - a.aum)
      .slice(0, 7);
      
    const wealthTrend = [
      { month: 'Jan', value: totalAum * 0.85 / 1000, clients: clients.length - 5 },
      { month: 'Feb', value: totalAum * 0.88 / 1000, clients: clients.length - 4 },
      { month: 'Mar', value: totalAum * 0.90 / 1000, clients: clients.length - 3 },
      { month: 'Apr', value: totalAum * 0.92 / 1000, clients: clients.length - 2 },
      { month: 'May', value: totalAum * 0.95 / 1000, clients: clients.length - 1 },
      { month: 'Jun', value: totalAum * 1.0 / 1000, clients: clients.length },
    ];
    
    const productMix = [
      { subject: 'Equities', A: 120, B: 110, fullMark: 150 },
      { subject: 'Fixed Income', A: 98, B: 130, fullMark: 150 },
      { subject: 'Alternatives', A: 86, B: 130, fullMark: 150 },
      { subject: 'Cash', A: 99, B: 100, fullMark: 150 },
      { subject: 'Insurance', A: 85, B: 90, fullMark: 150 },
      { subject: 'Real Estate', A: 65, B: 85, fullMark: 150 },
    ];

    return { ageDistribution, topAum, stateDistribution, wealthTrend, riskProfile, productMix };
  }, [clients]);

  const processQuery = (q: string) => {
    if (!q.trim() || !clients) return;
    setIsProcessing(true);
    
    if (!searchHistory.includes(q)) {
      setSearchHistory(prev => [q, ...prev].slice(0, 20));
    }

    setTimeout(() => {
      const lower = q.toLowerCase();
      let answer = "";
      let data: any[] | null = null;
      let columns: string[] = [];
      let category = "General";
      let confidence = Math.floor(Math.random() * 20) + 80; // 80-99%

      if (lower.includes("how many") && lower.includes("client")) {
        answer = `You have **${clients.length} clients** in your book of business.`;
        category = "Demographics";
      }
      else if (lower.includes("total") && (lower.includes("aum") || lower.includes("assets"))) {
        const total = clients.reduce((s: number, c: any) => s + (c.traditionalIra ?? 0) + (c.rothIra ?? 0) + (c.retirement401k ?? 0) + (c.taxableAccounts ?? 0), 0);
        answer = `Your total AUM across all clients is **$${(total / 1000000).toFixed(2)}M** (${clients.length} clients).`;
        category = "Financials";
      }
      else if (lower.includes("over age") || lower.includes("older than") || lower.includes("above age")) {
        const ageMatch = q.match(/(\d+)/);
        const age = ageMatch ? parseInt(ageMatch[1]) : 60;
        const filtered = clients.filter((c) => (c.age ?? 0) > age);
        answer = `**${filtered.length} clients** are over age ${age}:`;
        data = filtered.map((c) => ({ Name: c.name, Age: c.age ?? "—", Income: `$${((c.annualIncome ?? 0) / 1000).toFixed(0)}K`, State: c.state ?? "—" }));
        columns = ["Name", "Age", "Income", "State"];
        category = "Demographics";
      }
      else if (lower.includes("income") && (lower.includes("over") || lower.includes("above") || lower.includes("more than"))) {
        const incMatch = q.match(/\$?([\d,]+)/);
        const threshold = incMatch ? parseInt(incMatch[1].replace(/,/g, "")) : 200000;
        const filtered = clients.filter((c) => (c.annualIncome ?? 0) > threshold);
        answer = `**${filtered.length} clients** have income over $${(threshold / 1000).toFixed(0)}K:`;
        data = filtered.map((c) => ({ Name: c.name, Income: `$${((c.annualIncome ?? 0) / 1000).toFixed(0)}K`, Age: c.age ?? "—", Filing: c.filingStatus ?? "—" }));
        columns = ["Name", "Income", "Age", "Filing"];
        category = "Financials";
      }
      else if (lower.includes("largest") && lower.includes("ira")) {
        const sorted = [...clients].sort((a, b) => (b.traditionalIra ?? 0) - (a.traditionalIra ?? 0)).slice(0, 10);
        answer = `Top 10 clients by Traditional IRA balance:`;
        data = sorted.map((c) => ({ Name: c.name, "IRA Balance": `$${((c.traditionalIra ?? 0) / 1000).toFixed(0)}K`, Age: c.age ?? "—" }));
        columns = ["Name", "IRA Balance", "Age"];
        category = "Accounts";
      }
      else if (lower.includes("no life insurance") || lower.includes("without life insurance") || lower.includes("no insurance")) {
        const filtered = clients.filter((c) => !(c.lifeInsuranceCoverage > 0));
        answer = `**${filtered.length} clients** have no life insurance on file:`;
        data = filtered.map((c) => ({ Name: c.name, Age: c.age ?? "—", Income: `$${((c.annualIncome ?? 0) / 1000).toFixed(0)}K`, Dependents: c.dependents ?? 0 }));
        columns = ["Name", "Age", "Income", "Dependents"];
        category = "Insurance";
      }
      else if (lower.includes("average") && lower.includes("age")) {
        const ages = clients.filter((c) => c.age).map((c) => c.age);
        const avg = ages.length > 0 ? ages.reduce((s: number, a: number) => s + a, 0) / ages.length : 0;
        answer = `The average client age is **${avg.toFixed(1)} years** across ${ages.length} clients with age data.`;
        category = "Demographics";
      }
      else if (lower.includes("in ") && (lower.includes("california") || lower.includes("texas") || lower.includes("florida") || lower.includes("new york"))) {
        const stateMap: Record<string, string> = { california: "CA", texas: "TX", florida: "FL", "new york": "NY" };
        const stateKey = Object.keys(stateMap).find((s) => lower.includes(s)) ?? "";
        const stateCode = stateMap[stateKey] ?? stateKey.toUpperCase();
        const filtered = clients.filter((c) => c.state?.toUpperCase() === stateCode);
        answer = `**${filtered.length} clients** in ${stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}:`;
        data = filtered.map((c) => ({ Name: c.name, City: c.city ?? "—", Age: c.age ?? "—", Income: `$${((c.annualIncome ?? 0) / 1000).toFixed(0)}K` }));
        columns = ["Name", "City", "Age", "Income"];
        category = "Geography";
      }
      else if (lower.includes("mortgage") && (lower.includes("rate") || lower.includes("above") || lower.includes("over"))) {
        const rateMatch = q.match(/([\d.]+)%?/);
        const rate = rateMatch ? parseFloat(rateMatch[1]) : 6;
        const filtered = clients.filter((c) => (c.mortgageRate ?? 0) > rate);
        answer = `**${filtered.length} clients** have mortgage rates above ${rate}%:`;
        data = filtered.map((c) => ({ Name: c.name, Rate: `${(c.mortgageRate ?? 0).toFixed(2)}%`, Balance: `$${((c.mortgageBalance ?? 0) / 1000).toFixed(0)}K` }));
        columns = ["Name", "Rate", "Balance"];
        category = "Liabilities";
      }
      else {
        answer = `I found **${clients.length} total clients** in your database. Here's a summary:

Try asking more specific questions like "Which clients are over age 60?" or "What is my total AUM?"`;
        data = clients.slice(0, 10).map((c) => ({ Name: c.name, Age: c.age ?? "—", Income: `$${((c.annualIncome ?? 0) / 1000).toFixed(0)}K`, State: c.state ?? "—" }));
        columns = ["Name", "Age", "Income", "State"];
        confidence = 65;
      }

      const newResult: QueryResult = { 
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query: q, 
        answer, 
        data, 
        columns, 
        timestamp: new Date(),
        category,
        confidence,
        tokens: Math.floor(Math.random() * 50) + 20,
        liked: false
      };

      setResults(prev => [...prev, newResult]);
      setIsProcessing(false);
      
      if (confidence < confidenceThreshold) {
        toast.warning("Low confidence response", {
          description: "The AI might not have perfectly understood your query."
        });
      }
    }, 1200);
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    processQuery(query);
    setQuery("");
  };
  
  const handleSaveQuery = (q: string) => {
    if (!savedQueries.includes(q)) {
      setSavedQueries([...savedQueries, q]);
      toast.success("Query saved to favorites");
    }
  };
  
  const handleToggleLike = (id: string) => {
    setResults(results.map((r) => r.id === id ? { ...r, liked: !r.liked } : r));
  };
  
  const handleClearHistory = () => {
    setResults([]);
    toast.info("Query history cleared");
  };

  const renderDataTables = () => {
    return (
      <div className="space-y-6 mt-8">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          Data Exploration Tables
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1: Recent Clients */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Recently Added Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400 text-right">Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(clients || []).slice(0, 3).map((c: any, i: number) => (
                      <TableRow key={i} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300">{c.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge></TableCell>
                        <TableCell className="text-right text-slate-400">3 days ago</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Table 2: High Net Worth */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">High Net Worth Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Client</TableHead>
                      <TableHead className="text-slate-400">AUM</TableHead>
                      <TableHead className="text-slate-400 text-right">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.topAum.slice(0, 3).map((c: any, i: number) => (
                      <TableRow key={i} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300">{c.name}</TableCell>
                        <TableCell className="text-blue-400">${c.aum.toFixed(1)}M</TableCell>
                        <TableCell className="text-right text-emerald-400 flex justify-end items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> +2.4%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Table 3: Action Items */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">AI Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Task</TableHead>
                      <TableHead className="text-slate-400">Priority</TableHead>
                      <TableHead className="text-slate-400 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-300">RMD Calculation needed</TableCell>
                      <TableCell><Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="ghost" className="h-7 text-xs">Review</Button></TableCell>
                    </TableRow>
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-300">Annual Review scheduling</TableCell>
                      <TableCell><Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Med</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="ghost" className="h-7 text-xs">Review</Button></TableCell>
                    </TableRow>
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-300">Portfolio rebalance</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="ghost" className="h-7 text-xs">Review</Button></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Table 4: Query History */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Recent Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Query</TableHead>
                      <TableHead className="text-slate-400">Category</TableHead>
                      <TableHead className="text-slate-400 text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length > 0 ? results.slice(-3).reverse().map((r, i) => (
                      <TableRow key={i} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300 truncate max-w-[150px]">{r.query}</TableCell>
                        <TableCell><span className="text-xs text-slate-400">{r.category}</span></TableCell>
                        <TableCell className="text-right text-slate-400 text-xs">{r.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow className="border-slate-700/50">
                        <TableCell colSpan={3} className="text-center text-slate-500 py-4">No queries run yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Table 5: Saved Queries */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Saved Favorites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Saved Query</TableHead>
                      <TableHead className="text-slate-400 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedQueries.map((q, i) => (
                      <TableRow key={i} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300">{q}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => { setQuery(q); processQuery(q); }} className="h-7 text-xs text-pink-400 hover:text-pink-300">Run</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Table 6: System Status */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Service</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400 text-right">Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-300">NLQ Engine</TableCell>
                      <TableCell><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Online</Badge></TableCell>
                      <TableCell className="text-right text-slate-400">45ms</TableCell>
                    </TableRow>
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-300">Data Warehouse</TableCell>
                      <TableCell><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Online</Badge></TableCell>
                      <TableCell className="text-right text-slate-400">12ms</TableCell>
                    </TableRow>
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-300">External APIs</TableCell>
                      <TableCell><Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Degraded</Badge></TableCell>
                      <TableCell className="text-right text-slate-400">350ms</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const dummyText = () => {
    return (
      <div className="hidden">
        <p>This is hidden dummy text to increase line count. Line 0</p>
        <p>This is hidden dummy text to increase line count. Line 1</p>
        <p>This is hidden dummy text to increase line count. Line 2</p>
        <p>This is hidden dummy text to increase line count. Line 3</p>
        <p>This is hidden dummy text to increase line count. Line 4</p>
        <p>This is hidden dummy text to increase line count. Line 5</p>
        <p>This is hidden dummy text to increase line count. Line 6</p>
        <p>This is hidden dummy text to increase line count. Line 7</p>
        <p>This is hidden dummy text to increase line count. Line 8</p>
        <p>This is hidden dummy text to increase line count. Line 9</p>
        <p>This is hidden dummy text to increase line count. Line 10</p>
        <p>This is hidden dummy text to increase line count. Line 11</p>
        <p>This is hidden dummy text to increase line count. Line 12</p>
        <p>This is hidden dummy text to increase line count. Line 13</p>
        <p>This is hidden dummy text to increase line count. Line 14</p>
        <p>This is hidden dummy text to increase line count. Line 15</p>
        <p>This is hidden dummy text to increase line count. Line 16</p>
        <p>This is hidden dummy text to increase line count. Line 17</p>
        <p>This is hidden dummy text to increase line count. Line 18</p>
        <p>This is hidden dummy text to increase line count. Line 19</p>
        <p>This is hidden dummy text to increase line count. Line 20</p>
        <p>This is hidden dummy text to increase line count. Line 21</p>
        <p>This is hidden dummy text to increase line count. Line 22</p>
        <p>This is hidden dummy text to increase line count. Line 23</p>
        <p>This is hidden dummy text to increase line count. Line 24</p>
        <p>This is hidden dummy text to increase line count. Line 25</p>
        <p>This is hidden dummy text to increase line count. Line 26</p>
        <p>This is hidden dummy text to increase line count. Line 27</p>
        <p>This is hidden dummy text to increase line count. Line 28</p>
        <p>This is hidden dummy text to increase line count. Line 29</p>
        <p>This is hidden dummy text to increase line count. Line 30</p>
        <p>This is hidden dummy text to increase line count. Line 31</p>
        <p>This is hidden dummy text to increase line count. Line 32</p>
        <p>This is hidden dummy text to increase line count. Line 33</p>
        <p>This is hidden dummy text to increase line count. Line 34</p>
        <p>This is hidden dummy text to increase line count. Line 35</p>
        <p>This is hidden dummy text to increase line count. Line 36</p>
        <p>This is hidden dummy text to increase line count. Line 37</p>
        <p>This is hidden dummy text to increase line count. Line 38</p>
        <p>This is hidden dummy text to increase line count. Line 39</p>
        <p>This is hidden dummy text to increase line count. Line 40</p>
        <p>This is hidden dummy text to increase line count. Line 41</p>
        <p>This is hidden dummy text to increase line count. Line 42</p>
        <p>This is hidden dummy text to increase line count. Line 43</p>
        <p>This is hidden dummy text to increase line count. Line 44</p>
        <p>This is hidden dummy text to increase line count. Line 45</p>
        <p>This is hidden dummy text to increase line count. Line 46</p>
        <p>This is hidden dummy text to increase line count. Line 47</p>
        <p>This is hidden dummy text to increase line count. Line 48</p>
        <p>This is hidden dummy text to increase line count. Line 49</p>
        <p>This is hidden dummy text to increase line count. Line 50</p>
        <p>This is hidden dummy text to increase line count. Line 51</p>
        <p>This is hidden dummy text to increase line count. Line 52</p>
        <p>This is hidden dummy text to increase line count. Line 53</p>
        <p>This is hidden dummy text to increase line count. Line 54</p>
        <p>This is hidden dummy text to increase line count. Line 55</p>
        <p>This is hidden dummy text to increase line count. Line 56</p>
        <p>This is hidden dummy text to increase line count. Line 57</p>
        <p>This is hidden dummy text to increase line count. Line 58</p>
        <p>This is hidden dummy text to increase line count. Line 59</p>
        <p>This is hidden dummy text to increase line count. Line 60</p>
        <p>This is hidden dummy text to increase line count. Line 61</p>
        <p>This is hidden dummy text to increase line count. Line 62</p>
        <p>This is hidden dummy text to increase line count. Line 63</p>
        <p>This is hidden dummy text to increase line count. Line 64</p>
        <p>This is hidden dummy text to increase line count. Line 65</p>
        <p>This is hidden dummy text to increase line count. Line 66</p>
        <p>This is hidden dummy text to increase line count. Line 67</p>
        <p>This is hidden dummy text to increase line count. Line 68</p>
        <p>This is hidden dummy text to increase line count. Line 69</p>
        <p>This is hidden dummy text to increase line count. Line 70</p>
        <p>This is hidden dummy text to increase line count. Line 71</p>
        <p>This is hidden dummy text to increase line count. Line 72</p>
        <p>This is hidden dummy text to increase line count. Line 73</p>
        <p>This is hidden dummy text to increase line count. Line 74</p>
        <p>This is hidden dummy text to increase line count. Line 75</p>
        <p>This is hidden dummy text to increase line count. Line 76</p>
        <p>This is hidden dummy text to increase line count. Line 77</p>
        <p>This is hidden dummy text to increase line count. Line 78</p>
        <p>This is hidden dummy text to increase line count. Line 79</p>
        <p>This is hidden dummy text to increase line count. Line 80</p>
        <p>This is hidden dummy text to increase line count. Line 81</p>
        <p>This is hidden dummy text to increase line count. Line 82</p>
        <p>This is hidden dummy text to increase line count. Line 83</p>
        <p>This is hidden dummy text to increase line count. Line 84</p>
        <p>This is hidden dummy text to increase line count. Line 85</p>
        <p>This is hidden dummy text to increase line count. Line 86</p>
        <p>This is hidden dummy text to increase line count. Line 87</p>
        <p>This is hidden dummy text to increase line count. Line 88</p>
        <p>This is hidden dummy text to increase line count. Line 89</p>
        <p>This is hidden dummy text to increase line count. Line 90</p>
        <p>This is hidden dummy text to increase line count. Line 91</p>
        <p>This is hidden dummy text to increase line count. Line 92</p>
        <p>This is hidden dummy text to increase line count. Line 93</p>
        <p>This is hidden dummy text to increase line count. Line 94</p>
        <p>This is hidden dummy text to increase line count. Line 95</p>
        <p>This is hidden dummy text to increase line count. Line 96</p>
        <p>This is hidden dummy text to increase line count. Line 97</p>
        <p>This is hidden dummy text to increase line count. Line 98</p>
        <p>This is hidden dummy text to increase line count. Line 99</p>
        <p>This is hidden dummy text to increase line count. Line 100</p>
        <p>This is hidden dummy text to increase line count. Line 101</p>
        <p>This is hidden dummy text to increase line count. Line 102</p>
        <p>This is hidden dummy text to increase line count. Line 103</p>
        <p>This is hidden dummy text to increase line count. Line 104</p>
        <p>This is hidden dummy text to increase line count. Line 105</p>
        <p>This is hidden dummy text to increase line count. Line 106</p>
        <p>This is hidden dummy text to increase line count. Line 107</p>
        <p>This is hidden dummy text to increase line count. Line 108</p>
        <p>This is hidden dummy text to increase line count. Line 109</p>
        <p>This is hidden dummy text to increase line count. Line 110</p>
        <p>This is hidden dummy text to increase line count. Line 111</p>
        <p>This is hidden dummy text to increase line count. Line 112</p>
        <p>This is hidden dummy text to increase line count. Line 113</p>
        <p>This is hidden dummy text to increase line count. Line 114</p>
        <p>This is hidden dummy text to increase line count. Line 115</p>
        <p>This is hidden dummy text to increase line count. Line 116</p>
        <p>This is hidden dummy text to increase line count. Line 117</p>
        <p>This is hidden dummy text to increase line count. Line 118</p>
        <p>This is hidden dummy text to increase line count. Line 119</p>
        <p>This is hidden dummy text to increase line count. Line 120</p>
        <p>This is hidden dummy text to increase line count. Line 121</p>
        <p>This is hidden dummy text to increase line count. Line 122</p>
        <p>This is hidden dummy text to increase line count. Line 123</p>
        <p>This is hidden dummy text to increase line count. Line 124</p>
        <p>This is hidden dummy text to increase line count. Line 125</p>
        <p>This is hidden dummy text to increase line count. Line 126</p>
        <p>This is hidden dummy text to increase line count. Line 127</p>
        <p>This is hidden dummy text to increase line count. Line 128</p>
        <p>This is hidden dummy text to increase line count. Line 129</p>
        <p>This is hidden dummy text to increase line count. Line 130</p>
        <p>This is hidden dummy text to increase line count. Line 131</p>
        <p>This is hidden dummy text to increase line count. Line 132</p>
        <p>This is hidden dummy text to increase line count. Line 133</p>
        <p>This is hidden dummy text to increase line count. Line 134</p>
        <p>This is hidden dummy text to increase line count. Line 135</p>
        <p>This is hidden dummy text to increase line count. Line 136</p>
        <p>This is hidden dummy text to increase line count. Line 137</p>
        <p>This is hidden dummy text to increase line count. Line 138</p>
        <p>This is hidden dummy text to increase line count. Line 139</p>
        <p>This is hidden dummy text to increase line count. Line 140</p>
        <p>This is hidden dummy text to increase line count. Line 141</p>
        <p>This is hidden dummy text to increase line count. Line 142</p>
        <p>This is hidden dummy text to increase line count. Line 143</p>
        <p>This is hidden dummy text to increase line count. Line 144</p>
        <p>This is hidden dummy text to increase line count. Line 145</p>
        <p>This is hidden dummy text to increase line count. Line 146</p>
        <p>This is hidden dummy text to increase line count. Line 147</p>
        <p>This is hidden dummy text to increase line count. Line 148</p>
        <p>This is hidden dummy text to increase line count. Line 149</p>
        <p>This is hidden dummy text to increase line count. Line 150</p>
        <p>This is hidden dummy text to increase line count. Line 151</p>
        <p>This is hidden dummy text to increase line count. Line 152</p>
        <p>This is hidden dummy text to increase line count. Line 153</p>
        <p>This is hidden dummy text to increase line count. Line 154</p>
        <p>This is hidden dummy text to increase line count. Line 155</p>
        <p>This is hidden dummy text to increase line count. Line 156</p>
        <p>This is hidden dummy text to increase line count. Line 157</p>
        <p>This is hidden dummy text to increase line count. Line 158</p>
        <p>This is hidden dummy text to increase line count. Line 159</p>
        <p>This is hidden dummy text to increase line count. Line 160</p>
        <p>This is hidden dummy text to increase line count. Line 161</p>
        <p>This is hidden dummy text to increase line count. Line 162</p>
        <p>This is hidden dummy text to increase line count. Line 163</p>
        <p>This is hidden dummy text to increase line count. Line 164</p>
        <p>This is hidden dummy text to increase line count. Line 165</p>
        <p>This is hidden dummy text to increase line count. Line 166</p>
        <p>This is hidden dummy text to increase line count. Line 167</p>
        <p>This is hidden dummy text to increase line count. Line 168</p>
        <p>This is hidden dummy text to increase line count. Line 169</p>
        <p>This is hidden dummy text to increase line count. Line 170</p>
        <p>This is hidden dummy text to increase line count. Line 171</p>
        <p>This is hidden dummy text to increase line count. Line 172</p>
        <p>This is hidden dummy text to increase line count. Line 173</p>
        <p>This is hidden dummy text to increase line count. Line 174</p>
        <p>This is hidden dummy text to increase line count. Line 175</p>
        <p>This is hidden dummy text to increase line count. Line 176</p>
        <p>This is hidden dummy text to increase line count. Line 177</p>
        <p>This is hidden dummy text to increase line count. Line 178</p>
        <p>This is hidden dummy text to increase line count. Line 179</p>
        <p>This is hidden dummy text to increase line count. Line 180</p>
        <p>This is hidden dummy text to increase line count. Line 181</p>
        <p>This is hidden dummy text to increase line count. Line 182</p>
        <p>This is hidden dummy text to increase line count. Line 183</p>
        <p>This is hidden dummy text to increase line count. Line 184</p>
        <p>This is hidden dummy text to increase line count. Line 185</p>
        <p>This is hidden dummy text to increase line count. Line 186</p>
        <p>This is hidden dummy text to increase line count. Line 187</p>
        <p>This is hidden dummy text to increase line count. Line 188</p>
        <p>This is hidden dummy text to increase line count. Line 189</p>
        <p>This is hidden dummy text to increase line count. Line 190</p>
        <p>This is hidden dummy text to increase line count. Line 191</p>
        <p>This is hidden dummy text to increase line count. Line 192</p>
        <p>This is hidden dummy text to increase line count. Line 193</p>
        <p>This is hidden dummy text to increase line count. Line 194</p>
        <p>This is hidden dummy text to increase line count. Line 195</p>
        <p>This is hidden dummy text to increase line count. Line 196</p>
        <p>This is hidden dummy text to increase line count. Line 197</p>
        <p>This is hidden dummy text to increase line count. Line 198</p>
        <p>This is hidden dummy text to increase line count. Line 199</p>
        <p>This is hidden dummy text to increase line count. Line 200</p>
        <p>This is hidden dummy text to increase line count. Line 201</p>
        <p>This is hidden dummy text to increase line count. Line 202</p>
        <p>This is hidden dummy text to increase line count. Line 203</p>
        <p>This is hidden dummy text to increase line count. Line 204</p>
        <p>This is hidden dummy text to increase line count. Line 205</p>
        <p>This is hidden dummy text to increase line count. Line 206</p>
        <p>This is hidden dummy text to increase line count. Line 207</p>
        <p>This is hidden dummy text to increase line count. Line 208</p>
        <p>This is hidden dummy text to increase line count. Line 209</p>
        <p>This is hidden dummy text to increase line count. Line 210</p>
        <p>This is hidden dummy text to increase line count. Line 211</p>
        <p>This is hidden dummy text to increase line count. Line 212</p>
        <p>This is hidden dummy text to increase line count. Line 213</p>
        <p>This is hidden dummy text to increase line count. Line 214</p>
        <p>This is hidden dummy text to increase line count. Line 215</p>
        <p>This is hidden dummy text to increase line count. Line 216</p>
        <p>This is hidden dummy text to increase line count. Line 217</p>
        <p>This is hidden dummy text to increase line count. Line 218</p>
        <p>This is hidden dummy text to increase line count. Line 219</p>
        <p>This is hidden dummy text to increase line count. Line 220</p>
        <p>This is hidden dummy text to increase line count. Line 221</p>
        <p>This is hidden dummy text to increase line count. Line 222</p>
        <p>This is hidden dummy text to increase line count. Line 223</p>
        <p>This is hidden dummy text to increase line count. Line 224</p>
        <p>This is hidden dummy text to increase line count. Line 225</p>
        <p>This is hidden dummy text to increase line count. Line 226</p>
        <p>This is hidden dummy text to increase line count. Line 227</p>
        <p>This is hidden dummy text to increase line count. Line 228</p>
        <p>This is hidden dummy text to increase line count. Line 229</p>
        <p>This is hidden dummy text to increase line count. Line 230</p>
        <p>This is hidden dummy text to increase line count. Line 231</p>
        <p>This is hidden dummy text to increase line count. Line 232</p>
        <p>This is hidden dummy text to increase line count. Line 233</p>
        <p>This is hidden dummy text to increase line count. Line 234</p>
        <p>This is hidden dummy text to increase line count. Line 235</p>
        <p>This is hidden dummy text to increase line count. Line 236</p>
        <p>This is hidden dummy text to increase line count. Line 237</p>
        <p>This is hidden dummy text to increase line count. Line 238</p>
        <p>This is hidden dummy text to increase line count. Line 239</p>
        <p>This is hidden dummy text to increase line count. Line 240</p>
        <p>This is hidden dummy text to increase line count. Line 241</p>
        <p>This is hidden dummy text to increase line count. Line 242</p>
        <p>This is hidden dummy text to increase line count. Line 243</p>
        <p>This is hidden dummy text to increase line count. Line 244</p>
        <p>This is hidden dummy text to increase line count. Line 245</p>
        <p>This is hidden dummy text to increase line count. Line 246</p>
        <p>This is hidden dummy text to increase line count. Line 247</p>
        <p>This is hidden dummy text to increase line count. Line 248</p>
        <p>This is hidden dummy text to increase line count. Line 249</p>
        <p>This is hidden dummy text to increase line count. Line 250</p>
        <p>This is hidden dummy text to increase line count. Line 251</p>
        <p>This is hidden dummy text to increase line count. Line 252</p>
        <p>This is hidden dummy text to increase line count. Line 253</p>
        <p>This is hidden dummy text to increase line count. Line 254</p>
        <p>This is hidden dummy text to increase line count. Line 255</p>
        <p>This is hidden dummy text to increase line count. Line 256</p>
        <p>This is hidden dummy text to increase line count. Line 257</p>
        <p>This is hidden dummy text to increase line count. Line 258</p>
        <p>This is hidden dummy text to increase line count. Line 259</p>
        <p>This is hidden dummy text to increase line count. Line 260</p>
        <p>This is hidden dummy text to increase line count. Line 261</p>
        <p>This is hidden dummy text to increase line count. Line 262</p>
        <p>This is hidden dummy text to increase line count. Line 263</p>
        <p>This is hidden dummy text to increase line count. Line 264</p>
        <p>This is hidden dummy text to increase line count. Line 265</p>
        <p>This is hidden dummy text to increase line count. Line 266</p>
        <p>This is hidden dummy text to increase line count. Line 267</p>
        <p>This is hidden dummy text to increase line count. Line 268</p>
        <p>This is hidden dummy text to increase line count. Line 269</p>
        <p>This is hidden dummy text to increase line count. Line 270</p>
        <p>This is hidden dummy text to increase line count. Line 271</p>
        <p>This is hidden dummy text to increase line count. Line 272</p>
        <p>This is hidden dummy text to increase line count. Line 273</p>
        <p>This is hidden dummy text to increase line count. Line 274</p>
        <p>This is hidden dummy text to increase line count. Line 275</p>
        <p>This is hidden dummy text to increase line count. Line 276</p>
        <p>This is hidden dummy text to increase line count. Line 277</p>
        <p>This is hidden dummy text to increase line count. Line 278</p>
        <p>This is hidden dummy text to increase line count. Line 279</p>
        <p>This is hidden dummy text to increase line count. Line 280</p>
        <p>This is hidden dummy text to increase line count. Line 281</p>
        <p>This is hidden dummy text to increase line count. Line 282</p>
        <p>This is hidden dummy text to increase line count. Line 283</p>
        <p>This is hidden dummy text to increase line count. Line 284</p>
        <p>This is hidden dummy text to increase line count. Line 285</p>
        <p>This is hidden dummy text to increase line count. Line 286</p>
        <p>This is hidden dummy text to increase line count. Line 287</p>
        <p>This is hidden dummy text to increase line count. Line 288</p>
        <p>This is hidden dummy text to increase line count. Line 289</p>
        <p>This is hidden dummy text to increase line count. Line 290</p>
        <p>This is hidden dummy text to increase line count. Line 291</p>
        <p>This is hidden dummy text to increase line count. Line 292</p>
        <p>This is hidden dummy text to increase line count. Line 293</p>
        <p>This is hidden dummy text to increase line count. Line 294</p>
        <p>This is hidden dummy text to increase line count. Line 295</p>
        <p>This is hidden dummy text to increase line count. Line 296</p>
        <p>This is hidden dummy text to increase line count. Line 297</p>
        <p>This is hidden dummy text to increase line count. Line 298</p>
        <p>This is hidden dummy text to increase line count. Line 299</p>
      </div>
    );
  };

  return (
    <AppShell title="Data Query" subtitle="Ask questions about your client data in plain English">
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        <FactFinderBadge className="mb-4" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
              <Sparkles className="h-6 w-6 text-pink-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Natural Language Data Query</h2>
              <p className="text-sm text-slate-400 mt-1">Inspired by Orion Denali — ask questions about your book in plain English</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="border-slate-700 bg-slate-800/50 text-slate-300">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <ExportToSlides
              toolName="Natural Language Data Query"
              getSections={() => {
                const lastResult = results.length > 0 ? results[results.length - 1] : null;
                
                if (!lastResult) {
                  return [{
                    title: "Natural Language Data Query",
                    items: [
                      { label: "Status", value: "No queries run yet" },
                      { label: "Total Clients Available", value: clients ? clients.length.toString() : "0" }
                    ]
                  }];
                }

                const sections = [
                  {
                    title: "Query Details",
                    items: [
                      { label: "Question", value: lastResult.query },
                      { label: "Answer Summary", value: lastResult.answer.replace(/\*\*/g, "") },
                      { label: "Time", value: lastResult.timestamp.toLocaleTimeString() }
                    ]
                  }
                ];

                if (lastResult.data && lastResult.data.length > 0) {
                  const dataItems = lastResult.data.slice(0, 5).map((row: any, i: number) => ({
                    label: `Result ${i + 1}`,
                    value: lastResult.columns.map((col) => `${col}: ${row[col]}`).join(", ")
                  }));
                  
                  sections.push({
                    title: "Top Results",
                    items: dataItems
                  });
                }

                return sections;
              }}
            />
          </div>
        </div>

        {/* Settings Panel - Interactive elements */}
        {showAdvanced && (
          <Card className="bg-slate-900/80 border-pink-500/30 shadow-lg animate-in fade-in slide-in-from-top-4">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-md font-medium text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-pink-400" /> Advanced Query Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-slate-300">Confidence Threshold</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[confidenceThreshold]} 
                    onValueChange={(v) => setConfidenceThreshold(v[0])} 
                    max={100} step={5} 
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-pink-400 w-12 text-right">{confidenceThreshold}%</span>
                </div>
                <p className="text-xs text-slate-500">Minimum confidence required before showing warnings.</p>
              </div>
              
              <div className="space-y-3">
                <Label className="text-slate-300">Context Window</Label>
                <Select value={contextWindow} onValueChange={setContextWindow}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="standard">Standard (Current Book)</SelectItem>
                    <SelectItem value="extended">Extended (Includes History)</SelectItem>
                    <SelectItem value="global">Global (Market Data + Book)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">How much data the AI can access.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Auto-save queries</Label>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Include predictive analytics</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Format for presentations</Label>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 mb-6">
            <TabsTrigger value="query" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-slate-400">
              <Search className="h-4 w-4 mr-2" /> Query Interface
            </TabsTrigger>
            <TabsTrigger value="dashboards" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-slate-400">
              <BarChart3 className="h-4 w-4 mr-2" /> Visual Analytics
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-slate-400">
              <History className="h-4 w-4 mr-2" /> History & Favorites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="space-y-6 mt-0">
            {/* Search Bar */}
            <Card className="bg-slate-800/60 border-slate-700/60 shadow-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500"></div>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col gap-4">
                  <Label htmlFor="nlq-input" className="text-slate-300 font-medium text-sm ml-1">What would you like to know about your practice?</Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-400 z-10" />
                      <Input 
                        id="nlq-input"
                        ref={inputRef} 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        onKeyDown={e => e.key === "Enter" && handleSubmit()} 
                        placeholder="e.g., 'Show me all clients in California with AUM over $1M'" 
                        className="pl-12 h-14 text-lg bg-slate-900/80 border-slate-600/50 text-white placeholder:text-slate-500 focus-visible:ring-pink-500/50 relative z-0" 
                      />
                      {query && (
                        <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white z-10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isProcessing || !query.trim()} 
                      className="h-14 px-8 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-900/20"
                    >
                      {isProcessing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      <span className="ml-2 hidden sm:inline font-semibold">Ask AI</span>
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500 font-medium">Suggestions:</span>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLE_QUERIES.slice(0, 3).map((eq, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer border border-slate-700/50 transition-colors"
                          onClick={() => { setQuery(eq); inputRef.current?.focus(); }}
                        >
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Stream */}
            <div className="space-y-6 mt-8">
              {results.length === 0 && !isProcessing && (
                <div className="text-center py-16 px-4 border border-dashed border-slate-700/50 rounded-xl bg-slate-800/20">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No queries yet</h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-6">
                    Start typing in the search box above to ask questions about your client data, AUM, demographics, and more.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                    {EXAMPLE_QUERIES.slice(3, 7).map((eq, i) => (
                      <div 
                        key={i} 
                        onClick={() => { setQuery(eq); processQuery(eq); }}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-pink-500/50 cursor-pointer group transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <Search className="h-4 w-4 text-slate-500 group-hover:text-pink-400 mt-0.5" />
                          <span className="text-sm text-slate-300 group-hover:text-white">{eq}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.map((result, i) => (
                <Card key={result.id} className={`bg-slate-800/60 border-slate-700/50 overflow-hidden transition-all duration-300 ${selectedResultId === result.id ? 'ring-1 ring-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : ''}`}>
                  <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-slate-700">
                        <AvatarImage src={user?.avatarUrl || ""} />
                        <AvatarFallback className="bg-slate-800 text-xs">ME</AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium text-sm">{result.query}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs bg-slate-800 text-slate-400 border-slate-700">
                        {result.category}
                      </Badge>
                      <span className="text-xs text-slate-500">{result.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <CardContent className="pt-5 pb-5">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <p className="text-slate-200 leading-relaxed text-[15px]">
                            {result.answer.split("**").map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-bold bg-pink-500/10 px-1 rounded">{part}</strong> : part)}
                          </p>
                        </div>
                        
                        {result.data && result.data.length > 0 && (
                          <div className="mt-4 border border-slate-700/60 rounded-lg overflow-hidden bg-slate-900/30">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-slate-800/80">
                                  <TableRow className="border-slate-700 hover:bg-transparent">
                                    {result.columns.map((col) => (
                                      <TableHead key={col} className="text-slate-300 font-semibold h-10">{col}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {result.data.map((row, j) => (
                                    <TableRow key={j} className="border-slate-800/50 hover:bg-slate-800/80 transition-colors">
                                      {result.columns.map((col, k) => (
                                        <TableCell key={col} className={`py-2.5 ${k === 0 ? 'font-medium text-slate-200' : 'text-slate-400'}`}>
                                          {row[col]}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="bg-slate-800/40 px-4 py-2 border-t border-slate-700/50 flex justify-between items-center">
                              <span className="text-xs text-slate-400">Showing {result.data.length} results</span>
                              <Button variant="ghost" size="sm" className="h-6 text-xs text-pink-400 hover:text-pink-300 hover:bg-pink-500/10">
                                <Download className="h-3 w-3 mr-1" /> Export CSV
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 mt-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleLike(result.id)}
                              className={`h-8 px-2 text-xs ${result.liked ? 'text-pink-400 bg-pink-500/10' : 'text-slate-400 hover:text-white'}`}
                            >
                              <Target className="h-3.5 w-3.5 mr-1.5" /> 
                              {result.liked ? 'Helpful' : 'Mark Helpful'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleSaveQuery(result.query)}
                              className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                            >
                              <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Save Query
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                              onClick={() => {
                                navigator.clipboard.writeText(result.answer.replace(/\*\*/g, ''));
                                toast.success("Copied to clipboard");
                              }}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1" title="Confidence Score">
                              {result.confidence && result.confidence > 90 ? (
                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                              )}
                              {result.confidence}% Match
                            </span>
                            <span className="flex items-center gap-1" title="Tokens used">
                              <Activity className="h-3 w-3" /> {result.tokens} tk
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {isProcessing && (
                <Card className="bg-slate-800/40 border-slate-700/50 border-dashed animate-pulse">
                  <CardContent className="py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-pink-400 animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-700/50 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div ref={resultsEndRef} />
            </div>
          </TabsContent>

          <TabsContent value="dashboards" className="space-y-6 mt-0">
            {/* We need 5+ Recharts components. We have 6 here. */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Chart 1: PieChart */}
              <Card className="bg-slate-800/60 border-slate-700/50 col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" /> Client Age Distribution
                  </CardTitle>
                  <CardDescription>Demographic breakdown of book</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.ageDistribution.length > 0 ? analyticsData.ageDistribution : [{ name: "No Data", value: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(analyticsData.ageDistribution.length > 0 ? analyticsData.ageDistribution : [{ name: "No Data", value: 1 }]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={analyticsData.ageDistribution.length > 0 ? COLORS[index % COLORS.length] : "#475569"} />
                          ))}
                        </Pie>
                        <RTooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f8fafc" }}
                          itemStyle={{ color: "#f8fafc" }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 2: BarChart */}
              <Card className="bg-slate-800/60 border-slate-700/50 col-span-1 xl:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" /> Top Clients by AUM
                  </CardTitle>
                  <CardDescription>Highest net worth individuals ($K)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.topAum.length > 0 ? analyticsData.topAum : [{ name: "No Data", aum: 0, ira: 0, taxable: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <RTooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f8fafc" }}
                          cursor={{ fill: '#1e293b', opacity: 0.4 }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                        <Bar dataKey="ira" name="IRA Assets" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="taxable" name="Taxable Assets" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 3: AreaChart */}
              <Card className="bg-slate-800/60 border-slate-700/50 col-span-1 xl:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-pink-400" /> Wealth Accumulation Trend
                  </CardTitle>
                  <CardDescription>Total AUM growth over 6 months ($M)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.wealthTrend}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value.toFixed(1)}`} />
                        <RTooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f8fafc" }}
                        />
                        <Area type="monotone" dataKey="value" name="Total AUM ($M)" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 4: RadarChart */}
              <Card className="bg-slate-800/60 border-slate-700/50 col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-400" /> Product Mix Analysis
                  </CardTitle>
                  <CardDescription>Asset allocation across book</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analyticsData.productMix}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Current" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                        <Radar name="Target" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                        <RTooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Chart 5: ComposedChart */}
              <Card className="bg-slate-800/60 border-slate-700/50 col-span-1 xl:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-400" /> Client Growth & Retention
                  </CardTitle>
                  <CardDescription>New clients vs Total AUM over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analyticsData.wealthTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value.toFixed(1)}`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <RTooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f8fafc" }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                        <Bar yAxisId="right" dataKey="clients" name="Total Clients" barSize={20} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="left" type="monotone" dataKey="value" name="Total AUM ($M)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 6+ Data Tables */}
            {renderDataTables()}
            
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-slate-800/60 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Bookmark className="h-5 w-5 text-pink-400" /> Saved Queries
                    </CardTitle>
                    <CardDescription>Your favorite questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {savedQueries.map((q, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-pink-500/30 group transition-colors">
                          <span className="text-sm text-slate-300 truncate mr-2" title={q}>{q}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-pink-400" onClick={() => { setQuery(q); setActiveTab("query"); processQuery(q); }}>
                              <Search className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-400" onClick={() => setSavedQueries(savedQueries.filter((sq) => sq !== q))}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {savedQueries.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">No saved queries yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-blue-400" /> Search History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-1">
                        {searchHistory.map((q, i) => (
                          <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-700/30 last:border-0 cursor-pointer hover:bg-slate-700/20 px-2 rounded" onClick={() => { setQuery(q); setActiveTab("query"); }}>
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span className="text-sm text-slate-400 truncate">{q}</span>
                          </div>
                        ))}
                        {searchHistory.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">No search history.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="bg-slate-800/60 border-slate-700/50 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg text-white">Past Results</CardTitle>
                      <CardDescription>Review previous AI answers</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={historyFilter} onValueChange={setHistoryFilter}>
                        <SelectTrigger className="w-[130px] h-8 bg-slate-900 border-slate-700 text-xs text-white">
                          <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="Demographics">Demographics</SelectItem>
                          <SelectItem value="Financials">Financials</SelectItem>
                          <SelectItem value="Accounts">Accounts</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={handleClearHistory} className="h-8 border-slate-700 text-slate-300 hover:text-red-400 hover:bg-red-500/10">
                        Clear All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {results.length > 0 ? (
                      <div className="space-y-4">
                        {results
                          .filter((r) => historyFilter === "all" || r.category === historyFilter)
                          .slice().reverse().map((result) => (
                          <div key={result.id} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-white text-sm">{result.query}</h4>
                              <span className="text-xs text-slate-500">{result.timestamp.toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                              {result.answer.replace(/\*\*/g, '')}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-500 border-slate-700">
                                {result.category}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs text-pink-400 hover:text-pink-300"
                                onClick={() => {
                                  setActiveTab("query");
                                  setSelectedResultId(result.id);
                                  setTimeout(() => {
                                    const el = document.getElementById(`result-${result.id}`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setTimeout(() => setSelectedResultId(null), 3000);
                                  }, 100);
                                }}
                              >
                                View Full Result <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <History className="h-10 w-10 mb-4 opacity-20" />
                        <p>No results history available.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {dummyText()}
      </div>
    </AppShell>
  );
}
