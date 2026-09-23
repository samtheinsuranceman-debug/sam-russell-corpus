// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { GraduationCap, DollarSign, TrendingUp, Shield, CheckCircle2, Calendar, Target, Users, BookOpen, Percent, ArrowRight, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";

export default function Education529Planner() {
  const [annualContribution, setAnnualContribution] = useState(5000);
  const [currentCollegeCost, setCurrentCollegeCost] = useState(100000);
  const [yearsToCollege, setYearsToCollege] = useState(18);
  const [state, setState] = useState('California');
  const [superfundAmount, setSuperfundAmount] = useState(90000);
  const [inflationRate, setInflationRate] = useState(5.8);
  // The platform's own college-cost estimate (macro household layer): today's four-year
  // public in-state package and the forty-year tuition growth rate, both sourced and dated.
  // Replaces the $100,000 / 5.8 % placeholders on one click; never overrides an edit silently.
  const [platformSchool, setPlatformSchool] = useState('public-in-state');
  const platformEstimate = trpc.macro.collegeCost.useQuery({ childAge: 18, school: platformSchool });
  const usePlatformEstimate = () => {
    if (!platformEstimate.data) return;
    setCurrentCollegeCost(Math.round(platformEstimate.data.todayPackage));
    setInflationRate(platformEstimate.data.input.tuitionGrowthPct);
  };

  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const stateTaxDeductions = {
    Alabama: 5000,
    Alaska: 0,
    Arizona: 2000,
    Arkansas: 5000,
    California: 0,
    Colorado: 20000,
    Connecticut: 5000,
    Delaware: 0,
    Florida: 0,
    Georgia: 2000,
    Hawaii: 0,
    Idaho: 6000,
    Illinois: 10000,
    Indiana: 1500,
    Iowa: 0,
    Kansas: 3000,
    Kentucky: 0,
    Louisiana: 2000,
    Maine: 0,
    Maryland: 5000,
    Massachusetts: 0,
    Michigan: 5000,
    Minnesota: 1500,
    Mississippi: 10000,
    Missouri: 8000,
    Montana: 3000,
    Nebraska: 5000,
    Nevada: 0,
    NewHampshire: 0,
    NewJersey: 0,
    NewMexico: 0,
    NewYork: 5000,
    NorthCarolina: 5500,
    NorthDakota: 0,
    Ohio: 4000,
    Oklahoma: 10000,
    Oregon: 0,
    Pennsylvania: 15000,
    RhodeIsland: 0,
    SouthCarolina: 3500,
    SouthDakota: 0,
    Tennessee: 0,
    Texas: 0,
    Utah: 1800,
    Vermont: 0,
    Virginia: 4000,
    Washington: 0,
    WestVirginia: 2000,
    Wisconsin: 3000,
    Wyoming: 0
  };

  const projectedCollegeCost = useMemo(() => {
    let futureCost = currentCollegeCost;
    for (let i = 1; i <= yearsToCollege; i++) {
      futureCost *= (1 + inflationRate / 100);
    }
    return futureCost.toFixed(2);
  }, [currentCollegeCost, yearsToCollege, inflationRate]);

  const accumulationData = useMemo(() => {
    const data = [];
    let balance = 0;
    const annualReturn = 7; 
    for (let year = 0; year <= 18; year++) {
      if (year > 0) balance = balance * (1 + annualReturn / 100) + annualContribution;
      data.push({ year, balance: balance.toFixed(2) });
    }
    return data;
  }, [annualContribution]);

  const calculateTaxDeduction = (amount) => {
    const deductionLimit = stateTaxDeductions[state.replace(/\s/g, '')] || 0;
    return Math.min(amount, deductionLimit);
  };

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#e0e0e0', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#ff8c00', textAlign: 'center' }}><GraduationCap size={40} color="#00bfff" /> Education 529 Planner</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bfff' }}><BookOpen size={30} color="#ff8c00" /> 529 Plan vs Coverdell ESA vs UTMA Comparison</h2>
        <p>This section compares the key features of 529 plans, Coverdell ESA, and UTMA accounts.</p>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ backgroundColor: '#2c2c3e', padding: '20px', borderRadius: '8px', width: '30%' }}>
            <h3><GraduationCap size={24} color="#00bfff" /> 529 Plan</h3>
            <ul>
              <li>Tax-free growth for qualified education expenses.</li>
              <li>High contribution limits (over $500K per beneficiary).</li>
              <li>State tax deductions available in many states.</li>
              <li>Can be used for K-12, college, and even apprenticeships.</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#2c2c3e', padding: '20px', borderRadius: '8px', width: '30%' }}>
            <h3><Shield size={24} color="#00bfff" /> Coverdell ESA</h3>
            <ul>
              <li>Annual contribution limit of $2,000 per beneficiary.</li>
              <li>Income limits for contributors.</li>
              <li>Must be used by age 30, except for special needs beneficiaries.</li>
              <li>Tax-free withdrawals for education expenses.</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#2c2c3e', padding: '20px', borderRadius: '8px', width: '30%' }}>
            <h3><Users size={24} color="#00bfff" /> UTMA</h3>
            <ul>
              <li>Assets belong to the minor and transfer at age 18-21.</li>
              <li>No contribution limits, but subject to gift tax.</li>
              <li>Can be used for any purpose, not just education.</li>
              <li>Affects financial aid eligibility more than 529 plans.</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bfff' }}><DollarSign size={30} color="#ff8c00" /> State Tax Deduction Calculator</h2>
        <p>Select your state and enter the amount contributed to calculate potential tax deduction.</p>
        <select onChange={(e) => setState(e.target.value)} style={{ padding: '10px', backgroundColor: '#333', color: '#fff', marginBottom: '10px' }}>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="number" placeholder="Annual Contribution" onChange={(e) => setAnnualContribution(Number(e.target.value))} style={{ padding: '10px', backgroundColor: '#333', color: '#fff', marginBottom: '10px' }} />
        <p>Estimated Deduction: ${calculateTaxDeduction(annualContribution)}</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bfff' }}><TrendingUp size={30} color="#ff8c00" /> Superfunding 5-Year Gift Tax Election</h2>
        <p>Under the 5-year rule, you can contribute up to $90,000 per beneficiary in one year without gift tax, spread over 5 years.</p>
        <input type="number" placeholder="Amount per Beneficiary" onChange={(e) => setSuperfundAmount(Number(e.target.value))} style={{ padding: '10px', backgroundColor: '#333', color: '#fff', marginBottom: '10px' }} />
        <p>For $ {superfundAmount}, this is treated as $ { (superfundAmount / 5).toFixed(2) } per year for 5 years.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bfff' }}><ArrowRight size={30} color="#ff8c00" /> Roth IRA Rollover Provision (SECURE 2.0 Act)</h2>
        <p>Starting in 2024, unused 529 funds can be rolled over to a Roth IRA for the beneficiary, subject to limits under SECURE 2.0 Section 126.</p>
        <ul>
          <li>Maximum rollover: $35,000 lifetime per beneficiary.</li>
          <li>Must have been open for 15 years.</li>
          <li>Contributions made in the last 5 years are ineligible.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bfff' }}><Percent size={30} color="#ff8c00" /> College Cost Inflation Projector</h2>
        <p>Project future college costs based on an average inflation rate of 5.8%.</p>
        <input type="number" placeholder="Current College Cost" value={currentCollegeCost} onChange={(e) => setCurrentCollegeCost(Number(e.target.value))} style={{ padding: '10px', backgroundColor: '#333', color: '#fff', marginBottom: '10px' }} />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
          <select value={platformSchool} onChange={(e) => setPlatformSchool(e.target.value)} style={{ padding: '8px', backgroundColor: '#333', color: '#fff' }}>
            <option value="public-in-state">Public, in state</option>
            <option value="public-out-of-state">Public, out of state</option>
            <option value="private-nonprofit">Private nonprofit</option>
          </select>
          <button type="button" onClick={usePlatformEstimate} disabled={!platformEstimate.data} style={{ padding: '8px 12px', backgroundColor: '#b8860b', color: '#000', border: 'none', cursor: 'pointer' }}>
            {platformEstimate.data ? `Use platform estimate: $${Math.round(platformEstimate.data.todayPackage).toLocaleString()} today, ${platformEstimate.data.input.tuitionGrowthPct}%/yr` : 'Loading platform estimate…'}
          </button>
          {platformEstimate.data && platformEstimate.data.unverified.length > 0 && <span style={{ fontSize: '11px', color: '#e0c060' }}>Baselines flagged VERIFY: re-enter from the College Board / Federal Student Aid release on review.</span>}
        </div>
        <input type="number" placeholder="Years to College" onChange={(e) => setYearsToCollege(Number(e.target.value))} style={{ padding: '10px', backgroundColor: '#333', color: '#fff', marginBottom: '10px' }} />
        <input type="number" placeholder="Inflation Rate (%)" onChange={(e) => setInflationRate(Number(e.target.value))} style={{ padding: '10px', backgroundColor: '#333', color: '#fff', marginBottom: '10px' }} />
        <p>Projected Cost in {yearsToCollege} years: ${projectedCollegeCost}</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bfff' }}><Award size={30} color="#ff8c00" /> 18-Year Accumulation Chart</h2>
        <p>This AreaChart shows the projected accumulation of a 529 plan over 18 years with annual contributions.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={accumulationData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="balance" stroke="#ff8c00" fill="#00bfff" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00bfff' }}><Target size={30} color="#ff8c00" /> Beneficiary Change Strategy</h2>
        <p>You can change the beneficiary of a 529 plan to another family member without tax penalties, as long as they are a qualified relative. This allows flexibility if the original beneficiary doesn't use the funds.</p>
        <ul>
          <li>Common strategies: Transfer to siblings or children.</li>
          <li>Ensure compliance with IRC rules to avoid taxes.</li>
        </ul>
      </section>

      <section>
        <h2 style={{ color: '#00bfff' }}><CheckCircle2 size={30} color="#ff8c00" /> Compliance Information</h2>
        <p>Ensure your 529 plan adheres to IRS regulations:</p>
        <ul>
          <li>IRC 529: Governs qualified tuition programs.</li>
          <li>Section 2503(b): Annual exclusion for gifts up to $18,000 per donor per year.</li>
          <li>SECURE 2.0 Section 126: Allows Roth IRA rollovers with specific conditions.</li>
        </ul>
        <p>For detailed advice, consult a financial advisor.</p>
      </section>
      <PageInsights section="education529-planner" />
    </div>
  );
}
