// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Gift, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Heart, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const DAFStrategicPlanner = () => {
  const [bunchingYears, setBunchingYears] = useState(3); // 2, 3, or 5 years
  const [contributionAmount, setContributionAmount] = useState(10000); // Annual contribution
  const [stockValue, setStockValue] = useState(5000); // Appreciated stock value
  const [stockBasis, setStockBasis] = useState(2000); // Stock basis
  const [agi, setAgi] = useState(100000); // Adjusted Gross Income
  const [investmentReturn, setInvestmentReturn] = useState(0.07); // Annual return rate
  const [grantYear, setGrantYear] = useState(2024); // Grant scheduling year
  const [allocationCharityA, setAllocationCharityA] = useState(40); // Percentage for charity A
  const [allocationCharityB, setAllocationCharityB] = useState(30); // Percentage for charity B
  const [allocationCharityC, setAllocationCharityC] = useState(30); // Percentage for charity C

  // Memoized calculations
  const bunchingSavings = useMemo(() => {
    const taxRate = 0.24; // Assumed 24% tax bracket
    return bunchingYears * contributionAmount * taxRate; // Simplified savings calculation
  }, [bunchingYears, contributionAmount]);

  const stockDeduction = useMemo(() => {
    const capitalGainsAvoided = stockValue - stockBasis;
    return stockValue; // FMV deduction for appreciated stock
  }, [stockValue, stockBasis]);

  const dafVsDirect = useMemo(() => {
    const dafTaxSavings = contributionAmount * 0.24; // Tax deduction via DAF
    const directTaxSavings = contributionAmount * 0.12; // Lower deduction for direct
    return { dafSavings: dafTaxSavings, directSavings: directTaxSavings };
  }, [contributionAmount]);

  const investmentGrowth = useMemo(() => {
    let balance = contributionAmount;
    const years = 20;
    const projections = Array.from({ length: years }, (_, i) => {
      balance *= (1 + investmentReturn);
      return { year: i + 1, growth: balance };
    });
    return projections;
  }, [contributionAmount, investmentReturn]);

  const allocationData = useMemo(() => [
    { name: 'Charity A', value: allocationCharityA },
    { name: 'Charity B', value: allocationCharityB },
    { name: 'Charity C', value: allocationCharityC },
  ], [allocationCharityA, allocationCharityB, allocationCharityC]);

  const COLORS = ['#00b4d8', '#ffbf00', '#4caf50']; // Teal, Amber, Green accents

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', padding: '40px', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ color: '#00b4d8', textAlign: 'center' }}><Gift size={32} /> DAF Strategic Planner</h1>
      
      {/* Section 1: DAF Bunching Strategy Calculator */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffbf00' }}><TrendingUp size={24} /> DAF Bunching Strategy Calculator</h2>
        <p>Optimize your donations by bunching contributions into 2-year, 3-year, or 5-year cycles to maximize tax deductions.</p>
        <label style={{ display: 'block', margin: '10px 0' }}>Bunching Cycle (Years): 
          <select value={bunchingYears} onChange={(e) => setBunchingYears(Number(e.target.value))} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #00b4d8' }}>
            <option value={2}>2 Years</option>
            <option value={3}>3 Years</option>
            <option value={5}>5 Years</option>
          </select>
        </label>
        <label style={{ display: 'block', margin: '10px 0' }}>Annual Contribution Amount: $
          <input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(Number(e.target.value))} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #ffbf00' }} />
        </label>
        <p style={{ color: '#00b4d8' }}>Estimated Tax Savings: ${bunchingSavings.toFixed(2)}</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{ name: '2yr', savings: 2 * contributionAmount * 0.24 }, { name: '3yr', savings: 3 * contributionAmount * 0.24 }, { name: '5yr', savings: 5 * contributionAmount * 0.24 }]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="savings" fill="#ffbf00" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Section 2: Appreciated Stock Contribution Optimizer */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><DollarSign size={24} /> Appreciated Stock Contribution Optimizer</h2>
        <p>Avoid capital gains taxes by donating appreciated stocks. Deduct the full fair market value (FMV) under IRC 170(e)(1)(A).</p>
        <label style={{ display: 'block', margin: '10px 0' }}>Stock Fair Market Value: $
          <input type="number" value={stockValue} onChange={(e) => setStockValue(Number(e.target.value))} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #00b4d8' }} />
        </label>
        <label style={{ display: 'block', margin: '10px 0' }}>Stock Basis: $
          <input type="number" value={stockBasis} onChange={(e) => setStockBasis(Number(e.target.value))} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #ffbf00' }} />
        </label>
        <p style={{ color: '#ffbf00' }}>Deductible Amount (FMV): ${stockDeduction.toFixed(2)}</p>
        <p>Capital Gains Avoided: ${(stockValue - stockBasis).toFixed(2)}</p>
      </section>

      {/* Section 3: DAF vs Direct Giving Comparison */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffbf00' }}><ArrowRight size={24} /> DAF vs Direct Giving Comparison</h2>
        <p>Compare tax benefits: DAF allows for immediate deductions, while direct giving may limit them.</p>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div>
            <h3 style={{ color: '#00b4d8' }}>DAF Giving</h3>
            <p>Tax Savings: ${dafVsDirect.dafSavings.toFixed(2)}</p>
            <CheckCircle2 size={20} color="#4caf50" />
          </div>
          <div>
            <h3 style={{ color: '#ffbf00' }}>Direct Giving</h3>
            <p>Tax Savings: ${dafVsDirect.directSavings.toFixed(2)}</p>
            <AlertTriangle size={20} color="#ffbf00" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={[{ type: 'DAF', savings: dafVsDirect.dafSavings }, { type: 'Direct', savings: dafVsDirect.directSavings }]}>
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="savings" fill="#00b4d8" />
            <Line dataKey="savings" stroke="#ffbf00" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* Section 4: Investment Growth Inside DAF */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Zap size={24} /> Investment Growth Inside DAF</h2>
        <p>Grow your contributions tax-free within the DAF. Annual return rate: {investmentReturn * 100}%</p>
        <label style={{ display: 'block', margin: '10px 0' }}>Annual Return Rate: 
          <input type="number" value={investmentReturn * 100} onChange={(e) => setInvestmentReturn(Number(e.target.value) / 100)} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #ffbf00' }} />%
        </label>
        <p>Projected Balance After 20 Years: ${investmentGrowth[19].growth.toFixed(2)}</p>
      </section>

      {/* Section 5: Grant Scheduling Timeline */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffbf00' }}><Calendar size={24} /> Grant Scheduling Timeline</h2>
        <p>Schedule grants for future years to optimize cash flow and impact.</p>
        <label style={{ display: 'block', margin: '10px 0' }}>Grant Year: 
          <input type="number" value={grantYear} onChange={(e) => setGrantYear(Number(e.target.value))} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #00b4d8' }} />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p>Grants Scheduled for {grantYear}: ${contributionAmount * 0.5}</p>
          <Calendar size={20} color="#ffbf00" />
        </div>
      </section>

      {/* Section 6: 20-Year DAF Growth Projection */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#00b4d8' }}><Target size={24} /> 20-Year DAF Growth Projection</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={investmentGrowth}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="growth" stroke="#ffbf00" fill="#00b4d8" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Section 7: Contribution Allocation Pie Chart */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffbf00' }}><Percent size={24} /> Contribution Allocation</h2>
        <p>Allocate your contributions across charities.</p>
        <label style={{ display: 'block', margin: '10px 0' }}>Charity A (%): 
          <input type="number" value={allocationCharityA} onChange={(e) => setAllocationCharityA(Number(e.target.value))} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #00b4d8' }} />
        </label>
        <label style={{ display: 'block', margin: '10px 0' }}>Charity B (%): 
          <input type="number" value={allocationCharityB} onChange={(e) => setAllocationCharityB(Number(e.target.value))} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #ffbf00' }} />
        </label>
        <label style={{ display: 'block', margin: '10px 0' }}>Charity C (%): 
          <input type="number" value={allocationCharityC} onChange={(e) => setAllocationCharityC(Number(e.target.value))} style={{ marginLeft: '10px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #4caf50' }} />
        </label>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
              {allocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* Section 8: Compliance Information */}
      <section>
        <h2 style={{ color: '#00b4d8' }}><Shield size={24} /> Compliance Guidelines</h2>
        <p>Ensure your DAF strategy complies with IRS rules:</p>
        <ul style={{ listStyle: 'none' }}>
          <li><CheckCircle2 size={18} color="#4caf50" /> IRC 170(e)(1)(A): FMV deduction for appreciated stock donations.</li>
          <li><AlertTriangle size={18} color="#ffbf00" /> Section 4966: Taxable distributions if not to qualified charities.</li>
          <li><Heart size={18} color="#00b4d8" /> Section 4967: Prohibited benefits to donors or advisors.</li>
          <li><Target size={18} color="#4caf50" /> Section 170(b)(1)(A): 60% AGI limit for cash contributions.</li>
          <li><Percent size={18} color="#ffbf00" /> Section 170(b)(1)(C): 30% AGI limit for appreciated property.</li>
        </ul>
        <p>AGI Limit Check: Cash Limit = {agi * 0.60}, Appreciated Property Limit = {agi * 0.30}</p>
      </section>
      <PageInsights section="d-a-f-strategic-planner" />
    </div>
  );
};

export default DAFStrategicPlanner;
