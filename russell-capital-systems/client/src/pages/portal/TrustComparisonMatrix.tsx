// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Grid3X3, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Lock, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const trustData = [
  {
    name: 'Revocable',
    goals: ['asset protection', 'family'],
    scores: {
      setupCost: 4,
      annualCost: 3,
      taxBenefit: 6,
      assetProtection: 7,
      flexibility: 8,
      complexity: 2,
      control: 9,
      reversibility: 10,
    },
    compliance: 'Revocable trusts can be altered or revoked by the grantor. Reference: IRS Publication 559.',
  },
  {
    name: 'Irrevocable',
    goals: ['asset protection', 'tax savings'],
    scores: {
      setupCost: 6,
      annualCost: 5,
      taxBenefit: 9,
      assetProtection: 10,
      flexibility: 3,
      complexity: 7,
      control: 4,
      reversibility: 1,
    },
    compliance: 'Irrevocable trusts cannot be changed once established. Reference: Uniform Trust Code Section 602.',
  },
  {
    name: 'SLAT',
    goals: ['tax savings', 'family'],
    scores: {
      setupCost: 5,
      annualCost: 4,
      taxBenefit: 8,
      assetProtection: 6,
      flexibility: 7,
      complexity: 6,
      control: 5,
      reversibility: 2,
    },
    compliance: 'Spousal Lifetime Access Trust for estate tax benefits. Reference: IRC Section 2523.',
  },
  {
    name: 'IDGT',
    goals: ['tax savings', 'asset protection'],
    scores: {
      setupCost: 7,
      annualCost: 6,
      taxBenefit: 9,
      assetProtection: 8,
      flexibility: 5,
      complexity: 8,
      control: 6,
      reversibility: 3,
    },
    compliance: 'Intentionally Defective Grantor Trust for tax advantages. Reference: IRS Revenue Ruling 85-13.',
  },
  {
    name: 'ILIT',
    goals: ['tax savings', 'family'],
    scores: {
      setupCost: 5,
      annualCost: 4,
      taxBenefit: 7,
      assetProtection: 6,
      flexibility: 4,
      complexity: 5,
      control: 5,
      reversibility: 1,
    },
    compliance: 'Irrevocable Life Insurance Trust to exclude life insurance from estate. Reference: IRC Section 2042.',
  },
  {
    name: 'GRAT',
    goals: ['tax savings'],
    scores: {
      setupCost: 6,
      annualCost: 5,
      taxBenefit: 10,
      assetProtection: 7,
      flexibility: 6,
      complexity: 7,
      control: 4,
      reversibility: 2,
    },
    compliance: 'Grantor Retained Annuity Trust for transferring appreciating assets. Reference: IRC Section 2702.',
  },
  {
    name: 'QPRT',
    goals: ['tax savings', 'family'],
    scores: {
      setupCost: 7,
      annualCost: 6,
      taxBenefit: 9,
      assetProtection: 8,
      flexibility: 5,
      complexity: 8,
      control: 3,
      reversibility: 1,
    },
    compliance: 'Qualified Personal Residence Trust for real estate. Reference: IRC Section 2702.',
  },
  {
    name: 'CRT',
    goals: ['tax savings', 'charitable'],
    scores: {
      setupCost: 5,
      annualCost: 4,
      taxBenefit: 8,
      assetProtection: 6,
      flexibility: 4,
      complexity: 6,
      control: 5,
      reversibility: 2,
    },
    compliance: 'Charitable Remainder Trust for charitable deductions. Reference: IRC Section 664.',
  },
  {
    name: 'CLT',
    goals: ['charitable', 'income'],
    scores: {
      setupCost: 6,
      annualCost: 5,
      taxBenefit: 7,
      assetProtection: 5,
      flexibility: 6,
      complexity: 7,
      control: 4,
      reversibility: 1,
    },
    compliance: 'Charitable Lead Trust for immediate charitable gifts. Reference: IRC Section 170.',
  },
  {
    name: 'Dynasty',
    goals: ['family', 'asset protection'],
    scores: {
      setupCost: 8,
      annualCost: 7,
      taxBenefit: 9,
      assetProtection: 10,
      flexibility: 3,
      complexity: 9,
      control: 2,
      reversibility: 1,
    },
    compliance: 'Dynasty Trust for perpetual wealth transfer. Reference: Rule Against Perpetuities exceptions.',
  },
  {
    name: 'DAPT',
    goals: ['asset protection'],
    scores: {
      setupCost: 7,
      annualCost: 6,
      taxBenefit: 6,
      assetProtection: 9,
      flexibility: 5,
      complexity: 8,
      control: 4,
      reversibility: 1,
    },
    compliance: 'Domestic Asset Protection Trust for creditor protection. Reference: State-specific DAPT laws.',
  },
  {
    name: 'SNT',
    goals: ['family', 'asset protection'],
    scores: {
      setupCost: 5,
      annualCost: 4,
      taxBenefit: 5,
      assetProtection: 8,
      flexibility: 6,
      complexity: 7,
      control: 3,
      reversibility: 2,
    },
    compliance: 'Special Needs Trust for disabled beneficiaries. Reference: OBRA 1993.',
  },
  {
    name: 'QTIP',
    goals: ['family', 'tax savings'],
    scores: {
      setupCost: 6,
      annualCost: 5,
      taxBenefit: 8,
      assetProtection: 7,
      flexibility: 4,
      complexity: 6,
      control: 5,
      reversibility: 1,
    },
    compliance: 'Qualified Terminable Interest Property Trust for marital deduction. Reference: IRC Section 2056.',
  },
  {
    name: 'Bypass',
    goals: ['tax savings'],
    scores: {
      setupCost: 5,
      annualCost: 4,
      taxBenefit: 9,
      assetProtection: 6,
      flexibility: 5,
      complexity: 5,
      control: 6,
      reversibility: 2,
    },
    compliance: 'Bypass Trust to avoid estate taxes on spousal assets. Reference: IRC Section 2041.',
  },
  {
    name: 'Testamentary',
    goals: ['family'],
    scores: {
      setupCost: 3,
      annualCost: 2,
      taxBenefit: 4,
      assetProtection: 5,
      flexibility: 7,
      complexity: 4,
      control: 8,
      reversibility: 6,
    },
    compliance: 'Testamentary Trust created via a will. Reference: State probate laws.',
  },
];

export default function TrustComparisonMatrix() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [userInputs, setUserInputs] = useState({ priority1: '', priority2: '' });
  const [recommendedTrust, setRecommendedTrust] = useState(null);

  const filteredTrusts = useMemo(() => {
    if (selectedGoals.length === 0) return trustData;
    return trustData.filter(trust => selectedGoals.every(goal => trust.goals.includes(goal)));
  }, [selectedGoals]);

  const handleGoalChange = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleRecommend = () => {
    const priorities = ['setupCost', 'annualCost', 'taxBenefit', 'assetProtection', 'flexibility', 'complexity', 'control', 'reversibility'];
    let bestMatch = trustData[0];
    let highestScore = 0;
    
    trustData.forEach(trust => {
      let matchScore = 0;
      if (userInputs.priority1) matchScore += trust.scores[userInputs.priority1] || 0;
      if (userInputs.priority2) matchScore += trust.scores[userInputs.priority2] || 0;
      if (matchScore > highestScore) {
        highestScore = matchScore;
        bestMatch = trust;
      }
    });
    setRecommendedTrust(bestMatch);
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', minHeight: '100vh', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Grid3X3 size={32} color="#ffd54f" /> {/* Amber accent */}
        <h1 style={{ marginLeft: '10px', color: '#ffd54f' }}>Ultimate Trust Comparison Matrix</h1>
      </header>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a7ff83' }}>Filter by Goals</h2> {/* Teal accent */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {['asset protection', 'tax savings', 'income', 'charitable', 'family'].map(goal => (
            <button
              key={goal}
              onClick={() => handleGoalChange(goal)}
              style={{
                backgroundColor: selectedGoals.includes(goal) ? '#ffd54f' : '#333',
                color: selectedGoals.includes(goal) ? '#121212' : '#fff',
                padding: '10px',
                border: 'none',
                borderRadius: '5px',
              }}
            >
              {goal}
            </button>
          ))}
        </div>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a7ff83' }}>Scoring Table</h2>
        <div className="overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
          <thead>
            <tr style={{ backgroundColor: '#333' }}>
              <th style={{ padding: '10px', border: '1px solid #555' }}>Trust Type</th>
              <th style={{ padding: '10px', border: '1px solid #555' }}><DollarSign size={16} /> Setup Cost</th>
              <th style={{ padding: '10px', border: '1px solid #555' }}><TrendingUp size={16} /> Annual Cost</th>
              <th style={{ padding: '10px', border: '1px solid #555' }}><Percent size={16} /> Tax Benefit</th>
              <th style={{ padding: '10px', border: '1px solid #555' }}><Shield size={16} /> Asset Protection</th>
              <th style={{ padding: '10px', border: '1px solid #555' }}><ArrowRight size={16} /> Flexibility</th>
              <th style={{ padding: '10px', border: '1px solid #555' }}><AlertTriangle size={16} /> Complexity</th>
              <th style={{ padding: '10px', border: '1px solid #555' }}><Lock size={16} /> Control</th>
              <th style={{ padding: '10px', border: '1px solid #555' }}><Users size={16} /> Reversibility</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrusts.map(trust => (
              <tr key={trust.name} style={{ backgroundColor: '#222', textAlign: 'center' }}>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.name}</td>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.scores.setupCost}/10</td>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.scores.annualCost}/10</td>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.scores.taxBenefit}/10</td>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.scores.assetProtection}/10</td>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.scores.flexibility}/10</td>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.scores.complexity}/10</td>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.scores.control}/10</td>
                <td style={{ padding: '10px', border: '1px solid #555' }}>{trust.scores.reversibility}/10</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a7ff83' }}>Trust Recommendation Engine</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <label>
            Priority 1:
            <select onChange={e => setUserInputs({...userInputs, priority1: e.target.value})} style={{ backgroundColor: '#333', color: '#fff', marginLeft: '10px' }}>
              <option value="">Select</option>
              {['setupCost', 'annualCost', 'taxBenefit', 'assetProtection', 'flexibility', 'complexity', 'control', 'reversibility'].map(opt => (
                <option key={opt} value={opt}>{opt.replace(/([A-Z])/g, ' $1').trim()}</option>
              ))}
            </select>
          </label>
          <label>
            Priority 2:
            <select onChange={e => setUserInputs({...userInputs, priority2: e.target.value})} style={{ backgroundColor: '#333', color: '#fff', marginLeft: '10px' }}>
              <option value="">Select</option>
              {['setupCost', 'annualCost', 'taxBenefit', 'assetProtection', 'flexibility', 'complexity', 'control', 'reversibility'].map(opt => (
                <option key={opt} value={opt}>{opt.replace(/([A-Z])/g, ' $1').trim()}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleRecommend} style={{ backgroundColor: '#ffd54f', color: '#121212', padding: '10px', border: 'none', borderRadius: '5px' }}>
            Get Recommendation
          </button>
        </form>
        {recommendedTrust && (
          <div style={{ backgroundColor: '#333', padding: '20px', borderRadius: '5px' }}>
            <h3 style={{ color: '#ffd54f' }}>Recommended Trust: {recommendedTrust.name}</h3>
            <p>{recommendedTrust.compliance}</p>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a7ff83' }}>Comparison Charts</h2>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius={150} data={filteredTrusts[0] ? [filteredTrusts[0].scores] : []}>
            <PolarGrid stroke="#ffd54f" />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} />
            <Radar name={filteredTrusts[0]?.name} dataKey="setupCost" stroke="#a7ff83" fill="#a7ff83" fillOpacity={0.6} />
            <Radar name={filteredTrusts[1]?.name} dataKey="annualCost" stroke="#ffd54f" fill="#ffd54f" fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
        
        <ResponsiveContainer width="100%" height={400} style={{ marginTop: '40px' }}>
          <BarChart data={filteredTrusts}>
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="scores.setupCost" fill="#a7ff83" />
            <Bar dataKey="scores.taxBenefit" fill="#ffd54f" />
          </BarChart>
        </ResponsiveContainer>
      </section>
      
      <section>
        <h2 style={{ color: '#a7ff83' }}>Compliance References</h2>
        {trustData.map(trust => (
          <div key={trust.name} style={{ marginBottom: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
            <h3 style={{ color: '#ffd54f' }}>{trust.name}</h3>
            <p>{trust.compliance}</p>
          </div>
        ))}
      </section>
      
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#888' }}>
        <Calendar size={20} /> Last updated: 2023
      </footer>
      <PageInsights section="trust-comparison-matrix" />
    </div>
  );
}
