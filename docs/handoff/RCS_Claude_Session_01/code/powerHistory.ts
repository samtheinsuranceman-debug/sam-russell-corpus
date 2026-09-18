// ============================================================
// POWER HISTORY — who held the federal levers, year by year, 1945–2026.
// Verified 2026-09-06 against the official records:
//   - Senate majorities: U.S. Senate, "Party Division", senate.gov/history/partydiv.htm
//   - House majorities: Office of the Historian, "Party Divisions of the House
//     of Representatives", history.house.gov/Institution/Party-Divisions/Party-Divisions/
//   - Presidents: whitehouse.gov/about-the-white-house/presidents/
// A Congress runs January of an odd year to January two years later; the
// table assigns each calendar year the Congress seated that January. Two
// mid-Congress Senate flips are recorded at the year level: 2001 (Republican
// control January–June, Democratic after Senator Jeffords left the party on
// June 6, 2001 — the year is scored Democratic, the longer span) and 2021–22
// (50–50 with the Democratic Vice President breaking ties — scored
// Democratic). Nothing here is estimated.
// ============================================================
import { valueAt, type YearValue } from "./taxHistory";

export type Party = "D" | "R";
export type Control = { year: number; president: Party; senate: Party; house: Party };

const P: Array<[number, number, Party]> = [
  [1945, 1952, "D"], // Truman
  [1953, 1960, "R"], // Eisenhower
  [1961, 1968, "D"], // Kennedy, Johnson
  [1969, 1976, "R"], // Nixon, Ford
  [1977, 1980, "D"], // Carter
  [1981, 1992, "R"], // Reagan, G.H.W. Bush
  [1993, 2000, "D"], // Clinton
  [2001, 2008, "R"], // G.W. Bush
  [2009, 2016, "D"], // Obama
  [2017, 2020, "R"], // Trump
  [2021, 2024, "D"], // Biden
  [2025, 2026, "R"], // Trump
];
// Senate majority by Congress (first year of the Congress → party). senate.gov "Party Division".
const S: Array<[number, Party]> = [
  [1945, "D"], [1947, "R"], [1949, "D"], [1951, "D"], [1953, "R"], [1955, "D"], [1957, "D"], [1959, "D"], [1961, "D"], [1963, "D"], [1965, "D"], [1967, "D"], [1969, "D"], [1971, "D"], [1973, "D"], [1975, "D"], [1977, "D"], [1979, "D"],
  [1981, "R"], [1983, "R"], [1985, "R"], [1987, "D"], [1989, "D"], [1991, "D"], [1993, "D"], [1995, "R"], [1997, "R"], [1999, "R"], [2001, "D"], [2003, "R"], [2005, "R"], [2007, "D"], [2009, "D"], [2011, "D"], [2013, "D"], [2015, "R"], [2017, "R"], [2019, "R"], [2021, "D"], [2023, "D"], [2025, "R"],
];
// House majority by Congress. history.house.gov "Party Divisions".
const H: Array<[number, Party]> = [
  [1945, "D"], [1947, "R"], [1949, "D"], [1951, "D"], [1953, "R"], [1955, "D"], [1957, "D"], [1959, "D"], [1961, "D"], [1963, "D"], [1965, "D"], [1967, "D"], [1969, "D"], [1971, "D"], [1973, "D"], [1975, "D"], [1977, "D"], [1979, "D"],
  [1981, "D"], [1983, "D"], [1985, "D"], [1987, "D"], [1989, "D"], [1991, "D"], [1993, "D"], [1995, "R"], [1997, "R"], [1999, "R"], [2001, "R"], [2003, "R"], [2005, "R"], [2007, "D"], [2009, "D"], [2011, "R"], [2013, "R"], [2015, "R"], [2017, "R"], [2019, "D"], [2021, "D"], [2023, "R"], [2025, "R"],
];

function byCongress(table: Array<[number, Party]>, year: number): Party {
  let p: Party = table[0]![1];
  for (const [start, party] of table) if (start <= year) p = party;
  return p;
}

export const CONTROL: Control[] = [];
for (let y = 1945; y <= 2026; y += 1) {
  const pres = P.find(([a, b]) => y >= a && y <= b)![2];
  CONTROL.push({ year: y, president: pres, senate: byCongress(S, y), house: byCongress(H, y) });
}

export const POWER_HISTORY_SOURCES = [
  "U.S. Senate, Party Division (senate.gov/history/partydiv.htm)",
  "Office of the Historian, U.S. House, Party Divisions of the House of Representatives (history.house.gov)",
  "The White House, Presidents (whitehouse.gov/about-the-white-house/presidents)",
];

export function controlAt(year: number): (Control & { trifecta: Party | null }) | null {
  const c = CONTROL.find((x) => x.year === year);
  if (!c) return null;
  const trifecta = c.president === c.senate && c.senate === c.house ? c.president : null;
  return { ...c, trifecta };
}

/** Share of the three federal levers held by Democrats: president ½, Senate ¼, House ¼. */
export const LEVER_WEIGHTS = { president: 0.5, senate: 0.25, house: 0.25 } as const;
export function demLeverShare(year: number): number | null {
  const c = controlAt(year);
  if (!c) return null;
  return (c.president === "D" ? LEVER_WEIGHTS.president : 0) + (c.senate === "D" ? LEVER_WEIGHTS.senate : 0) + (c.house === "D" ? LEVER_WEIGHTS.house : 0);
}

/** The lever-share series as YearValue, for the same window machinery the tax record uses. */
export const DEM_LEVER_SHARE: YearValue[] = CONTROL.map((c) => ({ year: c.year, value: demLeverShare(c.year) }));

export type PowerBucket = "left" | "divided" | "right" | "all";
/** ≥ ⅔ of the levers held by Democrats over the window is "left"; ≤ ⅓ is "right"; between is "divided". */
export function bucketOf(meanShare: number): Exclude<PowerBucket, "all"> {
  return meanShare >= 2 / 3 ? "left" : meanShare <= 1 / 3 ? "right" : "divided";
}

export type ConditionalWindowStats = {
  horizonYears: number; bucket: PowerBucket; windows: number;
  pUp: number; pDown: number; pFlat: number; meanChange: number; meanAbsRelChange: number; meanShare: number;
};

/**
 * windowStats restricted to the h-year windows during which the mean
 * Democratic lever share fell in `bucket`. Same arithmetic as
 * taxHistory.windowStats; only the set of windows differs.
 */
export function conditionalWindowStats(series: YearValue[], h: number, bucket: PowerBucket, from = 1946): ConditionalWindowStats {
  const last = Math.min(series[series.length - 1]?.year ?? from, CONTROL[CONTROL.length - 1]!.year);
  const changes: number[] = [], rel: number[] = [], shares: number[] = [];
  for (let y = from; y + h <= last; y += 1) {
    const a = valueAt(series, y), b = valueAt(series, y + h);
    if (a == null || b == null) continue;
    // Control during the window: the years whose legislation could move the rate at y+h.
    let sum = 0, n = 0;
    for (let k = y; k < y + h; k += 1) { const s = demLeverShare(k); if (s != null) { sum += s; n += 1; } }
    if (!n) continue;
    const mean = sum / n;
    if (bucket !== "all" && bucketOf(mean) !== bucket) continue;
    changes.push(b - a); shares.push(mean);
    if (a !== 0) rel.push(Math.abs(b / a - 1));
  }
  const n = changes.length;
  const r = (x: number) => Math.round(x * 1000) / 1000;
  if (!n) return { horizonYears: h, bucket, windows: 0, pUp: 0, pDown: 0, pFlat: 0, meanChange: 0, meanAbsRelChange: 0, meanShare: 0 };
  const up = changes.filter((c) => c > 0).length, down = changes.filter((c) => c < 0).length;
  return {
    horizonYears: h, bucket, windows: n, pUp: r(up / n), pDown: r(down / n), pFlat: r((n - up - down) / n),
    meanChange: r(changes.reduce((s, c) => s + c, 0) / n), meanAbsRelChange: r(rel.length ? rel.reduce((s, c) => s + c, 0) / rel.length : 0),
    meanShare: r(shares.reduce((s, c) => s + c, 0) / n),
  };
}

/** The base rate the trajectory should use for an expected lever share, with the unconditional fallback when the bucket is thin. */
export const MIN_WINDOWS = 15;
export function baseRateFor(series: YearValue[], h: number, expectedShare: number, from = 1946): { used: ConditionalWindowStats; bucket: PowerBucket; fellBack: boolean; left: ConditionalWindowStats; divided: ConditionalWindowStats; right: ConditionalWindowStats } {
  const left = conditionalWindowStats(series, h, "left", from), divided = conditionalWindowStats(series, h, "divided", from), right = conditionalWindowStats(series, h, "right", from);
  const bucket = bucketOf(expectedShare);
  const pick = bucket === "left" ? left : bucket === "right" ? right : divided;
  if (pick.windows >= MIN_WINDOWS) return { used: pick, bucket, fellBack: false, left, divided, right };
  return { used: conditionalWindowStats(series, h, "all", from), bucket, fellBack: true, left, divided, right };
}
