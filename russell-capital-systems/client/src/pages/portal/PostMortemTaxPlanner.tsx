// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { FileText, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Clock, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const PostMortemTaxPlanner = () => {
  const [checklistItems, setChecklistItems] = useState({
    portability: false,
    qtip: false,
    alternateValuation: false,
    installment6166: false,
  });

  const [fiscalYear, setFiscalYear] = useState('2023');
  const [irdAmount, setIrdAmount] = useState(0);
  const [section645Election, setSection645Election] = useState(false);
  const [disclaimerWindow, setDisclaimerWindow] = useState(9); // Months
  const [expenseAllocation, setExpenseAllocation] = useState('income'); // 'income' or 'estate'
  const [yearImpact, setYearImpact] = useState(50); // Years for impact

  const sampleData = useMemo(() => [
    { year: 2023, taxSavings: 50000, estateValue: 1000000 },
    { year: 2024, taxSavings: 55000, estateValue: 1050000 },
    { year: 2025, taxSavings: 60000, estateValue: 1100000 },
    { year: 2026, taxSavings: 65000, estateValue: 1150000 },
    { year: 2027, taxSavings: 70000, estateValue: 1200000 },
    { year: 2028, taxSavings: 75000, estateValue: 1250000 },
    { year: 2029, taxSavings: 80000, estateValue: 1300000 },
    { year: 2030, taxSavings: 85000, estateValue: 1350000 },
    { year: 2031, taxSavings: 90000, estateValue: 1400000 },
    { year: 2032, taxSavings: 95000, estateValue: 1450000 },
    { year: 2033, taxSavings: 100000, estateValue: 1500000 },
  ], []);

  const handleChecklistToggle = (item) => {
    setChecklistItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const calculateLongTermImpact = useMemo(() => {
    let totalSavings = 0;
    for (let i = 0; i < yearImpact; i++) {
      totalSavings += sampleData[i % sampleData.length].taxSavings * (1 + 0.03) ** i; // Assuming 3% growth
    }
    return totalSavings.toFixed(2);
  }, [yearImpact, sampleData]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <header className="flex items-center mb-8">
        <FileText className="mr-2 text-indigo-400" size={24} />
        <h1 className="text-3xl font-bold text-indigo-300">Post-Mortem Tax Planning and Estate Administration Tool</h1>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-200">
          <Shield className="mr-2" size={20} /> Post-Mortem Election Checklist
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checklistItems.portability}
                onChange={() => handleChecklistToggle('portability')}
                className="mr-2"
              />
              <CheckCircle2 className="mr-2 text-indigo-500" size={18} /> Portability (IRC 2010(c)(5))
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checklistItems.qtip}
                onChange={() => handleChecklistToggle('qtip')}
                className="mr-2"
              />
              <Target className="mr-2 text-indigo-500" size={18} /> QTIP Election (IRC 2056(b)(7))
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checklistItems.alternateValuation}
                onChange={() => handleChecklistToggle('alternateValuation')}
                className="mr-2"
              />
              <TrendingUp className="mr-2 text-indigo-500" size={18} /> Alternate Valuation (IRC 2032)
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checklistItems.installment6166}
                onChange={() => handleChecklistToggle('installment6166')}
                className="mr-2"
              />
              <Calendar className="mr-2 text-indigo-500" size={18} /> Section 6166 Installment (IRC 6166)
            </label>
          </div>
        </div>
        {checklistItems.portability && <p className="mt-2 text-[#94a3b8]">Portability allows unused exclusion to surviving spouse.</p>}
        {checklistItems.qtip && <p className="mt-2 text-[#94a3b8]">QTIP defers tax on certain marital trusts.</p>}
        {checklistItems.alternateValuation && <p className="mt-2 text-[#94a3b8]">Values assets 6 months after death for potential tax savings.</p>}
        {checklistItems.installment6166 && <p className="mt-2 text-[#94a3b8]">Allows installment payments for closely held business interests.</p>}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-200">
          <Calendar className="mr-2" size={20} /> Fiscal Year Selection for Estate
        </h2>
        <select
          value={fiscalYear}
          onChange={(e) => setFiscalYear(e.target.value)}
          className="bg-[#0d1526] border border-indigo-500 p-2 rounded"
        >
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
        <p className="mt-2 text-[#94a3b8]">Selected fiscal year: {fiscalYear}. Impacts estate tax filings and deductions.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-200">
          <DollarSign className="mr-2" size={20} /> Income in Respect of Decedent (IRD) Planning (IRC 691)
        </h2>
        <input
          type="number"
          value={irdAmount}
          onChange={(e) => setIrdAmount(Number(e.target.value))}
          placeholder="Enter IRD Amount"
          className="bg-[#0d1526] border border-indigo-500 p-2 rounded w-full mb-2"
        />
        <p className="text-[#94a3b8]">IRD Total: ${irdAmount}. Plan for taxation of income earned but not received before death.</p>
        <AlertTriangle className="mt-2 text-yellow-400" size={18} /> Ensure proper deduction under Section 642(g) to avoid double taxation.
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-200">
          <ArrowRight className="mr-2" size={20} /> Section 645 Election (Trust as Estate)
        </h2>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={section645Election}
            onChange={() => setSection645Election(!section645Election)}
            className="mr-2"
          />
          <CheckCircle2 className="mr-2 text-indigo-500" size={18} /> Elect to treat revocable trust as part of the estate for tax purposes.
        </label>
        {section645Election && <p className="mt-2 text-[#94a3b8]">This election can extend administrative periods and defer taxes.</p>}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-200">
          <Clock className="mr-2" size={20} /> Disclaimer Planning (9-Month Window)
        </h2>
        <input
          type="number"
          value={disclaimerWindow}
          onChange={(e) => setDisclaimerWindow(Number(e.target.value))}
          placeholder="Months for Disclaimer"
          className="bg-[#0d1526] border border-indigo-500 p-2 rounded w-full mb-2"
        />
        <p className="text-[#94a3b8]">Disclaimer window: {disclaimerWindow} months. Allows beneficiaries to refuse assets for tax benefits.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-200">
          <Percent className="mr-2" size={20} /> Estate Administration Expense Allocation
        </h2>
        <select
          value={expenseAllocation}
          onChange={(e) => setExpenseAllocation(e.target.value)}
          className="bg-[#0d1526] border border-indigo-500 p-2 rounded"
        >
          <option value="income">Allocate to Income Tax</option>
          <option value="estate">Allocate to Estate Tax</option>
        </select>
        <p className="mt-2 text-[#94a3b8]">Current allocation: {expenseAllocation}. Deduct expenses to minimize overall tax liability.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-200">
          <Scale className="mr-2" size={20} /> 50-Year Impact of Post-Mortem Elections
        </h2>
        <input
          type="number"
          value={yearImpact}
          onChange={(e) => setYearImpact(Number(e.target.value))}
          placeholder="Years to Project"
          className="bg-[#0d1526] border border-indigo-500 p-2 rounded w-full mb-2"
        />
        <p className="text-[#94a3b8]">Projected 50-year tax savings impact: ${calculateLongTermImpact}</p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={sampleData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="taxSavings" fill="#6366f1" /> {/* Purple accent */}
            <Line type="monotone" dataKey="estateValue" stroke="#818cf8" />
            <Area type="monotone" dataKey="taxSavings" fill="#6B21A8" stroke="#9333EA" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-200">
          <CheckCircle2 className="mr-2" size={20} /> Compliance Reminders
        </h2>
        <ul className="list-disc pl-5 text-[#94a3b8]">
          <li>IRC 2032: Alternate Valuation must be elected within 1 year.</li>
          <li>IRC 2056(b)(7): QTIP election requires specific trust provisions.</li>
          <li>IRC 6166: Installment payments for estates over 35% of taxable estate.</li>
          <li>IRC 691: IRD is subject to income tax in the recipient's hands.</li>
          <li>IRC 642(g): Prohibition on double deductions for administration expenses.</li>
          <li>IRC 2010(c)(5): Portability election for deceased spousal unused exclusion.</li>
        </ul>
      </section>

      <footer className="mt-12 text-[#7a95b8]">
        <p>This tool is for illustrative purposes. Consult a tax professional for advice.</p>
      </footer>
      <PageInsights section="post-mortem-tax-planner" />
    </div>
  );
};

export default PostMortemTaxPlanner;
