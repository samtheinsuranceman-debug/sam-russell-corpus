// ============================================================
// THE SPECIALTY PAGE — /for/:slug. A landing page and a working ledger for
// one kind of doctor: the training with its citations, the record (BLS by
// state, NCES tuition), the cost of becoming one and what the training
// years forgo, the peer comparison from figures peers entered, the vision
// questions the plan is built from, and the sources. Public.
// ============================================================
import { useMemo, useState, type ReactNode } from "react";
import { Link, useRoute } from "wouter";
import PageBackdrop from "@/components/PageBackdrop";
import { trpc } from "@/lib/trpc";
import { FAMILY_LABEL, PEER_FIELDS, VISION_QUESTIONS, careerPath, loanRateFor, opportunityCost, repayment, trainingCost, trainingYears } from "@shared/careerEngine";
import { BookOpen, Calculator, Compass, ExternalLink, Landmark, Mic, Stethoscope, Users } from "lucide-react";

const CARD = "rounded-2xl border border-emerald-400/20 bg-white/[0.04] p-6";
const INPUT = "mt-0.5 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10";
const PRIMARY = "rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-300 disabled:opacity-50";
const usd = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const pct = (n: number | null | undefined) => (n == null ? "—" : `${Math.round(n)}th`);

type SpeechRecognitionLike = { lang: string; interimResults: boolean; onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
function recognizer(): SpeechRecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return C ? new C() : null;
}

export default function SpecialtyPage() {
  const [, params] = useRoute("/for/:slug");
  const slugParam = params?.slug ?? "";
  const path = careerPath(slugParam);
  const [state, setState] = useState<string>("");
  const q = trpc.career.specialty.useQuery({ slug: slugParam, state: state || undefined }, { enabled: Boolean(path), staleTime: 60_000, retry: false });
  if (!path) return <div className="min-h-screen bg-[#070b14] p-10 text-white">No such specialty. <Link href="/for" className="text-emerald-300 underline">See the list.</Link></div>;
  const d = q.data;
  const years = trainingYears(path);
  const usLatest = d?.bls.us[d.bls.us.length - 1] ?? null;
  const stLatest = d?.bls.state[d.bls.state.length - 1] ?? null;
  const record = stLatest ?? usLatest;

  return (
    <div className="relative min-h-screen bg-[#070b14] text-white">
      <PageBackdrop src="/rcs-city-harbor.webp" phoneSrc="/rcs-city-glass.webp" alt="Green-lit harbour city at night, towers reflected in the water" fade="#070b14" position="center 35%" brightness=".4" />
      <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-10">
        <div className={CARD}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Stethoscope size={12} className="mr-1 inline" /> {FAMILY_LABEL[path.family]} · The Career Ledger</p>
          <h1 className="mt-1 text-3xl font-semibold">For {path.plural}: what it took, what it pays, what the hour is worth</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/70">Everything on this page is either the public record with its page and year, or your own figure. Nothing is estimated for you. Pick your state and the record narrows to it.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <label>Your state <select className={`${INPUT} !mt-0 !w-auto`} value={state} onChange={(e) => setState(e.target.value)}><option value="">United States</option>{Object.entries(d?.states ?? {}).map(([a, n]) => <option key={a} value={a}>{n}</option>)}</select></label>
            <Link href="/for" className={BTN}>All specialties</Link>
            <a className={BTN} href="https://calendly.com/sam-RussellCapitalSystems/60min" target="_blank" rel="noreferrer">Book the sixty-minute review</a>
          </div>
        </div>

        {/* The training */}
        <div className={CARD}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><BookOpen size={12} className="mr-1 inline" /> The training</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
            <Stat label={path.degree.name} value={`${path.degree.years} years`} sub={<a className="underline" href={path.degree.source.url} target="_blank" rel="noreferrer">{path.degree.source.label}</a>} />
            <Stat label="Residency" value={path.residency.years ? `${path.residency.years}${path.residency.maxYears ? `–${path.residency.maxYears}` : ""} years` : "none required"} sub={<><a className="underline" href={path.residency.source.url} target="_blank" rel="noreferrer">{path.residency.source.label}</a>{path.residency.note ? ` · ${path.residency.note}` : ""}</>} />
            {path.fellowship ? <Stat label="Fellowship" value={`${path.fellowship.years} years`} sub={<a className="underline" href={path.fellowship.source.url} target="_blank" rel="noreferrer">{path.fellowship.source.label}</a>} /> : <Stat label="Fellowship" value="optional" sub="not counted" />}
            <Stat label="First day of the degree to independent practice" value={`${years} years`} sub="degree + residency + fellowship" />
          </div>
        </div>

        {/* The record */}
        <div className={CARD}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Landmark size={12} className="mr-1 inline" /> The record: what {path.plural} earn</p>
          {q.isLoading ? <p className="mt-2 text-sm text-white/50">reading…</p> : !usLatest ? <p className="mt-2 text-sm text-white/60">The BLS files have not been read on this host yet. Occupation {path.soc.code} ({path.soc.title}) in the <a className="underline" href={d?.bls.source.url} target="_blank" rel="noreferrer">OEWS tables</a>.</p> : (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
                <Stat label={`${record!.areaTitle}, ${record!.year}`} value={usd(record!.annualMean)} sub={`mean · ${record!.occTitle}`} />
                <Stat label="10th percentile" value={usd(record!.p10)} />
                <Stat label="25th" value={usd(record!.p25)} />
                <Stat label="Median" value={usd(record!.p50)} />
                <Stat label="75th" value={record!.p75 == null && record!.topCoded ? "above BLS top code" : usd(record!.p75)} />
                <Stat label="90th" value={record!.p90 == null && record!.topCoded ? "above BLS top code" : usd(record!.p90)} sub={`${(record!.employment ?? 0).toLocaleString("en-US")} employed`} />
              </div>
              <p className="mt-2 text-[11px] text-white/50">Source: <a className="underline" href={record!.source} target="_blank" rel="noreferrer">{record!.source}</a>. BLS suppresses percentiles at or above its top code ($239,200 in 2023), so the highest-paid specialties show a floor, not a ceiling.</p>
              {d!.bls.us.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs text-white/60">Year by year, United States (mean · median). The 2010 occupation code is used for the years before 2019.</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">{d!.bls.us.map((r) => <span key={`${r.year}${r.occCode}`} className="rounded border border-white/10 px-2 py-1 text-white/70">{r.year}: {usd(r.annualMean)} · {usd(r.p50)}</span>)}</div>
                </div>
              )}
              {d!.bls.byState.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <p className="text-xs text-white/60">Every state, {d!.bls.byState[0]!.year}, best-paid first.</p>
                  <table className="mt-1 w-full text-xs"><thead><tr className="text-white/50"><th className="text-left">State</th><th className="text-right">Employed</th><th className="text-right">Mean</th><th className="text-right">Median</th><th className="text-right">90th</th></tr></thead>
                    <tbody>{d!.bls.byState.map((r) => <tr key={r.area} className={`border-t border-white/5 ${r.area === state ? "text-emerald-200" : "text-white/80"}`}><td>{r.areaTitle}</td><td className="text-right">{(r.employment ?? 0).toLocaleString("en-US")}</td><td className="text-right">{usd(r.annualMean)}</td><td className="text-right">{usd(r.p50)}</td><td className="text-right">{r.p90 == null && r.topCoded ? "top code" : usd(r.p90)}</td></tr>)}</tbody></table>
                </div>
              )}
              {d!.topEarners.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-white/60">The fifteen best-paid occupations in {state ? d!.states[state] : "the United States"}, {d!.topEarners[0]!.year}, by mean annual wage. Where {path.plural} rank is where they fall in this list.</p>
                  <ol className="mt-1 grid gap-1 text-[11px] text-white/70 sm:grid-cols-3">{d!.topEarners.map((r) => <li key={r.occCode} className={r.occCode === path.soc.code ? "font-semibold text-emerald-200" : ""}>{r.rankInArea}. {r.occTitle} {usd(r.annualMean)}</li>)}</ol>
                </div>
              )}
            </>
          )}
        </div>

        <CostCard path={path} nces={d?.nces ?? null} attendingMean={record?.annualMean ?? null} />
        <PeerCard slug={path.slug} plural={path.plural} state={state} />
        <VisionCard slug={path.slug} state={state} />

        <div className={CARD}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><ExternalLink size={12} className="mr-1 inline" /> The sources, and what is not on this page yet</p>
          <ul className="mt-3 space-y-1 text-xs text-white/70">
            {[path.degree.source, path.residency.source, ...(path.fellowship ? [path.fellowship.source] : []), ...(d?.loanRateSources ?? []), ...(d?.nces.sources ?? []), d?.bls.source, ...(d?.more ?? [])].filter(Boolean).map((s, i) => <li key={i}><a className="underline" href={s!.url} target="_blank" rel="noreferrer">{s!.label}</a></li>)}
          </ul>
          <p className="mt-3 text-[11px] text-white/50">Tuition for the professional degree itself (AAMC medical, CODA dental, ABA law workbooks), resident stipends (AAMC survey), malpractice premiums (Medical Liability Monitor via the AMA reports) and paid claims (NPDB) are published by the bodies linked above; they are read in the next pass and, until then, typed by you. Practice sale prices and deal terms are not published by any public body; the platform builds that record from clients' own closed deals.</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] text-white/50">{label}</div><div className="text-base font-semibold text-white">{value}</div>{sub && <div className="text-[10px] text-white/40">{sub}</div>}</div>;
}

// ─── The cost of becoming one ───────────────────────────────────────────────
function CostCard({ path, nces, attendingMean }: { path: NonNullable<ReturnType<typeof careerPath>>; nces: { national: Array<{ series: string; startYear: number; values: Array<number | null>; asOf: string }> } | null; attendingMean: number | null }) {
  const pub = nces?.national.find((s) => s.series === "nces_pub_total4");
  const priv = nces?.national.find((s) => s.series === "nces_priv_total4");
  const last = (s?: { startYear: number; values: Array<number | null> }) => { if (!s) return null; for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] != null) return { year: s.startYear + i, value: s.values[i]! }; return null; };
  const pubLast = last(pub), privLast = last(priv);
  const [x, setX] = useState({ startYear: new Date().getFullYear(), tuitionPerYear: 0, livingPerYear: 0, costGrowthPct: 3, borrowedShare: 1, stipendPerYear: 0, attendingSalary: attendingMean ?? 0, alternativeSalary: 0, investReturnPct: 6, termYears: 10 });
  const set = (k: keyof typeof x, v: number) => setX((s) => ({ ...s, [k]: v }));
  const attending = x.attendingSalary || attendingMean || 0;
  const cost = useMemo(() => trainingCost({ startYear: x.startYear, degreeYears: path.degree.years, tuitionPerYear: x.tuitionPerYear, livingPerYear: x.livingPerYear, costGrowthPct: x.costGrowthPct, borrowedShare: x.borrowedShare }), [x, path]);
  const trainYears = path.residency.years + (path.fellowship?.years ?? 0);
  const opp = useMemo(() => opportunityCost({ trainingYears: trainYears, stipendPerYear: x.stipendPerYear, attendingSalary: attending, alternativeSalary: x.alternativeSalary, investReturnPct: x.investReturnPct, loanBalance: cost.balanceAtGraduation, loanRatePct: cost.weightedRatePct }), [x, attending, cost, trainYears]);
  const pay = repayment(opp.loanBalanceAfter, cost.weightedRatePct, x.termYears);
  const rateNow = loanRateFor(x.startYear);
  return (
    <div className={CARD}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Calculator size={12} className="mr-1 inline" /> The cost of becoming one</p>
      <p className="mt-1 text-xs text-white/60">Type the degree's tuition (the AAMC, CODA and ABA workbooks in the sources list publish it by school) and your living cost; the federal graduate rate for each year of the degree is applied automatically, interest capitalised each year. Then what the residency years forgo against what you could have earned, compounded, and the loan growing meanwhile.</p>
      {pubLast && <p className="mt-1 text-[11px] text-white/50">For scale, NCES's national average for an undergraduate year (tuition, fees, room and board, four-year): public {usd(pubLast.value)} and private {usd(privLast?.value)} in {pubLast.year}-{String(pubLast.year + 1).slice(2)}; the record on this host runs from {pub!.startYear}-{String(pub!.startYear + 1).slice(2)}.</p>}
      <div className="mt-3 grid gap-3 md:grid-cols-5 text-[11px] text-white/70">
        <label>Degree start year<input type="number" className={INPUT} value={x.startYear} onChange={(e) => set("startYear", Number(e.target.value))} /><span className="text-white/40">federal graduate rate {rateNow != null ? `${rateNow}%` : "variable; pre-2006"}</span></label>
        <label>Tuition and fees, year one<input type="number" step={1000} className={INPUT} value={x.tuitionPerYear} onChange={(e) => set("tuitionPerYear", Number(e.target.value))} /></label>
        <label>Living costs, year one<input type="number" step={1000} className={INPUT} value={x.livingPerYear} onChange={(e) => set("livingPerYear", Number(e.target.value))} /></label>
        <label>Cost growth % / yr<input type="number" step={0.5} className={INPUT} value={x.costGrowthPct} onChange={(e) => set("costGrowthPct", Number(e.target.value))} /></label>
        <label>Share borrowed (0–1)<input type="number" step={0.05} min={0} max={1} className={INPUT} value={x.borrowedShare} onChange={(e) => set("borrowedShare", Number(e.target.value))} /></label>
        <label>Resident stipend / yr<input type="number" step={1000} className={INPUT} value={x.stipendPerYear} onChange={(e) => set("stipendPerYear", Number(e.target.value))} /><span className="text-white/40">AAMC survey, in the sources</span></label>
        <label>Attending income<input type="number" step={1000} className={INPUT} value={attending} onChange={(e) => set("attendingSalary", Number(e.target.value))} /><span className="text-white/40">{attendingMean ? "BLS mean prefilled" : "type it"}</span></label>
        <label>What you could earn instead<input type="number" step={1000} className={INPUT} value={x.alternativeSalary} onChange={(e) => set("alternativeSalary", Number(e.target.value))} /></label>
        <label>Return on forgone dollars %<input type="number" step={0.5} className={INPUT} value={x.investReturnPct} onChange={(e) => set("investReturnPct", Number(e.target.value))} /></label>
        <label>Repayment term, years<input type="number" className={INPUT} value={x.termYears} onChange={(e) => set("termYears", Number(e.target.value))} /></label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
        <Stat label={`${path.degree.years}-year cost`} value={usd(cost.totalCost)} sub="tuition + living" />
        <Stat label="Borrowed" value={usd(cost.totalBorrowed)} sub={`weighted rate ${cost.weightedRatePct.toFixed(2)}%`} />
        <Stat label="Interest before graduation" value={usd(cost.totalInterestInSchool)} sub="capitalised yearly" />
        <Stat label="Balance at graduation" value={usd(cost.balanceAtGraduation)} />
        <Stat label={`Forgone in ${trainYears} training years`} value={usd(opp.forgoneCompounded)} sub={`${usd(opp.forgoneTotal)} before compounding`} />
        <Stat label="Loan after training" value={usd(opp.loanBalanceAfter)} sub={`+${usd(opp.loanInterestDuringTraining)} interest`} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
        <Stat label={`Payment over ${x.termYears} years`} value={`${usd(pay.monthly)}/mo`} sub={`${usd(pay.totalInterest)} interest in repayment`} />
        <Stat label="Years to recover the forgone amount" value={opp.yearsToRecoverAtAttendingPremium == null ? "—" : opp.yearsToRecoverAtAttendingPremium.toFixed(1)} sub="at the attending premium over the alternative" />
        <Stat label="All-in cost of the title" value={usd(cost.totalCost + opp.forgoneCompounded + opp.loanInterestDuringTraining + pay.totalInterest)} sub="cost + forgone + all interest" />
      </div>
      {cost.years.length > 0 && cost.totalCost > 0 && (
        <div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-white/50"><th className="text-left">Year</th><th className="text-right">Tuition</th><th className="text-right">Living</th><th className="text-right">Borrowed</th><th className="text-right">Rate</th><th className="text-right">Interest</th><th className="text-right">Balance</th></tr></thead>
          <tbody>{cost.years.map((y) => <tr key={y.year} className="border-t border-white/5 text-white/80"><td>{y.year}-{String(y.year + 1).slice(2)}</td><td className="text-right">{usd(y.tuition)}</td><td className="text-right">{usd(y.living)}</td><td className="text-right">{usd(y.borrowed)}</td><td className="text-right">{y.ratePct.toFixed(2)}%</td><td className="text-right">{usd(y.interestAccrued)}</td><td className="text-right">{usd(y.balance)}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}

// ─── Beside your peers ──────────────────────────────────────────────────────
function PeerCard({ slug, plural, state }: { slug: string; plural: string; state: string }) {
  const [v, setV] = useState<Record<string, number>>({ hoursPerWeek: 50, weeksPerYear: 48 });
  const [asked, setAsked] = useState<Record<string, number> | null>(null);
  const cmp = trpc.career.compare.useQuery({ slug, state: state || undefined, values: asked ?? {} }, { enabled: asked != null, retry: false });
  const submit = trpc.career.submit.useMutation();
  const set = (k: string, raw: string) => setV((s) => { const n = Number(raw); const next = { ...s }; if (raw === "" || !Number.isFinite(n)) delete next[k]; else next[k] = n; return next; });
  const r = cmp.data;
  return (
    <div className={CARD}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Users size={12} className="mr-1 inline" /> Beside your peers</p>
      <p className="mt-1 text-xs text-white/60">Enter what is true for you. Income is placed on the BLS distribution for {plural}{state ? ` in ${state}` : ""}; every other line is compared with {plural} who entered theirs here, once five or more have. The hour's true worth is your net after taxes, loans, practice costs and vehicles, divided by every hour committed, commute and travel included.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4 text-[11px] text-white/70">
        {PEER_FIELDS.map((f) => <label key={f.key}>{f.label}<input type="number" className={INPUT} value={v[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} min={f.kind === "scale" ? 1 : undefined} max={f.kind === "scale" ? 10 : undefined} /></label>)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={PRIMARY} onClick={() => setAsked({ ...v })} disabled={v.grossIncome == null}>Compare me</button>
        <button className={BTN} onClick={() => submit.mutate({ slug, state: state || undefined, values: v })} disabled={v.grossIncome == null || submit.isPending}>{submit.data?.stored ? "Kept for the next peer, thank you" : "Keep my figures for the next peer (anonymous)"}</button>
      </div>
      {r && (
        <div className="mt-4 space-y-3 text-sm">
          {r.income ? <p>Your income sits at {r.income.topCoded && (r.income.percentile ?? 0) >= 50 ? "at least" : "about"} the <span className="font-semibold text-emerald-200">{pct(r.income.percentile)} percentile</span> of {r.income.occTitle} in {r.income.areaTitle}, {r.income.year} (BLS: 10th {usd(r.income.p10)} · median {usd(r.income.p50)} · 90th {r.income.p90 == null && r.income.topCoded ? "above top code" : usd(r.income.p90)}).</p> : <p className="text-white/60">The BLS files have not been read on this host yet, so income cannot be placed.</p>}
          {r.peers.hourly && (
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Gross per hour worked" value={usd(r.peers.hourly.grossHourly)} />
              <Stat label="Net per hour worked" value={usd(r.peers.hourly.netHourly)} />
              <Stat label="Net per hour committed" value={usd(r.peers.hourly.netHourlyAllIn)} sub={`${Math.round(r.peers.hourly.hoursCommittedIncludingTravel).toLocaleString("en-US")} hours with commute and travel`} />
              <Stat label="Versus peers' net hour" value={r.peers.hourly.median == null ? "waiting for five peers" : `${pct(r.peers.hourly.percentile)} percentile`} sub={r.peers.hourly.median == null ? "" : `peers' median ${usd(r.peers.hourly.median)}`} />
            </div>
          )}
          <div className="grid gap-1 text-xs text-white/70 sm:grid-cols-2">{r.peers.fields.map((f) => <div key={f.key}>{f.label}: <span className="text-white">{f.value.toLocaleString("en-US")}</span>{f.median == null ? <span className="text-white/40"> · peers: not enough yet ({f.n})</span> : <span> · {pct(f.percentile)} percentile of {f.n} peers, median {f.median.toLocaleString("en-US")}</span>}</div>)}</div>
          <p className="text-[11px] text-white/50">{r.note}</p>
        </div>
      )}
    </div>
  );
}

// ─── The vision the plan is built from ──────────────────────────────────────
function VisionCard({ slug, state }: { slug: string; state: string }) {
  const [a, setA] = useState<Record<string, string | number>>({});
  const [listening, setListening] = useState<string | null>(null);
  const submit = trpc.career.submit.useMutation();
  const dictate = (key: string) => {
    const rec = recognizer();
    if (!rec) return;
    rec.lang = "en-US"; rec.interimResults = false;
    rec.onresult = (ev) => { const t = Array.from({ length: ev.results.length }, (_, i) => ev.results[i]![0]!.transcript).join(" "); setA((s) => ({ ...s, [key]: `${String(s[key] ?? "")} ${t}`.trim() })); };
    rec.onend = () => setListening(null);
    setListening(key); rec.start();
  };
  return (
    <div className={CARD}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Compass size={12} className="mr-1 inline" /> The life the plan is built for</p>
      <p className="mt-1 text-xs text-white/60">Before any plan is built, say what a perfect outcome looks like at each horizon, whether you know anyone who reached it, and the odds as you see them. Speak or type; the blue microphone can also take these. The answers travel with your figures.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {VISION_QUESTIONS.map((qq) => (
          <label key={qq.key} className="text-[11px] text-white/70">{qq.prompt}
            {qq.kind === "text" ? (
              <div className="flex gap-1"><textarea className={INPUT} rows={2} value={String(a[qq.key] ?? "")} onChange={(e) => setA((s) => ({ ...s, [qq.key]: e.target.value }))} /><button type="button" className={`${BTN} ${listening === qq.key ? "border-emerald-300" : ""}`} onClick={() => dictate(qq.key)} title="Dictate"><Mic size={12} /></button></div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1">{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <button key={n} type="button" onClick={() => setA((s) => ({ ...s, [qq.key]: n }))} className={`h-8 w-8 rounded border text-xs ${a[qq.key] === n ? "border-emerald-300 bg-emerald-400 text-black" : "border-white/15 text-white"}`}>{n}</button>)}</div>
            )}
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className={PRIMARY} disabled={submit.isPending || Object.keys(a).length === 0} onClick={() => submit.mutate({ slug, state: state || undefined, values: {}, vision: a })}>{submit.data?.stored ? "Kept with your ledger" : "Keep these answers"}</button>
        <Link href="/fact-finder" className={BTN}>Continue to the Fact Finder</Link>
        <span className="text-[11px] text-white/50">Likelihood now versus after the consultation is the score the platform is measured on.</span>
      </div>
    </div>
  );
}
