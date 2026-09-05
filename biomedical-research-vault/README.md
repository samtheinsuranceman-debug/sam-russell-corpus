# BioEvidence Atlas — Russell Biomedical Research Vault

Self-contained masterpiece site (`index.html`, no build) that harvests real
biomedical findings and sorts them onto a 12-tier evidence spectrum, then lets
you accumulate a persistent, exportable research database.

## What it does
- **Harvest by Topic** — live Europe PMC search; every result auto-tiered by its
  declared study type and title/abstract cues, sorted definitive → speculative,
  with a live distribution bar across the 12 tiers.
- **Top 100 U.S. biomedical institutions** (41 states), graded A–D; each has a
  "Harvest top findings" button that pulls its output and tiers it.
- **My Vault** — save findings; they persist in your browser (localStorage) and
  export to JSON/CSV. This is the database that grows as you work.
- **Evidence Spectrum** — the 12 tiers, defined, grounded in Oxford CEBM Levels
  of Evidence + GRADE.

## The 12 tiers (definitive → speculative)
1 Definitive Consensus · 2 Randomized Trial · 3 Prospective Cohort ·
4 Case-Control · 5 Cross-Sectional/Population · 6 In Vivo Mechanism ·
7 In Vitro/Molecular · 8 Computational/In Silico · 9 Review/Synthesis ·
10 Case Report/Series · 11 Correlational/Hypothesis · 12 Preprint/Speculative.

## Honesty
- Real institutions; findings, DOIs, and accessions come live from Europe
  PMC / OpenAlex — never fabricated.
- A tier grades the STRENGTH OF THE EVIDENCE CLASS (study design), transparently
  from declared publication type — NOT a verdict that a finding is true. Even
  Tier 1 is revisable; science is provisional.
- Not medical advice; not a re-distributor of controlled data. Cross-pollination
  for IP needs prior-art search + patent counsel.
- The vault lives on your device only; nothing is uploaded.

## Ecosystem
Third sibling with `../biochem-library/` and `../biomedical-data-library/`,
under the `../russell-biomedical/` venture. Keep folders as siblings.
