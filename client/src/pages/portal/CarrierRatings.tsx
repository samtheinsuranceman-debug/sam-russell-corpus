import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { trpc } from "@/lib/trpc";
import { Activity, Database, RefreshCw, Search, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Source = "live" | "cached" | "static";

function SourceBadge({ source }: { source: Source }) {
  const styles = {
    live: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    cached: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    static: "border-slate-400/20 bg-slate-500/10 text-slate-300",
  };
  const Icon = source === "live" ? Wifi : source === "cached" ? Database : WifiOff;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${styles[source]}`}><Icon className="h-3 w-3" />{source === "static" ? "Curated reference" : source}</span>;
}

function QueryError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-red-400/20 bg-red-950/25 p-5 text-red-100 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Carrier data is unavailable.</p><p className="mt-1 text-sm text-red-200/70">{message}</p></div><Button variant="outline" onClick={retry}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div>;
}

export default function CarrierRatings() {
  const [tab, setTab] = useState<"ratings" | "indices">("ratings");
  const [search, setSearch] = useState("");
  const carriersQuery = trpc.carrierRatings.list.useQuery(undefined, { retry: false });
  const indexQuery = trpc.carrierRatings.indexPerformance.useQuery(undefined, { retry: false });
  const refresh = trpc.carrierRatings.refresh.useMutation({
    onSuccess: async result => {
      await Promise.all([carriersQuery.refetch(), indexQuery.refetch()]);
      toast.success(`Carrier data refreshed from ${result.dataSource} source`);
    },
    onError: error => toast.error(error.message || "Carrier refresh failed"),
  });

  const filteredCarriers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return carriersQuery.data ?? [];
    return (carriersQuery.data ?? []).filter(carrier => [carrier.carrierName, carrier.specialty, carrier.amBest?.rating, carrier.sp?.rating].filter(Boolean).some(value => String(value).toLowerCase().includes(query)));
  }, [carriersQuery.data, search]);

  const indexPerformance = indexQuery.data?.indices ?? [];

  return (
    <AppShell title="Carrier Ratings" subtitle="Source-labeled financial strength and index-crediting context">
      <div className="space-y-6">
        <div className="rounded-2xl border border-violet-400/20 bg-violet-950/20 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-violet-300" /><div><h2 className="font-semibold text-white">Transparent source handling</h2><p className="mt-1 max-w-3xl text-sm text-slate-300">Ratings use verified provider data when available, a 24-hour cache when appropriate, and clearly labeled curated reference records otherwise. This page contains no randomized market, rating, or historical values.</p></div></div>
            <Button onClick={() => refresh.mutate()} disabled={refresh.isPending}><RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />Refresh sources</Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-xl border border-violet-400/15 bg-slate-950/40 p-1">
            <button className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "ratings" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`} onClick={() => setTab("ratings")}>Carrier ratings</button>
            <button className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "indices" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`} onClick={() => setTab("indices")}>Market Index Performance</button>
          </div>
          {tab === "ratings" && <label className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search carriers, specialties, or ratings" className="pl-9" /></label>}
        </div>

        {tab === "ratings" ? (
          <section className="space-y-4">
            {carriersQuery.isLoading && <div className="flex items-center gap-2 rounded-2xl border border-violet-400/15 bg-slate-950/40 p-5 text-sm text-violet-100"><RefreshCw className="h-4 w-4 animate-spin" />Loading carrier ratings…</div>}
            {carriersQuery.isError && <QueryError message={carriersQuery.error.message} retry={() => void carriersQuery.refetch()} />}
            {!carriersQuery.isLoading && !carriersQuery.isError && filteredCarriers.length === 0 && <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-8 text-center text-sm text-slate-400">No carriers match this search.</div>}
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredCarriers.map(carrier => <article key={carrier.carrierId} className="rounded-2xl border border-violet-400/15 bg-slate-950/45 p-5 shadow-lg shadow-violet-950/10">
                <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold text-white">{carrier.carrierName}</h3><p className="mt-1 text-sm text-slate-400">{carrier.specialty}</p></div><SourceBadge source={carrier.dataSource} /></div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-xl bg-white/[0.035] p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">Overall</p><p className="mt-1 text-xl font-semibold text-violet-200">{carrier.overallScore.toFixed(1)}/10</p></div><div className="rounded-xl bg-white/[0.035] p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">A.M. Best</p><p className="mt-1 text-xl font-semibold text-white">{carrier.amBest?.rating ?? "N/A"}</p></div><div className="rounded-xl bg-white/[0.035] p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">S&P</p><p className="mt-1 text-xl font-semibold text-white">{carrier.sp?.rating ?? "N/A"}</p></div><div className="rounded-xl bg-white/[0.035] p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">Comdex</p><p className="mt-1 text-xl font-semibold text-white">{carrier.financials.comdexScore}</p></div></div>
                <div className="mt-4 flex flex-wrap gap-2">{carrier.strengths.slice(0, 4).map(strength => <span key={strength} className="rounded-full border border-violet-400/15 bg-violet-500/5 px-3 py-1 text-xs text-violet-100">{strength}</span>)}</div>
                <p className="mt-4 text-xs text-slate-500">Updated {new Date(carrier.lastUpdated).toLocaleString()}</p>
              </article>)}
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-950/20 p-4 text-sm text-amber-100"><strong>IUL Crediting Parameters:</strong> caps, floors, and participation rates are contextual reference terms, not guaranteed policy results. Each row identifies whether performance came from a live response or the curated fallback dataset.</div>
            {indexQuery.isLoading && <div className="flex items-center gap-2 rounded-2xl border border-violet-400/15 bg-slate-950/40 p-5 text-sm text-violet-100"><RefreshCw className="h-4 w-4 animate-spin" />Loading index performance…</div>}
            {indexQuery.isError && <QueryError message={indexQuery.error.message} retry={() => void indexQuery.refetch()} />}
            {!indexQuery.isLoading && !indexQuery.isError && indexPerformance.length === 0 && <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-8 text-center text-sm text-slate-400">No index data is currently available.</div>}
            <div className="overflow-x-auto rounded-2xl border border-violet-400/15 bg-slate-950/45"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Index</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">YTD</th><th className="px-4 py-3">1 year</th><th className="px-4 py-3">5 years</th><th className="px-4 py-3">Typical cap</th><th className="px-4 py-3">Floor</th><th className="px-4 py-3">Participation</th></tr></thead><tbody>{indexPerformance.map(index => <tr key={index.symbol} className="border-b border-white/5 last:border-0"><td className="px-4 py-4"><p className="font-medium text-white">{index.name}</p><p className="text-xs text-slate-500">{index.symbol}</p></td><td className="px-4 py-4"><SourceBadge source={index.dataSource} /></td><td className="px-4 py-4 text-slate-200">{index.performance.ytd.toFixed(1)}%</td><td className="px-4 py-4 text-slate-200">{index.performance.oneYear.toFixed(1)}%</td><td className="px-4 py-4 text-slate-200">{index.performance.fiveYear.toFixed(1)}%</td><td className="px-4 py-4 text-slate-200">{index.crediting.typicalCap}%</td><td className="px-4 py-4 text-slate-200">{index.crediting.typicalFloor}%</td><td className="px-4 py-4 text-slate-200">{index.crediting.typicalParticipation}%</td></tr>)}</tbody></table></div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><Activity className="h-3.5 w-3.5" />Dataset updated {indexQuery.data?.lastUpdated ? new Date(indexQuery.data.lastUpdated).toLocaleString() : "when available"}</div>
          </section>
        )}

        <NAICDisclaimer variant="compact" />
      </div>
    </AppShell>
  );
}
