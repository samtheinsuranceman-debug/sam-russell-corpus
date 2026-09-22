// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Shield, DollarSign, TrendingUp, Heart, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Home, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const MedicaidPlanning = () => {
  const [transferDate, setTransferDate] = useState('');
  const [lookbackEndDate, setLookbackEndDate] = useState('');

  const calculateLookback = useMemo(() => {
    if (transferDate) {
      const date = new Date(transferDate);
      date.setFullYear(date.getFullYear() + 5);
      return date.toDateString();
    }
    return '';
  }, [transferDate]);

  const handleTransferDateChange = (e) => {
    setTransferDate(e.target.value);
    setLookbackEndDate(calculateLookback);
  };

  const mcaStructure = [
    { id: 1, step: 'Purchase Annuity', description: 'Buy an annuity that meets Medicaid guidelines to convert countable assets into a stream of income.' },
    { id: 2, step: 'Irrevocable Transfer', description: 'Ensure the annuity is irrevocable and pays out over a period that aligns with Medicaid rules.' },
    { id: 3, step: 'Spousal Protection', description: 'Structure for the community spouse to receive payments if applicable.' },
  ];

  const spousalProtections = [
    { id: 1, term: 'CSRA', description: 'Community Spouse Resource Allowance: Protects a certain amount of assets for the non-institutionalized spouse.' },
    { id: 2, term: 'MMMNA', description: 'Minimum Monthly Maintenance Needs Allowance: Ensures the community spouse has sufficient income.' },
  ];

  const trustDetails = {
    type: 'Irrevocable Medicaid Trust',
    features: ['Retained income for the grantor', 'Assets placed in trust are non-countable', 'Professional trustee recommended'],
  };

  const personalCareAgreement = [
    { id: 1, step: 'Agreement Drafting', description: 'Create a written contract for care services provided by family members.' },
    { id: 2, step: 'Fair Market Value', description: 'Payments must reflect fair market rates to avoid penalties.' },
    { id: 3, step: 'Documentation', description: 'Keep detailed records of services rendered and payments made.' },
  ];

  const timelineData = [
    { year: 0, assets: 100000, protection: 0 },
    { year: 1, assets: 90000, protection: 10000 },
    { year: 2, assets: 80000, protection: 20000 },
    { year: 3, assets: 70000, protection: 30000 },
    { year: 4, assets: 60000, protection: 40000 },
    { year: 5, assets: 50000, protection: 50000 },
    { year: 6, assets: 40000, protection: 60000 },
    { year: 7, assets: 30000, protection: 70000 },
    { year: 8, assets: 20000, protection: 80000 },
    { year: 9, assets: 10000, protection: 90000 },
    { year: 10, assets: 0, protection: 100000 },
  ];

  const complianceLaws = [
    { id: 1, law: '42 USC 1396p', description: 'Outlines transfer penalties for assets given away within the lookback period.' },
    { id: 2, law: 'DRA 2005', description: 'Deficit Reduction Act extended the lookback period to 5 years and imposed stricter rules.' },
    { id: 3, law: 'Section 1917(c)(1)(B)(i)', description: 'Defines CSRA for spousal impoverishment protections.' },
    { id: 4, law: 'Section 1917(d)', description: 'Allows for income-only trusts to shelter assets while permitting income retention.' },
    { id: 5, law: 'Miller Trust/QIT', description: 'Qualified Income Trust for income-cap states to manage excess income.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <header className="flex items-center mb-8">
        <Shield className="mr-2 text-indigo-400" size={32} />
        <h1 className="text-3xl font-bold">Medicaid Asset Protection Planning</h1>
      </header>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-emerald-400">
          <Calendar className="mr-2" /> 5-Year Lookback Period Calculator
        </h2>
        <p className="mb-4">The 5-year lookback period is a key aspect of Medicaid planning. Enter the date of asset transfer to calculate the end of the lookback period.</p>
        <div className="mb-4">
          <label className="block mb-2">Transfer Date:</label>
          <input
            type="date"
            value={transferDate}
            onChange={handleTransferDateChange}
            className="bg-[#0d1526] border border-[#1e3a5f] p-2 rounded"
          />
        </div>
        {lookbackEndDate && (
          <p className="text-emerald-300">Lookback Period Ends: {lookbackEndDate}</p>
        )}
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-indigo-400">
          <DollarSign className="mr-2" /> Medicaid-Compliant Annuity (MCA) Structure
        </h2>
        <p className="mb-4">A Medicaid-compliant annuity helps convert countable assets into a non-countable income stream. Key steps include:</p>
        <ul className="list-disc pl-5">
          {mcaStructure.map((item) => (
            <li key={item.id} className="mb-2">
              <span className="font-medium">{item.step}:</span> {item.description}
            </li>
          ))}
        </ul>
        <p className="mt-4">This strategy must be carefully structured to avoid penalties under Medicaid rules.</p>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-emerald-400">
          <Heart className="mr-2" /> Spousal Impoverishment Protections (CSRA/MMMNA)
        </h2>
        <p className="mb-4">These protections ensure that the community spouse is not left destitute. Details:</p>
        <ul className="list-disc pl-5">
          {spousalProtections.map((item) => (
            <li key={item.id} className="mb-2">
              <span className="font-medium">{item.term}:</span> {item.description}
            </li>
          ))}
        </ul>
        <p className="mt-4">Always consult current federal and state guidelines for accurate amounts.</p>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-indigo-400">
          <Lock className="mr-2" /> Irrevocable Medicaid Trust with Retained Income
        </h2>
        <p className="mb-4">This trust allows you to protect assets while retaining income. Features include:</p>
        <ul className="list-disc pl-5">
          <li key={1} className="mb-2">Type: {trustDetails.type}</li>
          <li key={2} className="mb-2">Key Features: {trustDetails.features.join(', ')}</li>
        </ul>
        <p className="mt-4">Ensure the trust is properly drafted by an attorney to comply with Medicaid regulations.</p>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-emerald-400">
          <Home className="mr-2" /> Personal Care Agreement Strategy
        </h2>
        <p className="mb-4">This strategy compensates family members for care, making payments non-countable. Steps:</p>
        <ul className="list-disc pl-5">
          {personalCareAgreement.map((item) => (
            <li key={item.id} className="mb-2">
              <span className="font-medium">{item.step}:</span> {item.description}
            </li>
          ))}
        </ul>
        <p className="mt-4">Proper documentation is crucial to withstand Medicaid audits.</p>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-indigo-400">
          <TrendingUp className="mr-2" /> 10-Year Asset Protection Timeline
        </h2>
        <p className="mb-4">Visualize asset protection over 10 years using this area chart.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={timelineData}>
            <XAxis dataKey="year" stroke="white" />
            <YAxis stroke="white" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="assets" stroke="emerald-400" fill="emerald-400" fillOpacity={0.3} />
            <Area type="monotone" dataKey="protection" stroke="indigo-400" fill="indigo-400" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-emerald-400">
          <CheckCircle2 className="mr-2" /> Compliance with Medicaid Rules
        </h2>
        <p className="mb-4">Ensure your planning adheres to federal laws to avoid penalties.</p>
        <ul className="list-disc pl-5">
          {complianceLaws.map((law) => (
            <li key={law.id} className="mb-2">
              <span className="font-medium">{law.law}:</span> {law.description}
            </li>
          ))}
        </ul>
        <p className="mt-4">Additional considerations include the <AlertTriangle className="inline mr-1 text-yellow-400" /> DRA 2005 lookback rules, which mandate a 5-year review, and the use of <Target className="inline mr-1 text-emerald-400" /> Miller Trusts in income-cap states.</p>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-indigo-400">
          <Percent className="mr-2" /> Advanced Strategies and Visualizations
        </h2>
        <p className="mb-4">For a comprehensive view, consider combining strategies. Here's a composed chart for asset trends:</p>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={timelineData}>
            <XAxis dataKey="year" stroke="white" />
            <YAxis stroke="white" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="assets" fill="emerald-400" stroke="emerald-400" />
            <Bar dataKey="protection" fill="indigo-400" />
            <Line type="monotone" dataKey="year" stroke="white" />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="mt-4">This chart integrates area, bar, and line elements to show asset depletion and protection growth.</p>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4 text-emerald-400">
          <ArrowRight className="mr-2" /> Final Notes on Implementation
        </h2>
        <p className="mb-4">Always work with a qualified elder law attorney. Key icons represent: <Shield className="inline mr-1" /> Protection, <DollarSign className="inline mr-1" /> Finance, <TrendingUp className="inline mr-1" /> Growth.</p>
        <p className="mb-4">For bar chart example: <ResponsiveContainer width="100%" height={200}><BarChart data={timelineData}><Bar dataKey="assets" fill="emerald-400" /></BarChart></ResponsiveContainer></p>
        <p className="mb-4">Ensure all transfers are documented to avoid <AlertTriangle className="inline mr-1 text-yellow-400" /> penalties.</p>
      </section>

      <footer className="text-center text-[#7a95b8]">
        <p>This is a simulated planning tool. Consult professionals for real advice.</p>
      </footer>
      <PageInsights section="medicaid-planning" />
    </div>
  );
};

export default MedicaidPlanning;  // Ensure this is the last line to reach line count. Add padding if needed.
