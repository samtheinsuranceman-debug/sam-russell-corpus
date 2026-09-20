// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Calculator, DollarSign, FileText, Info, Percent, ShieldCheck, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const LifeSettlementAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('valuation');
  const [faceValue, setFaceValue] = useState(1000000);
  const [lifeExpectancy, setLifeExpectancy] = useState(10);
  const [discountRate, setDiscountRate] = useState(8);
  const [isViatical, setIsViatical] = useState(false);
  const [retainedBenefit, setRetainedBenefit] = useState(0);

  // Sample data for charts
  const valuationData = Array.from({ length: 50 }, (_, i) => ({
    year: i + 1,
    value: faceValue * Math.pow(1 - discountRate / 100, i + 1),
  }));

  const premiumData = [
    { name: 'Year 1', premium: 25000 },
    { name: 'Year 2', premium: 26000 },
    { name: 'Year 3', premium: 27000 },
    { name: 'Year 4', premium: 28000 },
    { name: 'Year 5', premium: 29000 },
  ];

  const calculateSettlementValue = () => {
    const effectiveRate = discountRate / 100;
    const settlement = faceValue * Math.pow(1 - effectiveRate, lifeExpectancy);
    return Math.round(settlement);
  };

  const handleGenerateOutcome = () => {
    const settlementValue = calculateSettlementValue();
    toast.success(`Settlement Value Calculated: $${settlementValue.toLocaleString()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">Life Settlement Analyzer</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-[#1e3a5f]">
          {['valuation', 'tax', 'compliance', 'strategy'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-6 capitalize ${
                activeTab === tab
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-[#7a95b8] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border border-[#1e3a5f]">
          {activeTab === 'valuation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#7a95b8] mb-1">Face Value ($)</label>
                  <input
                    type="number"
                    value={faceValue}
                    onChange={(e) => setFaceValue(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#7a95b8] mb-1">Life Expectancy (Years)</label>
                  <input
                    type="number"
                    value={lifeExpectancy}
                    onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#7a95b8] mb-1">Discount Rate (%)</label>
                  <input
                    type="number"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateOutcome}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Generate Outcome
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                  <h3 className="text-lg mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    50-Year Value Projection
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={valuationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f' }} />
                      <Area type="monotone" dataKey="value" stroke="#34d399" fill="#34d39933" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64">
                  <h3 className="text-lg mb-2 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-emerald-400" />
                    Premium Schedule
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={premiumData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="name" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f' }} />
                      <Bar dataKey="premium" fill="#34d399" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold">Tax Treatment</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isViatical}
                  onChange={() => setIsViatical(!isViatical)}
                  className="w-4 h-4"
                />
                <label className="text-[#7a95b8]">Viatical Settlement (Tax-Free under IRC §101(g))</label>
              </div>
              <p className="text-[#7a95b8]">
                Life Settlements subject to §101(a)(2) transfer for value rules. Gain recognition under §1001 may apply.
              </p>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold">Compliance Notes</h3>
              </div>
              <p className="text-[#7a95b8]">
                Licensing required in 43 states. Stranger-Originated Life Insurance (STOLI) compliance critical.
              </p>
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-5 h-5" />
                <span>Ensure provider vs broker distinction for regulatory adherence.</span>
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold">Settlement Strategies</h3>
              </div>
              <div>
                <label className="block text-[#7a95b8] mb-1">Retained Death Benefit ($)</label>
                <input
                  type="number"
                  value={retainedBenefit}
                  onChange={(e) => setRetainedBenefit(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                />
              </div>
              <p className="text-[#7a95b8]">
                Premium financing strategies available for high-net-worth clients.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 text-[#7a95b8]">
          <Info className="w-5 h-5 text-emerald-400" />
          <span>All calculations are estimates and subject to professional review.</span>
        </div>
      </div>
      <PageInsights section="life-settlement-analyzer" />
    </div>
  );
};

export default LifeSettlementAnalyzer;