/**
 * The pre-filing review's findings. Server-side, deliberately.
 *
 * ## Why this is not in shared/
 *
 * shared/patentCatalog.ts is imported by client/src/pages/portal/
 * PatentShowcase.tsx, which means every byte of it is compiled into a browser
 * bundle. Anything in that module is readable by anyone who can open the
 * network tab — and /portal/patent-showcase sits behind ManagedAuthGuard,
 * which a guest holding the entrance passcode clears.
 *
 * Hiding a field with a role check in the component is not a control. The data
 * still ships. So the findings live here, where the client cannot import them.
 *
 * ## The line this file draws
 *
 * Build status stays in the shared catalogue and stays visible: "the estate
 * tax engine exists, the freeze-technique selector does not" is honest, it is
 * the point of the catalogue, and a prospect reading it thinks better of us.
 *
 * What lives here is the pre-filing review — our own assessment that drafted
 * claims recite hardware this system does not have. That is the owner's and
 * counsel's business. It is not secret because it is shameful; it is withheld
 * because an unfiled portfolio's known weaknesses are worth money to a
 * competitor, and because it is the kind of statement that belongs in a
 * conversation with an attorney rather than on a screen a guest can reach.
 *
 * The full reasoning and the evidence are in docs/patents/APPLICATION_REVIEW.md.
 */

/** Where the full review lives, relative to the repo root. */
export const APPLICATION_REVIEW_DOC = 'docs/patents/APPLICATION_REVIEW.md';

/**
 * Defects present in EVERY drafted application, measured across all 57 rather
 * than inferred from a sample.
 */
export const PORTFOLIO_DEFECTS: readonly string[] = [
  'All 57 recite a Field-Programmable Gate Array co-processor. Nothing in this repo runs on one.',
  'All 57 embed the same five diagrams, differing only in one acronym in one box — 285 figures, 5 drawings.',
  'All 57 carry a drafting-score table ("Enhanced Score 9.95 / 10 (capped)") inside the Summary of the Invention.',
  'All 57 render claim element (c) as the copyright symbol.',
  'All 57 state the portfolio has been "filed by" Russell Holdings Management. Nothing has been filed.',
];

/**
 * Claims whose drafted specification recites a mechanism this repository does
 * not implement, beyond the FPGA that all of them recite. Keyed by ref.
 *
 * These are the ones to raise with counsel first: each is a claim limitation
 * that either narrows the patent away from the product as built, or describes
 * something never built at all.
 */
export const HARDWARE_DISCREPANCIES: Readonly<Record<string, string>> = {
  'PAT-001':
    'The drafted claims recite an FPGA co-processor and a sub-2-second cascade across 15+ calculators. journeyEngine.ts is software and makes no timing guarantee.',
  'PAT-002':
    'The drafted claims recite real-time multi-lender rate aggregation. reverseHeloc.ts holds no lender feed; it takes the rate as an input.',
  'PAT-003':
    'The drafted claims recite voice-tone analysis hardware and biometric-authenticated delivery. ultraAI.ts does neither.',
  'PAT-004':
    'The drafted claims recite genetic-algorithm weight evolution and hardware-accelerated archetype discovery. wealthGenome.ts scores against fixed weights.',
};

/** Refs carrying a discrepancy, for a report that should not miss one. */
export function refsWithDiscrepancy(): readonly string[] {
  return Object.keys(HARDWARE_DISCREPANCIES).sort();
}
