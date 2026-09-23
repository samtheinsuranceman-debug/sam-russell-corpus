/**
 * Patent status — one switch, one true sentence, everywhere.
 *
 * ## Why this file exists
 *
 * Four places in this repo described the portfolio four different ways:
 * PatentShowcase.tsx cards said "Patent Pending" while the same file's footer
 * said "Not yet filed with the USPTO"; homeManifesto.json said "fifteen
 * patent-pending engines"; ProprietaryTech.tsx said "15 core patent
 * applications are in process (patent-pending)"; the corpus index said no
 * application numbers exist. They cannot all be right, and a public page that
 * contradicts another public page on the same site is the thing a competitor
 * screenshots.
 *
 * So the claim lives here and nowhere else. Every surface imports it.
 *
 * ## The rule this enforces
 *
 * "Patent pending" is a statement of fact, not of intention. It is true once
 * an application — provisional counts — is on file and the USPTO has issued a
 * number. It is not true when a draft exists, when counsel is engaged, when
 * financing is arranged, or when a document is about to be signed. Marking an
 * article as patented or patent-applied-for when it is not is false marking
 * under 35 U.S.C. § 292; since the AIA, a competitor who suffers injury can
 * sue for damages.
 *
 * So mayClaimPatentPending() does not read a boolean somebody set. It requires
 * at least one application record carrying an actual number and date. You
 * cannot turn the claim on by asserting it — only by entering the receipt.
 * This is the same shape as `Verified<T>` in mutualIulCarriers.ts: the proof
 * lives beside the fact, and a missing proof shows up on the screen.
 *
 * ## Turning it on
 *
 * When the provisional is filed, add its record to APPLICATIONS below and set
 * STAGE. Nothing else changes; every page updates on the next build. A
 * provisional is filed in a day and is the cheapest honest route to this
 * sentence being true.
 */

import { CLAIMS } from './patentCatalog';

export type PatentStage =
  /** Claims drafted. Nothing on file. No application number exists. */
  | 'drafted'
  /** A provisional is on file. "Patent pending" becomes true here. */
  | 'provisional_filed'
  /** A non-provisional (utility) application is on file. */
  | 'nonprovisional_filed'
  /** At least one patent has issued. */
  | 'granted';

/** One application on file with the patent office. */
export interface PatentApplication {
  /** Internal reference, e.g. "PAT-010". */
  readonly ref: string;
  /** Title as filed. */
  readonly title: string;
  /** The USPTO application number. Without this, nothing counts as filed. */
  readonly applicationNumber: string;
  /** Filing date, ISO. */
  readonly filedOn: string;
  readonly kind: 'provisional' | 'nonprovisional';
  /** Patent number, once granted. */
  readonly patentNumber?: string;
}

/**
 * Current stage. Change this the day a receipt exists — and add the record to
 * APPLICATIONS, because the helpers below check the records, not this value.
 */
export const STAGE: PatentStage = 'drafted';

/**
 * Applications actually on file. Empty until the USPTO issues a number.
 *
 * Do not add an entry in anticipation of a filing. An entry here is a
 * representation to the public that a specific application exists.
 */
export const APPLICATIONS: readonly PatentApplication[] = [];

/**
 * THE switch, as a flat list: the USPTO application numbers actually on file.
 * Derived from APPLICATIONS, so it is empty until a receipt is entered there.
 * Every badge, eyebrow and sentence that could say "patent pending" reads
 * techStatusLabel() / statusBadge(), which read this. While it is empty the
 * surfaces say "Proprietary method"; the day it holds a number they say
 * "Patent pending (Application No. …)".
 */
export const FILED_APPLICATION_NUMBERS: readonly string[] = APPLICATIONS.map((a) => a.applicationNumber).filter(
  (n) => n.trim().length > 0,
);

/**
 * Count of claims described in the portfolio, filed or not. Derived, because
 * the number was wrong the moment the portfolio grew past fifteen and a
 * hand-typed constant has no way of noticing.
 */
export const ENGINE_COUNT = CLAIMS.length;

/**
 * Claims with a drafted application document in the repository.
 *
 * This is a different fact from ENGINE_COUNT and a very different fact from
 * APPLICATIONS.length. A drafted specification is a document we wrote. An
 * application is a document the USPTO has received and numbered. Surfaces may
 * describe the first freely; only the second licenses the words "patent
 * pending".
 */
export const DRAFTED_COUNT = CLAIMS.filter((c) => Boolean(c.applicationDraft)).length;

/**
 * May any surface use the words "patent pending"?
 *
 * True only when a real application record exists. Deliberately ignores STAGE
 * on its own: a stage set optimistically without a receipt does not make the
 * claim true, and this is the function that stops that from reaching a page.
 */
export function mayClaimPatentPending(): boolean {
  return FILED_APPLICATION_NUMBERS.length > 0;
}

/**
 * The status word for a single technology's eyebrow ("Technology 07 · … ·").
 * "Proprietary method" until an application number exists; then the claim,
 * with its number, so it can be checked.
 */
export function techStatusLabel(ref?: string): string {
  if (!mayClaimPatentPending()) return 'Proprietary method';
  const app = ref ? APPLICATIONS.find((a) => a.ref === ref || a.ref.endsWith(ref)) : undefined;
  const number = app?.applicationNumber ?? FILED_APPLICATION_NUMBERS[0];
  return `Patent pending (Application No. ${number})`;
}

/** May a surface say a patent has been granted? */
export function mayClaimGranted(): boolean {
  return APPLICATIONS.some((a) => Boolean(a.patentNumber));
}

/**
 * The one sentence. Every page that describes the portfolio's legal status
 * prints this and nothing of its own.
 */
export function statusSentence(): string {
  if (mayClaimGranted()) {
    const n = APPLICATIONS.filter((a) => a.patentNumber).length;
    return `${n} patent${n === 1 ? '' : 's'} granted; the remainder are pending.`;
  }
  if (mayClaimPatentPending()) {
    const n = APPLICATIONS.length;
    return `Patent pending — ${n} application${n === 1 ? '' : 's'} on file with the United States Patent and Trademark Office.`;
  }
  const drafts =
    DRAFTED_COUNT === ENGINE_COUNT
      ? `all ${ENGINE_COUNT}`
      : `${DRAFTED_COUNT} of ${ENGINE_COUNT}`;
  return `${ENGINE_COUNT} engines documented, with a full application drafted for ${drafts}. No application has been filed with the United States Patent and Trademark Office yet, so nothing here is patented or patent pending.`;
}

/**
 * Short label for a card or badge. Never returns "Patent Pending" unless it
 * is true, which is the whole point of routing badges through here.
 */
export function statusBadge(): string {
  if (mayClaimGranted()) return 'Patented';
  if (mayClaimPatentPending()) return `Patent Pending (Application No. ${FILED_APPLICATION_NUMBERS[0]})`;
  return 'Claims drafted — not filed';
}

/**
 * Phrases no client surface may contain while mayClaimPatentPending() is
 * false. Enforced by server/patentClaimGuard.test.ts, which reads the source
 * of every page and component rather than trusting that this list is honoured.
 *
 * It was exported and unenforced for some time, and PatentShowcase.tsx carried
 * eight "Patent Pending" badges through a green suite. A guard nothing runs is
 * a comment.
 */
export const FORBIDDEN_WHEN_UNFILED = [
  'patent pending',
  'patent-pending',
  'patents pending',
  'patent applications in process',
  // Lower case: the guard lower-cases the text it reads, so a mixed-case entry
  // here ("filed with the USPTO") could never match, and "8 Patents — Filed
  // with USPTO" shipped through a green suite. patentClaimGuard.test.ts now
  // lower-cases both sides, and asserts every entry is already lower case.
  'filed with the uspto',
  'filed with uspto',
  'patents filed',
  'patent filed',
] as const;

/**
 * Split-form claims a plain phrase list cannot see: "Technology 01 · Pending ·
 * Only at RCS" says "patent pending" without the two words touching. Matched
 * against lower-cased text with separators (· — – - |) collapsed to spaces.
 */
export const FORBIDDEN_PATTERNS_WHEN_UNFILED: readonly RegExp[] = [
  /\b(technology|technologies|patent|patents|invention|inventions)\b(\s+\S+){0,6}?\s+pending\b/,
  /\bpending\b(\s+\S+){0,3}?\s+(patent|patents|uspto)\b/,
  /\b\d+\s+patents?\b(\s+\S+){0,3}?\s+filed\b/,
];

/**
 * Every patent-status claim in a piece of source text, or [] when there is none.
 * Enforced only while mayClaimPatentPending() is false.
 *
 * Lower-cases BOTH sides and collapses separators before matching. The first
 * guard lower-cased the file and compared it with the phrases as written, so
 * the mixed-case entry 'filed with the USPTO' could never match and "8 Patents
 * — Filed with USPTO" shipped on /portal/physicians-edge through a green suite.
 * It also matched contiguous phrases only, so the split form "Technology 01 ·
 * Pending · Only at RCS" on the homepage passed. Used by
 * server/patentClaimGuard.test.ts and server/copyComplianceGuard.test.ts.
 */
export function normalizeForClaims(text: string): string {
  return text
    .toLowerCase()
    .replace(/[·—–|\-]/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$\{[^}]*\}/g, ' ')
    .replace(/\s+/g, ' ');
}

export function patentClaimHits(text: string): string[] {
  if (mayClaimPatentPending()) return [];
  const t = normalizeForClaims(text);
  const hits: string[] = [];
  for (const phrase of FORBIDDEN_WHEN_UNFILED) {
    if (t.includes(normalizeForClaims(phrase))) hits.push(phrase);
  }
  for (const rx of FORBIDDEN_PATTERNS_WHEN_UNFILED) {
    const m = t.match(rx);
    if (m) hits.push(`/${rx.source}/ → "${m[0]}"`);
  }
  return hits;
}
