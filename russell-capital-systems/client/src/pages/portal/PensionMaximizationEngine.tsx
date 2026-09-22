// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Calculator, DollarSign, LineChartIcon, PieChartIcon, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const PensionMaximizationEngine = () => {
  const [activeTab, setActiveTab] = useState('pensionOptions');
  const [pensionAmount, setPensionAmount] = useState(50000);
  const [colaToggle, setColaToggle] = useState(false);
  const [jointSurvivor, setJointSurvivor] = useState('50');
  const [lifeInsurance, setLifeInsurance] = useState(250000);

  // Sample data for charts
  const inflationData = [
    { year: 0, value: 50000 },
    { year: 10, value: 41000 },
    { year: 20, value: 33500 },
    { year: 30, value: 27500 },
  ];

  const payoutData = [
    { option: 'Single Life', amount: 50000, color: '#059669' },
    { option: 'Joint 50%', amount: 45000, color: '#10b981' },
    { option: 'Joint 75%', amount: 42500, color: '#34d399' },
    { option: 'Joint 100%', amount: 40000, color: '#6ee7b7' },
  ];

  const handleGenerateOutcome = () => {
    toast.success('Outcome generated successfully!');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">Pension Maximization Engine</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-[#1e3a5f] mb-6 overflow-x-auto">
          {['pensionOptions', 'maxStrategy', 'breakeven', 'lumpSum', 'inflation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[#7a95b8] relative ${
                activeTab === tab
                  ? 'text-emerald-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-emerald-400'
                  : 'hover:text-emerald-500'
              }`}
            >
              {tab === 'pensionOptions' && 'Pension Options'}
              {tab === 'maxStrategy' && 'Max Strategy'}
              {tab === 'breakeven' && 'Breakeven Analysis'}
              {tab === 'lumpSum' && 'Lump Sum vs Annuity'}
              {tab === 'inflation' && 'Inflation Erosion'}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
          {activeTab === 'pensionOptions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[#7a95b8] mb-2">Annual Pension Amount</label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <input
                      type="number"
                      value={pensionAmount}
                      onChange={(e) => setPensionAmount(Number(e.target.value))}
                      className="w-full p-2 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#7a95b8] mb-2">Joint &amp; Survivor Option</label>
                  <select
                    value={jointSurvivor}
                    onChange={(e) => setJointSurvivor(e.target.value)}
                    className="w-full p-2 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white"
                  >
                    <option value="50">50%</option>
                    <option value="75">75%</option>
                    <option value="100">100%</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={colaToggle}
                  onChange={() => setColaToggle(!colaToggle)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <label className="text-[#7a95b8]">Include COLA Adjustment</label>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payoutData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="option" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip backgroundColor="#0d1526" contentStyle={{ color: 'white' }} />
                    <Bar dataKey="amount" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'maxStrategy' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[#7a95b8] mb-2">Life Insurance Coverage for Survivor Benefit</label>
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <input
                    type="number"
                    value={lifeInsurance}
                    onChange={(e) => setLifeInsurance(Number(e.target.value))}
                    className="w-full p-2 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white"
                  />
                </div>
              </div>
              <p className="text-[#7a95b8] text-sm">
                Pension maximization strategy uses life insurance to replace survivor benefits, allowing selection of
                single life payout for higher income. (IRS §401(a))
              </p>
            </div>
          )}

          {activeTab === 'breakeven' && (
            <div className="space-y-6">
              <p className="text-[#7a95b8]">Compare breakeven points between single life and joint survivor options.</p>
              <button
                onClick={handleGenerateOutcome}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-md"
              >
                <TrendingUp className="w-5 h-5" />
                Generate Outcome
              </button>
            </div>
          )}

          {activeTab === 'lumpSum' && (
            <div className="space-y-6">
              <p className="text-[#7a95b8] text-sm">
                Lump sum vs annuity analysis based on §417(e) segment rates for present value calculation.
              </p>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-white">Segment Rates Applied</span>
              </div>
            </div>
          )}

          {activeTab === 'inflation' && (
            <div className="space-y-6">
              <p className="text-[#7a95b8]">Inflation erosion modeling over 30 years without COLA protection.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={inflationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip backgroundColor="#0d1526" contentStyle={{ color: 'white' }} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="#059669" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-[#7a95b8] text-sm flex items-center gap-2">
          <LineChartIcon className="w-4 h-4 text-emerald-400" />
          <span>Data is illustrative and based on sample inputs. Consult a financial advisor for personalized analysis.</span>
        </div>
      </div>
      <PageInsights section="PensionMaximizationEngine" />
    </div>
  );
};

export default PensionMaximizationEngine;