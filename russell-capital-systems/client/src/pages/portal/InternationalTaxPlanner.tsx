// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Globe2, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, MapPin, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const InternationalTaxPlanner: React.FC = () => {
  // State for user inputs
  const [foreignIncome, setForeignIncome] = useState(0);
  const [foreignTaxesPaid, setForeignTaxesPaid] = useState(0);
  const [feieAmount, setFeieAmount] = useState(0);
  const [wealthProjectionYears, setWealthProjectionYears] = useState(50);
  const [usTaxRate, setUsTaxRate] = useState(21); // Default US corporate tax rate
  const [foreignTaxRate, setForeignTaxRate] = useState(15);

  // Sample data for 50-year wealth comparison
  const generateWealthData = useMemo(() => {
    const data = [];
    let usWealth = 100000; // Starting US wealth
    let foreignWealth = 80000; // Starting foreign wealth
    const growthRateUS = 0.03; // 3% annual growth
    const growthRateForeign = 0.05; // 5% annual growth after taxes
    for (let year = 2023; year < 2023 + wealthProjectionYears; year++) {
      data.push({
        year,
        usWealth,
        foreignWealth,
      });
      usWealth *= (1 + growthRateUS);
      foreignWealth *= (1 + growthRateForeign - (foreignTaxRate / 100)); // Adjust for foreign taxes
    }
    return data;
  }, [wealthProjectionYears, foreignTaxRate]);

  // Memoized calculation for tax savings comparison
  const taxSavingsComparison = useMemo(() => {
    const ftcSavings = foreignTaxesPaid * (usTaxRate / 100);
    const feieSavings = Math.min(foreignIncome, feieAmount) * (usTaxRate / 100);
    return { ftcSavings, feieSavings };
  }, [foreignIncome, foreignTaxesPaid, feieAmount, usTaxRate]);

  return (
    <div style={{ backgroundColor: 'navy', color: 'gold', padding: '20px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <Globe2 size={32} />
        <h1 style={{ marginLeft: '10px' }}>International Tax Planner for US Persons with Foreign Income/Assets</h1>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center' }}><DollarSign size={24} /> Foreign Tax Credit (FTC) vs Foreign Earned Income Exclusion (FEIE)</h2>
        <p>US persons with foreign income can use FTC to offset US taxes on foreign income or FEIE to exclude up to $112,000 (2023 limit) of foreign earned income. Input your details below:</p>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <input
            type="number"
            placeholder="Foreign Income"
            onChange={(e) => setForeignIncome(parseFloat(e.target.value))}
            style={{ padding: '10px', backgroundColor: 'navy', color: 'gold', border: '1px solid gold' }}
          />
          <input
            type="number"
            placeholder="Foreign Taxes Paid"
            onChange={(e) => setForeignTaxesPaid(parseFloat(e.target.value))}
            style={{ padding: '10px', backgroundColor: 'navy', color: 'gold', border: '1px solid gold' }}
          />
          <input
            type="number"
            placeholder="FEIE Amount"
            onChange={(e) => setFeieAmount(parseFloat(e.target.value))}
            style={{ padding: '10px', backgroundColor: 'navy', color: 'gold', border: '1px solid gold' }}
          />
        </div>
        <p><Shield size={18} /> FTC Savings: ${taxSavingsComparison.ftcSavings.toFixed(2)}</p>
        <p><CheckCircle2 size={18} /> FEIE Savings: ${taxSavingsComparison.feieSavings.toFixed(2)}</p>
        <p>Choose FTC if you have high foreign taxes; FEIE for lower-tax countries, but note limitations on other credits.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center' }}><TrendingUp size={24} /> Treaty Benefits</h2>
        <p>US tax treaties with countries like the UK or Canada reduce double taxation. Benefits include reduced withholding taxes on dividends, interest, and royalties.</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}><ArrowRight size={18} /> Example: US-UK treaty allows 0% withholding on dividends for qualifying residents.</li>
          <li><AlertTriangle size={18} /> Always check for limitations and residency requirements.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center' }}><Percent size={24} /> PFIC Taxation</h2>
        <p>Passive Foreign Investment Companies (PFICs) are foreign corporations with passive income. US owners face complex rules, including the excess distribution regime or QEF elections.</p>
        <p><MapPin size={18} /> For investments in foreign mutual funds, file Form 8621 annually to report and potentially elect for mark-to-market treatment.</p>
        <p>High taxation can erode returns; consider consulting a tax advisor for strategies like making a QEF election early.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center' }}><Target size={24} /> CFC Rules</h2>
        <p>Controlled Foreign Corporations (CFCs) rules under Subpart F income require US shareholders to include certain foreign earnings in their income, even if not distributed.</p>
        <p><FileText size={18} /> US persons owning 10% or more of a foreign corporation must monitor for Subpart F income and GILTI (Global Intangible Low-Taxed Income).</p>
        <p>Example: If a CFC has passive income over $1 million, it may trigger immediate US taxation.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center' }}><FileText size={24} /> Form 5471 and Form 8865</h2>
        <p>Form 5471 is for US persons with interests in foreign corporations (e.g., CFCs). Form 8865 is for foreign partnerships.</p>
        <p><Calendar size={18} /> Filing deadlines: Generally April 15, with extensions. Penalties for non-filing can be severe, up to $10,000 per form.</p>
        <p>Key categories: Category 3 for 10% shareholders, Category 4 for officers. Ensure accurate reporting to avoid IRS scrutiny.</p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center' }}><ArrowRight size={24} /> Transfer Pricing Basics</h2>
        <p>Transfer pricing ensures transactions between related parties (e.g., US parent and foreign subsidiary) are at arm's length to prevent tax avoidance.</p>
        <p><AlertTriangle size={18} /> Common methods: Comparable Uncontrolled Price (CUP), Resale Price Method. Documentation is crucial to defend against IRS adjustments.</p>
        <p>For example, if a US company sells goods to its foreign affiliate, prices must reflect market rates to avoid reallocation of income.</p>
      </section>

      <section>
        <h2 style={{ display: 'flex', alignItems: 'center' }}><TrendingUp size={24} /> 50-Year Cross-Border Wealth Comparison</h2>
        <p>Visualize how cross-border taxes affect wealth growth over 50 years. Adjust parameters above for personalized projections.</p>
        <div style={{ width: '100%', height: '400px', marginBottom: '20px' }}>
          <ResponsiveContainer>
            <AreaChart data={generateWealthData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="usWealth" stroke="gold" fill="navy" />
              <Area type="monotone" dataKey="foreignWealth" stroke="gold" fill="darkgoldenrod" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer>
            <BarChart data={generateWealthData.slice(0, 10)}> {/* Show first 10 years for bar chart */}
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="usWealth" fill="gold" />
              <Bar dataKey="foreignWealth" fill="navy" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: '100%', height: '300px', marginTop: '20px' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={[{name: 'US Wealth', value: generateWealthData[wealthProjectionYears-1]?.usWealth}, {name: 'Foreign Wealth', value: generateWealthData[wealthProjectionYears-1]?.foreignWealth}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="gold" label>
                <Cell key="us" fill="gold" />
                <Cell key="foreign" fill="navy" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p><CheckCircle2 size={18} /> Final Year (Year {2023 + wealthProjectionYears - 1}): US Wealth: ${generateWealthData[wealthProjectionYears-1]?.usWealth.toFixed(2)}, Foreign Wealth: ${generateWealthData[wealthProjectionYears-1]?.foreignWealth.toFixed(2)}</p>
      </section>

      <footer style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px' }}>
        <p>This is a simplified tool for educational purposes. Consult a tax professional for advice.</p>
      </footer>
      <PageInsights section="international-tax-planner" />
    </div>
  );
};

export default InternationalTaxPlanner;