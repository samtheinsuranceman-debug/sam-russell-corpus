// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/NumberInput";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";
import {
  Home,
  DollarSign,
  TrendingUp,
  Calculator,
  Shield,
  AlertTriangle,
  Wallet,
  Info,
  Recycle,
  Zap,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Building,
  BarChart3,
  Table2,
  Eye,
  Download,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TimeMachineToggle, useTimeMachine } from "@/components/TimeMachineToggle";
import { TimeMachineInlineDisclaimer } from "@/components/TimeMachineInlineDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtM = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : fmt(n);

const TM_TOOLTIP = "Time Machine values represent a hypothetical pre-existing account large enough that, when credited at AG 49-compliant rates (0\u20137.5%), it produces the same dollar interest credit that actual 30-year historical index returns would have generated. No AG 49 laws are violated.";

const HELOC_RATES = [{ value: "0", label: "0% \u2014 Pay back within 30 days", rate: 0 },
,
  { value: "0.5", label: "0.5%", rate: 0.005 },
,
  { value: "1", label: "1.0%", rate: 0.01 },
,
  { value: "1.5", label: "1.5%", rate: 0.015 },
,
  { value: "2", label: "2.0%", rate: 0.02 }
];

const POLICY_RETURN = 0.074;
const MAX_HOUSES = 150;
const PROJECTION_YEARS = 50;

const PROPERTY_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#a855f7",
  "#10b981", "#6366f1", "#eab308", "#e11d48", "#7c3aed",
  "#d946ef", "#0d9488", "#ea580c", "#0891b2", "#9333ea",
];

interface PropertyData {
  id: number;
  name: string;
  homeValue: number;
  mortgageBalance: number;
  equityPct: number;
  helocRateKey: string;
}

interface PropertyProjection {
  propertyId: number;
  propertyName: string;
  years: Array<{
    year: number;
    accountValue: number;
    interestCredit: number;
    helocCost: number;
    cumulativeIncome: number;
    phase: "building" | "income";
  }>;
}

function computeProjection(
  helocAmount: number,
  helocRateDecimal: number,
  totalYears: number
): PropertyProjection["years"] {
  const years: PropertyProjection["years"] = [];
  let av = 0;
  let cumulativeIncome = 0;

  for (let y = 1; y <= 5; y++) {
    av += helocAmount;
    const interest = av * POLICY_RETURN;
    av += interest;
    const helocCost = y === 1
      ? helocAmount * helocRateDecimal
      : (helocRateDecimal > 0 ? helocAmount * helocRateDecimal * (7 / 365) : 0);

    years.push({
      year: y,
      accountValue: Math.round(av),
      interestCredit: Math.round(interest),
      helocCost: Math.round(helocCost),
      cumulativeIncome: 0,
      phase: "building",
    });
  }

  for (let y = 6; y <= totalYears; y++) {
    const interest = av * POLICY_RETURN;
    av += interest;
    const income = Math.round(interest);
    cumulativeIncome += income;

    years.push({
      year: y,
      accountValue: Math.round(av),
      interestCredit: income,
      helocCost: 0,
      cumulativeIncome,
      phase: "income",
    });
  }

  return years;
}

export default function HouseRecyclingStrategy() {
  const { data: clientData } = useClientData();

  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const clients = clientsQuery.data ?? [];
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState(55);
  const [totalNetWorth, setTotalNetWorth] = useState(2_500_000);
  const [annualIncome, setAnnualIncome] = useState(150_000);
  const [retirementAge, setRetirementAge] = useState(65);
  const [desiredTaxFreeIncome, setDesiredTaxFreeIncome] = useState(110_000);

  const [nextId, setNextId] = useState(2);
  const [properties, setProperties] = useState<PropertyData[]>([
    {
      id: 1,
      name: "Primary Residence",
      homeValue: 1_000_000,
      mortgageBalance: 400_000,
      equityPct: 40,
      helocRateKey: "0",
    },
  ]);

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Set<number>>(new Set());
  const [showUltraGraph, setShowUltraGraph] = useState(true);
  const [showMasterSpreadsheet, setShowMasterSpreadsheet] = useState(false);
  const [showIndividualGraphs, setShowIndividualGraphs] = useState(true);

  const tm = useTimeMachine();

  const addProperty = useCallback(() => {
    if (properties.length >= MAX_HOUSES) {
      toast.error(`Maximum ${MAX_HOUSES} properties allowed.`);
      return;
    }
    const id = nextId;
    setNextId(prev => prev + 1);
    setProperties(prev => [
      ...prev,
      {
        id,
        name: `Property ${prev.length + 1}`,
        homeValue: 500_000,
        mortgageBalance: 200_000,
        equityPct: 40,
        helocRateKey: "0",
      },
    ]);
    toast.success(`Property ${properties.length + 1} added.`);
  }, [properties.length, nextId]);

  const removeProperty = useCallback((id: number) => {
    if (properties.length <= 1) {
      toast.error("You must keep at least one property.");
      return;
    }
    setProperties(prev => prev.filter((p) => p.id !== id));
    toast.info("Property removed.");
  }, [properties.length]);

  const updateProperty = useCallback((id: number, field: keyof PropertyData, value: any) => {
    setProperties(prev => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const propertyProjections: PropertyProjection[] = useMemo(() => {
    return properties.map((prop) => {
      const equity = prop.homeValue - prop.mortgageBalance;
      const helocAmount = Math.round(equity * (prop.equityPct / 100));
      const helocRate = HELOC_RATES.find((r) => r.value === prop.helocRateKey)?.rate ?? 0;
      const years = computeProjection(helocAmount, helocRate, PROJECTION_YEARS);
      return {
        propertyId: prop.id,
        propertyName: prop.name,
        years,
      };
    });
  }, [properties]);

  const totalAnnualPremium = useMemo(() => {
    return properties.reduce((s, p) => {
      const equity = p.homeValue - p.mortgageBalance;
      return s + Math.round(equity * (p.equityPct / 100));
    }, 0);
  }, [properties]);

  const tmOverlay = useMemo(() => {
    if (!tm.enabled || tm.selectedOptions.length === 0) return null;
    return tm.generateOverlay(
      { annualPremium: totalAnnualPremium, fundingYears: 5 },
      age,
      PROJECTION_YEARS,
    );
  }, [tm.enabled, tm.selectedOptions, tm.startYear, totalAnnualPremium, age]);

  const masterData = useMemo(() => {
    const rows: Array<{
      year: number;
      age: number;
      totalAccountValue: number;
      totalInterestCredit: number;
      totalCumulativeIncome: number;
      tmAccountValue?: number;
      tmInterestCredit?: number;
      tmSurrenderValue?: number;
      perProperty: Record<number, { accountValue: number; interestCredit: number; cumulativeIncome: number }>;
    }> = [];

    for (let y = 1; y <= PROJECTION_YEARS; y++) {
      let totalAV = 0;
      let totalInterest = 0;
      let totalCumIncome = 0;
      const perProp: Record<number, { accountValue: number; interestCredit: number; cumulativeIncome: number }> = {};

      for (const proj of propertyProjections) {
        const yearData = proj.years.find((yr) => yr.year === y);
        if (yearData) {
          totalAV += yearData.accountValue;
          totalInterest += yearData.interestCredit;
          totalCumIncome += yearData.cumulativeIncome;
          perProp[proj.propertyId] = {
            accountValue: yearData.accountValue,
            interestCredit: yearData.interestCredit,
            cumulativeIncome: yearData.cumulativeIncome,
          };
        }
      }

      const tmRow = tmOverlay?.[y - 1];

      rows.push({
        year: y,
        age: age + y,
        totalAccountValue: totalAV,
        totalInterestCredit: totalInterest,
        totalCumulativeIncome: totalCumIncome,
        tmAccountValue: tmRow?.accountValue,
        tmInterestCredit: tmRow?.interestCredit,
        tmSurrenderValue: tmRow?.surrenderValue,
        perProperty: perProp,
      });
    }

    return rows;
  }, [propertyProjections, age, tmOverlay]);

  const ultraChartData = useMemo(() => {
    return masterData.map((row) => {
      const entry: Record<string, any> = {
        year: `Yr ${row.year}`,
        yearNum: row.year,
        age: row.age,
        totalAccountValue: row.totalAccountValue,
        totalAnnualIncome: row.year > 5 ? row.totalInterestCredit : 0,
        totalCumulativeIncome: row.totalCumulativeIncome,
        tmAccountValue: row.tmAccountValue,
        tmInterestCredit: row.tmInterestCredit,
      };
      for (const proj of propertyProjections) {
        const pd = row.perProperty[proj.propertyId];
        entry[`income_${proj.propertyId}`] = pd && row.year > 5 ? pd.interestCredit : 0;
        entry[`av_${proj.propertyId}`] = pd ? pd.accountValue : 0;
      }
      return entry;
    });
  }, [masterData, propertyProjections]);

  const totalFiveYearPremiums = useMemo(() => {
    return properties.reduce((sum, p) => {
      const equity = p.homeValue - p.mortgageBalance;
      const helocAmount = Math.round(equity * (p.equityPct / 100));
      return sum + helocAmount * 5;
    }, 0);
  }, [properties]);

  const maxPremiumAllowed = totalNetWorth * 0.60;
  const isOverLimit = totalFiveYearPremiums > maxPremiumAllowed;
  const suggestedMaxPerYear = Math.floor(maxPremiumAllowed / 5);

  const handleCalculate = useCallback(() => {
    if (isOverLimit) {
      setShowDisclaimer(true);
      return;
    }
    setShowResults(true);
    toast.success("Projections calculated for all properties \u2014 scroll down to see your results.");
  }, [isOverLimit]);

  useEffect(() => {
    if (selectedClient) {
      setFullName(selectedClient.name || "");
      if ((selectedClient as any).age) setAge((selectedClient as any).age);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (clientData) {
      if (clientData.clientName) setFullName(clientData.clientName);
      if (clientData.age) setAge(clientData.age);
      if (clientData.annualIncome) setAnnualIncome(clientData.annualIncome);
      if (clientData.retirementAge) setRetirementAge(clientData.retirementAge);
    }
  }, [clientData]);

  const togglePropertyExpand = (id: number) => {
    setExpandedProperties(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCSV = useCallback(() => {
    const headers = [
      "Year", "Age", "Total Account Value", "Total Annual Income", "Total Cumulative Income",
      ...properties.map((p) => `${p.name} AV`),
      ...properties.map((p) => `${p.name} Income`),
      ...(tm.enabled ? ["TM Account Value", "TM Interest Credit", "TM Surrender Value"] : []),
    ];
    const csvRows = [headers.join(",")];

    for (const row of masterData) {
      const vals = [
        row.year,
        row.age,
        row.totalAccountValue,
        row.totalInterestCredit,
        row.totalCumulativeIncome,
        ...properties.map((p) => row.perProperty[p.id]?.accountValue ?? 0),
        ...properties.map((p) => row.perProperty[p.id]?.interestCredit ?? 0),
        ...(tm.enabled ? [row.tmAccountValue ?? "", row.tmInterestCredit ?? "", row.tmSurrenderValue ?? ""] : []),
      ];
      csvRows.push(vals.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `house-recycling-${properties.length}-properties-50yr.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully.");
  }, [masterData, properties, tm.enabled]);

  /** Custom tooltip for dual-illustration charts */
  const DualChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0b1628] border border-[#12233e] rounded-lg p-3 shadow-lg max-w-xs">
        <p className="font-semibold text-sm text-white mb-2">{typeof label === "number" ? `Year ${label} (Age ${age + label})` : label}</p>
        {payload.map((entry) => {
          const isGold = entry.dataKey?.startsWith("tm");
          return (
            <div key={entry.dataKey} className="flex justify-between gap-4 text-xs mb-1">
              <span style={{ color: entry.color }}>{entry.name}</span>
              <span className="font-mono font-medium" style={{ color: isGold ? "#f59e0b" : "#c8d8ec" }}>{fmt(entry.value)}</span>
            </div>
          );
        })}
        {tm.enabled && (
          <p className="text-[10px] text-[#7a95b8] mt-2 border-t border-[#12233e] pt-2">{TM_TOOLTIP}</p>
        )}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="HouseRecyclingStrategy" />

        {/* ─── Rabbu.com Market Data Integration ─── */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Validate Your Numbers with Real Market Data — <a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">Rabbu.com</a></h3>
              <p className="text-sm text-gray-300 mb-3"><a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Rabbu.com</a> is the leading Airbnb marketplace and analytics platform used by over 650,000 real estate investors. Before committing to any property acquisition, validate your rental income assumptions with real market data.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a href="https://www.rabbu.com/airbnb-calculator" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">Airbnb Calculator</div>
                  <div className="text-xs text-gray-400">Enter any address → get revenue estimates</div>
                </a>
                <a href="https://www.rabbu.com/market-data" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">Market Data</div>
                  <div className="text-xs text-gray-400">Occupancy, ADR & revenue by ZIP code</div>
                </a>
                <a href="https://www.rabbu.com/str-spreadsheet" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">STR Spreadsheet</div>
                  <div className="text-xs text-gray-400">Free analysis template for STR investments</div>
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-3"><strong className="text-emerald-400">Pro Tip:</strong> Use Rabbu's Airbnb Calculator to verify the rental income projections in this model. Monthly revenue typically ranges from $1,300/mo (studios) to $10,000+/mo (6+ bedrooms) depending on market and property type.</p>
            </div>
          </div>
        </div>

        <ExecutiveSummary
          pageTitle="House Recycling Strategy"
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
        <GoalsAccelerator pageName="House Recycling Strategy" pageContext="House Recycling Strategy — real estate strategy modeling with projections and scenario analysis" />
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
        {/* ─── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-[#22c55e]/12 border border-[#22c55e]/20 flex items-center justify-center">
                <Recycle size={20} className="text-[#22c55e]" />
              </div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                House Recycling Strategy
              </h1>
            </div>
            <p className="text-sm text-[#7a95b8] ml-[52px]">
              Turn stagnant home equity into tax-free retirement income. Add up to {MAX_HOUSES} properties.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {clients.length > 0 && (
              <>
                <FactFinderBadge className="mb-4" />
                <Select
                  value={selectedClientId?.toString() ?? "none"}
                  onValueChange={(v) => setSelectedClientId(v === "none" ? null : Number(v))}
                >
                  <SelectTrigger className="w-[200px] bg-[#0b1628] border-[#12233e]">
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* ─── Educational Overview ────────────────────────────────────── */}
        <Card className="bg-gradient-to-br from-[#0b1628] to-[#0f1e35] border-[#12233e]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Info size={18} className="text-[#22c55e]" />
              What Is the House Recycling Strategy?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#c8d8ec] leading-relaxed">
              Most homeowners have hundreds of thousands of dollars \u2014 sometimes millions \u2014 sitting in their home
              equity doing absolutely nothing. It earns no interest. It produces no income. It just sits there.
              The House Recycling Strategy activates that stagnant capital by cycling it through a properly
              structured cash value life insurance policy (Indexed Universal Life), creating a permanent
              tax-free income stream that grows every single year for the rest of your life.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#060f20] border border-[#12233e]">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-[#22c55e]" />
                  <span className="text-sm font-semibold text-white">Tax Diversification</span>
                </div>
                <p className="text-xs text-[#7a95b8] leading-relaxed">
                  Policy loans are tax-free. Interest credits are tax-free. The death benefit passes income-tax-free
                  to your beneficiaries. This is a legal, IRS-approved tax diversification strategy.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#060f20] border border-[#12233e]">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-[#22c55e]" />
                  <span className="text-sm font-semibold text-white">Asset Diversification</span>
                </div>
                <p className="text-xs text-[#7a95b8] leading-relaxed">
                  Your home equity sits idle. This model moves it into a compounding vehicle that produces
                  income every year. It is an asset diversification model that no one else is doing \u2014 and that
                  does not mean it does not work. It means you have more knowledge and wisdom than your friends.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#060f20] border border-[#12233e]">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-[#22c55e]" />
                  <span className="text-sm font-semibold text-white">NAIC AG49 Rates</span>
                </div>
                <p className="text-xs text-[#7a95b8] leading-relaxed">
                  Historical index averages are multiple times higher than the maximum illustrated rates
                  controlled and enforced by NAIC AG49. We illustrate a conservative 7.4% \u2014 well within
                  regulatory limits \u2014 while showing HELOC costs between 0-4%.
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#22c55e]/8 border border-[#22c55e]/15">
              <p className="text-xs text-[#c8d8ec] leading-relaxed">
                <strong className="text-[#22c55e]">How the 0% HELOC works:</strong> As long as you pay the home equity
                line of credit back within 30 days, you are assessed no interest at all. The money goes into the life
                insurance policy, stays for approximately one week, then a loan is taken from the policy to pay the bank
                back \u2014 before they even have a chance to charge one month of interest. This is how the 0% loan option works.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Fact Finder ────────────────────────────────────────────── */}
        <Card className="bg-[#0b1628] border-[#12233e]">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Calculator size={18} className="text-[#22c55e]" />
              Your Financial Profile
            </CardTitle>
            <CardDescription className="text-[#7a95b8]">
              Enter your basic information. Properties are configured below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#7a95b8] text-xs">Full Name</Label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060f20] border border-[#12233e] text-white text-sm focus:border-[#22c55e] focus:outline-none"
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#7a95b8] text-xs">Current Age</Label>
                <NumberInput value={age} onChange={setAge} min={25} max={85} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#7a95b8] text-xs">Total Net Worth</Label>
                <NumberInput value={totalNetWorth} onChange={setTotalNetWorth} min={100_000} max={100_000_000} step={50_000} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#7a95b8] text-xs">Annual Income</Label>
                <NumberInput value={annualIncome} onChange={setAnnualIncome} min={0} max={10_000_000} step={10_000} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#7a95b8] text-xs">Target Retirement Age</Label>
                <NumberInput value={retirementAge} onChange={setRetirementAge} min={50} max={90} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#7a95b8] text-xs">Desired Tax-Free Income</Label>
                <NumberInput value={desiredTaxFreeIncome} onChange={setDesiredTaxFreeIncome} min={0} max={5_000_000} step={10_000} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Properties Section ─────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building size={18} className="text-[#22c55e]" />
                Properties ({properties.length} of {MAX_HOUSES})
              </h2>
              <p className="text-xs text-[#7a95b8] mt-1">
                Add up to {MAX_HOUSES} properties. Each one creates its own IUL policy with independent compounding.
              </p>
            </div>
            <Button
              onClick={addProperty}
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white gap-2"
              disabled={properties.length >= MAX_HOUSES}
            >
              <Plus size={16} />
              Add House
            </Button>
          </div>

          {properties.map((prop, idx) => {
            const equity = prop.homeValue - prop.mortgageBalance;
            const helocAmount = Math.round(equity * (prop.equityPct / 100));
            const color = PROPERTY_COLORS[idx % PROPERTY_COLORS.length];

            return (
              <Card key={prop.id} className="bg-[#0b1628] border-[#12233e]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                      >
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={prop.name}
                        onChange={(e) => updateProperty(prop.id, "name", e.target.value)}
                        className="bg-transparent border-none text-white font-semibold text-base focus:outline-none focus:ring-1 focus:ring-[#22c55e] rounded px-1 -ml-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#7a95b8]">HELOC: {fmt(helocAmount)}/yr</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePropertyExpand(prop.id)}
                        className="text-[#7a95b8] hover:text-white"
                      >
                        {expandedProperties.has(prop.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </Button>
                      {properties.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProperty(prop.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {(expandedProperties.has(prop.id) || properties.length === 1) && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#7a95b8] text-xs">Home Value</Label>
                        <NumberInput
                          value={prop.homeValue}
                          onChange={(v) => updateProperty(prop.id, "homeValue", v)}
                          min={50_000} max={50_000_000} step={25_000}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#7a95b8] text-xs">Mortgage Balance</Label>
                        <NumberInput
                          value={prop.mortgageBalance}
                          onChange={(v) => updateProperty(prop.id, "mortgageBalance", v)}
                          min={0} max={prop.homeValue} step={25_000}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#7a95b8] text-xs">Equity to Use ({prop.equityPct}%)</Label>
                        <input
                          type="range"
                          min={25} max={60} value={prop.equityPct}
                          onChange={(e) => updateProperty(prop.id, "equityPct", Number(e.target.value))}
                          className="w-full accent-[#22c55e]"
                        />
                        <div className="flex justify-between text-xs text-[#7a95b8]">
                          <span>25%</span>
                          <span className="text-white font-medium">{fmt(helocAmount)}</span>
                          <span>60%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#7a95b8] text-xs">HELOC Interest Rate</Label>
                        <Select
                          value={prop.helocRateKey}
                          onValueChange={(v) => updateProperty(prop.id, "helocRateKey", v)}
                        >
                          <SelectTrigger className="bg-[#060f20] border-[#12233e]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HELOC_RATES.map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[#7a95b8]">
                      <span>Home Equity: <strong className="text-white">{fmt(equity)}</strong></span>
                      <span>Annual HELOC Amount: <strong className="text-[#22c55e]">{fmt(helocAmount)}</strong></span>
                      <span>5-Year Total: <strong className="text-white">{fmt(helocAmount * 5)}</strong></span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ─── Summary & Calculate ────────────────────────────────────── */}
        <Card className="bg-gradient-to-r from-[#0b1628] to-[#0f1e35] border-[#22c55e]/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-[#060f20] border border-[#12233e]">
                <div className="text-xs text-[#7a95b8]">Total Properties</div>
                <div className="text-2xl font-bold text-white">{properties.length}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#060f20] border border-[#12233e]">
                <div className="text-xs text-[#7a95b8]">Total Annual HELOC</div>
                <div className="text-2xl font-bold text-[#22c55e]">
                  {fmt(totalAnnualPremium)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#060f20] border border-[#12233e]">
                <div className="text-xs text-[#7a95b8]">5-Year Total Premiums</div>
                <div className={`text-2xl font-bold ${isOverLimit ? "text-red-400" : "text-white"}`}>
                  {fmt(totalFiveYearPremiums)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#060f20] border border-[#12233e]">
                <div className="text-xs text-[#7a95b8]">60% Net Worth Limit</div>
                <div className="text-2xl font-bold text-white">{fmt(maxPremiumAllowed)}</div>
              </div>
            </div>
            {isOverLimit && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <p className="text-sm text-amber-300 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <strong>Warning:</strong> Your total 5-year premiums ({fmt(totalFiveYearPremiums)}) exceed 60% of your net worth ({fmt(maxPremiumAllowed)}).
                  Suggested max total per year: {fmt(suggestedMaxPerYear)}.
                </p>
              </div>
            )}
            <Button
              onClick={handleCalculate}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white h-12 text-base font-semibold gap-2"
            >
              <Calculator size={18} />
              Calculate {properties.length} {properties.length === 1 ? "Property" : "Properties"} \u2014 50-Year Projection
            </Button>
          </CardContent>
        </Card>

        {/* ─── Net Worth Disclaimer Dialog ─────────────────────────────── */}
        <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
          <DialogContent className="bg-[#0b1628] border-[#12233e]">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                Premium Limit Exceeded
              </DialogTitle>
              <DialogDescription className="text-[#7a95b8]">
                To maintain policy compliance and financial prudence, the total premiums paid over the first 5 years
                across ALL properties must remain below 60% of your total net worth.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#060f20] border border-[#12233e]">
                  <div className="text-xs text-[#7a95b8]">Your 5-Year Premiums</div>
                  <div className="text-lg font-bold text-red-400">{fmt(totalFiveYearPremiums)}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#060f20] border border-[#12233e]">
                  <div className="text-xs text-[#7a95b8]">60% Net Worth Limit</div>
                  <div className="text-lg font-bold text-[#22c55e]">{fmt(maxPremiumAllowed)}</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-300">
                  <strong>Suggested maximum total HELOC per year across all properties:</strong> {fmt(suggestedMaxPerYear)}
                </p>
                <p className="text-xs text-amber-300/70 mt-1">
                  This keeps your total 5-year premiums at or below {fmt(maxPremiumAllowed)}.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisclaimer(false)} className="border-[#12233e]">
                Adjust My Numbers
              </Button>
              <Button
                onClick={() => {
                  setShowDisclaimer(false);
                  setShowResults(true);
                  toast.info("Projection shown \u2014 note the premium limit warning.");
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Show Results Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── RESULTS SECTION ────────────────────────────────────────── */}
        {showResults && (
          <>
            {/* ─── Time Machine Toggle ──────────────────────────────────── */}
            <TimeMachineToggle {...tm.toggleProps} />

            {/* ── Time Machine Summary Cards ── */}
            {tm.enabled && tmOverlay && tmOverlay.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-[#0b1628] border-amber-800/40">
                  <CardContent className="pt-4">
                    <p className="text-xs text-amber-400/80 flex items-center gap-1"><Zap className="w-3 h-3" /> TM Final Account Value</p>
                    <p className="text-lg font-bold text-amber-400">{fmtM(tmOverlay[tmOverlay.length - 1].accountValue)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#0b1628] border-amber-800/40">
                  <CardContent className="pt-4">
                    <p className="text-xs text-amber-400/80 flex items-center gap-1"><Zap className="w-3 h-3" /> TM Surrender Value</p>
                    <p className="text-lg font-bold text-amber-400">{fmtM(tmOverlay[tmOverlay.length - 1].surrenderValue)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#0b1628] border-amber-800/40">
                  <CardContent className="pt-4">
                    <p className="text-xs text-amber-400/80 flex items-center gap-1"><Zap className="w-3 h-3" /> TM Avg Rate</p>
                    <p className="text-lg font-bold text-amber-400">
                      {(tmOverlay.reduce((s, r) => s + r.creditingRate, 0) / tmOverlay.length * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[#0b1628] border-amber-800/40">
                  <CardContent className="pt-4">
                    <p className="text-xs text-amber-400/80 flex items-center gap-1"><Zap className="w-3 h-3" /> TM vs Standard</p>
                    <p className="text-lg font-bold text-amber-400">
                      {masterData.length > 0 && masterData[masterData.length - 1].totalAccountValue > 0
                        ? `+${(((tmOverlay[tmOverlay.length - 1].accountValue / masterData[masterData.length - 1].totalAccountValue) - 1) * 100).toFixed(0)}%`
                        : "\u2014"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── View Controls ──────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={showUltraGraph ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUltraGraph(!showUltraGraph)}
                className={showUltraGraph ? "bg-[#22c55e] hover:bg-[#16a34a] text-white" : "border-[#12233e] text-[#7a95b8]"}
              >
                <BarChart3 size={14} className="mr-1" /> Ultra Graph
              </Button>
              <Button
                variant={showIndividualGraphs ? "default" : "outline"}
                size="sm"
                onClick={() => setShowIndividualGraphs(!showIndividualGraphs)}
                className={showIndividualGraphs ? "bg-[#3b82f6] hover:bg-[#2563eb] text-white" : "border-[#12233e] text-[#7a95b8]"}
              >
                <Eye size={14} className="mr-1" /> Individual Graphs
              </Button>
              <Button
                variant={showMasterSpreadsheet ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMasterSpreadsheet(!showMasterSpreadsheet)}
                className={showMasterSpreadsheet ? "bg-[#f59e0b] hover:bg-[#d97706] text-white" : "border-[#12233e] text-[#7a95b8]"}
              >
                <Table2 size={14} className="mr-1" /> Master Spreadsheet
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <ExportToSlides
                  toolName="House Recycling Strategy"
                  getSections={() => [
                    {
                      title: "Client Profile",
                      items: [
                        { label: "Name", value: fullName || "N/A" },
                        { label: "Age", value: age.toString() },
                        { label: "Net Worth", value: fmt(totalNetWorth) },
                        { label: "Annual Income", value: fmt(annualIncome) },
                        { label: "Retirement Age", value: retirementAge.toString() },
                        { label: "Desired Tax-Free Income", value: fmt(desiredTaxFreeIncome) }
                      ]
                    },
                    {
                      title: "Properties Strategy",
                      items: [
                        { label: "Total Properties", value: properties.length.toString() },
                        { label: "Total Annual HELOC", value: fmt(totalAnnualPremium) },
                        { label: "5-Year Total Premiums", value: fmt(totalFiveYearPremiums) },
                        { label: "60% Net Worth Limit", value: fmt(maxPremiumAllowed) }
                      ]
                    },
                    {
                      title: "Projection Results (Year 50)",
                      items: masterData.length > 0 ? [
                        { label: "Total Account Value", value: fmt(masterData[masterData.length - 1].totalAccountValue) },
                        { label: "Total Annual Income", value: fmt(masterData[masterData.length - 1].totalInterestCredit) },
                        { label: "Total Cumulative Income", value: fmt(masterData[masterData.length - 1].totalCumulativeIncome) }
                      ] : []
                    }
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCSV}
                  className="border-[#12233e] text-[#7a95b8] hover:text-white"
                >
                  <Download size={14} className="mr-1" /> Export CSV
                </Button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── ULTRA GRAPH \u2014 All Properties Combined ──────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {showUltraGraph && (
              <Card className="bg-[#0b1628] border-[#22c55e]/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <BarChart3 size={20} className="text-[#22c55e]" />
                      Ultra Graph \u2014 All {properties.length} Properties Combined (50 Years)
                    </CardTitle>
                    {tm.enabled && (
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger><Info className="w-4 h-4 text-amber-400" /></TooltipTrigger>
                          <TooltipContent className="max-w-sm"><p className="text-xs">{TM_TOOLTIP}</p></TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <CardDescription className="text-[#7a95b8]">
                    Total account values and total annual tax-free income across every property, every year.
                    {tm.enabled && <span className="text-amber-400"> Gold line = Time Machine historical overlay.</span>}
                  </CardDescription>
                  {tm.enabled && (
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-xs text-[#7a95b8]"><span className="w-3 h-1 rounded bg-[#22c55e] inline-block" /> Standard (Green)</span>
                      <span className="flex items-center gap-1.5 text-xs text-[#7a95b8]"><span className="w-3 h-1 rounded bg-[#f0c040] inline-block" /> Cumulative Income (Yellow)</span>
                      <span className="flex items-center gap-1.5 text-xs text-[#7a95b8]"><span className="w-3 h-1 rounded bg-[#f59e0b] inline-block" /> Time Machine (Gold)</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Account Value Ultra Chart */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <TrendingUp size={14} className="text-[#22c55e]" />
                      Combined Account Value Growth
                    </h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={ultraChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis
                            dataKey="yearNum"
                            tick={{ fill: "#7a95b8", fontSize: 10 }}
                            tickFormatter={(v: number) => v % 5 === 0 ? `Yr ${v}` : ""}
                          />
                          <YAxis
                            tick={{ fill: "#7a95b8", fontSize: 10 }}
                            tickFormatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`}
                          />
                          <Tooltip content={<DualChartTooltip />} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="totalAccountValue"
                            name="Total Account Value"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="totalCumulativeIncome"
                            name="Cumulative Income"
                            stroke="#f0c040"
                            fill="#f0c040"
                            fillOpacity={0.08}
                            strokeWidth={2}
                          />
                          {tm.enabled && (
                            <Area
                              type="monotone"
                              dataKey="tmAccountValue"
                              name="Time Machine: Historical AV"
                              stroke="#f59e0b"
                              fill="#f59e0b"
                              fillOpacity={0.10}
                              strokeWidth={2.5}
                              strokeDasharray="6 3"
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <Separator className="bg-[#12233e]" />

                  {/* Annual Income Ultra Chart \u2014 Stacked by Property */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <DollarSign size={14} className="text-[#22c55e]" />
                      Annual Tax-Free Income by Property (Years 2-50)
                      {tm.enabled && <span className="text-amber-400 text-xs ml-2">+ Time Machine overlay</span>}
                    </h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={ultraChartData.filter((d) => d.yearNum >= 2)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis
                            dataKey="yearNum"
                            tick={{ fill: "#7a95b8", fontSize: 10 }}
                            tickFormatter={(v: number) => v % 5 === 0 ? `Yr ${v}` : ""}
                          />
                          <YAxis
                            tick={{ fill: "#7a95b8", fontSize: 10 }}
                            tickFormatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`}
                          />
                          <Tooltip content={<DualChartTooltip />} />
                          <Legend />
                          {propertyProjections.map((proj, idx) => (
                            <Bar
                              key={proj.propertyId}
                              dataKey={`income_${proj.propertyId}`}
                              name={proj.propertyName}
                              stackId="income"
                              fill={PROPERTY_COLORS[idx % PROPERTY_COLORS.length]}
                              fillOpacity={0.8}
                            />
                          ))}
                          {tm.enabled && (
                            <Line
                              type="monotone"
                              dataKey="tmInterestCredit"
                              name="TM: Historical Interest Credit"
                              stroke="#f59e0b"
                              strokeWidth={2.5}
                              strokeDasharray="6 3"
                              dot={false}
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Ultra Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[10, 20, 30, 40, 50].map((yr) => {
                      const row = masterData.find((r) => r.year === yr);
                      if (!row) return null;
                      return (
                        <div key={yr} className="p-3 rounded-xl bg-[#060f20] border border-[#12233e]">
                          <div className="text-xs text-[#7a95b8]">Year {yr} (Age {row.age})</div>
                          <div className="text-lg font-bold text-white">{fmt(row.totalAccountValue)}</div>
                          <div className="text-sm font-semibold text-[#22c55e]">{fmt(row.totalInterestCredit)}/yr</div>
                          <div className="text-xs text-[#f0c040]">Cum: {fmt(row.totalCumulativeIncome)}</div>
                          {tm.enabled && row.tmAccountValue !== undefined && (
                            <div className="mt-1 pt-1 border-t border-amber-800/30">
                              <div className="text-xs text-amber-400">TM: {fmtM(row.tmAccountValue)}</div>
                              {row.tmInterestCredit !== undefined && (
                                <div className="text-[10px] text-amber-400/70">TM Credit: {fmt(row.tmInterestCredit)}/yr</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── INDIVIDUAL PROPERTY GRAPHS ─────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {showIndividualGraphs && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Home size={18} className="text-[#3b82f6]" />
                  Individual Property Projections
                </h2>
                {propertyProjections.map((proj, idx) => {
                  const color = PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
                  const incomeData = proj.years
                    .filter((y) => y.year >= 2)
                    .map((y) => ({
                      year: y.year,
                      age: age + y.year,
                      income: y.phase === "income" ? y.interestCredit : 0,
                      accountValue: y.accountValue,
                    }));

                  const year5 = proj.years.find((y) => y.year === 5);
                  const year25 = proj.years.find((y) => y.year === 25);
                  const year50 = proj.years.find((y) => y.year === 50);

                  return (
                    <Card key={proj.propertyId} className="bg-[#0b1628] border-[#12233e]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: `${color}30`, border: `1px solid ${color}50` }}
                          >
                            {idx + 1}
                          </div>
                          {proj.propertyName}
                        </CardTitle>
                        <div className="flex gap-4 text-xs text-[#7a95b8]">
                          <span>Yr 5 AV: <strong className="text-white">{fmt(year5?.accountValue ?? 0)}</strong></span>
                          <span>Yr 25 AV: <strong className="text-white">{fmt(year25?.accountValue ?? 0)}</strong></span>
                          <span>Yr 50 AV: <strong className="text-white">{fmt(year50?.accountValue ?? 0)}</strong></span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={incomeData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                              <XAxis
                                dataKey="year"
                                tick={{ fill: "#7a95b8", fontSize: 10 }}
                                tickFormatter={(v: number) => v % 5 === 0 ? `Yr ${v}` : ""}
                              />
                              <YAxis
                                tick={{ fill: "#7a95b8", fontSize: 10 }}
                                tickFormatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`}
                              />
                              <Tooltip
                                contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 12 }}
                                labelStyle={{ color: "#7a95b8" }}
                                labelFormatter={(v: number) => `Year ${v} (Age ${age + v})`}
                                formatter={(value: number, name: string) => [
                                  fmt(value),
                                  name === "income" ? "Tax-Free Income" : "Account Value",
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="accountValue"
                                name="Account Value"
                                stroke={color}
                                fill={color}
                                fillOpacity={0.12}
                                strokeWidth={2}
                              />
                              <Area
                                type="monotone"
                                dataKey="income"
                                name="Tax-Free Income"
                                stroke="#f0c040"
                                fill="#f0c040"
                                fillOpacity={0.08}
                                strokeWidth={1.5}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── MASTER SPREADSHEET ─────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {showMasterSpreadsheet && (
              <Card className="bg-[#0b1628] border-[#f59e0b]/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Table2 size={18} className="text-[#f59e0b]" />
                    Master Spreadsheet \u2014 All Properties, 50 Years
                    {tm.enabled && <span className="text-amber-400 text-xs ml-2">+ Time Machine columns</span>}
                  </CardTitle>
                  <CardDescription className="text-[#7a95b8]">
                    Year-by-year breakdown of every property's account value and tax-free income, plus combined totals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 bg-[#0b1628] z-10">
                        <tr className="border-b-2 border-[#22c55e]/30">
                          <th className="text-left py-2 px-2 text-[#7a95b8] font-medium sticky left-0 bg-[#0b1628]">Year</th>
                          <th className="text-left py-2 px-2 text-[#7a95b8] font-medium">Age</th>
                          {properties.map((p, idx) => (
                            <th
                              key={`av-${p.id}`}
                              className="text-right py-2 px-2 font-medium"
                              style={{ color: PROPERTY_COLORS[idx % PROPERTY_COLORS.length] }}
                            >
                              {p.name} AV
                            </th>
                          ))}
                          {properties.map((p, idx) => (
                            <th
                              key={`inc-${p.id}`}
                              className="text-right py-2 px-2 font-medium"
                              style={{ color: PROPERTY_COLORS[idx % PROPERTY_COLORS.length] }}
                            >
                              {p.name} Income
                            </th>
                          ))}
                          <th className="text-right py-2 px-2 text-[#22c55e] font-bold">TOTAL AV</th>
                          <th className="text-right py-2 px-2 text-[#22c55e] font-bold">TOTAL Income</th>
                          <th className="text-right py-2 px-2 text-[#f0c040] font-bold">Cum. Income</th>
                          {tm.enabled && (
                            <>
                              <th className="text-right py-2 px-2 text-amber-400 font-bold">TM AV</th>
                              <th className="text-right py-2 px-2 text-amber-400 font-bold">TM Credit</th>
                              <th className="text-right py-2 px-2 text-amber-400 font-bold">TM SV</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {masterData.map((row) => (
                          <tr
                            key={row.year}
                            className={`border-b border-[#12233e]/50 hover:bg-[#060f20] ${row.year % 5 === 0 ? "bg-[#060f20]/50" : ""}`}
                          >
                            <td className="py-1.5 px-2 text-white font-medium sticky left-0 bg-[#0b1628]">
                              {row.year}
                            </td>
                            <td className="py-1.5 px-2 text-[#c8d8ec]">{row.age}</td>
                            {properties.map((p) => (
                              <td key={`av-${p.id}`} className="py-1.5 px-2 text-right text-[#c8d8ec]">
                                {fmt(row.perProperty[p.id]?.accountValue ?? 0)}
                              </td>
                            ))}
                            {properties.map((p) => (
                              <td key={`inc-${p.id}`} className="py-1.5 px-2 text-right text-[#c8d8ec]">
                                {row.year > 5 ? fmt(row.perProperty[p.id]?.interestCredit ?? 0) : "\u2014"}
                              </td>
                            ))}
                            <td className="py-1.5 px-2 text-right text-white font-bold">
                              {fmt(row.totalAccountValue)}
                            </td>
                            <td className="py-1.5 px-2 text-right text-[#22c55e] font-bold">
                              {row.year > 5 ? fmt(row.totalInterestCredit) : "\u2014"}
                            </td>
                            <td className="py-1.5 px-2 text-right text-[#f0c040]">
                              {row.totalCumulativeIncome > 0 ? fmt(row.totalCumulativeIncome) : "\u2014"}
                            </td>
                            {tm.enabled && (
                              <>
                                <td className="py-1.5 px-2 text-right text-amber-400 font-medium">
                                  {row.tmAccountValue !== undefined ? fmtM(row.tmAccountValue) : "\u2014"}
                                </td>
                                <td className="py-1.5 px-2 text-right text-amber-400">
                                  {row.tmInterestCredit !== undefined ? fmt(row.tmInterestCredit) : "\u2014"}
                                </td>
                                <td className="py-1.5 px-2 text-right text-amber-400/70">
                                  {row.tmSurrenderValue !== undefined ? fmtM(row.tmSurrenderValue) : "\u2014"}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Tax-Free Loans & Death Benefit Explanation ──────────── */}
            <Card className="bg-gradient-to-br from-[#0b1628] to-[#0f1e35] border-[#12233e]">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Shield size={18} className="text-[#22c55e]" />
                  How You Access Your Money \u2014 Tax-Free Policy Loans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#c8d8ec] leading-relaxed">
                  The interest credits shown above are available to you as <strong className="text-[#22c55e]">tax-free policy loans</strong>.
                  When you take a loan from your life insurance policy, it is not a taxable event. The IRS does not consider
                  it income. You receive the money, spend it however you wish, and your account value continues to compound
                  on the full amount \u2014 including the portion you borrowed against.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#060f20] border border-[#12233e]">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <DollarSign size={14} className="text-[#22c55e]" />
                      Tax-Free Income
                    </h4>
                    <p className="text-xs text-[#7a95b8] leading-relaxed">
                      Policy loans are not reported as income on your tax return. You pay no federal income tax,
                      no state income tax, and no capital gains tax on the money you receive.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#060f20] border border-[#12233e]">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Shield size={14} className="text-[#22c55e]" />
                      Permanent Death Benefit
                    </h4>
                    <p className="text-xs text-[#7a95b8] leading-relaxed">
                      The policy includes a permanent death benefit that passes to your beneficiaries income-tax-free.
                      Your family is protected while you enjoy the tax-free income during your lifetime.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#060f20] border border-[#12233e]">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Recycle size={14} className="text-[#22c55e]" />
                      Scalable Strategy
                    </h4>
                    <p className="text-xs text-[#7a95b8] leading-relaxed">
                      Each property creates its own independent policy. The more properties you add, the larger
                      your combined tax-free income stream. All policies compound independently and simultaneously.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── NAIC Disclaimer ─────────────────────────────────────── */}
            <NAICDisclaimer
              variant="full"
              showsProjections
              showsPolicyLoans
              showsCashValues
              additionalText="The 7.4% illustrated rate used in this calculator is within NAIC AG49 compliance limits. Historical index averages are significantly higher than the maximum illustrated rates permitted by regulators. Instead of showing a higher interest rate than allowable, we illustrate a very conservative HELOC rate between 0-4%. HELOC terms, rates, and availability vary by lender and are subject to credit approval. This tool is for educational purposes only and does not constitute financial, tax, or legal advice. Consult with a licensed financial professional before making any decisions."
            />
          </>
        )}
      </div>
    
        <ComplianceFooter pageName="HouseRecyclingStrategy" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
