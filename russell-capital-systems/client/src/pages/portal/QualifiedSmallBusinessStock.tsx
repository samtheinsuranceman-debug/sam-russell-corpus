// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Rocket, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Building2, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function QualifiedSmallBusinessStock() {
  const [isCCorp, setIsCCorp] = useState(false);
  const [assets, setAssets] = useState(0);
  const [holdPeriod, setHoldPeriod] = useState(0);
  const [gain, setGain] = useState(0);
  const [basis, setBasis] = useState(0);
  const [useTrusts, setUseTrusts] = useState(false);
  const [useGifts, setUseGifts] = useState(false);
  const [useFamily, setUseFamily] = useState(false);
  const [rolloverAmount, setRolloverAmount] = useState(0);
  const [businessType, setBusinessType] = useState('');
  const [activeBusinessPercentage, setActiveBusinessPercentage] = useState(0);
  const [state, setState] = useState('CA');
  const [year, setYear] = useState(2023);

  const isEligible = useMemo(() => {
    return isCCorp && assets <= 50000000 && holdPeriod >= 5;
  }, [isCCorp, assets, holdPeriod]);

  const exclusionAmount = useMemo(() => {
    if (gain <= 10000000) return gain;
    if (gain >= 10 * basis) return 10 * basis;
    return 10000000;
  }, [gain, basis]);

  const stackingStrategyScore = useMemo(() => {
    let score = 0;
    if (useTrusts) score += 30;
    if (useGifts) score += 40;
    if (useFamily) score += 30;
    return score;
  }, [useTrusts, useGifts, useFamily]);

  const wealthComparisonData = useMemo(() => [
    { year: 2023, qsbsWealth: 1000000, taxableWealth: 800000 },
    { year: 2024, qsbsWealth: 1200000, taxableWealth: 850000 },
    { year: 2025, qsbsWealth: 1400000, taxableWealth: 900000 },
    { year: 2026, qsbsWealth: 1600000, taxableWealth: 950000 },
    { year: 2027, qsbsWealth: 1800000, taxableWealth: 1000000 },
    { year: 2028, qsbsWealth: 2000000, taxableWealth: 1050000 },
    { year: 2029, qsbsWealth: 2200000, taxableWealth: 1100000 },
    { year: 2030, qsbsWealth: 2400000, taxableWealth: 1150000 },
    { year: 2031, qsbsWealth: 2600000, taxableWealth: 1200000 },
    { year: 2032, qsbsWealth: 2800000, taxableWealth: 1250000 },
    { year: 2033, qsbsWealth: 3000000, taxableWealth: 1300000 },
    { year: 2034, qsbsWealth: 3200000, taxableWealth: 1350000 },
    { year: 2035, qsbsWealth: 3400000, taxableWealth: 1400000 },
    { year: 2036, qsbsWealth: 3600000, taxableWealth: 1450000 },
    { year: 2037, qsbsWealth: 3800000, taxableWealth: 1500000 },
    { year: 2038, qsbsWealth: 4000000, taxableWealth: 1550000 },
    { year: 2039, qsbsWealth: 4200000, taxableWealth: 1600000 },
    { year: 2040, qsbsWealth: 4400000, taxableWealth: 1650000 },
    { year: 2041, qsbsWealth: 4600000, taxableWealth: 1700000 },
    { year: 2042, qsbsWealth: 4800000, taxableWealth: 1750000 },
    { year: 2043, qsbsWealth: 5000000, taxableWealth: 1800000 },
    { year: 2044, qsbsWealth: 5200000, taxableWealth: 1850000 },
    { year: 2045, qsbsWealth: 5400000, taxableWealth: 1900000 },
    { year: 2046, qsbsWealth: 5600000, taxableWealth: 1950000 },
    { year: 2047, qsbsWealth: 5800000, taxableWealth: 2000000 },
    { year: 2048, qsbsWealth: 6000000, taxableWealth: 2050000 },
    { year: 2049, qsbsWealth: 6200000, taxableWealth: 2100000 },
    { year: 2050, qsbsWealth: 6400000, taxableWealth: 2150000 },
    { year: 2051, qsbsWealth: 6600000, taxableWealth: 2200000 },
    { year: 2052, qsbsWealth: 6800000, taxableWealth: 2250000 },
    { year: 2053, qsbsWealth: 7000000, taxableWealth: 2300000 },
    { year: 2054, qsbsWealth: 7200000, taxableWealth: 2350000 },
    { year: 2055, qsbsWealth: 7400000, taxableWealth: 2400000 },
    { year: 2056, qsbsWealth: 7600000, taxableWealth: 2450000 },
    { year: 2057, qsbsWealth: 7800000, taxableWealth: 2500000 },
    { year: 2058, qsbsWealth: 8000000, taxableWealth: 2550000 },
    { year: 2059, qsbsWealth: 8200000, taxableWealth: 2600000 },
    { year: 2060, qsbsWealth: 8400000, taxableWealth: 2650000 },
    { year: 2061, qsbsWealth: 8600000, taxableWealth: 2700000 },
    { year: 2062, qsbsWealth: 8800000, taxableWealth: 2750000 },
    { year: 2063, qsbsWealth: 9000000, taxableWealth: 2800000 },
    { year: 2064, qsbsWealth: 9200000, taxableWealth: 2850000 },
    { year: 2065, qsbsWealth: 9400000, taxableWealth: 2900000 },
    { year: 2066, qsbsWealth: 9600000, taxableWealth: 2950000 },
    { year: 2067, qsbsWealth: 9800000, taxableWealth: 3000000 },
    { year: 2068, qsbsWealth: 10000000, taxableWealth: 3050000 },
    { year: 2069, qsbsWealth: 10200000, taxableWealth: 3100000 },
    { year: 2070, qsbsWealth: 10400000, taxableWealth: 3150000 },
    { year: 2071, qsbsWealth: 10600000, taxableWealth: 3200000 },
    { year: 2072, qsbsWealth: 10800000, taxableWealth: 3250000 },
    { year: 2073, qsbsWealth: 11000000, taxableWealth: 3300000 }
  ], []);

  const stateConformityData = useMemo(() => [
    { state: 'CA', conformity: 'Partial exclusion', details: 'Excludes 50% of gain for CA residents' },
    { state: 'TX', conformity: 'Full exclusion', details: 'Aligns with federal IRC 1202' },
    { state: 'NY', conformity: 'No exclusion', details: 'Does not recognize QSBS exclusion' },
    { state: 'FL', conformity: 'Full exclusion', details: 'Follows federal rules' }
  ], []);

  return (
    <div style={{ backgroundColor: '#1a1a2e', color: '#ffffff', padding: '20px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#00b4d8', display: 'flex', alignItems: 'center' }}><Rocket size={24} /> QSBS Section 1202 Exclusion Planning and Optimization Tool</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ff8c00' }}><Building2 size={20} /> QSBS Eligibility Checker</h2>
        <p>Check if your stock qualifies under IRC 1202: Must be C-corp, gross assets ≤ $50M, and held for at least 5 years.</p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>
            Is it a C-corp?
            <input type="checkbox" checked={isCCorp} onChange={(e) => setIsCCorp(e.target.checked)} />
          </label>
          <label>
            Gross Assets (in USD):
            <input type="number" value={assets} onChange={(e) => setAssets(Number(e.target.value))} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }} />
          </label>
          <label>
            Hold Period (in years):
            <input type="number" value={holdPeriod} onChange={(e) => setHoldPeriod(Number(e.target.value))} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }} />
          </label>
          {isEligible ? <p style={{color: '#ff4500'}}><CheckCircle2 size={18} /> Eligible for QSBS exclusion!</p> : <p><AlertTriangle size={18} /> Not eligible.</p>}
        </form>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ff8c00' }}><DollarSign size={20} /> Exclusion Calculator</h2>
        <p>Calculate exclusion: Up to $10M or 10x adjusted basis, per IRC 1202.</p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>
            Capital Gain (in USD):
            <input type="number" value={gain} onChange={(e) => setGain(Number(e.target.value))} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }} />
          </label>
          <label>
            Adjusted Basis (in USD):
            <input type="number" value={basis} onChange={(e) => setBasis(Number(e.target.value))} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }} />
          </label>
          <p>Exclusion Amount: <span style={{ color: '#00b4d8' }}>${exclusionAmount.toLocaleString()}</span></p>
        </form>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ff8c00' }}><Shield size={20} /> Stacking Strategies</h2>
        <p>Optimize exclusion by stacking with trusts, gifts, or family members under IRC 1202.</p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>
            Use Trusts?
            <input type="checkbox" checked={useTrusts} onChange={(e) => setUseTrusts(e.target.checked)} />
          </label>
          <label>
            Use Gifts?
            <input type="checkbox" checked={useGifts} onChange={(e) => setUseGifts(e.target.checked)} />
          </label>
          <label>
            Use Family Members?
            <input type="checkbox" checked={useFamily} onChange={(e) => setUseFamily(e.target.checked)} />
          </label>
          <p>Strategy Score: <span style={{ color: '#00b4d8' }}>{stackingStrategyScore}/100</span></p>
        </form>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ff8c00' }}><ArrowRight size={20} /> Section 1045 Rollover Option</h2>
        <p>Roll over gains into another QSBS within 60 days under IRC 1045.</p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>
            Rollover Amount (in USD):
            <input type="number" value={rolloverAmount} onChange={(e) => setRolloverAmount(Number(e.target.value))} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }} />
          </label>
          <p>Potential Tax-Deferred Gain: <span style={{ color: '#00b4d8' }}>${rolloverAmount.toLocaleString()}</span></p>
        </form>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ff8c00' }}><Target size={20} /> Qualified Trade or Business Test</h2>
        <p>Ensure the business qualifies (not services like health, law, etc.) and meets active business requirement (80% assets in active use).</p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>
            Business Type:
            <input type="text" value={businessType} onChange={(e) => setBusinessType(e.target.value)} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }} />
          </label>
          <label>
            Active Business Percentage:
            <input type="number" value={activeBusinessPercentage} onChange={(e) => setActiveBusinessPercentage(Number(e.target.value))} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }} />
          </label>
          {activeBusinessPercentage >= 80 ? <p style={{color: '#ff4500'}}><CheckCircle2 size={18} /> Meets active business requirement!</p> : <p><AlertTriangle size={18} /> Does not meet requirement.</p>}
        </form>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ff8c00' }}><TrendingUp size={20} /> 50-Year Wealth Comparison (QSBS vs Taxable Sale)</h2>
        <p>Compare wealth growth with QSBS exclusion vs. taxable sale.</p>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={wealthComparisonData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="qsbsWealth" stroke="#00b4d8" />
            <Line type="monotone" dataKey="taxableWealth" stroke="#ff8c00" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ff8c00' }}><Star size={20} /> State Conformity Tracker</h2>
        <p>Track state conformity, e.g., CA has partial exclusion.</p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>
            Select State:
            <select value={state} onChange={(e) => setState(e.target.value)} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }}>
              <option value="CA">California</option>
              <option value="TX">Texas</option>
              <option value="NY">New York</option>
              <option value="FL">Florida</option>
            </select>
          </label>
          <label>
            Year:
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ backgroundColor: '#2c2c3e', color: '#fff', border: '1px solid #00b4d8' }} />
          </label>
        </form>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stateConformityData}>
            <XAxis dataKey="state" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="conformity" fill="#00b4d8" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2 style={{ color: '#ff8c00' }}><Percent size={20} /> Compliance Overview</h2>
        <p>Key sections: IRC 1202 for QSBS exclusion, Section 1045 for rollovers, Section 1244 for loss deductions, Section 1(h)(4) for 28% rate on pre-2009 gains, and PATH Act 2015 for 100% exclusion.</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Calendar size={18} /> IRC 1202: 100% exclusion for qualified gains.</li>
          <li><ArrowRight size={18} /> Section 1045: Rollover to new QSBS.</li>
          <li><AlertTriangle size={18} /> Section 1244: Ordinary loss treatment.</li>
          <li><DollarSign size={18} /> Section 1(h)(4): 28% rate for collectibles pre-2009.</li>
          <li><Shield size={18} /> PATH Act 2015: Expanded 100% exclusion.</li>
        </ul>
      </section>
      <PageInsights section="qualified-small-business-stock" />
    </div>
  );
}
