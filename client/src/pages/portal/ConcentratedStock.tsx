// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Target, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, ArrowRight, Percent, Scale, Layers, Zap, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart as ReBarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#ef4444', '#6366f1']; // Amber and blue accents for charts

export default function ConcentratedStock() {
  const [portfolioValue, setPortfolioValue] = useState(1000000); // Example: $1,000,000
  const [singleStockValue, setSingleStockValue] = useState(150000); // Example: $150,000
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [unwindYear, setUnwindYear] = useState(2024);

  const isConcentrated = useMemo(() => singleStockValue > 0.1 * portfolioValue, [singleStockValue, portfolioValue]);

  const diversificationStrategies = [
    { name: 'Exchange Funds', description: 'Pool your concentrated stock with others to diversify without immediate tax implications.', icon: <Layers className="inline mr-2" size={24} /> },
    { name: 'Prepaid Variable Forwards', description: 'Hedge against downside risk by selling a forward contract on your stock.', icon: <Zap className="inline mr-2" size={24} /> },
    { name: 'Protective Collars', description: 'Use options to limit losses while capping gains, providing a balanced risk approach.', icon: <Shield className="inline mr-2" size={24} /> },
    { name: 'Charitable Remainder Trusts', description: 'Donate stock to a trust for tax deductions and receive income streams.', icon: <CheckCircle2 className="inline mr-2" size={24} /> },
    { name: '10b5-1 Plans', description: 'Set up automated selling plans to avoid insider trading accusations while diversifying.', icon: <Scale className="inline mr-2" size={24} /> },
  ];

  const taxUnwindTimeline = [
    { year: 2024, step: 'Assess portfolio and consult advisor', action: 'Evaluate risks and select strategy' },
    { year: 2025, step: 'Implement strategy', action: 'Execute exchange fund or protective collar' },
    { year: 2026, step: 'Monitor and adjust', action: 'Rebalance portfolio and track tax impacts' },
    { year: 2027, step: 'Realize gains', action: 'Sell diversified assets tax-efficiently' },
    { year: 2028, step: 'IRS compliance review', action: 'Ensure adherence to IRC rules' },
  ];

  const pieDataBefore = [
    { name: 'Concentrated Stock', value: 60 },
    { name: 'Other Assets', value: 40 },
  ];

  const pieDataAfter = [
    { name: 'Concentrated Stock', value: 10 },
    { name: 'Diversified Assets', value: 90 },
  ];

  const areaData = useMemo(() => [
    { year: 2024, value: 100 },
    { year: 2025, value: 105 },
    { year: 2026, value: 110 },
    { year: 2027, value: 115 },
    { year: 2028, value: 120 },
    { year: 2029, value: 125 },
    { year: 2030, value: 130 },
    { year: 2031, value: 135 },
    { year: 2032, value: 140 },
    { year: 2033, value: 145 },
  ], []);

  const barData = [
    { scenario: 'Hold Stock', taxImpact: 25000 },
    { scenario: 'Diversify via Exchange', taxImpact: 15000 },
    { scenario: 'Use Protective Collar', taxImpact: 18000 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <header className="flex items-center mb-8">
        <Target className="mr-4 text-amber-400" size={32} />
        <h1 className="text-3xl font-bold">Concentrated Stock Risk Analysis</h1>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <AlertTriangle className="mr-2 text-blue-500" size={24} />
          Risk Analysis
        </h2>
        <p className="mb-4">
          Concentrated stock risk occurs when a single stock comprises more than 10% of your portfolio. This exposes you to significant volatility and potential losses if the stock underperforms.
        </p>
        <div className="flex items-center mb-4">
          <DollarSign className="mr-2 text-amber-400" size={20} />
          <label>Portfolio Value: $</label>
          <input
            type="number"
            value={portfolioValue}
            onChange={(e) => setPortfolioValue(Number(e.target.value))}
            className="ml-2 p-2 bg-[#0d1526] border border-[#1e3a5f] rounded text-white"
          />
        </div>
        <div className="flex items-center mb-4">
          <TrendingUp className="mr-2 text-blue-500" size={20} />
          <label>Single Stock Value: $</label>
          <input
            type="number"
            value={singleStockValue}
            onChange={(e) => setSingleStockValue(Number(e.target.value))}
            className="ml-2 p-2 bg-[#0d1526] border border-[#1e3a5f] rounded text-white"
          />
        </div>
        <p className="text-lg">
          {isConcentrated ? (
            <span className="text-red-500">Alert: Your single stock is over 10% of your portfolio!</span>
          ) : (
            <span className="text-green-500">Your portfolio is diversified.</span>
          )}
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <ArrowRight className="mr-2 text-amber-400" size={24} />
          Diversification Strategies
        </h2>
        <p className="mb-4">Here are five strategies to mitigate concentrated stock risks:</p>
        <ul className="list-disc pl-8">
          {diversificationStrategies.map((strategy, index) => (
            <li key={index} className="mb-4">
              {strategy.icon}
              <button
                onClick={() => setSelectedStrategy(strategy.name)}
                className="text-blue-500 hover:underline"
              >
                {strategy.name}
              </button>: {strategy.description}
            </li>
          ))}
        </ul>
        {selectedStrategy && (
          <div className="mt-4 p-4 bg-[#0d1526] rounded">
            <h3 className="text-xl font-medium">Details for {selectedStrategy}</h3>
            <p>{diversificationStrategies.find(s => s.name === selectedStrategy).description}</p>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Percent className="mr-2 text-blue-500" size={24} />
          Tax-Efficient Unwinding Timeline
        </h2>
        <p className="mb-4">Plan your diversification over time to minimize taxes:</p>
        <div className="flex items-center mb-4">
          <label>Target Unwind Year: </label>
          <input
            type="number"
            value={unwindYear}
            onChange={(e) => setUnwindYear(Number(e.target.value))}
            className="ml-2 p-2 bg-[#0d1526] border border-[#1e3a5f] rounded text-white"
          />
        </div>
        <ul className="list-decimal pl-8">
          {taxUnwindTimeline.map((item, index) => (
            <li key={index} className="mb-2">
              <strong>{item.year}</strong>: {item.step} - {item.action}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <BarChart3 className="mr-2 text-amber-400" size={24} />
          Risk Reduction Visualization
        </h2>
        <p className="mb-4">See how diversification reduces risk with these pie charts.</p>
        <div className="flex space-x-8">
          <div className="w-1/2">
            <h3 className="text-xl mb-2">Before Diversification</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieDataBefore}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieDataBefore.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2">
            <h3 className="text-xl mb-2">After Diversification</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieDataAfter}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieDataAfter.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <TrendingUp className="mr-2 text-blue-500" size={24} />
          10-Year Diversification Projection
        </h2>
        <p className="mb-4">Projected portfolio growth over 10 years with diversification.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={areaData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#fbbf24" fill="#fbbf24" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Percent className="mr-2 text-amber-400" size={24} />
          Capital Gains Tax Impact Comparison
        </h2>
        <p className="mb-4">Compare tax impacts of different strategies.</p>
        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={barData}>
            <XAxis dataKey="scenario" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="taxImpact" fill="#3b82f6" />
          </ReBarChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Shield className="mr-2 text-blue-500" size={24} />
          IRS Compliance
        </h2>
        <p className="mb-4">Ensure your strategies comply with IRS rules:</p>
        <ul className="list-disc pl-8">
          <li className="mb-2">IRC 1259 Constructive Sales: Prevents tax avoidance through derivatives; monitor for synthetic sales.</li>
          <li className="mb-2">Section 83 Restricted Stock: Taxes vested stock as ordinary income; plan for early elections to reduce liability.</li>
          <li className="mb-2">Section 10b5-1 Trading Plans: Allows predefined selling to avoid insider trading claims; ensure plans are documented and followed.</li>
        </ul>
        <p className="mt-4">Always consult a tax professional for personalized advice.</p>
      </section>
      <PageInsights section="concentrated-stock" />
    </div>
  );
}
