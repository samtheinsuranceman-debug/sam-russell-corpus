import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Activity, Heart, Search, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ============================================================
// CLIENT ENGAGEMENT
// This page used to give every real client an invented engagement score, meeting count,
// email-open count, portal-login count and event history, derived from the client's id.
// None of those are recorded. What is recorded is the client activity log, so that is
// what this page shows: how many logged actions each client has, and when the last one was.
// ============================================================

const ACTIVITY_WINDOW = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

type Row = {
  id: number;
  name: string;
  entries90: number;
  lastActivity: Date | null;
  recordUpdated: Date;
};

export default function ClientEngagementScore() {
  const [search, setSearch] = useState("");
  const clientsQuery = trpc.clients.list.useQuery();
  const activityQuery = trpc.activity.list.useQuery({ limit: ACTIVITY_WINDOW });

  const rows = useMemo<Row[]>(() => {
    const since = Date.now() - 90 * DAY_MS;
    const byClient = new Map<number, { count90: number; last: Date | null }>();
    for (const a of activityQuery.data ?? []) {
      const at = new Date(a.createdAt);
      const cur = byClient.get(a.clientId) ?? { count90: 0, last: null };
      if (at.getTime() >= since) cur.count90 += 1;
      if (!cur.last || at > cur.last) cur.last = at;
      byClient.set(a.clientId, cur);
    }
    return (clientsQuery.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      entries90: byClient.get(c.id)?.count90 ?? 0,
      lastActivity: byClient.get(c.id)?.last ?? null,
      recordUpdated: new Date(c.updatedAt),
    }));
  }, [clientsQuery.data, activityQuery.data]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0));
  }, [rows, search]);

  const chart = useMemo(
    () => [...rows].filter((r) => r.entries90 > 0).sort((a, b) => b.entries90 - a.entries90).slice(0, 10).map((r) => ({ name: r.name, entries: r.entries90 })),
    [rows],
  );

  const withActivity = rows.filter((r) => r.lastActivity).length;
  const quiet = rows.filter((r) => !r.lastActivity || Date.now() - r.lastActivity.getTime() > 90 * DAY_MS).length;
  const daysAgo = (d: Date) => Math.max(0, Math.floor((Date.now() - d.getTime()) / DAY_MS));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-400" /> Client Engagement
          </h1>
          <p className="text-sm text-[#7a95b8] mt-1 max-w-3xl">
            Counted from the client activity log (the most recent {ACTIVITY_WINDOW} entries in your workspace). Engagement
            scores, email opens, portal logins and event attendance are not tracked yet, so they are not shown; they will be
            added here once those signals are recorded.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Clients", value: rows.length },
            { label: "With logged activity", value: withActivity },
            { label: "No activity in 90 days", value: quiet },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
              <div className="text-xs text-[#7a95b8]">{s.label}</div>
            </div>
          ))}
        </div>

        {chart.length > 0 && (
          <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Most logged activity, last 90 days
            </h2>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 11 }} />
                  <YAxis stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", color: "#fff" }} />
                  <Bar dataKey="entries" name="Logged actions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5 space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-[#7a95b8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients" className="rc-input w-full pl-9 text-sm" />
          </div>

          {clientsQuery.isLoading || activityQuery.isLoading ? (
            <p className="text-sm text-[#7a95b8] py-8 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 mx-auto text-[#7a95b8] opacity-40 mb-3" />
              <p className="text-white font-medium">No clients yet</p>
              <p className="text-sm text-[#7a95b8] mt-1">Add clients and their logged activity will be summarised here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#7a95b8] uppercase border-b border-[#12233e]">
                  <tr>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Logged actions (90 days)</th>
                    <th className="px-3 py-2">Last logged action</th>
                    <th className="px-3 py-2">Record last updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  {visible.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-white">{r.name}</td>
                      <td className="px-3 py-2 text-[#c8d8ec]">{r.entries90}</td>
                      <td className="px-3 py-2 text-[#c8d8ec]">{r.lastActivity ? `${daysAgo(r.lastActivity)} days ago` : "None in the loaded log"}</td>
                      <td className="px-3 py-2 text-[#7a95b8]">{r.recordUpdated.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
