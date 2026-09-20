// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Building2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function Section1031AdvancedExchange() {
    const [activeSection, setActiveSection] = useState('forward');
    const [showDetails, setShowDetails] = useState(false);

    const forwardExchangeData = useMemo(() => [
        { step: 'Day 0', description: 'Property Sold', value: 100 },
        { step: 'Day 45', description: 'Identification Deadline', value: 80 },
        { step: 'Day 180', description: 'Closing Deadline', value: 60 },
    ], []);

    const reverseExchangeData = useMemo(() => [
        { phase: 'Acquisition', days: 45, risk: 20 },
        { phase: 'Parking', days: 180, risk: 15 },
        { phase: 'Exchange', days: 365, risk: 10 },
    ], []);

    const bootCalculationData = useMemo(() => [
        { scenario: 'No Boot', taxImpact: 0, bootAmount: 0 },
        { scenario: 'Partial Boot', taxImpact: 15000, bootAmount: 50000 },
        { scenario: 'Full Boot', taxImpact: 30000, bootAmount: 100000 },
    ], []);

    const multiPropertyRulesData = useMemo(() => [
        { rule: '3-Property Rule', properties: 3, percentage: 100, compliance: 95 },
        { rule: '200% Rule', properties: 5, percentage: 200, compliance: 90 },
        { rule: '95% Rule', properties: 10, percentage: 95, compliance: 85 },
    ], []);

    const wealthComparisonData = useMemo(() => [
        { year: 0, chainWealth: 1000000, sellWealth: 1000000 },
        { year: 5, chainWealth: 1200000, sellWealth: 950000 },
        { year: 10, chainWealth: 1500000, sellWealth: 900000 },
        { year: 15, chainWealth: 1800000, sellWealth: 850000 },
        { year: 20, chainWealth: 2200000, sellWealth: 800000 },
        { year: 25, chainWealth: 2700000, sellWealth: 750000 },
        { year: 30, chainWealth: 3300000, sellWealth: 700000 },
        { year: 35, chainWealth: 4000000, sellWealth: 650000 },
        { year: 40, chainWealth: 4800000, sellWealth: 600000 },
        { year: 45, chainWealth: 5700000, sellWealth: 550000 },
        { year: 50, chainWealth: 6700000, sellWealth: 500000 },
    ], []);

    return (
        <div style={{ backgroundColor: '#121212', color: '#ffffff', padding: '40px', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
            <h1 style={{ color: '#4CAF50', fontSize: '2.5em', marginBottom: '20px' }}><TrendingUp /> Advanced 1031 Exchange Strategies</h1>
            <p style={{ color: '#a0a0a0', marginBottom: '30px' }}>Explore sophisticated real estate exchange techniques under IRC Section 1031, including timelines, variations, and long-term impacts. This guide covers forward, reverse, and improvement exchanges with compliance insights.</p>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em', cursor: 'pointer' }} onClick={() => setActiveSection('forward')}><ArrowRightLeft /> Forward Exchange Timeline</h2>
                {activeSection === 'forward' && (
                    <div>
                        <p style={{ color: '#e0e0e0' }}>In a forward 1031 exchange, you sell your relinquished property and identify a replacement within 45 days, then close on it within 180 days. This structure allows for tax deferral on gains.</p>
                        <ul style={{ color: '#c0c0c0', listStyle: 'none', paddingLeft: '0' }}>
                            <li style={{marginBottom: '10px', color: '#4CAF50', marginRight: '10px'}}><Calendar /> 45-Day Identification Period: You must identify up to three properties of like-kind that are of equal or greater value.</li>
                            <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><Clock /> 180-Day Closing Deadline: The exchange must be completed within 180 days from the sale of the original property to qualify.</li>
                            <li style={{marginBottom: '10px', color: '#ff9800', marginRight: '10px'}}><AlertTriangle /> Failure to meet these deadlines results in the loss of tax-deferred status, potentially triggering immediate capital gains tax.</li>
                        </ul>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={forwardExchangeData}>
                                <XAxis dataKey="step" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="value" stroke="#4CAF50" fill="#4CAF50" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em', cursor: 'pointer' }} onClick={() => setActiveSection('reverse')}><ArrowRight /> Reverse Exchange (Parking Arrangement)</h2>
                {activeSection === 'reverse' && (
                    <div>
                        <p style={{ color: '#e0e0e0' }}>A reverse exchange involves acquiring the replacement property before selling the relinquished one, often using a parking arrangement via an exchange accommodation titleholder (EAT).</p>
                        <ul style={{ color: '#c0c0c0', listStyle: 'none', paddingLeft: '0' }}>
                            <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><Building2 /> Parking Arrangement: The EAT holds the replacement property temporarily, allowing you to sell your original property within the guidelines.</li>
                            <li style={{marginBottom: '10px', color: '#4CAF50', marginRight: '10px'}}><Shield /> Rev. Proc. 2000-37: This provides safe harbor for reverse exchanges, ensuring compliance if structured properly.</li>
                            <li style={{marginBottom: '10px', color: '#ff9800', marginRight: '10px'}}><AlertTriangle /> Risks: High costs and strict timelines; the property must be transferred within 180 days.</li>
                        </ul>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reverseExchangeData}>
                                <XAxis dataKey="phase" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="days" fill="#4CAF50" />
                                <Bar dataKey="risk" fill="#795548" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em' }}><Target /> Improvement Exchange</h2>
                <p style={{ color: '#e0e0e0' }}>An improvement exchange allows you to use exchange funds to improve the replacement property before the exchange is complete, deferring taxes on the original sale.</p>
                <ul style={{ color: '#c0c0c0', listStyle: 'none', paddingLeft: '0' }}>
                    <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><DollarSign /> Process: Funds are held by a qualified intermediary for improvements, ensuring the final property meets or exceeds the relinquished property's value.</li>
                    <li style={{marginBottom: '10px', color: '#4CAF50', marginRight: '10px'}}><CheckCircle2 /> Benefits: Enhances property value without immediate tax liability, ideal for value-add strategies.</li>
                    <li style={{marginBottom: '10px', color: '#ff9800', marginRight: '10px'}}><AlertTriangle /> Compliance: Must adhere to Reg. 1.1031(k)-1 for deferred exchanges to avoid boot.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em' }}><Percent /> Drop-and-Swap from Partnership</h2>
                <p style={{ color: '#e0e0e0' }}>Drop-and-swap involves transferring partnership interests to individual ownership before executing a 1031 exchange, allowing for like-kind treatment.</p>
                <ul style={{ color: '#c0c0c0', listStyle: 'none', paddingLeft: '0' }}>
                    <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><ArrowRightLeft /> Steps: Drop the property from the partnership and swap it for a like-kind asset, ensuring no boot is received.</li>
                    <li style={{marginBottom: '10px', color: '#4CAF50', marginRight: '10px'}}><Shield /> Tax Impact: Defer gains as long as the exchange qualifies under Section 1031(a)(2), excluding certain properties.</li>
                    <li style={{marginBottom: '10px', color: '#ff9800', marginRight: '10px'}}><AlertTriangle /> Considerations: Partnership agreements must allow for the drop, and the swap must be arms-length.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em' }}><Building2 /> Delaware Statutory Trust (DST) as Replacement</h2>
                <p style={{ color: '#e0e0e0' }}>Using a DST as a replacement property allows investors to defer taxes while gaining fractional ownership in larger assets.</p>
                <ul style={{ color: '#c0c0c0', listStyle: 'none', paddingLeft: '0' }}>
                    <li style={{marginBottom: '10px', color: '#4CAF50', marginRight: '10px'}}><CheckCircle2 /> Advantages: Provides liquidity and diversification without managing the property directly.</li>
                    <li style={{marginBottom: '10px', color: '#ff9800', marginRight: '10px'}}><AlertTriangle /> Limitations: DSTs are passive investments; you cannot make improvements post-exchange.</li>
                    <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><Shield /> Compliance: Must qualify as like-kind under TCJA real property limitations.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em' }}><DollarSign /> Boot Calculation and Tax Impact</h2>
                <p style={{ color: '#e0e0e0' }}>Boot refers to non-like-kind property received, which is taxable. Calculate it as the difference in value or cash received.</p>
                <ul style={{ color: '#c0c0c0', listStyle: 'none', paddingLeft: '0' }}>
                    <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><Percent /> Formula: Boot = Cash Received + Non-Like-Kind Property Value.</li>
                    <li style={{marginBottom: '10px', color: '#ff9800', marginRight: '10px'}}><AlertTriangle /> Tax Impact: Results in capital gains tax on the boot amount, reducing deferral benefits.</li>
                </ul>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bootCalculationData}>
                        <XAxis dataKey="scenario" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="taxImpact" fill="#4CAF50" />
                        <Bar dataKey="bootAmount" fill="#795548" />
                    </BarChart>
                </ResponsiveContainer>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em' }}><Target /> Multi-Property Identification Rules</h2>
                <p style={{ color: '#e0e0e0' }}>When identifying multiple properties, follow these rules to stay compliant.</p>
                <ul style={{ color: '#c0c0c0', listStyle: 'none', paddingLeft: '0' }}>
                    <li style={{marginBottom: '10px', color: '#4CAF50', marginRight: '10px'}}><CheckCircle2 /> 3-Property Rule: Identify up to three properties regardless of value.</li>
                    <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><Percent /> 200% Rule: Identify any number if their total fair market value doesn't exceed 200% of the relinquished property.</li>
                    <li style={{marginBottom: '10px', color: '#ff9800', marginRight: '10px'}}><AlertTriangle /> 95% Rule: If over 200%, you must acquire 95% of the identified value.</li>
                </ul>
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={multiPropertyRulesData}>
                        <XAxis dataKey="rule" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="properties" fill="#4CAF50" />
                        <Line type="monotone" dataKey="percentage" stroke="#795548" />
                    </ComposedChart>
                </ResponsiveContainer>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em' }}><TrendingUp /> 50-Year Wealth Comparison (1031 Chain vs. Sell and Pay)</h2>
                <p style={{ color: '#e0e0e0' }}>A 1031 exchange chain preserves wealth by deferring taxes, compared to selling and paying taxes outright.</p>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={wealthComparisonData}>
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="chainWealth" stroke="#4CAF50" />
                        <Line type="monotone" dataKey="sellWealth" stroke="#795548" />
                    </ComposedChart>
                </ResponsiveContainer>
                <p style={{ color: '#c0c0c0' }}>Over 50 years, the 1031 chain retains more value due to compounded growth without tax drag.</p>
            </section>

            <section>
                <h2 style={{ color: '#4CAF50', fontSize: '1.8em' }}><Shield /> Compliance Overview</h2>
                <ul style={{ color: '#c0c0c0', listStyle: 'none', paddingLeft: '0' }}>
                    <li style={{marginBottom: '10px', color: '#4CAF50', marginRight: '10px'}}><CheckCircle2 /> IRC 1031: Defines like-kind exchanges for real property.</li>
                    <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><Shield /> Reg. 1.1031(k)-1: Outlines deferred exchange rules.</li>
                    <li style={{marginBottom: '10px', color: '#ff9800', marginRight: '10px'}}><AlertTriangle /> Rev. Proc. 2000-37: Safe harbor for reverse exchanges.</li>
                    <li style={{marginBottom: '10px', color: '#4CAF50', marginRight: '10px'}}><Percent /> Section 1031(a)(2): Excludes certain properties like inventory.</li>
                    <li style={{marginBottom: '10px', color: '#795548', marginRight: '10px'}}><Building2 /> TCJA: Limits to real property exchanges only.</li>
                </ul>
            </section>
      <PageInsights section="section1031-advanced-exchange" />
        </div>
    );
}
