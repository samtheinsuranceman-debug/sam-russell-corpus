// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Crown, Users, DollarSign, TrendingUp, Shield, CheckCircle2, Calendar, Target, ArrowRight, Building2, Heart, Scale } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, LineChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";
import { rulesForYear } from "@shared/taxRules";
// Federal estate/GST exemption: $15,000,000 per person in 2026, indexed, no sunset — P.L. 119-21 § 70106 amending IRC § 2010(c)(3), https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf; Rev. Proc. 2025-32, https://www.irs.gov/pub/irs-drop/rp-25-32.pdf (read 23 Sep 2026).
// Replaces the 2024 figure, $13,610,000.
const ESTATE_EXCLUSION_2026 = rulesForYear(2026).estateBasicExclusion;

export default function DynastyTrustPlanner() {
  const [initialFunding, setInitialFunding] = useState(ESTATE_EXCLUSION_2026); // Default: the 2026 GST exemption, $15,000,000

  const growthRate = 0.08; // 8% annual growth
  const years = 150;

  const data = useMemo(() => {
    let wealth = initialFunding;
    return Array.from({ length: years }, (_, year) => {
      wealth *= (1 + growthRate);
      return { year: year + 1, wealth: wealth };
    });
  }, [initialFunding]);

  const taxSavings = [
    { generation: 'Gen 1', avoided: 54400000 }, // $54.4M
    { generation: 'Gen 2', avoided: 544000000 }, // $544M
    { generation: 'Gen 3', avoided: 5440000000 }, // $5.44B
    { generation: 'Gen 4', avoided: 54400000000 }, // $54.4B
    { generation: 'Gen 5', avoided: 544000000000 }, // $544B
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      {/* Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-indigo-400 flex items-center justify-center">
          <Crown className="mr-3" size={48} />
          Dynasty Trust Planner
        </h1>
        <div className="mt-6 flex justify-center items-center">
          <label htmlFor="initialFunding" className="mr-4 text-xl font-semibold text-yellow-400">
            Initial Funding:
          </label>
          <input
            type="number"
            id="initialFunding"
            value={initialFunding}
            onChange={(e) => setInitialFunding(Number(e.target.value))}
            className="bg-[#0d1526] border-2 border-indigo-500 text-white px-4 py-2 rounded-md w-48 focus:outline-none focus:border-yellow-400"
            placeholder="$15,000,000"
          />
        </div>
      </header>

      {/* Trust Structure Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-indigo-400 mb-6 text-center">Trust Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-indigo-500">
            <h3 className="flex items-center text-2xl font-semibold mb-2">
              <DollarSign className="mr-2" size={24} /> Initial Funding
            </h3>
            <p className="text-lg">${(initialFunding / 1e6).toFixed(2)}M (2025 GST exemption)</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-yellow-400">
            <h3 className="flex items-center text-2xl font-semibold mb-2">
              <TrendingUp className="mr-2" size={24} /> Growth Rate
            </h3>
            <p className="text-lg">8% annually</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-indigo-500">
            <h3 className="flex items-center text-2xl font-semibold mb-2">
              <Calendar className="mr-2" size={24} /> Trust Duration
            </h3>
            <p className="text-lg">Perpetual (in favorable states)</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-yellow-400">
            <h3 className="flex items-center text-2xl font-semibold mb-2">
              <Users className="mr-2" size={24} /> Beneficiaries
            </h3>
            <p className="text-lg">5 generations</p>
          </div>
        </div>
      </section>

      {/* Generational Wealth Projection Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">Generational Wealth Projection</h2>
        <p className="text-lg mb-4 text-[#94a3b8]">
          Gen 1 (Years 1-30): ${initialFunding / 1e6}M → $136M
        </p>
        <p className="text-lg mb-4 text-[#94a3b8]">
          Gen 2 (Years 31-60): $136M → $1.36B
        </p>
        <p className="text-lg mb-4 text-[#94a3b8]">
          Gen 3 (Years 61-90): $1.36B → $13.6B
        </p>
        <p className="text-lg mb-4 text-[#94a3b8]">
          Gen 4 (Years 91-120): $13.6B → $136B
        </p>
        <p className="text-lg mb-4 text-[#94a3b8]">
          Gen 5 (Years 121-150): $136B → $1.36T
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <XAxis dataKey="year" stroke="#818cf8" />
            <YAxis stroke="#818cf8" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="wealth" stroke="#ECC94B" fill="#6366f1" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-4 text-lg text-[#94a3b8]">All growth is estate-tax-free, income-tax-free inside trust</p>
      </section>

      {/* Tax Savings Per Generation Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-indigo-400 mb-6">Tax Savings Per Generation</h2>
        <p className="text-lg mb-4 text-[#94a3b8]">
          Gen 1: $54.4M estate tax avoided (40% of $136M)
        </p>
        <p className="text-lg mb-4 text-[#94a3b8]">Gen 2: $544M avoided</p>
        <p className="text-lg mb-4 text-[#94a3b8]">Gen 3: $5.44B avoided</p>
        <p className="text-lg mb-4 text-[#94a3b8]">Gen 4: $54.4B avoided</p>
        <p className="text-lg mb-4 text-[#94a3b8]">Gen 5: $544B avoided</p>
        <p className="text-lg mb-4 text-[#94a3b8]">Total: $604B+ in taxes avoided over 150 years</p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={taxSavings}>
            <XAxis dataKey="generation" stroke="#ECC94B" />
            <YAxis stroke="#ECC94B" />
            <Tooltip />
            <Legend />
            <Bar dataKey="avoided" fill="#818cf8" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Distribution Strategy Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">Distribution Strategy</h2>
        <ul className="list-disc pl-8 space-y-2 text-lg">
          <li className="flex items-start">
            <Shield className="mr-2 mt-1" size={20} /> HEMS standard (Health, Education, Maintenance, Support)
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="mr-2 mt-1" size={20} /> Annual distributions: 3-5% of trust value
          </li>
          <li className="flex items-start">
            <Users className="mr-2 mt-1" size={20} /> Trustee discretion for larger needs
          </li>
          <li className="flex items-start">
            <Building2 className="mr-2 mt-1" size={20} /> Spendthrift protection from creditors
          </li>
          <li className="flex items-start">
            <Heart className="mr-2 mt-1" size={20} /> Divorce protection for beneficiaries
          </li>
        </ul>
      </section>

      {/* State Comparison Table Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-indigo-400 mb-6">State Comparison</h2>
        <div className="overflow-x-auto"><table className="w-full border-collapse text-lg">
          <thead>
            <tr className="bg-[#0d1526] text-left">
              <th className="p-4 border border-[#1e3a5f]">State</th>
              <th className="p-4 border border-[#1e3a5f]">Max Duration</th>
              <th className="p-4 border border-[#1e3a5f]">Income Tax</th>
              <th className="p-4 border border-[#1e3a5f]">Asset Protection</th>
              <th className="p-4 border border-[#1e3a5f]">Rating</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-700 even:bg-[#0d1526]">
              <td className="p-4 border border-[#1e3a5f]">South Dakota</td>
              <td className="p-4 border border-[#1e3a5f]">Perpetual</td>
              <td className="p-4 border border-[#1e3a5f]">None</td>
              <td className="p-4 border border-[#1e3a5f]">Strongest</td>
              <td className="p-4 border border-[#1e3a5f]">⭐⭐⭐⭐⭐</td>
            </tr>
            <tr className="bg-gray-700 even:bg-[#0d1526]">
              <td className="p-4 border border-[#1e3a5f]">Nevada</td>
              <td className="p-4 border border-[#1e3a5f]">365 years</td>
              <td className="p-4 border border-[#1e3a5f]">None</td>
              <td className="p-4 border border-[#1e3a5f]">Strong</td>
              <td className="p-4 border border-[#1e3a5f]">⭐⭐⭐⭐⭐</td>
            </tr>
            <tr className="bg-gray-700 even:bg-[#0d1526]">
              <td className="p-4 border border-[#1e3a5f]">Delaware</td>
              <td className="p-4 border border-[#1e3a5f]">Perpetual</td>
              <td className="p-4 border border-[#1e3a5f]">None (for non-residents)</td>
              <td className="p-4 border border-[#1e3a5f]">Strong</td>
              <td className="p-4 border border-[#1e3a5f]">⭐⭐⭐⭐</td>
            </tr>
            <tr className="bg-gray-700 even:bg-[#0d1526]">
              <td className="p-4 border border-[#1e3a5f]">Alaska</td>
              <td className="p-4 border border-[#1e3a5f]">1000 years</td>
              <td className="p-4 border border-[#1e3a5f]">None</td>
              <td className="p-4 border border-[#1e3a5f]">Strong</td>
              <td className="p-4 border border-[#1e3a5f]">⭐⭐⭐⭐</td>
            </tr>
            <tr className="bg-gray-700 even:bg-[#0d1526]">
              <td className="p-4 border border-[#1e3a5f]">Wyoming</td>
              <td className="p-4 border border-[#1e3a5f]">1000 years</td>
              <td className="p-4 border border-[#1e3a5f]">None</td>
              <td className="p-4 border border-[#1e3a5f]">Strong</td>
              <td className="p-4 border border-[#1e3a5f]">⭐⭐⭐⭐</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      {/* Funding Strategies Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">Funding Strategies</h2>
        <ul className="list-disc pl-8 space-y-2 text-lg">
          <li className="flex items-start">
            <ArrowRight className="mr-2 mt-1" size={20} /> Direct gift ($15M GST exemption, 2026)
          </li>
          <li className="text-xs text-gray-400">Source: P.L. 119-21 § 70106 (IRC § 2010(c)(3)); Rev. Proc. 2025-32 — $15M per person for 2026, indexed, no sunset.</li>
          <li className="flex items-start">
            <Target className="mr-2 mt-1" size={20} /> IDGT sale (freeze value, remove appreciation)
          </li>
          <li className="flex items-start">
            <Scale className="mr-2 mt-1" size={20} /> GRAT remainder (zero-out GRAT to dynasty trust)
          </li>
          <li className="flex items-start">
            <Heart className="mr-2 mt-1" size={20} /> Life insurance (ILIT funding dynasty trust)
          </li>
        </ul>
      </section>

      {/* IRS Compliance Section */}
      <section>
        <h2 className="text-3xl font-bold text-indigo-400 mb-6">IRS Compliance</h2>
        <ul className="list-disc pl-8 space-y-2 text-lg">
          <li>IRC §2601 GST tax exemption</li>
          <li>IRC §2611 generation-skipping transfer</li>
          <li>IRC §2642 inclusion ratio</li>
          <li>IRC § - Annual exclusion gifts ($18K/beneficiary)</li>
        </ul>
      </section>
      <PageInsights section="dynasty-trust-planner" />
    </div>
  );
}
