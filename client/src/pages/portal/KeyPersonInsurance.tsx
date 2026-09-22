// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Users, DollarSign, TrendingDown, Shield, CheckCircle2, AlertTriangle, ArrowRight, Target, Scale, Building2, Award, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function KeyPersonInsurance() {
  const [compensation, setCompensation] = useState(0);
  const [revenueContribution, setRevenueContribution] = useState(0);
  const [replacementCost, setReplacementCost] = useState(0);
  const [revenueLoss, setRevenueLoss] = useState(0);
  const [clientAttrition, setClientAttrition] = useState(0);
  const [recruitmentCosts, setRecruitmentCosts] = useState(0);
  const [coverageAmount, setCoverageAmount] = useState(0);
  const [policyType, setPolicyType] = useState('term'); // 'term' or 'permanent'

  const valuation = useMemo(() => {
    const multipleOfCompensation = compensation * 5; // Example: 5x multiplier
    const contributionToRevenue = revenueContribution * 0.1; // Example: 10% of revenue
    const totalValuation = multipleOfCompensation + contributionToRevenue + replacementCost;
    return { multipleOfCompensation, contributionToRevenue, totalValuation };
  }, [compensation, revenueContribution, replacementCost]);

  const businessImpact = useMemo(() => {
    const totalImpact = revenueLoss + (clientAttrition * 10000) + recruitmentCosts; // Simplified calculation
    return totalImpact;
  }, [revenueLoss, clientAttrition, recruitmentCosts]);

  const coverageCalculator = useMemo(() => {
    return valuation.totalValuation + businessImpact; // Basic calculator
  }, [valuation, businessImpact]);

  const riskData = useMemo(() => [
    { name: 'Financial Risk', value: 40 },
    { name: 'Operational Risk', value: 30 },
    { name: 'Reputational Risk', value: 30 },
  ], []);

  const COLORS = ['#FF0000', '#0000FF', '#8884d8']; // Red and blue accents

  return (
    <div className="dark-theme bg-[#0a0f1a] min-h-screen text-white p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold flex items-center">
          <Users className="mr-2" size={32} color="#FF0000" /> Key Person Insurance Analysis
        </h1>
        <p className="text-[#94a3b8] mt-2">Protect your business from the financial impact of losing key employees.</p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold flex items-center mb-4">
          <DollarSign className="mr-2" size={24} color="#0000FF" /> Key Person Valuation
        </h2>
        <p className="text-[#94a3b8] mb-4">Assess the value of key personnel based on multiple factors.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[#7a95b8]">Annual Compensation:</label>
            <input
              type="number"
              value={compensation}
              onChange={(e) => setCompensation(Number(e.target.value))}
              className="w-full p-2 bg-[#0d1526] border border-[#1e3a5f] rounded"
            />
          </div>
          <div>
            <label className="block text-[#7a95b8]">Revenue Contribution (%):</label>
            <input
              type="number"
              value={revenueContribution}
              onChange={(e) => setRevenueContribution(Number(e.target.value))}
              className="w-full p-2 bg-[#0d1526] border border-[#1e3a5f] rounded"
            />
          </div>
          <div>
            <label className="block text-[#7a95b8]">Replacement Cost:</label>
            <input
              type="number"
              value={replacementCost}
              onChange={(e) => setReplacementCost(Number(e.target.value))}
              className="w-full p-2 bg-[#0d1526] border border-[#1e3a5f] rounded"
            />
          </div>
        </div>
        <div className="bg-[#0d1526] p-4 rounded shadow">
          <p><strong>Multiple of Compensation:</strong> ${valuation.multipleOfCompensation.toFixed(2)}</p>
          <p><strong>Contribution to Revenue:</strong> ${valuation.contributionToRevenue.toFixed(2)}</p>
          <p><strong>Total Valuation:</strong> ${valuation.totalValuation.toFixed(2)}</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold flex items-center mb-4">
          <TrendingDown className="mr-2" size={24} color="#FF0000" /> Business Impact Analysis
        </h2>
        <p className="text-[#94a3b8] mb-4">Evaluate potential losses from losing a key person.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[#7a95b8]">Estimated Revenue Loss:</label>
            <input
              type="number"
              value={revenueLoss}
              onChange={(e) => setRevenueLoss(Number(e.target.value))}
              className="w-full p-2 bg-[#0d1526] border border-[#1e3a5f] rounded"
            />
          </div>
          <div>
            <label className="block text-[#7a95b8]">Client Attrition Rate (%):</label>
            <input
              type="number"
              value={clientAttrition}
              onChange={(e) => setClientAttrition(Number(e.target.value))}
              className="w-full p-2 bg-[#0d1526] border border-[#1e3a5f] rounded"
            />
          </div>
          <div>
            <label className="block text-[#7a95b8]">Recruitment Costs:</label>
            <input
              type="number"
              value={recruitmentCosts}
              onChange={(e) => setRecruitmentCosts(Number(e.target.value))}
              className="w-full p-2 bg-[#0d1526] border border-[#1e3a5f] rounded"
            />
          </div>
        </div>
        <div className="bg-[#0d1526] p-4 rounded shadow">
          <p><strong>Total Business Impact:</strong> ${businessImpact.toFixed(2)}</p>
        </div>
        <ResponsiveContainer width="100%" height={300} className="mt-4">
          <BarChart data={[{name: 'Impact', value: businessImpact}]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#0000FF" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold flex items-center mb-4">
          <Shield className="mr-2" size={24} color="#0000FF" /> Coverage Amount Calculator
        </h2>
        <p className="text-[#94a3b8] mb-4">Calculate the recommended coverage based on valuation and impact.</p>
        <div className="bg-[#0d1526] p-4 rounded shadow">
          <p><strong>Recommended Coverage Amount:</strong> ${coverageCalculator.toFixed(2)}</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold flex items-center mb-4">
          <CheckCircle2 className="mr-2" size={24} color="#FF0000" /> Term vs Permanent Comparison
        </h2>
        <p className="text-[#94a3b8] mb-4">Compare term and permanent life insurance options.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d1526] p-4 rounded">
            <h3 className="font-semibold">Term Insurance</h3>
            <p>Lower premiums, temporary coverage.</p>
          </div>
          <div className="bg-[#0d1526] p-4 rounded">
            <h3 className="font-semibold">Permanent Insurance</h3>
            <p>Lifelong coverage, cash value buildup.</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300} className="mt-4">
          <AreaChart data={[{name: 'Year 1', term: 1000, permanent: 2000}, {name: 'Year 5', term: 5000, permanent: 10000}]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="term" stroke="#FF0000" fill="#FF0000" />
            <Area type="monotone" dataKey="permanent" stroke="#0000FF" fill="#0000FF" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold flex items-center mb-4">
          <ArrowRight className="mr-2" size={24} color="#0000FF" /> Buy-Sell Agreement Integration
        </h2>
        <p className="text-[#94a3b8] mb-4">Integrate with buy-sell agreements for business continuity.</p>
        <div className="bg-[#0d1526] p-4 rounded">
          <p>Ensure funding for buyouts in case of key person loss.</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold flex items-center mb-4">
          <Target className="mr-2" size={24} color="#FF0000" /> Business Continuation Planning
        </h2>
        <p className="text-[#94a3b8] mb-4">Steps for maintaining operations post-loss.</p>
        <ul className="list-disc pl-5 text-[#94a3b8]">
          <li>Identify successors</li>
          <li>Train backups</li>
          <li>Secure financing</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold flex items-center mb-4">
          <Scale className="mr-2" size={24} color="#0000FF" /> PieChart Showing Risk Allocation
        </h2>
        <p className="text-[#94a3b8] mb-4">Visualize risk distribution.</p>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={riskData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {riskData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold flex items-center mb-4">
          <AlertTriangle className="mr-2" size={24} color="#FF0000" /> IRS Compliance
        </h2>
        <p className="text-[#94a3b8] mb-4">Adhere to IRC Section 101(j) for employer-owned life insurance.</p>
        <div className="bg-[#0d1526] p-4 rounded">
          <p><strong>Notice and Consent Requirements:</strong> Obtain written consent from the insured employee.</p>
          <p>Key elements include: Notice of policy, Consent to be insured, and Compliance with tax rules.</p>
        </div>
      </section>

      <footer className="text-center text-gray-500">
        <p>Powered by advanced analytics for business protection. <Building2 size={16} /> <Award size={16} /> <Zap size={16} /></p>
      </footer>
      <PageInsights section="key-person-insurance" />
    </div>
  );
}
