// ============================================================
// THRESHOLDS — /portal/thresholds.
//
// Every gate a mechanism has to clear: the standard number, every documented
// way it is lower, and the ones that are somebody else's contract. A reader
// should leave knowing which thresholds to shop and which to stop arguing
// with. Each figure links the page it was read from.
// ============================================================
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Lock, Unlock, ExternalLink, Info } from "lucide-react";
import { THRESHOLDS, movable, immovable, bestVariant, THRESHOLDS_DISCLOSURE, type Threshold } from "@shared/thresholds";
import { MECHANISMS } from "@shared/cycleEngine";

const CARD = "rounded-2xl border border-white/10 bg-white/[0.04]";
const LABEL = "text-[10px] uppercase tracking-[0.18em] text-slate-400";
const unit = (t: Threshold, v: number) => (t.unit === "percent" ? `${v}%` : t.unit === "ratio" ? v.toFixed(2) : t.unit === "count" && v >= 999 ? "no cap" : `${v} ${t.unit}`);

function Card({ t }: { t: Threshold }) {
  const m = MECHANISMS.find((x) => x.id === t.mechanism)!;
  const best = bestVariant(t);
  return (
    <article className={`${CARD} p-5 space-y-3`} id={t.id}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/portal/mechanism/${t.mechanism}`} className="text-[11px] uppercase tracking-[0.2em] text-amber-300/80 hover:underline">{m.shortName}</Link>
          <h3 className="font-bold text-white">{t.name}</h3>
        </div>
        <div className="text-right">
          <div className={LABEL}>Standard</div>
          <div className="text-xl font-black tabular-nums text-white">{unit(t, t.standard)}</div>
          {best.via !== "standard" && <div className="text-xs text-emerald-300 tabular-nums">→ {unit(t, best.value)} via {best.via}</div>}
        </div>
      </header>
      <p className="text-sm text-slate-300">{t.why}</p>
      {t.fixed && (
        <div className="rounded-lg border border-rose-400/25 bg-rose-500/[0.06] p-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-rose-200"><Lock className="h-3.5 w-3.5" /> Not ours to move</div>
          <p className="mt-1 text-slate-300">{t.fixed.reason}</p>
          <p className="mt-1 text-xs text-slate-400">{t.fixed.authority} · <a href={t.fixed.source} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline inline-flex items-center gap-1">source <ExternalLink className="h-3 w-3" /></a></p>
        </div>
      )}
      {t.variants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><Unlock className="h-3.5 w-3.5" /> {t.variants.length} documented way{t.variants.length === 1 ? "" : "s"} it moves</div>
          {t.variants.map((v) => (
            <div key={v.name} className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-white">{v.name}</span>
                <span className="tabular-nums text-emerald-300">{unit(t, v.value)} <span className="text-slate-500">· evidence {v.evidence}/10</span></span>
              </div>
              <p className="text-xs text-slate-400">{v.providedBy}</p>
              <ul className="text-slate-300 text-xs space-y-0.5">{v.conditions.map((c, i) => <li key={i}>· {c}</li>)}</ul>
              <p className="text-amber-200/90 text-xs"><span className={LABEL}>Trade-off</span> {v.tradeoff}</p>
              <a href={v.source} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-300 hover:underline inline-flex items-center gap-1">source <ExternalLink className="h-3 w-3" /></a>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-500">Standard figure: <a href={t.standardSource} target="_blank" rel="noopener noreferrer" className="hover:underline">{t.standardSource.replace(/^https?:\/\//, "").slice(0, 60)}</a></p>
    </article>
  );
}

export default function Thresholds() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">The thresholds, and which ones move</h1>
          <p className="text-slate-300 max-w-3xl leading-relaxed">
            {THRESHOLDS.length} gates. {movable().length} have a documented way down — an exception in a selling guide, a lender programme, a contract term with a longer option. {immovable().length} are a statute or a counterparty's contract, and the honest thing is to say so where they sit rather than promise a way around. Every figure links the page it was read from.
          </p>
          <p className="text-sm text-slate-400 max-w-3xl">The planner at <Link href="/portal/sequence-planner" className="text-amber-300 hover:underline">/portal/sequence-planner</Link> uses these: a variant such as delayed financing changes a stage's seasoning and its release cap, and the projection moves with it.</p>
        </header>
        <div className="space-y-4">{THRESHOLDS.map((t) => <Card key={t.id} t={t} />)}</div>
        <p className={`${CARD} p-4 flex gap-2 text-xs text-slate-400`}><Info className="h-4 w-4 shrink-0 mt-0.5" /><span>{THRESHOLDS_DISCLOSURE}</span></p>
      </div>
    </AppShell>
  );
}
