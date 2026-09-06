// ============================================================
// ANALYTICS LOADER — loads the browser-side platforms the host has switched
// on (PostHog, Google Analytics, Sentry loader, Intercom). Keys come from
// `integrations.public`, which only ever returns public ids. Nothing loads
// when nothing is configured.
// ============================================================
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; posthog?: { init: (k: string, o: Record<string, unknown>) => void }; Intercom?: (...args: unknown[]) => void; intercomSettings?: Record<string, unknown> }
}

function addScript(src: string, attrs: Record<string, string> = {}): HTMLScriptElement | null {
  if (typeof document === "undefined" || document.querySelector(`script[src="${src}"]`)) return null;
  const s = document.createElement("script");
  s.src = src; s.async = true;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
  return s;
}

export function AnalyticsLoader() {
  const cfg = trpc.integrations.public.useQuery(undefined, { staleTime: 10 * 60_000, refetchOnWindowFocus: false });
  useEffect(() => {
    const c = cfg.data;
    if (!c) return;
    if (c.gaMeasurementId) {
      addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(c.gaMeasurementId)}`);
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag() { window.dataLayer!.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", c.gaMeasurementId, { anonymize_ip: true });
    }
    if (c.posthogKey) {
      const s = addScript(`${c.posthogHost.replace(/\/$/, "")}/static/array.js`);
      const init = () => { try { window.posthog?.init(c.posthogKey!, { api_host: c.posthogHost, person_profiles: "identified_only", capture_pageview: true }); } catch { /* optional */ } };
      if (s) s.onload = init; else init();
    }
    if (c.sentryLoaderUrl) addScript(c.sentryLoaderUrl, { crossorigin: "anonymous" });
    if (c.intercomAppId) {
      window.intercomSettings = { api_base: "https://api-iam.intercom.io", app_id: c.intercomAppId };
      addScript(`https://widget.intercom.io/widget/${encodeURIComponent(c.intercomAppId)}`);
    }
  }, [cfg.data]);
  return null;
}
