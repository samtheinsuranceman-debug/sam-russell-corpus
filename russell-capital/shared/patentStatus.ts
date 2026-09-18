/**
 * Patent status — one switch, one true sentence, everywhere.
 *
 * ## Why this file exists
 *
 * A platform that describes its own portfolio in four places will describe it
 * four different ways, and a public page that contradicts another public page on
 * the same site is the thing a competitor screenshots. So the claim lives here
 * and nowhere else, and every surface imports it.
 *
 * ## The rule this enforces
 *
 * "Patent pending" is a statement of fact, not of intention. It is true once an
 * application — a provisional counts — is on file AND the USPTO has issued a
 * number. It is NOT true when a draft exists, when counsel is engaged, when
 * financing is arranged, or when a document is about to be signed.
 *
 * Marking an article as patented or patent-applied-for when it is not is false
 * marking under 35 U.S.C. § 292. Since the America Invents Act, a competitor who
 * suffers a competitive injury from false marking may sue for damages. This is
 * not a theoretical exposure for a company that sells to insurance agents.
 *
 * So `mayClaimPatentPending()` does not read a boolean somebody set. It requires
 * at least one application record carrying an actual application number and a
 * filing date. You cannot turn the claim on by asserting it — only by entering
 * the receipt.
 *
 * ## Turning it on
 *
 * When a provisional is filed, add its record to APPLICATIONS below and set
 * STAGE. Nothing else changes; every page updates on the next build.
 */

export type PatentStage =
  /** Claims drafted. Nothing on file. No application number exists. */
  | 'drafted'
  /** A provisional is on file. "Patent pending" becomes true here. */
  | 'provisional_filed'
  /** A non-provisional (utility) application is on file. */
  | 'nonprovisional_filed'
  /** At least one patent has issued. */
  | 'granted';

/** One application actually on file with the patent office. */
export interface PatentApplication {
  /** Internal reference, e.g. "PAT-010". */
  readonly ref: string;
  /** Title as filed. */
  readonly title: string;
  /**
   * The USPTO application number. Without this, nothing counts as filed.
   * A docket number, a matter number, or an attorney's file reference is NOT
   * an application number and must not be entered here.
   */
  readonly applicationNumber: string;
  /** ISO filing date as shown on the USPTO filing receipt. */
  readonly filedOn: string;
  readonly kind: 'provisional' | 'nonprovisional';
}

/**
 * Applications on file. EMPTY IS THE CORRECT VALUE TODAY.
 *
 * Do not add an entry here in anticipation of a filing. The array is the proof,
 * and an entry without a real receipt behind it defeats the entire mechanism.
 */
export const APPLICATIONS: readonly PatentApplication[] = [];

export const STAGE: PatentStage = 'drafted';

/**
 * The only function permitted to authorise the words "patent pending" anywhere
 * on this platform. It ignores STAGE unless a receipt backs it.
 */
export function mayClaimPatentPending(): boolean {
  if (APPLICATIONS.length === 0) return false;
  if (STAGE === 'drafted') return false;
  return APPLICATIONS.some(
    (a) => a.applicationNumber.trim().length > 0 && a.filedOn.trim().length > 0,
  );
}

export function mayClaimPatented(): boolean {
  return STAGE === 'granted' && mayClaimPatentPending();
}

/**
 * The one true sentence, for every surface that needs to say something.
 * Public pages, PDFs, slide decks and partner sites all render THIS string.
 */
export function portfolioSentence(): string {
  if (mayClaimPatented()) {
    return `Protected by issued U.S. patents. ${APPLICATIONS.length} application(s) of record.`;
  }
  if (mayClaimPatentPending()) {
    const first = APPLICATIONS[0];
    return `Patent pending. U.S. application ${first.applicationNumber}, filed ${first.filedOn}.`;
  }
  return 'Patent applications drafted; none filed. No application number exists and nothing here is patent-pending.';
}

/**
 * Throws if a caller tries to render a pending/granted claim that is not true.
 * Call this from any component that is about to print such a claim, so the
 * failure happens in a test run rather than on a prospect's screen.
 */
export function assertClaimPermitted(claim: 'pending' | 'patented'): void {
  const ok = claim === 'patented' ? mayClaimPatented() : mayClaimPatentPending();
  if (!ok) {
    throw new Error(
      `Refused to render a "${claim}" patent claim: no application record with a ` +
        `number and a filing date exists. See shared/patentStatus.ts. ` +
        `Marking an article as patent-applied-for when it is not is false marking ` +
        `under 35 U.S.C. § 292.`,
    );
  }
}
