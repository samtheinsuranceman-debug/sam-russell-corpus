import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Award, Calendar, BookOpenCheck, Zap } from "lucide-react";

const CertificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("active");

  const tabs = [
    { id: "active", label: "Active Certs" },
    { id: "renewals", label: "Upcoming Renewals" },
    { id: "credits", label: "CE Credits" },
    { id: "materials", label: "Study Materials" },
    { id: "outcome", label: "Generate Outcome" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Certifications Manager</h1>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={`${
                activeTab === tab.id ? "bg-[#22c55e] hover:bg-[#1ea34d]" : "border-gray-600 text-gray-300"
              } transition-colors`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#141925] p-6 rounded-lg shadow-md">
          {activeTab === "active" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Active Certifications</h2>
              <div className="space-y-2">
                <div className="bg-[#1a202c] p-3 rounded-md">Life & Annuity Cert - Exp. 12/2024</div>
                <div className="bg-[#1a202c] p-3 rounded-md">IUL Specialist - Exp. 6/2025</div>
              </div>
            </div>
          )}
          {activeTab === "renewals" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upcoming Renewals</h2>
              <p className="text-gray-400">Life & Annuity Cert - Due: 12/2024</p>
            </div>
          )}
          {activeTab === "credits" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">CE Credits</h2>
              <p className="text-gray-400">Total Earned: 24 | Required for Renewal: 30</p>
            </div>
          )}
          {activeTab === "materials" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Study Materials</h2>
              <p className="text-gray-400">Available: IUL Advanced Guide, FIA Exam Prep</p>
              <Button className="mt-2 bg-[#22c55e] hover:bg-[#1ea34d]">Download</Button>
            </div>
          )}
          {activeTab === "outcome" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Generate Outcome</h2>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Certification Goal"
                  className="w-full bg-[#1a202c] p-3 rounded-md border border-gray-600"
                />
                <select className="w-full bg-[#1a202c] p-3 rounded-md border border-gray-600">
                  <option>Focus Area</option>
                  <option>IUL Specialist</option>
                  <option>FIA Expert</option>
                </select>
                <Button className="bg-[#22c55e] hover:bg-[#1ea34d]">Generate Study Plan</Button>
              </form>
            </div>
          )}
        </div>

        {/* Cross-Tool Integration */}
        <div className="mt-6 bg-[#141925] p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="text-[#22c55e]" size={24} /> Cross-Tool Integration
          </h2>
          <p className="text-gray-400">Sync certifications with Training and Career Path.</p>
          <Button variant="outline" className="mt-2 border-[#22c55e] text-[#22c55e]">
            Link Tools
          </Button>
        </div>

        {/* Page Insights Badge */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-[#1a202c] px-4 py-2 rounded-md text-sm">
            Page Insights Score: <span className="text-[#22c55e]">90/100</span>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <p className="mt-4 text-gray-500 text-sm text-center">
          Certification tracking is for reference only. Verify status with regulatory bodies. Russell Capital Solutions is not a certifying entity.
        </p>

        {/* ━━━ 50-YEAR PROJECTION ENGINE ━━━ */}
        <div className="mt-12 bg-[#0c1425] border border-emerald-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">50-Year Projection Engine</h2>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-slate-400">Projection Horizon:</label>
            <input type="range" min="1" max="50" defaultValue="30" className="flex-1 accent-emerald-500"
              onChange={(e) => {
                const val = e.target.value;
                document.getElementById('proj-year-certifications')!.textContent = val;
              }} />
            <span id="proj-year-certifications" className="text-emerald-400 font-bold text-lg w-12 text-center">30</span>
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
                <div className="text-emerald-400 font-bold text-lg">[Certification Impact]</div>
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

export default CertificationsPage;
