// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Calculator, DollarSign, TrendingUp, Wallet, LineChartIcon} from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const InfinityBankingConcept: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loanAmount, setLoanAmount] = useState(50000);
  const [policyYears, setPolicyYears] = useState(50);
  const [dividendStrategy, setDividendStrategy] = useState('reinvest');

  // Sample data for 50-year projection
  const projectionData = Array.from({ length: policyYears }, (_, i) => ({
    year: i + 1,
    cashValue: 10000 + i * 5000 + Math.random() * 2000,
    loanBalance: i < 10 ? 50000 - i * 5000 : 0,
    netWorth: 10000 + i * 8000,
  }));

  // Sample data for comparison chart
  const comparisonData = [
    { name: 'IBC', liquidity: 80, control: 90, growth: 60, cost: 40 },
    { name: 'Traditional Banking', liquidity: 60, control: 30, growth: 20, cost: 70 },
    { name: 'HELOC', liquidity: 70, control: 50, growth: 30, cost: 60 },
  ];

  const handleGenerateOutcome = () => {
    toast.success('Outcome Generated', {
      description: `Projected cash value after ${policyYears} years: $${projectionData[policyYears - 1].cashValue.toLocaleString()}`,
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LineChartIcon className="w-4 h-4 mr-2 text-emerald-400" /> },
    { id: 'projection', label: '50-Year Projection', icon: <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" /> },
    { id: 'comparison', label: 'IBC vs Others', icon: <Calculator className="w-4 h-4 mr-2 text-emerald-400" /> },
    { id: 'mechanics', label: 'Policy Mechanics', icon: <Wallet className="w-4 h-4 mr-2 text-emerald-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-emerald-400" />
            Infinity Banking Concept
          </h1>
          <div className="flex items-center text-[#7a95b8] text-sm">
            <Activity className="w-4 h-4 mr-1" /> Financial Planning Tool
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#1e3a5f]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 rounded-t-md transition ${
                activeTab === tab.id
                  ? 'bg-[#0d1526] text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-[#7a95b8] hover:bg-[#0d1526]/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border border-[#1e3a5f]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">What is Infinity Banking?</h2>
              <p className="text-[#7a95b8] leading-relaxed">
                The Infinity Banking Concept (IBC) uses whole life insurance as a personal banking system. Policyholders can take unstructured loans against their cash surrender value (CSV) while earning guaranteed and non-guaranteed dividends. Key benefits include tax-advantaged growth under IRS Code 7702, generational wealth transfer, and arbitrage opportunities between policy crediting rates and loan rates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0a0f1a] rounded-md border border-[#1e3a5f]">
                  <h3 className="text-lg font-medium mb-2">Key Feature: Policy Loans</h3>
                  <p className="text-[#7a95b8]">Borrow against CSV with no credit checks or repayment schedules.</p>
                </div>
                <div className="p-4 bg-[#0a0f1a] rounded-md border border-[#1e3a5f]">
                  <h3 className="text-lg font-medium mb-2">Key Feature: MEC Avoidance</h3>
                  <p className="text-[#7a95b8]">Policy design avoids Modified Endowment Contract status per IRS Code 7702A.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projection' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">50-Year Cash Flow Projection</h2>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[#7a95b8] mb-1">Policy Duration (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={policyYears}
                    onChange={(e) => setPolicyYears(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full p-2 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white"
                  />
                </div>
                <button
                  onClick={handleGenerateOutcome}
                  className="self-end px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-md transition"
                >
                  Generate Outcome
                </button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" tickFormatter={(value) => `$${value/1000}K`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f' }} />
                    <Area type="monotone" dataKey="cashValue" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.3} name="Cash Value" />
                    <Area type="monotone" dataKey="loanBalance" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Loan Balance" />
                    <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" fill="transparent" name="Net Worth" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">IBC vs Traditional Banking vs HELOC</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f' }} />
                    <Bar dataKey="liquidity" fill="#34d399" name="Liquidity" />
                    <Bar dataKey="control" fill="#3b82f6" name="Control" />
                    <Bar dataKey="growth" fill="#fbbf24" name="Growth" />
                    <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'mechanics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Policy Mechanics &amp; Design</h2>
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <label className="block text-[#7a95b8] mb-1">Simulated Loan Amount</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-[#7a95b8]">Dividend Strategy:</label>
                  <select
                    value={dividendStrategy}
                    onChange={(e) => setDividendStrategy(e.target.value)}
                    className="p-2 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white"
                  >
                    <option value="reinvest">Reinvest Dividends</option>
                    <option value="cash">Cash Payout</option>
                    <option value="pua">Paid-Up Additions Rider</option>
                  </select>
                </div>
              </div>
              <p className="text-[#7a95b8]">
                Optimize cash value growth with Paid-Up Additions riders and maintain crediting rate arbitrage (typically 4-6% crediting vs 5% loan rate). Avoid MEC status per IRS guidelines for tax-free loans.
              </p>
            </div>
          )}
        </div>

        <PageInsights section="InfinityBankingConcept" />
      </div>
    </div>
  );
};

export default InfinityBankingConcept;