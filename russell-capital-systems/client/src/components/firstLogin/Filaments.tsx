// ============================================================
// Peripheral filaments for the first-login field: thin sage strokes near
// the edges that drift steadily OUTWARD (forward expand only) at the spec's
// 28 px/s — slower than the objects crossing the centre. They never reverse
// and never pulse in size. Off under prefers-reduced-motion and after Halt.
// The positions are decoration; nothing here is data.
// ============================================================
import { useEffect, useRef } from "react";
import { HOUSE_COLORS, VECTION } from "@shared/firstLoginColdStart";

type Strand = { angle: number; r: number; len: number };

const STRANDS = 36;
/** Filaments live in the outer ring only: the centre belongs to the objects. */
const INNER_RING = 0.38;

export default function Filaments({ running }: { running: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !running) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const maxR = () => Math.hypot(w, h) / 2;
    const spawn = (anywhere: boolean): Strand => {
      const inner = Math.min(w, h) * INNER_RING;
      return {
        angle: Math.random() * Math.PI * 2, // decorative: filament placement
        r: anywhere ? inner + Math.random() * (maxR() - inner) : inner, // decorative: filament placement
        len: 18 + Math.random() * 30, // decorative: filament length
      };
    };
    const strands: Strand[] = Array.from({ length: STRANDS }, () => spawn(true));
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = HOUSE_COLORS.filament;
      ctx.lineWidth = 1;
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < strands.length; i++) {
        const s = strands[i]!;
        // Outward only, at a constant peripheral speed.
        s.r += VECTION.peripheralFilamentSpeedPxS * dt;
        if (s.r > maxR()) strands[i] = spawn(false);
        const a = Math.min(0.45, (s.r / maxR()) * 0.5);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.angle) * s.r, cy + Math.sin(s.angle) * s.r);
        ctx.lineTo(cx + Math.cos(s.angle) * (s.r + s.len), cy + Math.sin(s.angle) * (s.r + s.len));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [running]);

  if (!running) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
