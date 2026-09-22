// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Home, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Building2, ArrowRight, Award, Percent } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function PhysicianMortgageAnalyzer() {
  const [homePrice, setHomePrice] = useState(750000); // Default home price
  const [downPaymentPercent, setDownPaymentPercent] = useState('0'); // Options: '0', '5', '10', '20'

  // Calculate down payment and loan amount using useMemo for optimization
  const downPaymentAmount = useMemo(() => (parseFloat(downPaymentPercent) / 100) * homePrice, [homePrice, downPaymentPercent]);
  const loanAmount = useMemo(() => homePrice - downPaymentAmount, [homePrice, downPaymentAmount]);

  // Mortgage payment calculation function
  const calculateMonthlyPayment = (principal: number, annualRate: number, years: number = 30) => {
    const monthlyRate = annualRate / 12 / 100;
    const numberOfPayments = years * 12;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  // Physician Loan assumptions
  const physicianRate = 6.25; // %
  const physicianMonthlyPI = calculateMonthlyPayment(loanAmount, physicianRate);
  const physicianClosingCosts = 8000; // Assumed
  const physicianCashNeeded = downPaymentAmount + physicianClosingCosts;

  // Conventional Loan assumptions (based on 20% down as per example)
  const conventionalDownPayment = (20 / 100) * homePrice; // Always 20% for this card
  const conventionalLoanAmount = homePrice - conventionalDownPayment;
  const conventionalRate = 5.875; // %
  const conventionalMonthlyPI = calculateMonthlyPayment(conventionalLoanAmount, conventionalRate);
  const conventionalClosingCosts = 7000; // Assumed
  const conventionalCashNeeded = conventionalDownPayment + conventionalClosingCosts;

  // Opportunity Cost Data for AreaChart
  const investmentData = useMemo(() => {
    const initialInvestment = 150000; // Based on 20% of default home price
    const growthRate = 0.08; // 8%
    return Array.from({ length: 30 }, (_, i) => {
      const years = i + 1;
      const futureValue = initialInvestment * Math.pow(1 + growthRate, years);
      return { year: years, value: futureValue };
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-teal-400 p-8 font-sans">
      {/* Header Section */}
      <header className="flex flex-col items-center justify-center mb-12 text-center">
        <h1 className="text-4xl font-bold flex items-center gap-2">
          <Home className="text-yellow-500" size={32} /> {/* Gold accent */}
          Physician Mortgage Analyzer
        </h1>
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="text-yellow-500" size={24} />
            <label className="text-lg">Home Price: $</label>
            <input
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(parseFloat(e.target.value))}
              className="bg-[#0d1526] border border-teal-500 rounded px-3 py-2 text-teal-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              min="100000"
              step="1000"
            />
          </div>
          <div className="flex items-center gap-2">
            <Percent className="text-yellow-500" size={24} />
            <label className="text-lg">Down Payment %:</label>
            <select
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(e.target.value)}
              className="bg-[#0d1526] border border-teal-500 rounded px-3 py-2 text-teal-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </div>
        </div>
      </header>

      {/* Physician Loan vs Conventional Loan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border border-teal-500">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="text-yellow-500" size={24} /> Physician Loan
          </h2>
          <p className="flex items-center gap-2"><DollarSign size={16} /> Down payment: ${downPaymentAmount.toFixed(0)} ({downPaymentPercent}%)</p>
          <p className="flex items-center gap-2"><ArrowRight size={16} /> Loan amount: ${loanAmount.toFixed(0)}</p>
          <p className="flex items-center gap-2"><TrendingUp size={16} /> Rate: {physicianRate}%</p>
          <p className="flex items-center gap-2"><CheckCircle2 size={16} /> No PMI: $0/mo saved</p>
          <p className="flex items-center gap-2"><Calendar size={16} /> Monthly P&I: ${physicianMonthlyPI.toFixed(0)}</p>
          <p className="flex items-center gap-2"><Building2 size={16} /> Closing costs: $8,000</p>
          <p className="flex items-center gap-2"><Target size={16} /> Cash needed: ${physicianCashNeeded.toFixed(0)}</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg border border-teal-500">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={24} /> Conventional Loan (20% down)
          </h2>
          <p className="flex items-center gap-2"><DollarSign size={16} /> Down payment: ${conventionalDownPayment.toFixed(0)} (20%)</p>
          <p className="flex items-center gap-2"><ArrowRight size={16} /> Loan amount: ${conventionalLoanAmount.toFixed(0)}</p>
          <p className="flex items-center gap-2"><TrendingUp size={16} /> Rate: {conventionalRate}%</p>
          <p className="flex items-center gap-2"><CheckCircle2 size={16} /> PMI: $0 (20% down)</p>
          <p className="flex items-center gap-2"><Calendar size={16} /> Monthly P&I: ${conventionalMonthlyPI.toFixed(0)}</p>
          <p className="flex items-center gap-2"><Building2 size={16} /> Closing costs: $7,000</p>
          <p className="flex items-center gap-2"><Target size={16} /> Cash needed: ${conventionalCashNeeded.toFixed(0)}</p>
        </div>
      </div>

      {/* Opportunity Cost Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" size={24} /> Opportunity Cost
        </h2>
        <p className="mb-4">Investment of $150K at 8% over 30 years:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Year 10: $323K investment growth</li>
          <li>Year 20: $699K</li>
          <li>Year 30: $1.51M</li>
          <li>Extra mortgage interest paid: $234K</li>
          <li>Net advantage of 0% down: $1.27M</li>
        </ul>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={investmentData}>
            <XAxis dataKey="year" stroke="teal" />
            <YAxis stroke="teal" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="yellow-500" fill="teal" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* PMI Elimination Analysis Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-yellow-500" size={24} /> PMI Elimination Analysis
        </h2>
        <p className="mb-2">Conventional 5% down: PMI = $375/mo</p>
        <p className="mb-2">PMI duration: ~7 years (until 78% LTV)</p>
        <p className="mb-2">Total PMI cost: $31.5K</p>
        <p className="mb-2 flex items-center gap-2"><Shield size={16} /> Physician loan saves: $31.5K in PMI</p>
        <ResponsiveContainer width="100%" height={300}><ComposedChart data={[{year: 1, pmi: 375}, {year: 7, pmi: 0}]}>
          <Bar dataKey="pmi" fill="teal" />
          <Line type="monotone" dataKey="pmi" stroke="yellow-500" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
        </ComposedChart></ResponsiveContainer>
      </section>

      {/* Qualification Matrix Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Award className="text-yellow-500" size={24} /> Qualification Matrix
        </h2>
        <div className="overflow-x-auto"><table className="w-full border-collapse border border-teal-500">
          <thead>
            <tr className="bg-[#0d1526]">
              <th className="border border-teal-500 p-2">Feature</th>
              <th className="border border-teal-500 p-2">Physician Loan</th>
              <th className="border border-teal-500 p-2">Conventional</th>
              <th className="border border-teal-500 p-2">FHA</th>
              <th className="border border-teal-500 p-2">VA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-teal-500 p-2">Down Payment</td>
              <td className="border border-teal-500 p-2">0%</td>
              <td className="border border-teal-500 p-2">3-20%</td>
              <td className="border border-teal-500 p-2">3.5%</td>
              <td className="border border-teal-500 p-2">0%</td>
            </tr>
            <tr>
              <td className="border border-teal-500 p-2">PMI</td>
              <td className="border border-teal-500 p-2">None</td>
              <td className="border border-teal-500 p-2">Required &lt;20%</td>
              <td className="border border-teal-500 p-2">MIP forever</td>
              <td className="border border-teal-500 p-2">None</td>
            </tr>
            <tr>
              <td className="border border-teal-500 p-2">Max Loan</td>
              <td className="border border-teal-500 p-2">$2M+</td>
              <td className="border border-teal-500 p-2">Conforming</td>
              <td className="border border-teal-500 p-2">$472K</td>
              <td className="border border-teal-500 p-2">No limit</td>
            </tr>
            <tr>
              <td className="border border-teal-500 p-2">Student Loans</td>
              <td className="border border-teal-500 p-2">Excluded/reduced</td>
              <td className="border border-teal-500 p-2">Full DTI</td>
              <td className="border border-teal-500 p-2">Full DTI</td>
              <td className="border border-teal-500 p-2">Full DTI</td>
            </tr>
            <tr>
              <td className="border border-teal-500 p-2">Eligible</td>
              <td className="border border-teal-500 p-2">MD/DO/DDS/DPM</td>
              <td className="border border-teal-500 p-2">Anyone</td>
              <td className="border border-teal-500 p-2">Anyone</td>
              <td className="border border-teal-500 p-2">Veterans</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      {/* Student Loan DTI Treatment Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Target className="text-yellow-500" size={24} /> Student Loan DTI Treatment
        </h2>
        <p className="mb-2">Conventional: 1% of balance ($3,500/mo on $350K)</p>
        <p className="mb-2">Physician loan: IBR payment ($2,400/mo) or excluded</p>
        <p className="mb-2">DTI impact: 42% vs 35% — difference between approval and denial</p>
        <ResponsiveContainer width="100%" height={300}><BarChart data={[{type: 'Conventional', dti: 42}, {type: 'Physician', dti: 35}]}>
          <Bar dataKey="dti" fill="teal" />
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
        </BarChart></ResponsiveContainer>
      </section>
      <PageInsights section="physician-mortgage-analyzer" />
    </div>
  );
}
