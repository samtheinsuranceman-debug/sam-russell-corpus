// ============================================================
// LAUNCH CHECK — the go-live verification list as one button.
// Admin-only. Server checks (DB, tables, env presence, providers)
// plus client-side route checks. Green means ship; red names the
// exact thing to fix. Nobody skips a step they can see.
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const ROUTES_TO_CHECK = [
  "/", "/assessment", "/pricing", "/goals", "/beliefs", "/matches",
  "/ecological-interventions", "/meta-systems", "/scenario-intelligence",
  "/science", "/evidence", "/lines", "/which-archetype",
];

type Row = { name: string; ok: boolean; detail: string };

export default function LaunchCheck() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [running, setRunning] = useState(false);
  const serverCheck = trpc.admin.launchCheck.useMutation();
  const health = trpc.admin.panelHealth.useMutation();

  const run = async () => {
    setRunning(true);
    const out: Row[] = [];
    // 1. Server-side checks
    try {
      const s = await serverCheck.mutateAsync();
      out.push(...s.checks);
    } catch (e: any) {
      out.push({ name: "Server checks", ok: false, detail: e?.message?.includes("FORBIDDEN") || e?.message?.includes("UNAUTHORIZED") ? "admin access required" : String(e?.message ?? e) });
    }
    // 2. Client-side route checks (real HTTP against this deployment)
    for (const r of ROUTES_TO_CHECK) {
      try {
        const res = await fetch(r, { method: "GET" });
        out.push({ name: `Route: ${r}`, ok: res.ok, detail: `HTTP ${res.status}` });
      } catch (e) {
        out.push({ name: `Route: ${r}`, ok: false, detail: String(e).slice(0, 80) });
      }
    }
    // 3. Panel health with keySource
    try {
      const h = await health.mutateAsync();
      out.push({ name: "Panel: configured", ok: h.configured >= 8, detail: `${h.configured} members configured` });
      out.push({ name: "Panel: live", ok: h.live >= 8, detail: `${h.live} of ${h.configured} responded` });
      for (const m of h.members as any[]) {
        out.push({ name: `Panel: ${m.name}`, ok: m.ok, detail: `${m.keySource ?? "?"} · ${m.ok ? `${m.latencyMs}ms` : m.note}` });
      }
    } catch (e: any) {
      out.push({ name: "Panel health", ok: false, detail: String(e?.message ?? e).slice(0, 100) });
    }
    setRows(out);
    setRunning(false);
  };

  const pass = rows?.filter((r) => r.ok).length ?? 0;
  const green = rows !== null && pass === rows.length;

  return (
    <div className="min-h-screen" style={{ background: "#141009" }}>
      <PublicHeader />
      <div className="max-w-[860px] mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.26em] uppercase mb-3" style={{ color: "#E0C68C" }}>
          Admin · go-live verification
        </p>
        <h1 className="text-4xl mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: "#F1EADB" }}>
          Launch Check
        </h1>
        <p className="text-sm mb-8 max-w-[46em]" style={{ color: "#CFC5B0", lineHeight: 1.65 }}>
          One button runs the entire deployment verification: database and tables, environment keys (presence only —
          values never leave the server), provider modes, drip registration, every public route, and the full 8-AI panel
          with each member&rsquo;s key source. Green means ship. Red names the fix.
        </p>

        {!user && <p className="text-sm" style={{ color: "#9C8F79" }}>Sign in with an admin account to run checks.</p>}

        {user && (
          <button onClick={run} disabled={running}
            className="px-5 py-3 rounded-lg font-mono text-[12px] uppercase tracking-[0.1em] font-bold cursor-pointer disabled:opacity-60 mb-8"
            style={{ background: "#E0C68C", color: "#141009" }}>
            {running ? "Running checks…" : rows ? "Run again" : "Run launch check"}
          </button>
        )}

        {rows && (
          <>
            <div className="mb-6 px-5 py-4 rounded-xl border" style={{
              borderColor: green ? "#9BC0B255" : "#E2604A55",
              background: green ? "rgba(155,192,178,0.06)" : "rgba(226,96,74,0.06)",
            }}>
              <span className="font-mono text-[13px] font-bold" style={{ color: green ? "#9BC0B2" : "#E2604A" }}>
                {green ? "✓ ALL GREEN — clear to ship" : `✗ ${rows.length - pass} of ${rows.length} checks failing — do not ship`}
              </span>
            </div>
            <div className="space-y-1.5">
              {rows.map((r, i) => (
                <div key={i} className="flex items-baseline gap-3 px-4 py-2.5 rounded-lg border"
                  style={{ borderColor: r.ok ? "rgba(241,234,219,0.08)" : "#E2604A55", background: r.ok ? "transparent" : "rgba(226,96,74,0.05)" }}>
                  <span className="flex-none font-mono text-[13px]" style={{ color: r.ok ? "#9BC0B2" : "#E2604A" }}>{r.ok ? "✓" : "✗"}</span>
                  <span className="flex-none w-[280px] text-[13px] truncate" style={{ color: "#F1EADB" }}>{r.name}</span>
                  <span className="flex-1 font-mono text-[11px] break-all" style={{ color: r.ok ? "#9C8F79" : "#E2604A" }}>{r.detail}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
