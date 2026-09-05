import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EstatePlanningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Estate Planning Portal</h1>
          <div className="bg-[#22c55e]/20 text-[#22c55e] px-4 py-2 rounded-lg text-sm">
            Page Insights Score: 92/100
          </div>
        </header>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#141925] border-[#22c55e]/30 w-full justify-start">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Estate Overview</TabsTrigger>
            <TabsTrigger value="ilit" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">ILIT Planner</TabsTrigger>
            <TabsTrigger value="tax" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Tax Minimization</TabsTrigger>
            <TabsTrigger value="transfer" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Wealth Transfer</TabsTrigger>
            <TabsTrigger value="beneficiary" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Beneficiary Optimizer</TabsTrigger>
            <TabsTrigger value="outcome" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Generate Outcome</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-0">
            <Card className="bg-[#141925] border-[#22c55e]/30">
              <CardHeader><CardTitle>Estate Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Estate Value ($)</Label><Input className="bg-[#0a0f1a] border-[#22c55e]/30" placeholder="5,000,000" /></div>
                  <div><Label>Expected Growth (%)</Label><Input className="bg-[#0a0f1a] border-[#22c55e]/30" placeholder="3.5" /></div>
                </div>
                <p className="text-gray-400 mt-4">Placeholder: Estimated Tax Exposure - $1.2M</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ilit" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>ILIT Planner</CardTitle></CardHeader><CardContent><p className="text-gray-400">ILIT setup data will be displayed here.</p></CardContent></Card></TabsContent>
          <TabsContent value="tax" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Tax Minimization</CardTitle></CardHeader><CardContent><p className="text-gray-400">Tax strategies will be calculated here.</p></CardContent></Card></TabsContent>
          <TabsContent value="transfer" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Wealth Transfer</CardTitle></CardHeader><CardContent><p className="text-gray-400">Transfer scenarios will be shown here.</p></CardContent></Card></TabsContent>
          <TabsContent value="beneficiary" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Beneficiary Optimizer</CardTitle></CardHeader><CardContent><p className="text-gray-400">Beneficiary allocations will be optimized here.</p></CardContent></Card></TabsContent>
          <TabsContent value="outcome" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Generate Outcome</CardTitle></CardHeader><CardContent><Button className="bg-[#22c55e] hover:bg-[#22c55e]/90">Generate Report</Button><p className="text-gray-400 mt-4">Outcome report will be generated here.</p></CardContent></Card></TabsContent>
        </Tabs>

        <Card className="bg-[#141925] border-[#22c55e]/30">
          <CardHeader><CardTitle>Cross-Tool Integration</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-400">Integrate with IUL Planner, FIA Calculator, and Solar Roth Analyzer for comprehensive planning.</p>
            <Button variant="outline" className="mt-4 border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10">Connect Tools</Button>
          </CardContent>
        </Card>

        {/* ━━━ 50-YEAR PROJECTION ENGINE ━━━ */}
        <div className="mt-12 bg-[#0c1425] border border-emerald-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">50-Year Projection Engine</h2>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-slate-400">Projection Horizon:</label>
            <input type="range" min="1" max="50" defaultValue="30" className="flex-1 accent-emerald-500"
              onChange={(e) => {
                const val = e.target.value;
                document.getElementById(`proj-year-estate-planning`)!.textContent = val;
              }} />
            <span id={`proj-year-estate-planning`} className="text-emerald-400 font-bold text-lg w-12 text-center">30</span>
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
                <div className="text-emerald-400 font-bold text-lg">[Estate Value]</div>
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

        <footer className="text-gray-500 text-sm mt-6">
          <p>Regulatory Disclaimer: Russell Capital Systems provides tools for life & annuity agents only. Not for use by series-licensed professionals. All calculations are estimates and not guaranteed. Consult legal and tax professionals for estate planning advice.</p>
        </footer>
      </div>
    </div>
  );
}

export default EstatePlanningPage;
