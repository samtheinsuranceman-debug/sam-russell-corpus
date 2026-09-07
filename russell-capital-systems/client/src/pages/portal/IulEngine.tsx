// ============================================================
// THE IUL ENGINE — the policy's crediting read against the other engines:
// the tax engine (what a taxable account would have to earn), the inflation
// engine (CPI beside the credited rate, year by year), the fiat engine (M2
// beside it), liquidity (a loan beside the other ways of reaching money),
// and how the account value is credited while a loan is out. Every number
// is the record or arithmetic on it; the caveat sits above every correlation.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Calculator, TrendingUp, Banknote, Droplets, BookOpen } from "lucide-react";

const CARD = "rounded-2xl border border-cyan-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white w-full";
const H = "text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80";
const pct = (n: number | null | undefined, d = 2) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);

export default function IulEngine() {
  const [optionId, setOptionId] = useState<string | undefined>(undefined);
  const [stateRate, setStateRate] = useState(0);
  const [niit, setNiit] = useState(false);
  const [basis, setBasis] = useState<"record" | "last10">("record");
  const history = trpc.iulLinks.history.useQuery({ optionId }, { refetchOnWindowFocus: false, retry: false, placeholderData: (p) => p });
  const h = history.data;
  const rate = h ? (basis === "record" ? h.averages.record : h.averages.last10) : 0;
  const te = trpc.iulLinks.taxEquivalent.useQuery({ rate, stateRate, niit }, { enabled: !!h, refetchOnWindowFocus: false, retry: false, placeholderData: (p) => p });

  return (
    <AppShell title="The IUL Engine">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className={H}><ShieldCheck size={12} className="mr-1 inline" /> Life insurance as an engine</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">The policy's crediting, read against the tax engine, the inflation engine and the money supply</h1>
          <p className="mt-2 text-sm text-white/70">Pick an index account. The page shows what a taxable account would have to earn to match its credited rate after tax, then lays the credited rate year by year beside the CPI and beside M2, with the correlation printed and the caveat above it. The <Link href="/portal/rental-enterprise" className="text-cyan-300 underline">Rental Enterprise</Link> runs the trust loop on the same history; the <Link href="/portal/iul-historical" className="text-cyan-300 underline">IUL Historical</Link> page shows the history alone.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3 text-[11px] text-white/70">
            <label className="block">Index account (backtester)<select className={`${INPUT} mt-0.5`} value={h?.option.id ?? ""} onChange={(e) => setOptionId(e.target.value)}>{(h?.options ?? []).map((o) => <option key={o.id} value={o.id}>{o.name} — {o.carrier}</option>)}</select></label>
            <label className="block">Rate to net<select className={`${INPUT} mt-0.5`} value={basis} onChange={(e) => setBasis(e.target.value as "record" | "last10")}><option value="record">Average credited over the record ({h ? pct(h.averages.record) : "—"})</option><option value="last10">Average over the last ten years ({h ? pct(h.averages.last10) : "—"})</option></select></label>
            <div className="text-white/50">{h ? `${h.option.name}: ${h.option.cap != null ? `cap ${h.option.cap}%` : "uncapped"}, floor ${h.option.floor}%, participation ${h.option.participation}%; history from ${h.option.availableFrom}, ${h.averages.years} years. ${h.option.description}` : history.isFetching ? "reading…" : ""}</div>
          </div>
        </div>

        {/* 1. Tax engine */}
        <div className={`${CARD} p-6`}>
          <p className={H}><Calculator size={12} className="mr-1 inline" /> 1. What a taxable account would have to earn</p>
          <div className="mt-2 grid gap-3 md:grid-cols-3 text-[11px] text-white/70">
            <label className="block">State income tax rate %<input type="number" step={0.1} className={`${INPUT} mt-0.5`} value={Math.round(stateRate * 1000) / 10} onChange={(e) => setStateRate(Number(e.target.value) / 100)} /></label>
            <label className="mt-4 flex items-center gap-2 text-white"><input type="checkbox" checked={niit} onChange={(e) => setNiit(e.target.checked)} /> Add the 3.8% net investment income tax</label>
            <div className="text-white/50">{te.data?.note}</div>
          </div>
          {te.data && (
            <div className="mt-3 overflow-x-auto"><table className="w-full text-xs">
              <thead><tr className="text-white/50"><th className="py-1 text-left">Marginal federal rate</th><th className="text-right">Combined rate</th><th className="text-right">Credited rate to net</th><th className="text-right">A taxable account must earn</th></tr></thead>
              <tbody>{te.data.rows.map((r) => <tr key={r.marginalRate} className={`border-t border-white/5 ${r.mine ? "bg-cyan-400/10 font-semibold text-white" : "text-white/80"}`}><td className="py-1">{pct(r.marginalRate, 0)}{r.mine ? " (your Fact Finder)" : ""}</td><td className="text-right">{pct(r.marginalRate + te.data!.stateRate + te.data!.niitRate, 1)}</td><td className="text-right">{pct(te.data!.rate)}</td><td className="text-right">{pct(r.taxable)}</td></tr>)}</tbody>
            </table></div>
          )}
          <p className="mt-2 text-[11px] text-white/45">The credited rate is the backtester's arithmetic on the index's past under this account's cap, floor and participation; it is not a return any policy received. Policy charges are not in this table; the Rental Enterprise loop applies them.</p>
        </div>

        {/* 2 & 3. Inflation and M2 */}
        {h && (
          <div className={`${CARD} p-6`}>
            <p className={H}><TrendingUp size={12} className="mr-1 inline" /> 2. The credited rate beside the CPI, and 3. beside M2</p>
            <p className="mt-2 text-xs text-white/60">{h.caveat}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[h.cpi, h.m2].map((s, i) => s ? (
                <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/75">
                  <div className="font-semibold text-white">{s.key === "cpi" ? "CPI-U, December over December" : "M2 money stock, December over December"} (median {pct(s.median, 1)})</div>
                  <div className="mt-1">Years above the median ({s.high.n}): mean credited {pct(s.high.meanCredited)}.</div>
                  <div>Years at or below the median ({s.low.n}): mean credited {pct(s.low.meanCredited)}.</div>
                  <div className="mt-1">Correlation with the credited rate: {s.correlation == null ? "not enough years" : s.correlation.toFixed(2)}.</div>
                </div>
              ) : <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/50">No {i === 0 ? "CPI" : "M2"} reading on this host yet; the FRED series answers when the network allows.</div>)}
            </div>
            <div className="mt-3 overflow-x-auto"><table className="w-full text-[11px]">
              <thead><tr className="text-white/50"><th className="py-1 text-left">Year</th><th className="text-right">Credited</th><th className="text-right">CPI</th><th className="text-right">M2</th></tr></thead>
              <tbody>{h.pairs.map((p) => <tr key={p.year} className="border-t border-white/5 text-white/80"><td className="py-0.5">{p.year}</td><td className="text-right">{pct(p.credited)}</td><td className="text-right">{pct(p.cpi, 1)}</td><td className="text-right">{pct(p.m2, 1)}</td></tr>)}</tbody>
            </table></div>
            <p className="mt-2 text-[11px] text-white/45">CPI as of {h.asOf.cpi ?? "—"}; M2 as of {h.asOf.m2 ?? "—"}. Read from FRED.</p>
          </div>
        )}

        {/* 4. Liquidity */}
        {h && (
          <div className={`${CARD} p-6`}>
            <p className={H}><Droplets size={12} className="mr-1 inline" /> 4. Reaching the money</p>
            <div className="mt-3 overflow-x-auto"><table className="w-full text-xs">
              <thead><tr className="text-white/50"><th className="py-1 text-left">Vehicle</th><th className="text-left">How you reach it</th><th className="text-left">Tax on reaching it</th><th className="text-left">Authority</th></tr></thead>
              <tbody>{h.liquidity.map((r) => <tr key={r.vehicle} className="border-t border-white/5 align-top text-white/80"><td className="py-1 pr-2 font-semibold text-white">{r.vehicle}</td><td className="py-1 pr-2">{r.howYouReachIt}</td><td className="py-1 pr-2">{r.taxOnReaching}</td><td className="py-1">{r.authority ? <a className="underline text-white/50" href={r.authority.url} target="_blank" rel="noreferrer">{r.authority.label}</a> : <span className="text-white/40">institution's terms</span>}</td></tr>)}</tbody>
            </table></div>
          </div>
        )}

        {/* 5. Crediting on the account value */}
        {h && (
          <div className={`${CARD} p-6`}>
            <p className={H}><Banknote size={12} className="mr-1 inline" /> 5. {h.crediting.title}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/75">{h.crediting.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
            <p className="mt-2 text-[11px] text-white/45">{h.crediting.caveat} <a className="underline" href={h.crediting.source.url} target="_blank" rel="noreferrer">{h.crediting.source.label}</a></p>
          </div>
        )}

        <div className={`${CARD} p-6`}>
          <p className={H}><BookOpen size={12} className="mr-1 inline" /> Where the numbers come from</p>
          <ul className="mt-3 space-y-1 text-xs text-white/70">{(h?.sources ?? []).map((s) => <li key={s.url}>{s.url.startsWith("/") ? <Link href={s.url} className="underline">{s.label}</Link> : <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a>}</li>)}</ul>
        </div>
      </div>
    </AppShell>
  );
}
