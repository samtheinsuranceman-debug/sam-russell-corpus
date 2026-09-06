// ============================================================
// WEB VITALS REPORTER — measures what this visitor actually experienced
// (LCP, CLS, INP, FCP, TTFB) with the browser's own PerformanceObserver and
// posts it once, when the page is hidden, with sendBeacon. No library, no
// identifier, no cookie: route, metric, value and device class only.
// ============================================================
import { useEffect } from "react";

type Sample = { route: string; metric: "LCP" | "CLS" | "INP" | "FCP" | "TTFB"; value: number; device: "mobile" | "desktop"; navType?: string };

export function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;
    const route = () => window.location.pathname.split("?")[0] || "/";
    const device: Sample["device"] = window.matchMedia?.("(max-width: 767px)").matches ? "mobile" : "desktop";
    const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
    const navType = nav?.type;
    const firstRoute = route();
    const values: Partial<Record<Sample["metric"], number>> = {};
    let cls = 0;
    let sent = false;
    const observers: PerformanceObserver[] = [];
    const observe = (type: string, cb: (entries: PerformanceEntryList) => void, opts: PerformanceObserverInit = {}) => {
      try {
        const po = new PerformanceObserver((list) => cb(list.getEntries()));
        po.observe({ type, buffered: true, ...opts } as PerformanceObserverInit);
        observers.push(po);
      } catch { /* unsupported entry type */ }
    };

    if (nav) values.TTFB = Math.max(0, nav.responseStart - ((nav as PerformanceNavigationTiming & { activationStart?: number }).activationStart ?? 0));
    observe("paint", (entries) => { for (const e of entries) if (e.name === "first-contentful-paint") values.FCP = e.startTime; });
    observe("largest-contentful-paint", (entries) => { const last = entries[entries.length - 1]; if (last) values.LCP = last.startTime; });
    observe("layout-shift", (entries) => { for (const e of entries as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!e.hadRecentInput) cls += e.value; values.CLS = cls; });
    // INP approximation: the slowest interaction so far (durationThreshold 40ms, as web-vitals uses).
    observe("event", (entries) => { for (const e of entries as Array<PerformanceEntry & { interactionId?: number }>) if (e.interactionId) values.INP = Math.max(values.INP ?? 0, e.duration); }, { durationThreshold: 40 } as PerformanceObserverInit);

    const send = () => {
      if (sent) return;
      const samples: Sample[] = (Object.keys(values) as Sample["metric"][]).filter((m) => typeof values[m] === "number").map((metric) => ({ route: firstRoute, metric, value: Number(values[metric]!.toFixed(metric === "CLS" ? 4 : 0)), device, navType }));
      if (!samples.length) return;
      sent = true;
      const body = JSON.stringify({ samples });
      try {
        if (!navigator.sendBeacon?.("/api/vitals", new Blob([body], { type: "application/json" }))) void fetch("/api/vitals", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => undefined);
      } catch { /* nothing to do */ }
    };
    const onHidden = () => { if (document.visibilityState === "hidden") send(); };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", send);
    return () => { document.removeEventListener("visibilitychange", onHidden); window.removeEventListener("pagehide", send); observers.forEach((o) => o.disconnect()); };
  }, []);
  return null;
}
