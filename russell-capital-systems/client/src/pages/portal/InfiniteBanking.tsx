// ============================================================
// INFINITE BANKING — /portal/infinite-banking.
//
// The page answers three questions in order, and the order is the argument:
//
//   1. What is infinite banking, actually — including the correction every
//      reputable source makes and most marketing does not.
//   2. What are the five mechanisms, what does each one relieve, and what
//      stops each one.
//   3. What happens when you run them for twenty years — which is the cycle
//      simulator, and its headline output is the year the sequence breaks.
//
// Then eighty scenarios: which combinations are worth running, in what order,
// for whom, and what emerges that no single mechanism produces.
//
// The word "infinite" appears in the title because that is what people search
// for. Nothing on this page claims a cycle is infinite, and a test asserts no
// simulator verdict ever uses the word.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ShieldAlert, Repeat, AlertTriangle, HelpCircle, ChevronDown, Layers } from "lucide-react";
import {
  MECHANISMS, MECHANISM_ORDER, mechanism, simulateCycle, DEFAULT_CYCLE,
  CYCLE_DISCLOSURE, INFINITE_BANKING_QUESTIONS, INFINITE_BANKING_DEFINITION,
  type CycleInput, type MechanismId,
} from "@shared/cycleEngine";
import {
  SCENARIOS, TIER_ORDER, TIER_LABEL, byTier, heaviestInfluences,
  type Scenario, type CombinationTier,
} from "@shared/cycleScenarios";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const LABEL = "text-[11px] uppercase tracking-[0.18em] text-slate-400";
const INPUT = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white tabular-nums";
const usd = (n: number) => (Number.isFinite(n) ? `$${Math.round(n).toLocaleString("en-US")}` : "—");
const short = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n / 1e3)}k`);

const MECH_SHORT: Record<MechanismId, string> = {
  "policy-loan": "Policy", "velocity-heloc": "Velocity", "brrrr-dscr": "BRRRR",
  "equity-share": "Equity share", "seller-wrap": "Wrap",
};

function InfluenceBar({ score }: { score: number }) {
  const tone = score >= 9 ? "bg-rose-400" : score >= 7 ? "bg-amber-400" : "bg-slate-500";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
        <span className={`block h-full ${tone}`} style={{ width: `${score * 10}%` }} />
      </span>
      <span className="text-[11px] tabular-nums text-slate-400">{score}</span>
    </span>
  );
}

function SequenceChips({ seq }: { seq: readonly MechanismId[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {seq.map((id, i) => (
        <span key={`${id}-${i}`} className="inline-flex items-center gap-1">
          <span className="rounded border border-white/15 px-1.5 py-0.5 text-[10.5px] text-slate-300">{MECH_SHORT[id]}</span>
          {i < seq.length - 1 && <span className="text-slate-600">→</span>}
        </span>
      ))}
    </span>
  );
}

function ScenarioCard({ s }: { s: Scenario }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`${CARD} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15.5px] font-semibold text-white" style={{ textWrap: "balance" }}>{s.title}</h3>
          <div className="mt-1.5"><SequenceChips seq={s.sequence} /></div>
        </div>
        <span className="shrink-0 text-[10.5px] uppercase tracking-[0.12em] text-slate-500">
          seq rank {s.sequenceRank}
        </span>
      </div>
      <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-300"><span className="text-slate-500">Who: </span>{s.who}</p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300"><span className="text-rose-300/80">Bottleneck: </span>{s.bottleneck}</p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300"><span className="text-emerald-300/80">Relieves: </span>{s.relieves}</p>

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-amber-300 hover:underline">
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        {open ? "Less" : "Sequencing, interaction, what emerges, and what to watch"}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3">
          <p className="text-[13.5px] leading-relaxed text-slate-300"><span className={LABEL}>Why this order: </span>{s.whyThisOrder}</p>
          <p className="text-[13.5px] leading-relaxed text-slate-300"><span className={LABEL}>How they interact: </span>{s.interaction}</p>
          <p className="rounded-lg border border-emerald-400/25 bg-emerald-400/[0.05] p-3 text-[13.5px] leading-relaxed text-slate-200">
            <span className={LABEL}>Emergent property: </span>{s.emergent}
          </p>
          <div>
            <p className={LABEL}>What decides whether this applies</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {[...s.influences].sort((a, b) => b.score - a.score).map((i) => (
                <li key={i.factor} className="flex flex-wrap items-baseline gap-2 text-[13px] leading-relaxed text-slate-300">
                  <InfluenceBar score={i.score} />
                  <span className="text-white">{i.factor}.</span>
                  <span className="text-slate-400">{i.why}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="rounded-lg border border-rose-400/25 bg-rose-400/[0.05] p-3 text-[13.5px] leading-relaxed text-slate-200">
            <span className={LABEL}>Watch for: </span>{s.watchFor}
          </p>
        </div>
      )}
    </article>
  );
}

export default function InfiniteBanking() {
  const [cfg, setCfg] = useState<CycleInput>(DEFAULT_CYCLE);
  const [tier, setTier] = useState<CombinationTier>("pair");
  const sim = useMemo(() => simulateCycle(cfg), [cfg]);
  const scenarios = useMemo(() => byTier(tier), [tier]);
  const heaviest = useMemo(() => heaviestInfluences(8), []);

  const set = <K extends keyof CycleInput>(k: K, v: CycleInput[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const num = (s: string) => { const n = Number(s.replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };
  const toggle = (id: MechanismId) =>
    setCfg((c) => ({
      ...c,
      sequence: c.sequence.includes(id) ? c.sequence.filter((x) => x !== id) : [...c.sequence, id],
    }));

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Capital cycles</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            Infinite Banking
          </h1>
          <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-slate-300">
            {INFINITE_BANKING_DEFINITION}
          </p>
        </header>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/[0.07] p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
          <p className="text-[13px] leading-relaxed text-slate-200">{CYCLE_DISCLOSURE}</p>
        </div>

        {/* ═══ WHAT PEOPLE ASK ═══ */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
            <HelpCircle className="h-4 w-4" aria-hidden /> What people actually ask
          </h2>
          <p className="mt-2 max-w-[66ch] text-[13px] leading-relaxed text-slate-400">
            The five questions people put into a search engine about this, answered honestly. The correction every
            reputable source makes and most marketing does not: you borrow <em>from</em> the insurance company{" "}
            <em>against</em> your cash value. You are not borrowing from yourself and you are not paying yourself
            interest — the interest goes to the insurer. That is fine, and it is not what the advertisements say.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {INFINITE_BANKING_QUESTIONS.map((q) => (
              <div key={q.question} className={`${CARD} p-5`}>
                <h3 className="text-[16px] font-semibold text-white" style={{ textWrap: "balance" }}>{q.question}</h3>
                <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-300">{q.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ THE MECHANISMS ═══ */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
            <Layers className="h-4 w-4" aria-hidden /> The five mechanisms
          </h2>
          <p className="mt-2 max-w-[66ch] text-[13px] leading-relaxed text-slate-400">
            Each one relieves a different constraint and each one has a bottleneck. The field that matters most is
            whether the obligation <span className="text-white">amortises</span>: an obligation that pays itself
            down can be stacked, and one that does not accumulates into a ladder of settlement dates.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {MECHANISMS.map((m) => (
              <article key={m.id} className={`${CARD} p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-[16.5px] font-semibold text-white" style={{ textWrap: "balance" }}>{m.name}</h3>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em] ${
                    m.amortises ? "border-emerald-400/40 text-emerald-200" : "border-rose-400/40 text-rose-200"}`}>
                    {m.amortises ? "amortises" : `settles in ${m.settlementYears ?? "—"} yrs`}
                  </span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300">{m.oneLine}</p>
                <div className="mt-3 flex flex-col gap-3">
                  {m.what.map((p, i) => (
                    <p key={i} className="max-w-[68ch] text-[13.5px] leading-[1.7] text-slate-300">{p}</p>
                  ))}
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
                  <div><dt className={LABEL}>What it relieves</dt><dd className="text-slate-300">{m.relieves}</dd></div>
                  <div><dt className={LABEL}>What stops it</dt><dd className="text-slate-300">{m.bottleneck}</dd></div>
                  <div><dt className={LABEL}>Cost of capital</dt>
                       <dd className="text-slate-300">{(m.costOfCapital.low * 100).toFixed(1)}%–{(m.costOfCapital.high * 100).toFixed(1)}%. {m.costOfCapital.note}</dd></div>
                  <div><dt className={LABEL}>One turn · ramp</dt>
                       <dd className="text-slate-300 tabular-nums">{m.turnMonths.fast}–{m.turnMonths.slow} months · {m.rampYears} yr ramp</dd></div>
                </dl>
                {m.relatedPaths.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.relatedPaths.map((p) => (
                      <Link key={p} to={p} className="rounded-full border border-amber-400/25 px-3 py-1 text-[12px] text-amber-200 hover:border-amber-400/60">
                        {p.replace("/portal/", "").replace(/-/g, " ")}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ═══ THE SIMULATOR ═══ */}
        <section className={`${CARD} mt-12 p-6`}>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-amber-200">
            <Repeat className="h-4 w-4" aria-hidden /> Run the cycle
          </h2>
          <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-300">
            Pick a sequence and run it for twenty years. The output that matters is the{" "}
            <span className="text-white">break year</span> — the first year settlements due exceed what the
            household can produce. That is not a market event. It is the cadence itself, and it is the thing no
            spreadsheet version of this ever shows.
          </p>

          <div className="mt-5">
            <p className={LABEL}>Sequence</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MECHANISM_ORDER.map((id) => {
                const on = cfg.sequence.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggle(id)} aria-pressed={on}
                          className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                            on ? "border-amber-400/70 bg-amber-400/15 text-amber-100"
                               : "border-white/15 text-slate-300 hover:border-amber-400/40"}`}>
                    {mechanism(id)!.shortName}
                  </button>
                );
              })}
            </div>
            {cfg.sequence.length > 0 && (
              <p className="mt-2 text-[12.5px] text-slate-500">Runs in this order, repeating: <SequenceChips seq={cfg.sequence} /></p>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {([
              ["ib-a", "Starting asset", String(cfg.startingAsset), (v: string) => set("startingAsset", num(v))],
              ["ib-y", "Years", String(cfg.years), (v: string) => set("years", Math.max(1, Math.min(40, num(v))))],
              ["ib-ap", "Appreciation %", String((cfg.appreciation * 100).toFixed(1)), (v: string) => set("appreciation", num(v) / 100)],
              ["ib-s", "Annual surplus", String(cfg.annualSurplus), (v: string) => set("annualSurplus", num(v))],
              ["ib-r", "Starting reserve", String(cfg.reserve), (v: string) => set("reserve", num(v))],
              ["ib-u", "Renovation uplift ×", String(cfg.renovationUplift), (v: string) => set("renovationUplift", Math.max(1, num(v)))],
              ["ib-rd", "Redeploy %", String((cfg.redeployRate * 100).toFixed(0)), (v: string) => set("redeployRate", Math.min(1, Math.max(0, num(v) / 100)))],
              ["ib-f", "Reserve floor, months", String(cfg.reserveFloorMonths), (v: string) => set("reserveFloorMonths", Math.max(0, num(v)))],
            ] as const).map(([id, label, val, on]) => (
              <div key={id}>
                <label className={LABEL} htmlFor={id}>{label}</label>
                <input id={id} className={`${INPUT} mt-1`} inputMode="decimal" value={val}
                       onChange={(e) => (on as (s: string) => void)(e.target.value)} />
              </div>
            ))}
            <div>
              <label className={LABEL} htmlFor="ib-p">Pace</label>
              <select id="ib-p" className={`${INPUT} mt-1`} value={cfg.pace}
                      onChange={(e) => set("pace", e.target.value as CycleInput["pace"])}>
                <option value="fast">Fast</option><option value="typical">Typical</option><option value="slow">Slow</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] tabular-nums text-slate-300">
                <dt>Turns completed</dt><dd className="text-right text-white">{sim.turnsCompleted}</dd>
                <dt>Capital released</dt><dd className="text-right text-white">{short(sim.totalReleased)}</dd>
                <dt>Obligations created</dt><dd className="text-right text-rose-300">{short(sim.totalObligations)}</dd>
                <dt>Amortising share</dt><dd className="text-right text-white">{Math.round(sim.amortisingShare * 100)}%</dd>
                <dt className="border-t border-white/10 pt-1.5">Break year</dt>
                <dd className={`border-t border-white/10 pt-1.5 text-right font-semibold ${sim.breakYear ? "text-rose-300" : "text-emerald-300"}`}>
                  {sim.breakYear ?? "none in range"}
                </dd>
                <dt>Peak settlement</dt><dd className="text-right text-white">{usd(sim.peakObligation)}{sim.peakObligationYear ? ` (yr ${sim.peakObligationYear})` : ""}</dd>
                <dt>Cluster years</dt><dd className="text-right text-amber-300">{sim.clusterYears.length ? sim.clusterYears.join(", ") : "none"}</dd>
              </dl>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className={LABEL}>Settlements landing by year</p>
              <div className="mt-3 flex h-28 items-end gap-[3px]">
                {sim.years.map((y) => {
                  const max = Math.max(1, sim.peakObligation);
                  const h = Math.max(2, (y.obligationsDue / max) * 100);
                  return (
                    <span key={y.year} title={`Year ${y.year}: ${usd(y.obligationsDue)}`}
                          className={`flex-1 rounded-t ${y.stressed ? "bg-rose-400" : y.obligationsDue > 0 ? "bg-amber-400/70" : "bg-white/10"}`}
                          style={{ height: `${h}%` }} />
                  );
                })}
              </div>
              <p className="mt-2 text-[11.5px] text-slate-500">
                Red is a year the household cannot meet what landed. Grey years are quiet — and on a
                non-amortising sequence the quiet years are the ones building the cluster.
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4 text-[13.5px] leading-relaxed text-amber-100">
            {sim.verdict}
          </p>
          <p className="mt-3 max-w-[68ch] text-[12.5px] leading-relaxed text-slate-500">
            Two inputs decide almost everything. <span className="text-slate-400">Renovation uplift</span> below
            about 1.34 means a BRRRR cycle shrinks every turn — which is why operators talk about the buy rather
            than the refinance. And <span className="text-slate-400">redeploy percentage</span> is what separates
            a cycle from a savings plan: set it to zero and most sequences survive, set it to ninety and the
            settlements arrive with the money already in the ground.
          </p>
        </section>

        {/* ═══ THE SCENARIOS ═══ */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
            <AlertTriangle className="h-4 w-4" aria-hidden /> {SCENARIOS.length} combinations, sequenced
          </h2>
          <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-slate-400">
            A combination is worth running when one member relieves another's bottleneck — velocity produces the
            surplus BRRRR lacks, BRRRR produces the capital a policy needs, a policy produces borrowing that needs
            nobody's permission. Sequence is not decoration: the same set in a different order is a different
            strategy with a different failure mode, which is why the lower-ranked orders are here too.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TIER_ORDER.map((t) => (
              <button key={t} type="button" onClick={() => setTier(t)} aria-pressed={tier === t}
                      className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                        tier === t ? "border-amber-400/70 bg-amber-400/15 text-amber-100"
                                   : "border-white/15 text-slate-300 hover:border-amber-400/40"}`}>
                {TIER_LABEL[t]} <span className="text-slate-500">{byTier(t).length}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {scenarios.map((s) => <ScenarioCard key={s.id} s={s} />)}
          </div>
        </section>

        {/* ═══ WHAT DECIDES EVERYTHING ═══ */}
        <section className={`${CARD} mt-12 p-6`}>
          <h2 className="text-lg font-semibold text-amber-200">What decides these, across all {SCENARIOS.length}</h2>
          <p className="mt-2 max-w-[66ch] text-[13px] leading-relaxed text-slate-400">
            Ranked by how often a factor appears and how heavily it scores when it does. If a client can only
            establish a handful of things before a plan is chosen, these are the ones worth establishing.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {heaviest.map((h) => (
              <li key={h.factor} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3">
                <span className="text-[13.5px] text-white">{h.factor}</span>
                <span className="flex items-center gap-3 text-[12px] tabular-nums text-slate-400">
                  <span>{h.appearances} scenarios</span>
                  <InfluenceBar score={h.meanScore} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
