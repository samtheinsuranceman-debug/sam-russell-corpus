# The 1,000-Therapy Expansion — Intake Spec

**Goal:** grow the mapped protocol library from 92 to 1,000+ real, citation-backed
therapies — WITHOUT ever publishing a claim the data can't defend.

**Why a pipeline and not a page dump:** every protocol page's value is its
line mapping + peer-reviewed citation. Pages generate AUTOMATICALLY from the
data (`shared/therapyLineMap.ts` + a kind classification). Adding one verified
therapy yields: its /protocol page, a /build page per mapped line, comparison
pages against everything sharing its lines, sitemap entries, unique metadata,
and the <60-char short — all machinery already built and test-enforced.
**The pages are free. The data must be earned.**

## Batch format (100 therapies per batch)

One JSON array; each row:

```json
{
  "therapy": "Exact Published Name (ACRONYM if standard)",
  "kind": "psychotherapy | mindfulness | skill | somatic | physical | relational | community | expressive | psychedelic | neuromodulation | lifestyle",
  "mappings": [
    {
      "line": "one of the 32 engine lines",
      "role": "PRIMARY | SECONDARY | TERTIARY",
      "capacity": "the specific capacity it develops, one sentence",
      "cite": "Full APA citation of a peer-reviewed study",
      "doi": "10.xxxx/xxxxx  (REQUIRED, must resolve)",
      "finding": "What that study actually showed, one sentence, no inflation"
    }
  ]
}
```

## Rules (non-negotiable)

1. **Real, named, published interventions only** — a therapy must exist in the
   peer-reviewed literature under this name. No coinages, no rebrands.
2. **Every mapping carries its own citation + resolving DOI.** A therapy with
   no defensible line mapping does not enter — there is no "unmapped" tier.
3. **Conservative roles:** PRIMARY only when the cited study measured the
   capacity directly; SECONDARY for documented side-effects; when unsure, demote.
4. **Findings verbatim-honest:** report what the study showed, including
   effect-size humility. Never "proves," never outcome guarantees.
5. **Exclusions:** no supplements/nutraceuticals without RCT evidence, no
   detection-evadable pseudo-therapies, nothing marketed as diagnosis, nothing
   requiring claims on our no-build list (predictive health, guarantees).
6. **Duplicates:** check against the current 92 (`THERAPY_NAMES`) — variants of
   an existing entry extend its mappings, not a new row.

## The gate (Claude-side, every batch)

1. Machine-verify every DOI resolves and matches the citation.
2. Spot-check findings against abstracts (sustain-or-concede).
3. Rejected rows are logged; systematic problems bounce the batch.
4. Accepted rows merge into `therapyLineMap.ts` + `THERAPY_KIND`; the test
   suite (name coverage, slug uniqueness, sub-60 shorts) must stay green.
5. Each accepted batch is noted on the public Corrections/Verification pages.

## Expected yield per verified 100-therapy batch

~100 protocol pages + ~150 build pages + comparison pages against every
overlapping protocol (grows superlinearly) — roughly **300–600 pages per
batch**, all citation-backed. Ten batches ≈ the 1,000-therapy goal, and on
current machinery that is a **4,000–7,000-page site with zero fabricated claims.**
