// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// THE MIRROR — Sacred Seven #2 · Personal dashboard
// Goals (advisor_goals), calibration score + domain breakdown, XP/badges/streak,
// somatic quick check-in (→ The Field), recent ai_memory_notes, quick links.
// Front-end first — replace seed data with tRPC reads.
// ───────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
} from "recharts";
import {
  HeartPulse, Crown, Flame, Award, ArrowRight, Sparkles, Target,
  Table2, Map as MapIcon, ScrollText, Users,
} from "lucide-react";
import { GENOME, GlowCard, GenomeOrb, GenomeBackdrop, SectionLabel, Stat, fmt$ } from "./_genome/GenomeKit";

const DOMAINS = [
  { domain: "Body Mapping", score: 78 },
  { domain: "Time", score: 64 },
  { domain: "Agency", score: 82 },
  { domain: "Ontology", score: 59 },
  { domain: "Emotion", score: 71 },
  { domain: "Honesty", score: 88 },
];
const GOALS = [
  { type: "AUM Target", current: 3.4e6, target: 5e6, color: GENOME.accent },
  { type: "New Clients", current: 14, target: 25, color: GENOME.cyan, money: false },
  { type: "Revenue", current: 92e3, target: 150e3, color: "#f5b14c" },
];
const MEMORY = [
  { source: "NLP_Calibration_Block_1", note: "Strong toward-motivation; needs external validation less than expected.", t: "2h ago" },
  { source: "field_audio", note: "Pre-decision self-talk before the Henderson IUL call — felt centered.", t: "yesterday" },
  { source: "arrival_calibration", note: "Sternum-click located mid-chest, cool-sharp-light signature confirmed.", t: "3d ago" },
];

export default function TheMirror() {
  const [checkedIn, setCheckedIn] = useState(false);

  return (
    <AppShell title="The Mirror" subtitle="Your field state, your goals, your becoming">
      <div className="relative mx-auto max-w-6xl">
        <GenomeBackdrop />

        {/* Hero greeting + somatic check-in */}
        <GlowCard className="relative mb-6 overflow-hidden">
          <div className="grid items-center gap-6 p-7 md:grid-cols-[1fr_auto]" style={{ background: GENOME.gradient }}>
            <div>
              <SectionLabel icon={Sparkles}>Field State · Unified</SectionLabel>
              <h2 className="mt-2 text-2xl font-semibold text-white">Welcome back, Dr. Russell</h2>
              <p className="mt-1 max-w-lg text-sm text-slate-300">
                You're on a <span className="text-violet-200 font-medium">9-day</span> somatic streak.
                Your reputation score is climbing. Take one breath, then choose your work.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Stat label="Calibration" value="72" hint="+6 this week" />
                <Stat label="Reputation" value="81" hint="Crown tier" />
                <Stat label="XP" value="2,480" hint="Level 7" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <GenomeOrb size={120} active={checkedIn} label={checkedIn ? "Field unified" : "Check in"} onClick={() => setCheckedIn(true)} />
              {checkedIn
                ? <Link href="/portal/the-field"><Button size="sm" variant="outline" className="border-white/15">Go deeper in The Field <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button></Link>
                : <p className="text-xs text-slate-400">Sternum-click · gravity at center</p>}
            </div>
          </div>
        </GlowCard>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Goals */}
          <GlowCard className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel icon={Target}>Goals · advisor_goals</SectionLabel>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400">Adjust targets</Button>
            </div>
            <div className="space-y-5">
              {GOALS.map((g) => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                const f = g.money === false ? (n) => n.toLocaleString() : fmt$;
                return (
                  <div key={g.type}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-200">{g.type}</span>
                      <span className="text-slate-400">{f(g.current)} <span className="text-slate-600">/ {f(g.target)}</span></span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlowCard>

          {/* Calibration radar */}
          <GlowCard className="p-6">
            <SectionLabel icon={Award}>Calibration by domain</SectionLabel>
            <div className="mt-2 h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={DOMAINS} outerRadius={84}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="domain" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Radar dataKey="score" stroke={GENOME.accent} fill={GENOME.accent} fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>

          {/* Recent memory */}
          <GlowCard className="p-6 lg:col-span-2">
            <SectionLabel icon={Sparkles}>Recent memory · ai_memory_notes</SectionLabel>
            <ul className="mt-4 space-y-3">
              {MEMORY.map((m, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: GENOME.accent }} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">{m.note}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500"><code className="text-violet-300/70">{m.source}</code> · {m.t}</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlowCard>

          {/* XP + quick links */}
          <div className="space-y-6">
            <GlowCard className="p-6">
              <SectionLabel icon={Crown}>Standing</SectionLabel>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-[110px] w-[110px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="68%" outerRadius="100%" data={[{ v: 81, fill: GENOME.accent }]} startAngle={90} endAngle={-270}>
                      <RadialBar background={{ fill: "rgba(255,255,255,0.06)" }} dataKey="v" cornerRadius={20} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-lg font-semibold text-white"><Crown className="h-4 w-4 text-amber-300" /> Crown tier</p>
                  <p className="text-sm text-slate-400">Reputation 81 / 100</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-orange-300"><Flame className="h-3.5 w-3.5" /> 9-day streak</p>
                </div>
              </div>
            </GlowCard>

            <GlowCard className="p-6">
              <SectionLabel>Continue the journey</SectionLabel>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <QuickLink href="/portal/the-strategy-table" icon={Table2} label="Strategy Table" />
                <QuickLink href="/portal/the-map" icon={MapIcon} label="The Map" />
                <QuickLink href="/portal/the-legacy" icon={ScrollText} label="The Legacy" />
                <QuickLink href="/portal/the-brotherhood" icon={Users} label="Brotherhood" />
              </div>
            </GlowCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function QuickLink({ href, icon: Icon, label }) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-slate-200 transition-colors hover:border-violet-400/40 hover:bg-violet-500/10">
        <Icon className="h-4 w-4 text-violet-300" /> {label}
      </div>
    </Link>
  );
}
