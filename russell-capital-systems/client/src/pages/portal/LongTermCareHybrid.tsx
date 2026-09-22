// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { HeartPulse, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Home, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function LongTermCareHybrid() {
  const [dailyBenefit, setDailyBenefit] = useState(200);
  const [inflationRate, setInflationRate] = useState(3);
  const [eliminationPeriod, setEliminationPeriod] = useState(90);
  const [state, setState] = useState('CA');

  const dataForComparison = useMemo(() => [
    { name: 'Traditional LTC', Premium: 5000, Coverage: 100, Risk: 80 },
    { name: 'Hybrid LTC', Premium: 6000, Coverage: 120, Risk: 40 },
    { name: 'Self-Insure', Premium: 0, Coverage: 50, Risk: 100 },
  ], []);

  const inflationData = useMemo(() => [
    { year: 1, benefit3Percent: dailyBenefit * Math.pow(1.03, 1), benefit5Percent: dailyBenefit * Math.pow(1.05, 1) },
    { year: 5, benefit3Percent: dailyBenefit * Math.pow(1.03, 5), benefit5Percent: dailyBenefit * Math.pow(1.05, 5) },
    { year: 10, benefit3Percent: dailyBenefit * Math.pow(1.03, 10), benefit5Percent: dailyBenefit * Math.pow(1.05, 10) },
    { year: 20, benefit3Percent: dailyBenefit * Math.pow(1.03, 20), benefit5Percent: dailyBenefit * Math.pow(1.05, 20) },
    { year: 30, benefit3Percent: dailyBenefit * Math.pow(1.03, 30), benefit5Percent: dailyBenefit * Math.pow(1.05, 30) },
  ], [dailyBenefit]);

  const costProjectionData = useMemo(() => [
    { state: 'CA', year: 2025, cost: 100000 },
    { state: 'CA', year: 2030, cost: 120000 },
    { state: 'CA', year: 2035, cost: 140000 },
    { state: 'CA', year: 2040, cost: 160000 },
    { state: 'CA', year: 2045, cost: 180000 },
    { state: 'CA', year: 2050, cost: 200000 },
    { state: 'NY', year: 2025, cost: 90000 },
    { state: 'NY', year: 2030, cost: 110000 },
    { state: 'NY', year: 2035, cost: 130000 },
    { state: 'NY', year: 2040, cost: 150000 },
    { state: 'NY', year: 2045, cost: 170000 },
    { state: 'NY', year: 2050, cost: 190000 },
  ], []);

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#ffffff', padding: '20px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#ff66b2', textAlign: 'center' }}>Hybrid Long-Term Care Insurance Analysis and Comparison</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><TrendingUp size={24} /> Traditional LTC vs Hybrid LTC vs Self-Insure Comparison</h2>
        <p>This section compares the three options based on premiums, coverage, and risk factors. Traditional LTC offers pure care benefits but may lapse if premiums aren't paid. Hybrid LTC combines life insurance with LTC benefits for more security, while self-insuring involves personal savings with higher risk.</p>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={dataForComparison}>
              <XAxis dataKey="name" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Premium" fill="#ff66b2" name="Annual Premium" />
              <Bar dataKey="Coverage" fill="#5ee6d4" name="Coverage Level" />
              <Bar dataKey="Risk" fill="#ff4757" name="Risk Exposure" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p>Hybrid LTC often provides better value for those seeking guarantees, as it includes a death benefit if LTC isn't needed.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><Shield size={24} /> Hybrid Policy Structures</h2>
        <p>Hybrid policies come in two main forms: Life/LTC combos and Annuity/LTC combos. A Life/LTC combo links a life insurance policy with LTC riders, ensuring that if LTC isn't used, beneficiaries receive a payout. An Annuity/LTC combo converts annuity payments into LTC benefits, providing income with care options.</p>
        <ul style={{ color: '#ffffff' }}>
          <li><HeartPulse size={18} /> Life/LTC: Premiums build cash value for both life insurance and LTC.</li>
          <li><DollarSign size={18} /> Annuity/LTC: Guaranteed income stream with LTC acceleration.</li>
        </ul>
        <p>These structures offer tax advantages and reduce the risk of outliving your assets.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><ArrowRight size={24} /> 1035 Exchange from Existing Annuity to Hybrid LTC</h2>
        <p>A 1035 exchange allows tax-free transfer of funds from an existing annuity to a hybrid LTC policy under Section 1035 of the IRC. This is ideal for optimizing your portfolio for long-term care needs without immediate tax liabilities.</p>
        <p>Steps: 1. Evaluate current annuity. 2. Compare hybrid options. 3. Execute the exchange with a qualified provider.</p>
        <p><CheckCircle2 size={18} /> Benefits include potential cost savings and enhanced coverage tailored to aging risks.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><Target size={24} /> Daily Benefit Amount Optimizer</h2>
        <p>Optimize your daily benefit based on expected needs. Use the slider to adjust:</p>
        <input
          type="range"
          min="100"
          max="500"
          value={dailyBenefit}
          onChange={(e) => setDailyBenefit(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#ff66b2' }}
        />
        <p>Selected Daily Benefit: ${dailyBenefit}</p>
        <p>This tool helps estimate affordable coverage levels while considering inflation and other factors.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><Percent size={24} /> Inflation Rider Analysis (3% vs 5% Compound)</h2>
        <p>Inflation riders protect against rising care costs. Compare 3% and 5% compounding rates:</p>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={inflationData}>
              <XAxis dataKey="year" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="benefit3Percent" stroke="#ff66b2" name="3% Inflation" />
              <Line type="monotone" dataKey="benefit5Percent" stroke="#5ee6d4" name="5% Inflation" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p>At 5%, benefits grow faster, providing better protection against inflation over time.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><Calendar size={24} /> Elimination Period Impact</h2>
        <p>The elimination period is the waiting time before benefits kick in. Shorter periods (e.g., 90 days) increase premiums, while longer ones reduce costs but heighten personal expense risk.</p>
        <input
          type="range"
          min="30"
          max="180"
          value={eliminationPeriod}
          onChange={(e) => setEliminationPeriod(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#ff66b2' }}
        />
        <p>Selected Elimination Period: {eliminationPeriod} days</p>
        <p>For most, a 90-day period balances cost and coverage effectively.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><Home size={24} /> Shared Care Rider for Couples</h2>
        <p>This rider allows couples to share benefits, ensuring that unused portions from one policy can cover the other. It's crucial for married individuals to avoid duplication and maximize value.</p>
        <p><Lock size={18} /> Example: If one spouse uses benefits, the other can access remaining funds, reducing overall policy costs.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><AlertTriangle size={24} /> 50-Year Cost of Care Projection by State</h2>
        <p>Projections based on state-specific data. Select a state:</p>
        <select onChange={(e) => setState(e.target.value)} style={{ backgroundColor: '#2a2a3e', color: '#ffffff', borderColor: '#5ee6d4' }}>
          <option value="CA">California</option>
          <option value="NY">New York</option>
        </select>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={costProjectionData.filter(d => d.state === state)}>
              <XAxis dataKey="year" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip />
              <Area type="monotone" dataKey="cost" stroke="#ff66b2" fill="#5ee6d4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p>In {state}, costs are expected to rise significantly, emphasizing the need for early planning.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#5ee6d4' }}><Home size={24} /> Medicaid Spend-Down Avoidance</h2>
        <p>Hybrid LTC helps avoid Medicaid spend-down by preserving assets. By using policy benefits, you can protect your estate from qualification requirements.</p>
        <p>Strategies include: Asset protection trusts and strategic gifting, combined with hybrid policies for comprehensive coverage.</p>
      </section>
      
      <section>
        <h2 style={{ color: '#5ee6d4' }}><Shield size={24} /> Compliance Overview</h2>
        <p>Key regulations include IRC 7702B for LTC qualifications, Section 101(g) for accelerated death benefits, Section 1035 for tax-free exchanges, and the Pension Protection Act of 2006 which supports hybrid LTC policies.</p>
        <ul>
          <li><CheckCircle2 size={18} /> IRC 7702B: Ensures policies meet federal standards for tax-qualified status.</li>
          <li><AlertTriangle size={18} /> Section 101(g): Allows tax-free access to death benefits for LTC needs.</li>
          <li><ArrowRight size={18} /> Section 1035: Enables exchanges without tax penalties.</li>
          <li><Shield size={18} /> Pension Protection Act: Promotes hybrid products for better retirement security.</li>
        </ul>
        <p>Always consult a tax advisor to ensure compliance with these rules.</p>
      </section>
      
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#5ee6d4' }}>
        <p>Disclaimer: This is for educational purposes. Consult professionals for personalized advice.</p>
      </footer>
      <PageInsights section="long-term-care-hybrid" />
    </div>
  );
}
