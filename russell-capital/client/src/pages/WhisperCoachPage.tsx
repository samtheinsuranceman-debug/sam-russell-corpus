// FILE: client/src/pages/WhisperCoachPage.tsx
import React from "react";
import { StrategyContext } from "../context/StrategyContext"; // Placeholder import

const WhisperCoachPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Whisper Coach (Live Meeting)</h1>
      <div className="flex justify-center mb-6">
        <button className="px-4 py-2 bg-[#22c55e] text-black rounded-md">Generate Outcome</button>
      </div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl mb-4">Live Meeting Interface</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-48 bg-gray-800 rounded-md flex items-center justify-center text-gray-400">Client Video Feed</div>
          <div className="h-48 bg-gray-800 rounded-md flex items-center justify-center text-gray-400">Your Video Feed</div>
          <div className="h-48 bg-gray-700 rounded-md p-2 overflow-y-auto">
            <p className="text-[#22c55e] text-sm">AI Coach: Suggest focusing on IUL benefits now.</p>
            <p className="text-gray-400 text-sm">AI Coach: Client seems hesitant about risk.</p>
          </div>
        </div>
      </div>
      <div className="mt-6 bg-gray-900 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Page Insights</h3>
        <span className="inline-block bg-[#22c55e] text-black px-2 py-1 rounded-md text-sm">Score: 89/100</span>
      </div>
      <div className="mt-6 bg-gray-900 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Cross-Tool Integration</h3>
        <p className="text-gray-400">Connected: Meeting Prep, Auto Closer</p>
      </div>
      <p className="text-xs text-gray-500 mt-4">Disclaimer: AI suggestions are not guaranteed. Use professional judgment.</p>
    </div>
  );
};

export default WhisperCoachPage;
