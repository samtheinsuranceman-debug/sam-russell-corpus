// FILE: client/src/pages/MarketPulsePage.tsx
import React, { useState } from 'react';
import { ChartLineIcon, GlobeIcon, FactoryIcon, BrainIcon, AlertTriangleIcon, WandIcon } from 'lucide-react';

const MarketPulsePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Market Overview', icon: <GlobeIcon className="w-4 h-4" /> },
    { id: 'indicators', label: 'Economic Indicators', icon: <ChartLineIcon className="w-4 h-4" /> },
    { id: 'sector', label: 'Sector Analysis', icon: <FactoryIcon className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Insights', icon: <BrainIcon className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangleIcon className="w-4 h-4" /> },
    { id: 'outcome', label: 'Generate Outcome', icon: <WandIcon className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#141925] rounded-md border border-gray-700">
                <h3 className="text-lg font-medium">S&P 500</h3>
                <p className="text-[#22c55e] text-xl">+1.2%</p>
              </div>
              <div className="p-4 bg-[#141925] rounded-md border border-gray-700">
                <h3 className="text-lg font-medium">10-Year Treasury</h3>
                <p className="text-gray-400 text-xl">3.9%</p>
              </div>
              <div className="p-4 bg-[#141925] rounded-md border border-gray-700">
                <h3 className="text-lg font-medium">Oil & Gas Index</h3>
                <p className="text-[#22c55e] text-xl">+0.8%</p>
              </div>
            </div>
          </div>
        );
      case 'indicators':
        return <div className="text-gray-400">Economic data such as inflation, GDP, and interest rates will be displayed here.</div>;
      case 'sector':
        return <div className="text-gray-400">Analysis for sectors relevant to IUL, FIA, and Oil & Gas coming soon.</div>;
      case 'ai':
        return <div className="text-gray-400">AI-driven market predictions and client portfolio insights will be available.</div>;
      case 'alerts':
        return <div className="text-gray-400">Real-time alerts for market events impacting annuity products.</div>;
      case 'outcome':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generate Client Outcome</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Type</label>
                <select className="w-full p-2 bg-[#141925] rounded-md border border-gray-700 text-white">
                  <option>IUL</option>
                  <option>FIA</option>
                  <option>Fixed Annuity</option>
                  <option>Solar Roth</option>
                  <option>Oil & Gas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Investment Amount</label>
                <input type="number" className="w-full p-2 bg-[#141925] rounded-md border border-gray-700 text-white" placeholder="10000" />
              </div>
            </div>
            <button className="bg-[#22c55e] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Generate Projection</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChartLineIcon className="w-6 h-6 text-[#22c55e]" /> Market Pulse
          </h1>
          <div className="bg-[#141925] px-3 py-1 rounded-md text-sm border border-[#22c55e]/30">
            Page Insights: <span className="text-[#22c55e]">95/100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[#141925] rounded-lg p-4 shadow-md border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Navigation</h2>
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-md text-left ${
                      activeTab === tab.id ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'hover:bg-gray-800'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-[#141925] rounded-lg p-6 shadow-md border border-gray-800">
              <h2 className="text-xl font-semibold mb-6 capitalize">{activeTab.replace('-', ' ')}</h2>
              {renderContent()}
              {activeTab === 'outcome' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold">Cross-Tool Integration</h3>
                  <p className="text-gray-400">Export projections to client management tools.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="p-4 bg-[#141925] rounded-md">Export to CRM</div>
                    <div className="p-4 bg-[#141925] rounded-md">Share with Compliance</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500 text-center">
          <p>Regulatory Notice: Market data is for informational purposes only. Not investment advice for series-licensed activities.</p>
          <p>Products supported: IUL, FIA, Fixed Annuities, Solar Roth, Oil & Gas. Consult compliance before client discussions.</p>
        </div>
      </div>
    </div>
  );
};

export default MarketPulsePage;
