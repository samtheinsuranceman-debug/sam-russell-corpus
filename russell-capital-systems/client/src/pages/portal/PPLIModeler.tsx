// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Shield, DollarSign, TrendingUp, Lock, Crown, CheckCircle2, AlertTriangle, Target, Zap, Building2, ArrowRight, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function PPLIModeler() {
  const [investmentAmount, setInvestmentAmount] = useState(5000000);  // Default investment amount in USD

  const chartData = useMemo(() => {
    const years = Array.from({ length: 31 }, (_, i) => i);  // Generate years from 0 to 30
    const taxableRate = 0.0444;  // Net return after 37% tax drag
    const ppliRate = 0.12;  // Gross return for PPLI

    return years.map(year => ({
      year: year,
      taxable: investmentAmount * Math.pow(1 + taxableRate, year),
      ppli: investmentAmount * Math.pow(1 + ppliRate, year),
    }));
  }, [investmentAmount]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      {/* Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-indigo-400 mb-4">PPLI Modeler — Private Placement Life Insurance</h1>
        <p className="text-xl">Model the power of tax-free growth with an initial investment amount:</p>
        <div className="mt-4 flex justify-center items-center">
          <input
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(Number(e.target.value))}
            className="bg-[#0d1526] border border-indigo-500 text-white px-4 py-2 rounded-md w-1/3 text-center"
            min="1000000"
            placeholder="Enter amount in USD"
          />
        </div>
      </header>

      {/* The PPLI Advantage Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-amber-400 mb-6 text-center">The PPLI Advantage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <TrendingUp className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">Tax-free Growth</h3>
              <p>Grow hedge funds, private equity, and real estate inside an insurance wrapper without taxes.</p>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <DollarSign className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">No Annual Tax Drag</h3>
              <p>Achieve 0% tax on growth compared to up to 37% on ordinary income in taxable accounts.</p>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <Lock className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">Tax-free Access</h3>
              <p>Access funds via policy loans at near-0% cost, maintaining tax efficiency.</p>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <Crown className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">Tax-free Death Benefit</h3>
              <p>Beneficiaries receive proceeds tax-free under IRC section 101(a) exclusion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Comparison Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-amber-400 mb-6 text-center">Growth Comparison Over 30 Years</h2>
        <p className="text-center text-lg mb-4">Taxable Account: Starts at ${ (investmentAmount / 1e6).toFixed(1) }M with 4.44% net return after taxes.</p>
        <p className="text-center text-lg mb-4">PPLI: Starts at ${ (investmentAmount / 1e6).toFixed(1) }M with full 12% gross return, compounding tax-free.</p>
        <div className="h-96 bg-[#0d1526] rounded-lg shadow-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottomRight', offset: 0 }} />
              <YAxis label={{ value: 'Value (USD)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `$${ (value / 1e6).toFixed(1) }M`} />
              <Legend />
              <Area type="monotone" dataKey="taxable" stroke="#8884d8" fill="#8884d8" name="Taxable Account" />
              <Area type="monotone" dataKey="ppli" stroke="#82ca9d" fill="#82ca9d" name="PPLI" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-lg mt-4">
          30-year value: Taxable - ${ (chartData[30].taxable / 1e6).toFixed(1) }M | PPLI - ${ (chartData[30].ppli / 1e6).toFixed(1) }M | Advantage: ${ ((chartData[30].ppli - chartData[30].taxable) / 1e6).toFixed(1) }M more wealth via tax-free growth.
        </p>
      </section>

      {/* Investment Allocation Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-amber-400 mb-6 text-center">Investment Allocation Inside PPLI</h2>
        <p className="text-center text-lg mb-4">All allocations grow tax-free within the insurance wrapper.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <Building2 className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">Hedge Funds: 30%</h3>
              <p>${ (investmentAmount * 0.30 / 1e6).toFixed(1) }M allocated, growing tax-free.</p>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <Zap className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">Private Equity: 25%</h3>
              <p>${ (investmentAmount * 0.25 / 1e6).toFixed(1) }M allocated, with potential for high returns.</p>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <Target className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">Real Estate Funds: 20%</h3>
              <p>${ (investmentAmount * 0.20 / 1e6).toFixed(1) }M allocated for stable, tax-free appreciation.</p>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <Award className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">Venture Capital: 15%</h3>
              <p>${ (investmentAmount * 0.15 / 1e6).toFixed(1) }M allocated for innovative growth opportunities.</p>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <ArrowRight className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">Fixed Income: 10%</h3>
              <p>${ (investmentAmount * 0.10 / 1e6).toFixed(1) }M allocated for balanced, tax-free income.</p>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105">
            <CheckCircle2 className="text-indigo-400 mr-4" size={24} />
            <div>
              <h3 className="text-xl font-bold">All Assets</h3>
              <p>Growing tax-free, providing ultimate flexibility for ultra-high-net-worth individuals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PPLI vs Traditional Comparison Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-amber-400 mb-6 text-center">PPLI vs Traditional Comparison</h2>
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse bg-[#0d1526] rounded-lg shadow-lg">
          <thead>
            <tr>
              <th className="p-4 border-b border-[#1e3a5f]">Feature</th>
              <th className="p-4 border-b border-[#1e3a5f]">PPLI</th>
              <th className="p-4 border-b border-[#1e3a5f]">Taxable Account</th>
              <th className="p-4 border-b border-[#1e3a5f]">Trust</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Tax on Growth</td>
              <td>None</td>
              <td>Up to 37%</td>
              <td>Up to 37%</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Access</td>
              <td>Policy Loans</td>
              <td>Taxable Sale</td>
              <td>Distributions</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Death Benefit</td>
              <td>Tax-Free</td>
              <td>Taxable Estate</td>
              <td>Taxable</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Asset Protection</td>
              <td>Yes (state law)</td>
              <td>Limited</td>
              <td>Yes</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Minimum</td>
              <td>$1-5M</td>
              <td>None</td>
              <td>None</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-4">Complexity</td>
              <td>High</td>
              <td>Low</td>
              <td>Medium</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      {/* Policy Loan Access Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-amber-400 mb-6 text-center">Policy Loan Access</h2>
        <ul className="list-disc pl-8 space-y-4 text-lg">
          <li>Borrow against cash value at approximately 2% loan rate, keeping costs minimal.</li>
          <li>No taxable event occurs, preserving your tax-free status.</li>
          <li>Interest payments can be capitalized, avoiding immediate outflows.</li>
          <li>Access over $100M without triggering taxes, ideal for liquidity needs.</li>
          <li>Loans are typically repaid from the death benefit, ensuring seamless estate planning.</li>
        </ul>
      </section>

      {/* IRS Compliance Section */}
      <section>
        <h2 className="text-3xl font-semibold text-amber-400 mb-6 text-center">IRS Compliance</h2>
        <ul className="list-disc pl-8 space-y-4 text-lg">
          <li>IRC section 101(a) provides income tax exclusion for death benefits in life insurance policies.</li>
          <li>IRC section 7702 defines the requirements for a contract to be treated as life insurance.</li>
          <li>IRC section 7702A outlines rules for modified endowment contracts to maintain tax advantages.</li>
          <li>IRC section 817(h) enforces diversification requirements for variable insurance products.</li>
          <li>Investor Control Doctrine imposes limitations to prevent direct control over investments, ensuring compliance.</li>
        </ul>
      </section>
      <PageInsights section="p-p-l-i-modeler" />
    </div>
  );
}
