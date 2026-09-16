# russellcapitalsystems.com — domain runbook (16 Sep 2026)

## Current state
| Address | State | Served by |
|---|---|---|
| https://russellcapitalsystems.com | LIVE, valid TLS | GitHub Pages (this repo, `docs/`) → redirect to the Railway app |
| https://www.russellcapitalsystems.com | BROKEN (TLS mismatch) | GoDaddy CNAME → Railway edge, no certificate |
| https://web-production-4b215.up.railway.app | LIVE, valid TLS | Railway service `web` (the app) |

## Root cause of the week-long "validating ownership" stall
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
Vercel DNS, wait for `certificateStatus = ISSUED`, then point the `docs/index.html` redirect at it.

## End state after GoDaddy unlocks
Move nameservers to Cloudflare (DNS-only). `www` CNAME + TXT → Railway; apex either stays on the
GitHub Pages redirect or becomes a flattened CNAME → Railway with its own TXT. Export MX and
verification TXT records before changing nameservers.

## Verification (ground truth = GitHub Actions runner, not cached fetchers)
`.github/workflows/probe.yml` — curl + DNS from outside. Cert is good when
`openssl s_client -servername www.russellcapitalsystems.com` shows the hostname in the SAN list.
