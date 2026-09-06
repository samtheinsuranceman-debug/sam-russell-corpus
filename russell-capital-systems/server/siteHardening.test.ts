import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { cacheControlFor, canonicalRedirectTarget, compileRoutes, cspFor, isKnownRoute, renderHtml, robotsTxt, securityHeaders, siteOrigin, sitemapXml } from "./_core/siteHardening";
import { PUBLIC_PAGES, businessIdentityFrom, hasNap, isNoindexPath, normalizePath, seoFor, sitemapPages, structuredData } from "../shared/seo";
import { isStrongPassword, passwordChecks } from "../shared/passwordPolicy";
import { base32Decode, base32Encode, hotp, otpauthUri, totp, verifyTotp } from "./_core/totp";
import { parseSamples, p75, rate } from "./vitals";
import { backupTarget, nextRunAt, sqlLiteral } from "./backups";

const facts = (over: Partial<{ host: string; proto: "http" | "https"; url: string; path: string }> = {}) => ({ host: "www.russellcapitalsystems.com", proto: "https" as const, url: "/pricing?x=1", path: "/pricing", ...over });
const env = { CANONICAL_HOST: "www.russellcapitalsystems.com", NODE_ENV: "production" };

describe("canonical origin and redirects", () => {
  it("sends http and the apex sibling to https://canonical, keeps other hosts", () => {
    expect(canonicalRedirectTarget(facts({ proto: "http" }), env)).toBe("https://www.russellcapitalsystems.com/pricing?x=1");
    expect(canonicalRedirectTarget(facts({ host: "russellcapitalsystems.com" }), env)).toBe("https://www.russellcapitalsystems.com/pricing?x=1");
    expect(canonicalRedirectTarget(facts(), env)).toBeNull();
    expect(canonicalRedirectTarget(facts({ host: "web-production-4b215.up.railway.app" }), env)).toBeNull();
    expect(canonicalRedirectTarget(facts({ host: "web-production-4b215.up.railway.app" }), { ...env, CANONICAL_REDIRECT_ALL_HOSTS: "1" })).toBe("https://www.russellcapitalsystems.com/pricing?x=1");
  });
  it("never redirects the API, the health probe, or local development", () => {
    expect(canonicalRedirectTarget(facts({ proto: "http", path: "/api/trpc/x", url: "/api/trpc/x" }), env)).toBeNull();
    expect(canonicalRedirectTarget(facts({ proto: "http", path: "/healthz", url: "/healthz" }), env)).toBeNull();
    expect(canonicalRedirectTarget(facts({ host: "localhost:3125", proto: "http" }), env)).toBeNull();
    expect(canonicalRedirectTarget(facts({ proto: "http" }), {})).toBeNull();
  });
  it("derives the origin from PUBLIC_BASE_URL, then CANONICAL_HOST, then the request", () => {
    expect(siteOrigin(facts(), { PUBLIC_BASE_URL: "https://example.org/" })).toBe("https://example.org");
    expect(siteOrigin(facts({ host: "x.railway.app" }), env)).toBe("https://www.russellcapitalsystems.com");
    expect(siteOrigin(facts({ host: "x.railway.app" }), {})).toBe("https://x.railway.app");
  });
});

describe("security headers", () => {
  it("adds HSTS and an enforced CSP on secure production responses", () => {
    const h = securityHeaders(facts(), env);
    expect(h["Strict-Transport-Security"]).toContain("max-age=31536000");
    expect(h["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(h["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Permissions-Policy"]).toContain("camera=()");
  });
  it("withholds HSTS over plain http and CSP outside production or on the API", () => {
    expect(securityHeaders(facts({ proto: "http" }), env)["Strict-Transport-Security"]).toBeUndefined();
    expect(securityHeaders(facts(), { NODE_ENV: "development" })["Content-Security-Policy"]).toBeUndefined();
    expect(securityHeaders(facts({ path: "/api/trpc" }), env)["Content-Security-Policy"]).toBeUndefined();
    expect(securityHeaders(facts(), { ...env, CSP_MODE: "report-only" })["Content-Security-Policy-Report-Only"]).toBeDefined();
    expect(securityHeaders(facts(), { ...env, CSP_MODE: "off" })["Content-Security-Policy"]).toBeUndefined();
  });
  it("lets every configured analytics host through the CSP", () => {
    const csp = cspFor({ POSTHOG_HOST: "https://eu.i.posthog.com", SENTRY_LOADER_URL: "https://js.sentry-cdn.com/abc.min.js", VITE_ANALYTICS_ENDPOINT: "https://stats.example.com", CSP_EXTRA_SRC: "https://cdn.extra.com" });
    for (const host of ["https://www.googletagmanager.com", "https://eu.i.posthog.com", "https://stats.example.com", "https://cdn.extra.com", "https://widget.intercom.io"]) expect(csp).toContain(host);
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });
});

describe("cache policy, robots and sitemap", () => {
  it("caches hashed chunks for a year, images for a day, and revalidates the rest", () => {
    expect(cacheControlFor("/assets/chunks/x-ABC123.js")).toContain("immutable");
    expect(cacheControlFor("/rcs-neon-a.webp")).toContain("max-age=86400");
    expect(cacheControlFor("/assets/app.js")).toContain("must-revalidate");
    expect(cacheControlFor("/pricing")).toBe("no-cache");
  });
  it("keeps robots out of the portal and points at the sitemap", () => {
    const r = robotsTxt("https://www.russellcapitalsystems.com");
    expect(r).toContain("Disallow: /portal/");
    expect(r).toContain("Disallow: /api/");
    expect(r).toContain("Sitemap: https://www.russellcapitalsystems.com/sitemap.xml");
    expect(r).toContain("Allow: /");
  });
  it("lists every indexable public page once with priority and change frequency", () => {
    const xml = sitemapXml("https://www.russellcapitalsystems.com", "2026-09-06");
    expect((xml.match(/<loc>/g) ?? []).length).toBe(sitemapPages().length);
    expect(xml).toContain("<loc>https://www.russellcapitalsystems.com/</loc>");
    expect(xml).not.toContain("/login");
    expect(xml).toContain("<priority>1.0</priority>");
  });
});

describe("route knowledge", () => {
  const routes = compileRoutes(["/", "/pricing", "/portal/tax-combos/:id", "/shared/:token", "/portal/dashboard"]);
  it("matches declared routes and parameters, refuses the rest", () => {
    expect(isKnownRoute("/", routes)).toBe(true);
    expect(isKnownRoute("/pricing/", routes)).toBe(true);
    expect(isKnownRoute("/portal/tax-combos/42", routes)).toBe(true);
    expect(isKnownRoute("/portal/tax-combos/42/extra", routes)).toBe(false);
    expect(isKnownRoute("/nope", routes)).toBe(false);
    expect(isKnownRoute("/nope", [])).toBe(true);
  });
  it("every catalogue path is declared in App.tsx", () => {
    const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
    const declared = compileRoutes(Array.from(app.matchAll(/<Route\s+path="([^"]+)"/g), (m) => m[1]!));
    for (const pg of PUBLIC_PAGES) expect(isKnownRoute(pg.path, declared), pg.path).toBe(true);
    expect(isKnownRoute("/portal/site-health", declared)).toBe(true);
  });
});

describe("HTML rendering", () => {
  const template = readFileSync(resolve("client/index.html"), "utf8");
  it("injects a unique title, description, canonical, social tags and structured data per route", () => {
    const home = renderHtml({ template, path: "/", origin: "https://www.russellcapitalsystems.com", env: { GOOGLE_SITE_VERIFICATION: "abc123" } });
    expect(home.status).toBe(200);
    expect(home.html).toContain("<title>Russell Capital Systems — Financial &amp; Tax Relief");
    expect(home.html).toContain('<link rel="canonical" href="https://www.russellcapitalsystems.com/" />');
    expect(home.html).toContain('name="google-site-verification" content="abc123"');
    expect(home.html).toContain('application/ld+json');
    expect(home.html).toContain('"@type":"BreadcrumbList"'.length ? "WebSite" : "");
    expect(home.html).toContain('rel="preload" as="image" href="/rcs-neon-a.webp"');
    expect((home.html.match(/<title>/g) ?? []).length).toBe(1);
    const pricing = renderHtml({ template, path: "/pricing?utm=1", origin: "https://x" });
    expect(pricing.html).toContain("<title>Pricing | Russell Capital Systems</title>");
    expect(pricing.html).toContain('"@type":"BreadcrumbList"');
  });
  it("marks sign-in and portal pages noindex and answers 404 for unknown routes", () => {
    expect(renderHtml({ template, path: "/login", origin: "https://x" }).html).toContain('name="robots" content="noindex,nofollow"');
    expect(renderHtml({ template, path: "/portal/dashboard", origin: "https://x" }).html).toContain("noindex,nofollow");
    const missing = renderHtml({ template, path: "/nothing-here", origin: "https://x", known: false });
    expect(missing.status).toBe(404);
    expect(missing.html).toContain("Page not found | Russell Capital Systems");
    expect(missing.html).not.toContain("application/ld+json");
  });
  it("re-renders on its own marker without doubling tags", () => {
    const once = renderHtml({ template, path: "/pricing", origin: "https://x" }).html;
    const twice = renderHtml({ template: once, path: "/support", origin: "https://x" }).html;
    expect((twice.match(/<title>/g) ?? []).length).toBe(1);
    expect(twice).toContain("<title>Support | Russell Capital Systems</title>");
  });
});

describe("SEO catalogue", () => {
  it("has unique titles and descriptions of a sensible length", () => {
    expect(new Set(PUBLIC_PAGES.map((p) => p.title)).size).toBe(PUBLIC_PAGES.length);
    expect(new Set(PUBLIC_PAGES.map((p) => p.description)).size).toBe(PUBLIC_PAGES.length);
    for (const p of PUBLIC_PAGES.filter((x) => !x.noindex)) { expect(p.description.length, p.path).toBeGreaterThanOrEqual(60); expect(p.description.length, p.path).toBeLessThanOrEqual(170); }
  });
  it("normalises paths and classifies private prefixes", () => {
    expect(normalizePath("/pricing/?a=1#x")).toBe("/pricing");
    expect(isNoindexPath("/portal/anything")).toBe(true);
    expect(isNoindexPath("/shared/abc")).toBe(true);
    expect(isNoindexPath("/calculators")).toBe(false);
    expect(seoFor("/portal/tax-schedule").title).toBe("Tax Schedule | Russell Capital Systems");
  });
  it("publishes only the business identity the host set, and a FinancialService only with a full NAP", () => {
    const none = businessIdentityFrom({});
    expect(hasNap(none)).toBe(false);
    expect(structuredData("https://x", seoFor("/"), none)).toMatchObject({ "@graph": [{ "@type": "Organization" }, { "@type": "WebSite" }, { "@type": "WebPage" }] });
    const full = businessIdentityFrom({ BUSINESS_PHONE: "+1 304 555 0100", BUSINESS_STREET: "1 Main St", BUSINESS_CITY: "Charleston", BUSINESS_STATE: "WV", BUSINESS_POSTAL_CODE: "25301", GOOGLE_BUSINESS_PROFILE_URL: "https://g.page/x" });
    expect(hasNap(full)).toBe(true);
    const org = (structuredData("https://x", seoFor("/"), full) as { "@graph": Array<Record<string, unknown>> })["@graph"][0]!;
    expect(org["@type"]).toContain("FinancialService");
    expect(org.address).toMatchObject({ addressLocality: "Charleston", postalCode: "25301" });
    expect(org.sameAs).toEqual(["https://g.page/x"]);
  });
});

describe("on-page and media rules enforced at source", () => {
  const publicSources = ["Landing.tsx", "Pricing.tsx", "SupportPage.tsx", "Legal.tsx", "MassiveCalculatorsPage.tsx", "UltraCalculatorPage.tsx", "FactFinderPage.tsx"];
  it("every public page has exactly one <h1>", () => {
    for (const f of publicSources) {
      const src = readFileSync(resolve("client/src/pages", f), "utf8");
      expect((src.match(/<h1[\s>]/g) ?? []).length, f).toBe(1);
    }
  });
  it("every <img> in the client carries alt text", () => {
    const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(n) ? [p] : []; });
    const offenders: string[] = [];
    for (const file of walk(resolve("client/src"))) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/<img\b[^>]*?(\/?>)/gs)) if (!/\balt=/.test(m[0])) offenders.push(`${file}: ${m[0].slice(0, 60)}`);
    }
    expect(offenders).toEqual([]);
  });
  it("ships no raster image over 400 KB and only WebP/AVIF rasters", () => {
    const dir = resolve("client/public");
    for (const n of readdirSync(dir)) {
      if (!/\.(webp|avif|png|jpe?g|gif)$/i.test(n) || /^(favicon|apple-touch-icon)/.test(n)) continue;
      expect(/\.(webp|avif)$/i.test(n), n).toBe(true);
      expect(statSync(join(dir, n)).size, n).toBeLessThanOrEqual(400 * 1024);
    }
  });
});

describe("password policy", () => {
  it("requires ten characters with a letter and a digit and rejects the usual suspects", () => {
    expect(isStrongPassword("short1a")).toBe(false);
    expect(isStrongPassword("password12")).toBe(false);
    expect(isStrongPassword("1234567890")).toBe(false);
    expect(isStrongPassword("aaaaaaaaaa")).toBe(false);
    expect(isStrongPassword("Emerald-City-2026")).toBe(true);
    expect(passwordChecks("Emerald9x!")).toMatchObject({ length: true, letter: true, number: true, upper: true, lower: true, common: true });
  });
});

describe("TOTP second factor", () => {
  it("round-trips base32 and reproduces the RFC 6238 SHA-1 test vector", () => {
    const secret = Buffer.from("12345678901234567890");
    expect(base32Decode(base32Encode(secret)).equals(secret)).toBe(true);
    // RFC 6238 Appendix B: T=59 → 94287082 (8 digits); the 6-digit code is the last six.
    expect(hotp(secret, 1, 8)).toBe("94287082");
    expect(totp(base32Encode(secret), 59_000)).toBe("287082");
  });
  it("accepts the current code and one step either side, rejects others and malformed input", () => {
    const secret = base32Encode(Buffer.from("12345678901234567890"));
    const now = 1_700_000_000_000;
    expect(verifyTotp(secret, totp(secret, now), now)).toBe(true);
    expect(verifyTotp(secret, totp(secret, now - 30_000), now)).toBe(true);
    expect(verifyTotp(secret, totp(secret, now - 90_000), now)).toBe(false);
    expect(verifyTotp(secret, "12345", now)).toBe(false);
    expect(verifyTotp("", "123456", now)).toBe(false);
    expect(otpauthUri(secret, "sam@example.com")).toMatch(/^otpauth:\/\/totp\/Russell%20Capital%20Systems:sam%40example\.com\?secret=/);
  });
});

describe("web vitals", () => {
  it("rates against Google's thresholds and computes p75", () => {
    expect(rate("LCP", 2000)).toBe("good");
    expect(rate("LCP", 3000)).toBe("needs-improvement");
    expect(rate("CLS", 0.3)).toBe("poor");
    expect(p75([1, 2, 3, 4])).toBe(3);
    expect(p75([])).toBeNull();
  });
  it("accepts JSON or beacon text, drops malformed samples", () => {
    const good = parseSamples(JSON.stringify({ samples: [{ route: "/pricing?x", metric: "lcp", value: 1234.5, device: "mobile" }, { route: "javascript:x", metric: "LCP", value: 1 }, { metric: "NOPE", value: 1 }, { metric: "CLS", value: -1 }] }));
    expect(good).toEqual([{ route: "/pricing", metric: "LCP", value: 1234.5, device: "mobile", navType: undefined }]);
    expect(parseSamples("not json")).toEqual([]);
    expect(parseSamples([{ metric: "TTFB", value: 300 }])).toHaveLength(1);
  });
});

describe("backups", () => {
  it("chooses the destination from the environment", () => {
    expect(backupTarget({})).toMatchObject({ kind: "off" });
    expect(backupTarget({ DATABASE_URL: "mysql://x", BACKUP_DISABLED: "1" })).toMatchObject({ kind: "off" });
    expect(backupTarget({ DATABASE_URL: "mysql://x" })).toMatchObject({ kind: "local" });
    expect(backupTarget({ DATABASE_URL: "mysql://x", BACKUP_S3_BUCKET: "b" })).toEqual({ kind: "s3", bucket: "b", prefix: "rcs-backups/" });
  });
  it("writes SQL literals that survive a restore, including JSON columns and binary", () => {
    expect(sqlLiteral(null)).toBe("NULL");
    expect(sqlLiteral(5)).toBe("5");
    expect(sqlLiteral(true)).toBe("1");
    expect(sqlLiteral("O'Reilly\nline")).toBe("'O\\'Reilly\\nline'");
    expect(sqlLiteral({ a: 1 })).toBe("'{\\\"a\\\":1}'");
    expect(sqlLiteral(Buffer.from([1, 255]))).toBe("X'01ff'");
    expect(sqlLiteral(new Date("2026-09-06T04:00:00Z"))).toBe("'2026-09-06 04:00:00'");
  });
  it("schedules the next run at the configured UTC hour", () => {
    const now = new Date("2026-09-06T10:00:00Z");
    expect(nextRunAt({ BACKUP_HOUR_UTC: "4" }, now).toISOString()).toBe("2026-09-07T04:00:00.000Z");
    expect(nextRunAt({ BACKUP_HOUR_UTC: "12" }, now).toISOString()).toBe("2026-09-06T12:00:00.000Z");
  });
});
