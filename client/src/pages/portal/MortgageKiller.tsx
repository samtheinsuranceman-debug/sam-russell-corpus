// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/NumberInput";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { toast } from "sonner";
import {
  Home, DollarSign, TrendingUp, Upload, FileText, Calculator,
  Clock, Percent, PiggyBank, Shield, ArrowRight, CheckCircle2,
  AlertTriangle, Landmark, Banknote, Wallet, Bitcoin, BarChart3,
  Download, Mail, GitCompare, Layers, Zap, Save, Trash2, RotateCcw, FolderOpen, User, Activity,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { OilGasToggle } from "@/components/OilGasToggle";
import { TimeMachineToggle, useTimeMachine } from "@/components/TimeMachineToggle";
import type { IllustrationYear } from "@shared/timeMachineEngine";
import { TimeMachineInlineDisclaimer } from "@/components/TimeMachineInlineDisclaimer";
import { IbbotsonYearSelector } from "@/components/IbbotsonYearSelector";
import { SP500_ANNUAL_RETURNS, calculateCreditedRate, IBBOTSON_DEFAULT_START_YEAR, IBBOTSON_SHORT_DISCLAIMER } from "@shared/ibbotsonModel";
import { PageInsights } from "@/components/PageInsights";
import { useStrategy } from "@/contexts/StrategyContext";
import { StrategyFlowBanner } from "@/components/StrategyFlowBanner";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { MonteCarloChart, MonteCarloInline } from "@/components/MonteCarloChart";
import { runMonteCarlo, MONTE_CARLO_PRESETS } from "@shared/monteCarloEngine";
import { GuidedWizard, GuidedModeToggle, type WizardStep } from "@/components/GuidedWizard";
import { ReportGenerator, type ReportSection } from "@/components/ReportGenerator";
import { ExportToSlides } from "@/components/ExportToSlides";
import { DataFeedInline } from "@/components/DataFeedBadge";
import { trpc as trpcClient } from "@/lib/trpc";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtMo = (m: number) => {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  return y > 0 ? `${y}y ${mo}m` : `${mo}m`;
};

const SCENARIO_PRESETS = [
  { label: "Conservative (15%)", allocationPct: 0.15, helocRate: 0.09, color: "#3b82f6", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  { label: "Moderate (20%)", allocationPct: 0.20, helocRate: 0.085, color: "#10b981", bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  { label: "Aggressive (25%)", allocationPct: 0.25, helocRate: 0.08, color: "#8b5cf6", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  { label: "Max Acceleration (30%)", allocationPct: 0.30, helocRate: 0.075, color: "#f59e0b", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
];

export default function MortgageKiller() {
  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const clients = clientsQuery.data ?? [];
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const savedScenariosQuery = trpc.scenario.listByClient.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId, staleTime: 30_000 }
  );
  const savedScenarios = savedScenariosQuery.data ?? [];
  const [scenarioName, setScenarioName] = useState("");

  const saveMutation = trpc.scenario.save.useMutation({
    onSuccess: () => {
      utils.scenario.listByClient.invalidate({ clientId: selectedClientId! });
      toast.success("Scenario saved — you can reload it anytime.");
      setScenarioName("");
    },
    onError: () => toast.error("Failed to save scenario."),
  });

  const deleteMutation = trpc.scenario.delete.useMutation({
    onSuccess: () => {
      utils.scenario.listByClient.invalidate({ clientId: selectedClientId! });
      toast.success("Scenario deleted");
    },
  });

  const [form, setForm] = useState({
    mortgageBalance: 350000,
    mortgageRate: 0.065,
    mortgageTermMonths: 360,
    monthlyMortgagePayment: 2212,
    monthlyInterestOnlyPayment: 1896,
    totalInterestPayments: 446247,
    homeEquityValue: 150000,
    homeMarketValue: 500000,
    iraValue: 75000,
    cashValue: 25000,
    investments: 50000,
    annuities: 0,
    otherInvestments: 15000,
    cryptocurrency: 10000,
    annualIncome: 120000,
  });

  const [strategyParams, setStrategyParams] = useState({
    incomeAllocationPct: 0.20,
    iulCreditRate: 0.075, // AG 49 max illustrated rate
    premiumYears: 5,
    helocRate: 0.085,
    helocLtvPct: 0.70,
    helocDrawPct: 0.70, // v4: 70% LTV HELOC draw
    policyLoanPct: 0.80, // v4: 80% life loan
    policyLoanDragRate: 0.05, // 5% loan rate
    interestReinvestRate: 0.07,
    interestReinvestYears: 20,
    clientAge: 45,
  });

  const [ibbotsonStartYear, setIbbotsonStartYear] = useState(IBBOTSON_DEFAULT_START_YEAR);
  const [useIbbotsonModel, setUseIbbotsonModel] = useState(true);

  const [activeTab, setActiveTab] = useState("factfinder");
  const [uploading, setUploading] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [scenarioMode, setScenarioMode] = useState(false);
  const [scenarioResults, setScenarioResults] = useState<any[]>([]);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: clientData } = useClientData();
  useEffect(() => {
    if (!clientData) return;
    setForm(p => ({
      ...p,
      mortgageBalance: clientData.mortgageBalance || p.mortgageBalance,
      mortgageRate: clientData.mortgageRate ? clientData.mortgageRate / 100 : p.mortgageRate,
      mortgageTermMonths: (clientData.mortgageYearsLeft || 25) * 12,
      totalInterestPayments: clientData.totalMortgageInterest || p.totalInterestPayments,
      homeMarketValue: clientData.homeValue || p.homeMarketValue,
      homeEquityValue: clientData.realEstateEquity || p.homeEquityValue,
      iraValue: clientData.iraBalance || p.iraValue,
      cashValue: clientData.cashSavings || p.cashValue,
      investments: clientData.taxableInvestments || p.investments,
      annualIncome: clientData.annualIncome || p.annualIncome,
    }));
    setStrategyParams(p => ({
      ...p,
      clientAge: clientData.age || p.clientAge,
      helocRate: clientData.helocRate ? clientData.helocRate / 100 : p.helocRate,
      helocLtvPct: clientData.helocMaxLtv ? clientData.helocMaxLtv / 100 : p.helocLtvPct,
    }));
    if (clientData.email) setEmailTo(clientData.email);
    if (clientData.clientId) setSelectedClientId(clientData.clientId);
  }, [clientData]);
  useEffect(() => {
    if (!selectedClientId) return;
    const c = clients.find((cl) => cl.id === selectedClientId);
    if (!c) return;
    setForm(p => ({
      ...p,
      annualIncome: Number(c.income ?? p.annualIncome),
      iraValue: Number(c.iraBalance ?? p.iraValue),
      homeEquityValue: Number(c.realEstateEquity ?? p.homeEquityValue),
    }));
    if (c.age) {
      setStrategyParams(p => ({ ...p, clientAge: Number(c.age) }));
    }
    if (c.email) setEmailTo(c.email);
  }, [selectedClientId, clients.length]);

  const clientName = selectedClient?.name || "Client";

  const handleSaveScenario = () => {
    if (!selectedClientId) {
      toast.error("Select a client before saving a scenario.");
      return;
    }
    const name = scenarioName.trim() || `Mortgage Killer ${new Date().toLocaleDateString()}`;
    saveMutation.mutate({
      clientId: selectedClientId,
      name,
      scenarioType: "MORTGAGE_KILLER",
      inputJson: { ...form, ...strategyParams },
    });
  };

  const handleLoadScenario = (scenario: any) => {
    const input = scenario.inputJson as any;
    if (!input) return;
    setForm(p => ({
      ...p,
      mortgageBalance: input.mortgageBalance ?? p.mortgageBalance,
      mortgageRate: input.mortgageRate ?? p.mortgageRate,
      mortgageTermMonths: input.mortgageTermMonths ?? p.mortgageTermMonths,
      monthlyMortgagePayment: input.monthlyMortgagePayment ?? p.monthlyMortgagePayment,
      monthlyInterestOnlyPayment: input.monthlyInterestOnlyPayment ?? p.monthlyInterestOnlyPayment,
      totalInterestPayments: input.totalInterestPayments ?? p.totalInterestPayments,
      homeEquityValue: input.homeEquityValue ?? p.homeEquityValue,
      homeMarketValue: input.homeMarketValue ?? p.homeMarketValue,
      iraValue: input.iraValue ?? p.iraValue,
      cashValue: input.cashValue ?? p.cashValue,
      investments: input.investments ?? p.investments,
      annuities: input.annuities ?? p.annuities,
      otherInvestments: input.otherInvestments ?? p.otherInvestments,
      cryptocurrency: input.cryptocurrency ?? p.cryptocurrency,
      annualIncome: input.annualIncome ?? p.annualIncome,
    }));
    setStrategyParams(p => ({
      ...p,
      incomeAllocationPct: input.incomeAllocationPct ?? p.incomeAllocationPct,
      iulCreditRate: input.iulCreditRate ?? p.iulCreditRate,
      premiumYears: input.premiumYears ?? p.premiumYears,
      helocRate: input.helocRate ?? p.helocRate,
      helocLtvPct: input.helocLtvPct ?? p.helocLtvPct,
      helocDrawPct: input.helocDrawPct ?? p.helocDrawPct,
      policyLoanPct: input.policyLoanPct ?? p.policyLoanPct,
      policyLoanDragRate: input.policyLoanDragRate ?? p.policyLoanDragRate,
      interestReinvestRate: input.interestReinvestRate ?? p.interestReinvestRate,
      interestReinvestYears: input.interestReinvestYears ?? p.interestReinvestYears,
      clientAge: input.clientAge ?? p.clientAge,
    }));
    toast.success(`Loaded "${scenario.name}"`);
  };

  const timeAgo = (date: Date | string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const analyzeMut = trpc.mortgageKiller.analyze.useMutation({
    onSuccess: () => {
      setActiveTab("current");
      toast.success("Analysis complete! Review your Current Plan and Recommended Plan.");
    },
    onError: (err) => toast.error(err.message),
  });
  const exportPdfMut = trpc.mortgageKiller.exportPdf.useMutation();
  const emailPdfMut = trpc.mortgageKiller.emailPdf.useMutation();

  const uploadMut = trpc.mortgageKiller.uploadStatement.useMutation();
  const extractMut = trpc.mortgageKiller.extractStatement.useMutation({
    onSuccess: (data) => {
      setForm((prev) => ({
        ...prev,
        mortgageBalance: data.mortgageBalance || prev.mortgageBalance,
        mortgageRate: data.mortgageRate || prev.mortgageRate,
        monthlyMortgagePayment: data.monthlyMortgagePayment || prev.monthlyMortgagePayment,
        monthlyInterestOnlyPayment: data.monthlyInterestOnlyPayment || prev.monthlyInterestOnlyPayment,
        totalInterestPayments: data.totalInterestPayments || prev.totalInterestPayments,
        mortgageTermMonths: data.mortgageTermMonths || prev.mortgageTermMonths,
        homeMarketValue: data.homeMarketValue || prev.homeMarketValue,
      }));
      toast.success("Mortgage statement data extracted successfully!");
      setUploading(false);
    },
    onError: (err) => {
      toast.error("Failed to extract: " + err.message);
      setUploading(false);
    },
  });

  const result = analyzeMut.data;

  const { publishResult } = useStrategy();
  useEffect(() => {
    if (!result) return;
    publishResult({
      type: "mortgage-killer",
      data: {
        interestSaved: result.summary.totalInterestSaved,
        yearsReduced: result.summary.yearsSaved,
        iulCashValue: result.summary.finalPolicyCashValue,
        iulDeathBenefit: result.summary.finalPolicyCashValue * 3,
        totalOpportunityCost: result.interestSavings.compoundedValue20yr,
        monthlyPayment: form.monthlyMortgagePayment,
        originalBalance: form.mortgageBalance,
        helocUsed: true,
        helocAmount: result.summary.totalHelocDrawn,
      },
    });
  }, [result]);

  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const monteCarloResult = useMemo(() => {
    if (!result || !showMonteCarlo) return null;
    return runMonteCarlo({
      simulations: 1000,
      years: 30,
      initialValue: result.summary.totalInterestSaved,
      ...MONTE_CARLO_PRESETS.iulModerate,
      floorReturn: 0,
      capReturn: strategyParams.iulCreditRate,
      annualContribution: result.summary.annualIulPremium || 0,
      contributionGrowthRate: 0,
    });
  }, [result, showMonteCarlo, strategyParams.iulCreditRate]);

  const [guidedMode, setGuidedMode] = useState(false);

  const dataFeedQuery = trpcClient.dataFeeds.snapshot.useQuery(undefined, { staleTime: 5 * 60_000 });
  const feedData = dataFeedQuery.data;

  const getReportSections = useCallback((): ReportSection[] => {
    if (!result) return [];
    return [
      {
        id: "summary",
        title: "Strategy Summary",
        items: [
          { label: "Original Mortgage Balance", value: fmt(form.mortgageBalance) },
          { label: "Interest Rate", value: fmtPct(form.mortgageRate) },
          { label: "Years Saved", value: `${result.summary.yearsSaved}+ years`, color: "emerald" },
          { label: "Total Interest Saved", value: fmt(result.summary.totalInterestSaved), color: "emerald" },
          { label: "Annual IUL Premium", value: fmt(result.summary.annualIulPremium) },
          { label: "Final IUL Cash Value", value: fmt(result.summary.finalPolicyCashValue), color: "blue" },
        ],
      },
      {
        id: "wealth",
        title: "Wealth Creation",
        items: [
          { label: "Total IUL Premiums Paid", value: fmt(result.summary.totalIulPremiums) },
          { label: "Total Policy Loans", value: fmt(result.summary.totalPolicyLoans) },
          { label: "Total HELOC Drawn", value: fmt(result.summary.totalHelocDrawn) },
          { label: "Compounded Interest Savings (20yr)", value: fmt(result.interestSavings.compoundedValue20yr) },
          { label: "Total Wealth Created", value: fmt(result.summary.totalWealthCreated), color: "emerald" },
        ],
      },
    ];
  }, [result, form]);

  const getReportBullets = useCallback((): string[] => {
    if (!result) return [];
    return [
      `By redirecting ${fmtPct(strategyParams.incomeAllocationPct)} of annual income into an IUL policy, ${clientName} can eliminate their mortgage ${result.summary.yearsSaved}+ years early.`,
      `Total interest saved: ${fmt(result.summary.totalInterestSaved)} compared to the current 30-year plan.`,
      `The IUL policy builds ${fmt(result.summary.finalPolicyCashValue)} in tax-advantaged cash value while simultaneously paying down the mortgage.`,
      `Compounding the interest savings in a MYGA at ${fmtPct(strategyParams.interestReinvestRate)} for 20 years yields ${fmt(result.interestSavings.compoundedValue20yr)} in additional wealth.`,
    ];
  }, [result, strategyParams, clientName]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File must be under 16MB");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const { url } = await uploadMut.mutateAsync({
          fileName: file.name,
          fileBase64: base64,
          contentType: file.type || "application/pdf",
        });
        await extractMut.mutateAsync({ fileUrl: url, fileName: file.name });
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("Upload failed");
    }
  };

  const runAnalysis = () => {
    analyzeMut.mutate({ ...form, ...strategyParams });
  };

  const scenarioAnalyzeMut = trpc.mortgageKiller.analyze.useMutation();

  const runScenarioComparison = useCallback(async () => {
    setScenarioLoading(true);
    setScenarioResults([]);
    const results: any[] = [];

    for (const preset of SCENARIO_PRESETS) {
      try {
        const res = await scenarioAnalyzeMut.mutateAsync({
          ...form,
          ...strategyParams,
          incomeAllocationPct: preset.allocationPct,
          helocRate: preset.helocRate,
        });
        results.push({ ...preset, result: res });
      } catch (err: any) {
        results.push({ ...preset, result: null, error: err.message });
      }
    }

    setScenarioResults(results);
    setScenarioLoading(false);
    setActiveTab("scenarios");
    toast.success("Scenario comparison complete! Review all paths side-by-side.");
  }, [form, strategyParams]);

  const handleExportPdf = async () => {
    if (!result) return;
    toast.info("Generating PDF report...");
    try {
      const report = await exportPdfMut.mutateAsync({ input: { ...form, ...strategyParams }, clientName });
      const binary = atob(report.contentBase64);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: report.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate PDF");
    }
  };

  const handleEmailPdf = async () => {
    if (!result || !emailTo) return;
    setEmailSending(true);
    try {
      await emailPdfMut.mutateAsync({ input: { ...form, ...strategyParams }, clientName, clientEmail: emailTo });
      toast.success(`PDF report sent to ${emailTo}`);
      setEmailDialogOpen(false);
      setEmailTo("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  const yearlyCurrentData = useMemo(() => {
    if (!result) return [];
    const schedule = result.currentPlan.schedule;
    const years = Math.ceil(schedule.length / 12);
    return Array.from({ length: years }, (_, i) => {
      const yearRows = schedule.filter((r) => r.year === i + 1);
      return {
        year: i + 1,
        principal: Math.round(yearRows.reduce((s: number, r: any) => s + r.principal, 0)),
        interest: Math.round(yearRows.reduce((s: number, r: any) => s + r.interest, 0)),
        balance: yearRows.length > 0 ? yearRows[yearRows.length - 1].endingBalance : 0,
      };
    });
  }, [result]);

  const yearlyRecommendedData = useMemo(() => {
    if (!result) return [];
    const schedule = result.recommendedPlan.schedule;
    const years = Math.ceil(schedule.length / 12);
    return Array.from({ length: years }, (_, i) => {
      const yearRows = schedule.filter((r) => r.year === i + 1);
      const extraPrincipal = yearRows.reduce((s: number, r: any) => s + (r.extraPrincipal || 0), 0);
      return {
        year: i + 1,
        principal: Math.round(yearRows.reduce((s: number, r: any) => s + r.principal, 0) - extraPrincipal),
        extraPrincipal: Math.round(extraPrincipal),
        interest: Math.round(yearRows.reduce((s: number, r: any) => s + r.interest, 0)),
        balance: yearRows.length > 0 ? yearRows[yearRows.length - 1].endingBalance : 0,
      };
    });
  }, [result]);

  const comparisonData = useMemo(() => {
    if (!result) return [];
    const maxYears = Math.max(
      Math.ceil(result.currentPlan.schedule.length / 12),
      Math.ceil(result.recommendedPlan.schedule.length / 12)
    );
    return Array.from({ length: maxYears }, (_, i) => {
      const yr = i + 1;
      const curRows = result.currentPlan.schedule.filter((r) => r.year === yr);
      const recRows = result.recommendedPlan.schedule.filter((r) => r.year === yr);
      return {
        year: yr,
        currentBalance: curRows.length > 0 ? curRows[curRows.length - 1].endingBalance : 0,
        recommendedBalance: recRows.length > 0 ? recRows[recRows.length - 1].endingBalance : 0,
      };
    });
  }, [result]);

  const interestSavingsData = useMemo(() => {
    if (!result) return [];
    return result.interestSavings.yearByYear;
  }, [result]);

  const [amortView, setAmortView] = useState<"monthly" | "yearly">("yearly");
  const [amortPage, setAmortPage] = useState(0);
  const [amortSubTab, setAmortSubTab] = useState<"doNothing" | "recommended" | "interestSaved" | "opportunityCost">("doNothing");
  const [doNothingPage, setDoNothingPage] = useState(0);
  const [recPage, setRecPage] = useState(0);
  const ROWS_PER_PAGE = 60; // 5 years per page for monthly

  const monthlySideBySideData = useMemo(() => {
    if (!result) return [];
    const cur = result.currentPlan.schedule;
    const rec = result.recommendedPlan.schedule;
    const maxMonths = Math.max(cur.length, rec.length);
    return Array.from({ length: maxMonths }, (_, i) => {
      const m = i + 1;
      const c = cur[i];
      const r = rec[i];
      return {
        month: m,
        year: Math.ceil(m / 12),
        curPayment: c?.payment ?? 0,
        curPrincipal: c?.principal ?? 0,
        curInterest: c?.interest ?? 0,
        curBalance: c?.endingBalance ?? 0,
        curCumInterest: c?.cumulativeInterest ?? 0,
        recPayment: r?.payment ?? 0,
        recPrincipal: r?.principal ?? 0,
        recInterest: r?.interest ?? 0,
        recExtra: r?.extraPrincipal ?? 0,
        recBalance: r?.endingBalance ?? 0,
        recCumInterest: r?.cumulativeInterest ?? 0,
        recSource: r?.source ?? "regular",
        interestDiff: (c?.cumulativeInterest ?? 0) - (r?.cumulativeInterest ?? 0),
        balanceDiff: (c?.endingBalance ?? 0) - (r?.endingBalance ?? 0),
      };
    });
  }, [result]);

  const yearlySideBySideData = useMemo(() => {
    if (!result) return [];
    const maxYears = Math.max(
      Math.ceil(result.currentPlan.schedule.length / 12),
      Math.ceil(result.recommendedPlan.schedule.length / 12)
    );
    return Array.from({ length: maxYears }, (_, i) => {
      const yr = i + 1;
      const curRows = result.currentPlan.schedule.filter((r) => r.year === yr);
      const recRows = result.recommendedPlan.schedule.filter((r) => r.year === yr);
      const curLast = curRows[curRows.length - 1];
      const recLast = recRows[recRows.length - 1];
      return {
        year: yr,
        curPrincipal: Math.round(curRows.reduce((s: number, r: any) => s + r.principal, 0)),
        curInterest: Math.round(curRows.reduce((s: number, r: any) => s + r.interest, 0)),
        curBalance: curLast?.endingBalance ?? 0,
        curCumInterest: curLast?.cumulativeInterest ?? 0,
        recPrincipal: Math.round(recRows.reduce((s: number, r: any) => s + r.principal, 0)),
        recExtra: Math.round(recRows.reduce((s: number, r: any) => s + (r.extraPrincipal || 0), 0)),
        recInterest: Math.round(recRows.reduce((s: number, r: any) => s + r.interest, 0)),
        recBalance: recLast?.endingBalance ?? 0,
        recCumInterest: recLast?.cumulativeInterest ?? 0,
        interestSaved: (curLast?.cumulativeInterest ?? 0) - (recLast?.cumulativeInterest ?? 0),
        balanceDiff: (curLast?.endingBalance ?? 0) - (recLast?.endingBalance ?? 0),
      };
    });
  }, [result]);

  const recommendedYearlyData = useMemo(() => {
    if (!result) return [];
    const maxYears = Math.ceil(result.recommendedPlan.schedule.length / 12);
    const totalHelocYears = result.helocSchedule.length;
    return Array.from({ length: maxYears }, (_, i) => {
      const yr = i + 1;
      const recRows = result.recommendedPlan.schedule.filter((r) => r.year === yr);
      const recLast = recRows[recRows.length - 1];
      const iulRow = result.iulPolicy.find((p) => p.year === yr);
      const helocRow = result.helocSchedule.find((h) => h.year === yr);
      return {
        year: yr,
        principal: Math.round(recRows.reduce((s: number, r: any) => s + (r.principal - (r.extraPrincipal || 0)), 0)),
        interest: Math.round(recRows.reduce((s: number, r: any) => s + r.interest, 0)),
        extraPrincipal: Math.round(recRows.reduce((s: number, r: any) => s + (r.extraPrincipal || 0), 0)),
        balance: recLast?.endingBalance ?? 0,
        cumInterest: recLast?.cumulativeInterest ?? 0,
        iulCashValue: iulRow?.cashValue ?? 0,
        iulSurrenderValue: iulRow?.surrenderValue ?? 0,
        iulPremium: iulRow?.premium ?? 0,
        iulPolicyLoan: iulRow?.policyLoan ?? 0,
        helocDraw: helocRow?.drawAmount ?? 0,
        helocBalance: helocRow?.balance ?? 0,
        helocInterest: helocRow?.interestPaid ?? 0,
        helocCumulativeInterest: helocRow?.cumulativeInterest ?? 0,
        iulCumulativeLoans: iulRow?.cumulativePolicyLoans ?? 0,
        iulLoanDrag: iulRow?.loanDragCost ?? 0,
        iulLoanableValue: iulRow?.loanableValue ?? 0,
        totalDebt: (recLast?.endingBalance ?? 0) + (helocRow?.balance ?? 0),
      };
    });
  }, [result]);

  const recommendedMonthlyData = useMemo(() => {
    if (!result) return [];
    return result.recommendedPlan.schedule.map((r: any, i: number) => {
      const yr = r.year;
      const iulRow = result.iulPolicy.find((p) => p.year === yr);
      const helocRow = result.helocSchedule.find((h) => h.year === yr);
      return {
        month: r.month,
        year: yr,
        payment: r.payment,
        principal: r.principal - (r.extraPrincipal || 0),
        interest: r.interest,
        extraPrincipal: r.extraPrincipal || 0,
        balance: r.endingBalance,
        cumInterest: r.cumulativeInterest,
        source: r.source || "regular",
        iulCashValue: iulRow?.cashValue ?? 0,
        iulSurrenderValue: iulRow?.surrenderValue ?? 0,
        helocBalance: helocRow?.balance ?? 0,
        helocInterest: helocRow?.interestPaid ?? 0,
      };
    });
  }, [result]);

  const mgaChartData = useMemo(() => {
    if (!result) return [];
    return result.interestSavings.yearByYear.map((row) => ({
      year: row.year,
      interestSaved: row.interestSaved,
      cumulativeSaved: row.cumulativeSaved,
      mgaAnnuityValue: row.mgaAnnuityValue,
      compoundedValue: row.compoundedValue,
    }));
  }, [result]);

  const scenarioComparisonChartData = useMemo(() => {
    if (scenarioResults.length === 0) return [];
    const validResults = scenarioResults.filter((s) => s.result);
    if (validResults.length === 0) return [];

    const maxYears = Math.max(
      ...validResults.map((s) => Math.ceil(s.result.currentPlan.schedule.length / 12)),
      ...validResults.map((s) => Math.ceil(s.result.recommendedPlan.schedule.length / 12))
    );

    return Array.from({ length: maxYears }, (_, i) => {
      const yr = i + 1;
      const row: any = { year: yr };

      const curRows = validResults[0].result.currentPlan.schedule.filter((r) => r.year === yr);
      row.currentBalance = curRows.length > 0 ? curRows[curRows.length - 1].endingBalance : 0;

      validResults.forEach((s, idx) => {
        const recRows = s.result.recommendedPlan.schedule.filter((r) => r.year === yr);
        row[`scenario${idx}`] = recRows.length > 0 ? recRows[recRows.length - 1].endingBalance : 0;
      });

      return row;
    });
  }, [scenarioResults]);

  const scenarioWealthData = useMemo(() => {
    if (scenarioResults.length === 0) return [];
    return scenarioResults
      .filter((s) => s.result)
      .map((s) => ({
        name: s.label,
        interestSaved: s.result.summary.totalInterestSaved,
        compoundedValue: s.result.interestSavings.compoundedValue20yr,
        totalWealth: s.result.summary.totalWealthCreated,
        yearsSaved: s.result.summary.yearsSaved,
        fill: s.color,
      }));
  }, [scenarioResults]);

  const scenarioRadarData = useMemo(() => {
    if (scenarioResults.length === 0) return [];
    const validResults = scenarioResults.filter((s) => s.result);
    if (validResults.length === 0) return [];

    const maxInterest = Math.max(...validResults.map((s) => s.result.summary.totalInterestSaved));
    const maxWealth = Math.max(...validResults.map((s) => s.result.summary.totalWealthCreated));
    const maxYears = Math.max(...validResults.map((s) => s.result.summary.yearsSaved));
    const maxPremium = Math.max(...validResults.map((s) => s.result.summary.annualIulPremium));

    return [
      { metric: "Interest Saved", ...Object.fromEntries(validResults.map((s, i) => [`s${i}`, Math.round((s.result.summary.totalInterestSaved / maxInterest) * 100)])) },
      { metric: "Wealth Created", ...Object.fromEntries(validResults.map((s, i) => [`s${i}`, Math.round((s.result.summary.totalWealthCreated / maxWealth) * 100)])) },
      { metric: "Years Saved", ...Object.fromEntries(validResults.map((s, i) => [`s${i}`, Math.round((s.result.summary.yearsSaved / maxYears) * 100)])) },
      { metric: "Lower Premium", ...Object.fromEntries(validResults.map((s, i) => [`s${i}`, Math.round(((maxPremium - s.result.summary.annualIulPremium) / maxPremium) * 100 + 20)])) },
      { metric: "Speed", ...Object.fromEntries(validResults.map((s, i) => [`s${i}`, Math.round((s.result.summary.monthsSaved / Math.max(...validResults.map((v) => v.result.summary.monthsSaved))) * 100)])) },
    ];
  }, [scenarioResults]);

  const totalAssets = form.iraValue + form.cashValue + form.investments + form.annuities + form.otherInvestments + form.cryptocurrency;

  const tm = useTimeMachine();

  const tmOverlay = useMemo<IllustrationYear[]>(() => {
    if (!tm.toggleProps.enabled || !result) return [];
    const annualPremium = result.summary.annualIulPremium;
    const projYears = Math.max(
      Math.ceil(result.recommendedPlan.schedule.length / 12),
      30
    );
    return tm.generateOverlay(
      { annualPremium, fundingYears: strategyParams.premiumYears },
      strategyParams.clientAge,
      projYears,
    );
  }, [tm.toggleProps.enabled, tm.toggleProps.selectedOptions, tm.toggleProps.startYear, result, strategyParams.premiumYears, strategyParams.clientAge]);

  const TM_TOOLTIP = "This Time Machine value represents a hypothetical pre-existing account large enough that, when credited at AG 49-compliant rates (0\u20137.5%), it produces the same dollar interest credit that the actual 30-year historical index return would have generated. No AG 49 laws are violated \u2014 we are illustrating compliant crediting rates applied to a larger account, not illustrating non-compliant rates.";

  const numField = (key: keyof typeof form, label: string, icon: React.ReactNode, prefix = "$") => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
        <span className="shrink-0">{icon}</span> <span className="truncate">{label}</span>
      </Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
        <NumberInput
          value={form[key] as number}
          onChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
          className={prefix ? "pl-7" : ""}
        />
      </div>
      <TimeMachineInlineDisclaimer />
    </div>
  );

  return (
    <AppShell>
      <div className="container max-w-7xl py-8 space-y-8">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="MortgageKiller" />

        <ExecutiveSummary
          pageTitle="Mortgage Killer"
          whatItDoes="This real estate strategy tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex real estate strategy concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Your home equity is likely your largest untapped asset. Strategic use of HELOCs, mortgage optimization, and property recycling can turn dead equity into working capital."
          intent="To give you the same caliber of real estate strategy analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your real estate strategy options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how real estate strategy strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this real estate strategy strategy interact with my other financial plans?",
            "What\'s the single biggest real estate strategy opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Mortgage Killer" pageContext="Mortgage Killer — real estate strategy modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This real estate strategy strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended real estate strategy approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={550000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Equity Deployed", doNothing: 0, recommended: 350000, format: "currency" },
            { label: "Mortgage Interest Saved", doNothing: 0, recommended: 180000, format: "currency" },
            { label: "Net Worth Impact", doNothing: 0, recommended: 550000, format: "currency" },
          ]}
          summary="Without taking action on real estate strategy, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white">
                <Home className="h-6 w-6" />
              </div>
              Mortgage Killer Strategy
            </h1>
            <p className="text-muted-foreground mt-1">
              70% LTV HELOC → IUL Premium → 80% Life Loan → Principal-Only Mortgage Payment. 5-year max. Repeat until paid in full.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {result && (
              <>
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {result.summary.yearsSaved}+ Years Saved
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 px-3 py-1.5">
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  {fmt(result.summary.totalInterestSaved)} Saved
                </Badge>
                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                  <Download className="h-4 w-4 mr-1" /> Export PDF
                </Button>
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-1" /> Email PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Email Mortgage Killer Report</DialogTitle>
                      <DialogDescription>Send the branded PDF report to your client's email address.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <Label>Recipient Email</Label>
                      <Input
                        type="email"
                        placeholder="client@example.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleEmailPdf} disabled={!emailTo || emailSending}>
                        {emailSending ? (
                          <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Sending...</>
                        ) : (
                          <><Mail className="h-4 w-4 mr-1" /> Send Report</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* ─── Calculation Sync Bar ──────────────────────────── */}
        <CalculationSyncBar />
        {/* ─── Cross-Tool Integration Banner ────────────────────────── */}
        <StrategyFlowBanner         currentStrategy="mortgage-killer"
          onApplyInbound={(flowData) => {
            if (flowData.initialInvestment) {
              setForm(p => ({ ...p, mortgageBalance: flowData.initialInvestment }));
            }
          }}
        />

        {/* ─── Real-Time Market Data Feed ──────────────────────────── */}
        {feedData && (
          <DataFeedInline
            feeds={[
              ...(feedData.treasuryRates?.slice(0, 3).map((t) => ({
                name: t.term,
                value: `${t.yield?.toFixed(2) ?? t.value?.toFixed(2)}%`,
                source: t.source as "live" | "cached" | "static",
              })) ?? []),
              ...(feedData.mygaRates?.slice(0, 2).map((m) => ({
                name: `${m.term}yr MYGA`,
                value: `${m.bestRate}%`,
                source: m.source as "live" | "cached" | "static",
              })) ?? []),
            ]}
          />
        )}

        {/* ─── Mode Toggle & Report Button ─────────────────────────── */}
        <div className="flex items-center justify-between">
          <GuidedModeToggle isGuided={guidedMode} onToggle={setGuidedMode} />
          <div className="flex items-center gap-2">
            {result && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMonteCarlo(!showMonteCarlo)}
                className={showMonteCarlo ? "border-purple-500/40 text-purple-400" : ""}
              >
                <Activity className="h-4 w-4 mr-1" />
                {showMonteCarlo ? "Hide" : "Show"} Monte Carlo
              </Button>
            )}
            {result && (
              <>
                <ReportGenerator
                  pageTitle="Mortgage Killer Strategy"
                  getSections={getReportSections}
                  getBullets={getReportBullets}
                />
                <ExportToSlides
                  toolName="Mortgage Killer Strategy"
                  getSections={getReportSections}
                  getBullets={getReportBullets}
                />
              </>
            )}
          </div>
        </div>

        {/* ─── Monte Carlo Simulation Results ──────────────────────── */}
        {showMonteCarlo && monteCarloResult && (
          <MonteCarloChart
            result={monteCarloResult}
            title="Monte Carlo: IUL Cash Value Projection"
            subtitle={`${monteCarloResult.config.simulations?.toLocaleString()} simulations with ${fmtPct(strategyParams.iulCreditRate)} cap, 0% floor`}
            targetValue={form.mortgageBalance}
            targetLabel={`Mortgage Balance: ${fmt(form.mortgageBalance)}`}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full">
            <TabsTrigger value="factfinder" className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap">Fact Finder</TabsTrigger>
            <TabsTrigger value="current" disabled={!result} className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap">Current Plan</TabsTrigger>
            <TabsTrigger value="recommended" disabled={!result} className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap">Recommended</TabsTrigger>
            <TabsTrigger value="projection" disabled={!result} className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap">30-Year Projection</TabsTrigger>
            <TabsTrigger value="savings" disabled={!result} className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap">Savings</TabsTrigger>
            <TabsTrigger value="scenarios" disabled={scenarioResults.length === 0 && !result} className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap">Scenarios</TabsTrigger>
            <TabsTrigger value="amortization" disabled={!result} className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap">Amortization</TabsTrigger>
            <TabsTrigger value="details" disabled={!result} className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap">Details</TabsTrigger>
            <TabsTrigger value="generate-outcome" disabled={!result} className="text-[11px] sm:text-xs px-2 py-1.5 flex-1 min-w-[80px] whitespace-nowrap bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

               {/* ─── TAB 1: FACT FINDER ────────────────────────────────── */}
          <TabsContent value="factfinder" className="space-y-6 mt-6">
            {/* Client Selector & Scenario Save/Load */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Client Selector */}
                  <div className="flex-1">
                    <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" /> Select Client
                    </Label>
                    <Select
                      value={selectedClientId ? String(selectedClientId) : ""}
                      onValueChange={(v) => setSelectedClientId(v ? Number(v) : null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a client to auto-populate..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}{c.email ? ` (${c.email})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedClient && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Income: {fmt(Number(selectedClient.income ?? 0))} • Age: {selectedClient.age ?? "N/A"} • IRA: {fmt(Number(selectedClient.iraBalance ?? 0))}
                      </p>
                    )}
                  </div>

                  {/* Save Scenario */}
                  <div className="flex-1">
                    <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Save className="h-4 w-4 text-green-500" /> Save Scenario
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Scenario name (optional)"
                        value={scenarioName}
                        onChange={(e) => setScenarioName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={handleSaveScenario}
                        disabled={!selectedClientId || saveMutation.isPending}
                        className="whitespace-nowrap"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {saveMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                    {!selectedClientId && (
                      <p className="text-xs text-amber-600 mt-1">Select a client to enable save/load</p>
                    )}
                  </div>
                </div>

                {/* Saved Scenarios List */}
                {selectedClientId && savedScenarios.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-purple-500" /> Saved Scenarios for {clientName}
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                      {savedScenarios
                        .filter((s) => s.scenarioType === "MORTGAGE_KILLER")
                        .map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{timeAgo(s.createdAt)}</p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button variant="ghost" size="sm" onClick={() => handleLoadScenario(s)} className="h-7 px-2">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate({ id: s.id })}
                              className="h-7 px-2 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-semibold text-blue-900">Upload Mortgage Statement</h3>
                    <p className="text-sm text-blue-700">
                      Don't know your numbers? Upload your monthly mortgage statement and we'll extract them automatically automatically.
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleUpload}
                    />
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Upload Statement
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mortgage Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Home className="h-5 w-5 text-red-500" /> Mortgage Details
                  </CardTitle>
                  <CardDescription>Current mortgage information</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {numField("mortgageBalance", "Mortgage Balance", <Landmark className="h-3.5 w-3.5" />)}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5" /> Interest Rate
                    </Label>
                    <div className="relative">
                      <NumberInput
                        step="0.001"
                        value={parseFloat((form.mortgageRate * 100).toFixed(2))}
                        onChange={(v) => setForm((p) => ({ ...p, mortgageRate: v / 100 }))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Remaining Term (months)
                    </Label>
                    <NumberInput
                      value={form.mortgageTermMonths}
                      onChange={(v) => setForm((p) => ({ ...p, mortgageTermMonths: Math.round(v) }))}
                      fallback={360}
                    />
                  </div>
                  {numField("monthlyMortgagePayment", "Monthly Payment (P&I)", <Banknote className="h-3.5 w-3.5" />)}
                  {numField("monthlyInterestOnlyPayment", "Monthly Interest Only", <Percent className="h-3.5 w-3.5" />)}
                  {numField("totalInterestPayments", "Total Interest (Life of Loan)", <AlertTriangle className="h-3.5 w-3.5" />)}
                  {numField("homeMarketValue", "Home Market Value", <Home className="h-3.5 w-3.5" />)}
                  {numField("homeEquityValue", "Home Equity Value", <TrendingUp className="h-3.5 w-3.5" />)}
                </CardContent>
              </Card>

              {/* Assets & Income */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5 text-green-500" /> Assets & Income
                  </CardTitle>
                  <CardDescription>Financial snapshot for strategy calculation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {numField("annualIncome", "Annual Income", <DollarSign className="h-3.5 w-3.5" />)}
                    {numField("iraValue", "IRA Value", <PiggyBank className="h-3.5 w-3.5" />)}
                    {numField("cashValue", "Illustrated Policy Value (Life Ins.)", <Shield className="h-3.5 w-3.5" />)}
                    {numField("investments", "Investments", <BarChart3 className="h-3.5 w-3.5" />)}
                    {numField("annuities", "Annuities", <Landmark className="h-3.5 w-3.5" />)}
                    {numField("otherInvestments", "Other Investments", <TrendingUp className="h-3.5 w-3.5" />)}
                    {numField("cryptocurrency", "Cryptocurrency", <Bitcoin className="h-3.5 w-3.5" />)}
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total Assets</span>
                    <span className="text-lg font-bold text-green-600">{fmt(totalAssets)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strategy Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="h-5 w-5 text-purple-500" /> Strategy Parameters
                </CardTitle>
                <CardDescription>Adjust the Mortgage Killer strategy assumptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Income Allocation: {(strategyParams.incomeAllocationPct * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[strategyParams.incomeAllocationPct * 100]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, incomeAllocationPct: v / 100 }))}
                      min={5} max={50} step={1}
                    />
                    <p className="text-xs text-muted-foreground">Percentage of income allocated to IUL premium</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">IUL Credit Rate: {(strategyParams.iulCreditRate * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[strategyParams.iulCreditRate * 100]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, iulCreditRate: v / 100 }))}
                        min={4} max={7.5} step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">NAIC AG 49 max illustrated rate: 7.5%. 30-year historical averages exceed this but we follow the rules.</p>
                  </div>
                  {/* ─── Ibbotson Model Toggle ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Use Ibbotson Historical Model</Label>
                      <Switch checked={useIbbotsonModel} onCheckedChange={setUseIbbotsonModel} />
                    </div>
                    {useIbbotsonModel && (
                      <IbbotsonYearSelector
                        startYear={ibbotsonStartYear}
                        onStartYearChange={setIbbotsonStartYear}
                        capRate={strategyParams.iulCreditRate}
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Premium Years: {strategyParams.premiumYears}</Label>
                    <Slider
                      value={[strategyParams.premiumYears]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, premiumYears: v }))}
                      min={5} max={20} step={1}
                    />
                    <p className="text-xs text-muted-foreground">Number of years paying IUL premium</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">HELOC Rate: {(strategyParams.helocRate * 100).toFixed(1)}%</Label>
                    <Slider
                      value={[strategyParams.helocRate * 100]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, helocRate: v / 100 }))}
                      min={3} max={15} step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">Home equity line of credit interest rate</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">HELOC LTV: {(strategyParams.helocLtvPct * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[strategyParams.helocLtvPct * 100]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, helocLtvPct: v / 100 }))}
                      min={10} max={90} step={5}
                    />
                    <p className="text-xs text-muted-foreground">HELOC max loan-to-value ceiling</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">HELOC Draw %: {(strategyParams.helocDrawPct * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[strategyParams.helocDrawPct * 100]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, helocDrawPct: v / 100 }))}
                      min={10} max={50} step={5}
                    />
                    <p className="text-xs text-muted-foreground">% of available equity drawn per HELOC cycle (35% default)</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Policy Loan %: {(strategyParams.policyLoanPct * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[strategyParams.policyLoanPct * 100]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, policyLoanPct: v / 100 }))}
                      min={10} max={95} step={5}
                    />
                    <p className="text-xs text-muted-foreground">% of surrender value taken as policy loan</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Loan Drag Rate: {(strategyParams.policyLoanDragRate * 100).toFixed(1)}%</Label>
                    <Slider
                      value={[strategyParams.policyLoanDragRate * 100]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, policyLoanDragRate: v / 100 }))}
                      min={3} max={8} step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">5% loan rate (+0.5% positive arbitrage)</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Interest Reinvest Rate: {(strategyParams.interestReinvestRate * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[strategyParams.interestReinvestRate * 100]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, interestReinvestRate: v / 100 }))}
                      min={3} max={7.5} step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">Compound rate on saved interest (AG 49 max: 7.5%)</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Client Age: {strategyParams.clientAge}</Label>
                    <Slider
                      value={[strategyParams.clientAge]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, clientAge: v }))}
                      min={18} max={80} step={1}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Reinvest Years: {strategyParams.interestReinvestYears}</Label>
                    <Slider
                      value={[strategyParams.interestReinvestYears]}
                      onValueChange={([v]) => setStrategyParams((p) => ({ ...p, interestReinvestYears: v }))}
                      min={5} max={40} step={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Oil & Gas Tax Optimization Toggle */}
            <OilGasToggle compact taxableIncome={form.annualIncome || 250000} />

            {/* Time Machine — Historical Performance Overlay */}
            <TimeMachineToggle {...tm.toggleProps} />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white h-14 text-lg"
                onClick={runAnalysis}
                disabled={analyzeMut.isPending}
              >
                {analyzeMut.isPending ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Running Analysis...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5 mr-2" />
                    Run Mortgage Killer Analysis
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-lg border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={runScenarioComparison}
                disabled={scenarioLoading}
              >
                {scenarioLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Running 4 Scenarios...
                  </>
                ) : (
                  <>
                    <GitCompare className="h-5 w-5 mr-2" />
                    Compare Scenarios (15/20/25/30%)
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* ─── TAB 2: CURRENT PLAN ─────────────────────────────────────── */}
          <TabsContent value="current" className="space-y-6 mt-6">
            {result && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-red-600 font-medium">Total Interest Paid</p>
                      <p className="text-2xl font-bold text-red-700">{fmt(result.currentPlan.totalInterest)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-slate-600 font-medium">Total Payments</p>
                      <p className="text-2xl font-bold text-slate-700">{fmt(result.currentPlan.totalPayments)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-slate-600 font-medium">Monthly Payment</p>
                      <p className="text-2xl font-bold text-slate-700">{fmt(result.currentPlan.monthlyPayment)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-slate-600 font-medium">Payoff Timeline</p>
                      <p className="text-2xl font-bold text-slate-700">{fmtMo(result.currentPlan.payoffMonths)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan — Standard Amortization Schedule</CardTitle>
                    <CardDescription>Your mortgage as-is: principal vs. interest breakdown by year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={yearlyCurrentData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Bar dataKey="principal" stackId="a" fill="#3b82f6" name="Principal" />
                          <Bar dataKey="interest" stackId="a" fill="#ef4444" name="Interest" />
                          <Line type="monotone" dataKey="balance" stroke="#f59e0b" strokeWidth={2} dot={false} name="Remaining Balance" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Yearly Amortization Detail</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background border-b">
                          <tr>
                            <th className="text-left p-2">Year</th>
                            <th className="text-right p-2">Principal</th>
                            <th className="text-right p-2">Interest</th>
                            <th className="text-right p-2">Total Paid</th>
                            <th className="text-right p-2">Remaining Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearlyCurrentData.map((row) => (
                            <tr key={row.year} className="border-b border-muted/30 hover:bg-muted/20">
                              <td className="p-2 font-medium">{row.year}</td>
                              <td className="text-right p-2 text-blue-600">{fmt(row.principal)}</td>
                              <td className="text-right p-2 text-red-600">{fmt(row.interest)}</td>
                              <td className="text-right p-2">{fmt(row.principal + row.interest)}</td>
                              <td className="text-right p-2 font-medium">{fmt(row.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ─── TAB 3: RECOMMENDED PLAN ─────────────────────────────────── */}
          <TabsContent value="recommended" className="space-y-6 mt-6">
            {result && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-green-600 font-medium">Total Interest Paid</p>
                      <p className="text-2xl font-bold text-green-700">{fmt(result.recommendedPlan.totalInterest)}</p>
                      <p className="text-xs text-green-500 mt-1">
                        Save {fmt(result.currentPlan.totalInterest - result.recommendedPlan.totalInterest)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-green-600 font-medium">Payoff Timeline</p>
                      <p className="text-2xl font-bold text-green-700">{fmtMo(result.recommendedPlan.payoffMonths)}</p>
                      <p className="text-xs text-green-500 mt-1">
                        {result.summary.yearsSaved}y {result.summary.monthsSaved % 12}m faster
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-purple-600 font-medium">Annual IUL Premium</p>
                      <p className="text-2xl font-bold text-purple-700">{fmt(result.summary.annualIulPremium)}</p>
                      <p className="text-xs text-purple-500 mt-1">{fmtPct(strategyParams.incomeAllocationPct)} of income</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-blue-600 font-medium">Total Policy Loans</p>
                      <p className="text-2xl font-bold text-blue-700">{fmt(result.summary.totalPolicyLoans)}</p>
                      <p className="text-xs text-blue-500 mt-1">Applied to principal</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Time Machine Summary Cards */}
                {tm.toggleProps.enabled && tmOverlay.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-amber-50 border-amber-300 border-2">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-amber-700 font-medium">TM Account Value (Yr 30)</p>
                        <p className="text-2xl font-bold text-amber-800">{fmt(tmOverlay[Math.min(29, tmOverlay.length - 1)]?.accountValue ?? 0)}</p>
                        <p className="text-[10px] text-amber-600 mt-1" title={TM_TOOLTIP}>Historical index crediting</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-300 border-2">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-amber-700 font-medium">TM Surrender Value (Yr 30)</p>
                        <p className="text-2xl font-bold text-amber-800">{fmt(tmOverlay[Math.min(29, tmOverlay.length - 1)]?.surrenderValue ?? 0)}</p>
                        <p className="text-[10px] text-amber-600 mt-1" title={TM_TOOLTIP}>vs. flat-rate illustration</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-300 border-2">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-amber-700 font-medium">TM Peak Interest Credit</p>
                        <p className="text-2xl font-bold text-amber-800">{fmt(Math.max(...tmOverlay.map((r) => r.interestCredit)))}</p>
                        <p className="text-[10px] text-amber-600 mt-1" title={TM_TOOLTIP}>Best single-year credit</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-300 border-2">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-amber-700 font-medium">TM Effective Return</p>
                        <p className="text-2xl font-bold text-amber-800">{((tmOverlay[Math.min(29, tmOverlay.length - 1)]?.effectiveReturnOnPremium ?? 0) * 100).toFixed(1)}%</p>
                        <p className="text-[10px] text-amber-600 mt-1" title={TM_TOOLTIP}>On original premiums</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Plan — Accelerated Payoff</CardTitle>
                    <CardDescription>
                      IUL policy loan payments shown in <span className="text-emerald-600 font-semibold">green</span> — applied as principal-only payments.
                      {tm.toggleProps.enabled && <span className="text-amber-600 font-semibold"> Gold lines = Time Machine historical overlay.</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={yearlyRecommendedData.map((row, i) => {
                          const tmRow = tmOverlay[i];
                          return {
                            ...row,
                            ...(tm.toggleProps.enabled && tmRow ? {
                              tmAccountValue: Math.round(tmRow.accountValue),
                              tmSurrenderValue: Math.round(tmRow.surrenderValue),
                              tmInterestCredit: Math.round(tmRow.interestCredit),
                            } : {}),
                          };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(v: number, name: string) => [
                              fmt(v),
                              name,
                            ]}
                            labelFormatter={(yr) => {
                              if (!tm.toggleProps.enabled) return `Year ${yr}`;
                              return `Year ${yr} \u2014 Gold values show what historical index returns would have produced using a Time Machine-sized account at AG 49-compliant rates.`;
                            }}
                          />
                          <Legend />
                          <Bar dataKey="principal" stackId="a" fill="#3b82f6" name="Regular Principal" />
                          <Bar dataKey="extraPrincipal" stackId="a" fill="#10b981" name="IUL Loan \u2192 Principal" />
                          <Bar dataKey="interest" stackId="a" fill="#ef4444" name="Interest" />
                          <Line type="monotone" dataKey="balance" stroke="#f59e0b" strokeWidth={2} dot={false} name="Remaining Balance" />
                          {tm.toggleProps.enabled && (
                            <Line type="monotone" dataKey="tmAccountValue" stroke="#d97706" strokeWidth={2.5} dot={false} strokeDasharray="8 4" name="\u2728 TM Account Value (Gold)" />
                          )}
                          {tm.toggleProps.enabled && (
                            <Line type="monotone" dataKey="tmSurrenderValue" stroke="#b45309" strokeWidth={2} dot={false} strokeDasharray="4 4" name="\u2728 TM Surrender Value (Gold)" />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Side-by-side Balance Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Balance Comparison: Current vs. Recommended</CardTitle>
                    <CardDescription>See how quickly the recommended plan eliminates your mortgage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Area type="monotone" dataKey="currentBalance" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} name="Current Plan Balance" />
                          <Area type="monotone" dataKey="recommendedBalance" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="Recommended Plan Balance" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Extra Payments Table */}
                <Card>
                  <CardHeader><CardTitle>IUL Policy Loan Payments Applied to Mortgage</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background border-b">
                          <tr>
                            <th className="text-left p-2">Month</th>
                            <th className="text-left p-2">Source</th>
                            <th className="text-right p-2">Amount → Principal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.recommendedPlan.extraPayments.map((ep: any, i: number) => (
                            <tr key={i} className="border-b border-muted/30 bg-green-50/50">
                              <td className="p-2 font-medium">Month {ep.month}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                  {ep.source}
                                </Badge>
                              </td>
                              <td className="text-right p-2 font-bold text-emerald-600">{fmt(ep.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Yearly Amortization Detail */}
                <Card>
                  <CardHeader><CardTitle>Recommended Plan — Yearly Detail</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background border-b">
                          <tr>
                            <th className="text-left p-2">Year</th>
                            <th className="text-right p-2">Regular Principal</th>
                            <th className="text-right p-2">Extra Principal</th>
                            <th className="text-right p-2">Interest</th>
                            <th className="text-right p-2">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearlyRecommendedData.map((row) => (
                            <tr key={row.year} className={`border-b border-muted/30 hover:bg-muted/20 ${row.extraPrincipal > 0 ? "bg-green-50/30" : ""}`}>
                              <td className="p-2 font-medium">{row.year}</td>
                              <td className="text-right p-2 text-blue-600">{fmt(row.principal)}</td>
                              <td className="text-right p-2 text-emerald-600 font-semibold">
                                {row.extraPrincipal > 0 ? fmt(row.extraPrincipal) : "\u2014"}
                              </td>
                              <td className="text-right p-2 text-red-600">{fmt(row.interest)}</td>
                              <td className="text-right p-2 font-medium">{fmt(row.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ─── TAB: 30-YEAR CASCADING PROJECTION ──────────────────────── */}
          <TabsContent value="projection" className="space-y-6 mt-6">
            {result && result.cascadingProjection && (
              <>
                {/* Before vs After Graph */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" /> Before vs. After — 30-Year Mortgage Balance
                    </CardTitle>
                    <CardDescription>
                      Red = Do Nothing (standard amortization). Green = Mortgage Killer strategy with IUL + HELOC acceleration.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.cascadingProjection.map((row: any, i: number) => {
                          const curRow = result.currentPlan.schedule.filter((r) => r.year === row.year);
                          const curBal = curRow.length > 0 ? curRow[curRow.length - 1].endingBalance : 0;
                          return { year: row.year, doNothing: Math.round(curBal), recommended: Math.round(row.mortgageBalance) };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Area type="monotone" dataKey="doNothing" stroke="#ef4444" fill="#fecaca" fillOpacity={0.4} strokeWidth={2} name="Do Nothing Balance" />
                          <Area type="monotone" dataKey="recommended" stroke="#10b981" fill="#a7f3d0" fillOpacity={0.4} strokeWidth={2} name="Mortgage Killer Balance" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Net Worth Growth Graph */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-500" /> Net Worth & Home Value Growth
                    </CardTitle>
                    <CardDescription>
                      Home appreciates 5% annually. Net worth = Home Value + IUL Cash Value - Mortgage Balance - HELOC Balance - Life Loans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={result.cascadingProjection}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Area type="monotone" dataKey="homeValue" stroke="#8b5cf6" fill="#ede9fe" fillOpacity={0.3} strokeWidth={2} name="Home Value (5% Appreciation)" />
                          <Line type="monotone" dataKey="iulCashValue" stroke="#3b82f6" strokeWidth={2} dot={false} name="IUL Cash Value" />
                          <Line type="monotone" dataKey="netWorth" stroke="#10b981" strokeWidth={3} dot={false} name="Net Worth" />
                          <Area type="monotone" dataKey="mortgageBalance" stroke="#ef4444" fill="#fecaca" fillOpacity={0.2} strokeWidth={1} strokeDasharray="5 5" name="Mortgage Balance" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 30-Year Cascading Projection Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-indigo-500" /> 30-Year Cascading Projection — All Values
                    </CardTitle>
                    <CardDescription>
                      Complete year-by-year breakdown: home values, equity, HELOC, IUL policy, life loans, mortgage balance, and net worth
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                      <table className="w-full text-[8px] sm:text-[9px] border-collapse" style={{ minWidth: '1400px' }}>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-slate-100 dark:bg-slate-800">
                            <th rowSpan={2} className="p-1 border text-center font-bold bg-slate-200 dark:bg-slate-700">Yr</th>
                            <th colSpan={3} className="p-1 border text-center font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700">Home</th>
                            <th colSpan={3} className="p-1 border text-center font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700">HELOC</th>
                            <th colSpan={4} className="p-1 border text-center font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700">IUL Policy</th>
                            <th colSpan={2} className="p-1 border text-center font-bold bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700">Life Loan</th>
                            <th colSpan={4} className="p-1 border text-center font-bold bg-green-50 dark:bg-green-900/30 text-green-700">Mortgage</th>
                            <th className="p-1 border text-center font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700">Net</th>
                          </tr>
                          <tr className="bg-slate-50 dark:bg-slate-800 text-[7px] sm:text-[8px]">
                            <th className="p-0.5 border text-right text-purple-600">Value</th>
                            <th className="p-0.5 border text-right text-purple-600">Equity</th>
                            <th className="p-0.5 border text-right text-purple-600">Apprec.</th>
                            <th className="p-0.5 border text-right text-amber-600">Balance</th>
                            <th className="p-0.5 border text-right text-amber-600">Int. Paid</th>
                            <th className="p-0.5 border text-right text-amber-600">IO Pmt</th>
                            <th className="p-0.5 border text-right text-blue-600">Premium</th>
                            <th className="p-0.5 border text-right text-blue-600">Cash Val</th>
                            <th className="p-0.5 border text-right text-blue-600">Surr. Val</th>
                            <th className="p-0.5 border text-right text-blue-600">Int. Credit</th>
                            <th className="p-0.5 border text-right text-cyan-600">This Year</th>
                            <th className="p-0.5 border text-right text-cyan-600">Cumulative</th>
                            <th className="p-0.5 border text-right text-green-600">Balance</th>
                            <th className="p-0.5 border text-right text-green-600">Int. Paid</th>
                            <th className="p-0.5 border text-right text-green-600">Princ. Pmt</th>
                            <th className="p-0.5 border text-right text-green-600">Source</th>
                            <th className="p-0.5 border text-right text-emerald-600 font-bold">Worth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.cascadingProjection.map((row: any, idx: number) => {
                            const isPaidOff = row.mortgageBalance <= 0;
                            const justPaidOff = isPaidOff && idx > 0 && result.cascadingProjection[idx - 1].mortgageBalance > 0;
                            return (
                              <tr
                                key={row.year}
                                className={`border-b transition-colors ${
                                  justPaidOff
                                    ? "bg-emerald-100 dark:bg-emerald-900/40 font-bold"
                                    : isPaidOff
                                      ? "bg-gray-50 dark:bg-gray-800/50 text-muted-foreground"
                                      : idx % 2 === 0
                                        ? "bg-white dark:bg-slate-900"
                                        : "bg-slate-50/50 dark:bg-slate-800/30"
                                } hover:bg-green-50/50 dark:hover:bg-green-900/20`}
                              >
                                <td className="p-1 border text-center font-bold">{row.year}</td>
                                <td className="p-1 border text-right text-purple-600">{fmt(row.homeValue)}</td>
                                <td className="p-1 border text-right text-purple-500">{fmt(row.homeEquity)}</td>
                                <td className="p-1 border text-right text-purple-400">{fmt(row.homeAppreciation)}</td>
                                <td className="p-1 border text-right text-amber-600">{row.helocBalance > 0 ? fmt(row.helocBalance) : "\u2014"}</td>
                                <td className="p-1 border text-right text-amber-500">{row.helocInterestPaid > 0 ? fmt(row.helocInterestPaid) : "\u2014"}</td>
                                <td className="p-1 border text-right text-amber-400">{row.helocInterestOnlyPayment > 0 ? fmt(row.helocInterestOnlyPayment) : "\u2014"}</td>
                                <td className="p-1 border text-right text-blue-600">{row.iulPremium > 0 ? fmt(row.iulPremium) : "\u2014"}</td>
                                <td className="p-1 border text-right text-blue-500">{fmt(row.iulCashValue)}</td>
                                <td className="p-1 border text-right text-blue-400">{fmt(row.iulSurrenderValue)}</td>
                                <td className="p-1 border text-right text-blue-700 font-semibold">{row.iulInterestCredit > 0 ? fmt(row.iulInterestCredit) : "\u2014"}</td>
                                <td className="p-1 border text-right text-cyan-600">{row.lifeLoanAmount > 0 ? fmt(row.lifeLoanAmount) : "\u2014"}</td>
                                <td className="p-1 border text-right text-cyan-500">{row.lifeLoanCumulative > 0 ? fmt(row.lifeLoanCumulative) : "\u2014"}</td>
                                <td className={`p-1 border text-right font-medium ${isPaidOff ? "text-emerald-600 font-bold" : "text-green-600"}`}>
                                  {isPaidOff ? "PAID OFF" : fmt(row.mortgageBalance)}
                                </td>
                                <td className="p-1 border text-right text-green-500">{row.mortgageInterestPaid > 0 ? fmt(row.mortgageInterestPaid) : "\u2014"}</td>
                                <td className="p-1 border text-right text-green-700 font-semibold">{row.principalOnlyPayment > 0 ? fmt(row.principalOnlyPayment) : "\u2014"}</td>
                                <td className="p-1 border text-center text-[7px]">
                                  {row.principalPaymentSource ? (
                                    <Badge variant="outline" className="text-[7px] px-1 py-0">{row.principalPaymentSource}</Badge>
                                  ) : "\u2014"}
                                </td>
                                <td className="p-1 border text-right text-emerald-600 font-bold">{fmt(row.netWorth)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          {/* ─── TAB 4: INTEREST SAVINGS ─────────────────────────────────── */}
          <TabsContent value="savings" className="space-y-6 mt-6">
            {result && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm opacity-90">Total Interest Saved</p>
                      <p className="text-3xl font-bold mt-1">{fmt(result.interestSavings.totalInterestSaved)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm opacity-90">Compounded at 7% for 20 Years</p>
                      <p className="text-3xl font-bold mt-1">{fmt(result.interestSavings.compoundedValue20yr)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm opacity-90">Total Wealth Created</p>
                      <p className="text-3xl font-bold mt-1">{fmt(result.summary.totalWealthCreated)}</p>
                      <p className="text-xs opacity-75 mt-1">Compounded savings + IUL cash value</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Interest Saved — Compounding at 7% Annually</CardTitle>
                    <CardDescription>
                      Every dollar of interest you don't pay grows at 7% compound for 20 years
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={interestSavingsData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Bar dataKey="interestSaved" fill="#10b981" name="Interest Saved This Year" />
                          <Area type="monotone" dataKey="compoundedValue" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} name="Compounded Value (7%)" />
                          <Line type="monotone" dataKey="cumulativeSaved" stroke="#f59e0b" strokeWidth={2} dot={false} name="Cumulative Saved (Nominal)" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Year-by-Year Interest Savings Detail</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background border-b">
                          <tr>
                            <th className="text-left p-2">Year</th>
                            <th className="text-right p-2">Interest Saved</th>
                            <th className="text-right p-2">Cumulative Saved</th>
                            <th className="text-right p-2">Compounded Value (7%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {interestSavingsData.map((row) => (
                            <tr key={row.year} className="border-b border-muted/30 hover:bg-muted/20">
                              <td className="p-2 font-medium">{row.year}</td>
                              <td className="text-right p-2 text-green-600">{fmt(row.interestSaved)}</td>
                              <td className="text-right p-2">{fmt(row.cumulativeSaved)}</td>
                              <td className="text-right p-2 font-bold text-indigo-600">{fmt(row.compoundedValue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ─── TAB 5: SCENARIO COMPARISON ──────────────────────────────── */}
          <TabsContent value="scenarios" className="space-y-6 mt-6">
            {scenarioResults.length > 0 && (
              <>
                {/* Scenario Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {scenarioResults.filter((s) => s.result).map((s, idx) => (
                    <Card key={idx} className={`${s.bg} ${s.border} border-2`}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-bold ${s.text}`}>
                          <Layers className="h-4 w-4 inline mr-1" />
                          {s.label}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {fmt(s.allocationPct * form.annualIncome)}/yr premium | {fmtPct(s.helocRate)} HELOC
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Years Saved</span>
                          <span className="font-bold" style={{ color: s.color }}>{s.result.summary.yearsSaved}+</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Interest Saved</span>
                          <span className="font-bold" style={{ color: s.color }}>{fmt(s.result.summary.totalInterestSaved)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Payoff</span>
                          <span className="font-bold">{fmtMo(s.result.recommendedPlan.payoffMonths)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Wealth Created</span>
                          <span className="font-bold" style={{ color: s.color }}>{fmt(s.result.summary.totalWealthCreated)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Mortgage-Free</span>
                          <span className="font-semibold">{s.result.summary.mortgageFreeDate}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total Policy Loans</span>
                          <span className="font-semibold">{fmt(s.result.summary.totalPolicyLoans)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">HELOC Drawn</span>
                          <span className="font-semibold">{fmt(s.result.summary.totalHelocDrawn)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Scenario Balance Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitCompare className="h-5 w-5 text-purple-500" />
                      Mortgage Balance Comparison — All Scenarios
                    </CardTitle>
                    <CardDescription>
                      See how each income allocation percentage accelerates your mortgage payoff differently
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scenarioComparisonChartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Area type="monotone" dataKey="currentBalance" stroke="#94a3b8" fill="#f1f5f9" strokeWidth={2} strokeDasharray="5 5" name="Current Plan (No Action)" />
                          {scenarioResults.filter((s) => s.result).map((s, idx) => (
                            <Area
                              key={idx}
                              type="monotone"
                              dataKey={`scenario${idx}`}
                              stroke={s.color}
                              fill={s.color}
                              fillOpacity={0.1}
                              strokeWidth={2}
                              name={s.label}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Wealth Created Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Total Wealth Created by Scenario
                    </CardTitle>
                    <CardDescription>
                      Compounded interest savings + IUL cash value across all scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scenarioWealthData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Bar dataKey="interestSaved" name="Interest Saved" stackId="a" fill="#10b981" />
                          <Bar dataKey="compoundedValue" name="Compounded Growth" stackId="b" fill="#6366f1" />
                          <Bar dataKey="totalWealth" name="Total Wealth" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Radar Chart */}
                {scenarioRadarData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Scenario Strength Comparison</CardTitle>
                      <CardDescription>Relative performance across key metrics (normalized to 100)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={scenarioRadarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                            {scenarioResults.filter((s) => s.result).map((s, idx) => (
                              <Radar
                                key={idx}
                                name={s.label}
                                dataKey={`s${idx}`}
                                stroke={s.color}
                                fill={s.color}
                                fillOpacity={0.15}
                                strokeWidth={2}
                              />
                            ))}
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Comparison Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Side-by-Side Scenario Detail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left p-3 font-semibold">Metric</th>
                            {scenarioResults.filter((s) => s.result).map((s, idx) => (
                              <th key={idx} className="text-right p-3 font-semibold" style={{ color: s.color }}>
                                {s.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: "Annual IUL Premium", key: "annualIulPremium", format: fmt },
                            { label: "Total Premiums Paid", key: "totalIulPremiums", format: fmt },
                            { label: "Total Policy Loans", key: "totalPolicyLoans", format: fmt },
                            { label: "Total HELOC Drawn", key: "totalHelocDrawn", format: fmt },
                            { label: "Interest Saved", key: "totalInterestSaved", format: fmt },
                            { label: "Years Saved", key: "yearsSaved", format: (v: number) => `${v}+` },
                            { label: "Months Saved", key: "monthsSaved", format: (v: number) => `${v}` },
                            { label: "Mortgage-Free Date", key: "mortgageFreeDate", format: (v: any) => v },
                            { label: "Final IUL Illustrated Policy Value", key: "finalPolicyCashValue", format: fmt },
                            { label: "Total Wealth Created", key: "totalWealthCreated", format: fmt },
                          ].map((metric) => (
                            <tr key={metric.label} className="border-b border-muted/30 hover:bg-muted/20">
                              <td className="p-3 font-medium">{metric.label}</td>
                              {scenarioResults.filter((s) => s.result).map((s, idx) => (
                                <td key={idx} className="text-right p-3">
                                  {metric.format(s.result.summary[metric.key])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {scenarioResults.length === 0 && (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Scenarios Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Compare Scenarios" on the Fact Finder tab to run 4 different income allocation scenarios (15%, 20%, 25%, 30%) side-by-side.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("factfinder")}>
                    Go to Fact Finder
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── TAB 6: AMORTIZATION SCHEDULES & OPPORTUNITY COST ─────── */}
          <TabsContent value="amortization" className="space-y-6 mt-6">
            {result && (
              <>
                {/* Sub-Tab Navigation */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { key: "doNothing" as const, label: "Do Nothing", sub: "(Current)", icon: "🔴", desc: "Standard 30-yr amortization" },
                    { key: "recommended" as const, label: "After", sub: "Recommendation", icon: "🟢", desc: "Accelerated IUL & HELOC" },
                    { key: "interestSaved" as const, label: "Interest", sub: "Saved", icon: "💰", desc: "Year-by-year savings" },
                    { key: "opportunityCost" as const, label: "Opportunity", sub: "Cost", icon: "📈", desc: "MGA 6.25% / 30 yrs" },
                  ].map((tab, idx) => (
                    <button
                      key={tab.key}
                      onClick={() => setAmortSubTab(tab.key)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        amortSubTab === tab.key
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg"
                          : "border-muted hover:border-indigo-300 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{tab.icon}</span>
                        <span className={`text-[11px] sm:text-xs font-bold leading-tight ${amortSubTab === tab.key ? "text-indigo-700 dark:text-indigo-300" : ""}`}>
                          {idx + 1}. {tab.label}<br className="sm:hidden" />
                          <span className="block sm:inline"> {tab.sub}</span>
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{tab.desc}</p>
                    </button>
                  ))}
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 1: DO NOTHING — Current Amortization Schedule
                    ════════════════════════════════════════════════════════════════ */}
                {amortSubTab === "doNothing" && (
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <Card className="bg-gradient-to-r from-red-900 to-red-800 text-white">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5" /> Do Nothing — Standard Amortization
                            </h2>
                            <p className="text-red-200 text-sm mt-1">
                              This is what happens if you make no changes — 30 years of minimum payments
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${amortView === "yearly" ? "text-white font-semibold" : "text-red-300"}`}>Yearly</span>
                            <Switch
                              checked={amortView === "monthly"}
                              onCheckedChange={(c) => { setAmortView(c ? "monthly" : "yearly"); setDoNothingPage(0); }}
                            />
                            <span className={`text-sm ${amortView === "monthly" ? "text-white font-semibold" : "text-red-300"}`}>Monthly</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-red-200 text-xs">Total Payments</p>
                            <p className="text-lg font-bold text-red-200">{fmt(result.currentPlan.totalPayments)}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-red-200 text-xs">Total Interest Paid</p>
                            <p className="text-lg font-bold text-red-300">{fmt(result.currentPlan.totalInterest)}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-red-200 text-xs">Payoff Date</p>
                            <p className="text-lg font-bold text-red-200">{result.summary.originalPayoffDate}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-red-200 text-xs">Interest-to-Principal Ratio</p>
                            <p className="text-lg font-bold text-red-300">
                              {((result.currentPlan.totalInterest / (result.currentPlan.totalPayments - result.currentPlan.totalInterest)) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Do Nothing Balance Decline Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                          <TrendingUp className="h-5 w-5" /> "Do Nothing" Balance Over Time
                        </CardTitle>
                        <CardDescription>
                          Watch your mortgage balance barely move for the first decade — most payments go to interest
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={yearlySideBySideData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                            <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Area type="monotone" dataKey="curBalance" name="Remaining Balance" stroke="#ef4444" fill="#fecaca" fillOpacity={0.5} />
                            <Bar dataKey="curInterest" name="Annual Interest" fill="#dc2626" opacity={0.6} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Yearly Spreadsheet */}
                    {amortView === "yearly" && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-red-500" /> Current Plan — Yearly Amortization Schedule
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-[10px] sm:text-xs border-collapse">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-red-50 dark:bg-red-900/30">
                                  <th className="p-1.5 border text-center font-bold bg-red-100 dark:bg-red-900/50">Yr</th>
                                  <th className="p-1.5 border text-right font-bold text-red-700 dark:text-red-300">Payment</th>
                                  <th className="p-1.5 border text-right font-bold text-red-700 dark:text-red-300">Principal</th>
                                  <th className="p-1.5 border text-right font-bold text-red-700 dark:text-red-300">Interest</th>
                                  <th className="p-1.5 border text-right font-bold text-red-700 dark:text-red-300">Balance</th>
                                  <th className="p-1.5 border text-right font-bold text-red-700 dark:text-red-300"><span className="hidden sm:inline">Cum. </span>Int.</th>
                                  <th className="p-1.5 border text-right font-bold text-red-700 dark:text-red-300">% Int</th>
                                </tr>
                              </thead>
                              <tbody>
                                {yearlySideBySideData.map((row, idx) => {
                                  const annualPayment = row.curPrincipal + row.curInterest;
                                  const pctToInterest = annualPayment > 0 ? ((row.curInterest / annualPayment) * 100).toFixed(1) : "0";
                                  return (
                                    <tr
                                      key={row.year}
                                      className={`border-b transition-colors ${
                                        idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-red-50/30 dark:bg-red-900/10"
                                      } hover:bg-red-50 dark:hover:bg-red-900/20`}
                                    >
                                      <td className="p-1.5 border text-center font-bold">{row.year}</td>
                                      <td className="p-1.5 border text-right">{fmt(annualPayment)}</td>
                                      <td className="p-1.5 border text-right">{fmt(row.curPrincipal)}</td>
                                      <td className="p-1.5 border text-right text-red-500 font-medium">{fmt(row.curInterest)}</td>
                                      <td className="p-1.5 border text-right font-medium">{fmt(row.curBalance)}</td>
                                      <td className="p-1.5 border text-right text-red-400">{fmt(row.curCumInterest)}</td>
                                      <td className="p-1.5 border text-right">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                          parseFloat(pctToInterest) > 60 ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                          parseFloat(pctToInterest) > 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                          "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                        }`}>
                                          {pctToInterest}%
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="sticky bottom-0 bg-red-100 dark:bg-red-900/40 font-bold">
                                <tr>
                                  <td className="p-2 border text-center">Total</td>
                                  <td className="p-2 border text-right">{fmt(result.currentPlan.totalPayments)}</td>
                                  <td className="p-2 border text-right">{fmt(result.currentPlan.totalPayments - result.currentPlan.totalInterest)}</td>
                                  <td className="p-2 border text-right text-red-600">{fmt(result.currentPlan.totalInterest)}</td>
                                  <td className="p-2 border text-right">{fmt(0)}</td>
                                  <td className="p-2 border text-right text-red-600">{fmt(result.currentPlan.totalInterest)}</td>
                                  <td className="p-2 border text-right">
                                    <span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                      {((result.currentPlan.totalInterest / result.currentPlan.totalPayments) * 100).toFixed(1)}% avg
                                    </span>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Monthly Spreadsheet */}
                    {amortView === "monthly" && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-red-500" /> Current Plan — Monthly Amortization
                          </CardTitle>
                          <CardDescription>
                            Page {doNothingPage + 1} of {Math.ceil(result.currentPlan.schedule.length / ROWS_PER_PAGE)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => setDoNothingPage(Math.max(0, doNothingPage - 1))} disabled={doNothingPage === 0}>
                                ← Prev
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Months {doNothingPage * ROWS_PER_PAGE + 1}–{Math.min((doNothingPage + 1) * ROWS_PER_PAGE, result.currentPlan.schedule.length)}
                              </span>
                              <Button variant="outline" size="sm" onClick={() => setDoNothingPage(Math.min(Math.ceil(result.currentPlan.schedule.length / ROWS_PER_PAGE) - 1, doNothingPage + 1))} disabled={(doNothingPage + 1) * ROWS_PER_PAGE >= result.currentPlan.schedule.length}>
                                Next →
                              </Button>
                            </div>
                            <Badge variant="outline" className="text-xs">{result.currentPlan.schedule.length} months</Badge>
                          </div>
                          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-[10px] sm:text-[11px] border-collapse">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-red-50 dark:bg-red-900/30">
                                  <th className="p-1 border text-center font-bold">#</th>
                                  <th className="p-1 border text-center font-bold">Yr</th>
                                  <th className="p-1 border text-right font-bold text-red-700 dark:text-red-300">Pmt</th>
                                  <th className="p-1 border text-right font-bold text-red-700 dark:text-red-300">Princ.</th>
                                  <th className="p-1 border text-right font-bold text-red-700 dark:text-red-300">Int.</th>
                                  <th className="p-1 border text-right font-bold text-red-700 dark:text-red-300">Bal.</th>
                                  <th className="p-1 border text-right font-bold text-red-700 dark:text-red-300"><span className="hidden sm:inline">Cum. </span>Int.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.currentPlan.schedule
                                  .slice(doNothingPage * ROWS_PER_PAGE, (doNothingPage + 1) * ROWS_PER_PAGE)
                                  .map((row: any, idx: number) => (
                                    <tr
                                      key={row.month}
                                      className={`border-b ${
                                        row.month % 12 === 0 ? "border-b-2 border-b-red-300 dark:border-b-red-700" : ""
                                      } ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-red-50/20 dark:bg-red-900/10"}`}
                                    >
                                      <td className="p-1 border text-center font-mono text-[10px]">{row.month}</td>
                                      <td className="p-1 border text-center text-[10px]">{row.year}</td>
                                      <td className="p-1 border text-right">{fmt(row.payment)}</td>
                                      <td className="p-1 border text-right">{fmt(row.principal)}</td>
                                      <td className="p-1 border text-right text-red-500">{fmt(row.interest)}</td>
                                      <td className="p-1 border text-right font-medium">{fmt(row.endingBalance)}</td>
                                      <td className="p-1 border text-right text-red-400">{fmt(row.cumulativeInterest)}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Call to Action */}
                    <Card className="border-2 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20">
                      <CardContent className="p-6 text-center">
                        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
                          You will pay {fmt(result.currentPlan.totalInterest)} in interest doing nothing.
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          That is {((result.currentPlan.totalInterest / (result.currentPlan.totalPayments - result.currentPlan.totalInterest)) * 100).toFixed(0)}% of your original loan amount — gone forever.
                          Click below to see how the Mortgage Killer strategy changes everything.
                        </p>
                        <Button onClick={() => setAmortSubTab("recommended")} className="bg-emerald-600 hover:bg-emerald-700">
                          View After Recommendation →
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 2: AFTER RECOMMENDATION — Accelerated with IUL & HELOC
                    ════════════════════════════════════════════════════════════════ */}
                {amortSubTab === "recommended" && (
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <Card className="bg-gradient-to-r from-emerald-900 to-green-800 text-white">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" /> After Recommendation — Mortgage Killer Strategy
                            </h2>
                            <p className="text-green-200 text-sm mt-1">
                              Accelerated payoff with IUL cash values, surrender values, and HELOC interest tracked until completely debt-free
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${amortView === "yearly" ? "text-white font-semibold" : "text-green-300"}`}>Yearly</span>
                            <Switch
                              checked={amortView === "monthly"}
                              onCheckedChange={(c) => { setAmortView(c ? "monthly" : "yearly"); setRecPage(0); }}
                            />
                            <span className={`text-sm ${amortView === "monthly" ? "text-white font-semibold" : "text-green-300"}`}>Monthly</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-green-200 text-xs">Total Interest</p>
                            <p className="text-lg font-bold text-green-300">{fmt(result.recommendedPlan.totalInterest)}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-green-200 text-xs">Interest Saved</p>
                            <p className="text-lg font-bold text-emerald-300">{fmt(result.interestSavings.totalInterestSaved)}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-green-200 text-xs">Payoff In</p>
                            <p className="text-lg font-bold text-green-200">{result.summary.mortgageFreeDate}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-green-200 text-xs">Final IUL Illustrated Policy Value</p>
                            <p className="text-lg font-bold text-blue-300">{fmt(result.summary.finalPolicyCashValue)}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-green-200 text-xs">Total HELOC Interest</p>
                            <p className="text-lg font-bold text-amber-300">
                              {fmt(result.summary.totalHelocInterest)}
                            </p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-green-200 text-xs">Debt-Free Year</p>
                            <p className="text-lg font-bold text-emerald-200">Year {result.summary.debtFreeYear}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-green-200 text-xs">Total Assets</p>
                            <p className="text-lg font-bold text-cyan-300">{fmt(result.summary.totalAssets)}</p>
                          </div>
                          {tm.toggleProps.enabled && tmOverlay.length > 0 && (
                            <div className="bg-amber-500/20 rounded-lg p-3 border border-amber-400/40">
                              <p className="text-amber-200 text-xs">✨ TM Account Value (Yr 30)</p>
                              <p className="text-lg font-bold text-amber-300" title={TM_TOOLTIP}>{fmt(tmOverlay[Math.min(29, tmOverlay.length - 1)]?.accountValue ?? 0)}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Side-by-Side Balance Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-emerald-500" /> Balance Comparison — Before vs. After
                        </CardTitle>
                        <CardDescription>
                          Red = doing nothing, Green = Mortgage Killer strategy. See the dramatic difference.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                          <AreaChart data={yearlySideBySideData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                            <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Area type="monotone" dataKey="curBalance" name="Do Nothing Balance" stroke="#ef4444" fill="#fecaca" fillOpacity={0.4} />
                            <Area type="monotone" dataKey="recBalance" name="Mortgage Killer Balance" stroke="#10b981" fill="#a7f3d0" fillOpacity={0.4} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Yearly Spreadsheet with IUL + HELOC */}
                    {amortView === "yearly" && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-emerald-500" /> Recommended Plan — Full Yearly Schedule
                          </CardTitle>
                          <CardDescription>
                            Includes IUL cash values, surrender values, policy loans, HELOC draws, and HELOC interest — all the way to debt-free
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                            <table className="w-full text-[9px] sm:text-[10px] border-collapse" style={{ minWidth: '800px' }}>
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-100 dark:bg-slate-800">
                                  <th rowSpan={2} className="p-1 border text-center font-bold bg-slate-200 dark:bg-slate-700">Yr</th>
                                  <th colSpan={4} className="p-1 border text-center font-bold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">Mortgage</th>
                                  <th colSpan={5} className="p-1 border text-center font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">IUL Policy</th>
                                  <th colSpan={3} className="p-1 border text-center font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">HELOC</th>
                                  <th className="p-1 border text-center font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">Total</th>
                                  {tm.toggleProps.enabled && (
                                    <th colSpan={3} className="p-1 border text-center font-bold bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-200" title={TM_TOOLTIP}>✨ Time Machine</th>
                                  )}
                                </tr>
                                <tr className="bg-slate-50 dark:bg-slate-800 text-[8px] sm:text-[9px]">
                                  <th className="p-0.5 border text-right text-green-600">Princ.</th>
                                  <th className="p-0.5 border text-right text-green-600">Int.</th>
                                  <th className="p-0.5 border text-right text-emerald-600">Extra</th>
                                  <th className="p-0.5 border text-right text-green-600">Bal.</th>
                                  <th className="p-0.5 border text-right text-blue-600">Cash Val</th>
                                  <th className="p-0.5 border text-right text-blue-600">Surr.</th>
                                  <th className="p-0.5 border text-right text-blue-600">Loan</th>
                                  <th className="p-0.5 border text-right text-blue-600">Cum.Ln</th>
                                  <th className="p-0.5 border text-right text-blue-600">Drag</th>
                                  <th className="p-0.5 border text-right text-amber-600">Draw</th>
                                  <th className="p-0.5 border text-right text-amber-600">Bal.</th>
                                  <th className="p-0.5 border text-right text-amber-600">Int.</th>
                                  <th className="p-0.5 border text-right text-purple-600">Debt</th>
                                  {tm.toggleProps.enabled && (
                                    <>
                                      <th className="p-0.5 border text-right text-amber-700" title={TM_TOOLTIP}>TM Acct</th>
                                      <th className="p-0.5 border text-right text-amber-700" title={TM_TOOLTIP}>TM Surr</th>
                                      <th className="p-0.5 border text-right text-amber-700" title={TM_TOOLTIP}>TM Credit</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {recommendedYearlyData.map((row, idx) => {
                                  const isPaidOff = row.balance <= 0;
                                  const isDebtFree = row.totalDebt <= 0;
                                  const justPaidOff = isPaidOff && idx > 0 && recommendedYearlyData[idx - 1].balance > 0;
                                  const justDebtFree = isDebtFree && idx > 0 && recommendedYearlyData[idx - 1].totalDebt > 0;
                                  return (
                                    <tr
                                      key={row.year}
                                      className={`border-b transition-colors ${
                                        justDebtFree || justPaidOff
                                          ? "bg-emerald-100 dark:bg-emerald-900/40 font-bold"
                                          : isPaidOff
                                            ? "bg-gray-50 dark:bg-gray-800/50 text-muted-foreground"
                                            : idx % 2 === 0
                                              ? "bg-white dark:bg-slate-900"
                                              : "bg-slate-50/50 dark:bg-slate-800/30"
                                      } hover:bg-green-50/50 dark:hover:bg-green-900/20`}
                                    >
                                      <td className="p-1 border text-center font-bold">{row.year}</td>
                                      <td className="p-1 border text-right">{row.principal > 0 ? fmt(row.principal) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-green-600">{row.interest > 0 ? fmt(row.interest) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-emerald-600 font-semibold">{row.extraPrincipal > 0 ? fmt(row.extraPrincipal) : "\u2014"}</td>
                                      <td className={`p-1 border text-right font-medium ${isPaidOff ? "text-emerald-600 font-bold" : ""}`}>
                                        {isPaidOff ? "PAID OFF" : fmt(row.balance)}
                                      </td>
                                      <td className="p-1 border text-right text-blue-600">{row.iulCashValue > 0 ? fmt(row.iulCashValue) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-blue-500">{row.iulSurrenderValue > 0 ? fmt(row.iulSurrenderValue) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-blue-700 font-semibold">{row.iulPolicyLoan > 0 ? fmt(row.iulPolicyLoan) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-blue-500">{row.iulCumulativeLoans > 0 ? fmt(row.iulCumulativeLoans) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-blue-400">{row.iulLoanDrag > 0 ? fmt(row.iulLoanDrag) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-amber-600">{row.helocDraw > 0 ? fmt(row.helocDraw) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-amber-500">{row.helocBalance > 0 ? fmt(row.helocBalance) : "\u2014"}</td>
                                      <td className="p-1 border text-right text-amber-700">{row.helocInterest > 0 ? fmt(row.helocInterest) : "\u2014"}</td>
                                      <td className={`p-1 border text-right font-medium ${isDebtFree ? "text-emerald-600 font-bold" : "text-purple-600"}`}>
                                        {isDebtFree ? "DEBT FREE" : fmt(row.totalDebt)}
                                      </td>
                                      {tm.toggleProps.enabled && (() => {
                                        const tmRow = tmOverlay[idx];
                                        return tmRow ? (
                                          <>
                                            <td className="p-1 border text-right text-amber-700 bg-amber-50/40 dark:bg-amber-900/10 font-semibold" title={TM_TOOLTIP}>{fmt(tmRow.accountValue)}</td>
                                            <td className="p-1 border text-right text-amber-600 bg-amber-50/40 dark:bg-amber-900/10" title={TM_TOOLTIP}>{fmt(tmRow.surrenderValue)}</td>
                                            <td className="p-1 border text-right text-amber-800 bg-amber-50/40 dark:bg-amber-900/10 font-semibold" title={TM_TOOLTIP}>{fmt(tmRow.interestCredit)}</td>
                                          </>
                                        ) : (
                                          <>
                                            <td className="p-1 border text-right text-muted-foreground">—</td>
                                            <td className="p-1 border text-right text-muted-foreground">—</td>
                                            <td className="p-1 border text-right text-muted-foreground">—</td>
                                          </>
                                        );
                                      })()}
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="sticky bottom-0 bg-emerald-100 dark:bg-emerald-900/40 font-bold text-[10px]">
                                <tr>
                                  <td className="p-1.5 border text-center">Total</td>
                                  <td className="p-1.5 border text-right">{fmt(recommendedYearlyData.reduce((s, r) => s + r.principal, 0))}</td>
                                  <td className="p-1.5 border text-right text-green-600">{fmt(result.recommendedPlan.totalInterest)}</td>
                                  <td className="p-1.5 border text-right text-emerald-600">{fmt(recommendedYearlyData.reduce((s, r) => s + r.extraPrincipal, 0))}</td>
                                  <td className="p-1.5 border text-right text-emerald-600">PAID OFF</td>
                                  <td className="p-1.5 border text-right text-blue-600">{fmt(result.summary.finalPolicyCashValue)}</td>
                                  <td className="p-1.5 border text-right text-blue-500">\u2014</td>
                                  <td className="p-1.5 border text-right text-blue-700">{fmt(result.summary.totalPolicyLoans)}</td>
                                  <td className="p-1.5 border text-right text-blue-500">{fmt(result.summary.totalPolicyLoans)}</td>
                                  <td className="p-1.5 border text-right text-blue-400">{fmt(recommendedYearlyData.reduce((s, r) => s + r.iulLoanDrag, 0))}</td>
                                  <td className="p-1.5 border text-right text-amber-600">{fmt(result.summary.totalHelocDrawn)}</td>
                                  <td className="p-1.5 border text-right text-amber-500">\u2014</td>
                                  <td className="p-1.5 border text-right text-amber-700">{fmt(result.helocSchedule.reduce((s: number, h: any) => s + h.interestPaid, 0))}</td>
                                  <td className="p-1.5 border text-right text-emerald-600">DEBT FREE</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Monthly Spreadsheet with IUL + HELOC */}
                    {amortView === "monthly" && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-emerald-500" /> Recommended Plan — Monthly Schedule
                          </CardTitle>
                          <CardDescription>
                            Page {recPage + 1} of {Math.ceil(recommendedMonthlyData.length / ROWS_PER_PAGE)} — IUL & HELOC values shown per year
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => setRecPage(Math.max(0, recPage - 1))} disabled={recPage === 0}>
                                ← Prev
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Months {recPage * ROWS_PER_PAGE + 1}–{Math.min((recPage + 1) * ROWS_PER_PAGE, recommendedMonthlyData.length)}
                              </span>
                              <Button variant="outline" size="sm" onClick={() => setRecPage(Math.min(Math.ceil(recommendedMonthlyData.length / ROWS_PER_PAGE) - 1, recPage + 1))} disabled={(recPage + 1) * ROWS_PER_PAGE >= recommendedMonthlyData.length}>
                                Next →
                              </Button>
                            </div>
                            <Badge variant="outline" className="text-xs">{recommendedMonthlyData.length} months</Badge>
                          </div>
                          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-[10px] border-collapse">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-green-50 dark:bg-green-900/30 text-[9px]">
                                  <th className="p-1 border text-center font-bold">#</th>
                                  <th className="p-1 border text-center font-bold">Yr</th>
                                  <th className="p-1 border text-right font-bold text-green-700">Pmt</th>
                                  <th className="p-1 border text-right font-bold text-green-700">Princ</th>
                                  <th className="p-1 border text-right font-bold text-green-700">Int</th>
                                  <th className="p-1 border text-right font-bold text-emerald-700">Extra</th>
                                  <th className="p-1 border text-right font-bold text-green-700">Balance</th>
                                  <th className="p-1 border text-right font-bold text-blue-700">IUL Cash</th>
                                  <th className="p-1 border text-right font-bold text-blue-700">Surrender</th>
                                  <th className="p-1 border text-right font-bold text-amber-700">HELOC Bal</th>
                                  <th className="p-1 border text-right font-bold text-amber-700">HELOC Int</th>
                                </tr>
                              </thead>
                              <tbody>
                                {recommendedMonthlyData
                                  .slice(recPage * ROWS_PER_PAGE, (recPage + 1) * ROWS_PER_PAGE)
                                  .map((row, idx) => {
                                    const isPaidOff = row.balance <= 0;
                                    const hasExtra = row.extraPrincipal > 0;
                                    const isYearBoundary = row.month % 12 === 0;
                                    return (
                                      <tr
                                        key={row.month}
                                        className={`border-b ${
                                          hasExtra ? "bg-emerald-50/60 dark:bg-emerald-900/20" :
                                          isPaidOff ? "bg-gray-50 dark:bg-gray-800/50 text-muted-foreground" :
                                          idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/30"
                                        }${isYearBoundary ? " border-b-2 border-b-green-300 dark:border-b-green-700" : ""}`}
                                      >
                                        <td className="p-1 border text-center font-mono text-[10px]">{row.month}</td>
                                        <td className="p-1 border text-center text-[10px]">{row.year}</td>
                                        <td className="p-1 border text-right">{row.payment > 0 ? fmt(row.payment) : "\u2014"}</td>
                                        <td className="p-1 border text-right">{row.principal > 0 ? fmt(row.principal) : "\u2014"}</td>
                                        <td className="p-1 border text-right text-green-600">{row.interest > 0 ? fmt(row.interest) : "\u2014"}</td>
                                        <td className="p-1 border text-right text-emerald-600 font-semibold">{hasExtra ? fmt(row.extraPrincipal) : "\u2014"}</td>
                                        <td className={`p-1 border text-right font-medium ${isPaidOff ? "text-emerald-600 font-bold" : ""}`}>
                                          {isPaidOff ? "PAID" : fmt(row.balance)}
                                        </td>
                                        <td className="p-1 border text-right text-blue-600">{row.iulCashValue > 0 ? fmt(row.iulCashValue) : "\u2014"}</td>
                                        <td className="p-1 border text-right text-blue-500">{row.iulSurrenderValue > 0 ? fmt(row.iulSurrenderValue) : "\u2014"}</td>
                                        <td className="p-1 border text-right text-amber-500">{row.helocBalance > 0 ? fmt(row.helocBalance) : "\u2014"}</td>
                                        <td className="p-1 border text-right text-amber-700">{row.helocInterest > 0 ? fmt(row.helocInterest) : "\u2014"}</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Debt-Free Summary */}
                    <Card className="border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Years Saved</p>
                            <p className="text-3xl font-bold text-emerald-600">{result.summary.yearsSaved}+</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Interest Saved</p>
                            <p className="text-3xl font-bold text-green-600">{fmt(result.interestSavings.totalInterestSaved)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">IUL Illustrated Policy Value Built</p>
                            <p className="text-3xl font-bold text-blue-600">{fmt(result.summary.finalPolicyCashValue)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Total Wealth Created</p>
                            <p className="text-3xl font-bold text-purple-600">{fmt(result.summary.totalWealthCreated)}</p>
                          </div>
                        </div>
                        <div className="text-center mt-4">
                          <Button onClick={() => setAmortSubTab("interestSaved")} className="bg-indigo-600 hover:bg-indigo-700">
                            View Interest Saved Breakdown →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 3: MORTGAGE INTEREST SAVED
                    ════════════════════════════════════════════════════════════════ */}
                {amortSubTab === "interestSaved" && (
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-amber-900 to-yellow-800 text-white">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <DollarSign className="h-5 w-5" /> Mortgage Interest Saved — Year by Year
                        </h2>
                        <p className="text-amber-200 text-sm mt-1">
                          Every dollar saved from interest is a dollar that can work for you instead of the bank
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-amber-200 text-xs">Total Interest Saved</p>
                            <p className="text-2xl font-bold text-amber-200">{fmt(result.interestSavings.totalInterestSaved)}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-amber-200 text-xs">Current Plan Interest</p>
                            <p className="text-2xl font-bold text-red-300">{fmt(result.currentPlan.totalInterest)}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-amber-200 text-xs">Recommended Plan Interest</p>
                            <p className="text-2xl font-bold text-green-300">{fmt(result.recommendedPlan.totalInterest)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Interest Saved Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-amber-500" /> Annual Interest Comparison
                        </CardTitle>
                        <CardDescription>
                          Red bars = interest paid doing nothing. Green bars = interest paid with strategy. The gap is your savings.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                          <ComposedChart data={yearlySideBySideData.filter((r) => r.curInterest > 0 || r.recInterest > 0)}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                            <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Bar dataKey="curInterest" name="Do Nothing Interest" fill="#ef4444" opacity={0.7} />
                            <Bar dataKey="recInterest" name="Strategy Interest" fill="#10b981" opacity={0.7} />
                            <Line type="monotone" dataKey="interestSaved" name="Cumulative Saved" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Interest Saved Spreadsheet */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-amber-500" /> Interest Savings Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                          <table className="w-full text-[10px] sm:text-xs border-collapse">
                            <thead className="sticky top-0 z-10">
                              <tr className="bg-amber-50 dark:bg-amber-900/30">
                                <th className="p-1.5 border text-center font-bold">Yr</th>
                                <th className="p-1.5 border text-right font-bold text-red-600"><span className="hidden sm:inline">Do Nothing </span>Int.</th>
                                <th className="p-1.5 border text-right font-bold text-green-600"><span className="hidden sm:inline">Strategy </span>Int.</th>
                                <th className="p-1.5 border text-right font-bold text-amber-600"><span className="hidden sm:inline">Annual </span>Saved</th>
                                <th className="p-1.5 border text-right font-bold text-purple-600">Cum. Saved</th>
                              </tr>
                            </thead>
                            <tbody>
                              {yearlySideBySideData.filter((r) => r.curInterest > 0 || r.recInterest > 0).map((row, idx) => (
                                <tr key={row.year} className={`border-b ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-amber-50/30 dark:bg-amber-900/10"}`}>
                                  <td className="p-1.5 border text-center font-bold">{row.year}</td>
                                  <td className="p-1.5 border text-right text-red-500">{fmt(row.curInterest)}</td>
                                  <td className="p-1.5 border text-right text-green-600">{fmt(row.recInterest)}</td>
                                  <td className="p-1.5 border text-right text-amber-600 font-semibold">{fmt(row.curInterest - row.recInterest)}</td>
                                  <td className="p-1.5 border text-right text-purple-600 font-semibold">{fmt(row.interestSaved)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="sticky bottom-0 bg-amber-100 dark:bg-amber-900/40 font-bold">
                              <tr>
                                <td className="p-2 border text-center">Total</td>
                                <td className="p-2 border text-right text-red-600">{fmt(result.currentPlan.totalInterest)}</td>
                                <td className="p-2 border text-right text-green-600">{fmt(result.recommendedPlan.totalInterest)}</td>
                                <td className="p-2 border text-right text-amber-600">{fmt(result.interestSavings.totalInterestSaved)}</td>
                                <td className="p-2 border text-right text-purple-600">{fmt(result.interestSavings.totalInterestSaved)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="text-center">
                      <Button onClick={() => setAmortSubTab("opportunityCost")} className="bg-purple-600 hover:bg-purple-700">
                        See Total Opportunity Cost Accomplished →
                      </Button>
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 4: TOTAL OPPORTUNITY COST ACCOMPLISHED
                    Multi Guaranteed Annuity at 6.25% for 30 Years
                    ════════════════════════════════════════════════════════════════ */}
                {amortSubTab === "opportunityCost" && (
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
                      <CardContent className="p-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <TrendingUp className="h-6 w-6" /> Total Opportunity Cost Accomplished
                        </h2>
                        <p className="text-purple-200 text-sm mt-1">
                          Mortgage interest saved, invested in a Multi Guaranteed Annuity (MGA) at 6.25% compounding annually for 30 years
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-purple-200 text-xs">Interest Saved (Principal)</p>
                            <p className="text-2xl font-bold text-amber-300">{fmt(result.interestSavings.totalInterestSaved)}</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-purple-200 text-xs">MGA Rate</p>
                            <p className="text-2xl font-bold text-green-300">6.25%</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-purple-200 text-xs">Compounding Period</p>
                            <p className="text-2xl font-bold text-blue-300">30 Years</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3 border-2 border-purple-400">
                            <p className="text-purple-200 text-xs">MGA Value at Year 30</p>
                            <p className="text-2xl font-bold text-white">{fmt(result.interestSavings.mgaAnnuityValue30yr)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* MGA Growth Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-purple-500" /> Total Opportunity Cost Accomplished
                        </CardTitle>
                        <CardDescription>
                          Your mortgage interest savings growing at 6.25% annually in a Multi Guaranteed Annuity over 30 years
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                          <ComposedChart data={mgaChartData}>
                            <defs>
                              <linearGradient id="mgaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                              </linearGradient>
                              <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                            <YAxis tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Area type="monotone" dataKey="cumulativeSaved" name="Cumulative Interest Saved" stroke="#f59e0b" fill="url(#savedGradient)" />
                            <Area type="monotone" dataKey="mgaAnnuityValue" name="MGA Annuity Value (6.25%)" stroke="#8b5cf6" fill="url(#mgaGradient)" strokeWidth={3} />
                            <Line type="monotone" dataKey="interestSaved" name="Annual Interest Saved" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* MGA Compounding Spreadsheet */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-purple-500" /> MGA Compounding Schedule — 30 Years at 6.25%
                        </CardTitle>
                        <CardDescription>
                          Each year's interest savings deposited into the annuity, compounding at the guaranteed 6.25% rate
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                          <table className="w-full text-[10px] sm:text-xs border-collapse">
                            <thead className="sticky top-0 z-10">
                              <tr className="bg-purple-50 dark:bg-purple-900/30">
                                <th className="p-1.5 border text-center font-bold">Yr</th>
                                <th className="p-1.5 border text-right font-bold text-amber-600"><span className="hidden sm:inline">Int. </span>Saved</th>
                                <th className="p-1.5 border text-right font-bold text-amber-700">Cum. Saved</th>
                                <th className="p-1.5 border text-right font-bold text-purple-600">MGA Val.</th>
                                <th className="p-1.5 border text-right font-bold text-green-600">Growth</th>
                                <th className="p-1.5 border text-right font-bold text-indigo-600"><span className="hidden sm:inline">Total </span>Gain</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mgaChartData.map((row, idx) => {
                                const prevMga = idx > 0 ? mgaChartData[idx - 1].mgaAnnuityValue : 0;
                                const growthThisYear = row.mgaAnnuityValue - prevMga - row.interestSaved;
                                const totalGain = row.mgaAnnuityValue - row.cumulativeSaved;
                                const isMilestone = row.year === 10 || row.year === 20 || row.year === 30;
                                return (
                                  <tr
                                    key={row.year}
                                    className={`border-b transition-colors ${
                                      isMilestone
                                        ? "bg-purple-100 dark:bg-purple-900/40 font-bold"
                                        : idx % 2 === 0
                                          ? "bg-white dark:bg-slate-900"
                                          : "bg-purple-50/30 dark:bg-purple-900/10"
                                    }`}
                                  >
                                    <td className="p-1.5 border text-center font-bold">
                                      {row.year}
                                      {isMilestone && <span className="ml-1 text-[9px] text-purple-500">★</span>}
                                    </td>
                                    <td className="p-1.5 border text-right text-amber-600">{row.interestSaved > 0 ? fmt(row.interestSaved) : "\u2014"}</td>
                                    <td className="p-1.5 border text-right text-amber-700">{fmt(row.cumulativeSaved)}</td>
                                    <td className="p-1.5 border text-right text-purple-600 font-semibold">{fmt(row.mgaAnnuityValue)}</td>
                                    <td className="p-1.5 border text-right text-green-600">{growthThisYear > 0 ? fmt(growthThisYear) : "\u2014"}</td>
                                    <td className="p-1.5 border text-right text-indigo-600 font-semibold">{totalGain > 0 ? fmt(totalGain) : "\u2014"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="sticky bottom-0 bg-purple-200 dark:bg-purple-900/60 font-bold">
                              <tr>
                                <td className="p-2 border text-center">30-Year Total</td>
                                <td className="p-2 border text-right text-amber-600">{fmt(result.interestSavings.totalInterestSaved)}</td>
                                <td className="p-2 border text-right text-amber-700">{fmt(result.interestSavings.totalInterestSaved)}</td>
                                <td className="p-2 border text-right text-purple-700 text-base">{fmt(result.interestSavings.mgaAnnuityValue30yr)}</td>
                                <td className="p-2 border text-right text-green-600">\u2014</td>
                                <td className="p-2 border text-right text-indigo-700 text-base">{fmt(result.interestSavings.mgaAnnuityValue30yr - result.interestSavings.totalInterestSaved)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Final Impact Summary */}
                    <Card className="border-2 border-purple-400 dark:border-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30">
                      <CardContent className="p-8 text-center">
                        <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-6">
                          Total Opportunity Cost Accomplished
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-lg">
                            <p className="text-xs text-muted-foreground mb-1">Interest Saved</p>
                            <p className="text-3xl font-bold text-amber-600">{fmt(result.interestSavings.totalInterestSaved)}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Raw savings from accelerated payoff</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-lg">
                            <p className="text-xs text-muted-foreground mb-1">MGA Annuity (30yr @ 6.25%)</p>
                            <p className="text-3xl font-bold text-purple-600">{fmt(result.interestSavings.mgaAnnuityValue30yr)}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Guaranteed compounding growth</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-lg border-2 border-emerald-400">
                            <p className="text-xs text-muted-foreground mb-1">Total Wealth Created</p>
                            <p className="text-3xl font-bold text-emerald-600">{fmt(result.summary.totalWealthCreated + result.interestSavings.mgaAnnuityValue30yr)}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">IUL + MGA + Interest Savings</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                          By implementing the Mortgage Killer strategy, your client eliminates their mortgage {result.summary.yearsSaved}+ years early,
                          saves {fmt(result.interestSavings.totalInterestSaved)} in interest, and when that savings compounds at 6.25% in a
                          Multi Guaranteed Annuity for 30 years, it grows to {fmt(result.interestSavings.mgaAnnuityValue30yr)}.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ─── TAB 7: STRATEGY DETAILS ─────────────────────────────────── */}
          <TabsContent value="details" className="space-y-6 mt-6">
            {result && (
              <>
                {/* Summary Card */}
                <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-6">Mortgage Killer Strategy Summary</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-slate-400 text-sm">Years Saved</p>
                        <p className="text-3xl font-bold text-green-400">{result.summary.yearsSaved}+</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Interest Saved</p>
                        <p className="text-3xl font-bold text-green-400">{fmt(result.summary.totalInterestSaved)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Mortgage-Free Date</p>
                        <p className="text-xl font-bold text-blue-400">{result.summary.mortgageFreeDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Original Payoff</p>
                        <p className="text-xl font-bold text-red-400 line-through">{result.summary.originalPayoffDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* IUL Policy Schedule */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" /> IUL Policy Schedule
                      </CardTitle>
                      <CardDescription>
                        Annual premium: {fmt(result.summary.annualIulPremium)} for {strategyParams.premiumYears} years
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-background border-b">
                            <tr>
                              <th className="text-left p-1.5">Yr</th>
                              <th className="text-right p-1.5">Premium</th>
                              <th className="text-center p-1.5">Source</th>
                              <th className="text-right p-1.5">Illustrated Policy Value</th>
                              <th className="text-right p-1.5">Surrender</th>
                              <th className="text-right p-1.5">Loan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.iulPolicy.map((row) => (
                              <tr key={row.year} className={`border-b border-muted/30 ${row.policyLoan > 0 ? "bg-emerald-50/30" : ""}`}>
                                <td className="p-1.5 font-medium">{row.year}</td>
                                <td className="text-right p-1.5">{row.premium > 0 ? fmt(row.premium) : "\u2014"}</td>
                                <td className="text-center p-1.5">
                                  <Badge variant="outline" className={`text-[10px] ${
                                    row.premiumSource === "heloc" ? "bg-orange-100 text-orange-700" :
                                    row.premiumSource === "income" ? "bg-blue-100 text-blue-700" :
                                    "bg-gray-100 text-gray-500"
                                  }`}>
                                    {row.premiumSource}
                                  </Badge>
                                </td>
                                <td className="text-right p-1.5">{fmt(row.cashValue)}</td>
                                <td className="text-right p-1.5">{fmt(row.surrenderValue)}</td>
                                <td className="text-right p-1.5 text-emerald-600 font-semibold">
                                  {row.policyLoan > 0 ? fmt(row.policyLoan) : "\u2014"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* HELOC Schedule */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-orange-500" /> HELOC Funding Schedule
                      </CardTitle>
                      <CardDescription>
                        Total HELOC drawn: {fmt(result.summary.totalHelocDrawn)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-background border-b">
                            <tr>
                              <th className="text-left p-2">Year</th>
                              <th className="text-left p-2">Purpose</th>
                              <th className="text-right p-2">Draw</th>
                              <th className="text-right p-2">Balance</th>
                              <th className="text-right p-2">Interest</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.helocSchedule.map((row) => (
                              <tr key={row.year} className="border-b border-muted/30 hover:bg-muted/20">
                                <td className="p-2 font-medium">{row.year}</td>
                                <td className="p-2 text-xs">{row.purpose}</td>
                                <td className="text-right p-2 text-orange-600">{row.drawAmount > 0 ? fmt(row.drawAmount) : "\u2014"}</td>
                                <td className="text-right p-2">{fmt(row.balance)}</td>
                                <td className="text-right p-2 text-red-500">{fmt(row.interestPaid)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Strategy Flow */}
                <Card>
                  <CardHeader><CardTitle>How the Mortgage Killer Strategy Works</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { step: 1, title: "70% LTV HELOC", desc: `Take ${fmtPct(strategyParams.helocLtvPct)} of home equity via HELOC (${fmt(result.summary.totalHelocDrawn)}) to fund ${strategyParams.premiumYears}-year level IUL premiums`, color: "orange" },
                        { step: 2, title: "IUL Grows at AG 49 Max Rate (illustrated, non-guaranteed)", desc: `Policy earns ${fmtPct(strategyParams.iulCreditRate)} compound annually (AG 49 max: 7.5%). 30-year historical averages exceed this but we follow the rules.`, color: "blue" },
                        { step: 3, title: "80% Life Loans", desc: `Starting year 2: take ${fmtPct(strategyParams.policyLoanPct)} of surrender value as tax-free life loans → applied to mortgage principal`, color: "emerald" },
                        { step: 4, title: "Principal-Only Paydown", desc: `Apply policy loans directly to mortgage principal. After paydown, recalculate equity for next HELOC draw.`, color: "red" },
                        { step: 5, title: "Post-Premium Growth", desc: `After ${strategyParams.premiumYears} years: ${fmtPct(strategyParams.iulCreditRate)} crediting (AG 49 max, non-guaranteed) minus ${fmtPct(strategyParams.policyLoanDragRate)} loan drag. Net growth funds continued paydowns.`, color: "cyan" },
                        { step: 6, title: "Mortgage Eliminated", desc: `Mortgage paid off ${result.summary.yearsSaved}+ years early. ${fmt(result.interestSavings.totalInterestSaved)} interest saved.`, color: "green" },
                        { step: 7, title: "MGA Compounding", desc: `Interest saved grows at 6.25% in Multi Guaranteed Annuity → ${fmt(result.interestSavings.mgaAnnuityValue30yr)} over 30 years`, color: "purple" },
                      ].map(({ step, title, desc, color }) => (
                        <div key={step} className={`p-4 rounded-lg border-2 border-${color}-200 bg-${color}-50/30`}>
                          <div className={`w-8 h-8 rounded-full bg-${color}-500 text-white flex items-center justify-center text-sm font-bold mb-2`}>
                            {step}
                          </div>
                          <h4 className="font-semibold text-sm">{title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Final Numbers */}
                <Card>
                  <CardHeader><CardTitle>Final Numbers</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total IUL Premiums Paid</p>
                        <p className="text-xl font-bold">{fmt(result.summary.totalIulPremiums)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total Policy Loans Taken</p>
                        <p className="text-xl font-bold text-emerald-600">{fmt(result.summary.totalPolicyLoans)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total HELOC Drawn</p>
                        <p className="text-xl font-bold text-orange-600">{fmt(result.summary.totalHelocDrawn)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Final IUL Illustrated Policy Value</p>
                        <p className="text-xl font-bold text-blue-600">{fmt(result.summary.finalPolicyCashValue)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Compounded Interest Savings</p>
                        <p className="text-xl font-bold text-indigo-600">{fmt(result.interestSavings.compoundedValue20yr)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-100">
                        <p className="text-xs text-green-700">Total Wealth Created</p>
                        <p className="text-xl font-bold text-green-700">{fmt(result.summary.totalWealthCreated)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="mortgage-killer"
              hasResults={!!result}
              resultData={result ? { interestSaved: result.summary.totalInterestSaved, yearsReduced: result.summary.yearsSaved, iulCashValue: result.summary.finalPolicyCashValue, iulDeathBenefit: result.summary.finalPolicyCashValue * 3, totalOpportunityCost: result.interestSavings.compoundedValue20yr, monthlyPayment: form.monthlyMortgagePayment, originalBalance: form.mortgageBalance, helocUsed: true, helocAmount: result.summary.totalHelocDrawn } : null}
              metrics={result ? [{ label: "Total Interest Saved", value: result.summary.totalInterestSaved, highlight: true, icon: PiggyBank, color: "text-emerald-400" }, { label: "Years Reduced", value: result.summary.yearsSaved, format: "years", icon: Clock }, { label: "IUL Cash Value", value: result.summary.finalPolicyCashValue, icon: Banknote, color: "text-blue-400" }, { label: "Death Benefit", value: result.summary.finalPolicyCashValue * 3, icon: Shield, color: "text-purple-400" }, { label: "Total Wealth Created", value: result.summary.totalWealthCreated, icon: TrendingUp, color: "text-emerald-400" }, { label: "20yr Compounded", value: result.interestSavings.compoundedValue20yr, icon: BarChart3 }, { label: "HELOC Drawn", value: result.summary.totalHelocDrawn, icon: Landmark }, { label: "Monthly Payment", value: form.monthlyMortgagePayment, icon: DollarSign }] : []}
              projectionData={result ? Array.from({ length: 20 }, (_, i) => ({ year: i + 1, interestSaved: result.summary.totalInterestSaved * ((i + 1) / 20), cashValue: result.summary.finalPolicyCashValue * ((i + 1) / 20) * (1 + (i + 1) * 0.015), wealthCreated: result.summary.totalWealthCreated * ((i + 1) / 20) })) : undefined}
              projectionLines={[{ dataKey: "interestSaved", name: "Interest Saved", color: "#22c55e" }, { dataKey: "cashValue", name: "IUL Cash Value", color: "#3b82f6" }, { dataKey: "wealthCreated", name: "Wealth Created", color: "#a855f7" }]}
              onRecalculate={() => setActiveTab("factfinder")}
            />
          </TabsContent>
        </Tabs>
        <NAICDisclaimer variant="footer" showsProjections showsCashValues showsPolicyLoans showsComparisons />
      </div>
          <PageInsights pageId="mortgage-killer" />
    
        <ComplianceFooter pageName="MortgageKiller" showsIUL showsAnnuity showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
