// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Handshake, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, ArrowRight, Target, Users, Scale, Award, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const BuySellAgreement: React.FC = () => {
  const [activeSection, setActiveSection] = useState('structures');
  const taxData = useMemo(() => [
    { name: 'Cross-Purchase', TaxSavings: 50, TaxLiability: 30 },
    { name: 'Entity Redemption', TaxSavings: 40, TaxLiability: 40 },
    { name: 'Wait-and-See', TaxSavings: 45, TaxLiability: 35 },
  ], []);

  const insurancePremiumData = useMemo(() => [
    { year: 1, premiums: 5000, growth: 1000 },
    { year: 2, premiums: 5200, growth: 1200 },
    { year: 3, premiums: 5400, growth: 1400 },
    { year: 4, premiums: 5600, growth: 1600 },
    { year: 5, premiums: 5800, growth: 1800 },
  ], []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-teal-400 mb-4 flex items-center">
          <Handshake className="mr-2" /> Buy-Sell Agreements for Physician Practices and Business Partnerships
        </h1>
        <p className="text-[#94a3b8]">This page provides a comprehensive overview of buy-sell agreements, including structures, funding, valuation, triggers, tax implications, and IRS compliance. Designed for financial advisors and business owners.</p>
      </header>

      <nav className="mb-8 flex space-x-4">
        <button
          onClick={() => setActiveSection('structures')}
          className={`px-4 py-2 rounded ${activeSection === 'structures' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-[#94a3b8]'}`}
        >
          Structures
        </button>
        <button
          onClick={() => setActiveSection('funding')}
          className={`px-4 py-2 rounded ${activeSection === 'funding' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-[#94a3b8]'}`}
        >
          Funding
        </button>
        <button
          onClick={() => setActiveSection('valuation')}
          className={`px-4 py-2 rounded ${activeSection === 'valuation' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-[#94a3b8]'}`}
        >
          Valuation
        </button>
        <button
          onClick={() => setActiveSection('triggers')}
          className={`px-4 py-2 rounded ${activeSection === 'triggers' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-[#94a3b8]'}`}
        >
          Triggers
        </button>
        <button
          onClick={() => setActiveSection('tax')}
          className={`px-4 py-2 rounded ${activeSection === 'tax' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-[#94a3b8]'}`}
        >
          Tax & Compliance
        </button>
      </nav>

      {activeSection === 'structures' && (
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-amber-400 mb-6 flex items-center">
            <DollarSign className="mr-2" /> Buy-Sell Structures
          </h2>
          <p className="mb-4 text-[#94a3b8]">Buy-sell agreements outline how ownership interests are transferred in physician practices or business partnerships. Here are the three main structures:</p>
          
          <div className="space-y-6">
            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <ArrowRight className="mr-2" /> Cross-Purchase
              </h3>
              <p className="text-[#7a95b8]">In this structure, remaining owners purchase the shares of the departing owner. It's ideal for smaller partnerships as it allows for direct control and potential step-up in basis advantages.</p>
              <ul className="list-disc pl-5 mt-2 text-[#94a3b8]">
                <li>Pros: Simplicity, tax benefits for buyers.</li>
                <li>Cons: Requires each owner to hold insurance policies on others.</li>
              </ul>
            </div>

            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <ArrowRight className="mr-2" /> Entity Redemption
              </h3>
              <p className="text-[#7a95b8]">The business entity itself buys back the shares from the departing owner, using company funds or insurance. This is common in larger practices for ease of administration.</p>
              <ul className="list-disc pl-5 mt-2 text-[#94a3b8]">
                <li>Pros: Centralized process, less administrative burden on owners.</li>
                <li>Cons: Potential double taxation issues.</li>
              </ul>
            </div>

            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <ArrowRight className="mr-2" /> Wait-and-See
              </h3>
              <p className="text-[#7a95b8]">This hybrid approach allows the agreement to decide at the time of the trigger event whether it's a cross-purchase or entity redemption, providing flexibility.</p>
              <ul className="list-disc pl-5 mt-2 text-[#94a3b8]">
                <li>Pros: Adaptable to changing circumstances.</li>
                <li>Cons: Can lead to disputes if not clearly defined.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeSection === 'funding' && (
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-amber-400 mb-6 flex items-center">
            <Shield className="mr-2" /> Funding Mechanisms
          </h2>
          <p className="mb-4 text-[#94a3b8]">Funding ensures the buy-sell agreement can be executed smoothly. Common methods include:</p>
          
          <div className="space-y-6">
            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <CheckCircle2 className="mr-2" /> Life Insurance
              </h3>
              <p className="text-[#7a95b8]">Life insurance policies fund the purchase upon death, providing tax-free proceeds for buyers.</p>
            </div>

            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <AlertTriangle className="mr-2" /> Disability Buyout
              </h3>
              <p className="text-[#7a95b8]">Disability insurance covers buyouts if an owner becomes disabled, ensuring continuity.</p>
            </div>

            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <TrendingUp className="mr-2" /> Installment
              </h3>
              <p className="text-[#7a95b8]">Payments made over time, often with interest, to fund the agreement without upfront costs.</p>
            </div>

            <div className="my-8">
              <h3 className="text-xl text-amber-300">Insurance Premium Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={insurancePremiumData}>
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="premiums" stroke="#14b8a6" fill="#14b8a6" />
                  <Area type="monotone" dataKey="growth" stroke="#fbbf24" fill="#fbbf24" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {activeSection === 'valuation' && (
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-amber-400 mb-6 flex items-center">
            <Scale className="mr-2" /> Valuation Methods
          </h2>
          <p className="mb-4 text-[#94a3b8]">Valuation determines the price of ownership interests. Key methods:</p>
          
          <div className="space-y-6">
            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <Award className="mr-2" /> Fixed Price
              </h3>
              <p className="text-[#7a95b8]">A predetermined price set in the agreement, simple but may not reflect current value.</p>
            </div>

            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <Target className="mr-2" /> Formula
              </h3>
              <p className="text-[#7a95b8]">Uses a formula based on financial metrics like earnings or assets for dynamic valuation.</p>
            </div>

            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300 flex items-center mb-2">
                <Users className="mr-2" /> Appraisal
              </h3>
              <p className="text-[#7a95b8]">Independent appraisal at the time of the event for accurate, fair market value.</p>
            </div>
          </div>
        </section>
      )}

      {activeSection === 'triggers' && (
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-amber-400 mb-6 flex items-center">
            <Lock className="mr-2" /> Trigger Events
          </h2>
          <p className="mb-4 text-[#94a3b8]">Events that activate the buy-sell agreement include:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#94a3b8]">
            <li><TrendingUp className="inline mr-2" /> Death of an owner</li>
            <li><AlertTriangle className="inline mr-2" /> Disability of an owner</li>
            <li><Shield className="inline mr-2" /> Retirement</li>
            <li><Users className="inline mr-2" /> Divorce</li>
            <li><DollarSign className="inline mr-2" /> Bankruptcy</li>
          </ul>
        </section>
      )}

      {activeSection === 'tax' && (
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-amber-400 mb-6 flex items-center">
            <CheckCircle2 className="mr-2" /> Tax Implications and IRS Compliance
          </h2>
          <p className="mb-4 text-[#94a3b8]">Tax considerations vary by structure. Here's a comparison:</p>
          
          <div className="my-8">
            <h3 className="text-xl text-teal-300">Tax Implications Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={taxData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="TaxSavings" fill="#14b8a6" /> {/* Teal accent */}
                <Bar dataKey="TaxLiability" fill="#fbbf24" /> {/* Amber accent */}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300">Step-Up in Basis for Cross-Purchase</h3>
              <p className="text-[#7a95b8]">Under IRC Section 1014, cross-purchase allows heirs a step-up in basis, reducing capital gains tax on future sales.</p>
            </div>

            <div className="p-6 bg-[#0d1526] rounded-lg shadow-lg">
              <h3 className="text-2xl font-medium text-teal-300">IRS Compliance</h3>
              <ul className="list-disc pl-5 text-[#94a3b8]">
                <li>IRC Section 2703: Ensures valuation isn't artificially low to avoid taxes.</li>
                <li>Section 302: Covers stock redemptions and their tax treatments.</li>
                <li>Section 1014: Provides step-up in basis for inherited property.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-12 text-gray-500 text-center">
        <p>Developed for financial advisory platforms. All content for educational purposes only.</p>
      </footer>
      <PageInsights section="buy-sell-agreement" />
    </div>
  );
};

export default BuySellAgreement;
