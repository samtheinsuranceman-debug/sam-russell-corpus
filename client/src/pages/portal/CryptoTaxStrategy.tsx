// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Scale, Zap, Percent, ArrowRight, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart as RechartsAreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function CryptoTaxStrategy() {
  const [selectedLotMethod, setSelectedLotMethod] = useState('FIFO');
  const [showDetails, setShowDetails] = useState(false);
  const [stakingIncome, setStakingIncome] = useState(0);
  const [miningIncome, setMiningIncome] = useState(0);
  const [washSaleEnabled, setWashSaleEnabled] = useState(false);

  const projectionData = useMemo(() => [
    { year: 2024, value: 10000 },
    { year: 2025, value: 15000 },
    { year: 2026, value: 20000 },
    { year: 2027, value: 25000 },
    { year: 2028, value: 30000 },
    { year: 2029, value: 35000 },
    { year: 2030, value: 40000 },
    { year: 2031, value: 45000 },
    { year: 2032, value: 50000 },
    { year: 2033, value: 55000 },
    { year: 2034, value: 60000 },
  ], []);

  const incomeBreakdownData = useMemo(() => [
    { name: 'Staking', value: 3000 },
    { name: 'Mining', value: 2000 },
    { name: 'DeFi', value: 1500 },
    { name: 'NFT Sales', value: 2500 },
  ], []);

  const taxCategoryData = useMemo(() => [
    { name: 'Short-term', value: 4000, color: '#ffa500' },
    { name: 'Long-term', value: 6000, color: '#8a2be2' },
    { name: 'Exempt', value: 1000, color: '#ff4500' },
  ], []);

  const COLORS = ['#ffa500', '#8a2be2', '#ff4500', '#FFD700', '#9370DB'];

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#ffffff', padding: '40px', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ color: '#ffa500', fontSize: '32px', marginBottom: '20px' }}><DollarSign size={32} /> Crypto Tax Strategy Guide</h1>
      <p style={{ color: '#ccc' }}>This comprehensive guide covers key aspects of crypto taxation, including classifications, methods, and projections. All content is designed for a dark theme with orange and purple accents for better visibility.</p>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffa500', fontSize: '24px' }}><Shield size={24} /> Crypto Tax Classification (Property)</h2>
        <p>Cryptocurrencies are treated as property by the IRS, meaning every transaction could result in a taxable event. This includes buying, selling, or even exchanging one crypto for another. Key implications include capital gains taxes based on your cost basis.</p>
        <p>Under IRS guidelines, you must track the fair market value at the time of acquisition. This classification affects how you report on Form 8949. Always maintain detailed records to avoid penalties.</p>
        <ul style={{ color: '#ccc', marginLeft: '20px' }}>
          <li><CheckCircle2 size={16} /> Advantages: Allows for potential deductions if the asset depreciates.</li>
          <li><AlertTriangle size={16} /> Risks: Every trade is a taxable event, leading to complex reporting.</li>
        </ul>
        <button onClick={() => setShowDetails(!showDetails)} style={{ backgroundColor: '#8a2be2', color: '#fff', border: 'none', padding: '10px', marginTop: '10px' }}>
          {showDetails ? 'Hide Details' : 'Show More'}
        </button>
        {showDetails && (
          <div style={{ marginTop: '10px', backgroundColor: '#2a2a3e', padding: '20px', borderRadius: '8px' }}>
            <p>Detailed breakdown: When crypto is classified as property, it falls under Section 1031 like-kind exchanges, but recent rules have limited this. Ensure compliance with IRS Notice 2014-21 for virtual currency transactions.</p>
          </div>
        )}
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffa500', fontSize: '24px' }}><Scale size={24} /> FIFO vs LIFO Lot Selection</h2>
        <p>First-In-First-Out (FIFO) and Last-In-First-Out (LIFO) are methods for determining which lots of crypto are sold first. FIFO assumes you sell the oldest assets, while LIFO assumes the newest.</p>
        <p>Select your method: 
          <button onClick={() => setSelectedLotMethod('FIFO')} style={{ backgroundColor: selectedLotMethod === 'FIFO' ? '#8a2be2' : '#333', color: '#fff', margin: '5px', padding: '8px' }}>
            FIFO
          </button>
          <button onClick={() => setSelectedLotMethod('LIFO')} style={{ backgroundColor: selectedLotMethod === 'LIFO' ? '#8a2be2' : '#333', color: '#fff', margin: '5px', padding: '8px' }}>
            LIFO
          </button>
        </p>
        <p>Current selection: {selectedLotMethod}. FIFO is often preferred for long-term holdings to minimize taxes, but LIFO can be beneficial in rising markets.</p>
        <p>IRS requires consistent application; switching methods may need approval. Use this for tax optimization strategies.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffa500', fontSize: '24px' }}><Zap size={24} /> Staking and DeFi Income</h2>
        <p>Staking rewards and DeFi yields are treated as ordinary income. For example, enter your estimated staking income: 
          <input type="number" value={stakingIncome} onChange={(e) => setStakingIncome(Number(e.target.value))} style={{ backgroundColor: '#333', color: '#fff', margin: '5px', padding: '5px' }} />
        </p>
        <p>This income is taxable at your ordinary income rate. DeFi activities, like liquidity providing, may also incur taxes on rewards. Track all transactions to report accurately on Schedule 1.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeBreakdownData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ffa500" />
          </BarChart>
        </ResponsiveContainer>
        <p>Visual above shows a breakdown of potential income sources, highlighting staking as a key component.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffa500', fontSize: '24px' }}><TrendingUp size={24} /> NFT Tax Considerations</h2>
        <p>NFTs are also classified as property, so sales are subject to capital gains tax. If you hold an NFT for over a year, it qualifies for long-term rates. Be cautious of wash sales.</p>
        <p>Key points: 
          <ul style={{ color: '#ccc', marginLeft: '20px' }}>
            <li><CheckCircle2 size={16} /> Report NFT sales on Form 8949.</li>
            <li><AlertTriangle size={16} /> Airdrops and giveaways are taxable events.</li>
            <li><ArrowRight size={16} /> Use tools to track basis and gains.</li>
          </ul>
        </p>
        <p>For compliance, align with IRS guidelines to avoid audits.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffa500', fontSize: '24px' }}><AlertTriangle size={24} /> Wash Sale Exemption</h2>
        <p>Wash sales are not applicable to cryptocurrencies as they are not securities. However, you can enable tracking for personal strategy: 
          <button onClick={() => setWashSaleEnabled(!washSaleEnabled)} style={{ backgroundColor: washSaleEnabled ? '#8a2be2' : '#333', color: '#fff', margin: '5px', padding: '8px' }}>
            {washSaleEnabled ? 'Enabled' : 'Disable'}
          </button>
        </p>
        <p>If enabled, monitor for potential losses that could be disallowed. This is crucial for optimizing your tax position.</p>
        <p>Exemption means you can claim losses without the 30-day rule, but always consult a tax professional.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffa500', fontSize: '24px' }}><Percent size={24} /> Mining Income Taxation</h2>
        <p>Mining rewards are taxable as ordinary income at the time of receipt. Enter your estimated mining income: 
          <input type="number" value={miningIncome} onChange={(e) => setMiningIncome(Number(e.target.value))} style={{ backgroundColor: '#333', color: '#fff', margin: '5px', padding: '5px' }} />
        </p>
        <p>This includes both proof-of-work and proof-of-stake rewards. Report on Schedule 1 and calculate your cost basis for future sales.</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={taxCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {taxCategoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <p>The pie chart illustrates tax categories, with mining often falling into ordinary income.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffa500', fontSize: '24px' }}><Target size={24} /> 10-Year Projection</h2>
        <p>Use this AreaChart for a 10-year tax projection based on current trends. Assumptions include 10% annual growth.</p>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsAreaChart data={projectionData}>
            <Area type="monotone" dataKey="value" stroke="#ff4500" fill="#8a2be2" fillOpacity={0.6} />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
          </RechartsAreaChart>
        </ResponsiveContainer>
        <p>This projection helps in planning for future tax liabilities, incorporating factors like inflation and market volatility.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffa500', fontSize: '24px' }}><Calendar size={24} /> Compliance and Reporting</h2>
        <p>Ensure compliance with IRS Notice 2014-21, which outlines virtual currency taxation. Use Form 8949 for reporting sales and exchanges.</p>
        <p>Key forms:
          <ul style={{ color: '#ccc', marginLeft: '20px' }}>
            <li><BarChart3 size={16} /> Form 8949: For detailing transactions.</li>
            <li><CheckCircle2 size={16} /> Schedule D: For summarizing gains and losses.</li>
            <li><AlertTriangle size={16} /> Form 1040: For overall tax return.</li>
          </ul>
        </p>
        <p>Additional tips: Keep records for at least 7 years, use tax software for accuracy, and consider consulting a specialist for complex scenarios.</p>
      </section>

      <footer style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
        <p>Disclaimer: This is not professional advice. Always verify with official sources.</p>
      </footer>
      <PageInsights section="crypto-tax-strategy" />
    </div>
  );
}
