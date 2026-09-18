// ============================================================
// THE LONG-TERM CARE ENGINE — what care costs, how much of it people need,
// what the policy's chronic-illness benefit pays toward it for each person
// in the family, and the standalone quote beside it. The survey's national
// medians are the floor; the client types their state's figures from the
// survey's own calculator and the rider's terms from the policy form.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { HeartPulse, Home, Calculator, Users, Scale, BookOpen, Plus, Trash2 } from "lucide-react";

const CARD = "rounded-2xl border border-cyan-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white w-full";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10";
const H = "text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80";
const usd = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const pct = (n: number | null | undefined, d = 0) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);

type Rider = { deathBenefit: number; monthlyPctOfDeathBenefit: number; maxMonths: number | null; eliminationDays: number; riderChargePerYear: number | null; formName: string; asOf: string };
type Person = { label: string; sex: "female" | "male" | "unspecified"; yearsUntilCare: number; yearsOfNeed: number | null; rider: Rider | null; stateMonthly: Record<string, number> };
const RIDER0: Rider = { deathBenefit: 1_000_000, monthlyPctOfDeathBenefit: 2, maxMonths: null, eliminationDays: 90, riderChargePerYear: null, formName: "", asOf: new Date().toISOString().slice(0, 10) };

export default function LongTermCare() {
  const context = trpc.ltc.context.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const c = context.data;
  const [people, setPeople] = useState<Person[]>([{ label: "You", sex: "unspecified", yearsUntilCare: 20, yearsOfNeed: null, rider: RIDER0, stateMonthly: {} }]);
  const [compare, setCompare] = useState<{ standalonePremiumPerYear: number | null; standaloneBenefitMonthly: number | null; standaloneBenefitMonths: number | null }>({ standalonePremiumPerYear: null, standaloneBenefitMonthly: null, standaloneBenefitMonths: null });
  const [state, setState] = useState("");
  const report = trpc.ltc.report.useQuery({ people: people as never, compare: compare.standalonePremiumPerYear != null ? compare : null }, { refetchOnWindowFocus: false, retry: false, placeholderData: (p) => p });
  const filings = trpc.ltc.filings.useQuery({ state: /^[A-Za-z]{2}$/.test(state) ? state : undefined }, { refetchOnWindowFocus: false, retry: false });
  const r = report.data;
  const setP = (i: number, patch: Partial<Person>) => setPeople((ps) => ps.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const setR = (i: number, patch: Partial<Rider>) => setPeople((ps) => ps.map((p, k) => (k === i ? { ...p, rider: { ...(p.rider ?? RIDER0), ...patch } } : p)));

  return (
    <AppShell title="Long-Term Care">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className={H}><HeartPulse size={12} className="mr-1 inline" /> Life insurance as an engine</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">What care costs, how much of it people need, and what the policy pays toward it for everyone in the family</h1>
          <p className="mt-2 text-sm text-white/70">The survey's national medians are the floor. Type your state's figures from the survey's own calculator and the rider's terms from the policy form, and the page shows each person's shortfall or surplus for each kind of care over the years people actually need it. The <Link href="/portal/iul-engine" className="text-cyan-300 underline">IUL Engine</Link> and the <Link href="/portal/rental-enterprise" className="text-cyan-300 underline">Rental Enterprise</Link> hold the same policy's other uses.</p>
        </div>

        {/* 1. The settings */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Home size={12} className="mr-1 inline" /> 1. The six kinds of care and what they cost (national medians, 2025)</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {(c?.settings ?? []).map((s) => (
              <div key={s.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/75">
                <div className="font-semibold text-white">{s.label}</div>
                <div className="mt-1 text-white">{usd(s.monthly2025)} a month · {usd(s.annual2025)} a year</div>
                <div className="text-white/50">{s.unit}; {s.basis}{s.yoy != null ? `; ${s.yoy >= 0 ? "+" : ""}${(s.yoy * 100).toFixed(0)}% on 2024` : ""}</div>
                <div className="mt-1">{s.what}</div>
                <div className="mt-1 text-white/60">Keeps: {s.keeps.join(", ")}.</div>
                <div className="text-white/60">Gives up: {s.givesUp.join(", ")}.</div>
              </div>
            ))}
          </div>
          {c && <p className="mt-2 text-[11px] text-white/45"><a className="underline" href={c.sources[0]!.url} target="_blank" rel="noreferrer">{c.sources[0]!.label}</a>. {("note" in c.sources[0]!) ? (c.sources[0] as { note: string }).note : ""}</p>}
        </div>

        {/* 2. The need */}
        {c && (
          <div className={`${CARD} p-6`}>
            <p className={H}><Users size={12} className="mr-1 inline" /> 2. How much care people need</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-4 text-sm">
              <Stat label="Chance a 65-year-old needs some care" value={pct(c.need.chanceAt65)} />
              <Stat label="Women need care, on average" value={`${c.need.yearsWomen} years`} />
              <Stat label="Men need care, on average" value={`${c.need.yearsMen} years`} />
              <Stat label="Need it more than five years" value={pct(c.need.shareOverFiveYears)} sub={`one third never need it`} />
            </div>
            <div className="mt-3 overflow-x-auto"><table className="w-full text-[11px]"><thead><tr className="text-white/50"><th className="py-1 text-left">Type of care</th><th className="text-right">Average years used</th><th className="text-right">Share who use it</th></tr></thead><tbody>{c.need.byType.map((t) => <tr key={t.type} className="border-t border-white/5 text-white/80"><td className="py-0.5">{t.type}</td><td className="text-right">{t.years}</td><td className="text-right">{pct(t.share)}</td></tr>)}</tbody></table></div>
            <p className="mt-2 text-[11px] text-white/45"><a className="underline" href={c.sources[1]!.url} target="_blank" rel="noreferrer">{c.sources[1]!.label}</a></p>
          </div>
        )}

        {/* 3. The family and the rider */}
        <div className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={H}><Calculator size={12} className="mr-1 inline" /> 3. Each person, their state's figures, and the rider from the policy form</p>
            <button className={BTN} onClick={() => setPeople((ps) => [...ps, { label: ps.length === 1 ? "Spouse" : `Child ${ps.length - 1}`, sex: "unspecified", yearsUntilCare: ps.length === 1 ? 20 : 45, yearsOfNeed: null, rider: RIDER0, stateMonthly: {} }])}><Plus size={12} className="mr-1 inline" />Add a person</button>
          </div>
          <div className="mt-3 space-y-4">
            {people.map((p, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/70">
                <div className="grid gap-2 md:grid-cols-6">
                  <label className="block">Who<input className={`${INPUT} mt-0.5`} value={p.label} onChange={(e) => setP(i, { label: e.target.value })} /></label>
                  <label className="block">Sex (for the default years)<select className={`${INPUT} mt-0.5`} value={p.sex} onChange={(e) => setP(i, { sex: e.target.value as Person["sex"] })}><option value="unspecified">Not said</option><option value="female">Female</option><option value="male">Male</option></select></label>
                  <label className="block">Years until care might start<input type="number" className={`${INPUT} mt-0.5`} value={p.yearsUntilCare} onChange={(e) => setP(i, { yearsUntilCare: Number(e.target.value) })} /></label>
                  <label className="block">Years of need (blank = federal average)<input type="number" step={0.5} className={`${INPUT} mt-0.5`} value={p.yearsOfNeed ?? ""} onChange={(e) => setP(i, { yearsOfNeed: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                  <label className="mt-4 flex items-center gap-2 text-white"><input type="checkbox" checked={!!p.rider} onChange={(e) => setP(i, { rider: e.target.checked ? RIDER0 : null })} /> Has a policy with a chronic-illness rider</label>
                  {people.length > 1 && <button className={`${BTN} mt-3`} onClick={() => setPeople((ps) => ps.filter((_, k) => k !== i))}><Trash2 size={12} /></button>}
                </div>
                {p.rider && (
                  <div className="mt-2 grid gap-2 md:grid-cols-7">
                    <label className="block">Death benefit<input type="number" step={10000} className={`${INPUT} mt-0.5`} value={p.rider.deathBenefit} onChange={(e) => setR(i, { deathBenefit: Number(e.target.value) })} /></label>
                    <label className="block">Monthly % of death benefit (form)<input type="number" step={0.25} className={`${INPUT} mt-0.5`} value={p.rider.monthlyPctOfDeathBenefit} onChange={(e) => setR(i, { monthlyPctOfDeathBenefit: Number(e.target.value) })} /></label>
                    <label className="block">Max months (form; blank = until used)<input type="number" className={`${INPUT} mt-0.5`} value={p.rider.maxMonths ?? ""} onChange={(e) => setR(i, { maxMonths: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                    <label className="block">Elimination days<input type="number" className={`${INPUT} mt-0.5`} value={p.rider.eliminationDays} onChange={(e) => setR(i, { eliminationDays: Number(e.target.value) })} /></label>
                    <label className="block">Rider charge / yr (illustration)<input type="number" className={`${INPUT} mt-0.5`} value={p.rider.riderChargePerYear ?? ""} onChange={(e) => setR(i, { riderChargePerYear: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                    <label className="block">Rider form name<input className={`${INPUT} mt-0.5`} value={p.rider.formName} onChange={(e) => setR(i, { formName: e.target.value })} placeholder="from the policy" /></label>
                    <label className="block">Read on<input type="date" className={`${INPUT} mt-0.5`} value={p.rider.asOf} onChange={(e) => setR(i, { asOf: e.target.value })} /></label>
                  </div>
                )}
                <details className="mt-2"><summary className="cursor-pointer text-white/60">This person's state figures (monthly, from the survey's calculator)</summary>
                  <div className="mt-1 grid gap-2 md:grid-cols-6">{(c?.settings ?? []).map((s) => <label key={s.id} className="block">{s.label}<input type="number" className={`${INPUT} mt-0.5`} value={p.stateMonthly[s.id] ?? ""} onChange={(e) => setP(i, { stateMonthly: { ...p.stateMonthly, ...(e.target.value === "" ? {} : { [s.id]: Number(e.target.value) }) } })} placeholder={String(s.monthly2025)} /></label>)}</div>
                </details>
              </div>
            ))}
          </div>
          {c && <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-[11px] text-white/50">{c.protocol.map((l, i) => <li key={i}>{l}</li>)}</ol>}
        </div>

        {/* 4. The coverage */}
        {r && (
          <div className={`${CARD} p-6`}>
            <p className={H}><Calculator size={12} className="mr-1 inline" /> 4. What the policy pays toward each kind of care, for each person</p>
            {r.people.map(({ person, lines }) => (
              <div key={person.label} className="mt-3">
                <div className="text-sm font-semibold text-white">{person.label}: care from {new Date().getFullYear() + person.yearsUntilCare}, {lines[0]!.yearsOfNeed} years of need{person.rider ? `; rider pays ${usd(lines[0]!.riderMonthly)} a month${lines[0]!.riderMonths != null ? ` for up to ${lines[0]!.riderMonths} months` : ""}` : "; no rider"}</div>
                <div className="mt-1 overflow-x-auto"><table className="w-full text-[11px]">
                  <thead><tr className="text-white/50"><th className="py-1 text-left">Setting</th><th className="text-right">Monthly now</th><th className="text-right">Monthly then</th><th className="text-right">Cost over the need</th><th className="text-right">Rider covers</th><th className="text-right">Shortfall</th><th className="text-right">Months the rider buys</th></tr></thead>
                  <tbody>{lines.map((l) => <tr key={l.setting.id} className="border-t border-white/5 text-white/80"><td className="py-0.5">{l.setting.label}{l.stateFigureUsed ? <span className="ml-1 text-cyan-300/80">(state figure)</span> : ""}</td><td className="text-right">{usd(l.monthlyCostNow)}</td><td className="text-right">{usd(l.monthlyCostThen)}</td><td className="text-right">{usd(l.totalCost)}</td><td className="text-right text-emerald-300">{usd(l.covered)}</td><td className={`text-right ${l.shortfall > 0 ? "text-amber-300" : "text-white/40"}`}>{usd(l.shortfall)}</td><td className="text-right">{l.monthsCoveredAtCost ?? "—"}</td></tr>)}</tbody>
                </table></div>
              </div>
            ))}
            <ul className="mt-3 space-y-1 text-[11px] text-white/50">{r.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
        )}

        {/* 5. Standalone beside the rider */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Scale size={12} className="mr-1 inline" /> 5. A standalone long-term care quote beside the rider</p>
          <div className="mt-2 grid gap-3 md:grid-cols-4 text-[11px] text-white/70">
            <label className="block">Standalone premium / yr (quote)<input type="number" className={`${INPUT} mt-0.5`} value={compare.standalonePremiumPerYear ?? ""} onChange={(e) => setCompare((s) => ({ ...s, standalonePremiumPerYear: e.target.value === "" ? null : Number(e.target.value) }))} /></label>
            <label className="block">Standalone monthly benefit<input type="number" className={`${INPUT} mt-0.5`} value={compare.standaloneBenefitMonthly ?? ""} onChange={(e) => setCompare((s) => ({ ...s, standaloneBenefitMonthly: e.target.value === "" ? null : Number(e.target.value) }))} /></label>
            <label className="block">Standalone benefit months<input type="number" className={`${INPUT} mt-0.5`} value={compare.standaloneBenefitMonths ?? ""} onChange={(e) => setCompare((s) => ({ ...s, standaloneBenefitMonths: e.target.value === "" ? null : Number(e.target.value) }))} /></label>
            <div className="text-white/50">{r?.compare ? <>Rider charge ÷ standalone premium: <span className="font-semibold text-white">{r.compare.ratio == null ? "type the rider charge above" : `${(r.compare.ratio * 100).toFixed(0)}%`}</span>. Standalone total benefit {usd(r.compare.standaloneTotalBenefit)}; rider total {usd(r.compare.riderTotalBenefit)}.</> : "Type the quote to compare."}</div>
          </div>
          {r?.compare && <p className="mt-2 text-[11px] text-white/45">{r.compare.note}</p>}
          <div className="mt-4 text-xs text-white/70">
            <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-white">Standalone premium increases on file</span><input className={`${INPUT} !w-24`} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="state" /></div>
            {filings.data?.rows.length ? (
              <table className="mt-1 w-full text-[11px]"><thead><tr className="text-white/50"><th className="py-1 text-left">Carrier</th><th className="text-left">Product</th><th className="text-left">State</th><th className="text-right">Year</th><th className="text-right">Approved increase</th><th className="text-left">Filing</th></tr></thead>
                <tbody>{filings.data.rows.map((f) => <tr key={f.id} className="border-t border-white/5"><td className="py-0.5">{f.carrier}</td><td>{f.product ?? ""}</td><td>{f.stateAbbr}</td><td className="text-right">{f.year}</td><td className="text-right">{Number(f.increasePct).toFixed(1)}%</td><td><a className="underline" href={f.filingUrl} target="_blank" rel="noreferrer">filing</a></td></tr>)}</tbody></table>
            ) : <div className="mt-1 text-white/50">None on file yet. Each row the owner adds must carry the state insurance department's filing page; no history is typed from memory. The NAIC's multistate framework (2022) is where the states' reviews are described.</div>}
          </div>
        </div>

        <div className={`${CARD} p-6`}>
          <p className={H}><BookOpen size={12} className="mr-1 inline" /> Where the rules and figures come from</p>
          <ul className="mt-3 space-y-1 text-xs text-white/70">{(c?.sources ?? []).map((s) => <li key={s.url + s.label}><a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
          <p className="mt-2 text-[11px] text-white/45">Not on this page because no public body publishes it: a thirty-six-year premium-increase history by carrier. The filings registry above is built one state filing at a time.</p>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] text-white/50">{label}</div><div className="text-base font-semibold text-white">{value}</div>{sub && <div className="text-[10px] text-white/40">{sub}</div>}</div>;
}
