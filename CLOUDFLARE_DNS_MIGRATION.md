# Moving DNS for russellcapitalsystems.com to Cloudflare

Written 20 Sep 2026. Companion to `DOMAIN_RUNBOOK.md`.

**GoDaddy stays the registrar.** Only DNS hosting moves. Nothing about ownership,
renewal or transfer is touched.

---

## Read this before anything else

**Nothing is broken today.** `www` is live on Railway with a valid Let's Encrypt
certificate, the apex serves from GitHub Pages, and mail works. This migration
buys you a working DNS API. It is a scheduled improvement, not an incident
response. **Do it on a weekday morning with two hours free, never at 2 a.m.
under pressure.**

**If you are planning many API integrations, read §6 first** — it decides
*when* to schedule this, and it carries the one constraint that silently breaks
email at scale.

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

---

## 6. Scaling to 200–300 API integrations

Added 20 Sep 2026, after the platform target of 200–300 API connections was
stated. This section changes the recommendation from "worth doing" to "do it".

### 6.1 First, a correction that saves money

**API connections do not count toward GoDaddy's API eligibility.** The gate is
**10 or more registered domains**, or a Discount Domain Club – Premier plan. Two
hundred integrations, or two thousand, leave the 403 exactly where it is. Do not
buy API subscriptions expecting to unlock the GoDaddy Domains API — buy domains,
buy DDC Premier, or move DNS.

### 6.2 Most integrations need no DNS at all

Before planning for 300 records, triage. The overwhelming majority of API
integrations authenticate with a key over HTTPS and touch DNS **zero** times —
carrier feeds, market data, CRM reads, payment APIs, model providers, webhooks
you receive. Nothing in DNS changes for any of them.

Only four classes need records:

| Class | Records per integration | Example |
|---|---|---|
| **Email senders** | SPF include + 1–3 DKIM CNAMEs, sometimes a return-path CNAME | Resend, SendGrid, Postmark, Mailgun, Google Workspace |
| **Domain verification** | one `TXT`, often removable after verification | Google, Microsoft, Meta, Stripe |
| **Service on your subdomain** | one `CNAME` | `status.`, `docs.`, `pay.`, a hosted portal |
| **Certificate authority pinning** | `CAA`, once for the zone | — |

Realistically that is **20–40 records**, not 300. That is the number to plan
around.

### 6.3 The one that will actually bite you: the SPF 10-lookup limit

This is the sharpest constraint in the entire document, and it is the reason
"many integrations" is a DNS problem rather than a spreadsheet problem.

**RFC 7208 §4.6.4 caps SPF evaluation at 10 DNS lookups.** Every `include:`,
`a`, `mx`, `ptr`, `exists` and `redirect=` counts. `ip4:`, `ip6:` and `all` are
free. Exceed 10 and the receiver **must** return `permerror`.

What `permerror` means in practice:

- SPF is not merely "failed" — it is **structurally invalid**, and every sender
  it authorises fails, including the ones listed first.
- **DMARC fails in cascade**, because SPF alignment cannot be evaluated.
- Gmail, Outlook and Yahoo enforce it strictly. Mail is rejected or filed as spam.
- **The sending side sees no error.** Only the recipient does. This is the silent
  failure named at the top of this document, arriving by a second route.

There is a second, less famous cap: **at most 2 void lookups** — mechanisms
resolving to `NXDOMAIN` or an empty answer. A third one is also `permerror`,
even with the total under 10. A decommissioned vendor whose SPF domain stops
resolving can therefore break mail for every other sender on the record.

**Three or four senders is enough to hit the limit.** The cost is recursive:
`include:` charges you for everything nested inside the vendor's record, at any
depth. Vendors restructure their records without telling you, so a record that
cost 8 lookups last quarter can cost 11 today with nothing changed on your side.
**Never trust a published per-vendor lookup figure, including any in this
document — resolve and count the live tree.**

### 6.4 The structural answer: one sending subdomain per sender

Flattening `include:` into `ip4:` ranges buys headroom but creates a maintenance
trap: the flattened list is a snapshot, and it silently becomes wrong the moment
a vendor renumbers.

The durable fix is that **each subdomain carries its own independent 10-lookup
budget**:

| Sends from | Provider | Its own SPF |
|---|---|---|
| `russellcapitalsystems.com` | Google Workspace — staff mail only | `include:_spf.google.com` |
| `mail.russellcapitalsystems.com` | transactional (Resend/SendGrid) | that provider only |
| `news.russellcapitalsystems.com` | marketing | that provider only |
| `alerts.russellcapitalsystems.com` | platform notifications | that provider only |

This also protects the root domain's sending reputation: a marketing blast that
draws spam complaints damages `news.`, not the domain your client mail and
Railway app live on. **Adopt this pattern before the third email sender, not
after mail starts failing.** Retrofitting means re-verifying every sender.

### 6.5 Why this settles the Cloudflare question

At one or two integrations, hand-editing DNS in the GoDaddy UI is fine and the
migration is optional. At the stated scale it is not:

- **20–40 records that change** as integrations are added, rotated and retired —
  each a hand-edit in a web UI, each an opportunity to break mail silently.
- **SPF and DKIM need to be generated and verified programmatically**, not
  transcribed. A mistyped DKIM key fails closed and silently.
- **DNS-01 ACME certificates** for any subdomain you terminate TLS on require a
  working DNS API.
- **The GoDaddy gate cannot be argued with.** It is a domain count, and it is not
  going to move because the platform grew.

Cloudflare's DNS API is free, unrestricted, and does not care how many
integrations you run. Record-count limits on the free plan are far above the
20–40 needed here; the practical ceiling is operational discipline, not the
provider.

**Revised recommendation: do the migration, and do it before the integration
count climbs.** Every sender added under GoDaddy is one more to re-verify
afterward. The cheapest moment to move is now, while the record list is still
short enough to export and diff by hand.

### 6.6 Added to the pre-flight

When §1 is run, also capture and keep:

- the current SPF record **and its fully expanded recursive lookup count**;
- every DKIM selector currently published, per sender;
- the `_dmarc` policy;
- a written inventory of which integrations send mail as this domain — because
  §6.3 makes that list a hard operational limit, not documentation.

---

## 7. What this actually buys, and what it costs

**Buys:** a free, unrestricted DNS API — the two Make scenarios work again, ACME
DNS-01 certificates become possible, and scripted DNS stops being blocked by a
domain-count policy no amount of platform growth will change. At the integration
scale in §6, it also buys the ability to add a mail sender without hand-typing a
DKIM key into a web form.

**Costs:** one more vendor in the path, and a `.com` registry propagation window.

**Does not fix anything broken today.** `www`, the apex and mail all work. This
remains a scheduled improvement — but §6 changes *when* it should be scheduled.
With one or two integrations, hand-editing in the GoDaddy UI is fine and this
document is optional. At 200–300, with 20–40 DNS-bearing records and a hard
10-lookup SPF ceiling, it is not: **move before the sender count climbs**, because
every email integration added under GoDaddy is one more to re-verify afterward.

---

## 8. Out of scope

Not covered here, each needing its own decision: moving the registrar away from
GoDaddy; turning on Cloudflare proxying, WAF or caching; changing where the apex
points; retiring the GitHub Pages front door; and anything touching Railway
service configuration.
