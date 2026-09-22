// @ts-nocheck
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Activity, Calculator, DollarSign, Percent, TrendingUp, BarChart3, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const SyndicationDealAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [investmentAmount, setInvestmentAmount] = useState(50000);
  const [holdPeriod, setHoldPeriod] = useState(5);
  const [distributionFrequency, setDistributionFrequency] = useState('quarterly');

  // Sample data for charts
  const irrData = [
    { year: 1, irr: 6.2 },
    { year: 2, irr: 8.5 },
    { year: 3, irr: 10.1 },
    { year: 4, irr: 12.3 },
    { year: 5, irr: 14.7 },
  ];

  const cashFlowData = [
    { year: 1, cashFlow: 2500 },
    { year: 2, cashFlow: 3200 },
    { year: 3, cashFlow: 3800 },
    { year: 4, cashFlow: 4500 },
    { year: 5, cashFlow: 5200 },
  ];

  const handleGenerateOutcome = () => {
    if (investmentAmount < 25000) {
      toast.error('Minimum investment is $25,000 for accredited investors.');
      return;
    }
    toast.success(`Outcome generated for $${investmentAmount.toLocaleString()} investment over ${holdPeriod} years.`);
  };

  const tabs = [
    { id: 'overview', label: 'Deal Overview' },
    { id: 'waterfall', label: 'Waterfall Model' },
    { id: 'projections', label: 'IRR Projections' },
    { id: 'tax', label: 'Tax Implications' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-400" />
          Syndication Deal Analyzer
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#1e3a5f] mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-md ${
                activeTab === tab.id
                  ? 'bg-[#0d1526] text-emerald-400 border-t border-x border-[#1e3a5f]'
                  : 'text-[#7a95b8] hover:bg-[#0d1526]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Investment Parameters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#7a95b8] mb-1">Investment Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                    <input
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                      className="w-full pl-8 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md py-2 text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#7a95b8] mb-1">Hold Period (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={holdPeriod}
                    onChange={(e) => setHoldPeriod(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md py-2 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[#7a95b8] mb-1">Distribution Frequency</label>
                  <select
                    value={distributionFrequency}
                    onChange={(e) => setDistributionFrequency(e.target.value)}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md py-2 text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerateOutcome}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Generate Outcome
              </button>
            </div>
          )}

          {activeTab === 'waterfall' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Waterfall Distribution Model</h2>
              <p className="text-[#7a95b8]">
                Preferred Return (8%) &gt; Catch-Up (GP 50%) &gt; Promote (80/20 Split)
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f', color: 'white' }} />
                    <Area type="monotone" dataKey="cashFlow" stroke="#10b981" fill="#10b98133" name="Cash Flow ($)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'projections' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                IRR Projections
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={irrData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f', color: 'white' }} />
                    <Line type="monotone" dataKey="irr" stroke="#10b981" name="IRR (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-400" />
                Tax Implications
              </h2>
              <div className="text-[#7a95b8] space-y-2">
                <p>
                  Depreciation pass-through under IRC Section 168 allows for accelerated cost recovery (MACRS).
                </p>
                <p>K-1 distributions reported per IRC Section 703(a) for partnership income allocation.</p>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Info className="w-4 h-4" />
                  <span>Consult tax advisor for personalized guidance.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Note */}
        <div className="mt-6 text-[#7a95b8] text-sm border border-[#1e3a5f] bg-[#0d1526] p-4 rounded-md">
          <p>
            Deals structured under SEC Reg D 506(b) or 506(c). Accredited investor status required per Rule 501(a).
            Minimum investment thresholds apply.
          </p>
        </div>
      </div>
      <PageInsights section="syndication-deal-analyzer" />
    </div>
  );
};

export default SyndicationDealAnalyzer;