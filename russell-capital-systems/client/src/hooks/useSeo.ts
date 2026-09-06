// Keeps the document head in step with the route as the visitor navigates:
// the server rendered the first page's title, description and canonical;
// this applies the same catalogue (shared/seo.ts) to every client-side move.
import { useEffect } from "react";
import { useLocation } from "wouter";
import { seoFor } from "@shared/seo";

function setMeta(selector: string, attr: "content" | "href", value: string, create: () => HTMLElement) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) { el = create(); document.head.appendChild(el); }
  el.setAttribute(attr, value);
}

export function useSeo() {
  const [location] = useLocation();
  useEffect(() => {
    if (typeof document === "undefined") return;
    const seo = seoFor(location);
    document.title = seo.title;
    setMeta('meta[name="description"]', "content", seo.description, () => Object.assign(document.createElement("meta"), { name: "description" }));
    setMeta('meta[name="robots"]', "content", seo.robots, () => Object.assign(document.createElement("meta"), { name: "robots" }));
    setMeta('meta[property="og:title"]', "content", seo.title, () => { const m = document.createElement("meta"); m.setAttribute("property", "og:title"); return m; });
    setMeta('meta[property="og:description"]', "content", seo.description, () => { const m = document.createElement("meta"); m.setAttribute("property", "og:description"); return m; });
    const canonicalEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const origin = canonicalEl?.href ? new URL(canonicalEl.href).origin : window.location.origin;
    setMeta('link[rel="canonical"]', "href", `${origin}${seo.path}`, () => Object.assign(document.createElement("link"), { rel: "canonical" }));
    setMeta('meta[property="og:url"]', "content", `${origin}${seo.path}`, () => { const m = document.createElement("meta"); m.setAttribute("property", "og:url"); return m; });
  }, [location]);
}

export function SeoSync() { useSeo(); return null; }
