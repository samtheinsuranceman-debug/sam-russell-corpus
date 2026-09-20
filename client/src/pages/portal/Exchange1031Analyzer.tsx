// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Home, DollarSign, TrendingUp, ArrowRight, Building2, CheckCircle2, AlertTriangle, Calendar, Target, RefreshCw, Shield, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const Exchange1031Analyzer = () => {
  const [propertyValue, setPropertyValue] = useState(2000000); // Default property value
  const [purchasePrice, setPurchasePrice] = useState(800000);
  const [currentValue, setCurrentValue] = useState(2000000);
  const [depreciationTaken, setDepreciationTaken] = useState(350000);

  // Calculate derived values using useMemo for optimization
  const adjustedBasis = useMemo(() => purchasePrice - depreciationTaken, [purchasePrice, depreciationTaken]);
  const capitalGain = useMemo(() => currentValue - adjustedBasis, [currentValue, adjustedBasis]);
  const capitalGainsTax = useMemo(() => capitalGain * 0.20, [capitalGain]);
  const depreciationRecapture = useMemo(() => depreciationTaken * 0.25, [depreciationTaken]);
  const netInvestmentIncomeTax = useMemo(() => capitalGain * 0.038, [capitalGain]);
  const stateTax = useMemo(() => capitalGain * 0.05, [capitalGain]);
  const totalTaxDue = useMemo(() => capitalGainsTax + depreciationRecapture + netInvestmentIncomeTax + stateTax, [capitalGainsTax, depreciationRecapture, netInvestmentIncomeTax, stateTax]);

  // Exchange Chain Data
  const exchangeChainData = [
    { year: 0, propertyValue: 800000 },
    { year: 6, propertyValue: 2000000 },
    { year: 12, propertyValue: 3500000 },
    { year: 18, propertyValue: 6100000 },
    { year: 24, propertyValue: 10700000 },
    { year: 30, propertyValue: 18700000 },
  ];

  // Step-Up Basis Comparison Data
  const stepUpBasisData = [
    { category: 'Sell Now', tax: totalTaxDue, value: 0 },
    { category: 'Exchange Chain + Death', tax: 0, value: 18700000 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-teal-400">1031 Exchange Analyzer</h1>
        <div className="flex items-center">
          <DollarSign className="mr-2 text-amber-500" size={24} />
          <input
            type="number"
            value={propertyValue}
            onChange={(e) => setPropertyValue(Number(e.target.value))}
            className="bg-[#0d1526] border border-teal-500 rounded p-2 w-48 text-white"
            placeholder="Property Value"
          />
        </div>
      </header>

      {/* Current Property Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-amber-500 flex items-center">
          <Home size={24} className="mr-2" /> Current Property
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#0d1526] p-4 rounded shadow">
            <label className="block mb-2">Purchase Price:</label>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="bg-gray-700 w-full p-2 rounded text-white"
            />
          </div>
          <div className="bg-[#0d1526] p-4 rounded shadow">
            <label className="block mb-2">Current Value:</label>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className="bg-gray-700 w-full p-2 rounded text-white"
            />
          </div>
          <div className="bg-[#0d1526] p-4 rounded shadow">
            <label className="block mb-2">Depreciation Taken:</label>
            <input
              type="number"
              value={depreciationTaken}
              onChange={(e) => setDepreciationTaken(Number(e.target.value))}
              className="bg-gray-700 w-full p-2 rounded text-white"
            />
          </div>
          <div className="bg-[#0d1526] p-4 rounded shadow">
            <p className="font-bold">Adjusted Basis: ${adjustedBasis.toLocaleString()}</p>
          </div>
          <div className="bg-[#0d1526] p-4 rounded shadow">
            <p className="font-bold">Capital Gain: ${capitalGain.toLocaleString()}</p>
          </div>
          <div className="bg-[#0d1526] p-4 rounded shadow">
            <p className="font-bold">Depreciation Recapture: ${depreciationRecapture.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Tax Without Exchange Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-amber-500 flex items-center">
          <AlertTriangle size={24} className="mr-2" /> Tax Without Exchange
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center">
            <DollarSign size={32} className="mb-2 text-teal-400" />
            <p>Capital Gains Tax (20%): ${capitalGainsTax.toLocaleString()}</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center">
            <TrendingUp size={32} className="mb-2 text-teal-400" />
            <p>Depreciation Recapture (25%): ${depreciationRecapture.toLocaleString()}</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center">
            <ArrowRight size={32} className="mb-2 text-teal-400" />
            <p>Net Investment Income Tax (3.8%): ${netInvestmentIncomeTax.toLocaleString()}</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center col-span-1 md:col-span-3">
            <p>State Tax (est 5%): ${stateTax.toLocaleString()}</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded shadow flex flex-col items-center col-span-1 md:col-span-3 border-t border-teal-500">
            <p className="text-xl font-bold">TOTAL TAX DUE: ${totalTaxDue.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Exchange Scenarios Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-amber-500 flex items-center">
          <Building2 size={24} className="mr-2" /> Exchange Scenarios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scenario A */}
          <div className="bg-[#0d1526] p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-2 flex items-center text-teal-400">
              <CheckCircle2 size={20} className="mr-2" /> Scenario A: Equal Exchange
            </h3>
            <p>Sell $2M → Buy $2M property</p>
            <p>Tax deferred: ${totalTaxDue.toLocaleString()}</p>
            <p>New basis: ${adjustedBasis.toLocaleString()}</p>
          </div>
          
          {/* Scenario B */}
          <div className="bg-[#0d1526] p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-2 flex items-center text-amber-500">
              <Target size={20} className="mr-2" /> Scenario B: Trade Up (RECOMMENDED)
            </h3>
            <p>Sell $2M → Buy $3.5M property (with mortgage)</p>
            <p>Tax deferred: ${totalTaxDue.toLocaleString()}</p>
            <p>Additional depreciation: $3.5M basis</p>
            <p>New annual depreciation: $89,744/yr</p>
          </div>
          
          {/* Scenario C */}
          <div className="bg-[#0d1526] p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-2 flex items-center text-teal-400">
              <RefreshCw size={20} className="mr-2" /> Scenario C: Multiple Properties
            </h3>
            <p>Sell $2M → Buy 3 properties at $700K each</p>
            <p>Tax deferred: ${totalTaxDue.toLocaleString()}</p>
            <p>Diversification benefit</p>
            <p>Combined rental income: $126,000/yr</p>
          </div>
        </div>
      </section>

      {/* Exchange Chain Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-amber-500 flex items-center">
          <ArrowRight size={24} className="mr-2" /> Exchange Chain
        </h2>
        <p>Over 30 years with 5 sequential exchanges every 6 years.</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={exchangeChainData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="propertyValue" stroke="#10B981" fill="#10B981" />
          </AreaChart>
        </ResponsiveContainer>
        <p>Total tax deferred: $4.2M</p>
        <p>Step-up basis at death: $18.7M (heirs pay $0 tax)</p>
      </section>

      {/* Timeline Requirements Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-amber-500 flex items-center">
          <Calendar size={24} className="mr-2" /> Timeline Requirements
        </h2>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="w-full md:w-1/2">
            <ul className="list-disc pl-5">
              <li>Day 0: Close on relinquished property</li>
              <li>Day 45: Identify replacement property (up to 3)</li>
              <li>Day 180: Close on replacement property</li>
            </ul>
          </div>
          <div className="w-full md:w-1/2 mt-4 md:mt-0">
            <div className="relative w-full h-16 bg-gray-700 rounded">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-teal-500"></div>
              <div className="absolute top-0 left-0 transform -translate-y-1/2 bg-amber-500 p-2 rounded">Day 0</div>
              <div className="absolute top-0 left-1/3 transform -translate-y-1/2 bg-amber-500 p-2 rounded">Day 45</div>
              <div className="absolute top-0 right-0 transform -translate-y-1/2 bg-amber-500 p-2 rounded">Day 180</div>
            </div>
          </div>
        </div>
      </section>

      {/* IRS Compliance Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-amber-500 flex items-center">
          <Shield size={24} className="mr-2" /> IRS Compliance (IRC §1031)
        </h2>
        <ul className="list-disc pl-5">
          <li>Like-kind requirement</li>
          <li>Qualified intermediary required</li>
          <li>Boot taxation rules</li>
          <li>Related party restrictions</li>
          <li>Reverse exchange option</li>
        </ul>
      </section>

      {/* Step-Up Basis at Death Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-amber-500 flex items-center">
          <Scale size={24} className="mr-2" /> Step-Up Basis at Death
        </h2>
        <p>The greatest tax strategy in real estate</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stepUpBasisData}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tax" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
        <p>Comparison: Sell now (${totalTaxDue.toLocaleString()} tax) vs Exchange chain + die ($0 tax)</p>
      </section>
      <PageInsights section="exchange1031-analyzer" />
    </div>
  );
};

export default Exchange1031Analyzer;
