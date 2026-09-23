// A25 (2026-09-23): /portal/divorce-recovery now computes. Before: one unbound
// "Total Assets" box, two sliders that only echoed themselves, "Placeholder:
// Outcome Chart", and a 50-year grid printing the text "[Asset Protection]".
// Math: shared/divorceRecovery.ts (test: server/a25Calculators.test.ts).
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { NumberField, SelectField, Stat, Panel, Notes, ProvenanceSources, usd, pct } from "@/components/calc/CalcKit";
import { computeDivorceRecovery, DIVORCE_RECOVERY_SOURCES, type MaritalAsset, type MaritalAssetKind } from "@shared/divorceRecovery";
import { allStateCodes } from "@shared/divorceStateRules";

const KINDS: { value: MaritalAssetKind; label: string }[] = [
  { value: "cash", label: "Cash / savings" },
  { value: "taxable", label: "Taxable brokerage" },
  { value: "pretax", label: "Pre-tax 401(k) / IRA" },
  { value: "roth", label: "Roth account" },
  { value: "home", label: "Home" },
];

// Example inputs so the page opens with a worked case; every one is editable.
const EXAMPLE_ASSETS: MaritalAsset[] = [
  { id: "a1", label: "Joint savings", kind: "cash", value: 150_000, clientShare: 0.5 },
  { id: "a2", label: "401(k)", kind: "pretax", value: 600_000, clientShare: 0.5 },
  { id: "a3", label: "Brokerage", kind: "taxable", value: 300_000, basis: 180_000, clientShare: 0.5 },
  { id: "a4", label: "Home", kind: "home", value: 900_000, basis: 400_000, debt: 350_000, clientShare: 0.5 },
];

const DivorceCalculatorPage = () => {
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [state, setState] = useState("CA");
  const [assets, setAssets] = useState<MaritalAsset[]>(EXAMPLE_ASSETS);
  const [otherDebts, setOtherDebts] = useState(40_000);
  const [debtSharePct, setDebtSharePct] = useState(50);
  const [clientIncome, setClientIncome] = useState(120_000);
  const [filing, setFiling] = useState<"single" | "hoh">("single");
  const [returnPct, setReturnPct] = useState(5);
  const [annualSavings, setAnnualSavings] = useState(20_000);
  const [horizon, setHorizon] = useState(30);
  const [target, setTarget] = useState(0);

  const result = useMemo(() => computeDivorceRecovery({
    state, assets, otherDebts, clientDebtShare: debtSharePct / 100, clientIncome, filing,
    assumedReturn: returnPct / 100, annualSavings, horizonYears: horizon, recoveryTarget: target > 0 ? target : undefined,
  }), [state, assets, otherDebts, debtSharePct, clientIncome, filing, returnPct, annualSavings, horizon, target]);

  const update = (id: string, patch: Partial<MaritalAsset>) => setAssets(as => as.map(a => (a.id === id ? { ...a, ...patch } : a)));
  const milestones = [5, 10, 20, 30, 50].filter(y => y <= horizon);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-white">Divorce Recovery Planner</h1>
        <p className="mb-6 text-slate-400">What the client actually keeps after the embedded tax in each asset, and how long it takes to rebuild. Change any input and every figure recomputes.</p>

        <div className="mb-8 overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-[#0c1425] to-[#111827]">
          <button onClick={() => setVideoExpanded(!videoExpanded)} className="flex w-full items-center justify-between px-6 py-4 hover:bg-white/5">
            <div className="text-left">
              <h2 className="text-lg font-bold text-white">Watch: Why This Calculator Matters</h2>
              <p className="text-sm text-slate-400">2-minute explainer — how IUL, ILIT and fixed annuities protect assets in divorce</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">2:29</span>
          </button>
          {videoExpanded && (
            <div className="px-6 pb-6">
              <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "16/9" }}>
                <video controls className="h-full w-full object-contain" preload="metadata">
                  <source src="/files/divorce_calculator_explainer_3a588ea7.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          )}
        </div>

        <Panel title="State and assets (example inputs — replace with the client's)">
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <SelectField label="State" value={state} onChange={setState} options={allStateCodes().map(c => ({ value: c, label: c }))} testId="divorce-state" />
            <NumberField label="Unsecured marital debt" value={otherDebts} step={1000} onChange={setOtherDebts} />
            <NumberField label="Client's share of that debt" suffix="%" value={debtSharePct} onChange={setDebtSharePct} />
          </div>
          <p className="mb-4 text-sm text-slate-400">{result.stateBasis}</p>
          {assets.map(a => (
            <div key={a.id} className="mb-3 grid grid-cols-2 gap-3 border-b border-[#1e3a5f] pb-3 md:grid-cols-6">
              <label className="block text-sm"><span className="text-slate-300">Asset</span>
                <input value={a.label} onChange={e => update(a.id, { label: e.target.value })} className="mt-1 w-full rounded-md border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-white" />
              </label>
              <SelectField label="Type" value={a.kind} options={KINDS} onChange={k => update(a.id, { kind: k })} />
              <NumberField label="Value" value={a.value} step={1000} onChange={n => update(a.id, { value: n })} testId={`divorce-asset-${a.id}`} />
              {a.kind === "taxable" || a.kind === "home" ? <NumberField label="Cost basis" value={a.basis ?? 0} step={1000} onChange={n => update(a.id, { basis: n })} /> : <div />}
              {a.kind === "home" ? <NumberField label="Mortgage" value={a.debt ?? 0} step={1000} onChange={n => update(a.id, { debt: n })} /> : <div />}
              <NumberField label="Client's share" suffix="%" value={Math.round(a.clientShare * 100)} onChange={n => update(a.id, { clientShare: n / 100 })} testId={`divorce-share-${a.id}`} />
            </div>
          ))}
          <button type="button" onClick={() => setAssets(as => [...as, { id: `a${Date.now()}`, label: "New asset", kind: "cash", value: 0, clientShare: 0.5 }])} className="rounded-md bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">Add asset</button>
        </Panel>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Stat label="Net marital estate" value={usd(result.netMaritalEstate)} />
          <Stat label="Client's share (face value)" value={usd(result.clientNominal)} sub={`${pct(result.clientShareOfEstate)} of the estate${result.presumptiveShare != null ? " · community property starts at 50%" : " · no statutory ratio in this state"}`} />
          <Stat label="Embedded tax in that share" value={usd(result.embeddedTax)} tone="bad" sub={`Client marginal rate ${pct(result.marginalOrdinaryRate, 0)}`} />
          <Stat label="Client's share after tax" value={usd(result.clientAfterTax)} tone="good" testId="divorce-after-tax" />
        </div>

        <Panel title="Asset by asset">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400"><tr><th>Asset</th><th>Equity</th><th>Client equity</th><th>Embedded tax</th><th>After tax</th></tr></thead>
            <tbody>{result.assets.map(a => <tr key={a.id} className="border-t border-[#1e3a5f]"><td>{a.label}</td><td>{usd(a.equity)}</td><td>{usd(a.clientEquity)}</td><td>{usd(a.embeddedTax)}</td><td>{usd(a.clientAfterTax)}</td></tr>)}</tbody>
          </table>
        </Panel>

        <Panel title="Recovery projection (client's own assumptions)">
          <div className="mb-4 grid gap-4 md:grid-cols-5">
            <NumberField label="Client income after divorce" value={clientIncome} step={1000} onChange={setClientIncome} />
            <SelectField label="Filing status after" value={filing} onChange={setFiling} options={[{ value: "single", label: "Single" }, { value: "hoh", label: "Head of household" }]} />
            <NumberField label="Assumed annual return" suffix="%" value={returnPct} step={0.1} onChange={setReturnPct} testId="divorce-return" />
            <NumberField label="Annual savings" value={annualSavings} step={1000} onChange={setAnnualSavings} />
            <NumberField label="Recovery target (0 = pre-divorce estate)" value={target} step={10000} onChange={setTarget} />
          </div>
          <label className="mb-4 flex items-center gap-4 text-sm text-slate-400">Horizon
            <input type="range" min={1} max={50} value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="flex-1 accent-emerald-500" />
            <span className="w-16 text-center text-lg font-bold text-emerald-400">{horizon} yrs</span>
          </label>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={result.projection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={v => `$${(Number(v) / 1e6).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f" }} />
              <ReferenceLine y={result.recoveryTarget} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Target", fill: "#f59e0b" }} />
              <Line type="monotone" dataKey="netWorth" stroke="#34d399" dot={false} name="Client net worth" />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-sm text-slate-300" data-testid="divorce-years-to-recover">
            {result.yearsToRecover == null ? `Target of ${usd(result.recoveryTarget)} not reached within ${horizon} years on these assumptions.` : `Reaches ${usd(result.recoveryTarget)} in year ${result.yearsToRecover}.`}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center md:grid-cols-5">
            {milestones.map(y => (
              <div key={y} className="rounded-lg bg-[#1e293b] p-3">
                <div className="text-xs text-slate-500">Year {y}</div>
                <div className="text-lg font-bold text-emerald-400">{usd(result.projection[y]?.netWorth)}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Notes notes={result.notes} />
        <ProvenanceSources sources={DIVORCE_RECOVERY_SOURCES} disclosure={`Division rules version ${result.rulesVersion}. Educational estimate, not legal or tax advice. Property division, support and QDRO terms are set by the court or the settlement — consult counsel and a CPA in the client's state.`} />
      </div>
    </div>
  );
};

export default DivorceCalculatorPage;
