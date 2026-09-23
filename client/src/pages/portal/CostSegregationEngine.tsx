// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, TrendingDown, Calculator, CheckCircle2, AlertTriangle, Calendar, Zap, Target, Home, Wrench } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart as RePieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function CostSegregationEngine() {
  const [propertyValue, setPropertyValue] = useState(3500000);

  const pieData = useMemo(() => [
    { name: '5-Year Property', value: (0.15 * propertyValue).toFixed(0), percentage: 15, color: '#f97316' }, // Orange accent
    { name: '7-Year Property', value: (0.10 * propertyValue).toFixed(0), percentage: 10, color: '#34d399' }, // Emerald accent
    { name: '15-Year Property', value: (0.12 * propertyValue).toFixed(0), percentage: 12, color: '#f97316' },
    { name: '27.5/39-Year Property', value: (0.58 * propertyValue).toFixed(0), percentage: 58, color: '#34d399' },
    { name: 'Land', value: (0.05 * propertyValue).toFixed(0), percentage: 5, color: '#6b7280' }, // Gray for land
  ], [propertyValue]);

  const depreciationData = useMemo(() => [
    { year: 1, without: 89744, with: 1295000, difference: 1205256 },
    { year: 2, without: 89744, with: 145000, difference: 55256 },
    { year: 3, without: 89744, with: 120000, difference: 30256 },
    { year: 4, without: 89744, with: 100000, difference: 10256 },
    { year: 5, without: 89744, with: 80000, difference: -9744 },
    { year: 6, without: 89744, with: 60000, difference: -29744 },
    { year: 7, without: 89744, with: 50000, difference: -39744 },
    { year: 8, without: 89744, with: 40000, difference: -49744 },
    { year: 9, without: 89744, with: 30000, difference: -59744 },
    { year: 10, without: 89744, with: 20000, difference: -69744 },
  ], []);

  // Bonus rate by acquisition year. P.L. 119-21 replaced the TCJA phase-down with a permanent 100% for
  // property acquired after 19 Jan 2025 — P.L. 119-21 § 70301 amending IRC § 168(k) (https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf); IRS Notice 2026-11 (https://www.irs.gov/pub/irs-drop/n-26-11.pdf), read 23 Sep 2026.
  // Was 2025 40%, 2026 20%, 2027+ 0%.
  const bonusDepreciationSchedule = [
    { year: 2022, percentage: 100 },
    { year: 2023, percentage: 80 },
    { year: 2024, percentage: 60 },
    { year: '2025 (acquired before 20 Jan)', percentage: 40 },
    { year: '2025 (acquired after 19 Jan)', percentage: 100 },
    { year: '2026 onward', percentage: 100 },
  ];

  const portfolioData = [
    { property: 'Office Building', value: '3.5M', deduction: '1.3M', taxSaved: '479K', studyCost: '15K', roi: '32x' },
    { property: 'STR Property', value: '1.2M', deduction: '480K', taxSaved: '178K', studyCost: '8K', roi: '22x' },
    { property: 'Retail Space', value: '2.8M', deduction: '1.05M', taxSaved: '389K', studyCost: '12K', roi: '32x' },
    { property: 'TOTAL', value: '7.5M', deduction: '2.83M', taxSaved: '1.05M', studyCost: '35K', roi: '30x' },
  ];

  const COLORS = ['#f97316', '#34d399', '#f97316', '#34d399', '#6b7280']; // Orange and Emerald accents

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans">
      {/* Header Section */}
      <header className="p-8 text-center bg-[#0d1526] shadow-lg">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8" />
          Cost Segregation Engine
        </h1>
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#7a95b8]">Property Value (USD)</label>
          <div className="flex justify-center">
            <input
              type="number"
              value={propertyValue}
              onChange={(e) => setPropertyValue(Number(e.target.value))}
              className="bg-gray-700 border border-[#1e3a5f] rounded-md p-2 w-1/3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter property value"
            />
            <DollarSign className="h-6 w-6 ml-2 mt-2" />
          </div>
        </div>
      </header>

      {/* Property Classification Breakdown */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calculator className="h-6 w-6" /> Property Classification Breakdown
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <RePieChart width={400} height={400}>
            <Pie
              data={pieData}
              cx={200}
              cy={200}
              labelLine={false}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percentage }) => `${name} (${percentage}%)`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RePieChart>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pieData.map((item, index) => (
              <div key={index} className="bg-[#0d1526] p-4 rounded-lg shadow-md">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-[#7a95b8]">Percentage: {item.percentage}%</p>
                <p className="text-orange-400">Value: ${item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Year 1 Tax Deduction Analysis */}
      <section className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md flex flex-col items-center">
          <TrendingUp className="h-8 w-8 mb-2 text-emerald-500" />
          <h3 className="text-xl font-semibold">Without Cost Seg</h3>
          <p className="text-[#7a95b8]">$89,744/yr (straight-line 39yr)</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md flex flex-col items-center">
          <Zap className="h-8 w-8 mb-2 text-orange-500" />
          <h3 className="text-xl font-semibold">With Cost Seg + Bonus</h3>
          <p className="text-[#7a95b8]">$1,295,000 Year 1</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md flex flex-col items-center">
          <DollarSign className="h-8 w-8 mb-2 text-emerald-500" />
          <h3 className="text-xl font-semibold">Tax Savings at 37%</h3>
          <p className="text-[#7a95b8]">$479,150 Year 1</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md flex flex-col items-center">
          <CheckCircle2 className="h-8 w-8 mb-2 text-orange-500" />
          <h3 className="text-xl font-semibold">Payback on Study Cost</h3>
          <p className="text-[#7a95b8]">$15K: 32x ROI</p>
        </div>
      </section>

      {/* Depreciation Comparison */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <TrendingDown className="h-6 w-6" /> Depreciation Comparison (10 Years)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ReBarChart data={depreciationData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="without" fill="#6b7280" name="Without Cost Seg" />
            <Bar dataKey="with" fill="#f97316" name="With Cost Seg" />
            <Bar dataKey="difference" fill="#34d399" name="Difference" />
          </ReBarChart>
        </ResponsiveContainer>
      </section>

      {/* Bonus Depreciation Schedule */}
      <section className="p-8 bg-[#0d1526] rounded-lg shadow-md mx-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-6 w-6" /> Bonus Depreciation Schedule
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          {bonusDepreciationSchedule.map((item) => (
            <li key={item.year} className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {item.year}: {item.percentage}% bonus depreciation
            </li>
          ))}
        </ul>
        <p className="mt-4 text-emerald-500 font-bold">100% bonus depreciation is permanent under P.L. 119-21 for property acquired after 19 January 2025.</p>
      </section>

      {/* STR Material Participation Strategy */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-6 w-6" /> STR Material Participation Strategy
        </h2>
        <p className="text-[#94a3b8] mb-2">Short-term rental + cost segregation = active loss</p>
        <p className="text-[#94a3b8] mb-2">Can offset W-2 income (unlike passive rental losses)</p>
        <p className="text-[#94a3b8] mb-2">Example: $500K income doctor + $1.3M cost seg deduction = $0 tax Year 1</p>
        <p className="text-[#94a3b8]">IRC §469 material participation rules (100+ hours, most participation)</p>
      </section>

      {/* Multi-Property Portfolio */}
      <section className="p-8 overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Home className="h-6 w-6" /> Multi-Property Portfolio
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 border-b border-[#1e3a5f]">Property</th>
              <th className="p-3 border-b border-[#1e3a5f]">Value</th>
              <th className="p-3 border-b border-[#1e3a5f]">Cost Seg Deduction</th>
              <th className="p-3 border-b border-[#1e3a5f]">Tax Saved</th>
              <th className="p-3 border-b border-[#1e3a5f]">Study Cost</th>
              <th className="p-3 border-b border-[#1e3a5f]">ROI</th>
            </tr>
          </thead>
          <tbody>
            {portfolioData.map((row, index) => (
              <tr key={index} className="border-b border-[#1e3a5f] hover:bg-[#162a4a]">
                <td className="p-3">{row.property}</td>
                <td className="p-3">${row.value}</td>
                <td className="p-3">${row.deduction}</td>
                <td className="p-3">${row.taxSaved}</td>
                <td className="p-3">${row.studyCost}</td>
                <td className="p-3">{row.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* IRS Compliance */}
      <section className="p-8 bg-[#0d1526] rounded-lg shadow-md mx-8 mt-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-6 w-6" /> IRS Compliance
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> IRC §168(k) bonus depreciation</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> IRC §179 expensing election</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Engineering-based study requirement</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Lookback studies for existing properties</li>
        </ul>
      </section>

      {/* Footer for additional spacing */}
      <footer className="p-8 text-center text-gray-500">
        <p>Powered by advanced financial modeling. Consult a tax professional for advice.</p>
      </footer>
      <PageInsights section="cost-segregation-engine" />
    </div>
  );
}
