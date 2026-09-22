// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Users, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, ArrowRight, Target, Scale, Building2, Award, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const CrossPurchaseAgreement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const partners = 4; // Example for calculations

  const policyCount = useMemo(() => partners * (partners - 1), [partners]);

  const stepUpBasisData = [
    { year: 'Year 1', crossPurchaseSavings: 50000, entityRedemptionCost: 100000 },
    { year: 'Year 2', crossPurchaseSavings: 55000, entityRedemptionCost: 110000 },
    { year: 'Year 3', crossPurchaseSavings: 60000, entityRedemptionCost: 120000 },
    { year: 'Year 4', crossPurchaseSavings: 65000, entityRedemptionCost: 130000 },
    { year: 'Year 5', crossPurchaseSavings: 70000, entityRedemptionCost: 140000 },
  ];

  const ownershipDataBefore = [
    { name: 'Partner A', value: 30 },
    { name: 'Partner B', value: 25 },
    { name: 'Partner C', value: 20 },
    { name: 'Partner D', value: 25 },
  ];

  const ownershipDataAfter = [
    { name: 'Partner A', value: 40 },
    { name: 'Partner B', value: 30 },
    { name: 'Partner C', value: 15 },
    { name: 'Partner D', value: 15 },
  ];

  const COLORS = ['#007bff', '#FFD700', '#4B0082', '#FF4500'];

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#007bff' }}>Cross-Purchase Agreements</h1>
        <p style={{ color: '#FFD700' }}>Exploring the advantages for multi-partner practices</p>
      </header>

      <nav style={{ marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('overview')} style={{ marginRight: '10px', backgroundColor: activeTab === 'overview' ? '#007bff' : '#333', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Overview</button>
        <button onClick={() => setActiveTab('structure')} style={{ marginRight: '10px', backgroundColor: activeTab === 'structure' ? '#007bff' : '#333', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Structure</button>
        <button onClick={() => setActiveTab('tax')} style={{ marginRight: '10px', backgroundColor: activeTab === 'tax' ? '#007bff' : '#333', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Tax Advantages</button>
        <button onClick={() => setActiveTab('insurance')} style={{ marginRight: '10px', backgroundColor: activeTab === 'insurance' ? '#007bff' : '#333', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Insurance Solutions</button>
        <button onClick={() => setActiveTab('costs')} style={{ backgroundColor: activeTab === 'costs' ? '#007bff' : '#333', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Cost Comparison</button>
        <button onClick={() => setActiveTab('compliance')} style={{ backgroundColor: activeTab === 'compliance' ? '#007bff' : '#333', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>IRS Compliance</button>
      </nav>

      {activeTab === 'overview' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>Introduction to Cross-Purchase Agreements</h2>
          <p>In multi-partner practices, a cross-purchase agreement is a vital tool for ensuring smooth business continuity upon a partner's death or departure. Each partner owns life insurance policies on the others, allowing the surviving partners to buy out the deceased partner's share without disrupting operations.</p>
          <p>This structure provides significant advantages, including a step-up in basis for tax purposes and flexible insurance arrangements. Let's dive deeper into the specifics.</p>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
            <Users size={48} color="#007bff" />
            <p style={{ marginLeft: '10px' }}>Ideal for practices with 2-10 partners.</p>
          </div>
        </section>
      )}

      {activeTab === 'structure' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>Cross-Purchase Structure Diagram</h2>
          <p>The cross-purchase agreement involves each partner purchasing and owning life insurance policies on every other partner. For example, with 3 partners (A, B, and C), A owns policies on B and C, B owns on A and C, and C owns on A and B.</p>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <Building2 size={64} color="#FFD700" />
              <p>Partner A</p>
              <ArrowRight size={32} color="#007bff" />
              <Shield size={48} color="#FFD700" /> (Policy on B)
              <ArrowRight size={32} color="#007bff" />
              <Shield size={48} color="#FFD700" /> (Policy on C)
            </div>
            <div style={{ textAlign: 'center' }}>
              <Building2 size={64} color="#FFD700" />
              <p>Partner B</p>
              <ArrowRight size={32} color="#007bff" />
              <Shield size={48} color="#FFD700" /> (Policy on A)
              <ArrowRight size={32} color="#007bff" />
              <Shield size={48} color="#FFD700" /> (Policy on C)
            </div>
            <div style={{ textAlign: 'center' }}>
              <Building2 size={64} color="#FFD700" />
              <p>Partner C</p>
              <ArrowRight size={32} color="#007bff" />
              <Shield size={48} color="#FFD700" /> (Policy on A)
              <ArrowRight size={32} color="#007bff" />
              <Shield size={48} color="#FFD700" /> (Policy on B)
            </div>
          </div>
          <p style={{ marginTop: '20px' }}>Policy Count Formula: For n partners, the total number of policies is n * (n - 1). For {partners} partners, that's {policyCount} policies.</p>
        </section>
      )}

      {activeTab === 'tax' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>Step-Up in Basis Advantage</h2>
          <p>Cross-purchase agreements offer a dramatic tax advantage over entity redemption plans. In a cross-purchase, the basis of the purchased interest steps up to its fair market value under IRC Section 1014, eliminating capital gains tax on appreciation.</p>
          <p>Compared to entity redemption, where the entity buys the shares and no step-up occurs, cross-purchase can save partners significant amounts. For instance, if a partner's share appreciates by $200,000, the tax savings could be over $40,000 at 20% capital gains rate.</p>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
            <TrendingUp size={48} color="#007bff" />
            <p style={{ marginLeft: '10px' }}>Dramatic savings: Up to 50% less tax liability.</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stepUpBasisData}>
              <XAxis dataKey="year" stroke="#FFD700" />
              <YAxis stroke="#FFD700" />
              <Tooltip />
              <Legend />
              <Bar dataKey="crossPurchaseSavings" fill="#007bff" />
              <Bar dataKey="entityRedemptionCost" fill="#FFD700" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {activeTab === 'insurance' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>Insurance Trust Solution for 4+ Partners</h2>
          <p>For practices with 4 or more partners, an insurance trust can simplify administration. The trust holds the policies, ensuring premium allocation is fair and age-adjusted to reflect each partner's risk profile.</p>
          <p>Premium fairness: Older partners may pay more due to higher risk, calculated as (age factor * policy value). This prevents younger partners from subsidizing costs.</p>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
            <Scale size={48} color="#FFD700" />
            <p style={{ marginLeft: '10px' }}>Ensures equitable contributions.</p>
          </div>
        </section>
      )}

      {activeTab === 'costs' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>20-Year Cost Comparison</h2>
          <p>Over 20 years, cross-purchase agreements typically cost less than entity redemption due to efficient premium structures and tax benefits. Below is a comparison based on average premiums and buyout costs.</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stepUpBasisData}>
              <XAxis dataKey="year" stroke="#FFD700" />
              <YAxis stroke="#FFD700" />
              <Tooltip />
              <Area type="monotone" dataKey="crossPurchaseSavings" stroke="#007bff" fill="#007bff" />
              <Area type="monotone" dataKey="entityRedemptionCost" stroke="#FFD700" fill="#FFD700" />
            </AreaChart>
          </ResponsiveContainer>
          <p style={{ marginTop: '20px' }}>As shown, cross-purchase maintains lower cumulative costs over time.</p>
          <h3 style={{ color: '#007bff' }}>PieChart: Ownership Percentages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={ownershipDataBefore} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {ownershipDataBefore.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p>Before Buyout</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={ownershipDataAfter} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {ownershipDataAfter.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p>After Buyout</p>
        </section>
      )}

      {activeTab === 'compliance' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>IRS Compliance</h2>
          <p>Cross-purchase agreements must comply with key IRS sections:</p>
          <ul style={{ color: '#FFD700' }}>
            <li><Lock size={24} color="#007bff" /> IRC Section 1014: Provides step-up in basis for inherited property.</li>
            <li><CheckCircle2 size={24} color="#007bff" /> Section 101(a)(2): Excludes proceeds from income if not a transfer for value.</li>
            <li><AlertTriangle size={24} color="#FFD700" /> Section 302: Governs redemption rules to avoid dividend treatment.</li>
          </ul>
          <p>Ensure agreements are structured with legal counsel to maintain compliance and maximize benefits.</p>
        </section>
      )}

      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#888' }}>
        <p>Developed for educational purposes. Consult a professional for real scenarios.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Target size={24} color="#007bff" />
          <Award size={24} color="#FFD700" style={{ marginLeft: '10px' }} />
        </div>
      </footer>
      <PageInsights section="cross-purchase-agreement" />
    </div>
  );
};

export default CrossPurchaseAgreement;
