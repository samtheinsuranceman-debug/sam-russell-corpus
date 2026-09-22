// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { FileText, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Users, Percent, ArrowRight, Scale, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const GrantorTrustStrategy = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);

  const chartData = useMemo(() => [
    { year: 0, estateValue: 1000000, frozenValue: 1000000, growth: 0 },
    { year: 1, estateValue: 1050000, frozenValue: 1000000, growth: 50000 },
    { year: 2, estateValue: 1102500, frozenValue: 1000000, growth: 102500 },
    { year: 3, estateValue: 1157625, frozenValue: 1000000, growth: 157625 },
    { year: 4, estateValue: 1215506, frozenValue: 1000000, growth: 215506 },
    { year: 5, estateValue: 1277181, frozenValue: 1000000, growth: 271181 },
    { year: 6, estateValue: 1341839, frozenValue: 1000000, growth: 341839 },
    { year: 7, estateValue: 1409931, frozenValue: 1000000, growth: 409931 },
    { year: 8, estateValue: 1480428, frozenValue: 1000000, growth: 480428 },
    { year: 9, estateValue: 1554850, frozenValue: 1000000, growth: 554850 },
    { year: 10, estateValue: 1632592, frozenValue: 1000000, growth: 632592 },
    { year: 11, estateValue: 1715222, frozenValue: 1000000, growth: 715222 },
    { year: 12, estateValue: 1801983, frozenValue: 1000000, growth: 801983 },
    { year: 13, estateValue: 1892082, frozenValue: 1000000, growth: 892082 },
    { year: 14, estateValue: 1986686, frozenValue: 1000000, growth: 986686 },
    { year: 15, estateValue: 2085020, frozenValue: 1000000, growth: 1085020 },
    { year: 16, estateValue: 2189271, frozenValue: 1000000, growth: 1199271 },
    { year: 17, estateValue: 2298735, frozenValue: 1000000, growth: 1298735 },
    { year: 18, estateValue: 2413671, frozenValue: 1000000, growth: 1413671 },
    { year: 19, estateValue: 2535355, frozenValue: 1000000, growth: 1535355 },
    { year: 20, estateValue: 2662123, frozenValue: 1000000, growth: 1662123 },
  ], []);

  return (
    <div style={{ backgroundColor: '#1a202c', color: '#e6e6e6', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#818cf8', textAlign: 'center', marginBottom: '40px' }}>Grantor Trust Strategy Overview</h1>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 onClick={() => setActiveSection('overview')} style={{ cursor: 'pointer', color: '#ecc94b', display: 'flex', alignItems: 'center' }}>
          <FileText size={24} color="#ecc94b" style={{ marginRight: '10px' }} /> Overview of IDGT vs Standard Grantor Trust
        </h2>
        {activeSection === 'overview' && (
          <div style={{ padding: '15px', backgroundColor: '#2d3748', borderLeft: '4px solid #818cf8' }}>
            <p>An Intentionally Defective Grantor Trust (IDGT) is designed with specific defects under IRC rules to allow the grantor to be treated as the owner for income tax purposes while removing assets from their estate. Unlike a standard grantor trust, which might not provide the same level of estate tax benefits, an IDGT leverages these defects to "burn" income taxes, effectively transferring wealth without additional estate tax liability.</p>
            <p>Key differences include:</p>
            <ul style={{ listStyle: 'none', paddingLeft: '20px' }}>
              <li><TrendingUp color="#ecc94b" style={{ marginRight: '5px' }} /> IDGT: Assets grow outside the grantor's estate.</li>
              <li><Shield color="#ecc94b" style={{ marginRight: '5px' }} /> Standard: May still be included in the estate under Section 2036 if the grantor retains interests.</li>
            </ul>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 onClick={() => setActiveSection('incomeTax')} style={{ cursor: 'pointer', color: '#ecc94b', display: 'flex', alignItems: 'center' }}>
          <DollarSign size={24} color="#ecc94b" style={{ marginRight: '10px' }} /> Income Tax Burn Strategy
        </h2>
        {activeSection === 'incomeTax' && (
          <div style={{ padding: '15px', backgroundColor: '#2d3748', borderLeft: '4px solid #818cf8' }}>
            <p>The income tax burn strategy involves the grantor paying the income taxes on trust income, which allows the trust assets to grow without being reduced by tax obligations. This is particularly effective in an IDGT, as it shifts the tax burden away from the trust beneficiaries.</p>
            <p>Benefits:</p>
            <ul style={{ listStyle: 'none', paddingLeft: '20px' }}>
              <li><CheckCircle2 color="#ecc94b" style={{ marginRight: '5px' }} /> Enhances compound growth by removing tax drag.</li>
              <li><AlertTriangle color="#ecc94b" style={{ marginRight: '5px' }} /> Risks include potential IRS scrutiny if not properly structured.</li>
            </ul>
            <p>Example: If the trust generates $50,000 in income, the grantor pays the taxes, preserving the full amount for growth.</p>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 onClick={() => setActiveSection('swapPower')} style={{ cursor: 'pointer', color: '#ecc94b', display: 'flex', alignItems: 'center' }}>
          <ArrowRight size={24} color="#ecc94b" style={{ marginRight: '10px' }} /> Swap Power (IRC 675)
        </h2>
        {activeSection === 'swapPower' && (
          <div style={{ padding: '15px', backgroundColor: '#2d3748', borderLeft: '4px solid #818cf8' }}>
            <p>Under IRC Section 675, the swap power allows the grantor to exchange assets of equivalent value with the trust. This provides flexibility to adjust the trust's holdings without triggering gift tax.</p>
            <p>Advantages:</p>
            <ul style={{ listStyle: 'none', paddingLeft: '20px' }}>
              <li><Scale color="#ecc94b" style={{ marginRight: '5px' }} /> Maintains balance between trust assets and grantor's portfolio.</li>
              <li><Lock color="#ecc94b" style={{ marginRight: '5px' }} /> Protects against market volatility by swapping appreciating assets.</li>
            </ul>
            <p>Caution: Ensure swaps are at fair market value to avoid recharacterization under IRC rules.</p>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 onClick={() => setActiveSection('seedGift')} style={{ cursor: 'pointer', color: '#ecc94b', display: 'flex', alignItems: 'center' }}>
          <Percent size={24} color="#ecc94b" style={{ marginRight: '10px' }} /> Seed Gift + Installment Sale Structure
        </h2>
        {activeSection === 'seedGift' && (
          <div style={{ padding: '15px', backgroundColor: '#2d3748', borderLeft: '4px solid #818cf8' }}>
            <p>The seed gift involves an initial transfer to the trust, followed by an installment sale where the grantor sells assets to the trust over time. This structure freezes the estate value at the time of the sale.</p>
            <p>Steps:</p>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Make a seed gift to fund the trust (e.g., $100,000).</li>
              <li>Sell appreciating assets via installment, paying with a note.</li>
              <li><Users color="#ecc94b" style={{ marginRight: '5px' }} /> Benefits heirs by transferring future growth outside the estate.</li>
            </ol>
            <p>This can significantly reduce estate taxes over time.</p>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 onClick={() => setActiveSection('projection')} style={{ cursor: 'pointer', color: '#ecc94b', display: 'flex', alignItems: 'center' }}>
          <Calendar size={24} color="#ecc94b" style={{ marginRight: '10px' }} /> 20-Year Estate Freeze Projection
        </h2>
        {activeSection === 'projection' && (
          <div style={{ padding: '15px', backgroundColor: '#2d3748', borderLeft: '4px solid #818cf8' }}>
            <p>This chart projects the estate value over 20 years using an IDGT structure, assuming a 5% annual growth rate for estate assets while freezing the trust value.</p>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <XAxis dataKey="year" stroke="#e6e6e6" />
                <YAxis stroke="#e6e6e6" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="estateValue" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
                <Area type="monotone" dataKey="frozenValue" stroke="#ecc94b" fill="#ecc94b" fillOpacity={0.3} />
                <Area type="monotone" dataKey="growth" stroke="#4fd1c5" fill="#4fd1c5" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
            <p>Key Insight: The frozen value remains constant, allowing significant tax savings.</p>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 onClick={() => setActiveSection('gst')} style={{ cursor: 'pointer', color: '#ecc94b', display: 'flex', alignItems: 'center' }}>
          <Users size={24} color="#ecc94b" style={{ marginRight: '10px' }} /> Generation-Skipping Transfer Tax Planning
        </h2>
        {activeSection === 'gst' && (
          <div style={{ padding: '15px', backgroundColor: '#2d3748', borderLeft: '4px solid #818cf8' }}>
            <p>Generation-skipping transfer (GST) tax planning uses grantor trusts to skip generations, minimizing taxes on transfers to grandchildren. Allocate GST exemption to the trust to cover transfers.</p>
            <p>Strategies:</p>
            <ul style={{ listStyle: 'none', paddingLeft: '20px' }}>
              <li><CheckCircle2 color="#ecc94b" style={{ marginRight: '5px' }} /> Use dynasty trusts for perpetual wealth transfer.</li>
              <li><AlertTriangle color="#ecc94b" style={{ marginRight: '5px' }} /> Monitor annual exclusion limits and lifetime exemptions.</li>
            </ul>
            <p>This can preserve wealth across multiple generations effectively.</p>
          </div>
        )}
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 onClick={() => setActiveSection('compliance')} style={{ cursor: 'pointer', color: '#ecc94b', display: 'flex', alignItems: 'center' }}>
          <Shield size={24} color="#ecc94b" style={{ marginRight: '10px' }} /> Compliance with IRC Rules
        </h2>
        {activeSection === 'compliance' && (
          <div style={{ padding: '15px', backgroundColor: '#2d3748', borderLeft: '4px solid #818cf8' }}>
            <p>Ensure compliance with IRC 671-679 for grantor trust rules, which define when the grantor is treated as the owner. Avoid retained interests under Section 2036, which could pull assets back into the estate.</p>
            <p>Key Sections:</p>
            <ul style={{ listStyle: 'none', paddingLeft: '20px' }}>
              <li><Lock color="#ecc94b" style={{ marginRight: '5px' }} /> IRC 671-679: Covers administrative powers and potential defects.</li>
              <li><AlertTriangle color="#ecc94b" style={{ marginRight: '5px' }} /> Section 2036: Retained life estate could invalidate the trust.</li>
              <li><Scale color="#ecc94b" style={{ marginRight: '5px' }} /> Section 2702: Special valuation for transfers of interests in trusts.</li>
            </ul>
            <p>Regular reviews with tax professionals are essential to maintain compliance and avoid penalties.</p>
          </div>
        )}
      </section>
      
      <button onClick={() => setShowDetails(!showDetails)} style={{ backgroundColor: '#818cf8', color: '#1a202c', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        {showDetails ? 'Hide Details' : 'Show More Details'}
      </button>
      {showDetails && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#2d3748' }}>
          <p>Additional notes: Always consult with a qualified estate planning attorney. This strategy assumes a 5% growth rate for projections, which may vary based on market conditions. Ensure all transactions are documented to withstand IRS audits.</p>
          <p>Potential risks include changes in tax laws, such as modifications to IRC sections, which could impact the effectiveness of IDGTs.</p>
        </div>
      )}
      <PageInsights section="grantor-trust-strategy" />
    </div>
  );
};

export default GrantorTrustStrategy;
