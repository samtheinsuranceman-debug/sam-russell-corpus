// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Users, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, FileText, Crown } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const darkThemeStyle = {
  backgroundColor: '#111827', // Dark background
  color: '#E5E7EB', // Light text for readability
  padding: '20px',
  minHeight: '100vh',
  fontFamily: 'Arial, sans-serif',
};

const accentEmerald = '#10B981'; // Emerald accent
const accentGold = '#D4AF37'; // Gold accent

export default function FamilyGovernanceFramework() {
  const [missionValues, setMissionValues] = useState('');
  const [missionVision, setMissionVision] = useState('');
  const [generatedMission, setGeneratedMission] = useState('');

  const handleMissionGenerate = () => {
    if (missionValues && missionVision) {
      setGeneratedMission(`Our family is dedicated to core values of ${missionValues}, guided by a vision to achieve ${missionVision}.`);
    } else {
      setGeneratedMission('Please fill in both fields to generate the mission statement.');
    }
  };

  const familyCouncilStructure = [
    { role: 'Chairperson', description: 'Oversees meetings and decision-making.' },
    { role: 'Secretary', description: 'Handles documentation and records.' },
    { role: 'Members', description: 'Represent different family branches.' },
  ];

  const lendingProgramDetails = [
    { feature: 'Interest Rates', description: 'Competitive rates based on family assets.' },
    { feature: 'Application Process', description: 'Simple internal review for loans.' },
    { feature: 'Repayment Terms', description: 'Flexible options up to 10 years.' },
  ];

  const educationCurriculum = [
    { topic: 'Financial Literacy', description: 'Basics of budgeting and investing.' },
    { topic: 'Estate Planning', description: 'Understanding wills and trusts.' },
    { topic: 'Leadership Skills', description: 'Workshops on family governance.' },
  ];

  const investmentCommitteeCharter = [
    { principle: 'Risk Management', description: 'Assess and mitigate investment risks.' },
    { principle: 'Diversification', description: 'Ensure balanced portfolio across assets.' },
    { principle: 'Reporting', description: 'Quarterly reviews and family updates.' },
  ];

  const philanthropyCommittee = [
    { initiative: 'Grant Programs', description: 'Fund community projects annually.' },
    { initiative: 'Volunteer Coordination', description: 'Organize family volunteering events.' },
    { initiative: 'Impact Measurement', description: 'Track and report on charitable outcomes.' },
  ];

  const conflictResolutionFramework = [
    { step: 'Mediation', description: 'Initial discussion with a neutral family member.' },
    { step: 'Arbitration', description: 'External advisor if needed.' },
    { step: 'Escalation', description: 'Legal recourse as last resort.' },
  ];

  const sustainabilityFactors = useMemo(() => [
    { factor: 'Wealth Growth', score: 8 },
    { factor: 'Education Investment', score: 7 },
    { factor: 'Philanthropy', score: 9 },
    { factor: 'Governance', score: 6 },
    { factor: 'Risk Management', score: 8 },
  ], []);

  const sustainabilityScore = useMemo(() => {
    const total = sustainabilityFactors.reduce((sum, item) => sum + item.score, 0);
    return (total / sustainabilityFactors.length).toFixed(2);
  }, [sustainabilityFactors]);

  const complianceDetails = [
    { aspect: 'Family Limited Partnership Governance', description: 'Structures for asset protection and management.' },
    { aspect: 'Trust Protector Powers', description: 'Appoint protectors to oversee trust modifications.' },
    { aspect: 'Directed Trust Statutes', description: 'Allow directed investments within trusts.' },
    { aspect: 'Uniform Trust Code', description: 'Standardizes trust administration across states.' },
    { aspect: 'State Dynasty Trust Provisions', description: 'Enables perpetual trusts for long-term wealth preservation.' },
  ];

  const radarData = [
    { subject: 'Wealth Growth', A: sustainabilityFactors.find(f => f.factor === 'Wealth Growth')?.score || 0, fullMark: 10 },
    { subject: 'Education', A: sustainabilityFactors.find(f => f.factor === 'Education Investment')?.score || 0, fullMark: 10 },
    { subject: 'Philanthropy', A: sustainabilityFactors.find(f => f.factor === 'Philanthropy')?.score || 0, fullMark: 10 },
    { subject: 'Governance', A: sustainabilityFactors.find(f => f.factor === 'Governance')?.score || 0, fullMark: 10 },
    { subject: 'Risk Mgmt', A: sustainabilityFactors.find(f => f.factor === 'Risk Management')?.score || 0, fullMark: 10 },
  ];

  const barData = [
    { name: 'Year 1', value: 85 },
    { name: 'Year 10', value: 90 },
    { name: 'Year 20', value: 95 },
    { name: 'Year 30', value: 88 },
    { name: 'Year 50', value: 92 },
  ];

  const pieData = [
    { name: 'Investments', value: 40 },
    { name: 'Education', value: 30 },
    { name: 'Philanthropy', value: 20 },
    { name: 'Governance', value: 10 },
  ];

  const COLORS = [accentEmerald, accentGold, '#EF4444', '#6366f1'];

  return (
    <div style={darkThemeStyle}>
      <h1 style={{ color: accentEmerald, textAlign: 'center', marginBottom: '40px' }}>Family Governance and Wealth Stewardship Framework</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <Target size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          Family Mission Statement Builder
        </h2>
        <div style={{ margin: '20px 0' }}>
          <input
            type="text"
            placeholder="Enter core values"
            value={missionValues}
            onChange={(e) => setMissionValues(e.target.value)}
            style={{ padding: '10px', marginBottom: '10px', width: '100%', backgroundColor: '#1F2937', color: '#E5E7EB', border: '1px solid #4B5563' }}
          />
          <input
            type="text"
            placeholder="Enter vision statement"
            value={missionVision}
            onChange={(e) => setMissionVision(e.target.value)}
            style={{ padding: '10px', marginBottom: '10px', width: '100%', backgroundColor: '#1F2937', color: '#E5E7EB', border: '1px solid #4B5563' }}
          />
          <button onClick={handleMissionGenerate} style={{ padding: '10px 20px', backgroundColor: accentEmerald, color: '#fff', border: 'none', cursor: 'pointer' }}>
            Generate Mission
          </button>
          <p style={{ marginTop: '10px', color: accentGold }}>{generatedMission}</p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <Users size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          Family Council Structure
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {familyCouncilStructure.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <ArrowRight size={18} color={accentGold} style={{ marginRight: '10px' }} />
              {item.role}: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <DollarSign size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          Family Bank/Lending Program
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {lendingProgramDetails.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <Percent size={18} color={accentGold} style={{ marginRight: '10px' }} />
              {item.feature}: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <Calendar size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          Next-Gen Education Curriculum
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {educationCurriculum.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={18} color={accentGold} style={{ marginRight: '10px' }} />
              {item.topic}: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <Shield size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          Family Investment Committee Charter
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {investmentCommitteeCharter.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <CheckCircle2 size={18} color={accentGold} style={{ marginRight: '10px' }} />
              {item.principle}: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <FileText size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          Philanthropy Committee
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {philanthropyCommittee.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <Crown size={18} color={accentGold} style={{ marginRight: '10px' }} />
              {item.initiative}: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <AlertTriangle size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          Conflict Resolution Framework
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {conflictResolutionFramework.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <ArrowRight size={18} color={accentGold} style={{ marginRight: '10px' }} />
              {item.step}: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <TrendingUp size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          50-Year Family Wealth Sustainability Score
        </h2>
        <p style={{ color: accentEmerald }}>Overall Score: {sustainabilityScore}/10</p>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart outerRadius={90} data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} />
            <Radar name="Sustainability" dataKey="A" stroke={accentGold} fill={accentEmerald} fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={300} style={{ marginTop: '20px' }}>
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill={accentGold} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2 style={{ color: accentGold, display: 'flex', alignItems: 'center' }}>
          <Shield size={24} color={accentEmerald} style={{ marginRight: '10px' }} />
          Compliance
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {complianceDetails.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <CheckCircle2 size={18} color={accentGold} style={{ marginRight: '10px' }} />
              {item.aspect}: {item.description}
            </li>
          ))}
        </ul>
        <ResponsiveContainer width="100%" height={300} style={{ marginTop: '20px' }}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>
      <PageInsights section="family-governance-framework" />
    </div>
  );
}
