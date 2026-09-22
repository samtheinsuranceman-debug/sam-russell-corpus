// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Award, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, ArrowRight, Target, Users, Scale, Zap, BarChart3 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const sampleScores = {
  estateTaxEfficiency: { current: 75, optimized: 90, impact: 500000 },
  incomeTaxPlanning: { current: 65, optimized: 85, impact: 300000 },
  generationSkipping: { current: 80, optimized: 95, impact: 400000 },
  assetProtection: { current: 70, optimized: 88, impact: 250000 },
  liquidity: { current: 60, optimized: 82, impact: 150000 },
  charitableGiving: { current: 55, optimized: 75, impact: 100000 },
  businessSuccession: { current: 72, optimized: 89, impact: 350000 },
  familyGovernance: { current: 68, optimized: 86, impact: 200000 },
};

const dimensions = [
  { name: 'Estate Tax Efficiency', icon: <DollarSign className="text-emerald-400" size={24} /> },
  { name: 'Income Tax Planning', icon: <TrendingUp className="text-emerald-400" size={24} /> },
  { name: 'Generation-Skipping', icon: <Target className="text-emerald-400" size={24} /> },
  { name: 'Asset Protection', icon: <Shield className="text-emerald-400" size={24} /> },
  { name: 'Liquidity', icon: <Zap className="text-emerald-400" size={24} /> },
  { name: 'Charitable Giving', icon: <CheckCircle2 className="text-emerald-400" size={24} /> },
  { name: 'Business Succession', icon: <Users className="text-emerald-400" size={24} /> },
  { name: 'Family Governance', icon: <Scale className="text-emerald-400" size={24} /> },
];

const actionItems = [
  { description: 'Optimize estate tax strategies', roi: 4.5, impact: 500000, priority: 1 },
  { description: 'Enhance income tax planning', roi: 3.8, impact: 300000, priority: 2 },
  { description: 'Implement generation-skipping trusts', roi: 4.2, impact: 400000, priority: 3 },
  { description: 'Strengthen asset protection measures', roi: 3.5, impact: 250000, priority: 4 },
  { description: 'Improve liquidity planning', roi: 2.9, impact: 150000, priority: 5 },
];

const wealthProjection = [
  { generation: 'Current', wealth: 10000000 },
  { generation: 'Next', wealth: 8000000 },
  { generation: 'Subsequent', wealth: 6000000 },
];

const WealthTransferScorecard = () => {
  const calculateOverallGrade = useMemo(() => {
    const averageCurrent = Object.values(sampleScores).reduce((sum, score) => sum + score.current, 0) / Object.values(sampleScores).length;
    const gradeScale = [
      { min: 90, grade: 'A' },
      { min: 80, grade: 'B' },
      { min: 70, grade: 'C' },
      { min: 60, grade: 'D' },
      { min: 0, grade: 'F' },
    ];
    for (const scale of gradeScale) {
      if (averageCurrent >= scale.min) return scale.grade;
    }
    return 'F';
  }, []);

  const radarData = useMemo(() => [
    { subject: 'Estate Tax', current: sampleScores.estateTaxEfficiency.current, optimized: sampleScores.estateTaxEfficiency.optimized },
    { subject: 'Income Tax', current: sampleScores.incomeTaxPlanning.current, optimized: sampleScores.incomeTaxPlanning.optimized },
    { subject: 'Gen-Skipping', current: sampleScores.generationSkipping.current, optimized: sampleScores.generationSkipping.optimized },
    { subject: 'Asset Protection', current: sampleScores.assetProtection.current, optimized: sampleScores.assetProtection.optimized },
    { subject: 'Liquidity', current: sampleScores.liquidity.current, optimized: sampleScores.liquidity.optimized },
    { subject: 'Charitable Giving', current: sampleScores.charitableGiving.current, optimized: sampleScores.charitableGiving.optimized },
    { subject: 'Business Succession', current: sampleScores.businessSuccession.current, optimized: sampleScores.businessSuccession.optimized },
    { subject: 'Family Governance', current: sampleScores.familyGovernance.current, optimized: sampleScores.familyGovernance.optimized },
  ], []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 p-8 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-emerald-400">Wealth Transfer Efficiency Scorecard</h1>
        <p className="text-xl mt-4 text-gold-300">Comprehensive analysis of your estate plan</p>
        <div className="mt-6">
          <Award className="inline mx-auto text-gold-400" size={48} />
          <h2 className="text-3xl mt-4">Overall Grade: {calculateOverallGrade}</h2>
          <p className="text-md mt-2">Based on averaged scores across all dimensions (A-F scale)</p>
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Current vs Optimized Comparison</h2>
        <p className="mb-4">This radar chart visualizes your current scores versus potential optimized scores across key dimensions.</p>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#4B5563" />
            <PolarAngleAxis dataKey="subject" stroke="#EAB308" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#10B981" />
            <Radar name="Current" dataKey="current" stroke="#EAB308" fill="#EAB308" fillOpacity={0.6} />
            <Radar name="Optimized" dataKey="optimized" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Scoring Dimensions and Dollar Impacts</h2>
        <p className="mb-4">Each dimension is graded on a 0-100 scale. See the potential dollar impact of optimizations.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dimensions.map((dim, index) => (
            <div key={index} className="bg-[#0d1526] p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
              {dim.icon}
              <h3 className="text-xl font-medium mt-2">{dim.name}</h3>
              <p className="mt-2">Current Score: {sampleScores[dim.name.toLowerCase().replace(/ /g, '')].current}/100</p>
              <p className="mt-1">Optimized Score: {sampleScores[dim.name.toLowerCase().replace(/ /g, '')].optimized}/100</p>
              <p className="mt-1 flex items-center text-gold-400"><DollarSign size={18} className="mr-2" />Dollar Impact: ${sampleScores[dim.name.toLowerCase().replace(/ /g, '')].impact.toLocaleString()}</p>
              <button className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded flex items-center justify-center">
                View Details <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Priority Action Items (Ranked by ROI)</h2>
        <p className="mb-4">Actionable steps to optimize your wealth transfer, prioritized by return on investment.</p>
        <ul className="space-y-4">
          {actionItems.sort((a, b) => b.roi - a.roi).map((item, index) => (
            <li key={index} className="bg-[#0d1526] p-4 rounded-lg flex items-center shadow-md border border-[#1e3a5f]">
              <AlertTriangle className="text-gold-400 mr-4" size={24} />
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm">ROI: {item.roi.toFixed(1)}x | Impact: ${item.impact.toLocaleString()} | Priority: {item.priority}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">3-Generation Wealth Projection</h2>
        <p className="mb-4">Projected wealth transfer across generations based on current and optimized plans.</p>
        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={wealthProjection}>
            <XAxis dataKey="generation" stroke="#EAB308" />
            <YAxis stroke="#10B981" />
            <Tooltip />
            <Legend />
            <Bar dataKey="wealth" fill="#EAB308" name="Wealth Projection" />
          </ReBarChart>
        </ResponsiveContainer>
        <p className="mt-4 text-sm">This bar chart assumes a 20% annual growth rate with optimizations applied.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Scoring Methodology Explanation</h2>
        <p className="mb-2">Our scorecard evaluates your estate plan across eight key dimensions using a proprietary algorithm. Each dimension is scored on a 0-100 scale based on factors such as:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Estate Tax Efficiency:</strong> Assesses minimization of estate taxes through trusts, gifting, and exemptions. Score derived from tax exposure analysis.</li>
          <li><strong>Income Tax Planning:</strong> Evaluates strategies for basis step-up, Roth conversions, and income deferral. Impact calculated from projected tax savings.</li>
          <li><strong>Generation-Skipping:</strong> Measures effectiveness of GST trusts to bypass intermediate generations. Score based on trust structures and exemptions.</li>
          <li><strong>Asset Protection:</strong> Analyzes safeguards against creditors, lawsuits, and divorce. Factors include LLCs, trusts, and insurance coverage.</li>
          <li><strong>Liquidity:</strong> Reviews availability of cash for taxes, debts, and transfers. Score considers liquid assets and life insurance.</li>
          <li><strong>Charitable Giving:</strong> Assesses charitable deductions, donor-advised funds, and philanthropy impact. Optimized for tax benefits and legacy.</li>
          <li><strong>Business Succession:</strong> Evaluates plans for business transfer, including buy-sell agreements and valuation. Score based on continuity risks.</li>
          <li><strong>Family Governance:</strong> Examines family meetings, education, and dispute resolution mechanisms. Focuses on long-term harmony and communication.</li>
        </ul>
        <p className="mt-4">The overall grade is the average of all dimension scores. Dollar impacts are estimated based on historical data and current tax laws. For personalized advice, consult a professional.</p>
        <BarChart3 className="mt-4 inline text-gold-400" size={32} />
      </section>

      <footer className="mt-12 text-center text-gray-500">
        <p>© 2023 Wealth Transfer Advisors. All rights reserved.</p>
      </footer>
      <PageInsights section="wealth-transfer-scorecard" />
    </div>
  );
};

export default WealthTransferScorecard;
