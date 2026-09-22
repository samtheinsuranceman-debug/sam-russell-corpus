// @ts-nocheck
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Calculator, DollarSign, LineChartIcon, PieChartIcon, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const DebtRecyclingStrategy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inputs' | 'projection'>('overview');
  const [loanType, setLoanType] = useState<'heloc' | 'margin'>('heloc');
  const [principal, setPrincipal] = useState<number>(200000);
  const [interestRate, setInterestRate] = useState<number>(5.5);
  const [investmentReturn, setInvestmentReturn] = useState<number>(7.0);
  const [dividendYield, setDividendYield] = useState<number>(3.0);
  const [simulationRan, setSimulationRan] = useState<boolean>(false);

  // Sample 50-year projection data
  const generateProjectionData = () => {
    const data = [];
    const initialDebt = principal;
    const yearlyPayment = initialDebt * 0.05;
    let debtWithRecycling = initialDebt;
    let debtWithoutRecycling = initialDebt;
    let wealthWithRecycling = 0;
    let wealthWithoutRecycling = 0;

    for (let year = 0; year <= 50; year++) {
      if (year > 0) {
        debtWithRecycling = Math.max(0, debtWithRecycling * (1 + interestRate / 100) - yearlyPayment - wealthWithRecycling * (dividendYield / 100));
        debtWithoutRecycling = Math.max(0, debtWithoutRecycling * (1 + interestRate / 100) - yearlyPayment);
        wealthWithRecycling = wealthWithRecycling * (1 + investmentReturn / 100) + (year <= 10 ? initialDebt * 0.1 : 0);
        wealthWithoutRecycling = wealthWithoutRecycling * (1 + investmentReturn / 100);
      }
      data.push({
        year,
        debtWith: Math.round(debtWithRecycling),
        debtWithout: Math.round(debtWithoutRecycling),
        wealthWith: Math.round(wealthWithRecycling),
        wealthWithout: Math.round(wealthWithoutRecycling),
      });
    }
    return data;
  };

  const projectionData = generateProjectionData();

  const handleGenerateOutcome = () => {
    if (principal < 10000 || interestRate < 0 || investmentReturn < 0 || dividendYield < 0) {
      toast.error('Invalid input values. Please check your entries.');
      return;
    }
    setSimulationRan(true);
    toast.success('Projection generated successfully!');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">Debt Recycling Strategy</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#1e3a5f] mb-6">
          {['overview', 'inputs', 'projection'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'overview' | 'inputs' | 'projection')}
              className={`px-4 py-2 capitalize ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#7a95b8]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <p className="text-[#7a95b8] leading-relaxed">
              Debt recycling converts non-deductible personal debt into tax-deductible investment debt under IRS §163(h) interest tracing rules. 
              Leverage a HELOC or margin loan to build an investment portfolio, using dividend income to accelerate debt payoff. 
              Note investment interest limitations under §163(d).
            </p>
            <div className="flex items-center gap-2 text-emerald-400">
              <AlertTriangle className="w-5 h-5" />
              <span>Consult a tax professional for compliance with US tax code.</span>
            </div>
          </div>
        )}

        {activeTab === 'inputs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Financial Inputs
              </h2>
              <div className="space-y-2">
                <label className="block text-[#7a95b8]">Loan Principal ($)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  min="10000"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[#7a95b8]">Interest Rate (%)</label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[#7a95b8]">Investment Return (%)</label>
                <input
                  type="number"
                  value={investmentReturn}
                  onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[#7a95b8]">Dividend Yield (%)</label>
                <input
                  type="number"
                  value={dividendYield}
                  onChange={(e) => setDividendYield(Number(e.target.value))}
                  className="w-full bg-[#0a0f1a] border border-[#1e3a5f] rounded-md p-2 text-white"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-4 bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Loan Type
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setLoanType('heloc')}
                  className={`px-4 py-2 rounded-md ${loanType === 'heloc' ? 'bg-emerald-500 text-white' : 'bg-[#0a0f1a] text-[#7a95b8] border border-[#1e3a5f]'}`}
                >
                  HELOC
                </button>
                <button
                  onClick={() => setLoanType('margin')}
                  className={`px-4 py-2 rounded-md ${loanType === 'margin' ? 'bg-emerald-500 text-white' : 'bg-[#0a0f1a] text-[#7a95b8] border border-[#1e3a5f]'}`}
                >
                  Margin Loan
                </button>
              </div>
              <button
                onClick={handleGenerateOutcome}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-md mt-4"
              >
                Generate Outcome
              </button>
            </div>
          </div>
        )}

        {activeTab === 'projection' && simulationRan && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-emerald-400" />
              50-Year Wealth &amp; Debt Projection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f] h-96">
                <h3 className="text-lg font-medium mb-2 text-[#7a95b8]">Debt Reduction Comparison</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip backgroundColor="#0a0f1a" contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                    <Legend />
                    <Line type="monotone" dataKey="debtWith" stroke="#34d399" name="Debt with Recycling" />
                    <Line type="monotone" dataKey="debtWithout" stroke="#f87171" name="Debt without Recycling" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[#0d1526] p-4 rounded-lg border border-[#1e3a5f] h-96">
                <h3 className="text-lg font-medium mb-2 text-[#7a95b8]">Wealth Growth Comparison</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', color: 'white' }} />
                    <Legend />
                    <Area type="monotone" dataKey="wealthWith" stroke="#34d399" fill="#34d39922" name="Wealth with Recycling" />
                    <Area type="monotone" dataKey="wealthWithout" stroke="#f87171" fill="#f8717122" name="Wealth without Recycling" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
              <span>Recycling accelerates debt payoff and wealth building over 50 years.</span>
            </div>
          </div>
        )}

        {activeTab === 'projection' && !simulationRan && (
          <div className="text-center text-[#7a95b8] py-10">
            Please generate an outcome from the Inputs tab to view projections.
          </div>
        )}
      </div>
      <PageInsights section="debt-recycling-strategy" />
    </div>
  );
};

export default DebtRecyclingStrategy;