# DRAFT PROVISIONAL PATENT APPLICATION — AQAL-C-05

**Title of Invention:** Staged Weakness Identification Engine

**Series:** Series A — JoinAQAL Sister Combination (implemented; reduction to practice)
**Inventor:** Samuel Andrew Russell V  
**Assignee:** Russell Holdings Management, LLC, Wilmington, Delaware  
**Status:** DRAFT — NOT FILED. No application number exists; nothing herein is patent-pending. Per company records; confirm status with patent counsel.

## Cross-Reference to Related Disclosures

This combination builds on the AQAL core engine family (eight-model consensus scoring; prosodic voice analysis; controlling-weakness identification; verified achievement floors; versioned norming; research provenance) and the five shared components (append-only audit ledger; calibration-weighted consensus bus; parallel compute fabric; dimension isolation; voice-feature extraction), each separately documented in the company's technical disclosures.

## Field of the Invention

Computer-implemented psychometric assessment and personal-development systems; tamper-evident audit of machine-generated assessments.

## Background

Single-instrument cognitive assessments produce point estimates with no audit trail, no verified lower bounds, and no mechanical link from a measured deficiency to the specific, evidence-supported interventions that address it.

## Summary of the Invention

The invention combines the following engines into a single coordinated pipeline: Developmental Stage-Band Estimator, Controlling-Weakness Identification Engine. The combination produces an emergent capability that no component produces alone, and every emergent result is disclosed to the member and committed to a tamper-evident hash-chained ledger. Under the KSR v. Teleflex framework, the claimed value rests on the combination producing synergistic effects a person of ordinary skill would not predict from the components individually — a position patent counsel must evaluate against prior art before filing.

## Detailed Description

**Developmental Stage-Band Estimator.** This engine places the member's composite profile into a developmental stage band under a fixed, versioned nine-stage rubric, so stage context is computed reproducibly from the same frozen rubric for every member rather than impressionistically. *Implementation:* `server/platform/stageFramework.ts; references/NineStageRubric.pdf`.

**Controlling-Weakness Identification Engine.** This engine deterministically identifies the single line that most constrains the member's profile by an argmin over the 32-dimension score vector and quantifies its constraint impact as the distance of the weakest line below the profile mean, on the principle that a profile's outcome is capped by its scarcest input rather than its average. *Implementation:* `server/scoring/controllingWeakness.ts`.

**Combinator.** The combination executes as the `stagedWeakness` combinator (server/patents/combinations/index.ts), registered in the sister-combination registry (server/patents/combinations/registry.ts) and invoked in the production scoring pass over the real outputs of each scoring run.

**Shared substrate.** The combination inherits: the append-only audit ledger (each combined output is committed to a hash-chained ledger whose validity is publicly verifiable end to end); the calibration-weighted consensus bus (per-model, per-dimension weights derived from accumulated distance to the settled panel consensus, with an equal-weight cold start); dimension isolation (per-dimension frozen views make cross-dimension reads impossible by construction during scoring); verified achievement floors (a per-line floor that only rises, set by the repeated-demonstration rule (the minimum of two independently demonstrated scores at adequate confidence)); research provenance (each of the 32 lines is mapped in a database table to the named research tradition and scholars grounding it, with DOI fields left null rather than fabricated).

## Implementation Status

IMPLEMENTATION STATUS (honest enablement). The claimed combination is IMPLEMENTED AND OPERATING as a software embodiment in the JoinAQAL codebase: the combinator function named below executes in production immediately after each scoring run, over the real outputs of that run, and commits its emergent result to the tamper-evident audit ledger. This constitutes reduction to practice of the software embodiment. Hardware embodiments named in related specifications (FPGA co-processing, secure-enclave execution, HSM-signed ledger anchoring) are NOT built and are not claimed as operating.

## Safety and Compliance

SAFETY AND COMPLIANCE GATES. Every output of the claimed combination is produced under the platform's standing gates: outputs are educational and non-clinical; all inputs to each emergent result are disclosed to the member; no medical, diagnostic, or treatment claims are made; and voice-derived analysis, where present, is disclosed on-page before capture, with audio processed in-process on the server and never transmitted to third parties for this analysis.

## Claims (DRAFT — for attorney revision)

1. A computer-implemented method for producing an emergent cognitive-development result, the method comprising: (a) placing the member's composite profile into a developmental stage band under a fixed, versioned nine-stage rubric, so stage context is computed reproducibly from the same frozen rubric for every member rather than impressionistically; (b) deterministically identifying the single line that most constrains the member's profile by an argmin over the 32-dimension score vector and quantifies its constraint impact as the distance of the weakest line below the profile mean, on the principle that a profile's outcome is capped by its scarcest input rather than its average; (c) combining the outputs of steps (a)–(b) into a single emergent result not produced by any component engine alone; and (d) committing the emergent result, together with a disclosure of every input that produced it, to an append-only hash-chained audit ledger.

2. The method of claim 1, wherein the audit ledger's validity is verifiable end to end by recomputing every link of the hash chain, and the current chain head is exportable for external anchoring by hardware signature, trusted timestamp, or public chain.

3. The method of claim 1, wherein every output is produced under standing safety gates comprising: educational and non-clinical outputs only; disclosure of all inputs to the member; and the making of no medical, diagnostic, or treatment claims.

4. The method of claim 1, wherein the identified weakest dimension is reported with a constraint impact computed as the distance of the weakest dimension below the profile mean.

5. The method of claim 1, wherein per-line verified floors are maintained by a repeated-demonstration rule under which a floor is set to the minimum of two scores demonstrated on separate completed assessments at or above a confidence threshold, and floors only rise.

6. A system comprising one or more processors and memory storing instructions that, when executed, cause the system to perform the method of claim 1.

7. A non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause performance of the method of claim 1.

## Disclaimer

LEGAL STATUS AND DISCLAIMER. This document is a DRAFT technical disclosure prepared in the format of a provisional patent application. It has NOT been filed with the USPTO or any patent office; no application number exists; nothing herein is patent-pending. Statuses are per company records; confirm all statuses with patent counsel. This draft was prepared with AI assistance and is not legal advice. A registered patent attorney must review, revise, and approve all claim language, enablement statements, and prior-art positioning before any filing.
