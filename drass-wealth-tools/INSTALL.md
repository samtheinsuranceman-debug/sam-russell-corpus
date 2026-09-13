# Drass Wealth Tools — installation

For the administrators of www.drasswealthmanagement.com.

## What this is

A standard WordPress plugin. It adds calculators to the site as shortcodes.
It does **not** modify your theme, your existing pages, or your database
schema, and it creates no tables. Deactivating it removes every tool and
leaves the site exactly as it was.

## Install (about two minutes)

1. WordPress admin → **Plugins → Add New → Upload Plugin**
2. Choose `drass-wealth-tools.zip` → **Install Now** → **Activate**
3. Go to **Settings → Drass Wealth Tools**
4. Paste the **API base URL** and **API key** supplied with this package → **Save**

The base URL ends in `/api/partner` — for example:

    https://<the-platform-host>/api/partner

You can confirm the service is reachable before doing anything else. This
endpoint needs no key and returns no client data:

    https://<the-platform-host>/api/partner/health

A healthy response looks like:

    {"ok":true,"service":"rcs-partner-api","configured":true, ...}

If `configured` is `false`, the platform side has not had its key set yet and
no calculator will work regardless of what you enter here.

Until step 4 is done, every tool renders a short "not yet connected" note
rather than a broken calculator. That is intentional.

## Placing a tool on a page

Paste the shortcode into any page or post:

    [dwt_index_history]

Optional attributes:

    [dwt_index_history index="SP500" cap="9.5" floor="0" participation="100" years="30"]

The full list of available shortcodes is on the settings screen.

## Requirements

- WordPress 6.0 or newer
- PHP 7.4 or newer
- Outbound HTTPS from the web server (the plugin calls the calculation API
  server-side; nothing is called from the visitor's browser)

## Security notes

- The API key is stored in the WordPress options table and sent only from
  your server. It is never written into a page and never reaches a visitor.
- The plugin registers no public write endpoints and accepts no file uploads.
- All output is escaped; all shortcode attributes are sanitised.
- Every file exits immediately if loaded outside WordPress.

## Compliance note — please read before publishing

The index-history tool is **educational content**, not a policy illustration.
It is built to the NAIC AG 49-A amendment adopted 21 November 2025 (binding on
policies sold on or after 1 April 2026). Two constraints are enforced in code
and should not be worked around in page layout:

1. **Do not place this tool on the same page as a projection of any specific
   client's policy values.** A side-by-side comparison of historical index data
   and illustrated policy values is prohibited under that amendment.
2. **Do not describe the output as a projection or an illustration.** It shows
   what would have been credited historically. It forecasts nothing.

Before publishing any calculator on a public advisory site, have it reviewed
by whoever handles the firm's advertising compliance. That review is the
firm's, not ours.

## Support

Questions on the plugin or the API go to Russell Holdings Management LLC.

## Intellectual property: what this site may and may not say

The `[dwt_catalog]` shortcode prints one sentence about the legal status of
the planning engines. That sentence arrives from the platform with every
response and is printed verbatim. It is not composed here and must not be
edited here.

**Do not write "patent pending" anywhere on this site** — not in page copy, a
banner, an image, a meta description, or a sales deck built from these pages.

Describing an invention as patented or patent-applied-for when no application
is on file is false marking under 35 U.S.C. § 292. Since the America Invents
Act, a competitor who suffers a competitive injury from it can sue for
damages. The status of this portfolio is not something this site can observe,
which is exactly why the sentence is delivered rather than described: on the
day an application is actually filed, the platform's answer changes and every
page using the shortcode changes with it, with nothing edited in WordPress.

If a page needs to describe the technology, "proprietary" is accurate today
and carries no exposure.

The patent application documents themselves are attorney-client work product.
They are not in this plugin, are not served by the API, and must not be
published, attached to a proposal, or forwarded outside the firm.


## The calculators

Version 1.1 adds three planning tools. On activation the plugin creates one
**draft** page for each, already holding its shortcode. Nothing is published —
find them under **Pages**, write your own copy around the shortcode, and
publish when you are ready. Reactivating the plugin does not duplicate them.

| Shortcode | Page it creates | What it answers |
|---|---|---|
| `[dwt_monte_carlo]` | Will Your Money Last? | The chance a portfolio survives a retirement, across a thousand modelled runs |
| `[dwt_tax]` | What Will You Actually Pay? | Federal and state income tax, with the bracket breakdown |
| `[dwt_estate_tax]` | What Reaches Your Heirs? | Federal estate tax and what is left for the heirs |

All three take a heading attribute, e.g. `[dwt_tax heading="Your tax, honestly"]`.

### What these tools do not keep

Nothing a visitor types is stored. There is no lead record, no cookie holding
the figures, and no log line containing them. The browser posts to WordPress,
WordPress asks the platform, the answer comes back, and that is the end of it.
Please do not add analytics that captures the field values — what somebody
types into an estate calculator is their business, and the tools were built so
that there is nothing to leak.

### The sentence under each result

Every answer arrives with a short sentence explaining what the number is and
is not — that a Monte Carlo is a distribution rather than a forecast, that the
estate figure is federal only and several states levy their own. It is
rendered under the result automatically. **Do not remove it.** It is the
difference between an estimate and a promise, and the promise is one no firm
should be making from a web form.

### What is deliberately not here

The HELOC-to-IUL arbitrage engine and the lifetime-income engine are not
exposed, and their absence is a decision rather than an oversight. Both need a
full fact finder rather than a web form — one of them takes twenty-seven
inputs — and both display indexed crediting and policy-loan arithmetic, which
is the material Actuarial Guideline 49-A governs. Those belong in an advisor
conversation, not on a public page. If you want them, that is a conversation
to have with Russell Capital Systems and your compliance officer, not a
setting to switch on.
