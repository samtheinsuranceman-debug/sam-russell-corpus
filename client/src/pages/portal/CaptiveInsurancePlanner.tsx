// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Lock, Umbrella } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function CaptiveInsurancePlanner() {
  const [premiumAmount, setPremiumAmount] = useState(0);
  const [riskDistribution, setRiskDistribution] = useState(0);
  const [actuarialPremium, setActuarialPremium] = useState(0);
  const [domicile, setDomicile] = useState('Vermont');
  const [investmentYears, setInvestmentYears] = useState(50);
  const [auditRiskLevel, setAuditRiskLevel] = useState(0);

  const dataForCharts = useMemo(() => [
    { name: 'Year 1', CaptiveCost: 500000, CommercialCost: 600000, InvestmentGrowth: 100000 },
    { name: 'Year 2', CaptiveCost: 520000, CommercialCost: 620000, InvestmentGrowth: 120000 },
    { name: 'Year 3', CaptiveCost: 540000, CommercialCost: 640000, InvestmentGrowth: 140000 },
    { name: 'Year 4', CaptiveCost: 560000, CommercialCost: 660000, InvestmentGrowth: 160000 },
    { name: 'Year 5', CaptiveCost: 580000, CommercialCost: 680000, InvestmentGrowth: 180000 },
    { name: 'Year 10', CaptiveCost: 600000, CommercialCost: 700000, InvestmentGrowth: 200000 },
    { name: 'Year 20', CaptiveCost: 620000, CommercialCost: 720000, InvestmentGrowth: 220000 },
    { name: 'Year 30', CaptiveCost: 640000, CommercialCost: 740000, InvestmentGrowth: 240000 },
    { name: 'Year 40', CaptiveCost: 660000, CommercialCost: 760000, InvestmentGrowth: 260000 },
    { name: 'Year 50', CaptiveCost: 680000, CommercialCost: 780000, InvestmentGrowth: 280000 },
  ], []);

  const wealthBuildingData = useMemo(() => [
    { year: 0, wealth: 0 },
    { year: 5, wealth: 500000 },
    { year: 10, wealth: 1500000 },
    { year: 15, wealth: 3000000 },
    { year: 20, wealth: 5000000 },
    { year: 25, wealth: 7500000 },
    { year: 30, wealth: 11000000 },
    { year: 35, wealth: 15000000 },
    { year: 40, wealth: 20000000 },
    { year: 45, wealth: 26000000 },
    { year: 50, wealth: 33000000 },
  ], []);

  const auditRiskData = useMemo(() => [
    { factor: 'Listed Transaction', risk: 80 },
    { factor: 'Risk Shifting', risk: 60 },
    { factor: 'Premium Limits', risk: 40 },
    { factor: 'Compliance', risk: 30 },
  ], []);

  return (
    <div className="dark-theme bg-[#0a0f1a] text-white min-h-screen p-8">
      <header className="flex items-center mb-8">
        <Building2 className="mr-2 text-red-500" size={24} />
        <h1 className="text-3xl font-bold text-gold-400">Captive Insurance Company Planning and Analysis Tool</h1>
      </header>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <Shield className="mr-2 text-red-500" size={20} /> 831(b) Micro-Captive Election
        </h2>
        <p className="mb-4">The 831(b) election allows a captive insurance company to elect not to pay income tax on underwriting profits up to a $2.65M premium limit. This is ideal for small businesses seeking tax advantages.</p>
        <div className="mb-4">
          <label className="block mb-2">Enter Premium Amount (up to $2.65M):</label>
          <input
            type="number"
            value={premiumAmount}
            onChange={(e) => setPremiumAmount(Number(e.target.value))}
            className="p-2 rounded bg-[#0d1526] border border-red-500 text-white"
            placeholder="Enter amount"
          />
        </div>
        <p className="text-gold-400">Current Premium: ${premiumAmount.toLocaleString()}</p>
        <ul className="list-disc pl-5">
          <li>Ensures risk distribution across multiple lines.</li>
          <li>Requires at least 12 unrelated risks for compliance.</li>
          <li>Actuarial analysis is crucial to determine fair premiums.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <Target className="mr-2 text-red-500" size={20} /> Risk Distribution Requirements
        </h2>
        <p className="mb-4">Risk distribution must involve spreading risks across multiple insureds or policies to qualify as insurance. Input your risk distribution percentage:</p>
        <input
          type="number"
          value={riskDistribution}
          onChange={(e) => setRiskDistribution(Number(e.target.value))}
          className="p-2 rounded bg-[#0d1526] border border-gold-400 text-white"
          placeholder="Enter percentage (0-100)"
        />
        <p className="text-red-500 mt-2">Required: At least 50% for IRC compliance.</p>
        <ul className="list-disc pl-5">
          <li>Distribute risks to avoid concentration.</li>
          <li>Commonly achieved through reinsurance or multiple policies.</li>
          <li>Failure can lead to IRS scrutiny under Rev. Rul. 2002-89.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <Percent className="mr-2 text-red-500" size={20} /> Actuarial Premium Determination
        </h2>
        <p className="mb-4">Actuarial methods ensure premiums are reasonable and based on actual risk. Enter estimated actuarial premium:</p>
        <input
          type="number"
          value={actuarialPremium}
          onChange={(e) => setActuarialPremium(Number(e.target.value))}
          className="p-2 rounded bg-[#0d1526] border border-gold-400 text-white"
          placeholder="Enter premium"
        />
        <p className="text-gold-400 mt-2">Actuarial Premium: ${actuarialPremium.toLocaleString()}</p>
        <ul className="list-disc pl-5">
          <li>Use historical data for accurate projections.</li>
          <li>Must align with IRS guidelines to avoid audits.</li>
          <li>Compare with commercial rates for validation.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <Umbrella className="mr-2 text-red-500" size={20} /> Captive Domicile Comparison
        </h2>
        <p className="mb-4">Compare popular domiciles: Vermont, Delaware, and Cayman Islands.</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[#0d1526] rounded">
            <h3 className="text-xl">Vermont</h3>
            <ul className="list-disc pl-5">
              <li>US-based, easy compliance.</li>
              <li>Lower setup costs.</li>
              <li>Strong regulatory framework.</li>
            </ul>
          </div>
          <div className="p-4 bg-[#0d1526] rounded">
            <h3 className="text-xl">Delaware</h3>
            <ul className="list-disc pl-5">
              <li>Business-friendly laws.</li>
              <li>Tax advantages for domestic captives.</li>
              <li>Proximity to major financial centers.</li>
            </ul>
          </div>
          <div className="p-4 bg-[#0d1526] rounded">
            <h3 className="text-xl">Cayman Islands</h3>
            <ul className="list-disc pl-5">
              <li>Tax-neutral environment.</li>
              <li>International appeal.</li>
              <li>Potential for section 953(d) election.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <DollarSign className="mr-2 text-red-500" size={20} /> Captive vs Commercial Insurance Cost Analysis
        </h2>
        <p className="mb-4">Analyze costs over time using this chart.</p>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={dataForCharts}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="CaptiveCost" fill="#ef4444" name="Captive Cost" />
            <Bar dataKey="CommercialCost" fill="#f59e0b" name="Commercial Cost" />
            <Line type="monotone" dataKey="InvestmentGrowth" stroke="#fbbf24" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <TrendingUp className="mr-2 text-red-500" size={20} /> Investment Income Accumulation
        </h2>
        <p className="mb-4">Captives allow for tax-deferred investment growth. Enter years for projection:</p>
        <input
          type="number"
          value={investmentYears}
          onChange={(e) => setInvestmentYears(Number(e.target.value))}
          className="p-2 rounded bg-[#0d1526] border border-gold-400 text-white"
          placeholder="Enter years (e.g., 50)"
        />
        <p className="text-gold-400 mt-2">Projected over {investmentYears} years.</p>
        <ul className="list-disc pl-5">
          <li>Accumulate income without immediate taxation.</li>
          <li>Reinvest premiums for long-term growth.</li>
          <li>Potential for significant wealth building.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <Calendar className="mr-2 text-red-500" size={20} /> 50-Year Wealth Building Through Captive
        </h2>
        <p className="mb-4">Visualize wealth accumulation over 50 years.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={wealthBuildingData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="wealth" stroke="#ef4444" fill="#f59e0b" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-2 text-gold-400">Starting from zero, potential wealth reaches $33M in 50 years with proper management.</p>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <AlertTriangle className="mr-2 text-red-500" size={20} /> IRS Audit Risk Assessment
        </h2>
        <p className="mb-4">Assess risks related to listed transactions under Notice 2016-66.</p>
        <input
          type="number"
          value={auditRiskLevel}
          onChange={(e) => setAuditRiskLevel(Number(e.target.value))}
          className="p-2 rounded bg-[#0d1526] border border-red-500 text-white"
          placeholder="Enter risk level (0-100)"
        />
        <p className="text-red-500 mt-2">Current Audit Risk: {auditRiskLevel}%</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={auditRiskData}>
            <XAxis dataKey="factor" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="risk" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
        <ul className="list-disc pl-5">
          <li>High risk if not meeting risk shifting requirements.</li>
          <li>Avoid structures that resemble abusive tax shelters.</li>
          <li>Consult experts to mitigate concerns.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center text-2xl font-semibold mb-4">
          <Lock className="mr-2 text-red-500" size={20} /> Compliance Overview
        </h2>
        <p className="mb-4">Ensure adherence to key IRS regulations.</p>
        <ul className="list-disc pl-5">
          <li><CheckCircle2 className="inline mr-2" size={16} /> IRC 831(b): Small insurance company election for tax exemption.</li>
          <li><CheckCircle2 className="inline mr-2" size={16} /> Section 501(c)(15): Tax-exempt status for small insurers.</li>
          <li><CheckCircle2 className="inline mr-2" size={16} /> Section 953(d): Election for domestic treatment of foreign captives.</li>
          <li><AlertTriangle className="inline mr-2" size={16} /> Notice 2016-66: Avoid listed transactions to prevent audits.</li>
          <li><Shield className="inline mr-2" size={16} /> Rev. Rul. 2002-89: Ensure genuine risk shifting and distribution.</li>
        </ul>
        <p className="text-gold-400 mt-2">Non-compliance can lead to penalties and audits. Always seek professional advice.</p>
      </section>

      <footer className="text-center text-[#7a95b8]">
        <p>Developed for educational purposes. Data is illustrative and not financial advice.</p>
      </footer>
      <PageInsights section="captive-insurance-planner" />
    </div>
  );
}
