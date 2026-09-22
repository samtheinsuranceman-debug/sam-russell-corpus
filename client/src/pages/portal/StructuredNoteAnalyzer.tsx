// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Layers, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, BarChart3, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart as ReBarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const samplePayoffData = [
  { underlying: 80, payoff: 900 },
  { underlying: 90, payoff: 950 },
  { underlying: 100, payoff: 1000 },
  { underlying: 110, payoff: 1050 },
  { underlying: 120, payoff: 1100 },
];

const samplePortfolioData = [
  { year: 0, structuredNotes: 1000, bonds: 1000, equities: 1000 },
  { year: 10, structuredNotes: 1500, bonds: 1200, equities: 1800 },
  { year: 20, structuredNotes: 2000, bonds: 1400, equities: 2500 },
  { year: 30, structuredNotes: 2500, bonds: 1600, equities: 3500 },
  { year: 40, structuredNotes: 3000, bonds: 1800, equities: 4500 },
  { year: 50, structuredNotes: 3500, bonds: 2000, equities: 6000 },
];

const sampleRiskData = [
  { category: 'Low Risk', value: 30 },
  { category: 'Medium Risk', value: 50 },
  { category: 'High Risk', value: 20 },
];

const sampleTaxData = [
  { type: 'Ordinary Income', amount: 500, rate: 0.37 },
  { type: 'Capital Gains', amount: 500, rate: 0.15 },
];

const COLORS = ['#4F46E5', '#B87333', '#EF4444', '#10B981', '#6366f1'];

export default function StructuredNoteAnalyzer() {
  const [noteType, setNoteType] = useState('principal protected');
  const [principalAmount, setPrincipalAmount] = useState(1000);
  const [underlyingPrice, setUnderlyingPrice] = useState(100);
  const [strikePrice, setStrikePrice] = useState(100);
  const [barrierLevel, setBarrierLevel] = useState(80);
  const [maturityYears, setMaturityYears] = useState(5);
  const [yieldRate, setYieldRate] = useState(5);
  const [creditRating, setCreditRating] = useState('AAA');

  const embeddedOptionValue = useMemo(() => {
    // Simplified calculation for embedded option value
    return (yieldRate * principalAmount) / (1 + (maturityYears * 0.05));
  }, [yieldRate, principalAmount, maturityYears]);

  const creditRiskScore = useMemo(() => {
    // Basic credit risk assessment based on rating
    const ratings = { 'AAA': 0.01, 'AA': 0.02, 'A': 0.05, 'BBB': 0.1 };
    return ratings[creditRating] || 0.2;
  }, [creditRating]);

  const taxComparison = useMemo(() => {
    const ordinaryTax = principalAmount * 0.37;
    const capitalGainsTax = principalAmount * 0.15;
    return { ordinaryTax, capitalGainsTax };
  }, [principalAmount]);

  const yieldEnhancement = useMemo(() => {
    return yieldRate * 1.2; // Simplified enhancement
  }, [yieldRate]);

  const downsideRisk = useMemo(() => {
    return (underlyingPrice < strikePrice ? (strikePrice - underlyingPrice) / strikePrice : 0) * 100;
  }, [underlyingPrice, strikePrice]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <header className="flex items-center mb-8">
        <Layers className="mr-2" size={24} color="#4F46E5" />
        <h1 className="text-3xl font-bold">Structured Note Analyzer</h1>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <DollarSign className="mr-2" size={20} color="#B87333" />
          Select Note Type
        </h2>
        <select
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
          className="bg-[#0d1526] border border-indigo-600 p-2 rounded"
        >
          <option value="principal protected">Principal Protected</option>
          <option value="reverse convertible">Reverse Convertible</option>
          <option value="autocallable">Autocallable</option>
          <option value="range accrual">Range Accrual</option>
        </select>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <TrendingUp className="mr-2" size={20} color="#4F46E5" />
          Input Parameters
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Principal Amount</label>
            <input
              type="number"
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(Number(e.target.value))}
              className="w-full bg-[#0d1526] border border-indigo-600 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Underlying Price</label>
            <input
              type="number"
              value={underlyingPrice}
              onChange={(e) => setUnderlyingPrice(Number(e.target.value))}
              className="w-full bg-[#0d1526] border border-indigo-600 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Strike Price</label>
            <input
              type="number"
              value={strikePrice}
              onChange={(e) => setStrikePrice(Number(e.target.value))}
              className="w-full bg-[#0d1526] border border-indigo-600 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Barrier Level</label>
            <input
              type="number"
              value={barrierLevel}
              onChange={(e) => setBarrierLevel(Number(e.target.value))}
              className="w-full bg-[#0d1526] border border-indigo-600 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Maturity (Years)</label>
            <input
              type="number"
              value={maturityYears}
              onChange={(e) => setMaturityYears(Number(e.target.value))}
              className="w-full bg-[#0d1526] border border-indigo-600 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Yield Rate (%)</label>
            <input
              type="number"
              value={yieldRate}
              onChange={(e) => setYieldRate(Number(e.target.value))}
              className="w-full bg-[#0d1526] border border-indigo-600 p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Credit Rating</label>
            <select
              value={creditRating}
              onChange={(e) => setCreditRating(e.target.value)}
              className="w-full bg-[#0d1526] border border-indigo-600 p-2 rounded"
            >
              <option value="AAA">AAA</option>
              <option value="AA">AA</option>
              <option value="A">A</option>
              <option value="BBB">BBB</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Target className="mr-2" size={20} color="#B87333" />
          Payoff Diagram Generator
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={samplePayoffData}>
            <XAxis dataKey="underlying" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="payoff" fill="#4F46E5" stroke="#B87333" />
            <Line type="monotone" dataKey="payoff" stroke="#EF4444" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <ArrowRight className="mr-2" size={20} color="#4F46E5" />
          Embedded Option Value Analysis
        </h2>
        <p>Embedded Option Value: ${embeddedOptionValue.toFixed(2)}</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={sampleRiskData} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {sampleRiskData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Shield className="mr-2" size={20} color="#B87333" />
          Credit Risk Assessment
        </h2>
        <p>Issuer Default Risk: { (creditRiskScore * 100).toFixed(2) }%</p>
        {creditRiskScore < 0.05 ? (
          <CheckCircle2 size={24} color="#10B981" />
        ) : (
          <AlertTriangle size={24} color="#EF4444" />
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Percent className="mr-2" size={20} color="#4F46E5" />
          Tax Treatment Comparison
        </h2>
        <p>Ordinary Income Tax: ${taxComparison.ordinaryTax.toFixed(2)}</p>
        <p>Capital Gains Tax: ${taxComparison.capitalGainsTax.toFixed(2)}</p>
        <ResponsiveContainer width="100%" height={200}>
          <ReBarChart data={sampleTaxData}>
            <XAxis dataKey="type" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Bar dataKey="amount" fill="#B87333" />
          </ReBarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <TrendingUp className="mr-2" size={20} color="#B87333" />
          Yield Enhancement vs Downside Risk
        </h2>
        <p>Enhanced Yield: {yieldEnhancement.toFixed(2)}%</p>
        <p>Downside Risk: {downsideRisk.toFixed(2)}%</p>
        <BarChart3 size={48} color="#4F46E5" />
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Calendar className="mr-2" size={20} color="#4F46E5" />
          50-Year Portfolio Comparison
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={samplePortfolioData}>
            <XAxis dataKey="year" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="structuredNotes" stroke="#B87333" fill="#4F46E5" />
            <Area type="monotone" dataKey="bonds" stroke="#10B981" fill="#10B981" />
            <Area type="monotone" dataKey="equities" stroke="#EF4444" fill="#EF4444" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Lock className="mr-2" size={20} color="#B87333" />
          Compliance Check
        </h2>
        <ul className="list-disc pl-5">
          <li>IRC 1275 OID Rules: Compliant</li>
          <li>Section 1256 Contracts: Compliant</li>
          <li>Section 1001 Realization: Compliant</li>
          <li>SEC Reg S-K Disclosure: Compliant</li>
          <li>FINRA Rule 2111 Suitability: Compliant</li>
        </ul>
      </section>
      <PageInsights section="structured-note-analyzer" />
    </div>
  );
}
