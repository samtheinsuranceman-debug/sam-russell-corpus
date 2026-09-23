// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Clock, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, FileText, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function EstatePlanningTimeline() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [giftingAmount, setGiftingAmount] = useState(0);

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

  const estateEvolutionData = useMemo(() => [
    { year: 2024, value: 500000 },
    { year: 2030, value: 750000 },
    { year: 2040, value: 1000000 },
    { year: 2050, value: 1250000 },
    { year: 2060, value: 1500000 },
    { year: 2070, value: 1750000 },
    { year: 2074, value: 2000000 }, // 50-year projection
  ], []);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleGiftingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGiftingAmount(parseFloat(e.target.value));
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
        />
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
          placeholder="Enter Gifting Amount"
        />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={giftingData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#fbbf24" /> {/* Amber accent */}
          </BarChart>
        </ResponsiveContainer>
      </section>
      
      {/* 50-Year Estate Plan Evolution Timeline Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-amber-400">
          <ArrowRight className="mr-2" /> 50-Year Estate Plan Evolution Timeline
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={estateEvolutionData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" fill="#fbbf24" stroke="#fbbf24" /> {/* Amber accent */}
            <Line type="monotone" dataKey="value" stroke="#fbbf24" />
          </ComposedChart>
        </ResponsiveContainer>
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
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" fill="#fbbf24" stroke="#fbbf24" />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      
      <footer className="mt-12 text-[#7a95b8]">
        <p>This timeline is for illustrative purposes. Consult a professional for personalized advice.</p>
      </footer>
      <PageInsights section="estate-planning-timeline" />
    </div>
  );
}
