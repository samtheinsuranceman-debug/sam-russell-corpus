/**
 * The claim registry — every claimed invention mapped to the code that implements it.
 *
 * ## Why a registry rather than a spreadsheet
 *
 * The portfolio documents describe ninety-odd inventions. This platform contains
 * sixty-odd shared engines and six hundred-odd portal pages. What was missing was
 * not the work — it was a map from a claim number to the module that does it, that
 * a machine can check.
 *
 * ## The rule
 *
 * `engine` and `page` are repo-relative paths this repository must actually
 * contain. `server/patentCatalog.test.ts` walks every entry and FAILS THE BUILD if
 * a path does not resolve. So this file cannot drift into describing code that was
 * moved or never written, which is exactly how a patent sheet turns into fiction.
 *
 * `status` is deliberately honest:
 *
 *   built    — an engine and/or page exists and does the described work
 *   partial  — related code exists but does not cover the whole claim
 *   none     — on the sheet, no implementation located
 *   dropped  — removed from the portfolio, with the reason recorded
 *
 * Only `built` entries may be offered to partner sites. A marketing page listing
 * fifty-seven tools where thirty render nothing is worse than one listing what works.
 *
 * ## What this file is not
 *
 * It is not evidence that anything is filed. Whether an application exists is
 * decided ONLY by `shared/patentStatus.ts`, which reads receipts. A drafted spec
 * and a filing are different facts.
 */

export type ClaimStatus = 'built' | 'partial' | 'none' | 'dropped';

/** Which family in the consolidated portfolio this claim files under. */
export type Family =
  | 'truth-stack'
  | 'guardian-ledger'
  | 'political-weather'
  | 'property-machine'
  | 'debt-to-liquidity'
  | 'suitcase'
  | 'lifetime-income'
  | 'time-machine'
  | 'listening-site'
  | 'career-to-home'
  | 'wealth-genome'
  | 'cascading-core'
  | 'money-globe'
  | 'ecological-threats'
  | 'divorce-shield'
  | 'unfiled';

export interface ClaimEntry {
  readonly ref: string;
  readonly title: string;
  readonly status: ClaimStatus;
  readonly family: Family;
  /** Shared engine implementing it, repo-relative. */
  readonly engine?: string;
  /** Portal page presenting it, repo-relative. */
  readonly page?: string;
  /** Required when status is `none` or `dropped`. Explains why. */
  readonly note?: string;
}

export const CLAIMS: readonly ClaimEntry[] = [
  // ── Debt-to-Liquidity ───────────────────────────────────────────────────────
  { ref: 'PAT-002', title: 'HELOC-to-IUL Arbitrage Optimization Engine', status: 'built',
    family: 'debt-to-liquidity', engine: 'shared/reverseHeloc.ts', page: 'client/src/pages/portal/ReverseHeloc.tsx' },
  { ref: 'PAT-009', title: 'Mortgage Elimination Through Real Estate Recycling', status: 'built',
    family: 'debt-to-liquidity', engine: 'shared/mortgageKiller.ts' },
  { ref: 'PAT-014', title: 'FIA Collateral Assignment Lending Optimization', status: 'built',
    family: 'debt-to-liquidity', engine: 'shared/fiaCollateralEngine.ts' },
  { ref: 'SI-004', title: 'Premium Financing Arbitrage Calculator', status: 'built',
    family: 'debt-to-liquidity', engine: 'shared/premiumFinancingArbitrage.ts' },
  { ref: 'E-04', title: 'Collateral Ladder — cross-collateral draw sequencing', status: 'none',
    family: 'debt-to-liquidity',
    note: 'Four borrowing engines exist (reverseHeloc, premiumFinancing, policyLoanOptimizer, fiaCollateralEngine) and share no code. The claim is the sequencing across them, and no such module exists yet. Prior-art screen found nothing on cross-collateral sequencing; this is the strongest unbuilt claim in the family.' },

  // ── Time Machine ────────────────────────────────────────────────────────────
  { ref: 'PAT-010', title: 'Time Machine Dual-Illustration Method', status: 'partial',
    family: 'time-machine', engine: 'shared/timeMachineEngine.ts',
    note: 'generateDualIllustration runs a flat AG49 rate beside blended historical rates. That is the disclosure AG 49-A already requires and four vendors already ship, so the implemented form is the crowded one.' },
  { ref: 'PAT-013', title: 'Monte Carlo Engine with IUL Floor/Cap', status: 'built',
    family: 'time-machine', engine: 'shared/monteCarloEngine.ts' },
  { ref: 'SI-002', title: 'Multi-Carrier IUL Comparison Optimizer', status: 'built',
    family: 'time-machine', engine: 'shared/multiCarrierIULOptimizer.ts' },
  { ref: 'SI-003', title: 'Automated Policy Review & Replacement Analyzer', status: 'built',
    family: 'time-machine', engine: 'shared/policyReplacementAnalyzer.ts' },
  { ref: 'E-16', title: 'Scaled Reference Illustration', status: 'dropped',
    family: 'time-machine',
    note: 'WITHDRAWN ON COMPLIANCE REVIEW. A supplemental display built on a hypothetical reference contract with a different premium outlay conflicts with NAIC Model Regulation #582 §8A(4), which requires the supplemental illustration’s premium outlay to EQUAL the basic illustration’s, and with §8A(2), which forbids non-guaranteed elements more favorable than the basic illustration scale. Model #582 is issued under Unfair Trade Practices Act authority. Do not build this as an illustration.' },

  // ── Suitcase (tax) ──────────────────────────────────────────────────────────
  { ref: 'PAT-005', title: 'Tax-Free Retirement Income Waterfall Engine', status: 'built',
    family: 'suitcase', engine: 'shared/taxBracketEngine.ts' },
  { ref: 'SI-006', title: 'Real-Time Tax Code Change Impact Simulator', status: 'built',
    family: 'suitcase', engine: 'shared/taxCodeChangeSimulator.ts' },
  { ref: 'SI-010', title: 'State Tax Arbitrage Migration Planner', status: 'built',
    family: 'suitcase', engine: 'shared/stateTaxMigrationEngine.ts' },
  { ref: 'SI-008', title: 'Charitable Remainder Trust + IUL Wealth Replacement', status: 'built',
    family: 'suitcase', engine: 'shared/crtWealthReplacementEngine.ts' },

  // ── Lifetime Income ─────────────────────────────────────────────────────────
  { ref: 'PAT-021', title: 'Lifetime Income Chain', status: 'built',
    family: 'lifetime-income', engine: 'shared/lifetimeIncomeEngine.ts' },
  { ref: 'SI-005', title: 'Living Benefits Probability Engine', status: 'built',
    family: 'lifetime-income', engine: 'shared/livingBenefitsProbabilityEngine.ts' },
  { ref: 'SI-025', title: 'Annuity Comparison with Hidden Fee Detection', status: 'built',
    family: 'lifetime-income', engine: 'shared/annuityFeeDetectionEngine.ts' },
  { ref: 'SI-031', title: 'Disability Insurance Gap Analyzer', status: 'built',
    family: 'lifetime-income', engine: 'shared/disabilityGapEngine.ts' },
  { ref: 'SI-032', title: 'Multi-Generational Wealth Transfer Sequencing', status: 'built',
    family: 'lifetime-income', engine: 'shared/generationalWealthEngine.ts' },

  // ── Wealth Genome ───────────────────────────────────────────────────────────
  { ref: 'PAT-004', title: 'Wealth Genome Scoring & Classification', status: 'built',
    family: 'wealth-genome', engine: 'shared/retirementDNA.ts' },
  { ref: 'PAT-008', title: 'Behavioral Lock-In Prevention System', status: 'partial',
    family: 'wealth-genome', engine: 'shared/behavioralBiasEngine.ts',
    note: 'Detects the bias. The evidence-backed cooling-off that the claim turns on is not wired to the drift series in shared/livingRiskProfile.ts.' },
  { ref: 'SI-035', title: 'Risk Tolerance Drift Detection', status: 'partial',
    family: 'wealth-genome', engine: 'shared/livingRiskProfile.ts',
    note: 'The drift time series exists. Andes Wealth holds a patent on investor risk drift, so this is defensive unless joined to PAT-008 per emergent E-8.' },

  // ── Cascading Core ──────────────────────────────────────────────────────────
  { ref: 'PAT-015', title: 'Advisor Practice Revenue & Territory Strategy', status: 'built',
    family: 'cascading-core', engine: 'shared/weaponizeEngines.ts' },
  { ref: 'SI-019', title: 'Peer Benchmarking Intelligence Network', status: 'built',
    family: 'cascading-core', engine: 'shared/peerBenchmarkingEngine.ts' },
  { ref: 'SI-017', title: 'Automated Succession Planning Valuation', status: 'built',
    family: 'cascading-core', engine: 'shared/successionValuationEngine.ts' },
  { ref: 'SI-018', title: 'Dynamic Commission Optimization Router', status: 'dropped',
    family: 'unfiled', engine: 'shared/commissionOptimizerEngine.ts',
    note: 'DROPPED FROM THE PORTFOLIO. A system that routes clients by advisor commission is a conflict-of-interest exhibit, not a patent. The engine stays for internal compensation modelling; it must never drive a client-facing recommendation.' },

  // ── Property Machine ────────────────────────────────────────────────────────
  { ref: 'SI-029', title: 'Real Estate Syndication Tax Benefit Aggregation', status: 'partial',
    family: 'property-machine', engine: 'shared/multiPropertyMyga.ts',
    note: 'The MYGA ladder across properties exists. The K-1 aggregation the claim describes does not.' },

  // ── Divorce Shield ──────────────────────────────────────────────────────────
  { ref: 'PAT-006', title: 'Divorce Asset Protection with IUL Shielding', status: 'built',
    family: 'divorce-shield', engine: 'shared/divorceStateRules.ts',
    page: 'client/src/pages/portal/DivorceCalculator.tsx' },

  // ── Ecological Threats ──────────────────────────────────────────────────────
  { ref: 'PAT-007', title: 'Ecological Drivers Retirement Risk Assessment', status: 'none',
    family: 'ecological-threats',
    note: 'No engine computes ten named threats from sourced series into one explainable score. The prior-art screen found no close art, which makes this worth building rather than worth filing on paper.' },

  // ── Compliance / Truth ──────────────────────────────────────────────────────
  { ref: 'SI-016', title: 'AI-Powered Compliance Pre-Check System', status: 'built',
    family: 'truth-stack', engine: 'shared/iulComplianceEngine.ts' },
  { ref: 'SI-001', title: 'Dynamic IUL Illustration Compliance Engine', status: 'built',
    family: 'truth-stack', engine: 'shared/iulComplianceEngine.ts' },

  // ── On the sheet, not in this repository ────────────────────────────────────
  { ref: 'SI-024', title: 'Multi-Currency Wealth Optimization', status: 'partial',
    family: 'unfiled', engine: 'shared/multiCurrencyWealthEngine.ts',
    note: 'An engine exists but the screen marked the space crowded; carried as a dependent claim at most.' },
  { ref: 'SI-023', title: 'Market Sentiment Integration for IUL Crediting', status: 'none',
    family: 'unfiled',
    note: 'No code, and unsupportable under the platform’s own sourcing rules: a sentiment figure cannot carry a citation of the kind every other number here must carry.' },
  { ref: 'SI-026', title: 'Regulatory Sandbox Simulation Environment', status: 'none',
    family: 'unfiled', note: 'No code located. Anything filed on this before it exists is a paper patent.' },
];

const BY_REF = new Map(CLAIMS.map((c) => [c.ref, c]));

export function claim(ref: string): ClaimEntry | null {
  return BY_REF.get(ref.trim().toUpperCase()) ?? null;
}

export function claimsByStatus(status: ClaimStatus): ClaimEntry[] {
  return CLAIMS.filter((c) => c.status === status);
}

export function claimsInFamily(family: Family): ClaimEntry[] {
  return CLAIMS.filter((c) => c.family === family);
}

/** The only claims a partner site or marketing surface may list. */
export function offerableClaims(): ClaimEntry[] {
  return CLAIMS.filter((c) => c.status === 'built');
}

export function portfolioCounts(): Record<ClaimStatus, number> {
  const out: Record<ClaimStatus, number> = { built: 0, partial: 0, none: 0, dropped: 0 };
  for (const c of CLAIMS) out[c.status] += 1;
  return out;
}
