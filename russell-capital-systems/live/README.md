# Live homepage (published)

**Live URL:** https://claude.ai/code/artifact/da0f1702-4b60-4091-8643-344b898b1555

A self-contained, single-file version of the Russell Capital Systems public
homepage, published as a live web page. It carries the full homepage — neon
hero, AI concierge, senior-partner retention band, Tax & Savings Estimate
(lead capture), the War-Chest / Tax Strategy / About / Physicians chapters,
the 14-engine patent-pending technology showcase, slogans, and booking.

- `rcs-live-homepage.html` — the published file (background images embedded as data URIs).
- `rcs-live-homepage.template.html` — the source template; `__IMG_*__`,
  `__CALENDLY__`, and `__ADVISOR_EMAIL__` placeholders are injected at build time.

How it works without a server:
- **AI concierge** uses the viewer's own Claude (the page's `sample` capability)
  for signed-in claude.ai viewers; for anyone else it falls back to sending the
  question to the advisor by email.
- **Lead capture** composes a pre-filled email to the advisor (nothing leaves the
  page until the visitor sends it) and links to Calendly booking.
- No secrets are embedded. Figures are never shown to visitors (teaser only).

This is the live preview/landing page. The full app (portal, lead inbox, nine-AI
panel, database) still deploys per `../LAUNCH.md`.
