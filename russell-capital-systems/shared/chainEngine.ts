// ============================================================
// CALCULATOR CHAIN ENGINE — "list the calculators in a row".
//
// A chain is an ordered list of steps. Each step is one calculator (a module
// set of the Ultra engine) run for a chosen number of years. At the end of a
// step (or any year the client picks) a chosen percentage of that
// calculator's cash value is handed to the next calculator in the row. Every
// balance not handed off keeps carrying forward, so the row is one continuous
// plan: the report is the aggregate of all calculators running together.
//
// Two runs are offered on top:
//   • runChain            — one deterministic path under the stated assumptions
//   • runChainMonteCarlo  — 10,000 sampled paths (returns, appreciation, crypto,
//                           money printing) with percentile bands
//
// HONESTY: projections under stated, editable assumptions. Not advice, not a
// guarantee, not an illustration. The disclosure travels with every result.
// ============================================================
import {
  defaultModules,
  runUltraScenario,
  type ClientProfile,
  type Transfer,
  type TransferLedgerEntry,
  type TransferSource,
  type TransferTarget,
  type UltraModules,
  type UltraResult,
  type WindowPlan,
  type YearRow,
  type YearlyOverride,
  ULTRA_DISCLOSURE,
} from "./ultraEngine";
import { defaultMacro, macroNarrative, macroPath, type MacroAssumptions, type MacroYear } from "./macroEngine";
import { mulberry32, normal } from "./macro/random";

// ── The calculators a chain can hold ──────────────────────────────────────────
export type ChainCalculatorId =
  | "investment-growth"
  | "mortgage-killer"
  | "house-recycling"
  | "real-estate-rentals"
  | "equity-deployment"
  | "trust-iul"
  | "income-annuity"
  | "crypto"
  | "retirement-income";

export type ChainCalculatorSpec = {
  id: ChainCalculatorId;
  name: string;
  blurb: string;
  /** The balance this calculator "produces" — what a hand-off takes a share of. */
  cashValue: TransferSource;
  /** Where a hand-off INTO this calculator lands by default. */
  intake: TransferTarget;
  /** Module switches this calculator turns on (investment growth is always on). */
  modules: Array<keyof UltraModules>;
};

export const CHAIN_CALCULATORS: ChainCalculatorSpec[] = [
  { id: "investment-growth", name: "Investment Growth", blurb: "Savings compound in taxable and qualified accounts at your assumed return.", cashValue: "taxableAssets", intake: "taxableAssets", modules: ["investmentGrowth"] },
  { id: "mortgage-killer", name: "Mortgage Killer", blurb: "Surplus cash attacks the mortgage; the payoff clock restarts each cycle.", cashValue: "homeEquity", intake: "mortgagePaydown", modules: ["investmentGrowth", "mortgageKiller"] },
  { id: "house-recycling", name: "House Recycling", blurb: "Mortgage-killer cycles that add a paid-off property every 6–7 years.", cashValue: "realEstateValue", intake: "realEstateProperty", modules: ["investmentGrowth", "mortgageKiller", "realEstate"] },
  { id: "real-estate-rentals", name: "Real Estate & Rentals (ZIP-driven)", blurb: "Appreciation and rental income at the rate your ZIP's record shows for the window you choose.", cashValue: "realEstateValue", intake: "realEstateProperty", modules: ["investmentGrowth", "realEstate"] },
  { id: "equity-deployment", name: "Home Equity Deployment", blurb: "A chosen share of idle home equity goes to work, protection-first through trust-owned IUL.", cashValue: "iulCashValue", intake: "trustIUL", modules: ["investmentGrowth", "equityDeployment", "trustIUL"] },
  { id: "trust-iul", name: "Trust-Owned IUL", blurb: "Premiums build cash value; tax-free income draws begin the year you choose.", cashValue: "iulCashValue", intake: "trustIUL", modules: ["investmentGrowth", "trustIUL"] },
  { id: "income-annuity", name: "Income Annuity", blurb: "A lump sum becomes level lifetime-style income.", cashValue: "taxableAssets", intake: "incomeAnnuity", modules: ["investmentGrowth", "incomeAnnuity"] },
  { id: "crypto", name: "Crypto Allocation", blurb: "An explicit sleeve at the return and volatility you assume — no floor.", cashValue: "cryptoValue", intake: "cryptoValue", modules: ["investmentGrowth", "crypto"] },
  { id: "retirement-income", name: "Retirement Income (IUL + annuity)", blurb: "IUL income draws and annuity payout running together.", cashValue: "iulCashValue", intake: "incomeAnnuity", modules: ["investmentGrowth", "trustIUL", "incomeAnnuity"] },
];

export const CHAIN_CALCULATOR_BY_ID: Record<ChainCalculatorId, ChainCalculatorSpec> = Object.fromEntries(CHAIN_CALCULATORS.map((c) => [c.id, c])) as Record<ChainCalculatorId, ChainCalculatorSpec>;

/** Which chain calculator a portal page corresponds to (by route slug). Unlisted pages map to investment growth. */
export const PAGE_TO_CHAIN: Record<string, ChainCalculatorId> = {
  "ultra-calculator": "investment-growth",
  "mortgage-killer": "mortgage-killer", "mortgage-killer-v3": "mortgage-killer", "reverse-heloc": "equity-deployment",
  "house-recycling": "house-recycling", "real-estate-mogul": "real-estate-rentals", "zip-engine": "real-estate-rentals",
  "short-term-rentals": "real-estate-rentals", "str-strategy": "real-estate-rentals", "rental-enterprise": "real-estate-rentals",
  "household-wealth": "house-recycling", "trusts": "trust-iul", "iul-engine": "trust-iul", "iul-historical": "trust-iul",
  "iul-vs-roth": "trust-iul", "time-machine": "trust-iul", "time-machine-calculator": "trust-iul", "time-machine-method": "trust-iul",
  "time-machine-ag49": "trust-iul", "policy-loans": "trust-iul", "policy-cost-lab": "trust-iul", "premium-financing": "trust-iul",
  "tax-advantaged-growth": "trust-iul", "retirement-projection": "retirement-income", "income-for-life": "retirement-income",
  "lifetime-income": "income-annuity", "growth-annuities": "income-annuity", "myga-fixed-rate": "income-annuity", "fia-top10": "income-annuity",
  "income-annuity-top10": "income-annuity", "existing-annuities": "income-annuity", "hot-income": "income-annuity",
  "income-timeline": "retirement-income", "withdrawal-sequencing": "retirement-income", "income-gap": "retirement-income",
  "social-security": "retirement-income", "retirement-guardrails": "retirement-income", "crypto-corner": "crypto",
  "index-backtester": "investment-growth", "ibbotson-charts": "investment-growth", "index-strategies": "investment-growth",
  "tax-waterfall": "investment-growth", "roth-conversion": "investment-growth", "tax-brackets": "investment-growth", "tax-combos": "investment-growth",
  "estate-tax": "trust-iul", "estate-flow": "trust-iul", "multi-gen-wealth": "trust-iul", "inflation": "investment-growth",
  "medicare-irmaa": "retirement-income", "long-term-care": "retirement-income", "divorce-calculator": "trust-iul", "ecological-drivers": "retirement-income",
  "strategy": "investment-growth", "goals-planning": "investment-growth", "market-stress-test": "investment-growth",
};
export function chainCalculatorForPath(path: string): ChainCalculatorId {
  const slug = path.replace(/^\/portal\//, "").replace(/^\//, "").split("/")[0] ?? "";
  return PAGE_TO_CHAIN[slug] ?? "investment-growth";
}

// ── Steps ─────────────────────────────────────────────────────────────────────
export type ModuleParams = { [K in keyof UltraModules]?: Partial<UltraModules[K]> };

export type ZipWindowRates = {
  zip: string;
  fromYear: number;
  toYear: number;
  /** Compound annual home-value appreciation over the window, %. */
  appreciationPct: number | null;
  /** Compound annual rent growth over the window, % (null if the rent record is shorter). */
  rentGrowthPct: number | null;
};

export type HandoffSpec = {
  enabled: boolean;
  /** Year within the step (1 = first year); null = the step's last year. */
  atYear: number | null;
  /** Share of the calculator's cash value moved to the next calculator, 0–100. */
  pctOfCashValue: number;
  /** Where it lands; null = the next calculator's default intake. */
  target: TransferTarget | null;
};

export type ChainStep = {
  id: string;
  calculator: ChainCalculatorId;
  years: number;
  goal?: string;
  params?: ModuleParams;
  handoff: HandoffSpec;
  zip?: ZipWindowRates | null;
};

export function defaultHandoff(): HandoffSpec {
  return { enabled: true, atYear: null, pctOfCashValue: 50, target: null };
}

/** Seed used for a step id when the caller passes none, so the same call always gives the same id. */
export const CHAIN_STEP_ID_DEFAULT_SEED = 1;

export type StepIdOptions = {
  /** Seed for the id draw (mulberry32). Same seed and calculator → same id. */
  seed?: number;
  /** Ids already in the chain; the draw continues on the same seeded stream until it finds a free one. */
  taken?: Iterable<string>;
};

/** FNV-1a over the calculator id, so two calculators on the same seed draw different ids. */
function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** A step id drawn from the seeded PRNG: deterministic for a given calculator, seed and set of taken ids. */
export function stepId(calculator: ChainCalculatorId, opts: StepIdOptions = {}): string {
  const rng = mulberry32((hashString(calculator) ^ (opts.seed ?? CHAIN_STEP_ID_DEFAULT_SEED)) >>> 0);
  const taken = new Set(opts.taken ?? []);
  for (let attempt = 0; attempt < 1_000; attempt++) {
    const id = `${calculator}-${Math.floor(rng() * 36 ** 6).toString(36).padStart(6, "0")}`;
    if (!taken.has(id)) return id;
  }
  throw new Error("Could not draw a free step id.");
}

export function newStep(calculator: ChainCalculatorId, years = 10, id?: string, opts: StepIdOptions = {}): ChainStep {
  return { id: id ?? stepId(calculator, opts), calculator, years, params: {}, handoff: defaultHandoff(), zip: null };
}

/** The module set for one step: everything off except investment growth and the step's own modules, with the step's parameters applied. */
export function modulesForStep(step: ChainStep, base: UltraModules = defaultModules()): UltraModules {
  const spec = CHAIN_CALCULATOR_BY_ID[step.calculator];
  const m: UltraModules = JSON.parse(JSON.stringify(base));
  for (const key of Object.keys(m) as Array<keyof UltraModules>) (m[key] as { enabled: boolean }).enabled = false;
  for (const key of spec.modules) (m[key] as { enabled: boolean }).enabled = true;
  for (const [key, patch] of Object.entries(step.params ?? {}) as Array<[keyof UltraModules, Partial<UltraModules[keyof UltraModules]>]>) {
    if (patch) Object.assign(m[key] as object, patch);
  }
  if (step.zip && step.zip.appreciationPct != null && m.realEstate.enabled) {
    m.realEstate.appreciationPctDefault = step.zip.appreciationPct;
    m.realEstate.appreciationPctPerCycle = [];
  }
  return m;
}

/** Steps → Ultra windows, with the hand-off transfer placed inside each window. */
export function buildWindows(steps: ChainStep[], base: UltraModules = defaultModules()): WindowPlan[] {
  return steps.map((step, i) => {
    const spec = CHAIN_CALCULATOR_BY_ID[step.calculator];
    const next = steps[i + 1];
    const transfers: Transfer[] = [];
    if (step.handoff.enabled && next && step.handoff.pctOfCashValue > 0) {
      const atYear = Math.max(1, Math.min(step.years, step.handoff.atYear ?? step.years));
      const target = step.handoff.target ?? CHAIN_CALCULATOR_BY_ID[next.calculator].intake;
      transfers.push({ atYear, pct: step.handoff.pctOfCashValue, from: spec.cashValue, to: target, label: `${spec.name} → ${CHAIN_CALCULATOR_BY_ID[next.calculator].name}` });
    }
    return { years: step.years, goal: step.goal ?? spec.name, modules: modulesForStep(step, base), transfers, calculatorId: step.calculator };
  });
}

// ── Results ───────────────────────────────────────────────────────────────────
export type StepResult = {
  id: string;
  calculator: ChainCalculatorId;
  name: string;
  startYear: number;
  endYear: number;
  startNetWorth: number;
  endNetWorth: number;
  /** endNetWorth − startNetWorth: what this calculator added while it ran. */
  contribution: number;
  cashValueAtEnd: number;
  handoff: TransferLedgerEntry | null;
  passiveIncomeAtEnd: number;
  taxesPaid: number;
  rows: YearRow[];
};

export type ChainAggregate = {
  years: number;
  startNetWorth: number;
  finalNetWorth: number;
  finalNetWorthReal: number; // deflated by the macro price level
  totalTaxesPaid: number;
  totalHandedOff: number;
  finalPassiveIncome: number;
  finalPassiveIncomeReal: number;
  totalRentalIncome: number;
  totalIulIncome: number;
  totalAnnuityIncome: number;
  finalIulCashValue: number;
  finalRealEstateValue: number;
  finalCryptoValue: number;
  propertiesOwned: number;
  priceLevel: number;
  /** Sum of each step's contribution — equals finalNetWorth − startNetWorth by construction. */
  sumOfStepContributions: number;
};

export type ChainResult = {
  steps: StepResult[];
  aggregate: ChainAggregate;
  macro: MacroYear[];
  ultra: UltraResult;
  narrative: string[];
  disclosure: string;
};

const cashValueOf = (row: YearRow, src: TransferSource): number => {
  switch (src) {
    case "iulCashValue": return row.iulCashValue;
    case "taxableAssets": return row.taxableAssets;
    case "qualifiedAssets": return row.qualifiedAssets;
    case "cashReserves": return 0; // not reported per row
    case "homeEquity": return Math.max(0, row.homeValue - row.homeMortgage);
    case "realEstateValue": return row.realEstateValue;
    case "cryptoValue": return row.cryptoValue;
  }
};

/** Per-year overrides from a macro path (deterministic or sampled). */
export function macroOverrides(path: MacroYear[], macro: MacroAssumptions): (year: number) => YearlyOverride | undefined {
  return (year) => {
    const m = path[year - 1];
    if (!m) return undefined;
    const o: YearlyOverride = {};
    if (macro.moneyPrinting.enabled) o.expenseInflationPct = m.cpiPct;
    if (macro.hardAssets.enabled) { o.equityBoostPct = m.equityBoostPct; o.realEstateBoostPct = m.realEstateBoostPct; o.cryptoBoostPct = m.cryptoBoostPct; }
    if (macro.futureTaxation.enabled) o.effectiveTaxRatePct = m.effectiveTaxRatePct;
    return o;
  };
}

function summarise(profile: ClientProfile, steps: ChainStep[], ultra: UltraResult, path: MacroYear[], macro: MacroAssumptions): ChainResult {
  const stepResults: StepResult[] = ultra.windows.map((w, i) => {
    const step = steps[i];
    const spec = CHAIN_CALCULATOR_BY_ID[step.calculator];
    const prevEnd = i === 0 ? startNetWorth(profile) : ultra.windows[i - 1].ending.netWorth;
    return {
      id: step.id,
      calculator: step.calculator,
      name: spec.name,
      startYear: w.startYear,
      endYear: w.endYear,
      startNetWorth: prevEnd,
      endNetWorth: w.ending.netWorth,
      contribution: w.ending.netWorth - prevEnd,
      cashValueAtEnd: Math.round(cashValueOf(w.ending, spec.cashValue)),
      handoff: w.transfers[0] ?? null,
      passiveIncomeAtEnd: w.passiveIncomeAtEnd,
      taxesPaid: w.rows.reduce((a, r) => a + r.taxes, 0),
      rows: w.rows,
    };
  });
  const rows = ultra.windows.flatMap((w) => w.rows);
  const final = ultra.final;
  const priceLevel = path[path.length - 1]?.priceLevel ?? 1;
  const passive = final.rentalIncome + final.iulIncome + final.annuityIncome;
  const aggregate: ChainAggregate = {
    years: rows.length,
    startNetWorth: startNetWorth(profile),
    finalNetWorth: final.netWorth,
    finalNetWorthReal: Math.round(final.netWorth / priceLevel),
    totalTaxesPaid: rows.reduce((a, r) => a + r.taxes, 0),
    totalHandedOff: ultra.transfers.reduce((a, t) => a + t.amount, 0),
    finalPassiveIncome: passive,
    finalPassiveIncomeReal: Math.round(passive / priceLevel),
    totalRentalIncome: rows.reduce((a, r) => a + r.rentalIncome, 0),
    totalIulIncome: rows.reduce((a, r) => a + r.iulIncome, 0),
    totalAnnuityIncome: rows.reduce((a, r) => a + r.annuityIncome, 0),
    finalIulCashValue: final.iulCashValue,
    finalRealEstateValue: final.realEstateValue,
    finalCryptoValue: final.cryptoValue,
    propertiesOwned: final.propertiesOwned,
    priceLevel,
    sumOfStepContributions: stepResults.reduce((a, s) => a + s.contribution, 0),
  };
  const narrative = [
    `${steps.length} calculator${steps.length === 1 ? "" : "s"} in a row over ${aggregate.years} years: ${stepResults.map((s) => `${s.name} (${s.startYear}–${s.endYear})`).join(" → ")}.`,
    ...ultra.transfers.map((t) => `Year ${t.year}: ${t.pct}% of ${t.from} — $${t.amount.toLocaleString()} — handed to ${t.to}${t.label ? ` (${t.label})` : ""}.`),
    `Aggregate: net worth $${aggregate.startNetWorth.toLocaleString()} → $${aggregate.finalNetWorth.toLocaleString()} (${aggregate.priceLevel > 1 ? `$${aggregate.finalNetWorthReal.toLocaleString()} in today's dollars` : "no price-level adjustment"}); passive income at the end $${aggregate.finalPassiveIncome.toLocaleString()}/yr; taxes paid over the run $${aggregate.totalTaxesPaid.toLocaleString()}.`,
    ...macroNarrative(macro, path),
  ];
  return { steps: stepResults, aggregate, macro: path, ultra, narrative, disclosure: ULTRA_DISCLOSURE };
}

export function startNetWorth(p: ClientProfile): number {
  const debt = p.home.mortgageBalance + p.otherDebts.reduce((a, d) => a + Math.max(0, d.balance), 0);
  return Math.round(p.taxableAssets + p.qualifiedAssets + p.cashReserves + p.home.value - debt);
}

/** One deterministic path. */
export function runChain(profile: ClientProfile, steps: ChainStep[], macro: MacroAssumptions = defaultMacro(), base: UltraModules = defaultModules()): ChainResult {
  if (!steps.length) throw new Error("A chain needs at least one calculator.");
  const years = steps.reduce((a, s) => a + s.years, 0);
  const path = macroPath(years, macro);
  const ultra = runUltraScenario(profile, base, buildWindows(steps, base), { yearly: macroOverrides(path, macro) });
  return summarise(profile, steps, ultra, path, macro);
}

// ── Monte Carlo over the whole chain ──────────────────────────────────────────
export type ChainMonteCarloOptions = {
  simulations?: number; // default 10,000
  seed?: number;
  /** Annual volatility assumptions, % points. */
  investmentVolPct?: number; // default 15
  appreciationVolPct?: number; // default 6
  /** Keep this many full paths for charts. */
  samplePaths?: number;
};

export type Band = { year: number; p5: number; p10: number; p25: number; p50: number; p75: number; p90: number; p95: number; mean: number };

export type ChainMonteCarloResult = {
  simulations: number;
  seed: number;
  years: number;
  netWorth: Band[];
  passiveIncome: Band[];
  final: {
    netWorth: { p5: number; p10: number; p25: number; p50: number; p75: number; p90: number; p95: number; mean: number; worst: number; best: number };
    passiveIncome: { p10: number; p50: number; p90: number; mean: number };
    probabilityNetWorthAboveStart: number; // %
    probabilityNetWorthDoubles: number; // %
    probabilityPassiveIncomeCoversExpenses: number; // %
  };
  deterministic: ChainAggregate;
  samplePaths: number[][];
  elapsedMs: number;
  disclosure: string;
};

// Seeded PRNG (Mulberry32) and normal draw (Box–Muller) come from ./macro/random, shared with the macro engines.

function percentile(sorted: Float64Array, q: number): number {
  const n = sorted.length;
  if (!n) return 0;
  const idx = Math.min(n - 1, Math.max(0, Math.floor(q * (n - 1))));
  return Math.round(sorted[idx]);
}
function bandFrom(values: Float64Array, year: number): Band {
  const s = Float64Array.from(values).sort();
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s[i];
  return { year, p5: percentile(s, 0.05), p10: percentile(s, 0.1), p25: percentile(s, 0.25), p50: percentile(s, 0.5), p75: percentile(s, 0.75), p90: percentile(s, 0.9), p95: percentile(s, 0.95), mean: Math.round(sum / s.length) };
}

export function runChainMonteCarlo(profile: ClientProfile, steps: ChainStep[], macro: MacroAssumptions = defaultMacro(), opts: ChainMonteCarloOptions = {}, base: UltraModules = defaultModules()): ChainMonteCarloResult {
  if (!steps.length) throw new Error("A chain needs at least one calculator.");
  const simulations = Math.max(1, Math.min(50_000, Math.floor(opts.simulations ?? 10_000)));
  const seed = opts.seed ?? 42;
  const investmentVol = opts.investmentVolPct ?? 15;
  const apprVol = opts.appreciationVolPct ?? 6;
  const keep = Math.max(0, Math.min(50, opts.samplePaths ?? 20));
  const t0 = Date.now();

  const windows = buildWindows(steps, base);
  const years = windows.reduce((a, w) => a + w.years, 0);
  // Which window each global year belongs to, so sampled returns centre on that step's assumptions.
  const windowOfYear: number[] = [];
  windows.forEach((w, i) => { for (let y = 0; y < w.years; y++) windowOfYear.push(i); });

  const rng = mulberry32(seed);
  const nw = Array.from({ length: years }, () => new Float64Array(simulations));
  const pi = Array.from({ length: years }, () => new Float64Array(simulations));
  const samplePaths: number[][] = [];
  const startNW = startNetWorth(profile);
  let aboveStart = 0, doubled = 0, covers = 0;

  for (let sim = 0; sim < simulations; sim++) {
    // One sampled macro path per simulation (money-printing shocks), then per-year market draws.
    const path = macroPath(years, macro, macro.moneyPrinting.enabled ? () => normal(rng) : undefined);
    const macroYear = macroOverrides(path, macro);
    const draws = new Float64Array(years * 3);
    for (let i = 0; i < draws.length; i++) draws[i] = normal(rng);
    const yearly = (year: number): YearlyOverride => {
      const o: YearlyOverride = { ...(macroYear(year) ?? {}) };
      const w = windows[windowOfYear[year - 1]];
      const m = w.modules!;
      const k = (year - 1) * 3;
      o.investmentGrowthPct = m.investmentGrowth.growthPct + investmentVol * draws[k];
      if (m.realEstate.enabled) o.appreciationPct = m.realEstate.appreciationPctDefault + apprVol * draws[k + 1];
      if (m.crypto.enabled) o.cryptoReturnPct = m.crypto.expectedReturnPct + m.crypto.volatilityPct * draws[k + 2];
      return o;
    };
    const res = runUltraScenario(profile, base, windows, { yearly });
    const rows = res.windows.flatMap((w) => w.rows);
    for (let y = 0; y < years; y++) {
      const r = rows[y];
      nw[y][sim] = r.netWorth;
      pi[y][sim] = r.rentalIncome + r.iulIncome + r.annuityIncome;
    }
    const last = rows[years - 1];
    if (last.netWorth > startNW) aboveStart++;
    if (last.netWorth > 2 * startNW) doubled++;
    if (last.rentalIncome + last.iulIncome + last.annuityIncome >= last.expenses) covers++;
    if (sim < keep) samplePaths.push(rows.map((r) => r.netWorth));
  }

  const netWorthBands = nw.map((v, y) => bandFrom(v, y + 1));
  const passiveBands = pi.map((v, y) => bandFrom(v, y + 1));
  const finalSorted = Float64Array.from(nw[years - 1]).sort();
  const fb = netWorthBands[years - 1];
  const pb = passiveBands[years - 1];
  const deterministic = runChain(profile, steps, macro, base).aggregate;
  return {
    simulations,
    seed,
    years,
    netWorth: netWorthBands,
    passiveIncome: passiveBands,
    final: {
      netWorth: { p5: fb.p5, p10: fb.p10, p25: fb.p25, p50: fb.p50, p75: fb.p75, p90: fb.p90, p95: fb.p95, mean: fb.mean, worst: Math.round(finalSorted[0]), best: Math.round(finalSorted[finalSorted.length - 1]) },
      passiveIncome: { p10: pb.p10, p50: pb.p50, p90: pb.p90, mean: pb.mean },
      probabilityNetWorthAboveStart: Math.round((aboveStart / simulations) * 1000) / 10,
      probabilityNetWorthDoubles: Math.round((doubled / simulations) * 1000) / 10,
      probabilityPassiveIncomeCoversExpenses: Math.round((covers / simulations) * 1000) / 10,
    },
    deterministic,
    samplePaths,
    elapsedMs: Date.now() - t0,
    disclosure: ULTRA_DISCLOSURE,
  };
}

// ── Profile helpers ───────────────────────────────────────────────────────────
/** A profile from the ~50-field client fact finder the portal already shares (null/undefined fields become 0). */
export function profileFromClientData(d: Partial<{
  age: number; spouseAge: number; annualIncome: number; spouseIncome: number; pensionIncome: number; monthlyExpenses: number;
  cashSavings: number; taxableInvestments: number; homeValue: number; iraBalance: number; rothBalance: number; k401Balance: number;
  mortgageBalance: number; mortgageRate: number; mortgageYearsLeft: number; otherDebt: number;
}> | null | undefined, fallback: ClientProfile = defaultProfile()): ClientProfile {
  if (!d) return fallback;
  const n = (v: unknown, dflt: number) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : dflt);
  const mortgage = n(d.mortgageBalance, fallback.home.mortgageBalance);
  const rate = n(d.mortgageRate, fallback.home.mortgageRatePct);
  const yearsLeft = n(d.mortgageYearsLeft, 25);
  const r = rate / 100 / 12, k = yearsLeft * 12;
  const monthly = mortgage > 0 && r > 0 ? (mortgage * r) / (1 - Math.pow(1 + r, -k)) : mortgage > 0 ? mortgage / k : 0;
  return {
    clientAge: n(d.age, fallback.clientAge),
    spouseAge: n(d.spouseAge, 0) || null,
    incomeSelfAnnual: n(d.annualIncome, fallback.incomeSelfAnnual),
    incomeSpouseAnnual: n(d.spouseIncome, 0),
    otherIncomeAnnual: n(d.pensionIncome, 0),
    incomeGrowthPct: fallback.incomeGrowthPct,
    baseHouseholdExpensesAnnual: n(d.monthlyExpenses, 0) ? n(d.monthlyExpenses, 0) * 12 : fallback.baseHouseholdExpensesAnnual,
    expenseChanges: [],
    effectiveTaxRatePct: fallback.effectiveTaxRatePct,
    taxableAssets: n(d.taxableInvestments, fallback.taxableAssets),
    qualifiedAssets: n(d.iraBalance, 0) + n(d.rothBalance, 0) + n(d.k401Balance, 0) || fallback.qualifiedAssets,
    cashReserves: n(d.cashSavings, fallback.cashReserves),
    home: { value: n(d.homeValue, fallback.home.value), mortgageBalance: mortgage, mortgageRatePct: rate, mortgagePaymentAnnual: Math.round(monthly * 12) },
    otherDebts: n(d.otherDebt, 0) ? [{ name: "Other debt", balance: n(d.otherDebt, 0), ratePct: 8, paymentAnnual: Math.round(n(d.otherDebt, 0) * 0.2) }] : [],
  };
}

export function defaultProfile(): ClientProfile {
  return {
    clientAge: 45,
    spouseAge: null,
    incomeSelfAnnual: 350_000,
    incomeSpouseAnnual: 0,
    otherIncomeAnnual: 0,
    incomeGrowthPct: 3,
    baseHouseholdExpensesAnnual: 150_000,
    expenseChanges: [],
    effectiveTaxRatePct: 32,
    taxableAssets: 200_000,
    qualifiedAssets: 400_000,
    cashReserves: 60_000,
    home: { value: 800_000, mortgageBalance: 500_000, mortgageRatePct: 6.5, mortgagePaymentAnnual: 38_000 },
    otherDebts: [{ name: "Student loans", balance: 120_000, ratePct: 6, paymentAnnual: 15_000 }],
  };
}

/** The default row a new client sees: the owner's recycle-then-protect sequence. */
export function defaultChain(): ChainStep[] {
  return [
    { ...newStep("mortgage-killer", 7, "step-1"), goal: "Kill the mortgage", params: { mortgageKiller: { extraPrincipalPctOfNetCash: 50 } }, handoff: { enabled: true, atYear: null, pctOfCashValue: 40, target: null } },
    { ...newStep("equity-deployment", 8, "step-2"), goal: "Put the equity to work through trust-owned IUL", params: { equityDeployment: { pctOfHomeEquityDeployed: 50 }, trustIUL: { premiumAnnual: 30_000, premiumYears: 5, incomeStartYear: 99 } }, handoff: { enabled: true, atYear: null, pctOfCashValue: 30, target: null } },
    { ...newStep("real-estate-rentals", 8, "step-3"), goal: "Buy income property with the hand-off", params: { realEstate: { rentalMode: "ltr", ltrNetYieldPctOfValue: 5 } }, handoff: { enabled: true, atYear: null, pctOfCashValue: 25, target: null } },
    { ...newStep("retirement-income", 7, "step-4"), goal: "Turn it into income", params: { incomeAnnuity: { premium: 0, startYear: 1, payoutRatePct: 6 }, trustIUL: { premiumAnnual: 0, premiumYears: 0, incomeStartYear: 1, incomeRatePct: 4 } }, handoff: { enabled: false, atYear: null, pctOfCashValue: 0, target: null } },
  ];
}
