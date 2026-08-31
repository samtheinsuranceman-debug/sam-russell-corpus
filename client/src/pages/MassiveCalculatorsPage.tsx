import React, { useState } from 'react';
import { Link } from 'wouter';

const categories = {
  'RETIREMENT & INCOME': [
    { slug: 'social-security', name: 'Social Security Optimizer', desc: 'Optimal claiming strategy for both spouses with IUL bridge.' },
    { slug: 'retirement-drivers', name: 'Retirement Drivers', desc: 'Key factors driving your retirement readiness score.' },
    { slug: 'income-gap-analyzer', name: 'Income Gap Analyzer', desc: 'Identify and close gaps in your retirement income plan.' },
    { slug: 'withdrawal-sequencing', name: 'Withdrawal Sequencing', desc: 'Optimal order for drawing down retirement accounts.' },
    { slug: 'lifetime-income', name: 'Lifetime Income', desc: 'Model guaranteed income streams across your lifetime.' },
    { slug: 'income-timeline', name: 'Income Timeline', desc: 'Visual timeline of all income sources through retirement.' },
    { slug: 'income-calculator', name: 'Income Calculator', desc: 'Calculate total retirement income from all sources.' },
  ],
  'TAX & ESTATE': [
    { slug: 'tax-waterfall', name: 'Tax Waterfall', desc: 'Visualize tax brackets and optimize Roth conversion strategy.' },
    { slug: 'roth-conversion', name: 'Roth Conversion', desc: 'Model multi-year Roth conversion ladders with tax impact.' },
    { slug: 'estate-planning', name: 'Estate Planning', desc: 'Estate tax minimization and wealth transfer strategies.' },
    { slug: 'hot-income', name: 'Hot Income', desc: 'Identify and optimize high-tax income sources.' },
    { slug: 'tax-arbitrage', name: 'Tax Arbitrage', desc: 'Exploit tax rate differentials across time and accounts.' },
    { slug: 'dynamic-tax', name: 'Dynamic Tax', desc: 'Real-time tax bracket modeling with scenario comparison.' },
  ],
  'IUL & INSURANCE': [
    { slug: 'iul-projection', name: 'IUL Projection', desc: 'Advanced Indexed Universal Life policy projections.' },
    { slug: 'iul-historical', name: 'IUL Historical', desc: 'Backtest IUL performance against historical index data.' },
    { slug: 'premium-financing', name: 'Premium Financing', desc: 'Model leveraged premium financing strategies.' },
    { slug: 'fia-collateral', name: 'FIA Collateral', desc: 'Fixed Indexed Annuity as collateral strategies.' },
    { slug: 'ilit-estate', name: 'ILIT Estate', desc: 'Irrevocable Life Insurance Trust planning.' },
  ],
  'REAL ESTATE': [
    { slug: 'mortgage-killer', name: 'Mortgage Killer', desc: 'HELOC-to-IUL strategy to eliminate mortgage debt.' },
    { slug: 'house-recycling', name: 'House Recycling', desc: 'Equity recycling strategies for wealth building.' },
    { slug: 'household-wealth', name: 'Household Wealth', desc: 'Total household wealth optimization.' },
    { slug: 'real-estate-mogul', name: 'Real Estate Mogul', desc: 'Multi-property investment analysis.' },
    { slug: 'reverse-heloc', name: 'Reverse HELOC', desc: 'Reverse HELOC strategies for retirement income.' },
  ],
  'LIFE EVENTS': [
    { slug: 'divorce-calculator', name: 'Divorce Recovery', desc: 'Asset protection and recovery planning for divorce.' },
    { slug: 'newborn-launchpad', name: 'Newborn Launchpad', desc: 'Financial planning from birth to independence.' },
    { slug: 'special-needs', name: 'Special Needs', desc: 'Financial planning for special needs dependents.' },
    { slug: 'caregiver-impact', name: 'Caregiver Impact', desc: 'Financial impact analysis of caregiving responsibilities.' },
  ],
  'ADVANCED STRATEGIES': [
    { slug: 'time-machine', name: 'Time Machine', desc: 'Historical "what if" scenario simulation.' },
    { slug: 'strategy-lab', name: 'Strategy Lab', desc: 'Experiment with financial strategies using interoperable tools.' },
    { slug: 'index-backtester', name: 'Index Backtester', desc: 'Backtest any index strategy against historical data.' },
    { slug: 'crypto-cycle', name: 'Crypto Cycle', desc: 'Cryptocurrency cycle analysis and allocation.' },
    { slug: 'oil-gas', name: 'Oil & Gas', desc: 'Oil and gas royalty income and tax optimization.' },
  ],
  'LIFESTYLE & PROTECTION': [
    { slug: 'inflation-analysis', name: 'Inflation Analysis', desc: 'Model inflation impact on your financial plan.' },
    { slug: 'healthcare-bomb', name: 'Healthcare Bomb', desc: 'Healthcare cost explosion modeling and protection.' },
    { slug: 'myga-waterfall', name: 'MYGA Waterfall', desc: 'Multi-Year Guaranteed Annuity laddering strategy.' },
  ],
};

const MassiveCalculatorsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-4">🧮</span>
          <h1 className="text-4xl font-bold">Massive Calculators</h1>
        </div>
        <p className="mb-6 text-lg text-gray-300">
          Our comprehensive suite of 67+ interconnected financial calculators, organized by category. 
          Each calculator shares data with all others through the Interop Engine.
        </p>
        <input
          type="text"
          placeholder="Search calculators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1f2a] border border-gray-600 rounded-xl px-4 py-3 text-white mb-8 focus:border-[#22c55e] focus:outline-none"
        />
        {Object.entries(categories).map(([category, calcs]) => {
          const filtered = calcs.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.desc.toLowerCase().includes(search.toLowerCase())
          );
          if (filtered.length === 0) return null;
          return (
            <div key={category} className="mb-10">
              <h2 className="text-xl font-semibold text-[#22c55e] mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((calc) => (
                  <Link key={calc.slug} to={`/portal/${calc.slug}`}
                    className="bg-[#1a1f2a] border border-white/10 rounded-xl p-5 hover:bg-[#22c55e]/10 hover:scale-[1.02] transition-all duration-300"
                  >
                    <h3 className="text-lg font-semibold mb-1">{calc.name}</h3>
                    <p className="text-gray-400 text-sm">{calc.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MassiveCalculatorsPage;
