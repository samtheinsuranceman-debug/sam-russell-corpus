// FILE: client/src/pages/RiskScorePage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface RiskCategory {
  name: string;
  score: number;
}

const RiskScorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Risk Dashboard");
  const tabs = ["Risk Dashboard", "Category Breakdown", "Mitigation Strategies", "Historical Trend", "Generate Outcome"];

  const categories: RiskCategory[] = [
    { name: "Market Risk", score: 65 },
    { name: "Longevity Risk", score: 72 },
    { name: "Inflation Risk", score: 58 },
    { name: "Health Risk", score: 80 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Comprehensive Risk Score</h1>
        <p className="text-gray-400">Assess Risk Across Financial Dimensions</p>
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
        {activeTab === "Risk Dashboard" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Risk Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat.name} className="p-3 bg-[#0a0f1a] rounded-md">
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-[#22c55e]">Risk Score: {cat.score}/100</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "Category Breakdown" && <div className="text-center py-6">Category Breakdown Placeholder</div>}
        {activeTab === "Mitigation Strategies" && (
          <div className="text-center py-6">Mitigation Strategies Placeholder</div>
        )}
        {activeTab === "Historical Trend" && <div className="text-center py-6">Historical Trend Placeholder</div>}
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
          Integrate with Wealth Genome for holistic scoring or Income Annuity for risk-adjusted income planning.
        </p>
        <Button variant="outline" className="mt-4 text-[#22c55e] border-[#22c55e]">
          Connect Tools <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Page Insights Badge */}
      <div className="mt-6 flex justify-center">
        <div className="bg-[#141925] px-4 py-2 rounded-md border border-[#22c55e]">
          <p className="text-[#22c55e]">Page Insights Score: 90/100</p>
        </div>
      </div>

      {/* Regulatory Disclaimer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Russell Capital Systems tools are for informational purposes only. Risk assessments are estimates and not guarantees. Consult a professional advisor.
        </p>
      </footer>
    </div>
  );
};

export default RiskScorePage;
