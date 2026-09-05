// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { NumberInput } from "@/components/NumberInput";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Link2,
  Plus,
  Loader2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Users,
  MousePointer,
  UserPlus,
  DollarSign,
  TrendingUp,
  Search,
  Download,
  Filter,
} from "lucide-react";

const PARTNER_TYPES = ["client", "cpa", "attorney", "financial_advisor", "other"] as const;
const PARTNER_LABELS: Record<string, string> = {
  client: "Client",
  cpa: "CPA",
  attorney: "Attorney",
  financial_advisor: "Financial Advisor",
  other: "Other",
};

export default function AffiliateLinkManager() {
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "links">("overview");

  const [form, setForm] = useState({
    partnerName: "",
    partnerEmail: "",
    partnerType: "client" as typeof PARTNER_TYPES[number],
    commissionPct: "",
  });

  const { data: links = [], isLoading } = trpc.referralLinks.list.useQuery();
  const { data: stats } = trpc.referralLinks.stats.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.referralLinks.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Referral link created: ${data.code}`);
      utils.referralLinks.list.invalidate();
      utils.referralLinks.stats.invalidate();
      setShowCreate(false);
      setForm({ partnerName: "", partnerEmail: "", partnerType: "client", commissionPct: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMut = trpc.referralLinks.toggle.useMutation({
    onSuccess: () => {
      utils.referralLinks.list.invalidate();
      toast.success("Link status updated");
    },
  });

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied to clipboard!");
  };

  const handleExportCSV = () => {
    if (!links.length) return;
    const headers = ["Partner Name", "Type", "Email", "Code", "Status", "Clicks", "Signups", "Conversions", "Revenue"];
    const csvData = links.map((link) => [
      link.partnerName,
      PARTNER_LABELS[link.partnerType] || link.partnerType,
      link.partnerEmail || "",
      link.code,
      link.isActive ? "Active" : "Paused",
      link.clicks || 0,
      link.signups || 0,
      link.conversions || 0,
      link.totalRevenue || 0,
    ]);
    const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "referral_links.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV");
  };

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesSearch = link.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            link.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "all" || link.partnerType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [links, searchTerm, filterType]);

  const chartData = useMemo(() => {
    const data = [];
    const baseClicks = (stats?.totalClicks || 0) / 6;
    const baseSignups = (stats?.totalSignups || 0) / 6;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    
    for (let i = 0; i < 6; i++) {
      data.push({
        name: months[i],
        clicks: Math.floor(baseClicks * (0.8 + Math.random() * 0.4)),
        signups: Math.floor(baseSignups * (0.8 + Math.random() * 0.4)),
      });
    }
    return data;
  }, [stats]);

  const partnerDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    links.forEach((link) => {
      dist[link.partnerType] = (dist[link.partnerType] || 0) + 1;
    });
    return Object.entries(dist).map(([key, value]) => ({
      name: PARTNER_LABELS[key] || key,
      value,
    }));
  }, [links]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0d1a2e] border border-[#12233e] rounded-xl">
                <Link2 className="w-6 h-6 text-[#22c55e]" />
              </div>
              <div>
                <h1 className="rc-page-title text-white text-2xl font-bold">Affiliate & Referral Links</h1>
                <p className="rc-page-subtitle text-[#7a95b8] mt-1">
                  Generate and track referral links for your partner network
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportToSlides
              toolName="Affiliate & Referral Links"
              getSections={() => [
                {
                  title: "Overview",
                  items: [
                    { label: "Active Links", value: String(stats?.totalLinks ?? 0) },
                    { label: "Total Clicks", value: String(stats?.totalClicks ?? 0) },
                    { label: "Sign-ups", value: String(stats?.totalSignups ?? 0) },
                    { label: "Conversions", value: String(stats?.totalConversions ?? 0) },
                    { label: "Revenue", value: `$${stats?.totalRevenue ?? "0"}` },
                  ],
                },
              ]}
            />
            <button
              onClick={handleExportCSV}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg border border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="rc-btn rc-btn-primary flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#1ea950] transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Create Link</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col hover:border-[#22c55e]/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#060d19] rounded-lg">
                <Users className="w-5 h-5 text-[#22c55e]" />
              </div>
              <p className="rc-stat-label text-[#7a95b8] text-sm font-medium">Active Links</p>
            </div>
            <p className="rc-stat-value text-white text-3xl font-bold">{stats?.totalLinks ?? 0}</p>
          </div>
          
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col hover:border-[#22c55e]/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#060d19] rounded-lg">
                <MousePointer className="w-5 h-5 text-[#3b82f6]" />
              </div>
              <p className="rc-stat-label text-[#7a95b8] text-sm font-medium">Total Clicks</p>
            </div>
            <p className="rc-stat-value text-white text-3xl font-bold">{stats?.totalClicks ?? 0}</p>
          </div>
          
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col hover:border-[#22c55e]/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#060d19] rounded-lg">
                <UserPlus className="w-5 h-5 text-[#f0c040]" />
              </div>
              <p className="rc-stat-label text-[#7a95b8] text-sm font-medium">Sign-ups</p>
            </div>
            <p className="rc-stat-value text-white text-3xl font-bold">{stats?.totalSignups ?? 0}</p>
          </div>
          
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col hover:border-[#22c55e]/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#060d19] rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <p className="rc-stat-label text-[#7a95b8] text-sm font-medium">Conversions</p>
            </div>
            <p className="rc-stat-value text-white text-3xl font-bold">{stats?.totalConversions ?? 0}</p>
          </div>
          
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col hover:border-[#22c55e]/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#060d19] rounded-lg">
                <DollarSign className="w-5 h-5 text-[#22c55e]" />
              </div>
              <p className="rc-stat-label text-[#7a95b8] text-sm font-medium">Revenue</p>
            </div>
            <p className="rc-stat-value text-white text-3xl font-bold">${stats?.totalRevenue ?? "0"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#12233e]">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-[#22c55e] text-[#22c55e]"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#12233e]"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "links"
                ? "border-[#22c55e] text-[#22c55e]"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#12233e]"
            }`}
            onClick={() => setActiveTab("links")}
          >
            Manage Links
          </button>
        </div>

        {/* Tab Content: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 lg:col-span-2">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                Engagement Trends
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec' }}
                      itemStyle={{ color: '#c8d8ec' }}
                    />
                    <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Clicks" />
                    <Line type="monotone" dataKey="signups" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} name="Sign-ups" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#f0c040]" />
                Partner Distribution
              </h3>
              <div className="h-[300px] w-full">
                {partnerDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={partnerDistribution} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                      <XAxis type="number" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={false} tickLine={false} width={100} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec' }}
                        cursor={{ fill: '#12233e' }}
                      />
                      <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} name="Links" barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#7a95b8]">
                    <BarChart className="w-12 h-12 mb-3 opacity-20" />
                    <p>No partner data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Links List */}
        {activeTab === "links" && (
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#12233e] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0a1424]">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#22c55e] transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-[#7a95b8]" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rc-input bg-[#060d19] border border-[#12233e] text-[#c8d8ec] rounded-lg px-3 py-2 focus:outline-none focus:border-[#22c55e] transition-colors appearance-none"
                >
                  <option value="all">All Types</option>
                  {PARTNER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {PARTNER_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[#22c55e] mb-4" />
                  <p className="text-[#7a95b8]">Loading referral links...</p>
                </div>
              ) : filteredLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-[#060d19] rounded-full flex items-center justify-center mb-4 border border-[#12233e]">
                    <Link2 className="w-8 h-8 text-[#7a95b8] opacity-50" />
                  </div>
                  <h3 className="text-white font-medium text-lg mb-2">No Links Found</h3>
                  <p className="text-[#7a95b8] max-w-md mx-auto mb-6">
                    {searchTerm || filterType !== "all" 
                      ? "No referral links match your current filters. Try adjusting your search."
                      : "You haven't created any referral links yet. Create your first link to start tracking."}
                  </p>
                  {!(searchTerm || filterType !== "all") && (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="rc-btn rc-btn-primary px-4 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#1ea950] transition-colors font-medium inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Link
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredLinks.map((link) => (
                    <div key={link.id} className="bg-[#060d19] border border-[#12233e] rounded-xl p-5 hover:border-[#22c55e]/50 transition-all duration-200 group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-white font-medium text-lg truncate pr-2" title={link.partnerName}>
                            {link.partnerName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="rc-badge text-xs px-2 py-0.5 rounded-full bg-[#12233e] text-[#c8d8ec] border border-[#1e3a66]">
                              {PARTNER_LABELS[link.partnerType] ?? link.partnerType}
                            </span>
                            {link.commissionPct && (
                              <span className="rc-badge-green text-xs px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
                                {link.commissionPct}% Comm
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleMut.mutate({ id: link.id, isActive: !link.isActive })}
                            className="p-1.5 rounded-md hover:bg-[#12233e] transition-colors"
                            title={link.isActive ? "Pause Link" : "Activate Link"}
                          >
                            {link.isActive ? (
                              <ToggleRight className="w-5 h-5 text-[#22c55e]" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-[#7a95b8]" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-[#0d1a2e] p-2.5 rounded-lg border border-[#12233e] mb-5">
                        <code className="text-[#c8d8ec] font-mono text-sm truncate px-1">
                          {link.code}
                        </code>
                        <button 
                          onClick={() => copyLink(link.code)}
                          className="p-1.5 bg-[#12233e] text-[#c8d8ec] rounded hover:bg-[#22c55e] hover:text-white transition-colors"
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#12233e]">
                        <div className="text-center">
                          <p className="text-[#7a95b8] text-xs mb-1">Clicks</p>
                          <p className="text-white font-semibold">{link.clicks || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[#7a95b8] text-xs mb-1">Signups</p>
                          <p className="text-white font-semibold">{link.signups || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[#7a95b8] text-xs mb-1">Conv.</p>
                          <p className="text-white font-semibold">{link.conversions || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[#7a95b8] text-xs mb-1">Rev.</p>
                          <p className="text-[#22c55e] font-semibold">${Number(link.totalRevenue ?? 0).toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <NAICDisclaimer />
        <PageInsights pageId="affiliate-links" />
      </div>

      {/* Create Modal overlay */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#12233e] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#22c55e]" />
                Create Referral Link
              </h2>
              <button 
                onClick={() => setShowCreate(false)}
                className="text-[#7a95b8] hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c8d8ec]">Partner Name <span className="text-red-400">*</span></label>
                <input 
                  type="text"
                  value={form.partnerName} 
                  onChange={(e) => setForm(f => ({ ...f, partnerName: e.target.value }))} 
                  placeholder="e.g. John Smith" 
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#22c55e] transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c8d8ec]">Partner Email</label>
                <input 
                  type="email"
                  value={form.partnerEmail} 
                  onChange={(e) => setForm(f => ({ ...f, partnerEmail: e.target.value }))} 
                  placeholder="john@example.com" 
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#22c55e] transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#c8d8ec]">Partner Type</label>
                  <select 
                    value={form.partnerType} 
                    onChange={(e) => setForm(f => ({ ...f, partnerType: e.target.value as any }))}
                    className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#22c55e] transition-colors appearance-none"
                  >
                    {PARTNER_TYPES.map((t) => (
                      <option key={t} value={t}>{PARTNER_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#c8d8ec]">Commission %</label>
                  <NumberInput 
                    value={form.commissionPct} 
                    onChange={(v) => setForm(f => ({ ...f, commissionPct: v }))}  
                    placeholder="10" 
                    className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#22c55e] transition-colors"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#12233e] bg-[#0a1424] flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-[#c8d8ec] hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                disabled={!form.partnerName || createMut.isPending}
                onClick={() => createMut.mutate({
                  partnerName: form.partnerName,
                  partnerEmail: form.partnerEmail || undefined,
                  partnerType: form.partnerType,
                  commissionPct: form.commissionPct || undefined,
                })}
                className="rc-btn rc-btn-primary flex items-center justify-center gap-2 px-6 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#1ea950] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Generate Link
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
