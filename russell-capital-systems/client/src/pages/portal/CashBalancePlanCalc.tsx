// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, TrendingUp, Shield, Users, CheckCircle2, Calendar, Target, Building2, ArrowRight, Award, Scale } from 'lucide-react';
import { AreaChart as ReAreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart as ReBarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function CashBalancePlanCalc() {
  const [revenue, setRevenue] = useState(2000000);
  const [partners, setPartners] = useState(3);

  const calculateAccumulation = (annualContribution: number, years: number, rate: number): number => {
    return annualContribution * ((Math.pow(1 + rate, years) - 1) / rate);
  };

  const accumulationData = useMemo(() => {
    const data = [];
    for (let year = 1; year <= 15; year++) {
      data.push({
        year,
        partner1: calculateAccumulation(180000, year, 0.05),
        partner2: calculateAccumulation(140000, year, 0.05),
        partner3: calculateAccumulation(100000, year, 0.05),
      });
    }
    return data;
  }, []);

  const barChartData = [
    { name: 'Partner 1 (Age 55, $400K comp)', contribution: 180000 },
    { name: 'Partner 2 (Age 50, $350K comp)', contribution: 140000 },
    { name: 'Partner 3 (Age 45, $300K comp)', contribution: 100000 },
    { name: 'Staff (10 employees, avg $60K)', contribution: 48000 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-200 p-8 font-sans">
      {/* Header Section */}
      <header className="text-center mb-12">
        <div className="flex justify-center items-center mb-4">
          <Calculator className="mr-2 text-emerald-400" size={32} />
          <h1 className="text-4xl font-bold text-emerald-400">Cash Balance Plan Calculator</h1>
        </div>
        <div className="flex justify-center items-center space-x-4">
          <DollarSign className="text-indigo-400" size={24} />
          <label className="text-lg">Practice Revenue: $</label>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(Number(e.target.value))}
            className="bg-[#0d1526] border border-[#1e3a5f] rounded p-2 w-32 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Users className="text-indigo-400" size={24} />
          <label className="text-lg">Number of Partners:</label>
          <input
            type="number"
            value={partners}
            onChange={(e) => setPartners(Number(e.target.value))}
            className="bg-[#0d1526] border border-[#1e3a5f] rounded p-2 w-24 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </header>

      {/* Plan Structure Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center mb-4">
          <TrendingUp className="mr-2" size={24} />
          Plan Structure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center bg-[#0d1526] p-4 rounded shadow-lg">
            <Calculator className="mr-3 text-emerald-400" size={20} />
            <p>Pay Credit: 5-8% of compensation annually</p>
          </div>
          <div className="flex items-center bg-[#0d1526] p-4 rounded shadow-lg">
            <TrendingUp className="mr-3 text-emerald-400" size={20} />
            <p>Interest Credit: 5% guaranteed rate</p>
          </div>
          <div className="flex items-center bg-[#0d1526] p-4 rounded shadow-lg">
            <Shield className="mr-3 text-emerald-400" size={20} />
            <p>Hypothetical Account Balance grows each year</p>
          </div>
          <div className="flex items-center bg-[#0d1526] p-4 rounded shadow-lg">
            <Users className="mr-3 text-emerald-400" size={20} />
            <p>Vesting: 3-year cliff</p>
          </div>
        </div>
      </section>

      {/* Partner vs Employee Allocation Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center mb-4">
          <ArrowRight className="mr-2" size={24} />
          Partner vs Employee Allocation
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ReBarChart data={barChartData}>
            <XAxis dataKey="name" stroke="gray" angle={-45} textAnchor="end" />
            <YAxis stroke="gray" />
            <Tooltip />
            <Legend />
            <Bar dataKey="contribution" fill="#10B981" barSize={20} />
          </ReBarChart>
        </ResponsiveContainer>
        <p className="mt-4 text-[#94a3b8]">Partner 1: $180K contribution | Partner 2: $140K contribution | Partner 3: $100K contribution</p>
        <p className="text-[#94a3b8]">Staff total: $48K | Total plan cost: $468K | Partner share: 90% ($420K)</p>
      </section>

      {/* 15-Year Accumulation Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center mb-4">
          <Calendar className="mr-2" size={24} />
          15-Year Accumulation
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ReAreaChart data={accumulationData}>
            <XAxis dataKey="year" stroke="gray" />
            <YAxis stroke="gray" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="partner1" stroke="#10B981" fill="#10B981" />
            <Area type="monotone" dataKey="partner2" stroke="#6366F1" fill="#6366F1" />
            <Area type="monotone" dataKey="partner3" stroke="#EC4899" fill="#EC4899" />
          </ReAreaChart>
        </ResponsiveContainer>
        <p className="mt-4 text-[#94a3b8]">Partner 1: $180K/yr at 5% = $3.88M at retirement</p>
        <p className="text-[#94a3b8]">Partner 2: $140K/yr at 5% = $3.02M at retirement</p>
        <p className="text-[#94a3b8]">Partner 3: $100K/yr at 5% = $2.15M at retirement</p>
        <p className="text-[#94a3b8]">Combined partner wealth: $9.05M</p>
      </section>

      {/* Tax Impact Analysis Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center mb-4">
          <Target className="mr-2" size={24} />
          Tax Impact Analysis
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-[#94a3b8]">
          <li>Total annual deduction: $468K</li>
          <li>Tax savings at 37%: $173K</li>
          <li>State tax savings (5%): $23.4K</li>
          <li>Total annual tax savings: $196.4K</li>
          <li>15-year tax savings: $2.95M</li>
        </ul>
      </section>

      {/* Cash Balance vs Other Plans Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center mb-4">
          <Scale className="mr-2" size={24} />
          Cash Balance vs Other Plans
        </h2>
        <div className="overflow-x-auto"><table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#0d1526]">
              <th className="p-3 border-b border-[#1e3a5f]">Feature</th>
              <th className="p-3 border-b border-[#1e3a5f]">Cash Balance</th>
              <th className="p-3 border-b border-[#1e3a5f]">401(k)</th>
              <th className="p-3 border-b border-[#1e3a5f]">SEP IRA</th>
              <th className="p-3 border-b border-[#1e3a5f]">DB Plan</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-3">Max Contribution</td>
              <td>$280K+</td>
              <td>$31K</td>
              <td>$69K</td>
              <td>$350K+</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-3">Employee Cost</td>
              <td>Moderate</td>
              <td>Low</td>
              <td>Moderate</td>
              <td>High</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-3">Complexity</td>
              <td>Medium</td>
              <td>Low</td>
              <td>Low</td>
              <td>High</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-3">Portability</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>No</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-3">Predictability</td>
              <td>High</td>
              <td>Market</td>
              <td>Market</td>
              <td>High</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      {/* Practice Types Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center mb-4">
          <Building2 className="mr-2" size={24} />
          Practice Types (Who Benefits Most)
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-[#94a3b8]">
          <li>Medical practices (2-10 physicians)</li>
          <li>Law firms (partners 45+)</li>
          <li>Dental practices</li>
          <li>Accounting firms</li>
          <li>Architecture/engineering firms</li>
          <li>Any practice with older owners and younger staff</li>
        </ul>
      </section>

      {/* IRS Compliance Section */}
      <section>
        <h2 className="text-2xl font-semibold text-indigo-400 flex items-center mb-4">
          <Award className="mr-2" size={24} />
          IRS Compliance
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-[#94a3b8]">
          <li>IRC section 401(a)(11) cash balance requirements</li>
          <li>IRC section 415 contribution limits</li>
          <li>IRC section 411(a)(13) hybrid plan rules</li>
          <li>Pension Protection Act of 2006 safe harbor</li>
          <li>Nondiscrimination testing (gateway contribution)</li>
        </ul>
      </section>
      <PageInsights section="cash-balance-plan-calc" />
    </div>
  );
}
