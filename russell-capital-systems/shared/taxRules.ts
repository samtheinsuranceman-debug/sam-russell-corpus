// ============================================================
// VERSIONED TAX RULES — the federal figures every calculator should read
// from, one rule set per tax year, each with its source. When a new revenue
// procedure or an act of Congress lands, add a rule set; the platform can
// then recompute every client's picture and record what changed on the
// Plan Ledger ("rules" events). Nothing here is estimated: every number is
// the published figure, and fields the source did not publish are null.
// ============================================================

export type FilingKey = "single" | "joint" | "hoh" | "separate";
export const FILING_KEYS: FilingKey[] = ["single", "joint", "hoh", "separate"];

export type Bracket = { upTo: number | null; rate: number };

export type TaxRuleSet = {
  version: string;
  taxYear: number;
  source: string;
  effectiveFrom: string; // ISO date the figures took effect
  brackets: Record<FilingKey, Bracket[]>;
  standardDeduction: Record<FilingKey, number>;
  /** extra standard deduction per qualifying person (65+ or blind) */
  additionalStandardDeduction: { singleOrHoh: number; marriedPerSpouse: number };
  retirement: {
    deferral401k: number;
    catchUp50: number;
    catchUp60to63: number;
    ira: number;
    iraCatchUp: number;
    simple: number;
  };
  estateBasicExclusion: number;
  salt: {
    cap: number;
    phaseDownStartMagi: number;
    phaseDownRate: number;
    floor: number;
    separateCap: number;
    separatePhaseDownStartMagi: number;
    separateFloor: number;
  };
  amt: { exemption: Record<"single" | "joint", number>; phaseOutStart: Record<"single" | "joint", number> } | null;
  niit: { rate: number; threshold: Record<FilingKey, number> };
};

const SEVEN = (t: number[]): Bracket[] => [
  { upTo: t[0]!, rate: 0.10 }, { upTo: t[1]!, rate: 0.12 }, { upTo: t[2]!, rate: 0.22 }, { upTo: t[3]!, rate: 0.24 },
  { upTo: t[4]!, rate: 0.32 }, { upTo: t[5]!, rate: 0.35 }, { upTo: null, rate: 0.37 },
];

// Net investment income tax thresholds are statutory and not indexed (IRC §1411).
const NIIT = { rate: 0.038, threshold: { single: 200_000, hoh: 200_000, joint: 250_000, separate: 125_000 } };

export const TAX_RULES_2025: TaxRuleSet = {
  version: "2025.rp-24-40+obbba",
  taxYear: 2025,
  source: "Rev. Proc. 2024-40 (brackets); One Big Beautiful Bill Act, P.L. 119-21 (standard deduction, SALT, estate); IRS Notice 2024-80 (retirement limits)",
  effectiveFrom: "2025-01-01",
  brackets: {
    single: SEVEN([11_925, 48_475, 103_350, 197_300, 250_525, 626_350]),
    joint: SEVEN([23_850, 96_950, 206_700, 394_600, 501_050, 751_600]),
    hoh: SEVEN([17_000, 64_850, 103_350, 197_300, 250_500, 626_350]),
    separate: SEVEN([11_925, 48_475, 103_350, 197_300, 250_525, 375_800]),
  },
  standardDeduction: { single: 15_750, joint: 31_500, hoh: 23_625, separate: 15_750 },
  additionalStandardDeduction: { singleOrHoh: 2_000, marriedPerSpouse: 1_600 },
  retirement: { deferral401k: 23_500, catchUp50: 7_500, catchUp60to63: 11_250, ira: 7_000, iraCatchUp: 1_000, simple: 16_500 },
  estateBasicExclusion: 13_990_000,
  salt: { cap: 40_000, phaseDownStartMagi: 500_000, phaseDownRate: 0.30, floor: 10_000, separateCap: 20_000, separatePhaseDownStartMagi: 250_000, separateFloor: 5_000 },
  amt: null,
  niit: NIIT,
};

export const TAX_RULES_2026: TaxRuleSet = {
  version: "2026.rp-25-32",
  taxYear: 2026,
  source: "Rev. Proc. 2025-32 (brackets, standard deduction, AMT, estate); IRS Notice 2025-67 (retirement limits); OBBBA §70120 (SALT, indexed)",
  effectiveFrom: "2026-01-01",
  brackets: {
    single: SEVEN([12_400, 50_400, 105_700, 201_775, 256_225, 640_600]),
    joint: SEVEN([24_800, 100_800, 211_400, 403_550, 512_450, 768_700]),
    hoh: SEVEN([17_700, 67_450, 105_700, 201_750, 256_200, 640_600]),
    separate: SEVEN([12_400, 50_400, 105_700, 201_775, 256_225, 384_350]),
  },
  standardDeduction: { single: 16_100, joint: 32_200, hoh: 24_150, separate: 16_100 },
  additionalStandardDeduction: { singleOrHoh: 2_050, marriedPerSpouse: 1_650 },
  retirement: { deferral401k: 24_500, catchUp50: 8_000, catchUp60to63: 11_250, ira: 7_500, iraCatchUp: 1_100, simple: 17_000 },
  estateBasicExclusion: 15_000_000,
  salt: { cap: 40_400, phaseDownStartMagi: 505_000, phaseDownRate: 0.30, floor: 10_000, separateCap: 20_200, separatePhaseDownStartMagi: 252_500, separateFloor: 5_000 },
  amt: { exemption: { single: 90_100, joint: 140_200 }, phaseOutStart: { single: 500_000, joint: 1_000_000 } },
  niit: NIIT,
};

export const TAX_RULE_VERSIONS: TaxRuleSet[] = [TAX_RULES_2025, TAX_RULES_2026];

export function rulesForYear(taxYear: number): TaxRuleSet {
  const exact = TAX_RULE_VERSIONS.find((r) => r.taxYear === taxYear);
  if (exact) return exact;
  const earlier = TAX_RULE_VERSIONS.filter((r) => r.taxYear < taxYear).sort((a, b) => b.taxYear - a.taxYear)[0];
  return earlier ?? TAX_RULE_VERSIONS[0]!;
}
export function currentRules(now: Date = new Date()): TaxRuleSet { return rulesForYear(now.getFullYear()); }
export function rulesByVersion(version: string): TaxRuleSet | null { return TAX_RULE_VERSIONS.find((r) => r.version === version) ?? null; }

/** Map the Financial Assessment's filing-status wording to a rule key. */
export function filingKeyFromLabel(label: unknown): FilingKey {
  const s = String(label ?? "").toLowerCase();
  if (s.includes("jointly") || s.includes("surviving")) return "joint";
  if (s.includes("separately")) return "separate";
  if (s.includes("head")) return "hoh";
  return "single";
}

export type BracketLine = { rate: number; from: number; to: number | null; taxable: number; tax: number };

export function federalTax(taxableIncome: number, filing: FilingKey, rules: TaxRuleSet): { tax: number; marginalRate: number; effectiveRate: number; lines: BracketLine[] } {
  const ti = Math.max(0, taxableIncome);
  let from = 0, tax = 0, marginal = 0.10;
  const lines: BracketLine[] = [];
  for (const b of rules.brackets[filing]) {
    const to = b.upTo;
    const slice = Math.max(0, Math.min(ti, to ?? Infinity) - from);
    if (slice > 0) { tax += slice * b.rate; marginal = b.rate; lines.push({ rate: b.rate, from, to, taxable: slice, tax: slice * b.rate }); }
    if (to == null || ti <= to) break;
    from = to;
  }
  return { tax: round2(tax), marginalRate: ti > 0 ? marginal : 0.10, effectiveRate: ti > 0 ? round4(tax / ti) : 0, lines };
}

export function standardDeduction(filing: FilingKey, rules: TaxRuleSet, opts: { age65Count?: number } = {}): number {
  const base = rules.standardDeduction[filing];
  const per = filing === "joint" || filing === "separate" ? rules.additionalStandardDeduction.marriedPerSpouse : rules.additionalStandardDeduction.singleOrHoh;
  return base + per * Math.max(0, Math.min(2, opts.age65Count ?? 0));
}

/** The SALT deduction actually allowed after the cap and the MAGI phase-down (OBBBA §70120). */
export function saltAllowed(saltPaid: number, magi: number, filing: FilingKey, rules: TaxRuleSet): number {
  const s = rules.salt;
  const sep = filing === "separate";
  const cap = sep ? s.separateCap : s.cap;
  const start = sep ? s.separatePhaseDownStartMagi : s.phaseDownStartMagi;
  const floor = sep ? s.separateFloor : s.floor;
  const reduced = Math.max(floor, cap - s.phaseDownRate * Math.max(0, magi - start));
  return round2(Math.min(Math.max(0, saltPaid), reduced));
}

export function retirementLimits(age: number | null | undefined, rules: TaxRuleSet): { deferral401k: number; catchUp: number; total401k: number; ira: number; iraCatchUp: number; iraTotal: number } {
  const r = rules.retirement;
  const a = age ?? 0;
  const catchUp = a >= 60 && a <= 63 ? r.catchUp60to63 : a >= 50 ? r.catchUp50 : 0;
  const iraCatchUp = a >= 50 ? r.iraCatchUp : 0;
  return { deferral401k: r.deferral401k, catchUp, total401k: r.deferral401k + catchUp, ira: r.ira, iraCatchUp, iraTotal: r.ira + iraCatchUp };
}

export type TaxFacts = {
  filing: FilingKey;
  /** adjusted gross income for the year */
  agi: number;
  /** itemized deductions before the SALT cap (the SALT portion is passed separately) */
  itemizedOtherThanSalt?: number | null;
  saltPaid?: number | null;
  age?: number | null;
  spouseAge?: number | null;
  /** net investment income, for the NIIT flag */
  netInvestmentIncome?: number | null;
};

export type TaxPicture = {
  rulesVersion: string;
  taxYear: number;
  filing: FilingKey;
  agi: number;
  deductionMethod: "standard" | "itemized";
  deduction: number;
  saltAllowed: number;
  taxableIncome: number;
  federalTax: number;
  marginalRate: number;
  effectiveRateOnAgi: number;
  niitEstimate: number;
  retirement: ReturnType<typeof retirementLimits>;
  estateBasicExclusion: number;
  lines: BracketLine[];
};

/** A directional federal picture from AGI: which deduction wins, the bracket, the tax, the limits that apply. */
export function computeTaxPicture(f: TaxFacts, rules: TaxRuleSet): TaxPicture {
  const age65 = (f.age != null && f.age >= 65 ? 1 : 0) + (f.filing === "joint" && f.spouseAge != null && f.spouseAge >= 65 ? 1 : 0);
  const std = standardDeduction(f.filing, rules, { age65Count: age65 });
  const salt = saltAllowed(f.saltPaid ?? 0, f.agi, f.filing, rules);
  const itemized = Math.max(0, f.itemizedOtherThanSalt ?? 0) + salt;
  const useItemized = itemized > std;
  const deduction = useItemized ? itemized : std;
  const taxable = Math.max(0, f.agi - deduction);
  const ft = federalTax(taxable, f.filing, rules);
  const niiBase = Math.max(0, f.netInvestmentIncome ?? 0);
  const niitEstimate = round2(rules.niit.rate * Math.min(niiBase, Math.max(0, f.agi - rules.niit.threshold[f.filing])));
  return {
    rulesVersion: rules.version, taxYear: rules.taxYear, filing: f.filing, agi: f.agi,
    deductionMethod: useItemized ? "itemized" : "standard", deduction, saltAllowed: salt, taxableIncome: taxable,
    federalTax: ft.tax, marginalRate: ft.marginalRate, effectiveRateOnAgi: f.agi > 0 ? round4(ft.tax / f.agi) : 0,
    niitEstimate, retirement: retirementLimits(f.age, rules), estateBasicExclusion: rules.estateBasicExclusion, lines: ft.lines,
  };
}

export type RuleChange = { field: string; from: number | null; to: number | null };

function flatten(r: TaxRuleSet): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const k of FILING_KEYS) {
    r.brackets[k].forEach((b, i) => { out[`brackets.${k}.${Math.round(b.rate * 100)}%.upTo`] = b.upTo; });
    out[`standardDeduction.${k}`] = r.standardDeduction[k];
    out[`niit.threshold.${k}`] = r.niit.threshold[k];
  }
  out["additionalStandardDeduction.singleOrHoh"] = r.additionalStandardDeduction.singleOrHoh;
  out["additionalStandardDeduction.marriedPerSpouse"] = r.additionalStandardDeduction.marriedPerSpouse;
  for (const [k, v] of Object.entries(r.retirement)) out[`retirement.${k}`] = v;
  out["estateBasicExclusion"] = r.estateBasicExclusion;
  for (const [k, v] of Object.entries(r.salt)) out[`salt.${k}`] = v;
  out["amt.exemption.single"] = r.amt?.exemption.single ?? null;
  out["amt.exemption.joint"] = r.amt?.exemption.joint ?? null;
  return out;
}

/** Every published figure that differs between two rule sets. */
export function diffRuleSets(a: TaxRuleSet, b: TaxRuleSet): RuleChange[] {
  const fa = flatten(a), fb = flatten(b);
  const keys = Array.from(new Set([...Object.keys(fa), ...Object.keys(fb)]));
  return keys.filter((k) => (fa[k] ?? null) !== (fb[k] ?? null)).map((k) => ({ field: k, from: fa[k] ?? null, to: fb[k] ?? null }));
}

export type Recompute = { from: TaxPicture; to: TaxPicture; federalTaxDelta: number; deductionDelta: number; changes: RuleChange[]; summary: string };

/** What the new rule set does to this client, versus the old one, on the same facts. */
export function recomputeUnderRules(f: TaxFacts, from: TaxRuleSet, to: TaxRuleSet): Recompute {
  const a = computeTaxPicture(f, from), b = computeTaxPicture(f, to);
  const delta = round2(b.federalTax - a.federalTax);
  const money = (n: number) => Math.abs(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const summary = `Rules ${from.version} → ${to.version}: federal tax ${delta === 0 ? "unchanged" : delta < 0 ? `down ${money(delta)}` : `up ${money(delta)}`} on the same facts; ` +
    `deduction ${a.deductionMethod} ${money(a.deduction)} → ${b.deductionMethod} ${money(b.deduction)}; marginal rate ${Math.round(a.marginalRate * 100)}% → ${Math.round(b.marginalRate * 100)}%.`;
  return { from: a, to: b, federalTaxDelta: delta, deductionDelta: round2(b.deduction - a.deduction), changes: diffRuleSets(from, to), summary };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
function round4(n: number): number { return Math.round(n * 10_000) / 10_000; }
