// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Calculator, Calendar, CheckCircle2, DollarSign, FileText, Percent, PieChartIcon, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const TaxableAccountOptimizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [capitalGainsBudget, setCapitalGainsBudget] = useState(50000);
  const [muniBondAllocation, setMuniBondAllocation] = useState(30);
  const [taxLotMethod, setTaxLotMethod] = useState('specific-id');

  const sampleAssetData = [
    { name: 'Taxable', value: 120000, taxRate: 0.2 },
    { name: 'Tax-Deferred', value: 180000, taxRate: 0 },
    { name: 'Roth', value: 100000, taxRate: 0 },
  ];

  const sampleReturnData = [
    { month: 'Jan', afterTax: 5200, preTax: 6500 },
    { month: 'Feb', afterTax: 4800, preTax: 6000 },
    { month: 'Mar', afterTax: 5500, preTax: 6800 },
    { month: 'Apr', afterTax: 5100, preTax: 6400 },
    { month: 'May', afterTax: 5900, preTax: 7300 },
    { month: 'Jun', afterTax: 5400, preTax: 6700 },
  ];

  const handleGenerateOutcome = () => {
    toast.success('Optimization Complete', {
      description: 'Your taxable account strategy has been updated for maximum after-tax returns.',
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Wallet className="w-4 h-4 mr-2" /> },
    { id: 'asset-location', label: 'Asset Location', icon: <PieChartIcon className="w-4 h-4 mr-2" /> },
    { id: 'tax-efficiency', label: 'Tax Efficiency', icon: <Calculator className="w-4 h-4 mr-2" /> },
    { id: 'capital-gains', label: 'Capital Gains', icon: <TrendingUp className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <Activity className="w-6 h-6 mr-2 text-emerald-400" />
            Taxable Account Optimizer
          </h1>
          <p className="text-[#7a95b8] text-sm">Optimize after-tax returns with strategic planning</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#1e3a5f]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center ${
                activeTab === tab.id
                  ? 'bg-[#0d1526] border-b-2 border-emerald-400 text-emerald-400'
                  : 'text-[#7a95b8] hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-[#0d1526] rounded-lg p-6 shadow-md border border-[#1e3a5f]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <PieChartIcon className="w-5 h-5 mr-2 text-emerald-400" />
                    Asset Location Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={sampleAssetData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="name" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0f1a', borderColor: '#1e3a5f', color: 'white' }} />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                    After-Tax Returns
                  </h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={sampleReturnData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="month" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0f1a', borderColor: '#1e3a5f', color: 'white' }} />
                      <Area type="monotone" dataKey="afterTax" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="preTax" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-[#7a95b8] text-sm">
                Data based on IRS guidelines for capital gains under Section 1(h) and qualified dividends under Section 1(h)(11).
              </p>
            </div>
          )}

          {activeTab === 'asset-location' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-emerald-400" />
                Optimize Asset Placement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0a0f1a] rounded-md border border-[#1e3a5f]">
                  <h4 className="font-medium">Taxable Accounts</h4>
                  <p className="text-[#7a95b8] text-sm mt-2">ETFs, Index Funds, Muni Bonds</p>
                </div>
                <div className="p-4 bg-[#0a0f1a] rounded-md border border-[#1e3a5f]">
                  <h4 className="font-medium">Tax-Deferred Accounts</h4>
                  <p className="text-[#7a95b8] text-sm mt-2">Bonds, REITs, Active Funds</p>
                </div>
                <div className="p-4 bg-[#0a0f1a] rounded-md border border-[#1e3a5f]">
                  <h4 className="font-medium">Roth Accounts</h4>
                  <p className="text-[#7a95b8] text-sm mt-2">Growth Stocks, High-Yield Assets</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax-efficiency' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Percent className="w-5 h-5 mr-2 text-emerald-400" />
                Tax-Efficient Fund Selection
              </h3>
              <div className="flex flex-col gap-4">
                <label className="text-sm">Municipal Bond Allocation by Tax Bracket</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={muniBondAllocation}
                  onChange={(e) => setMuniBondAllocation(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <p className="text-[#7a95b8] text-sm">Current Allocation: {muniBondAllocation}%</p>
              </div>
              <p className="text-[#7a95b8] text-sm">
                Muni bond interest exempt under IRS Section 103(a).
              </p>
            </div>
          )}

          {activeTab === 'capital-gains' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                Capital Gains Budget Management
              </h3>
              <div className="flex flex-col gap-4">
                <label className="text-sm">Annual Capital Gains Budget ($)</label>
                <input
                  type="number"
                  value={capitalGainsBudget}
                  onChange={(e) => setCapitalGainsBudget(Number(e.target.value))}
                  className="bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 w-48 text-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm">Tax Lot Identification Method</label>
                <select
                  value={taxLotMethod}
                  onChange={(e) => setTaxLotMethod(e.target.value)}
                  className="bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 w-48 text-white"
                >
                  <option value="specific-id">Specific ID</option>
                  <option value="fifo">FIFO</option>
                  <option value="hifo">HIFO</option>
                </select>
              </div>
            </div>
          )}

          {/* Generate Outcome Section */}
          <div className="mt-8 p-4 border-t border-[#1e3a5f]">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
              Generate Optimization Outcome
            </h3>
            <button
              onClick={handleGenerateOutcome}
              className="px-6 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-400 transition-colors"
            >
              Generate Outcome
            </button>
          </div>

          {/* Additional Tools */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0a0f1a] rounded-md border border-[#1e3a5f]">
              <h4 className="font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
                Wash Sale Avoidance Calendar
              </h4>
              <p className="text-[#7a95b8] text-sm mt-2">Track 30-day windows for sales</p>
            </div>
            <div className="p-4 bg-[#0a0f1a] rounded-md border border-[#1e3a5f]">
              <h4 className="font-medium flex items-center">
                <FileText className="w-4 h-4 mr-2 text-emerald-400" />
                Year-End Tax Checklist
              </h4>
              <p className="text-[#7a95b8] text-sm mt-2">Complete critical planning tasks</p>
            </div>
            <div className="p-4 bg-[#0a0f1a] rounded-md border border-[#1e3a5f]">
              <h4 className="font-medium flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-emerald-400" />
                Estimated Tax Scheduler
              </h4>
              <p className="text-[#7a95b8] text-sm mt-2">Plan quarterly payments</p>
            </div>
          </div>
        </div>
      </div>
      <PageInsights section="taxable-account-optimizer" />
    </div>
  );
};

export default TaxableAccountOptimizer;