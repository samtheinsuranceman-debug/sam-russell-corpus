import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Download, Share2, ArrowRight, Shield, Sparkles, Trophy, Swords, Crown } from "lucide-react";
import { ProfileSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { playScoreReveal } from "@/lib/audio";
import { axisMode, modeColor, MODE_META, ALL_AXES } from "@shared/axisModes";

const AXIS_LABELS = ALL_AXES;

// ============================================================
// THE REVEAL SEQUENCE — 7 seconds of building anticipation
// Phase 1 (0-1.5s): Radar grid fades in, axes appear one by one
// Phase 2 (1.5-4s): Scores animate outward, polygon forms
// Phase 3 (4-5.5s): Rarity score counts up with gold glow
// Phase 4 (5.5-7s): Power combinations slide in, CTAs appear
// ============================================================

function FullRadarChart({ scores, animate }: { scores: number[]; animate: boolean }) {
  const axes = AXIS_LABELS.length;
  const cx = 200, cy = 200, r = 160;
  const [phase, setPhase] = useState(animate ? 0 : 3);

  useEffect(() => {
    if (!animate) return;
    const timers = [
      setTimeout(() => setPhase(1), 500),    // Grid appears
      setTimeout(() => setPhase(2), 1500),   // Scores animate
      setTimeout(() => setPhase(3), 4000),   // Full reveal
    ];
    return () => timers.forEach(clearTimeout);
  }, [animate]);

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
    <div className="relative">
      {/* Radial glow behind the chart */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 2 }}
      >
        <div className="w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-[80px]" />
      </motion.div>

      <svg viewBox="0 0 400 400" className="w-full max-w-[500px] relative z-10">
        {/* Grid circles — fade in during phase 1 */}
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

        {/* Axis lines and labels — stagger in during phase 1 */}
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

        {/* The polygon — the shape of you. Stroke draws in, fill fades. */}
        <motion.polygon
          points={polygonPoints}
          fill="oklch(0.68 0.08 165)"
          fillOpacity={phase >= 2 ? 0.12 : 0}
          stroke="oklch(0.78 0.12 85)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            pathLength: phase >= 2 ? 1 : 0,
          }}
          transition={{ duration: 2.5, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
          style={{ filter: phase >= 2 ? 'drop-shadow(0 0 6px oklch(0.68 0.08 165 / 0.4))' : 'none' }}
        />

        {/* Score dots — pop in one by one with mode-colored glow */}
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

function RarityReveal({ rarity, animate }: { rarity: number; animate: boolean }) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : rarity);
  const [revealed, setRevealed] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const revealTimer = setTimeout(() => {
      setRevealed(true);
      playScoreReveal();
      const start = 100;
      const end = rarity;
      const duration = 2800;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Fast start, slow landing
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(start + (end - start) * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 4000); // Starts after radar is fully revealed
    return () => clearTimeout(revealTimer);
  }, [animate, rarity]);

  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 10 }}
      transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
    >
      <p
        className="text-xs uppercase tracking-[0.2em] mb-3"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.6 0.01 260)" }}
      >
        Your Composite Rarity
      </p>
      <p
        className="text-5xl sm:text-6xl md:text-7xl font-bold text-glow-gold"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.78 0.12 85)" }}
      >
        {revealed ? `1 in ${displayValue.toLocaleString()}` : (
          <motion.span animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
            Calculating...
          </motion.span>
        )}
      </p>
      <p className="text-muted-foreground/50 text-sm mt-3">
        Based on multi-dimensional analysis across {AXIS_LABELS.length} intelligence axes
      </p>
    </motion.div>
  );
}

function PowerComboCard({ combo, index }: { combo: { name: string; description: string | null; axes: string | null; rarityMultiplier: number | null }; index: number }) {
  const axisIndices: number[] = combo.axes ? JSON.parse(combo.axes) : [];
  const axisNames = axisIndices.map(i => AXIS_LABELS[i]).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.2, 0.8, 0.2, 1] }}
      className="glass-card p-5 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/[0.12] border border-primary/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm">{combo.name}</h4>
          {combo.description && (
            <p className="text-muted-foreground/70 text-xs mt-1 leading-relaxed">{combo.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {axisNames.map((name, i) => (
              <span key={i} className="text-[0.65rem] px-2 py-0.5 rounded-full bg-accent/[0.08] text-accent/80 border border-accent/20">
                {name}
              </span>
            ))}
          </div>
          {combo.rarityMultiplier && (
            <p className="text-primary text-xs mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {combo.rarityMultiplier.toFixed(1)}x rarity multiplier
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ScoreBar({ label, score, index, animate }: { label: string; score: number; index: number; animate: boolean }) {
  const isHigh = score >= 0.7;
  const color = modeColor(label);
  const meta = MODE_META[axisMode(label)];
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: animate ? 2 + index * 0.04 : 0 }}
    >
      <div className="w-28 shrink-0">
        <span className={`text-xs truncate block ${isHigh ? "text-foreground/90" : "text-muted-foreground/60"}`}>
          {label}
        </span>
        <span className="text-[9px] uppercase tracking-wider" style={{ color, opacity: 0.7 }}>
          {meta.label}
        </span>
      </div>
      <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
          initial={{ width: "0%" }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 1, delay: animate ? 2 + index * 0.04 : 0, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
      <span className={`text-xs w-8 text-right ${isHigh ? "text-foreground font-medium" : "text-muted-foreground/60"}`}
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color }}
      >
        {Math.round(score * 100)}
      </span>
    </motion.div>
  );
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [showAnimate] = useState(true);

  const { data: profile, isLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const demoScores = useMemo(() => [
    0.85, 0.72, 0.68, 0.91, 0.78, 0.65, 0.45, 0.52, 0.61, 0.88,
    0.73, 0.82, 0.79, 0.84, 0.76, 0.69, 0.87, 0.71, 0.63, 0.58,
    0.66, 0.93
  ], []);

  const demoCombos = useMemo(() => [
    { name: "Strategic Visionary", description: "Rare combination of strategic thinking and integrative intelligence that enables seeing patterns others miss.", axes: JSON.stringify([0, 9, 21]), rarityMultiplier: 3.2 },
    { name: "Empathic Architect", description: "Unusual blend of systematic thinking with deep empathy — builds systems that serve human needs.", axes: JSON.stringify([13, 14, 15, 16]), rarityMultiplier: 2.8 },
    { name: "Adaptive Leader", description: "Combines resilience, adaptability, and interpersonal intelligence for crisis leadership.", axes: JSON.stringify([4, 11, 12]), rarityMultiplier: 2.1 },
  ], []);

  const scores = profile?.scores?.map(s => s.score) || demoScores;
  const rarity = profile?.assessment?.compositeRarity || 47000;
  const combos = profile?.powerCombinations || demoCombos;
  const userName = profile?.user?.name || user?.name || "Your";

  if (authLoading || isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, oklch(0.15 0.02 55) 0%, oklch(0.13 0.02 55) 50%, oklch(0.12 0.02 55) 100%)`,
        }}
      />

      {/* Header */}
      <header className="relative z-20 pt-6 pb-4 px-4 border-b border-border/20">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <span
                className="text-lg font-bold text-primary text-glow-gold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                AQAL
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link href="/results" className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors">Results</Link>
              <Link href="/coaching" className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors">Coaching</Link>
              <Link href="/leaderboard" className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors">Leaderboard</Link>
            </nav>
          </div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 6 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary/80 hover:text-primary hover:border-primary/40 transition-all duration-200"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-1.5" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary/80 hover:text-primary hover:border-primary/40 transition-all duration-200"
              onClick={async () => {
                const shareText = `I'm 1 in ${rarity.toLocaleString()} — my cognitive rarity across 32 intelligence lines. Discover yours at AQAL Intelligence.`;
                const shareUrl = window.location.origin;
                if (navigator.share) {
                  try {
                    await navigator.share({ title: "My AQAL Intelligence Profile", text: shareText, url: shareUrl });
                  } catch (e) {
                    // User cancelled — no-op
                  }
                } else {
                  await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                  toast.success("Copied to clipboard!");
                }
              }}
            >
              <Share2 className="w-4 h-4 mr-1.5" /> Share
            </Button>
            <ShareCardButton />
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 container py-10 sm:py-14 space-y-14">
        {/* Name + Rarity */}
        <section className="text-center">
          <motion.p
            className="text-muted-foreground/50 text-sm mb-6 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            {userName}'s Intelligence Profile
          </motion.p>
          <RarityReveal rarity={rarity} animate={showAnimate} />
        </section>

        {/* Radar Chart */}
        <section className="flex justify-center">
          <FullRadarChart scores={scores} animate={showAnimate} />
        </section>

        {/* Score Bars */}
        <section>
          <motion.h3
            className="text-base font-semibold text-foreground/80 mb-5 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            32-Dimension Intelligence Scores
          </motion.h3>
          <div className="grid gap-1.5">
            {AXIS_LABELS.map((label, i) => (
              <ScoreBar key={i} label={label} score={scores[i] || 0} index={i} animate={showAnimate} />
            ))}
          </div>
        </section>

        {/* Power Combinations */}
        <section>
          <motion.h3
            className="flex items-center gap-2 mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.2 }}
          >
            <Trophy className="w-4 h-4 text-primary" />
            <span
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
              className="text-foreground/80"
            >
              Power Combinations
            </span>
          </motion.h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {combos.map((combo, i) => (
              <PowerComboCard key={i} combo={combo} index={i} />
            ))}
          </div>
        </section>

        {/* CTA — Evidence + Membership */}
        <motion.section
          className="text-center space-y-5 pt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 6.5, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Gradient divider */}
          <div className="w-[40%] h-px mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-8" />

          <h3
            className="text-xl text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            Elevate Your Score
          </h3>
          <p className="text-muted-foreground/70 max-w-md mx-auto text-sm leading-relaxed">
            Submit evidence — certifications, publications, patents, awards — to verify and increase your intelligence scores.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/evidence">
              <Button className="bg-primary text-white glow-gold hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150">
                <Shield className="w-4 h-4 mr-2" /> Submit Evidence
              </Button>
            </Link>
            <Link href="/membership">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/[0.06] hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150">
                Unlock Full Analysis <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Population Comparison */}
        <motion.section
          className="pt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 6.5, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="w-[40%] h-px mx-auto bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent mb-8" />
          <ProfileComparison />
        </motion.section>

        {/* Challenge a Friend */}
        <motion.section
          className="pt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 7, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="w-[40%] h-px mx-auto bg-gradient-to-r from-transparent via-red-400/30 to-transparent mb-8" />
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Swords className="w-5 h-5 text-red-400" />
              <h3 className="text-xl text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>Challenge a Friend</h3>
            </div>
            <p className="text-muted-foreground/70 max-w-md mx-auto text-sm leading-relaxed">
              Think you're rarer? Send a challenge and compare intelligence profiles.
            </p>
            <ChallengeInviteButton rarity={rarity} />
          </div>
        </motion.section>

        {/* Leaderboard Opt-in */}
        <motion.section
          className="pt-10 pb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 7.5, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="w-[40%] h-px mx-auto bg-gradient-to-r from-transparent via-amber-400/30 to-transparent mb-8" />
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>Rarity Leaderboard</h3>
            </div>
            <p className="text-muted-foreground/70 max-w-md mx-auto text-sm leading-relaxed">
              Opt-in to the public leaderboard and see how you rank among the rarest minds.
            </p>
            <LeaderboardOptIn userName={userName} />
          </div>
        </motion.section>

        {/* Terms 8C, functioning: export everything, or leave entirely */}
        <DataSovereignty />
      </main>
    </div>
  );
}

function DataSovereignty() {
  const utils = trpc.useUtils();
  const [busy, setBusy] = useState(false);
  const requestDeletion = trpc.account.requestDeletion.useMutation();
  const emailPreferences = trpc.account.emailPreferences.useQuery();
  const setMarketingEmail = trpc.account.setMarketingEmail.useMutation({
    onSuccess: () => emailPreferences.refetch(),
  });
  const doExport = async () => {
    setBusy(true);
    try {
      const data = await utils.account.exportData.fetch();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `aqal-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* toast below */ }
    setBusy(false);
  };
  const doDelete = async () => {
    const sure = confirm("Request full account deletion? Your founding spot, scores, goals, beliefs, and Black Box will be permanently removed within 30 days. Export your data first if you want to keep it.");
    if (!sure) return;
    const r = await requestDeletion.mutateAsync().catch(() => null);
    if (r?.ok) alert("Deletion requested. It will be processed within 30 days (Terms 8C). You'll keep access until then — if you change your mind, just tell us via Support.");
  };
  return (
    <section className="mt-16 mb-8 rounded-2xl border border-white/10 p-7">
      <p className="text-[0.62rem] uppercase tracking-[0.2em] text-primary/70 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Your data is yours — Terms 8C
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[52em]">
        The platform that measures your mind must be the easiest place on the internet to take it back from. One tap
        exports everything — profile, answers, scores, goals, beliefs, Black Box. One tap begins full deletion
        (processed within 30 days).
      </p>
      <div className="mb-5 rounded-xl border border-white/10 p-4 max-w-[52em]">
        <p className="text-sm text-foreground mb-1">Optional emails</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {emailPreferences.data?.marketingEnabled === false
            ? "Marketing, reminder, and re-entry emails are off. Account verification, password resets, receipts, security notices, and results you request can still arrive."
            : "Marketing, reminder, and re-entry emails are on. You can turn them off here or from the unsubscribe link in any optional email."}
        </p>
        <button
          type="button"
          disabled={emailPreferences.isLoading || setMarketingEmail.isPending}
          onClick={() => setMarketingEmail.mutate({ enabled: emailPreferences.data?.marketingEnabled === false })}
          className="px-4 py-2 rounded-lg text-[11px] uppercase tracking-[0.1em] border border-primary/40 text-primary cursor-pointer disabled:opacity-50"
          style={{ fontFamily: "'JetBrains Mono', monospace", background: "transparent" }}
        >
          {setMarketingEmail.isPending
            ? "Saving…"
            : emailPreferences.data?.marketingEnabled === false
              ? "Turn optional emails on"
              : "Turn optional emails off"}
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <button onClick={doExport} disabled={busy}
          className="px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.1em] font-semibold border border-primary/40 text-primary cursor-pointer disabled:opacity-50"
          style={{ fontFamily: "'JetBrains Mono', monospace", background: "transparent" }}>
          {busy ? "Building export…" : "Export all my data (JSON)"}
        </button>
        <button onClick={doDelete} disabled={requestDeletion.isPending}
          className="px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.1em] border border-red-400/40 text-red-400/90 cursor-pointer disabled:opacity-50"
          style={{ fontFamily: "'JetBrains Mono', monospace", background: "transparent" }}>
          Request account deletion
        </button>
      </div>
    </section>
  );
}

function ChallengeInviteButton({ rarity }: { rarity: number }) {
  const [showForm, setShowForm] = useState(false);
  const [friendName, setFriendName] = useState("");
  const challengeMutation = trpc.challenge.send.useMutation({
    onSuccess: (result) => {
      if (result.success && result.token) {
        const challengeUrl = `${window.location.origin}/challenge/${result.token}`;
        navigator.clipboard.writeText(challengeUrl);
        toast.success("Challenge link copied to clipboard! Share it with your friend.");
        setShowForm(false);
        setFriendName("");
      } else {
        toast.error(result.error || "Failed to create challenge");
      }
    },
  });

  if (!showForm) {
    return (
      <Button
        variant="outline"
        className="border-red-400/30 text-red-400 hover:bg-red-400/[0.06] hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
        onClick={() => setShowForm(true)}
      >
        <Swords className="w-4 h-4 mr-2" /> Send Challenge
      </Button>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-4 rounded-lg border border-red-400/20 bg-red-500/5 space-y-3">
      <input
        type="text"
        placeholder="Friend's name (for the invite)"
        value={friendName}
        onChange={(e) => setFriendName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && friendName.trim()) {
            challengeMutation.mutate({});
          }
        }}
        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={!friendName.trim() || challengeMutation.isPending}
          onClick={() => challengeMutation.mutate({})}
        >
          {challengeMutation.isPending ? "Creating..." : "Generate Link"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function LeaderboardOptIn({ userName }: { userName: string }) {
  const { data: myEntry, isLoading } = trpc.leaderboard.myEntry.useQuery();
  const utils = trpc.useUtils();
  const [displayName, setDisplayName] = useState(userName);

  const joinMutation = trpc.leaderboard.join.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("You're on the leaderboard!");
        utils.leaderboard.myEntry.invalidate();
        utils.leaderboard.list.invalidate();
      } else {
        toast.error(result.error || "Failed to join");
      }
    },
  });

  const toggleMutation = trpc.leaderboard.toggleVisibility.useMutation({
    onSuccess: () => {
      toast.success("Visibility updated");
      utils.leaderboard.myEntry.invalidate();
      utils.leaderboard.list.invalidate();
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-10 w-40 mx-auto bg-muted rounded-md" />;
  }

  if (myEntry) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">
          You're on the leaderboard as <span className="text-amber-400 font-medium">{myEntry.displayName}</span>
          {myEntry.isPublic ? " (visible)" : " (hidden)"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-400/30 text-amber-400"
            onClick={() => toggleMutation.mutate({ isPublic: !myEntry.isPublic })}
            disabled={toggleMutation.isPending}
          >
            {myEntry.isPublic ? "Hide My Entry" : "Show My Entry"}
          </Button>
          <Link href="/leaderboard">
            <Button variant="outline" size="sm" className="border-border">
              <Trophy className="w-3 h-3 mr-1.5" /> View Board
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2 max-w-xs w-full">
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm"
        />
        <Button
          size="sm"
          className="bg-amber-500 text-black hover:bg-amber-400"
          disabled={!displayName.trim() || joinMutation.isPending}
          onClick={() => joinMutation.mutate({ displayName: displayName.trim() })}
        >
          {joinMutation.isPending ? "..." : "Join"}
        </Button>
      </div>
      <Link href="/leaderboard">
        <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
          View Leaderboard →
        </Button>
      </Link>
    </div>
  );
}

function ShareCardButton() {
  const { data, isLoading } = trpc.profile.socialCard.useQuery(undefined, {
    enabled: false, // Only fetch on demand
  });
  const [generating, setGenerating] = useState(false);
  const utils = trpc.useUtils();

  const handleGenerateCard = async () => {
    setGenerating(true);
    try {
      const result = await utils.profile.socialCard.fetch();
      if (result?.svg) {
        // Create a downloadable SVG file
        const blob = new Blob([result.svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "aqal-rarity-card.svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Social card downloaded! Share it on social media.");
      } else {
        toast.error("Could not generate card. Complete an assessment first.");
      }
    } catch {
      toast.error("Failed to generate social card");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-purple-400/20 text-purple-400/80 hover:text-purple-400 hover:border-purple-400/40 transition-all duration-200"
      onClick={handleGenerateCard}
      disabled={generating}
    >
      <Sparkles className="w-4 h-4 mr-1.5" />
      {generating ? "Generating..." : "Share Card"}
    </Button>
  );
}

function ProfileComparison() {
  const { data: comparison, isLoading } = trpc.profile.comparison.useQuery();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground/50 text-sm mt-3">Loading comparison data...</p>
      </div>
    );
  }

  if (!comparison || !comparison.axes || comparison.axes.length === 0) {
    return (
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-400" />
          <h3 className="text-xl text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>Population Comparison</h3>
        </div>
        <p className="text-muted-foreground/70 max-w-md mx-auto text-sm leading-relaxed">
          Comparison data will be available once more assessments are completed across the platform.
        </p>
      </div>
    );
  }

  // Sort by percentile descending to show strongest axes first
  const sorted = [...comparison.axes].sort((a, b) => b.percentile - a.percentile);
  const topAxes = sorted.slice(0, 6);

  return (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center gap-2">
        <Trophy className="w-5 h-5 text-emerald-400" />
        <h3 className="text-xl text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>How You Compare</h3>
      </div>
      <p className="text-muted-foreground/70 max-w-md mx-auto text-sm leading-relaxed">
        Your scores compared to {comparison.totalPopulation} assessed profiles (anonymous aggregate).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {topAxes.map((axis) => (
          <div
            key={axis.axisIndex}
            className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground/90">{axis.axisName}</span>
              <span className={`text-xs font-mono ${
                axis.percentile >= 90 ? "text-emerald-400" :
                axis.percentile >= 70 ? "text-primary" :
                axis.percentile >= 50 ? "text-amber-400" :
                "text-muted-foreground/60"
              }`}>
                Top {100 - axis.percentile}%
              </span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  axis.percentile >= 90 ? "bg-emerald-400" :
                  axis.percentile >= 70 ? "bg-primary" :
                  axis.percentile >= 50 ? "bg-amber-400" :
                  "bg-muted-foreground/30"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${axis.percentile}%` }}
                transition={{ duration: 1, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/50">
              <span>You: {(axis.userScore * 100).toFixed(0)}%</span>
              <span>Avg: {(axis.populationAvg * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>

      {comparison.totalPopulation > 0 && (
        <p className="text-[11px] text-muted-foreground/40 italic">
          Based on {comparison.totalPopulation} anonymized profiles. Percentiles update as more people are assessed.
        </p>
      )}
    </div>
  );
}
