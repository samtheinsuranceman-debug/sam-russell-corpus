# Russell BioMedical — Research-to-IP Platform (assembly guide)

The biomedical platform is five tools + a hub, each a self-contained static site
in its own top-level folder:

| Folder | Piece |
|--------|-------|
| `russell-biomedical/` | Venture site + `platform.html` (the hub) |
| `biochem-library/` | BioChem Atlas (+ `us-top-100.html`) |
| `biomedical-data-library/` | BioData Atlas (51 repositories, live search) |
| `biomedical-research-vault/` | BioEvidence Atlas + `cross-pollination.html` + `disclosure-drafter.html` |

## Pipeline
Source (BioData) → Map (BioChem/US-100) → Grade (BioEvidence 12-tier vault) →
Combine (Cross-Pollination leads) → Draft (Disclosure Drafter). The vault, leads,
and drafts persist in the browser and are shared across tools **when served from
one origin**.

## Build the deployable bundle
Copy the four folders together under one root and add a root `index.html` that
is `russell-biomedical/platform.html` with `../` stripped from its internal
links (so links point to the folders at root level). Serve the whole thing from
one domain. All static — no server, no build, no database. See the bundle's
`DEPLOY.md` for host options (static host, cPanel/shared, or local).

## Honesty (platform-wide)
Real institutions/repositories; live results from open APIs; nothing fabricated.
Evidence tiers grade study DESIGN, not truth. Leads and draft disclosures are
hypotheses/starting documents requiring prior-art search + patent counsel. Not a
clinical provider; not medical or legal advice.
