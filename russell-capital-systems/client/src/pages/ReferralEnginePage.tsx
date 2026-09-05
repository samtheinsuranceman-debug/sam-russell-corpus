// FILE: client/src/pages/ReferralEnginePage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Award, Zap } from "lucide-react";

const ReferralEnginePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Referral Dashboard" },
    { id: "active", label: "Active Referrals" },
    { id: "rewards", label: "Rewards" },
    { id: "campaigns", label: "Campaigns" },
    { id: "outcome", label: "Generate Outcome" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Referral Engine</h1>

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
          {activeTab === "dashboard" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Referral Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1a202c] p-4 rounded-md flex items-center gap-3">
                  <Users className="text-[#22c55e]" size={24} />
                  <div>
                    <p className="text-sm text-gray-400">Total Referrals</p>
                    <p className="text-xl font-bold">24</p>
                  </div>
                </div>
                <div className="bg-[#1a202c] p-4 rounded-md flex items-center gap-3">
                  <DollarSign className="text-[#22c55e]" size={24} />
                  <div>
                    <p className="text-sm text-gray-400">Earnings</p>
                    <p className="text-xl font-bold">$1,250</p>
                  </div>
                </div>
                <div className="bg-[#1a202c] p-4 rounded-md flex items-center gap-3">
                  <Award className="text-[#22c55e]" size={24} />
                  <div>
                    <p className="text-sm text-gray-400">Conversion Rate</p>
                    <p className="text-xl font-bold">18%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "active" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Active Referrals</h2>
              <p className="text-gray-400">Track pending referrals here.</p>
              <div className="mt-4 space-y-2">
                <div className="bg-[#1a202c] p-3 rounded-md">John Doe - IUL - Pending</div>
                <div className="bg-[#1a202c] p-3 rounded-md">Jane Smith - FIA - In Progress</div>
              </div>
            </div>
          )}
          {activeTab === "rewards" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Rewards</h2>
              <p className="text-gray-400">Current Balance: $1,250 | Redeemable: $800</p>
            </div>
          )}
          {activeTab === "campaigns" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Campaigns</h2>
              <p className="text-gray-400">Active: IUL Summer Drive | Solar Roth Launch</p>
            </div>
          )}
          {activeTab === "outcome" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Generate Outcome</h2>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Referral Name"
                  className="w-full bg-[#1a202c] p-3 rounded-md border border-gray-600"
                />
                <select className="w-full bg-[#1a202c] p-3 rounded-md border border-gray-600">
                  <option>Product (IUL, FIA, Solar Roth)</option>
                  <option>IUL</option>
                  <option>FIA</option>
                </select>
                <Button className="bg-[#22c55e] hover:bg-[#1ea34d]">Generate Report</Button>
              </form>
            </div>
          )}
        </div>

        {/* Cross-Tool Integration */}
        <div className="mt-6 bg-[#141925] p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="text-[#22c55e]" size={24} /> Cross-Tool Integration
          </h2>
          <p className="text-gray-400">Link referral data to Career Path and Training modules.</p>
          <Button variant="outline" className="mt-2 border-[#22c55e] text-[#22c55e]">
            Connect Tools
          </Button>
        </div>

        {/* Page Insights Badge */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-[#1a202c] px-4 py-2 rounded-md text-sm">
            Page Insights Score: <span className="text-[#22c55e]">92/100</span>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <p className="mt-4 text-gray-500 text-sm text-center">
          Russell Capital Systems is not a broker-dealer. Products limited to life & annuity agents. Consult compliance before referrals.
        </p>
      </div>
    </div>
  );
};

export default ReferralEnginePage;
