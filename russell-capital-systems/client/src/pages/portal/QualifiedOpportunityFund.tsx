// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { MapPin, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Building2, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

function QualifiedOpportunityFund() {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTract, setSelectedTract] = useState(null);

  const chartData = useMemo(() => [
    { year: 0, QOZ: 100000, Taxable: 100000, '1031': 100000 },
    { year: 1, QOZ: 105000, Taxable: 102000, '1031': 104000 },
    { year: 2, QOZ: 110500, Taxable: 104040, '1031': 106080 },
    { year: 3, QOZ: 116025, Taxable: 106121, '1031': 108162 },
    { year: 4, QOZ: 121826, Taxable: 108243, '1031': 110405 },
    { year: 5, QOZ: 127918, Taxable: 110488, '1031': 112613 },
    { year: 6, QOZ: 134414, Taxable: 112698, '1031': 114866 },
    { year: 7, QOZ: 141135, Taxable: 114952, '1031': 117203 },
    { year: 8, QOZ: 148202, Taxable: 117291, '1031': 119627 },
    { year: 9, QOZ: 155612, Taxable: 119757, '1031': 122060 },
    { year: 10, QOZ: 250000, Taxable: 122252, '1031': 124541 },
  ], []);

  const handleTractSearch = (e) => {
    e.preventDefault();
    const input = e.target.tract.value;
    setSelectedTract(input);
    alert(`Searching for tract: ${input}`);
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#e0e0e0', padding: '40px', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ color: '#00bfa5', textAlign: 'center', marginBottom: '40px' }}>Qualified Opportunity Zone (QOZ) Fund Overview</h1>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffbf00' }}><TrendingUp size={24} /> QOZ Fund Structure and 180-Day Investment Window</h2>
        <p>A Qualified Opportunity Fund (QOF) is a special investment vehicle designed to encourage long-term investments in economically distressed areas, as defined by the Tax Cuts and Jobs Act. Investors must reinvest capital gains into a QOF within 180 days to defer taxes on those gains.</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#00bfa5', marginRight: '10px'}}><MapPin size={18} inline /> Key Structure: QOFs must hold at least 90% of their assets in Qualified Opportunity Zone property, which includes businesses or real estate in designated zones.</li>
          <li style={{marginBottom: '10px', color: '#ffbf00', marginRight: '10px'}}><Clock size={18} inline /> 180-Day Window: From the date of sale of an asset, investors have exactly 180 days to invest in a QOF. This timeline is critical for tax deferral benefits.</li>
          <li style={{marginBottom: '10px', color: '#00bfa5', marginRight: '10px'}}><Building2 size={18} inline /> Fund Management: QOFs are typically managed by professional fund managers who focus on high-growth potential in QOZs.</li>
        </ul>
        <button onClick={() => setShowDetails(!showDetails)} style={{ backgroundColor: '#00bfa5', color: '#121212', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>
          {showDetails ? 'Hide Details' : 'Show More'}
        </button>
        {showDetails && (
          <div style={{ marginTop: '20px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
            <p>Additional details: The QOF structure allows for diversification across multiple QOZ properties, reducing risk while promoting economic development.</p>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffbf00' }}><DollarSign size={24} /> Basis Step-Up Timeline</h2>
        <p>The basis step-up provides tax benefits based on the length of investment in a QOF:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#00bfa5', marginRight: '10px'}}><Calendar size={18} inline /> 5-Year Hold: 10% step-up in basis, reducing taxable gain by 10%.</li>
          <li style={{marginBottom: '10px', color: '#ffbf00', marginRight: '10px'}}><Target size={18} inline /> 7-Year Hold: An additional 5% step-up (total 15%), further minimizing tax liability.</li>
          <li style={{marginBottom: '10px', color: '#00bfa5', marginRight: '10px'}}><Percent size={18} inline /> 10-Year Hold: 100% exclusion of capital gains on the appreciation of the QOF investment.</li>
        </ul>
        <p>This timeline encourages long-term investment, with the full exclusion at 10 years being a significant incentive.</p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffbf00' }}><Shield size={24} /> Substantial Improvement Test</h2>
        <p>To qualify as a QOZ business property, investments must meet the substantial improvement test, which requires doubling the basis of the property within 30 months.</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#00bfa5', marginRight: '10px'}}><ArrowRight size={18} inline /> Basis Calculation: Original basis plus improvements must equal at least twice the original basis.</li>
          <li style={{marginBottom: '10px', color: '#ffbf00', marginRight: '10px'}}><Clock size={18} inline /> Timeline: All improvements must be completed within 30 months from the acquisition date.</li>
          <li style={{marginBottom: '10px', color: '#00bfa5', marginRight: '10px'}}><CheckCircle2 size={18} inline /> Example: If a property has a basis of $1,000,000, improvements totaling at least $1,000,000 must be made.</li>
          <li style={{marginBottom: '10px', color: 'red', marginRight: '10px'}}><AlertTriangle size={18} inline /> Non-Compliance: Failure to meet this test could result in loss of QOZ benefits.</li>
        </ul>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffbf00' }}><AreaChart size={24} /> 10-Year Hold Comparison</h2>
        <p>This AreaChart compares the growth of investments in QOZ funds versus taxable accounts and 1031 exchanges over 10 years, assuming a 5% annual growth rate with QOZ benefits applied.</p>
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1e1e1e', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="year" stroke="#e0e0e0" />
              <YAxis stroke="#e0e0e0" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="QOZ" stroke="#00bfa5" fill="#00bfa5" fillOpacity={0.3} />
              <Area type="monotone" dataKey="Taxable" stroke="#ffbf00" fill="#ffbf00" fillOpacity={0.3} />
              <Area type="monotone" dataKey="1031" stroke="#757575" fill="#757575" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p style={{ marginTop: '10px' }}>Key Insight: QOZ shows exponential growth due to tax exclusions, outperforming taxable and 1031 options by year 10.</p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffbf00' }}><MapPin size={24} /> Eligible Census Tract Finder Concept</h2>
        <p>The eligible census tract finder is a tool to identify Qualified Opportunity Zones based on U.S. Census data. Users can search for tracts to verify eligibility.</p>
        <form onSubmit={handleTractSearch} style={{ marginTop: '20px' }}>
          <input type="text" name="tract" placeholder="Enter Census Tract (e.g., 12345)" style={{ padding: '10px', backgroundColor: '#2c2c2c', color: '#e0e0e0', border: '1px solid #00bfa5' }} />
          <button type="submit" style={{ backgroundColor: '#ffbf00', color: '#121212', border: 'none', padding: '10px 20px', marginLeft: '10px', cursor: 'pointer' }}>Search</button>
        </form>
        {selectedTract && (
          <div style={{ marginTop: '20px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
            <p>Selected Tract: {selectedTract}. This tract is eligible if it meets QOZ criteria (low-income communities as per IRC definitions).</p>
            <p>Use tools like the Census Bureau's website or IRS maps for accurate verification.</p>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffbf00' }}><CheckCircle2 size={24} /> Compliance Requirements</h2>
        <p>Compliance with QOZ rules is governed by IRC Section 1400Z-2. Key aspects include:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{marginBottom: '10px', color: '#00bfa5', marginRight: '10px'}}><Shield size={18} inline /> IRC 1400Z-2: Outlines the deferral and exclusion of capital gains for QOF investments.</li>
          <li style={{marginBottom: '10px', color: 'red', marginRight: '10px'}}><AlertTriangle size={18} inline /> Section 45D NMTC Overlap: QOZ investments may interact with New Markets Tax Credit programs, requiring careful structuring to avoid conflicts.</li>
          <li style={{marginBottom: '10px', color: '#ffbf00', marginRight: '10px'}}><Calendar size={18} inline /> IRS Form 8996: Annual certification is mandatory for QOFs to confirm at least 90% asset qualification.</li>
          <li style={{marginBottom: '10px', color: '#00bfa5', marginRight: '10px'}}><Percent size={18} inline /> Reporting: Investors must track and report holdings annually to maintain benefits.</li>
        </ul>
        <p>Non-compliance can lead to penalties, so consult a tax professional.</p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffbf00' }}><BarChart size={24} /> Additional Charts for Analysis</h2>
        <div style={{ width: '100%', height: '300px', backgroundColor: '#1e1e1e', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.slice(0, 5)}>
              <XAxis dataKey="year" stroke="#e0e0e0" />
              <YAxis stroke="#e0e0e0" />
              <Tooltip />
              <Legend />
              <Bar dataKey="QOZ" fill="#00bfa5" />
              <Bar dataKey="Taxable" fill="#ffbf00" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: '100%', height: '300px', backgroundColor: '#1e1e1e', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis dataKey="year" stroke="#e0e0e0" />
              <YAxis stroke="#e0e0e0" />
              <Tooltip />
              <Legend />
              <Area dataKey="QOZ" fill="#00bfa5" />
              <Line dataKey="Taxable" stroke="#ffbf00" />
              <Bar dataKey="1031" fill="#757575" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
      
      <footer style={{ textAlign: 'center', color: '#757575', marginTop: '40px' }}>
        <p>Disclaimer: This is for educational purposes. Consult professionals for investment advice.</p>
      </footer>
      <PageInsights section="qualified-opportunity-fund" />
    </div>
  );
}

export default QualifiedOpportunityFund;
