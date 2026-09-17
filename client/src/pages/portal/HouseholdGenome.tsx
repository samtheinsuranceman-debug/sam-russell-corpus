// ============================================================
// WEALTH GENOME PAIRING PROTOCOL — /portal/household-genome.
//
// Two genomes, one household, and the weighting between them. The page has to
// do three jobs and the third is the one most tools skip:
//
//   1. Take both partners' readings.
//   2. Show what they combine to, per pot of money.
//   3. EXPLAIN THE MECHANISM — how the split is derived, which factors are not
//      averaged and why, how much a veto is worth on this asset, and how
//      predictable any of it is. A couple being told "the model says 62%"
//      without being shown the arithmetic is a couple being managed.
//
// The consent gate is real: with one signature or none, the paired output does
// not render at all. That refusal is the safety feature, not an obstacle to it.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ShieldAlert, Handshake, Scale, AlertTriangle, Sparkles, Lock } from "lucide-react";
import {
  ASSET_CLASSES, COMBINATIONS, RULE_LABEL, assetClass, influenceA, vetoStrength,
  pairFactors, pairedReadings, pairingConfidence, frictionPoints, complementarities,
  temperament, PAIRING_DISCLOSURE, type Household, type CombinationRule, type PairedFactor,
} from "@shared/householdGenome";
import { FACTORS, type FactorReading } from "@shared/wealthGenomeFactors";
import { fitAll } from "@shared/genomeStrategyFit";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const LABEL = "text-[11px] uppercase tracking-[0.18em] text-slate-400";

const RULE_TONE: Record<CombinationRule, string> = {
  "weakest-link": "border-rose-400/40 text-rose-200",
  strongest: "border-emerald-400/35 text-emerald-200",
  longest: "border-sky-400/35 text-sky-200",
  weighted: "border-white/20 text-slate-300",
  owner: "border-amber-400/40 text-amber-200",
  pooled: "border-emerald-400/30 text-emerald-200/90",
};

const ALIGN_TONE: Record<PairedFactor["alignment"], string> = {
  aligned: "text-slate-500",
  divergent: "text-amber-300",
  opposed: "text-rose-300",
  unknown: "text-slate-600",
};

/** Two people on one axis, so a gap is seen rather than described. */
function GapBar({ a, b }: { a: number | null; b: number | null }) {
  const pos = (n: number) => `${((n + 2) / 4) * 100}%`;
  return (
    <div className="relative h-5 w-full rounded-full bg-white/[0.06]">
      <span className="absolute inset-y-0 left-1/2 w-px bg-white/15" aria-hidden />
      {a !== null && (
        <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300"
              style={{ left: pos(a) }} title={`A: ${a}`} />
      )}
      {b !== null && (
        <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-300 bg-transparent"
              style={{ left: pos(b) }} title={`B: ${b}`} />
      )}
    </div>
  );
}

const EXAMPLE_A: FactorReading[] = [
  { factorId: "emotional-durability", score: 1.8, confidence: 0.85 },
  { factorId: "time-horizon", score: 1.5, confidence: 0.85 },
  { factorId: "liquidity-need", score: 1.5, confidence: 0.8 },
  { factorId: "numeracy", score: 2, confidence: 0.9 },
  { factorId: "institutional-trust", score: 1.2, confidence: 0.8 },
  { factorId: "attention-budget", score: 1.5, confidence: 0.85 },
  { factorId: "longevity-expectation", score: 0.5, confidence: 0.6 },
  { factorId: "income-durability", score: 1.5, confidence: 0.85 },
  { factorId: "insurability", score: 1.5, confidence: 0.8 },
  { factorId: "tax-posture", score: -1.5, confidence: 0.8 },
];
const EXAMPLE_B: FactorReading[] = [
  { factorId: "emotional-durability", score: -1.5, confidence: 0.85 },
  { factorId: "time-horizon", score: 0.5, confidence: 0.8 },
  { factorId: "liquidity-need", score: -1.2, confidence: 0.85 },
  { factorId: "numeracy", score: -0.5, confidence: 0.8 },
  { factorId: "institutional-trust", score: -1.8, confidence: 0.85 },
  { factorId: "attention-budget", score: -1.0, confidence: 0.8 },
  { factorId: "longevity-expectation", score: 1.8, confidence: 0.7 },
  { factorId: "income-durability", score: 0.5, confidence: 0.8 },
  { factorId: "insurability", score: 0.5, confidence: 0.6 },
  { factorId: "tax-posture", score: -1.2, confidence: 0.7 },
];

export default function HouseholdGenome() {
  const [labelA, setLabelA] = useState("Partner A");
  const [labelB, setLabelB] = useState("Partner B");
  const [readingsA, setReadingsA] = useState<FactorReading[]>(EXAMPLE_A);
  const [readingsB, setReadingsB] = useState<FactorReading[]>(EXAMPLE_B);
  const [potId, setPotId] = useState(ASSET_CLASSES[0]!.id);
  const [agreedA, setAgreedA] = useState(false);
  const [agreedB, setAgreedB] = useState(false);

  const household: Household = useMemo(() => ({
    labelA, labelB, readingsA, readingsB,
    consents: [{ assetClassId: potId, agreedByA: agreedA, agreedByB: agreedB, asOf: new Date().toISOString().slice(0, 10) }],
  }), [labelA, labelB, readingsA, readingsB, potId, agreedA, agreedB]);

  const pot = assetClass(potId)!;
  const { paired, influence, consented } = useMemo(() => pairFactors(household, potId), [household, potId]);
  const conf = useMemo(() => pairingConfidence(household), [household]);
  const friction = useMemo(() => frictionPoints(household, potId, 5), [household, potId]);
  const complements = useMemo(() => complementarities(household, potId), [household, potId]);
  const temp = useMemo(() => temperament(household, potId), [household, potId]);
  const readings = useMemo(() => pairedReadings(household, potId), [household, potId]);
  const fits = useMemo(() => (readings ? fitAll(readings).slice(0, 6) : []), [readings]);

  const setScore = (which: "A" | "B", factorId: string, score: number) => {
    const setter = which === "A" ? setReadingsA : setReadingsB;
    setter((rs) => [...rs.filter((r) => r.factorId !== factorId), { factorId, score, confidence: 0.8 }]);
  };
  const clearScore = (which: "A" | "B", factorId: string) => {
    const setter = which === "A" ? setReadingsA : setReadingsB;
    setter((rs) => rs.filter((r) => r.factorId !== factorId));
  };

  const veto = vetoStrength(influence);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Wealth Genome</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            Measurement, Pairing and Selection Protocol
          </h1>
          <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-slate-300">
            A genome read on one spouse and acted on for a household is a recommendation engine for marital
            conflict. It will confidently propose a strategy one person can hold and the other cannot, and the
            failure arrives in year two looking like a market problem when it was a household problem all along.
            This is the protocol that stops that: two readings, a weighting derived from who actually owns and
            bears each pot, and both signatures before any blended number exists.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
            <Link to="/portal/wealth-genome" className="text-amber-300 hover:underline">The solid</Link>
            <span className="text-slate-600">·</span>
            <Link to="/portal/genome-strategies" className="text-amber-300 hover:underline">What the genome says to do</Link>
          </div>
        </header>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/[0.07] p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
          <p className="text-[13px] leading-relaxed text-slate-200">{PAIRING_DISCLOSURE}</p>
        </div>

        {/* ═══ 1. HOW IT IS CREATED ═══ */}
        <section className={`${CARD} mt-8 p-6`}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-200">
            <Scale className="h-4 w-4" aria-hidden /> How the weighting is created
          </h2>
          <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-300">
            Influence is derived, not decreed. Three inputs, each running from zero to one toward the first
            partner: <span className="text-white">title</span> — whose name is on it;{" "}
            <span className="text-white">exposure</span> — who actually bears the loss if it goes wrong; and{" "}
            <span className="text-white">dependence</span> — who relies on it for their own security.
          </p>
          <p className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3 text-center text-[14px] tabular-nums text-amber-200">
            influence = title × 0.50 &nbsp;+&nbsp; exposure × 0.25 &nbsp;+&nbsp; dependence × 0.25
          </p>
          <p className="mt-3 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-300">
            Title carries half, because ownership is real and a spouse should not be able to direct an account
            that is not theirs. The other half splits between exposure and dependence, because a retirement
            account accumulated during a marriage is marital property in substance nearly everywhere even when
            it is individual in name — and because the person who will live on the money has a stake in it
            whatever the registration says. Run it on a titled IRA: title 1.0, exposure 0.5, dependence 0.5
            gives <span className="text-white">0.75</span>. Three-quarters to the holder. That is the split most
            couples reach on their own, arrived at here from a principle rather than from a preference.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className={`${LABEL} pb-2 font-normal`}>Pot of money</th>
                  <th className={`${LABEL} pb-2 text-right font-normal`}>Title</th>
                  <th className={`${LABEL} pb-2 text-right font-normal`}>Exposure</th>
                  <th className={`${LABEL} pb-2 text-right font-normal`}>Dependence</th>
                  <th className={`${LABEL} pb-2 text-right font-normal`}>Split</th>
                  <th className={`${LABEL} pb-2 text-right font-normal`}>Veto force</th>
                </tr>
              </thead>
              <tbody>
                {ASSET_CLASSES.map((a) => {
                  const inf = influenceA(a);
                  return (
                    <tr key={a.id} className={`border-b border-white/5 ${a.id === potId ? "bg-amber-400/[0.06]" : ""}`}>
                      <td className="py-2 pr-3 text-slate-200">{a.name}</td>
                      <td className="py-2 text-right tabular-nums text-slate-400">{a.title.toFixed(2)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-400">{a.exposure.toFixed(2)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-400">{a.dependence.toFixed(2)}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-amber-200">
                        {Math.round(inf * 100)} / {100 - Math.round(inf * 100)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-slate-300">{Math.round(vetoStrength(inf) * 100)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-[68ch] text-[12.5px] leading-relaxed text-slate-500">
            Veto force is the last column and it is the number a couple will actually argue about. A weakest-link
            factor does not become an unconditional minimum — it pulls toward the more cautious partner's reading
            in proportion to how much of the asset they hold. On a joint account that pull is total: either of
            them can simply stop it. On a titled IRA it is half. On a business one partner owns and personally
            guarantees, about a third. The objection never disappears; its force scales with the stake.
          </p>
        </section>

        {/* ═══ 2. WHAT IS MEASURED AND HOW IT COMBINES ═══ */}
        <section className={`${CARD} mt-6 p-6`}>
          <h2 className="text-lg font-semibold text-amber-200">What is measured, and why most of it is not averaged</h2>
          <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-300">
            Twenty-one factors, and {COMBINATIONS.filter((c) => c.rule !== "weighted").length} of them do not
            combine by averaging. That is the substance of this protocol. Averaging two emotional-durability
            readings produces a number describing nobody: if one partner will sell in a drawdown then the
            household sells in a drawdown, and the mean of +2 and −2 is not 0, it is −2. But averaging two time
            horizons is wrong in the other direction — the money has to last for whoever is still here, so the
            longer one governs. And numeracy is different again, because one partner who can do the arithmetic
            can do it for both.
          </p>
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {COMBINATIONS.map((c) => {
              const f = FACTORS.find((x) => x.id === c.factorId)!;
              return (
                <div key={c.factorId} className="rounded-lg border border-white/10 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[13.5px] font-medium text-white">{f.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] ${RULE_TONE[c.rule]}`}>
                      {RULE_LABEL[c.rule]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">{c.why}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ 3. THE TWO QUESTIONNAIRES ═══ */}
        <section className={`${CARD} mt-6 p-6`}>
          <h2 className="text-lg font-semibold text-amber-200">Both questionnaires</h2>
          <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-300">
            Each partner answers separately, before comparing. That ordering is deliberate: an answer given in
            front of a spouse is an answer about the marriage as well as about money, and the divergences this
            protocol exists to find are precisely the ones a joint interview smooths away.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="name-a" className={LABEL}>First partner</label>
              <input id="name-a" value={labelA} onChange={(e) => setLabelA(e.target.value)}
                     className="mt-1 w-full rounded-lg border border-amber-400/30 bg-black/30 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="name-b" className={LABEL}>Second partner</label>
              <input id="name-b" value={labelB} onChange={(e) => setLabelB(e.target.value)}
                     className="mt-1 w-full rounded-lg border border-sky-400/30 bg-black/30 px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {FACTORS.map((f) => {
              const rA = readingsA.find((r) => r.factorId === f.id);
              const rB = readingsB.find((r) => r.factorId === f.id);
              const p = paired.find((x) => x.factorId === f.id)!;
              return (
                <div key={f.id} className="rounded-lg border border-white/10 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[13.5px] font-medium text-white">{f.name}</span>
                    <span className={`text-[11px] uppercase tracking-[0.12em] ${ALIGN_TONE[p.alignment]}`}>
                      {p.alignment}{p.gap !== null ? ` · gap ${p.gap}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{f.question}</p>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    {(["A", "B"] as const).map((side) => {
                      const r = side === "A" ? rA : rB;
                      const name = side === "A" ? labelA : labelB;
                      return (
                        <div key={side} className="flex items-center gap-2">
                          <span className={`w-20 shrink-0 truncate text-[11.5px] ${side === "A" ? "text-amber-300" : "text-sky-300"}`}>{name}</span>
                          <input type="range" min={-2} max={2} step={0.5} value={r?.score ?? 0}
                                 aria-label={`${name}: ${f.name}`}
                                 onChange={(e) => setScore(side, f.id, Number(e.target.value))}
                                 className={`w-full ${side === "A" ? "accent-amber-400" : "accent-sky-400"}`} />
                          <button type="button" onClick={() => clearScore(side, f.id)}
                                  className="shrink-0 text-[10.5px] text-slate-600 hover:text-rose-300">
                            {r ? "unset" : "—"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2.5"><GapBar a={p.scoreA} b={p.scoreB} /></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ 4. THE POT, AND CONSENT ═══ */}
        <section className={`${CARD} mt-6 p-6`}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-200">
            <Handshake className="h-4 w-4" aria-hidden /> Which pot, and do you both agree to the split
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {ASSET_CLASSES.map((a) => (
              <button key={a.id} type="button" onClick={() => { setPotId(a.id); setAgreedA(false); setAgreedB(false); }}
                      aria-pressed={potId === a.id}
                      className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                        potId === a.id ? "border-amber-400/70 bg-amber-400/15 text-amber-100"
                                       : "border-white/15 text-slate-300 hover:border-amber-400/40"}`}>
                {a.name}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-[13.5px] leading-relaxed text-slate-300">{pot.what}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300">{pot.why}</p>
            <p className="mt-3 text-[15px] font-semibold tabular-nums text-amber-200">
              {labelA} {Math.round(influence * 100)}% &nbsp;·&nbsp; {labelB} {100 - Math.round(influence * 100)}%
              <span className="ml-3 text-[13px] font-normal text-slate-400">
                objection carries {Math.round(veto * 100)}% of full force
              </span>
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([["A", agreedA, setAgreedA, labelA], ["B", agreedB, setAgreedB, labelB]] as const).map(([side, val, set, name]) => (
              <label key={side} htmlFor={`consent-${side}`}
                     className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 ${
                       val ? "border-emerald-400/45 bg-emerald-400/[0.07]" : "border-white/15"}`}>
                <input id={`consent-${side}`} type="checkbox" checked={val}
                       onChange={(e) => (set as (b: boolean) => void)(e.target.checked)}
                       className="mt-0.5 h-4 w-4 accent-emerald-400" />
                <span className="text-[13px] leading-relaxed text-slate-200">
                  <span className="font-medium text-white">{name}</span> agrees this split is a fair description of
                  who owns, who bears and who depends on this pot.
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* ═══ 5. THE OUTPUT, OR THE REFUSAL ═══ */}
        {!consented ? (
          <section className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/[0.07] p-6">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-amber-200">Nothing is blended until both of you agree</h2>
              <p className="mt-2 max-w-[66ch] text-[13.5px] leading-relaxed text-slate-200">
                This is the safety feature, not an obstacle to it. A tool that blends two people's answers and
                prints an authoritative-looking number is a tool one spouse can use to win an argument with the
                other — and the weighting is exactly the step where that would happen invisibly. Making it
                explicit and mutual means the disagreement happens over the weights, in the open, before anyone
                is holding a chart. Tick both boxes above when the split is one you both recognise; change it
                first if it is not.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className={`${CARD} mt-6 p-6`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-amber-200">How predictable this is</h2>
                <span className="text-[13px] tabular-nums text-slate-400">
                  {conf.answeredBoth} of {conf.total} answered on both sides · {conf.answeredA}/{conf.answeredB} one-sided
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="h-2.5 w-44 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full bg-amber-400" style={{ width: `${conf.value * 100}%` }} />
                </span>
                <span className="text-[16px] font-semibold tabular-nums text-white">{Math.round(conf.value * 100)}%</span>
              </div>
              <p className="mt-2.5 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-300">{conf.verdict}</p>
              <p className="mt-3 max-w-[68ch] text-[12.5px] leading-relaxed text-slate-500">
                A one-sided answer counts for a quarter of a two-sided one, because it lets the model guess where
                it does not know. And be clear about what any of this predicts: which conversations will be hard,
                and which strategies will fail on a household objection rather than on arithmetic. It does not
                predict what either person will do, what returns will happen, or who is right.
              </p>
            </section>

            <section className="mt-6 grid gap-3 lg:grid-cols-2">
              <div className={`${CARD} p-6`}>
                <h2 className="text-lg font-semibold text-amber-200">Comfort and appetite, for this pot</h2>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {([["Comfort", temp.comfort, "text-emerald-300"], ["Appetite", temp.appetite, "text-sky-300"],
                     ["Overreach", temp.overreach, temp.overreach >= 20 ? "text-rose-300" : "text-slate-300"]] as const).map(([k, v, tone]) => (
                    <div key={k} className="rounded-lg border border-white/10 p-3">
                      <dt className={LABEL}>{k}</dt>
                      <dd className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[13.5px] leading-relaxed text-slate-300">{temp.verdict}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
                  Comfort is what this household can hold without breaking, and the weakest-link factors dominate
                  it deliberately, because they are what breaks. Appetite is what they want before comfort
                  constrains it. These move with the pot — the same two people read differently on a titled
                  retirement account than on the joint chequing, which is the whole reason this page asks which
                  pot before it answers anything.
                </p>
              </div>

              <div className={`${CARD} p-6`}>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-200">
                  <Sparkles className="h-4 w-4" aria-hidden /> Where the difference helps
                </h2>
                {complements.length === 0 ? (
                  <p className="mt-3 text-[13.5px] leading-relaxed text-slate-400">
                    No complementary differences found yet. That is usually a sign of an incomplete reading rather
                    than of two identical people.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-3">
                    {complements.map((c) => (
                      <li key={c.factorId} className="rounded-lg border border-emerald-400/25 bg-emerald-400/[0.05] p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-[13.5px] font-medium text-white">{c.name}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] ${RULE_TONE[c.rule]}`}>
                            {RULE_LABEL[c.rule]}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">{c.reading}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className={`${CARD} mt-6 p-6`}>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-200">
                <AlertTriangle className="h-4 w-4" aria-hidden /> The conversations to have first
              </h2>
              <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-400">
                Ranked by what each gap will actually cost, not by its size. A two-point difference on a factor
                where the stronger partner simply carries it is worth naming and then forgetting. A two-point
                difference on a weakest-link factor is the thing that ends a plan.
              </p>
              {friction.length === 0 ? (
                <p className="mt-3 text-[13.5px] text-slate-400">No material friction found on the answers given so far.</p>
              ) : (
                <ol className="mt-4 flex flex-col gap-3">
                  {friction.map((f, i) => (
                    <li key={f.factorId} className="rounded-xl border border-rose-400/25 bg-rose-400/[0.05] p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[14.5px] font-semibold text-white">
                          <span className="mr-2 text-[12px] tabular-nums text-rose-300/70">{i + 1}</span>{f.name}
                        </span>
                        <span className="text-[11px] tabular-nums text-slate-500">
                          gap {f.gap} · {RULE_LABEL[f.rule].toLowerCase()} · cost {f.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300">{f.reading}</p>
                      <p className="mt-2 rounded-lg border border-white/10 bg-black/25 p-3 text-[13.5px] leading-relaxed text-amber-100">
                        <span className={LABEL}>Ask them together: </span>{f.conversation}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className={`${CARD} mt-6 p-6`}>
              <h2 className="text-lg font-semibold text-amber-200">What this pot can actually do</h2>
              <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-400">
                The twenty-four strategies scored against the paired reading for {pot.name.toLowerCase()}. Move to
                a different pot and these change, because the weighting changes — which is the point.
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {fits.map((f) => (
                  <Link key={f.strategy.id} to="/portal/genome-strategies"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3 hover:border-amber-400/40">
                    <span className="text-[13.5px] text-white">{f.strategy.name}</span>
                    <span className="flex items-center gap-2.5">
                      <span className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                        <span className="block h-full bg-emerald-400" style={{ width: `${f.fit}%`, opacity: 0.25 + f.confidence * 0.75 }} />
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums text-white">{f.fit}%</span>
                      <span className="text-[11px] tabular-nums text-slate-500">at {Math.round(f.confidence * 100)}%</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
