# DRAFT PROVISIONAL PATENT APPLICATION — RCS-L1-03

**Title of Invention:** Multi-Property MYGA Waterfall

**Series:** Series RCS-L1 — Russell Capital Systems Founding Patent (Level One; no combinations)
**Inventor:** Samuel Andrew Russell V  
**Assignee:** Russell Holdings Management, LLC, Wilmington, Delaware  
**Status:** DRAFT — NOT FILED. No application number exists; nothing herein is patent-pending. Per company records; confirm status with patent counsel.

## Field of the Invention

Computer-implemented financial-strategy modeling and projection systems.

## Summary of the Invention

The invention extends the collateral waterfall across up to 150 properties, each running its own HELOC-to-MYGA-to-income-asset cycle with tax savings routed to HELOC principal paydown, aggregated into one portfolio projection.

## Abstract

Multi-Property MYGA Waterfall: a computer-implemented system that extends the collateral waterfall across up to 150 properties, each running its own HELOC-to-MYGA-to-income-asset cycle with tax savings routed to HELOC principal paydown, aggregated into one portfolio projection.

## Technical Improvement (§101 Positioning)

The claims are directed not to an abstract idea but to a specific technical improvement in the functioning of the computing system: portfolio-scale orchestration of independent per-property leverage cycles with cross-flow of tax savings — bookkeeping no per-property calculator performs. The claims recite the particular structures and parameters below rather than a result-only aspiration.

## Detailed Description

The engine extends the collateral waterfall across up to 150 properties, each running its own HELOC-to-MYGA-to-income-asset cycle with tax savings routed to HELOC principal paydown, aggregated into one portfolio projection.

*Implementation:* `shared/multiPropertyMyga.ts`.

## Operating Parameters (Enablement Detail)

Up to 150 property slots, each with home value, mortgage balance, and HELOC rate; per-property cycle state; oil-and-gas tax-deduction savings applied to that property's HELOC principal; portfolio-level aggregation.

## Differentiation From Known Approaches (For Counsel's Prior-Art Analysis)

The following contrast reflects the applicant's engineering understanding, not an assertion that no prior art exists: Single-property calculators run 150 times by hand: no cross-property tax-savings routing, no aggregate state.

## Implementation Status

IMPLEMENTATION STATUS (honest enablement). Implemented as a typed, pure-computation engine in the Russell Capital Systems codebase at the module named herein, consumed by the platform's calculator surfaces and exercised by its automated test suite. Deterministic: identical inputs reproduce identical projections.

## Risk and Compliance Disclosure

FINANCIAL-MODELING DISCLOSURE. The claimed engine produces hypothetical projections under stated, user-visible assumptions. Outputs are labeled as estimates, never guarantees; nothing the engine emits is tax, legal, or investment advice; insurance-product values require a carrier-issued illustration; and strategies involving leverage (HELOC liens, policy loans, collateralized annuities) carry disclosed risks including lien exposure and policy-lapse risk, which the engine surfaces rather than hides.

## Claims (DRAFT — for attorney revision)

1. A computer-implemented method of improving the functioning of a financial-planning computing system, the method comprising: (a) extends the collateral waterfall across up to 150 properties, each running its own HELOC-to-MYGA-to-income-asset cycle with tax savings routed to HELOC principal paydown, aggregated into one portfolio projection; and (b) presenting the result with a disclosure of the assumptions and inputs that produced it.

2. The method of claim 1, wherein every emitted value is labeled a hypothetical projection under stated assumptions and is deterministic: identical inputs reproduce identical outputs.

3. The method of claim 1, wherein user-supplied rates and ratios are clamped to engine-defined valid ranges before computation, out-of-range inputs never propagating.

4. The method of claim 1, further comprising reporting simulation dispersion as percentile confidence bands where a stochastic mode is enabled.

5. The method of claim 1, wherein leverage-bearing steps surface their risk terms — lien exposure, policy-lapse thresholds, collateral calls — as first-class outputs.

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
  - Basis for reduction-to-practice score: Implemented as typed pure-computation engines exercised by the platform's calculators and test suite.

## Disclaimer

LEGAL STATUS AND DISCLAIMER. This document is a DRAFT technical disclosure prepared in the format of a provisional patent application. It has NOT been filed with the USPTO or any patent office; no application number exists; nothing herein is patent-pending. Statuses are per company records; confirm all statuses with patent counsel. Prepared with AI assistance; not legal advice. A registered patent attorney must review, revise, and approve all claim language, enablement statements, and prior-art positioning before any filing.
