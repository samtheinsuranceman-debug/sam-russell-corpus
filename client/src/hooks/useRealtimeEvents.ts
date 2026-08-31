/**
 * useRealtimeEvents — SSE hook for real-time server events.
 * Connects to /api/events and dispatches custom DOM events for:
 * - deal_update, notification, quest_complete, achievement_unlock,
 *   pet_evolution, xp_earned, streak_update
 * Components can listen via useRealtimeEvent("deal_update", handler).
 */
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

type EventHandler = (data: any) => void;

const listeners = new Map<string, Set<EventHandler>>();

export function useRealtimeEvents() {
  const { isAuthenticated } = useAuth();
  const esRef = useRef<EventSource | null>(null);
  const retryCount = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    function connect() {
      if (esRef.current) esRef.current.close();

      const es = new EventSource("/api/events", { withCredentials: true });
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          if (type && listeners.has(type)) {
            for (const handler of Array.from(listeners.get(type)!)) {
              try { handler(data); } catch {}
            }
          }
          // Also dispatch to "all" listeners
          if (listeners.has("*")) {
            for (const handler of Array.from(listeners.get("*")!)) {
              try { handler(data); } catch {}
            }
          }
          retryCount.current = 0;
        } catch {}
      };

      es.onerror = () => {
        es.close();
        retryCount.current++;
        // Exponential backoff: 2s, 4s, 8s, 16s, max 60s
        const delay = Math.min(2000 * Math.pow(2, retryCount.current), 60000);
        setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [isAuthenticated]);
}

/**
 * Subscribe to a specific event type from the SSE stream.
 * Use "*" to listen to all events.
 */
export function useRealtimeEvent(eventType: string, handler: EventHandler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((data: any) => {
    handlerRef.current(data);
  }, []);

  useEffect(() => {
    if (!listeners.has(eventType)) listeners.set(eventType, new Set());
    listeners.get(eventType)!.add(stableHandler);

    return () => {
      listeners.get(eventType)?.delete(stableHandler);
      if (listeners.get(eventType)?.size === 0) listeners.delete(eventType);
    };
  }, [eventType, stableHandler]);
}
