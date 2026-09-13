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
