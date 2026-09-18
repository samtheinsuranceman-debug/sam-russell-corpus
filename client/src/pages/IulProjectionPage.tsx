// FILE: client/src/pages/IulProjectionPage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const IulProjectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("projection");
  const [selectedYear, setSelectedYear] = useState("2005");

  const tabs = [
    "Projection", "Ibbotson History", "Cash Value Growth", 
    "Surrender Values", "Policy Loans", "Generate Outcome"
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">IUL Projection Tool</h1>

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
            <CardTitle className="text-xl">IUL Projection (8% Cap / 0% Floor)</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === "projection" && (
              <div className="space-y-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-[#0a0f1a] border-gray-600 text-white">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 2023 - 1929 + 1 }, (_, i) => 1929 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Ibbotson Chart Basis (1929-Present) Placeholder</p>
                </div>
              </div>
            )}
            {activeTab !== "projection" && (
              <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Content for {activeTab.replace("-", " ")} coming soon...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Page Insights */}
        <div className="mt-6 flex justify-end">
          <div className="bg-[#22c55e]/20 text-[#22c55e] px-4 py-2 rounded-lg text-sm">
            Page Insights Score: 92/100
          </div>
        </div>

        {/* Cross-Tool Integration */}
        <Card className="mt-6 bg-[#0a0f1a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Cross-Tool Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Link projections to Strategy Lab, Annuity Explorer, or Real Estate tools for comprehensive analysis.
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

export default IulProjectionPage;
