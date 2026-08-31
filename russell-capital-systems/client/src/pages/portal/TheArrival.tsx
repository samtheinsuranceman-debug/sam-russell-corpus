// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// THE ARRIVAL — Sacred Seven #1
// Onboarding + NLP calibration entry + first somatic orientation.
// Front-end first. Wire each step to `tutorial_progress` (questionnaireAnswers,
// completedSections, currentStep, score, badges) and emit `advisor_goals` +
// `ai_memory_notes` on completion.
// ───────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Sparkles, HeartPulse, Compass, Target, Award, ArrowRight, ArrowLeft, Check,
} from "lucide-react";
import { GENOME, GlowCard, GenomeOrb, GenomeBackdrop, SectionLabel } from "./_genome/GenomeKit";

const STEPS = [
  { id: "entry",       label: "Entry" },
  { id: "context",     label: "Context" },
  { id: "risk",        label: "Risk / Reward" },
  { id: "somatic",     label: "Somatic Orientation" },
  { id: "calibration", label: "First Calibration" },
  { id: "goals",       label: "Goal Declaration" },
  { id: "ritual",      label: "Completion" },
];

export default function TheArrival() {
  const [step, setStep] = useState(0);
  const [anchored, setAnchored] = useState(false);
  const [ctx, setCtx] = useState({ name: "", role: "", homeValue: "", mortgage: "" });
  const [risk, setRisk] = useState(5);
  const [goal, setGoal] = useState({ type: "AUM_TARGET", amount: "", period: "12 months" });

  const pct = Math.round((step / (STEPS.length - 1)) * 100);
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <AppShell title="The Arrival" subtitle="From financial fear into clear, confident, multi-generational action">
      <div className="relative mx-auto max-w-4xl">
        <GenomeBackdrop />

        {/* Step rail */}
        <div className="relative mb-8">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel icon={Compass}>The Arrival · Step {step + 1} of {STEPS.length}</SectionLabel>
            <span className="text-xs text-slate-400">{STEPS[step].label}</span>
          </div>
          <Progress value={pct} className="h-1.5" />
          <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`rounded-full px-2.5 py-1 text-[10px] tracking-wide transition-colors ${
                  i < step ? "bg-violet-500/20 text-violet-200"
                  : i === step ? "bg-violet-500/40 text-white"
                  : "bg-white/5 text-slate-500"
                }`}
              >
                {i < step ? <Check className="mr-1 inline h-3 w-3" /> : null}{s.label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            {step === 0 && (
              <GlowCard className="overflow-hidden">
                <div className="relative px-8 py-14 text-center" style={{ background: GENOME.gradient }}>
                  <div className="mx-auto mb-6 flex justify-center"><GenomeOrb size={120} label="Begin" pulsing /></div>
                  <h2 className="mx-auto max-w-xl text-3xl font-semibold leading-tight text-white">
                    You weren't given a spirit of fear — but of power, of love, and of a sound mind.
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-300">
                    The Arrival is a calibration experience, not a quiz. Over the next few minutes
                    we'll map your starting point, anchor your body, and set your first goals. You can
                    pause and resume from anywhere — your progress is saved at every step.
                  </p>
                  <Button onClick={next} className="mt-8 bg-violet-500 hover:bg-violet-400">
                    Enter the calibration <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </GlowCard>
            )}

            {step === 1 && (
              <GlowCard className="p-8">
                <SectionLabel icon={Sparkles}>Basic Context</SectionLabel>
                <h3 className="mt-2 text-xl font-semibold text-white">Tell us where you stand today</h3>
                <p className="mt-1 text-sm text-slate-400">Optional, but high-signal. This shapes the rest of your journey.</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Your name"><Input value={ctx.name} onChange={(e) => setCtx({ ...ctx, name: e.target.value })} placeholder="Dr. Jane Russell" /></Field>
                  <Field label="Role / specialty"><Input value={ctx.role} onChange={(e) => setCtx({ ...ctx, role: e.target.value })} placeholder="Anesthesiology" /></Field>
                  <Field label="Home value"><Input value={ctx.homeValue} onChange={(e) => setCtx({ ...ctx, homeValue: e.target.value })} placeholder="$1,200,000" /></Field>
                  <Field label="Mortgage balance"><Input value={ctx.mortgage} onChange={(e) => setCtx({ ...ctx, mortgage: e.target.value })} placeholder="$640,000" /></Field>
                </div>
                <NavRow onBack={back} onNext={next} />
              </GlowCard>
            )}

            {step === 2 && (
              <GlowCard className="p-8">
                <SectionLabel icon={Target}>Risk / Reward Baseline</SectionLabel>
                <h3 className="mt-2 text-xl font-semibold text-white">How do you move toward a decision?</h3>
                <p className="mt-1 text-sm text-slate-400">Slide toward the instinct that feels most true right now.</p>
                <div className="mt-8">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Protect what I have</span><span>Pursue the upside</span>
                  </div>
                  <input
                    type="range" min={0} max={10} value={risk}
                    onChange={(e) => setRisk(Number(e.target.value))}
                    className="mt-3 w-full accent-violet-500"
                  />
                  <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/5 p-4 text-sm text-slate-300">
                    Your risk/reward signature: <span className="font-semibold text-violet-200">{riskLabel(risk)}</span>.
                    This travels with you across The Strategy Table and The Map.
                  </div>
                </div>
                <NavRow onBack={back} onNext={next} />
              </GlowCard>
            )}

            {step === 3 && (
              <GlowCard className="p-8 text-center">
                <SectionLabel icon={HeartPulse} className="justify-center">Somatic + NLP Orientation</SectionLabel>
                <h3 className="mt-2 text-xl font-semibold text-white">Find the sternum-click</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                  Press and breathe. Feel gravity gather at your center. When you're ready, declare it.
                </p>
                <div className="my-8 flex justify-center">
                  <GenomeOrb size={150} active={anchored} pulsing label={anchored ? "I AM a unified field" : "Tap & breathe"} onClick={() => setAnchored(true)} />
                </div>
                {anchored && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-violet-200">
                    Anchor set · cool · sharp · light
                  </motion.p>
                )}
                <NavRow onBack={back} onNext={next} nextDisabled={!anchored} nextLabel="Anchored — continue" />
              </GlowCard>
            )}

            {step === 4 && (
              <GlowCard className="p-8">
                <SectionLabel icon={Sparkles}>First 200-Question NLP Block · Foundation</SectionLabel>
                <h3 className="mt-2 text-xl font-semibold text-white">Body mapping · Time · Agency · Honesty</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Your Foundation block calibrates self-awareness across eight domains. It's modular and
                  resumable — part of the journey toward the full 5,000-question corpus.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {["Internal Senses / Body Mapping","Time & Temporality","Agency & Decision Ownership","Honesty / Humility Limits"].map((d) => (
                    <div key={d} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-200">
                      {d}<span className="text-[10px] uppercase tracking-wider text-violet-300/70">50 q</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">On completion this writes to <code className="text-violet-300/80">tutorial_progress</code> and appends an <code className="text-violet-300/80">ai_memory_notes</code> entry (source: NLP_Calibration_Block_1).</p>
                <NavRow onBack={back} onNext={next} nextLabel="Log Foundation block" />
              </GlowCard>
            )}

            {step === 5 && (
              <GlowCard className="p-8">
                <SectionLabel icon={Target}>Goal Declaration</SectionLabel>
                <h3 className="mt-2 text-xl font-semibold text-white">Name what you're moving toward</h3>
                <div className="mt-6 grid gap-5 sm:grid-cols-3">
                  <Field label="Goal type">
                    <select value={goal.type} onChange={(e) => setGoal({ ...goal, type: e.target.value })}
                      className="h-9 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white">
                      <option className="bg-slate-900" value="AUM_TARGET">AUM Target</option>
                      <option className="bg-slate-900" value="DEALS_CLOSED">Deals Closed</option>
                      <option className="bg-slate-900" value="NEW_CLIENTS">New Clients</option>
                      <option className="bg-slate-900" value="REVENUE">Revenue</option>
                    </select>
                  </Field>
                  <Field label="Target"><Input value={goal.amount} onChange={(e) => setGoal({ ...goal, amount: e.target.value })} placeholder="$5,000,000" /></Field>
                  <Field label="Period"><Input value={goal.period} onChange={(e) => setGoal({ ...goal, period: e.target.value })} /></Field>
                </div>
                <p className="mt-4 text-xs text-slate-500">Creates 1–3 <code className="text-violet-300/80">advisor_goals</code> with period + dates.</p>
                <NavRow onBack={back} onNext={next} nextLabel="Declare goal" />
              </GlowCard>
            )}

            {step === 6 && (
              <GlowCard className="overflow-hidden">
                <div className="relative px-8 py-12 text-center" style={{ background: GENOME.gradient }}>
                  <Award className="mx-auto h-12 w-12 text-violet-300" />
                  <h3 className="mt-4 text-2xl font-semibold text-white">Calibration complete{ctx.name ? `, ${ctx.name.split(" ")[0]}` : ""}</h3>
                  <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
                    <RitualStat label="Calibration" value="72" />
                    <RitualStat label="XP earned" value="+150" />
                    <RitualStat label="Badges" value="3" />
                  </div>
                  <p className="mx-auto mt-6 max-w-md text-sm text-slate-300">
                    Your somatic signature and first insights are saved to memory. From here, step into
                    The Mirror — and return to The Field 3–5× a day to keep your field unified.
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Link href="/portal/the-mirror"><Button className="bg-violet-500 hover:bg-violet-400">Enter The Mirror <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                    <Link href="/portal/the-field"><Button variant="outline" className="border-white/15">Daily check-in</Button></Link>
                  </div>
                </div>
              </GlowCard>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-400">{label}</Label>
      {children}
    </div>
  );
}
function NavRow({ onBack, onNext, nextDisabled, nextLabel = "Continue" }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
      <Button onClick={onNext} disabled={nextDisabled} className="bg-violet-500 hover:bg-violet-400">{nextLabel} <ArrowRight className="ml-2 h-4 w-4" /></Button>
    </div>
  );
}
function RitualStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-violet-200/70">{label}</p>
    </div>
  );
}
function riskLabel(v) {
  if (v <= 2) return "Capital Preserver";
  if (v <= 4) return "Measured Builder";
  if (v <= 6) return "Balanced Calibrator";
  if (v <= 8) return "Growth Seeker";
  return "Conviction Maximizer";
}
