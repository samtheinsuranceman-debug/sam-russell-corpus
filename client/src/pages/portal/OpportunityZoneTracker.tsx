// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { MapPin, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Building2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const OpportunityZoneTracker = () => {
  const [capitalGains, setCapitalGains] = useState(0);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [investmentDate, setInvestmentDate] = useState('');
  const [improvementCost, setImprovementCost] = useState(0);
  const [originalBasis, setOriginalBasis] = useState(0);
  const [workingCapitalAmount, setWorkingCapitalAmount] = useState(0);
  const [expenditurePlan, setExpenditurePlan] = useState('');
  const [holdPeriod, setHoldPeriod] = useState(10);

  const deferralCalculator = useMemo(() => {
    const deferredGains = capitalGains * 0.85; // Example: 15% inclusion
    return deferredGains;
  }, [capitalGains]);

  const basisStepUp = useMemo(() => {
    return originalBasis * Math.pow(1.07, holdPeriod); // Assuming 7% annual growth
  }, [originalBasis, holdPeriod]);

  const qozWealthProjection = useMemo(() => {
    const qozGrowth = 1.08; // 8% growth in QOZ
    const taxableGrowth = 1.06; // 6% in taxable
    let qozValue = investmentAmount;
    let taxableValue = investmentAmount;
    for (let i = 0; i < 50; i++) {
      qozValue *= qozGrowth;
      taxableValue *= taxableGrowth;
      taxableValue *= 0.85; // Taxes reduce it
    }
    return { qozValue, taxableValue };
  }, [investmentAmount]);

  const data = [
    { name: 'Year 1', QOZ: 10000, '1031': 9500 },
    { name: 'Year 2', QOZ: 10800, '1031': 10200 },
    { name: 'Year 3', QOZ: 11664, '1031': 10914 },
    { name: 'Year 4', QOZ: 12587, '1031': 11678 },
    { name: 'Year 5', QOZ: 13595, '1031': 12496 },
  ];

  const improvementData = [
    { month: 0, progress: 0 },
    { month: 10, progress: 30 },
    { month: 20, progress: 60 },
    { month: 30, progress: 100 },
  ];

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#e0e0e0', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#00ff00', textAlign: 'center' }}>Qualified Opportunity Zone Investment Tracker & Optimizer</h1>
      
      {/* QOZ Fund Investment Timeline (180-day window) */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><Calendar size={24} /> QOZ Fund Investment Timeline</h2>
        <p>Track your 180-day window for investing capital gains into a QOZ fund.</p>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input 
            type="date" 
            onChange={(e) => setInvestmentDate(e.target.value)} 
            style={{ marginRight: '10px', padding: '5px', backgroundColor: '#2c2c3e', color: '#e0e0e0', border: '1px solid #a020f0' }}
          />
          <button style={{ backgroundColor: '#00ff00', color: '#1a1a2e', padding: '5px 10px', border: 'none' }}>
            Start 180-Day Timer
          </button>
        </div>
        <p>Days left: {investmentDate ? (180 - Math.floor((new Date().getTime() - new Date(investmentDate).getTime()) / (1000 * 3600 * 24))) : '0'}</p>
      </section>
      
      {/* Capital Gains Deferral Calculator */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><DollarSign size={24} /> Capital Gains Deferral Calculator</h2>
        <input 
          type="number" 
          placeholder="Enter Capital Gains" 
          onChange={(e) => setCapitalGains(parseFloat(e.target.value))} 
          style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#2c2c3e', color: '#e0e0e0', border: '1px solid #00ff00' }}
        />
        <p>Deferred Gains: ${deferralCalculator.toFixed(2)}</p>
      </section>
      
      {/* 10-Year Basis Step-Up to Fair Market Value */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><TrendingUp size={24} /> 10-Year Basis Step-Up</h2>
        <input 
          type="number" 
          placeholder="Original Basis" 
          onChange={(e) => setOriginalBasis(parseFloat(e.target.value))} 
          style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#2c2c3e', color: '#e0e0e0', border: '1px solid #00ff00' }}
        />
        <input 
          type="number" 
          placeholder="Hold Period (years)" 
          onChange={(e) => setHoldPeriod(parseFloat(e.target.value))} 
          style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#2c2c3e', color: '#e0e0e0', border: '1px solid #00ff00' }}
        />
        <p>Step-Up Value: ${basisStepUp.toFixed(2)}</p>
      </section>
      
      {/* QOZ vs 1031 Exchange Comparison */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><ArrowRight size={24} /> QOZ vs 1031 Exchange Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="QOZ" fill="#00ff00" />
            <Line dataKey="1031" stroke="#a020f0" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>
      
      {/* Substantial Improvement Test Tracker (30-month window) */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><Target size={24} /> Substantial Improvement Test Tracker</h2>
        <input 
          type="number" 
          placeholder="Improvement Cost" 
          onChange={(e) => setImprovementCost(parseFloat(e.target.value))} 
          style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#2c2c3e', color: '#e0e0e0', border: '1px solid #00ff00' }}
        />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={improvementData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="progress" stroke="#a020f0" fill="#00ff00" />
          </AreaChart>
        </ResponsiveContainer>
        <p>Months left for 30-month window: 30 - current months</p>
      </section>
      
      {/* Working Capital Safe Harbor Compliance */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><Shield size={24} /> Working Capital Safe Harbor Compliance</h2>
        <input 
          type="number" 
          placeholder="Working Capital Amount" 
          onChange={(e) => setWorkingCapitalAmount(parseFloat(e.target.value))} 
          style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#2c2c3e', color: '#e0e0e0', border: '1px solid #00ff00' }}
        />
        <input 
          type="text" 
          placeholder="Expenditure Plan" 
          onChange={(e) => setExpenditurePlan(e.target.value)} 
          style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#2c2c3e', color: '#e0e0e0', border: '1px solid #00ff00' }}
        />
        <p>Compliance Status: {workingCapitalAmount > 0 && expenditurePlan ? <CheckCircle2 size={24} color="#00ff00" /> : <AlertTriangle size={24} color="#ff0000" />} </p>
      </section>
      
      {/* QOZ Fund Structure (QOZB vs QOZP) */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><Building2 size={24} /> QOZ Fund Structure</h2>
        <p>QOZB: Business in zone. QOZP: Property in zone.</p>
        <ul>
          <li><MapPin size={18} /> QOZB Requirements</li>
          <li><Percent size={18} /> QOZP Benefits</li>
        </ul>
      </section>
      
      {/* 50-Year Wealth Comparison */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><Clock size={24} /> 50-Year Wealth Comparison</h2>
        <input 
          type="number" 
          placeholder="Investment Amount" 
          onChange={(e) => setInvestmentAmount(parseFloat(e.target.value))} 
          style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#2c2c3e', color: '#e0e0e0', border: '1px solid #00ff00' }}
        />
        <p>QOZ Wealth: ${qozWealthProjection.qozValue.toFixed(2)}</p>
        <p>Taxable Wealth: ${qozWealthProjection.taxableValue.toFixed(2)}</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="QOZ" fill="#00ff00" />
            <Bar dataKey="1031" fill="#a020f0" />
          </BarChart>
        </ResponsiveContainer>
      </section>
      
      {/* Annual Compliance Reporting Requirements */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#a020f0' }}><CheckCircle2 size={24} /> Annual Compliance Reporting</h2>
        <ul>
          <li>IRC 1400Z-1 Designation</li>
          <li>Section 1400Z-2 Deferral/Exclusion</li>
          <li>Reg. 1.1400Z2(a)-1</li>
          <li>Section 1400Z-2(d)(1) QOF Requirements</li>
          <li>IRS Form 8996</li>
        </ul>
      </section>
      
      {/* Compliance Details */}
      <section>
        <h2 style={{ color: '#a020f0' }}><Shield size={24} /> Full Compliance Checklist</h2>
        <ol>
          <li>Ensure IRC 1400Z-1 designation is met.</li>
          <li>Verify section 1400Z-2 deferral rules.</li>
          <li>Check Reg. 1.1400Z2(a)-1 for investments.</li>
          <li>Confirm section 1400Z-2(d)(1) QOF standards.</li>
          <li>File IRS Form 8996 annually.</li>
        </ol>
      </section>
      <PageInsights section="opportunity-zone-tracker" />
    </div>
  );
};

export default OpportunityZoneTracker;
