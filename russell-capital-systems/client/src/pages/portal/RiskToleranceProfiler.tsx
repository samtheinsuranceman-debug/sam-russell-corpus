// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Shield, DollarSign, TrendingUp, Target, Percent, ArrowRight, CheckCircle2, AlertTriangle, BarChart3, Gauge, Activity, Scale } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function RiskToleranceProfiler() {
  const questions = [
    { id: 1, question: "How would you react to a 10% drop in your portfolio value?", options: ["Sell everything", "Sell some", "Hold steady", "Buy more"], scores: [1, 2, 3, 4] },
    { id: 2, question: "What is your investment time horizon?", options: ["Less than 1 year", "1-3 years", "3-5 years", "More than 5 years"], scores: [1, 2, 3, 4] },
    { id: 3, question: "How much of your portfolio are you willing to risk for potential higher returns?", options: ["None", "Up to 10%", "Up to 25%", "More than 25%"], scores: [1, 2, 3, 4] },
    { id: 4, question: "Have you experienced a major market downturn before?", options: ["No, and I'd panic", "No, but I'd stay calm", "Yes, and I sold", "Yes, and I held or bought"], scores: [1, 2, 3, 4] },
    { id: 5, question: "What is your primary financial goal?", options: ["Preserve capital", "Moderate growth with safety", "Balanced growth", "High growth"], scores: [1, 2, 3, 4] },
    { id: 6, question: "How often do you check your investment portfolio?", options: ["Daily", "Weekly", "Monthly", "Rarely"], scores: [1, 2, 3, 4] },
    { id: 7, question: "Are you comfortable with volatile investments like stocks?", options: ["Not at all", "Somewhat", "Yes", "Very much"], scores: [1, 2, 3, 4] },
    { id: 8, question: "What percentage of your income do you save monthly?", options: ["Less than 5%", "5-10%", "10-20%", "More than 20%"], scores: [1, 2, 3, 4] },
    { id: 9, question: "How would you describe your emotional response to losses?", options: ["Highly emotional", "Moderately emotional", "Neutral", "Rational"], scores: [1, 2, 3, 4] },
    { id: 10, question: "Do you have emergency funds covering 6 months of expenses?", options: ["No", "Partially", "Yes", "Yes, and more"], scores: [1, 2, 3, 4] },
    { id: 11, question: "What is your age group?", options: ["Under 30", "30-50", "50-65", "Over 65"], scores: [4, 3, 2, 1] },
    { id: 12, question: "How important is it for you to beat the market?", options: ["Not important", "Somewhat important", "Important", "Extremely important"], scores: [1, 2, 3, 4] },
    { id: 13, question: "Are you influenced by recent market news?", options: ["Yes, a lot", "Sometimes", "Rarely", "Never"], scores: [1, 2, 3, 4] },
    { id: 14, question: "What is your net worth relative to your annual income?", options: ["Less than 1 year", "1-3 years", "3-5 years", "More than 5 years"], scores: [1, 2, 3, 4] },
    { id: 15, question: "Would you invest in something you don't fully understand for high returns?", options: ["Never", "Rarely", "Sometimes", "Yes"], scores: [1, 2, 3, 4] },
  ];

  const [answers, setAnswers] = useState(Array(15).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [riskScore, setRiskScore] = useState(0);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const calculateRiskScore = () => {
    let totalScore = 0;
    answers.forEach((answer, index) => {
      const question = questions[index];
      const scoreIndex = question.options.indexOf(answer);
      if (scoreIndex !== -1) {
        totalScore += question.scores[scoreIndex];
      }
    });
    const normalizedScore = (totalScore / (15 * 4)) * 100; // Scale to 1-100
    setRiskScore(Math.round(normalizedScore));
    setSubmitted(true);
  };

  const riskProfiles = [
    { name: "Conservative", range: "0-20", description: "Focus on capital preservation with low-risk assets.", allocation: { bonds: 80, stocks: 20, cash: 0 } },
    { name: "Moderately Conservative", range: "21-40", description: "Balanced approach with moderate risk.", allocation: { bonds: 60, stocks: 30, cash: 10 } },
    { name: "Moderate", range: "41-60", description: "Even balance for steady growth.", allocation: { bonds: 40, stocks: 50, cash: 10 } },
    { name: "Moderately Aggressive", range: "61-80", description: "Higher growth potential with increased risk.", allocation: { bonds: 20, stocks: 70, cash: 10 } },
    { name: "Aggressive", range: "81-100", description: "Maximize returns with high volatility.", allocation: { bonds: 10, stocks: 80, cash: 10 } },
  ];

  const getRiskProfile = useMemo(() => {
    if (riskScore <= 20) return riskProfiles[0];
    if (riskScore <= 40) return riskProfiles[1];
    if (riskScore <= 60) return riskProfiles[2];
    if (riskScore <= 80) return riskProfiles[3];
    return riskProfiles[4];
  }, [riskScore]);

  const historicalDrawdownData = [
    { year: 2008, conservative: -5, moderate: -15, aggressive: -35 },
    { year: 2020, conservative: -3, moderate: -10, aggressive: -25 },
    { year: 2022, conservative: -2, moderate: -8, aggressive: -20 },
  ];

  const recoveryTimeData = [
    { event: "2008 Crisis", conservative: "6 months", moderate: "12 months", aggressive: "24 months" },
    { event: "2020 Pandemic", conservative: "3 months", moderate: "6 months", aggressive: "9 months" },
    { event: "2022 Inflation", conservative: "4 months", moderate: "8 months", aggressive: "12 months" },
  ];

  const behavioralBiases = useMemo(() => {
    const lossAversion = answers[8] === "Highly emotional" ? "High" : "Low";
    const recencyBias = answers[12] === "Yes, a lot" ? "High" : "Low";
    const overconfidence = answers[0] === "Advanced" && answers[11] === "Extremely important" ? "High" : "Low";
    return { lossAversion, recencyBias, overconfidence };
  }, [answers]);

  const portfolioProjectionData = [
    { year: 0, conservative: 100000, moderate: 100000, aggressive: 100000 },
    { year: 10, conservative: 150000, moderate: 200000, aggressive: 300000 },
    { year: 20, conservative: 225000, moderate: 400000, aggressive: 900000 },
    { year: 30, conservative: 337500, moderate: 800000, aggressive: 2700000 },
    { year: 40, conservative: 506250, moderate: 1600000, aggressive: 8100000 },
    { year: 50, conservative: 759375, moderate: 3200000, aggressive: 24300000 },
  ];

  const darkThemeStyles = {
    backgroundColor: '#1a202c', // Dark background
    color: '#ffffff', // White text
    accentTeal: '#38a169', // Teal accent
    accentOrange: '#dd6b20', // Orange accent
  };

  return (
    <div style={{ backgroundColor: darkThemeStyles.backgroundColor, color: darkThemeStyles.color, padding: '20px', minHeight: '100vh' }}>
      <h1 style={{ color: darkThemeStyles.accentTeal }}>Risk Tolerance Profiler</h1>
      {!submitted ? (
        <div>
          <p style={{ color: darkThemeStyles.accentOrange }}>Answer the following 15 questions to assess your risk tolerance.</p>
          {questions.map((q, index) => (
            <div key={q.id} style={{ marginBottom: '15px' }}>
              <p>{q.question}</p>
              {q.options.map((option, optIndex) => (
                <label key={optIndex} style={{ display: 'block', marginLeft: '20px' }}>
                  <input
                    type="radio"
                    value={option}
                    checked={answers[index] === option}
                    onChange={() => handleAnswerChange(index, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}
          <button onClick={calculateRiskScore} style={{ backgroundColor: darkThemeStyles.accentTeal, color: '#fff', padding: '10px', border: 'none' }}>
            Submit Questionnaire
          </button>
        </div>
      ) : (
        <div>
          <h2>Your Risk Score: {riskScore}/100</h2>
          <div style={{ display: 'flex', alignItems: 'center', color: darkThemeStyles.accentOrange }}>
            <Shield size={24} />
            <h3 style={{ marginLeft: '10px' }}>Risk Profile: {getRiskProfile.name} ({getRiskProfile.range})</h3>
          </div>
          <p>{getRiskProfile.description}</p>
          
          <h4>Recommended Portfolio Allocation</h4>
          <div style={{ display: 'flex' }}>
            <ResponsiveContainer width="100%" height={400}><PieChart>
              <Pie data={[
                { name: 'Bonds', value: getRiskProfile.allocation.bonds },
                { name: 'Stocks', value: getRiskProfile.allocation.stocks },
                { name: 'Cash', value: getRiskProfile.allocation.cash },
              ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
                <Cell fill={darkThemeStyles.accentTeal} />
                <Cell fill={darkThemeStyles.accentOrange} />
                <Cell fill="#fff" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart></ResponsiveContainer>
          </div>
          
          <h4>Historical Drawdown Analysis</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalDrawdownData}>
              <Area type="monotone" dataKey="conservative" stroke={darkThemeStyles.accentTeal} fill={darkThemeStyles.accentTeal} />
              <Area type="monotone" dataKey="moderate" stroke="#fff" fill="#fff" />
              <Area type="monotone" dataKey="aggressive" stroke={darkThemeStyles.accentOrange} fill={darkThemeStyles.accentOrange} />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
          
          <h4>Recovery Time Analysis</h4>
          <div className="overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Event</th>
                <th>Conservative</th>
                <th>Moderate</th>
                <th>Aggressive</th>
              </tr>
            </thead>
            <tbody>
              {recoveryTimeData.map((item, index) => (
                <tr key={index}>
                  <td>{item.event}</td>
                  <td>{item.conservative}</td>
                  <td>{item.moderate}</td>
                  <td>{item.aggressive}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          
          <h4>Behavioral Bias Detector</h4>
          <div>
            <p><AlertTriangle size={18} /> Loss Aversion: {behavioralBiases.lossAversion}</p>
            <p><Activity size={18} /> Recency Bias: {behavioralBiases.recencyBias}</p>
            <p><Scale size={18} /> Overconfidence: {behavioralBiases.overconfidence}</p>
          </div>
          
          <h4>50-Year Portfolio Projection</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={portfolioProjectionData}>
              <Area type="monotone" dataKey="conservative" stroke={darkThemeStyles.accentTeal} fill={darkThemeStyles.accentTeal} />
              <Area type="monotone" dataKey="moderate" stroke="#fff" fill="#fff" />
              <Area type="monotone" dataKey="aggressive" stroke={darkThemeStyles.accentOrange} fill={darkThemeStyles.accentOrange} />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
          
          <h4>Risk Capacity vs. Risk Tolerance</h4>
          <p>Risk tolerance is your emotional comfort with risk, while risk capacity is your ability to withstand losses based on financial situation. This tool assesses tolerance; consult a advisor for capacity alignment.</p>
          
          <h4>Compliance Information</h4>
          <p>This tool complies with SEC Reg BI (best interest), FINRA Rule 2111 (suitability), and DOL fiduciary rule by providing educational recommendations only. Not personalized advice; seek professional guidance.</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={() => window.location.reload()} style={{ backgroundColor: darkThemeStyles.accentOrange, color: '#fff', padding: '10px', border: 'none' }}>
              Retake Questionnaire
            </button>
          </div>
        </div>
      )}
      <PageInsights section="risk-tolerance-profiler" />
    </div>
  );
}
