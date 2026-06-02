import { useEffect, useRef, useState } from "react";

/**
 * ResultReveal — drop-in animated result for any calculator.
 *
 * - Counts the number up from 0 to `value` on mount / when value changes.
 * - Plays a short "cha-ching" via the Web Audio API (no audio file needed,
 *   so it never breaks on a missing asset; respects a muted prop).
 * - Emits a gold pulse on reveal.
 *
 * Usage:
 *   <ResultReveal value={calc.iulAdvantage} prefix="$" label="IUL advantage" />
 */

function playChaChing(muted: boolean) {
  if (muted) return;
  try {
    const AC =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    // two quick ascending notes = "cha-ching"
    const notes = [
      { f: 880, t: 0 },
      { f: 1318.5, t: 0.09 },
    ];
    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.4);
    });
    // close context shortly after to free resources
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    /* audio unavailable — silently ignore */
  }
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function ResultReveal({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  label,
  durationMs = 900,
  muted = false,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label?: string;
  durationMs?: number;
  muted?: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const [pulse, setPulse] = useState(false);
  const raf = useRef<number | null>(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!isFinite(value)) {
      setDisplay(value);
      return;
    }
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = 0;
    const animate = (nowT: number) => {
      const p = Math.min(1, (nowT - start) / durationMs);
      setDisplay(from + (value - from) * easeOutCubic(p));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    setPulse(true);
    playChaChing(muted);
    const pulseTimer = setTimeout(() => setPulse(false), 700);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      clearTimeout(pulseTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, muted]);

  const formatted =
    prefix +
    display.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  return (
    <div className={"rc-result-reveal " + className} style={{ display: "inline-block" }}>
      {label && (
        <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: 2 }}>{label}</div>
      )}
      <div
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "#f5c518",
          transform: pulse ? "scale(1.06)" : "scale(1)",
          textShadow: pulse ? "0 0 18px rgba(245,197,24,0.55)" : "none",
          transition: "transform 0.25s ease, text-shadow 0.4s ease",
        }}
      >
        {formatted}
      </div>
    </div>
  );
}

export default ResultReveal;
