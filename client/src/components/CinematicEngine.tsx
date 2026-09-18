import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CINEMATIC ENGINE — living stills
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Turns a static render into a moving scene without shipping video:
 *
 *   · Ken Burns    — a slow 30s push/drift so the machinery never sits still
 *   · Parallax     — pointer-driven depth (desktop only, rAF-throttled)
 *   · Gold sweep   — a raking light bar that travels the plate periodically
 *   · Energy grid  — drifting conveyor lines over the lower third
 *   · Breath glow  — an edge bloom locked to the platform's --breath-duration
 *   · Blur-up      — LQIP paints instantly, full plate fades in over it
 *
 * All motion is CSS/GPU (transform + opacity only) so it stays at 60fps and
 * collapses to a clean still under prefers-reduced-motion.
 */

export type CinematicSlug =
  | "rcs-engine-mint"
  | "rcs-engine-compounding"
  | "rcs-engine-shield"
  | "rcs-engine-velocity"
  | "rcs-command-center";

interface CinematicEngineProps {
  slug: CinematicSlug;
  alt: string;
  /** Hero plates should be eager + high priority; sections lazy. */
  priority?: boolean;
  /** Vertical scrim strength for text legibility. */
  overlay?: "none" | "soft" | "strong" | "hero";
  /** Ken Burns direction, so adjacent bands don't drift identically. */
  drift?: "in" | "out" | "left" | "right";
  /** Adds the drifting conveyor/energy lines. */
  energyLines?: boolean;
  className?: string;
  /** Content rendered above the plate. */
  children?: ReactNode;
}

/** Scrims run dark where the copy sits and light where the art should breathe:
 *  bottom-weighted for section plates, top+bottom for the hero (which has to
 *  clear a nav bar above and hand off to the page below). */
const OVERLAYS: Record<NonNullable<CinematicEngineProps["overlay"]>, string> = {
  none: "",
  soft: "bg-gradient-to-t from-[#060f20]/85 via-[#060f20]/25 to-[#060f20]/50",
  strong: "bg-gradient-to-t from-[#060f20] via-[#060f20]/60 to-[#060f20]/20",
  hero: "bg-gradient-to-b from-[#060f20]/85 via-[#060f20]/60 to-[#060f20]",
};

export function CinematicEngine({
  slug,
  alt,
  priority = false,
  overlay = "soft",
  drift = "in",
  energyLines = false,
  className = "",
  children,
}: CinematicEngineProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ── Pointer parallax (desktop, reduced-motion aware) ──────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    const layer = parallaxRef.current;
    if (!wrap || !layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // skip touch devices

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      // −1 … 1 across the plate
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(tick);
    };

    const tick = () => {
      // Ease toward the pointer so it glides instead of snapping.
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      layer.style.transform = `translate3d(${(-currentX * 14).toFixed(2)}px, ${(
        -currentY * 10
      ).toFixed(2)}px, 0)`;

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(tick);
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden isolate ${className}`}
      data-cinematic={slug}
    >
      {/* Blur-up placeholder — paints before the full plate arrives */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 scale-110 blur-2xl"
        style={{
          backgroundImage: `url(/brand/${slug}-lqip.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Parallax layer → holds the Ken Burns plate */}
      <div ref={parallaxRef} className="absolute inset-0 -z-10 will-change-transform">
        <picture>
          <source media="(max-width: 768px)" srcSet={`/brand/${slug}-960.webp`} type="image/webp" />
          <img
            src={`/brand/${slug}.webp`}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover rcs-kenburns rcs-kenburns-${drift} transition-opacity duration-700 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </picture>
      </div>

      {/* Brand scrim for legibility */}
      {overlay !== "none" && (
        <div aria-hidden="true" className={`absolute inset-0 -z-10 ${OVERLAYS[overlay]}`} />
      )}

      {/* Raking gold light sweep */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="rcs-sweep" />
      </div>

      {/* Drifting conveyor / energy lines */}
      {energyLines && <div aria-hidden="true" className="rcs-energy-lines -z-10" />}

      {/* Breath-locked edge bloom */}
      <div aria-hidden="true" className="rcs-breath-bloom -z-10" />

      {children}
    </div>
  );
}

export default CinematicEngine;
