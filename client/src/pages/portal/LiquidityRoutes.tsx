// ============================================================
// LIQUIDITY WITHOUT THE BANK.
// Registry in shared/liquidityRoutes.ts. Every route leads with what it costs
// you, not what it gets you — the weaknesses render above the strengths by
// design, because that ordering is the difference between this page and a
// lead-generation page.
// ============================================================
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ShieldAlert, ExternalLink, Filter } from "lucide-react";
import {
  LIQUIDITY_ROUTES, LIQUIDITY_ROUTE_COUNT, FAMILY_ORDER, FAMILY_LABELS,
  LIQUIDITY_DISCLOSURE, noMonthlyPayment, preservesFirstMortgage,
  type LiquidityRoute, type RouteFamily,
} from "@shared/liquidityRoutes";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
type Lens = "all" | "no-payment" | "keeps-first";

function Route({ r }: { r: LiquidityRoute }) {
  return (
    <article className={`${CARD} p-6`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] tabular-nums text-amber-300/60">{String(r.n).padStart(2, "0")}</span>
        <h3 className="text-xl font-semibold tracking-tight text-white" style={{ textWrap: "balance" }}>{r.name}</h3>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em] text-slate-400">
          against {r.collateral}
        </span>
      </div>

      <p className="mt-3 text-[14.5px] leading-relaxed text-slate-200">{r.mechanism}</p>

      <h4 className="mt-5 text-[11px] uppercase tracking-[0.18em] text-slate-400">How it works</h4>
      <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-300">
        {r.howItWorks.map((s, i) => <li key={i}>{s}</li>)}
      </ol>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* Weaknesses first. Deliberate. */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-rose-300/80">What it costs you</h4>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-300">
            {r.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">What it gets you</h4>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-300">
            {r.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-[13.5px] leading-relaxed sm:grid-cols-2">
        <div><dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Right for</dt>
             <dd className="mt-0.5 text-slate-300">{r.bestFor}</dd></div>
        <div><dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Wrong for</dt>
             <dd className="mt-0.5 text-slate-300">{r.wrongFor}</dd></div>
        {r.typicalCost && (<div><dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Typical cost</dt>
             <dd className="mt-0.5 text-slate-300">{r.typicalCost}</dd></div>)}
        {r.typicalSpeed && (<div><dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Speed</dt>
             <dd className="mt-0.5 text-slate-300">{r.typicalSpeed}</dd></div>)}
      </dl>

      <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-3.5 text-[13.5px] leading-relaxed text-amber-100">
        <strong className="font-semibold">Ask this before you sign: </strong>{r.diligence}
      </p>

      {r.providers.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Who does this</h4>
          <ul className="mt-2 flex flex-col gap-2.5">
            {r.providers.map((p) => (
              <li key={p.name} className="rounded-lg border border-white/10 p-3">
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-[14px] font-medium text-amber-200 hover:underline">
                  {p.name} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
                {p.identifier && <span className="ml-2 text-[11.5px] text-slate-500">{p.identifier}</span>}
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{p.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
          This is a category rather than a branded product — there are thousands of providers and naming one
          would misrepresent the market. Your attorney or CPA is the right starting point.
        </p>
      )}

      <p className="mt-4 text-[11.5px] text-slate-600">Terms read {r.asOf}. Re-check directly before acting.</p>
    </article>
  );
}

export default function LiquidityRoutesPage() {
  const [lens, setLens] = useState<Lens>("all");
  const [family, setFamily] = useState<RouteFamily | "all">("all");

  const visible = useMemo(() => {
    let set: readonly LiquidityRoute[] =
      lens === "no-payment" ? noMonthlyPayment()
      : lens === "keeps-first" ? preservesFirstMortgage()
      : LIQUIDITY_ROUTES;
    if (family !== "all") set = set.filter((r) => r.family === family);
    return set;
  }, [lens, family]);

  const grouped = useMemo(
    () => FAMILY_ORDER.map((f) => ({ f, items: visible.filter((r) => r.family === f) })).filter((g) => g.items.length > 0),
    [visible],
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Capital</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            Liquidity Without the Bank
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-slate-300">
            {LIQUIDITY_ROUTE_COUNT} legal routes to cash against property and other assets that do not run
            through a retail bank equity line. Every one of them states what it costs you before it states what
            it gets you, because two of them end your ownership and several are expensive in ways that are not
            expressed as a rate.
          </p>
        </header>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/[0.07] p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
          <p className="text-[13px] leading-relaxed text-slate-200">{LIQUIDITY_DISCLOSURE}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              <Filter className="h-3.5 w-3.5" aria-hidden /> Show me
            </span>
            {([["all", "Everything"], ["no-payment", "No monthly payment"], ["keeps-first", "Keeps my cheap first mortgage"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setLens(k)}
                      className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${lens === k ? "border-amber-400/60 bg-amber-400/15 text-amber-200" : "border-white/15 text-slate-300 hover:border-white/30"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFamily("all")}
                    className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${family === "all" ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200" : "border-white/15 text-slate-300 hover:border-white/30"}`}>
              All kinds
            </button>
            {FAMILY_ORDER.map((f) => (
              <button key={f} type="button" onClick={() => setFamily(f)}
                      className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${family === f ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200" : "border-white/15 text-slate-300 hover:border-white/30"}`}>
                {FAMILY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {grouped.length === 0 ? (
          <p className="mt-12 text-center text-[15px] text-slate-400">Nothing matches both filters. Widen one.</p>
        ) : (
          grouped.map(({ f, items }) => (
            <section key={f} className="mt-10">
              <h2 className="border-b border-white/10 pb-2 text-lg font-semibold text-emerald-300">{FAMILY_LABELS[f]}</h2>
              <div className="mt-4 flex flex-col gap-5">
                {items.map((r) => <Route key={r.id} r={r} />)}
              </div>
            </section>
          ))
        )}

        <p className="mt-12 border-t border-white/10 pt-5 text-[13px] leading-relaxed text-slate-500">
          Start at <a href="/portal/mortgage-ledger" className="text-amber-300 hover:underline">the Mortgage Ledger</a> to
          see how much equity there actually is and what the existing loan is costing — that number decides which of
          these routes is worth considering at all.
        </p>
      </div>
    </AppShell>
  );
}
