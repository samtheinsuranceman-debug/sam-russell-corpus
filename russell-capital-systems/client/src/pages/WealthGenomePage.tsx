// FILE: client/src/pages/WealthGenomePage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface Dimension {
  name: string;
  score: number;
}

const WealthGenomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Genome Overview");
  const tabs = ["Genome Overview", "Dimension Detail", "Historical Trend", "Peer Comparison", "Generate Outcome"];

  const dimensions: Dimension[] = [
    { name: "Income Stability", score: 82 },
    { name: "Tax Efficiency", score: 75 },
    { name: "Insurance Coverage", score: 88 },
    { name: "Retirement Readiness", score: 70 },
    { name: "Estate Planning", score: 65 },
    { name: "Debt Management", score: 78 },
    { name: "Investment Diversification", score: 80 },
    { name: "Risk Mitigation", score: 73 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Wealth Genome Analysis</h1>
        <p className="text-gray-400">8-Dimension Financial Health Score (Patented Double-Helix Model)</p>
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
        {activeTab === "Genome Overview" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Overall Financial Health</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dimensions.map((dim) => (
                <div key={dim.name} className="p-3 bg-[#0a0f1a] rounded-md">
                  <p className="font-medium">{dim.name}</p>
                  <p className="text-[#22c55e]">{dim.score}/100</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "Dimension Detail" && <div className="text-center py-6">Dimension Detail Placeholder</div>}
        {activeTab === "Historical Trend" && <div className="text-center py-6">Historical Trend Placeholder</div>}
        {activeTab === "Peer Comparison" && <div className="text-center py-6">Peer Comparison Placeholder</div>}
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
          Connect with MYGA Waterfall for laddering insights or Income Annuity for retirement planning.
        </p>
        <Button variant="outline" className="mt-4 text-[#22c55e] border-[#22c55e]">
          Connect Tools <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Page Insights Badge */}
      <div className="mt-6 flex justify-center">
        <div className="bg-[#141925] px-4 py-2 rounded-md border border-[#22c55e]">
          <p className="text-[#22c55e]">Page Insights Score: 95/100</p>
        </div>
      </div>

      {/* Regulatory Disclaimer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Russell Capital Systems provides tools for informational purposes only. Not intended as financial advice. Consult a qualified professional for personalized guidance.
        </p>
      </footer>
    </div>
  );
};

export default WealthGenomePage;
