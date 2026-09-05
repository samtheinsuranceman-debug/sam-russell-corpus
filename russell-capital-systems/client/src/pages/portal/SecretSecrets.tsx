import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, ChevronDown, ChevronUp, Zap, Tag, ArrowRight, User, DollarSign, TrendingUp } from "lucide-react";
import strategiesData from "@/data/strategies.json";

function getImpactColor(score: number) {
  if (score >= 12) return "text-red-400 bg-red-500/10 border-red-500/20";
  if (score >= 11) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  if (score >= 10) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 9) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return "text-purple-400 bg-purple-500/10 border-purple-500/20";
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function SecretSecrets() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    (strategiesData as any[]).forEach((s) => s.categories?.forEach((c: string) => cats.add(c)));
    return ["All", ...Array.from(cats).sort()];
  }, []);

  const filtered = useMemo(() => {
    return (strategiesData as any[]).filter((s) => {
      const matchesSearch =
        search === "" ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        s.clientProfile?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        categoryFilter === "All" ||
        s.categories?.includes(categoryFilter);
      return matchesSearch && matchesCat;
    });
  }, [search, categoryFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#1a0d2e] via-[#0a1628] to-[#1a0d2e] p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="relative z-10">
          <p className="text-xs font-semibold tracking-[0.3em] text-purple-400 uppercase mb-2">The 0.1% Playbook</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">100 Secret Strategies</h1>
          <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
            Each strategy features a unique high-net-worth family with aggressive capital deployments ($750K–$15M per step),
            HELOC-to-IUL cycles, mortgage paydown to $0, and real tax savings. Net worths range from $4M to $50M — every family is independent.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">100</p>
              <p className="text-xs text-gray-500">Secret Strategies</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">$4M–$50M</p>
              <p className="text-xs text-gray-500">Net Worth Range</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">$750K+</p>
              <p className="text-xs text-gray-500">Min. Deployment</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">12.5x</p>
              <p className="text-xs text-gray-500">Total Growth</p>
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
            placeholder="Search strategies or family names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          {allCategories.map((c) => (
            <option key={c} value={c} className="bg-gray-900">{c}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} strategies</p>

      {/* Strategy List */}
      <div className="space-y-3">
        {filtered.map((strategy: any) => {
          const cp = strategy.clientProfile;
          const hasFinancial = cp && cp.startingNetWorth;
          return (
            <Link
              key={strategy.id}
              href={`/portal/secret-secrets/${strategy.id}`}
              className="block rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-purple-500/30 transition-all duration-200 p-4 group"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-purple-400 w-8 flex-shrink-0">#{strategy.id}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                    {strategy.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getImpactColor(strategy.impactScore)}`}>
                      <Zap className="w-3 h-3" /> {strategy.impactScore}/12
                    </span>
                    {hasFinancial && (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-[10px] border border-white/10">
                          <User className="w-2.5 h-2.5" /> {cp.name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                          <DollarSign className="w-2.5 h-2.5" /> {formatMoney(cp.startingNetWorth)}
                        </span>
                        {strategy.finalNetWorth && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                            <TrendingUp className="w-2.5 h-2.5" /> → {formatMoney(strategy.finalNetWorth)}
                          </span>
                        )}
                      </>
                    )}
                    {strategy.categories?.slice(0, 2).map((cat: string) => (
                      <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-[10px] border border-white/10">
                        <Tag className="w-2.5 h-2.5" /> {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4">
        <p className="text-[10px] text-yellow-600/80 leading-relaxed">
          <strong>Disclaimer:</strong> These strategies are presented for educational and informational purposes only.
          They do not constitute financial, tax, or legal advice. Implementation requires consultation with qualified
          professionals. Tax laws and regulations are subject to change.
        </p>
      </div>
    </div>
  );
}
