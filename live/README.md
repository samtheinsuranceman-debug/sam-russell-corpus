# Live homepage (published)

**Live URL:** https://claude.ai/code/artifact/da0f1702-4b60-4091-8643-344b898b1555

A self-contained, single-file version of the Russell Capital Systems public
homepage, published as a live web page and kept identical in content to the
React app's homepage (`client/src/pages/Landing.tsx`).

## The page, screen by screen

Every one of the owner's six design images is shown **crisp, full-size, one per
screen** — nothing is blurred.

1. **Neon sign (hero)** — its words are the headline: *Financial & Tax Relief and
   Recovery for Physicians, Psychiatrists, & Surgeons*
2. **The Green City (Emerald Dawn)** — *Transform Debt Into a Tax-Free Liquid War
   Chest — On Demand™* with the line "You bring the goal. We build the tailored
   Systems around that."
3. **The bridge (Concept 10)** — *Your Practice Builds Income. We Build the System
   Around It.* + the five pillars
4. **The canyon (Concept 06)** — Tax Strategy for High-Earning Physicians + the
   tax-planning selector
5. **The interchange (Concept 25)** — Russell Capital Systems for Physicians /
   Turn Medical Income Into Lasting Wealth™ + the design-your-system selector
6. **Second neon sign** — the 60% / 20-year client-retention proof
7. Ask AI concierge · Tax & Savings Estimate (lead capture) · **the 14 engines**
   (five to six sentences each, in building order) · How We Work / Who We Serve /
   Planning Areas / FAQ · neon closing with booking

## Files

- `rcs-live-homepage.template.html` — **the source.** Placeholders injected at
  build time: `__IMG_NEON_A__`, `__IMG_NEON_B__`, `__IMG_EMERALD__`, `__IMG_BRIDGE__`,
  `__IMG_CANYON__`, `__IMG_INTERCHANGE__`, `__CALENDLY__`, `__ADVISOR_EMAIL__`.
- `build_live_homepage.py` — builds the template into the **single built copy**,
  `<repo>/docs/index.html` (~3.8 MB, six images embedded as WebP data URIs).
  `docs/` is what GitHub Pages serves, so merging to `master` updates the public
  URL. Run it directly or via `pnpm live:build` / `pnpm release`.
- The image sources live in `../client/public/` as `rcs-neon-a.webp`, `rcs-neon-b.webp`,
  `rcs-city-emerald.webp`, `rcs-city-bridge.webp`, `rcs-city-canyon.webp`,
  `rcs-city-interchange.webp` — crisp crops of the photographic regions of the
  original mockups (their baked-in UI excluded), saved at high quality.

## Keeping it in step with the React app

`server/livePageParity.test.ts` fails if the template and the React homepage
disagree on the 14 engines (names and order), the FAQ, the headline promises and
proof numbers, the six images, or if `docs/index.html` is stale relative to the
template. Edit the template and the React component together, then `pnpm release`.

## How it works without a server

- **AI concierge** uses the viewer's own Claude (the page's `sample` capability)
  for signed-in claude.ai viewers; for anyone else it falls back to sending the
  question to the advisor by email. It never reveals figures or formulas.
- **Lead capture** composes a pre-filled email to the advisor (nothing leaves the
  page until the visitor sends it), offers "Copy my summary", and links to
  Calendly booking.
- No secrets are embedded. No figures are shown to visitors (qualitative teaser only).

This is the live landing page. The full app (portal, lead inbox, nine-AI panel,
database) deploys per `../LAUNCH.md`.
