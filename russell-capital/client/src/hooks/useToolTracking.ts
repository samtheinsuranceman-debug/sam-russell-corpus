/**
 * useToolTracking — Automatically records tool page visits for analytics.
 * Drop this into any portal page to track usage.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Automatically records a tool visit when the component mounts.
 * Call once per page component. Debounces to avoid duplicate records.
 */
export function useTrackToolVisit(toolLabel: string) {
  const [location] = useLocation();
  const recordMut = trpc.toolAnalytics.record.useMutation();
  const tracked = useRef<string>("");

  useEffect(() => {
    if (!toolLabel || tracked.current === location) return;
    tracked.current = location;
    recordMut.mutate({ toolPath: location, toolLabel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, toolLabel]);
}
