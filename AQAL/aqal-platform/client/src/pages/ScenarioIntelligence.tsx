import { useState } from "react";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { motion } from "framer-motion";

// ============================================================
// SCENARIO INTELLIGENCE PAGE
// Distribution analysis of 200 realistic patient scenarios
// showing monster patterns, financial stress, and intervention logic
// ============================================================

const monsterData = [
  { name: "Executive Overload", count: 26, pct: 13.0, wants: "Relief / Protection", color: "#E0C68C" },
  { name: "Avoidance Habit", count: 22, pct: 11.0, wants: "Control / Predictability", color: "#C9A96E" },
  { name: "Shame Loop", count: 21, pct: 10.5, wants: "Avoidance / Relief", color: "#B08D4F" },
  { name: "Procrastination Spiral", count: 19, pct: 9.5, wants: "Relief", color: "#9A7A3E" },
  { name: "Identity Collapse", count: 18, pct: 9.0, wants: "Certainty", color: "#846830" },
  { name: "Control Addiction", count: 16, pct: 8.0, wants: "Predictability", color: "#6E5625" },
  { name: "Family Enmeshment", count: 14, pct: 7.0, wants: "Protection", color: "#5A461E" },
  { name: "Financial Panic", count: 14, pct: 7.0, wants: "Certainty / Control", color: "#E8A04C" },
  { name: "Hypervigilance", count: 13, pct: 6.5, wants: "Predictability / Protection", color: "#D4883A" },
  { name: "Trauma Echo", count: 13, pct: 6.5, wants: "Protection", color: "#BF7030" },
  { name: "Learned Helplessness", count: 12, pct: 6.0, wants: "Relief", color: "#A85A28" },
  { name: "All-or-Nothing Thinking", count: 12, pct: 6.0, wants: "Predictability / Relief", color: "#924520" },
];

const originData = [
  { origin: "Medical Trauma", count: 38, pct: 19.0 },
  { origin: "Attachment Injury", count: 32, pct: 16.0 },
  { origin: "Work Trauma", count: 31, pct: 15.5 },
  { origin: "Poverty Stress", count: 29, pct: 14.5 },
  { origin: "Childhood Chaos", count: 26, pct: 13.0 },
  { origin: "Family Conflict", count: 24, pct: 12.0 },
  { origin: "School Failure", count: 20, pct: 10.0 },
];

const moneyData = [
  { situation: "Stable but no cushion", count: 29, pct: 14.5 },
  { situation: "Barely breaking even", count: 25, pct: 12.5 },
  { situation: "Recent windfall but no system", count: 25, pct: 12.5 },
  { situation: "Volatile cash flow", count: 24, pct: 12.0 },
  { situation: "Saving slowly", count: 21, pct: 10.5 },
  { situation: "Living paycheck to paycheck", count: 20, pct: 10.0 },
  { situation: "Enough for family outings", count: 19, pct: 9.5 },
  { situation: "Behind on bills", count: 17, pct: 8.5 },
  { situation: "Some extra money this month", count: 11, pct: 5.5 },
  { situation: "Debt consolidation underway", count: 9, pct: 4.5 },
];

const protocols = [
  {
    name: "Stabilize Sleep → Money → Communication",
    description: "The most common first sequence. Sleep deprivation impairs executive function, which impairs financial decisions, which impairs relationships. Fix the foundation first.",
    bestFor: "Financial panic, executive overload, hypervigilance",
    signal: "Missed tasks drop for 4 consecutive weeks",
  },
  {
    name: "Use Strengths to Create One Reliable Win Per Week",
    description: "When shame or helplessness dominates, the person needs evidence that they can succeed at something. One win per week breaks the shame cycle.",
    bestFor: "Shame loop, learned helplessness, all-or-nothing thinking",
    signal: "Bills become predictable and on time",
  },
  {
    name: "Start with Body Regulation → Family Structure",
    description: "When the body is dysregulated (somatic/interoceptive weakness), no cognitive intervention sticks. Regulate the nervous system first, then restructure family dynamics.",
    bestFor: "Identity collapse, family enmeshment, trauma echo",
    signal: "Family conflict falls below threshold",
  },
  {
    name: "Remove Friction from the Most Critical Behavior",
    description: "When the person has high meta-cognition but low execution, the problem isn't awareness — it's friction. Remove the barriers to the single most important behavior.",
    bestFor: "Control addiction, procrastination spiral, avoidance habit",
    signal: "One monthly review shows no crisis escalation",
  },
];

const quadrantEnvironments = [
  {
    pattern: "Journaling + Routines + Accountability + Dashboards",
    ul: "Journaling (intrapersonal reflection)",
    ur: "Routines (behavioral consistency)",
    ll: "Accountability partners (relational support)",
    lr: "Dashboards (systems tracking)",
    targets: "Avoidance and procrastination patterns",
  },
  {
    pattern: "Values Clarity + Habit Design + Family Meetings + Automation",
    ul: "Values clarity (identity alignment)",
    ur: "Habit design (behavioral architecture)",
    ll: "Family meetings (relational restructuring)",
    lr: "Automation (systems efficiency)",
    targets: "Family and identity patterns",
  },
  {
    pattern: "Shadow Work + Body Checks + Community Support + Financial Scaffolding",
    ul: "Shadow work (unconscious integration)",
    ur: "Body checks (somatic regulation)",
    ll: "Community support (belonging)",
    lr: "Financial scaffolding (economic stability)",
    targets: "Shame and trauma patterns",
  },
  {
    pattern: "Metacognition + Schedules + Partner Check-ins + Metric Board",
    ul: "Metacognition (thinking about thinking)",
    ur: "Schedules (time architecture)",
    ll: "Partner check-ins (intimate accountability)",
    lr: "Metric board (quantified progress)",
    targets: "Executive and control patterns",
  },
];

function BarChart({ data, maxValue }: { data: { label: string; value: number; pct: number; color?: string }[]; maxValue: number }) {
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center gap-3"
        >
          <span className="text-xs font-mono text-[#E0C68C]/70 w-8 text-right shrink-0">{item.pct}%</span>
          <div className="flex-1 h-7 bg-[#141009]/60 rounded-sm overflow-hidden border border-[#E0C68C]/10">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ delay: i * 0.05 + 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              viewport={{ once: true }}
              className="h-full rounded-sm flex items-center px-2"
              style={{ backgroundColor: item.color || "#E0C68C" }}
            >
              <span className="text-[10px] font-mono text-[#141009] font-bold truncate">{item.label}</span>
            </motion.div>
          </div>
          <span className="text-xs font-mono text-[#F1EADB]/50 w-6 shrink-0">{item.value}</span>
        </motion.div>
      ))}
    </div>
  );
}

type TabId = "monsters" | "money" | "origins" | "protocols" | "environments";

export default function ScenarioIntelligence() {
  const [activeTab, setActiveTab] = useState<TabId>("monsters");

  const tabs: { id: TabId; label: string }[] = [
    { id: "monsters", label: "Psychological Monsters" },
    { id: "money", label: "Financial Stress" },
    { id: "origins", label: "Monster Origins" },
    { id: "protocols", label: "Intervention Protocols" },
    { id: "environments", label: "4-Quadrant Environments" },
  ];

  return (
    <div className="min-h-screen bg-[#141009] text-[#F1EADB]">
      <PublicHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-mono tracking-[0.3em] uppercase text-[#E0C68C]/60 mb-4"
          >
            200 Realistic Scenarios Analyzed
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#F1EADB] mb-6 leading-[1.1]"
          >
            Scenario Intelligence
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#F1EADB]/70 max-w-2xl mx-auto leading-relaxed"
          >
            What do 200 people struggling with cognitive-emotional system overload actually look like?
            These are the patterns underneath the patterns — the monsters, the money, and the protocols
            that work.
          </motion.p>

          {/* Key stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto"
          >
            <div className="border border-[#E0C68C]/20 rounded-sm p-4">
              <div className="text-2xl font-serif text-[#E0C68C]">200</div>
              <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Scenarios</div>
            </div>
            <div className="border border-[#E0C68C]/20 rounded-sm p-4">
              <div className="text-2xl font-serif text-[#E0C68C]">12</div>
              <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Monster Types</div>
            </div>
            <div className="border border-[#E0C68C]/20 rounded-sm p-4">
              <div className="text-2xl font-serif text-[#E0C68C]">65.5%</div>
              <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Surviving</div>
            </div>
            <div className="border border-[#E0C68C]/20 rounded-sm p-4">
              <div className="text-2xl font-serif text-[#E0C68C]">90.5%</div>
              <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Financial Precarity</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="px-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center border-b border-[#E0C68C]/10 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-mono rounded-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[#E0C68C]/15 text-[#E0C68C] border border-[#E0C68C]/30"
                    : "text-[#F1EADB]/50 hover:text-[#F1EADB]/80 border border-transparent hover:border-[#E0C68C]/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          {activeTab === "monsters" && (
            <motion.div
              key="monsters"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="font-serif text-2xl text-[#F1EADB] mb-2">The 12 Psychological Monsters</h2>
                <p className="text-sm text-[#F1EADB]/60 max-w-2xl">
                  Every person has a "monster" — an adaptive pattern that once protected them but now holds them back.
                  These aren't diagnoses. They're behavioral operating systems running outdated code.
                </p>
              </div>

              <BarChart
                data={monsterData.map(m => ({ label: m.name, value: m.count, pct: m.pct, color: m.color }))}
                maxValue={26}
              />

              <div className="mt-10 grid md:grid-cols-2 gap-4">
                {monsterData.slice(0, 6).map((m, i) => (
                  <motion.div
                    key={m.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="border border-[#E0C68C]/15 rounded-sm p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-mono text-sm text-[#E0C68C]">{m.name}</h3>
                      <span className="text-xs font-mono text-[#F1EADB]/40">{m.pct}%</span>
                    </div>
                    <p className="text-xs text-[#F1EADB]/50">
                      <span className="text-[#F1EADB]/70">What it wants:</span> {m.wants}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 border border-[#E0C68C]/10 rounded-sm p-6 bg-[#E0C68C]/5">
                <h3 className="font-mono text-sm text-[#E0C68C] mb-3">The Meta-Pattern</h3>
                <p className="text-sm text-[#F1EADB]/70 leading-relaxed">
                  The top 3 monsters — executive overload, avoidance, and shame — account for <strong className="text-[#E0C68C]">34.5%</strong> of all cases.
                  All 12 monsters share one thing: they were once adaptive. The shame loop protected you from further rejection.
                  The hypervigilance kept you safe in an unsafe home. The avoidance habit prevented overwhelm when you had no resources.
                  The problem isn't that you have a monster. The problem is that the monster is still running a program designed for a world you no longer live in.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "money" && (
            <motion.div
              key="money"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="font-serif text-2xl text-[#F1EADB] mb-2">Financial Stress Distribution</h2>
                <p className="text-sm text-[#F1EADB]/60 max-w-2xl">
                  90.5% of people in this dataset experience some form of financial precarity.
                  Only 5.5% have "some extra money." Financial intelligence isn't optional — it's survival.
                </p>
              </div>

              <BarChart
                data={moneyData.map(m => ({ label: m.situation, value: m.count, pct: m.pct, color: "#E0C68C" }))}
                maxValue={29}
              />

              <div className="mt-10 grid md:grid-cols-3 gap-4">
                <div className="border border-red-500/20 rounded-sm p-4 bg-red-500/5">
                  <div className="text-2xl font-serif text-red-400">45.5%</div>
                  <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Active financial distress</div>
                  <p className="text-xs text-[#F1EADB]/40 mt-2">Behind on bills, paycheck to paycheck, barely breaking even, volatile cash flow</p>
                </div>
                <div className="border border-yellow-500/20 rounded-sm p-4 bg-yellow-500/5">
                  <div className="text-2xl font-serif text-yellow-400">37.5%</div>
                  <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Fragile stability</div>
                  <p className="text-xs text-[#F1EADB]/40 mt-2">Stable but no cushion, saving slowly, windfall but no system, debt consolidation</p>
                </div>
                <div className="border border-green-500/20 rounded-sm p-4 bg-green-500/5">
                  <div className="text-2xl font-serif text-green-400">15%</div>
                  <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Adequate resources</div>
                  <p className="text-xs text-[#F1EADB]/40 mt-2">Enough for family outings, some extra money this month</p>
                </div>
              </div>

              <div className="mt-8 border border-[#E0C68C]/10 rounded-sm p-6 bg-[#E0C68C]/5">
                <h3 className="font-mono text-sm text-[#E0C68C] mb-3">Why This Matters</h3>
                <p className="text-sm text-[#F1EADB]/70 leading-relaxed">
                  Financial stress isn't just about money. It impairs executive function, increases cortisol,
                  disrupts sleep, and makes every other intervention harder to stick. This is why <strong className="text-[#E0C68C]">"stabilize sleep, then money, then communication"</strong> is
                  the most common first protocol. You can't think clearly about your relationships when you're
                  wondering how to make rent.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "origins" && (
            <motion.div
              key="origins"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="font-serif text-2xl text-[#F1EADB] mb-2">Where Monsters Come From</h2>
                <p className="text-sm text-[#F1EADB]/60 max-w-2xl">
                  Every monster has an origin story. Understanding where yours came from doesn't excuse it —
                  it explains why it made sense at the time, and why it no longer does.
                </p>
              </div>

              <BarChart
                data={originData.map(o => ({ label: o.origin, value: o.count, pct: o.pct, color: "#E0C68C" }))}
                maxValue={38}
              />

              <div className="mt-10 space-y-4">
                {originData.map((o, i) => (
                  <motion.div
                    key={o.origin}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="border-l-2 border-[#E0C68C]/30 pl-4 py-2"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-mono text-sm text-[#E0C68C]">{o.origin}</h3>
                      <span className="text-xs font-mono text-[#F1EADB]/40">{o.count} scenarios ({o.pct}%)</span>
                    </div>
                    <p className="text-xs text-[#F1EADB]/50 mt-1">
                      {o.origin === "Medical Trauma" && "Hospitalization, chronic illness, surgery, or medical emergency that disrupted normal development and created hypervigilance or financial panic."}
                      {o.origin === "Attachment Injury" && "Early relational disruption — absent parent, inconsistent caregiving, or betrayal by a trusted figure. Creates identity collapse and control patterns."}
                      {o.origin === "Work Trauma" && "Burnout, toxic management, sudden job loss, or workplace harassment. Generates executive overload and procrastination as protective withdrawal."}
                      {o.origin === "Poverty Stress" && "Growing up without enough, or sudden economic collapse in adulthood. Produces financial panic and scarcity-based decision-making."}
                      {o.origin === "Childhood Chaos" && "Unpredictable home environment — addiction, violence, moving frequently. Creates avoidance habits and all-or-nothing thinking."}
                      {o.origin === "Family Conflict" && "Ongoing family dysfunction — enmeshment, triangulation, loyalty binds. Generates shame loops and family enmeshment patterns."}
                      {o.origin === "School Failure" && "Academic struggles, learning disabilities, social rejection in school. Creates learned helplessness and identity collapse around competence."}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 border border-[#E0C68C]/10 rounded-sm p-6 bg-[#E0C68C]/5">
                <h3 className="font-mono text-sm text-[#E0C68C] mb-3">The System Failure Insight</h3>
                <p className="text-sm text-[#F1EADB]/70 leading-relaxed">
                  Medical trauma (19%) + poverty stress (14.5%) = <strong className="text-[#E0C68C]">33.5%</strong> of all monster origins.
                  These aren't personal failures — they're system failures. Healthcare and economic systems
                  are the primary generators of psychological monsters in adults. The person didn't break themselves.
                  The system broke them, and now they're running adaptive code that no longer fits.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "protocols" && (
            <motion.div
              key="protocols"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="font-serif text-2xl text-[#F1EADB] mb-2">Intervention Protocols</h2>
                <p className="text-sm text-[#F1EADB]/60 max-w-2xl">
                  Four protocols cover the entire 200-scenario field. The right one depends on which monster
                  is running and what the person's strengths are.
                </p>
              </div>

              <div className="space-y-6">
                {protocols.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="border border-[#E0C68C]/20 rounded-sm p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full border border-[#E0C68C]/40 flex items-center justify-center shrink-0">
                        <span className="text-sm font-mono text-[#E0C68C]">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-lg text-[#E0C68C] mb-2">{p.name}</h3>
                        <p className="text-sm text-[#F1EADB]/70 leading-relaxed mb-3">{p.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[#F1EADB]/40">Best for:</span>{" "}
                            <span className="text-[#E0C68C]/80">{p.bestFor}</span>
                          </div>
                          <div>
                            <span className="text-[#F1EADB]/40">Success signal:</span>{" "}
                            <span className="text-green-400/80">{p.signal}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 border border-[#E0C68C]/10 rounded-sm p-6 bg-[#E0C68C]/5">
                <h3 className="font-mono text-sm text-[#E0C68C] mb-3">Maintenance Cadence</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-serif text-[#E0C68C]">36.5%</div>
                    <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Biweekly</div>
                  </div>
                  <div>
                    <div className="text-xl font-serif text-[#E0C68C]">34%</div>
                    <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Quarterly</div>
                  </div>
                  <div>
                    <div className="text-xl font-serif text-[#E0C68C]">29.5%</div>
                    <div className="text-xs font-mono text-[#F1EADB]/50 mt-1">Monthly</div>
                  </div>
                </div>
                <p className="text-xs text-[#F1EADB]/50 mt-4 text-center">
                  No one is "cured." Everyone is maintained. The question is how often you need recalibration.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "environments" && (
            <motion.div
              key="environments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="font-serif text-2xl text-[#F1EADB] mb-2">4-Quadrant AQAL Environments</h2>
                <p className="text-sm text-[#F1EADB]/60 max-w-2xl">
                  Every intervention operates across four quadrants simultaneously. The upper-left is your inner world.
                  The upper-right is your behavior. The lower-left is your relationships. The lower-right is your systems.
                  Miss any quadrant and the intervention collapses.
                </p>
              </div>

              {/* Quadrant diagram */}
              <div className="grid grid-cols-2 gap-px bg-[#E0C68C]/20 rounded-sm overflow-hidden mb-10 max-w-lg mx-auto">
                <div className="bg-[#141009] p-5">
                  <div className="text-xs font-mono text-[#E0C68C]/60 mb-1">UL — Interior Individual</div>
                  <div className="text-sm text-[#F1EADB]/80">Intrapersonal / Identity</div>
                  <div className="text-xs text-[#F1EADB]/40 mt-1">Journaling, shadow work, values clarity, metacognition</div>
                </div>
                <div className="bg-[#141009] p-5">
                  <div className="text-xs font-mono text-[#E0C68C]/60 mb-1">UR — Exterior Individual</div>
                  <div className="text-sm text-[#F1EADB]/80">Behavioral / Habit Design</div>
                  <div className="text-xs text-[#F1EADB]/40 mt-1">Routines, body checks, schedules, habit design</div>
                </div>
                <div className="bg-[#141009] p-5">
                  <div className="text-xs font-mono text-[#E0C68C]/60 mb-1">LL — Interior Collective</div>
                  <div className="text-sm text-[#F1EADB]/80">Relational / Cultural</div>
                  <div className="text-xs text-[#F1EADB]/40 mt-1">Accountability, family meetings, community, partner check-ins</div>
                </div>
                <div className="bg-[#141009] p-5">
                  <div className="text-xs font-mono text-[#E0C68C]/60 mb-1">LR — Exterior Collective</div>
                  <div className="text-sm text-[#F1EADB]/80">Systems / Structural</div>
                  <div className="text-xs text-[#F1EADB]/40 mt-1">Dashboards, automation, financial scaffolding, metric boards</div>
                </div>
              </div>

              <div className="space-y-4">
                {quadrantEnvironments.map((env, i) => (
                  <motion.div
                    key={env.pattern}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    viewport={{ once: true }}
                    className="border border-[#E0C68C]/15 rounded-sm p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-mono text-[#E0C68C]/60">Pattern {i + 1}</span>
                      <span className="text-xs text-[#F1EADB]/40">—</span>
                      <span className="text-xs text-[#F1EADB]/60">{env.targets}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-[#E0C68C]/5 rounded-sm p-2">
                        <span className="font-mono text-[#E0C68C]/70">UL:</span>
                        <span className="text-[#F1EADB]/60 ml-1">{env.ul}</span>
                      </div>
                      <div className="bg-[#E0C68C]/5 rounded-sm p-2">
                        <span className="font-mono text-[#E0C68C]/70">UR:</span>
                        <span className="text-[#F1EADB]/60 ml-1">{env.ur}</span>
                      </div>
                      <div className="bg-[#E0C68C]/5 rounded-sm p-2">
                        <span className="font-mono text-[#E0C68C]/70">LL:</span>
                        <span className="text-[#F1EADB]/60 ml-1">{env.ll}</span>
                      </div>
                      <div className="bg-[#E0C68C]/5 rounded-sm p-2">
                        <span className="font-mono text-[#E0C68C]/70">LR:</span>
                        <span className="text-[#F1EADB]/60 ml-1">{env.lr}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
