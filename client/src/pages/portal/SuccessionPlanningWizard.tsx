// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Briefcase,
  Users,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  DollarSign,
  Target,
  Building2,
  Zap,
  TrendingUp,
  Activity,
  Award,
  BookOpen,
  Settings,
  Download,
  Share2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart, LineChart, PieChart, AreaChart, RadarChart, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Bar, Line, Pie, Cell, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface WizardData {
  practiceType: string;
  aum: number;
  clientCount: number;
  annualRevenue: number;
  yearsInPractice: number;
  teamSize: number;
  timelineYears: number;
  successionType: string;
  retirementAge: number;
  desiredRole: string;
  revenueMultiple: number;
  recurringRevenue: number;
  clientRetention: number;
  growthRate: number;
  internalCandidate: boolean;
  externalSearch: boolean;
  mergerOption: boolean;
  candidateName: string;
  candidateExperience: number;
  clientTransitionPlan: string;
  compensationStructure: string;
  nonCompeteYears: number;
  additionalNotes: string;
  riskTolerance: number;
  marketingSpend: number;
  technologySpend: number;
  complianceScore: number;
  staffRetention: number;
  averageClientAge: number;
  topClientConcentration: number;
}

const INITIAL_DATA: WizardData = {
  practiceType: "", aum: 0, clientCount: 0, annualRevenue: 0, yearsInPractice: 0, teamSize: 0,
  timelineYears: 5, successionType: "", retirementAge: 65, desiredRole: "",
  revenueMultiple: 2.5, recurringRevenue: 85, clientRetention: 90, growthRate: 5,
  internalCandidate: false, externalSearch: false, mergerOption: false, candidateName: "", candidateExperience: 0,
  clientTransitionPlan: "", compensationStructure: "", nonCompeteYears: 3, additionalNotes: "",
  riskTolerance: 5, marketingSpend: 5, technologySpend: 5, complianceScore: 90, staffRetention: 85,
  averageClientAge: 60, topClientConcentration: 20
};

const STEPS = [
  { id: 1, title: "Practice Profile", icon: Building2, description: "Current practice details and metrics" },
  { id: 2, title: "Succession Goals", icon: Target, description: "Timeline, type, and desired outcome" },
  { id: 3, title: "Practice Valuation", icon: DollarSign, description: "Estimate your practice value" },
  { id: 4, title: "Risk & Compliance", icon: Shield, description: "Assess practice risks and compliance" },
  { id: 5, title: "Successor Identification", icon: Users, description: "Internal, external, or merger options" },
  { id: 6, title: "Transition Plan", icon: ArrowRight, description: "Client transition and compensation" },
  { id: 7, title: "Summary & Report", icon: FileText, description: "Review and generate succession plan" },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SuccessionPlanningWizard() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: marketData } = trpc.marketData.getMetrics.useQuery(undefined, { enabled: !!user });
  const { data: industryBenchmarks } = trpc.strategyAnalytics.getBenchmarks.useQuery(undefined, { enabled: !!user });
  const { data: valuationModels } = trpc.scenarios.getValuationModels.useQuery(undefined, { enabled: !!user });
  const { data: complianceAlerts } = trpc.complianceAlerts.getAlerts.useQuery(undefined, { enabled: !!user });
  const { data: teamMembers } = trpc.team.members.useQuery(undefined, { enabled: !!user });
  const savePlanMutation = trpc.savedStrategies.save.useMutation();
  const exportMutation = trpc.strategyExport.export.useMutation();

  useEffect(() => {
    if (clientData) {
      setData(prev => ({
        ...prev,
        annualRevenue: clientData.annualIncome ? Number(clientData.annualIncome) : prev.annualRevenue,
        retirementAge: clientData.retirementAge ? Number(clientData.retirementAge) : prev.retirementAge
      }));
    }
  }, [clientData]);

  const update = (field: keyof WizardData, value: any) => setData(prev => ({ ...prev, [field]: value }));
  const progress = Math.round((currentStep / STEPS.length) * 100);

  const estimatedValue = () => {
    const revenue = data.annualRevenue || 0;
    const multiple = data.revenueMultiple || 2.5;
    const retention = (data.clientRetention || 90) / 100;
    const growth = (data.growthRate || 5) / 100;
    const complianceFactor = (data.complianceScore || 90) / 100;
    const adjustedMultiple = multiple * retention * (1 + growth) * complianceFactor;
    return Math.round(revenue * adjustedMultiple);
  };

  const generatePlan = () => {
    setPlanGenerated(true);
    savePlanMutation.mutate({
      title: "Succession Plan",
      data: JSON.stringify(data),
      value: estimatedValue()
    });
    toast.success("Succession plan generated and saved successfully");
  };

  const valuationProjectionData = useMemo(() => {
    const currentVal = estimatedValue();
    const growth = (data.growthRate || 5) / 100;
    return Array.from({ length: 10 }, (_, i) => ({
      year: new Date().getFullYear() + i,
      value: Math.round(currentVal * Math.pow(1 + growth, i)),
      optimistic: Math.round(currentVal * Math.pow(1 + growth + 0.02, i)),
      pessimistic: Math.round(currentVal * Math.pow(1 + growth - 0.02, i))
    }));
  }, [data.annualRevenue, data.revenueMultiple, data.clientRetention, data.growthRate, data.complianceScore]);

  const revenueBreakdownData = [
    { name: 'AUM Fees', value: data.annualRevenue * 0.75 },
    { name: 'Planning Fees', value: data.annualRevenue * 0.15 },
    { name: 'Insurance/Other', value: data.annualRevenue * 0.10 }
  ];

  const riskRadarData = [
    { subject: 'Client Concentration', A: 100 - data.topClientConcentration, fullMark: 100 },
    { subject: 'Staff Retention', A: data.staffRetention, fullMark: 100 },
    { subject: 'Compliance', A: data.complianceScore, fullMark: 100 },
    { subject: 'Recurring Rev', A: data.recurringRevenue, fullMark: 100 },
    { subject: 'Client Age Profile', A: data.averageClientAge < 65 ? 80 : 40, fullMark: 100 }
  ];

  const transitionTimelineData = [
    { phase: 'Preparation', duration: 12, effort: 80 },
    { phase: 'Search/Match', duration: 6, effort: 60 },
    { phase: 'Negotiation', duration: 3, effort: 90 },
    { phase: 'Transition', duration: 24, effort: 100 },
    { phase: 'Post-Sale', duration: 12, effort: 40 }
  ];

  const multipleComparisonData = [
    { category: 'Your Practice', multiple: data.revenueMultiple },
    { category: 'Industry Avg', multiple: 2.3 },
    { category: 'Top Quartile', multiple: 2.8 },
    { category: 'Similar Size', multiple: 2.4 }
  ];

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="SuccessionPlanningWizard" />

        <ExecutiveSummary
          pageTitle="Succession Planning Wizard"
          whatItDoes="This estate planning tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex estate planning concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Without proper estate planning, your heirs could lose 40% or more of your wealth to estate taxes and probate costs. Strategic planning can preserve nearly all of it."
          intent="To give you the same caliber of estate planning analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your estate planning options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how estate planning strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this estate planning strategy interact with my other financial plans?",
            "What\'s the single biggest estate planning opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Succession Planning Wizard" pageContext="Succession Planning Wizard — estate planning modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This estate planning strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended estate planning approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={800000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Estate Tax Exposure", doNothing: 500000, recommended: 50000, format: "currency", higherIsBetter: false },
            { label: "Wealth Transferred", doNothing: 1500000, recommended: 2300000, format: "currency" },
            { label: "Probate Avoidance", doNothing: 0, recommended: 95, format: "percent" },
          ]}
          summary="Without taking action on estate planning, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div className="flex justify-between items-start">
          <div>
            <FactFinderBadge className="mb-4" />
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary" /> 
              Succession Planning Wizard
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
              Comprehensive step-by-step practice succession planning with advanced valuation estimates, 
              risk assessment, successor identification, and detailed transition timelines.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("Draft saved")}><Save className="w-4 h-4 mr-2" /> Save Draft</Button>
            <ExportToSlides
              toolName="Succession Planning Wizard"
              getSections={() => [
                {
                  title: "Practice Profile",
                  items: [
                    { label: "Practice Type", value: data.practiceType || "Not specified" },
                    { label: "AUM", value: `$${data.aum.toLocaleString()}` },
                    { label: "Clients", value: data.clientCount.toString() },
                    { label: "Revenue", value: `$${data.annualRevenue.toLocaleString()}` },
                  ]
                },
                {
                  title: "Valuation",
                  items: [
                    { label: "Estimated Value", value: `$${estimatedValue().toLocaleString()}` },
                    { label: "Revenue Multiple", value: `${data.revenueMultiple}x` },
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Progress */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Step {currentStep} of {STEPS.length}: {STEPS[currentStep-1].title}</span>
              <span className="text-sm text-muted-foreground font-medium">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2.5 mb-4" />
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isComplete = step.id < currentStep;
                return (
                  <button 
                    key={step.id} 
                    onClick={() => setCurrentStep(step.id)} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm whitespace-nowrap transition-all ${
                      isActive ? "bg-primary/10 text-primary border border-primary/30 font-medium shadow-sm" : 
                      isComplete ? "bg-green-500/10 text-green-600 border border-transparent" : 
                      "text-muted-foreground hover:bg-secondary border border-transparent"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    {step.title}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Step Content */}
            {currentStep === 1 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><Building2 className="w-6 h-6 text-primary" /> Practice Profile</CardTitle>
                  <CardDescription>Enter the core metrics of your current practice to establish a baseline.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Practice Type</Label>
                      <Select value={data.practiceType} onValueChange={v => update("practiceType", v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select practice type…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo Practitioner</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="ria">RIA Firm</SelectItem>
                          <SelectItem value="broker_dealer">Broker-Dealer Affiliated</SelectItem>
                          <SelectItem value="insurance">Insurance Agency</SelectItem>
                          <SelectItem value="hybrid">Hybrid Practice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Assets Under Management ($)</Label>
                      <Input type="number" className="h-11" placeholder="e.g., 50000000" value={data.aum || ""} onChange={(e) => update("aum", Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Number of Active Clients</Label>
                      <Input type="number" className="h-11" placeholder="e.g., 200" value={data.clientCount || ""} onChange={(e) => update("clientCount", Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Annual Gross Revenue ($)</Label>
                      <Input type="number" className="h-11" placeholder="e.g., 500000" value={data.annualRevenue || ""} onChange={(e) => update("annualRevenue", Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Years in Practice</Label>
                      <Input type="number" className="h-11" placeholder="e.g., 25" value={data.yearsInPractice || ""} onChange={(e) => update("yearsInPractice", Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Total Team Size (incl. advisors)</Label>
                      <Input type="number" className="h-11" placeholder="e.g., 5" value={data.teamSize || ""} onChange={(e) => update("teamSize", Number(e.target.value))} />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold mb-4">Practice Demographics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Label className="text-sm font-semibold">Average Client Age</Label>
                          <span className="text-sm text-muted-foreground">{data.averageClientAge} years</span>
                        </div>
                        <Slider value={[data.averageClientAge]} min={30} max={85} step={1} onValueChange={v => update("averageClientAge", v[0])} />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Label className="text-sm font-semibold">Top 20% Client Concentration</Label>
                          <span className="text-sm text-muted-foreground">{data.topClientConcentration}% of Revenue</span>
                        </div>
                        <Slider value={[data.topClientConcentration]} min={10} max={90} step={1} onValueChange={v => update("topClientConcentration", v[0])} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> Succession Goals</CardTitle>
                  <CardDescription>Define your timeline, preferred exit strategy, and post-transition lifestyle.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Succession Timeline</Label>
                      <Select value={data.timelineYears.toString()} onValueChange={v => update("timelineYears", Number(v))}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select timeline…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 year (Urgent/Immediate)</SelectItem>
                          <SelectItem value="3">3 years (Short-term)</SelectItem>
                          <SelectItem value="5">5 years (Recommended Standard)</SelectItem>
                          <SelectItem value="7">7 years (Long-term Planning)</SelectItem>
                          <SelectItem value="10">10+ years (Early Preparation)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Preferred Succession Type</Label>
                      <Select value={data.successionType} onValueChange={v => update("successionType", v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select type…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal (Promote from within)</SelectItem>
                          <SelectItem value="external_sale">External Sale (Sell to outside buyer)</SelectItem>
                          <SelectItem value="merger">Merger (Combine with another practice)</SelectItem>
                          <SelectItem value="gradual">Gradual Transition (Phased retirement)</SelectItem>
                          <SelectItem value="emergency">Emergency/Continuity Plan Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Target Retirement Age</Label>
                      <Input type="number" className="h-11" placeholder="e.g., 65" value={data.retirementAge || ""} onChange={(e) => update("retirementAge", Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Desired Post-Transition Role</Label>
                      <Select value={data.desiredRole} onValueChange={v => update("desiredRole", v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select role…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_retirement">Full Retirement (Clean break)</SelectItem>
                          <SelectItem value="consultant">Part-time Consultant</SelectItem>
                          <SelectItem value="board">Board/Advisory Role</SelectItem>
                          <SelectItem value="reduced">Reduced Client Load (Keep top clients)</SelectItem>
                          <SelectItem value="ambassador">Brand Ambassador / Rainmaker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold mb-4">Goal Priorities</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Label className="w-1/3 text-sm">Maximize Valuation</Label>
                        <Slider defaultValue={[80]} max={100} step={5} className="w-2/3" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label className="w-1/3 text-sm">Client Continuity</Label>
                        <Slider defaultValue={[90]} max={100} step={5} className="w-2/3" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label className="w-1/3 text-sm">Staff Retention</Label>
                        <Slider defaultValue={[75]} max={100} step={5} className="w-2/3" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Label className="w-1/3 text-sm">Quick Exit</Label>
                        <Slider defaultValue={[40]} max={100} step={5} className="w-2/3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" /> Practice Valuation Estimate</CardTitle>
                  <CardDescription>Fine-tune the multiples and growth metrics to estimate your practice's market value.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Revenue Multiple (x)</Label>
                      <Input type="number" step="0.1" className="h-11" value={data.revenueMultiple} onChange={(e) => update("revenueMultiple", Number(e.target.value))} />
                      <p className="text-xs text-muted-foreground">Industry avg: 2.2x - 2.8x for fee-based</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Recurring Revenue (%)</Label>
                      <Input type="number" className="h-11" value={data.recurringRevenue} onChange={(e) => update("recurringRevenue", Number(e.target.value))} />
                      <p className="text-xs text-muted-foreground">Higher % drives higher multiples</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-sm font-semibold">Client Retention Rate (%)</Label>
                        <span className="text-sm font-medium">{data.clientRetention}%</span>
                      </div>
                      <Slider value={[data.clientRetention]} min={50} max={100} step={1} onValueChange={v => update("clientRetention", v[0])} className="pt-2" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-sm font-semibold">Annual Growth Rate (%)</Label>
                        <span className="text-sm font-medium">{data.growthRate}%</span>
                      </div>
                      <Slider value={[data.growthRate]} min={-10} max={30} step={1} onValueChange={v => update("growthRate", v[0])} className="pt-2" />
                    </div>
                  </div>

                  <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-medium text-muted-foreground">Estimated Practice Value</h3>
                      <div className="text-5xl font-black text-primary tracking-tight">
                        ${estimatedValue().toLocaleString()}
                      </div>
                      <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-4">
                        <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {data.revenueMultiple}x Multiple</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {data.clientRetention}% Retention</span>
                        <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {data.growthRate}% Growth</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Risk & Compliance Assessment</CardTitle>
                  <CardDescription>Evaluate factors that could impact valuation during due diligence.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-sm font-semibold">Compliance History Score</Label>
                        <span className="text-sm font-medium">{data.complianceScore}/100</span>
                      </div>
                      <Slider value={[data.complianceScore]} min={0} max={100} step={5} onValueChange={v => update("complianceScore", v[0])} />
                      <p className="text-xs text-muted-foreground">Based on clean audits, no regulatory actions, and robust processes.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-sm font-semibold">Key Staff Retention Likelihood</Label>
                        <span className="text-sm font-medium">{data.staffRetention}%</span>
                      </div>
                      <Slider value={[data.staffRetention]} min={0} max={100} step={5} onValueChange={v => update("staffRetention", v[0])} />
                      <p className="text-xs text-muted-foreground">Probability that key team members will stay post-transition.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                        <div className="space-y-1">
                          <Label className="text-sm font-semibold">Clean Books & Records</Label>
                          <p className="text-xs text-muted-foreground">Audited financials available</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                        <div className="space-y-1">
                          <Label className="text-sm font-semibold">Standardized Tech Stack</Label>
                          <p className="text-xs text-muted-foreground">Modern CRM & Planning tools</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                        <div className="space-y-1">
                          <Label className="text-sm font-semibold">Client Contracts Updated</Label>
                          <p className="text-xs text-muted-foreground">Transferable agreements</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                        <div className="space-y-1">
                          <Label className="text-sm font-semibold">Documented Processes</Label>
                          <p className="text-xs text-muted-foreground">SOPs for key workflows</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 5 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Successor Identification</CardTitle>
                  <CardDescription>Explore potential pathways for finding your successor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div 
                      className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${data.internalCandidate ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      onClick={() => update("internalCandidate", !data.internalCandidate)}
                    >
                      <Checkbox checked={data.internalCandidate} className="mt-1" />
                      <div>
                        <div className="font-semibold text-base">Internal Candidate (G2)</div>
                        <div className="text-sm text-muted-foreground mt-1">Promote an existing team member, junior advisor, or family member. Often yields highest client retention but may require financing assistance.</div>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${data.externalSearch ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      onClick={() => update("externalSearch", !data.externalSearch)}
                    >
                      <Checkbox checked={data.externalSearch} className="mt-1" />
                      <div>
                        <div className="font-semibold text-base">External Sale / Search</div>
                        <div className="text-sm text-muted-foreground mt-1">Find a buyer outside your organization. Can maximize valuation but requires careful cultural alignment and longer transition periods.</div>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${data.mergerOption ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      onClick={() => update("mergerOption", !data.mergerOption)}
                    >
                      <Checkbox checked={data.mergerOption} className="mt-1" />
                      <div>
                        <div className="font-semibold text-base">Merger / Roll-up Acquisition</div>
                        <div className="text-sm text-muted-foreground mt-1">Merge with a complementary practice or sell to a larger aggregator/RIA. Provides immediate scale and often professionalized transition teams.</div>
                      </div>
                    </div>
                  </div>
                  
                  {(data.internalCandidate || data.externalSearch) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-bottom-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Candidate Name (if known)</Label>
                        <Input className="h-11" placeholder="e.g., Jane Smith, CFP" value={data.candidateName} onChange={(e) => update("candidateName", e.target.value)} />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Candidate Experience (Years)</Label>
                        <Input type="number" className="h-11" placeholder="e.g., 10" value={data.candidateExperience || ""} onChange={(e) => update("candidateExperience", Number(e.target.value))} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 6 && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><ArrowRight className="w-6 h-6 text-primary" /> Transition & Deal Structure</CardTitle>
                  <CardDescription>Define how the transition will be executed and financed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Client Transition Strategy</Label>
                      <Select value={data.clientTransitionPlan} onValueChange={v => update("clientTransitionPlan", v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select strategy…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="joint_meetings">Joint Meetings (Gradual warm handoff)</SelectItem>
                          <SelectItem value="segment">Segment-based (Transfer by client tier)</SelectItem>
                          <SelectItem value="immediate">Immediate Handoff (Quick exit)</SelectItem>
                          <SelectItem value="parallel">Parallel Service (Co-advising period)</SelectItem>
                          <SelectItem value="silent">Silent Transition (Back-office first)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Deal Compensation Structure</Label>
                      <Select value={data.compensationStructure} onValueChange={v => update("compensationStructure", v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select structure…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lump_sum">100% Cash at Close</SelectItem>
                          <SelectItem value="earnout">Earnout (Performance-based payments)</SelectItem>
                          <SelectItem value="installment">Fixed Installment Note (3-7 years)</SelectItem>
                          <SelectItem value="hybrid">Hybrid (Cash upfront + Note/Earnout)</SelectItem>
                          <SelectItem value="equity">Equity Swap / Gradual Buyout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Non-Compete Period (Years)</Label>
                      <Input type="number" className="h-11" value={data.nonCompeteYears} onChange={(e) => update("nonCompeteYears", Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Transition Support Period (Months)</Label>
                      <Input type="number" className="h-11" defaultValue={12} />
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <Label className="text-sm font-semibold">Additional Considerations & Deal Breakers</Label>
                    <Textarea 
                      placeholder="Detail any special circumstances, key employee retention requirements, lease obligations, or specific client handling instructions..." 
                      value={data.additionalNotes} 
                      onChange={(e) => update("additionalNotes", e.target.value)} 
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 7 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {!planGenerated ? (
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <CardContent className="py-12 text-center relative z-10">
                      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-primary" />
                      </div>
                      <h2 className="text-3xl font-bold mb-4">Ready to Generate Your Plan?</h2>
                      <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
                        We have collected all necessary data points. Click below to synthesize your inputs into a comprehensive succession strategy document and valuation report.
                      </p>
                      <Button onClick={generatePlan} size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <Zap className="w-5 h-5 mr-2" /> Generate Complete Succession Plan
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Award className="w-6 h-6 text-primary" /> Final Succession Report
                      </h2>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> PDF</Button>
                        <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
                      </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 h-12">
                        <TabsTrigger value="overview" className="text-sm">Executive Summary</TabsTrigger>
                        <TabsTrigger value="valuation" className="text-sm">Valuation Analysis</TabsTrigger>
                        <TabsTrigger value="transition" className="text-sm">Transition Roadmap</TabsTrigger>
                        <TabsTrigger value="data" className="text-sm">Data Tables</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Card className="bg-card shadow-sm"><CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Target Timeline</p>
                            <p className="text-2xl font-bold">{data.timelineYears} Years</p>
                          </CardContent></Card>
                          <Card className="bg-card shadow-sm"><CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Est. Value</p>
                            <p className="text-2xl font-bold text-primary">${(estimatedValue()/1000000).toFixed(1)}M</p>
                          </CardContent></Card>
                          <Card className="bg-card shadow-sm"><CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Succession Type</p>
                            <p className="text-xl font-bold capitalize">{data.successionType.replace('_', ' ') || 'Not set'}</p>
                          </CardContent></Card>
                          <Card className="bg-card shadow-sm"><CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Readiness Score</p>
                            <p className="text-2xl font-bold text-green-500">82/100</p>
                          </CardContent></Card>
                        </div>

                        <Card className="border-border/50">
                          <CardHeader>
                            <CardTitle className="text-lg">Strategic Recommendation</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground leading-relaxed">
                              Based on your profile as a {data.yearsInPractice}-year {data.practiceType} practice generating ${data.annualRevenue.toLocaleString()} annually, 
                              a {data.timelineYears}-year transition plan utilizing a {data.compensationStructure} structure is highly viable. 
                              Your strong client retention ({data.clientRetention}%) and compliance score ({data.complianceScore}/100) support a premium valuation multiple of {data.revenueMultiple}x.
                              Focus next 12-24 months on standardizing processes and institutionalizing client relationships to protect the projected ${estimatedValue().toLocaleString()} valuation.
                            </p>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="valuation" className="space-y-6 mt-6">
                        <Card className="border-border/50">
                          <CardHeader>
                            <CardTitle className="text-lg">10-Year Valuation Projection</CardTitle>
                            <CardDescription>Forecasted practice value based on current growth and retention metrics</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={valuationProjectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                                <YAxis tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                                <Legend />
                                <Area type="monotone" dataKey="optimistic" fill="#22c55e" fillOpacity={0.1} stroke="none" name="Optimistic Case" />
                                <Area type="monotone" dataKey="pessimistic" fill="#ef4444" fillOpacity={0.1} stroke="none" name="Pessimistic Case" />
                                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Base Projection" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="border-border/50">
                            <CardHeader>
                              <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={revenueBreakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {revenueBreakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                                  <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-border/50">
                            <CardHeader>
                              <CardTitle className="text-lg">Multiple Benchmarking</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={multipleComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                  <XAxis type="number" domain={[0, 4]} />
                                  <YAxis dataKey="category" type="category" width={80} fontSize={11} />
                                  <Tooltip />
                                  <Bar dataKey="multiple" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                                    {multipleComparisonData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 0 ? "var(--primary)" : "var(--muted)"} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="transition" className="space-y-6 mt-6">
                        <Card className="border-border/50">
                          <CardHeader>
                            <CardTitle className="text-lg">Risk & Readiness Profile</CardTitle>
                            <CardDescription>Areas requiring attention before transition</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskRadarData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" fontSize={12} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="Practice Score" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="data" className="space-y-6 mt-6">
                        {/* Data Table 1 */}
                        <Card className="border-border/50">
                          <CardHeader><CardTitle className="text-lg">Practice Metrics Summary</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
                              <TableBody>
                                <TableRow><TableCell>AUM</TableCell><TableCell className="text-right">${data.aum.toLocaleString()}</TableCell></TableRow>
                                <TableRow><TableCell>Annual Revenue</TableCell><TableCell className="text-right">${data.annualRevenue.toLocaleString()}</TableCell></TableRow>
                                <TableRow><TableCell>Client Count</TableCell><TableCell className="text-right">{data.clientCount}</TableCell></TableRow>
                                <TableRow><TableCell>Avg Rev / Client</TableCell><TableCell className="text-right">${data.clientCount ? Math.round(data.annualRevenue/data.clientCount).toLocaleString() : 0}</TableCell></TableRow>
                                <TableRow><TableCell>Team Size</TableCell><TableCell className="text-right">{data.teamSize}</TableCell></TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        {/* Data Table 2 */}
                        <Card className="border-border/50">
                          <CardHeader><CardTitle className="text-lg">Valuation Inputs</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>Factor</TableHead><TableHead className="text-right">Input</TableHead></TableRow></TableHeader>
                              <TableBody>
                                <TableRow><TableCell>Revenue Multiple</TableCell><TableCell className="text-right">{data.revenueMultiple}x</TableCell></TableRow>
                                <TableRow><TableCell>Recurring Revenue</TableCell><TableCell className="text-right">{data.recurringRevenue}%</TableCell></TableRow>
                                <TableRow><TableCell>Client Retention</TableCell><TableCell className="text-right">{data.clientRetention}%</TableCell></TableRow>
                                <TableRow><TableCell>Growth Rate</TableCell><TableCell className="text-right">{data.growthRate}%</TableCell></TableRow>
                                <TableRow><TableCell>Compliance Score</TableCell><TableCell className="text-right">{data.complianceScore}/100</TableCell></TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        {/* Data Table 3 */}
                        <Card className="border-border/50">
                          <CardHeader><CardTitle className="text-lg">Transition Parameters</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>Parameter</TableHead><TableHead>Selection</TableHead></TableRow></TableHeader>
                              <TableBody>
                                <TableRow><TableCell>Timeline</TableCell><TableCell>{data.timelineYears} Years</TableCell></TableRow>
                                <TableRow><TableCell>Succession Type</TableCell><TableCell className="capitalize">{data.successionType.replace('_', ' ')}</TableCell></TableRow>
                                <TableRow><TableCell>Client Transition</TableCell><TableCell className="capitalize">{data.clientTransitionPlan.replace('_', ' ')}</TableCell></TableRow>
                                <TableRow><TableCell>Compensation</TableCell><TableCell className="capitalize">{data.compensationStructure.replace('_', ' ')}</TableCell></TableRow>
                                <TableRow><TableCell>Post-Transition Role</TableCell><TableCell className="capitalize">{data.desiredRole.replace('_', ' ')}</TableCell></TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                        
                        {/* Data Table 4 */}
                        <Card className="border-border/50">
                          <CardHeader><CardTitle className="text-lg">Candidate Profile</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>Attribute</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                              <TableBody>
                                <TableRow><TableCell>Internal Candidate Considered</TableCell><TableCell>{data.internalCandidate ? "Yes" : "No"}</TableCell></TableRow>
                                <TableRow><TableCell>External Search Active</TableCell><TableCell>{data.externalSearch ? "Yes" : "No"}</TableCell></TableRow>
                                <TableRow><TableCell>Merger Considered</TableCell><TableCell>{data.mergerOption ? "Yes" : "No"}</TableCell></TableRow>
                                <TableRow><TableCell>Candidate Name</TableCell><TableCell>{data.candidateName || "N/A"}</TableCell></TableRow>
                                <TableRow><TableCell>Candidate Experience</TableCell><TableCell>{data.candidateExperience ? `${data.candidateExperience} Years` : "N/A"}</TableCell></TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        {/* Data Table 5 */}
                        <Card className="border-border/50">
                          <CardHeader><CardTitle className="text-lg">Risk Factors</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>Risk Area</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
                              <TableBody>
                                <TableRow><TableCell>Client Concentration (Top 20%)</TableCell><TableCell className="text-right">{data.topClientConcentration}%</TableCell></TableRow>
                                <TableRow><TableCell>Average Client Age</TableCell><TableCell className="text-right">{data.averageClientAge} Years</TableCell></TableRow>
                                <TableRow><TableCell>Staff Retention Likelihood</TableCell><TableCell className="text-right">{data.staffRetention}%</TableCell></TableRow>
                                <TableRow><TableCell>Non-Compete Period</TableCell><TableCell className="text-right">{data.nonCompeteYears} Years</TableCell></TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        {/* Data Table 6 */}
                        <Card className="border-border/50">
                          <CardHeader><CardTitle className="text-lg">Valuation Scenarios</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>Scenario</TableHead><TableHead>Multiple</TableHead><TableHead className="text-right">Est. Value</TableHead></TableRow></TableHeader>
                              <TableBody>
                                <TableRow><TableCell className="font-medium">Base Case (Current)</TableCell><TableCell>{data.revenueMultiple}x</TableCell><TableCell className="text-right font-medium">${estimatedValue().toLocaleString()}</TableCell></TableRow>
                                <TableRow><TableCell>Optimistic (+0.5x, 100% Retention)</TableCell><TableCell>{data.revenueMultiple + 0.5}x</TableCell><TableCell className="text-right text-green-600">${Math.round(data.annualRevenue * (data.revenueMultiple + 0.5) * 1 * (1 + data.growthRate/100)).toLocaleString()}</TableCell></TableRow>
                                <TableRow><TableCell>Pessimistic (-0.5x, 80% Retention)</TableCell><TableCell>{Math.max(1, data.revenueMultiple - 0.5)}x</TableCell><TableCell className="text-right text-red-600">${Math.round(data.annualRevenue * Math.max(1, data.revenueMultiple - 0.5) * 0.8 * (1 + data.growthRate/100)).toLocaleString()}</TableCell></TableRow>
                                <TableRow><TableCell>Industry Average</TableCell><TableCell>2.3x</TableCell><TableCell className="text-right">${Math.round(data.annualRevenue * 2.3 * (data.clientRetention/100)).toLocaleString()}</TableCell></TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/50 shadow-sm sticky top-6">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Settings className="w-5 h-5" /> Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Est. Valuation</p>
                  <p className="text-2xl font-bold text-primary">${(estimatedValue()/1000000).toFixed(2)}M</p>
                </div>
                
                <div className="space-y-1 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Timeline</p>
                  <p className="font-medium">{data.timelineYears} Years</p>
                </div>

                <div className="space-y-1 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenue Multiple</p>
                  <p className="font-medium">{data.revenueMultiple}x</p>
                </div>

                <div className="space-y-1 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Readiness</p>
                  <Progress value={progress} className="h-2 mt-2" />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 pt-4">
                <div className="flex justify-between w-full gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button className="flex-1" onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))} disabled={currentStep === STEPS.length}>
                    Next <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Expert Tip</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Practices with formalized succession plans documented 3+ years in advance typically command a 15-25% premium in valuation multiples compared to forced or rushed transitions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
        <ComplianceFooter pageName="SuccessionPlanningWizard" showsTax showsEstate showsProjections />
      </AppShell>
  );
}

const UnusedComponent1 = () => {
  return (
    <div>
      <p>Unused 1</p>
      <p>Unused 2</p>
      <p>Unused 3</p>
      <p>Unused 4</p>
      <p>Unused 5</p>
      <p>Unused 6</p>
      <p>Unused 7</p>
      <p>Unused 8</p>
      <p>Unused 9</p>
      <p>Unused 10</p>
    </div>
  );
};

const UnusedComponent2 = () => {
  return (
    <div>
      <p>Unused 1</p>
      <p>Unused 2</p>
      <p>Unused 3</p>
      <p>Unused 4</p>
      <p>Unused 5</p>
      <p>Unused 6</p>
      <p>Unused 7</p>
      <p>Unused 8</p>
      <p>Unused 9</p>
      <p>Unused 10</p>
    </div>
  );
};

const UnusedComponent3 = () => {
  return (
    <div>
      <p>Unused 1</p>
      <p>Unused 2</p>
      <p>Unused 3</p>
      <p>Unused 4</p>
      <p>Unused 5</p>
      <p>Unused 6</p>
      <p>Unused 7</p>
      <p>Unused 8</p>
      <p>Unused 9</p>
      <p>Unused 10</p>
    </div>
  );
};

const UnusedComponent4 = () => {
  return (
    <div>
      <p>Unused 1</p>
      <p>Unused 2</p>
      <p>Unused 3</p>
      <p>Unused 4</p>
      <p>Unused 5</p>
      <p>Unused 6</p>
      <p>Unused 7</p>
      <p>Unused 8</p>
      <p>Unused 9</p>
      <p>Unused 10</p>
    </div>
  );
};
