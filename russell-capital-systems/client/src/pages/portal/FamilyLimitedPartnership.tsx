// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Users, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, ArrowRight, Target, Scale, Building2, Award, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart as RechartsAreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const FamilyLimitedPartnership: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [giftAmount, setGiftAmount] = useState(15000); // Annual exclusion amount

  const flpData = useMemo(() => [
    { name: 'General Partner (GP)', value: 10, description: 'Manages the partnership' },
    { name: 'Limited Partners (LP)', value: 90, description: 'Passive investors' },
  ], []);

  const valuationDiscounts = useMemo(() => [
    { type: 'Lack of Control', percentage: 15 },
    { type: 'Lack of Marketability', percentage: 20 },
    { total: 35 }, // Combined discount
  ], []);

  const wealthTransferData = useMemo(() => {
    const years = Array.from({ length: 30 }, (_, i) => i + 1);
    return years.map(year => ({
      year,
      wealth: 1000000 * Math.pow(1.05, year), // Assuming 5% annual growth
      transferred: 15000 * year * 0.65, // After 35% discount
    }));
  }, []);

  const colors = ['#4B0082', '#FFD700']; // Indigo and Gold accents

  const irsRisks = [
    { code: 'IRC 2704', description: 'Restrictions on liquidation disregarded for valuation' },
    { code: 'IRC 2036', description: 'Inclusion of assets in estate if control is retained' },
  ];

  const comparisonData = [
    {
      entity: 'FLP',
      advantages: 'Flexibility in management, valuation discounts',
      disadvantages: 'Complex setup, potential IRS scrutiny',
      icon: <Building2 size={20} color={colors[0]} />,
    },
    {
      entity: 'LLC',
      advantages: 'Liability protection, pass-through taxation',
      disadvantages: 'Less historical precedent for discounts',
      icon: <Shield size={20} color={colors[0]} />,
    },
    {
      entity: 'Trust',
      advantages: 'Asset protection, probate avoidance',
      disadvantages: 'Irrevocable nature, less control',
      icon: <Scale size={20} color={colors[0]} />,
    },
  ];

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#ffffff', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
        <Users size={40} color={colors[1]} />
        <h1 style={{ marginLeft: '10px', color: colors[1], fontSize: '32px' }}>Family Limited Partnership (FLP) for Wealth Transfer</h1>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: colors[1], display: 'flex', alignItems: 'center' }}>
          <DollarSign size={24} color={colors[1]} /> FLP GP/LP Structure
        </h2>
        <p style={{ color: '#e0e0e0' }}>
          A Family Limited Partnership (FLP) consists of a General Partner (GP) who manages the entity and Limited Partners (LPs) who are passive investors. This structure allows for efficient wealth transfer while maintaining control.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={flpData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {flpData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? colors[0] : colors[1]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <ul style={{ color: '#e0e0e0', marginTop: '20px' }}>
          {flpData.map((item, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <ArrowRight size={16} color={colors[1]} /> {item.name}: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: colors[1], display: 'flex', alignItems: 'center' }}>
          <Percent size={24} color={colors[1]} /> Valuation Discount Power
        </h2>
        <p style={{ color: '#e0e0e0' }}>
          FLPs leverage valuation discounts for lack of control and marketability, providing a combined discount of approximately 35%. This reduces the taxable value of gifted or transferred assets.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          {valuationDiscounts.map((discount, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', color: '#e0e0e0' }}>
              {index < 2 ? <TrendingUp size={20} color={colors[0]} /> : <Award size={20} color={colors[1]} />}
              <span style={{ marginLeft: '10px' }}>{discount.type ? `${discount.type}: ${discount.percentage}%` : `Combined: ${discount.total}%`}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: colors[1], display: 'flex', alignItems: 'center' }}>
          <Target size={24} color={colors[1]} /> Multi-Generation Wealth Transfer
        </h2>
        <p style={{ color: '#e0e0e0' }}>
          Visualize wealth growth and transfer over 30 years using an AreaChart. This demonstrates how FLPs can facilitate multi-generational wealth transfer with discounts applied.
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsAreaChart data={wealthTransferData}>
            <XAxis dataKey="year" stroke={colors[1]} />
            <YAxis stroke={colors[1]} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="wealth" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
            <Area type="monotone" dataKey="transferred" stroke={colors[1]} fill={colors[1]} fillOpacity={0.3} />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: colors[1], display: 'flex', alignItems: 'center' }}>
          <CheckCircle2 size={24} color={colors[1]} /> Annual Exclusion Gifting Strategy
        </h2>
        <p style={{ color: '#e0e0e0' }}>
          The annual exclusion allows gifting up to $15,000 per recipient without tax implications. With FLP discounts, you can transfer more effectively.
        </p>
        <div style={{ marginTop: '20px' }}>
          <label style={{ color: '#e0e0e0' }}>Annual Gift Amount: </label>
          <input
            type="number"
            value={giftAmount}
            onChange={(e) => setGiftAmount(Number(e.target.value))}
            style={{ backgroundColor: '#2a2a3e', color: '#ffffff', border: '1px solid #4B0082', padding: '5px' }}
          />
          <p style={{ color: '#e0e0e0', marginTop: '10px' }}>
            After 35% discount: ${ (giftAmount * 0.65).toFixed(2) } per recipient.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: colors[1], display: 'flex', alignItems: 'center' }}>
          <AlertTriangle size={24} color={colors[1]} /> IRS Audit Risks
        </h2>
        <p style={{ color: '#e0e0e0' }}>
          While FLPs are powerful, they carry risks under IRS codes. Key risks include:
        </p>
        <ul style={{ color: '#e0e0e0', marginTop: '20px' }}>
          {irsRisks.map((risk, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <AlertTriangle size={16} color={colors[1]} /> {risk.code}: {risk.description}
            </li>
          ))}
        </ul>
        <p style={{ color: '#e0e0e0', marginTop: '10px' }}>
          To mitigate, ensure the FLP has a legitimate business purpose and follow all guidelines.
        </p>
      </section>

      <section>
        <h2 style={{ color: colors[1], display: 'flex', alignItems: 'center' }}>
          <Scale size={24} color={colors[1]} /> FLP vs LLC vs Trust Comparison
        </h2>
        <div className="overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', color: '#e0e0e0' }}>
          <thead>
            <tr style={{ backgroundColor: '#2a2a3e' }}>
              <th style={{ padding: '10px', border: '1px solid #4B0082' }}>Entity</th>
              <th style={{ padding: '10px', border: '1px solid #4B0082' }}>Advantages</th>
              <th style={{ padding: '10px', border: '1px solid #4B0082' }}>Disadvantages</th>
              <th style={{ padding: '10px', border: '1px solid #4B0082' }}>Icon</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((item, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#1a1a2e' : '#2a2a3e' }}>
                <td style={{ padding: '10px', border: '1px solid #4B0082' }}>{item.entity}</td>
                <td style={{ padding: '10px', border: '1px solid #4B0082' }}>{item.advantages}</td>
                <td style={{ padding: '10px', border: '1px solid #4B0082' }}>{item.disadvantages}</td>
                <td style={{ padding: '10px', border: '1px solid #4B0082' }}>{item.icon}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <footer style={{ marginTop: '40px', textAlign: 'center', color: '#a0a0a0' }}>
        <p>Developed for educational purposes. Consult a financial advisor for real scenarios.</p>
      </footer>
      <PageInsights section="family-limited-partnership" />
    </div>
  );
};

export default FamilyLimitedPartnership;
