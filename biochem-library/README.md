# BioChem Atlas — Global Biochemistry Research Library

A self-contained website (`index.html`, no build, no dependencies) that catalogs
the world's biochemistry research institutions and wires them to the open
aggregators that already federate all of them.

## What it is
- **Graded institution directory** — 43 seeded institutions across 14 countries
  (US, UK, Germany, Switzerland, Sweden, Netherlands, Israel, Canada, **Japan**,
  **China**, Singapore, Australia, South Korea, India), graded **A–D** on a
  transparent, sourced rubric. Every one links to its real biochemistry works on
  OpenAlex and a PubMed affiliation search.
- **Live literature search** — queries the OpenAlex API in the browser and shows
  real, current papers with working DOI links. Nothing is fabricated; results are
  OpenAlex's.
- **Federated databases** — PubMed, PMC, Europe PMC, OpenAlex, bioRxiv, Semantic
  Scholar, CORE, DOAJ, J-STAGE (Japan), Google Patents.
- **Cross-Pollination Lab** — a hypothesis scaffold for spotting intersections of
  research areas that may be patentable, with built-in prior-art-check links. It
  is a workspace, not a claim of discovery.
- **Method & Honesty** — states plainly what is real, what the grades mean, and
  what this is not.

## Honesty rules honored
- No fabricated findings, citations, or DOIs. Live results come from OpenAlex.
- Grades summarize published third-party rankings (THE, U.S. News, SCImago,
  Research.com), labeled as a curated tier, not an original measurement.
- No claim that any cross-pollination intersection is patentable — that needs a
  prior-art search and patent counsel.

## How to view / send
Open `index.html` in any browser. It's a single ~25 KB file — email it, host it,
or drop it on any static host (Netlify, Cloudflare Pages, GitHub Pages, an S3
bucket). The live search works best when the page is hosted (browsers may block
`fetch` from a local `file://` — the directory and links still work offline, and
an "Open in OpenAlex" button always works).

## How it grows
Add rows to the `INSTITUTIONS` array (`name, city, country, grade, ror`). Filters,
live search, and the cross-pollination selectors scale automatically. ROR IDs give
exact OpenAlex links; without one it falls back to a name search.

## us-top-100.html — US Top 100 Labs & Innovation Engine
A dedicated page: the 100 leading U.S. biochemistry research universities
(across 41 states + DC), graded A–D. Each card has a **Load top findings (live)**
button that resolves the university in OpenAlex and pulls its most-cited
biochemistry papers with real DOIs — the honest form of "connecting to the labs."
Plus an **Innovation Engine** that turns a pair of research areas into a
cross-pollinated lead brief with live intersection-literature and prior-art
links. Leads require prior-art search + patent counsel; nothing is a claim of
invention. Grades summarize published third-party rankings.
