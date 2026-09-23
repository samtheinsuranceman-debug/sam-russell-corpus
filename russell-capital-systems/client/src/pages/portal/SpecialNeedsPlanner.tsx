// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Heart, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Users, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";
import { TAX_RULES_2026 } from "@shared/taxRules";

export default function SpecialNeedsPlanner() {
  const [annualContribution, setAnnualContribution] = useState(0);
  const [initialCost, setInitialCost] = useState(0);
  const [inflationRate, setInflationRate] = useState(0);
  const [trustType, setTrustType] = useState('first-party');
  const [ssiAmount, setSsiAmount] = useState(0);
  const [ssdiAmount, setSsdiAmount] = useState(0);

  const projectedCosts = useMemo(() => {
    const projections = [];
    let year = 0;
    let cost = initialCost;
    while (year < 50) {
      projections.push({ year, cost });
      cost *= (1 + inflationRate / 100);
      year++;
    }
    return projections;
  }, [initialCost, inflationRate]);

  const ableAccountData = useMemo(() => {
    const annualLimit = TAX_RULES_2026.annualGiftExclusion; // ABLE contribution limit = annual gift exclusion (IRC §529A(b)(2)(B))
    const ssiLimit = 100000;
    const optimized = Math.min(annualContribution, annualLimit);
    const totalWithSsi = Math.min(optimized + ssiAmount, ssiLimit);
    return { optimized, totalWithSsi };
  }, [annualContribution, ssiAmount]);

  const trustTypes = [
    { type: 'first-party', description: 'Funded with the beneficiary\'s own assets, compliant with 42 USC 1396p(d)(4) SNT.' },
    { type: 'third-party', description: 'Funded by someone else for the beneficiary.' },
    { type: 'pooled', description: 'Managed by a nonprofit, per SSA POMS SI 01120.200 trusts.' },
  ];

  const COLORS = ['#6c5ce7', '#00b4d8', '#ff7675', '#74b9ff', '#ffeaa7'];

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#ffffff', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#6c5ce7', textAlign: 'center' }}>Special Needs Planner</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Heart size={24} /> Special Needs Trust Types</h2>
        <p>Explore trust options for compliance with 42 USC 1396p(d)(4) SNT and SSA POMS SI 01120.200 trusts.</p>
        <select onChange={(e) => setTrustType(e.target.value)} style={{ backgroundColor: '#2e2e3e', color: '#fff', padding: '10px', border: '1px solid #6c5ce7' }}>
          {trustTypes.map((trust) => (
            <option key={trust.type} value={trust.type}>{trust.type} - {trust.description}</option>
          ))}
        </select>
        <p>Selected: {trustType} Trust</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><DollarSign size={24} /> ABLE Account Optimizer</h2>
        <p>Optimize contributions (annual limit: {`$${TAX_RULES_2026.annualGiftExclusion.toLocaleString()}`} in {TAX_RULES_2026.taxYear}, equal to the annual gift exclusion; SSI limit: $100K) per IRC 529A ABLE. Source: IRS Rev. Proc. 2025-32.</p>
        <input 
          type="number" 
          placeholder="Annual Contribution" 
          onChange={(e) => setAnnualContribution(Number(e.target.value))} 
          style={{ backgroundColor: '#2e2e3e', color: '#fff', padding: '10px', margin: '10px 0' }}
        />
        <p>Optimized Contribution: ${ableAccountData.optimized}</p>
        <input 
          type="number" 
          placeholder="SSI Amount" 
          onChange={(e) => setSsiAmount(Number(e.target.value))} 
          style={{ backgroundColor: '#2e2e3e', color: '#fff', padding: '10px', margin: '10px 0' }}
        />
        <p>Total with SSI Limit: ${ableAccountData.totalWithSsi} (up to $100K)</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Shield size={24} /> SSI/SSDI Benefit Preservation Strategies</h2>
        <p>Strategies to preserve benefits under Omnibus Budget Reconciliation Act 1993 and section 2642(c) GST annual exclusion.</p>
        <input 
          type="number" 
          placeholder="SSI Amount" 
          onChange={(e) => setSsiAmount(Number(e.target.value))} 
          style={{ backgroundColor: '#2e2e3e', color: '#fff', padding: '10px', margin: '10px 0' }}
        />
        <input 
          type="number" 
          placeholder="SSDI Amount" 
          onChange={(e) => setSsdiAmount(Number(e.target.value))} 
          style={{ backgroundColor: '#2e2e3e', color: '#fff', padding: '10px', margin: '10px 0' }}
        />
        <p>Preservation Strategy: Coordinate with trusts to avoid exceeding limits.</p>
        <ResponsiveContainer width="100%" height={300}><BarChart data={[{name: 'SSI', value: ssiAmount}, {name: 'SSDI', value: ssdiAmount}]}>
          <Bar dataKey="value" fill="#6c5ce7">
            <Cell key="ssi" fill="#00b4d8" />
            <Cell key="ssdi" fill="#ff7675" />
          </Bar>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
        </BarChart></ResponsiveContainer>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Lock size={24} /> Medicaid Eligibility Protection</h2>
        <p>Protect eligibility per 42 USC 1396p(d)(4) SNT. Use trusts and ABLE accounts for asset shielding.</p>
        <p>Current Strategy: Asset limits coordinated with government benefits.</p>
        <ResponsiveContainer width="100%" height={400}><PieChart>
          <Pie data={[{name: 'Protected', value: 70}, {name: 'At Risk', value: 30}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#6c5ce7">
            <Cell fill="#00b4d8" />
            <Cell fill="#ff7675" />
          </Pie>
          <Tooltip />
        </PieChart></ResponsiveContainer>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Users size={24} /> Letter of Intent Generator</h2>
        <p>Generate a letter outlining care preferences.</p>
        <textarea placeholder="Enter care details" style={{ backgroundColor: '#2e2e3e', color: '#fff', width: '100%', height: '100px', padding: '10px' }}></textarea>
        <button style={{ backgroundColor: '#6c5ce7', color: '#fff', padding: '10px 20px', border: 'none', marginTop: '10px' }}>Generate Letter</button>
        <p>Output: [Generated letter based on input]</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><CheckCircle2 size={24} /> Trustee Selection Guide</h2>
        <p>Guide for selecting trustees under SSA guidelines. Steps: 1. Evaluate experience. 2. Ensure compliance. 3. Check for conflicts.</p>
        <ul style={{ listStyle: 'none' }}>
          <li><ArrowRight size={18} /> Step 1: Assess financial knowledge.</li>
          <li><ArrowRight size={18} /> Step 2: Verify with 42 USC standards.</li>
          <li><ArrowRight size={18} /> Step 3: Select and document.</li>
        </ul>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><TrendingUp size={24} /> 50-Year Care Cost Projection</h2>
        <p>Project costs with inflation, per Omnibus Budget Reconciliation Act 1993.</p>
        <input 
          type="number" 
          placeholder="Initial Cost" 
          onChange={(e) => setInitialCost(Number(e.target.value))} 
          style={{ backgroundColor: '#2e2e3e', color: '#fff', padding: '10px', margin: '10px 0' }}
        />
        <input 
          type="number" 
          placeholder="Inflation Rate (%)" 
          onChange={(e) => setInflationRate(Number(e.target.value))} 
          style={{ backgroundColor: '#2e2e3e', color: '#fff', padding: '10px', margin: '10px 0' }}
        />
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={projectedCosts}>
            <Area type="monotone" dataKey="cost" stroke="#00b4d8" fill="#6c5ce7" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Target size={24} /> Government Benefit Coordination</h2>
        <p>Coordinate SSI, SSDI, Medicaid, and trusts. Ensure compliance with IRC 529A and section 2642(c).</p>
        <p>Current Coordination: Benefits preserved through trust structures.</p>
        <ResponsiveContainer width="100%" height={300}><BarChart data={[{name: 'SSI', value: ssiAmount}, {name: 'SSDI', value: ssdiAmount}, {name: 'Medicaid', value: 5000}]}>
          <Bar dataKey="value" fill="#6c5ce7">
            <Cell fill="#00b4d8" />
            <Cell fill="#ff7675" />
            <Cell fill="#74b9ff" />
          </Bar>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
        </BarChart></ResponsiveContainer>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><AlertTriangle size={24} /> Compliance Overview</h2>
        <p>Key laws: 42 USC 1396p(d)(4) SNT, IRC 529A ABLE, section 2642(c) GST, SSA POMS SI 01120.200, Omnibus Budget Reconciliation Act 1993.</p>
        <ul style={{ listStyle: 'none' }}>
          <li><Percent size={18} /> 42 USC: Special Needs Trusts</li>
          <li><Calendar size={18} /> IRC 529A: ABLE Accounts</li>
          <li><Lock size={18} /> Section 2642(c): GST Exclusion</li>
          <li><Shield size={18} /> SSA POMS: Trust Guidelines</li>
          <li><Users size={18} /> Omnibus Act: Benefit Rules</li>
        </ul>
      </section>
      
      <footer style={{ textAlign: 'center', color: '#6c5ce7' }}>
        <p>Powered by comprehensive planning tools. All projections are estimates.</p>
      </footer>
      <PageInsights section="special-needs-planner" />
    </div>
  );
}
