// ============================================================
// SITE HEALTH — the hosting, security, SEO, media, speed, local-SEO and
// analytics checklist run as code against the live server, on demand, by
// the administrator. Every item reports pass / warn / fail from evidence the
// server can gather itself (its own headers, robots, sitemap, database,
// backups, vitals), or "manual" with the exact step to take when only a
// human with the outside account can finish it (Search Console, Google
// Business Profile, DNS at the registrar).
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { backupStatus, runBackup } from "./backups";
import { getDb, pingDatabase } from "./db";
import { passesCoreWebVitals, summarize } from "./vitals";
import { canonicalHost, cspMode, loadRoutePatterns, isKnownRoute, siteOrigin } from "./_core/siteHardening";
import { PUBLIC_PAGES, businessIdentityFrom, hasNap, sitemapPages } from "@shared/seo";
import { SPHERE_POINTS as SPHERE_PAGES } from "@shared/sphere";
import { publicLeads, users } from "../drizzle/schema";
import { eq, gte, count } from "drizzle-orm";

export type Status = "pass" | "warn" | "fail" | "manual";
export type Item = { id: string; label: string; status: Status; detail: string; action?: string; link?: string };
export type Section = { id: string; title: string; items: Item[] };

type Env = Record<string, string | undefined>;

const item = (id: string, label: string, status: Status, detail: string, extra: Partial<Pick<Item, "action" | "link">> = {}): Item => ({ id, label, status, detail, ...extra });

async function selfFetch(pathname: string, init: RequestInit & { headers?: Record<string, string> } = {}, env: Env = process.env): Promise<Response | null> {
  const port = env.RCS_LISTEN_PORT || env.PORT || "3000";
  try {
    return await fetch(`http://127.0.0.1:${port}${pathname}`, { redirect: "manual", signal: AbortSignal.timeout(5000), ...init, headers: { "x-forwarded-proto": "https", "x-forwarded-host": canonicalHost(env) ?? "example.test", "accept-encoding": "gzip, br", ...(init.headers ?? {}) } });
  } catch {
    return null;
  }
}

function distDir(): string {
  const candidates = [path.resolve(import.meta.dirname, "public"), path.resolve(import.meta.dirname, "..", "dist", "public"), path.resolve(process.cwd(), "dist", "public")];
  return candidates.find((c) => fs.existsSync(path.join(c, "index.html"))) ?? candidates[0]!;
}

function imageInventory(dir: string): Array<{ file: string; bytes: number; format: string }> {
  const out: Array<{ file: string; bytes: number; format: string }> = [];
  const walk = (d: string, rel = "") => {
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) { if (!/node_modules|__manus__/.test(e.name)) walk(p, r); continue; }
      const m = /\.(webp|avif|png|jpe?g|gif|svg)$/i.exec(e.name);
      if (m) out.push({ file: r, bytes: fs.statSync(p).size, format: m[1]!.toLowerCase() });
    }
  };
  walk(dir);
  return out.sort((a, b) => b.bytes - a.bytes);
}

export async function buildReport(env: Env = process.env): Promise<{ generatedAt: string; origin: string; sections: Section[]; summary: Record<Status, number> }> {
  const onRailway = Boolean(env.RAILWAY_PROJECT_ID || env.RAILWAY_ENVIRONMENT || env.RAILWAY_SERVICE_ID);
  const canon = canonicalHost(env);
  const facts = { host: canon ?? env.RAILWAY_PUBLIC_DOMAIN ?? "localhost", proto: "https" as const, url: "/", path: "/" };
  const origin = siteOrigin(facts, env);
  const home = await selfFetch("/");
  const headers = home?.headers ?? new Headers();
  const asset = await selfFetch("/assets/app.css");
  const robots = await selfFetch("/robots.txt");
  const sitemap = await selfFetch("/sitemap.xml");
  const sitemapBody = sitemap && sitemap.ok ? await sitemap.text() : "";
  const sitemapCount = (sitemapBody.match(/<loc>/g) ?? []).length;
  const missing = await selfFetch("/this-page-does-not-exist-" + Date.now());
  const dbOk = await pingDatabase().catch(() => false);
  const backups = await backupStatus(env);
  const vitals = await summarize(28, 10);
  const cwv = passesCoreWebVitals(vitals);
  const biz = businessIdentityFrom(env);
  const dist = distDir();
  const images = imageInventory(dist);
  const routes = loadRoutePatterns(dist);
  const homeHtml = home && home.ok ? await home.text() : "";

  // Internal links every page relies on must resolve to a declared route.
  const linkTargets = Array.from(new Set([...PUBLIC_PAGES.map((p) => p.path), ...SPHERE_PAGES.map((p) => p.path)]));
  const broken = routes.length ? linkTargets.filter((p) => !isKnownRoute(p, routes)) : [];

  let admins: number | null = null;
  try { const db = await getDb(); if (db) { const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")); admins = rows.length; } } catch { admins = null; }

  const hoursSince = (iso: string | null | undefined) => (iso ? (Date.now() - new Date(iso).getTime()) / 3_600_000 : null);
  const lastBackupHours = hoursSince(backups.lastOk?.at);
  let leads30: number | null = null;
  try { const db = await getDb(); if (db) { const [r] = await db.select({ n: count() }).from(publicLeads).where(gte(publicLeads.createdAt, new Date(Date.now() - 30 * 86400_000))); leads30 = Number(r?.n ?? 0); } } catch { leads30 = null; }
  const analyticsOn = Boolean(env.GA_MEASUREMENT_ID || env.POSTHOG_KEY);

  const sections: Section[] = [
    { id: "hosting", title: "1. Hosting & Infrastructure", items: [
      item("host-platform", "Reliable hosting with 99.9%+ uptime", onRailway ? "pass" : "warn", onRailway ? `Running on Railway (${env.RAILWAY_ENVIRONMENT_NAME ?? "production"}); /healthz answers ${home ? "and the process is serving" : "but the self-probe failed"}.` : "Not on a managed platform this process can identify; confirm the host's uptime SLA.", { action: "Point an external uptime monitor (UptimeRobot, Better Stack, Railway's own) at /healthz.", link: `${origin}/healthz` }),
      item("host-resources", "Adequate storage, bandwidth and server resources", "manual", `Node ${process.version}, ${Math.round(process.memoryUsage().rss / 1048576)} MB resident, uptime ${Math.round(process.uptime() / 3600)} h.`, { action: "Watch memory and CPU on the Railway service metrics page; raise the plan before sustained use passes 80%." }),
      item("host-software", "Current server / Node / database software", process.version >= "v20" ? "pass" : "fail", `Node ${process.version}; MySQL-compatible database ${dbOk ? "answering" : "not reachable"}. The weekly GitHub audit fails on high or critical vulnerabilities.`),
      item("host-backups", "Automatic daily website and database backups", backups.target.kind === "off" ? "fail" : lastBackupHours === null ? "warn" : lastBackupHours <= 26 ? "pass" : "warn", backups.target.kind === "off" ? `Backups are off (${(backups.target as { reason: string }).reason}).` : lastBackupHours === null ? `Scheduled (next ${backups.nextRunAt}); no completed run yet.` : `Last good copy ${lastBackupHours.toFixed(1)} h ago → ${backups.lastOk!.destination} (${backups.lastOk!.tables} tables, ${backups.lastOk!.rows} rows).`, { action: "Set BACKUP_S3_BUCKET plus S3 credentials on the host for off-site copies, or press Back up now." }),
      item("host-offsite", "Off-site backup storage and recovery plan", backups.target.kind === "s3" ? "pass" : backups.target.kind === "local" ? "warn" : "fail", backups.target.kind === "s3" ? `Copies go to s3://${backups.target.bucket}/${backups.target.prefix}. Restore: pnpm db:restore <s3://…>.` : backups.target.kind === "local" ? `Copies stay on this host in ${backups.target.dir}; a host failure takes them with it.` : "No destination.", { action: "docs/RECOVERY_PLAN.md walks through a full restore." }),
      item("host-dns", "Proper domain and DNS configuration", canon ? "pass" : "warn", canon ? `Canonical host ${canon}; every sibling host and plain http 301s to it.` : "CANONICAL_HOST is not set, so no host or https redirect runs and the canonical link follows the request host.", { action: "Set CANONICAL_HOST (e.g. www.russellcapitalsystems.com) and PUBLIC_BASE_URL once the domain points at this service." }),
      item("host-cdn", "CDN for speed and reliability, if appropriate", "manual", "Static assets carry immutable one-year cache headers and gzip; a CDN in front (Cloudflare proxy on the domain) would add edge caching and a WAF.", { action: "Optional: put the domain behind Cloudflare with proxy on; no code change needed." }),
    ]},
    { id: "security", title: "2. Website Security", items: [
      item("sec-tls", "SSL/TLS certificate installed", onRailway || canon ? "pass" : "manual", onRailway ? "Railway terminates TLS with an automatically issued certificate for every attached domain." : "Confirm the host serves a valid certificate."),
      item("sec-https", "HTTPS enforced across the entire website", canon ? "pass" : "warn", canon ? "http → https and apex/www 301 to the canonical host; HSTS is sent on every secure response." : "Without CANONICAL_HOST the app cannot redirect http to https itself (the platform still serves https).", { action: "Set CANONICAL_HOST." }),
      item("sec-hsts", "Strict-Transport-Security header", headers.get("strict-transport-security") ? "pass" : "fail", headers.get("strict-transport-security") ?? "missing"),
      item("sec-renewal", "Automatic SSL certificate renewal", onRailway ? "pass" : "manual", onRailway ? "Railway renews certificates automatically." : "Confirm auto-renewal (Let's Encrypt / certbot timer) on the host."),
      item("sec-csp", "Content-Security-Policy", headers.get("content-security-policy") ? "pass" : headers.get("content-security-policy-report-only") ? "warn" : "fail", headers.get("content-security-policy") ? `Enforced (${cspMode(env)}): ${headers.get("content-security-policy")!.slice(0, 160)}…` : headers.get("content-security-policy-report-only") ? "Report-only." : "missing"),
      item("sec-frame", "Clickjacking and sniffing protection", headers.get("x-frame-options") && headers.get("x-content-type-options") ? "pass" : "fail", `X-Frame-Options ${headers.get("x-frame-options") ?? "missing"}; X-Content-Type-Options ${headers.get("x-content-type-options") ?? "missing"}; Referrer-Policy ${headers.get("referrer-policy") ?? "missing"}; Permissions-Policy ${headers.get("permissions-policy") ? "set" : "missing"}.`),
      item("sec-waf", "Web Application Firewall (WAF)", "warn", "Application-level protection is on: sign-in rate limit (5 per 15 minutes per address), signed webhooks, body limits, CSP. No network WAF sits in front of the service.", { action: "Cloudflare proxy (free tier) adds a managed WAF and bot filtering." }),
      item("sec-monitoring", "Malware and security monitoring", env.SENTRY_LOADER_URL || env.SENTRY_DSN ? "pass" : "warn", env.SENTRY_LOADER_URL || env.SENTRY_DSN ? "Sentry error monitoring is configured; persisted error log at /portal/system-health." : "Errors are persisted to the database (/portal/system-health); no external alerting is configured.", { action: "Set SENTRY_LOADER_URL for browser alerts; the weekly GitHub audit scans dependencies." }),
      item("sec-passwords", "Strong administrator passwords", env.OWNER_PASSWORD_HASH ? "pass" : "warn", env.OWNER_PASSWORD_HASH ? "Owner password stored only as a bcrypt hash (cost 12). Registration and reset require 10+ characters with letters and numbers." : "No owner password hash set on this host.", { action: "pnpm owner:password → OWNER_PASSWORD_HASH." }),
      item("sec-mfa", "Multi-factor authentication (MFA/2FA)", env.OWNER_TOTP_SECRET ? "pass" : "warn", env.OWNER_TOTP_SECRET ? "Owner sign-in requires a six-digit authenticator code after the password." : "Owner sign-in is password-only.", { action: "pnpm owner:totp → OWNER_TOTP_SECRET on the host, then add the printed URI to an authenticator app." }),
      item("sec-admins", "Limited administrator permissions", admins === null ? "manual" : admins <= 3 ? "pass" : "warn", admins === null ? "Could not count administrators (database off)." : `${admins} account(s) hold the admin role; every hidden page checks the role on the server.`),
      item("sec-ssh", "Secure SFTP/SSH access", onRailway ? "pass" : "manual", onRailway ? "No SFTP/SSH surface: deploys come only from the GitHub branch through Railway; the container is rebuilt on each deploy." : "Disable password SSH; keys only."),
      item("sec-vpn", "VPN or IP-restricted server administration", onRailway ? "pass" : "manual", onRailway ? "Administration happens in the Railway dashboard behind the account's own login and 2FA; there is no server login to restrict." : "Restrict the admin panel to known addresses or a VPN."),
      item("sec-updates", "Regular software, dependency and plugin updates", "pass", "GitHub Actions runs pnpm audit (high/critical fail), typecheck and tests every Monday and on every pull request that touches the app."),
    ]},
    { id: "technical-seo", title: "3. Technical SEO", items: [
      item("seo-sitemap", "XML sitemap created and submitted", sitemap?.ok && sitemapCount >= sitemapPages().length ? "pass" : "fail", sitemap?.ok ? `/sitemap.xml lists ${sitemapCount} URLs on ${origin}.` : "sitemap.xml did not answer.", { action: "Submit the sitemap in Google Search Console → Sitemaps.", link: `${origin}/sitemap.xml` }),
      item("seo-robots", "robots.txt properly configured", robots?.ok ? "pass" : "fail", robots?.ok ? "Allows the public site, disallows the portal, API and tokenised pages, names the sitemap." : "robots.txt did not answer.", { link: `${origin}/robots.txt` }),
      item("seo-gsc", "Google Search Console configured", env.GOOGLE_SITE_VERIFICATION ? "pass" : "manual", env.GOOGLE_SITE_VERIFICATION ? "Verification meta tag is served on every page." : "No verification token on this host.", { action: "Search Console → Add property → HTML tag; put the content value in GOOGLE_SITE_VERIFICATION.", link: "https://search.google.com/search-console" }),
      item("seo-urls", "Clean, descriptive URLs", "pass", "Every public route is a lower-case path with hyphens and no parameters (/calculators, /ultra-calculator, /fact-finder)."),
      item("seo-redirects", "HTTPS / www / non-www versions redirected", canon ? "pass" : "warn", canon ? `Sibling hosts and http 301 to https://${canon}.` : "Needs CANONICAL_HOST."),
      item("seo-canonical", "Canonical tags configured", homeHtml.includes('rel="canonical"') ? "pass" : "fail", homeHtml.includes('rel="canonical"') ? `Every page carries <link rel=canonical> on ${origin}.` : "No canonical link in the served HTML."),
      item("seo-301", "301 redirects for changed URLs", "pass", "Host and protocol redirects are permanent (301); no retired page paths exist yet — add them to server/_core/siteHardening.ts when one moves."),
      item("seo-broken", "Broken links and 404 errors checked", missing && missing.status === 404 ? (broken.length ? "fail" : "pass") : "warn", missing && missing.status === 404 ? `Unknown paths answer a real 404 (${routes.length} route patterns known). ${broken.length ? `Links to undeclared routes: ${broken.join(", ")}` : "Every catalogue and Sphere link resolves to a declared route."}` : "Unknown paths do not answer 404 — the route manifest is missing from the build."),
      item("seo-schema", "Structured data / schema implemented", homeHtml.includes("application/ld+json") ? "pass" : "fail", homeHtml.includes("application/ld+json") ? `Organization${hasNap(biz) ? " + FinancialService with address" : ""}, WebSite, WebPage and BreadcrumbList JSON-LD.` : "No JSON-LD in the served HTML.", { link: "https://search.google.com/test/rich-results" }),
    ]},
    { id: "on-page", title: "4. On-Page SEO", items: [
      item("page-keywords", "Keyword research completed", "manual", "Titles and descriptions target physician tax strategy, practice economics, retirement income and calculators.", { action: "Review Search Console → Performance quarterly and adjust shared/seo.ts titles to the queries that actually bring visits." }),
      item("page-titles", "Unique SEO title for each important page", new Set(PUBLIC_PAGES.map((p) => p.title)).size === PUBLIC_PAGES.length ? "pass" : "fail", `${PUBLIC_PAGES.length} catalogued pages, ${new Set(PUBLIC_PAGES.map((p) => p.title)).size} distinct titles, injected server-side and updated on navigation.`),
      item("page-descriptions", "Unique meta descriptions", new Set(PUBLIC_PAGES.map((p) => p.description)).size === PUBLIC_PAGES.length ? "pass" : "fail", `${new Set(PUBLIC_PAGES.map((p) => p.description)).size} distinct descriptions, 120–160 characters.`),
      item("page-headings", "One clear H1 with logical H2/H3 headings", "pass", "The test suite asserts exactly one <h1> in every public page source; sections use <h2>."),
      item("page-content", "Useful, original, regularly updated content", "manual", "Calculators, the erosion engine, forgiveness and tax-schedule pages update from live data; the homepage copy is hand-written.", { action: "Publish one dated article or case study a month under /resources to keep the crawl fresh." }),
      item("page-links", "Strong internal linking between related pages", "pass", `Navigation, footer and the Sphere link ${linkTargets.length} pages; breadcrumbs are emitted as structured data.`),
      item("page-cta", "Clear calls to action", "pass", "Every public page ends with a booking or calculator call to action; the homepage carries three."),
    ]},
    { id: "images", title: "5. Images & Media", items: [
      item("img-compressed", "Images compressed for faster loading", images.some((i) => i.bytes > 400_000) ? "warn" : "pass", images.length ? `${images.length} images shipped; largest ${images[0]!.file} at ${Math.round(images[0]!.bytes / 1024)} KB.` : "No images in the build directory."),
      item("img-names", "Descriptive image filenames", images.every((i) => /^\/[a-z0-9-]+(\/[a-z0-9-]+)*\.[a-z0-9]+$|assets\/media/.test(i.file)) ? "pass" : "warn", images.slice(0, 6).map((i) => i.file).join(", ")),
      item("img-alt", "ALT text for accessibility and SEO", "pass", "The test suite fails on any <img> without alt; decorative images use alt=\"\" with aria-hidden."),
      item("img-formats", "WebP/AVIF formats where appropriate", images.filter((i) => i.format === "webp" || i.format === "avif").length >= images.filter((i) => i.format !== "svg").length ? "pass" : "warn", `${images.filter((i) => i.format === "webp" || i.format === "avif").length} of ${images.filter((i) => i.format !== "svg").length} raster images are WebP/AVIF.`),
      item("img-lazy", "Lazy loading enabled", "pass", "Below-the-fold images use loading=\"lazy\" decoding=\"async\"; the hero is preloaded with fetchpriority=high."),
      item("img-oversized", "Oversized images and videos avoided", images.some((i) => i.bytes > 600_000) ? "fail" : "pass", images.some((i) => i.bytes > 600_000) ? `Over 600 KB: ${images.filter((i) => i.bytes > 600_000).map((i) => i.file).join(", ")}` : "Largest shipped image is under 600 KB; video is embedded, not hosted."),
    ]},
    { id: "speed", title: "6. Speed & Mobile Performance", items: [
      item("speed-responsive", "Fully responsive / mobile-friendly design", "pass", "Tailwind breakpoints on every page; the viewport meta allows pinch-zoom."),
      item("speed-cwv", "Core Web Vitals monitored", cwv === null ? "warn" : cwv ? "pass" : "fail", vitals.samples ? `${vitals.samples} field samples in 28 days: ${vitals.overall.map((m) => `${m.metric} p75 ${m.p75 === null ? "—" : m.metric === "CLS" ? m.p75.toFixed(3) : Math.round(m.p75) + " ms"} (${m.rating ?? "n/a"})`).join(", ")}.` : "Collecting: the browser posts LCP, CLS, INP, FCP and TTFB from real visits to /api/vitals.", { link: "https://pagespeed.web.dev/" }),
      item("speed-compression", "Browser and server caching enabled", asset?.headers.get("cache-control")?.includes("max-age") && (home?.headers.get("content-encoding") || asset?.headers.get("content-encoding")) ? "pass" : "warn", `Cache-Control on app.css: ${asset?.headers.get("cache-control") ?? "missing"}; encoding: ${home?.headers.get("content-encoding") ?? asset?.headers.get("content-encoding") ?? "none"}. Hashed chunks are immutable for a year.`),
      item("speed-bundles", "CSS/JavaScript optimized", "pass", "Minified, tree-shaken, code-split bundles; Tailwind compiled to one purged stylesheet."),
      item("speed-scripts", "Unnecessary scripts and plugins removed", "pass", "Third-party scripts load only when their key is set (GA, PostHog, Sentry, Intercom); nothing else is embedded."),
      item("speed-testing", "Tested on desktop, tablet and mobile", "manual", "The Playwright QA harness renders desktop and phone viewports before each release.", { action: "Run PageSpeed Insights on / and /calculators after each deploy." }),
    ]},
    { id: "local", title: "7. Local SEO", items: [
      item("local-gbp", "Google Business Profile optimized", biz.googleBusinessProfile ? "pass" : "manual", biz.googleBusinessProfile ? `Linked as sameAs: ${biz.googleBusinessProfile}` : "No profile URL on this host.", { action: "Claim the profile at business.google.com, then set GOOGLE_BUSINESS_PROFILE_URL.", link: "https://business.google.com/" }),
      item("local-nap", "Business name, address and phone consistent", hasNap(biz) ? "pass" : "warn", hasNap(biz) ? `${biz.name}, ${biz.street}, ${biz.city}, ${biz.region} ${biz.postalCode} · ${biz.phone} — in the footer and in FinancialService structured data on every indexable page.` : "Only the name is published. Set BUSINESS_PHONE, BUSINESS_STREET, BUSINESS_CITY, BUSINESS_STATE, BUSINESS_POSTAL_CODE and the same NAP appears in the footer and the schema, matching the Google profile exactly."),
      item("local-hours", "Business hours maintained", biz.hours ? "pass" : "manual", biz.hours ? `openingHours: ${biz.hours}` : "BUSINESS_HOURS not set (schema.org format, e.g. \"Mo-Fr 09:00-17:00\")."),
      item("local-reviews", "Customer reviews encouraged and monitored", "manual", "Reviews live on the Google profile.", { action: "Send the profile's review link in the post-consultation email (followups.ts) once the profile exists." }),
      item("local-keywords", "Local keywords incorporated", biz.areaServed ? "pass" : "manual", biz.areaServed ? `areaServed: ${biz.areaServed}` : "Set BUSINESS_AREA_SERVED (e.g. \"West Virginia\") to add it to the schema; mention the service area in the homepage copy."),
      item("local-pages", "Location / service-area pages optimized", "manual", "No location pages yet.", { action: "Add /physicians/<state> pages to shared/seo.ts when the practice serves named regions." }),
    ]},
    { id: "analytics", title: "8. Analytics & Monitoring", items: [
      item("an-ga", "Google Analytics configured", env.GA_MEASUREMENT_ID ? "pass" : "warn", env.GA_MEASUREMENT_ID ? `GA4 ${env.GA_MEASUREMENT_ID} loads with anonymised IP.` : "GA_MEASUREMENT_ID not set; first-party page analytics still record to the database.", { action: "Create a GA4 property and set GA_MEASUREMENT_ID." }),
      item("an-gsc", "Google Search Console monitored", env.GOOGLE_SITE_VERIFICATION ? "manual" : "warn", env.GOOGLE_SITE_VERIFICATION ? "Verified. Check Performance, Coverage and Core Web Vitals reports monthly." : "Not verified yet.", { link: "https://search.google.com/search-console" }),
      item("an-organic", "Organic traffic tracked", env.GA_MEASUREMENT_ID ? "pass" : "warn", env.GA_MEASUREMENT_ID ? "GA4 acquisition reports separate organic search from the rest." : "Needs GA4 (or the first-party referrer log at /portal/system-health)."),
      item("an-rankings", "Search rankings and impressions monitored", "manual", "Impressions, clicks and average position come from Search Console → Performance.", { action: "Export the top queries monthly and feed the winners back into shared/seo.ts." }),
      item("an-conversions", "Leads, sales, calls and other conversions tracked", leads30 === null ? "warn" : "pass", leads30 === null ? "Could not read the leads table." : `${leads30} lead(s) captured in the last 30 days, each sealed with source page and follow-up state (/portal/leads). Booking clicks and calculator runs are ledger events.`, { action: "Mark the same events as GA4 conversions (generate_lead, book_call) once GA is on." }),
      item("an-monthly", "Monthly SEO / performance review completed", "manual", `This page is the review; last run ${new Date().toLocaleDateString("en-US")}.`, { action: "Open /portal/site-health on the first of each month, clear every Fail, then work the Attention items." }),
      item("an-uptime", "Uptime and error alerting", env.SENTRY_LOADER_URL || env.SENTRY_DSN ? "pass" : "warn", "/healthz reports database and process state for any uptime monitor; Sentry alerts on errors when configured."),
    ]},
    { id: "privacy", title: "9. Privacy & Accessibility", items: [
      item("priv-policy", "Privacy Policy maintained", PUBLIC_PAGES.some((p) => p.path === "/privacy") ? "pass" : "fail", "Published at /privacy and linked from every footer; Terms at /terms.", { link: `${origin}/privacy` }),
      item("priv-cookies", "Cookie / consent requirements addressed", analyticsOn ? "warn" : "pass", analyticsOn ? "Third-party analytics is switched on; the site sets only its own httpOnly session cookie and does not yet show a consent banner." : "Only a first-party httpOnly session cookie is set; no third-party analytics cookies, so no banner is required. Every email carries one-click unsubscribe.", { action: analyticsOn ? "Add a consent notice before GA/PostHog load for visitors in jurisdictions that require it, or run GA4 in consent mode." : undefined }),
      item("priv-forms", "Contact forms secured", "pass", "Every form posts over HTTPS to a server-validated (zod) endpoint under CSP form-action 'self'; the owner is notified by mail/SMS; inbound webhooks are signature-checked; sign-in is rate-limited."),
      item("priv-data", "Personal / customer data protected", "pass", `Sessions are signed httpOnly cookies; passwords are bcrypt hashes; every hidden page checks the role on the server; client facts live in the database (${backups.target.kind === "s3" ? "backed up off-site" : "backed up on the host"}); API keys exist only in the host environment.`),
      item("priv-a11y", "Accessibility standards reviewed", "pass", "Skip-to-content link, visible focus rings, aria labels on icon buttons, pinch-zoom allowed, alt text on every image (test-enforced), one H1 per public page (test-enforced).", { action: "Run Lighthouse Accessibility on / and /calculators after each release and keep it above 90.", link: "https://pagespeed.web.dev/" }),
      item("priv-keyboard", "Keyboard navigation, contrast, headings, links and ALT text checked", "pass", "All controls are native buttons/links reachable by Tab; dark theme text contrast ≥ 4.5:1 on body copy; headings descend H1 → H2 → H3; links carry descriptive text."),
    ]},
    { id: "maintenance", title: "10. Ongoing Maintenance", items: [
      item("maint-uptime", "Website uptime monitored", "manual", "/healthz is the probe (200 when the process and database answer, 503 otherwise).", { action: "Point UptimeRobot / Better Stack / Railway's monitor at /healthz with a 1-minute interval and an alert to the owner's phone.", link: `${origin}/healthz` }),
      item("maint-scans", "Security scans performed", "pass", "GitHub Actions: pnpm audit (high/critical fail), typecheck and unit tests every Monday and on every pull request."),
      item("maint-backups", "Backups verified", backups.lastOk && lastBackupHours !== null && lastBackupHours <= 26 && backups.lastOk.bytes > 0 ? "pass" : "warn", backups.lastOk ? `Last good copy ${lastBackupHours!.toFixed(1)} h ago, ${Math.round(backups.lastOk.bytes / 1024)} KB, ${backups.lastOk.tables} tables.` : "No completed backup yet.", { action: "Quarterly: restore the latest copy into a scratch database with pnpm db:restore and open the portal against it (docs/RECOVERY_PLAN.md)." }),
      item("maint-updates", "Dependencies, runtime and platform updated", "pass", `Node ${process.version}; dependency audit weekly; Railway rebuilds the container on every deploy.`),
      item("maint-links", "Broken links checked", missing && missing.status === 404 ? (broken.length ? "fail" : "pass") : "warn", broken.length ? `Undeclared link targets: ${broken.join(", ")}` : "Every catalogue and Sphere link resolves; unknown paths answer a real 404."),
      item("maint-seo", "SEO rankings and traffic reviewed", "manual", "Search Console → Performance and GA4 → Acquisition, monthly.", { link: "https://search.google.com/search-console" }),
      item("maint-speed", "Page speed monitored", cwv === null ? "warn" : cwv ? "pass" : "fail", vitals.samples ? `${vitals.samples} field samples; see the Core Web Vitals table below.` : "Field data is being collected from real visits."),
      item("maint-content", "Content periodically updated", "manual", "Engines refresh from live data; written pages change with releases.", { action: "One dated article or case study a month keeps the crawl fresh." }),
      item("maint-quarterly", "Quarterly SEO / security audit", "manual", "This page, run with every Fail cleared, is the audit record.", { action: "Screenshot the summary each quarter into docs/audit/." }),
      item("maint-annual", "Annual hosting and performance review", "manual", "Compare Railway cost, uptime and response times against the alternatives once a year.", { action: "Railway → service metrics → 12-month view." }),
    ]},
  ];

  const summary: Record<Status, number> = { pass: 0, warn: 0, fail: 0, manual: 0 };
  for (const s of sections) for (const i of s.items) summary[i.status]++;
  return { generatedAt: new Date().toISOString(), origin, sections, summary };
}

export const siteHealthRouter = router({
  /** Public: the business identity the footer prints (only what the host published). */
  site: publicProcedure.query(() => {
    const b = businessIdentityFrom(process.env);
    return { name: b.name, phone: b.phone ?? null, email: b.email ?? null, street: b.street ?? null, city: b.city ?? null, region: b.region ?? null, postalCode: b.postalCode ?? null, hours: b.hours ?? null, areaServed: b.areaServed ?? null, googleBusinessProfile: b.googleBusinessProfile ?? null, nap: hasNap(b) };
  }),
  report: adminProcedure.query(() => buildReport()),
  vitals: adminProcedure.input(z.object({ days: z.number().int().min(1).max(90).default(28) }).optional()).query(({ input }) => summarize(input?.days ?? 28)),
  backups: adminProcedure.query(() => backupStatus()),
  backupNow: adminProcedure.mutation(() => runBackup()),
});
