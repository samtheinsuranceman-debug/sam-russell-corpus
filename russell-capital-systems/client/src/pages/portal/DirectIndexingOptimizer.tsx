// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { BarChart3, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Filter, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const sampleData = [
  { name: 'Direct Indexing', cost: 0.08, trackingError: 0.5, taxAlpha: 1.2 },
  { name: 'ETF', cost: 0.2, trackingError: 1.0, taxAlpha: 0.5 },
  { name: 'Mutual Fund', cost: 0.5, trackingError: 1.5, taxAlpha: 0.2 },
];

const taxLossData = [
  { month: 'Jan', opportunities: 5, realizedLoss: 1000 },
  { month: 'Feb', opportunities: 3, realizedLoss: 800 },
  { month: 'Mar', opportunities: 4, realizedLoss: 1200 },
  { month: 'Apr', opportunities: 6, realizedLoss: 1500 },
  { month: 'May', opportunities: 2, realizedLoss: 500 },
  { month: 'Jun', opportunities: 7, realizedLoss: 2000 },
  { month: 'Jul', opportunities: 4, realizedLoss: 900 },
  { month: 'Aug', opportunities: 5, realizedLoss: 1100 },
  { month: 'Sep', opportunities: 3, realizedLoss: 700 },
  { month: 'Oct', opportunities: 6, realizedLoss: 1600 },
  { month: 'Nov', opportunities: 4, realizedLoss: 800 },
  { month: 'Dec', opportunities: 5, realizedLoss: 1300 },
];

const esgData = [
  { category: 'Environmental', score: 85 },
  { category: 'Social', score: 78 },
  { category: 'Governance', score: 92 },
];

const trackingErrorData = [
  { year: 2020, error: 0.4 },
  { year: 2021, error: 0.6 },
  { year: 2022, error: 0.3 },
  { year: 2023, error: 0.5 },
  { year: 2024, error: 0.7 },
];

const factorTiltData = [
  { factor: 'Value', weight: 25 },
  { factor: 'Momentum', weight: 20 },
  { factor: 'Quality', weight: 30 },
  { factor: 'Size', weight: 25 },
];

const taxAlphaProjection = [
  { year: 2025, alpha: 1.1 },
  { year: 2030, alpha: 1.5 },
  { year: 2035, alpha: 1.8 },
  { year: 2040, alpha: 2.0 },
  { year: 2045, alpha: 2.2 },
  { year: 2050, alpha: 2.5 },
  { year: 2055, alpha: 2.7 },
  { year: 2060, alpha: 3.0 },
  { year: 2065, alpha: 3.2 },
  { year: 2070, alpha: 3.5 },
  { year: 2075, alpha: 3.7 },
];

const COLORS = ['#00b4d8', '#90ee90', '#ff6b6b', '#f39c12', '#8e44ad'];

export default function DirectIndexingOptimizer() {
  const [selectedStrategy, setSelectedStrategy] = useState('Direct Indexing');
  const [esgFilters, setEsgFilters] = useState({ environmental: true, social: true, governance: true });
  const [factorTilts, setFactorTilts] = useState({ value: 25, momentum: 20, quality: 30, size: 25 });
  const [concentratedStocks, setConcentratedStocks] = useState(['AAPL', 'GOOGL']);
  const [washSaleCompliance, setWashSaleCompliance] = useState(true);

  const memoizedComparisonData = useMemo(() => sampleData.filter(item => item.name === selectedStrategy), [selectedStrategy]);

  const handleFactorChange = (factor, value) => {
    setFactorTilts(prev => ({ ...prev, [factor]: value }));
  };

  const handleEsgToggle = (filter) => {
    setEsgFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  const renderComparisonChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sampleData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="cost" fill="#00b4d8" />
        <Bar dataKey="trackingError" fill="#90ee90" />
        <Bar dataKey="taxAlpha" fill="#ff6b6b" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderTaxLossChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={taxLossData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="opportunities" stroke="#00b4d8" fill="#00b4d8" />
        <Area type="monotone" dataKey="realizedLoss" stroke="#90ee90" fill="#90ee90" />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderEsgPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={esgData} dataKey="score" nameKey="category" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
          {esgData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderTrackingErrorChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={trackingErrorData}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="error" fill="#ff6b6b" />
        <Line type="monotone" dataKey="error" stroke="#00b4d8" />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderFactorTiltChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={Object.entries(factorTilts).map(([factor, weight]) => ({ factor, weight }))}>
        <XAxis dataKey="factor" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="weight" fill="#90ee90" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderTaxAlphaProjectionChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <Line data={taxAlphaProjection} dataKey="alpha" xAxisId={0}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="alpha" stroke="#00b4d8" />
      </Line>
    </ResponsiveContainer>
  );

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#ffffff', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ color: '#00b4d8', textAlign: 'center' }}>Direct Indexing Optimizer</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#90ee90' }}>Direct Indexing vs ETF vs Mutual Fund Comparison</h2>
        <p>Use this section to compare strategies based on cost, tracking error, and tax alpha.</p>
        <select onChange={(e) => setSelectedStrategy(e.target.value)} style={{ backgroundColor: '#2c2c3e', color: '#ffffff', padding: '10px' }}>
          <option value="Direct Indexing">Direct Indexing</option>
          <option value="ETF">ETF</option>
          <option value="Mutual Fund">Mutual Fund</option>
        </select>
        {renderComparisonChart()}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
          <div><TrendingUp size={24} color="#00b4d8" /> Tracking Error: {memoizedComparisonData[0]?.trackingError}%</div>
          <div><DollarSign size={24} color="#90ee90" /> Cost: {memoizedComparisonData[0]?.cost}%</div>
          <div><Percent size={24} color="#ff6b6b" /> Tax Alpha: {memoizedComparisonData[0]?.taxAlpha}%</div>
        </div>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}>Tax-Loss Harvesting Engine</h2>
        <p>Daily opportunity scanner for tax-loss harvesting.</p>
        <button style={{ backgroundColor: '#90ee90', color: '#1a1a2e', padding: '10px', marginBottom: '20px' }}>Scan for Opportunities</button>
        {renderTaxLossChart()}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Shield size={24} color="#ff6b6b" /> <p>Wash Sale Rule Compliance: {washSaleCompliance ? 'Compliant' : 'Non-Compliant'}</p>
        </div>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#90ee90' }}>ESG/Values-Based Screening</h2>
        <p>Customize your portfolio with ESG filters.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleEsgToggle('environmental')} style={{ backgroundColor: esgFilters.environmental ? '#00b4d8' : '#2c2c3e' }}>Environmental</button>
          <button onClick={() => handleEsgToggle('social')} style={{ backgroundColor: esgFilters.social ? '#90ee90' : '#2c2c3e' }}>Social</button>
          <button onClick={() => handleEsgToggle('governance')} style={{ backgroundColor: esgFilters.governance ? '#ff6b6b' : '#2c2c3e' }}>Governance</button>
        </div>
        {renderEsgPieChart()}
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}>Tracking Error Analysis</h2>
        <p>Analyze historical tracking error.</p>
        {renderTrackingErrorChart()}
        <div><Target size={24} color="#90ee90" /> Current Error: 0.5%</div>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#90ee90' }}>Factor Tilt Customization</h2>
        <p>Adjust weights for value, momentum, quality, and size.</p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <input type="range" min="0" max="100" value={factorTilts.value} onChange={(e) => handleFactorChange('value', e.target.value)} />
          <span>Value: {factorTilts.value}%</span>
          <input type="range" min="0" max="100" value={factorTilts.momentum} onChange={(e) => handleFactorChange('momentum', e.target.value)} />
          <span>Momentum: {factorTilts.momentum}%</span>
          <input type="range" min="0" max="100" value={factorTilts.quality} onChange={(e) => handleFactorChange('quality', e.target.value)} />
          <span>Quality: {factorTilts.quality}%</span>
          <input type="range" min="0" max="100" value={factorTilts.size} onChange={(e) => handleFactorChange('size', e.target.value)} />
          <span>Size: {factorTilts.size}%</span>
        </div>
        {renderFactorTiltChart()}
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}>Concentrated Stock Integration</h2>
        <p>Integrate specific stocks into your index.</p>
        <input type="text" placeholder="Add stock (e.g., AAPL)" onChange={(e) => setConcentratedStocks([...concentratedStocks, e.target.value])} style={{ backgroundColor: '#2c2c3e', color: '#ffffff' }} />
        <ul>
          {concentratedStocks.map(stock => <li key={stock}>{stock}</li>)}
        </ul>
        <Layers size={24} color="#90ee90" />
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#90ee90' }}>50-Year Tax Alpha Projection</h2>
        <p>Projection of tax alpha over 50 years from direct indexing.</p>
        {renderTaxAlphaProjectionChart()}
        <div><Calendar size={24} color="#00b4d8" /> Projected Alpha in 2050: 2.5%</div>
      </section>
      
      <section>
        <h2 style={{ color: '#00b4d8' }}>Compliance Tracker</h2>
        <p>Ensure compliance with IRC 1091, Section 1001, 1211, 1222, and SEC Reg SHO.</p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <CheckCircle2 size={24} color={washSaleCompliance ? '#90ee90' : '#ff6b6b'} /> IRC 1091 Wash Sale Rule
          <AlertTriangle size={24} color="#ff6b6b" /> Section 1001 Realization
          <Shield size={24} color="#00b4d8" /> Section 1211 Capital Loss
          <Filter size={24} color="#90ee90" /> Section 1222 Holding Period
          <ArrowRight size={24} color="#ff6b6b" /> SEC Reg SHO Short Sale
        </div>
        <button onClick={() => setWashSaleCompliance(!washSaleCompliance)} style={{ backgroundColor: '#ff6b6b', color: '#ffffff' }}>Toggle Compliance</button>
      </section>
      
      <footer style={{ textAlign: 'center', marginTop: '40px' }}>
        <p>Powered by advanced indexing tools. All rights reserved.</p>
      </footer>
      <PageInsights section="direct-indexing-optimizer" />
    </div>
  );
}
