# russellcapitalsystems.com — domain runbook (16 Sep 2026)

## Current state
| Address | State | Served by |
|---|---|---|
| https://russellcapitalsystems.com | LIVE, valid TLS, **the app itself** | GitHub Pages (this repo, `docs/`, static client build); API calls go to the Railway origin |
| https://www.russellcapitalsystems.com | BROKEN (TLS mismatch) — CNAME fixed 16 Sep ~22:00 UTC, TXT still missing | GoDaddy CNAME → `tjkj8nc5` (correct); Railway shows VALIDATING_OWNERSHIP until the TXT below exists |
| https://web-production-4b215.up.railway.app | LIVE, valid TLS | Railway service `web` (server + client, same origin) |

## How the front door works (no registrar dependency)
The apex `A` records already pointed at GitHub Pages with a valid Let's Encrypt certificate, so the
app is published there instead of a redirect:

- `docs/` is the client build from `russell-capital-systems/scripts/build.mjs`, built with
  `VITE_API_ORIGIN=https://web-production-4b215.up.railway.app NODE_ENV=production`.
  Every `/api/...` call (tRPC, auth, events, exports) goes to that origin with credentials
  (`client/src/lib/api.ts`: `apiUrl`, `eventsUrl`, `apiFetch`).
- The server (`server/_core/crossSite.ts`, registered first in `server/_core/index.ts`) answers
  credentialed CORS for `https://russellcapitalsystems.com` and `https://www.russellcapitalsystems.com`
  (+ `CORS_ORIGINS`), refuses state-changing requests from any other origin (403), and bridges the
  session for browsers that block third-party cookies: cookies set cross-site become
  `SameSite=None; Secure` and are mirrored into `X-Set-Session`; the client stores them
  (`localStorage` key `rcs.session.v1`) and sends `X-Session` (or `_session` on the EventSource URL).
- `docs/404.html` is the app shell and every static route also has its own `<route>/index.html`,
  so deep links answer 200 from Pages. `robots.txt` and `sitemap.xml` name the apex.
- Rebuild + republish: run the build above, copy `dist/public/*` into `docs/` (keep `CNAME`,
  `mirror/`), regenerate the per-route folders from `dist/public/routes.json`, push to `master`;
  `.github/workflows/pages.yml` publishes.

OAuth callbacks are served by the API origin (`const.ts` builds `redirectUri` from `VITE_API_ORIGIN`),
so any provider console must list `https://web-production-4b215.up.railway.app/api/oauth/callback`.

## Why www is still broken (Railway "validating ownership")
Railway requires **two** DNS records per custom domain: the CNAME **and** a TXT ownership
record (`status.verificationToken` in the API; shown behind the pencil icon in the dashboard).
Only the CNAME was ever created. Source: https://docs.railway.com/integrations/api/manage-domains#dns-configuration

## Records GoDaddy must hold for www (both required)
| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `tjkj8nc5.up.railway.app` | 600 |
| TXT | `_railway-verify.www` | `railway-verify=0a5bab2bf8fa8e99e18e602dc31e7f14a5fc8273f398a0975a8260be9ecb2e3a` | 600 |

Railway custom domain id: `7f74d3e7-8625-442b-84b6-06604f76d077` (project `a16ef4bb-3aea-4147-a751-20661ae76eb8`).
If Railway ever re-creates the domain row, BOTH values change; re-read them with
`.github/workflows/railway-domain-query.yml` before touching DNS.

Do NOT change: apex `A` 185.199.108/109/110/111.153 (GitHub Pages), MX (Google), `pay` CNAME, `_domainconnect` CNAME.

## Blocker
GoDaddy account is on an identity-verification hold. Web UI edits blocked; API returns
403 "Authenticated user is not allowed access". GoDaddy support: 480-505-8877.
Ask: "identity verification pending >48h, unlock DNS edits on russellcapitalsystems.com."

## Fallback (no GoDaddy dependency)
Buy a domain through Vercel (`russellcapitalsystems.net` preferred; `.app` is HSTS-preloaded and
hard-fails until the cert issues). Add it as a Railway custom domain, create the CNAME + TXT in
Vercel DNS, wait for `certificateStatus = ISSUED`, then add that origin to `CORS_ORIGINS` (or make it the API origin and rebuild `docs/`).

## End state after GoDaddy unlocks
Move nameservers to Cloudflare (DNS-only). `www` CNAME + TXT → Railway; apex either stays on the
GitHub Pages front door or becomes a flattened CNAME → Railway with its own TXT. Export MX and
verification TXT records before changing nameservers.

## Verification (ground truth = GitHub Actions runner, not cached fetchers)
`.github/workflows/domain-probe.yml` (workflow_dispatch on `master`) — curl, certs, CORS preflight, deep link and DNS from outside. Cert is good when
`openssl s_client -servername www.russellcapitalsystems.com` shows the hostname in the SAN list.
