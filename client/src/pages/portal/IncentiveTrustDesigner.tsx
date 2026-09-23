// A25 (2026-09-23): the provisions now carry amounts and years that drive a real
// projection. Before: the 50-year chart was six fixed points, the radar scored the
// categories 80/70/90/85/75 from nothing, and the pie split them 30/25/20/15/10.
// Math: shared/incentiveTrust.ts (test: server/a25Calculators.test.ts).
import { useMemo, useState } from "react";
import { Award, Target, Shield, Users, CheckCircle2, TrendingUp, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area } from "recharts";
import { PageInsights } from "@/components/PageInsights";
import { NumberField, Toggle, Stat, Panel, Notes, ProvenanceSources, usd } from "@/components/calc/CalcKit";
import { projectIncentiveTrust, INCENTIVE_TRUST_SOURCES, type IncentiveProvision } from "@shared/incentiveTrust";

type Provision = IncentiveProvision & { condition: string };

const COLORS = ["#10B981", "#F59E0B", "#6366F1", "#EC4899", "#06b6d4", "#f97316"];

// Example inputs so the page opens with a worked case; every one is editable.
const EXAMPLE: Provision[] = [
  { id: "p1", category: "Education", annualAmount: 40_000, startYear: 1, endYear: 4, condition: "Enrolled full-time, GPA 3.0+" },
  { id: "p2", category: "Career", annualAmount: 25_000, startYear: 5, endYear: 10, condition: "Employed full-time" },
  { id: "p3", category: "Philanthropy", annualAmount: 10_000, startYear: 5, endYear: 30, condition: "Matched to documented charitable gifts" },
];

const COMPLIANCE = [
  ["utc411", "UTC §411 modification or termination"],
  ["utc814", "UTC §814 trustee discretion standards"],
  ["spendthrift", "State spendthrift-trust statute"],
  ["claflin", "Claflin doctrine (material purpose)"],
  ["feinberg", "In re Estate of Feinberg (conditions on beneficiaries)"],
  ["publicPolicy", "Public-policy limits on conditions"],
] as const;

export default function IncentiveTrustDesigner() {
  const [funding, setFunding] = useState(2_000_000);
  const [returnPct, setReturnPct] = useState(5);
  const [feePct, setFeePct] = useState(1);
  const [inflationPct, setInflationPct] = useState(2.5);
  const [years, setYears] = useState(50);
  const [provisions, setProvisions] = useState<Provision[]>(EXAMPLE);
  const [matchingPct, setMatchingPct] = useState(0);
  const [earnedIncome, setEarnedIncome] = useState(60_000);
  const [matchStart, setMatchStart] = useState(5);
  const [matchEnd, setMatchEnd] = useState(25);
  const [spendthrift, setSpendthrift] = useState(true);
  const [substanceAbuse, setSubstanceAbuse] = useState(false);
  const [trusteeGuidelines, setTrusteeGuidelines] = useState("");
  const [compliance, setCompliance] = useState<Record<string, boolean>>({});

  const result = useMemo(() => projectIncentiveTrust({
    funding, assumedReturn: returnPct / 100, trusteeFeeRate: feePct / 100, inflation: inflationPct / 100, years,
    provisions, matchingRate: matchingPct / 100, beneficiaryEarnedIncome: earnedIncome, matchingStartYear: matchStart, matchingEndYear: matchEnd,
  }), [funding, returnPct, feePct, inflationPct, years, provisions, matchingPct, earnedIncome, matchStart, matchEnd]);

  const update = (id: string, patch: Partial<Provision>) => setProvisions(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
  const balanceSeries = result.years.map(y => ({ year: y.year, balance: y.endBalance, distributed: y.totalDistributed }));

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-8 text-gray-100">
      <header className="mb-8">
        <h1 className="flex items-center text-3xl font-bold text-emerald-400"><Award className="mr-2" /> Incentive Trust Designer</h1>
        <p className="text-[#7a95b8]">Design incentive provisions and see what the trust can actually pay, year by year. Every figure recomputes from the inputs.</p>
      </header>

      <Panel title="Funding and assumptions (client's own)" icon={<TrendingUp className="h-5 w-5 text-amber-400" />}>
        <div className="grid gap-4 md:grid-cols-5">
          <NumberField label="Funding today" value={funding} step={50_000} onChange={setFunding} testId="trust-funding" />
          <NumberField label="Net annual return" suffix="%" value={returnPct} step={0.1} onChange={setReturnPct} testId="trust-return" />
          <NumberField label="Trustee fee" suffix="% of balance" value={feePct} step={0.05} onChange={setFeePct} />
          <NumberField label="Provision inflation" suffix="%/yr" value={inflationPct} step={0.1} onChange={setInflationPct} />
          <NumberField label="Years to project" value={years} min={1} max={50} onChange={setYears} />
        </div>
      </Panel>

      <Panel title="Incentive provisions (example — replace)" icon={<Target className="h-5 w-5 text-amber-400" />}>
        {provisions.map(p => (
          <div key={p.id} className="mb-3 grid grid-cols-2 gap-3 border-b border-[#1e3a5f] pb-3 md:grid-cols-6">
            <label className="block text-sm"><span className="text-slate-300">Category</span>
              <input value={p.category} onChange={e => update(p.id, { category: e.target.value })} className="mt-1 w-full rounded-md border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-white" />
            </label>
            <label className="col-span-2 block text-sm"><span className="text-slate-300">Condition (trigger)</span>
              <input value={p.condition} onChange={e => update(p.id, { condition: e.target.value })} className="mt-1 w-full rounded-md border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-white" />
            </label>
            <NumberField label="Annual amount (today's $)" value={p.annualAmount} step={1000} onChange={n => update(p.id, { annualAmount: n })} testId={`trust-amount-${p.id}`} />
            <NumberField label="From year" value={p.startYear} min={1} onChange={n => update(p.id, { startYear: n })} />
            <div className="flex items-end gap-2">
              <NumberField label="To year" value={p.endYear} min={1} onChange={n => update(p.id, { endYear: n })} />
              <button type="button" onClick={() => setProvisions(ps => ps.filter(x => x.id !== p.id))} className="mb-1 rounded-md bg-slate-800 p-2 text-slate-300" aria-label="Remove provision"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setProvisions(ps => [...ps, { id: `p${Date.now()}`, category: "Health", annualAmount: 0, startYear: 1, endYear: 10, condition: "" }])} className="flex items-center gap-1 rounded-md bg-amber-500/20 px-3 py-2 text-sm text-amber-300"><Plus className="h-4 w-4" /> Add provision</button>
      </Panel>

      <Panel title="Matching distribution program" icon={<Shield className="h-5 w-5 text-amber-400" />}>
        <div className="grid gap-4 md:grid-cols-4">
          <NumberField label="Trust matches" suffix="% of earned income" value={matchingPct} step={5} onChange={setMatchingPct} testId="trust-matching" />
          <NumberField label="Beneficiary earned income" value={earnedIncome} step={1000} onChange={setEarnedIncome} />
          <NumberField label="From year" value={matchStart} min={1} onChange={setMatchStart} />
          <NumberField label="To year" value={matchEnd} min={1} onChange={setMatchEnd} />
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <Toggle label="Spendthrift protection" checked={spendthrift} onChange={setSpendthrift} />
          <Toggle label="Substance-abuse provisions" checked={substanceAbuse} onChange={setSubstanceAbuse} />
        </div>
      </Panel>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label="Total distributed" value={usd(result.totalDistributed)} testId="trust-distributed" />
        <Stat label="Trustee fees" value={usd(result.totalFees)} />
        <Stat label={`Balance after year ${years}`} value={usd(result.endingBalance)} tone={result.endingBalance > 0 ? "good" : "bad"} testId="trust-ending" />
        <Stat label="Runs short in" value={result.depletedInYear == null ? "Never" : `Year ${result.depletedInYear}`} tone={result.depletedInYear == null ? "good" : "bad"} />
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Panel title="Trust balance and distributions">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={balanceSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="year" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={v => `$${(Number(v) / 1e6).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => usd(v)} />
              <Legend />
              <Area type="monotone" dataKey="balance" name="Balance" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              <Area type="monotone" dataKey="distributed" name="Distributed that year" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Distributions by category">
          {result.totalsByCategory.length === 0 ? <p className="text-slate-400">No distributions scheduled.</p> : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={result.totalsByCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={e => e.category}>
                  {result.totalsByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => usd(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel title="Distributions by category, total">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={result.totalsByCategory}>
            <XAxis dataKey="category" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={v => `$${Math.round(Number(v) / 1000)}k`} />
            <Tooltip formatter={(v: number) => usd(v)} />
            <Bar dataKey="total" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Notes notes={result.notes} />

      <Panel title="Trustee discretion guidelines" icon={<Users className="h-5 w-5 text-emerald-400" />}>
        <textarea value={trusteeGuidelines} onChange={e => setTrusteeGuidelines(e.target.value)} className="h-28 w-full rounded border border-[#1e3a5f] bg-[#0d1526] p-2 text-gray-100" placeholder="Define guidelines for trustee decisions..." />
      </Panel>

      <Panel title="Compliance and legal provisions to review with counsel" icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}>
        <div className="grid gap-3 md:grid-cols-2">
          {COMPLIANCE.map(([key, label]) => (
            <Toggle key={key} label={label} checked={!!compliance[key]} onChange={b => setCompliance(c => ({ ...c, [key]: b }))} />
          ))}
        </div>
      </Panel>

      <ProvenanceSources sources={INCENTIVE_TRUST_SOURCES} disclosure="Illustration on the client's own assumptions; not a forecast. Trust drafting, conditions and taxation require an estate-planning attorney." />
      <PageInsights pageId="incentive-trust-designer" />
    </div>
  );
}
