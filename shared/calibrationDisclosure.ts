/**
 * What may be said about how this engine was calibrated, and what may not.
 *
 * The engine's crediting model is fitted to in-force policy statements rather
 * than to product brochures. That is unusual, it is defensible, and it is worth
 * disclosing. This file holds the disclosure that the evidence actually
 * supports — and blocks three stronger claims that it does not.
 *
 * ## Why the stronger claim fails
 *
 * The intuition behind it is that statements show accounts paying more than
 * brochures promise. On two accounts that is what happened. On the single
 * best-evidenced account it is the reverse, and by a wide margin.
 *
 *   Balanced Indexed 2 (BGA II)  6 segments  brochure 105%/-2.50% would pay
 *                                            47.07%; the account paid 34.41%.
 *                                            The brochure OVERSTATED on every
 *                                            one of the six, by 10.3 to 12.7
 *                                            points.
 *   Balanced Indexed 2 (BGA3)   12 segments  printed 105%, actually struck at
 *                                            94.49% / 105.00% / 110.25%. Three
 *                                            segments below the printed rate,
 *                                            five at it, four above. Mixed.
 *   Indexed Loan Account         2 segments  printed 105%, paid 1.47x. Higher.
 *   Balanced Indexed 8 (PRISM)   1 segment   printed 105%, paid 1.71x. Higher.
 *
 * Seven observed segments point one way, nine the other, and the account with
 * three independent reconciliations points against the claim. "Actual returns
 * are far higher than the brochures state" is not a stronger version of the
 * finding; it is a different and unsupported finding.
 *
 * The finding this work does support is narrower and, for an in-force review,
 * more useful: the participation rate these documents print does not determine
 * the credit, and it has been caught wrong in BOTH directions. That is a
 * statement about accuracy, not about generosity.
 *
 * ## Why the basis claim fails too
 *
 * "After reviewing many client statements over years and years" describes work
 * that has not been done. The calibration rests on two annual policy reviews
 * and one portal segment ledger. Two is a real basis for a model and a false
 * basis for that sentence, and a marketing sentence that misstates its own
 * evidence is a written record of a misrepresentation.
 *
 * ## Where the observed numbers belong
 *
 * In the engine, and in a one-to-one in-force review where the client is
 * looking at their own statement. That conversation is unimpeachable: it is
 * their document, their account, their credit. Nothing needs to be characterised
 * and no carrier needs to be criticised for it to land.
 */

export type ClaimVerdict =
  | { readonly allowed: true; readonly text: string }
  | { readonly allowed: false; readonly reason: string; readonly instead: string };

/** The evidence, counted, so no claim has to be argued about from memory. */
export const EVIDENCE_TALLY = {
  statementsReviewed: 2,
  portalLedgersReviewed: 1,
  accountsWithObservedCredits: 4,
  accountsNeverObserved: 2,
  segmentsObserved: 21,
  segmentsWhereObservedExceededPrinted: 7,
  segmentsWherePrintedExceededObserved: 9,
  bestEvidencedAccount: {
    account: 'Balanced Indexed Account 2 (BGA II)',
    segments: 6,
    reconciliations: 3,
    direction: 'the published description overstated the credit on every segment',
    byPoints: [10.3, 12.7],
  },
  netDirection: 'no net direction — the printed and published rates are wrong both ways',
} as const;

/**
 * The disclosure that the evidence supports. Factual, specific about its own
 * basis, and it claims nothing about the size or direction of returns.
 */
export const APPROVED_DISCLOSURE_HEADING = 'How this model is calibrated';

/**
 * Paragraphs, unwrapped. Hard line breaks in disclosure text are a liability:
 * they break rendering at other widths and they split phrases that downstream
 * checks — including this file's own screen — need to read whole. The first
 * draft wrapped "not a sales illustration" across a newline and its test
 * caught it.
 */
export const APPROVED_DISCLOSURE_PARAGRAPHS: readonly string[] = [
  "The crediting mechanics in this tool are derived from in-force annual policy statements — the segment start and end index values, the crediting rates, and the dollar credits a carrier actually posted — rather than from product marketing material.",
  "We do this because the two do not always agree. In the policies we have examined, the participation rate printed on the statement did not determine the credit the account received, and the difference ran in both directions: on some accounts the printed rate was higher than what the account paid, on others it was lower.",
  "This model is a description of observed policy mechanics. It is not a sales illustration, not a projection of future results, and not a representation of any carrier's terms. Any figure shown to you in connection with the purchase of a policy must come from that carrier's own illustration, which is governed by Actuarial Guideline 49-A. Your policy's actual terms are the ones in your contract.",
];

export const APPROVED_DISCLOSURE = [APPROVED_DISCLOSURE_HEADING]
  .concat(APPROVED_DISCLOSURE_PARAGRAPHS as string[])
  .join('\n\n');

/**
 * Claims that cannot be made, with what the evidence says instead. Each is a
 * claim that was genuinely proposed, not a straw man.
 */
export const BANNED_CLAIMS: readonly {
  readonly claim: string;
  readonly why: string;
  readonly instead: string;
}[] = [
  {
    claim: 'Actual returns are much higher than the brochures claim.',
    why:
      'False on the best-evidenced account. Six segments of Balanced Indexed Account 2 paid 34.41% where the brochure description would pay 47.07% — the brochure overstated on every one. Across all observed segments the direction does not net out either way.',
    instead:
      'The printed participation rate does not determine the credit, and has been observed wrong in both directions.',
  },
  {
    claim: 'Many times higher than the brochures claim.',
    why:
      'Nothing measured is a multiple of a brochure figure. 1.71x and 1.47x are multiples of INDEX GROWTH on two accounts, not multiples of what a brochure promised, and they rest on three segments in total.',
    instead:
      'On two accounts the credit exceeded what the printed rate allows. Both observations are small — three segments — and one is a single segment.',
  },
  {
    claim: 'Based on many client statements reviewed over years and years.',
    why:
      'Two annual policy reviews and one portal ledger. The sentence misstates the basis of the work, in writing, in marketing.',
    instead:
      'Calibrated to in-force policy statements. Say how many if asked; two is a real basis for a model.',
  },
  {
    claim: "A carrier's brochures are incorrect.",
    why:
      'A published allegation about a named or identifiable insurer, made by a licensed producer. It invites a complaint from the carrier, a competitor or a regulator, and it is almost certainly advertising requiring broker-dealer or IMO pre-approval before use.',
    instead:
      'Describe your own method — calibrated to statements — without characterising anyone else\'s documents. The finding survives; the allegation is what draws the complaint.',
  },
];

/** Phrases that signal a banned claim, checked case-insensitively. */
const RED_FLAGS: readonly { readonly pattern: RegExp; readonly claimIndex: number }[] = [
  { pattern: /(much|far|many times|significantly)\s+(much\s+)?higher than (the|their|what the)?\s*brochure/i, claimIndex: 0 },
  { pattern: /many times higher/i, claimIndex: 1 },
  { pattern: /(years and years|many (client )?statements|thousands of statements)/i, claimIndex: 2 },
  { pattern: /brochures? (are|is|were|was) (incorrect|wrong|false|bullshit)/i, claimIndex: 3 },
  { pattern: /(their|the) (brochure|marketing|paperwork) is (bullshit|a lie|false)/i, claimIndex: 3 },
];

/**
 * Screen a piece of client-facing copy before it is published.
 *
 * Deliberately conservative: it blocks on a phrase rather than trying to judge
 * intent, because the cost of a false negative here is a written
 * misrepresentation and the cost of a false positive is thirty seconds.
 */
export function checkClaim(text: string): ClaimVerdict {
  for (let i = 0; i < RED_FLAGS.length; i += 1) {
    if (RED_FLAGS[i].pattern.test(text)) {
      const banned = BANNED_CLAIMS[RED_FLAGS[i].claimIndex];
      return { allowed: false, reason: banned.why, instead: banned.instead };
    }
  }
  return { allowed: true, text };
}

/**
 * Where the observed coefficients may and may not be used. The distinction is
 * not about wording; it is about whether the conversation is a sale.
 */
export const PERMITTED_USES = {
  yes: [
    'Inside the engine, as the crediting model. It is more accurate than the published description and accuracy is the whole point.',
    'In a one-to-one in-force review, alongside the client\'s own statement, showing what their own account was paid. Their document, their numbers, no characterisation of anyone required.',
    'In internal analysis, product comparison and suitability work.',
  ],
  no: [
    'In any illustration or projection shown in connection with a sale. A fitted coefficient is not a declared rate and AG 49-A governs what may be illustrated, whatever the account is named.',
    'In marketing copy, a website claim or a seminar slide asserting superior returns.',
    'As a participation rate, quoted as though a carrier had declared it.',
  ],
  reviewBeforeUse:
    'Anything client-facing that describes this calibration is advertising. Broker-dealer or IMO advertising review applies, and this disclosure has not been through it.',
} as const;
