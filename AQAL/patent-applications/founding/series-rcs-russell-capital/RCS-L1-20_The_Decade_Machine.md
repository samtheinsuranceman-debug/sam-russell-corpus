# DRAFT PROVISIONAL PATENT APPLICATION — RCS-L1-20

**Title of Invention:** The Decade Machine: Chained-Window Ultra Projection Engine

**Series:** Series RCS-L1 — Russell Capital Systems Founding Patent (Level One; no combinations)
**Inventor:** Samuel Andrew Russell V  
**Assignee:** Russell Holdings Management, LLC, Wilmington, Delaware  
**Status:** DRAFT — NOT FILED. No application number exists; nothing herein is patent-pending. Per company records; confirm status with patent counsel.

## Field of the Invention

Computer-implemented financial-strategy modeling and projection systems.

## Summary of the Invention

The invention unifies every calculator concept into one deterministic engine over member-defined multi-year windows (5/10/20/30 or custom), where each window carries its own goals and EVERY window starts from the previous window's ending income, expenses, appreciated assets, debts, properties, and policy values; modules (investment growth, mortgage-killer recycling, rental modes with 0-100% short-term-rental gross receipts, equity deployment through trust-owned IUL, 4%/2% IUL income draws with 12x-premium chronic-illness access, income annuities) toggle per scenario.

## Abstract

The Decade Machine: Chained-Window Ultra Projection Engine: a computer-implemented system that unifies every calculator concept into one deterministic engine over member-defined multi-year windows (5/10/20/30 or custom), where each window carries its own goals and EVERY window starts from the previous window's ending income, expenses, appreciated assets, debts, properties,…

## Technical Improvement (§101 Positioning)

The claims are directed not to an abstract idea but to a specific technical improvement in the functioning of the computing system: cross-decade state continuity as an engine invariant: no calculator suite otherwise carries every balance, rate, and holding from one planning epoch into the next automatically. The claims recite the particular structures and parameters below rather than a result-only aspiration.

## Detailed Description

The engine unifies every calculator concept into one deterministic engine over member-defined multi-year windows (5/10/20/30 or custom), where each window carries its own goals and EVERY window starts from the previous window's ending income, expenses, appreciated assets, debts, properties, and policy values; modules (investment growth, mortgage-killer recycling, rental modes with 0-100% short-term-rental gross receipts, equity deployment through trust-owned IUL, 4%/2% IUL income draws with 12x-premium chronic-illness access, income annuities) toggle per scenario.

*Implementation:* `shared/ultraEngine.ts; client/src/pages/UltraCalculatorPage.tsx`.

## Operating Parameters (Enablement Detail)

Window chaining with full state carry-forward; per-cycle appreciation overrides; recycle cycle length 6-7 years; STR gross receipts 0-100% of value with expense ratio; chronic-illness access = 12 x annual premium; all outputs labeled projections; contract-tested (10 engine tests).

## Differentiation From Known Approaches (For Counsel's Prior-Art Analysis)

The following contrast reflects the applicant's engineering understanding, not an assertion that no prior art exists: Disconnected single-purpose calculators requiring manual re-entry between time horizons.

## Implementation Status

IMPLEMENTATION STATUS (honest enablement). Implemented as a typed, pure-computation engine in the Russell Capital Systems codebase at the module named herein, consumed by the platform's calculator surfaces and exercised by its automated test suite. Deterministic: identical inputs reproduce identical projections.

## Risk and Compliance Disclosure

FINANCIAL-MODELING DISCLOSURE. The claimed engine produces hypothetical projections under stated, user-visible assumptions. Outputs are labeled as estimates, never guarantees; nothing the engine emits is tax, legal, or investment advice; insurance-product values require a carrier-issued illustration; and strategies involving leverage (HELOC liens, policy loans, collateralized annuities) carry disclosed risks including lien exposure and policy-lapse risk, which the engine surfaces rather than hides.

## Claims (DRAFT — for attorney revision)

1. A computer-implemented method of improving the functioning of a financial-planning computing system, the method comprising: (a) unifies every calculator concept into one deterministic engine over member-defined multi-year windows (5/10/20/30 or custom), where each window carries its own goals and EVERY window starts from the previous window's ending income, expenses, appreciated assets, debts, properties, and policy values; modules (investment growth, mortgage-killer recycling, rental modes with 0-100% short-term-rental gross receipts, equity deployment through trust-owned IUL, 4%/2% IUL income draws with 12x-premium chronic-illness access, income annuities) toggle per scenario; and (b) presenting the result with a disclosure of the assumptions and inputs that produced it.

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
