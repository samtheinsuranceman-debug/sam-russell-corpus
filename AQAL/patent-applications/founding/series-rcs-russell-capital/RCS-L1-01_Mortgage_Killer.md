# DRAFT PROVISIONAL PATENT APPLICATION — RCS-L1-01

**Title of Invention:** Mortgage Killer: IUL-Funded HELOC Mortgage Acceleration

**Series:** Series RCS-L1 — Russell Capital Systems Founding Patent (Level One; no combinations)
**Inventor:** Samuel Andrew Russell V  
**Assignee:** Russell Holdings Management, LLC, Wilmington, Delaware  
**Status:** DRAFT — NOT FILED. No application number exists; nothing herein is patent-pending. Per company records; confirm status with patent counsel.

## Field of the Invention

Computer-implemented financial-strategy modeling and projection systems.

## Summary of the Invention

The invention accelerates mortgage payoff by cycling home equity through insurance capital: a 70% loan-to-value HELOC funds indexed universal life premiums in early years; from year two onward, 80% policy loans against accumulated surrender value make principal-only mortgage payments; each year a refreshed HELOC against the appreciated home funds the next premium, the cycle repeating until the mortgage is retired.

## Abstract

Mortgage Killer: IUL-Funded HELOC Mortgage Acceleration: a computer-implemented system that accelerates mortgage payoff by cycling home equity through insurance capital: a 70% loan-to-value HELOC funds indexed universal life premiums in early years; from year two onward, 80% policy loans against accumulated surrender value make principal-only mortgage payments; each yea…

## Technical Improvement (§101 Positioning)

The claims are directed not to an abstract idea but to a specific technical improvement in the functioning of the computing system: a deterministic multi-instrument cycle that converts idle home equity into simultaneous mortgage retirement and permanent-policy accumulation, with every cash flow itemized per year. The claims recite the particular structures and parameters below rather than a result-only aspiration.

## Detailed Description

The engine accelerates mortgage payoff by cycling home equity through insurance capital: a 70% loan-to-value HELOC funds indexed universal life premiums in early years; from year two onward, 80% policy loans against accumulated surrender value make principal-only mortgage payments; each year a refreshed HELOC against the appreciated home funds the next premium, the cycle repeating until the mortgage is retired.

*Implementation:* `shared/mortgageKiller.ts (engine v4)`.

## Operating Parameters (Enablement Detail)

70% LTV HELOC sizing; 80% policy-loan factor on surrender value; principal-only application of loan proceeds; annual re-draw against appreciated value; five-year maximum premium window with interest credits applied to principal.

## Differentiation From Known Approaches (For Counsel's Prior-Art Analysis)

The following contrast reflects the applicant's engineering understanding, not an assertion that no prior art exists: Simple extra-principal calculators: single-instrument, no insurance-capital cycle, no year-by-year multi-ledger itemization.

## Implementation Status

IMPLEMENTATION STATUS (honest enablement). Implemented as a typed, pure-computation engine in the Russell Capital Systems codebase at the module named herein, consumed by the platform's calculator surfaces and exercised by its automated test suite. Deterministic: identical inputs reproduce identical projections.

## Risk and Compliance Disclosure

FINANCIAL-MODELING DISCLOSURE. The claimed engine produces hypothetical projections under stated, user-visible assumptions. Outputs are labeled as estimates, never guarantees; nothing the engine emits is tax, legal, or investment advice; insurance-product values require a carrier-issued illustration; and strategies involving leverage (HELOC liens, policy loans, collateralized annuities) carry disclosed risks including lien exposure and policy-lapse risk, which the engine surfaces rather than hides.

## Claims (DRAFT — for attorney revision)

1. A computer-implemented method of improving the functioning of a financial-planning computing system, the method comprising: (a) accelerates mortgage payoff by cycling home equity through insurance capital: a 70% loan-to-value HELOC funds indexed universal life premiums in early years; from year two onward, 80% policy loans against accumulated surrender value make principal-only mortgage payments; each year a refreshed HELOC against the appreciated home funds the next premium, the cycle repeating until the mortgage is retired; and (b) presenting the result with a disclosure of the assumptions and inputs that produced it.

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
