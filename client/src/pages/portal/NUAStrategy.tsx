// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Shield, CheckCircle2, AlertTriangle, ArrowRight, Target, Zap, Scale, Calendar, Award, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const NUAStrategy = () => {
  const [stockValue, setStockValue] = useState(500000); // Default stock value
  const [costBasis, setCostBasis] = useState(100000); // Default cost basis

  const nua = useMemo(() => stockValue - costBasis, [stockValue, costBasis]);
  const ordinaryTaxRate = 0.37; // 37% ordinary income tax rate
  const ltcgTaxRate = 0.20; // 20% long-term capital gains tax rate

  const withoutNUATax = useMemo(() => stockValue * ordinaryTaxRate, [stockValue]);
  const withNUACostBasisTax = useMemo(() => costBasis * ordinaryTaxRate, [costBasis]);
  const withNUANuaTax = useMemo(() => nua * ltcgTaxRate, [nua]);
  const withNUATotalTax = useMemo(() => withNUACostBasisTax + withNUANuaTax, [withNUACostBasisTax, withNUANuaTax]);
  const taxSavings = useMemo(() => withoutNUATax - withNUATotalTax, [withoutNUATax, withNUATotalTax]);

  const taxData = [
    { name: 'Full IRA Rollover', ordinaryTax: withoutNUATax, ltcgTax: 0, totalTax: withoutNUATax, savings: 0 },
    { name: 'NUA Strategy', ordinaryTax: withNUACostBasisTax, ltcgTax: withNUANuaTax, totalTax: withNUATotalTax, savings: taxSavings },
    { name: 'NUA + Charitable', ordinaryTax: withNUACostBasisTax, ltcgTax: (nua * 0.10), totalTax: (withNUACostBasisTax + (nua * 0.10)), savings: (withoutNUATax - (withNUACostBasisTax + (nua * 0.10))) }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      {/* Header Section */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-amber-400 mb-4">NUA Strategy — Net Unrealized Appreciation</h1>
        <div className="flex justify-center items-center space-x-4">
          <DollarSign className="text-teal-400" size={24} />
          <input
            type="number"
            value={stockValue}
            onChange={(e) => setStockValue(Number(e.target.value))}
            className="bg-[#0d1526] border border-teal-500 rounded p-2 w-32 text-center"
            placeholder="Stock Value"
          />
          <ArrowRight className="text-amber-400" size={24} />
          <input
            type="number"
            value={costBasis}
            onChange={(e) => setCostBasis(Number(e.target.value))}
            className="bg-[#0d1526] border border-teal-500 rounded p-2 w-32 text-center"
            placeholder="Cost Basis"
          />
        </div>
      </header>

      {/* NUA Tax Arbitrage Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-teal-300 mb-6 flex items-center">
          <TrendingUp className="mr-2" size={28} />
          The NUA Tax Arbitrage
        </h2>
        <p className="text-[#94a3b8] mb-4">This strategy converts ordinary income tax into long-term capital gains, potentially saving thousands.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-amber-500">
            <h3 className="text-2xl font-bold text-amber-400 mb-4">Without NUA (Standard Rollover to IRA)</h3>
            <p className="flex items-center mb-2"><Shield className="mr-2 text-teal-400" size={20} /> Withdraw ${stockValue} from IRA</p>
            <p className="flex items-center mb-2"><AlertTriangle className="mr-2 text-amber-400" size={20} /> Taxed as ordinary income at 37%: ${withoutNUATax.toFixed(0)} tax</p>
            <p className="flex items-center"><CheckCircle2 className="mr-2 text-teal-400" size={20} /> Net after tax: ${(stockValue - withoutNUATax).toFixed(0)}</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border-l-4 border-teal-500">
            <h3 className="text-2xl font-bold text-teal-300 mb-4">With NUA</h3>
            <p className="flex items-center mb-2"><DollarSign className="mr-2 text-amber-400" size={20} /> Cost basis taxed as ordinary income: ${costBasis} x 37% = ${withNUACostBasisTax.toFixed(0)}</p>
            <p className="flex items-center mb-2"><Award className="mr-2 text-teal-400" size={20} /> NUA (${nua.toFixed(0)}) taxed as LTCG: ${nua.toFixed(0)} x 20% = ${withNUANuaTax.toFixed(0)}</p>
            <p className="flex items-center mb-2"><BarChart3 className="mr-2 text-amber-400" size={20} /> Total tax: ${withNUATotalTax.toFixed(0)}</p>
            <p className="flex items-center"><Zap className="mr-2 text-teal-400" size={20} /> Tax savings: ${taxSavings.toFixed(0)} (37% savings on the spread)</p>
          </div>
        </div>
      </section>

      {/* NUA Process Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-amber-400 mb-6 flex items-center">
          <CheckCircle2 className="mr-2" size={28} />
          NUA Process
        </h2>
        <ol className="list-decimal pl-5 space-y-4">
          <li className="flex items-start">
            <Target className="mr-2 mt-1 text-teal-300" size={24} />
            <span>Step 1: Trigger a qualifying event (separation, age 59.5, disability, death)</span>
          </li>
          <li className="flex items-start">
            <Calendar className="mr-2 mt-1 text-teal-300" size={24} />
            <span>Step 2: Take lump-sum distribution of ENTIRE 401(k) in one tax year</span>
          </li>
          <li className="flex items-start">
            <ArrowRight className="mr-2 mt-1 text-teal-300" size={24} />
            <span>Step 3: Distribute employer stock in-kind to taxable brokerage</span>
          </li>
          <li className="flex items-start">
            <Scale className="mr-2 mt-1 text-teal-300" size={24} />
            <span>Step 4: Roll remaining non-stock assets to IRA</span>
          </li>
        </ol>
      </section>

      {/* Tax Comparison Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-teal-500 mb-6 flex items-center">
          <BarChart3 className="mr-2" size={28} />
          Tax Comparison
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={taxData}>
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="ordinaryTax" fill="#fbbf24" name="Ordinary Tax" />
            <Bar dataKey="ltcgTax" fill="#14b8a6" name="LTCG Tax" />
            <Bar dataKey="totalTax" fill="#f97316" name="Total Tax" />
            <Bar dataKey="savings" fill="#818cf8" name="Savings" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[#94a3b8] mt-4">Data based on current inputs: Stock Value ${stockValue}, Cost Basis ${costBasis}</p>
      </section>

      {/* When NUA Makes Sense Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-amber-300 mb-6 flex items-center">
          <Target className="mr-2" size={28} />
          When NUA Makes Sense
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li className="flex items-start"><Zap className="mr-2 text-teal-400" size={20} /> Large employer stock position (&gt;$100K)</li>
          <li className="flex items-start"><Scale className="mr-2 text-teal-400" size={20} /> Low cost basis relative to current value</li>
          <li className="flex items-start"><Award className="mr-2 text-teal-400" size={20} /> High ordinary income tax bracket (32%+)</li>
          <li className="flex items-start"><Calendar className="mr-2 text-teal-400" size={20} /> Near retirement or separating from employer</li>
          <li className="flex items-start"><Shield className="mr-2 text-teal-400" size={20} /> Want to diversify concentrated position</li>
        </ul>
      </section>

      {/* Risks and Considerations Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-teal-400 mb-6 flex items-center">
          <AlertTriangle className="mr-2" size={28} />
          Risks and Considerations
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li className="flex items-start"><AlertTriangle className="mr-2 text-amber-400" size={20} /> Must distribute ENTIRE account in one tax year</li>
          <li className="flex items-start"><DollarSign className="mr-2 text-amber-400" size={20} /> Cost basis is taxed immediately as ordinary income</li>
          <li className="flex items-start"><Shield className="mr-2 text-amber-400" size={20} /> Stock concentration risk after distribution</li>
          <li className="flex items-start"><CheckCircle2 className="mr-2 text-amber-400" size={20} /> No 10% early withdrawal penalty on NUA portion</li>
          <li className="flex items-start"><Award className="mr-2 text-amber-400" size={20} /> Additional appreciation after distribution taxed as LTCG</li>
        </ul>
      </section>

      {/* IRS Compliance Section */}
      <section>
        <h2 className="text-3xl font-semibold text-amber-500 mb-6 flex items-center">
          <Shield className="mr-2" size={28} />
          IRS Compliance
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li className="flex items-start"><Scale className="mr-2 text-teal-300" size={20} /> IRC section 402(e)(4) NUA rules</li>
          <li className="flex items-start"><Calendar className="mr-2 text-teal-300" size={20} /> Treas. Reg. section 1.402(a)-1(b) lump-sum requirements</li>
          <li className="flex items-start"><Award className="mr-2 text-teal-300" size={20} /> IRC section 1222 long-term capital gain treatment</li>
          <li className="flex items-start"><BarChart3 className="mr-2 text-teal-300" size={20} /> Form 1099-R reporting (Box 6: NUA amount)</li>
        </ul>
      </section>
      <PageInsights section="n-u-a-strategy" />
    </div>
  );
};

export default NUAStrategy;
