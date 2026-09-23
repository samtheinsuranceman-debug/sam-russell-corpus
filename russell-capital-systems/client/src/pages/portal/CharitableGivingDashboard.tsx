// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Heart, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Gift, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { PageInsights } from "@/components/PageInsights";
import { federalStandardDeduction, FEDERAL_RATES_SOURCE } from "@shared/taxBracketEngine";

export default function CharitableGivingDashboard() {
  const [adjustedGrossIncome, setAdjustedGrossIncome] = useState(100000);
  const [charitableDeduction, setCharitableDeduction] = useState(20000);
  const [bunchingAmount, setBunchingAmount] = useState(5000);
  const [allocationData, setAllocationData] = useState([
    { name: 'Education', value: 3000 },
    { name: 'Health', value: 4000 },
    { name: 'Environment', value: 3000 },
  ]);
  const [projectionData, setProjectionData] = useState([
    { year: 2023, impact: 5000 },
    { year: 2024, impact: 6000 },
    { year: 2025, impact: 7000 },
    { year: 2026, impact: 8000 },
    { year: 2027, impact: 9000 },
    { year: 2028, impact: 10000 },
    { year: 2029, impact: 11000 },
    { year: 2030, impact: 12000 },
    { year: 2031, impact: 13000 },
    { year: 2032, impact: 14000 },
    { year: 2033, impact: 15000 },
  ]);

  const COLORS = ['#10B981', '#D4AF37', '#047857', '#F59E0B', '#65A30D'];

  const optimizedBudget = useMemo(() => {
    const limit = adjustedGrossIncome * 0.6;
    return Math.min(charitableDeduction, limit);
  }, [adjustedGrossIncome, charitableDeduction]);

  const bunchingStrategy = useMemo(() => {
    const standardDeduction = federalStandardDeduction("single"); // current-year single-filer figure, shared/taxRules.ts
    const itemizedDeduction = bunchingAmount + charitableDeduction;
    return itemizedDeduction > standardDeduction ? 'Itemized is better' : 'Standard is better';
  }, [bunchingAmount, charitableDeduction]);

  return (
    <div className="bg-[#0a0f1a] text-white min-h-screen p-8 font-sans">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-emerald-400">Charitable Giving Dashboard</h1>
        <Heart className="text-gold-400" size={32} />
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Side-by-side Comparison of Charitable Vehicles */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-emerald-300">
            <Scale className="mr-2" /> Charitable Vehicles Comparison
          </h2>
          <div className="overflow-x-auto"><table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1e3a5f]">
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Description</th>
                <th className="pb-2">Pros</th>
                <th className="pb-2">Cons</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1e3a5f]">
                <td className="py-2">CRT (Charitable Remainder Trust)</td>
                <td>IRC Sec. 664 - Provides income stream, remainder to charity</td>
                <td>Tax deduction, income for life</td>
                <td>Complex setup, irrevocable</td>
              </tr>
              <tr className="border-b border-[#1e3a5f]">
                <td className="py-2">CLT (Charitable Lead Trust)</td>
                <td>Income to charity first, remainder to beneficiaries</td>
                <td>Reduces estate taxes</td>
                <td>Upfront costs, less flexibility</td>
              </tr>
              <tr className="border-b border-[#1e3a5f]">
                <td className="py-2">DAF (Donor-Advised Fund)</td>
                <td>IRC Sec. 4966 - Immediate deduction, advise grants</td>
                <td>Easy setup, tax benefits</td>
                <td>Funds locked in, excise taxes</td>
              </tr>
              <tr className="border-b border-[#1e3a5f]">
                <td className="py-2">QCD (Qualified Charitable Distribution)</td>
                <td>IRC Sec. 408(d)(8) - From IRA to charity, no tax</td>
                <td>Avoids income tax on distribution</td>
                <td>Only for those 70.5+, limits apply</td>
              </tr>
              <tr className="border-b border-[#1e3a5f]">
                <td className="py-2">PIF (Private Foundation)</td>
                <td>Control over grants and investments</td>
                <td>Full control, family involvement</td>
                <td>High costs, strict regulations</td>
              </tr>
              <tr className="border-b border-[#1e3a5f]">
                <td className="py-2">Direct Gift</td>
                <td>Straight donation to charity</td>
                <td>Simple, immediate impact</td>
                <td>Limited deductions, no income stream</td>
              </tr>
              <tr className="border-b border-[#1e3a5f]">
                <td className="py-2">Bargain Sale</td>
                <td>Sell asset to charity at discount</td>
                <td>Partial deduction, capital gains savings</td>
                <td>Must be qualified charity</td>
              </tr>
            </tbody>
          </table></div>
        </section>

        {/* Annual Giving Budget Optimizer */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-gold-300">
            <DollarSign className="mr-2" /> Annual Giving Budget Optimizer
          </h2>
          <div className="mb-4">
            <label className="block mb-2">Adjusted Gross Income:</label>
            <input
              type="number"
              value={adjustedGrossIncome}
              onChange={(e) => setAdjustedGrossIncome(Number(e.target.value))}
              className="bg-gray-700 p-2 rounded w-full text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Charitable Deduction:</label>
            <input
              type="number"
              value={charitableDeduction}
              onChange={(e) => setCharitableDeduction(Number(e.target.value))}
              className="bg-gray-700 p-2 rounded w-full text-white"
            />
          </div>
          <p className="text-emerald-400">Optimized Deduction: ${optimizedBudget.toFixed(2)}</p>
          <p className="text-sm mt-2">Based on IRC 170 limits (up to 60% of AGI).</p>
        </section>

        {/* Bunching Strategy Calculator */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-emerald-300">
            <Percent className="mr-2" /> Bunching Strategy Calculator
          </h2>
          <div className="mb-4">
            <label className="block mb-2">Bunching Amount:</label>
            <input
              type="number"
              value={bunchingAmount}
              onChange={(e) => setBunchingAmount(Number(e.target.value))}
              className="bg-gray-700 p-2 rounded w-full text-white"
            />
          </div>
          <p className="text-gold-400">Strategy: {bunchingStrategy}</p>
          <p className="text-xs text-gray-500">Standard deduction source: {FEDERAL_RATES_SOURCE.short}, single filer.</p>
          <p className="text-sm mt-2">Compares standard deduction vs. itemized for bunching donations.</p>
        </section>

        {/* 10-Year Charitable Impact Projection */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-gold-300">
            <TrendingUp className="mr-2" /> 10-Year Charitable Impact Projection
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData}>
              <XAxis dataKey="year" stroke="#D4AF37" />
              <YAxis stroke="#10B981" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="impact" stroke="#10B981" fill="#047857" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-sm mt-2">Projected impact based on annual growth assumptions.</p>
        </section>

        {/* Giving Allocation Pie Chart */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-emerald-300">
            <PieChart className="mr-2" /> Giving Allocation Pie Chart
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* Compliance Information */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-gold-300">
            <Shield className="mr-2" /> Compliance and Tax Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-medium flex items-center text-emerald-400">
                <CheckCircle2 className="mr-2" /> IRC 170 Limits
              </h3>
              <ul className="list-disc pl-5">
                <li>60% for cash gifts to public charities</li>
                <li>30% for appreciated assets</li>
                <li>20% for private foundations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium flex items-center text-emerald-400">
                <AlertTriangle className="mr-2" /> Section 664 (CRT)
              </h3>
              <p>Rules for charitable remainder trusts, ensuring charitable intent.</p>
            </div>
            <div>
              <h3 className="text-xl font-medium flex items-center text-emerald-400">
                <Target className="mr-2" /> Section 4966 (DAF)
              </h3>
              <p>Excise taxes on taxable distributions from donor-advised funds.</p>
            </div>
            <div>
              <h3 className="text-xl font-medium flex items-center text-emerald-400">
                <Calendar className="mr-2" /> Section 408(d)(8) (QCD)
              </h3>
              <p>Qualified distributions from IRAs for those 70.5+, up to $100,000/year.</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xl font-medium flex items-center text-gold-400">
                <ArrowRight className="mr-2" /> Section 642(c) (Estate Deduction)
              </h3>
              <p>Allows deduction for bequests to qualified charities in estates.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-8 text-center text-[#7a95b8]">
        <p>Powered by advanced charitable strategies. Use <Gift className="inline" size={16} /> for good.</p>
      </footer>
      <PageInsights section="charitable-giving-dashboard" />
    </div>
  );
}
