# Russell Capital Systems — 316-Page Audit

Generated from static analysis of every page in `client/src/pages`.
Every number below is measured, not estimated.

## Scoreboard

| Band | Pages | Share |
|---|---:|---:|
| 9-10 | 1 | 0.3% |
| 8 | 13 | 4.1% |
| 7 | 38 | 12.0% |
| 5-6 | 81 | 25.6% |
| 3-4 | 61 | 19.3% |
| 1-3 | 122 | 38.6% |

- **Mean value today: 4.33 / 10**
- **Mean value as built (before integrity penalties): 4.84 / 10**
- **Mean effectiveness (value × discoverability): 2.47 / 10**
- Pages with a URL: 309 — of which **231 are linked from nowhere**
- Pages with no route at all (dead files): 7

## Integrity findings

These are the reason the mean score is low. They are defects, not missing features.

| Pages | Defect |
|---:|---|
| 191 | `@ts-nocheck` — type checking disabled on the file |
| 29 | **Chart memo has empty dependencies** — the graph never moves when inputs change |
| 28 | Chart fed a hard-coded array — the picture is decorative, not computed |
| 11 | Invented constants marked *Simplified/Assumed* standing in for real IRS or product limits |

### Worked example — `portal/MegaBackdoorRothCalc.tsx`

```ts
const maxContribution = 20000;                  // 'Simplified IRS limit' — not the real §415(c) limit
const afterTaxContribution = annualIncome*0.10; // 'Assume 10% of income' — fabricated, not a user input
const futureValueIUL = effectiveContribution *
  Math.pow(1 + growthRate + 0.02, years);       // bakes in a 2% IUL advantage

const startVal = typeof portfolioValue !== 'undefined'
  ? portfolioValue : 1000000;                   // portfolioValue is NEVER declared in this file
...
}, []);                                         // empty deps — this chart never updates
```
`AMTCalculator.tsx:50` and `Budget503020Calc.tsx:43` carry the identical defect with
`primaryIncome` (always $250,000) and `annualIncome` (always $300,000). `@ts-nocheck`
is what allows these to compile.

## Disposition summary

| Action | Pages | Meaning |
|---|---:|---|
| UPGRADE or fold into library | 118 | Too thin to stand alone. Either invest to 9/10 or fold into the reference library. |
| EMBED — accordion section | 81 | Keeps its URL; appears as an expandable section inside its hub. |
| EMBED — reference card | 59 | Keeps its URL; appears as a linked card in the hub's reference rail. |
| EMBED — named tab | 49 | Keeps its URL; appears as a labelled tab inside its hub. |
| MERGE into canonical version | 6 | Duplicate version — fold into the canonical page and delete. |
| PROMOTE — hub / top nav | 3 | Becomes a destination in primary navigation. |

## The 21 hubs

Every one of the 688 pages keeps its URL. Only these 21 earn a navigation entry.

| Hub | Destination | Pages | Mean value | Best page |
|---|---|---:|---:|---|
| Mortgage & Debt Elimination | `/portal/mortgage-killer` | 22 | 5.6 | MortgageKiller (9.2) |
| IUL & Policy Engineering | `/portal/time-machine-calculator` | 15 | 5.2 | IULHistoricalPerformance (8.4) |
| Real Estate Intelligence | `/portal/real-estate-mogul` | 6 | 4.1 | RentalEnterprise (6.9) |
| Retirement Income & Drawdown | `/portal/ecological-drivers` | 12 | 5.1 | IncomeGapAnalyzer (8.0) |
| Tax Strategy | `/portal/tax-command` | 16 | 5.9 | RothConversionSTR (8.5) |
| Estate, Trust & Legacy | `/portal/estate-command` | 11 | 4.4 | MultiGenWealthTransfer (8.7) |
| Business & Succession | `/portal/business-command` | 2 | 6.8 | OwnerOversight (6.9) |
| Insurance, Annuity & Carrier | `/portal/carrier-command` | 21 | 5.2 | AnnuityMemory (7.6) |
| Investments & Portfolio | `/portal/portfolio-command` | 12 | 6.0 | MarketScenarioStressTest (7.9) |
| Scenario Lab & Comparison | `/portal/scenario-lab` | 10 | 5.5 | PredictiveAnalytics (8.0) |
| Risk, Divorce & Protection | `/portal/risk-command` | 3 | 1.8 | DivorceCalculator (4.3) |
| Discovery, Calibration & Onboarding | `/portal/onboarding` | 9 | 3.1 | GoalsBasedPlanning (6.1) |
| AI Brain & Intelligence | `/portal/ai-brain-hub` | 11 | 4.2 | AiStrategyRecommender (6.5) |
| Client Management & CRM | `/portal/clients` | 14 | 4.7 | HouseholdWealth (7.2) |
| Advisor Practice & Sales Enablement | `/portal/practice-command` | 32 | 4.9 | BatchSlides (8.0) |
| Compliance & Supervision | `/portal/compliance-center` | 11 | 5.2 | ComplianceExport (7.1) |
| Reports & Deliverables | `/portal/reports` | 9 | 5.2 | WebsiteUsage (7.5) |
| Education & Knowledge | `/portal/education` | 5 | 2.5 | EducationHub (3.2) |
| Engagement & Behavioral | `/portal/engagement` | 4 | 3.2 | ClientEngagementScore (6.0) |
| Admin, Ops & System | `/portal/admin` | 8 | 3.3 | Integrations (6.6) |
| Public, Marketing & Legal | `/` | 37 | 2.9 | ComponentShowcase (5.0) |
| Cross-Cutting Reference Library | `/portal/library` | 46 | 2.7 | ChainBuilder (7.3) |

---

# Page-by-page

`V` = value today (after integrity penalties). `B` = value as built. `E` = effectiveness
(value × discoverability). Every page below keeps its URL.


## Mortgage & Debt Elimination  ·  `/portal/mortgage-killer`  ·  22 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 9.2 | 9.6 | 9.2 | MortgageKiller | `/portal/mortgage-killer` | PROMOTE — hub / top nav | type checking disabled on the file |
| 7.8 | 8.2 | 3.5 | ClientDetail | `/portal/clients/:id` | EMBED — named tab → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.7 | 8.1 | 3.5 | ClientReportGenerator | `/portal/client-report-generator` | EMBED — named tab → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 7.5 | 7.9 | 3.4 | PolicyLoans | `/portal/policy-loans` | EMBED — named tab → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.4 | 7.8 | 7.4 | Clients | `/portal/clients` | EMBED — named tab → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 6.4 | 6.8 | 2.9 | ReverseHeloc | `/portal/reverse-heloc` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 6.0 | 7.9 | 2.7 | ClientHealthDashboard | `/portal/client-health` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.9 | 6.3 | 2.7 | ClientSelfServicePortal | `/portal/client-self-service` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.9 | 6.3 | 2.7 | ClientScorecard | `/portal/client-scorecard` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.7 | 6.1 | 5.7 | HouseRecyclingStrategy | `/portal/house-recycling` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 5.7 | 6.1 | 2.6 | ClientOnboardingAutomation | `/portal/client-onboarding-auto` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.6 | 7.2 | 2.5 | ClientComparison | `/portal/client-comparison` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.4 | 6.8 | 2.4 | ClientOnboardingWizard | `/portal/client-onboarding` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.1 | 5.5 | 2.3 | ClientPortal | `/portal/client-portal-config` | EMBED — accordion section → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.9 | 5.3 | 2.2 | ClientPortfolioDashboard | `/portal/client-portfolio` | EMBED — reference card → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 4.8 | 6.2 | 2.2 | ClientSnapshotMap | `/portal/client-snapshot` | EMBED — reference card → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 4.6 | 5.0 | 2.1 | ClientFiles | `/portal/client-files` | EMBED — reference card → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.5 | 5.0 | 4.5 | MortgageKillerV3 | `/portal/mortgage-killer-v3` | MERGE into canonical version → `MortgageKiller` | math inlined in the component — untestable, un-reusable, cannot be called by the AI brain. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.1 | 4.1 | 4.1 | MortgageLedger | `/portal/mortgage-ledger` | EMBED — reference card → `/portal/mortgage-killer` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 4.0 | 5.9 | 4.0 | ClientIntakeInterview | `/portal/client-intake` | EMBED — reference card → `/portal/mortgage-killer` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.9 | 3.9 | 1.8 | ClientPortalView | `/portal/retirement-projection` | EMBED — reference card → `/portal/mortgage-killer` | math inlined in the component — untestable, un-reusable, cannot be called by the AI brain. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.2 | 2.2 | 1.0 | MortgageKillerV2Page | `/portal/mortgage-killer-v2` | MERGE into canonical version → `MortgageKiller` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## IUL & Policy Engineering  ·  `/portal/time-machine-calculator`  ·  15 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 8.4 | 8.8 | 8.4 | IULHistoricalPerformance | `/portal/iul-historical` | EMBED — named tab → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 8.0 | 8.4 | 3.6 | IllustrationCompare | `/portal/illustration-compare` | EMBED — named tab → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.5 | 7.9 | 3.4 | PolicyReview | `/portal/policy-review` | EMBED — named tab → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 7.3 | 7.7 | 3.3 | AIPolicyReviewGap | `/portal/ai-policy-review` | EMBED — named tab → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 7.2 | 7.6 | 3.2 | PremiumFinancing | `/portal/premium-financing` | EMBED — named tab → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.0 | 7.4 | 3.1 | BatchIllustration | `/portal/batch-illustration` | EMBED — named tab → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.5 | 5.9 | 2.5 | PolicyReviewChecklist | `/portal/policy-review-checklist` | EMBED — accordion section → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.3 | 5.7 | 2.4 | TimeMachineMethod | `/portal/time-machine-method` | EMBED — accordion section → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 5.2 | 5.6 | 2.3 | TimeMachineAG49 | `/portal/time-machine-ag49` | EMBED — accordion section → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 5.1 | 5.5 | 2.3 | TimeMachineCalculator | `/portal/time-machine-calculator` | EMBED — accordion section → `/portal/time-machine-calculator` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 4.5 | 4.5 | 2.0 | PolicyCostLab | `/portal/policy-cost-lab` | EMBED — reference card → `/portal/time-machine-calculator` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.8 | 2.8 | 2.8 | IulEngine | `/portal/iul-engine` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.8 | 2.2 | 0.8 | TimeMachine | `/portal/time-machine` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.4 | 1.8 | 0.6 | TimeLapse | `/portal/time-lapse` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.3 | IulProjectionPage | `/portal/iul-projection` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Real Estate Intelligence  ·  `/portal/real-estate-mogul`  ·  6 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 6.9 | 6.9 | 6.9 | RentalEnterprise | `/portal/rental-enterprise` | EMBED — accordion section → `/portal/real-estate-mogul` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 5.7 | 8.3 | 5.7 | RealEstateMogul | `/portal/real-estate-mogul` | EMBED — accordion section → `/portal/real-estate-mogul` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 5.5 | 5.5 | 5.5 | ShortTermRentals | `/portal/short-term-rentals` | EMBED — accordion section → `/portal/real-estate-mogul` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 3.9 | 3.9 | 3.9 | STRStrategy | `/portal/str-strategy` | EMBED — reference card → `/portal/real-estate-mogul` | math inlined in the component — untestable, un-reusable, cannot be called by the AI brain. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.2 | 2.2 | 1.0 | STRTaxEliminatorPage | `/portal/str-tax-eliminator` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.3 | RealEstatePage | `/portal/real-estate` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Retirement Income & Drawdown  ·  `/portal/ecological-drivers`  ·  12 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 8.0 | 8.4 | 3.6 | IncomeGapAnalyzer | `/portal/income-gap` | EMBED — named tab → `/portal/ecological-drivers` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.0 | 8.4 | 3.1 | RetirementGuardrails | `/portal/retirement-guardrails` | EMBED — named tab → `/portal/ecological-drivers` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 6.9 | 7.3 | 3.1 | IncomeTimeline | `/portal/income-timeline` | EMBED — accordion section → `/portal/ecological-drivers` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 6.7 | 8.3 | 3.0 | RetirementIncomeProjection | `/portal/retirement-projection` | EMBED — accordion section → `/portal/ecological-drivers` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 5.3 | 5.3 | 2.4 | IncomeForLife | `/portal/income-for-life` | EMBED — accordion section → `/portal/ecological-drivers` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.0 | 5.4 | 2.2 | HotIncome | `/portal/hot-income` | EMBED — accordion section → `/portal/ecological-drivers` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 4.7 | 6.3 | 2.1 | SocialSecurityOptimizer | `/portal/social-security` | EMBED — reference card → `/portal/ecological-drivers` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 4.6 | 7.7 | 2.1 | WithdrawalSequencing | `/portal/withdrawal-sequencing` | EMBED — reference card → `/portal/ecological-drivers` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 4.5 | 5.9 | 4.5 | EcologicalDrivers | `/portal/ecological-drivers` | EMBED — reference card → `/portal/ecological-drivers` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.0 | 4.0 | 4.0 | SequencePlanner | `/portal/sequence-planner` | EMBED — reference card → `/portal/ecological-drivers` | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 3.7 | 3.7 | 1.7 | MechanismDetail | `/portal/mechanism/:slug` | EMBED — reference card → `/portal/ecological-drivers` | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 0.7 | 0.7 | 0.3 | RetirementOpportunitiesPage | `/portal/retirement-opportunities` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Tax Strategy  ·  `/portal/tax-command`  ·  16 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 8.5 | 8.9 | 8.5 | RothConversionSTR | `/portal/roth-conversion` | PROMOTE — hub / top nav | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 8.4 | 8.8 | 3.8 | CharitableGivingOptimizer | `/portal/charitable-giving` | EMBED — named tab → `/portal/tax-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 8.0 | 8.4 | 3.6 | MedicareIRMAA | `/portal/medicare-irmaa` | EMBED — named tab → `/portal/tax-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 8.0 | 8.4 | 3.6 | TaxBracketVisualizer | `/portal/tax-brackets` | EMBED — named tab → `/portal/tax-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 8.0 | 8.4 | 3.6 | TaxLossHarvestingScanner | `/portal/tax-loss-harvesting` | EMBED — named tab → `/portal/tax-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.7 | 8.1 | 3.5 | TaxOpportunityDetector | `/portal/tax-opportunities` | EMBED — named tab → `/portal/tax-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.3 | 8.7 | 7.3 | IULvsRoth | `/portal/iul-vs-roth` | EMBED — named tab → `/portal/tax-command` | type checking disabled on the file. **Fix:** register in `pageRegistry.ts` with intent tags so the AI brain can cite and deep-link it |
| 6.9 | 8.3 | 3.1 | TaxReturnUpload | `/portal/tax-return-upload` | EMBED — accordion section → `/portal/tax-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 6.5 | 7.9 | 2.9 | TaxAdvantagedGrowth | `/portal/retirement-projection` | EMBED — accordion section → `/portal/tax-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 6.5 | 6.9 | 2.9 | TaxWaterfall | `/portal/tax-waterfall` | EMBED — accordion section → `/portal/tax-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 6.0 | 6.4 | 2.7 | EstateTax | `/portal/estate-tax` | EMBED — accordion section → `/portal/tax-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 4.2 | 4.2 | 1.9 | TaxSchedule | `/portal/tax-schedule` | EMBED — reference card → `/portal/tax-command` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.5 | 3.5 | 1.6 | QbiOptimizer | `/portal/qbi-optimizer` | EMBED — reference card → `/portal/tax-command` | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 2.5 | 4.0 | 1.1 | ComboDetail | `/portal/tax-combos/:id` | UPGRADE or fold into library | chart memo has empty deps — the graph never changes when inputs change. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 1.1 | TaxFreeWealthCombos | `/portal/tax-combos` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 1.1 | 0.7 | TheBrotherhood | `/portal/the-brotherhood` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Estate, Trust & Legacy  ·  `/portal/estate-command`  ·  11 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 8.7 | 9.1 | 3.9 | MultiGenWealthTransfer | `/portal/multi-gen-wealth` | PROMOTE — hub / top nav | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 8.0 | 8.4 | 3.6 | BeneficiaryOptimization | `/portal/beneficiary-optimization` | EMBED — named tab → `/portal/estate-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.6 | 8.0 | 3.4 | SuccessionPlanningWizard | `/portal/succession-planning` | EMBED — named tab → `/portal/estate-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 6.9 | 8.3 | 3.1 | EstateFlowChart | `/portal/estate-flow` | EMBED — accordion section → `/portal/estate-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 4.4 | 4.8 | 2.0 | WillWriter | `/portal/will-writer` | EMBED — reference card → `/portal/estate-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.0 | 5.9 | 1.8 | EstateDocumentGenerator | `/portal/estate-document-gen` | EMBED — reference card → `/portal/estate-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.0 | 3.0 | 1.4 | Inheritance | `/portal/inheritance` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.6 | 2.6 | 2.6 | TrustsPage | `/portal/trusts` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.5 | 1.9 | 1.5 | TheLegacy | `/portal/the-legacy` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | EstatePlanningPage | `/portal/estate-planning` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.7 | TrustsPage | `/portal/trusts` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Business & Succession  ·  `/portal/business-command`  ·  2 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 6.9 | 7.3 | 3.1 | OwnerOversight | `/portal/owner-oversight` | EMBED — accordion section → `/portal/business-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.6 | 8.0 | 3.0 | BusinessOwnerPlanning | `/portal/business-owner` | EMBED — accordion section → `/portal/business-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |

## Insurance, Annuity & Carrier  ·  `/portal/carrier-command`  ·  21 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 7.6 | 8.0 | 3.4 | AnnuityMemory | `/portal/annuity-memory` | EMBED — named tab → `/portal/carrier-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.1 | 7.5 | 3.2 | AthenePEPlus15 | `/portal/athene-pe-plus15` | EMBED — named tab → `/portal/carrier-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 7.1 | 7.5 | 3.2 | IncomeAnnuityTop10 | `/portal/income-annuity-top10` | EMBED — named tab → `/portal/carrier-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 7.0 | 7.4 | 3.1 | CarrierQuotes | `/portal/quotes` | EMBED — named tab → `/portal/carrier-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.8 | 7.2 | 3.1 | AtheneGuaranteedIncome | `/portal/athene-guaranteed-income` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 6.7 | 7.1 | 3.0 | LifetimeGuaranteedIncome | `/portal/lifetime-income` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 6.7 | 7.1 | 3.0 | GrowthAnnuities | `/portal/growth-annuities` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 6.6 | 8.0 | 3.0 | FIATop10 | `/portal/fia-top10` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 6.4 | 6.8 | 6.4 | CarrierSettings | `/portal/carrier-settings` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.4 | 8.3 | 2.9 | QuickQuote | `/portal/quick-quote` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 6.1 | 6.5 | 2.7 | AnnuityAccumulationDB | `/portal/annuity-accumulation-db` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 5.7 | 7.1 | 2.6 | AxonicSP500 | `/portal/axonic-sp500` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 5.4 | 7.3 | 2.4 | CarrierComparison | `/portal/carrier-comparison` | EMBED — accordion section → `/portal/carrier-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 4.8 | 6.2 | 2.2 | ExistingAnnuities | `/portal/existing-annuities` | EMBED — reference card → `/portal/carrier-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 4.6 | 6.0 | 2.1 | MYGAFixedRate | `/portal/myga-fixed-rate` | EMBED — reference card → `/portal/carrier-command` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 4.2 | 4.6 | 1.9 | FIACollateralStrategy | `/portal/fia-collateral` | EMBED — reference card → `/portal/carrier-command` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 3.6 | 3.6 | 1.6 | LongTermCare | `/portal/long-term-care` | EMBED — reference card → `/portal/carrier-command` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.2 | 2.2 | 1.0 | CarrierRatings | `/portal/carrier-rates` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | IncomeAnnuityPage | `/portal/income-annuity` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | AnnuityExplorerPage | `/portal/annuity-explorer` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | MygaWaterfallPage | `/portal/myga-waterfall` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Investments & Portfolio  ·  `/portal/portfolio-command`  ·  12 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 7.9 | 8.3 | 3.6 | MarketScenarioStressTest | `/portal/market-stress-test` | EMBED — named tab → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.9 | 8.3 | 3.6 | PortfolioDriftMonitor | `/portal/portfolio-drift` | EMBED — named tab → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.7 | 8.1 | 3.5 | FeeTransparencyDashboard | `/portal/fee-transparency` | EMBED — named tab → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 7.6 | 9.0 | 7.6 | IbbotsonCharts | `/portal/ibbotson-charts` | EMBED — named tab → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** register in `pageRegistry.ts` with intent tags so the AI brain can cite and deep-link it |
| 7.2 | 8.6 | 3.2 | IndexStrategyComparison | `/portal/index-strategies` | EMBED — named tab → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** register in `pageRegistry.ts` with intent tags so the AI brain can cite and deep-link it |
| 7.0 | 7.4 | 3.1 | RebalanceAlerts | `/portal/rebalance` | EMBED — named tab → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 7.0 | 7.4 | 3.1 | CryptoCurrencyCorner | `/portal/crypto-corner` | EMBED — named tab → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 6.6 | 7.0 | 3.0 | SmartRebalancingAlerts | `/portal/smart-rebalancing` | EMBED — accordion section → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.9 | 7.8 | 5.9 | InflationAnalysis | `/portal/inflation` | EMBED — accordion section → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 5.5 | 5.9 | 2.5 | MarketDataDashboard | `/portal/market-data` | EMBED — accordion section → `/portal/portfolio-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | MarketPulsePage | `/portal/market-pulse` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | CryptoCyclePage | `/portal/crypto-cycle` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Scenario Lab & Comparison  ·  `/portal/scenario-lab`  ·  10 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 8.0 | 8.4 | 3.6 | PredictiveAnalytics | `/portal/predictive-analytics` | EMBED — named tab → `/portal/scenario-lab` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 8.0 | 8.4 | 0.8 | StrategyCompare | *(no route)* | EMBED — named tab → `/portal/scenario-lab` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.9 | 8.3 | 3.6 | MultiScenarioPlayZone | `/portal/scenario-play` | EMBED — named tab → `/portal/scenario-lab` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.1 | 7.5 | 7.1 | StrategyLab | `/portal/strategy` | EMBED — named tab → `/portal/scenario-lab` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.0 | 8.6 | 7.0 | ScenarioAdjustments | `/portal/scenarios` | EMBED — named tab → `/portal/scenario-lab` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 6.5 | 7.9 | 2.9 | SavedScenariosHub | `/portal/saved-scenarios` | EMBED — accordion section → `/portal/scenario-lab` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 4.6 | 7.5 | 2.1 | ScenarioSideBySide | `/portal/scenario-side-by-side` | EMBED — reference card → `/portal/scenario-lab` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 2.6 | 3.0 | 2.6 | ComparisonDashboard | `/portal/comparison` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.6 | 2.6 | 2.6 | StrategyCompareTool | `/portal/strategy-compare` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.1 | StrategyLabPage | *(no route)* | MERGE into canonical version → `StrategyLab` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Risk, Divorce & Protection  ·  `/portal/risk-command`  ·  3 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 4.3 | 5.3 | 4.3 | DivorceCalculator | `/portal/divorce-calculator` | EMBED — reference card → `/portal/risk-command` | chart is fed a literal array — the picture is decorative, not computed. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.3 | DivorceILITStrategyPage | `/portal/divorce-ilit` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.5 | 1.1 | 0.2 | DivorceCalculatorPage | `/portal/divorce-recovery` | MERGE into canonical version → `DivorceCalculator` | carries invented constants marked Simplified/Assumed in place of real limits. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Discovery, Calibration & Onboarding  ·  `/portal/onboarding`  ·  9 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 6.1 | 7.5 | 6.1 | GoalsBasedPlanning | `/portal/goals-planning` | EMBED — accordion section → `/portal/onboarding` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 5.1 | 5.5 | 2.3 | OnboardingWizardV2 | `/portal/onboarding-v2` | EMBED — accordion section → `/portal/onboarding` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.6 | 5.0 | 2.1 | Onboarding | `/onboarding` | EMBED — reference card → `/portal/onboarding` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.5 | 5.0 | 2.0 | OnboardingWizard | `/portal/welcome` | MERGE into canonical version → `OnboardingWizardV2` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.2 | 3.2 | 3.2 | GenomeStrategies | `/portal/genome-strategies` | UPGRADE or fold into library | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 2.0 | 2.4 | 0.9 | DailyDiscovery | `/portal/daily-discovery` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.4 | 1.4 | 1.4 | WealthGenomePage | `/portal/wealth-genome` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.7 | FactFinderPage | `/fact-finder` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.5 | 0.7 | 0.1 | GenomeKit | *(no route)* | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## AI Brain & Intelligence  ·  `/portal/ai-brain-hub`  ·  11 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 6.5 | 8.1 | 2.9 | AiStrategyRecommender | `/portal/ai-recommender` | EMBED — accordion section → `/portal/ai-brain-hub` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 6.3 | 6.7 | 2.8 | NaturalLanguageQuery | `/portal/data-query` | EMBED — accordion section → `/portal/ai-brain-hub` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.0 | 6.4 | 6.0 | AiAssist | `/portal/ai` | EMBED — accordion section → `/portal/ai-brain-hub` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.0 | 6.0 | 2.7 | Whisperer | `/portal/whisperer` | EMBED — accordion section → `/portal/ai-brain-hub` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 5.3 | 5.7 | 2.4 | Recommendations | `/portal/recommendations` | EMBED — accordion section → `/portal/ai-brain-hub` | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 4.7 | 5.1 | 2.1 | Knowledge | `/portal/knowledge` | EMBED — reference card → `/portal/ai-brain-hub` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.9 | 5.3 | 1.8 | VoicePlanBuilder | `/portal/voice-plan` | EMBED — reference card → `/portal/ai-brain-hub` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.5 | 3.5 | 1.6 | ClientIntakeRecommender | `/portal/client-intake-recommender` | EMBED — reference card → `/portal/ai-brain-hub` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.2 | 2.2 | 1.0 | ComboRecommender | `/portal/strategy-combos` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.5 | 1.5 | 0.7 | AIBrainHubPage | `/portal/ai-brain-hub` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.5 | 0.7 | 0.2 | WhisperCoachPage | `/portal/whisper-coach` | UPGRADE or fold into library | carries invented constants marked Simplified/Assumed in place of real limits. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Client Management & CRM  ·  `/portal/clients`  ·  14 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 7.2 | 7.6 | 3.2 | HouseholdWealth | `/portal/household-wealth` | EMBED — named tab → `/portal/clients` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.0 | 7.4 | 3.1 | LeadGenerator | `/portal/lead-generator` | EMBED — named tab → `/portal/clients` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.7 | 7.1 | 3.0 | MeetingAgenda | `/portal/meeting-agenda` | EMBED — accordion section → `/portal/clients` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.0 | 6.4 | 2.7 | ReferralTracker | `/portal/referral-tracker` | EMBED — accordion section → `/portal/clients` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.8 | 6.2 | 5.8 | Pipeline | `/portal/pipeline` | EMBED — accordion section → `/portal/clients` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.6 | 5.6 | 2.5 | LeadInbox | `/portal/leads` | EMBED — accordion section → `/portal/clients` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 5.4 | 5.8 | 5.4 | Meetings | `/portal/meetings` | EMBED — accordion section → `/portal/clients` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.0 | 5.4 | 2.2 | Leaderboard | `/portal/leaderboard` | EMBED — accordion section → `/portal/clients` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.9 | 6.8 | 2.2 | ReferralTracking | `/portal/referral-tracking` | EMBED — reference card → `/portal/clients` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.9 | 5.3 | 2.2 | CollaborativePlanning | `/portal/collaborative-planning` | EMBED — reference card → `/portal/clients` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.4 | 4.4 | 4.4 | HouseholdGenome | `/portal/household-genome` | EMBED — reference card → `/portal/clients` | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 1.1 | 1.1 | 0.5 | ReferralEnginePage | `/portal/referral-engine` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | MeetingPrepPage | `/portal/meeting-prep` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.3 | AIMeetingNotes | `/portal/ai-meeting-notes` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Advisor Practice & Sales Enablement  ·  `/portal/practice-command`  ·  32 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 8.0 | 8.4 | 3.6 | BatchSlides | `/portal/batch-slides` | EMBED — named tab → `/portal/practice-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.7 | 8.1 | 3.5 | BulkGeneration | `/portal/bulk-generation` | EMBED — named tab → `/portal/practice-command` | type checking disabled on the file. **Fix:** register in `pageRegistry.ts` with intent tags so the AI brain can cite and deep-link it |
| 7.5 | 7.9 | 3.4 | AdvisorIncomeCalculator | `/portal/advisor-income-calculator` | EMBED — named tab → `/portal/practice-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 7.5 | 7.9 | 3.4 | AdvisorDirectory | `/portal/advisor-directory` | EMBED — named tab → `/portal/practice-command` | type checking disabled on the file. **Fix:** add branded PDF export with sources and method notes |
| 7.1 | 7.5 | 3.2 | PresentationBuilder | `/portal/presentation-builder` | EMBED — named tab → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 7.1 | 7.1 | 7.1 | AISlideGenerator | `/portal/ai-slides` | EMBED — named tab → `/portal/practice-command` | no client-ready export. **Fix:** add branded PDF export with sources and method notes |
| 7.0 | 7.4 | 3.1 | TeamManagement | `/portal/team-management` | EMBED — named tab → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.6 | 7.0 | 3.0 | SalesStoryBuilder | `/portal/sales-story` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.3 | 6.7 | 2.8 | WorkspaceBranding | `/portal/branding` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.2 | 6.6 | 2.8 | DocumentTemplates | `/portal/document-templates` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.9 | 6.3 | 2.7 | AdvisorTraining | `/portal/advisor-training` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.6 | 6.0 | 2.5 | Team | `/portal/team` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.6 | 7.5 | 2.5 | AdvisorySummary | `/portal/advisory-summary` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 5.4 | 6.8 | 2.4 | SeminarGenerator | `/portal/seminar-generator` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.4 | 6.8 | 5.4 | AdvisorChat | `/portal/advisor-chat` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.2 | 6.8 | 2.3 | CommissionCalculator | `/portal/commission-calculator` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.2 | 7.1 | 2.3 | CompetitiveAnalysis | `/portal/competitive` | EMBED — accordion section → `/portal/practice-command` | type checking disabled on the file. **Fix:** widen inputs to a full scenario (assumptions, ranges, alternatives) |
| 4.9 | 6.8 | 2.2 | DocumentVault | `/portal/document-vault` | EMBED — reference card → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.8 | 6.7 | 4.8 | MySlides | `/portal/my-slides` | EMBED — reference card → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.7 | 4.7 | 4.7 | AIFinancialAdvisor | `/portal/ai-advisor` | EMBED — reference card → `/portal/practice-command` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 4.5 | 7.4 | 2.0 | Webhooks | `/portal/webhooks` | EMBED — reference card → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.3 | 4.7 | 1.9 | EmailCampaignManager | `/portal/email-campaigns` | EMBED — reference card → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.2 | 6.1 | 1.9 | CommissionTracker | `/portal/commission-tracker` | EMBED — reference card → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.0 | 5.9 | 1.8 | WorkflowAutomations | `/portal/workflow-automations` | EMBED — reference card → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.5 | 3.9 | 1.6 | AffiliateLinkManager | `/portal/affiliate-links` | EMBED — reference card → `/portal/practice-command` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.4 | 3.4 | 1.5 | RECINWorkspace | `/portal/recin` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.8 | 4.2 | 1.3 | IndividualAgentTutorial | `/portal/agent-tutorial` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.8 | 1.8 | 0.8 | SharedSlidesViewer | `/shared-slides/:token` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.8 | 2.2 | 0.8 | ClientStoryGenerator | `/portal/story-generator` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.4 | 1.8 | 1.4 | WarStoryGenerator | `/portal/war-story-generator` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | TrainingPage | `/portal/training` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.3 | ComplianceVaultPage | `/portal/compliance-vault` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Compliance & Supervision  ·  `/portal/compliance-center`  ·  11 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 7.1 | 7.5 | 3.2 | ComplianceExport | `/portal/compliance` | EMBED — named tab → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.8 | 7.2 | 3.1 | ComplianceAuditTrail | `/portal/compliance-audit-trail` | EMBED — accordion section → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.9 | 7.8 | 2.7 | AuditTimeline | `/portal/audit-timeline` | EMBED — accordion section → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.7 | 6.1 | 2.6 | HiddenMaterial | `/portal/hidden-material` | EMBED — accordion section → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.5 | 7.4 | 2.5 | StaleDigest | `/portal/stale-digest` | EMBED — accordion section → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.0 | 6.9 | 2.2 | ComplianceMonitoringDashboard | `/portal/compliance-monitoring` | EMBED — accordion section → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.0 | 6.4 | 2.2 | ComplianceReportGenerator | `/portal/compliance-reports` | EMBED — accordion section → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.8 | 6.7 | 2.2 | ComplianceAuditCenter | `/portal/compliance-audit` | EMBED — reference card → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.7 | 5.1 | 2.1 | SupervisorMonitoringAgreement | `/portal/monitoring-agreement` | EMBED — reference card → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.2 | 6.1 | 1.9 | ComplianceAlerts | `/portal/compliance-alerts` | EMBED — reference card → `/portal/compliance-center` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.7 | 2.7 | 0.3 | ComplianceDisclosure | *(no route)* | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Reports & Deliverables  ·  `/portal/reports`  ·  9 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 7.5 | 7.9 | 3.4 | WebsiteUsage | `/portal/website-usage` | EMBED — named tab → `/portal/reports` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 7.1 | 7.5 | 3.2 | FinancialVitalsScorecard | `/portal/financial-vitals` | EMBED — named tab → `/portal/reports` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.7 | 7.1 | 3.0 | AdvancedReporting | `/portal/advanced-reporting` | EMBED — accordion section → `/portal/reports` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.5 | 7.4 | 2.5 | OwnerWarRoom | `/portal/command-center` | EMBED — accordion section → `/portal/reports` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.9 | 5.3 | 4.9 | Dashboard | `/portal/dashboard` | EMBED — reference card → `/portal/reports` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.7 | 5.1 | 2.1 | WarRoom | `/portal/war-room` | EMBED — reference card → `/portal/reports` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.3 | 4.7 | 1.9 | VideoProposalGenerator | `/portal/video-proposals` | EMBED — reference card → `/portal/reports` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.3 | 4.3 | 4.3 | RoleDashboard | `/portal/advisor` | EMBED — reference card → `/portal/reports` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 1.5 | 1.9 | 1.5 | ToiletDashboard | `/portal/toilet` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Education & Knowledge  ·  `/portal/education`  ·  5 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 3.2 | 5.1 | 1.4 | EducationHub | `/portal/education` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.1 | 3.5 | 1.4 | AgencyTutorial | `/portal/agency-tutorial` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.7 | 2.7 | 1.2 | HowAFigureIsMade | `/portal/how-a-figure-is-made` | UPGRADE or fold into library | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 2.5 | 4.0 | 1.1 | SecretDetail | `/portal/secret-secrets/:id` | UPGRADE or fold into library | chart memo has empty deps — the graph never changes when inputs change. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 1.1 | SecretSecrets | `/portal/secret-secrets` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Engagement & Behavioral  ·  `/portal/engagement`  ·  4 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 6.0 | 7.9 | 2.7 | ClientEngagementScore | `/portal/engagement-score` | EMBED — accordion section → `/portal/engagement` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.8 | 3.2 | 1.3 | RewardsVault | `/portal/rewards` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.0 | 2.4 | 2.0 | PetSystem | `/portal/pet` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.9 | 2.3 | 0.9 | AvatarTwins | `/portal/avatar-twins` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Admin, Ops & System  ·  `/portal/admin`  ·  8 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 6.6 | 7.0 | 6.6 | Integrations | `/portal/integrations` | EMBED — accordion section → `/portal/admin` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 6.2 | 8.1 | 2.8 | EnterpriseAdmin | `/portal/admin` | EMBED — accordion section → `/portal/admin` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 5.1 | 5.5 | 2.3 | SlackIntegration | `/portal/slack` | EMBED — accordion section → `/portal/admin` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.2 | 6.1 | 1.9 | HubSpotSync | `/portal/hubspot` | EMBED — reference card → `/portal/admin` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.9 | 1.9 | 0.9 | SystemHealth | `/portal/system-health` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 0.5 | SettingsPage | `/portal/settings-classic` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.3 | AdministratorPortal | `/administrator` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.3 | Billing | `/portal/billing` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |

## Public, Marketing & Legal  ·  `/`  ·  37 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 5.0 | 5.0 | 0.5 | ComponentShowcase | *(no route)* | EMBED — accordion section → `/` | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 5.0 | 5.0 | 5.0 | Pricing | `/pricing` | EMBED — accordion section → `/` | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 5.0 | 5.0 | 5.0 | UltraCalculatorPage | `/ultra-calculator` | EMBED — accordion section → `/` | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 4.4 | 4.4 | 2.0 | SpecialtyPage | `/for/:slug` | EMBED — reference card → `/` | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 4.0 | 4.4 | 1.8 | VideoViewer | `/video/:token` | EMBED — reference card → `/` | type checking disabled on the file. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 4.0 | 4.0 | 1.8 | SharedProjection | `/shared/:token` | EMBED — reference card → `/` | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 3.9 | 3.9 | 1.8 | MatchAndDeployPage | `/portal/match-and-deploy` | EMBED — reference card → `/` | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 3.4 | 3.4 | 3.4 | TrialLogin | `/trial` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 3.4 | 3.4 | 0.3 | Landing | *(no route)* | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 3.2 | 3.2 | 1.4 | Register | `/register` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 3.2 | 3.2 | 1.4 | ResetPassword | `/reset-password` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 3.2 | 3.2 | 3.2 | ForgotPassword | `/forgot-password` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 2.7 | Login | `/login` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 2.7 | MassiveCalculatorsPage | `/calculators` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | CareerPathPage | `/portal/career-path` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | CertificationsPage | `/portal/certifications` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | AutoCloserPage | `/portal/auto-closer` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | DealRoomPage | `/portal/deal-room` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | RiskScorePage | `/portal/risk-score` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | OilGasPage | `/portal/oil-gas` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | IndexBacktesterPage | `/portal/index-backtester-pro` | MERGE into canonical version → `IndexBacktester` | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | NotFound | `/404` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.7 | 2.7 | 1.2 | ExecutiveEntrance | `/executive` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.5 | 2.5 | 1.1 | AcceptInvite | `/invite` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.5 | 2.5 | 2.5 | SpecialtyIndexPage | `/for` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | InteropEnginePage | `/portal/interop-engine` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | ExplorePage | `/portal/explore` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | CommandPage | `/portal/command` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | CompetePage | `/portal/compete` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | EarnPage | `/portal/earn` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 2.0 | Legal | `/privacy` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | TheExperiencePage | `/portal/the-experience` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 2.0 | ManagedAuthLegacy | `/forgot-password` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | TranscendPage | `/portal/transcend` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | SupportPage | `/portal/support-desk` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.9 | LegalPaymentFolder | `/portal/legal-payment-folder` | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |
| 2.0 | 2.0 | 0.2 | Home | *(no route)* | UPGRADE or fold into library | static — no motion or cinematic treatment. **Fix:** apply the CinematicEngine treatment (Ken Burns + breath-locked bloom) |

## Cross-Cutting Reference Library  ·  `/portal/library`  ·  46 pages

| V | B | E | Page | URL | Action | Why / what it needs |
|---:|---:|---:|---|---|---|---|
| 7.3 | 7.3 | 7.3 | ChainBuilder | `/portal/chain` | EMBED — named tab → `/portal/library` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 6.4 | 6.4 | 2.9 | Controls | `/portal/controls` | EMBED — accordion section → `/portal/library` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 5.9 | 8.8 | 2.7 | IndexBacktester | `/portal/index-backtester` | EMBED — accordion section → `/portal/library` | type checking disabled on the file. **Fix:** register in `pageRegistry.ts` with intent tags so the AI brain can cite and deep-link it |
| 5.5 | 5.5 | 5.5 | FinancialAssessment | `/portal/financial-assessment` | EMBED — accordion section → `/portal/library` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 4.6 | 4.6 | 4.6 | ZipEngine | `/portal/zip-engine` | EMBED — reference card → `/portal/library` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 4.5 | 4.9 | 4.5 | NerveCenter | `/portal/nerve-center` | EMBED — reference card → `/portal/library` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.2 | 4.2 | 1.9 | Forgiveness | `/portal/forgiveness` | EMBED — reference card → `/portal/library` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 4.0 | 4.0 | 4.0 | Erosion | `/portal/erosion` | EMBED — reference card → `/portal/library` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.9 | 3.9 | 3.9 | PlanLedger | `/portal/plan-ledger` | EMBED — reference card → `/portal/library` | no visualisation of the outcome. **Fix:** add projection + sensitivity + comparison charts |
| 3.6 | 4.0 | 3.6 | Arena | `/portal/arena` | EMBED — reference card → `/portal/library` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.6 | 3.6 | 3.6 | InfiniteBanking | `/portal/infinite-banking` | EMBED — reference card → `/portal/library` | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 3.5 | 3.9 | 1.6 | RiskToleranceScoring | `/portal/risk-tolerance` | EMBED — reference card → `/portal/library` | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.5 | 3.5 | 3.5 | PlanningCases | `/portal/planning-cases` | EMBED — reference card → `/portal/library` | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.2 | 3.6 | 3.2 | InfiniteScroll | `/portal` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.2 | 3.6 | 1.4 | CouplesMode | `/portal/couples` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 3.2 | 3.2 | 1.4 | PatentShowcase | `/portal/patent-showcase` | UPGRADE or fold into library | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 3.2 | 3.2 | 3.2 | Mechanisms | `/portal/mechanisms` | UPGRADE or fold into library | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 3.1 | 3.1 | 1.4 | VoiceStudio | `/portal/voice` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.8 | 3.2 | 2.8 | MorningRitual | `/portal/morning-ritual` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.8 | 3.2 | 1.3 | DailyBriefing | `/portal/daily-briefing` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.7 | 2.7 | 2.7 | LiquidityRoutes | `/portal/liquidity-routes` | UPGRADE or fold into library | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 2.7 | 2.7 | 1.2 | SecondaryInformation | `/portal/secondary-information` | UPGRADE or fold into library | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 2.7 | 2.7 | 2.7 | Thresholds | `/portal/thresholds` | UPGRADE or fold into library | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 2.7 | 2.7 | 2.7 | Sphere | `/portal/sphere` | UPGRADE or fold into library | no live data — nothing persists, no client record. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 2.5 | 2.9 | 1.1 | RussellNumber | `/portal/russell-number` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.2 | 3.8 | 2.2 | TheStrategyTable | `/portal/the-strategy-table` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** add a tRPC procedure so scenarios save against the client record |
| 2.2 | 2.2 | 1.0 | SiteHealth | `/portal/site-health` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 2.0 | 2.4 | 0.9 | MyWorld | `/portal/my-world` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.9 | 2.3 | 0.9 | RussellWrapped | `/portal/wrapped` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.9 | 1.9 | 0.9 | Connections | `/portal/connections` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.8 | 2.2 | 1.8 | TheMap | `/portal/the-map` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.7 | 1.7 | 0.8 | OutsideForces | `/portal/outside-forces` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.6 | 2.0 | 0.7 | BlackMirror | `/portal/black-mirror` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.6 | 2.0 | 0.7 | SocialNarcotic | `/portal/social` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.6 | 2.0 | 0.7 | Endgame | `/portal/endgame` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.4 | 1.4 | 0.6 | Interior | `/portal/interior` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.4 | 1.4 | 1.4 | MyJourney | `/portal/my-journey` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.2 | 1.2 | 0.5 | AltCreditDetail | `/portal/alt-credit/:slug` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.2 | 1.2 | 0.5 | PhysiciansEdge | `/portal/physicians-edge` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.2 | 1.6 | 0.5 | RevenueGuarantee | `/portal/revenue-guarantee` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.1 | 1.1 | AltCreditHub | `/portal/alt-credit` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.1 | 1.5 | 0.5 | TheArrival | `/portal/the-arrival` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 1.0 | 1.4 | 0.5 | LiveCoPilot | `/portal/co-pilot` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.7 | 0.7 | 0.3 | VideoLibrary | `/portal/video-library` | UPGRADE or fold into library | no real computation — display-only. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.5 | 1.0 | 0.5 | TheMirror | `/portal/the-mirror` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |
| 0.5 | 0.7 | 0.5 | TheField | `/portal/the-field` | UPGRADE or fold into library | type checking disabled on the file. **Fix:** extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite |