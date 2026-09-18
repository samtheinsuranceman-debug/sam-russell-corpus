/**
 * Divorce property-division rules, all fifty states and the District of Columbia.
 *
 * ## Why this file exists
 *
 * `shared/divorceFinancialEngine.ts` carried a nine-entry community-property list
 * and three hard-coded split ratios (60/40, 55/45, 50/50) that were not derived
 * from any state's law. Four portal pages render off it. The patent portfolio
 * calls this Family 15 ("The Divorce Shield — fifty states, five scenarios") and
 * the outside prior-art screen returned no close art, which makes it worth doing
 * properly rather than worth faking.
 *
 * ## The rule this file follows
 *
 * Every field carries its own evidence. `regime` is the state's property-division
 * doctrine, which is black-letter law and stable. Everything softer than that —
 * whether a state recognises marital fault in division, how it treats separate
 * property that has been commingled, whether life-insurance cash value is reachable
 * — is typed as `Sourced<T>`, which forces a citation and a date to sit beside the
 * value, or forces the value to be absent.
 *
 * A field that is absent renders as "not established for this state" on the page.
 * It does NOT render as a number. That is the whole point: a divorce projection
 * that quietly guesses at a state rule is worse than one that says it does not know,
 * because the client makes a real decision on it.
 *
 * ## What this file is NOT
 *
 * It is not legal advice and it is not a substitute for counsel in the client's
 * state. Equitable-distribution states give judges wide discretion; two identical
 * estates in the same county can divide differently. The `discretionBand` field
 * exists to make that visible instead of hiding it behind a single ratio.
 */

/** A value that cannot exist without a citation and the date it was read. */
export interface Sourced<T> {
  readonly value: T;
  readonly source: string;
  /** ISO date the source was read. */
  readonly readOn: string;
}

export function sourced<T>(value: T, source: string, readOn: string): Sourced<T> {
  return { value, source, readOn };
}

/**
 * The two property-division doctrines, plus the one hybrid.
 *
 * community  — marital property is owned equally; the presumption is a 50/50
 *              division of community property.
 * equitable  — the court divides marital property in proportions it considers
 *              fair, which is frequently not equal.
 * elective   — a common-law state that lets spouses opt INTO a community-property
 *              regime by agreement or trust. Alaska, Tennessee, South Dakota,
 *              Kentucky and Florida have elective community-property statutes;
 *              absent an election the state divides equitably.
 */
export type PropertyRegime = 'community' | 'equitable' | 'elective';

/**
 * How much room the court has to depart from the regime's default.
 *
 * narrow — the default split is applied absent unusual facts.
 * wide   — the statute lists factors and the outcome turns on them.
 */
export type DiscretionBand = 'narrow' | 'wide';

export interface StateDivorceRule {
  readonly code: string;
  readonly name: string;
  readonly regime: PropertyRegime;
  /**
   * The division the regime starts from, as the marital-estate share going to
   * the lower-earning or non-titled spouse. For community states this is 0.5 by
   * doctrine. For equitable states there is NO statutory default, so this is
   * deliberately undefined rather than invented.
   */
  readonly presumptiveShare?: number;
  readonly discretionBand: DiscretionBand;
  /**
   * Whether marital misconduct may be weighed in dividing property (distinct from
   * its effect on support). Absent where not established.
   */
  readonly faultConsideredInDivision?: Sourced<boolean>;
  readonly note?: string;
}

const NCCUSL_UMDA =
  'Uniform Marriage and Divorce Act §307 (equitable distribution framework), as adopted or adapted by state statute';
const COMMUNITY_NINE =
  'The nine community-property states are Arizona, California, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington and Wisconsin — a classification long settled in American family law and reflected in IRS Publication 555 (Community Property).';
const READ = '2026-09-16';

function eq(code: string, name: string, discretionBand: DiscretionBand = 'wide', note?: string): StateDivorceRule {
  return { code, name, regime: 'equitable', discretionBand, note };
}

function community(code: string, name: string): StateDivorceRule {
  return {
    code,
    name,
    regime: 'community',
    presumptiveShare: 0.5,
    discretionBand: 'narrow',
    note: COMMUNITY_NINE,
  };
}

function elective(code: string, name: string, statute: string): StateDivorceRule {
  return {
    code,
    name,
    regime: 'elective',
    discretionBand: 'wide',
    note: `Divides equitably by default. ${statute} permits spouses to elect a community-property regime by agreement or by funding a qualifying trust; the election must be made affirmatively and does not arise from residence alone.`,
  };
}

/**
 * All fifty states and DC.
 *
 * `presumptiveShare` is populated ONLY for community-property states, where the
 * 50/50 starting point is doctrine. Equitable-distribution states have no
 * statutory presumption of any particular ratio, and inventing one — as the prior
 * engine did with 0.6/0.4 — is the error this table exists to remove.
 */
export const STATE_DIVORCE_RULES: readonly StateDivorceRule[] = [
  eq('AL', 'Alabama', 'wide'),
  eq('AK', 'Alaska', 'wide'),
  community('AZ', 'Arizona'),
  eq('AR', 'Arkansas', 'narrow', 'Statute directs an equal division of marital property unless the court states in writing its reasons for an unequal division.'),
  community('CA', 'California'),
  eq('CO', 'Colorado', 'wide'),
  eq('CT', 'Connecticut', 'wide', 'One of the broadest "all property" regimes: the court may assign to either spouse property owned by the other, including separate property.'),
  eq('DE', 'Delaware', 'wide'),
  eq('DC', 'District of Columbia', 'wide'),
  elective('FL', 'Florida', 'The Florida Community Property Trust Act (Fla. Stat. ch. 736, pt. XV, effective 2021)'),
  eq('GA', 'Georgia', 'wide'),
  eq('HI', 'Hawaii', 'wide'),
  community('ID', 'Idaho'),
  eq('IL', 'Illinois', 'wide'),
  eq('IN', 'Indiana', 'narrow', 'Statute presumes an equal division of ALL property, marital and separate, rebuttable by evidence.'),
  eq('IA', 'Iowa', 'wide'),
  eq('KS', 'Kansas', 'wide'),
  elective('KY', 'Kentucky', 'The Kentucky Community Property Trust Act (KRS ch. 386.620 et seq.)'),
  community('LA', 'Louisiana'),
  eq('ME', 'Maine', 'wide'),
  eq('MD', 'Maryland', 'wide'),
  eq('MA', 'Massachusetts', 'wide', 'An "all property" regime: separate property is reachable.'),
  eq('MI', 'Michigan', 'wide'),
  eq('MN', 'Minnesota', 'wide'),
  eq('MS', 'Mississippi', 'wide'),
  eq('MO', 'Missouri', 'wide'),
  eq('MT', 'Montana', 'wide', 'An "all property" regime.'),
  eq('NE', 'Nebraska', 'wide'),
  community('NV', 'Nevada'),
  eq('NH', 'New Hampshire', 'narrow', 'Statute presumes an equal division of all property is equitable, rebuttable on listed factors.'),
  eq('NJ', 'New Jersey', 'wide'),
  community('NM', 'New Mexico'),
  eq('NY', 'New York', 'wide'),
  eq('NC', 'North Carolina', 'narrow', 'Statute presumes an equal division of marital property is equitable, rebuttable on listed factors.'),
  eq('ND', 'North Dakota', 'wide', 'An "all property" regime.'),
  eq('OH', 'Ohio', 'narrow', 'Statute presumes an equal division of marital property, rebuttable where equal would be inequitable.'),
  eq('OK', 'Oklahoma', 'wide'),
  eq('OR', 'Oregon', 'narrow', 'Statute presumes equal contribution to property acquired during the marriage.'),
  eq('PA', 'Pennsylvania', 'wide'),
  eq('RI', 'Rhode Island', 'wide'),
  eq('SC', 'South Carolina', 'wide'),
  elective('SD', 'South Dakota', 'The South Dakota Special Spousal Property Act (SDCL ch. 55-17)'),
  elective('TN', 'Tennessee', 'The Tennessee Community Property Trust Act (Tenn. Code Ann. §35-17-101 et seq.)'),
  community('TX', 'Texas'),
  eq('UT', 'Utah', 'wide'),
  eq('VT', 'Vermont', 'wide', 'An "all property" regime.'),
  eq('VA', 'Virginia', 'wide'),
  community('WA', 'Washington'),
  eq('WV', 'West Virginia', 'narrow', 'Statute presumes an equal division of marital property, rebuttable on listed factors.'),
  community('WI', 'Wisconsin'),
  eq('WY', 'Wyoming', 'wide', 'An "all property" regime.'),
];

const BY_CODE = new Map(STATE_DIVORCE_RULES.map((r) => [r.code, r]));

export function ruleForState(code: string): StateDivorceRule | null {
  return BY_CODE.get(code.trim().toUpperCase()) ?? null;
}

export function isCommunityProperty(code: string): boolean {
  return ruleForState(code)?.regime === 'community';
}

/**
 * The share of the marital estate the model may assume, or null.
 *
 * Returns a number ONLY where the state's own doctrine supplies one. For every
 * equitable-distribution state it returns null, and the caller must present a
 * range or refuse — it must not substitute a number of its own. This is the
 * single most important function in this file and the reason it was written.
 */
export function presumptiveShare(code: string): number | null {
  const rule = ruleForState(code);
  if (!rule) return null;
  return rule.presumptiveShare ?? null;
}

/**
 * A plain-language sentence for the page, naming what is and is not established.
 * Never returns a ratio for a state that does not have one.
 */
export function divisionSentence(code: string): string {
  const rule = ruleForState(code);
  if (!rule) return `No division rule is on file for "${code}". No split is assumed.`;
  if (rule.regime === 'community') {
    return `${rule.name} is a community-property state. Community property is presumed to divide equally (50/50). Separate property is generally not divided.`;
  }
  if (rule.regime === 'elective') {
    return `${rule.name} divides property equitably unless the spouses have affirmatively elected a community-property regime. Absent that election there is no presumed ratio, so none is assumed here.`;
  }
  const presumesEqual = rule.discretionBand === 'narrow';
  return presumesEqual
    ? `${rule.name} divides property equitably and its statute starts from a presumption that an equal division is equitable, rebuttable on the statutory factors. A ratio is not guaranteed.`
    : `${rule.name} divides property equitably. There is no statutory presumption of any particular ratio, so no split is assumed here — the outcome turns on the statutory factors and the court's discretion.`;
}

/** Every state, for a coverage test and for the page's state selector. */
export function allStateCodes(): string[] {
  return STATE_DIVORCE_RULES.map((r) => r.code);
}

export const RULES_VERSION = {
  version: '2026.09.1',
  compiledOn: READ,
  basis: [COMMUNITY_NINE, NCCUSL_UMDA],
  /**
   * What a reader must not conclude from this table. Kept in code, beside the
   * data, in the same shape the RCS engines use for their never-print lists.
   */
  neverPrinted: [
    'A specific dollar award for any state. This table establishes the regime, not the outcome.',
    'A division ratio for an equitable-distribution state. None exists in statute.',
    'That an elective community-property trust has been created. The election is affirmative and is a fact about the client, not about the state.',
    'That this table is legal advice or a substitute for counsel licensed in the client’s state.',
  ],
} as const;
