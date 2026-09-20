// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Droplets, Calendar, CheckCircle2, ArrowRight, Target, Zap, Shield, RefreshCw, BarChart3, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart as ReBarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

// Sample data for waterfall calculations
const initialInvestment = 500000; // Default $500,000
const mygaRate = 0.05; // 5% MYGA rate
const oilGasInvestmentPerYear = 100000; // $100K/yr
const oilGasIncomePerYear = 15000; // $15K/yr
const loanInterestPerYear = 12000; // -$12K/yr
const idcDeductionYear1 = 80000; // 80% Year 1
const tangibleDrillingCosts = 20000; // 20% over 7 years
const solarBonusRange = { min: 22, max: 28 }; // 22-28%
const annuityBonusRange = { min: 10, max: 20 }; // 10-20%

interface WaterfallData {
  year: number;
  mygaValue: number;
  ogIncome: number;
  loanInterest: number;
  netCashFlow: number;
  cumulative: number;
}

const AnnuityWaterfallEngine: React.FC = () => {
  const [investment, setInvestment] = useState(initialInvestment);

  const calculateWaterfall = useMemo(() => {
    const data: WaterfallData[] = [];
    let currentMygaValue = investment;
    let cumulative = investment;

    for (let year = 1; year <= 25; year++) {
      let ogIncome = oilGasIncomePerYear * (1 + 0.02 * Math.floor(year / 5)); // Compound O&G income every 5 years
      let netCashFlow = ogIncome - loanInterestPerYear;

      if (year % 5 === 0) {
        currentMygaValue *= (1 + mygaRate); // Apply MYGA growth at end of cycle
      }

      cumulative += netCashFlow;

      data.push({
        year,
        mygaValue: currentMygaValue,
        ogIncome,
        loanInterest: -loanInterestPerYear,
        netCashFlow,
        cumulative,
      });

      if (year === 5) currentMygaValue = data[4].mygaValue; // Cycle 1 end to Cycle 2 start
      if (year === 10) currentMygaValue = data[9].mygaValue;
      if (year === 15) currentMygaValue = data[14].mygaValue;
      if (year === 20) currentMygaValue = data[19].mygaValue;
    }

    return data;
  }, [investment]);

  const waterfallCycles = [
    { cycle: 1, years: '1-5', start: investment, end: calculateWaterfall[4].mygaValue },
    { cycle: 2, years: '6-10', start: calculateWaterfall[4].mygaValue, end: calculateWaterfall[9].mygaValue },
    { cycle: 3, years: '11-15', start: calculateWaterfall[9].mygaValue, end: calculateWaterfall[14].mygaValue },
    { cycle: 4, years: '16-20', start: calculateWaterfall[14].mygaValue, end: calculateWaterfall[19].mygaValue },
    { cycle: 5, years: '21-25', start: calculateWaterfall[19].mygaValue, end: calculateWaterfall[24].mygaValue },
  ];

  const oilGasData = [
    { year: 1, investment: oilGasInvestmentPerYear, deduction: idcDeductionYear1, income: oilGasIncomePerYear, netCost: 20000 },
    { year: 2, investment: oilGasInvestmentPerYear, deduction: 0, income: oilGasIncomePerYear * 1.1, netCost: 18000 },
    { year: 3, investment: oilGasInvestmentPerYear, deduction: tangibleDrillingCosts / 7, income: oilGasIncomePerYear * 1.2, netCost: 16000 },
    { year: 4, investment: oilGasInvestmentPerYear, deduction: tangibleDrillingCosts / 7, income: oilGasIncomePerYear * 1.3, netCost: 14000 },
    { year: 5, investment: oilGasInvestmentPerYear, deduction: tangibleDrillingCosts / 7, income: oilGasIncomePerYear * 1.4, netCost: 12000 },
    { year: 6, investment: oilGasInvestmentPerYear, deduction: tangibleDrillingCosts / 7, income: oilGasIncomePerYear * 1.5, netCost: 10000 },
    { year: 7, investment: oilGasInvestmentPerYear, deduction: tangibleDrillingCosts / 7, income: oilGasIncomePerYear * 1.6, netCost: 8000 },
    { year: 8, investment: oilGasInvestmentPerYear, deduction: 0, income: oilGasIncomePerYear * 1.7, netCost: 6000 },
    { year: 9, investment: oilGasInvestmentPerYear, deduction: 0, income: oilGasIncomePerYear * 1.8, netCost: 4000 },
    { year: 10, investment: oilGasInvestmentPerYear, deduction: 0, income: oilGasIncomePerYear * 1.9, netCost: 2000 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans">
      {/* Header Section */}
      <header className="p-8 bg-gradient-to-r from-emerald-900 to-amber-900 text-center shadow-lg">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <DollarSign className="text-amber-400" />
          Annuity Waterfall Engine
        </h1>
        <div className="mt-4">
          <label className="mr-2">Initial Investment:</label>
          <input
            type="number"
            value={investment}
            onChange={(e) => setInvestment(Number(e.target.value))}
            className="bg-[#0d1526] border border-amber-600 p-2 rounded"
            placeholder="$500,000"
          />
        </div>
      </header>

      {/* Waterfall Structure Section */}
      <section className="p-8">
        <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-emerald-400" />
          Waterfall Structure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {waterfallCycles.map((cycle) => (
            <div key={cycle.cycle} className="bg-[#0d1526] p-4 rounded shadow">
              <h3 className="text-2xl">Cycle {cycle.cycle} (Years {cycle.years})</h3>
              <p>Start: ${cycle.start.toFixed(0)}</p>
              <ArrowRight className="inline mx-2 text-amber-400" />
              <p>End: ${cycle.end.toFixed(0)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solar Bonus + Annuity Bonus Section */}
      <section className="p-8 bg-[#0d1526]">
        <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="text-emerald-400" />
          Bonuses
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl flex items-center gap-2">
              <Shield className="text-amber-400" /> Solar Bonus: {solarBonusRange.min}-{solarBonusRange.max}% Tax-Free Income Boost
            </h3>
            <p>From Roth conversion, providing a tax-free income advantage.</p>
          </div>
          <div>
            <h3 className="text-2xl flex items-center gap-2">
              <Lock className="text-amber-400" /> Annuity Bonus: {annuityBonusRange.min}-{annuityBonusRange.max}% Premium Bonus
            </h3>
            <p>From carrier, enhancing the overall lifetime income when combined with Solar Bonus.</p>
          </div>
          <p className="mt-2">Combined effect boosts lifetime income significantly.</p>
        </div>
      </section>

      {/* Oil & Gas Overlay Section */}
      <section className="p-8">
        <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
          <Droplets className="text-emerald-400" />
          Oil & Gas Overlay
        </h2>
        <p>Oil & Gas investment: ${oilGasInvestmentPerYear}/yr, offsetting bank loan interest with $15K/yr income.</p>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={oilGasData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="investment" fill="#fbbf24" name="Investment" />
            <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
            <Area type="monotone" dataKey="netCost" fill="#6b7280" stroke="#6b7280" name="Net Cost" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* 25-Year Waterfall Table Section */}
      <section className="p-8 overflow-x-auto">
        <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-emerald-400" />
          25-Year Waterfall Table
        </h2>
        <table className="w-full text-left border-collapse border border-[#1e3a5f]">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-2">Year</th>
              <th className="p-2">MYGA Value</th>
              <th className="p-2">O&G Income</th>
              <th className="p-2">Loan Interest</th>
              <th className="p-2">Net Cash Flow</th>
              <th className="p-2">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {calculateWaterfall.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-[#0d1526]' : 'bg-[#0a0f1a]'}>
                <td className="p-2">{row.year}</td>
                <td className="p-2">${row.mygaValue.toFixed(0)}</td>
                <td className="p-2">${row.ogIncome.toFixed(0)}</td>
                <td className="p-2">${row.loanInterest.toFixed(0)}</td>
                <td className="p-2">${row.netCashFlow.toFixed(0)}</td>
                <td className="p-2">${row.cumulative.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Income Phase Section */}
      <section className="p-8 bg-[#0d1526]">
        <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
          <Target className="text-emerald-400" />
          Income Phase
        </h2>
        <p>After accumulation, options include lifetime income annuitization with SPIA rates by age.</p>
        <p>Guaranteed vs variable income: Guaranteed provides stability, while variable offers potential growth.</p>
        <p>Tax-free income post-Roth conversion via Solar Strategy enhances long-term benefits.</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={calculateWaterfall}>
            <Area type="monotone" dataKey="cumulative" stroke="#fbbf24" fill="#10b981" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* IRS Compliance Section */}
      <section className="p-8">
        <h2 className="text-3xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-amber-400" />
          IRS Compliance
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>IRC §72: Annuity taxation rules</li>
          <li>IRC §1035: Tax-free exchange between annuities</li>
          <li>IRC §469: Oil & gas active participation</li>
          <li>IRC §263(c): Intangible drilling costs</li>
        </ul>
        <p className="mt-4">Ensure all strategies comply with current IRS regulations for optimal benefits.</p>
      </section>

      {/* Footer or Additional Visuals */}
      <footer className="p-4 text-center bg-[#0a0f1a]">
        <BarChart3 className="inline text-emerald-400" /> Powered by advanced compounding models.
      </footer>
      <PageInsights section="annuity-waterfall-engine" />
    </div>
  );
};

export default AnnuityWaterfallEngine;
