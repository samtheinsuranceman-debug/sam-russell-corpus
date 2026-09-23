// ============================================================
// /portal/lookback-integrity — how much of a backtest is the start year.
//
// Mechanics, not an illustration. The visitor picks a series (the raw S&P 500
// price return, their own crediting terms, or a held index option), a window
// length and a start year; the page places that window among every window of
// the same length the series holds and flags it when the start year is doing
// the work. Below it, the carrier's own published look-backs sorted into
// lived and back-tested. Every figure comes from shared/lookbackIntegrity.ts;
// this file only arranges it.
// ============================================================
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LookbackIntegrityBadge } from "@/components/LookbackIntegrityBadge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/NumberInput";
import { History, Scale, ShieldAlert, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ALL_INDEX_OPTIONS,
  MAX_YEAR,
  MIN_YEAR,
  RAW_INDEX_RETURNS,
  calculateCreditedRate,
  getCreditingHistory,
  type IndexOption,
} from "@shared/indexCreditingData";
import {
  CHERRY_PICK_PERCENTILE,
  LOOKBACK_DISCLOSURE,
  arithmeticMean,
  averagingOverstatement,
  bestDefensible,
  creditedSeries,
  geometricMean,
  nationwideIntegrity,
  sinceSweep,
  startYearIntegrity,
  type AnnualSeries,
} from "@shared/lookbackIntegrity";

const MARKET: AnnualSeries = RAW_INDEX_RETURNS.SP500!;
const MARKET_LABEL = `S&P 500 calendar-year price return, ${MIN_YEAR}–${MAX_YEAR} (ChartRow)`;

/** Options the held S&P series can run: single-index S&P, not the fixed account. */
const SP_OPTIONS: IndexOption[] = ALL_INDEX_OPTIONS.filter(o => o.index === "SP500" && !o.components?.length && o.participation > 0);

const pct = (v: number | null, d = 2) => (v === null ? "—" : `${v.toFixed(d)}%`);
const optionName = (id: string) => ALL_INDEX_OPTIONS.find(o => o.id === id)?.name ?? id;

const PANEL = "rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70 p-5";
const H2 = "mb-3 flex items-center gap-2 text-base font-semibold text-amber-200";

export default function LookbackIntegrity() {
  const [seriesId, setSeriesId] = useState<string>("raw");
  const [cap, setCap] = useState(10);
  const [floor, setFloor] = useState(0);
  const [par, setPar] = useState(100);
  const [years, setYears] = useState(10);
  const [startYear, setStartYear] = useState(2009);

  const series: AnnualSeries = useMemo(() => {
    if (seriesId === "raw") return MARKET;
    if (seriesId === "custom") {
      const terms: IndexOption = {
        id: "custom", name: "Your terms", carrier: "mutual-a", index: "SP500", cap, floor, participation: par,
        spread: 0, strategyCharge: 0, bonus: 0, description: "", availableFrom: MIN_YEAR,
      };
      return creditedSeries(MARKET, raw => calculateCreditedRate(terms, raw));
    }
    const option = SP_OPTIONS.find(o => o.id === seriesId);
    if (!option) return MARKET;
    const out: Record<number, number> = {};
    for (const row of getCreditingHistory(option, MIN_YEAR, MAX_YEAR)) out[row.year] = row.creditedRate;
    return out;
  }, [seriesId, cap, floor, par]);

  const seriesLabel =
    seriesId === "raw" ? MARKET_LABEL
      : seriesId === "custom" ? `${MARKET_LABEL}, credited at a ${cap}% cap, ${floor}% floor, ${par}% participation`
        : `${MARKET_LABEL}, credited on the ${optionName(seriesId)} terms held in this system`;

  const maxStart = MAX_YEAR - years + 1;
  const start = Math.min(Math.max(startYear, MIN_YEAR), maxStart);
  const r = useMemo(() => startYearIntegrity(series, start, years, MARKET), [series, start, years]);

  const windowRates = useMemo(() => {
    const rates: number[] = [];
    for (let y = start; y < start + years; y++) if (typeof series[y] === "number") rates.push(series[y]!);
    return { g: geometricMean(rates), a: arithmeticMean(rates), over: averagingOverstatement(rates) };
  }, [series, start, years]);

  const flagLine = useMemo(() => {
    const sorted = r.windows.map(w => w.compounded as number).sort((a, b) => a - b);
    if (!sorted.length) return null;
    return sorted[Math.min(sorted.length - 1, Math.floor((CHERRY_PICK_PERCENTILE / 100) * sorted.length))]!;
  }, [r.windows]);

  const bars = r.windows.map(w => ({ start: w.startYear, label: `${w.startYear}–${w.endYear}`, rate: w.compounded as number }));
  const since = useMemo(() => sinceSweep(series, MAX_YEAR, 5).map(w => ({ start: w.startYear, rate: w.compounded, years: w.years })), [series]);
  const published = useMemo(() => nationwideIntegrity(), []);
  const best = useMemo(() => bestDefensible(), []);
  const bestPublished = useMemo(() => published.reduce((a, b) => ((b.longestRate ?? -1) > (a.longestRate ?? -1) ? b : a)), [published]);

  return (
    <AppShell title="Look-back Integrity" subtitle="How much of a backtest is the start year.">
      <div className="mx-auto max-w-6xl space-y-6 p-4 text-sm text-slate-200 md:p-6">
        <header className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <History className="h-6 w-6 text-amber-300" aria-hidden /> Look-back Integrity
          </h1>
          <p className="max-w-3xl text-slate-300">
            Any historical backtest can be made to look good by choosing where it begins. Pick a window below and this page
            places it among every window of the same length the held history allows. When the start year is doing the work,
            it says so.
          </p>
        </header>

        <section className={PANEL} aria-labelledby="controls">
          <h2 id="controls" className={H2}><Scale className="h-4 w-4" aria-hidden /> The backtest</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="lb-series">Series compounded</label>
              <Select value={seriesId} onValueChange={setSeriesId}>
                <SelectTrigger id="lb-series" className="border-[#1e3a5f] bg-[#0a0f1a]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">S&amp;P 500 price return (raw)</SelectItem>
                  <SelectItem value="custom">S&amp;P 500 credited on your terms</SelectItem>
                  {SP_OPTIONS.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}{o.sourced ? "" : " (terms not yet sourced)"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {seriesId === "custom" && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <label className="text-xs text-slate-400">Cap %<NumberInput value={cap} onChange={setCap} min={0} max={100} step={0.25} /></label>
                  <label className="text-xs text-slate-400">Floor %<NumberInput value={floor} onChange={setFloor} min={0} max={5} step={0.25} /></label>
                  <label className="text-xs text-slate-400">Par %<NumberInput value={par} onChange={setPar} min={0} max={300} step={5} /></label>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Window length</span><span className="text-amber-200">{years} years</span>
              </div>
              <Slider value={[years]} min={3} max={25} step={1} onValueChange={v => setYears(v[0]!)} aria-label="Window length in years" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Start year</span><span className="text-amber-200">{start}–{start + years - 1}</span>
              </div>
              <Slider value={[start]} min={MIN_YEAR} max={maxStart} step={1} onValueChange={v => setStartYear(v[0]!)} aria-label="Start year" />
            </div>
          </div>
        </section>

        <LookbackIntegrityBadge series={series} startYear={start} years={years} market={MARKET} seriesLabel={seriesLabel} showLink={false} />

        <section className="grid gap-4 md:grid-cols-4" aria-label="The chosen window">
          {[
            { k: "Compounded", v: pct(windowRates.g), note: "what an account would actually have grown at" },
            { k: "Arithmetic average", v: pct(windowRates.a), note: `overstates by ${pct(windowRates.over)}` },
            { k: "Median window", v: pct(r.median), note: `of ${r.n} ${years}-year windows` },
            { k: "Best / worst window", v: `${pct(r.best?.compounded ?? null, 1)} / ${pct(r.worst?.compounded ?? null, 1)}`, note: r.best && r.worst ? `${r.best.startYear} start / ${r.worst.startYear} start` : "" },
          ].map(c => (
            <div key={c.k} className={PANEL}>
              <div className="text-xs uppercase tracking-wide text-slate-400">{c.k}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums text-white">{c.v}</div>
              <div className="text-xs text-slate-500">{c.note}</div>
            </div>
          ))}
        </section>

        <section className={PANEL} aria-labelledby="every-window">
          <h2 id="every-window" className={H2}><TrendingUp className="h-4 w-4" aria-hidden /> Every {years}-year window, by start year</h2>
          <p className="mb-3 text-slate-400">
            Gold is the window you chose. Amber bars sit at or above the {CHERRY_PICK_PERCENTILE}th percentile: quote one of those
            alone and the start year is carrying the result.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#1e3a5f" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="start" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "#0a0f1a", border: "1px solid #1e3a5f", color: "#e2e8f0" }}
                  formatter={(v: number) => [`${v.toFixed(2)}%`, "Compounded"]}
                  labelFormatter={(_l, p) => (p?.[0]?.payload?.label as string) ?? ""}
                />
                {r.median !== null && <ReferenceLine y={r.median} stroke="#34d399" strokeDasharray="4 4" label={{ value: "median", fill: "#34d399", fontSize: 11, position: "insideTopRight" }} />}
                <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                  {bars.map(b => (
                    <Cell key={b.start} fill={b.start === start ? "#fbbf24" : flagLine !== null && b.rate >= flagLine ? "#b45309" : "#334e73"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={PANEL} aria-labelledby="since">
          <h2 id="since" className={H2}><History className="h-4 w-4" aria-hidden /> "Since year X" through {MAX_YEAR}</h2>
          <p className="mb-3 text-slate-400">
            The same series quoted "since" each start year. Nothing on a "since 2009" page looks chosen, yet the figure moves
            this much with the year it names.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={since} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#1e3a5f" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="start" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "#0a0f1a", border: "1px solid #1e3a5f", color: "#e2e8f0" }}
                  formatter={(v: number, _n, p) => [`${v.toFixed(2)}% over ${p?.payload?.years} years`, "Compounded"]}
                  labelFormatter={l => `Since ${l}`}
                />
                <ReferenceLine x={start} stroke="#fbbf24" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="rate" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={PANEL} aria-labelledby="published">
          <h2 id="published" className={H2}><ShieldAlert className="h-4 w-4" aria-hidden /> A carrier's published look-backs: lived or back-tested</h2>
          {best && (
            <p className="mb-3 text-slate-300">
              The best figure a page may print as this carrier's strongest allocation is <span className="font-semibold text-emerald-300">{pct(best.headlineRate)}</span>{" "}
              ({optionName(best.optionId)}, {best.longestPublished}-year look-back on real history). The highest figure the carrier publishes is{" "}
              <span className="font-semibold text-amber-300">{pct(bestPublished.longestRate)}</span> ({optionName(bestPublished.optionId)}), on an index established in 2022.
            </p>
          )}
          <div className="overflow-x-auto rounded-lg border border-[#1e3a5f]/60">
            <table className="w-full text-left tabular-nums">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="p-2">Option</th><th className="p-2">History</th><th className="p-2 text-right">Longest published</th>
                  <th className="p-2 text-right">Lived window</th><th className="p-2 text-right">Hindsight gap</th><th className="p-2 text-right">May be printed</th>
                </tr>
              </thead>
              <tbody>
                {published.map(i => (
                  <tr key={i.optionId} className="border-t border-[#1e3a5f]/40" title={i.basis}>
                    <td className="p-2">{optionName(i.optionId)}</td>
                    <td className={`p-2 ${i.provenance === "lived" ? "text-emerald-300" : "text-amber-300"}`}>{i.provenance}</td>
                    <td className="p-2 text-right">{i.longestPublished ? `${pct(i.longestRate)} (${i.longestPublished}y)` : "—"}</td>
                    <td className="p-2 text-right">{i.livedYears ? `${pct(i.livedRate)} (${i.livedYears}y)` : "—"}</td>
                    <td className="p-2 text-right">{i.hindsightGap === null ? "—" : `${i.hindsightGap.toFixed(2)} pts`}</td>
                    <td className="p-2 text-right font-semibold text-white">{pct(i.headlineRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">{LOOKBACK_DISCLOSURE}</p>
        </section>
      </div>
    </AppShell>
  );
}
