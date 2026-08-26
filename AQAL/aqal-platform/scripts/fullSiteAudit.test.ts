// ============================================================
// FULL-SITE AUDIT — renders EVERY sitemap route server-side and
// validates the complete internal link graph.
//   pnpm exec vitest run --config vitest.audit.config.ts scripts/fullSiteAudit.test.ts
// For each of the 11,659 sitemap paths: resolve the App route
// pattern, render the page component, assert it produces real
// content with no nested anchors, and collect every <a href>.
// Then: every internal link must land on a known route.
// ============================================================
import "./browserShim";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Route, Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { describe, expect, it } from "vitest";
import { trpc } from "../client/src/lib/trpc";
import { SITEMAP_PATHS } from "../shared/seo";

const appSrc = readFileSync(join(__dirname, "..", "client", "src", "App.tsx"), "utf-8");

// component name -> module path (lazy + direct imports)
const modules = new Map<string, string>();
for (const m of appSrc.matchAll(/const (\w+) = lazy\(\(\) => import\("\.\/pages\/([\w/]+)"\)\)/g)) modules.set(m[1], m[2]);
for (const m of appSrc.matchAll(/import (\w+) from "\.\/pages\/([\w/]+)"/g)) modules.set(m[1], m[2]);

// ordered route table: pattern -> component name (first match wins, like wouter)
const routes: { pattern: string; component: string }[] = [];
for (const m of appSrc.matchAll(/<Route path=\{"([^"]+)"\}>([\s\S]*?)<\/Route>/g)) {
  // The page component sits inside <Suspense ...><Cmp /></Suspense>;
  // a bare match would grab the Suspense FALLBACK skeleton instead.
  const inner = m[2].match(/<Suspense[^>]*>\s*<(\w+) \/>\s*<\/Suspense>/) ?? m[2].match(/<(\w+) \/>(?![\s\S]*<\w+ \/>)/);
  if (inner) routes.push({ pattern: m[1], component: inner[1] });
}

function matchPattern(path: string): { pattern: string; component: string } | undefined {
  const segs = path.split("/");
  return routes.find((r) => {
    const ps = r.pattern.split("/");
    if (ps.length !== segs.length) return false;
    return ps.every((p, i) => p.startsWith(":") || p === segs[i]);
  });
}

const nestedAnchor = (html: string) => {
  let depth = 0;
  const tag = /<(\/?)a\b[^>]*?(\/?)>/gi;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    if (m[1] === "/") depth = Math.max(0, depth - 1);
    else if (m[2] !== "/") { depth += 1; if (depth > 1) return true; }
  }
  return false;
};

describe("full-site audit", () => {
  it("renders all sitemap routes and validates the internal link graph", async () => {
    const sitemap = new Set(SITEMAP_PATHS);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
    const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "http://localhost:9/api/trpc", transformer: superjson })] });
    const componentCache = new Map<string, any>();
    const unrouted: string[] = [];
    const renderErrors: string[] = [];
    const nested: string[] = [];
    const thin: string[] = [];
    const links = new Map<string, string>(); // href -> first page that used it
    let rendered = 0;

    for (const path of SITEMAP_PATHS) {
      const route = matchPattern(path);
      if (!route) { unrouted.push(path); continue; }
      let Cmp = componentCache.get(route.component);
      if (!Cmp) {
        const mod = modules.get(route.component);
        if (!mod) { unrouted.push(`${path} (no module for ${route.component})`); continue; }
        Cmp = (await import(`../client/src/pages/${mod}`)).default;
        componentCache.set(route.component, Cmp);
      }
      let html = "";
      try {
        html = renderToString(
          createElement(trpc.Provider, { client: trpcClient, queryClient } as any,
            createElement(QueryClientProvider, { client: queryClient },
              createElement(Router, { ssrPath: path },
                createElement(Route, { path: route.pattern }, createElement(Cmp))))),
        );
      } catch (e: any) {
        renderErrors.push(`${path}: ${String(e?.message ?? e).slice(0, 140)}`);
        continue;
      }
      rendered++;
      if (html.length < 300) thin.push(`${path} (${html.length})`);
      if (nestedAnchor(html)) nested.push(path);
      for (const m of html.matchAll(/href="([^"]+)"/g)) {
        const href = m[1].replace(/&amp;/g, "&");
        if (!links.has(href)) links.set(href, path);
      }
      if (rendered % 2000 === 0) console.log(`rendered ${rendered}...`);
    }

    // Validate the collected link graph.
    const badLinks: string[] = [];
    for (const [href, from] of links) {
      if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
      const clean = href.split("#")[0].split("?")[0];
      if (clean === "" || clean.startsWith("/api/") || clean.startsWith("/aqal-storage/")) continue;
      if (sitemap.has(clean)) continue;
      if (matchPattern(clean)) continue; // real route not in sitemap (e.g. gated pages)
      badLinks.push(`${clean} (from ${from})`);
    }

    console.log(`rendered=${rendered}/${SITEMAP_PATHS.length} uniqueLinks=${links.size}`);
    console.log(`unrouted=${unrouted.length} renderErrors=${renderErrors.length} nested=${nested.length} thin=${thin.length} badLinks=${badLinks.length}`);
    for (const list of [unrouted, renderErrors, nested, thin, badLinks]) list.slice(0, 12).forEach((x) => console.log("  ", x));

    expect(unrouted).toEqual([]);
    expect(renderErrors).toEqual([]);
    expect(nested).toEqual([]);
    expect(badLinks).toEqual([]);
    expect(thin).toEqual([]);
    expect(rendered).toBe(SITEMAP_PATHS.length);
  }, 1800000);
});
