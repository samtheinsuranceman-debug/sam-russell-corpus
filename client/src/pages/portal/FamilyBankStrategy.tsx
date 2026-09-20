// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Calculator, DollarSign, FileText, TrendingUp, Wallet, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const FamilyBankStrategy: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(2.5);
  const [loanTerm, setLoanTerm] = useState(10);
  const [isDemandLoan, setIsDemandLoan] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Sample data for 50-year projection of loan growth and wealth transfer
  const projectionData = Array.from({ length: 50 }, (_, i) => ({
    year: i + 1,
    loanValue: loanAmount * Math.pow(1 + (interestRate / 100), i),
    wealthTransfer: (loanAmount * 0.02) * (i + 1) * 1000,
  }));

  // Sample data for loan structure comparison
  const structureData = [
    { type: 'Demand Loan', cost: 15000, benefit: 25000 },
    { type: 'Term Loan', cost: 20000, benefit: 30000 },
    { type: 'Below-Market Loan (§7872)', cost: 10000, benefit: 35000 },
  ];

  const handleGenerateOutcome = () => {
    if (loanAmount < 10000) {
      toast.error('Loan amount must be at least $10,000');
      return;
    }
    toast.success('Outcome generated! Check the charts and projections below.');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Wallet className="w-5 h-5 mr-2 text-emerald-400" /> },
    { id: 'loans', label: 'Loan Structures', icon: <DollarSign className="w-5 h-5 mr-2 text-emerald-400" /> },
    { id: 'projections', label: 'Projections', icon: <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Activity className="w-8 h-8 mr-3 text-emerald-500" /> Family Bank Strategy
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-[#1e3a5f]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 rounded-t-md transition ${
                activeTab === tab.id
                  ? 'bg-[#0d1526] border-b-2 border-emerald-500 text-emerald-400'
                  : 'text-[#7a95b8] hover:bg-[#0d1526]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <p className="text-[#7a95b8] mb-4">
              Leverage intrafamily lending with IUL cash values under IRS §7872 below-market loan rules. Establish a family LLC as a lending vehicle for generational wealth transfer.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Calculator className="w-6 h-6 mr-3 text-emerald-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold">AFR Rate Compliance</h3>
                  <p className="text-[#7a95b8] text-sm">Short, mid, and long-term rates as per IRS guidelines.</p>
                </div>
              </div>
              <div className="flex items-start">
                <FileText className="w-6 h-6 mr-3 text-emerald-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold">Governance Framework</h3>
                  <p className="text-[#7a95b8] text-sm">Family bank lending policy templates and tracking.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <h2 className="text-xl font-semibold mb-4">Loan Structure Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-[#7a95b8] mb-1">Loan Amount ($)</label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[#7a95b8] mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[#7a95b8] mb-1">Loan Term (Years)</label>
                <input
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                checked={isDemandLoan}
                onChange={() => setIsDemandLoan(!isDemandLoan)}
                className="w-4 h-4 mr-2 accent-emerald-500"
              />
              <label className="text-[#7a95b8]">Demand Loan (vs Term Loan)</label>
              <Info className="w-4 h-4 ml-2 text-emerald-400" />
            </div>
            <button
              onClick={handleGenerateOutcome}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-md transition"
            >
              Generate Outcome
            </button>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={structureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="type" stroke="#7a95b8" />
                  <YAxis stroke="#7a95b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                  <Bar dataKey="cost" fill="#ef4444" name="Cost ($)" />
                  <Bar dataKey="benefit" fill="#10b981" name="Benefit ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
            <h2 className="text-xl font-semibold mb-4">50-Year Wealth Transfer Projection</h2>
            <p className="text-[#7a95b8] text-sm mb-4">
              Projection based on loan growth and below-market loan benefits under IRS §7872.
            </p>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" stroke="#7a95b8" />
                  <YAxis stroke="#7a95b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                  <Area type="monotone" dataKey="loanValue" stroke="#10b981" fill="#10b98133" name="Loan Value ($)" />
                  <Area type="monotone" dataKey="wealthTransfer" stroke="#3b82f6" fill="#3b82f633" name="Wealth Transfer ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-emerald-400 hover:text-emerald-500 transition"
            >
              {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              <span className="ml-1">Detailed Assumptions</span>
            </button>
            {showDetails && (
              <p className="text-[#7a95b8] text-sm mt-2">
                Assumes consistent interest rate, no early repayment, and full compliance with IRS regulations.
              </p>
            )}
          </div>
        )}
      </div>
      <PageInsights section="family-bank-strategy" />
    </div>
  );
};

export default FamilyBankStrategy;