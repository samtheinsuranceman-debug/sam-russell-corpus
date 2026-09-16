// ============================================================
// MACRO ENGINE — the money-printing layer every chained calculator can
// switch on. One deterministic path (or one sampled path per Monte Carlo
// run) of the macro variables the owner asked for:
//
//   • money supply growth (Federal Reserve printing, M2) → consumer inflation
//   • the same liquidity → hard-asset inflation (real estate, equities, crypto)
//   • loan availability and mortgage rates that loosen when money is printed
//     and tighten when it is withdrawn
//   • future taxation drifting from today's effective rate
//
// HONESTY: every number is an assumption the client can see and change.
// Presets are labelled with the period they summarise and the public source
// to verify them against (FRED series M2SL, CPIAUCSL). Nothing here is a
// forecast; it is arithmetic on stated assumptions.
// ============================================================

export type MoneyPrintingPreset = "history-1960-2025" | "decade-2010s" | "print-2020-2021" | "tightening-2022-2023" | "custom";

export type MacroAssumptions = {
  /** Calendar year of chain year 1 (for labelling only). */
  startYear: number;
  /** Consumer inflation with no printing effect, % per year. */
  baselineCpiPct: number;
  moneyPrinting: {
    enabled: boolean;
    preset: MoneyPrintingPreset;
    /** M2 growth, % per year (the assumption the preset fills in). */
    m2GrowthPct: number;
    /** Year-to-year volatility of M2 growth, % points (Monte Carlo only). */
    m2VolPct: number;
    /** Long-run M2 growth that the economy absorbs without extra inflation. */
    trendM2GrowthPct: number;
    /** Share (0–1) of excess M2 growth that shows up as consumer prices. */
    passThrough: number;
    /** Years between printing and its consumer-price effect. */
    lagYears: number;
  };
  hardAssets: {
    enabled: boolean;
    /** Extra appreciation per 1 point of excess liquidity, by asset class. */
    betaRealEstate: number;
    betaEquities: number;
    betaCrypto: number;
  };
  credit: {
    enabled: boolean;
    /** Mortgage rate with no printing effect, %. */
    baseMortgageRatePct: number;
    /** Rate change (% points) per 10 points of excess liquidity; negative = easier money lowers rates. */
    rateSensitivityPer10: number;
    /** Loan availability index floor (1 = today's underwriting). */
    availabilityFloor: number;
    availabilityCeiling: number;
  };
  futureTaxation: {
    enabled: boolean;
    /** Effective household rate in year 1, %. */
    startEffectiveRatePct: number;
    /** Drift in % points per year (positive = rising taxes). */
    driftPctPointsPerYear: number;
    /** Never model above this rate. */
    capPct: number;
  };
};

export type MacroYear = {
  year: number; // 1-based chain year
  calendarYear: number;
  m2GrowthPct: number;
  excessLiquidityPct: number; // m2Growth − trend (can be negative)
  cpiPct: number; // consumer inflation applied to household expenses
  priceLevel: number; // cumulative, 1.0 at year 0
  realEstateBoostPct: number; // added to appreciation
  equityBoostPct: number; // added to investment growth
  cryptoBoostPct: number; // added to crypto return
  mortgageRatePct: number;
  creditAvailability: number; // 1 = today's underwriting; >1 easier, <1 tighter
  effectiveTaxRatePct: number;
};

/** Period summaries of M2 growth (annual, %). Verify against FRED M2SL. */
export const M2_PRESETS: Record<Exclude<MoneyPrintingPreset, "custom">, { label: string; m2GrowthPct: number; m2VolPct: number; note: string }> = {
  "history-1960-2025": { label: "Long-run history (1960–2025)", m2GrowthPct: 7, m2VolPct: 3.5, note: "Approximate compound growth of M2 over the full record; verify on FRED series M2SL." },
  "decade-2010s": { label: "The 2010s (steady expansion)", m2GrowthPct: 6, m2VolPct: 1.5, note: "Approximate average annual M2 growth 2010–2019; verify on FRED M2SL." },
  "print-2020-2021": { label: "Pandemic printing (2020–2021)", m2GrowthPct: 18, m2VolPct: 6, note: "Approximate average of the 2020–2021 surge (about +25% then +12%); verify on FRED M2SL." },
  "tightening-2022-2023": { label: "Tightening (2022–2023)", m2GrowthPct: -2, m2VolPct: 2, note: "Approximate average while the balance sheet ran off; verify on FRED M2SL." },
};

export const MACRO_SOURCES = [
  { id: "m2", label: "Federal Reserve M2 money stock (FRED M2SL)", url: "https://fred.stlouisfed.org/series/M2SL" },
  { id: "cpi", label: "Consumer Price Index (FRED CPIAUCSL)", url: "https://fred.stlouisfed.org/series/CPIAUCSL" },
  { id: "pmms", label: "Freddie Mac 30-year mortgage rate (FRED MORTGAGE30US)", url: "https://fred.stlouisfed.org/series/MORTGAGE30US" },
] as const;

export function defaultMacro(startYear = new Date().getFullYear()): MacroAssumptions {
  return {
    startYear,
    baselineCpiPct: 2.5,
    moneyPrinting: { enabled: false, preset: "history-1960-2025", m2GrowthPct: 7, m2VolPct: 3.5, trendM2GrowthPct: 6, passThrough: 0.5, lagYears: 1 },
    hardAssets: { enabled: false, betaRealEstate: 0.6, betaEquities: 0.8, betaCrypto: 2.5 },
    credit: { enabled: false, baseMortgageRatePct: 6.5, rateSensitivityPer10: -1.5, availabilityFloor: 0.5, availabilityCeiling: 1.5 },
    futureTaxation: { enabled: false, startEffectiveRatePct: 24, driftPctPointsPerYear: 0.25, capPct: 50 },
  };
}

/** Fill the M2 numbers from a preset (custom leaves them as typed). */
export function applyPreset(a: MacroAssumptions, preset: MoneyPrintingPreset): MacroAssumptions {
  if (preset === "custom") return { ...a, moneyPrinting: { ...a.moneyPrinting, preset } };
  const p = M2_PRESETS[preset];
  return { ...a, moneyPrinting: { ...a.moneyPrinting, preset, m2GrowthPct: p.m2GrowthPct, m2VolPct: p.m2VolPct } };
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/**
 * The macro path for `years` chain years. `shock(year)` (Monte Carlo) returns a
 * standard-normal draw that perturbs that year's M2 growth by m2VolPct; omit it
 * for the deterministic path.
 */
export function macroPath(years: number, a: MacroAssumptions, shock?: (year: number) => number): MacroYear[] {
  const out: MacroYear[] = [];
  const excessByYear: number[] = [];
  let priceLevel = 1;
  for (let y = 1; y <= years; y++) {
    const mp = a.moneyPrinting;
    const m2 = mp.enabled ? mp.m2GrowthPct + (shock ? shock(y) * mp.m2VolPct : 0) : mp.trendM2GrowthPct;
    const excess = mp.enabled ? m2 - mp.trendM2GrowthPct : 0;
    excessByYear.push(excess);
    // Consumer prices respond with a lag; the pass-through applies to excess liquidity only.
    const lagged = excessByYear[y - 1 - mp.lagYears] ?? 0;
    const cpi = clamp(a.baselineCpiPct + (mp.enabled ? mp.passThrough * lagged : 0), -5, 40);
    priceLevel *= 1 + cpi / 100;

    const ha = a.hardAssets;
    const liquidity = mp.enabled && ha.enabled ? excess : 0;
    const realEstateBoost = ha.enabled ? clamp(ha.betaRealEstate * liquidity, -15, 30) : 0;
    const equityBoost = ha.enabled ? clamp(ha.betaEquities * liquidity, -20, 40) : 0;
    const cryptoBoost = ha.enabled ? clamp(ha.betaCrypto * liquidity, -60, 150) : 0;

    const cr = a.credit;
    const rate = cr.enabled ? clamp(cr.baseMortgageRatePct + cr.rateSensitivityPer10 * (excess / 10), 1.5, 18) : cr.baseMortgageRatePct;
    const availability = cr.enabled ? clamp(1 + excess / 20, cr.availabilityFloor, cr.availabilityCeiling) : 1;

    const ft = a.futureTaxation;
    const tax = ft.enabled ? clamp(ft.startEffectiveRatePct + ft.driftPctPointsPerYear * (y - 1), 0, ft.capPct) : ft.startEffectiveRatePct;

    out.push({
      year: y,
      calendarYear: a.startYear + y - 1,
      m2GrowthPct: round2(m2),
      excessLiquidityPct: round2(excess),
      cpiPct: round2(cpi),
      priceLevel: round4(priceLevel),
      realEstateBoostPct: round2(realEstateBoost),
      equityBoostPct: round2(equityBoost),
      cryptoBoostPct: round2(cryptoBoost),
      mortgageRatePct: round2(rate),
      creditAvailability: round4(availability),
      effectiveTaxRatePct: round2(tax),
    });
  }
  return out;
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const round4 = (x: number) => Math.round(x * 10_000) / 10_000;

/** Plain-language lines the report prints beside the macro toggles. */
export function macroNarrative(a: MacroAssumptions, path: MacroYear[]): string[] {
  const last = path[path.length - 1];
  const lines: string[] = [];
  if (!last) return lines;
  if (a.moneyPrinting.enabled) {
    const p = a.moneyPrinting.preset === "custom" ? "custom" : M2_PRESETS[a.moneyPrinting.preset].label;
    lines.push(`Money printing ON (${p}): M2 growth ${a.moneyPrinting.m2GrowthPct}%/yr against a ${a.moneyPrinting.trendM2GrowthPct}% trend; ${Math.round(a.moneyPrinting.passThrough * 100)}% of the excess reaches consumer prices after ${a.moneyPrinting.lagYears} year(s). Prices end ${((last.priceLevel - 1) * 100).toFixed(0)}% higher than year 0.`);
  } else lines.push(`Money printing OFF: consumer inflation held at ${a.baselineCpiPct}%/yr; prices end ${((last.priceLevel - 1) * 100).toFixed(0)}% higher than year 0.`);
  if (a.hardAssets.enabled) lines.push(`Hard-asset inflation ON: real estate +${last.realEstateBoostPct}%/yr, equities +${last.equityBoostPct}%/yr, crypto +${last.cryptoBoostPct}%/yr on top of base assumptions (from the liquidity excess).`);
  if (a.credit.enabled) lines.push(`Loan availability ON: mortgage rate ${last.mortgageRatePct}% and availability index ${last.creditAvailability.toFixed(2)} (1.00 = today's underwriting).`);
  if (a.futureTaxation.enabled) lines.push(`Future taxation ON: effective rate drifts ${a.futureTaxation.driftPctPointsPerYear > 0 ? "up" : "down"} ${Math.abs(a.futureTaxation.driftPctPointsPerYear)} points/yr, ending at ${last.effectiveTaxRatePct}%.`);
  return lines;
}
