// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// GenomeKit — shared cinematic primitives for The Wealth Genome (Sacred Seven)
// Front-end design system: somatic orbs, glow cards, section labels, backdrops.
// Used by The Arrival, The Mirror, The Strategy Table, The Field, The Map,
// The Legacy, and The Brotherhood.
// ───────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const GENOME = {
  accent: "#8b7bf0",
  accentSoft: "#a78bfa",
  cyan: "#38bdf8",
  glow: "rgba(139,123,240,0.35)",
  gradient: "linear-gradient(135deg, rgba(139,123,240,0.18), rgba(56,189,248,0.10))",
};

export const SACRED_SEVEN = [
  { key: "the-arrival",        title: "The Arrival",        tagline: "Onboarding & calibration entry" },
  { key: "the-mirror",         title: "The Mirror",         tagline: "Your personal dashboard" },
  { key: "the-strategy-table", title: "The Strategy Table", tagline: "IUL & wealth comparator" },
  { key: "the-field",          title: "The Field",          tagline: "Doctor Buddy, your AI core" },
  { key: "the-map",            title: "The Map",            tagline: "Portfolio & allocation" },
  { key: "the-legacy",         title: "The Legacy",         tagline: "Will & estate drafting" },
  { key: "the-brotherhood",    title: "The Brotherhood",    tagline: "Community & gamification" },
];

export function SectionLabel({ children, icon: Icon, className }) {
  return (
    <div className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80", className)}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </div>
  );
}

export function GlowCard({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_-20px_rgba(0,0,0,0.7)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GenomeOrb({ size = 132, label, pulsing = true, onClick, active = false }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      animate={pulsing ? {
        boxShadow: [
          `0 0 0 0 ${GENOME.glow}`,
          `0 0 70px 14px ${GENOME.glow}`,
          `0 0 0 0 ${GENOME.glow}`,
        ],
      } : {}}
      transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      className="relative grid place-items-center rounded-full outline-none"
      style={{
        width: size,
        height: size,
        background: active
          ? "radial-gradient(circle at 35% 30%, rgba(186,162,255,1), rgba(91,33,182,0.5) 60%, rgba(2,6,23,0.2))"
          : "radial-gradient(circle at 35% 30%, rgba(167,139,250,0.9), rgba(76,29,149,0.35) 60%, rgba(2,6,23,0.2))",
      }}
    >
      <span className="absolute inset-0 rounded-full border border-violet-300/30" />
      <span className="absolute inset-2 rounded-full border border-white/5" />
      <span className="px-3 text-center text-xs font-medium tracking-wide text-white/90">{label}</span>
    </motion.button>
  );
}

export function GenomeBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 h-[460px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse at center, rgba(139,123,240,0.18), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-24 right-0 h-[380px] w-[560px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse at center, rgba(56,189,248,0.10), transparent 70%)" }}
      />
    </div>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-violet-300/70">{hint}</p> : null}
    </div>
  );
}

export function fmt$(n) {
  if (!isFinite(n)) return "$0";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
