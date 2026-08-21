// ============================================================
// ROUTE META — one component, mounted once in App, that keeps the
// document head honest on every navigation: unique <title> and
// meta description per page, a per-route canonical URL, noindex
// on member/admin surfaces, and JSON-LD structured data where a
// page warrants it. The data lives in shared/seo.ts.
// Also ships the Core Web Vitals beacon (first-party, no tracker).
// ============================================================
import { useEffect } from "react";
import { useLocation } from "wouter";
import { PAGE_META, NOINDEX_PATHS, SITE_NAME, canonicalUrl, lineFromSlug } from "@shared/seo";
import { LINE_ENCYCLOPEDIA } from "@/lib/lineEncyclopedia";

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

function setOg(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", "canonical"); document.head.appendChild(el); }
  el.setAttribute("href", href);
}

function setJsonLd(id: string, data: object | null) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.id = id;
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}

// FAQPage structured data for /help — mirrors the visible FAQ content.
const HELP_FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Do I need a working microphone to take the assessment?",
      a: "No. You can record live in the browser, upload a voice-memo file, or upload a typed transcript — all three routes score identically." },
    { q: "How long does scoring take?",
      a: "Scoring starts when your 27th answer lands. The eight-model AI panel usually finishes within minutes." },
    { q: "Is the assessment really free?",
      a: "The first 10,000 founding members get the assessment and membership free for life — no card required. After that, membership is $449/month or $4,499/year." },
    { q: "Is my data private?",
      a: "Raw audio is deleted 72 hours after scoring; private messages are never read; there are no ad trackers; and every member can export or delete their data." },
  ].map(({ q, a }) => ({
    "@type": "Question", name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function RouteMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location === "" ? "/" : location;
    let meta = PAGE_META[path];
    // /line/:slug pages get generated meta from the encyclopedia.
    if (!meta && path.startsWith("/line/")) {
      const name = lineFromSlug(path.slice("/line/".length));
      const enc = name ? LINE_ENCYCLOPEDIA[name] : undefined;
      if (name && enc) {
        meta = {
          title: `${name} Intelligence — The Full Breakdown — AQAL`,
          description: enc.def.slice(0, 158),
        };
      }
    }
    const noindex = NOINDEX_PATHS.some((p) => path === p || path.startsWith(p + "/"));

    if (meta) {
      document.title = meta.title;
      setMeta("description", meta.description);
      setOg("og:title", meta.title);
      setOg("og:description", meta.description);
      setOg("og:url", canonicalUrl(path));
    } else if (noindex) {
      // Private surfaces get a generic title — nothing member-specific leaks
      // into browser history sync or link previews.
      document.title = `${SITE_NAME} — Member Area`;
    }
    setCanonical(canonicalUrl(meta ? path : "/"));
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
    setJsonLd("ld-faq", path === "/help" ? HELP_FAQ_LD : null);
  }, [location]);

  // Core Web Vitals — one beacon per pageload, sent when the tab hides.
  useEffect(() => {
    let lcp = 0, cls = 0, inp = 0;
    let sent = false;
    const observers: PerformanceObserver[] = [];
    try {
      const po = (type: string, cb: (entries: PerformanceEntry[]) => void) => {
        const o = new PerformanceObserver((l) => cb(l.getEntries()));
        o.observe({ type, buffered: true } as PerformanceObserverInit);
        observers.push(o);
      };
      po("largest-contentful-paint", (es) => { const last = es[es.length - 1]; if (last) lcp = last.startTime; });
      po("layout-shift", (es) => { for (const e of es) { const ls = e as unknown as { value: number; hadRecentInput: boolean }; if (!ls.hadRecentInput) cls += ls.value; } });
      po("event", (es) => { for (const e of es) { const d = (e as unknown as { duration: number }).duration; if (d > inp) inp = d; } });
    } catch { /* older browsers: send what we have */ }
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const send = () => {
      if (sent) return; sent = true;
      observers.forEach((o) => { try { o.disconnect(); } catch { /* noop */ } });
      try {
        const body = JSON.stringify({ path: window.location.pathname, lcp, cls, inp, ttfb: nav?.responseStart ?? null });
        navigator.sendBeacon?.("/api/vitals", new Blob([body], { type: "application/json" }));
      } catch { /* never break the page for telemetry */ }
    };
    const onHide = () => { if (document.visibilityState === "hidden") send(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", send); };
  }, []);

  return null;
}
