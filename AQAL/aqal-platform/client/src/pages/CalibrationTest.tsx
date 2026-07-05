import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, Target, TrendingUp, BarChart3, Brain } from "lucide-react";

// ============================================================
// AQAL — Calibration Test (Meta-Cognitive Line)
// Measures how well confidence tracks accuracy — objectively scorable, hard to fake.
// Scoring method: Brier Score decomposition after Fleming & Lau (2014).
// ============================================================

const ITEMS = [
  { id: "c01", domain: "Biology",   q: "How many bones are in the adult human body?", opts: ["186", "206", "226", "246"], a: 1 },
  { id: "c04", domain: "Astronomy", q: "Which is the largest planet in our solar system?", opts: ["Saturn", "Jupiter", "Neptune", "Earth"], a: 1 },
  { id: "c11", domain: "Biology",   q: "How many hearts does an octopus have?", opts: ["1", "2", "3", "4"], a: 2 },
  { id: "c06", domain: "Chemistry", q: "What is the chemical symbol for gold?", opts: ["Go", "Gd", "Au", "Ag"], a: 2 },
  { id: "c10", domain: "History",   q: "In what year did the Berlin Wall fall?", opts: ["1987", "1989", "1991", "1993"], a: 1 },
  { id: "c09", domain: "Geography", q: "Approximately how many people live in Canada?", opts: ["18M", "28M", "38M", "48M"], a: 2 },
  { id: "c16", domain: "Physics",   q: "Which particle carries a negative charge?", opts: ["Proton", "Neutron", "Electron", "Positron"], a: 2 },
  { id: "c18", domain: "History",   q: "About how long ago was the Great Pyramid of Giza built?", opts: ["~2,500 yrs", "~4,500 yrs", "~6,500 yrs", "~8,500 yrs"], a: 1 },
  { id: "c17", domain: "Geography", q: "How many time zones does the contiguous U.S. span?", opts: ["3", "4", "5", "6"], a: 1 },
  { id: "c14", domain: "Economics", q: "What is the currency of Japan?", opts: ["Won", "Yuan", "Yen", "Ringgit"], a: 2 },
];

interface CalibrationResult {
  calibrationIndex: number;
  direction: number;
  sensitivity: number;
  accuracy: number;
  meanConfidence: number;
  label: string;
  bins: { mid: number; acc: number }[];
}

function scoreCalibration(rows: { confidence: number; correct: number }[]): CalibrationResult {
  const n = rows.length;
  const brier = rows.reduce((s, r) => s + Math.pow(r.confidence - r.correct, 2), 0) / n;
  const meanConfidence = rows.reduce((s, r) => s + r.confidence, 0) / n;
  const accuracy = rows.reduce((s, r) => s + r.correct, 0) / n;
  const direction = meanConfidence - accuracy;
  const corr = rows.filter((r) => r.correct === 1);
  const inc = rows.filter((r) => r.correct === 0);
  const mc = corr.length ? corr.reduce((s, r) => s + r.confidence, 0) / corr.length : 0;
  const mi = inc.length ? inc.reduce((s, r) => s + r.confidence, 0) / inc.length : 0;
  const sensitivity = mc - mi;
  const calibrationIndex = Math.round(Math.max(0, Math.min(1, 1 - brier)) * 100);
  const edges = [0.25, 0.4, 0.55, 0.7, 0.85, 1.0001];
  const bins: { mid: number; acc: number }[] = [];
  for (let b = 0; b < edges.length - 1; b++) {
    const lo = edges[b], hi = edges[b + 1];
    const inBin = rows.filter((r) => r.confidence >= lo && r.confidence < hi);
    if (!inBin.length) continue;
    bins.push({
      mid: inBin.reduce((s, r) => s + r.confidence, 0) / inBin.length,
      acc: inBin.reduce((s, r) => s + r.correct, 0) / inBin.length,
    });
  }
  const cal = calibrationIndex >= 85 ? "Well-calibrated" : calibrationIndex >= 70 ? "Reasonably calibrated" : calibrationIndex >= 55 ? "Loosely calibrated" : "Poorly calibrated";
  const dir = direction > 0.12 ? "notably overconfident" : direction > 0.05 ? "slightly overconfident" : direction < -0.12 ? "notably underconfident" : direction < -0.05 ? "slightly underconfident" : "balanced";
  const sens = sensitivity >= 0.25 ? "your confidence tracked accuracy well" : sensitivity >= 0.1 ? "your confidence tracked accuracy modestly" : "your confidence did not discriminate right from wrong";
  return { calibrationIndex, direction, sensitivity, accuracy, meanConfidence, label: `${cal}, ${dir} — ${sens}.`, bins };
}

function CalibrationChart({ bins }: { bins: { mid: number; acc: number }[] }) {
  const w = 300, h = 200, pad = 36;
  const x = (c: number) => pad + ((c - 0.25) / 0.75) * (w - pad * 2);
  const y = (a: number) => h - pad - a * (h - pad * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[340px] h-auto mx-auto">
      {/* Perfect calibration line */}
      <line x1={pad} y1={h - pad} x2={w - pad} y2={pad} stroke="oklch(0.5 0.05 240 / 0.25)" strokeWidth="1" strokeDasharray="3 3" />
      <text x={w - pad} y={pad - 6} textAnchor="end" fontSize="8" fill="oklch(0.6 0.05 240)" fontFamily="'JetBrains Mono', monospace">
        perfect calibration
      </text>
      {/* Actual calibration curve */}
      <polyline
        points={bins.map((b) => `${x(b.mid)},${y(b.acc)}`).join(" ")}
        fill="none"
        stroke="oklch(0.7 0.12 150)"
        strokeWidth="1.5"
      />
      {bins.map((b, i) => (
        <circle key={i} cx={x(b.mid)} cy={y(b.acc)} r="4" fill="oklch(0.7 0.12 150)" />
      ))}
      {/* Axis labels */}
      <text x={pad} y={h - 12} fontSize="8" fill="oklch(0.5 0.03 240)" fontFamily="'JetBrains Mono', monospace">
        stated confidence →
      </text>
      <text x={pad - 8} y={pad + 4} fontSize="8" fill="oklch(0.5 0.03 240)" fontFamily="'JetBrains Mono', monospace"
        transform={`rotate(-90 ${pad - 8} ${pad + 4})`}>
        actual accuracy →
      </text>
    </svg>
  );
}

export default function CalibrationTest() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answerIndex: number; confidence: number }>>({});
  const [phase, setPhase] = useState<"test" | "results">("test");
  const [pick, setPick] = useState<number | null>(null);
  const [conf, setConf] = useState(60);

  const item = ITEMS[idx];
  const result = useMemo<CalibrationResult | null>(() => {
    if (phase !== "results") return null;
    const rows = ITEMS.map((it) => {
      const ans = answers[it.id];
      return { confidence: ans.confidence, correct: ans.answerIndex === it.a ? 1 : 0 };
    });
    return scoreCalibration(rows);
  }, [phase, answers]);

  function next() {
    if (pick === null) return;
    const updated = { ...answers, [item.id]: { answerIndex: pick, confidence: conf / 100 } };
    setAnswers(updated);
    setPick(null);
    setConf(60);
    if (idx + 1 >= ITEMS.length) setPhase("results");
    else setIdx(idx + 1);
  }

  function restart() {
    setIdx(0);
    setAnswers({});
    setPick(null);
    setConf(60);
    setPhase("test");
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="container max-w-2xl py-12 sm:py-20">
        <AnimatePresence mode="wait">
          {phase === "test" && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Header */}
              <div className="mb-8">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Calibration — Meta-Cognitive Line
                </p>
                <p className="text-sm font-mono text-muted-foreground/80 tracking-wider">
                  Question {idx + 1} of {ITEMS.length}
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-[2px] bg-muted/20 rounded-full mb-10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "oklch(0.7 0.12 150)" }}
                  animate={{ width: `${(idx / ITEMS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.7, 0, 0.2, 1] }}
                />
              </div>

              {/* Question */}
              <p className="text-xs font-mono uppercase tracking-[0.16em] mb-2" style={{ color: "oklch(0.7 0.12 150)" }}>
                {item.domain}
              </p>
              <h2
                className="text-2xl sm:text-3xl text-foreground mb-8 leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
              >
                {item.q}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {item.opts.map((o, i) => (
                  <button
                    key={i}
                    onClick={() => setPick(i)}
                    className={`w-full text-left px-5 py-4 rounded-md border transition-all duration-200 text-sm ${
                      pick === i
                        ? "border-[oklch(0.7_0.12_150)] bg-[oklch(0.7_0.12_150_/_0.08)] text-foreground"
                        : "border-muted/20 bg-muted/5 text-foreground/80 hover:border-muted/40"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>

              {/* Confidence slider */}
              <div className={`mb-8 transition-opacity duration-300 ${pick === null ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    How sure are you?
                  </span>
                  <span className="text-xl font-mono" style={{ color: "oklch(0.7 0.12 150)" }}>
                    {conf}%
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="100"
                  value={conf}
                  onChange={(e) => setConf(Number(e.target.value))}
                  aria-label="Confidence"
                  className="w-full h-[2px] appearance-none bg-muted/20 rounded-full outline-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:border-none 
                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    // @ts-ignore
                    "--tw-slider-thumb-bg": "oklch(0.7 0.12 150)",
                  }}
                />
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60 mt-2">
                  <span>25% · a guess</span>
                  <span>100% · certain</span>
                </div>
              </div>

              {/* Next button */}
              <Button
                onClick={next}
                disabled={pick === null}
                className="font-mono text-xs uppercase tracking-wider px-7 py-5"
                style={{ background: "oklch(0.7 0.12 150)", color: "#0A0E1A" }}
              >
                {idx + 1 >= ITEMS.length ? "See my calibration" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {phase === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Score */}
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
                Calibration Index
              </p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h1
                  className="text-6xl sm:text-8xl text-foreground leading-none mb-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
                >
                  {result.calibrationIndex}
                  <span className="text-2xl sm:text-3xl text-muted-foreground/60"> / 100</span>
                </h1>
              </motion.div>
              <p className="text-sm sm:text-base leading-relaxed mt-3 mb-8 max-w-lg" style={{ color: "oklch(0.7 0.12 150)" }}>
                {result.label}
              </p>

              {/* Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="glass-card rounded-xl p-6 mb-8"
              >
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
                  Confidence vs. Accuracy
                </p>
                <CalibrationChart bins={result.bins} />
                <p className="text-xs text-muted-foreground/60 mt-3 leading-relaxed text-center">
                  The diagonal is perfect calibration. Points above it mean you were more right than you felt; below, more confident than correct.
                </p>
              </motion.div>

              {/* Stats grid */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
              >
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Direction</span>
                  </div>
                  <p className="text-xl font-semibold" style={{ color: "oklch(0.7 0.12 150)" }}>
                    {result.direction > 0.02 ? "Overconfident" : result.direction < -0.02 ? "Underconfident" : "Balanced"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                    Confidence ran {Math.abs(Math.round(result.direction * 100))} pts {result.direction >= 0 ? "ahead of" : "behind"} accuracy.
                  </p>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Discrimination</span>
                  </div>
                  <p className="text-xl font-semibold" style={{ color: "oklch(0.7 0.12 150)" }}>
                    {result.sensitivity >= 0.25 ? "Sharp" : result.sensitivity >= 0.1 ? "Modest" : "Flat"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                    How well your confidence separated right answers from wrong ones.
                  </p>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Accuracy</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {Math.round(result.accuracy * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                    Share of questions you got right.
                  </p>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Avg. Confidence</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {Math.round(result.meanConfidence * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                    How sure you felt, on average.
                  </p>
                </div>
              </motion.div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground/50 leading-relaxed max-w-lg mb-6">
                Calibration is scored as distance from perfect (confidence = accuracy), not as a population percentile — there is no representative norm for it, but perfect calibration is a fixed anchor. Method after Fleming &amp; Lau (2014).
              </p>

              {/* Restart */}
              <button
                onClick={restart}
                className="text-xs font-mono text-muted-foreground/70 hover:text-foreground transition-colors underline underline-offset-2 flex items-center gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                Take it again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <PublicFooter />

      {/* Custom slider thumb styling */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: oklch(0.7 0.12 150);
          cursor: pointer;
          box-shadow: 0 0 10px oklch(0.7 0.12 150 / 0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border: none;
          border-radius: 50%;
          background: oklch(0.7 0.12 150);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
