// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Lock, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Users, Target, Percent, ArrowRight, Building2, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function PrivatePlacement() {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState('506b');

  const regDData = useMemo(() => [
    { name: '506(b)', Limit: 'Unlimited investors, no general solicitation', Verification: 'Self-certification' },
    { name: '506(c)', Limit: 'Unlimited investors, with general solicitation', Verification: 'Verified accredited investors' },
  ], []);

  const growthData = useMemo(() => [
    { year: 1, PPLI: 100000, Taxable: 95000 },
    { year: 2, PPLI: 110000, Taxable: 102500 },
    { year: 3, PPLI: 121000, Taxable: 110000 },
    { year: 4, PPLI: 133100, Taxable: 118000 },
    { year: 5, PPLI: 146410, Taxable: 126500 },
    { year: 6, PPLI: 161051, Taxable: 135500 },
    { year: 7, PPLI: 177156, Taxable: 145500 },
    { year: 8, PPLI: 194872, Taxable: 156000 },
    { year: 9, PPLI: 214359, Taxable: 167500 },
    { year: 10, PPLI: 235795, Taxable: 179500 },
  ], []);

  const feeData = useMemo(() => [
    { name: 'Management Fees', PPLI: 1.5, Taxable: 2.0 },
    { name: 'Transaction Fees', PPLI: 0.5, Taxable: 1.0 },
    { name: 'Administrative Fees', PPLI: 0.8, Taxable: 1.5 },
  ], []);

  const pieData = useMemo(() => [
    { name: 'PPLI Fees', value: 45 },
    { name: 'Taxable Fees', value: 55 },
  ], []);

  const COLORS = ['#FFD700', '#001f3f'];  // Gold and Navy

  return (
    <div style={{ backgroundColor: '#001f3f', color: '#FFD700', padding: '20px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', borderBottom: '2px solid #FFD700' }}>Private Placement Overview</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FFD700' }}>Reg D 506(b) vs 506(c) Comparison</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ width: '45%' }}>
            <button onClick={() => setSelectedComparison('506b')} style={{ backgroundColor: selectedComparison === '506b' ? '#FFD700' : '#001f3f', color: selectedComparison === '506b' ? '#001f3f' : '#FFD700', padding: '10px', marginBottom: '10px' }}>
              <Lock size={20} /> 506(b)
            </button>
            <p>Regulation D 506(b) allows for up to 35 non-accredited investors with no general solicitation. It's ideal for relationships built on trust.</p>
            <ul style={{ listStyle: 'none' }}>
              <li><TrendingUp size={18} /> Key Benefit: Private offerings without public advertising.</li>
              <li><AlertTriangle size={18} /> Risk: Stricter investor limits.</li>
            </ul>
          </div>
          <div style={{ width: '45%' }}>
            <button onClick={() => setSelectedComparison('506c')} style={{ backgroundColor: selectedComparison === '506c' ? '#FFD700' : '#001f3f', color: selectedComparison === '506c' ? '#001f3f' : '#FFD700', padding: '10px', marginBottom: '10px' }}>
              <Lock size={20} /> 506(c)
            </button>
            <p>Regulation D 506(c) permits general solicitation but requires all investors to be verified as accredited. This opens broader marketing channels.</p>
            <ul style={{ listStyle: 'none' }}>
              <li><TrendingUp size={18} /> Key Benefit: Unlimited accredited investors with advertising.</li>
              <li><AlertTriangle size={18} /> Risk: Mandatory verification processes.</li>
            </ul>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={regDData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Limit" fill="#FFD700" />
            <Bar dataKey="Verification" fill="#001f3f" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FFD700' }}>Accredited Investor Verification</h2>
        <p>Verification ensures investors meet SEC criteria, such as net worth over $1 million or income above $200,000 annually.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ margin: '10px', padding: '20px', backgroundColor: '#001f3f', border: '1px solid #FFD700', width: '30%' }}>
            <Shield size={30} />
            <h3>Self-Certification</h3>
            <p>For 506(b), investors can self-certify, but it's less rigorous.</p>
          </div>
          <div style={{ margin: '10px', padding: '20px', backgroundColor: '#001f3f', border: '1px solid #FFD700', width: '30%' }}>
            <CheckCircle2 size={30} />
            <h3>Third-Party Verification</h3>
            <p>In 506(c), use services like accountants for proof.</p>
          </div>
          <div style={{ margin: '10px', padding: '20px', backgroundColor: '#001f3f', border: '1px solid #FFD700', width: '30%' }}>
            <Users size={30} />
            <h3>Investor Types</h3>
            <p>Includes institutions and high-net-worth individuals.</p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FFD700' }}>Private Placement Life Insurance (PPLI) Structure</h2>
        <p>PPLI combines life insurance with investment opportunities, allowing tax-deferred growth within an insurance wrapper.</p>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '50%' }}>
            <ul style={{ listStyle: 'none' }}>
              <li><Building2 size={18} /> Core Components: Premiums, death benefit, and sub-accounts.</li>
              <li><ArrowRight size={18} /> Benefits: Tax advantages and privacy.</li>
              <li><FileText size={18} /> Documentation: Requires detailed policy illustrations.</li>
            </ul>
          </div>
          <div style={{ width: '50%' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#FFD700" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FFD700' }}>Investment Diversification Test</h2>
        <p>Under IRC 7702, PPLI must pass the diversification test: no more than 55% in certain assets and 20% in issuer securities.</p>
        <ul style={{ listStyle: 'none' }}>
          <li><Target size={18} /> Requirement: Assets must be diversified to qualify as life insurance.</li>
          <li><Percent size={18} /> Calculation: Based on fair market value annually.</li>
          <li><AlertTriangle size={18} /> Non-Compliance: Could lead to loss of tax benefits.</li>
        </ul>
        <p>Detailed breakdown: For a portfolio, ensure no single investment exceeds guidelines.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FFD700' }}>10-Year Tax-Free Growth Comparison</h2>
        <p>Compare PPLI tax-free growth vs. taxable accounts over 10 years.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={growthData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="PPLI" stroke="#FFD700" fill="#FFD700" fillOpacity={0.3} />
            <Area type="monotone" dataKey="Taxable" stroke="#001f3f" fill="#001f3f" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
        <p>Analysis: PPLI shows compound growth without taxes, outperforming taxable accounts by an average of 10% annually.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#FFD700' }}>Fee Structure Analysis</h2>
        <p>Fees in PPLI are generally lower than taxable investments, enhancing net returns.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={feeData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="PPLI" fill="#FFD700" />
            <Bar dataKey="Taxable" fill="#001f3f" />
          </BarChart>
        </ResponsiveContainer>
        <ul style={{ listStyle: 'none' }}>
          <li><DollarSign size={18} /> PPLI Fees: Typically 1-2% annually.</li>
          <li><DollarSign size={18} /> Taxable Fees: Higher due to transaction costs.</li>
          <li><TrendingUp size={18} /> Savings: Reduces overall expense ratio by 0.5-1%.</li>
        </ul>
      </section>

      <section>
        <h2 style={{ color: '#FFD700' }}>Compliance Overview</h2>
        <p>Ensure adherence to key regulations for private placements.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ margin: '10px', width: '30%' }}>
            <Shield size={30} />
            <h3>SEC Regulation D</h3>
            <p>Rules 506(b) and 506(c) exempt offerings from public registration.</p>
          </div>
          <div style={{ margin: '10px', width: '30%' }}>
            <FileText size={30} />
            <h3>IRC 7702 Definition</h3>
            <p>Defines life insurance contracts, requiring mortality and diversification tests.</p>
          </div>
          <div style={{ margin: '10px', width: '30%' }}>
            <CheckCircle2 size={30} />
            <h3>Investor Suitability</h3>
            <p>Investors must be accredited and understand risks, per FINRA rules.</p>
          </div>
        </div>
        <p>Additional Notes: Regular audits and documentation are essential to maintain compliance and avoid penalties.</p>
      </section>
      
      <footer style={{ textAlign: 'center', marginTop: '40px', borderTop: '1px solid #FFD700' }}>
        <p>Powered by secure private placement strategies. Always consult a financial advisor.</p>
      </footer>
      <PageInsights section="private-placement" />
    </div>
  );
}
