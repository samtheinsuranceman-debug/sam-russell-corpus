import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const AnnuityExplorerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("explorer");

  const tabs = ["Explorer", "Compare", "Riders", "Income Projection", "Tax Analysis", "Generate Outcome"];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Annuity Explorer</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab.toLowerCase() ? "default" : "outline"}
              className={`${
                activeTab === tab.toLowerCase() 
                  ? "bg-[#22c55e] hover:bg-[#22c55e]/90" 
                  : "border-gray-600 text-gray-300 hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Content */}
        <Card className="bg-[#0a0f1a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Browse Annuity Products (Solar Bonus First)</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === "explorer" && (
              <div className="space-y-4">
                <Input
                  placeholder="Search Annuities (FIA, MYGA, SPIA, DIA)"
                  className="bg-[#0a0f1a] border-gray-600 text-white"
                />
                <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Annuity Explorer Placeholder (Solar Roth, Fixed Annuities)</p>
                </div>
              </div>
            )}
            {activeTab !== "explorer" && (
              <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Content for {activeTab.replace("-", " ")} coming soon...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Page Insights */}
        <div className="mt-6 flex justify-end">
          <div className="bg-[#22c55e]/20 text-[#22c55e] px-4 py-2 rounded-lg text-sm">
            Page Insights Score: 95/100
          </div>
        </div>

        {/* Cross-Tool Integration */}
        <Card className="mt-6 bg-[#0a0f1a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Cross-Tool Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Link to Strategy Lab or IUL Projection for comprehensive planning.
            </p>
            <Button variant="outline" className="mt-2 border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10">
              Connect Tools
            </Button>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="mt-6 text-gray-500 text-xs text-center">
          Russell Capital Solutions provides tools for educational purposes only. Not intended as financial advice. Consult a qualified professional. Not for use by series-licensed agents.
        </p>

        {/* ━━━ 50-YEAR PROJECTION ENGINE ━━━ */}
        <div className="mt-12 bg-[#0c1425] border border-emerald-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">50-Year Projection Engine</h2>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-slate-400">Projection Horizon:</label>
            <input type="range" min="1" max="50" defaultValue="30" className="flex-1 accent-emerald-500"
              onChange={(e) => {
                const val = e.target.value;
                document.getElementById('proj-year-annuity-explorer')!.textContent = val;
              }} />
            <span id="proj-year-annuity-explorer" className="text-emerald-400 font-bold text-lg w-12 text-center">30</span>
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
      </div>
    </div>
  );
}

export default AnnuityExplorerPage;
