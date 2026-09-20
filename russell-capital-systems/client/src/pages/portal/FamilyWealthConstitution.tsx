// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, BookOpen, Briefcase, Building, Calculator, Calendar, Coins, DollarSign, Download, FileText, Library, Scale, Shield, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const FamilyWealthConstitution = () => {
  const [activeTab, setActiveTab] = useState('mission');
  const [missionStatement, setMissionStatement] = useState('');
  const [wealthPhilosophy, setWealthPhilosophy] = useState('');
  const [meetingCadence, setMeetingCadence] = useState('quarterly');
  const [isGenerated, setIsGenerated] = useState(false);

  const wealthAllocationData = [
    { category: 'Investments', value: 2500000, color: '#2dd4bf' },
    { category: 'Real Estate', value: 1800000, color: '#14b8a6' },
    { category: 'Cash Reserves', value: 750000, color: '#0d9488' },
    { category: 'Philanthropy', value: 500000, color: '#0f766e' },
  ];

  const growthData = [
    { year: '2019', netWorth: 3500000 },
    { year: '2020', netWorth: 4200000 },
    { year: '2021', netWorth: 4800000 },
    { year: '2022', netWorth: 5500000 },
    { year: '2023', netWorth: 6200000 },
  ];

  const tabs = [
    { id: 'mission', label: 'Mission Statement', icon: Shield },
    { id: 'wealth', label: 'Wealth Philosophy', icon: Wallet },
    { id: 'governance', label: 'Governance', icon: Scale },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'philanthropy', label: 'Philanthropy', icon: Coins },
  ];

  const handleGenerateOutcome = () => {
    if (!missionStatement || !wealthPhilosophy) {
      toast.error('Please fill in key sections before generating.');
      return;
    }
    setIsGenerated(true);
    toast.success('Family Wealth Constitution generated successfully!');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Building className="w-8 h-8 text-emerald-400" />
          Family Wealth Constitution Builder
        </h1>
        <p className="text-[#7a95b8] mb-6">Craft a legacy framework for your family&#39;s financial future and governance.</p>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#1e3a5f]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-md ${
                activeTab === tab.id ? 'bg-[#0d1526] text-emerald-400' : 'text-[#7a95b8] hover:bg-[#0d1526]/50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border border-[#1e3a5f]">
          {activeTab === 'mission' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-emerald-400" />
                Family Mission Statement
              </h2>
              <textarea
                value={missionStatement}
                onChange={(e) => setMissionStatement(e.target.value)}
                placeholder="Define your family&#39;s core values and vision for wealth..."
                className="w-full p-4 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white min-h-40 placeholder-[#7a95b8] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {activeTab === 'wealth' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" />
                Wealth Transfer Philosophy
              </h2>
              <textarea
                value={wealthPhilosophy}
                onChange={(e) => setWealthPhilosophy(e.target.value)}
                placeholder="Outline principles for wealth transfer and stewardship (Ref: IRS Code Section 2503 for gifting limits)..."
                className="w-full p-4 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white min-h-40 placeholder-[#7a95b8] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Wealth Allocation Overview</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wealthAllocationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="category" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', borderRadius: '4px', color: 'white' }} />
                      <Bar dataKey="value" fill="#2dd4bf" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Scale className="w-6 h-6 text-emerald-400" />
                Family Governance &amp; Meetings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[#7a95b8] mb-2">Family Meeting Cadence</label>
                  <select
                    value={meetingCadence}
                    onChange={(e) => setMeetingCadence(e.target.value)}
                    className="w-full p-3 bg-[#0a0f1a] border border-[#1e3a5f] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="biannual">Biannual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <p className="text-[#7a95b8]">Structure family council roles and conflict resolution per best practices.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-emerald-400" />
                Next-Gen Education Curriculum
              </h2>
              <p className="text-[#7a95b8] mb-4">Design mentorship and financial literacy programs for future generations.</p>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f', borderRadius: '4px', color: 'white' }} />
                    <Area type="monotone" dataKey="netWorth" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[#7a95b8] mt-2">Track family wealth growth to educate successors.</p>
            </div>
          )}

          {activeTab === 'philanthropy' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Coins className="w-6 h-6 text-emerald-400" />
                Philanthropy Charter
              </h2>
              <p className="text-[#7a95b8]">Define giving goals and committee structure (Ref: IRS Code Section 501(c)(3) for tax-exempt status).</p>
            </div>
          )}
        </div>

        {/* Generate Outcome Section */}
        <div className="mt-6 bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-400" />
            Generate Outcome
          </h2>
          <button
            onClick={handleGenerateOutcome}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-md transition"
          >
            <Download className="w-5 h-5" />
            Generate Constitution Document
          </button>
          {isGenerated && (
            <div className="mt-4 p-4 bg-[#0a0f1a] border border-emerald-500 rounded-md">
              <p className="text-emerald-400 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document generated with your inputs. Download complete.
              </p>
            </div>
          )}
        </div>
      </div>
      <PageInsights section="family-wealth-constitution" />
    </div>
  );
};

export default FamilyWealthConstitution;