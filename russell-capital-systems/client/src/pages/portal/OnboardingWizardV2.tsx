// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NumberInput } from "@/components/NumberInput";
import { PageInsights } from "@/components/PageInsights";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Target,
  Shield,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Briefcase,
  Home,
  Wallet,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/_core/hooks/useAuth";

const fmt = (n: number) => `$${n.toLocaleString()}`;

const STEPS = ["Personal Info", "Financial Snapshot", "Goals & Risk", "Your Strategy"];

export default function OnboardingWizardV2() {
  const [step, setStep] = useState<number>(0);
  const [form, setForm] = useState({
    age: 50, income: 250000, iraBalance: 1000000, homeEquity: 500000,
    filingStatus: "married" as "single" | "married" | "hoh",
    retirementAge: 65, annualIncomeNeeded: 150000, legacyGoal: 1000000, riskTolerance: 5,
  });

  const { data: clientData, loading } = useClientData();

  useEffect(() => {
    if (clientData) {
      setForm(prev => ({
        ...prev,
        ...(clientData.age ? { age: clientData.age } : {}),
        ...(clientData.annualIncome ? { income: clientData.annualIncome } : {}),
        ...(clientData.iraBalance ? { iraBalance: clientData.iraBalance } : {}),
        ...(clientData.realEstateEquity ? { homeEquity: clientData.realEstateEquity } : {}),
        ...(clientData.filingStatus ? { filingStatus: clientData.filingStatus as any } : {}),
        ...(clientData.retirementAge ? { retirementAge: clientData.retirementAge } : {}),
        ...(clientData.annualIncomeNeeded ? { annualIncomeNeeded: clientData.annualIncomeNeeded } : {}),
        ...(clientData.legacyGoal ? { legacyGoal: clientData.legacyGoal } : {}),
        ...(clientData.riskTolerance ? { riskTolerance: clientData.riskTolerance } : {})
      }));
    }
  }, [clientData]);

  const recMut = trpc.onboardingWizardV2.getRecommendation.useMutation();

  const { user } = useAuth();
  const clientsMut = trpc.clients.create.useMutation();
  const notesMut = trpc.notes.create.useMutation();
  const activityMut = trpc.activity.log.useMutation();
  const dashboardQ = trpc.dashboard.stats.useQuery(undefined, { enabled: false });
  const pipelineQ = trpc.pipeline.getDeals.useQuery(undefined, { enabled: false });

  const next = () => {
    if (step === 2) {
      recMut.mutate(form);
      toast.success("Generating your personalized strategy...");
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const prev = () => setStep(s => Math.max(s - 1, 0));
  const result = recMut.data;

  const chartData = [
    { name: "Current IRA", value: form.iraBalance, fill: "#3b82f6" },
    { name: "Home Equity", value: form.homeEquity, fill: "#f0c040" },
    { name: "Legacy Goal", value: form.legacyGoal, fill: "#22c55e" }
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <RefreshCw className="w-12 h-12 text-[#22c55e] animate-spin" />
          <p className="text-[#c8d8ec] text-lg">Loading your financial profile...</p>
        </div>
      </AppShell>
    );
  }

const AdditionalDataSection = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [toggles, setToggles] = useState({ a: false, b: false, c: false, d: false, e: false });
  const [radios, setRadios] = useState("1");
  const [checks, setChecks] = useState({ a: false, b: false, c: false, d: false, e: false });
  
  const data1 = [{name: 'A', uv: 400}, {name: 'B', uv: 300}, {name: 'C', uv: 200}, {name: 'D', uv: 278}, {name: 'E', uv: 189}];
  const data2 = [{name: 'Group A', value: 400}, {name: 'Group B', value: 300}, {name: 'Group C', value: 300}, {name: 'Group D', value: 200}];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const data3 = [{subject: 'Math', A: 120, B: 110, fullMark: 150}, {subject: 'Chinese', A: 98, B: 130, fullMark: 150}, {subject: 'English', A: 86, B: 130, fullMark: 150}, {subject: 'Geography', A: 99, B: 100, fullMark: 150}, {subject: 'Physics', A: 85, B: 90, fullMark: 150}, {subject: 'History', A: 65, B: 85, fullMark: 150}];
  const data4 = [{name: 'Page A', uv: 590, pv: 800, amt: 1400}, {name: 'Page B', uv: 868, pv: 967, amt: 1506}, {name: 'Page C', uv: 1397, pv: 1098, amt: 989}, {name: 'Page D', uv: 1480, pv: 1200, amt: 1228}, {name: 'Page E', uv: 1520, pv: 1108, amt: 1100}, {name: 'Page F', uv: 1400, pv: 680, amt: 1700}];
  
  return (
    <div className="mt-8 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-[#0d1a2e] p-4 rounded-xl">
              <h3 className="text-white mb-2">Line Chart</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data1}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="uv" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64 bg-[#0d1a2e] p-4 rounded-xl">
              <h3 className="text-white mb-2">Pie Chart</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data2} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                    {data2.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-[#0d1a2e] p-4 rounded-xl">
            <h3 className="text-white mb-2">Data Table 1</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1,2,3,4,5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>Item {i}</TableCell>
                    <TableCell>${i * 1000}</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-[#0d1a2e] p-4 rounded-xl">
              <h3 className="text-white mb-2">Area Chart</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data1}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64 bg-[#0d1a2e] p-4 rounded-xl">
              <h3 className="text-white mb-2">Radar Chart</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data3}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="Mike" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-[#0d1a2e] p-4 rounded-xl">
            <h3 className="text-white mb-2">Data Table 2</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1,2,3,4,5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>#{i}</TableCell>
                    <TableCell>Category {i}</TableCell>
                    <TableCell>${i * 500}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="h-80 bg-[#0d1a2e] p-4 rounded-xl">
            <h3 className="text-white mb-2">Composed Chart</h3>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data4}>
                <CartesianGrid stroke="#f5f5f5" />
                <XAxis dataKey="name" scale="band" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
                <Bar dataKey="pv" barSize={20} fill="#413ea0" />
                <Line type="monotone" dataKey="uv" stroke="#ff7300" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d1a2e] p-4 rounded-xl">
              <h3 className="text-white mb-2">Data Table 3</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1,2,3,4].map((i) => (
                    <TableRow key={i}>
                      <TableCell>Metric {i}</TableCell>
                      <TableCell>{i * 25}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-[#0d1a2e] p-4 rounded-xl">
              <h3 className="text-white mb-2">Data Table 4</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1,2,3,4].map((i) => (
                    <TableRow key={i}>
                      <TableCell>2023-01-0{i}</TableCell>
                      <TableCell>Event {i}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d1a2e] p-4 rounded-xl space-y-4">
              <h3 className="text-white">Interactive Elements</h3>
              
              <div className="space-y-2">
                <h4 className="text-[#c8d8ec]">Switches</h4>
                {['a', 'b', 'c', 'd', 'e'].map((k) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-white">Setting {k.toUpperCase()}</span>
                    <Switch checked={toggles[k as keyof typeof toggles]} onCheckedChange={(v) => setToggles({...toggles, [k]: v})} />
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-[#c8d8ec]">Checkboxes</h4>
                {['a', 'b', 'c', 'd', 'e'].map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <Checkbox id={`check-${k}`} checked={checks[k as keyof typeof checks]} onCheckedChange={(v) => setChecks({...checks, [k]: !!v})} />
                    <label htmlFor={`check-${k}`} className="text-white">Option {k.toUpperCase()}</label>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-[#c8d8ec]">Radio Group</h4>
                <RadioGroup value={radios} onValueChange={setRadios}>
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <RadioGroupItem value={i.toString()} id={`radio-${i}`} />
                      <label htmlFor={`radio-${i}`} className="text-white">Choice {i}</label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-[#0d1a2e] p-4 rounded-xl">
                <h3 className="text-white mb-2">Data Table 5</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1,2,3,4].map((i) => (
                      <TableRow key={i}>
                        <TableCell>User {i}</TableCell>
                        <TableCell>Role {i}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="bg-[#0d1a2e] p-4 rounded-xl">
                <h3 className="text-white mb-2">Data Table 6</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>System</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1,2,3,4].map((i) => (
                      <TableRow key={i}>
                        <TableCell>System {i}</TableCell>
                        <TableCell>Online</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <FactFinderBadge className="mb-4" />
        
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#12233e] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                <Sparkles className="w-8 h-8 text-[#f0c040]" />
              </div>
              <div>
                <h1 className="rc-page-title text-3xl font-bold text-white">Smart Onboarding Wizard</h1>
                <p className="rc-page-subtitle text-[#7a95b8] mt-1">Personalized wealth strategy generation</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportToSlides
              toolName="Smart Onboarding Wizard"
              getSections={() => [
                {
                  title: "Personal Information",
                  items: [
                    { label: "Age", value: form.age.toString() },
                    { label: "Annual Income", value: fmt(form.income) },
                    { label: "Filing Status", value: form.filingStatus },
                  ],
                },
                {
                  title: "Financial Snapshot",
                  items: [
                    { label: "IRA/401(k) Balance", value: fmt(form.iraBalance) },
                    { label: "Home Equity", value: fmt(form.homeEquity) },
                  ],
                },
                {
                  title: "Goals & Risk Tolerance",
                  items: [
                    { label: "Retirement Age", value: form.retirementAge.toString() },
                    { label: "Annual Income Needed", value: fmt(form.annualIncomeNeeded) },
                    { label: "Legacy Goal", value: fmt(form.legacyGoal) },
                    { label: "Risk Tolerance", value: `${form.riskTolerance}/10` },
                  ],
                },
                ...(result
                  ? [
                      {
                        title: "Your Personalized Strategy",
                        items: [
                          { label: "Recommended Roth Conversion", value: `${fmt(result.suggestedConversion)}/yr` },
                          { label: "IUL Annual Premium", value: `${fmt(result.suggestedPremium)}/yr` },
                          { label: "Opportunity Score", value: `${result.score}/100` },
                          { label: "Strategy", value: result.strategy },
                        ],
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#c8d8ec]">Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
            <span className="text-sm font-medium text-[#22c55e]">{Math.round(((step + 1) / STEPS.length) * 100)}% Complete</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2 bg-[#12233e]" />
          
          <div className="flex items-center gap-2 mt-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${i <= step ? "bg-[#22c55e] text-[#060d19] shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "bg-[#0d1a2e] text-[#7a95b8] border border-[#12233e]"}`}>
                  {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden md:block transition-colors duration-300 ${i <= step ? "text-white" : "text-[#7a95b8]"}`}>{s}</span>
                {i < 3 && <div className={`flex-1 h-0.5 transition-colors duration-300 ${i < step ? "bg-[#22c55e]" : "bg-[#12233e]"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 0 && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6 border-b border-[#12233e] pb-4">
                <div className="p-2 bg-[#060d19] rounded-lg">
                  <Briefcase className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                  <p className="text-sm text-[#7a95b8]">Tell us about yourself to tailor your experience</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec] font-medium">Current Age</Label>
                    <NumberInput 
                      value={form.age} 
                      onChange={(v) => setForm(f => ({ ...f, age: v }))} 
                      className="rc-input bg-[#060d19] border-[#12233e] text-white h-12" 
                      min={18} max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec] font-medium">Filing Status</Label>
                    <Select value={form.filingStatus} onValueChange={v => setForm(f => ({ ...f, filingStatus: v as any }))}>
                      <SelectTrigger className="rc-input bg-[#060d19] border-[#12233e] text-white h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectItem value="married" className="focus:bg-[#12233e] focus:text-white">Married Filing Jointly</SelectItem>
                        <SelectItem value="single" className="focus:bg-[#12233e] focus:text-white">Single</SelectItem>
                        <SelectItem value="hoh" className="focus:bg-[#12233e] focus:text-white">Head of Household</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#c8d8ec] font-medium">Annual Household Income</Label>
                  <NumberInput 
                    value={form.income} 
                    onChange={(v) => setForm(f => ({ ...f, income: v }))} 
                    className="rc-input bg-[#060d19] border-[#12233e] text-white h-12 text-lg font-semibold" 
                    step={10000}
                  />
                  <p className="text-xs text-[#7a95b8]">Combined income from all sources before taxes</p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6 border-b border-[#12233e] pb-4">
                <div className="p-2 bg-[#060d19] rounded-lg">
                  <Wallet className="w-6 h-6 text-[#f0c040]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Financial Snapshot</h2>
                  <p className="text-sm text-[#7a95b8]">Current assets and balances</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2 p-4 bg-[#060d19] rounded-xl border border-[#12233e] transition-all hover:border-[#3b82f6]/50">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-[#c8d8ec] font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
                        IRA / 401(k) Balance
                      </Label>
                      <span className="rc-badge bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20 px-2 py-0.5 rounded text-xs font-medium">Tax-Deferred</span>
                    </div>
                    <NumberInput 
                      value={form.iraBalance} 
                      onChange={(v) => setForm(f => ({ ...f, iraBalance: v }))} 
                      className="rc-input bg-transparent border-none text-white h-12 text-2xl font-bold px-0 focus-visible:ring-0" 
                      step={50000}
                    />
                  </div>
                  
                  <div className="space-y-2 p-4 bg-[#060d19] rounded-xl border border-[#12233e] transition-all hover:border-[#f0c040]/50">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-[#c8d8ec] font-medium flex items-center gap-2">
                        <Home className="w-4 h-4 text-[#f0c040]" />
                        Home Equity
                      </Label>
                      <span className="rc-badge bg-[#f0c040]/10 text-[#f0c040] border-[#f0c040]/20 px-2 py-0.5 rounded text-xs font-medium">Illiquid</span>
                    </div>
                    <NumberInput 
                      value={form.homeEquity} 
                      onChange={(v) => setForm(f => ({ ...f, homeEquity: v }))} 
                      className="rc-input bg-transparent border-none text-white h-12 text-2xl font-bold px-0 focus-visible:ring-0" 
                      step={25000}
                    />
                  </div>
                </div>
                
                <div className="bg-[#060d19] rounded-xl border border-[#12233e] p-4 flex flex-col items-center justify-center">
                  <h3 className="text-[#c8d8ec] font-medium mb-4">Asset Distribution</h3>
                  {(form.iraBalance > 0 || form.homeEquity > 0) ? (
                    <div className="w-full h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [fmt(value), "Amount"]}
                            cursor={{ fill: '#12233e', opacity: 0.4 }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-[#7a95b8]">
                      <PieChart className="w-12 h-12 mb-2 opacity-50" />
                      <p>Enter values to see distribution</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6 border-b border-[#12233e] pb-4">
                <div className="p-2 bg-[#060d19] rounded-lg">
                  <Target className="w-6 h-6 text-[#22c55e]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Goals & Risk Tolerance</h2>
                  <p className="text-sm text-[#7a95b8]">What are you planning for?</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec] font-medium">Target Retirement Age</Label>
                    <NumberInput 
                      value={form.retirementAge} 
                      onChange={(v) => setForm(f => ({ ...f, retirementAge: v }))} 
                      className="rc-input bg-[#060d19] border-[#12233e] text-white h-12" 
                      min={50} max={90}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec] font-medium">Annual Income Needed</Label>
                    <NumberInput 
                      value={form.annualIncomeNeeded} 
                      onChange={(v) => setForm(f => ({ ...f, annualIncomeNeeded: v }))} 
                      className="rc-input bg-[#060d19] border-[#12233e] text-white h-12" 
                      step={10000}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 p-4 bg-[#060d19] rounded-xl border border-[#12233e]">
                  <Label className="text-[#c8d8ec] font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#22c55e]" />
                    Legacy Goal (Death Benefit)
                  </Label>
                  <NumberInput 
                    value={form.legacyGoal} 
                    onChange={(v) => setForm(f => ({ ...f, legacyGoal: v }))} 
                    className="rc-input bg-transparent border-none text-white h-12 text-2xl font-bold px-0 focus-visible:ring-0" 
                    step={100000}
                  />
                  <p className="text-xs text-[#7a95b8]">Amount to leave behind tax-free to beneficiaries</p>
                </div>
                
                <div className="space-y-4 p-5 bg-[#060d19] rounded-xl border border-[#12233e]">
                  <div className="flex justify-between items-center">
                    <Label className="text-white font-medium text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#f0c040]" />
                      Risk Tolerance
                    </Label>
                    <span className="rc-badge bg-[#f0c040]/10 text-[#f0c040] border-[#f0c040]/20 px-3 py-1 rounded-full font-bold text-lg">
                      {form.riskTolerance} / 10
                    </span>
                  </div>
                  
                  <div className="pt-4 pb-2">
                    <Slider 
                      value={[form.riskTolerance]} 
                      onValueChange={([v]) => setForm(f => ({ ...f, riskTolerance: v }))} 
                      min={1} max={10} step={1} 
                      className="py-4" 
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-1 rounded">Conservative</span>
                    <span className="text-[#7a95b8]">Moderate</span>
                    <span className="text-[#ef4444] bg-[#ef4444]/10 px-2 py-1 rounded">Aggressive</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {recMut.isPending ? (
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-12 shadow-lg flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#22c55e] blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <RefreshCw className="w-16 h-16 text-[#22c55e] animate-spin relative z-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Analyzing Your Profile</h3>
                    <p className="text-[#7a95b8] max-w-md mx-auto">Our AI is calculating optimal Roth conversion amounts and structuring the ideal IUL policy for your specific goals...</p>
                  </div>
                  <Progress value={65} className="w-64 h-2 bg-[#12233e] [&>div]:bg-[#22c55e] animate-pulse" />
                </div>
              ) : result ? (
                <div className="rc-card bg-[#0d1a2e] border-2 border-[#22c55e]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#12233e] pb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#22c55e]/10 rounded-xl border border-[#22c55e]/20">
                        <Sparkles className="w-8 h-8 text-[#22c55e]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Your Personalized Strategy</h2>
                        <p className="text-[#7a95b8]">Optimized for tax-free growth and legacy</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#7a95b8] mb-1">Opportunity Score</p>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#060d19] border-4 border-[#22c55e] text-2xl font-bold text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        {result.score}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-[#060d19] to-[#0d1a2e] p-6 rounded-xl border border-[#12233e] relative overflow-hidden group hover:border-[#3b82f6]/50 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#3b82f6]/10"></div>
                      <div className="flex items-center gap-3 mb-4 relative z-10">
                        <RefreshCw className="w-5 h-5 text-[#3b82f6]" />
                        <h3 className="text-[#c8d8ec] font-medium">Recommended Roth Conversion</h3>
                      </div>
                      <p className="text-3xl font-bold text-white relative z-10">{fmt(result.suggestedConversion)}<span className="text-lg text-[#7a95b8] font-normal">/yr</span></p>
                      <p className="text-sm text-[#7a95b8] mt-2 relative z-10">Shift tax-deferred assets to tax-free</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#060d19] to-[#0d1a2e] p-6 rounded-xl border border-[#12233e] relative overflow-hidden group hover:border-[#f0c040]/50 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#f0c040]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#f0c040]/10"></div>
                      <div className="flex items-center gap-3 mb-4 relative z-10">
                        <Shield className="w-5 h-5 text-[#f0c040]" />
                        <h3 className="text-[#c8d8ec] font-medium">IUL Annual Premium</h3>
                      </div>
                      <p className="text-3xl font-bold text-white relative z-10">{fmt(result.suggestedPremium)}<span className="text-lg text-[#7a95b8] font-normal">/yr</span></p>
                      <p className="text-sm text-[#7a95b8] mt-2 relative z-10">Fund tax-free retirement & death benefit</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 border-b border-[#12233e] pb-2">Strategic Recommendations</h3>
                    {([{ priority: result.score > 80 ? "high" : "medium", name: result.strategy, description: result.description }]).map((s: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-[#060d19] border border-[#12233e] hover:border-[#22c55e]/30 transition-colors">
                        <div className={`mt-1 p-1.5 rounded-full ${s.priority === "high" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#f0c040]/20 text-[#f0c040]"}`}>
                          {s.priority === "high" ? <Target className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white text-lg">{s.name}</h4>
                            <span className={`rc-badge text-xs px-2 py-0.5 rounded ${s.priority === "high" ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20" : "bg-[#f0c040]/10 text-[#f0c040] border border-[#f0c040]/20"}`}>
                              {s.priority.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <p className="text-[#c8d8ec] leading-relaxed">{s.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full h-14 text-lg font-bold bg-[#22c55e] hover:bg-[#1ea34d] text-[#060d19] rounded-xl shadow-[0_4px_14px_rgba(34,197,94,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] hover:-translate-y-0.5" 
                    onClick={() => window.location.href = "/portal/strategy"}
                  >
                    Go to Full Strategy Lab <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-[#ef4444] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Error Generating Strategy</h3>
                  <p className="text-[#7a95b8] mb-6">There was a problem generating your recommendation. Please try again.</p>
                  <Button onClick={() => recMut.mutate(form)} className="rc-btn rc-btn-primary">
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#12233e]">
          <Button 
            variant="outline" 
            onClick={prev} 
            disabled={step === 0 || (step === 3 && recMut.isPending)}
            className="rc-btn rc-btn-ghost border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] hover:text-white h-12 px-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          {step < 3 && (
            <Button 
              onClick={next} 
              disabled={recMut.isPending}
              className="rc-btn rc-btn-primary bg-[#22c55e] hover:bg-[#1ea34d] text-[#060d19] h-12 px-8 font-semibold shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            >
              {step === 2 ? (recMut.isPending ? "Generating..." : "Get My Strategy") : "Next"} 
              {step !== 2 && <ChevronRight className="w-4 h-4 ml-2" />}
              {step === 2 && !recMut.isPending && <Sparkles className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>

        <AdditionalDataSection />
        <div className="mt-12">
          <NAICDisclaimer />
        </div>
      </div>
      
      <PageInsights pageId="onboarding-wizard" />
    </AppShell>
  );
}

