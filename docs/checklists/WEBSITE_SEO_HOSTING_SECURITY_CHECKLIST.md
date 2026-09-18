# Website SEO, Hosting & Security Checklist

Transcribed from the three phone screenshots Sam sent on 2026-09-06 (the
"Website SEO, Hosting & Security…" note). The underlying principles apply to
every site; the live, self-checking version for Russell Capital Systems is
`/portal/site-health` (administrator), backed by `server/siteHealthRouter.ts`.
Each item below names where the platform answers it.

## 1. Hosting & Infrastructure
- [x] Reliable hosting with 99.9%+ uptime — Railway; `/healthz` for an external monitor
- [x] Adequate storage, bandwidth, and server resources — Railway metrics (manual watch)
- [x] Current server/PHP/database software — Node 22, MySQL 8; weekly dependency audit
- [x] Automatic daily website and database backups — `server/backups.ts`, 04:00 UTC
- [x] Off-site backup storage and recovery plan — `BACKUP_S3_BUCKET`; `docs/RECOVERY_PLAN.md`
- [x] Proper domain and DNS configuration — `CANONICAL_HOST`, `PUBLIC_BASE_URL`; `docs/grok-handoff/09_DNS_AND_MAIL_RECORDS.md`
- [ ] CDN for improved speed and reliability, if appropriate — optional Cloudflare proxy (owner)

## 2. Website Security
- [x] SSL/TLS certificate installed — Railway-issued
- [x] HTTPS enforced across the entire website — http → https 301 + HSTS (`siteHardening.ts`)
- [x] Automatic SSL certificate renewal — Railway
- [~] Web Application Firewall (WAF) — app-level limits + CSP; network WAF via Cloudflare (owner)
- [~] Malware and security monitoring — persisted error log; Sentry when `SENTRY_LOADER_URL` is set
- [x] Strong administrator passwords — bcrypt hash only; 10+ chars with letter and digit everywhere
- [x] Multi-factor authentication (MFA/2FA) — `OWNER_TOTP_SECRET` (`pnpm owner:totp`)
- [x] Limited administrator permissions — server-checked `admin` role; count shown on the page
- [x] Secure SFTP/SSH access — none exists; deploys only from the GitHub branch
- [x] VPN or IP-restricted access for server administration — Railway dashboard behind the account's 2FA
- [x] Regular CMS, theme, and plugin updates — `.github/workflows/rcs-security-audit.yml`

## 3. Technical SEO
- [x] XML sitemap created and submitted — `/sitemap.xml` (submit in Search Console)
- [x] Robots.txt properly configured — `/robots.txt`
- [ ] Google Search Console configured — `GOOGLE_SITE_VERIFICATION` (owner)
- [x] Clean, descriptive URLs
- [x] HTTPS/www/non-www versions properly redirected — `CANONICAL_HOST`
- [x] Canonical tags configured — server-rendered per route
- [x] 301 redirects for changed URLs — host/protocol 301s; add path redirects in `siteHardening.ts`
- [x] Broken links and 404 errors regularly checked — real 404 status; link check on the page
- [x] Structured data/schema implemented where appropriate — Organization/FinancialService, WebSite, WebPage, BreadcrumbList

## 4. On-Page SEO
- [ ] Keyword research completed — quarterly against Search Console (owner)
- [x] Unique SEO title for each important page — `shared/seo.ts`
- [x] Unique meta descriptions — `shared/seo.ts`
- [x] One clear H1 with logical H2/H3 headings — test-enforced
- [x] Relevant keywords used naturally
- [~] Useful, original, regularly updated content — engines refresh from live data; monthly article recommended
- [x] Strong internal linking between related pages — nav, footer, Sphere, breadcrumbs
- [x] Clear calls to action

## 5. Images & Media
- [x] Images compressed for faster loading — every raster ≤ 400 KB (test-enforced)
- [x] Descriptive image filenames
- [x] ALT text added for accessibility and SEO — test-enforced
- [x] WebP/AVIF formats used where appropriate — WebP only (icons excepted)
- [x] Lazy loading enabled — below the fold; hero preloaded
- [x] Oversized images and videos avoided

## 6. Speed & Mobile Performance
- [x] Fully responsive/mobile-friendly design — whole hero sign on phones; pinch-zoom allowed
- [x] Fast page-loading speeds — gzip, code splitting, immutable hashed assets
- [x] Browser and server caching enabled — cache policy per asset class
- [x] CSS/JavaScript optimized
- [x] Unnecessary scripts and plugins removed — third-party scripts load only when keyed
- [x] Core Web Vitals monitored — `/api/vitals` beacons, p75 by route on the page
- [~] Website tested regularly on desktop, tablet, and mobile — Playwright harness per release

## 7. Local SEO
- [ ] Google Business Profile optimized — `GOOGLE_BUSINESS_PROFILE_URL` (owner)
- [~] Business name, address, and phone information consistent — `BUSINESS_*` variables → footer + schema
- [~] Business hours maintained — `BUSINESS_HOURS`
- [ ] Customer reviews encouraged and monitored — owner, via the profile
- [~] Local keywords incorporated where appropriate — `BUSINESS_AREA_SERVED`
- [ ] Location/service-area pages optimized — add to `shared/seo.ts` when needed

## 8. Analytics & Monitoring
- [~] Google Analytics configured — `GA_MEASUREMENT_ID`
- [ ] Google Search Console monitored — owner, monthly
- [~] Organic traffic tracked — GA4 acquisition
- [ ] Search rankings and impressions monitored — Search Console → Performance
- [x] Leads, sales, calls, and other conversions tracked — `public_leads` + ledger events
- [ ] Monthly SEO/performance review completed — `/portal/site-health` on the first of the month

## 9. Privacy & Accessibility
- [x] Privacy Policy maintained — `/privacy`
- [~] Cookie/consent requirements addressed — first-party httpOnly cookie only; banner needed once third-party analytics is on
- [x] Contact forms secured — HTTPS, server validation, CSP form-action
- [x] Personal/customer data protected — signed cookies, bcrypt, server roles, backups
- [x] Accessibility standards reviewed — skip link, focus rings, aria labels, zoom allowed
- [x] Keyboard navigation, contrast, headings, links, and ALT text checked

## 10. Ongoing Maintenance
- [ ] Website uptime monitored — external monitor on `/healthz` (owner)
- [x] Security scans performed — weekly GitHub audit
- [~] Backups verified — daily run recorded; quarterly restore drill
- [x] CMS/plugins/themes updated
- [x] Broken links checked
- [ ] SEO rankings and traffic reviewed — monthly (owner)
- [x] Page speed monitored
- [ ] Content periodically updated — monthly (owner)
- [ ] Quarterly SEO/security audit — screenshot `/portal/site-health`
- [ ] Annual hosting and website performance review

Legend: `[x]` done in code and verified · `[~]` done in code, needs the owner's value or a routine · `[ ]` the owner's step outside the code.
