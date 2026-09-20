// @ts-nocheck
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, BarChart3, Briefcase, Calculator, Calendar, DollarSign, Info, Layers, Percent, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const PrivateEquitySecondaryMarket = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [navDiscount, setNavDiscount] = useState(15);
  const [vintageYear, setVintageYear] = useState(2018);
  const [capitalCallObligation, setCapitalCallObligation] = useState(2500000);

  const navData = [
    { year: '2019', nav: 10000000, discount: 8500000 },
    { year: '2020', nav: 12000000, discount: 10200000 },
    { year: '2021', nav: 14000000, discount: 11900000 },
    { year: '2022', nav: 13000000, discount: 11050000 },
    { year: '2023', nav: 15000000, discount: 12750000 },
  ];

  const distributionData = [
    { stage: 'Early', expected: 2000000, actual: 1500000 },
    { stage: 'Mid', expected: 5000000, actual: 4500000 },
    { stage: 'Late', expected: 8000000, actual: 7000000 },
    { stage: 'Exit', expected: 12000000, actual: 10000000 },
  ];

  const handleNavDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= 0 && value <= 50) setNavDiscount(value);
    else toast.error('Discount must be between 0% and 50%');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" /> NAV Discount/Premium Analysis
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={navData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#0a0f1a', borderColor: '#1e3a5f' }} />
                      <Line type="monotone" dataKey="nav" stroke="#34d399" name="NAV" />
                      <Line type="monotone" dataKey="discount" stroke="#f87171" name="Discounted Value" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <label className="text-[#7a95b8] block mb-2">Adjust Discount (%)</label>
                  <input
                    type="number"
                    value={navDiscount}
                    onChange={handleNavDiscountChange}
                    className="w-full p-2 bg-[#0a0f1a] text-white rounded-md border border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    max="50"
                  />
                </div>
              </div>
              <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" /> Distribution Waterfall
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="stage" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#0a0f1a', borderColor: '#1e3a5f' }} />
                      <Bar dataKey="expected" fill="#34d399" name="Expected" />
                      <Bar dataKey="actual" fill="#f87171" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" /> Vintage Year &amp; Capital Calls
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#7a95b8] block mb-2">Vintage Year</label>
                  <input
                    type="number"
                    value={vintageYear}
                    onChange={(e) => setVintageYear(Number(e.target.value))}
                    className="w-full p-2 bg-[#0a0f1a] text-white rounded-md border border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="2000"
                    max="2023"
                  />
                </div>
                <div>
                  <label className="text-[#7a95b8] block mb-2">Remaining Capital Call Obligation ($)</label>
                  <input
                    type="number"
                    value={capitalCallObligation}
                    onChange={(e) => setCapitalCallObligation(Number(e.target.value))}
                    className="w-full p-2 bg-[#0a0f1a] text-white rounded-md border border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'legal':
        return (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f] space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-400" /> Legal &amp; Transfer Considerations
            </h3>
            <p className="text-[#7a95b8]">GP Consent Requirements: Transfers often require General Partner approval as per LPA terms.</p>
            <p className="text-[#7a95b8]">Right of First Refusal (ROFR): Existing LPs may have priority to purchase under fund documents.</p>
            <p className="text-[#7a95b8]">Transfer Restrictions: Review fund agreements for lock-up periods and eligibility criteria.</p>
          </div>
        );
      case 'tax':
        return (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f] space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" /> Tax Implications
            </h3>
            <p className="text-[#7a95b8]">LP interest transfers may trigger taxable events under IRS Code Section 741 (capital gains).</p>
            <p className="text-[#7a95b8]">Consult tax advisor for potential Section 754 step-up basis adjustments.</p>
            <div className="flex items-center gap-2 text-[#7a95b8] mt-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span>Warning: Unrealized gains may be taxable upon transfer.</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-400" /> Private Equity Secondary Market Analyzer
        </h1>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'overview' ? 'bg-emerald-500 text-white' : 'bg-[#0d1526] text-[#7a95b8] border border-[#1e3a5f]'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Overview
            </span>
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'legal' ? 'bg-emerald-500 text-white' : 'bg-[#0d1526] text-[#7a95b8] border border-[#1e3a5f]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" /> Legal
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'tax' ? 'bg-emerald-500 text-white' : 'bg-[#0d1526] text-[#7a95b8] border border-[#1e3a5f]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Percent className="w-4 h-4" /> Tax
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-[#7a95b8] mb-6">
          <Info className="w-5 h-5 text-emerald-400" />
          <span>Analyze LP interest sales, pricing models, and liquidity timelines.</span>
        </div>
        {renderTabContent()}
        <div className="mt-6 flex items-center gap-2 text-[#7a95b8]">
          <TrendingDown className="w-5 h-5 text-red-400" />
          <span>Discounted NAV reflects current market conditions for secondary transactions.</span>
        </div>
        <PageInsights section="private-equity-secondary-market" />
      </div>
    </div>
  );
};

export default PrivateEquitySecondaryMarket;