# BioData Atlas — Russell Biomedical Data Library

Self-contained website (`index.html`, no build) cataloging the world's major
biomedical **data repositories** and wiring the open ones for live search.

## What it is
- **Repository directory** — 51 real repositories across 13 domains: genomes &
  sequences, proteins & structures, expression & functional genomics, variants &
  clinical genetics, chemicals & drugs, pathways & systems, metabolomics,
  clinical/cohorts/trials, cancer genomics, imaging & signals, immunology, model
  organisms, and literature. Each labeled by access model (open vs.
  registered/controlled) and linked to the real source.
- **Live Data Search** — four engines that query open, no-key APIs in the
  browser and return real records with real accession IDs:
  Literature (Europe PMC), Protein structures (RCSB PDB), Clinical trials
  (ClinicalTrials.gov API v2), Genes (MyGene.info). Each falls back to "Open on
  source" if a local `file://` blocks the fetch.
- **Access & Standards** — open vs. controlled access, accession identifiers,
  licensing notes.
- **Method & Honesty** — what's real, what this is not.

## Honesty
- Real repositories, verified URLs; live records/accessions/DOIs come from the
  sources, never fabricated.
- Not a data owner or re-distributor; never holds controlled/patient data —
  links to the front door only. Not medical advice.

## Ecosystem
Pairs with `../biochem-library/` (institutions & findings) and
`../russell-biomedical/` (the research & IP venture). Keep the folders siblings
so cross-links resolve.

## Deploy / send
Open `index.html` in any browser; host it for the live widgets to work best
(browsers may block `fetch` from `file://`).
