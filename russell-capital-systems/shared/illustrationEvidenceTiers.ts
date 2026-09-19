// ─── Evidence tiers for an illustration ─────────────────────────────────────
// Three boxes, and which box a figure sits in decides how it may be said.
//
// ## Why this is a sales instrument and not a compliance chore
//
// The strongest thing in an IUL illustration is not the projection. It is the
// death benefit, in force from the first premium, contractual, requiring no
// assumption about any market. The second strongest is the carrier's own
// published history. The projection is the weakest item on the page, and it is
// the one every illustration leads with.
//
// That inversion is why illustrations lose to a CPA. A prospect's accountant
// does not attack the death benefit, because there is nothing there to attack;
// she attacks the crediting assumption, and if the whole case has been built on
// it the case goes with it. Presenting the tiers separately means the part that
// survives her review is the part the decision was resting on in the first
// place, and the projection becomes supporting material rather than the
// foundation.
//
// So this is the opposite of hedging. Everything in tier one can be said
// flatly, with no qualifier, because it is a policy term. The qualifiers all
// belong to tier three, where they were always owed.
//
// ## The three tiers
//
//   contractual — a policy term. True whatever the market does. The death
//                 benefit, the floor, a constant loan charge, a rider that
//                 cannot be removed. Needs no as-of date because it does not
//                 move.
//
//   published   — a figure the carrier printed, factual as of a date, and able
//                 to change. Current caps, participation rates, spreads, the
//                 maximum illustrated rate, a carrier's own historical range.
//                 Always carries its source and the date it was read. Saying one
//                 of these without its date is how a stale figure gets quoted as
//                 current.
//
//   projected   — depends on an assumption. Every cash value, every credited
//                 rate, every year past the first. Nothing here may be stated
//                 without the assumption it rests on.
//
// The tier that trips people is `published`. A current cap feels contractual
// because it is printed on the illustration, but a carrier can re-rate it, and
// a re-rated cap changes every projected figure underneath it. It is a fact
// about today, not a promise about tomorrow.

export type EvidenceTier = 'contractual' | 'published' | 'projected';

export interface EvidenceItem {
  readonly tier: EvidenceTier;
  readonly label: string;
  /** The figure or term, formatted for display. */
  readonly value: string;
  /**
   * Where it comes from. Required for `published` and `projected`; a contractual
   * term cites the policy or agreement that grants it.
   */
  readonly source: string;
  /** When the figure was read. Required for `published`. */
  readonly asOf?: string;
  /** The assumption it rests on. Required for `projected`. */
  readonly assumption?: string;
  /** Why this belongs in its tier, where that is not self-evident. */
  readonly note?: string;
}

/**
 * How each tier may be spoken about. Enforced by a test rather than trusted to
 * whoever writes the next page.
 */
export const TIER_RULES: Record<EvidenceTier, { readonly mayStateFlatly: boolean; readonly requires: readonly string[] }> = {
  contractual: {
    mayStateFlatly: true,
    requires: ['the policy provision or agreement granting it'],
  },
  published: {
    mayStateFlatly: false,
    requires: ['the carrier document it was read from', 'the date it was read', 'that it is current and can change'],
  },
  projected: {
    mayStateFlatly: false,
    requires: ['the assumption it rests on', 'that it is not guaranteed', 'that actual results will differ'],
  },
};

/**
 * The Minnesota Life Balanced Growth Accumulator III illustration, sorted into
 * tiers. Concrete rather than abstract, because the sorting is the whole skill
 * and an example teaches it faster than a rule.
 *
 * Case ID 29335303, prepared 15 September 2026, male age 65, preferred
 * non-tobacco, $250,000 annual outlay for ten years.
 */
export const MN_BGA3_EVIDENCE: readonly EvidenceItem[] = [
  // ── Contractual ─────────────────────────────────────────────────────────
  {
    tier: 'contractual',
    label: 'Death benefit in force',
    value: '$2,292,930',
    source: 'Policy specifications page, in force from the first premium',
    note: 'The strongest figure in the file and the only one requiring no assumption at all. It is a provision, not a projection.',
  },
  {
    tier: 'contractual',
    label: 'Floor on every indexed account',
    value: '0%',
    source: 'Indexed account provisions',
    note: 'Not a growth feature. At 65 drawing income it is protection against sequence risk — the specific way a funded retirement fails — because a bad year cannot take the base the next fifteen have to compound on.',
  },
  {
    tier: 'contractual',
    label: 'Fixed loan charge',
    value: '4.00%, constant',
    source: 'Policy loan provisions',
    note: 'Contractual because it is stated and does not float. The variable loan charge is not in this tier for exactly that reason.',
  },
  {
    tier: 'contractual',
    label: 'Indexed loan charge',
    value: '4.75%, constant',
    source: 'Policy loan provisions',
  },
  {
    tier: 'contractual',
    label: 'Overloan Protection Agreement',
    value: 'Prevents an outstanding loan from terminating the policy even where cash value is insufficient to cover charges. No charge until exercised.',
    source: 'Overloan Protection Agreement, as attached',
    note: 'This is why a lapse caveat does not belong on this case. The provision exists precisely to remove that outcome, and saying otherwise understates a contractual protection the client is already paying to have.',
  },
  {
    tier: 'contractual',
    label: 'Early Values Agreement',
    value: 'Eliminates the surrender charge. Cannot be removed.',
    source: 'Early Values Agreement, as attached',
    note: '"Cannot be removed" is doing real work — it makes this a term rather than a current practice.',
  },

  // ── Published ───────────────────────────────────────────────────────────
  {
    tier: 'published',
    label: 'Maximum illustrated rate',
    value: '6.62%',
    source: 'Illustration AG 49 statement, computed by the carrier on the S&P 500 excluding dividends',
    asOf: '2026-09-15',
    note: 'A ceiling a projection may use, never a forecast, and never an industry figure — AG 49-A computes it per product from that product\'s own parameters.',
  },
  {
    tier: 'published',
    label: 'Indexed Account A parameters',
    value: '100% participation, 10.50% cap, 0% floor, 1-year point-to-point',
    source: 'Illustration account table',
    asOf: '2026-09-15',
    note: 'The floor is contractual and sits in tier one; the cap and participation rate are current and the carrier may re-rate them, which moves every projected figure beneath them.',
  },
  {
    tier: 'published',
    label: 'Balanced Indexed Account 2 parameters',
    value: 'Uncapped, 110% participation, 2.50% segment spread, 2-year segment',
    source: 'Illustration account table',
    asOf: '2026-09-15',
    note: 'Whether the spread is charged per segment or per year is not stated in those words and changes the credited result by 250 basis points on a 2-year segment. Recorded as per-segment in indexAccountShapes.ts and flagged there for confirmation.',
  },
  {
    tier: 'published',
    label: 'Carrier 25-year rolling range, 100% / 10.50% / 0% structure',
    value: '4.16% low, 8.21% high',
    source: 'Minnesota Life, rolling 25-year periods since 1949, printed on the illustration',
    asOf: '2026-09-15',
    note: 'The most useful number on the page for a sceptical reader, because it is the carrier\'s own and it is history rather than projection. Set against a 4.75% indexed loan charge, the worst 25-year stretch in seventy-five years roughly covers the loan cost. That is an argument that asserts nothing.',
  },
  {
    tier: 'published',
    label: 'Variable loan charge, current',
    value: '6.00%, floating with Moody\'s Corporate Bond Yield Average, capped at the fixed account rate plus 1.50%',
    source: 'Policy loan provisions and current rate disclosure',
    asOf: '2026-09-15',
    note: 'The cap on the charge is contractual; the charge itself is not. Holding it flat across a projection states a view about the future cost of money, which ag49Validator treats as a violation.',
  },

  // ── Projected ───────────────────────────────────────────────────────────
  {
    tier: 'projected',
    label: 'Cash value at any future year',
    value: 'Per the ledger',
    source: 'Illustration ledger',
    assumption: 'The illustrated crediting rate holds, charges follow the current schedule, and premiums are paid as scheduled.',
    note: 'Every figure in the ledger is in this tier, including the ones printed in bold.',
  },
  {
    tier: 'projected',
    label: 'Credited rate in any future year',
    value: 'Per the illustrated rate',
    source: 'Illustration ledger',
    assumption: 'Index movement reproduces the illustrated average, which no year is obliged to do.',
  },
  {
    tier: 'projected',
    label: 'Net position after loans',
    value: 'Account value less loan balance',
    source: 'Illustration ledger',
    assumption: 'Credited rates hold AND the variable loan charge stays near its current level.',
    note: 'Two assumptions stacked, which is worth saying out loud: the account value keeps growing while borrowed against — that part is the participating-loan feature working — but the net position is account value minus loan balance, and the same dollar cannot be counted in both.',
  },
];

/** Everything that needs no assumption. This is what a case should lead with. */
export function contractualOnly(items: readonly EvidenceItem[] = MN_BGA3_EVIDENCE): readonly EvidenceItem[] {
  return items.filter((i) => i.tier === 'contractual');
}

export function byTier(tier: EvidenceTier, items: readonly EvidenceItem[] = MN_BGA3_EVIDENCE): readonly EvidenceItem[] {
  return items.filter((i) => i.tier === tier);
}

/**
 * Items that fail their own tier's requirements. A published figure with no
 * date, or a projected one with no stated assumption, is the shape of an
 * illustration that will not survive review.
 */
export function incompleteItems(items: readonly EvidenceItem[] = MN_BGA3_EVIDENCE): readonly string[] {
  const bad: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.source || it.source.length < 8) bad.push(`${it.label}: no source`);
    if (it.tier === 'published' && !it.asOf) bad.push(`${it.label}: published with no as-of date`);
    if (it.tier === 'projected' && !it.assumption) bad.push(`${it.label}: projected with no stated assumption`);
    if (it.tier === 'contractual' && (it.assumption || it.asOf)) {
      bad.push(`${it.label}: contractual items carry neither an assumption nor an as-of date; if it needs one it is not contractual`);
    }
  }
  return bad;
}

/**
 * The one-sentence version, for the top of a letter.
 *
 * Deliberately leads with the contractual count rather than a rate, because the
 * contractual items are the ones a reader cannot argue with and a rate is the
 * one they will.
 */
export function leadLine(items: readonly EvidenceItem[] = MN_BGA3_EVIDENCE): string {
  const c = byTier('contractual', items).length;
  const p = byTier('published', items).length;
  const j = byTier('projected', items).length;
  return (
    `${c} figure${c === 1 ? '' : 's'} here ${c === 1 ? 'is' : 'are'} contractual and require no assumption about any market; ` +
    `${p} ${p === 1 ? 'is' : 'are'} published by the carrier as of a stated date and can change; ` +
    `${j} ${j === 1 ? 'is' : 'are'} projected and rest on assumptions named beside them.`
  );
}

export const TIERS_VERSION = {
  version: '2026.09.1',
  compiledOn: '2026-09-19',
  neverPrinted: [
    'A current cap, participation rate or spread described as guaranteed. Those are published and re-rateable; only the floor and the stated loan charges are terms.',
    'A projected figure without the assumption it rests on printed beside it.',
    'A published figure without the date it was read. A stale cap quoted as current is the most ordinary way an illustration becomes untrue.',
    'The maximum illustrated rate described as an expected return.',
    'A lapse warning on a policy carrying an Overloan Protection Agreement, which exists to remove that outcome. Understating a contractual protection the client is paying for is its own kind of inaccuracy.',
    'An account value and a withdrawal funded by borrowing against it, counted as two separate gains. The account does keep growing; the net position is account value minus loan balance.',
  ],
} as const;
