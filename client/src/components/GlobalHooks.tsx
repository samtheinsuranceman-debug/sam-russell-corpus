/**
 * Global hooks that need to be mounted inside the provider tree.
 * Renders nothing — just activates the hooks.
 */
import { useSoundOfMoney } from "@/hooks/useSoundOfMoney";
import { useQuestTracker } from "@/hooks/useQuestTracker";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export function GlobalHooks() {
  useSoundOfMoney();
  useQuestTracker();
  useKeyboardShortcuts();
  useRealtimeEvents();
  return null;
}
