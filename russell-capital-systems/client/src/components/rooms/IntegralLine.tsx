/**
 * The green energy line, one stroke, the integral made visible.
 *
 * On the cover it is neon; inside the product it takes the room's wavelength
 * (`--room-line`, or the needle on a calculator). It draws once when it
 * mounts, 1.1s ease-out, then breathes at 4% opacity. Redraw by changing
 * `runKey` after Calculate. Reduced-motion users get the finished frame.
 */
import { useEffect, useRef } from "react";

export function IntegralLine({
  runKey = 0,
  color,
  height = 56,
  className = "",
  label,
}: {
  runKey?: number | string;
  /** Overrides the room line; hex or CSS var. */
  color?: string;
  height?: number;
  className?: string;
  label?: string;
}) {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    const path = ref.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    // force a reflow so the transition replays on every runKey
    void path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)";
    path.style.strokeDashoffset = "0";
  }, [runKey]);
  const stroke = color ?? "var(--room-line, #3EE0A2)";
  return (
    <svg
      className={`rc-integral ${className}`}
      viewBox="0 0 600 100"
      preserveAspectRatio="none"
      style={{ width: "100%", height }}
      aria-label={label}
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id="rc-integral-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity=".22" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        className="rc-integral-fill"
        d="M0,92 C120,90 200,84 300,64 C400,44 480,26 600,8 L600,100 L0,100 Z"
        fill="url(#rc-integral-fill)"
      />
      <path
        ref={ref}
        className="rc-integral-stroke"
        d="M0,92 C120,90 200,84 300,64 C400,44 480,26 600,8"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
