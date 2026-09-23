// ============================================================
// SOURCING — a figure without a source is a runtime error, not a code smell.
//
// WHY THIS EXISTS. This codebase already has two honest answers to "where did
// that number come from", and they catch different mistakes at different times:
//
//   shared/provenance.ts   — a FigureTrace narrates how a headline figure was
//                            made, and its verify() recomputes it from the real
//                            engine. Caught at BUILD time, by a test.
//   Verified<T>            — shared/mutualIulCarriers.ts wraps a value with
//                            { verified, source, asOf }. Caught at REVIEW time,
//                            by a human reading the type.
//
// Neither catches the case that actually ships bad numbers: a value that is
// born at RUNTIME. A router fetches a rate, the feed is stale or empty, a
// fallback quietly substitutes something plausible, and a page renders a figure
// nobody sourced. A build-time test cannot see that value because it did not
// exist at build time. A type cannot see it because `Verified<T>` with
// `verified: false` still type-checks and still renders.
//
// So this module makes the failure loud. `assertSourced` THROWS. The page shows
// a refusal instead of a number. That is a deliberate trade: we would rather
// show nothing than show a figure we cannot defend, because the audience is
// physicians and practice owners who will check, and a single indefensible
// number costs more trust than ten missing ones.
//
// THE RULE THIS ENCODES, in one line:
//   Anything a reader could mistake for a fact has to be one.
//
// It is the same ethic provenance.ts states in prose, promoted to something the
// runtime enforces rather than something a reviewer has to remember.
//
// WHAT COUNTS AS SOURCED. Three things, all required, no exceptions:
//   1. a `source` — a named document, statute, feed or filing, not "internal"
//   2. an `asOf`  — an ISO date, because a rate without a date is a rumour
//   3. a `value`  — present and finite; NaN and Infinity are not figures
//
// WHAT IS DELIBERATELY ALLOWED. An `assumption` is legal and does NOT throw,
// because refusing to assume anything would make the product useless. It simply
// cannot masquerade as sourced: it carries kind: "assumption", it renders with
// the words "we assumed", and `assertSourced` rejects it. The distinction
// between a source and an assumption is the entire point; erasing it to make a
// page look more confident is the failure mode this file exists to prevent.
//
// HOW TO ADOPT IT WITHOUT A BIG-BANG REWRITE. `isSourced` is a pure predicate
// and `describe` never throws, so a page can soft-adopt first — show the
// refusal UI where a figure is unsourced, keep rendering everything else — and
// only later turn on `assertSourced` at the router boundary. Nothing here
// imports anything, so it can be adopted one file at a time.
// ============================================================

/** Where a number came from. `sourced` and `rule` are defensible; the rest are not. */
export type SourceKind =
  /** A named document, feed or filing with a date. */
  | "sourced"
  /** A statute, regulation, or a carrier's filed contract terms. */
  | "rule"
  /** The client typed it. Their number, their responsibility — but still dated. */
  | "input"
  /** We did arithmetic on other Sourced values. Inherits their weakest link. */
  | "derived"
  /** Nobody knows. We picked it and we say so. Never renders as a fact. */
  | "assumption";

/** The kinds that may be presented to a reader as fact. */
export const DEFENSIBLE_KINDS: readonly SourceKind[] = ["sourced", "rule", "input", "derived"];

/**
 * A value that carries its own provenance.
 *
 * Structurally compatible with the existing `Verified<T>` in
 * shared/mutualIulCarriers.ts (same `value` / `source` / `asOf` field names),
 * so the two can coexist during migration and a Verified record can be lifted
 * into a Sourced with `fromVerified` below rather than rewritten.
 */
export type Sourced<T> = {
  value: T;
  kind: SourceKind;
  /** Named document, statute, feed or filing. Never "internal" or "estimate". */
  source: string;
  /** ISO date (YYYY-MM-DD) the source was published or read. */
  asOf: string;
  /** Optional URL to the primary source. */
  url?: string;
  /** Optional sample size. Present on any base rate — see sampleSizeOf below. */
  n?: number;
  /** Free text shown beside the figure. Required on assumptions. */
  note?: string;
};

/**
 * Thrown when a figure that must be defensible is not.
 *
 * Carries `field` and `reason` separately from the message so a router can log
 * them structurally and a UI can render the refusal without regex-parsing a
 * string. Extends Error so existing error boundaries and try/catch keep working
 * — this does not need new plumbing to be caught.
 */
export class UnsourcedFindingError extends Error {
  readonly field: string;
  readonly reason: string;
  readonly kind?: SourceKind;

  constructor(field: string, reason: string, kind?: SourceKind) {
    super(`Unsourced finding for "${field}": ${reason}`);
    this.name = "UnsourcedFindingError";
    this.field = field;
    this.reason = reason;
    this.kind = kind;
    // Restores the prototype chain so `instanceof` works when this is compiled
    // to ES5 targets. Without it, `catch (e) { e instanceof UnsourcedFindingError }`
    // silently returns false and the error is swallowed by a generic handler.
    Object.setPrototypeOf(this, UnsourcedFindingError.prototype);
  }
}

/** Thrown when a *quote* is attributed to a source that cannot support it. */
export class UnsourcedQuoteError extends Error {
  readonly quote: string;
  readonly reason: string;

  constructor(quote: string, reason: string) {
    const shown = quote.length > 60 ? `${quote.slice(0, 57)}...` : quote;
    super(`Unsourced quote "${shown}": ${reason}`);
    this.name = "UnsourcedQuoteError";
    this.quote = quote;
    this.reason = reason;
    Object.setPrototypeOf(this, UnsourcedQuoteError.prototype);
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Words that look like a source but are not one.
 *
 * These are the exact phrases that show up when someone needed a string to get
 * past a type check. Listing them by name is cruder than a clever heuristic and
 * far harder to argue with in review, which is the point.
 */
const NON_SOURCES = new Set([
  "internal",
  "estimate",
  "estimated",
  "assumption",
  "assumed",
  "tbd",
  "todo",
  "n/a",
  "na",
  "unknown",
  "various",
  "industry standard",
  "general knowledge",
  "common knowledge",
  "placeholder",
  "example",
  "sample",
]);

/** Why this value is not defensible, or null if it is. Never throws. */
export function sourceDefect<T>(s: Sourced<T> | null | undefined): string | null {
  if (s === null || s === undefined) return "no value was supplied";
  if (!DEFENSIBLE_KINDS.includes(s.kind)) {
    return s.kind === "assumption"
      ? "it is an assumption, which may be shown but never asserted as fact"
      : `unknown kind "${String(s.kind)}"`;
  }
  if (s.value === null || s.value === undefined) return "the value is missing";
  if (typeof s.value === "number" && !Number.isFinite(s.value)) {
    return `the value is ${String(s.value)}, which is not a figure`;
  }
  const source = (s.source ?? "").trim();
  if (source === "") return "no source was named";
  if (NON_SOURCES.has(source.toLowerCase())) {
    return `"${source}" names no document, statute, feed or filing`;
  }
  const asOf = (s.asOf ?? "").trim();
  if (asOf === "") return "no as-of date was given, and a figure without a date is a rumour";
  if (!ISO_DATE.test(asOf)) return `as-of date "${asOf}" is not an ISO date (YYYY-MM-DD)`;
  return null;
}

/** True when this value may be presented to a reader as fact. Never throws. */
export function isSourced<T>(s: Sourced<T> | null | undefined): boolean {
  return sourceDefect(s) === null;
}

/**
 * Returns the underlying value, or throws UnsourcedFindingError.
 *
 * This is the function that should sit at the boundary of every data router.
 * Call it on the way OUT, once, rather than scattering checks through the UI:
 * one throw site is auditable, fifty conditionals are not.
 */
export function assertSourced<T>(field: string, s: Sourced<T> | null | undefined): T {
  const defect = sourceDefect(s);
  if (defect !== null) throw new UnsourcedFindingError(field, defect, s?.kind);
  return (s as Sourced<T>).value;
}

/**
 * Asserts every field of a record at once and returns the unwrapped values.
 *
 * Reports the FIRST defect by key order rather than collecting all of them,
 * because a partially-sourced report is not shippable either way and one clear
 * error is easier to act on than a list.
 */
export function assertAllSourced<R extends Record<string, Sourced<unknown>>>(
  record: R,
): { [K in keyof R]: R[K]["value"] } {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(record)) {
    out[key] = assertSourced(key, record[key]);
  }
  return out as { [K in keyof R]: R[K]["value"] };
}

/**
 * A human sentence for a value, sourced or not. NEVER throws.
 *
 * Exists so a refusal can be rendered as content rather than swallowed. A page
 * that catches UnsourcedFindingError and shows nothing has hidden the problem;
 * a page that shows "We cannot show this: no as-of date was given" has reported
 * it, and the reader learns something true about the system's limits.
 */
export function describe<T>(field: string, s: Sourced<T> | null | undefined): string {
  const defect = sourceDefect(s);
  if (defect !== null) return `${field}: we cannot show this — ${defect}.`;
  const v = s as Sourced<T>;
  const n = typeof v.n === "number" ? `, n = ${v.n}` : "";
  return `${field}: ${String(v.value)} — ${v.source}, as of ${v.asOf}${n}.`;
}

/**
 * Sample size for a base rate, or null.
 *
 * Separate from the value on purpose. The house rule is that a probability
 * always travels with the number of observations behind it, because "68%" from
 * 14 windows and "68%" from 1,400 are different claims and merging them is the
 * most common way an honest engine starts lying. `null` means the caller must
 * say "sample size unknown" — it does not mean zero.
 */
export function sampleSizeOf<T>(s: Sourced<T> | null | undefined): number | null {
  if (!s || typeof s.n !== "number" || !Number.isFinite(s.n) || s.n < 0) return null;
  return s.n;
}

/**
 * True when a base rate has too few observations to report as a probability.
 *
 * Default threshold 15 matches the existing convention in the erosion work,
 * where 14- and 5-window buckets were judged too thin and the engine returned
 * null rather than a number. Encoding the threshold here rather than repeating
 * the literal keeps one definition of "too thin" across engines.
 */
export function tooThin<T>(s: Sourced<T> | null | undefined, minimum = 15): boolean {
  const n = sampleSizeOf(s);
  return n === null || n < minimum;
}

/** Days between the as-of date and `now`, or null when the date is unusable. */
export function ageInDays<T>(s: Sourced<T> | null | undefined, now: Date = new Date()): number | null {
  if (!s || !ISO_DATE.test((s.asOf ?? "").trim())) return null;
  const then = Date.parse(`${s.asOf}T00:00:00Z`);
  if (Number.isNaN(then)) return null;
  return Math.floor((now.getTime() - then) / 86_400_000);
}

/**
 * True when a value is older than `maxAgeDays`.
 *
 * Default 90 matches the freshness sweep already specified in the roadmap.
 * Staleness is reported, never thrown: an old sourced figure is still a fact
 * about the past, and the honest move is to show it with its age rather than
 * hide it. Only the ABSENCE of a source throws.
 */
export function isStale<T>(s: Sourced<T> | null | undefined, maxAgeDays = 90, now?: Date): boolean {
  const age = ageInDays(s, now);
  return age === null ? true : age > maxAgeDays;
}

/**
 * Derives a new value from inputs, inheriting the weakest provenance.
 *
 * The rule is deliberately pessimistic: if ANY input is an assumption, the
 * result is an assumption, and the result's asOf is the OLDEST input's date.
 * A derived figure cannot be fresher or better sourced than what it was made
 * from, and the common bug is arithmetic quietly laundering a guess into a
 * fact. This makes that impossible rather than merely discouraged.
 *
 * Throws only when there are no inputs — arithmetic on nothing has no source.
 */
export function derive<T>(
  field: string,
  inputs: readonly Sourced<unknown>[],
  compute: () => T,
  note?: string,
): Sourced<T> {
  if (inputs.length === 0) {
    throw new UnsourcedFindingError(field, "a derived figure needs at least one sourced input");
  }
  const anyAssumed = inputs.some((i) => i.kind === "assumption");
  const dated = inputs.map((i) => (i.asOf ?? "").trim()).filter((d) => ISO_DATE.test(d)).sort();
  const oldest = dated.length > 0 ? dated[0] : "";
  const sources = Array.from(new Set(inputs.map((i) => (i.source ?? "").trim()).filter(Boolean)));
  return {
    value: compute(),
    kind: anyAssumed ? "assumption" : "derived",
    source: sources.join(" + "),
    asOf: oldest,
    note: anyAssumed ? `${note ? `${note}. ` : ""}Rests on an assumption.` : note,
  };
}

/** Lifts an existing `Verified<T>` record into a `Sourced<T>`. */
export function fromVerified<T>(
  v: { value: T; verified: boolean; source: string; asOf: string; note?: string },
  kind: SourceKind = "sourced",
): Sourced<T> {
  return {
    value: v.value,
    kind: v.verified ? kind : "assumption",
    source: v.source,
    asOf: v.asOf,
    note: v.note,
  };
}

/** Constructor for a sourced figure. */
export const sourced = <T,>(value: T, source: string, asOf: string, extra: Partial<Sourced<T>> = {}): Sourced<T> =>
  ({ value, kind: "sourced", source, asOf, ...extra });

/** Constructor for a figure that comes from law or filed contract terms. */
export const ruled = <T,>(value: T, statute: string, asOf: string, extra: Partial<Sourced<T>> = {}): Sourced<T> =>
  ({ value, kind: "rule", source: statute, asOf, ...extra });

/**
 * Constructor for an assumption. `note` is REQUIRED — an assumption nobody
 * explained is indistinguishable from a number someone made up.
 */
export const assumed = <T,>(value: T, note: string, asOf = ""): Sourced<T> =>
  ({ value, kind: "assumption", source: "", asOf, note });

/**
 * Asserts a quotation is backed by text that actually contains it.
 *
 * The guard is exact-substring after whitespace normalisation, not fuzzy
 * matching. Fuzzy matching would let a paraphrase pass as a quote, which is the
 * specific harm: a carrier's contract language reworded slightly can invert its
 * meaning, and this system quotes carrier language to justify strategies.
 */
export function assertQuoted(quote: string, sourceText: string): string {
  const norm = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();
  const q = norm(quote);
  if (q === "") throw new UnsourcedQuoteError(quote, "the quote is empty");
  if (!norm(sourceText).includes(q)) {
    throw new UnsourcedQuoteError(quote, "it does not appear verbatim in the cited source text");
  }
  return quote;
}
