// ============================================================
// THE BLACK BOX — crash forensics for the member's own history.
// Sam's invitation voice on Manus's forensic skeleton: narrate
// 3–5 crashes or near-misses freely; the panel extracts the eight
// layers, then synthesizes the Crash Signature + prevention
// architecture with the failure-cascade diagram. Crashes annotate;
// they never lower a score.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import CrisisSupport from "@/components/CrisisSupport";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const LAYERS: { key: string; label: string }[] = [
  { key: "expectedOutcome", label: "What was supposed to succeed" },
  { key: "timeline", label: "The timeline — where it began deteriorating" },
  { key: "internalState", label: "Inside you at the time" },
  { key: "takeover", label: "What overtook your better judgment" },
  { key: "blindSpot", label: "What others saw that you couldn't" },
  { key: "consequences", label: "What it cost" },
  { key: "counterfactual", label: "The one thing that might have changed it" },
  { key: "recurrenceRisk", label: "Where this pattern could fire next" },
];

function CascadeDiagram({ stages }: { stages: string[] }) {
  const labels = ["TRIGGER", "INTERPRETATION", "EMOTION", "IMPULSE", "BEHAVIOR", "SHORT-TERM REWARD", "DELAYED COST", "RECOVERY WINDOW"];
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-stretch gap-0" style={{ minWidth: "900px" }}>
        {stages.slice(0, 8).map((s, i) => (
          <div key={i} className="flex items-center" style={{ flex: 1 }}>
            <div className="rounded-xl p-3 h-full" style={{
              flex: 1,
              border: `1px solid ${i === 7 ? JADE : i >= 5 ? `${EMBER}66` : LINE_C}`,
              background: i === 7 ? "rgba(155,192,178,0.07)" : i >= 5 ? "rgba(226,96,74,0.05)" : "rgba(241,234,219,0.02)",
            }}>
              <p style={{ ...mono, fontSize: "8.5px", letterSpacing: "0.12em", color: i === 7 ? JADE : i >= 5 ? EMBER : CHAMPAGNE, marginBottom: "5px" }}>{labels[i]}</p>
              <p style={{ fontSize: "12px", lineHeight: 1.5, color: CREAM2, margin: 0 }}>{s}</p>
            </div>
            {i < 7 && <span style={{ color: MUTED, padding: "0 4px", flex: "none" }}>→</span>}
          </div>
        ))}
      </div>
      <p style={{ ...mono, fontSize: "9px", color: MUTED, marginTop: "6px" }}>
        Your failure cascade — the recovery window at the end is the point: the chain can be cut at ANY link before it.
      </p>
    </div>
  );
}

export default function BlackBox() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [narrative, setNarrative] = useState("");
  const [privateScope, setPrivateScope] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [adding, setAdding] = useState(false);

  const events = trpc.blackBox.list.useQuery(undefined, { enabled: !!user, retry: false });
  const signature = trpc.blackBox.getSignature.useQuery(undefined, { enabled: !!user, retry: false });
  const cur = trpc.assessment.current.useQuery(undefined, { enabled: !!user, retry: false });

  const add = trpc.blackBox.add.useMutation({
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Recorded. Run the forensics when you're ready.");
        setTitle(""); setNarrative(""); setAdding(false);
        if (r.crisis) setShowCrisis(true);
        utils.blackBox.list.invalidate();
      } else toast.error(r.error);
    },
  });
  const remove = trpc.blackBox.remove.useMutation({ onSuccess: () => utils.blackBox.list.invalidate() });
  const extract = trpc.blackBox.extract.useMutation({
    onSuccess: (r) => {
      if (r.ok) { toast.success("Forensics complete — the eight layers are below."); utils.blackBox.list.invalidate(); }
      else if (r.reason === "no-ai") toast.error("The AI panel isn't connected — forensics need it. Nothing was faked instead.");
      else toast.error("Couldn't run the extraction — try again.");
    },
  });
  const build = trpc.blackBox.buildSignature.useMutation({
    onSuccess: (r) => {
      if (r.ok) { toast.success("Your Crash Signature is ready."); utils.blackBox.getSignature.invalidate(); }
      else if (r.reason === "too-few") toast.error("The signature needs at least two extracted events marked for coaching — patterns can't come from one point.");
      else if (r.reason === "no-ai") toast.error("The AI panel isn't connected — nothing was faked instead.");
      else toast.error("Couldn't synthesize — try again.");
    },
  });

  const done = (cur.data as any)?.completedQuestions ?? 0;
  const total = (cur.data as any)?.totalQuestions ?? 27;
  const extracted = (events.data ?? []).filter((e) => e.extraction && e.scope === "coaching");
  const report = (signature.data?.report ?? null) as any;

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[860px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: EMBER, marginBottom: "12px" }}>
          The Black Box · crash forensics
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(32px,5vw,50px)", lineHeight: 1.05, color: CREAM, margin: "0 0 14px" }}>
          Planes got safe by reading black boxes.<br />This one is yours.
        </h1>
        <p style={{ color: CREAM2, fontSize: "15.5px", lineHeight: 1.68, maxWidth: "46em", marginBottom: "10px" }}>
          Think of three to five moments that should have gone right and completely fell apart — the business, the
          relationship, the opportunity that died in your hands. Tell each one the way it actually happened.{" "}
          <b style={{ color: CREAM }}>Don&rsquo;t hold back and don&rsquo;t clean it up</b>: what happened first, what was
          going through your mind, what emotions or impulses overtook you, what it cost. One crash is bad luck.{" "}
          <b style={{ color: CREAM }}>The same mechanism firing across several is your fault line</b> — and once it has a
          name, it can be engineered against.
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, lineHeight: 1.7, marginBottom: "8px" }}>
          Ground rules: share only what you&rsquo;re willing to relive — skip anything still bleeding. Swap real names for
          initials if you prefer. Near-misses count (they contain recovery data). This is engineering, not therapy — if a
          crash is an open wound, a therapist comes before a platform.
        </p>
        {done < total && (
          <p style={{ ...mono, fontSize: "10.5px", color: CHAMPAGNE, marginBottom: "24px" }}>
            Note: your assessment is at {done}/{total}. The forensics work now — and get sharper once the panel has your
            full 32-line map to overlay.
          </p>
        )}

        {!loading && !user && (
          <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "26px", color: CREAM2 }}>
            <Link href="/login" style={{ color: CHAMPAGNE }}>Sign in</Link> to open your black box. Its contents are
            yours alone.
          </div>
        )}

        {user && (
          <>
            {/* Event list */}
            <div className="space-y-4 mb-8">
              {(events.data ?? []).map((e) => {
                const x = e.extraction as Record<string, unknown> | null;
                return (
                  <div key={e.id} style={{ border: `1px solid ${LINE_C}`, borderLeft: `3px solid ${EMBER}`, borderRadius: "14px", background: INK2, padding: "20px" }}>
                    <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                      <p style={{ ...serif, fontSize: "21px", color: CREAM, margin: 0 }}>{e.title}</p>
                      <span className="flex items-center gap-3">
                        {e.scope === "private" && <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: JADE }}>private — excluded from coaching</span>}
                        <button onClick={() => { if (confirm("Remove this event and its forensics?")) remove.mutate({ eventId: e.id }); }}
                          style={{ ...mono, fontSize: "10px", color: MUTED, background: "none", border: 0, cursor: "pointer" }}>remove</button>
                      </span>
                    </div>
                    {!x && (
                      <button onClick={() => extract.mutate({ eventId: e.id })} disabled={extract.isPending}
                        style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginTop: "8px", padding: "10px 16px", background: CHAMPAGNE, color: INK, border: 0, borderRadius: "7px", cursor: "pointer" }}>
                        {extract.isPending ? "Reading…" : "Run the forensics — extract the 8 layers"}
                      </button>
                    )}
                    {x && (
                      <div className="mt-3 space-y-2.5">
                        {LAYERS.map((l) => (
                          x[l.key] ? (
                            <p key={l.key} style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: 0 }}>
                              <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: CHAMPAGNE }}>{l.label} · </span>
                              {String(x[l.key])}
                            </p>
                          ) : null
                        ))}
                        {Array.isArray(x.lines) && x.lines.length > 0 && (
                          <p style={{ margin: "6px 0 0" }}>
                            {(x.lines as string[]).map((ln) => (
                              <span key={ln} style={{ ...mono, fontSize: "10px", color: EMBER, border: `1px solid ${EMBER}55`, borderRadius: "999px", padding: "4px 10px", marginRight: "6px", display: "inline-block" }}>
                                failed through: {ln}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add event */}
            {!adding && (events.data ?? []).length < 7 && (
              <button onClick={() => setAdding(true)}
                style={{ ...mono, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "13px 22px", background: "transparent", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}66`, borderRadius: "9px", cursor: "pointer", marginBottom: "36px" }}>
                + Record a crash or near-miss
              </button>
            )}
            {adding && (
              <div style={{ border: `1px solid ${CHAMPAGNE}44`, borderRadius: "14px", background: "rgba(224,198,140,0.04)", padding: "22px", marginBottom: "36px" }}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name it — e.g. 'The restaurant, 2019' or 'The engagement that ended'"
                  style={{ width: "100%", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`, borderRadius: "10px", padding: "12px 14px", fontSize: "15px", color: CREAM, outline: "none", marginBottom: "10px" }} />
                <textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} rows={10}
                  placeholder={"Tell it like it happened. Useful threads to pull:\n• What was supposed to succeed, and why did it matter?\n• What happened first, second, third — when did it start to slide?\n• What were you thinking, feeling, fearing, craving, avoiding?\n• What impulse or behavior overtook your better judgment?\n• What did others see that you couldn't?\n• What did it cost — money, people, health, standing, faith?\n• What ONE thing might have changed the outcome?"}
                  style={{ width: "100%", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`, borderRadius: "10px", padding: "14px", fontSize: "14.5px", lineHeight: 1.6, color: CREAM, outline: "none", resize: "vertical", marginBottom: "10px" }} />
                <label className="flex items-center gap-2 mb-4" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={privateScope} onChange={(e) => setPrivateScope(e.target.checked)} />
                  <span style={{ ...mono, fontSize: "10.5px", color: CREAM2 }}>
                    Keep this event private — my reflection only, excluded from coaching and the Crash Signature
                  </span>
                </label>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => add.mutate({ title: title.trim() || "Untitled crash", narrative, scope: privateScope ? "private" : "coaching" })}
                    disabled={add.isPending}
                    style={{ ...mono, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "13px 22px", background: CHAMPAGNE, color: INK, border: 0, borderRadius: "9px", cursor: "pointer" }}>
                    {add.isPending ? "Recording…" : "Seal it in the box"}
                  </button>
                  <button onClick={() => setAdding(false)} style={{ ...mono, fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.1em", color: MUTED, background: "none", border: 0, cursor: "pointer" }}>
                    Not now
                  </button>
                </div>
              </div>
            )}

            {/* Crash Signature */}
            {extracted.length >= 2 && (
              <div className="mb-6">
                <button onClick={() => build.mutate()} disabled={build.isPending}
                  style={{ ...mono, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "14px 24px", background: EMBER, color: CREAM, border: 0, borderRadius: "9px", cursor: "pointer", marginBottom: "18px" }}>
                  {build.isPending ? "Synthesizing across events…" : report ? "Rebuild my Crash Signature" : "Build my Crash Signature"}
                </button>
              </div>
            )}
            {report && (
              <div style={{ border: `1px solid ${EMBER}55`, borderRadius: "16px", background: "rgba(226,96,74,0.04)", padding: "clamp(22px,3vw,34px)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: EMBER, marginBottom: "10px" }}>
                  Your Crash Signature — the mechanism with receipts
                </p>
                <p style={{ ...serif, fontSize: "clamp(20px,3vw,27px)", lineHeight: 1.3, color: CREAM, marginBottom: "18px" }}>
                  &ldquo;{report.signature}&rdquo;
                </p>
                {Array.isArray(report.cascade) && report.cascade.length >= 6 && <CascadeDiagram stages={report.cascade} />}
                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  {[
                    ["Recurring failure modes", report.recurringModes, EMBER],
                    ["Leading indicators — see it coming", report.leadingIndicators, CHAMPAGNE],
                    ["Trigger conditions", report.triggerConditions, CHAMPAGNE],
                    ["Stop rules — hard IF-THENs", report.stopRules, JADE],
                  ].map(([label, items, color]) => Array.isArray(items) && (
                    <div key={label as string}>
                      <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: color as string, marginBottom: "6px" }}>{label as string}</p>
                      <ul className="space-y-1">{(items as string[]).map((it) => <li key={it} style={{ fontSize: "13px", lineHeight: 1.55, color: CREAM2 }}>— {it}</li>)}</ul>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-5">
                  {report.replacementBehavior && <p style={{ fontSize: "13.5px", color: CREAM2 }}><b style={{ color: JADE }}>Replacement behavior: </b>{report.replacementBehavior}</p>}
                  {report.accountability && <p style={{ fontSize: "13.5px", color: CREAM2 }}><b style={{ color: JADE }}>Accountability design: </b>{report.accountability}</p>}
                  {report.recoveryProtocol && <p style={{ fontSize: "13.5px", color: CREAM2 }}><b style={{ color: JADE }}>After the first slip: </b>{report.recoveryProtocol}</p>}
                  {Array.isArray(report.recurringLines) && report.recurringLines.length > 0 && (
                    <p style={{ fontSize: "13.5px", color: CREAM2 }}><b style={{ color: EMBER }}>The fault line: </b>{report.recurringLines.join(" · ")} — cross-checked against your assessment&rsquo;s Master Weakness on your report.</p>
                  )}
                </div>
              </div>
            )}

            <p style={{ ...mono, fontSize: "10px", color: MUTED, lineHeight: 1.7, marginTop: "28px" }}>
              Honesty contract: crashes annotate your map — they never lower a score. Nothing here is a diagnosis, and no
              one can promise a crash-free future; the measurable goal is to detect the pattern earlier and recover
              faster. Your narratives are never read by staff, never sold, and deletable any time. If any of this stirred
              something heavy: 988 (call/text, US) · Crisis Text Line — text HOME to 741741.
            </p>
          </>
        )}
      </div>
      {showCrisis && <CrisisSupport onClose={() => setShowCrisis(false)} />}
      <PublicFooter />
    </div>
  );
}
