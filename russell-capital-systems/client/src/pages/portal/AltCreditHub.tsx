// ============================================================
// ALTERNATIVE LINES OF CREDIT FOR RENTAL PROPERTIES — the tab.
// Registry in shared/altCredit/. Every route and strategy generates its own
// page at /portal/alt-credit/:slug. The simulator lives here on the base page.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ShieldAlert, TrendingUp, TrendingDown, Repeat } from "lucide-react";
import { CREDIT_ROUTES, ROUTE_COUNT } from "@shared/altCredit/routes";
import { DEPLOYMENT_STRATEGIES, ranked } from "@shared/altCredit/deployment";
import { ALT_CREDIT_DISCLOSURE, FAMILY_ORDER, FAMILY_LABEL } from "@shared/altCredit/types";
import { simulateCycles, breakEvenReturnPerCycle, utilisation, DEFAULT_CYCLE, type CycleInput } from "@shared/altCredit/simulator";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const INPUT = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white tabular-nums";
const LABEL = "block text-[11px] uppercase tracking-[0.16em] text-slate-400";
const usd = (n: number) => (Number.isFinite(n) ? `$${Math.round(n).toLocaleString("en-US")}` : "—");
const pc = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;

function Score({ n }: { n: number }) {
  const tone = n >= 7 ? "bg-emerald-400" : n >= 5 ? "bg-amber-400" : "bg-rose-400";
  return (
    <span className="inline-flex items-center gap-1.5" title={`${n} out of 10`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <span className={`block h-full ${tone}`} style={{ width: `${n * 10}%` }} />
      </span>
      <span className="text-[11px] tabular-nums text-slate-400">{n}/10</span>
    </span>
  );
}

export default function AltCreditHub() {
  const [cfg, setCfg] = useState<CycleInput>(DEFAULT_CYCLE);
  const sim = useMemo(() => simulateCycles(cfg), [cfg]);
  const breakEven = useMemo(() => breakEvenReturnPerCycle(cfg), [cfg]);
  const util = useMemo(() => utilisation(cfg), [cfg]);
  const set = <K extends keyof CycleInput>(k: K, v: CycleInput[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const num = (s: string) => { const n = Number(s.replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Capital</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            Alternative Lines of Credit for Rental Properties
          </h1>
          <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-slate-300">
            {ROUTE_COUNT} ways to reach capital that do not run through a retail bank equity line, and{" "}
            {DEPLOYMENT_STRATEGIES.length} ways to put that capital back out — each with its own page, its own
            underwriting mechanics, worked examples at real figures, and what it costs you stated before what it
            gets you.
          </p>
        </header>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/[0.07] p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
          <p className="text-[13px] leading-relaxed text-slate-200">{ALT_CREDIT_DISCLOSURE}</p>
        </div>

        {/* ---------- borrowing routes ---------- */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
            <TrendingDown className="h-4 w-4" aria-hidden /> Getting capital in
          </h2>
          {FAMILY_ORDER.map((f) => {
            const items = CREDIT_ROUTES.filter((r) => r.family === f);
            if (!items.length) return null;
            return (
              <div key={f} className="mt-6">
                <h3 className="border-b border-white/10 pb-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  {FAMILY_LABEL[f]}
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {items.map((r) => (
                    <Link key={r.slug} to={`/portal/alt-credit/${r.slug}`}
                          className={`${CARD} group p-5 transition-colors hover:border-emerald-400/40`}>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-[16px] font-semibold text-white" style={{ textWrap: "balance" }}>{r.title}</h4>
                        <span className="shrink-0 text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
                          {r.depth === "full" ? "full" : "outline"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300">{r.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Score n={r.scoreForRentalOwner} />
                        <span className="text-[11px] text-emerald-300/0 transition-colors group-hover:text-emerald-300/90">Open →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* ---------- deployment, ranked ---------- */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-300">
            <TrendingUp className="h-4 w-4" aria-hidden /> Putting capital out, ranked
          </h2>
          <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-slate-400">
            Ranked most viable to least on risk-adjusted terms, not on headline yield. A high return with a high
            chance of total loss ranks badly here, which is the point of ranking at all.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {ranked().map((sgy) => (
              <Link key={sgy.slug} to={`/portal/alt-credit/${sgy.slug}`}
                    className={`${CARD} group p-5 transition-colors hover:border-emerald-400/40`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h4 className="text-[16px] font-semibold text-white" style={{ textWrap: "balance" }}>{sgy.title}</h4>
                  <Score n={sgy.riskRewardScore} />
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300">{sgy.description}</p>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-2">
                  <div><dt className="inline text-slate-500">Target: </dt><dd className="inline text-slate-300">{sgy.targetReturn}</dd></div>
                  <div><dt className="inline text-slate-500">One turn: </dt><dd className="inline text-slate-300">{sgy.termMonths.min}–{sgy.termMonths.max} months</dd></div>
                </dl>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------- the simulator ---------- */}
        <section className={`${CARD} mt-12 p-6`}>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-amber-200">
            <Repeat className="h-4 w-4" aria-hidden /> The cycle simulator
          </h2>
          <p className="mt-2 max-w-[64ch] text-[13.5px] leading-relaxed text-slate-300">
            Draw on a line, deploy it, get repaid, deploy it again. Ten thousand runs. The line accrues interest
            every day of the year while a six-month deployment only earns for six of them — that mismatch is
            modelled here as idle time, and it is what most back-of-envelope versions of this plan leave out.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {([
              ["sim-p", "Amount drawn", String(cfg.principal), (v: string) => set("principal", num(v))],
              ["sim-b", "Borrow rate %", String((cfg.borrowAnnualRate * 100).toFixed(2)), (v: string) => set("borrowAnnualRate", num(v) / 100)],
              ["sim-y", "Years", String(cfg.years), (v: string) => set("years", Math.max(1, num(v)))],
              ["sim-r", "Return per cycle %", String((cfg.returnPerCycle * 100).toFixed(1)), (v: string) => set("returnPerCycle", num(v) / 100)],
              ["sim-sd", "Return std dev %", String((cfg.returnStdDev * 100).toFixed(1)), (v: string) => set("returnStdDev", num(v) / 100)],
              ["sim-cm", "Cycle months", String(cfg.cycleMonths), (v: string) => set("cycleMonths", Math.max(1, num(v)))],
              ["sim-id", "Idle days between", String(cfg.idleDays), (v: string) => set("idleDays", Math.max(0, num(v)))],
              ["sim-d", "Default rate %", String((cfg.defaultProbability * 100).toFixed(1)), (v: string) => set("defaultProbability", num(v) / 100)],
              ["sim-rec", "Recovery on default %", String((cfg.recoveryRate * 100).toFixed(0)), (v: string) => set("recoveryRate", num(v) / 100)],
              ["sim-f", "Fee per cycle %", String((cfg.feePerCycle * 100).toFixed(1)), (v: string) => set("feePerCycle", num(v) / 100)],
              ["sim-t", "Tax on profit %", String((cfg.taxRate * 100).toFixed(0)), (v: string) => set("taxRate", num(v) / 100)],
              ["sim-pos", "Positions per cycle", String(cfg.positionsPerCycle), (v: string) => set("positionsPerCycle", Math.max(1, num(v)))],
            ] as const).map(([id, label, val, on]) => (
              <div key={id}>
                <label className={LABEL} htmlFor={id}>{label}</label>
                <input id={id} className={`${INPUT} mt-1`} inputMode="decimal" value={val}
                       onChange={(e) => (on as (s: string) => void)(e.target.value)} />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-white/10 p-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] tabular-nums text-slate-300">
                <dt>Cycles completed</dt><dd className="text-right text-white">{sim.cyclesPerRun}</dd>
                <dt>Capital actually deployed</dt><dd className="text-right text-white">{pc(util)} of the time</dd>
                <dt>Break-even return per cycle</dt><dd className="text-right text-white">{pc(breakEven, 2)}</dd>
                <dt>Total cost of the line</dt><dd className="text-right text-rose-300">{usd(sim.totalBorrowCost)}</dd>
                <dt className="border-t border-white/10 pt-1.5">Median outcome</dt>
                <dd className="border-t border-white/10 pt-1.5 text-right font-semibold text-emerald-300">{usd(sim.median)}</dd>
                <dt>Annualised, at the median</dt><dd className="text-right text-white">{pc(sim.medianAnnualised)}</dd>
              </dl>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Distribution across 10,000 runs</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] tabular-nums text-slate-300">
                <dt>Worst run</dt><dd className="text-right text-rose-300">{usd(sim.worst)}</dd>
                <dt>5th percentile</dt><dd className="text-right text-white">{usd(sim.p5)}</dd>
                <dt>25th percentile</dt><dd className="text-right text-white">{usd(sim.p25)}</dd>
                <dt>75th percentile</dt><dd className="text-right text-white">{usd(sim.p75)}</dd>
                <dt>95th percentile</dt><dd className="text-right text-white">{usd(sim.p95)}</dd>
                <dt className="border-t border-white/10 pt-1.5">Chance of losing money</dt>
                <dd className="border-t border-white/10 pt-1.5 text-right font-semibold text-amber-300">{pc(sim.probabilityOfLoss)}</dd>
                <dt>Chance the line is not repaid</dt><dd className="text-right font-semibold text-rose-300">{pc(sim.probabilityOfRuin)}</dd>
              </dl>
            </div>
          </div>

          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4 text-[13.5px] leading-relaxed text-amber-100">
            {sim.verdict}
          </p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
            Try setting positions per cycle to 1 and then to 25. The median barely moves; the chance of not repaying
            the line collapses. Diversification does not raise the return — it removes the outcome you cannot come
            back from, which is a different and more valuable thing. Every figure here depends entirely on the default
            rate and the return you enter, and those are the two numbers an operator should be able to evidence across
            a downturn rather than a good year.
          </p>
        </section>

        <p className="mt-10 border-t border-white/10 pt-5 text-[13px] leading-relaxed text-slate-500">
          Start at <Link href="/portal/mortgage-ledger" className="text-amber-300 hover:underline">the Mortgage Ledger</Link> to
          see how much equity there actually is and what the existing loan costs — that number decides which of these
          routes is worth considering. Then{" "}
          <Link href="/portal/mortgage-killer" className="text-amber-300 hover:underline">Mortgage Killer</Link>,{" "}
          <Link href="/portal/house-recycling" className="text-amber-300 hover:underline">House Recycling</Link> and{" "}
          <Link href="/portal/real-estate-mogul" className="text-amber-300 hover:underline">Real Estate Mogul</Link> for
          what to do with it.
        </p>
      </div>
    </AppShell>
  );
}
