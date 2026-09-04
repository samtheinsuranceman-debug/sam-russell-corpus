# DRAFT PROVISIONAL PATENT APPLICATION — AQAL-RCS-E1

**Title of Invention:** Voice-Informed Financial Readiness Assessment

**Series:** Series B — JoinAQAL x Russell Capital Systems Emergent Combination
**Inventor:** Samuel Andrew Russell V  
**Assignee:** Russell Holdings Management, LLC, Wilmington, Delaware  
**Status:** DRAFT — NOT FILED. No application number exists; nothing herein is patent-pending. Per company records; confirm status with patent counsel.

## Cross-Reference to Related Disclosures

This combination builds on the AQAL core engine family (eight-model consensus scoring; prosodic voice analysis; controlling-weakness identification; verified achievement floors; versioned norming; research provenance) and the five shared components (append-only audit ledger; calibration-weighted consensus bus; parallel compute fabric; dimension isolation; voice-feature extraction), each separately documented in the company's technical disclosures.

## Field of the Invention

Computer-implemented psychometric assessment and personal-development systems; cross-platform financial-planning integration; tamper-evident audit of machine-generated assessments.

## Background

Single-instrument cognitive assessments produce point estimates with no audit trail, no verified lower bounds, and no mechanical link from a measured deficiency to the specific, evidence-supported interventions that address it; and cognitive and financial development systems operate as silos, so what one system learns about a person never conditions the other.

## Summary of the Invention

The invention combines the following engines into a single coordinated pipeline: Prosodic Voice-Feature Extraction Engine, Eight-Model Consensus Scoring Engine, Transparency and Tamper-Evident Audit Engine; joined across platforms with the Decade Machine household-profile intake and module-triage layer (shared/ultraEngine.ts; server/ultraAI.ts). The combination produces an emergent capability that no component produces alone, and every emergent result is disclosed to the member and committed to a tamper-evident hash-chained ledger. Under the KSR v. Teleflex framework, the claimed value rests on the combination producing synergistic effects a person of ordinary skill would not predict from the components individually — a position patent counsel must evaluate against prior art before filing.

**Emergent mechanism.** A member's prosodic voice profile and consensus-scored cognitive vector, retrieved over the authenticated integration API, condition the financial planning engine's module triage: the same spoken self-description that drives cognitive assessment also seeds the household profile, and voice-derived confidence context is disclosed alongside the plan rather than hidden inside it.

## Detailed Description

**Prosodic Voice-Feature Extraction Engine.** This engine extracts, in-process on the server and only after on-page disclosure to the member, a prosodic feature vector from recorded spoken answers: fundamental-frequency estimation by a cumulative-mean-normalized-difference (YIN-family) method over fixed 50-millisecond analysis frames with a silent-frame energy gate to suppress false pitch in silence, plus speaking rate, pause count and duration statistics, hesitation frequency, jitter, shimmer, spectral centroid, and RMS energy, persisted per assessment; the raw audio never leaves the server for this analysis. *Implementation:* `server/patents/voiceFeatures.ts; voice_features table (migration 0030)`.

**Eight-Model Consensus Scoring Engine.** This engine scores each of the 32 intelligence lines by fanning the member's responses to a panel of eight independent AI models in parallel over a typed compute fabric, discarding the single highest and single lowest raw score per line (trimmed-mean outlier guard), and combining the survivors under the calibration-weighted consensus bus, in which each model's weight on each line is derived from its accumulated historical distance from the settled panel consensus (equal-weight cold start until a minimum sample count is reached), yielding a per-line score and an agreement-derived confidence. *Implementation:* `server/scoring/consensus.ts; server/patents/calibrationBus.ts; server/patents/computeFabric.ts`.

**Transparency and Tamper-Evident Audit Engine.** This engine discloses to the member every input that produced the emergent result and commits the result to an append-only, hash-chained audit ledger in which each entry's hash commits to the previous entry's hash plus the canonical serialization of its own payload, so any after-the-fact edit, deletion, or reordering of history breaks verification from that point forward; chain validity is publicly checkable and the chain head is exportable for external anchoring. *Implementation:* `server/patents/ledger.ts; /api/ledger/verify; /api/ledger/head`.

**Cross-platform data path.** Member data crosses platforms only over the authenticated integration API (/api/v1/joinaqal/*): eight versioned REST endpoints, session-authenticated, fail-closed on authentication errors, every response scoped to the authenticated member. *Implementation:* `server/integrationApi.ts` (JoinAQAL side, operating).

**Shared substrate.** The combination inherits: the append-only audit ledger (each combined output is committed to a hash-chained ledger whose validity is publicly verifiable end to end); the calibration-weighted consensus bus (per-model, per-dimension weights derived from accumulated distance to the settled panel consensus, with an equal-weight cold start); dimension isolation (per-dimension frozen views make cross-dimension reads impossible by construction during scoring); verified achievement floors (a per-line floor that only rises, set by the repeated-demonstration rule (the minimum of two independently demonstrated scores at adequate confidence)); research provenance (each of the 32 lines is mapped in a database table to the named research tradition and scholars grounding it, with DOI fields left null rather than fabricated).

## Implementation Status

IMPLEMENTATION STATUS (honest enablement). This is a CROSS-COMPANY combination. The JoinAQAL surface is IMPLEMENTED AND OPERATING: eight versioned REST endpoints under /api/v1/joinaqal/* (assessment create/read, voice analysis, development tracking, weakness identification, coaching create/read, transparency), each authenticated fail-closed and scoped to the authenticated member, per the API Integration Specification v1.0. The Russell Capital Systems components named below are IMPLEMENTED in the separate RCS codebase (the Decade Machine engine and its modules). The cross-company ORCHESTRATION that joins the two running systems into one deployed product is SPECIFIED but not yet deployed as a single operating system, and no filing should claim that the combined system runs in production today.

## Safety and Compliance

SAFETY AND COMPLIANCE GATES. Every output of the claimed combination is produced under the platform's standing gates: outputs are educational and non-clinical; all inputs to each emergent result are disclosed to the member; no medical, diagnostic, or treatment claims are made; and voice-derived analysis, where present, is disclosed on-page before capture, with audio processed in-process on the server and never transmitted to third parties for this analysis.

## Claims (DRAFT — for attorney revision)

1. A computer-implemented method for producing an emergent cross-platform result, the method comprising: retrieving, over an authenticated, versioned application programming interface in which every response is scoped to the authenticated member and authentication failures are rejected fail-closed, member data produced by: (a) extracting, in-process on the server and only after on-page disclosure to the member, a prosodic feature vector from recorded spoken answers: fundamental-frequency estimation by a cumulative-mean-normalized-difference (YIN-family) method over fixed 50-millisecond analysis frames with a silent-frame energy gate to suppress false pitch in silence, plus speaking rate, pause count and duration statistics, hesitation frequency, jitter, shimmer, spectral centroid, and RMS energy, persisted per assessment; the raw audio never leaves the server for this analysis; (b) scoring each of the 32 intelligence lines by fanning the member's responses to a panel of eight independent AI models in parallel over a typed compute fabric, discarding the single highest and single lowest raw score per line (trimmed-mean outlier guard), and combining the survivors under the calibration-weighted consensus bus, in which each model's weight on each line is derived from its accumulated historical distance from the settled panel consensus (equal-weight cold start until a minimum sample count is reached), yielding a per-line score and an agreement-derived confidence; (c) disclosing to the member every input that produced the emergent result and commits the result to an append-only, hash-chained audit ledger in which each entry's hash commits to the previous entry's hash plus the canonical serialization of its own payload, so any after-the-fact edit, deletion, or reordering of history breaks verification from that point forward; chain validity is publicly checkable and the chain head is exportable for external anchoring; (d) providing the retrieved data to the Decade Machine household-profile intake and module-triage layer (shared/ultraEngine.ts; server/ultraAI.ts); (e) combining the platforms' outputs into a single emergent result not produced by either platform alone; and (f) committing the emergent result, with a disclosure of every input, to an append-only hash-chained audit ledger.

2. The method of claim 1, wherein the audit ledger's validity is verifiable end to end by recomputing every link of the hash chain, and the current chain head is exportable for external anchoring by hardware signature, trusted timestamp, or public chain.

3. The method of claim 1, wherein every output is produced under standing safety gates comprising: educational and non-clinical outputs only; disclosure of all inputs to the member; and the making of no medical, diagnostic, or treatment claims.

4. The method of claim 1, wherein each panel model's per-dimension weight is derived from its accumulated distance to the settled panel consensus, with equal weighting until a minimum observation count is reached, and a trimmed-mean outlier guard retained beneath the weights.

5. The method of claim 1, wherein fundamental-frequency estimation applies a silent-frame energy gate that returns no pitch for frames below an energy threshold, preventing false pitch detection in silence, and wherein the raw audio never leaves the server for the claimed analysis.

6. The method of claim 1, wherein per-line verified floors are maintained by a repeated-demonstration rule under which a floor is set to the minimum of two scores demonstrated on separate completed assessments at or above a confidence threshold, and floors only rise.

7. A system comprising one or more processors and memory storing instructions that, when executed, cause the system to perform the method of claim 1.

8. A non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause performance of the method of claim 1.

## Nomenclature Note

NOMENCLATURE NOTE. Earlier planning documents prepared by the collaborating AI team enumerated emergent and super-emergent combinations under other working titles. Those documents were exchanged in chat and are not preserved verbatim in this repository; the combinations below are drafted directly from the implemented and specified systems themselves. Counsel should reconcile titles against any earlier enumerations before filing.

## Disclaimer

LEGAL STATUS AND DISCLAIMER. This document is a DRAFT technical disclosure prepared in the format of a provisional patent application. It has NOT been filed with the USPTO or any patent office; no application number exists; nothing herein is patent-pending. Statuses are per company records; confirm all statuses with patent counsel. This draft was prepared with AI assistance and is not legal advice. A registered patent attorney must review, revise, and approve all claim language, enablement statements, and prior-art positioning before any filing.
