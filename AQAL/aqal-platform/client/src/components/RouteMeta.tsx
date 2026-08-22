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
import { PAGE_META, NOINDEX_PATHS, SITE_NAME, canonicalUrl, lineFromSlug, therapyFromSlug, therapyDisplay, pairFromSlug, compareFromSlug, goalFromSlug, engineLineFromSlug, CAPACITY_ONLY_LINES, KIND_IDS, WING_IDS, VERDICT_SLUGS } from "@shared/seo";
import { LINE_ENCYCLOPEDIA } from "@/lib/lineEncyclopedia";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { LINE_ROLE } from "@/lib/linePairs";
import { shortFor } from "@/lib/pageShorts";
import { mythById } from "@/lib/mythMuseum";

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
    let meta: { title: string; description: string } | undefined = PAGE_META[path];
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
    // /pair/:slug pages — meta composed from both lines' data.
    if (!meta && path.startsWith("/pair/")) {
      const pr = pairFromSlug(path.slice("/pair/".length));
      if (pr) {
        const [a, b] = pr;
        const ra = LINE_ROLE[a], rb = LINE_ROLE[b];
        meta = {
          title: `${a} × ${b} Intelligence — The ${ra?.adj ?? ""} ${rb?.noun ?? ""} — AQAL`,
          description: `What the ${a} and ${b} lines give each other, what the combination unlocks, and what half the pair quietly costs.`.slice(0, 158),
        };
      }
    }
    // /practice/:id pages — meta from the keystone library.
    if (!meta && path.startsWith("/practice/")) {
      const pr = KEYSTONE_PRACTICES.find((k) => k.id === path.slice("/practice/".length));
      if (pr) {
        meta = {
          title: `${pr.name} — Prescription, Evidence & Horizon — AQAL`,
          description: pr.prescription.slice(0, 158),
        };
      }
    }
    // /compare/:a--vs--:b — protocol comparison pages.
    if (!meta && path.startsWith("/compare/")) {
      const c = compareFromSlug(path.slice("/compare/".length));
      if (c) {
        const [ta, tb] = c.map((n) => therapyDisplay(n).split(" (")[0]);
        meta = {
          title: `${ta} vs ${tb} — Honest Comparison — AQAL`,
          description: `${ta} and ${tb} target the same capacity. Dose, durability, evidence, and how to choose — compared honestly, estimates never guarantees.`.slice(0, 158),
        };
      }
    }
    // /goal/:keyword — goal-matched practice pages.
    if (!meta && path.startsWith("/goal/")) {
      const g = goalFromSlug(path.slice("/goal/".length));
      if (g) {
        const cap = g.charAt(0).toUpperCase() + g.slice(1);
        meta = {
          title: `${cap} — The Evidence-Tiered Practices — AQAL`,
          description: `The keystone practices mapped to ${g}: concrete prescriptions, honest evidence tiers, and realistic time horizons — no hacks, no miracles.`.slice(0, 158),
        };
      }
    }
    // /weak/:slug and /gift/:slug — per-line problem/gift pages.
    if (!meta && (path.startsWith("/weak/") || path.startsWith("/gift/"))) {
      const weak = path.startsWith("/weak/");
      const name = lineFromSlug(path.slice(6));
      const enc = name ? LINE_ENCYCLOPEDIA[name] : undefined;
      if (name && enc) {
        meta = weak
          ? { title: `The Weak ${name} Line — Signs, Costs & Repair — AQAL`,
              description: `What a weak ${name} line looks like from inside, what it quietly costs, and the evidence-backed repair plan.`.slice(0, 158) }
          : { title: `Signs You're Gifted on the ${name} Line — AQAL`,
              description: `The signs of a strong ${name} line, why school never caught it, what it's worth deployed on purpose, and its best pairings.`.slice(0, 158) };
      }
    }
    // /build/:line/:therapy — capacity-building entry pages.
    if (!meta && path.startsWith("/build/")) {
      const segs = path.slice("/build/".length).split("/");
      const l = engineLineFromSlug(segs[0] ?? "");
      const t = therapyFromSlug(segs[1] ?? "");
      if (l && t) {
        meta = {
          title: `${therapyDisplay(t).split(" (")[0]} for the ${l} Capacity — AQAL`,
          description: `Building ${l} with ${therapyDisplay(t).split(" (")[0]}: the exact capacity developed, the peer-reviewed evidence, the dose, and the alternatives.`.slice(0, 158),
        };
      }
    }
    // /myth/:id — Myth Museum exhibits.
    if (!meta && path.startsWith("/myth/")) {
      const m = mythById(path.slice("/myth/".length));
      if (m) {
        meta = {
          title: `${m.name} — ${m.verdict.charAt(0) + m.verdict.slice(1).toLowerCase()} — The Myth Museum — AQAL`,
          description: `${m.claim} The sourced verdict: ${m.verdict.toLowerCase()}. Why it failed, why people bought it, and what holds up instead.`.slice(0, 158),
        };
      }
    }
    // /capacity/:slug — the eight engine-only capacity pages.
    if (!meta && path.startsWith("/capacity/")) {
      const l = engineLineFromSlug(path.slice("/capacity/".length));
      if (l && CAPACITY_ONLY_LINES.includes(l)) {
        meta = {
          title: `The ${l} Capacity — Scored, Never Displayed — AQAL`,
          description: `The ${l} capacity: what our engine measures, why no standardized test ever has, what strength looks like, what weakness costs, and the cited protocols that build it.`.slice(0, 158),
        };
      }
    }
    // /kind/:id — protocol-kind profile pages.
    if (!meta && path.startsWith("/kind/")) {
      const id = path.slice("/kind/".length);
      if (KIND_IDS.includes(id)) {
        const cap = id.charAt(0).toUpperCase() + id.slice(1);
        meta = {
          title: `${cap} Protocols — Dose, Demands & Durability — AQAL`,
          description: `The ${id} protocol family: what this kind of intervention is, the literature-typical dose, what it honestly demands, how long gains last, and every library protocol of the kind.`.slice(0, 158),
        };
      }
    }
    // /wing/:id — Myth Museum wing pages.
    if (!meta && path.startsWith("/wing/")) {
      const id = path.slice("/wing/".length);
      if (WING_IDS.includes(id)) {
        const cap = id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        meta = {
          title: `${cap} — A Wing of the Myth Museum — AQAL`,
          description: `The ${cap.toLowerCase()} family of failed therapies: how the family claims to work, why it feels like it works, the tell-tale signs, and every documented exhibit in the wing.`.slice(0, 158),
        };
      }
    }
    // /verdict/:slug — museum verdict category pages.
    if (!meta && path.startsWith("/verdict/")) {
      const slug = path.slice("/verdict/".length);
      if (VERDICT_SLUGS.includes(slug)) {
        const cap = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        meta = {
          title: `Verdict: ${cap} — The Myth Museum — AQAL`,
          description: `What the "${cap.toLowerCase()}" verdict means, the evidential standard it applies, and every Myth Museum exhibit that earned it — sourced, exhibit by exhibit.`.slice(0, 158),
        };
      }
    }
    // /protocol/:slug pages get generated meta from the therapy map.
    if (!meta && path.startsWith("/protocol/")) {
      const tname = therapyFromSlug(path.slice("/protocol/".length));
      if (tname) {
        const entry = THERAPY_LINE_MAP.find((t) => t.therapy === tname);
        const lines = THERAPY_LINE_MAP.filter((t) => t.therapy === tname).map((t) => t.line).join(", ");
        meta = {
          title: `${therapyDisplay(tname).split(" (")[0]} — Which Intelligence Lines It Builds — AQAL`,
          description: (entry ? `${entry.capacity} Mapped to: ${lines}. Dose, durability, and the peer-reviewed evidence.` : "").slice(0, 158),
        };
      }
    }
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
