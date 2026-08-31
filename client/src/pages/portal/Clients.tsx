// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import {
  Plus,
  Search,
  ArrowRight,
  X,
  Clock,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Download,
  Tag,
  ShieldAlert,
  FileDown,
  Mail,
  TrendingUp,
  Users,
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { exportClientsToExcel } from "@/lib/excelExport";
import { BulkEmailTemplates } from "@/components/BulkEmailTemplates";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";

type ClientForm = {
  name: string; email: string; age: string; income: string;
  iraBalance: string; rothBalance: string; taxableAssets: string;
  realEstateEquity: string; lifeInsuranceCv: string; notes: string;
};

function AddClientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ClientForm>();
  const createMut = trpc.clients.create.useMutation({
    onSuccess: () => { toast.success("Client added"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const onSubmit = (data: ClientForm) => {
    createMut.mutate({
      name: data.name, email: data.email || undefined,
      age: data.age ? Number(data.age) : undefined,
      income: data.income ? Number(data.income) : undefined,
      iraBalance: data.iraBalance ? Number(data.iraBalance) : undefined,
      rothBalance: data.rothBalance ? Number(data.rothBalance) : undefined,
      taxableAssets: data.taxableAssets ? Number(data.taxableAssets) : undefined,
      realEstateEquity: data.realEstateEquity ? Number(data.realEstateEquity) : undefined,
      lifeInsuranceCv: data.lifeInsuranceCv ? Number(data.lifeInsuranceCv) : undefined,
      notes: data.notes || undefined,
    });
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rc-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Add Client</h2>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="rc-label">Full Name *</label>
              <input className="rc-input" {...register("name", { required: "Full name is required", minLength: { value: 2, message: "Use at least two characters" } })} placeholder="Jane Smith" />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>
            <div><label className="rc-label">Email</label><input className="rc-input" type="email" {...register("email", { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} placeholder="jane@email.com" />{errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}</div>
            <div><label className="rc-label">Age</label><input className="rc-input" type="number" min="0" max="120" {...register("age", { min: { value: 0, message: "Age cannot be negative" }, max: { value: 120, message: "Enter an age below 121" } })} placeholder="58" />{errors.age && <p className="text-xs text-red-400 mt-1">{errors.age.message}</p>}</div>
            <div><label className="rc-label">Annual Income ($)</label><input className="rc-input" type="number" {...register("income")} placeholder="250000" /></div>
            <div><label className="rc-label">IRA Balance ($)</label><input className="rc-input" type="number" {...register("iraBalance")} placeholder="800000" /></div>
            <div><label className="rc-label">Roth Balance ($)</label><input className="rc-input" type="number" {...register("rothBalance")} placeholder="120000" /></div>
            <div><label className="rc-label">Taxable Assets ($)</label><input className="rc-input" type="number" {...register("taxableAssets")} placeholder="300000" /></div>
            <div><label className="rc-label">Real Estate Equity ($)</label><input className="rc-input" type="number" {...register("realEstateEquity")} placeholder="1200000" /></div>
            <div><label className="rc-label">Life Insurance CV ($)</label><input className="rc-input" type="number" {...register("lifeInsuranceCv")} placeholder="0" /></div>
            <div className="col-span-2"><label className="rc-label">Notes</label><textarea className="rc-input" rows={3} {...register("notes")} placeholder="Key context, goals, concerns..." /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="rc-btn rc-btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createMut.isPending} className="rc-btn rc-btn-primary flex-1">
              {createMut.isPending ? "Saving..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CSV_COLUMNS: { key: string; aliases: string[]; type: "string" | "number" }[] = [{ key: "name", aliases: ["name", "full name", "client name", "client"], type: "string" },
,
  { key: "firstName", aliases: ["first name", "firstname", "first", "given name"], type: "string" },
,
  { key: "lastName", aliases: ["last name", "lastname", "last", "surname", "family name"], type: "string" },
,
  { key: "email", aliases: ["email", "email address", "e-mail"], type: "string" },
,
  { key: "phone", aliases: ["phone", "phone number", "mobile", "cell"], type: "string" }
];

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === '\t' || (ch === ',' && !text.slice(0, text.indexOf('\n')).includes('\t'))) { row.push(cell.trim()); cell = ""; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { row.push(cell.trim()); cell = ""; if (row.some(c => c)) rows.push(row); row = []; }
      else { cell += ch; }
    }
  }
  if (cell || row.length > 0) { row.push(cell.trim()); if (row.some(c => c)) rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, "").toLowerCase().trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { const val = (r[i] ?? "").replace(/^["']|["']$/g, "").trim(); if (val) obj[h] = val; });
    return obj;
  }).filter((r) => Object.keys(r).length > 0);
}

function mapCSVRow(raw: Record<string, string>): Record<string, any> | null {
  const mapped: Record<string, any> = {};
  for (const col of CSV_COLUMNS) {
    const foundKey = col.aliases.find((a) => raw[a] !== undefined);
    if (foundKey) {
      const val = raw[foundKey];
      if (col.type === "number") { const num = Number(val.replace(/[$,\s]/g, "")); if (!isNaN(num) && num > 0) mapped[col.key] = num; }
      else { if (val) mapped[col.key] = val; }
    }
  }
  if (!mapped.name && (mapped.firstName || mapped.lastName)) { mapped.name = [mapped.firstName, mapped.lastName].filter(Boolean).join(" "); }
  delete mapped.firstName; delete mapped.lastName;
  return mapped.name ? mapped : null;
}

type ImportResult = { imported: number; errors: { row: number; name: string; error: string }[]; total: number };

function CSVImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const bulkMut = trpc.clients.bulkImport.useMutation({
    onSuccess: (data) => { setResult(data); if (data.imported > 0) { toast.success(`${data.imported} client(s) imported`); onSuccess(); } },
    onError: (e) => toast.error(e.message),
  });
  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) { toast.error("Please upload a CSV or TSV file"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rawRows = parseCSV(text);
      const errors: string[] = [];
      const mapped: Record<string, any>[] = [];
      rawRows.forEach((r, i) => { const m = mapCSVRow(r); if (m) mapped.push(m); else errors.push(`Row ${i + 2}: missing required "name" field`); });
      setParsedRows(mapped); setParseErrors(errors); setResult(null);
    };
    reader.readAsText(file);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }, [processFile]);
  const handleImport = () => { if (parsedRows.length === 0) return; bulkMut.mutate({ rows: parsedRows as any }); };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rc-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><FileSpreadsheet size={18} className="text-[#22c55e]" /> Import Clients</h2>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1"><X size={18} /></button>
        </div>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? "border-[#22c55e] bg-[#22c55e]/5" : "border-[#1a3050]"}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={24} className="mx-auto mb-2 text-[#7a95b8]" />
          <div className="text-sm text-[#7a95b8]">Drop CSV/TSV file here or click to browse</div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        </div>
        {parseErrors.length > 0 && <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"><div className="text-xs text-red-400 font-semibold mb-1">Parse Warnings</div>{parseErrors.slice(0, 5).map((e, i) => <div key={i} className="text-xs text-red-300">{e}</div>)}</div>}
        {parsedRows.length > 0 && !result && (
          <div className="mt-4">
            <div className="text-sm text-white mb-2">{parsedRows.length} client(s) ready to import</div>
            <div className="max-h-40 overflow-y-auto text-xs text-[#c8d8ec] space-y-1 mb-3">{parsedRows.slice(0, 10).map((r, i) => <div key={i} className="p-2 bg-[#0f1e35] rounded">{r.name} {r.email ? `· ${r.email}` : ""} {r.income ? `· $${Number(r.income).toLocaleString()}` : ""}</div>)}{parsedRows.length > 10 && <div className="text-[#7a95b8]">...and {parsedRows.length - 10} more</div>}</div>
            <button onClick={handleImport} disabled={bulkMut.isPending} className="rc-btn rc-btn-primary w-full justify-center">{bulkMut.isPending ? "Importing..." : `Import ${parsedRows.length} Client(s)`}</button>
          </div>
        )}
        {result && (
          <div className="mt-4 p-4 rounded-xl bg-[#0f1e35] border border-[#12233e]">
            <div className="flex items-center gap-2 mb-2">{result.imported > 0 ? <CheckCircle size={16} className="text-[#22c55e]" /> : <AlertTriangle size={16} className="text-[#f0c040]" />}<span className="text-white font-semibold text-sm">{result.imported} of {result.total} imported</span></div>
            {result.errors.length > 0 && <div className="space-y-1 mt-2">{result.errors.slice(0, 5).map((e, i) => <div key={i} className="text-xs text-red-400">Row {e.row}: {e.name} — {e.error}</div>)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

const CHART_COLORS = ["#22c55e", "#a78bfa", "#f0c040", "#ef4444", "#3b82f6", "#ec4899"];

export default function Clients() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [filterTagId, setFilterTagId] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#22c55e");
  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 30_000 });
  const clients = clientsQuery.data ?? [];
  const riskQuery = trpc.riskScoring.scores.useQuery(undefined, { staleTime: 60_000 });
  const riskMap = Object.fromEntries((riskQuery.data ?? []).map((r) => [r.clientId, r]));
  const riskHistoryQuery = trpc.riskScoring.historyBulk.useQuery({ weeks: 8 }, { staleTime: 60_000 });
  const riskHistoryMap = (riskHistoryQuery.data ?? {}) as Record<number, { score: number; snapshotDate: Date }[]>;
  const tagsQuery = trpc.tags.list.useQuery(undefined, { staleTime: 30_000 });
  const tags = tagsQuery.data ?? [];
  const clientIds = clients.map((c) => c.id);
  const bulkTagsQuery = trpc.tags.bulkByClients.useQuery({ clientIds }, { enabled: clientIds.length > 0, staleTime: 30_000 });
  const clientTagMap = (bulkTagsQuery.data ?? {}) as Record<number, { tagId: number; tagName: string; tagColor: string }[]>;
  const createTagMut = trpc.tags.create.useMutation({ onSuccess: () => { tagsQuery.refetch(); setNewTagName(""); toast.success("Tag created"); } });
  const deleteTagMut = trpc.tags.delete.useMutation({ onSuccess: () => { tagsQuery.refetch(); bulkTagsQuery.refetch(); if (filterTagId) setFilterTagId(null); toast.success("Tag deleted"); } });
  const assignTagMut = trpc.tags.assign.useMutation({ onSuccess: () => bulkTagsQuery.refetch() });
  const removeTagMut = trpc.tags.remove.useMutation({ onSuccess: () => bulkTagsQuery.refetch() });

  const exportCsvQuery = trpc.clients.exportCsv.useQuery(undefined, { enabled: false });
  const exportCsvMut = {
    isPending: exportCsvQuery.isFetching,
    mutate: async () => {
      try {
        const result = await exportCsvQuery.refetch();
        if (result.data?.csv) {
          const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
          toast.success(`Exported ${clients.length} client(s) to CSV`);
        }
      } catch (e: any) { toast.error(e.message ?? "Export failed"); }
    },
  };

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesTag = filterTagId === null || (clientTagMap[c.id] ?? []).some(t => t.tagId === filterTagId);
    const isHidden = c.name.toLowerCase() === "heather scenario";
    return matchesSearch && matchesTag && !isHidden;
  });

  const analytics = useMemo(() => {
    if (clients.length === 0) return null;
    const totalNetWorth = clients.reduce((s, c) => s + Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0), 0);
    const avgNetWorth = totalNetWorth / clients.length;
    const avgAge = clients.filter((c) => c.age).reduce((s, c) => s + Number(c.age ?? 0), 0) / (clients.filter((c) => c.age).length || 1);
    const staleCount = clients.filter((c) => {
      if (!c.lastContactedAt) return true;
      return (Date.now() - new Date(c.lastContactedAt).getTime()) > 30 * 24 * 60 * 60 * 1000;
    }).length;

    const tiers = [
      { name: "< $100K", min: 0, max: 100_000 },
      { name: "$100K–$500K", min: 100_000, max: 500_000 },
      { name: "$500K–$1M", min: 500_000, max: 1_000_000 },
      { name: "$1M–$5M", min: 1_000_000, max: 5_000_000 },
      { name: "$5M+", min: 5_000_000, max: Infinity },
    ];
    const tierData = tiers.map((t) => {
      const count = clients.filter((c) => {
        const nw = Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0);
        return nw >= t.min && nw < t.max;
      }).length;
      return { name: t.name, count };
    });

    const ageBuckets = [
      { name: "< 40", min: 0, max: 40 },
      { name: "40–49", min: 40, max: 50 },
      { name: "50–59", min: 50, max: 60 },
      { name: "60–69", min: 60, max: 70 },
      { name: "70+", min: 70, max: 200 },
    ];
    const ageData = ageBuckets.map((b) => ({
      name: b.name,
      count: clients.filter((c) => c.age && Number(c.age) >= b.min && Number(c.age) < b.max).length,
    }));

    const riskLevels = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    Object.values(riskMap).forEach((r) => { if (r.level in riskLevels) riskLevels[r.level as keyof typeof riskLevels]++; });
    const riskData = Object.entries(riskLevels).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

    return { totalNetWorth, avgNetWorth, avgAge, staleCount, tierData, ageData, riskData };
  }, [clients, riskMap]);

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

  const riskColors: Record<string, string> = { LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#dc2626" };

  return (
    <AppShell>
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onSuccess={() => utils.clients.list.invalidate()} />}
      {showImport && <CSVImportModal onClose={() => setShowImport(false)} onSuccess={() => utils.clients.list.invalidate()} />}
      {showEmailTemplates && <BulkEmailTemplates onClose={() => setShowEmailTemplates(false)} />}

      <div className="rc-page-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="rc-page-title">Clients</h1>
            <p className="rc-page-subtitle">{clients.length} client{clients.length !== 1 ? "s" : ""} in workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides toolName="Clients" getSections={() => [{ title: "Clients Summary", items: [{ label: "Total Clients", value: clients.length.toString() }, { label: "Filtered Clients", value: filtered.length.toString() }] }]} />
            <button onClick={() => exportCsvMut.mutate()} disabled={exportCsvMut.isPending || clients.length === 0} className="rc-btn rc-btn-ghost text-sm border border-[#1a3050]">
              {exportCsvMut.isPending ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Exporting…</> : <><Download size={14} /> CSV</>}
            </button>
            <button onClick={() => { if (clients.length === 0) return; exportClientsToExcel(clients, "russell-capital-clients"); toast.success(`Exported ${clients.length} client(s) to Excel`); }} disabled={clients.length === 0} className="rc-btn rc-btn-ghost text-sm border border-[#1a3050]"><FileDown size={14} /> Excel</button>
            <button onClick={() => setShowEmailTemplates(true)} className="rc-btn rc-btn-ghost text-sm border border-[#1a3050]"><Mail size={14} /> Templates</button>
            <button onClick={() => setShowImport(true)} className="rc-btn rc-btn-ghost text-sm border border-[#1a3050]"><Upload size={14} /> Import CSV</button>
            <button onClick={() => setShowAdd(true)} className="rc-btn rc-btn-primary text-sm"><Plus size={14} /> Add Client</button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {clientsQuery.isError && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-400/25 bg-red-950/35 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold">Clients could not be loaded.</p><p className="mt-1 text-xs text-red-200/75">{clientsQuery.error.message}</p></div>
            <button onClick={() => clientsQuery.refetch()} className="rc-btn rc-btn-ghost text-sm"><RefreshCw size={14} /> Retry</button>
          </div>
        )}
        {/* ─── Analytics Dashboard ──────────────────────────────────────── */}
        {analytics && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setShowAnalytics(!showAnalytics)} className="flex items-center gap-2 text-sm text-[#7a95b8] hover:text-white transition-colors">
                <BarChart3 size={14} /> {showAnalytics ? "Hide" : "Show"} Analytics
              </button>
            </div>

            {showAnalytics && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
                  <div className="rc-card">
                    <div className="rc-stat-label flex items-center gap-1"><Users size={12} /> Total Clients</div>
                    <div className="rc-stat-value">{clients.length}</div>
                  </div>
                  <div className="rc-card">
                    <div className="rc-stat-label">Total Net Worth</div>
                    <div className="rc-stat-value text-[#22c55e]">{fmt(analytics.totalNetWorth)}</div>
                  </div>
                  <div className="rc-card">
                    <div className="rc-stat-label">Avg Net Worth</div>
                    <div className="rc-stat-value">{fmt(analytics.avgNetWorth)}</div>
                  </div>
                  <div className="rc-card">
                    <div className="rc-stat-label">Avg Age</div>
                    <div className="rc-stat-value">{Math.round(analytics.avgAge)}</div>
                  </div>
                  <div className="rc-card">
                    <div className="rc-stat-label flex items-center gap-1"><AlertTriangle size={12} className="text-amber-400" /> Stale (30d+)</div>
                    <div className="rc-stat-value text-amber-400">{analytics.staleCount}</div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Net Worth Distribution */}
                  <div className="rc-card">
                    <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-[#22c55e]" /> Net Worth Distribution</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analytics.tierData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                        <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Age Distribution */}
                  <div className="rc-card">
                    <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Users size={14} className="text-[#a78bfa]" /> Age Distribution</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analytics.ageData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                        <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Risk Distribution */}
                  <div className="rc-card">
                    <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><ShieldAlert size={14} className="text-[#f0c040]" /> Risk Distribution</div>
                    {analytics.riskData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={analytics.riskData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="name">
                            {analytics.riskData.map((entry, i) => <Cell key={i} fill={riskColors[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11, color: "#7a95b8" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[180px] text-[#7a95b8] text-sm">No risk data yet</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Search + Tag Filter */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
            <input className="rc-input pl-9" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setFilterTagId(null)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterTagId === null ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40" : "bg-[#0f1e35] text-[#7a95b8] border border-[#1a3050] hover:border-[#22c55e]/30"}`}>All</button>
              {tags.map((tag) => (
                <button key={tag.id} onClick={() => setFilterTagId(filterTagId === tag.id ? null : tag.id)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filterTagId === tag.id ? "border" : "bg-[#0f1e35] border border-[#1a3050] hover:border-[#22c55e]/30"}`} style={filterTagId === tag.id ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}66` } : {}}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />{tag.name}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setShowTagManager(!showTagManager)} className="rc-btn rc-btn-ghost text-xs border border-[#1a3050] px-2 py-1"><Tag size={12} /> Tags</button>
        </div>

        {/* Tag Manager */}
        {showTagManager && (
          <div className="rc-card mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Manage Tags</h3>
              <button onClick={() => setShowTagManager(false)} className="rc-btn rc-btn-ghost p-1"><X size={14} /></button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input className="rc-input text-sm flex-1" placeholder="Tag name..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
              <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <button onClick={() => newTagName.trim() && createTagMut.mutate({ name: newTagName.trim(), color: newTagColor })} disabled={!newTagName.trim() || createTagMut.isPending} className="rc-btn rc-btn-primary text-xs px-3 py-1.5">Create</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1.5 bg-[#0f1e35] border border-[#1a3050] rounded-full px-3 py-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="text-xs text-white">{tag.name}</span>
                  <button onClick={() => deleteTagMut.mutate({ tagId: tag.id })} className="text-[#7a95b8] hover:text-red-400 ml-1"><X size={10} /></button>
                </div>
              ))}
              {tags.length === 0 && <span className="text-xs text-[#7a95b8]">No tags yet. Create one above.</span>}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rc-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="rc-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Age</th>
                  <th>Income</th>
                  <th>IRA Balance</th>
                  <th>Total Assets</th>
                  <th>Opp. Score</th>
                  <th>Risk</th>
                  <th>Trend</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientsQuery.isLoading ? (
                  <tr><td colSpan={9} className="py-14"><div className="flex items-center justify-center gap-2 text-sm text-violet-200"><Loader2 size={18} className="animate-spin" /> Loading saved clients…</div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-[#7a95b8]">{search ? "No clients match your search." : "No clients yet. Add your first client or import a CSV to get started."}</td></tr>
                ) : (
                  filtered.map((c) => {
                    const totalAssets = Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0);
                    const score = c.opportunityScore ?? 0;
                    const lastContact = c.lastContactedAt ? new Date(c.lastContactedAt) : null;
                    const daysSince = lastContact ? Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const isStale = daysSince !== null && daysSince > 30;
                    const contactLabel = daysSince === null ? null : daysSince === 0 ? "Today" : daysSince === 1 ? "1 day ago" : `${daysSince} days ago`;
                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="font-semibold text-white">{c.name}</div>
                          {c.email && <div className="text-xs text-[#7a95b8]">{c.email}</div>}
                          {(clientTagMap[c.id] ?? []).length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {(clientTagMap[c.id] ?? []).map((t) => (
                                <span key={t.tagId} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${t.tagColor}15`, color: t.tagColor, border: `1px solid ${t.tagColor}33` }}>
                                  {t.tagName}
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeTagMut.mutate({ clientId: c.id, tagId: t.tagId }); }} className="hover:opacity-70"><X size={8} /></button>
                                </span>
                              ))}
                            </div>
                          )}
                          {tags.length > 0 && (
                            <div className="mt-1">
                              <select className="bg-transparent text-[10px] text-[#7a95b8] border-none cursor-pointer p-0 focus:outline-none" value="" onChange={(e) => { if (e.target.value) assignTagMut.mutate({ clientId: c.id, tagId: Number(e.target.value) }); }}>
                                <option value="">+ tag</option>
                                {tags.filter((t) => !(clientTagMap[c.id] ?? []).some(ct => ct.tagId === t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </div>
                          )}
                          {contactLabel ? (
                            <div className={`flex items-center gap-1 text-xs mt-0.5 ${isStale ? "text-amber-400" : "text-[#7a95b8]"}`}><Clock size={10} /> Last contact: {contactLabel}</div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs mt-0.5 text-[#7a95b8]/50"><Clock size={10} /> No activity logged</div>
                          )}
                        </td>
                        <td>{c.age ?? "—"}</td>
                        <td>{c.income ? fmt(Number(c.income)) : "—"}</td>
                        <td>{c.iraBalance ? fmt(Number(c.iraBalance)) : "—"}</td>
                        <td>{fmt(totalAssets)}</td>
                        <td>
                          <div className={`rc-score-ring w-10 h-10 text-sm ${score >= 70 ? "rc-score-high" : score >= 40 ? "rc-score-med" : "rc-score-low"}`}>{score}</div>
                        </td>
                        <td>
                          {(() => {
                            const risk = riskMap[c.id];
                            if (!risk) return <span className="text-[#7a95b8]">—</span>;
                            const colors: Record<string, { bg: string; text: string; border: string }> = { LOW: { bg: "#22c55e15", text: "#22c55e", border: "#22c55e33" }, MEDIUM: { bg: "#f59e0b15", text: "#f59e0b", border: "#f59e0b33" }, HIGH: { bg: "#ef444415", text: "#ef4444", border: "#ef444433" }, CRITICAL: { bg: "#dc262615", text: "#dc2626", border: "#dc262633" } };
                            const c2 = colors[risk.level] ?? colors.LOW;
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold cursor-help" style={{ backgroundColor: c2.bg, color: c2.text, border: `1px solid ${c2.border}` }}>
                                    <ShieldAlert size={11} />{risk.level}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  <div className="text-xs space-y-1">
                                    <div className="font-bold">Risk Score: {risk.score}/100</div>
                                    <div>AUM Concentration: {risk.factors.aumConcentration}/25</div>
                                    <div>Filing Complexity: {risk.factors.filingComplexity}/10</div>
                                    <div>Strategy Diversity: {risk.factors.strategyDiversity}/25</div>
                                    <div>Engagement Recency: {risk.factors.engagementRecency}/25</div>
                                    <div>Portfolio Size: {risk.factors.portfolioSize}/15</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const history = riskHistoryMap[c.id];
                            if (!history || history.length < 2) return <span className="text-[#7a95b8] text-[10px]">—</span>;
                            const pts = history.map((h) => h.score);
                            const min = Math.min(...pts); const max = Math.max(...pts); const range = max - min || 1;
                            const w = 60; const ht = 20; const step = w / (pts.length - 1);
                            const points = pts.map((s: number, i: number) => `${i * step},${ht - ((s - min) / range) * ht}`).join(" ");
                            const trend = pts[pts.length - 1] - pts[0];
                            const color = trend > 5 ? "#ef4444" : trend < -5 ? "#22c55e" : "#eab308";
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 cursor-help">
                                    <svg width={w} height={ht} className="flex-shrink-0"><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <span className={`text-[10px] font-semibold ${trend > 5 ? "text-red-400" : trend < -5 ? "text-green-400" : "text-yellow-400"}`}>{trend > 0 ? "+" : ""}{trend}</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left"><div className="text-xs">Risk trend ({history.length} weeks)</div></TooltipContent>
                              </Tooltip>
                            );
                          })()}
                        </td>
                        <td><Link href={`/portal/clients/${c.id}`} className="rc-btn rc-btn-ghost p-2"><ArrowRight size={14} /></Link></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <PageInsights pageId="clients" />
    </AppShell>
  );
}
