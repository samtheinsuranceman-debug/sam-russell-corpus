// ============================================================
// TAX-FREE INCOME FOR LIFE + THE LONGEVITY ENGINE — the studies first, as
// Sam asked, then how long one life or two are likely to run, then the plan:
// the pre-tax account through the conversion pass, the sheet's bonus and
// payout, the expected years and total, and what the same income would lose
// to tax if it were not Roth. Taxable money is refused, with the reason. The
// rate sheets are the owner's registry; the exit provision is described
// without a company name; the flow-through policy is shown as the questions
// the attorney and the carrier must answer.
// ============================================================
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { BookOpen, Calculator, HeartHandshake, Hourglass, Landmark, Printer, Plus, Trash2, Repeat } from "lucide-react";

const CARD = "rounded-2xl border border-emerald-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white w-full";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10";
const H = "text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80";
const usd = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const pct = (n: number | null | undefined, d = 0) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);

type Sex = "male" | "female";
type SheetRow = { carrier: string; product: string; ageFrom: number; ageTo: number; single: boolean; payoutPct: number; bonusPct: number | null; deferralYears: number; principalContinuesToGrow: boolean | null; exitAfterYears: number | null; surrenderYears: number | null; rateSheetUrl: string; asOf: string; note?: string };
const ROW0: SheetRow = { carrier: "", product: "", ageFrom: 65, ageTo: 69, single: true, payoutPct: 0, bonusPct: null, deferralYears: 0, principalContinuesToGrow: null, exitAfterYears: null, surrenderYears: null, rateSheetUrl: "", asOf: new Date().toISOString().slice(0, 10) };

export default function IncomeForLife() {
  const context = trpc.incomeLife.context.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const ff = trpc.incomeLife.factFinder.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const c = context.data;

  const [age, setAge] = useState(60); const [sex, setSex] = useState<Sex>("male");
  const [hasSpouse, setHasSpouse] = useState(false); const [spouseAge, setSpouseAge] = useState(58); const [spouseSex, setSpouseSex] = useState<Sex>("female");
  const [balance, setBalance] = useState(500_000); const [accountKind, setAccountKind] = useState<"pretax" | "roth" | "taxable">("pretax");
  const [conversionTaxPct, setConversionTaxPct] = useState(0); const [payoutPct, setPayoutPct] = useState(0); const [bonusPct, setBonusPct] = useState(0);
  const [deferralYears, setDeferralYears] = useState(0); const [startAge, setStartAge] = useState(65); const [marginalRatePct, setMarginalRatePct] = useState(24);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !ff.data) return; setSeeded(true);
    const f = ff.data;
    if (f.clientAge != null && f.clientAge >= 50) { setAge(f.clientAge); setStartAge(Math.max(f.clientAge, 65)); }
    if (f.spouseAge != null && f.spouseAge >= 50) { setHasSpouse(true); setSpouseAge(f.spouseAge); }
    if (f.balances.pretax > 0) { setBalance(f.balances.pretax); setAccountKind("pretax"); } else if (f.balances.roth > 0) { setBalance(f.balances.roth); setAccountKind("roth"); }
    if (f.marginalRate != null) setMarginalRatePct(Math.round(f.marginalRate * 100));
  }, [ff.data, seeded]);

  const spouse = hasSpouse ? { age: spouseAge, sex: spouseSex } : null;
  const longevity = trpc.incomeLife.longevity.useQuery({ first: { age, sex }, second: spouse }, { refetchOnWindowFocus: false, retry: false, placeholderData: (p) => p });
  const plan = trpc.incomeLife.plan.useQuery({ balance, accountKind, conversionTaxPct, payoutPct, bonusPct, deferralYears, startAge: Math.max(startAge, age), sex, spouse, marginalRatePct }, { refetchOnWindowFocus: false, retry: false, placeholderData: (p) => p });
  const sheets = trpc.incomeLife.rateSheets.useQuery({ age: Math.max(startAge, age), single: !hasSpouse }, { refetchOnWindowFocus: false, retry: false });
  const addSheet = trpc.incomeLife.addRateSheet.useMutation({ onSuccess: () => sheets.refetch() });
  const removeSheet = trpc.incomeLife.removeRateSheet.useMutation({ onSuccess: () => sheets.refetch() });
  const [draft, setDraft] = useState<SheetRow>(ROW0);
  const [showAdd, setShowAdd] = useState(false);
  const L = longevity.data; const P = plan.data;

  return (
    <AppShell title="Tax-Free Income for Life">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={H}><HeartHandshake size={12} className="mr-1 inline" /> Income for life · the Longevity Engine</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Guaranteed income you cannot outlive, tax-free, sized to how long you and your spouse are likely to live</h1>
              <p className="mt-2 text-sm text-white/70">The pre-tax account goes through the <Link href="/portal/roth-conversion" className="text-emerald-300 underline">conversion pass</Link> first; the income plan runs on the Roth. The payout comes from a carrier's published rate sheet in the registry below; the years come from the Social Security life table. The research on what guaranteed income does for people is shown first, as it stands, before any number.</p>
            </div>
            <button className={`${BTN} print:hidden`} onClick={() => window.print()}><Printer size={12} className="mr-1 inline" />Print / save as PDF (the studies print first)</button>
          </div>
        </div>

        {/* 1. The studies, before the numbers */}
        <div className={`${CARD} p-6`}>
          <p className={H}><BookOpen size={12} className="mr-1 inline" /> 1. What the research says about guaranteed income and wellbeing</p>
          {c && <p className="mt-2 text-sm text-white/80">{c.framing}</p>}
          <div className="mt-3 space-y-3">
            {(c?.studies ?? []).map((s) => (
              <div key={s.url} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/75">
                <div className="font-semibold text-white"><a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.title}</a> <span className="text-white/50">· {s.authors}, {s.year} · {s.kind}</span></div>
                <div className="mt-1">{s.finding}</div>
                {s.caveat && <div className="mt-1 text-amber-200/80">Caveat: {s.caveat}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 2. Longevity */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Hourglass size={12} className="mr-1 inline" /> 2. How long the payments are likely to run: one life, or the longer of two</p>
          <div className="mt-3 grid gap-2 md:grid-cols-6 text-[11px] text-white/70">
            <label className="block">Your age<input type="number" className={`${INPUT} mt-0.5`} value={age} onChange={(e) => setAge(Number(e.target.value))} /></label>
            <label className="block">Sex (for the table)<select className={`${INPUT} mt-0.5`} value={sex} onChange={(e) => setSex(e.target.value as Sex)}><option value="male">Male</option><option value="female">Female</option></select></label>
            <label className="mt-4 flex items-center gap-2 text-white"><input type="checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} /> Joint life{ff.data?.spouseName ? ` (${ff.data.spouseName})` : ""}</label>
            {hasSpouse && <label className="block">Spouse's age<input type="number" className={`${INPUT} mt-0.5`} value={spouseAge} onChange={(e) => setSpouseAge(Number(e.target.value))} /></label>}
            {hasSpouse && <label className="block">Spouse's sex<select className={`${INPUT} mt-0.5`} value={spouseSex} onChange={(e) => setSpouseSex(e.target.value as Sex)}><option value="female">Female</option><option value="male">Male</option></select></label>}
          </div>
          {L && (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                <Stat label="Expected years remaining, you" value={`${L.expectedFirst.toFixed(1)} years`} sub={`to about age ${Math.round(age + L.expectedFirst)}`} />
                {L.expectedSecond != null && <Stat label="Expected years remaining, spouse" value={`${L.expectedSecond.toFixed(1)} years`} sub={`to about age ${Math.round(spouseAge + L.expectedSecond)}`} />}
                {P && !P.refused && <Stat label={hasSpouse ? "Expected years at least one of you is alive, from the income start" : "Expected years of payments from the income start"} value={`${P.expectedYears.toFixed(1)} years`} />}
              </div>
              <div className="mt-3 overflow-x-auto"><table className="w-full text-[11px]">
                <thead><tr className="text-white/50"><th className="py-1 text-left">Your age</th><th className="text-right">Years from now</th><th className="text-right">You alive</th>{hasSpouse && <><th className="text-right">Spouse alive</th><th className="text-right">At least one of you</th><th className="text-right">Both of you</th></>}</tr></thead>
                <tbody>{L.table.map((r) => <tr key={r.age} className="border-t border-white/5 text-white/80"><td className="py-0.5">{r.age}</td><td className="text-right">{r.yearsFromNow}</td><td className="text-right">{pct(r.first, 1)}</td>{hasSpouse && <><td className="text-right">{pct(r.second, 1)}</td><td className="text-right text-emerald-300">{pct(r.either, 1)}</td><td className="text-right">{pct(r.both, 1)}</td></>}</tr>)}</tbody>
              </table></div>
              <p className="mt-2 text-[11px] text-white/45"><a className="underline" href={L.source.url} target="_blank" rel="noreferrer">{L.source.label}</a>, {L.source.asOf}. Survival to an age is the product of the table's one-year survival probabilities; "at least one" is one minus the product of the two chances of death. A population table, not a health-rated one: the Actuaries Longevity Illustrator below adjusts for health and smoking.</p>
            </>
          )}
        </div>

        {/* 3. The plan */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Calculator size={12} className="mr-1 inline" /> 3. The plan: conversion first, then the sheet's payout, sized to the years</p>
          <div className="mt-3 grid gap-2 md:grid-cols-4 lg:grid-cols-8 text-[11px] text-white/70">
            <label className="block">Account<select className={`${INPUT} mt-0.5`} value={accountKind} onChange={(e) => setAccountKind(e.target.value as typeof accountKind)}><option value="pretax">Pre-tax (401k / IRA)</option><option value="roth">Already Roth</option><option value="taxable">Taxable brokerage</option></select></label>
            <label className="block">Balance<input type="number" step={10000} className={`${INPUT} mt-0.5`} value={balance} onChange={(e) => setBalance(Number(e.target.value))} /></label>
            <label className="block">Conversion tax % (from the pass)<input type="number" step={0.5} className={`${INPUT} mt-0.5`} value={conversionTaxPct} disabled={accountKind !== "pretax"} onChange={(e) => setConversionTaxPct(Number(e.target.value))} /></label>
            <label className="block">Income starts at age<input type="number" className={`${INPUT} mt-0.5`} value={startAge} onChange={(e) => setStartAge(Number(e.target.value))} /></label>
            <label className="block">Deferral years (sheet)<input type="number" className={`${INPUT} mt-0.5`} value={deferralYears} onChange={(e) => setDeferralYears(Number(e.target.value))} /></label>
            <label className="block">Bonus % (sheet)<input type="number" step={0.5} className={`${INPUT} mt-0.5`} value={bonusPct} onChange={(e) => setBonusPct(Number(e.target.value))} /></label>
            <label className="block">Payout % a year (sheet)<input type="number" step={0.05} className={`${INPUT} mt-0.5`} value={payoutPct} onChange={(e) => setPayoutPct(Number(e.target.value))} /></label>
            <label className="block">Marginal rate % if taxable<input type="number" className={`${INPUT} mt-0.5`} value={marginalRatePct} onChange={(e) => setMarginalRatePct(Number(e.target.value))} /></label>
          </div>
          {ff.data && <p className="mt-2 text-[11px] text-white/45">From your Fact Finder: pre-tax {usd(ff.data.balances.pretax)}, Roth {usd(ff.data.balances.roth)}, taxable {usd(ff.data.balances.taxable)}{ff.data.marginalRate != null ? `, marginal bracket ${Math.round(ff.data.marginalRate * 100)}%` : ""}. The payout and bonus are typed from a row in the registry below; the page prints no rate of its own.</p>}
          {P?.refused && <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">{P.refused}</div>}
          {P && !P.refused && payoutPct <= 0 && <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/60">Type the payout from a rate-sheet row below to see the income. Without a sheet the page shows no figure.</div>}
          {P && !P.refused && payoutPct > 0 && (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
                <Stat label="Roth after conversion" value={usd(P.afterConversion)} />
                <Stat label="Income base with the sheet's bonus" value={usd(P.withBonus)} />
                <Stat label="Income a year, tax-free" value={usd(P.annualIncome)} sub={`${usd(P.monthlyIncome)} a month`} />
                <Stat label="Expected total over the years" value={usd(P.expectedTotal)} sub={`${P.expectedYears.toFixed(1)} expected years`} />
                <Stat label="Tax the same income would lose" value={usd(P.ifTaxable.taxOverLife)} sub={`at ${marginalRatePct}%, if it were not Roth`} />
              </div>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-white/70">{P.lines.map((l, i) => <li key={i}>{l}</li>)}</ol>
            </>
          )}
          {c && <div className="mt-3 space-y-1 text-[11px] text-white/50"><div>{c.rules.taxableFirst}</div><div>{c.rules.principalNote}</div></div>}
        </div>

        {/* 4. Rate sheets */}
        <div className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={H}><Landmark size={12} className="mr-1 inline" /> 4. Payouts on file, from the carriers' published rate sheets</p>
            <button className={`${BTN} print:hidden`} onClick={() => setShowAdd((s) => !s)}><Plus size={12} className="mr-1 inline" />Add a sheet row (owner)</button>
          </div>
          <p className="mt-1 text-[11px] text-white/45">Rows for income starting at {Math.max(startAge, age)}, {hasSpouse ? "joint" : "single"} life. Each row carries the sheet's URL and date; the "use" button copies its payout, bonus and deferral into the plan above.</p>
          {sheets.data?.rows.length ? (
            <div className="mt-2 overflow-x-auto"><table className="w-full text-[11px]">
              <thead><tr className="text-white/50"><th className="py-1 text-left">Carrier</th><th className="text-left">Product</th><th className="text-right">Ages</th><th className="text-right">Payout / yr</th><th className="text-right">Bonus</th><th className="text-right">Deferral</th><th className="text-left">Principal grows</th><th className="text-right">Surrender yrs</th><th className="text-right">Exit after</th><th className="text-left">Sheet</th><th></th></tr></thead>
              <tbody>{sheets.data.rows.map((r) => <tr key={r.id} className="border-t border-white/5 text-white/80">
                <td className="py-0.5">{r.carrier}</td><td>{r.product}</td><td className="text-right">{r.ageFrom}–{r.ageTo}</td><td className="text-right">{Number(r.payoutPct).toFixed(2)}%</td><td className="text-right">{r.bonusPct == null ? "—" : `${Number(r.bonusPct).toFixed(1)}%`}</td><td className="text-right">{r.deferralYears}</td>
                <td>{r.principalContinuesToGrow == null ? "not typed" : r.principalContinuesToGrow ? "yes, per contract" : "no"}</td><td className="text-right">{r.surrenderYears ?? "—"}</td><td className="text-right">{r.exitAfterYears == null ? "—" : `year ${r.exitAfterYears}`}</td>
                <td><a className="underline" href={r.rateSheetUrl} target="_blank" rel="noreferrer">{r.asOf}</a></td>
                <td className="text-right print:hidden"><button className={BTN} onClick={() => { setPayoutPct(Number(r.payoutPct)); setBonusPct(r.bonusPct == null ? 0 : Number(r.bonusPct)); setDeferralYears(r.deferralYears); }}>use</button> <button className={BTN} onClick={() => removeSheet.mutate({ id: r.id })}><Trash2 size={12} /></button></td>
              </tr>)}</tbody>
            </table></div>
          ) : <div className="mt-2 text-xs text-white/50">None on file for this age and life basis yet. The owner adds each row from the carrier's published rate sheet with its URL and date; no payout is typed from memory, and the page ranks nothing it has not read.</div>}
          {showAdd && (
            <div className="mt-3 grid gap-2 md:grid-cols-4 lg:grid-cols-7 text-[11px] text-white/70 print:hidden">
              <label className="block">Carrier<input className={`${INPUT} mt-0.5`} value={draft.carrier} onChange={(e) => setDraft({ ...draft, carrier: e.target.value })} /></label>
              <label className="block">Product<input className={`${INPUT} mt-0.5`} value={draft.product} onChange={(e) => setDraft({ ...draft, product: e.target.value })} /></label>
              <label className="block">Age from<input type="number" className={`${INPUT} mt-0.5`} value={draft.ageFrom} onChange={(e) => setDraft({ ...draft, ageFrom: Number(e.target.value) })} /></label>
              <label className="block">Age to<input type="number" className={`${INPUT} mt-0.5`} value={draft.ageTo} onChange={(e) => setDraft({ ...draft, ageTo: Number(e.target.value) })} /></label>
              <label className="block">Life<select className={`${INPUT} mt-0.5`} value={draft.single ? "single" : "joint"} onChange={(e) => setDraft({ ...draft, single: e.target.value === "single" })}><option value="single">Single</option><option value="joint">Joint</option></select></label>
              <label className="block">Payout % / yr<input type="number" step={0.05} className={`${INPUT} mt-0.5`} value={draft.payoutPct} onChange={(e) => setDraft({ ...draft, payoutPct: Number(e.target.value) })} /></label>
              <label className="block">Bonus % (blank = none)<input type="number" step={0.5} className={`${INPUT} mt-0.5`} value={draft.bonusPct ?? ""} onChange={(e) => setDraft({ ...draft, bonusPct: e.target.value === "" ? null : Number(e.target.value) })} /></label>
              <label className="block">Deferral years<input type="number" className={`${INPUT} mt-0.5`} value={draft.deferralYears} onChange={(e) => setDraft({ ...draft, deferralYears: Number(e.target.value) })} /></label>
              <label className="block">Principal keeps growing<select className={`${INPUT} mt-0.5`} value={draft.principalContinuesToGrow == null ? "" : draft.principalContinuesToGrow ? "yes" : "no"} onChange={(e) => setDraft({ ...draft, principalContinuesToGrow: e.target.value === "" ? null : e.target.value === "yes" })}><option value="">Not typed</option><option value="yes">Yes, per contract</option><option value="no">No</option></select></label>
              <label className="block">Surrender years<input type="number" className={`${INPUT} mt-0.5`} value={draft.surrenderYears ?? ""} onChange={(e) => setDraft({ ...draft, surrenderYears: e.target.value === "" ? null : Number(e.target.value) })} /></label>
              <label className="block">Exit without charge after year<input type="number" className={`${INPUT} mt-0.5`} value={draft.exitAfterYears ?? ""} onChange={(e) => setDraft({ ...draft, exitAfterYears: e.target.value === "" ? null : Number(e.target.value) })} /></label>
              <label className="block md:col-span-2">Rate sheet URL<input className={`${INPUT} mt-0.5`} value={draft.rateSheetUrl} onChange={(e) => setDraft({ ...draft, rateSheetUrl: e.target.value })} placeholder="https://" /></label>
              <label className="block">Sheet date<input type="date" className={`${INPUT} mt-0.5`} value={draft.asOf} onChange={(e) => setDraft({ ...draft, asOf: e.target.value })} /></label>
              <button className={`${BTN} mt-4`} disabled={addSheet.isPending || !draft.carrier || !draft.product || !draft.rateSheetUrl || draft.payoutPct <= 0} onClick={() => addSheet.mutate(draft, { onSuccess: () => setDraft(ROW0) })}>Save the row</button>
              {addSheet.error && <div className="text-amber-300 md:col-span-4">{addSheet.error.message}</div>}
            </div>
          )}
          {c && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70"><span className="font-semibold text-white">The exit provision.</span> {c.rules.exitProvision}</div>}
        </div>

        {/* 5. Flow-through */}
        {c && (
          <div className={`${CARD} p-6`}>
            <p className={H}><Repeat size={12} className="mr-1 inline" /> 5. {c.flowThrough.title}</p>
            <p className="mt-2 text-sm text-white/75">{c.flowThrough.description}</p>
            <div className="mt-3 space-y-2">
              {c.flowThrough.questions.map((q) => (
                <div key={q.q} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/75">
                  <div className="font-semibold text-white">{q.q}</div>
                  <div className="mt-1">{q.why}</div>
                  <div className="mt-1 text-white/50">{q.authority.url ? <a className="underline" href={q.authority.url} target="_blank" rel="noreferrer">{q.authority.label}</a> : q.authority.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-white/50">{c.flowThrough.whatThePageWillDo}</p>
          </div>
        )}

        {/* Sources */}
        {c && (
          <div className={`${CARD} p-6`}>
            <p className={H}><BookOpen size={12} className="mr-1 inline" /> Where the rules and figures come from</p>
            <ul className="mt-3 space-y-1 text-xs text-white/70">
              {c.sources.map((s) => <li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}
              {c.longevitySources.map((s) => <li key={s.label}>{s.url ? <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : s.label}{s.asOf ? <span className="text-white/45"> · {s.asOf}</span> : null}</li>)}
            </ul>
            <p className="mt-2 text-[11px] text-white/45">Never printed here: {c.rules.neverPrinted.join("; ")}.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] text-white/50">{label}</div><div className="text-base font-semibold text-white">{value}</div>{sub && <div className="text-[10px] text-white/40">{sub}</div>}</div>;
}
