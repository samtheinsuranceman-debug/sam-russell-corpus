# DNS + mail records for russellcapitalsystems.com (applied 2026-09-06)

Authoritative DNS is at GoDaddy (`ns43/ns44.domaincontrol.com`). DNS is now
written **through Make.com**, never through GoDaddy's panel: the Make team
"My Team" holds a GoDaddy connection (`GoDaddy — russellcapitalsystems.com`,
API key + secret, created once by the owner) and two scenarios:

| Scenario | What it does |
|---|---|
| `RCS DNS — read zone (russellcapitalsystems.com)` | lists every record and writes them to the data store `RCS DNS zone snapshot` as `TYPE\|name\|data` keys |
| `RCS DNS — apply records (russellcapitalsystems.com)` | raw GoDaddy v1 API calls (DELETE / PUT / PATCH) for the change set below; stores `apply\|<codes>` on success |

Edit the apply scenario's blueprint for the next change set and run it. The
GoDaddy DNS API is open to any account with one registered domain (policy
relaxed April 2026).

## The zone as it stands

| Host | Type | Value | Purpose |
|---|---|---|---|
| `@` | A ×4 | 185.199.108–111.153 | GitHub Pages (apex) |
| `www` | **CNAME** | `samtheinsuranceman-debug.github.io` | GitHub Pages (was 4 A records; replaced 2026-09-06) |
| `@` | MX ×5 | Google (`aspmx.l.google.com` …) | inbound mail |
| `@` | TXT | `v=spf1 include:dc-aa8e722993._spfm.russellcapitalsystems.com ~all` | SPF (Google, via GoDaddy's flattening host) |
| `dc-aa8e722993._spfm` | TXT | `v=spf1 include:_spf.google.com ~all` | SPF include target |
| `_dmarc` | TXT | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=…` | DMARC |
| `resend._domainkey` | **TXT** | `p=MIGf…AQAB` (Resend key) | **DKIM (added 2026-09-06)** |
| `send` | **MX 10** | `feedback-smtp.us-east-1.amazonses.com` | Resend return-path (added) |
| `send` | **TXT** | `v=spf1 include:amazonses.com ~all` | Resend return-path SPF (added) |
| `pay` | CNAME | `paylinks.commerce.godaddy.com` | GoDaddy pay links (pre-existing) |
| `_domainconnect` | CNAME | `_domainconnect.gd.domaincontrol.com` | GoDaddy Domain Connect (pre-existing) |
| `@` | TXT | Google site/recovery verifications, `2048` | pre-existing |

Verified after the change from public DNS: `www` resolves to the CNAME, the DKIM
key, `send` MX and `send` TXT all resolve, and `pnpm mail:check
russellcapitalsystems.com` reports MX ✔ SPF ✔ DKIM ✔ DMARC ✔.

## Resend

Domain `russellcapitalsystems.com` (id `4d58f44c-1349-4b02-aa3e-95e88ebd72b1`,
us-east-1) was added and verification triggered once the records resolved.
When it shows *verified*, set `RESEND_API_KEY` and `MAIL_FROM` (an address on
this domain) on the host and marketing + transactional mail goes out signed.

## GitHub Pages

`www` now points at GitHub by CNAME, which is what Pages asks for; the
`InvalidARecordError` warning on the custom-domain panel clears on its next
DNS check.
