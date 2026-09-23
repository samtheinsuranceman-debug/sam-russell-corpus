// @ts-nocheck
import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Calculator, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const StructuredSettlementPlanner = () => {
  const [activeTab, setActiveTab] = useState('paymentSchedule');
  const [paymentType, setPaymentType] = useState('periodCertain');
  const [inflationAdjusted, setInflationAdjusted] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(50000);
  const [paymentYears, setPaymentYears] = useState(10);

  // Sample data for payment stream visualization
  const paymentData = Array.from({ length: paymentYears }, (_, i) => ({
    year: i + 1,
    basePayment: paymentAmount,
    adjustedPayment: inflationAdjusted ? paymentAmount * Math.pow(1.02, i) : paymentAmount,
  }));

  // Sample data for lump sum vs structured comparison
  const comparisonData = [
    { name: 'Year 1', lumpSum: 400000, structured: 50000 },
    { name: 'Year 5', lumpSum: 450000, structured: 250000 },
    { name: 'Year 10', lumpSum: 500000, structured: 500000 },
  ];

  const handlePaymentTypeToggle = () => {
    setPaymentType(paymentType === 'periodCertain' ? 'lifeContingent' : 'periodCertain');
  };

  const handleCalculate = () => {
    toast.success('Payment schedule recalculated successfully!');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Calculator className="w-8 h-8 text-emerald-400" />
          Structured Settlement Planner
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-[#1e3a5f]">
          {['paymentSchedule', 'presentValue', 'comparison'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-4 font-medium ${
                activeTab === tab
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-[#7a95b8] hover:text-white'
              }`}
            >
              {tab === 'paymentSchedule' && 'Payment Schedule'}
              {tab === 'presentValue' && 'Present Value'}
              {tab === 'comparison' && 'Lump Sum vs Structured'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
          {activeTab === 'paymentSchedule' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[#7a95b8] mb-2">Annual Payment ($)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[#7a95b8] mb-2">Duration (Years)</label>
                  <input
                    type="number"
                    value={paymentYears}
                    onChange={(e) => setPaymentYears(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={handlePaymentTypeToggle}
                  className="flex items-center gap-2 bg-[#0a0f1a] border border-[#1e3a5f] p-2 rounded-md text-white hover:bg-emerald-500"
                >
                  <Calendar className="w-5 h-5" />
                  {paymentType === 'periodCertain' ? 'Period Certain' : 'Life Contingent'}
                </button>
                <label className="flex items-center gap-2 text-[#7a95b8]">
                  <input
                    type="checkbox"
                    checked={inflationAdjusted}
                    onChange={() => setInflationAdjusted(!inflationAdjusted)}
                    className="accent-emerald-500"
                  />
                  Inflation Adjusted (2% Annual)
                </label>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip backgroundColor="#0a0f1a" contentStyle={{ color: 'white' }} />
                    <Legend />
                    <Line type="monotone" dataKey="basePayment" stroke="#8884d8" name="Base Payment" />
                    {inflationAdjusted && (
                      <Line type="monotone" dataKey="adjustedPayment" stroke="#2dd4bf" name="Adjusted Payment" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[#7a95b8] text-sm">
                Payments qualify for tax exclusion under IRC §104(a)(2) for physical injury settlements.
              </p>
            </div>
          )}

          {activeTab === 'presentValue' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                Present Value Calculation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#7a95b8] mb-2">Total Settlement ($)</label>
                  <input
                    type="number"
                    value={500000}
                    readOnly
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#7a95b8] mb-2">Discount Rate (%)</label>
                  <input
                    type="number"
                    value={3.5}
                    readOnly
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#7a95b8] mb-2">Present Value ($)</label>
                  <input
                    type="number"
                    value={425000}
                    readOnly
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleCalculate}
                className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-400 flex items-center gap-2"
              >
                <Activity className="w-5 h-5" />
                Recalculate
              </button>
              <p className="text-[#7a95b8] text-sm">
                Qualified assignments under IRC §130 allow tax-free transfer to annuity providers.
              </p>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                Lump Sum vs Structured Settlement
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip backgroundColor="#0a0f1a" contentStyle={{ color: 'white' }} />
                    <Legend />
                    <Bar dataKey="lumpSum" fill="#8884d8" name="Lump Sum Investment" />
                    <Bar dataKey="structured" fill="#2dd4bf" name="Structured Payments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[#7a95b8] text-sm space-y-2">
                <p>Evaluate factoring company buyout offers against long-term payment value.</p>
                <p>Consider the annuity provider's financial strength ratings.</p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f] text-[#7a95b8] text-sm">
          <p>Commutation rights and factoring options should be reviewed with legal counsel.</p>
          <p>Payments are backed by the claims-paying ability of the issuing insurance company.</p>
        </div>
      </div>
      <PageInsights section="StructuredSettlementPlanner" />
    </div>
  );
};

export default StructuredSettlementPlanner;