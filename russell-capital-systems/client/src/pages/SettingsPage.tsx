// FILE: client/src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { SettingsIcon, UserIcon, BellIcon, PaintbrushIcon, DownloadIcon, KeyIcon, LinkIcon } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-4 h-4" /> },
    { id: 'theme', label: 'Theme & Display', icon: <PaintbrushIcon className="w-4 h-4" /> },
    { id: 'export', label: 'Data Export', icon: <DownloadIcon className="w-4 h-4" /> },
    { id: 'api', label: 'API Keys', icon: <KeyIcon className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <LinkIcon className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" className="w-full p-2 bg-[#141925] rounded-md border border-gray-700 text-white" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="w-full p-2 bg-[#141925] rounded-md border border-gray-700 text-white" placeholder="john@russellcapital.com" />
              </div>
            </div>
            <button className="bg-[#22c55e] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Save Changes</button>
          </div>
        );
      case 'notifications':
        return <div className="text-gray-400">Notification preferences will be configured here.</div>;
      case 'theme':
        return <div className="text-gray-400">Theme and display settings will be available soon.</div>;
      case 'export':
        return <div className="text-gray-400">Data export options will be implemented in the next update.</div>;
      case 'api':
        return <div className="text-gray-400">API key management coming soon.</div>;
      case 'integrations':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cross-Tool Integration</h3>
            <p className="text-gray-400">Connect with third-party tools for seamless workflow.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#141925] rounded-md">CRM Integration</div>
              <div className="p-4 bg-[#141925] rounded-md">Document Signing</div>
              <div className="p-4 bg-[#141925] rounded-md">Annuity Calculator</div>
            </div>
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
            <SettingsIcon className="w-6 h-6 text-[#22c55e]" /> Settings
          </h1>
          <div className="bg-[#141925] px-3 py-1 rounded-md text-sm border border-[#22c55e]/30">
            Page Insights: <span className="text-[#22c55e]">98/100</span>
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
              <h2 className="text-xl font-semibold mb-6 capitalize">{activeTab}</h2>
              {renderContent()}
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500 text-center">
          <p>Regulatory Notice: Russell Capital Systems provides tools for life & annuity agents only. Not for series-licensed professionals.</p>
          <p>Products supported: IUL, FIA, Fixed Annuities, Solar Roth, Oil & Gas. Consult compliance before use.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
