/**
 * Global treasuries — twenty-five countries and the calculus of when they fill
 * the U.S. Treasury pool and when they drain it.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The owner's second task (23 Sep 2026): the treasuries of Germany, India,
 * Brazil, Russia, China, Japan, the UK, Canada, Mexico, Australia, Taiwan,
 * Vietnam and thirteen more; their values and history; and, without
 * hunting for emergent patterns inside each, the overall pattern of how U.S.
 * rate changes and liquidity affect them, whether liquidity draining
 * elsewhere refills the U.S. pool, and under what conditions the Treasury
 * "sucks money up" from other countries. Ten indicators, not fifty, with
 * the calculus stated for each.
 *
 * Data: COUNTRIES (series keys per country), FLOW_INDICATORS (the ten), and
 * COUNTRY_FLOW_EPISODES (the documented record of giving and taking).
 * Arithmetic: globalFlowCalculus() — an inflow/outflow score per country from
 * the ten readings, weights in the rules table (`flow.w.*`), with the
 * reasoning printed. Pure.
 */
import type { IsoDate, Jurisdiction } from "./types";
import { A } from "./assumptions";

export type CountrySeries = {
  iso3: string;
  iso2: string;
  name: string;
  jurisdiction: Jurisdiction | "INTL";
  /** Holder label exactly as the TIC major-foreign-holders file prints it; null when the country is not broken out. */
  ticLabel: string | null;
  /** BIS central-bank policy-rate code (WS_CBPOL), null when not covered. */
  bisCbpol: string | null;
  /** IMF IFS country code for reserves (RAFA_USD) and rates (FITB_PA / FIGB_PA). */
  imfIfs: string;
  /** FRED exchange-rate series, quoted as the file quotes it. */
  fredFx: string | null;
  /** Why this country is on the list. */
  why: string;
};

const c = (iso3: string, iso2: string, name: string, jurisdiction: CountrySeries["jurisdiction"], ticLabel: string | null, bisCbpol: string | null, fredFx: string | null, why: string): CountrySeries =>
  ({ iso3, iso2, name, jurisdiction, ticLabel, bisCbpol, imfIfs: iso2, fredFx, why });

export const COUNTRIES: CountrySeries[] = [
  c("JPN", "JP", "Japan", "JP", "Japan", "JP", "fred:DEXJPUS", "Largest foreign holder; the 2022–26 seller; the yen carry funds the world."),
  c("CHN", "CN", "China", "CN", "China, Mainland", "CN", "fred:DEXCHUS", "The 2000–13 accumulator; the 2015–16 and 2022–26 seller; Belgium is its second door."),
  c("GBR", "GB", "United Kingdom", "GB", "United Kingdom", "GB", "fred:DEXUSUK", "London custody: Gulf, hedge-fund and official money prints as 'UK'."),
  c("DEU", "DE", "Germany", "DE", "Germany", "XM", "fred:DEXUSEU", "The euro area's anchor and the Bund, the pool's only rival safe asset in size."),
  c("IND", "IN", "India", "IN", "India", "IN", "fred:DEXINUS", "Fastest-growing reserve holder; rupee-settled oil is the petrodollar test case."),
  c("BRA", "BR", "Brazil", "BR", "Brazil", "BR", "fred:DEXBZUS", "Largest Latin holder; sells to defend the real in every dollar squeeze."),
  c("RUS", "RU", "Russia", "RU", "Russia", "RU", null, "Exited Treasuries in 2018 ahead of sanctions: the political-drain case."),
  c("CAN", "CA", "Canada", "CA", "Canada", "CA", "fred:DEXCAUS", "Integrated rate cycle; the cleanest 'US rates → neighbour' pass-through."),
  c("MEX", "MX", "Mexico", "MX", "Mexico", "MX", "fred:DEXMXUS", "Remittance and trade dollars; the 1994 and 2020 stress cases."),
  c("AUS", "AU", "Australia", "AU", "Australia", "AU", "fred:DEXUSAL", "Commodity currency; RBA moves with the Fed with a lag."),
  c("TWN", "TW", "Taiwan", "TW", "Taiwan", null, "fred:DEXTAUS", "Life insurers hold ~$300 bn of U.S. bonds; the Taiwan-risk panel's holder."),
  c("VNM", "VN", "Vietnam", "INTL", "Vietnam", null, null, "Trade-surplus reserve builder since 2017; small but the fastest-growing Asian holder."),
  c("KOR", "KR", "Korea", "KR", "Korea", "KR", "fred:DEXKOUS", "Won defence sells Treasuries (2008, 2022); NPS and lifers buy."),
  c("FRA", "FR", "France", "FR", "France", "XM", "fred:DEXUSEU", "OAT market and Paris custody."),
  c("ITA", "IT", "Italy", "IT", "Italy", "XM", "fred:DEXUSEU", "The euro area's fault line; BTP spreads move with U.S. real rates."),
  c("SAU", "SA", "Saudi Arabia", "SA", "Saudi Arabia", "SA", null, "Petrodollar recycler since 1974; the add-on arrangement's counterparty."),
  c("CHE", "CH", "Switzerland", "CH", "Switzerland", "CH", "fred:DEXSZUS", "SNB reserves from franc interventions are held in Treasuries and U.S. equities."),
  c("NLD", "NL", "Netherlands", "INTL", "Netherlands", "XM", "fred:DEXUSEU", "Pension funds and Euroclear-adjacent custody."),
  c("BEL", "BE", "Belgium", "INTL", "Belgium", "XM", "fred:DEXUSEU", "Euroclear: the custody line that carries China's second position."),
  c("SGP", "SG", "Singapore", "SG", "Singapore", null, "fred:DEXSIUS", "MAS and GIC; a managed-currency reserve holder."),
  c("HKG", "HK", "Hong Kong", "HK", "Hong Kong", "HK", "fred:DEXHKUS", "The peg: HKMA holds Treasuries by construction; China's third door."),
  c("IRL", "IE", "Ireland", "INTL", "Ireland", "XM", "fred:DEXUSEU", "Fund domiciles: the hedge-fund basis trade prints here and in Cayman."),
  c("CYM", "KY", "Cayman Islands", "INTL", "Cayman Islands", null, null, "Hedge funds: the leveraged, price-sensitive holder that sold in March 2020."),
  c("LUX", "LU", "Luxembourg", "INTL", "Luxembourg", "XM", "fred:DEXUSEU", "Fund domicile; European official and private money."),
  c("NOR", "NO", "Norway", "NO", "Norway", "NO", "fred:DEXNOUS", "NBIM publishes every holding; the transparent sovereign fund."),
];

export const COUNTRY_BY_ISO3: ReadonlyMap<string, CountrySeries> = new Map(COUNTRIES.map(x => [x.iso3, x]));

/** Series keys the history pull should store for a country. */
export function countrySeriesKeys(x: CountrySeries): Array<{ indicatorId: string; series: string; sourceId: string; min: number; max: number; publishedFrom: string }> {
  const rows: Array<{ indicatorId: string; series: string; sourceId: string; min: number; max: number; publishedFrom: string }> = [];
  if (x.ticLabel) rows.push({ indicatorId: `gt:${x.iso3}:tic`, series: `tic:history:${x.ticLabel}`, sourceId: "us-tic-mfh", min: 0, max: 5_000, publishedFrom: "2000-03-31" });
  if (x.bisCbpol) rows.push({ indicatorId: `gt:${x.iso3}:policy`, series: `bis:cbpol:${x.bisCbpol}`, sourceId: "bis-stats-api", min: -2, max: 100, publishedFrom: "1946-01-01" });
  rows.push({ indicatorId: `gt:${x.iso3}:reserves`, series: `imf:ifs:RAFA_USD:${x.imfIfs}`, sourceId: "imf-ifs", min: 0, max: 10_000_000, publishedFrom: "1948-01-01" });
  rows.push({ indicatorId: `gt:${x.iso3}:tbill`, series: `imf:ifs:FITB_PA:${x.imfIfs}`, sourceId: "imf-ifs", min: -2, max: 100, publishedFrom: "1948-01-01" });
  rows.push({ indicatorId: `gt:${x.iso3}:bond`, series: `imf:ifs:FIGB_PA:${x.imfIfs}`, sourceId: "imf-ifs", min: -2, max: 100, publishedFrom: "1948-01-01" });
  rows.push({ indicatorId: `gt:${x.iso3}:current-account`, series: `worldbank:BN.CAB.XOKA.GD.ZS:${x.iso3}`, sourceId: "wb-wdi-api", min: -50, max: 50, publishedFrom: "1960-12-31" });
  rows.push({ indicatorId: `gt:${x.iso3}:debt-gdp`, series: `imf:weo:GGXWDG_NGDP:${x.iso3}`, sourceId: "imf-weo", min: 0, max: 400, publishedFrom: "1980-12-31" });
  if (x.fredFx) rows.push({ indicatorId: `gt:${x.iso3}:fx`, series: x.fredFx, sourceId: "fred", min: 0.0001, max: 100_000, publishedFrom: "1971-01-04" });
  return rows;
}

export function globalStorageManifest(): ReturnType<typeof countrySeriesKeys> {
  const seen = new Set<string>();
  const out: ReturnType<typeof countrySeriesKeys> = [];
  for (const x of COUNTRIES) for (const r of countrySeriesKeys(x)) {
    if (seen.has(r.series)) continue;
    seen.add(r.series);
    out.push(r);
  }
  return out;
}

// ─── The ten indicators and their calculus ────────────────────────────────────

export type FlowIndicator = {
  id: string;
  name: string;
  /** Which way a rise moves the country's money: "in" = toward the U.S. pool, "out" = away from it. */
  rise: "in" | "out";
  weightId: string;
  reading: keyof FlowReading;
  calculus: string;
  history: string;
};

export type FlowReading = {
  /** US policy rate minus the country's policy rate, pp. */
  rateDifferentialPp: number | null;
  /** 12-month % change in the country's reserves. */
  reserves12mPct: number | null;
  /** Current-account balance, % of GDP. */
  currentAccountPctGdp: number | null;
  /** 12-month % change in the country's currency vs USD (positive = weaker vs dollar). */
  fxWeakening12mPct: number | null;
  /** 12-month % change in the country's TIC holdings. */
  tic12mPct: number | null;
  /** Government debt, % of GDP. */
  debtPctGdp: number | null;
  /** US 10-year minus the country's government bond yield, pp. */
  bondDifferentialPp: number | null;
  /** 12-month % change in the broad dollar. */
  dollar12mPct: number | null;
  /** US financial stress (OFR FSI or VIX z-score). */
  usStressZ: number | null;
  /** Sanctions or geopolitical exposure, 0–1 (stated per country). */
  sanctionsExposure: number | null;
};

export const FLOW_INDICATORS: FlowIndicator[] = [
  { id: "rate-differential", name: "U.S. policy rate minus the country's", rise: "in", weightId: "flow.w.rateDifferential", reading: "rateDifferentialPp", calculus: "Money follows the higher short rate: when the Fed pays more than the home central bank, private capital moves toward dollars and reserve managers keep dollars. Carry.", history: "1980–85 (Volcker–Reagan dollar), 2014–19, 2022–24: the differential widened and the dollar and inflows followed; 2001–03 and 2020: it narrowed and money left." },
  { id: "reserve-growth", name: "Reserve accumulation, 12-month", rise: "in", weightId: "flow.w.reserves", reading: "reserves12mPct", calculus: "A central bank that is accumulating reserves is a buyer of Treasuries by construction; one drawing them down is a seller. The single best predictor of official flows, and it is reported monthly by the IMF.", history: "China 2000–13 (+$3.8 tn of reserves, ~40 % into Treasuries); 2015–16 (−$1 tn, Treasuries −$180 bn); Asia 1999–2007; Gulf 2004–08 and 2022." },
  { id: "current-account", name: "Current-account balance, % of GDP", rise: "in", weightId: "flow.w.currentAccount", reading: "currentAccountPctGdp", calculus: "A surplus must be invested abroad; the U.S. pool is the deepest place to put it. Surplus countries fill the pool; deficit countries do not.", history: "Japan since 1981, Germany since 2002, China since 1994, the Gulf when oil is above ~$70: the surplus list is the holder list." },
  { id: "fx-pressure", name: "Currency weakening vs the dollar, 12-month", rise: "out", weightId: "flow.w.fx", reading: "fxWeakening12mPct", calculus: "A currency under pressure is defended with reserves, and reserves are Treasuries. Weakening → sales, with a 3–6 month lag; strengthening → accumulation.", history: "Japan 2022, 2024, 2026; China 2015–16; Korea 2008 and 2022; Brazil 2015 and 2020; Russia 2014." },
  { id: "tic-momentum", name: "Own Treasury holdings, 12-month change", rise: "in", weightId: "flow.w.ticMomentum", reading: "tic12mPct", calculus: "Flows persist: a holder that has been accumulating for a year usually continues, because the surplus or the peg that drove it persists. Momentum, not mean reversion, at annual horizons.", history: "Every accumulation run in the TIC record lasted at least three years (Japan 1985–, China 2000–13, Belgium 2013–14, Cayman 2016–19)." },
  { id: "debt-load", name: "Government debt, % of GDP", rise: "out", weightId: "flow.w.debt", reading: "debtPctGdp", calculus: "A heavily indebted government keeps its savings at home to fund itself and is less able to hold foreign reserves; a lightly indebted surplus economy exports capital.", history: "Italy and Japan are the exceptions that need the current account to explain them: Japan exports capital despite 230 % debt because households save; Italy does not." },
  { id: "bond-differential", name: "U.S. 10-year minus the country's bond yield", rise: "in", weightId: "flow.w.bondDifferential", reading: "bondDifferentialPp", calculus: "Private and institutional holders (insurers, pensions, funds) buy the higher yield after hedging; when U.S. yields exceed home yields by more than the hedge cost, they buy Treasuries. Japan's lifers are the largest case.", history: "2013–19 hedged carry positive → Japanese lifers bought; 2022–23 hedge cost exceeded the differential → they sold (jp-hedged-ust-carry)." },
  { id: "dollar-trend", name: "Broad dollar, 12-month", rise: "in", weightId: "flow.w.dollar", reading: "dollar12mPct", calculus: "A rising dollar draws private inflows (return) and forces official outflows (defence) — the sign depends on the holder type. For the total it is net inflow, because private money is larger; for official money it is outflow.", history: "1980–85 and 2014–16: total foreign holdings rose while EM official holdings fell." },
  { id: "us-stress", name: "U.S. financial stress", rise: "in", weightId: "flow.w.stress", reading: "usStressZ", calculus: "Fear anywhere buys Treasuries (flight to safety) — except in a dash for cash, when even Treasuries are sold for dollars for a month before the inflow. Net over a quarter: inflow.", history: "1998, 2008, 2011, 2020: foreign holdings rose within two quarters of every stress peak." },
  { id: "sanctions", name: "Sanctions and geopolitical exposure", rise: "out", weightId: "flow.w.sanctions", reading: "sanctionsExposure", calculus: "A holder that fears its reserves could be frozen (Russia 2022) reduces Treasuries ahead of the event and shifts to gold. Exposure is stated per country from the sanctions domain; it drains slowly and then all at once.", history: "Russia 2018 (−$80 bn in two months); China's gold accumulation since 2022; Saudi diversification statements 2023–24." },
];

export type CountryFlowResult = {
  iso3: string;
  name: string;
  asOf: IsoDate;
  /** −100…+100: positive means the calculus says money is moving into the U.S. pool from this country. */
  score: number;
  direction: "filling" | "neutral" | "draining";
  coverage: number;
  drivers: Array<{ id: string; name: string; reading: number | null; contribution: number; calculus: string }>;
  method: string[];
};

/** Normalise a reading to −1…+1 against a rules-table span (`flow.span.<id>`). */
function norm(v: number, spanId: string): number {
  const span = A(spanId);
  return Math.max(-1, Math.min(1, v / span));
}

export function globalFlowCalculus(iso3: string, r: FlowReading, asOf: IsoDate = "2026-09-22"): CountryFlowResult {
  const x = COUNTRY_BY_ISO3.get(iso3);
  if (!x) throw new Error(`Unknown country ${iso3}`);
  const spanFor: Record<keyof FlowReading, string> = {
    rateDifferentialPp: "flow.span.rateDifferentialPp",
    reserves12mPct: "flow.span.reserves12mPct",
    currentAccountPctGdp: "flow.span.currentAccountPctGdp",
    fxWeakening12mPct: "flow.span.fxWeakening12mPct",
    tic12mPct: "flow.span.tic12mPct",
    debtPctGdp: "flow.span.debtPctGdp",
    bondDifferentialPp: "flow.span.bondDifferentialPp",
    dollar12mPct: "flow.span.dollar12mPct",
    usStressZ: "flow.span.usStressZ",
    sanctionsExposure: "flow.span.sanctionsExposure",
  };
  let sum = 0;
  let wPresent = 0;
  let wTotal = 0;
  const drivers: CountryFlowResult["drivers"] = [];
  for (const ind of FLOW_INDICATORS) {
    const w = A(ind.weightId);
    wTotal += w;
    const v = r[ind.reading];
    if (v === null || !Number.isFinite(v)) {
      drivers.push({ id: ind.id, name: ind.name, reading: null, contribution: 0, calculus: ind.calculus });
      continue;
    }
    // Debt load is a level, not a change: centre it on the rules-table neutral before normalising.
    const centred = ind.reading === "debtPctGdp" ? v - A("flow.neutral.debtPctGdp") : v;
    const n = norm(centred, spanFor[ind.reading]) * (ind.rise === "in" ? 1 : -1);
    const contribution = Math.round(n * w * 100) / 100;
    sum += n * w;
    wPresent += w;
    drivers.push({ id: ind.id, name: ind.name, reading: v, contribution, calculus: ind.calculus });
  }
  const score = wPresent ? Math.round((sum / wPresent) * 100) : 0;
  const coverage = wTotal ? Math.round((wPresent / wTotal) * 100) / 100 : 0;
  drivers.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return {
    iso3,
    name: x.name,
    asOf,
    score,
    direction: score >= A("flow.threshold.filling") ? "filling" : score <= -A("flow.threshold.filling") ? "draining" : "neutral",
    coverage,
    drivers,
    method: [
      "Ten readings, each normalised to −1…+1 against a rules-table span (flow.span.*), signed by whether a rise moves money into the U.S. pool, weighted (flow.w.*), averaged over the readings present.",
      `Filling above +${A("flow.threshold.filling")}, draining below −${A("flow.threshold.filling")}. Coverage is the share of weight with a reading; below 0.5 the call is provisional.`,
      "The weights are stated choices from the documented episodes (COUNTRY_FLOW_EPISODES) and are re-set from the stored history by the regime detector once it covers 2008, 2013, 2015 and 2020.",
      "This is the overall calculus the owner asked for, not a per-country pattern hunt: the same ten drivers, the same weights, every country.",
    ],
  };
}

// ─── The documented record of giving and taking ──────────────────────────────

export type CountryFlowEpisode = { iso3: string; from: IsoDate; to: IsoDate; what: "gave" | "took"; amount: string; why: string; indicators: string[]; sourceIds: string[] };

export const COUNTRY_FLOW_EPISODES: CountryFlowEpisode[] = [
  { iso3: "SAU", from: "1974-01-01", to: "1985-12-31", what: "gave", amount: "The first petrodollar recycling: Saudi and Gulf surpluses into Treasuries through the 1974 add-on arrangement and London banks.", why: "Current-account surplus with nowhere else deep enough to go; a security relationship priced in Treasuries.", indicators: ["current-account", "reserve-growth"], sourceIds: ["us-tic-mfh", "bis-annual-report"] },
  { iso3: "JPN", from: "1985-09-22", to: "2004-12-31", what: "gave", amount: "From a minor holder to ~$700 bn by 2004; the MOF's 2003–04 intervention alone bought ~$300 bn of dollars.", why: "Surplus, a managed yen, and a domestic saving rate with no domestic yield.", indicators: ["current-account", "fx-pressure", "reserve-growth"], sourceIds: ["us-tic-mfh", "jp-mof-intervention"] },
  { iso3: "CHN", from: "2000-01-01", to: "2013-12-31", what: "gave", amount: "From ~$60 bn to ~$1.3 tn; reserves from $170 bn to $3.8 tn.", why: "A pegged then managed yuan, a current-account surplus of up to 10 % of GDP, and sterilised intervention.", indicators: ["reserve-growth", "current-account", "fx-pressure"], sourceIds: ["us-tic-mfh", "imf-ifs"] },
  { iso3: "CHN", from: "2015-08-11", to: "2017-01-31", what: "took", amount: "−$180 bn from a ~$1.24 tn book (≈ 0.8 %/month); Belgium's line fell in step.", why: "Yuan defence after the August 2015 fixing change; capital outflow.", indicators: ["fx-pressure", "reserve-growth"], sourceIds: ["us-tic-mfh"] },
  { iso3: "RUS", from: "2018-03-01", to: "2018-05-31", what: "took", amount: "−$80 bn in two months, from $96 bn to ~$15 bn.", why: "Sanctions risk after the April 2018 designations; shifted to gold and yuan.", indicators: ["sanctions"], sourceIds: ["us-tic-mfh", "ofac"] },
  { iso3: "CYM", from: "2020-03-01", to: "2020-03-31", what: "took", amount: "Hedge-fund basis trades unwound; Cayman and UK lines fell sharply in one month.", why: "Leverage, not policy: margin calls in the dash for cash.", indicators: ["us-stress"], sourceIds: ["us-tic-mfh", "fed-fima"] },
  { iso3: "JPN", from: "2022-09-22", to: "2022-10-31", what: "took", amount: "¥9.2 tn (~$62 bn) of yen buying, funded from reserves; holdings fell ~$100 bn over the quarter.", why: "Yen at 150; the hedged carry turned negative so lifers sold too.", indicators: ["fx-pressure", "bond-differential"], sourceIds: ["jp-mof-intervention", "us-tic-mfh"] },
  { iso3: "JPN", from: "2024-04-29", to: "2026-08-31", what: "took", amount: "Interventions of $62 bn (2024) and $98.6 bn (Aug 2026); holdings from $1.15 tn toward $1.10 tn.", why: "Yen defence; the MOF's foreign-securities reserve line is the fingerprint.", indicators: ["fx-pressure", "reserve-growth"], sourceIds: ["jp-mof-reserves", "jp-mof-intervention", "us-tic-mfh"] },
  { iso3: "CHN", from: "2022-01-01", to: "2026-07-31", what: "took", amount: "From ~$1.07 tn to below $620 bn, the lowest since 2008; gold reserves rose every month for most of the period.", why: "Diversification after Russia's reserves were frozen; yuan pressure; the sanctions-exposure indicator's slow drain.", indicators: ["sanctions", "fx-pressure", "dollar-trend"], sourceIds: ["us-tic-mfh", "imf-ifs"] },
  { iso3: "IND", from: "2020-01-01", to: "2026-07-31", what: "gave", amount: "From ~$160 bn to ~$240 bn as reserves crossed $650 bn.", why: "Reserve accumulation on inflows; a managed rupee.", indicators: ["reserve-growth", "tic-momentum"], sourceIds: ["us-tic-mfh", "rbi-dbie"] },
  { iso3: "GBR", from: "2022-01-01", to: "2026-07-31", what: "gave", amount: "From ~$650 bn to ~$900 bn: the largest increase of any line.", why: "Custody for Gulf and other official money plus leveraged funds; the rate differential and the dollar's rise.", indicators: ["rate-differential", "dollar-trend"], sourceIds: ["us-tic-mfh"] },
  { iso3: "BRA", from: "2020-03-01", to: "2020-06-30", what: "took", amount: "−$40 bn in a quarter.", why: "Real defence in the pandemic dollar squeeze.", indicators: ["fx-pressure", "us-stress"], sourceIds: ["us-tic-mfh", "bcb-sgs"] },
];

export const COUNTRY_SANCTIONS_EXPOSURE: Record<string, number> = {
  RUS: 1.0, CHN: 0.6, SAU: 0.3, HKG: 0.5, VNM: 0.2, IND: 0.15, BRA: 0.1, MEX: 0.05, TWN: 0.2,
  JPN: 0.02, GBR: 0.02, DEU: 0.02, CAN: 0.02, AUS: 0.02, KOR: 0.05, FRA: 0.02, ITA: 0.02, CHE: 0.05, NLD: 0.02, BEL: 0.02, SGP: 0.1, IRL: 0.02, CYM: 0.05, LUX: 0.02, NOR: 0.02,
};
