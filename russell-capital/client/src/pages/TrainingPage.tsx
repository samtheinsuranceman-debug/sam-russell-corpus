// FILE: client/src/pages/TrainingPage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, Book, Trophy, Zap } from "lucide-react";

const TrainingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("courses");

  const tabs = [
    { id: "courses", label: "My Courses" },
    { id: "library", label: "Course Library" },
    { id: "progress", label: "Progress" },
    { id: "certificates", label: "Certificates" },
    { id: "outcome", label: "Generate Outcome" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Training Hub</h1>

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
          {activeTab === "courses" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">My Courses</h2>
              <div className="space-y-2">
                <div className="bg-[#1a202c] p-3 rounded-md">IUL Fundamentals - 80% Complete</div>
                <div className="bg-[#1a202c] p-3 rounded-md">FIA Strategies - 45% Complete</div>
              </div>
            </div>
          )}
          {activeTab === "library" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Course Library</h2>
              <p className="text-gray-400">Available: Solar Roth Basics, Oil & Gas Intro</p>
              <Button className="mt-2 bg-[#22c55e] hover:bg-[#1ea34d]">Enroll Now</Button>
            </div>
          )}
          {activeTab === "progress" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Progress</h2>
              <p className="text-gray-400">Overall Completion: 62% | Hours Logged: 18</p>
            </div>
          )}
          {activeTab === "certificates" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Certificates</h2>
              <p className="text-gray-400">Earned: IUL Basics (2023)</p>
            </div>
          )}
          {activeTab === "outcome" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Generate Outcome</h2>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Training Focus"
                  className="w-full bg-[#1a202c] p-3 rounded-md border border-gray-600"
                />
                <select className="w-full bg-[#1a202c] p-3 rounded-md border border-gray-600">
                  <option>Product Focus</option>
                  <option>Fixed Annuities</option>
                  <option>Solar Roth</option>
                </select>
                <Button className="bg-[#22c55e] hover:bg-[#1ea34d]">Generate Plan</Button>
              </form>
            </div>
          )}
        </div>

        {/* Cross-Tool Integration */}
        <div className="mt-6 bg-[#141925] p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="text-[#22c55e]" size={24} /> Cross-Tool Integration
          </h2>
          <p className="text-gray-400">Link training progress to Career Path and Certifications.</p>
          <Button variant="outline" className="mt-2 border-[#22c55e] text-[#22c55e]">
            Integrate Now
          </Button>
        </div>

        {/* Page Insights Badge */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-[#1a202c] px-4 py-2 rounded-md text-sm">
            Page Insights Score: <span className="text-[#22c55e]">95/100</span>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <p className="mt-4 text-gray-500 text-sm text-center">
          Training materials are for educational use only. Russell Capital Solutions is not responsible for certification outcomes.
        </p>
      </div>
    </div>
  );
};

export default TrainingPage;
