// A25 (2026-09-23): the lot method, staking and mining inputs now drive the result.
// Before: every chart was a fixed array and no input reached a number.
// Math: shared/cryptoTaxEngine.ts (test: server/a25Calculators.test.ts).
import { useMemo, useState } from "react";
import { DollarSign, Scale, Shield, Zap, AlertTriangle, Trash2, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageInsights } from "@/components/PageInsights";
import { NumberField, SelectField, Stat, Panel, Notes, ProvenanceSources, usd } from "@/components/calc/CalcKit";
import { computeCryptoTax, compareLotMethods, CRYPTO_TAX_SOURCES, type CryptoLot, type LotMethod } from "@shared/cryptoTaxEngine";
import type { FilingKey } from "@shared/taxRules";

const FILINGS: { value: FilingKey; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "joint", label: "Married filing jointly" },
  { value: "hoh", label: "Head of household" },
  { value: "separate", label: "Married filing separately" },
];

// Example inputs so the page opens with a worked case; every one is editable.
const EXAMPLE_LOTS: CryptoLot[] = [
  { id: "lot-1", acquired: "2024-01-10", quantity: 1, costPerUnit: 20_000 },
  { id: "lot-2", acquired: "2026-03-01", quantity: 1, costPerUnit: 60_000 },
];

export default function CryptoTaxStrategy() {
  const [filing, setFiling] = useState<FilingKey>("single");
  const [otherIncome, setOtherIncome] = useState(100_000);
  const [stakingIncome, setStakingIncome] = useState(0);
  const [miningIncome, setMiningIncome] = useState(0);
  const [method, setMethod] = useState<LotMethod>("FIFO");
  const [lots, setLots] = useState<CryptoLot[]>(EXAMPLE_LOTS);
  const [saleDate, setSaleDate] = useState("2026-09-01");
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState(70_000);
  const [saleFees, setSaleFees] = useState(0);

  const input = useMemo(() => ({
    filing, otherIncome, stakingIncome, miningIncome, lots, method,
    sale: saleQty > 0 ? { date: saleDate, quantity: saleQty, pricePerUnit: salePrice, fees: saleFees } : null,
  }), [filing, otherIncome, stakingIncome, miningIncome, lots, method, saleDate, saleQty, salePrice, saleFees]);
  const result = useMemo(() => computeCryptoTax(input), [input]);
  const comparison = useMemo(() => compareLotMethods(input), [input]);

  const updateLot = (id: string, patch: Partial<CryptoLot>) => setLots(ls => ls.map(l => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-amber-400"><DollarSign /> Crypto Tax Strategy</h1>
        <p className="mb-6 text-slate-400">Federal tax for tax year {result.taxYear} on one sale of a digital asset from your own lots, plus staking and mining income. Change any input and the result recomputes.</p>

        <Panel title="Your return" icon={<Shield className="h-5 w-5 text-amber-400" />}>
          <div className="grid gap-4 md:grid-cols-4">
            <SelectField label="Filing status" value={filing} options={FILINGS} onChange={setFiling} />
            <NumberField label="Other income (AGI before crypto)" value={otherIncome} onChange={setOtherIncome} step={1000} testId="crypto-other-income" />
            <NumberField label="Staking rewards" value={stakingIncome} onChange={setStakingIncome} step={100} hint="Ordinary income when received (Rev. Rul. 2023-14)" testId="crypto-staking" />
            <NumberField label="Mining rewards" value={miningIncome} onChange={setMiningIncome} step={100} hint="Ordinary income when received (Notice 2014-21)" testId="crypto-mining" />
          </div>
        </Panel>

        <Panel title="Lots held (example inputs — replace with your own)" icon={<Scale className="h-5 w-5 text-amber-400" />}>
          <div className="space-y-2">
            {lots.map(l => (
              <div key={l.id} className="grid grid-cols-2 items-end gap-3 md:grid-cols-4">
                <label className="block text-sm"><span className="text-slate-300">Acquired</span>
                  <input type="date" value={l.acquired} onChange={e => updateLot(l.id, { acquired: e.target.value })} className="mt-1 w-full rounded-md border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-white" />
                </label>
                <NumberField label="Quantity" value={l.quantity} step={0.01} onChange={n => updateLot(l.id, { quantity: n })} />
                <NumberField label="Cost per unit" value={l.costPerUnit} step={100} onChange={n => updateLot(l.id, { costPerUnit: n })} />
                <button type="button" onClick={() => setLots(ls => ls.filter(x => x.id !== l.id))} className="flex items-center gap-1 rounded-md bg-slate-800 p-2 text-sm text-slate-300 hover:bg-slate-700"><Trash2 className="h-4 w-4" /> Remove</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLots(ls => [...ls, { id: `lot-${Date.now()}`, acquired: saleDate, quantity: 0, costPerUnit: 0 }])} className="mt-3 flex items-center gap-1 rounded-md bg-amber-500/20 px-3 py-2 text-sm text-amber-300"><Plus className="h-4 w-4" /> Add lot</button>
        </Panel>

        <Panel title="The sale" icon={<Zap className="h-5 w-5 text-amber-400" />}>
          <div className="grid gap-4 md:grid-cols-5">
            <label className="block text-sm"><span className="text-slate-300">Sale date</span>
              <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="mt-1 w-full rounded-md border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-white" />
            </label>
            <NumberField label="Quantity sold" value={saleQty} step={0.01} onChange={setSaleQty} />
            <NumberField label="Price per unit" value={salePrice} step={100} onChange={setSalePrice} testId="crypto-sale-price" />
            <NumberField label="Selling fees" value={saleFees} step={10} onChange={setSaleFees} />
            <SelectField label="Lot method" value={method} onChange={setMethod} options={[{ value: "FIFO", label: "FIFO (default)" }, { value: "LIFO", label: "LIFO (specific ID)" }, { value: "HIFO", label: "HIFO (specific ID)" }]} testId="crypto-method" />
          </div>
        </Panel>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Stat label="Tax caused by crypto" value={usd(result.cryptoTax)} tone="bad" testId="crypto-tax-result" sub="Federal, vs. the same return with no crypto" />
          <Stat label="Short-term gain" value={usd(result.shortTermGain)} sub="Taxed at ordinary rates" />
          <Stat label="Long-term gain" value={usd(result.longTermGain)} sub="0% / 15% / 20%" />
          <Stat label="NIIT (3.8%)" value={usd(result.niit)} sub="On the capital gain only" />
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <Panel title="Same sale, each lot method">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="method" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={v => `$${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f" }} />
                <Bar dataKey="cryptoTax" name="Federal tax from crypto" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Crypto income by character">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={result.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={v => `$${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(v: number) => usd(v)} contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f" }} />
                <Bar dataKey="income" name="Amount" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <Panel title="Lots used in this sale">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400"><tr><th>Acquired</th><th>Qty</th><th>Basis</th><th>Proceeds</th><th>Gain</th><th>Term</th></tr></thead>
            <tbody>
              {result.lotsUsed.map(u => (
                <tr key={u.lotId} className="border-t border-[#1e3a5f]"><td>{u.acquired}</td><td>{u.quantity}</td><td>{usd(u.basis)}</td><td>{usd(u.proceeds)}</td><td>{usd(u.gain)}</td><td>{u.longTerm ? "Long" : "Short"}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Notes notes={result.notes} />

        <Panel title="Rules this page applies" icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Digital assets are property (Notice 2014-21): every sale or crypto-to-crypto trade realises gain or loss, reported on Form 8949 and Schedule D.</li>
            <li>§1031 like-kind exchanges have been limited to real property since 2018 (P.L. 115-97), so crypto-for-crypto trades are taxable.</li>
            <li>Long-term treatment needs a holding period of more than one year (IRC §1222); a sale on the anniversary is short-term.</li>
            <li>FIFO applies unless specific units are adequately identified (Treas. Reg. §1.1012-1(c), (j)); LIFO and HIFO here are specific identification in that order.</li>
            <li>The wash-sale rule (IRC §1091) names stock and securities; under current law it does not name digital assets.</li>
            <li>Net capital loss offsets up to $3,000 of ordinary income ($1,500 married filing separately); the rest carries forward.</li>
          </ul>
        </Panel>

        <ProvenanceSources sources={CRYPTO_TAX_SOURCES} disclosure="Educational estimate of federal income tax only; state tax and self-employment tax are not included. Not tax advice — confirm with a CPA before acting." />
      </div>
      <PageInsights pageId="crypto-tax-strategy" />
    </div>
  );
}
