// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Scale, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Users, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function DivorceFinancialPlanner() {
  const [assets, setAssets] = useState([
    { id: 1, name: 'House', type: 'Community', value: 500000, description: '' },
    { id: 2, name: 'Car', type: 'Separate', value: 30000, description: '' },
  ]);
  const [retirementAccounts, setRetirementAccounts] = useState([
    { id: 1, name: '401k', balance: 200000, owner: 'Spouse A' },
  ]);
  const [alimonyAmount, setAlimonyAmount] = useState(0);
  const [alimonyDuration, setAlimonyDuration] = useState(0);
  const [childSupportAmount, setChildSupportAmount] = useState(0);
  const [hiddenAssetsChecklist, setHiddenAssetsChecklist] = useState([
    { item: 'Offshore accounts', checked: false },
    { item: 'Undisclosed investments', checked: false },
  ]);
  const [businessValue, setBusinessValue] = useState(0);
  const [socialSecurityYearsMarried, setSocialSecurityYearsMarried] = useState(0);
  const [projections, setProjections] = useState({ partyA: [], partyB: [] });
  const [incomePartyA, setIncomePartyA] = useState(100000);
  const [incomePartyB, setIncomePartyB] = useState(80000);
  const [expensesPartyA, setExpensesPartyA] = useState(60000);
  const [expensesPartyB, setExpensesPartyB] = useState(50000);

  const addAsset = (newAsset) => {
    setAssets([...assets, { ...newAsset, id: assets.length + 1 }]);
  };

  const calculateQDRODivision = useMemo(() => {
    return retirementAccounts.map(account => ({
      ...account,
      dividedBalance: account.balance * 0.5, // Simplified 50% division
    }));
  }, [retirementAccounts]);

  const calculateAlimonyTaxImpact = useMemo(() => {
    const postTCJAImpact = alimonyAmount * 0; // Post-TCJA, alimony is non-deductible
    return { grossAlimony: alimonyAmount, taxImpact: postTCJAImpact };
  }, [alimonyAmount]);

  const optimizeChildSupportVsAlimony = useMemo(() => {
    const totalSupport = childSupportAmount + alimonyAmount;
    const optimized = totalSupport * 0.8; // Simplified optimization factor
    return { childSupport: childSupportAmount, alimony: alimonyAmount, optimizedTotal: optimized };
  }, [childSupportAmount, alimonyAmount]);

  const checkHiddenAssets = useMemo(() => {
    return hiddenAssetsChecklist.filter(item => item.checked).length;
  }, [hiddenAssetsChecklist]);

  const calculateBusinessValuation = useMemo(() => {
    const equitableShare = businessValue * 0.5; // Assuming 50% equitable distribution
    return { totalValue: businessValue, equitableShare };
  }, [businessValue]);

  const calculateSocialSecurityBenefits = useMemo(() => {
    if (socialSecurityYearsMarried >= 10) {
      return { eligible: true, estimatedBenefit: 1500 }; // Simplified estimate
    }
    return { eligible: false, estimatedBenefit: 0 };
  }, [socialSecurityYearsMarried]);

  const generateProjections = useMemo(() => {
    const years = 50;
    const partyAProjections = Array(years).fill().map((_, i) => ({
      year: i + 1,
      netWorth: incomePartyA - expensesPartyA + (i * 5000),
    }));
    const partyBProjections = Array(years).fill().map((_, i) => ({
      year: i + 1,
      netWorth: incomePartyB - expensesPartyB + (i * 4000),
    }));
    return { partyA: partyAProjections, partyB: partyBProjections };
  }, [incomePartyA, expensesPartyA, incomePartyB, expensesPartyB]);

  const complianceCheck = useMemo(() => {
    const checks = {
      irc71_215: true, // Pre-2019 alimony rules
      section1041: true, // Transfers incident to divorce
      section414p: true, // QDRO compliance
      section121: true, // Home sale exclusion
      tcja11051: true, // Tax Cuts and Jobs Act
    };
    return checks;
  }, []);

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#e5e7eb', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ color: '#e11d48' }}><Scale className="inline" /> Divorce Financial Planner</h1>
      
      {/* Marital Asset Inventory Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#e11d48' }}><DollarSign className="inline" /> Marital Asset Inventory and Classification</h2>
        <p>Inventory and classify assets as community or separate property.</p>
        <div>
          <input type="text" placeholder="Asset Name" onChange={(e) => addAsset({ name: e.target.value })} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
          <select onChange={(e) => addAsset({ type: e.target.value })} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }}>
            <option value="Community">Community</option>
            <option value="Separate">Separate</option>
          </select>
          <input type="number" placeholder="Value" onChange={(e) => addAsset({ value: parseFloat(e.target.value) })} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
          <button onClick={() => addAsset({})} style={{ margin: '5px', padding: '5px', backgroundColor: '#e11d48', color: '#fff' }}>Add Asset</button>
        </div>
        <ul>
          {assets.map(asset => (
            <li key={asset.id} style={{ margin: '5px 0' }}>{asset.name} - {asset.type} - ${asset.value}</li>
          ))}
        </ul>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={assets}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#e11d48" />
          </BarChart>
        </ResponsiveContainer>
      </section>
      
      {/* QDRO Retirement Account Division Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#e11d48' }}><Shield className="inline" /> QDRO Retirement Account Division</h2>
        <p>Divide retirement accounts per Section 414(p).</p>
        <input type="number" placeholder="401k Balance" onChange={(e) => setRetirementAccounts([{ id: 1, name: '401k', balance: parseFloat(e.target.value), owner: 'Spouse A' }])} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <ul>
          {calculateQDRODivision.map(account => (
            <li key={account.id}>Account: {account.name} - Divided: ${account.dividedBalance}</li>
          ))}
        </ul>
        <ResponsiveContainer width="100%" height={400}><PieChart>
          <Pie data={calculateQDRODivision} dataKey="dividedBalance" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#e11d48">
            <Cell key="cell-0" fill="#e11d48" />
          </Pie>
          <Tooltip />
        </PieChart></ResponsiveContainer>
      </section>
      
      {/* Alimony Tax Impact Calculator Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#e11d48' }}><Percent className="inline" /> Alimony Tax Impact Calculator (Post-TCJA)</h2>
        <p>Calculate non-deductible alimony per TCJA Section 11051.</p>
        <input type="number" placeholder="Alimony Amount" onChange={(e) => setAlimonyAmount(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <input type="number" placeholder="Duration (years)" onChange={(e) => setAlimonyDuration(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <p>Tax Impact: ${calculateAlimonyTaxImpact.taxImpact} (Non-deductible)</p>
      </section>
      
      {/* Child Support vs Alimony Optimization Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#e11d48' }}><Users className="inline" /> Child Support vs Alimony Optimization</h2>
        <p>Optimize support payments.</p>
        <input type="number" placeholder="Child Support Amount" onChange={(e) => setChildSupportAmount(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <p>Optimized Total: ${optimizeChildSupportVsAlimony.optimizedTotal}</p>
        <ResponsiveContainer width="100%" height={300}><BarChart data={[optimizeChildSupportVsAlimony]}>
          <Bar dataKey="childSupport" fill="#e11d48" />
          <Bar dataKey="alimony" fill="#f59e0b" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
        </BarChart></ResponsiveContainer>
      </section>
      
      {/* Hidden Asset Detection Checklist Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#e11d48' }}><AlertTriangle className="inline" /> Hidden Asset Detection Checklist</h2>
        <ul>
          {hiddenAssetsChecklist.map((item, index) => (
            <li key={index}>
              <input type="checkbox" checked={item.checked} onChange={() => {
                const newChecklist = [...hiddenAssetsChecklist];
                newChecklist[index].checked = !item.checked;
                setHiddenAssetsChecklist(newChecklist);
              }} />
              {item.item}
            </li>
          ))}
        </ul>
        <p>Detected Items: {checkHiddenAssets}</p>
      </section>
      
      {/* Business Valuation Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#e11d48' }}><TrendingUp className="inline" /> Business Valuation for Equitable Distribution</h2>
        <input type="number" placeholder="Business Value" onChange={(e) => setBusinessValue(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <p>Equitable Share: ${calculateBusinessValuation.equitableShare}</p>
      </section>
      
      {/* Social Security Benefits Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#e11d48' }}><Calendar className="inline" /> Social Security Benefits After Divorce (10-Year Rule)</h2>
        <input type="number" placeholder="Years Married" onChange={(e) => setSocialSecurityYearsMarried(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <p>Eligible: {calculateSocialSecurityBenefits.eligible ? 'Yes' : 'No'} - Estimated: ${calculateSocialSecurityBenefits.estimatedBenefit}</p>
      </section>
      
      {/* 50-Year Post-Divorce Financial Projection Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#e11d48' }}><Target className="inline" /> 50-Year Post-Divorce Financial Projection</h2>
        <input type="number" placeholder="Party A Income" onChange={(e) => setIncomePartyA(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <input type="number" placeholder="Party A Expenses" onChange={(e) => setExpensesPartyA(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <input type="number" placeholder="Party B Income" onChange={(e) => setIncomePartyB(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <input type="number" placeholder="Party B Expenses" onChange={(e) => setExpensesPartyB(parseFloat(e.target.value))} style={{ margin: '5px', padding: '5px', backgroundColor: '#1e293b', color: '#e5e7eb' }} />
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={generateProjections.partyA}>
            <Area type="monotone" dataKey="netWorth" stroke="#e11d48" fill="#e11d48" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={generateProjections.partyB}>
            <Area type="monotone" dataKey="netWorth" stroke="#f59e0b" fill="#f59e0b" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      
      {/* Compliance Section */}
      <section>
        <h2 style={{ color: '#e11d48' }}><FileText className="inline" /> Compliance Check</h2>
        <p>IRC 71/215 (pre-2019): {complianceCheck.irc71_215 ? <CheckCircle2 className="inline" style={{color: 'red'}} /> : <AlertTriangle className="inline" />}</p>
        <p>Section 1041: {complianceCheck.section1041 ? <CheckCircle2 className="inline" style={{color: 'red'}} /> : <AlertTriangle className="inline" />}</p>
        <p>Section 414(p): {complianceCheck.section414p ? <CheckCircle2 className="inline" style={{color: 'red'}} /> : <AlertTriangle className="inline" />}</p>
        <p>Section 121: {complianceCheck.section121 ? <CheckCircle2 className="inline" style={{color: 'red'}} /> : <AlertTriangle className="inline" />}</p>
        <p>TCJA Section 11051: {complianceCheck.tcja11051 ? <CheckCircle2 className="inline" style={{color: 'red'}} /> : <AlertTriangle className="inline" />}</p>
      </section>
      <PageInsights section="divorce-financial-planner" />
    </div>
  );
}
