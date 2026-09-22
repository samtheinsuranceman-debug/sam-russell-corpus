// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Calculator, DollarSign, Info, Percent, Settings, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const CharitableLeadTrustPlanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clat' | 'clut'>('clat');
  const [isGrantor, setIsGrantor] = useState(true);
  const [payoutRate, setPayoutRate] = useState(5);
  const [trustTerm, setTrustTerm] = useState(20);
  const [initialValue, setInitialValue] = useState(1000000);
  const [section7520Rate, setSection7520Rate] = useState(3.2);

  const sampleData = Array.from({ length: 50 }, (_, i) => ({
    year: i + 1,
    clatValue: initialValue * Math.pow(1.03, i) * (1 - payoutRate / 100),
    clutValue: initialValue * Math.pow(1.025, i) * (1 - payoutRate / 100),
    remainder: initialValue * (payoutRate / 100) * Math.pow(1.02, i),
  }));

  const taxDeduction = isGrantor
    ? (initialValue * (payoutRate / 100) * trustTerm * (section7520Rate / 100)).toFixed(2)
    : 'Not applicable for non-grantor trusts';

  const handleGenerateOutcome = () => {
    if (initialValue < 10000) {
      toast.error('Initial trust value must be at least $10,000');
      return;
    }
    toast.success('Outcome generated based on current parameters');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">Charitable Lead Trust Planner</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-[#1e3a5f]">
          <button
            onClick={() => setActiveTab('clat')}
            className={`pb-4 px-6 font-medium ${
              activeTab === 'clat'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-[#7a95b8] hover:text-white'
            }`}
          >
            CLAT (Annuity)
          </button>
          <button
            onClick={() => setActiveTab('clut')}
            className={`pb-4 px-6 font-medium ${
              activeTab === 'clut'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-[#7a95b8] hover:text-white'
            }`}
          >
            CLUT (Unitrust)
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
            <label className="text-[#7a95b8] text-sm block mb-2">Initial Trust Value</label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <input
                type="number"
                value={initialValue}
                onChange={(e) => setInitialValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 w-full text-white"
              />
            </div>
          </div>
          <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
            <label className="text-[#7a95b8] text-sm block mb-2">Payout Rate (%)</label>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-400" />
              <input
                type="number"
                value={payoutRate}
                onChange={(e) => setPayoutRate(Math.max(1, parseFloat(e.target.value) || 1))}
                className="bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 w-full text-white"
              />
            </div>
          </div>
          <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
            <label className="text-[#7a95b8] text-sm block mb-2">Trust Term (Years)</label>
            <input
              type="number"
              value={trustTerm}
              onChange={(e) => setTrustTerm(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 w-full text-white"
            />
          </div>
          <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
            <label className="text-[#7a95b8] text-sm block mb-2">§7520 Rate (%)</label>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <input
                type="number"
                step="0.1"
                value={section7520Rate}
                onChange={(e) => setSection7520Rate(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 w-full text-white"
              />
            </div>
            <p className="text-xs text-[#7a95b8] mt-1">IRS §7520 Interest Rate</p>
          </div>
        </div>

        {/* Grantor Toggle & Info */}
        <div className="flex items-center gap-4 mb-6">
          <label className="text-white font-medium">Grantor Trust?</label>
          <button
            onClick={() => setIsGrantor(!isGrantor)}
            className={`px-4 py-2 rounded-md font-medium ${
              isGrantor ? 'bg-emerald-500 text-white' : 'bg-[#0d1526] text-[#7a95b8]'
            }`}
          >
            {isGrantor ? 'Yes' : 'No'}
          </button>
          <div className="flex items-center gap-1 text-[#7a95b8] text-sm">
            <Info className="w-4 h-4" />
            <p>{isGrantor ? 'Income tax deduction available (IRC §170)' : 'Estate tax deduction for testamentary CLTs (IRC §2055)'}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">Trust Value Projection (50 Years)</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" stroke="#7a95b8" />
                  <YAxis stroke="#7a95b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', borderRadius: '4px' }}
                    labelStyle={{ color: '#7a95b8' }}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="clatValue" stroke="#2dd4bf" fill="#2dd4bf33" name="CLAT Value" />
                  <Area type="monotone" dataKey="clutValue" stroke="#3b82f6" fill="#3b82f633" name="CLUT Value" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">Remainder Interest Growth</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" stroke="#7a95b8" />
                  <YAxis stroke="#7a95b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', borderRadius: '4px' }}
                    labelStyle={{ color: '#7a95b8' }}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Bar dataKey="remainder" fill="#10b981" name="Remainder Interest" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Generate Outcome */}
        <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f] mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate Outcome</h2>
          <p className="text-[#7a95b8] mb-4">
            Calculate tax deductions and remainder interest based on current parameters.
            {isGrantor && ` Estimated Income Tax Deduction: $${taxDeduction}`}
          </p>
          <button
            onClick={handleGenerateOutcome}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-md font-medium"
          >
            Calculate Results
          </button>
        </div>

        <PageInsights section="CharitableLeadTrustPlanner" />
      </div>
    </div>
  );
};

export default CharitableLeadTrustPlanner;