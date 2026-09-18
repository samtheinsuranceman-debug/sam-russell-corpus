# Plan Reconciliation — the Consolidation Plan vs. the Measured Audit

Two independent assessments of the same 688-page build now exist:

- **`CONSOLIDATION_PLAN.json`** (corpus `russell-capital/`): 687 rows; Tier, Score, Verdict, Layer, Hierarchy Role,
  Parent, client story, discovery questions, *Enhance / Raise Score*, *Your Decision*. Scored by reading each page's
  **purpose and controls** ("WIRED — 14 ctrls; 12 backend calls"). **Every `Your Decision` is `None`** — nothing is decided yet.
- **`PAGE_AUDIT_688.md` / `.csv`** (this audit): 688 pages; static analysis of each page's **math and data**, with
  integrity flags for undeclared variables, frozen charts, literal chart data and fabricated constants.

They join **687 / 687** by page name. They disagree by **4.54 points on average** (plan mean 6.95, measured mean 2.45).
The disagreement is not noise — it is two different questions. The plan asks *what should this page be?*
The audit asks *does this page work today?* Use the plan for destination, the audit for readiness.

## Scoreboard

| Bucket | Pages | Meaning |
|---|---:|---|
| **A. Plan ≥ 8, page has a blocking defect** | **43** | Plan scored a page 8–10 that reads an undeclared variable, has a frozen chart, or bakes in product outperformance. **The plan did not see the code.** |
| B. Plan ≥ 8, no defect, measured < 5 | 138 | Right topic, thin or unwired build. The plan's *Enhance* column and the audit's *upgrade* column both apply. |
| C. Plan says CUT / ABSORB, measured ≥ 6 | 0 | Rescue candidates. **None.** The plan's cut list is safe to act on. |
| D. Clear agreement (both ≥ 7, or both < 4) | 119 | No adjudication needed. |

## A. The dangerous forty-three

These are the pages a client would trust most and should trust least. Sorted by plan score.

| Plan | Measured | Page | Route | Defect |
|---:|---:|---|---|---|
| 10.0 | 4.0 | ClientIntakeInterview | `/portal/client-intake` | frozen-chart |
| 10.0 | 4.0 | EstateDocumentGenerator | `/portal/estate-document-gen` | frozen-chart |
| 10.0 | 4.6 | WithdrawalSequencing | `/portal/withdrawal-sequencing` | frozen-chart|fabricated-constant |
| 10.0 | 4.8 | MySlides | `/portal/my-slides` | frozen-chart |
| 10.0 | 5.4 | CarrierComparison | `/portal/carrier-comparison` | frozen-chart |
| 10.0 | 6.4 | QuickQuote | `/portal/quick-quote` | frozen-chart |
| 9.5 | 0.5 | BusinessValuationCalc | `/portal/business-valuation` | undeclared-var |
| 9.5 | 0.5 | InstallmentSaleCalc | `/portal/installment-sale` | undeclared-var|fabricated-constant |
| 9.5 | 0.5 | SuccessionPlanCalc | `/portal/succession-plan` | undeclared-var |
| 9.5 | 0.5 | Education529VsIULCalc | `/portal/529-vs-iul` | undeclared-var|fabricated-constant |
| 9.5 | 0.5 | EmergencyFundVsIULCalc | `/portal/emergency-fund-vs-iul` | undeclared-var |
| 9.3 | 4.9 | ReferralTracking | `/portal/referral-tracking` | frozen-chart |
| 9.0 | 0.5 | BackdoorRothCalc | `/portal/backdoor-roth` | undeclared-var|fabricated-constant |
| 9.0 | 0.5 | CapitalGainsTaxCalc | `/portal/capital-gains-tax` | undeclared-var |
| 9.0 | 0.5 | MegaBackdoorRothCalc | `/portal/mega-backdoor-roth` | undeclared-var|fabricated-constant|baked-outperformance |
| 9.0 | 0.5 | NUACalculator | `/portal/nua-calculator` | undeclared-var|fabricated-constant |
| 9.0 | 0.5 | RMDCalculator | `/portal/rmd-calculator` | undeclared-var|fabricated-constant |
| 9.0 | 0.5 | TaxEquivalentYieldCalc | `/portal/tax-equivalent-yield` | undeclared-var |
| 9.0 | 0.5 | TaxGainLossCalc | `/portal/gain-loss-harvesting` | undeclared-var |
| 9.0 | 0.5 | TaxLossHarvestCalc | `/portal/tax-loss-harvest-calc` | frozen-chart|undeclared-var |
| 8.9 | 0.5 | OwnOccDisabilityCalc | `/portal/own-occ-disability` | frozen-chart|fabricated-constant|literal-chart-data |
| 8.7 | 0.5 | SpecialNeedsTrustCalc | `/portal/special-needs-trust` | undeclared-var |
| 8.5 | 0.5 | IDRComparisonCalc | `/portal/idr-comparison` | frozen-chart|fabricated-constant |
| 8.5 | 0.5 | PensionVsLumpSumCalc | `/portal/pension-vs-lump-sum` | undeclared-var |
| 8.4 | 0.5 | BackdoorRothGuide | `—` | frozen-chart |
| 8.4 | 0.5 | SafeWithdrawalCalc | `/portal/safe-withdrawal-rate` | undeclared-var |
| 8.4 | 4.6 | ScenarioSideBySide | `/portal/scenario-side-by-side` | frozen-chart|literal-chart-data |
| 8.4 | 5.9 | IndexBacktester | `/portal/index-backtester` | frozen-chart|literal-chart-data |
| 8.4 | 6.0 | ClientHealthDashboard | `/portal/client-health` | frozen-chart |
| 8.2 | 5.2 | CompetitiveAnalysis | `/portal/competitive` | frozen-chart |
| 8.1 | 0.5 | GRATCalculator | `/portal/grat-calculator` | undeclared-var |
| 8.1 | 0.5 | SLATDeepDive | `/portal/slat-deep-dive` | frozen-chart |
| 8.1 | 3.2 | EducationHub | `/portal/education` | frozen-chart |
| 8.0 | 4.0 | WorkflowAutomations | `/portal/workflow-automations` | frozen-chart |
| 8.0 | 4.2 | ComplianceAlerts | `/portal/compliance-alerts` | frozen-chart |
| 8.0 | 4.8 | ComplianceAuditCenter | `/portal/compliance-audit` | frozen-chart |
| 8.0 | 5.0 | ComplianceMonitoringDashboard | `/portal/compliance-monitoring` | frozen-chart |
| 8.0 | 5.5 | OwnerWarRoom | `/portal/command-center` | frozen-chart |
| 8.0 | 5.5 | StaleDigest | `/portal/stale-digest` | frozen-chart |
| 8.0 | 5.6 | AdvisorySummary | `/portal/advisory-summary` | frozen-chart |
| 8.0 | 5.9 | AuditTimeline | `/portal/audit-timeline` | frozen-chart |
| 8.0 | 5.9 | InflationAnalysis | `/portal/inflation` | frozen-chart |
| 8.0 | 6.0 | ClientEngagementScore | `/portal/engagement-score` | frozen-chart |

## The hub disagreement — the plan's 41 PARENT pages

The plan nominates 41 pages as PARENTs (hubs other pages toggle beneath). The audit agrees with the top of that list
— MortgageKiller, MultiGenWealthTransfer, RothConversionSTR, IllustrationCompare, MedicareIRMAA — and disagrees hard
with the bottom: **22 of 41 measure under 2.5, and 9 are defective.** A hub built on `AMTCalculator`
(always models $250,000 regardless of input) or `BusinessValuationCalc` (undeclared variable) would put the platform's
weakest code at the top of its navigation. **Recommendation: accept the plan's PARENTs with measured value ≥ 5; demote the rest to children until repaired.**

| Measured | Plan | Page | Measured hub | Defect |
|---:|---:|---|---|---|
| 9.2 | 9.5 | MortgageKiller | Mortgage & Debt Elimination | — |
| 8.7 | 10.0 | MultiGenWealthTransfer | Estate, Trust & Legacy | — |
| 8.5 | 10.0 | RothConversionSTR | Tax Strategy | — |
| 8.0 | 10.0 | IllustrationCompare | IUL & Policy Engineering | — |
| 8.0 | 10.0 | MedicareIRMAA | Tax Strategy | — |
| 8.0 | 10.0 | TaxLossHarvestingScanner | Tax Strategy | — |
| 7.6 | 10.0 | SuccessionPlanningWizard | Estate, Trust & Legacy | — |
| 7.2 | 10.0 | PremiumFinancing | IUL & Policy Engineering | — |
| 6.9 | 10.0 | EstateFlowChart | Estate, Trust & Legacy | literal-chart-data |
| 6.7 | 9.5 | RetirementIncomeProjection | Retirement Income & Drawdown | fabricated-constant |
| 6.6 | 10.0 | SalesStoryBuilder | Advisor Practice & Sales Enablement | — |
| 6.4 | 10.0 | ReverseHeloc | Mortgage & Debt Elimination | — |
| 6.0 | 10.0 | EstateTax | Tax Strategy | — |
| 5.5 | 10.0 | PolicyReviewChecklist | IUL & Policy Engineering | — |
| 5.4 | 10.0 | SeminarGenerator | Advisor Practice & Sales Enablement | literal-chart-data |
| 4.8 | 10.0 | ExistingAnnuities | Insurance, Annuity & Carrier | literal-chart-data |
| 4.6 | 10.0 | WithdrawalSequencing | Retirement Income & Drawdown | frozen-chart|fabricated-constant |
| 2.5 | 10.0 | CaptiveInsuranceIUL | IUL & Policy Engineering | — |
| 2.5 | 9.0 | SocialSecurityBridge | Retirement Income & Drawdown | — |
| 2.1 | 10.0 | LivingBenefitsProbability | Cross-Cutting Reference Library | — |
| 1.8 | 9.1 | SplitDollarLifeInsurance | Insurance, Annuity & Carrier | — |
| 1.5 | 9.5 | BuySellFundingCalc | Business & Succession | — |
| 1.5 | 9.5 | DeferredCompCalc | Business & Succession | — |
| 1.5 | 9.5 | KeyPersonInsuranceCalc | Business & Succession | — |
| 1.5 | 9.5 | OverheadExpenseCalc | Cross-Cutting Reference Library | — |
| 1.5 | 9.0 | QBICalculator | Tax Strategy | — |
| 1.5 | 6.5 | OpportunityZoneCalc | Tax Strategy | — |
| 1.4 | 8.4 | TaxDeferredExchangeTimeline | Tax Strategy | — |
| 0.7 | 8.7 | ILITCalculator | Estate, Trust & Legacy | fabricated-constant |
| 0.6 | 8.1 | CharitableLeadTrustEngine | Tax Strategy | fabricated-constant |
| 0.5 | 9.7 | PrivatePlacementLifeInsurance | Insurance, Annuity & Carrier | fabricated-constant |
| 0.5 | 9.5 | BusinessValuationCalc | Business & Succession | undeclared-var |
| 0.5 | 9.5 | Education529VsIULCalc | Scenario Lab & Comparison | undeclared-var|fabricated-constant |
| 0.5 | 8.7 | QPRTCalculator | Cross-Cutting Reference Library | fabricated-constant |
| 0.5 | 8.5 | IDRComparisonCalc | Scenario Lab & Comparison | frozen-chart|fabricated-constant |
| 0.5 | 8.5 | PensionVsLumpSumCalc | Retirement Income & Drawdown | undeclared-var |
| 0.5 | 8.1 | GRATCalculator | Estate, Trust & Legacy | undeclared-var |
| 0.5 | 8.1 | IDGTAdvancedModeler | Cross-Cutting Reference Library | fabricated-constant |
| 0.5 | 8.1 | SLATDeepDive | Estate, Trust & Legacy | frozen-chart |
| 0.5 | 6.5 | AMTCalculator | Tax Strategy | undeclared-var|fabricated-constant |
| 0.5 | 5.9 | CashBalancePlanCalc | Cross-Cutting Reference Library | frozen-chart |

## B. Right topic, thin build — top twenty

| Plan | Measured | Page | Plan's *Enhance* | Audit's *upgrade* |
|---:|---:|---|---|---|
| 10.0 | 1.8 | PracticeWealthSync | To 10: add a discovery question to open the conversation. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 10.0 | 4.8 | ExistingAnnuities | To 10: add a discovery question to open the conversation. | add branded PDF export with sources and method notes ; register in `pageRegistry.ts` with  |
| 10.0 | 4.5 | EcologicalDrivers | To 10: tie the output explicitly to an IUL solution. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 10.0 | 2.1 | LivingBenefitsProbability | To 10: add a discovery question to open the conversation. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 10.0 | 2.5 | CaptiveInsuranceIUL | To 10: add a discovery question to open the conversation. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 10.0 | 4.2 | FIACollateralStrategy | To 10: wire it to live client/carrier data. | add a tRPC procedure so scenarios save against the client record ; widen inputs to a full  |
| 10.0 | 2.5 | PremiumFinancingArbitrage | To 10: add a discovery question to open the conversation. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 10.0 | 0.5 | ReverseMortgageCalc | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.7 | 0.5 | PrivatePlacementLifeInsurance | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.6 | 4.3 | VideoProposalGenerator | To 10: add a discovery question to open the conversation. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 1.5 | BuySellFundingCalc | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 1.5 | DeferredCompCalc | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 1.5 | EntityComparisonCalc | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 1.5 | KeyPersonInsuranceCalc | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 1.5 | OverheadExpenseCalc | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 4.6 | MYGAFixedRate | To 10: wire it to live client/carrier data. | add a tRPC procedure so scenarios save against the client record ; widen inputs to a full  |
| 9.5 | 2.5 | IULComplianceEngine | To 10: add a market-vs-IUL outcome chart. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 1.3 | IULMaxFundedEngine | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 1.8 | InfinityBankingConcept | To 10: wire it to live client/carrier data. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |
| 9.5 | 2.1 | MultiCarrierIULOptimizer | To 10: add a market-vs-IUL outcome chart. | extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vite |

## Hub remap — the audit's 21 hubs onto the BASE's 10 real categories

The audit's hub paths (`/portal/tax-command`, `/portal/estate-command`, …) were invented for grouping. The BASE has a real
taxonomy: `shared/calculatorCatalog.ts` — **10 categories, 114 entries, path verified by test, read by the AI brain**
(`compositeMind.instrumentBlock()`). Each audit hub is mapped below to the BASE category where its pages actually landed (majority vote over pages present in both builds).

| Audit hub | → BASE category | Votes |
|---|---|---:|
| AI Brain & Intelligence | `practice` — Practice Tools | 1 |
| Admin, Ops & System | *(no page of this hub is catalogued on the BASE)* | 0 |
| Advisor Practice & Sales Enablement | `practice` — Practice Tools | 2 |
| Business & Succession | `business` — Business Owners | 1 |
| Client Management & CRM | `real-estate` — Real Estate & Property | 1 |
| Compliance & Supervision | *(no page of this hub is catalogued on the BASE)* | 0 |
| Cross-Cutting Reference Library | `markets` — Markets & Outside Forces | 1 |
| Discovery, Calibration & Onboarding | `diagnostics` — Diagnostics & Scoring | 1 |
| Education & Knowledge | *(no page of this hub is catalogued on the BASE)* | 0 |
| Engagement & Behavioral | *(no page of this hub is catalogued on the BASE)* | 0 |
| Estate, Trust & Legacy | `estate-legacy` — Estate & Legacy | 6 |
| IUL & Policy Engineering | `insurance` — Insurance & Policy | 3 |
| Insurance, Annuity & Carrier | `insurance` — Insurance & Policy | 6 |
| Investments & Portfolio | `markets` — Markets & Outside Forces | 3 |
| Mortgage & Debt Elimination | `real-estate` — Real Estate & Property | 4 |
| Public, Marketing & Legal | *(no page of this hub is catalogued on the BASE)* | 0 |
| Real Estate Intelligence | `real-estate` — Real Estate & Property | 2 |
| Reports & Deliverables | `diagnostics` — Diagnostics & Scoring | 1 |
| Retirement Income & Drawdown | `retirement-income` — What the money has to do once the earning stops, and in which order it comes out. | 7 |
| Risk, Divorce & Protection | `life-events` — Life Events | 1 |
| Scenario Lab & Comparison | `diagnostics` — Diagnostics & Scoring | 3 |
| Tax Strategy | `tax` — What is taken, when it is taken, and which of it is a choice rather than a rule. | 8 |

The BASE also carries two other partial taxonomies — 8 navigation groups in `AppShell.tsx` (76 of 320 routes) and 12
`sphere.ts` meridians (53 entries). **Recommendation: make the catalog category the single source, derive the nav groups
from it, and catalogue the 211 routes that are still missing.** `PAGE_UPGRADE_SPEC.md` §6's hub paths are superseded by this table.

## How to use the two documents together

1. **Bucket A first.** Repair or hide before anything else — these are confidently wrong in front of a client.
2. **Accept the plan's CUT / ABSORB list** (63 pages). The audit found nothing worth rescuing in it.
3. **Accept the plan's PARENTs with measured ≥ 5** (about a third). Demote the rest to children until their engine is extracted and tested.
4. **For bucket B**, the plan's *Enhance* says what the page should become; the audit's *upgrade* says what is missing from the code. Both are needed.
5. **Fill `Your Decision`.** All 687 are still `None`. The joined CSV beside this file carries both assessments per row so each decision can be made once.

Full join: `PLAN_RECONCILIATION.csv` (687 rows × plan columns + measured columns).