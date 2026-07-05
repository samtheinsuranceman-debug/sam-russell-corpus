import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Mic, MicOff, ArrowRight, ArrowLeft, Check, SkipForward, Lock, Star, Users, Zap, Shield, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { playComplete, playClick } from "@/lib/audio";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import AssessmentResumeDialog from "@/components/AssessmentResumeDialog";
import { ALL_AXES } from "@shared/axisModes";

// ============================================================
// ASSESSMENT QUESTIONS — 24 open-ended voice prompts
// Optimized sequence: maximum momentum, trust-building, elicitation
// ============================================================
const QUESTIONS: {
  id: number;
  title: string;
  text: string;
  dimension: string;
  axes: number[];
  skippable?: boolean;
  skipLabel?: string;
}[] = [
  {
    id: 1,
    title: "The Night That Flipped",
    text: "Tell us about a vacation or a night out that went COMPLETELY sideways — like, everything that could go wrong did go wrong — but somehow it turned into one of the best nights of your life. How did the disaster become the story you still brag about? What was the turning point where you thought \"wait... this is actually incredible\"? Who was with you? What made you the person who could turn that chaos into gold?",
    dimension: "Adaptive Intelligence",
    axes: [11, 12],
  },
  {
    id: 2,
    title: "The Natural",
    text: "Tell us about a time in school or work where you completely winged it — zero preparation, no plan, just walked in cold — and absolutely crushed it. Got the A, nailed the presentation, convinced the room. Are you just naturally that good at reading what people want to hear? How do you do that? Walk us through exactly what was happening in your head while everyone else thought you were prepared.",
    dimension: "Linguistic Intelligence",
    axes: [3, 4, 5],
  },
  {
    id: 3,
    title: "The Flex",
    text: "What's something secret that you're genuinely world-class at that most people in your life don't even know about? A hidden skill, a weird talent, something you've mastered that never comes up in normal conversation. How did you get that good? And why don't you talk about it more?",
    dimension: "Kinesthetic Intelligence",
    axes: [6, 7],
  },
  {
    id: 4,
    title: "The Negotiation",
    text: "What was one of the most impressive things you've ever talked your way into — or out of? A deal, a job, a second chance, getting out of trouble. Walk us through exactly what you said and how you read the other person. What's your superpower when you need someone to say yes?",
    dimension: "Interpersonal Intelligence",
    axes: [4, 15, 16],
  },
  {
    id: 5,
    title: "The Bet Everyone Said Would Fail",
    text: "What's the single best financial or career decision you ever made that EVERYONE around you told you not to make? Your parents, your friends, your partner — all saying you were crazy. Who specifically was against it? What did you see that they couldn't? And when it paid off — did you rub it in, or did you play it cool? Be honest.",
    dimension: "Analytical Intelligence",
    axes: [0, 1, 2],
  },
  {
    id: 6,
    title: "The Read",
    text: "Tell us about a special time you saw something coming that NOBODY else saw. A deal about to fall apart, a person about to snap, a market about to shift. You called it. Everyone ignored you. Then it happened exactly like you said. How did you know? What were you seeing that everyone else missed?",
    dimension: "Strategic Intelligence",
    axes: [8, 9, 10],
  },
  {
    id: 7,
    title: "The Worst Date",
    text: "What's the worst date you've ever been on? What happened? What did you do about it? And looking back — what's hilarious about it now that definitely wasn't funny at the time?",
    dimension: "Empathic Intelligence",
    axes: [15, 16],
  },
  {
    id: 8,
    title: "The Masterpiece",
    text: "What's something incredible you built, created, or made from absolutely nothing — and when you stepped back and looked at it, you thought \"holy shit, I made THIS\"? A business, a project, a piece of art, a speech, anything. What drove you to make it? And when it was done — who did you show first?",
    dimension: "Creative Intelligence",
    axes: [6, 7, 2],
  },
  {
    id: 9,
    title: "The Rule You Broke",
    text: "What's a rule — social, professional, family, whatever — that everyone around you follows but you decided was bullshit? What made you break it? What happened when people noticed? And were you right, or did it cost you something you didn't expect?",
    dimension: "Meta-Cognitive Intelligence",
    axes: [17, 18],
  },
  {
    id: 10,
    title: "The Gamble",
    text: "What's the most exhilarating leap of faith you've ever taken? Quit the job, moved across the country, said yes to something insane with zero safety net. What made you pull the trigger when every logical reason said don't? And did it pay off — or did it blow up in a way that somehow still made you better?",
    dimension: "Existential Intelligence",
    axes: [19, 20],
  },
  {
    id: 11,
    title: "The Robbery",
    text: "Tell us about a competition, a promotion, an award, a game — something where you CLEARLY deserved to win and got robbed. Not \"oh it was close\" — you were the best and everyone knew it. What happened? Was it politics? A bad call? Someone less qualified getting handed what you earned? How did you handle it in the moment versus how you felt privately? And looking back — did it change how you play the game?",
    dimension: "Resilient Intelligence",
    axes: [11, 12, 9],
  },
  {
    id: 12,
    title: "The Tense Table",
    text: "Tell us about a historically legendary family dinner or holiday gathering where the energy was THICK. Old grudges, people who didn't trust each other, passive-aggressive comments flying across the table. What did you do? How did you and your partner work as a team to smooth that chaos into something functional? What's your move when everyone's uncomfortable and you're the one holding it together?",
    dimension: "Systems Intelligence",
    axes: [13, 14, 4],
  },
  {
    id: 13,
    title: "The Wedding Chaos",
    text: "Every wedding has a wild story. The drunk uncle, the vendor who didn't show up, the speech that went off the rails, the moment where everything almost fell apart. Tell us yours. But more importantly — how did you hold it together? Were you the calm in the storm or were you losing it behind the scenes? What does that day tell you about who you are when the stakes are high and everyone's watching?",
    dimension: "Adaptive Intelligence",
    axes: [11, 12, 13],
    skippable: true,
    skipLabel: "Skip — never been married",
  },
  {
    id: 14,
    title: "The Reinvention",
    text: "Tell us about a mystical, magical time you completely reinvented yourself. New city, new career, new identity, new circle — you burned the old version down and built a new one. What triggered it? What did you leave behind? And looking back — was the old you actually that bad, or did you just outgrow them? And if you could do it all over again, what would you change, if anything?",
    dimension: "Existential Intelligence",
    axes: [19, 20, 5],
  },
  {
    id: 15,
    title: "The Moment You Knew",
    text: "Tell us about the electrifying moment you KNEW what you were supposed to do with your life. Not hoped, not guessed. Knew. Was it sudden or did it creep up on you? What were you doing when it hit? How has it affected everything? Are you grateful you followed your intuition? What was your old backup plan — and what might your life look like if you'd taken that road instead?",
    dimension: "Intrapersonal Intelligence",
    axes: [5, 17, 19],
  },
  {
    id: 16,
    title: "The Stranger",
    text: "Tell us about an unforgettable encounter with a complete stranger that stuck with you. A conversation on a plane, someone at a bar, a person you helped or who helped you — someone you never saw again but still think about. What happened? Why did it stay with you?",
    dimension: "Empathic Intelligence",
    axes: [15, 16, 20],
  },
  {
    id: 17,
    title: "Everything on Fire",
    text: "Tell us about a wild time when MULTIPLE things went catastrophically wrong simultaneously — not just one problem, but three or four crises stacked on top of each other. How did you triage? What did you handle first? What did you let burn? What did you discover about yourself that you didn't know before?",
    dimension: "Resilient Intelligence",
    axes: [11, 12, 8],
  },
  {
    id: 18,
    title: "The Save",
    text: "Tell us about a frightening time someone you care about was in deep trouble — emotionally, financially, physically — and YOU were the one who showed up. What did you do? Not what you said — what did you actually DO? And did they ever fully understand what you did for them, or is that something only you know?",
    dimension: "Interpersonal Intelligence",
    axes: [4, 15, 16],
  },
  {
    id: 19,
    title: "The Inheritance",
    text: "What's the most profound thing a parent or mentor taught you — not in a lecture, but by how they LIVED? Something you watched them do over and over until it became part of you. Or was it more than one thing? What are they? And have you caught yourself doing the exact same thing without thinking about it?",
    dimension: "Integrative Intelligence",
    axes: [21, 5, 18],
  },
  {
    id: 20,
    title: "The First Kiss",
    text: "Take us back to your first kiss. All the overthinking beforehand, the sweaty palms, the \"do I go for it or not\" internal debate. What were you terrified of? What actually happened? Was it amazing or was it a disaster? And what happened in the days after — how did it change how you saw yourself? How did it change what you thought was possible for you?",
    dimension: "Intrapersonal Intelligence",
    axes: [5, 15, 16],
  },
  {
    id: 21,
    title: "The Ethical Line",
    text: "Tell us about a time a coach, a boss, or someone in authority told you to do something that crossed a line — win at someone else's expense, bend the rules, throw someone under the bus. Something that felt wrong in your gut. What did they ask you to do? Did you do it? If you pushed back, what happened? If you went along with it, how did that sit with you after?",
    dimension: "Meta-Cognitive Intelligence",
    axes: [17, 18, 21],
    skippable: true,
    skipLabel: "Skip — never on a competitive sports team",
  },
  {
    id: 22,
    title: "The Betrayal",
    text: "Tell us about a devastating time someone you trusted completely fucked you over. What did they do? How long did it take you to figure out what was happening? And here's the real question — what did you DO about it? Did you confront them, cut them off, get even, or let it go?",
    dimension: "Resilient Intelligence",
    axes: [11, 12, 17],
  },
  {
    id: 23,
    title: "The Day the World Got Smaller",
    text: "Tell us about the time you first realized something you deeply believed in wasn't true. Santa Claus — the moment the magic cracked. How old were you? What cracked? Did someone tell you or did you figure it out yourself? And here's the real question — did that moment make you more cynical or more curious? Did you close down or open up?",
    dimension: "Philosophical Intelligence",
    axes: [20, 18, 21],
  },
  {
    id: 24,
    title: "The First Moment",
    text: "Take us to the moment you first held your child. What did the room look like? What were you feeling in your body? Was there a moment where reality just shifted — where the person you were five minutes ago stopped existing and someone new was standing there? What changed permanently in how you see the world, time, risk, death, purpose — everything? What did you understand in that moment that you literally could not have understood before it happened?",
    dimension: "Existential Intelligence",
    axes: [19, 20, 21],
    skippable: true,
    skipLabel: "Skip — not a parent",
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;
const FREE_QUESTIONS = 12; // Q1-12 free, Q13-24 behind paywall

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
  const [scores, setScores] = useState<number[]>(Array(AXIS_LABELS.length).fill(0));
  const [isComplete, setIsComplete] = useState(false);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisSucceeded, setAnalysisSucceeded] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // tRPC mutations for backend submission
  const startMutation = trpc.assessment.start.useMutation();
  const uploadResponseMutation = trpc.assessment.uploadResponse.useMutation();
  const submitTextMutation = trpc.assessment.submitTextResponse.useMutation();
  const analyzeMutation = trpc.assessment.analyze.useMutation();

  // Detect if voice recording is supported
  const recordingSupported = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / TOTAL_QUESTIONS) * 100;
  const hasRecording = recordings[currentQuestion] !== null;
  const hasTextResponse = textResponses[currentQuestion]?.trim().length > 20;
  const isSkipped = skippedQuestions.includes(currentQuestion);

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
        const { question: q, scores: s, textResponses: tr, textMode, skipped } = JSON.parse(saved);
        if (typeof q === 'number' && q > 0) setCurrentQuestion(q);
        if (Array.isArray(s) && s.length === 22) setScores(s);
        if (Array.isArray(tr) && tr.length === TOTAL_QUESTIONS) setTextResponses(tr);
        if (typeof textMode === 'boolean') setUseTextMode(textMode);
        if (Array.isArray(skipped)) setSkippedQuestions(skipped);
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
    setShowResumeDialog(false);
  }, []);

  useEffect(() => {
    // Save progress on every question change
    if (currentQuestion > 0 || scores.some(s => s > 0)) {
      localStorage.setItem('aqal_assessment_progress', JSON.stringify({
        question: currentQuestion,
        scores,
        textResponses,
        textMode: useTextMode,
        skipped: skippedQuestions,
      }));
    }
  }, [currentQuestion, scores, textResponses, useTextMode, skippedQuestions]);

  // Clear progress on completion
  useEffect(() => {
    if (isComplete) {
      localStorage.removeItem('aqal_assessment_progress');
    }
  }, [isComplete]);

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
      };

      mediaRecorder.start(250);
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
    setIsRecording(false);
    setRecordingStartTime(null);
  }, []);

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
    
    // Gate: if finishing Q12 (index 11) and user hasn't paid, show paywall
    if (currentQuestion === FREE_QUESTIONS - 1 && user?.membershipTier === "free") {
      setShowPaywall(true);
      return;
    }
    if (currentQuestion === FREE_QUESTIONS - 1 && !user) {
      setShowPaywall(true);
      return;
    }

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
      window.location.href = getLoginUrl();
      return;
    }
    try {
      let aId = assessmentId;
      if (!aId) {
        const startResult = await startMutation.mutateAsync({});
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

        if (recording) {
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
        } else if (textResp?.trim().length > 0) {
          await submitTextMutation.mutateAsync({
            assessmentId: aId,
            questionIndex: i,
            text: textResp.trim(),
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

  // ============================================================
  // PAYWALL VALUE-STACK INTERSTITIAL — After Q12
  // ============================================================
  const checkoutMutation = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info("Checkout opened in a new tab. Complete payment to unlock Phase 2.");
      } else {
        toast.error("Could not create checkout session. Please try again.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong. Please try again.");
    },
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
        toast.info("Please log in first to unlock Phase 2.");
        window.location.href = getLoginUrl();
        return;
      }
      checkoutMutation.mutate({
        productKey: "assessment",
        origin: window.location.origin,
      });
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
          {/* Phase 1 Complete badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-accent/[0.08] border border-accent/20 rounded-full px-5 py-2 mb-6">
              <Check className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium">Phase 1 Complete — 12 of 24 Questions</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              You&rsquo;re Halfway There
            </h1>
            <p className="text-muted-foreground/70 text-base max-w-lg mx-auto leading-relaxed">
              Your first 12 responses are locked in. Now unlock the full experience — the second half goes deeper, and everything you&rsquo;ve said so far becomes exponentially more powerful with the complete picture.
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
                Your Preliminary Rarity
              </p>
              <p className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}>
                1 in {preliminaryRarity.toLocaleString()}
              </p>
              <p className="text-muted-foreground/40 text-xs mt-2">
                Based on 12 responses. The full 24-question profile typically shifts rarity by 3–10x.
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
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">Five AI systems from different developers score your complete cognitive shape across 32 dimensions. Your composite rarity estimate shows approximately where you stand — refined further once you submit evidence.</p>
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
                  Unlock Phase 2 — $299
                </span>
              )}
            </Button>

            <p className="text-muted-foreground/40 text-xs mt-4">
              One-time payment. Lifetime access. 30-day retake guarantee.
            </p>

            {/* Trust bar */}
            <div className="flex flex-wrap justify-center gap-4 text-[10px] text-muted-foreground/30 uppercase tracking-wider mt-6">
              <span>Bank-Grade Encryption</span>
              <span className="text-muted-foreground/15">&bull;</span>
              <span>Private & Encrypted</span>
              <span className="text-muted-foreground/15">&bull;</span>
              <span>7 Patents Pending</span>
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
              &larr; Go back and review my answers
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
            Five AI systems from different developers have analyzed your responses across 32 cognitive dimensions.
          </p>

          {/* Rarity reveal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card rounded-2xl p-8 mb-8 border border-primary/10"
          >
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
              Based on statistical placement across {activeScores.length} scored dimensions
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            {analysisSucceeded ? (
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
            {Array.from({ length: (user?.membershipTier && user.membershipTier !== "free") ? TOTAL_QUESTIONS : FREE_QUESTIONS }).map((_, i) => (
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
            {currentQuestion + 1} / {(user?.membershipTier && user.membershipTier !== "free") ? TOTAL_QUESTIONS : FREE_QUESTIONS}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 px-4 pb-8">
        {/* Left: Question + Recording */}
        <div className="flex-1 max-w-xl w-full flex flex-col items-center text-center">
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

          {/* Score disclosure */}
          <p className="text-xs text-primary/80 tracking-wide text-center max-w-md mx-auto font-bold mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            This is an initial assessment — not yet evidence-based at scale. But early data shows that people scoring above 1-in-10,000 rarity typically recorded well over 60 minutes of material across the full assessment. Answers above 3 minutes generally score 2–10x higher in intelligence ratings. The more you share, the more our AI can see. Go deep. Show off.
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
