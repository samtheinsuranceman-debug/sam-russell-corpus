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
import { NOINDEX_PATHS, SITE_NAME, canonicalUrl } from "@shared/seo";
import { routeMetaFor } from "@/lib/routeMetaFor";
import { shortFor } from "@/lib/pageShorts";

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
    // All 6,579 pages' titles/descriptions come from one testable builder —
    // titles hard-capped at 60 chars, descriptions at 160 (routeMetaFor.test.ts).
    const meta = routeMetaFor(path);
    const noindex = NOINDEX_PATHS.some((p) => path === p || path.startsWith(p + "/"));

    if (meta) {
      document.title = meta.title;
      setMeta("description", meta.description);
      setOg("og:title", meta.title);
      // The one-liner: every page's unique <69-char "what it is and what it
      // means to you," served where shares and previews read it.
      const short = shortFor(path) ?? meta.description;
      setOg("og:description", short);
      setMeta("twitter:description", short);
      setOg("og:url", canonicalUrl(path));
    } else if (noindex) {
      // Private surfaces get a generic title — nothing member-specific leaks
      // into browser history sync or link previews.
      document.title = `${SITE_NAME} — Member Area`;
    }
    setCanonical(canonicalUrl(meta ? path : "/"));
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
    setJsonLd("ld-faq", path === "/help" ? HELP_FAQ_LD : null);

    // BreadcrumbList structured data for every deep page family — tells
    // crawlers where each of the 2,400+ pages sits in the site's tree.
    const CRUMB_PARENT: Record<string, { path: string; name: string }> = {
      "/line/": { path: "/lines", name: "The 32 Lines" },
      "/weak/": { path: "/lines", name: "The 32 Lines" },
      "/gift/": { path: "/lines", name: "The 32 Lines" },
      "/pair/": { path: "/pairs", name: "Power Combinations" },
      "/protocol/": { path: "/protocols", name: "Protocol Library" },
      "/compare/": { path: "/protocols", name: "Protocol Library" },
      "/build/": { path: "/protocols", name: "Protocol Library" },
      "/kind/": { path: "/protocols", name: "Protocol Library" },
      "/capacity/": { path: "/protocols", name: "Protocol Library" },
      "/practice/": { path: "/practices", name: "Keystone Practices" },
      "/goal/": { path: "/practices", name: "Keystone Practices" },
      "/myth/": { path: "/myths", name: "The Myth Museum" },
      "/wing/": { path: "/myths", name: "The Myth Museum" },
      "/verdict/": { path: "/myths", name: "The Myth Museum" },
    };
    const crumbPrefix = Object.keys(CRUMB_PARENT).find((k) => path.startsWith(k));
    if (crumbPrefix && meta) {
      const parent = CRUMB_PARENT[crumbPrefix];
      setJsonLd("ld-breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: canonicalUrl("/") },
          { "@type": "ListItem", position: 2, name: parent.name, item: canonicalUrl(parent.path) },
          { "@type": "ListItem", position: 3, name: meta.title.replace(/ — AQAL.*$/, ""), item: canonicalUrl(path) },
        ],
      });
    } else {
      setJsonLd("ld-breadcrumb", null);
    }
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
