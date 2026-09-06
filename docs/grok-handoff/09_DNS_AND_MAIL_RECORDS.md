# DNS + mail records for russellcapitalsystems.com (state on 2026-09-06)

Authoritative DNS is at GoDaddy (`ns43/ns44.domaincontrol.com`). Nothing connected
to the build session can *write* GoDaddy DNS today; this file is the exact record
set so whoever gets write access applies it once and never guesses.

## What is already correct (verified from outside)

| Host | Type | Value | Result |
|---|---|---|---|
| `@` | A ×4 | 185.199.108–111.153 | `https://russellcapitalsystems.com/` → 200, GitHub Pages, HTTPS enforced |
| `www` | A ×4 | 185.199.108–111.153 | `https://www.russellcapitalsystems.com/` → 200, redirects to apex |
| `@` | MX | Google | mail receives |
| `@` | TXT | SPF (Google) | passes `pnpm mail:check` |
| `_dmarc` | TXT | `p=quarantine` | passes `pnpm mail:check` |

The site works on both hosts. The remaining items are a cosmetic GitHub warning and
mail deliverability.

## Records to add / change

| # | Host | Type | Value | Why |
|---|---|---|---|---|
| 1 | `www` | **CNAME** (replace the 4 A records) | `samtheinsuranceman-debug.github.io` | clears GitHub's `InvalidARecordError` warning on the custom domain |
| 2 | `resend._domainkey` | TXT | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+ano7QMpNpZRbwElndAaI7D6KmJAkYOfZyCLP2TTBXdP2pFHVjPV2OQsEtKTVgtR/X9rlz9+fTWs3DMz1bjgQUJpUF+L4fSnOiXigTyLM0WVAaeDHOr2/kU42T2On8D2YxRUF6bKjBmSZWAOyWm9XnaxjN9bM7F3gGpMNZewMyQIDAQAB` | DKIM — the missing piece behind mail landing in spam |
| 3 | `send` | MX priority 10 | `feedback-smtp.us-east-1.amazonses.com` | Resend return-path (bounces) |
| 4 | `send` | TXT | `v=spf1 include:amazonses.com ~all` | SPF for the return-path subdomain |

Records 2–4 came from adding `russellcapitalsystems.com` to the Resend account
(domain id `4d58f44c-1349-4b02-aa3e-95e88ebd72b1`, region us-east-1, status
`not_started`). Once they resolve, run Resend → verify domain, then
`pnpm mail:check russellcapitalsystems.com` should show DKIM ✔.

Leave the existing apex SPF, MX and DMARC alone — they are correct.

## How to apply them without opening GoDaddy's DNS panel

Make.com has a native **GoDaddy** app (modules: Search DNS Records, Update DNS
Records, Delete DNS Records, Get/Update a Domain, Make an API Call). It needs one
GoDaddy **API key + secret** (a Make "basic" connection). That key is the single
thing only the account holder can create, at `developer.godaddy.com` → API Keys →
Production.

A credential request is already waiting in Make so the key never passes through
chat or code:

`https://us2.make.com/2886173/credentials-requests/inbox?requestId=aa0d7760-5695-4c21-9126-b91a7016b756`

After the connection exists, a one-shot scenario applies rows 1–4 with the
GoDaddy modules (`updateADNSRecords` for `www` CNAME and the two `send` records,
`updateADNSRecords` for the `resend._domainkey` TXT) and every future DNS change
runs the same way. Alternatives that avoid GoDaddy entirely do not exist: moving
DNS to Cloudflare still requires a nameserver change at the registrar.

## What was tried and cannot write GoDaddy DNS

- GoDaddy MCP connector: availability/suggest only.
- Zapier: no GoDaddy DNS app (only a "GoDaddy CRM" app).
- Cloudflare: token lacks `Zone:Create`; and NS change would still be at GoDaddy.
- Direct API from the build session: `api.godaddy.com` is blocked by the proxy.
- Perplexity Computer, Vercel, Netlify: no GoDaddy DNS access.
