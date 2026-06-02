// FILE: client/src/pages/MeetingPrepPage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download } from "lucide-react";

const MeetingPrepPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("lookup");
  const tabs = ["lookup", "data", "preview", "customize", "export", "outcome"];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Meeting Prep</h1>
        <p className="text-gray-400 mb-6">AI-driven financial strategy generator.</p>

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
              {tab.replace("lookup", "Client Lookup").replace("outcome", "Generate Outcome")}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#141925] p-6 rounded-lg shadow-md">
          {activeTab === "lookup" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Client Lookup</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter client name or ID"
                  className="flex-1 p-2 bg-[#0a0f1a] rounded-md border border-gray-600"
                />
                <Button className="bg-[#22c55e] hover:bg-[#1ea34e]">
                  <Search size={16} />
                </Button>
              </div>
            </div>
          )}
          {activeTab === "data" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Data Gathering</h2>
              <p className="text-gray-400">Public data fetched: Income, assets, risk profile.</p>
            </div>
          )}
          {activeTab === "preview" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Presentation Preview</h2>
              <div className="p-4 bg-[#0a0f1a] rounded-md">
                <p className="text-gray-400">Slide 1: IUL Strategy Overview</p>
              </div>
            </div>
          )}
          {activeTab === "customize" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Customize</h2>
              <input
                type="text"
                placeholder="Add custom notes or product focus (e.g., FIA)"
                className="w-full p-2 bg-[#0a0f1a] rounded-md border border-gray-600"
              />
            </div>
          )}
          {activeTab === "export" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Export</h2>
              <Button className="bg-[#22c55e] hover:bg-[#1ea34e]">
                <Download size={16} className="mr-2" /> Export PPT
              </Button>
            </div>
          )}
          {activeTab === "outcome" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Generate Outcome</h2>
              <p className="text-gray-400">Final presentation ready for client meeting.</p>
              <Button className="mt-4 bg-[#22c55e] hover:bg-[#1ea34e]">Generate</Button>
            </div>
          )}
        </div>

        {/* Page Insights Badge */}
        <div className="mt-6 p-4 bg-[#141925] rounded-lg">
          <h3 className="text-lg font-medium">Page Insights Score</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-16 h-2 bg-[#22c55e] rounded-full"></div>
            <p className="text-gray-400">95/100 - Excellent</p>
          </div>
        </div>

        {/* Cross-Tool Integration */}
        <div className="mt-6 p-4 bg-[#141925] rounded-lg">
          <h3 className="text-lg font-medium">Cross-Tool Integration</h3>
          <p className="text-gray-400 mt-2">
            Link to Deal Room or Auto-Closer for client follow-ups.
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
      </div>
    </div>
  );
};

export default MeetingPrepPage;
