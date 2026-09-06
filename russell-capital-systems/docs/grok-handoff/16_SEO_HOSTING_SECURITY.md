# 16 — SEO, Hosting & Security: the checklist as code

`shared/seo.ts` · `server/_core/siteHardening.ts` · `server/_core/vite.ts` ·
`server/vitals.ts` · `server/backups.ts` · `server/_core/totp.ts` ·
`shared/passwordPolicy.ts` · `server/siteHealthRouter.ts` ·
`client/src/pages/portal/SiteHealth.tsx` · `client/src/hooks/useSeo.ts` ·
`client/src/components/WebVitalsReporter.tsx` · `client/src/components/SiteIdentity.tsx` ·
`server/siteHardening.test.ts` (28) · `docs/checklists/WEBSITE_SEO_HOSTING_SECURITY_CHECKLIST.md` ·
`docs/RECOVERY_PLAN.md` · `.github/workflows/rcs-security-audit.yml`

Sam's ten-section checklist (hosting, security, technical SEO, on-page,
images, speed, local, analytics, privacy/accessibility, maintenance)
applied to the whole site. Everything a server can do for itself is done in
code; everything only the owner can do is a named step on the page.

## What every response now carries
- **One canonical origin.** `CANONICAL_HOST` (e.g. `www.russellcapitalsystems.com`): plain http and the apex/www sibling 301 to `https://<host>`; other hosts (the Railway domain) are left alone unless `CANONICAL_REDIRECT_ALL_HOSTS=1`. API, `/healthz` and localhost never redirect. `PUBLIC_BASE_URL` (else the canonical host, else the request) is the origin in canonical links, the sitemap and structured data.
- **Security headers.** HSTS (secure production responses, one year, preload), CSP (enforced; `CSP_MODE=report-only|off`; script hosts derived from the same analytics variables the client reads plus `CSP_EXTRA_SRC`), `X-Frame-Options SAMEORIGIN`, nosniff, Referrer-Policy, Permissions-Policy, COOP.
- **Cache policy.** Hashed chunks/media immutable for a year; images a day with stale-while-revalidate; `app.js`/`app.css`/HTML revalidate; gzip/brotli via `compression`.
- **Real 404s.** The build writes every declared route pattern to `dist/public/routes.json`; the SPA fallback answers 404 (with a noindex "Page not found" title) for anything else, and plain 404 for missing files. No soft 404s for crawlers.
- **Per-route HTML.** `renderHtml()` swaps the `<!--seo-->` block in `index.html` for the route's title, description, robots, canonical, Open Graph/Twitter tags, Search Console/Bing verification (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`), hero preload on `/`, and JSON-LD (Organization or FinancialService when the NAP is set, WebSite, WebPage, BreadcrumbList). `useSeo()` keeps the head in step on client-side navigation.
- **robots.txt, sitemap.xml, /healthz** from the catalogue: public pages allowed, portal/API/tokenised paths disallowed; sitemap lists the indexable pages with priority and change frequency; `/healthz` returns 200 with `db:"ok"` or 503.

## The catalogue (`shared/seo.ts`)
`PUBLIC_PAGES` — every public route with a unique title and 60–170-character description, priority, changefreq, breadcrumb trail, and `noindex` for sign-in forms. `NOINDEX_PREFIXES` for the portal and tokenised pages. `businessIdentityFrom(env)` publishes only what the host set: `BUSINESS_NAME`, `BUSINESS_PHONE`, `BUSINESS_EMAIL`, `BUSINESS_STREET`, `BUSINESS_CITY`, `BUSINESS_STATE`, `BUSINESS_POSTAL_CODE`, `BUSINESS_COUNTRY`, `BUSINESS_HOURS` (schema.org form), `BUSINESS_AREA_SERVED`, `GOOGLE_BUSINESS_PROFILE_URL`, `BUSINESS_SAME_AS`. The same NAP prints in the footer (`SiteIdentity`) and in the schema, so Local SEO sees one identity.

## Security additions
- **MFA for owner sign-in.** `OWNER_TOTP_SECRET` (base32; `pnpm owner:totp` prints it and the otpauth URI). RFC 6238 in `node:crypto`, ±1 step, constant-time compare; checked only after the password so a wrong password reveals nothing. The login page shows the code field when the server says MFA is on (or when a sign-in answers `needsCode`).
- **Password policy** (`shared/passwordPolicy.ts`): 10+ characters, a letter and a digit, not a common password — on registration, reset, and the owner-hash script.
- **Weekly audit** (`rcs-security-audit.yml`): `pnpm audit --audit-level=high`, typecheck, tests — Mondays and on every PR touching the app.

## Backups (`server/backups.ts`)
Daily at `BACKUP_HOUR_UTC` (04:00): every table dumped as one-statement-per-line SQL (`SHOW CREATE TABLE` + batched INSERTs; JSON columns re-serialised, binary as hex), gzip-compressed, uploaded to `BACKUP_S3_BUCKET`/`BACKUP_S3_PREFIX` with the `S3_*` credentials, or kept in `BACKUP_DIR` (`BACKUP_KEEP` copies). Runs recorded in `backup_runs`; "Back up now" on the page; `pnpm db:restore <file|s3://…>` replays a dump. `docs/RECOVERY_PLAN.md` is the runbook.

## Core Web Vitals (`server/vitals.ts`)
The browser measures LCP, CLS, INP, FCP and TTFB with `PerformanceObserver` and beacons them to `POST /api/vitals` when the page is hidden — route, metric, value, device class only. Stored in `web_vitals`; the page shows the 75th percentile overall and by route against Google's thresholds (good / needs improvement / poor).

## The page (`/portal/site-health`, administrator)
`siteHealth.report` probes the server itself (headers on `/`, `/robots.txt`, `/sitemap.xml`, a made-up path for the 404, `/assets/app.css` for caching and encoding), the database (admin count, leads in 30 days), the backup record, the vitals table, the image inventory of the build, and the environment — and grades each of the ten sections' items **pass / attention / fail / your step** with the evidence and the next action. Filters by grade; "Run again"; "Back up now"; the vitals table; the backup record. `siteHealth.site` (public) feeds the footer identity.

## Switches (host environment only; none are secrets except the S3 keys and the TOTP secret)
`CANONICAL_HOST`, `CANONICAL_REDIRECT_ALL_HOSTS`, `PUBLIC_BASE_URL`, `CSP_MODE`, `CSP_EXTRA_SRC`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `GA_MEASUREMENT_ID`, `BUSINESS_*`, `GOOGLE_BUSINESS_PROFILE_URL`, `BACKUP_DISABLED`, `BACKUP_HOUR_UTC`, `BACKUP_S3_BUCKET`, `BACKUP_S3_PREFIX`, `BACKUP_DIR`, `BACKUP_KEEP`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `OWNER_TOTP_SECRET`, `SENTRY_LOADER_URL`.

## Also in this pass
- **Phones.** The body-level "breathing" animation applied a transform and filter to `<body>`, which made every `position:fixed` element (navigation, the sticky call-to-action, the mic button) scroll away — removed; the ambient orbs still breathe. The hero shows the whole neon sign on phones (in flow, `object-contain`) with the headline as real text; `maximum-scale=1` dropped so pinch-zoom works; every image is capped at its container. Favicon set added (`favicon.svg`, `.ico`, `apple-touch-icon.png`, `site.webmanifest`).
- **Phone hero images.** A 16:9 sign cannot fill a portrait screen without cropping, so `rcs-neon-a-tall.webp` / `rcs-neon-b-tall.webp` (1080×2160) carry the whole sign and the purple city sharp at full width with the same scene continued above and below; `<picture>` serves them under 768px, the 16:9 originals elsewhere. The owner's 1.6× homepage type scale is capped for the hero copy on phones (`.rc-hero-copy`, `.rc-hero-cta`) so the copy sits under the sign.
- **The static homepage on GitHub Pages** (`docs/index.html`, built from `live/rcs-live-homepage.template.html`) had no document head at all — no doctype, charset or viewport meta — so phones laid it out at desktop width and the cover-fit sign was cropped to a third. It now carries a full head (viewport, title, description, canonical, Open Graph, favicon, Organization/WebSite JSON-LD) and the same phone hero treatment.
- **Photos on every public page.** `client/src/components/PageBackdrop.tsx` puts a full-bleed city photograph (edge to edge, `object-cover`, fading into the page colour) behind the top of `/calculators`, `/ultra-calculator`, `/fact-finder`, `/pricing`, `/support`, `/privacy` and `/terms`. The cuts come from the owner's 2560×1440 concept masters: `rcs-city-river.webp` and `rcs-city-harbor.webp` (landscape, desktop) and `rcs-city-spire.webp` / `rcs-city-towers.webp` (portrait, served under 768px through `<picture>` so a phone gets a tall picture, not a sliver). All under 400 KB; the inventory test still enforces WebP and size.
- **Every-page advisor** — see `17_EVERY_PAGE_ADVISOR.md`.

## Not done (the owner's steps)
Search Console verification and sitemap submission, GA4 property, Google Business Profile and the `BUSINESS_*` values, `CANONICAL_HOST` once the domain points at Railway, an external uptime monitor on `/healthz`, `BACKUP_S3_BUCKET` for off-site copies, a consent banner if third-party analytics is switched on, optional Cloudflare proxy for a network WAF/CDN.
