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
  { ref: 'PAT-001', title: 'Cascading Multi-Calculator Financial Planning Engine', status: 'built',
    engine: 'shared/journeyEngine.ts', page: 'client/src/pages/portal/MultiScenarioPlayZone.tsx',
    applicationDraft: 'docs/patents/applications/PAT-001_Cascading_Multi_Calculator_Engine.pdf',
    note: 'Application drafted 29 April 2026. Its claims recite an FPGA co-processor and a sub-2-second cascade; this repo has neither. See docs/patents/APPLICATION_REVIEW.md before filing.' },
  { ref: 'PAT-002', title: 'HELOC-to-IUL Arbitrage Optimization Engine', status: 'built',
    engine: 'shared/reverseHeloc.ts', page: 'client/src/pages/portal/ReverseHeloc.tsx',
    applicationDraft: 'docs/patents/applications/PAT-002_HELOC_to_IUL_Arbitrage_Engine.pdf',
    note: 'Application drafted 29 April 2026. Recites FPGA-accelerated simulation and real-time multi-lender rate aggregation; the engine is software-only and holds no lender feed. See docs/patents/APPLICATION_REVIEW.md.' },
  { ref: 'PAT-003', title: 'AI Whisper Coaching System for Financial Advisors', status: 'built',
    engine: 'server/ultraAI.ts', page: 'client/src/pages/portal/LiveCoPilot.tsx',
    applicationDraft: 'docs/patents/applications/PAT-003_AI_Whisper_Coaching_System.pdf',
    note: 'Application drafted 29 April 2026. Recites voice-tone analysis hardware and biometric authentication, neither of which exists here. See docs/patents/APPLICATION_REVIEW.md.' },
  { ref: 'PAT-004', title: 'Wealth Genome Scoring & Classification System', status: 'built',
    engine: 'shared/wealthGenome.ts', page: 'client/src/pages/portal/RiskToleranceScoring.tsx',
    applicationDraft: 'docs/patents/applications/PAT-004_Wealth_Genome_Scoring_System.pdf',
    note: 'Application drafted 29 April 2026. Recites genetic-algorithm weight evolution and hardware-accelerated archetype discovery; wealthGenome.ts scores against fixed weights. See docs/patents/APPLICATION_REVIEW.md.' },
  { ref: 'PAT-005', title: 'Tax-Free Retirement Income Waterfall Engine', status: 'built',
    engine: 'shared/incomeForLife.ts', page: 'client/src/pages/portal/TaxWaterfall.tsx' },
  { ref: 'PAT-006', title: 'Divorce Asset Protection Calculator with IUL Shielding', status: 'built',
    page: 'client/src/pages/portal/DivorceCalculator.tsx' },
  { ref: 'PAT-007', title: 'Ecological Drivers Retirement Risk Assessment Framework', status: 'built',
    engine: 'shared/erosion.ts', page: 'client/src/pages/portal/EcologicalDrivers.tsx' },
  { ref: 'PAT-008', title: 'Behavioral Lock-In Prevention System', status: 'built',
    engine: 'shared/livingRiskProfile.ts', page: 'client/src/pages/portal/PortfolioDriftMonitor.tsx' },
  { ref: 'PAT-009', title: 'Mortgage Elimination Through Real Estate Recycling & IUL', status: 'built',
    engine: 'shared/mortgageKiller.ts', page: 'client/src/pages/portal/HouseRecyclingStrategy.tsx' },
  { ref: 'PAT-010', title: 'Time Machine Dual-Illustration Method', status: 'built',
    engine: 'shared/timeMachineEngine.ts', page: 'client/src/pages/portal/TimeMachineAG49.tsx' },
  { ref: 'PAT-011', title: 'Russell Number Multi-Dimensional Advisor Scoring', status: 'built',
    engine: 'shared/tabScores.ts', page: 'client/src/pages/portal/RussellNumber.tsx' },
  { ref: 'PAT-012', title: 'Roth Conversion with Short-Term Rental Tax Offset Strategy', status: 'built',
    engine: 'shared/strEngine.ts', page: 'client/src/pages/portal/RothConversionSTR.tsx' },
  { ref: 'PAT-013', title: 'Monte Carlo Simulation Engine with IUL Floor/Cap', status: 'built',
    engine: 'shared/monteCarloEngine.ts', page: 'client/src/pages/portal/MarketScenarioStressTest.tsx' },
  { ref: 'PAT-014', title: 'FIA Collateral Assignment Lending Optimization System', status: 'built',
    engine: 'shared/fiaCollateralEngine.ts', page: 'client/src/pages/portal/FIACollateralStrategy.tsx' },
  { ref: 'PAT-015', title: 'Automated Advisor Practice Revenue & Territory Strategy', status: 'built',
    engine: 'shared/advisorModes.ts', page: 'client/src/pages/portal/AdvisorIncomeCalculator.tsx' },

  // ── The forty-two ──────────────────────────────────────────────────────
  { ref: 'SI-001', title: 'Dynamic IUL Illustration Compliance Engine', status: 'built',
    engine: 'shared/ag49Validator.ts',
    note: 'Rebuilt as a validator. The dropped version was "maximize persuasive impact within AG49"; this checks a finished exhibit against AG 49-A as amended 21 Nov 2025 and names each violation with its authority. Same subject, opposite aim, and a compliance desk can buy it.' },
  { ref: 'SI-002', title: 'Multi-Carrier IUL Comparison Optimizer', status: 'built',
    engine: 'shared/carrierRecommendation.ts', page: 'client/src/pages/portal/CarrierComparison.tsx' },
  { ref: 'SI-003', title: 'Automated Policy Review & Replacement Analyzer', status: 'built',
    engine: 'shared/replacementScoring.ts', page: 'client/src/pages/portal/PolicyReview.tsx' },
  { ref: 'SI-004', title: 'Premium Financing Arbitrage Calculator', status: 'built',
    engine: 'shared/premiumFinancing.ts', page: 'client/src/pages/portal/PremiumFinancing.tsx' },
  { ref: 'SI-005', title: 'Living Benefits Probability Engine', status: 'built',
    engine: 'shared/ltcEngine.ts', page: 'client/src/pages/portal/LongTermCare.tsx' },
  { ref: 'SI-006', title: 'Real-Time Tax Code Change Impact Simulator', status: 'built',
    engine: 'shared/taxHistory.ts', page: 'client/src/pages/portal/Erosion.tsx' },
  { ref: 'SI-007', title: 'Multi-Entity Tax Optimization Router', status: 'built',
    engine: 'shared/taxStrategies.ts', page: 'client/src/pages/portal/BusinessOwnerPlanning.tsx' },
  { ref: 'SI-008', title: 'Charitable Remainder Trust + IUL Wealth Replacement', status: 'built',
    page: 'client/src/pages/portal/CharitableGivingOptimizer.tsx' },
  { ref: 'SI-009', title: 'Opportunity Zone + IUL Capital Gains Deferral Engine', status: 'none',
    note: 'On the sheet; no dedicated implementation located. Portfolio review kept it only as a dependent claim (strategy is known, software claim thin).' },
  { ref: 'SI-010', title: 'State Tax Arbitrage Migration Planner', status: 'partial',
    engine: 'shared/taxRules.ts',
    note: 'Rule tables exist and are versioned by year; no migration planner surface.' },
  { ref: 'SI-011', title: 'Gamified Financial Literacy Platform', status: 'partial',
    page: 'client/src/pages/portal/RewardsVault.tsx',
    note: 'Rewards surface exists; the literacy curriculum does not.' },
  { ref: 'SI-012', title: 'Predictive Client Churn Prevention System', status: 'built',
    page: 'client/src/pages/portal/ClientEngagementScore.tsx' },
  { ref: 'SI-013', title: 'Automated Life Event Detection & Response Engine', status: 'dropped',
    note: 'Portfolio review: life-event detection with playbooks marked taken or crowded.' },
  { ref: 'SI-014', title: 'Client Family Tree Financial Mapping', status: 'built',
    page: 'client/src/pages/portal/MultiGenWealthTransfer.tsx' },
  { ref: 'SI-015', title: 'Voice-Activated Financial Dashboard', status: 'built',
    page: 'client/src/pages/portal/VoicePlanBuilder.tsx' },
  { ref: 'SI-016', title: 'AI-Powered Compliance Pre-Check System', status: 'built',
    page: 'client/src/pages/portal/ComplianceMonitoringDashboard.tsx' },
  { ref: 'SI-017', title: 'Automated Succession Planning Valuation Engine', status: 'built',
    page: 'client/src/pages/portal/SuccessionPlanningWizard.tsx' },
  { ref: 'SI-018', title: 'Dynamic Commission Optimization Router', status: 'built',
    page: 'client/src/pages/portal/CommissionCalculator.tsx' },
  { ref: 'SI-019', title: 'Peer Benchmarking Intelligence Network', status: 'built',
    engine: 'shared/careerEngine.ts', page: 'client/src/pages/portal/Leaderboard.tsx' },
  { ref: 'SI-020', title: 'Automated CE Credit Tracker & Recommendation Engine', status: 'partial',
    page: 'client/src/pages/portal/AdvisorTraining.tsx',
    note: 'Training surface exists; CE credit tracking against state requirements does not.' },
  { ref: 'SI-021', title: 'Extreme-Scenario Portfolio Stress Testing', status: 'built',
    engine: 'shared/historicalShocks.ts', page: 'client/src/pages/portal/MarketScenarioStressTest.tsx',
    note: 'Renamed from "Quantum-Resistant", which the portfolio review called a misnomer — nothing about it concerns quantum computing. Named shocks (dot-com, 2008, 2020, 2022) run against the policy\'s own floor and cap; windows outside the held series are refused with the reason rather than filled in from memory. A Monte Carlo answers "across ten thousand futures" and persuades nobody, because no client has lived in a distribution. They lived through 2008.' },
  { ref: 'SI-022', title: 'Blockchain-Verified Financial Plan Audit Trail', status: 'built',
    engine: 'shared/planLedger.ts', page: 'client/src/pages/portal/ComplianceAuditTrail.tsx' },
  { ref: 'SI-023', title: 'Real-Time Market Sentiment Integration for IUL Crediting', status: 'partial',
    engine: 'shared/strSources.ts',
    note: 'Blocked on data, not on code. This repo admits a figure through one of two doors — read from the publisher with a link and date, or typed by a person from a named page — and no sentiment feed yet meets either. The source-registry pattern in strSources.ts is the shape it takes: register the feed with its access level, and the engine refuses to speak until a key for a qualifying source exists. Building it before the source would mean inventing the number.' },
  { ref: 'SI-024', title: 'Multi-Currency Wealth Optimization for International Clients', status: 'none',
    note: 'On the sheet; no implementation located.' },
  { ref: 'SI-025', title: 'Automated Annuity Comparison with Hidden Fee Detection', status: 'built',
    engine: 'shared/annuityData.ts', page: 'client/src/pages/portal/FeeTransparencyDashboard.tsx' },
  { ref: 'SI-026', title: 'Regulatory Sandbox Simulation Environment', status: 'built',
    engine: 'shared/regulatorySandbox.ts', page: 'client/src/pages/portal/Erosion.tsx',
    note: 'The review said it had no code behind it. A year-to-year comparison only answers questions the calendar already settled; this builds a rule set no legislature passed — "what if the top rate returns to 39.6", "what if the estate exclusion halves" — and runs a household through it using the same machinery. Every synthetic set is versioned sandbox: and carries its edits in its source, so a figure computed under it can never later be mistaken for one computed under a revenue procedure.' },
  { ref: 'SI-027', title: 'Client Digital Twin Financial Modeling', status: 'built',
    page: 'client/src/pages/portal/AvatarTwins.tsx' },
  { ref: 'SI-028', title: 'Physician Student Loan Forgiveness Optimization Engine', status: 'built',
    engine: 'shared/forgiveness.ts', page: 'client/src/pages/portal/Forgiveness.tsx' },
  { ref: 'SI-029', title: 'Real Estate Syndication Tax Benefit Aggregation Platform', status: 'partial',
    page: 'client/src/pages/portal/RealEstateMogul.tsx',
    note: 'Property engine exists; K-1 aggregation across syndications does not.' },
  { ref: 'SI-030', title: 'Spousal Income Splitting & IUL Arbitrage Optimizer', status: 'built',
    page: 'client/src/pages/portal/CouplesMode.tsx' },
  { ref: 'SI-031', title: 'Disability Insurance Gap Analyzer with IUL Bridge Funding', status: 'partial',
    page: 'client/src/pages/portal/IncomeGapAnalyzer.tsx',
    note: 'Gap analysis exists; specialty-specific disability probability does not.' },
  { ref: 'SI-032', title: 'Multi-Generational Wealth Transfer Sequencing Engine', status: 'built',
    engine: 'shared/inheritanceEngine.ts', page: 'client/src/pages/portal/MultiGenWealthTransfer.tsx' },
  { ref: 'SI-033', title: 'Practice Acquisition Due Diligence Scoring Platform', status: 'none',
    note: 'On the sheet; no implementation located.' },
  { ref: 'SI-034', title: 'Automated 1031 Exchange Chain Optimization with IUL Exit', status: 'partial',
    page: 'client/src/pages/portal/RealEstateMogul.tsx',
    note: 'Property chain exists; the 1031 chain optimizer does not. Portfolio review kept it as a dependent claim only.' },
  { ref: 'SI-035', title: 'Client Risk Tolerance Drift Detection & Auto-Rebalancing', status: 'built',
    engine: 'shared/livingRiskProfile.ts', page: 'client/src/pages/portal/PortfolioDriftMonitor.tsx' },
  { ref: 'SI-036', title: 'Physician Buy-In/Buy-Out Partnership Valuation Engine', status: 'partial',
    page: 'client/src/pages/portal/BusinessOwnerPlanning.tsx',
    note: 'Business owner surface exists; partnership buy-in valuation does not.' },
  { ref: 'SI-037', title: 'Tax Loss Harvesting Coordination Engine with IUL Premium Timing', status: 'built',
    page: 'client/src/pages/portal/TaxLossHarvestingScanner.tsx' },
  { ref: 'SI-038', title: 'Advisor-Client Communication Sentiment Analysis', status: 'none',
    applicationDraft: 'docs/patents/applications/SI-038_Sentiment_Analysis_Compliance_Monitor.pdf',
    note: 'Application drafted 29 April 2026 (emotional tone classification, pressure-tactic detection, suitability-aligned scoring). No implementation in this repo — this is one of two claims with a spec and no code.' },
  { ref: 'SI-039', title: 'Dynamic Beneficiary Optimization Engine', status: 'built',
    page: 'client/src/pages/portal/BeneficiaryOptimization.tsx',
    applicationDraft: 'docs/patents/applications/SI-039_Dynamic_Beneficiary_Optimization_Engine.pdf' },
  { ref: 'SI-040', title: 'Concentrated Stock Position Diversification Planner with IUL', status: 'none',
    applicationDraft: 'docs/patents/applications/SI-040_Concentrated_Stock_Position_Diversification.pdf',
    note: 'Application drafted 29 April 2026 (exchange-fund modelling, prepaid variable forward optimisation, tax-managed liquidation scheduling). No implementation in this repo — the second of two claims with a spec and no code.' },
  { ref: 'SI-041', title: 'Medicare Optimization & IRMAA Avoidance Planning Engine', status: 'built',
    page: 'client/src/pages/portal/MedicareIRMAA.tsx',
    applicationDraft: 'docs/patents/applications/SI-041_Medicare_IRMAA_Avoidance_Optimizer.pdf' },
  { ref: 'SI-042', title: 'Integrated Estate Freeze & IUL Wealth Replacement System', status: 'partial',
    engine: 'shared/estateTaxEngine.ts', page: 'client/src/pages/portal/EstateTax.tsx',
    applicationDraft: 'docs/patents/applications/SI-042_Estate_Freeze_IUL_Wealth_Replacement.pdf',
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
