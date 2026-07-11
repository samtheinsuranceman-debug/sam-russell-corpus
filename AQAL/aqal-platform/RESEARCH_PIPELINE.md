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
