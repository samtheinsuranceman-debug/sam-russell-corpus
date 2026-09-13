# Pre-filing review of the drafted applications

**Read this before any of these drafts is signed or filed.**

Nine application drafts are held under `docs/patents/applications/`. All were
prepared 29 April 2026 by the "Manus AI Patent Engineering Team" and are marked
CONFIDENTIAL — Attorney-Client Work Product. None has been filed;
`shared/patentStatus.ts` remains the only thing that decides what is on file,
and it reads receipts.

This file records defects found by measuring the documents, not by reading them
impressionistically. Every number below is reproducible with `pdftotext`,
`pdfinfo` and `pdfimages` against the files in that directory.

## The two tiers

| Tier | Refs | Pages | Words | Figures |
|---|---|---|---|---|
| Thin | SI-038, SI-039, SI-040, SI-041 | 7–11 | ~2,300 | none embedded |
| Full | PAT-001…PAT-004, SI-042 | 14–23 | 1,951–4,360 | 5 embedded |

The thin tier's text lengths fall within 2% of each other (14,348–14,595
characters) across four unrelated inventions — the signature of a template
filled to a fixed depth. The full tier varies 2.2× in length, which is what
genuinely different inventions produce. The full tier is the better work.

SI-042 exists in both tiers. The full version is a strict superset: identical
specification text plus the five rendered figures. The superset replaced the
thin file in place, so the catalogue path did not change.

## Defects that must be fixed before filing

### 1. Every application claims an FPGA this system does not have

All nine drafts recite a Field-Programmable Gate Array co-processor. PAT-001
mentions FPGA 22 times and puts it in both independent claims — claim 1(a)
requires "receiving, via a hardware-accelerated Field-Programmable Gate Array
(FPGA), a change to at least one financial input parameter", and claim 1(h)
requires completing the cascade "using the FPGA co-processor executing parallel
calculator branches at the gate level".

There is no FPGA. This repository builds to `dist/index.js` and starts with
`node dist/index.js` on a Railway container. No file under `shared/`, `server/`
or `client/` references gate-level hardware of any kind.

This cuts two ways and both are bad:

- **Scope.** A claim limited to an FPGA is not infringed by a competitor who
  does the same thing in software — which is how anyone would actually build
  it. The limitation that was presumably added to clear §101 and §103 also
  makes the granted claim close to unenforceable against the real market.
- **Enablement and § 112.** The specification describes a machine that was
  never built, in a way the applicant knows to be unbuilt. Combined with
  37 CFR 1.56, that is a problem to raise with counsel, not to paper over.

The same pattern repeats per application: PAT-002 recites FPGA-accelerated
simulation and "real-time multi-lender rate aggregation" (no lender feed
exists); PAT-003 recites "voice tone analysis hardware" and biometric
authentication (neither exists); PAT-004 recites "hardware-accelerated
archetype discovery" and genetic-algorithm weight evolution, where
`shared/wealthGenome.ts` scores against fixed weights.

**Recommendation:** ask counsel whether these hardware limitations are load-
bearing for patentability or were added for rhetorical weight. If the latter,
they should come out and the claims should be written to the software as built.
If the former, the applications are claiming inventions that do not exist yet.

### 2. The figures are the same drawing with one word changed

Each full-tier application embeds five images at identical dimensions
(3120×1636, 3120×380, 2744×7664, 3120×900, 3120×2896) and near-identical
compressed sizes across every document.

Figure 1 of PAT-001 (a cascading multi-calculator engine) and Figure 1 of
SI-042 (a GRAT/IDGT estate freeze) are pixel-identical except for one box
label: "CMCFPE Core Processor" versus "EFIWR Core Processor". Every other box,
every arrow, the external data sources, the ecosystem panel and the "FPGA
Hardware Accelerator" block are the same.

37 CFR 1.83(a) requires the drawings to show every feature specified in the
claims. A generic block diagram reused across unrelated inventions does not,
and an examiner comparing two co-pending applications from the same applicant
will see it immediately.

### 3. A drafting-score table is sitting inside the specification

Every draft contains, in the Summary of the Invention, a table reading:

> Original Patentability 7.8 / 10 · Remaining Gap 2.2 · 225% Enhancement
> 2.2 × 2.25 = 4.95 · Enhanced Score 9.95 / 10 (capped)

This is an artifact of the drafting process — a record of optimising a
patentability score — left in the body of the document. It has no place in a
filed application and should be deleted from all nine.

### 4. "(c)" renders as the copyright symbol, inside the claims

Claim element (c) appears as "© executing a Dynamic Recalculation
Prioritization Algorithm…" in PAT-001, and the same corruption occurs 1–4 times
per document across all nine. The CPC class is written "G06Q 40⁄06" with a
fraction slash (U+2044) rather than a solidus. Both are character-encoding
damage from the HTML-to-PDF render (Chrome headless → Skia/PDF) and both need
correcting in the source before filing.

### 5. Each draft states the portfolio has been filed

Every application's Related Applications paragraph reads: "This application is
part of a portfolio of 57 related patent applications **filed by** Russell
Holdings Management, LLC."

Nothing has been filed. This is a formal statement in a document signed under
declaration. It must be corrected to describe applications being prepared, or
cut.

## Coverage

Nine of 57 claims have a drafted application. Forty-eight do not, including
eleven of the fifteen PAT claims — among them PAT-010, the time-machine dual
illustration, which is the most valuable and the most likely to draw
examiner scrutiny under AG 49-A.

## What this review does not say

It does not say the inventions are unpatentable, and it does not say the drafts
are worthless — the full tier is a serious starting point, and the §101 and
§103 defence sections show real thought about *Alice* and *KSR*. It says these
documents describe hardware that does not exist, illustrate five different
inventions with one diagram, and carry process artifacts in the body. Those are
fixable, and they are much cheaper to fix now than after a filing date.
