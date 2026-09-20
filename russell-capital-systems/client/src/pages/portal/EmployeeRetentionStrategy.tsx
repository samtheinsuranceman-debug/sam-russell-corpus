// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Users, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Award, Lock } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const EmployeeRetentionStrategy = () => {
  const [retentionCost, setRetentionCost] = useState(0);
  const [replacementCost, setReplacementCost] = useState(0);
  const [vestingYears, setVestingYears] = useState(4);
  const [keyEmployeeScore, setKeyEmployeeScore] = useState({ performance: 0, tenure: 0, criticalRole: 0 });

  const retentionVsReplacementDifference = useMemo(() => retentionCost - replacementCost, [retentionCost, replacementCost]);
  const vestingCliffValue = useMemo(() => {
    if (vestingYears >= 1) {
      return (100 / vestingYears) * Math.min(vestingYears, 1);
    }
    return 0;
  }, [vestingYears]);

  const retentionData = [
    { name: 'Year 1', value: 50000 },
    { name: 'Year 2', value: 75000 },
    { name: 'Year 3', value: 100000 },
    { name: 'Year 4', value: 125000 },
    { name: 'Year 5', value: 150000 },
    { name: 'Year 6', value: 175000 },
    { name: 'Year 7', value: 200000 },
    { name: 'Year 8', value: 225000 },
    { name: 'Year 9', value: 250000 },
    { name: 'Year 10', value: 275000 },
  ];

  const keyEmployeeData = [
    { subject: 'Performance', A: keyEmployeeScore.performance, fullMark: 100 },
    { subject: 'Tenure', A: keyEmployeeScore.tenure, fullMark: 100 },
    { subject: 'Critical Role', A: keyEmployeeScore.criticalRole, fullMark: 100 },
    { subject: 'Leadership', A: 70, fullMark: 100 },
    { subject: 'Innovation', A: 80, fullMark: 100 },
  ];

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', padding: '40px', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ color: '#00b4d8', fontSize: '2.5em', marginBottom: '20px' }}><Users size={32} /> Employee Retention Strategy</h1>
      <p style={{ color: '#ffd700', fontSize: '1.2em' }}>This comprehensive strategy focuses on golden handcuff mechanisms to enhance employee loyalty and reduce turnover, incorporating cost analysis, vesting schedules, and compliance considerations.</p>

      {/* Golden Handcuff Toolkit Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8', fontSize: '2em' }}><Award size={24} /> Golden Handcuff Toolkit</h2>
        <p style={{ color: '#ffffff' }}>Golden handcuffs are financial incentives designed to retain key employees. Below is a breakdown of common tools:</p>
        <ul style={{ color: '#ffffff', listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><DollarSign size={18} /> NQDC (Non-Qualified Deferred Compensation): Allows executives to defer a portion of their income for future payout, subject to vesting.</li>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><Lock size={18} /> Restricted Stock: Shares granted that vest over time, encouraging long-term commitment.</li>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><TrendingUp size={18} /> Phantom Equity: Synthetic equity that mimics stock options without actual ownership, tying rewards to company performance.</li>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><Shield size={18} /> SERP (Supplemental Executive Retirement Plan): Provides additional retirement benefits beyond standard plans for top executives.</li>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><Percent size={18} /> Split-Dollar Life Insurance: Company pays premiums on a policy, with benefits split upon termination, acting as a retention tool.</li>
        </ul>
        <p style={{ color: '#ffd700' }}>These tools can be customized based on employee roles and company goals.</p>
      </section>

      {/* Retention Cost vs Replacement Cost Calculator */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8', fontSize: '2em' }}><Target size={24} /> Retention Cost vs Replacement Cost Calculator</h2>
        <p style={{ color: '#ffffff' }}>Calculate the financial impact of retention versus hiring replacements. Input values in USD.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <input
            type="number"
            placeholder="Retention Cost"
            onChange={(e) => setRetentionCost(Number(e.target.value))}
            style={{ padding: '10px', backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #00b4d8' }}
          />
          <input
            type="number"
            placeholder="Replacement Cost"
            onChange={(e) => setReplacementCost(Number(e.target.value))}
            style={{ padding: '10px', backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #00b4d8' }}
          />
          <p style={{ color: '#ffd700' }}>Difference (Retention - Replacement): ${retentionVsReplacementDifference.toFixed(2)}</p>
          {retentionVsReplacementDifference > 0 && <p style={{ color: '#00b4d8' }}><CheckCircle2 size={18} /> Retention is more cost-effective.</p>}
          {retentionVsReplacementDifference < 0 && <p style={{ color: '#ffcc00' }}><AlertTriangle size={18} /> Replacement might be cheaper; review strategy.</p>}
        </div>
      </section>

      {/* Vesting Cliff Analysis */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8', fontSize: '2em' }}><Calendar size={24} /> Vesting Cliff Analysis</h2>
        <p style={{ color: '#ffffff' }}>Analyze vesting schedules to understand employee lock-in periods. A cliff typically means no vesting until a certain period.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <input
            type="number"
            placeholder="Vesting Years (e.g., 4)"
            onChange={(e) => setVestingYears(Number(e.target.value))}
            style={{ padding: '10px', backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #00b4d8' }}
          />
          <p style={{ color: '#ffd700' }}>Vesting Cliff Value: {vestingCliffValue.toFixed(2)}% vested after first year.</p>
          <p style={{ color: '#ffffff' }}>This analysis helps in designing schedules that balance retention and fairness.</p>
        </div>
      </section>

      {/* 10-Year Retention Value Comparison */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8', fontSize: '2em' }}><ArrowRight size={24} /> 10-Year Retention Value Comparison</h2>
        <p style={{ color: '#ffffff' }}>Visualize the projected value of retaining employees over 10 years using a bar chart.</p>
        <ResponsiveContainer width="100%" height={400}>
          <ReBarChart data={retentionData}>
            <XAxis dataKey="name" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ffd700" name="Retention Value" />
          </ReBarChart>
        </ResponsiveContainer>
      </section>

      {/* Key Employee Identification Matrix */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8', fontSize: '2em' }}><Shield size={24} /> Key Employee Identification Matrix</h2>
        <p style={{ color: '#ffffff' }}>Identify key employees based on performance metrics using a radar chart.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <input
            type="number"
            placeholder="Performance Score (0-100)"
            onChange={(e) => setKeyEmployeeScore({ ...keyEmployeeScore, performance: Number(e.target.value) })}
            style={{ padding: '10px', backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #00b4d8' }}
          />
          <input
            type="number"
            placeholder="Tenure Score (0-100)"
            onChange={(e) => setKeyEmployeeScore({ ...keyEmployeeScore, tenure: Number(e.target.value) })}
            style={{ padding: '10px', backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #00b4d8' }}
          />
          <input
            type="number"
            placeholder="Critical Role Score (0-100)"
            onChange={(e) => setKeyEmployeeScore({ ...keyEmployeeScore, criticalRole: Number(e.target.value) })}
            style={{ padding: '10px', backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #00b4d8' }}
          />
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius={150} data={keyEmployeeData}>
            <PolarGrid stroke="#ffffff" />
            <PolarAngleAxis dataKey="subject" stroke="#ffffff" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#ffffff" />
            <Radar name="Employee Score" dataKey="A" stroke="#ffd700" fill="#00b4d8" fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      {/* Compliance Section */}
      <section>
        <h2 style={{ color: '#00b4d8', fontSize: '2em' }}><Lock size={24} /> Compliance Considerations</h2>
        <p style={{ color: '#ffffff' }}>Ensure your retention strategies comply with key regulations:</p>
        <ul style={{ color: '#ffffff', listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><CheckCircle2 size={18} /> IRC 409A: Governs NQDC plans, requiring fair market value and specific distribution rules to avoid penalties.</li>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><AlertTriangle size={18} /> Section 83: Applies to restricted property, taxing upon transfer rather than vesting to optimize employee benefits.</li>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><DollarSign size={18} /> Section 162: Addresses deductibility of executive compensation, ensuring amounts are reasonable and ordinary business expenses.</li>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><TrendingUp size={18} /> Section 280G: Limits deductions for golden parachute payments in change-of-control scenarios, requiring excise tax calculations.</li>
          <li style={{marginBottom: '10px', color: '#ffd700', marginRight: '10px'}}><Shield size={18} /> ERISA Top-Hat Plan Exemption: Exempts certain executive plans from ERISA funding and participation rules, but requires proper documentation.</li>
        </ul>
        <p style={{ color: '#ffd700' }}>Consult legal experts to tailor these to your organization.</p>
      </section>
      <PageInsights section="employee-retention-strategy" />
    </div>
  );
};

export default EmployeeRetentionStrategy;
