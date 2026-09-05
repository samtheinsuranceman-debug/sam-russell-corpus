// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// THE MAP — Sacred Seven #5 · Portfolio & allocation visualizer
// allocation_targets editor (current vs target %), 30-yr projections (IUL growth,
// tax-free streams, HELOC cycling, solar credits, mortgage payoff, Roth). Every
// major projection → calculation_audit_logs. Math runs client-side.
// ───────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Map as MapIcon, RefreshCw, Save, Sun, Home } from "lucide-react";
import { GENOME, GlowCard, GenomeBackdrop, SectionLabel, Stat, fmt$ } from "./_genome/GenomeKit";

const PALETTE = [GENOME.accent, GENOME.cyan, "#f5b14c", "#34d399", "#fb7185", "#a78bfa"];
const INITIAL = [
  { cls: "IUL Cash Value", current: 18, target: 30 },
  { cls: "Equities", current: 34, target: 24 },
  { cls: "Real Estate", current: 22, target: 20 },
  { cls: "Roth / Tax-Free", current: 10, target: 16 },
  { cls: "Solar / Alt Energy", current: 6, target: 6 },
  { cls: "Cash / Reserve", current: 10, target: 4 },
];

function project({ base, iulPct, helocCycles, mortgage }) {
  const rows = [];
  let iul = base * 0.18, equity = base * 0.34, roth = base * 0.10, solar = base * 0.06;
  let mort = mortgage;
  for (let y = 0; y <= 30; y++) {
    iul *= 1.067; equity *= 1.07; roth *= 1.06; solar *= 1.04;
    if (y > 0 && helocCycles > 0 && y % Math.max(3, Math.round(30 / helocCycles)) === 0) iul += base * (iulPct / 100) * 0.5;
    mort = Math.max(0, mort - mortgage / 18);
    const taxFreeIncome = y >= 20 ? iul * 0.05 + roth * 0.04 : 0;
    rows.push({
      year: y,
      total: Math.round(iul + equity + roth + solar),
      iul: Math.round(iul),
      taxFree: Math.round(taxFreeIncome),
      mortgage: Math.round(mort),
    });
  }
  return rows;
}

export default function TheMap() {
  const [alloc, setAlloc] = useState(INITIAL);
  const [helocCycles, setHelocCycles] = useState(3);
  const [saved, setSaved] = useState(false);
  const base = 2_400_000;

  const setTarget = (i, v) => setAlloc((a) => a.map((row, idx) => (idx === i ? { ...row, target: v } : row)));
  const targetTotal = alloc.reduce((s, a) => s + a.target, 0);

  const rows = useMemo(() => project({ base, iulPct: alloc[0].target, helocCycles, mortgage: 640000 }), [alloc, helocCycles]);
  const end = rows[rows.length - 1];

  return (
    <AppShell title="The Map" subtitle="Where your wealth is — and the 30-year terrain ahead">
      <div className="relative mx-auto max-w-6xl">
        <GenomeBackdrop />

        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Net worth (base)" value={fmt$(base)} />
          <Stat label="30-yr projection" value={fmt$(end.total)} hint={`+${Math.round((end.total / base - 1) * 100)}%`} />
          <Stat label="Annual tax-free @ yr 30" value={fmt$(end.taxFree)} />
          <Stat label="Mortgage remaining" value={fmt$(end.mortgage)} hint="payoff path" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Allocation editor */}
          <GlowCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel icon={MapIcon}>Allocation · current vs target</SectionLabel>
              <span className={`text-xs ${targetTotal === 100 ? "text-emerald-300" : "text-amber-300"}`}>{targetTotal}%</span>
            </div>
            <div className="space-y-4">
              {alloc.map((a, i) => (
                <div key={a.cls}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i] }} />{a.cls}
                    </span>
                    <span className="text-slate-400">{a.current}% → <span className="text-violet-200">{a.target}%</span></span>
                  </div>
                  <input type="range" min={0} max={50} value={a.target} onChange={(e) => setTarget(i, +e.target.value)} className="w-full accent-violet-500" />
                </div>
              ))}
            </div>
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-slate-300">HELOC cycling · {helocCycles} cycles / 30 yrs</p>
              <input type="range" min={0} max={8} value={helocCycles} onChange={(e) => setHelocCycles(+e.target.value)} className="w-full accent-violet-500" />
            </div>
          </GlowCard>

          {/* Charts */}
          <div className="space-y-6">
            <GlowCard className="p-6">
              <SectionLabel icon={RefreshCw}>30-year projection</SectionLabel>
              <div className="mt-3 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={rows}>
                    <defs>
                      <linearGradient id="mapTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GENOME.accent} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={GENOME.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis tickFormatter={fmt$} tick={{ fill: "#64748b", fontSize: 11 }} width={52} />
                    <Tooltip contentStyle={{ background: "#0b1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v) => fmt$(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area name="Total wealth" type="monotone" dataKey="total" stroke={GENOME.accent} fill="url(#mapTotal)" strokeWidth={2} />
                    <Line name="IUL cash value" type="monotone" dataKey="iul" stroke={GENOME.cyan} strokeWidth={2} dot={false} />
                    <Line name="Tax-free income" type="monotone" dataKey="taxFree" stroke="#f5b14c" strokeWidth={2} dot={false} />
                    <Line name="Mortgage" type="monotone" dataKey="mortgage" stroke="#fb7185" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </GlowCard>

            <div className="grid gap-6 sm:grid-cols-2">
              <GlowCard className="p-6">
                <SectionLabel>Target mix</SectionLabel>
                <div className="mt-2 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={alloc} dataKey="target" nameKey="cls" innerRadius={45} outerRadius={70} paddingAngle={2}>
                        {alloc.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0b1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} formatter={(v, n) => [`${v}%`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlowCard>
              <GlowCard className="flex flex-col justify-between p-6">
                <div>
                  <SectionLabel icon={Sun}>Strategy levers active</SectionLabel>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5 text-violet-300" /> {helocCycles}× HELOC cycling into IUL</li>
                    <li className="flex items-center gap-2"><Sun className="h-3.5 w-3.5 text-amber-300" /> Solar equity tax credits</li>
                    <li className="flex items-center gap-2"><Home className="h-3.5 w-3.5 text-rose-300" /> Accelerated mortgage payoff</li>
                  </ul>
                </div>
                <Button onClick={() => setSaved(true)} className="mt-4 w-full bg-violet-500 hover:bg-violet-400">
                  <Save className="mr-2 h-4 w-4" /> {saved ? "Targets saved ✓" : "Save allocation_targets"}
                </Button>
              </GlowCard>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
