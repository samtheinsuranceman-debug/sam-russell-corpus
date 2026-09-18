// ============================================================
// SECTION 199A — the qualified business income deduction.
//
// The arithmetic lives in shared/qbiDeduction.ts, sourced to the statute and
// to Rev. Proc. 2025-32. This page's job is to show WHICH RULE IS BINDING,
// because the number on its own tells an owner nothing about what to change.
// ============================================================
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Scale, Landmark, TrendingDown, AlertTriangle, Building2 } from "lucide-react";
import {
  computeQbiDeduction, distanceToThreshold, thresholdsFor,
  type Business, type FilingStatus,
} from "@shared/qbiDeduction";
import { RETIREMENT_LIMITS_2026, LIMITS_SOURCE, staleNote } from "@shared/retirementLimits";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const INPUT = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white";
const LABEL = "block text-[11px] uppercase tracking-[0.18em] text-slate-400";
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = (s: string) => { const n = Number(s.replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };

const BINDING_TONE: Record<string, string> = {
  "below threshold — no limit": "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
  "wage limit": "text-amber-300 border-amber-400/40 bg-amber-400/10",
  "phase-in reduction": "text-amber-200 border-amber-300/40 bg-amber-300/10",
  "SSTB fully phased out": "text-rose-300 border-rose-400/40 bg-rose-400/10",
  "no QBI": "text-slate-300 border-white/20 bg-white/5",
};

export default function QbiOptimizer() {
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("mfj");
  const [taxableIncome, setTaxableIncome] = useState("520000");
  const [capitalGain, setCapitalGain] = useState("0");
  const [marginalRate, setMarginalRate] = useState(35);
  const [reitPtp, setReitPtp] = useState("0");
  const [businesses, setBusinesses] = useState<Business[]>([
    { name: "Medical practice", qbi: 450_000, w2Wages: 180_000, ubia: 0, isSSTB: true },
  ]);

  const input = useMemo(() => ({
    filingStatus,
    taxableIncomeBeforeQbi: num(taxableIncome),
    netCapitalGain: num(capitalGain),
    businesses,
    qualifiedReitAndPtpIncome: num(reitPtp),
    marginalRate: marginalRate / 100,
  }), [filingStatus, taxableIncome, capitalGain, businesses, reitPtp, marginalRate]);

  const result = useMemo(() => computeQbiDeduction(input), [input]);
  const distance = useMemo(() => distanceToThreshold(input), [input]);
  const band = thresholdsFor(filingStatus);
  const stale = staleNote();

  const setBiz = (i: number, patch: Partial<Business>) =>
    setBusinesses((prev) => prev.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  // Where the marker sits on the band rail, clamped so it stays on screen
  // either side of the band.
  const railPct = Math.min(112, Math.max(-12, ((num(taxableIncome) - band.threshold) / (band.phaseInTop - band.threshold)) * 100));

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Internal Revenue Code § 199A</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            The Qualified Business Income Deduction
          </h1>
          <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-slate-300">
            Twenty percent of what the business earns, until three rules take it away: the wage limit, the
            property limit, and — for a medical, dental, legal or financial practice — the specified-service
            phase-out. This page shows which of the three is actually binding on you, because the deduction
            alone does not tell you what to change.
          </p>
          {stale && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-[13px] text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{stale}
            </p>
          )}
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">

          {/* ---------- inputs ---------- */}
          <section className={`${CARD} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <Landmark className="h-4 w-4" aria-hidden /> Your figures
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="qbi-filing">Filing status</label>
                <select id="qbi-filing" className={`${INPUT} mt-1`} value={filingStatus}
                        onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}>
                  <option value="mfj">Married filing jointly</option>
                  <option value="single">Single</option>
                  <option value="hoh">Head of household</option>
                  <option value="mfs">Married filing separately</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="qbi-ti">Taxable income before this deduction</label>
                <input id="qbi-ti" className={`${INPUT} mt-1 tabular-nums`} inputMode="numeric"
                       value={taxableIncome} onChange={(e) => setTaxableIncome(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} htmlFor="qbi-cg">Net capital gain</label>
                <input id="qbi-cg" className={`${INPUT} mt-1 tabular-nums`} inputMode="numeric"
                       value={capitalGain} onChange={(e) => setCapitalGain(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} htmlFor="qbi-reit">REIT dividends &amp; PTP income</label>
                <input id="qbi-reit" className={`${INPUT} mt-1 tabular-nums`} inputMode="numeric"
                       value={reitPtp} onChange={(e) => setReitPtp(e.target.value)} />
              </div>
            </div>

            <div className="mt-4">
              <label className={LABEL} htmlFor="qbi-rate">
                Marginal federal rate — {marginalRate}%
              </label>
              <input id="qbi-rate" type="range" min={10} max={40} step={1} value={marginalRate}
                     onChange={(e) => setMarginalRate(Number(e.target.value))}
                     className="mt-2 w-full accent-amber-400" />
            </div>

            <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold text-amber-200">
              <Building2 className="h-4 w-4" aria-hidden /> Businesses
            </h3>
            {businesses.map((b, i) => (
              <div key={i} className="mt-3 rounded-xl border border-white/10 p-4">
                <input aria-label={`Business ${i + 1} name`} className={INPUT} value={b.name}
                       onChange={(e) => setBiz(i, { name: e.target.value })} />
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={LABEL} htmlFor={`qbi-${i}`}>QBI</label>
                    <input id={`qbi-${i}`} className={`${INPUT} mt-1 tabular-nums`} inputMode="numeric"
                           value={String(b.qbi)} onChange={(e) => setBiz(i, { qbi: num(e.target.value) })} />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor={`wages-${i}`}>W-2 wages</label>
                    <input id={`wages-${i}`} className={`${INPUT} mt-1 tabular-nums`} inputMode="numeric"
                           value={String(b.w2Wages)} onChange={(e) => setBiz(i, { w2Wages: num(e.target.value) })} />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor={`ubia-${i}`}>Property basis (UBIA)</label>
                    <input id={`ubia-${i}`} className={`${INPUT} mt-1 tabular-nums`} inputMode="numeric"
                           value={String(b.ubia)} onChange={(e) => setBiz(i, { ubia: num(e.target.value) })} />
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-[13px] text-slate-300">
                  <input type="checkbox" checked={b.isSSTB} className="accent-amber-400"
                         onChange={(e) => setBiz(i, { isSSTB: e.target.checked })} />
                  Specified service trade or business — health, law, accounting, consulting, financial services,
                  or any business whose principal asset is the skill of its owners
                </label>
                {businesses.length > 1 && (
                  <button type="button" className="mt-3 text-[12px] text-rose-300 hover:underline"
                          onClick={() => setBusinesses((p) => p.filter((_, j) => j !== i))}>
                    Remove this business
                  </button>
                )}
              </div>
            ))}
            <button type="button"
                    className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                    onClick={() => setBusinesses((p) => [...p, { name: `Business ${p.length + 1}`, qbi: 0, w2Wages: 0, ubia: 0, isSSTB: false }])}>
              Add another business
            </button>
          </section>

          {/* ---------- result ---------- */}
          <section className="flex flex-col gap-5">
            <div className={`${CARD} p-6`}>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Deduction for {result.taxYear}</p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-amber-200">{usd(result.deduction)}</p>
              <p className="mt-1 text-[13px] text-slate-400">
                Bound by the {result.boundBy}
                {result.estimatedTaxSaved != null && <> · about {usd(result.estimatedTaxSaved)} of federal tax at {marginalRate}%</>}
              </p>

              {/* the band rail */}
              <div className="mt-6">
                <div className="flex justify-between text-[10.5px] uppercase tracking-[0.16em] text-slate-500 tabular-nums">
                  <span>{usd(band.threshold)}</span><span>{usd(band.phaseInTop)}</span>
                </div>
                <div className="relative mt-1.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500/50 via-amber-400/50 to-rose-500/50">
                  <span className="absolute -top-1 h-4.5 w-1 -translate-x-1/2 rounded bg-white shadow"
                        style={{ left: `${railPct}%`, height: "1.125rem" }} aria-hidden />
                </div>
                <div className="mt-1.5 flex justify-between text-[10.5px] uppercase tracking-[0.16em] text-slate-500">
                  <span>Full 20%</span><span>Phasing</span><span>Limited</span>
                </div>
              </div>

              {distance.gainFromReaching > 0 && (
                <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                    <TrendingDown className="h-4 w-4" aria-hidden /> The finding
                  </p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-slate-200">
                    Taking {usd(distance.toThreshold)} of taxable income off the top would raise this
                    deduction from {usd(distance.deductionNow)} to {usd(distance.deductionAtThreshold)} —
                    a gain of <strong className="text-emerald-200">{usd(distance.gainFromReaching)}</strong>,
                    worth about {usd(distance.gainFromReaching * (marginalRate / 100))} in tax, on top of
                    whatever the reduction itself saves.
                  </p>
                  <p className="mt-2 text-[13px] text-slate-400">
                    For {LIMITS_SOURCE.taxYear} a defined benefit or cash balance plan can promise a benefit of
                    up to {usd(RETIREMENT_LIMITS_2026.find((l) => l.id === "db-annual-benefit")!.amount)} a
                    year ({LIMITS_SOURCE.notice}), which is usually the largest single lever on this line.
                  </p>
                </div>
              )}
            </div>

            <div className={`${CARD} p-5`}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <Scale className="h-4 w-4" aria-hidden /> What is binding, business by business
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {result.businesses.map((b, i) => (
                  <div key={i} className="rounded-xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-white">{b.name}</span>
                      <span className="text-lg font-semibold tabular-nums text-amber-200">{usd(b.amount)}</span>
                    </div>
                    <span className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${BINDING_TONE[b.binding] ?? "border-white/20 text-slate-300"}`}>
                      {b.binding}
                    </span>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] text-slate-400 tabular-nums">
                      <dt>20% of QBI</dt><dd className="text-right text-slate-200">{usd(b.tentative)}</dd>
                      <dt>Wage limit ({b.wageLimitProng})</dt><dd className="text-right text-slate-200">{usd(b.wageLimit)}</dd>
                      {b.isSSTB && (<><dt>Service percentage kept</dt><dd className="text-right text-slate-200">{Math.round(b.sstbApplicablePercentage * 100)}%</dd></>)}
                    </dl>
                    <p className="mt-3 text-[13px] leading-relaxed text-slate-300">{b.lever}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${CARD} p-5`}>
              <h2 className="text-sm font-semibold text-amber-200">What this means</h2>
              <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-[13.5px] leading-relaxed text-slate-300">
                {result.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
              <p className="mt-4 border-t border-white/10 pt-3 text-[12px] leading-relaxed text-slate-500">
                Thresholds from {result.source.thresholds}. Mechanics from {result.source.statute}. Minimum
                deduction from {result.source.minimumDeduction}. Retirement limits from {LIMITS_SOURCE.notice}.
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
