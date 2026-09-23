// A25 (2026-09-23): every input is now live and every figure computed. Before: the
// income and deduction inputs were readOnly, the filing-status and state selects were
// unbound, and "Current Tax $335.4K / Optimized $199.4K / Savings $136K", the waterfall
// and the ten-year line were typed-in constants.
// Math: shared/taxStrategyOptimizer.ts (test: server/a25Calculators.test.ts).
import { useMemo, useState } from "react";
import { Calculator, DollarSign, Target, Layers } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { PageInsights } from "@/components/PageInsights";
import { NumberField, SelectField, Toggle, Stat, Panel, Notes, ProvenanceSources, usd, pct } from "@/components/calc/CalcKit";
import { optimizeTaxes, TAX_OPTIMIZER_SOURCES } from "@shared/taxStrategyOptimizer";
import { getStateCodes } from "@shared/taxBracketEngine";
import type { FilingKey } from "@shared/taxRules";

const COLORS = ["#f97316", "#10b981", "#ef4444", "#6366f1"];

export default function TaxStrategyOptimizer() {
  // Example inputs so the page opens with a worked case; every one is editable.
  const [taxYear, setTaxYear] = useState<"2025" | "2026">("2026");
  const [filing, setFiling] = useState<FilingKey>("joint");
  const [age, setAge] = useState(50);
  const [stateCode, setStateCode] = useState("CA");
  const [wages, setWages] = useState(400_000);
  const [businessIncome, setBusinessIncome] = useState(150_000);
  const [isSSTB, setIsSSTB] = useState(true);
  const [rentalIncome, setRentalIncome] = useState(40_000);
  const [rep, setRep] = useState(false);
  const [otherIncome, setOtherIncome] = useState(10_000);
  const [itemizedOther, setItemizedOther] = useState(25_000);
  const [saltPaid, setSaltPaid] = useState(45_000);
  const [k401, setK401] = useState(0);
  const [charity, setCharity] = useState(0);
  const [costSeg, setCostSeg] = useState(0);
  const [roth, setRoth] = useState(0);

  const result = useMemo(() => optimizeTaxes({
    taxYear: Number(taxYear) as 2025 | 2026, filing, age, stateCode, wages, businessIncome, businessIsSSTB: isSSTB,
    rentalIncome, realEstateProfessional: rep, otherOrdinaryIncome: otherIncome, itemizedOther, saltPaid,
    strategies: { pretax401k: k401, charitableCash: charity, costSegDepreciation: costSeg, rothConversion: roth },
  }), [taxYear, filing, age, stateCode, wages, businessIncome, isSSTB, rentalIncome, rep, otherIncome, itemizedOther, saltPaid, k401, charity, costSeg, roth]);

  const pie = (b: typeof result.baseline) => [
    { name: "Federal income", value: b.federalIncomeTax },
    { name: "State", value: b.stateTax },
    { name: "FICA (wages)", value: b.ficaWages },
    { name: "Self-employment", value: b.selfEmploymentTax },
  ].filter(x => x.value > 0);

  const waterfall = [
    { name: "Baseline", value: result.baseline.total },
    ...result.steps.map(s => ({ name: s.label, value: -s.saving })),
    { name: "Optimized", value: result.optimized.total },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-4 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center text-3xl font-bold text-white"><Calculator className="mr-2 text-emerald-500" /> Tax Strategy Optimizer</h1>
          <div className="w-40"><SelectField label="Tax year" value={taxYear} onChange={setTaxYear} options={[{ value: "2025", label: "2025" }, { value: "2026", label: "2026" }]} testId="taxopt-year" /></div>
        </div>

        <Panel title="The return (example inputs — replace with the client's)" icon={<DollarSign className="h-5 w-5 text-orange-500" />}>
          <div className="grid gap-4 md:grid-cols-4">
            <SelectField label="Filing status" value={filing} onChange={setFiling} testId="taxopt-filing" options={[{ value: "single", label: "Single" }, { value: "joint", label: "Married filing jointly" }, { value: "hoh", label: "Head of household" }, { value: "separate", label: "Married filing separately" }]} />
            <SelectField label="State" value={stateCode} onChange={setStateCode} options={getStateCodes().map(c => ({ value: c, label: c }))} testId="taxopt-state" />
            <NumberField label="Age" value={age} min={18} max={100} onChange={setAge} />
            <NumberField label="W-2 wages" value={wages} step={1000} onChange={setWages} testId="taxopt-wages" />
            <NumberField label="Self-employment profit" value={businessIncome} step={1000} onChange={setBusinessIncome} />
            <div className="pt-6"><Toggle label="Specified service business (§199A)" checked={isSSTB} onChange={setIsSSTB} /></div>
            <NumberField label="Net rental income" value={rentalIncome} step={1000} onChange={setRentalIncome} />
            <div className="pt-6"><Toggle label="Real estate professional (§469(c)(7))" checked={rep} onChange={setRep} /></div>
            <NumberField label="Other ordinary income" value={otherIncome} step={1000} onChange={setOtherIncome} />
            <NumberField label="Itemized deductions (excl. SALT, charity)" value={itemizedOther} step={1000} onChange={setItemizedOther} />
            <NumberField label="State and local taxes paid" value={saltPaid} step={1000} onChange={setSaltPaid} />
          </div>
        </Panel>

        <Panel title="Strategies" icon={<Layers className="h-5 w-5 text-emerald-500" />}>
          <div className="grid gap-4 md:grid-cols-4">
            <NumberField label="Pre-tax 401(k) deferral" value={k401} step={500} onChange={setK401} testId="taxopt-401k" />
            <NumberField label="Charitable cash gifts" value={charity} step={1000} onChange={setCharity} />
            <NumberField label="Cost-segregation depreciation" value={costSeg} step={1000} onChange={setCostSeg} />
            <NumberField label="Roth conversion" value={roth} step={1000} onChange={setRoth} />
          </div>
        </Panel>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Stat label="Current tax" value={usd(result.baseline.total)} tone="bad" testId="taxopt-baseline" sub={`Effective ${pct(result.baseline.effectiveRate)} · marginal ${pct(result.baseline.marginalRate, 0)}`} />
          <Stat label="With strategies" value={usd(result.optimized.total)} testId="taxopt-optimized" sub={`Effective ${pct(result.optimized.effectiveRate)}`} />
          <Stat label="Saving this year" value={usd(result.totalSaving)} tone={result.totalSaving >= 0 ? "good" : "bad"} testId="taxopt-saving" />
          <Stat label="State rate applied" value={pct(result.stateRate, 2)} sub={`${stateCode} top marginal rate, flat`} />
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {[{ label: "Current", b: result.baseline }, { label: "With strategies", b: result.optimized }].map(({ label, b }) => (
            <Panel key={label} title={`${label} tax by type`} icon={<Target className="h-5 w-5 text-orange-500" />}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pie(b)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={e => usd(Number(e.value))}>
                    {pie(b).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => usd(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400">AGI {usd(b.agi)} · {b.deductionMethod} deduction {usd(b.deduction)} · §199A {usd(b.qbiDeduction)} · taxable {usd(b.taxableIncome)}</p>
            </Panel>
          ))}
        </div>

        <Panel title="What each strategy changes (sequential)">
          {result.steps.length === 0 ? <p className="text-slate-400">Enter an amount for a strategy to see its effect.</p> : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={waterfall}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={v => `$${Math.round(Number(v) / 1000)}k`} />
                  <Tooltip formatter={(v: number) => usd(v)} />
                  <Bar dataKey="value" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
              <ul className="mt-4 space-y-2 text-sm">
                {result.steps.map(s => (
                  <li key={s.key} className="rounded bg-[#0a0f1a] p-3">
                    <span className="font-semibold">{s.label}</span> — {usd(s.amountApplied)} applied; {s.saving >= 0 ? "saves" : "costs"} <span className={s.saving >= 0 ? "text-emerald-400" : "text-rose-400"}>{usd(Math.abs(s.saving))}</span>
                    <span className="block text-xs text-slate-400">{s.authority}{s.note ? ` · ${s.note}` : ""}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Notes notes={result.notes} />
        <ProvenanceSources sources={TAX_OPTIMIZER_SOURCES} disclosure={`Rules version ${result.rulesVersion}. Educational estimate for one tax year; not tax advice. Confirm every strategy with a CPA before acting.`} />
      </div>
      <PageInsights pageId="tax-strategy-optimizer" />
    </div>
  );
}
