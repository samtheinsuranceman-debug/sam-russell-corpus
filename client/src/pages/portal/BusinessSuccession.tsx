// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, ArrowRight, Target, Users, Calendar, Award, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function BusinessSuccession() {
  const [selectedPath, setSelectedPath] = useState('internal');
  const [timelineYears, setTimelineYears] = useState(5);

  const valuationMethods = useMemo(() => [
    { name: 'EBITDA Multiple', description: 'A method that multiplies the business\'s EBITDA by an industry multiple to estimate value.' },
    { name: 'Revenue Multiple', description: 'Uses a multiple of the business\'s annual revenue for valuation, common in service-based practices.' },
    { name: 'DCF (Discounted Cash Flow)', description: 'Projects future cash flows and discounts them to present value using a discount rate.' },
    { name: 'Asset-Based', description: 'Values the business based on the net value of its assets minus liabilities.' },
  ], []);

  const successionPaths = useMemo(() => [
    { name: 'Internal Sale to Partners', description: 'Selling to existing partners or employees for a smooth transition.', taxImpact: 25 },
    { name: 'ESOP (Employee Stock Ownership Plan)', description: 'Employees buy shares, providing tax benefits and retention incentives.', taxImpact: 15 },
    { name: 'Third-Party Sale', description: 'Selling to an external buyer, often yielding higher returns but with more complexity.', taxImpact: 35 },
    { name: 'Family Transfer', description: 'Passing the business to family members, potentially with estate tax implications.', taxImpact: 20 },
  ], []);

  const taxImpactData = useMemo(() => successionPaths.map(path => ({
    name: path.name,
    TaxImpact: path.taxImpact,
  })), [successionPaths]);

  const ownershipTransitionData = useMemo(() => [
    { name: 'Year 1', Owner: 90, Successor: 10 },
    { name: 'Year 2', Owner: 80, Successor: 20 },
    { name: 'Year 3', Owner: 70, Successor: 30 },
    { name: 'Year 4', Owner: 60, Successor: 40 },
    { name: 'Year 5', Owner: 50, Successor: 50 },
    { name: 'Year 6', Owner: 40, Successor: 60 },
    { name: 'Year 7', Owner: 30, Successor: 70 },
    { name: 'Year 8', Owner: 20, Successor: 80 },
    { name: 'Year 9', Owner: 10, Successor: 90 },
    { name: 'Year 10', Owner: 0, Successor: 100 },
  ], []);

  const COLORS = ['#4F46E5', '#F59E0B', '#6366F1', '#FBBF24'];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-indigo-400">Business Succession Planning for Physician Practices and Business Owners</h1>
        <p className="text-lg text-[#94a3b8]">Strategic planning for a seamless transition, covering valuation, timelines, paths, and tax considerations.</p>
        <Building2 className="inline mr-2 text-amber-400" size={24} />
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Business Valuation Methods</h2>
        <p className="text-[#7a95b8] mb-6">Understanding how to value your business is crucial for effective succession planning. Here are key methods:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {valuationMethods.map((method, index) => (
            <div key={index} className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
              <DollarSign className="mb-2 text-amber-400" size={20} />
              <h3 className="text-xl font-medium text-indigo-400">{method.name}</h3>
              <p className="text-[#94a3b8]">{method.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Succession Timeline Planner</h2>
        <p className="text-[#7a95b8] mb-6">Plan your 5-10 year exit strategy to ensure a smooth transition.</p>
        <div className="flex items-center mb-4">
          <Calendar className="mr-2 text-amber-400" size={20} />
          <select
            className="bg-[#0d1526] text-white p-2 rounded"
            value={timelineYears}
            onChange={(e) => setTimelineYears(Number(e.target.value))}
          >
            <option value={5}>5 Years</option>
            <option value={7}>7 Years</option>
            <option value={10}>10 Years</option>
          </select>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <ul className="list-disc pl-5 text-[#94a3b8]">
            <li>Year 1-2: Assess business value and prepare financials.</li>
            <li>Year 3-4: Identify and train successors.</li>
            <li>Year 5+: Execute transfer and monitor transition.</li>
          </ul>
          <TrendingUp className="mt-4 text-indigo-400" size={24} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Succession Paths</h2>
        <p className="text-[#7a95b8] mb-6">Explore the four main paths for business succession.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {successionPaths.map((path, index) => (
            <div key={index} className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
              <Shield className="mb-2 text-amber-400" size={20} />
              <h3 className="text-xl font-medium text-indigo-400">{path.name}</h3>
              <p className="text-[#94a3b8]">{path.description}</p>
              <button
                className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
                onClick={() => setSelectedPath(path.name.toLowerCase())}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Tax Impact Comparison</h2>
        <p className="text-[#7a95b8] mb-6">Compare tax impacts for each succession path using this bar chart.</p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={taxImpactData}>
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="TaxImpact" fill="#4F46E5">
              {taxImpactData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <AlertTriangle className="mt-4 text-amber-400" size={24} />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Installment Sale vs Lump Sum Analysis</h2>
        <p className="text-[#7a95b8] mb-6">Analyze the benefits of installment sales for deferred tax payments versus lump sum for immediate liquidity.</p>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <p className="text-[#94a3b8]">Installment Sale: Spreads tax liability over time, reducing annual tax burden. Example: $1M sale over 5 years at 20% tax = $40K/year.</p>
          <p className="text-[#94a3b8] mt-4">Lump Sum: Immediate capital but higher upfront taxes. Example: $1M sale at 20% tax = $200K immediate tax.</p>
          <ArrowRight className="mt-4 text-indigo-400" size={24} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">IRC Section 1202 QSBS Exclusion Integration</h2>
        <p className="text-[#7a95b8] mb-6">Qualified Small Business Stock (QSBS) under IRC Section 1202 can exclude up to 100% of gains from taxation for eligible sales.</p>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <p className="text-[#94a3b8]">Eligibility: Stock held for over 5 years in a C corp with assets under $50M. Potential exclusion: Up to $10M or 10x investment.</p>
          <p className="text-[#94a3b8] mt-4">Integration Tip: Structure your business as a C corp early to leverage this for third-party sales.</p>
          <CheckCircle2 className="mt-4 text-amber-400" size={24} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Key Man Discount</h2>
        <p className="text-[#7a95b8] mb-6">Apply a discount for the value of key personnel, like physicians, in valuation to reflect dependency risks.</p>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <p className="text-[#94a3b8]">Example: A practice valued at $2M might see a 10-20% discount if the owner is irreplaceable, reducing value to $1.6M-$1.8M.</p>
          <p className="text-[#94a3b8] mt-4">Mitigation: Cross-train staff and document processes to minimize this discount.</p>
          <Scale className="mt-4 text-indigo-400" size={24} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Ownership Transition Over Time</h2>
        <p className="text-[#7a95b8] mb-6">Visualize ownership shift with this pie chart based on your selected timeline.</p>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={ownershipTransitionData.slice(0, timelineYears)}
              dataKey="Owner"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#4F46E5"
              label
            >
              {ownershipTransitionData.slice(0, timelineYears).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <Target className="mt-4 text-amber-400" size={24} />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-300">IRS Compliance</h2>
        <p className="text-[#7a95b8] mb-6">Ensure compliance with key IRC sections for smooth transactions.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
            <Award className="mb-2 text-amber-400" size={20} />
            <h3 className="text-xl font-medium text-indigo-400">IRC Section 453</h3>
            <p className="text-[#94a3b8]">Installment sales allow deferral of gain recognition.</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
            <Users className="mb-2 text-amber-400" size={20} />
            <h3 className="text-xl font-medium text-indigo-400">IRC Section 338(h)(10)</h3>
            <p className="text-[#94a3b8]">Election for stock sales treated as asset sales for tax purposes.</p>
          </div>
          <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
            <Scale className="mb-2 text-amber-400" size={20} />
            <h3 className="text-xl font-medium text-indigo-400">IRC Section 1060</h3>
            <p className="text-[#94a3b8]">Requires allocation of purchase price to assets for proper taxation.</p>
          </div>
        </div>
      </section>

      <footer className="text-center text-gray-500 mt-12">
        <p>Prepared for physician practice owners and business owners. Consult a tax professional for personalized advice.</p>
      </footer>
      <PageInsights section="business-succession" />
    </div>
  );
}
