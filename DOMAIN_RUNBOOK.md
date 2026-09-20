# russellcapitalsystems.com — domain runbook (16 Sep 2026)

## Current state (17 Sep 2026, 00:40 UTC)
| Address | State | Served by |
|---|---|---|
| https://www.russellcapitalsystems.com | **LIVE, own certificate (Let's Encrypt, issued 16 Sep 22:52 UTC), canonical** | Railway service `web` (server + client, same origin) |
| https://russellcapitalsystems.com | LIVE, valid TLS, serves the app as a fallback front door | GitHub Pages (this repo, `docs/`); `/api` calls go to the Railway origin; canonical links point at www |
| https://web-production-4b215.up.railway.app | LIVE, valid TLS | Railway service `web` (the API origin the apex front door uses) |

The GoDaddy edits landed on 16 Sep: the `www` CNAME to `tjkj8nc5.up.railway.app` (~22:00 UTC) and the
`_railway-verify.www` TXT (~22:50 UTC). Railway verified the domain and issued the certificate within
minutes. `CANONICAL_HOST=www.russellcapitalsystems.com` and `PUBLIC_BASE_URL=https://www.russellcapitalsystems.com`
are set on the service again (the apex values were a stop-gap while www was broken); once www reaches the
server it serves the app, and any request that reaches the server with the bare host 301s to www.

## The apex front door (kept as a fallback, no registrar dependency)
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

## Why www was broken for a week (Railway "validating ownership")
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

## Blocker — CORRECTED 20 Sep 2026

The 16–17 Sep entry below conflated two unrelated problems. Both are now understood.

**Resolved: the identity-verification hold.** GoDaddy was called ~16 Sep and the hold has
been cleared. **Web UI DNS edits work.** Support line, if ever needed again: 480-505-8877.

**Not resolved, and never related to the hold: the API 403.** The Domains API still returns
`{"code":"ACCESS_DENIED","message":"Authenticated user is not allowed access"}`. This was
re-tested twice on 20 Sep, after the hold was cleared, and failed both times.

The cause is a GoDaddy **account-eligibility policy**, introduced April–May 2024, not an
account problem. Per GoDaddy's own API Support team, quoted consistently across many
independent reports:

> Availability API: Limited to accounts with **50 or more domains**.
> Management and DNS APIs: Limited to accounts with **10 or more domains** and/or an
> active **Discount Domain Club – Premier** plan.

No support call fixes this. The options are: hold 10+ domains, buy DDC Premier, ask GoDaddy
to whitelist the account (they offer review "if you feel you meet these requirements"), or
move DNS to a provider with an open API — see `CLOUDFLARE_DNS_MIGRATION.md`.

**Practical effect:** DNS work is *not* blocked. It is blocked *for automation only*. Edit by
hand in the GoDaddy UI. The two Make scenarios (`rcs_dns_read_zone`, `rcs_dns_apply_records`)
will keep failing until the account clears the bar or DNS moves.

## Fallback (no GoDaddy dependency)
Buy a domain through Vercel (`russellcapitalsystems.net` preferred; `.app` is HSTS-preloaded and
hard-fails until the cert issues). Add it as a Railway custom domain, create the CNAME + TXT in
Vercel DNS, wait for `certificateStatus = ISSUED`, then add that origin to `CORS_ORIGINS` (or make it the API origin and rebuild `docs/`).

## End state (the unlock is not coming — see the corrected Blocker)
Move nameservers to Cloudflare (DNS-only). Step-by-step procedure, pre-flight checklist and
rollback: **`CLOUDFLARE_DNS_MIGRATION.md`**. Nothing is currently broken, so this is an
improvement to schedule, not an incident to fix. `www` CNAME + TXT → Railway; apex either stays on the
GitHub Pages front door or becomes a flattened CNAME → Railway with its own TXT. Export MX and
verification TXT records before changing nameservers.

## Verification (ground truth = GitHub Actions runner, not cached fetchers)
`.github/workflows/domain-probe.yml` (workflow_dispatch on `master`) — curl, certs, CORS preflight, deep link and DNS from outside. Cert is good when
`openssl s_client -servername www.russellcapitalsystems.com` shows the hostname in the SAN list.
