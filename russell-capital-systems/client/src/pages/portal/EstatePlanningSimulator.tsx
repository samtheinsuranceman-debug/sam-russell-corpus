// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Shield, Users, Home, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Scale, FileText, Heart, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const EstatePlanningSimulator = () => {
  const [estateValue, setEstateValue] = useState(12500000); // Default estate value
  const [withTrust, setWithTrust] = useState(false); // Toggle for trust planning

  // Memoized calculations for performance
  const currentExemption = useMemo(() => 13610000, []); // 2025 exemption
  const taxableEstate = useMemo(() => Math.max(estateValue - currentExemption, 0), [estateValue, currentExemption]);
  const estateTaxRate = 0.40; // 40% tax rate

  // Data for Scenario Simulator
  const withoutTrustData = [
    { generation: 'Gen 1', value: 12500000 },
    { generation: 'Gen 2', value: 7500000 },
    { generation: 'Gen 3', value: 4500000 },
    { generation: 'Gen 4', value: 2700000 },
  ];

  const withTrustData = [
    { generation: 'Gen 1', value: 12500000 },
    { generation: 'Gen 2', value: 18000000 },
    { generation: 'Gen 3', value: 26000000 },
    { generation: 'Gen 4', value: 38000000 },
  ];

  // Data for Tax Savings Waterfall
  const savingsData = [
    { name: 'ILIT', savings: 2400000 },
    { name: 'SLAT', savings: 1800000 },
    { name: 'Dynasty', savings: 3200000 },
    { name: 'QPRT', savings: 800000 },
    { name: 'Total', savings: 8200000 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-indigo-400">Estate Planning Simulator</h1>
        <div className="flex items-center">
          <label className="mr-2 text-[#94a3b8]">Estate Value: </label>
          <input
            type="number"
            value={estateValue}
            onChange={(e) => setEstateValue(Number(e.target.value))}
            className="bg-[#0d1526] p-2 rounded border border-indigo-500 text-white"
            placeholder="$12,500,000"
          />
        </div>
      </div>

      {/* Estate Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0d1526] p-4 rounded shadow-lg flex flex-col items-center">
          <h2 className="flex items-center text-emerald-400 mb-2"><DollarSign className="mr-2" size={20} /> Gross Estate</h2>
          <p className="text-lg">${(estateValue / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-[#0d1526] p-4 rounded shadow-lg flex flex-col items-center">
          <h2 className="flex items-center text-emerald-400 mb-2"><Shield className="mr-2" size={20} /> Current Exemption</h2>
          <p className="text-lg">${(currentExemption / 1000000).toFixed(2)}M (2025)</p>
        </div>
        <div className="bg-[#0d1526] p-4 rounded shadow-lg flex flex-col items-center">
          <h2 className="flex items-center text-indigo-400 mb-2"><AlertTriangle className="mr-2" size={20} /> Taxable Estate</h2>
          <p className="text-lg">${(taxableEstate / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-[#0d1526] p-4 rounded shadow-lg flex flex-col items-center">
          <h2 className="flex items-center text-indigo-400 mb-2"><Scale className="mr-2" size={20} /> Estate Tax Rate</h2>
          <p className="text-lg">40% on excess</p>
        </div>
      </div>

      {/* Trust Comparison Table Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-emerald-400 mb-4">Trust Comparison</h2>
        <div className="overflow-x-auto"><table className="w-full bg-[#0d1526] rounded border border-[#1e3a5f]">
          <thead>
            <tr className="text-left text-indigo-300">
              <th className="p-2">Trust</th>
              <th className="p-2">Assets Protected</th>
              <th className="p-2">Tax Benefit</th>
              <th className="p-2">Control</th>
              <th className="p-2">Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[#1e3a5f]">
              <td className="p-2">ILIT</td>
              <td className="p-2">Life insurance</td>
              <td className="p-2">Remove from estate</td>
              <td className="p-2">Trustee</td>
              <td className="p-2">Estate tax elimination</td>
            </tr>
            <tr className="border-t border-[#1e3a5f]">
              <td className="p-2">SLAT</td>
              <td className="p-2">$6.8M per spouse</td>
              <td className="p-2">Gift tax exemption</td>
              <td className="p-2">Limited</td>
              <td className="p-2">Married couples</td>
            </tr>
            <tr className="border-t border-[#1e3a5f]">
              <td className="p-2">Dynasty Trust</td>
              <td className="p-2">Multi-generational</td>
              <td className="p-2">GST tax avoidance</td>
              <td className="p-2">Trustee</td>
              <td className="p-2">Wealth transfer</td>
            </tr>
            <tr className="border-t border-[#1e3a5f]">
              <td className="p-2">QPRT</td>
              <td className="p-2">Primary residence</td>
              <td className="p-2">Reduced gift value</td>
              <td className="p-2">Retain use</td>
              <td className="p-2">Homeowners</td>
            </tr>
            <tr className="border-t border-[#1e3a5f]">
              <td className="p-2">CRT</td>
              <td className="p-2">Charitable assets</td>
              <td className="p-2">Income tax deduction</td>
              <td className="p-2">Charity</td>
              <td className="p-2">Philanthropic clients</td>
            </tr>
            <tr className="border-t border-[#1e3a5f]">
              <td className="p-2">IDGT</td>
              <td className="p-2">Business interests</td>
              <td className="p-2">Freeze estate value</td>
              <td className="p-2">Grantor</td>
              <td className="p-2">Business owners</td>
            </tr>
          </tbody>
        </table></div>
      </div>

      {/* Scenario Simulator Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Scenario Simulator</h2>
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setWithTrust(!withTrust)}
            className={`px-4 py-2 rounded ${withTrust ? 'bg-emerald-500' : 'bg-indigo-500'} hover:opacity-80 transition`}
          >
            {withTrust ? 'With Trust Planning' : 'Without Trust Planning'}
          </button>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={withTrust ? withTrustData : withoutTrustData}>
            <XAxis dataKey="generation" stroke="white" />
            <YAxis stroke="white" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Exemption Sunset Warning Section */}
      <div className="mb-8 bg-yellow-900 p-4 rounded shadow flex items-center border-l-4 border-yellow-500">
        <AlertTriangle className="mr-2 text-yellow-500" size={24} />
        <div>
          <h2 className="font-bold text-yellow-300">2025 Exemption Sunset Warning</h2>
          <p className="text-gray-200">Exemption of $13.61M sunsets to ~$7M in 2026</p>
          <p className="text-gray-200">Impact: Additional $5.5M exposed to 40% tax = $2.2M tax hit</p>
          <div className="bg-[#0d1526] h-4 rounded mt-2 relative">
            <div className="bg-red-500 h-full w-3/4"></div> {/* Urgency meter */}
            <span className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-1 text-xs text-white">Urgency: High (75%)</span>
          </div>
        </div>
      </div>

      {/* Generation Transfer Timeline Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-emerald-400 mb-4">Generation Transfer Timeline</h2>
        <div className="flex justify-around items-center">
          <div className="text-center">
            <h3 className="text-indigo-300">Gen 1 → Gen 2</h3>
            <p className="text-[#94a3b8]">SLAT + ILIT</p>
          </div>
          <ArrowRight className="text-emerald-400" size={24} />
          <div className="text-center">
            <h3 className="text-indigo-300">Gen 2 → Gen 3</h3>
            <p className="text-[#94a3b8]">Dynasty</p>
          </div>
          <ArrowRight className="text-emerald-400" size={24} />
          <div className="text-center">
            <h3 className="text-indigo-300">Gen 3 → Gen 4</h3>
            <p className="text-[#94a3b8]">Continued</p>
          </div>
        </div>
      </div>

      {/* Tax Savings Waterfall Section */}
      <div>
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Tax Savings Waterfall</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={savingsData}>
            <XAxis dataKey="name" stroke="white" />
            <YAxis stroke="white" />
            <Tooltip />
            <Legend />
            <Bar dataKey="savings" fill="#82ca9d" /> {/* Emerald accent */}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <PageInsights section="estate-planning-simulator" />
    </div>
  );
};

export default EstatePlanningSimulator;
