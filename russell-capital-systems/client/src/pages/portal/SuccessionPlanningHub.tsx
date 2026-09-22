// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { GitBranch, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Users, Building2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const SuccessionPlanningHub = () => {
  const [selectedPath, setSelectedPath] = useState('family-transfer');
  const [valuationMethod, setValuationMethod] = useState('DCF');

  const successionPaths = [
    { id: 'family-transfer', name: 'Family Transfer', description: 'Transferring ownership to family members for continuity.', icon: <GitBranch className="w-6 h-6 text-indigo-400" /> },
    { id: 'management-buyout', name: 'Management Buyout', description: 'Current management purchases the business.', icon: <Users className="w-6 h-6 text-indigo-400" /> },
    { id: 'ESOP', name: 'Employee Stock Ownership Plan (ESOP)', description: 'Employees acquire stock in the company.', icon: <Shield className="w-6 h-6 text-indigo-400" /> },
    { id: 'third-party-sale', name: 'Third-Party Sale', description: 'Selling to an external buyer for liquidity.', icon: <ArrowRight className="w-6 h-6 text-indigo-400" /> },
    { id: 'IPO', name: 'Initial Public Offering (IPO)', description: 'Going public to raise capital and transfer ownership.', icon: <TrendingUp className="w-6 h-6 text-indigo-400" /> },
  ];

  const valuationMethods = [
    { id: 'DCF', name: 'Discounted Cash Flow (DCF)', description: 'Values based on future cash flows discounted to present value.', icon: <DollarSign className="w-6 h-6 text-rose-400" /> },
    { id: 'comparable', name: 'Comparable Company Analysis', description: 'Compares to similar companies in the market.', icon: <Building2 className="w-6 h-6 text-rose-400" /> },
    { id: 'asset-based', name: 'Asset-Based Valuation', description: 'Assesses the value of assets minus liabilities.', icon: <Percent className="w-6 h-6 text-rose-400" /> },
    { id: 'EBITDA-multiple', name: 'EBITDA Multiple', description: 'Uses multiples of earnings before interest, taxes, depreciation, and amortization.', icon: <Target className="w-6 h-6 text-rose-400" /> },
  ];

  const complianceTopics = [
    { id: 'IRC453', name: 'IRC 453 Installment Sale', description: 'Allows for tax deferral on sales paid over time.', icon: <CheckCircle2 className="w-6 h-6 text-indigo-400" /> },
    { id: 'section1042', name: 'Section 1042 ESOP Rollover', description: 'Enables tax-free rollover of proceeds into qualified securities.', icon: <Shield className="w-6 h-6 text-indigo-400" /> },
    { id: 'section2701', name: 'Section 2701 Special Valuation', description: 'Rules for valuing family-controlled entities.', icon: <AlertTriangle className="w-6 h-6 text-rose-400" /> },
    { id: 'section6166', name: 'Section 6166 Estate Tax Deferral', description: 'Defers estate taxes for closely held businesses.', icon: <Calendar className="w-6 h-6 text-indigo-400" /> },
    { id: 'RevRul59-60', name: 'Rev. Rul. 59-60 Valuation', description: 'Guidelines for valuing closely held businesses.', icon: <Target className="w-6 h-6 text-rose-400" /> },
  ];

  const transitionTimelineData = useMemo(() => [
    { year: 0, value: 0 },
    { year: 2, value: 10 },
    { year: 4, value: 25 },
    { year: 6, value: 40 },
    { year: 8, value: 55 },
    { year: 10, value: 70 },
    { year: 12, value: 80 },
    { year: 14, value: 90 },
    { year: 16, value: 95 },
    { year: 18, value: 98 },
    { year: 20, value: 100 },
  ], []);

  const keyPersonRiskData = useMemo(() => [
    { category: 'Financial Impact', riskLevel: 80 },
    { category: 'Operational Disruption', riskLevel: 70 },
    { category: 'Reputation Damage', riskLevel: 60 },
    { category: 'Legal Compliance', riskLevel: 50 },
  ], []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 p-8 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-indigo-300">Succession Planning Hub</h1>
        <p className="text-lg text-rose-200 mt-2">Comprehensive strategies for business continuity and growth.</p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 mb-4">Succession Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {successionPaths.map((path) => (
            <div
              key={path.id}
              className={`p-6 rounded-lg border border-indigo-700 cursor-pointer ${selectedPath === path.id ? 'bg-indigo-800' : 'bg-[#0d1526]'}`}
              onClick={() => setSelectedPath(path.id)}
            >
              {path.icon}
              <h3 className="text-xl font-medium text-rose-300 mt-2">{path.name}</h3>
              <p className="text-[#94a3b8] mt-2">{path.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 mb-4">Business Valuation Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {valuationMethods.map((method) => (
            <div
              key={method.id}
              className={`p-6 rounded-lg border border-rose-700 cursor-pointer ${valuationMethod === method.id ? 'bg-rose-800' : 'bg-[#0d1526]'}`}
              onClick={() => setValuationMethod(method.id)}
            >
              {method.icon}
              <h3 className="text-xl font-medium text-indigo-300 mt-2">{method.name}</h3>
              <p className="text-[#94a3b8] mt-2">{method.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-rose-400 mb-4">Special Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg bg-[#0d1526] border border-indigo-700">
            <DollarSign className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-medium text-indigo-300 mt-2">Installment Sale to IDGT</h3>
            <p className="text-[#94a3b8] mt-2">Utilize an Intentionally Defective Grantor Trust (IDGT) for tax-free transfer via installment sales, minimizing estate taxes and ensuring seamless wealth transfer.</p>
          </div>
          <div className="p-6 rounded-lg bg-[#0d1526] border border-rose-700">
            <Shield className="w-6 h-6 text-rose-400" />
            <h3 className="text-xl font-medium text-rose-300 mt-2">ESOP Leveraged Buyout Structure</h3>
            <p className="text-[#94a3b8] mt-2">Structure a leveraged buyout where the ESOP borrows funds to acquire company stock, with tax advantages and employee incentives for long-term stability.</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 mb-4">20-Year Transition Timeline</h2>
        <p className="text-[#94a3b8] mb-4">Visual representation of a gradual business transition over 20 years.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={transitionTimelineData}>
            <XAxis dataKey="year" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-rose-400 mb-4">Key Person Risk Assessment</h2>
        <p className="text-[#94a3b8] mb-4">Evaluate risks associated with key individuals in the business.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={keyPersonRiskData}>
            <XAxis dataKey="category" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip />
            <Legend />
            <Bar dataKey="riskLevel" fill="#F43F5E" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-indigo-400 mb-4">Compliance and Tax Considerations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complianceTopics.map((topic) => (
            <div key={topic.id} className="p-6 rounded-lg bg-[#0d1526] border border-rose-700">
              {topic.icon}
              <h3 className="text-xl font-medium text-indigo-300 mt-2">{topic.name}</h3>
              <p className="text-[#94a3b8] mt-2">{topic.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-rose-400 mb-4">Integrated Succession Overview</h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={transitionTimelineData}>
            <XAxis dataKey="year" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
            <Line type="monotone" dataKey="value" stroke="#F43F5E" />
            <Bar dataKey="value" fill="#818CF8" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <footer className="text-center text-[#7a95b8]">
        <p>Developed for comprehensive succession planning. Use dark theme with indigo and rose accents for optimal visualization.</p>
        <p>Icons from Lucide React and charts from Recharts enhance the user experience.</p>
      </footer>
      <PageInsights section="succession-planning-hub" />
    </div>
  );
};

export default SuccessionPlanningHub;
