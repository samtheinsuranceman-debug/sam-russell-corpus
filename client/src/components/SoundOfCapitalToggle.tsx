import { Volume2, VolumeX } from "lucide-react";
import { useCapitalAmbience } from "@/hooks/useCapitalAmbience";

/**
 * The Sound of Capital control.
 *
 * Audio can never auto-start (browsers block it and it would be hostile
 * anyway), so the invitation has to be visible and inviting. When off, the
 * control gently pulses. When on, live equalizer bars show the machine
 * running.
 */
export function SoundOfCapitalToggle({
  variant = "hero",
  className = "",
}: {
  variant?: "hero" | "floating";
  className?: string;
}) {
  const { enabled, running, toggle } = useCapitalAmbience();
  const live = enabled && running;

  const base =
    "group inline-flex items-center gap-2.5 rounded-full border transition-all duration-300 backdrop-blur-md";
  const skin = live
    ? "border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-[0_0_24px_-6px_rgba(251,191,36,0.55)]"
    : "border-white/20 bg-black/30 text-white/70 hover:border-amber-400/40 hover:text-amber-300";
  const size = variant === "hero" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  // Bottom-LEFT: the right rail already carries the AI brain widget and the
  // quick-actions FAB.
  const position =
    variant === "floating" ? "fixed bottom-5 left-5 z-40 shadow-xl" : "";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={live}
      aria-label={live ? "Mute the Sound of Capital" : "Turn on the Sound of Capital"}
      title={
        live
          ? "Sound of Capital — on (C major)"
          : "Sound of Capital — engineered C-major ambience"
      }
      className={`${base} ${skin} ${size} ${position} ${className} ${
        !enabled ? "rcs-sound-invite" : ""
      }`}
    >
      {live ? (
        <span className="flex items-end gap-[2px] h-3.5" aria-hidden="true">
          <i className="rcs-eq-bar" style={{ animationDelay: "0ms" }} />
          <i className="rcs-eq-bar" style={{ animationDelay: "180ms" }} />
          <i className="rcs-eq-bar" style={{ animationDelay: "90ms" }} />
          <i className="rcs-eq-bar" style={{ animationDelay: "260ms" }} />
        </span>
      ) : enabled ? (
        <Volume2 size={variant === "hero" ? 15 : 13} aria-hidden="true" />
      ) : (
        <VolumeX size={variant === "hero" ? 15 : 13} aria-hidden="true" />
      )}
      <span className="font-medium tracking-wide whitespace-nowrap">
        {live ? "Sound of Capital" : "Turn on the sound"}
      </span>
    </button>
  );
}

export default SoundOfCapitalToggle;
