/**
 * Web Vitals Performance Collector
 *
 * Automatically collects Core Web Vitals (LCP, FCP, CLS, TTFB, INP)
 * and reports them to the backend via tRPC for admin dashboard monitoring.
 *
 * Metrics collected:
 * - LCP  (Largest Contentful Paint) — loading performance
 * - FCP  (First Contentful Paint) — perceived load speed
 * - CLS  (Cumulative Layout Shift) — visual stability
 * - TTFB (Time to First Byte) — server responsiveness
 * - INP  (Interaction to Next Paint) — interactivity responsiveness
 */

import { onLCP, onFCP, onCLS, onTTFB, onINP, type Metric } from "web-vitals";

type ReportFn = (data: {
  pagePath: string;
  pageLabel?: string;
  metricName: string;
  metricValue: number;
  rating?: string;
  userAgent?: string;
  connectionType?: string;
  deviceMemory?: number;
}) => void;

let reportFn: ReportFn | null = null;
let initialized = false;

/** Get connection info from Navigator API */
function getConnectionType(): string | undefined {
  const nav = navigator as any;
  return nav?.connection?.effectiveType ?? nav?.connection?.type ?? undefined;
}

function getDeviceMemory(): number | undefined {
  const nav = navigator as any;
  return nav?.deviceMemory ?? undefined;
}

/** Get a human-readable label from the current path */
function getPageLabel(): string {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "home";
  return last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Handle a single metric event */
function handleMetric(metric: Metric) {
  if (!reportFn) return;

  // Throttle: only report once per metric per page load
  const key = `perf_${metric.name}_${window.location.pathname}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");

  try {
    reportFn({
      pagePath: window.location.pathname,
      pageLabel: getPageLabel(),
      metricName: metric.name,
      metricValue: Math.round(metric.value * 100) / 100,
      rating: metric.rating,
      userAgent: navigator.userAgent,
      connectionType: getConnectionType(),
      deviceMemory: getDeviceMemory(),
    });
  } catch {
    // Silently fail — never break the app for analytics
  }
}

/**
 * Initialize Web Vitals collection.
 * Call once from the app root after tRPC is ready.
 *
 * @param report - Function to send metric data to backend
 */
export function initWebVitals(report: ReportFn) {
  if (initialized) return;
  initialized = true;
  reportFn = report;

  // Register all Core Web Vitals observers
  onLCP(handleMetric);
  onFCP(handleMetric);
  onCLS(handleMetric);
  onTTFB(handleMetric);
  onINP(handleMetric);
}

/**
 * Re-initialize metrics for SPA navigation.
 * Call on route change to clear session keys so new page loads get tracked.
 */
export function resetPageMetrics() {
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith("perf_")) keys.push(key);
  }
  keys.forEach((k) => sessionStorage.removeItem(k));
}
