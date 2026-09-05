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

## cross-pollination.html — Cross-Pollination Engine
The capstone. Reads the same persistent vault (`bioevidence_vault_v1`) and turns
accumulated findings into patent leads: drop strong findings from two different
fields into Basket A and Basket B, and it generates intersection lead briefs —
each with both source citations, a transparent **novelty signal** score
(evidence strength of both × field-distance), and live prior-art links (Google
Patents, USPTO, Espacenet, WIPO) plus intersection literature. Leads save to a
separate persistent store (`bioevidence_leads_v1`), exportable JSON/CSV. Topic
Mode pairs two fields directly when the vault is empty. Leads are hypotheses
requiring prior-art search + patent counsel — never a claim of invention.

## disclosure-drafter.html — Disclosure Drafter
Closes the loop to IP. Reads saved leads (`bioevidence_leads_v1`) from the
Cross-Pollination Engine and drafts each into a DRAFT technical disclosure in
provisional-application format: title, field, background (the two real source
findings + DOIs and their gap), summary of the proposed combination, an
enablement scaffold (what must be specified and experimentally validated), a
draft claim skeleton (placeholders for counsel), prior-art positioning (Google
Patents / USPTO / Espacenet / WIPO links), and the standard disclaimer.
Drafts save (`bioevidence_drafts_v1`) and download as .md. Manual Mode drafts
from two entered fields. Every draft is explicitly NOT filed, NOT reduced to
practice, and requires prior-art search + a registered patent attorney.
