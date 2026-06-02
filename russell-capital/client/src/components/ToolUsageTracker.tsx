/**
 * ToolUsageTracker — Automatically records tool page visits.
 * Placed inside AppShell to track every portal page navigation.
 * Uses the sidebar NAV_SECTIONS to resolve path → label.
 */
import { useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Build a static lookup from the nav items rendered in the sidebar
// We import the NAV_SECTIONS from AppShell indirectly by reading the path
const PATH_LABEL_CACHE = new Map<string, string>();

export function ToolUsageTracker() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const recordMut = trpc.toolAnalytics.record.useMutation();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!location.startsWith("/portal/")) return;
    if (location === lastTracked.current) return;
    lastTracked.current = location;

    // Derive a label from the path
    const label = PATH_LABEL_CACHE.get(location) || deriveLabel(location);
    PATH_LABEL_CACHE.set(location, label);

    recordMut.mutate({ toolPath: location, toolLabel: label });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, isAuthenticated]);

  return null;
}

function deriveLabel(path: string): string {
  // Convert "/portal/compound-interest-calc" → "Compound Interest Calc"
  const slug = path.replace("/portal/", "").replace(/\//g, " ");
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
