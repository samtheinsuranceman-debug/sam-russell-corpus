// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Heart, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const PrivateFoundationPlanner = () => {
  const [foundationAssets, setFoundationAssets] = useState(1000000); // Example state for assets in dollars
  const [dafAssets, setDafAssets] = useState(500000); // Example for DAF comparison
  const [grantAllocation, setGrantAllocation] = useState([
    { name: 'Education', value: 40 },
    { name: 'Health', value: 30 },
    { name: 'Environment', value: 20 },
    { name: 'Poverty', value: 10 },
  ]);

  const COLORS = ['#6c5ce7', '#ffd700', '#74b9ff', '#e84393']; // Purple and gold accents

  const setupCostData = useMemo(() => [
    { name: 'Legal Fees', foundation: 5000, daf: 1000 },
    { name: 'Administrative Setup', foundation: 2000, daf: 500 },
    { name: 'Initial Filing', foundation: 1000, daf: 0 },
    { name: 'Total', foundation: 8000, daf: 1500 },
  ], []);

  const projectionData = useMemo(() => [
    { year: 2023, impact: 5, growth: 2 },
    { year: 2024, impact: 6, growth: 2.5 },
    { year: 2025, impact: 7, growth: 3 },
    { year: 2026, impact: 8, growth: 3.5 },
    { year: 2027, impact: 9, growth: 4 },
    { year: 2028, impact: 10, growth: 4.5 },
    { year: 2029, impact: 11, growth: 5 },
    { year: 2030, impact: 12, growth: 5.5 },
    { year: 2031, impact: 13, growth: 6 },
    { year: 2032, impact: 14, growth: 6.5 },
    { year: 2033, impact: 15, growth: 7 },
    { year: 2034, impact: 16, growth: 7.5 },
    { year: 2035, impact: 17, growth: 8 },
    { year: 2036, impact: 18, growth: 8.5 },
    { year: 2037, impact: 19, growth: 9 },
    { year: 2038, impact: 20, growth: 9.5 },
    { year: 2039, impact: 21, growth: 10 },
    { year: 2040, impact: 22, growth: 10.5 },
    { year: 2041, impact: 23, growth: 11 },
    { year: 2042, impact: 24, growth: 11.5 },
    { year: 2043, impact: 25, growth: 12 },
    { year: 2044, impact: 26, growth: 12.5 },
    { year: 2045, impact: 27, growth: 13 },
    { year: 2046, impact: 28, growth: 13.5 },
    { year: 2047, impact: 29, growth: 14 },
    { year: 2048, impact: 30, growth: 14.5 },
    { year: 2049, impact: 31, growth: 15 },
    { year: 2050, impact: 32, growth: 15.5 },
    { year: 2051, impact: 33, growth: 16 },
    { year: 2052, impact: 34, growth: 16.5 },
  ], []);

  const distributionRequirement = 0.05 * foundationAssets; // 5% of assets

  return (
    <div style={{ backgroundColor: '#2c2c54', color: '#f8f9fa', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#6c5ce7', textAlign: 'center' }}>Private Foundation vs. DAF Planner</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffd700' }}><Building2 size={24} /> Private Foundation Setup Cost Analysis</h2>
        <p>This section analyzes the initial costs for setting up a private foundation versus a Donor-Advised Fund (DAF). Private foundations often require higher upfront investments due to legal and administrative requirements.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={setupCostData}>
            <XAxis dataKey="name" stroke="#f8f9fa" />
            <YAxis stroke="#f8f9fa" />
            <Tooltip />
            <Legend />
            <Bar dataKey="foundation" fill="#6c5ce7" name="Foundation Cost" />
            <Bar dataKey="daf" fill="#ffd700" name="DAF Cost" />
          </BarChart>
        </ResponsiveContainer>
        <p>Estimated total setup for foundation: ${setupCostData[3].foundation}. For DAF: ${setupCostData[3].daf}.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffd700' }}><Percent size={24} /> 5% Minimum Distribution Requirement</h2>
        <p>Under IRC rules, private foundations must distribute at least 5% of their net investment assets annually for charitable purposes. For assets of ${foundationAssets}, this equals approximately ${distributionRequirement.toFixed(2)}.</p>
        <p><CheckCircle2 size={18} /> Benefits: Ensures ongoing charitable impact. <AlertTriangle size={18} /> Risks: Failure to meet this can result in excise taxes.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffd700' }}><DollarSign size={24} /> Excise Tax on Investment Income (IRC 4940)</h2>
        <p>Private foundations are subject to a 1-2% excise tax on their net investment income. This tax is designed to fund oversight and ensure compliance with charitable purposes.</p>
        <p><Shield size={18} /> Key Points: Investment income from stocks, bonds, and other assets is taxed, reducing the foundation's overall funds available for grants.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffd700' }}><Scale size={24} /> Self-Dealing Rules (IRC 4941)</h2>
        <p>IRC 4941 prohibits transactions between the foundation and disqualified persons (e.g., founders, family members). Violations can lead to significant penalties.</p>
        <p><Heart size={18} /> Example: A founder cannot sell personal property to the foundation at a discount without facing taxes.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffd700' }}><ArrowRight size={24} /> Foundation vs. DAF Side-by-Side Comparison</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ backgroundColor: '#333', padding: '20px', borderRadius: '8px', width: '45%' }}>
            <h3 style={{ color: '#6c5ce7' }}>Private Foundation</h3>
            <ul>
              <li><TrendingUp size={16} /> Greater control over investments.</li>
              <li><Calendar size={16} /> Can last indefinitely.</li>
              <li><Target size={16} /> Ideal for family legacy.</li>
              <li><AlertTriangle size={16} /> Higher administrative costs.</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#333', padding: '20px', borderRadius: '8px', width: '45%' }}>
            <h3 style={{ color: '#ffd700' }}>DAF</h3>
            <ul>
              <li><TrendingUp size={16} /> Lower setup costs.</li>
              <li><Calendar size={16} /> Simpler administration.</li>
              <li><Target size={16} /> Quick to establish.</li>
              <li><AlertTriangle size={16} /> Less control over funds.</li>
            </ul>
          </div>
        </div>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffd700' }}><Heart size={24} /> Family Employment Benefits</h2>
        <p>Private foundations allow family members to be employed, providing benefits like salaries and involvement in decision-making. However, compensation must be reasonable to avoid self-dealing penalties under IRC 4941.</p>
        <p><CheckCircle2 size={18} /> Pros: Builds family unity and expertise. <AlertTriangle size={18} /> Cons: Strict IRS scrutiny on payments.</p>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffd700' }}><Calendar size={24} /> 30-Year Charitable Impact Projection</h2>
        <p>This AreaChart projects the charitable impact over 30 years, assuming steady growth in distributions and investments.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={projectionData}>
            <XAxis dataKey="year" stroke="#f8f9fa" />
            <YAxis stroke="#f8f9fa" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="impact" stroke="#6c5ce7" fill="#6c5ce7" />
            <Area type="monotone" dataKey="growth" stroke="#ffd700" fill="#ffd700" />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#ffd700' }}><PieChart size={24} /> Grant Allocation Pie Chart</h2>
        <p>Visualize how grants are allocated across different causes. You can adjust allocations via state if needed.</p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={grantAllocation}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {grantAllocation.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>
      
      <section>
        <h2 style={{ color: '#ffd700' }}><Shield size={24} /> Compliance Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <h3>IRC 501(c)(3)</h3>
            <p>Establishes tax-exempt status for charitable organizations. Must operate exclusively for exempt purposes.</p>
          </div>
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <h3>Section 4940 Excise Tax</h3>
            <p>Imposes tax on net investment income to ensure foundations contribute to society.</p>
          </div>
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <h3>Section 4941 Self-Dealing</h3>
            <p>Prohibits insider transactions to maintain integrity.</p>
          </div>
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <h3>Section 4942 Minimum Distribution</h3>
            <p>Requires at least 5% annual payout for charitable activities.</p>
          </div>
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <h3>Section 4943 Excess Business Holdings</h3>
            <p>Limits ownership in businesses to prevent undue influence.</p>
          </div>
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <h3>Section 4944 Jeopardizing Investments</h3>
            <p>Forbids investments that risk the foundation's assets excessively.</p>
          </div>
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <h3>Section 4945 Taxable Expenditures</h3>
            <p>Penalizes non-charitable expenditures, ensuring funds are used appropriately.</p>
          </div>
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <h3>Section 170(b)(1)(B) 30% AGI Limit</h3>
            <p>Caps deductions for donations at 30% of adjusted gross income.</p>
          </div>
        </div>
      </section>
      
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#6c5ce7' }}>
        <p>Powered by comprehensive planning tools for charitable giving.</p>
      </footer>
      <PageInsights section="private-foundation-planner" />
    </div>
  );
};

export default PrivateFoundationPlanner;
