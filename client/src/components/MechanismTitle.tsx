// ============================================================
// MECHANISM TITLE — the three-dimensional strategy nameplate.
//
// Each of the five mechanisms gets a title treatment carrying its own colour,
// extruded with stacked text-shadows so the letterform has depth without an
// image. It is built from real text rather than a graphic for three reasons
// that all matter: it is selectable and searchable, it scales to phone width
// without a second asset, and a screen reader announces the strategy name
// rather than skipping a decorative image.
//
// The extrusion is a run of offset shadows, darkening with depth, plus a
// coloured glow behind the whole thing. The `depth` prop controls how many
// layers, so a page header can be heavy and a card heading light.
//
// prefers-reduced-motion removes the float animation; the depth itself stays,
// because it is structure rather than motion.
// ============================================================
import { useMemo } from "react";

export interface MechanismTitleProps {
  children: string;
  /** Colour set from the mechanism's dossier. */
  accent: { base: string; deep: string; glow: string };
  /** Layers of extrusion. 6 for a page header, 3 for a card. */
  depth?: number;
  /** Tailwind size classes for the text itself. */
  className?: string;
  /** An eyebrow rendered above, in the glow colour. */
  eyebrow?: string;
  as?: "h1" | "h2" | "h3";
}

function extrude(depth: number, base: string, deep: string, glow: string): string {
  const layers: string[] = [];
  for (let i = 1; i <= depth; i++) {
    // Each layer steps down-right and darkens, so the face reads as lit from
    // upper-left and the body of the letter recedes.
    const t = i / depth;
    layers.push(`${i * 0.055}em ${i * 0.055}em 0 ${mix(base, deep, t)}`);
  }
  layers.push(`0 0 1.4em ${glow}55`);
  layers.push(`0 ${depth * 0.07}em ${depth * 0.09}em rgba(0,0,0,0.55)`);
  return layers.join(", ");
}

/** Linear blend between two hex colours. Kept local — no library for four lines. */
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function MechanismTitle({
  children, accent, depth = 6, className = "text-4xl sm:text-5xl", eyebrow, as = "h1",
}: MechanismTitleProps) {
  const shadow = useMemo(
    () => extrude(depth, accent.base, accent.deep, accent.glow),
    [depth, accent.base, accent.deep, accent.glow],
  );
  const Tag = as;
  return (
    <div className="mech-title-wrap">
      {eyebrow ? (
        <div
          className="text-[11px] uppercase tracking-[0.3em] mb-2 font-semibold"
          style={{ color: accent.glow }}
        >
          {eyebrow}
        </div>
      ) : null}
      <Tag
        className={`mech-title font-black leading-[1.05] tracking-tight ${className}`}
        style={{
          color: accent.glow,
          textShadow: shadow,
          // A subtle gradient across the face so the lit edge reads as lit.
          backgroundImage: `linear-gradient(160deg, #ffffff 0%, ${accent.glow} 45%, ${accent.base} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textWrap: "balance",
        }}
      >
        {children}
      </Tag>
      <style>{`
        .mech-title-wrap { perspective: 800px; }
        .mech-title {
          transform: rotateX(8deg);
          transform-origin: 50% 100%;
          animation: mechFloat 7s ease-in-out infinite;
        }
        @keyframes mechFloat {
          0%, 100% { transform: rotateX(8deg) translateY(0); }
          50%      { transform: rotateX(6deg) translateY(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mech-title { animation: none; transform: rotateX(6deg); }
        }
      `}</style>
    </div>
  );
}

/** A small rating chip — value and frequency are shown side by side, never merged. */
export function RatingChip({ label, score, accent }: { label: string; score: number; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="flex gap-[2px]" aria-label={`${label}: ${score} out of 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="h-3 w-[5px] rounded-[1px]"
            style={{ background: i < score ? accent : "rgba(255,255,255,0.10)" }}
          />
        ))}
      </span>
      <span className="text-xs font-semibold tabular-nums text-white">{score}/10</span>
    </div>
  );
}
