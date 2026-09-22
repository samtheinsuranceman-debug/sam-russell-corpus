// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Droplets, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Scale, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const TrustDecantingPlanner = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStates, setSelectedStates] = useState(['California', 'New York']);
  const [comparisonType, setComparisonType] = useState('decantingVsModification');

  const stateStatutesData = useMemo(() => [
    { state: 'Alabama', hasStatute: true, yearEnacted: 2013, keyProvisions: 'Allows for decanting with court approval' },
    { state: 'Alaska', hasStatute: true, yearEnacted: 2008, keyProvisions: 'Broad decanting powers without court order' },
    { state: 'Arizona', hasStatute: true, yearEnacted: 2010, keyProvisions: 'Requires trustee discretion' },
    { state: 'Arkansas', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Limits on irrevocable trusts' },
    { state: 'California', hasStatute: true, yearEnacted: 2015, keyProvisions: 'Permits decanting for administrative changes' },
    { state: 'Colorado', hasStatute: true, yearEnacted: 2014, keyProvisions: 'Focuses on beneficiary interests' },
    { state: 'Connecticut', hasStatute: true, yearEnacted: 2007, keyProvisions: 'Court oversight required' },
    { state: 'Delaware', hasStatute: true, yearEnacted: 2012, keyProvisions: 'Highly flexible for asset protection' },
    { state: 'Florida', hasStatute: true, yearEnacted: 2012, keyProvisions: 'Allows for dynasty trusts' },
    { state: 'Georgia', hasStatute: true, yearEnacted: 2010, keyProvisions: 'Specific notice requirements' },
    { state: 'Hawaii', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Ties to UTC' },
    { state: 'Idaho', hasStatute: true, yearEnacted: 2009, keyProvisions: 'Minimal restrictions' },
    { state: 'Illinois', hasStatute: true, yearEnacted: 2013, keyProvisions: 'Beneficiary consent needed' },
    { state: 'Indiana', hasStatute: true, yearEnacted: 2012, keyProvisions: 'Protects creditors' },
    { state: 'Iowa', hasStatute: true, yearEnacted: 2010, keyProvisions: 'Limited to certain trusts' },
    { state: 'Kansas', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Emphasizes tax benefits' },
    { state: 'Kentucky', hasStatute: true, yearEnacted: 2014, keyProvisions: 'Court approval for changes' },
    { state: 'Louisiana', hasStatute: false, yearEnacted: null, keyProvisions: 'No specific statute' },
    { state: 'Maine', hasStatute: true, yearEnacted: 2009, keyProvisions: 'Aligns with UTC' },
    { state: 'Maryland', hasStatute: true, yearEnacted: 2014, keyProvisions: 'Focus on duration extension' },
    { state: 'Massachusetts', hasStatute: true, yearEnacted: 2012, keyProvisions: 'Requires fiduciary duty' },
    { state: 'Michigan', hasStatute: true, yearEnacted: 2010, keyProvisions: 'Broad trustee powers' },
    { state: 'Minnesota', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Beneficiary protections' },
    { state: 'Mississippi', hasStatute: true, yearEnacted: 2013, keyProvisions: 'Tax implications outlined' },
    { state: 'Missouri', hasStatute: true, yearEnacted: 2012, keyProvisions: 'Specific to irrevocable trusts' },
    { state: 'Montana', hasStatute: true, yearEnacted: 2009, keyProvisions: 'Minimal court involvement' },
    { state: 'Nebraska', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Notice to beneficiaries' },
    { state: 'Nevada', hasStatute: true, yearEnacted: 2015, keyProvisions: 'Asset protection focus' },
    { state: 'New Hampshire', hasStatute: true, yearEnacted: 2008, keyProvisions: 'Ties to UTC sections' },
    { state: 'New Jersey', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Court oversight' },
    { state: 'New Mexico', hasStatute: true, yearEnacted: 2010, keyProvisions: 'Flexible for modifications' },
    { state: 'New York', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Detailed provisions' },
    { state: 'North Carolina', hasStatute: true, yearEnacted: 2013, keyProvisions: 'Beneficiary rights' },
    { state: 'North Dakota', hasStatute: true, yearEnacted: 2009, keyProvisions: 'Simple process' },
    { state: 'Ohio', hasStatute: true, yearEnacted: 2012, keyProvisions: 'Tax considerations' },
    { state: 'Oklahoma', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Trustee discretion' },
    { state: 'Oregon', hasStatute: true, yearEnacted: 2010, keyProvisions: 'Aligns with UTC' },
    { state: 'Pennsylvania', hasStatute: true, yearEnacted: 2014, keyProvisions: 'Court approval' },
    { state: 'Rhode Island', hasStatute: true, yearEnacted: 2009, keyProvisions: 'Limited scope' },
    { state: 'South Carolina', hasStatute: true, yearEnacted: 2013, keyProvisions: 'Beneficiary notice' },
    { state: 'South Dakota', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Dynasty trust support' },
    { state: 'Tennessee', hasStatute: true, yearEnacted: 2012, keyProvisions: 'Tax benefits' },
    { state: 'Texas', hasStatute: true, yearEnacted: 2013, keyProvisions: 'Asset protection' },
    { state: 'Utah', hasStatute: true, yearEnacted: 2010, keyProvisions: 'Minimal restrictions' },
    { state: 'Vermont', hasStatute: true, yearEnacted: 2008, keyProvisions: 'Ties to UTC' },
    { state: 'Virginia', hasStatute: true, yearEnacted: 2012, keyProvisions: 'Court involvement' },
    { state: 'Washington', hasStatute: true, yearEnacted: 2011, keyProvisions: 'Beneficiary protections' },
    { state: 'West Virginia', hasStatute: false, yearEnacted: null, keyProvisions: 'No statute' },
    { state: 'Wisconsin', hasStatute: true, yearEnacted: 2014, keyProvisions: 'Detailed process' },
    { state: 'Wyoming', hasStatute: true, yearEnacted: 2009, keyProvisions: 'Flexible for changes' },
  ], []);

  const taxImplicationsData = useMemo(() => [
    { category: 'IRC 2041', impact: 'Estate tax on general power of appointment' },
    { category: 'Section 2514', impact: 'Gift tax implications for releases' },
    { category: 'Section 678', impact: 'Grantor trust rules affecting income tax' },
  ], []);

  const fiftyYearComparisonData = useMemo(() => [
    { year: 0, originalValue: 1000000, decantedValue: 1000000 },
    { year: 10, originalValue: 1500000, decantedValue: 2000000 },
    { year: 20, originalValue: 1800000, decantedValue: 2800000 },
    { year: 30, originalValue: 2000000, decantedValue: 3500000 },
    { year: 40, originalValue: 2200000, decantedValue: 4200000 },
    { year: 50, originalValue: 2400000, decantedValue: 5000000 },
  ], []);

  const COLORS = ['#008080', '#FFD700', '#FF4500', '#4CAF50'];

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', fontFamily: 'Arial, sans-serif', minHeight: '100vh', padding: '40px' }}>
      <h1 style={{ color: '#008080', textAlign: 'center', fontSize: '2.5em' }}>Trust Decanting Planner</h1>
      
      <nav style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button onClick={() => setActiveTab('overview')} style={{ backgroundColor: '#008080', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Overview</button>
        <button onClick={() => setActiveTab('stateComparison')} style={{ backgroundColor: '#008080', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>State Comparison</button>
        <button onClick={() => setActiveTab('comparisons')} style={{ backgroundColor: '#008080', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Comparisons</button>
        <button onClick={() => setActiveTab('taxImplications')} style={{ backgroundColor: '#008080', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Tax Implications</button>
        <button onClick={() => setActiveTab('features')} style={{ backgroundColor: '#008080', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Features</button>
        <button onClick={() => setActiveTab('fiftyYear')} style={{ backgroundColor: '#008080', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>50-Year Comparison</button>
        <button onClick={() => setActiveTab('compliance')} style={{ backgroundColor: '#008080', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px' }}>Compliance</button>
      </nav>

      {activeTab === 'overview' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>Trust Decanting Overview <Droplets size={24} color="#008080" /></h2>
          <p>Trust decanting is the process of pouring assets from an old trust into a new one, allowing for updates without full termination. This strategy enables trustees to adapt to changing circumstances while preserving the original intent.</p>
          <p>Key benefits include flexibility in trust administration and modernization of outdated provisions.</p>
        </section>
      )}

      {activeTab === 'stateComparison' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>State Decanting Statute Comparison <Scale size={24} color="#008080" /></h2>
          <p>Compare decanting statutes across 30+ states. Select states: 
            <select onChange={(e) => setSelectedStates([e.target.value])} style={{ marginLeft: '10px', backgroundColor: '#333', color: '#fff' }}>
              {stateStatutesData.map(state => <option key={state.state} value={state.state}>{state.state}</option>)}
            </select>
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stateStatutesData.filter(d => selectedStates.includes(d.state))}>
              <XAxis dataKey="state" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="yearEnacted" fill="#008080" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {activeTab === 'comparisons' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>Decanting vs Trust Modification vs Merger <ArrowRight size={24} color="#008080" /></h2>
          <p>Decanting offers more flexibility than trust modification, which requires court approval, and merger, which combines trusts but may not allow for significant changes.</p>
          <ResponsiveContainer width="100%" height={400}><PieChart>
            <Pie data={[{name: 'Decanting', value: 60}, {name: 'Modification', value: 25}, {name: 'Merger', value: 15}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#FFD700">
              {[{name: 'Decanting', value: 60}, {name: 'Modification', value: 25}, {name: 'Merger', value: 15}].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart></ResponsiveContainer>
        </section>
      )}

      {activeTab === 'taxImplications' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>Tax Implications of Decanting <DollarSign size={24} color="#008080" /></h2>
          <p>Decanting can trigger estate tax under IRC 2041 if it creates a general power of appointment. Gift tax may apply under Section 2514, and Section 678 could classify the trust as a grantor trust.</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={taxImplicationsData}>
              <Area type="monotone" dataKey="impact" stroke="#FFD700" fill="#008080" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      )}

      {activeTab === 'features' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>Trust Features <Target size={24} color="#008080" /></h2>
          <p>Adding or removing beneficiaries: Possible via decanting with state compliance.</p>
          <p>Changing distribution standards: Allows for updates to reflect current needs.</p>
          <p>Extending trust duration: Decanting can extend beyond original terms.</p>
          <ul>
            <li><CheckCircle2 size={18} color="#FFD700" /> Add beneficiaries</li>
            <li><AlertTriangle size={18} color="#FF4500" /> Remove beneficiaries with care</li>
            <li><Calendar size={18} color="#008080" /> Extend duration up to perpetuity in some states</li>
          </ul>
        </section>
      )}

      {activeTab === 'fiftyYear' && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#FFD700' }}>50-Year Comparison <TrendingUp size={24} color="#008080" /></h2>
          <p>Compare original vs decanted trust growth over 50 years.</p>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={fiftyYearComparisonData}>
              <Line type="monotone" dataKey="originalValue" stroke="#FFD700" />
              <Line type="monotone" dataKey="decantedValue" stroke="#008080" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {activeTab === 'compliance' && (
        <section>
          <h2 style={{ color: '#FFD700' }}>Compliance Requirements <Shield size={24} color="#008080" /></h2>
          <p>Ensure compliance with state decanting statutes, UTC sections 411-417, IRC 2041 for general power of appointment, Section 2514 for gift tax, Section 678 for grantor trust rules, and case law like Morse v. Kraft.</p>
          <ul>
            <li><Lock size={18} color="#FFD700" /> State statutes vary; check local laws.</li>
            <li><Percent size={18} color="#008080" /> UTC 411-417 outlines uniform rules.</li>
            <li><AlertTriangle size={18} color="#FF4500" /> IRC 2041 impacts estate planning.</li>
          </ul>
        </section>
      )}
      <PageInsights section="trust-decanting-planner" />
    </div>
  );
};

export default TrustDecantingPlanner;
