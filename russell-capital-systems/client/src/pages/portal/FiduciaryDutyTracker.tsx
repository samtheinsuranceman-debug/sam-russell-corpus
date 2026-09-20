// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Shield, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, CheckCircle2, AlertTriangle, FileText, Scale, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const FiduciaryDutyTracker = () => {
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, description: 'Disclose material facts about recommendations', completed: false },
    { id: 2, description: 'Exercise reasonable diligence, care, and skill', completed: false },
    { id: 3, description: 'Have a reasonable basis to believe recommendations are in client\'s best interest', completed: false },
    { id: 4, description: 'Identify and address conflicts of interest', completed: false },
    { id: 5, description: 'Establish, maintain, and enforce policies and procedures', completed: false },
  ]);

  const [formCRSRequirements, setFormCRSRequirements] = useState([
    { id: 1, description: 'Relationships and services', status: 'Pending' },
    { id: 2, description: 'Fees, costs, conflicts, and standard of conduct', status: 'In Progress' },
    { id: 3, description: 'Disciplinary history', status: 'Not Started' },
    { id: 4, description: 'Additional information', status: 'Completed' },
  ]);

  const [conflicts, setConflicts] = useState([
    { id: 1, description: 'Compensation from third parties', documented: false },
    { id: 2, description: 'Personal trading in client securities', documented: false },
    { id: 3, description: 'Gifts and entertainment', documented: false },
  ]);

  const [suitabilityData, setSuitabilityData] = useState([
    { factor: 'Standard', suitability: 'Reasonable basis', fiduciary: 'Best interest' },
    { factor: 'Client Knowledge', suitability: 'Assess suitability', fiduciary: 'Duty of care' },
    { factor: 'Conflicts', suitability: 'Disclose if required', fiduciary: 'Mitigate and disclose' },
    { factor: 'Recommendations', suitability: 'Based on investor profile', fiduciary: 'Act in best interest' },
  ]);

  const complianceScoreData = useMemo(() => [
    { name: 'Reg BI', score: 75 },
    { name: 'Form CRS', score: 60 },
    { name: 'Fee Disclosure', score: 85 },
    { name: 'Conflicts', score: 50 },
    { name: 'Suitability', score: 90 },
  ], []);

  const feeDisclosureData = useMemo(() => [
    { name: 'Management Fees', value: 40 },
    { name: 'Transaction Costs', value: 30 },
    { name: 'Performance Fees', value: 20 },
    { name: 'Other', value: 10 },
  ], []);

  const COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#6366f1'];

  const handleChecklistToggle = (id) => {
    setChecklistItems(checklistItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleConflictToggle = (id) => {
    setConflicts(conflicts.map(item => 
      item.id === id ? { ...item, documented: !item.documented } : item
    ));
  };

  const calculateOverallScore = useMemo(() => {
    const totalScore = complianceScoreData.reduce((sum, item) => sum + item.score, 0);
    return (totalScore / complianceScoreData.length).toFixed(2);
  }, [complianceScoreData]);

  return (
    <div style={{ backgroundColor: '#1a202c', color: '#ffffff', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#4F46E5' }}>Fiduciary Duty Tracker</h1>
        <Shield size={32} color="#F59E0B" />
      </header>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#4F46E5', display: 'flex', alignItems: 'center' }}>
          <Target size={24} style={{ marginRight: '10px' }} /> Compliance Score Dashboard
        </h2>
        <p>Overall Compliance Score: <strong>{calculateOverallScore}%</strong></p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={complianceScoreData}>
            <XAxis dataKey="name" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={feeDisclosureData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {feeDisclosureData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={complianceScoreData}>
            <PolarGrid stroke="#ffffff" />
            <PolarAngleAxis dataKey="name" stroke="#ffffff" />
            <Radar name="Score" dataKey="score" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#4F46E5', display: 'flex', alignItems: 'center' }}>
          <CheckCircle2 size={24} style={{ marginRight: '10px' }} /> Reg BI Compliance Checklist
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {checklistItems.map(item => (
            <li key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleChecklistToggle(item.id)}
                style={{ marginRight: '10px' }}
              />
              {item.description} {item.completed ? <CheckCircle2 size={16} color="#10B981" /> : <AlertTriangle size={16} color="#EF4444" />}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#4F46E5', display: 'flex', alignItems: 'center' }}>
          <FileText size={24} style={{ marginRight: '10px' }} /> Form CRS Requirements
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {formCRSRequirements.map(req => (
            <li key={req.id} style={{ marginBottom: '10px', color: req.status === 'Completed' ? '#10B981' : '#EF4444' }}>
              {req.description} - Status: {req.status}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#4F46E5', display: 'flex', alignItems: 'center' }}>
          <DollarSign size={24} style={{ marginRight: '10px' }} /> Fee Disclosure Analysis
        </h2>
        <p>Analyze and visualize fee structures to ensure transparency.</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={feeDisclosureData}>
            <XAxis dataKey="name" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#4F46E5', display: 'flex', alignItems: 'center' }}>
          <AlertTriangle size={24} style={{ marginRight: '10px' }} /> Conflict of Interest Documentation
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {conflicts.map(conflict => (
            <li key={conflict.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={conflict.documented}
                onChange={() => handleConflictToggle(conflict.id)}
                style={{ marginRight: '10px' }}
              />
              {conflict.description} {conflict.documented ? <Lock size={16} color="#10B981" /> : <Scale size={16} color="#EF4444" />}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ color: '#4F46E5', display: 'flex', alignItems: 'center' }}>
          <TrendingUp size={24} style={{ marginRight: '10px' }} /> Suitability vs Fiduciary Comparison
        </h2>
        <div className="overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#2d3748', color: '#ffffff' }}>
              <th style={{ padding: '10px', border: '1px solid #4a5568' }}>Factor</th>
              <th style={{ padding: '10px', border: '1px solid #4a5568' }}>Suitability Standard</th>
              <th style={{ padding: '10px', border: '1px solid #4a5568' }}>Fiduciary Standard</th>
            </tr>
          </thead>
          <tbody>
            {suitabilityData.map((row, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#2d3748' : '#1a202c' }}>
                <td style={{ padding: '10px', border: '1px solid #4a5568' }}>{row.factor}</td>
                <td style={{ padding: '10px', border: '1px solid #4a5568' }}>{row.suitability}</td>
                <td style={{ padding: '10px', border: '1px solid #4a5568' }}>{row.fiduciary}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <footer style={{ marginTop: '40px', textAlign: 'center', color: '#a0aec0' }}>
        <p>Powered by Fiduciary Duty Tracker - Ensure compliance with Reg BI and best practices.</p>
        <ArrowRight size={24} color="#F59E0B" />
      </footer>
      <PageInsights section="fiduciary-duty-tracker" />
    </div>
  );
};

export default FiduciaryDutyTracker;
