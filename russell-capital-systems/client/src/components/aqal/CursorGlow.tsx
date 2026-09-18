import { useEffect, useRef } from "react";

/**
 * Cursor glow effect — subtle radial gradient that follows mouse.
 * Premium Feel 10/10: Adds depth and interactivity to landing page.
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.setProperty("--glow-x", `${e.clientX}px`);
        glowRef.current.style.setProperty("--glow-y", `${e.clientY}px`);
        glowRef.current.style.opacity = "1";
      }
    };

    const handleMouseLeave = () => {
      if (glowRef.current) {
        glowRef.current.style.opacity = "0";
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-[1] opacity-0 transition-opacity duration-500"
      style={{
        background: `radial-gradient(600px circle at var(--glow-x, 50%) var(--glow-y, 50%), oklch(0.7 0.2 240 / 0.04), transparent 60%)`,
      }}
    />
  );
}
