// ============================================================
// LOAN FORGIVENESS — for the physician carrying six figures of Direct Loans.
//   1. The record: every program since the 1980s with its authority, who it
//      was for, what it paid, what it asked, how long its window was open
//      and what it produced — and the computed political correlation.
//   2. The panel: the authorities the engine reads, weighted by evidence,
//      track record and consistency, with every claim cited.
//   3. Your outlook: each path's eligibility, the month forgiveness arrives,
//      the amount and its tax, the odds and the confidence, the references —
//      and what the freed payment becomes if it is invested for 20–30 years.
// ============================================================
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GraduationCap, Scale, BookOpen, Target } from "lucide-react";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white w-full";
const PRIMARY = "rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-40";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40";
const pct = (n: number | null | undefined, d = 0) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);
const usd = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const NAMES: Record<string, string> = { "wv-slrp": "West Virginia SLRP", pslf: "PSLF", ibr: "IBR (20-year)", ibr_old: "IBR (25-year, pre-2014)", paye: "PAYE", rap: "RAP (30-year)", "nhsc-lrp": "NHSC Loan Repayment", "ihs-lrp": "IHS Loan Repayment", "va-edrp": "VA EDRP", "nih-lrp": "NIH LRP" };

export default function Forgiveness() {
  const record = trpc.forgiveness.record.useQuery(undefined, { refetchOnWindowFocus: false });
  const panel = trpc.forgiveness.panel.useQuery(undefined, { refetchOnWindowFocus: false });
  const harvests = trpc.erosion.harvests.useQuery({ status: "pending" }, { refetchOnWindowFocus: false, retry: false });
  const isOwner = harvests.isSuccess;
  const utils = trpc.useUtils();
  const harvest = trpc.forgiveness.harvestSource.useMutation({ onSuccess: (r) => { toast[r.harvested ? "success" : "warning"](r.harvested ? `${r.voices.join(", ")} read ${r.pageChars.toLocaleString()} characters: ${r.reported} reported, ${r.verified} quote-verified, ${r.stored} queued` : r.reason); utils.erosion.harvests.invalidate(); }, onError: (e) => toast.error(e.message) });
  const run = trpc.forgiveness.outlook.useMutation({ onError: (e) => toast.error(e.message), onSuccess: (_r, v) => { if (v.seal) toast.success("Sealed on your Plan Ledger"); } });
  const [f, setF] = useState({ balance: "", annualRate: 8, loans: "direct", employer: "nonprofit_501c3", qualifyingPaymentsMade: 0, residencyMonthsLeft: 0, residencyStipend: 65100, attendingIncome: "", incomeGrowth: 3, householdSize: 1, dependents: 0, plan: "ibr", primaryCare: false, willingHPSA: false, willingIHS: false, willingVA: false, research: false, disciplined: true, nominalReturn: 7, taxDrag: 25, wrapperCost: 1, state: "WV" });
  const set = (k: keyof typeof f, v: string | number | boolean) => setF({ ...f, [k]: v });
  const go = (seal: boolean) => run.mutate({ balance: f.balance ? Number(f.balance) : undefined, annualRate: f.annualRate / 100, loans: f.loans as "direct", employer: f.employer as "unknown", qualifyingPaymentsMade: Number(f.qualifyingPaymentsMade), residencyMonthsLeft: Number(f.residencyMonthsLeft), residencyStipend: Number(f.residencyStipend), attendingIncome: f.attendingIncome ? Number(f.attendingIncome) : undefined, incomeGrowth: f.incomeGrowth / 100, householdSize: Number(f.householdSize), dependents: Number(f.dependents), plan: f.plan as "ibr", primaryCare: f.primaryCare, willingHPSA: f.willingHPSA, willingIHS: f.willingIHS, willingVA: f.willingVA, research: f.research, disciplined: f.disciplined, nominalReturn: f.nominalReturn / 100, taxDrag: f.taxDrag / 100, wrapperCost: f.wrapperCost / 100, state: f.state || undefined, seal });
  const r = run.data;
  const corr = record.data?.correlation;

  return (
    <AppShell title="Loan Forgiveness">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80"><GraduationCap size={12} className="mr-1 inline" /> The debt, read as an asset</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Student loan forgiveness: the record, the odds, and what the freed payment becomes</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">A physician leaves training with a median $205,000 of education debt (AAMC, class of 2024). Every federal path that forgives or repays that debt is on this page with the statute it rests on, what it has actually paid out, who held power when it was created or cut, and — for your own numbers — the month it arrives, the amount, the tax, the odds, and the references behind every figure.</p>
        </div>

        {/* 1. The record */}
        <div className={`${CARD} p-5`} aria-label="The record">
          <p className="text-sm font-semibold text-white"><Scale size={14} className="mr-1 inline text-amber-300" /> The record · every program since 1987, with its authority</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-500"><th className="py-1 pr-3">Program</th><th className="pr-3">Authority</th><th className="pr-3">Window</th><th className="pr-3">Who and where</th><th className="pr-3">Pays</th><th className="pr-3">Asks</th><th>Tax</th></tr></thead>
              <tbody>{(record.data?.programs ?? []).map((p) => (
                <tr key={p.id} className="border-t border-white/5 align-top text-slate-200">
                  <td className="py-1 pr-3"><span className="font-medium text-white">{p.name}</span><p className="text-[10px] text-slate-500">{p.kind.replace(/_/g, " ")} · {p.status}</p></td>
                  <td className="pr-3 text-slate-400">{p.authority}</td>
                  <td className="pr-3 text-slate-400">{p.open} → {p.closed ?? "open"}</td>
                  <td className="pr-3 text-slate-400">{p.who}<p className="text-slate-600">{p.institutions}</p></td>
                  <td className="pr-3 text-slate-300">{p.award}</td>
                  <td className="pr-3 text-slate-400">{p.obligation}<p className="text-slate-600">{p.cadence}</p></td>
                  <td className="text-slate-400">{p.tax}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">What each program has produced, with the citation</summary>
            <ul className="mt-2 space-y-1">{(record.data?.programs ?? []).flatMap((p) => p.outcomes.map((o, i) => <li key={`${p.id}-${i}`}><span className="text-slate-200">{p.name}</span> · {o.metric}: <span className="text-white">{o.value}</span> · as of {o.asOf} · <span className="text-slate-500">{o.citation}</span></li>))}</ul>
            <p className="mt-2 text-slate-500">References: {(record.data?.programs ?? []).flatMap((p) => p.citations).filter((c, i, a) => a.indexOf(c) === i).join("; ")}</p>
          </details>
          {corr && (
            <div className="mt-3 rounded-xl border border-white/10 p-3 text-xs">
              <p className="font-semibold text-white">Who held the levers when forgiveness expanded or contracted</p>
              <p className="mt-1 text-slate-300">{corr.expansions} expansions and {corr.contractions} contractions on the record. Mean Democratic lever share behind expansions {pct(corr.meanShareExpansions)}, behind contractions {pct(corr.meanShareContractions)}. Left-held years: {corr.byBucket.left.expansions} expansions, {corr.byBucket.left.contractions} contractions · divided: {corr.byBucket.divided.expansions} / {corr.byBucket.divided.contractions} · right-held: {corr.byBucket.right.expansions} / {corr.byBucket.right.contractions}. Point-biserial r = {corr.r} on n = {corr.n}.</p>
              <p className="mt-1 text-slate-500">{corr.reading} This correlation feeds the outlook below through the same power layer that drives the tax path: the survival hazard of a program is tilted by who is expected to hold the levers while you pursue it.</p>
              <details className="mt-2"><summary className="cursor-pointer text-slate-300">Every event</summary><ul className="mt-1 space-y-0.5">{(record.data?.events ?? []).map((e) => <li key={e.date}><span className={e.direction > 0 ? "text-emerald-300" : "text-rose-300"}>{e.direction > 0 ? "+" : "−"}</span> {e.date} · {e.label} · {e.enactedBy} · president {e.president}, Senate {e.senate}, House {e.house}{e.trifecta ? ` (${e.trifecta} trifecta)` : ""} · lever share {pct(e.leverShare)}</li>)}</ul></details>
            </div>
          )}
        </div>

        {/* 2. The panel */}
        <div className={`${CARD} p-5`} aria-label="The forgiveness panel">
          <p className="text-sm font-semibold text-white"><BookOpen size={14} className="mr-1 inline text-amber-300" /> The authorities · weight = evidence × track record × consistency</p>
          <ul className="mt-2 divide-y divide-white/5">{(panel.data?.sources ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
              <div><span className="font-medium text-white">{s.name}</span> <span className="text-slate-400">· {s.org} · weight {s.weight.toFixed(2)}</span><p className="text-slate-500">evidence {s.evidence.toFixed(2)} · track {s.trackRecord.toFixed(2)} · consistency {s.consistency.toFixed(2)} · {panel.data?.claims.filter((c) => c.sourceId === s.id).length ?? 0} claims · {s.publishes}</p></div>
              {isOwner && <button type="button" className={BTN} disabled={harvest.isPending} onClick={() => harvest.mutate({ id: s.id })}>Harvest</button>}
            </li>
          ))}</ul>
          <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">Every claim, with its citation and the platform's reading</summary>
            <ul className="mt-2 space-y-1">{(panel.data?.claims ?? []).map((c) => <li key={c.id}><span className="text-slate-200">{c.sourceId.replace("slf-", "")}</span> · {c.metric.replace(/_/g, " ")} {c.horizonYear}: <span className="text-white">{c.value?.toLocaleString("en-US") ?? "—"} {c.unit ?? ""}</span>{c.baseValue != null ? ` (from ${c.baseValue.toLocaleString("en-US")})` : ""} · {c.reading ?? ""} · as of {c.asOf} · <span className="text-slate-500">{c.citation}</span>{c.note ? <span className="text-slate-600"> — {c.note}</span> : null}</li>)}</ul>
          </details>
        </div>

        {/* 3. Your outlook */}
        <div className={`${CARD} p-5`} aria-label="Your outlook">
          <p className="text-sm font-semibold text-white"><Target size={14} className="mr-1 inline text-amber-300" /> Your outlook · every path, with its odds and its references</p>
          <div className="mt-3 grid gap-2 md:grid-cols-4 text-xs text-slate-400">
            <label>Loan balance (blank = assessment)<input value={f.balance} onChange={(e) => set("balance", e.target.value)} className={`${INPUT} mt-1`} placeholder="e.g. 205000" /></label>
            <label>Interest rate %<input type="number" step="0.01" value={f.annualRate} onChange={(e) => set("annualRate", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Loan type<select value={f.loans} onChange={(e) => set("loans", e.target.value)} className={`${INPUT} mt-1`}><option value="direct">Federal Direct</option><option value="ffel_unconsolidated">FFEL, not consolidated</option><option value="mixed">Mixed federal and private</option><option value="private">Private</option></select></label>
            <label>Employer<select value={f.employer} onChange={(e) => set("employer", e.target.value)} className={`${INPUT} mt-1`}><option value="nonprofit_501c3">501(c)(3) hospital or system</option><option value="government">Government (incl. VA, military, state university)</option><option value="other_nonprofit">Other not-for-profit</option><option value="for_profit">For-profit group or company</option><option value="unknown">Not sure</option></select></label>
            <label>Qualifying payments already made<input type="number" value={f.qualifyingPaymentsMade} onChange={(e) => set("qualifyingPaymentsMade", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Months of training left<input type="number" value={f.residencyMonthsLeft} onChange={(e) => set("residencyMonthsLeft", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Training stipend $/yr<input type="number" value={f.residencyStipend} onChange={(e) => set("residencyStipend", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Income after training (blank = assessment)<input value={f.attendingIncome} onChange={(e) => set("attendingIncome", e.target.value)} className={`${INPUT} mt-1`} placeholder="e.g. 300000" /></label>
            <label>Income growth %/yr<input type="number" value={f.incomeGrowth} onChange={(e) => set("incomeGrowth", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Household size<input type="number" value={f.householdSize} onChange={(e) => set("householdSize", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Dependents<input type="number" value={f.dependents} onChange={(e) => set("dependents", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Repayment plan<select value={f.plan} onChange={(e) => set("plan", e.target.value)} className={`${INPUT} mt-1`}><option value="ibr">IBR (10%, 20 years)</option><option value="ibr_old">IBR pre-2014 (15%, 25 years)</option><option value="paye">PAYE (ends by 2028)</option><option value="rap">RAP (1–10% of AGI, 30 years)</option><option value="standard">10-year Standard</option></select></label>
            <label>Return on invested payments %/yr<input type="number" value={f.nominalReturn} onChange={(e) => set("nominalReturn", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Tax drag on a taxable account %<input type="number" value={f.taxDrag} onChange={(e) => set("taxDrag", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>Tax-free wrapper cost %/yr<input type="number" step="0.1" value={f.wrapperCost} onChange={(e) => set("wrapperCost", Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label>State of practice<input value={f.state} onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))} className={`${INPUT} mt-1`} placeholder="WV" /></label>
            <div className="grid grid-cols-2 gap-1 pt-4">
              {([["primaryCare", "Primary care"], ["willingHPSA", "Would serve in a shortage area (NHSC)"], ["willingIHS", "Would serve at IHS"], ["willingVA", "Would work at the VA"], ["research", "Research career (NIH)"], ["disciplined", "Certifies annually, advisor watching"]] as const).map(([k, label]) => <label key={k} className="flex items-center gap-1"><input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />{label}</label>)}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className={PRIMARY} disabled={run.isPending} onClick={() => go(false)}>Run the outlook</button>
            <button type="button" className={BTN} disabled={run.isPending || !r} onClick={() => go(true)}>Seal on my ledger</button>
          </div>
          {r && (
            <div className="mt-4 space-y-4 text-xs">
              <p className="text-slate-400">10-year standard payment {usd(r.standardPayment)} a month ({usd(r.standardTotal)} over ten years). Political term: {r.powerNote}.</p>
              {r.best && (
                <div className="grid gap-3 sm:grid-cols-4 text-sm">
                  <div className="rounded-xl border border-amber-400/30 p-3"><p className="text-xs text-slate-400">Best path</p><p className="text-lg font-semibold text-amber-200">{NAMES[r.best.programId] ?? r.best.programId}</p><p className="text-[11px] text-slate-500">arrives {r.best.forgivenessDate} · {r.best.monthsToForgiveness} months</p></div>
                  <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-400">Forgiven, net of tax</p><p className="text-lg font-semibold text-white">{usd(r.best.netBenefit)}</p><p className="text-[11px] text-slate-500">{usd(r.best.forgivenAmount)} forgiven ({usd(r.best.forgivenPrincipal)} principal + {usd(r.best.forgivenInterest)} interest); tax {usd(r.best.taxOnForgiveness)}; paid before {usd(r.best.totalPaidBefore)}</p></div>
                  <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-400">Odds · confidence</p><p className="text-lg font-semibold text-white">{pct(r.best.probability)} · {pct(r.best.confidence)}</p><p className="text-[11px] text-slate-500">{r.best.probabilityParts ? `program survives ${pct(r.best.probabilityParts.programSurvives)}${r.best.probabilityParts.staysEligible != null ? ` × you stay eligible ${pct(r.best.probabilityParts.staysEligible)}` : ""} × you execute ${pct(r.best.probabilityParts.borrowerExecutes)}${r.best.probabilityParts.award != null ? ` × award ${pct(r.best.probabilityParts.award)}` : ""}` : ""}</p></div>
                  {r.alternative && <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-400">The freed payment, invested</p><p className="text-lg font-semibold text-white">{usd(r.alternative.taxFree.value30)}</p><p className="text-[11px] text-slate-500">in 30 years tax-free at {pct(r.alternative.taxFree.annualReturnUsed, 1)} net ({usd(r.alternative.taxFree.value20)} at 20); taxable {usd(r.alternative.taxable.value30)}; {usd(r.alternative.monthlyFreed)} a month freed today</p></div>}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500"><th className="py-1 pr-3">Path</th><th className="pr-3">Eligible</th><th className="pr-3">Arrives</th><th className="pr-3">Paid before</th><th className="pr-3">Forgiven</th><th className="pr-3">Tax</th><th className="pr-3">Net</th><th className="pr-3">Odds</th><th>Confidence</th></tr></thead>
                  <tbody>{r.paths.map((p) => (
                    <tr key={p.programId} className="border-t border-white/5 align-top text-slate-200">
                      <td className="py-1 pr-3 font-medium text-white">{NAMES[p.programId] ?? p.programId}</td>
                      <td className="pr-3">{p.eligible ? "yes" : "no"}{p.reasons.length ? <p className="text-[10px] text-slate-500">{p.reasons.join(" · ")}</p> : null}</td>
                      <td className="pr-3">{p.forgivenessDate ?? "—"}{p.monthsToForgiveness != null ? <p className="text-[10px] text-slate-500">{p.monthsToForgiveness} months</p> : null}</td>
                      <td className="pr-3">{usd(p.totalPaidBefore)}</td><td className="pr-3">{usd(p.forgivenAmount)}</td><td className="pr-3">{usd(p.taxOnForgiveness)}</td><td className="pr-3 font-semibold text-white">{usd(p.netBenefit)}</td><td className="pr-3">{pct(p.probability)}</td><td>{pct(p.confidence)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {r.paths.map((p) => (p.notes.length || p.citations.length) ? <details key={p.programId} className="text-slate-400"><summary className="cursor-pointer text-slate-300">{NAMES[p.programId] ?? p.programId}: the thinking and the references</summary><ul className="mt-1 list-disc space-y-1 pl-4">{p.notes.map((n, i) => <li key={i}>{n}</li>)}</ul><p className="mt-1 text-slate-500">References: {p.citations.join("; ")}</p></details> : null)}
              {r.alternative && <details className="text-slate-400"><summary className="cursor-pointer text-slate-300">The investment side: assumptions</summary><ul className="mt-1 list-disc space-y-1 pl-4">{r.alternative.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul><p className="mt-1">Contributed by year 20: {usd(r.alternative.taxable.contributed20)}; by year 30: {usd(r.alternative.taxable.contributed30)}.</p></details>}
              <p className="text-[11px] text-slate-500">Directional education under stated assumptions, not tax, legal or investment advice; a licensed professional confirms every specific. Statutes and rules as of September 2026; the Department of Education's PSLF changes scheduled for July 1, 2026 are under a court order.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
