// ============================================================
// GOALS DASHBOARD — clocks, staircases, effort bars
// ============================================================
// Up to 10 stated goals. Each card: the honest countdown clock (computed from
// baseline × stage progress ÷ logged pace — including "at this pace: never"),
// the requirement staircase (tap to complete), a 6-month effort bar graph,
// and a monthly effort log. The clock only moves when the member does.

import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { whatWouldItTake, monthStreak } from "@shared/growthEngine";
import { fmtMonths } from "@shared/goalClock";
import CrisisSupport from "@/components/CrisisSupport";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const LINE_C = "rgba(241,234,219,0.10)";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";

const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const CLOCK_COLOR: Record<string, string> = {
  unstarted: MUTED, on_pace: JADE, ahead: JADE, behind: CHAMPAGNE,
  stalled: EMBER, never: EMBER, achieved: CHAMPAGNE,
};
const CLOCK_LABEL: Record<string, string> = {
  unstarted: "CLOCK NOT STARTED", on_pace: "ON PACE", ahead: "AHEAD OF PACE",
  behind: "BEHIND PACE", stalled: "STALLED", never: "AT THIS PACE: NEVER", achieved: "ACHIEVED",
};

function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// 6-month effort bar graph — house style (matches the archetype spectrum bars).
function EffortBars({ logs, minHours }: { logs: { month: string; hours: number }[]; minHours: number }) {
  const months = logs.slice(-6);
  if (months.length === 0) {
    return <div style={{ ...mono, fontSize: "10px", color: MUTED }}>No effort logged yet — the clock starts with your first log.</div>;
  }
  const max = Math.max(minHours * 1.5, ...months.map((l) => l.hours));
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: "56px" }}>
        {months.map((l) => {
          const h = Math.max(3, (l.hours / max) * 52);
          const met = l.hours >= minHours;
          return (
            <div key={l.month} className="flex flex-col items-center gap-1" title={`${l.month}: ${l.hours}h`}>
              <div style={{ width: "26px", height: `${h}px`, borderRadius: "3px 3px 0 0", background: met ? CHAMPAGNE : l.hours > 0 ? `${CHAMPAGNE}66` : `${EMBER}55` }} />
              <span style={{ ...mono, fontSize: "8px", color: MUTED }}>{l.month.slice(5)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ ...mono, fontSize: "9px", color: MUTED, marginTop: "4px" }}>
        hours/month · gold = met the {minHours}h baseline
      </div>
    </div>
  );
}

export default function Goals() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const q = trpc.goals.list.useQuery(undefined, { enabled: !!user, retry: false });
  const suggestions = trpc.goals.suggestFromAssessment.useQuery(undefined, { enabled: !!user, retry: false, staleTime: 5 * 60_000 });
  const [newTitle, setNewTitle] = useState("");
  const [logDraft, setLogDraft] = useState<Record<number, { hours: string; note: string }>>({});
  // One-Thing focus mode: hide everything but a single goal. Simplicity = compliance.
  const [focusId, setFocusId] = useState<number | null>(null);
  const [wwitOpen, setWwitOpen] = useState<Record<number, boolean>>({});
  const [showCrisis, setShowCrisis] = useState(false);

  const create = trpc.goals.create.useMutation({
    onSuccess: (r) => { toast.success(`Goal added — mapped to the "${r.template}" staircase.`); setNewTitle(""); utils.goals.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggle = trpc.goals.toggleStage.useMutation({ onSuccess: () => utils.goals.list.invalidate() });
  const logEffort = trpc.goals.logEffort.useMutation({
    onSuccess: (res) => {
      toast.success("Effort logged — clock updated.");
      if ((res as { crisis?: boolean })?.crisis) setShowCrisis(true);
      utils.goals.list.invalidate();
    },
  });
  const setStatus = trpc.goals.setStatus.useMutation({ onSuccess: () => utils.goals.list.invalidate() });

  const allActive = (q.data ?? []).filter((g) => g.status === "active" || g.status === "achieved");
  const activeGoals = focusId ? allActive.filter((g) => g.id === focusId) : allActive;

  return (
    <div className="min-h-screen relative" style={{ background: INK }}>
      <PublicHeader />
      <div className="relative z-10 max-w-[1000px] mx-auto px-[clamp(20px,5vw,56px)] py-[clamp(40px,6vw,80px)]">
        <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "14px" }}>
          Outcome engineering · your goals on the clock
        </div>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.04, color: CREAM, margin: "0 0 12px" }}>
          Ten goals. Ten honest clocks.
        </h1>
        <p style={{ color: CREAM2, fontSize: "clamp(15px,1.6vw,17px)", lineHeight: 1.65, maxWidth: "46em", marginBottom: "10px" }}>
          Every goal decomposes into a staircase of requirements with a countdown clock — an estimate built from how
          long the goal typically takes <i>at real effort</i>, shortened by every stage you complete, and re-computed
          from the hours you actually log each month. <b style={{ color: CREAM }}>The clock responds to effort, which
          means you control the clock.</b>
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, maxWidth: "50em", marginBottom: "30px" }}>
          Clocks are honest estimates, not guarantees — and yes, months of zero logged hours will read "never." That's
          the feature.
        </p>

        {!loading && !user && (
          <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "26px", color: CREAM2 }}>
            <Link href="/login" style={{ color: CHAMPAGNE }}>Sign in</Link> to open your goals dashboard.
          </div>
        )}

        {user && (
          <>
            {/* Add goal */}
            <div className="flex gap-2 mb-8 flex-wrap">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newTitle.trim().length >= 3) create.mutate({ title: newTitle.trim() }); }}
                placeholder='State a goal — "start my own business", "five kids", "retire at 55"…'
                style={{ flex: 1, minWidth: "260px", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`, borderRadius: "8px", padding: "13px 14px", fontSize: "15px", color: CREAM, outline: "none" }} />
              <button onClick={() => newTitle.trim().length >= 3 && create.mutate({ title: newTitle.trim() })}
                disabled={create.isPending || newTitle.trim().length < 3}
                style={{ ...mono, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "13px 22px", background: CHAMPAGNE, color: INK, border: 0, borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
                {create.isPending ? "Mapping…" : "Add goal"}
              </button>
            </div>

            {/* THE BRIDGE — goals they already spoke in their assessment answers */}
            {suggestions.data?.available && allActive.length < 10 && (
              <div className="mb-8 rounded-xl px-5 py-4" style={{ border: `1px solid ${JADE}44`, background: "rgba(155,192,178,0.05)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: JADE, marginBottom: "8px" }}>
                  We heard these in your assessment — put them on the clock?
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.data.suggestions
                    .filter((s) => !allActive.some((g) => g.title.toLowerCase() === s.toLowerCase()))
                    .map((s) => (
                      <button key={s} onClick={() => create.mutate({ title: s })} disabled={create.isPending}
                        className="rounded-full px-3 py-1.5 text-sm transition-colors hover:opacity-80"
                        style={{ border: `1px solid ${JADE}55`, background: "transparent", color: CREAM, cursor: "pointer" }}>
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Focus-mode banner */}
            {focusId && (
              <div className="flex items-center justify-between gap-3 mb-6 rounded-xl px-4 py-3" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.06)" }}>
                <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: CHAMPAGNE }}>
                  ◎ Focus mode — one goal, everything else paused
                </span>
                <button onClick={() => setFocusId(null)}
                  style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", background: "none", border: 0, color: CREAM2, cursor: "pointer" }}>
                  Show all goals
                </button>
              </div>
            )}

            {q.data && activeGoals.length === 0 && (
              <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "26px", color: CREAM2 }}>
                No goals on the clock yet. State your first one above — it gets decomposed into a requirement staircase
                automatically, and your first monthly effort log starts the countdown.
              </div>
            )}

            <div className="space-y-6">
              {activeGoals.map((g) => {
                const draft = logDraft[g.id] ?? { hours: "", note: "" };
                const color = CLOCK_COLOR[g.clock.state] ?? CREAM2;
                return (
                  <div key={g.id} style={{ border: `1px solid ${g.clock.state === "never" || g.clock.state === "stalled" ? "rgba(226,96,74,0.4)" : LINE_C}`, borderRadius: "16px", padding: "24px", background: INK2 }}>
                    {/* Header: title + clock */}
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                      <div>
                        <div style={{ ...serif, fontSize: "24px", color: CREAM }}>{g.title}</div>
                        <div style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color, marginTop: "4px" }}>
                          {CLOCK_LABEL[g.clock.state]}
                        </div>
                      </div>
                      <span className="flex items-center gap-3">
                        {monthStreak(g.logs.map((l) => l.month)) >= 2 && (
                          <span title="Consecutive months logged"
                            style={{ ...mono, fontSize: "10px", color: CHAMPAGNE }}>
                            🔥 {monthStreak(g.logs.map((l) => l.month))}-month streak
                          </span>
                        )}
                        {!focusId && (
                          <button onClick={() => setFocusId(g.id)} title="Focus on only this goal"
                            style={{ ...mono, fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", background: "none", border: 0, color: CHAMPAGNE, cursor: "pointer" }}>
                            ◎ Focus
                          </button>
                        )}
                        <button onClick={() => setStatus.mutate({ goalId: g.id, status: "retired" })}
                          title="Retire this goal"
                          style={{ ...mono, fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", background: "none", border: 0, color: MUTED, cursor: "pointer" }}>
                          Retire
                        </button>
                      </span>
                    </div>
                    <p style={{ color: g.clock.state === "never" ? EMBER : CREAM2, fontSize: "14px", lineHeight: 1.55, marginBottom: "10px" }}>
                      {g.clock.headline}
                    </p>

                    {/* WHAT WOULD IT TAKE — the honest price tag, itemized */}
                    <button onClick={() => setWwitOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
                      style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: 0, color: JADE, cursor: "pointer", padding: 0, marginBottom: "12px" }}>
                      {wwitOpen[g.id] ? "▾ Hide the price tag" : "▸ What would it take?"}
                    </button>
                    {wwitOpen[g.id] && (() => {
                      const w = whatWouldItTake(g.stages, g.baselineMonths);
                      return w.rows.length > 0 ? (
                        <div className="mb-4 rounded-xl px-4 py-3" style={{ border: `1px solid ${JADE}33`, background: "rgba(155,192,178,0.05)" }}>
                          <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: JADE, marginBottom: "8px" }}>
                            The itemized price, at real effort ({g.minMonthlyHours}h/month)
                          </p>
                          {w.rows.map((r) => (
                            <div key={r.stage} className="flex items-baseline justify-between gap-3 py-1">
                              <span style={{ fontSize: "13px", color: CREAM2 }}>{r.stage}</span>
                              <span style={{ ...mono, fontSize: "11px", color: CREAM, whiteSpace: "nowrap" }}>~{fmtMonths(r.months)}</span>
                            </div>
                          ))}
                          <div className="flex items-baseline justify-between gap-3 pt-2 mt-1" style={{ borderTop: `1px solid ${LINE_C}` }}>
                            <span style={{ fontSize: "13px", color: CREAM, fontWeight: 600 }}>Total, from where you stand</span>
                            <span style={{ ...mono, fontSize: "12px", color: JADE, fontWeight: 700 }}>~{fmtMonths(w.totalMonths)}</span>
                          </div>
                          <p style={{ fontSize: "11.5px", color: MUTED, marginTop: "8px", lineHeight: 1.5 }}>
                            That's the honest bill. Pay it, or trade for a goal shaped more like you — both are winning moves.
                          </p>
                        </div>
                      ) : null;
                    })()}

                    <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
                      {/* The staircase */}
                      <div>
                        <div style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "8px" }}>
                          The staircase · {Math.round(g.clock.stageProgress * 100)}% climbed
                        </div>
                        {g.stages.map((s, i) => (
                          <button key={i} onClick={() => toggle.mutate({ goalId: g.id, stageIndex: i })}
                            className="w-full text-left flex items-start gap-2 py-1.5"
                            style={{ background: "none", border: 0, cursor: "pointer" }}>
                            <span style={{ ...mono, fontSize: "12px", color: s.done ? JADE : MUTED, marginTop: "1px" }}>{s.done ? "◉" : "○"}</span>
                            <span style={{ fontSize: "13.5px", lineHeight: 1.45, color: s.done ? CREAM2 : CREAM, textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.7 : 1 }}>
                              {s.name}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Effort bars + log */}
                      <div>
                        <div style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "8px" }}>
                          Effort · last 6 months
                        </div>
                        <EffortBars logs={g.logs} minHours={g.minMonthlyHours} />
                        <div className="flex gap-2 mt-4 flex-wrap items-center">
                          <input type="number" min={0} max={744} value={draft.hours}
                            onChange={(e) => setLogDraft((d) => ({ ...d, [g.id]: { ...draft, hours: e.target.value } }))}
                            placeholder="hrs"
                            style={{ width: "72px", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`, borderRadius: "6px", padding: "9px 10px", fontSize: "14px", color: CREAM, outline: "none" }} />
                          <input value={draft.note}
                            onChange={(e) => setLogDraft((d) => ({ ...d, [g.id]: { ...draft, note: e.target.value } }))}
                            placeholder="What did you actually do? (optional)"
                            style={{ flex: 1, minWidth: "140px", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`, borderRadius: "6px", padding: "9px 10px", fontSize: "13px", color: CREAM, outline: "none" }} />
                          <button
                            onClick={() => {
                              const hours = parseFloat(draft.hours);
                              if (!isFinite(hours) || hours < 0) { toast.error("Enter this month's real hours — zero is allowed and honest."); return; }
                              logEffort.mutate({ goalId: g.id, month: thisMonth(), hours, note: draft.note || undefined });
                            }}
                            disabled={logEffort.isPending}
                            style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 14px", background: "transparent", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}66`, borderRadius: "6px", cursor: "pointer" }}>
                            Log {thisMonth()}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {showCrisis && <CrisisSupport onClose={() => setShowCrisis(false)} />}
      <PublicFooter />
    </div>
  );
}
