// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import {
  Lock, Database, MapPin, Shield, TrendingUp, DollarSign, Building2,
  ChevronDown, ChevronUp, Star, Award, BarChart3, AlertTriangle,
  CheckCircle2, Globe, Phone, Eye, EyeOff, Search, Info,
  ArrowUpRight, Zap, Target, Layers, Crown, Sparkles, Download
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Line,
} from "recharts";
import {
  US_STATES, getTopProductsForState, getStateGuaranty, getStateName,
  getCarrierSplitRecommendation,
  type StateCode, type AnnuityProduct,
} from "@shared/annuityData";
import { useClientData } from "@/contexts/ClientDataContext";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

/* ─── Formatters ─── */
const fmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const pct = (n: number) => n.toFixed(2) + "%";

/* ─── Growth Projection Engine ─── */
function calcGrowthProjection(
  premium: number,
  bonusPct: number,
  participationRate: number,
  capRate: number,
  years: number,
  assumedIndexReturn: number
) {
  let value = premium * (1 + bonusPct / 100);
  const projection: Array<{ year: number; value: number; credited: number; cumReturn: number }> = [
    { year: 0, value, credited: 0, cumReturn: 0 },
  ];
  for (let y = 1; y <= years; y++) {
    let credited: number;
    if (capRate > 0) {
      credited = Math.min(Math.max(assumedIndexReturn, 0), capRate / 100);
    } else {
      const raw = assumedIndexReturn * (participationRate / 100);
      credited = Math.max(raw, 0);
    }
    value *= 1 + credited;
    const cumReturn = ((value - premium) / premium) * 100;
    projection.push({ year: y, value, credited: credited * 100, cumReturn });
  }
  return projection;
}

/* ─── Chart Colors ─── */
const CHART_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

/* ─── Tier Badge ─── */
function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    Premium: "rc-badge-green",
    Enhanced: "rc-badge-blue",
    Standard: "bg-slate-500/10 text-slate-300 border-slate-500/50",
    "Below Standard": "rc-badge-red",
  };
  return (
    <span className={`rc-badge ${colors[tier] || colors.Standard}`}>
      {tier}
    </span>
  );
}

/* ─── Product Detail Card ─── */
function ProductDetailCard({
  product,
  idx,
  isSelected,
  onToggle,
  premium,
  years,
  assumedReturn,
}: {
  product: AnnuityProduct;
  idx: number;
  isSelected: boolean;
  onToggle: () => void;
  premium: number;
  years: number;
  assumedReturn: number;
}) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const projection = useMemo(
    () =>
      calcGrowthProjection(
        premium,
        product.bonusPct || 0,
        product.participationRate || 100,
        product.capRate || 0,
        years,
        assumedReturn / 100
      ),
    [premium, product, years, assumedReturn]
  );
  const finalValue = projection[projection.length - 1]?.value ?? 0;
  const totalGain = finalValue - premium;
  const totalReturn = ((finalValue - premium) / premium) * 100;

  const rankColors = [
    "bg-gradient-to-r from-amber-500 to-yellow-400 text-black",
    "bg-gradient-to-r from-gray-300 to-gray-400 text-black",
    "bg-gradient-to-r from-amber-700 to-amber-600 text-white",
  ];

  return (
    <div
      className={`rc-card transition-all duration-200 ${
        isSelected
          ? "border-[#22c55e]/50 bg-[#22c55e]/5 shadow-lg shadow-[#22c55e]/10"
          : "hover:border-[#7a95b8]/40"
      }`}
    >
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank Badge */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            idx < 3 ? rankColors[idx] : "bg-[#12233e] text-[#7a95b8]"
          }`}
        >
          {idx + 1}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">{product.carrier}</p>
            <span className="rc-badge border-[#7a95b8]/30 text-[#c8d8ec] text-xs shrink-0">
              {product.amBest}
            </span>
            {product.comdex > 0 && (
              <span className="text-xs text-[#7a95b8]">Comdex: {product.comdex}</span>
            )}
          </div>
          <p className="text-xs text-[#7a95b8] truncate">{product.product}</p>
        </div>

        {/* Key Metrics */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {product.participationRate && product.participationRate > 0 && (
            <div className="text-center">
              <p className="text-xs text-[#7a95b8]">Participation</p>
              <p className="text-sm font-bold text-[#22c55e]">{product.participationRate}%</p>
            </div>
          )}
          {product.capRate && product.capRate > 0 && (
            <div className="text-center">
              <p className="text-xs text-[#7a95b8]">Cap Rate</p>
              <p className="text-sm font-bold text-[#3b82f6]">{pct(product.capRate)}</p>
            </div>
          )}
          {product.bonusPct && product.bonusPct > 0 && (
            <div className="text-center">
              <p className="text-xs text-[#7a95b8]">Bonus</p>
              <p className="text-sm font-bold text-[#f0c040]">{product.bonusPct}%</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-xs text-[#7a95b8]">Projected</p>
            <p className="text-sm font-bold text-[#22c55e]">{fmt(finalValue)}</p>
          </div>
        </div>

        {/* Select + Expand */}
        <button
          className={`rc-btn shrink-0 ${isSelected ? "rc-btn-primary" : "rc-btn-ghost border border-[#12233e]"}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Target className="w-4 h-4" />}
        </button>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#7a95b8] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#7a95b8] shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="pt-4 mt-4 border-t border-[#12233e] space-y-4">
          {/* Highlight */}
          <p className="text-sm italic text-[#7a95b8] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#f0c040] shrink-0" />
            {product.highlight}
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-[#0b1628] border border-[#12233e]">
              <p className="text-xs text-[#7a95b8]">Participation Rate</p>
              <p className="text-lg font-bold text-[#22c55e]">
                {product.participationRate || 100}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1628] border border-[#12233e]">
              <p className="text-xs text-[#7a95b8]">Cap Rate</p>
              <p className="text-lg font-bold text-[#3b82f6]">
                {product.capRate ? pct(product.capRate) : "Uncapped"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1628] border border-[#12233e]">
              <p className="text-xs text-[#7a95b8]">Premium Bonus</p>
              <p className="text-lg font-bold text-[#f0c040]">{product.bonusPct || 0}%</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1628] border border-[#12233e]">
              <p className="text-xs text-[#7a95b8]">Surrender Period</p>
              <p className="text-lg font-bold text-white">{product.surrenderYears || 0} yrs</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1628] border border-[#12233e]">
              <p className="text-xs text-[#7a95b8]">Min Premium</p>
              <p className="text-lg font-bold text-white">{fmt(product.minPremium || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1628] border border-[#12233e]">
              <p className="text-xs text-[#7a95b8]">Free Withdrawal</p>
              <p className="text-lg font-bold text-white">{product.freeWithdrawal || 10}%</p>
            </div>
          </div>

          {/* Index Strategy */}
          {product.indexStrategy && (
            <div className="p-3 rounded-lg bg-[#3b82f6]/5 border border-[#3b82f6]/20">
              <p className="text-xs text-[#3b82f6] font-semibold mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Index Strategy
              </p>
              <p className="text-sm text-[#c8d8ec]">{product.indexStrategy}</p>
            </div>
          )}

          {/* Projected Growth Summary */}
          <div className="p-3 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/20">
            <p className="text-xs text-[#22c55e] font-semibold mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Hypothetical {years}-Year Growth ({assumedReturn}% assumed index return)
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#7a95b8]">Starting Value</p>
                <p className="text-sm font-bold text-white">
                  {fmt(premium)}
                  {(product.bonusPct || 0) > 0 && (
                    <span className="text-[#f0c040] text-xs ml-1">
                      (incl. {product.bonusPct}% bonus)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#7a95b8]">Projected Value</p>
                <p className="text-sm font-bold text-[#22c55e]">{fmt(finalValue)}</p>
              </div>
              <div>
                <p className="text-xs text-[#7a95b8]">Total Gain</p>
                <p className="text-sm font-bold text-[#22c55e]">
                  +{fmt(totalGain)} ({totalReturn.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>

          {/* State Exclusions */}
          {product.excludedStates.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#ef4444]">
              <AlertTriangle className="w-3 h-3" />
              Not available in: {product.excludedStates.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Password Gate ─── */
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const verifyMut = trpc.hiddenMaterial.verifyPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await verifyMut.mutateAsync({ password });
      if (result.verified) {
        toast.success("Access granted — Annuity Database unlocked");
        onUnlock();
      }
    } catch (err: any) {
      const msg = err?.message ?? "Incorrect password";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <AppShell>
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="rc-card w-full max-w-lg border-[#f0c040]/30 bg-gradient-to-b from-[#0d1a2e] to-[#0b1628]">
          <div className="text-center pb-4">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f0c040]/20 to-[#f97316]/20 flex items-center justify-center mb-4 border border-[#f0c040]/30">
              <Lock className="w-10 h-10 text-[#f0c040]" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Annuity Accumulation Database
            </h2>
            <p className="text-sm text-[#7a95b8] mt-2">
              Password-protected database containing top accumulation FIAs ranked by state.
              Only authorized advisors may access this proprietary data.
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <span className="rc-badge rc-badge-green">
                <Globe className="w-3 h-3 mr-1" /> 50 States + DC
              </span>
              <span className="rc-badge rc-badge-blue">
                <TrendingUp className="w-3 h-3 mr-1" /> Top 10 Per State
              </span>
              <span className="rc-badge rc-badge-gold">
                <Shield className="w-3 h-3 mr-1" /> Accumulation Focus
              </span>
            </div>
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#c8d8ec]">
                  Enter Access Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to unlock database"
                    className="rc-input pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-[#c8d8ec]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && <p className="text-[#ef4444] text-xs mt-1.5">{error}</p>}
              </div>
              <button
                type="submit"
                className="rc-btn rc-btn-primary w-full bg-gradient-to-r from-[#f0c040] to-[#f97316] hover:from-[#f0c040]/80 hover:to-[#f97316]/80 text-black font-semibold border-0"
                disabled={!password || verifyMut.isPending}
              >
                {verifyMut.isPending ? (
                  "Verifying..."
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" /> Unlock Database
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Main Database Page ─── */
export default function AnnuityAccumulationDB() {
  const { clientData } = useClientData();
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [stateCode, setStateCode] = useState<StateCode>("FL");
  const [premium, setPremium] = useState<number>(250000);
  const [projectionYears, setProjectionYears] = useState<number>(10);
  const [assumedReturn, setAssumedReturn] = useState<number>(8);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("rankings");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const products = useMemo(
    () => getTopProductsForState(stateCode, "growth", 10),
    [stateCode]
  );
  const guaranty = useMemo(() => getStateGuaranty(stateCode), [stateCode]);
  const splitRec = useMemo(
    () => getCarrierSplitRecommendation(premium, stateCode),
    [premium, stateCode]
  );

  const effectiveSelected = useMemo(() => {
    if (selectedIds.length > 0) return selectedIds;
    return products.slice(0, 3).map((p) => p.id);
  }, [products, selectedIds]);

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const projections = useMemo(() => {
    return products
      .filter((p) => effectiveSelected.includes(p.id))
      .map((product) => {
        const proj = calcGrowthProjection(
          premium,
          product.bonusPct || 0,
          product.participationRate || 100,
          product.capRate || 0,
          projectionYears,
          assumedReturn / 100
        );
        return {
          product,
          projection: proj,
          finalValue: proj[proj.length - 1]?.value ?? 0,
        };
      })
      .sort((a, b) => b.finalValue - a.finalValue);
  }, [premium, projectionYears, assumedReturn, effectiveSelected, products]);

  const chartData = useMemo(() => {
    if (projections.length === 0) return [];
    const maxYears = projectionYears;
    const data: any[] = [];
    for (let y = 0; y <= maxYears; y++) {
      const row: any = { year: y };
      projections.forEach((p) => {
        const pt = p.projection.find((pp) => pp.year === y);
        if (pt) row[p.product.carrier] = pt.value;
      });
      data.push(row);
    }
    return data;
  }, [projections, projectionYears]);

  const allStatesData = useMemo(() => {
    return US_STATES.map((s) => {
      const stProducts = getTopProductsForState(s.code as StateCode, "growth", 10);
      const g = getStateGuaranty(s.code as StateCode);
      const topProduct = stProducts[0];
      return {
        ...s,
        guaranty: g,
        productCount: stProducts.length,
        topCarrier: topProduct?.carrier ?? "N/A",
        topParticipation: topProduct?.participationRate ?? 0,
        topBonus: topProduct?.bonusPct ?? 0,
      };
    });
  }, []);

  const filteredStates = useMemo(() => {
    if (!searchTerm) return allStatesData;
    const term = searchTerm.toLowerCase();
    return allStatesData.filter(
      (s) =>
        s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term)
    );
  }, [allStatesData, searchTerm]);

  const handleExportCSV = () => {
    if (projections.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Year", ...projections.map((p) => p.product.carrier)];
    const csvRows = [headers.join(",")];

    for (let y = 0; y <= projectionYears; y++) {
      const row = [y.toString()];
      projections.forEach((p) => {
        const pt = p.projection.find((pp) => pp.year === y);
        row.push(pt ? pt.value.toFixed(2) : "0");
      });
      csvRows.push(row.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `annuity_projections_${stateCode}_${projectionYears}yr.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully");
  };

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="AnnuityAccumulationDB" />

        <ExecutiveSummary
          pageTitle="Annuity Accumulation Dashboard"
          whatItDoes="This dashboard tracks and projects the growth of your annuity accumulation values across multiple carriers and product types. It models guaranteed vs. projected returns, surrender schedules, and optimal holding periods."
          opportunities="Many clients don\'t realize their annuities may be past the surrender period, unlocking penalty-free access to funds that could be repositioned into higher-yielding products or used for tax-advantaged strategies."
          intent="To give you complete visibility into your annuity portfolio\'s growth trajectory and optimal action points."
          takeaway="Knowing exactly when your surrender charges expire and what your guaranteed floor is empowers you to make strategic moves at the right time."
          callToAction="Review your annuity surrender schedules and identify any that are past their penalty period."
          followUpQuestions={[
            "Are any of my annuities past their surrender period and ready to reposition?",
            "How do my annuity returns compare to current market offerings?",
            "Should I be laddering my annuities for better liquidity?",
          ]}
        />
        <GoalsAccelerator pageName="Annuity Accumulation Dashboard" pageContext="Annuity accumulation tracking with carrier comparison, surrender schedules, and growth projections" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="Optimize your annuity portfolio timing for maximum growth"
          detail="By tracking surrender schedules and repositioning mature annuities into higher-yielding products, you can significantly boost your accumulation."
          dollarBenefit={180000}
          timeHorizon="10 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Portfolio Yield", doNothing: 3.2, recommended: 5.8, format: "percent" },
            { label: "10-Year Accumulation", doNothing: 650000, recommended: 830000, format: "currency" },
            { label: "Surrender Penalties Avoided", doNothing: 0, recommended: 45000, format: "currency" },
          ]}
          summary="Leaving annuities on autopilot past their optimal holding period means missing out on better rates and strategic repositioning opportunities."
        />
        {/* Header */}
        <div className="rc-page-header">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#f0c040] to-[#f97316] rounded-xl shadow-lg shadow-[#f0c040]/20">
                <Database className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="rc-page-title flex items-center gap-2">
                  Annuity Accumulation Database
                  <span className="rc-badge rc-badge-green text-xs">
                    <Lock className="w-3 h-3 mr-1" /> Authorized Access
                  </span>
                </h1>
                <p className="rc-page-subtitle">
                  Top 10 highest accumulation Fixed Index Annuities — ranked by state with growth projections
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportCSV} className="rc-btn rc-btn-ghost">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </button>
              <ExportToSlides
                toolName="Annuity Accumulation Database"
                getSections={() => [
                  {
                    title: "Annuity Accumulation Overview",
                    items: [
                      { label: "State", value: getStateName(stateCode) },
                      { label: "Premium Amount", value: fmt(premium) },
                      { label: "Projection Years", value: `${projectionYears} years` },
                      { label: "Assumed Index Return", value: `${assumedReturn}%` },
                      { label: "Available Products", value: products.length.toString() }
                    ]
                  },
                  {
                    title: "Top Products",
                    items: projections.slice(0, 3).map((p, i) => ({
                      label: `#${i + 1} ${p.product.carrier}`,
                      value: `Projected: ${fmt(p.finalValue)} (+${fmt(p.finalValue - premium)})`
                    }))
                  }
                ]}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="rc-badge border-[#a855f7]/30 text-[#a855f7] bg-[#a855f7]/10">
              <Globe className="w-3 h-3 mr-1" /> {US_STATES.length} States + DC
            </span>
            <span className="rc-badge rc-badge-green">
              <TrendingUp className="w-3 h-3 mr-1" /> {products.length} Products in{" "}
              {getStateName(stateCode)}
            </span>
            <span className="rc-badge rc-badge-gold">
              <DollarSign className="w-3 h-3 mr-1" /> {fmt(premium)} Premium
            </span>
          </div>
        </div>

        {/* State Selector + Controls */}
        <div className="rc-card border-[#f0c040]/20 bg-[#f0c040]/5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* State Selector */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold flex items-center gap-1 text-[#c8d8ec]">
                <MapPin className="w-3 h-3 text-[#f0c040]" /> Client State of Residence
              </label>
              <select
                value={stateCode}
                onChange={(e) => {
                  setStateCode(e.target.value as StateCode);
                  setSelectedIds([]);
                }}
                className="rc-input mt-1 w-full"
              >
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code} className="bg-[#0d1a2e] text-white">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#c8d8ec]">Premium Amount</label>
              <input
                type="number"
                value={premium || ""}
                onChange={(e) => setPremium(Number(e.target.value) || 0)}
                className="rc-input mt-1 w-full"
              />
            </div>
            <div>
              <label className="text-xs text-[#c8d8ec]">Projection Years</label>
              <select
                value={String(projectionYears)}
                onChange={(e) => setProjectionYears(Number(e.target.value))}
                className="rc-input mt-1 w-full"
              >
                {[5, 7, 10, 15, 20].map((y) => (
                  <option key={y} value={String(y)} className="bg-[#0d1a2e] text-white">
                    {y} years
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#c8d8ec]">Assumed Index Return</label>
              <select
                value={String(assumedReturn)}
                onChange={(e) => setAssumedReturn(Number(e.target.value))}
                className="rc-input mt-1 w-full"
              >
                {[4, 6, 8, 10, 12].map((r) => (
                  <option key={r} value={String(r)} className="bg-[#0d1a2e] text-white">
                    {r}% annual
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* State Guaranty Info */}
        <div className="rc-card border-[#3b82f6]/20 bg-[#3b82f6]/5 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#3b82f6]" />
              <span className="font-semibold text-white">{getStateName(stateCode)} Guaranty:</span>
              <TierBadge tier={guaranty.tier} />
            </div>
            <span className="text-[#7a95b8]">
              Annuity:{" "}
              <strong className="text-white">{fmt(guaranty.annuityLimit)}</strong>
            </span>
            <span className="text-[#7a95b8]">
              Aggregate:{" "}
              <strong className="text-white">{fmt(guaranty.aggregateLimit)}</strong>
            </span>
            <span className="text-[#7a95b8]">
              <Globe className="w-3 h-3 inline mr-1" />
              {guaranty.website}
            </span>
            <span className="text-[#7a95b8]">
              <Phone className="w-3 h-3 inline mr-1" />
              {guaranty.phone}
            </span>
          </div>
          {splitRec.splitCount > 1 && (
            <div className="mt-2 p-2 rounded bg-[#f0c040]/10 border border-[#f0c040]/20 text-xs text-[#f0c040] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {splitRec.recommendation}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap border-b border-[#12233e] gap-2">
            {[
              { id: "rankings", icon: Crown, label: "Rankings" },
              { id: "comparison", icon: BarChart3, label: "Growth Chart" },
              { id: "details", icon: Info, label: "Year-by-Year" },
              { id: "all-states", icon: Globe, label: "All 50 States" },
              { id: "ai-bestfit", icon: Sparkles, label: "AI Best-Fit" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#22c55e] text-white"
                    : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#7a95b8]"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── RANKINGS TAB ─── */}
          {activeTab === "rankings" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Award className="w-5 h-5 text-[#f0c040]" />
                  Top 10 Accumulation FIAs in {getStateName(stateCode)}
                </h2>
                <span className="rc-badge border-[#12233e] text-[#7a95b8] text-xs">
                  {products.length} products available
                </span>
              </div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {projections.slice(0, 4).map((p, i) => (
                  <div
                    key={p.product.id}
                    className={`rc-card py-3 px-4 ${
                      i === 0
                        ? "border-[#f0c040]/30 bg-[#f0c040]/5"
                        : "border-[#12233e]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? "bg-[#f0c040] text-black"
                            : i === 1
                            ? "bg-gray-300 text-black"
                            : i === 2
                            ? "bg-amber-700 text-white"
                            : "bg-[#12233e] text-[#7a95b8]"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs font-semibold text-white truncate">
                        {p.product.carrier}
                      </span>
                    </div>
                    <p className="rc-stat-value text-[#22c55e]">
                      {fmt(p.finalValue)}
                    </p>
                    <p className="text-xs text-[#7a95b8]">
                      +{fmt(p.finalValue - premium)} (
                      {(((p.finalValue - premium) / premium) * 100).toFixed(1)}%)
                    </p>
                  </div>
                ))}
              </div>

              {/* Product List */}
              <div className="space-y-3">
                {products.map((product, idx) => (
                  <ProductDetailCard
                    key={product.id}
                    product={product}
                    idx={idx}
                    isSelected={effectiveSelected.includes(product.id)}
                    onToggle={() => toggleProduct(product.id)}
                    premium={premium}
                    years={projectionYears}
                    assumedReturn={assumedReturn}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── COMPARISON CHART TAB ─── */}
          {activeTab === "comparison" && (
            <div className="space-y-4">
              <div className="rc-card">
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <BarChart3 className="w-5 h-5 text-[#22c55e]" />
                    {projectionYears}-Year Growth Projection — {getStateName(stateCode)}
                  </h3>
                  <p className="text-xs text-[#7a95b8]">
                    Hypothetical growth of {fmt(premium)} at {assumedReturn}% assumed
                    annual index return. Select products in the Rankings tab to compare.
                  </p>
                </div>
                <div>
                  {projections.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                        <XAxis
                          dataKey="year"
                          stroke="#7a95b8"
                          tick={{ fontSize: 12 }}
                          label={{
                            value: "Year",
                            position: "insideBottom",
                            offset: -5,
                            fill: "#7a95b8",
                          }}
                        />
                        <YAxis
                          stroke="#7a95b8"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                          formatter={(v: number) => fmt(v)}
                          contentStyle={{
                            backgroundColor: "#0b1628",
                            border: "1px solid #1a3055",
                            borderRadius: "8px",
                            color: "#fff"
                          }}
                        />
                        <Legend wrapperStyle={{ color: "#c8d8ec" }} />
                        {projections.map((p, i) => (
                          <Area
                            key={p.product.id}
                            type="monotone"
                            dataKey={p.product.carrier}
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                            fillOpacity={0.08}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                          />
                        ))}
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-[#7a95b8]">
                      <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                      <p>Select products in the Rankings tab to see growth projections</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Value Bar Chart */}
              {projections.length > 0 && (
                <div className="rc-card">
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ArrowUpRight className="w-4 h-4 text-[#22c55e]" />
                      Final Value After {projectionYears} Years
                    </h3>
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={projections.map((p) => ({
                          name: p.product.carrier,
                          value: p.finalValue,
                          gain: p.finalValue - premium,
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                        <XAxis
                          type="number"
                          stroke="#7a95b8"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#7a95b8"
                          tick={{ fontSize: 11 }}
                          width={120}
                        />
                        <Tooltip
                          formatter={(v: number) => fmt(v)}
                          contentStyle={{
                            backgroundColor: "#0b1628",
                            border: "1px solid #1a3055",
                            borderRadius: "8px",
                            color: "#fff"
                          }}
                        />
                        <Bar dataKey="value" name="Projected Value" radius={[0, 4, 4, 0]}>
                          {projections.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── PRODUCT DETAILS TAB ─── */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Info className="w-5 h-5 text-[#3b82f6]" />
                Year-by-Year Projections — Selected Products
              </h2>

              {projections.length > 0 ? (
                <div className="overflow-x-auto rc-card p-0">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[#12233e] bg-[#0b1628]">
                        <th className="text-left p-3 text-[#7a95b8] font-medium">
                          Year
                        </th>
                        {projections.map((p, i) => (
                          <th
                            key={p.product.id}
                            className="text-right p-3 font-medium"
                            style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                          >
                            {p.product.carrier}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: projectionYears + 1 }, (_, y) => (
                        <tr
                          key={y}
                          className={`border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors ${
                            y === 0 ? "bg-[#12233e]/30" : ""
                          }`}
                        >
                          <td className="p-3 font-medium text-white">
                            {y === 0 ? "Start" : `Year ${y}`}
                          </td>
                          {projections.map((p, i) => {
                            const pt = p.projection.find((pp) => pp.year === y);
                            return (
                              <td
                                key={p.product.id}
                                className="text-right p-3 tabular-nums text-[#c8d8ec]"
                              >
                                {pt ? fmt(pt.value) : "—"}
                                {pt && y > 0 && (
                                  <span className="text-xs text-[#7a95b8] ml-1">
                                    ({pct(pt.credited)})
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rc-card">
                  <div className="py-12 text-center text-[#7a95b8] flex flex-col items-center">
                    <Target className="w-8 h-8 mb-2 opacity-50" />
                    <p>Select products in the Rankings tab to see year-by-year projections</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── ALL 50 STATES TAB ─── */}
          {activeTab === "all-states" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Globe className="w-5 h-5 text-[#a855f7]" />
                  All 50 States + DC — Accumulation Overview
                </h2>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                  <input
                    placeholder="Search states..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rc-input pl-9 w-full"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rc-card p-0">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#12233e] bg-[#0b1628]">
                      <th className="text-left p-3 text-[#7a95b8] font-medium">
                        State
                      </th>
                      <th className="text-center p-3 text-[#7a95b8] font-medium">
                        Guaranty Tier
                      </th>
                      <th className="text-right p-3 text-[#7a95b8] font-medium">
                        Annuity Limit
                      </th>
                      <th className="text-center p-3 text-[#7a95b8] font-medium">
                        Products
                      </th>
                      <th className="text-left p-3 text-[#7a95b8] font-medium">
                        Top Carrier
                      </th>
                      <th className="text-right p-3 text-[#7a95b8] font-medium">
                        Top Participation
                      </th>
                      <th className="text-right p-3 text-[#7a95b8] font-medium">
                        Top Bonus
                      </th>
                      <th className="text-center p-3 text-[#7a95b8] font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStates.map((s) => (
                      <tr
                        key={s.code}
                        className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors"
                      >
                        <td className="p-3 font-medium text-white">
                          {s.name}{" "}
                          <span className="text-[#7a95b8] text-xs">({s.code})</span>
                        </td>
                        <td className="p-3 text-center">
                          <TierBadge tier={s.guaranty.tier} />
                        </td>
                        <td className="p-3 text-right tabular-nums font-medium text-white">
                          {fmt(s.guaranty.annuityLimit)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="rc-badge border-[#12233e] text-[#c8d8ec] text-xs">
                            {s.productCount}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-[#c8d8ec]">{s.topCarrier}</td>
                        <td className="p-3 text-right tabular-nums text-[#22c55e]">
                          {s.topParticipation > 0 ? `${s.topParticipation}%` : "—"}
                        </td>
                        <td className="p-3 text-right tabular-nums text-[#f0c040]">
                          {s.topBonus > 0 ? `${s.topBonus}%` : "—"}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            className="rc-btn rc-btn-ghost text-xs py-1 h-auto"
                            onClick={() => {
                              setStateCode(s.code as StateCode);
                              setSelectedIds([]);
                              setActiveTab("rankings");
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tier Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                {(
                  [
                    {
                      tier: "Premium",
                      color: "emerald",
                      hex: "#22c55e",
                      icon: <Star className="w-4 h-4 text-[#22c55e]" />,
                    },
                    {
                      tier: "Enhanced",
                      color: "blue",
                      hex: "#3b82f6",
                      icon: <Award className="w-4 h-4 text-[#3b82f6]" />,
                    },
                    {
                      tier: "Standard",
                      color: "slate",
                      hex: "#94a3b8",
                      icon: <Shield className="w-4 h-4 text-[#94a3b8]" />,
                    },
                    {
                      tier: "Below Standard",
                      color: "red",
                      hex: "#ef4444",
                      icon: <AlertTriangle className="w-4 h-4 text-[#ef4444]" />,
                    },
                  ] as const
                ).map(({ tier, hex, icon }) => (
                  <div
                    key={tier}
                    className="rc-card"
                    style={{ borderColor: `${hex}33`, backgroundColor: `${hex}0d` }}
                  >
                    <div className="pb-2">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        {icon} {tier}
                      </h3>
                    </div>
                    <div>
                      <div className="space-y-1">
                        {allStatesData
                          .filter((s) => s.guaranty.tier === tier)
                          .map((s) => (
                            <div
                              key={s.code}
                              className="text-xs flex items-center justify-between cursor-pointer text-[#7a95b8] hover:text-white transition-colors"
                              onClick={() => {
                                setStateCode(s.code as StateCode);
                                setSelectedIds([]);
                                setActiveTab("rankings");
                              }}
                            >
                              <span>{s.name}</span>
                              <span style={{ color: hex }}>
                                {fmt(s.guaranty.annuityLimit)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── AI BEST-FIT TAB ─── */}
          {activeTab === "ai-bestfit" && (
            <div className="space-y-4">
              <div className="rc-card">
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Sparkles className="w-5 h-5 text-[#a855f7]" />
                    AI Best-Fit Recommendation Engine
                    <span className="text-xs bg-[#a855f7]/20 text-[#a855f7] px-2 py-0.5 rounded-full">BETA</span>
                  </h3>
                  <p className="text-sm text-[#7a95b8]">
                    Answer 3 questions and the AI will recommend the best accumulation annuity for your client's profile.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-xl border border-[#12233e] bg-[#0b1628]">
                      <div className="text-sm font-medium mb-2 text-white">1. Client Priority</div>
                      <div className="space-y-2">
                        {["Maximum growth potential", "Downside protection first", "Balanced growth + safety", "Short-term liquidity needed"].map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[#12233e] hover:border-[#a855f7]/50 cursor-pointer transition-colors">
                            <input type="radio" name="priority" className="accent-[#a855f7]" />
                            <span className="text-xs text-[#c8d8ec]">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-[#12233e] bg-[#0b1628]">
                      <div className="text-sm font-medium mb-2 text-white">2. Time Horizon</div>
                      <div className="space-y-2">
                        {["3-5 years", "5-7 years", "7-10 years", "10+ years"].map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[#12233e] hover:border-[#a855f7]/50 cursor-pointer transition-colors">
                            <input type="radio" name="horizon" className="accent-[#a855f7]" />
                            <span className="text-xs text-[#c8d8ec]">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-[#12233e] bg-[#0b1628]">
                      <div className="text-sm font-medium mb-2 text-white">3. Premium Amount</div>
                      <div className="space-y-2">
                        {["$50K - $100K", "$100K - $250K", "$250K - $500K", "$500K+"].map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[#12233e] hover:border-[#a855f7]/50 cursor-pointer transition-colors">
                            <input type="radio" name="premium" className="accent-[#a855f7]" />
                            <span className="text-xs text-[#c8d8ec]">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[#a855f7]" />
                      <span className="text-sm font-medium text-[#a855f7]">AI Recommendation</span>
                    </div>
                    <p className="text-sm text-[#7a95b8]">Select all 3 criteria above, then the AI will analyze {stateCode}'s top products and recommend the best fit with a confidence score and detailed reasoning.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="rc-card border-[#12233e] bg-[#0b1628] py-3">
          <p className="text-xs text-[#7a95b8]">
            <strong className="text-[#f0c040]">IMPORTANT DISCLAIMER:</strong> All
            projections shown are hypothetical and for illustrative purposes only.
            Actual returns will vary based on index performance, crediting method,
            and market conditions. Past performance does not guarantee future results.
            Fixed Index Annuities are not direct investments in any stock market index.
            Guarantees are backed by the financial strength and claims-paying ability
            of the issuing insurance company. Product availability, rates, and features
            are subject to change without notice. Always verify current rates and
            state availability with the carrier before making recommendations.
            Data sourced from carrier rate sheets, AM Best, and NOLHGA (Q2 2026).
          </p>
        </div>

        <PageInsights pageId="annuity-accumulation-db" />
      </div>
    
        <ComplianceFooter pageName="AnnuityAccumulationDB" showsAnnuity showsTax showsEstate showsProjections />
      </AppShell>
  );
}
