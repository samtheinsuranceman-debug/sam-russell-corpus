/**
 * Macro Assumptions — the rules table for every coefficient the engines use.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Standing order (06_STANDING_ORDERS.md §3): any constant that is a rate, cap,
 * statute, bracket, return or elasticity lives in a rules table with a source
 * and an as-of date, never inline in an engine. This is that table for
 * `shared/macro`. The engines read through `A(id)`; nothing numeric that
 * shapes an output lives anywhere else.
 *
 * `kind` says what sort of number it is, because they deserve different
 * scepticism:
 *   rate         — a published figure (a holding, a share, a base rate)
 *   elasticity   — a response coefficient from the literature or an episode
 *   prior        — a base rate for a probability model, derived from a record
 *   threshold    — a cut-off from a published framework (IMF, Greenspan–Guidotti)
 *   model-choice — a weighting or decay the platform chose; stated so it can
 *                  be argued with, not because a source dictated it
 *
 * `source` is a registry id from sources.ts where one exists, otherwise the
 * citation. `asOf` is the date of the source, not the date it was typed here.
 * `basis` is the one-line derivation a reader can check.
 */
import type { IsoDate } from "./types";

export type AssumptionKind = "rate" | "elasticity" | "prior" | "threshold" | "model-choice";

export type Assumption = {
  id: string;
  value: number;
  unit: string;
  kind: AssumptionKind;
  source: string;
  asOf: IsoDate;
  basis: string;
};

const T: Assumption[] = [
  // ─── Treasury liquidation: price impact ──────────────────────────────────
  { id: "liq.impact.low", value: 5, unit: "bp per $100 bn sold", kind: "elasticity", source: "Warnock & Warnock (2009), J. Int. Money & Finance 28(6)", asOf: "2009-10-01", basis: "Foreign official inflows of ~1 % of GDP lowered the 10-year ~80 bp in 2005; lower bound of the range across specifications." },
  { id: "liq.impact.mode", value: 12, unit: "bp per $100 bn sold", kind: "elasticity", source: "Beltran, Kretchmer, Marquez & Thomas (2013), Fed IFDP 1041", asOf: "2013-01-01", basis: "$100 bn change in foreign official holdings moves the 5-year term premium ~13 bp on impact." },
  { id: "liq.impact.high", value: 30, unit: "bp per $100 bn sold", kind: "elasticity", source: "Kaminska & Zinna (2020), JMCB 52(6), 'Official Demand for U.S. Debt'", asOf: "2020-09-01", basis: "Official purchases lowered 10-year yields by up to 100 bp at the 2013 peak of official holdings; scaled to the sale size that produced it." },
  { id: "liq.pace.exponent", value: 0.5, unit: "exponent on (12 / months)", kind: "elasticity", source: "Gatheral (2010), Quantitative Finance 10(7), 'No-dynamic-arbitrage and market impact'; Almgren et al. (2005)", asOf: "2010-07-01", basis: "Square-root law of market impact: the same quantity traded in 1/12 the time hits √12 ≈ 3.5× harder; the engine uses √(12/months) relative to a 12-month glide." },
  { id: "liq.fed.responseProbability", value: 0.6, unit: "probability", kind: "model-choice", source: "Duffie (2020), Hutchins Center Working Paper 62, 'Still the World's Safe Haven?'", asOf: "2020-06-01", basis: "March 2020: the Fed bought ~$1.6 tn in six weeks once the 10-year move became disorderly. A response is likely, not certain; 0.6 is the platform's stated odds." },
  { id: "liq.fed.thresholdBp", value: 75, unit: "bp", kind: "threshold", source: "Duffie (2020), Hutchins Center Working Paper 62", asOf: "2020-06-01", basis: "The March 2020 dash-for-cash moved the 10-year ~65 bp in eight sessions before intervention; 75 bp is the modelled trigger." },
  { id: "liq.fed.damping", value: 0.5, unit: "share of peak move removed", kind: "model-choice", source: "Duffie (2020); Vissing-Jorgensen (2021), 'The Treasury Market in Spring 2020 and the Response of the Federal Reserve'", asOf: "2021-06-01", basis: "Post-intervention the 2020 move retraced roughly half within a month." },
  { id: "liq.recovery.halfLifeMonths", value: 9, unit: "months", kind: "elasticity", source: "fred", asOf: "2014-02-28", basis: "2013 taper tantrum: DGS10 rose ~130 bp May–Sep 2013 and gave back half by Feb 2014 (FRED DGS10)." },
  // ─── Treasury liquidation: transmission ───────────────────────────────────
  { id: "liq.tx.mortgagePassThrough", value: 0.9, unit: "ratio", kind: "elasticity", source: "fred", asOf: "2026-09-18", basis: "MORTGAGE30US on DGS10, 2000–2026 weekly: slope ≈ 0.9 within a quarter; the spread is sticky but passes through." },
  { id: "liq.tx.equityPctPer100bp", value: -9, unit: "% per +100 bp", kind: "elasticity", source: "Bernanke & Kuttner (2005), J. Finance 60(3); dividend-discount arithmetic at a 20× forward multiple", asOf: "2005-06-01", basis: "Policy-surprise studies give ~−4 % per 100 bp; a pure discount-rate repricing at a 5 % earnings yield gives ~−20 %. −9 % is the mid-range with no earnings offset." },
  { id: "liq.tx.dollarPctPer100bnConverted", value: -0.6, unit: "% per $100 bn converted", kind: "elasticity", source: "bis-triennial", asOf: "2022-10-27", basis: "$100 bn is ~1.3 % of one day's $7.5 tn FX turnover (BIS 2022); official flows spread over weeks move the dollar modestly (Evans & Lyons 2002 order-flow elasticity scaled to weekly execution)." },
  { id: "liq.tx.dollarCapPct", value: -8, unit: "%", kind: "model-choice", source: "fred", asOf: "2026-09-18", basis: "Largest 12-month DTWEXBGS declines since 2000 are ~−10 %; the cap keeps the channel inside the record." },
  { id: "liq.tx.goldPctPer100bn", value: 1.5, unit: "% per $100 bn of official sales", kind: "elasticity", source: "World Gold Council, Gold Demand Trends Q2 2026 and the WGC Gold Return Attribution Model", asOf: "2026-07-30", basis: "Central-bank demand of ~1,000 t/yr explains ~10–15 % of gold's 2022–26 return; $100 bn of official Treasury sales diverted at the observed 10 % gold share ≈ 1.5 %." },
  { id: "liq.tx.goldCapPct", value: 20, unit: "%", kind: "model-choice", source: "World Gold Council", asOf: "2026-07-30", basis: "Keeps the channel within one year's observed range." },
  { id: "liq.tx.recessionPtsPer100bp", value: 7, unit: "probability points per +100 bp", kind: "elasticity", source: "Federal Reserve Bank of New York, 'The Yield Curve as a Leading Indicator' (Estrella & Mishkin 1996 model, monthly)", asOf: "2026-09-01", basis: "Sensitivity of the 12-month recession probability to the 10y–3m spread evaluated at 2026 levels." },
  { id: "liq.tx.repricingShareYearOne", value: 1 / 3, unit: "share of marketable debt", kind: "rate", source: "us-fiscaldata", asOf: "2026-08-31", basis: "Roughly one-third of marketable Treasury debt matures within twelve months (Monthly Statement of the Public Debt; average maturity ~6 years)." },
  { id: "liq.tx.holderDurationYears", value: 6, unit: "years", kind: "rate", source: "fed-h41", asOf: "2026-09-17", basis: "Foreign official portfolios are weighted to the 2–10-year sector; modified duration ≈ 6 (Fed custody maturity distribution)." },
  { id: "liq.tx.holderFxPctPer100bn.JP", value: 2.0, unit: "% yen per $100 bn", kind: "elasticity", source: "jp-mof-intervention", asOf: "2026-09-07", basis: "Apr–May 2024: ~$62 bn for ~−5 % USD/JPY; Jul–Aug 2026: $98.6 bn for ~−4 %. ~2 % per $100 bn once partial reversal is netted." },
  { id: "liq.tx.holderFxCapPct.JP", value: 12, unit: "%", kind: "model-choice", source: "jp-mof-intervention", asOf: "2026-09-07", basis: "Largest sustained intervention-driven yen move on record (~12 %, 2022–24 cumulative)." },
  { id: "liq.tx.holderFxPctPer100bn.CN", value: 0.6, unit: "% yuan per $100 bn", kind: "elasticity", source: "cn-pboc-mpc", asOf: "2026-09-19", basis: "Managed fixing: the PBOC absorbs most of the flow through the daily fix and reserve operations; a third of Japan's coefficient." },
  { id: "liq.tx.holderFxCapPct.CN", value: 5, unit: "%", kind: "model-choice", source: "cn-pboc-mpc", asOf: "2026-09-19", basis: "The band the fixing regime has tolerated in one year." },
  // ─── Treasury liquidation: 24-month forecast regimes ──────────────────────
  { id: "liq.fc.baselineSd.JP", value: 15, unit: "USD bn / month", kind: "rate", source: "us-tic-mfh", asOf: "2026-07-31", basis: "Standard deviation of Japan's monthly TIC change, Jan 2022–Jul 2026." },
  { id: "liq.fc.baselineSd.CN", value: 10, unit: "USD bn / month", kind: "rate", source: "us-tic-mfh", asOf: "2026-07-31", basis: "Standard deviation of China's monthly TIC change, Jan 2022–Jul 2026." },
  { id: "liq.fc.interventionPPerMonth.JP", value: 0.10, unit: "probability / month", kind: "prior", source: "jp-mof-intervention", asOf: "2026-08-31", basis: "Intervention months since Sep 2022: Sep–Oct 2022, Apr–May 2024, Jul 2024, Jul–Aug 2026 = 7 of 48 months (0.15); 0.10 conditional on the yen sitting inside 5 yen of the last line." },
  { id: "liq.fc.interventionSale.low", value: 40, unit: "USD bn", kind: "rate", source: "jp-mof-intervention", asOf: "2026-08-31", basis: "Smallest confirmed month (Jul 2024, ¥5.5 tn ≈ $36 bn), rounded." },
  { id: "liq.fc.interventionSale.mode", value: 70, unit: "USD bn", kind: "rate", source: "jp-mof-intervention", asOf: "2026-08-31", basis: "Sep–Oct 2022 and Apr–May 2024 episodes: ~$62 bn each." },
  { id: "liq.fc.interventionSale.high", value: 100, unit: "USD bn", kind: "rate", source: "jp-mof-intervention", asOf: "2026-08-31", basis: "Month to 26 Aug 2026: ¥15.4 tn = $98.6 bn, the record." },
  { id: "liq.fc.stressPctPerMonth.low", value: 0.01, unit: "share of holdings / month", kind: "rate", source: "us-tic-mfh", asOf: "2017-01-31", basis: "China Aug 2015–Jan 2017: −$180 bn from a ~$1.24 tn book over 18 months ≈ 0.8 %/month." },
  { id: "liq.fc.stressPctPerMonth.mode", value: 0.02, unit: "share of holdings / month", kind: "rate", source: "us-tic-mfh", asOf: "2017-01-31", basis: "Same episode, sharpest six months (Aug 2015–Jan 2016: −$100 bn) ≈ 1.4 %/month; rounded up for a deliberate rather than defensive sale." },
  { id: "liq.fc.stressPctPerMonth.high", value: 0.04, unit: "share of holdings / month", kind: "model-choice", source: "us-tic-mfh", asOf: "2017-01-31", basis: "Twice the fastest observed defensive pace; a political sale could be faster than a currency-defence one." },
  { id: "liq.fc.stressDuration.low", value: 9, unit: "months", kind: "rate", source: "us-tic-mfh", asOf: "2017-01-31", basis: "Shortest sustained selling run in the TIC record for either holder (Japan 2022: 9 months)." },
  { id: "liq.fc.stressDuration.mode", value: 15, unit: "months", kind: "rate", source: "us-tic-mfh", asOf: "2017-01-31", basis: "China 2015–17 run, ~18 months; Japan 2022–23, ~12." },
  { id: "liq.fc.stressDuration.high", value: 24, unit: "months", kind: "model-choice", source: "us-tic-mfh", asOf: "2017-01-31", basis: "The forecast horizon." },
  { id: "liq.prior.JP", value: 0.15, unit: "probability / 24 months", kind: "prior", source: "us-tic-mfh", asOf: "2026-07-31", basis: "Share of rolling 24-month windows since Jan 2000 in which Japan's holdings fell ≥ 10 % (2022–23 and the 2024–26 run)." },
  { id: "liq.prior.CN", value: 0.25, unit: "probability / 24 months", kind: "prior", source: "us-tic-mfh", asOf: "2026-07-31", basis: "Same measure for China (2015–17, 2022–23, 2024–26)." },
  // ─── Petrodollar ──────────────────────────────────────────────────────────
  { id: "oil.ceiling.low", value: 30, unit: "% of crude trade", kind: "model-choice", source: "carnegie", asOf: "2026-07-28", basis: "Carnegie's sceptical bound: sanctioned corridors plus Gulf yuan pricing at current pegs saturate near 30 %." },
  { id: "oil.ceiling.mode", value: 40, unit: "% of crude trade", kind: "model-choice", source: "atlantic-council-dollar", asOf: "2026-06-30", basis: "If Saudi and UAE yuan pricing reaches their China share (~35–40 % of exports) on top of the sanctioned corridors." },
  { id: "oil.ceiling.high", value: 60, unit: "% of crude trade", kind: "model-choice", source: "atlantic-council-dollar", asOf: "2026-06-30", basis: "A Gulf peg change plus a BRICS settlement rail; the dollar retains the Americas, Europe and the futures benchmarks." },
  { id: "oil.halfLife.low", value: 4, unit: "years", kind: "elasticity", source: "atlantic-council-dollar", asOf: "2026-06-30", basis: "2022–26 pace (13 % → 20 %) extrapolated: half the remaining gap in ~4 years." },
  { id: "oil.halfLife.mode", value: 7, unit: "years", kind: "elasticity", source: "swift-rmb-tracker", asOf: "2026-08-31", basis: "Yuan payment share 2012–2026 followed a logistic with a ~7-year half-life." },
  { id: "oil.halfLife.high", value: 12, unit: "years", kind: "elasticity", source: "imf-cofer", asOf: "2026-03-31", basis: "Reserve-share diffusion (USD 71 % → 56 % over 26 years) is the slow case." },
  { id: "oil.shockProbabilityPerYear", value: 0.08, unit: "probability / year", kind: "prior", source: "ofac", asOf: "2026-06-30", basis: "Step changes since 2012 (Iran 2012, Russia 2022, Hormuz 2026): three in fourteen years." },
  { id: "oil.shockSize.low", value: 3, unit: "share points", kind: "rate", source: "atlantic-council-dollar", asOf: "2026-06-30", basis: "Iran 2012 step." },
  { id: "oil.shockSize.mode", value: 6, unit: "share points", kind: "rate", source: "atlantic-council-dollar", asOf: "2026-06-30", basis: "Russia 2022 step (~+5–8 points over 18 months)." },
  { id: "oil.shockSize.high", value: 12, unit: "share points", kind: "model-choice", source: "atlantic-council-dollar", asOf: "2026-06-30", basis: "A Gulf-wide yuan pricing decision." },
  { id: "oil.reversalProbabilityPerYear", value: 0.05, unit: "probability / year", kind: "prior", source: "ofac", asOf: "2026-06-30", basis: "Sanctions relief or a yuan liquidity crisis (2015–16 precedent) reverses a corridor; roughly one such event per twenty years." },
  { id: "oil.globalCrudeTradeMbd", value: 44, unit: "mb/d", kind: "rate", source: "iea-omr", asOf: "2026-08-31", basis: "Seaborne plus pipeline crude trade, IEA OMR August 2026." },
  { id: "oil.adj.termPremiumBpPer10pts", value: 8, unit: "bp per 10 share points", kind: "elasticity", source: "Beltran et al. (2013)", asOf: "2013-01-01", basis: "10 points of a ~$1.8 tn/yr crude market leaving dollar recycling ≈ $40 bn/yr less official Treasury demand ≈ 5 bp at 12 bp/$100 bn, plus persistence." },
  { id: "oil.adj.dollarPctPer10pts", value: -1.5, unit: "% per 10 share points", kind: "elasticity", source: "bis-triennial", asOf: "2022-10-27", basis: "Same flow diverted from dollar settlement; order-flow elasticity as in liq.tx.dollarPctPer100bnConverted, annualised." },
  { id: "oil.adj.goldPctPer10pts", value: 4, unit: "% per 10 share points", kind: "elasticity", source: "sge", asOf: "2026-06-30", basis: "Yuan oil receipts are partly converted to gold on the SGE international board; 10 points ≈ 100–150 t/yr of demand." },
  { id: "oil.adj.inflationPpPer10pts", value: 0.1, unit: "pp CPI per 10 share points", kind: "elasticity", source: "fred", asOf: "2026-09-18", basis: "Dollar −1.5 % → import prices +0.3 % → CPI +0.1 pp at a ~15 % import share (Gopinath et al. 2020 pass-through)." },
  // ─── Sovereign debt ───────────────────────────────────────────────────────
  { id: "debt.base2y.AAA", value: 0.0, unit: "probability / 2 years", kind: "prior", source: "S&P Global Ratings, 2024 Annual Global Sovereign Default and Rating Transition Study", asOf: "2025-04-01", basis: "Two-year cumulative sovereign default rate by rating, 1975–2024." },
  { id: "debt.base2y.AA", value: 0.001, unit: "probability / 2 years", kind: "prior", source: "S&P Global Ratings, 2024 sovereign transition study", asOf: "2025-04-01", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "debt.base2y.A", value: 0.004, unit: "probability / 2 years", kind: "prior", source: "S&P Global Ratings, 2024 sovereign transition study", asOf: "2025-04-01", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "debt.base2y.BBB", value: 0.012, unit: "probability / 2 years", kind: "prior", source: "S&P Global Ratings, 2024 sovereign transition study", asOf: "2025-04-01", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "debt.base2y.BB", value: 0.04, unit: "probability / 2 years", kind: "prior", source: "S&P Global Ratings, 2024 sovereign transition study", asOf: "2025-04-01", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "debt.base2y.B", value: 0.12, unit: "probability / 2 years", kind: "prior", source: "S&P Global Ratings, 2024 sovereign transition study", asOf: "2025-04-01", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "debt.base2y.CCC", value: 0.40, unit: "probability / 2 years", kind: "prior", source: "S&P Global Ratings, 2024 sovereign transition study", asOf: "2025-04-01", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "debt.threshold.interestToRevenueDistress", value: 40, unit: "% of revenue", kind: "threshold", source: "imf-fiscal-monitor", asOf: "2026-04-15", basis: "Fiscal Monitor Apr 2026 flags interest above ~20 % of revenue as stress and ~40 % as distress (Egypt, Pakistan, Nigeria)." },
  { id: "debt.threshold.reserveCoverAdequate", value: 1.0, unit: "ratio", kind: "threshold", source: "Greenspan (1999) / Guidotti (1999), 'reserves ≥ short-term external debt'", asOf: "1999-04-29", basis: "The Greenspan–Guidotti rule." },
  { id: "debt.threshold.reserveCoverScale", value: 1.5, unit: "ratio", kind: "model-choice", source: "Greenspan–Guidotti", asOf: "1999-04-29", basis: "Full score at 0 cover, zero score at 1.5× — one and a half times adequate." },
  { id: "debt.threshold.localCurrencyTolerance", value: 200, unit: "% of GDP", kind: "threshold", source: "imf-article-iv", asOf: "2026-02-01", basis: "Japan's DSA: fully local-currency debt sustained above 200 % with no market stress; the score scales the ratio by currency mix between 100 (all foreign) and 200 (all local)." },
  { id: "debt.threshold.cdsFullScoreBp", value: 1000, unit: "bp", kind: "threshold", source: "cds-markit", asOf: "2026-09-19", basis: "5-year CDS at or above ~1,000 bp has preceded every restructuring since 2010 (Greece, Argentina, Sri Lanka, Ghana)." },
  { id: "debt.weight.ratio", value: 0.25, unit: "weight", kind: "model-choice", source: "imf-article-iv", asOf: "2026-02-01", basis: "IMF SRDSF: debt level is one of five signals, not the signal." },
  { id: "debt.weight.interest", value: 0.25, unit: "weight", kind: "model-choice", source: "imf-fiscal-monitor", asOf: "2026-04-15", basis: "Interest burden is the Monitor's headline stress metric." },
  { id: "debt.weight.fx", value: 0.15, unit: "weight", kind: "model-choice", source: "Eichengreen, Hausmann & Panizza (2005), 'The Pain of Original Sin'", asOf: "2005-01-01", basis: "Foreign-currency debt is the original-sin channel." },
  { id: "debt.weight.reserves", value: 0.15, unit: "weight", kind: "model-choice", source: "Greenspan–Guidotti", asOf: "1999-04-29", basis: "Reserve cover only bites when there is foreign-currency debt to cover." },
  { id: "debt.weight.market", value: 0.20, unit: "weight", kind: "model-choice", source: "cds-markit", asOf: "2026-09-19", basis: "Market pricing aggregates what the fundamentals miss." },
  { id: "debt.contagion.emSpreadFloorBp", value: 40, unit: "bp", kind: "elasticity", source: "J.P. Morgan EMBI Global, 1998 / 2001 / 2022 episodes", asOf: "2022-12-31", basis: "Frontier defaults (Zambia 2020, Ghana 2022) moved the EMBI ~40 bp." },
  { id: "debt.contagion.emSpreadBpPerGdpPt", value: 25, unit: "bp per point of world GDP in default", kind: "elasticity", source: "J.P. Morgan EMBI Global, 1998 / 2001 / 2022 episodes", asOf: "2022-12-31", basis: "Russia 1998 (~1 % of world GDP): EMBI +~600 bp peak, +250 bp sustained." },
  { id: "debt.contagion.volPerGdpPt", value: 0.06, unit: "multiplier per GDP point", kind: "elasticity", source: "Cboe VIX; IMF GFSR", asOf: "2022-12-31", basis: "VIX +6 % per point of world GDP in distress across the 1998, 2011 and 2022 episodes." },
  { id: "debt.contagion.returnPerGdpPt", value: 0.03, unit: "multiplier per GDP point", kind: "model-choice", source: "MSCI World, 2011 euro crisis", asOf: "2012-12-31", basis: "2011 (Italy + Spain + Greece ≈ 4 % of world GDP): MSCI World −12 % ≈ 3 % per point." },
  { id: "debt.contagion.flightBpPerGdpPt", value: -4, unit: "bp per GDP point", kind: "elasticity", source: "fred", asOf: "2012-12-31", basis: "DGS10 fell ~−15 bp per point of euro-area GDP in distress during 2011–12." },
  { id: "debt.contagion.usTriggerFlightBp", value: 150, unit: "bp", kind: "model-choice", source: "Fitch Ratings, U.S. downgrade 1 Aug 2023; Aug 2011 S&P downgrade", asOf: "2023-08-01", basis: "A U.S. trigger inverts flight-to-safety; +150 bp is the modelled repricing of the risk-free asset itself." },
  { id: "debt.contagion.dollarPctPerGdpPt", value: 0.5, unit: "% per GDP point", kind: "elasticity", source: "fred", asOf: "2012-12-31", basis: "DTWEXBGS +2 % during the 2011 euro episode (~4 GDP points)." },
  { id: "debt.contagion.recessionPtsPerGdpPt", value: 1.5, unit: "probability points per GDP point", kind: "model-choice", source: "imf-fiscal-monitor", asOf: "2026-04-15", basis: "Trade and bank-exposure spillovers per the Monitor's stress scenarios." },
  { id: "debt.contagion.secondary.sameRegionSubIG", value: 0.05, unit: "probability", kind: "model-choice", source: "Reinhart & Rogoff (2009), This Time Is Different", asOf: "2009-09-01", basis: "Regional clustering of defaults in the historical record." },
  { id: "debt.contagion.secondary.sameBucket", value: 0.02, unit: "probability", kind: "model-choice", source: "J.P. Morgan EMBI index rules", asOf: "2022-12-31", basis: "Index-driven selling hits the same rating bucket regardless of fundamentals." },
  { id: "debt.contagion.secondary.fxDebt", value: 0.03, unit: "probability", kind: "model-choice", source: "Eichengreen, Hausmann & Panizza (2005)", asOf: "2005-01-01", basis: "Dollar squeeze channel." },
  // ─── Taiwan ───────────────────────────────────────────────────────────────
  { id: "tw.prior.gray-zone", value: 0.45, unit: "probability / 12 months", kind: "prior", source: "us-odni-ata", asOf: "2026-03-25", basis: "Intensified coercion short of force is the ATA's modal expectation; public assessments put it at 40–50 %." },
  { id: "tw.prior.quarantine", value: 0.10, unit: "probability / 12 months", kind: "prior", source: "us-odni-ata", asOf: "2026-03-25", basis: "Public estimates 10–20 % for a coercive operation short of invasion (CGA-led inspection regime)." },
  { id: "tw.prior.blockade", value: 0.05, unit: "probability / 12 months", kind: "prior", source: "us-odni-ata", asOf: "2026-03-25", basis: "The lower half of the 10–20 % 'major operation' range, since a full PLA blockade is the larger of the two." },
  { id: "tw.prior.war", value: 0.02, unit: "probability / 12 months", kind: "prior", source: "us-odni-ata", asOf: "2026-03-25", basis: "ATA 2026: no fixed timeline, invasion judged high-risk by Beijing; public estimates 5–10 % for an invasion attempt over several years." },
  { id: "tw.mult.TWN", value: 4.2, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "Bloomberg Economics war case: Taiwan −40 % of GDP vs world −10.2 %." },
  { id: "tw.mult.CHN", value: 1.75, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "China −16.7 % vs world −10.2 %." },
  { id: "tw.mult.KOR", value: 2.4, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "Korea −23 % (chips and shipping)." },
  { id: "tw.mult.JPN", value: 1.4, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "Japan −13.5 %." },
  { id: "tw.mult.USA", value: 0.7, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "United States −6.7 %." },
  { id: "tw.mult.DEU", value: 0.9, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "Germany, chip-dependent autos." },
  { id: "tw.mult.GBR", value: 0.6, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "United Kingdom." },
  { id: "tw.mult.IND", value: 0.5, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "India, least exposed of the large economies." },
  { id: "tw.mult.MEX", value: 0.5, unit: "× world impact", kind: "elasticity", source: "bloomberg-economics-taiwan", asOf: "2024-01-09", basis: "Mexico, via U.S. autos." },
  { id: "tw.chipLoss.war", value: 1.0, unit: "share of Taiwan output offline", kind: "model-choice", source: "tw-tsmc", asOf: "2026-07-17", basis: "Kinetic conflict stops fabs; ~60 % of world semiconductors, ~90 % of leading-edge, are on the island." },
  { id: "tw.chipLoss.blockade", value: 0.9, unit: "share", kind: "model-choice", source: "rhodium-taiwan", asOf: "2026-06-30", basis: "Fabs run for weeks on stock; exports stop immediately." },
  { id: "tw.chipLoss.quarantine", value: 0.4, unit: "share", kind: "model-choice", source: "rhodium-taiwan", asOf: "2026-06-30", basis: "Selective interdiction; insured shipping continues at a premium." },
  { id: "tw.chipLoss.gray-zone", value: 0.05, unit: "share", kind: "model-choice", source: "csis-china-power", asOf: "2026-07-01", basis: "Delays and insurance only." },
  { id: "tw.sim.equityPctPerGdpPt", value: -4, unit: "% per point of world GDP", kind: "elasticity", source: "imf-weo", asOf: "2021-04-01", basis: "2020: world GDP −3.1 % (WEO Apr 2021) against a −34 % MSCI World drawdown that included a fear premium; the fear premium is drawn separately." },
  { id: "tw.sim.fearPremium.low", value: 5, unit: "%", kind: "model-choice", source: "MSCI World, Feb–Mar 2020", asOf: "2020-03-23", basis: "Additional drawdown when supply stops, beyond the GDP arithmetic." },
  { id: "tw.sim.fearPremium.mode", value: 12, unit: "%", kind: "model-choice", source: "MSCI World, Feb–Mar 2020", asOf: "2020-03-23", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "tw.sim.fearPremium.high", value: 20, unit: "%", kind: "model-choice", source: "MSCI World, Feb–Mar 2020", asOf: "2020-03-23", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "tw.sim.flightBpPerGdpPt", value: -20, unit: "bp per GDP point", kind: "elasticity", source: "fred", asOf: "2020-03-09", basis: "DGS10 fell ~−100 bp as 2020 growth expectations fell ~5 points." },
  { id: "tw.sim.chinaSellsProbability.blockade", value: 0.5, unit: "probability", kind: "model-choice", source: "rhodium-taiwan", asOf: "2026-06-30", basis: "Sanctions on China's largest banks ($3 tn of flows at risk) make pre-emptive Treasury sales rational in half the modelled paths." },
  { id: "tw.sim.chinaSellsProbability.other", value: 0.1, unit: "probability", kind: "model-choice", source: "rhodium-taiwan", asOf: "2026-06-30", basis: "Below the blockade threshold, sanctions are targeted, not systemic." },
  { id: "tw.sim.chinaSale.low", value: 20, unit: "bp", kind: "elasticity", source: "Beltran et al. (2013)", asOf: "2013-01-01", basis: "~$150 bn at the low impact bound." },
  { id: "tw.sim.chinaSale.mode", value: 50, unit: "bp", kind: "elasticity", source: "Beltran et al. (2013)", asOf: "2013-01-01", basis: "~$400 bn at the mode impact." },
  { id: "tw.sim.chinaSale.high", value: 100, unit: "bp", kind: "elasticity", source: "Kaminska & Zinna (2020)", asOf: "2020-09-01", basis: "The full book at the high bound with Fed damping." },
  { id: "tw.sim.goldPctPerGdpPt", value: 4, unit: "% per GDP point", kind: "elasticity", source: "World Gold Council", asOf: "2020-08-06", basis: "Gold +25 % during 2020's ~5-point growth shock ≈ 4–5 % per point, before the base fear draw." },
  { id: "tw.sim.recessionGdpThreshold", value: 1.5, unit: "% of world GDP", kind: "threshold", source: "imf-weo", asOf: "2026-04-14", basis: "A first-year world loss above 1.5 points has coincided with a U.S. recession in every post-war instance (1974, 1982, 2009, 2020)." },
  { id: "tw.sim.recessionProbabilityWhenChipsStop", value: 0.8, unit: "probability", kind: "model-choice", source: "rhodium-taiwan", asOf: "2026-06-30", basis: "$1.6 tn of chip-dependent revenue stalls within 4–8 weeks." },
  { id: "tw.scale.gray-zone", value: 2.0, unit: "log-odds scale", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Full evidence at +1 moves 45 % to ~86 %; the modal scenario responds most to the panel." },
  { id: "tw.scale.quarantine", value: 1.8, unit: "log-odds scale", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Escalation scenarios respond to the same panel a little less each step." },
  { id: "tw.scale.blockade", value: 1.6, unit: "log-odds scale", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "tw.scale.war", value: 1.4, unit: "log-odds scale", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "As above; the evidence that doubles gray-zone roughly doubles war from 2 % to 4 %." },
  { id: "tw.adj.inflationPpPerChipLoss", value: 1.5, unit: "pp CPI at full chip loss", kind: "elasticity", source: "Federal Reserve Board, FEDS Notes 'Supply chain disruptions and inflation' (2022)", asOf: "2022-10-01", basis: "2021–22 chip shortage contributed ~1–1.5 pp to U.S. inflation via autos and electronics." },
  // ─── Liquidation model scale ─────────────────────────────────────────────
  { id: "liq.scale", value: 2.5, unit: "log-odds scale", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Full evidence at +1 moves a 15 % prior to ~68 %; set so the 2026 Japan panel reads elevated rather than certain." },
  // ─── Confidence engine (weights and decays, stated so they can be argued) ─
  { id: "conf.tier.primary-official", value: 1.0, unit: "weight", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "The entity that owns the fact." },
  { id: "conf.tier.multilateral", value: 0.95, unit: "weight", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Compiled from officials, audited, revised." },
  { id: "conf.tier.wire-service", value: 0.8, unit: "weight", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Attributed reporting with corrections." },
  { id: "conf.tier.research", value: 0.75, unit: "weight", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Think-tank and bank research: methods stated, incentives present." },
  { id: "conf.tier.state-media", value: 0.55, unit: "weight", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Declared positions, not facts; further discounted by the follow-through ledger." },
  { id: "conf.tier.secondary", value: 0.35, unit: "weight", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Aggregators and commentary lead, never confirm." },
  { id: "conf.halfLife.realtime", value: 2, unit: "days", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Half-life of an observation's freshness by series cadence." },
  { id: "conf.halfLife.daily", value: 5, unit: "days", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "conf.halfLife.weekly", value: 14, unit: "days", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "conf.halfLife.monthly", value: 45, unit: "days", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Half-life of an observation by series cadence; a TIC month is fresh until the next release." },
  { id: "conf.halfLife.quarterly", value: 120, unit: "days", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "conf.halfLife.semiannual", value: 240, unit: "days", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "conf.halfLife.annual", value: 400, unit: "days", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
  { id: "conf.halfLife.irregular", value: 60, unit: "days", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Two-year cumulative sovereign default rate by rating bucket, 1975–2024, from the same S&P transition study." },
];

// ─── Factor panel (W8): neutral point, span and plausibility bounds per factor ─
//
// Four rows per factor. `neutral` and `span` are the platform's stated
// normalisation — the value that reads as "no signal" and the move that reads
// as a full ±1 — and are model choices until the stored history re-sets them
// (the backtest reports whether they carry any lead at all). `min` and `max`
// are plausibility bounds on the RAW series: a parsed reading outside them is
// a transport or format error and is dropped and counted, never stored.
function F(prefix: string, unit: string, source: string, asOf: IsoDate, neutral: number, span: number, min: number, max: number, basis: string): Assumption[] {
  return [
    { id: `${prefix}.neutral`, value: neutral, unit, kind: "model-choice", source, asOf, basis: `Neutral point (no signal). ${basis}` },
    { id: `${prefix}.span`, value: span, unit, kind: "model-choice", source, asOf, basis: `Span: the move from neutral that reads as a full ±1 signal. ${basis}` },
    { id: `${prefix}.min`, value: min, unit, kind: "threshold", source, asOf, basis: `Plausibility floor on the raw series; a parsed reading below it is dropped and counted as a transport error. ${basis}` },
    { id: `${prefix}.max`, value: max, unit, kind: "threshold", source, asOf, basis: `Plausibility ceiling on the raw series; a parsed reading above it is dropped and counted as a transport error. ${basis}` },
  ];
}
const FACTOR_ROWS: Assumption[] = [
  ...F("factor.f-curve-10y3m", "pp", "fred", "2026-09-22", 1.0, 1.5, -5, 6, "T10Y3M 1982+: inversions preceded every recession since 1982 by 6–18 months (NY Fed, Estrella & Mishkin 1996); +1 pp is the long-run median of the spread."),
  ...F("factor.f-curve-10y2y", "pp", "fred", "2026-09-22", 0.8, 1.2, -3, 4, "T10Y2Y 1976+: same signal further out the curve; median ≈ +0.8 pp, inversions of −0.5 pp or worse preceded 1980, 1981, 1990, 2001, 2007, 2020(partial) recessions."),
  ...F("factor.f-fed-funds", "%", "fred", "2026-09-22", 3.0, 3.0, 0, 25, "DFF 1954+: a policy rate three points above its long-run neutral has preceded most post-war recessions; the 1980–81 peak (19 %) sets the ceiling."),
  ...F("factor.f-sahm", "pp", "fred", "2026-09-22", 0.25, 0.5, 0, 30, "Sahm (2019): the 3-month average unemployment rate 0.50 pp above its 12-month low has marked the start of every recession since 1970 with no false positives before 2024; bounds apply to the raw UNRATE series."),
  ...F("factor.f-claims-yoy", "% y/y", "fred", "2026-09-22", 0, 25, 50_000, 7_000_000, "ICSA 1967+: a 25 % year-on-year rise in initial claims has preceded each rise in the unemployment rate since 1970; the April 2020 print (6.9 m) sets the ceiling on the raw weekly count."),
  ...F("factor.f-cpi-yoy", "% y/y", "fred", "2026-09-22", 2.5, 2.0, 10, 400, "CPIAUCSL 1947+: the Fed's 2 % target plus the long-run CPI–PCE wedge; ±2 pp is the move that has re-priced the 10-year within two quarters (1994, 2021–22). Bounds are on the index level."),
  ...F("factor.f-m2-yoy", "% y/y", "fred", "2026-09-22", 6, 5, 200, 40_000, "M2SL 1959+: nominal growth trend ≈ 6 %; the 2020–21 surge to 27 % preceded the 2022 CPI peak by ~18 months (the trunk's macroEngine models the same lag). Bounds on the level in USD bn."),
  ...F("factor.f-baa-spread", "pp", "fred", "2026-09-22", 2.5, 1.5, 0, 8, "BAA10Y 1986+: median ≈ 2.5 pp; widenings to 4 pp preceded 1990, 2001 and 2008 recessions and marked 2020; the 2008 peak (~6.2 pp) sets the ceiling."),
  ...F("factor.f-fed-assets-yoy", "% y/y", "fred", "2026-09-22", 0, 30, 500_000, 12_000_000, "WALCL 2002+: QE years ran +30–70 % y/y and QT years −10 to −15 %; bounds on the level in USD mn cover 2002 ($0.7 tn) to the 2022 peak ($9 tn) with headroom."),
  ...F("factor.f-nfci", "index", "fred", "2026-09-22", 0, 1, -2, 6, "NFCI 1971+: zero is average conditions by construction; +1 is one standard deviation tighter; 2008 peaked near +5."),
  ...F("factor.f-vix", "index", "fred", "2026-09-22", 20, 15, 5, 100, "VIXCLS 1990+: long-run median ≈ 18–20; sustained readings above 35 accompanied 2008 and 2020; the intraday record (89.5, Oct 2008) sits under the ceiling."),
  ...F("factor.f-consumer-sentiment", "index", "fred", "2026-09-22", 85, 20, 40, 120, "UMCSENT 1952+: long-run mean ≈ 85; readings under 65 accompanied 1980, 2008 and 2022; the record low is 50 (Jun 2022), the high 112 (Jan 2000)."),
  ...F("factor.f-housing-starts-yoy", "% y/y", "fred", "2026-09-22", 0, 25, 300, 3000, "HOUST 1959+: starts fall 25 % y/y or more ahead of most recessions (Leamer 2007, 'Housing IS the business cycle'); bounds on the level in thousands (annual rate)."),
  ...F("factor.f-indpro-yoy", "% y/y", "fred", "2026-09-22", 2, 4, 5, 200, "INDPRO 1919+: trend growth ≈ 2 %; a fall to −2 % y/y is coincident with NBER recessions; bounds on the index (2017 = 100)."),
  ...F("factor.f-oil-wti-yoy", "% y/y", "fred", "2026-09-22", 0, 50, -50, 250, "DCOILWTICO 1986+: a 50 % y/y rise in crude has lifted headline CPI within two quarters (1990, 2008, 2021–22); the floor allows the −$37 print of 20 Apr 2020."),
  ...F("factor.f-dollar-broad-yoy", "% y/y", "fred", "2026-09-22", 0, 8, 80, 140, "DTWEXBGS 2006+: an 8 % y/y move is roughly one standard deviation of the broad index; import-price pass-through to CPI runs ~0.3 within a year (Gopinath 2015)."),
  ...F("factor.f-usdjpy-yoy", "% y/y", "fred", "2026-09-22", 0, 15, 70, 400, "DEXJPUS 1971+: 15 % yen weakness in a year is the level at which the MOF has intervened (1998, 2022, 2024, 2026); bounds span the post-Bretton-Woods range (~75 to ~360)."),
  ...F("factor.f-usdcny-yoy", "% y/y", "fred", "2026-09-22", 0, 6, 1, 10, "DEXCHUS 1981+: the fixing regime has tolerated ~6 % a year; the 1994 unification jump sits inside the bounds on the level (1.5 to 8.7)."),
  ...F("factor.f-foreign-share-debt", "% of debt", "fred", "2026-09-22", 30, 10, 0, 10_000_000, "FDHBFIN / GFDEBTN 1970+: the foreign-held share peaked near 34 % (2008–14) and has fallen toward 22 %; bounds on the numerator level in USD mn."),
  ...F("factor.f-debt-to-gdp", "% of GDP", "fred", "2026-09-22", 100, 30, 20, 200, "GFDEGDQ188S 1966+: 100 % is the level the CBO's long-term outlook treats as the fiscal-space threshold; the series ran 30–60 % until 2008."),
  ...F("factor.f-interest-outlays-gdp", "% of GDP", "fred", "2026-09-22", 2.5, 1.5, 0, 10, "FYOIGDA188S 1940+: net interest crossed 3 % of GDP in 2024 for the first time since 1998; the 1991 peak was 3.2 %."),
  ...F("factor.f-acm-term-premium", "pp", "nyfed-acm", "2026-09-22", 0.5, 1.0, -3, 6, "ACM 10-year term premium 1961+: long-run mean ≈ +1.5 pp, near zero or negative 2016–2024; a full point is the move the liquidation engine's mid impact case implies."),
  ...F("factor.f-soma-treasury", "USD bn", "nyfed-soma", "2026-09-22", 4000, 2000, 500, 10_000, "SOMA Treasury holdings 2003+: $0.7 tn pre-2008, $5.8 tn at the 2022 peak, ~$4 tn after QT; the span is the size of one QE programme."),
  ...F("factor.f-avg-interest-marketable", "%", "fiscaldata-debt", "2026-09-22", 2.5, 1.5, 0, 15, "Fiscal Data average interest rates 2001+: marketable debt paid ~1.5 % in 2021 and ~3.3 % by 2025; 2.5 % is the midpoint of the series' range."),
  ...F("factor.f-world-gdp-growth", "% y/y", "wb-wdi-api", "2026-09-22", 3, 2, -10, 10, "World Bank NY.GDP.MKTP.KD.ZG 1961+: world real growth averages ~3 %; below 1 % only in 1982, 2009 and 2020."),
  // ─── Backtest and scoring thresholds ──────────────────────────────────────
  { id: "factor.backtest.minN", value: 60, unit: "months", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Five years of monthly pairs before a lead can be called; below it the verdict stays pending, matching the pattern detector's full-marks sample size." },
  { id: "factor.backtest.minAbsR", value: 0.2, unit: "correlation", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "A lead correlation under 0.2 at the stated horizon explains under 4 % of the target's variance; such a factor is context, weight 0." },
  { id: "factor.backtest.minHitRate", value: 0.55, unit: "share", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Directional hit rate a coin flip clears half the time; 55 % over 60+ months is the floor for calling a factor a signal." },
  { id: "factor.backtest.neutralBand", value: 0.1, unit: "signal", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Signals inside ±0.1 are 'no view' and are not counted as directional calls in the hit rate." },
  { id: "factor.forecast.scale", value: 2.0, unit: "log-odds per unit signal", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "P(target moves the factor's way) = sigmoid(scale × signal): a full +1 signal reads as 88 %, a neutral one as 50 %; re-set from the running Brier once forecasts mature." },
  { id: "scoring.coinFlip", value: 0.25, unit: "Brier", kind: "threshold", source: "Brier (1950), Monthly Weather Review 78(1)", asOf: "1950-01-01", basis: "The Brier score of a constant 0.5 forecast; skill is reported as 1 − Brier / 0.25." },
  { id: "brief.maxChars", value: 7000, unit: "characters", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "≈ 1,750 tokens at four characters per token: the fixed budget the macro brief may take from Thomas's system prompt; the since-yesterday block is trimmed first, the model lines never." },
  { id: "brief.moverThresholdPct", value: 2, unit: "%", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "An indicator that moved less than 2 % since its previous stored reading is not a mover; keeps the block to what changed." },
  { id: "history.maxBytes", value: 5_000_000, unit: "bytes", kind: "threshold", source: "platform", asOf: "2026-09-22", basis: "Packet W8: a connector response above 5 MB is refused unread; the largest keyless history pulled (FRED DFF daily since 1954) is under 1 MB." },
  { id: "history.timeoutMs", value: 15_000, unit: "ms", kind: "threshold", source: "platform", asOf: "2026-09-22", basis: "Packet W8: fifteen seconds per fetch, one attempt; a slow host degrades to cached rows rather than holding the refresh." },
  { id: "history.maxDroppedShare", value: 0.05, unit: "share", kind: "threshold", source: "platform", asOf: "2026-09-22", basis: "If more than 5 % of parsed readings fail the plausibility bounds the whole pull is treated as a format change and nothing from it is stored." },
];
T.push(...FACTOR_ROWS);

// ─── Household layer: 25 cost-of-living and behaviour factors (owner's ask, 22 Sep 2026) ─
const HOUSEHOLD_FACTOR_ROWS: Assumption[] = [
  ...F("factor.h-vehicle-sales", "millions, annual rate", "fred", "2026-09-22", 16, 3, 5, 25, "TOTALSA 1976+: light-vehicle sales ran 15–18 m in expansions and fell below 12 m in 1982, 1991, 2009 and 2020; the owner's 'car sales for the year' indicator, monthly."),
  ...F("factor.h-new-home-sales-yoy", "% y/y", "fred", "2026-09-22", 0, 25, 200, 1500, "HSN1F 1963+: new single-family sales fall 25 % y/y ahead of most recessions; bounds on the level in thousands (annual rate)."),
  ...F("factor.h-existing-home-sales-yoy", "% y/y", "fred", "2026-09-22", 0, 20, 2_000_000, 8_000_000, "EXHOSLUSM495S: existing-home sales (NAR via FRED), the 'house purchases month by month' series; a 20 % y/y drop marked 1990, 2007 and 2022. Bounds on the annual-rate level."),
  ...F("factor.h-median-home-price-yoy", "% y/y", "fred", "2026-09-22", 4, 8, 15_000, 600_000, "MSPUS 1963+: median sales price of houses sold, quarterly; long-run growth ≈ 4 %, +8 pp is the 2021 pace; bounds on the level in dollars."),
  ...F("factor.h-mortgage-rate", "%", "fred", "2026-09-22", 6, 3, 2, 20, "MORTGAGE30US 1971+: the average 30-year fixed rate; 6 % is the fifty-year median, the 1981 peak was 18.6 %; the owner's 'average cost of the average mortgage' series."),
  ...F("factor.h-cpi-new-vehicles-yoy", "% y/y", "fred", "2026-09-22", 1, 4, 20, 250, "CUUR0000SETA01 1953+: new-vehicle CPI, the forty-year average-car-price record in index form; 2021–22 ran +12 % y/y."),
  ...F("factor.h-cpi-tuition-yoy", "% y/y", "fred", "2026-09-22", 5, 4, 20, 1000, "CUUR0000SEEB01 1978+: college tuition and fees CPI; averaged ~6 % a year for four decades, the highest of any major CPI component."),
  ...F("factor.h-cpi-food-away-yoy", "% y/y", "fred", "2026-09-22", 3, 3, 20, 500, "CUUR0000SEFV 1953+: food away from home CPI; the price of eating out, against the quantity the sales series measure."),
  ...F("factor.h-cpi-food-home-yoy", "% y/y", "fred", "2026-09-22", 2.5, 3, 20, 500, "CUUR0000SAF11 1952+: food at home CPI; the grocery bill's price component."),
  ...F("factor.h-saving-rate", "% of disposable income", "fred", "2026-09-22", 6, 4, 0, 40, "PSAVERT 1959+: households save more when they fear for their jobs (1975, 1982, 2009) and stop spending; the owner's 'people saving and not spending' indicator; the 2020 spike to 32 % sets the ceiling."),
  ...F("factor.h-food-services-sales-yoy", "% y/y", "fred", "2026-09-22", 5, 6, 10_000, 120_000, "RSFSDPN 1992+: retail sales at food services and drinking places, monthly, NSA; growth stalls into recessions. Bounds on the level in USD mn."),
  ...F("factor.h-grocery-vs-restaurants", "% (grocery ÷ restaurants × 100)", "fred", "2026-09-22", 105, 15, 10_000, 120_000, "RSGCSN ÷ RSFSDPN 1992+: when grocery sales outgrow restaurant sales families are eating at home — the owner's 'more people at fast food and low-end grocers' tell measured as a ratio; ~105 is the 2015–2019 norm, 2020 hit 150."),
  ...F("factor.h-general-merch-sales-yoy", "% y/y", "fred", "2026-09-22", 4, 5, 20_000, 100_000, "RSGMSN 1992+: general merchandise stores (warehouse clubs, supercenters, dollar stores); grows in downturns as shoppers trade down, so its y/y against total retail is the trade-down read."),
  ...F("factor.h-consumer-credit-yoy", "% y/y", "fred", "2026-09-22", 5, 5, 5_000, 6_000_000, "TOTALSL 1943+: total consumer credit; growth slows or turns negative into every recession (1980, 1991, 2009). Bounds on the level in USD mn."),
  ...F("factor.h-card-delinquency", "% of balances", "fred", "2026-09-22", 3, 2, 0, 15, "DRCCLACBS 1991+: credit-card delinquency rate at commercial banks, quarterly; rises a year before unemployment does; 2009 peaked at 6.8 %."),
  ...F("factor.h-consumer-loan-delinquency", "% of balances", "fred", "2026-09-22", 2.5, 1.5, 0, 10, "DRCLACBS 1987+: all consumer loans delinquent; the auto-loan stress read in a forty-year series."),
  ...F("factor.h-median-income-real-yoy", "% y/y", "fred", "2026-09-22", 1, 3, 40_000, 120_000, "MEHOINUSA672N 1984+: real median household income, annual; falls in and after recessions; bounds on the level in 2023 dollars."),
  ...F("factor.h-homeownership-rate", "%", "fred", "2026-09-22", 65, 3, 55, 75, "RHORUSQ156N 1965+: homeownership rate, quarterly; 65 % is the sixty-year mean, 69 % the 2004 peak; slow-moving, likely context."),
  ...F("factor.h-building-permits-yoy", "% y/y", "fred", "2026-09-22", 0, 25, 300, 3000, "PERMIT 1960+: building permits lead starts by two months and recessions by a year (Leamer 2007); bounds on the level in thousands."),
  ...F("factor.h-gasoline-price-yoy", "% y/y", "fred", "2026-09-22", 0, 30, 0.5, 7, "GASREGW 1990+: regular gasoline, weekly; a 30 % y/y rise passes into headline CPI within a quarter and into sentiment within a month; bounds in dollars per gallon."),
  ...F("factor.h-medical-cpi-yoy", "% y/y", "fred", "2026-09-22", 3.5, 3, 10, 700, "CPIMEDSL 1947+: medical care CPI, the second-fastest-rising household line after tuition."),
  ...F("factor.h-rent-cpi-yoy", "% y/y", "fred", "2026-09-22", 3, 3, 5, 500, "CUUR0000SEHA 1914+: rent of primary residence CPI; a third of core CPI and the longest household price record on FRED."),
  ...F("factor.h-case-shiller-yoy", "% y/y", "fred", "2026-09-22", 4, 8, 50, 400, "CSUSHPINSA 1987+: national home price index; ran +20 % in 2021 and −12 % in 2009; bounds on the index level."),
  ...F("factor.h-durable-goods-yoy", "% y/y", "fred", "2026-09-22", 4, 6, 20, 3000, "PCEDG 1959+: spending on durables (cars, appliances, furniture) is the first thing households defer; bounds on the level in USD bn."),
  ...F("factor.h-revolving-credit-yoy", "% y/y", "fred", "2026-09-22", 5, 6, 1000, 1_500_000, "REVOLSL 1968+: revolving (card) credit; a surge with a falling saving rate means households are borrowing to hold spending, the late-cycle pattern of 2007 and 2023; bounds on the level in USD mn."),
  // ─── College cost estimator (baselines verified 2026-09-22 against Trends in College Pricing and Student Aid 2025 and the Federal Student Aid rates page; packet W10) ─
  { id: "college.publicInState.tuitionFees", value: 11_950, unit: "USD per year", kind: "rate", source: "college-board-trends", asOf: "2025-11-05", basis: "Verified 2026-09-22: Trends in College Pricing and Student Aid 2025 (College Board, dated November 2025), Table CP-1 (p. 10), average published tuition and fees, public four-year in-state, 2025-26. https://research.collegeboard.org/media/pdf/Trends-in-College-Pricing-and-Student-Aid-2025-final_1.pdf" },
  { id: "college.publicInState.roomBoard", value: 13_900, unit: "USD per year", kind: "rate", source: "college-board-trends", asOf: "2025-11-05", basis: "Verified 2026-09-22: same release, Table CP-1 (p. 10), housing and food, public four-year, 2025-26. https://research.collegeboard.org/media/pdf/Trends-in-College-Pricing-and-Student-Aid-2025-final_1.pdf" },
  { id: "college.publicOutOfState.tuitionFees", value: 31_880, unit: "USD per year", kind: "rate", source: "college-board-trends", asOf: "2025-11-05", basis: "Verified 2026-09-22: same release, Table CP-1 (p. 10), public four-year out-of-state tuition and fees, 2025-26. https://research.collegeboard.org/media/pdf/Trends-in-College-Pricing-and-Student-Aid-2025-final_1.pdf" },
  { id: "college.privateNonprofit.tuitionFees", value: 45_000, unit: "USD per year", kind: "rate", source: "college-board-trends", asOf: "2025-11-05", basis: "Verified 2026-09-22: same release, Table CP-1 (p. 10), private nonprofit four-year tuition and fees, 2025-26. https://research.collegeboard.org/media/pdf/Trends-in-College-Pricing-and-Student-Aid-2025-final_1.pdf" },
  { id: "college.privateNonprofit.roomBoard", value: 15_920, unit: "USD per year", kind: "rate", source: "college-board-trends", asOf: "2025-11-05", basis: "Verified 2026-09-22: same release, Table CP-1 (p. 10), private nonprofit four-year housing and food, 2025-26. https://research.collegeboard.org/media/pdf/Trends-in-College-Pricing-and-Student-Aid-2025-final_1.pdf" },
  { id: "college.booksSupplies", value: 1_330, unit: "USD per year", kind: "rate", source: "college-board-trends", asOf: "2025-11-05", basis: "Verified 2026-09-22: same release, Figure CP-1 (p. 11), books and supplies budget component, public four-year on-campus, 2025-26 (course materials 1,000 + other supplies 330; private nonprofit is 1,340). https://research.collegeboard.org/media/pdf/Trends-in-College-Pricing-and-Student-Aid-2025-final_1.pdf" },
  { id: "college.otherExpenses", value: 3_810, unit: "USD per year", kind: "rate", source: "college-board-trends", asOf: "2025-11-05", basis: "Verified 2026-09-22: same release, Figure CP-1 (p. 11), transportation 1,380 + other expenses 2,430, public four-year on-campus, 2025-26 (private nonprofit is 1,190 + 2,020 = 3,210). https://research.collegeboard.org/media/pdf/Trends-in-College-Pricing-and-Student-Aid-2025-final_1.pdf" },
  { id: "college.growth.tuition", value: 5.5, unit: "% per year", kind: "rate", source: "fred", asOf: "2026-09-22", basis: "CUUR0000SEEB01 1978–2025 compound growth ≈ 5.6 % a year; to be re-based from the stored history after the first pull (the 529 planner's 5.8 % default is the same figure over a shorter window)." },
  { id: "college.growth.roomBoard", value: 4.0, unit: "% per year", kind: "rate", source: "fred", asOf: "2026-09-22", basis: "Room and board has tracked rent CPI plus ~1 pp since 1990; re-base from NCES 330.10 on review." },
  { id: "college.loan.undergradRate", value: 6.52, unit: "% fixed", kind: "rate", source: "studentaid-rates", asOf: "2026-07-01", basis: "Verified 2026-09-22: Federal Student Aid, 'Current Federal Interest Rates' table, Direct Subsidized/Unsubsidized undergraduate rate for loans first disbursed 1 Jul 2026 – 30 Jun 2027 (the page's current window on the read date; the 2025-26 window is now under 'Previous Years' Interest Rates'). https://studentaid.gov/understand-aid/types/loans/interest-rates" },
  { id: "college.loan.parentPlusRate", value: 9.07, unit: "% fixed", kind: "rate", source: "studentaid-rates", asOf: "2026-07-01", basis: "Verified 2026-09-22: same page and table, Direct PLUS rate (parents and graduate/professional), loans first disbursed 1 Jul 2026 – 30 Jun 2027. https://studentaid.gov/understand-aid/types/loans/interest-rates" },
  { id: "college.loan.originationFeePct", value: 1.057, unit: "% of principal", kind: "rate", source: "studentaid-rates", asOf: "2025-07-01", basis: "Verified 2026-09-22: same page, 'Loan Fees for Direct Subsidized Loans and Direct Unsubsidized Loans' table, loans first disbursed on or after 1 Oct 2020 and before 1 Oct 2027 (Direct PLUS fee is 4.228 %). https://studentaid.gov/understand-aid/types/loans/interest-rates" },
  { id: "college.loan.termYears", value: 10, unit: "years", kind: "threshold", source: "studentaid-rates", asOf: "2025-07-01", basis: "Standard repayment plan term." },
  { id: "college.opportunity.rate", value: 6, unit: "% per year", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "The owner's stated compounding rate for the opportunity cost of every dollar sent to a lender instead of an account; a slider on the page." },
  // ─── Relative wealth: Survey of Consumer Finances 2022 reference table (verified 2026-09-22 against the Fed's October 2023 bulletin, Tables 1 and 2; packet W10) ─
  { id: "scf.netWorth.median.u35", value: 39_000, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: Changes in U.S. Family Finances from 2019 to 2022 (Federal Reserve Board, October 2023), Table 2, median net worth, age of reference person less than 35, 2022 survey, thousands of 2022 dollars (39.0). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.median.35-44", value: 135_600, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, 35–44 (135.6). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.median.45-54", value: 247_200, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, 45–54 (247.2). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.median.55-64", value: 364_500, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, 55–64 (364.5). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.median.65-74", value: 409_900, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, 65–74 (409.9). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.median.75plus", value: 335_600, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, 75 or more (335.6). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.mean.u35", value: 183_500, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, mean net worth, less than 35 (183.5). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.mean.35-44", value: 549_600, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, mean, 35–44 (549.6). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.mean.45-54", value: 975_800, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, mean, 45–54 (975.8). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.mean.55-64", value: 1_566_900, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, mean, 55–64 (1,566.9). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.mean.65-74", value: 1_794_600, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, mean, 65–74 (1,794.6). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.mean.75plus", value: 1_624_100, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, mean, 75 or more (1,624.1). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.income.median.u35", value: 60_500, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same bulletin, Table 1, median before-tax family income, age of reference person less than 35, 2022 survey, thousands of 2022 dollars (60.5). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.income.median.35-44", value: 85_900, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 1, 35–44 (85.9; the typed 86.5 was wrong). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.income.median.45-54", value: 91_900, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 1, 45–54 (91.9). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.income.median.55-64", value: 81_900, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 1, 55–64 (81.9; the typed 82.3 was wrong). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.income.median.65-74", value: 60_900, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 1, 65–74 (60.9; the typed 68.7 was wrong). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.income.median.75plus", value: 49_100, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 1, 75 or more (49.1; the typed 51.8 was wrong). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.median.all", value: 192_900, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, all families, median net worth, 2022 (192.9). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "scf.netWorth.mean.all", value: 1_063_700, unit: "USD", kind: "rate", source: "fed-scf", asOf: "2023-10-18", basis: "Verified 2026-09-22: same Table 2, all families, mean net worth, 2022 (1,063.7). https://www.federalreserve.gov/publications/files/scf23.pdf" },
  { id: "census.income.median.all", value: 87_460, unit: "USD", kind: "rate", source: "census-acs", asOf: "2026-09-15", basis: "Verified 2026-09-22: Census Bureau, Income in the United States: 2025 (P60-286's successor, P60-289, released 15 Sep 2026), Highlights, Figure 1 and Table 1: median household income 87,460 in 2025 (2024 restated as 85,210 in 2025 dollars). https://www.census.gov/library/publications/2026/demo/p60-289.html" },
  { id: "relwealth.experience.fullYears", value: 20, unit: "years", kind: "model-choice", source: "platform", asOf: "2026-09-22", basis: "Years in a profession at which a peer is assumed to have reached the age bracket's typical net-worth-to-income multiple; fewer years scale the peer expectation down, never below half." },
];
T.push(...HOUSEHOLD_FACTOR_ROWS);

export const MACRO_ASSUMPTIONS: ReadonlyMap<string, Assumption> = new Map(T.map(a => [a.id, a]));

/** Read a coefficient. Throws on an unknown id so a typo fails loudly in tests, never silently in production arithmetic. */
export function A(id: string): number {
  const a = MACRO_ASSUMPTIONS.get(id);
  if (!a) throw new Error(`Unknown macro assumption: ${id}`);
  return a.value;
}

/** The full row, for the evidence ledger. */
export function assumption(id: string): Assumption {
  const a = MACRO_ASSUMPTIONS.get(id);
  if (!a) throw new Error(`Unknown macro assumption: ${id}`);
  return a;
}

/** Every assumption whose id starts with a prefix, for a section's ledger. */
export function assumptionsFor(prefix: string): Assumption[] {
  return Array.from(MACRO_ASSUMPTIONS.values()).filter(a => a.id.startsWith(prefix));
}

/** One line per assumption, for a page footer or a PDF. */
export function citeAssumptions(prefix: string): string[] {
  return assumptionsFor(prefix).map(a => `${a.id} = ${a.value} ${a.unit} — ${a.source} (as of ${a.asOf}). ${a.basis}`);
}
