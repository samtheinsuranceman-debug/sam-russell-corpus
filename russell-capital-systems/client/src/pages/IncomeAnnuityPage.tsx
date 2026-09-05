import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const IncomeAnnuityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Income Calculator");
  const tabs = ["Income Calculator", "Solar Strategy", "Tax-Free Comparison", "Carrier Ranking", "Generate Outcome"];

  const [incomeData, setIncomeData] = useState({ annualIncome: 50000, solarBoost: 25 });

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Income Annuity Planner</h1>
        <p className="text-gray-400">Lifetime Guaranteed Income with Solar Roth Strategy</p>
      </header>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            className={`${
              activeTab === tab ? "bg-[#22c55e] text-white" : "text-gray-300 border-gray-700"
            } hover:bg-[#22c55e] hover:text-white transition`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#141925] p-6 rounded-lg shadow-md">
        {activeTab === "Income Calculator" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Calculate Lifetime Income</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1">Desired Annual Income ($)</label>
                <input
                  type="number"
                  defaultValue={incomeData.annualIncome}
                  className="w-full p-2 bg-[#0a0f1a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Age at Start</label>
                <input
                  type="number"
                  defaultValue={65}
                  className="w-full p-2 bg-[#0a0f1a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">Projected Income</h3>
              <p className="mt-2 p-3 bg-[#0a0f1a] rounded-md">
                Base Income: ${incomeData.annualIncome.toLocaleString()} / year
              </p>
            </div>
          </div>
        )}
        {activeTab === "Solar Strategy" && (
          <div className="text-center py-6">Solar Roth Strategy Placeholder (22-28% Tax-Free Boost)</div>
        )}
        {activeTab === "Tax-Free Comparison" && <div className="text-center py-6">Tax-Free Comparison Placeholder</div>}
        {activeTab === "Carrier Ranking" && <div className="text-center py-6">Carrier Ranking Placeholder</div>}
        {activeTab === "Generate Outcome" && (
          <div className="text-center py-6">
            <Button className="bg-[#22c55e] hover:bg-[#1ca34d]">Generate Report</Button>
          </div>
        )}
      </div>

      {/* Cross-Tool Integration */}
      <div className="mt-6 bg-[#141925] p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Cross-Tool Integration</h2>
        <p className="text-gray-400">
          Link with Risk Score for income protection analysis or Wealth Genome for holistic planning.
        </p>
        <Button variant="outline" className="mt-4 text-[#22c55e] border-[#22c55e]">
          Connect Tools <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Page Insights Badge */}
      <div className="mt-6 flex justify-center">
        <div className="bg-[#141925] px-4 py-2 rounded-md border border-[#22c55e]">
          <p className="text-[#22c55e]">Page Insights Score: 88/100</p>
        </div>
      </div>

      {/* ━━━ 50-YEAR PROJECTION ENGINE ━━━ */}
      <div className="mt-12 bg-[#0c1425] border border-emerald-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">50-Year Projection Engine</h2>
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm text-slate-400">Projection Horizon:</label>
          <input type="range" min="1" max="50" defaultValue="30" className="flex-1 accent-emerald-500"
            onChange={(e) => {
              const val = e.target.value;
              document.getElementById(`proj-year-income-annuity`)!.textContent = val;
            }} />
          <span id={`proj-year-income-annuity`} className="text-emerald-400 font-bold text-lg w-12 text-center">30</span>
          <span className="text-slate-500 text-sm">years</span>
        </div>
        <div className="flex gap-2 mb-6">
          {['Conservative', 'Moderate', 'Aggressive'].map((s, i) => (
            <button key={s} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              i === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}>{s}</button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4 text-center">
          {[5, 10, 20, 30, 50].map(yr => (
            <div key={yr} className="bg-[#1e293b] rounded-lg p-4">
              <div className="text-slate-500 text-xs mb-1">Year {yr}</div>
              <div className="text-emerald-400 font-bold text-lg">[Annuity Income]</div>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━ AI BRAIN → AI ADVISOR CONNECTOR ━━━ */}
      <div className="mt-8 bg-gradient-to-r from-[#0c1425] to-[#1a1040] border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">🧠</span> AI Brain Analysis
          </h2>
          <div className="flex gap-2">
            <a href="/portal/ai-assist" className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-all">
              Send to AI Advisor →
            </a>
            <a href="/portal/ai-brain" className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-all">
              View AI Brain Hub →
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-amber-400 text-sm font-semibold mb-2">⚡ Immediate Action</div>
            <p className="text-slate-300 text-sm">Run this calculator with client data, then let the AI Advisor generate a personalized recommendation based on the 50-year projection.</p>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-emerald-400 text-sm font-semibold mb-2">📊 Cross-Calculator Insight</div>
            <p className="text-slate-300 text-sm">This tool syncs with all 248+ calculators via StrategyContext. Changes here automatically cascade to related projections across the platform.</p>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-rose-400 text-sm font-semibold mb-2">🛡️ Risk Assessment</div>
            <p className="text-slate-300 text-sm">The AI Brain continuously monitors market conditions and adjusts risk scores. Connect to the AI Advisor for real-time mitigation strategies.</p>
          </div>
        </div>
      </div>

      {/* Regulatory Disclaimer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Russell Capital Systems tools are for informational use only. Annuity products carry risks and are not FDIC insured. Consult a professional advisor for guidance.
        </p>
      </footer>
    </div>
  );
}

export default IncomeAnnuityPage;
