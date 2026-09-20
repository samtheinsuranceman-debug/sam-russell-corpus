// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Presentation, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, FileText, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const sampleClientData = {
  name: 'John Doe',
  age: 45,
  netWorth: 500000,
  retirementGoal: 2000000,
  investmentAllocation: { stocks: 60, bonds: 30, cash: 10 },
  insuranceCoverage: { life: 1000000, health: true },
  taxBracket: 25,
  estateValue: 750000,
};

function ClientPresentationBuilder() {
  const [client, setClient] = useState(sampleClientData);
  const wealthProjectionData = useMemo(() => [
    { year: 2023, wealth: 500000 },
    { year: 2025, wealth: 600000 },
    { year: 2030, wealth: 800000 },
    { year: 2035, wealth: 1200000 },
    { year: 2040, wealth: 1800000 },
    { year: 2045, wealth: 2500000 },
    { year: 2050, wealth: 3500000 },
    { year: 2055, wealth: 4500000 },
    { year: 2060, wealth: 5500000 },
    { year: 2070, wealth: 7500000 },
    { year: 2080, wealth: 10000000 },
  ], []);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c'];

  return (
    <div style={{ backgroundColor: '#001f3f', color: '#c0c0c0', padding: '40px', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Presentation size={48} color="#c0c0c0" />
        <h1 style={{ color: '#c0c0c0', marginTop: '10px' }}>Automated Client Presentation and Report Builder</h1>
        <p style={{ color: '#a9a9a9' }}>For Financial Advisors - Dark Theme with Navy/Silver Accents</p>
      </header>

      {/* Client Profile Summary Generator */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><Users size={24} color="#c0c0c0" /> Client Profile Summary</h2>
        <p>Overview of {client.name}, aged {client.age}. Current net worth: ${client.netWorth.toLocaleString()}. Retirement goal: ${client.retirementGoal.toLocaleString()}.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
          <div style={{ backgroundColor: '#003366', padding: '15px', borderRadius: '8px', flex: '1 1 200px' }}>
            <DollarSign size={20} color="#c0c0c0" />
            <p><strong>Net Worth:</strong> ${client.netWorth.toLocaleString()}</p>
          </div>
          <div style={{ backgroundColor: '#003366', padding: '15px', borderRadius: '8px', flex: '1 1 200px' }}>
            <TrendingUp size={20} color="#c0c0c0" />
            <p><strong>Investment Allocation:</strong> Stocks: {client.investmentAllocation.stocks}%, Bonds: {client.investmentAllocation.bonds}%</p>
          </div>
          <div style={{ backgroundColor: '#003366', padding: '15px', borderRadius: '8px', flex: '1 1 200px' }}>
            <Target size={20} color="#c0c0c0" />
            <p><strong>Retirement Goal:</strong> Achievable by 2050 with current projections.</p>
          </div>
        </div>
      </section>

      {/* Net Worth Statement Builder */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><DollarSign size={24} color="#c0c0c0" /> Net Worth Statement</h2>
        <p>Breakdown of assets and liabilities for {client.name} as of 2023.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{ name: 'Assets', value: client.netWorth }, { name: 'Liabilities', value: 100000 }]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
        <ul style={{ marginTop: '20px', color: '#a9a9a9' }}>
          <li>Assets: Stocks, Bonds, Real Estate totaling ${client.netWorth.toLocaleString()}</li>
          <li>Liabilities: Loans and debts estimated at $100,000</li>
          <li>Net Worth Growth: Projected 5% annually</li>
        </ul>
      </section>

      {/* Retirement Projection Slide */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><Calendar size={24} color="#c0c0c0" /> Retirement Projection</h2>
        <p>Projected retirement funds for {client.name} based on current savings rate.</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={wealthProjectionData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="wealth" stroke="#82ca9d" fill="#82ca9d" />
          </AreaChart>
        </ResponsiveContainer>
        <p>Target: ${client.retirementGoal.toLocaleString()} by 2050. Current path: On track with 7% annual returns.</p>
      </section>

      {/* Tax Strategy Overview */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><Percent size={24} color="#c0c0c0" /> Tax Strategy Overview</h2>
        <p>Current tax bracket: {client.taxBracket}%. Strategies include tax-loss harvesting and IRA contributions.</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ flex: 1, marginRight: '20px' }}>
            <ResponsiveContainer width="100%" height={300}><PieChart>
              <Pie data={[{ name: 'Federal Taxes', value: 25 }, { name: 'State Taxes', value: 10 }, { name: 'Other', value: 5 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                {[{ name: 'Federal Taxes', value: 25 }, { name: 'State Taxes', value: 10 }, { name: 'Other', value: 5 }].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart></ResponsiveContainer>
          </div>
          <div style={{ flex: 1 }}>
            <ul style={{ color: '#a9a9a9' }}>
              <li>Strategy 1: Defer taxes with 401(k) contributions.</li>
              <li>Strategy 2: Utilize deductions to reduce taxable income.</li>
              <li>Projected Savings: $50,000 over 5 years.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Estate Plan Summary */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><FileText size={24} color="#c0c0c0" /> Estate Plan Summary</h2>
        <p>Estate value: ${client.estateValue.toLocaleString()}. Includes will, trusts, and beneficiaries.</p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ backgroundColor: '#003366', padding: '15px', borderRadius: '8px', flex: 1 }}>
            <Shield size={20} color="#c0c0c0" />
            <p><strong>Key Elements:</strong> Living Trust, Power of Attorney.</p>
          </div>
          <div style={{ backgroundColor: '#003366', padding: '15px', borderRadius: '8px', flex: 1 }}>
            <ArrowRight size={20} color="#c0c0c0" />
            <p>Recommended Updates: Review beneficiaries annually.</p>
          </div>
        </div>
      </section>

      {/* Insurance Gap Analysis */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><AlertTriangle size={24} color="#c0c0c0" /> Insurance Gap Analysis</h2>
        <p>Current coverage: Life - ${client.insuranceCoverage.life.toLocaleString()}, Health - Covered. Gaps: Disability insurance missing.</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[{ name: 'Life', value: client.insuranceCoverage.life }, { name: 'Health', value: 50000 }]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#ff7300" />
          </BarChart>
        </ResponsiveContainer>
        <p>Action: Secure disability policy to cover income loss.</p>
      </section>

      {/* Investment Allocation Review */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><TrendingUp size={24} color="#c0c0c0" /> Investment Allocation Review</h2>
        <p>Current allocation: Stocks {client.investmentAllocation.stocks}%, Bonds {client.investmentAllocation.bonds}%, Cash {client.investmentAllocation.cash}%.</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={[
              { name: 'Stocks', value: client.investmentAllocation.stocks },
              { name: 'Bonds', value: client.investmentAllocation.bonds },
              { name: 'Cash', value: client.investmentAllocation.cash },
            ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {[
                { name: 'Stocks', value: client.investmentAllocation.stocks },
                { name: 'Bonds', value: client.investmentAllocation.bonds },
                { name: 'Cash', value: client.investmentAllocation.cash },
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* 50-Year Wealth Projection Chart */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><Target size={24} color="#c0c0c0" /> 50-Year Wealth Projection</h2>
        <p>Long-term projection for {client.name} from 2023 to 2073.</p>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={wealthProjectionData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="wealth" fill="#82ca9d" stroke="#82ca9d" />
            <Line type="monotone" dataKey="wealth" stroke="#ffc658" />
          </ComposedChart>
        </ResponsiveContainer>
        <p>Assumptions: 6% annual growth, inflation-adjusted.</p>
      </section>

      {/* Action Item Prioritizer */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><CheckCircle2 size={24} color="#c0c0c0" /> Action Item Prioritizer</h2>
        <ol style={{ color: '#a9a9a9' }}>
          <li>Review insurance gaps by Q2 2024.</li>
          <li>Rebalance portfolio in 6 months.</li>
          <li>Update estate plan annually.</li>
          <li>Consult on tax strategies before tax season.</li>
        </ol>
      </section>

      {/* Fee Disclosure and Value Proposition */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><ArrowRight size={24} color="#c0c0c0" /> Fee Disclosure and Value Proposition</h2>
        <p>Fees: 1% AUM annually. Value: Personalized advice, projections, and ongoing monitoring saving you an average of 15% in taxes.</p>
        <ul style={{ color: '#a9a9a9' }}>
          <li>Our services include comprehensive planning and risk management.</li>
          <li>Value added: Long-term wealth growth strategies.</li>
        </ul>
      </section>

      {/* Compliance Section */}
      <section style={{ padding: '20px', backgroundColor: '#002b4f', borderRadius: '8px' }}>
        <h2 style={{ color: '#c0c0c0' }}><Shield size={24} color="#c0c0c0" /> Compliance Disclosures</h2>
        <p>This presentation complies with SEC ADV Part 2, outlining our business practices and fees.</p>
        <p>FINRA Rule 2210: All communications are fair, balanced, and not misleading.</p>
        <p>CFP Board: We adhere to fiduciary standards, acting in your best interest.</p>
        <p>Additional disclosures: Past performance is not indicative of future results. Consult a professional for advice.</p>
      </section>
      <PageInsights section="client-presentation-builder" />
    </div>
  );
}

export default ClientPresentationBuilder;
