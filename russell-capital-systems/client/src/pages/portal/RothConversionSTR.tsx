// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearch } from "wouter";
import { IUL_CARRIERS, getCarrierById, ILLUSTRATION_TOOLS, type IULCarrier } from "@shared/iulCarriers";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from "recharts";
import {
  Brain, Calculator, ChevronDown, ChevronUp, Home, Building,
  TrendingUp, DollarSign, ArrowRight, Info, Sun,
  PiggyBank, Landmark, Shield, Zap, Repeat, Banknote, Download,
  SlidersHorizontal, Send, ExternalLink, BookOpen, Award,
  Save, History, Trash2, BarChart3, Shuffle, Eye, Grid3X3, Sparkles, Archive, Clock, FileText, FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { NumberInput } from "@/components/NumberInput";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { OilGasToggle } from "@/components/OilGasToggle";
import { PageInsights } from "@/components/PageInsights";
import { useStrategy } from "@/contexts/StrategyContext";
import { StrategyFlowBanner } from "@/components/StrategyFlowBanner";
import { MonteCarloChart } from "@/components/MonteCarloChart";
import { runMonteCarlo, MONTE_CARLO_PRESETS } from "@shared/monteCarloEngine";
import { GuidedModeToggle } from "@/components/GuidedWizard";
import { ReportGenerator, type ReportSection } from "@/components/ReportGenerator";
import { ExportToSlides } from "@/components/ExportToSlides";
import { DataFeedInline } from "@/components/DataFeedBadge";
import { trpc as trpcClient } from "@/lib/trpc";

import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

/* ── Strategy option definitions ── */
const STRATEGY_OPTIONS = [
  { key: "1yr-non-solar", label: "0% Year 1 — Non Solar", years: 1, solar: false, color: "blue" },
  { key: "2yr-non-solar", label: "0% Year 2 — Non Solar", years: 2, solar: false, color: "blue" },
  { key: "3yr-non-solar", label: "0% Year 3 — Non Solar", years: 3, solar: false, color: "blue" },
  { key: "4yr-non-solar", label: "0% Year 4 — Non Solar", years: 4, solar: false, color: "blue" },
  { key: "5yr-non-solar", label: "0% Year 5 — Non Solar", years: 5, solar: false, color: "blue" },
  { key: "1yr-solar", label: "0% Year 1 — Solar Equity", years: 1, solar: true, color: "amber" },
] as const;

type StrategyKey = (typeof STRATEGY_OPTIONS)[number]["key"];

export default function RothConversionSTR() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preClientId = params.get("clientId") ?? "";

  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const clients = clientsQuery.data ?? [];

  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>("1yr-non-solar");
  const activeStrategyDef = STRATEGY_OPTIONS.find((s) => s.key === selectedStrategy)!;

  const [form, setForm] = useState({
    clientId: preClientId,
    iraBalance: "",
    conversionPortion: "1",
    homeEquity: "",
    age: "",
    income: "",
    filingStatus: "married" as "single" | "married" | "hoh",
    currentTaxBracket: "0.24",
    iulYears: "20",
    mortgageRate: "0.065",
  });

  /* ── What-if scenario toggles ── */
  const [rentalGross, setRentalGross] = useState(20);
  const [appreciation, setAppreciation] = useState(5);
  const [helocRate, setHelocRate] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showWhatIf, setShowWhatIf] = useState(false);
  const [showCarrier, setShowCarrier] = useState(false);
  const [carrierId, setCarrierId] = useState("a-mutual");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [saveNotes, setSaveNotes] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showStressTest, setShowStressTest] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showCompareCarriers, setShowCompareCarriers] = useState(false);
  const [showBacktest, setShowBacktest] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showSavedScenarios, setShowSavedScenarios] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showWhatIfSliders, setShowWhatIfSliders] = useState(false);
  const [whatIfValues, setWhatIfValues] = useState<{
    iraBalance: number; age: number; taxBracket: number;
    homeEquity: number; conversionPortion: number;
  } | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<any>(null);
  const [whatIfDebounceTimer, setWhatIfDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [notifyClient, setNotifyClient] = useState(true);
  const [updatingStrategyId, setUpdatingStrategyId] = useState<number | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<number | null>(null);

  const { data: clientData } = useClientData();
  useEffect(() => {
    if (!clientData) return;
    setForm(p => ({
      ...p,
      iraBalance: clientData.iraBalance ? String(clientData.iraBalance) : p.iraBalance,
      income: clientData.annualIncome ? String(clientData.annualIncome) : p.income,
      age: clientData.age ? String(clientData.age) : p.age,
      filingStatus: (clientData.filingStatus as any) || p.filingStatus,
    }));
  }, [clientData]);
  const selectedCarrier = getCarrierById(carrierId);

  const recommendMut = trpc.carrierOverrides.recommend.useMutation();
  const recommendations = recommendMut.data ?? [];
  const handleRunRecommendation = () => {
    recommendMut.mutate({
      age: Number(form.age) || 45,
      riskTolerance,
      annualPremium: Number(form.iraBalance) * 0.05 || 25000,
      clientId: form.clientId ? Number(form.clientId) : undefined,
      clientName: clients?.find((c) => c.id === Number(form.clientId))?.name || undefined,
      saveHistory: true,
    });
  };
  const recHistoryQuery = trpc.recommendationHistory.list.useQuery(
    { clientId: form.clientId ? Number(form.clientId) : undefined, limit: 10 },
    { staleTime: 30_000, enabled: showRecommendation }
  );
  const recHistory = recHistoryQuery.data ?? [];

  const carrierOverridesQuery = trpc.carrierOverrides.list.useQuery(undefined, { staleTime: 60_000 });
  const carrierOverrides = carrierOverridesQuery.data ?? [];
  const activeOverride = carrierOverrides.find((o) => o.carrierId === carrierId);

  const effectiveRates = useMemo(() => {
    if (activeOverride) {
      return {
        loadFee: parseFloat(activeOverride.loadFee ?? "0.08"),
        coiRate: parseFloat(activeOverride.coiRate ?? "0.008"),
        loanRate: selectedCarrier.loanRate,
        avgReturn: parseFloat(activeOverride.avgReturn ?? "0.075"),
        capRate: parseFloat(activeOverride.capRate ?? "0.145"),
        floorRate: parseFloat(activeOverride.floorRate ?? "0.00"),
      };
    }
    if (carrierId !== "generic") {
      return {
        loadFee: selectedCarrier.loadFee,
        coiRate: selectedCarrier.coiRate,
        loanRate: selectedCarrier.loanRate,
        avgReturn: selectedCarrier.avgIllustratedRate,
        capRate: selectedCarrier.capRate ?? 0.12,
        floorRate: selectedCarrier.floorRate ?? 0,
      };
    }
    return { loadFee: 0.08, coiRate: 0.008, loanRate: 0.05, avgReturn: 0.075, capRate: 0.145, floorRate: 0 }; // AG 49 max
  }, [carrierId, activeOverride, selectedCarrier]);

  const savedQuery = trpc.savedStrategies.list.useQuery(
    { clientId: form.clientId ? Number(form.clientId) : undefined, includeArchived: showArchived },
    { staleTime: 30_000 }
  );
  const archiveMut = trpc.savedStrategies.toggleArchive.useMutation({
    onSuccess: (data: any) => {
      toast.success(data?.isArchived ? "Strategy archived" : "Strategy unarchived");
      savedQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const saveMut = trpc.savedStrategies.save.useMutation({
    onSuccess: (data: any) => {
      if (data?.notificationSent) {
        toast.success("Strategy saved & client notified via email");
      } else {
        toast.success("Strategy saved to history");
      }
      savedQuery.refetch();
      setShowSaveDialog(false);
      setSaveNotes("");
      setNotifyClient(true);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.savedStrategies.delete.useMutation({
    onSuccess: () => {
      toast.success("Strategy deleted");
      savedQuery.refetch();
    },
  });
  const updateMut = trpc.savedStrategies.update.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Strategy updated to v${data?.version ?? "?"}`); 
      savedQuery.refetch();
      setShowSaveDialog(false);
      setSaveNotes("");
      setUpdatingStrategyId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSaveStrategy = () => {
    if (!result) return;
    setSavingStrategy(true);
    const client = clients.find((c) => c.id === Number(form.clientId));
    const payload = {
      clientId: form.clientId ? Number(form.clientId) : undefined,
      clientName: client?.name,
      strategyType: selectedStrategy,
      strategyLabel: activeStrategyDef.label,
      carrierId: carrierId !== "generic" ? carrierId : undefined,
      carrierName: carrierId !== "generic" ? selectedCarrier.name : undefined,
      inputsJson: result.inputs,
      summaryJson: result.summary,
      iulProjectionJson: result.iulProjection,
      strProjectionJson: result.strProjection,
      notes: saveNotes || undefined,
      notifyClient: notifyClient && !!form.clientId && !!client?.email,
      portalOrigin: window.location.origin,
    };
    if (updatingStrategyId) {
      updateMut.mutate({ ...payload, parentStrategyId: updatingStrategyId }, { onSettled: () => setSavingStrategy(false) });
    } else {
      saveMut.mutate(payload, { onSettled: () => setSavingStrategy(false) });
    }
  };

  const loadSavedStrategy = (saved: any) => {
    const inp = saved.inputsJson as any;
    setForm({
      clientId: saved.clientId ? String(saved.clientId) : "",
      iraBalance: String(inp.iraBalance ?? ""),
      conversionPortion: String(inp.conversionPortion ?? "1"),
      homeEquity: String(inp.homeEquity ?? ""),
      age: String(inp.age ?? ""),
      income: String(inp.income ?? ""),
      filingStatus: inp.filingStatus ?? "married",
      currentTaxBracket: String(inp.currentTaxBracket ?? "0.24"),
      iulYears: String(inp.iulYears ?? "20"),
      mortgageRate: String(inp.mortgageRate ?? "0.065"),
    });
    const strat = STRATEGY_OPTIONS.find((s) => s.key === saved.strategyType);
    if (strat) setSelectedStrategy(strat.key);
    if (saved.carrierId) setCarrierId(saved.carrierId);
    if (inp.rentalGrossYield) setRentalGross(Math.round(inp.rentalGrossYield * 100));
    if (inp.realEstateAppreciation) setAppreciation(Math.round(inp.realEstateAppreciation * 100));
    if (inp.helocRate) setHelocRate(Math.round(inp.helocRate * 100));
    toast.success(`Loaded saved strategy: ${saved.strategyLabel}`);
    setShowHistory(false);
  };

  useEffect(() => {
    if (!form.clientId) return;
    const c = clients.find((cl) => cl.id === Number(form.clientId));
    if (!c) return;
    const inc = Number(c.income ?? 0);
    const inferBracket = (income: number): string => {
      if (income >= 731200) return "0.37";
      if (income >= 487450) return "0.35";
      if (income >= 383900) return "0.32";
      if (income >= 201050) return "0.24";
      if (income >= 94300) return "0.22";
      if (income >= 23200) return "0.12";
      return "0.10";
    };
    setForm((p) => ({
      ...p,
      age: String(c.age ?? ""),
      income: String(c.income ?? ""),
      iraBalance: String(c.iraBalance ?? ""),
      homeEquity: String(c.realEstateEquity ?? "0"),
      currentTaxBracket: inc > 0 ? inferBracket(inc) : p.currentTaxBracket,
    }));
    toast.success(`Loaded data for ${c.name}`);
  }, [form.clientId, clients.length]);

  const projectMut = trpc.rothConversion.project.useMutation({
    onError: (e: any) => toast.error(e.message),
    onSuccess: () => toast.success(`${activeStrategyDef.label} projection complete`),
  });

  const runProjection = () => {
    if (!form.iraBalance || !form.homeEquity || !form.age || !form.income) {
      return toast.error("IRA balance, home equity, age, and income are required");
    }
    projectMut.mutate({
      clientId: form.clientId ? Number(form.clientId) : undefined,
      iraBalance: Number(form.iraBalance),
      conversionPortion: Number(form.conversionPortion),
      homeEquity: Number(form.homeEquity),
      age: Number(form.age),
      income: Number(form.income),
      filingStatus: form.filingStatus,
      currentTaxBracket: Number(form.currentTaxBracket),
      rentalGrossYield: rentalGross / 100,
      realEstateAppreciation: appreciation / 100,
      helocRate: helocRate / 100,
      iulYears: Number(form.iulYears),
      mortgageRate: Number(form.mortgageRate),
      strategyYears: activeStrategyDef.years,
      solarEquity: activeStrategyDef.solar,
      ...(carrierId !== "generic" || activeOverride ? {
        carrierId,
        carrierLoadFee: effectiveRates.loadFee,
        carrierCoiRate: effectiveRates.coiRate,
        carrierLoanRate: effectiveRates.loanRate,
        carrierAvgReturn: effectiveRates.avgReturn,
      } : {}),
    });
  };

  const result = projectMut.data;

  const { publishResult } = useStrategy();
  useEffect(() => {
    if (!result) return;
    publishResult({
      type: "roth-conversion",
      data: {
        totalConverted: result.summary.totalPremiumsPaid,
        taxPaid: result.summary.strPrincipalPayments,
        endingRothBalance: result.summary.finalRothBalance ?? 0,
        endingIraBalance: 0,
        yearsOfConversion: activeStrategyDef.years,
        targetBracket: Number(form.currentTaxBracket),
        irmaaSurcharge: 0,
        ladderData: (result as any).yearByYear?.map((y) => ({
          year: y.year,
          conversion: y.rothConversion ?? 0,
          tax: y.taxSaved ?? 0,
          iraBalance: y.iraBalance ?? 0,
          rothBalance: y.rothBalance ?? 0,
        })) ?? [],
      },
    });
  }, [result]);

  const monteCarloResult = useMemo(() => {
    if (!result || !showMonteCarlo) return null;
    return runMonteCarlo({
      simulations: 1000,
      years: 20,
      initialValue: (result.summary.totalPremiumsPaid ?? Number(form.iraBalance)) || 500000,
      ...MONTE_CARLO_PRESETS.iulModerate,
      capReturn: effectiveRates.capRate,
      floorReturn: effectiveRates.floorRate,
      annualContribution: 0,
      contributionGrowthRate: 0,
    });
  }, [result, showMonteCarlo, effectiveRates]);

  const [guidedMode, setGuidedMode] = useState(false);

  const dataFeedQuery = trpcClient.dataFeeds.snapshot.useQuery(undefined, { staleTime: 5 * 60_000 });
  const feedData = dataFeedQuery.data;

  const getReportSections = useCallback((): ReportSection[] => {
    if (!result) return [];
    return [
      {
        id: "summary",
        title: `Roth Conversion — ${activeStrategyDef.label}`,
        items: [
          { label: "Total Premiums", value: fmtFull(result.summary.totalPremiumsPaid) },
          { label: "STR Principal", value: fmtFull(result.summary.strPrincipalPayments), color: "emerald" },
          { label: "Total Rental Income", value: fmtFull(result.summary.totalRentalIncome) },
          { label: "Final Property Value", value: fmtFull(result.summary.finalPropertyValue ?? 0) },
          { label: "IUL Cash Value", value: fmtFull(result.summary.finalNetCashValue), color: "blue" },
          { label: "Final Roth Balance", value: fmtFull(result.summary.finalRothBalance ?? 0), color: "emerald" },
        ],
      },
    ];
  }, [result, activeStrategyDef]);

  const getReportBullets = useCallback((): string[] => {
    if (!result) return [];
    return [
      `${activeStrategyDef.label} strategy deploys ${fmtFull(result.summary.totalPremiumsPaid)} in total premiums with ${fmtFull(result.summary.strPrincipalPayments)} in STR principal.`,
      `STR properties generate ${fmtFull(result.summary.totalRentalIncome)} in rental income with ${fmtFull(result.summary.finalPropertyValue ?? 0)} in final property value.`,
      `IUL policy builds ${fmtFull(result.summary.finalNetCashValue)} in illustrated cash value over 20 years.`,
    ];
  }, [result, activeStrategyDef]);

  const stressTestMut = trpc.rothConversion.rateStressTest.useMutation();
  const stressTestData = stressTestMut.data;

  const benchmarkQuery = trpc.rothConversion.lauraColeman.useQuery(undefined, {
    staleTime: Infinity,
    enabled: showBenchmark,
  });
  const benchmarkData = benchmarkQuery.data;

  const compareCarriersMut = trpc.rothConversion.compareCarriers.useMutation();
  const compareData = compareCarriersMut.data;

  const backtestMut = trpc.rothConversion.historicalBacktest.useMutation();
  const backtestData = backtestMut.data;

  const shareMut = trpc.sharedProjections.create.useMutation();
  const quoteMut = trpc.carrierQuotes.create.useMutation();

  const savedScenariosQuery = trpc.scenarios.list.useQuery();
  const saveScenarioMut = trpc.scenarios.save.useMutation({
    onSuccess: (data) => { toast.success(`Scenario "${data.name}" saved!`); savedScenariosQuery.refetch(); },
    onError: () => toast.error('Failed to save scenario'),
  });
  const deleteScenarioMut = trpc.scenarios.delete.useMutation({
    onSuccess: () => { toast.success('Scenario deleted'); savedScenariosQuery.refetch(); },
    onError: () => toast.error('Failed to delete scenario'),
  });

  const whatIfMut = trpc.rothConversion.project.useMutation({
    onSuccess: (data) => setWhatIfResult(data),
    onError: () => {},
  });

  useEffect(() => {
    if (showWhatIfSliders && result && !whatIfValues) {
      setWhatIfValues({
        iraBalance: result.inputs.iraBalance,
        age: result.inputs.age,
        taxBracket: result.inputs.currentTaxBracket,
        homeEquity: result.inputs.homeEquity,
        conversionPortion: result.inputs.conversionPortion,
      });
      setWhatIfResult(null);
    }
    if (!showWhatIfSliders) {
      setWhatIfValues(null);
      setWhatIfResult(null);
    }
  }, [showWhatIfSliders, result?.inputs?.iraBalance]);

  const runWhatIfProjection = useCallback((vals: NonNullable<typeof whatIfValues>) => {
    if (!result) return;
    if (whatIfDebounceTimer) clearTimeout(whatIfDebounceTimer);
    const timer = setTimeout(() => {
      whatIfMut.mutate({
        clientId: form.clientId ? Number(form.clientId) : undefined,
        iraBalance: vals.iraBalance,
        conversionPortion: vals.conversionPortion,
        homeEquity: vals.homeEquity,
        age: vals.age,
        income: Number(form.income),
        filingStatus: form.filingStatus,
        currentTaxBracket: vals.taxBracket,
        rentalGrossYield: rentalGross / 100,
        realEstateAppreciation: appreciation / 100,
        helocRate: helocRate / 100,
        iulYears: Number(form.iulYears),
        mortgageRate: Number(form.mortgageRate),
        strategyYears: activeStrategyDef.years,
        solarEquity: activeStrategyDef.solar,
        ...(carrierId !== "generic" ? {
          carrierId,
          carrierLoadFee: effectiveRates.loadFee,
          carrierCoiRate: effectiveRates.coiRate,
          carrierLoanRate: effectiveRates.loanRate,
          carrierAvgReturn: effectiveRates.avgReturn,
        } : {}),
      });
    }, 300);
    setWhatIfDebounceTimer(timer);
  }, [result, form, rentalGross, appreciation, helocRate, carrierId, effectiveRates, activeStrategyDef]);

  const updateWhatIfSlider = (key: keyof NonNullable<typeof whatIfValues>, value: number) => {
    if (!whatIfValues) return;
    const updated = { ...whatIfValues, [key]: value };
    setWhatIfValues(updated);
    runWhatIfProjection(updated);
  };

  useEffect(() => {
    if (result && showCompareCarriers && !compareCarriersMut.isPending && !compareData) {
      compareCarriersMut.mutate({
        iraBalance: result.inputs.iraBalance,
        conversionPortion: result.inputs.conversionPortion,
        homeEquity: result.inputs.homeEquity,
        age: result.inputs.age,
        income: result.inputs.income,
        filingStatus: result.inputs.filingStatus as "single" | "married" | "hoh",
        currentTaxBracket: result.inputs.currentTaxBracket,
        iulYears: result.inputs.iulYears,
        strategyYears: result.inputs.strategyYears,
        solarEquity: result.inputs.solarEquity,
        rentalGrossYield: result.inputs.rentalGrossYield,
        realEstateAppreciation: result.inputs.realEstateAppreciation,
        helocRate: result.inputs.helocRate,
      });
    }
  }, [showCompareCarriers, result?.inputs?.iraBalance]);

  useEffect(() => {
    if (result && showBacktest && !backtestMut.isPending && !backtestData) {
      backtestMut.mutate({
        iraBalance: result.inputs.iraBalance,
        conversionPortion: result.inputs.conversionPortion,
        homeEquity: result.inputs.homeEquity,
        age: result.inputs.age,
        income: result.inputs.income,
        filingStatus: result.inputs.filingStatus as "single" | "married" | "hoh",
        currentTaxBracket: result.inputs.currentTaxBracket,
        iulYears: result.inputs.iulYears,
        strategyYears: result.inputs.strategyYears,
        solarEquity: result.inputs.solarEquity,
        rentalGrossYield: result.inputs.rentalGrossYield,
        realEstateAppreciation: result.inputs.realEstateAppreciation,
        helocRate: result.inputs.helocRate,
      });
    }
  }, [showBacktest, result?.inputs?.iraBalance]);

  useEffect(() => {
    if (result && showStressTest && !stressTestMut.isPending) {
      stressTestMut.mutate({
        iraBalance: result.inputs.iraBalance,
        conversionPortion: result.inputs.conversionPortion,
        homeEquity: result.inputs.homeEquity,
        age: result.inputs.age,
        income: result.inputs.income,
        filingStatus: result.inputs.filingStatus as "single" | "married" | "hoh",
        currentTaxBracket: result.inputs.currentTaxBracket,
        iulYears: result.inputs.iulYears,
        strategyYears: result.inputs.strategyYears,
        solarEquity: result.inputs.solarEquity,
        rentalGrossYield: result.inputs.rentalGrossYield,
        realEstateAppreciation: result.inputs.realEstateAppreciation,
        helocRate: result.inputs.helocRate,
        rates: [0.05, 0.06, 0.065, 0.075],
      });
    }
  }, [showStressTest, result?.inputs?.iraBalance]);

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
    : `$${Math.round(n).toLocaleString()}`;
  const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const downloadPdf = () => {
    if (!result) return;
    const q = new URLSearchParams({
      iraBalance: String(result.inputs.iraBalance),
      conversionPortion: String(result.inputs.conversionPortion),
      homeEquity: String(result.inputs.homeEquity),
      age: String(result.inputs.age),
      income: String(result.inputs.income),
      filingStatus: result.inputs.filingStatus,
      currentTaxBracket: String(result.inputs.currentTaxBracket),
      iulYears: String(result.inputs.iulYears),
      strategyYears: String(result.inputs.strategyYears),
      solarEquity: String(result.inputs.solarEquity),
      rentalGrossYield: String(result.inputs.rentalGrossYield),
      realEstateAppreciation: String(result.inputs.realEstateAppreciation),
      helocRate: String(result.inputs.helocRate),
      ...(result.iulParams.carrierId ? { carrierId: result.iulParams.carrierId } : {}),
    });
    window.open(`/api/roth-report?${q.toString()}`, "_blank");
    toast.success("Generating PDF report...");
  };

  const sendToClient = async () => {
    if (!result || !form.clientId) {
      toast.error("Select a client and run a projection first");
      return;
    }
    const client = clients.find((c) => c.id === Number(form.clientId));
    if (!client?.email) {
      toast.error("Client has no email address on file");
      return;
    }
    setSendingEmail(true);
    try {
      const resp = await fetch("/api/roth-report/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientId: Number(form.clientId),
          clientEmail: client.email,
          clientName: client.name,
          ...result.inputs,
          ...(result.iulParams.carrierId ? { carrierId: result.iulParams.carrierId } : {}),
        }),
      });
      if (resp.ok) {
        toast.success(`Strategy report sent to ${client.email}`);
      } else {
        toast.error("Failed to send email");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const isSolar = activeStrategyDef.solar;
  const accentColor = isSolar ? "amber" : "blue";
  const accentHex = isSolar ? "#f59e0b" : "#3b82f6";

  /* ── Sensitivity Analysis Grid ── */
  const sensitivityGrid = useMemo(() => {
    if (!result) return null;
    const returnRates = [0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12];
    const volatilities = [0.10, 0.12, 0.15, 0.18, 0.20];
    const years = result.iulProjection.length;
    const SIMS = 200; // per cell
    const rows: { returnRate: number; cells: { vol: number; value: number; isBase: boolean }[] }[] = [];
    for (const ret of returnRates) {
      const cells: { vol: number; value: number; isBase: boolean }[] = [];
      for (const vol of volatilities) {
        const finalValues: number[] = [];
        for (let s = 0; s < SIMS; s++) {
          let av = 0;
          for (let y = 0; y < years; y++) {
            const premium = result.iulProjection[y].premium;
            const loadFee = result.iulParams.loadFee;
            const coiRate = result.iulParams.coiRate;
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const randomReturn = Math.max(0, ret + vol * z);
            av += premium * (1 - loadFee);
            av += av * randomReturn;
            av -= av * coiRate;
            av = Math.max(0, av);
          }
          const loanBal = result.iulProjection[years - 1]?.cumulativeLoanBalance ?? 0;
          finalValues.push(Math.max(0, av - loanBal));
        }
        finalValues.sort((a, b) => a - b);
        const median = finalValues[Math.floor(finalValues.length / 2)];
        cells.push({ vol, value: Math.round(median), isBase: ret === 0.10 && vol === 0.15 });
      }
      rows.push({ returnRate: ret, cells });
    }
    const allVals = rows.flatMap(r => r.cells.map((c) => c.value));
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    return { rows, volatilities, minVal, maxVal };
  }, [result]);

  const getSensitivityColor = (value: number, min: number, max: number) => {
    if (max === min) return "bg-emerald-500/20 text-emerald-400";
    const ratio = (value - min) / (max - min);
    if (ratio >= 0.8) return "bg-emerald-500/20 text-emerald-400";
    if (ratio >= 0.6) return "bg-emerald-500/10 text-emerald-300";
    if (ratio >= 0.4) return "bg-blue-500/10 text-blue-300";
    if (ratio >= 0.2) return "bg-orange-500/10 text-orange-300";
    return "bg-red-500/10 text-red-400";
  };

  /* ── Monte Carlo Simulation ── */
  const monteCarloData = useMemo(() => {
    if (!result) return null;
    const baseReturn = result.iulParams.avgReturn;
    const years = result.iulProjection.length;
    const SIMS = 500;
    const VOLATILITY = 0.15; // S&P 500 historical vol ~15%
    const percentiles = [10, 25, 50, 75, 90];

    const allPaths: number[][] = [];
    for (let s = 0; s < SIMS; s++) {
      const path: number[] = [];
      let accountValue = 0;
      for (let y = 0; y < years; y++) {
        const row = result.iulProjection[y];
        const premium = row.premium;
        const loadFee = result.iulParams.loadFee;
        const coiRate = result.iulParams.coiRate;
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const randomReturn = Math.max(0, baseReturn + VOLATILITY * z); // Floor at 0% (IUL floor)
        const netPremium = premium * (1 - loadFee);
        accountValue += netPremium;
        const interest = accountValue * randomReturn;
        accountValue += interest;
        const coi = accountValue * coiRate;
        accountValue -= coi;
        path.push(Math.max(0, accountValue));
      }
      allPaths.push(path);
    }

    const chartData = [];
    for (let y = 0; y < years; y++) {
      const yearValues = allPaths.map((p) => p[y]).sort((a, b) => a - b);
      const entry: any = { year: y + 1 };
      for (const pct of percentiles) {
        const idx = Math.floor((pct / 100) * yearValues.length);
        entry[`p${pct}`] = Math.round(yearValues[Math.min(idx, yearValues.length - 1)]);
      }
      entry.actual = Math.round(result.iulProjection[y].endingAccountValue);
      chartData.push(entry);
    }
    return chartData;
  }, [result]);

  return (
    <AppShell>
      <div className="rc-page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
            <Landmark size={18} className="text-[#22c55e]" />
          </div>
          <div>
            <h1 className="rc-page-title">0% Roth Conversion Strategies</h1>
            <p className="rc-page-subtitle">
              6 Options &middot; 1-5 Year Non Solar + Solar Equity &middot; 20-Year IUL Cascade
            </p>
          </div>
        </div>
        {result && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowSaveDialog(true)}
              className="rc-btn rc-btn-outline flex items-center gap-2 text-sm">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setShowHistory(!showHistory)}
              className="rc-btn rc-btn-outline flex items-center gap-2 text-sm">
              <History size={14} /> History ({savedQuery.data?.length ?? 0})
            </button>
            <button onClick={() => setShowMonteCarlo(!showMonteCarlo)}
              className={`rc-btn rc-btn-outline flex items-center gap-2 text-sm ${showMonteCarlo ? 'border-purple-500/50 text-purple-400' : ''}`}>
              <Shuffle size={14} /> Monte Carlo
            </button>
            <button onClick={() => setShowSensitivity(!showSensitivity)}
              className={`rc-btn rc-btn-outline flex items-center gap-2 text-sm ${showSensitivity ? 'border-cyan-500/50 text-cyan-400' : ''}`}>
              <Grid3X3 size={14} /> Sensitivity
            </button>
            <button onClick={() => setShowStressTest(!showStressTest)}
              className={`rc-btn rc-btn-outline flex items-center gap-2 text-sm ${showStressTest ? 'border-amber-500/50 text-amber-400' : ''}`}>
              <BarChart3 size={14} /> Rate Stress
            </button>
            <button onClick={() => setShowBenchmark(!showBenchmark)}
              className={`rc-btn rc-btn-outline flex items-center gap-2 text-sm ${showBenchmark ? 'border-emerald-500/50 text-emerald-400' : ''}`}>
              <Award size={14} /> Benchmark
            </button>
            <button onClick={() => setShowCompareCarriers(!showCompareCarriers)}
              className={`rc-btn rc-btn-outline flex items-center gap-2 text-sm ${showCompareCarriers ? 'border-purple-500/50 text-purple-400' : ''}`}>
              <Shuffle size={14} /> Compare Carriers
            </button>
            <button onClick={() => setShowBacktest(!showBacktest)}
              className={`rc-btn rc-btn-outline flex items-center gap-2 text-sm ${showBacktest ? 'border-rose-500/50 text-rose-400' : ''}`}>
              <BarChart3 size={14} /> S&P Backtest
            </button>
            <button onClick={() => setShowWhatIfSliders(!showWhatIfSliders)}
              className={`rc-btn rc-btn-outline flex items-center gap-2 text-sm ${showWhatIfSliders ? 'border-sky-500/50 text-sky-400' : ''}`}>
              <SlidersHorizontal size={14} /> What-If
            </button>
            <button onClick={() => {
              if (!result) return;
              shareMut.mutate({
                clientId: form.clientId ? Number(form.clientId) : undefined,
                clientName: (form as any).clientName || "Client",
                projectionData: result,
                inputData: result.inputs,
              }, {
                onSuccess: (data) => {
                  setShareUrl(`https://www.RussellCapitalSystems.com${data.shareUrl}`);
                  setShowShareDialog(true);
                  toast.success("Share link created!");
                },
                onError: () => toast.error("Failed to create share link"),
              });
            }} disabled={shareMut.isPending}
              className="rc-btn rc-btn-outline flex items-center gap-2 text-sm">
              <ExternalLink size={14} /> {shareMut.isPending ? "Creating..." : "Share with Client"}
            </button>
            {form.clientId && (
              <button onClick={sendToClient} disabled={sendingEmail}
                className="rc-btn rc-btn-outline flex items-center gap-2 text-sm">
                <Send size={14} /> {sendingEmail ? "Sending..." : "Send to Client"}
              </button>
            )}
            <button onClick={downloadPdf} className="rc-btn rc-btn-outline flex items-center gap-2 text-sm">
              <Download size={14} /> Download PDF
            </button>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 space-y-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="RothConversionSTR" />

        <ExecutiveSummary
          pageTitle="Roth Conversion STR"
          whatItDoes="This tax optimization tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex tax optimization concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Tax bracket management is the most overlooked wealth-building tool. Even small reductions in your effective rate compound into massive savings over a lifetime."
          intent="To give you the same caliber of tax optimization analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your tax optimization options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how tax optimization strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this tax optimization strategy interact with my other financial plans?",
            "What\'s the single biggest tax optimization opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Roth Conversion STR" pageContext="Roth Conversion STR — tax optimization modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This tax optimization strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended tax optimization approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={185000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Annual Tax Savings", doNothing: 0, recommended: 12500, format: "currency" },
            { label: "Effective Tax Rate", doNothing: 28, recommended: 21, format: "percent", higherIsBetter: false },
            { label: "20-Year Tax Savings", doNothing: 0, recommended: 250000, format: "currency" },
          ]}
          summary="Without taking action on tax optimization, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Cross-Tool Integration Banner */}
        <StrategyFlowBanner
          currentStrategy="roth-conversion"
          onApplyInbound={(flowData) => {
            if (flowData.conversionIncome) setForm(p => ({ ...p, iraBalance: String(flowData.conversionIncome * 10) }));
          }}
        />

        {/* Real-Time Market Data */}
        {feedData && (
          <DataFeedInline
            feeds={[
              ...(feedData.treasuryRates?.slice(0, 2).map((t) => ({
                name: t.term,
                value: `${t.yield?.toFixed(2) ?? t.value?.toFixed(2)}%`,
                source: t.source as "live" | "cached" | "static",
              })) ?? []),
              ...(feedData.cpi ? [{
                name: "CPI",
                value: `${feedData.cpi.annualRate?.toFixed(1) ?? feedData.cpi.value?.toFixed(1)}%`,
                source: feedData.cpi.source as "live" | "cached" | "static",
              }] : []),
            ]}
          />
        )}

        {/* Mode Toggle & Report */}
        <div className="flex items-center justify-between">
          <GuidedModeToggle isGuided={guidedMode} onToggle={setGuidedMode} />
          {result && (
            <div className="flex items-center gap-2">
              <ExportToSlides
                toolName={`Roth Conversion — ${activeStrategyDef.label}`}
                getSections={getReportSections}
                getBullets={getReportBullets}
              />
              <ReportGenerator pageTitle={`Roth Conversion — ${activeStrategyDef.label}`} getSections={getReportSections} getBullets={getReportBullets} />
            </div>
          )}
        </div>

        {/* Monte Carlo Simulation */}
        {showMonteCarlo && monteCarloResult && (
          <MonteCarloChart
            result={monteCarloResult}
            title="Monte Carlo: IUL Cash Value from Roth Conversion"
            subtitle={`${monteCarloResult.config.simulations?.toLocaleString()} simulations — ${(effectiveRates.capRate * 100).toFixed(0)}% cap, ${(effectiveRates.floorRate * 100).toFixed(0)}% floor`}
          />
        )}
        {/* Strategy explanation */}
        <div className="rc-card border-l-4 border-l-[#22c55e]">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-[#22c55e] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#7a95b8] space-y-2">
              <p className="text-white font-medium">How the 0% Roth Conversion Strategies Work:</p>
              <p>Convert your full IRA value to Roth (new Roth IRA = entire IRA). Tax savings = 50% of original IRA. Leverage IRA &divide; 0.4 to purchase STR property with 30% down from HELOC. Multi-year strategies spread property purchases over 2-5 years.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e]">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={14} className="text-blue-400" />
                    <span className="text-white font-medium text-xs">Non Solar (Year 1-5)</span>
                  </div>
                  <p className="text-xs">Y1: Half tax savings &rarr; IUL premium. Y2: Other half. Month 13: 25% IRA policy loan &rarr; STR principal. Y3: IRA fund + 80% surrender loan &rarr; STR principal. Y4+: Borrow cascade 15-20 years. Multi-year strategies spread the IRA&divide;0.4 property total evenly across N years.</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun size={14} className="text-amber-400" />
                    <span className="text-white font-medium text-xs">Solar Equity (+22%)</span>
                  </div>
                  <p className="text-xs">22% of IRA value as Year 1 IUL premium (held 12 months). Y2: Equal Roth funds. Month 13: 25% IRA policy loan &rarr; STR principal. Y3: 80% surrender loan &rarr; STR principal. Y4+: Borrow cascade.</p>
                </div>
              </div>
              <p className="text-xs mt-2"><strong className="text-white">IUL Parameters:</strong> 6% load fee &middot; 5% COI &middot; 5% loan rate &middot; 10% avg return on account value (illustrated, non-guaranteed) &middot; IUL as assigned collateral for STR purchase</p>
            </div>
          </div>
        </div>

        {/* ── Save Strategy Dialog ── */}
        {showSaveDialog && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowSaveDialog(false); setUpdatingStrategyId(null); }}>
            <div className="rc-card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                {updatingStrategyId ? (
                  <><TrendingUp size={18} className="text-blue-400" /> Update Strategy (New Version)</>
                ) : (
                  <><Save size={18} className="text-[#22c55e]" /> Save Strategy Projection</>
                )}
              </h3>
              {updatingStrategyId && (
                <div className="mb-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  This will create a new version of the selected strategy. The original version will be preserved in the version history.
                </div>
              )}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-xs text-[#7a95b8]">Strategy</div>
                  <div className="text-white font-medium">{activeStrategyDef.label}</div>
                </div>
                {form.clientId && (
                  <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e]">
                    <div className="text-xs text-[#7a95b8]">Client</div>
                    <div className="text-white font-medium">{clients.find((c) => c.id === Number(form.clientId))?.name ?? "Unknown"}</div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-[#7a95b8] block mb-1">Notes (optional)</label>
                  <textarea value={saveNotes} onChange={(e) => setSaveNotes(e.target.value)}
                    className="w-full bg-[#0b1628] border border-[#12233e] rounded-lg p-3 text-white text-sm focus:border-[#22c55e]/50 outline-none"
                    rows={3} placeholder="Add notes about this projection..." />
                </div>
                {form.clientId && (() => {
                  const client = clients.find((c) => c.id === Number(form.clientId));
                  return client?.email ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={notifyClient} onChange={(e) => setNotifyClient(e.target.checked)}
                        className="w-4 h-4 rounded border-[#12233e] bg-[#0b1628] text-[#22c55e] focus:ring-[#22c55e]/50" />
                      <span className="text-sm text-[#7a95b8]">Email client notification to <span className="text-white">{client.email}</span></span>
                    </label>
                  ) : (
                    <p className="text-xs text-[#3d5a7a] italic">Client has no email — notification will be skipped</p>
                  );
                })()}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowSaveDialog(false)} className="rc-btn rc-btn-outline text-sm">Cancel</button>
                  <button onClick={handleSaveStrategy} disabled={savingStrategy}
                    className="rc-btn rc-btn-primary text-sm flex items-center gap-2">
                    {updatingStrategyId ? <TrendingUp size={14} /> : <Save size={14} />} {savingStrategy ? "Saving..." : updatingStrategyId ? "Save as New Version" : "Save to History"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Strategy History Panel ── */}
        {showHistory && (
          <div className="rc-card border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <History size={16} className="text-purple-400" /> Saved Strategy History
              </h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[10px] text-[#7a95b8] cursor-pointer select-none">
                  <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)}
                    className="w-3 h-3 rounded border-[#22334a] bg-[#0b1628] accent-purple-500" />
                  Show Archived
                </label>
                {savedQuery.data && savedQuery.data.length > 0 && (
                  <button
                    onClick={() => {
                      const url = `/api/batch-strategy-export${form.clientId ? `?clientId=${form.clientId}` : ''}`;
                      window.open(url, '_blank');
                    }}
                    className="rc-btn rc-btn-outline text-xs flex items-center gap-1 px-2 py-1"
                  >
                    <Download size={12} /> Download All PDF
                  </button>
                )}
                <button onClick={() => setShowHistory(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
              </div>
            </div>
            {!savedQuery.data?.length ? (
              <p className="text-[#7a95b8] text-sm">No saved strategies yet. Run a projection and click Save to store it.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {savedQuery.data
                  .filter((s) => !s.parentStrategyId) // Only show root strategies
                  .map((saved) => {
                  const summary = saved.summaryJson as any;
                  const childVersions = savedQuery.data!.filter((s) => s.parentStrategyId === saved.id).sort((a, b) => (b.version ?? 1) - (a.version ?? 1));
                  const latestVersion = childVersions.length > 0 ? childVersions[0] : saved;
                  const latestSummary = latestVersion.summaryJson as any;
                  const isExpanded = expandedVersions === saved.id;
                  return (
                    <div key={saved.id} className={`rounded-xl bg-[#0b1628] border transition-all ${saved.isArchived ? 'border-[#12233e]/50 opacity-60' : 'border-[#12233e] hover:border-[#22c55e]/30'}`}>
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${saved.isArchived ? 'text-[#7a95b8]' : 'text-white'}`}>{saved.strategyLabel}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                v{latestVersion.version ?? 1}
                              </span>
                              {saved.isArchived && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Archived
                                </span>
                              )}
                              {childVersions.length > 0 && (
                                <button onClick={() => setExpandedVersions(isExpanded ? null : saved.id)}
                                  className="text-[10px] text-[#7a95b8] hover:text-white flex items-center gap-0.5">
                                  {childVersions.length + 1} versions {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </button>
                              )}
                            </div>
                            {saved.clientName && <div className="text-[#7a95b8] text-xs mt-0.5">Client: {saved.clientName}</div>}
                            {saved.carrierName && <div className="text-[#7a95b8] text-xs">Carrier: {latestVersion.carrierName ?? saved.carrierName}</div>}
                            {latestVersion.notes && <div className="text-[#7a95b8] text-xs mt-1 italic">"{latestVersion.notes}"</div>}
                            <div className="text-[#7a95b8] text-xs mt-1">{new Date(latestVersion.createdAt).toLocaleDateString()} by {latestVersion.advisorName}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => loadSavedStrategy(latestVersion)}
                              className="p-1.5 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/20 transition-all" title="Load latest">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => { setUpdatingStrategyId(saved.id); setShowSaveDialog(true); }}
                              className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all" title="Update (new version)">
                              <TrendingUp size={14} />
                            </button>
                            <button onClick={() => archiveMut.mutate({ id: saved.id, isArchived: !saved.isArchived })}
                              className={`p-1.5 rounded-lg transition-all ${saved.isArchived ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20' : 'bg-[#7a95b8]/10 border border-[#7a95b8]/20 text-[#7a95b8] hover:bg-[#7a95b8]/20'}`}
                              title={saved.isArchived ? "Unarchive" : "Archive"}>
                              {saved.isArchived ? <Eye size={14} /> : <Shield size={14} />}
                            </button>
                            <button onClick={() => deleteMut.mutate({ id: saved.id })}
                              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {latestSummary && (
                          <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-[#12233e]">
                            <div><div className="text-[#7a95b8] text-[10px]">IUL Net Cash</div><div className="text-[#22c55e] font-bold text-xs">{fmt(latestSummary.finalNetCashValue ?? 0)}</div></div>
                            <div><div className="text-[#7a95b8] text-[10px]">RE Equity</div><div className="text-blue-400 font-bold text-xs">{fmt(latestSummary.totalPropertyEquity ?? 0)}</div></div>
                            <div><div className="text-[#7a95b8] text-[10px]">Rental Income</div><div className="text-amber-400 font-bold text-xs">{fmt(latestSummary.totalRentalIncome ?? 0)}</div></div>
                            <div><div className="text-[#7a95b8] text-[10px]">Net Worth</div><div className="text-white font-bold text-xs">{fmt(latestSummary.estimatedNetWorth ?? 0)}</div></div>
                          </div>
                        )}
                      </div>
                      {/* Version Timeline */}
                      {isExpanded && (
                        <div className="border-t border-[#12233e] px-4 py-3 bg-[#080f1e] rounded-b-xl">
                          <div className="text-[#7a95b8] text-[10px] font-semibold uppercase tracking-wider mb-2">Version History</div>
                          <div className="space-y-2">
                            {[saved, ...childVersions.reverse()].map((ver: any, idx: number) => {
                              const vSummary = ver.summaryJson as any;
                              return (
                                <div key={ver.id} className="flex items-center gap-3 group">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-2.5 h-2.5 rounded-full ${ver.id === latestVersion.id ? 'bg-[#22c55e]' : 'bg-[#7a95b8]/40'}`} />
                                    {idx < childVersions.length && <div className="w-px h-4 bg-[#12233e]" />}
                                  </div>
                                  <div className="flex-1 flex items-center justify-between">
                                    <div>
                                      <span className="text-white text-xs">v{ver.version ?? 1}</span>
                                      <span className="text-[#7a95b8] text-[10px] ml-2">{new Date(ver.createdAt).toLocaleDateString()}</span>
                                      <span className="text-[#7a95b8] text-[10px] ml-1">by {ver.advisorName}</span>
                                      {ver.notes && <span className="text-[#7a95b8] text-[10px] ml-2 italic">— {ver.notes}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {vSummary && <span className="text-[#22c55e] text-[10px] font-mono">{fmt(vSummary.finalNetCashValue ?? 0)}</span>}
                                      <button onClick={() => loadSavedStrategy(ver)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded bg-[#22c55e]/10 text-[#22c55e] text-[10px] transition-opacity" title="Load this version">
                                        <Eye size={10} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Monte Carlo Simulation ── */}
        {showMonteCarlo && monteCarloData && (
          <div className="rc-card border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Shuffle size={16} className="text-purple-400" /> Monte Carlo Simulation
                <span className="text-[#7a95b8] text-xs font-normal">(500 simulations, 15% S&P 500 volatility, 0% IUL floor)</span>
              </h3>
              <button onClick={() => setShowMonteCarlo(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monteCarloData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                  <XAxis dataKey="year" stroke="#7a95b8" fontSize={11} label={{ value: "Year", position: "insideBottom", offset: -5, fill: "#7a95b8" }} />
                  <YAxis stroke="#7a95b8" fontSize={11} tickFormatter={(v: number) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1e3).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`$${Math.round(v).toLocaleString()}`, ""]} contentStyle={{ background: "#0f1e35", border: "1px solid #12233e", borderRadius: "12px", color: "white" }} />
                  <Area type="monotone" dataKey="p10" stackId="band" fill="transparent" stroke="transparent" />
                  <Area type="monotone" dataKey="p90" stackId="" fill="#8b5cf6" fillOpacity={0.08} stroke="#8b5cf6" strokeOpacity={0.2} name="90th %ile" />
                  <Area type="monotone" dataKey="p75" stackId="" fill="#8b5cf6" fillOpacity={0.12} stroke="#8b5cf6" strokeOpacity={0.3} name="75th %ile" />
                  <Area type="monotone" dataKey="p50" stackId="" fill="#8b5cf6" fillOpacity={0.18} stroke="#8b5cf6" strokeOpacity={0.5} name="Median" />
                  <Area type="monotone" dataKey="p25" stackId="" fill="#8b5cf6" fillOpacity={0.08} stroke="#8b5cf6" strokeOpacity={0.2} name="25th %ile" />
                  <Area type="monotone" dataKey="p10" stackId="" fill="transparent" stroke="#8b5cf6" strokeOpacity={0.15} name="10th %ile" />
                  <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Base Case (10%)" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-5 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e] text-center">
                <div className="text-[#7a95b8] text-[10px]">10th Percentile</div>
                <div className="text-red-400 font-bold text-sm">{fmt(monteCarloData[monteCarloData.length - 1]?.p10 ?? 0)}</div>
                <div className="text-[#7a95b8] text-[10px]">Worst Case</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e] text-center">
                <div className="text-[#7a95b8] text-[10px]">25th Percentile</div>
                <div className="text-orange-400 font-bold text-sm">{fmt(monteCarloData[monteCarloData.length - 1]?.p25 ?? 0)}</div>
                <div className="text-[#7a95b8] text-[10px]">Below Avg</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                <div className="text-[#7a95b8] text-[10px]">50th Percentile</div>
                <div className="text-purple-400 font-bold text-sm">{fmt(monteCarloData[monteCarloData.length - 1]?.p50 ?? 0)}</div>
                <div className="text-[#7a95b8] text-[10px]">Median</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e] text-center">
                <div className="text-[#7a95b8] text-[10px]">75th Percentile</div>
                <div className="text-blue-400 font-bold text-sm">{fmt(monteCarloData[monteCarloData.length - 1]?.p75 ?? 0)}</div>
                <div className="text-[#7a95b8] text-[10px]">Above Avg</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e] text-center">
                <div className="text-[#7a95b8] text-[10px]">90th Percentile</div>
                <div className="text-[#22c55e] font-bold text-sm">{fmt(monteCarloData[monteCarloData.length - 1]?.p90 ?? 0)}</div>
                <div className="text-[#7a95b8] text-[10px]">Best Case</div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/15 text-xs text-[#7a95b8]">
              <strong className="text-purple-400">How to read:</strong> The green line shows the base case (fixed 10% return). The purple bands show the probability distribution across 500 simulated paths using 15% annual volatility (historical S&P 500). The IUL floor of 0% prevents negative returns. Wider bands = more uncertainty in later years.
            </div>
          </div>
        )}

        {/* ── Sensitivity Analysis Grid ── */}
        {showSensitivity && sensitivityGrid && (
          <div className="rc-card border-l-4 border-l-cyan-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Grid3X3 size={16} className="text-cyan-400" /> Sensitivity Analysis — IUL Illustrated Policy Value
                <span className="text-[#7a95b8] text-xs font-normal">(median of 200 sims per cell)</span>
              </h3>
              <button onClick={() => setShowSensitivity(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-[#7a95b8] bg-[#0b1628] border border-[#12233e] font-medium">
                      Return \ Vol
                    </th>
                    {sensitivityGrid.volatilities.map((v) => (
                      <th key={v} className={`p-2 text-center border border-[#12233e] font-medium ${
                        v === 0.15 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-[#0b1628] text-[#7a95b8]'
                      }`}>
                        {(v * 100).toFixed(0)}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivityGrid.rows.map((row) => (
                    <tr key={row.returnRate}>
                      <td className={`p-2 text-left border border-[#12233e] font-medium ${
                        row.returnRate === 0.10 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-[#0b1628] text-[#7a95b8]'
                      }`}>
                        {(row.returnRate * 100).toFixed(0)}%
                      </td>
                      {row.cells.map((cell) => (
                        <td key={cell.vol} className={`p-2 text-center border border-[#12233e] font-bold ${
                          cell.isBase
                            ? 'ring-2 ring-cyan-400 ring-inset bg-cyan-500/20 text-cyan-300'
                            : getSensitivityColor(cell.value, sensitivityGrid.minVal, sensitivityGrid.maxVal)
                        }`}>
                          {cell.value >= 1_000_000
                            ? `$${(cell.value / 1_000_000).toFixed(2)}M`
                            : cell.value >= 1_000
                            ? `$${(cell.value / 1_000).toFixed(0)}K`
                            : `$${cell.value.toLocaleString()}`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] text-[#7a95b8]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/20 inline-block" /> High</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/10 inline-block" /> Medium</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/10 inline-block" /> Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/10 inline-block" /> Worst</span>
              <span className="ml-auto">Highlighted cell = base case (10% return, 15% volatility)</span>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-xs text-[#7a95b8]">
              <strong className="text-cyan-400">How to read:</strong> Each cell shows the median IUL illustrated policy value (account value minus cumulative loan balance) at year {result?.inputs?.iulYears ?? 20} across {sensitivityGrid.rows.length * sensitivityGrid.volatilities.length} return-rate × volatility scenarios. Higher returns and lower volatility produce better outcomes. The highlighted cell represents the base case assumptions.
            </div>
          </div>
        )}

        {/* ── Rate Stress Test ── */}
        {showStressTest && result && (
          <div className="rc-card border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <BarChart3 size={16} className="text-amber-400" /> Rate Stress Test — 5% / 6% / 6.5% / 7.5%
                <span className="text-[#7a95b8] text-xs font-normal">(deterministic projections)</span>
              </h3>
              <button onClick={() => setShowStressTest(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>
            {stressTestMut.isPending && (
              <div className="text-center py-8 text-[#7a95b8]">Running stress test...</div>
            )}
            {stressTestData && (
              <>
                {/* Chart */}
                <div className="h-80 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stressTestData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                      <XAxis dataKey="year" stroke="#7a95b8" fontSize={11} label={{ value: "Year", position: "insideBottom", offset: -5, fill: "#7a95b8" }} />
                      <YAxis stroke="#7a95b8" fontSize={11} tickFormatter={(v: number) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1e3).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => [`$${Math.round(v).toLocaleString()}`, ""]} contentStyle={{ background: "#0f1e35", border: "1px solid #12233e", borderRadius: "12px", color: "white" }} />
                      {stressTestData.rates.map((rate: string, i: number) => {
                        const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"];
                        return <Line key={rate} type="monotone" dataKey={`av_${rate}`} stroke={colors[i]} strokeWidth={2} dot={false} name={`${rate} Account Value`} />;
                      })}
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Rate</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Year 5 AV</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Year 10 AV</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Year 15 AV</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Year 20 AV</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Year 20 NCV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stressTestData.scenarios.map((s) => {
                        const isBase = s.rate === (result?.iulParams?.avgReturn ?? 0.075);
                        const colors: Record<string, string> = { "5%": "text-red-400", "6%": "text-amber-400", "6.5%": "text-[#22c55e]", "7.5%": "text-blue-400" };
                        const color = colors[s.label] || "text-white";
                        return (
                          <tr key={s.label} className={isBase ? 'bg-emerald-500/10' : ''}>
                            <td className={`p-2 border border-[#12233e] font-bold ${color}`}>{s.label}{isBase ? ' (base)' : ''}</td>
                            <td className="p-2 text-right border border-[#12233e] text-white">{fmt(s.yearlyData[4]?.accountValue ?? 0)}</td>
                            <td className="p-2 text-right border border-[#12233e] text-white">{fmt(s.yearlyData[9]?.accountValue ?? 0)}</td>
                            <td className="p-2 text-right border border-[#12233e] text-white">{fmt(s.yearlyData[14]?.accountValue ?? 0)}</td>
                            <td className={`p-2 text-right border border-[#12233e] font-bold ${color}`}>{fmt(s.finalAccountValue)}</td>
                            <td className={`p-2 text-right border border-[#12233e] font-bold ${s.finalNetCash >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>{fmt(s.finalNetCash)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-[#7a95b8]">
                  <strong className="text-amber-400">How to read:</strong> Each line shows the IUL account value at different illustrated rates using your exact client inputs. The 7.5% base case uses the NAIC AG 49 maximum illustrated rate. The 5% scenario is conservative, while 6.5% is moderate. All scenarios use identical charge structures. <em className="text-amber-400/70">Per NAIC AG 49, the maximum hypothetical illustrated rate for IUL is 7.5% — even though 30-year historical averages are more than twice this number.</em>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Sample Benchmark ── */}
        {showBenchmark && (
          <div className="rc-card border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Award size={16} className="text-[#22c55e]" /> Sample Illustration Benchmark
                <span className="text-[#7a95b8] text-xs font-normal">(engine vs. official carrier illustration)</span>
              </h3>
              <button onClick={() => setShowBenchmark(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>
            {benchmarkQuery.isLoading && (
              <div className="text-center py-8 text-[#7a95b8]">Loading benchmark data...</div>
            )}
            {benchmarkData && (
              <>
                {/* Source info */}
                <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e] mb-4">
                  <div className="text-xs text-[#7a95b8] space-y-1">
                    <div><span className="text-white font-medium">Source:</span> {benchmarkData.source}</div>
                    <div><span className="text-white font-medium">Insured:</span> {benchmarkData.parameters.insured}</div>
                    <div><span className="text-white font-medium">Premium:</span> {benchmarkData.parameters.premium}</div>
                    <div><span className="text-white font-medium">Credit Rate:</span> {benchmarkData.parameters.creditRate}</div>
                  </div>
                </div>

                {/* Verdict */}
                <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${
                  benchmarkData.allWithinTolerance
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#22c55e]'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {benchmarkData.allWithinTolerance ? '✓ ' : '⚠ '}{benchmarkData.verdict}
                </div>

                {/* Comparison table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Year</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Illustration CV</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Engine CV</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Difference</th>
                        <th className="p-2 text-right text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">% Diff</th>
                        <th className="p-2 text-center text-[#7a95b8] bg-[#0b1628] border border-[#12233e]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkData.comparisons.map((c) => (
                        <tr key={c.year} className={c.withinTolerance ? '' : 'bg-amber-500/5'}>
                          <td className="p-2 border border-[#12233e] text-white font-medium">Year {c.year}</td>
                          <td className="p-2 text-right border border-[#12233e] text-[#7a95b8]">{fmtFull(c.illustrationCV)}</td>
                          <td className="p-2 text-right border border-[#12233e] text-white">{fmtFull(c.engineCV)}</td>
                          <td className={`p-2 text-right border border-[#12233e] ${c.cvDiff >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>
                            {c.cvDiff >= 0 ? '+' : ''}{fmtFull(c.cvDiff)}
                          </td>
                          <td className={`p-2 text-right border border-[#12233e] ${Math.abs(c.cvPctDiff) <= 1 ? 'text-[#22c55e]' : 'text-amber-400'}`}>
                            {c.cvPctDiff >= 0 ? '+' : ''}{c.cvPctDiff}%
                          </td>
                          <td className="p-2 text-center border border-[#12233e]">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.withinTolerance ? 'bg-emerald-500/20 text-[#22c55e]' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {c.withinTolerance ? 'PASS' : 'REVIEW'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs text-[#7a95b8]">
                  <strong className="text-[#22c55e]">How to read:</strong> This table compares our engine's illustrated policy value projections against the official A Mutual Life Accumulator III illustration from sample illustration. Values within 2% tolerance are marked PASS. The engine uses the same charge structure (8%/6%/0% loads, age-based COI, $120/yr policy fee, per-unit charges, 0.20% conditional credit from Y11).
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Compare Carriers Panel ── */}
        {showCompareCarriers && result && (
          <div className="rc-card border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold flex items-center gap-2">
                <Shuffle size={16} className="text-purple-400" /> Compare Carriers — Side by Side
              </div>
              <button onClick={() => setShowCompareCarriers(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>
            {compareCarriersMut.isPending ? (
              <div className="text-center py-8 text-[#7a95b8]">Running carrier comparison...</div>
            ) : compareData ? (
              <>
                {/* Winner Banner */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                  <div className="text-purple-300 text-sm font-medium">Recommended Carrier</div>
                  <div className="text-white text-lg font-bold">{compareData.winner.carrierName}</div>
                  <div className="text-[#7a95b8] text-sm">Highest illustrated policy value by {fmt(compareData.winner.margin)}</div>
                </div>

                {/* Summary Table */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e3a5f]">
                        <th className="text-left py-2 text-[#7a95b8]">Carrier</th>
                        <th className="text-right py-2 text-[#7a95b8]">Avg Return</th>
                        <th className="text-right py-2 text-[#7a95b8]">Cap Rate</th>
                        <th className="text-right py-2 text-[#7a95b8]">Final AV</th>
                        <th className="text-right py-2 text-[#7a95b8]">Net Cash</th>
                        <th className="text-right py-2 text-[#7a95b8]">Total Charges</th>
                        <th className="text-right py-2 text-[#7a95b8]">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareData.carriers.map((c) => (
                        <tr key={c.carrierId} className={`border-b border-[#1e3a5f]/50 ${c.carrierId === compareData.winner.carrierId ? 'bg-purple-500/5' : ''}`}>
                          <td className="py-2">
                            <div className="text-white font-medium">{c.carrierName}</div>
                            <div className="text-[#7a95b8] text-xs">{c.product}</div>
                          </td>
                          <td className="text-right text-white">{(c.avgReturn * 100).toFixed(1)}%</td>
                          <td className="text-right text-white">{(c.capRate * 100).toFixed(1)}%</td>
                          <td className="text-right text-white font-medium">{fmt(c.finalAccountValue)}</td>
                          <td className={`text-right font-bold ${c.carrierId === compareData.winner.carrierId ? 'text-purple-400' : 'text-white'}`}>{fmt(c.finalNetCash)}</td>
                          <td className="text-right text-amber-400">{fmt(c.cumulativeCharges)}</td>
                          <td className="text-right text-[#22c55e]">{c.totalReturn}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={compareData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" stroke="#7a95b8" fontSize={11} />
                      <YAxis stroke="#7a95b8" fontSize={11} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8 }} />
                      <Legend />
                      {compareData.carriers.map((c: any, i: number) => {
                        const colors = ['#a855f7', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
                        return <Line key={c.carrierId} type="monotone" dataKey={`ncv_${c.carrierId}`} name={c.carrierName} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />;
                      })}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Request Formal Quote Button */}
                <div className="mt-4 pt-4 border-t border-[#1e3a5f]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium text-sm">Ready to proceed?</div>
                      <div className="text-[#7a95b8] text-xs">Request a formal illustration from the winning carrier</div>
                    </div>
                    <button
                      onClick={() => setShowQuoteDialog(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} /> Request Formal Quote
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── Historical Backtest Panel ── */}
        {showBacktest && result && (
          <div className="rc-card border border-rose-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold flex items-center gap-2">
                <BarChart3 size={16} className="text-rose-400" /> S&P 500 Historical Backtest (2004-2024)
              </div>
              <button onClick={() => setShowBacktest(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>
            {backtestMut.isPending ? (
              <div className="text-center py-8 text-[#7a95b8]">Running historical backtest...</div>
            ) : backtestData ? (
              <>
                {/* Insights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                    <div className="text-[#7a95b8] text-xs">Avg Credited Rate</div>
                    <div className="text-white font-bold text-lg">{backtestData.insights.avgHistoricalCredit}%</div>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                    <div className="text-[#7a95b8] text-xs">Floor Protected</div>
                    <div className="text-[#22c55e] font-bold text-lg">{backtestData.insights.floorSavings} years</div>
                    <div className="text-[#7a95b8] text-xs">{backtestData.insights.floorProtectedYears.join(', ')}</div>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                    <div className="text-[#7a95b8] text-xs">Cap Limited</div>
                    <div className="text-amber-400 font-bold text-lg">{backtestData.insights.capEvents} years</div>
                    <div className="text-[#7a95b8] text-xs">{backtestData.insights.capLimitedYears.join(', ')}</div>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                    <div className="text-[#7a95b8] text-xs">Historical vs Illustrated</div>
                    <div className={`font-bold text-lg ${backtestData.insights.historicalVsIllustrated >= 0 ? 'text-[#22c55e]' : 'text-rose-400'}`}>
                      {backtestData.insights.historicalVsIllustrated > 0 ? '+' : ''}{backtestData.insights.historicalVsIllustrated}%
                    </div>
                  </div>
                </div>

                {/* Year-by-Year Table */}
                <div className="overflow-x-auto mb-4 max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#0f2035]">
                      <tr className="border-b border-[#1e3a5f]">
                        <th className="text-left py-2 text-[#7a95b8]">Year</th>
                        <th className="text-right py-2 text-[#7a95b8]">S&P Return</th>
                        <th className="text-right py-2 text-[#7a95b8]">Credited</th>
                        <th className="text-right py-2 text-[#7a95b8]">Historical AV</th>
                        <th className="text-right py-2 text-[#7a95b8]">Illustrated AV</th>
                        <th className="text-center py-2 text-[#7a95b8]">Protection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backtestData.chartData.map((row) => (
                        <tr key={row.year} className="border-b border-[#1e3a5f]/50">
                          <td className="py-1.5 text-white">{row.calendarYear}</td>
                          <td className={`text-right ${row.spReturn < 0 ? 'text-rose-400' : 'text-[#22c55e]'}`}>{row.spReturn > 0 ? '+' : ''}{row.spReturn}%</td>
                          <td className="text-right text-white">{row.creditedRate}%</td>
                          <td className="text-right text-white font-medium">{fmt(row.historicalAV)}</td>
                          <td className="text-right text-[#7a95b8]">{fmt(row.illustratedAV)}</td>
                          <td className="text-center">
                            {row.spReturn < 0 && <span className="text-[#22c55e] text-xs bg-[#22c55e]/10 px-2 py-0.5 rounded">Floor</span>}
                            {row.creditedRate >= 14.5 && <span className="text-amber-400 text-xs bg-amber-400/10 px-2 py-0.5 rounded">Cap</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chart: Historical vs Illustrated */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={backtestData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="calendarYear" stroke="#7a95b8" fontSize={11} />
                      <YAxis stroke="#7a95b8" fontSize={11} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8 }} />
                      <Legend />
                      <Area type="monotone" dataKey="historicalAV" name="Historical (Floor/Cap)" fill="#f43f5e" fillOpacity={0.1} stroke="#f43f5e" strokeWidth={2} />
                      <Line type="monotone" dataKey="illustratedAV" name="Illustrated (AG 49 Max 7.5%)" stroke="#7a95b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Bar dataKey="spReturn" name="S&P Return %" fill="#3b82f6" fillOpacity={0.3} yAxisId="right" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── What-If Slider Panel ── */}
        {showWhatIfSliders && result && whatIfValues && (
          <div className="rc-card border border-sky-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-sky-400" /> What-If Mode — Live Projection
                {whatIfMut.isPending && <span className="text-sky-400 text-xs animate-pulse ml-2">Recalculating...</span>}
              </div>
              <button onClick={() => setShowWhatIfSliders(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* IRA Balance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#7a95b8] text-xs">IRA Balance</label>
                  <span className="text-white text-sm font-mono">${(whatIfValues.iraBalance / 1000).toFixed(0)}K</span>
                </div>
                <input type="range" min={100000} max={5000000} step={50000}
                  value={whatIfValues.iraBalance}
                  onChange={(e) => updateWhatIfSlider('iraBalance', Number(e.target.value))}
                  className="w-full h-2 bg-[#1e3a5f] rounded-lg appearance-none cursor-pointer accent-sky-500" />
                <div className="flex justify-between text-[#7a95b8] text-xs mt-0.5">
                  <span>$100K</span><span>$5M</span>
                </div>
              </div>

              {/* Age */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#7a95b8] text-xs">Client Age</label>
                  <span className="text-white text-sm font-mono">{whatIfValues.age}</span>
                </div>
                <input type="range" min={35} max={75} step={1}
                  value={whatIfValues.age}
                  onChange={(e) => updateWhatIfSlider('age', Number(e.target.value))}
                  className="w-full h-2 bg-[#1e3a5f] rounded-lg appearance-none cursor-pointer accent-sky-500" />
                <div className="flex justify-between text-[#7a95b8] text-xs mt-0.5">
                  <span>35</span><span>75</span>
                </div>
              </div>

              {/* Tax Bracket */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#7a95b8] text-xs">Tax Bracket</label>
                  <span className="text-white text-sm font-mono">{(whatIfValues.taxBracket * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min={0.12} max={0.37} step={0.01}
                  value={whatIfValues.taxBracket}
                  onChange={(e) => updateWhatIfSlider('taxBracket', Number(e.target.value))}
                  className="w-full h-2 bg-[#1e3a5f] rounded-lg appearance-none cursor-pointer accent-sky-500" />
                <div className="flex justify-between text-[#7a95b8] text-xs mt-0.5">
                  <span>12%</span><span>37%</span>
                </div>
              </div>

              {/* Home Equity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#7a95b8] text-xs">Home Equity</label>
                  <span className="text-white text-sm font-mono">${(whatIfValues.homeEquity / 1000).toFixed(0)}K</span>
                </div>
                <input type="range" min={0} max={2000000} step={25000}
                  value={whatIfValues.homeEquity}
                  onChange={(e) => updateWhatIfSlider('homeEquity', Number(e.target.value))}
                  className="w-full h-2 bg-[#1e3a5f] rounded-lg appearance-none cursor-pointer accent-sky-500" />
                <div className="flex justify-between text-[#7a95b8] text-xs mt-0.5">
                  <span>$0</span><span>$2M</span>
                </div>
              </div>

              {/* Conversion Portion */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#7a95b8] text-xs">Conversion Portion</label>
                  <span className="text-white text-sm font-mono">{(whatIfValues.conversionPortion * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min={0.10} max={1.0} step={0.05}
                  value={whatIfValues.conversionPortion}
                  onChange={(e) => updateWhatIfSlider('conversionPortion', Number(e.target.value))}
                  className="w-full h-2 bg-[#1e3a5f] rounded-lg appearance-none cursor-pointer accent-sky-500" />
                <div className="flex justify-between text-[#7a95b8] text-xs mt-0.5">
                  <span>10%</span><span>100%</span>
                </div>
              </div>
            </div>

            {/* Live Comparison Cards */}
            {(() => {
              const live = whatIfResult || result;
              const orig = result;
              const diff = (a: number, b: number) => {
                const d = a - b;
                if (Math.abs(d) < 100) return null;
                return d > 0
                  ? <span className="text-[#22c55e] text-xs ml-1">▲ +{fmt(d)}</span>
                  : <span className="text-rose-400 text-xs ml-1">▼ {fmt(d)}</span>;
              };
              const liveTotalWealth = live.summary.finalAccountValue + live.summary.finalPropertyEquity + live.summary.finalRothBalance;
              const origTotalWealth = orig.summary.finalAccountValue + orig.summary.finalPropertyEquity + orig.summary.finalRothBalance;
              const liveMultiplier = ((liveTotalWealth / (live.inputs?.iraBalance || 1))).toFixed(2);
              const origMultiplier = ((origTotalWealth / (orig.inputs?.iraBalance || 1))).toFixed(2);
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                    <div className="text-[#7a95b8] text-xs">Total Wealth</div>
                    <div className="text-white font-bold text-lg flex items-center">
                      {fmt(liveTotalWealth)}
                      {whatIfResult && diff(liveTotalWealth, origTotalWealth)}
                    </div>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                   <div className="text-[#7a95b8] text-xs">IUL Illustrated Policy Value</div>
                    <div className="text-white font-bold text-lg flex items-center">
                      {fmt(live.summary.finalAccountValue)}
                      {whatIfResult && diff(live.summary.finalAccountValue, orig.summary.finalAccountValue)}
                    </div>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                    <div className="text-[#7a95b8] text-xs">Illustrated Policy Value</div>
                    <div className="text-white font-bold text-lg flex items-center">
                      {fmt(live.summary.finalNetCashValue)}
                      {whatIfResult && diff(live.summary.finalNetCashValue, orig.summary.finalNetCashValue)}
                    </div>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                    <div className="text-[#7a95b8] text-xs">Multiplier</div>
                    <div className="text-white font-bold text-lg">
                      {liveMultiplier}x
                      {whatIfResult && liveMultiplier !== origMultiplier && (
                        <span className={`text-xs ml-1 ${Number(liveMultiplier) > Number(origMultiplier) ? 'text-[#22c55e]' : 'text-rose-400'}`}>
                          {Number(liveMultiplier) > Number(origMultiplier) ? '▲' : '▼'} was {origMultiplier}x
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Save & Load Scenarios */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button onClick={() => {
                const name = prompt("Name this scenario (e.g., 'Conservative $600K'):");
                if (!name) return;
                const live = whatIfResult || result;
                saveScenarioMut.mutate({
                  name,
                  inputs: whatIfValues,
                  projectionData: { summary: live.summary, inputs: live.inputs },
                });
              }} className="rc-btn rc-btn-primary text-sm px-4 flex items-center gap-2">
                <Save size={14} /> Save Scenario
              </button>
              <button onClick={() => setShowSavedScenarios(!showSavedScenarios)}
                className={`rc-btn rc-btn-outline text-sm px-4 flex items-center gap-2 ${showSavedScenarios ? 'border-sky-500/50 text-sky-400' : ''}`}>
                <FolderOpen size={14} /> {showSavedScenarios ? 'Hide' : 'Load'} Saved ({savedScenariosQuery.data?.length ?? 0})
              </button>
              {selectedScenarios.length >= 2 && (
                <button onClick={() => setShowComparison(true)}
                  className="rc-btn rc-btn-outline text-sm px-4 flex items-center gap-2 border-amber-500/50 text-amber-400">
                  <BarChart3 size={14} /> Compare Selected ({selectedScenarios.length})
                </button>
              )}
            </div>

            {/* Saved Scenarios List */}
            {showSavedScenarios && (
              <div className="mt-4 space-y-2">
                <div className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider">Saved Scenarios</div>
                {!savedScenariosQuery.data?.length ? (
                  <div className="text-[#7a95b8] text-sm py-4 text-center">No saved scenarios yet. Use the sliders and click "Save Scenario" to create one.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {savedScenariosQuery.data.map((sc) => {
                      const inp = sc.inputs as any;
                      const proj = sc.projectionData as any;
                      const isSelected = selectedScenarios.includes(sc.id);
                      return (
                        <div key={sc.id} className={`bg-[#0a1628] rounded-lg p-3 border ${isSelected ? 'border-amber-500/50' : 'border-[#1e3a5f]'} cursor-pointer hover:border-sky-500/30 transition-colors`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-white text-sm font-semibold">{sc.name}</div>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setSelectedScenarios(prev => isSelected ? prev.filter((id) => id !== sc.id) : [...prev, sc.id]); }}
                                className={`text-xs px-2 py-0.5 rounded ${isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1e3a5f] text-[#7a95b8]'}`}>
                                {isSelected ? '✓ Selected' : 'Select'}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); if (inp) { setWhatIfValues(inp); runWhatIfProjection(inp); } }}
                                className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">Load</button>
                              <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this scenario?')) deleteScenarioMut.mutate({ id: sc.id }); }}
                                className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">✕</button>
                            </div>
                          </div>
                          <div className="text-[#7a95b8] text-xs">
                            IRA: {inp?.iraBalance ? `$${(inp.iraBalance / 1000).toFixed(0)}K` : 'N/A'} · Age: {inp?.age ?? 'N/A'} · Tax: {inp?.taxBracket ? `${(inp.taxBracket * 100).toFixed(0)}%` : 'N/A'}
                          </div>
                          {proj?.summary && (
                            <div className="text-[#7a95b8] text-xs mt-1">
                              AV: {fmt(proj.summary.finalAccountValue)} · NCV: {fmt(proj.summary.finalNetCashValue)}
                            </div>
                          )}
                          <div className="text-[#7a95b8]/50 text-xs mt-1">{new Date(sc.createdAt).toLocaleDateString()}</div>
</div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Side-by-Side Comparison */}
            {showComparison && selectedScenarios.length >= 2 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-semibold flex items-center gap-2">
                    <BarChart3 size={16} className="text-amber-400" /> Scenario Comparison
                  </div>
                  <button onClick={() => setShowComparison(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e3a5f]">
                        <th className="text-left text-[#7a95b8] py-2 px-3">Metric</th>
                        {selectedScenarios.map((id) => {
                          const sc = savedScenariosQuery.data?.find((s) => s.id === id);
                          return <th key={id} className="text-right text-[#7a95b8] py-2 px-3">{sc?.name ?? `#${id}`}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {['IRA Balance', 'Age', 'Tax Bracket', 'Home Equity', 'Conversion', 'IUL Account Value', 'Illustrated Policy Value', 'Roth Balance', 'Property Equity'].map((metric) => (
                        <tr key={metric} className="border-b border-[#1e3a5f]/50">
                          <td className="text-[#7a95b8] py-2 px-3">{metric}</td>
                          {selectedScenarios.map((id) => {
                            const sc = savedScenariosQuery.data?.find((s) => s.id === id);
                            const inp = sc?.inputs as any;
                            const proj = sc?.projectionData as any;
                            let val = '—';
                            if (metric === 'IRA Balance') val = inp?.iraBalance ? `$${(inp.iraBalance / 1000).toFixed(0)}K` : '—';
                            else if (metric === 'Age') val = inp?.age?.toString() ?? '—';
                            else if (metric === 'Tax Bracket') val = inp?.taxBracket ? `${(inp.taxBracket * 100).toFixed(0)}%` : '—';
                            else if (metric === 'Home Equity') val = inp?.homeEquity ? `$${(inp.homeEquity / 1000).toFixed(0)}K` : '—';
                            else if (metric === 'Conversion') val = inp?.conversionPortion ? `${(inp.conversionPortion * 100).toFixed(0)}%` : '—';
                            else if (metric === 'IUL Account Value') val = proj?.summary?.finalAccountValue ? fmt(proj.summary.finalAccountValue) : '—';
                            else if (metric === 'Illustrated Policy Value') val = proj?.summary?.finalNetCashValue ? fmt(proj.summary.finalNetCashValue) : '—';
                            else if (metric === 'Roth Balance') val = proj?.summary?.finalRothBalance ? fmt(proj.summary.finalRothBalance) : '—';
                            else if (metric === 'Property Equity') val = proj?.summary?.finalPropertyEquity ? fmt(proj.summary.finalPropertyEquity) : '—';
                            return <td key={id} className="text-right text-white py-2 px-3">{val}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-3 text-[#7a95b8] text-xs text-center">
              Drag any slider to see how changes affect the projection in real-time. Arrows show the difference from the original projection.
            </div>
          </div>
        )}

        {/* ── Share Dialog ── */}
        {showShareDialog && shareUrl && (
          <div className="rc-card border border-[#22c55e]/30">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold flex items-center gap-2">
                <ExternalLink size={16} className="text-[#22c55e]" /> Client Share Link
              </div>
              <button onClick={() => setShowShareDialog(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>
            <div className="bg-[#0a1628] rounded-lg p-4 border border-[#1e3a5f]">
              <div className="text-[#7a95b8] text-sm mb-2">Share this link with your client to give them read-only access to the projection:</div>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={shareUrl} className="flex-1 bg-[#0f2035] border border-[#1e3a5f] rounded px-3 py-2 text-white text-sm" />
                <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); }}
                  className="rc-btn rc-btn-primary text-sm px-4">
                  Copy
                </button>
              </div>
              <div className="text-[#7a95b8] text-xs mt-2">Link expires in 30 days. Client does not need to log in.</div>
            </div>

            {/* Follow-up notifications */}
            <div className="mt-4 bg-[#0a1628] rounded-lg p-4 border border-[#1e3a5f]">
              <div className="text-white text-sm font-medium mb-3">Follow-Up Notifications</div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
                  <span className="text-[#7a95b8] text-sm">Email reminders: 3-day & 7-day (auto-scheduled)</span>
                </div>
              </div>
              <div className="text-[#7a95b8] text-xs">Automated follow-up emails will be sent to the client if they have an email on file, reminding them to review the projection and book a consultation.</div>
            </div>
          </div>
        )}

        {/* ── Quote Request Dialog ── */}
        {showQuoteDialog && compareData && (
          <div className="rc-card border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-semibold flex items-center gap-2">
                <FileText size={16} className="text-purple-400" /> Request Formal Quote
              </div>
              <button onClick={() => setShowQuoteDialog(false)} className="text-[#7a95b8] hover:text-white text-xs">✕ Close</button>
            </div>

            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 mb-4">
              <div className="text-purple-300 text-sm font-medium mb-2">Requesting quote from:</div>
              <div className="text-white text-lg font-bold">{compareData.winner.carrierName}</div>
              <div className="text-[#7a95b8] text-sm">Based on carrier comparison analysis</div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                  <div className="text-[#7a95b8] text-xs">Client Age</div>
                  <div className="text-white font-medium">{result?.inputs?.age ?? 'N/A'}</div>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                  <div className="text-[#7a95b8] text-xs">IRA Balance</div>
                  <div className="text-white font-medium">{result?.inputs?.iraBalance ? fmt(result.inputs.iraBalance) : 'N/A'}</div>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                  <div className="text-[#7a95b8] text-xs">Conversion Portion</div>
                  <div className="text-white font-medium">{result?.inputs?.conversionPortion ? `${(result.inputs.conversionPortion * 100).toFixed(0)}%` : 'N/A'}</div>
                </div>
                <div className="bg-[#0a1628] rounded-lg p-3 border border-[#1e3a5f]">
                  <div className="text-[#7a95b8] text-xs">IUL Years</div>
                  <div className="text-white font-medium">{result?.inputs?.iulYears ?? 20}</div>
                </div>
              </div>

              <div>
                <label className="text-[#7a95b8] text-sm mb-1 block">Additional Notes (optional)</label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Any special requests or notes for the carrier..."
                  className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-3 text-white text-sm placeholder-[#3d5a7a] resize-none h-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const winner = compareData.carriers.find((c) => c.carrierId === compareData.winner.carrierId);
                  quoteMut.mutate({
                    clientId: (result as any)?.clientId,
                    clientName: (result as any)?.clientName,
                    carrierId: compareData.winner.carrierId,
                    carrierName: compareData.winner.carrierName,
                    productName: winner?.product ?? 'IUL',
                    formData: {
                      age: result?.inputs?.age,
                      iraBalance: result?.inputs?.iraBalance,
                      conversionPortion: result?.inputs?.conversionPortion,
                      iulYears: result?.inputs?.iulYears ?? 20,
                      taxBracket: result?.inputs?.currentTaxBracket,
                      filingStatus: result?.inputs?.filingStatus,
                      homeEquity: result?.inputs?.homeEquity,
                      projectedNetCash: winner?.finalNetCash,
                      projectedAccountValue: winner?.finalAccountValue,
                    },
                    notes: quoteNotes || undefined,
                  }, {
                    onSuccess: (data) => {
                      toast.success(`Quote request #${data.id} submitted to ${compareData.winner.carrierName}!`);
                      setShowQuoteDialog(false);
                      setQuoteNotes('');
                    },
                    onError: (err) => toast.error(`Failed to submit quote: ${err.message}`),
                  });
                }}
                disabled={quoteMut.isPending}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={14} /> {quoteMut.isPending ? 'Submitting...' : 'Submit Quote Request'}
              </button>
              <button
                onClick={() => setShowQuoteDialog(false)}
                className="px-4 py-3 bg-[#0a1628] border border-[#1e3a5f] text-[#7a95b8] hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="text-[#7a95b8] text-xs mt-3">
              This will create a quote request record and send a confirmation email to your inbox. The carrier will be contacted with the pre-filled application details.
            </div>
          </div>
        )}

        {/* ── 6-Option Strategy Selector ── */}
        <div className="rc-card">
          <div className="text-white font-semibold mb-4 flex items-center gap-2">
            <Brain size={16} className="text-[#22c55e]" /> Select Strategy
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STRATEGY_OPTIONS.map((opt) => {
              const isActive = selectedStrategy === opt.key;
              const isSolarOpt = opt.solar;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSelectedStrategy(opt.key)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    isActive
                      ? isSolarOpt
                        ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20"
                        : "bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20"
                      : "bg-[#0b1628] border-[#12233e] hover:border-[#22c55e]/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isSolarOpt ? <Sun size={14} className="text-amber-400" /> : <Shield size={14} className="text-blue-400" />}
                    <span className="text-white font-semibold text-xs">{opt.solar ? "Solar" : `Year ${opt.years}`}</span>
                  </div>
                  <div className="text-[10px] text-[#7a95b8]">
                    {opt.solar ? "+22% enhancement" : opt.years === 1 ? "All properties Year 1" : `Spread over ${opt.years} years`}
                  </div>
                  {isActive && (
                    <span className={`inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${
                      isSolarOpt ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                    }`}>Selected</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input form */}
        <div className="rc-card">
          <div className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calculator size={16} className="text-[#22c55e]" /> Client Parameters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="rc-label">Client (optional)</label>
              <select className="rc-input" value={form.clientId}
                onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}>
                <option value="">Manual entry</option>
                {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="rc-label">Age *</label>
              <NumberInput value={form.age} onChange={(v) => setForm((p) => ({ ...p, age: v }))} className="rc-input" placeholder="58" />
            </div>
            <div>
              <label className="rc-label">Annual Income ($) *</label>
              <NumberInput value={form.income} onChange={(v) => setForm((p) => ({ ...p, income: v }))} className="rc-input" placeholder="250000" />
            </div>
            <div>
              <label className="rc-label">IRA Balance ($) *</label>
              <NumberInput value={form.iraBalance} onChange={(v) => setForm((p) => ({ ...p, iraBalance: v }))} className="rc-input" placeholder="800000" />
            </div>
            <div>
              <label className="rc-label">Conversion Portion (%)</label>
              <select className="rc-input" value={form.conversionPortion}
                onChange={(e) => setForm((p) => ({ ...p, conversionPortion: e.target.value }))}>
                <option value="1">100% of IRA</option>
                <option value="0.75">75% of IRA</option>
                <option value="0.50">50% of IRA</option>
                <option value="0.25">25% of IRA</option>
              </select>
            </div>
            <div>
              <label className="rc-label">Home Equity ($) *</label>
              <NumberInput value={form.homeEquity} onChange={(v) => setForm((p) => ({ ...p, homeEquity: v }))} className="rc-input" placeholder="400000" />
            </div>
            <div>
              <label className="rc-label">Filing Status</label>
              <select className="rc-input" value={form.filingStatus}
                onChange={(e) => setForm((p) => ({ ...p, filingStatus: e.target.value as any }))}>
                <option value="married">Married Filing Jointly</option>
                <option value="single">Single</option>
                <option value="hoh">Head of Household</option>
              </select>
            </div>
            <div>
              <label className="rc-label">IUL Projection Years</label>
              <select className="rc-input" value={form.iulYears}
                onChange={(e) => setForm((p) => ({ ...p, iulYears: e.target.value }))}>
                <option value="15">15 Years</option>
                <option value="16">16 Years</option>
                <option value="17">17 Years</option>
                <option value="18">18 Years</option>
                <option value="19">19 Years</option>
                <option value="20">20 Years</option>
              </select>
            </div>
          </div>

          {/* Advanced toggle */}
          <button onClick={() => setShowAdvanced((p) => !p)}
            className="flex items-center gap-2 text-sm text-[#7a95b8] hover:text-white mt-4 transition-colors">
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced parameters
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#12233e]">
              <div>
                <label className="rc-label">Current Tax Bracket</label>
                <select className="rc-input" value={form.currentTaxBracket}
                  onChange={(e) => setForm((p) => ({ ...p, currentTaxBracket: e.target.value }))}>
                  <option value="0.12">12%</option><option value="0.22">22%</option>
                  <option value="0.24">24% (default)</option><option value="0.32">32%</option>
                  <option value="0.35">35%</option><option value="0.37">37%</option>
                </select>
              </div>
              <div>
                <label className="rc-label">Mortgage Rate (%)</label>
                <NumberInput value={form.mortgageRate} onChange={(v) => setForm((p) => ({ ...p, mortgageRate: v }))} className="rc-input" />
              </div>
            </div>
          )}

          {/* Oil & Gas Tax Optimization Toggle */}
          <div className="mt-4 pt-4 border-t border-[#12233e]">
            <OilGasToggle compact taxableIncome={Number(form.income) || 250000} />
          </div>

          <button onClick={runProjection} disabled={projectMut.isPending} className="rc-btn rc-btn-primary mt-5">
            <Brain size={16} /> {projectMut.isPending ? "Calculating..." : `Run ${activeStrategyDef.label} Projection`}
          </button>
        </div>

        {/* ── What-If Scenario Toggles ── */}
        <div className="rc-card">
          <button onClick={() => setShowWhatIf((p) => !p)}
            className="flex items-center gap-2 text-white font-semibold w-full">
            <SlidersHorizontal size={16} className="text-[#22c55e]" />
            What-If Scenario Toggles
            <span className="ml-auto text-[#7a95b8]">{showWhatIf ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
          </button>
          <p className="text-xs text-[#7a95b8] mt-1">Adjust rental yield, appreciation, and HELOC rate in real-time to stress-test the strategy</p>
          {showWhatIf && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-[#12233e]">
              <div>
                <label className="rc-label flex justify-between">
                  <span>Rental Gross Yield</span>
                  <span className="text-[#22c55e] font-bold">{rentalGross}%</span>
                </label>
                <input type="range" min={10} max={30} step={1} value={rentalGross}
                  onChange={(e) => setRentalGross(Number(e.target.value))}
                  className="w-full h-2 bg-[#12233e] rounded-lg appearance-none cursor-pointer accent-[#22c55e]" />
                <div className="flex justify-between text-[10px] text-[#7a95b8] mt-1">
                  <span>10%</span><span>20% (default)</span><span>30%</span>
                </div>
              </div>
              <div>
                <label className="rc-label flex justify-between">
                  <span>RE Appreciation</span>
                  <span className="text-[#22c55e] font-bold">{appreciation}%</span>
                </label>
                <input type="range" min={2} max={10} step={1} value={appreciation}
                  onChange={(e) => setAppreciation(Number(e.target.value))}
                  className="w-full h-2 bg-[#12233e] rounded-lg appearance-none cursor-pointer accent-[#22c55e]" />
                <div className="flex justify-between text-[10px] text-[#7a95b8] mt-1">
                  <span>2%</span><span>5% (default)</span><span>10%</span>
                </div>
              </div>
              <div>
                <label className="rc-label flex justify-between">
                  <span>HELOC Rate (Fixed)</span>
                  <span className="text-[#22c55e] font-bold">{helocRate}%</span>
                </label>
                <input type="range" min={4} max={12} step={0.5} value={helocRate}
                  onChange={(e) => setHelocRate(Number(e.target.value))}
                  className="w-full h-2 bg-[#12233e] rounded-lg appearance-none cursor-pointer accent-[#22c55e]" />
                <div className="flex justify-between text-[10px] text-[#7a95b8] mt-1">
                  <span>4%</span><span>7% (default)</span><span>12%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── IUL Carrier Selection & Cheat Sheet ── */}
        <div className="rc-card">
          <button onClick={() => setShowCarrier((p) => !p)}
            className="flex items-center gap-2 text-white font-semibold w-full">
            <Award size={16} className="text-[#22c55e]" />
            IUL Carrier Selection
            <span className="ml-auto text-[#7a95b8]">{showCarrier ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
          </button>
          <p className="text-xs text-[#7a95b8] mt-1">
            Select a specific carrier to use their actual load fees, COI rates, and cap rates instead of generic assumptions
          </p>
          {showCarrier && (
            <div className="mt-4 pt-4 border-t border-[#12233e] space-y-4">
              <div>
                <label className="rc-label">IUL Carrier</label>
                <select className="rc-input" value={carrierId}
                  onChange={(e) => setCarrierId(e.target.value)}>
                  {IUL_CARRIERS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.product}</option>
                  ))}
                </select>
              </div>

              {/* Carrier Cheat Sheet */}
              <div className="p-4 rounded-xl bg-[#0f1e35] border border-[#12233e]">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-[#22c55e]" />
                  <span className="text-white font-semibold text-sm">{selectedCarrier.name} — {selectedCarrier.product}</span>
                  {activeOverride && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                      Custom Rates Active
                    </span>
                  )}
                  {selectedCarrier.amBestRating && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#22c55e] border border-emerald-500/20">
                      AM Best: {selectedCarrier.amBestRating}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7a95b8] mb-3">{selectedCarrier.description}</p>
                {activeOverride && (
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-3">
                    <div className="text-xs text-cyan-300 font-medium">Custom rate overrides are active for this carrier.</div>
                    <div className="text-[10px] text-cyan-400/70 mt-0.5">Rates below reflect your custom settings from Carrier Rate Settings. <a href="/portal/carrier-settings" className="underline hover:text-cyan-300">Edit rates</a></div>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`p-2 rounded-lg border ${activeOverride ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-[#0b1628] border-[#12233e]'}`}>
                    <div className="text-[10px] text-[#7a95b8]">Load Fee</div>
                    <div className="text-white font-bold">{(effectiveRates.loadFee * 100).toFixed(1)}%</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${activeOverride ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-[#0b1628] border-[#12233e]'}`}>
                    <div className="text-[10px] text-[#7a95b8]">COI Rate</div>
                    <div className="text-white font-bold">{(effectiveRates.coiRate * 100).toFixed(1)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0b1628] border border-[#12233e]">
                    <div className="text-[10px] text-[#7a95b8]">Loan Rate</div>
                    <div className="text-white font-bold">{(effectiveRates.loanRate * 100).toFixed(1)}%</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${activeOverride ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-[#0b1628] border-[#12233e]'}`}>
                    <div className="text-[10px] text-[#7a95b8]">Avg Illustrated Return</div>
                    <div className="text-white font-bold">{(effectiveRates.avgReturn * 100).toFixed(1)}%</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${activeOverride ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-[#0b1628] border-[#12233e]'}`}>
                    <div className="text-[10px] text-[#7a95b8]">Cap Rate</div>
                    <div className="text-white font-bold">{(effectiveRates.capRate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0b1628] border border-[#12233e]">
                    <div className="text-[10px] text-[#7a95b8]">Participation Rate</div>
                    <div className="text-white font-bold">{(selectedCarrier.participationRate * 100).toFixed(0)}%</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${activeOverride ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-[#0b1628] border-[#12233e]'}`}>
                    <div className="text-[10px] text-[#7a95b8]">Floor Rate</div>
                    <div className="text-white font-bold">{(effectiveRates.floorRate * 100).toFixed(0)}%</div>
                  </div>
                  {selectedCarrier.illustrationUrl && selectedCarrier.id !== "custom" && (
                    <a href={selectedCarrier.illustrationUrl} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors flex items-center gap-1.5">
                      <ExternalLink size={12} className="text-blue-400" />
                      <div>
                        <div className="text-[10px] text-[#7a95b8]">Illustration Software</div>
                        <div className="text-blue-400 font-bold text-xs">Open Link</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Illustration Tools */}
              <div className="p-3 rounded-lg bg-[#0b1628] border border-[#12233e]">
                <div className="text-xs text-[#7a95b8] mb-2 font-medium">General Illustration Tools</div>
                <div className="flex flex-wrap gap-2">
                  {ILLUSTRATION_TOOLS.map((tool) => (
                    <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f1e35] border border-[#12233e] hover:border-[#22c55e]/30 transition-colors text-xs text-[#7a95b8] hover:text-white">
                      <ExternalLink size={10} /> {tool.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Smart Carrier Recommendation */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <button onClick={() => setShowRecommendation(!showRecommendation)}
                  className="flex items-center gap-2 w-full text-left">
                  <Sparkles size={16} className="text-purple-400" />
                  <span className="text-white font-semibold text-sm">Smart Carrier Recommendation</span>
                  <span className="ml-auto text-[#7a95b8]">{showRecommendation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                </button>
                <p className="text-xs text-[#7a95b8] mt-1">Get a data-driven carrier recommendation based on client age, risk tolerance, and premium budget</p>

                {showRecommendation && (
                  <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-4">
                    {/* Risk tolerance selector */}
                    <div>
                      <label className="rc-label">Risk Tolerance</label>
                      <div className="flex gap-2">
                        {(["conservative", "moderate", "aggressive"] as const).map((rt) => (
                          <button key={rt} onClick={() => setRiskTolerance(rt)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                              riskTolerance === rt
                                ? rt === "conservative" ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                                  : rt === "moderate" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                  : "bg-orange-500/20 border-orange-500/40 text-orange-300"
                                : "bg-[#0b1628] border-[#12233e] text-[#7a95b8] hover:border-[#22c55e]/30"
                            }`}>
                            {rt === "conservative" ? "Conservative" : rt === "moderate" ? "Moderate" : "Aggressive"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-[#7a95b8]">
                      Analyzing for: Age {form.age || "45"} · {riskTolerance} · ~${Math.round((Number(form.iraBalance) * 0.05) || 25000).toLocaleString()}/yr premium
                    </div>

                    <button onClick={handleRunRecommendation} disabled={recommendMut.isPending}
                      className="w-full px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50">
                      {recommendMut.isPending ? "Analyzing..." : "Run Recommendation"}
                    </button>

                    {recommendMut.isPending && (
                      <div className="text-center py-4 text-[#7a95b8] text-sm">Analyzing carriers...</div>
                    )}

                    {recommendations.length > 0 && (
                      <div className="space-y-3">
                        {recommendations.slice(0, 5).map((rec: any, idx: number) => (
                          <div key={rec.carrierId}
                            className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-purple-500/40 ${
                              idx === 0 ? "bg-purple-500/10 border-purple-500/30" : "bg-[#0b1628] border-[#12233e]"
                            }`}
                            onClick={() => { setCarrierId(rec.carrierId); toast.success(`Selected ${rec.carrierName}`); }}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 ? "bg-purple-500/30 text-purple-300" : idx === 1 ? "bg-blue-500/30 text-blue-300" : "bg-[#0f1e35] text-[#7a95b8]"
                              }`}>
                                #{rec.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-semibold text-sm">{rec.carrierName}</span>
                                  {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Best Match</span>}
                                </div>
                                <div className="text-xs text-[#7a95b8] mt-0.5 truncate">{rec.reasoning}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-bold text-sm">{rec.totalScore.toFixed(0)}</div>
                                <div className="text-[10px] text-[#7a95b8]">Score</div>
                              </div>
                            </div>
                            {/* Sub-score bars */}
                            <div className="grid grid-cols-4 gap-2 mt-3">
                              {[
                                { label: "Growth", value: rec.growthScore, color: "bg-emerald-500" },
                                { label: "Protection", value: rec.protectionScore, color: "bg-blue-500" },
                                { label: "Cost", value: rec.costScore, color: "bg-amber-500" },
                                { label: "Loan", value: rec.loanScore, color: "bg-purple-500" },
                              ].map((s) => (
                                <div key={s.label}>
                                  <div className="text-[10px] text-[#7a95b8] mb-1">{s.label}</div>
                                  <div className="h-1.5 rounded-full bg-[#0f1e35] overflow-hidden">
                                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                                  </div>
                                  <div className="text-[10px] text-white mt-0.5">{s.value.toFixed(0)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendation History with Trend Chart */}
                    {recHistory.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-purple-500/20">
                        <div className="text-xs font-semibold text-[#7a95b8] mb-2 flex items-center gap-1">
                          <Clock size={12} /> Past Recommendations
                        </div>

                        {/* Trend Chart */}
                        {recHistory.length >= 2 && (
                          <div className="mb-3 p-3 rounded-lg bg-[#0b1628] border border-[#12233e]">
                            <div className="text-[10px] text-[#7a95b8] mb-2 font-medium">Score Trend Over Time</div>
                            <ResponsiveContainer width="100%" height={120}>
                              <ComposedChart
                                data={[...recHistory].reverse().map((h) => ({
                                  date: new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                                  score: Number(h.totalScore),
                                  carrier: h.recommendedCarrierName,
                                }))}
                                margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#7a95b8" }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#7a95b8" }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#0f1e35", border: "1px solid #12233e", borderRadius: "8px", fontSize: "11px" }}
                                  formatter={(value: number, _name: string, props: any) => [
                                    `${value.toFixed(0)} — ${props.payload.carrier}`,
                                    "Score",
                                  ]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="score"
                                  stroke="#a855f7"
                                  strokeWidth={2}
                                  dot={{ r: 4, fill: "#a855f7", stroke: "#0b1628", strokeWidth: 2 }}
                                  activeDot={{ r: 6, fill: "#a855f7" }}
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {recHistory.slice(0, 8).map((h) => (
                            <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#0b1628] border border-[#12233e] text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{h.recommendedCarrierName}</div>
                                <div className="text-[#7a95b8] text-[10px]">
                                  {h.clientName ? `${h.clientName} · ` : ""}Age {h.clientAge} · {h.riskTolerance}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-purple-300 font-bold">{Number(h.totalScore).toFixed(0)}</div>
                                <div className="text-[#7a95b8] text-[10px]">{new Date(h.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══════════ RESULTS ══════════ */}
        {result && (
          <>
            {/* Active strategy label */}
            <div className={`rc-card ${isSolar ? "bg-amber-500/5 border-amber-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
              <div className="flex items-center gap-3">
                {isSolar ? <Sun size={22} className="text-amber-400" /> : <Shield size={22} className="text-blue-400" />}
                <div>
                  <div className="text-white font-bold text-lg">{result.strategyLabel}</div>
                  <div className="text-xs text-[#7a95b8]">
                    {result.strategy.totalPropertyCount} {result.strategy.totalPropertyCount === 1 ? "property" : "properties"} @ {fmtFull(result.strategy.perPropertyPrice)} each
                    {(result.inputs.strategyYears ?? 1) > 1 && ` · spread over ${result.inputs.strategyYears} years`}
                    {isSolar && ` · +22% solar enhancement: ${fmtFull(result.strategy.solarEnhancement)}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rc-card">
                <div className="rc-stat-label">Roth Conversion</div>
                <div className="rc-stat-value text-[#22c55e]">{fmtFull(result.strategy.conversionAmount)}</div>
                <div className="text-[10px] text-[#7a95b8] mt-1">entire IRA &rarr; Roth in Year 1</div>
              </div>
              <div className="rc-card">
                <div className="rc-stat-label">Tax Savings (50%)</div>
                <div className="rc-stat-value text-[#22c55e]">{fmtFull(result.strategy.taxSavings)}</div>
                <div className="text-[10px] text-[#7a95b8] mt-1">{fmtFull(result.strategy.halfTaxSavings)} per half</div>
              </div>
              <div className="rc-card">
                <div className="rc-stat-label">{isSolar ? "Solar Enhancement" : "Target STR Total"}</div>
                <div className={`rc-stat-value ${isSolar ? "text-amber-400" : ""}`}>
                  {isSolar ? fmtFull(result.strategy.solarEnhancement) : fmtFull(result.strategy.targetPropertyPrice)}
                </div>
                <div className="text-[10px] text-[#7a95b8] mt-1">{isSolar ? "+22% of IRA value" : "IRA ÷ 0.4"}</div>
              </div>
              <div className="rc-card">
                <div className="rc-stat-label">Properties</div>
                <div className="rc-stat-value">{result.strategy.totalPropertyCount}</div>
                <div className="text-[10px] text-[#7a95b8] mt-1">{fmt(result.strategy.perPropertyPrice)} each</div>
              </div>
            </div>

            {/* Month 13 Policy Loan callout */}
            <div className="rc-card bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-3">
                <Banknote size={20} className="text-blue-400" />
                <div>
                  <div className="text-white font-semibold text-sm">
                    Month 13 Policy Loan: {fmtFull(result.strategy.month13PolicyLoan)}
                  </div>
                  <div className="text-xs text-[#7a95b8]">
                    25% of original IRA balance taken as a policy loan at month 13, applied as a principal-only payment to the STR property mortgage.
                    Interest-only payment: {fmtFull(result.strategy.monthlyInterestOnlyPayment)}/mo.
                  </div>
                </div>
              </div>
            </div>

            {/* Capital Flow Diagram */}
            <div className="rc-card">
              <div className="text-white font-semibold mb-4 flex items-center gap-2">
                <ArrowRight size={16} className="text-[#22c55e]" /> Capital Flow
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-sm">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <PiggyBank size={20} className="text-blue-400 mx-auto mb-1" />
                  <div className="text-white font-medium">IRA</div>
                  <div className="text-[#7a95b8] text-xs">{fmtFull(result.inputs.iraBalance)}</div>
                </div>
                <div className="flex items-center justify-center text-[#22c55e]"><ArrowRight size={20} /></div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Shield size={20} className="text-[#22c55e] mx-auto mb-1" />
                  <div className="text-white font-medium">New Roth IRA</div>
                  <div className="text-[#7a95b8] text-xs">{fmtFull(result.strategy.newRothValue)}</div>
                </div>
                <div className="flex items-center justify-center text-[#22c55e]"><ArrowRight size={20} /></div>
                <div className={`p-3 rounded-xl ${isSolar ? "bg-amber-500/10 border border-amber-500/20" : "bg-blue-500/10 border border-blue-500/20"}`}>
                  <Building size={20} className={isSolar ? "text-amber-400 mx-auto mb-1" : "text-blue-400 mx-auto mb-1"} />
                  <div className="text-white font-medium">{result.strategy.totalPropertyCount} STR {result.strategy.totalPropertyCount === 1 ? "Property" : "Properties"}</div>
                  <div className="text-[#7a95b8] text-xs">{fmt(result.strategy.targetPropertyPrice)} total</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">Down Payment (30%)</div>
                  <div className="text-white font-medium">{fmtFull(result.strategy.downPayment)}</div>
                  <div className="text-[10px] text-[#7a95b8]">via HELOC from home equity</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">Mortgage (70%)</div>
                  <div className="text-white font-medium">{fmtFull(result.strategy.mortgageAmount)}</div>
                  <div className="text-[10px] text-[#7a95b8]">{fmtFull(result.strategy.monthlyMortgagePayment)}/mo P&I</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">Interest-Only Payment</div>
                  <div className="text-white font-medium">{fmtFull(result.strategy.monthlyInterestOnlyPayment)}/mo</div>
                  <div className="text-[10px] text-[#7a95b8]">on mortgage balance</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">HELOC at {(helocRate).toFixed(0)}% Fixed</div>
                  <div className="text-white font-medium">{fmtFull(result.strategy.helocAmount)}</div>
                  <div className="text-[10px] text-[#7a95b8]">{fmtFull(result.strategy.monthlyHelocPayment)}/mo</div>
                </div>
              </div>
            </div>

            {/* IUL Cascade Premium Flow */}
            <div className="rc-card">
              <div className="text-white font-semibold mb-1 flex items-center gap-2">
                <Repeat size={16} className={isSolar ? "text-amber-400" : "text-blue-400"} />
                IUL Premium Cascade — {result.strategyLabel}
              </div>
              <div className="text-xs text-[#7a95b8] mb-2">
                {isSolar
                  ? "Y1: 22% solar enhancement → Y2: Roth funds → Month 13: 25% IRA loan → STR principal → Y3: 80% surrender loan → STR principal → Y4+: Borrow cascade"
                  : "Y1: Half tax savings → Y2: Other half → Month 13: 25% IRA loan → STR principal → Y3: IRA fund + 80% surrender loan → STR principal → Y4+: Borrow cascade"
                }
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">Year 1 Premium</div>
                  <div className="text-white font-bold">{fmtFull(result.strategy.year1Premium)}</div>
                  <div className="text-[10px] text-[#7a95b8]">{isSolar ? "22% solar enhancement" : "half tax savings"}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">Year 2 Premium</div>
                  <div className="text-white font-bold">{fmtFull(result.strategy.year2Premium)}</div>
                  <div className="text-[10px] text-[#7a95b8]">{isSolar ? "Roth funds" : "other half savings"}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">STR Principal Payments</div>
                  <div className="text-[#22c55e] font-bold">{fmtFull(result.summary.strPrincipalPayments)}</div>
                  <div className="text-[10px] text-[#7a95b8]">from IUL policy loans</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">Final Account Value</div>
                  <div className={`font-bold ${isSolar ? "text-amber-400" : "text-blue-400"}`}>
                    {fmtFull(result.summary.finalAccountValue)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e]">
                  <div className="text-[#7a95b8] text-xs">Illustrated Policy Value</div>
                  <div className="text-[#22c55e] font-bold">{fmtFull(result.summary.finalNetCashValue)}</div>
                  <div className="text-[10px] text-[#7a95b8]">after all loans</div>
                </div>
              </div>

              {/* IUL Growth Chart */}
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={result.iulProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                  <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                    contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="endingAccountValue" stroke={accentHex} strokeWidth={2}
                    fill={isSolar ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)"} name="Account Value" />
                  <Line type="monotone" dataKey="cumulativeLoanBalance" stroke="#ef4444" strokeWidth={2} name="Loan Balance" dot={false} />
                  <Line type="monotone" dataKey="netCashValue" stroke="#22c55e" strokeWidth={2} name="Illustrated Policy Value" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* IUL Detailed Table */}
            <div className="rc-card">
              <div className="text-white font-semibold mb-4 flex items-center gap-2">
                <Banknote size={16} className={isSolar ? "text-amber-400" : "text-blue-400"} />
                {result.inputs.iulYears}-Year IUL Projection — {result.strategyLabel}
              </div>
              <div className="overflow-x-auto">
                <table className="rc-table text-xs">
                  <thead>
                    <tr>
                      <th>Year</th><th>Premium</th><th>Source</th><th>Load Fee</th><th>COI Cost</th>
                      <th>Net to Acct</th><th>Interest</th><th>Loan Taken</th><th>Loan Purpose</th>
                      <th>Account Value</th><th>Loan Bal</th><th>Net Cash</th><th>STR Princ.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.iulProjection.map((row) => (
                      <tr key={row.year}>
                        <td className="font-medium">{row.year}</td>
                        <td>{fmtFull(row.premium)}</td>
                        <td className="text-[#7a95b8] max-w-[120px] truncate" title={row.premiumSource}>{row.premiumSource}</td>
                        <td className="text-red-400">{fmtFull(row.loadFee)}</td>
                        <td className="text-red-400">{fmtFull(row.coiCost)}</td>
                        <td>{fmtFull(row.netPremiumToAccount)}</td>
                        <td className="text-[#22c55e]">{fmtFull(row.interestEarned)}</td>
                        <td className={row.policyLoanTaken > 0 ? "text-amber-400" : ""}>{row.policyLoanTaken > 0 ? fmtFull(row.policyLoanTaken) : "—"}</td>
                        <td className="text-[#7a95b8] max-w-[140px] truncate" title={row.loanPurpose}>{row.loanPurpose || "—"}</td>
                        <td className={`${isSolar ? "text-amber-400" : "text-blue-400"} font-medium`}>
                          {fmtFull(row.endingAccountValue)}
                        </td>
                        <td>{fmtFull(row.cumulativeLoanBalance)}</td>
                        <td className="text-[#22c55e] font-medium">{fmtFull(row.netCashValue)}</td>
                        <td className={row.strPrincipalPayment > 0 ? "text-[#22c55e] font-medium" : ""}>{row.strPrincipalPayment > 0 ? fmtFull(row.strPrincipalPayment) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STR Property 20-Year Projection */}
            <div className="rc-card">
              <div className="text-white font-semibold mb-1 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#22c55e]" /> 20-Year STR Property Projection
              </div>
              <div className="text-xs text-[#7a95b8] mb-4">
                {result.strategy.totalPropertyCount} {result.strategy.totalPropertyCount === 1 ? "property" : "properties"} with {appreciation}% compounding appreciation, rental income at {rentalGross}% gross yield
                {(result.inputs.strategyYears ?? 1) > 1 && ` · properties acquired over ${result.inputs.strategyYears} years`}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-[#7a95b8] mb-2 font-medium">Property Value & Equity</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={result.strProjection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                      <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                        contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="propertyValue" fill="#3b82f6" name="Property Value" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="propertyEquity" fill="#22c55e" name="Equity" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="principalOwed" stroke="#ef4444" strokeWidth={2} name="Principal Owed" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="text-xs text-[#7a95b8] mb-2 font-medium">Annual Cash Flow</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={result.strProjection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                      <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={(v: number) => `$${(v / 1_000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                        contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="rentalIncome" fill="#22c55e" name="Rental Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="interestOnlyPayment" fill="#ef4444" name="Interest-Only Pmt" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="helocPayment" fill="#f0c040" name="HELOC" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* STR Detailed Table */}
            <div className="rc-card">
              <div className="text-white font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-[#22c55e]" /> STR Year-by-Year Detail (20 Years)
              </div>
              <div className="overflow-x-auto">
                <table className="rc-table text-xs">
                  <thead>
                    <tr>
                      <th>Year</th><th>Property Value</th><th>Rental Income</th><th>Interest-Only Pmt</th>
                      <th>HELOC Pmt</th><th>Net Cash Flow</th><th>Principal Owed</th>
                      <th>HELOC Bal</th><th>Property Equity</th><th>Total Interest</th><th>IUL Princ. Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.strProjection.map((row) => (
                      <tr key={row.year}>
                        <td className="font-medium">{row.year}</td>
                        <td>{fmtFull(row.propertyValue)}</td>
                        <td className="text-[#22c55e]">{fmtFull(row.rentalIncome)}</td>
                        <td className="text-red-400">{fmtFull(row.interestOnlyPayment)}</td>
                        <td className="text-[#f0c040]">{fmtFull(row.helocPayment)}</td>
                        <td className={row.netCashFlow >= 0 ? "text-[#22c55e]" : "text-red-400"}>
                          {row.netCashFlow >= 0 ? "+" : ""}{fmtFull(row.netCashFlow)}
                        </td>
                        <td>{fmtFull(row.principalOwed)}</td>
                        <td>{fmtFull(row.helocBalance)}</td>
                        <td className="text-blue-400 font-medium">{fmtFull(row.propertyEquity)}</td>
                        <td className="text-[#7a95b8]">{fmtFull(row.totalInterestPaid)}</td>
                        <td className={row.iulPrincipalApplied > 0 ? "text-[#22c55e] font-medium" : ""}>{row.iulPrincipalApplied > 0 ? fmtFull(row.iulPrincipalApplied) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax-Free Income & Lending Summary */}
            <div className="rc-card border-l-4 border-l-[#22c55e]">
              <div className="text-white font-semibold mb-3 flex items-center gap-2">
                <Zap size={16} className="text-[#22c55e]" /> Building Tax-Free Income & Lending Potential
              </div>
              <div className="text-sm text-[#7a95b8] space-y-3">
                <p>
                  By converting your full IRA to Roth and deploying the tax savings into an IUL policy with a borrow-to-pay cascade,
                  you are building a <strong className="text-white">tax-free retirement income engine</strong>. The IUL's illustrated policy value grows
                  at an average {(result.iulParams.avgReturn * 100).toFixed(0)}% return on the total account value (illustrated, non-guaranteed) (all premiums
                  plus all prior interest earned), with a {(result.iulParams.coiRate * 100).toFixed(0)}% cost of insurance deducted from each new premium.
                </p>
                <p>
                  The <strong className="text-white">Month 13 policy loan</strong> ({fmtFull(result.strategy.month13PolicyLoan)}) and the
                  <strong className="text-white"> Year 3 surrender value loan</strong> are applied as principal-only payments to the STR mortgage,
                  reducing the interest-only payment burden and accelerating equity buildup. The IUL serves as <strong className="text-white">assigned
                  collateral to the bank</strong> for the STR purchase, creating a self-reinforcing leverage structure.
                </p>
                <p>
                  After {result.inputs.iulYears} years, the IUL projects a illustrated policy value of <strong className="text-white">{fmtFull(result.summary.finalNetCashValue)}</strong>.
                  This illustrated policy value serves as a <strong className="text-white">financial tool for lending</strong> — you can borrow
                  against it at {(result.iulParams.loanRate * 100).toFixed(0)}% to fund additional short-term rental property down payments,
                  creating a self-reinforcing cycle of tax-free income generation and real estate wealth building.
                </p>
                <p>
                  The STR {result.strategy.totalPropertyCount > 1 ? "properties generate" : "property generates"} <strong className="text-[#22c55e]">{fmtFull(result.summary.totalRentalIncome)}</strong> in
                  total rental income over 20 years with <strong className="text-[#22c55e]">+{fmtFull(result.summary.propertyAppreciation)}</strong> in
                  property appreciation. Combined with the Roth IRA growing tax-free to <strong className="text-[#22c55e]">{fmtFull(result.summary.finalRothBalance)}</strong>,
                  this strategy creates multiple streams of tax-advantaged wealth while maintaining liquidity through the IUL's lending capability for more STR acquisitions.
                </p>
              </div>
            </div>

            {/* Grand Summary */}
            <div className="rc-card">
              <div className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#22c55e]" /> Combined Strategy Summary — {result.strategyLabel}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[#7a95b8] text-xs">Total Rental Income (20yr)</div>
                  <div className="text-[#22c55e] font-bold text-lg">{fmtFull(result.summary.totalRentalIncome)}</div>
                </div>
                <div>
                  <div className="text-[#7a95b8] text-xs">Property Appreciation</div>
                  <div className="text-[#22c55e] font-bold text-lg">+{fmtFull(result.summary.propertyAppreciation)}</div>
                </div>
                <div>
                  <div className="text-[#7a95b8] text-xs">Final Property Equity</div>
                  <div className="text-blue-400 font-bold text-lg">{fmtFull(result.summary.finalPropertyEquity)}</div>
                </div>
                <div>
                  <div className="text-[#7a95b8] text-xs">Principal Still Owed</div>
                  <div className="text-red-400 font-bold text-lg">{fmtFull(result.summary.finalPrincipalOwed)}</div>
                </div>
                <div>
                  <div className="text-[#7a95b8] text-xs">Total Interest Paid (20yr)</div>
                  <div className="text-[#f0c040] font-bold text-lg">{fmtFull(result.summary.totalInterestPaid)}</div>
                </div>
                <div>
                  <div className="text-[#7a95b8] text-xs">Roth Balance ({result.inputs.iulYears}yr)</div>
                  <div className="text-[#22c55e] font-bold text-lg">{fmtFull(result.summary.finalRothBalance)}</div>
                </div>
                <div>
                  <div className="text-[#7a95b8] text-xs">IUL Illustrated Policy Value</div>
                  <div className={`font-bold text-lg ${isSolar ? "text-amber-400" : "text-blue-400"}`}>
                    {fmtFull(result.summary.finalNetCashValue)}
                  </div>
                </div>
                <div>
                  <div className="text-[#7a95b8] text-xs">IUL Total Premiums Paid</div>
                  <div className="text-white font-bold text-lg">{fmtFull(result.summary.totalPremiumsPaid)}</div>
                </div>
              </div>
            </div>
          </>
        )}
        <NAICDisclaimer variant="footer" showsProjections showsCashValues showsPolicyLoans showsComparisons showsHistoricalData />
      </div>
          <PageInsights pageId="roth-conversion" />
    
        <ComplianceFooter pageName="RothConversionSTR" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
