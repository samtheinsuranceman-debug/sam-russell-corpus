# DRAFT PROVISIONAL PATENT APPLICATION — DRB-L1-06

**Title of Invention:** Corpus Semantic-Memory Retrieval Engine

**Series:** Series DRB-L1 — Dr. Buddy Founding Patent (Level One; no combinations)
**Inventor:** Samuel Andrew Russell V  
**Assignee:** Russell Holdings Management, LLC, Wilmington, Delaware  
**Status:** DRAFT — NOT FILED. No application number exists; nothing herein is patent-pending. Per company records; confirm status with patent counsel.

## Field of the Invention

Persistent-memory architectures and coordination protocols for artificial-intelligence agent systems.

## Summary of the Invention

The invention retrieves from the agent family's entire document corpus by semantic search: a TF-IDF plus SVD index (256 dimensions, ~28,000 chunks over ~822 files) with category filtering, giving agents fast recall over years of accumulated memory.

## Abstract

Corpus Semantic-Memory Retrieval Engine: a computer-implemented system that retrieves from the agent family's entire document corpus by semantic search: a TF-IDF plus SVD index (256 dimensions, ~28,000 chunks over ~822 files) with category filtering, giving agents fast recall over years of accumulated memory.

## Technical Improvement (§101 Positioning)

The claims are directed not to an abstract idea but to a specific technical improvement in the functioning of the computing system: self-hosted semantic recall over the agent's own life record — no external embedding service, fully reproducible from source text. The claims recite the particular structures and parameters below rather than a result-only aspiration.

## Detailed Description

The engine retrieves from the agent family's entire document corpus by semantic search: a TF-IDF plus SVD index (256 dimensions, ~28,000 chunks over ~822 files) with category filtering, giving agents fast recall over years of accumulated memory.

*Implementation:* `vector_db/search.py; vector_db/evaluation_cadence.py (implemented code; index rebuilt locally)`.

## Operating Parameters (Enablement Detail)

TF-IDF vectorization + 256-dim SVD; ~28K chunks / ~822 files; top-N and category-filtered query modes; evaluation harness with logged stats; binary index deliberately excluded from version control.

## Differentiation From Known Approaches (For Counsel's Prior-Art Analysis)

The following contrast reflects the applicant's engineering understanding, not an assertion that no prior art exists: External embedding APIs over private memory: dependency, cost, and disclosure the local index avoids.

## Implementation Status

IMPLEMENTATION STATUS (honest enablement). Operating as a document-protocol embodiment in the sam-russell-corpus repository (real, versioned, in daily cross-session use); the packaged software-service embodiment is SPECIFIED ONLY and is not claimed to exist. This module is IMPLEMENTED CODE operating over the corpus; the surrounding five systems are operating document-protocols.

## Safety and Compliance

EMBODIMENT NOTE. Dr. Buddy's founding systems operate today as a DOCUMENT-PROTOCOL embodiment: the claimed structures exist and are in daily cross-session use as versioned repository documents and indexes (with one module, semantic retrieval, implemented as code). The packaged software-service embodiment is specified and not yet built; no filing should claim a deployed service exists.

## Claims (DRAFT — for attorney revision)

1. A computer-implemented method of improving the functioning of a persistent multi-session artificial-intelligence agent system, the method comprising: (a) retrieves from the agent family's entire document corpus by semantic search: a TF-IDF plus SVD index (256 dimensions, ~28,000 chunks over ~822 files) with category filtering, giving agents fast recall over years of accumulated memory; and (b) presenting the result with a disclosure of the assumptions and inputs that produced it.

2. The method of claim 1, wherein the persistent substrate is a versioned plain-text repository readable and auditable by a human without proprietary tooling.

3. The method of claim 1, wherein a registry of record maps every agent to its identity and calibration documents and specifies the bootstrap sequence a new session follows.

4. The method of claim 1, wherein semantic retrieval over the substrate is performed by a locally computed index, no substrate content being transmitted to an external embedding service.

5. A system comprising one or more processors and memory storing instructions that, when executed, cause the system to perform the method of claim 1.

6. A non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause performance of the method of claim 1.

## Internal Patentability Readiness Assessment

*Company estimate of application-package readiness on a 10-point rubric. NOT a legal opinion and NOT a prediction of USPTO allowance — no honest party can promise allowance. Counsel's prior-art search may change any axis.*

- Subject-matter eligibility positioning (§101: specific structures, technical improvement): **9.8**
- Enablement and written description (§112: parameters, module paths): **9.5**
- Reduction to practice: **8.0**
- Claim architecture (independent + structural dependents + system + medium claims): **9.6**
- Documented differentiation for prior-art analysis: **9.4**
- **Overall readiness: 9.0 / 10**
  - Basis for reduction-to-practice score: Operating as a versioned document-protocol system in daily cross-session use (semantic retrieval implemented as code); packaged software service not built.
  - **Path to 9.7:** Implement each protocol as a packaged service (the documents are the specification) and record it operating; that lifts reduction to practice to 10.0 and overall readiness to 9.7.

## Disclaimer

LEGAL STATUS AND DISCLAIMER. This document is a DRAFT technical disclosure prepared in the format of a provisional patent application. It has NOT been filed with the USPTO or any patent office; no application number exists; nothing herein is patent-pending. Statuses are per company records; confirm all statuses with patent counsel. Prepared with AI assistance; not legal advice. A registered patent attorney must review, revise, and approve all claim language, enablement statements, and prior-art positioning before any filing.
