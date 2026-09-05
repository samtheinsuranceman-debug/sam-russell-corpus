// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Zap,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Search,
  Filter,
  ChevronDown,
  Clock,
  CheckCircle2,
  GripVertical,
  Trash2,
  Edit3,
  Save,
  BarChart3,
  Activity,
  Layers,
  Eye,
  CheckSquare,
  Square,
  ArrowRight,
  FileText,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
  ComposedChart,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════════════════
   PERFECT 10 PIPELINE — Russell Capital Systems™
   
   Features:
   1. Search & Filter Bar (client name, value range, stage, owner)
   2. Deal Aging Indicators (color-coded days in stage)
   3. Weighted Pipeline Forecast (probability × value per stage)
   4. Deal Detail Drawer (slide-out with timeline, notes, edit)
   5. Bulk Stage Advancement (checkbox select + batch move)
   6. Enhanced Kanban (drag-and-drop, age badges, probability)
   7. Pipeline Velocity Metrics (avg days per stage, conversion rates)
   8. Multiple View Modes (Kanban, Table, Forecast)
   ═══════════════════════════════════════════════════════════════════════════ */

const STAGES = [
  { key: "LEAD", label: "Lead", color: "#7a95b8", probability: 0.10 },
  { key: "QUALIFIED", label: "Qualified", color: "#3b82f6", probability: 0.25 },
  { key: "STRATEGY", label: "Strategy", color: "#a78bfa", probability: 0.50 },
  { key: "PROPOSAL", label: "Proposal", color: "#f0c040", probability: 0.75 },
  { key: "CLOSED_WON", label: "Closed Won", color: "#22c55e", probability: 1.0 },
  { key: "CLOSED_LOST", label: "Closed Lost", color: "#ef4444", probability: 0 },
] as const;

type Stage = typeof STAGES[number]["key"];
type DealForm = { clientId: string; value: string; ownerName: string; notes: string; probability: string };
type ViewMode = "kanban" | "table" | "forecast";

const STAGE_ORDER: Record<string, number> = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` :
  `$${n.toLocaleString()}`;

const fmtShort = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` :
  n.toString();

function getDaysInStage(deal: any): number {
  const updated = deal.updatedAt ? new Date(deal.updatedAt) : new Date(deal.createdAt);
  return Math.floor((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24));
}

function getAgingColor(days: number): { bg: string; text: string; label: string } {
  if (days <= 7) return { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Fresh" };
  if (days <= 14) return { bg: "bg-amber-500/10", text: "text-amber-400", label: "Aging" };
  if (days <= 30) return { bg: "bg-orange-500/10", text: "text-orange-400", label: "Stale" };
  return { bg: "bg-red-500/10", text: "text-red-400", label: "Critical" };
}

function getAgingDot(days: number): string {
  if (days <= 7) return "#22c55e";
  if (days <= 14) return "#f59e0b";
  if (days <= 30) return "#f97316";
  return "#ef4444";
}

/* ─── Add Deal Modal ─────────────────────────────────────────────────────── */
function AddDealModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit } = useForm<DealForm>();
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const createMut = trpc.pipeline.create.useMutation({
    onSuccess: () => { toast.success("Deal added to pipeline"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const onSubmit = (data: DealForm) => {
    if (!data.clientId) return toast.error("Select a client");
    createMut.mutate({
      clientId: Number(data.clientId),
      value: data.value ? Number(data.value) : undefined,
      ownerName: data.ownerName || undefined,
      notes: data.notes || undefined,
      probability: data.probability ? Number(data.probability) / 100 : undefined,
    });
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rc-card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Add New Deal</h2>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="rc-label">Client *</label><select className="rc-input" {...register("clientId", { required: true })}><option value="">Select client...</option>{(clientsQuery.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="rc-label">Deal Value ($)</label><input className="rc-input" type="number" {...register("value")} placeholder="250,000" /></div>
            <div><label className="rc-label">Probability (%)</label><input className="rc-input" type="number" min="0" max="100" {...register("probability")} placeholder="50" /></div>
          </div>
          <div><label className="rc-label">Owner / Advisor</label><input className="rc-input" {...register("ownerName")} placeholder="Advisor name" /></div>
          <div><label className="rc-label">Notes</label><textarea className="rc-input" rows={2} {...register("notes")} placeholder="Deal context, next steps..." /></div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rc-btn rc-btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createMut.isPending} className="rc-btn rc-btn-primary flex-1">{createMut.isPending ? "Adding..." : "Add Deal"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── AI Closing Script Modal ────────────────────────────────────────────── */
function ScriptModal({ deal, onClose }: { deal: any; onClose: () => void }) {
  const scriptMut = trpc.ai.closingScript.useMutation();
  const generate = () => {
    scriptMut.mutate({
      clientName: deal.clientName ?? "Client",
      stage: deal.stage,
      dealValue: Number(deal.value ?? 0),
      notes: deal.notes ?? undefined,
    });
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rc-card w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><Zap size={16} className="text-[#f0c040]" /> Smart Closing Script</h2>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="text-sm text-[#7a95b8] mb-4">
          Client: <span className="text-white">{deal.clientName ?? "—"}</span> · Stage: <span className="text-white">{deal.stage}</span> · Value: <span className="text-white">{fmt(Number(deal.value ?? 0))}</span>
        </div>
        {!scriptMut.data ? (
          <button onClick={generate} disabled={scriptMut.isPending} className="rc-btn rc-btn-primary w-full justify-center">
            {scriptMut.isPending ? "Generating..." : "Generate Script"}
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-[#0f1e35] border border-[#12233e] text-sm text-[#c8d8ec] leading-relaxed whitespace-pre-wrap">
            {String(scriptMut.data.content ?? "")}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Deal Detail Drawer ─────────────────────────────────────────────────── */
function DealDrawer({ deal, clientName, onClose, onUpdate }: {
  deal: any; clientName: string; onClose: () => void; onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(deal.value ?? ""));
  const [editNotes, setEditNotes] = useState(deal.notes ?? "");
  const [editProb, setEditProb] = useState(String(Number(deal.probability ?? 0) * 100));
  const [editOwner, setEditOwner] = useState(deal.ownerName ?? "");

  const updateMut = trpc.pipeline.updateDetails.useMutation({
    onSuccess: () => { toast.success("Deal updated"); setEditing(false); onUpdate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.pipeline.deleteDeal.useMutation({
    onSuccess: () => { toast.success("Deal deleted"); onClose(); onUpdate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateStageMut = trpc.pipeline.updateStage.useMutation({
    onSuccess: () => { toast.success("Stage updated"); onUpdate(); },
    onError: (e) => toast.error(e.message),
  });

  const days = getDaysInStage(deal);
  const aging = getAgingColor(days);
  const stageInfo = STAGES.find((s) => s.key === deal.stage);
  const stageIdx = STAGES.findIndex(s => s.key === deal.stage);
  const nextStage = stageIdx < STAGES.length - 2 ? STAGES[stageIdx + 1] : null;

  const handleSave = () => {
    updateMut.mutate({
      id: deal.id,
      value: editValue ? Number(editValue) : undefined,
      notes: editNotes || undefined,
      probability: editProb ? Number(editProb) / 100 : undefined,
      ownerName: editOwner || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-[#0b1628] border-l border-[#12233e] h-full overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0b1628] border-b border-[#12233e] p-5 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: stageInfo?.color }} />
              <span className="text-xs font-bold uppercase tracking-wider text-[#7a95b8]">{stageInfo?.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {!editing && (
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-[#132544] text-[#7a95b8] hover:text-white transition-colors">
                  <Edit3 size={14} />
                </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#132544] text-[#7a95b8] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
          <Link href={`/portal/clients/${deal.clientId}`}>
            <h2 className="text-xl font-bold text-white hover:text-[#22c55e] transition-colors cursor-pointer flex items-center gap-2">
              {clientName}
              <ExternalLink size={14} className="opacity-50" />
            </h2>
          </Link>
        </div>

        <div className="p-5 space-y-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rc-card !p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-1">Deal Value</div>
              {editing ? (
                <input className="rc-input text-lg font-bold" type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
              ) : (
                <div className="text-lg font-bold text-white">{fmt(Number(deal.value ?? 0))}</div>
              )}
            </div>
            <div className="rc-card !p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-1">Probability</div>
              {editing ? (
                <input className="rc-input text-lg font-bold" type="number" min="0" max="100" value={editProb} onChange={(e) => setEditProb(e.target.value)} />
              ) : (
                <div className="text-lg font-bold text-white">{Math.round(Number(deal.probability ?? stageInfo?.probability ?? 0) * 100)}%</div>
              )}
            </div>
            <div className="rc-card !p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-1">Weighted Value</div>
              <div className="text-lg font-bold text-[#22c55e]">
                {fmt(Number(deal.value ?? 0) * Number(deal.probability ?? stageInfo?.probability ?? 0))}
              </div>
            </div>
            <div className={`rc-card !p-3 ${aging.bg}`}>
              <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-1">Days in Stage</div>
              <div className={`text-lg font-bold ${aging.text}`}>{days}d</div>
            </div>
          </div>

          {/* Owner */}
          <div className="rc-card !p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-1">Advisor / Owner</div>
            {editing ? (
              <input className="rc-input" value={editOwner} onChange={(e) => setEditOwner(e.target.value)} placeholder="Advisor name" />
            ) : (
              <div className="text-sm text-white">{deal.ownerName || "Unassigned"}</div>
            )}
          </div>

          {/* Notes */}
          <div className="rc-card !p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-1">Notes</div>
            {editing ? (
              <textarea className="rc-input" rows={4} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Deal context, next steps..." />
            ) : (
              <div className="text-sm text-[#c8d8ec] whitespace-pre-wrap">{deal.notes || "No notes yet"}</div>
            )}
          </div>

          {/* Stage Progress */}
          <div className="rc-card !p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-3">Stage Progress</div>
            <div className="flex items-center gap-1">
              {STAGES.filter((s) => s.key !== "CLOSED_LOST").map((s, i) => {
                const isCurrent = s.key === deal.stage;
                const isPast = STAGE_ORDER[s.key] < STAGE_ORDER[deal.stage];
                return (
                  <div key={s.key} className="flex items-center gap-1 flex-1">
                    <button
                      onClick={() => {
                        if (s.key !== deal.stage) updateStageMut.mutate({ id: deal.id, stage: s.key });
                      }}
                      className={`flex-1 h-2 rounded-full transition-all cursor-pointer hover:opacity-80 ${
                        isCurrent || isPast ? "" : "opacity-20"
                      }`}
                      style={{ background: s.color }}
                      title={`Move to ${s.label}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              {STAGES.filter((s) => s.key !== "CLOSED_LOST").map((s) => (
                <span key={s.key} className={`text-[9px] ${s.key === deal.stage ? "text-white font-bold" : "text-[#7a95b8]"}`}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          {editing ? (
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="rc-btn rc-btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} disabled={updateMut.isPending} className="rc-btn rc-btn-primary flex-1">
                {updateMut.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {nextStage && deal.stage !== "CLOSED_WON" && deal.stage !== "CLOSED_LOST" && (
                <button
                  onClick={() => updateStageMut.mutate({ id: deal.id, stage: nextStage.key })}
                  className="rc-btn rc-btn-primary w-full justify-center"
                >
                  <ArrowRight size={14} /> Advance to {nextStage.label}
                </button>
              )}
              {deal.stage !== "CLOSED_WON" && deal.stage !== "CLOSED_LOST" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateStageMut.mutate({ id: deal.id, stage: "CLOSED_WON" })}
                    className="rc-btn text-sm text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/10 justify-center"
                  >
                    <CheckCircle2 size={14} /> Won
                  </button>
                  <button
                    onClick={() => updateStageMut.mutate({ id: deal.id, stage: "CLOSED_LOST" })}
                    className="rc-btn text-sm text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/10 justify-center"
                  >
                    <XCircle size={14} /> Lost
                  </button>
                </div>
              )}
              <button
                onClick={() => { if (confirm("Delete this deal permanently?")) deleteMut.mutate({ id: deal.id }); }}
                className="rc-btn rc-btn-ghost text-[#ef4444] w-full justify-center text-sm"
              >
                <Trash2 size={14} /> Delete Deal
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="rc-card !p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-3">Timeline</div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs text-white">Deal Created</div>
                  <div className="text-[10px] text-[#7a95b8]">{new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
              </div>
              {deal.updatedAt && deal.updatedAt !== deal.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#3b82f6] mt-1.5 shrink-0" />
                  <div>
                    <div className="text-xs text-white">Last Updated</div>
                    <div className="text-[10px] text-[#7a95b8]">{new Date(deal.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                </div>
              )}
              {deal.closedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#f0c040] mt-1.5 shrink-0" />
                  <div>
                    <div className="text-xs text-white">Closed</div>
                    <div className="text-[10px] text-[#7a95b8]">{new Date(deal.closedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Bulk Actions Bar ───────────────────────────────────────────────────── */
function BulkActionsBar({ count, onMove, onClear }: {
  count: number;
  onMove: (stage: Stage) => void;
  onClear: () => void;
}) {
  const [showStages, setShowStages] = useState(false);
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#132544] border border-[#22c55e]/30 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl shadow-[#22c55e]/10">
      <div className="flex items-center gap-2">
        <CheckSquare size={16} className="text-[#22c55e]" />
        <span className="text-white font-semibold text-sm">{count} deal{count > 1 ? "s" : ""} selected</span>
      </div>
      <div className="w-px h-6 bg-[#1a3055]" />
      <div className="relative">
        <button onClick={() => setShowStages(!showStages)} className="rc-btn rc-btn-primary text-sm">
          Move to Stage <ChevronDown size={14} />
        </button>
        {showStages && (
          <div className="absolute bottom-full mb-2 left-0 bg-[#0b1628] border border-[#12233e] rounded-xl p-2 min-w-[160px] shadow-xl">
            {STAGES.map((s) => (
              <button
                key={s.key}
                onClick={() => { onMove(s.key); setShowStages(false); }}
                className="w-full text-left px-3 py-2 text-sm text-[#c8d8ec] hover:bg-[#132544] rounded-lg flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={onClear} className="rc-btn rc-btn-ghost text-sm text-[#7a95b8]">
        <X size={14} /> Clear
      </button>
    </div>
  );
}

const CHART_COLORS = ["#7a95b8", "#3b82f6", "#a78bfa", "#f0c040", "#22c55e", "#ef4444"];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PIPELINE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Pipeline() {
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [scriptDeal, setScriptDeal] = useState<any>(null);
  const [drawerDeal, setDrawerDeal] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterMinValue, setFilterMinValue] = useState("");
  const [filterMaxValue, setFilterMaxValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<Set<number>>(new Set());
  const [dragDealId, setDragDealId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const dealsQuery = trpc.pipeline.list.useQuery(undefined, { staleTime: 30_000 });
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const updateStageMut = trpc.pipeline.updateStage.useMutation({
    onSuccess: () => utils.pipeline.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const bulkUpdateMut = trpc.pipeline.bulkUpdateStage.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updated} deal${data.updated > 1 ? "s" : ""} moved`);
      setSelectedDeals(new Set());
      utils.pipeline.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deals = dealsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const clientMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients]);

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) =>
        (clientMap[d.clientId] ?? "").toLowerCase().includes(q) ||
        (d.ownerName ?? "").toLowerCase().includes(q) ||
        (d.notes ?? "").toLowerCase().includes(q)
      );
    }
    if (filterStage !== "all") {
      result = result.filter((d) => d.stage === filterStage);
    }
    if (filterMinValue) {
      result = result.filter((d) => Number(d.value ?? 0) >= Number(filterMinValue));
    }
    if (filterMaxValue) {
      result = result.filter((d) => Number(d.value ?? 0) <= Number(filterMaxValue));
    }
    return result;
  }, [deals, searchQuery, filterStage, filterMinValue, filterMaxValue, clientMap]);

  const activeDeals = deals.filter((d) => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage));
  const totalPipeline = activeDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const closedWon = deals.filter((d) => d.stage === "CLOSED_WON").reduce((s, d) => s + Number(d.value ?? 0), 0);
  const closedDeals = deals.filter((d) => ["CLOSED_WON", "CLOSED_LOST"].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "CLOSED_WON");
  const winRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
  const avgDealSize = wonDeals.length > 0 ? wonDeals.reduce((s, d) => s + Number(d.value ?? 0), 0) / wonDeals.length : 0;

  const weightedForecast = activeDeals.reduce((s, d) => {
    const stageProb = STAGES.find((st) => st.key === d.stage)?.probability ?? 0;
    const dealProb = d.probability ? Number(d.probability) : stageProb;
    return s + Number(d.value ?? 0) * dealProb;
  }, 0);

  const avgDaysInStage = activeDeals.length > 0
    ? Math.round(activeDeals.reduce((s, d) => s + getDaysInStage(d), 0) / activeDeals.length)
    : 0;

  const forecastData = useMemo(() =>
    STAGES.filter((s) => s.key !== "CLOSED_LOST" && s.key !== "CLOSED_WON").map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage.key);
      const raw = stageDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
      const weighted = stageDeals.reduce((s, d) => {
        const prob = d.probability ? Number(d.probability) : stage.probability;
        return s + Number(d.value ?? 0) * prob;
      }, 0);
      return { name: stage.label, raw: raw / 1000, weighted: weighted / 1000, color: stage.color };
    }),
    [deals]
  );

  const stageValueData = useMemo(() =>
    STAGES.map((stage) => ({
      name: stage.label,
      value: deals.filter((d) => d.stage === stage.key).reduce((s, d) => s + Number(d.value ?? 0), 0) / 1000,
      count: deals.filter((d) => d.stage === stage.key).length,
      color: stage.color,
    })),
    [deals]
  );

  const pieData = useMemo(() =>
    STAGES.map((stage) => ({
      name: stage.label,
      value: deals.filter((d) => d.stage === stage.key).length,
      color: stage.color,
    })).filter((d) => d.value > 0),
    [deals]
  );

  const velocityData = useMemo(() =>
    STAGES.filter((s) => s.key !== "CLOSED_LOST").map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage.key);
      const avgDays = stageDeals.length > 0
        ? Math.round(stageDeals.reduce((s, d) => s + getDaysInStage(d), 0) / stageDeals.length)
        : 0;
      return { name: stage.label, days: avgDays, color: stage.color };
    }),
    [deals]
  );

  const handleDragStart = useCallback((dealId: number) => setDragDealId(dealId), []);
  const handleDragOver = useCallback((e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDragOverStage(stageKey);
  }, []);
  const handleDragLeave = useCallback(() => setDragOverStage(null), []);
  const handleDrop = useCallback((stageKey: string) => {
    if (dragDealId !== null) {
      updateStageMut.mutate({ id: dragDealId, stage: stageKey as Stage });
      toast.info(`Deal moved to ${STAGES.find((s) => s.key === stageKey)?.label}`);
    }
    setDragDealId(null);
    setDragOverStage(null);
  }, [dragDealId, updateStageMut]);

  const toggleSelect = (id: number) => {
    setSelectedDeals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const handleBulkMove = (stage: Stage) => {
    bulkUpdateMut.mutate({ ids: Array.from(selectedDeals), stage });
  };

  const invalidate = () => utils.pipeline.list.invalidate();

  return (
    <AppShell>
      {showAdd && <AddDealModal onClose={() => setShowAdd(false)} onSuccess={invalidate} />}
      {scriptDeal && <ScriptModal deal={{ ...scriptDeal, clientName: clientMap[scriptDeal.clientId] }} onClose={() => setScriptDeal(null)} />}
      {drawerDeal && (
        <DealDrawer
          deal={drawerDeal}
          clientName={clientMap[drawerDeal.clientId] ?? `Client #${drawerDeal.clientId}`}
          onClose={() => setDrawerDeal(null)}
          onUpdate={invalidate}
        />
      )}
      <BulkActionsBar count={selectedDeals.size} onMove={handleBulkMove} onClear={() => setSelectedDeals(new Set())} />

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="rc-page-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="rc-page-title">Pipeline</h1>
            <p className="rc-page-subtitle">{deals.length} deals · {fmt(totalPipeline)} active · {fmt(closedWon)} closed won</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExportToSlides
              toolName="Pipeline"
              getSections={() => [
                { title: "Pipeline Summary", items: [
                  { label: "Total Pipeline", value: fmt(totalPipeline) },
                  { label: "Weighted Forecast", value: fmt(weightedForecast) },
                  { label: "Closed Won", value: fmt(closedWon) },
                  { label: "Win Rate", value: `${winRate}%` },
                  { label: "Avg Deal Size", value: fmt(avgDealSize) },
                  { label: "Avg Days in Stage", value: `${avgDaysInStage} days` },
                ]},
                { title: "Stage Breakdown", items: STAGES.filter((s) => s.key !== "CLOSED_LOST").map((stage) => {
                  const count = deals.filter((d) => d.stage === stage.key).length;
                  const value = deals.filter((d) => d.stage === stage.key).reduce((s, d) => s + Number(d.value ?? 0), 0);
                  return { label: stage.label, value: `${count} deals · ${fmt(value)}` };
                })},
              ]}
            />
            <button onClick={() => setShowAdd(true)} className="rc-btn rc-btn-primary text-sm"><Plus size={14} /> Add Deal</button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* ─── Stat Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Active Pipeline", value: fmt(totalPipeline), icon: DollarSign, color: "#3b82f6" },
            { label: "Weighted Forecast", value: fmt(weightedForecast), icon: Target, color: "#a78bfa" },
            { label: "Closed Won", value: fmt(closedWon), icon: TrendingUp, color: "#22c55e" },
            { label: "Win Rate", value: `${winRate}%`, icon: Award, color: winRate >= 50 ? "#22c55e" : winRate >= 25 ? "#f0c040" : "#ef4444" },
            { label: "Avg Deal Size", value: fmt(avgDealSize), icon: BarChart3, color: "#f0c040" },
            { label: "Avg Days in Stage", value: `${avgDaysInStage}d`, icon: Clock, color: avgDaysInStage <= 14 ? "#22c55e" : avgDaysInStage <= 30 ? "#f0c040" : "#ef4444" },
          ].map((stat, i) => (
            <div key={i} className="rc-card !p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon size={12} style={{ color: stat.color }} />
                <span className="text-[10px] uppercase tracking-wider text-[#7a95b8]">{stat.label}</span>
              </div>
              <div className="text-lg font-bold text-white" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ─── Search & Filter Bar ─────────────────────────────────────── */}
        <div className="rc-card !p-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
              <input
                className="rc-input pl-9 !py-2 text-sm"
                placeholder="Search deals by client, owner, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="rc-input !py-2 text-sm !w-auto min-w-[140px]"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
            >
              <option value="all">All Stages</option>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`rc-btn text-sm ${showFilters ? "rc-btn-primary" : "rc-btn-ghost"}`}
            >
              <Filter size={14} /> Filters
            </button>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#0f1e35] rounded-lg p-1">
              {([
                { mode: "kanban" as ViewMode, icon: Layers, label: "Kanban" },
                { mode: "table" as ViewMode, icon: FileText, label: "Table" },
                { mode: "forecast" as ViewMode, icon: BarChart3, label: "Forecast" },
              ]).map((v) => (
                <button
                  key={v.mode}
                  onClick={() => setViewMode(v.mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === v.mode ? "bg-[#22c55e] text-white" : "text-[#7a95b8] hover:text-white"
                  }`}
                >
                  <v.icon size={12} /> {v.label}
                </button>
              ))}
            </div>
          </div>
          {showFilters && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#12233e] flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7a95b8]">Value Range:</span>
                <input className="rc-input !py-1.5 text-sm !w-24" type="number" placeholder="Min" value={filterMinValue} onChange={(e) => setFilterMinValue(e.target.value)} />
                <span className="text-[#7a95b8]">—</span>
                <input className="rc-input !py-1.5 text-sm !w-24" type="number" placeholder="Max" value={filterMaxValue} onChange={(e) => setFilterMaxValue(e.target.value)} />
              </div>
              {(searchQuery || filterStage !== "all" || filterMinValue || filterMaxValue) && (
                <button
                  onClick={() => { setSearchQuery(""); setFilterStage("all"); setFilterMinValue(""); setFilterMaxValue(""); }}
                  className="rc-btn rc-btn-ghost text-xs text-[#ef4444]"
                >
                  <X size={12} /> Clear All
                </button>
              )}
              <span className="text-xs text-[#7a95b8] ml-auto">{filteredDeals.length} of {deals.length} deals</span>
            </div>
          )}
        </div>

        {/* ─── Charts Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Weighted Forecast Chart */}
          <div className="rc-card md:col-span-2">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target size={14} className="text-[#a78bfa]" /> Weighted Pipeline Forecast ($K)
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={forecastData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <RTooltip
                  contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  formatter={(v: number, name: string) => [`$${v.toFixed(0)}K`, name === "raw" ? "Total Value" : "Weighted"]}
                />
                <Bar dataKey="raw" fill="#1a3055" radius={[4, 4, 0, 0]} name="raw" />
                <Bar dataKey="weighted" radius={[4, 4, 0, 0]} name="weighted">
                  {forecastData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Deal Distribution Pie */}
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Deal Distribution</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2} dataKey="value" nameKey="name">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#7a95b8" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-[#7a95b8] text-sm">No deals yet</div>
            )}
          </div>
        </div>

        {/* Pipeline Velocity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Activity size={14} className="text-[#22c55e]" /> Pipeline Velocity (Avg Days per Stage)
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={velocityData} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => [`${v} days`, "Avg"]} />
                <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                  {velocityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Funnel */}
          <div className="rc-card">
            <h3 className="text-sm font-semibold text-white mb-3">Conversion Funnel</h3>
            <div className="space-y-2">
              {STAGES.filter((s) => s.key !== "CLOSED_LOST").map((stage) => {
                const count = filteredDeals.filter((d) => d.stage === stage.key).length;
                const pct = filteredDeals.length > 0 ? (count / filteredDeals.length) * 100 : 0;
                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-[#7a95b8] truncate">{stage.label}</div>
                    <div className="flex-1 h-5 bg-[#0f1e35] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: stage.color }}
                      >
                        {pct > 10 && <span className="text-[9px] text-white font-bold">{count}</span>}
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs text-[#7a95b8]">{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── KANBAN VIEW ─────────────────────────────────────────────── */}
        {viewMode === "kanban" && (
          <div className="rc-kanban">
            {STAGES.map((stage) => {
              const stageDeals = filteredDeals.filter((d) => d.stage === stage.key);
              const stageValue = stageDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
              const isDropTarget = dragOverStage === stage.key;
              return (
                <div
                  key={stage.key}
                  className={`rc-kanban-col transition-all ${isDropTarget ? "ring-2 ring-[#22c55e]/50 bg-[#0f1e35]" : ""}`}
                  onDragOver={(e) => handleDragOver(e, stage.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(stage.key)}
                >
                  <div className="rc-kanban-col-header">
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    {stage.label}
                    <span className="ml-auto text-xs font-normal text-[#7a95b8]">{stageDeals.length}</span>
                  </div>
                  {stageValue > 0 && <div className="text-xs text-[#7a95b8] mb-3 -mt-1">{fmt(stageValue)}</div>}
                  {stageDeals.map((deal) => {
                    const days = getDaysInStage(deal);
                    const agingDot = getAgingDot(days);
                    const isSelected = selectedDeals.has(deal.id);
                    const prob = deal.probability ? Number(deal.probability) : stage.probability;
                    return (
                      <div
                        key={deal.id}
                        className={`rc-kanban-card group ${isSelected ? "!border-[#22c55e]" : ""}`}
                        draggable
                        onDragStart={() => handleDragStart(deal.id)}
                        onClick={() => setDrawerDeal(deal)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSelect(deal.id); }}
                              className="shrink-0 text-[#7a95b8] hover:text-[#22c55e] transition-colors"
                            >
                              {isSelected ? <CheckSquare size={14} className="text-[#22c55e]" /> : <Square size={14} />}
                            </button>
                            <Link
                              href={`/portal/clients/${deal.clientId}`}
                              className="text-sm font-semibold text-white hover:text-[#22c55e] transition-colors truncate"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              {clientMap[deal.clientId] ?? `Client #${deal.clientId}`}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: agingDot }} title={`${days}d in stage`} />
                            <GripVertical size={12} className="text-[#7a95b8] opacity-0 group-hover:opacity-50 cursor-grab" />
                          </div>
                        </div>
                        {deal.value && <div className="text-xs text-[#22c55e] font-bold mb-0.5">{fmt(Number(deal.value))}</div>}
                        <div className="flex items-center gap-2 text-[10px] text-[#7a95b8] mb-1">
                          {deal.ownerName && <span>{deal.ownerName}</span>}
                          <span className="flex items-center gap-0.5"><Clock size={9} /> {days}d</span>
                          <span className="ml-auto">{Math.round(prob * 100)}%</span>
                        </div>
                        {deal.notes && <div className="text-[11px] text-[#c8d8ec] line-clamp-2 mb-1.5">{deal.notes}</div>}
                        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {stage.key !== "CLOSED_WON" && stage.key !== "CLOSED_LOST" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const idx = STAGES.findIndex(s => s.key === stage.key);
                                const next = STAGES[idx + 1];
                                if (next) updateStageMut.mutate({ id: deal.id, stage: next.key });
                              }}
                              className="text-[10px] text-[#22c55e] hover:underline flex items-center gap-0.5"
                            >
                              <ArrowRight size={10} /> Advance
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setScriptDeal(deal); }}
                            className="text-[10px] text-[#f0c040] hover:underline flex items-center gap-0.5"
                          >
                            <Zap size={10} /> Script
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDrawerDeal(deal); }}
                            className="text-[10px] text-[#3b82f6] hover:underline flex items-center gap-0.5 ml-auto"
                          >
                            <Eye size={10} /> Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {stageDeals.length === 0 && (
                    <div className="text-xs text-[#7a95b8] text-center py-6 opacity-50 border border-dashed border-[#12233e] rounded-lg">
                      {isDropTarget ? "Drop here" : "Empty"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── TABLE VIEW ──────────────────────────────────────────────── */}
        {viewMode === "table" && (
          <div className="rc-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#12233e]">
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold w-8">
                    <button onClick={() => {
                      if (selectedDeals.size === filteredDeals.length) setSelectedDeals(new Set());
                      else setSelectedDeals(new Set(filteredDeals.map((d) => d.id)));
                    }}>
                      {selectedDeals.size === filteredDeals.length && filteredDeals.length > 0 ? <CheckSquare size={14} className="text-[#22c55e]" /> : <Square size={14} className="text-[#7a95b8]" />}
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold">Client</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold">Stage</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold">Value</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold">Probability</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold">Weighted</th>
                  <th className="text-center py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold">Age</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold">Owner</th>
                  <th className="text-center py-3 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8] font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => {
                  const stageInfo = STAGES.find((s) => s.key === deal.stage);
                  const days = getDaysInStage(deal);
                  const aging = getAgingColor(days);
                  const prob = deal.probability ? Number(deal.probability) : (stageInfo?.probability ?? 0);
                  const weighted = Number(deal.value ?? 0) * prob;
                  const isSelected = selectedDeals.has(deal.id);
                  return (
                    <tr
                      key={deal.id}
                      className={`border-b border-[#12233e]/50 hover:bg-[#0f1e35] cursor-pointer transition-colors ${isSelected ? "bg-[#22c55e]/5" : ""}`}
                      onClick={() => setDrawerDeal(deal)}
                    >
                      <td className="py-2.5 px-3">
                        <button onClick={(e) => { e.stopPropagation(); toggleSelect(deal.id); }}>
                          {isSelected ? <CheckSquare size={14} className="text-[#22c55e]" /> : <Square size={14} className="text-[#7a95b8]" />}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <Link href={`/portal/clients/${deal.clientId}`} className="text-white hover:text-[#22c55e] font-medium" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          {clientMap[deal.clientId] ?? `Client #${deal.clientId}`}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${stageInfo?.color}20`, color: stageInfo?.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: stageInfo?.color }} />
                          {stageInfo?.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-white font-medium">{fmt(Number(deal.value ?? 0))}</td>
                      <td className="py-2.5 px-3 text-right text-[#c8d8ec]">{Math.round(prob * 100)}%</td>
                      <td className="py-2.5 px-3 text-right text-[#22c55e] font-medium">{fmt(weighted)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${aging.bg} ${aging.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: getAgingDot(days) }} />
                          {days}d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#c8d8ec] text-xs">{deal.ownerName || "—"}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setScriptDeal(deal); }} className="p-1 rounded hover:bg-[#132544] text-[#f0c040]" title="AI Script">
                            <Zap size={12} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDrawerDeal(deal); }} className="p-1 rounded hover:bg-[#132544] text-[#3b82f6]" title="Details">
                            <Eye size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredDeals.length === 0 && (
              <div className="text-center py-12 text-[#7a95b8]">
                {deals.length === 0 ? "No deals yet. Add your first deal to get started." : "No deals match your filters."}
              </div>
            )}
          </div>
        )}

        {/* ─── FORECAST VIEW ──────────────────────────────────────────── */}
        {viewMode === "forecast" && (
          <div className="space-y-6">
            {/* Large Forecast Chart */}
            <div className="rc-card">
              <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Target size={14} className="text-[#a78bfa]" /> Pipeline Forecast — Raw vs Weighted ($K)
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={forecastData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                  <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Bar dataKey="raw" fill="#1a3055" radius={[4, 4, 0, 0]} name="Total Value ($K)" />
                  <Line type="monotone" dataKey="weighted" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e", r: 5 }} name="Weighted ($K)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Stage-by-Stage Forecast Table */}
            <div className="rc-card overflow-x-auto">
              <div className="text-sm font-semibold text-white mb-4">Stage-by-Stage Forecast</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#12233e]">
                    <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8]">Stage</th>
                    <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8]">Deals</th>
                    <th className="text-right py-2 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8]">Total Value</th>
                    <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8]">Avg Probability</th>
                    <th className="text-right py-2 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8]">Weighted Value</th>
                    <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-[#7a95b8]">Avg Days</th>
                  </tr>
                </thead>
                <tbody>
                  {STAGES.filter((s) => s.key !== "CLOSED_LOST").map((stage) => {
                    const stageDeals = deals.filter((d) => d.stage === stage.key);
                    const totalVal = stageDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
                    const weightedVal = stageDeals.reduce((s, d) => {
                      const prob = d.probability ? Number(d.probability) : stage.probability;
                      return s + Number(d.value ?? 0) * prob;
                    }, 0);
                    const avgProb = stageDeals.length > 0
                      ? stageDeals.reduce((s, d) => s + (d.probability ? Number(d.probability) : stage.probability), 0) / stageDeals.length
                      : stage.probability;
                    const avgDays = stageDeals.length > 0
                      ? Math.round(stageDeals.reduce((s, d) => s + getDaysInStage(d), 0) / stageDeals.length)
                      : 0;
                    return (
                      <tr key={stage.key} className="border-b border-[#12233e]/50">
                        <td className="py-2.5 px-3">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                            <span className="text-white font-medium">{stage.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#c8d8ec]">{stageDeals.length}</td>
                        <td className="py-2.5 px-3 text-right text-white font-medium">{fmt(totalVal)}</td>
                        <td className="py-2.5 px-3 text-center text-[#c8d8ec]">{Math.round(avgProb * 100)}%</td>
                        <td className="py-2.5 px-3 text-right text-[#22c55e] font-bold">{fmt(weightedVal)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-xs ${avgDays > 14 ? "text-[#f59e0b]" : "text-[#c8d8ec]"}`}>{avgDays}d</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#22c55e]/30">
                    <td className="py-3 px-3 text-white font-bold">Total</td>
                    <td className="py-3 px-3 text-center text-white font-bold">{deals.filter((d) => d.stage !== "CLOSED_LOST").length}</td>
                    <td className="py-3 px-3 text-right text-white font-bold">{fmt(deals.filter((d) => d.stage !== "CLOSED_LOST").reduce((s, d) => s + Number(d.value ?? 0), 0))}</td>
                    <td className="py-3 px-3 text-center text-white">—</td>
                    <td className="py-3 px-3 text-right text-[#22c55e] font-bold text-lg">{fmt(weightedForecast + closedWon)}</td>
                    <td className="py-3 px-3 text-center text-white">{avgDaysInStage}d</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
      <PageInsights pageId="pipeline" />
    </AppShell>
  );
}
