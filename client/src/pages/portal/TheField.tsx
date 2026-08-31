// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// THE FIELD — Sacred Seven #4 · Doctor Buddy core
// Chat + somatic daily check-ins, pre-decision self-talk audio, 3–5x daily
// prompts, gamified social score (crown >75 / black eye <50). Persists to
// ai_memory_notes (source: field_audio / field_checkin). Buddy replies are
// canned client-side for now — wire to the AI brain / tRPC later.
// ───────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mic, Send, Crown, Eye, HeartPulse, Sparkles, CheckCircle2 } from "lucide-react";
import { GENOME, GlowCard, GenomeOrb, GenomeBackdrop, SectionLabel } from "./_genome/GenomeKit";

const PROMPTS = [
  "What decision am I facing right now, and what does my body say about it?",
  "Where is the gravity in my chest — is the field unified or scattered?",
  "What am I only 60% certain of today, and am I willing to say so?",
  "Name one toward-motivation move I can make before noon.",
];
const BUDDY = [
  "Good. Locate the sternum-click before you answer me. Cool, sharp, light?",
  "Notice the away-motivation in that. What would the toward version sound like?",
  "That's honest. I'm logging it. Your reputation moves when your words match your body.",
  "From the unified field — what's the smallest true next step?",
];

export default function TheField() {
  const [messages, setMessages] = useState([
    { from: "buddy", text: "I'm here. Before we talk numbers — feel the weight at the center of your chest. Tap the orb when the field is unified." },
  ]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [anchored, setAnchored] = useState(false);
  const [doneToday, setDoneToday] = useState(2);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const send = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages((m) => [...m, { from: "me", text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "buddy", text: BUDDY[m.length % BUDDY.length] }]);
    }, 600);
  };

  const reputation = 78;

  return (
    <AppShell title="The Field" subtitle="Doctor Buddy — daily embodiment, before every decision">
      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
        <GenomeBackdrop />

        {/* Chat */}
        <GlowCard className="flex h-[600px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
            <div className="flex items-center gap-2">
              <GenomeOrb size={34} pulsing={false} label="" />
              <div>
                <p className="text-sm font-semibold text-white">Doctor Buddy</p>
                <p className="text-[11px] text-emerald-300">Present · remembers you</p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-300/30 text-amber-200"><Crown className="mr-1 h-3 w-3" /> Crown tier</Badge>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.from === "me" ? "bg-violet-500/30 text-white" : "border border-white/10 bg-white/[0.03] text-slate-200"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {PROMPTS.slice(0, 2).map((p) => (
                <button key={p} onClick={() => send(p)} className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-slate-400 hover:border-violet-400/40 hover:text-violet-200">
                  {p.length > 42 ? p.slice(0, 42) + "…" : p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon" variant="outline"
                onClick={() => { setRecording((r) => !r); if (recording) { setSeconds(0); send("(recorded pre-decision self-talk)"); } }}
                className={`shrink-0 border-white/15 ${recording ? "bg-red-500/20 text-red-300" : ""}`}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={recording ? `Recording… ${seconds}s` : input}
                disabled={recording}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Speak to Buddy from the unified field…"
              />
              <Button size="icon" onClick={() => send()} className="shrink-0 bg-violet-500 hover:bg-violet-400"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </GlowCard>

        {/* Side rail */}
        <div className="space-y-6">
          <GlowCard className="p-6 text-center">
            <SectionLabel icon={HeartPulse} className="justify-center">Somatic check-in</SectionLabel>
            <div className="my-5 flex justify-center">
              <GenomeOrb size={120} active={anchored} label={anchored ? "Unified" : "Tap & breathe"} onClick={() => { setAnchored(true); setDoneToday((d) => d + 1); }} />
            </div>
            <p className="text-xs text-slate-400">{anchored ? "Logged to ai_memory_notes (field_checkin)" : "Sternum-click · gravity at center"}</p>
          </GlowCard>

          <GlowCard className="p-6">
            <SectionLabel icon={Crown}>Social score</SectionLabel>
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-2xl font-semibold text-white">
                {reputation >= 75 ? <Crown className="h-5 w-5 text-amber-300" /> : reputation < 50 ? <Eye className="h-5 w-5 text-rose-400" /> : null}
                {reputation}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full" style={{ width: `${reputation}%`, background: reputation >= 75 ? "#f5b14c" : GENOME.accent }} />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Crown above 75 · black eye below 50. Earned by matching word to body.</p>
          </GlowCard>

          <GlowCard className="p-6">
            <SectionLabel icon={Sparkles}>Today's rhythm</SectionLabel>
            <p className="mt-2 text-sm text-slate-300">{doneToday} of 5 check-ins complete</p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < doneToday ? "bg-violet-500" : "bg-white/8"}`} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {PROMPTS.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${i < doneToday ? "text-emerald-400" : "text-slate-600"}`} />
                  {p}
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      </div>
    </AppShell>
  );
}
