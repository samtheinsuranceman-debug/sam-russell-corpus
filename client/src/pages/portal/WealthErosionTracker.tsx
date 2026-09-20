// @ts-nocheck
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { AlertTriangle, DollarSign, TrendingDown, Info, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const WealthErosionTracker = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [initialWealth, setInitialWealth] = useState(10000000);
  const [showMitigation, setShowMitigation] = useState(false);

  // Sample data for 50-year projection
  const projectionData = [
    { year: 0, value: 10000000, inflation: 9700000, taxes: 9400000, fees: 9100000 },
    { year: 10, value: 8000000, inflation: 7500000, taxes: 7200000, fees: 6900000 },
    { year: 20, value: 6000000, inflation: 5500000, taxes: 5200000, fees: 4900000 },
    { year: 30, value: 4000000, inflation: 3500000, taxes: 3200000, fees: 2900000 },
    { year: 40, value: 3000000, inflation: 2500000, taxes: 2200000, fees: 1900000 },
    { year: 50, value: 2000000, inflation: 1500000, taxes: 1200000, fees: 900000 },
  ];

  // Sample data for erosion factors breakdown
  const erosionFactors = [
    { name: 'Inflation (CPI)', impact: 3.2, cost: 320000 },
    { name: 'Taxes (Federal/State)', impact: 2.8, cost: 280000 },
    { name: 'Fees (Advisory/Funds)', impact: 1.5, cost: 150000 },
    { name: 'Behavioral Costs', impact: 1.2, cost: 120000 },
    { name: 'Opportunity Costs', impact: 0.8, cost: 80000 },
    { name: 'Estate Shrinkage', impact: 0.5, cost: 50000 },
  ];

  const handleWealthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setInitialWealth(value);
      toast.success('Initial wealth updated');
    } else {
      toast.error('Please enter a valid amount');
    }
  };

  return (
    <div className="bg-[#0a0f1a] p-6 rounded-lg border border-[#1e3a5f] text-white">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="text-emerald-400 h-6 w-6" />
        <h2 className="text-2xl font-bold">Wealth Erosion Tracker</h2>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 mb-6 border-b border-[#1e3a5f]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 ${activeTab === 'overview' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-[#7a95b8]'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('projection')}
          className={`pb-3 px-4 ${activeTab === 'projection' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-[#7a95b8]'}`}
        >
          50-Year Projection
        </button>
        <button
          onClick={() => setActiveTab('factors')}
          className={`pb-3 px-4 ${activeTab === 'factors' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-[#7a95b8]'}`}
        >
          Erosion Factors
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 bg-[#0d1526] p-4 rounded-md">
            <DollarSign className="text-emerald-400 h-5 w-5" />
            <span className="text-[#7a95b8]">Initial Wealth:</span>
            <input
              type="number"
              value={initialWealth}
              onChange={handleWealthChange}
              className="bg-[#0d1526] border border-[#1e3a5f] rounded-md p-2 text-white w-32"
            />
          </div>
          <p className="text-[#7a95b8]">
            Wealth erosion is a silent destroyer. Without proper planning, factors like inflation, taxes (per IRS Code Sec. 1), fees, and behavioral costs can reduce a $10M portfolio to $2M over 50 years.
          </p>
          <div className="flex items-center gap-2 text-emerald-400 cursor-pointer" onClick={() => setShowMitigation(!showMitigation)}>
            <Info className="h-4 w-4" />
            <span>Mitigation Strategies</span>
            {showMitigation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {showMitigation && (
            <ul className="list-disc list-inside text-[#7a95b8] space-y-2 pl-2">
              <li>Tax-efficient investing (Roth conversions, per IRS Code Sec. 408A)</li>
              <li>Low-cost index funds to minimize fees</li>
              <li>Estate planning to reduce shrinkage</li>
              <li>Disciplined rebalancing to avoid behavioral costs</li>
            </ul>
          )}
        </div>
      )}

      {activeTab === 'projection' && (
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="year" stroke="#7a95b8" />
                <YAxis stroke="#7a95b8" />
                <Tooltip backgroundColor="#0d1526" contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                <Legend wrapperStyle={{ color: '#7a95b8' }} />
                <Line type="monotone" dataKey="value" stroke="#34d399" name="Wealth Value" />
                <Line type="monotone" dataKey="inflation" stroke="#f87171" name="After Inflation" />
                <Line type="monotone" dataKey="taxes" stroke="#fbbf24" name="After Taxes" />
                <Line type="monotone" dataKey="fees" stroke="#60a5fa" name="After Fees" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[#7a95b8] flex items-center gap-2">
            <TrendingDown className="text-emerald-400 h-4 w-4" />
            Projection shows $10M eroding to $2M over 50 years without intervention.
          </p>
        </div>
      )}

      {activeTab === 'factors' && (
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={erosionFactors} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
                <XAxis type="number" stroke="#7a95b8" tickFormatter={(value) => `${value}%`} />
                <YAxis dataKey="name" type="category" width={120} stroke="#7a95b8" />
                <Tooltip backgroundColor="#0d1526" contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} formatter={(value) => [`${value}%`, 'Annual Impact']} />
                <Bar dataKey="impact" fill="#34d399" name="Impact (% per year)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-[#7a95b8]">
            {erosionFactors.map((factor) => (
              <div key={factor.name} className="flex items-center justify-between bg-[#0d1526] p-3 rounded-md">
                <span>{factor.name}</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3 w-3 text-emerald-400" /> {factor.impact}%
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-400" /> ${factor.cost.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PageInsights section="wealth-erosion-tracker" />
    </div>
  );
};

export default WealthErosionTracker;