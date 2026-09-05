// FILE: client/src/pages/RealEstatePage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const RealEstatePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("portfolio-overview");

  const tabs = ["Portfolio Overview", "Property Analysis", "Cash Flow", "Tax Impact", "Generate Outcome"];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Real Estate Investment Analysis</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab.toLowerCase().replace(" ", "-") ? "default" : "outline"}
              className={`${
                activeTab === tab.toLowerCase().replace(" ", "-") 
                  ? "bg-[#22c55e] hover:bg-[#22c55e]/90" 
                  : "border-gray-600 text-gray-300 hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Content */}
        <Card className="bg-[#0a0f1a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Real Estate Tools Hub</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === "portfolio-overview" && (
              <div className="space-y-4">
                <Input
                  placeholder="Property Address or ID"
                  className="bg-[#0a0f1a] border-gray-600 text-white"
                />
                <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Portfolio Overview Placeholder (Mortgage Killer, House Recycling)</p>
                </div>
              </div>
            )}
            {activeTab !== "portfolio-overview" && (
              <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Content for {activeTab.replace("-", " ")} coming soon...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Page Insights */}
        <div className="mt-6 flex justify-end">
          <div className="bg-[#22c55e]/20 text-[#22c55e] px-4 py-2 rounded-lg text-sm">
            Page Insights Score: 90/100
          </div>
        </div>

        {/* Cross-Tool Integration */}
        <Card className="mt-6 bg-[#0a0f1a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Cross-Tool Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Connect to Strategy Lab or IUL Projection for integrated wealth planning.
            </p>
            <Button variant="outline" className="mt-2 border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10">
              Connect Tools
            </Button>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="mt-6 text-gray-500 text-xs text-center">
          Russell Capital Systems provides tools for educational purposes only. Not intended as financial advice. Consult a qualified professional. Not for use by series-licensed agents.
        </p>
      </div>
    </div>
  );
};

export default RealEstatePage;
