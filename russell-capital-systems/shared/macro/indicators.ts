/**
 * Indicator Panels — what the confidence models actually watch.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Four panels:
 *   • JAPAN_LIQUIDATION   — will Japan sell Treasuries, and how much (15)
 *   • CHINA_LIQUIDATION   — will China sell Treasuries / U.S. assets (9)
 *   • PETRODOLLAR_RIPPLE  — forty-four indicators around oil leaving the dollar
 *   • TAIWAN_STRIKE       — thirty-nine indicators around a strike or blockade
 *
 * The China-side rows are read only through U.S. and allied publishers (TIC,
 * IMF IFS, OFAC, FRED, Kpler, UN, USDA, SIPRI, DoD, CSIS). Rows that could only
 * be read from a Chinese government, Party, state-media or .cn/.hk site were
 * removed on 23 Sep 2026 (owner's order): the Politburo/MFA/MOFCOM/NPC/TAO
 * statement counts, CIPS, INE, SGE, PBOC swap lines and SAFE balance of payments.
 *
 * Each row is sourced (ids from sources.ts), directional, weighted, and tagged
 * with an awareness level. "latent" rows are the ones no one talks about; the
 * emergent-pattern detector promotes or demotes them from data.
 */
import type { Cadence, Direction, Domain, FactorSpec, Indicator } from "./types";
import { GLOBAL_POLICY } from "./indicatorsExpansion";
import { A } from "./assumptions";

type Aw = Indicator["awareness"];

function ind(
  id: string,
  name: string,
  domain: Domain,
  direction: Direction,
  weight: number,
  sourceIds: string[],
  unit: string,
  cadence: Cadence,
  awareness: Aw,
  rationale: string,
): Indicator {
  return { id, name, domain, direction, weight, sourceIds, unit, cadence, awareness, rationale };
}

// ═══════════════════════════════════════════════════════════════════════════
// JAPAN — will it liquidate, how much, how fast
// ═══════════════════════════════════════════════════════════════════════════
export const JAPAN_LIQUIDATION: Indicator[] = [
  ind("jp-tic-mom", "Japan TIC holdings, 3-month change", "treasury-holdings", "risk-up", 1.0, ["us-tic-mfh"], "USD bn", "monthly", "visible",
    "The measured fact. −$12.8 bn in July 2026, third straight monthly fall."),
  ind("jp-reserves-foreign-securities", "MOF 'foreign securities' reserve line, monthly change", "japan-policy", "risk-up", 0.95, ["jp-mof-reserves"], "USD bn", "monthly", "structural",
    "Fell $87.8 bn in Aug 2026 against a $98.6 bn intervention — the fingerprint of Treasury sales."),
  ind("jp-intervention-yen", "Confirmed yen-buying intervention, trailing 3 months", "japan-policy", "risk-up", 0.9, ["jp-mof-intervention"], "JPY tn", "monthly", "visible",
    "Intervention must be funded; when reserves are the source, Treasuries are sold."),
  ind("jp-usdjpy-vs-line", "USD/JPY distance to the last intervention level", "reserves-fx", "risk-up", 0.7, ["fred"], "yen", "daily", "visible",
    "Within a few yen of 155.28 keeps the next round live."),
  ind("jp-jgb10y", "10-year JGB yield", "rates-markets", "risk-up", 0.8, ["jp-mof-jgb"], "%", "daily", "structural",
    "At 3 % (Sept 2026) domestic paper competes with hedged Treasuries for the first time in three decades."),
  ind("jp-hedged-ust-carry", "Hedged 10-year Treasury yield minus 10-year JGB", "rates-markets", "risk-down", 0.85, ["fred", "jp-mof-jgb"], "pp", "daily", "latent",
    "When the FX-hedged carry is negative, insurers and banks are structural sellers regardless of policy."),
  ind("jp-lifers-foreign-bond-flow", "Life insurers' net foreign long-term bond purchases", "japan-policy", "risk-up", 0.75, ["jp-mof-portfolio-flows", "jp-life-insurers"], "JPY bn", "weekly", "structural",
    "Sold ¥137 bn in Aug 2026; nine majors' semiannual plans lead this by a quarter."),
  ind("jp-banks-foreign-bond-flow", "Banks' net foreign bond purchases", "japan-policy", "risk-up", 0.6, ["jp-mof-portfolio-flows", "jp-boj-stats"], "JPY bn", "weekly", "structural",
    "Regional banks unwind unhedged Treasuries fastest when JGBs pay."),
  ind("jp-boj-policy-rate-path", "BOJ policy rate expected 12 months out", "japan-policy", "risk-up", 0.7, ["jp-boj-mpm"], "%", "irregular", "visible",
    "Fitch (Sept 2026) expects faster hikes than priced; every 25 bp at home is a reason to repatriate."),
  ind("jp-gpif-foreign-bond-weight", "GPIF foreign bond allocation vs 25 % target", "japan-policy", "risk-up", 0.4, ["jp-gpif"], "pp over target", "quarterly", "structural",
    "Rebalancing sells whichever asset ran ahead; a strong dollar makes foreign bonds the sale."),
  ind("jp-fima-usage", "FIMA repo facility draw attributable to Japan", "treasury-holdings", "risk-down", 0.5, ["fed-fima"], "USD bn", "weekly", "latent",
    "Borrowing dollars against Treasuries substitutes for selling them; the minister named the route in Sept 2026."),
  ind("jp-us-coordination", "Joint or U.S.-endorsed intervention in trailing 6 months", "japan-policy", "risk-down", 0.5, ["jp-mof-minister", "us-tic-press"], "count", "irregular", "structural",
    "Washington's endorsement comes with quiet limits on how the yen purchases are funded."),
  ind("jp-fed-custody-japan-proxy", "Fed H.4.1 foreign official custody, weekly change", "treasury-holdings", "risk-up", 0.6, ["fed-h41"], "USD bn", "weekly", "latent",
    "Four weeks ahead of TIC; a sustained custody fall during yen strength is Japan."),
  ind("jp-diet-reserve-debate", "Diet / minister statements questioning reserve composition", "japan-policy", "risk-up", 0.45, ["jp-diet", "jp-mof-minister", "jp-kantei"], "statements / month", "weekly", "structural",
    "Political cover precedes policy. Count only official transcripts."),
  ind("jp-law-mandate", "Enacted law, ordinance or mandate touching reserves or intervention", "japan-policy", "risk-up", 0.8, ["jp-egov-law", "jp-diet"], "count", "daily", "visible",
    "Anything put into law outranks anything said. Weighted high; usually zero."),
];

// ═══════════════════════════════════════════════════════════════════════════
// CHINA — will it liquidate Treasuries or dump U.S. assets
// ═══════════════════════════════════════════════════════════════════════════
export const CHINA_LIQUIDATION: Indicator[] = [
  ind("cn-tic-mom", "China TIC holdings, 3-month change", "treasury-holdings", "risk-up", 1.0, ["us-tic-mfh"], "USD bn", "monthly", "visible",
    "$618.0 bn in July 2026, lowest since Sept 2008; −$33 bn over three months."),
  ind("cn-tic-plus-belgium-hk", "China + Belgium (Euroclear) + Hong Kong holdings, 3-month change", "treasury-holdings", "risk-up", 0.8, ["us-tic-mfh"], "USD bn", "monthly", "latent",
    "Beijing custodies through Euroclear; the headline series understates both the stock and the selling."),
  ind("cn-pboc-gold-streak", "Consecutive months of rising official gold holdings, China row of IMF IFS", "reserves-fx", "risk-up", 0.7, ["imf-ifs"], "months", "monthly", "visible",
    "Revealed preference for a sanction-proof asset, read from the IMF's table rather than Beijing's own release."),
  ind("cn-safe-reserves-change", "China FX reserves (IMF IFS), monthly change net of valuation", "reserves-fx", "risk-up", 0.6, ["imf-ifs"], "USD bn", "monthly", "structural",
    "A fall with a flat dollar is a sale."),
  ind("cn-agency-mbs-holdings", "China's U.S. agency and MBS holdings", "treasury-holdings", "risk-up", 0.5, ["us-tic-press"], "USD bn", "monthly", "latent",
    "Agencies were sold before Treasuries in 2022–24; the leading edge of a broader U.S.-asset exit."),
  ind("cn-us-sanction-escalation", "New U.S. financial sanctions on Chinese banks / entities, trailing 90 days", "china-policy", "risk-up", 0.85, ["ofac"], "count", "daily", "visible",
    "Rhodium: sanctions on the largest banks put $3 tn of flows at risk; the asset-freeze precedent (Russia 2022) is the thing Beijing plans against."),
  ind("cn-cny-pressure", "CNY fixing vs onshore spot gap and reserve defence", "reserves-fx", "risk-up", 0.6, ["fred"], "bp", "daily", "structural",
    "Defending the yuan is the one reason China has actually sold Treasuries (2015–16, $500 bn)."),
  ind("cn-taiwan-tension-link", "Taiwan strike-risk composite (cross-model)", "taiwan-risk", "risk-up", 0.7, ["tw-mnd-daily"], "probability", "daily", "structural",
    "A blockade with sanctions makes pre-emptive Treasury sales rational; the two models share this node."),
  ind("cn-ust-share-of-reserves", "Treasuries as share of China's reserves (TIC over IMF IFS, estimated)", "treasury-holdings", "risk-down", 0.4, ["us-tic-mfh", "imf-ifs"], "%", "monthly", "latent",
    "Under 20 % now; the lower it goes, the less any further sale can move the market — and the less deterrent the threat carries."),
];

// ═══════════════════════════════════════════════════════════════════════════
// PETRODOLLAR RIPPLE — forty-four indicators around oil settled outside the dollar
// ═══════════════════════════════════════════════════════════════════════════
const P = "oil-settlement" as const;
const R = "reserves-fx" as const;
const M = "rates-markets" as const;
export const PETRODOLLAR_RIPPLE: Indicator[] = [
  // Core measurement (1–8)
  ind("oil-nonusd-share", "Share of global crude trade settled outside USD", P, "risk-up", 1.0, ["jpm-research", "atlantic-council-dollar", "carnegie"], "%", "quarterly", "visible", "~20 % Q1 2026 vs ~5 % in 2014. Contested range 15–22 %."),
  ind("oil-cny-share", "Share settled in CNY", P, "risk-up", 0.9, ["platts", "swift-rmb-tracker"], "%", "quarterly", "visible", "4–9 % range; Saudi–China corridor 45 % yuan by Feb 2026."),
  ind("oil-rub-share", "Share settled in RUB", P, "risk-up", 0.5, ["ru-cbr"], "%", "monthly", "structural", "~4 %; sanctions-driven, could reverse on a settlement."),
  ind("oil-inr-share", "Share settled in INR / via Vostro", P, "risk-up", 0.5, ["in-rbi", "in-ppac"], "%", "monthly", "structural", "~3 %; India–Russia corridor."),
  ind("oil-aed-gcc-share", "Share settled in AED and other GCC currencies", P, "risk-up", 0.6, ["ae-cbuae", "sa-sama"], "%", "quarterly", "structural", "~2.5 %; the UAE's April 2026 warning is the swing factor."),
  ind("oil-eur-share", "Share settled in EUR", P, "risk-up", 0.3, ["bis-triennial"], "%", "irregular", "structural", "~2.5 %, flat — Europe is not the story."),
  ind("oil-barter-share", "Barter / gold / crypto settlement share", P, "risk-up", 0.3, ["kpler", "ofac"], "%", "quarterly", "latent", "~1 %; the Iran–Venezuela–Russia dark share."),
  ind("oil-sanctioned-volume", "Sanctioned-origin crude volume (RU+IR+VE)", P, "risk-up", 0.8, ["kpler", "vortexa", "ofac"], "mb/d", "monthly", "structural", "The non-dollar share is mostly the sanctioned share."),
  // Plumbing (9–16)
  ind("swift-cny-share", "SWIFT payments share in CNY", P, "risk-up", 0.5, ["swift-rmb-tracker"], "%", "monthly", "visible", "Understates because CIPS traffic is excluded."),
  ind("mbridge-volume", "mBridge / BRICS payment-system transaction volume", P, "risk-up", 0.5, ["brics-ndb"], "USD bn", "quarterly", "structural", ""),
  ind("gulf-yuan-swap-usage", "Gulf central bank yuan swap-line usage", P, "risk-up", 0.6, ["ae-cbuae", "sa-sama"], "CNY bn", "monthly", "latent", "Drawn lines mean real yuan invoicing."),
  // Reserve behaviour (17–24)
  ind("cofer-usd-share", "USD share of allocated reserves", R, "risk-up", 0.9, ["imf-cofer"], "%", "quarterly", "visible", "56.3 % Q1 2026 from 71 % in 2000."),
  ind("cofer-cny-share", "CNY share of reserves", R, "risk-up", 0.5, ["imf-cofer"], "%", "quarterly", "visible", "3.1 % Q1 2026."),
  ind("cb-gold-purchases", "Central bank net gold purchases, trailing 4 quarters", R, "risk-up", 0.8, ["imf-cofer"], "t", "quarterly", "visible", "289 t in Q2 2026 alone."),
  ind("gold-share-of-reserves", "Gold share of global reserves at market value", R, "risk-up", 0.6, ["imf-cofer"], "%", "quarterly", "structural", ""),
  ind("gulf-ust-holdings", "Saudi + UAE + Kuwait + Qatar Treasury holdings", R, "risk-down", 0.6, ["us-tic-mfh"], "USD bn", "monthly", "structural", "Petrodollar recycling measured directly."),
  ind("oil-exporter-reserve-mix", "Oil exporters' non-USD reserve share (where disclosed)", R, "risk-up", 0.4, ["sa-sama", "ae-cbuae", "ru-cbr"], "%", "annual", "latent", ""),
  ind("foreign-official-ust-flow", "Foreign official net Treasury purchases, 12-month", R, "risk-down", 0.8, ["us-tic-press"], "USD bn", "monthly", "structural", "+$10.2 bn official in July 2026 vs $73.5 bn private."),
  ind("fed-custody-total", "Fed custody for foreign officials, total", R, "risk-down", 0.5, ["fed-h41"], "USD bn", "weekly", "latent", ""),
  // Market transmission (25–36)
  ind("dxy", "Broad dollar index (DTWEXBGS)", M, "risk-down", 0.6, ["fred"], "index", "daily", "visible", "A rising dollar during de-dollarisation is the paradox the model must hold."),
  ind("ust10y", "10-year Treasury yield", M, "risk-up", 0.8, ["fred"], "%", "daily", "visible", "4.95 % on 11 Sept 2026, highest since 2023."),
  ind("ust-term-premium", "10-year term premium (ACM)", M, "risk-up", 0.7, ["fred"], "pp", "daily", "structural", "Where lost foreign demand shows up first."),
  ind("ust-indirect-bid", "Indirect bidder share at 10y/30y auctions, 6-auction average", M, "risk-down", 0.7, ["us-treasury-auctions"], "%", "weekly", "structural", ""),
  ind("mortgage30y", "30-year fixed mortgage rate", M, "risk-up", 0.5, ["fred"], "%", "weekly", "visible", "The household transmission channel."),
  ind("breakeven10y", "10-year inflation breakeven", M, "risk-up", 0.5, ["fred"], "%", "daily", "structural", ""),
  ind("gold-usd", "Gold price in USD", M, "risk-up", 0.6, ["fred"], "USD/oz", "daily", "visible", ""),
  ind("gold-oil-ratio", "Barrels of oil per ounce of gold", M, "risk-up", 0.4, ["fred", "eia-api"], "bbl/oz", "daily", "latent", "A rising ratio during flat oil = gold is being monetised."),
  ind("brent-wti-spread", "Brent–WTI spread", M, "risk-up", 0.3, ["eia-api"], "USD", "daily", "latent", "Widens when seaborne (non-dollar-prone) crude is bid separately."),
  ind("urals-brent-discount", "Urals discount to Brent", M, "risk-up", 0.4, ["argus"], "USD", "daily", "structural", "The price of settling outside the dollar, observed."),
  ind("usdcny", "USD/CNY", M, "risk-down", 0.4, ["fred"], "rate", "daily", "visible", ""),
  ind("us-net-interest-share", "U.S. net interest as share of federal revenue", M, "risk-up", 0.6, ["us-fiscaldata", "cbo"], "%", "monthly", "structural", "The reason lost foreign demand matters more each year."),
  // Volumes and corridors (37–44)
  ind("cn-crude-imports-ru", "China crude imports from Russia", P, "risk-up", 0.6, ["kpler", "un-comtrade"], "mb/d", "monthly", "structural", ""),
  ind("cn-crude-imports-sa", "China crude imports from Saudi Arabia", P, "risk-up", 0.5, ["sa-aramco"], "mb/d", "monthly", "structural", "China buys ~35 % of Saudi crude."),
  ind("cn-crude-imports-ir", "China crude imports from Iran (incl. via Malaysia)", P, "risk-up", 0.5, ["kpler"], "mb/d", "monthly", "latent", ""),
  ind("in-crude-imports-ru", "India crude imports from Russia", P, "risk-up", 0.5, ["in-ppac"], "mb/d", "monthly", "structural", ""),
  ind("saudi-yuan-export-share", "Share of Saudi crude exports settled in yuan", P, "risk-up", 0.8, ["sa-sama", "cnbc-reuters-energy"], "%", "quarterly", "visible", "12–15 % (2026 estimates)."),
  ind("me-nonusd-crossborder", "Middle East cross-border transactions in non-USD", P, "risk-up", 0.6, ["swift-rmb-tracker", "ae-cbuae"], "%", "quarterly", "structural", "18 % → 31 % Dec 2025–Mar 2026 (one estimate)."),
  ind("hormuz-transit", "Strait of Hormuz tanker transits", P, "risk-up", 0.5, ["ais-marinetraffic", "lloyds-jwc"], "transits / day", "daily", "visible", "The 2026 Iran conflict re-routed both barrels and settlement."),
  ind("shadow-fleet-count", "Shadow-fleet tankers active", P, "risk-up", 0.5, ["kpler", "ofac"], "vessels", "monthly", "structural", ""),
  // Policy and law (45–50)
  ind("brics-settlement-commitment", "BRICS declarations with concrete settlement mechanisms", P, "risk-up", 0.4, ["brics-ndb"], "count", "annual", "visible", ""),
  ind("uae-oil-currency-statements", "UAE official statements on shifting oil settlement", P, "risk-up", 0.6, ["ae-cbuae", "cnbc-reuters-energy"], "count", "irregular", "visible", "April 2026 warning to the U.S. Treasury."),
  ind("saudi-brics-status", "Saudi Arabia's BRICS participation status", P, "risk-up", 0.4, ["brics-ndb"], "ordinal", "annual", "structural", ""),
  ind("us-secondary-sanctions", "New U.S. secondary sanctions on oil intermediaries", P, "risk-up", 0.6, ["ofac"], "count / quarter", "daily", "structural", "Each round pushes a corridor out of the dollar."),
  ind("ru-export-currency-decree", "Russian decrees on export settlement currency", P, "risk-up", 0.4, ["ru-cbr"], "count", "irregular", "structural", ""),
];

// ═══════════════════════════════════════════════════════════════════════════
// TAIWAN STRIKE — thirty-nine indicators, direct and indirect
// ═══════════════════════════════════════════════════════════════════════════
const T = "taiwan-risk" as const;
export const TAIWAN_STRIKE: Indicator[] = [
  // Military activity (1–12)
  ind("tw-pla-aircraft-30d", "PLA aircraft around Taiwan, 30-day total", T, "risk-up", 0.9, ["tw-mnd-daily"], "sorties", "daily", "visible", ""),
  ind("tw-pla-ships-30d", "PLA navy + CCG ships around Taiwan, 30-day total", T, "risk-up", 0.9, ["tw-mnd-daily", "tw-cga"], "vessels", "daily", "visible", "Record 244 in July 2026."),
  ind("tw-median-line-crossings", "Median-line crossings, 30-day", T, "risk-up", 0.7, ["tw-mnd-daily"], "count", "daily", "structural", ""),
  ind("tw-large-exercise", "Named large-scale exercise in trailing 90 days", T, "risk-up", 0.8, ["csis-china-power"], "count", "irregular", "visible", "Seven since Aug 2022; Justice Mission 2025 rehearsed a blockade."),
  ind("tw-exercise-duration-trend", "Average exercise duration, trailing 4", T, "risk-up", 0.5, ["csis-china-power"], "days", "irregular", "structural", ""),
  ind("tw-kinmen-cga-incursions", "CCG incursions into Kinmen/Matsu restricted waters, 30-day", T, "risk-up", 0.6, ["tw-cga"], "count", "daily", "structural", "Quarantine rehearsal at small scale."),
  ind("tw-miyako-transits", "PLAN carrier / task-group Miyako Strait transits, 90-day", T, "risk-up", 0.5, ["jp-mod-taiwan"], "count", "daily", "latent", "The northern flank."),
  ind("tw-amphibious-lift", "PLA amphibious lift capacity (DoD estimate)", T, "risk-up", 0.6, ["us-dod-cmpr"], "brigades", "annual", "structural", ""),
  ind("tw-roro-ferry-mobilisation", "Civilian RO-RO ferry mobilisation exercises", T, "risk-up", 0.5, ["us-dod-cmpr", "csis-china-power"], "count / year", "irregular", "latent", "The lift the navy lacks comes from civilian ferries."),
  ind("tw-cable-cuts", "Undersea cable incidents near Taiwan, 12-month", T, "risk-up", 0.5, ["tw-cga"], "count", "irregular", "structural", ""),
  ind("tw-balloons-drones", "Balloon / drone overflights, 30-day", T, "risk-up", 0.3, ["tw-mnd-daily"], "count", "daily", "structural", ""),
  ind("tw-pla-readiness-milestone", "PLA modernisation milestone statements (2027 benchmark)", T, "risk-up", 0.5, ["us-dod-cmpr"], "ordinal", "annual", "visible", ""),
  // Political signalling (13–22)
  ind("tw-us-arms-sale", "U.S. arms sales notifications to Taiwan, 90-day", T, "risk-up", 0.4, ["us-odni-ata"], "count", "irregular", "structural", "Each triggers a response cycle."),
  ind("tw-us-official-visits", "Senior U.S. official visits to Taiwan, 90-day", T, "risk-up", 0.4, ["csis-china-power"], "count", "irregular", "visible", ""),
  ind("tw-mac-poll-independence", "Taiwan public support for independence (MAC poll)", T, "risk-up", 0.3, ["tw-mac"], "%", "quarterly", "structural", ""),
  ind("tw-election-cycle", "Months to next Taiwan presidential election", T, "risk-up", 0.3, ["tw-mac"], "months", "annual", "structural", "Pressure peaks around elections."),
  ind("tw-odni-assessment", "U.S. ODNI stated judgement on invasion timeline", T, "risk-down", 0.7, ["us-odni-ata"], "ordinal", "annual", "visible", "2026: no fixed timeline; invasion seen as high-risk."),
  // Economic preparation (23–34) — these are the ones below public awareness
  ind("tw-cn-gold-purchases", "China official gold additions, IMF IFS (cross-model)", T, "risk-up", 0.5, ["imf-ifs"], "t / month", "monthly", "latent", "Sanction-proofing reserves is what you do before you need it."),
  ind("tw-cn-ust-reduction", "China Treasury reduction pace (cross-model)", T, "risk-up", 0.5, ["us-tic-mfh"], "USD bn / quarter", "monthly", "latent", ""),
  ind("tw-cn-food-stockpiles", "China grain and soybean stockpile builds", T, "risk-up", 0.4, ["usda-psd"], "months of cover", "quarterly", "latent", "Blockade-proofing."),
  ind("tw-cn-spr-fill", "China strategic petroleum reserve fill rate", T, "risk-up", 0.5, ["kpler"], "mb / month", "monthly", "latent", ""),
  ind("tw-cn-defence-budget-growth", "PRC defence budget growth", T, "risk-up", 0.4, ["sipri-milex", "us-dod-cmpr"], "%", "annual", "visible", ""),
  ind("tw-cn-domestic-stress", "PRC domestic economic stress composite (property, youth unemployment)", T, "risk-up", 0.3, ["imf-article-iv"], "index", "monthly", "structural", "Diversionary-war hypothesis; weighted low, contested."),
  ind("tw-cn-purge-pla-leadership", "Senior PLA leadership removals, 12-month", T, "risk-down", 0.4, ["us-dod-cmpr"], "count", "irregular", "structural", "Purges degrade near-term readiness."),
  // Market and insurance tells (35–44)
  ind("tw-lloyds-listing", "Lloyd's JWC listing of Taiwan Strait waters", T, "risk-up", 0.7, ["lloyds-jwc"], "ordinal", "irregular", "structural", "The insurance market moves before ships."),
  ind("tw-war-risk-premium", "Marine war-risk premium, Taiwan routes", T, "risk-up", 0.6, ["lloyds-jwc", "ais-marinetraffic"], "% of hull", "weekly", "structural", ""),
  ind("tw-twd-reserves", "Taiwan CBC reserve change / TWD defence", T, "risk-up", 0.4, ["tw-cbc"], "USD bn", "monthly", "structural", "Capital flight tell."),
  ind("tw-taiex-vs-msci", "TAIEX relative to MSCI World, 3-month", T, "risk-up", 0.3, ["fred"], "%", "daily", "visible", ""),
  ind("tw-tsmc-adr-premium", "TSMC ADR premium/discount to Taipei line", T, "risk-up", 0.3, ["tw-tsmc"], "%", "daily", "latent", ""),
  ind("tw-prediction-market", "Prediction-market probability of blockade within 12 months", T, "risk-up", 0.4, ["polymarket-taiwan"], "%", "realtime", "visible", "Leads, never confirms."),
  ind("tw-cn-cds", "China 5-year sovereign CDS", T, "risk-up", 0.3, ["cds-markit"], "bp", "daily", "structural", ""),
  ind("tw-strait-transits", "Commercial transits of the Taiwan Strait", T, "risk-down", 0.4, ["ais-marinetraffic", "csis-china-power"], "vessels / day", "daily", "structural", "$2.4 tn of goods a year; a fall means shippers are routing around."),
  ind("tw-tsmc-overseas-share", "Share of TSMC leading-edge capacity outside Taiwan", T, "risk-up", 0.3, ["tw-tsmc"], "%", "quarterly", "latent", "Lowers the world's cost of a strike — and Beijing's."),
  ind("tw-jp-defence-posture", "Japan defence statements naming a Taiwan contingency", T, "risk-up", 0.3, ["jp-mod-taiwan", "jp-kantei"], "count / quarter", "irregular", "structural", ""),
  // Deterrence and diplomacy (45–50)
  ind("tw-us-cn-mil-mil-channel", "U.S.–China military-to-military channel active", T, "risk-down", 0.5, ["us-dod-cmpr"], "boolean", "irregular", "structural", ""),
  ind("tw-us-cn-summit", "U.S.–China leader-level meeting in trailing 6 months", T, "risk-down", 0.4, ["whitehouse-briefing"], "count", "irregular", "visible", ""),
  ind("tw-us-carrier-presence", "U.S. carrier strike groups in the Western Pacific", T, "risk-down", 0.4, ["us-dod-cmpr"], "count", "weekly", "structural", ""),
  ind("tw-us-ally-basing", "New U.S. basing access (Philippines EDCA sites, Japan)", T, "risk-down", 0.3, ["us-dod-cmpr"], "count", "irregular", "structural", ""),
  ind("tw-cn-us-trade-truce", "U.S.–China tariff / trade truce in force", T, "risk-down", 0.4, ["ofac"], "boolean", "irregular", "visible", "Economic interdependence still deters."),
];

// ═══════════════════════════════════════════════════════════════════════════
// MACRO FACTORS (W8) — twenty-five factors as data rows.
// ═══════════════════════════════════════════════════════════════════════════
// Each row names the keyless series it is read from, the transform, the
// target it claims to lead and the horizon. Neutral point, span and
// plausibility bounds come from the rules table (`factor.<id>.*`). The
// backtest in emergentPatterns.ts decides whether the row is a signal or
// context; until history is stored every factor is "pending" and carries
// weight 0 in any model that consumes it.
type FactorInput = { series: string; transform: FactorSpec["transform"]; denominator?: string; target: string; targetKind: FactorSpec["targetKind"]; horizonMonths: number; publishedFrom: string };

function fac(id: string, name: string, domain: Domain, direction: Direction, weight: number, sourceId: string, unit: string, cadence: Cadence, awareness: Aw, rationale: string, f: FactorInput): Indicator {
  const prefix = `factor.${id}`;
  return {
    ...ind(id, name, domain, direction, weight, [sourceId], unit, cadence, awareness, rationale),
    factor: { ...f, assumptionPrefix: prefix, neutral: A(`${prefix}.neutral`), span: A(`${prefix}.span`), min: A(`${prefix}.min`), max: A(`${prefix}.max`) },
  };
}

/** Outcome series the factors are scored against. Weight 0: they are targets, not signals. */
export const FACTOR_TARGETS: Indicator[] = [
  ind("f-recession", "NBER recession indicator (USREC)", "fed", "risk-up", 0, ["fred"], "0/1", "monthly", "visible", "The outcome most factors claim to lead; 1 in recession months, 1854+."),
  ind("f-unrate", "Unemployment rate", "fed", "risk-up", 0, ["fred"], "%", "monthly", "visible", "Target for the claims factor and the base series for the Sahm rule; 1948+."),
];

/** Series key → indicator id for the targets and the core series the factors need stored with full history. */
export const FACTOR_TARGET_SERIES: Array<{ indicatorId: string; series: string; sourceId: string; publishedFrom: string; min: number; max: number }> = [
  { indicatorId: "f-recession", series: "fred:USREC", sourceId: "fred", publishedFrom: "1854-12-01", min: 0, max: 1 },
  { indicatorId: "f-unrate", series: "fred:UNRATE", sourceId: "fred", publishedFrom: "1948-01-01", min: 0, max: 30 },
  { indicatorId: "ust10y", series: "fred:DGS10", sourceId: "fred", publishedFrom: "1962-01-02", min: 0, max: 20 },
  { indicatorId: "tic:japan", series: "tic:history:Japan", sourceId: "us-tic-mfh", publishedFrom: "2000-03-31", min: 100, max: 3000 },
  { indicatorId: "tic:china", series: "tic:history:China, Mainland", sourceId: "us-tic-mfh", publishedFrom: "2000-03-31", min: 50, max: 3000 },
];

export const MACRO_FACTORS: Indicator[] = [
  fac("f-curve-10y3m", "10-year minus 3-month Treasury spread", "rates-markets", "risk-down", 0.9, "fred", "pp", "daily", "visible", "The most-cited recession lead; an inversion has preceded every U.S. recession since 1982.", { series: "fred:T10Y3M", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 12, publishedFrom: "1982-01-04" }),
  fac("f-curve-10y2y", "10-year minus 2-year Treasury spread", "rates-markets", "risk-down", 0.7, "fred", "pp", "daily", "visible", "Same signal further out the curve; longer lead, more false alarms.", { series: "fred:T10Y2Y", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 18, publishedFrom: "1976-06-01" }),
  fac("f-fed-funds", "Effective federal funds rate", "fed", "risk-up", 0.6, "fred", "%", "daily", "visible", "Tightening cycles end in recessions more often than not; the level, not the change, is the factor.", { series: "fred:DFF", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 12, publishedFrom: "1954-07-01" }),
  fac("f-sahm", "Sahm rule: 3-month unemployment average minus its 12-month low", "fed", "risk-up", 0.8, "fred", "pp", "monthly", "structural", "Coincident recession marker with no false positives 1970–2023; scored at three months because it confirms rather than leads.", { series: "fred:UNRATE", transform: "sahm", target: "f-recession", targetKind: "binary", horizonMonths: 3, publishedFrom: "1948-01-01" }),
  fac("f-claims-yoy", "Initial jobless claims, year on year", "fed", "risk-up", 0.6, "fred", "% y/y", "weekly", "visible", "The fastest labour-market series; claims rise before the unemployment rate does.", { series: "fred:ICSA", transform: "yoy", target: "f-unrate", targetKind: "level", horizonMonths: 6, publishedFrom: "1967-01-07" }),
  fac("f-cpi-yoy", "CPI inflation, year on year", "rates-markets", "risk-up", 0.7, "fred", "% y/y", "monthly", "visible", "Inflation surprises re-price the 10-year; also the target for the money and oil factors.", { series: "fred:CPIAUCSL", transform: "yoy", target: "ust10y", targetKind: "level", horizonMonths: 6, publishedFrom: "1947-01-01" }),
  fac("f-m2-yoy", "M2 money stock, year on year", "fed", "risk-up", 0.5, "fred", "% y/y", "monthly", "structural", "The trunk's macroEngine already models M2 → CPI with a lag; this row measures whether the lead exists in the stored history.", { series: "fred:M2SL", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 18, publishedFrom: "1959-01-01" }),
  fac("f-baa-spread", "Baa corporate minus 10-year Treasury", "fin-stability", "risk-up", 0.7, "fred", "pp", "daily", "structural", "Credit stress shows in the Baa spread before it shows in defaults.", { series: "fred:BAA10Y", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 9, publishedFrom: "1986-01-02" }),
  fac("f-fed-assets-yoy", "Federal Reserve total assets, year on year", "fed", "risk-down", 0.6, "fred", "% y/y", "weekly", "structural", "QE lowers term premia and the 10-year; QT does the reverse. The liquidation engine's Fed response is priced from this.", { series: "fred:WALCL", transform: "yoy", target: "ust10y", targetKind: "level", horizonMonths: 6, publishedFrom: "2002-12-18" }),
  fac("f-nfci", "Chicago Fed National Financial Conditions Index", "fin-stability", "risk-up", 0.6, "fred", "index", "weekly", "structural", "One number for 105 financial-conditions series; positive is tighter than average.", { series: "fred:NFCI", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 6, publishedFrom: "1971-01-08" }),
  fac("f-vix", "CBOE VIX", "fin-stability", "risk-up", 0.4, "fred", "index", "daily", "visible", "Fear priced in options; short lead, if any.", { series: "fred:VIXCLS", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 3, publishedFrom: "1990-01-02" }),
  fac("f-consumer-sentiment", "University of Michigan consumer sentiment", "fed", "risk-down", 0.5, "fred", "index", "monthly", "visible", "Households' read on their own finances; falls ahead of spending.", { series: "fred:UMCSENT", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 9, publishedFrom: "1952-11-01" }),
  fac("f-housing-starts-yoy", "Housing starts, year on year", "rates-markets", "risk-down", 0.6, "fred", "% y/y", "monthly", "structural", "Housing turns first (Leamer 2007); the Mortgage Killer's own market.", { series: "fred:HOUST", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 12, publishedFrom: "1959-01-01" }),
  fac("f-indpro-yoy", "Industrial production, year on year", "fed", "risk-down", 0.5, "fred", "% y/y", "monthly", "visible", "The oldest monthly output series; coincident with the cycle, and the target for world growth.", { series: "fred:INDPRO", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 3, publishedFrom: "1919-01-01" }),
  fac("f-oil-wti-yoy", "WTI crude, year on year", "opec", "risk-up", 0.6, "fred", "% y/y", "daily", "visible", "Energy is the fastest channel from the oil ledger into CPI.", { series: "fred:DCOILWTICO", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 6, publishedFrom: "1986-01-02" }),
  fac("f-dollar-broad-yoy", "Broad dollar index, year on year", "reserves-fx", "risk-down", 0.5, "fred", "% y/y", "daily", "structural", "A stronger dollar lowers import prices with a lag; the petrodollar engine's dollar channel.", { series: "fred:DTWEXBGS", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 12, publishedFrom: "2006-01-02" }),
  fac("f-usdjpy-yoy", "USD/JPY, year on year", "japan-policy", "risk-down", 0.8, "fred", "% y/y", "daily", "visible", "Yen weakness forces intervention, and intervention is funded by selling Treasuries: the Japan liquidation model's trigger.", { series: "fred:DEXJPUS", transform: "yoy", target: "tic:japan", targetKind: "level", horizonMonths: 6, publishedFrom: "1971-01-04" }),
  fac("f-usdcny-yoy", "USD/CNY, year on year", "china-policy", "risk-down", 0.8, "fred", "% y/y", "daily", "visible", "Yuan pressure is defended with reserves, and reserves are Treasuries: the China liquidation model's trigger (2015–16).", { series: "fred:DEXCHUS", transform: "yoy", target: "tic:china", targetKind: "level", horizonMonths: 6, publishedFrom: "1981-01-02" }),
  fac("f-foreign-share-debt", "Foreign-held share of federal debt", "treasury-holdings", "risk-down", 0.7, "fred", "% of debt", "quarterly", "latent", "Who holds the debt decides who sets the price; a falling foreign share leaves more for domestic buyers at higher yields.", { series: "fred:FDHBFIN", transform: "ratio-pct", denominator: "fred:GFDEBTN", target: "ust10y", targetKind: "level", horizonMonths: 12, publishedFrom: "1970-01-01" }),
  fac("f-debt-to-gdp", "Federal debt held by the public, % of GDP", "us-fiscal", "risk-up", 0.6, "fred", "% of GDP", "quarterly", "visible", "Supply of Treasuries relative to the economy that must absorb it.", { series: "fred:GFDEGDQ188S", transform: "level", target: "ust10y", targetKind: "level", horizonMonths: 24, publishedFrom: "1966-01-01" }),
  fac("f-interest-outlays-gdp", "Federal net interest outlays, % of GDP", "us-fiscal", "risk-up", 0.7, "fred", "% of GDP", "annual", "structural", "The fiscal dominance gauge: interest crowding out everything else.", { series: "fred:FYOIGDA188S", transform: "level", target: "ust10y", targetKind: "level", horizonMonths: 24, publishedFrom: "1940-06-30" }),
  fac("f-acm-term-premium", "ACM 10-year term premium", "fed", "risk-up", 0.8, "nyfed-acm", "pp", "daily", "structural", "The compensation for holding duration; the channel through which a foreign sale hits the 10-year.", { series: "nyfed:acm", transform: "level", target: "ust10y", targetKind: "level", horizonMonths: 6, publishedFrom: "1961-06-14" }),
  fac("f-soma-treasury", "SOMA Treasury holdings", "fed", "risk-down", 0.7, "nyfed-soma", "USD bn", "weekly", "structural", "The buyer of last resort's book; when it shrinks, someone else must hold the paper.", { series: "nyfed:soma", transform: "level", target: "ust10y", targetKind: "level", horizonMonths: 12, publishedFrom: "2003-07-23" }),
  fac("f-avg-interest-marketable", "Average interest rate on marketable Treasury debt", "us-fiscal", "risk-up", 0.6, "fiscaldata-debt", "%", "monthly", "latent", "What the stock of debt actually costs; leads the interest-outlay share by the refinancing lag.", { series: "fiscaldata:avg_interest_rates", transform: "level", target: "f-interest-outlays-gdp", targetKind: "level", horizonMonths: 12, publishedFrom: "2001-01-31" }),
  fac("f-world-gdp-growth", "World real GDP growth", "mdb", "risk-up", 0.4, "wb-wdi-api", "% y/y", "annual", "visible", "The global demand backdrop; annual, so a long horizon and a low weight.", { series: "worldbank:NY.GDP.MKTP.KD.ZG", transform: "level", target: "f-indpro-yoy", targetKind: "level", horizonMonths: 12, publishedFrom: "1961-12-31" }),
];

// ═══════════════════════════════════════════════════════════════════════════
// HOUSEHOLD FACTORS — what families pay and do (owner's ask, 22 Sep 2026).
// ═══════════════════════════════════════════════════════════════════════════
// Twenty-five more factor rows on the same contract: keyless FRED series,
// forty-year histories where the publisher offers them, a stated target and
// horizon, and a verdict that only the backtest can award. Cost series
// (tuition, cars, rent, medical) target CPI; behaviour series (saving,
// credit, where people eat and shop) target the recession indicator.
export const HOUSEHOLD_FACTORS: Indicator[] = [
  fac("h-vehicle-sales", "Light-vehicle sales, annual rate", "household", "risk-down", 0.7, "fred", "millions", "monthly", "visible", "Car sales for the year, month by month: the first big-ticket purchase households defer.", { series: "fred:TOTALSA", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 6, publishedFrom: "1976-01-01" }),
  fac("h-new-home-sales-yoy", "New single-family home sales, year on year", "cost-of-living", "risk-down", 0.6, "fred", "% y/y", "monthly", "visible", "House purchases, new construction; falls a year before recessions.", { series: "fred:HSN1F", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 12, publishedFrom: "1963-01-01" }),
  fac("h-existing-home-sales-yoy", "Existing-home sales, year on year", "cost-of-living", "risk-down", 0.7, "fred", "% y/y", "monthly", "visible", "House purchases month by month: nine in ten sales are existing homes.", { series: "fred:EXHOSLUSM495S", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 12, publishedFrom: "1968-01-01" }),
  fac("h-median-home-price-yoy", "Median sales price of houses sold, year on year", "cost-of-living", "risk-up", 0.5, "fred", "% y/y", "quarterly", "visible", "The sixty-year price record behind every mortgage in the Mortgage Killer.", { series: "fred:MSPUS", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 12, publishedFrom: "1963-01-01" }),
  fac("h-mortgage-rate", "30-year fixed mortgage rate", "cost-of-living", "risk-down", 0.8, "fred", "%", "weekly", "visible", "The average cost of the average mortgage, weekly since 1971; drives sales six months out.", { series: "fred:MORTGAGE30US", transform: "level", target: "h-existing-home-sales-yoy", targetKind: "level", horizonMonths: 6, publishedFrom: "1971-04-02" }),
  fac("h-cpi-new-vehicles-yoy", "New-vehicle CPI, year on year", "cost-of-living", "risk-up", 0.5, "fred", "% y/y", "monthly", "structural", "The average cost of a car, forty years in one index.", { series: "fred:CUUR0000SETA01", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 6, publishedFrom: "1953-01-01" }),
  fac("h-cpi-tuition-yoy", "College tuition and fees CPI, year on year", "cost-of-living", "risk-up", 0.6, "fred", "% y/y", "monthly", "visible", "The tuition record the college estimator grows its baseline with.", { series: "fred:CUUR0000SEEB01", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 12, publishedFrom: "1978-01-01" }),
  fac("h-cpi-food-away-yoy", "Food away from home CPI, year on year", "cost-of-living", "risk-up", 0.4, "fred", "% y/y", "monthly", "structural", "The price of eating out; paired with the sales series for the fast-food tell.", { series: "fred:CUUR0000SEFV", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 6, publishedFrom: "1953-01-01" }),
  fac("h-cpi-food-home-yoy", "Food at home CPI, year on year", "cost-of-living", "risk-up", 0.4, "fred", "% y/y", "monthly", "visible", "The grocery bill's price component.", { series: "fred:CUUR0000SAF11", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 6, publishedFrom: "1952-01-01" }),
  fac("h-saving-rate", "Personal saving rate", "household", "risk-up", 0.7, "fred", "% of disposable income", "monthly", "visible", "People saving and not spending: fear shows here first (1975, 1982, 2009).", { series: "fred:PSAVERT", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 9, publishedFrom: "1959-01-01" }),
  fac("h-food-services-sales-yoy", "Restaurant and bar sales, year on year", "household", "risk-down", 0.6, "fred", "% y/y", "monthly", "visible", "How much people eat out; growth stalls into downturns.", { series: "fred:RSFSDPN", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 6, publishedFrom: "1992-01-01" }),
  fac("h-grocery-vs-restaurants", "Grocery sales relative to restaurant sales", "household", "risk-up", 0.7, "fred", "% (grocery ÷ restaurants)", "monthly", "latent", "Eating at home instead of out: the fast-food and trade-down tell as a ratio, not an anecdote.", { series: "fred:RSGCSN", transform: "ratio-pct", denominator: "fred:RSFSDPN", target: "f-recession", targetKind: "binary", horizonMonths: 6, publishedFrom: "1992-01-01" }),
  fac("h-general-merch-sales-yoy", "General merchandise store sales, year on year", "household", "risk-down", 0.5, "fred", "% y/y", "monthly", "structural", "Warehouse clubs, supercenters and dollar stores: where the trade-down goes.", { series: "fred:RSGMSN", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 6, publishedFrom: "1992-01-01" }),
  fac("h-consumer-credit-yoy", "Total consumer credit, year on year", "household", "risk-down", 0.6, "fred", "% y/y", "monthly", "structural", "Credit growth slows into every recession since 1980.", { series: "fred:TOTALSL", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 9, publishedFrom: "1943-01-01" }),
  fac("h-card-delinquency", "Credit-card delinquency rate", "household", "risk-up", 0.8, "fred", "% of balances", "quarterly", "structural", "Rises a year before unemployment does.", { series: "fred:DRCCLACBS", transform: "level", target: "f-recession", targetKind: "binary", horizonMonths: 6, publishedFrom: "1991-01-01" }),
  fac("h-consumer-loan-delinquency", "Consumer loan delinquency rate", "household", "risk-up", 0.6, "fred", "% of balances", "quarterly", "structural", "Auto and personal loans in one forty-year series.", { series: "fred:DRCLACBS", transform: "level", target: "f-unrate", targetKind: "level", horizonMonths: 6, publishedFrom: "1987-01-01" }),
  fac("h-median-income-real-yoy", "Real median household income, year on year", "household", "risk-down", 0.5, "fred", "% y/y", "annual", "visible", "What the middle actually earns after inflation; the denominator of every affordability ratio.", { series: "fred:MEHOINUSA672N", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 12, publishedFrom: "1984-01-01" }),
  fac("h-homeownership-rate", "Homeownership rate", "household", "risk-up", 0.3, "fred", "%", "quarterly", "structural", "Slow-moving; likely context, kept because the 2004–2008 arc says otherwise once.", { series: "fred:RHORUSQ156N", transform: "level", target: "h-median-home-price-yoy", targetKind: "level", horizonMonths: 12, publishedFrom: "1965-01-01" }),
  fac("h-building-permits-yoy", "Building permits, year on year", "cost-of-living", "risk-down", 0.6, "fred", "% y/y", "monthly", "structural", "Permits lead starts by two months and the cycle by a year.", { series: "fred:PERMIT", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 12, publishedFrom: "1960-01-01" }),
  fac("h-gasoline-price-yoy", "Regular gasoline price, year on year", "cost-of-living", "risk-up", 0.5, "fred", "% y/y", "weekly", "visible", "The price every household sees weekly; passes into CPI within a quarter.", { series: "fred:GASREGW", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 3, publishedFrom: "1990-08-20" }),
  fac("h-medical-cpi-yoy", "Medical care CPI, year on year", "cost-of-living", "risk-up", 0.4, "fred", "% y/y", "monthly", "structural", "The second-fastest-rising household line after tuition.", { series: "fred:CPIMEDSL", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 12, publishedFrom: "1947-01-01" }),
  fac("h-rent-cpi-yoy", "Rent of primary residence CPI, year on year", "cost-of-living", "risk-up", 0.6, "fred", "% y/y", "monthly", "structural", "A third of core CPI; the longest household price record on FRED (1914).", { series: "fred:CUUR0000SEHA", transform: "yoy", target: "f-cpi-yoy", targetKind: "level", horizonMonths: 12, publishedFrom: "1914-12-01" }),
  fac("h-case-shiller-yoy", "Case-Shiller national home price index, year on year", "cost-of-living", "risk-down", 0.5, "fred", "% y/y", "monthly", "visible", "Home prices as households feel them; fell −12 % in 2009.", { series: "fred:CSUSHPINSA", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 18, publishedFrom: "1987-01-01" }),
  fac("h-durable-goods-yoy", "Spending on durable goods, year on year", "household", "risk-down", 0.6, "fred", "% y/y", "monthly", "structural", "Cars, appliances, furniture: the first spending households defer.", { series: "fred:PCEDG", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 6, publishedFrom: "1959-01-01" }),
  fac("h-revolving-credit-yoy", "Revolving (card) credit, year on year", "household", "risk-up", 0.6, "fred", "% y/y", "monthly", "latent", "Borrowing to hold spending: the late-cycle pattern of 2007 and 2023.", { series: "fred:REVOLSL", transform: "yoy", target: "f-recession", targetKind: "binary", horizonMonths: 9, publishedFrom: "1968-01-01" }),
];

/** Both factor panels, for the history pull, the backtest and the scoring loops. */
export const ALL_FACTORS: Indicator[] = [...MACRO_FACTORS, ...HOUSEHOLD_FACTORS];

export const FACTOR_BY_ID: ReadonlyMap<string, Indicator> = new Map(ALL_FACTORS.map(f => [f.id, f]));

export const INDICATOR_PANELS = {
  JAPAN_LIQUIDATION,
  CHINA_LIQUIDATION,
  PETRODOLLAR_RIPPLE,
  TAIWAN_STRIKE,
  GLOBAL_POLICY,
  MACRO_FACTORS,
  HOUSEHOLD_FACTORS,
} as const;

export const ALL_INDICATORS: Indicator[] = [
  ...JAPAN_LIQUIDATION,
  ...CHINA_LIQUIDATION,
  ...PETRODOLLAR_RIPPLE,
  ...TAIWAN_STRIKE,
  ...GLOBAL_POLICY,
  ...MACRO_FACTORS,
  ...HOUSEHOLD_FACTORS,
];
// FACTOR_TARGETS are outcome series (weight 0), not indicators a model watches; they stay out of ALL_INDICATORS.

export const INDICATOR_BY_ID: ReadonlyMap<string, Indicator> = new Map(ALL_INDICATORS.map(i => [i.id, i]));
