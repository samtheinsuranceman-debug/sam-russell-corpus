import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, Filter, TrendingUp, Users, DollarSign, Shield, ChevronRight, Sparkles } from "lucide-react";
import combosData from "@/data/combos.json";

const categories = ["All", "IUL", "Trusts", "Real Estate", "Roth", "Premium Financing", "Annuities", "Business", "Estate Planning", "Tax Deferral"];
const netWorthRanges = ["All", "Under $5M", "$5M–$15M", "$15M–$35M", "$35M–$55M", "$55M+"];

function filterByNetWorth(nw: number, range: string) {
  if (range === "All") return true;
  if (range === "Under $5M") return nw < 5_000_000;
  if (range === "$5M–$15M") return nw >= 5_000_000 && nw < 15_000_000;
  if (range === "$15M–$35M") return nw >= 15_000_000 && nw < 35_000_000;
  if (range === "$35M–$55M") return nw >= 35_000_000 && nw < 55_000_000;
  if (range === "$55M+") return nw >= 55_000_000;
  return true;
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function TaxFreeWealthCombos() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [nwRange, setNwRange] = useState("All");

  const filtered = useMemo(() => {
    return (combosData as any[]).filter((c) => {
      const matchesSearch =
        search === "" ||
        c.comboName.toLowerCase().includes(search.toLowerCase()) ||
        c.clientProfile.profession.toLowerCase().includes(search.toLowerCase()) ||
        c.clientProfile.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        category === "All" ||
        (c.categories && c.categories.some((cat: string) => cat.toLowerCase().includes(category.toLowerCase())));
      const matchesNW = filterByNetWorth(c.clientProfile.startingNetWorth, nwRange);
      return matchesSearch && matchesCategory && matchesNW;
    });
  }, [search, category, nwRange]);

  const totalTaxSaved = combosData.reduce((sum: number, c: any) => sum + (c.totalTaxSaved || 0), 0);
  const avgSteps = Math.round(combosData.reduce((sum: number, c: any) => sum + (c.steps?.length || 0), 0) / combosData.length);
  const uniqueStrategies = new Set(combosData.flatMap((c: any) => (c.steps || []).map((s: any) => s.strategyName))).size;
  const minNW = Math.min(...combosData.map((c: any) => c.clientProfile?.startingNetWorth || 0));
  const maxNW = Math.max(...combosData.map((c: any) => c.clientProfile?.startingNetWorth || 0));
  const fmtNW = (v: number) => v >= 1e6 ? `$${(v/1e6).toFixed(0)}M` : `$${(v/1e3).toFixed(0)}K`;

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#0d1a0d] via-[#0a1628] to-[#0d1a0d] p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        <div className="relative z-10">
          <p className="text-xs font-semibold tracking-[0.3em] text-emerald-400 uppercase mb-2">The Ultimate Playbook</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Tax-Free Wealth Combos</h1>
          <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
            100 elite, multi-step wealth strategies combining IUL, HELOC, trusts, premium financing, oil & gas, cost segregation, and advanced tax engineering.
            Each combo features a completely independent high-net-worth family with unique income, profession, and strategy mix. Tax savings range from millions to hundreds of millions — these are life-changing wealth engines.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">100</p>
              <p className="text-xs text-gray-500">Elite Strategies</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{avgSteps}</p>
              <p className="text-xs text-gray-500">Avg Steps/Combo</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{uniqueStrategies}</p>
              <p className="text-xs text-gray-500">Unique Strategies</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{fmtNW(minNW)}–{fmtNW(maxNW)}</p>
              <p className="text-xs text-gray-500">Net Worth Range</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, profession, or combo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          {categories.map((c) => (
            <option key={c} value={c} className="bg-gray-900">{c}</option>
          ))}
        </select>
        <select
          value={nwRange}
          onChange={(e) => setNwRange(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          {netWorthRanges.map((r) => (
            <option key={r} value={r} className="bg-gray-900">{r}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} combos found</p>

      {/* Combo Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((combo: any) => (
          <Link key={combo.id} href={`/portal/tax-combos/${combo.id}`}>
            <div className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-200 p-5 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-400 mb-1">Combo #{combo.id}</p>
                  <h3 className="text-sm font-semibold text-white truncate">{combo.comboName}</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-400">{combo.clientProfile.name} — {combo.clientProfile.profession}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Start</p>
                  <p className="text-sm font-semibold text-white">{formatMoney(combo.clientProfile.startingNetWorth)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Final</p>
                  <p className="text-sm font-semibold text-emerald-400">{formatMoney(combo.finalNetWorth)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Tax Saved</p>
                  <p className="text-sm font-semibold text-yellow-400">{formatMoney(combo.totalTaxSaved)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                  <TrendingUp className="w-3 h-3" /> {combo.steps?.length} steps
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                  {combo.timeHorizon}
                </span>
                {combo.netWorthMultiplier && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-medium">
                    <Sparkles className="w-3 h-3" /> {combo.netWorthMultiplier}x
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
