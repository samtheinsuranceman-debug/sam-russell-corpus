// @ts-nocheck

import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingDown, ArrowRight, CheckCircle2, AlertTriangle, Layers, FileText, BarChart3, Target, Zap, Shield } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  ComposedChart, 
  Area 
} from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const TaxStrategyOptimizer = () => {
  const [taxYear, setTaxYear] = useState('2023');

  // Sample data for charts
  const currentTaxData = [
    { name: 'Federal', value: 245000 },
    { name: 'State', value: 78000 },
    { name: 'FICA', value: 12400 },
  ];

  const optimizedTaxData = [
    { name: 'Federal', value: 142000 },
    { name: 'State', value: 45000 },
    { name: 'FICA', value: 12400 },  // Assuming FICA remains the same
  ];

  const COLORS = ['#f97316', '#10b981', '#ef4444'];  // Orange, Emerald, Red accents

  const waterfallData = [
    { name: 'Initial', value: 335400 },
    { name: 'Roth', value: -18000 },
    { name: 'Cost Seg', value: -42000 },
    { name: 'O&G', value: -28000 },
    { name: 'Charitable', value: -15000 },
    { name: 'HELOC', value: -8000 },
    { name: 'Business', value: -12000 },
    { name: 'Retirement', value: -13000 },
    { name: 'Final', value: 199400 },  // Optimized total
  ];

  const projectionData = [
    { year: 1, savings: 136000 },
    { year: 2, savings: 272000 },
    { year: 3, savings: 408000 },
    { year: 4, savings: 544000 },
    { year: 5, savings: 680000 },
    { year: 6, savings: 816000 },
    { year: 7, savings: 952000 },
    { year: 8, savings: 1088000 },
    { year: 9, savings: 1224000 },
    { year: 10, savings: 1800000 },  // Cumulative over 10 years
  ];

  const strategies = [
    { title: 'Roth Conversion', code: 'IRC 408A', savings: '$18K', icon: <Zap className="text-emerald-500" /> },
    { title: 'Cost Segregation', code: 'IRC 168', savings: '$42K', icon: <Layers className="text-orange-500" /> },
    { title: 'Oil & Gas', code: 'IRC 263(c)', savings: '$28K', icon: <TrendingDown className="text-emerald-500" /> },
    { title: 'Charitable Contributions', code: 'IRC 170', savings: '$15K', icon: <CheckCircle2 className="text-orange-500" /> },
    { title: 'HELOC', code: 'IRC 163', savings: '$8K', icon: <Shield className="text-emerald-500" /> },
    { title: 'Business Deductions', code: 'IRC 162', savings: '$12K', icon: <FileText className="text-orange-500" /> },
    { title: 'Retirement Contributions', code: 'IRC 401', savings: '$13K', icon: <Target className="text-emerald-500" /> },
    { title: 'Additional Strategy', code: 'IRC 121', savings: '$10K', icon: <AlertTriangle className="text-orange-500" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-4 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Calculator className="mr-2 text-emerald-500" />
          Tax Strategy Optimizer
        </h1>
        <select 
          className="bg-[#0d1526] p-2 rounded border border-[#1e3a5f] text-white"
          onChange={(e) => setTaxYear(e.target.value)}
          value={taxYear}
        >
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
        <button className="bg-emerald-500 px-4 py-2 rounded flex items-center">
          <ArrowRight className="mr-2" /> Analyze
        </button>
      </div>

      {/* Inputs Section */}
      <div className="mb-8 bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 flex items-center">
          <DollarSign className="mr-2 text-orange-500" /> Inputs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Gross Income</label>
            <input 
              type="number" 
              value="850000" 
              className="bg-gray-700 p-2 rounded w-full text-white" 
              readOnly 
            />
          </div>
          <div>
            <label className="block mb-1">Filing Status</label>
            <select className="bg-gray-700 p-2 rounded w-full text-white">
              <option>Single</option>
              <option>Married Filing Jointly</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">State</label>
            <select className="bg-gray-700 p-2 rounded w-full text-white">
              <option>California</option>
              <option>New York</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Deductions</label>
            <input type="number" value="50000" className="bg-gray-700 p-2 rounded w-full text-white" readOnly />
          </div>
          <div className="col-span-2">
            <label className="block mb-1">Business/Investment/RE Income</label>
            <input type="number" value="200000" className="bg-gray-700 p-2 rounded w-full text-white" readOnly />
          </div>
        </div>
      </div>

      {/* Current Tax Section */}
      <div className="mb-8 bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 flex items-center">
          <BarChart3 className="mr-2 text-orange-500" /> Current Tax
        </h2>
        <p className="mb-2">Federal: $245K</p>
        <p className="mb-2">State: $78K</p>
        <p className="mb-2">FICA: $12.4K</p>
        <p className="mb-2">Total: $335.4K</p>
        <p className="mb-4">Rate: 39.5%</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={currentTaxData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {currentTaxData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Optimized Tax Section */}
      <div className="mb-8 bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 flex items-center">
          <Target className="mr-2 text-emerald-500" /> Optimized Tax
        </h2>
        <p className="mb-2">Federal: $142K</p>
        <p className="mb-2">State: $45K</p>
        <p className="mb-2">FICA: $12.4K</p>
        <p className="mb-2">Total: $199.4K</p>
        <p className="mb-2">Rate: 23.5%</p>
        <p className="mb-4">Savings: $136K</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={optimizedTaxData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#82ca9d" label>
              {optimizedTaxData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Waterfall Chart */}
      <div className="mb-8 bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 flex items-center">
          <TrendingDown className="mr-2 text-orange-500" /> Waterfall Chart
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={waterfallData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#f97316" />
            <Area type="monotone" dataKey="value" fill="#10b981" stroke="#10b981" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Strategy Details */}
      <div className="mb-8 bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 flex items-center">
          <Layers className="mr-2 text-emerald-500" /> Strategy Details
        </h2>
        <div className="space-y-4">
          {strategies.map((strategy, index) => (
            <details key={index} className="bg-gray-700 p-4 rounded">
              <summary className="cursor-pointer font-bold">{strategy.icon} {strategy.title} - Savings: {strategy.savings}</summary>
              <p>IRC Code: {strategy.code}</p>
              <p>Implementation Steps: 1. Consult a tax advisor. 2. Apply via IRS forms. 3. Track expenses.</p>
            </details>
          ))}
        </div>
      </div>

      {/* 10-Year Projection */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 flex items-center">
          <LineChart className="mr-2 text-orange-500" /> 10-Year Projection
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={projectionData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="savings" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <PageInsights section="tax-strategy-optimizer" />
    </div>
  );
};

export default TaxStrategyOptimizer;
