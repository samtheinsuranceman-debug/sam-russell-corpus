/**
 * Global hooks that need to be mounted inside the provider tree.
 * Renders nothing — just activates the hooks.
 */
import { useSoundOfMoney } from "@/hooks/useSoundOfMoney";
import { useQuestTracker } from "@/hooks/useQuestTracker";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { useAmbienceResumeOnGesture } from "@/hooks/useCapitalAmbience";

export function GlobalHooks() {
  useSoundOfMoney();
  useQuestTracker();
  useKeyboardShortcuts();
  useRealtimeEvents();
  // Sound of Capital: browsers suspend AudioContext until a user gesture;
  // this resumes it on the first one if the listener opted in earlier.
  useAmbienceResumeOnGesture();
  return null;
}
