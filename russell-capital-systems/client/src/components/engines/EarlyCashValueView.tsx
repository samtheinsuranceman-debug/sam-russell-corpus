// ============================================================
// EARLY CASH VALUE — the page body, kept apart from the app shell so it can
// be rendered on its own (server/earlyCashValuePage.test.ts).
//
// Mechanics, not an illustration. The engine (shared/earlyCashValue.ts) picks
// the surrender-charge schedule the carrier says governs each way money comes
// out, and runs the policy with and without the Surrender Value Enhancement
// Rider. The page shows which schedule applies and what the rider changes;
// the account value's own growth is deliberately kept in the background.
// ============================================================
import React, { useMemo, useState } from "react";
import {
  ADJUSTED_WITH_RIDER,
  ECV_DISCLOSURE,
  EARLY_CASH_VALUE_SOURCES,
  UNADJUSTED_EXAMPLE,
  compareEarlyCashValue,
  getDefaultEcvInput,
  riderHelps,
  scheduleFor,
  type DistributionType,
  type EcvComparison,
  type EcvInput,
} from "@shared/earlyCashValue";
import { ASSUMED_RATE_LABEL } from "@shared/policyDisclosure";
import { AlertTriangle, CheckCircle2, Info, Scale, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const CARD = "rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70";
const FIELD =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/50";
const LABEL = "text-xs font-medium text-slate-400";

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

export const DISTRIBUTION_LABEL: Record<DistributionType, string> = {
  loan: "Policy loan",
  partial: "Partial surrender (withdrawal)",
  full_surrender: "Full surrender (not a 1035)",
  exchange_1035: "Full surrender by 1035 exchange",
};

const DISTRIBUTIONS: DistributionType[] = ["loan", "partial", "exchange_1035", "full_surrender"];

/** The mechanism in plain English, from the engine's result only. */
export function explainEarlyCashValue(input: EcvInput, c: EcvComparison): string[] {
  const sched = scheduleFor(input.distributionType);
  const firstYear = Math.max(1, Math.ceil(input.firstDistributionMonth / 12));
  const out = [
    `The carrier prints two surrender-charge schedules. The unadjusted one governs policy loans, partial surrenders, lapse and 1035 exchanges; the adjusted one governs only a full surrender that is not a 1035.`,
    `The rider zeroes the adjusted schedule from day one. It leaves the unadjusted schedule, ${usd(UNADJUSTED_EXAMPLE.byYear[0] ?? 0)} in years 1 to 3 on this illustration and falling to zero by year ${UNADJUSTED_EXAMPLE.byYear.length}, exactly as it was.`,
    `This plan takes money out by ${DISTRIBUTION_LABEL[input.distributionType].toLowerCase()}, starting in policy year ${firstYear}, so the ${sched} schedule governs it${riderHelps(input.distributionType) ? " and the rider does change it." : ", with or without the rider."}`,
    `The rider is charged every year either way: ${usd(c.totalRiderCost)} over ${input.years} years, leaving ${usd(c.endingValueGivenUp)} less account value at the end.`,
  ];
  out.push(
    c.crossoverYear === null
      ? "In no policy year is more value reachable with the rider than without it, for this way of taking money out."
      : `With the rider, more value is reachable from policy year ${c.crossoverYear}, because the charge it removes is larger than what it has cost so far.`,
  );
  out.push("The rider is elected at issue and cannot be revoked, so this is decided once.");
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

export default function EarlyCashValueView() {
  const [input, setInput] = useState<EcvInput>(() => getDefaultEcvInput());
  const set = <K extends keyof EcvInput>(k: K, v: EcvInput[K]) => setInput(p => ({ ...p, [k]: v }));
  const safeInput = useMemo<EcvInput>(() => ({ ...input, years: Math.max(1, Math.min(60, Math.round(input.years))) }), [input]);
  const c = useMemo(() => compareEarlyCashValue(safeInput), [safeInput]);
  const explanation = useMemo(() => explainEarlyCashValue(safeInput, c), [safeInput, c]);

  const scheduleData = useMemo(() => UNADJUSTED_EXAMPLE.byYear.map((u, i) => ({
    year: i + 1,
    unadjusted: Math.round(u),
    adjusted: Math.round(ADJUSTED_WITH_RIDER.byYear[i] ?? 0),
  })), []);
  const deltaData = useMemo(() => c.accessibleDelta.map((d, i) => ({ year: i + 1, delta: Math.round(d) })), [c]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6" data-testid="early-cash-value">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">Policy mechanics</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Early Cash Value</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Does a surrender-value enhancement rider help a plan that borrows against the policy? The carrier applies a
          different surrender-charge schedule to each way money comes out. This page shows which one governs your plan,
          and what the rider changes, year by year.
        </p>
      </header>

      {/* ── Verdict ── */}
      <section className={`${CARD} border-l-4 p-5 ${c.riderHelpsThisPlan ? "border-l-emerald-400" : "border-l-amber-400"}`} data-testid="ecv-verdict">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          {c.riderHelpsThisPlan ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <AlertTriangle className="h-5 w-5 text-amber-300" />}
          {c.riderHelpsThisPlan ? "The rider changes this plan's outcome" : "The rider changes nothing this plan does"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{c.verdict}</p>
      </section>

      {/* ── Inputs ── */}
      <section className={`${CARD} p-5`}>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Scale className="h-4 w-4 text-amber-300" /> The plan
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <label className="block">
            <span className={LABEL}>How money comes out</span>
            <select className={FIELD} value={input.distributionType} onChange={e => set("distributionType", e.target.value as DistributionType)}>
              {DISTRIBUTIONS.map(d => <option key={d} value={d}>{DISTRIBUTION_LABEL[d]}</option>)}
            </select>
          </label>
          <NumField label="Annual premium" value={input.annualPremium} onChange={v => set("annualPremium", v)} step={5000} min={0} />
          <NumField label="Years" value={input.years} onChange={v => set("years", v)} min={1} max={60} />
          <NumField label="Premium load" suffix="%" value={input.premiumLoadPct} onChange={v => set("premiumLoadPct", v)} step={0.5} min={0} max={100} />
          <NumField label="First distribution" suffix="months from issue" value={input.firstDistributionMonth} onChange={v => set("firstDistributionMonth", v)} min={1} />
          <NumField label="Annual distribution" value={input.annualDistribution} onChange={v => set("annualDistribution", v)} step={5000} min={0} />
          <NumField label={ASSUMED_RATE_LABEL} suffix="%, you set it" value={input.creditedRate} onChange={v => set("creditedRate", v)} step={0.25} min={0} />
          <NumField label="Rider cost" suffix="% of account value a year, unverified" value={input.riderAnnualCostPct} onChange={v => set("riderAnnualCostPct", v)} step={0.05} min={0} />
        </div>
      </section>

      {/* ── Which schedule governs what ── */}
      <section className={`${CARD} p-5`}>
        <h2 className="mb-3 font-semibold text-white">Which schedule governs each way out</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="ecv-schedule-map">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Way money comes out</th><th className="py-2 pr-3">Schedule the carrier applies</th><th className="py-2 pr-3">Charge in year 1, with rider</th><th className="py-2">Does the rider help?</th>
              </tr>
            </thead>
            <tbody>
              {DISTRIBUTIONS.map(d => {
                const helps = riderHelps(d);
                const yr1 = helps ? ADJUSTED_WITH_RIDER.byYear[0] ?? 0 : UNADJUSTED_EXAMPLE.byYear[0] ?? 0;
                return (
                  <tr key={d} className={`border-b border-white/5 ${d === input.distributionType ? "bg-amber-400/[0.06]" : ""}`}>
                    <td className="py-2 pr-3 text-slate-200">{DISTRIBUTION_LABEL[d]}{d === input.distributionType ? <span className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-200">this plan</span> : null}</td>
                    <td className="py-2 pr-3 capitalize text-slate-300">{scheduleFor(d)}</td>
                    <td className="py-2 pr-3 text-slate-300">{usd(yr1)}</td>
                    <td className="py-2">
                      {helps
                        ? <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="h-4 w-4" /> yes</span>
                        : <span className="inline-flex items-center gap-1 text-slate-400"><XCircle className="h-4 w-4" /> no</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Charts ── */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${CARD} p-5`}>
          <h2 className="mb-1 font-semibold text-white">The two surrender-charge schedules</h2>
          <p className="mb-3 text-xs text-slate-500">By policy year, as printed on the illustration. The rider zeroes only the adjusted column.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scheduleData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: "#0a0f1a", border: "1px solid #1e3a5f" }} formatter={(v: number) => usd(v)} labelFormatter={l => `Policy year ${l}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="unadjusted" name="Unadjusted (loans, withdrawals, 1035)" fill="#fbbf24" isAnimationActive={false} />
                <Bar dataKey="adjusted" name="Adjusted with rider (full surrender)" fill="#34d399" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${CARD} p-5`}>
          <h2 className="mb-1 font-semibold text-white">What the rider changes, year by year</h2>
          <p className="mb-3 text-xs text-slate-500">Reachable value with the rider minus without it, for this plan's way out. Below zero is what the rider costs.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deltaData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: "#0a0f1a", border: "1px solid #1e3a5f" }} formatter={(v: number) => usd(v)} labelFormatter={l => `Policy year ${l}`} />
                <ReferenceLine y={0} stroke="#64748b" />
                <Bar dataKey="delta" name="With rider minus without" fill="#fbbf24" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── Totals ── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { k: "Rider helps this plan", v: c.riderHelpsThisPlan ? "Yes" : "No", tone: c.riderHelpsThisPlan ? "text-emerald-300" : "text-amber-200" },
          { k: "Rider charges, all years", v: usd(c.totalRiderCost), tone: "text-white" },
          { k: "Account value given up at the end", v: usd(c.endingValueGivenUp), tone: "text-white" },
          { k: "First year the rider is ahead", v: c.crossoverYear === null ? "Never" : `Year ${c.crossoverYear}`, tone: "text-white" },
        ].map(x => (
          <div key={x.k} className={`${CARD} p-3`}>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{x.k}</div>
            <div className={`mt-1 text-lg font-bold ${x.tone}`}>{x.v}</div>
          </div>
        ))}
      </section>

      {/* ── Plain English ── */}
      <section className={`${CARD} p-5`} data-testid="ecv-explanation">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-white">
          <Info className="h-4 w-4 text-amber-300" /> How it works, in plain English
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
          {explanation.map(s => <li key={s}>{s}</li>)}
        </ol>
      </section>

      {/* ── Year table ── */}
      <section className={`${CARD} p-5`}>
        <h2 className="mb-3 font-semibold text-white">Year by year</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2">Year</th>
                <th className="py-2 pr-2 text-right">Distribution</th>
                <th className="py-2 pr-2 text-right">Rider charge</th>
                <th className="py-2 pr-2 text-right">Charge, with rider</th>
                <th className="py-2 pr-2 text-right">Charge, without</th>
                <th className="py-2 pr-2 text-right">Reachable, with rider</th>
                <th className="py-2 pr-2 text-right">Reachable, without</th>
                <th className="py-2 text-right">Difference</th>
              </tr>
            </thead>
            <tbody>
              {c.withRider.map((w, i) => {
                const o = c.withoutRider[i]!;
                const d = c.accessibleDelta[i] ?? 0;
                return (
                  <tr key={w.policyYear} className="border-b border-white/5">
                    <td className="py-1.5 pr-2 text-slate-300">{w.policyYear}</td>
                    <td className="py-1.5 pr-2 text-right text-slate-300">{usd(w.distributionTaken)}</td>
                    <td className="py-1.5 pr-2 text-right text-amber-200">{usd(w.riderCharge)}</td>
                    <td className="py-1.5 pr-2 text-right text-slate-300">{usd(w.surrenderCharge)}</td>
                    <td className="py-1.5 pr-2 text-right text-slate-300">{usd(o.surrenderCharge)}</td>
                    <td className="py-1.5 pr-2 text-right text-slate-300">{usd(w.accessibleValue)}</td>
                    <td className="py-1.5 pr-2 text-right text-slate-300">{usd(o.accessibleValue)}</td>
                    <td className={`py-1.5 text-right ${d < 0 ? "text-rose-300" : d > 0 ? "text-emerald-300" : "text-slate-400"}`}>{usd(d)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2 text-xs text-slate-500" data-testid="ecv-provenance">
        <p>{ECV_DISCLOSURE}</p>
        <ul className="list-disc space-y-1 pl-5">
          {EARLY_CASH_VALUE_SOURCES.map(s => <li key={s.label}>{s.label} — as of {s.asOf}. {s.note}</li>)}
        </ul>
      </section>
    </div>
  );
}
