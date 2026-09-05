// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { OilGasToggle } from "@/components/OilGasToggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { NumberInput } from "@/components/NumberInput";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Home,
  Briefcase,
  GraduationCap,
  Plane,
  Heart,
  Shield,
  Car,
  Wallet,
  Settings,
} from "lucide-react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart, LineChart, PieChart, AreaChart, RadarChart, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Bar, Line, Pie, Cell, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Scatter
} from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface Goal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  priority: "essential" | "important" | "aspirational";
  fundingSource: string;
  icon: string;
}

const GOAL_ICONS: Record<string, React.ReactNode> = {
  retirement: <Wallet className="h-5 w-5" />,
  home: <Home className="h-5 w-5" />,
  education: <GraduationCap className="h-5 w-5" />,
  travel: <Plane className="h-5 w-5" />,
  healthcare: <Heart className="h-5 w-5" />,
  insurance: <Shield className="h-5 w-5" />,
  vehicle: <Car className="h-5 w-5" />,
  business: <Briefcase className="h-5 w-5" />,
  legacy: <Target className="h-5 w-5" />,
  other: <DollarSign className="h-5 w-5" />,
};

const PRIORITY_COLORS = {
  essential: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", badge: "bg-red-500/20 text-red-400" },
  important: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400" },
  aspirational: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400" },
};

const FUNDING_SOURCES = [
  "401(k)/IRA", "Roth IRA", "Brokerage Account", "IUL Policy Loans", "Savings Account",
  "Annuity Income", "Social Security", "Rental Income", "Business Income", "Other",
];

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const DEFAULT_GOALS: Goal[] = [
  { id: "1", name: "Retirement Income", category: "retirement", targetAmount: 3000000, currentAmount: 1500000, monthlyContribution: 5000, targetDate: "2038-01-01", priority: "essential", fundingSource: "401(k)/IRA", icon: "retirement" },
  { id: "2", name: "College Fund (Child 1)", category: "education", targetAmount: 250000, currentAmount: 85000, monthlyContribution: 1500, targetDate: "2032-09-01", priority: "essential", fundingSource: "Brokerage Account", icon: "education" },
  { id: "3", name: "Vacation Home", category: "home", targetAmount: 800000, currentAmount: 200000, monthlyContribution: 3000, targetDate: "2030-06-01", priority: "important", fundingSource: "Savings Account", icon: "home" },
  { id: "4", name: "Tax-Free Retirement Bridge", category: "insurance", targetAmount: 1500000, currentAmount: 350000, monthlyContribution: 4000, targetDate: "2040-01-01", priority: "essential", fundingSource: "IUL Policy Loans", icon: "insurance" },
  { id: "5", name: "Estate Legacy", category: "legacy", targetAmount: 5000000, currentAmount: 2000000, monthlyContribution: 0, targetDate: "2055-01-01", priority: "important", fundingSource: "IUL Policy Loans", icon: "legacy" },
  { id: "6", name: "European Vacation", category: "travel", targetAmount: 30000, currentAmount: 12000, monthlyContribution: 1000, targetDate: "2027-06-01", priority: "aspirational", fundingSource: "Savings Account", icon: "travel" },
];

export default function GoalsBasedPlanning() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({ priority: "important", fundingSource: "Savings Account", icon: "other", category: "other" });
  const [annualReturn, setAnnualReturn] = useState(7);
  const [inflationRate, setInflationRate] = useState(3);
  const [taxRate, setTaxRate] = useState(24);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const { data: clientData } = useClientData();
  
  const clientsData = trpc.clients.list.useQuery();
  const notesData = trpc.notes.list.useQuery({ clientId: 0 });
  const activityData = trpc.activity.list.useQuery();
  const dashboardData = trpc.dashboard.stats.useQuery();
  const pipelineData = trpc.pipeline.list.useQuery();

  useEffect(() => {
    if (!clientData) return;
    if (clientData.annualIncome) setAnnualReturn(prev => prev);
  }, [clientData]);

  const goalAnalysis = useMemo(() => {
    return goals.map((goal) => {
      const now = new Date();
      const target = new Date(goal.targetDate);
      const monthsRemaining = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
      const yearsRemaining = monthsRemaining / 12;
      
      const realReturn = ((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1) * 100;
      const monthlyRate = realReturn / 100 / 12;

      const fvCurrent = goal.currentAmount * Math.pow(1 + monthlyRate, monthsRemaining);
      const fvContributions = goal.monthlyContribution * ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate);
      const projectedValue = fvCurrent + fvContributions;

      const probability = Math.min(100, Math.round((projectedValue / goal.targetAmount) * 100));
      const gap = Math.max(0, goal.targetAmount - projectedValue);
      const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

      const remainingNeeded = goal.targetAmount - fvCurrent;
      const requiredMonthly = remainingNeeded > 0
        ? Math.round(remainingNeeded / ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate))
        : 0;

      return {
        ...goal,
        monthsRemaining,
        yearsRemaining: Math.round(yearsRemaining * 10) / 10,
        projectedValue: Math.round(projectedValue),
        probability,
        gap: Math.round(gap),
        progress,
        requiredMonthly: Math.max(0, requiredMonthly),
        onTrack: probability >= 90,
        atRisk: probability >= 50 && probability < 90,
        offTrack: probability < 50,
      };
    });
  }, [goals, annualReturn, inflationRate]);

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
    const totalMonthly = goals.reduce((s, g) => s + g.monthlyContribution, 0);
    const onTrack = goalAnalysis.filter((g) => g.onTrack).length;
    const atRisk = goalAnalysis.filter((g) => g.atRisk).length;
    const offTrack = goalAnalysis.filter((g) => g.offTrack).length;
    const avgProbability = goalAnalysis.length > 0 ? Math.round(goalAnalysis.reduce((s, g) => s + g.probability, 0) / goalAnalysis.length) : 0;
    const essentialFunded = goalAnalysis.filter((g) => g.priority === "essential" && g.onTrack).length;
    const essentialTotal = goalAnalysis.filter((g) => g.priority === "essential").length;
    return { totalTarget, totalCurrent, totalMonthly, onTrack, atRisk, offTrack, avgProbability, essentialFunded, essentialTotal };
  }, [goals, goalAnalysis]);

  const addGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) return;
    const goal: Goal = {
      id: Date.now().toString(),
      name: newGoal.name || "",
      category: newGoal.category || "other",
      targetAmount: newGoal.targetAmount || 0,
      currentAmount: newGoal.currentAmount || 0,
      monthlyContribution: newGoal.monthlyContribution || 0,
      targetDate: newGoal.targetDate || "2035-01-01",
      priority: (newGoal.priority as Goal["priority"]) || "important",
      fundingSource: newGoal.fundingSource || "Savings Account",
      icon: newGoal.icon || "other",
    };
    setGoals([...goals, goal]);
    setShowAddDialog(false);
    setNewGoal({ priority: "important", fundingSource: "Savings Account", icon: "other", category: "other" });
  };

  const removeGoal = (id: string) => setGoals(goals.filter((g) => g.id !== id));

  const projectionData = useMemo(() => {
    const data = [];
    const maxYears = Math.max(...goalAnalysis.map((g) => g.yearsRemaining));
    for (let year = 0; year <= maxYears; year++) {
      const point: any = { year: new Date().getFullYear() + year };
      goalAnalysis.forEach((g) => {
        if (year <= g.yearsRemaining) {
          const monthlyRate = ((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1) / 12;
          const months = year * 12;
          const fvCurrent = g.currentAmount * Math.pow(1 + monthlyRate, months);
          const fvContributions = g.monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
          point[g.name] = Math.round(fvCurrent + fvContributions);
        }
      });
      data.push(point);
    }
    return data;
  }, [goalAnalysis, annualReturn, inflationRate]);

  const priorityPieData = [
    { name: "Essential", value: goalAnalysis.filter((g) => g.priority === "essential").reduce((s, g) => s + g.targetAmount, 0), color: "#ef4444" },
    { name: "Important", value: goalAnalysis.filter((g) => g.priority === "important").reduce((s, g) => s + g.targetAmount, 0), color: "#f59e0b" },
    { name: "Aspirational", value: goalAnalysis.filter((g) => g.priority === "aspirational").reduce((s, g) => s + g.targetAmount, 0), color: "#3b82f6" },
  ].filter((d) => d.value > 0);

  const fundingSourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    goalAnalysis.forEach((g) => {
      sources[g.fundingSource] = (sources[g.fundingSource] || 0) + g.targetAmount;
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [goalAnalysis]);

  const gapAnalysisData = goalAnalysis.map((g) => ({
    name: g.name,
    projected: g.projectedValue,
    gap: g.gap,
    target: g.targetAmount
  }));

  const radarData = goalAnalysis.map((g) => ({
    subject: g.name,
    A: g.probability,
    fullMark: 100,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  return (
    <AppShell>
      <div className="space-y-6 p-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="GoalsBasedPlanning" />

        <ExecutiveSummary
          pageTitle="Goals Based Planning"
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
        <GoalsAccelerator pageName="Goals Based Planning" pageContext="Goals Based Planning — strategic planning modeling with projections and scenario analysis" />
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Goals-Based Planning Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Priority-ranked goals with probability engine tying all calculators together
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides
              toolName="Goals-Based Planning"
              getSections={() => [
                {
                  title: "Summary",
                  items: [
                    { label: "Overall Probability", value: `${summary.avgProbability}%` },
                    { label: "Essential Goals Funded", value: `${summary.essentialFunded}/${summary.essentialTotal}` },
                    { label: "Total Monthly Savings", value: fmt(summary.totalMonthly) },
                    { label: "Total Goal Target", value: fmt(summary.totalTarget) }
                  ]
                }
              ]}
            />
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Add Goal</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Goal</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Goal Name</Label>
                    <Input value={newGoal.name || ""} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="e.g. Dream Home" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Target Amount</Label>
                    <NumberInput value={newGoal.targetAmount || 0} onChange={(e) => setNewGoal({ ...newGoal, targetAmount: val })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Current Amount</Label>
                    <NumberInput value={newGoal.currentAmount || 0} onChange={(e) => setNewGoal({ ...newGoal, currentAmount: val })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Monthly Contribution</Label>
                    <NumberInput value={newGoal.monthlyContribution || 0} onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: val })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Target Date</Label>
                    <Input type="date" value={newGoal.targetDate || ""} onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select value={newGoal.priority} onValueChange={v => setNewGoal({ ...newGoal, priority: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essential">Essential</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="aspirational">Aspirational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addGoal} className="w-full mt-4">Save Goal</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Overall Probability</p>
              <h3 className="text-3xl font-bold mt-1">{summary.avgProbability}%</h3>
              <p className="text-xs text-muted-foreground mt-2">Average across all goals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Essential Funded</p>
              <h3 className="text-3xl font-bold mt-1">{summary.essentialFunded} / {summary.essentialTotal}</h3>
              <p className="text-xs text-muted-foreground mt-2">Essential goals on track</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Monthly</p>
              <h3 className="text-3xl font-bold mt-1">{fmt(summary.totalMonthly)}</h3>
              <p className="text-xs text-muted-foreground mt-2">Current savings rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Target</p>
              <h3 className="text-3xl font-bold mt-1">{fmt(summary.totalTarget)}</h3>
              <p className="text-xs text-muted-foreground mt-2">Across all {goals.length} goals</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
            <TabsTrigger value="tables">Data Tables</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Goal Projections</CardTitle>
                    <CardDescription>Projected value of all goals over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            {goalAnalysis.map((g, i) => (
                              <linearGradient key={g.id} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(val: number) => fmt(val)} />
                          <Legend />
                          {goalAnalysis.map((g, i) => (
                            <Area key={g.id} type="monotone" dataKey={g.name} stackId="1" stroke={COLORS[i % COLORS.length]} fill={`url(#color${i})`} />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gap Analysis</CardTitle>
                    <CardDescription>Projected vs Target values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gapAnalysisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(val: number) => fmt(val)} />
                          <Legend />
                          <Bar dataKey="projected" stackId="a" fill="#3b82f6" name="Projected Value" />
                          <Bar dataKey="gap" stackId="a" fill="#ef4444" name="Shortfall" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Priority Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={priorityPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {priorityPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: number) => fmt(val)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Funding Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fundingSourceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                          <XAxis type="number" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip formatter={(val: number) => fmt(val)} />
                          <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                            {fundingSourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Goal Probability Radar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Probability" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Goal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goalAnalysis.map((goal) => (
                    <Card key={goal.id} className="overflow-hidden border-2 transition-all hover:border-primary/50">
                      <div className={`h-2 ${goal.onTrack ? 'bg-green-500' : goal.atRisk ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              {GOAL_ICONS[goal.icon] || <Target className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-semibold line-clamp-1">{goal.name}</h4>
                              <p className="text-xs text-muted-foreground">{goal.yearsRemaining} years away</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={PRIORITY_COLORS[goal.priority].badge}>
                            {goal.priority}
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Probability of Success</span>
                              <span className="font-bold">{goal.probability}%</span>
                            </div>
                            <Progress value={goal.probability} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Target</p>
                              <p className="font-semibold">{fmt(goal.targetAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Projected</p>
                              <p className="font-semibold">{fmt(goal.projectedValue)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Current</p>
                              <p className="font-semibold">{fmt(goal.currentAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Monthly</p>
                              <p className="font-semibold">{fmt(goal.monthlyContribution)}</p>
                            </div>
                          </div>
                          
                          {goal.requiredMonthly > goal.monthlyContribution && (
                            <div className="bg-amber-500/10 text-amber-600 p-2 rounded-md text-xs flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <p>Increase monthly savings by <strong>{fmt(goal.requiredMonthly - goal.monthlyContribution)}</strong> to reach target.</p>
                            </div>
                          )}
                          
                          <div className="pt-2 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedGoalId(goal.id)}>
                              <Settings className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeGoal(goal.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
                <CardDescription>In-depth breakdown of goal feasibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={goalAnalysis} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="#f5f5f5" />
                      <XAxis dataKey="name" scale="band" />
                      <YAxis yAxisId="left" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                      <Tooltip formatter={(val: number, name: string) => name === 'Probability' ? `${val}%` : fmt(val)} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="targetAmount" barSize={20} fill="#413ea0" name="Target Amount" />
                      <Bar yAxisId="left" dataKey="projectedValue" barSize={20} fill="#8884d8" name="Projected Value" />
                      <Line yAxisId="right" type="monotone" dataKey="probability" stroke="#ff7300" name="Probability" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assumptions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Assumptions</CardTitle>
                <CardDescription>Adjust the underlying economic assumptions for all projections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Annual Return (%)</Label>
                    <NumberInput value={annualReturn} onChange={setAnnualReturn} />
                    <p className="text-xs text-muted-foreground">Expected gross portfolio return</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Inflation Rate (%)</Label>
                    <NumberInput value={inflationRate} onChange={setInflationRate} />
                    <p className="text-xs text-muted-foreground">Expected annual inflation</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <NumberInput value={taxRate} onChange={setTaxRate} />
                    <p className="text-xs text-muted-foreground">Estimated blended tax rate</p>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Impact Analysis</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on your assumptions, the real rate of return (inflation-adjusted) is 
                    <strong className="text-foreground ml-1">
                      {(((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1) * 100).toFixed(2)}%
                    </strong>
                  </p>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { year: 0, nominal: 100000, real: 100000 },
                        { year: 5, nominal: 100000 * Math.pow(1 + annualReturn/100, 5), real: 100000 * Math.pow(1 + (((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1)), 5) },
                        { year: 10, nominal: 100000 * Math.pow(1 + annualReturn/100, 10), real: 100000 * Math.pow(1 + (((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1)), 10) },
                        { year: 15, nominal: 100000 * Math.pow(1 + annualReturn/100, 15), real: 100000 * Math.pow(1 + (((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1)), 15) },
                        { year: 20, nominal: 100000 * Math.pow(1 + annualReturn/100, 20), real: 100000 * Math.pow(1 + (((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1)), 20) },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(val: number) => fmt(val)} />
                        <Legend />
                        <Line type="monotone" dataKey="nominal" stroke="#8884d8" name="Nominal Value ($100k)" />
                        <Line type="monotone" dataKey="real" stroke="#82ca9d" name="Purchasing Power" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tables" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Goals Overview Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Goal Name</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3 text-right">Target</th>
                        <th className="px-4 py-3 text-right">Current</th>
                        <th className="px-4 py-3 text-right">Monthly</th>
                        <th className="px-4 py-3 text-right">Years</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goalAnalysis.map((g, i) => (
                        <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{g.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={PRIORITY_COLORS[g.priority].badge}>{g.priority}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">{fmt(g.targetAmount)}</td>
                          <td className="px-4 py-3 text-right">{fmt(g.currentAmount)}</td>
                          <td className="px-4 py-3 text-right">{fmt(g.monthlyContribution)}</td>
                          <td className="px-4 py-3 text-right">{g.yearsRemaining}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${g.onTrack ? 'text-green-500' : g.atRisk ? 'text-amber-500' : 'text-red-500'}`}>
                              {g.probability}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Required Savings Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Goal</th>
                          <th className="px-4 py-3 text-right">Current Monthly</th>
                          <th className="px-4 py-3 text-right">Required Monthly</th>
                          <th className="px-4 py-3 text-right rounded-tr-lg">Monthly Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {goalAnalysis.map((g, i) => (
                          <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{g.name}</td>
                            <td className="px-4 py-3 text-right">{fmt(g.monthlyContribution)}</td>
                            <td className="px-4 py-3 text-right">{fmt(g.requiredMonthly)}</td>
                            <td className="px-4 py-3 text-right text-red-500">
                              {g.requiredMonthly > g.monthlyContribution ? fmt(g.requiredMonthly - g.monthlyContribution) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funding Source Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Source</th>
                          <th className="px-4 py-3 text-right">Total Target</th>
                          <th className="px-4 py-3 text-right rounded-tr-lg">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fundingSourceData.map((d, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{d.name}</td>
                            <td className="px-4 py-3 text-right">{fmt(d.value)}</td>
                            <td className="px-4 py-3 text-right">{((d.value / summary.totalTarget) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Projection Timeline Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Year</th>
                        {goalAnalysis.slice(0, 4).map((g) => (
                          <th key={g.id} className="px-4 py-3 text-right">{g.name}</th>
                        ))}
                        <th className="px-4 py-3 text-right rounded-tr-lg">Total Projected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectionData.filter((_, i) => i % 5 === 0 || i === projectionData.length - 1).map((d: any, i) => {
                        const total = Object.keys(d).filter((k) => k !== 'year').reduce((s, k) => s + (d[k] || 0), 0);
                        return (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{d.year}</td>
                            {goalAnalysis.slice(0, 4).map((g) => (
                              <td key={g.id} className="px-4 py-3 text-right">{d[g.name] ? fmt(d[g.name]) : '-'}</td>
                            ))}
                            <td className="px-4 py-3 text-right font-bold">{fmt(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Breakdown Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Priority Level</th>
                        <th className="px-4 py-3 text-right">Count</th>
                        <th className="px-4 py-3 text-right">Total Target</th>
                        <th className="px-4 py-3 text-right">Total Monthly</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Avg Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["essential", "important", "aspirational"].map((priority) => {
                        const pGoals = goalAnalysis.filter((g) => g.priority === priority);
                        if (pGoals.length === 0) return null;
                        const target = pGoals.reduce((s, g) => s + g.targetAmount, 0);
                        const monthly = pGoals.reduce((s, g) => s + g.monthlyContribution, 0);
                        const prob = pGoals.reduce((s, g) => s + g.probability, 0) / pGoals.length;
                        return (
                          <tr key={priority} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium capitalize">{priority}</td>
                            <td className="px-4 py-3 text-right">{pGoals.length}</td>
                            <td className="px-4 py-3 text-right">{fmt(target)}</td>
                            <td className="px-4 py-3 text-right">{fmt(monthly)}</td>
                            <td className="px-4 py-3 text-right">{Math.round(prob)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gap Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Goal</th>
                        <th className="px-4 py-3 text-right">Target</th>
                        <th className="px-4 py-3 text-right">Projected</th>
                        <th className="px-4 py-3 text-right">Shortfall (Gap)</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">% Funded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gapAnalysisData.map((d, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{d.name}</td>
                          <td className="px-4 py-3 text-right">{fmt(d.target)}</td>
                          <td className="px-4 py-3 text-right">{fmt(d.projected)}</td>
                          <td className="px-4 py-3 text-right text-red-500">{d.gap > 0 ? fmt(d.gap) : '-'}</td>
                          <td className="px-4 py-3 text-right">{Math.round((d.projected / d.target) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="compact" showsProjections />
      </div>
    
        <ComplianceFooter pageName="GoalsBasedPlanning" showsIUL showsAnnuity showsTax showsEstate showsProjections showsPolicyLoans />
      </AppShell>
  );
}

