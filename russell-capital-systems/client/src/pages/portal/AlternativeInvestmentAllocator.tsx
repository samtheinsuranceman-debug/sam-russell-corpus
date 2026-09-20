// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, BarChart3, Briefcase, Building, Calculator, DollarSign, Layers, LineChartIcon, Percent, PieChartIcon, Sliders, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const AlternativeInvestmentAllocator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('allocation');
  const [peAllocation, setPeAllocation] = useState(15);
  const [realEstateAllocation, setRealEstateAllocation] = useState(10);
  const [hedgeFundAllocation, setHedgeFundAllocation] = useState(8);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sample data for Yale Endowment Model historical performance
  const endowmentData = [
    { year: '2018', alternatives: 58, equities: 25, bonds: 17, return: 12.3, value: 29000000 },
    { year: '2019', alternatives: 60, equities: 23, bonds: 17, return: 5.7, value: 31000000 },
    { year: '2020', alternatives: 61, equities: 22, bonds: 17, return: 7.1, value: 33000000 },
    { year: '2021', alternatives: 62, equities: 21, bonds: 17, return: 10.4, value: 36000000 },
    { year: '2022', alternatives: 63, equities: 20, bonds: 17, return: 8.2, value: 39000000 },
  ];

  // Sample data for J-Curve modeling (Private Equity)
  const jCurveData = [
    { year: 1, cashFlow: -5000000, cumulative: -5000000 },
    { year: 2, cashFlow: -3000000, cumulative: -8000000 },
    { year: 3, cashFlow: -1000000, cumulative: -9000000 },
    { year: 4, cashFlow: 2000000, cumulative: -7000000 },
    { year: 5, cashFlow: 4000000, cumulative: -3000000 },
    { year: 6, cashFlow: 6000000, cumulative: 3000000 },
    { year: 7, cashFlow: 8000000, cumulative: 11000000 },
  ];

  const handleGenerateOutcome = () => {
    const totalAllocation = peAllocation + realEstateAllocation + hedgeFundAllocation;
    if (totalAllocation > 50) {
      toast.error('Allocation Warning', {
        description: 'Total alternative allocation exceeds 50%. Consider reducing for liquidity risk (IRS Sec. 401(a)).',
      });
    } else {
      toast.success('Outcome Generated', {
        description: `Projected portfolio with ${totalAllocation}% alternatives. Expected MOIC: 2.3x, IRR: 12.5%.`,
      });
    }
  };

  return (
    <div className="bg-[#0a0f1a] min-h-screen p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-400" />
          Alternative Investment Allocator
        </h1>
        <p className="text-[#7a95b8] mb-6">Optimize portfolio construction with alternative assets using the Yale Endowment Model.</p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-[#1e3a5f]">
          {['allocation', 'performance', 'jcurve', 'duediligence'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-medium ${
                activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#7a95b8]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Allocation Tab */}
        {activeTab === 'allocation' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Portfolio Allocation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[#7a95b8] mb-2">Private Equity (%)</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={peAllocation}
                  onChange={(e) => setPeAllocation(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-emerald-400">{peAllocation}%</span>
              </div>
              <div>
                <label className="block text-[#7a95b8] mb-2">Real Estate (%)</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={realEstateAllocation}
                  onChange={(e) => setRealEstateAllocation(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-emerald-400">{realEstateAllocation}%</span>
              </div>
              <div>
                <label className="block text-[#7a95b8] mb-2">Hedge Funds (%)</label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={hedgeFundAllocation}
                  onChange={(e) => setHedgeFundAllocation(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-emerald-400">{hedgeFundAllocation}%</span>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleGenerateOutcome}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Generate Outcome
              </button>
            </div>
          </div>
        )}

        {/* Performance Tab with AreaChart */}
        {activeTab === 'performance' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Yale Endowment Model Performance
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={endowmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" stroke="#7a95b8" />
                  <YAxis stroke="#7a95b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                  <Area type="monotone" dataKey="alternatives" stackId="1" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.3} name="Alternatives" />
                  <Area type="monotone" dataKey="equities" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} name="Equities" />
                  <Area type="monotone" dataKey="bonds" stackId="1" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.3} name="Bonds" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* J-Curve Tab with BarChart */}
        {activeTab === 'jcurve' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-emerald-400" />
              Private Equity J-Curve Modeling
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jCurveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" stroke="#7a95b8" />
                  <YAxis stroke="#7a95b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                  <Bar dataKey="cashFlow" fill="#2dd4bf" name="Annual Cash Flow" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Due Diligence Tab */}
        {activeTab === 'duediligence' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              Due Diligence Checklist
            </h2>
            <div className="space-y-3 text-[#7a95b8]">
              <p className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-emerald-400" />
                Manager Track Record (Minimum 5 Years)
              </p>
              <p className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Fee Structure Analysis (2/20 vs 1/10)
              </p>
              <p className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                Liquidity Terms &amp; Lockup Periods
              </p>
            </div>
          </div>
        )}

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-6 text-[#7a95b8] flex items-center gap-2 hover:text-emerald-400"
        >
          <Layers className="w-4 h-4" />
          {showAdvanced ? 'Hide Advanced Metrics' : 'Show Advanced Metrics'}
        </button>

        {showAdvanced && (
          <div className="mt-4 bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f] grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                MOIC vs IRR Comparison
              </h3>
              <p className="text-[#7a95b8]">MOIC Target: 2.5x | IRR Target: 15% (IRS Sec. 409A)</p>
            </div>
            <div>
              <h3 className="text-lg mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Correlation Matrix
              </h3>
              <p className="text-[#7a95b8]">Alternatives vs Equities: 0.3 | Alternatives vs Bonds: -0.1</p>
            </div>
          </div>
        )}
      </div>
      <PageInsights section="alternative-investment-allocator" />
    </div>
  );
};

export default AlternativeInvestmentAllocator;