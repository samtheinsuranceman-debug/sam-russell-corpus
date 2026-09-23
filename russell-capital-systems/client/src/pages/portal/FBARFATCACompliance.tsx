
import React, { useState, useMemo } from 'react';
import { Globe, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, FileText, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const FBARFATCACompliance: React.FC = () => {
  // Inputs. Every result below is derived from these during render; nothing is stored twice.
  const [fbarAccounts, setFbarAccounts] = useState([{ name: '', value: 0 }]);
  const [fatcaResidency, setFatcaResidency] = useState('domestic'); // 'domestic' or 'foreign'
  const [fatcaAssets, setFatcaAssets] = useState(0);
  const [trustType, setTrustType] = useState('');
  const [trustValue, setTrustValue] = useState(0);
  const [pficShares, setPficShares] = useState(0);
  const [pficIncome, setPficIncome] = useState(0);
  const [foreignTaxesPaid, setForeignTaxesPaid] = useState(0);
  const [usTaxesDue, setUsTaxesDue] = useState(0);
  const [treatyCountry, setTreatyCountry] = useState('');
  const [incomeType, setIncomeType] = useState('');
  const [streamlinedEligibility, setStreamlinedEligibility] = useState(false);
  const [vdProgram, setVdProgram] = useState(''); // e.g., 'Streamlined' or 'OVDP'
  const [penaltyYears, setPenaltyYears] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

  const fbarTotal = useMemo(() => fbarAccounts.reduce((sum, acc) => sum + acc.value, 0), [fbarAccounts]);
  const fbarResult = fbarTotal > 10000 ? 'Filing required under 31 USC 5314' : 'No filing required';

  const fatcaResult =
    (fatcaResidency === 'domestic' && fatcaAssets > 50000) || (fatcaResidency === 'foreign' && fatcaAssets > 200000)
      ? 'Filing required under IRC 6038D'
      : 'No filing required';

  const trustResult =
    trustType === 'foreign' && trustValue > 10000 ? 'Report on Form 3520/3520-A under section 6677' : 'No reporting required';

  const pficResult = pficShares > 0 ? 'PFIC reporting required under section 1291' : 'No PFIC reporting';

  const creditOptimized = Math.min(foreignTaxesPaid, usTaxesDue);

  const treatyResult =
    treatyCountry && incomeType ? `Benefits available under section 901 for ${treatyCountry}` : 'No treaty benefits analyzed';

  const streamlinedResult = streamlinedEligibility ? 'Eligible for streamlined program' : 'Not eligible';

  const vdComparison = vdProgram === 'Streamlined' ? 'Lower penalties than OVDP' : 'Standard program comparison';

  const penaltyExposure = penaltyYears * penaltyAmount;
  const penaltyResult = `Exposure: $${penaltyExposure.toLocaleString()} under various sections`;

  return (
    <div style={{ backgroundColor: '#1a202c', color: '#ffffff', padding: '40px', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ color: '#00bcd4', display: 'flex', alignItems: 'center' }}>
        <Globe size={40} style={{ marginRight: '10px' }} /> FBAR and FATCA Compliance Tool
      </h1>
      
      {/* FBAR Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <DollarSign size={24} style={{ marginRight: '10px' }} /> FBAR Filing Requirement Calculator
        </h2>
        <p>Calculate if you need to file FBAR based on $10K aggregate threshold (31 USC 5314).</p>
        <div>
          {fbarAccounts.map((account, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Account Name"
                value={account.name}
                onChange={(e) => {
                  const newAccounts = [...fbarAccounts];
                  newAccounts[index] = { ...newAccounts[index], name: e.target.value };
                  setFbarAccounts(newAccounts);
                }}
                style={{ padding: '8px', marginRight: '10px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
              />
              <input
                type="number"
                placeholder="Value"
                value={account.value}
                onChange={(e) => {
                  const newAccounts = [...fbarAccounts];
                  newAccounts[index] = { ...newAccounts[index], value: parseFloat(e.target.value) || 0 };
                  setFbarAccounts(newAccounts);
                }}
                style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
              />
            </div>
          ))}
          <button
            onClick={() => setFbarAccounts([...fbarAccounts, { name: '', value: 0 }])}
            style={{ backgroundColor: '#00bcd4', color: '#1a202c', padding: '10px', marginTop: '10px', borderRadius: '4px' }}
          >
            Add Account
          </button>
        </div>
        <p>Total Value: ${fbarTotal}</p>
        <p style={{ color: fbarTotal > 10000 ? '#ffd700' : '#ffffff' }}>{fbarResult}</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fbarAccounts}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#00bcd4" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* FATCA Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <Shield size={24} style={{ marginRight: '10px' }} /> FATCA Form 8938 Threshold Calculator
        </h2>
        <p>Determine filing requirements based on residency (IRC 6038D).</p>
        <select onChange={(e) => setFatcaResidency(e.target.value)} style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}>
          <option value="domestic">Domestic Resident</option>
          <option value="foreign">Foreign Resident</option>
        </select>
        <input
          type="number"
          placeholder="Total Assets Value"
          onChange={(e) => setFatcaAssets(parseFloat(e.target.value) || 0)}
          style={{ padding: '8px', marginTop: '10px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <p>{fatcaResult}</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={[{name: 'Assets', value: fatcaAssets}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#ffd700" label />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* Foreign Trust Reporting Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <FileText size={24} style={{ marginRight: '10px' }} /> Foreign Trust Reporting (Form 3520/3520-A)
        </h2>
        <p>Check requirements under section 6677.</p>
        <select onChange={(e) => setTrustType(e.target.value)} style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}>
          <option value="">Select Trust Type</option>
          <option value="foreign">Foreign Trust</option>
          <option value="domestic">Domestic Trust</option>
        </select>
        <input
          type="number"
          placeholder="Trust Value"
          onChange={(e) => setTrustValue(parseFloat(e.target.value) || 0)}
          style={{ padding: '8px', marginTop: '10px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <p>{trustResult}</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={[{value: trustValue}]}>
            <Area type="monotone" dataKey="value" stroke="#00bcd4" fill="#ffd700" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* PFIC Reporting Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <TrendingUp size={24} style={{ marginRight: '10px' }} /> PFIC Reporting Requirements
        </h2>
        <p>Under section 1291.</p>
        <input
          type="number"
          placeholder="PFIC Shares"
          onChange={(e) => setPficShares(parseFloat(e.target.value) || 0)}
          style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <input
          type="number"
          placeholder="PFIC Income"
          onChange={(e) => setPficIncome(parseFloat(e.target.value) || 0)}
          style={{ padding: '8px', marginTop: '10px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <p>{pficResult}</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{shares: pficShares, income: pficIncome}]}>
            <Bar dataKey="shares" fill="#00bcd4" />
            <Bar dataKey="income" fill="#ffd700" />
            <XAxis />
            <YAxis />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Foreign Tax Credit Optimizer Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <Percent size={24} style={{ marginRight: '10px' }} /> Foreign Tax Credit Optimizer
        </h2>
        <p>Under section 901.</p>
        <input
          type="number"
          placeholder="Foreign Taxes Paid"
          onChange={(e) => setForeignTaxesPaid(parseFloat(e.target.value) || 0)}
          style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <input
          type="number"
          placeholder="US Taxes Due"
          onChange={(e) => setUsTaxesDue(parseFloat(e.target.value) || 0)}
          style={{ padding: '8px', marginTop: '10px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <p>Optimized Credit: ${creditOptimized}</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie dataKey="value" isAnimationActive={false} data={[{name: 'Credit', value: creditOptimized}]} cx="50%" cy="50%" outerRadius={80} fill="#ffd700" label />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* Treaty Benefit Analyzer Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <ArrowRight size={24} style={{ marginRight: '10px' }} /> Treaty Benefit Analyzer
        </h2>
        <p>Under section 7701(b).</p>
        <input
          type="text"
          placeholder="Treaty Country"
          onChange={(e) => setTreatyCountry(e.target.value)}
          style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <input
          type="text"
          placeholder="Income Type"
          onChange={(e) => setIncomeType(e.target.value)}
          style={{ padding: '8px', marginTop: '10px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <p>{treatyResult}</p>
      </section>

      {/* Streamlined Filing Compliance Program Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <Target size={24} style={{ marginRight: '10px' }} /> Streamlined Filing Compliance Program
        </h2>
        <p>Check eligibility.</p>
        <select onChange={(e) => setStreamlinedEligibility(e.target.value === 'yes')} style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}>
          <option value="no">Not Eligible</option>
          <option value="yes">Eligible</option>
        </select>
        <p>{streamlinedResult}</p>
      </section>

      {/* Voluntary Disclosure Program Comparison Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <Calendar size={24} style={{ marginRight: '10px' }} /> Voluntary Disclosure Program Comparison
        </h2>
        <select onChange={(e) => setVdProgram(e.target.value)} style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}>
          <option value="">Select Program</option>
          <option value="Streamlined">Streamlined</option>
          <option value="OVDP">OVDP</option>
        </select>
        <p>{vdComparison}</p>
      </section>

      {/* 50-Year Penalty Exposure Calculator Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
          <AlertTriangle size={24} style={{ marginRight: '10px' }} /> 50-Year Penalty Exposure Calculator
        </h2>
        <p>Under various sections.</p>
        <input
          type="number"
          placeholder="Years of Exposure"
          onChange={(e) => setPenaltyYears(parseFloat(e.target.value) || 0)}
          style={{ padding: '8px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <input
          type="number"
          placeholder="Annual Penalty Amount"
          onChange={(e) => setPenaltyAmount(parseFloat(e.target.value) || 0)}
          style={{ padding: '8px', marginTop: '10px', backgroundColor: '#4a5568', color: '#fff', border: '1px solid #00bcd4' }}
        />
        <p>{penaltyResult}</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{ exposure: penaltyExposure }]}>
            <Bar dataKey="exposure" fill="#ffd700" />
            <XAxis />
            <YAxis />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Compliance Summary */}
      <section style={{ padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px' }}>
        <h2 style={{ color: '#ffd700' }}>Compliance Summary</h2>
        <p>References: 31 USC 5314 (FBAR), IRC 6038D (FATCA), section 6677 (Foreign Trust), section 1291 (PFIC), section 901 (Foreign Tax Credit), section 7701(b) (Residency).</p>
        <CheckCircle2 size={24} style={{ color: '#00bcd4' }} />
      </section>
      <PageInsights pageId="f-b-a-r-f-a-t-c-a-compliance" />
    </div>
  );
};

export default FBARFATCACompliance;
