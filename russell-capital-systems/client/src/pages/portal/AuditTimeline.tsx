import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Activity, Download, History, RefreshCw, Search, ShieldAlert, User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

// ============================================================
// AUDIT TIMELINE
// Every entry on this page is a row from the workspace's client activity log
// (activity.getRecent) or a compliance alert (complianceAlerts.list). Nothing is
// generated in the browser. Fields the log does not record — IP address, device,
// duration, risk scores — are not shown, because showing them would mean inventing them.
// ============================================================

const PAGE_SIZE = 25;

type AuditEntry = {
  id: number;
  action: string;
  actor: string;
  clientName: string;
  summary: string;
  at: Date;
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export default function AuditTimeline() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  const activityQuery = trpc.activity.getRecent.useQuery({ limit: 200 });
  const alertsQuery = trpc.complianceAlerts.list.useQuery({ limit: 50 });

  const entries = useMemo<AuditEntry[]>(
    () =>
      (activityQuery.data ?? []).map((row) => ({
        id: row.id,
        action: row.action,
        actor: row.actorName ?? "System",
        clientName: row.clientName ?? `Client #${row.clientId}`,
        summary: row.summary ?? "",
        at: new Date(row.createdAt),
      })),
    [activityQuery.data],
  );

  const actions = useMemo(() => Array.from(new Set(entries.map((e) => e.action))).sort(), [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => actionFilter === "all" || e.action === actionFilter)
      .filter((e) => !q || [e.action, e.actor, e.clientName, e.summary].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => (sortOrder === "desc" ? b.at.getTime() - a.at.getTime() : a.at.getTime() - b.at.getTime()));
  }, [entries, search, actionFilter, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const perDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(dayKey(e.at), (counts.get(dayKey(e.at)) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [entries]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stats = [
    { label: "Entries loaded", value: entries.length },
    { label: "Last 7 days", value: entries.filter((e) => e.at.getTime() >= weekAgo).length },
    { label: "Clients touched", value: new Set(entries.map((e) => e.clientName)).size },
    { label: "People acting", value: new Set(entries.map((e) => e.actor)).size },
  ];

  const alerts = alertsQuery.data ?? [];

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = [
      ["ID", "Time", "Action", "Actor", "Client", "Summary"].join(","),
      ...filtered.map((e) => [String(e.id), e.at.toISOString(), e.action, e.actor, e.clientName, e.summary].map(esc).join(",")),
    ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `audit_timeline_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filtered.length} recorded entries`);
  };

  const refresh = () => {
    activityQuery.refetch();
    alertsQuery.refetch();
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <History className="w-6 h-6 text-[#22c55e]" /> Audit Timeline
            </h1>
            <p className="text-sm text-[#7a95b8] mt-1 max-w-2xl">
              What was done, by whom, to which client, and when — read from the workspace activity log. Only recorded
              entries appear here.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} className="rc-btn rc-btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={exportCsv} disabled={filtered.length === 0} className="rc-btn rc-btn-primary text-xs flex items-center gap-1 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
              <div className="text-xs text-[#7a95b8]">{s.label}</div>
            </div>
          ))}
        </div>

        {perDay.length > 0 && (
          <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5">
            <h2 className="text-white font-semibold mb-1">Entries per day</h2>
            <p className="text-xs text-[#7a95b8] mb-4">Counted from the entries loaded above (most recent 200).</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="date" stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", color: "#fff" }} />
                  <Bar dataKey="count" name="Entries" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#7a95b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search action, person, client or summary"
                className="rc-input w-full pl-9 text-sm"
              />
            </div>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="rc-input text-sm">
              <option value="all">All actions</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")} className="rc-input text-sm">
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          {activityQuery.isLoading ? (
            <p className="text-sm text-[#7a95b8] py-8 text-center">Loading the activity log…</p>
          ) : activityQuery.isError ? (
            <p className="text-sm text-red-400 py-8 text-center">The activity log could not be loaded. Nothing is shown in its place.</p>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="w-10 h-10 mx-auto text-[#7a95b8] opacity-40 mb-3" />
              <p className="text-white font-medium">No audit entries yet</p>
              <p className="text-sm text-[#7a95b8] mt-1 max-w-md mx-auto">
                Actions recorded against your clients — notes, plan changes, documents, messages — appear here as they happen,
                with who did them and when.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[#7a95b8] py-8 text-center">No entries match these filters.</p>
          ) : (
            <>
              <ul className="divide-y divide-[#12233e]">
                {visible.map((e) => (
                  <li key={e.id} className="py-3 flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e] mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-white font-medium">{e.action}</span>
                        <span className="text-[#7a95b8]">·</span>
                        <span className="text-[#c8d8ec]">{e.clientName}</span>
                      </div>
                      {e.summary && <p className="text-sm text-[#7a95b8] mt-0.5">{e.summary}</p>}
                      <div className="text-xs text-[#7a95b8] mt-1 flex items-center gap-2">
                        <User className="w-3 h-3" /> {e.actor}
                        <span>·</span>
                        <time dateTime={e.at.toISOString()}>{e.at.toLocaleString()}</time>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center text-xs text-[#7a95b8]">
                <span>Showing {visible.length} of {filtered.length} entries</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded bg-[#12233e] text-white disabled:opacity-40">Previous</button>
                  <span className="py-1">Page {page} of {pageCount}</span>
                  <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded bg-[#12233e] text-white disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#f0c040]" /> Compliance alerts
          </h2>
          {alertsQuery.isLoading ? (
            <p className="text-sm text-[#7a95b8]">Loading…</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-[#7a95b8]">
              No compliance alerts recorded. Alerts raised by the compliance check (RMD deadlines, contribution limits,
              overdue reviews) will be listed here.
            </p>
          ) : (
            <ul className="divide-y divide-[#12233e]">
              {alerts.map((a) => (
                <li key={a.id} className="py-2 flex justify-between gap-3 text-sm">
                  <div>
                    <span className={a.severity === "CRITICAL" ? "text-red-400" : a.severity === "WARNING" ? "text-yellow-400" : "text-[#7a95b8]"}>{a.severity}</span>
                    <span className="text-white ml-2">{a.title}</span>
                    {a.message && <p className="text-xs text-[#7a95b8]">{a.message}</p>}
                  </div>
                  <time className="text-xs text-[#7a95b8] shrink-0">{new Date(a.createdAt).toLocaleDateString()}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
