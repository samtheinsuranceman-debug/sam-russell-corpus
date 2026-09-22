// @ts-nocheck
import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Calculator, BarChart3, LineChartIcon, TrendingUp, Shield, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const RetirementIncomeFloorStrategy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'floor' | 'gap'>('overview');
  const [socialSecurity, setSocialSecurity] = useState(24000);
  const [pension, setPension] = useState(18000);
  const [annuity, setAnnuity] = useState(12000);
  const [tipsBond, setTipsBond] = useState(10000);
  const [essentialExpenses, setEssentialExpenses] = useState(40000);
  const [discretionaryExpenses, setDiscretionaryExpenses] = useState(20000);

  // Sample data for charts
  const incomeData = [
    { year: '2025', socialSecurity: 24000, pension: 18000, annuity: 12000, tips: 10000 },
    { year: '2026', socialSecurity: 24720, pension: 18540, annuity: 12360, tips: 10300 },
    { year: '2027', socialSecurity: 25462, pension: 19096, annuity: 12731, tips: 10609 },
    { year: '2028', socialSecurity: 26225, pension: 19669, annuity: 13113, tips: 10927 },
    { year: '2029', socialSecurity: 27012, pension: 20259, annuity: 13506, tips: 11255 },
  ];

  const expenseData = [
    { category: 'Essential', amount: essentialExpenses, color: '#059669' },
    { category: 'Discretionary', amount: discretionaryExpenses, color: '#34d399' },
  ];

  const totalIncome = socialSecurity + pension + annuity + tipsBond;
  const incomeGap = essentialExpenses + discretionaryExpenses - totalIncome;
  const floorAdequacy = totalIncome >= essentialExpenses ? 'Adequate' : 'Deficient';

  const handleCalculate = () => {
    if (totalIncome <= 0) {
      toast.error('Please enter valid income values');
      return;
    }
    toast.success('Income floor recalculated successfully');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-emerald-400" />
          <h1 className="text-2xl font-bold">Retirement Income Floor Strategy</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#1e3a5f] mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-md font-medium ${
              activeTab === 'overview' ? 'bg-[#0d1526] text-emerald-400' : 'text-[#7a95b8] hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('floor')}
            className={`px-4 py-2 rounded-t-md font-medium ${
              activeTab === 'floor' ? 'bg-[#0d1526] text-emerald-400' : 'text-[#7a95b8] hover:text-white'
            }`}
          >
            Floor Construction
          </button>
          <button
            onClick={() => setActiveTab('gap')}
            className={`px-4 py-2 rounded-t-md font-medium ${
              activeTab === 'gap' ? 'bg-[#0d1526] text-emerald-400' : 'text-[#7a95b8] hover:text-white'
            }`}
          >
            Gap Analysis
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <p className="text-[#7a95b8] text-sm">
                Build a guaranteed income floor to cover essential expenses using Social Security, pensions, SPIA
                annuities, and TIPS bonds. (IRS Code §401(a)(9) for required minimum distributions)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0f1a] p-4 rounded-md border border-[#1e3a5f]">
                  <div className="flex items-center gap-2 mb-4">
                    <LineChartIcon className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold">Income Sources Over Time</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={incomeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f', color: 'white' }} />
                      <Legend />
                      <Line type="monotone" dataKey="socialSecurity" stroke="#059669" name="Social Security" />
                      <Line type="monotone" dataKey="pension" stroke="#34d399" name="Pension" />
                      <Line type="monotone" dataKey="annuity" stroke="#fcd34d" name="Annuity" />
                      <Line type="monotone" dataKey="tips" stroke="#fbbf24" name="TIPS Bonds" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-[#0a0f1a] p-4 rounded-md border border-[#1e3a5f]">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold">Expense Breakdown</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expenseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="category" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0d1526', borderColor: '#1e3a5f', color: 'white' }} />
                      <Bar dataKey="amount" fill="color" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'floor' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[#7a95b8] text-sm mb-2">
                    <DollarSign className="w-4 h-4" /> Social Security Annual Income
                  </label>
                  <input
                    type="number"
                    value={socialSecurity}
                    onChange={(e) => setSocialSecurity(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[#7a95b8] text-sm mb-2">
                    <DollarSign className="w-4 h-4" /> Pension Annual Income
                  </label>
                  <input
                    type="number"
                    value={pension}
                    onChange={(e) => setPension(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[#7a95b8] text-sm mb-2">
                    <DollarSign className="w-4 h-4" /> SPIA Annuity Income
                  </label>
                  <input
                    type="number"
                    value={annuity}
                    onChange={(e) => setAnnuity(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[#7a95b8] text-sm mb-2">
                    <DollarSign className="w-4 h-4" /> TIPS Bond Income
                  </label>
                  <input
                    type="number"
                    value={tipsBond}
                    onChange={(e) => setTipsBond(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <button
                onClick={handleCalculate}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-md"
              >
                <Calculator className="w-4 h-4" /> Recalculate Floor
              </button>
              <p className="text-[#7a95b8] text-sm">
                Total Income Floor: ${totalIncome.toLocaleString()} | Floor Adequacy: {floorAdequacy}
              </p>
            </div>
          )}

          {activeTab === 'gap' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[#7a95b8] text-sm mb-2">
                    <TrendingUp className="w-4 h-4" /> Essential Expenses (Annual)
                  </label>
                  <input
                    type="number"
                    value={essentialExpenses}
                    onChange={(e) => setEssentialExpenses(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[#7a95b8] text-sm mb-2">
                    <TrendingUp className="w-4 h-4" /> Discretionary Expenses (Annual)
                  </label>
                  <input
                    type="number"
                    value={discretionaryExpenses}
                    onChange={(e) => setDiscretionaryExpenses(Number(e.target.value))}
                    className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <p className="text-[#7a95b8] text-sm">
                Income Gap: ${incomeGap.toLocaleString()} {incomeGap > 0 ? '(Shortfall)' : '(Surplus)'}
              </p>
              <p className="text-[#7a95b8] text-xs">
                Note: Consider TIPS ladders for inflation protection and annuity ladders per IRS §72(t) for early
                withdrawals.
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-[#7a95b8] text-xs flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>
            Dynamic floor adjustment rules apply based on market scenarios. Consult IRS guidelines for pension present
            value calculations.
          </span>
        </div>
      </div>
      <PageInsights section="retirement-income-floor-strategy" />
    </div>
  );
};

export default RetirementIncomeFloorStrategy;