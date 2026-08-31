// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Legend
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Link2,
  MessageSquare,
  Webhook,
  Globe,
  Zap,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowRight,
  ExternalLink,
  Shield,
  Bell,
  RefreshCw,
  Activity,
  Database,
  Cloud,
  Key,
  FileText,
  Search,
  Plus,
  Trash2,
  Edit2,
  Save,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  ChevronRight,
  Check,
  X,
  BarChart2,
  Hash,
  Grid,
  Layers,
  Cpu,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  connected: boolean;
  category: "communication" | "crm" | "developer" | "finance" | "analytics" | "security";
  status: "active" | "inactive" | "error" | "pending";
  lastSync?: string;
  dataSynced?: number;
  apiCalls?: number;
  healthScore?: number;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
  lastFired?: string;
  successRate?: number;
}

interface SyncLog {
  id: string;
  integrationId: string;
  timestamp: string;
  status: "success" | "error" | "warning";
  recordsProcessed: number;
  durationMs: number;
  message: string;
}

const generateSyncLogs = (count: number): SyncLog[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `log-${i}`,
    integrationId: ["slack", "hubspot", "webhooks", "salesforce", "plaid"][Math.floor(Math.random() * 5)],
    timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    status: Math.random() > 0.8 ? (Math.random() > 0.5 ? "error" : "warning") : "success",
    recordsProcessed: Math.floor(Math.random() * 1000),
    durationMs: Math.floor(Math.random() * 5000),
    message: ["Sync completed successfully", "Connection timeout", "Rate limit exceeded", "Partial sync completed"][Math.floor(Math.random() * 4)],
  }));
};

const INTEGRATIONS: IntegrationConfig[] = [{ id: "slack", name: "Slack", description: "Send notifications, alerts, and reports directly to your Slack channels. Get real-time updates on client activity, compliance events, and team performance.", icon: MessageSquare, color: "bg-[#4A154B]", connected: true, category: "communication", status: "active", lastSync: "2 mins ago", dataSynced: 15420, apiCalls: 3450, healthScore: 98 },
,
  { id: "hubspot", name: "HubSpot", description: "Sync client data, track deals, and automate marketing workflows. Two-way sync keeps your CRM and advisory platform aligned.", icon: Globe, color: "bg-[#FF7A59]", connected: true, category: "crm", status: "active", lastSync: "15 mins ago", dataSynced: 45200, apiCalls: 12500, healthScore: 95 },
,
  { id: "webhooks", name: "Webhooks", description: "Send real-time event data to any external system. Configure custom endpoints for client events, compliance triggers, and workflow automation.", icon: Webhook, color: "bg-[#6366f1]", connected: true, category: "developer", status: "active", lastSync: "Just now", dataSynced: 8900, apiCalls: 4500, healthScore: 100 },
,
  { id: "salesforce", name: "Salesforce", description: "Enterprise CRM integration for complex advisory teams. Sync accounts, contacts, opportunities, and custom objects.", icon: Cloud, color: "bg-[#00A1E0]", connected: false, category: "crm", status: "inactive", healthScore: 0 },
,
  { id: "plaid", name: "Plaid", description: "Connect client bank accounts, track transactions, and verify identity securely. Automated portfolio and cash flow analysis.", icon: Database, color: "bg-[#111111]", connected: false, category: "finance", status: "inactive", healthScore: 0 }
];

function IntegrationCard({ integration, onToggle }: { integration: IntegrationConfig, onToggle: (id: string, state: boolean) => void }) {
  const Icon = integration.icon;
  const isConnected = integration.connected;

  return (
    <Card className="border-[#1a3a5c]/40 bg-[#0a1929]/60 hover:border-[#22c55e]/30 transition-all duration-300 flex flex-col h-full">
      <CardHeader className="pb-3 flex-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${integration.color}`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">{integration.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isConnected ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                    <CheckCircle2 size={12} className="mr-1" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                    <XCircle size={12} className="mr-1" /> Not Connected
                  </Badge>
                )}
                <Badge variant="outline" className="text-slate-500 border-slate-700 text-xs capitalize">
                  {integration.category}
                </Badge>
                {isConnected && integration.status === "warning" && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                    <AlertTriangle size={12} className="mr-1" /> Warning
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <p className="text-sm text-slate-400 mb-4 leading-relaxed flex-grow">{integration.description}</p>
        
        {isConnected && (
          <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-[#0f2942]/50 rounded-lg border border-[#1a3a5c]/30">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Health Score</div>
              <div className="flex items-center gap-1.5">
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full ${integration.healthScore! > 90 ? 'bg-emerald-500' : integration.healthScore! > 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${integration.healthScore}%` }}
                  />
                </div>
                <span className="text-xs text-slate-300 font-medium">{integration.healthScore}%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Last Sync</div>
              <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                <Clock size={10} className="text-slate-400" />
                {integration.lastSync}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2">
          {isConnected ? (
            <>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-1">
                <Settings size={14} className="mr-1.5" /> Configure
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-none"
                onClick={() => onToggle(integration.id, false)}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white w-full"
              onClick={() => onToggle(integration.id, true)}
            >
              <Link2 size={14} className="mr-1.5" /> Connect Integration
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SlackConfig() {
  const [workspaceUrl, setWorkspaceUrl] = useState("russell-capital.slack.com");
  const [defaultChannel, setDefaultChannel] = useState("#advisory-alerts");
  const [events, setEvents] = useState<Record<string, boolean>>({
    "new_client": true,
    "compliance_alert": true,
    "meeting_scheduled": false,
    "report_generated": true,
    "strategy_saved": false,
    "portfolio_rebalance": true,
    "fee_collected": false,
    "document_uploaded": true
  });

  const toggleEvent = (key: string) => {
    setEvents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300">Workspace URL</Label>
            <div className="relative mt-1.5">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <Input 
                value={workspaceUrl} 
                onChange={(e) => setWorkspaceUrl(e.target.value)}
                className="pl-9 bg-[#0a1929] border-[#1a3a5c] text-slate-200" 
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Default Channel</Label>
            <div className="relative mt-1.5">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <Input 
                value={defaultChannel} 
                onChange={(e) => setDefaultChannel(e.target.value)}
                className="pl-9 bg-[#0a1929] border-[#1a3a5c] text-slate-200" 
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Bot Token</Label>
            <div className="relative mt-1.5">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <Input 
                type="password"
                value="xoxb-EXAMPLE-PLACEHOLDER" 
                readOnly
                className="pl-9 bg-[#0a1929] border-[#1a3a5c] text-slate-200 font-mono text-sm" 
              />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-white">
                <RefreshCw size={14} />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Regenerate token if compromised.</p>
          </div>
        </div>
        
        <div className="space-y-4 bg-[#0f2942]/30 p-4 rounded-xl border border-[#1a3a5c]/30">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell size={16} className="text-indigo-400" />
              Notification Events
            </h4>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10" onClick={() => {
              const allTrue = Object.keys(events).reduce((acc, key) => ({ ...acc, [key]: true }), {});
              setEvents(allTrue);
            }}>
              Enable All
            </Button>
          </div>
          
          <div className="space-y-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(events).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2.5 border-b border-[#1a3a5c]/40 last:border-0 hover:bg-[#1a3a5c]/20 px-2 rounded-md transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-slate-500">Triggered when {key.replace(/_/g, ' ')} occurs</span>
                </div>
                <Switch checked={value} onCheckedChange={() => toggleEvent(key)} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-[#1a3a5c]/40">
        <Button variant="outline" className="border-slate-600 text-slate-300">Cancel</Button>
        <Button className="bg-[#4A154B] hover:bg-[#3a103b] text-white" onClick={() => toast.success("Slack configuration saved")}>
          <Save size={16} className="mr-2" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}

function HubSpotConfig() {
  const [syncSettings, setSyncSettings] = useState<Record<string, boolean>>({
    "sync_contacts": true,
    "sync_deals": true,
    "sync_notes": false,
    "auto_tasks": true,
    "sync_emails": false,
    "sync_meetings": true
  });

  const toggleSync = (key: string) => {
    setSyncSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300">Private App Token</Label>
            <div className="relative mt-1.5">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <Input 
                type="password" 
                value="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                readOnly
                className="pl-9 bg-[#0a1929] border-[#1a3a5c] text-slate-200 font-mono text-sm" 
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Portal ID (Hub ID)</Label>
            <div className="relative mt-1.5">
              <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <Input 
                value="12345678" 
                readOnly
                className="pl-9 bg-[#0a1929] border-[#1a3a5c] text-slate-200" 
              />
            </div>
          </div>
          
          <div className="bg-[#FF7A59]/10 border border-[#FF7A59]/20 rounded-xl p-4 mt-4">
            <h5 className="text-sm font-medium text-[#FF7A59] mb-2 flex items-center gap-2">
              <Activity size={16} /> Connection Status
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 size={12}/> Connected & Syncing</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Last Sync</span>
                <span className="text-slate-300">Today, 10:42 AM</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">API Usage (24h)</span>
                <span className="text-slate-300">4,250 / 500,000</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-3 border-[#FF7A59]/30 text-[#FF7A59] hover:bg-[#FF7A59]/10">
              <RefreshCw size={14} className="mr-2" /> Force Manual Sync
            </Button>
          </div>
        </div>
        
        <div className="space-y-4 bg-[#0f2942]/30 p-4 rounded-xl border border-[#1a3a5c]/30">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Settings size={16} className="text-[#FF7A59]" />
            Sync Preferences
          </h4>
          
          <div className="space-y-1">
            {[
              { key: "sync_contacts", label: "Sync contacts to HubSpot", desc: "Push new clients as HubSpot contacts" },
              { key: "sync_deals", label: "Sync deals from HubSpot", desc: "Pull deal pipeline data into your dashboard" },
              { key: "sync_notes", label: "Sync meeting notes", desc: "Push meeting summaries to HubSpot timeline" },
              { key: "auto_tasks", label: "Auto-create tasks", desc: "Create HubSpot tasks from advisory action items" },
              { key: "sync_emails", label: "Sync email activity", desc: "Log platform emails in HubSpot CRM" },
              { key: "sync_meetings", label: "Sync calendar events", desc: "Keep meetings aligned across platforms" },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between py-3 border-b border-[#1a3a5c]/40 last:border-0 hover:bg-[#1a3a5c]/20 px-2 rounded-md transition-colors">
                <div>
                  <span className="text-sm text-slate-300 block mb-0.5">{item.label}</span>
                  <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                </div>
                <Switch checked={syncSettings[item.key]} onCheckedChange={() => toggleSync(item.key)} className="mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-[#1a3a5c]/40">
        <Button variant="outline" className="border-slate-600 text-slate-300">Cancel</Button>
        <Button className="bg-[#FF7A59] hover:bg-[#e86c4f] text-white" onClick={() => toast.success("HubSpot configuration saved")}>
          <Save size={16} className="mr-2" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}

function WebhooksConfig() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([
    { id: "wh-1", url: "https://api.internal-system.com/webhooks/russell", events: ["client.created", "strategy.saved"], active: true, secret: "whsec_abcdef123456", createdAt: "2023-10-15T08:00:00Z", lastFired: "2023-10-25T14:32:00Z", successRate: 99.8 },
    { id: "wh-2", url: "https://zapier.com/hooks/catch/123456/abcdef/", events: ["compliance.alert"], active: true, secret: "whsec_zapier789012", createdAt: "2023-10-18T09:15:00Z", lastFired: "2023-10-24T11:05:00Z", successRate: 100 },
  ]);

  const availableEvents = [
    "client.created", "client.updated", "client.deleted", 
    "strategy.saved", "strategy.executed", 
    "report.generated", "report.viewed",
    "compliance.alert", "compliance.resolved", 
    "meeting.scheduled", "meeting.completed",
    "portfolio.rebalanced", "fee.collected"
  ];

  const addEndpoint = () => {
    setEndpoints([
      ...endpoints, 
      { 
        id: `wh-${Date.now()}`, 
        url: "", 
        events: [], 
        active: true, 
        secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
        createdAt: new Date().toISOString(),
        successRate: 0
      }
    ]);
  };

  const removeEndpoint = (id: string) => {
    setEndpoints(endpoints.filter((ep) => ep.id !== id));
    toast.success("Webhook endpoint removed");
  };

  const updateEndpoint = (id: string, field: keyof WebhookEndpoint, value: any) => {
    setEndpoints(endpoints.map((ep) => ep.id === id ? { ...ep, [field]: value } : ep));
  };

  const toggleEvent = (id: string, event: string) => {
    setEndpoints(endpoints.map((ep) => {
      if (ep.id === id) {
        const newEvents = ep.events.includes(event) 
          ? ep.events.filter((e) => e !== event)
          : [...ep.events, event];
        return { ...ep, events: newEvents };
      }
      return ep;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Webhook size={18} className="text-indigo-400" />
            Configured Endpoints
          </h4>
          <p className="text-xs text-slate-400 mt-1">Manage where platform events are sent in real-time.</p>
        </div>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={addEndpoint}
        >
          <Plus size={14} className="mr-1.5" /> Add Endpoint
        </Button>
      </div>

      <div className="space-y-4">
        {endpoints.map((ep, i) => (
          <Card key={ep.id} className="border-[#1a3a5c]/60 bg-[#0a1929]/80 shadow-lg overflow-hidden">
            <div className={`h-1 w-full ${ep.active ? 'bg-indigo-500' : 'bg-slate-600'}`}></div>
            <CardContent className="p-5 space-y-5">
              <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                <div className="flex-grow space-y-4">
                  <div>
                    <Label className="text-slate-300 text-xs uppercase tracking-wider mb-1.5 block">Payload URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://your-server.com/webhook"
                        value={ep.url}
                        onChange={(e) => updateEndpoint(ep.id, "url", e.target.value)}
                        className="bg-[#0f2942] border-[#1a3a5c] text-slate-200 font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" className="border-[#1a3a5c] text-slate-400 hover:text-white shrink-0">
                        <Zap size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300 text-xs uppercase tracking-wider mb-1.5 block">Webhook Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={ep.secret}
                        readOnly
                        className="bg-[#0f2942] border-[#1a3a5c] text-slate-400 font-mono text-sm"
                      />
                      <Button variant="outline" size="sm" className="border-[#1a3a5c] text-slate-400 hover:text-white shrink-0">
                        Reveal
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Used to verify the X-Signature header.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px] bg-[#0f2942]/50 p-3 rounded-lg border border-[#1a3a5c]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${ep.active ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {ep.active ? 'Active' : 'Inactive'}
                      </span>
                      <Switch 
                        checked={ep.active} 
                        onCheckedChange={(v) => updateEndpoint(ep.id, "active", v)} 
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Success Rate</span>
                    <span className="text-xs text-slate-200 font-mono">{ep.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Last Fired</span>
                    <span className="text-xs text-slate-200">{ep.lastFired ? new Date(ep.lastFired).toLocaleDateString() : 'Never'}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-2 h-8"
                    onClick={() => removeEndpoint(ep.id)}
                  >
                    <Trash2 size={14} className="mr-2" /> Delete Endpoint
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-wider mb-2 block flex items-center justify-between">
                  <span>Subscribed Events ({ep.events.length})</span>
                  <Button variant="link" size="sm" className="h-auto p-0 text-indigo-400 text-[10px]" onClick={() => updateEndpoint(ep.id, "events", availableEvents)}>
                    Select All
                  </Button>
                </Label>
                <div className="flex flex-wrap gap-2 mt-2 bg-[#0f2942]/30 p-3 rounded-lg border border-[#1a3a5c]/30 max-h-[150px] overflow-y-auto custom-scrollbar">
                  {availableEvents.map((evt) => (
                    <Badge
                      key={evt}
                      variant="outline"
                      className={`text-[10px] py-1 px-2 cursor-pointer transition-all duration-200 ${
                        ep.events.includes(evt)
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                          : "text-slate-500 border-slate-700/50 hover:border-slate-500 bg-[#0a1929]/50"
                      }`}
                      onClick={() => toggleEvent(ep.id, evt)}
                    >
                      {ep.events.includes(evt) && <Check size={10} className="mr-1" />}
                      {evt}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {endpoints.length === 0 && (
          <div className="text-center py-12 bg-[#0f2942]/20 border border-dashed border-[#1a3a5c] rounded-xl">
            <Webhook size={32} className="text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-300 font-medium mb-1">No Webhooks Configured</h3>
            <p className="text-slate-500 text-sm mb-4">Add an endpoint to start receiving real-time platform events.</p>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={addEndpoint}>
              <Plus size={14} className="mr-1.5" /> Create First Endpoint
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <Shield size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="text-sm font-medium text-blue-300 mb-1">Security Best Practices</h5>
          <p className="text-xs text-blue-200/70 leading-relaxed mb-2">
            All webhook payloads are signed with HMAC-SHA256. Verify the <code className="bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[10px]">X-Russell-Signature</code> header to ensure authenticity. We recommend rotating your secrets every 90 days.
          </p>
          <a href="#" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Read Webhook Documentation <ExternalLink size={10} />
          </a>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-[#1a3a5c]/40">
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => toast.success("Webhook configurations saved")}>
          <Save size={16} className="mr-2" /> Save All Changes
        </Button>
      </div>
    </div>
  );
}

function DataSyncTable({ logs }: { logs: SyncLog[] }) {
  const [filter, setFilter] = useState("all");
  
  const filteredLogs = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter((log) => log.status === filter);
  }, [logs, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Recent Sync Activity</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`border-[#1a3a5c] text-xs ${filter === 'all' ? 'bg-[#1a3a5c] text-white' : 'text-slate-400'}`}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`border-[#1a3a5c] text-xs ${filter === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'text-slate-400'}`}
            onClick={() => setFilter("success")}
          >
            Success
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`border-[#1a3a5c] text-xs ${filter === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'text-slate-400'}`}
            onClick={() => setFilter("error")}
          >
            Errors
          </Button>
        </div>
      </div>
      
      <div className="bg-[#0a1929]/60 border border-[#1a3a5c]/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-[#0f2942]/80 uppercase border-b border-[#1a3a5c]/40">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Integration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Records</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3a5c]/30">
              {filteredLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-[#1a3a5c]/20 transition-colors">
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-slate-200 font-medium">{log.integrationId}</span>
                  </td>
                  <td className="px-4 py-3">
                    {log.status === "success" && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] py-0">Success</Badge>}
                    {log.status === "error" && <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] py-0">Failed</Badge>}
                    {log.status === "warning" && <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px] py-0">Warning</Badge>}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{log.recordsProcessed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{(log.durationMs / 1000).toFixed(2)}s</td>
                  <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[200px]" title={log.message}>{log.message}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                      <MoreHorizontal size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No sync logs found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-[#1a3a5c]/40 bg-[#0f2942]/30 flex justify-between items-center">
          <span className="text-xs text-slate-500">Showing {Math.min(filteredLogs.length, 10)} of {filteredLogs.length} logs</span>
          <Button variant="outline" size="sm" className="h-7 text-xs border-[#1a3a5c] text-slate-300">
            View All Logs <ChevronRight size={12} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApiUsageTable() {
  const usageData = [
    { endpoint: "/api/v1/clients", method: "GET", calls: 45200, avgLatency: 124, errorRate: 0.1 },
    { endpoint: "/api/v1/clients", method: "POST", calls: 1250, avgLatency: 342, errorRate: 1.2 },
    { endpoint: "/api/v1/strategies", method: "GET", calls: 28400, avgLatency: 215, errorRate: 0.5 },
    { endpoint: "/api/v1/webhooks/trigger", method: "POST", calls: 8900, avgLatency: 85, errorRate: 0.0 },
    { endpoint: "/api/v1/compliance/check", method: "POST", calls: 5600, avgLatency: 540, errorRate: 2.4 },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">API Endpoint Usage</h3>
      <div className="bg-[#0a1929]/60 border border-[#1a3a5c]/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-[#0f2942]/80 uppercase border-b border-[#1a3a5c]/40">
              <tr>
                <th className="px-4 py-3 font-medium">Endpoint</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">Total Calls (30d)</th>
                <th className="px-4 py-3 font-medium text-right">Avg Latency</th>
                <th className="px-4 py-3 font-medium text-right">Error Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3a5c]/30">
              {usageData.map((row, i) => (
                <tr key={i} className="hover:bg-[#1a3a5c]/20 transition-colors">
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{row.endpoint}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] py-0 ${
                      row.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                      row.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {row.method}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs text-right">{row.calls.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs text-right">{row.avgLatency}ms</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs ${row.errorRate > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {row.errorRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ApiKeysTable() {
  const keys = [
    { id: "key_1", name: "Production App Sync", prefix: "pk_live_...", created: "2023-05-12", lastUsed: "2 mins ago", status: "active" },
    { id: "key_2", name: "Zapier Integration", prefix: "pk_live_...", created: "2023-08-24", lastUsed: "1 hour ago", status: "active" },
    { id: "key_3", name: "Legacy Dashboard", prefix: "pk_live_...", created: "2022-11-05", lastUsed: "45 days ago", status: "inactive" },
    { id: "key_4", name: "Staging Testing", prefix: "pk_test_...", created: "2023-10-01", lastUsed: "5 mins ago", status: "active" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">API Keys</h3>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} className="mr-1.5" /> Generate New Key
        </Button>
      </div>
      
      <div className="bg-[#0a1929]/60 border border-[#1a3a5c]/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-[#0f2942]/80 uppercase border-b border-[#1a3a5c]/40">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Key Prefix</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last Used</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3a5c]/30">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-[#1a3a5c]/20 transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{key.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{key.prefix}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{key.created}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{key.lastUsed}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] py-0 ${
                      key.status === 'active' ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-700'
                    }`}>
                      {key.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ErrorLogsTable() {
  const errors = [
    { id: 1, time: "10:42 AM", service: "HubSpot", error: "Rate limit exceeded (429)", resolution: "Auto-retrying in 5m" },
    { id: 2, time: "09:15 AM", service: "Webhook #2", error: "Connection timeout (504)", resolution: "Failed after 3 retries" },
    { id: 3, time: "Yesterday", service: "Salesforce", error: "Invalid credentials (401)", resolution: "Requires manual auth" },
    { id: 4, time: "Yesterday", service: "Slack", error: "Channel not found", resolution: "Updated default channel" },
  ];

  return (
    <div className="bg-[#0a1929]/60 border border-[#1a3a5c]/40 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1a3a5c]/40 flex items-center justify-between bg-[#0f2942]/30">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" /> Recent Integration Errors
        </h3>
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">{errors.length} Unresolved</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 bg-[#0f2942]/50 uppercase border-b border-[#1a3a5c]/40">
            <tr>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Service</th>
              <th className="px-4 py-2 font-medium">Error Details</th>
              <th className="px-4 py-2 font-medium">Status/Resolution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a3a5c]/30">
            {errors.map((err) => (
              <tr key={err.id} className="hover:bg-[#1a3a5c]/20 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{err.time}</td>
                <td className="px-4 py-3 text-slate-200 font-medium text-xs">{err.service}</td>
                <td className="px-4 py-3 text-red-400 font-mono text-xs">{err.error}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{err.resolution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataMappingTable() {
  const mappings = [
    { platform: "HubSpot", rcField: "client.firstName", extField: "firstname", type: "String", direction: "two-way" },
    { platform: "HubSpot", rcField: "client.lastName", extField: "lastname", type: "String", direction: "two-way" },
    { platform: "HubSpot", rcField: "client.email", extField: "email", type: "String", direction: "two-way" },
    { platform: "HubSpot", rcField: "client.netWorth", extField: "custom_net_worth", type: "Number", direction: "outbound" },
    { platform: "Salesforce", rcField: "client.id", extField: "External_ID__c", type: "String", direction: "outbound" },
    { platform: "Salesforce", rcField: "strategy.status", extField: "Strategy_Stage__c", type: "Enum", direction: "outbound" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Field Mappings</h3>
        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
          <Settings size={14} className="mr-1.5" /> Manage Mappings
        </Button>
      </div>
      
      <div className="bg-[#0a1929]/60 border border-[#1a3a5c]/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-[#0f2942]/80 uppercase border-b border-[#1a3a5c]/40">
              <tr>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Russell Capital Field</th>
                <th className="px-4 py-3 font-medium text-center">Direction</th>
                <th className="px-4 py-3 font-medium">External Field</th>
                <th className="px-4 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3a5c]/30">
              {mappings.map((map, i) => (
                <tr key={i} className="hover:bg-[#1a3a5c]/20 transition-colors">
                  <td className="px-4 py-3 text-slate-200 text-xs font-medium">{map.platform}</td>
                  <td className="px-4 py-3 text-indigo-300 font-mono text-xs">{map.rcField}</td>
                  <td className="px-4 py-3 text-center">
                    {map.direction === 'two-way' ? (
                      <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-[10px] py-0"><ArrowRight size={10} className="mr-1 inline transform rotate-180"/><ArrowRight size={10} className="inline"/> Sync</Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px] py-0">Push <ArrowRight size={10} className="ml-1 inline"/></Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-orange-300 font-mono text-xs">{map.extField}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{map.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Integrations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: dashboardData } = trpc.dashboard.stats.useQuery();
  const { data: teamData } = trpc.team.members.useQuery();
  const { data: webhooksData } = trpc.webhooks.list.useQuery();
  const { data: hubspotData } = trpc.hubspot.getStatus.useQuery();
  

  const handleToggleIntegration = useCallback((id: string, state: boolean) => {
    setIntegrations(prev => prev.map((i) => i.id === id ? { ...i, connected: state } : i));
    if (state) {
      toast.success(`${integrations.find((i) => i.id === id)?.name} connected successfully`);
    } else {
      toast.info(`${integrations.find((i) => i.id === id)?.name} disconnected`);
    }
  }, [integrations]);

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            i.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || i.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [integrations, searchQuery, categoryFilter]);

  const categoryData = useMemo(() => {
    const counts = integrations.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [integrations]);

  const statusData = useMemo(() => [
    { name: "Connected", value: integrations.filter((i) => i.connected).length },
    { name: "Not Connected", value: integrations.filter((i) => !i.connected).length },
  ], [integrations]);

  const apiUsageData = useMemo(() => Array.from({ length: 14 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: Math.floor(Math.random() * 5000) + 1000,
      errors: Math.floor(Math.random() * 100),
      latency: Math.floor(Math.random() * 200) + 50
    };
  }), []);

  const dataVolumeData = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      hubspot: Math.floor(Math.random() * 1000) + 500,
      slack: Math.floor(Math.random() * 500) + 100,
      webhooks: Math.floor(Math.random() * 2000) + 1000,
    };
  }), []);

  const healthData = useMemo(() => integrations.filter((i) => i.connected).map((i) => ({
    subject: i.name,
    A: i.healthScore || 0,
    fullMark: 100,
  })), [integrations]);

  const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#ec4899"];
  const syncLogs = useMemo(() => generateSyncLogs(50), []);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Layers className="text-[#3b82f6]" size={28} />
              Integrations & APIs
            </h1>
            <p className="text-slate-400 mt-1">
              Connect external tools, manage webhooks, and monitor API usage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides
              toolName="Integrations"
              getSections={() => [
                {
                  title: "Integrations Overview",
                  items: [{ label: "Connected Apps", value: integrations.filter((i) => i.connected).length.toString() }],
                },
              ]}
            />
            <Button variant="outline" className="border-slate-600 text-slate-300 bg-[#0a1929] hover:bg-slate-800" onClick={() => toast.info("Syncing all connected integrations...")}>
              <RefreshCw size={14} className="mr-1.5" /> Sync All Now
            </Button>
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
              <Plus size={14} className="mr-1.5" /> Request Integration
            </Button>
          </div>
        </div>

        {/* Top Level Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#0a1929]/60 border-[#1a3a5c]/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <Link2 size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Connected Apps</p>
                <p className="text-2xl font-bold text-white">{integrations.filter((i) => i.connected).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a1929]/60 border-[#1a3a5c]/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">API Calls (30d)</p>
                <p className="text-2xl font-bold text-white">142.5k</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a1929]/60 border-[#1a3a5c]/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Database size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Records Synced</p>
                <p className="text-2xl font-bold text-white">845k</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a1929]/60 border-[#1a3a5c]/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Sync Errors</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-[#0a1929]/80 p-2 rounded-xl border border-[#1a3a5c]/50">
            <TabsList className="bg-transparent border-0 h-auto p-0 flex-wrap gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#1a3a5c] data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-lg transition-all">
                <Grid size={16} className="mr-2" /> App Directory
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#1a3a5c] data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-lg transition-all">
                <BarChart2 size={16} className="mr-2" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="developer" className="data-[state=active]:bg-[#1a3a5c] data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-lg transition-all">
                <Cpu size={16} className="mr-2" /> Developer Settings
              </TabsTrigger>
              <div className="w-px h-6 bg-[#1a3a5c] mx-2 hidden md:block"></div>
              <TabsTrigger value="slack" className="data-[state=active]:bg-[#4A154B] data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-lg transition-all">
                <MessageSquare size={16} className="mr-2" /> Slack
              </TabsTrigger>
              <TabsTrigger value="hubspot" className="data-[state=active]:bg-[#FF7A59] data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-lg transition-all">
                <Globe size={16} className="mr-2" /> HubSpot
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-lg transition-all">
                <Webhook size={16} className="mr-2" /> Webhooks
              </TabsTrigger>
            </TabsList>
          </div>

          {/* App Directory Tab */}
          <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0a1929]/40 p-4 rounded-xl border border-[#1a3a5c]/30">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input 
                  placeholder="Search integrations..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0f2942] border-[#1a3a5c] text-white w-full" 
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                <Button 
                  variant={categoryFilter === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setCategoryFilter("all")}
                  className={categoryFilter === "all" ? "bg-[#3b82f6]" : "border-[#1a3a5c] text-slate-300"}
                >
                  All
                </Button>
                {["crm", "communication", "finance", "analytics", "security", "developer"].map((cat) => (
                  <Button 
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className={`capitalize whitespace-nowrap ${categoryFilter === cat ? "bg-[#3b82f6]" : "border-[#1a3a5c] text-slate-300"}`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {filteredIntegrations.length === 0 ? (
              <div className="text-center py-20 bg-[#0a1929]/40 rounded-xl border border-[#1a3a5c]/30">
                <Search size={48} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No integrations found</h3>
                <p className="text-slate-400">Try adjusting your search or category filter.</p>
                <Button variant="outline" className="mt-6 border-[#1a3a5c] text-slate-300" onClick={() => {setSearchQuery(""); setCategoryFilter("all");}}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredIntegrations.map((integration) => (
                  <IntegrationCard 
                    key={integration.id} 
                    integration={integration} 
                    onToggle={handleToggleIntegration}
                  />
                ))}
                
                {/* Request Integration Card */}
                <Card className="border-dashed border-[#1a3a5c]/60 bg-transparent hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] cursor-pointer group">
                  <div className="text-center p-6">
                    <div className="w-12 h-12 rounded-full bg-[#0f2942] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Plus size={24} className="text-[#3b82f6]" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Don't see your tool?</h3>
                    <p className="text-sm text-slate-500 mb-4">Request a new integration to be added to the platform.</p>
                    <Button variant="outline" size="sm" className="border-[#3b82f6]/50 text-[#3b82f6] hover:bg-[#3b82f6]/10">
                      Submit Request
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Analytics Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-[#0a1929]/60 border-[#1a3a5c]/40 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center justify-between">
                    <span>API Usage & Latency (30 Days)</span>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-normal text-xs">Healthy</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={apiUsageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <RTooltip 
                        contentStyle={{ background: "#0b1628", border: "1px solid #1a3a5c", borderRadius: 8, color: "#fff" }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar yAxisId="left" dataKey="calls" name="API Calls" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                      <Line yAxisId="right" type="monotone" dataKey="latency" name="Avg Latency (ms)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
                      <Area yAxisId="left" type="monotone" dataKey="errors" name="Errors" fill="#ef4444" stroke="#ef4444" fillOpacity={0.3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#0a1929]/60 border-[#1a3a5c]/40">
                <CardHeader>
                  <CardTitle className="text-white text-base">Integration Categories</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.length > 0 ? categoryData : [{ name: "Empty", value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip 
                        contentStyle={{ background: "#0b1628", border: "1px solid #1a3a5c", borderRadius: 8, color: "#fff" }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0a1929]/60 border-[#1a3a5c]/40">
                <CardHeader>
                  <CardTitle className="text-white text-base">Data Volume by App (7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dataVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHubspot" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF7A59" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSlack" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4A154B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4A154B" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWebhooks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #1a3a5c", borderRadius: 8, color: "#fff" }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="hubspot" name="HubSpot" stroke="#FF7A59" fillOpacity={1} fill="url(#colorHubspot)" />
                      <Area type="monotone" dataKey="slack" name="Slack" stroke="#4A154B" fillOpacity={1} fill="url(#colorSlack)" />
                      <Area type="monotone" dataKey="webhooks" name="Webhooks" stroke="#6366f1" fillOpacity={1} fill="url(#colorWebhooks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#0a1929]/60 border-[#1a3a5c]/40">
                <CardHeader>
                  <CardTitle className="text-white text-base">Integration Health Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={healthData.length > 0 ? healthData : [{subject: "None", A: 0, fullMark: 100}]}>
                      <PolarGrid stroke="#1a3a5c" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Radar name="Health Score" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
                      <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #1a3a5c", borderRadius: 8, color: "#fff" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Sync Logs Table */}
            <DataSyncTable logs={syncLogs} />
          </TabsContent>

          {/* Developer Settings Tab */}
          <TabsContent value="developer" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ApiKeysTable />
                <DataMappingTable />
              </div>
              <div className="space-y-6">
                <ApiUsageTable />
                <ErrorLogsTable />
              </div>
            </div>
          </TabsContent>

          {/* Specific Integration Tabs */}
          <TabsContent value="slack" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-[#1a3a5c]/40 bg-[#0a1929]/60 shadow-xl">
              <CardHeader className="border-b border-[#1a3a5c]/40 bg-[#0f2942]/30 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[#4A154B]">
                    <MessageSquare size={28} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Slack Integration</CardTitle>
                    <CardDescription className="mt-1">Configure workspace connection and granular notification preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <SlackConfig />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hubspot" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-[#1a3a5c]/40 bg-[#0a1929]/60 shadow-xl">
              <CardHeader className="border-b border-[#1a3a5c]/40 bg-[#0f2942]/30 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[#FF7A59]">
                    <Globe size={28} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">HubSpot CRM Sync</CardTitle>
                    <CardDescription className="mt-1">Manage bi-directional data flow between the advisory platform and your CRM</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <HubSpotConfig />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-[#1a3a5c]/40 bg-[#0a1929]/60 shadow-xl">
              <CardHeader className="border-b border-[#1a3a5c]/40 bg-[#0f2942]/30 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-600">
                      <Webhook size={28} className="text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">Webhook Endpoints</CardTitle>
                      <CardDescription className="mt-1">Stream real-time platform events to external services and custom applications</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" className="border-[#1a3a5c] text-slate-300 hidden sm:flex">
                    <FileText size={14} className="mr-2" /> API Documentation
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <WebhooksConfig />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
