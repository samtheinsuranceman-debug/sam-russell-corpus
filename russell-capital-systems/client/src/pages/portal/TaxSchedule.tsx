// ============================================================
// TAX SCHEDULE — year by year, strategy by strategy: an amount, the tax it
// saves, the statute, the reason in your words. Built from the catalogue of
// strategy families (each with its cited 2026 parameters), the authority
// panel behind them, and your own profile and goals. Directional education
// under stated assumptions; a licensed professional confirms every specific.
// ============================================================
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CalendarRange, Layers, BookOpen, ListChecks } from "lucide-react";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white w-full";
const PRIMARY = "rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-40";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40";
const usd = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const pct = (n: number | null | undefined, d = 1) => (n == null ? "—" : `${(n * 100).toFixed(d)}%`);
const GOALS: Array<[string, string]> = [["lower_this_year", "Lower this year's tax"], ["zero_federal_this_year", "Zero federal tax this year"], ["lower_lifetime", "Lower lifetime tax"], ["tax_free_retirement", "Fund a tax-free retirement"], ["capital_gain_event", "A capital-gain event is coming"], ["estate", "Reduce estate exposure"], ["charity", "Charity matters to us"], ["real_estate", "Real estate"], ["exit", "Sell the business"]];

export default function TaxSchedule() {
  const cat = trpc.taxSchedule.catalogue.useQuery(undefined, { refetchOnWindowFocus: false });
  const panel = trpc.taxSchedule.panel.useQuery(undefined, { refetchOnWindowFocus: false });
  const harvests = trpc.erosion.harvests.useQuery({ status: "pending" }, { refetchOnWindowFocus: false, retry: false });
  const isOwner = harvests.isSuccess;
  const utils = trpc.useUtils();
  const harvest = trpc.taxSchedule.harvestSource.useMutation({ onSuccess: (r) => { toast[r.harvested ? "success" : "warning"](r.harvested ? `${r.voices.join(", ")} read ${r.pageChars.toLocaleString()} characters: ${r.reported} reported, ${r.verified} quote-verified, ${r.stored} queued` : r.reason); utils.erosion.harvests.invalidate(); }, onError: (e) => toast.error(e.message) });
  const run = trpc.taxSchedule.schedule.useMutation({ onError: (e) => toast.error(e.message), onSuccess: (_r, v) => { if (v.seal) toast.success("Sealed on your Plan Ledger"); } });
  const [f, setF] = useState({ filing: "joint", state: "WV", age: 45, spouseAge: 43, children: 2, childrenUnder18: 2, w2Income: "", practiceIncome: 0, otherIncome: 0, incomeGrowth: 3, entity: "s_corp", hasHdhp: true, ownsPractice: true, homeEquity: 0, mortgageRate: 6.5, rentalProperties: 0, canRunShortTermRental: false, plannedSaleGain: 0, saleYear: "", pretaxRetirement: 0, charitableIntentPerYear: 0, riskCapacity: "medium", netWorth: 0, years: 10, targetBracket: 0.24, goals: ["lower_this_year", "tax_free_retirement"] as string[] });
  const set = (k: keyof typeof f, v: unknown) => setF({ ...f, [k]: v });
  const toggleGoal = (g: string) => set("goals", f.goals.includes(g) ? f.goals.filter((x) => x !== g) : [...f.goals, g]);
  const go = (seal: boolean) => run.mutate({ filing: f.filing as "joint", state: f.state, age: Number(f.age), spouseAge: f.filing === "joint" ? Number(f.spouseAge) : undefined, children: Number(f.children), childrenUnder18: Number(f.childrenUnder18), w2Income: f.w2Income ? Number(f.w2Income) : undefined, practiceIncome: Number(f.practiceIncome), otherIncome: Number(f.otherIncome), incomeGrowth: f.incomeGrowth / 100, entity: f.entity as "s_corp", hasHdhp: f.hasHdhp, employerPlanDeferralRoom: 0, ownsPractice: f.ownsPractice, homeEquity: Number(f.homeEquity), mortgageRate: f.mortgageRate / 100, rentalProperties: Number(f.rentalProperties), canRunShortTermRental: f.canRunShortTermRental, taxableInvestments: 0, unrealizedGains: 0, plannedSaleGain: Number(f.plannedSaleGain), saleYear: f.saleYear ? Number(f.saleYear) : undefined, pretaxRetirement: Number(f.pretaxRetirement), rothBalances: 0, cashValueLife: 0, charitableIntentPerYear: Number(f.charitableIntentPerYear), liquidityReserveMonths: 6, riskCapacity: f.riskCapacity as "medium", netWorth: Number(f.netWorth), goals: f.goals as ["lower_this_year"], years: Number(f.years), targetBracket: f.targetBracket as 0.24, seal });
  const r = run.data;
  const famName = (id: string) => cat.data?.families.find((x) => x.id === id)?.name ?? id;

  return (
    <AppShell title="Tax Schedule">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80"><CalendarRange size={12} className="mr-1 inline" /> Year by year, strategy by strategy</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Your tax optimisation schedule</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">Every strategy on this site belongs to a family with a statute and a set of 2026 numbers verified from the primary sources. Tell the engine your goals and it lays the families out over the years in the right order — plan contributions first, the deduction engines sized to the room left under your target bracket and capped by the law's loss limit and your risk capacity, charity in the high years, the sale year routed by goal, a Roth conversion last, and the once-only structures in the year their prerequisites are met — with an amount, the tax it saves, the statute and the reason for every step.</p>
        </div>

        {/* Your schedule */}
        <div className={`${CARD} p-5`} aria-label="Your schedule">
          <p className="text-sm font-semibold text-white"><ListChecks size={14} className="mr-1 inline text-amber-300" /> Your goals and your numbers</p>
          <div className="mt-2 flex flex-wrap gap-2">{GOALS.map(([id, label]) => <button key={id} type="button" onClick={() => toggleGoal(id)} className={`rounded-full border px-3 py-1 text-xs ${f.goals.includes(id) ? "border-amber-400 bg-amber-400/20 text-amber-100" : "border-white/15 text-slate-300"}`}>{label}</button>)}</div>
          <div className="mt-3 grid gap-2 md:grid-cols-4 text-xs text-slate-400">
            <label>Filing<select value={f.filing} onChange={(e) => set("filing", e.target.value)} className={`${INPUT} mt-1`}><option value="joint">Married filing jointly</option><option value="single">Single</option><option value="hoh">Head of household</option></select></label>
            <label>Your age<input type="number" value={f.age} onChange={(e) => set("age", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Children · under 18<div className="mt-1 flex gap-1"><input type="number" value={f.children} onChange={(e) => set("children", Number(e.target.value))} className={INPUT} /><input type="number" value={f.childrenUnder18} onChange={(e) => set("childrenUnder18", Number(e.target.value))} className={INPUT} /></div></label>
            <label>State<input value={f.state} onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))} className={`${INPUT} mt-1`} /></label>
            <label>W-2 income (blank = assessment)<input value={f.w2Income} onChange={(e) => set("w2Income", e.target.value)} className={`${INPUT} mt-1`} placeholder="from your assessment" /></label>
            <label>Practice income<input type="number" value={f.practiceIncome} onChange={(e) => set("practiceIncome", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Entity<select value={f.entity} onChange={(e) => set("entity", e.target.value)} className={`${INPUT} mt-1`}><option value="none">None (employee)</option><option value="sole_prop">Sole proprietor</option><option value="partnership">Partnership</option><option value="s_corp">S corporation</option><option value="c_corp">C corporation</option></select></label>
            <label>Income growth %/yr<input type="number" value={f.incomeGrowth} onChange={(e) => set("incomeGrowth", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Home equity<input type="number" value={f.homeEquity} onChange={(e) => set("homeEquity", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Mortgage / HELOC rate %<input type="number" step="0.1" value={f.mortgageRate} onChange={(e) => set("mortgageRate", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Pre-tax retirement balance<input type="number" value={f.pretaxRetirement} onChange={(e) => set("pretaxRetirement", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Net worth<input type="number" value={f.netWorth} onChange={(e) => set("netWorth", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Planned sale gain · year<div className="mt-1 flex gap-1"><input type="number" value={f.plannedSaleGain} onChange={(e) => set("plannedSaleGain", Number(e.target.value))} className={INPUT} /><input value={f.saleYear} onChange={(e) => set("saleYear", e.target.value)} className={INPUT} placeholder="2028" /></div></label>
            <label>Charity per year<input type="number" value={f.charitableIntentPerYear} onChange={(e) => set("charitableIntentPerYear", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Risk capacity<select value={f.riskCapacity} onChange={(e) => set("riskCapacity", e.target.value)} className={`${INPUT} mt-1`}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label>Target bracket · years<div className="mt-1 flex gap-1"><select value={f.targetBracket} onChange={(e) => set("targetBracket", Number(e.target.value))} className={INPUT}><option value={0.24}>24%</option><option value={0.32}>32%</option><option value={0.35}>35%</option><option value={0.37}>37%</option></select><input type="number" value={f.years} onChange={(e) => set("years", Number(e.target.value))} className={INPUT} /></div></label>
            <div className="grid grid-cols-2 gap-1 pt-4">
              <label className="flex items-center gap-1"><input type="checkbox" checked={f.ownsPractice} onChange={(e) => set("ownsPractice", e.target.checked)} />Owns the practice</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={f.hasHdhp} onChange={(e) => set("hasHdhp", e.target.checked)} />High-deductible health plan</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={f.canRunShortTermRental} onChange={(e) => set("canRunShortTermRental", e.target.checked)} />Would run a short-term rental</label>
              <label className="flex items-center gap-1">Rentals<input type="number" value={f.rentalProperties} onChange={(e) => set("rentalProperties", Number(e.target.value))} className="w-14 rounded border border-white/10 bg-black/30 px-1 text-white" /></label>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className={PRIMARY} disabled={run.isPending || !f.goals.length} onClick={() => go(false)}>Build the schedule</button>
            <button type="button" className={BTN} disabled={run.isPending || !r} onClick={() => go(true)}>Seal on my ledger</button>
          </div>
          {r && (
            <div className="mt-4 space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-4 text-sm">
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-400">Federal tax, doing nothing</p><p className="text-lg font-semibold text-white">{usd(r.schedule.totals.baselineTax)}</p><p className="text-[11px] text-slate-500">over {r.schedule.years.length} years</p></div>
                <div className="rounded-xl border border-amber-400/30 p-3"><p className="text-xs text-slate-400">Federal tax, on the schedule</p><p className="text-lg font-semibold text-amber-200">{usd(r.schedule.totals.plannedTax)}</p><p className="text-[11px] text-slate-500">{usd(r.schedule.totals.saved)} saved; Roth conversions are counted as cost</p></div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-400">Deployed across the steps</p><p className="text-lg font-semibold text-white">{usd(r.schedule.totals.deployed)}</p><p className="text-[11px] text-slate-500">{r.schedule.years.reduce((s, y) => s + y.steps.length, 0)} steps</p></div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-400">Once-only structures placed</p><p className="text-sm font-semibold text-white">{r.schedule.onceUsed.length ? r.schedule.onceUsed.map(famName).join(" · ") : "none"}</p></div>
              </div>
              {r.schedule.years.map((y) => (
                <details key={y.year} open={y.year === r.schedule.years[0]!.year} className="rounded-xl border border-white/10 p-3">
                  <summary className="cursor-pointer text-slate-200"><span className="font-semibold text-white">{y.year}</span> · income {usd(y.income)} · tax {usd(y.baselineTax)} → <span className="text-amber-200">{usd(y.plannedTax)}</span> ({pct(y.baselineRate)} → {pct(y.effectiveRate)} effective) · {y.steps.length} steps</summary>
                  <table className="mt-2 w-full text-xs"><thead><tr className="text-left text-slate-500"><th className="py-1 pr-3">Step</th><th className="pr-3">Amount</th><th className="pr-3">Tax saved</th><th className="pr-3">Statute</th><th className="pr-3">Why</th><th>Confidence</th></tr></thead>
                    <tbody>{y.steps.map((s, i) => <tr key={i} className="border-t border-white/5 align-top text-slate-200"><td className="py-1 pr-3 font-medium text-white">{s.name}<p className="text-[10px] text-slate-500">{s.repeat}</p></td><td className="pr-3">{usd(s.amount)}</td><td className={`pr-3 ${s.taxSaved < 0 ? "text-rose-300" : "text-emerald-300"}`}>{usd(s.taxSaved)}</td><td className="pr-3 text-slate-400">{s.statute}</td><td className="pr-3 text-slate-300">{s.reason}{s.risks.length ? <p className="text-[10px] text-slate-500">Risks: {s.risks.join("; ")}</p> : null}</td><td>{Math.round(s.confidence * 100)}%</td></tr>)}</tbody></table>
                  {y.notes.map((n, i) => <p key={i} className="mt-1 text-slate-500">{n}</p>)}
                </details>
              ))}
              <details className="text-slate-400"><summary className="cursor-pointer text-slate-300">Assumptions</summary><ul className="mt-1 list-disc space-y-1 pl-4">{r.schedule.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></details>
              <p className="text-[11px] text-slate-500">Directional education under stated assumptions, not tax, legal or investment advice; a licensed professional confirms every specific and an actuary, a cost-segregation engineer, a captive manager or a carrier sets the real figure where one is named.</p>
            </div>
          )}
        </div>

        {/* The catalogue */}
        <div className={`${CARD} p-5`} aria-label="The catalogue">
          <p className="text-sm font-semibold text-white"><Layers size={14} className="mr-1 inline text-amber-300" /> The catalogue · {cat.data?.families.length ?? 0} families behind the {cat.data?.combinations.length ?? 0} named combinations</p>
          <ul className="mt-2 divide-y divide-white/5">{(cat.data?.families ?? []).map((fam) => (
            <li key={fam.id} className="py-2 text-xs">
              <p><span className="font-medium text-white">{fam.name}</span> <span className="text-slate-500">· {fam.kind.replace(/_/g, " ")} · {fam.repeat} · authority {Math.round(fam.authorityWeight * 100)}% · {fam.statute}</span></p>
              <p className="text-slate-400">{fam.summary}</p>
              <p className="text-slate-500">{Object.entries(fam.params).map(([k, p]) => `${k}: ${typeof p.value === "number" ? p.value.toLocaleString("en-US") : p.value}${p.unit ? ` ${p.unit}` : ""}${p.verified ? "" : " (unverified)"}`).join(" · ")}</p>
              <p className="text-[10px] text-slate-600">Sources: {Array.from(new Set(Object.values(fam.params).map((p) => p.source))).join("; ")}</p>
            </li>
          ))}</ul>
          <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">The hundred named combinations and the families each draws on</summary>
            <ul className="mt-2 grid gap-1 md:grid-cols-2">{(cat.data?.combinations ?? []).map((c) => <li key={c.id}><span className="text-slate-200">{c.id}. {c.title}</span> <span className="text-slate-500">→ {c.families.map(famName).join(", ")}</span></li>)}</ul>
          </details>
        </div>

        {/* The panel */}
        <div className={`${CARD} p-5`} aria-label="The tax authority panel">
          <p className="text-sm font-semibold text-white"><BookOpen size={14} className="mr-1 inline text-amber-300" /> The authorities · weighted by credentialing, track record and consistency</p>
          <p className="mt-1 text-xs text-slate-400">{(cat.data?.tiers ?? []).map((t) => `${t.tier} (${t.weight})`).join(" · ")}</p>
          <ul className="mt-2 divide-y divide-white/5">{(panel.data?.sources ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
              <div><span className="font-medium text-white">{s.name}</span> <span className="text-slate-400">· {s.org} · weight {s.weight.toFixed(2)}</span><p className="text-slate-500">evidence {s.evidence.toFixed(2)} · track {s.trackRecord.toFixed(2)} · consistency {s.consistency.toFixed(2)} · {panel.data?.claims.filter((c) => c.sourceId === s.id).length ?? 0} parameters · {s.publishes}</p></div>
              {isOwner && <button type="button" className={BTN} disabled={harvest.isPending} onClick={() => harvest.mutate({ id: s.id })}>Harvest</button>}
            </li>
          ))}</ul>
          <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">Every parameter on the panel, with its citation</summary>
            <ul className="mt-2 space-y-1">{(panel.data?.claims ?? []).map((c) => <li key={c.id}><span className="text-slate-200">{c.metric.replace(/_/g, " ")}</span>: <span className="text-white">{c.value?.toLocaleString("en-US") ?? "—"} {c.unit ?? ""}</span> · as of {c.asOf} · <span className="text-slate-500">{c.citation}</span></li>)}</ul>
          </details>
        </div>
      </div>
    </AppShell>
  );
}
