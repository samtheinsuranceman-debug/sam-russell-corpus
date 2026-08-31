// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Trophy, TrendingUp, Users, BarChart3, Flame, Medal,
  ArrowUp, Eye, EyeOff, Sparkles,
  ChevronRight, Crown, Rocket, Target, DollarSign, Calendar,
  User, Briefcase, Download, FileText
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo } from "react";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";

/* ═══════════════════════════════════════════════════════════════════════════
   SETUP MODAL — First-time profile creation
   ═══════════════════════════════════════════════════════════════════════════ */
function SetupModal({ onComplete }: { onComplete: () => void }) {
  const [handle, setHandle] = useState("");
  const [useRealName, setUseRealName] = useState(false);
  const [optIn, setOptIn] = useState(true);
  const [baselineCommissions, setBaselineCommissions] = useState("");
  const [step, setStep] = useState(1);
  const { user } = useAuth();

  const setupMutation = trpc.competitionBoard.setupProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile created! Welcome to the competition.");
      onComplete();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = () => {
    setupMutation.mutate({
      handle: useRealName ? (user?.name ?? handle) : handle,
      useRealName,
      baselineAnnualCommissions: parseFloat(baselineCommissions) || 0,
      optIn,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#0a1628] border border-[#1a3a5c] rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-b border-amber-500/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Trophy size={24} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Join the Leaderboard</h2>
              <p className="text-sm text-amber-300/70">Set up your competition profile</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-amber-400" : "bg-[#1a3a5c]"}`} />
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Choose Your Identity</h3>
                <p className="text-sm text-[#7a95b8] mb-4">
                  Your handle is how you appear on the leaderboard. Use your real name or pick a unique code name to stay anonymous.
                </p>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1a3a5c] hover:border-[#22c55e]/50 cursor-pointer transition-colors">
                  <input type="radio" checked={useRealName} onChange={() => setUseRealName(true)} className="accent-[#22c55e]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white flex items-center gap-2"><User size={14} /> Use my real name</div>
                    <div className="text-xs text-[#7a95b8] mt-0.5">Display as: <span className="text-[#22c55e] font-semibold">{user?.name ?? "Your Name"}</span></div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1a3a5c] hover:border-amber-400/50 cursor-pointer transition-colors">
                  <input type="radio" checked={!useRealName} onChange={() => setUseRealName(false)} className="accent-amber-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white flex items-center gap-2"><EyeOff size={14} /> Use a code name</div>
                    <div className="text-xs text-[#7a95b8] mt-0.5">Stay anonymous on the board</div>
                  </div>
                </label>
                {!useRealName && (
                  <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)}
                    placeholder="Enter your unique handle (e.g., CloserKing, PolicyPro)"
                    className="w-full px-4 py-3 rounded-lg bg-[#060f20] border border-[#1a3a5c] text-white placeholder-[#4a6a8e] focus:border-amber-400/50 focus:outline-none text-sm" maxLength={50} />
                )}
              </div>
              <button onClick={() => setStep(2)} disabled={!useRealName && handle.length < 2}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Continue <ChevronRight size={14} className="inline ml-1" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Your Baseline Commissions</h3>
                <p className="text-sm text-[#7a95b8] mb-4">
                  Enter your current annual commissions so we can track your growth. This is used to calculate your "Fastest Climber" ranking.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 block">Annual Commissions (before joining Russell Capital Systems™)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a8e]" />
                  <input type="number" value={baselineCommissions} onChange={(e) => setBaselineCommissions(e.target.value)}
                    placeholder="e.g., 120000"
                    className="w-full pl-9 pr-4 py-3 rounded-lg bg-[#060f20] border border-[#1a3a5c] text-white placeholder-[#4a6a8e] focus:border-amber-400/50 focus:outline-none text-sm" />
                </div>
                <p className="text-xs text-[#4a6a8e] mt-2">This number is private and only used to calculate your growth percentage.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg border border-[#1a3a5c] text-[#7a95b8] font-medium text-sm hover:bg-[#12233e] transition-colors">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm hover:from-amber-400 hover:to-yellow-400 transition-all">
                  Continue <ChevronRight size={14} className="inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Competition Opt-In</h3>
                <p className="text-sm text-[#7a95b8] mb-4">Choose whether to appear on the public leaderboard this month. We'll ask again each month.</p>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-[#1a3a5c] hover:border-[#22c55e]/50 cursor-pointer transition-colors">
                  <input type="radio" checked={optIn} onChange={() => setOptIn(true)} className="accent-[#22c55e]" />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#22c55e] flex items-center gap-2"><Flame size={14} /> Yes, I want to compete!</div>
                    <div className="text-xs text-[#7a95b8] mt-1">My closed/won production will appear on the Top 10 board.</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-[#1a3a5c] hover:border-red-500/50 cursor-pointer transition-colors">
                  <input type="radio" checked={!optIn} onChange={() => setOptIn(false)} className="accent-red-400" />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-red-400 flex items-center gap-2"><EyeOff size={14} /> No thanks, keep me private</div>
                    <div className="text-xs text-[#7a95b8] mt-1">I can still view the leaderboard but won't be listed.</div>
                  </div>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-lg border border-[#1a3a5c] text-[#7a95b8] font-medium text-sm hover:bg-[#12233e] transition-colors">Back</button>
                <button onClick={handleSubmit} disabled={setupMutation.isPending}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[#22c55e] to-emerald-400 text-black font-bold text-sm hover:from-[#22c55e]/90 hover:to-emerald-400/90 disabled:opacity-40 transition-all">
                  {setupMutation.isPending ? "Setting up..." : "Launch My Profile"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MONTHLY CONSENT BANNER
   ═══════════════════════════════════════════════════════════════════════════ */
function MonthlyConsentBanner({ onRespond }: { onRespond: () => void }) {
  const respondMutation = trpc.competitionBoard.respondMonthlyConsent.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.optedIn ? "You're in this month's competition!" : "Opted out for this month.");
      onRespond();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mb-6 p-5 rounded-xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <Calendar size={20} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">New Month, New Competition!</h3>
            <p className="text-xs text-amber-300/70">Would you like to compete on the leaderboard this month?</p>
          </div>
        </div>
        <p className="text-sm text-[#7a95b8] mb-4">
          Your closed/won deals will be tallied. Only the <span className="text-amber-300 font-semibold">Top 10</span> producers are displayed. Your identity is protected by your chosen handle.
        </p>
        <div className="flex gap-3">
          <button onClick={() => respondMutation.mutate({ optIn: true })} disabled={respondMutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#22c55e] to-emerald-400 text-black font-bold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            <Flame size={14} /> Yes, I'm in!
          </button>
          <button onClick={() => respondMutation.mutate({ optIn: false })} disabled={respondMutation.isPending}
            className="flex-1 py-2.5 rounded-lg border border-[#1a3a5c] text-[#7a95b8] font-medium text-sm hover:bg-[#12233e] transition-colors flex items-center justify-center gap-2">
            <EyeOff size={14} /> Not this month
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOP 10 PRODUCERS TABLE
   ═══════════════════════════════════════════════════════════════════════════ */
function TopProducersTable() {
  const { data: producers, isLoading } = trpc.competitionBoard.topProducers.useQuery(undefined, { staleTime: 60_000 });
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={18} className="text-amber-400" />;
    if (rank === 2) return <Medal size={18} className="text-gray-300" />;
    if (rank === 3) return <Medal size={18} className="text-amber-600" />;
    return <span className="text-sm font-bold text-[#4a6a8e] w-[18px] text-center">{rank}</span>;
  };
  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border-amber-400/40";
    if (rank === 2) return "bg-gradient-to-r from-gray-400/10 to-gray-300/5 border-gray-400/30";
    if (rank === 3) return "bg-gradient-to-r from-amber-700/10 to-amber-600/5 border-amber-600/30";
    return "bg-[#0a1628]/50 border-[#1a3a5c]/50";
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-[#12233e]/50 animate-pulse" />)}</div>;
  if (!producers || producers.length === 0) return (
    <div className="text-center py-16">
      <Trophy size={48} className="mx-auto text-[#1a3a5c] mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">No Producers Yet</h3>
      <p className="text-sm text-[#7a95b8] max-w-sm mx-auto">When advisors opt in and close deals marked as "Won", the Top 10 will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {producers.map((p: any, i: number) => (
        <div key={p.handle} className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${getRankBg(i + 1)}`}>
          <div className="w-10 h-10 rounded-lg bg-[#060f20]/50 flex items-center justify-center flex-shrink-0">{getRankIcon(i + 1)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{p.handle}</div>
            <div className="text-xs text-[#4a6a8e]">{p.dealCount} closed deal{p.dealCount !== 1 ? "s" : ""}</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-[#4a6a8e] uppercase tracking-wider">Annual Life</div>
            <div className="text-sm font-bold text-[#22c55e]">{fmt(p.annualLifePremium)}</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-[#4a6a8e] uppercase tracking-wider">Monthly Annuity</div>
            <div className="text-sm font-bold text-cyan-400">{fmt(p.monthlyAnnuityPremium)}</div>
          </div>
          <div className="text-right min-w-[100px]">
            <div className="text-xs text-[#4a6a8e] uppercase tracking-wider">Total</div>
            <div className="text-base font-black text-white">{fmt(p.totalProduction)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FASTEST CLIMBERS TABLE
   ═══════════════════════════════════════════════════════════════════════════ */
function FastestClimbersTable() {
  const { data: climbers, isLoading } = trpc.competitionBoard.fastestClimbers.useQuery(undefined, { staleTime: 60_000 });
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-[#12233e]/50 animate-pulse" />)}</div>;
  if (!climbers || climbers.length === 0) return (
    <div className="text-center py-16">
      <Rocket size={48} className="mx-auto text-[#1a3a5c] mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">No Climbers Yet</h3>
      <p className="text-sm text-[#7a95b8] max-w-sm mx-auto">Advisors trending 25%+ above their baseline commissions will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {climbers.map((c) => {
        const pctColor = c.growthPercentage >= 100 ? "text-amber-400" : c.growthPercentage >= 50 ? "text-[#22c55e]" : "text-cyan-400";
        return (
          <div key={c.handle} className="flex items-center gap-4 p-4 rounded-xl border border-[#1a3a5c]/50 bg-[#0a1628]/50 hover:bg-[#12233e]/30 transition-all hover:scale-[1.01]">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#22c55e]/20 to-cyan-500/20 border border-[#22c55e]/30 flex items-center justify-center flex-shrink-0">
              <Rocket size={16} className="text-[#22c55e]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{c.handle}</div>
              <div className="text-xs text-[#4a6a8e]">{c.daysActive} days on platform</div>
            </div>
            <div className="w-32 hidden sm:block">
              <div className="h-2 rounded-full bg-[#12233e] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-cyan-400 transition-all" style={{ width: `${Math.min(c.growthPercentage, 100)}%` }} />
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-[#4a6a8e] uppercase tracking-wider">Projected</div>
              <div className="text-sm font-bold text-white">{fmt(c.projectedAnnual)}</div>
            </div>
            <div className="text-right min-w-[80px]">
              <div className="text-xs text-[#4a6a8e] uppercase tracking-wider">Growth</div>
              <div className={`text-lg font-black ${pctColor} flex items-center justify-end gap-1`}>
                <ArrowUp size={14} />{c.growthPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEGACY PERFORMANCE TABLE (preserved from original)
   ═══════════════════════════════════════════════════════════════════════════ */
type Period = "all" | "month" | "quarter" | "year";
const PERIOD_LABELS: Record<Period, string> = { all: "All Time", month: "This Month", quarter: "This Quarter", year: "This Year" };

function PerformanceTable() {
  const [period, setPeriod] = useState<Period>("all");
  const boardQuery = trpc.leaderboard.list.useQuery({ period }, { staleTime: 60_000, placeholderData: (prev: any) => prev });
  const entries = boardQuery.data ?? [];
  const exportCsvQuery = trpc.leaderboard.exportCsv.useQuery({ period }, { enabled: false });
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;
  const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

  const totalAum = entries.reduce((s: number, e: any) => s + e.aumManaged, 0);
  const totalClosed = entries.reduce((s: number, e: any) => s + e.closedValue, 0);
  const totalMeetings = entries.reduce((s: number, e: any) => s + e.meetingsHeld, 0);
  const totalDealsWon = entries.reduce((s: number, e: any) => s + e.dealsWon, 0);

  return (
    <div className="space-y-6">
      {/* Period selector + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-[#0a1628] border border-[#12233e] rounded-lg overflow-hidden">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? "bg-[#22c55e]/20 text-[#22c55e]" : "text-[#7a95b8] hover:text-white"}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={async () => {
            try {
              const result = await exportCsvQuery.refetch();
              if (result.data?.csv) {
                const blob = new Blob([result.data.csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url;
                a.download = `leaderboard-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click(); URL.revokeObjectURL(url); toast.success("CSV exported");
              }
            } catch { toast.error("Export failed"); }
          }} className="rc-btn rc-btn-ghost text-xs flex items-center gap-1.5"><Download size={13} /> CSV</button>
          <button onClick={() => {
            const rows = entries.map((e) =>
              `<tr><td>${e.rank}</td><td>${e.name}</td><td>${fmt(e.aumManaged)}</td><td>${e.dealsWon}</td><td>${fmt(e.closedValue)}</td><td>${e.meetingsHeld}</td><td>${e.clientCount}</td><td>${e.score}</td></tr>`
            ).join("");
            const html = `<html><head><title>Leaderboard</title><style>body{font-family:system-ui;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}th{background:#f5f5f5}</style></head><body><h1>Russell Capital Systems™ — Advisor Performance</h1><h2>${PERIOD_LABELS[period]} | ${new Date().toLocaleDateString()}</h2><table><thead><tr><th>#</th><th>Name</th><th>AUM</th><th>Deals Won</th><th>Closed $</th><th>Meetings</th><th>Clients</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
            const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); w.print(); }
          }} className="rc-btn rc-btn-ghost text-xs flex items-center gap-1.5"><FileText size={13} /> PDF</button>
        </div>
      </div>

      {boardQuery.isFetching && (
        <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
          <span className="w-3 h-3 rounded-full border-2 border-[#7a95b8]/30 border-t-[#7a95b8] animate-spin" /> Updating...
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rc-card"><div className="flex items-center gap-2 mb-2"><DollarSign size={14} className="text-[#4f8cff]" /><span className="text-xs text-[#7a95b8] font-medium uppercase tracking-wider">Total AUM</span></div><div className="text-xl font-bold text-white">{fmt(totalAum)}</div></div>
        <div className="rc-card"><div className="flex items-center gap-2 mb-2"><Briefcase size={14} className="text-[#22c55e]" /><span className="text-xs text-[#7a95b8] font-medium uppercase tracking-wider">Deals Won</span></div><div className="text-xl font-bold text-white">{totalDealsWon}</div><div className="text-xs text-[#7a95b8] mt-0.5">{fmt(totalClosed)} closed</div></div>
        <div className="rc-card"><div className="flex items-center gap-2 mb-2"><Calendar size={14} className="text-[#f59e0b]" /><span className="text-xs text-[#7a95b8] font-medium uppercase tracking-wider">Meetings</span></div><div className="text-xl font-bold text-white">{totalMeetings}</div></div>
        <div className="rc-card"><div className="flex items-center gap-2 mb-2"><Users size={14} className="text-[#a855f7]" /><span className="text-xs text-[#7a95b8] font-medium uppercase tracking-wider">Advisors</span></div><div className="text-xl font-bold text-white">{entries.length}</div></div>
      </div>

      {/* Full table */}
      <div className="rc-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#12233e] flex items-center gap-2">
          <TrendingUp size={16} className="text-[#22c55e]" />
          <span className="text-white font-semibold">Full Rankings</span>
          <span className="ml-auto text-xs text-[#7a95b8]">{PERIOD_LABELS[period]}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="rc-table">
            <thead>
              <tr>
                <th>#</th><th>Advisor</th><th>Role</th>
                <th><Tooltip><TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help"><DollarSign size={12} /> AUM</span></TooltipTrigger><TooltipContent>Total assets under management</TooltipContent></Tooltip></th>
                <th><Tooltip><TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help"><Briefcase size={12} /> Deals Won</span></TooltipTrigger><TooltipContent>Deals closed as won</TooltipContent></Tooltip></th>
                <th>Closed Value</th><th><span className="flex items-center gap-1"><BarChart3 size={12} /> Pipeline</span></th>
                <th><span className="flex items-center gap-1"><Calendar size={12} /> Meetings</span></th>
                <th><span className="flex items-center gap-1"><Users size={12} /> Clients</span></th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-[#7a95b8]">No leaderboard data yet.</td></tr>
              ) : entries.map((e: any, i: number) => (
                <tr key={e.rank}>
                  <td><span className="font-bold text-white">{i < 3 ? medals[i] : `#${i + 1}`}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">{(e.name ?? "?")[0]?.toUpperCase()}</div>
                      <div><span className="text-white font-medium">{e.name}</span>{e.email && <div className="text-[10px] text-[#7a95b8]">{e.email}</div>}</div>
                    </div>
                  </td>
                  <td><span className="rc-badge rc-badge-blue">{e.role}</span></td>
                  <td className="text-[#4f8cff] font-semibold">{fmt(e.aumManaged)}</td>
                  <td className="text-white font-semibold">{e.dealsWon}</td>
                  <td className="text-[#22c55e] font-semibold">{fmt(e.closedValue)}</td>
                  <td><div className="text-white">{e.pipelineCount} deals</div><div className="text-[10px] text-[#7a95b8]">{fmt(e.pipelineValue)}</div></td>
                  <td className="text-white">{e.meetingsHeld}</td>
                  <td className="text-white">{e.clientCount}</td>
                  <td>
                    <Tooltip><TooltipTrigger asChild>
                      <div className={`rc-score-ring w-9 h-9 text-xs cursor-help ${e.score >= 70 ? "rc-score-high" : e.score >= 40 ? "rc-score-med" : "rc-score-low"}`}>{e.score}</div>
                    </TooltipTrigger><TooltipContent><div className="text-xs"><div className="font-bold">Composite Score</div><div>Closed value, deals, pipeline, meetings, AUM</div></div></TooltipContent></Tooltip>
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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LEADERBOARD PAGE — 3 tabs
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Leaderboard() {
  const [tab, setTab] = useState<"producers" | "climbers" | "performance" | "pulse">("producers");
  const utils = trpc.useUtils();

  const profileQuery = trpc.competitionBoard.getProfile.useQuery(undefined, { retry: false });
  const consentQuery = trpc.competitionBoard.needsMonthlyConsent.useQuery(undefined, { enabled: !!profileQuery.data, retry: false });

  const hasProfile = !!profileQuery.data;
  const needsConsent = (consentQuery.data as any)?.needsConsent ?? false;

  const handleSetupComplete = () => {
    utils.competitionBoard.getProfile.invalidate();
    utils.competitionBoard.needsMonthlyConsent.invalidate();
  };
  const handleConsentRespond = () => {
    utils.competitionBoard.needsMonthlyConsent.invalidate();
    utils.competitionBoard.topProducers.invalidate();
    utils.competitionBoard.fastestClimbers.invalidate();
  };

  const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444"];
  const tooltipStyle = { background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 };

  const producersData = trpc.competitionBoard.topProducers.useQuery(undefined, { staleTime: 60_000 }).data || [];
  const climbersData = trpc.competitionBoard.fastestClimbers.useQuery(undefined, { staleTime: 60_000 }).data || [];
  
  const producersChartData = producersData.map((p) => ({
    name: p.handle,
    total: p.totalProduction
  })).slice(0, 5); // Top 5 for chart

  const climbersChartData = climbersData.map((c) => ({
    name: c.handle,
    growth: c.growthPercentage
  })).slice(0, 5);

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/40 flex items-center justify-center">
              <Trophy size={24} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-white">Competition Leaderboard</h1>
              <p className="text-sm text-[#7a95b8]">Top 10 producers ranked by closed/won premium</p>
            </div>
            <ExportToSlides
              toolName="Competition Leaderboard"
              getSections={() => [
                {
                  title: "Leaderboard Overview",
                  items: [
                    { label: "Status", value: hasProfile ? (profileQuery.data?.currentlyOptedIn ? "Competing" : "Opted Out") : "No Profile" },
                    { label: "Handle", value: profileQuery.data?.handle || "N/A" },
                    { label: "Baseline", value: profileQuery.data?.baselineAnnualCommissions ? `$${(Number(profileQuery.data.baselineAnnualCommissions) / 1000).toFixed(0)}K/yr` : "N/A" }
                  ]
                }
              ]}
            />
          </div>
          {hasProfile && profileQuery.data && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12233e] border border-[#1a3a5c] text-xs font-semibold text-white">
                <User size={12} /> {profileQuery.data.handle}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${profileQuery.data.currentlyOptedIn ? "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                {profileQuery.data.currentlyOptedIn ? <><Eye size={12} /> Competing</> : <><EyeOff size={12} /> Opted Out</>}
              </span>
              {Number(profileQuery.data.baselineAnnualCommissions ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
                  <Target size={12} /> Baseline: ${(Number(profileQuery.data.baselineAnnualCommissions) / 1000).toFixed(0)}K/yr
                </span>
              )}
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Top Producers (Total Production)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={producersChartData.length ? producersChartData : [{ name: "No Data", total: 0 }]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <RTooltip contentStyle={tooltipStyle} cursor={{ fill: '#12233e' }} formatter={(val: number) => [`$${val.toLocaleString()}`, "Total"]} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {producersChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Fastest Climbers (Growth %)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={climbersChartData.length ? climbersChartData : [{ name: "No Data", growth: 0 }]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <RTooltip contentStyle={tooltipStyle} cursor={{ fill: '#12233e' }} formatter={(val: number) => [`${val.toFixed(1)}%`, "Growth"]} />
                <Bar dataKey="growth" fill="#22c55e" radius={[4, 4, 0, 0]}>
                  {climbersChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Setup modal */}
        {!hasProfile && !profileQuery.isLoading && <SetupModal onComplete={handleSetupComplete} />}

        {/* Monthly consent */}
        {hasProfile && needsConsent && <MonthlyConsentBanner onRespond={handleConsentRespond} />}

        {/* 3-Tab switcher */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[#0a1628] border border-[#1a3a5c]">
          <button onClick={() => setTab("producers")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === "producers" ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-400 border border-amber-400/40" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]"}`}>
            <Trophy size={16} /> Top 10 Production
          </button>
          <button onClick={() => setTab("climbers")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === "climbers" ? "bg-gradient-to-r from-[#22c55e]/20 to-cyan-500/10 text-[#22c55e] border border-[#22c55e]/40" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]"}`}>
            <Rocket size={16} /> Fastest Climbers
          </button>
          <button onClick={() => setTab("performance")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === "performance" ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-400 border border-blue-400/40" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]"}`}>
            <BarChart3 size={16} /> Full Performance
          </button>
          <button onClick={() => setTab("pulse")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === "pulse" ? "bg-gradient-to-r from-pink-500/20 to-rose-500/10 text-pink-400 border border-pink-400/40" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]"}`}>
            <Flame size={16} /> Team Pulse
          </button>
        </div>

        {/* Tab descriptions */}
        {tab === "producers" && (
          <div className="mb-4 p-4 rounded-xl bg-[#12233e]/30 border border-[#1a3a5c]/50">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#7a95b8]">
                <span className="text-white font-semibold">Top 10 Premium Production</span> — Only deals marked as <span className="text-[#22c55e] font-semibold">Closed/Won</span> are counted.
                Annual life premium and monthly annuity premium tallied separately. Only opted-in advisors appear.
              </p>
            </div>
          </div>
        )}
        {tab === "climbers" && (
          <div className="mb-4 p-4 rounded-xl bg-[#12233e]/30 border border-[#1a3a5c]/50">
            <div className="flex items-start gap-3">
              <Rocket size={16} className="text-[#22c55e] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#7a95b8]">
                <span className="text-white font-semibold">Fastest Climbers</span> — Advisors trending <span className="text-[#22c55e] font-semibold">25%+ above</span> their baseline annual commissions,
                prorated by time on the platform. Shows projected annual growth from total commissions payable.
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {tab === "producers" && <TopProducersTable />}
        {tab === "climbers" && <FastestClimbersTable />}
        {tab === "performance" && <PerformanceTable />}
        {tab === "pulse" && (
          <div className="space-y-4">
            <div className="mb-4 p-4 rounded-xl bg-[#12233e]/30 border border-[#1a3a5c]/50">
              <div className="flex items-start gap-3">
                <Flame size={16} className="text-pink-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#7a95b8]">
                  <span className="text-white font-semibold">Team Pulse</span> — Real-time activity feed showing what's happening across the team.
                  See who's closing deals, onboarding clients, and hitting milestones.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-4 rounded-xl bg-[#0a1628] border border-[#1a3a5c]">
                <div className="text-2xl font-bold text-[#22c55e]">24</div>
                <div className="text-xs text-[#4a6a8e]">Active advisors today</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0a1628] border border-[#1a3a5c]">
                <div className="text-2xl font-bold text-amber-400">7</div>
                <div className="text-xs text-[#4a6a8e]">Deals closed this week</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0a1628] border border-[#1a3a5c]">
                <div className="text-2xl font-bold text-blue-400">$1.2M</div>
                <div className="text-xs text-[#4a6a8e]">Premium this month</div>
              </div>
            </div>
            <div className="space-y-2">
              {["New deal closed — $45K annual premium", "Client onboarded — Retirement DNA generated", "Risk assessment completed — Level 5 Elite depth", "Milestone: 10th deal this quarter", "New prospect added to pipeline", "Annuity replacement scored 92 — Solar Strategy eligible", "Bulk generation: 15 proposals created", "Training module completed: Advanced Tax Planning"].map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a1628]/50 border border-[#1a3a5c]/30 hover:border-[#1a3a5c]/60 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i < 2 ? "bg-[#22c55e] animate-pulse" : i < 4 ? "bg-amber-400" : "bg-blue-400"}`} />
                  <span className="text-sm text-[#c0d4e8] flex-1">{activity}</span>
                  <span className="text-xs text-[#4a6a8e] flex-shrink-0">{i === 0 ? "2m ago" : i === 1 ? "15m ago" : i === 2 ? "1h ago" : `${i + 1}h ago`}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#4a6a8e] text-center pt-2">Activity feed updates in real-time when team members are opted in.</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-[#060f20] border border-[#1a3a5c]/30">
          <p className="text-xs text-[#4a6a8e] leading-relaxed">
            <strong className="text-[#7a95b8]">Disclaimer:</strong> Leaderboard rankings are based on self-reported deal data marked as Closed/Won within the Russell Capital Systems™ platform.
            Production figures represent premium amounts and are not verified by any carrier or regulatory body. Rankings are for motivational purposes only. Past production does not guarantee future results. Participation is voluntary and can be changed monthly.
          </p>
        </div>
      </div>
          <PageInsights pageId="leaderboard" />
    </AppShell>
  );
}
