// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import React from "react";
import { 
  Webhook, Plus, X, Trash2, Play, ToggleLeft, ToggleRight, 
  Copy, AlertTriangle, CheckCircle, Search, Download, 
  Activity, Clock, Zap, Server, Code, FileJson, ShieldAlert,
  Settings, RefreshCw, BarChart2, Calendar, Filter, ArrowUpRight,
  Database, Network, History, MoreVertical, Edit3, Key, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Legend
} from "recharts";
import { format, subDays } from "date-fns";


const EVENT_LABELS: Record<string, string> = {
  "client.created": "Client Created",
  "client.updated": "Client Updated",
  "deal.stage_changed": "Deal Stage Changed",
  "deal.closed_won": "Deal Closed Won",
  "strategy.generated": "Strategy Generated",
  "note.added": "Note Added",
  "team.member_invited": "Team Member Invited",
  "team.member_joined": "Team Member Joined",
  "document.uploaded": "Document Uploaded",
  "meeting.scheduled": "Meeting Scheduled",
  "invoice.paid": "Invoice Paid",
  "*": "All Events",
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Webhooks() {
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["*"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"webhooks" | "logs" | "settings" | "analytics" | "docs" | "security">("webhooks");
  const [secretVisible, setSecretVisible] = useState(false);
  const [dateRange, setDateRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState("whsec_a1b2c3d4e5f6g7h8i9j0");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [webhookDescription, setWebhookDescription] = useState("");
  const [webhookHeaders, setWebhookHeaders] = useState([{ key: "", value: "" }]);
  const [testPayload, setTestPayload] = useState("{}");
  const [testEvent, setTestEvent] = useState("client.created");

  const webhooksQuery = trpc.webhooks.list.useQuery(undefined, { staleTime: 15_000 });
  const eventsQuery = trpc.webhooks.events.useQuery(undefined, { staleTime: 300_000 });
  const logsQuery = trpc.webhooks.logs?.useQuery({ limit: 100 }) || { data: null, refetch: () => {} };
  const statsQuery = trpc.webhooks.stats?.useQuery() || { data: null };
  const teamQuery = trpc.team.members.useQuery(undefined, { staleTime: 300_000 });
  const workspaceQuery = trpc.workspace.current.useQuery();

  const createMut = trpc.webhooks.create.useMutation({
    onSuccess: () => { 
      webhooksQuery.refetch(); 
      setShowForm(false); 
      resetForm();
      toast.success("Webhook created successfully"); 
    },
    onError: (e) => toast.error(e.message),
  });
  
  const deleteMut = trpc.webhooks.delete.useMutation({
    onSuccess: () => { 
      webhooksQuery.refetch(); 
      setShowDeleteConfirm(null);
      toast.success("Webhook deleted"); 
    },
  });
  
  const updateMut = trpc.webhooks.update.useMutation({
    onSuccess: () => { 
      webhooksQuery.refetch(); 
      setEditingId(null);
      toast.success("Webhook updated"); 
    },
  });
  
  const testMut = trpc.webhooks.test.useMutation({
    onSuccess: () => toast.success("Test webhook sent successfully!"),
    onError: (e) => toast.error(e.message),
  });

  const regenerateSecretMut = trpc.webhooks.regenerateSecret?.useMutation({
    onSuccess: (data) => {
      if (data?.secret) setSecretKey(data.secret);
      toast.success("Workspace secret regenerated");
    }
  }) || { mutate: () => { setSecretKey("whsec_new" + Math.random().toString(36).substring(7)); toast.success("Secret regenerated (mock)"); }, isPending: false };

  const webhooks = webhooksQuery.data ?? [];
  const availableEvents = eventsQuery.data ?? Object.keys(EVENT_LABELS);
  const logs = logsQuery.data ?? [];

  const resetForm = useCallback(() => {
    setUrl("");
    setLabel("");
    setWebhookDescription("");
    setSelectedEvents(["*"]);
    setWebhookHeaders([{ key: "", value: "" }]);
    setEditingId(null);
  }, []);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        handleRefresh();
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      webhooksQuery.refetch(),
      logsQuery.refetch && logsQuery.refetch()
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [webhooksQuery, logsQuery]);

  const toggleEvent = useCallback((event: string) => {
    if (event === "*") {
      setSelectedEvents(["*"]);
      return;
    }
    const without = selectedEvents.filter((e) => e !== "*" && e !== event);
    if (selectedEvents.includes(event)) {
      setSelectedEvents(without.length > 0 ? without : ["*"]);
    } else {
      setSelectedEvents([...without, event]);
    }
  }, [selectedEvents]);

  const addHeaderRow = useCallback(() => {
    setWebhookHeaders(prev => [...prev, { key: "", value: "" }]);
  }, []);

  const updateHeaderRow = useCallback((index: number, field: 'key' | 'value', val: string) => {
    setWebhookHeaders(prev => {
      const newHeaders = [...prev];
      newHeaders[index][field] = val;
      return newHeaders;
    });
  }, []);

  const removeHeaderRow = useCallback((index: number) => {
    setWebhookHeaders(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCreateOrUpdate = useCallback(() => {
    if (!url) {
      toast.error("URL is required");
      return;
    }
    
    const payload = {
      url,
      label,
      description: webhookDescription,
      events: selectedEvents,
      headers: webhookHeaders.filter((h) => h.key && h.value)
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, ...payload });
    } else {
      createMut.mutate(payload);
    }
  }, [url, label, webhookDescription, selectedEvents, webhookHeaders, editingId, createMut, updateMut]);

  const handleEdit = useCallback((webhook: any) => {
    setEditingId(webhook.id);
    setUrl(webhook.url);
    setLabel(webhook.label || "");
    setWebhookDescription(webhook.description || "");
    setSelectedEvents(webhook.events || ["*"]);
    setWebhookHeaders(webhook.headers?.length ? webhook.headers : [{ key: "", value: "" }]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleWebhookStatus = useCallback((id: string, currentStatus: boolean) => {
    updateMut.mutate({ id, active: !currentStatus });
  }, [updateMut]);

  const copyToClipboard = useCallback((text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${description} copied to clipboard`);
  }, []);

  const filteredWebhooks = useMemo(() => {
    let result = webhooks;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((hook) => 
        (hook.label && hook.label.toLowerCase().includes(lowerQuery)) ||
        (hook.url && hook.url.toLowerCase().includes(lowerQuery)) ||
        (hook.description && hook.description.toLowerCase().includes(lowerQuery))
      );
    }
    
    if (statusFilter !== "all") {
      if (statusFilter === "active") result = result.filter((h) => h.active);
      if (statusFilter === "inactive") result = result.filter((h) => !h.active);
      if (statusFilter === "failing") result = result.filter((h) => h.failCount > 0);
    }
    
    return result;
  }, [webhooks, searchQuery, statusFilter]);

  const generateMockLogs = useCallback(() => {
    const statuses = [200, 201, 400, 401, 403, 404, 500, 502, 503];
    const mockLogs = [];
    for (let i = 0; i < 50; i++) {
      const isSuccess = Math.random() > 0.15;
      const status = isSuccess ? (Math.random() > 0.5 ? 200 : 201) : statuses[Math.floor(Math.random() * statuses.length)];
      mockLogs.push({
        id: `log_${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhooks[Math.floor(Math.random() * webhooks.length)]?.id || "unknown",
        event: Object.keys(EVENT_LABELS)[Math.floor(Math.random() * (Object.keys(EVENT_LABELS).length - 1))],
        status,
        duration: Math.floor(Math.random() * 1500) + 50,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        requestPayload: JSON.stringify({ data: "mock request data" }),
        responsePayload: isSuccess ? JSON.stringify({ success: true }) : JSON.stringify({ error: "Something went wrong" }),
        attempts: isSuccess ? 1 : Math.floor(Math.random() * 5) + 1
      });
    }
    return mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [webhooks]);

  const mockLogsData = useMemo(() => generateMockLogs(), [generateMockLogs]);
  
  const filteredLogs = useMemo(() => {
    let result = logs.length > 0 ? logs : mockLogsData;
    
    if (logSearchQuery) {
      const lowerQuery = logSearchQuery.toLowerCase();
      result = result.filter((log) => 
        log.event.toLowerCase().includes(lowerQuery) ||
        log.id.toLowerCase().includes(lowerQuery) ||
        log.status.toString().includes(lowerQuery)
      );
    }
    
    if (selectedWebhookId) {
      result = result.filter((log) => log.webhookId === selectedWebhookId);
    }
    
    return result;
  }, [logs, mockLogsData, logSearchQuery, selectedWebhookId]);

  const generateActivityData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        name: format(date, 'MMM dd'),
        success: Math.floor(Math.random() * 500) + 100,
        errors: Math.floor(Math.random() * 50),
        latency: Math.floor(Math.random() * 300) + 100,
      });
    }
    return data;
  };

  const activityData = useMemo(() => generateActivityData(), []);

  const eventDistributionData = useMemo(() => {
    return Object.keys(EVENT_LABELS)
      .filter((k) => k !== '*')
      .slice(0, 6)
      .map((key) => ({
        name: EVENT_LABELS[key],
        value: Math.floor(Math.random() * 1000) + 100
      }));
  }, []);

  const endpointPerformanceData = useMemo(() => {
    return webhooks.slice(0, 5).map((w) => ({
      name: w.label || w.url.substring(0, 20) + '...',
      successRate: Math.floor(Math.random() * 20) + 80,
      avgLatency: Math.floor(Math.random() * 500) + 50,
      totalCalls: Math.floor(Math.random() * 5000) + 500,
    }));
  }, [webhooks]);

  const hourlyTrafficData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        hour: `${i}:00`,
        traffic: Math.floor(Math.random() * 1000) + (i > 8 && i < 18 ? 2000 : 200),
      });
    }
    return data;
  }, []);

  const activeWebhooksCount = webhooks.filter((w) => w.active).length;
  const failedWebhooksCount = webhooks.filter((w) => w.failCount > 0).length;
  const totalCalls = activityData.reduce((acc, curr) => acc + curr.success + curr.errors, 0);
  const successRate = totalCalls > 0 ? ((activityData.reduce((acc, curr) => acc + curr.success, 0) / totalCalls) * 100).toFixed(2) : 100;

  const exportToCsv = useCallback(() => {
    const headers = ["ID", "Label", "URL", "Status", "Fail Count", "Events", "Created At"];
    const csvContent = [
      headers.join(","),
      ...filteredWebhooks.map((w) => 
        [
          w.id, 
          `"${w.label || ''}"`, 
          `"${w.url}"`, 
          w.active ? "Active" : "Inactive", 
          w.failCount, 
          `"${(w.events as string[])?.join('; ') || ''}"`,
          `"${w.createdAt || new Date().toISOString()}"`
        ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `webhooks_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV");
  }, [filteredWebhooks]);

  const exportLogsToCsv = useCallback(() => {
    const headers = ["ID", "Event", "Status", "Duration (ms)", "Timestamp", "Attempts"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((l) => 
        [
          l.id, 
          l.event, 
          l.status, 
          l.duration, 
          `"${l.timestamp}"`,
          l.attempts
        ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `webhook_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Logs exported to CSV");
  }, [filteredLogs]);

  const handleTestWebhook = useCallback(() => {
    if (!testEvent) {
      toast.error("Please select an event to test");
      return;
    }
    
    try {
      JSON.parse(testPayload);
      testMut.mutate({ event: testEvent, payload: testPayload });
    } catch (e) {
      toast.error("Invalid JSON payload");
    }
  }, [testEvent, testPayload, testMut]);

  const renderWebhooksTable = () => (
    <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1a3050] bg-[#0f1e35]">
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Endpoint</th>
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Events</th>
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Stats</th>
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a3050]">
            {filteredWebhooks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#7a95b8]">
                  <div className="flex flex-col items-center justify-center">
                    <Webhook size={32} className="mb-3 opacity-20" />
                    <p>No webhooks found matching your criteria.</p>
                    <button 
                      onClick={() => { resetForm(); setShowForm(true); }}
                      className="mt-4 text-[#3b82f6] hover:text-[#60a5fa] text-sm font-medium"
                    >
                      Create your first webhook
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredWebhooks.map((webhook) => (
                <tr key={webhook.id} className="hover:bg-[#0f1e35]/50 transition-colors group">
                  <td className="p-4 align-top">
                    <button 
                      onClick={() => toggleWebhookStatus(webhook.id, webhook.active)}
                      className="flex items-center gap-2 focus:outline-none"
                    >
                      {webhook.active ? (
                        <ToggleRight size={24} className="text-[#22c55e]" />
                      ) : (
                        <ToggleLeft size={24} className="text-[#7a95b8]" />
                      )}
                      <span className={`text-xs font-medium ${webhook.active ? 'text-[#22c55e]' : 'text-[#7a95b8]'}`}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                    {webhook.failCount > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded w-fit">
                        <AlertTriangle size={12} />
                        <span>{webhook.failCount} fails</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{webhook.label || 'Unnamed Webhook'}</span>
                      <div className="flex items-center gap-2 mt-1 group-hover:opacity-100 opacity-80 transition-opacity">
                        <span className="text-xs text-[#7a95b8] font-mono truncate max-w-[200px] lg:max-w-[300px]">
                          {webhook.url}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(webhook.url, "URL")}
                          className="text-[#7a95b8] hover:text-white"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      {webhook.description && (
                        <span className="text-xs text-[#7a95b8] mt-2 line-clamp-1">{webhook.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                      {(webhook.events as string[])?.map((e) => (
                        <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a3050] text-[#c8d8ec] border border-[#2a4060]">
                          {e === '*' ? 'All Events' : e}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between w-24">
                        <span className="text-[#7a95b8]">Success:</span>
                        <span className="text-[#22c55e]">99.9%</span>
                      </div>
                      <div className="flex justify-between w-24">
                        <span className="text-[#7a95b8]">Avg Latency:</span>
                        <span className="text-white">124ms</span>
                      </div>
                      <div className="flex justify-between w-24">
                        <span className="text-[#7a95b8]">Last Fired:</span>
                        <span className="text-white">2m ago</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setActiveTab('logs'); setSelectedWebhookId(webhook.id); }}
                        className="p-1.5 text-[#7a95b8] hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded transition-colors tooltip-trigger"
                        title="View Logs"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(webhook)}
                        className="p-1.5 text-[#7a95b8] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded transition-colors tooltip-trigger"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(webhook.id)}
                        className="p-1.5 text-[#7a95b8] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors tooltip-trigger"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLogsTable = () => (
    <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1a3050] bg-[#0f1e35]">
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Date / Time</th>
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Event</th>
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Duration</th>
              <th className="p-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a3050]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#7a95b8]">
                  No logs found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.slice(0, 50).map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-[#0f1e35]/50 transition-colors cursor-pointer" onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}>
                    <td className="p-4">
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        log.status >= 200 && log.status < 300 ? 'bg-emerald-500/10 text-emerald-400' : 
                        log.status >= 400 && log.status < 500 ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {log.status >= 200 && log.status < 300 ? <CheckCircle size={12} className="mr-1" /> : <AlertTriangle size={12} className="mr-1" />}
                        {log.status}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#c8d8ec]">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono bg-[#1a3050] px-2 py-1 rounded text-[#a78bfa]">
                        {log.event}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[#7a95b8]">
                      {log.duration}ms
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-[#3b82f6] hover:text-[#60a5fa] text-xs font-medium flex items-center justify-end w-full">
                        {expandedLogId === log.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedLogId === log.id && (
                    <tr className="bg-[#081221]">
                      <td colSpan={5} className="p-0 border-b border-[#1a3050]">
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold text-[#7a95b8] uppercase">Request Payload</h4>
                              <button onClick={() => copyToClipboard(log.requestPayload, "Request Payload")} className="text-[#7a95b8] hover:text-white">
                                <Copy size={12} />
                              </button>
                            </div>
                            <div className="bg-[#0f1e35] p-4 rounded-lg border border-[#1a3050] overflow-x-auto">
                              <pre className="text-xs text-[#c8d8ec] font-mono whitespace-pre-wrap">
                                {typeof log.requestPayload === 'string' ? 
                                  (log.requestPayload.startsWith('{') ? JSON.stringify(JSON.parse(log.requestPayload), null, 2) : log.requestPayload) : 
                                  JSON.stringify(log.requestPayload, null, 2)}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold text-[#7a95b8] uppercase">Response Body</h4>
                              <button onClick={() => copyToClipboard(log.responsePayload, "Response Body")} className="text-[#7a95b8] hover:text-white">
                                <Copy size={12} />
                              </button>
                            </div>
                            <div className="bg-[#0f1e35] p-4 rounded-lg border border-[#1a3050] overflow-x-auto">
                              <pre className="text-xs text-[#c8d8ec] font-mono whitespace-pre-wrap">
                                {typeof log.responsePayload === 'string' ? 
                                  (log.responsePayload.startsWith('{') ? JSON.stringify(JSON.parse(log.responsePayload), null, 2) : log.responsePayload) : 
                                  JSON.stringify(log.responsePayload, null, 2)}
                              </pre>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              <div className="bg-[#0f1e35] p-3 rounded-lg border border-[#1a3050]">
                                <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-1">Attempts</div>
                                <div className="text-sm text-white font-medium">{log.attempts}</div>
                              </div>
                              <div className="bg-[#0f1e35] p-3 rounded-lg border border-[#1a3050]">
                                <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-1">Webhook ID</div>
                                <div className="text-sm text-white font-mono truncate">{log.webhookId}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEventsTable = () => (
    <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-[#1a3050] bg-[#0f1e35]">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Zap size={16} className="text-[#f59e0b]" /> Supported Event Types
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1a3050] bg-[#0f1e35]/50">
              <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Event Name</th>
              <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Description</th>
              <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Payload Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a3050]">
            {Object.entries(EVENT_LABELS).filter(([k]) => k !== '*').map(([key, label]) => (
              <tr key={key} className="hover:bg-[#0f1e35]/50 transition-colors">
                <td className="p-3 align-top">
                  <span className="text-xs font-mono bg-[#1a3050] px-2 py-1 rounded text-[#a78bfa]">
                    {key}
                  </span>
                </td>
                <td className="p-3 align-top text-sm text-[#c8d8ec]">
                  Triggered when a {label.toLowerCase()} in the system.
                </td>
                <td className="p-3 align-top">
                  <button className="text-xs text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1">
                    <Eye size={12} /> View Schema
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderHeadersTable = () => (
    <div className="mt-4">
      <label className="rc-label block mb-2">Custom Headers (Optional)</label>
      <div className="bg-[#0f1e35] border border-[#1a3050] rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1a3050] bg-[#0a1628]">
              <th className="p-2 text-xs font-semibold text-[#7a95b8] w-[40%]">Key</th>
              <th className="p-2 text-xs font-semibold text-[#7a95b8] w-[50%]">Value</th>
              <th className="p-2 text-xs font-semibold text-[#7a95b8] w-[10%] text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a3050]">
            {webhookHeaders.map((header, idx) => (
              <tr key={idx}>
                <td className="p-2">
                  <input 
                    className="w-full bg-[#1a3050] border border-[#2a4060] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#3b82f6]" 
                    placeholder="e.g. Authorization" 
                    value={header.key} 
                    onChange={(e) => updateHeaderRow(idx, 'key', e.target.value)} 
                  />
                </td>
                <td className="p-2">
                  <input 
                    className="w-full bg-[#1a3050] border border-[#2a4060] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#3b82f6]" 
                    placeholder="e.g. Bearer token..." 
                    value={header.value} 
                    onChange={(e) => updateHeaderRow(idx, 'value', e.target.value)} 
                    type={header.key.toLowerCase().includes('auth') || header.key.toLowerCase().includes('token') ? 'password' : 'text'}
                  />
                </td>
                <td className="p-2 text-center">
                  <button 
                    onClick={() => removeHeaderRow(idx)}
                    className="text-[#7a95b8] hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-colors"
                    disabled={webhookHeaders.length === 1 && !header.key && !header.value}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-2 border-t border-[#1a3050] bg-[#0a1628]">
          <button 
            onClick={addHeaderRow}
            className="text-xs text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1 font-medium"
          >
            <Plus size={12} /> Add Header
          </button>
        </div>
      </div>
    </div>
  );

  const renderErrorTypesTable = () => {
    const errorTypes = [
      { code: "400 Bad Request", count: 145, description: "Invalid payload format or missing required fields" },
      { code: "401 Unauthorized", count: 89, description: "Authentication failed or token expired" },
      { code: "403 Forbidden", count: 34, description: "Insufficient permissions to access endpoint" },
      { code: "404 Not Found", count: 212, description: "Endpoint URL is incorrect or no longer exists" },
      { code: "500 Internal Error", count: 76, description: "Server error on the receiving end" },
      { code: "503 Service Unavail", count: 45, description: "Receiving server is temporarily down or overloaded" },
      { code: "Timeout", count: 320, description: "Endpoint took longer than 10 seconds to respond" }
    ];

    return (
      <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#1a3050] bg-[#0f1e35] flex justify-between items-center">
          <h3 className="text-white font-medium flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" /> Common Error Types (30d)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1a3050] bg-[#0f1e35]/50">
                <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Error Type</th>
                <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Occurrences</th>
                <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3050]">
              {errorTypes.map((err, i) => (
                <tr key={i} className="hover:bg-[#0f1e35]/50 transition-colors">
                  <td className="p-3">
                    <span className="text-xs font-mono bg-red-500/10 px-2 py-1 rounded text-red-400">
                      {err.code}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{err.count}</span>
                      <div className="w-24 h-1.5 bg-[#1a3050] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-400 rounded-full" 
                          style={{ width: `${(err.count / 320) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-[#c8d8ec]">
                    {err.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderApiLimitsTable = () => {
    const limits = [
      { feature: "Max Webhooks per Workspace", limit: "50", current: webhooks.length, reset: "N/A" },
      { feature: "Max Events per Webhook", limit: "All", current: "Varies", reset: "N/A" },
      { feature: "Requests per Second (RPS)", limit: "100", current: "~12", reset: "Every second" },
      { feature: "Payload Size Limit", limit: "5 MB", current: "< 100 KB avg", reset: "Per request" },
      { feature: "Timeout Duration", limit: "10 seconds", current: "124ms avg", reset: "Per request" },
      { feature: "Log Retention", limit: "30 days", current: "30 days", reset: "Rolling" },
      { feature: "Retry Attempts", limit: "5 max", current: "Exponential", reset: "24 hours" }
    ];

    return (
      <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#1a3050] bg-[#0f1e35]">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Server size={16} className="text-[#3b82f6]" /> System Limits & Quotas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1a3050] bg-[#0f1e35]/50">
                <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Feature</th>
                <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Limit</th>
                <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Current Usage</th>
                <th className="p-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Reset Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a3050]">
              {limits.map((limit, i) => (
                <tr key={i} className="hover:bg-[#0f1e35]/50 transition-colors">
                  <td className="p-3 text-sm text-white font-medium">{limit.feature}</td>
                  <td className="p-3 text-sm text-[#c8d8ec]">{limit.limit}</td>
                  <td className="p-3">
                    <span className={`text-sm ${
                      typeof limit.current === 'number' && parseInt(limit.limit) > 0 && limit.current / parseInt(limit.limit) > 0.8 
                        ? 'text-red-400 font-medium' 
                        : 'text-[#22c55e]'
                    }`}>
                      {limit.current}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-[#7a95b8]">{limit.reset}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="rc-page-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#0f1e35] border border-[#1a3050] flex items-center justify-center text-[#22c55e]">
              <Webhook size={24} />
            </div>
            <div>
              <h1 className="rc-page-title">Webhook Integrations</h1>
              <p className="rc-page-subtitle">Connect external tools (Slack, Zapier, n8n) to receive real-time event notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh} 
              className={`p-2 text-[#7a95b8] hover:text-white bg-[#0a1628] border border-[#1a3050] rounded-lg transition-all ${isRefreshing ? 'animate-spin text-[#3b82f6]' : ''}`}
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
            <ExportToSlides
              toolName="Webhook Integrations"
              getSections={() => [
                {
                  title: "Webhook Integrations Summary",
                  items: [
                    { label: "Total Webhooks", value: String(webhooks.length) },
                    { label: "Active Webhooks", value: String(activeWebhooksCount) },
                    { label: "Available Events", value: String(availableEvents.length) },
                    { label: "Total Calls (7d)", value: String(totalCalls) },
                    { label: "Success Rate", value: `${successRate}%` }
                  ]
                }
              ]}
            />
            <button 
              onClick={() => { resetForm(); setShowForm(!showForm); }} 
              className="rc-btn rc-btn-primary text-sm shadow-lg shadow-emerald-900/20"
            >
              <Plus size={16} className="mr-1" /> Add Webhook
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rc-card flex items-center gap-4 hover:border-[#1a3050] transition-colors group">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Server size={24} />
            </div>
            <div>
              <div className="text-3xl font-bold text-white tracking-tight">{webhooks.length}</div>
              <div className="text-sm text-[#7a95b8] font-medium">Total Endpoints</div>
            </div>
          </div>
          <div className="rc-card flex items-center gap-4 hover:border-[#1a3050] transition-colors group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity size={24} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-white tracking-tight">{activeWebhooksCount}</div>
                <div className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Active</div>
              </div>
              <div className="text-sm text-[#7a95b8] font-medium">Connections Status</div>
            </div>
          </div>
          <div className="rc-card flex items-center gap-4 hover:border-[#1a3050] transition-colors group">
            <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-white tracking-tight">{failedWebhooksCount}</div>
                {failedWebhooksCount > 0 && (
                  <div className="text-xs font-medium text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Action Req.</div>
                )}
              </div>
              <div className="text-sm text-[#7a95b8] font-medium">Failing Endpoints</div>
            </div>
          </div>
          <div className="rc-card flex items-center gap-4 hover:border-[#1a3050] transition-colors group">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-white tracking-tight">{(totalCalls / 1000).toFixed(1)}k</div>
                <div className="text-xs font-medium text-emerald-400 flex items-center"><ArrowUpRight size={12} /> 12%</div>
              </div>
              <div className="text-sm text-[#7a95b8] font-medium">Events (7d)</div>
            </div>
          </div>
        </div>

        {/* Create/Edit form */}
        {showForm && (
          <div className="rc-card border-[#22c55e]/30 shadow-lg shadow-emerald-900/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-[#12233e] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{editingId ? 'Edit Webhook Endpoint' : 'New Webhook Endpoint'}</h3>
                  <p className="text-xs text-[#7a95b8]">Configure where and how we send event data</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="rc-btn rc-btn-ghost p-2 hover:bg-[#12233e] rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="rc-label flex items-center gap-1 text-sm">Endpoint URL <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7a95b8]">
                        <Code size={16} />
                      </div>
                      <input 
                        className="rc-input text-sm pl-9 w-full bg-[#0f1e35] border-[#1a3050] focus:border-[#3b82f6]" 
                        type="url" 
                        placeholder="https://hooks.slack.example/services/..." 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)} 
                      />
                    </div>
                    <p className="text-[10px] text-[#7a95b8]">Must be a valid HTTPS URL that accepts POST requests.</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="rc-label text-sm">Label (optional)</label>
                    <input 
                      className="rc-input text-sm w-full bg-[#0f1e35] border-[#1a3050] focus:border-[#3b82f6]" 
                      placeholder="e.g. Slack #deals channel" 
                      value={label} 
                      onChange={(e) => setLabel(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="rc-label text-sm">Description (optional)</label>
                    <textarea 
                      className="rc-input text-sm w-full bg-[#0f1e35] border-[#1a3050] focus:border-[#3b82f6] min-h-[80px] resize-y" 
                      placeholder="What is this webhook used for?" 
                      value={webhookDescription} 
                      onChange={(e) => setWebhookDescription(e.target.value)} 
                    />
                  </div>

                  {renderHeadersTable()}
                </div>
                
                <div className="space-y-3 bg-[#0a1628] p-5 rounded-xl border border-[#1a3050]">
                  <div className="flex items-center justify-between">
                    <label className="rc-label block text-sm">Events to subscribe</label>
                    <button 
                      onClick={() => setSelectedEvents(["*"])}
                      className="text-xs text-[#3b82f6] hover:text-[#60a5fa] font-medium"
                    >
                      Select All
                    </button>
                  </div>
                  <p className="text-xs text-[#7a95b8] mb-3">Select which events will trigger this webhook.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedEvents.includes("*") ? 'bg-[#3b82f6]/10 border-[#3b82f6] text-white' : 'bg-[#0f1e35] border-[#1a3050] text-[#7a95b8] hover:border-[#2a4060]'}`}>
                      <input 
                        type="checkbox" 
                        className="rounded border-[#3b82f6] text-[#3b82f6] focus:ring-[#3b82f6] bg-[#0a1628]"
                        checked={selectedEvents.includes("*")}
                        onChange={() => toggleEvent("*")}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">All Events</span>
                        <span className="text-[10px] opacity-70">Receive everything</span>
                      </div>
                    </label>
                    
                    {availableEvents.filter((e) => e !== "*").map((event) => (
                      <label key={event} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedEvents.includes(event) && !selectedEvents.includes("*") ? 'bg-[#3b82f6]/10 border-[#3b82f6] text-white' : 'bg-[#0f1e35] border-[#1a3050] text-[#7a95b8] hover:border-[#2a4060]'}`}>
                        <input 
                          type="checkbox" 
                          className="rounded border-[#3b82f6] text-[#3b82f6] focus:ring-[#3b82f6] bg-[#0a1628]"
                          checked={selectedEvents.includes(event) || selectedEvents.includes("*")}
                          disabled={selectedEvents.includes("*")}
                          onChange={() => toggleEvent(event)}
                        />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate">{EVENT_LABELS[event] || event}</span>
                          <span className="text-[10px] opacity-70 font-mono truncate">{event}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1a3050]">
                <button 
                  onClick={() => setShowForm(false)} 
                  className="rc-btn rc-btn-ghost text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateOrUpdate}
                  className="rc-btn rc-btn-primary text-sm shadow-lg shadow-emerald-900/20"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {(createMut.isPending || updateMut.isPending) ? (
                    <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Saving...</span>
                  ) : (
                    <span className="flex items-center gap-2"><CheckCircle size={14} /> {editingId ? 'Save Changes' : 'Create Webhook'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 text-red-400 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Webhook?</h3>
                  <p className="text-sm text-[#7a95b8]">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-[#c8d8ec] mb-6">
                Are you sure you want to delete this webhook? Any integrations relying on this endpoint will immediately stop receiving data.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="rc-btn rc-btn-ghost text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteMut.mutate({ id: showDeleteConfirm })}
                  className="rc-btn bg-red-500 hover:bg-red-600 text-white border-none text-sm shadow-lg shadow-red-900/20"
                  disabled={deleteMut.isPending}
                >
                  {deleteMut.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <div className="rc-card p-0 overflow-hidden border-[#1a3050]">
          <div className="flex items-center overflow-x-auto border-b border-[#1a3050] bg-[#0a1628] p-1 gap-1 custom-scrollbar">
            {[
              { id: 'webhooks', icon: Network, label: 'Endpoints' },
              { id: 'logs', icon: History, label: 'Delivery Logs' },
              { id: 'analytics', icon: BarChart2, label: 'Analytics' },
              { id: 'security', icon: ShieldAlert, label: 'Security' },
              { id: 'docs', icon: FileJson, label: 'Documentation' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg border-b-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-white border-[#3b82f6] bg-[#0f1e35]' 
                    : 'text-[#7a95b8] border-transparent hover:text-white hover:bg-[#0f1e35]/50'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-[#3b82f6]' : ''} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 bg-[#060d18]">
            {/* Tab: Webhooks */}
            {activeTab === "webhooks" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search webhooks..." 
                      className="rc-input pl-10 w-full text-sm bg-[#0a1628] border-[#1a3050]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-[#0a1628] border border-[#1a3050] rounded-lg p-1">
                      <Filter size={14} className="text-[#7a95b8] ml-2" />
                      <select 
                        className="bg-transparent text-sm text-white border-none focus:ring-0 py-1.5 pr-8 pl-2 cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all" className="bg-[#0f1e35]">All Status</option>
                        <option value="active" className="bg-[#0f1e35]">Active Only</option>
                        <option value="inactive" className="bg-[#0f1e35]">Inactive Only</option>
                        <option value="failing" className="bg-[#0f1e35]">Failing</option>
                      </select>
                    </div>
                    <button 
                      onClick={exportToCsv}
                      className="rc-btn rc-btn-ghost text-sm flex items-center gap-2"
                      disabled={filteredWebhooks.length === 0}
                    >
                      <Download size={16} /> <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>

                {renderWebhooksTable()}
              </div>
            )}

            {/* Tab: Logs */}
            {activeTab === "logs" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search by ID, event, or status..." 
                      className="rc-input pl-10 w-full text-sm bg-[#0a1628] border-[#1a3050]"
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
                    <div className="flex items-center gap-2 bg-[#0a1628] border border-[#1a3050] rounded-lg p-1 shrink-0">
                      <Network size={14} className="text-[#7a95b8] ml-2" />
                      <select 
                        className="bg-transparent text-sm text-white border-none focus:ring-0 py-1.5 pr-8 pl-2 cursor-pointer max-w-[150px] truncate"
                        value={selectedWebhookId || ""}
                        onChange={(e) => setSelectedWebhookId(e.target.value || null)}
                      >
                        <option value="" className="bg-[#0f1e35]">All Endpoints</option>
                        {webhooks.map((w) => (
                          <option key={w.id} value={w.id} className="bg-[#0f1e35]">{w.label || w.url}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={exportLogsToCsv}
                      className="rc-btn rc-btn-ghost text-sm flex items-center gap-2 shrink-0"
                    >
                      <Download size={16} /> <span className="hidden sm:inline">Export Logs</span>
                    </button>
                  </div>
                </div>

                {/* Chart 1: Logs Timeline (AreaChart) */}
                <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-5 shadow-lg">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-[#3b82f6]" /> Delivery Volume & Latency
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" vertical={false} />
                        <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#1a3050', borderRadius: '8px', color: '#fff' }}
                          cursor={{ stroke: '#1a3050', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="success" name="Successful Deliveries" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" />
                        <Bar yAxisId="left" dataKey="errors" name="Failed Deliveries" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Line yAxisId="right" type="monotone" dataKey="latency" name="Avg Latency (ms)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {renderLogsTable()}
              </div>
            )}

            {/* Tab: Analytics */}
            {activeTab === "analytics" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-end mb-4">
                  <div className="flex items-center gap-2 bg-[#0a1628] border border-[#1a3050] rounded-lg p-1">
                    <Calendar size={14} className="text-[#7a95b8] ml-2" />
                    <select 
                      className="bg-transparent text-sm text-white border-none focus:ring-0 py-1.5 pr-8 pl-2 cursor-pointer"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                    >
                      <option value="24h" className="bg-[#0f1e35]">Last 24 Hours</option>
                      <option value="7d" className="bg-[#0f1e35]">Last 7 Days</option>
                      <option value="30d" className="bg-[#0f1e35]">Last 30 Days</option>
                      <option value="90d" className="bg-[#0f1e35]">Last 90 Days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 2: Event Distribution (PieChart) */}
                  <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-5 shadow-lg">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <PieChart className="text-[#a78bfa]" size={16} /> Event Distribution
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={eventDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {eventDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#1a3050', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3: Endpoint Performance (BarChart) */}
                  <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-5 shadow-lg">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <BarChart2 className="text-[#3b82f6]" size={16} /> Endpoint Success Rates
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={endpointPerformanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} stroke="#7a95b8" fontSize={12} tickFormatter={(val) => `${val}%`} />
                          <YAxis dataKey="name" type="category" stroke="#7a95b8" fontSize={12} width={100} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#1a3050', borderRadius: '8px', color: '#fff' }}
                            cursor={{ fill: '#1a3050', opacity: 0.4 }}
                          />
                          <Bar dataKey="successRate" name="Success Rate %" radius={[0, 4, 4, 0]} barSize={20}>
                            {endpointPerformanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.successRate > 95 ? '#10b981' : entry.successRate > 80 ? '#f59e0b' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 4: Hourly Traffic (LineChart) */}
                  <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-5 shadow-lg lg:col-span-2">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Clock className="text-[#ec4899]" size={16} /> 24-Hour Traffic Pattern
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a3050" vertical={false} />
                          <XAxis dataKey="hour" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#1a3050', borderRadius: '8px', color: '#fff' }}
                            cursor={{ stroke: '#1a3050', strokeWidth: 1, strokeDasharray: '3 3' }}
                          />
                          <Line type="monotone" dataKey="traffic" name="Events" stroke="#ec4899" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#ec4899', strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Chart 5: System Health (RadarChart) */}
                  <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-5 shadow-lg lg:col-span-2 flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-1/2">
                      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                        <Activity className="text-[#06b6d4]" size={16} /> System Health Metrics
                      </h3>
                      <p className="text-sm text-[#7a95b8] mb-4">Comprehensive view of your webhook infrastructure performance across key dimensions.</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-[#0f1e35] p-3 rounded-lg border border-[#1a3050]">
                          <span className="text-sm text-[#c8d8ec]">Reliability Score</span>
                          <span className="text-lg font-bold text-[#10b981]">98.5/100</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#0f1e35] p-3 rounded-lg border border-[#1a3050]">
                          <span className="text-sm text-[#c8d8ec]">Avg Response Time</span>
                          <span className="text-lg font-bold text-white">124ms</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#0f1e35] p-3 rounded-lg border border-[#1a3050]">
                          <span className="text-sm text-[#c8d8ec]">Delivery Success</span>
                          <span className="text-lg font-bold text-[#10b981]">99.9%</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                          { subject: 'Reliability', A: 98, fullMark: 100 },
                          { subject: 'Speed', A: 85, fullMark: 100 },
                          { subject: 'Security', A: 100, fullMark: 100 },
                          { subject: 'Uptime', A: 99, fullMark: 100 },
                          { subject: 'Throughput', A: 75, fullMark: 100 },
                        ]}>
                          <PolarGrid stroke="#1a3050" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="System Health" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#1a3050', borderRadius: '8px', color: '#fff' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Security */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-6 shadow-lg">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Key size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Workspace Webhook Secret</h3>
                      <p className="text-sm text-[#7a95b8] mt-1 max-w-2xl">
                        This secret is used to sign all webhook payloads sent to your endpoints. 
                        You should use it to verify that incoming requests are genuinely from Russell Capital Systems.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0f1e35] border border-[#1a3050] rounded-lg p-4 mb-6">
                    <label className="text-xs text-[#7a95b8] uppercase tracking-wider font-semibold block mb-2">Signing Secret</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input 
                          type={secretVisible ? "text" : "password"} 
                          value={secretKey}
                          readOnly
                          className="w-full bg-[#060d18] border border-[#1a3050] rounded-lg py-2.5 px-4 text-white font-mono text-sm focus:outline-none"
                        />
                        <button 
                          onClick={() => setSecretVisible(!secretVisible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white"
                        >
                          {secretVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(secretKey, "Webhook secret")}
                        className="rc-btn rc-btn-primary whitespace-nowrap"
                      >
                        <Copy size={16} className="mr-2" /> Copy Secret
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium text-sm">Rotate Secret</h4>
                      <p className="text-xs text-[#7a95b8] mt-1">
                        If you suspect your secret has been compromised, you should rotate it immediately.
                      </p>
                    </div>
                    <button 
                      onClick={() => regenerateSecretMut.mutate()}
                      className="rc-btn bg-[#0f1e35] hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm whitespace-nowrap"
                      disabled={regenerateSecretMut.isPending}
                    >
                      {regenerateSecretMut.isPending ? 'Rotating...' : 'Rotate Secret'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-6 shadow-lg">
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Code size={16} className="text-[#3b82f6]" /> Verification Example (Node.js)
                    </h4>
                    <div className="bg-[#0f1e35] p-4 rounded-lg border border-[#1a3050] overflow-x-auto">
                      <pre className="text-xs text-[#c8d8ec] font-mono leading-relaxed">{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signatureHeader, secret) {
  const elements = signatureHeader.split(',');
  const timestamp = elements.find((e) => e.startsWith('t=')).split('=')[1];
  const signature = elements.find((e) => e.startsWith('v1=')).split('=')[1];

  const signedPayload = timestamp + '.' + payload;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}`}</pre>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-6 shadow-lg">
                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                      <ShieldAlert size={16} className="text-[#f59e0b]" /> Security Best Practices
                    </h4>
                    <ul className="space-y-4 text-sm text-[#c8d8ec]">
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 bg-emerald-500/10 text-emerald-400 p-1 rounded-full shrink-0">
                          <CheckCircle size={12} />
                        </div>
                        <div>
                          <strong className="text-white block mb-1">Always verify signatures</strong>
                          Don't process webhooks without validating the <code className="text-[#a78bfa] bg-[#0f1e35] px-1 py-0.5 rounded">X-Webhook-Signature</code> header against your workspace secret.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 bg-emerald-500/10 text-emerald-400 p-1 rounded-full shrink-0">
                          <CheckCircle size={12} />
                        </div>
                        <div>
                          <strong className="text-white block mb-1">Check the timestamp</strong>
                          Verify that the <code className="text-[#a78bfa] bg-[#0f1e35] px-1 py-0.5 rounded">X-Webhook-Timestamp</code> is within 5 minutes of your current system time to prevent replay attacks.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 bg-emerald-500/10 text-emerald-400 p-1 rounded-full shrink-0">
                          <CheckCircle size={12} />
                        </div>
                        <div>
                          <strong className="text-white block mb-1">Use HTTPS endpoints</strong>
                          We require all webhook endpoints to use HTTPS to ensure data is encrypted in transit.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 bg-emerald-500/10 text-emerald-400 p-1 rounded-full shrink-0">
                          <CheckCircle size={12} />
                        </div>
                        <div>
                          <strong className="text-white block mb-1">Store secrets securely</strong>
                          Never hardcode your webhook secret in your source code. Use environment variables or a secure secret management system.
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Documentation */}
            {activeTab === "docs" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl overflow-hidden shadow-lg">
                      <div className="bg-[#0f1e35] px-4 py-3 border-b border-[#1a3050] flex items-center justify-between">
                        <div className="text-white font-medium text-sm flex items-center gap-2">
                          <FileJson size={16} className="text-[#a78bfa]" /> Standard Payload Format
                        </div>
                        <button onClick={() => copyToClipboard(`{
  "id": "evt_123456789",
  "event": "client.created",
  "timestamp": "2026-03-29T12:00:00.000Z",
  "data": {
    "clientId": 42,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "active"
  },
  "metadata": {
    "environment": "production",
    "version": "1.0"
  }
}`, "Payload Example")} className="text-[#7a95b8] hover:text-white transition-colors"><Copy size={14} /></button>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-xs text-[#c8d8ec] font-mono leading-relaxed">{`{
  "id": "evt_123456789",
  "event": "client.created",
  "timestamp": "2026-03-29T12:00:00.000Z",
  "data": {
    "clientId": 42,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "active"
  },
  "metadata": {
    "environment": "production",
    "version": "1.0"
  }
}`}</pre>
                      </div>
                    </div>

                    {renderEventsTable()}
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-5 shadow-lg">
                      <h4 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                        <Play size={16} className="text-[#10b981]" /> Test Webhook
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-[#7a95b8]">Event Type</label>
                          <select 
                            className="w-full bg-[#0f1e35] border border-[#1a3050] rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                            value={testEvent}
                            onChange={(e) => setTestEvent(e.target.value)}
                          >
                            {Object.entries(EVENT_LABELS).filter(([k]) => k !== '*').map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-[#7a95b8]">Custom Payload (JSON)</label>
                          <textarea 
                            className="w-full bg-[#0f1e35] border border-[#1a3050] rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-[#3b82f6] min-h-[120px]"
                            value={testPayload}
                            onChange={(e) => setTestPayload(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={handleTestWebhook}
                          className="w-full rc-btn rc-btn-primary text-sm"
                          disabled={testMut.isPending || webhooks.length === 0}
                        >
                          {testMut.isPending ? 'Sending...' : 'Send Test Event'}
                        </button>
                        {webhooks.length === 0 && (
                          <p className="text-[10px] text-amber-400 text-center">Create a webhook first to test</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-5 shadow-lg">
                      <h4 className="text-white font-medium text-sm mb-3">Best Practices</h4>
                      <ul className="space-y-3 text-sm text-[#c8d8ec]">
                        <li className="flex items-start gap-2">
                          <CheckCircle size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                          <span>Respond with a 2xx status code quickly (within 3 seconds).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                          <span>Process heavy tasks asynchronously after acknowledging receipt.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                          <span>Implement idempotency using the <code className="text-xs bg-[#0f1e35] px-1 rounded">id</code> field.</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 shadow-lg">
                      <h4 className="text-blue-400 font-medium text-sm mb-2">Retry Policy</h4>
                      <p className="text-xs text-blue-200/70 leading-relaxed">
                        If your endpoint returns a non-2xx status code or times out, we will retry delivery up to 5 times with exponential backoff over 24 hours. After 5 consecutive failures, the webhook will be automatically disabled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="max-w-3xl">
                  <div className="bg-[#0a1628] border border-[#1a3050] rounded-xl p-6 shadow-lg mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Global Webhook Settings</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-[#1a3050]">
                        <div>
                          <h4 className="text-white font-medium">Auto-disable Failing Webhooks</h4>
                          <p className="text-sm text-[#7a95b8] mt-1">Automatically disable endpoints after 5 consecutive delivery failures.</p>
                        </div>
                        <button className="text-[#22c55e]">
                          <ToggleRight size={32} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between pb-4 border-b border-[#1a3050]">
                        <div>
                          <h4 className="text-white font-medium">Failure Notifications</h4>
                          <p className="text-sm text-[#7a95b8] mt-1">Send an email alert when a webhook is automatically disabled.</p>
                        </div>
                        <button className="text-[#22c55e]">
                          <ToggleRight size={32} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between pb-4 border-b border-[#1a3050]">
                        <div>
                          <h4 className="text-white font-medium">Strict SSL Verification</h4>
                          <p className="text-sm text-[#7a95b8] mt-1">Require valid SSL certificates for all HTTPS endpoints (recommended).</p>
                        </div>
                        <button className="text-[#22c55e]">
                          <ToggleRight size={32} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Log Retention Period</h4>
                          <p className="text-sm text-[#7a95b8] mt-1">How long to keep delivery logs before automatic deletion.</p>
                        </div>
                        <select className="bg-[#0f1e35] border border-[#1a3050] rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:border-[#3b82f6]" defaultValue="30">
                          <option value="7">7 Days</option>
                          <option value="14">14 Days</option>
                          <option value="30">30 Days</option>
                          <option value="90">90 Days</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {renderErrorTypesTable()}
                  
                  <div className="mt-6">
                    {renderApiLimitsTable()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <PageInsights pageId="webhooks" />
    </AppShell>
  );
}
