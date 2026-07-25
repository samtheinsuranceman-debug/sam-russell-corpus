import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Mic, MicOff, ArrowRight, ArrowLeft, Check, SkipForward, Lock, Star, Users, Zap, Shield, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { beginAuth } from "@/lib/agreement";
import { playComplete, playClick } from "@/lib/audio";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AssessmentResumeDialog from "@/components/AssessmentResumeDialog";
import { ALL_AXES } from "@shared/axisModes";
import { cohortAdjustedScore, generationForBirthYear, type Generation } from "@shared/cohort";
import { GOALS_QUESTION_IDS, GOALS_QUESTION_INDICES } from "@shared/goalsQuestions";

// ============================================================
// ASSESSMENT QUESTIONS — 24 open-ended voice prompts
// Optimized sequence: maximum momentum, trust-building, elicitation
// ============================================================
const QUESTIONS_SOURCE: {
  id: number;
  title: string;
  text: string;
  dimension: string;
  axes: number[];
  skippable?: boolean;
  skipLabel?: string;
  // Companion mode: private questions where a partner in the room would suppress
  // honesty (impression management). These stay solo even in companion mode.
  soloOnly?: boolean;
}[] = [
  {
    id: 1,
    title: "The Theme Park",
    text: "You're handed a theme park and a blank check to add three rides that don't exist anywhere. Build the first one — walk me through what it feels like to ride it. What's the one that's a little dangerous? What's the one nobody expects?",
    dimension: "Imaginative Design",
    axes: [22, 25, 2, 15, 17, 10, 27],
  },
  {
    id: 2,
    title: "The Superpower Trial",
    text: "You test-drive a different superpower every day this week — flight, invisibility, super-strength, telepathy, teleportation, healing touch, and one you invent for Sunday. Which day are you most excited for, and what's the first thing you do that morning? Which one do you keep forever?",
    dimension: "Playful Agency",
    axes: [4, 17, 6, 19, 5, 15, 27],
  },
  {
    id: 3,
    title: "The Jet",
    text: "You're given $25 million and a private jet for 72 hours with zero consequences. The only rule: create one unforgettable experience involving water, music, and at least three people you've never met. Walk me through the whole 72 hours — where you go, what you invent, how the days and nights feel, and who you are by the end.",
    dimension: "Big-Sandbox Strategy",
    axes: [17, 25, 11, 31, 14, 15, 29],
  },
  {
    id: 4,
    title: "The Road Trip",
    text: "Unlimited money, one month, any vehicle you want, and you can pick up anyone along the way. Where does the trip start, and where's it pointed? What's the vehicle? Who's riding shotgun? What's the first detour you take that wasn't on the map?",
    dimension: "Freedom & Momentum",
    axes: [19, 11, 17, 25, 2, 15, 4],
  },
  {
    id: 5,
    title: "The App That Prints Money",
    text: "You've got the product everyone's obsessed with in five years. Pitch it to me right now like I'm about to write the check — what's it called, what problem does it kill, and why hasn't anyone built it yet?",
    dimension: "Entrepreneurial Vision",
    axes: [17, 31, 21, 0, 26, 10, 25],
  },
  {
    id: 6,
    title: "Parallel Dinner",
    text: "A secret midnight dinner for six, each guest a different version of you from a parallel life: one richer, one freer, one softer, one more dangerous, one who took a completely different path, one who stayed. Describe the table and the atmosphere. What conversation breaks out once it gets real? Which version surprises everyone — including you — and what happens after that surprise?",
    dimension: "Identity & Story",
    axes: [6, 11, 8, 7, 3, 27, 5],
  },
  {
    id: 7,
    title: "The Island",
    text: "You wake up and you've been given a private island the size of Manhattan, $80 million that can only be spent developing it, and 180 days before the first guests arrive. Walk me through the first two weeks. What do you build or create first? How many people do you bring early, and who are they? What secret rule or atmosphere do you invent that only the island itself seems to know? What happens when the first unexpected problem shows up?",
    dimension: "World-Building",
    axes: [2, 17, 30, 22, 31, 1, 16],
  },
  {
    id: 8,
    title: "The Casino Night",
    text: "Tonight the games are rigged in your favor — but only if you read the odds right. Which table do you sit at first? How do you bet — big swings or steady grind? When do you cash out and walk? What does the way you play the table say about you?",
    dimension: "Risk & Reading Odds",
    axes: [1, 0, 17, 31, 23, 13, 5],
  },
  {
    id: 9,
    title: "System Redesign",
    text: "You get to redesign one major system in the world — money, dating, cities, time, education, or desire — for one full year. Which do you pick, and what's the first wild, beautiful, slightly chaotic version you build? What does a normal Tuesday feel like inside it?",
    dimension: "Systems & Philosophy",
    axes: [21, 17, 22, 9, 0, 25, 8],
  },
  {
    id: 10,
    title: "The Zoo of Impossible Animals",
    text: "You run a zoo that only holds animals that don't exist. Fill the first enclosure — what goes in, and what does the crowd do when they see it? What's the one that's a little scary? What do you feed them, and how does the whole place stay alive?",
    dimension: "Creative Systems",
    axes: [16, 22, 25, 2, 21, 10, 27],
  },
  {
    id: 11,
    title: "The Half-Million Build",
    text: "$500,000, 48 hours, and one other person. You're going to build or make something real. What are you building? Describe it to me like you're already standing inside it. How do you spend the money — what do you buy, find, invent, or hire? Hour one, first move — go.",
    dimension: "Hands-On Creation",
    axes: [22, 2, 17, 31, 15, 30, 18],
  },
  {
    id: 12,
    title: "One Hundred Million",
    text: "$100 million, released — spent or given away — within 30 days. No investing, no saving. The only rule: by the end you feel more alive than you ever have. How do you release the first big wave in the opening 48 hours? How do your patterns — spending vs. giving — shift across the four weeks? What changes inside you that changes how you handle the later money?",
    dimension: "Money & Meaning",
    axes: [31, 17, 1, 12, 8, 19, 5],
  },
  {
    id: 13,
    title: "The Blueprint",
    text: "Dream out loud with me — if you literally could not fail, what are you actually chasing? Say the first few that jump to mind: the money-and-work stuff, the people you love, your health and body, the legacy or spiritual side — whatever's real. For each one, ballpark when you want it — a few years, ten, someday. And the part that matters most: under each, why — what's the real reason it made your list? Start with whatever's loudest and just keep talking.",
    dimension: "Goals & Values",
    axes: [17, 4, 31, 8, 6, 5, 9],
  },
  {
    id: 14,
    title: "The Seven Perfect Things",
    text: "Picture your life a few years out and seven things are just completely dialed in — your version of perfect, not fantasy-perfect. Say the first seven that come to mind, fast, out loud — the work, the money, the people, the body, the home, the everyday, whatever's yours. Don't overthink the order. Which one, if you're honest, matters more than all the rest? And which one surprised you by making the list?",
    dimension: "Life Vision",
    axes: [6, 8, 4, 17, 25, 31, 7],
  },
  {
    id: 15,
    title: "The Dream Concert",
    text: "You throw one impossible concert — any artists, any era, alive or dead, your stage, your crowd, your city. Who opens? Who headlines? Where's it held, and what's the moment the whole crowd loses its mind?",
    dimension: "Sound & Spectacle",
    axes: [14, 25, 30, 11, 17, 2, 4],
  },
  {
    id: 16,
    title: "The Mentor Windfall",
    text: "You're given $20 million and one year, one mission: take a young person with raw talent and zero resources and change the whole trajectory of their life. Who do you pick? What do you pour in first — and what do you deliberately make them earn? What's the one lesson you make sure they carry for forty years? How do you know when to push and when to let them fall?",
    dimension: "Nurture & Legacy",
    axes: [28, 12, 17, 31, 26, 4, 10],
  },
  {
    id: 17,
    title: "Two People You Love",
    text: "Two people you love are in conflict, and each wants you on their side. First, get inside both: describe each one's real grievance so well they'd say 'yes — that's exactly it.' What's the thing neither is saying out loud? Now you get one private conversation with each. Here's the real game: can you open both their eyes enough that they actually understand each other — a resolution where both win? Walk me through how. And if it can't be saved cleanly — how do you tell?",
    dimension: "Peacemaking",
    axes: [12, 11, 5, 17, 3, 26, 9],
  },
  {
    id: 18,
    title: "The Negotiation",
    text: "You want something badly and the only person who can give it is a tough, sharp negotiator across the table. What's the thing you want? What's your opening move? What do you offer that they didn't expect? Where do you refuse to budge?",
    dimension: "Clean Competition",
    axes: [23, 17, 18, 26, 11, 13, 5],
  },
  {
    id: 19,
    title: "The Charm Offensive",
    text: "There's an inner circle — a family, a crew — that's wary of outsiders, and you've got one dinner to win them over. How do you walk in? What do you bring? What's the first thing you do to make them relax? What's the moment you know you're in?",
    dimension: "Presence & Warmth",
    axes: [29, 26, 12, 11, 13, 19, 25],
  },
  {
    id: 20,
    title: "The Goal Pre-Mortem",
    text: "Give me your top five or so real goals right now — the ones you'd actually chase if you got dead serious. Say them as they come. Now be honest: for each one, how hard is it really — a layup, an uphill climb, or a long shot? And here's the useful part — take your biggest one and name the three or four things most likely to sabotage it: the ways you've watched yourself trip before, or the stuff outside your control. Say them out loud now, so we can catch them coming.",
    dimension: "Goals & Pre-Mortem",
    axes: [17, 5, 4, 23, 20, 6, 31],
  },
  {
    id: 21,
    title: "The Peak-You Year",
    text: "One year from today you're going to be at your absolute peak — strongest, sharpest, most alive you've ever been — and it's entirely down to how you spend this year. What's the first thing you build or change this month? Who do you bring into your corner? What do you cut out completely? Walk me through an ordinary Tuesday at month three, month nine, and the anniversary.",
    dimension: "Building Yourself",
    axes: [4, 17, 20, 21, 19, 11, 5],
  },
  {
    id: 22,
    title: "The Underdog Bet",
    text: "Everyone says the thing you want to do is impossible — too late, too risky, not for someone like you. You decide to prove them dead wrong. What's the thing? Who's the loudest voice saying no? What's your very first move to start proving them wrong? What does it feel like the day it starts working?",
    dimension: "Grit & Proving Them Wrong",
    axes: [20, 4, 23, 17, 24, 19, 26],
  },
  {
    id: 23,
    title: "The Signature Move",
    text: "Everybody's got a thing they do better than the people around them — the way you tell a story, cook one dish, close a deal, fix a problem, calm a room. What's yours? Show me — walk me through you doing it at your absolute best. How'd you get that good without really trying?",
    dimension: "Mastery",
    axes: [15, 6, 25, 11, 5, 4, 7],
  },
  {
    id: 24,
    title: "The Founder's Grip",
    text: "You built something real from nothing — a little world that works. What is it, and where were you taking it? Now someone inside — loyal, shares the original vision — wants to pull it somewhere that doesn't sit right with you. What's driving them, really — ego, or a frustration with you that might be fair? Can you feel the difference in your body? At what point does the person who started something need to loosen their grip — and does that feel like wisdom or like loss?",
    dimension: "Vision & Letting Go",
    axes: [30, 17, 11, 5, 24, 4, 9],
  },
  {
    id: 25,
    title: "The Unsaid Thing",
    text: "There's something you've been carrying — for weeks, maybe years — that you need to say to someone. Not cruel, just true. What is it? Where do you feel the weight of it in your body? If you were going to say it, what are the exact words? Walk me through their face, their first response. And why haven't you said it yet — is it protecting them, or protecting you?",
    dimension: "Honest Voice",
    axes: [3, 12, 24, 6, 4, 11, 7],
    soloOnly: true,
  },
  {
    id: 26,
    title: "The Standing Ovation",
    text: "Fast-forward to a night, years from now, where a whole room is on its feet applauding you for something you actually did. What are they clapping for? Who's in the front row? What did it cost you to get there? What are you feeling as you stand there?",
    dimension: "Achievement & Cost",
    axes: [4, 8, 7, 20, 11, 25, 10],
  },
  {
    id: 27,
    title: "The Torch You Pass",
    text: "At the very end of a long, full life, you get to hand one thing to the people who come after you — a lesson, a value, a way of being, a single sentence. You're smiling. What do you pass them? Who's standing there to receive it? And what do you hope they do with it?",
    dimension: "Legacy",
    axes: [8, 28, 10, 7, 12, 4, 9],
  },
];

// ============================================================
// ELICITATION SEQUENCE — rapport → depth arc
// Disarm & warm up (novel, low-threat, universal) → pride & story → identity
// → intimacy → sacred crescendo. Fun openers make people over-disclose early,
// so momentum (and the signal) build before the deep questions arrive.
// Values are QUESTIONS_SOURCE ids, in display order.
// ============================================================
// Final 24, curated for maximum rapport + momentum + strength/growth signal.
// Arc 1 (1–12): disarm → delight/pride → story/agency → the "purpose" hook.
// Arc 2 (13–24): depth & sensory → heart → shadow/growth → sacred crescendo.
// All 24 are free; the evidence-based scoring method is what's gated.
// Retired for this build (still authored in QUESTIONS_SOURCE, just unsequenced):
//   2 The Natural, 3 The Flex, 4 The Negotiation, 6 The Read, 11 The Robbery,
//   12 The Tense Table, 13 The Wedding Chaos, 16 The Stranger — the weakest
//   overlaps / partner-or-married assumptions. Swapped in: 25–32.
const QUESTION_ORDER = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
];
const QUESTIONS = QUESTION_ORDER.map((id) => QUESTIONS_SOURCE.find((q) => q.id === id)!);

// Guard: the server identifies goals answers by their display-order position
// (shared/goalsQuestions.ts GOALS_QUESTION_INDICES). Assert those positions still
// point at the goals question ids, so reordering QUESTION_ORDER can't silently
// misroute the goals→coaching wiring.
if (import.meta.env.DEV) {
  GOALS_QUESTION_IDS.forEach((id, i) => {
    const pos = GOALS_QUESTION_INDICES[i];
    if (QUESTION_ORDER[pos] !== id) {
      // eslint-disable-next-line no-console
      console.error(
        `[assessment] goals-question drift: QUESTION_ORDER[${pos}] = ${QUESTION_ORDER[pos]}, expected ${id}. ` +
        `Update GOALS_QUESTION_INDICES in shared/goalsQuestions.ts.`,
      );
    }
  });
}

// All questions are free. The gate is on the evidence-based SCORING method
// (the verified, high-confidence report) — unlocked by payment or a beta code —
// not on the questions.
const TOTAL_QUESTIONS = QUESTIONS.length;

// ============================================================
// PER-ANSWER RICHNESS FEEDBACK — the momentum flywheel
// Rewards over-disclosure and teaches the behavior we want (talk more, go
// personal). It rates HOW MUCH you shared, never who you are, and the low tier
// is a warm invitation to say more — never a grade, never "weak".
// Signal available client-side: speaking duration (voice) / word count (text).
// ============================================================
type FeedbackTier = "seed" | "good" | "rich" | "gold";
const FEEDBACK_COPY: Record<FeedbackTier, { message: string }> = {
  gold: { message: "That was gold — we got a ton from that one. This is exactly it." },
  rich: { message: "Excellent — really rich. Keep telling it to us just like that." },
  good: { message: "Nice — and the details are where you really show up. Give us even more on the next one." },
  seed: { message: "There's clearly more to this one. Want to keep going or add a detail before we move on? Tap the mic to add to it." },
};
const FEEDBACK_STYLE: Record<FeedbackTier, string> = {
  gold: "border-primary/40 bg-primary/[0.06] text-primary",
  rich: "border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-300",
  good: "border-primary/15 bg-primary/[0.03] text-foreground/80",
  seed: "border-muted-foreground/20 bg-white/[0.02] text-muted-foreground",
};
function tierForDepth(depth: number): FeedbackTier {
  if (depth >= 0.85) return "gold";
  if (depth >= 0.5) return "rich";
  if (depth >= 0.25) return "good";
  return "seed";
}
// Momentum-generous but monotonic: ~2 min / ~150 words reads as "gold".
const voiceDepth = (durationSec: number) => Math.max(0, Math.min(1, durationSec / 120));
const textDepth = (words: number) => Math.max(0, Math.min(1, words / 175));

const AXIS_LABELS = ALL_AXES;

// ============================================================
// WAVEFORM VISUALIZER — Audio waves dancing like northern lights
// ============================================================
function WaveformVisualizer({ isRecording, analyserNode }: { isRecording: boolean; analyserNode: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!isRecording || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient line
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "rgba(216, 192, 138, 0.2)");
      gradient.addColorStop(0.5, "rgba(216, 192, 138, 0.7)");
      gradient.addColorStop(1, "rgba(216, 192, 138, 0.2)");

      ctx.lineWidth = 2;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Glow line (thicker, more transparent)
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(216, 192, 138, 0.12)";
      ctx.stroke();
    };

    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={60}
      className={`w-full max-w-lg rounded-xl transition-opacity duration-500 ${
        isRecording ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

// ============================================================
// ASSESSMENT RADAR — Real-time building radar with glow
// ============================================================
function AssessmentRadar({ scores }: { scores: number[] }) {
  const axes = AXIS_LABELS.length;
  const cx = 130, cy = 130, r = 110;

  const polygonPoints = scores
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
      const val = Math.max(v, 0.02);
      return `${cx + Math.cos(angle) * r * val},${cy + Math.sin(angle) * r * val}`;
    })
    .join(" ");

  const gridScales = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      {/* Soft glow behind */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[200px] h-[200px] rounded-full bg-primary/[0.06] blur-[40px]" />
      </div>
      <svg viewBox="0 0 260 260" className="w-full max-w-[260px] relative z-10">
        {/* Grid */}
        {gridScales.map((scale, i) => (
          <polygon
            key={i}
            points={Array.from({ length: axes }, (_, j) => {
              const angle = (Math.PI * 2 * j) / axes - Math.PI / 2;
              return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`;
            }).join(" ")}
            fill="none"
            stroke="oklch(0.24 0.03 65)"
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: axes }, (_, i) => {
          const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
          const hasScore = scores[i] > 0;
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={cx + Math.cos(angle) * r}
              y2={cy + Math.sin(angle) * r}
              stroke={hasScore ? "oklch(0.68 0.08 165)" : "oklch(0.17 0.02 55)"}
              strokeWidth={hasScore ? "1" : "0.3"}
              opacity={hasScore ? 0.8 : 0.25}
              style={{ transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)" }}
            />
          );
        })}
        {/* Score polygon */}
        <motion.polygon
          points={polygonPoints}
          fill="oklch(0.68 0.08 165)"
          fillOpacity={0.15}
          stroke="oklch(0.78 0.12 85)"
          strokeWidth="1.5"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        {/* Axis dots */}
        {scores.map((v, i) => {
          if (v <= 0) return null;
          const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
          return (
            <motion.circle
              key={i}
              cx={cx + Math.cos(angle) * r * v}
              cy={cy + Math.sin(angle) * r * v}
              r={3.5}
              fill="oklch(0.78 0.12 85)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// RECORDING TIMER
// ============================================================
function RecordingTimer({ isRecording, startTime }: { isRecording: boolean; startTime: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRecording || !startTime) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className="font-mono text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.78 0.12 85 / 0.8)", fontSize: "0.7rem" }}>
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

// Turn a spoken self-introduction into just the name to show on screen:
// "um, my name is Marcus" → "Marcus". Keeps up to the first two words so
// "Mary Jane" survives, strips common lead-ins and stray punctuation.
function cleanSpokenName(raw: string): string {
  let s = raw.trim().replace(/[.,!?]+$/g, "");
  s = s.replace(/^(um+|uh+|well|so|okay|ok|hi|hey|hello)[,\s]+/i, "");
  s = s.replace(/^(my name('s| is)|i'?m|it'?s|this is|they call me|i am|call me)\s+/i, "");
  const words = s.split(/\s+/).filter(Boolean).slice(0, 2);
  return words
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// ============================================================
// VOICE CAPTURE — mic-only short-utterance input (no typing anywhere).
// Used for the companion's spoken name and their per-question take. Runs the
// browser's SpeechRecognition, shows the words as they land, and commits the
// final transcript on stop. This is why the whole assessment stays voice-first.
// ============================================================
function VoiceCapture({
  value,
  onCommit,
  promptLabel,
  transform,
  tone = "accent",
}: {
  value: string;
  onCommit: (text: string) => void;
  promptLabel: string;
  transform?: (raw: string) => string;
  tone?: "accent" | "primary";
}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<any>(null);
  const finalRef = useRef("");

  const supported =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stop = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* noop */ }
    }
  }, []);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    try {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      finalRef.current = "";
      rec.onresult = (e: any) => {
        let fin = "";
        let intr = "";
        for (let r = e.resultIndex; r < e.results.length; r++) {
          const t = e.results[r][0].transcript;
          if (e.results[r].isFinal) fin += t + " ";
          else intr += t;
        }
        if (fin) finalRef.current += fin;
        setInterim(intr);
      };
      rec.onerror = () => { /* stay quiet; user can just tap again */ };
      rec.onend = () => {
        const heard = finalRef.current.trim();
        if (heard) onCommit(transform ? transform(heard) : heard);
        setInterim("");
        setListening(false);
        recRef.current = null;
      };
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      toast.error("Couldn't start the mic. Check your browser's microphone permission.");
    }
  }, [onCommit, transform]);

  useEffect(() => () => { if (recRef.current) { try { recRef.current.stop(); } catch { /* noop */ } } }, []);

  const ring = tone === "primary" ? "ring-primary/40 text-primary" : "ring-accent/40 text-accent";
  const glow = tone === "primary" ? "border-primary/30 bg-primary/[0.06]" : "border-accent/30 bg-accent/[0.06]";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={!supported}
        aria-pressed={listening}
        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${glow} ${
          listening ? "ring-2 " + ring : "hover:brightness-110"
        } ${!supported ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <span
          className={`shrink-0 grid place-items-center w-9 h-9 rounded-full ${
            listening ? "bg-red-500/20" : tone === "primary" ? "bg-primary/15" : "bg-accent/15"
          }`}
        >
          {listening ? (
            <span className="w-3 h-3 rounded-sm bg-red-500 signal-dot-amber" aria-hidden="true" />
          ) : (
            <Mic className={`w-4 h-4 ${tone === "primary" ? "text-primary" : "text-accent"}`} />
          )}
        </span>
        <span className="flex-1 min-w-0">
          {value ? (
            <span className="text-sm text-foreground font-medium break-words">{value}</span>
          ) : listening ? (
            <span className="text-sm text-foreground/70 italic break-words">
              {interim || "Listening…"}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/60">{promptLabel}</span>
          )}
        </span>
        <span className="shrink-0 text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {listening ? "Tap to stop" : value ? "Re-record" : "Tap to talk"}
        </span>
      </button>
      {!supported && (
        <p className="text-[0.6rem] text-muted-foreground/40 mt-1">
          Voice input needs Chrome, Edge, or Safari.
        </p>
      )}
    </div>
  );
}

// ============================================================
// MAIN ASSESSMENT PAGE
// ============================================================
export default function Assessment() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Assessment state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordings, setRecordings] = useState<(Blob | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
  const [textResponses, setTextResponses] = useState<string[]>(Array(TOTAL_QUESTIONS).fill(""));
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([]);
  const [useTextMode, setUseTextMode] = useState(false);
  // ── Companion mode ─────────────────────────────────────────────────────────
  // Optional, strongly recommended: a partner / best friend / anyone who knows the
  // member well plays along. Their read is captured on a SEPARATE channel (never
  // merged into the member's own scored answer) so the self-signal stays pure and
  // the self–other gap can be scored later. Not spouse-only.
  const [companionMode, setCompanionMode] = useState(false);
  const [companionName, setCompanionName] = useState("");
  const [companionRelation, setCompanionRelation] = useState("");
  const [companionResponses, setCompanionResponses] = useState<string[]>(Array(TOTAL_QUESTIONS).fill(""));
  const [scores, setScores] = useState<number[]>(Array(AXIS_LABELS.length).fill(0));
  const [isComplete, setIsComplete] = useState(false);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisSucceeded, setAnalysisSucceeded] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [birthYear, setBirthYear] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("aqal_birth_year");
    const n = saved ? parseInt(saved, 10) : NaN;
    return Number.isFinite(n) ? n : null;
  });
  // Per-answer richness reaction (shown in the pause before "Next").
  const [feedback, setFeedback] = useState<{ tier: FeedbackTier; newLines: number; totalLines: number } | null>(null);
  const scoresRef = useRef<number[]>([]);

  // tRPC mutations for backend submission
  const startMutation = trpc.assessment.start.useMutation();
  const uploadResponseMutation = trpc.assessment.uploadResponse.useMutation();
  const submitTextMutation = trpc.assessment.submitTextResponse.useMutation();
  const analyzeMutation = trpc.assessment.analyze.useMutation();
  const saveCompanionMutation = trpc.assessment.saveCompanion.useMutation();
  const companionSavedRef = useRef(false);

  // Detect if voice recording is supported
  const recordingSupported = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Browser speech-to-text (free, no API key — Chrome/Edge/Safari). Runs during
  // recording and captures a transcript so a spoken answer can be scored WITHOUT
  // a server transcription provider (Whisper). This is what lets the beta run on
  // a chat-only model like Grok, which cannot transcribe audio itself.
  const recognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>("");

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / TOTAL_QUESTIONS) * 100;
  const hasRecording = recordings[currentQuestion] !== null;
  const hasTextResponse = textResponses[currentQuestion]?.trim().length > 20;
  const isSkipped = skippedQuestions.includes(currentQuestion);
  // Companion panel shows only when companion mode is on AND this isn't a private question.
  const companionActive = companionMode && !question.soloOnly;

  // ── Companion reveal (the "gap") ───────────────────────────────────────────
  // Run the companion channel through the SAME depth engine as the member, then
  // surface the honest, fun signal the coarse scorer supports: lines your person
  // lit up brighter than you did — "what they see in you that you undersold" — plus
  // a light "how well do they know you" agreement score. (The precise SOKA per-line
  // gap lands with the evidence-based server analysis; see the audit doc, Part D.)
  const companionReveal = useMemo(() => {
    if (!companionMode) return null;
    const answered = companionResponses.filter((r) => (r?.trim().split(/\s+/).length ?? 0) >= 5).length;
    if (answered === 0) return null;
    const comp = Array(AXIS_LABELS.length).fill(0);
    QUESTIONS.forEach((q, i) => {
      const words = companionResponses[i]?.trim() ? companionResponses[i].trim().split(/\s+/).length : 0;
      if (words < 5) return;
      const depth = Math.min(0.5, 0.2 + (words / 120) * 0.3);
      q.axes.forEach((a) => { comp[a] = Math.max(comp[a], depth); });
    });
    const topSees = comp
      .map((c, i) => ({ i, name: AXIS_LABELS[i], gap: c - (scores[i] ?? 0), comp: c }))
      .filter((g) => g.comp > 0 && g.gap > 0.03)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 4);
    const memberLit = scores.map((s, i) => (s > 0 ? i : -1)).filter((i) => i >= 0);
    const bothLit = memberLit.filter((i) => comp[i] > 0).length;
    const knows = memberLit.length ? Math.round((100 * bothLit) / memberLit.length) : 0;
    return { answered, topSees, knows, vector: comp };
  }, [companionMode, companionResponses, scores]);

  // Persist the companion channel to the assessment once, on completion — separate
  // from the member's scored answers, so Results can render the self–other gap.
  useEffect(() => {
    if (!isComplete || !companionMode || companionSavedRef.current) return;
    if (!assessmentId || !companionReveal || companionReveal.answered === 0) return;
    companionSavedRef.current = true;
    saveCompanionMutation.mutate({
      assessmentId,
      relation: companionRelation || "companion",
      vector: companionReveal.vector,
      answered: companionReveal.answered,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, companionMode, assessmentId, companionReveal]);

  // ============================================================
  // PROGRESS PERSISTENCE — Save/resume from localStorage
  // ============================================================
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('aqal_assessment_progress');
    if (saved) {
      try {
        const { question: q } = JSON.parse(saved);
        if (typeof q === 'number' && q > 0) {
          setShowResumeDialog(true);
        }
      } catch {
        localStorage.removeItem('aqal_assessment_progress');
      }
    }
  }, []);

  const handleResume = useCallback(() => {
    const saved = localStorage.getItem('aqal_assessment_progress');
    if (saved) {
      try {
        const { question: q, scores: s, textResponses: tr, textMode, skipped, companion } = JSON.parse(saved);
        if (typeof q === 'number' && q > 0) setCurrentQuestion(q);
        if (Array.isArray(s) && s.length === 22) setScores(s);
        if (Array.isArray(tr) && tr.length === TOTAL_QUESTIONS) setTextResponses(tr);
        if (typeof textMode === 'boolean') setUseTextMode(textMode);
        if (Array.isArray(skipped)) setSkippedQuestions(skipped);
        if (companion && typeof companion === 'object') {
          if (typeof companion.mode === 'boolean') setCompanionMode(companion.mode);
          if (typeof companion.name === 'string') setCompanionName(companion.name);
          if (typeof companion.relation === 'string') setCompanionRelation(companion.relation);
          if (Array.isArray(companion.responses) && companion.responses.length === TOTAL_QUESTIONS) setCompanionResponses(companion.responses);
        }
      } catch {}
    }
    setShowResumeDialog(false);
  }, []);

  const handleStartFresh = useCallback(() => {
    setCurrentQuestion(0);
    setScores(Array(AXIS_LABELS.length).fill(0));
    setRecordings(Array(TOTAL_QUESTIONS).fill(null));
    setTextResponses(Array(TOTAL_QUESTIONS).fill(""));
    setSkippedQuestions([]);
    setUseTextMode(false);
    setCompanionResponses(Array(TOTAL_QUESTIONS).fill(""));
    setShowResumeDialog(false);
  }, []);

  useEffect(() => {
    // Save progress on every question change
    if (currentQuestion > 0 || scores.some(s => s > 0) || companionMode) {
      localStorage.setItem('aqal_assessment_progress', JSON.stringify({
        question: currentQuestion,
        scores,
        textResponses,
        textMode: useTextMode,
        skipped: skippedQuestions,
        companion: { mode: companionMode, name: companionName, relation: companionRelation, responses: companionResponses },
      }));
    }
  }, [currentQuestion, scores, textResponses, useTextMode, skippedQuestions, companionMode, companionName, companionRelation, companionResponses]);

  // Clear progress on completion
  useEffect(() => {
    if (isComplete) {
      localStorage.removeItem('aqal_assessment_progress');
    }
  }, [isComplete]);

  // Mirror scores for pre-update diffing, and clear the reaction on question change.
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { setFeedback(null); }, [currentQuestion]);

  // Text mode: a live reaction that grows as they write more (voice uses onstop).
  useEffect(() => {
    if (!(useTextMode || !recordingSupported)) return;
    const t = textResponses[currentQuestion] ?? "";
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    if (words < 8) { setFeedback(null); return; }
    const qAxes = QUESTIONS[currentQuestion].axes;
    let newLines = 0;
    qAxes.forEach((a) => { if ((scoresRef.current[a] ?? 0) === 0) newLines++; });
    const totalLines = scoresRef.current.filter((s) => s > 0).length + newLines;
    setFeedback({ tier: tierForDepth(textDepth(words)), newLines, totalLines });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textResponses, currentQuestion, useTextMode, recordingSupported]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (typeof window.MediaRecorder === "undefined") {
        toast.error("Voice recording is not supported in this browser. Please use Chrome, Firefox, or Safari 14.5+.");
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Microphone access is not available. Please check your browser permissions.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/aac")
        ? "audio/aac"
        : "";
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const actualMime = mediaRecorderRef.current?.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualMime });
        setRecordings((prev) => {
          const next = [...prev];
          next[currentQuestion] = blob;
          return next;
        });

        const questionAxes = QUESTIONS[currentQuestion].axes;
        const durationSec = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 5;
        const prelimScore = Math.min(0.5, 0.2 + (durationSec / 60) * 0.3);
        setScores((prev) => {
          const next = [...prev];
          questionAxes.forEach((axis) => {
            next[axis] = Math.max(next[axis], prelimScore);
          });
          return next;
        });

        // Warm richness reaction + how many new lines this answer lit up.
        const prevScores = scoresRef.current;
        let newLines = 0;
        questionAxes.forEach((a) => { if ((prevScores[a] ?? 0) === 0) newLines++; });
        const totalLines = prevScores.filter((s) => s > 0).length + newLines;
        setFeedback({ tier: tierForDepth(voiceDepth(durationSec)), newLines, totalLines });
      };

      mediaRecorder.start(250);

      // Fire up free browser transcription in parallel, if the browser supports it.
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      liveTranscriptRef.current = "";
      if (SR) {
        try {
          const recognition = new SR();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";
          recognition.onresult = (event: any) => {
            let finalChunk = "";
            for (let r = event.resultIndex; r < event.results.length; r++) {
              if (event.results[r].isFinal) finalChunk += event.results[r][0].transcript + " ";
            }
            if (finalChunk) liveTranscriptRef.current += finalChunk;
          };
          recognition.onerror = () => { /* stay silent; audio upload remains the fallback */ };
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          recognitionRef.current = null;
        }
      }

      setIsRecording(true);
      setRecordingStartTime(Date.now());
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        toast.error("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        toast.error("No microphone found. Please connect a microphone and try again.");
      } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
        toast.error("Microphone is in use by another application. Please close other apps using the mic.");
      } else {
        toast.error("Failed to start recording. Please try a different browser.");
      }
    }
  }, [currentQuestion, recordingStartTime]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    // Stop browser transcription and, if it heard anything, store it as this
    // question's text answer. The submit step prefers text over audio, so a
    // browser-transcribed answer is scored directly — no server Whisper needed.
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
    const heard = liveTranscriptRef.current.trim();
    if (heard.length > 0) {
      const q = currentQuestion;
      setTextResponses((prev) => {
        const next = [...prev];
        // Only fill from speech if the user didn't already type something here.
        if (!next[q] || next[q].trim().length === 0) next[q] = heard;
        return next;
      });
    }
    setIsRecording(false);
    setRecordingStartTime(null);
  }, [currentQuestion]);

  // Skip current question
  const skipQuestion = useCallback(() => {
    setSkippedQuestions((prev) => prev.includes(currentQuestion) ? prev : [...prev, currentQuestion]);
    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion((q) => q + 1);
    } else {
      setIsSubmitting(true);
      playComplete();
      toast.success("Assessment complete! Submitting your responses...");
      submitAllResponses();
    }
  }, [currentQuestion]);

  // Navigation
  const goNext = useCallback(() => {
    if (!recordings[currentQuestion] && textResponses[currentQuestion]?.trim().length > 20) {
      const questionAxes = QUESTIONS[currentQuestion].axes;
      const wordCount = textResponses[currentQuestion].trim().split(/\s+/).length;
      const prelimScore = Math.min(0.5, 0.2 + (wordCount / 200) * 0.3);
      setScores((prev) => {
        const next = [...prev];
        questionAxes.forEach((axis) => {
          next[axis] = Math.max(next[axis], prelimScore);
        });
        return next;
      });
    }
    
    // All questions are free. The paywall now gates the evidence-based
    // scoring method after completion — not the questions themselves.
    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion((q) => q + 1);
    } else {
      setIsSubmitting(true);
      playComplete();
      toast.success("Assessment complete! Submitting your responses...");
      submitAllResponses();
    }
  }, [currentQuestion, recordings, textResponses, user]);

  // Submit all recordings/text to backend, then trigger analysis
  const submitAllResponses = useCallback(async () => {
    if (!user) {
      localStorage.setItem('aqal_assessment_progress', JSON.stringify({
        question: TOTAL_QUESTIONS - 1,
        scores,
        textResponses,
        textMode: useTextMode,
        skipped: skippedQuestions,
      }));
      toast.info("Please log in to save your assessment results.");
      beginAuth();
      return;
    }
    try {
      let aId = assessmentId;
      if (!aId) {
        const startResult = await startMutation.mutateAsync(birthYear ? { birthYear } : {});
        if (!startResult.success || !startResult.assessmentId) {
          toast.error("Failed to start assessment. Please try again.");
          setIsSubmitting(false);
          return;
        }
        aId = startResult.assessmentId;
        setAssessmentId(aId);
      }

      // Upload each response (skip skipped questions)
      for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        if (skippedQuestions.includes(i)) continue;
        
        const recording = recordings[i];
        const textResp = textResponses[i];

        // Prefer TEXT when we have it — a typed answer or a browser-transcribed
        // spoken answer. This routes scoring straight to the LLM (e.g. Grok) with
        // no server transcription needed. Raw audio upload (server Whisper) is the
        // fallback only when there's no text for this question.
        if (textResp?.trim().length > 0) {
          await submitTextMutation.mutateAsync({
            assessmentId: aId,
            questionIndex: i,
            text: textResp.trim(),
          });
        } else if (recording) {
          const arrayBuffer = await recording.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          await uploadResponseMutation.mutateAsync({
            assessmentId: aId,
            questionIndex: i,
            audioBase64: base64,
            durationMs: 30000,
          });
        }
      }

      toast.info("Responses submitted. AI analysis in progress...");
      const analyzeResult = await analyzeMutation.mutateAsync({ assessmentId: aId });

      if (analyzeResult.success) {
        toast.success("Analysis complete!");
        setAnalysisSucceeded(true);
      } else {
        toast.error(analyzeResult.error || "Analysis failed. Your responses are saved.");
        setAnalysisSucceeded(false);
      }

      setIsComplete(true);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error("Assessment submission error:", err);
      toast.error("Submission failed. Your progress is saved locally — try again.");
      setIsSubmitting(false);
      setAnalysisSucceeded(false);
      setIsComplete(true);
    }
  }, [recordings, textResponses, assessmentId, skippedQuestions, startMutation, uploadResponseMutation, submitTextMutation, analyzeMutation]);

  const goPrev = useCallback(() => {
    if (currentQuestion > 0) setCurrentQuestion((q) => q - 1);
  }, [currentQuestion]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRecording) return;
      if (e.key === 'ArrowRight' && (hasRecording || hasTextResponse || isSkipped)) goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ' && !isRecording && !hasRecording) {
        e.preventDefault();
        startRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, hasRecording, hasTextResponse, isSkipped, goNext, goPrev, startRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Calculate preliminary rarity
  function scoreToRarity(score: number): number {
    const s = Math.max(0, Math.min(1, score));
    if (s <= 0.3) return 1.0 + (s / 0.3) * 2.0;
    if (s <= 0.5) { const t = (s - 0.3) / 0.2; return 3.0 + t * 7.0; }
    if (s <= 0.7) { const t = (s - 0.5) / 0.2; return 10.0 * Math.pow(10, t); }
    if (s <= 0.85) { const t = (s - 0.7) / 0.15; return 100.0 * Math.pow(10, t); }
    if (s <= 0.95) { const t = (s - 0.85) / 0.10; return 1000.0 * Math.pow(10, t); }
    const t = (s - 0.95) / 0.05; return 10000.0 * Math.pow(10, t);
  }

  const activeScores = scores.filter((s) => s > 0);
  let preliminaryRarity = 0;
  if (activeScores.length > 0) {
    const logSum = activeScores.reduce((sum, s) => sum + Math.log(Math.max(1, scoreToRarity(s))), 0);
    const geoMean = Math.exp(logSum / activeScores.length);
    preliminaryRarity = Math.max(1, Math.min(1_000_000, Math.round(geoMean)));
  }

  // Cohort rarity — the same shape scored against the user's OWN generation.
  // Developmental lines are age-adjusted so a young high-scorer reads as rarer
  // among peers (and an elder less rare) than the whole-population number.
  const currentYear = new Date().getFullYear();
  const cohortAge = birthYear ? Math.max(10, currentYear - birthYear) : null;
  const generation: Generation | null = birthYear ? generationForBirthYear(birthYear) : null;
  let cohortRarity = 0;
  if (cohortAge != null && activeScores.length > 0) {
    const cohortScores = scores
      .map((s, i) => (s > 0 ? cohortAdjustedScore(s, ALL_AXES[i], cohortAge) : null))
      .filter((x): x is number => x != null);
    const logSum = cohortScores.reduce((sum, s) => sum + Math.log(Math.max(1, scoreToRarity(s))), 0);
    cohortRarity = Math.max(1, Math.min(1_000_000, Math.round(Math.exp(logSum / cohortScores.length))));
  }

  // Confidence of the FREE, voice-only result. It is capped at "Moderate" by
  // design — reaching high confidence requires the evidence-based scoring
  // method, which is unlocked by payment or a beta code.
  const coverage = Math.min(1, activeScores.length / 32);
  const avgStrength = activeScores.length
    ? activeScores.reduce((a, b) => a + b, 0) / activeScores.length
    : 0;
  const confSignal = coverage * 0.55 + avgStrength * 0.45;
  const confidenceTier: "Low" | "Low–Moderate" | "Moderate" =
    confSignal >= 0.62 ? "Moderate" : confSignal >= 0.38 ? "Low–Moderate" : "Low";
  // A visible band that never reaches "high" (caps ~55%), reinforcing that
  // verification is what sharpens the estimate.
  const confidencePct = Math.round((0.15 + confSignal * 0.4) * 100);

  // Full evidence-based access: paid tiers OR a redeemed beta code (grants
  // "silver"). Free users see the low-confidence estimate and a locked upgrade.
  const hasFullAccess = !!(user?.membershipTier && user.membershipTier !== "free");

  // ============================================================
  // PAYWALL / EVIDENCE-BASED UNLOCK GATE
  // ============================================================
  const checkoutMutation = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info("Checkout opened in a new tab. Complete payment to unlock evidence-based verification.");
      } else {
        toast.error("Could not create checkout session. Please try again.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong. Please try again.");
    },
  });

  // Beta access — free for the first N testers via a passcode.
  const utils = trpc.useUtils();
  const betaStatus = trpc.beta.status.useQuery();
  const [betaCode, setBetaCode] = useState("");
  const betaRedeem = trpc.beta.redeem.useMutation({
    onSuccess: (r) => {
      if (r.success) {
        toast.success("Beta access unlocked — the full assessment is on us. Enjoy.");
        utils.auth.me.invalidate();
        setBetaCode("");
        setShowPaywall(false);
        setCurrentQuestion((q) => Math.min(q + 1, TOTAL_QUESTIONS - 1));
      } else {
        toast.error(r.error || "Couldn't redeem that code.");
      }
    },
    onError: () => toast.error("Something went wrong redeeming your code."),
  });

  if (showPaywall) {
    const handleUnlock = () => {
      playClick();
      if (!user) {
        localStorage.setItem('aqal_assessment_progress', JSON.stringify({
          question: currentQuestion,
          scores,
          textResponses,
          textMode: useTextMode,
          skipped: skippedQuestions,
        }));
        toast.info("Please log in first to unlock evidence-based verification.");
        beginAuth();
        return;
      }
      checkoutMutation.mutate({
        productKey: "assessment",
        origin: window.location.origin,
      });
    };

    const handleBeta = () => {
      playClick();
      if (!user) {
        localStorage.setItem('aqal_assessment_progress', JSON.stringify({
          question: currentQuestion, scores, textResponses, textMode: useTextMode, skipped: skippedQuestions,
        }));
        toast.info("Please log in first, then enter your beta code.");
        beginAuth();
        return;
      }
      const code = betaCode.trim();
      if (!code) { toast.error("Enter your beta access code first."); return; }
      betaRedeem.mutate({ code });
    };

    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, oklch(0.17 0.03 55) 0%, oklch(0.13 0.02 55) 50%, oklch(0.12 0.02 55) 100%)`,
          }}
        />

        {/* Floating particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${10 + Math.random() * 80}%`,
                background: i % 2 === 0 ? 'oklch(0.68 0.08 165 / 0.6)' : 'oklch(0.78 0.12 85 / 0.5)',
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 max-w-2xl w-full"
        >
          {/* Assessment complete badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-accent/[0.08] border border-accent/20 rounded-full px-5 py-2 mb-6">
              <Check className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium">All {TOTAL_QUESTIONS} Questions Complete</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              Unlock Evidence-Based Verification
            </h1>
            <p className="text-muted-foreground/70 text-base max-w-lg mx-auto leading-relaxed">
              Your voice assessment gives a low-to-moderate confidence estimate. The evidence-based scoring method verifies your full 32-line profile — a panel of independent AIs, cross-checked against the evidence you submit — and raises your result to high confidence.
            </p>
          </motion.div>

          {/* Preliminary rarity tease */}
          {preliminaryRarity > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6 mb-8 border border-primary/10 text-center"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Your Voice-Based Estimate
              </p>
              <p className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}>
                1 in {preliminaryRarity.toLocaleString()}
              </p>
              <p className="text-muted-foreground/40 text-xs mt-2">
                A {confidenceTier.toLowerCase()}-confidence estimate from your voice responses. Evidence-based verification sharpens it and raises confidence to high.
              </p>
            </motion.div>
          )}

          {/* Value stack */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl p-8 mb-8 border border-primary/15"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-accent/60 mb-6 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              What You&rsquo;re Unlocking
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/[0.08] border border-primary/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Elite Network — Strength-to-Weakness Matching</p>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">We pattern-match your weakness clusters to other members&rsquo; strength clusters. You get friends, collaborators, and partners who cover exactly where you&rsquo;re blind. For business, romance, and friendship.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/[0.08] border border-primary/20 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Personalized Consulting — Your Unique Profile</p>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">Consulting services built from YOUR cognitive shape. More meaning, purpose, and goal achievement — with less strain, less anxiety, and less time. We show you the path that fits how your brain actually works.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/[0.08] border border-accent/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Full 32-Dimension Intelligence Map + Rarity Underwriting</p>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">A panel of AIs from different developers scores your complete cognitive shape across 32 dimensions. Your composite rarity estimate shows approximately where you stand — refined further once you submit evidence.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/[0.08] border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">An Elite Social Platform Unlike Anything Online</p>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">This isn&rsquo;t LinkedIn. This isn&rsquo;t a dating app. This is a network of highly intelligent, highly functional, highly capable people — verified by AI consensus scoring. You belong here. Prove it.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/[0.08] border border-green-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">30-Day Retake Guarantee + Lifetime Access</p>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">Disagree with your results? Retake free within 30 days. No questions asked. Your data is encrypted end-to-end. Only you see your results. Ever.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <Button
              onClick={handleUnlock}
              disabled={checkoutMutation.isPending}
              className="w-full max-w-md py-7 text-lg font-semibold bg-primary text-primary-foreground glow-gold hover:translate-y-[-2px] active:scale-[0.97] transition-all duration-150"
            >
              {checkoutMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <motion.div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Unlock Evidence-Based Scoring — $299
                </span>
              )}
            </Button>

            <p className="text-muted-foreground/40 text-xs mt-4">
              One-time payment. Lifetime access. 30-day retake guarantee.
            </p>

            {/* Beta access — free for the first N testers */}
            {betaStatus.data?.enabled && betaStatus.data.remaining > 0 && (
              <div className="mt-8 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40">or, if you have a code</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <p className="text-xs text-muted-foreground/60 mb-2 text-center">
                  Free for our first {betaStatus.data.cap} beta testers — <span className="text-accent/80">{betaStatus.data.remaining} spot{betaStatus.data.remaining !== 1 ? "s" : ""} left</span>. No card, no charge.
                </p>
                <div className="flex gap-2">
                  <input
                    value={betaCode}
                    onChange={(e) => setBetaCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleBeta(); }}
                    placeholder="Enter beta access code"
                    className="flex-1 bg-background/60 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button onClick={handleBeta} disabled={betaRedeem.isPending || !betaCode.trim()} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                    {betaRedeem.isPending ? "…" : "Unlock free"}
                  </Button>
                </div>
              </div>
            )}

            {/* Trust bar */}
            <div className="flex flex-wrap justify-center gap-4 text-[10px] text-muted-foreground/30 uppercase tracking-wider mt-6">
              <span>Bank-Grade Encryption</span>
              <span className="text-muted-foreground/15">&bull;</span>
              <span>Private & Encrypted</span>
              <span className="text-muted-foreground/15">&bull;</span>
              <span className="flex flex-col items-center leading-tight">
                <span>7 Patents Pending</span>
                <span className="text-[0.55rem] text-muted-foreground/20 normal-case tracking-normal">Proprietary methodology</span>
              </span>
            </div>
          </motion.div>

          {/* Back button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => setShowPaywall(false)}
              className="text-sm text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
            >
              &larr; Back to my results
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // SUBMITTING SCREEN
  // ============================================================
  if (isSubmitting && !isComplete) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, oklch(0.15 0.02 55) 0%, oklch(0.13 0.02 55) 50%, oklch(0.12 0.02 55) 100%)`,
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 text-center max-w-lg"
        >
          <motion.div
            className="w-24 h-24 rounded-full border-2 border-primary/40 border-t-primary flex items-center justify-center mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <h1
            className="text-3xl sm:text-4xl text-foreground mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            Five Minds Are Listening
          </h1>
          <p className="text-muted-foreground/70 mb-3 leading-relaxed">
            Uploading your responses and running analysis across 32 cognitive dimensions...
          </p>
          <p className="text-sm text-muted-foreground/50">This may take 30–60 seconds.</p>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // COMPLETION SCREEN
  // ============================================================
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, oklch(0.17 0.03 55) 0%, oklch(0.13 0.02 55) 50%, oklch(0.12 0.02 55) 100%)`,
          }}
        />

        {/* Floating particles — celebration */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${20 + Math.random() * 60}%`,
                background: i % 3 === 0 ? 'oklch(0.78 0.12 85)' : i % 3 === 1 ? 'oklch(0.68 0.08 165)' : 'oklch(0.78 0.12 85)',
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 text-center max-w-lg"
        >
          {/* Success icon with glow */}
          <motion.div
            className="w-24 h-24 rounded-full bg-primary/[0.08] border border-primary/30 flex items-center justify-center mx-auto mb-8"
            animate={{ boxShadow: ["0 0 30px oklch(0.78 0.12 85 / 0.15)", "0 0 60px oklch(0.78 0.12 85 / 0.3)", "0 0 30px oklch(0.78 0.12 85 / 0.15)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Check className="w-12 h-12 text-primary" />
          </motion.div>

          <h1
            className="text-3xl sm:text-4xl text-foreground mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            Assessment Complete
          </h1>
          <p className="text-muted-foreground/60 text-sm mb-8 leading-relaxed max-w-md mx-auto">
            A panel of AIs from different developers has analyzed your responses across 32 cognitive dimensions.
          </p>

          {/* Rarity reveal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card rounded-2xl p-8 mb-8 border border-primary/10"
          >
            {generation && cohortRarity > 0 ? (
              <>
                <p
                  className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Your Rarity — Among {generation}
                </p>
                <p
                  className="text-4xl sm:text-5xl font-bold text-glow-gold"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}
                >
                  1 in {cohortRarity.toLocaleString()}
                </p>
                <p className="text-muted-foreground/50 text-sm mt-3">
                  1 in {preliminaryRarity.toLocaleString()} <span className="text-muted-foreground/35">across the whole population</span>
                </p>
                <p className="text-muted-foreground/40 text-xs mt-2">
                  A model-based estimate — not a measured percentile — across {activeScores.length} dimensions,
                  scored within your generation and then the population. Developmental lines are age-adjusted so
                  time-to-compound doesn&rsquo;t decide your rank.
                </p>
              </>
            ) : (
              <>
                <p
                  className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Your Composite Rarity
                </p>
                <p
                  className="text-4xl sm:text-5xl font-bold text-glow-gold"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}
                >
                  1 in {preliminaryRarity.toLocaleString()}
                </p>
                <p className="text-muted-foreground/40 text-xs mt-3">
                  A model-based estimate — not a measured percentile — across {activeScores.length} scored dimensions.
                  Add your birth year next time to also see your rarity within your generation.
                </p>
              </>
            )}

            {/* Confidence meter — capped in the low range for the voice-only pass */}
            <div className="mt-5 pt-5 border-t border-white/[0.06] text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Confidence
                </span>
                <span className="text-xs font-semibold text-accent">{confidenceTier}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-accent/70" style={{ width: `${confidencePct}%` }} />
              </div>
              <p className="text-muted-foreground/40 text-[0.7rem] mt-2 leading-relaxed">
                This is a voice-only estimate. The evidence-based scoring method raises it to high confidence.
              </p>
            </div>
          </motion.div>

          {/* Companion reveal — "how well do they know you" + what they saw you undersell */}
          {companionReveal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="glass-card rounded-2xl p-7 mb-8 border border-accent/20 text-left"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-accent/70 mb-3 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {companionName ? `How well ${companionName} knows you` : "How well your person knows you"}
              </p>
              <p className="text-4xl sm:text-5xl font-bold text-center" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}>
                {companionReveal.knows}%
              </p>
              <p className="text-muted-foreground/50 text-xs mt-2 text-center">
                Your stories lined up on {companionReveal.knows}% of the lines you lit — across {companionReveal.answered} they weighed in on.
              </p>
              {companionReveal.topSees.length > 0 && (
                <div className="mt-5 pt-5 border-t border-white/[0.06]">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground/50 mb-2.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    What {companionName || "they"} saw that you undersold
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {companionReveal.topSees.map((s) => (
                      <span key={s.i} className="px-3 py-1 rounded-full text-xs border border-accent/30 text-accent bg-accent/[0.06]">
                        {s.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-muted-foreground/40 text-[0.7rem] mt-3 leading-relaxed">
                    A person who knows you well reads your outward side — humor, charm, presence — more clearly than you read yourself. The precise line-by-line gap sharpens with the full evidence-based analysis.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            {analysisSucceeded ? (
              hasFullAccess ? (
                <>
                  <Link href="/results">
                    <Button className="w-full bg-primary text-primary-foreground border-0 text-base py-5 shadow-lg shadow-primary/20 hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150">
                      See Your Full Report
                    </Button>
                  </Link>
                  <Link href="/evidence">
                    <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/[0.06] py-5 hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150">
                      Upload Evidence to Verify Scores
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="glass-card rounded-xl p-4 border border-primary/15 text-left">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Evidence-Based Verification — Locked</span>
                    </div>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed">
                      Your voice result is a {confidenceTier.toLowerCase()}-confidence estimate. Unlock the evidence-based scoring method to verify your full 32-line profile and raise it to high confidence — free with a beta code, or by card.
                    </p>
                  </div>
                  <Button
                    onClick={() => { playClick(); setShowPaywall(true); }}
                    className="w-full bg-primary text-primary-foreground border-0 text-base py-5 shadow-lg shadow-primary/20 hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Unlock Evidence-Based Scoring
                    </span>
                  </Button>
                </>
              )
            ) : (
              <>
                <p className="text-amber-400/80 text-sm mb-2 bg-amber-500/[0.05] border border-amber-500/20 rounded-lg px-4 py-3">
                  Analysis is still processing. Your responses are saved securely.
                </p>
                <Button
                  onClick={() => {
                    setIsComplete(false);
                    setIsSubmitting(true);
                    submitAllResponses();
                  }}
                  className="w-full bg-primary text-white glow-gold text-base py-5 hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
                >
                  Retry Analysis
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full border-muted-foreground/30 text-muted-foreground py-5">
                    Return Home
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-muted-foreground/30 text-xs mt-8"
          >
            Your data is encrypted end-to-end. Only you can see your results.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // MAIN ASSESSMENT FLOW
  // ============================================================
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, oklch(0.14 0.02 55) 0%, oklch(0.13 0.02 55) 40%, oklch(0.12 0.02 55) 100%)`,
        }}
      />
      <div className="gradient-mesh" />

      {/* Resume dialog */}
      {showResumeDialog && (
        <AssessmentResumeDialog onResume={handleResume} onStartFresh={handleStartFresh} />
      )}

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-muted/30">
        <motion.div
          className="h-full bg-primary"
          style={{ boxShadow: "0 0 10px oklch(0.68 0.08 165 / 0.5)" }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 pt-6 pb-4 px-4">
        <div className="container flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground/60 hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" /> Exit
            </Button>
          </Link>

          {/* Step dots — show only relevant phase */}
          <div className="flex items-center gap-1">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <motion.div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentQuestion
                    ? "w-4 h-1.5 bg-primary"
                    : i < currentQuestion
                    ? skippedQuestions.includes(i)
                      ? "w-1.5 h-1.5 bg-muted-foreground/30"
                      : "w-1.5 h-1.5 bg-accent/60"
                    : "w-1.5 h-1.5 bg-muted-foreground/20"
                }`}
                style={i === currentQuestion ? { boxShadow: "0 0 8px oklch(0.68 0.08 165 / 0.4)" } : undefined}
                layout
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              />
            ))}
          </div>

          <span
            className="text-muted-foreground/50 text-xs"
            style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}
          >
            {currentQuestion + 1} / {TOTAL_QUESTIONS}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 px-4 pb-8">
        {/* Left: Question + Recording */}
        <div className="flex-1 max-w-xl w-full flex flex-col items-center text-center">
          {/* First-question primer — sets the "great conversation, not a test" frame */}
          {currentQuestion === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 max-w-md mx-auto rounded-xl border border-primary/15 bg-primary/[0.04] px-5 py-4"
            >
              <p className="text-[0.6rem] uppercase tracking-[0.15em] text-primary/70 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Before we start
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                This isn't a test — it's the best kind of bar conversation, with a listener who's genuinely into your stories. There are no right answers. Ramble, chase the tangents, say more than the question asked. The longer and more openly you talk, the more accurate your read. Ready? Tap the mic.
              </p>

              {/* Birth year — used only to score you against your own generation */}
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground/70 leading-snug">
                    What year were you born?
                    <span className="block text-[0.65rem] text-muted-foreground/40">Optional — lets us also rank you within your generation, not just the whole population.</span>
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="1998"
                    min={1920}
                    max={currentYear}
                    defaultValue={birthYear ?? ""}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (Number.isFinite(n) && n >= 1920 && n <= currentYear) {
                        setBirthYear(n);
                        localStorage.setItem("aqal_birth_year", String(n));
                      } else {
                        setBirthYear(null);
                        localStorage.removeItem("aqal_birth_year");
                      }
                    }}
                    className="w-20 shrink-0 bg-background/60 border border-border/60 rounded-lg px-3 py-2 text-sm text-center text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
              </div>

              {/* Companion mode opt-in — optional, strongly recommended, NOT spouse-only */}
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-foreground/85 font-medium leading-snug">
                      Bring your person? <span className="text-primary/70">Optional — recommended</span>
                    </p>
                    <p className="text-[0.7rem] text-foreground/70 leading-snug mt-1 italic">
                      Do it solo for a private read, or bring your partner or best friend for a sharper, funnier one.
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground/50 leading-snug mt-1">
                      A partner, best friend, sibling, close colleague — anyone who knows you well. They read your outward side (humor, charm, presence) more clearly than you do, so the read gets sharper. Private questions stay just you.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={companionMode}
                    aria-label="Companion mode"
                    onClick={() => setCompanionMode((v) => !v)}
                    className={`shrink-0 mt-0.5 relative w-11 h-6 rounded-full transition-colors ${companionMode ? "bg-primary" : "bg-muted/40"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${companionMode ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                {companionMode && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {["Partner", "Best friend", "Family", "Colleague", "Someone who knows me"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setCompanionRelation(r)}
                          className={`px-2.5 py-1 rounded-full text-[0.65rem] border transition-colors ${companionRelation === r ? "border-primary text-primary bg-primary/10" : "border-border/50 text-muted-foreground/70 hover:text-foreground"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <p className="text-[0.62rem] uppercase tracking-[0.12em] text-primary/70 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {companionName ? `Hey, ${companionName} 👋` : "Companion — say your name"}
                    </p>
                    <VoiceCapture
                      value={companionName}
                      onCommit={setCompanionName}
                      promptLabel="Tap the mic and say your first name"
                      tone="primary"
                      transform={cleanSpokenName}
                    />
                    <p className="text-[0.6rem] text-muted-foreground/40 leading-snug">
                      They answer out loud — no typing anywhere. You speak first in your own words; then, when the light turns green, your person speaks their take. We keep the two apart and score the <em>gap</em> — that's the fun part.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Question title */}
          <motion.p
            key={`title-${currentQuestion}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs uppercase tracking-[0.2em] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.78 0.12 85 / 0.7)" }}
          >
            {question.title}
          </motion.p>

          {/* Dimension label */}
          <motion.p
            key={`dim-${currentQuestion}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-[0.6rem] uppercase tracking-[0.15em] mb-6 text-muted-foreground/40"
          >
            {question.dimension}
          </motion.p>

          {/* ── Companion signal light ──────────────────────────────────────────
              A blinking beacon so the room instantly knows whose turn it is.
              GREEN = companion, jump in.  AMBER = private, member answers alone.
              Only shows when companion mode is on. */}
          {companionMode && (
            <motion.div
              key={`signal-${currentQuestion}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              role="status"
              aria-live="polite"
              className={`mb-6 max-w-md w-full mx-auto flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left ${
                companionActive ? "signal-banner-green" : "signal-banner-amber"
              }`}
            >
              <span
                className={`shrink-0 w-3.5 h-3.5 rounded-full ${
                  companionActive ? "signal-dot-green" : "signal-dot-amber"
                }`}
                aria-hidden="true"
              />
              {companionActive ? (
                <span className="text-xs sm:text-sm leading-snug" style={{ color: "oklch(0.82 0.09 165)" }}>
                  <strong className="font-semibold">
                    {companionName ? `${companionName}, jump in` : "Companion, jump in"}
                  </strong>{" "}
                  — follow up, push back, or add the part they're too modest to say.
                </span>
              ) : (
                <span className="text-xs sm:text-sm leading-snug" style={{ color: "oklch(0.84 0.10 55)" }}>
                  <strong className="font-semibold">Just you on this one.</strong>{" "}
                  {companionName ? `${companionName}, sit this one out` : "Companion, sit this one out"} — it's more honest when it's only you.
                </span>
              )}
            </motion.div>
          )}

          {/* Question text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`q-${currentQuestion}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="mb-8"
            >
              <h2
                className="text-xl sm:text-2xl md:text-3xl text-foreground leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.5 }}
              >
                &ldquo;{question.text}&rdquo;
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Talk-longer nudge (honest framing) */}
          <p className="text-xs text-primary/80 tracking-wide text-center max-w-md mx-auto font-bold mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            There's no such thing as talking too long here. The more you actually tell the story — who was there, what you felt, the tangents you'd normally cut — the more of you we can see, and the sharper your profile. Don't summarize. Go deep. Show off.
          </p>

          {/* Skip button for skippable questions */}
          {question.skippable && !hasRecording && !hasTextResponse && (
            <button
              onClick={skipQuestion}
              className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-6 border border-muted-foreground/20 rounded-full px-4 py-2 hover:border-muted-foreground/40"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {question.skipLabel}
            </button>
          )}

          {/* Mode toggle — voice or text */}
          {(!recordingSupported || useTextMode) ? (
            <div className="w-full max-w-lg space-y-4">
              {!recordingSupported && (
                <div className="text-center text-amber-400/80 text-xs mb-4 bg-amber-500/[0.05] border border-amber-500/20 rounded-lg px-4 py-2">
                  Voice recording is not supported in this browser. Type your response below instead.
                </div>
              )}
              <textarea
                value={textResponses[currentQuestion]}
                onChange={(e) => {
                  const val = e.target.value;
                  setTextResponses((prev) => {
                    const next = [...prev];
                    next[currentQuestion] = val;
                    return next;
                  });
                }}
                placeholder="Just say what comes to mind — there's no wrong answer here..."
                className="w-full h-40 bg-background/50 border border-border/50 rounded-xl p-4 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs ${hasTextResponse ? 'text-green-400/70' : 'text-muted-foreground/40'}`}>
                  {textResponses[currentQuestion]?.trim().length || 0} / 20 min characters
                </span>
                {recordingSupported && (
                  <button
                    onClick={() => setUseTextMode(false)}
                    className="text-xs text-primary/70 hover:text-primary transition-colors"
                  >
                    Switch to voice →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
          {/* Text mode toggle link */}
          <button
            onClick={() => setUseTextMode(true)}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors mb-4"
          >
            Prefer to type? Switch to text mode
          </button>

          {/* Mic Button */}
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center focus:outline-none"
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.12 }}
          >
            {/* Rotating ring 3 */}
            <motion.div
              className={`absolute inset-[-28px] rounded-full border transition-colors duration-500 ${
                isRecording ? "border-red-500/15" : "border-primary/[0.08]"
              }`}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            {/* Rotating ring 2 */}
            <motion.div
              className={`absolute inset-[-18px] rounded-full border transition-colors duration-500 ${
                isRecording ? "border-red-500/20" : "border-primary/[0.15]"
              }`}
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Outer glow ring */}
            <div
              className={`absolute inset-[-12px] rounded-full transition-all duration-500 ${
                isRecording
                  ? "border border-red-500/30"
                  : hasRecording
                  ? "border border-green-500/20"
                  : "border border-primary/20 mic-pulse"
              }`}
            />

            {/* Recording ping */}
            {isRecording && (
              <motion.div
                className="absolute inset-[-8px] rounded-full bg-red-500/10"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* Main circle */}
            <div
              className={`w-full h-full rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? "border-red-500/60 bg-red-500/[0.08]"
                  : hasRecording
                  ? "border-green-500/50 bg-green-500/[0.06]"
                  : "border-primary/60 bg-primary/[0.06]"
              }`}
              style={{
                boxShadow: isRecording
                  ? "0 0 30px oklch(0.6 0.25 25 / 0.3), inset 0 0 20px oklch(0.6 0.25 25 / 0.05)"
                  : hasRecording
                  ? "0 0 20px oklch(0.6 0.2 145 / 0.2)"
                  : "0 0 30px oklch(0.68 0.08 165 / 0.2), inset 0 0 20px oklch(0.68 0.08 165 / 0.03)",
              }}
            >
              {isRecording ? (
                <MicOff className="w-10 h-10 text-red-400" />
              ) : hasRecording ? (
                <Check className="w-10 h-10 text-green-400" />
              ) : (
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Mic className="w-10 h-10 text-primary" />
                </motion.div>
              )}
            </div>
          </motion.button>

          {/* Recording status */}
          <div className="mt-5 h-8 flex items-center gap-3">
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-red-400/80 text-xs uppercase tracking-wider">Recording</span>
                <RecordingTimer isRecording={isRecording} startTime={recordingStartTime} />
              </motion.div>
            )}
            {!isRecording && hasRecording && (
              <span className="text-green-400/70 text-xs">Got it — tap again if you want to redo</span>
            )}
            {!isRecording && !hasRecording && (
              <span className="text-muted-foreground/40 text-xs tracking-wide">Tap and just start talking</span>
            )}
          </div>

          {/* Waveform */}
          <div className="mt-6 w-full max-w-lg h-[60px]">
            <WaveformVisualizer isRecording={isRecording} analyserNode={analyserRef.current} />
          </div>
            </>
          )}

          {/* Per-answer richness reaction — the momentum flywheel */}
          <AnimatePresence>
            {!isRecording && feedback && (
              <motion.div
                key={`fb-${currentQuestion}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className={`mt-6 max-w-md w-full mx-auto rounded-xl border px-5 py-3 text-center ${FEEDBACK_STYLE[feedback.tier]}`}
              >
                <p className="text-sm font-semibold leading-snug">{FEEDBACK_COPY[feedback.tier].message}</p>
                {feedback.newLines > 0 && (
                  <p className="text-[0.62rem] uppercase tracking-[0.14em] mt-1.5 text-accent/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Lit up {feedback.newLines} new line{feedback.newLines !== 1 ? "s" : ""} · {feedback.totalLines} of 32
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Companion channel — a SEPARATE take, never merged into the member's scored answer */}
          {companionActive && (
            <motion.div
              key={`comp-${currentQuestion}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="mt-6 max-w-md w-full mx-auto rounded-xl border border-accent/25 bg-accent/[0.05] px-5 py-4 text-left"
            >
              <p className="text-[0.6rem] uppercase tracking-[0.15em] text-accent/80 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {companionName ? `${companionName}'s take` : "Your person's take"} · doesn't change their answer
              </p>
              <p className="text-xs text-foreground/70 leading-snug mb-2">
                {companionName ? `${companionName}, speak up` : "Speak up"} — did they nail it, undersell it, or leave out the best part? Say the version they're too modest, or too generous, to tell.
              </p>
              <VoiceCapture
                value={companionResponses[currentQuestion]}
                onCommit={(text) =>
                  setCompanionResponses((prev) => {
                    const n = [...prev];
                    n[currentQuestion] = text;
                    return n;
                  })
                }
                promptLabel="Tap the mic and give your take out loud"
                tone="accent"
              />
            </motion.div>
          )}

          {/* Private question, companion present — protect honesty */}
          {companionMode && question.soloOnly && (
            <div className="mt-6 max-w-md w-full mx-auto rounded-xl border border-border/40 bg-muted/[0.04] px-5 py-3 text-center">
              <p className="text-xs text-muted-foreground/60 leading-snug">
                🙈 Just you for this one{companionName ? ` — ${companionName}, look away` : ""}. Some questions are more honest when it's only you.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={currentQuestion === 0}
              className="text-muted-foreground/50 hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              onClick={goNext}
              disabled={!hasRecording && !hasTextResponse && !isSkipped}
              className={`px-8 py-5 transition-all duration-200 ${
                (hasRecording || hasTextResponse || isSkipped)
                  ? "bg-primary text-white glow-gold hover:translate-y-[-1px] active:scale-[0.97]"
                  : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              {currentQuestion === TOTAL_QUESTIONS - 1 ? "Complete" : "Next"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Right: Radar Chart */}
        <div className="lg:w-[300px] flex flex-col items-center gap-6">
          <motion.p
            className="text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground/30 mb-[-8px]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            32-Dimension Intelligence Map
          </motion.p>
          {activeScores.length > 0 && (
            <motion.p
              key={activeScores.length}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[0.62rem] tracking-[0.12em] text-accent/70 mt-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {activeScores.length} OF 32 LINES LIT
            </motion.p>
          )}
          <AssessmentRadar scores={scores} />

          {/* Preliminary rarity */}
          {preliminaryRarity > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="text-center"
            >
              <p
                className="text-xs uppercase tracking-[0.15em] mb-1"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.55 0.04 65)" }}
              >
                Preliminary
              </p>
              <p
                className="text-xl font-bold text-glow-gold"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}
              >
                1 in {preliminaryRarity.toLocaleString()}
              </p>
            </motion.div>
          )}

          {/* Scored axes list */}
          <div className="space-y-1.5 w-full max-w-[220px]">
            {scores.map((s, i) =>
              s > 0 ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-2 text-xs"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/80" />
                  <span className="text-muted-foreground/60 flex-1 truncate">{AXIS_LABELS[i]}</span>
                  <span
                    className="text-accent/80"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem" }}
                  >
                    {Math.round(s * 100)}
                  </span>
                </motion.div>
              ) : null
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
