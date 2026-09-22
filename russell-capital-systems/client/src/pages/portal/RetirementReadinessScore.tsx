// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Target, DollarSign, TrendingUp, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Heart, Clock, Award } from 'lucide-react';
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function RetirementReadinessScore() {
  // State for user inputs or simulated scores (0-100 for each dimension)
  const [savingsRateScore, setSavingsRateScore] = useState(75); // Example value
  const [assetAllocationScore, setAssetAllocationScore] = useState(85);
  const [socialSecurityScore, setSocialSecurityScore] = useState(60);
  const [healthcareCoverageScore, setHealthcareCoverageScore] = useState(90);
  const [incomeReplacementScore, setIncomeReplacementScore] = useState(70);
  const [debtToAssetScore, setDebtToAssetScore] = useState(80);
  const [insuranceCoverageScore, setInsuranceCoverageScore] = useState(65);
  const [estatePlanScore, setEstatePlanScore] = useState(55);
  const [taxEfficiencyScore, setTaxEfficiencyScore] = useState(75);
  const [longevityRiskScore, setLongevityRiskScore] = useState(85);

  // Compliance state (boolean for each)
  const [rmdCompliance, setRmdCompliance] = useState(true); // IRC 401(a)(9)
  const [rothCompliance, setRothCompliance] = useState(false); // Section 408A
  const [ssTaxationCompliance, setSsTaxationCompliance] = useState(true); // Section 86
  const [medicareCompliance, setMedicareCompliance] = useState(true); // 42 USC 1395

  // Sample data for charts and projections
  const radarData = [
    { subject: 'Savings Rate', A: savingsRateScore, fullMark: 100 },
    { subject: 'Asset Allocation', A: assetAllocationScore, fullMark: 100 },
    { subject: 'Social Security', A: socialSecurityScore, fullMark: 100 },
    { subject: 'Healthcare Coverage', A: healthcareCoverageScore, fullMark: 100 },
    { subject: 'Income Replacement', A: incomeReplacementScore, fullMark: 100 },
    { subject: 'Debt-to-Asset', A: debtToAssetScore, fullMark: 100 },
    { subject: 'Insurance Coverage', A: insuranceCoverageScore, fullMark: 100 },
    { subject: 'Estate Plan', A: estatePlanScore, fullMark: 100 },
    { subject: 'Tax Efficiency', A: taxEfficiencyScore, fullMark: 100 },
    { subject: 'Longevity Risk', A: longevityRiskScore, fullMark: 100 },
  ];

  const projectionData = [
    { year: 2025, currentPlan: 50000, optimizedPlan: 75000 },
    { year: 2030, currentPlan: 100000, optimizedPlan: 150000 },
    { year: 2035, currentPlan: 150000, optimizedPlan: 200000 },
    { year: 2040, currentPlan: 200000, optimizedPlan: 250000 },
    { year: 2045, currentPlan: 250000, optimizedPlan: 300000 },
    { year: 2050, currentPlan: 300000, optimizedPlan: 350000 },
    { year: 2055, currentPlan: 350000, optimizedPlan: 400000 },
    { year: 2060, currentPlan: 400000, optimizedPlan: 450000 },
    { year: 2065, currentPlan: 450000, optimizedPlan: 500000 },
    { year: 2070, currentPlan: 500000, optimizedPlan: 550000 },
    { year: 2075, currentPlan: 550000, optimizedPlan: 600000 },
  ];

  const gapAnalysisData = [
    { category: 'Savings Shortfall', amount: 50000 },
    { category: 'Healthcare Gap', amount: 20000 },
    { category: 'Insurance Needs', amount: 10000 },
    { category: 'Debt Reduction', amount: 30000 },
  ];

  // Calculate grades and overall score
  const getGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const overallScore = useMemo(() => {
    const scoresArray = [
      savingsRateScore, assetAllocationScore, socialSecurityScore,
      healthcareCoverageScore, incomeReplacementScore, debtToAssetScore,
      insuranceCoverageScore, estatePlanScore, taxEfficiencyScore,
      longevityRiskScore
    ];
    const average = scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length;
    return average;
  }, [
    savingsRateScore, assetAllocationScore, socialSecurityScore,
    healthcareCoverageScore, incomeReplacementScore, debtToAssetScore,
    insuranceCoverageScore, estatePlanScore, taxEfficiencyScore,
    longevityRiskScore
  ]);

  // Action plan prioritizer based on scores
  const actionPlan = useMemo(() => {
    const plans = [
      { dimension: 'Savings Rate', priority: 100 - savingsRateScore, action: 'Increase savings to 15% of income.' },
      { dimension: 'Asset Allocation', priority: 100 - assetAllocationScore, action: 'Rebalance portfolio to 60/40 stocks/bonds.' },
      { dimension: 'Social Security', priority: 100 - socialSecurityScore, action: 'Delay claiming until full retirement age.' },
      { dimension: 'Healthcare Coverage', priority: 100 - healthcareCoverageScore, action: 'Enroll in supplemental Medicare plans.' },
      { dimension: 'Income Replacement', priority: 100 - incomeReplacementScore, action: 'Aim for 80% replacement ratio.' },
      { dimension: 'Debt-to-Asset', priority: 100 - debtToAssetScore, action: 'Pay off high-interest debts.' },
      { dimension: 'Insurance Coverage', priority: 100 - insuranceCoverageScore, action: 'Review life and disability insurance.' },
      { dimension: 'Estate Plan', priority: 100 - estatePlanScore, action: 'Update will and beneficiaries.' },
      { dimension: 'Tax Efficiency', priority: 100 - taxEfficiencyScore, action: 'Maximize Roth contributions.' },
      { dimension: 'Longevity Risk', priority: 100 - longevityRiskScore, action: 'Build emergency fund for 10+ years.' },
    ];
    return plans.sort((a, b) => b.priority - a.priority);  // Highest priority first
  }, [
    savingsRateScore, assetAllocationScore, socialSecurityScore,
    healthcareCoverageScore, incomeReplacementScore, debtToAssetScore,
    insuranceCoverageScore, estatePlanScore, taxEfficiencyScore,
    longevityRiskScore
  ]);

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#ffffff', minHeight: '100vh', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#00bcd4', textAlign: 'center' }}>Retirement Readiness Assessment</h1>
      
      {/* Input Section for Scores (Simulated) */}
      <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
        <h2 style={{ color: '#f9bc60' }}>Enter Your Scores (0-100)</h2>
        <input type="number" value={savingsRateScore} onChange={(e) => setSavingsRateScore(Number(e.target.value))} placeholder="Savings Rate Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={assetAllocationScore} onChange={(e) => setAssetAllocationScore(Number(e.target.value))} placeholder="Asset Allocation Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={socialSecurityScore} onChange={(e) => setSocialSecurityScore(Number(e.target.value))} placeholder="Social Security Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={healthcareCoverageScore} onChange={(e) => setHealthcareCoverageScore(Number(e.target.value))} placeholder="Healthcare Coverage Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={incomeReplacementScore} onChange={(e) => setIncomeReplacementScore(Number(e.target.value))} placeholder="Income Replacement Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={debtToAssetScore} onChange={(e) => setDebtToAssetScore(Number(e.target.value))} placeholder="Debt-to-Asset Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={insuranceCoverageScore} onChange={(e) => setInsuranceCoverageScore(Number(e.target.value))} placeholder="Insurance Coverage Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={estatePlanScore} onChange={(e) => setEstatePlanScore(Number(e.target.value))} placeholder="Estate Plan Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={taxEfficiencyScore} onChange={(e) => setTaxEfficiencyScore(Number(e.target.value))} placeholder="Tax Efficiency Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
        <input type="number" value={longevityRiskScore} onChange={(e) => setLongevityRiskScore(Number(e.target.value))} placeholder="Longevity Risk Score" style={{ margin: '10px', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #00bcd4' }} />
      </div>

      {/* Dimension Scores Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bcd4' }}>10-Dimension Scores</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Target color="#f9bc60" /> Savings Rate: {savingsRateScore}% - Grade: {getGrade(savingsRateScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <DollarSign color="#f9bc60" /> Asset Allocation: {assetAllocationScore}% - Grade: {getGrade(assetAllocationScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <TrendingUp color="#f9bc60" /> Social Security: {socialSecurityScore}% - Grade: {getGrade(socialSecurityScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Calendar color="#f9bc60" /> Healthcare Coverage: {healthcareCoverageScore}% - Grade: {getGrade(healthcareCoverageScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Percent color="#f9bc60" /> Income Replacement: {incomeReplacementScore}% - Grade: {getGrade(incomeReplacementScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <ArrowRight color="#f9bc60" /> Debt-to-Asset: {debtToAssetScore}% - Grade: {getGrade(debtToAssetScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Shield color="#f9bc60" /> Insurance Coverage: {insuranceCoverageScore}% - Grade: {getGrade(insuranceCoverageScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <CheckCircle2 color="#f9bc60" /> Estate Plan: {estatePlanScore}% - Grade: {getGrade(estatePlanScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <AlertTriangle color="#f9bc60" /> Tax Efficiency: {taxEfficiencyScore}% - Grade: {getGrade(taxEfficiencyScore)}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Heart color="#f9bc60" /> Longevity Risk: {longevityRiskScore}% - Grade: {getGrade(longevityRiskScore)}
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#f9bc60' }}>Overall Readiness: {overallScore.toFixed(2)}% - Grade: {getGrade(overallScore)}</h2>
      </div>

      {/* Gap Analysis */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bcd4' }}>Gap Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={gapAnalysisData}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#f9bc60" />
          </BarChart>
        </ResponsiveContainer>
        <p>Estimated gaps: e.g., Savings Shortfall of $50,000 needed.</p>
      </div>

      {/* Action Plan */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bcd4' }}>Prioritized Action Plan</h2>
        <ul style={{ listStyle: 'none' }}>
          {actionPlan.map((item, index) => (
            <li key={index} style={{ margin: '10px 0', padding: '10px', backgroundColor: '#2c2c44', borderRadius: '4px' }}>
              <Clock color="#f9bc60" /> {item.dimension} (Priority: {item.priority}) - {item.action}
            </li>
          ))}
        </ul>
      </div>

      {/* 50-Year Projection */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bcd4' }}>50-Year Retirement Projection</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={projectionData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="currentPlan" stroke="#00bcd4" fill="#00bcd4" fillOpacity={0.3} />
            <Area type="monotone" dataKey="optimizedPlan" stroke="#f9bc60" fill="#f9bc60" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
        <p>Current vs Optimized plans over 50 years.</p>
      </div>

      {/* Compliance Section */}
      <div>
        <h2 style={{ color: '#00bcd4' }}>Compliance Check</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Award color={rmdCompliance ? '#f9bc60' : '#ff0000'} /> IRC 401(a)(9) RMD: {rmdCompliance ? 'Compliant' : 'Non-Compliant'}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Award color={rothCompliance ? '#f9bc60' : '#ff0000'} /> Section 408A Roth: {rothCompliance ? 'Compliant' : 'Non-Compliant'}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Award color={ssTaxationCompliance ? '#f9bc60' : '#ff0000'} /> Section 86 SS Taxation: {ssTaxationCompliance ? 'Compliant' : 'Non-Compliant'}
          </div>
          <div style={{ width: '45%', margin: '10px', padding: '20px', backgroundColor: '#2c2c44', borderRadius: '8px' }}>
            <Award color={medicareCompliance ? '#f9bc60' : '#ff0000'} /> 42 USC 1395 Medicare: {medicareCompliance ? 'Compliant' : 'Non-Compliant'}
          </div>
        </div>
      </div>

      {/* Radar Chart for Dimensions */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#f9bc60' }}>Dimension Radar Chart</h2>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius={90} data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Scores" dataKey="A" stroke="#00bcd4" fill="#f9bc60" fillOpacity={0.6} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <PageInsights section="retirement-readiness-score" />
    </div>
  );
}
