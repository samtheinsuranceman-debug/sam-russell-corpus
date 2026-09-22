// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Shield, DollarSign, TrendingUp, Lock, CheckCircle2, AlertTriangle, ArrowRight, Target, Users, Scale, Building2, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function AssetProtection() {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedState, setSelectedState] = useState('California');

  const protectionScores = useMemo(() => [
    { category: 'Exempt Assets', score: 8, fullScore: 10 },
    { category: 'Domestic Trusts', score: 7, fullScore: 10 },
    { category: 'Offshore Trusts', score: 9, fullScore: 10 },
    { category: 'Entity Structuring', score: 8, fullScore: 10 },
    { category: 'Insurance Protection', score: 6, fullScore: 10 },
    { category: 'Retirement Assets', score: 7, fullScore: 10 },
  ], []);

  const homesteadData = useMemo(() => [
    { state: 'Texas', exemption: 500000, type: 'Unlimited' },
    { state: 'Florida', exemption: 1000000, type: 'Unlimited' },
    { state: 'California', exemption: 600000, type: 'Limited' },
    { state: 'New York', exemption: 170000, type: 'Limited' },
    { state: 'Illinois', exemption: 15000, type: 'Limited' },
  ], []);

  const daptStates = useMemo(() => [
    'Alaska', 'Delaware', 'Nevada', 'South Dakota', 'Ohio', 'Wyoming', 'Missouri', 'New Hampshire', 'Virginia', 'Tennessee', 'Utah', 'Oklahoma', 'Mississippi', 'Rhode Island', 'Nevada', 'Hawaii', 'Florida', 'Michigan', 'North Carolina'
  ], []);

  const iulAnnuityData = useMemo(() => [
    { state: 'California', protection: 'Full', level: 100 },
    { state: 'New York', protection: 'Partial', level: 50 },
    { state: 'Florida', protection: 'Full', level: 100 },
    { state: 'Texas', protection: 'Full', level: 100 },
  ], []);

  const COLORS = ['#00b4d8', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c'];

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
      fontFamily: 'Arial, sans-serif',
      padding: '40px',
      minHeight: '100vh',
    }}>
      <h1 style={{ color: '#00b4d8', textAlign: 'center', marginBottom: '40px' }}>
        <Shield size={32} /> Comprehensive Asset Protection Strategies
      </h1>
      <p style={{ color: '#b0b0b0', textAlign: 'center' }}>
        This page outlines key strategies for physicians and high-net-worth individuals to safeguard wealth from lawsuits, creditors, and malpractice claims.
      </p>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Lock size={24} /> Asset Protection Hierarchy</h2>
        <p>
          Asset protection involves a layered approach to shield wealth. Start with exempt assets, which are protected by law, then move to domestic trusts, offshore trusts, and finally entity structuring for maximum defense.
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><ArrowRight size={16} /> Exempt Assets: These include retirement accounts, homesteads, and life insurance, which are often untouchable by creditors.</li>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><ArrowRight size={16} /> Domestic Trusts: Such as revocable or irrevocable trusts that keep assets out of reach while maintaining some control.</li>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><ArrowRight size={16} /> Offshore Trusts: Located in jurisdictions like the Cook Islands, offering enhanced privacy and protection from U.S. creditors.</li>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><ArrowRight size={16} /> Entity Structuring: Using LLCs, FLPs, or corporations to separate personal and business assets, reducing liability exposure.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Building2 size={24} /> State-by-State Homestead Exemption Comparison</h2>
        <p>
          Homestead exemptions vary by state, protecting your primary residence from creditors. Below is a comparison using sample data; always consult local laws.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={homesteadData}>
            <XAxis dataKey="state" stroke="#e0e0e0" />
            <YAxis stroke="#e0e0e0" />
            <Tooltip />
            <Legend />
            <Bar dataKey="exemption" fill="#00b4d8" />
          </BarChart>
        </ResponsiveContainer>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><Scale size={16} /> Texas: Unlimited exemption for rural homesteads.</li>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><Scale size={16} /> Florida: Up to $1,000,000 for single individuals.</li>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><Scale size={16} /> California: $600,000 limit, but can vary by county.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><DollarSign size={24} /> IUL and Annuity Creditor Protection</h2>
        <p>
          Indexed Universal Life (IUL) policies and annuities offer state-specific protection. For example, in Florida, these assets are fully exempt, while in New York, they may be partially protected.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={iulAnnuityData} dataKey="level" nameKey="state" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {iulAnnuityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <p>
          Key states: California provides full protection under statute 704.100, but UVTA rules apply to fraudulent transfers. Always ensure compliance to avoid penalties.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Layers size={24} /> DAPT Analysis for 19 DAPT States</h2>
        <p>
          Domestic Asset Protection Trusts (DAPT) are available in 19 states, allowing settlors to be beneficiaries while protecting assets. States include:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, columns: 2 }}>
          {daptStates.map((state, index) => (
            <li key={index} style={{marginBottom: '5px', color: '#00b4d8', marginRight: '10px'}}><CheckCircle2 size={16} /> {state}</li>
          ))}
        </ul>
        <p>
          In these states, DAPTs offer strong protection, but be aware of the Uniform Voidable Transactions Act (UVTA) which can challenge transfers if deemed fraudulent.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Users size={24} /> LLC/FLP Layering Strategy</h2>
        <p>
          Layering with Limited Liability Companies (LLC) and Family Limited Partnerships (FLP) creates barriers against creditors. For physicians, this can protect personal assets from business liabilities.
        </p>
        <ol style={{ listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><ArrowRight size={16} /> Step 1: Form an LLC for high-risk assets.</li>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><ArrowRight size={16} /> Step 2: Use FLP for family wealth transfer, reducing estate taxes.</li>
          <li style={{marginBottom: '10px', color: '#00b4d8', marginRight: '10px'}}><ArrowRight size={16} /> Step 3: Layer with trusts for added protection.</li>
        </ol>
        <p>
          This strategy must comply with ERISA for retirement plans and state exemption statutes to avoid disputes.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Target size={24} /> Malpractice Umbrella Integration</h2>
        <p>
          Integrate malpractice insurance with asset protection strategies. Umbrella policies provide additional coverage beyond standard malpractice limits, protecting against large claims.
        </p>
        <p>
          For high-net-worth individuals, combine this with entity structuring to limit personal exposure. Always review policy details for state-specific creditor protections.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><TrendingUp size={24} /> Protection Scores Across Categories</h2>
        <p>
          Visualize protection effectiveness with a RadarChart. Scores are based on a scale of 1-10, considering factors like accessibility and legal strength.
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius={150} data={protectionScores}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis dataKey="category" stroke="#e0e0e0" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#e0e0e0" />
            <Radar name="Protection Score" dataKey="score" stroke="#00b4d8" fill="#00b4d8" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2 style={{ color: '#00b4d8' }}><AlertTriangle size={24} /> Legal Compliance Overview</h2>
        <p>
          Ensure all strategies comply with state exemption statutes, UVTA fraudulent transfer rules, and ERISA protections. For example:
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#ffc658', marginRight: '10px'}}><AlertTriangle size={16} /> State Exemption Statutes: Vary by state; e.g., ERISA protects qualified retirement plans federally.</li>
          <li style={{marginBottom: '10px', color: '#ffc658', marginRight: '10px'}}><AlertTriangle size={16} /> UVTA Rules: Prevent transfers made with intent to hinder creditors, with look-back periods up to 4 years.</li>
          <li style={{marginBottom: '10px', color: '#ffc658', marginRight: '10px'}}><AlertTriangle size={16} /> ERISA Protection: Shields pension plans from creditors, but not all assets qualify.</li>
        </ul>
        <p>
          Consult a legal professional to tailor these strategies to your situation and avoid potential pitfalls.
        </p>
      </section>
      <PageInsights section="asset-protection" />
    </div>
  );
}
