// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Shield, DollarSign, TrendingUp, Heart, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Lock, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

function ILITDeepDive() {
    const [activeSection, setActiveSection] = useState('introduction');
    const [showDetails, setShowDetails] = useState(false);

    const chartData = useMemo(() => [
        { year: 0, benefit: 1000000, premium: 50000 },
        { year: 1, benefit: 1050000, premium: 52000 },
        { year: 2, benefit: 1100000, premium: 54000 },
        { year: 3, benefit: 1150000, premium: 56000 },
        { year: 4, benefit: 1200000, premium: 58000 },
        { year: 5, benefit: 1250000, premium: 60000 },
        { year: 6, benefit: 1300000, premium: 62000 },
        { year: 7, benefit: 1350000, premium: 64000 },
        { year: 8, benefit: 1400000, premium: 66000 },
        { year: 9, benefit: 1450000, premium: 68000 },
        { year: 10, benefit: 1500000, premium: 70000 },
        { year: 11, benefit: 1550000, premium: 72000 },
        { year: 12, benefit: 1600000, premium: 74000 },
        { year: 13, benefit: 1650000, premium: 76000 },
        { year: 14, benefit: 1700000, premium: 78000 },
        { year: 15, benefit: 1750000, premium: 80000 },
        { year: 16, benefit: 1800000, premium: 82000 },
        { year: 17, benefit: 1850000, premium: 84000 },
        { year: 18, benefit: 1900000, premium: 86000 },
        { year: 19, benefit: 1950000, premium: 88000 },
        { year: 20, benefit: 2000000, premium: 90000 },
        { year: 21, benefit: 2050000, premium: 92000 },
        { year: 22, benefit: 2100000, premium: 94000 },
        { year: 23, benefit: 2150000, premium: 96000 },
        { year: 24, benefit: 2200000, premium: 98000 },
        { year: 25, benefit: 2250000, premium: 100000 },
        { year: 26, benefit: 2300000, premium: 102000 },
        { year: 27, benefit: 2350000, premium: 104000 },
        { year: 28, benefit: 2400000, premium: 106000 },
        { year: 29, benefit: 2450000, premium: 108000 },
        { year: 30, benefit: 2500000, premium: 110000 },
    ], []);

    return (
        <div style={{ backgroundColor: '#1a202c', color: '#ffffff', padding: '40px', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
            <h1 style={{color: '#38a169', textAlign: 'center', marginBottom: '40px', verticalAlign: 'middle'}}>Irrevocable Life Insurance Trust (ILIT) Deep Dive <Shield size={32} /></h1>

            <button onClick={() => setShowDetails(!showDetails)} style={{ backgroundColor: '#e3342f', color: '#ffffff', padding: '10px 20px', border: 'none', borderRadius: '5px', marginBottom: '20px' }}>
                Toggle Detailed Sections
            </button>

            {showDetails && (
                <>
                    <section style={{ marginBottom: '40px' }}>
                        <h2 onClick={() => setActiveSection('introduction')} style={{cursor: 'pointer', color: '#e3342f'}}>Introduction to ILIT <DollarSign size={24} /></h2>
                        {activeSection === 'introduction' && (
                            <div>
                                <p>An Irrevocable Life Insurance Trust (ILIT) is a powerful estate planning tool designed to exclude life insurance proceeds from the grantor's estate, thereby minimizing estate taxes. This section explores the core benefits and setup.</p>
                                <p>Key advantages include asset protection, wealth transfer, and tax efficiency. ILITs often incorporate various strategies for optimization.</p>
                                <ul style={{ color: '#ffffff' }}>
                                    <li><TrendingUp size={18} /> Growth potential through policy investments.</li>
                                    <li><Heart size={18} /> Provides liquidity for heirs without probate.</li>
                                    <li><Lock size={18} /> Shields assets from creditors.</li>
                                </ul>
                            </div>
                        )}
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 onClick={() => setActiveSection('structure')} style={{cursor: 'pointer', color: '#e3342f'}}>ILIT Structure with Crummey Powers and 5x5 Lapse <Users size={24} /></h2>
                        {activeSection === 'structure' && (
                            <div>
                                <p>The ILIT structure involves an irrevocable trust that holds a life insurance policy. Crummey powers allow beneficiaries to withdraw contributions, making gifts to the trust qualify as present interests under tax law.</p>
                                <p>The 5x5 lapse rule permits beneficiaries to withdraw up to $5,000 or 5% of the trust's value annually without affecting the grantor's estate, enhancing flexibility.</p>
                                <ul>
                                    <li><CheckCircle2 size={18} /> Crummey powers ensure compliance with gift tax exclusions.</li>
                                    <li><AlertTriangle size={18} /> 5x5 lapse helps in managing trust assets without triggering estate inclusion.</li>
                                    <li><Calendar size={18} /> Timing of withdrawals is critical for tax benefits.</li>
                                </ul>
                                <p>Detailed example: If a grantor contributes $50,000, beneficiaries have a window to withdraw, but typically don't, allowing the funds to purchase insurance.</p>
                            </div>
                        )}
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 onClick={() => setActiveSection('secondToDie')} style={{cursor: 'pointer', color: '#e3342f'}}>Second-to-Die Policy Optimization <Heart size={24} /></h2>
                        {activeSection === 'secondToDie' && (
                            <div>
                                <p>Second-to-die policies, also known as survivorship policies, pay out upon the death of the second insured, often spouses. This optimization within an ILIT defers payouts and reduces premiums.</p>
                                <p>Benefits include lower costs compared to individual policies and better alignment with estate tax planning.</p>
                                <ul>
                                    <li><Target size={18} /> Ideal for married couples to cover estate taxes upon both deaths.</li>
                                    <li><Percent size={18} /> Premiums are often lower due to shared risk.</li>
                                    <li><ArrowRight size={18} /> Proceeds can fund liquidity needs without selling assets.</li>
                                </ul>
                                <p>Optimization strategy: Use ILIT to hold the policy, ensuring it's not part of the estate, thus maximizing the death benefit leverage.</p>
                            </div>
                        )}
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 onClick={() => setActiveSection('premiumFinancing')} style={{cursor: 'pointer', color: '#e3342f'}}>Premium Financing within ILIT <DollarSign size={24} /></h2>
                        {activeSection === 'premiumFinancing' && (
                            <div>
                                <p>Premium financing involves borrowing funds to pay life insurance premiums, with the ILIT as the beneficiary. This strategy leverages low-interest loans to enhance cash flow.</p>
                                <p>Within an ILIT, this can amplify wealth transfer by allowing the trust to repay loans using policy proceeds.</p>
                                <ul>
                                    <li><Lock size={18} /> Protects the policy from the grantor's creditors.</li>
                                    <li><TrendingUp size={18} /> Potential for arbitrage if loan rates are lower than policy returns.</li>
                                    <li><AlertTriangle size={18} /> Risks include interest rate changes and loan repayment obligations.</li>
                                </ul>
                                <p>Example: A $1 million policy with financed premiums could result in a $2 million death benefit, minus loan costs, providing net gains for beneficiaries.</p>
                            </div>
                        )}
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 onClick={() => setActiveSection('dynasty')} style={{cursor: 'pointer', color: '#e3342f'}}>Dynasty ILIT for Multi-Generational Wealth <Users size={24} /></h2>
                        {activeSection === 'dynasty' && (
                            <div>
                                <p>A dynasty ILIT is designed for perpetual wealth transfer across generations, often using generation-skipping transfer (GST) tax exemptions.</p>
                                <p>This structure ensures that assets grow tax-free and benefit descendants indefinitely.</p>
                                <ul>
                                    <li><Heart size={18} /> Preserves family wealth without estate tax erosion.</li>
                                    <li><Calendar size={18} /> Can span multiple decades with proper planning.</li>
                                    <li><Shield size={18} /> Shields against divorce or creditor claims for future generations.</li>
                                </ul>
                                <p>Key consideration: Ensure the trust is irrevocable and includes provisions for trustee discretion to adapt to changing laws.</p>
                            </div>
                        )}
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 onClick={() => setActiveSection('projection')} style={{cursor: 'pointer', color: '#e3342f'}}>30-Year Death Benefit Leverage Projection <Target size={24} /></h2>
                        {activeSection === 'projection' && (
                            <div>
                                <p>This projection illustrates the growth of death benefits over 30 years, factoring in premiums and leverage.</p>
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={chartData}>
                                        <Area type="monotone" dataKey="benefit" stroke="#e3342f" fill="#e3342f99" />
                                        <Area type="monotone" dataKey="premium" stroke="#38a169" fill="#38a16999" />
                                        <XAxis dataKey="year" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <p>Analysis: The benefit grows exponentially, leveraging the policy's cash value, while premiums increase linearly.</p>
                            </div>
                        )}
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 onClick={() => setActiveSection('estateTax')} style={{cursor: 'pointer', color: '#e3342f'}}>Estate Tax Liquidity Analysis <Percent size={24} /></h2>
                        {activeSection === 'estateTax' && (
                            <div>
                                <p>ILITs provide liquidity to cover estate taxes without liquidating other assets. This analysis evaluates how proceeds can offset tax liabilities.</p>
                                <p>For a $10 million estate, ILIT proceeds could cover up to 40% in taxes, preserving the rest for heirs.</p>
                                <ul>
                                    <li><CheckCircle2 size={18} /> Ensures quick access to funds post-death.</li>
                                    <li><AlertTriangle size={18} /> Must account for potential changes in tax laws.</li>
                                    <li><ArrowRight size={18} /> Integration with other strategies like gifting reduces overall tax burden.</li>
                                </ul>
                                <p>Detailed breakdown: Assume a 40% estate tax rate; ILIT benefits directly reduce the taxable estate value.</p>
                            </div>
                        )}
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 onClick={() => setActiveSection('compliance')} style={{cursor: 'pointer', color: '#e3342f'}}>Compliance and Legal Considerations <AlertTriangle size={24} /></h2>
                        {activeSection === 'compliance' && (
                            <div>
                                <p>Ensuring ILIT compliance is crucial to avoid unintended tax consequences.</p>
                                <ul>
                                    <li><Lock size={18} /> IRC 2042: Incidents of ownership must be relinquished to exclude proceeds from the estate.</li>
                                    <li><Calendar size={18} /> Section 2035 three-year rule: Transfers within three years of death may be included in the estate.</li>
                                    <li><CheckCircle2 size={18} /> Crummey v. Commissioner: Establishes that withdrawal rights qualify gifts as present interests.</li>
                                    <li><Percent size={18} /> Section 2503(b): Gifts must be of present interest to qualify for annual exclusions.</li>
                                    <li><Shield size={18} /> Section 2514: Powers of appointment allow beneficiaries limited control without estate inclusion.</li>
                                </ul>
                                <p>Best practices: Work with an estate attorney to draft the trust and monitor for compliance.</p>
                            </div>
                        )}
                    </section>
                </>
            )}
      <PageInsights section="i-l-i-t-deep-dive" />
        </div>
    );
}

export default ILITDeepDive;
