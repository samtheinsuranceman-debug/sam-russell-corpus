// ============================================================
// CREDIT-LINE SEQUENCING — the page body, kept apart from the app shell so
// it can be rendered on its own (server/creditLineSequencingPage.test.ts).
//
// Everything on it is computed by shared/creditLineSequencingEngine.ts in
// the browser: the page chooses nothing, prints no figure of its own, and
// shows the payoff burden before it shows any benefit, as the engine does.
// ============================================================
import React, { useMemo, useState } from "react";
import {
  CREDIT_LINE_RULES,
  ISSUER_RULES,
  getDefaultCreditLineInput,
  runCreditLineSequence,
  type CalendarEvent,
  type CreditLineInput,
  type CreditLineResult,
  type IssuerId,
} from "@shared/creditLineSequencingEngine";
import { ASSUMED_RATE_LABEL } from "@shared/policyDisclosure";
import { AlertTriangle, CalendarClock, CheckCircle2, CreditCard, Info, ShieldCheck, XCircle } from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const CARD = "rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70";
const FIELD =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/50";
const LABEL = "text-xs font-medium text-slate-400";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct1 = (n: number) => `${(n * 100).toFixed(1)}%`;

const KIND_LABEL: Record<CalendarEvent["kind"], string> = {
  apply: "Apply",
  cli_request: "Line increase",
  move_issuer: "Move on",
  cleared: "At zero",
  promo_ends: "Promo ends",
};

/**
 * The sequence in plain English, one sentence per step, built only from the
 * engine's result. Exported so the test can hold it to the numbers it prints.
 */
export function explainCreditLineSequence(input: CreditLineInput, r: CreditLineResult): string[] {
  const failed = r.suitability.checks.filter(c => !c.pass);
  if (!r.suitability.suitable) {
    return [
      `The household fails ${failed.length} of ${r.suitability.checks.length} suitability checks: ${failed.map(c => `${c.test.toLowerCase()} (${c.detail.replace(/\.$/, "")})`).join("; ")}.`,
      "No sequence is shown. Applying now would add hard inquiries and a payoff the household cannot yet carry. Fix the failed checks first, then run it again.",
    ];
  }
  const out: string[] = [];
  out.push(`All ${r.suitability.checks.length} suitability checks pass, so the engine builds a ${r.months.length}-month plan.`);
  if (r.lines.length === 0) {
    out.push("No issuer can be approached inside the horizon under its own velocity rules, so no line is opened. Lengthen the horizon or widen the issuer list.");
    return out;
  }
  const opens = r.lines.map(l => `${l.issuerName} in month ${l.openedMonth} (about ${usd(l.limit)} after any increase, 0% for ${l.promoMonths} months)`);
  out.push(`Open ${r.lines.length} card${r.lines.length === 1 ? "" : "s"}, never more than one a month. Issuers that count every new card on the file (such as a 5/24 rule) go first, before the count climbs; then the longest 0% window and largest line: ${opens.join("; ")}.`);
  const clis = r.calendar.filter(e => e.kind === "cli_request");
  if (clis.length) out.push(`Ask for a line increase once each card is old enough, usually a soft pull: ${clis.map(e => `card ${e.cardIndex} in month ${e.month} (+${usd(e.amount ?? 0)})`).join("; ")}.`);
  const used = r.routes.filter(x => x.available && x.grossCapacity > 0);
  if (used.length) {
    out.push(
      `Together the lines reach ${usd(r.totals.aggregateLimit)}. Of that, ${usd(r.totals.deployableGross)} is placed as premium, cheapest route first: ` +
      used.map(x => `${usd(x.grossCapacity)} by ${x.label.toLowerCase()}${x.fees > 0 ? ` (fee ${usd(x.fees)})` : " (no fee)"}`).join("; ") + ".",
    );
  }
  const c = r.comparison;
  if (c) {
    out.push(
      `Every dollar is repaid from cash flow. Each line is paid down in equal monthly amounts and is at zero one month before its promo ends. ` +
      `The heaviest month asks for ${usd(c.peakMonthlyPayoff)}; ${c.cashFlowFeasible ? "the household's surplus covers every month" : "in at least one month that is more than the household's surplus, so the plan as set does not work"}.`,
    );
    out.push(
      `Only then the policy side: at the ${ASSUMED_RATE_LABEL.toLowerCase()} you set (${pct1(input.policyCreditingRate)}), the placed premium net of fees and load is worth about ${usd(c.policyValueAtHorizon)} at month ${r.months.length}, against ${usd(c.doNothingValueAtHorizon)} repaid. ` +
      `The rate at which fees and load are just recovered is ${pct1(c.breakEvenCreditingRate)}. The benefit is time in the policy, not the capital; the capital was always the household's own cash flow.`,
    );
  }
  out.push(`Each card also costs a hard inquiry: ${r.totals.hardInquiries} in all. Issuer approval rules are community-reported, not published; confirm each with the issuer before applying.`);
  return out;
}

function NumField({ label, value, onChange, step, min, max, suffix }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string;
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}{suffix ? <span className="text-slate-500"> ({suffix})</span> : null}</span>
      <input
        type="number"
        className={FIELD}
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={e => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </label>
  );
}

export default function CreditLineSequencingView() {
  const [input, setInput] = useState<CreditLineInput>(() => getDefaultCreditLineInput());
  const [openingsText, setOpeningsText] = useState("");
  const [mortgageText, setMortgageText] = useState("");

  const set = <K extends keyof CreditLineInput>(k: K, v: CreditLineInput[K]) => setInput(p => ({ ...p, [k]: v }));
  const result = useMemo(() => runCreditLineSequence(input), [input]);
  const explanation = useMemo(() => explainCreditLineSequence(input, result), [input, result]);
  const chartData = useMemo(() => result.months.map(m => ({
    month: m.month,
    aggregateLimit: Math.round(m.aggregateLimit),
    drawn: Math.round(m.drawn),
    payoff: Math.round(m.payoff),
  })), [result]);

  const selected = new Set<IssuerId>(input.issuers ?? ISSUER_RULES.map(r => r.id));
  const toggleIssuer = (id: IssuerId) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    set("issuers", ISSUER_RULES.map(r => r.id).filter(x => next.has(x)));
  };

  const surplus = input.annualIncome / 12 - input.monthlyExpenses - input.monthlyDebtPayments;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6" data-testid="credit-line-sequencing">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">Premium funding mechanics</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Credit-Line Sequencing</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Which card issuers to approach, in what order and when; how much 0% promotional capital that makes
          placeable as premium; and the payoff that clears every line before its promo ends. The payoff burden
          comes first. A household that fails the suitability gate gets no sequence at all.
        </p>
      </header>

      {/* ── Inputs ── */}
      <section className={`${CARD} p-5`}>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <CreditCard className="h-4 w-4 text-amber-300" /> The household
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <NumField label="FICO score" value={input.fico} onChange={v => set("fico", v)} min={300} max={850} />
          <NumField label="Annual income" value={input.annualIncome} onChange={v => set("annualIncome", v)} step={10000} min={0} />
          <NumField label="Monthly spending" value={input.monthlyExpenses} onChange={v => set("monthlyExpenses", v)} step={500} min={0} />
          <NumField label="Monthly debt payments" value={input.monthlyDebtPayments} onChange={v => set("monthlyDebtPayments", v)} step={100} min={0} />
          <NumField label="Emergency fund" suffix="months" value={input.emergencyFundMonths} onChange={v => set("emergencyFundMonths", v)} min={0} />
          <NumField label="Oldest account" suffix="years" value={input.oldestAccountYears} onChange={v => set("oldestAccountYears", v)} min={0} />
          <NumField label="Late payments, last 24 months" value={input.latePaymentsLast24Months} onChange={v => set("latePaymentsLast24Months", v)} min={0} />
          <label className="block">
            <span className={LABEL}>Cards opened recently <span className="text-slate-500">(months ago, comma-separated)</span></span>
            <input
              className={FIELD}
              value={openingsText}
              placeholder="e.g. 3, 14"
              onChange={e => {
                setOpeningsText(e.target.value);
                set("recentCardOpenings", parseOpenings(e.target.value));
              }}
            />
          </label>
          <NumField label="Existing revolving limits" value={input.existingRevolvingLimit} onChange={v => set("existingRevolvingLimit", v)} step={1000} min={0} />
          <NumField label="Existing revolving balances" value={input.existingRevolvingBalance} onChange={v => set("existingRevolvingBalance", v)} step={500} min={0} />
          <label className="block">
            <span className={LABEL}>Mortgage application in <span className="text-slate-500">(months, blank if none)</span></span>
            <input
              className={FIELD}
              value={mortgageText}
              placeholder="none planned"
              onChange={e => {
                setMortgageText(e.target.value);
                const n = Number(e.target.value);
                set("mortgageApplicationInMonths", e.target.value.trim() === "" || !Number.isFinite(n) ? null : n);
              }}
            />
          </label>
          <NumField label="Movable share of spending" suffix="%" value={Math.round((input.movableSpendShare ?? CREDIT_LINE_RULES.movableSpendShare.value) * 100)} onChange={v => set("movableSpendShare", Math.max(0, Math.min(100, v)) / 100)} min={0} max={100} />
        </div>

        <h2 className="mb-3 mt-6 text-sm font-semibold text-white">The plan</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <NumField label="Target annual premium" value={input.targetAnnualPremium} onChange={v => set("targetAnnualPremium", v)} step={5000} min={0} />
          <NumField label="Horizon" suffix="months, 6–60" value={input.horizonMonths} onChange={v => set("horizonMonths", v)} min={6} max={60} />
          <NumField label={ASSUMED_RATE_LABEL} suffix="%, you set it" value={Number((input.policyCreditingRate * 100).toFixed(2))} onChange={v => set("policyCreditingRate", v / 100)} step={0.25} min={0} />
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-300">
            <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={input.carrierAcceptsCard} onChange={e => set("carrierAcceptsCard", e.target.checked)} />
            Carrier accepts premium by card
          </label>
        </div>

        <div className="mt-5">
          <div className={LABEL}>Issuers to consider</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ISSUER_RULES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleIssuer(r.id)}
                title={r.policy}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  selected.has(r.id)
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                    : "border-white/10 bg-black/20 text-slate-500"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">Monthly surplus before any payoff: <span className={surplus > 0 ? "text-emerald-300" : "text-rose-300"}>{usd(surplus)}</span>.</p>
      </section>

      {/* ── Suitability gate ── */}
      <section className={`${CARD} border-l-4 p-5 ${result.suitability.suitable ? "border-l-emerald-400" : "border-l-rose-400"}`}>
        <h2 className="flex items-center gap-2 font-semibold text-white">
          {result.suitability.suitable ? <ShieldCheck className="h-5 w-5 text-emerald-300" /> : <AlertTriangle className="h-5 w-5 text-rose-300" />}
          Suitability gate: {result.suitability.suitable ? "passes" : "fails"} ({result.suitability.score}%)
        </h2>
        <ul className="mt-3 grid gap-1.5 text-sm md:grid-cols-2">
          {result.suitability.checks.map(c => (
            <li key={c.test} className="flex items-start gap-2">
              {c.pass ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />}
              <span className="text-slate-300">{c.test} <span className="text-slate-500">{c.detail}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Plain English ── */}
      <section className={`${CARD} p-5`} data-testid="credit-line-explanation">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-white">
          <Info className="h-4 w-4 text-amber-300" /> The sequence, in plain English
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
          {explanation.map(s => <li key={s}>{s}</li>)}
        </ol>
      </section>

      {result.suitability.suitable && result.lines.length > 0 && (
        <>
          {/* ── Totals ── */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {[
              { k: "Peak monthly payoff", v: usd(result.comparison?.peakMonthlyPayoff ?? 0), tone: result.comparison?.cashFlowFeasible ? "text-amber-200" : "text-rose-300" },
              { k: "Cards opened", v: String(result.totals.cardsOpened), tone: "text-white" },
              { k: "Hard inquiries", v: String(result.totals.hardInquiries), tone: "text-white" },
              { k: "Aggregate limit", v: usd(result.totals.aggregateLimit), tone: "text-white" },
              { k: "Placed as premium", v: usd(result.totals.deployableGross), tone: "text-emerald-300" },
              { k: "Fees", v: usd(result.totals.fees), tone: "text-white" },
            ].map(x => (
              <div key={x.k} className={`${CARD} p-3`}>
                <div className="text-[11px] uppercase tracking-wide text-slate-500">{x.k}</div>
                <div className={`mt-1 text-lg font-bold ${x.tone}`}>{x.v}</div>
              </div>
            ))}
          </section>

          {/* ── Chart ── */}
          <section className={`${CARD} p-5`}>
            <h2 className="mb-1 font-semibold text-white">Month by month: limits, balances, payoff</h2>
            <p className="mb-3 text-xs text-slate-500">Open limit across the new cards, the balance still owed on them, and the payoff the household makes that month.</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
                  <Tooltip contentStyle={{ background: "#0a0f1a", border: "1px solid #1e3a5f" }} formatter={(v: number) => usd(v)} labelFormatter={l => `Month ${l}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="stepAfter" dataKey="aggregateLimit" name="Open limit" stroke="#fbbf24" dot={false} strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="drawn" name="Balance owed" stroke="#34d399" fill="#065f46" fillOpacity={0.45} isAnimationActive={false} />
                  <Bar dataKey="payoff" name="Monthly payoff" fill="#1e3a5f" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Calendar ── */}
          <section className={`${CARD} p-5`}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
              <CalendarClock className="h-4 w-4 text-amber-300" /> The calendar
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Month</th><th className="py-2 pr-3">Step</th><th className="py-2 pr-3">Card</th><th className="py-2 pr-3">What happens</th><th className="py-2 pr-3 text-right">Amount</th><th className="py-2 text-right">Hard pull</th>
                  </tr>
                </thead>
                <tbody>
                  {result.calendar.map((e, i) => (
                    <tr key={`${e.month}-${e.kind}-${e.cardIndex}-${i}`} className="border-b border-white/5 align-top">
                      <td className="py-2 pr-3 text-slate-300">{e.month}</td>
                      <td className="py-2 pr-3"><span className={`rounded px-1.5 py-0.5 text-[11px] ${e.kind === "apply" ? "bg-amber-400/15 text-amber-200" : e.kind === "promo_ends" ? "bg-rose-400/15 text-rose-200" : e.kind === "cleared" ? "bg-emerald-400/15 text-emerald-200" : "bg-white/5 text-slate-300"}`}>{KIND_LABEL[e.kind]}</span></td>
                      <td className="py-2 pr-3 text-slate-300">{e.cardIndex} · {e.issuerName}</td>
                      <td className="py-2 pr-3 text-slate-400">{e.detail}</td>
                      <td className="py-2 pr-3 text-right text-slate-200">{e.amount !== undefined ? usd(e.amount) : "—"}</td>
                      <td className="py-2 text-right text-slate-400">{e.hardInquiry ? "yes" : "no"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Lines + routes ── */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className={`${CARD} p-5`}>
              <h2 className="mb-3 font-semibold text-white">The lines</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-2">Card</th><th className="py-2 pr-2 text-right">Limit</th><th className="py-2 pr-2 text-right">Placed</th><th className="py-2 pr-2 text-right">Payoff / mo</th><th className="py-2 text-right">Zero by / promo ends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lines.map(l => (
                      <tr key={l.cardIndex} className="border-b border-white/5">
                        <td className="py-2 pr-2 text-slate-300">{l.cardIndex} · {l.issuerName}</td>
                        <td className="py-2 pr-2 text-right text-slate-200">{usd(l.limit)}</td>
                        <td className="py-2 pr-2 text-right text-emerald-300">{usd(l.deployed)}</td>
                        <td className="py-2 pr-2 text-right text-amber-200">{usd(l.monthlyPayoff)}</td>
                        <td className="py-2 text-right text-slate-400">m{l.clearedMonth} / m{l.promoEndsMonth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`${CARD} p-5`}>
              <h2 className="mb-3 font-semibold text-white">Routes from a card line to premium</h2>
              <ul className="space-y-2.5 text-sm">
                {result.routes.map(x => (
                  <li key={x.route} className={`rounded-xl border p-3 ${x.available ? "border-emerald-400/20 bg-emerald-400/[0.04]" : "border-white/10 bg-black/20"}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-medium ${x.available ? "text-white" : "text-slate-500"}`}>{x.label}</span>
                      <span className="text-xs text-slate-400">{x.available ? `${usd(x.grossCapacity)} · fee ${pct1(x.feeRate)}` : "not available"}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{x.plain}{x.reason ? ` ${x.reason}` : ""}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── Month table ── */}
          <section className={`${CARD} p-5`}>
            <h2 className="mb-3 font-semibold text-white">Month table</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2">Month</th><th className="py-2 pr-2 text-right">Open limit</th><th className="py-2 pr-2 text-right">Balance owed</th><th className="py-2 pr-2 text-right">Premium placed</th><th className="py-2 pr-2 text-right">Payoff</th><th className="py-2 pr-2 text-right">Utilization</th><th className="py-2 text-right">Surplus after payoff</th>
                  </tr>
                </thead>
                <tbody>
                  {result.months.map(m => (
                    <tr key={m.month} className="border-b border-white/5">
                      <td className="py-1.5 pr-2 text-slate-300">{m.month}</td>
                      <td className="py-1.5 pr-2 text-right text-slate-300">{usd(m.aggregateLimit)}</td>
                      <td className="py-1.5 pr-2 text-right text-slate-300">{usd(m.drawn)}</td>
                      <td className="py-1.5 pr-2 text-right text-emerald-300">{usd(m.premiumPlaced)}</td>
                      <td className="py-1.5 pr-2 text-right text-amber-200">{usd(m.payoff)}</td>
                      <td className={`py-1.5 pr-2 text-right ${m.utilization > CREDIT_LINE_RULES.utilizationWarnAbove.value ? "text-rose-300" : "text-slate-300"}`}>{pct1(m.utilization)}</td>
                      <td className={`py-1.5 text-right ${m.cashFlowSurplus < 0 ? "text-rose-300" : "text-slate-300"}`}>{usd(m.cashFlowSurplus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ── Risks ── */}
      <section className={`${CARD} p-5`}>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
          <AlertTriangle className="h-4 w-4 text-amber-300" /> What can go wrong
        </h2>
        <ul className="space-y-2 text-sm">
          {result.risks.map(x => (
            <li key={x.title} className="flex items-start gap-2">
              <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase ${x.severity === "high" ? "bg-rose-400/15 text-rose-200" : x.severity === "medium" ? "bg-amber-400/15 text-amber-200" : "bg-white/5 text-slate-300"}`}>{x.severity}</span>
              <span className="text-slate-300"><span className="font-medium text-white">{x.title}.</span> {x.plain}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500" data-testid="credit-line-provenance">
        Rules as of {result.provenance.rulesVersion}. {result.provenance.verifiedRules.length} rules are read from their publisher; {result.provenance.unverifiedRules.length} are assumptions or community reports. {result.provenance.note}
      </p>
    </div>
  );
}

/** "3, 14" -> [3, 14]. Blanks and anything outside 0-24 months are dropped: older openings do not count against any issuer rule. */
export function parseOpenings(text: string): number[] {
  return text.split(",").map(s => s.trim()).filter(s => s !== "").map(Number).filter(n => Number.isFinite(n) && n >= 0 && n <= 24);
}
