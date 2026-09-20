// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, Shield, Lock, CheckCircle2, AlertTriangle, ArrowRight, Target, Scale, Zap, Crown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const IDGTModeler = () => {
  const [businessValue, setBusinessValue] = useState(20000000); // Default $20,000,000

  // Sample data for the chart and table based on requirements
  const chartData = useMemo(() => {
    const growthRate = 0.15; // 15% growth
    const initialValue = businessValue;
    const noteInitial = initialValue * 0.9; // 90% of business value
    const interestRate = 0.054; // 5.4% AFR
    const data = [];

    for (let year = 1; year <= 20; year++) {
      const businessValueYear = initialValue * Math.pow(1 + growthRate, year);
      let noteBalance = noteInitial * Math.pow(1 + interestRate, year) - (noteInitial / 20) * year; // Simplified amortization
      if (noteBalance < 0) noteBalance = 0;
      const interestPaid = noteBalance > 0 ? noteBalance * interestRate : 0;
      const equityInTrust = businessValueYear - noteBalance;
      const taxFreeTransfer = equityInTrust - (initialValue * 0.1); // Simplified

      data.push({
        year,
        businessValue: businessValueYear,
        noteBalance,
        interestPaid,
        equityInTrust,
        taxFreeTransfer,
      });
    }
    return data;
  }, [businessValue]);

  // Table data subset as per requirements
  const tableData = [
    { year: 1, businessValue: 23000000, noteBalance: 18000000, interestPaid: 972000, equityInTrust: 5000000, taxFreeTransfer: 3000000 },
    { year: 5, businessValue: 40200000, noteBalance: 14400000, interestPaid: 778000, equityInTrust: 25800000, taxFreeTransfer: 23800000 },
    { year: 10, businessValue: 80900000, noteBalance: 9000000, interestPaid: 486000, equityInTrust: 71900000, taxFreeTransfer: 69900000 },
    { year: 15, businessValue: 162800000, noteBalance: 3600000, interestPaid: 194000, equityInTrust: 159200000, taxFreeTransfer: 157200000 },
    { year: 20, businessValue: 327300000, noteBalance: 0, interestPaid: 0, equityInTrust: 327300000, taxFreeTransfer: 304400000 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans">
      {/* Header Section */}
      <header className="p-8 bg-indigo-900 text-center shadow-lg">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
          <Building2 className="mr-2 inline" size={32} color="amber" />
          IDGT Modeler — Intentionally Defective Grantor Trust
        </h1>
        <div className="flex justify-center items-center">
          <DollarSign className="mr-2" size={24} color="amber" />
          <input
            type="number"
            value={businessValue}
            onChange={(e) => setBusinessValue(Number(e.target.value))}
            className="bg-[#0d1526] border border-amber-500 p-2 rounded text-white w-1/3"
            placeholder="Business Value (e.g., 20000000)"
          />
        </div>
      </header>

      {/* Estate Freeze Technique Section */}
      <section className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">The Estate Freeze Technique</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border-l-4 border-amber-500">
            <TrendingUp className="mb-2" size={24} color="amber" />
            <h3 className="text-xl font-semibold mb-2">Step 1: Seed Gift to IDGT</h3>
            <p>10% of business value = ${ (businessValue * 0.1).toLocaleString() } (uses exemption)</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border-l-4 border-amber-500">
            <ArrowRight className="mb-2" size={24} color="amber" />
            <h3 className="text-xl font-semibold mb-2">Step 2: Sell Remaining 90%</h3>
            <p>Sell ${ (businessValue * 0.9).toLocaleString() } to IDGT for promissory note</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border-l-4 border-amber-500">
            <Lock className="mb-2" size={24} color="amber" />
            <h3 className="text-xl font-semibold mb-2">Step 3: Note at AFR Rate</h3>
            <p>Currently ~5.4%</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border-l-4 border-amber-500">
            <Shield className="mb-2" size={24} color="amber" />
            <h3 className="text-xl font-semibold mb-2">Step 4: Business Growth</h3>
            <p>Grows at 15%, excess growth passes estate-tax-free</p>
          </div>
        </div>
      </section>

      {/* Installment Sale Analysis Section */}
      <section className="p-8 bg-[#0d1526]">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">Installment Sale Analysis</h2>
        <p className="mb-4">Business value growing at 15%/yr: ${businessValue.toLocaleString()} → ${ (businessValue * Math.pow(1.15, 20)).toLocaleString() }</p>
        <p className="mb-4">Note payments (interest + principal): ${ (businessValue * 0.9).toLocaleString() } + $4,860,000 interest = $22,860,000</p>
        <p className="mb-4">Value transferred estate-tax-free: ${ ((businessValue * Math.pow(1.15, 20)) - 22860000).toLocaleString() }</p>
        <p className="mb-4">Estate tax saved (40%): ${ (((businessValue * Math.pow(1.15, 20)) - 22860000) * 0.4).toLocaleString() }</p>
        <div className="h-96 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis dataKey="year" stroke="amber" />
              <YAxis stroke="amber" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="businessValue" stroke="indigo" strokeWidth={2} name="Business Value" />
              <Bar dataKey="noteBalance" fill="amber" name="Note Balance" />
              <Area type="monotone" dataKey="interestPaid" fill="gray" stroke="indigo" name="Interest Paid" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* AFR Arbitrage Section */}
      <section className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">AFR Arbitrage (The Magic)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-md">
            <Zap className="mb-2" size={24} color="amber" />
            <p>Business growth rate: 15%</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-md">
            <Crown className="mb-2" size={24} color="amber" />
            <p>AFR note rate: 5.4%</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-md">
            <Scale className="mb-2" size={24} color="amber" />
            <p>Spread: 9.6% annually</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-md">
            <Target className="mb-2" size={24} color="amber" />
            <p>This spread transfers wealth tax-free. The bigger the spread, the more wealth transfers.</p>
          </div>
        </div>
      </section>

      {/* Year-by-Year Table Section */}
      <section className="p-8 bg-[#0d1526] overflow-x-auto">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">Year-by-Year Table</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-4 border-b border-amber-500">Year</th>
              <th className="p-4 border-b border-amber-500">Business Value</th>
              <th className="p-4 border-b border-amber-500">Note Balance</th>
              <th className="p-4 border-b border-amber-500">Interest Paid</th>
              <th className="p-4 border-b border-amber-500">Equity in Trust</th>
              <th className="p-4 border-b border-amber-500">Tax-Free Transfer</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index} className="hover:bg-[#162a4a]">
                <td className="p-4 border-b border-[#1e3a5f]">${row.year}</td>
                <td className="p-4 border-b border-[#1e3a5f]">${row.businessValue.toLocaleString()}</td>
                <td className="p-4 border-b border-[#1e3a5f]">${row.noteBalance.toLocaleString()}</td>
                <td className="p-4 border-b border-[#1e3a5f]">${row.interestPaid.toLocaleString()}</td>
                <td className="p-4 border-b border-[#1e3a5f]">${row.equityInTrust.toLocaleString()}</td>
                <td className="p-4 border-b border-[#1e3a5f]">${row.taxFreeTransfer.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Grantor Trust Benefits Section */}
      <section className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">Grantor Trust Benefits</h2>
        <ul className="list-disc pl-8 space-y-2">
          <li className="flex items-start"><CheckCircle2 className="mr-2 mt-1" size={20} color="amber" /> Income tax paid by grantor (further reduces estate)</li>
          <li className="flex items-start"><Shield className="mr-2 mt-1" size={20} color="amber" /> No capital gains on sale to grantor trust (Rev. Rul. 85-13)</li>
          <li className="flex items-start"><Lock className="mr-2 mt-1" size={20} color="amber" /> Swap power for basis step-up planning</li>
          <li className="flex items-start"><AlertTriangle className="mr-2 mt-1" size={20} color="amber" /> Toggle grantor trust status on/off</li>
        </ul>
      </section>

      {/* Valuation Discount Stacking Section */}
      <section className="p-8 bg-[#0d1526]">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">Valuation Discount Stacking</h2>
        <p>Minority interest discount: 25%</p>
        <p>Lack of marketability discount: 30%</p>
        <p>Combined discount: 47.5%</p>
        <p>${businessValue.toLocaleString()} business → $10,500,000 for transfer purposes</p>
        <p>Seed gift: $1,050,000 (not $2,000,000)</p>
        <p>Note: $9,450,000 (not $18,000,000)</p>
      </section>

      {/* IRS Compliance Section */}
      <section className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">IRS Compliance</h2>
        <ul className="list-disc pl-8 space-y-2">
          <li className="flex items-start"><CheckCircle2 className="mr-2 mt-1" size={20} color="amber" /> IRC §675 intentional defect (swap power)</li>
          <li className="flex items-start"><Shield className="mr-2 mt-1" size={20} color="amber" /> IRC §1274 Applicable Federal Rate</li>
          <li className="flex items-start"><Lock className="mr-2 mt-1" size={20} color="amber" /> IRC §2036/2038 retained interest rules</li>
          <li className="flex items-start"><AlertTriangle className="mr-2 mt-1" size={20} color="amber" /> Adequate consideration exception</li>
        </ul>
      </section>

      {/* Footer for spacing */}
      <footer className="p-8 text-center text-gray-500">Built with React and Tailwind CSS</footer>
      <PageInsights section="i-d-g-t-modeler" />
    </div>
  );
};

export default IDGTModeler;
