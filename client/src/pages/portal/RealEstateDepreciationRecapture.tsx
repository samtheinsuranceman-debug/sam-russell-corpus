// A25 (2026-09-23): sale price, disposition, boot and state rate now drive the result.
// Before: "recapture" was depreciation × 25% shown as a gain, the timeline was four
// fixed points, and the installment / 1031 / boot controls reached nothing.
// Math: shared/depreciationRecapture.ts (test: server/a25Calculators.test.ts).
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Building, Calculator, Plus, Trash2 } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";
import { NumberField, SelectField, Toggle, Stat, Panel, Notes, ProvenanceSources, usd } from "@/components/calc/CalcKit";
import { computeRecapture, DEPRECIATION_RECAPTURE_SOURCES, type Disposition, type RecaptureProperty, type RecaptureClass } from "@shared/depreciationRecapture";
import type { FilingKey } from "@shared/taxRules";

// Example inputs so the page opens with a worked case; every one is editable.
const EXAMPLE: RecaptureProperty[] = [
  { id: "p1", name: "Rental building", recaptureClass: "1250", costBasis: 1_000_000, accumulatedDepreciation: 300_000, salePrice: 1_200_000, sellingCosts: 60_000 },
];

export default function RealEstateDepreciationRecapture() {
  const [properties, setProperties] = useState<RecaptureProperty[]>(EXAMPLE);
  const [filing, setFiling] = useState<FilingKey>("joint");
  const [otherTaxableIncome, setOtherTaxableIncome] = useState(200_000);
  const [otherMagi, setOtherMagi] = useState(232_200);
  const [disposition, setDisposition] = useState<Disposition>("sale");
  const [installmentShare, setInstallmentShare] = useState(20);
  const [boot, setBoot] = useState(0);
  const [statePct, setStatePct] = useState(5);
  const [niitApplies, setNiitApplies] = useState(true);

  const result = useMemo(() => computeRecapture({
    properties, filing, otherTaxableIncome,
    otherMagi,
    disposition, installmentFirstYearShare: installmentShare / 100, boot, stateRate: statePct / 100, niitApplies,
  }), [properties, filing, otherTaxableIncome, otherMagi, disposition, installmentShare, boot, statePct, niitApplies]);

  const update = (id: string, patch: Partial<RecaptureProperty>) => setProperties(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
  const chart = result.properties.map(p => ({ name: p.name, "§1245 ordinary": p.recognized.ordinary, "Unrecaptured §1250": p.recognized.unrecaptured1250, "§1231 gain": p.recognized.section1231, Deferred: p.deferred }));

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-white"><Building className="h-8 w-8 text-emerald-400" /> Depreciation Recapture Calculator</h1>
        <p className="mb-6 text-slate-400">Gain, its character and the tax on disposing of depreciated property, tax year {result.taxYear}. Every figure recomputes from the inputs below.</p>

        <Panel title="Properties (example inputs — replace with your own)">
          {properties.map(p => (
            <div key={p.id} className="mb-4 grid grid-cols-2 gap-3 border-b border-[#1e3a5f] pb-4 md:grid-cols-7">
              <label className="block text-sm"><span className="text-slate-300">Name</span>
                <input value={p.name} onChange={e => update(p.id, { name: e.target.value })} className="mt-1 w-full rounded-md border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-white" />
              </label>
              <SelectField<RecaptureClass> label="Class" value={p.recaptureClass} onChange={v => update(p.id, { recaptureClass: v })} options={[{ value: "1250", label: "§1250 real property" }, { value: "1245", label: "§1245 personal property" }]} />
              <NumberField label="Cost + improvements" value={p.costBasis} step={1000} onChange={n => update(p.id, { costBasis: n })} />
              <NumberField label="Depreciation taken" value={p.accumulatedDepreciation} step={1000} onChange={n => update(p.id, { accumulatedDepreciation: n })} testId="recapture-depreciation" />
              <NumberField label="Sale price" value={p.salePrice} step={1000} onChange={n => update(p.id, { salePrice: n })} testId="recapture-sale-price" />
              <NumberField label="Selling costs" value={p.sellingCosts} step={500} onChange={n => update(p.id, { sellingCosts: n })} />
              <button type="button" onClick={() => setProperties(ps => ps.filter(x => x.id !== p.id))} className="mt-6 flex items-center justify-center gap-1 rounded-md bg-slate-800 p-2 text-sm text-slate-300"><Trash2 className="h-4 w-4" /> Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setProperties(ps => [...ps, { id: `p${Date.now()}`, name: "New property", recaptureClass: "1250", costBasis: 0, accumulatedDepreciation: 0, salePrice: 0, sellingCosts: 0 }])} className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300"><Plus className="h-4 w-4" /> Add property</button>
        </Panel>

        <Panel title="Return and disposition" icon={<Calculator className="h-5 w-5 text-emerald-400" />}>
          <div className="grid gap-4 md:grid-cols-4">
            <SelectField<FilingKey> label="Filing status" value={filing} onChange={setFiling} options={[{ value: "single", label: "Single" }, { value: "joint", label: "Married filing jointly" }, { value: "hoh", label: "Head of household" }, { value: "separate", label: "Married filing separately" }]} />
            <NumberField label="Other taxable income" value={otherTaxableIncome} step={1000} onChange={setOtherTaxableIncome} hint="After deductions, before the sale" />
            <NumberField label="Modified AGI before the sale" value={otherMagi} step={1000} onChange={setOtherMagi} hint="For the NIIT threshold" />
            <SelectField<Disposition> label="Disposition" value={disposition} onChange={setDisposition} testId="recapture-disposition" options={[{ value: "sale", label: "Outright sale" }, { value: "installment", label: "Installment sale" }, { value: "exchange1031", label: "§1031 exchange" }]} />
            <NumberField label="State income-tax rate" suffix="%" value={statePct} step={0.1} onChange={setStatePct} testId="recapture-state-rate" />
            {disposition === "installment" && <NumberField label="Price received in year of sale" suffix="%" value={installmentShare} min={0} max={100} onChange={setInstallmentShare} />}
            {disposition === "exchange1031" && <NumberField label="Boot received" value={boot} step={1000} onChange={setBoot} hint="Cash or non-like-kind property" />}
            <div className="md:col-span-2 pt-6"><Toggle label="Gain is net investment income (3.8% NIIT)" checked={niitApplies} onChange={setNiitApplies} /></div>
          </div>
        </Panel>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Stat label="Recognised gain" value={usd(result.totals.recognized)} sub={`Deferred: ${usd(result.totals.deferred)}`} />
          <Stat label="Federal tax on the sale" value={usd(result.federal.total)} tone="bad" testId="recapture-federal" sub={`incl. NIIT ${usd(result.federal.niit)}`} />
          <Stat label="State tax" value={usd(result.stateTax)} />
          <Stat label="Total tax" value={usd(result.totalTax)} tone="bad" testId="recapture-total" />
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Stat label="§1245 ordinary recapture tax" value={usd(result.federal.ordinaryTax)} sub="Ordinary rates" />
          <Stat label="Unrecaptured §1250 tax" value={usd(result.federal.unrecaptured1250Tax)} sub="Ordinary rates, max 25%" />
          <Stat label="§1231 gain tax" value={usd(result.federal.section1231Tax)} sub="0% / 15% / 20%" />
        </div>

        <Panel title="Character of the gain, by property">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="name" stroke="#7a95b8" />
              <YAxis stroke="#7a95b8" tickFormatter={v => `$${Math.round(Number(v) / 1000)}k`} />
              <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ backgroundColor: "#0d1526", border: "1px solid #1e3a5f" }} />
              <Legend />
              <Bar dataKey="§1245 ordinary" stackId="a" fill="#f87171" />
              <Bar dataKey="Unrecaptured §1250" stackId="a" fill="#f59e0b" />
              <Bar dataKey="§1231 gain" stackId="a" fill="#34d399" />
              <Bar dataKey="Deferred" stackId="a" fill="#475569" />
            </BarChart>
          </ResponsiveContainer>
          {result.properties.flatMap(p => p.notes.map((n, i) => <p key={`${p.id}-${i}`} className="mt-2 text-sm text-slate-400">{p.name}: {n}</p>))}
        </Panel>

        <Notes notes={result.notes} />
        <ProvenanceSources sources={DEPRECIATION_RECAPTURE_SOURCES} disclosure="Educational estimate, tax year 2026. Not tax advice; §1231 netting, passive-loss carryovers and state rules can change the answer — confirm with a CPA." />
      </div>
      <PageInsights pageId="real-estate-depreciation-recapture" />
    </div>
  );
}
