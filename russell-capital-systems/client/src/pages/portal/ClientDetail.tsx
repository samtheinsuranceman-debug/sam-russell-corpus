// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Brain, Edit2, Save, X, Phone, Users, Mail,
  CheckSquare, MessageSquare, Trash2, Plus, Sparkles, ChevronDown, FileDown,
  Activity, UserPlus, TrendingUp, FileText, RefreshCw, Clock, Tag,
  Upload, File, FolderOpen, Calendar, ToggleLeft, ToggleRight,
  ShieldAlert, AlertTriangle, Shield, ShieldCheck, Lightbulb,
  Home, Building, DollarSign, Coins, TrendingDown, Percent,
} from "lucide-react";
import React, { useState, useRef, useMemo } from "react";
import { RiskGauge } from "@/components/RiskGauge";
import { NetWorthHistoryChart } from "@/components/NetWorthHistoryChart";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { Streamdown } from "@/components/StreamdownLite";
import { NumberInput } from "@/components/NumberInput";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";

const NOTE_TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  CALL:    { icon: <Phone size={12} />,         label: "Call",    color: "text-green-400 bg-green-400/10" },
  MEETING: { icon: <Users size={12} />,         label: "Meeting", color: "text-blue-400 bg-blue-400/10" },
  EMAIL:   { icon: <Mail size={12} />,          label: "Email",   color: "text-purple-400 bg-purple-400/10" },
  TASK:    { icon: <CheckSquare size={12} />,   label: "Task",    color: "text-yellow-400 bg-yellow-400/10" },
  GENERAL: { icon: <MessageSquare size={12} />, label: "Note",    color: "text-[#7a95b8] bg-[#7a95b8]/10" },
};

type NoteType = "CALL" | "MEETING" | "EMAIL" | "TASK" | "GENERAL";

const RISK_LEVEL_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  LOW:      { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", icon: <ShieldCheck size={18} className="text-green-400" /> },
  MEDIUM:   { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", icon: <Shield size={18} className="text-yellow-400" /> },
  HIGH:     { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", icon: <AlertTriangle size={18} className="text-orange-400" /> },
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", icon: <ShieldAlert size={18} className="text-red-400" /> },
};

const FACTOR_COLORS: Record<string, string> = {
  aumConcentration: "#3b82f6",
  filingComplexity: "#a78bfa",
  strategyDiversity: "#f97316",
  engagementRecency: "#ef4444",
  portfolioSize: "#22c55e",
};

function RiskSparkline({ data }: { data: { score: number; snapshotDate: Date }[] }) {
  if (!data || data.length < 2) return <span className="text-[10px] text-[#7a95b8] italic">Collecting data...</span>;
  const chartData = data.map((d) => ({ score: d.score, date: new Date(d.snapshotDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }));
  const first = data[0].score;
  const last = data[data.length - 1].score;
  const trend = last - first;
  const color = trend > 5 ? "#ef4444" : trend < -5 ? "#22c55e" : "#eab308";
  return (
    <div className="flex items-center gap-2">
      <ResponsiveContainer width={120} height={32}>
        <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`riskGrad-${first}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="score" stroke={color} strokeWidth={1.5} fill={`url(#riskGrad-${first})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <span className={`text-[10px] font-semibold ${trend > 5 ? "text-red-400" : trend < -5 ? "text-green-400" : "text-yellow-400"}`}>
        {trend > 0 ? "+" : ""}{trend}
      </span>
    </div>
  );
}

function ClientPropertiesSection({ clientId }: { clientId: number }) {
  const propertiesQuery = trpc.properties.list.useQuery({ clientId });
  const createMut = trpc.properties.create.useMutation({ onSuccess: () => { propertiesQuery.refetch(); setShowAdd(false); resetForm(); toast.success("Property added"); } });
  const deleteMut = trpc.properties.delete.useMutation({ onSuccess: () => { propertiesQuery.refetch(); toast.success("Property removed"); } });
  const updateMut = trpc.properties.update.useMutation({ onSuccess: () => { propertiesQuery.refetch(); setEditingId(null); toast.success("Property updated"); } });
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const emptyForm = { propertyName: "", propertyType: "PRIMARY" as const, propertyValue: "", monthlyMortgagePayment: "", monthlyInterestOnlyPayment: "", totalInterestPayment: "", monthlyRentalIncome: "", annualAppreciation: "", mortgageBalance: "", interestRate: "", loanTermYears: "" };
  const [form, setForm] = useState(emptyForm);
  const resetForm = () => setForm(emptyForm);
  const properties = propertiesQuery.data ?? [];

  const handleSubmit = () => {
    if (!form.propertyName) { toast.error("Property name is required"); return; }
    const data = {
      clientId, propertyName: form.propertyName,
      propertyType: form.propertyType as any,
      ...(form.propertyValue ? { propertyValue: Number(form.propertyValue) } : {}),
      ...(form.monthlyMortgagePayment ? { monthlyMortgagePayment: Number(form.monthlyMortgagePayment) } : {}),
      ...(form.monthlyInterestOnlyPayment ? { monthlyInterestOnlyPayment: Number(form.monthlyInterestOnlyPayment) } : {}),
      ...(form.totalInterestPayment ? { totalInterestPayment: Number(form.totalInterestPayment) } : {}),
      ...(form.monthlyRentalIncome ? { monthlyRentalIncome: Number(form.monthlyRentalIncome) } : {}),
      ...(form.annualAppreciation ? { annualAppreciation: Number(form.annualAppreciation) } : {}),
      ...(form.mortgageBalance ? { mortgageBalance: Number(form.mortgageBalance) } : {}),
      ...(form.interestRate ? { interestRate: Number(form.interestRate) } : {}),
      ...(form.loanTermYears ? { loanTermYears: Number(form.loanTermYears) } : {}),
    };
    if (editingId) { updateMut.mutate({ id: editingId, ...data }); }
    else { createMut.mutate(data); }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      propertyName: p.propertyName || "", propertyType: p.propertyType || "PRIMARY",
      propertyValue: p.propertyValue?.toString() || "", monthlyMortgagePayment: p.monthlyMortgagePayment?.toString() || "",
      monthlyInterestOnlyPayment: p.monthlyInterestOnlyPayment?.toString() || "",
      totalInterestPayment: p.totalInterestPayment?.toString() || "",
      monthlyRentalIncome: p.monthlyRentalIncome?.toString() || "",
      annualAppreciation: p.annualAppreciation?.toString() || "",
      mortgageBalance: p.mortgageBalance?.toString() || "",
      interestRate: p.interestRate?.toString() || "",
      loanTermYears: p.loanTermYears?.toString() || "",
    });
    setShowAdd(true);
  };

  const fmt = (v: number | null | undefined) => v != null ? `$${Number(v).toLocaleString()}` : "—";
  const pctFmt = (v: number | null | undefined) => v != null ? `${Number(v).toFixed(2)}%` : "—";

  const PropertyForm = () => (
    <div className="space-y-3 p-4 bg-[#0f1e35] rounded-xl border border-[#12233e]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="rc-label">Property Name *</label><input className="rc-input" value={form.propertyName} onChange={(e) => setForm(p => ({ ...p, propertyName: e.target.value }))} placeholder="e.g. Primary Residence" /></div>
        <div><label className="rc-label">Property Type</label>
          <select className="rc-input" value={form.propertyType} onChange={(e) => setForm(p => ({ ...p, propertyType: e.target.value as any }))}>
            <option value="PRIMARY">Primary Residence</option><option value="INVESTMENT">Investment Property</option>
            <option value="SHORT_TERM_RENTAL">Short-Term Rental</option><option value="COMMERCIAL">Commercial</option><option value="LAND">Land</option>
          </select>
        </div>
        <NumberInput value={form.propertyValue} onChange={(v) => setForm(p => ({ ...p, propertyValue: v }))}  className="rc-label" placeholder="500000" />
        <NumberInput value={form.mortgageBalance} onChange={(v) => setForm(p => ({ ...p, mortgageBalance: v }))}  className="rc-label" placeholder="300000" />
        <NumberInput value={form.monthlyMortgagePayment} onChange={(v) => setForm(p => ({ ...p, monthlyMortgagePayment: v }))}  className="rc-label" placeholder="2100" />
        <NumberInput value={form.monthlyInterestOnlyPayment} onChange={(v) => setForm(p => ({ ...p, monthlyInterestOnlyPayment: v }))}  className="rc-label" placeholder="1500" />
        <NumberInput value={form.totalInterestPayment} onChange={(v) => setForm(p => ({ ...p, totalInterestPayment: v }))}  className="rc-label" placeholder="250000" />
        <NumberInput value={form.interestRate} onChange={(v) => setForm(p => ({ ...p, interestRate: v }))}  className="rc-label" placeholder="6.5" />
        <NumberInput value={form.loanTermYears} onChange={(v) => setForm(p => ({ ...p, loanTermYears: v }))}  className="rc-label" placeholder="30" />
        <NumberInput value={form.monthlyRentalIncome} onChange={(v) => setForm(p => ({ ...p, monthlyRentalIncome: v }))}  className="rc-label" placeholder="3500" />
        <NumberInput value={form.annualAppreciation} onChange={(v) => setForm(p => ({ ...p, annualAppreciation: v }))}  className="rc-label" placeholder="5.0" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => { setShowAdd(false); setEditingId(null); resetForm(); }} className="rc-btn rc-btn-ghost text-sm"><X size={14} /> Cancel</button>
        <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="rc-btn rc-btn-primary text-sm">
          <Save size={14} /> {editingId ? "Update" : "Add"} Property
        </button>
      </div>
    </div>
  );

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white font-semibold"><Home size={18} className="text-blue-400" /> Properties & Mortgages</div>
        <button onClick={() => { setShowAdd(true); setEditingId(null); resetForm(); }} className="rc-btn rc-btn-secondary text-sm"><Plus size={14} /> Add Property</button>
      </div>
      {showAdd && <PropertyForm />}
      {properties.length === 0 && !showAdd ? (
        <div className="text-center py-8 text-[#7a95b8] text-sm">No properties tracked yet. Add a property to track mortgage payments and rental income.</div>
      ) : (
        <div className="space-y-3 mt-3">
          {properties.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-[#0f1e35] border border-[#12233e]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-blue-400" />
                  <span className="text-white font-medium">{p.propertyName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">{p.propertyType?.replace("_", " ")}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(p)} className="rc-btn rc-btn-ghost text-xs"><Edit2 size={12} /></button>
                  <button onClick={() => deleteMut.mutate({ id: p.id })} className="rc-btn rc-btn-ghost text-xs text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                <div><span className="text-[#7a95b8] text-xs block">Value</span><span className="text-white font-medium">{fmt(p.propertyValue)}</span></div>
                <div><span className="text-[#7a95b8] text-xs block">Mortgage Balance</span><span className="text-white font-medium">{fmt(p.mortgageBalance)}</span></div>
                <div><span className="text-[#7a95b8] text-xs block">Monthly Mortgage</span><span className="text-white font-medium">{fmt(p.monthlyMortgagePayment)}</span></div>
                <div><span className="text-[#7a95b8] text-xs block">Interest-Only Payment</span><span className="text-white font-medium">{fmt(p.monthlyInterestOnlyPayment)}</span></div>
                <div><span className="text-[#7a95b8] text-xs block">Total Interest</span><span className="text-white font-medium">{fmt(p.totalInterestPayment)}</span></div>
                <div><span className="text-[#7a95b8] text-xs block">Interest Rate</span><span className="text-white font-medium">{pctFmt(p.interestRate)}</span></div>
                <div><span className="text-[#7a95b8] text-xs block">Monthly Rental Income</span><span className="text-[#22c55e] font-medium">{fmt(p.monthlyRentalIncome)}</span></div>
                <div><span className="text-[#7a95b8] text-xs block">Annual Appreciation</span><span className="text-white font-medium">{pctFmt(p.annualAppreciation)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCryptoSection({ clientId }: { clientId: number }) {
  const holdingsQuery = trpc.crypto.list.useQuery({ clientId });
  const createMut = trpc.crypto.create.useMutation({ onSuccess: () => { holdingsQuery.refetch(); setShowAdd(false); resetForm(); toast.success("Crypto holding added"); } });
  const deleteMut = trpc.crypto.delete.useMutation({ onSuccess: () => { holdingsQuery.refetch(); toast.success("Holding removed"); } });
  const updateMut = trpc.crypto.update.useMutation({ onSuccess: () => { holdingsQuery.refetch(); setEditingId(null); toast.success("Holding updated"); } });
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const emptyForm = { coinId: "", coinName: "", coinSymbol: "", quantity: "", avgPurchasePrice: "", amountStaked: "", stakingPercentage: "", predictedStakingIncome: "" };
  const [form, setForm] = useState(emptyForm);
  const resetForm = () => setForm(emptyForm);
  const holdings = holdingsQuery.data ?? [];

  const coinIds = useMemo(() => holdings.map((h) => h.coinId).filter(Boolean), [holdings]);
  const pricesQuery = trpc.crypto.prices.useQuery({ coinIds }, { enabled: coinIds.length > 0, staleTime: 60_000, refetchInterval: 120_000 });
  const prices = pricesQuery.data ?? {};

  const handleSubmit = () => {
    if (!form.coinId || !form.coinName) { toast.error("Coin ID and name are required"); return; }
    const data = {
      clientId, coinId: form.coinId.toLowerCase(), coinName: form.coinName,
      coinSymbol: form.coinSymbol || undefined,
      quantity: Number(form.quantity) || 0, avgPurchasePrice: Number(form.avgPurchasePrice) || 0,
      ...(form.amountStaked ? { amountStaked: Number(form.amountStaked) } : {}),
      ...(form.stakingPercentage ? { stakingPercentage: Number(form.stakingPercentage) } : {}),
      ...(form.predictedStakingIncome ? { predictedStakingIncome: Number(form.predictedStakingIncome) } : {}),
    };
    if (editingId) { updateMut.mutate({ id: editingId, ...data }); }
    else { createMut.mutate(data); }
  };

  const startEdit = (h: any) => {
    setEditingId(h.id);
    setForm({
      coinId: h.coinId || "", coinName: h.coinName || "", coinSymbol: h.coinSymbol || "",
      quantity: h.quantity?.toString() || "", avgPurchasePrice: h.avgPurchasePrice?.toString() || "",
      amountStaked: h.amountStaked?.toString() || "", stakingPercentage: h.stakingPercentage?.toString() || "",
      predictedStakingIncome: h.predictedStakingIncome?.toString() || "",
    });
    setShowAdd(true);
  };

  const fmt = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const CryptoForm = () => (
    <div className="space-y-3 p-4 bg-[#0f1e35] rounded-xl border border-[#12233e]">
      <p className="text-xs text-[#7a95b8]">Use CoinGecko IDs (e.g. "bitcoin", "ethereum", "solana") for live price tracking.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="rc-label">Coin ID (CoinGecko) *</label><input className="rc-input" value={form.coinId} onChange={(e) => setForm(p => ({ ...p, coinId: e.target.value }))} placeholder="bitcoin" /></div>
        <div><label className="rc-label">Coin Name *</label><input className="rc-input" value={form.coinName} onChange={(e) => setForm(p => ({ ...p, coinName: e.target.value }))} placeholder="Bitcoin" /></div>
        <div><label className="rc-label">Symbol</label><input className="rc-input" value={form.coinSymbol} onChange={(e) => setForm(p => ({ ...p, coinSymbol: e.target.value }))} placeholder="BTC" /></div>
        <NumberInput value={form.quantity} onChange={(v) => setForm(p => ({ ...p, quantity: v }))}  className="rc-label" placeholder="2.5" />
        <NumberInput value={form.avgPurchasePrice} onChange={(v) => setForm(p => ({ ...p, avgPurchasePrice: v }))}  className="rc-label" placeholder="45000" />
        <NumberInput value={form.amountStaked} onChange={(v) => setForm(p => ({ ...p, amountStaked: v }))}  className="rc-label" placeholder="1.0" />
        <NumberInput value={form.stakingPercentage} onChange={(v) => setForm(p => ({ ...p, stakingPercentage: v }))}  className="rc-label" placeholder="5.5" />
        <NumberInput value={form.predictedStakingIncome} onChange={(v) => setForm(p => ({ ...p, predictedStakingIncome: v }))}  className="rc-label" placeholder="2500" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => { setShowAdd(false); setEditingId(null); resetForm(); }} className="rc-btn rc-btn-ghost text-sm"><X size={14} /> Cancel</button>
        <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="rc-btn rc-btn-primary text-sm">
          <Save size={14} /> {editingId ? "Update" : "Add"} Holding
        </button>
      </div>
    </div>
  );

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white font-semibold"><Coins size={18} className="text-amber-400" /> Cryptocurrency Holdings</div>
        <button onClick={() => { setShowAdd(true); setEditingId(null); resetForm(); }} className="rc-btn rc-btn-secondary text-sm"><Plus size={14} /> Add Holding</button>
      </div>
      {showAdd && <CryptoForm />}
      {holdings.length === 0 && !showAdd ? (
        <div className="text-center py-8 text-[#7a95b8] text-sm">No crypto holdings tracked. Add holdings to track live prices from CoinGecko.</div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#7a95b8] text-xs border-b border-[#12233e]">
                <th className="text-left py-2 px-2">Coin</th>
                <th className="text-right py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Avg Cost</th>
                <th className="text-right py-2 px-2">Current Price</th>
                <th className="text-right py-2 px-2">Value</th>
                <th className="text-right py-2 px-2">P&L</th>
                <th className="text-right py-2 px-2">Staked</th>
                <th className="text-right py-2 px-2">Staking %</th>
                <th className="text-right py-2 px-2">Est. Income</th>
                <th className="text-right py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const livePrice = prices[h.coinId]?.usd;
                const change24h = prices[h.coinId]?.usd_24h_change;
                const qty = Number(h.quantity) || 0;
                const avgCost = Number(h.avgPurchasePrice) || 0;
                const currentValue = livePrice ? qty * livePrice : qty * avgCost;
                const costBasis = qty * avgCost;
                const pnl = currentValue - costBasis;
                const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
                return (
                  <tr key={h.id} className="border-b border-[#12233e]/50 hover:bg-[#0f1e35]/50">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{h.coinName}</span>
                        <span className="text-[10px] text-[#7a95b8] uppercase">{h.coinSymbol || h.coinId}</span>
                        {change24h != null && (
                          <span className={`text-[10px] ${change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {change24h >= 0 ? "+" : ""}{change24h.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-2 px-2 text-white">{qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                    <td className="text-right py-2 px-2 text-white">{fmt(avgCost)}</td>
                    <td className="text-right py-2 px-2">
                      {livePrice ? (
                        <span className="text-white font-medium">{fmt(livePrice)}</span>
                      ) : (
                        <span className="text-[#7a95b8] text-xs italic">Loading...</span>
                      )}
                    </td>
                    <td className="text-right py-2 px-2 text-white font-medium">{fmt(currentValue)}</td>
                    <td className={`text-right py-2 px-2 font-medium ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnl >= 0 ? "+" : ""}{fmt(pnl)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                    </td>
                    <td className="text-right py-2 px-2 text-white">{h.amountStaked ? Number(h.amountStaked).toLocaleString(undefined, { maximumFractionDigits: 6 }) : "—"}</td>
                    <td className="text-right py-2 px-2 text-white">{h.stakingPercentage ? `${Number(h.stakingPercentage).toFixed(2)}%` : "—"}</td>
                    <td className="text-right py-2 px-2 text-[#22c55e]">{h.predictedStakingIncome ? fmt(Number(h.predictedStakingIncome)) : "—"}</td>
                    <td className="text-right py-2 px-2">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => startEdit(h)} className="rc-btn rc-btn-ghost text-xs p-1"><Edit2 size={12} /></button>
                        <button onClick={() => deleteMut.mutate({ id: h.id })} className="rc-btn rc-btn-ghost text-xs p-1 text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-[#7a95b8] mt-2 text-right">Prices from <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">CoinGecko</a> · Updates every 2 min</p>
        </div>
      )}
    </div>
  );
}

function ClientRiskCard({ clientId }: { clientId: number }) {
  const riskQuery = trpc.riskScoring.scoreForClient.useQuery({ clientId }, { enabled: !!clientId, staleTime: 60_000 });
  const historyQuery = trpc.riskScoring.history.useQuery({ clientId, weeks: 12 }, { enabled: !!clientId, staleTime: 60_000 });
  const riskData = riskQuery.data;

  if (riskQuery.isLoading) {
    return (
      <div className="rc-card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-[#7a95b8]" />
          <span className="text-white font-semibold">Risk Assessment</span>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[#12233e] rounded w-1/3" />
          <div className="h-3 bg-[#12233e] rounded w-2/3" />
          <div className="h-3 bg-[#12233e] rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!riskData) return null;

  const style = RISK_LEVEL_STYLES[riskData.level] ?? RISK_LEVEL_STYLES.LOW;
  const recommendations = (riskData as any).recommendations ?? [];
  const activeRecs = recommendations.filter((r) => r.recommendation);

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#22c55e]" />
          <span className="text-white font-semibold">Risk Assessment</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${style.bg} ${style.text} ${style.border} border`}>
          {style.icon}
          <span>{riskData.level}</span>
          <span className="opacity-70">({riskData.score}/100)</span>
        </div>
      </div>

      {/* Risk Trend Sparkline */}
      {historyQuery.data && historyQuery.data.length >= 2 && (
        <div className="mb-5 p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#7a95b8] uppercase tracking-wider">Score Trend (last {historyQuery.data.length} weeks)</span>
            <RiskSparkline data={historyQuery.data} />
          </div>
        </div>
      )}

      {/* Score gauge */}
      <div className="mb-5 flex justify-center">
        <RiskGauge score={riskData.score} size={180} label="Overall Risk" />
      </div>

      {/* Factor breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-5">
        {recommendations.map((r) => {
          const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
          const color = FACTOR_COLORS[r.factor] ?? "#7a95b8";
          return (
            <div key={r.factor} className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
              <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-1 truncate" title={r.label}>{r.label}</div>
              <div className="text-lg font-bold text-white">{r.score}<span className="text-xs text-[#7a95b8] font-normal">/{r.maxScore}</span></div>
              <div className="h-1.5 rounded-full bg-[#0b1628] mt-2 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actionable recommendations */}
      {activeRecs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-[#f0c040]" />
            <span className="text-sm font-semibold text-white">Actionable Recommendations</span>
          </div>
          <div className="space-y-2">
            {activeRecs.map((r) => {
              const color = FACTOR_COLORS[r.factor] ?? "#7a95b8";
              return (
                <div key={r.factor} className="flex gap-3 p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
                  <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div>
                    <div className="text-xs font-semibold text-white mb-0.5">{r.label}</div>
                    <p className="text-xs text-[#c8d8ec] leading-relaxed">{r.recommendation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ClientNotesSection({ clientId, clientName }: { clientId: number; clientName: string }) {
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("GENERAL");
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const notesQuery = trpc.notes.list.useQuery({ clientId }, { enabled: !!clientId });
  const summarizeMut = trpc.notes.summarize.useMutation({
    onSuccess: (data) => {
      setSummary(typeof data.summary === "string" ? data.summary : String(data.summary));
      setShowSummary(true);
    },
    onError: (e: { message: string }) => toast.error(`Summarize failed: ${e.message}`),
  });
  const createMut = trpc.notes.create.useMutation({
    onSuccess: () => {
      setContent("");
      utils.notes.list.invalidate({ clientId });
      toast.success("Note added");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.notes.delete.useMutation({
    onSuccess: () => { utils.notes.list.invalidate({ clientId }); toast.success("Note deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const notes = notesQuery.data ?? [];

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMut.mutate({ clientId, noteType, content: content.trim() });
  };

  const handleSummarize = () => {
    if (notes.length === 0) return toast.error("No notes to summarize yet.");
    summarizeMut.mutate({ clientId, clientName });
  };

  return (
    <div className="rc-card">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare size={16} className="text-[#22c55e]" />
        <div className="text-white font-semibold">Activity Feed</div>
        <span className="ml-auto text-xs text-[#7a95b8]">{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
        {notes.length > 0 && (
          <button
            onClick={handleSummarize}
            disabled={summarizeMut.isPending}
            className="rc-btn rc-btn-secondary text-xs flex items-center gap-1.5"
            title="Smart activity summary"
          >
            {summarizeMut.isPending ? (
              <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Summarizing…</>
            ) : (
              <><Sparkles size={12} /> Summarize Activity</>
            )}
          </button>
        )}
      </div>

      {/* AI Summary card */}
      {showSummary && summary && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-[#22c55e]/10 via-[#22c55e]/5 to-transparent border border-[#22c55e]/20 relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-[#22c55e]" />
            <span className="text-[#22c55e] font-semibold text-sm">Activity Summary</span>
            <button
              onClick={() => setShowSummary(false)}
              className="ml-auto text-[#7a95b8] hover:text-white transition-colors"
              aria-label="Dismiss summary"
            >
              <X size={14} />
            </button>
          </div>
          <div className="text-sm text-[#c8d8ec] leading-relaxed">
            <Streamdown>{summary}</Streamdown>
          </div>
        </div>
      )}

      {/* New note composer */}
      <div className="mb-5 p-4 rounded-xl bg-[#0f1e35] border border-[#12233e]">
        <div className="flex gap-2 mb-3 flex-wrap">
          {(Object.keys(NOTE_TYPE_META) as NoteType[]).map((type) => (
            <button
              key={type}
              onClick={() => setNoteType(type)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                noteType === type
                  ? NOTE_TYPE_META[type].color + " ring-1 ring-current"
                  : "text-[#7a95b8] bg-[#0b1628] hover:text-white"
              }`}
            >
              {NOTE_TYPE_META[type].icon}
              {NOTE_TYPE_META[type].label}
            </button>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="rc-input resize-none w-full"
          rows={3}
          placeholder={`Add a ${NOTE_TYPE_META[noteType].label.toLowerCase()} note...`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#7a95b8]">Ctrl+Enter to submit</span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || createMut.isPending}
            className="rc-btn rc-btn-primary text-sm"
          >
            <Plus size={14} /> {createMut.isPending ? "Saving..." : "Add Note"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notesQuery.isLoading ? (
        <div className="text-center py-6 text-[#7a95b8] text-sm">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-[#7a95b8] text-sm">
          <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
          No activity yet. Add the first note above.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const meta = NOTE_TYPE_META[note.noteType ?? "GENERAL"];
            return (
              <div key={note.id} className="p-4 rounded-xl bg-[#0f1e35] border border-[#12233e] group">
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${meta.color}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-[#7a95b8]">
                      {note.authorName ?? "Advisor"} · {new Date(note.createdAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => deleteMut.mutate({ noteId: note.id })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7a95b8] hover:text-red-400"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-[#c8d8ec] leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ACTION_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  CLIENT_CREATED:      { icon: <UserPlus size={14} />,      label: "Client Created",      color: "text-green-400 bg-green-400/10" },
  CLIENT_UPDATED:      { icon: <Edit2 size={14} />,         label: "Client Updated",      color: "text-blue-400 bg-blue-400/10" },
  NOTE_ADDED:          { icon: <MessageSquare size={14} />, label: "Note Added",          color: "text-purple-400 bg-purple-400/10" },
  DEAL_STAGE_CHANGED:  { icon: <TrendingUp size={14} />,    label: "Deal Stage Changed",  color: "text-yellow-400 bg-yellow-400/10" },
  STRATEGY_GENERATED:  { icon: <Brain size={14} />,         label: "Strategy Generated",  color: "text-emerald-400 bg-emerald-400/10" },
  STRATEGY_SAVED:      { icon: <FileText size={14} />,      label: "Strategy Saved",      color: "text-cyan-400 bg-cyan-400/10" },
  BULK_IMPORT:         { icon: <RefreshCw size={14} />,     label: "Bulk Import",         color: "text-orange-400 bg-orange-400/10" },
};

const DEFAULT_ACTION_META = { icon: <Activity size={14} />, label: "Activity", color: "text-[#7a95b8] bg-[#7a95b8]/10" };

function ClientAuditTimeline({ clientId }: { clientId: number }) {
  const [showAll, setShowAll] = useState(false);
  const activityQuery = trpc.activity.listByClient.useQuery({ clientId }, { enabled: !!clientId });
  const entries = activityQuery.data ?? [];
  const visible = showAll ? entries : entries.slice(0, 10);

  return (
    <div className="rc-card">
      <div className="flex items-center gap-2 mb-5">
        <Clock size={16} className="text-[#4f8cff]" />
        <div className="text-white font-semibold">Compliance Audit Trail</div>
        <span className="ml-auto text-xs text-[#7a95b8]">{entries.length} event{entries.length !== 1 ? "s" : ""}</span>
      </div>

      {activityQuery.isLoading ? (
        <div className="text-center py-6 text-[#7a95b8] text-sm">Loading audit trail...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-[#7a95b8] text-sm">
          <Activity size={28} className="mx-auto mb-2 opacity-30" />
          No audit events yet. Actions will be logged automatically.
        </div>
      ) : (
        <>
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[17px] top-2 bottom-2 w-px bg-[#12233e]" />
            <div className="space-y-0">
              {visible.map((entry) => {
                const meta = ACTION_META[entry.action] ?? DEFAULT_ACTION_META;
                return (
                  <div key={entry.id} className="relative flex gap-4 py-3 group">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex-shrink-0 w-[35px] h-[35px] rounded-full flex items-center justify-center ${meta.color}`}>
                      {meta.icon}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${meta.color.split(" ")[0]}`}>{meta.label}</span>
                        <span className="text-xs text-[#7a95b8]">·</span>
                        <span className="text-xs text-[#7a95b8]">{entry.actorName ?? "System"}</span>
                        <span className="text-xs text-[#3d5a7a] ml-auto">{new Date(entry.createdAt).toLocaleString()}</span>
                      </div>
                      {entry.summary && (
                        <p className="text-xs text-[#7a95b8] mt-1 leading-relaxed">{entry.summary}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {entries.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 w-full text-center text-xs text-[#4f8cff] hover:text-[#6ba3ff] transition-colors py-2"
            >
              {showAll ? "Show less" : `Show all ${entries.length} events`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Client Tag Badges ────────────────────────────────────────────────── */
function ClientTagBadges({ clientId }: { clientId: number }) {
  const tagsQuery = trpc.tags.byClient.useQuery({ clientId }, { staleTime: 30_000 });
  const allTagsQuery = trpc.tags.list.useQuery(undefined, { staleTime: 60_000 });
  const tagIds = tagsQuery.data ?? [];
  const allTags = allTagsQuery.data ?? [];
  const clientTags = allTags.filter((t) => tagIds.includes(t.id));
  if (clientTags.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      <Tag size={11} className="text-[#7a95b8]" />
      {clientTags.map((t) => (
        <span key={t.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${t.color}20`, color: t.color, border: `1px solid ${t.color}40` }}>
          {t.name}
        </span>
      ))}
    </div>
  );
}

/* ─── Document Vault ──────────────────────────────────────────────────────── */
const DOC_CATEGORIES: Record<string, { label: string; color: string }> = {
  TAX_RETURN: { label: "Tax Return", color: "#ef4444" },
  ESTATE_PLAN: { label: "Estate Plan", color: "#a78bfa" },
  INSURANCE_POLICY: { label: "Insurance", color: "#3b82f6" },
  INVESTMENT_STATEMENT: { label: "Investment", color: "#22c55e" },
  TRUST_DOCUMENT: { label: "Trust", color: "#f59e0b" },
  LEGAL_AGREEMENT: { label: "Legal", color: "#ec4899" },
  FINANCIAL_PLAN: { label: "Financial Plan", color: "#06b6d4" },
  OTHER: { label: "Other", color: "#7a95b8" },
};

function ClientDocumentVault({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docsQuery = trpc.docs.list.useQuery({ clientId });
  const uploadMut = trpc.docs.upload.useMutation({
    onSuccess: () => { utils.docs.list.invalidate({ clientId }); toast.success("Document uploaded"); setUploading(false); },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });
  const deleteMut = trpc.docs.delete.useMutation({
    onSuccess: () => { utils.docs.list.invalidate({ clientId }); toast.success("Document deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const name = file.name.toLowerCase();
      let category = "OTHER";
      if (name.includes("tax") || name.includes("1040") || name.includes("w2")) category = "TAX_RETURN";
      else if (name.includes("estate") || name.includes("will")) category = "ESTATE_PLAN";
      else if (name.includes("insurance") || name.includes("policy")) category = "INSURANCE_POLICY";
      else if (name.includes("invest") || name.includes("statement") || name.includes("brokerage")) category = "INVESTMENT_STATEMENT";
      else if (name.includes("trust")) category = "TRUST_DOCUMENT";
      else if (name.includes("legal") || name.includes("agreement") || name.includes("contract")) category = "LEGAL_AGREEMENT";
      else if (name.includes("plan") || name.includes("financial")) category = "FINANCIAL_PLAN";
      uploadMut.mutate({ clientId, name: file.name, fileBase64: base64, mimeType: file.type, sizeBytes: file.size, category: category as any });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const docs = docsQuery.data ?? [];
  const filtered = filterCat === "ALL" ? docs : docs.filter((d) => d.category === filterCat);
  const fmtSize = (b: number | null) => { if (!b) return ""; if (b > 1048576) return `${(b / 1048576).toFixed(1)} MB`; return `${(b / 1024).toFixed(0)} KB`; };

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} className="text-[#22c55e]" />
          <span className="text-white font-semibold">Document Vault</span>
          <span className="text-xs text-[#7a95b8]">({docs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="bg-[#0f1e35] border border-[#12233e] rounded-lg px-2 py-1 text-xs text-[#c8d8ec]">
            <option value="ALL">All Categories</option>
            {Object.entries(DOC_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <label className="rc-btn rc-btn-primary text-sm cursor-pointer">
            <Upload size={14} /> {uploading ? "Uploading..." : "Upload"}
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" />
          </label>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-[#7a95b8] text-sm">{docs.length === 0 ? "No documents yet. Upload tax returns, estate plans, or insurance policies." : "No documents in this category."}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => {
            const cat = DOC_CATEGORIES[doc.category] ?? DOC_CATEGORIES.OTHER;
            return (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0f1e35] border border-[#12233e] hover:border-[#22c55e]/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <File size={16} style={{ color: cat.color }} />
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>{cat.label}</span>
                      {doc.sizeBytes && <span className="text-[10px] text-[#7a95b8]">{fmtSize(doc.sizeBytes)}</span>}
                      <span className="text-[10px] text-[#7a95b8]">{new Date(doc.createdAt).toLocaleDateString()}</span>
                      {doc.uploadedByName && <span className="text-[10px] text-[#7a95b8]">by {doc.uploadedByName}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a href={doc.url} target="_blank" rel="noopener" className="rc-btn rc-btn-ghost text-xs px-2 py-1"><FileDown size={12} /></a>
                  <button onClick={() => { if (confirm("Delete this document?")) deleteMut.mutate({ docId: doc.id, clientId }); }} className="rc-btn rc-btn-ghost text-xs px-2 py-1 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Report Schedule Toggle ───────────────────────────────────────────────── */
function ReportScheduleToggle({ clientId, clientEmail }: { clientId: number; clientEmail?: string | null }) {
  const utils = trpc.useUtils();
  const scheduleQuery = trpc.reports.getSchedule.useQuery({ clientId });
  const setScheduleMut = trpc.reports.setSchedule.useMutation({
    onSuccess: () => { utils.reports.getSchedule.invalidate({ clientId }); toast.success("Report schedule updated"); },
    onError: (e) => toast.error(e.message),
  });
  const schedule = scheduleQuery.data;
  const isActive = schedule?.active ?? false;

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#3b82f6]" />
          <span className="text-white font-semibold">Scheduled Reports</span>
        </div>
        <button
          onClick={() => setScheduleMut.mutate({ clientId, active: !isActive, recipientEmail: clientEmail ?? undefined })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isActive ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30" : "bg-[#0f1e35] text-[#7a95b8] border border-[#12233e]"
          }`}
          disabled={setScheduleMut.isPending}
        >
          {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {isActive ? "Active" : "Disabled"}
        </button>
      </div>
      {isActive && schedule && (
        <div className="mt-3 flex items-center gap-4 text-xs text-[#7a95b8]">
          <span>Frequency: <strong className="text-[#c8d8ec]">{schedule.frequency}</strong></span>
          {schedule.recipientEmail && <span>To: <strong className="text-[#c8d8ec]">{schedule.recipientEmail}</strong></span>}
          {schedule.lastSentAt && <span>Last sent: {new Date(schedule.lastSentAt).toLocaleDateString()}</span>}
          {schedule.nextSendAt && <span>Next: {new Date(schedule.nextSendAt).toLocaleDateString()}</span>}
        </div>
      )}
      {!isActive && (
        <p className="mt-2 text-xs text-[#7a95b8]">Enable to auto-generate and email a PDF performance report monthly{clientEmail ? ` to ${clientEmail}` : ""}.</p>
      )}
    </div>
  );
}

function ClientPortalLinks({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(30);
  const { data: links, isLoading } = trpc.clientPortal.listLinks.useQuery({ clientId });
  const generate = trpc.clientPortal.generateLink.useMutation({
    onSuccess: (result) => {
      utils.clientPortal.listLinks.invalidate({ clientId });
      navigator.clipboard.writeText(result.url).then(() => toast.success("Portal link copied to clipboard!"));
      setLabel("");
    },
    onError: (e) => toast.error(e.message),
  });
  const revoke = trpc.clientPortal.revokeLink.useMutation({
    onSuccess: () => { utils.clientPortal.listLinks.invalidate({ clientId }); toast.success("Link revoked"); },
  });

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-white font-semibold flex items-center gap-2">
          <Users size={16} className="text-cyan-400" /> Client Portal Links
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          className="rc-input flex-1"
          placeholder="Link label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <select
          className="rc-input w-32"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
        <button
          className="rc-btn rc-btn-primary text-sm"
          onClick={() => generate.mutate({ clientId, label: label || undefined, expiresInDays: days })}
          disabled={generate.isPending}
        >
          <Plus size={14} /> {generate.isPending ? "Creating..." : "Generate Link"}
        </button>
      </div>
      {isLoading ? (
        <div className="text-[#7a95b8] text-sm">Loading links...</div>
      ) : !links || links.length === 0 ? (
        <div className="text-center py-4 text-[#7a95b8] text-sm">No portal links yet. Generate one to share with this client.</div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const expired = link.expiresAt && new Date(link.expiresAt) < new Date();
            return (
              <div key={link.id} className={`flex items-center justify-between p-3 rounded-lg ${expired || link.revokedAt ? 'bg-red-500/5 border border-red-500/20' : 'bg-[#0f1e35] border border-[#12233e]'}`}>
                <div>
                  <div className="text-sm text-white">{link.label || "Portal Link"}</div>
                  <div className="text-xs text-[#7a95b8]">
                    Created {new Date(link.createdAt).toLocaleDateString()}
                    {link.expiresAt && ` · Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                    {link.revokedAt && " · Revoked"}
                    {expired && !link.revokedAt && " · Expired"}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!expired && !link.revokedAt && (
                    <button
                      className="rc-btn rc-btn-ghost text-xs"
                      onClick={() => {
                        const url = `${window.location.origin}/client-portal/${link.token}`;
                        navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
                      }}
                    >
                      Copy
                    </button>
                  )}
                  {!link.revokedAt && (
                    <button
                      className="rc-btn rc-btn-ghost text-xs text-red-400"
                      onClick={() => revoke.mutate({ tokenId: link.id })}
                      disabled={revoke.isPending}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AllocationTargetsSection({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const [newAsset, setNewAsset] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newCurrent, setNewCurrent] = useState("");
  const [threshold, setThreshold] = useState(5);

  const { data: targets, isLoading } = trpc.rebalance.getTargets.useQuery({ clientId });
  const { data: driftData } = trpc.rebalance.checkDrift.useQuery({ clientId, threshold });
  const setTargets = trpc.rebalance.setTargets.useMutation({
    onSuccess: () => {
      utils.rebalance.getTargets.invalidate({ clientId });
      utils.rebalance.checkDrift.invalidate({ clientId });
      toast.success("Allocation targets saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (!newAsset.trim() || !newTarget.trim()) return;
    const existing = (targets ?? []).map((t) => ({
      assetClass: t.assetClass,
      targetPct: String(t.targetPct),
      currentPct: String(t.currentPct ?? "0"),
    }));
    existing.push({ assetClass: newAsset.trim(), targetPct: newTarget, currentPct: newCurrent || "0" });
    setTargets.mutate({ clientId, targets: existing });
    setNewAsset(""); setNewTarget(""); setNewCurrent("");
  };

  const handleRemove = (assetClass: string) => {
    const remaining = (targets ?? []).filter((t) => t.assetClass !== assetClass).map((t) => ({
      assetClass: t.assetClass,
      targetPct: String(t.targetPct),
      currentPct: String(t.currentPct ?? "0"),
    }));
    setTargets.mutate({ clientId, targets: remaining });
  };

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-white font-semibold flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-400" /> Allocation Targets & Drift
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
          Threshold:
          <NumberInput value={threshold} onChange={setThreshold} className="rc-input w-16 text-xs" min={0.1} max={100} step={0.5} />
          %
        </div>
      </div>

      {/* Drift alerts */}
      {driftData && driftData.hasDrift && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="text-sm font-medium text-red-400 mb-1">Drift Detected</div>
          {driftData.drifts.map((d: any, i: number) => (
            <div key={i} className="text-xs text-red-300">
              {d.assetClass}: {parseFloat(d.currentPct).toFixed(1)}% vs {parseFloat(d.targetPct).toFixed(1)}% target ({parseFloat(d.driftPct).toFixed(1)}% drift)
            </div>
          ))}
        </div>
      )}

      {/* Targets table */}
      {isLoading ? (
        <div className="text-[#7a95b8] text-sm">Loading targets...</div>
      ) : !targets || targets.length === 0 ? (
        <div className="text-center py-4 text-[#7a95b8] text-sm">No allocation targets set. Add asset classes below.</div>
      ) : (
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#12233e] text-[#7a95b8]">
                <th className="text-left py-2 px-3 font-medium">Asset Class</th>
                <th className="text-left py-2 px-3 font-medium">Target %</th>
                <th className="text-left py-2 px-3 font-medium">Current %</th>
                <th className="text-left py-2 px-3 font-medium">Drift</th>
                <th className="text-right py-2 px-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => {
                const target = parseFloat(String(t.targetPct));
                const current = parseFloat(String(t.currentPct ?? 0));
                const drift = Math.abs(current - target);
                return (
                  <tr key={t.assetClass} className="border-b border-[#12233e]/50 hover:bg-[#0f1e35]/50">
                    <td className="py-2 px-3 text-white font-medium">{t.assetClass}</td>
                    <td className="py-2 px-3">{target.toFixed(1)}%</td>
                    <td className="py-2 px-3">{current.toFixed(1)}%</td>
                    <td className="py-2 px-3">
                      <span className={drift >= threshold ? "text-red-400 font-bold" : drift >= threshold / 2 ? "text-amber-400" : "text-emerald-400"}>
                        {drift.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="text-red-400 hover:text-red-300 text-xs" onClick={() => handleRemove(t.assetClass)}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add new target */}
      <div className="flex gap-2">
        <input className="rc-input flex-1" placeholder="Asset class (e.g. US Equities)" value={newAsset} onChange={(e) => setNewAsset(e.target.value)} />
        <NumberInput value={newTarget} onChange={setNewTarget} className="rc-input w-24" placeholder="Target %" />
        <NumberInput value={newCurrent} onChange={setNewCurrent} className="rc-input w-24" placeholder="Current %" />
        <button className="rc-btn rc-btn-secondary text-sm" onClick={handleAdd} disabled={setTargets.isPending}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const clientQuery = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });
  const strategiesQuery = trpc.strategy.listByClient.useQuery({ clientId }, { enabled: !!clientId });
  const createNoteMut = trpc.notes.create.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate({ clientId });
      toast.success("Activity logged");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.clients.update.useMutation({
    onSuccess: async () => {
      await utils.clients.get.invalidate({ id: clientId });
      await clientQuery.refetch();
      toast.success("Client profile saved and reloaded");
      setEditing(false);
    },
    onError: (e) => toast.error("Client profile was not saved", { description: e.message }),
  });

  const client = clientQuery.data;
  const strategies = strategiesQuery.data ?? [];

  if (!Number.isInteger(clientId) || clientId <= 0) return <AppShell><div className="p-8 text-red-300">Invalid client identifier.</div></AppShell>;
  if (clientQuery.isLoading) return <AppShell><div className="flex min-h-[420px] items-center justify-center gap-3 p-8 text-violet-200"><RefreshCw className="h-5 w-5 animate-spin" /> Loading saved client profile…</div></AppShell>;
  if (clientQuery.isError) return <AppShell><div className="mx-auto mt-8 max-w-xl rounded-2xl border border-red-400/25 bg-red-950/35 p-6 text-red-100"><p className="font-semibold">Client profile could not be loaded.</p><p className="mt-2 text-sm text-red-200/75">{clientQuery.error.message}</p><button onClick={() => clientQuery.refetch()} className="rc-btn rc-btn-ghost mt-4"><RefreshCw size={14} /> Retry</button></div></AppShell>;
  if (!client) return <AppShell><div className="p-8 text-[#7a95b8]">Client not found in this workspace.</div></AppShell>;

  const fmt = (n: number | null | undefined) =>
    !n ? "—" : n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(Number(n) / 1_000).toFixed(0)}K` : `$${n}`;

  const assetData = [
    { name: "IRA", value: Number(client.iraBalance ?? 0) },
    { name: "Roth", value: Number(client.rothBalance ?? 0) },
    { name: "Taxable", value: Number(client.taxableAssets ?? 0) },
    { name: "Real Estate", value: Number(client.realEstateEquity ?? 0) },
    { name: "Life Ins CV", value: Number(client.lifeInsuranceCv ?? 0) },
  ].filter((d) => d.value > 0);

  const totalAssets = assetData.reduce((s, d) => s + d.value, 0);
  const score = client.opportunityScore ?? 0;

  const startEdit = () => {
    setForm({
      age: String(client.age ?? ""),
      income: String(client.income ?? ""),
      iraBalance: String(client.iraBalance ?? ""),
      rothBalance: String(client.rothBalance ?? ""),
      taxableAssets: String(client.taxableAssets ?? ""),
      realEstateEquity: String(client.realEstateEquity ?? ""),
      lifeInsuranceCv: String(client.lifeInsuranceCv ?? ""),
      notes: client.notes ?? "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    const numericFields = ["income", "iraBalance", "rothBalance", "taxableAssets", "realEstateEquity", "lifeInsuranceCv"];
    if (form.age && (Number(form.age) < 0 || Number(form.age) > 120 || !Number.isFinite(Number(form.age)))) {
      toast.error("Enter a valid age between 0 and 120");
      return;
    }
    if (numericFields.some(field => form[field] && (!Number.isFinite(Number(form[field])) || Number(form[field]) < 0))) {
      toast.error("Financial values must be valid non-negative numbers");
      return;
    }
    updateMut.mutate({
      id: clientId,
      data: {
        age: form.age ? Number(form.age) : undefined,
        income: form.income ? Number(form.income) : undefined,
        iraBalance: form.iraBalance ? Number(form.iraBalance) : undefined,
        rothBalance: form.rothBalance ? Number(form.rothBalance) : undefined,
        taxableAssets: form.taxableAssets ? Number(form.taxableAssets) : undefined,
        realEstateEquity: form.realEstateEquity ? Number(form.realEstateEquity) : undefined,
        lifeInsuranceCv: form.lifeInsuranceCv ? Number(form.lifeInsuranceCv) : undefined,
        notes: form.notes || undefined,
      },
    });
  };

  const handleEmailClick = () => {
    if (!client.email) return;
    createNoteMut.mutate({
      clientId,
      noteType: "EMAIL",
      content: `Emailed ${client.name} at ${client.email}`,
    });
  };

  const handlePhoneClick = () => {
    if (!client.phone) return;
    createNoteMut.mutate({
      clientId,
      noteType: "CALL",
      content: `Called ${client.name} at ${client.phone}`,
    });
  };

  return (
    <AppShell>
      <div className="rc-page-header">
        <Link href="/portal/clients" className="inline-flex items-center gap-2 text-sm text-[#7a95b8] hover:text-white mb-3 transition-colors">
          <ArrowLeft size={14} /> All Clients
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className={`rc-score-ring ${score >= 70 ? "rc-score-high" : score >= 40 ? "rc-score-med" : "rc-score-low"}`}>
              {score}
            </div>
            <div>
              <h1 className="rc-page-title">{client.name}</h1>
              {/* Contact quick-actions */}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {client.email ? (
                  <a
                    href={`mailto:${client.email}`}
                    onClick={handleEmailClick}
                    className="flex items-center gap-1.5 text-xs text-[#a78bfa] hover:text-white transition-colors"
                    title={`Email ${client.name}`}
                  >
                    <Mail size={12} />
                    {client.email}
                  </a>
                ) : (
                  <span className="text-xs text-[#7a95b8]">No email on file</span>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    onClick={handlePhoneClick}
                    className="flex items-center gap-1.5 text-xs text-[#22c55e] hover:text-white transition-colors"
                    title={`Call ${client.name}`}
                  >
                    <Phone size={12} />
                    {client.phone}
                  </a>
                )}
                <span className="text-xs text-[#7a95b8]">{fmt(totalAssets)} total assets</span>
              </div>
              <ClientTagBadges clientId={clientId} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Inline quick-action buttons for advisors who prefer buttons over links */}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                onClick={handleEmailClick}
                className="rc-btn rc-btn-ghost text-sm"
                title="Send email and log activity"
              >
                <Mail size={14} /> Email
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                onClick={handlePhoneClick}
                className="rc-btn rc-btn-ghost text-sm"
                title="Call and log activity"
              >
                <Phone size={14} /> Call
              </a>
            )}
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="rc-btn rc-btn-ghost text-sm"><X size={14} /> Cancel</button>
                <button onClick={saveEdit} disabled={updateMut.isPending} className="rc-btn rc-btn-primary text-sm">
                  <Save size={14} /> {updateMut.isPending ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit} className="rc-btn rc-btn-secondary text-sm"><Edit2 size={14} /> Edit</button>
                <a
                  href={`/api/report/${clientId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rc-btn rc-btn-secondary text-sm"
                  title="Download branded PDF report"
                >
                  <FileDown size={14} /> Generate Report
                </a>
                <ExportToSlides
                  toolName={`${client.name} Profile`}
                  getSections={() => [
                    {
                      title: "Client Overview",
                      items: [
                        { label: "Age", value: client.age ? String(client.age) : "—" },
                        { label: "Income", value: client.income ? `$${client.income.toLocaleString()}` : "—" },
                        { label: "Opportunity Score", value: client.opportunityScore ? String(client.opportunityScore) : "—" },
                        { label: "Total Assets", value: totalAssets ? `$${totalAssets.toLocaleString()}` : "—" }
                      ]
                    },
                    {
                      title: "Assets Breakdown",
                      items: assetData.map((a) => ({ label: a.name, value: `$${a.value.toLocaleString()}` }))
                    }
                  ]}
                />
                <Link href={`/portal/strategy?clientId=${clientId}`} className="rc-btn rc-btn-primary text-sm">
                  <Brain size={14} /> Run Strategy
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-6">
        {/* ─── Four Metric Cards (Capital Engine style) ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const nw = totalAssets;
            const projectedNw = nw * 1.08 * (client.age ? Math.max(1, (90 - client.age) / 10) : 3);
            const mortgageDebt = nw * 0.15;
            const mortgagePayoffYear = new Date().getFullYear() + Math.min(15, Math.max(3, Math.round(mortgageDebt / (nw * 0.03 || 1))));
            const incomeEng = Number(client.income ?? 0) * 1.1;
            const rothVal = Number(client.rothBalance ?? 0);
            const iraVal = Number(client.iraBalance ?? 0);
            const lifeVal = Number(client.lifeInsuranceCv ?? 0);

            const fmtBig = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

            const miniSvg = (pts: number[], color: string, h = 28) => {
              if (pts.length < 2) return null;
              const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1;
              const d = pts.map((v, i) => `${(i / (pts.length - 1)) * 80},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(" ");
              return (
                <svg viewBox={`0 0 80 ${h}`} className="w-full mt-2" style={{ height: h }} preserveAspectRatio="none">
                  <polyline fill="none" stroke={color} strokeWidth="2" points={d} />
                </svg>
              );
            };

            const cards = [
              {
                label: "Net Worth Projection",
                value: fmtBig(projectedNw),
                sub: `by ${new Date().getFullYear() + 25}`,
                color: "#22c55e",
                spark: [nw * 0.6, nw * 0.7, nw * 0.8, nw * 0.9, nw, nw * 1.05, projectedNw * 0.5, projectedNw * 0.7, projectedNw],
              },
              {
                label: "Debt Destruction",
                value: fmtBig(mortgageDebt),
                sub: `Paid Off by ${mortgagePayoffYear}`,
                color: "#3b82f6",
                spark: [mortgageDebt, mortgageDebt * 0.9, mortgageDebt * 0.75, mortgageDebt * 0.55, mortgageDebt * 0.3, mortgageDebt * 0.1, 0],
              },
              {
                label: "Income Engine",
                value: fmtBig(incomeEng),
                sub: "Tax Free Income in 5 Years",
                color: "#f97316",
                spark: [incomeEng * 0.5, incomeEng * 0.6, incomeEng * 0.7, incomeEng * 0.8, incomeEng * 0.9, incomeEng],
              },
              {
                label: "Policy Values",
                value: fmtBig(lifeVal || rothVal + iraVal),
                sub: lifeVal ? "Cash Value" : "Roth + IRA",
                color: "#a78bfa",
                spark: [(lifeVal || rothVal + iraVal) * 0.4, (lifeVal || rothVal + iraVal) * 0.55, (lifeVal || rothVal + iraVal) * 0.7, (lifeVal || rothVal + iraVal) * 0.85, lifeVal || rothVal + iraVal],
              },
            ];

            return cards.map((c) => (
              <div key={c.label} className="rc-card relative overflow-hidden" style={{ borderTop: `3px solid ${c.color}` }}>
                <div className="text-xs text-[#7a95b8] font-semibold uppercase tracking-wider">{c.label}</div>
                <div className="text-2xl font-extrabold text-white mt-1" style={{ fontFamily: "DM Sans, sans-serif" }}>{c.value}</div>
                <div className="text-xs mt-0.5" style={{ color: c.color }}>{c.sub}</div>
                {miniSvg(c.spark, c.color)}
              </div>
            ));
          })()}
        </div>

        {/* Profile + assets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile card */}
          <div className="rc-card">
            <div className="text-white font-semibold mb-4">Profile</div>
            {editing ? (
              <div className="space-y-3">
                {[
                  { key: "age", label: "Age", type: "number" },
                  { key: "income", label: "Annual Income ($)", type: "number" },
                  { key: "notes", label: "Notes", type: "text" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="rc-label">{f.label}</label>
                    {f.key === "notes" ? (
                      <textarea className="rc-input" rows={3} value={form[f.key] ?? ""} onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    ) : (
                      <input className="rc-input" type={f.type} value={form[f.key] ?? ""} onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  { label: "Age", value: client.age ? `${client.age} yrs` : "—" },
                  { label: "Income", value: fmt(Number(client.income ?? 0)) },
                  { label: "Filing Status", value: client.filingStatus ?? "—" },
                  { label: "State", value: client.state ?? "—" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-[#7a95b8]">{r.label}</span>
                    <span className="text-white font-medium">{r.value}</span>
                  </div>
                ))}
                {client.notes && (
                  <div className="pt-2 border-t border-[#12233e]">
                    <div className="text-[#7a95b8] text-xs mb-1">Notes</div>
                    <p className="text-[#c8d8ec] text-xs leading-relaxed">{client.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assets card */}
          <div className="rc-card">
            <div className="text-white font-semibold mb-4">Asset Breakdown</div>
            {editing ? (
              <div className="space-y-3">
                {[
                  { key: "iraBalance", label: "IRA Balance ($)" },
                  { key: "rothBalance", label: "Roth Balance ($)" },
                  { key: "taxableAssets", label: "Taxable Assets ($)" },
                  { key: "realEstateEquity", label: "Real Estate Equity ($)" },
                  { key: "lifeInsuranceCv", label: "Life Insurance CV ($)" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="rc-label">{f.label}</label>
                    <NumberInput value={form[f.key] ?? 0} onChange={(v) => setForm(p => ({ ...p, [f.key]: v }))} className="rc-input" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  { label: "IRA Balance", value: fmt(Number(client.iraBalance ?? 0)) },
                  { label: "Roth Balance", value: fmt(Number(client.rothBalance ?? 0)) },
                  { label: "Taxable Assets", value: fmt(Number(client.taxableAssets ?? 0)) },
                  { label: "Real Estate Equity", value: fmt(Number(client.realEstateEquity ?? 0)) },
                  { label: "Life Insurance CV", value: fmt(Number(client.lifeInsuranceCv ?? 0)) },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-[#7a95b8]">{r.label}</span>
                    <span className="text-white font-medium">{r.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#12233e] flex justify-between font-bold">
                  <span className="text-[#7a95b8]">Total Assets</span>
                  <span className="text-[#22c55e]">{fmt(totalAssets)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Asset bar chart */}
          <div className="rc-card">
            <div className="text-white font-semibold mb-4">Asset Chart</div>
            {assetData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={assetData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Value"]} contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-[#7a95b8] text-sm">No asset data</div>
            )}
          </div>
        </div>

        {/* ─── Properties / Mortgage Section ─────────────────────────── */}
        <ClientPropertiesSection clientId={clientId} />

        {/* ─── Crypto Holdings Section ────────────────────────────────── */}
        <ClientCryptoSection clientId={clientId} />

        {/* ─── Net Worth History ─────────────────────────────────── */}
        <NetWorthHistoryChart client={client} />

        {/* ─── Risk Assessment Card ─────────────────────────────────── */}
        <ClientRiskCard clientId={clientId} />

        {/* Activity Feed / Client Notes */}
        <ClientNotesSection clientId={clientId} clientName={client.name} />

        {/* Compliance Audit Trail */}
        <ClientAuditTimeline clientId={clientId} />

        {/* Document Vault */}
        <ClientDocumentVault clientId={clientId} />

        {/* Report Schedule */}
        <ReportScheduleToggle clientId={clientId} clientEmail={client.email} />

        {/* Client Portal Link */}
        <ClientPortalLinks clientId={clientId} />

        {/* Allocation Targets & Drift */}
        <AllocationTargetsSection clientId={clientId} />

        {/* Strategy history */}
        <div className="rc-card">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-semibold">Strategy History</div>
            <Link href={`/portal/strategy?clientId=${clientId}`} className="rc-btn rc-btn-secondary text-sm">
              <Brain size={14} /> New Strategy
            </Link>
          </div>
          {strategies.length === 0 ? (
            <div className="text-center py-8 text-[#7a95b8] text-sm">No strategies yet. Run the first strategy for this client.</div>
          ) : (
            <div className="space-y-3">
              {strategies.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-[#0f1e35] border border-[#12233e]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-medium text-sm">{s.summary ? s.summary.slice(0, 40) + "..." : "Strategy"}</div>
                    <div className="text-xs text-[#7a95b8]">{new Date(s.createdAt).toLocaleDateString()}</div>
                  </div>
                  {s.summary && <p className="text-xs text-[#c8d8ec] leading-relaxed">{s.summary}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <PageInsights pageId="client-detail" />
    </AppShell>
  );
}
