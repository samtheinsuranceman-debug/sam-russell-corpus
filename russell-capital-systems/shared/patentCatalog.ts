/**
 * The 68 — every claimed invention mapped to the code that implements it.
 *
 * It was the 57 for as long as the sheet was the only place claims came from.
 * Eleven more were found the other way round: by scanning shared/ for engines
 * that declare a claim in their own header and asking which ones this file had
 * never heard of. Those eleven are at the bottom under "Built, unclaimed", they
 * total 3,165 lines, and not one of them has a drafted application. The count
 * went up because the inventory got honest, not because anything new was built.
 *
 * ## Why a registry rather than 57 new files
 *
 * The instruction was "don't build it from scratch, get it off RCS", and that
 * is the right instinct: nearly all of this already exists here. RCS carries
 * 70-odd shared engines and 230-odd portal pages. What was missing was not the
 * work — it was a map from a claim number to the module that does it.
 *
 * ## The rule
 *
 * `engine` and `page` are paths this repo must actually contain. A test walks
 * every entry and fails if a path does not resolve, so this file cannot drift
 * into describing code that was moved or never written. That is the same
 * discipline as `Verified<T>` in mutualIulCarriers.ts: the proof sits beside
 * the claim.
 *
 * `status` is deliberately honest, because the portfolio review already found
 * that several items on the sheet have nothing behind them:
 *
 *   built     — an engine and/or page exists and does the described work
 *   partial   — related code exists but does not cover the whole claim
 *   dropped   — the portfolio review removed it, with the reason recorded
 *   none      — on the sheet, no implementation located
 *
 * Only `built` entries are offered to partner sites. A marketing page that
 * lists 57 tools where 30 render nothing is worse than one that lists what
 * works, and it is the kind of thing a competitor screenshots.
 */

export type ClaimStatus = 'built' | 'partial' | 'dropped' | 'none';

export interface ClaimEntry {
  readonly ref: string;
  readonly title: string;
  readonly status: ClaimStatus;
  /** Shared engine implementing it, repo-relative. */
  readonly engine?: string;
  /** Portal page presenting it, repo-relative. */
  readonly page?: string;
  /** Why it is dropped or unbuilt. Required when status is dropped/none. */
  readonly note?: string;
  /**
   * A drafted application document in this repo, repo-relative.
   *
   * Drafted is not filed. These are attorney-client work product with no
   * USPTO application number attached; whether anything is on file is decided
   * only by shared/patentStatus.ts, which reads receipts. A drafted spec and a
   * filing are different facts and this field is not evidence of the second.
   */
  readonly applicationDraft?: string;
}

export const CLAIMS: readonly ClaimEntry[] = [
  // ── The fifteen ────────────────────────────────────────────────────────
  { ref: 'PAT-001', applicationDraft: 'docs/patents/applications/PAT-001_Cascading_Multi_Calculator_Financial_Planning_Engine.pdf', title: 'Cascading Multi-Calculator Financial Planning Engine', status: 'built',
    engine: 'shared/journeyEngine.ts', page: 'client/src/pages/portal/MultiScenarioPlayZone.tsx', },
  { ref: 'PAT-002', applicationDraft: 'docs/patents/applications/PAT-002_HELOC_to_IUL_Arbitrage_Optimization_Engine.pdf', title: 'HELOC-to-IUL Arbitrage Optimization Engine', status: 'built',
    engine: 'shared/reverseHeloc.ts', page: 'client/src/pages/portal/ReverseHeloc.tsx', },
  { ref: 'PAT-003', applicationDraft: 'docs/patents/applications/PAT-003_AI_Whisper_Coaching_System_for_Financial_Advisors.pdf', title: 'AI Whisper Coaching System for Financial Advisors', status: 'built',
    engine: 'server/ultraAI.ts', page: 'client/src/pages/portal/LiveCoPilot.tsx', },
  { ref: 'PAT-004', applicationDraft: 'docs/patents/applications/PAT-004_Wealth_Genome_Scoring_and_Classification_System.pdf', title: 'Wealth Genome Scoring & Classification System', status: 'built',
    engine: 'shared/wealthGenome.ts', page: 'client/src/pages/portal/RiskToleranceScoring.tsx', },
  { ref: 'PAT-005', applicationDraft: 'docs/patents/applications/PAT-005_Tax_Free_Retirement_Income_Waterfall_Engine.pdf', title: 'Tax-Free Retirement Income Waterfall Engine', status: 'built',
    engine: 'shared/incomeForLife.ts', page: 'client/src/pages/portal/TaxWaterfall.tsx' },
  { ref: 'PAT-006', applicationDraft: 'docs/patents/applications/PAT-006_Divorce_Asset_Protection_Calculator_with_IUL_Shielding.pdf', title: 'Divorce Asset Protection Calculator with IUL Shielding', status: 'built',
    engine: 'shared/divorceFinancialEngine.ts', page: 'client/src/pages/portal/DivorceCalculator.tsx',
    note: 'The engine is named here rather than left to the page, because it is one of the few in this directory whose figures are statutory: it reads divorceStateRules, which carries a statute citation per jurisdiction and a neverPrinted list reused by reference so the two cannot drift. It declares SI-012 in its own header, which is the churn claim on this sheet — a collision recorded in engineClaimRegistry.ts and not resolved by naming it here.' },
  { ref: 'PAT-007', applicationDraft: 'docs/patents/applications/PAT-007_Ecological_Drivers_Retirement_Risk_Assessment_Framework.pdf', title: 'Ecological Drivers Retirement Risk Assessment Framework', status: 'built',
    engine: 'shared/erosion.ts', page: 'client/src/pages/portal/EcologicalDrivers.tsx' },
  { ref: 'PAT-008', applicationDraft: 'docs/patents/applications/PAT-008_Behavioral_Lock_In_Prevention_System.pdf', title: 'Behavioral Lock-In Prevention System', status: 'built',
    engine: 'shared/livingRiskProfile.ts', page: 'client/src/pages/portal/PortfolioDriftMonitor.tsx' },
  { ref: 'PAT-009', applicationDraft: 'docs/patents/applications/PAT-009_Mortgage_Elimination_Through_Real_Estate_Recycling_and.pdf', title: 'Mortgage Elimination Through Real Estate Recycling & IUL', status: 'built',
    engine: 'shared/mortgageKiller.ts', page: 'client/src/pages/portal/HouseRecyclingStrategy.tsx' },
  { ref: 'PAT-010', applicationDraft: 'docs/patents/applications/PAT-010_Time_Machine_Dual_Illustration_Method.pdf', title: 'Time Machine Dual-Illustration Method', status: 'built',
    engine: 'shared/timeMachineEngine.ts', page: 'client/src/pages/portal/TimeMachineAG49.tsx' },
  { ref: 'PAT-011', applicationDraft: 'docs/patents/applications/PAT-011_Russell_Number_Multi_Dimensional_Advisor_Scoring.pdf', title: 'Russell Number Multi-Dimensional Advisor Scoring', status: 'built',
    engine: 'shared/tabScores.ts', page: 'client/src/pages/portal/RussellNumber.tsx' },
  { ref: 'PAT-012', applicationDraft: 'docs/patents/applications/PAT-012_Roth_Conversion_with_Short_Term_Rental_Tax.pdf', title: 'Roth Conversion with Short-Term Rental Tax Offset Strategy', status: 'built',
    engine: 'shared/strEngine.ts', page: 'client/src/pages/portal/RothConversionSTR.tsx' },
  { ref: 'PAT-013', applicationDraft: 'docs/patents/applications/PAT-013_Monte_Carlo_Simulation_Engine_with_IUL_Floor.pdf', title: 'Monte Carlo Simulation Engine with IUL Floor/Cap', status: 'built',
    engine: 'shared/monteCarloEngine.ts', page: 'client/src/pages/portal/MarketScenarioStressTest.tsx' },
  { ref: 'PAT-014', applicationDraft: 'docs/patents/applications/PAT-014_FIA_Collateral_Assignment_Lending_Optimization_System.pdf', title: 'FIA Collateral Assignment Lending Optimization System', status: 'built',
    engine: 'shared/fiaCollateralEngine.ts', page: 'client/src/pages/portal/FIACollateralStrategy.tsx' },
  { ref: 'PAT-015', applicationDraft: 'docs/patents/applications/PAT-015_Automated_Advisor_Practice_Revenue_and_Territory_Strategy.pdf', title: 'Automated Advisor Practice Revenue & Territory Strategy', status: 'built',
    engine: 'shared/advisorModes.ts', page: 'client/src/pages/portal/AdvisorIncomeCalculator.tsx' },

  // ── The forty-two ──────────────────────────────────────────────────────
  { ref: 'SI-001', applicationDraft: 'docs/patents/applications/SI-001_Dynamic_IUL_Illustration_Compliance_Engine.pdf', title: 'Dynamic IUL Illustration Compliance Engine', status: 'built',
    engine: 'shared/ag49Validator.ts',
    note: 'Rebuilt as a validator. The dropped version was "maximize persuasive impact within AG49"; this checks a finished exhibit against AG 49-A as amended 21 Nov 2025 and names each violation with its authority. Same subject, opposite aim, and a compliance desk can buy it.' },
  { ref: 'SI-002', applicationDraft: 'docs/patents/applications/SI-002_Multi_Carrier_IUL_Comparison_Optimizer.pdf', title: 'Multi-Carrier IUL Comparison Optimizer', status: 'built',
    engine: 'shared/carrierRecommendation.ts', page: 'client/src/pages/portal/CarrierComparison.tsx' },
  { ref: 'SI-003', applicationDraft: 'docs/patents/applications/SI-003_Automated_Policy_Review_and_Replacement_Analyzer.pdf', title: 'Automated Policy Review & Replacement Analyzer', status: 'built',
    engine: 'shared/replacementScoring.ts', page: 'client/src/pages/portal/PolicyReview.tsx' },
  { ref: 'SI-004', applicationDraft: 'docs/patents/applications/SI-004_Premium_Financing_Arbitrage_Calculator.pdf', title: 'Premium Financing Arbitrage Calculator', status: 'built',
    engine: 'shared/premiumFinancing.ts', page: 'client/src/pages/portal/PremiumFinancing.tsx' },
  { ref: 'SI-005', applicationDraft: 'docs/patents/applications/SI-005_Living_Benefits_Probability_Engine.pdf', title: 'Living Benefits Probability Engine', status: 'built',
    engine: 'shared/ltcEngine.ts', page: 'client/src/pages/portal/LongTermCare.tsx' },
  { ref: 'SI-006', applicationDraft: 'docs/patents/applications/SI-006_Real_Time_Tax_Code_Change_Impact_Simulator.pdf', title: 'Real-Time Tax Code Change Impact Simulator', status: 'built',
    engine: 'shared/taxHistory.ts', page: 'client/src/pages/portal/Erosion.tsx' },
  { ref: 'SI-007', applicationDraft: 'docs/patents/applications/SI-007_Multi_Entity_Tax_Optimization_Router.pdf', title: 'Multi-Entity Tax Optimization Router', status: 'built',
    engine: 'shared/taxStrategies.ts', page: 'client/src/pages/portal/BusinessOwnerPlanning.tsx' },
  { ref: 'SI-008', applicationDraft: 'docs/patents/applications/SI-008_Charitable_Remainder_Trust_IUL_Wealth_Replacement.pdf', title: 'Charitable Remainder Trust + IUL Wealth Replacement', status: 'built',
    engine: 'shared/crtWealthReplacementEngine.ts', page: 'client/src/pages/portal/CharitableGivingOptimizer.tsx' },
  { ref: 'SI-009', applicationDraft: 'docs/patents/applications/SI-009_Opportunity_Zone_IUL_Capital_Gains_Deferral_Engine.pdf', title: 'Opportunity Zone + IUL Capital Gains Deferral Engine', status: 'none',
    note: 'On the sheet; no dedicated implementation located. Portfolio review kept it only as a dependent claim (strategy is known, software claim thin).' },
  { ref: 'SI-010', applicationDraft: 'docs/patents/applications/SI-010_State_Tax_Arbitrage_Migration_Planner.pdf', title: 'State Tax Arbitrage Migration Planner', status: 'partial',
    engine: 'shared/taxRules.ts',
    note: 'Rule tables exist and are versioned by year, and taxRules.ts remains the sourced side of this claim. The earlier note said there is no migration planner; there is one — stateTaxMigrationEngine.ts exports calculateMigration over income, capital-gains, estate and property tax plus cost of living. It is not promoted to this row\'s engine because the two do not agree on provenance: taxRules.ts carries sourced, year-versioned tables and the migration engine carries its own state profiles with no publisher or date. Pointing the claim at the unsourced one would trade evidence for surface. See ENGINE_REGISTRY in engineClaimRegistry.ts; reconciling the two is an open decision.' },
  { ref: 'SI-011', applicationDraft: 'docs/patents/applications/SI-011_Gamified_Financial_Literacy_Platform.pdf', title: 'Gamified Financial Literacy Platform', status: 'partial',
    page: 'client/src/pages/portal/RewardsVault.tsx',
    note: 'Rewards surface exists; the literacy curriculum does not.' },
  { ref: 'SI-012', applicationDraft: 'docs/patents/applications/SI-012_Predictive_Client_Churn_Prevention_System.pdf', title: 'Predictive Client Churn Prevention System', status: 'built',
    engine: 'shared/clientRetentionEngine.ts', page: 'client/src/pages/portal/ClientEngagementScore.tsx',
    note: 'clientRetentionEngine declares SI-022 in its header — the audit-trail claim here — while divorceFinancialEngine declares SI-012, this row. The two have swapped numbers relative to this sheet, which is why the collision looks like an offset in one of the two numbering schemes rather than two isolated mistakes. Both engines are named on the rows their subjects belong to; neither is renumbered.' },
  { ref: 'SI-013', applicationDraft: 'docs/patents/applications/SI-013_Automated_Life_Event_Detection_and_Response_Engine.pdf', title: 'Automated Life Event Detection & Response Engine', status: 'dropped',
    note: 'Portfolio review: life-event detection with playbooks marked taken or crowded.' },
  { ref: 'SI-014', applicationDraft: 'docs/patents/applications/SI-014_Client_Family_Tree_Financial_Mapping.pdf', title: 'Client Family Tree Financial Mapping', status: 'built',
    engine: 'shared/familyTreeFinancialEngine.ts', page: 'client/src/pages/portal/MultiGenWealthTransfer.tsx' },
  { ref: 'SI-015', applicationDraft: 'docs/patents/applications/SI-015_Voice_Activated_Financial_Dashboard.pdf', title: 'Voice-Activated Financial Dashboard', status: 'built',
    page: 'client/src/pages/portal/VoicePlanBuilder.tsx' },
  { ref: 'SI-016', applicationDraft: 'docs/patents/applications/SI-016_AI_Powered_Compliance_Pre_Check_System.pdf', title: 'AI-Powered Compliance Pre-Check System', status: 'built',
    page: 'client/src/pages/portal/ComplianceMonitoringDashboard.tsx' },
  { ref: 'SI-017', applicationDraft: 'docs/patents/applications/SI-017_Automated_Succession_Planning_Valuation_Engine.pdf', title: 'Automated Succession Planning Valuation Engine', status: 'built',
    engine: 'shared/successionValuationEngine.ts', page: 'client/src/pages/portal/SuccessionPlanningWizard.tsx' },
  { ref: 'SI-018', applicationDraft: 'docs/patents/applications/SI-018_Dynamic_Commission_Optimization_Router.pdf', title: 'Dynamic Commission Optimization Router', status: 'built',
    engine: 'shared/commissionOptimizerEngine.ts', page: 'client/src/pages/portal/CommissionCalculator.tsx' },
  { ref: 'SI-019', applicationDraft: 'docs/patents/applications/SI-019_Peer_Benchmarking_Intelligence_Network.pdf', title: 'Peer Benchmarking Intelligence Network', status: 'built',
    engine: 'shared/careerEngine.ts', page: 'client/src/pages/portal/Leaderboard.tsx' },
  { ref: 'SI-020', applicationDraft: 'docs/patents/applications/SI-020_Automated_CE_Credit_Tracker_and_Recommendation_Engine.pdf', title: 'Automated CE Credit Tracker & Recommendation Engine', status: 'partial',
    engine: 'shared/ceCreditTrackerEngine.ts', page: 'client/src/pages/portal/AdvisorTraining.tsx',
    note: 'The earlier note said CE tracking against state requirements does not exist. It does: trackCECredits reconciles earned credits, ethics minimums and renewal deadlines per licence, and it was already in this directory when the note was written. What is actually partial is the reference data — the state requirement table marks itself "simplified — key states", and the course catalogue is a fixed in-repo list rather than a provider feed. Sourced requirements and a real feed are what remain.' },
  { ref: 'SI-021', applicationDraft: 'docs/patents/applications/SI-021_Extreme_Scenario_Portfolio_Stress_Testing.pdf', title: 'Extreme-Scenario Portfolio Stress Testing', status: 'built',
    engine: 'shared/historicalShocks.ts', page: 'client/src/pages/portal/MarketScenarioStressTest.tsx',
    note: 'Renamed from "Quantum-Resistant", which the portfolio review called a misnomer — nothing about it concerns quantum computing. Named shocks (dot-com, 2008, 2020, 2022) run against the policy\'s own floor and cap; windows outside the held series are refused with the reason rather than filled in from memory. A Monte Carlo answers "across ten thousand futures" and persuades nobody, because no client has lived in a distribution. They lived through 2008.' },
  { ref: 'SI-022', applicationDraft: 'docs/patents/applications/SI-022_Blockchain_Verified_Financial_Plan_Audit_Trail.pdf', title: 'Blockchain-Verified Financial Plan Audit Trail', status: 'built',
    engine: 'shared/planLedger.ts', page: 'client/src/pages/portal/ComplianceAuditTrail.tsx' },
  { ref: 'SI-023', applicationDraft: 'docs/patents/applications/SI-023_Real_Time_Market_Sentiment_Integration_for_IUL.pdf', title: 'Real-Time Market Sentiment Integration for IUL Crediting', status: 'partial',
    engine: 'shared/strSources.ts',
    note: 'Blocked on data, not on code. This repo admits a figure through one of two doors — read from the publisher with a link and date, or typed by a person from a named page — and no sentiment feed yet meets either. The source-registry pattern in strSources.ts is the shape it takes: register the feed with its access level, and the engine refuses to speak until a key for a qualifying source exists. Building it before the source would mean inventing the number.' },
  { ref: 'SI-024', applicationDraft: 'docs/patents/applications/SI-024_Multi_Currency_Wealth_Optimization_for_International_Clients.pdf', title: 'Multi-Currency Wealth Optimization for International Clients', status: 'partial',
    engine: 'shared/multiCurrencyWealthEngine.ts',
    note: 'Was recorded as none — no implementation located. The engine existed, in the 688 build rather than here, and is now carried in this directory: it models currency exposure, hedging cost and cross-border drag over a projection. It stays partial for one reason, and it is the reason that matters in this repo: DEFAULT_PAIRS hardcodes exchange rates, volatilities and correlations with no publisher, link or date. An FX rate is stale the day after it is written, so that table must either be read from a named source or removed so the engine refuses rather than answers. Until then no figure it produces may be shown to a household.' },
  { ref: 'SI-025', applicationDraft: 'docs/patents/applications/SI-025_Automated_Annuity_Comparison_with_Hidden_Fee_Detection.pdf', title: 'Automated Annuity Comparison with Hidden Fee Detection', status: 'built',
    engine: 'shared/annuityData.ts', page: 'client/src/pages/portal/FeeTransparencyDashboard.tsx' },
  { ref: 'SI-026', applicationDraft: 'docs/patents/applications/SI-026_Regulatory_Sandbox_Simulation_Environment.pdf', title: 'Regulatory Sandbox Simulation Environment', status: 'built',
    engine: 'shared/regulatorySandbox.ts', page: 'client/src/pages/portal/Erosion.tsx',
    note: 'The review said it had no code behind it. A year-to-year comparison only answers questions the calendar already settled; this builds a rule set no legislature passed — "what if the top rate returns to 39.6", "what if the estate exclusion halves" — and runs a household through it using the same machinery. Every synthetic set is versioned sandbox: and carries its edits in its source, so a figure computed under it can never later be mistaken for one computed under a revenue procedure.' },
  { ref: 'SI-027', applicationDraft: 'docs/patents/applications/SI-027_Client_Digital_Twin_Financial_Modeling.pdf', title: 'Client Digital Twin Financial Modeling', status: 'built',
    page: 'client/src/pages/portal/AvatarTwins.tsx' },
  { ref: 'SI-028', applicationDraft: 'docs/patents/applications/SI-028_Physician_Student_Loan_Forgiveness_Optimization_Engine.pdf', title: 'Physician Student Loan Forgiveness Optimization Engine', status: 'built',
    engine: 'shared/forgiveness.ts', page: 'client/src/pages/portal/Forgiveness.tsx' },
  { ref: 'SI-029', applicationDraft: 'docs/patents/applications/SI-029_Real_Estate_Syndication_Tax_Benefit_Aggregation_Platform.pdf', title: 'Real Estate Syndication Tax Benefit Aggregation Platform', status: 'partial',
    page: 'client/src/pages/portal/RealEstateMogul.tsx',
    note: 'Property engine exists; K-1 aggregation across syndications does not.' },
  { ref: 'SI-030', applicationDraft: 'docs/patents/applications/SI-030_Spousal_Income_Splitting_and_IUL_Arbitrage_Optimizer.pdf', title: 'Spousal Income Splitting & IUL Arbitrage Optimizer', status: 'built',
    page: 'client/src/pages/portal/CouplesMode.tsx' },
  { ref: 'SI-031', applicationDraft: 'docs/patents/applications/SI-031_Disability_Insurance_Gap_Analyzer_with_IUL_Bridge.pdf', title: 'Disability Insurance Gap Analyzer with IUL Bridge Funding', status: 'partial',
    engine: 'shared/disabilityGapAnalyzerEngine.ts', page: 'client/src/pages/portal/IncomeGapAnalyzer.tsx',
    note: 'The earlier note said specialty-specific disability probability does not exist. It does, and in more detail than the note allowed: an occupation table carries per-specialty incidence, manual intensity and own-occupation exposure for surgeon, interventional cardiologist, anaesthesiologist, dentist, oral surgeon, radiologist, psychiatrist and others, and modelDisabilityProbability runs off it. The engine also applies IRC § 105 against § 104(a)(3) so employer-paid and after-tax-paid benefits are not summed as though taxed alike. It stays partial because those incidence figures carry no publisher, table or date — they need a named morbidity source, most likely the SOA individual disability experience study, before any probability is shown to a household.' },
  { ref: 'SI-032', applicationDraft: 'docs/patents/applications/SI-032_Multi_Generational_Wealth_Transfer_Sequencing_Engine.pdf', title: 'Multi-Generational Wealth Transfer Sequencing Engine', status: 'built',
    engine: 'shared/inheritanceEngine.ts', page: 'client/src/pages/portal/MultiGenWealthTransfer.tsx' },
  { ref: 'SI-033', applicationDraft: 'docs/patents/applications/SI-033_Practice_Acquisition_Due_Diligence_Scoring_Platform.pdf', title: 'Practice Acquisition Due Diligence Scoring Platform', status: 'partial',
    engine: 'shared/practiceAcquisitionEngine.ts',
    note: 'Was recorded as none — no implementation located. It was located: 604 lines in this directory, exporting scoreClientBook, analyzeRevenueSustainability, assessIntegrationRisk and evaluatePracticeAcquisition, which is the whole claim. The gap is one line of it: baseMultiple is computed as 2.2 plus a Russell-Number adjustment, an unsourced revenue multiple presented as a valuation. Advisory-practice multiples are published and vary by book composition and recurring-revenue share; until that range is read from a named source with a date, the valuation is an opinion wearing a number.' },
  { ref: 'SI-034', applicationDraft: 'docs/patents/applications/SI-034_Automated_1031_Exchange_Chain_Optimization_with_IUL.pdf', title: 'Automated 1031 Exchange Chain Optimization with IUL Exit', status: 'partial',
    engine: 'shared/exchangeChainEngine.ts', page: 'client/src/pages/portal/RealEstateMogul.tsx',
    note: 'The earlier note said the 1031 chain optimizer does not exist. It does — exchangeChainEngine exports optimizeExchangeChain alongside profileProperty, accumulatedDepreciation and monitorDeadlines, which is the sequence, the basis tracking and the 45/180-day clock. Portfolio review kept the claim as a dependent one, and that judgement stands on its own; it is a view about claim strength, not about whether code exists. Partial rather than built because the deadline monitor takes asOf as a parameter defaulting to now, so a chain evaluated today and re-evaluated tomorrow gives different answers with nothing recording which date produced which figure.' },
  { ref: 'SI-035', applicationDraft: 'docs/patents/applications/SI-035_Client_Risk_Tolerance_Drift_Detection_and_Auto.pdf', title: 'Client Risk Tolerance Drift Detection & Auto-Rebalancing', status: 'built',
    engine: 'shared/livingRiskProfile.ts', page: 'client/src/pages/portal/PortfolioDriftMonitor.tsx' },
  { ref: 'SI-036', applicationDraft: 'docs/patents/applications/SI-036_Physician_Buy_In_Buy_Out_Partnership_Valuation.pdf', title: 'Physician Buy-In/Buy-Out Partnership Valuation Engine', status: 'partial',
    page: 'client/src/pages/portal/BusinessOwnerPlanning.tsx',
    note: 'Business owner surface exists; partnership buy-in valuation does not.' },
  { ref: 'SI-037', applicationDraft: 'docs/patents/applications/SI-037_Tax_Loss_Harvesting_Coordination_Engine_with_IUL.pdf', title: 'Tax Loss Harvesting Coordination Engine with IUL Premium Timing', status: 'built',
    page: 'client/src/pages/portal/TaxLossHarvestingScanner.tsx' },
  { ref: 'SI-038', applicationDraft: 'docs/patents/applications/SI-038_Advisor_Client_Communication_Sentiment_Analysis.pdf', title: 'Advisor-Client Communication Sentiment Analysis', status: 'none',
    note: 'Application drafted 29 April 2026 (emotional tone classification, pressure-tactic detection, suitability-aligned scoring). No implementation in this repo — this is one of two claims with a spec and no code.' },
  { ref: 'SI-039', applicationDraft: 'docs/patents/applications/SI-039_Dynamic_Beneficiary_Optimization_Engine.pdf', title: 'Dynamic Beneficiary Optimization Engine', status: 'built',
    page: 'client/src/pages/portal/BeneficiaryOptimization.tsx', },
  { ref: 'SI-040', applicationDraft: 'docs/patents/applications/SI-040_Concentrated_Stock_Position_Diversification_Planner_with_IUL.pdf', title: 'Concentrated Stock Position Diversification Planner with IUL', status: 'none',
    note: 'Application drafted 29 April 2026 (exchange-fund modelling, prepaid variable forward optimisation, tax-managed liquidation scheduling). No implementation in this repo — the second of two claims with a spec and no code.' },
  { ref: 'SI-041', applicationDraft: 'docs/patents/applications/SI-041_Medicare_Optimization_and_IRMAA_Avoidance_Planning_Engine.pdf', title: 'Medicare Optimization & IRMAA Avoidance Planning Engine', status: 'built',
    page: 'client/src/pages/portal/MedicareIRMAA.tsx', },
  { ref: 'SI-042', applicationDraft: 'docs/patents/applications/SI-042_Integrated_Estate_Freeze_and_IUL_Wealth_Replacement.pdf', title: 'Integrated Estate Freeze & IUL Wealth Replacement System', status: 'partial',
    engine: 'shared/estateTaxEngine.ts', page: 'client/src/pages/portal/EstateTax.tsx',
    note: 'Estate tax engine and trust pages exist; the freeze-technique selector does not. Application drafted 29 April 2026 covering GRAT/IDGT optimisation and IRC §7520 rate monitoring, which is the missing selector — the spec describes more than the code does.' },

  /* ── Built, unclaimed ───────────────────────────────────────────────────
   * Eleven engines in shared/ implement inventions this sheet did not list.
   * They were found by asking the question the original test never asked —
   * which engines exist and go unnamed — and they total 3,165 lines.
   *
   * NONE of them carries an applicationDraft, and that is the point of adding
   * them rather than a defect in them. missingApplicationDraft() is the filing
   * queue, and the reason this sheet exists is that a claim with code and no
   * spec is an asset nobody can file. While these engines had no row they were
   * not in the queue, not in claimCounts(), and not in any number the portfolio
   * reports — they were invisible to the process meant to protect them. A row
   * with no draft is exactly what a drafting queue should look like.
   *
   * Every one is `partial`, and on the same ground rather than eleven different
   * ones: a provenance sweep across all eleven found zero source references.
   * Most take their rates as parameters and so invent nothing themselves — the
   * exposure sits with whatever calls them — and none has a page, so nothing
   * shows their output to a household yet. Each becomes `built` when a surface
   * calls it with sourced inputs, not before.
   *
   * These are numbered SI-043 onward. That is a new number on this sheet only.
   * It does not reconcile the separate numbering the engines carry in their own
   * headers, which collides with this sheet on fourteen refs and is recorded in
   * engineClaimRegistry.ts. Nothing there is renumbered here. */

  { ref: 'SI-043', title: 'IUL Policy Loan Optimization with Variable Rate Hedging, Wash Loan Arbitrage Detection and Multi-Policy Coordination', status: 'partial',
    engine: 'shared/iulLoanOptimizationEngine.ts',
    note: 'iulLoanOptimizationEngine.ts, the most valuable of the unclaimed set, and the one the sheet could least afford to be missing. 496 lines, eight exports, and it is the only module that models variable against fixed against wash loans instead of reducing the choice to one blended rate — which is the mechanism at the centre of every mortgage-acceleration case this platform argues. detectWashArbitrage prices the structures where borrowing is effectively costless; analyzeRateHedge works the spread across a rate cycle rather than assuming a static charge; coordinateLoans and findCrossPolicyMoves distribute a draw across policies. Partial because nothing sources the rate inputs and no page calls it. Note also that its header claims to extend "SI-024 (policyLoanOptimizer)" while this sheet\'s SI-024 is multi-currency and multiCurrencyWealthEngine also declares SI-024 — three uses of one number, which is the sharpest single piece of evidence that two sheets were maintained in parallel.' },

  { ref: 'SI-044', title: 'Physician Loan Refinancing Optimizer with IUL Collateral Integration and Forgiveness Arbitrage', status: 'partial',
    engine: 'shared/physicianLoanRefiEngine.ts',
    note: 'physicianLoanRefiEngine.ts, 468 lines. Distinct from SI-028, which optimises forgiveness — this optimises the decision between pursuing forgiveness and refinancing, carrying an explicit probability that PSLF survives to the borrower\'s forgiveness date. It must never be merged into SI-028: refinancing federal loans permanently forfeits PSLF eligibility, so the two strategies are opposed and recommending both is malpractice. The engine already knows this — its scope note says so and it carries a forfeited[] field enumerating what is given up — so the guard exists in code and needs to exist in the UI too.' },

  { ref: 'SI-045', title: 'Indexed Annuity and IUL Hybrid Income Floor Construction', status: 'partial',
    engine: 'shared/hybridIncomeFloorEngine.ts',
    note: 'hybridIncomeFloorEngine.ts, 550 lines, four exports: layerGuaranteedIncome, optimizeUpsideCapture, sequenceDistributions, buildHybridIncomeFloor. Builds a floor from annuity guarantees and takes upside through indexed crediting, then sequences draws across the two. This is the sequence-risk argument made structural rather than rhetorical, which is what a household near retirement is actually buying. Partial on provenance and no page.' },

  { ref: 'SI-046', title: 'Key Person Insurance Valuation for Medical and Advisory Practices', status: 'partial',
    engine: 'shared/keyPersonValuationEngine.ts',
    note: 'keyPersonValuationEngine.ts, 448 lines. Attributes practice revenue to an individual, prices replacement cost, and models continuity impact. Adjacent to SI-036, physician buy-in/buy-out, which is partial with no engine at all — these two probably want to share a valuation core rather than each grow one.' },

  { ref: 'SI-047', title: 'Social Security Bridge Strategy with IUL Income Substitution', status: 'partial',
    engine: 'shared/socialSecurityBridgeEngine.ts',
    note: 'socialSecurityBridgeEngine.ts, 189 lines. Funds the gap between retirement and a delayed claim so the benefit can grow to its higher level. A genuine and defensible invention, and it collides with SI-009 — Opportunity Zone — which this sheet records as none and the portfolio review kept only as a dependent claim. The stronger claim was sitting behind the weaker one\'s number.' },

  { ref: 'SI-048', title: 'Inflation-Adjusted Retirement Income Gap Analysis', status: 'partial',
    engine: 'shared/retirementGapEngine.ts',
    note: 'retirementGapEngine.ts, 169 lines. Closest to PAT-005, the income waterfall, but not the same question: the waterfall sequences which account to draw from, this sizes the shortfall in real terms first. Check for overlap with PAT-005 before drafting, because a dependent claim may be the honest shape here.' },

  { ref: 'SI-049', title: 'Carrier Financial Strength Monitoring with Downgrade Alerting', status: 'partial',
    engine: 'shared/carrierStrengthMonitorEngine.ts',
    note: 'carrierStrengthMonitorEngine.ts, 168 lines. The one engine in this set whose provenance gap is inside it rather than at its caller: getDefaultCarrierProfiles ships in-repo carrier profiles with no rating agency, document or date. That is also the cheapest gap in the whole sheet to close, because the agencies publish and the figures are citable — which makes this the best first candidate for promotion to built.' },

  { ref: 'SI-050', title: 'Captive Insurance and IUL Integration for Business Owners', status: 'partial',
    engine: 'shared/captiveInsuranceEngine.ts',
    note: 'captiveInsuranceEngine.ts, 125 lines, and the one row in this set that should not be surfaced on provenance grounds alone. Micro-captives appear on IRS listed-transaction guidance, which carries reportable-transaction obligations and a history of enforcement. This needs a compliance read and a decision about whether the platform wants the exposure at all, before anything about it reaches a page — and that is true whatever number it ends up carrying.' },

  { ref: 'SI-051', title: 'Automated Compliance Document Package Generation', status: 'partial',
    engine: 'shared/complianceDocGeneratorEngine.ts',
    note: 'complianceDocGeneratorEngine.ts, 178 lines, harvested from the 688 build. Generates a document package for a transaction. Distinct from SI-016, which pre-checks compliance — a checker and a generator are different claims, and putting a generator behind a checker (as iulIllustrationGate does for illustrations) is the pattern this should follow.' },

  { ref: 'SI-052', title: 'Automated Client Onboarding Workflow Generation', status: 'partial',
    engine: 'shared/clientOnboardingEngine.ts',
    note: 'clientOnboardingEngine.ts, 176 lines, harvested from the 688 build. It had no claim anywhere on either sheet — the only harvested engine in that position — so before this row it could not have been counted as patent coverage by anyone, correctly. Whether workflow generation is patentable subject matter at all is a question for counsel; the row exists so the question can be asked rather than missed.' },

  { ref: 'SI-053', title: 'Automated Prospect Qualification Scoring', status: 'partial',
    engine: 'shared/prospectQualificationEngine.ts',
    note: 'prospectQualificationEngine.ts, 198 lines. A practice-management tool rather than a household-facing one, which makes it the lowest priority in this set for drafting and the lowest risk to leave unbuilt. Recorded for completeness: an engine that exists and is nowhere on the sheet is the condition this whole block was added to end.' },
];

/** Only these are offered to partner sites. */
export function builtClaims(): readonly ClaimEntry[] {
  return CLAIMS.filter((c) => c.status === 'built');
}

export function claimCounts(): Record<ClaimStatus, number> {
  return CLAIMS.reduce(
    (acc, c) => ({ ...acc, [c.status]: acc[c.status] + 1 }),
    { built: 0, partial: 0, dropped: 0, none: 0 } as Record<ClaimStatus, number>
  );
}

export function claimByRef(ref: string): ClaimEntry | undefined {
  return CLAIMS.find((c) => c.ref.toLowerCase() === ref.toLowerCase());
}

/**
 * The pre-filing review's findings are NOT here. They are in
 * server/patentReview.ts, because this module is compiled into the browser
 * bundle by PatentShowcase.tsx and a role check in a component does not stop
 * data from shipping.
 *
 * Build status belongs here and stays visible. Our own assessment of the
 * drafted applications does not.
 */

/** Claims with a drafted application document in this repo. */
export function withApplicationDraft(): readonly ClaimEntry[] {
  return CLAIMS.filter((c) => Boolean(c.applicationDraft));
}

/**
 * Claims with no drafted application. This is the queue, and it is the number
 * that matters if the portfolio is being financed: a claim with code and no
 * spec is an asset nobody can file, and a claim with neither is an idea.
 */
export function missingApplicationDraft(): readonly ClaimEntry[] {
  return CLAIMS.filter((c) => !c.applicationDraft);
}

/**
 * The awkward quadrant: a spec exists but nothing implements it. Not fatal —
 * a US application needs an enabling disclosure, not a working prototype —
 * but worth seeing, because these are the ones where the specification is the
 * only description of the invention that exists anywhere.
 */
export function draftedButUnbuilt(): readonly ClaimEntry[] {
  return CLAIMS.filter(
    (c) => Boolean(c.applicationDraft) && (c.status === 'none' || c.status === 'dropped')
  );
}
