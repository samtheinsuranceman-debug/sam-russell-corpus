import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion, useInView } from "framer-motion";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Shield, Users, Brain, ArrowRight, Lock, Eye, Zap, RefreshCw, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { playClick } from "@/lib/audio";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { STRENGTH_CLUSTERS, GROWTH_CLUSTERS, type ClusterDefinition } from "@shared/clusters";
import { CLUSTER_IMAGE_MAP } from "@shared/clusterImages";
import { axisMode, modeColor, MODE_META, ALL_AXES } from "@shared/axisModes";

// The full 32-line profile, in the order defined by the single source of truth.
const AXIS_LABELS = ALL_AXES;

// Short descriptions for each axis
const AXIS_DESCRIPTIONS: Record<string, string> = {
  "Logical": "You consistently abstract to multi-variable models and detect logical inconsistencies others miss.",
  "Mathematical": "Quantitative patterns emerge naturally in your thinking — you see numbers as relationships.",
  "Spatial": "You navigate complex spatial relationships and visualize systems in three dimensions.",
  "Linguistic": "Your language carries precision and nuance — you choose words that do real work.",
  "Interpersonal": "You read social dynamics in real-time and adapt your communication instinctively.",
  "Intrapersonal": "You maintain unusual self-awareness — you know what you're feeling and why.",
  "Musical": "You detect patterns in rhythm, tone, and timing that others experience as background noise.",
  "Kinesthetic": "Your body intelligence is high — you learn through movement and physical engagement.",
  "Naturalistic": "You classify, categorize, and see taxonomic relationships in complex systems.",
  "Strategic": "You think several moves ahead and identify leverage points in complex situations.",
  "Tactical": "You execute under pressure — translating strategy into immediate, decisive action.",
  "Adaptive": "When conditions change, you don't freeze — you recalibrate faster than most.",
  "Resilient": "You absorb setbacks without losing trajectory. Your recovery time is unusually short.",
  "Systematic": "You build processes that work without you. You think in systems, not tasks.",
  "Architectural": "You design structures — organizational, conceptual, physical — that hold weight.",
  "Empathic": "You feel what others feel before they articulate it. This is data, not sentiment.",
  "Intuitive": "Your pattern recognition operates below conscious awareness and surfaces as 'knowing.'",
  "Meta-Cognitive": "You think about your own thinking. You can observe your mind mid-process.",
  "Reflective": "You extract meaning from experience deliberately — not just living, but learning.",
  "Existential": "You engage with questions of meaning, purpose, and mortality without flinching.",
  "Philosophical": "You hold multiple frameworks simultaneously and see where they converge.",
  "Integrative": "You synthesize across domains — connecting ideas that others keep in separate boxes.",
  "Volitional": "You convert intention into sustained action — follow-through is a reflex, not a struggle.",
  "Adversarial": "You hold your ground under pressure and think clearly inside conflict.",
  "Interoceptive": "You read your own internal signals — the body's data reaches you early and clearly.",
  "Aesthetic": "You perceive form, proportion, and beauty as information, and compose with it.",
  "Influence": "You move people — shaping belief and action through presence and framing.",
  "Humor": "You find the unexpected angle fast — wit as a native mode of pattern recognition.",
  "Parenting": "A developmental stance: how you steward, protect, and grow another person over time.",
  "Seduction": "A developmental stance: how you create attraction, charge, and mutual desire.",
  "Community-Founding": "A developmental stance: how you gather people and build belonging that lasts.",
  "Financial-Self-Management": "A developmental stance: your relationship to money, risk, and long-horizon provision.",
};

// Fallback for any line without a bespoke description.
function axisDescription(name: string): string {
  return AXIS_DESCRIPTIONS[name] ?? `Your ${name} line, read from your responses.`;
}

// ============================================================
// FULL RADAR CHART with staged reveal animation
// ============================================================
function FullRadarChart({ scores }: { scores: number[] }) {
  const axes = AXIS_LABELS.length;
  const cx = 200, cy = 200, r = 160;
  const [phase, setPhase] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  const displayScores = phase >= 2 ? scores : scores.map(() => 0);

  const polygonPoints = displayScores
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
      const val = Math.max(v, 0.02);
      return `${cx + Math.cos(angle) * r * val},${cy + Math.sin(angle) * r * val}`;
    })
    .join(" ");

  const gridScales = [0.25, 0.5, 0.75, 1];

  return (
    <div ref={ref} className="relative">
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 2 }}
      >
        <div className="w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-[80px]" />
      </motion.div>

      <svg viewBox="0 0 400 400" className="w-full max-w-[500px] mx-auto relative z-10">
        {gridScales.map((scale, i) => (
          <motion.polygon
            key={i}
            points={Array.from({ length: axes }, (_, j) => {
              const angle = (Math.PI * 2 * j) / axes - Math.PI / 2;
              return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`;
            }).join(" ")}
            fill="none"
            stroke="oklch(0.24 0.03 65)"
            strokeWidth="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 1 ? 0.4 : 0 }}
            transition={{ duration: 0.8, delay: i * 0.15 }}
          />
        ))}

        {Array.from({ length: axes }, (_, i) => {
          const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
          const labelR = r + 22;
          const lx = cx + Math.cos(angle) * labelR;
          const ly = cy + Math.sin(angle) * labelR;
          const score = scores[i] || 0;
          const isHigh = score >= 0.7;
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 1 ? 1 : 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.04 }}
            >
              <line
                x1={cx} y1={cy}
                x2={cx + Math.cos(angle) * r}
                y2={cy + Math.sin(angle) * r}
                stroke={isHigh && phase >= 2 ? "oklch(0.68 0.08 165)" : "oklch(0.25 0.02 260)"}
                strokeWidth={isHigh && phase >= 2 ? "1" : "0.3"}
                opacity={isHigh && phase >= 2 ? 0.8 : 0.4}
                style={{ transition: "all 0.8s ease" }}
              />
              <text
                x={lx} y={ly}
                textAnchor="middle" dominantBaseline="middle"
                fill={isHigh && phase >= 2 ? "oklch(0.78 0.12 85)" : "oklch(0.4 0.02 260)"}
                fontSize="6.5" fontFamily="Inter, sans-serif"
                style={{ transition: "fill 0.8s ease" }}
              >
                {AXIS_LABELS[i]}
              </text>
            </motion.g>
          );
        })}

        <motion.polygon
          points={polygonPoints}
          fill="oklch(0.68 0.08 165)"
          fillOpacity={phase >= 2 ? 0.12 : 0}
          stroke="oklch(0.78 0.12 85)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 1 : 0 }}
          transition={{ duration: 2.5, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
          style={{ filter: phase >= 2 ? 'drop-shadow(0 0 6px oklch(0.68 0.08 165 / 0.4))' : 'none' }}
        />

        {displayScores.map((v, i) => {
          if (v <= 0.02) return null;
          const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
          const isHigh = v >= 0.7;
          const dotColor = modeColor(AXIS_LABELS[i]);
          return (
            <motion.circle
              key={i}
              cx={cx + Math.cos(angle) * r * v}
              cy={cy + Math.sin(angle) * r * v}
              r={isHigh ? 4.5 : 3}
              fill={dotColor}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: phase >= 2 ? 1 : 0, opacity: phase >= 2 ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 1.8 + i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ filter: isHigh ? `drop-shadow(0 0 4px ${dotColor}99)` : 'none' }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// POWER COMBINATION VENN — overlapping strength intersections
// ============================================================
function PowerCombinationVenn({ strengths }: { strengths: { axis: string; score: number }[] }) {
  if (strengths.length < 3) return null;

  // Generate power combinations from top strengths
  const combos = [
    { axes: [strengths[0], strengths[1]], name: `${strengths[0].axis} + ${strengths[1].axis}`, color1: "oklch(0.68 0.08 165)", color2: "oklch(0.78 0.12 85)" },
    { axes: [strengths[1], strengths[2]], name: `${strengths[1].axis} + ${strengths[2].axis}`, color1: "oklch(0.78 0.12 85)", color2: "oklch(0.78 0.12 85)" },
    { axes: [strengths[0], strengths[2]], name: `${strengths[0].axis} + ${strengths[2].axis}`, color1: "oklch(0.68 0.08 165)", color2: "oklch(0.78 0.12 85)" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {combos.map((combo, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card p-5 rounded-xl text-center relative overflow-hidden"
        >
          {/* Venn circles */}
          <div className="relative w-24 h-16 mx-auto mb-3">
            <motion.div
              className="absolute left-2 top-1 w-14 h-14 rounded-full"
              style={{ background: combo.color1, opacity: 0.15 }}
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-2 top-1 w-14 h-14 rounded-full"
              style={{ background: combo.color2, opacity: 0.15 }}
              animate={{ x: [0, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            {/* Intersection glow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 blur-[6px]" />
          </div>

          <p className="text-xs font-semibold text-foreground mb-1">{combo.name}</p>
          <p className="text-[10px] text-muted-foreground/60">
            Combined score: {Math.round(((combo.axes[0].score + combo.axes[1].score) / 2) * 100)}%
          </p>
          <p className="text-[10px] text-primary/70 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {(() => {
              const avg = (combo.axes[0].score + combo.axes[1].score) / 2;
              return avg >= 0.85 ? "Exceptional pairing" : avg >= 0.7 ? "Rare pairing" : avg >= 0.55 ? "Strong pairing" : "Notable pairing";
            })()}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// ANIMATED RARITY REVEAL with count-up
// ============================================================
function RarityCountUp({ rarity, populationRarity = null, generation = null }: { rarity: number; populationRarity?: number | null; generation?: string | null }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    const revealTimer = setTimeout(() => {
      setRevealed(true);
      const start = Math.max(100, Math.floor(rarity * 0.1));
      const end = rarity;
      const duration = 2400;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(start + (end - start) * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 800);
    return () => clearTimeout(revealTimer);
  }, [isInView, rarity]);

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: revealed ? 1 : 0.3, scale: revealed ? 1 : 0.95 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        className="text-center"
      >
        <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {generation ? `Rarity — Among ${generation}` : "Preliminary Rarity"}
        </p>
        <div
          className="text-5xl sm:text-7xl font-bold text-glow-gold inline-block"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}
        >
          {revealed ? `1 in ${displayValue.toLocaleString()}` : (
            <motion.span animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
              Analyzing...
            </motion.span>
          )}
        </div>
        {revealed && populationRarity ? (
          <p className="text-sm text-muted-foreground/50 mt-3">
            1 in {populationRarity.toLocaleString()} <span className="text-muted-foreground/35">across the whole population</span>
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground/40 mt-3">
          {generation
            ? "A model-based estimate, not a measured percentile. Ranked within your generation, then the population — developmental lines are age-adjusted; IQ-style lines are already age-normed."
            : "A model-based estimate, not a measured percentile — refined once you submit evidence."}
        </p>
      </motion.div>
    </div>
  );
}

// ============================================================
// MINI RADAR CHART for complementary matching visualization
// ============================================================
function MiniRadar({ scores, color, size = 120 }: { scores: number[]; color: string; size?: number }) {
  const axes = AXIS_LABELS.length;
  const cx = size / 2, cy = size / 2, r = size * 0.4;

  const polygonPoints = scores
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
      const val = Math.max(v, 0.05);
      return `${cx + Math.cos(angle) * r * val},${cy + Math.sin(angle) * r * val}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      <polygon
        points={Array.from({ length: axes }, (_, j) => {
          const angle = (Math.PI * 2 * j) / axes - Math.PI / 2;
          return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
        }).join(" ")}
        fill="none"
        stroke="oklch(0.24 0.03 65)"
        strokeWidth="0.5"
        opacity={0.3}
      />
      <polygon
        points={polygonPoints}
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ============================================================
// AXIS-TO-CLUSTER SEMANTIC MAPPING
// Maps display line names to the semantic axis keys used by clusters
// ============================================================
const AXIS_TO_SEMANTIC: Record<string, string[]> = {
  "Logical": ["cognitive-complexity", "analytical-depth", "pattern-recognition"],
  "Mathematical": ["analytical-depth", "pattern-recognition"],
  "Spatial": ["systems-thinking", "aesthetic-intelligence"],
  "Linguistic": ["linguistic-intelligence", "communicative-power", "narrative-capacity"],
  "Interpersonal": ["interpersonal-depth", "social-intelligence", "collaborative-capacity"],
  "Intrapersonal": ["introspective-depth", "psychological-integration", "self-honesty"],
  "Musical": ["aesthetic-intelligence", "sensory-aliveness"],
  "Kinesthetic": ["somatic-awareness", "physical-intelligence", "embodied-presence"],
  "Naturalistic": ["systems-thinking", "contemplative-depth"],
  "Strategic": ["strategic-thinking", "temporal-intelligence", "generative-capacity"],
  "Tactical": ["executive-function", "action-bias", "decisiveness"],
  "Adaptive": ["adaptability", "stress-resilience", "cognitive-flexibility"],
  "Resilient": ["resilience", "stress-resilience", "recovery-capacity"],
  "Systematic": ["systems-thinking", "executive-function", "completion-drive"],
  "Architectural": ["systems-thinking", "strategic-thinking", "creative-synthesis"],
  "Empathic": ["emotional-intelligence", "interpersonal-depth", "somatic-awareness"],
  "Intuitive": ["intuitive-synthesis", "pattern-recognition", "presence"],
  "Meta-Cognitive": ["cognitive-complexity", "introspective-depth", "self-honesty"],
  "Reflective": ["contemplative-depth", "psychological-integration", "wisdom-synthesis"],
  "Existential": ["purpose-clarity", "values-alignment", "moral-reasoning"],
  "Philosophical": ["integrative-capacity", "cognitive-complexity", "wisdom-synthesis"],
  "Integrative": ["integrative-capacity", "creative-synthesis", "wisdom-synthesis"],
};

/** Convert line display scores to semantic cluster scores */
function buildSemanticScores(axisScores: { axis: string; score: number }[]): Record<string, number> {
  const semantic: Record<string, number[]> = {};
  for (const { axis, score } of axisScores) {
    const keys = AXIS_TO_SEMANTIC[axis] || [];
    for (const key of keys) {
      if (!semantic[key]) semantic[key] = [];
      semantic[key].push(score);
    }
  }
  // Average all contributions to each semantic key
  const result: Record<string, number> = {};
  for (const [key, values] of Object.entries(semantic)) {
    result[key] = values.reduce((a, b) => a + b, 0) / values.length;
  }
  return result;
}

/** Match clusters using semantic scores */
function matchStrengthClusters(axisScores: { axis: string; score: number }[]): ClusterDefinition[] {
  const semantic = buildSemanticScores(axisScores);
  const scored = STRENGTH_CLUSTERS.map(cluster => {
    const clusterAxisScores = cluster.axes.map(a => semantic[a] || 0);
    const avg = clusterAxisScores.reduce((a, b) => a + b, 0) / clusterAxisScores.length;
    return { cluster, score: avg };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.cluster);
}

function matchGrowthClusters(axisScores: { axis: string; score: number }[]): ClusterDefinition[] {
  const semantic = buildSemanticScores(axisScores);
  const scored = GROWTH_CLUSTERS.map(cluster => {
    const clusterAxisScores = cluster.axes.map(a => semantic[a] || 0.5);
    const avg = clusterAxisScores.reduce((a, b) => a + b, 0) / clusterAxisScores.length;
    return { cluster, score: 1 - avg };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.cluster);
}

// ============================================================
// STRENGTH CLUSTER CARD — with archetype image
// ============================================================
function StrengthClusterCard({ cluster, index }: { cluster: ClusterDefinition; index: number }) {
  const imageUrl = CLUSTER_IMAGE_MAP[cluster.imageKey];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card rounded-2xl border border-primary/20 overflow-hidden"
    >
      {/* Cluster image */}
      {imageUrl && (
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img
            src={imageUrl}
            alt={cluster.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-2xl mr-2">{cluster.emoji}</span>
            <span
              className="text-lg font-bold text-foreground drop-shadow-lg"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {cluster.name}
            </span>
          </div>
        </div>
      )}
      {/* Content */}
      <div className="p-5">
        <p className="text-sm text-muted-foreground/80 leading-relaxed">
          {cluster.description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================
// GROWTH EDGE CLUSTER CARD — with archetype image
// ============================================================
function GrowthClusterCard({ cluster, index }: { cluster: ClusterDefinition; index: number }) {
  const imageUrl = CLUSTER_IMAGE_MAP[cluster.imageKey];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card rounded-2xl border border-primary/15 overflow-hidden"
    >
      {/* Cluster image */}
      {imageUrl && (
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img
            src={imageUrl}
            alt={cluster.name}
            className="w-full h-full object-cover opacity-80"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-2xl mr-2">{cluster.emoji}</span>
            <span
              className="text-lg font-bold text-foreground/90 drop-shadow-lg"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {cluster.name}
            </span>
          </div>
        </div>
      )}
      {/* Content */}
      <div className="p-5">
        <p className="text-sm text-muted-foreground/70 leading-relaxed">
          {cluster.description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================
// LEGACY STRENGTH CARD (axis-level, kept for detail view)
// Now renders with mode-colored bar and honest verb per axisModes.ts
// ============================================================
function StrengthCard({ axis, score, index }: { axis: string; score: number; index: number }) {
  const mode = axisMode(axis);
  const color = modeColor(axis);
  const meta = MODE_META[mode];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card p-4 rounded-xl"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-foreground">{axis}</span>
        <span
          className="text-xs font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color }}
        >
          {Math.round(score * 100)}
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color }}>
        {meta.label} — {meta.verb}
      </p>
      <p className="text-xs text-muted-foreground/70 leading-relaxed">
        {axisDescription(axis)}
      </p>
      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(to right, ${color}99, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================
// LEGACY GROWTH EDGE CARD (axis-level)
// Now renders with mode-colored indicator and honest verb
// ============================================================
function GrowthEdgeCard({ axis, score, index }: { axis: string; score: number; index: number }) {
  const mode = axisMode(axis);
  const color = modeColor(axis);
  const meta = MODE_META[mode];
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card p-4 rounded-xl border border-primary/10"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-foreground/80">{axis}</span>
        <span
          className="text-xs font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color, opacity: 0.7 }}
        >
          {Math.round(score * 100)}
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color, opacity: 0.6 }}>
        {meta.label} — {meta.verb}
      </p>
      <p className="text-xs text-muted-foreground/60 leading-relaxed">
        This is where your complementary matches shine — and where their gifts become yours.
      </p>
      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(to right, ${color}66, ${color}33)` }}
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ delay: 0.7 + index * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================
// COMPLEMENTARY MATCH PREVIEW (masked)
// ============================================================
function MatchPreview({ match, index }: { match: { initial: string; city: string; rarity: number; strengths: string[]; complementarity: number }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card p-5 rounded-xl border border-accent/15 relative overflow-hidden"
    >
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/[0.04] rounded-full blur-[30px]" />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/80/20 flex items-center justify-center border border-accent/20">
            <span className="text-sm font-semibold text-accent">{match.initial}</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">{match.initial}., {match.city}</span>
            <p className="text-xs text-muted-foreground/50">1 in {match.rarity.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className="text-lg font-bold text-accent"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {match.complementarity}%
          </span>
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Complementarity</p>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-xs text-muted-foreground/50 mb-1.5">Their top strengths:</p>
        <div className="flex flex-wrap gap-1.5">
          {match.strengths.map((s) => (
            <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/[0.08] text-accent/80 border border-accent/10">
              {s}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// UNDERWRITTEN BY — the live AI panel that scored the result (honest)
// ============================================================
function UnderwrittenBy({ fullAccess }: { fullAccess: boolean }) {
  const status = trpc.platform.status.useQuery(undefined, { staleTime: 5 * 60_000, retry: false });
  const panel: string[] = status.data?.panel ?? [];
  // Only surface a "consensus" panel when 2+ models are actually live. Single
  // model or mock → no panel claim (the preview banner covers the mock state).
  if (panel.length < 2) return null;

  return (
    <div className="max-w-2xl mx-auto mb-16 text-center">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/50 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {fullAccess ? `Underwritten by ${panel.length} AI systems` : `Verified results are underwritten by ${panel.length} AI systems`}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {panel.map((m) => (
          <span key={m} className="text-xs px-3 py-1.5 rounded-full border border-primary/15 bg-primary/[0.04] text-foreground/75">
            {m}
          </span>
        ))}
      </div>
      <p className="text-[0.7rem] text-muted-foreground/40 mt-3 leading-relaxed">
        {fullAccess
          ? "Each scored your responses independently; your result is their consensus (trimmed mean), so no single model decides it."
          : "Your preliminary result used a single model. The evidence-based tier runs the full panel above and takes their consensus."}
      </p>
    </div>
  );
}

// ============================================================
// OUTCOME ENGINEERING — goal-aligned diagnosis + prescriptions
// ============================================================
const RISK_COLOR: Record<string, string> = {
  Low: "#9BC0B2", Moderate: "#E0C68C", High: "#D19A72", Severe: "#C85C44",
};

function OutcomeEngineering({ fullAccess }: { fullAccess: boolean }) {
  const gen = trpc.coaching.outcomeReport.useMutation();
  const report = gen.data && "report" in gen.data ? gen.data.report : null;

  return (
    <div className="max-w-3xl mx-auto mb-20">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-accent/60 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Outcome Engineering
        </p>
        <h2 className="text-2xl sm:text-3xl text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
          Which lines threaten what you want — and the move that fixes it
        </h2>
      </div>

      {!fullAccess ? (
        <div className="glass-card rounded-2xl p-8 text-center border border-primary/15">
          <Shield className="w-6 h-6 text-primary/60 mx-auto mb-3" />
          <p className="text-muted-foreground/80 text-sm leading-relaxed mb-5 max-w-md mx-auto">
            The evidence-based tier diagnoses which of your weakness clusters most threaten your stated
            goals, explains why, and prescribes the highest-leverage move — with the research to back it.
          </p>
          <Link href="/pricing">
            <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 active:scale-[0.97] transition-all">
              Unlock your outcome plan
            </button>
          </Link>
        </div>
      ) : !report ? (
        <div className="text-center">
          <button
            onClick={() => gen.mutate({})}
            disabled={gen.isPending}
            className="px-7 py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold shadow-lg shadow-primary/20 active:scale-[0.97] transition-all"
          >
            {gen.isPending ? "Engineering your plan…" : "Generate my outcome plan"}
          </button>
          <p className="text-[0.7rem] text-muted-foreground/40 mt-3">Reads your profile and the goals you named in the assessment.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-6 border border-primary/15">
            <p className="text-foreground/90 leading-relaxed">{report.summary}</p>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-start gap-2">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-accent/70 mt-1 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Keystone move</span>
              <p className="text-foreground/80 text-sm leading-relaxed">{report.keystoneMove}</p>
            </div>
          </div>

          {report.threats.map((t: any, i: number) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <h3 className="text-foreground font-semibold">{t.weakness} <span className="text-muted-foreground/40 font-normal text-sm">vs {t.goalArea}</span></h3>
                <span className="text-[0.65rem] uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ color: RISK_COLOR[t.risk] ?? "#E0C68C", border: `1px solid ${(RISK_COLOR[t.risk] ?? "#E0C68C")}44` }}>{t.risk} risk</span>
              </div>
              <p className="text-muted-foreground/70 text-sm leading-relaxed mb-4">{t.reasoning}</p>
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex-1">
                  <div className="flex justify-between text-muted-foreground/50 mb-1"><span>Derailment risk</span><span>{t.derailmentLikelihood}%</span></div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${t.derailmentLikelihood}%`, background: RISK_COLOR[t.risk] ?? "#E0C68C" }} /></div>
                </div>
                <div className="text-emerald-300/80 whitespace-nowrap text-sm font-semibold">+{t.upliftIfAddressed}% if addressed</div>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed"><span className="text-accent/70">Prescribed:</span> {t.move}</p>
              <p className="text-[0.7rem] text-muted-foreground/45 mt-2">Read: <Link href="/research-library"><span className="text-primary/70 hover:text-primary underline cursor-pointer">{t.libraryTopic}</span></Link></p>
            </div>
          ))}

          {report.enablers?.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-accent/70 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Strengths to aim</p>
              <div className="space-y-2.5">
                {report.enablers.map((e: any, i: number) => (
                  <p key={i} className="text-sm text-muted-foreground/75 leading-relaxed"><span className="text-foreground/90 font-medium">{e.strength}</span> → {e.how}</p>
                ))}
              </div>
            </div>
          )}

          <p className="text-[0.7rem] text-muted-foreground/40 text-center leading-relaxed px-4">{report.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TESTIMONIAL CAPTURE — at the peak moment, in-app, with consent
// ============================================================
function TestimonialCapture() {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("aqal_testimonial_done") === "1",
  );
  const [rating, setRating] = useState(0);
  const [quote, setQuote] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const submit = trpc.testimonials.submit.useMutation({
    onSuccess: () => {
      localStorage.setItem("aqal_testimonial_done", "1");
      setDismissed(true);
      toast.success("Thank you — that genuinely helps.");
    },
    onError: () => toast.error("Couldn't send that — try again in a moment."),
  });
  const close = () => { localStorage.setItem("aqal_testimonial_done", "1"); setDismissed(true); };
  if (dismissed) return null;

  return (
    <div className="max-w-xl mx-auto mb-16 glass-card rounded-2xl p-6 border border-primary/15 text-center">
      <p className="text-sm text-foreground/85 mb-4 leading-relaxed">
        Was this worth your time? A word from you helps the next person trust it.
      </p>
      <div className="flex justify-center gap-1.5 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className="p-1">
            <Star className={`w-6 h-6 transition-colors ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-muted-foreground/50"}`} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="space-y-3 text-left mt-4">
          <textarea
            value={quote} onChange={(e) => setQuote(e.target.value)} rows={2}
            placeholder="One sentence on what surprised you or what it got right… (optional)"
            className="w-full bg-background/60 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Name or initials to show (optional)"
            className="w-full bg-background/60 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            You may show this on the site. We never show it without your permission.
          </label>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => submit.mutate({ rating, quote: quote || undefined, displayName: name || undefined, consentToDisplay: consent, moment: "results" })}
              disabled={submit.isPending}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.97] transition-all"
            >
              {submit.isPending ? "Sending…" : "Send"}
            </button>
            <button onClick={close} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60">No thanks</button>
          </div>
        </div>
      )}
      {rating === 0 && (
        <button onClick={close} className="text-[0.7rem] text-muted-foreground/30 hover:text-muted-foreground/50 mt-2">Maybe later</button>
      )}
    </div>
  );
}

// ============================================================
// MAIN RESULTS PAGE
// ============================================================
export default function Results() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const assessmentQuery = trpc.assessment.current.useQuery(undefined, { enabled: !!user });

  // Derive strength/weakness clusters from scores
  const { strengths, growthEdges, allScores, compositeRarity, cohortRarity, generation } = useMemo(() => {
    if (!assessmentQuery.data?.scores?.length) {
      return { strengths: [], growthEdges: [], allScores: Array(AXIS_LABELS.length).fill(0), compositeRarity: 1, cohortRarity: null as number | null, generation: null as string | null };
    }

    const scoreData = assessmentQuery.data.scores;
    const indexed = scoreData.map((s: any) => ({
      axis: s.axisName,
      score: s.score,
      confidence: s.confidence,
      axisIndex: s.axisIndex,
    }));

    // Sort by score
    const sorted = [...indexed].sort((a, b) => b.score - a.score);
    const strengths = sorted.slice(0, 5);
    const growthEdges = sorted.slice(-5).reverse();

    // Build full line-score array (indexed by axisIndex)
    const allScores = Array(AXIS_LABELS.length).fill(0);
    indexed.forEach((s: any) => { allScores[s.axisIndex] = s.score; });

    return {
      strengths,
      growthEdges,
      allScores,
      compositeRarity: assessmentQuery.data.compositeRarity || 1,
      cohortRarity: (assessmentQuery.data as any).cohortRarity ?? null,
      generation: (assessmentQuery.data as any).generation ?? null,
    };
  }, [assessmentQuery.data]);

  // Derive cluster archetypes from axis scores
  const strengthClusters = useMemo(() => {
    if (strengths.length === 0) return [];
    const allAxisScores = assessmentQuery.data?.scores?.map((s: any) => ({ axis: s.axisName, score: s.score })) || [];
    return matchStrengthClusters(allAxisScores);
  }, [strengths, assessmentQuery.data]);

  const growthClusters = useMemo(() => {
    if (growthEdges.length === 0) return [];
    const allAxisScores = assessmentQuery.data?.scores?.map((s: any) => ({ axis: s.axisName, score: s.score })) || [];
    return matchGrowthClusters(allAxisScores);
  }, [growthEdges, assessmentQuery.data]);

  // Generate complementary match previews based on user's growth edges
  const matchPreviews = useMemo(() => {
    if (growthEdges.length === 0) return [];

    // Generate seeded match previews based on user's weakness axes
    const cities = ["New York", "London", "San Francisco", "Berlin", "Tokyo", "Sydney", "Toronto"];
    const initials = ["A", "M", "K", "J", "R"];

    return growthEdges.slice(0, 3).map((edge, i) => ({
      initial: initials[i],
      city: cities[i],
      rarity: Math.floor(compositeRarity * (0.5 + Math.random() * 1.5)),
      strengths: [edge.axis, growthEdges[(i + 1) % growthEdges.length]?.axis, growthEdges[(i + 2) % growthEdges.length]?.axis].filter(Boolean),
      complementarity: Math.floor(72 + Math.random() * 20),
    }));
  }, [growthEdges, compositeRarity]);

  // Generate inverse radar for complementary visualization
  const inverseScores = useMemo(() => {
    return allScores.map(s => Math.max(0.1, 1 - s + (Math.random() * 0.15 - 0.075)));
  }, [allScores]);

  if (authLoading) return <PageSkeleton />;

  if (!user) {
    navigate("/assessment");
    return null;
  }

  if (assessmentQuery.isLoading) return <PageSkeleton />;

  if (!assessmentQuery.data || !assessmentQuery.data.scores?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />
        <div className="relative text-center max-w-lg">
          {/* Decorative radar outline */}
          <div className="mx-auto mb-8 w-32 h-32 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
              <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="oklch(0.68 0.08 165)" strokeWidth="0.5" strokeDasharray="4 2" />
              <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="none" stroke="oklch(0.68 0.08 165)" strokeWidth="0.3" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="3" fill="oklch(0.68 0.08 165)" opacity="0.6" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl text-foreground mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
            Your map is waiting
          </h1>
          <p className="text-muted-foreground/70 mb-8 leading-relaxed">
            Complete the 10-question voice assessment to unlock your full 32-line intelligence profile, rarity score, and archetype clusters.
          </p>
          <Link href="/assessment">
            <Button className="bg-gradient-to-r from-primary to-primary/80 text-white font-medium px-8 py-3 hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150" style={{ boxShadow: '0 0 20px oklch(0.68 0.08 165 / 0.3)' }}>
              Begin Assessment
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground/40 mt-4">30–60 minutes. Voice interview. No right answers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Sticky nav header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/10">
        <div className="container py-3 flex items-center justify-between">
          <Link href="/">
            <span className="text-sm font-bold text-foreground hover:text-accent transition-colors cursor-pointer" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              AQAL
            </span>
          </Link>
          <span className="text-xs text-primary/60 tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Preliminary Results
          </span>
          <Link href="/portal">
            <span className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">
              Full Profile →
            </span>
          </Link>
        </div>
      </div>

      <div className="relative z-10">
        {/* ============================================================ */}
        {/* SECTION A: Your Preliminary Intelligence Map */}
        {/* ============================================================ */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="text-center mb-12"
            >
              <h1
                className="text-3xl sm:text-4xl md:text-5xl text-foreground mb-3"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
              >
                This is what we heard.
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                In your voice interview, you revealed patterns across 32 dimensions of intelligence. Here's what emerged.
              </p>
            </motion.div>

            {/* Full Radar Chart — the shape of you */}
            <div className="mb-16">
              <FullRadarChart scores={allScores} />
            </div>

            {/* Animated Rarity Score */}
            <div className="mb-16">
              <RarityCountUp
                rarity={cohortRarity ?? compositeRarity}
                populationRarity={cohortRarity ? compositeRarity : null}
                generation={generation}
              />
            </div>

            {/* Underwritten by — the live AI panel */}
            <UnderwrittenBy fullAccess={!!(user?.membershipTier && user.membershipTier !== "free")} />

            {/* Outcome Engineering — goal-aligned diagnosis + prescriptions */}
            <OutcomeEngineering fullAccess={!!(user?.membershipTier && user.membershipTier !== "free")} />

            {/* Testimonial capture — peak moment, in-app, consented */}
            <TestimonialCapture />

            {/* Power Combinations — Venn intersections */}
            <div className="mb-16">
              <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-lg font-semibold text-foreground mb-6 text-center flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Power Combinations
              </motion.h3>
              <PowerCombinationVenn strengths={strengths} />
            </div>

            {/* ============================================================ */}
            {/* CLUSTER ARCHETYPES — Visual strength/growth identity */}
            {/* ============================================================ */}
            {strengthClusters.length > 0 && (
              <div className="mb-16">
                <motion.h3
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-lg font-semibold text-foreground mb-6 text-center flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-primary" />
                  Your Strength Archetypes
                </motion.h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {strengthClusters.map((cluster, i) => (
                    <StrengthClusterCard key={cluster.id} cluster={cluster} index={i} />
                  ))}
                </div>
              </div>
            )}

            {growthClusters.length > 0 && (
              <div className="mb-16">
                <motion.h3
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-lg font-semibold text-foreground/80 mb-6 text-center flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-primary/70" />
                  Your Growth Edges
                </motion.h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {growthClusters.map((cluster, i) => (
                    <GrowthClusterCard key={cluster.id} cluster={cluster} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Axis-level detail breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Strengths */}
              <div>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-semibold text-muted-foreground/70 mb-4 flex items-center gap-2"
                >
                  Axis-Level Breakdown
                </motion.h3>
                <div className="space-y-3">
                  {strengths.map((s, i) => (
                    <StrengthCard key={s.axis} axis={s.axis} score={s.score} index={i} />
                  ))}
                </div>
              </div>

              {/* Growth Edges */}
              <div>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-semibold text-muted-foreground/70 mb-4 flex items-center gap-2"
                >
                  Growth Axis Detail
                </motion.h3>
                <div className="space-y-3">
                  {growthEdges.map((s, i) => (
                    <GrowthEdgeCard key={s.axis} axis={s.axis} score={s.score} index={i} />
                  ))}
                </div>
              </div>
            </div>
            {/* Developmental Stances — stage-graded, not scored */}
            <div className="mt-16">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-sm font-semibold text-muted-foreground/70 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#B08DBF" }} />
                  Developmental Stances
                </h3>
                <p className="text-xs text-muted-foreground/50 mb-4 max-w-lg">
                  These capacities are graded by your relationship to the domain, not by amount. Scored on the Spiral Dynamics ladder. They do not feed into your rarity composite.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[{ label: "Parenting", stage: "Green", color: "#4CAF50", desc: "Communitarian approach" },
                    { label: "Seduction", stage: "Orange", color: "#E87D2F", desc: "Achievement-oriented" },
                    { label: "Community-Founding", stage: "Teal", color: "#008B8B", desc: "Integral organizing" },
                    { label: "Financial-Self-Management", stage: "Orange", color: "#E87D2F", desc: "Achievement-oriented" },
                  ].map((s) => (
                    <div key={s.label} className="glass-card p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{s.label}</span>
                        <span className="font-mono text-xs font-medium" style={{ color: s.color }}>{s.stage}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/50 mt-1">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION B: Complementary Matching — THE EMOTIONAL PEAK */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-28 relative">
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="text-center mb-16"
            >
              <h2
                className="text-3xl sm:text-4xl md:text-5xl text-foreground mb-4"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
              >
                You're not just rare. You're <em className="text-accent">needed.</em>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Your strengths are exactly what someone else is searching for. And their strengths? They fill the gaps you've been navigating alone.
              </p>
            </motion.div>

            {/* Complementary Radar Visualization */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 1 }}
              className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-16 max-w-3xl mx-auto"
            >
              {/* User's radar */}
              <div className="w-40 h-40 sm:w-48 sm:h-48 relative">
                <MiniRadar scores={allScores} color="oklch(0.68 0.08 165)" />
                <p className="text-center text-xs text-primary mt-2 font-medium">You</p>
              </div>

              {/* Connection indicator */}
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Users className="w-6 h-6 text-accent/60" />
                </motion.div>
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Completes</span>
              </div>

              {/* Complementary radar (inverse) */}
              <div className="w-40 h-40 sm:w-48 sm:h-48 relative">
                <MiniRadar scores={inverseScores} color="oklch(0.78 0.12 85)" />
                <p className="text-center text-xs text-accent mt-2 font-medium">Your Match</p>
              </div>
            </motion.div>

            {/* Explanation copy */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-2xl mx-auto text-center mb-16"
            >
              <p className="text-muted-foreground leading-relaxed mb-6">
                We don't connect you with people like you. We connect you with people who <strong className="text-foreground">complete</strong> you.
                Your blind spots become their contribution. Their blind spots become yours.
                Together, you form something neither of you could build alone.
              </p>
              <p className="text-muted-foreground/70 text-sm leading-relaxed">
                This is developmental complementarity. It's how extraordinary partnerships, teams, and relationships
                are actually built — not by similarity, but by the precise interlocking of what each person brings.
              </p>
            </motion.div>

            {/* Match Previews */}
            <div className="max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold text-foreground/70 mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent/60" />
                Your Complementary Match Profile
              </h3>
              <p className="text-[0.7rem] text-muted-foreground/45 mb-4" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
                Illustrative examples of the shape of match you attract — real members appear once the network is live.
              </p>
              <div className="space-y-3 mb-6">
                {matchPreviews.map((match, i) => (
                  <MatchPreview key={i} match={match} index={i} />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/40 mb-6">
                <Lock className="w-3 h-3" />
                <span>Network minimum: 1 in 100+ | Identities revealed after mutual consent</span>
              </div>

              {/* CTA inside the matching module */}
              <div className="text-center">
                <Link href="/pricing">
                  <Button
                    onClick={() => playClick()}
                    className="px-8 py-5 bg-accent/10 border border-accent/20 text-accent font-medium hover:bg-accent/15 hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
                  >
                    Unlock Your Matches + Full Underwriting — $299
                  </Button>
                </Link>
                <p className="text-[10px] text-muted-foreground/30 mt-3">Estimated compatible profiles based on preliminary analysis</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION C: Show Your Work — Transparency */}
        {/* ============================================================ */}
        <section className="py-16 sm:py-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h2
                className="text-2xl sm:text-3xl text-foreground mb-8 text-center"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
              >
                How we arrived here
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pattern Detection */}
                <div className="glass-card p-5 rounded-xl">
                  <Brain className="w-5 h-5 text-primary mb-3" />
                  <h4 className="text-sm font-semibold text-foreground mb-2">Pattern Detection</h4>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    We analyzed linguistic complexity, abstraction level, systems language, counterfactual reasoning, and integrative framing in your responses.
                  </p>
                </div>

                {/* Developmental Mapping */}
                <div className="glass-card p-5 rounded-xl">
                  <Sparkles className="w-5 h-5 text-accent mb-3" />
                  <h4 className="text-sm font-semibold text-foreground mb-2">Developmental Mapping</h4>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    Each pattern maps to a developmental altitude using Spiral Dynamics population distributions. Higher complexity = rarer population segment.
                  </p>
                </div>

                {/* Geometric Rarity */}
                <div className="glass-card p-5 rounded-xl">
                  <Zap className="w-5 h-5 text-primary mb-3" />
                  <h4 className="text-sm font-semibold text-foreground mb-2">Composite Rarity</h4>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    We compute a Mahalanobis-style distance that accounts for correlations between axes, weighted by confidence. This estimates how far your profile sits from the population center.
                  </p>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link href="/science">
                  <span className="text-xs text-primary/70 hover:text-primary transition-colors cursor-pointer">
                    Full methodology on Science page →
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION D: Five-AI Underwriting + Retake */}
        {/* ============================================================ */}
        <section className="py-16 sm:py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.015] to-transparent" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto">
              {/* Underwriting Explainer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="glass-card p-8 rounded-2xl mb-10"
              >
                <h3
                  className="text-xl sm:text-2xl text-foreground mb-4"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                >
                  Five minds. Seventy-two hours. Zero shortcuts.
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Your preliminary score is based on a single-pass analysis. The full underwriting process runs your responses
                  through five AI systems from different developers — each analyzing different aspects of developmental psychology — and
                  cross-checks their assessments. Where they agree, confidence is higher. Where they diverge, the result is flagged for review.
                </p>

                {/* Visual pipeline */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/60 mb-4">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary">Your Voice</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary">Transcription</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="px-2 py-1 rounded bg-accent/10 text-accent">5 AI Systems</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="px-2 py-1 rounded bg-accent/10 text-accent">Cross-Validation</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary">Verified Score</span>
                </div>
                <p className="text-xs text-muted-foreground/40">
                  48-72 hours. Every word. Every pattern. No single system decides.
                </p>
              </motion.div>

              {/* Retake Offer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="glass-card p-8 rounded-2xl border border-primary/10"
              >
                <div className="flex items-start gap-4">
                  <RefreshCw className="w-5 h-5 text-primary/70 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">There's one more thing.</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      You just took an assessment without truly knowing its depth. You didn't know every word, every inflection,
                      would be analyzed by five AIs for hours. Now you know. Now you understand the stakes.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      When you become a member, you gain the opportunity to retake the full assessment with new, randomized questions.
                      This time, you'll bring everything. Your full focus. Your deepest insights. Your most precise articulations.
                    </p>
                    <p className="text-foreground/90 font-medium">
                      This isn't a second chance; it's an opportunity to truly perform at your peak, armed with the knowledge of what's possible.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION E: The Investment — $299 CTA */}
        {/* ============================================================ */}
        <section className="py-20 sm:py-28 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[300px] rounded-full bg-primary/[0.04] blur-[80px]" />
          </div>

          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2
                className="text-2xl sm:text-3xl md:text-4xl text-foreground mb-6"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
              >
                The full validation of your unique intelligence, your entry into the AQAL Rare-Minds Network, and your complementary match profile.
              </h2>

              {/* Price */}
              <div className="mb-8">
                <span
                  className="text-6xl sm:text-7xl font-bold text-glow-gold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.78 0.12 85)" }}
                >
                  $299
                </span>
                <p className="text-muted-foreground/60 text-sm mt-2">One-time investment</p>
              </div>

              {/* What's included */}
              <div className="glass-card p-6 rounded-xl text-left mb-8 max-w-md mx-auto">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Full 5-AI underwriting (48-72 hour deep analysis)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Verified rarity score with transparent methodology
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Complementary match profile + Silver network access (5 matches/month)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Assessment retake with randomized questions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Downloadable Intelligence Dossier (PDF)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    Strength cluster + growth edge detailed report
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <Link href="/pricing">
                <Button
                  size="lg"
                  onClick={() => playClick()}
                  className="text-lg px-10 py-7 bg-primary text-background font-semibold glow-gold hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
                >
                  Begin Full Underwriting — $299
                </Button>
              </Link>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground/40">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Secure payment
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> End-to-end encrypted
                </span>
              </div>

              <p className="text-muted-foreground/30 text-xs mt-6 max-w-sm mx-auto">
                This isn't just an assessment. It's an investment in the definitive understanding of yourself,
                and in the unparalleled network that awaits you.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/90 backdrop-blur-md border-t border-primary/10 lg:hidden">
        <Link href="/pricing">
          <Button
            onClick={() => playClick()}
            className="w-full py-5 bg-primary text-background font-semibold glow-gold active:scale-[0.97] transition-all duration-150"
          >
            Unlock Matches + Full Underwriting — $299
          </Button>
        </Link>
      </div>
    </div>
  );
}
