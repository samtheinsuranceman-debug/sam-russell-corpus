// ============================================================
// WHAT THE GENOME SAYS TO DO — /portal/genome-strategies.
//
// The solid on the Wealth Genome page is a reading. This is the strategy list:
// every strategy this firm can evaluate, scored against the configuration,
// with the confidence shown beside every score and the gates shown separately
// from the scores.
//
// Three rules the layout enforces rather than states:
//   - A fit is never rendered without its confidence next to it.
//   - A blocked strategy renders as blocked no matter how well it fits.
//   - A product claim renders with its status, and an unconfirmed claim is
//     visibly unconfirmed rather than quietly present.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ShieldAlert, Lock, HelpCircle, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  fitAll, highestValueQuestions, FAMILY_ORDER, FAMILY_LABEL, FIT_DISCLOSURE,
  type StrategyFit, type HousePosition, type ProductClaim,
} from "@shared/genomeStrategyFit";
import { FACTORS, type FactorReading } from "@shared/wealthGenomeFactors";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const LABEL = "text-[11px] uppercase tracking-[0.18em] text-slate-400";

const HOUSE_LABEL: Record<HousePosition, string> = {
  implements: "We build this",
  "implements-with-conditions": "We build this, with conditions",
  declines: "We do not do this",
  "refers-out": "We refer this out",
};
const HOUSE_TONE: Record<HousePosition, string> = {
  implements: "border-emerald-400/40 text-emerald-200",
  "implements-with-conditions": "border-amber-400/40 text-amber-200",
  declines: "border-white/20 text-slate-400",
  "refers-out": "border-sky-400/35 text-sky-200",
};

const CLAIM_TONE: Record<ProductClaim["status"], string> = {
  confirmed: "border-emerald-400/35 text-emerald-200",
  unconfirmed: "border-amber-400/40 text-amber-200",
  "needs-correction": "border-rose-400/45 text-rose-200",
};
const CLAIM_LABEL: Record<ProductClaim["status"], string> = {
  confirmed: "confirmed",
  unconfirmed: "not confirmed",
  "needs-correction": "needs correcting",
};

/**
 * The fit bar. Its fill is the fit and its OPACITY is the confidence, so a
 * high score built on nothing looks like a ghost rather than like a finding.
 * That coupling is the point: the two numbers cannot be read apart.
 */
function FitBar({ fit, confidence }: { fit: number; confidence: number }) {
  const tone = fit >= 70 ? "bg-emerald-400" : fit >= 50 ? "bg-amber-400" : "bg-slate-500";
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
        <span className={`block h-full ${tone}`} style={{ width: `${fit}%`, opacity: 0.25 + confidence * 0.75 }} />
      </span>
      <span className="text-[13px] font-semibold tabular-nums text-white">{fit}%</span>
      <span className="text-[11px] tabular-nums text-slate-500">at {Math.round(confidence * 100)}% confidence</span>
    </div>
  );
}

function StrategyCard({ f }: { f: StrategyFit }) {
  const [open, setOpen] = useState(false);
  const s = f.strategy;
  const forDrivers = f.drivers.filter((d) => d.contribution > 0).slice(0, 3);
  const againstDrivers = f.drivers.filter((d) => d.contribution < 0).slice(0, 3);
  const unknownGates = f.gates.filter((g) => g.status === "unknown");
  const blockedGates = f.gates.filter((g) => g.status === "blocked");

  return (
    <article className={`${CARD} p-5 ${f.blocked ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16.5px] font-semibold text-white" style={{ textWrap: "balance" }}>{s.name}</h3>
          <p className="mt-1 max-w-[62ch] text-[13.5px] leading-relaxed text-slate-300">{s.oneLine}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em] ${HOUSE_TONE[s.housePosition]}`}>
          {HOUSE_LABEL[s.housePosition]}
        </span>
      </div>

      <div className="mt-3.5">
        <FitBar fit={f.fit} confidence={f.confidence} />
      </div>

      {f.blocked && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-400/40 bg-rose-400/[0.08] p-3">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" aria-hidden />
          <div className="text-[13px] leading-relaxed text-rose-100">
            <span className="font-semibold">Closed, not merely a poor fit. </span>
            {blockedGates.map((g) => g.gate.requirement).join("; ")}. A fit score above a closed gate is a promise
            nobody can keep, which is why this reads as blocked rather than as {f.fit}%.
          </div>
        </div>
      )}

      {f.allocation && !f.blocked && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <p className={LABEL}>How much, for this configuration</p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums text-amber-200">
            {f.allocation.minPct}%–{f.allocation.maxPct}%
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">{f.allocation.basis}</p>
        </div>
      )}

      {(forDrivers.length > 0 || againstDrivers.length > 0) && (
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          <div>
            <p className={LABEL}>What argues for it</p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {forDrivers.length === 0 && <li className="text-[13px] text-slate-500">Nothing yet — nothing has been read that supports it.</li>}
              {forDrivers.map((d) => (
                <li key={d.factorId} className="text-[13px] leading-relaxed text-slate-300">
                  <span className="text-emerald-300">{d.name}. </span>{d.why}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={LABEL}>What argues against it</p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {againstDrivers.length === 0 && <li className="text-[13px] text-slate-500">Nothing yet — which is not the same as nothing being wrong with it.</li>}
              {againstDrivers.map((d) => (
                <li key={d.factorId} className="text-[13px] leading-relaxed text-slate-300">
                  <span className="text-rose-300">{d.name}. </span>{d.why}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {f.unanswered.length > 0 && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
          <span className="text-amber-300/80">Not yet asked: </span>
          {f.unanswered.join(", ")}. Until these are read this score is a placeholder, not a finding.
        </p>
      )}

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
              className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] text-amber-300 hover:underline">
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        {open ? "Less" : "What this actually is, and who it is wrong for"}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3">
          {s.whatItIs.map((p, i) => (
            <p key={i} className="max-w-[68ch] text-[13.5px] leading-[1.7] text-slate-300">{p}</p>
          ))}

          <div className="rounded-lg border border-rose-400/25 bg-rose-400/[0.05] p-3">
            <p className={LABEL}>Who this is wrong for</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-slate-200">{s.whenItIsWrong}</p>
          </div>

          <div>
            <p className={LABEL}>{HOUSE_LABEL[s.housePosition]}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-slate-300">{s.housePositionWhy}</p>
          </div>

          {unknownGates.length > 0 && (
            <div>
              <p className={LABEL}>Open questions nobody has settled</p>
              <ul className="mt-1.5 flex flex-col gap-2">
                {unknownGates.map((g) => (
                  <li key={g.gate.id} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-300">
                    <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/70" aria-hidden />
                    <span><span className="text-white">{g.gate.requirement}.</span> {g.gate.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {s.claims.length > 0 && (
            <div>
              <p className={LABEL}>Figures attached to this, and where they stand</p>
              <ul className="mt-1.5 flex flex-col gap-2.5">
                {s.claims.map((c) => (
                  <li key={c.claim} className="rounded-lg border border-white/10 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[13.5px] italic leading-relaxed text-slate-300">&ldquo;{c.claim}&rdquo;</p>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] ${CLAIM_TONE[c.status]}`}>
                        {CLAIM_LABEL[c.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{c.note}</p>
                    {c.settledBy && (
                      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                        <span className="text-slate-400">What would settle it: </span>{c.settledBy}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {s.relatedPaths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {s.relatedPaths.map((p) => (
                <Link key={p} to={p}
                      className="rounded-full border border-amber-400/25 px-3 py-1 text-[12.5px] text-amber-200 hover:border-amber-400/60">
                  {p.replace("/portal/", "").replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/** Six readings, enough to show the engine working without pretending to be a client. */
const EXAMPLE: FactorReading[] = [
  { factorId: "time-horizon", score: 1.5, confidence: 0.85 },
  { factorId: "income-durability", score: 1.2, confidence: 0.8 },
  { factorId: "tax-posture", score: -1.5, confidence: 0.85 },
  { factorId: "emotional-durability", score: 0.8, confidence: 0.7 },
  { factorId: "attention-budget", score: 1.0, confidence: 0.75 },
  { factorId: "liquidity-need", score: 0.5, confidence: 0.6 },
];

export default function GenomeStrategies() {
  const [readings, setReadings] = useState<FactorReading[]>(EXAMPLE);
  const fits = useMemo(() => fitAll(readings), [readings]);
  const nextQuestions = useMemo(() => highestValueQuestions(readings, 5), [readings]);

  const set = (factorId: string, score: number) =>
    setReadings((rs) => {
      const rest = rs.filter((r) => r.factorId !== factorId);
      return score === 0 && !rs.some((r) => r.factorId === factorId)
        ? rs
        : [...rest, { factorId, score, confidence: 0.8 }];
    });
  const clear = (factorId: string) => setReadings((rs) => rs.filter((r) => r.factorId !== factorId));

  const answered = readings.length;
  const blocked = fits.filter((f) => f.blocked).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Wealth Genome</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            What the Genome Says to Do
          </h1>
          <p className="mt-3 max-w-[66ch] text-[15px] leading-relaxed text-slate-300">
            The solid on the genome page is a reading. This is the strategy list: every strategy this firm can
            evaluate, scored against the configuration, with the confidence shown beside every score — because a
            high fit built on four answers is a prompt to ask more questions, not a plan.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
            <Link to="/portal/wealth-genome" className="text-amber-300 hover:underline">← Back to the solid</Link>
            <span className="text-slate-600">·</span>
            <Link to="/portal/household-genome" className="text-amber-300 hover:underline">
              Married? Every fit below is read on one person — pair it
            </Link>
          </div>
        </header>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/[0.07] p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
          <p className="text-[13px] leading-relaxed text-slate-200">{FIT_DISCLOSURE}</p>
        </div>

        {/* ---- the configuration ---- */}
        <section className={`${CARD} mt-8 p-5`}>
          <h2 className="text-lg font-semibold text-amber-200">Set the configuration</h2>
          <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-slate-400">
            Every slider you leave alone is a question nobody asked, and the engine treats it that way: it
            contributes nothing to any score and drags the confidence down. {answered} of {FACTORS.length} read.
            {blocked > 0 && <> {blocked} {blocked === 1 ? "strategy is" : "strategies are"} closed on a gate.</>}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FACTORS.map((f) => {
              const r = readings.find((x) => x.factorId === f.id);
              return (
                <div key={f.id} className="rounded-lg border border-white/10 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor={`f-${f.id}`} className="text-[13px] font-medium text-white">{f.name}</label>
                    {r ? (
                      <button type="button" onClick={() => clear(f.id)} className="text-[11px] text-slate-500 hover:text-rose-300">
                        unset
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-600">not asked</span>
                    )}
                  </div>
                  <input id={`f-${f.id}`} type="range" min={-2} max={2} step={0.5}
                         value={r?.score ?? 0}
                         onChange={(e) => set(f.id, Number(e.target.value))}
                         className="mt-2 w-full accent-amber-400" />
                  <p className="mt-1 text-[11.5px] leading-snug text-slate-500">
                    {(r?.score ?? 0) >= 0 ? f.highMeans : f.lowMeans}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---- what to ask next ---- */}
        {nextQuestions.length > 0 && (
          <section className={`${CARD} mt-6 p-5`}>
            <h2 className="text-lg font-semibold text-amber-200">Ask these next</h2>
            <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-slate-400">
              Ranked by how much strategy weight is currently resting on an answer nobody has. This is the list
              that turns a picture into a conversation.
            </p>
            <ol className="mt-3 flex flex-col gap-2.5">
              {nextQuestions.map((q) => (
                <li key={q.factorId} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-[11px] tabular-nums text-amber-300/60">
                    {q.strategiesWaiting}×
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-slate-300">
                    <span className="text-white">{q.name}. </span>{q.question}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ---- the strategies ---- */}
        {FAMILY_ORDER.map((family) => {
          const inFamily = fits.filter((f) => f.strategy.family === family);
          if (!inFamily.length) return null;
          return (
            <section key={family} className="mt-10">
              <h2 className="border-b border-white/10 pb-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                {FAMILY_LABEL[family]}
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {inFamily.map((f) => <StrategyCard key={f.strategy.id} f={f} />)}
              </div>
            </section>
          );
        })}

        {/* ---- how to read it ---- */}
        <section className={`${CARD} mt-12 p-6`}>
          <h2 className="text-lg font-semibold text-amber-200">Reading this page</h2>
          <dl className="mt-4 flex flex-col gap-4 text-[13.5px] leading-relaxed">
            <div>
              <dt className="flex items-center gap-2 font-semibold text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden /> A fit is two numbers, never one
              </dt>
              <dd className="mt-1 text-slate-300">
                The bar's length is the fit and its opacity is the confidence. A long faint bar is a strategy that
                looks good because almost nothing has been asked about it. That is not a recommendation, it is a
                to-do list.
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-semibold text-white">
                <Lock className="h-4 w-4 text-rose-300" aria-hidden /> Blocked is not the same as a low score
              </dt>
              <dd className="mt-1 text-slate-300">
                A gate is a fact, not a preference. You cannot fund a policy you cannot be issued, and no fit
                percentage changes that. Blocked strategies sort to the end of their family and say what closed them.
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-semibold text-white">
                <HelpCircle className="h-4 w-4 text-amber-300" aria-hidden /> Unknown gates are shown, not assumed
              </dt>
              <dd className="mt-1 text-slate-300">
                Accreditation, a current-year tax liability, a local ordinance, a CPA willing to sign — nothing in
                a genome settles these. They render as open questions so a plan is never built on one quietly
                assumed true.
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-semibold text-white">
                <AlertTriangle className="h-4 w-4 text-rose-300" aria-hidden /> Figures carry their status
              </dt>
              <dd className="mt-1 text-slate-300">
                Bonus percentages, historical credits and carrier standings are recorded as claims with a status.
                An unconfirmed figure renders as unconfirmed and a claim that overstates renders with the
                correction attached. Nothing in this section repeats a sales number as though it were a finding.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </AppShell>
  );
}
