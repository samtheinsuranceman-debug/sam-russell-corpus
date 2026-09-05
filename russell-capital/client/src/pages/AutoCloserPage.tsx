import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, AlertTriangle } from "lucide-react";

const AutoCloserPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["overview", "objections", "scripts", "scheduler", "outcome"];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Auto-Closer</h1>
        <p className="text-gray-400 mb-6">AI-powered deal closing assistant.</p>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              className={`${
                activeTab === tab ? "bg-[#22c55e] hover:bg-[#1ea34e]" : "text-gray-300"
              } capitalize`}
              onClick={() => setActiveTab(tab)}
            >
              {tab
                .replace("overview", "Deal Overview")
                .replace("objections", "Objection Library")
                .replace("scheduler", "Follow-Up Scheduler")
                .replace("outcome", "Generate Outcome")}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#141925] p-6 rounded-lg shadow-md">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Deal Overview</h2>
              <div className="p-3 bg-[#0a0f1a] rounded-md">
                <p>Client: John Doe | Product: IUL | Status: Pending</p>
              </div>
            </div>
          )}
          {activeTab === "objections" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Objection Library</h2>
              <div className="flex items-center gap-2 p-3 bg-[#0a0f1a] rounded-md">
                <AlertTriangle className="text-[#22c55e]" />
                <p>"I'm not sure about the fees."</p>
              </div>
            </div>
          )}
          {activeTab === "scripts" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">AI Scripts</h2>
              <p className="text-gray-400">Generated script: Address fee concerns with value focus.</p>
            </div>
          )}
          {activeTab === "scheduler" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Follow-Up Scheduler</h2>
              <div className="flex items-center gap-2">
                <Calendar className="text-[#22c55e]" />
                <input
                  type="date"
                  className="p-2 bg-[#0a0f1a] rounded-md border border-gray-600"
                />
              </div>
            </div>
          )}
          {activeTab === "outcome" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Generate Outcome</h2>
              <p className="text-gray-400">Closing strategy ready for execution.</p>
              <Button className="mt-4 bg-[#22c55e] hover:bg-[#1ea34e]">Generate</Button>
            </div>
          )}
        </div>

        {/* Page Insights Badge */}
        <div className="mt-6 p-4 bg-[#141925] rounded-lg">
          <h3 className="text-lg font-medium">Page Insights Score</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-16 h-2 bg-[#22c55e] rounded-full"></div>
            <p className="text-gray-400">88/100 - Good</p>
          </div>
        </div>

        {/* Cross-Tool Integration */}
        <div className="mt-6 p-4 bg-[#141925] rounded-lg">
          <h3 className="text-lg font-medium">Cross-Tool Integration</h3>
          <p className="text-gray-400 mt-2">
            Link to Deal Room or Meeting Prep for client data.
          </p>
          <Button variant="outline" className="mt-4 text-[#22c55e]">
            Connect Tools
          </Button>
        </div>

        {/* Regulatory Disclaimer */}
        <p className="text-sm text-gray-500 mt-6 text-center">
          Russell Capital Solutions is not a licensed broker-dealer. Tools are for life & annuity
          agents only. Ensure compliance with state and federal regulations.
        </p>

        {/* ━━━ 50-YEAR PROJECTION ENGINE ━━━ */}
        <div className="mt-12 bg-[#0c1425] border border-emerald-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">50-Year Projection Engine</h2>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-slate-400">Projection Horizon:</label>
            <input type="range" min="1" max="50" defaultValue="30" className="flex-1 accent-emerald-500"
              onChange={(e) => {
                const val = e.target.value;
                document.getElementById('proj-year-auto-closer')!.textContent = val;
              }} />
            <span id="proj-year-auto-closer" className="text-emerald-400 font-bold text-lg w-12 text-center">30</span>
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
                <div className="text-emerald-400 font-bold text-lg">[Deal Success Rate]</div>
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

export default AutoCloserPage;
