import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { PAGE_AUDIT_SUMMARY } from "@/data/pageAuditSummary";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, CheckCircle2, FileSearch, RefreshCw, ShieldCheck, Users } from "lucide-react";

function MetricCard({ label, value, detail, tone = "violet" }: { label: string; value: string | number; detail: string; tone?: "violet" | "emerald" | "amber" | "red" }) {
  const tones = {
    violet: "border-violet-400/20 bg-violet-950/25 text-violet-200",
    emerald: "border-emerald-400/20 bg-emerald-950/20 text-emerald-200",
    amber: "border-amber-400/20 bg-amber-950/20 text-amber-200",
    red: "border-red-400/20 bg-red-950/20 text-red-200",
  };
  return <div className={`rounded-2xl border p-5 ${tones[tone]}`}><p className="text-xs uppercase tracking-[0.18em] opacity-70">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value}</p><p className="mt-2 text-xs opacity-70">{detail}</p></div>;
}

export default function SystemHealth() {
  const { user } = useAuth();
  const enabled = user?.role === "admin";
  const errorStats = trpc.errorLog.stats.useQuery(undefined, { enabled, retry: false });
  const recentErrors = trpc.errorLog.list.useQuery({ limit: 20, offset: 0 }, { enabled, retry: false });
  const usage = trpc.ownerAnalytics.summary.useQuery(undefined, { enabled, retry: false });
  const topPages = trpc.ownerAnalytics.topPages.useQuery({ limit: 10 }, { enabled, retry: false });
  const queries = [errorStats, recentErrors, usage, topPages];
  const loading = enabled && queries.some(query => query.isLoading);
  const failures = queries.filter(query => query.isError);

  const retryAll = () => Promise.all(queries.map(query => query.refetch()));

  if (!enabled) {
    return <AppShell title="System Health" subtitle="Administrative telemetry and release readiness"><div className="rounded-2xl border border-amber-400/25 bg-amber-950/25 p-8"><div className="flex items-center gap-3 text-amber-200"><ShieldCheck className="h-6 w-6" /><h2 className="text-xl font-semibold">Administrator access required</h2></div><p className="mt-3 max-w-2xl text-sm text-amber-100/70">Managed OAuth roles protect error records, usage analytics, and release-audit details. No secondary password or client-side bypass is accepted.</p></div></AppShell>;
  }

  return (
    <AppShell title="System Health" subtitle="Route readiness, persisted failures, and actual portal usage">
      <div className="space-y-6">
        {failures.length > 0 && <div className="flex flex-col gap-3 rounded-2xl border border-red-400/25 bg-red-950/30 p-4 text-red-100 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Some health data could not be loaded.</p><p className="mt-1 text-xs text-red-200/70">{failures.map(query => query.error?.message).filter(Boolean).join(" · ")}</p></div></div><Button variant="outline" onClick={retryAll}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div>}

        {loading && <div className="flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-950/20 p-4 text-sm text-violet-100"><RefreshCw className="h-4 w-4 animate-spin" />Loading persisted health telemetry…</div>}

        <section>
          <div className="mb-3 flex items-center gap-2"><FileSearch className="h-5 w-5 text-violet-300" /><h2 className="text-lg font-semibold text-white">Page audit</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Audited routes" value={PAGE_AUDIT_SUMMARY.routeCount} detail="Every explicit route scored; no pages deleted" />
            <MetricCard label="Average usefulness" value={`${PAGE_AUDIT_SUMMARY.averageScore}/10`} detail={`${PAGE_AUDIT_SUMMARY.fiveOrHigherCount} pages score five or higher`} tone="emerald" />
            <MetricCard label="Source-level healthy" value={PAGE_AUDIT_SUMMARY.renderHealth.healthy} detail={`${PAGE_AUDIT_SUMMARY.renderHealth.atRisk} at risk; runtime checks remain separate`} tone="emerald" />
            <MetricCard label="Below five" value={PAGE_AUDIT_SUMMARY.belowFiveCount} detail="Merge, secondary-library, improvement, or owner-approved retirement candidates" tone="amber" />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2"><Activity className="h-5 w-5 text-violet-300" /><h2 className="text-lg font-semibold text-white">Runtime health</h2></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Errors, 24 hours" value={errorStats.data?.last24h ?? "—"} detail="Persisted page and application errors" tone={(errorStats.data?.last24h ?? 0) > 0 ? "red" : "emerald"} />
            <MetricCard label="Errors, 7 days" value={errorStats.data?.last7d ?? "—"} detail={`${errorStats.data?.total ?? 0} total retained records`} tone={(errorStats.data?.last7d ?? 0) > 0 ? "amber" : "emerald"} />
            <MetricCard label="Tracked sessions" value={usage.data?.totalSessions ?? "—"} detail={`${usage.data?.activeSessions ?? 0} active sessions`} />
            <MetricCard label="Observed users" value={usage.data?.totalAdvisors ?? usage.data?.totalUsers ?? "—"} detail={`${usage.data?.loginsLast24h ?? 0} logins in the last 24 hours`} />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-violet-400/15 bg-slate-950/45 p-5">
            <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-violet-300" /><h2 className="font-semibold text-white">Most-used pages</h2></div>
            {topPages.data?.length ? <div className="space-y-3">{topPages.data.map((page: any) => <div key={`${page.pagePath}-${page.pageTitle}`} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-100">{page.pageTitle || page.pagePath}</p><p className="truncate text-xs text-slate-500">{page.pagePath}</p></div><div className="text-right"><p className="text-sm font-semibold text-violet-200">{Number(page.visits).toLocaleString()}</p><p className="text-[10px] uppercase tracking-wide text-slate-500">visits</p></div></div>)}</div> : !topPages.isLoading && <p className="text-sm text-slate-400">No page visits have been recorded yet.</p>}
          </section>

          <section className="rounded-2xl border border-violet-400/15 bg-slate-950/45 p-5">
            <div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-violet-300" /><h2 className="font-semibold text-white">Recent errors</h2></div>
            {recentErrors.data?.length ? <div className="space-y-3">{recentErrors.data.map(error => <div key={error.id} className="rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3"><div className="flex items-center justify-between gap-4"><p className="truncate text-sm font-medium text-slate-100">{error.message}</p><span className="shrink-0 text-[10px] uppercase tracking-wide text-red-300">{error.level}</span></div><p className="mt-1 truncate text-xs text-slate-500">{error.url || error.source}</p><p className="mt-1 text-[10px] text-slate-600">{new Date(error.createdAt).toLocaleString()}</p></div>)}</div> : !recentErrors.isLoading && <div className="flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />No persisted errors have been recorded.</div>}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
