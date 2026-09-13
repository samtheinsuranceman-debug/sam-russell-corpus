/**
 * The 57 — every claimed invention mapped to the code that implements it.
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
    engine: 'shared/journeyEngine.ts', page: 'client/src/pages/portal/MultiScenarioPlayZone.tsx',
    note: 'The drafted claims recite an FPGA co-processor and a sub-2-second cascade; journeyEngine.ts is software and makes no timing guarantee.' },
  { ref: 'PAT-002', applicationDraft: 'docs/patents/applications/PAT-002_HELOC_to_IUL_Arbitrage_Optimization_Engine.pdf', title: 'HELOC-to-IUL Arbitrage Optimization Engine', status: 'built',
    engine: 'shared/reverseHeloc.ts', page: 'client/src/pages/portal/ReverseHeloc.tsx',
    note: 'The drafted claims recite real-time multi-lender rate aggregation; reverseHeloc.ts holds no lender feed and takes the rate as an input.' },
  { ref: 'PAT-003', applicationDraft: 'docs/patents/applications/PAT-003_AI_Whisper_Coaching_System_for_Financial_Advisors.pdf', title: 'AI Whisper Coaching System for Financial Advisors', status: 'built',
    engine: 'server/ultraAI.ts', page: 'client/src/pages/portal/LiveCoPilot.tsx',
    note: 'The drafted claims recite voice-tone analysis hardware and biometric authentication; ultraAI.ts does neither.' },
  { ref: 'PAT-004', applicationDraft: 'docs/patents/applications/PAT-004_Wealth_Genome_Scoring_and_Classification_System.pdf', title: 'Wealth Genome Scoring & Classification System', status: 'built',
    engine: 'shared/wealthGenome.ts', page: 'client/src/pages/portal/RiskToleranceScoring.tsx',
    note: 'The drafted claims recite genetic-algorithm weight evolution; wealthGenome.ts scores against fixed weights.' },
  { ref: 'PAT-005', applicationDraft: 'docs/patents/applications/PAT-005_Tax_Free_Retirement_Income_Waterfall_Engine.pdf', title: 'Tax-Free Retirement Income Waterfall Engine', status: 'built',
    engine: 'shared/incomeForLife.ts', page: 'client/src/pages/portal/TaxWaterfall.tsx' },
  { ref: 'PAT-006', applicationDraft: 'docs/patents/applications/PAT-006_Divorce_Asset_Protection_Calculator_with_IUL_Shielding.pdf', title: 'Divorce Asset Protection Calculator with IUL Shielding', status: 'built',
    page: 'client/src/pages/portal/DivorceCalculator.tsx' },
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
    page: 'client/src/pages/portal/CharitableGivingOptimizer.tsx' },
  { ref: 'SI-009', applicationDraft: 'docs/patents/applications/SI-009_Opportunity_Zone_IUL_Capital_Gains_Deferral_Engine.pdf', title: 'Opportunity Zone + IUL Capital Gains Deferral Engine', status: 'none',
    note: 'On the sheet; no dedicated implementation located. Portfolio review kept it only as a dependent claim (strategy is known, software claim thin).' },
  { ref: 'SI-010', applicationDraft: 'docs/patents/applications/SI-010_State_Tax_Arbitrage_Migration_Planner.pdf', title: 'State Tax Arbitrage Migration Planner', status: 'partial',
    engine: 'shared/taxRules.ts',
    note: 'Rule tables exist and are versioned by year; no migration planner surface.' },
  { ref: 'SI-011', applicationDraft: 'docs/patents/applications/SI-011_Gamified_Financial_Literacy_Platform.pdf', title: 'Gamified Financial Literacy Platform', status: 'partial',
    page: 'client/src/pages/portal/RewardsVault.tsx',
    note: 'Rewards surface exists; the literacy curriculum does not.' },
  { ref: 'SI-012', applicationDraft: 'docs/patents/applications/SI-012_Predictive_Client_Churn_Prevention_System.pdf', title: 'Predictive Client Churn Prevention System', status: 'built',
    page: 'client/src/pages/portal/ClientEngagementScore.tsx' },
  { ref: 'SI-013', applicationDraft: 'docs/patents/applications/SI-013_Automated_Life_Event_Detection_and_Response_Engine.pdf', title: 'Automated Life Event Detection & Response Engine', status: 'dropped',
    note: 'Portfolio review: life-event detection with playbooks marked taken or crowded.' },
  { ref: 'SI-014', applicationDraft: 'docs/patents/applications/SI-014_Client_Family_Tree_Financial_Mapping.pdf', title: 'Client Family Tree Financial Mapping', status: 'built',
    page: 'client/src/pages/portal/MultiGenWealthTransfer.tsx' },
  { ref: 'SI-015', applicationDraft: 'docs/patents/applications/SI-015_Voice_Activated_Financial_Dashboard.pdf', title: 'Voice-Activated Financial Dashboard', status: 'built',
    page: 'client/src/pages/portal/VoicePlanBuilder.tsx' },
  { ref: 'SI-016', applicationDraft: 'docs/patents/applications/SI-016_AI_Powered_Compliance_Pre_Check_System.pdf', title: 'AI-Powered Compliance Pre-Check System', status: 'built',
    page: 'client/src/pages/portal/ComplianceMonitoringDashboard.tsx' },
  { ref: 'SI-017', applicationDraft: 'docs/patents/applications/SI-017_Automated_Succession_Planning_Valuation_Engine.pdf', title: 'Automated Succession Planning Valuation Engine', status: 'built',
    page: 'client/src/pages/portal/SuccessionPlanningWizard.tsx' },
  { ref: 'SI-018', applicationDraft: 'docs/patents/applications/SI-018_Dynamic_Commission_Optimization_Router.pdf', title: 'Dynamic Commission Optimization Router', status: 'built',
    page: 'client/src/pages/portal/CommissionCalculator.tsx' },
  { ref: 'SI-019', applicationDraft: 'docs/patents/applications/SI-019_Peer_Benchmarking_Intelligence_Network.pdf', title: 'Peer Benchmarking Intelligence Network', status: 'built',
    engine: 'shared/careerEngine.ts', page: 'client/src/pages/portal/Leaderboard.tsx' },
  { ref: 'SI-020', applicationDraft: 'docs/patents/applications/SI-020_Automated_CE_Credit_Tracker_and_Recommendation_Engine.pdf', title: 'Automated CE Credit Tracker & Recommendation Engine', status: 'partial',
    page: 'client/src/pages/portal/AdvisorTraining.tsx',
    note: 'Training surface exists; CE credit tracking against state requirements does not.' },
  { ref: 'SI-021', applicationDraft: 'docs/patents/applications/SI-021_Extreme_Scenario_Portfolio_Stress_Testing.pdf', title: 'Extreme-Scenario Portfolio Stress Testing', status: 'built',
    engine: 'shared/historicalShocks.ts', page: 'client/src/pages/portal/MarketScenarioStressTest.tsx',
    note: 'Renamed from "Quantum-Resistant", which the portfolio review called a misnomer — nothing about it concerns quantum computing. Named shocks (dot-com, 2008, 2020, 2022) run against the policy\'s own floor and cap; windows outside the held series are refused with the reason rather than filled in from memory. A Monte Carlo answers "across ten thousand futures" and persuades nobody, because no client has lived in a distribution. They lived through 2008.' },
  { ref: 'SI-022', applicationDraft: 'docs/patents/applications/SI-022_Blockchain_Verified_Financial_Plan_Audit_Trail.pdf', title: 'Blockchain-Verified Financial Plan Audit Trail', status: 'built',
    engine: 'shared/planLedger.ts', page: 'client/src/pages/portal/ComplianceAuditTrail.tsx' },
  { ref: 'SI-023', applicationDraft: 'docs/patents/applications/SI-023_Real_Time_Market_Sentiment_Integration_for_IUL.pdf', title: 'Real-Time Market Sentiment Integration for IUL Crediting', status: 'partial',
    engine: 'shared/strSources.ts',
    note: 'Blocked on data, not on code. This repo admits a figure through one of two doors — read from the publisher with a link and date, or typed by a person from a named page — and no sentiment feed yet meets either. The source-registry pattern in strSources.ts is the shape it takes: register the feed with its access level, and the engine refuses to speak until a key for a qualifying source exists. Building it before the source would mean inventing the number.' },
  { ref: 'SI-024', applicationDraft: 'docs/patents/applications/SI-024_Multi_Currency_Wealth_Optimization_for_International_Clients.pdf', title: 'Multi-Currency Wealth Optimization for International Clients', status: 'none',
    note: 'On the sheet; no implementation located.' },
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
    page: 'client/src/pages/portal/IncomeGapAnalyzer.tsx',
    note: 'Gap analysis exists; specialty-specific disability probability does not.' },
  { ref: 'SI-032', applicationDraft: 'docs/patents/applications/SI-032_Multi_Generational_Wealth_Transfer_Sequencing_Engine.pdf', title: 'Multi-Generational Wealth Transfer Sequencing Engine', status: 'built',
    engine: 'shared/inheritanceEngine.ts', page: 'client/src/pages/portal/MultiGenWealthTransfer.tsx' },
  { ref: 'SI-033', applicationDraft: 'docs/patents/applications/SI-033_Practice_Acquisition_Due_Diligence_Scoring_Platform.pdf', title: 'Practice Acquisition Due Diligence Scoring Platform', status: 'none',
    note: 'On the sheet; no implementation located.' },
  { ref: 'SI-034', applicationDraft: 'docs/patents/applications/SI-034_Automated_1031_Exchange_Chain_Optimization_with_IUL.pdf', title: 'Automated 1031 Exchange Chain Optimization with IUL Exit', status: 'partial',
    page: 'client/src/pages/portal/RealEstateMogul.tsx',
    note: 'Property chain exists; the 1031 chain optimizer does not. Portfolio review kept it as a dependent claim only.' },
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
 * Defects that appear in EVERY drafted application, measured across all 57
 * rather than inferred from a sample. Kept here because the catalogue is what
 * the rest of the app reads, and a reader who sees 57 drafts should see this
 * in the same breath. The evidence and the reasoning are in
 * docs/patents/APPLICATION_REVIEW.md.
 */
export const PORTFOLIO_DEFECTS: readonly string[] = [
  'All 57 recite a Field-Programmable Gate Array co-processor. Nothing in this repo runs on one.',
  'All 57 embed the same five diagrams, differing only in one acronym in one box — 285 figures, 5 drawings.',
  'All 57 carry a drafting-score table ("Enhanced Score 9.95 / 10 (capped)") inside the Summary of the Invention.',
  'All 57 render claim element (c) as the copyright symbol.',
  'All 57 state the portfolio has been "filed by" Russell Holdings Management. Nothing has been filed.',
];

/** Where the full pre-filing review lives. */
export const APPLICATION_REVIEW_DOC = 'docs/patents/APPLICATION_REVIEW.md';

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
