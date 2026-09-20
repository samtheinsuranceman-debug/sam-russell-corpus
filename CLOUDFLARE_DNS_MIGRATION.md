# Moving DNS for russellcapitalsystems.com to Cloudflare

Written 20 Sep 2026. Companion to `DOMAIN_RUNBOOK.md`.

**GoDaddy stays the registrar.** Only DNS hosting moves. Nothing about ownership,
renewal or transfer is touched.

---

## Read this before anything else

**Nothing is broken today.** `www` is live on Railway with a valid Let's Encrypt
certificate, the apex serves from GitHub Pages, and mail works. This migration
buys you a working DNS API — nothing more. It is a scheduled improvement, not an
incident response. **Do it on a weekday morning with two hours free, never at
2 a.m. under pressure.**

**The one irreversible failure is email.** A missed `MX`, `SPF` or `DKIM` record
does not throw an error. Mail simply stops arriving, or starts failing DMARC at
the recipient, and anything that bounces in that window is gone. Every other
failure here is visible and recoverable within minutes.

**The plan's weakest point is knowing what records exist.** Nobody has an
authoritative list. §1 exists to produce one, and **the migration must not start
until it does.**

---

## 1. Pre-flight — produce the authoritative record list

### 1.1 Export the zone from GoDaddy

GoDaddy → Domain Portfolio → `russellcapitalsystems.com` → DNS → **Export /
Download Zone File**.

Save it. This file is the single source of truth for everything that follows.
If the export button is unavailable, screenshot every page of the record list
instead and transcribe it — but do not proceed on memory or on the table in
`DOMAIN_RUNBOOK.md`, which is a partial hand-written snapshot, not an export.

### 1.2 Capture what the world currently sees

Run from your own machine, not from an agent session:

```bash
for t in NS SOA A AAAA MX TXT CAA; do
  echo "== $t =="; dig +noall +answer "russellcapitalsystems.com" "$t"
done
dig +noall +answer www.russellcapitalsystems.com CNAME
dig +noall +answer _railway-verify.www.russellcapitalsystems.com TXT
dig +noall +answer _dmarc.russellcapitalsystems.com TXT
# Google Workspace DKIM — selector is usually "google"
dig +noall +answer google._domainkey.russellcapitalsystems.com TXT
```

Save the output beside the zone export. This is your "before" picture and your
rollback reference.

### 1.3 Records already known to matter

From `DOMAIN_RUNBOOK.md`. **Treat this as a checklist to confirm against the
export, not as the list itself.**

| Type | Name | Value | Serves |
|---|---|---|---|
| A | `@` | `185.199.108.153` | GitHub Pages |
| A | `@` | `185.199.109.153` | GitHub Pages |
| A | `@` | `185.199.110.153` | GitHub Pages |
| A | `@` | `185.199.111.153` | GitHub Pages |
| CNAME | `www` | `tjkj8nc5.up.railway.app` | Railway — the live app |
| TXT | `_railway-verify.www` | `railway-verify=0a5bab2bf8fa8e99e18e602dc31e7f14a5fc8273f398a0975a8260be9ecb2e3a` | Railway domain ownership |
| MX | `@` | Google Workspace | **Email — the one that must not break** |
| CNAME | `pay` | (per export) | Payments |
| CNAME | `_domainconnect` | (per export) | GoDaddy Domain Connect |

Anything in the export not on this table is a record nobody documented. It still
has to move. Common ones to look for: `TXT` SPF (`v=spf1 …`), `TXT`
`_dmarc`, `TXT` `google._domainkey`, domain-verification `TXT` for Google,
Microsoft, Stripe or Meta, and any subdomain A/CNAME.

### 1.4 Lower the TTLs — do this first, then wait

In GoDaddy, set **every** record's TTL to **600 seconds**. Then wait **at least
as long as the longest old TTL** (commonly 1 hour, sometimes 24) before §3.

This is the step that makes rollback fast. Skipping it is the difference between
a five-minute recovery and a day-long one.

---

## 2. Build the zone at Cloudflare — changes nothing live

Adding a site to Cloudflare does **not** affect your domain until the
nameservers change. Everything in this section is safe.

1. Cloudflare → Add a site → `russellcapitalsystems.com` → **Free** plan.
2. Cloudflare scans and pre-fills records. **Its scan is best-effort and misses
   records routinely.** Treat the result as a draft.
3. **Diff the draft against your §1.1 export, line by line.** Every record in the
   export must be present, with matching type, name, value, priority and TTL. Add
   what is missing by hand.
4. **Set the proxy status correctly.** This is the most common way to break the
   site on cutover:

   | Record | Proxy | Why |
   |---|---|---|
   | apex `A` → GitHub Pages | **DNS only (grey cloud)** | Proxying breaks Pages certificate issuance |
   | `www` CNAME → Railway | **DNS only (grey cloud)** | Railway terminates its own TLS; proxying breaks its cert renewal |
   | All `TXT`, `MX` | n/a | Never proxied |
   | Everything else | **DNS only** to start | Turn proxying on later, deliberately, one record at a time |

   Your runbook already specifies "Cloudflare (DNS-only)". Keep it that way
   through cutover.
5. Cloudflare shows you two assigned nameservers, e.g.
   `xxx.ns.cloudflare.com` / `yyy.ns.cloudflare.com`. **Write them down. Do not
   change anything at GoDaddy yet.**

### 2.1 Verify before you commit — the step that de-risks everything

Query Cloudflare's nameservers **directly**, by name, while the domain is still
live on GoDaddy. This proves the new zone answers correctly before anyone is
pointed at it.

```bash
CF_NS=xxx.ns.cloudflare.com        # substitute your assigned nameserver

for t in A MX TXT CAA; do
  echo "== $t =="; dig @"$CF_NS" +noall +answer russellcapitalsystems.com "$t"
done
dig @"$CF_NS" +noall +answer www.russellcapitalsystems.com CNAME
dig @"$CF_NS" +noall +answer _railway-verify.www.russellcapitalsystems.com TXT
dig @"$CF_NS" +noall +answer _dmarc.russellcapitalsystems.com TXT
dig @"$CF_NS" +noall +answer google._domainkey.russellcapitalsystems.com TXT
```

**Compare every line against the §1.2 output. They must match.** If anything
differs or is missing, fix it in Cloudflare and re-run. Do not proceed on a
partial match — this is the last checkpoint where a mistake costs nothing.

---

## 3. Cutover

GoDaddy → Domain Portfolio → `russellcapitalsystems.com` → **Nameservers** →
Change → **I'll use my own nameservers** → enter both Cloudflare nameservers →
Save.

That is the entire change. Propagation is governed by the `.com` registry TTL —
typically **24–48 hours** — during which resolvers may see either nameserver set.
Because both zones are identical (that is what §2.1 proved), this window is
harmless.

---

## 4. Watch, in this order

**Email first.** It is the one that fails silently.

```bash
dig +noall +answer russellcapitalsystems.com MX
dig +noall +answer russellcapitalsystems.com TXT     # SPF must still be there
```

Then send a real message from an outside account to a real mailbox on the domain
and confirm it arrives. **Do this within the first hour, and again the next
morning.** Do not rely on `dig` alone.

**Then the app.**

```bash
curl -sSI https://www.russellcapitalsystems.com | head -5   # expect 200
curl -sSI https://russellcapitalsystems.com     | head -5   # expect 200 or 301
```

**Then the certificates.** Railway → the custom domain row should stay
"Active"/issued, not drop to "validating". GitHub Pages → Settings → Pages
should still show the custom domain with HTTPS enforced. Both re-validate
through DNS, so a missing `_railway-verify.www` TXT surfaces here rather than
immediately.

**Leave TTLs at 600 for a week.** Raise them once everything is stable.

---

## 5. Rollback

Set the nameservers at GoDaddy back to GoDaddy's own defaults. The original zone
is still there — moving nameservers away does not delete it.

Recovery is bounded by the TTLs you lowered in §1.4, which is why that step is
not optional. Keep the §1.1 export and the §1.2 `dig` output until you have been
stable for a week; together they let you rebuild the zone by hand from nothing.

---

## 6. What this actually buys, and what it costs

**Buys:** a free, unrestricted DNS API — so the two Make scenarios work again,
ACME DNS-01 certificates become possible, and scripted DNS stops being blocked by
a domain-count policy you cannot influence.

**Costs:** one more vendor in the path, and a `.com` registry propagation window.

**Does not buy:** anything the site needs today. If you do not need scripted DNS,
the zero-risk alternative is to retire the two Make scenarios and edit DNS by
hand in the GoDaddy UI, which works now that the identity hold is cleared.

---

## 7. Out of scope

Not covered here, each needing its own decision: moving the registrar away from
GoDaddy; turning on Cloudflare proxying, WAF or caching; changing where the apex
points; retiring the GitHub Pages front door; and anything touching Railway
service configuration.
