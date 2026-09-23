// A25 (2026-09-23): /portal/estate-planning now computes. Before: uncontrolled inputs,
// "Placeholder: Estimated Tax Exposure - $1.2M", a made-up "Page Insights Score: 92/100",
// and a 50-year grid printing the literal text "[Estate Value]".
// Math: shared/estateProjection.ts (test: server/a25Calculators.test.ts).
import { useMemo, useState } from "react";
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { NumberField, Toggle, Stat, Panel, Notes, ProvenanceSources, usd } from "@/components/calc/CalcKit";
import { projectEstate, ESTATE_PROJECTION_SOURCES } from "@shared/estateProjection";

const START_YEAR = 2026;

const EstatePlanningPage = () => {
  // Example inputs so the page opens with a worked case; every one is editable.
  const [estateValue, setEstateValue] = useState(20_000_000);
  const [growthPct, setGrowthPct] = useState(4);
  const [horizon, setHorizon] = useState(30);
  const [married, setMarried] = useState(false);
  const [charitable, setCharitable] = useState(0);
  const [ilit, setIlit] = useState(0);
  const [giftPerDonee, setGiftPerDonee] = useState(19_000);
  const [donees, setDonees] = useState(0);
  const [giftYears, setGiftYears] = useState(10);
  const [priorGifts, setPriorGifts] = useState(0);

  const result = useMemo(() => projectEstate({
    startYear: START_YEAR, estateValue, growthRate: growthPct / 100, horizonYears: horizon, married,
    charitableBequest: charitable, ilitDeathBenefit: ilit, annualGiftPerDonee: giftPerDonee, donees, giftYears, priorTaxableGifts: priorGifts,
  }), [estateValue, growthPct, horizon, married, charitable, ilit, giftPerDonee, donees, giftYears, priorGifts]);

  const milestones = [5, 10, 20, 30, 50].filter(y => y <= horizon).map(y => result.rows[y]!).filter(Boolean);
  const giftSaving = result.atHorizon.estateTaxWithoutGifting - result.atHorizon.estateTax;

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-white">Estate Planning</h1>
        <p className="mb-6 text-slate-400">Federal estate tax today and at any horizon, with gifting, a marital/portability election, charitable bequests and an ILIT. Every figure recomputes from the inputs.</p>

        <Panel title="Estate (example inputs — replace with the client's)">
          <div className="grid gap-4 md:grid-cols-4">
            <NumberField label="Estate value today" value={estateValue} step={100_000} onChange={setEstateValue} testId="estate-value" />
            <NumberField label="Assumed annual growth" suffix="%" value={growthPct} step={0.1} onChange={setGrowthPct} testId="estate-growth" hint="Client assumption" />
            <NumberField label="Charitable bequest" value={charitable} step={10_000} onChange={setCharitable} />
            <NumberField label="ILIT-owned death benefit" value={ilit} step={100_000} onChange={setIlit} hint="Outside the estate" />
            <NumberField label="Taxable gifts already made" value={priorGifts} step={10_000} onChange={setPriorGifts} />
            <div className="pt-6"><Toggle label="Married (survivor keeps spouse's unused exclusion)" checked={married} onChange={setMarried} /></div>
          </div>
        </Panel>

        <Panel title="Annual gifting">
          <div className="grid gap-4 md:grid-cols-3">
            <NumberField label="Gift per donee per year" value={giftPerDonee} step={1000} onChange={setGiftPerDonee} hint={`${START_YEAR} annual exclusion: ${usd(result.annualExclusionUsed)}`} testId="estate-gift" />
            <NumberField label="Number of donees" value={donees} min={0} onChange={setDonees} testId="estate-donees" />
            <NumberField label="Years of gifting" value={giftYears} min={0} onChange={setGiftYears} />
          </div>
        </Panel>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Stat label={`Estate tax if death in ${START_YEAR}`} value={usd(result.today.estateTax)} tone="bad" testId="estate-tax-today" sub={`Exclusion ${usd(result.today.exclusion)}`} />
          <Stat label={`Estate tax in ${result.atHorizon.year}`} value={usd(result.atHorizon.estateTax)} tone="bad" testId="estate-tax-horizon" sub={`Gross estate ${usd(result.atHorizon.grossEstate)}`} />
          <Stat label="Tax saved by gifting" value={usd(giftSaving)} tone="good" sub={`${usd(result.atHorizon.cumulativeGiftsOut)} given`} />
          <Stat label="Net to heirs at horizon" value={usd(result.atHorizon.netToHeirs)} sub="After tax; incl. ILIT and gifts" />
        </div>

        <Panel title="Projection">
          <label className="mb-4 flex items-center gap-4 text-sm text-slate-400">Horizon
            <input type="range" min={1} max={50} value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="flex-1 accent-emerald-500" data-testid="estate-horizon" />
            <span className="w-16 text-center text-lg font-bold text-emerald-400">{horizon} yrs</span>
          </label>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={result.rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={v => `$${(Number(v) / 1e6).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f" }} />
              <Legend />
              <Area type="monotone" dataKey="grossEstate" name="Gross estate" stroke="#34d399" fill="#34d399" fillOpacity={0.2} />
              <Area type="monotone" dataKey="estateTax" name="Estate tax" stroke="#f87171" fill="#f87171" fillOpacity={0.3} />
              <Line type="monotone" dataKey="exclusion" name="Exclusion" stroke="#f59e0b" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center md:grid-cols-5">
            {milestones.map(r => (
              <div key={r.year} className="rounded-lg bg-[#1e293b] p-3">
                <div className="text-xs text-slate-500">Year {r.yearsFromNow} ({r.year})</div>
                <div className="text-lg font-bold text-emerald-400">{usd(r.grossEstate)}</div>
                <div className="text-xs text-rose-300">tax {usd(r.estateTax)}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Notes notes={result.notes} />
        <div className="mb-6 flex gap-2">
          <a href="/portal/ai-assist" className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/30">Send to AI Advisor →</a>
          <a href="/portal/estate-tax" className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/30">Detailed estate tax calculator →</a>
        </div>
        <ProvenanceSources sources={ESTATE_PROJECTION_SOURCES} disclosure="Russell Capital Systems provides tools for life and annuity agents. Federal estate tax only; state estate and inheritance taxes are not included. Estimates, not guarantees — consult legal and tax professionals." />
      </div>
    </div>
  );
};

export default EstatePlanningPage;
