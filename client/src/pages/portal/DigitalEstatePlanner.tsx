// @ts-nocheck
import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, BookOpen, Calculator, CheckCircle2, ChevronDown, ChevronUp, Coins, Database, FileText, Globe, Key, Lock, Mail, Network, Server, Settings, ShieldCheck, User, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageInsights } from '@/components/PageInsights';

const DigitalEstatePlanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'access' | 'executor'>('inventory');
  const [cryptoAssets, setCryptoAssets] = useState([{ name: '', value: '', walletKey: '' }]);
  const [socialAccounts, setSocialAccounts] = useState([{ platform: '', handle: '', legacyContact: '' }]);
  const [simulationResult, setSimulationResult] = useState<{ successRate: number; issues: string[] } | null>(null);

  // Sample data for charts
  const assetDistributionData = [
    { name: 'Crypto', value: 25000 },
    { name: 'Cloud Storage', value: 5000 },
    { name: 'Subscriptions', value: 1200 },
    { name: 'Domains', value: 800 },
    { name: 'Media', value: 3000 },
  ];

  const accessRiskData = [
    { month: 'Jan', risk: 40 },
    { month: 'Feb', risk: 30 },
    { month: 'Mar', risk: 50 },
    { month: 'Apr', risk: 25 },
    { month: 'May', risk: 35 },
  ];

  const handleAddCrypto = () => setCryptoAssets([...cryptoAssets, { name: '', value: '', walletKey: '' }]);
  const handleAddSocial = () => setSocialAccounts([...socialAccounts, { platform: '', handle: '', legacyContact: '' }]);

  const handleGenerateOutcome = () => {
    // Readiness is computed from what has been entered: every listed asset
    // needs a named item plus access instructions, every account a legacy contact.
    const cryptoRows = cryptoAssets.filter((a) => a.name.trim() || a.value.trim() || a.walletKey.trim());
    const socialRows = socialAccounts.filter((a) => a.platform.trim() || a.handle.trim() || a.legacyContact.trim());
    const checks: boolean[] = [
      ...cryptoRows.map((a) => Boolean(a.name.trim() && a.walletKey.trim())),
      ...socialRows.map((a) => Boolean((a.platform.trim() || a.handle.trim()) && a.legacyContact.trim())),
    ];
    if (checks.length === 0) {
      setSimulationResult(null);
      toast.error('Add at least one digital asset or account to assess readiness.');
      return;
    }
    const successRate = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    const issues: string[] = [];
    const missingKeys = cryptoRows.filter((a) => !a.walletKey.trim()).length;
    const missingContacts = socialRows.filter((a) => !a.legacyContact.trim()).length;
    if (missingKeys) issues.push(`${missingKeys} digital asset${missingKeys === 1 ? '' : 's'} without access instructions`);
    if (missingContacts) issues.push(`${missingContacts} account${missingContacts === 1 ? '' : 's'} without a legacy contact`);
    setSimulationResult({ successRate, issues });
    toast.success('Readiness calculated from the items you entered.');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-6">
          <Database className="w-8 h-8 text-emerald-400" />
          Digital Estate Planner
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-[#1e3a5f] mb-8">
          {['inventory', 'access', 'executor'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'inventory' | 'access' | 'executor')}
              className={`pb-4 px-6 font-medium capitalize ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-[#7a95b8]'}`}
            >
              {tab === 'inventory' && <Wallet className="w-4 h-4 inline mr-1" />} 
              {tab === 'access' && <Key className="w-4 h-4 inline mr-1" />}
              {tab === 'executor' && <User className="w-4 h-4 inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'inventory' && (
            <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
              <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                <Coins className="w-6 h-6 text-emerald-400" />
                Digital Asset Inventory
              </h2>
              <p className="text-[#7a95b8] mb-4">Track cryptocurrency, subscriptions, and domains under RUFADAA compliance.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="name" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f' }} labelStyle={{ color: '#fff' }} />
                      <Bar dataKey="value" fill="#2dd4bf" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {cryptoAssets.map((asset, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Asset Name"
                        value={asset.name}
                        onChange={(e) => {
                          const newAssets = [...cryptoAssets];
                          newAssets[idx].name = e.target.value;
                          setCryptoAssets(newAssets);
                        }}
                        className="bg-[#0a0f1a] border-[#1e3a5f] rounded-md p-2 text-white w-1/3"
                      />
                      <input
                        type="text"
                        placeholder="Value (USD)"
                        value={asset.value}
                        onChange={(e) => {
                          const newAssets = [...cryptoAssets];
                          newAssets[idx].value = e.target.value;
                          setCryptoAssets(newAssets);
                        }}
                        className="bg-[#0a0f1a] border-[#1e3a5f] rounded-md p-2 text-white w-1/3"
                      />
                    </div>
                  ))}
                  <button onClick={handleAddCrypto} className="text-emerald-400 flex items-center gap-1">
                    <Globe className="w-4 h-4" /> Add Asset
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
              <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                <Lock className="w-6 h-6 text-emerald-400" />
                Access Management
              </h2>
              <p className="text-[#7a95b8] mb-4">Secure access protocols for digital accounts and keys.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accessRiskData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="month" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0d1526', border: '1px solid #1e3a5f' }} labelStyle={{ color: '#fff' }} />
                      <Area type="monotone" dataKey="risk" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {socialAccounts.map((account, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Platform"
                        value={account.platform}
                        onChange={(e) => {
                          const newAccounts = [...socialAccounts];
                          newAccounts[idx].platform = e.target.value;
                          setSocialAccounts(newAccounts);
                        }}
                        className="bg-[#0a0f1a] border-[#1e3a5f] rounded-md p-2 text-white w-1/3"
                      />
                      <input
                        type="text"
                        placeholder="Legacy Contact"
                        value={account.legacyContact}
                        onChange={(e) => {
                          const newAccounts = [...socialAccounts];
                          newAccounts[idx].legacyContact = e.target.value;
                          setSocialAccounts(newAccounts);
                        }}
                        className="bg-[#0a0f1a] border-[#1e3a5f] rounded-md p-2 text-white w-1/3"
                      />
                    </div>
                  ))}
                  <button onClick={handleAddSocial} className="text-emerald-400 flex items-center gap-1">
                    <Network className="w-4 h-4" /> Add Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'executor' && (
            <div className="bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
              <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                Digital Executor Appointment
              </h2>
              <p className="text-[#7a95b8] mb-4">Appoint a fiduciary per state laws (RUFADAA).</p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Executor Name"
                  className="bg-[#0a0f1a] border-[#1e3a5f] rounded-md p-2 text-white w-full"
                />
                <p className="text-sm text-[#7a95b8]">Legal reference: IRS Code Section 7216 for fiduciary disclosure.</p>
              </div>
            </div>
          )}
        </div>

        {/* Generate Outcome Section */}
        <div className="mt-8 bg-[#0d1526] p-6 rounded-lg border border-[#1e3a5f]">
          <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
            <Calculator className="w-6 h-6 text-emerald-400" />
            Generate Outcome
          </h2>
          <button
            onClick={handleGenerateOutcome}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-md"
          >
            Simulate Plan Success
          </button>
          {simulationResult && (
            <div className="mt-4 text-[#7a95b8]">
              <p>Plan readiness: {simulationResult.successRate}% of listed items have complete access details</p>
              {simulationResult.issues.length > 0 && (
                <ul className="list-disc ml-5">
                  {simulationResult.issues.map((issue, idx) => (
                    <li key={idx} className="text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <PageInsights section="digital-estate-planner" />
    </div>
  );
};

export default DigitalEstatePlanner;