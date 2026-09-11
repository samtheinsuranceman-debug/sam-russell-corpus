# Research Ingestion Pipeline & Claim Taxonomy

**Purpose:** turn the library from a pile of citations into an *evidence spine* —
every value claim the product makes is mapped to the science that grounds it, the
exact search framing that finds that science, and an honest tier label.

## Scope — where Perplexity runs

Perplexity (live web search + citations) is used **only in the high-confidence,
paid tier**, for two jobs:

1. **Evidence verification** — when a client uploads a claim ("I hold this patent /
   founded this company / published this paper"), verify it against the live web
   with citations.
2. **Research-library ingestion** — find and cite the literature behind each value
   claim, on an ongoing basis.

Perplexity is **never** used in the free, low-confidence voice pass — that pass
stays fast, cheap, reproducible, and self-contained (raw-model reasoning only).

## Two tiers of claim — label honestly or the library backfires

| Tier | Meaning | How it's cited | UI label |
|------|---------|----------------|----------|
| **Tier 1 — Established** | Peer-reviewed science we *stand on* | Real DOI, verified to resolve AND to support the specific claim | "Established research" |
| **Tier 2 — Our synthesis** | A claim specific to the AQAL 32-line model that no one has published yet (because the model is new) | Grounded in the Tier-1 principle it extends; marked as hypothesis | "Theory-grounded · pending our data" |

**Promotion path:** a Tier-2 claim becomes Tier-1-for-us once our own beta cohort
data supports it — same discipline as the norming (theoretical v1 → empirical v2).
Never cite Tier-1 research *as if* it proves a Tier-2 claim.

## The claim map

Each row = a claim the product makes → the field that grounds it → how to frame the
Perplexity search → tier → what would promote it to evidence.

### A. Individual-line claims (already partly covered)

| Claim | Scientific grounding | Search framing | Tier |
|-------|----------------------|----------------|------|
| A single line (e.g. Volitional, Meta-Cognitive) can be trained/improved | Neuroplasticity; deliberate practice; targeted cognitive training | "training-induced improvement in [construct]; effect size; durability; transfer" | 1 |
| Improvement persists / transfers | Far-transfer literature (often skeptical — cite honestly) | "far transfer cognitive training meta-analysis; near vs far transfer" | 1 |

### B. Cluster-interaction claims (the big gap — the product's core value)

| Claim | Scientific grounding | Search framing | Tier |
|-------|----------------------|----------------|------|
| Some weaknesses **control** other weaknesses | **Network psychometrics** — node **centrality** (strength, betweenness, expected influence) | "network psychometrics centrality; most central node symptom network; expected influence Borsboom Cramer" | 1 (method) / 2 (our nodes) |
| One weakness caps outcomes **regardless of strengths** | **Liebig's Law of the Minimum**; bottleneck / rate-limiting theory | "Liebig law of the minimum performance; weakest-link / bottleneck limiting factor human performance" | 1 (principle) / 2 (applied) |
| Some strengths **lift the whole shape** | **Keystone habits** (Duhigg); **positive manifold / g-factor** | "keystone habit mechanism; positive manifold mutualism model intelligence van der Maas" | 1 (principle) / 2 (applied) |
| Enhancing/depleting the **most influential node** re-engineers outcome probability | **Leverage points** (Donella Meadows); intervention-on-central-node studies | "Meadows leverage points system intervention; intervene on central node network psychometrics outcome change" | 1 (principle) / 2 (applied) |
| The profile has **emergent properties** beyond the sum of lines | Complexity science; **bridge nodes** in comorbidity networks | "emergent properties psychological network; bridge symptoms comorbidity network analysis" | 1 (principle) / 2 (applied) |
| Complementary **matching** (my strength covers your weakness) improves outcomes | Team composition; complementary vs supplementary fit; cognitive diversity | "complementary team composition performance; cognitive diversity team outcomes; person-team fit" | 1 (principle) / 2 (applied) |

### C. Intervention & tracking claims (what the paid tier promises)

| Claim | Scientific grounding | Search framing | Tier |
|-------|----------------------|----------------|------|
| Bolstering the **central weakness** first yields the largest outcome gain | Network-intervention theory; treat-the-hub studies | "targeting central node intervention efficacy network; hub-focused treatment outcome" | 1 (method) / 2 (our claim) |
| Tracking a weakness reduces unconscious sabotage of strengths | Self-monitoring; implementation intentions (Gollwitzer); habit-derailment | "self-monitoring behavior change effect size; implementation intentions meta-analysis" | 1 |
| A weakness can be **detached / routed around** rather than fixed | Compensation strategies; scaffolding; strengths-based routing | "compensatory strategies weakness workaround performance; strengths-based development evidence" | 1 (principle) / 2 (applied) |

## The meta-questions, made answerable

The founder's questions map to **computable network measures** — once we have cohort
data, these stop being rhetorical and become metrics:

- *"Which weakness most controls the others?"* → highest **expected-influence centrality** among the weakness sub-network.
- *"Which strength systematically controls the others?"* → highest centrality / hub score among the strength sub-network.
- *"Re-engineer the probabilities by enhancing/depleting one node?"* → **network intervention simulation**: perturb node *i*, measure predicted shift in outcome-linked nodes.
- *"Emergent properties, if any?"* → network-level indices (density, small-worldness) that don't reduce to single lines.

Until we have the data, these are **Tier 2** (our model, theory-grounded). The
network-psychometrics *method* for computing them is **Tier 1**.

## The verification gate (mandatory — Perplexity hallucinates citations)

Every citation Perplexity returns passes this gate before entering the library:

1. **Resolves** — the DOI/URL actually loads.
2. **Supports** — the source genuinely says what the claim needs (a second model re-reads the abstract/section and confirms; reject "topically related but doesn't support").
3. **Tiered** — tagged Tier 1 or Tier 2 per the rules above.
4. **Deduped** — not already in the library.

Only survivors are stored. Everything dropped is **logged** (count + reason) so
coverage gaps are visible instead of silently papered over.

## Build order

1. This taxonomy (done — this file).
2. Perplexity provider seam (`server/platform/research.ts`), high-confidence-gated, mock fallback.
3. Verification-gate module (resolve + support check).
4. Ingestion run, claim-by-claim, populating `ResearchLibrary` with tier tags.
5. Evidence-verification endpoint (uploaded-claim → Perplexity → verified/unverified).

## The healthy-aging & longevity shelf (sections 7000+)

`client/src/pages/researchLibraryLongevity.ts` is a second authored corpus file,
merged into `PRACTICE_EVIDENCE` by `researchLibraryData.ts`. It exists because
members name "live longer" as a goal, and the platform owes them the verified
menu — treatments, supplements, therapies, lipids, exercise — with the honest
verdict on each. Its contract is stricter than the frozen corpus:

- **Every source is a DOI resolved against the publisher or the PubMed record**
  (title, journal, year, first author read back) on the date in the file header.
  No Scholar fallbacks are allowed; `researchLibraryLongevity.test.ts` fails on
  any `kind` other than `"doi"` or any link that is not `https://doi.org/10.…`.
- **Animal-only findings are labelled in the title and rated Emerging.** A mouse
  lifespan result is never presented as a human one.
- **Unsupported or harmful claims are rated at the floor** (impact magnitude 1,
  with a `callout`) so the library counts them as debunked: antioxidant
  megadoses and resveratrol, growth hormone and DHEA, daily aspirin in healthy
  older adults, vitamin D for mortality in the replete, and purchasable young-
  plasma / hyperbaric / stem-cell-clinic treatments.
- **Nothing on the shelf is medical advice.** Drugs and hormones are described
  with the trial that tested them; the decision belongs to a clinician.

The goal path reaches the shelf: `shared/goalTemplates.ts` has a `longevity`
template (keywords: longevity, live longer, healthspan, anti-aging, …) and
`shared/keystonePractices.ts` carries five `longevity-*` practices whose
`section` points at the shelf, so `/goal/longevity`, `/goal/live-longer`, the
coach's prescriptions and the outcome projections all draw from it.

To extend the shelf: verify the DOI first (fetch the publisher page or the
PubMed record), add the cluster under a new `70NN` section in all three maps
(`LONGEVITY_SECTIONS`, `LONGEVITY_SECTION_SHORT`, and the order is derived),
give it an `impact` rating, run the test, then `python3 scripts/gen_catalog.py`.

### How the shelf is extended: the multi-AI sweep

Wave 2 (sections 7039–7062) was built by fanning one gap question out to
several engines at once — Perplexity (research and ask), a second model
through OpenRouter, the Amass biomedical index, Exa and PubMed — and treating
every answer as a *candidate list*, never as a source. Each candidate DOI was
then resolved against the publisher page or the PubMed record before it was
written down; candidates whose DOI did not resolve, or resolved to a different
paper than claimed (the second model produced several of these), were dropped
rather than corrected from memory. The engines are good at recall — they
surfaced DO-HEALTH, the 2025 taurine correction, the metformin-in-monkeys study,
the 2026 healthspan RCT review and the ABLE trial — and unreliable at
citation, which is why the verification gate stays mandatory.

## The goal shelves (sections 8000+) — protocols for the goals people actually name

The founder's observation: about a dozen goals cover most of what a member will
ever type into the goal box. The library owes each one a shelf of *protocols* —
things to do, tiered by how much they ask of a person — not a diagnosis of the
member's weaknesses. The shelves live in `shared/goalShelves/` (one file per
goal, merged by `index.ts`) so the server-side coach can read them without the
client bundle, and they are merged into `PRACTICE_EVIDENCE` by
`client/src/pages/researchLibraryData.ts` so they appear in the same page,
filters, counts and catalog as everything else.

| Goal key | Shelf | Sections |
|---|---|---|
| `marriage` | Be a better husband, wife or partner | 8000–8099 |
| `parenting` | Be a better parent — children who thrive, and the best memories | 8100–8199 |
| `debt` | Get out of debt | 8200–8299 |
| `happiness` | Be happy — wellbeing that lasts | 8300–8399 |
| `retirement` | Extra money for a meaningful, active retirement | 8400–8499 |
| `business` | Start and grow a business | 8500–8599 |
| `hobby` | Pick up a new hobby or skill | 8600–8699 |
| `education-career` | Graduate college and find the right career | 8700–8799 |
| `partner` | Find the right partner and settle down | 8800–8899 |
| `home` | Buy a house | 8900–8999 |
| `travel` | Go traveling | 9000–9099 |
| `family-time` | More time with family, kids and parents | 9100–9199 |
| `legacy` | Memorialize a life in meaningful ways | 9200–9299 |
| `health-energy-beauty` | Great health, energy and beauty for as long as possible | 9300–9399 |
| `athlete` | Become a better athlete | 9400–9499 |

Every cluster on a shelf carries three fields the rest of the library does not:

- **`tier`** — `fundamental` (free, daily, the floor everything else stands on),
  `moderate` (a structured program over weeks), `advanced` (expert-guided or a
  real investment of money and months), `elite` (the rare highest-leverage move
  with a long horizon).
- **`action`** — the concrete step in the second person: what to do this month,
  how often, for how long. A cluster without an action is not a protocol.
- **`reinforcement`** (optional) — books, videos, courses or tools, with a link
  only when that page was opened during verification.

Each shelf opens with a `<base>` "How to Read This Shelf" section and a
`gs-<goal>-read-me-first` cluster, then one section per topic ordered from
fundamental to elite. Popular advice the evidence does not support sits on the
shelf at the floor (impact magnitude 1 with a callout) so the library counts it
as debunked rather than quietly omitting it.

**The verification contract is the longevity shelf's**: every source is a DOI
resolved against the Crossref record, the publisher page or the PubMed record
on the date in the file header; `kind` is always `"doi"`; nothing is typed from
memory; a source that would not verify is dropped. `shared/goalShelves.test.ts`
enforces the link shape, the tiers, the actions, the section ranges and the
floor-rating callouts. Each shelf's ledger (DOI, title, journal, year, how it
was verified) is kept with the build notes for the wave that produced it.

### The monthly menu (`shared/goalProtocols.ts`)

Alongside the recommendations for a member's intelligences, the coach hands
them a menu for the one goal they picked: one or two picks from each tier —
fundamental, moderate, advanced, elite — chosen from the matching shelf and
rotated by calendar month so a member who keeps the same goal sees the shelf's
breadth over a year. Floor-rated clusters and the read-me cluster are never
handed out. `shelfForGoal()` matches free text to a shelf by keyword hits;
`goalMenuForMonth()` builds the menu; `server/coaching.ts` attaches it to the
outcome report as `goalMenu` and feeds it to the coach prompt; the results page
renders it under "This month's protocols".

### How a shelf is extended

Fan the gap question out to several engines at once (Perplexity, Exa, the
Amass biomedical index, PubMed) and treat every answer as a candidate list.
Verify each DOI — Crossref (`https://api.crossref.org/works/<doi>`) for anything
outside biomedicine, PubMed or Amass for anything inside it — and read the
title, journal and year back off the record before writing the cite. Add the
cluster under a new section in the shelf's file, give it a tier, an action and
an impact rating, run `npx vitest run shared/goalShelves.test.ts`, then
`python3 scripts/gen_catalog.py`. The target is breadth as well as depth: the
shelves are meant to grow from the first wave's ~1,500 verified sources toward
the founder's 25,000–35,000, one verified source at a time.
