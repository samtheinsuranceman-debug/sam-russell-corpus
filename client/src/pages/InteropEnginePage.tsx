import React from 'react';
import { Link } from 'wouter';
import { CALCULATOR_COUNT, categoryCounts, type CalculatorCategory } from '@shared/calculatorCatalog';

interface CalculatorNode {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  active: boolean;
  connections: string[];
}

// Real figures only: the counts come from the calculator catalogue the router is tested against.
const CATEGORY_STYLE: Record<CalculatorCategory, { color: string; icon: string }> = {
  "retirement-income": { color: '#22c55e', icon: '💰' },
  tax: { color: '#3b82f6', icon: '📊' },
  insurance: { color: '#a855f7', icon: '🛡️' },
  "real-estate": { color: '#f59e0b', icon: '🏠' },
  "estate-legacy": { color: '#14b8a6', icon: '📜' },
  business: { color: '#eab308', icon: '🏢' },
  "life-events": { color: '#ef4444', icon: '🎯' },
  markets: { color: '#06b6d4', icon: '📈' },
  diagnostics: { color: '#ec4899', icon: '🧠' },
  practice: { color: '#84cc16', icon: '🧰' },
};

const CALCULATOR_CATEGORIES = categoryCounts()
  .filter((c) => c.count > 0)
  .map((c) => ({ name: c.label, count: c.count, ...CATEGORY_STYLE[c.category] }));

const InteropEnginePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-4 animate-fade-in">
          <span className="text-4xl mr-4">⚡</span>
          <div>
            <h1 className="text-4xl font-bold">Interop Engine</h1>
            <p className="text-[#22c55e] text-sm font-mono">PROPRIETARY — Cascading Multi-Calculator Financial Interoperability Engine</p>
          </div>
        </div>

        <p className="mb-8 text-lg text-gray-300 max-w-3xl">
          The Interop Engine is the neural network of Russell Capital Systems. It enables real-time 
          bidirectional data propagation across {CALCULATOR_COUNT} catalogued financial calculators, ensuring 
          that a single variable change cascades intelligently through every relevant model.
        </p>

        {/* Catalogue figures — counted from the calculator catalogue, not simulated */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#1a1f2a] border border-[#22c55e]/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[#22c55e]">{CALCULATOR_COUNT}</p>
            <p className="text-gray-400 text-sm">Calculators in the catalogue</p>
          </div>
          <div className="bg-[#1a1f2a] border border-[#22c55e]/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[#22c55e]">{CALCULATOR_CATEGORIES.length}</p>
            <p className="text-gray-400 text-sm">Categories</p>
          </div>
        </div>
        <p className="mb-8 text-xs text-gray-500">
          Live data-flow and sync counts are not shown: they are not yet measured. They will appear here once the engine records them.
        </p>

        {/* Network Visualization Placeholder */}
        <div className="bg-[#1a1f2a] border border-[#22c55e]/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#22c55e]">Calculator Network Graph</h2>
          <div className="relative h-96 bg-[#0d1117] rounded-lg overflow-hidden">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Animated connection lines */}
              {CALCULATOR_CATEGORIES.map((cat, i) => (
                <g key={cat.name}>
                  <circle
                    cx={110 + (i % 5) * 170}
                    cy={100 + Math.floor(i / 5) * 200}
                    r={30 + cat.count}
                    fill={cat.color}
                    opacity={0.3}
                    className="animate-pulse"
                  />
                  <circle
                    cx={110 + (i % 5) * 170}
                    cy={100 + Math.floor(i / 5) * 200}
                    r={15}
                    fill={cat.color}
                  />
                  <text
                    x={110 + (i % 5) * 170}
                    y={100 + Math.floor(i / 5) * 200 + 50}
                    fill="white"
                    textAnchor="middle"
                    fontSize="11"
                  >
                    {cat.name}
                  </text>
                  <text
                    x={110 + (i % 5) * 170}
                    y={100 + Math.floor(i / 5) * 200 + 5}
                    fill="white"
                    textAnchor="middle"
                    fontSize="14"
                  >
                    {cat.icon}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Calculator Categories Grid */}
        <h2 className="text-2xl font-semibold mb-4">Calculator Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {CALCULATOR_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="bg-[#1a1f2a] border border-white/10 rounded-xl p-5 hover:border-[#22c55e]/50 hover:scale-105 transition-all duration-300"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h3 className="text-lg font-semibold mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-400">{cat.count} interconnected calculators</p>
              <div className="mt-3 h-1 bg-gray-700 rounded">
                <div
                  className="h-1 rounded transition-all duration-1000"
                  style={{ width: '100%', backgroundColor: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Cascade Simulator */}
        <div className="bg-[#1a1f2a] border border-[#22c55e]/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#22c55e]">Cascade Simulator</h2>
          <p className="text-gray-400 mb-4">
            Select a calculator and change a variable to see how the change cascades through 
            all connected models in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <select className="bg-[#0d1117] border border-gray-600 rounded-lg px-4 py-2 text-white">
              <option value="">Select Calculator...</option>
              <option value="mortgage-killer">Mortgage Killer</option>
              <option value="iul-projection">IUL Projection</option>
              <option value="roth-conversion">Roth Conversion</option>
              <option value="tax-waterfall">Tax Waterfall</option>
              <option value="social-security">Social Security</option>
            </select>
            <input
              type="text"
              placeholder="Variable name"
              className="bg-[#0d1117] border border-gray-600 rounded-lg px-4 py-2 text-white"
            />
            <input
              type="number"
              placeholder="New value"
              className="bg-[#0d1117] border border-gray-600 rounded-lg px-4 py-2 text-white"
            />
            <button className="bg-[#22c55e] hover:bg-[#1e9b4f] text-white px-6 py-2 rounded-lg transition-all">
              Simulate Cascade
            </button>
          </div>
        </div>

        {/* AI Strategy Engine Integration */}
        <div className="mt-8 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-emerald-500/30 rounded-xl p-8">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🧠</span>
            <h2 className="text-2xl font-bold text-emerald-400">AI Strategy Engine — Interop Intelligence</h2>
          </div>
          <p className="text-gray-300 mb-4">
            The AI Brain sits at the center of the Interop Engine, orchestrating data flows between all {CALCULATOR_COUNT} catalogued calculators.
            When a variable changes in any calculator, the AI Strategy Engine determines which downstream models are affected,
            prioritizes the cascade order, and generates real-time impact reports for the advisor.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4">
              <h3 className="text-emerald-400 font-semibold mb-2">Intelligent Cascade Routing</h3>
              <p className="text-gray-400 text-sm">The AI determines the optimal propagation path for each variable change, ensuring calculators update in the correct dependency order.</p>
            </div>
            <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4">
              <h3 className="text-emerald-400 font-semibold mb-2">Conflict Resolution</h3>
              <p className="text-gray-400 text-sm">When cascading changes create conflicting outputs, the AI Strategy Engine resolves them using priority rules and alerts the advisor.</p>
            </div>
            <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4">
              <h3 className="text-emerald-400 font-semibold mb-2">Impact Scoring</h3>
              <p className="text-gray-400 text-sm">Every cascade generates an AI-scored impact report showing which client outcomes changed and by how much — in real dollars.</p>
            </div>
          </div>
          <Link href="/portal/ai-brain" className="mt-6 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Open AI Brain Hub →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InteropEnginePage;
