// @ts-nocheck
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Building, Calculator, DollarSign, LineChartIcon, PieChartIcon, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const RealEstateDepreciationRecapture = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState([
    { id: 1, name: 'Commercial Plaza', purchasePrice: 1200000, accumulatedDep: 300000, basis: 900000, type: '1250' },
    { id: 2, name: 'Residential Rental', purchasePrice: 800000, accumulatedDep: 200000, basis: 600000, type: '1250' },
    { id: 3, name: 'Equipment', purchasePrice: 150000, accumulatedDep: 120000, basis: 30000, type: '1245' },
  ]);
  const [installmentSale, setInstallmentSale] = useState(false);
  const [exchange1031, setExchange1031] = useState(false);
  const [bootAmount, setBootAmount] = useState(0);
  const [stateTaxRate, setStateTaxRate] = useState(5);

  const calculateRecapture = (prop) => {
    if (prop.type === '1250') {
      return { unrecapturedGain: prop.accumulatedDep * 0.25, ordinary: 0 }; // §1250 unrecaptured gain at 25%
    } else {
      return { unrecapturedGain: 0, ordinary: prop.accumulatedDep }; // §1245 ordinary income
    }
  };

  const recaptureData = properties.map(p => ({
    name: p.name,
    unrecaptured: calculateRecapture(p).unrecapturedGain,
    ordinary: calculateRecapture(p).ordinary,
  }));

  const timelineData = [
    { year: '2023', event: 'Purchase', value: 2000000 },
    { year: '2024', event: 'Depreciation', value: 1800000 },
    { year: '2025', event: 'Disposition', value: 2200000 },
    { year: '2026', event: 'Recapture Tax', value: 500000 },
  ];

  const totalRecapture = properties.reduce((sum, p) => {
    const recapture = calculateRecapture(p);
    return sum + recapture.unrecapturedGain + recapture.ordinary;
  }, 0);
  const niit = totalRecapture * 0.038; // Net Investment Income Tax 3.8%

  const handleAddProperty = () => {
    toast.success('Property added successfully');
    setProperties([...properties, { id: properties.length + 1, name: 'New Property', purchasePrice: 500000, accumulatedDep: 100000, basis: 400000, type: '1250' }]);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Building className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">Real Estate Depreciation Recapture Calculator</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-[#1e3a5f] mb-6">
          {['overview', 'recapture', 'planning'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 capitalize ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#7a95b8]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">Total Recapture</h2>
                </div>
                <p className="text-2xl font-bold text-emerald-500">${totalRecapture.toLocaleString()}</p>
                <p className="text-sm text-[#7a95b8]">Includes §1250 &amp; §1245</p>
              </div>
              <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">NIIT (3.8%)</h2>
                </div>
                <p className="text-2xl font-bold text-emerald-500">${niit.toLocaleString()}</p>
                <p className="text-sm text-[#7a95b8]">Net Investment Income Tax</p>
              </div>
              <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">State Tax Impact</h2>
                </div>
                <input
                  type="number"
                  value={stateTaxRate}
                  onChange={e => setStateTaxRate(Number(e.target.value))}
                  className="w-20 bg-[#0a0f1a] border border-[#1e3a5f] rounded p-1 text-white"
                />
                <p className="text-sm text-[#7a95b8]">Adjust state rate (%)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[#7a95b8] text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <p>Recapture taxed at higher rates per IRS §1250 (25%) and §1245 (ordinary income).</p>
            </div>
          </div>
        )}

        {/* Recapture Tab */}
        {activeTab === 'recapture' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">Recapture by Property</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={recaptureData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                    <Bar dataKey="unrecaptured" fill="#34d399" name="Unrecaptured Gain (25%)" />
                    <Bar dataKey="ordinary" fill="#f87171" name="Ordinary Income" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
                <div className="flex items-center gap-2 mb-4">
                  <LineChartIcon className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">Disposition Timeline</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                    <Line type="monotone" dataKey="value" stroke="#34d399" name="Value ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <button onClick={handleAddProperty} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg">
              Add Property
            </button>
          </div>
        )}

        {/* Planning Tab */}
        {activeTab === 'planning' && (
          <div className="space-y-6">
            <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f]">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold">Disposition Strategies</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[#7a95b8]">Installment Sale (Spread Recapture)</label>
                  <input
                    type="checkbox"
                    checked={installmentSale}
                    onChange={() => setInstallmentSale(!installmentSale)}
                    className="accent-emerald-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[#7a95b8]">1031 Like-Kind Exchange (Defer Recapture)</label>
                  <input
                    type="checkbox"
                    checked={exchange1031}
                    onChange={() => setExchange1031(!exchange1031)}
                    className="accent-emerald-400"
                  />
                </div>
                {exchange1031 && (
                  <div className="flex items-center gap-2">
                    <label className="text-[#7a95b8]">Boot Amount ($)</label>
                    <input
                      type="number"
                      value={bootAmount}
                      onChange={e => setBootAmount(Number(e.target.value))}
                      className="w-32 bg-[#0a0f1a] border border-[#1e3a5f] rounded p-1 text-white"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[#7a95b8] text-sm">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <p>Cost segregation may accelerate depreciation but increases recapture risk.</p>
            </div>
            <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg">
              <RefreshCw className="w-4 h-4" />
              Recalculate Strategy
            </button>
          </div>
        )}
      </div>
      <PageInsights section="real-estate-depreciation-recapture" />
    </div>
  );
};

export default RealEstateDepreciationRecapture;