// A25 (2026-09-23): the year and gifting inputs now drive results, and the 50-year
// chart is computed from the client's estate and growth inputs. Before: both inputs
// were bound to state nothing read, and the evolution chart was seven fixed points.
// Math: shared/estateProjection.ts (test: server/a25Calculators.test.ts).
import React, { useState, useMemo } from 'react';
import { Clock, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, FileText, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line, ReferenceLine } from 'recharts';
import { PageInsights } from "@/components/PageInsights";
import { NumberField, Stat, Notes, ProvenanceSources, usd } from "@/components/calc/CalcKit";
import { projectEstate, publishedExclusion, ESTATE_PROJECTION_SOURCES } from "@shared/estateProjection";

export default function EstatePlanningTimeline() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [giftingAmount, setGiftingAmount] = useState(19000);
  const [donees, setDonees] = useState(2);
  const [giftYears, setGiftYears] = useState(10);
  // Example inputs so the chart opens with a worked case; every one is editable.
  const [estateValue, setEstateValue] = useState(20000000);
  const [growthPct, setGrowthPct] = useState(4);

  const lifeStageMilestones = useMemo(() => [
    { age: '20s', description: 'Focus on basic financial planning: Start saving, create a will, and designate beneficiaries for simple assets like bank accounts.', icon: <Clock className="w-6 h-6 text-amber-400" /> },
    { age: '30s', description: 'Build wealth: Purchase life insurance, establish a trust for growing assets, and review power of attorney (POA).', icon: <DollarSign className="w-6 h-6 text-amber-400" /> },
    { age: '40s', description: 'Family planning: Update healthcare directives, audit beneficiary designations, and consider digital asset inventory.', icon: <TrendingUp className="w-6 h-6 text-amber-400" /> },
    { age: '50s', description: 'Peak earning: Perform estate plan stress tests for events like divorce or disability, and track annual gifting.', icon: <Target className="w-6 h-6 text-amber-400" /> },
    { age: '60s', description: 'Retirement preparation: Review use of the $15M-per-person exemption (2026, made permanent by P.L. 119-21), and ensure compliance with IRC sections.', icon: <Calendar className="w-6 h-6 text-amber-400" /> },
    { age: '70s', description: 'Legacy building: Update trusts and wills, conduct 50-year estate plan evolution, and verify HIPAA authorizations.', icon: <Percent className="w-6 h-6 text-amber-400" /> },
    { age: '80s+', description: 'Final reviews: Focus on state-specific requirements, SECURE Act rules, and comprehensive estate/gift/GST tax planning.', icon: <ArrowRight className="w-6 h-6 text-amber-400" /> },
  ], []);

  const documentReviewSchedule = useMemo(() => [
    { document: 'Will', reviewFrequency: 'Every 3-5 years', icon: <Shield className="w-6 h-6 text-amber-400" /> },
    { document: 'Trust', reviewFrequency: 'Annually or after major life events', icon: <CheckCircle2 className="w-6 h-6 text-amber-400" /> },
    { document: 'Power of Attorney (POA)', reviewFrequency: 'Every 2 years', icon: <AlertTriangle className="w-6 h-6 text-amber-400" /> },
    { document: 'Healthcare Directive', reviewFrequency: 'Annually', icon: <FileText className="w-6 h-6 text-amber-400" /> },
  ], []);

  const stressTestScenarios = useMemo(() => [
    { scenario: 'Divorce', impact: 'Reevaluate beneficiary designations and update trusts.', icon: <Users className="w-6 h-6 text-amber-400" /> },
    { scenario: 'Disability', impact: 'Ensure POA and healthcare directives are current.', icon: <AlertTriangle className="w-6 h-6 text-amber-400" /> },
    { scenario: 'Death', impact: 'Verify estate liquidity and GST tax exemptions.', icon: <CheckCircle2 className="w-6 h-6 text-amber-400" /> },
    { scenario: 'Market Crash', impact: 'Adjust gifting strategies and review IRC 2001 provisions.', icon: <TrendingUp className="w-6 h-6 text-amber-400" /> },
  ], []);

  const complianceItems = useMemo(() => [
    { code: 'IRC 2001-2704', description: 'Comprehensive estate, gift, and GST tax rules, including valuation adjustments.', icon: <FileText className="w-6 h-6 text-amber-400" /> },
    { code: 'Uniform Probate Code', description: 'Standardizes probate processes across states.', icon: <Shield className="w-6 h-6 text-amber-400" /> },
    { code: 'HIPAA Authorization', description: 'Ensures access to medical records in estate planning.', icon: <AlertTriangle className="w-6 h-6 text-amber-400" /> },
    { code: 'State-Specific Requirements', description: 'Varies by state; e.g., community property laws.', icon: <Users className="w-6 h-6 text-amber-400" /> },
    { code: 'SECURE Act Beneficiary Rules', description: 'Updated rules for inherited IRAs and retirement accounts.', icon: <Calendar className="w-6 h-6 text-amber-400" /> },
  ], []);

  // Annual gift tax exclusion per donee, IRC § 2503(b): Rev. Proc. 2019-44 (2020), 2020-45 (2021), 2021-45 (2022),
  // 2022-38 (2023), 2023-34 (2024), 2024-40 (2025), 2025-32 (2026, https://www.irs.gov/pub/irs-drop/rp-25-32.pdf);
  // read 23 Sep 2026. Were 15,000 / 15,500 / 16,000 / 16,500 / 17,000 / 17,500 with a "TCJA sunset impact" note.
  const giftingData = useMemo(() => [
    { year: 2020, amount: 15000 },
    { year: 2021, amount: 15000 },
    { year: 2022, amount: 16000 },
    { year: 2023, amount: 17000 },
    { year: 2024, amount: 18000 },
    { year: 2025, amount: 19000 },
    { year: 2026, amount: 19000 },
  ], []);

  const projection = useMemo(() => projectEstate({
    startYear: 2026, estateValue, growthRate: growthPct / 100, horizonYears: 50, married: false,
    charitableBequest: 0, ilitDeathBenefit: 0, annualGiftPerDonee: giftingAmount, donees, giftYears, priorTaxableGifts: 0,
  }), [estateValue, growthPct, giftingAmount, donees, giftYears]);
  const estateEvolutionData = useMemo(() => projection.rows.map(r => ({ year: r.year, value: r.grossEstate, tax: r.estateTax })), [projection]);
  const exclusionForYear = publishedExclusion(selectedYear);
  const excessPerDonee = Math.max(0, giftingAmount - projection.annualExclusionUsed);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value, 10);
    setSelectedYear(Number.isFinite(n) ? n : 2026);
  };

  const handleGiftingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseFloat(e.target.value);
    setGiftingAmount(Number.isFinite(n) ? n : 0);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 p-8 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-amber-400">Comprehensive Estate Planning Timeline & Milestone Tracker</h1>
      
      {/* Life Stage Milestones Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <Clock className="mr-2" /> Life Stage Estate Planning Milestones (20s through 80s+)
        </h2>
        <ul className="space-y-4">
          {lifeStageMilestones.map((milestone, index) => (
            <li key={index} className="flex items-start bg-[#0d1526] p-4 rounded-lg shadow-lg">
              {milestone.icon}
              <div className="ml-4">
                <strong>{milestone.age}:</strong> {milestone.description}
              </div>
            </li>
          ))}
        </ul>
      </section>
      
      {/* Document Review Schedule Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <Calendar className="mr-2" /> Document Review Schedule
        </h2>
        <ul className="space-y-4">
          {documentReviewSchedule.map((doc, index) => (
            <li key={index} className="flex items-start bg-[#0d1526] p-4 rounded-lg shadow-lg">
              {doc.icon}
              <div className="ml-4">
                <strong>{doc.document}:</strong> Review every {doc.reviewFrequency}
              </div>
            </li>
          ))}
        </ul>
      </section>
      
      {/* Beneficiary Designation Audit Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <Target className="mr-2" /> Beneficiary Designation Audit
        </h2>
        <p className="bg-[#0d1526] p-4 rounded-lg shadow-lg">Annually audit beneficiaries for retirement accounts, life insurance, and trusts to ensure alignment with current life stages and SECURE Act rules.</p>
      </section>
      
      {/* Digital Asset Inventory Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <FileText className="mr-2" /> Digital Asset Inventory
        </h2>
        <p className="bg-[#0d1526] p-4 rounded-lg shadow-lg">Maintain an inventory of digital assets (e.g., cryptocurrencies, online accounts) and include access instructions in your estate plan, reviewed biennially.</p>
      </section>
      
      {/* Estate Plan Stress Test Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <AlertTriangle className="mr-2" /> Estate Plan Stress Test
        </h2>
        <ul className="space-y-4">
          {stressTestScenarios.map((scenario, index) => (
            <li key={index} className="flex items-start bg-[#0d1526] p-4 rounded-lg shadow-lg">
              {scenario.icon}
              <div className="ml-4">
                <strong>{scenario.scenario}:</strong> {scenario.impact}
              </div>
            </li>
          ))}
        </ul>
      </section>
      
      {/* Was "TCJA Sunset Countdown (2025/2026)". P.L. 119-21 made the TCJA exemption and rates permanent — P.L. 119-21 § 70106 amending IRC § 2010(c)(3), https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf; Rev. Proc. 2025-32, https://www.irs.gov/pub/irs-drop/rp-25-32.pdf (read 23 Sep 2026). */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <Percent className="mr-2" /> Exemption Planning Under Current Law
        </h2>
        <p className="bg-[#0d1526] p-4 rounded-lg shadow-lg">Current law (P.L. 119-21, July 2025): the estate and gift exemption is $15M per person in 2026, indexed, with no scheduled sunset. Plan gifting under IRC §§ 2010–2704 against that figure; treat a lower exemption only as a "what if Congress changes it" scenario.</p>
        <input
          type="number"
          value={selectedYear}
          onChange={handleYearChange}
          className="mt-4 p-2 bg-slate-700 text-amber-400 rounded"
          placeholder="Select Year"
          data-testid="timeline-year"
        />
        <p className="mt-2 text-slate-300" data-testid="timeline-exclusion">
          {exclusionForYear != null
            ? `Basic exclusion for a death in ${selectedYear}: ${usd(exclusionForYear)} per person.`
            : `No exclusion is published for ${selectedYear}. After 2026 it is indexed for inflation (P.L. 119-21); the figure is set each autumn by revenue procedure.`}
        </p>
      </section>
      
      {/* Annual Gifting Tracker Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <DollarSign className="mr-2" /> Annual Gifting Tracker
        </h2>
        <input
          type="number"
          value={giftingAmount}
          onChange={handleGiftingChange}
          className="p-2 bg-slate-700 text-amber-400 rounded mb-4"
          placeholder="Gift per donee"
          data-testid="timeline-gift"
        />
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <NumberField label="Number of donees" value={donees} min={0} onChange={setDonees} />
          <NumberField label="Years of gifting" value={giftYears} min={0} onChange={setGiftYears} />
        </div>
        <p className="mb-4 text-slate-300" data-testid="timeline-gift-result">
          {excessPerDonee > 0
            ? `${usd(excessPerDonee)} per donee is above the ${usd(projection.annualExclusionUsed)} annual exclusion: a taxable gift of ${usd(excessPerDonee * donees)} a year that uses lifetime exclusion and needs Form 709.`
            : `Within the ${usd(projection.annualExclusionUsed)} annual exclusion: ${usd(giftingAmount * donees)} a year leaves the estate with no gift tax and no use of lifetime exclusion.`}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={giftingData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" name="Annual exclusion per donee" fill="#fbbf24" />
            <ReferenceLine y={giftingAmount} stroke="#34d399" strokeDasharray="4 4" label={{ value: "Your gift", fill: "#34d399" }} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      
      {/* 50-Year Estate Plan Evolution Timeline Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <ArrowRight className="mr-2" /> 50-Year Estate Plan Evolution Timeline
        </h2>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <NumberField label="Estate value today (example — replace)" value={estateValue} step={100000} onChange={setEstateValue} testId="timeline-estate" />
          <NumberField label="Assumed annual growth" suffix="%" value={growthPct} step={0.1} onChange={setGrowthPct} hint="Client assumption" />
        </div>
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <Stat label="Estate tax, death in 2026" value={usd(projection.today.estateTax)} tone="bad" />
          <Stat label="Estate tax, year 25" value={usd(projection.rows[25]?.estateTax)} tone="bad" />
          <Stat label="Estate tax, year 50" value={usd(projection.atHorizon.estateTax)} tone="bad" testId="timeline-tax-50" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={estateEvolutionData}>
            <XAxis dataKey="year" />
            <YAxis tickFormatter={v => `$${(Number(v) / 1e6).toFixed(0)}M`} />
            <Tooltip formatter={(v: number) => usd(v)} />
            <Legend />
            <Area type="monotone" dataKey="value" name="Gross estate" fill="#fbbf24" stroke="#fbbf24" fillOpacity={0.3} />
            <Line type="monotone" dataKey="tax" name="Estate tax" stroke="#f87171" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-4"><Notes notes={projection.notes} /></div>
      </section>
      
      {/* Compliance Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <Shield className="mr-2" /> Compliance Overview
        </h2>
        <ul className="space-y-4">
          {complianceItems.map((item, index) => (
            <li key={index} className="flex items-start bg-[#0d1526] p-4 rounded-lg shadow-lg">
              {item.icon}
              <div className="ml-4">
                <strong>{item.code}:</strong> {item.description}
              </div>
            </li>
          ))}
        </ul>
      </section>
      
      {/* Additional Charts for Visualization */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-amber-400">Estate Value Projections</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={estateEvolutionData}>
            <XAxis dataKey="year" />
            <YAxis tickFormatter={v => `$${(Number(v) / 1e6).toFixed(0)}M`} />
            <Tooltip formatter={(v: number) => usd(v)} />
            <Area type="monotone" dataKey="value" name="Gross estate" fill="#fbbf24" stroke="#fbbf24" />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      
      <footer className="mt-12 text-[#7a95b8]">
        <p>This timeline is for illustrative purposes. Consult a professional for personalized advice.</p>
      </footer>
      <ProvenanceSources sources={ESTATE_PROJECTION_SOURCES} disclosure="Federal estate and gift tax only; state taxes not included. Growth is the client's assumption. Not legal or tax advice." />
      <PageInsights pageId="estate-planning-timeline" />
    </div>
  );
}
