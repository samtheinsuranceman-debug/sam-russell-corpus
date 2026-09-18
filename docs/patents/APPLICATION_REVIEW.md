# Pre-filing review of the drafted applications

**Read this before any of these drafts is signed or filed.**

All 57 claims now have a drafted application under `docs/patents/applications/`,
one file per claim, named by its reference. All were prepared 29 April 2026 by
the "Manus AI Patent Engineering Team" and are marked CONFIDENTIAL —
Attorney-Client Work Product.

**None has been filed.** `shared/patentStatus.ts` remains the only thing that
decides what is on file, and it reads receipts, not documents.

Everything below was measured across all 57 documents with `pdftotext`,
`pdfinfo` and `pdfimages`. Nothing here is inferred from a sample.

## The portfolio, measured

| | Documents | Pages | Words each |
|---|---|---|---|
| PAT-001 | 1 | 23 | 4,360 |
| PAT-002 | 1 | 19 | 3,147 |
| PAT-003 … PAT-015 | 13 | 15–17 | 2,273–2,931 |
| SI-001 … SI-042 | 42 | 10–14 | 1,803–1,951 |
| **Total** | **57** | **834** | **117,957** |

Two documents were written to the depth their invention needed. PAT-001 is
nearly twice the length of any other and PAT-002 is a clear second. Everything
after that falls into two flat tiers: the remaining thirteen PAT drafts sit
within 13% of each other, and all forty-two SI drafts sit within 8% of each
other — 1,803 to 1,951 words across forty-two unrelated inventions, from
sentiment analysis to GRAT/IDGT estate freezes.

That is a template filled to a fixed depth, not forty-two specifications each
written to what its invention required.

For scale: a non-provisional utility application in this art commonly runs
30–80+ pages. A 14-page, 1,850-word specification is provisional-grade content
under a non-provisional cover sheet.

## Five defects, and every one is in every document

Counted across all 57. Not most. All.

### 1. All 57 claim an FPGA this system does not have

Every application recites a Field-Programmable Gate Array co-processor —
PAT-001 mentions it 22 times and puts it in both independent claims. Claim 1(a)
requires "receiving, via a hardware-accelerated Field-Programmable Gate Array
(FPGA), a change to at least one financial input parameter"; claim 1(h)
requires completing the cascade "using the FPGA co-processor executing parallel
calculator branches at the gate level".

There is no FPGA. This repository builds to `dist/index.js`, starts with `node
dist/index.js`, and runs in a Railway container. No file under `shared/`,
`server/` or `client/` references gate-level hardware.

This cuts two ways and both are bad:

- **Scope.** A claim limited to an FPGA is not infringed by a competitor who
  does the same thing in software — which is how anyone would actually build
  it. The limitation presumably added to clear *Alice* also makes the granted
  claim close to unenforceable against the real market.
- **35 U.S.C. § 112.** The specification describes a machine that was never
  built. Together with the duty of disclosure under 37 CFR 1.56, that is a
  question for counsel before signature, not after.

The pattern repeats per document with invention-specific hardware that also
does not exist: PAT-002 recites real-time multi-lender rate aggregation (no
lender feed; `reverseHeloc.ts` takes the rate as an input), PAT-003 recites
voice-tone-analysis hardware and biometric authentication (`ultraAI.ts` does
neither), PAT-004 recites genetic-algorithm weight evolution
(`wealthGenome.ts` scores against fixed weights).

### 2. All 57 share the same five drawings

Every document embeds exactly five images, at identical dimensions across the
entire portfolio (3120×1636, 3120×380, 2744×7664, 3120×900, 3120×2896). That
is 285 figures drawn from 5 distinct drawings.

Figure 1 of PAT-001 (a cascading multi-calculator engine), Figure 1 of PAT-010
(the time-machine dual illustration), Figure 1 of SI-020 and Figure 1 of SI-042
(a GRAT/IDGT estate freeze) are pixel-identical but for the acronym in one box:
"CMCFPE Core Processor", "PROE Core Processor", "ACETRE Core Processor",
"EFIWR Core Processor". Every other box, every arrow, the external data
sources, the ecosystem panel and the "FPGA Hardware Accelerator" block are the
same in all of them.

37 CFR 1.83(a) requires the drawings to show every feature specified in the
claims. A generic block diagram reused 57 times does not, and an examiner
handling several of these co-pending applications sees it at a glance.

### 3. All 57 carry a drafting-score table in the specification

Inside the Summary of the Invention, every document contains:

> Original Patentability 7.8 / 10 · Remaining Gap 2.2 · 225% Enhancement
> 2.2 × 2.25 = 4.95 · Enhanced Score 9.95 / 10 (capped)

This is an artifact of the drafting process — a record of optimising a
patentability score — left in the body. It has no place in a filed application.

### 4. All 57 render claim element (c) as the copyright symbol

"© executing a Dynamic Recalculation Prioritization Algorithm…" appears in the
claims of PAT-001, and the same corruption occurs 1–4 times per document across
the whole set. The CPC class is written "G06Q 40⁄06" with a fraction slash
(U+2044) rather than a solidus. Both come from the HTML-to-PDF render
(headless Chrome → Skia/PDF) and both must be fixed in the source.

### 5. All 57 state the portfolio has already been filed

Every Related Applications paragraph reads: "This application is part of a
portfolio of 57 related patent applications **filed by** Russell Holdings
Management, LLC."

Nothing has been filed. This is a formal statement in a document signed under
declaration, and it is false in all 57 copies.

## What is actually good here

The drafts are not worthless and this review should not be read as saying so.
Each contains a *KSR v. Teleflex* non-obviousness section and an *Alice Corp.*
§ 101 subject-matter-eligibility section — someone thought about how these get
rejected, which is more than most first drafts do. The narrowing technique
(limiting PAT-001 to retirement planning above $5M rather than claiming
financial planning generally) is the right instinct for § 101. The
cross-referencing between claims describes a real architecture.

The problem is not the thinking. It is that one template was stamped 57 times,
and the stamp contains hardware that does not exist and a paragraph asserting a
filing that has not happened.

## Recommended order of work

1. **Ask counsel about the FPGA** before anything else. Are those limitations
   load-bearing for patentability, or rhetorical? The answer determines whether
   the claims get rewritten to the software as built, or whether the portfolio
   is claiming inventions that do not yet exist. Everything else is cosmetic
   next to this.
2. **Strike the scoring table and fix the "filed by" paragraph** in all 57.
   Mechanical, and neither should survive to a signature.
3. **Fix the (c) → © corruption** in the source before re-rendering.
4. **Commission real drawings** for at least the claims that will be filed
   first. One diagram cannot serve 57 inventions under 37 CFR 1.83(a).
5. **Decide what gets filed first.** 57 non-provisionals is a large bill. The
   drafts as they stand are closer to provisional quality, and a provisional
   would buy twelve months to fix items 1–4 while holding a priority date.
   That is a conversation for the attorney financing this, not a decision to
   take from here.
