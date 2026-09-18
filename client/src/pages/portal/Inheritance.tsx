// ============================================================
// THE INHERITANCE ENGINE — what you expect to receive, item by item: how the
// Code taxes each kind on arrival, when it is expected, what it will buy
// then, and what the tax on it is likely to be by then. Then, only if you
// ask, the gentle questions about what could change it.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Landmark, BookOpen, Calculator, HeartHandshake, Handshake, Plus, Trash2, Save } from "lucide-react";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white w-full";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10";
const PRIMARY = "rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300";
const H = "text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80";
const usd = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const pct = (n: number | null | undefined, d = 0) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);

type Item = { id: string; label: string; assetClass: string; amount: number; expectedYear: number; from: string; likelihood: number; taxableSharePct?: number | null; notes?: string };
const FROM = ["Parent", "Grandparent", "Spouse's parent", "Other relative", "Other"];

export default function Inheritance() {
  const context = trpc.inheritance.context.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const save = trpc.inheritance.saveItems.useMutation();
  const c = context.data;
  const [items, setItems] = useState<Item[]>([]);
  const [marginal, setMarginal] = useState<number>(0.35);
  const [stateRate, setStateRate] = useState<number>(0);
  const [estate, setEstate] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState(false);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!c || seeded) return;
    setItems(c.items.length ? c.items : c.fallbackExpected ? [{ id: "1", label: "Expected inheritance (from the Fact Finder)", assetClass: "cash", amount: c.fallbackExpected, expectedYear: c.thisYear + 10, from: "Parent", likelihood: 3 }] : []);
    if (c.marginalRate != null) setMarginal(c.marginalRate);
    setEstate(c.benefactorEstate);
    setSeeded(true);
  }, [c, seeded]);
  const report = trpc.inheritance.report.useQuery({ items, marginalRate: marginal, stateRate, benefactorEstate: estate }, { enabled: items.length > 0, refetchOnWindowFocus: false, retry: false, placeholderData: (p) => p });
  const r = report.data;
  const cls = (id: string) => c?.classes.find((k) => k.id === id) ?? null;
  const set = (id: string, patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const add = () => setItems((xs) => [...xs, { id: String(Date.now()), label: "", assetClass: "brokerage", amount: 0, expectedYear: (c?.thisYear ?? new Date().getFullYear()) + 10, from: "Parent", likelihood: 3 }]);
  const remove = (id: string) => setItems((xs) => xs.filter((x) => x.id !== id));
  const thisYear = c?.thisYear ?? new Date().getFullYear();
  const trajLine = useMemo(() => (c?.trajectory ?? []).map((p) => `${p.horizonYears}y: ${pct(p.pHigher)} higher, ×${p.burdenMultiplier.toFixed(2)}`).join(" · "), [c]);

  return (
    <AppShell title="The Inheritance Engine">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className={H}><Landmark size={12} className="mr-1 inline" /> Estate and legacy</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">What you expect to receive, what arrives after tax, and what it will buy by then</h1>
          <p className="mt-2 text-sm text-white/70">Each item is taxed the way the Code taxes that kind of asset on arrival, with the section linked. The year it arrives sets two things: what a dollar buys then, from the <Link href="/portal/inflation" className="text-amber-300 underline">CPI ladder</Link>, and how likely the tax on it is to be higher, from the <Link href="/portal/erosion" className="text-amber-300 underline">erosion trajectory</Link>. Nothing here is a promise that anything will be received; it is arithmetic on what you enter.</p>
        </div>

        {/* 1. The items */}
        <div className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={H}><Calculator size={12} className="mr-1 inline" /> 1. Item by item</p>
            <div className="flex gap-2">
              <button className={BTN} onClick={add}><Plus size={12} className="mr-1 inline" />Add an item</button>
              <button className={PRIMARY} disabled={save.isPending || !items.length} onClick={() => save.mutate({ items, benefactorEstate: estate })}><Save size={12} className="mr-1 inline" />{save.isPending ? "Saving…" : save.isSuccess ? "Saved to your Fact Finder" : "Save to my Fact Finder"}</button>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4 text-[11px] text-white/70">
            <label className="block">Your marginal federal rate %<input type="number" className={`${INPUT} mt-0.5`} value={Math.round(marginal * 100)} onChange={(e) => setMarginal(Number(e.target.value) / 100)} /></label>
            <label className="block">State income tax rate %<input type="number" step={0.1} className={`${INPUT} mt-0.5`} value={Math.round(stateRate * 1000) / 10} onChange={(e) => setStateRate(Number(e.target.value) / 100)} /></label>
            <label className="block">The whole estate you expect from (if known)<input type="number" step={10000} className={`${INPUT} mt-0.5`} value={estate ?? ""} onChange={(e) => setEstate(e.target.value === "" ? null : Number(e.target.value))} /></label>
            <div className="text-white/50">{c?.marginalRate != null ? "Marginal rate read from your Fact Finder's tax section." : "Type your marginal bracket, or fill the Fact Finder's tax section and it fills here."}</div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="text-white/50"><th className="py-1 text-left">What it is</th><th className="text-left">Kind of asset</th><th className="text-right">Amount today</th><th className="text-right">Year</th><th className="text-left">From</th><th className="text-right">How sure (1–5)</th><th className="text-right">Gain / income share %</th><th></th></tr></thead>
              <tbody>{items.map((it) => {
                const k = cls(it.assetClass);
                const needsShare = k?.taxability === "gain_ordinary" || k?.taxability === "trust";
                return (
                  <tr key={it.id} className="border-t border-white/5 align-top">
                    <td className="py-1 pr-1"><input className={INPUT} value={it.label} onChange={(e) => set(it.id, { label: e.target.value })} placeholder="Dad's IRA" /></td>
                    <td className="py-1 pr-1"><select className={INPUT} value={it.assetClass} onChange={(e) => set(it.id, { assetClass: e.target.value })}>{(c?.classes ?? []).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>{k && <div className="mt-0.5 max-w-xs text-[10px] text-white/45">{k.summary} <a className="underline" href={k.authority.url} target="_blank" rel="noreferrer">{k.authority.label.split(":")[0]}</a></div>}</td>
                    <td className="py-1 pr-1"><input type="number" step={1000} className={`${INPUT} text-right`} value={it.amount} onChange={(e) => set(it.id, { amount: Number(e.target.value) })} /></td>
                    <td className="py-1 pr-1"><input type="number" className={`${INPUT} !w-20 text-right`} value={it.expectedYear} onChange={(e) => set(it.id, { expectedYear: Number(e.target.value) })} /></td>
                    <td className="py-1 pr-1"><select className={INPUT} value={it.from} onChange={(e) => set(it.id, { from: e.target.value })}>{FROM.map((f) => <option key={f}>{f}</option>)}</select></td>
                    <td className="py-1 pr-1"><input type="number" min={1} max={5} className={`${INPUT} !w-16 text-right`} value={it.likelihood} onChange={(e) => set(it.id, { likelihood: Number(e.target.value) })} /></td>
                    <td className="py-1 pr-1">{needsShare ? <input type="number" className={`${INPUT} !w-20 text-right`} value={it.taxableSharePct ?? ""} onChange={(e) => set(it.id, { taxableSharePct: e.target.value === "" ? null : Number(e.target.value) })} placeholder="from the statement" /> : <span className="text-white/30">n/a</span>}</td>
                    <td className="py-1"><button className={BTN} onClick={() => remove(it.id)} title="Remove"><Trash2 size={12} /></button></td>
                  </tr>
                );
              })}</tbody>
            </table>
            {!items.length && <div className="mt-2 text-xs text-white/50">{context.isFetching ? "reading your Fact Finder…" : "Nothing entered yet. Add an item, or fill the Estate section of your Fact Finder."}</div>}
          </div>
        </div>

        {/* 2. The report */}
        {r && (
          <div className={`${CARD} p-6`}>
            <p className={H}><Calculator size={12} className="mr-1 inline" /> 2. What arrives, and what it buys</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
              <Stat label="Expected, nominal" value={usd(r.totals.nominal)} />
              <Stat label="Tax at today's rates" value={usd(r.totals.taxNow)} />
              <Stat label="Tax in the year received" value={usd(r.totals.taxThen)} sub="today's rate × the trajectory's multiplier" />
              <Stat label="After tax, then" value={usd(r.totals.afterTaxThen)} />
              <Stat label="In today's dollars" value={usd(r.totals.realAfterTax)} sub="CPI ladder" />
              <Stat label="Weighted by how sure" value={usd(r.totals.weighted)} sub="today's dollars × (sureness − 1) ÷ 4" />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="text-white/50"><th className="py-1 text-left">Item</th><th className="text-left">How it arrives</th><th className="text-right">Years out</th><th className="text-right">Taxable share</th><th className="text-right">Tax today</th><th className="text-right">Odds rate higher then</th><th className="text-right">Multiplier</th><th className="text-right">Tax then</th><th className="text-right">After tax</th><th className="text-right">CPI/yr</th><th className="text-right">Today's dollars</th><th className="text-left">Notes</th></tr></thead>
                <tbody>{r.items.map((x) => (
                  <tr key={x.item.id} className="border-t border-white/5 align-top text-white/80">
                    <td className="py-1 pr-2 font-semibold text-white">{x.item.label || "—"}<div className="font-normal text-white/40">{x.item.from}, {x.item.expectedYear}</div></td>
                    <td className="py-1 pr-2 max-w-xs text-white/60">{x.cls ? <>{x.cls.label}: {x.cls.summary} <a className="underline text-white/40" href={x.cls.authority.url} target="_blank" rel="noreferrer">{x.cls.authority.label.split(":")[0]}</a></> : "—"}</td>
                    <td className="py-1 text-right">{x.yearsOut}</td>
                    <td className="py-1 text-right">{pct(x.taxableShare)}</td>
                    <td className="py-1 text-right">{usd(x.taxNow)}</td>
                    <td className="py-1 text-right">{pct(x.pHigher)}</td>
                    <td className="py-1 text-right">×{x.burden.toFixed(2)}</td>
                    <td className="py-1 text-right">{usd(x.taxThen)}</td>
                    <td className="py-1 text-right font-semibold text-white">{usd(x.afterTaxThen)}</td>
                    <td className="py-1 text-right">{pct(x.cpiRate, 2)}</td>
                    <td className="py-1 text-right">{usd(x.realAfterTax)}</td>
                    <td className="py-1 text-white/50">{x.flags.join("; ")}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {r.estateCheck && (
              <div className={`mt-3 rounded-xl border p-3 text-xs ${r.estateCheck.over ? "border-amber-300/40 bg-amber-400/10 text-amber-100" : "border-white/10 bg-black/20 text-white/70"}`}>
                The estate you expect from ({usd(r.estateCheck.estate)}) is {r.estateCheck.over ? "above" : "within"} the federal filing threshold of {usd(r.estateCheck.exclusion)} for {r.estateCheck.exclusionYear}{r.estateCheck.extrapolated ? " (indexed after that year; the latest published figure is used)" : ""}. {r.estateCheck.over ? "An estate above the threshold files Form 706 and may owe federal estate tax before anything reaches you; the benefactor's attorney is the person to ask." : "No federal estate tax is expected at that size; a state estate or inheritance tax is the state's own rule."} <a className="underline" href={c?.exclusionSource.url} target="_blank" rel="noreferrer">{c?.exclusionSource.label}</a>
              </div>
            )}
            <ul className="mt-3 space-y-1 text-[11px] text-white/50">{r.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            {trajLine && <div className="mt-1 text-[10px] text-white/40">Trajectory used: {trajLine}.</div>}
          </div>
        )}

        {/* 3. The gentle follow-up */}
        {c && (
          <div className={`${CARD} p-6`}>
            <p className={H}><HeartHandshake size={12} className="mr-1 inline" /> 3. Only if you want it</p>
            {!followUp ? (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70"><span>{c.followUp.invitation}</span><button className={BTN} onClick={() => setFollowUp(true)}>Yes, show me</button></div>
            ) : (
              <div className="mt-2 grid gap-4 md:grid-cols-3 text-xs text-white/75">
                <div>
                  <div className="font-semibold text-white">Three questions</div>
                  <ol className="mt-1 list-decimal space-y-2 pl-5">{c.followUp.questions.map((q, i) => <li key={i}>{q}</li>)}</ol>
                </div>
                <div>
                  <div className="font-semibold text-white">To test the waters</div>
                  <ul className="mt-1 space-y-2">{c.followUp.testTheWaters.map((m, i) => <li key={i}><span className="font-semibold">{m.title}.</span> {m.text}</li>)}</ul>
                </div>
                <div>
                  <div className="font-semibold text-white">To make it yours, irreversibly</div>
                  <ul className="mt-1 space-y-2">{c.followUp.reclaim.map((m, i) => <li key={i}><span className="font-semibold">{m.title}.</span> {m.text} <a className="text-white/40 underline" href={m.authority.url} target="_blank" rel="noreferrer">{m.authority.label}</a></li>)}</ul>
                </div>
                <div className="md:col-span-3 text-[11px] text-white/45">{c.followUp.tone}</div>
              </div>
            )}
          </div>
        )}

        {/* 4. Partner pre-planning */}
        {c && (
          <div className={`${CARD} p-6`}>
            <p className={H}><Handshake size={12} className="mr-1 inline" /> 4. {c.partner.heading}</p>
            <p className="mt-2 text-sm text-white/70">{c.partner.intro}</p>
            <div className="mt-2 flex flex-wrap gap-2">{c.partner.partners.map((p) => <a key={p.url} className={BTN} href={p.url} target="_blank" rel="noreferrer">{p.name} · {p.contact}</a>)}</div>
            {c.partner.quote && <blockquote className="mt-3 border-l-2 border-amber-300/50 pl-3 text-sm italic text-white/80">“{c.partner.quote.text}” <span className="not-italic text-white/50">— {c.partner.quote.attributedTo}</span></blockquote>}
            <p className="mt-2 text-[11px] text-white/45">{c.partner.disclaimer}</p>
          </div>
        )}

        {/* 5. Sources */}
        <div className={`${CARD} p-6`}>
          <p className={H}><BookOpen size={12} className="mr-1 inline" /> 5. Where the rules come from</p>
          <ul className="mt-3 space-y-1 text-xs text-white/70">{(c?.sources ?? []).map((s) => <li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
          <p className="mt-2 text-[11px] text-white/45">State inheritance and estate taxes, property-tax reassessment on transfer, and elective-share rules are each state's own; the page names the federal rule and leaves the state's to the attorney. Years: this page runs on {thisYear}.</p>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[11px] text-white/50">{label}</div><div className="text-base font-semibold text-white">{value}</div>{sub && <div className="text-[10px] text-white/40">{sub}</div>}</div>;
}
