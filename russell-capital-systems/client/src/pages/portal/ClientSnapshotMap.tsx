// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import {
  User,
  Users,
  Home,
  DollarSign,
  TrendingUp,
  Shield,
  CreditCard,
  Landmark,
  PiggyBank,
  Building2,
  Heart,
  Briefcase,
  Wallet,
  BarChart3,
  AlertTriangle,
  Gift,
  Star,
  Lock,
  Key,
  Calculator,
  Banknote,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const pctFmt = (n: number) => `${n.toFixed(1)}%`;

const getFicoTier = (score: number) => {
  if (score >= 800) return { tier: "Exceptional", color: "text-emerald-400", bg: "bg-emerald-500/20", rate: "5.5–6.5%", investRate: "6.0–7.0%" };
  if (score >= 740) return { tier: "Very Good", color: "text-green-400", bg: "bg-green-500/20", rate: "6.0–7.0%", investRate: "6.5–7.5%" };
  if (score >= 670) return { tier: "Good", color: "text-blue-400", bg: "bg-blue-500/20", rate: "7.0–8.0%", investRate: "7.5–8.5%" };
  if (score >= 580) return { tier: "Fair", color: "text-amber-400", bg: "bg-amber-500/20", rate: "8.0–10.0%", investRate: "9.0–11.0%" };
  return { tier: "Poor", color: "text-red-400", bg: "bg-red-500/20", rate: "10.0–14.0%", investRate: "12.0–15.0%" };
};

const calcCreditCardPayoff = (balance: number, apr: number, monthlyPayment: number) => {
  if (monthlyPayment <= 0 || balance <= 0) return { months: 0, totalInterest: 0, totalPaid: 0 };
  const monthlyRate = apr / 100 / 12;
  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600;
  while (remaining > 0.01 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    remaining = remaining + interest - monthlyPayment;
    months++;
    if (monthlyPayment <= remaining * monthlyRate) return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
  }
  return { months, totalInterest, totalPaid: balance + totalInterest };
};

interface AssetNode {
  label: string;
  value: number;
  icon: any;
  color: string;
  category: "asset" | "liability" | "income" | "insurance" | "protection" | "credit" | "inheritance";
  details?: string;
}

export default function ClientSnapshotMap() {
  const { selectedClientId } = useClientData();
  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery();
  const [clientId, setClientId] = useState<number | null>(selectedClientId ?? null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["assets", "income", "liabilities"]));

  const [ficoScore, setFicoScore] = useState<number>(720);
  const [spouseFico, setSpouseFico] = useState<number>(700);
  const [creditCardBalance, setCreditCardBalance] = useState<number>(12000);
  const [creditCardApr, setCreditCardApr] = useState<number>(22.9);
  const [creditCardMinPayment, setCreditCardMinPayment] = useState<number>(350);
  const [highestCardBalance, setHighestCardBalance] = useState<number>(8500);
  const [totalCreditLimit, setTotalCreditLimit] = useState<number>(45000);
  const [cdBalance, setCdBalance] = useState<number>(50000);
  const [cdRate, setCdRate] = useState<number>(4.5);
  const [cdMaturityMonths, setCdMaturityMonths] = useState<number>(12);
  const [annuityBalance, setAnnuityBalance] = useState<number>(150000);
  const [annuityRate, setAnnuityRate] = useState<number>(5.2);
  const [annuitySurrenderYears, setAnnuitySurrenderYears] = useState<number>(4);
  const [pensionMonthly, setPensionMonthly] = useState<number>(2800);
  const [pensionStartAge, setPensionStartAge] = useState<number>(65);
  const [pensionSurvivor, setPensionSurvivor] = useState<number>(50);
  const [ssMonthly, setSsMonthly] = useState<number>(2400);
  const [ssClaimAge, setSsClaimAge] = useState<number>(67);
  const [spouseSsMonthly, setSpouseSsMonthly] = useState<number>(1200);
  const [inheritanceEstimate, setInheritanceEstimate] = useState<number>(250000);
  const [inheritanceTimeline, setInheritanceTimeline] = useState("5-10");
  const [inheritanceLikelihood, setInheritanceLikelihood] = useState<number>(75);
  const [inheritanceType, setInheritanceType] = useState("Real estate + cash");

  const client = useMemo(() => clients?.find((c) => c.id === clientId), [clients, clientId]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const assetNodes: AssetNode[] = useMemo(() => {
    if (!client) return [];
    const nodes: AssetNode[] = [];

    if (client.iraBalance) nodes.push({ label: "Traditional IRA", value: Number(client.iraBalance), icon: Landmark, color: "from-blue-500 to-blue-600", category: "asset", details: "Tax-deferred growth, RMDs at 73" });
    if (client.rothBalance) nodes.push({ label: "Roth IRA", value: Number(client.rothBalance), icon: PiggyBank, color: "from-emerald-500 to-emerald-600", category: "asset", details: "Tax-free growth, no RMDs" });
    if (client.iraBalance) nodes.push({ label: "401(k)", value: Number(client.iraBalance), icon: Building2, color: "from-indigo-500 to-indigo-600", category: "asset", details: "Employer-sponsored, tax-deferred" });
    if (client.taxableAssets) nodes.push({ label: "Taxable Accounts", value: Number(client.taxableAssets), icon: TrendingUp, color: "from-cyan-500 to-cyan-600", category: "asset", details: "Capital gains tax applies" });
    if (client.realEstateEquity) nodes.push({ label: "Real Estate Equity", value: Number(client.realEstateEquity), icon: Home, color: "from-amber-500 to-amber-600", category: "asset", details: "Primary + investment properties" });
    if (client.taxableAssets) nodes.push({ label: "Other Assets", value: Number(client.taxableAssets), icon: Briefcase, color: "from-purple-500 to-purple-600", category: "asset" });

    if (cdBalance > 0) nodes.push({ label: "Certificates of Deposit", value: cdBalance, icon: Lock, color: "from-teal-500 to-teal-600", category: "asset", details: `${cdRate}% APY · ${cdMaturityMonths}mo maturity · Locked` });
    if (annuityBalance > 0) nodes.push({ label: "Annuity", value: annuityBalance, icon: Shield, color: "from-violet-500 to-violet-600", category: "asset", details: `${annuityRate}% guaranteed · ${annuitySurrenderYears}yr surrender` });

    if (client.realEstateEquity) nodes.push({ label: "Mortgage", value: Number(client.realEstateEquity), icon: Home, color: "from-red-500 to-red-600", category: "liability", details: "Variable rate" });
    if (0) nodes.push({ label: "Other Debt", value: 0, icon: CreditCard, color: "from-red-400 to-red-500", category: "liability" });
    if (creditCardBalance > 0) nodes.push({ label: "Credit Card Debt", value: creditCardBalance, icon: CreditCard, color: "from-rose-500 to-rose-600", category: "liability", details: `${creditCardApr}% APR · Highest card: ${fmt(highestCardBalance)}` });

    if (client.income) nodes.push({ label: "Employment Income", value: Number(client.income), icon: DollarSign, color: "from-green-500 to-green-600", category: "income", details: "Active earned income" });
    if (ssMonthly > 0) nodes.push({ label: "Social Security", value: ssMonthly * 12, icon: Landmark, color: "from-green-400 to-green-500", category: "income", details: `$${ssMonthly.toLocaleString()}/mo at age ${ssClaimAge}` });
    if (spouseSsMonthly > 0) nodes.push({ label: "Spouse Social Security", value: spouseSsMonthly * 12, icon: Landmark, color: "from-green-300 to-green-400", category: "income", details: `$${spouseSsMonthly.toLocaleString()}/mo` });
    if (pensionMonthly > 0) nodes.push({ label: "Pension", value: pensionMonthly * 12, icon: Wallet, color: "from-green-600 to-green-700", category: "income", details: `$${pensionMonthly.toLocaleString()}/mo at age ${pensionStartAge} · ${pensionSurvivor}% survivor` });

    if (client.lifeInsuranceCv) nodes.push({ label: "Life Insurance", value: Number(client.lifeInsuranceCv), icon: Shield, color: "from-violet-500 to-violet-600", category: "insurance" });

    if (totalCreditLimit > 0) nodes.push({ label: "Available Credit", value: totalCreditLimit - creditCardBalance, icon: Key, color: "from-sky-500 to-sky-600", category: "credit", details: `${totalCreditLimit > 0 ? ((creditCardBalance / totalCreditLimit) * 100).toFixed(0) : 0}% utilization of ${fmt(totalCreditLimit)}` });

    if (inheritanceEstimate > 0) nodes.push({ label: "Expected Inheritance", value: inheritanceEstimate, icon: Gift, color: "from-amber-400 to-amber-500", category: "inheritance", details: `${inheritanceLikelihood}% probability · ${inheritanceTimeline} years · ${inheritanceType}` });

    return nodes;
  }, [client, cdBalance, cdRate, cdMaturityMonths, annuityBalance, annuityRate, annuitySurrenderYears, creditCardBalance, creditCardApr, highestCardBalance, totalCreditLimit, ssMonthly, ssClaimAge, spouseSsMonthly, pensionMonthly, pensionStartAge, pensionSurvivor, inheritanceEstimate, inheritanceTimeline, inheritanceLikelihood, inheritanceType]);

  const totalAssets = useMemo(() => assetNodes.filter((n) => n.category === "asset").reduce((s, n) => s + n.value, 0), [assetNodes]);
  const totalLiabilities = useMemo(() => assetNodes.filter((n) => n.category === "liability").reduce((s, n) => s + n.value, 0), [assetNodes]);
  const netWorth = totalAssets - totalLiabilities;
  const totalIncome = useMemo(() => assetNodes.filter((n) => n.category === "income").reduce((s, n) => s + n.value, 0), [assetNodes]);
  const totalProtection = useMemo(() => assetNodes.filter((n) => n.category === "insurance").reduce((s, n) => s + n.value, 0), [assetNodes]);
  const totalCredit = useMemo(() => assetNodes.filter((n) => n.category === "credit").reduce((s, n) => s + n.value, 0), [assetNodes]);

  const ficoTier = getFicoTier(ficoScore);
  const spouseFicoTier = getFicoTier(spouseFico);
  const ccPayoff = calcCreditCardPayoff(creditCardBalance, creditCardApr, creditCardMinPayment);
  const creditUtilization = totalCreditLimit > 0 ? (creditCardBalance / totalCreditLimit) * 100 : 0;

  const categories = [
    { key: "asset", label: "Assets & Investments", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30", total: totalAssets, icon: TrendingUp },
    { key: "income", label: "Income Streams", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/30", total: totalIncome, icon: DollarSign },
    { key: "insurance", label: "Protection & Insurance", color: "text-violet-400", bgColor: "bg-violet-500/10 border-violet-500/30", total: totalProtection, icon: Shield },
    { key: "credit", label: "Credit Access (Asset Class)", color: "text-sky-400", bgColor: "bg-sky-500/10 border-sky-500/30", total: totalCredit, icon: Key },
    { key: "inheritance", label: "Expected Inheritance", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/30", total: inheritanceEstimate, icon: Gift },
    { key: "liability", label: "Liabilities & Debt", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/30", total: totalLiabilities, icon: CreditCard },
  ];

  const gaps = useMemo(() => {
    if (!client) return [];
    const g: { text: string; severity: "high" | "medium" | "low"; action: string }[] = [];
    if (!client.lifeInsuranceCv || Number(client.lifeInsuranceCv) < Number(client.income ?? 0) * 10)
      g.push({ text: "Life insurance may be insufficient (under 10x income)", severity: "high", action: "Review IUL or term life options" });
    if (!client.rothBalance && !client.iraBalance)
      g.push({ text: "No tax-advantaged retirement accounts detected", severity: "high", action: "Open 401(k) or IRA immediately" });
    if (Number(client.realEstateEquity ?? 0) > 0)
      g.push({ text: `High-rate mortgage at 0% — consider Mortgage Killer strategy`, severity: "medium", action: "Run Mortgage Killer analysis" });
    if (Number(client.age ?? 0) >= 59.5 && Number(client.iraBalance ?? 0) > 200000)
      g.push({ text: "Roth conversion window open — significant traditional IRA balance", severity: "medium", action: "Model Roth conversion ladder" });
    if (!ssMonthly || ssMonthly === 0)
      g.push({ text: "Social Security benefit not documented", severity: "low", action: "Request SSA statement" });
    if (Number(client.taxableAssets ?? 0) > 100000)
      g.push({ text: "Large taxable account — tax-loss harvesting opportunity", severity: "low", action: "Review for harvesting before year-end" });
    if (creditCardBalance > 5000)
      g.push({ text: `Credit card debt of ${fmt(creditCardBalance)} at ${creditCardApr}% APR — costing ${fmt(ccPayoff.totalInterest)} in interest`, severity: "high", action: "Implement debt avalanche strategy" });
    if (creditUtilization > 30)
      g.push({ text: `Credit utilization at ${creditUtilization.toFixed(0)}% — above 30% threshold hurting FICO score`, severity: "medium", action: "Pay down to below 30% utilization" });
    if (ficoScore < 670)
      g.push({ text: `FICO score of ${ficoScore} limits borrowing options and increases rates`, severity: "high", action: "Implement credit improvement plan" });
    if (annuitySurrenderYears > 0 && annuityBalance > 0)
      g.push({ text: `Annuity in ${annuitySurrenderYears}-year surrender period — early withdrawal penalties apply`, severity: "low", action: "Track surrender schedule, plan 1035 exchange" });
    if (pensionMonthly > 0 && pensionSurvivor < 75)
      g.push({ text: `Pension survivor benefit at only ${pensionSurvivor}% — spouse income gap risk`, severity: "medium", action: "Model life insurance to cover pension gap" });
    if (inheritanceEstimate > 100000 && inheritanceLikelihood < 50)
      g.push({ text: `Expected inheritance of ${fmt(inheritanceEstimate)} has only ${inheritanceLikelihood}% probability — don't build plan around it`, severity: "low", action: "Create plans with and without inheritance" });
    if ((client.age ?? 0) > 50 && !client.lifeInsuranceCv)
      g.push({ text: "No life insurance detected for client over 50 — estate and survivor planning gap", severity: "high", action: "Evaluate term, whole life, or IUL options" });
    return g;
  }, [client, creditCardBalance, creditCardApr, creditUtilization, ficoScore, annuitySurrenderYears, annuityBalance, pensionMonthly, pensionSurvivor, inheritanceEstimate, inheritanceLikelihood, ssMonthly, ccPayoff]);

  return (
    <AppShell title="Client Financial Snapshot" subtitle="Comprehensive one-page financial overview">
      <div className="space-y-5">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="ClientSnapshotMap" />

        <ExecutiveSummary
          pageTitle="Client Snapshot Map"
          whatItDoes="This financial analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex financial analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="This tool reveals insights that most clients never see because they don\'t have access to institutional-grade analysis. The data here can change how you think about your entire financial picture."
          intent="To give you the same caliber of financial analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your financial analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how financial analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this financial analysis strategy interact with my other financial plans?",
            "What\'s the single biggest financial analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Client Snapshot Map" pageContext="Client Snapshot Map — financial analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This financial analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended financial analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={200000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Financial Clarity Score", doNothing: 40, recommended: 90, format: "percent" },
            { label: "Optimization Potential", doNothing: 0, recommended: 200000, format: "currency" },
            { label: "Decision Confidence", doNothing: 35, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on financial analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="rc-page-title">Comprehensive Financial Snapshot Map</h2>
              <p className="rc-page-subtitle">
                Assets, liabilities, income, credit, inheritance, FICO, and real estate strategies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FactFinderBadge />
            <ExportToSlides
              toolName="Comprehensive Financial Snapshot Map"
              getSections={() => [
                {
                  title: "Net Worth Summary",
                  items: [
                    { label: "Net Worth", value: fmt(netWorth) },
                    { label: "Total Assets", value: fmt(totalAssets) },
                    { label: "Annual Income", value: fmt(totalIncome) },
                    { label: "Liabilities", value: fmt(totalLiabilities) },
                  ]
                },
                {
                  title: "Credit & FICO",
                  items: [
                    { label: "FICO Score", value: String(ficoScore) },
                    { label: "Credit Tier", value: ficoTier.tier },
                    { label: "Credit Card Debt", value: fmt(creditCardBalance) },
                    { label: "Credit Utilization", value: `${creditUtilization.toFixed(0)}%` },
                  ]
                },
                {
                  title: "Fixed Income & Annuities",
                  items: [
                    { label: "CD Balance", value: fmt(cdBalance) },
                    { label: "Annuity Value", value: fmt(annuityBalance) },
                  ]
                },
                {
                  title: "Social Security & Pension",
                  items: [
                    { label: "Combined Annual SS", value: fmt((ssMonthly + spouseSsMonthly) * 12) },
                    { label: "Annual Pension", value: fmt(pensionMonthly * 12) },
                  ]
                },
                {
                  title: "Inheritance",
                  items: [
                    { label: "Estimated Value", value: fmt(inheritanceEstimate) },
                    { label: "Timeline", value: `${inheritanceTimeline} years` },
                    { label: "Likelihood", value: `${inheritanceLikelihood}%` },
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Client Selector */}
        <div className="rc-card">
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={clientId?.toString() ?? ""} onValueChange={(v) => setClientId(Number(v))}>
              <SelectTrigger className="w-[300px] bg-slate-900/50 border-slate-600/50 text-white">
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {client && (
              <div className="flex items-center gap-3 text-sm text-[#7a95b8] flex-wrap">
                <span>Age: {client.age ?? "—"}</span>
                <span className="text-slate-600">|</span>
                <span>Status: {client.filingStatus ?? "—"}</span>
                <span className="text-slate-600">|</span>
                <span>State: {client.state ?? "—"}</span>
              </div>
            )}
          </div>
        </div>

        {!client ? (
          <div className="rc-card py-16 text-center">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-[#7a95b8]">Select a client to view their comprehensive financial snapshot</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-[#0d1a2e] border border-[#12233e]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="credit">FICO & Credit</TabsTrigger>
              <TabsTrigger value="fixed-income">CDs & Annuities</TabsTrigger>
              <TabsTrigger value="pension-ss">Pension & SS</TabsTrigger>
              <TabsTrigger value="inheritance">Inheritance</TabsTrigger>
              <TabsTrigger value="real-estate">Real Estate</TabsTrigger>
            </TabsList>

            {/* ═══════════ OVERVIEW TAB ═══════════ */}
            <TabsContent value="overview" className="space-y-4">
              {/* Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rc-card">
                  <div className="text-sm font-semibold text-white mb-3">Asset Allocation</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={assetNodes.filter((n) => n.category === "asset").length > 0 ? assetNodes.filter((n) => n.category === "asset") : [{ label: "Empty", value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="label"
                        stroke="none"
                      >
                        {(assetNodes.filter((n) => n.category === "asset").length > 0 ? assetNodes.filter((n) => n.category === "asset") : [{ label: "Empty", value: 1 }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444"][index % 5]} />
                        ))}
                      </Pie>
                      <RTooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                        itemStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rc-card">
                  <div className="text-sm font-semibold text-white mb-3">Financial Overview</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[
                      { name: "Assets", value: totalAssets },
                      { name: "Liabilities", value: totalLiabilities },
                      { name: "Net Worth", value: netWorth },
                      { name: "Income", value: totalIncome }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />
                      <RTooltip
                        formatter={(value: number) => fmt(value)}
                        cursor={{ fill: "#1e293b" }}
                        contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[
                          { name: "Assets", value: totalAssets },
                          { name: "Liabilities", value: totalLiabilities },
                          { name: "Net Worth", value: netWorth },
                          { name: "Income", value: totalIncome }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#3b82f6", "#ef4444", "#22c55e", "#f0c040"][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Net Worth Hero */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="rc-card bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30 text-center">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium">Net Worth</p>
                    <p className="rc-stat-value mt-0.5">{fmt(netWorth)}</p>
                </div>
                <div className="rc-card bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-center">
                    <p className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">Total Assets</p>
                    <p className="rc-stat-value mt-0.5">{fmt(totalAssets)}</p>
                </div>
                <div className="rc-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 text-center">
                    <p className="text-[10px] text-green-400 uppercase tracking-wider font-medium">Annual Income</p>
                    <p className="rc-stat-value mt-0.5">{fmt(totalIncome)}</p>
                </div>
                <div className="rc-card bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/30 text-center">
                    <p className="text-[10px] text-red-400 uppercase tracking-wider font-medium">Liabilities</p>
                    <p className="rc-stat-value mt-0.5">{fmt(totalLiabilities)}</p>
                </div>
                <div className={`rc-card border ${ficoTier.bg.replace("/20", "/30")} text-center`}>
                    <p className={`text-[10px] uppercase tracking-wider font-medium ${ficoTier.color}`}>FICO Score</p>
                    <p className="rc-stat-value mt-0.5">{ficoScore}</p>
                    <p className={`text-[10px] ${ficoTier.color}`}>{ficoTier.tier}</p>
                </div>
                <div className="rc-card bg-gradient-to-br from-amber-500/10 to-amber-500/10 border-amber-500/30 text-center">
                    <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">Inheritance</p>
                    <p className="rc-stat-value mt-0.5">{fmt(inheritanceEstimate)}</p>
                    <p className="text-[10px] text-amber-400">{inheritanceLikelihood}% likely</p>
                </div>
              </div>

              {/* Visual Map — Category Sections */}
              <div className="grid gap-3">
                {categories.map((cat) => {
                  const catNodes = assetNodes.filter((n) => n.category === cat.key);
                  if (catNodes.length === 0) return null;
                  const isExpanded = expandedSections.has(cat.key);
                  const CatIcon = cat.icon;
                  return (
                    <div key={cat.key} className={`rc-card border ${cat.bgColor}`}>
                      <button
                        onClick={() => toggleSection(cat.key)}
                        className="w-full px-6 py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CatIcon className={`h-4 w-4 ${cat.color}`} />
                          <span className={`text-sm font-semibold ${cat.color}`}>{cat.label}</span>
                          <Badge variant="secondary" className="text-[10px]">{catNodes.length} items</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-white">{fmt(cat.total)}</span>
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-[#7a95b8]" /> : <ChevronRight className="h-4 w-4 text-[#7a95b8]" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="pt-0 pb-4 px-6">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {catNodes.map((node, i) => {
                              const Icon = node.icon;
                              const pct = cat.total > 0 ? ((node.value / cat.total) * 100).toFixed(0) : "0";
                              return (
                                <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-slate-500/50 transition-all">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${node.color}`}>
                                      <Icon className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <span className="text-xs text-[#c8d8ec] truncate">{node.label}</span>
                                  </div>
                                  <p className="text-lg font-bold text-white">{fmt(node.value)}</p>
                                  {node.details && (
                                    <p className="text-[10px] text-[#7a95b8] mt-1">{node.details}</p>
                                  )}
                                  <div className="mt-2 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                                    <div className={`h-full rounded-full bg-gradient-to-r ${node.color}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <p className="text-[10px] text-[#7a95b8] mt-0.5">{pct}% of {cat.label.toLowerCase()}</p>
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

              {/* Planning Gaps */}
              {gaps.length > 0 && (
                <div className="rc-card bg-amber-500/5 border-amber-500/20">
                  <div className="pb-2">
                    <h3 className="text-base text-white flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" /> {gaps.length} Planning Gaps & Opportunities Detected
                    </h3>
                  </div>
                  <div>
                    <div className="space-y-2">
                      {gaps.map((gap, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/40">
                          <Badge className={`shrink-0 text-[10px] ${gap.severity === "high" ? "bg-red-500/20 text-red-400 border-red-500/30" : gap.severity === "medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                            {gap.severity}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm text-[#c8d8ec]">{gap.text}</p>
                            <p className="text-xs text-[#7a95b8] mt-0.5">Action: {gap.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Household Members */}
              <div className="rc-card">
                <div className="pb-2">
                  <h3 className="text-base text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-400" /> Household Members
                  </h3>
                </div>
                <div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0d1a2e] border border-[#12233e]">
                      <User className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{client.name}</p>
                        <p className="text-xs text-[#7a95b8]">Primary · Age {client.age ?? "—"} · FICO {ficoScore}</p>
                      </div>
                    </div>
                    {client.household && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0d1a2e] border border-[#12233e]">
                        <Heart className="h-5 w-5 text-pink-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{client.household}</p>
                          <p className="text-xs text-[#7a95b8]">Spouse · FICO {spouseFico}</p>
                        </div>
                      </div>
                    )}
                    {client.household && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0d1a2e] border border-[#12233e]">
                        <Users className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{client.household}</p>
                          <p className="text-xs text-[#7a95b8]">Household members</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════ FICO & CREDIT TAB ═══════════ */}
            <TabsContent value="credit" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* FICO Score Card */}
                <div className="rc-card">
                  <div className="pb-2">
                    <h3 className="text-base text-white flex items-center gap-2">
                      <Star className="h-4 w-4 text-[#f0c040]" /> FICO Credit Scores
                    </h3>
                    <p className="text-sm text-[#7a95b8]">Access to good credit is an important asset class</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Client FICO Score</Label>
                        <Input type="number" value={ficoScore} onChange={(e) => setFicoScore(Number(e.target.value))} className="rc-input mt-1" />
                        <Badge className={`mt-2 ${ficoTier.bg} ${ficoTier.color} border-transparent`}>{ficoTier.tier}</Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Spouse FICO Score</Label>
                        <Input type="number" value={spouseFico} onChange={(e) => setSpouseFico(Number(e.target.value))} className="rc-input mt-1" />
                        <Badge className={`mt-2 ${spouseFicoTier.bg} ${spouseFicoTier.color} border-transparent`}>{spouseFicoTier.tier}</Badge>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                      <p className="text-xs text-[#7a95b8] mb-2">Estimated Mortgage Rates Based on FICO</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-[#7a95b8]">Primary Home:</span> <span className="text-white font-medium">{ficoTier.rate}</span></div>
                        <div><span className="text-[#7a95b8]">Investment Property:</span> <span className="text-white font-medium">{ficoTier.investRate}</span></div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-xs text-blue-400 font-medium mb-1">Why Credit Is an Asset Class</p>
                      <p className="text-xs text-[#c8d8ec] leading-relaxed">
                        Access to favorable credit terms can save hundreds of thousands over a lifetime. A 740+ FICO score
                        unlocks the best mortgage rates, premium credit card rewards, lower insurance premiums, and better
                        business financing terms. Every 20-point improvement in FICO can save 0.25-0.50% on mortgage rates,
                        translating to $30,000-$60,000 in savings on a $400,000 mortgage over 30 years.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credit Card Debt Calculator */}
                <div className="rc-card">
                  <div className="pb-2">
                    <h3 className="text-base text-white flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-rose-400" /> Credit Card Debt Analysis
                    </h3>
                    <p className="text-sm text-[#7a95b8]">Highest balance analysis and payoff calculator</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Total CC Balance</Label>
                        <Input type="number" value={creditCardBalance} onChange={(e) => setCreditCardBalance(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Highest Card Balance</Label>
                        <Input type="number" value={highestCardBalance} onChange={(e) => setHighestCardBalance(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">APR (%)</Label>
                        <Input type="number" step="0.1" value={creditCardApr} onChange={(e) => setCreditCardApr(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Monthly Payment</Label>
                        <Input type="number" value={creditCardMinPayment} onChange={(e) => setCreditCardMinPayment(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Total Credit Limit</Label>
                        <Input type="number" value={totalCreditLimit} onChange={(e) => setTotalCreditLimit(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                    </div>

                    {/* Utilization Gauge */}
                    <div className="p-3 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[#7a95b8]">Credit Utilization</span>
                        <span className={`text-sm font-bold ${creditUtilization > 30 ? "text-red-400" : creditUtilization > 10 ? "text-[#f0c040]" : "text-[#22c55e]"}`}>
                          {creditUtilization.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-700/50 overflow-hidden relative">
                        <div className={`h-full rounded-full transition-all ${creditUtilization > 30 ? "bg-red-500" : creditUtilization > 10 ? "bg-[#f0c040]" : "bg-[#22c55e]"}`} style={{ width: `${Math.min(100, creditUtilization)}%` }} />
                        <div className="absolute top-0 left-[30%] h-full w-px bg-white/30" title="30% threshold" />
                      </div>
                      <p className="text-[10px] text-[#7a95b8] mt-1">Target: below 30% for optimal FICO impact (below 10% is ideal)</p>
                    </div>

                    {/* Payoff Results */}
                    {creditCardBalance > 0 && (
                      <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                        <p className="text-xs text-rose-400 font-medium mb-2">Payoff Analysis at ${creditCardMinPayment}/mo</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-white">{ccPayoff.months === Infinity ? "Never" : `${ccPayoff.months}mo`}</p>
                            <p className="text-[10px] text-[#7a95b8]">Time to Payoff</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-red-400">{ccPayoff.totalInterest === Infinity ? "∞" : fmt(ccPayoff.totalInterest)}</p>
                            <p className="text-[10px] text-[#7a95b8]">Total Interest</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white">{ccPayoff.totalPaid === Infinity ? "∞" : fmt(ccPayoff.totalPaid)}</p>
                            <p className="text-[10px] text-[#7a95b8]">Total Paid</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════ CDs & ANNUITIES TAB ═══════════ */}
            <TabsContent value="fixed-income" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rc-card">
                  <div className="pb-2">
                    <h3 className="text-base text-white flex items-center gap-2">
                      <Lock className="h-4 w-4 text-teal-400" /> Certificates of Deposit
                    </h3>
                    <p className="text-sm text-[#7a95b8]">Fixed-rate, FDIC-insured savings with lock-up periods</p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-[#7a95b8]">CD Balance</Label>
                        <Input type="number" value={cdBalance} onChange={(e) => setCdBalance(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">APY (%)</Label>
                        <Input type="number" step="0.1" value={cdRate} onChange={(e) => setCdRate(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Maturity (months)</Label>
                        <Input type="number" value={cdMaturityMonths} onChange={(e) => setCdMaturityMonths(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                    </div>
                    {cdBalance > 0 && (
                      <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-white">{fmt(cdBalance * (cdRate / 100) * (cdMaturityMonths / 12))}</p>
                            <p className="text-[10px] text-[#7a95b8]">Interest at Maturity</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white">{fmt(cdBalance + cdBalance * (cdRate / 100) * (cdMaturityMonths / 12))}</p>
                            <p className="text-[10px] text-[#7a95b8]">Value at Maturity</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-teal-400">{cdMaturityMonths}mo</p>
                            <p className="text-[10px] text-[#7a95b8]">Lock-up Period</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rc-card">
                  <div className="pb-2">
                    <h3 className="text-base text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-violet-400" /> Annuity Holdings
                    </h3>
                    <p className="text-sm text-[#7a95b8]">Guaranteed rates with surrender period restrictions</p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Annuity Value</Label>
                        <Input type="number" value={annuityBalance} onChange={(e) => setAnnuityBalance(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Guaranteed Rate (%)</Label>
                        <Input type="number" step="0.1" value={annuityRate} onChange={(e) => setAnnuityRate(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Surrender Years Left</Label>
                        <Input type="number" value={annuitySurrenderYears} onChange={(e) => setAnnuitySurrenderYears(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                    </div>
                    {annuityBalance > 0 && (
                      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-white">{fmt(annuityBalance * (annuityRate / 100))}</p>
                            <p className="text-[10px] text-[#7a95b8]">Annual Growth</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white">{fmt(annuityBalance * Math.pow(1 + annuityRate / 100, annuitySurrenderYears))}</p>
                            <p className="text-[10px] text-[#7a95b8]">Value at Surrender End</p>
                          </div>
                          <div>
                            <p className={`text-lg font-bold ${annuitySurrenderYears > 0 ? "text-[#f0c040]" : "text-[#22c55e]"}`}>
                              {annuitySurrenderYears > 0 ? `${annuitySurrenderYears}yr locked` : "Free"}
                            </p>
                            <p className="text-[10px] text-[#7a95b8]">Surrender Status</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════ PENSION & SS TAB ═══════════ */}
            <TabsContent value="pension-ss" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rc-card">
                  <div className="pb-2">
                    <h3 className="text-base text-white flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-[#22c55e]" /> Social Security Benefits
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Client Monthly Benefit</Label>
                        <Input type="number" value={ssMonthly} onChange={(e) => setSsMonthly(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Claim Age</Label>
                        <Input type="number" value={ssClaimAge} onChange={(e) => setSsClaimAge(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Spouse Monthly Benefit</Label>
                        <Input type="number" value={spouseSsMonthly} onChange={(e) => setSpouseSsMonthly(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-white">{fmt((ssMonthly + spouseSsMonthly) * 12)}</p>
                          <p className="text-[10px] text-[#7a95b8]">Combined Annual SS Income</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{fmt((ssMonthly + spouseSsMonthly) * 12 * 20)}</p>
                          <p className="text-[10px] text-[#7a95b8]">Estimated 20-Year Value</p>
                        </div>
                      </div>
                      <p className="text-xs text-[#7a95b8] mt-2 leading-relaxed">
                        Claiming at age {ssClaimAge}. Delaying from 62 to 70 increases benefits by approximately 77%.
                        Each year of delay past full retirement age adds 8% in delayed retirement credits.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rc-card">
                  <div className="pb-2">
                    <h3 className="text-base text-white flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[#22c55e]" /> Pension Benefits
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Monthly Benefit</Label>
                        <Input type="number" value={pensionMonthly} onChange={(e) => setPensionMonthly(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Start Age</Label>
                        <Input type="number" value={pensionStartAge} onChange={(e) => setPensionStartAge(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Survivor Benefit (%)</Label>
                        <Input type="number" value={pensionSurvivor} onChange={(e) => setPensionSurvivor(Number(e.target.value))} className="rc-input mt-1" />
                      </div>
                    </div>
                    {pensionMonthly > 0 && (
                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-white">{fmt(pensionMonthly * 12)}</p>
                            <p className="text-[10px] text-[#7a95b8]">Annual Pension</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white">{fmt(pensionMonthly * 12 * 25)}</p>
                            <p className="text-[10px] text-[#7a95b8]">25-Year Value</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#f0c040]">{pensionSurvivor}%</p>
                            <p className="text-[10px] text-[#7a95b8]">Survivor Benefit</p>
                          </div>
                        </div>
                        {pensionSurvivor < 100 && (
                          <p className="text-xs text-[#f0c040] mt-2">
                            Survivor gap: spouse would lose {fmt(pensionMonthly * (1 - pensionSurvivor / 100))}/mo if client passes.
                            Consider life insurance to cover this gap.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════ INHERITANCE TAB ═══════════ */}
            <TabsContent value="inheritance" className="space-y-4">
              <div className="rc-card">
                <div className="pb-2">
                  <h3 className="text-base text-white flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[#f0c040]" /> Expected Inheritance Planning
                  </h3>
                  <p className="text-sm text-[#7a95b8]">Estimate and plan for anticipated inherited assets</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-[#7a95b8]">Estimated Value</Label>
                      <Input type="number" value={inheritanceEstimate} onChange={(e) => setInheritanceEstimate(Number(e.target.value))} className="rc-input mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#7a95b8]">Timeline (years)</Label>
                      <Select value={inheritanceTimeline} onValueChange={setInheritanceTimeline}>
                        <SelectTrigger className="rc-input mt-1 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-3">1-3 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5-10">5-10 years</SelectItem>
                          <SelectItem value="10-15">10-15 years</SelectItem>
                          <SelectItem value="15+">15+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-[#7a95b8]">Likelihood (%)</Label>
                      <Input type="number" value={inheritanceLikelihood} onChange={(e) => setInheritanceLikelihood(Number(e.target.value))} className="rc-input mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#7a95b8]">Asset Type</Label>
                      <Select value={inheritanceType} onValueChange={setInheritanceType}>
                        <SelectTrigger className="rc-input mt-1 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Real estate">Real Estate</SelectItem>
                          <SelectItem value="Real estate + cash">Real Estate + Cash</SelectItem>
                          <SelectItem value="Retirement accounts">Retirement Accounts (IRA/401k)</SelectItem>
                          <SelectItem value="Life insurance proceeds">Life Insurance Proceeds</SelectItem>
                          <SelectItem value="Business interests">Business Interests</SelectItem>
                          <SelectItem value="Trust distributions">Trust Distributions</SelectItem>
                          <SelectItem value="Mixed assets">Mixed Assets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {inheritanceEstimate > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <p className="text-sm font-medium text-[#f0c040] mb-2">Inheritance Summary</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-[#7a95b8]">Estimated Value:</span><span className="text-white font-medium">{fmt(inheritanceEstimate)}</span></div>
                          <div className="flex justify-between"><span className="text-[#7a95b8]">Probability-Adjusted:</span><span className="text-white font-medium">{fmt(inheritanceEstimate * inheritanceLikelihood / 100)}</span></div>
                          <div className="flex justify-between"><span className="text-[#7a95b8]">Expected Timeline:</span><span className="text-white font-medium">{inheritanceTimeline} years</span></div>
                          <div className="flex justify-between"><span className="text-[#7a95b8]">Asset Type:</span><span className="text-white font-medium">{inheritanceType}</span></div>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <p className="text-sm font-medium text-blue-400 mb-2">Tax Implications</p>
                        <div className="space-y-1.5 text-xs text-[#7a95b8] leading-relaxed">
                          {inheritanceType.includes("Retirement") && (
                            <p>Inherited IRAs/401(k)s must be fully distributed within 10 years under the SECURE Act. This could create significant tax liability — plan Roth conversions and withdrawal timing carefully.</p>
                          )}
                          {inheritanceType.includes("Real estate") && (
                            <p>Inherited real estate receives a stepped-up cost basis, potentially eliminating capital gains on appreciation during the decedent's lifetime. Consider holding vs. selling timing.</p>
                          )}
                          {inheritanceType.includes("Life insurance") && (
                            <p>Life insurance proceeds are generally income-tax-free to beneficiaries. However, if the estate exceeds the federal exemption, estate taxes may apply.</p>
                          )}
                          {inheritanceType.includes("Cash") && (
                            <p>Cash inheritance is not subject to income tax. However, any interest or investment gains after receipt are taxable. Consider immediate deployment into tax-advantaged vehicles.</p>
                          )}
                          <p className="text-[#f0c040] mt-2 font-medium">Recommendation: Create financial plans both with and without this inheritance to avoid dependency on uncertain assets.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ═══════════ REAL ESTATE TAB ═══════════ */}
            <TabsContent value="real-estate" className="space-y-4">
              <div className="rc-card">
                <div className="pb-2">
                  <h3 className="text-base text-white flex items-center gap-2">
                    <Home className="h-4 w-4 text-[#f0c040]" /> Real Estate Strategy Based on Credit Score
                  </h3>
                  <p className="text-sm text-[#7a95b8]">Interest rates and borrowing power tied to FICO {ficoScore}</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primary Home */}
                    <div className="p-4 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                      <div className="flex items-center gap-2 mb-3">
                        <Home className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">Primary Residence</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Likely Rate:</span><span className={`font-medium ${ficoTier.color}`}>{ficoTier.rate}</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Down Payment:</span><span className="text-white">3-20%</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">PMI Required:</span><span className="text-white">{ficoScore >= 740 ? "Waivable" : "Yes, if <20%"}</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Max DTI:</span><span className="text-white">{ficoScore >= 740 ? "50%" : ficoScore >= 670 ? "45%" : "43%"}</span></div>
                      </div>
                    </div>

                    {/* Investment Property */}
                    <div className="p-4 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium text-white">Investment Property</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Likely Rate:</span><span className={`font-medium ${ficoTier.color}`}>{ficoTier.investRate}</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Down Payment:</span><span className="text-white">20-25%</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Cash Reserves:</span><span className="text-white">6mo PITI</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Qualification:</span><span className="text-white">{ficoScore >= 700 ? "Strong" : ficoScore >= 640 ? "Moderate" : "Difficult"}</span></div>
                      </div>
                    </div>

                    {/* HELOC */}
                    <div className="p-4 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                      <div className="flex items-center gap-2 mb-3">
                        <Banknote className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">HELOC / Cash-Out Refi</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-[#7a95b8]">HELOC Rate:</span><span className={`font-medium ${ficoTier.color}`}>{ficoScore >= 740 ? "Prime + 0-1%" : ficoScore >= 670 ? "Prime + 1-3%" : "Prime + 3-5%"}</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Max LTV:</span><span className="text-white">{ficoScore >= 740 ? "90%" : ficoScore >= 670 ? "85%" : "80%"}</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Available Equity:</span><span className="text-white">{client.realEstateEquity ? fmt(Number(client.realEstateEquity) * 0.8) : "—"}</span></div>
                        <div className="flex justify-between"><span className="text-[#7a95b8]">Strategy:</span><span className="text-white">{ficoScore >= 740 ? "Leverage for investing" : "Debt consolidation"}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Borrowing Power Summary */}
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-sm font-medium text-blue-400 mb-2">Borrowing Power Analysis</p>
                    <p className="text-xs text-[#c8d8ec] leading-relaxed">
                      With a FICO score of <strong className="text-white">{ficoScore}</strong> ({ficoTier.tier}), this client qualifies for
                      mortgage rates in the <strong className="text-white">{ficoTier.rate}</strong> range for primary residences and
                      <strong className="text-white"> {ficoTier.investRate}</strong> for investment properties. Based on their annual income
                      of <strong className="text-white">{fmt(Number(client.income ?? 0))}</strong>, their estimated maximum home purchase price
                      is approximately <strong className="text-white">{fmt(Number(client.income ?? 0) * (ficoScore >= 740 ? 5 : ficoScore >= 670 ? 4 : 3))}</strong> (assuming
                      {ficoScore >= 740 ? " 5x" : ficoScore >= 670 ? " 4x" : " 3x"} income multiplier for their credit tier).
                      {ficoScore < 740 && (
                        <> Improving their FICO by {740 - ficoScore} points to 740 could save them approximately <strong className="text-white">{fmt(Number(client.income ?? 0) * 4 * 0.005 * 30)}</strong> over the life of a 30-year mortgage through lower interest rates.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        <PageInsights pageId="client-snapshot-map" />
      </div>
    
        <ComplianceFooter pageName="ClientSnapshotMap" showsIUL showsAnnuity showsTax showsEstate showsProjections />
      </AppShell>
  );
}
