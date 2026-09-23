import { useMemo, useState, type ReactNode } from "react";
import { Award, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Target, Users, Scale, Zap } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { PageInsights } from "@/components/PageInsights";

// ============================================================
// WEALTH TRANSFER SCORECARD
// A self-assessment. The visitor rates each dimension of the plan today and the
// score they are aiming for; the grade, the radar and the ranked gaps are computed
// from those ratings. The generation projection is a mechanic: estate value, an
// assumed net growth rate, years per generation and the share lost at each transfer
// are all set by the visitor. No score, dollar figure or rate is supplied by the page.
// ============================================================

type DimensionKey =
  | "estateTaxEfficiency"
  | "incomeTaxPlanning"
  | "generationSkipping"
  | "assetProtection"
  | "liquidity"
  | "charitableGiving"
  | "businessSuccession"
  | "familyGovernance";

type Rating = { current: number; target: number };

const DIMENSIONS: ReadonlyArray<{ key: DimensionKey; name: string; short: string; icon: ReactNode }> = [
  { key: "estateTaxEfficiency", name: "Estate Tax Efficiency", short: "Estate Tax", icon: <DollarSign className="text-emerald-400" size={24} /> },
  { key: "incomeTaxPlanning", name: "Income Tax Planning", short: "Income Tax", icon: <TrendingUp className="text-emerald-400" size={24} /> },
  { key: "generationSkipping", name: "Generation-Skipping", short: "Gen-Skipping", icon: <Target className="text-emerald-400" size={24} /> },
  { key: "assetProtection", name: "Asset Protection", short: "Asset Protection", icon: <Shield className="text-emerald-400" size={24} /> },
  { key: "liquidity", name: "Liquidity", short: "Liquidity", icon: <Zap className="text-emerald-400" size={24} /> },
  { key: "charitableGiving", name: "Charitable Giving", short: "Charitable", icon: <CheckCircle2 className="text-emerald-400" size={24} /> },
  { key: "businessSuccession", name: "Business Succession", short: "Succession", icon: <Users className="text-emerald-400" size={24} /> },
  { key: "familyGovernance", name: "Family Governance", short: "Governance", icon: <Scale className="text-emerald-400" size={24} /> },
];

// Neutral starting point: every dimension rated at the midpoint until the visitor rates it.
const initialRatings = (): Record<DimensionKey, Rating> =>
  Object.fromEntries(DIMENSIONS.map((d) => [d.key, { current: 50, target: 50 }])) as Record<DimensionKey, Rating>;

const GRADE_SCALE = [
  { min: 90, grade: "A" },
  { min: 80, grade: "B" },
  { min: 70, grade: "C" },
  { min: 60, grade: "D" },
  { min: 0, grade: "F" },
];
const gradeFor = (score: number) => GRADE_SCALE.find((s) => score >= s.min)?.grade ?? "F";

const fmtUsd = (n: number) => `$${Math.round(n).toLocaleString()}`;

const WealthTransferScorecard = () => {
  const [ratings, setRatings] = useState<Record<DimensionKey, Rating>>(initialRatings);
  const [estateValue, setEstateValue] = useState(10_000_000);
  const [growthRate, setGrowthRate] = useState(5);
  const [yearsPerGeneration, setYearsPerGeneration] = useState(25);
  const [transferLossPct, setTransferLossPct] = useState(30);

  const setRating = (key: DimensionKey, field: keyof Rating, value: number) =>
    setRatings((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const averages = useMemo(() => {
    const list = DIMENSIONS.map((d) => ratings[d.key]);
    const current = list.reduce((s, r) => s + r.current, 0) / list.length;
    const target = list.reduce((s, r) => s + r.target, 0) / list.length;
    return { current, target };
  }, [ratings]);

  const radarData = useMemo(
    () => DIMENSIONS.map((d) => ({ subject: d.short, current: ratings[d.key].current, target: ratings[d.key].target })),
    [ratings],
  );

  const gaps = useMemo(
    () =>
      DIMENSIONS.map((d) => ({ ...d, gap: ratings[d.key].target - ratings[d.key].current }))
        .filter((d) => d.gap > 0)
        .sort((a, b) => b.gap - a.gap),
    [ratings],
  );

  // Wealth reaching each generation: grows at the assumed net rate for one generation,
  // then loses the assumed transfer share when it passes to the next.
  const projection = useMemo(() => {
    const g = growthRate / 100;
    const loss = transferLossPct / 100;
    const rows: { generation: string; wealth: number }[] = [{ generation: "Current", wealth: estateValue }];
    let w = estateValue;
    for (const label of ["Next", "Subsequent"]) {
      w = w * Math.pow(1 + g, yearsPerGeneration) * (1 - loss);
      rows.push({ generation: label, wealth: w });
    }
    return rows;
  }, [estateValue, growthRate, yearsPerGeneration, transferLossPct]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 p-8 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-emerald-400">Wealth Transfer Efficiency Scorecard</h1>
        <p className="text-xl mt-4 text-gold-300">Rate each part of the plan to see where the gaps are</p>
        <div className="mt-6">
          <Award className="inline mx-auto text-gold-400" size={48} />
          <h2 className="text-3xl mt-4" data-testid="overall-grade">
            Overall Grade: {gradeFor(averages.current)} ({averages.current.toFixed(0)}/100)
          </h2>
          <p className="text-md mt-2">
            Target grade: {gradeFor(averages.target)} ({averages.target.toFixed(0)}/100). The grade is the average of your ratings below (A-F scale).
          </p>
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Your Ratings</h2>
        <p className="mb-4">Rate each dimension 0-100: where the plan stands today, and where you want it to be.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="bg-[#0d1526] p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
              {dim.icon}
              <h3 className="text-xl font-medium mt-2">{dim.name}</h3>
              <label className="block mt-3 text-sm">
                Today: {ratings[dim.key].current}/100
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ratings[dim.key].current}
                  onChange={(e) => setRating(dim.key, "current", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="mt-1 w-full rounded bg-[#0a0f1a] border border-[#1e3a5f] px-2 py-1"
                />
              </label>
              <label className="block mt-3 text-sm">
                Target: {ratings[dim.key].target}/100
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ratings[dim.key].target}
                  onChange={(e) => setRating(dim.key, "target", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="mt-1 w-full rounded bg-[#0a0f1a] border border-[#1e3a5f] px-2 py-1"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Today vs Target</h2>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#4B5563" />
            <PolarAngleAxis dataKey="subject" stroke="#EAB308" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#10B981" />
            <Radar name="Today" dataKey="current" stroke="#EAB308" fill="#EAB308" fillOpacity={0.6} />
            <Radar name="Target" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Largest Gaps</h2>
        <p className="mb-4">Dimensions ranked by the distance between today and target.</p>
        {gaps.length === 0 ? (
          <p className="text-gray-400">No gaps: every target is at or below today&apos;s rating.</p>
        ) : (
          <ul className="space-y-4">
            {gaps.map((item) => (
              <li key={item.key} className="bg-[#0d1526] p-4 rounded-lg flex items-center shadow-md border border-[#1e3a5f]">
                <AlertTriangle className="text-gold-400 mr-4" size={24} />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm">
                    Today {ratings[item.key].current} → target {ratings[item.key].target} (gap {item.gap} points)
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">3-Generation Wealth Projection</h2>
        <p className="mb-4">Every assumption below is yours to set.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <label className="text-sm">
            Estate value ($)
            <input type="number" min={0} value={estateValue} onChange={(e) => setEstateValue(Math.max(0, Number(e.target.value) || 0))} className="mt-1 w-full rounded bg-[#0d1526] border border-[#1e3a5f] px-2 py-1" />
          </label>
          <label className="text-sm">
            Assumed net growth rate (% a year)
            <input type="number" step={0.1} value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value) || 0)} className="mt-1 w-full rounded bg-[#0d1526] border border-[#1e3a5f] px-2 py-1" />
          </label>
          <label className="text-sm">
            Years per generation
            <input type="number" min={1} value={yearsPerGeneration} onChange={(e) => setYearsPerGeneration(Math.max(1, Number(e.target.value) || 1))} className="mt-1 w-full rounded bg-[#0d1526] border border-[#1e3a5f] px-2 py-1" />
          </label>
          <label className="text-sm">
            Share lost at each transfer (%)
            <input type="number" min={0} max={100} value={transferLossPct} onChange={(e) => setTransferLossPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className="mt-1 w-full rounded bg-[#0d1526] border border-[#1e3a5f] px-2 py-1" />
          </label>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={projection}>
            <XAxis dataKey="generation" stroke="#EAB308" />
            <YAxis stroke="#10B981" tickFormatter={(v: number) => `$${(v / 1e6).toFixed(1)}M`} />
            <Tooltip formatter={(v: number) => fmtUsd(v)} />
            <Legend />
            <Bar dataKey="wealth" fill="#EAB308" name="Wealth reaching the generation" />
          </ReBarChart>
        </ResponsiveContainer>
        <ul className="mt-4 text-sm space-y-1">
          {projection.map((row) => (
            <li key={row.generation}>
              {row.generation}: {fmtUsd(row.wealth)}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">How the Scorecard Works</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Estate Tax Efficiency:</strong> use of exemptions, trusts and lifetime gifting to limit estate tax.</li>
          <li><strong>Income Tax Planning:</strong> basis step-up, Roth conversions and income deferral.</li>
          <li><strong>Generation-Skipping:</strong> GST exemption allocation and dynasty trust structures.</li>
          <li><strong>Asset Protection:</strong> safeguards against creditors, lawsuits and divorce.</li>
          <li><strong>Liquidity:</strong> cash available at death for taxes, debts and equalisation.</li>
          <li><strong>Charitable Giving:</strong> donor-advised funds, charitable trusts and the deductions they carry.</li>
          <li><strong>Business Succession:</strong> buy-sell agreements, valuation and continuity.</li>
          <li><strong>Family Governance:</strong> family meetings, education and dispute resolution.</li>
        </ul>
        <p className="mt-4">
          The overall grade is the plain average of your eight ratings. The projection compounds the estate at your assumed rate for one
          generation, then removes your assumed transfer share, twice. It is a mechanic for comparing assumptions, not a forecast. For
          personalised advice, consult a professional.
        </p>
      </section>

      <PageInsights pageId="wealth-transfer-scorecard" />
    </div>
  );
};

export default WealthTransferScorecard;
