// @ts-nocheck
import { AppShell } from "@/components/AppShell";
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
  User,
  DollarSign,
  Briefcase,
  Heart,
  ClipboardCheck,
  Save,
  Star,
  Trophy,
  Zap,
  Plus,
  X,
  MapPin,
  Rocket,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import DepthSelector from "@/components/DepthSelector";
import { ONBOARDING_QUESTIONS, type OnboardingQuestion } from "@/data/onboardingQuestions";

const fmt = (n: number) => `$${n.toLocaleString()}`;

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
  if (score <= 60) return "text-amber-400";
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
  const { data: clientData } = useClientData();
  const [depthLevel, setDepthLevel] = useState<number | null>(null);
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
        if (clientData.state) next.state = clientData.state;
        if (clientData.filingStatus) next.filingStatus = clientData.filingStatus;
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
      toast.success("Client created! Your financial journey begins now! 🚀");
      setTimeout(() => navigate(`/portal/clients/${result.id}`), 1000);
    } catch {
      toast.error("Failed to create client. Please try again.");
    }
  };

  const aiResult = recMut.data;
  const u = (key: keyof WizardForm, val: any) => setForm(f => ({ ...f, [key]: val }));

  if (!depthLevel) {
    return (
      <AppShell>
        <div className="container py-8">
          <DepthSelector
            onSelect={setDepthLevel}
            title="Client Onboarding Depth"
            description="Choose how comprehensive the onboarding questionnaire should be. Each level adds 20 more questions to the standard intake."
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <FactFinderBadge className="mb-4" />
        <div className="text-center relative">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" /> Client Onboarding Wizard
          </h1>
          <p className="text-muted-foreground mt-1">Complete intake to auto-populate all calculators and unlock your financial score.</p>
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

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step].title}</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => i <= step && setStep(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    i === step ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    i < step ? "bg-muted/50 text-emerald-400 cursor-pointer hover:bg-muted" :
                    "bg-muted/20 text-muted-foreground"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < step ? "bg-emerald-500 text-white" : i === step ? "bg-emerald-500/30 text-emerald-400" : "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-medium">{s.title}</div>
                  </div>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Personal Info */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-blue-400" /> Personal Information</CardTitle>
              <CardDescription>Tell us about yourself and your family</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>First Name <span className="text-red-400">*</span></Label><Input value={form.firstName} onChange={(e) => u("firstName", e.target.value)} className="mt-1" placeholder="John" /></div>
                <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => u("lastName", e.target.value)} className="mt-1" placeholder="Smith" /></div>
                <div><Label>Age</Label><NumberInput value={form.age} onChange={(v) => u("age", v)} className="mt-1" /></div>
                <div><Label>Email <span className="text-red-400">*</span></Label><Input value={form.email} onChange={(e) => u("email", e.target.value)} className="mt-1" placeholder="john@example.com" type="email" /><p className="text-xs text-muted-foreground mt-1">We'll send your financial score & progress updates here</p></div>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" /> Financial Overview</CardTitle>
              <CardDescription>Current income, assets, and debts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-emerald-400">Income</h3>
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
                  <div><p className="text-xs text-muted-foreground">Total Assets</p><p className="text-lg font-bold text-emerald-400">{fmt(totalAssets)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total Debt</p><p className="text-lg font-bold text-red-400">{fmt(totalDebt)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Net Worth</p><p className="text-lg font-bold">{fmt(netWorth)}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Insurance & Retirement */}
        {step === 2 && (
          <Card>
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
                <h3 className="text-sm font-semibold mb-3 text-amber-400">Income Sources</h3>
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
                <h3 className="text-sm font-semibold mb-3 text-emerald-400">Annuities</h3>
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
            </CardContent>
          </Card>
        )}

        {/* Step 4: Risk Assessment */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400" /> Risk Assessment</CardTitle>
              <CardDescription>Answer honestly — there are no wrong answers. This helps us match you with the right strategies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {RISK_QUESTIONS.map((q) => (
                <div key={q.key} className="space-y-2">
                  <Label className="text-sm font-medium">{q.label}</Label>
                  <Slider
                    value={[form[q.key as keyof WizardForm] as number]}
                    onValueChange={([v]) => u(q.key as keyof WizardForm, v)}
                    min={1} max={10} step={1} className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{q.low}</span>
                    <span className="font-medium text-foreground">{form[q.key as keyof WizardForm] as number}/10</span>
                    <span>{q.high}</span>
                  </div>
                </div>
              ))}

              {/* Live Risk Score */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 text-center space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Risk Profile</p>
                <div className="text-5xl font-black">
                  <span className={getRiskColor(riskScore)}>{riskScore}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <Badge variant="outline" className={`text-sm ${getRiskColor(riskScore)}`}>
                  {getRiskLabel(riskScore)}
                </Badge>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {riskScore <= 25 && "You prefer stability and guaranteed returns. We'll focus on protected growth strategies."}
                  {riskScore > 25 && riskScore <= 40 && "You lean toward safety but are open to some growth. A balanced approach works best."}
                  {riskScore > 40 && riskScore <= 60 && "You're comfortable with moderate risk for moderate reward. A diversified portfolio suits you."}
                  {riskScore > 60 && riskScore <= 75 && "You're willing to accept higher volatility for greater growth potential."}
                  {riskScore > 75 && "You're an aggressive investor seeking maximum growth. High risk, high reward."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Life Goals */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Rocket className="w-5 h-5 text-amber-400" /> Dream Big — Set Your Life Goals</CardTitle>
                <CardDescription>
                  What do you want to achieve every 5 years? Add goals for each milestone age up to 100.
                  We'll score how likely you are to achieve each one!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Retirement basics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Retirement Age</Label><NumberInput value={form.retirementAge} onChange={(v) => u("retirementAge", v)} className="mt-1" /></div>
                  <div><Label>Annual Retirement Income Needed</Label><NumberInput value={form.annualIncomeNeeded} onChange={(v) => u("annualIncomeNeeded", v)} className="mt-1" /></div>
                  <div><Label>Legacy Goal (Estate Value)</Label><NumberInput value={form.legacyGoal} onChange={(v) => u("legacyGoal", v)} className="mt-1" /></div>
                </div>

                <div>
                  <Label>Primary Goal</Label>
                  <Select value={form.primaryGoal} onValueChange={v => u("primaryGoal", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tax_free_retirement">Tax-Free Retirement Income</SelectItem>
                      <SelectItem value="wealth_transfer">Wealth Transfer / Legacy</SelectItem>
                      <SelectItem value="debt_elimination">Debt Elimination</SelectItem>
                      <SelectItem value="asset_protection">Asset Protection</SelectItem>
                      <SelectItem value="growth_accumulation">Growth & Accumulation</SelectItem>
                      <SelectItem value="income_replacement">Income Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age milestone timeline */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" /> Your Life Milestones
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ageMilestones.map((age) => {
                      const goalsAtAge = lifeGoals.filter((g) => g.targetAge === age);
                      return (
                        <button
                          key={age}
                          onClick={() => { setNewGoal(g => ({ ...g, targetAge: age })); setShowGoalForm(true); }}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            goalsAtAge.length > 0
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          Age {age}
                          {goalsAtAge.length > 0 && <span className="ml-1 text-[10px]">({goalsAtAge.length})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current goals */}
                {lifeGoals.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Your Goals ({lifeGoals.length})</h3>
                    {lifeGoals.sort((a, b) => a.targetAge - b.targetAge).map((goal) => {
                      const cat = GOAL_CATEGORIES.find((c) => c.value === goal.category);
                      return (
                        <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-muted/30">
                          <span className="text-2xl">{cat?.emoji ?? "⭐"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{goal.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Age {goal.targetAge} · {fmt(goal.estimatedCost)} ·{" "}
                              <span className={goal.priority === "must_have" ? "text-red-400" : goal.priority === "dream" ? "text-purple-400" : "text-amber-400"}>
                                {goal.priority.replace("_", " ")}
                              </span>
                            </p>
                          </div>
                          <button onClick={() => removeGoal(goal.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add goal form */}
                {showGoalForm && (
                  <div className="p-4 rounded-lg bg-muted/20 border border-emerald-500/20 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add a New Goal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Target Age</Label>
                        <Select value={String(newGoal.targetAge)} onValueChange={v => setNewGoal(g => ({ ...g, targetAge: Number(v) }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{ageMilestones.map((a) => <SelectItem key={a} value={String(a)}>Age {a}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={newGoal.category} onValueChange={v => setNewGoal(g => ({ ...g, category: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{GOAL_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Goal Title</Label>
                        <Input value={newGoal.title} onChange={(e) => setNewGoal(g => ({ ...g, title: e.target.value }))} className="mt-1" placeholder="e.g., Buy a beach house in Florida" />
                      </div>
                      <div>
                        <Label>Estimated Cost</Label>
                        <NumberInput value={newGoal.estimatedCost} onChange={(v) => setNewGoal(g => ({ ...g, estimatedCost: v }))} className="mt-1" />
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select value={newGoal.priority} onValueChange={v => setNewGoal(g => ({ ...g, priority: v as any }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="must_have">Must Have</SelectItem>
                            <SelectItem value="nice_to_have">Nice to Have</SelectItem>
                            <SelectItem value="dream">Dream Goal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addGoal} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Goal</Button>
                      <Button variant="outline" onClick={() => setShowGoalForm(false)} size="sm">Cancel</Button>
                    </div>
                  </div>
                )}

                {!showGoalForm && (
                  <Button variant="outline" onClick={() => setShowGoalForm(true)} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add a Life Goal
                  </Button>
                )}

                {/* Popular suggestions */}
                {suggestionsQuery.data && suggestionsQuery.data.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" /> Popular Goals for People Like You
                    </h3>
                    <p className="text-xs text-muted-foreground">Based on your age ({form.age}), income, and net worth — here's what others dream about:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {suggestionsQuery.data.filter((s) => !lifeGoals.some(g => g.title === s.title)).slice(0, 8).map((s, i) => {
                        const cat = GOAL_CATEGORIES.find((c) => c.value === s.category);
                        return (
                          <button
                            key={i}
                            onClick={() => addSuggestion(s)}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-muted/20 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all text-left"
                          >
                            <span className="text-xl">{cat?.emoji ?? "⭐"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{s.title}</p>
                              <p className="text-xs text-muted-foreground">Age {s.targetAge} · {fmt(s.cost)}</p>
                            </div>
                            <Plus className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea value={form.additionalNotes} onChange={(e) => u("additionalNotes", e.target.value)} className="mt-1" rows={3} placeholder="Any specific concerns, goals, or circumstances we should know about..." />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 6: Deep-Dive Assessment */}
        {step === 5 && depthQuestions.length > 0 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" /> Deep-Dive Assessment
                  <Badge variant="secondary" className="ml-auto">{Object.keys(depthAnswers).length}/{depthQuestions.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Level {depthLevel} depth — {depthQuestions.length} extended questions across all financial categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {depthQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                      {q.text}
                    </Label>
                    {q.helperText && <p className="text-xs text-muted-foreground">{q.helperText}</p>}
                    {q.type === "text" && (
                      <Input
                        placeholder={q.placeholder}
                        value={depthAnswers[q.id] || ""}
                        onChange={(v) => setDepthAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      />
                    )}
                    {q.type === "number" && (
                      <Input
                        type="number"
                        placeholder={q.placeholder}
                        value={depthAnswers[q.id] || ""}
                        onChange={(v) => setDepthAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      />
                    )}
                    {q.type === "select" && q.options && (
                      <Select value={depthAnswers[q.id] || ""} onValueChange={v => setDepthAnswers(prev => ({ ...prev, [q.id]: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {q.options.filter((o) => o.value !== "").map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {q.type === "slider" && (
                      <div className="flex items-center gap-4">
                        <Slider
                          min={1} max={10} step={1}
                          value={[Number(depthAnswers[q.id]) || 5]}
                          onValueChange={([v]) => setDepthAnswers(prev => ({ ...prev, [q.id]: String(v) }))}
                        />
                        <span className="text-sm font-bold w-8 text-center">{depthAnswers[q.id] || "5"}</span>
                      </div>
                    )}
                    {q.type === "boolean" && (
                      <div className="flex gap-3">
                        <Button
                          variant={depthAnswers[q.id] === "yes" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDepthAnswers(prev => ({ ...prev, [q.id]: "yes" }))}
                        >Yes</Button>
                        <Button
                          variant={depthAnswers[q.id] === "no" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDepthAnswers(prev => ({ ...prev, [q.id]: "no" }))}
                        >No</Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        {step === 5 && depthQuestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No deep-dive questions at this depth level. Click Next to continue.</p>
          </div>
        )}

        {/* Step 7: Your Score */}
        {step === 6 && (
          <div className="space-y-4">
            <Card className="border-amber-500/30">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Trophy className="w-7 h-7 text-amber-400" /> Your Financial Score
                </CardTitle>
                <CardDescription>Here's where you stand — and how to level up!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Big Score Display */}
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-40 h-40 rounded-full border-4 border-amber-500/30 flex items-center justify-center mx-auto bg-gradient-to-br from-amber-500/5 to-emerald-500/5">
                      <div>
                        <div className="text-5xl font-black text-amber-400">{scores.overall}</div>
                        <div className="text-xs text-muted-foreground">out of 100</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl">{LEVEL_EMOJIS[level - 1]}</p>
                    <p className="text-lg font-bold">Level {level}: {LEVEL_NAMES[level - 1]}</p>
                    <p className="text-sm text-muted-foreground">
                      {level < 10 ? `${(level) * 10 - scores.overall + 5} more points to reach Level ${level + 1}: ${LEVEL_NAMES[level]}` : "You've reached the pinnacle!"}
                    </p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Financial Health", score: scores.health, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Goal Alignment", score: scores.goalAlignment, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Behavior", score: scores.behavior, color: "text-purple-400", bg: "bg-purple-500/10" },
                    { label: "Diversification", score: scores.diversification, color: "text-amber-400", bg: "bg-amber-500/10" },
                  ].map((item) => (
                    <div key={item.label} className={`p-4 rounded-xl ${item.bg} text-center`}>
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className={`text-2xl font-bold ${item.color}`}>{item.score}</p>
                      <Progress value={item.score} className="h-1.5 mt-2" />
                    </div>
                  ))}
                </div>

                {/* Quick Tips */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Quick Ways to Boost Your Score</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {scores.health < 60 && <li>• Increase your net worth-to-income ratio by reducing debt or increasing savings</li>}
                    {scores.goalAlignment < 60 && <li>• Add more specific life goals — the more goals you set, the better your alignment score</li>}
                    {scores.behavior < 60 && <li>• Boost your savings rate — aim for at least 15% of income</li>}
                    {scores.diversification < 60 && <li>• Diversify into more asset classes (Roth, IUL, annuities, real estate)</li>}
                    <li>• Complete the onboarding and visit the Recommendations tab for personalized score boosters (+5 each!)</li>
                  </ul>
                </div>

                {/* Risk Profile Summary */}
                <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Risk Profile</p>
                      <p className={`text-lg font-bold ${getRiskColor(riskScore)}`}>{getRiskLabel(riskScore)} ({riskScore}/100)</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Life Goals Set</p>
                      <p className="text-lg font-bold text-emerald-400">{lifeGoals.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Net Worth</p>
                      <p className="text-lg font-bold">{fmt(netWorth)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 8: Review & Submit */}
        {step === 7 && (
          <div className="space-y-4">
            {/* AI Recommendation */}
            {aiResult && (
              <Card className="border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> Strategy Recommendation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                      <p className="text-xs text-muted-foreground">Roth Conversion</p>
                      <p className="text-lg font-bold text-emerald-400">{fmt(aiResult.suggestedConversion)}/yr</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                      <p className="text-xs text-muted-foreground">IUL Premium</p>
                      <p className="text-lg font-bold text-blue-400">{fmt(aiResult.suggestedPremium)}/yr</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                      <p className="text-xs text-muted-foreground">Opportunity Score</p>
                      <p className="text-lg font-bold text-amber-400">{aiResult.score}/100</p>
                    </div>
                  </div>
                  {([{ priority: aiResult.score > 80 ? "high" : "medium", name: aiResult.strategy, description: aiResult.description }]).map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                      <Badge variant={s.priority === "high" ? "default" : "secondary"}>{s.priority}</Badge>
                      <div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-muted-foreground">{s.description}</p></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Review Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-blue-400" /> Review Your Information</CardTitle>
                <CardDescription>Please verify everything is correct before submitting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-blue-400">Personal</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{form.firstName} {form.lastName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{form.age}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">State</span><span>{form.state}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Filing</span><span>{form.filingStatus === "joint" ? "MFJ" : form.filingStatus === "single" ? "Single" : "HoH"}</span></div>
                      {form.spouseName && <div className="flex justify-between"><span className="text-muted-foreground">Spouse</span><span>{form.spouseName} ({form.spouseAge})</span></div>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-emerald-400">Financial</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Income</span><span>{fmt(form.annualIncome + form.spouseIncome)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Net Worth</span><span className="font-bold">{fmt(netWorth)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total Assets</span><span>{fmt(totalAssets)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total Debt</span><span className="text-red-400">{fmt(totalDebt)}</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-purple-400">Risk & Score</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Risk Profile</span><span className={getRiskColor(riskScore)}>{getRiskLabel(riskScore)} ({riskScore})</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Financial Score</span><span className="text-amber-400 font-bold">{scores.overall}/100</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span>{LEVEL_EMOJIS[level - 1]} {LEVEL_NAMES[level - 1]}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Life Goals</span><span>{lifeGoals.length} goals</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-400">Retirement</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Retire At</span><span>{form.retirementAge}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Income Need</span><span>{fmt(form.annualIncomeNeeded)}/yr</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Legacy Goal</span><span>{fmt(form.legacyGoal)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">IRA + 401(k)</span><span>{fmt(form.iraBalance + form.k401Balance)}</span></div>
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
        <div className="flex justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 0}>
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
    </AppShell>
  );
}
