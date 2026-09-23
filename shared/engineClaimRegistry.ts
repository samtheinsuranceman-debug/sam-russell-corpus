// ─── Engine → claim registry ────────────────────────────────────────────────
// Every engine in shared/ that declares a claim number in its own header, and
// what the catalog does with it.
//
// ## Why this file exists
//
// patentCatalog.ts maps a claim to the module implementing it, and a test walks
// every path so the map cannot describe code that was moved or never written.
// That test runs in one direction only: it asks whether every engine the catalog
// NAMES exists. It never asks the converse — whether an engine that exists is
// named. The gap is not hypothetical. Thirty-five engines in this directory
// declare a claim number in their header comment; the catalog cited none of
// them, and four rows carried notes asserting that work does not exist while the
// file doing that work sat in the same directory. Every test passed the whole
// time, because nothing looked that way.
//
// So the rule here is the mirror of the catalog's: an engine that declares a
// claim must be accounted for — cited by a row, or listed below with the reason
// it is not. Silence is the one thing that is not allowed. A test enforces it,
// which means a newly harvested engine cannot enter this directory unnoticed.
//
// ## The two dispositions, and why neither is a bug to be fixed quietly
//
// `second-implementation` — the claim's row already names a different module,
// and this engine implements the same claim another way. That is not redundancy
// to be deleted on sight. In most of these pairs the trunk's module is the
// sourced one (versioned tables, a publisher, a date) and the sister-invention
// engine is the broader one (more surface, no provenance). Deleting either loses
// something real, and promoting the unsourced one to the row would trade
// evidence for surface. What each pair needs is a decision recorded by a person,
// not a rename.
//
// `ref-collision` — the engine's declared number and the catalog's number for
// that row describe different inventions. These engines index a DIFFERENT sheet
// than patentCatalog.ts. That is not sloppiness inside the engines: they are
// internally consistent and several explicitly distinguish themselves from their
// siblings (disabilityGapAnalyzerEngine's header says it is distinct from
// SI-013). Two numbering schemes were maintained in parallel and neither is
// obviously canonical. Renumbering either side is an owner decision with patent
// consequences — a claim number printed on a drafted application is not a label
// to be reassigned by whoever notices the clash — so nothing is renumbered here.
// The clash is recorded so it stops being invisible.

export type EngineDisposition = 'second-implementation' | 'ref-collision';

export interface EngineRegistryEntry {
  /** Repo-relative path. A test resolves it against the filesystem. */
  readonly file: string;
  /** The claim number the engine's own header declares. */
  readonly declares: string;
  /** What the engine's header says it is. */
  readonly subject: string;
  readonly disposition: EngineDisposition;
  /** For second-implementation: the module the row names instead. */
  readonly rowNames?: string;
  readonly note: string;
}

export const ENGINE_REGISTRY: readonly EngineRegistryEntry[] = [
  /* ═══ Second implementations ═════════════════════════════════════════════
   * The claim is cited; this engine is the other way of doing it. Ordered by
   * how much the two disagree, because that is the order to resolve them in. */

  { file: 'shared/stateTaxMigrationEngine.ts', declares: 'SI-010',
    subject: 'State Tax Arbitrage Migration Planner',
    disposition: 'second-implementation', rowNames: 'shared/taxRules.ts',
    note: 'The sharpest of these pairs. taxRules.ts holds sourced, year-versioned tables; this engine holds its own state profiles with no publisher or date but exports the calculateMigration surface the claim actually describes. Resolution is to keep this engine and have it read taxRules.ts instead of its own table, which gives the claim both provenance and surface. Until then the row stays pointed at the sourced module.' },

  { file: 'shared/iulComplianceEngine.ts', declares: 'SI-001',
    subject: 'Dynamic IUL Illustration Compliance Engine',
    disposition: 'second-implementation', rowNames: 'shared/ag49Validator.ts',
    note: 'RESOLVED — iulIllustrationGate.ts now composes the two, and neither is deleted. This engine keeps the broad modelling surface (carrier, product, health class, index strategy, cap, floor, participation, spread, multipliers) and ag49Validator keeps sole authority over what may be shown. Two defects made the composition necessary rather than optional: this engine derives its own maximum illustrated rate from cap, participation and spread, when AG 49-A makes that the carrier illustration actuary\'s product-specific figure, so it can exceed the carrier\'s published maximum while believing itself compliant; and it emits a persuasionOptimizations array, which the gate drops before anything can reach a client. Call gatedIllustration, never generateCompliantIllustration directly.' },

  { file: 'shared/multiGenTransferEngine.ts', declares: 'SI-032',
    subject: 'Multi-Generational Wealth Transfer Simulation Engine',
    disposition: 'second-implementation', rowNames: 'shared/inheritanceEngine.ts',
    note: 'Same claim, and generationalWealthEngine.ts is a third module in the same territory. Three implementations of one transfer claim is the strongest consolidation candidate in this directory.' },

  { file: 'shared/taxCodeChangeSimulator.ts', declares: 'SI-006',
    subject: 'Real-Time Tax Code Change Impact Simulator',
    disposition: 'second-implementation', rowNames: 'shared/taxHistory.ts',
    note: 'taxHistory.ts is the sourced record of what the code actually was; this simulates changes to it. regulatorySandbox.ts already does versioned synthetic rule sets with sandbox: provenance, so the resolution is probably to fold this into that pattern rather than keep a third way of imagining a tax change.' },

  { file: 'shared/multiCarrierIULOptimizer.ts', declares: 'SI-002',
    subject: 'Multi-Carrier IUL Comparison Optimizer',
    disposition: 'second-implementation', rowNames: 'shared/carrierRecommendation.ts',
    note: 'Both rank carriers. Only one should be reachable from the comparison page, because two rankings of the same carriers shown in one product is a support call.' },

  { file: 'shared/policyReplacementAnalyzer.ts', declares: 'SI-003',
    subject: 'Automated Policy Review & Replacement Analyzer',
    disposition: 'second-implementation', rowNames: 'shared/replacementScoring.ts',
    note: 'Recorded here as a duplicate on a first pass, and that was wrong — reading both shows they cover different products. replacementScoring.ts scores ANNUITY contracts: surrender economics, bonus uplift, income improvement, and a breakeven timeline in months. This one takes an ExistingPolicy typed whole_life | universal_life | variable_ul | iul | term and analyses a 1035 exchange. Annuity replacement and life replacement are separate regulatory regimes with separate suitability tests, and neither module can answer the other\'s question. They are complementary and both are wanted. What SI-003 needs is not a winner but a second engine field, or a split into two rows; the claim as titled covers policy review, which is this one.' },

  { file: 'shared/premiumFinancingArbitrage.ts', declares: 'SI-004',
    subject: 'Premium Financing Arbitrage Calculator',
    disposition: 'second-implementation', rowNames: 'shared/premiumFinancing.ts',
    note: 'Near-identical names, same claim. Check whether either models the AG 49-A limit on illustrated loan arbitrage before choosing; the one that does not is the one to retire.' },

  { file: 'shared/livingBenefitsProbabilityEngine.ts', declares: 'SI-005',
    subject: 'Living Benefits Probability Engine',
    disposition: 'second-implementation', rowNames: 'shared/ltcEngine.ts',
    note: 'A probability engine is only as good as its morbidity table. Whichever of these carries a named source should win on that basis alone.' },

  { file: 'shared/peerBenchmarkingEngine.ts', declares: 'SI-019',
    subject: 'Peer Benchmarking Intelligence Network',
    disposition: 'second-implementation', rowNames: 'shared/careerEngine.ts',
    note: 'Benchmarks imply a peer population. Neither module should publish a percentile without stating the population it came from.' },

  { file: 'shared/annuityFeeDetectionEngine.ts', declares: 'SI-025',
    subject: 'Automated Annuity Comparison with Hidden Fee Detection',
    disposition: 'second-implementation', rowNames: 'shared/annuityData.ts',
    note: 'annuityData.ts is the data; this is the detection logic over it. Most likely genuinely complementary, and the cheapest pair to resolve — the row may simply need both.' },

  /* ═══ Ref collisions ═════════════════════════════════════════════════════
   * The engine's declared number belongs to a different invention in the
   * catalog. Nothing is renumbered. Grouped by whether the catalog has a row
   * for the engine's actual subject at all. */

  { file: 'shared/disabilityGapEngine.ts', declares: 'SI-013',
    subject: 'Disability Income Gap Analysis (single group policy)',
    disposition: 'ref-collision',
    note: 'Catalog SI-013 is Automated Life Event Detection, which the portfolio review dropped. This engine analyses a single group policy and its own header says it is distinct from the SI-031 analyzer, which handles multi-policy coordination. Both are real and both are wanted; the catalog has one row for the pair.' },

  { file: 'shared/generationalWealthEngine.ts', declares: 'SI-015',
    subject: 'Multi-Generational Wealth Transfer Simulation',
    disposition: 'ref-collision',
    note: 'Catalog SI-015 is the Voice-Activated Financial Dashboard. This is the third transfer engine — see multiGenTransferEngine above.' },



  { file: 'shared/behavioralBiasEngine.ts', declares: 'SI-007',
    subject: 'Behavioral Finance Bias Detection Engine',
    disposition: 'ref-collision',
    note: 'Catalog SI-007 is the Multi-Entity Tax Optimization Router. Bias detection is closest to PAT-008, Behavioral Lock-In Prevention, whose row cites livingRiskProfile.ts.' },











];

/** Engines whose claim is implemented twice. Each needs a person's decision. */
export function secondImplementations(): readonly EngineRegistryEntry[] {
  return ENGINE_REGISTRY.filter((e) => e.disposition === 'second-implementation');
}

/**
 * Engines whose declared number means something else in patentCatalog.ts.
 * The size of this list is the size of the numbering problem.
 */
export function refCollisions(): readonly EngineRegistryEntry[] {
  return ENGINE_REGISTRY.filter((e) => e.disposition === 'ref-collision');
}

/**
 * Collisions where the catalog has no row for the engine's subject at all.
 * These are the ones where a working implementation may be sitting outside the
 * claimed portfolio entirely — the opposite of the drafted-but-unbuilt quadrant,
 * and it does not show up in any count the catalog reports.
 */
export function builtButUnclaimed(): readonly EngineRegistryEntry[] {
  return refCollisions().filter((e) => /has no row|no row/i.test(e.note));
}
