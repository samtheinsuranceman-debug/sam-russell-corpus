/**
 * Outside Forces — the six things a plan cannot vote on, read live.
 *
 * Every number comes from a public statistical series with its as-of date;
 * nothing is typed in. Behind each force sits a twelve-voice panel of the
 * institutions that publish on it, weighted evidence × track record ×
 * consistency, the same arithmetic the tax forecasters get. A series that
 * has not answered shows "unavailable", never a guess.
 */
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Activity, Banknote, Car, Home, Landmark, Plane, TrendingUp } from "lucide-react";

const CARD = "rc-card";
const ICON: Record<string, typeof Activity> = { prices: TrendingUp, fiat: Banknote, home: Home, credit: Activity, debt: Landmark, cars: Car, travel: Plane };

const fmtChange = (kind: "growth" | "points", v: number | undefined, unit: string) => {
  if (v == null || !Number.isFinite(v)) return "—";
  if (kind === "growth") return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2)}% / yr`;
  const pts = unit.includes("%") || unit.startsWith("index") || unit.startsWith("net") ? "" : ` ${unit}`;
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}${pts || " pts"}`;
};
const fmtLevel = (v: number | null | undefined, unit: string) => {
  if (v == null) return "—";
  if (unit.startsWith("$")) return v >= 1e6 ? `$${(v / 1e6).toFixed(2)}T` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}B` : `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (unit.includes("%")) return `${v.toFixed(2)}%`;
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

function Sparkline({ points, color = "var(--room-line, #7EC8E3)" }: { points: Array<{ date: string; value: number }>; color?: string }) {
  if (points.length < 3) return null;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const W = 240, H = 40;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${((i / (points.length - 1)) * W).toFixed(1)},${(H - ((p.value - min) / (max - min || 1)) * (H - 4) - 2).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-10 w-full" aria-label={`${points[0]!.date.slice(0, 4)} to ${points[points.length - 1]!.date.slice(0, 4)}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function OutsideForces() {
  const all = trpc.outsideForces.all.useQuery(undefined, { refetchOnWindowFocus: false, retry: 1 });
  const [open, setOpen] = useState<string | null>(null);
  const horizons = all.data?.horizons ?? [1, 5, 10, 20, 40];

  return (
    <AppShell title="Outside Forces">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="rc-eyebrow text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--room-muted)" }}>The forces a plan cannot vote on</p>
          <h1 className="rc-page-title mt-1 text-2xl">Outside forces, read live</h1>
          <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--room-text)" }}>
            Prices, the money itself, the house, credit, the federal balance sheet, and the two purchases that track confidence. Every figure is a public statistical series with its as-of date. Behind each force is a panel of twelve institutions that publish on it, weighted by evidence, track record and consistency, the same arithmetic the tax forecasters get. Where the record does not support a causal claim, the force says so.
          </p>
          {all.isLoading && <p className="mt-3 text-xs" style={{ color: "var(--room-muted)" }}>Reading the feeds…</p>}
          {all.error && <p className="mt-3 text-xs" style={{ color: "var(--room-danger)" }}>{all.error.message}</p>}
        </div>

        {(all.data?.forces ?? []).map((f) => {
          const Icon = ICON[f.id] ?? Activity;
          const answered = f.series.filter((s) => s.source !== "unavailable").length;
          return (
            <section key={f.id} className={`${CARD} p-5`} aria-label={f.title}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold" style={{ color: "var(--room-heading)" }}><Icon size={16} className="mr-2 inline" style={{ color: "var(--room-line)" }} />{f.title}</h2>
                <p className="text-xs" style={{ color: "var(--room-muted)" }}>{answered} of {f.series.length} feeds answered</p>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--room-text)" }}>{f.question}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {f.series.map((s) => (
                  <div key={s.id} className="rounded-xl border p-3" style={{ borderColor: "var(--room-hairline-soft)", background: "var(--room-surface)" }}>
                    <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--room-muted)" }}>{s.label}</p>
                    {s.source === "unavailable" ? (
                      <p className="mt-1 text-sm" style={{ color: "var(--room-muted)" }}>{s.candidate ? "Not yet confirmed as a feed; shown once it answers." : "Unavailable: the feed has not answered yet. No number is shown rather than a guess."}</p>
                    ) : (
                      <>
                        <p className="rc-money mt-1 text-2xl font-semibold">{fmtLevel(s.latest?.value, s.unit)}</p>
                        <p className="text-[11px]" style={{ color: "var(--room-muted)" }}>{s.unit} · as of {s.latest?.date} · {s.source} · {s.publisher}</p>
                        <Sparkline points={s.annual} />
                        <table className="mt-2 w-full text-[11px]">
                          <tbody>
                            {horizons.map((h) => (
                              <tr key={h} style={{ color: "var(--room-text)" }}><td className="pr-2" style={{ color: "var(--room-muted)" }}>{h}y</td><td className="rc-money text-right">{fmtChange(s.kind, s.change[h as 1], s.unit)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[11px]" style={{ color: "var(--room-muted)" }}>{f.caveat}</p>

              <button type="button" className="mt-3 text-xs font-semibold underline-offset-4 hover:underline" style={{ color: "var(--room-line)" }} onClick={() => setOpen(open === f.id ? null : f.id)}>
                {open === f.id ? "Hide" : "Show"} the twelve voices behind this force →
              </button>
              {open === f.id && (
                <div className="mt-2 overflow-x-auto">
                  <table className="rc-table text-xs">
                    <thead><tr><th>Source</th><th>Publishes</th><th>Method</th><th>Horizon</th><th>Evidence</th><th>Consistency</th><th>Weight</th></tr></thead>
                    <tbody>
                      {[...f.sources].sort((a, b) => b.weight - a.weight).map((s) => (
                        <tr key={s.id}>
                          <td><a href={s.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline" style={{ color: "var(--room-heading)" }}>{s.name}</a><br /><span style={{ color: "var(--room-muted)" }}>{s.org}</span></td>
                          <td>{s.publishes}</td>
                          <td>{s.method}</td>
                          <td>{s.horizonYears}y</td>
                          <td className="rc-money">{s.defaults.evidence.toFixed(2)}</td>
                          <td className="rc-money">{s.defaults.consistency.toFixed(2)}</td>
                          <td className="rc-money">{s.weight.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--room-muted)" }}>Weight = evidence × (½ + ½·track record) × (½ + ½·consistency). Track record starts at ½ for every voice and moves only as published outcomes are recorded against its claims.</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
