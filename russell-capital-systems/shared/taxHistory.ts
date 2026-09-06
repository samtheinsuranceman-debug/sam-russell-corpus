// ============================================================
// TAX HISTORY — the published record the erosion engine learns from.
// Statutory rates by year, with sources. Nothing here is estimated: where a
// year's figure is not verified it is null and the statistics skip it.
//   - Top marginal federal individual income tax rate, 1913–2026
//     (Tax Foundation, "Historical U.S. Federal Individual Income Tax Rates
//     & Brackets"; IRS SOI; 2026 per OBBBA making the 37% rate permanent)
//   - Top federal corporate income tax rate, 1950–2026 (Tax Foundation; IRS)
//   - Maximum statutory rate on long-term capital gains, selected eras
//     (Treasury Office of Tax Analysis; Tax Foundation) — 1968–1978 left null
//     (phase-in years with the add-on minimum tax; see the OTA table)
//   - Federal estate tax basic exclusion, 1987–2026 (IRS)
// ============================================================

export type YearValue = { year: number; value: number | null };

function span(from: number, to: number, value: number | null): YearValue[] {
  const out: YearValue[] = [];
  for (let y = from; y <= to; y += 1) out.push({ year: y, value });
  return out;
}

export const TOP_MARGINAL_RATE: YearValue[] = [
  ...span(1913, 1915, 7), { year: 1916, value: 15 }, { year: 1917, value: 67 }, { year: 1918, value: 77 },
  ...span(1919, 1921, 73), { year: 1922, value: 58 }, { year: 1923, value: 43.5 }, { year: 1924, value: 46 },
  ...span(1925, 1928, 25), { year: 1929, value: 24 }, ...span(1930, 1931, 25), ...span(1932, 1935, 63),
  ...span(1936, 1939, 79), { year: 1940, value: 81.1 }, { year: 1941, value: 81 }, ...span(1942, 1943, 88),
  ...span(1944, 1945, 94), ...span(1946, 1947, 86.45), ...span(1948, 1949, 82.13), { year: 1950, value: 84.36 },
  { year: 1951, value: 91 }, ...span(1952, 1953, 92), ...span(1954, 1963, 91), { year: 1964, value: 77 },
  ...span(1965, 1981, 70), ...span(1982, 1986, 50), { year: 1987, value: 38.5 }, ...span(1988, 1990, 28),
  ...span(1991, 1992, 31), ...span(1993, 2000, 39.6), { year: 2001, value: 39.1 }, { year: 2002, value: 38.6 },
  ...span(2003, 2012, 35), ...span(2013, 2017, 39.6), ...span(2018, 2026, 37),
];

export const TOP_CORPORATE_RATE: YearValue[] = [
  { year: 1950, value: 42 }, { year: 1951, value: 50.75 }, ...span(1952, 1963, 52), { year: 1964, value: 50 },
  ...span(1965, 1967, 48), ...span(1968, 1969, 52.8), { year: 1970, value: 49.2 }, ...span(1971, 1978, 48),
  ...span(1979, 1986, 46), { year: 1987, value: 40 }, ...span(1988, 1992, 34), ...span(1993, 2017, 35), ...span(2018, 2026, 21),
];

export const MAX_LTCG_RATE: YearValue[] = [
  ...span(1954, 1967, 25), ...span(1968, 1978, null), ...span(1979, 1981, 28), ...span(1982, 1986, 20),
  ...span(1987, 1996, 28), ...span(1997, 2002, 20), ...span(2003, 2012, 15), ...span(2013, 2026, 20),
];

export const ESTATE_EXCLUSION: YearValue[] = [
  ...span(1987, 1997, 600_000), { year: 1998, value: 625_000 }, { year: 1999, value: 650_000 }, ...span(2000, 2001, 675_000),
  ...span(2002, 2003, 1_000_000), ...span(2004, 2005, 1_500_000), ...span(2006, 2008, 2_000_000), { year: 2009, value: 3_500_000 },
  { year: 2010, value: 5_000_000 }, { year: 2011, value: 5_000_000 }, { year: 2012, value: 5_120_000 }, { year: 2013, value: 5_250_000 },
  { year: 2014, value: 5_340_000 }, { year: 2015, value: 5_430_000 }, { year: 2016, value: 5_450_000 }, { year: 2017, value: 5_490_000 },
  { year: 2018, value: 11_180_000 }, { year: 2019, value: 11_400_000 }, { year: 2020, value: 11_580_000 }, { year: 2021, value: 11_700_000 },
  { year: 2022, value: 12_060_000 }, { year: 2023, value: 12_920_000 }, { year: 2024, value: 13_610_000 }, { year: 2025, value: 13_990_000 }, { year: 2026, value: 15_000_000 },
];

export const TAX_HISTORY_SOURCES = [
  "Tax Foundation, Historical U.S. Federal Individual Income Tax Rates & Brackets, 1862–2021; IRS Statistics of Income; P.L. 119-21 (2026)",
  "Tax Foundation / IRS, Federal Corporate Income Tax Rates, 1909–present",
  "U.S. Treasury Office of Tax Analysis, Taxes Paid on Capital Gains for Returns with Positive Net Capital Gains (maximum statutory rate)",
  "IRS, Estate Tax basic exclusion amounts by year of death; Rev. Proc. 2025-32 for 2026",
];

export type WindowStats = {
  horizonYears: number;
  windows: number;
  pUp: number;
  pDown: number;
  pFlat: number;
  meanChange: number;
  meanAbsChange: number;
  /** mean of |end/start − 1|: the typical size of a move relative to where the rate stood, regime-neutral */
  meanAbsRelChange: number;
  stdevChange: number;
  largestRise: number;
  largestFall: number;
};

export function valueAt(series: YearValue[], year: number): number | null {
  return series.find((p) => p.year === year)?.value ?? null;
}

/**
 * The empirical record of what happens to a series over `h` years, taken from
 * every start year in [from, lastYear - h]. This is the base rate the engine
 * blends with the forecasters' consensus — no assumption, just the history.
 */
export function windowStats(series: YearValue[], h: number, from = 1946): WindowStats {
  const last = series[series.length - 1]?.year ?? from;
  const changes: number[] = [], rel: number[] = [];
  for (let y = from; y + h <= last; y += 1) {
    const a = valueAt(series, y), b = valueAt(series, y + h);
    if (a == null || b == null) continue;
    changes.push(b - a);
    if (a !== 0) rel.push(Math.abs(b / a - 1));
  }
  const n = changes.length;
  if (!n) return { horizonYears: h, windows: 0, pUp: 0, pDown: 0, pFlat: 0, meanChange: 0, meanAbsChange: 0, meanAbsRelChange: 0, stdevChange: 0, largestRise: 0, largestFall: 0 };
  const up = changes.filter((c) => c > 0).length, down = changes.filter((c) => c < 0).length;
  const mean = changes.reduce((s, c) => s + c, 0) / n;
  const meanAbs = changes.reduce((s, c) => s + Math.abs(c), 0) / n;
  const stdev = Math.sqrt(changes.reduce((s, c) => s + (c - mean) ** 2, 0) / n);
  return {
    horizonYears: h, windows: n, pUp: round(up / n), pDown: round(down / n), pFlat: round((n - up - down) / n),
    meanChange: round(mean), meanAbsChange: round(meanAbs), meanAbsRelChange: round(rel.length ? rel.reduce((s, c) => s + c, 0) / rel.length : 0), stdevChange: round(stdev), largestRise: round(Math.max(...changes)), largestFall: round(Math.min(...changes)),
  };
}

/** Every year the series changed, with the size of the move — the "events" a client can read. */
export function changeEvents(series: YearValue[], from = 1913): Array<{ year: number; from: number; to: number; change: number }> {
  const out: Array<{ year: number; from: number; to: number; change: number }> = [];
  for (let i = 1; i < series.length; i += 1) {
    const a = series[i - 1]!, b = series[i]!;
    if (b.year < from || a.value == null || b.value == null || a.value === b.value) continue;
    out.push({ year: b.year, from: a.value, to: b.value, change: round(b.value - a.value) });
  }
  return out;
}

function round(n: number): number { return Math.round(n * 1000) / 1000; }
