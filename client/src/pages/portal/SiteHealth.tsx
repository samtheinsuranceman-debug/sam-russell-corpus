// ============================================================
// SITE HEALTH — the hosting, security, SEO, media, speed, local-SEO and
// analytics checklist, run live by the server against itself. Pass / warn /
// fail come from evidence; "manual" items carry the exact next step and the
// outside link, so the whole list can be worked top to bottom.
// ============================================================
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CircleHelp, DatabaseBackup, ExternalLink, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

type Status = "pass" | "warn" | "fail" | "manual";
const TONE: Record<Status, { ring: string; text: string; label: string; Icon: typeof CheckCircle2 }> = {
  pass: { ring: "border-emerald-400/25 bg-emerald-950/20", text: "text-emerald-300", label: "Pass", Icon: CheckCircle2 },
  warn: { ring: "border-amber-400/25 bg-amber-950/20", text: "text-amber-300", label: "Attention", Icon: AlertTriangle },
  fail: { ring: "border-red-400/30 bg-red-950/25", text: "text-red-300", label: "Fail", Icon: XCircle },
  manual: { ring: "border-sky-400/20 bg-sky-950/20", text: "text-sky-300", label: "Your step", Icon: CircleHelp },
};
const CARD = "rounded-2xl border border-white/10 bg-white/[0.04] p-5";
const BTN = "inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40";
const fmtMs = (metric: string, v: number | null) => (v === null ? "—" : metric === "CLS" ? v.toFixed(3) : `${Math.round(v)} ms`);

export default function SiteHealth() {
  const { user } = useAuth();
  const enabled = user?.role === "admin";
  const [filter, setFilter] = useState<Status | "all">("all");
  const report = trpc.siteHealth.report.useQuery(undefined, { enabled, retry: false, refetchOnWindowFocus: false, staleTime: 60_000 });
  const vitals = trpc.siteHealth.vitals.useQuery({ days: 28 }, { enabled, retry: false, refetchOnWindowFocus: false });
  const backups = trpc.siteHealth.backups.useQuery(undefined, { enabled, retry: false, refetchOnWindowFocus: false });
  const backupNow = trpc.siteHealth.backupNow.useMutation({
    onSuccess: (r) => { if (r.ok) toast.success(`Backup written: ${r.tables} tables, ${r.rows} rows, ${Math.round(r.bytes / 1024)} KB → ${r.destination}`); else toast.error(`Backup failed: ${r.error ?? "unknown"}`); void backups.refetch(); void report.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const sections = useMemo(() => (report.data?.sections ?? []).map((s) => ({ ...s, items: s.items.filter((i) => filter === "all" || i.status === filter) })), [report.data, filter]);

  if (!enabled) {
    return <AppShell title="Site Health" subtitle="Hosting, security, SEO, media, speed, local and analytics"><div className="rounded-2xl border border-amber-400/25 bg-amber-950/25 p-8"><div className="flex items-center gap-3 text-amber-200"><ShieldCheck className="h-6 w-6" /><h2 className="text-xl font-semibold">Administrator access required</h2></div><p className="mt-3 max-w-2xl text-sm text-amber-100/70">The checklist probes the server's own headers, backups and database; only an administrator may run it.</p></div></AppShell>;
  }

  const summary = report.data?.summary;
  return (
    <AppShell title="Site Health" subtitle="The SEO, hosting and security checklist, run live against this server">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {summary && (["pass", "warn", "fail", "manual"] as Status[]).map((s) => {
            const t = TONE[s];
            return <button key={s} onClick={() => setFilter(filter === s ? "all" : s)} className={`rounded-xl border px-4 py-2 text-left ${t.ring} ${filter === s ? "ring-2 ring-white/40" : ""}`}><p className={`text-xs uppercase tracking-[0.18em] ${t.text}`}>{t.label}</p><p className="text-2xl font-semibold text-white">{summary[s]}</p></button>;
          })}
          <div className="ml-auto flex gap-2">
            <button className={BTN} onClick={() => { void report.refetch(); void vitals.refetch(); void backups.refetch(); }} disabled={report.isFetching}><RefreshCw className={`h-4 w-4 ${report.isFetching ? "animate-spin" : ""}`} /> Run again</button>
            <button className={BTN} onClick={() => backupNow.mutate()} disabled={backupNow.isPending}><DatabaseBackup className="h-4 w-4" /> {backupNow.isPending ? "Backing up…" : "Back up now"}</button>
          </div>
        </div>
        {report.isLoading && <div className="flex items-center gap-3 rounded-2xl border border-white/10 p-4 text-sm text-white/70"><RefreshCw className="h-4 w-4 animate-spin" /> Probing headers, robots, sitemap, database, backups and vitals…</div>}
        {report.error && <div className="rounded-2xl border border-red-400/25 bg-red-950/30 p-4 text-sm text-red-100">{report.error.message}</div>}
        {report.data && <p className="text-xs text-white/50">Generated {new Date(report.data.generatedAt).toLocaleString()} for {report.data.origin}</p>}

        {sections.map((s) => (
          <section key={s.id} className={CARD}>
            <h2 className="text-lg font-semibold text-white">{s.title}</h2>
            <ul className="mt-3 divide-y divide-white/5">
              {s.items.map((i) => {
                const t = TONE[i.status];
                return (
                  <li key={i.id} className="flex gap-3 py-3">
                    <t.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${t.text}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-white">{i.label}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${t.ring} ${t.text}`}>{t.label}</span></div>
                      <p className="mt-1 text-sm text-white/70 break-words">{i.detail}</p>
                      {i.action && <p className="mt-1 text-sm text-sky-200/80"><span className="font-semibold">Next:</span> {i.action}</p>}
                      {i.link && <a href={i.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300 hover:underline">{i.link} <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                  </li>
                );
              })}
              {!s.items.length && <li className="py-3 text-sm text-white/50">Nothing in this section matches the filter.</li>}
            </ul>
          </section>
        ))}

        <section className={CARD}>
          <h2 className="text-lg font-semibold text-white">Core Web Vitals, last 28 days (real visitors, 75th percentile)</h2>
          {vitals.data ? (
            <>
              <p className="mt-1 text-xs text-white/50">{vitals.data.samples} samples from {vitals.data.source}. Good thresholds: LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms, FCP ≤ 1.8 s, TTFB ≤ 0.8 s.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-5">
                {vitals.data.overall.map((m) => { const t = TONE[m.rating === "good" ? "pass" : m.rating === "needs-improvement" ? "warn" : m.rating === "poor" ? "fail" : "manual"]; return <div key={m.metric} className={`rounded-xl border p-3 ${t.ring}`}><p className="text-xs text-white/60">{m.metric}</p><p className="text-xl font-semibold text-white">{fmtMs(m.metric, m.p75)}</p><p className={`text-xs ${t.text}`}>{m.rating ?? "no data"} · {m.samples}</p></div>; })}
              </div>
              {vitals.data.routes.length > 0 && (
                <div className="mt-4 overflow-x-auto"><table className="w-full text-xs text-white/80"><thead><tr className="text-left text-white/50"><th className="py-1 pr-3">Route</th><th className="py-1 pr-3">Samples</th>{["LCP", "CLS", "INP", "FCP", "TTFB"].map((m) => <th key={m} className="py-1 pr-3">{m}</th>)}</tr></thead><tbody>{vitals.data.routes.map((r) => <tr key={r.route} className="border-t border-white/5"><td className="py-1 pr-3 font-mono">{r.route}</td><td className="py-1 pr-3">{r.samples}</td>{(["LCP", "CLS", "INP", "FCP", "TTFB"] as const).map((m) => { const v = r.metrics[m]; return <td key={m} className={`py-1 pr-3 ${v ? TONE[v.rating === "good" ? "pass" : v.rating === "needs-improvement" ? "warn" : "fail"].text : "text-white/30"}`}>{v ? fmtMs(m, v.p75) : "—"}</td>; })}</tr>)}</tbody></table></div>
              )}
            </>
          ) : <p className="mt-2 text-sm text-white/60">Loading…</p>}
        </section>

        <section className={CARD}>
          <h2 className="text-lg font-semibold text-white">Backups</h2>
          {backups.data ? (
            <div className="mt-2 space-y-1 text-sm text-white/75">
              <p>Destination: {backups.data.target.kind === "s3" ? `s3://${backups.data.target.bucket}/${backups.data.target.prefix} (off-site)` : backups.data.target.kind === "local" ? `${backups.data.target.dir} (on this host)` : `off — ${backups.data.target.reason}`}</p>
              <p>Last good copy: {backups.data.lastOk ? `${new Date(backups.data.lastOk.at).toLocaleString()} · ${backups.data.lastOk.tables} tables · ${backups.data.lastOk.rows} rows · ${Math.round(backups.data.lastOk.bytes / 1024)} KB` : "none yet"}</p>
              <p>Last run: {backups.data.lastRun ? `${new Date(backups.data.lastRun.at).toLocaleString()} · ${backups.data.lastRun.status}${backups.data.lastRun.error ? ` · ${backups.data.lastRun.error}` : ""}` : "none"}</p>
              <p>Next scheduled: {backups.data.nextRunAt ? new Date(backups.data.nextRunAt).toLocaleString() : "—"} · {backups.data.runs} runs recorded</p>
              <p className="text-xs text-white/50">Restore: <code>DATABASE_URL=… pnpm db:restore &lt;file or s3://…&gt;</code> — see docs/RECOVERY_PLAN.md.</p>
            </div>
          ) : <p className="mt-2 text-sm text-white/60">Loading…</p>}
        </section>
      </div>
    </AppShell>
  );
}
