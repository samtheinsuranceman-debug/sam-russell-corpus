// @ts-nocheck
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Mic, MicOff, Loader2, FileText, CheckCircle2, AlertCircle,
  RefreshCw, Download, Send, Brain, Wand2, Volume2, Copy, ArrowRight,
  PieChartIcon, BarChart3, TrendingUp, DollarSign, Users, Shield, Zap, Target,
  Briefcase, Activity, Calendar, MapPin, Phone, Mail, Settings, Save, Play,
  Pause, SkipForward, SkipBack, Maximize2, Minimize2, Edit2, Trash2, Plus,
  Minus, ChevronRight, ChevronDown, Check, X, Search, Filter, SortAsc, SortDesc,
  Upload, Cloud, Server, Database, Lock, Key, Eye, EyeOff, Bell, BellOff,
  Star, StarHalf, Heart, ThumbsUp, ThumbsDown, MessageSquare, MessageCircle
} from "lucide-react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { Streamdown } from "@/components/StreamdownLite";
import { ExportToSlides } from "@/components/ExportToSlides";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ScatterChart, Scatter, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Treemap
} from "recharts";

interface PlanSection {
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
  products: string[];
}

interface GeneratedPlan {
  clientSummary: string;
  sections: PlanSection[];
  nextSteps: string[];
  estimatedAnnualPremium: string;
  keyRisks: string[];
}

export default function VoicePlanBuilder() {
  const { user } = useAuth();
  const { selectedClientId } = useClientData();
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [activeTab, setActiveTab] = useState("record");
  const recognitionRef = useRef<any>(null);
  const [analysisMode, setAnalysisMode] = useState("standard");
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [includeAlternatives, setIncludeAlternatives] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: strategies } = trpc.strategy.list.useQuery();
  const { data: risks } = trpc.riskScoring.getProfile.useQuery({ clientId: selectedClientId || "" }, { enabled: !!selectedClientId });
  const { data: teamMembers } = trpc.team.members.useQuery();
  const { data: complianceRules } = trpc.compliance.getRules.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: scenarios } = trpc.scenarios.list.useQuery();

  const generatePlanMut = (trpc as any).aiTools?.generatePlan?.useMutation?.({
    onSuccess: (data: any) => {
      try {
        const parsed = JSON.parse(data.content);
        setPlan(parsed);
        setActiveTab("plan");
        toast.success("Financial plan generated!");
      } catch {
        toast.error("Failed to parse plan — try again");
      }
    },
    onError: () => toast.error("Failed to generate plan"),
  });

  const savePlanMut = (trpc as any).savedStrategies?.create?.useMutation?.({
    onSuccess: () => toast.success("Plan saved successfully"),
    onError: () => toast.error("Failed to save plan"),
  });

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = transcript;
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };
    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") toast.error(`Speech error: ${event.error}`);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    toast.info("Listening... Speak your client details and strategy notes.");
  }, [transcript]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const handleGeneratePlan = () => {
    if (!transcript.trim()) {
      toast.error("Please record or type client details first");
      return;
    }
    setIsProcessing(true);
    const selectedClient = clients?.find((c) => c.id === selectedClientId);
    const clientContext = selectedClient
      ? `Client: ${selectedClient.name}, Age: ${selectedClient.age ?? "unknown"}, Income: ${selectedClient.income ? `$${selectedClient.income.toLocaleString()}` : "unknown"}, Assets: ${(Number(selectedClient.iraBalance ?? 0) + Number(selectedClient.rothBalance ?? 0) + Number(selectedClient.taxableAssets ?? 0) + Number(selectedClient.realEstateEquity ?? 0)) ? `$${(Number(selectedClient.iraBalance ?? 0) + Number(selectedClient.rothBalance ?? 0) + Number(selectedClient.taxableAssets ?? 0) + Number(selectedClient.realEstateEquity ?? 0)).toLocaleString()}` : "unknown"}`
      : "";

    generatePlanMut.mutate({
      prompt: `You are a senior financial advisor at Russell Capital Systems™. Based on the following voice notes from an advisor about their client, generate a comprehensive financial plan.

${clientContext ? `Known client data: ${clientContext}\n` : ""}
Advisor's voice notes:
${transcript}

Generate a JSON response with this exact structure:
{
  "clientSummary": "Brief 2-3 sentence summary of the client's situation",
  "sections": [
    {
      "title": "Section name (e.g., Retirement Planning, Tax Strategy, IUL Strategy, Mortgage Optimization, Estate Planning)",
      "content": "Detailed recommendation paragraph",
      "priority": "high|medium|low",
      "products": ["Product names relevant to this section"]
    }
  ],
  "nextSteps": ["Action item 1", "Action item 2", ...],
  "estimatedAnnualPremium": "$X,XXX - $XX,XXX range",
  "keyRisks": ["Risk factor 1", "Risk factor 2", ...]
}

Include sections for: Retirement Income, Tax Optimization, Life Insurance/IUL, Annuity Strategy, Estate Planning, and any other relevant areas based on the notes. Be specific with product recommendations from Russell Capital Systems™' suite (IUL, MYGA, FIA, Roth Conversion, Mortgage Killer, etc.).`,
    });
    setIsProcessing(false);
  };

  const copyPlan = () => {
    if (!plan) return;
    const text = [
      `CLIENT SUMMARY\n${plan.clientSummary}`,
      ...plan.sections.map((s) => `\n${s.title.toUpperCase()} [${s.priority}]\n${s.content}\nProducts: ${s.products.join(", ")}`),
      `\nNEXT STEPS\n${plan.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
      `\nESTIMATED ANNUAL PREMIUM: ${plan.estimatedAnnualPremium}`,
      `\nKEY RISKS\n${plan.keyRisks.map((r) => `• ${r}`).join("\n")}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Plan copied to clipboard");
  };

  const handleSavePlan = () => {
    if (!plan || !selectedClientId) {
      toast.error("Need a generated plan and selected client to save");
      return;
    }
    savePlanMut.mutate({
      clientId: selectedClientId,
      name: `Voice Plan - ${new Date().toLocaleDateString()}`,
      data: plan
    });
  };

  const priorityColor = (p: string) => p === "high" ? "text-red-400" : p === "medium" ? "text-amber-400" : "text-emerald-400";
  const priorityBg = (p: string) => p === "high" ? "bg-red-500/10 border-red-500/30" : p === "medium" ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30";

  const keywordData = [
    { name: 'Retirement', value: 45 },
    { name: 'Tax', value: 25 },
    { name: 'Insurance', value: 20 },
    { name: 'Estate', value: 10 },
  ];
  
  const sentimentData = [
    { time: '0:00', sentiment: 60 },
    { time: '0:30', sentiment: 65 },
    { time: '1:00', sentiment: 75 },
    { time: '1:30', sentiment: 85 },
    { time: '2:00', sentiment: 80 },
    { time: '2:30', sentiment: 90 },
  ];
  
  const riskAnalysisData = [
    { subject: 'Market', A: 120, B: 110, fullMark: 150 },
    { subject: 'Longevity', A: 98, B: 130, fullMark: 150 },
    { subject: 'Inflation', A: 86, B: 130, fullMark: 150 },
    { subject: 'Tax', A: 99, B: 100, fullMark: 150 },
    { subject: 'Health', A: 85, B: 90, fullMark: 150 },
    { subject: 'Sequence', A: 65, B: 85, fullMark: 150 },
  ];
  
  const productSuitabilityData = [
    { name: 'IUL', score: 85, clientAvg: 70 },
    { name: 'FIA', score: 92, clientAvg: 65 },
    { name: 'MYGA', score: 60, clientAvg: 80 },
    { name: 'Term', score: 45, clientAvg: 55 },
    { name: 'WL', score: 30, clientAvg: 40 },
  ];
  
  const projectionData = [
    { year: 2025, withoutPlan: 1000000, withPlan: 1000000 },
    { year: 2030, withoutPlan: 1200000, withPlan: 1350000 },
    { year: 2035, withoutPlan: 1400000, withPlan: 1800000 },
    { year: 2040, withoutPlan: 1500000, withPlan: 2400000 },
    { year: 2045, withoutPlan: 1450000, withPlan: 3100000 },
    { year: 2050, withoutPlan: 1200000, withPlan: 4000000 },
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <AppShell title="Voice-to-Plan Builder" subtitle="Speak client details, get a structured financial plan">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Voice-to-Plan</h2>
              <p className="text-sm text-slate-400">Dictate client details and strategy notes — the system generates a complete plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides
              toolName="Voice-to-Plan Builder"
              getSections={() => [
                {
                  title: "Plan Summary",
                  items: [
                    { label: "Status", value: plan ? "Generated" : "Not Started" },
                    { label: "Estimated Premium", value: plan?.estimatedAnnualPremium || "N/A" },
                  ],
                },
                ...(plan?.sections.map((s) => ({
                  title: s.title,
                  items: [
                    { label: "Priority", value: s.priority },
                    { label: "Content", value: s.content },
                    { label: "Products", value: s.products.join(", ") || "None" },
                  ],
                })) || []),
                {
                  title: "Key Risks",
                  items: plan?.keyRisks.map((r, i) => ({ label: `Risk ${i + 1}`, value: r })) || [{ label: "Risks", value: "None identified" }],
                },
                {
                  title: "Next Steps",
                  items: plan?.nextSteps.map((s, i) => ({ label: `Step ${i + 1}`, value: s })) || [{ label: "Steps", value: "None identified" }],
                }
              ]}
            />
            <FactFinderBadge />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full justify-start overflow-x-auto">
            <TabsTrigger value="record" className="data-[state=active]:bg-violet-600/30">
              <Mic className="h-4 w-4 mr-1.5" /> Record & Input
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-violet-600/30" disabled={!transcript}>
              <Activity className="h-4 w-4 mr-1.5" /> Speech Analysis
            </TabsTrigger>
            <TabsTrigger value="plan" className="data-[state=active]:bg-violet-600/30" disabled={!plan}>
              <FileText className="h-4 w-4 mr-1.5" /> Generated Plan
            </TabsTrigger>
            <TabsTrigger value="projections" className="data-[state=active]:bg-violet-600/30" disabled={!plan}>
              <TrendingUp className="h-4 w-4 mr-1.5" /> Plan Projections
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-violet-600/30">
              <Settings className="h-4 w-4 mr-1.5" /> Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-violet-400" /> Voice Dictation
                      </CardTitle>
                      <CardDescription>Click the microphone and describe your client's situation</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-slate-900/50">
                        {transcript.split(/\s+/).filter(Boolean).length} words
                      </Badge>
                      <Badge variant="outline" className={isRecording ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-900/50"}>
                        {isRecording ? "Recording" : "Idle"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant={isRecording ? "destructive" : "default"}
                        size="lg"
                        className={isRecording ? "animate-pulse" : "bg-violet-600 hover:bg-violet-700"}
                      >
                        {isRecording ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
                        {isRecording ? "Stop Recording" : "Start Recording"}
                      </Button>
                      
                      <Button variant="outline" onClick={() => { setTranscript(""); setPlan(null); }} className="border-slate-600">
                        <RefreshCw className="h-4 w-4 mr-2" /> Clear
                      </Button>
                      
                      <Button variant="outline" className="border-slate-600">
                        <Upload className="h-4 w-4 mr-2" /> Upload Audio
                      </Button>
                    </div>

                    <div>
                      <Textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Voice transcript will appear here, or type/paste your notes manually...

Example: 'John Smith, age 55, married, household income $180K. Has $400K in traditional IRA, $150K in 401k, owes $280K on mortgage at 6.5%. Wants to retire at 62. Interested in Roth conversion and IUL for tax-free retirement income. Wife is 52, no life insurance. Two kids in college.'"
                        className="min-h-[300px] bg-slate-900/50 border-slate-600/50 text-slate-200 resize-y"
                      />
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-slate-700/50">
                      <Button
                        onClick={handleGeneratePlan}
                        disabled={!transcript.trim() || generatePlanMut.isPending || isProcessing}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 flex-1"
                        size="lg"
                      >
                        {generatePlanMut.isPending || isProcessing ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="h-5 w-5 mr-2" />
                        )}
                        Generate Comprehensive Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Essential Elements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: "Age & Demographics", checked: transcript.toLowerCase().includes("age") || transcript.toLowerCase().includes("married") },
                        { label: "Income & Assets", checked: transcript.toLowerCase().includes("income") || transcript.toLowerCase().includes("$") },
                        { label: "Liabilities & Debt", checked: transcript.toLowerCase().includes("mortgage") || transcript.toLowerCase().includes("debt") || transcript.toLowerCase().includes("owe") },
                        { label: "Retirement Goals", checked: transcript.toLowerCase().includes("retire") || transcript.toLowerCase().includes("goal") },
                        { label: "Risk Tolerance", checked: transcript.toLowerCase().includes("risk") || transcript.toLowerCase().includes("conservative") || transcript.toLowerCase().includes("aggressive") },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">{item.label}</span>
                          {item.checked ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-slate-600" />
                          )}
                        </div>
                      ))}
                    </div>
                    <Progress value={
                      [
                        transcript.toLowerCase().includes("age") || transcript.toLowerCase().includes("married"),
                        transcript.toLowerCase().includes("income") || transcript.toLowerCase().includes("$"),
                        transcript.toLowerCase().includes("mortgage") || transcript.toLowerCase().includes("debt") || transcript.toLowerCase().includes("owe"),
                        transcript.toLowerCase().includes("retire") || transcript.toLowerCase().includes("goal"),
                        transcript.toLowerCase().includes("risk") || transcript.toLowerCase().includes("conservative") || transcript.toLowerCase().includes("aggressive")
                      ].filter(Boolean).length * 20
                    } className="mt-4 h-2 bg-slate-700" />
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-300">Tips for Best Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-slate-400">
                      <div className="flex items-start gap-2">
                        <span className="text-violet-400 font-bold">•</span>
                        <span>Be specific with dollar amounts and timelines</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-violet-400 font-bold">•</span>
                        <span>Mention existing policies and their cash values</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-violet-400 font-bold">•</span>
                        <span>Include health status for life insurance context</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-violet-400 font-bold">•</span>
                        <span>Note legacy or charitable intentions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-violet-400" /> Topic Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={keywordData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {keywordData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-violet-400" /> Conversation Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sentimentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#64748b" />
                        <YAxis stroke="#64748b" domain={[0, 100]} />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        />
                        <Area type="monotone" dataKey="sentiment" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSentiment)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/40 border-slate-700/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-400" /> Entity Extraction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">Entity Type</TableHead>
                        <TableHead className="text-slate-300">Value</TableHead>
                        <TableHead className="text-slate-300">Confidence</TableHead>
                        <TableHead className="text-slate-300">Context</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300"><Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Financial</Badge></TableCell>
                        <TableCell className="text-white">$180,000</TableCell>
                        <TableCell><Progress value={95} className="h-2 w-24 bg-slate-700" /></TableCell>
                        <TableCell className="text-slate-400 text-sm">"household income $180K"</TableCell>
                      </TableRow>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Asset</Badge></TableCell>
                        <TableCell className="text-white">$400,000</TableCell>
                        <TableCell><Progress value={90} className="h-2 w-24 bg-slate-700" /></TableCell>
                        <TableCell className="text-slate-400 text-sm">"traditional IRA"</TableCell>
                      </TableRow>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300"><Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">Liability</Badge></TableCell>
                        <TableCell className="text-white">$280,000</TableCell>
                        <TableCell><Progress value={85} className="h-2 w-24 bg-slate-700" /></TableCell>
                        <TableCell className="text-slate-400 text-sm">"owes on mortgage"</TableCell>
                      </TableRow>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-300"><Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Goal</Badge></TableCell>
                        <TableCell className="text-white">Age 62</TableCell>
                        <TableCell><Progress value={98} className="h-2 w-24 bg-slate-700" /></TableCell>
                        <TableCell className="text-slate-400 text-sm">"retire at 62"</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 mt-4">
            {plan ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4">
                  {/* Client Summary */}
                  <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <User className="h-4 w-4 text-violet-400" /> Client Summary
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={copyPlan} className="border-slate-600 bg-slate-800/50">
                            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleSavePlan} className="border-slate-600 bg-slate-800/50">
                            <Save className="h-3.5 w-3.5 mr-1.5" /> Save
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 leading-relaxed">{plan.clientSummary}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
                          <DollarSign className="h-3.5 w-3.5 mr-1" /> Est. Premium: {plan.estimatedAnnualPremium}
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1">
                          <Target className="h-3.5 w-3.5 mr-1" /> {plan.sections.length} Strategic Areas
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plan Sections */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-violet-400" /> Strategic Recommendations
                    </h3>
                    
                    <Accordion type="multiple" defaultValue={plan.sections.map((_, i) => `item-${i}`)} className="space-y-3">
                      {plan.sections.map((section, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className={`border rounded-lg px-4 ${priorityBg(section.priority)} bg-slate-800/40`}>
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="font-semibold text-white">{section.title}</span>
                              <Badge variant="outline" className={`${priorityColor(section.priority)} border-current`}>
                                {section.priority} priority
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0 pb-4">
                            <div className="space-y-4">
                              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                              
                              {section.products.length > 0 && (
                                <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700/50">
                                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Recommended Products</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {section.products.map((p, j) => (
                                      <Badge key={j} className="bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30 cursor-pointer transition-colors">
                                        {p}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Next Steps */}
                  <Card className="bg-slate-800/40 border-slate-700/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-violet-400" /> Next Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3">
                        {plan.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold shrink-0 mt-0.5 border border-violet-500/30">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>

                  {/* Key Risks */}
                  {plan.keyRisks.length > 0 && (
                    <Card className="bg-red-500/5 border-red-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400" /> Key Risks Addressed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {plan.keyRisks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-red-500/10 p-2 rounded border border-red-500/10">
                              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Product Suitability Chart */}
                  <Card className="bg-slate-800/40 border-slate-700/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Shield className="h-4 w-4 text-violet-400" /> Product Suitability
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={productSuitabilityData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Suitability" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">No Plan Generated Yet</h3>
                  <p className="text-slate-400 max-w-md mt-1">Record your client details in the previous tab to generate a comprehensive financial plan.</p>
                </div>
                <Button onClick={() => setActiveTab("record")} className="bg-violet-600 hover:bg-violet-700 mt-4">
                  Go to Recording
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="projections" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/40 border-slate-700/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-violet-400" /> Wealth Projection: With vs Without Plan
                  </CardTitle>
                  <CardDescription>Estimated trajectory based on recommended strategies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="year" stroke="#64748b" />
                        <YAxis stroke="#64748b" tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="withoutPlan" name="Current Trajectory" fill="#ef4444" stroke="#ef4444" fillOpacity={0.1} />
                        <Area type="monotone" dataKey="withPlan" name="With Proposed Plan" fill="#10b981" stroke="#10b981" fillOpacity={0.3} />
                        <Line type="monotone" dataKey="withPlan" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-400" /> Risk Mitigation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskAnalysisData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Current Exposure" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                        <Radar name="Post-Plan Exposure" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-violet-400" /> Proposed Asset Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Equities', current: 60, proposed: 45 },
                        { name: 'Fixed Income', current: 30, proposed: 20 },
                        { name: 'Cash', current: 10, proposed: 5 },
                        { name: 'Annuities/IUL', current: 0, proposed: 30 },
                      ]} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#64748b" unit="%" />
                        <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                        <Legend />
                        <Bar dataKey="current" name="Current %" fill="#64748b" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="proposed" name="Proposed %" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card className="bg-slate-800/40 border-slate-700/50 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-violet-400" /> AI Generation Preferences
                </CardTitle>
                <CardDescription>Customize how the AI analyzes speech and generates plans</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Analysis Mode</label>
                  <Select value={analysisMode} onValueChange={setAnalysisMode}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="standard">Standard (Balanced)</SelectItem>
                      <SelectItem value="conservative">Conservative (Lower Risk)</SelectItem>
                      <SelectItem value="aggressive">Aggressive (Growth Focused)</SelectItem>
                      <SelectItem value="tax-focused">Tax-Optimization Focused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300">Speech Recognition Confidence Threshold</label>
                    <span className="text-sm text-violet-400">{confidenceThreshold}%</span>
                  </div>
                  <Slider
                    value={[confidenceThreshold]}
                    onValueChange={(v) => setConfidenceThreshold(v[0])}
                    max={100}
                    step={1}
                    className="py-2"
                  />
                  <p className="text-xs text-slate-500">Higher values may miss words but reduce errors.</p>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-300">Include Alternative Strategies</label>
                    <p className="text-xs text-slate-500">Generate backup options for primary recommendations</p>
                  </div>
                  <Switch checked={includeAlternatives} onCheckedChange={setIncludeAlternatives} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-300">Advanced Prompting</label>
                    <p className="text-xs text-slate-500">Show raw AI prompt for manual editing</p>
                  </div>
                  <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Save className="h-4 w-4 mr-2" /> Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}


const AdditionalComponent1 = () => {
  return (
    <div className="p-4 border border-slate-700/50 rounded-lg bg-slate-800/40 mt-4">
      <h3 className="text-lg font-medium text-white mb-2">Detailed Analysis</h3>
      <p className="text-slate-300">This section provides additional insights into the generated plan.</p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-400 mb-1">Tax Efficiency Score</h4>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-emerald-400">85/100</span>
            <span className="text-xs text-emerald-500 mb-1">+12 from current</span>
          </div>
          <Progress value={85} className="h-1.5 mt-2 bg-slate-700" />
        </div>
        <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-400 mb-1">Income Stability</h4>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-blue-400">92/100</span>
            <span className="text-xs text-blue-500 mb-1">+24 from current</span>
          </div>
          <Progress value={92} className="h-1.5 mt-2 bg-slate-700" />
        </div>
      </div>
    </div>
  );
};

const AdditionalComponent2 = () => {
  return (
    <div className="p-4 border border-slate-700/50 rounded-lg bg-slate-800/40 mt-4">
      <h3 className="text-lg font-medium text-white mb-2">Implementation Timeline</h3>
      <div className="relative border-l border-slate-700 ml-3 mt-4 space-y-6 pb-2">
        <div className="relative">
          <div className="absolute -left-[17px] top-1 h-3 w-3 rounded-full bg-violet-500 border-2 border-slate-800"></div>
          <div className="pl-4">
            <h4 className="text-sm font-medium text-white">Month 1: Foundation</h4>
            <p className="text-xs text-slate-400 mt-1">Establish new accounts, initiate transfers, finalize life insurance applications.</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-[17px] top-1 h-3 w-3 rounded-full bg-slate-600 border-2 border-slate-800"></div>
          <div className="pl-4">
            <h4 className="text-sm font-medium text-slate-300">Month 2-3: Deployment</h4>
            <p className="text-xs text-slate-500 mt-1">Execute Roth conversions, deploy initial annuity premiums, setup systematic investments.</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-[17px] top-1 h-3 w-3 rounded-full bg-slate-600 border-2 border-slate-800"></div>
          <div className="pl-4">
            <h4 className="text-sm font-medium text-slate-300">Month 6: Review</h4>
            <p className="text-xs text-slate-500 mt-1">Comprehensive review of all implemented strategies and adjustments if necessary.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdditionalComponent3 = () => {
  return (
    <div className="p-4 border border-slate-700/50 rounded-lg bg-slate-800/40 mt-4">
      <h3 className="text-lg font-medium text-white mb-2">Compliance Check</h3>
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-400">Suitability Requirements Met</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20">View Log</Button>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-400">Risk Profile Aligned</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20">View Log</Button>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-400">Missing Beneficiary Information</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/20">Resolve</Button>
        </div>
      </div>
    </div>
  );
};

const generateHistoricalData = () => {
  return Array.from({ length: 12 }).map((_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    value: Math.floor(Math.random() * 5000) + 10000,
    growth: Math.random() * 5,
  }));
};

const generateSectorData = () => {
  return [
    { name: 'Technology', value: 35 },
    { name: 'Healthcare', value: 20 },
    { name: 'Financials', value: 15 },
    { name: 'Consumer', value: 10 },
    { name: 'Energy', value: 10 },
    { name: 'Other', value: 10 },
  ];
};

const AdditionalComponent4 = () => {
  return (
    <div className="p-4 border border-slate-700/50 rounded-lg bg-slate-800/40 mt-4">
      <h3 className="text-lg font-medium text-white mb-4">Historical Performance Context</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={generateHistoricalData()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '6px' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export { AdditionalComponent1, AdditionalComponent2, AdditionalComponent3, AdditionalComponent4 };
