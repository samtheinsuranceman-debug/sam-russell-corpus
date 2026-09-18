/**
 * React binding for the Sound of Capital ambience engine.
 *
 * The engine is a module-level singleton, so this hook is a thin
 * useSyncExternalStore subscription — every toggle anywhere on the site stays
 * in sync with every other one.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { capitalAmbience, type AmbienceState } from "@/lib/capitalAmbience";

const SERVER_SNAPSHOT: AmbienceState = { enabled: false, volume: 0.55, running: false };

export function useCapitalAmbience() {
  const state = useSyncExternalStore(
    capitalAmbience?.subscribe ?? (() => () => {}),
    capitalAmbience?.getSnapshot ?? (() => SERVER_SNAPSHOT),
    () => SERVER_SNAPSHOT,
  );

  const toggle = useCallback(() => capitalAmbience?.toggle(), []);
  const setVolume = useCallback((v: number) => capitalAmbience?.setVolume(v), []);
  const ping = useCallback(() => capitalAmbience?.ping(), []);

  return { ...state, toggle, setVolume, ping };
}

/**
 * Mount ONCE, high in the tree.
 *
 * Browsers refuse to start audio without a user gesture, so a visitor who
 * previously switched the ambience on would otherwise land on a silent page.
 * This watches for the first real interaction of the session and resumes the
 * machine — but only when the stored preference is already "on". It never
 * starts audio for someone who hasn't opted in.
 */
export function useAmbienceResumeOnGesture() {
  useEffect(() => {
    if (!capitalAmbience?.wantsSound) return;

    const resume = () => {
      void capitalAmbience.enable();
      detach();
    };
    const detach = () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("touchstart", resume);
    };

    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    window.addEventListener("touchstart", resume, { once: true });
    return detach;
  }, []);
}
