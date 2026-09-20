// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, MapPin, Users, BarChart3, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const DSTAnalyzer = () => {
  const [relinquishedValue, setRelinquishedValue] = useState(2000000); // Default $2,000,000

  const calculatedValues = useMemo(() => {
    const capitalGainDeferred = relinquishedValue * 0.75; // Assuming 75% as per example
    const taxDeferred = capitalGainDeferred * 0.28; // 23.8% federal + state approx 28%
    const dstMinimumInvestment = 100000; // Fixed as per requirements
    return {
      capitalGainDeferred,
      taxDeferred,
      dstMinimumInvestment,
    };
  }, [relinquishedValue]);

  const pieData = useMemo(() => [
    { name: 'Multifamily', value: (35 / 100) * relinquishedValue, color: '#14b8a6' }, // Teal accent
    { name: 'Industrial/Warehouse', value: (25 / 100) * relinquishedValue, color: '#fbbf24' }, // Amber accent
    { name: 'Medical Office', value: (20 / 100) * relinquishedValue, color: '#14b8a6' },
    { name: 'Net Lease Retail', value: (15 / 100) * relinquishedValue, color: '#fbbf24' },
    { name: 'Self-Storage', value: (5 / 100) * relinquishedValue, color: '#14b8a6' },
  ], [relinquishedValue]);

  const areaData = useMemo(() => [
    { year: 1, income: 110000 },
    { year: 2, income: 115500 },
    { year: 3, income: 121275 },
    { year: 4, income: 127439 },
    { year: 5, income: 133811 },
    { year: 6, income: 140501 },
    { year: 7, income: 147526 },
    { year: 8, income: 154902 },
    { year: 9, income: 162747 },
    { year: 10, income: 170984 },
  ], []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans">
      {/* Header Section */}
      <header className="p-8 text-center bg-[#0d1526] shadow-md">
        <div className="flex flex-col items-center">
          <Building2 className="w-12 h-12 mb-4 text-teal-500" />
          <h1 className="text-4xl font-bold mb-4">DST Analyzer — Delaware Statutory Trust</h1>
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-amber-400" />
            <label htmlFor="relinquishedValue" className="mr-2">Relinquished Property Value:</label>
            <input
              type="number"
              id="relinquishedValue"
              value={relinquishedValue}
              onChange={(e) => setRelinquishedValue(Number(e.target.value))}
              className="p-2 rounded bg-gray-700 text-white border border-teal-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="$2,000,000"
            />
          </div>
        </div>
      </header>

      {/* 1031 Exchange into DST Section */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-teal-500">1031 Exchange into DST</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center">
            <TrendingUp className="w-8 h-8 mb-2 text-amber-400" />
            <h3 className="text-xl font-medium">Relinquished Property</h3>
            <p>${(relinquishedValue / 1000000).toFixed(1)}M (fully depreciated)</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center">
            <Shield className="w-8 h-8 mb-2 text-amber-400" />
            <h3 className="text-xl font-medium">Capital Gain Deferred</h3>
            <p>${(calculatedValues.capitalGainDeferred / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 mb-2 text-amber-400" />
            <h3 className="text-xl font-medium">Tax Deferred</h3>
            <p>${(calculatedValues.taxDeferred / 1000).toFixed(0)}K</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center">
            <ArrowRight className="w-8 h-8 mb-2 text-amber-400" />
            <h3 className="text-xl font-medium">DST Minimum Investment</h3>
            <p>${(calculatedValues.dstMinimumInvestment / 1000).toFixed(0)}K (fractional)</p>
          </div>
        </div>
      </section>

      {/* DST Portfolio Allocation Section */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-teal-500">DST Portfolio Allocation</h2>
        <p className="mb-4">Diversification across 5+ properties</p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 list-disc list-inside">
          <li>Multifamily: 35% (${(pieData[0].value / 1000).toFixed(0)}K)</li>
          <li>Industrial/Warehouse: 25% (${(pieData[1].value / 1000).toFixed(0)}K)</li>
          <li>Medical Office: 20% (${(pieData[2].value / 1000).toFixed(0)}K)</li>
          <li>Net Lease Retail: 15% (${(pieData[3].value / 1000).toFixed(0)}K)</li>
          <li>Self-Storage: 5% (${(pieData[4].value / 1000).toFixed(0)}K)</li>
        </ul>
      </section>

      {/* Income Projection Section */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-teal-500">Income Projection (10 Years)</h2>
        <p className="mb-4">Annual cash-on-cash: 5-6% | Year 1 income: ${areaData[0].income / 1000}K | Depreciation shelter: 60-80% of income | Taxable income after depreciation: $22K-$44K | Effective tax on distributions: 3-5%</p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#fbbf24" fill="#14b8a6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* DST vs Direct Ownership Comparison Section */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-teal-500">DST vs Direct Ownership</h2>
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0d1526]">
              <th className="p-4 border-b border-[#1e3a5f]">Feature</th>
              <th className="p-4 border-b border-[#1e3a5f]">DST</th>
              <th className="p-4 border-b border-[#1e3a5f]">Direct Ownership</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Management</td>
              <td>None (passive)</td>
              <td>Active</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Minimum</td>
              <td>$100K</td>
              <td>Full price</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Diversification</td>
              <td>Multiple properties</td>
              <td>Single</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">1031 Eligible</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Depreciation</td>
              <td>Pro-rata</td>
              <td>Full</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Liquidity</td>
              <td>Limited</td>
              <td>Limited</td>
            </tr>
            <tr>
              <td className="p-4">Leverage</td>
              <td>Pre-set</td>
              <td>Flexible</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      {/* Exit Strategies Section */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-teal-500">Exit Strategies</h2>
        <ul className="list-disc list-inside space-y-2">
          <li className="flex items-start"><Calendar className="w-5 h-5 mr-2 text-amber-400" /> Hold to maturity (5-10 years): full cycle return</li>
          <li className="flex items-start"><Target className="w-5 h-5 mr-2 text-amber-400" /> 1031 into another DST (perpetual deferral)</li>
          <li className="flex items-start"><MapPin className="w-5 h-5 mr-2 text-amber-400" /> 1031 into active property</li>
          <li className="flex items-start"><Users className="w-5 h-5 mr-2 text-amber-400" /> Die with stepped-up basis (IRC §1014)</li>
          <li className="flex items-start"><BarChart3 className="w-5 h-5 mr-2 text-amber-400" /> Charitable remainder trust exit</li>
        </ul>
      </section>

      {/* IRS Compliance Section */}
      <section className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-teal-500">IRS Compliance</h2>
        <ul className="list-disc list-inside space-y-2">
          <li className="flex items-start"><CheckCircle2 className="w-5 h-5 mr-2 text-amber-400" /> IRC §1031 like-kind exchange</li>
          <li className="flex items-start"><AlertTriangle className="w-5 h-5 mr-2 text-amber-400" /> Rev. Rul. 2004-86 (DST qualification)</li>
          <li className="flex items-start"><Shield className="w-5 h-5 mr-2 text-amber-400" /> IRC §1014 stepped-up basis at death</li>
          <li className="flex items-start"><ArrowRight className="w-5 h-5 mr-2 text-amber-400" /> 45-day identification / 180-day closing deadlines</li>
        </ul>
      </section>
      <PageInsights section="d-s-t-analyzer" />
    </div>
  );
};

export default DSTAnalyzer;
