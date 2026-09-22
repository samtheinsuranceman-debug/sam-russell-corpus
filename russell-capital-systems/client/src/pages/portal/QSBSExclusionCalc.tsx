// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Zap, Lock, Scale, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function QSBSExclusionCalc() {
  const [basis, setBasis] = useState(500000); // Default investment basis
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

  // Calculate maximum exclusion: Greater of $10M or 10x basis
  const maxExclusion = useMemo(() => {
    const tenTimesBasis = basis * 10;
    return Math.max(10000000, tenTimesBasis);
  }, [basis]);

  // Applicable exclusion as per requirements
  const applicableExclusion = 10000000; // $10M

  // Tax savings calculation at 23.8% rate
  const taxSavings = useMemo(() => (applicableExclusion * 0.238).toFixed(0), [applicableExclusion]);

  // Holding period calculations
  const fiveYearsLater = new Date(acquisitionDate);
  fiveYearsLater.setFullYear(fiveYearsLater.getFullYear() + 5);
  const daysRemaining = Math.ceil((fiveYearsLater - new Date()) / (1000 * 60 * 60 * 24));
  const status = daysRemaining <= 0 ? '✅ Qualified' : daysRemaining > 0 && daysRemaining < 1825 ? '⏳ Pending' : '❌ Not Yet'; // 5 years = 1825 days

  // Chart data for exclusion scenarios
  const chartData = [
    { name: '$5M exit', SalePrice: 5000000, Gain: 4500000, Exclusion: 4500000, TaxOwed: 0, TaxSaved: 1070000 },
    { name: '$10M exit', SalePrice: 10000000, Gain: 9500000, Exclusion: 9500000, TaxOwed: 0, TaxSaved: 2260000 },
    { name: '$20M exit', SalePrice: 20000000, Gain: 19500000, Exclusion: 10000000, TaxOwed: 2260000, TaxSaved: 2380000 },
    { name: '$50M exit', SalePrice: 50000000, Gain: 49500000, Exclusion: 10000000, TaxOwed: 9400000, TaxSaved: 2380000 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 p-8 font-sans">
      {/* Header Section */}
      <header className="flex flex-col items-center justify-center mb-12">
        <h1 className="text-5xl font-bold text-emerald-400 mb-4">QSBS Exclusion Calculator</h1>
        <div className="flex items-center">
          <DollarSign className="mr-2 text-blue-400" size={24} />
          <label className="text-xl">Investment Basis: </label>
          <input
            type="number"
            value={basis}
            onChange={(e) => setBasis(Number(e.target.value))}
            className="ml-2 bg-[#0d1526] border border-blue-500 rounded p-2 text-white w-48"
            placeholder="$500,000"
          />
        </div>
      </header>

      {/* Exclusion Analysis Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-emerald-500">
          <h2 className="flex items-center text-2xl font-semibold mb-2">
            <Building2 className="mr-2" size={24} /> Investment Basis
          </h2>
          <p className="text-xl">${basis.toLocaleString()}</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
          <h2 className="flex items-center text-2xl font-semibold mb-2">
            <TrendingUp className="mr-2" size={24} /> Maximum Exclusion
          </h2>
          <p className="text-xl">${maxExclusion.toLocaleString()}</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-emerald-500">
          <h2 className="flex items-center text-2xl font-semibold mb-2">
            <Shield className="mr-2" size={24} /> Applicable Exclusion
          </h2>
          <p className="text-xl">$10,000,000</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
          <h2 className="flex items-center text-2xl font-semibold mb-2">
            <Award className="mr-2" size={24} /> Tax Savings at 23.8%
          </h2>
          <p className="text-xl">${taxSavings}</p>
        </div>
      </section>

      {/* Holding Period Tracker */}
      <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-3xl font-bold mb-4 flex items-center">
          <Calendar className="mr-2" size={28} /> Holding Period Tracker
        </h2>
        <div className="mb-4">
          <label className="block mb-2">Acquisition Date: </label>
          <input
            type="date"
            value={acquisitionDate}
            onChange={(e) => setAcquisitionDate(e.target.value)}
            className="bg-gray-700 border border-blue-500 rounded p-2 w-full text-white"
          />
        </div>
        <p className="mb-2">5-Year Requirement: Must hold for 5+ years</p>
        <p className="mb-2">Days Remaining: {daysRemaining > 0 ? daysRemaining : 0}</p>
        <p className="flex items-center">
          {status === '✅ Qualified' && <CheckCircle2 className="mr-2 text-emerald-500" size={20} />}
          {status === '⏳ Pending' && <AlertTriangle className="mr-2 text-yellow-500" size={20} />}
          {status === '❌ Not Yet' && <AlertTriangle className="mr-2 text-red-500" size={20} />}
          Status: {status}
        </p>
      </section>

      {/* Exclusion Scenarios Chart */}
      <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-3xl font-bold mb-4 flex items-center">
          <Target className="mr-2" size={28} /> Exclusion Scenarios
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="gray" />
            <YAxis stroke="gray" />
            <Tooltip />
            <Legend />
            <Bar dataKey="SalePrice" fill="#3b82f6" name="Sale Price" /> {/* Blue accent */}
            <Bar dataKey="Gain" fill="#10b981" name="Gain" /> {/* Emerald accent */}
            <Bar dataKey="Exclusion" fill="#60a5fa" name="Exclusion" />
            <Bar dataKey="TaxOwed" fill="#ef4444" name="Tax Owed" />
            <Bar dataKey="TaxSaved" fill="#34d399" name="Tax Saved" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Stacking Strategy */}
      <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-3xl font-bold mb-4 flex items-center">
          <Zap className="mr-2" size={28} /> Stacking Strategy (for larger exits)
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Gift QSBS to family members before sale to leverage multiple exclusions.</li>
          <li>Each person qualifies for their own $10M exclusion.</li>
          <li>For a family of 5, potential exclusion could reach $50M.</li>
          <li>Utilize trust beneficiaries for additional exclusions.</li>
          <li>Example: On a $50M exit with 5 family members, total tax could be $0.</li>
        </ul>
      </section>

      {/* Qualification Requirements */}
      <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-3xl font-bold mb-4 flex items-center">
          <Lock className="mr-2" size={28} /> Qualification Requirements
        </h2>
        <ul className="space-y-2">
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-500" size={20} /> C-Corporation (not S-Corp, LLC, or partnership)</li>
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-500" size={20} /> Active business (not investment, real estate, or services)</li>
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-500" size={20} /> Gross assets under $50M at issuance</li>
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-500" size={20} /> Original issuance (not secondary market)</li>
          <li className="flex items-center"><CheckCircle2 className="mr-2 text-emerald-500" size={20} /> 5-year holding period</li>
          <li className="flex items-center"><AlertTriangle className="mr-2 text-red-500" size={20} /> Excluded industries: law, medicine, consulting, banking, hospitality</li>
        </ul>
      </section>

      {/* Partial Exclusion History */}
      <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-3xl font-bold mb-4 flex items-center">
          <Scale className="mr-2" size={28} /> Partial Exclusion History
        </h2>
        <div className="overflow-x-auto"><table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 border border-[#1e3a5f]">Acquisition Date</th>
              <th className="p-2 border border-[#1e3a5f]">Exclusion %</th>
              <th className="p-2 border border-[#1e3a5f]">Max Gain Excluded</th>
            </tr>
          </thead>
          <tbody>
            <tr className="even:bg-gray-700">
              <td className="p-2 border border-[#1e3a5f]">After 9/27/2010</td>
              <td className="p-2 border border-[#1e3a5f]">100%</td>
              <td className="p-2 border border-[#1e3a5f]">$10M or 10x basis</td>
            </tr>
            <tr className="odd:bg-gray-600">
              <td className="p-2 border border-[#1e3a5f]">2/18/2009 - 9/27/2010</td>
              <td className="p-2 border border-[#1e3a5f]">75%</td>
              <td className="p-2 border border-[#1e3a5f]">$7.5M or 7.5x basis</td>
            </tr>
            <tr className="even:bg-gray-700">
              <td className="p-2 border border-[#1e3a5f]">Before 2/18/2009</td>
              <td className="p-2 border border-[#1e3a5f]">50%</td>
              <td className="p-2 border border-[#1e3a5f]">$5M or 5x basis</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      {/* IRS Compliance */}
      <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-4 flex items-center">
          <Award className="mr-2" size={28} /> IRS Compliance
        </h2>
        <ul className="space-y-2">
          <li>IRC §1202 qualified small business stock for potential exclusion.</li>
          <li>IRC §1045 rollover to defer gain into new QSBS.</li>
          <li>IRC §1244 for ordinary loss treatment if the business fails.</li>
          <li>Form 8949 required for reporting QSBS transactions.</li>
        </ul>
      </section>
      <PageInsights section="q-s-b-s-exclusion-calc" />
    </div>
  );
}
