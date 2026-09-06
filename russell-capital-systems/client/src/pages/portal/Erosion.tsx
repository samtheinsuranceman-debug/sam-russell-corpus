// ============================================================
// PURCHASING POWER — the two forces that melt a plan, on one page.
//   1. The tax trajectory: what history says happens to rates over 5–40
//      years, what the weighted forecaster panel says, and the blended
//      probability, expected rate and confidence at every horizon.
//   2. The inflation ladder: price change by category over 1–40 years
//      from BLS data, the client's own basket, and what a dollar buys.
//   3. Two projections of the client's own income and savings in today's
//      dollars: current law versus the expected tax path, plus the nominal
//      return needed to actually grow after inflation and tax.
// ============================================================
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TrendingDown, Scale, Flame, Target, BookOpen } from "lucide-react";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white w-full";
const PRIMARY = "rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-40";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40";
const pct = (n: number | null | undefined, d = 1) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);
const usd = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));

export default function Erosion() {
  const history = trpc.erosion.history.useQuery(undefined, { refetchOnWindowFocus: false });
  const traj = trpc.erosion.trajectory.useQuery(undefined, { refetchOnWindowFocus: false });
  const infl = trpc.erosion.inflation.useQuery(undefined, { refetchOnWindowFocus: false });
  const panel = trpc.erosion.panel.useQuery(undefined, { refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const [income, setIncome] = useState<string>("");
  const [growth, setGrowth] = useState(3);
  const [saveRate, setSaveRate] = useState(20);
  const [savings, setSavings] = useState<string>("");
  const [ret, setRet] = useState(7);
  const [taxG, setTaxG] = useState(25);
  const [inflation, setInflation] = useState<string>("");
  const [realTarget, setRealTarget] = useState(3);
  const [weights, setWeights] = useState<Record<string, number>>({ shelter: 35, food_home: 15, medical: 15, tuition: 10, gasoline: 10, energy: 5, auto_insurance: 5, all: 5 });
  const run = trpc.erosion.projection.useMutation({ onError: (e) => toast.error(e.message), onSuccess: (r, v) => { if (v.seal) { toast.success("Sealed on your Plan Ledger"); } } });
  const harvests = trpc.erosion.harvests.useQuery({ status: "pending" }, { refetchOnWindowFocus: false, retry: false });
  const isOwner = harvests.isSuccess;
  const harvest = trpc.erosion.harvestSource.useMutation({ onSuccess: (r) => { toast[r.harvested ? "success" : "warning"](r.harvested ? `${r.voices.join(", ")} read ${r.pageChars.toLocaleString()} characters: ${r.reported} reported, ${r.verified} quote-verified, ${r.stored} queued${r.duplicates ? `, ${r.duplicates} already queued` : ""}` : r.reason); utils.erosion.harvests.invalidate(); }, onError: (e) => toast.error(e.message) });
  const harvestEverything = trpc.erosion.harvestAll.useMutation({ onSuccess: (rs) => { const stored = rs.reduce((s, r) => s + (r.harvested ? r.stored : 0), 0); toast.success(`${rs.length} sources read, ${stored} figures queued for review`); utils.erosion.harvests.invalidate(); }, onError: (e) => toast.error(e.message) });
  const score = trpc.erosion.scorePanel.useMutation({ onSuccess: (r) => { toast.success(`${r.scored.length} claims scored against published outcomes (${r.skipped} not yet closed or without a series); consistency regraded for ${Object.keys(r.consistency).length} sources`); utils.erosion.panel.invalidate(); utils.erosion.trajectory.invalidate(); }, onError: (e) => toast.error(e.message) });
  const decide = trpc.erosion.reviewHarvest.useMutation({ onSuccess: (r) => { toast.success(r.status === "approved" ? "Added to the panel" : "Rejected"); utils.erosion.harvests.invalidate(); utils.erosion.panel.invalidate(); utils.erosion.trajectory.invalidate(); }, onError: (e) => toast.error(e.message) });
  const review = trpc.erosion.reviewSource.useMutation({ onSuccess: (r) => { toast[r.reviewed ? "success" : "warning"](r.reviewed ? `Council graded evidence ${r.evidence} (${r.voices.join(", ")})` : r.reason); utils.erosion.panel.invalidate(); utils.erosion.trajectory.invalidate(); }, onError: (e) => toast.error(e.message) });
  const basket = Object.entries(weights).map(([categoryId, weight]) => ({ categoryId, weight }));
  const go = (seal: boolean) => run.mutate({ income: income ? Number(income) : undefined, incomeGrowth: growth / 100, savingsRate: saveRate / 100, savings: savings ? Number(savings) : 0, nominalReturn: ret / 100, taxOnGrowth: taxG / 100, inflation: inflation ? Number(inflation) / 100 : undefined, basket, realTarget: realTarget / 100, seal });
  const r = run.data;
  const ladderYears = infl.data?.ladderYears ?? [1, 2, 5, 10, 15, 20, 25, 30, 35, 40];

  return (
    <AppShell title="Purchasing Power">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80"><TrendingDown size={12} className="mr-1 inline" /> Two forces melt a plan</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Purchasing power over the next 40 years</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">Taxes and prices both erode what your money buys. The tax path here is not one person's guess: it is the published record of every rate change since 1946 blended with a weighted panel of long-horizon forecasters, with a probability and a confidence score at every five-year mark. The price path is the Bureau of Labor Statistics' own category data. Then both run against your plan.</p>
        </div>

        {/* 1. Tax trajectory */}
        <div className={`${CARD} p-5`} aria-label="Tax trajectory">
          <p className="text-sm font-semibold text-white"><Scale size={14} className="mr-1 inline text-amber-300" /> The tax trajectory · top federal rate today {history.data?.topMarginal.at(-1)?.value}%</p>
          <p className="mt-1 text-xs text-slate-400">History: every {`{5…40}`}-year window since 1946. Panel: {traj.data?.panel.length ?? 0} forecasters, {traj.data?.claimsUsed ?? 0} published claims. The blend leans on the panel only where it has actually spoken.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-500"><th className="py-1 pr-3">Horizon</th><th className="pr-3">Year</th><th className="pr-3">History: P(higher)</th><th className="pr-3">Typical move</th><th className="pr-3">Panel direction</th><th className="pr-3">Panel coverage</th><th className="pr-3">P(higher)</th><th className="pr-3">Expected top rate</th><th className="pr-3">Burden ×</th><th>Confidence</th></tr></thead>
              <tbody>
                {(traj.data?.points ?? []).map((p) => (
                  <tr key={p.horizonYears} className="border-t border-white/5 text-slate-200">
                    <td className="py-1 pr-3">{p.horizonYears}y</td><td className="pr-3">{p.year}</td><td className="pr-3">{pct(p.history.pUp, 0)}</td><td className="pr-3">±{p.history.meanAbsChange.toFixed(1)} pts</td>
                    <td className="pr-3">{p.consensus.claims ? (p.consensus.direction > 0 ? "up" : p.consensus.direction < 0 ? "down" : "flat") : "—"}</td><td className="pr-3">{pct(p.consensus.coverage, 0)}</td>
                    <td className="pr-3 font-semibold text-white">{pct(p.pHigher, 0)}</td><td className="pr-3">{p.expectedTopRate.toFixed(1)}%</td><td className="pr-3">{p.burdenMultiplier.toFixed(3)}</td><td>{pct(p.confidence, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">The record: every change in the top rate since 1946</summary>
            <p className="mt-2">{(history.data?.events ?? []).map((e) => `${e.year}: ${e.from}% → ${e.to}%`).join(" · ")}</p>
            <p className="mt-2 text-slate-500">Sources: {(history.data?.sources ?? []).join("; ")}</p>
          </details>
        </div>

        {/* Panel */}
        <div className={`${CARD} p-5`} aria-label="Forecaster panel">
          <p className="text-sm font-semibold text-white"><BookOpen size={14} className="mr-1 inline text-amber-300" /> The forecaster panel</p>
          <p className="mt-1 text-xs text-slate-400">Weight = evidence × track record × consistency. Track record accrues as each claim's published outcome is recorded ("Score the panel" does this from OMB and Treasury figures on FRED once a year has closed); consistency is graded from how much a source's own successive projections move. "Ask the council" has every configured AI voice grade a source's evidence and reconciles them.</p>
          <ul className="mt-2 divide-y divide-white/5">
            {(panel.data?.sources ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                <div>
                  <span className="font-medium text-white">{s.name}</span> <span className="text-slate-400">· {s.org} · {s.horizonYears}y · weight {s.weight.toFixed(2)}</span>
                  <p className="text-slate-500">evidence {s.evidence.toFixed(2)}{s.aiEvidence != null ? ` (council ${s.aiEvidence.toFixed(2)})` : ""} · track {s.trackRecord.toFixed(2)} · consistency {s.consistency.toFixed(2)} · {panel.data?.claims.filter((c) => c.sourceId === s.id).length ?? 0} claims</p>
                  {s.aiRationale && <p className="text-slate-500">{s.aiRationale}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" className={BTN} disabled={review.isPending} onClick={() => review.mutate({ id: s.id })}>Ask the council</button>
                  {isOwner && <button type="button" className={BTN} disabled={harvest.isPending} onClick={() => harvest.mutate({ id: s.id })} title="The council reads this source's page and reports figures with the sentence each came from">Harvest</button>}
                </div>
              </li>
            ))}
          </ul>
          {isOwner && (
            <div className="mt-3 rounded-xl border border-white/10 p-3" aria-label="Harvested figures awaiting review">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white">Harvested figures awaiting your review · {harvests.data?.length ?? 0}</p>
                <div className="flex gap-2">
                  <button type="button" className={BTN} disabled={score.isPending} onClick={() => score.mutate()} title="Records the published outcome (OMB/Treasury figures on FRED) against every claim whose year has closed, recomputes track records, and regrades each source's consistency from its own successive projections">{score.isPending ? "Scoring…" : "Score the panel"}</button>
                  <button type="button" className={BTN} disabled={harvestEverything.isPending} onClick={() => harvestEverything.mutate()}>{harvestEverything.isPending ? "Reading every source…" : "Harvest every source"}</button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Each figure was read off the source's own page by the AI voices named, and its sentence was checked against the fetched text before it could appear here. Direction and burden multiplier are the platform's fixed reading of the metric, never the AI's. Approving adds it to the panel with the quote as its note.</p>
              {harvests.data?.length ? (
                <ul className="mt-2 divide-y divide-white/5">
                  {harvests.data.map((h) => (
                    <li key={h.id} className="flex flex-wrap items-start justify-between gap-2 py-2 text-xs">
                      <div className="max-w-3xl">
                        <p className="text-slate-200"><span className="font-medium text-white">{h.sourceId}</span> · {h.metric.replace(/_/g, " ")} {h.horizonYear}: <span className="font-semibold text-white">{h.value ?? "—"} {h.unit ?? ""}</span>{h.baseValue != null ? ` (from ${h.baseValue})` : ""} · reading {h.direction > 0 ? "up" : h.direction < 0 ? "down" : "flat"}{h.burdenMultiplier != null ? ` ×${h.burdenMultiplier.toFixed(3)}` : ""} · as of {h.asOf} · {h.voices.join(", ")}{h.corroborated > 1 ? ` (${h.corroborated} agree)` : ""}</p>
                        <p className="mt-0.5 text-slate-400">“{h.quote}”</p>
                        <p className="text-slate-600">{h.url}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className={PRIMARY} disabled={decide.isPending} onClick={() => decide.mutate({ id: h.id, approve: true })}>Approve</button>
                        <button type="button" className={BTN} disabled={decide.isPending} onClick={() => decide.mutate({ id: h.id, approve: false })}>Reject</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-xs text-slate-500">Nothing waiting. Harvest a source above, or set EROSION_HARVEST_DAYS on the host for a scheduled sweep.</p>}
            </div>
          )}
          <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">Every claim, with its citation</summary>
            <ul className="mt-2 space-y-1">{(panel.data?.claims ?? []).map((c) => <li key={c.id}><span className="text-slate-200">{c.sourceId}</span> · {c.metric.replace(/_/g, " ")} {c.horizonYear}: {c.value ?? "—"} {c.unit ?? ""}{c.baseValue != null ? ` (from ${c.baseValue})` : ""} · as of {c.asOf} · <span className="text-slate-500">{c.citation}</span>{c.note ? <span className="text-slate-600"> — {c.note}</span> : null}</li>)}</ul>
          </details>
        </div>

        {/* 2. Inflation ladder */}
        <div className={`${CARD} p-5`} aria-label="Inflation ladder">
          <p className="text-sm font-semibold text-white"><Flame size={14} className="mr-1 inline text-amber-300" /> The inflation ladder · annualised price change by category</p>
          <p className="mt-1 text-xs text-slate-400">Live from the Bureau of Labor Statistics via FRED{infl.data?.mode === "csv" ? " (public download; a free FRED_API_KEY on the host switches to the keyed API)" : ""}, same month each year. Nothing is typed in by hand{infl.data?.categories.some((c) => c.source === "unavailable") ? "; a row marked unavailable has not answered yet and shows no number rather than a guess" : ""}.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-500"><th className="py-1 pr-3">Category</th>{ladderYears.map((y) => <th key={y} className="pr-2">{y}y</th>)}<th>as of</th><th>weight</th></tr></thead>
              <tbody>
                {(infl.data?.categories ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-white/5 text-slate-200">
                    <td className="py-1 pr-3">{c.label}{c.source === "unavailable" ? <span className="text-slate-600"> (unavailable)</span> : null}</td>
                    {ladderYears.map((y) => <td key={y} className="pr-2">{pct((c.rates as Record<number, number>)[y])}</td>)}
                    <td className="text-slate-500">{c.asOf || "—"}</td>
                    <td>{c.id !== "m2" && <input type="number" min={0} max={100} value={weights[c.id] ?? 0} onChange={(e) => setWeights({ ...weights, [c.id]: Number(e.target.value) })} className="w-14 rounded border border-white/10 bg-black/30 px-1 text-xs text-white" aria-label={`Weight ${c.label}`} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Weights are your own spending mix; the 20-year rate of that basket becomes your inflation rate below unless you type one.</p>
        </div>

        {/* 3. Two projections */}
        <div className={`${CARD} p-5`} aria-label="Two projections">
          <p className="text-sm font-semibold text-white"><Target size={14} className="mr-1 inline text-amber-300" /> Your plan under both forces, in today's dollars</p>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <label className="text-xs text-slate-400">Income (blank = assessment)<input value={income} onChange={(e) => setIncome(e.target.value)} className={`${INPUT} mt-1`} placeholder="from your assessment" /></label>
            <label className="text-xs text-slate-400">Income growth %/yr<input type="number" value={growth} onChange={(e) => setGrowth(Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label className="text-xs text-slate-400">Savings rate % of after-tax<input type="number" value={saveRate} onChange={(e) => setSaveRate(Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label className="text-xs text-slate-400">Invested assets today<input value={savings} onChange={(e) => setSavings(e.target.value)} className={`${INPUT} mt-1`} placeholder="0" /></label>
            <label className="text-xs text-slate-400">Nominal return %/yr<input type="number" value={ret} onChange={(e) => setRet(Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label className="text-xs text-slate-400">Tax on growth %<input type="number" value={taxG} onChange={(e) => setTaxG(Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
            <label className="text-xs text-slate-400">Inflation % (blank = your basket)<input value={inflation} onChange={(e) => setInflation(e.target.value)} className={`${INPUT} mt-1`} placeholder="basket / CPI" /></label>
            <label className="text-xs text-slate-400">Real growth target %/yr<input type="number" value={realTarget} onChange={(e) => setRealTarget(Number(e.target.value))} className={`${INPUT} mt-1`} /></label>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className={PRIMARY} disabled={run.isPending} onClick={() => go(false)}>Run both projections</button>
            <button type="button" className={BTN} disabled={run.isPending || !r} onClick={() => go(true)}>Seal on my ledger</button>
          </div>
          {r && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-400">Inflation used</p><p className="text-lg font-semibold text-white">{pct(r.inflation)}</p><p className="text-[11px] text-slate-500">{r.basket ? `your basket, ${pct(r.basket.covered, 0)} of weight covered by data` : "entered or CPI"}</p></div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs text-slate-400">A dollar in 40 years buys</p><p className="text-lg font-semibold text-white">{(r.purchasingPower[40] * 100).toFixed(0)}¢</p><p className="text-[11px] text-slate-500">at {pct(r.inflation)} a year</p></div>
                <div className="rounded-xl border border-amber-400/30 p-3"><p className="text-xs text-slate-400">Nominal return needed to grow {pct(r.summary.hurdle.realTarget, 0)} real after tax</p><p className="text-lg font-semibold text-amber-200">{pct(r.summary.hurdle.nominalNeeded)}</p><p className="text-[11px] text-slate-500">{r.hurdleTable.map((h) => `${pct(h.inflation, 0)} inflation → ${pct(h.nominalNeeded)}`).join(" · ")}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500"><th className="py-1 pr-3">Horizon</th><th className="pr-3">P(higher taxes)</th><th className="pr-3">Confidence</th><th className="pr-3">Effective rate: law</th><th className="pr-3">Effective rate: expected</th><th className="pr-3">Real wealth: current law</th><th className="pr-3">Real wealth: expected path</th><th>Gap</th></tr></thead>
                  <tbody>
                    {Object.entries(r.horizons).map(([h, v]) => {
                      const hb = r.summary.baseline.at[Number(h)], ha = r.summary.alternate.at[Number(h)];
                      return <tr key={h} className="border-t border-white/5 text-slate-200"><td className="py-1 pr-3">{h}y</td><td className="pr-3">{pct(v.pHigher, 0)}</td><td className="pr-3">{pct(v.confidence, 0)}</td><td className="pr-3">{pct(hb?.effectiveRate)}</td><td className="pr-3">{pct(ha?.effectiveRate)}</td><td className="pr-3">{usd(v.baselineRealWealth)}</td><td className="pr-3">{usd(v.alternateRealWealth)}</td><td className={v.gap != null && v.gap < 0 ? "text-rose-300" : "text-emerald-300"}>{usd(v.gap)}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500">Cumulative extra federal tax on the expected path: {usd(r.summary.cumulativeExtraTax)}. Both projections use the 2026 rule set with brackets indexed at the inflation rate; the expected path scales your effective federal rate by the burden multiplier. Directional education, not advice; every assumption is printed above.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
