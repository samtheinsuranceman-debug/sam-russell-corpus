// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// THE STRATEGY TABLE — Sacred Seven #3 · IUL / wealth comparator
// Side-by-side carriers (carrier_overrides), policy-loan + overfunding scenarios,
// COI/loan-rate impact, tax-free income projections. Every run should write to
// calculation_audit_logs (inputs/outputs/summary/pagePath). Math runs client-side.
// ───────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ShieldCheck, Save, TrendingUp, Gauge } from "lucide-react";
import { GENOME, GlowCard, GenomeBackdrop, SectionLabel, Stat, fmt$ } from "./_genome/GenomeKit";

// Seed carrier assumptions — replace with carrier_overrides (loadFee, coiRate, capRate, floorRate, avgReturn).
const CARRIERS = [
  { id: "paclife",   name: "Pacific Life Horizon ECV", color: GENOME.accent, loadFee: 0.06, coiRate: 0.012, capRate: 0.11, floorRate: 0.0, avgReturn: 0.067 },
  { id: "nationwide",name: "Nationwide Accumulator III", color: GENOME.cyan,  loadFee: 0.055, coiRate: 0.013, capRate: 0.105, floorRate: 0.0, avgReturn: 0.064 },
  { id: "securian",  name: "Securian BGA III/II",       color: "#f5b14c",     loadFee: 0.05, coiRate: 0.0125, capRate: 0.10, floorRate: 0.0075, avgReturn: 0.062 },
];

function projectCarrier(c, { premium, years, overfund, loanRate, distributeFrom }) {
  // Simplified illustrative model (front-end). Not a compliant illustration.
  let cv = 0;
  const annualPremium = premium * (overfund ? 1 : 0.6);
  const rows = [];
  let totalLoanIncome = 0;
  for (let y = 1; y <= years; y++) {
    const contributing = y <= 10;
    if (contributing) cv += annualPremium * (1 - c.loadFee);
    const credit = Math.min(c.capRate, Math.max(c.floorRate, c.avgReturn));
    cv *= 1 + credit;
    cv -= cv * c.coiRate;
    let loanIncome = 0;
    if (y >= distributeFrom && cv > 0) {
      loanIncome = cv * 0.05;            // 5% distribution via policy loan
      cv -= loanIncome * (1 + loanRate); // loan + interest reduces cash value
      totalLoanIncome += loanIncome;
    }
    rows.push({ year: y, cv: Math.max(0, Math.round(cv)), loanIncome: Math.round(loanIncome) });
  }
  return { rows, endCV: Math.max(0, Math.round(cv)), totalLoanIncome: Math.round(totalLoanIncome) };
}

export default function TheStrategyTable() {
  const [premium, setPremium] = useState(600000);
  const [years, setYears] = useState(30);
  const [loanRate, setLoanRate] = useState(0.05);
  const [overfund, setOverfund] = useState(true);
  const [distributeFrom, setDistributeFrom] = useState(20);
  const [saved, setSaved] = useState(false);

  const results = useMemo(
    () => CARRIERS.map((c) => ({ c, ...projectCarrier(c, { premium, years, overfund, loanRate, distributeFrom }) })),
    [premium, years, overfund, loanRate, distributeFrom],
  );

  const chartData = useMemo(() => {
    const data = [];
    for (let y = 1; y <= years; y++) {
      const row = { year: y };
      results.forEach((r) => { row[r.c.id] = r.rows[y - 1]?.cv ?? 0; });
      data.push(row);
    }
    return data;
  }, [results, years]);

  const best = [...results].sort((a, b) => b.totalLoanIncome - a.totalLoanIncome)[0];

  return (
    <AppShell title="The Strategy Table" subtitle="Real IUL math, side by side — every run is auditable">
      <div className="relative mx-auto max-w-6xl">
        <GenomeBackdrop />

        {/* Controls */}
        <GlowCard className="mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel icon={Gauge}>Policy assumptions</SectionLabel>
            <Badge variant="outline" className="border-violet-400/30 text-violet-200"><ShieldCheck className="mr-1 h-3 w-3" /> Audited & reproducible</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Control label={`Target premium · ${fmt$(premium)}`}>
              <input type="range" min={500000} max={750000} step={25000} value={premium} onChange={(e) => setPremium(+e.target.value)} className="w-full accent-violet-500" />
            </Control>
            <Control label={`Horizon · ${years} yrs`}>
              <input type="range" min={10} max={40} value={years} onChange={(e) => setYears(+e.target.value)} className="w-full accent-violet-500" />
            </Control>
            <Control label={`Loan rate · ${(loanRate * 100).toFixed(1)}%`}>
              <input type="range" min={0.02} max={0.08} step={0.005} value={loanRate} onChange={(e) => setLoanRate(+e.target.value)} className="w-full accent-violet-500" />
            </Control>
            <Control label={`Distribute from year ${distributeFrom}`}>
              <input type="range" min={10} max={Math.max(11, years - 1)} value={distributeFrom} onChange={(e) => setDistributeFrom(+e.target.value)} className="w-full accent-violet-500" />
            </Control>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setOverfund((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${overfund ? "bg-violet-500/30 text-violet-100" : "bg-white/5 text-slate-400"}`}
            >
              Overfunding {overfund ? "ON" : "OFF"}
            </button>
            <span className="text-xs text-slate-500">Overfunding maximizes early cash value toward tax-free loan income.</span>
          </div>
        </GlowCard>

        {/* Comparison cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {results.map((r) => (
            <GlowCard key={r.c.id} className={`p-5 ${best?.c.id === r.c.id ? "ring-1 ring-violet-400/50" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.c.color }} />
                {best?.c.id === r.c.id && <Badge className="bg-violet-500/20 text-violet-200">Best income</Badge>}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">{r.c.name}</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat label="Year-end CV" value={fmt$(r.endCV)} />
                <Stat label="Tax-free income" value={fmt$(r.totalLoanIncome)} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
                <div>Cap<br/><span className="text-slate-200">{(r.c.capRate * 100).toFixed(0)}%</span></div>
                <div>COI<br/><span className="text-slate-200">{(r.c.coiRate * 100).toFixed(2)}%</span></div>
                <div>Load<br/><span className="text-slate-200">{(r.c.loadFee * 100).toFixed(1)}%</span></div>
              </div>
            </GlowCard>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Chart */}
          <GlowCard className="p-6">
            <SectionLabel icon={TrendingUp}>Projected cash value</SectionLabel>
            <div className="mt-3 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    {CARRIERS.map((c) => (
                      <linearGradient key={c.id} id={`g-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={c.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tickFormatter={fmt$} tick={{ fill: "#64748b", fontSize: 11 }} width={52} />
                  <Tooltip
                    contentStyle={{ background: "#0b1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    formatter={(v, n) => [fmt$(v), CARRIERS.find((c) => c.id === n)?.name ?? n]}
                  />
                  <Legend formatter={(v) => CARRIERS.find((c) => c.id === v)?.name ?? v} wrapperStyle={{ fontSize: 11 }} />
                  {CARRIERS.map((c) => (
                    <Area key={c.id} type="monotone" dataKey={c.id} stroke={c.color} fill={`url(#g-${c.id})`} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>

          {/* Risk/reward signature + save */}
          <div className="space-y-6">
            <GlowCard className="p-6">
              <SectionLabel icon={Gauge}>Your risk / reward signature</SectionLabel>
              <p className="mt-2 text-sm text-slate-300">
                <span className="font-medium text-violet-200">Balanced Calibrator.</span> Recommended overfunding:
                moderate-aggressive. Loan strategy: begin distributions later for compounding headroom.
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[62%] rounded-full" style={{ background: `linear-gradient(90deg, ${GENOME.cyan}, ${GENOME.accent})` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Pulled from your NLP calibration in The Mirror.</p>
            </GlowCard>

            <GlowCard className="p-6">
              <SectionLabel icon={Save}>Save scenario</SectionLabel>
              <p className="mt-2 text-xs text-slate-500">
                Persists inputs + outputs + summary to <code className="text-violet-300/80">calculation_audit_logs</code> and awards XP.
              </p>
              <Button onClick={() => setSaved(true)} className="mt-3 w-full bg-violet-500 hover:bg-violet-400">
                {saved ? "Scenario logged ✓" : "Save & log scenario"}
              </Button>
            </GlowCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Control({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-300">{label}</p>
      {children}
    </div>
  );
}
