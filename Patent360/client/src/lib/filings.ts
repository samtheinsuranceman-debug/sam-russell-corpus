/**
 * Filings — the last mile, and the one that fails on formalities.
 *
 * Substantive prosecution is hard and interesting. Filing is neither, and it
 * is where submissions actually get bounced: an unsigned declaration, a
 * drawing at the wrong margin, an entity status that changed when the client
 * took an investment, a fee short by the price of one excess claim. None of
 * those are legal problems. They are clerical ones with legal consequences,
 * and they are exactly what a machine should catch before a human signs.
 *
 * So this module is two things:
 *
 *   A pre-submission validator. Every check states the rule it enforces and
 *   whether it blocks the filing or merely warns, because an attorney is
 *   entitled to override a warning and is not entitled to override a bar.
 *
 *   A fee calculator. Excess-claim arithmetic is where money quietly leaks:
 *   fees are owed on claims over twenty, independent claims over three, and
 *   any multiple-dependent claim at all — computed per claim set, so a
 *   twenty-first claim that adds nothing is visible before it is paid for
 *   rather than after.
 *
 * Fee figures below are a dated schedule for this build. In production the
 * table is loaded from the USPTO fee schedule with its effective date, and
 * the effective date is shown, because the numbers change and a quietly
 * stale fee table is worse than no fee table.
 *
 * Demonstration dataset. Matters, dates and packets are invented here, and
 * nothing in this file is a filing or legal advice.
 */

export type Entity = 'large' | 'small' | 'micro';

export const ENTITY_LABEL: Record<Entity, string> = {
  large: 'Undiscounted',
  small: 'Small entity (50%)',
  micro: 'Micro entity (75%)'
};

/** Illustrative schedule for this build. Large-entity base, in USD. */
export const FEE_SCHEDULE = {
  effective: '2026-01-01',
  basicFiling: 350,
  search: 770,
  examination: 880,
  excessClaim: 100,          // each claim over 20
  excessIndependent: 480,    // each independent over 3
  multipleDependent: 860,    // once, if any multiple-dependent claim is present
  sheetsOver100: 420         // per 50 sheets or fraction
};

const DISCOUNT: Record<Entity, number> = { large: 1, small: 0.5, micro: 0.25 };

export type FeeLine = { label: string; qty: number; each: number; total: number; rule: string };

export function computeFees(opts: {
  entity: Entity;
  claims: number;
  independent: number;
  multipleDependent: boolean;
  sheets: number;
}): { lines: FeeLine[]; total: number; discount: number } {
  const d = DISCOUNT[opts.entity];
  const f = FEE_SCHEDULE;
  const line = (label: string, qty: number, base: number, rule: string): FeeLine => ({
    label, qty, each: Math.round(base * d), total: Math.round(base * d) * qty, rule
  });

  const lines: FeeLine[] = [
    line('Basic filing fee', 1, f.basicFiling, '37 CFR 1.16(a)'),
    line('Search fee', 1, f.search, '37 CFR 1.16(k)'),
    line('Examination fee', 1, f.examination, '37 CFR 1.16(o)')
  ];

  const excess = Math.max(0, opts.claims - 20);
  if (excess > 0) lines.push(line('Claims over 20', excess, f.excessClaim, '37 CFR 1.16(i)'));

  const excessInd = Math.max(0, opts.independent - 3);
  if (excessInd > 0) {
    lines.push(line('Independent claims over 3', excessInd, f.excessIndependent, '37 CFR 1.16(h)'));
  }

  if (opts.multipleDependent) {
    lines.push(line('Multiple dependent claim present', 1, f.multipleDependent, '37 CFR 1.16(j)'));
  }

  const overSheets = Math.max(0, opts.sheets - 100);
  if (overSheets > 0) {
    const blocks = Math.ceil(overSheets / 50);
    lines.push(line('Application size, per 50 sheets over 100', blocks, f.sheetsOver100, '37 CFR 1.16(s)'));
  }

  return {
    lines,
    total: lines.reduce((s, l) => s + l.total, 0),
    discount: Math.round((1 - d) * 100)
  };
}

/* ── Pre-submission validation ─────────────────────────────────────────── */

export type Severity = 'blocks' | 'warns' | 'passes';

export type Check = {
  id: string;
  label: string;
  severity: Severity;
  detail: string;
  rule: string;
  /** The one thing to do about it. Null when it passes. */
  fix: string | null;
};

export type Doc = {
  name: string;
  kind: 'ADS' | 'Spec' | 'Claims' | 'Drawings' | 'Declaration' | 'IDS' | 'Fee' | 'Power of attorney';
  pages: number;
  present: boolean;
  signed?: boolean;
};

export type Filing = {
  id: string;
  docket: string;
  title: string;
  client: string;
  type: 'Non-provisional' | 'Provisional' | 'PCT national phase' | 'Continuation' | 'Response';
  target: string;
  entity: Entity;
  claims: number;
  independent: number;
  multipleDependent: boolean;
  sheets: number;
  docs: Doc[];
  checks: Check[];
  status: 'ready' | 'blocked' | 'filed';
  filedOn?: string;
  receipt?: string;
};

export const FILINGS: Filing[] = [
  {
    id: 'f-2304',
    docket: 'BL-2304-US',
    title: 'Low-latency mesh relay for field sensors',
    client: 'Halden Instruments',
    type: 'Non-provisional',
    target: '2026-09-19',
    entity: 'small',
    claims: 23,
    independent: 4,
    multipleDependent: false,
    sheets: 48,
    status: 'blocked',
    docs: [
      { name: 'Application Data Sheet', kind: 'ADS', pages: 4, present: true },
      { name: 'Specification', kind: 'Spec', pages: 31, present: true },
      { name: 'Claims (1–23)', kind: 'Claims', pages: 6, present: true },
      { name: 'Drawings, Figs. 1–7', kind: 'Drawings', pages: 7, present: true },
      { name: 'Inventor declaration', kind: 'Declaration', pages: 2, present: true, signed: false },
      { name: 'Information disclosure statement', kind: 'IDS', pages: 3, present: true },
      { name: 'Fee transmittal', kind: 'Fee', pages: 1, present: true }
    ],
    checks: [
      {
        id: 'c1', label: 'Inventor declaration is unsigned', severity: 'blocks',
        detail:
          'The declaration is in the packet but carries no signature for the second named inventor. A declaration may be filed later with a surcharge, but filing it unsigned is not the same as filing it late — it is treated as not filed.',
        rule: '37 CFR 1.63',
        fix: 'Obtain the second inventor\'s signature, or remove the declaration and file it later with the surcharge.'
      },
      {
        id: 'c2', label: 'Entity status may have changed', severity: 'blocks',
        detail:
          'The client closed a $60M round on 15 July. Small-entity status turns on employee count and on whether rights have been assigned to a party that does not qualify — an investor board seat does not by itself disqualify, but the assignment position needs checking before a discounted fee is paid.',
        rule: '37 CFR 1.27',
        fix: 'Confirm the assignment position in writing before paying at the small-entity rate. Paying the wrong rate in good faith is correctable; doing it knowingly is not.'
      },
      {
        id: 'c3', label: 'Four independent claims', severity: 'warns',
        detail:
          'One independent claim over the three included in the base fee, which adds $240 at the small-entity rate. Worth keeping only if the fourth independent is genuinely a different statutory category rather than a restatement.',
        rule: '37 CFR 1.16(h)',
        fix: 'Either keep it deliberately or fold it into a dependent before filing.'
      },
      { id: 'c4', label: 'Drawing margins and numbering', severity: 'passes', detail: 'All seven sheets carry compliant margins, sheet numbering and reference numerals matching the specification.', rule: '37 CFR 1.84', fix: null },
      { id: 'c5', label: 'Claim numbering is consecutive', severity: 'passes', detail: 'Claims 1–23 numbered consecutively with no gaps; every dependency refers to a lower-numbered claim.', rule: '37 CFR 1.75(a)', fix: null },
      { id: 'c6', label: 'Specification supports every claim term', severity: 'passes', detail: 'Every term appearing in the claims appears in the specification with antecedent basis established.', rule: '37 CFR 1.75(d)(1)', fix: null }
    ]
  },
  {
    id: 'f-2312',
    docket: 'BL-2312-US',
    title: 'Enzymatic assay cartridge with dry reagent',
    client: 'Palewood Bio',
    type: 'Non-provisional',
    target: '2026-09-25',
    entity: 'small',
    claims: 20,
    independent: 3,
    multipleDependent: false,
    sheets: 62,
    status: 'ready',
    docs: [
      { name: 'Application Data Sheet', kind: 'ADS', pages: 4, present: true },
      { name: 'Specification', kind: 'Spec', pages: 44, present: true },
      { name: 'Claims (1–20)', kind: 'Claims', pages: 5, present: true },
      { name: 'Drawings, Figs. 1–9', kind: 'Drawings', pages: 9, present: true },
      { name: 'Inventor declaration', kind: 'Declaration', pages: 2, present: true, signed: true },
      { name: 'Fee transmittal', kind: 'Fee', pages: 1, present: true },
      { name: 'Power of attorney', kind: 'Power of attorney', pages: 1, present: true, signed: true }
    ],
    checks: [
      { id: 'd1', label: 'Exactly 20 claims, 3 independent', severity: 'passes', detail: 'At the fee boundary on both counts — no excess-claim fee is owed. A twenty-first claim would cost $50 and a fourth independent $240.', rule: '37 CFR 1.16(h), (i)', fix: null },
      { id: 'd2', label: 'Declaration signed by all inventors', severity: 'passes', detail: 'Both named inventors have signed and dated.', rule: '37 CFR 1.63', fix: null },
      { id: 'd3', label: 'No IDS in the packet', severity: 'warns', detail: 'No information disclosure statement is attached. That is correct only if nothing material is known. The prior-art search on this matter returned four references, none of which has been dispositioned.', rule: '37 CFR 1.56', fix: 'Disposition the four references, then either attach an IDS or record why none is material.' },
      { id: 'd4', label: 'Drawing margins and numbering', severity: 'passes', detail: 'Nine sheets compliant.', rule: '37 CFR 1.84', fix: null },
      { id: 'd5', label: 'Specification under 100 sheets', severity: 'passes', detail: '62 sheets — no application size fee.', rule: '37 CFR 1.16(s)', fix: null }
    ]
  },
  {
    id: 'f-2291r',
    docket: 'BL-2291-US',
    title: 'Response to non-final — thermal management for stacked battery modules',
    client: 'Nordhaven Energy',
    type: 'Response',
    target: '2026-10-02',
    entity: 'large',
    claims: 20,
    independent: 3,
    multipleDependent: false,
    sheets: 14,
    status: 'blocked',
    docs: [
      { name: 'Amendment and response', kind: 'Spec', pages: 11, present: true },
      { name: 'Claims, marked up', kind: 'Claims', pages: 6, present: true },
      { name: 'Supplemental IDS', kind: 'IDS', pages: 2, present: false }
    ],
    checks: [
      {
        id: 'e1', label: 'Two references not disclosed', severity: 'blocks',
        detail:
          'The prior-art search found EP 3 441 209 A1 and a J. Power Sources paper, both reading on the discontinuity limitation this response argues. Filing an argument on that limitation without disclosing them is the specific fact pattern that makes a granted patent unenforceable.',
        rule: '37 CFR 1.56',
        fix: 'Attach the supplemental IDS before filing. The EP reference is still inside its three-month free window.'
      },
      { id: 'e2', label: 'Amendment format', severity: 'passes', detail: 'Every amended claim carries a status identifier and the changes are shown with the required markings.', rule: '37 CFR 1.121(c)', fix: null },
      { id: 'e3', label: 'Filed within the statutory period', severity: 'passes', detail: 'Target is 21 days inside the unextended three-month period. No extension fee.', rule: '37 CFR 1.136(a)', fix: null },
      { id: 'e4', label: 'Claim count unchanged', severity: 'passes', detail: '20 claims, 3 independent, before and after. No additional fee on the amendment.', rule: '37 CFR 1.16(i)', fix: null }
    ]
  },
  {
    id: 'f-2110',
    docket: 'BL-2110-US',
    title: 'Gear train with compliant tooth profile',
    client: 'Wexler Dynamics',
    type: 'Non-provisional',
    target: '2026-08-28',
    entity: 'large',
    claims: 18,
    independent: 2,
    multipleDependent: false,
    sheets: 36,
    status: 'filed',
    filedOn: '2026-08-27',
    receipt: '18/884,562',
    docs: [],
    checks: []
  }
];

export function blockers(f: Filing): Check[] {
  return f.checks.filter(c => c.severity === 'blocks');
}
export function warnings(f: Filing): Check[] {
  return f.checks.filter(c => c.severity === 'warns');
}
export function passing(f: Filing): Check[] {
  return f.checks.filter(c => c.severity === 'passes');
}
export const MONEY = (n: number) => `$${n.toLocaleString()}`;
