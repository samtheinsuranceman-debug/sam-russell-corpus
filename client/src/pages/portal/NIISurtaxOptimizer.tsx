// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, Shield, CheckCircle2, AlertTriangle, Target, Zap, Scale, Percent, ArrowRight, BarChart3, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function NIISurtaxOptimizer() {
  const [magi, setMagi] = useState(500000); // Default MAGI
  const [nii, setNii] = useState(200000); // Default NII

  // Memoized calculations for surtax
  const excessMagi = useMemo(() => Math.max(magi - 250000, 0), [magi]);
  const surtaxBase = useMemo(() => Math.min(nii, excessMagi), [nii, excessMagi]);
  const surtax = useMemo(() => surtaxBase * 0.038, [surtaxBase]);

  // Sample data for Multi-Year Optimizer chart (5 years)
  const chartData = [
    { year: 1, surtax: 7600, reducedSurtax: 7600 },
    { year: 2, surtax: 7600, reducedSurtax: 6000 },
    { year: 3, surtax: 7600, reducedSurtax: 4000 },
    { year: 4, surtax: 7600, reducedSurtax: 2000 },
    { year: 5, surtax: 7600, reducedSurtax: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      {/* Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-emerald-400 flex items-center justify-center">
          <DollarSign className="mr-2" />
          NII Surtax Optimizer
        </h1>
        <div className="mt-6 flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center">
            <label className="mr-2 text-[#94a3b8]">MAGI: $</label>
            <input
              type="number"
              value={magi}
              onChange={(e) => setMagi(Number(e.target.value))}
              className="bg-[#0d1526] border border-[#1e3a5f] rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter MAGI"
            />
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-[#94a3b8]">NII: $</label>
            <input
              type="number"
              value={nii}
              onChange={(e) => setNii(Number(e.target.value))}
              className="bg-[#0d1526] border border-[#1e3a5f] rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter NII"
            />
          </div>
        </div>
      </header>

      {/* Surtax Calculation Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-emerald-400 mb-6">Surtax Calculation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-red-400">
              <Calculator className="mr-2" />
              MAGI: ${magi.toLocaleString()}
            </h3>
            <p className="text-[#94a3b8] mt-2">Your Modified Adjusted Gross Income (MAGI) is the starting point for surtax calculations.</p>
          </div>
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-red-400">
              <Percent className="mr-2" />
              NII: ${nii.toLocaleString()}
            </h3>
            <p className="text-[#94a3b8] mt-2">Net Investment Income (NII) includes investment gains, dividends, and interest.</p>
          </div>
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-emerald-400">
              <Scale className="mr-2" />
              MAGI over threshold: ${excessMagi.toLocaleString()}
            </h3>
            <p className="text-[#94a3b8] mt-2">Excess over $250K (MFJ): ${excessMagi.toLocaleString()}</p>
            <p className="text-[#94a3b8] mt-2">Surtax base: ${surtaxBase.toLocaleString()}</p>
            <p className="text-[#94a3b8] mt-2">3.8% Surtax: ${surtax.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Reduction Strategies Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-emerald-400 mb-6">Reduction Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Strategy 1 */}
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-red-400">
              <TrendingDown className="mr-2" />
              Strategy 1: Shift to tax-exempt bonds
            </h3>
            <p className="text-[#94a3b8] mt-2">Move $100K from taxable bonds to munis.</p>
            <p className="text-[#94a3b8] mt-2">NII reduced by $4K/yr.</p>
            <p className="text-[#94a3b8] mt-2">Surtax saved: $152/yr.</p>
          </div>

          {/* Strategy 2 */}
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-emerald-400">
              <Shield className="mr-2" />
              Strategy 2: Maximize retirement contributions
            </h3>
            <p className="text-[#94a3b8] mt-2">$23,500 401(k) + $7,500 catch-up = $31K.</p>
            <p className="text-[#94a3b8] mt-2">Reduces MAGI by $31K.</p>
            <p className="text-[#94a3b8] mt-2">Surtax saved: $1,178.</p>
          </div>

          {/* Strategy 3 */}
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-red-400">
              <CheckCircle2 className="mr-2" />
              Strategy 3: Real estate professional status
            </h3>
            <p className="text-[#94a3b8] mt-2">750+ hours in real estate activities.</p>
            <p className="text-[#94a3b8] mt-2">Rental losses offset NII.</p>
            <p className="text-[#94a3b8] mt-2">Potential NII reduction: $50K+.</p>
          </div>

          {/* Strategy 4 */}
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-emerald-400">
              <AlertTriangle className="mr-2" />
              Strategy 4: Oil and gas working interests
            </h3>
            <p className="text-[#94a3b8] mt-2">Active income (not NII).</p>
            <p className="text-[#94a3b8] mt-2">$100K O&amp;G income excluded from NII.</p>
            <p className="text-[#94a3b8] mt-2">Surtax saved: $3,800.</p>
          </div>

          {/* Strategy 5 */}
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-red-400">
              <Target className="mr-2" />
              Strategy 5: Installment sales
            </h3>
            <p className="text-[#94a3b8] mt-2">Spread gain over multiple years.</p>
            <p className="text-[#94a3b8] mt-2">Keep MAGI below threshold in each year.</p>
            <p className="text-[#94a3b8] mt-2">Potential full surtax elimination.</p>
          </div>

          {/* Strategy 6 */}
          <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg border border-[#1e3a5f]">
            <h3 className="text-xl font-medium flex items-center text-emerald-400">
              <Zap className="mr-2" />
              Strategy 6: Opportunity Zone investment
            </h3>
            <p className="text-[#94a3b8] mt-2">Defer and reduce capital gains.</p>
            <p className="text-[#94a3b8] mt-2">Potential 10-15% basis step-up.</p>
            <p className="text-[#94a3b8] mt-2">Eliminate surtax on OZ gains after 10 years.</p>
          </div>
        </div>
      </section>

      {/* Multi-Year Optimizer Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-emerald-400 mb-6">Multi-Year Optimizer</h2>
        <p className="text-[#94a3b8] mb-4">Shows how combining strategies reduces surtax over 5 years.</p>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <XAxis dataKey="year" stroke="white" />
            <YAxis stroke="white" />
            <Tooltip wrapperStyle={{ color: 'black' }} />
            <Legend />
            <Bar dataKey="surtax" fill="#EF4444" name="Original Surtax" />
            <Line type="monotone" dataKey="reducedSurtax" stroke="#10B981" strokeWidth={2} name="Reduced Surtax" />
            <Area type="monotone" dataKey="reducedSurtax" fill="#10B981" fillOpacity={0.3} stroke="#10B981" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* IRS Compliance Section */}
      <section>
        <h2 className="text-3xl font-semibold text-red-400 mb-6">IRS Compliance</h2>
        <ul className="list-disc pl-6 text-[#94a3b8]">
          <li className="mb-2">IRC §1411: Net Investment Income Tax - Imposes a 3.8% surtax on investment income for high earners above $250K (MFJ).</li>
          <li className="mb-2">IRC §469: Passive activity rules - Limits deductions from passive activities, affecting NII calculations.</li>
          <li className="mb-2">IRC §1400Z-2: Opportunity Zones - Allows deferral and reduction of capital gains invested in qualified opportunity zones.</li>
          <li className="mb-2">Treas. Reg. §1.1411-4: Definition of Net Investment Income - Outlines what constitutes NII for surtax purposes.</li>
        </ul>
      </section>
      <PageInsights section="n-i-i-surtax-optimizer" />
    </div>
  );
}
