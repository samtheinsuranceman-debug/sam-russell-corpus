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
import { stepPolicyYear, ILLUSTRATIVE_COI_TABLE, ILLUSTRATIVE_SOURCE } from "@shared/policyMechanics";

// Placeholder carriers. The names are deliberately generic: the caps, loads and
// assumed returns below carry no source and no as-of date, and an unsourced cap
// printed under a real company's name is a factual claim about that company
// that nobody can check. Real terms arrive through carrier_overrides — see
// docs/carriers/INTAKE.md for what a strategy has to carry before it goes in.
const CARRIERS = [
  { id: "design-1", name: "Illustrative design 1", color: GENOME.accent, loadFee: 0.06,  capRate: 0.11,  floorRate: 0.0,    assumedCredit: 0.06 },
  { id: "design-2", name: "Illustrative design 2", color: GENOME.cyan,   loadFee: 0.055, capRate: 0.105, floorRate: 0.0,    assumedCredit: 0.06 },
  { id: "design-3", name: "Illustrative design 3", color: "#f5b14c",     loadFee: 0.05,  capRate: 0.10,  floorRate: 0.0075, assumedCredit: 0.06 },
];

// The charge sequence is not this page's to invent. It runs through
// stepPolicyYear in shared/policyMechanics.ts, the same function the loan
// optimizer and every other projection on the platform steps through: premium
// less load, policy fee, per-unit charge, cost of insurance on the NET AMOUNT
// AT RISK, then the credit.
//
// This page used to do `cv -= cv * coiRate` — mortality as a percentage of
// account value. That has the slope backwards. The amount at risk is the death
// benefit less the account value, so as cash value grows the mortality charge
// FALLS. Charging a percentage of account value makes it rise, which is most
// of why a well-funded policy looked wrong here.
function chargesFor(c) {
  return {
    premiumLoadPctByYear: [c.loadFee * 100],
    monthlyPolicyFee: 10,
    perUnitMonthlyPerThousand: 0,
    perUnitYears: 0,
    coiTable: ILLUSTRATIVE_COI_TABLE,
    coiTableSource: ILLUSTRATIVE_SOURCE,
    surrenderChargePctByYear: [],
  };
}

function projectCarrier(c, { premium, years, overfund, loanRate, distributeFrom, faceAmount, issueAge }) {
  const annualPremium = premium * (overfund ? 1 : 0.6);
  const charges = chargesFor(c);
  const creditRate = Math.min(c.capRate, Math.max(c.floorRate, c.assumedCredit));
  let cv = 0;
  const rows = [];
  let totalLoanIncome = 0;
  let lapseYear = null;
  for (let y = 1; y <= years; y++) {
    const step = stepPolicyYear({
      accountValue: cv,
      policyYear: y,
      attainedAge: issueAge + y - 1,
      premium: y <= 10 ? annualPremium : 0,
      faceAmount,
      charges,
      creditedRatePct: creditRate * 100,
    });
    if (step.exhausted && lapseYear === null) lapseYear = y;
    cv = step.accountValue;
    let loanIncome = 0;
    if (y >= distributeFrom && cv > 0) {
      loanIncome = cv * 0.05;            // 5% distribution via policy loan
      cv -= loanIncome * (1 + loanRate); // loan + interest reduces cash value
      cv = Math.max(0, cv);
      totalLoanIncome += loanIncome;
    }
    rows.push({
      year: y,
      cv: Math.round(cv),
      loanIncome: Math.round(loanIncome),
      coi: step.row.costOfInsurance,
      nar: step.row.netAmountAtRisk,
    });
  }
  return {
    rows,
    endCV: Math.round(cv),
    totalLoanIncome: Math.round(totalLoanIncome),
    lapseYear,
    firstYearCoi: rows[0]?.coi ?? 0,
  };
}

export default function TheStrategyTable() {
  const [premium, setPremium] = useState(600000);
  const [years, setYears] = useState(30);
  const [loanRate, setLoanRate] = useState(0.05);
  const [overfund, setOverfund] = useState(true);
  const [distributeFrom, setDistributeFrom] = useState(20);
  const [faceAmount, setFaceAmount] = useState(3000000);
  const [issueAge, setIssueAge] = useState(45);
  const [saved, setSaved] = useState(false);

  const results = useMemo(
    () => CARRIERS.map((c) => ({ c, ...projectCarrier(c, { premium, years, overfund, loanRate, distributeFrom, faceAmount, issueAge }) })),
    [premium, years, overfund, loanRate, distributeFrom, faceAmount, issueAge],
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
            <Badge variant="outline" className="border-emerald-400/30 text-emerald-200"><ShieldCheck className="mr-1 h-3 w-3" /> Audited & reproducible</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Control label={`Target premium · ${fmt$(premium)}`}>
              <input type="range" min={500000} max={750000} step={25000} value={premium} onChange={(e) => setPremium(+e.target.value)} className="w-full accent-emerald-500" />
            </Control>
            <Control label={`Horizon · ${years} yrs`}>
              <input type="range" min={10} max={40} value={years} onChange={(e) => setYears(+e.target.value)} className="w-full accent-emerald-500" />
            </Control>
            <Control label={`Loan rate · ${(loanRate * 100).toFixed(1)}%`}>
              <input type="range" min={0.02} max={0.08} step={0.005} value={loanRate} onChange={(e) => setLoanRate(+e.target.value)} className="w-full accent-emerald-500" />
            </Control>
            <Control label={`Distribute from year ${distributeFrom}`}>
              <input type="range" min={10} max={Math.max(11, years - 1)} value={distributeFrom} onChange={(e) => setDistributeFrom(+e.target.value)} className="w-full accent-emerald-500" />
            </Control>
            <Control label={`Death benefit · ${fmt$(faceAmount)}`}>
              <input type="range" min={500000} max={10000000} step={250000} value={faceAmount} onChange={(e) => setFaceAmount(+e.target.value)} className="w-full accent-emerald-500" />
            </Control>
            <Control label={`Issue age · ${issueAge}`}>
              <input type="range" min={25} max={70} value={issueAge} onChange={(e) => setIssueAge(+e.target.value)} className="w-full accent-emerald-500" />
            </Control>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setOverfund((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${overfund ? "bg-emerald-500/30 text-emerald-100" : "bg-white/5 text-slate-400"}`}
            >
              Overfunding {overfund ? "ON" : "OFF"}
            </button>
            <span className="text-xs text-slate-500">Overfunding maximizes early cash value toward tax-free loan income.</span>
          </div>
        </GlowCard>

        {/* What these columns are not */}
        <GlowCard className="mb-6 border-amber-400/25 p-5">
          <h3 className="text-sm font-semibold text-amber-200">What this table is, and what it is not</h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-300">
            <li>
              <strong className="text-slate-200">The carriers are placeholders.</strong> Caps, loads
              and floors here carry no source and no as-of date, so they are not attributed to any
              real company. Real terms replace them one field at a time.
            </li>
            <li>
              <strong className="text-slate-200">Mortality is an order of magnitude, not a quote.</strong>{" "}
              Cost of insurance is charged on the net amount at risk — death benefit less account
              value — from generic age bands. A real schedule varies by age, sex, underwriting class
              and policy year and moves by more than a factor of two between classes at one age.
            </li>
            <li>
              <strong className="text-slate-200">Surrender value is not shown.</strong> No surrender
              charge schedule has been sourced. In the early years the cash a client could actually
              take is well below the account value plotted here.
            </li>
            <li>
              <strong className="text-slate-200">The credited rate is flat.</strong> Every year is
              credited at the same assumed rate. Real index crediting is a sequence with zero years
              in it — see the Time Machine pages for the actual history.
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            Not an illustration. Nothing here may be shown to a client in place of a carrier
            illustration produced under AG 49-A.
          </p>
        </GlowCard>

        {/* Comparison cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {results.map((r) => (
            <GlowCard key={r.c.id} className={`p-5 ${best?.c.id === r.c.id ? "ring-1 ring-emerald-400/50" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.c.color }} />
                {best?.c.id === r.c.id && <Badge className="bg-emerald-500/20 text-emerald-200">Best income</Badge>}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">{r.c.name}</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat label="Year-end CV" value={fmt$(r.endCV)} />
                <Stat label="Tax-free income" value={fmt$(r.totalLoanIncome)} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
                <div>Cap<br/><span className="text-slate-200">{(r.c.capRate * 100).toFixed(0)}%</span></div>
                <div>Yr-1 COI<br/><span className="text-slate-200">{fmt$(r.firstYearCoi)}</span></div>
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
                <span className="font-medium text-emerald-200">Balanced Calibrator.</span> Recommended overfunding:
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
                Persists inputs + outputs + summary to <code className="text-emerald-300/80">calculation_audit_logs</code> and awards XP.
              </p>
              <Button onClick={() => setSaved(true)} className="mt-3 w-full bg-emerald-500 hover:bg-emerald-400">
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
