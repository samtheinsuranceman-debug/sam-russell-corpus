/**
 * Calculator kernel.
 *
 * Every calculator on this site is a `CalcDef`: a list of typed inputs and a
 * pure `compute` that turns them into outputs, an optional chart and an
 * optional table. One runner component renders all of them, which is why the
 * whole suite behaves consistently and why each one can be tested in isolation
 * without mounting React.
 */

export type FieldType = 'money' | 'percent' | 'number' | 'years' | 'select' | 'toggle';

export interface CalcField {
  key: string;
  label: string;
  type: FieldType;
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
  options?: Array<{ value: string; label: string }>;
}

export type Tone = 'key' | 'good' | 'bad' | 'neutral';

export interface CalcOutput {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}

export type ValueFormat = 'money' | 'moneyShort' | 'percent' | 'number' | 'text';

export interface CalcChart {
  data: Array<Record<string, number>>;
  xKey: string;
  series: Array<{ key: string; label: string; color?: string }>;
  yFormat?: ValueFormat;
}

export interface CalcTable {
  columns: Array<{ key: string; label: string; format?: ValueFormat }>;
  rows: Array<Record<string, number | string>>;
  maxRows?: number;
}

export interface CalcResult {
  outputs: CalcOutput[];
  chart?: CalcChart;
  table?: CalcTable;
  notes?: string[];
}

export type CalcValues = Record<string, number | string | boolean>;

export interface CalcDef {
  id: string;
  name: string;
  category: CalcCategory;
  blurb: string;
  fields: CalcField[];
  compute: (v: CalcValues) => CalcResult;
}

export const CATEGORIES = [
  'Indexed Life',
  'Whole Life Banking',
  'Retirement',
  'Tax',
  'Debt & Mortgage',
  'Protection',
  'Estate & Legacy',
  'Business',
  'Real Estate',
  'Growth',
] as const;
export type CalcCategory = (typeof CATEGORIES)[number];

// ─── Input coercion ─────────────────────────────────────────────────────────

export const n = (v: CalcValues, k: string, fallback = 0): number => {
  const raw = v[k];
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};
export const s = (v: CalcValues, k: string, fallback = ''): string =>
  typeof v[k] === 'string' ? (v[k] as string) : fallback;
export const b = (v: CalcValues, k: string, fallback = false): boolean =>
  typeof v[k] === 'boolean' ? (v[k] as boolean) : fallback;

/** Default value map for a definition, used to seed the form. */
export function defaultsFor(def: CalcDef): CalcValues {
  const out: CalcValues = {};
  for (const f of def.fields) out[f.key] = f.default;
  return out;
}

// ─── Shared financial primitives ────────────────────────────────────────────

/** Future value of a lump sum plus a recurring annual contribution. */
export function futureValue(present: number, annualContribution: number, rate: number, years: number): number {
  const r = rate / 100;
  if (Math.abs(r) < 1e-9) return present + annualContribution * years;
  const growth = Math.pow(1 + r, years);
  return present * growth + annualContribution * ((growth - 1) / r);
}

/** Level payment that amortizes a loan. */
export function levelPayment(principal: number, annualRate: number, months: number): number {
  const i = annualRate / 100 / 12;
  if (months <= 0) return 0;
  if (Math.abs(i) < 1e-9) return principal / months;
  return (principal * i) / (1 - Math.pow(1 + i, -months));
}

export interface AmortRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

/** Amortize a loan, optionally with an extra principal payment each month. */
export function amortize(
  principal: number,
  annualRate: number,
  months: number,
  extraMonthly = 0,
  maxMonths = 1200,
): AmortRow[] {
  const i = annualRate / 100 / 12;
  const base = levelPayment(principal, annualRate, months);
  const rows: AmortRow[] = [];
  let balance = principal;
  for (let m = 1; m <= maxMonths && balance > 0.005; m++) {
    const interest = balance * i;
    let principalPart = base + extraMonthly - interest;
    if (principalPart <= 0) break; // Payment does not cover interest; never amortizes.
    if (principalPart > balance) principalPart = balance;
    balance -= principalPart;
    rows.push({ month: m, payment: interest + principalPart, interest, principal: principalPart, balance });
  }
  return rows;
}

/** Annualized (geometric) rate implied by growing `from` to `to` over `years`. */
export function cagr(from: number, to: number, years: number): number {
  if (from <= 0 || years <= 0) return 0;
  return (Math.pow(to / from, 1 / years) - 1) * 100;
}

export interface Bracket { upTo: number; rate: number }

/** Tax on an amount given a marginal bracket table. */
export function bracketTax(taxable: number, brackets: Bracket[]): number {
  let tax = 0;
  let last = 0;
  for (const br of brackets) {
    if (taxable <= last) break;
    const slice = Math.min(taxable, br.upTo) - last;
    tax += slice * (br.rate / 100);
    last = br.upTo;
  }
  return tax;
}

/** Marginal rate that applies to the next dollar. */
export function marginalRate(taxable: number, brackets: Bracket[]): number {
  for (const br of brackets) if (taxable <= br.upTo) return br.rate;
  return brackets[brackets.length - 1].rate;
}

/**
 * 2025 federal ordinary-income brackets (taxable income, after the standard
 * deduction). Rates are scheduled to change when TCJA provisions sunset, so
 * anything long-dated here is a planning estimate, not a filing position.
 */
export const FED_BRACKETS_SINGLE: Bracket[] = [
  { upTo: 11_925, rate: 10 }, { upTo: 48_475, rate: 12 }, { upTo: 103_350, rate: 22 },
  { upTo: 197_300, rate: 24 }, { upTo: 250_525, rate: 32 }, { upTo: 626_350, rate: 35 },
  { upTo: Infinity, rate: 37 },
];
export const FED_BRACKETS_MFJ: Bracket[] = [
  { upTo: 23_850, rate: 10 }, { upTo: 96_950, rate: 12 }, { upTo: 206_700, rate: 22 },
  { upTo: 394_600, rate: 24 }, { upTo: 501_050, rate: 32 }, { upTo: 751_600, rate: 35 },
  { upTo: Infinity, rate: 37 },
];
export const STANDARD_DEDUCTION = { single: 15_000, mfj: 30_000 } as const;

export const LTCG_BRACKETS_SINGLE: Bracket[] = [
  { upTo: 48_350, rate: 0 }, { upTo: 533_400, rate: 15 }, { upTo: Infinity, rate: 20 },
];
export const LTCG_BRACKETS_MFJ: Bracket[] = [
  { upTo: 96_700, rate: 0 }, { upTo: 600_050, rate: 15 }, { upTo: Infinity, rate: 20 },
];

export const filingField: CalcField = {
  key: 'filing',
  label: 'Filing status',
  type: 'select',
  default: 'mfj',
  options: [
    { value: 'mfj', label: 'Married filing jointly' },
    { value: 'single', label: 'Single' },
  ],
};

export function bracketsFor(filing: string): Bracket[] {
  return filing === 'single' ? FED_BRACKETS_SINGLE : FED_BRACKETS_MFJ;
}
export function ltcgBracketsFor(filing: string): Bracket[] {
  return filing === 'single' ? LTCG_BRACKETS_SINGLE : LTCG_BRACKETS_MFJ;
}
export function standardDeductionFor(filing: string): number {
  return filing === 'single' ? STANDARD_DEDUCTION.single : STANDARD_DEDUCTION.mfj;
}

/** Uniform Lifetime Table divisors (2022+), for RMD projections. */
export const ULT_DIVISORS: Record<number, number> = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
  81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7,
  89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4,
  97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9,
  105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5,
};
export const rmdDivisor = (age: number): number =>
  ULT_DIVISORS[Math.min(110, Math.max(73, Math.round(age)))] ?? 3.5;

// ─── Guarded entry point ──────────────────────────────────────────────────────
//
// Every calculator's `compute` is pure and trusts its inputs. The browser form
// and the fuzz harness do not: a field can arrive as a string with a dollar
// sign, as NaN from an empty input, as Infinity from a typo, or missing. This
// is the one door everything goes through, and it never throws.

const NUMERIC_TYPES: FieldType[] = ['money', 'percent', 'number', 'years'];

function fieldBounds(f: CalcField): { min: number; max: number } {
  const min = f.min ?? (f.type === 'percent' ? -100 : f.type === 'years' ? 0 : -1e12);
  const max = f.max ?? (f.type === 'percent' ? 1_000 : f.type === 'years' ? 200 : 1e12);
  return min <= max ? { min, max } : { min: max, max: min };
}

export function coerceField(f: CalcField, v: unknown): number | string | boolean {
  if (f.type === 'toggle') {
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === 1) return true;
    if (v === 'false' || v === 0) return false;
    return Boolean(f.default);
  }
  if (f.type === 'select') {
    const allowed = (f.options ?? []).map(o => o.value);
    if (typeof v === 'string' && allowed.includes(v)) return v;
    return allowed.includes(String(f.default)) ? String(f.default) : (allowed[0] ?? String(f.default));
  }
  let n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[,$%\s_]/g, '')) : Number.NaN;
  if (!Number.isFinite(n)) n = Number(f.default);
  if (!Number.isFinite(n)) n = 0;
  const { min, max } = fieldBounds(f);
  return Math.min(max, Math.max(min, n));
}

/** Only the calculator's own fields, each coerced to its type and range. */
export function coerceValues(def: CalcDef, raw: unknown): CalcValues {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: CalcValues = {};
  for (const f of def.fields) {
    const v = Object.prototype.hasOwnProperty.call(src, f.key) ? src[f.key] : undefined;
    out[f.key] = coerceField(f, v);
  }
  return out;
}

const NOT_A_NUMBER = /\b(NaN|Infinity|-Infinity|undefined|null)\b/;

function cleanNumber(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** A result with every non-finite number and every "NaN" label removed. */
export function sanitizeResult(r: CalcResult): CalcResult {
  return {
    outputs: (r.outputs ?? []).map(o => ({ ...o, value: NOT_A_NUMBER.test(o.value ?? '') ? '—' : String(o.value ?? '—') })),
    chart: r.chart
      ? { ...r.chart, data: r.chart.data.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, cleanNumber(v)]))) }
      : undefined,
    table: r.table
      ? { ...r.table, rows: r.table.rows.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'number' ? cleanNumber(v) : NOT_A_NUMBER.test(String(v)) ? '—' : v]))) }
      : undefined,
    notes: r.notes,
  };
}

/**
 * Run a calculator on untrusted values. Coerces every field, catches a
 * throwing compute, and strips anything non-finite from what comes back.
 */
export function runCalc(def: CalcDef, raw: unknown): CalcResult & { failed?: boolean } {
  const values = coerceValues(def, raw);
  try {
    return sanitizeResult(def.compute(values));
  } catch {
    return {
      outputs: [{ label: 'Result', value: '—', hint: 'These inputs could not be modelled. Adjust them and try again.', tone: 'neutral' }],
      failed: true,
    };
  }
}
