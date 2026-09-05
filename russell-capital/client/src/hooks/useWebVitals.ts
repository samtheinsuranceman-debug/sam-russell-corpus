/**
 * Hook to initialize Web Vitals collection and report metrics to backend.
 * Also resets per-page session keys on route changes for SPA tracking.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { initWebVitals, resetPageMetrics } from "@/lib/webVitals";

export function useWebVitals() {
  const reportMutation = trpc.healthDashboard.reportPerformance.useMutation();
  const mutateRef = useRef(reportMutation.mutate);
  mutateRef.current = reportMutation.mutate;

  const [location] = useLocation();

  // Initialize once
  useEffect(() => {
    initWebVitals((data) => {
      try {
        mutateRef.current(data);
      } catch {
        // Silently fail
      }
    });
  }, []);

  // Reset on route change for SPA navigation
  useEffect(() => {
    resetPageMetrics();
  }, [location]);
}
