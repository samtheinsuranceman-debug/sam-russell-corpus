# DRAFT PROVISIONAL PATENT APPLICATION — JQ-L1-02

**Title of Invention:** Eight-Model Calibration-Weighted Consensus Scoring

**Series:** Series JQ-L1 — JoinAQAL Founding Patent (Level One; no combinations)
**Inventor:** Samuel Andrew Russell V  
**Assignee:** Russell Holdings Management, LLC, Wilmington, Delaware  
**Status:** DRAFT — NOT FILED. No application number exists; nothing herein is patent-pending. Per company records; confirm status with patent counsel.

## Field of the Invention

Computer-implemented psychometric assessment and personal-development systems; tamper-evident audit of machine-generated assessment.

## Summary of the Invention

The invention scores each line by fanning responses to a panel of eight independent AI models in parallel, discarding the single highest and lowest raw scores per line, and combining survivors under per-model per-dimension calibration weights accumulated from each model's historical distance to the settled panel consensus, with an equal-weight cold start and agreement-derived confidence.

## Abstract

Eight-Model Calibration-Weighted Consensus Scoring: a computer-implemented system that scores each line by fanning responses to a panel of eight independent AI models in parallel, discarding the single highest and lowest raw scores per line, and combining survivors under per-model per-dimension calibration weights accumulated from each model's historical distance t…

## Technical Improvement (§101 Positioning)

The claims are directed not to an abstract idea but to a specific technical improvement in the functioning of the computing system: a self-calibrating multi-model measurement architecture: reliability improves with use, per dimension, while the trim guard bounds any single model's influence. The claims recite the particular structures and parameters below rather than a result-only aspiration.

## Detailed Description

The engine scores each line by fanning responses to a panel of eight independent AI models in parallel, discarding the single highest and lowest raw scores per line, and combining survivors under per-model per-dimension calibration weights accumulated from each model's historical distance to the settled panel consensus, with an equal-weight cold start and agreement-derived confidence.

*Implementation:* `server/scoring/consensus.ts; server/patents/calibrationBus.ts; server/patents/computeFabric.ts`.

## Operating Parameters (Enablement Detail)

Trim active at >=4 contributors; weight w = 1/(meanAbsErr + 0.02); equal weight until n>=5 observations per model-line; confidence = 0.5 x mean model confidence + 0.5 x agreement; one calibration_update ledger digest per run.

## Measured Performance

- Full 8-model x 32-line combine: 0.11 ms (9,440/sec).
- Panel fan-out over the compute fabric: 7.9x parallel speedup (software backend).

Figures measured by the repository's benchmark harness (docs/PATENT_BENCHMARKS.md) on commodity container hardware, Node v22 — software-embodiment numbers, not hardware claims.

## Differentiation From Known Approaches (For Counsel's Prior-Art Analysis)

The following contrast reflects the applicant's engineering understanding, not an assertion that no prior art exists: Single-model scoring and unweighted ensembles: no per-model per-dimension calibration history, no cold-start guarantee, no retained trim guard beneath weights.

## Implementation Status

IMPLEMENTATION STATUS (honest enablement). Implemented and operating as a software embodiment in the JoinAQAL codebase at the modules named herein; exercised by the production scoring path and the automated test suite. Hardware embodiments named in related specifications (FPGA co-processing, secure enclaves, HSM ledger anchoring) are NOT built and are not claimed as operating.

## Safety and Compliance

SAFETY AND COMPLIANCE GATES. Outputs are educational and non-clinical; all inputs to each result are disclosed to the member; no medical, diagnostic, or treatment claims are made; voice-derived analysis is disclosed on-page before capture and audio is processed in-process on the server, never transmitted to third parties for this analysis.

## Claims (DRAFT — for attorney revision)

1. A computer-implemented method of improving the functioning of a cognitive-assessment computing system, the method comprising: (a) scores each line by fanning responses to a panel of eight independent AI models in parallel, discarding the single highest and lowest raw scores per line, and combining survivors under per-model per-dimension calibration weights accumulated from each model's historical distance to the settled panel consensus, with an equal-weight cold start and agreement-derived confidence; and (b) presenting the result with a disclosure of the assumptions and inputs that produced it.

2. The method of claim 1, further comprising committing the result to an append-only hash-chained audit ledger whose validity is verifiable end to end by recomputing every link, the chain head being exportable for external anchoring.

3. The method of claim 1, wherein profiles are stored under a fixed-width 32-dimension vector contract with unique indices and scores on [0,1], violating writes being rejected.

4. The method of claim 1, wherein every stored score is stamped with a frozen norming version such that recomputation under that version reproduces the identical result at any later time.

5. The method of claim 1, wherein all outputs are produced under standing gates comprising educational, non-clinical outputs; input disclosure; and no medical claims.

6. A system comprising one or more processors and memory storing instructions that, when executed, cause the system to perform the method of claim 1.

7. A non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause performance of the method of claim 1.

## Internal Patentability Readiness Assessment

*Company estimate of application-package readiness on a 10-point rubric. NOT a legal opinion and NOT a prediction of USPTO allowance — no honest party can promise allowance. Counsel's prior-art search may change any axis.*

- Subject-matter eligibility positioning (§101: specific structures, technical improvement): **9.8**
- Enablement and written description (§112: parameters, module paths): **9.8**
- Reduction to practice: **10.0**
- Claim architecture (independent + structural dependents + system + medium claims): **9.6**
- Documented differentiation for prior-art analysis: **9.4**
- **Overall readiness: 9.7 / 10**
  - Basis for reduction-to-practice score: Implemented and operating in the JoinAQAL production codebase.

## Disclaimer

LEGAL STATUS AND DISCLAIMER. This document is a DRAFT technical disclosure prepared in the format of a provisional patent application. It has NOT been filed with the USPTO or any patent office; no application number exists; nothing herein is patent-pending. Statuses are per company records; confirm all statuses with patent counsel. Prepared with AI assistance; not legal advice. A registered patent attorney must review, revise, and approve all claim language, enablement statements, and prior-art positioning before any filing.
