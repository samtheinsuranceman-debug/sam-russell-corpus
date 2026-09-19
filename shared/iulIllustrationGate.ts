// ─── The illustration gate ──────────────────────────────────────────────────
// One front door for IUL illustrations: the broad generator in front, the
// validator as the only authority on what may be shown.
//
// ## Why this file exists
//
// Two modules in this directory both claim to know the maximum illustrated
// rate, and they disagree about what that means.
//
//   iulComplianceEngine.ts   computes a maximum from the product's cap,
//                            participation rate and spread, then builds the
//                            three scenarios off it.
//   ag49Products.ts          holds the maximum the carrier PUBLISHED, read
//                            from a named disclosure with a date.
//
// AG 49-A does not leave that to the modeller. The maximum illustrated rate is
// computed by the carrier's own illustration actuary against the benchmark
// index account, and it is product-specific — which is precisely why
// ag49Products.checkRate refuses a rate when no product is named rather than
// falling back to an industry figure. A generator that derives its own maximum
// from inputs can therefore exceed the carrier's published maximum while
// believing itself compliant, and nothing downstream would catch it.
//
// The resolution is not to delete the generator. It has by far the broader
// input surface — carrier, product, health class, index strategy, cap, floor,
// participation, spread, multipliers — and that breadth is the point: it can
// model shapes the validator alone cannot express. What it must not be is the
// authority on whether its own output is lawful.
//
// So: generate freely, publish nothing ungated. The generator proposes, the
// carrier's published cap bounds, ag49Validator disposes.
//
// ## What this gate refuses to do
//
// It does not clamp. A rate above the published maximum is not quietly lowered
// and shown anyway, because a clamped illustration is a different illustration
// and the person who asked for the first one is owed the news, not a substitute.
// checkRate behaves the same way and for the same reason.
//
// It does not infer the two facts AG 49-A asks about the disclosure itself —
// how many years of history the exhibit shows, and how old the index is. Those
// are properties of a document, not of a projection, so they are required
// inputs. A caller who does not know them does not have an exhibit to validate.
//
// It never returns persuasionOptimizations. The generator emits that array, and
// its own header describes its purpose as maximising persuasive impact within
// regulatory bounds. That sentence is the reason the portfolio review dropped
// the original framing of SI-001: a claim phrased as working the edges of a
// consumer-protection rule reads badly in a published application and worse
// in a deposition. The array is dropped here rather than in the engine so the
// engine stays untouched and the exclusion is one auditable line.

import {
  generateCompliantIllustration,
  type AG49Input,
  type AG49Result,
  type ComplianceCheck,
} from './iulComplianceEngine';
import {
  MANDATED_NOTICE,
  validateExhibit,
  type Finding,
  type IllustrationExhibit,
} from './ag49Validator';
import { checkRate, type CapCheck } from './ag49Products';
import { creditFor, shapeById, shapesFor, type IndexAccountShape } from './indexAccountShapes';
import type { LoanIllustration } from './ag49Validator';

/** Facts about the printed exhibit. Not derivable from a projection. */
export interface ExhibitFacts {
  /**
   * The product id in ag49Products.ts whose published maximum bounds this
   * illustration. Required: AG 49-A maxima are product-specific.
   */
  readonly productId: string;
  /** Years of index history the disclosure actually shows. */
  readonly historicalYearsShown: number;
  /** Age of the index itself, in years. */
  readonly indexAgeYears: number;
  /** The notice text exactly as it appears, if one appears at all. */
  readonly noticeText?: string;
  /** Whether that notice sits at the top of the data section. */
  readonly noticeAtTopOfData?: boolean;
  /**
   * True when this is a marketer-built comparison presenting history as the
   * expected outcome. A reviewer's judgement, passed in, never guessed —
   * ag49Validator will not read intent out of a data structure and neither
   * will this.
   */
  readonly constructedComparison?: boolean;
  /**
   * The loan the illustration shows, where it shows one. Passed straight to
   * ag49Validator, which holds the arbitrage limit.
   */
  readonly loan?: LoanIllustration;
  /**
   * Which account shape on the product is being illustrated. Optional: without
   * it the gate validates the product's overall maximum, which is what a
   * single-account illustration needs. With it, the gate validates against THAT
   * account's own published maximum, which is what a product carrying seven
   * accounts needs — per-account maxima differ, and the product's figure is the
   * highest of them.
   */
  readonly accountShapeId?: string;
}

export interface GatedScenario {
  readonly name: string;
  /** The rate the generator proposed, as a percentage. */
  readonly proposedRate: number;
  /** Everything ag49Validator found against it. */
  readonly findings: readonly Finding[];
  /** True when no finding is a violation. */
  readonly showable: boolean;
  /** Present only when showable. Withheld, not clamped, when not. */
  readonly projections?: AG49Result['scenarios'][number];
}

export interface GatedIllustration {
  /** True when every scenario cleared. A partial pass is not a pass. */
  readonly showable: boolean;
  /** The carrier's published maximum, and where it was read from. */
  readonly cap: CapCheck;
  readonly scenarios: readonly GatedScenario[];
  /** The generator's own checklist, kept for the reviewer's log. */
  readonly generatorChecklist: readonly ComplianceCheck[];
  /** The generator's regulatory warnings. Surfaced, unlike its optimisations. */
  readonly generatorWarnings: readonly string[];
  /** Why nothing may be shown, when that is the answer. */
  readonly refusal?: string;
  /** One line for a compliance log. */
  readonly summary: string;
}

/**
 * Generate, bound, validate. Returns what may be shown and why the rest may not.
 *
 * The generator runs first and unmodified, so its breadth is preserved. Its
 * self-computed maximum is then subordinated to the carrier's published one,
 * and each scenario is validated as an exhibit before it is allowed out.
 */
export function gatedIllustration(input: AG49Input, facts: ExhibitFacts): GatedIllustration {
  const generated = generateCompliantIllustration(input);

  // The carrier's published maximum, as a percentage to match the exhibit's units.
  const cap = checkRate(facts.productId, generated.maxCompliantRate / 100);

  // A refusal from checkRate is not by itself a reason to stop. checkRate says
  // ok: false both when it has no cap at all AND when it has one that the
  // proposed rate exceeds. Only the first case leaves nothing to validate
  // against; in the second the cap is known and ag49Validator is the right
  // thing to report the excess, in the regulator's own terms.
  const publishedMax: number | null = cap.cap;

  if (publishedMax === null) {
    const reason = 'reason' in cap
      ? cap.reason
      : 'No published AG 49-A maximum is available for this product.';
    return {
      showable: false,
      cap,
      scenarios: [],
      generatorChecklist: generated.complianceChecklist,
      generatorWarnings: generated.regulatoryWarnings,
      refusal: reason,
      summary: `Nothing showable: ${reason}`,
    };
  }

  // Where a specific account is named, its own published maximum binds — and it
  // is the LOWER of the two that applies, because a product's figure is the
  // highest across its accounts and illustrating one account at the product's
  // best is how a 6.57% account gets shown at 6.62%.
  const shape = facts.accountShapeId ? shapeById(facts.accountShapeId) : null;
  if (facts.accountShapeId && !shape) {
    const reason = `No verified index account shape is on file for "${facts.accountShapeId}". Read its parameters from the carrier's account table before illustrating it.`;
    return {
      showable: false,
      cap,
      scenarios: [],
      generatorChecklist: generated.complianceChecklist,
      generatorWarnings: generated.regulatoryWarnings,
      refusal: reason,
      summary: `Nothing showable: ${reason}`,
    };
  }
  const bindingMax = shape ? Math.min(publishedMax, shape.maxIllustratedRate) : publishedMax;
  const publishedMaxPct = bindingMax * 100;

  const scenarios: GatedScenario[] = generated.scenarios.map((s) => {
    const exhibit: IllustrationExhibit = {
      illustratedRate: s.scenario.illustratedRate,
      maximumIllustratedRate: publishedMaxPct,
      historicalYearsShown: facts.historicalYearsShown,
      indexAgeYears: facts.indexAgeYears,
      noticeText: facts.noticeText,
      noticeAtTopOfData: facts.noticeAtTopOfData,
      constructedComparison: facts.constructedComparison,
      loan: facts.loan,
    };
    const findings = validateExhibit(exhibit);
    const showable = findings.every((f) => f.severity !== 'violation');
    return {
      name: s.scenario.name,
      proposedRate: s.scenario.illustratedRate,
      findings,
      showable,
      // Withheld rather than clamped. See the header.
      projections: showable ? s : undefined,
    };
  });

  const blocked = scenarios.filter((s) => !s.showable);
  const allClear = blocked.length === 0;

  return {
    showable: allClear,
    cap,
    scenarios,
    generatorChecklist: generated.complianceChecklist,
    generatorWarnings: generated.regulatoryWarnings,
    refusal: allClear
      ? undefined
      : `${blocked.length} of ${scenarios.length} scenarios carry a violation and are withheld: ` +
        blocked.map((b) => `${b.name} (${b.findings.filter((f) => f.severity === 'violation').map((f) => f.rule).join(', ')})`).join('; '),
    summary: allClear
      ? `All ${scenarios.length} scenarios clear against AG 49-A, bounded by the published maximum of ${publishedMaxPct.toFixed(2)}% for ${facts.productId}.`
      : `${blocked.length} of ${scenarios.length} scenarios withheld against the published maximum of ${publishedMaxPct.toFixed(2)}% for ${facts.productId}.`,
  };
}

/**
 * The scenarios a client may actually be shown. Empty is a valid answer and
 * callers must render it as one — an empty list means the illustration did not
 * clear, not that there is nothing to say.
 */
export function showableScenarios(g: GatedIllustration): readonly GatedScenario[] {
  return g.scenarios.filter((s) => s.showable);
}

/**
 * Where the flexibility actually comes from.
 *
 * It was tempting to read "more flexibility from the compliance engine" as a
 * looser cap. That is the one place it cannot come from: the maximum
 * illustrated rate is a carrier actuary's figure under AG 49-A, and loan
 * arbitrage is the single most scrutinised practice in the category — it is why
 * AG 49-A exists at all.
 *
 * Flexibility comes from breadth of what can be modelled, and the generator
 * already supplies most of it. What this repo can widen without touching the
 * cap:
 *
 *   more products     — ag49Products.ts holds one. Each additional carrier
 *                       disclosure read in widens what may be illustrated at
 *                       all, because an unnamed product cannot be validated.
 *   more account shapes — uncapped accounts with participation above 100% and a
 *                       spread, multi-year segments, lookback and blended
 *                       indices. The generator takes cap, floor, participation,
 *                       spread and a multiplier flag already.
 *   more loan types   — iulLoanOptimizationEngine.ts models variable against
 *                       fixed against indexed, which is the mechanism most
 *                       illustrations reduce to a single rate.
 *
 * Every one of those widens the modelling surface while leaving the published
 * cap exactly where the carrier put it. That is the trade worth making.
 */
export const FLEXIBILITY_COMES_FROM = [
  'additional products, each with its own read disclosure and published maximum',
  'additional index account shapes: uncapped, participation above 100%, spreads, multi-year segments',
  'additional loan mechanics, through iulLoanOptimizationEngine rather than a single blended rate',
] as const;

/* ═══ The comparison surfaces ══════════════════════════════════════════════
 * Breadth is only worth having if it reaches a conversation. These two build
 * the side-by-side views that the single-shape, single-rate model could not
 * express, and both refuse where a parameter is not on file rather than
 * filling the row in. */

export interface AccountComparisonRow {
  readonly shapeId: string;
  readonly label: string;
  readonly index: string;
  readonly structure: string;
  /** Credited over the segment, as a percentage. Null where uncomputable. */
  readonly segmentCreditedPct: number | null;
  /** The same, per year, so unlike segment lengths can be read together. */
  readonly annualisedPct: number | null;
  /** This account's own published maximum illustrated rate, as a percentage. */
  readonly maxIllustratedPct: number;
  readonly working: string;
  /** Present when the row could not be computed, or needs confirming first. */
  readonly caveat?: string;
}

/**
 * Every verified account on a product, against one index movement.
 *
 * This is the view a capped-only model could not produce, and it is the one
 * worth having in front of a client: on the same index movement a 110%
 * participation account with a 2.50% spread and a 100% participation account
 * with a 10.50% cap can finish either way round, and which wins depends
 * entirely on how far the index moved. A client shown only one account never
 * learns that, and an advisor who cannot show it is guessing.
 *
 * `indexReturn` is the movement across each account's own segment, as a decimal,
 * price return. Accounts with different segment lengths are therefore not being
 * asked the same question — read the annualised column, and see the caveat.
 */
export function compareAccountShapes(productId: string, indexReturn: number): readonly AccountComparisonRow[] {
  const shapes = shapesFor(productId);
  const rows: AccountComparisonRow[] = [];

  for (let i = 0; i < shapes.length; i++) {
    const s: IndexAccountShape = shapes[i];
    const credit = creditFor(s, indexReturn);
    const structure =
      s.cap !== null
        ? `${(s.participation * 100).toFixed(0)}% participation, ${(s.cap * 100).toFixed(2)}% cap, ${(s.floor * 100).toFixed(0)}% floor, ${s.segmentYears}-year`
        : `${(s.participation * 100).toFixed(0)}% participation, uncapped, ${s.spread === null ? 'spread not on file' : `${(s.spread * 100).toFixed(2)}% spread ${s.spreadBasis}`}, ${(s.floor * 100).toFixed(0)}% floor, ${s.segmentYears}-year`;

    const caveats: string[] = [];
    if (s.inferred) caveats.push(`Confirm before illustrating — ${s.inferred}`);
    if (s.segmentYears > 1) {
      caveats.push(
        `A ${s.segmentYears}-year segment credits once, at the end. The same index movement over ${s.segmentYears} years is not the same event as over one, so this row and the 1-year rows answer different questions; the annualised column is the only fair comparison.`
      );
    }

    rows.push({
      shapeId: s.id,
      label: s.label,
      index: s.index,
      structure,
      segmentCreditedPct: credit.ok ? credit.segmentCredited * 100 : null,
      annualisedPct: credit.ok ? credit.annualised * 100 : null,
      maxIllustratedPct: s.maxIllustratedRate * 100,
      working: credit.ok ? credit.working : credit.reason,
      caveat: caveats.length ? caveats.join(' ') : undefined,
    });
  }

  return rows;
}

export interface LoanComparisonRow {
  readonly type: LoanIllustration['type'];
  /** What happens to the borrowed money. The column that actually matters. */
  readonly borrowedMoney: string;
  readonly chargePct: number;
  readonly chargeIsContractual: boolean;
  /** Findings ag49Validator returns for an illustration on this loan. */
  readonly findings: readonly Finding[];
  /** True when an illustration on this loan carries no violation. */
  readonly illustrable: boolean;
}

/**
 * The three loan types side by side, each run through the validator.
 *
 * The point is not the charges — it is the middle column. A fixed or indexed
 * loan moves the borrowed money out to a loan account; a variable loan leaves it
 * in the indexed account, still earning. That difference is the whole
 * architecture of the participating-loan case, it is true without any
 * assumption, and it is routinely lost because all three appear as one number
 * called "the loan rate".
 *
 * What the validator adds is the boundary: describing the mechanism is fine,
 * projecting a spread on it is not. Rows come back with their findings attached
 * so an advisor can see, before the meeting, which loan can carry an
 * illustration and which can only carry a sentence.
 */
export function compareLoanTypes(
  creditedRateOnLoanedValue: number,
  charges: { fixed: number; indexed: number; variable: number },
  opts: { variableIllustratedAsConstant?: boolean } = {}
): readonly LoanComparisonRow[] {
  // Deliberately clean on everything the loan rules do not concern, so the
  // findings that come back are the loan's own and not noise from the page.
  // The first version of this left noticeText undefined, which raised a
  // mandated-notice violation on every row and made `illustrable` false for a
  // reason that had nothing to do with the loan — it reported the right answer
  // by accident and the wrong one when a loan was actually fine.
  const base: Omit<IllustrationExhibit, 'loan'> = {
    illustratedRate: creditedRateOnLoanedValue,
    maximumIllustratedRate: Math.max(creditedRateOnLoanedValue, 100),
    historicalYearsShown: 25,
    indexAgeYears: 70,
    noticeText: MANDATED_NOTICE,
    noticeAtTopOfData: true,
  };

  /** Belt as well as braces: only loan rules may appear on a loan row. */
  const isLoanRule = (rule: string) =>
    rule.includes('loan') || rule.includes('arbitrage');

  const spec: Array<{ type: LoanIllustration['type']; charge: number; borrowedMoney: string; contractual: boolean; constant?: boolean }> = [
    {
      type: 'fixed',
      charge: charges.fixed,
      borrowedMoney: 'Moves out of the indexed accounts into a fixed loan account. It stops receiving index credits.',
      contractual: true,
    },
    {
      type: 'indexed',
      charge: charges.indexed,
      borrowedMoney: 'Moves into an indexed loan account.',
      contractual: true,
    },
    {
      type: 'variable',
      charge: charges.variable,
      borrowedMoney: 'Stays in the chosen indexed accounts and keeps earning. The dollar spent keeps working while it is spent — a lien on the position rather than a sale of it.',
      contractual: false,
      constant: opts.variableIllustratedAsConstant,
    },
  ];

  return spec.map((s) => {
    const findings = validateExhibit({
      ...base,
      loan: {
        type: s.type,
        creditedRateOnLoanedValue,
        loanChargeRate: s.charge,
        chargeIllustratedAsConstant: s.constant,
      },
    }).filter((f) => isLoanRule(f.rule));
    return {
      type: s.type,
      borrowedMoney: s.borrowedMoney,
      chargePct: s.charge,
      chargeIsContractual: s.contractual,
      findings,
      illustrable: findings.every((f) => f.severity !== 'violation'),
    };
  });
}
