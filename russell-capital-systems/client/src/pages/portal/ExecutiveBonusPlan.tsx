// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Briefcase, DollarSign, TrendingUp, Shield, CheckCircle2, ArrowRight, Target, Users, Award, Scale, Gift, Percent } from 'lucide-react';
import { AreaChart as ReAreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart as ReBarChart, Bar } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const ExecutiveBonusPlan: React.FC = () => {
  // State for toggling sections, e.g., expanding details
  const [showDetails, setShowDetails] = useState({
    doubleBonus: false,
    comparisons: false,
    handcuffs: false,
  });

  // Memoized data for the 20-year accumulation projection
  const accumulationData = useMemo(() => [
    { year: 1, cashValue: 5000, projectedGrowth: 5500 },
    { year: 2, cashValue: 10000, projectedGrowth: 12000 },
    { year: 3, cashValue: 15000, projectedGrowth: 18000 },
    { year: 4, cashValue: 20000, projectedGrowth: 25000 },
    { year: 5, cashValue: 25000, projectedGrowth: 33000 },
    { year: 6, cashValue: 30000, projectedGrowth: 42000 },
    { year: 7, cashValue: 35000, projectedGrowth: 52000 },
    { year: 8, cashValue: 40000, projectedGrowth: 63000 },
    { year: 9, cashValue: 45000, projectedGrowth: 75000 },
    { year: 10, cashValue: 50000, projectedGrowth: 88000 },
    { year: 11, cashValue: 55000, projectedGrowth: 102000 },
    { year: 12, cashValue: 60000, projectedGrowth: 118000 },
    { year: 13, cashValue: 65000, projectedGrowth: 136000 },
    { year: 14, cashValue: 70000, projectedGrowth: 156000 },
    { year: 15, cashValue: 75000, projectedGrowth: 178000 },
    { year: 16, cashValue: 80000, projectedGrowth: 202000 },
    { year: 17, cashValue: 85000, projectedGrowth: 228000 },
    { year: 18, cashValue: 90000, projectedGrowth: 256000 },
    { year: 19, cashValue: 95000, projectedGrowth: 286000 },
    { year: 20, cashValue: 100000, projectedGrowth: 318000 },
  ], []);

  // Memoized data for employer vs employee benefit comparison bar chart
  const comparisonData = useMemo(() => [
    { category: 'Year 1', employerDeduction: 5000, employeeBenefit: 4000 },
    { category: 'Year 5', employerDeduction: 25000, employeeBenefit: 20000 },
    { category: 'Year 10', employerDeduction: 50000, employeeBenefit: 40000 },
    { category: 'Year 15', employerDeduction: 75000, employeeBenefit: 60000 },
    { category: 'Year 20', employerDeduction: 100000, employeeBenefit: 80000 },
  ], []);

  // Memoized data for IUL vs Whole Life comparison (for potential bar chart or table)
  const iulVsWholeLifeData = useMemo(() => [
    { feature: 'Cash Value Growth', IUL: 'Market-linked', WholeLife: 'Fixed' },
    { feature: 'Premium Flexibility', IUL: 'High', WholeLife: 'Low' },
    { feature: 'Death Benefit', IUL: 'Variable', WholeLife: 'Guaranteed' },
    { feature: 'Fees', IUL: 'Moderate', WholeLife: 'Higher' },
    { feature: 'Tax Advantages', IUL: 'Yes (IRC 7702)', WholeLife: 'Yes (IRC 7702)' },
  ], []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <header className="text-center py-12">
        <h1 className="text-4xl font-bold text-amber-400">Executive Bonus Plan under IRC Section 162</h1>
        <p className="mt-4 text-emerald-300">A comprehensive guide to employer-paid life insurance premiums as tax-deductible bonuses.</p>
        <div className="flex justify-center mt-6">
          <Briefcase className="mr-2" size={24} color="amber" />
          <DollarSign size={24} color="emerald" />
          <TrendingUp size={24} color="amber" />
        </div>
      </header>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold flex items-center text-amber-400">
          <Briefcase className="mr-2" size={20} /> Plan Structure: Employer Pays Premiums as Bonuses
        </h2>
        <p className="mt-4 text-[#94a3b8]">
          The Executive Bonus Plan, modeled under IRC Section 162, allows employers to pay life insurance premiums on behalf of key executives as tax-deductible business expenses. The employee owns the policy, meaning they retain all benefits, including cash value accumulation and death benefits. This structure provides a win-win: employers gain tax deductions, while employees build personal wealth.
        </p>
        <p className="mt-2 text-[#94a3b8]">
          Key elements include:
          <ul className="list-disc pl-8 mt-2">
            <li>The employer pays the premium as a bonus, which is deductible under IRC Section 162 as an ordinary business expense.</li>
            <li>The employee is taxed on the bonus amount under IRC Section 61, but owns the policy outright.</li>
            <li>IRC Section 83 governs the transfer of property (the policy) and ensures compliance with vesting rules.</li>
          </ul>
        </p>
        <p className="mt-4 text-emerald-300 flex items-center">
          <CheckCircle2 className="mr-2" size={18} /> Benefits: Employees can access cash value through loans or withdrawals, fostering long-term financial security.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold flex items-center text-amber-400" onClick={() => setShowDetails({ ...showDetails, doubleBonus: !showDetails.doubleBonus })}>
          <DollarSign className="mr-2" size={20} /> Double Bonus Arrangement for Tax Gross-Up
          <ArrowRight className="ml-2" size={16} color={showDetails.doubleBonus ? 'emerald' : 'gray'} />
        </h2>
        {showDetails.doubleBonus && (
          <div className="mt-4">
            <p className="text-[#94a3b8]">
              To offset the tax burden on the employee, employers can implement a double bonus arrangement. This involves grossing up the bonus to cover the employee's tax liability, ensuring the net amount received equals the premium paid.
            </p>
            <p className="mt-2 text-[#94a3b8]">
              Example: If the premium is $10,000 and the employee's tax rate is 30%, the employer pays an additional $3,000 (gross-up), making the total bonus $13,000. This is still deductible under IRC Section 162, but requires careful calculation to avoid IRS scrutiny.
            </p>
            <p className="mt-4 text-emerald-300 flex items-center">
              <Shield className="mr-2" size={18} /> Compliance Tip: Ensure the arrangement is documented and aligns with IRC Section 61 to prevent reclassification.
            </p>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold flex items-center text-amber-400">
          <TrendingUp className="mr-2" size={20} /> 20-Year Accumulation Projection
        </h2>
        <p className="mt-4 text-[#94a3b8]">
          This AreaChart illustrates the projected cash value accumulation over 20 years, assuming a 6% annual growth rate. It highlights the long-term benefits for the employee.
        </p>
        <ResponsiveContainer width="100%" height={400} className="mt-6">
          <ReAreaChart data={accumulationData}>
            <Area type="monotone" dataKey="cashValue" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            <Area type="monotone" dataKey="projectedGrowth" stroke="#D97706" fill="#D97706" fillOpacity={0.3} />
            <XAxis dataKey="year" stroke="gray" />
            <YAxis stroke="gray" />
            <Tooltip />
            <Legend />
          </ReAreaChart>
        </ResponsiveContainer>
        <p className="mt-4 text-emerald-300">Note: Projections are illustrative and based on historical averages; actual results may vary due to market conditions.</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold flex items-center text-amber-400" onClick={() => setShowDetails({ ...showDetails, comparisons: !showDetails.comparisons })}>
          <Scale className="mr-2" size={20} /> Employer Tax Deduction vs. Employee Benefit Comparison
          <ArrowRight className="ml-2" size={16} color={showDetails.comparisons ? 'emerald' : 'gray'} />
        </h2>
        {showDetails.comparisons && (
          <div className="mt-4">
            <p className="text-[#94a3b8]">
              This BarChart compares the employer's tax deductions against the employee's benefits over key years, emphasizing the mutual advantages.
            </p>
            <ResponsiveContainer width="100%" height={300} className="mt-6">
              <ReBarChart data={comparisonData}>
                <XAxis dataKey="category" stroke="gray" />
                <YAxis stroke="gray" />
                <Tooltip />
                <Legend />
                <Bar dataKey="employerDeduction" fill="#10B981" />
                <Bar dataKey="employeeBenefit" fill="#D97706" />
              </ReBarChart>
            </ResponsiveContainer>
            <p className="mt-4 text-emerald-300">Observation: Employers often see higher deductions in early years, while employees benefit from compounded growth.</p>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold flex items-center text-amber-400">
          <Gift className="mr-2" size={20} /> IUL vs. Whole Life Insurance Comparison
        </h2>
        <p className="mt-4 text-[#94a3b8]">
          Below is a detailed table comparing Indexed Universal Life (IUL) and Whole Life policies, which can be used in an Executive Bonus Plan.
        </p>
        <div className="overflow-x-auto"><table className="mt-6 w-full border-collapse border border-[#1e3a5f]">
          <thead>
            <tr className="bg-[#0d1526]">
              <th className="p-4 text-left text-amber-400">Feature</th>
              <th className="p-4 text-left text-emerald-300">IUL</th>
              <th className="p-4 text-left text-emerald-300">Whole Life</th>
            </tr>
          </thead>
          <tbody>
            {iulVsWholeLifeData.map((item, index) => (
              <tr key={index} className="border-t border-[#1e3a5f]">
                <td className="p-4">{item.feature}</td>
                <td className="p-4 text-[#94a3b8]">{item.IUL}</td>
                <td className="p-4 text-[#94a3b8]">{item.WholeLife}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <p className="mt-4 text-emerald-300">Recommendation: IUL offers more flexibility, aligning with IRC Section 7702 for tax-favored treatment.</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold flex items-center text-amber-400" onClick={() => setShowDetails({ ...showDetails, handcuffs: !showDetails.handcuffs })}>
          <Award className="mr-2" size={20} /> Golden Handcuffs with Restrictive Endorsement
          <ArrowRight className="ml-2" size={16} color={showDetails.handcuffs ? 'emerald' : 'gray'} />
        </h2>
        {showDetails.handcuffs && (
          <div className="mt-4">
            <p className="text-[#94a3b8]">
              Golden handcuffs use restrictive endorsements to incentivize executives to stay with the company. If the employee leaves, they forfeit policy benefits, creating retention through financial ties.
            </p>
            <p className="mt-2 text-[#94a3b8]">
              This arrangement must comply with IRC Section 83, ensuring proper vesting schedules. Benefits include reduced turnover and enhanced loyalty.
            </p>
            <p className="mt-4 text-emerald-300 flex items-center">
              <Target className="mr-2" size={18} /> Best Practices: Pair with non-compete clauses and regular policy reviews.
            </p>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold flex items-center text-amber-400">
          <Users className="mr-2" size={20} /> IRS Compliance Overview
        </h2>
        <p className="mt-4 text-[#94a3b8]">
          Ensuring compliance is crucial. Key sections include:
          <ul className="list-disc pl-8 mt-2">
            <li><Percent className="inline mr-2" size={16} /> IRC Section 162: Allows deduction of ordinary business expenses, including bonuses for premiums.</li>
            <li>IRC Section 61: Treats bonuses as taxable income to the employee.</li>
            <li>IRC Section 83: Covers property transfers and vesting for the policy ownership.</li>
          </ul>
        </p>
        <p className="mt-4 text-emerald-300">Consult a tax professional to maintain compliance and avoid penalties.</p>
      </section>

      <footer className="mt-16 text-center text-gray-500">
        <p>Developed for financial advisory platform &copy; 2023</p>
      </footer>
      <PageInsights section="executive-bonus-plan" />
    </div>
  );
};

export default ExecutiveBonusPlan;
