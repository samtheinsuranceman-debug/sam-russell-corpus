// FILE: client/src/pages/MygaWaterfallPage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface MygaCycle {
  cycle: number;
  startValue: number;
  endValue: number;
  oilGasOffset: number;
}

const MygaWaterfallPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Waterfall Builder");
  const tabs = [
    "Waterfall Builder",
    "Cycle Analysis",
    "Oil & Gas Offset",
    "Carrier Compare",
    "Loan Analysis",
    "Generate Outcome",
  ];

  const [cycles, setCycles] = useState<MygaCycle[]>([
    { cycle: 1, startValue: 100000, endValue: 121000, oilGasOffset: 5000 },
    { cycle: 2, startValue: 121000, endValue: 146410, oilGasOffset: 6000 },
  ]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">MYGA Waterfall Laddering</h1>
        <p className="text-gray-400">5-Year Cycle Compounding with Oil & Gas Offset</p>
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
        {activeTab === "Waterfall Builder" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Build Your Waterfall</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1">Initial Investment ($)</label>
                <input
                  type="number"
                  defaultValue={100000}
                  className="w-full p-2 bg-[#0a0f1a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Cycle Duration (Years)</label>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-full p-2 bg-[#0a0f1a] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">Projected Cycles</h3>
              <div className="mt-2 space-y-2">
                {cycles.map((cycle) => (
                  <div key={cycle.cycle} className="p-3 bg-[#0a0f1a] rounded-md">
                    <p>Cycle {cycle.cycle}: ${cycle.startValue.toLocaleString()} → ${cycle.endValue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "Cycle Analysis" && <div className="text-center py-6">Cycle Analysis Placeholder</div>}
        {activeTab === "Oil & Gas Offset" && <div className="text-center py-6">Oil & Gas Offset Placeholder</div>}
        {activeTab === "Carrier Compare" && <div className="text-center py-6">Carrier Comparison Placeholder</div>}
        {activeTab === "Loan Analysis" && <div className="text-center py-6">Loan Analysis Placeholder</div>}
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
          Integrate with Wealth Genome for risk-adjusted returns or Risk Score for mitigation strategies.
        </p>
        <Button variant="outline" className="mt-4 text-[#22c55e] border-[#22c55e]">
          Connect Tools <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Page Insights Badge */}
      <div className="mt-6 flex justify-center">
        <div className="bg-[#141925] px-4 py-2 rounded-md border border-[#22c55e]">
          <p className="text-[#22c55e]">Page Insights Score: 92/100</p>
        </div>
      </div>

      {/* Regulatory Disclaimer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Russell Capital Solutions provides tools for informational purposes only. Not intended as financial advice. Consult a qualified professional for personalized guidance. MYGA products are not FDIC insured.
        </p>
      </footer>
    </div>
  );
};

export default MygaWaterfallPage;
