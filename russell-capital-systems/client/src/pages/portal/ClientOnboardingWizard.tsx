// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { PageInsights } from "@/components/PageInsights";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ComposedChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { NumberInput } from "@/components/NumberInput";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Target,
  Shield,
  TrendingUp,
  User,
  DollarSign,
  Briefcase,
  Heart,
  ClipboardCheck,
  Save,
  ArrowRight,
  Trophy,
  Plus,
  X,
  Rocket,
  Layers,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import DepthSelector from "@/components/DepthSelector";
import { ONBOARDING_QUESTIONS, type OnboardingQuestion } from "@/data/onboardingQuestions";
import { useAuth } from "@/_core/hooks/useAuth";

const fmt = (n: number) => `$${n.toLocaleString()}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

const STEPS = [
  { title: "Personal Info", icon: User, description: "About you and your family" },
  { title: "Financial Overview", icon: DollarSign, description: "Income, assets, and debts" },
  { title: "Insurance & Retirement", icon: Briefcase, description: "Existing policies and accounts" },
  { title: "Risk Assessment", icon: Shield, description: "Your risk tolerance profile" },
  { title: "Life Goals", icon: Target, description: "Dream big, plan smart" },
  { title: "Deep-Dive Assessment", icon: Layers, description: "Extended intake questions" },
  { title: "Your Score", icon: Trophy, description: "See your financial score" },
  { title: "Review & Submit", icon: ClipboardCheck, description: "Confirm your information" },
];

const STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const RISK_QUESTIONS = [
  { key: "marketDropReaction", label: "If the market dropped 30%, what would you do?", low: "Sell everything", high: "Buy more aggressively" },
  { key: "timeHorizon", label: "How long until you need this money?", low: "Less than 5 years", high: "30+ years" },
  { key: "incomeStability", label: "How stable is your income?", low: "Very unstable", high: "Rock solid" },
  { key: "investmentExperience", label: "How experienced are you with investing?", low: "Complete beginner", high: "Expert investor" },
  { key: "riskCapacity", label: "Could you afford a 20% portfolio loss?", low: "Absolutely not", high: "Easily" },
  { key: "volatilityComfort", label: "How comfortable are you with portfolio swings?", low: "Hate volatility", high: "Embrace it" },
  { key: "guaranteePreference", label: "How important are guaranteed returns?", low: "Must have guarantees", high: "Don't need them" },
  { key: "growthVsIncome", label: "Do you prefer growth or income?", low: "Income only", high: "Growth only" },
];

const GOAL_CATEGORIES = [{ value: "retirement", label: "Retirement", emoji: "🏖️" },
,
  { value: "travel", label: "Travel & Adventure", emoji: "✈️" },
,
  { value: "education", label: "Education", emoji: "🎓" },
,
  { value: "home_purchase", label: "Home Purchase", emoji: "🏡" },
,
  { value: "debt_free", label: "Debt Freedom", emoji: "🔓" }
];

const LEVEL_EMOJIS = ["🌱", "🧭", "🏗️", "♟️", "📈", "🏆", "🛡️", "🏰", "👑", "⭐"];
const LEVEL_NAMES = ["Starter", "Explorer", "Builder", "Strategist", "Optimizer", "Achiever", "Wealth Guardian", "Legacy Builder", "Financial Master", "Legendary"];

interface WizardForm {
  firstName: string; lastName: string; age: number; email: string; phone: string;
  state: string; filingStatus: "single" | "joint" | "hoh";
  spouseName: string; spouseAge: number; dependents: number;
  annualIncome: number; spouseIncome: number; cashSavings: number;
  taxableInvestments: number; realEstateEquity: number;
  mortgageBalance: number; mortgageRate: number; otherDebt: number; monthlyExpenses: number;
  iraBalance: number; rothBalance: number; k401Balance: number;
  pensionIncome: number; socialSecurityEstimate: number;
  hasLifeInsurance: boolean; lifeInsuranceCv: number; lifeInsuranceDb: number;
  hasAnnuity: boolean; annuityValue: number; hasLTC: boolean;
  marketDropReaction: number; timeHorizon: number; incomeStability: number;
  investmentExperience: number; riskCapacity: number; volatilityComfort: number;
  guaranteePreference: number; growthVsIncome: number;
  retirementAge: number; annualIncomeNeeded: number; legacyGoal: number;
  primaryGoal: string; additionalNotes: string;
}

interface LifeGoalEntry {
  id: string; targetAge: number; category: string; title: string;
  estimatedCost: number; priority: "must_have" | "nice_to_have" | "dream";
}

const DEFAULT_FORM: WizardForm = {
  firstName: "", lastName: "", age: 50, email: "", phone: "", state: "Texas",
  filingStatus: "joint", spouseName: "", spouseAge: 48, dependents: 0,
  annualIncome: 250000, spouseIncome: 0, cashSavings: 100000, taxableInvestments: 200000,
  realEstateEquity: 500000, mortgageBalance: 300000, mortgageRate: 6.5, otherDebt: 0, monthlyExpenses: 12000,
  iraBalance: 800000, rothBalance: 50000, k401Balance: 200000, pensionIncome: 0,
  socialSecurityEstimate: 3500, hasLifeInsurance: false, lifeInsuranceCv: 0, lifeInsuranceDb: 0,
  hasAnnuity: false, annuityValue: 0, hasLTC: false,
  marketDropReaction: 5, timeHorizon: 5, incomeStability: 5, investmentExperience: 5,
  riskCapacity: 5, volatilityComfort: 5, guaranteePreference: 5, growthVsIncome: 5,
  retirementAge: 65, annualIncomeNeeded: 150000, legacyGoal: 2000000,
  primaryGoal: "tax_free_retirement", additionalNotes: "",
};

function getRiskLabel(score: number): string {
  if (score <= 25) return "Conservative";
  if (score <= 40) return "Moderate Conservative";
  if (score <= 60) return "Moderate";
  if (score <= 75) return "Moderate Aggressive";
  return "Aggressive";
}

function getRiskColor(score: number): string {
  if (score <= 25) return "text-blue-400";
  if (score <= 40) return "text-cyan-400";
  if (score <= 60) return "text-[#f0c040]";
  if (score <= 75) return "text-orange-400";
  return "text-red-400";
}

function getScoreLevel(score: number): number {
  const thresholds = [0, 20, 30, 40, 50, 60, 70, 80, 90, 95];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (score >= thresholds[i]) return i + 1;
  }
  return 1;
}

function calculateFinancialScore(form: WizardForm, goals: LifeGoalEntry[]): {
  overall: number; health: number; goalAlignment: number; behavior: number; diversification: number;
} {
  const totalAssets = form.cashSavings + form.taxableInvestments + form.realEstateEquity +
    form.iraBalance + form.rothBalance + form.k401Balance + form.lifeInsuranceCv + form.annuityValue;
  const totalDebt = form.mortgageBalance + form.otherDebt;
  const netWorth = totalAssets - totalDebt;

  const nwRatio = netWorth / Math.max(form.annualIncome + form.spouseIncome, 1);
  const health = Math.min(100, Math.max(10, Math.round(nwRatio * 15 + 20)));

  const goalAlignment = Math.min(100, Math.max(15, 30 + goals.length * 8));

  const annualSavings = (form.annualIncome + form.spouseIncome) - (form.monthlyExpenses * 12);
  const savingsRate = annualSavings / Math.max(form.annualIncome + form.spouseIncome, 1);
  const behavior = Math.min(100, Math.max(10, Math.round(savingsRate * 200 + 30)));

  let diversCount = 0;
  if (form.cashSavings > 0) diversCount++;
  if (form.taxableInvestments > 0) diversCount++;
  if (form.realEstateEquity > 0) diversCount++;
  if (form.iraBalance + form.k401Balance > 0) diversCount++;
  if (form.rothBalance > 0) diversCount++;
  if (form.lifeInsuranceCv > 0) diversCount++;
  if (form.annuityValue > 0) diversCount++;
  const diversification = Math.min(100, Math.max(15, diversCount * 14));

  const overall = Math.round((health * 0.35 + goalAlignment * 0.2 + behavior * 0.25 + diversification * 0.2));
  return { overall, health, goalAlignment, behavior, diversification };
}

export default function ClientOnboardingWizard() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  const [depthLevel, setDepthLevel] = useState<number>(0);
  const [step, setStep] = useState(0);

   const depthQuestions = useMemo(() => {
    if (!depthLevel) return [];
    return ONBOARDING_QUESTIONS.filter((q) => q.priority <= depthLevel);
  }, [depthLevel]);
  const [depthAnswers, setDepthAnswers] = useState<Record<number, string>>({});
  const [form, setForm] = useState<WizardForm>(DEFAULT_FORM);

  useEffect(() => {
    if (clientData) {
      setForm(prev => {
        const next = { ...prev };
        if (clientData.clientName) {
          const parts = clientData.clientName.split(" ");
          next.firstName = parts[0] || prev.firstName;
          next.lastName = parts.slice(1).join(" ") || prev.lastName;
        }
        if (clientData.age) next.age = clientData.age;
        if (clientData.email) next.email = clientData.email;
        if (clientData.spouseAge) next.spouseAge = clientData.spouseAge;
        if (clientData.dependents) next.dependents = clientData.dependents;
        if (clientData.annualIncome) next.annualIncome = clientData.annualIncome;
        if (clientData.spouseIncome) next.spouseIncome = clientData.spouseIncome;
        if (clientData.cashSavings) next.cashSavings = clientData.cashSavings;
        if (clientData.taxableInvestments) next.taxableInvestments = clientData.taxableInvestments;
        if (clientData.realEstateEquity) next.realEstateEquity = clientData.realEstateEquity;
        if (clientData.mortgageBalance) next.mortgageBalance = clientData.mortgageBalance;
        if (clientData.mortgageRate) next.mortgageRate = clientData.mortgageRate;
        if (clientData.monthlyExpenses) next.monthlyExpenses = clientData.monthlyExpenses;
        if (clientData.iraBalance) next.iraBalance = clientData.iraBalance;
        if (clientData.rothBalance) next.rothBalance = clientData.rothBalance;
        if (clientData.k401Balance) next.k401Balance = clientData.k401Balance;
        if (clientData.pensionIncome) next.pensionIncome = clientData.pensionIncome;
        if (clientData.socialSecurityEstimate) next.socialSecurityEstimate = clientData.socialSecurityEstimate;
        if (clientData.lifeInsuranceCv) { next.lifeInsuranceCv = clientData.lifeInsuranceCv; next.hasLifeInsurance = true; }
        if (clientData.lifeInsuranceDb) { next.lifeInsuranceDb = clientData.lifeInsuranceDb; next.hasLifeInsurance = true; }
        if (clientData.annuityValue) { next.annuityValue = clientData.annuityValue; next.hasAnnuity = true; }
        if (clientData.retirementAge) next.retirementAge = clientData.retirementAge;
        if (clientData.annualIncomeNeeded) next.annualIncomeNeeded = clientData.annualIncomeNeeded;
        if (clientData.legacyGoal) next.legacyGoal = clientData.legacyGoal;
        return next;
      });
    }
  }, [clientData]);
  const [lifeGoals, setLifeGoals] = useState<LifeGoalEntry[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState<LifeGoalEntry>({
    id: "", targetAge: 65, category: "retirement", title: "", estimatedCost: 100000, priority: "nice_to_have",
  });
  const [, navigate] = useLocation();

  const recMut = trpc.onboardingWizardV2.getRecommendation.useMutation();
  const createClientMut = trpc.clients.create.useMutation();
  const suggestionsQuery = trpc.lifeGoals.getSuggestions.useQuery({
    age: form.age,
    netWorth: (form.cashSavings + form.taxableInvestments + form.realEstateEquity +
      form.iraBalance + form.rothBalance + form.k401Balance) - (form.mortgageBalance + form.otherDebt),
    income: form.annualIncome + form.spouseIncome,
  }, { enabled: step === 4 });
  const onbQuery = trpc.onboarding.getStatus.useQuery(undefined, { enabled: !!user });
  const onbMut = trpc.onboarding.updateStatus.useMutation();

  const totalAssets = useMemo(() =>
    form.cashSavings + form.taxableInvestments + form.realEstateEquity +
    form.iraBalance + form.rothBalance + form.k401Balance +
    form.lifeInsuranceCv + form.annuityValue, [form]);
  const totalDebt = useMemo(() => form.mortgageBalance + form.otherDebt, [form]);
  const netWorth = totalAssets - totalDebt;

  const riskScore = useMemo(() => {
    const answers = [form.marketDropReaction, form.timeHorizon, form.incomeStability,
      form.investmentExperience, form.riskCapacity, form.volatilityComfort,
      form.guaranteePreference, form.growthVsIncome];
    return Math.round(answers.reduce((a, b) => a + b, 0) / answers.length * 10);
  }, [form.marketDropReaction, form.timeHorizon, form.incomeStability,
    form.investmentExperience, form.riskCapacity, form.volatilityComfort,
    form.guaranteePreference, form.growthVsIncome]);

  const scores = useMemo(() => calculateFinancialScore(form, lifeGoals), [form, lifeGoals]);
  const level = getScoreLevel(scores.overall);

  const next = () => {
    if (step === 0) {
      if (!form.firstName.trim()) { toast.error("Please enter your first name"); return; }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        toast.error("Please enter a valid email address — we'll use it to keep you updated on your financial journey!");
        return;
      }
    }
    if (step === 6) {
      recMut.mutate({
        age: form.age, income: form.annualIncome, iraBalance: form.iraBalance + form.k401Balance,
        homeEquity: form.realEstateEquity, filingStatus: form.filingStatus === "joint" ? "married" : form.filingStatus as "single" | "married" | "hoh",
        retirementAge: form.retirementAge, annualIncomeNeeded: form.annualIncomeNeeded,
        legacyGoal: form.legacyGoal, riskTolerance: Math.round(riskScore / 10),
      });
    }
    setStep(s => Math.min(s + 1, 7));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const addGoal = useCallback(() => {
    if (!newGoal.title.trim()) { toast.error("Please enter a goal title"); return; }
    setLifeGoals(g => [...g, { ...newGoal, id: crypto.randomUUID() }]);
    setNewGoal({ id: "", targetAge: form.age + 5, category: "retirement", title: "", estimatedCost: 100000, priority: "nice_to_have" });
    setShowGoalForm(false);
    toast.success("Goal added! Keep dreaming big!");
  }, [newGoal, form.age]);

  const addSuggestion = useCallback((s: any) => {
    setLifeGoals(g => [...g, {
      id: crypto.randomUUID(), targetAge: s.targetAge, category: s.category,
      title: s.title, estimatedCost: s.cost, priority: s.priority as any,
    }]);
    toast.success(`"${s.title}" added to your goals!`);
  }, []);

  const removeGoal = useCallback((id: string) => {
    setLifeGoals(g => g.filter((goal) => goal.id !== id));
  }, []);

  const ageMilestones = useMemo(() => {
    const milestones: number[] = [];
    const startAge = Math.ceil(form.age / 5) * 5;
    for (let age = startAge; age <= 100; age += 5) {
      if (age > form.age) milestones.push(age);
    }
    return milestones;
  }, [form.age]);

  const handleSubmit = async () => {
    try {
      const result = await createClientMut.mutateAsync({
        name: `${form.firstName} ${form.lastName}`.trim() || "New Client",
        email: form.email || undefined,
        phone: form.phone || undefined,
        age: form.age,
        state: form.state,
        filingStatus: form.filingStatus,
        income: form.annualIncome,
        iraBalance: form.iraBalance + form.k401Balance,
        rothBalance: form.rothBalance,
        taxableAssets: form.taxableInvestments + form.cashSavings,
        realEstateEquity: form.realEstateEquity,
        lifeInsuranceCv: form.lifeInsuranceCv,
        notes: `Onboarding Wizard Data:\nSpouse: ${form.spouseName} (age ${form.spouseAge})\nDependents: ${form.dependents}\nSpouse Income: ${fmt(form.spouseIncome)}\nMortgage: ${fmt(form.mortgageBalance)} @ ${form.mortgageRate}%\nMonthly Expenses: ${fmt(form.monthlyExpenses)}\nPension: ${fmt(form.pensionIncome)}/yr\nSS Estimate: ${fmt(form.socialSecurityEstimate)}/mo\nDeath Benefit: ${fmt(form.lifeInsuranceDb)}\nAnnuity Value: ${fmt(form.annuityValue)}\nHas LTC: ${form.hasLTC}\nRetirement Age: ${form.retirementAge}\nIncome Needed: ${fmt(form.annualIncomeNeeded)}/yr\nLegacy Goal: ${fmt(form.legacyGoal)}\nRisk Tolerance: ${riskScore}/100 (${getRiskLabel(riskScore)})\nPrimary Goal: ${form.primaryGoal}\nFinancial Score: ${scores.overall}/100 (Level ${level}: ${LEVEL_NAMES[level - 1]})\nLife Goals: ${lifeGoals.length} goals set\nNotes: ${form.additionalNotes}`,
      });
      if (user) {
          onbMut.mutate({ step: "wizard_completed" });
      }
      toast.success("Client created! Your financial journey begins now! 🚀");
      setTimeout(() => navigate(`/portal/clients/${result.id}`), 1000);
    } catch {
      toast.error("Failed to create client. Please try again.");
    }
  };

  const aiResult = recMut.data;
  const u = (key: keyof WizardForm, val: any) => setForm(f => ({ ...f, [key]: val }));

  const assetDistributionData = useMemo(() => {
    return [
      { name: "Cash", value: form.cashSavings || 0 },
      { name: "Taxable", value: form.taxableInvestments || 0 },
      { name: "Real Estate", value: form.realEstateEquity || 0 },
      { name: "Retirement", value: (form.iraBalance + form.rothBalance + form.k401Balance) || 0 },
      { name: "Insurance", value: (form.lifeInsuranceCv + form.annuityValue) || 0 },
    ].filter((d) => d.value > 0);
  }, [form]);

  const scoreData = useMemo(() => {
    return [
      { subject: 'Health', A: scores.health, fullMark: 100 },
      { subject: 'Alignment', A: scores.goalAlignment, fullMark: 100 },
      { subject: 'Behavior', A: scores.behavior, fullMark: 100 },
      { subject: 'Diversification', A: scores.diversification, fullMark: 100 },
      { subject: 'Overall', A: scores.overall, fullMark: 100 },
    ];
  }, [scores]);

  const projectionData = useMemo(() => {
    const data = [];
    let currentAssets = totalAssets - totalDebt;
    const annualSavings = (form.annualIncome + form.spouseIncome) - (form.monthlyExpenses * 12);
    for (let i = 0; i <= 30; i+=5) {
      data.push({
        year: i,
        projected: Math.round(currentAssets),
        baseline: Math.round(currentAssets * 0.8)
      });
      currentAssets = (currentAssets + annualSavings * 5) * Math.pow(1.06, 5);
    }
    return data;
  }, [totalAssets, totalDebt, form.annualIncome, form.spouseIncome, form.monthlyExpenses]);

  const riskData = useMemo(() => {
    return [
      { name: "Market Drop", value: form.marketDropReaction },
      { name: "Time Horizon", value: form.timeHorizon },
      { name: "Income Stability", value: form.incomeStability },
      { name: "Experience", value: form.investmentExperience },
      { name: "Capacity", value: form.riskCapacity },
      { name: "Volatility", value: form.volatilityComfort },
      { name: "Guarantee", value: form.guaranteePreference },
      { name: "Growth vs Inc", value: form.growthVsIncome },
    ];
  }, [form]);

  const debtToIncomeData = useMemo(() => {
    const totalIncome = form.annualIncome + form.spouseIncome;
    const dti = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;
    return [
      { name: "Debt", value: totalDebt },
      { name: "Income", value: totalIncome },
    ];
  }, [totalDebt, form.annualIncome, form.spouseIncome]);

  if (!depthLevel) {
    return (
      <AppShell>
        <div className="container py-8">
          <DepthSelector
            onSelect={setDepthLevel}
            description="Choose how comprehensive the onboarding questionnaire should be. Each level adds 20 more questions to the standard intake."
          />
        </div>
        <PageInsights pageId="client-onboarding" />
    </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <FactFinderBadge className="mb-4" />
        <div className="text-center relative">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-[#f0c040]" /> Client Onboarding Wizard
          </h1>
          <p className="text-[#7a95b8] mt-1">Complete intake to auto-populate all calculators and unlock your financial score.</p>
          <div className="absolute right-0 top-0">
            <ExportToSlides
              toolName="Client Onboarding Wizard"
              getSections={() => [
                {
                  title: "Client Overview",
                  items: [
                    { label: "Name", value: `${form.firstName} ${form.lastName}`.trim() || "New Client" },
                    { label: "Age", value: String(form.age) },
                    { label: "State", value: form.state },
                    { label: "Filing Status", value: form.filingStatus },
                    { label: "Dependents", value: String(form.dependents) },
                  ]
                },
                {
                  title: "Financial Overview",
                  items: [
                    { label: "Annual Income", value: fmt(form.annualIncome) },
                    { label: "Total Assets", value: fmt(totalAssets) },
                    { label: "Total Debt", value: fmt(totalDebt) },
                    { label: "Net Worth", value: fmt(netWorth) },
                    { label: "Monthly Expenses", value: fmt(form.monthlyExpenses) },
                  ]
                },
                {
                  title: "Risk & Score",
                  items: [
                    { label: "Risk Score", value: `${riskScore}/100 (${getRiskLabel(riskScore)})` },
                    { label: "Financial Score", value: `${scores.overall}/100` },
                    { label: "Level", value: `Level ${level}: ${LEVEL_NAMES[level - 1]}` },
                    { label: "Life Goals", value: `${lifeGoals.length} goals set` },
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="rc-card bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" /> Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(totalAssets)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total combined assets</p>
              <div className="h-[100px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetDistributionData.length > 0 ? assetDistributionData : [{ name: "No Assets", value: 1 }]}
                      cx="50%" cy="50%" innerRadius={20} outerRadius={40} dataKey="value"
                    >
                      {["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444"].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={{ background: "#0b162c", border: "1px solid #1e293b", borderRadius: "8px" }} formatter={(val: number) => fmt(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="rc-card bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scores.overall}/100</div>
              <p className="text-xs text-muted-foreground mt-1">Level {level}: {LEVEL_NAMES[level - 1]}</p>
              <div className="h-[100px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={30} data={scoreData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 8}} />
                    <Radar name="Score" dataKey="A" stroke="#f0c040" fill="#f0c040" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="rc-card bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Net Worth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(netWorth)}</div>
              <p className="text-xs text-muted-foreground mt-1">Current net worth</p>
              <div className="h-[100px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData}>
                    <defs>
                      <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="projected" stroke="#22c55e" fillOpacity={1} fill="url(#colorProjected)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[#7a95b8] mb-2">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{Math.round(((step + 1) / STEPS.length) * 100)}% Complete</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2 bg-[#1e293b]" />
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isPast = i < step;
              return (
                <button
                  key={i}
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                    isPast ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20" :
                    "bg-muted/50 text-muted-foreground border border-transparent opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!isPast && !isActive}
                >
                  {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-[400px]">
          {/* Step 1: Personal Info */}
          {step === 0 && (
            <Card className="rc-card rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-blue-400" /> Personal Information</CardTitle>
                <CardDescription>Let's start with the basics to personalize your experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>First Name <span className="text-red-400">*</span></Label><Input value={form.firstName} onChange={(e) => u("firstName", e.target.value)} className="mt-1" placeholder="John" /></div>
                  <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => u("lastName", e.target.value)} className="mt-1" placeholder="Doe" /></div>
                  <div><Label>Age</Label><NumberInput value={form.age} onChange={(v) => u("age", v)} className="mt-1" /></div>
                  <div><Label>Email <span className="text-red-400">*</span></Label><Input value={form.email} onChange={(e) => u("email", e.target.value)} className="mt-1" placeholder="john@example.com" type="email" /><p className="text-xs text-[#7a95b8] mt-1">We'll send your financial score & progress updates here</p></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => u("phone", e.target.value)} className="mt-1" placeholder="(555) 123-4567" /></div>
                  <div>
                    <Label>State</Label>
                    <Select value={form.state} onValueChange={v => u("state", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filing Status</Label>
                    <Select value={form.filingStatus} onValueChange={v => u("filingStatus", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="joint">Married Filing Jointly</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="hoh">Head of Household</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Number of Dependents</Label><NumberInput value={form.dependents} onChange={(v) => u("dependents", v)} className="mt-1" /></div>
                </div>
                {form.filingStatus === "joint" && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-muted space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Heart className="w-4 h-4 text-pink-400" /> Spouse Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Label>Spouse Name</Label><Input value={form.spouseName} onChange={(e) => u("spouseName", e.target.value)} className="mt-1" /></div>
                      <div><Label>Spouse Age</Label><NumberInput value={form.spouseAge} onChange={(v) => u("spouseAge", v)} className="mt-1" /></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Financial Overview */}
          {step === 1 && (
            <Card className="rc-card rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#22c55e]" /> Financial Overview</CardTitle>
                <CardDescription>Current income, assets, and debts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-[#22c55e]">Income</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Annual Income</Label><NumberInput value={form.annualIncome} onChange={(v) => u("annualIncome", v)} className="mt-1" /></div>
                    {form.filingStatus === "joint" && <div><Label>Spouse Annual Income</Label><NumberInput value={form.spouseIncome} onChange={(v) => u("spouseIncome", v)} className="mt-1" /></div>}
                    <div><Label>Monthly Living Expenses</Label><NumberInput value={form.monthlyExpenses} onChange={(v) => u("monthlyExpenses", v)} className="mt-1" /></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-blue-400">Assets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Cash & Savings</Label><NumberInput value={form.cashSavings} onChange={(v) => u("cashSavings", v)} className="mt-1" /></div>
                    <div><Label>Taxable Investments</Label><NumberInput value={form.taxableInvestments} onChange={(v) => u("taxableInvestments", v)} className="mt-1" /></div>
                    <div><Label>Real Estate Equity</Label><NumberInput value={form.realEstateEquity} onChange={(v) => u("realEstateEquity", v)} className="mt-1" /></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-red-400">Debts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Mortgage Balance</Label><NumberInput value={form.mortgageBalance} onChange={(v) => u("mortgageBalance", v)} className="mt-1" /></div>
                    <div><Label>Mortgage Rate (%)</Label><NumberInput value={form.mortgageRate} onChange={(v) => u("mortgageRate", v)} className="mt-1" /></div>
                    <div><Label>Other Debt</Label><NumberInput value={form.otherDebt} onChange={(v) => u("otherDebt", v)} className="mt-1" /></div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xs text-[#7a95b8]">Total Assets</p><p className="text-lg font-bold text-[#22c55e]">{fmt(totalAssets)}</p></div>
                    <div><p className="text-xs text-[#7a95b8]">Total Debt</p><p className="text-lg font-bold text-red-400">{fmt(totalDebt)}</p></div>
                    <div><p className="text-xs text-[#7a95b8]">Net Worth</p><p className="text-lg font-bold">{fmt(netWorth)}</p></div>
                  </div>
                </div>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={debtToIncomeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                      <RTooltip contentStyle={{ background: "#0b162c", border: "1px solid #1e293b" }} formatter={(val: number) => fmt(val)} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Insurance & Retirement */}
          {step === 2 && (
            <Card className="rc-card rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-400" /> Insurance & Retirement</CardTitle>
                <CardDescription>Existing policies, retirement accounts, and benefits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-purple-400">Retirement Accounts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label>Traditional IRA</Label><NumberInput value={form.iraBalance} onChange={(v) => u("iraBalance", v)} className="mt-1" /></div>
                    <div><Label>Roth IRA</Label><NumberInput value={form.rothBalance} onChange={(v) => u("rothBalance", v)} className="mt-1" /></div>
                    <div><Label>401(k) / 403(b)</Label><NumberInput value={form.k401Balance} onChange={(v) => u("k401Balance", v)} className="mt-1" /></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-[#f0c040]">Income Sources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Pension Income (Annual)</Label><NumberInput value={form.pensionIncome} onChange={(v) => u("pensionIncome", v)} className="mt-1" /></div>
                    <div><Label>Social Security Estimate (Monthly)</Label><NumberInput value={form.socialSecurityEstimate} onChange={(v) => u("socialSecurityEstimate", v)} className="mt-1" /></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-blue-400">Life Insurance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label>Do you have life insurance?</Label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={form.hasLifeInsurance ? "default" : "outline"} onClick={() => u("hasLifeInsurance", true)}>Yes</Button>
                        <Button size="sm" variant={!form.hasLifeInsurance ? "default" : "outline"} onClick={() => u("hasLifeInsurance", false)}>No</Button>
                      </div>
                    </div>
                    {form.hasLifeInsurance && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Cash Value</Label><NumberInput value={form.lifeInsuranceCv} onChange={(v) => u("lifeInsuranceCv", v)} className="mt-1" /></div>
                        <div><Label>Death Benefit</Label><NumberInput value={form.lifeInsuranceDb} onChange={(v) => u("lifeInsuranceDb", v)} className="mt-1" /></div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-[#22c55e]">Annuities</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label>Do you have existing annuities?</Label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={form.hasAnnuity ? "default" : "outline"} onClick={() => u("hasAnnuity", true)}>Yes</Button>
                        <Button size="sm" variant={!form.hasAnnuity ? "default" : "outline"} onClick={() => u("hasAnnuity", false)}>No</Button>
                      </div>
                    </div>
                    {form.hasAnnuity && (
                      <div><Label>Total Annuity Value</Label><NumberInput value={form.annuityValue} onChange={(v) => u("annuityValue", v)} className="mt-1" /></div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label>Do you have Long-Term Care coverage?</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant={form.hasLTC ? "default" : "outline"} onClick={() => u("hasLTC", true)}>Yes</Button>
                    <Button size="sm" variant={!form.hasLTC ? "default" : "outline"} onClick={() => u("hasLTC", false)}>No</Button>
                  </div>
                </div>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={[
                      { name: 'Retirement', value: form.iraBalance + form.rothBalance + form.k401Balance },
                      { name: 'Insurance', value: form.lifeInsuranceCv + form.annuityValue }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                      <RTooltip contentStyle={{ background: "#0b162c", border: "1px solid #1e293b" }} formatter={(val: number) => fmt(val)} />
                      <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="value" stroke="#f0c040" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Risk Assessment */}
          {step === 3 && (
            <Card className="rc-card rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-400" /> Risk Assessment</CardTitle>
                <CardDescription>Understanding your tolerance for market volatility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-muted">
                  <div>
                    <p className="text-sm text-[#7a95b8]">Current Risk Score</p>
                    <p className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>{riskScore} / 100</p>
                    <p className="text-sm font-medium">{getRiskLabel(riskScore)}</p>
                  </div>
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ value: riskScore }, { value: 100 - riskScore }]}
                          cx="50%" cy="50%" innerRadius={25} outerRadius={40}
                          startAngle={180} endAngle={0} dataKey="value"
                        >
                          <Cell fill={riskScore > 75 ? "#ef4444" : riskScore > 50 ? "#f97316" : riskScore > 25 ? "#eab308" : "#3b82f6"} />
                          <Cell fill="#1e293b" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-8">
                  {RISK_QUESTIONS.map((q) => (
                    <div key={q.key} className="space-y-3">
                      <Label className="text-base">{q.label}</Label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-[#7a95b8] w-24 text-right">{q.low}</span>
                        <Slider
                          value={[form[q.key as keyof WizardForm] as number]}
                          onValueChange={v => u(q.key as keyof WizardForm, v[0])}
                          max={10} min={1} step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-[#7a95b8] w-24">{q.high}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#7a95b8" fontSize={12} domain={[0, 10]} />
                      <RTooltip contentStyle={{ background: "#0b162c", border: "1px solid #1e293b" }} />
                      <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Life Goals */}
          {step === 4 && (
            <Card className="rc-card rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-[#f0c040]" /> Life Goals</CardTitle>
                <CardDescription>What are we planning for?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border border-muted">
                  <div><Label>Target Retirement Age</Label><NumberInput value={form.retirementAge} onChange={(v) => u("retirementAge", v)} className="mt-1" /></div>
                  <div><Label>Annual Income Needed</Label><NumberInput value={form.annualIncomeNeeded} onChange={(v) => u("annualIncomeNeeded", v)} className="mt-1" /></div>
                  <div><Label>Legacy/Inheritance Goal</Label><NumberInput value={form.legacyGoal} onChange={(v) => u("legacyGoal", v)} className="mt-1" /></div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Goals</h3>
                    <Button size="sm" onClick={() => setShowGoalForm(true)}><Plus className="w-4 h-4 mr-1" /> Add Goal</Button>
                  </div>

                  {lifeGoals.length === 0 && !showGoalForm ? (
                    <div className="text-center py-8 border border-dashed border-muted rounded-lg">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-[#7a95b8]">No specific goals added yet.</p>
                      <Button variant="link" onClick={() => setShowGoalForm(true)}>Add your first goal</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lifeGoals.map((g) => {
                        const cat = GOAL_CATEGORIES.find((c) => c.value === g.category);
                        return (
                          <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border border-muted bg-background/50">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{cat?.emoji || "⭐"}</div>
                              <div>
                                <p className="font-medium">{g.title}</p>
                                <p className="text-xs text-[#7a95b8]">Target Age: {g.targetAge} • Est. Cost: {fmt(g.estimatedCost)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={g.priority === "must_have" ? "default" : g.priority === "nice_to_have" ? "secondary" : "outline"}>
                                {g.priority.replace(/_/g, " ")}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => removeGoal(g.id)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showGoalForm && (
                    <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select value={newGoal.category} onValueChange={v => setNewGoal(g => ({ ...g, category: v }))}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {GOAL_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Goal Title</Label><Input value={newGoal.title} onChange={(e) => setNewGoal(g => ({ ...g, title: e.target.value }))} className="mt-1" placeholder="e.g., European Vacation" /></div>
                        <div><Label>Target Age</Label><NumberInput value={newGoal.targetAge} onChange={(v) => setNewGoal(g => ({ ...g, targetAge: v }))} className="mt-1" /></div>
                        <div><Label>Estimated Cost</Label><NumberInput value={newGoal.estimatedCost} onChange={(v) => setNewGoal(g => ({ ...g, estimatedCost: v }))} className="mt-1" /></div>
                        <div className="md:col-span-2">
                          <Label>Priority</Label>
                          <Select value={newGoal.priority} onValueChange={v => setNewGoal(g => ({ ...g, priority: v as any }))}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="must_have">Must Have</SelectItem>
                              <SelectItem value="nice_to_have">Nice to Have</SelectItem>
                              <SelectItem value="dream">Dream</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowGoalForm(false)}>Cancel</Button>
                        <Button onClick={addGoal}>Save Goal</Button>
                      </div>
                    </div>
                  )}
                </div>

                {suggestionsQuery.data && suggestionsQuery.data.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-[#f0c040] flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Suggestions based on your profile</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestionsQuery.data.map((s, i) => (
                        <div key={i} className="p-3 rounded-lg border border-muted bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => addSuggestion(s)}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-sm">{s.title}</p>
                            <Plus className="w-4 h-4 text-blue-400" />
                          </div>
                          <p className="text-xs text-[#7a95b8]">{s.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lifeGoals.length > 0 ? lifeGoals : [{ title: 'No Goals', estimatedCost: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="title" stroke="#7a95b8" fontSize={10} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                      <RTooltip contentStyle={{ background: "#0b162c", border: "1px solid #1e293b" }} formatter={(val: number) => fmt(val)} />
                      <Bar dataKey="estimatedCost" fill="#f0c040" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Deep-Dive Assessment */}
          {step === 5 && (
            <Card className="rc-card rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-400" /> Deep-Dive Assessment</CardTitle>
                <CardDescription>Level {depthLevel} Intake Questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {depthQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#7a95b8]">No additional questions for this depth level.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {depthQuestions.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <Label className="text-base font-medium">{q.question}</Label>
                        {q.type === "text" && (
                          <Textarea
                            value={depthAnswers[q.id] || ""}
                            onChange={(e) => setDepthAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Your answer..."
                            className="min-h-[80px]"
                          />
                        )}
                        {q.type === "select" && q.options && (
                          <Select
                            value={depthAnswers[q.id] || ""}
                            onValueChange={(v) => setDepthAnswers(prev => ({ ...prev, [q.id]: v }))}
                          >
                            <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                            <SelectContent>
                              {q.options.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {q.type === "boolean" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant={depthAnswers[q.id] === "Yes" ? "default" : "outline"} onClick={() => setDepthAnswers(prev => ({ ...prev, [q.id]: "Yes" }))}>Yes</Button>
                            <Button size="sm" variant={depthAnswers[q.id] === "No" ? "default" : "outline"} onClick={() => setDepthAnswers(prev => ({ ...prev, [q.id]: "No" }))}>No</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 7: Your Score */}
          {step === 6 && (
            <div className="space-y-6">
              <Card className="rc-card bg-gradient-to-br from-[#0f172a] to-[#1e293b] border-[#334155] overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy className="w-32 h-32" />
                </div>
                <CardContent className="pt-6 relative z-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4">
                      <span className="text-4xl">{LEVEL_EMOJIS[level - 1]}</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Level {level}: {LEVEL_NAMES[level - 1]}</h2>
                    <p className="text-[#7a95b8] max-w-md mx-auto">Based on your current financial health, goal alignment, and asset diversification.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#7a95b8]">Overall Score</span>
                          <span className="font-bold text-blue-400">{scores.overall}/100</span>
                        </div>
                        <Progress value={scores.overall} className="h-2 bg-[#0f172a] [&>div]:bg-blue-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#7a95b8]">Financial Health</span>
                          <span className="font-bold text-emerald-400">{scores.health}/100</span>
                        </div>
                        <Progress value={scores.health} className="h-2 bg-[#0f172a] [&>div]:bg-emerald-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#7a95b8]">Goal Alignment</span>
                          <span className="font-bold text-[#f0c040]">{scores.goalAlignment}/100</span>
                        </div>
                        <Progress value={scores.goalAlignment} className="h-2 bg-[#0f172a] [&>div]:bg-[#f0c040]" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#7a95b8]">Diversification</span>
                          <span className="font-bold text-purple-400">{scores.diversification}/100</span>
                        </div>
                        <Progress value={scores.diversification} className="h-2 bg-[#0f172a] [&>div]:bg-purple-500" />
                      </div>
                    </div>

                    <div className="bg-[#0f172a]/50 p-4 rounded-lg border border-[#334155]">
                      <h3 className="font-semibold mb-3 flex items-center gap-2"><Rocket className="w-4 h-4 text-blue-400" /> How to level up</h3>
                      <ul className="space-y-3 text-sm text-[#7a95b8]">
                        {scores.health < 80 && <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" /> Focus on increasing your savings rate to build net worth faster.</li>}
                        {scores.goalAlignment < 80 && <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-[#f0c040] shrink-0" /> Add more specific life goals to align your money with your values.</li>}
                        {scores.diversification < 80 && <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-purple-400 shrink-0" /> Consider diversifying into other asset classes like real estate or tax-free vehicles.</li>}
                        {scores.behavior < 80 && <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" /> Reduce monthly expenses to improve your cash flow margin.</li>}
                        <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" /> Complete this onboarding to get your personalized action plan!</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {recMut.isPending && (
                <Card className="rc-card border-blue-500/30 bg-blue-500/5 animate-pulse">
                  <CardContent className="py-8 text-center">
                    <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
                    <h3 className="text-lg font-medium text-blue-400">Analyzing Your Profile...</h3>
                    <p className="text-sm text-[#7a95b8] mt-2">Our AI is generating personalized recommendations based on your inputs.</p>
                  </CardContent>
                </Card>
              )}

              {aiResult && !recMut.isPending && (
                <Card className="rc-card border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-400"><Sparkles className="w-5 h-5" /> AI Initial Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">{aiResult.analysis}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {aiResult.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-background/50 border border-emerald-500/20">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 8: Review & Submit */}
          {step === 7 && (
            <div className="space-y-6">
              <Card className="rc-card rc-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-blue-400" /> Review Your Profile</CardTitle>
                  <CardDescription>Please confirm your information before we create your plan.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-blue-400">Personal</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="rc-page-subtitle">Name</span><span>{form.firstName} {form.lastName}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Age</span><span>{form.age}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Email</span><span>{form.email}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">State</span><span>{form.state}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Filing</span><span>{form.filingStatus}</span></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-[#22c55e]">Financial</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="rc-page-subtitle">Income</span><span>{fmt(form.annualIncome + form.spouseIncome)}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Assets</span><span>{fmt(totalAssets)}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Debt</span><span>{fmt(totalDebt)}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Net Worth</span><span className="font-bold">{fmt(netWorth)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-red-400">Risk Profile</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="rc-page-subtitle">Score</span><span>{riskScore}/100</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Category</span><span>{getRiskLabel(riskScore)}</span></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-[#f0c040]">Retirement</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="rc-page-subtitle">Retire At</span><span>{form.retirementAge}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Income Need</span><span>{fmt(form.annualIncomeNeeded)}/yr</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">Legacy Goal</span><span>{fmt(form.legacyGoal)}</span></div>
                        <div className="flex justify-between"><span className="rc-page-subtitle">IRA + 401(k)</span><span>{fmt(form.iraBalance + form.k401Balance)}</span></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full h-12 text-lg"
                onClick={handleSubmit}
                disabled={createClientMut.isPending}
              >
                {createClientMut.isPending ? "Creating Client..." : (
                  <><Save className="w-5 h-5 mr-2" /> Create Client & Start Your Journey</>
                )}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button className="rc-btn rc-btn-ghost" onClick={prev} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < 7 && (
              <Button onClick={next} disabled={step === 6 && recMut.isPending}>
                {step === 6 ? (recMut.isPending ? "Analyzing..." : "Review & Submit") : "Next Step"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        <NAICDisclaimer variant="compact" showsProjections />
        <PageInsights pageId="client-onboarding" />
      </div>
    </AppShell>
  );
}
