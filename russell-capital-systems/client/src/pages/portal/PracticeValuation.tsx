// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, Shield, CheckCircle2, Target, Scale, Users, Calculator, ArrowRight, Award, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function PracticeValuation() {
  const [annualRevenue, setAnnualRevenue] = useState(2000000);
  const [ebitdaMargin, setEbitdaMargin] = useState(0.25); // 25%
  const [practiceType, setPracticeType] = useState('medical');

  const ebitda = useMemo(() => annualRevenue * ebitdaMargin, [annualRevenue, ebitdaMargin]);

  const valuationMethods = useMemo(() => {
    const multiples = {
      medical: { ebitdaMultiple: [4, 6], revenueMultiple: [0.5, 1.0] },
      dental: { ebitdaMultiple: [5, 8], revenueMultiple: [0.6, 1.2] },
      law: { ebitdaMultiple: [3, 5], revenueMultiple: [0.5, 1.5] },
    };

    const ebitdaMultipleRange = multiples[practiceType].ebitdaMultiple;
    const ebitdaValuationMin = ebitda * ebitdaMultipleRange[0];
    const ebitdaValuationMax = ebitda * ebitdaMultipleRange[1];

    const revenueMultipleRange = multiples[practiceType].revenueMultiple;
    const revenueValuationMin = annualRevenue * revenueMultipleRange[0];
    const revenueValuationMax = annualRevenue * revenueMultipleRange[1];

    const dcfCashFlows = [ebitda * 1.1, ebitda * 1.2, ebitda * 1.3, ebitda * 1.4, ebitda * 1.5]; // Simplified 5-year projection
    const discountRate = 0.18; // 18% average
    const discountedCashFlows = dcfCashFlows.map((cf, i) => cf / Math.pow(1 + discountRate, i + 1));
    const terminalValue = ebitda * 1.5 * 4; // 4x year 5 EBITDA
    const dcfValue = discountedCashFlows.reduce((a, b) => a + b, 0) + (terminalValue / Math.pow(1 + discountRate, 5));

    const assetBased = {
      equipment: 300000,
      accountsReceivable: 250000,
      goodwill: 1200000, // Example based on practice type
      total: 300000 + 250000 + 1200000,
    };

    return {
      ebitda: { min: ebitdaValuationMin, max: ebitdaValuationMax },
      revenue: { min: revenueValuationMin, max: revenueValuationMax },
      dcf: dcfValue,
      assetBased: assetBased.total,
    };
  }, [annualRevenue, ebitda, practiceType]);

  const valuationData = [
    { name: 'EBITDA Multiple', value: (valuationMethods.ebitda.min + valuationMethods.ebitda.max) / 2 },
    { name: 'Revenue Multiple', value: (valuationMethods.revenue.min + valuationMethods.revenue.max) / 2 },
    { name: 'DCF', value: valuationMethods.dcf },
    { name: 'Asset-Based', value: valuationMethods.assetBased },
  ];

  const weightedAverage = valuationData.reduce((sum, item) => sum + item.value, 0) / valuationData.length;

  const valueDriversData = [
    { subject: 'Revenue Growth', A: 8, fullMark: 10 },
    { subject: 'Patient Retention', A: 9, fullMark: 10 },
    { subject: 'Provider Dependency', A: 6, fullMark: 10 },
    { subject: 'Payer Mix', A: 7, fullMark: 10 },
    { subject: 'Location Quality', A: 8, fullMark: 10 },
    { subject: 'Staff Stability', A: 7, fullMark: 10 },
  ];

  const benchmarks = [
    { metric: 'Revenue Multiple', medical: '0.5-1.0x', dental: '0.6-1.2x', law: '0.5-1.5x', accounting: '1.0-1.5x' },
    { metric: 'EBITDA Multiple', medical: '4-6x', dental: '5-8x', law: '3-5x', accounting: '4-7x' },
    { metric: 'Avg Margin', medical: '20-30%', dental: '25-40%', law: '30-45%', accounting: '25-35%' },
    { metric: 'Goodwill %', medical: '60-70%', dental: '70-80%', law: '50-60%', accounting: '65-75%' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 font-sans">
      {/* Header Section */}
      <header className="p-8 bg-indigo-900 shadow-lg">
        <h1 className="text-4xl font-bold text-amber-400 flex items-center">
          <Building2 className="mr-2" />
          Practice Valuation Calculator
        </h1>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8]">Annual Revenue ($)</label>
            <input
              type="number"
              value={annualRevenue}
              onChange={(e) => setAnnualRevenue(Number(e.target.value))}
              className="mt-1 block w-full bg-[#0d1526] border border-indigo-700 rounded-md shadow-sm py-2 px-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8]">EBITDA Margin (%)</label>
            <input
              type="number"
              value={ebitdaMargin * 100}
              onChange={(e) => setEbitdaMargin(Number(e.target.value) / 100)}
              className="mt-1 block w-full bg-[#0d1526] border border-indigo-700 rounded-md shadow-sm py-2 px-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8]">Practice Type</label>
            <select
              value={practiceType}
              onChange={(e) => setPracticeType(e.target.value)}
              className="mt-1 block w-full bg-[#0d1526] border border-indigo-700 rounded-md shadow-sm py-2 px-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="medical">Medical</option>
              <option value="dental">Dental</option>
              <option value="law">Law</option>
            </select>
          </div>
        </div>
        <p className="mt-4 text-[#94a3b8]">EBITDA: ${ebitda.toFixed(0)}</p>
      </header>

      {/* Valuation Methods Section */}
      <section className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-xl border-l-4 border-amber-500">
          <h2 className="text-2xl font-semibold flex items-center text-indigo-400">
            <DollarSign className="mr-2" /> EBITDA Multiple
          </h2>
          <p>EBITDA: ${ebitda.toFixed(0)}</p>
          <p>Multiple: {valuationMethods.ebitda.min / ebitda.toFixed(1)}x - {valuationMethods.ebitda.max / ebitda.toFixed(1)}x</p>
          <p>Valuation Range: ${valuationMethods.ebitda.min.toFixed(0)} - ${valuationMethods.ebitda.max.toFixed(0)}</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-xl border-l-4 border-amber-500">
          <h2 className="text-2xl font-semibold flex items-center text-indigo-400">
            <TrendingUp className="mr-2" /> Revenue Multiple
          </h2>
          <p>Revenue: ${annualRevenue.toFixed(0)}</p>
          <p>Multiple: {(valuationMethods.revenue.min / annualRevenue).toFixed(1)}x - {(valuationMethods.revenue.max / annualRevenue).toFixed(1)}x</p>
          <p>Valuation Range: ${valuationMethods.revenue.min.toFixed(0)} - ${valuationMethods.revenue.max.toFixed(0)}</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-xl border-l-4 border-amber-500">
          <h2 className="text-2xl font-semibold flex items-center text-indigo-400">
            <Calculator className="mr-2" /> Discounted Cash Flow
          </h2>
          <p>5-year projected cash flows: Estimated</p>
          <p>Discount rate: 15-20%</p>
          <p>Terminal value: 4x year 5 EBITDA</p>
          <p>DCF Value: ${valuationMethods.dcf.toFixed(0)}</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-xl border-l-4 border-amber-500">
          <h2 className="text-2xl font-semibold flex items-center text-indigo-400">
            <Shield className="mr-2" /> Asset-Based
          </h2>
          <p>Equipment: $300,000</p>
          <p>Accounts Receivable: $250,000</p>
          <p>Goodwill: $1,200,000</p>
          <p>Total: ${valuationMethods.assetBased.toFixed(0)}</p>
        </div>
      </section>

      {/* Valuation Range Chart */}
      <section className="p-8 bg-[#0d1526]">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Valuation Range</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={valuationData}>
            <XAxis dataKey="name" stroke="#D97706" />
            <YAxis stroke="#D97706" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#6366F1" />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-4 text-[#94a3b8]">Weighted Average: ${weightedAverage.toFixed(0)}</p>
        <p className="text-indigo-400">Recommended Range: Highlighted in chart</p>
      </section>

      {/* Value Drivers Chart */}
      <section className="p-8">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Value Drivers</h2>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={valueDriversData}>
            <PolarGrid stroke="#D97706" />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} />
            <Radar name="Value" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      {/* Practice Type Benchmarks Table */}
      <section className="p-8 overflow-x-auto">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Practice Type Benchmarks</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 border-b border-indigo-700">Metric</th>
              <th className="p-3 border-b border-indigo-700">Medical</th>
              <th className="p-3 border-b border-indigo-700">Dental</th>
              <th className="p-3 border-b border-indigo-700">Law</th>
              <th className="p-3 border-b border-indigo-700">Accounting</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((row, index) => (
              <tr key={index} className="even:bg-[#0d1526]">
                <td className="p-3 border-b border-indigo-700">{row.metric}</td>
                <td className="p-3 border-b border-indigo-700">{row.medical}</td>
                <td className="p-3 border-b border-indigo-700">{row.dental}</td>
                <td className="p-3 border-b border-indigo-700">{row.law}</td>
                <td className="p-3 border-b border-indigo-700">{row.accounting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Exit Planning Timeline */}
      <section className="p-8 bg-[#0d1526]">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Exit Planning Timeline</h2>
        <ul className="list-disc pl-5 space-y-2 text-[#94a3b8]">
          <li><ArrowRight className="inline mr-2" />5 years out: Maximize EBITDA, reduce owner dependency</li>
          <li><ArrowRight className="inline mr-2" />3 years out: Clean financials, document procedures</li>
          <li><ArrowRight className="inline mr-2" />1 year out: Engage broker, prepare data room</li>
          <li><ArrowRight className="inline mr-2" />Sale: Negotiate terms, transition plan</li>
          <li><ArrowRight className="inline mr-2" />Tax optimization: Installment sale, QSBS, opportunity zone</li>
        </ul>
      </section>
      <PageInsights section="practice-valuation" />
    </div>
  );
}
