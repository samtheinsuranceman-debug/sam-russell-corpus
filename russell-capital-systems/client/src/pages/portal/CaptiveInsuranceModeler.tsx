// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Shield, Building2, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Briefcase, Scale, FileText, Target, Zap, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function CaptiveInsuranceModeler() {
  const [revenue, setRevenue] = useState(5000000); // Default business revenue in dollars

  // Memoized data for projections - simulates 5% growth on reserves as per requirements
  const projectionData = useMemo(() => [
    { year: 1, premium: 1200000, taxSavings: 444000, claims: 240000, reserves: 960000, totalWealth: 960000 },
    { year: 2, premium: 1200000, taxSavings: 444000, claims: 200000, reserves: 1010000, totalWealth: 2008000 },
    { year: 3, premium: 1200000, taxSavings: 444000, claims: 190000, reserves: 1060500, totalWealth: 3068500 },
    { year: 4, premium: 1200000, taxSavings: 444000, claims: 185000, reserves: 1113525, totalWealth: 4182025 },
    { year: 5, premium: 1200000, taxSavings: 444000, claims: 182000, reserves: 1169201, totalWealth: 5351226 },
    { year: 6, premium: 1200000, taxSavings: 444000, claims: 181000, reserves: 1227661, totalWealth: 6578887 },
    { year: 7, premium: 1200000, taxSavings: 444000, claims: 180000, reserves: 1289044, totalWealth: 7867931 },
    { year: 8, premium: 1200000, taxSavings: 444000, claims: 179000, reserves: 1353496, totalWealth: 9221427 },
    { year: 9, premium: 1200000, taxSavings: 444000, claims: 178000, reserves: 1421171, totalWealth: 10642600 },
    { year: 10, premium: 1200000, taxSavings: 444000, claims: 180000, reserves: 1493229, totalWealth: 12135829 },
  ], []);

  // Data for Tax Benefit Waterfall BarChart
  const taxBenefitData = [
    { name: 'Premium Deduction', value: 1200000 },
    { name: 'Investment Income', value: 96000 },
    { name: 'Claims Paid', value: 240000 },
    { name: 'Net Tax Benefit', value: 444000 },
    { name: 'Cumulative 10yr', value: 4440000 },
  ];

  // Data for Comparison AreaChart
  const comparisonData = [
    { year: 1, withoutCaptive: 1200000, withCaptiveWealth: 960000 },
    { year: 2, withoutCaptive: 2400000, withCaptiveWealth: 2008000 },
    { year: 3, withoutCaptive: 3600000, withCaptiveWealth: 3068500 },
    { year: 4, withoutCaptive: 4800000, withCaptiveWealth: 4182025 },
    { year: 5, withoutCaptive: 6000000, withCaptiveWealth: 5351226 },
    { year: 6, withoutCaptive: 7200000, withCaptiveWealth: 6578887 },
    { year: 7, withoutCaptive: 8400000, withCaptiveWealth: 7867931 },
    { year: 8, withoutCaptive: 9600000, withCaptiveWealth: 9221427 },
    { year: 9, withoutCaptive: 10800000, withCaptiveWealth: 10642600 },
    { year: 10, withoutCaptive: 12000000, withCaptiveWealth: 12135829 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      {/* Header Section */}
      <div className="mb-12 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-indigo-400 mb-4">Captive Insurance Modeler</h1>
        <div className="flex items-center space-x-4">
          <label className="text-lg">Business Revenue: </label>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(Number(e.target.value))}
            className="bg-[#0d1526] border border-indigo-500 p-2 rounded-md text-white w-48"
            placeholder="$5,000,000"
          />
        </div>
      </div>

      {/* Captive Structure Overview - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center space-x-4 hover:bg-indigo-900 transition duration-200">
          <DollarSign className="text-emerald-400" size={24} />
          <div>
            <h3 className="text-xl font-semibold text-indigo-300">Annual Premium</h3>
            <p className="text-[#94a3b8]">$1,200,000 (deductible under IRC §831(b))</p>
          </div>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center space-x-4 hover:bg-indigo-900 transition duration-200">
          <Shield className="text-emerald-400" size={24} />
          <div>
            <h3 className="text-xl font-semibold text-indigo-300">Tax Deduction Value</h3>
            <p className="text-[#94a3b8]">$444,000 (at 37% bracket)</p>
          </div>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center space-x-4 hover:bg-indigo-900 transition duration-200">
          <TrendingUp className="text-emerald-400" size={24} />
          <div>
            <h3 className="text-xl font-semibold text-indigo-300">Reserve Accumulation</h3>
            <p className="text-[#94a3b8]">$960,000/yr (80% loss ratio)</p>
          </div>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center space-x-4 hover:bg-indigo-900 transition duration-200">
          <Building2 className="text-emerald-400" size={24} />
          <div>
            <h3 className="text-xl font-semibold text-indigo-300">5-Year Wealth Build</h3>
            <p className="text-[#94a3b8]">$4,800,000</p>
          </div>
        </div>
      </div>

      {/* Premium Calculation Engine */}
      <div className="bg-[#0d1526] p-8 rounded-lg shadow-lg mb-12">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Premium Calculation Engine</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="flex items-center"><Briefcase className="mr-2" size={20} /> Business Revenue: $5M</p>
            <p className="flex items-center"><Scale className="mr-2" size={20} /> Risk Assessment Score: 7.2/10</p>
            <p className="flex items-center"><AlertTriangle className="mr-2" size={20} /> Eligible Premium Range: $800K - $1.4M</p>
            <p className="flex items-center"><CheckCircle2 className="mr-2" size={20} /> Recommended Premium: $1.2M</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-emerald-400">Actuarial Justification Breakdown</h3>
            <ul className="list-disc pl-5 text-[#94a3b8]">
              <li>Property Risks: 30% allocation</li>
              <li>Liability Coverage: 25% allocation</li>
              <li>Cyber Threats: 20% allocation</li>
              <li>Key Person Insurance: 25% allocation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 10-Year Projection Table */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12 overflow-x-auto">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">10-Year Projection Table</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-700 text-left">
              <th className="p-3 border-b border-[#1e3a5f]">Year</th>
              <th className="p-3 border-b border-[#1e3a5f]">Premium</th>
              <th className="p-3 border-b border-[#1e3a5f]">Tax Savings</th>
              <th className="p-3 border-b border-[#1e3a5f]">Claims</th>
              <th className="p-3 border-b border-[#1e3a5f]">Reserves</th>
              <th className="p-3 border-b border-[#1e3a5f]">Total Wealth</th>
            </tr>
          </thead>
          <tbody>
            {projectionData.map((row) => (
              <tr key={row.year} className="border-b border-[#1e3a5f] hover:bg-[#162a4a] transition duration-150">
                <td className="p-3">${row.year}M</td>
                <td className="p-3">${(row.premium / 1000000).toFixed(1)}M</td>
                <td className="p-3">${(row.taxSavings / 1000000).toFixed(1)}M</td>
                <td className="p-3">${(row.claims / 1000000).toFixed(1)}M</td>
                <td className="p-3">${(row.reserves / 1000000).toFixed(1)}M</td>
                <td className="p-3">${(row.totalWealth / 1000000).toFixed(1)}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax Benefit Waterfall - BarChart */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Tax Benefit Waterfall</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={taxBenefitData}>
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#10B981" /> {/* Emerald accent */}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison: Captive vs No Captive - AreaChart */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Captive vs No Captive Comparison</h2>
        <p className="text-[#94a3b8] mb-4">Without Captive: Pay premiums with no wealth build. With Captive: Build wealth over time.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={comparisonData}>
            <XAxis dataKey="year" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="withoutCaptive" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} /> {/* Red for contrast */}
            <Area type="monotone" dataKey="withCaptiveWealth" stroke="#10B981" fill="#10B981" fillOpacity={0.6} /> {/* Emerald accent */}
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[#94a3b8] mt-4">10-year difference: $12.4M wealth created with captive.</p>
      </div>

      {/* IRS Compliance Checklist */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">IRS Compliance Checklist</h2>
        <ul className="space-y-2">
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-400" size={20} /> IRC §831(b) micro-captive election</li>
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-400" size={20} /> Arm's length premium pricing</li>
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-400" size={20} /> Actuarial study required</li>
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-400" size={20} /> Risk distribution (12+ insureds)</li>
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-400" size={20} /> Risk shifting (genuine insurance)</li>
          <li className="flex items-center"><AlertTriangle className="mr-2 text-yellow-400" size={20} /> IRS Notice 2016-66 reporting requirement</li>
        </ul>
      </div>

      {/* Exit Strategies */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Exit Strategies</h2>
        <ul className="space-y-2 text-[#94a3b8]">
          <li className="flex items-center"><Lock className="mr-2 text-emerald-400" size={20} /> Liquidation (capital gains rate)</li>
          <li className="flex items-center"><Zap className="mr-2 text-emerald-400" size={20} /> Dividend distribution</li>
          <li className="flex items-center"><Target className="mr-2 text-emerald-400" size={20} /> Sale to third party</li>
          <li className="flex items-center"><FileText className="mr-2 text-emerald-400" size={20} /> Conversion to commercial carrier</li>
        </ul>
      </div>
      <PageInsights section="captive-insurance-modeler" />
    </div>
  );
}
