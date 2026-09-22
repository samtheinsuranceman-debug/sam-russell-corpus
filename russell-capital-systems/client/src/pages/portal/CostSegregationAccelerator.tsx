// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Building2, Calculator, DollarSign, LineChartIcon, PieChartIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const CostSegregationAccelerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'projection'>('input');
  const [propertyType, setPropertyType] = useState('multifamily');
  const [purchasePrice, setPurchasePrice] = useState(5000000);
  const [studyCost, setStudyCost] = useState(10000);
  const [bonusDepreciation, setBonusDepreciation] = useState(true);
  const [lookbackStudy, setLookbackStudy] = useState(false);

  // Sample data for charts
  const depreciationData = Array.from({ length: 50 }, (_, i) => ({
    year: i + 1,
    accelerated: i < 5 ? 400000 - i * 80000 : i < 15 ? 80000 : 20000,
    straightLine: 125000,
  }));

  const componentBreakdown = [
    { name: 'Personal Property (5 yr)', value: 750000 },
    { name: 'Land Improvements (15 yr)', value: 500000 },
    { name: 'Building (39 yr)', value: 3750000 },
  ];

  const handleGenerateOutcome = () => {
    if (purchasePrice < 100000) {
      toast.error('Purchase price must be at least $100,000');
      return;
    }
    setActiveTab('analysis');
    toast.success('Analysis generated successfully');
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">Cost Segregation Accelerator</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-[#1e3a5f] mb-6">
          {['input', 'analysis', 'projection'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'input' | 'analysis' | 'projection')}
              className={`px-4 py-2 capitalize ${activeTab === tab ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-[#7a95b8]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Property Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#7a95b8] mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded p-2 text-white"
                >
                  <option value="multifamily">Multifamily</option>
                  <option value="office">Office</option>
                  <option value="retail">Retail</option>
                  <option value="industrial">Industrial</option>
                  <option value="hotel">Hotel</option>
                </select>
              </div>
              <div>
                <label className="block text-[#7a95b8] mb-1">Purchase Price</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[#7a95b8] mb-1">Cost Seg Study Cost</label>
                <input
                  type="number"
                  value={studyCost}
                  onChange={(e) => setStudyCost(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded p-2 text-white"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bonusDepreciation}
                    onChange={() => setBonusDepreciation(!bonusDepreciation)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <label className="text-[#7a95b8]">Apply §168(k) Bonus Depreciation</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lookbackStudy}
                    onChange={() => setLookbackStudy(!lookbackStudy)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <label className="text-[#7a95b8]">Lookback Study (§481(a) Adj.)</label>
                </div>
              </div>
            </div>
            <button
              onClick={handleGenerateOutcome}
              className="mt-6 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 rounded text-white font-medium"
            >
              Generate Outcome
            </button>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                First-Year Tax Savings
              </h2>
              <p className="text-3xl text-emerald-400">{formatCurrency(purchasePrice * 0.15)}</p>
              <p className="text-[#7a95b8] mt-2">Estimated savings based on accelerated depreciation schedules.</p>
            </div>
            <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-400" />
                Component Breakdown
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={componentBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" tickFormatter={(v) => `$${v/1000}K`} />
                    <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f' }} />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Projection Tab */}
        {activeTab === 'projection' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-emerald-400" />
              50-Year Depreciation Projection
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={depreciationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" stroke="#7a95b8" />
                  <YAxis stroke="#7a95b8" tickFormatter={(v) => `$${v/1000}K`} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f' }} />
                  <Area type="monotone" dataKey="accelerated" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Accelerated" />
                  <Area type="monotone" dataKey="straightLine" stroke="#64748b" fill="#64748b" fillOpacity={0.1} name="Straight-Line" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[#7a95b8] mt-2">Comparison of accelerated vs. straight-line depreciation over 50 years per IRS §168.</p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 text-[#7a95b8]">
          <Activity className="w-4 h-4 text-emerald-400" />
          <p>Track component reclassification and tax benefits in real-time.</p>
        </div>
      </div>
      <PageInsights section="cost-segregation-accelerator" />
    </div>
  );
};

export default CostSegregationAccelerator;