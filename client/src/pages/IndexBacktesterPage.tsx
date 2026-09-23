// A25 (2026-09-23): /portal/index-backtester-pro now runs a backtest. Before: two
// uncontrolled inputs, "Placeholder: Historical Data Loaded for S&P 500", every tab
// "will be displayed here", and a made-up "Page Insights Score: 95/100".
// Math: shared/indexBacktestPro.ts on the sourced S&P 500 price-return series
// (test: server/a25Calculators.test.ts).
import { useMemo, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from "recharts";
import { NumberField, Toggle, Stat, Panel, ProvenanceSources, usd } from "@/components/calc/CalcKit";
import { runBacktestPro, BACKTEST_FIRST_YEAR, BACKTEST_LAST_YEAR, INDEX_BACKTEST_PRO_SOURCES } from "@shared/indexBacktestPro";

const IndexBacktesterPage = () => {
  // Product terms are the user's inputs; the defaults are an example, not a carrier's current terms.
  const [startYear, setStartYear] = useState(2006);
  const [years, setYears] = useState(20);
  const [capPct, setCapPct] = useState(10);
  const [uncapped, setUncapped] = useState(false);
  const [floorPct, setFloorPct] = useState(0);
  const [participationPct, setParticipationPct] = useState(100);
  const [spreadPct, setSpreadPct] = useState(0);
  const [initial, setInitial] = useState(100_000);
  const [annualDeposit, setAnnualDeposit] = useState(0);

  const result = useMemo(() => runBacktestPro({
    startYear, years, initial, annualDeposit,
    terms: { capPct: uncapped ? null : capPct, floorPct, participationPct, spreadPct },
  }), [startYear, years, initial, annualDeposit, capPct, uncapped, floorPct, participationPct, spreadPct]);

  // Cap sensitivity: the same window at a range of caps, all else equal.
  const capSweep = useMemo(() => [6, 8, 10, 12, 14].map(c => ({
    cap: `${c}%`,
    geometric: runBacktestPro({ startYear, years, initial: 1, annualDeposit: 0, terms: { capPct: c, floorPct, participationPct, spreadPct } }).geometricCreditedPct ?? 0,
  })), [startYear, years, floorPct, participationPct, spreadPct]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-white">Index Backtester</h1>
        <p className="mb-6 text-slate-400">Annual point-to-point indexed crediting on the S&amp;P 500 price return, {BACKTEST_FIRST_YEAR}–{BACKTEST_LAST_YEAR}. Change a term and the whole backtest reruns.</p>

        <Panel title="Window and deposits">
          <div className="grid gap-4 md:grid-cols-4">
            <NumberField label="Start year" value={startYear} min={BACKTEST_FIRST_YEAR} max={BACKTEST_LAST_YEAR} onChange={setStartYear} testId="bt-start" />
            <NumberField label="Years" value={years} min={1} max={32} onChange={setYears} testId="bt-years" />
            <NumberField label="Opening deposit" value={initial} step={1000} onChange={setInitial} />
            <NumberField label="Deposit each year" value={annualDeposit} step={1000} onChange={setAnnualDeposit} />
          </div>
        </Panel>

        <Panel title="Crediting terms (your inputs — use the product's current terms)">
          <div className="grid gap-4 md:grid-cols-5">
            <NumberField label="Cap" suffix="%" value={capPct} step={0.25} onChange={setCapPct} testId="bt-cap" />
            <div className="pt-6"><Toggle label="Uncapped" checked={uncapped} onChange={setUncapped} /></div>
            <NumberField label="Floor" suffix="%" value={floorPct} step={0.25} onChange={setFloorPct} />
            <NumberField label="Participation" suffix="%" value={participationPct} step={5} onChange={setParticipationPct} />
            <NumberField label="Spread" suffix="%" value={spreadPct} step={0.25} onChange={setSpreadPct} />
          </div>
        </Panel>

        {result.unavailableYears.length > 0 && (
          <p className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            No sourced index return for {result.unavailableYears.join(", ")}; those years are left out, not credited at zero.
          </p>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Stat label="Ending indexed value" value={usd(result.endingValue)} tone="good" testId="bt-ending" sub={`Deposits ${usd(result.deposits)}`} />
          <Stat label="Same deposits in the index" value={usd(result.endingIndexValue)} sub="Price return, no dividends" />
          <Stat label="Geometric credited rate" value={result.geometricCreditedPct == null ? "—" : `${result.geometricCreditedPct.toFixed(2)}%`} sub={`Index: ${result.geometricIndexPct == null ? "—" : `${result.geometricIndexPct.toFixed(2)}%`}`} />
          <Stat label="Years at cap / at floor" value={`${result.capYears} / ${result.floorYears}`} sub={`of ${result.rows.length}`} />
        </div>

        <Panel title="Account value vs. the index">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={result.rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={v => `$${Math.round(Number(v) / 1000)}k`} />
              <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f" }} />
              <Legend />
              <Line type="monotone" dataKey="accountValue" name="Indexed account" stroke="#22c55e" dot={false} />
              <Line type="monotone" dataKey="indexValue" name="S&P 500 price return" stroke="#60a5fa" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <Panel title="Year by year: index vs. credited">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={result.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="%" />
                <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f" }} />
                <Legend />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="indexPriceReturnPct" name="Index price return %" fill="#60a5fa" />
                <Bar dataKey="creditedPct" name="Credited %" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Cap sensitivity (same window and terms)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={capSweep}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="cap" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="%" />
                <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f" }} />
                <Bar dataKey="geometric" name="Geometric credited %" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <ProvenanceSources sources={INDEX_BACKTEST_PRO_SOURCES} disclosure="Backtests apply today's chosen terms to past index returns; carriers change caps and participation over time, so this is not what any policy credited. Past performance does not predict future results. Russell Capital Systems provides tools for life and annuity agents." />
      </div>
    </div>
  );
};

export default IndexBacktesterPage;
