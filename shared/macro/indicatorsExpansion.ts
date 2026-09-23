/**
 * Indicator Panel — GLOBAL_POLICY: one headline series per expansion domain.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * These are the series the daily refresh writes to `macro_observations` from
 * the expansion connectors, so the emergent-pattern detector and the Thomas
 * brief see them. Each cites a registered source (the test enforces it). They
 * are not a confidence model on their own; the existing models read the ones
 * that matter to them by id (e.g. `fed-effr` feeds the hedged-carry indicator
 * for Japan).
 */
import type { Indicator } from "./types";

const I = (i: Indicator) => i;

export const GLOBAL_POLICY: Indicator[] = [
  // 1. Fed
  I({ id: "fed-effr", name: "Effective federal funds rate", domain: "fed", direction: "risk-up", weight: 0.7, sourceIds: ["fed-ddp", "fred"], unit: "%", cadence: "daily", awareness: "visible", rationale: "The price of dollars; every carry trade starts here." }),
  I({ id: "fed-balance-sheet", name: "Fed total assets (H.4.1)", domain: "fed", direction: "risk-down", weight: 0.6, sourceIds: ["fed-ddp", "fed-h41"], unit: "USD bn", cadence: "weekly", awareness: "structural", rationale: "QT withdraws the marginal Treasury buyer; a pause or restart is the Fed's answer to foreign selling." }),
  I({ id: "fed-statements-30d", name: "Fed official statements logged, 30-day", domain: "fed", direction: "risk-up", weight: 0.3, sourceIds: ["fed-press-all", "fed-speeches"], unit: "count", cadence: "daily", awareness: "structural", rationale: "Communication volume rises into regime changes." }),
  // 4. BIS
  I({ id: "bis-credit-gap-us", name: "BIS credit-to-GDP gap, United States", domain: "bis", direction: "risk-up", weight: 0.6, sourceIds: ["bis-stats-api", "bis-credit-gap"], unit: "pp", cadence: "quarterly", awareness: "latent", rationale: "The best single published banking-crisis predictor." }),
  I({ id: "bis-speeches-30d", name: "Central-bank speeches logged, 30-day", domain: "bis", direction: "risk-up", weight: 0.3, sourceIds: ["bis-speeches"], unit: "count", cadence: "daily", awareness: "latent", rationale: "Global central-bank talk volume." }),
  // 5. IMF
  I({ id: "imf-japan-reserves-ifs", name: "Japan official reserve assets (IFS)", domain: "imf", direction: "risk-up", weight: 0.5, sourceIds: ["imf-ifs", "jp-mof-reserves"], unit: "USD bn", cadence: "monthly", awareness: "structural", rationale: "Independent corroboration of the MOF reserve line." }),
  I({ id: "imf-programmes-active", name: "Active IMF programmes", domain: "imf", direction: "risk-up", weight: 0.4, sourceIds: ["imf-mona"], unit: "count", cadence: "quarterly", awareness: "structural", rationale: "Sovereign stress measured by who needs the Fund." }),
  // 10. Summits
  I({ id: "summit-compliance-g7", name: "G7 compliance score, latest summit", domain: "summits", direction: "risk-down", weight: 0.3, sourceIds: ["g7-compliance"], unit: "score −1..+1", cadence: "annual", awareness: "latent", rationale: "Words-to-deeds rate of the G7, scored externally." }),
  I({ id: "nato-2pct-share", name: "NATO members at or above 2 % of GDP on defence", domain: "summits", direction: "risk-up", weight: 0.3, sourceIds: ["nato-declarations"], unit: "share", cadence: "annual", awareness: "structural", rationale: "Security spending pledges delivered = threat perception rising." }),
  // 12. US fiscal
  I({ id: "us-debt-to-penny", name: "Total public debt outstanding", domain: "us-fiscal", direction: "risk-up", weight: 0.5, sourceIds: ["fiscaldata-debt"], unit: "USD bn", cadence: "daily", awareness: "visible", rationale: "The stock every foreign holder is exposed to." }),
  I({ id: "us-net-interest-mts", name: "Net interest outlays, monthly", domain: "us-fiscal", direction: "risk-up", weight: 0.6, sourceIds: ["fiscaldata-mts"], unit: "USD bn", cadence: "monthly", awareness: "structural", rationale: "Interest is now larger than defence; the reason foreign demand matters." }),
  I({ id: "us-presidential-docs-30d", name: "Presidential documents on trade, China, Treasuries, 30-day", domain: "us-fiscal", direction: "risk-up", weight: 0.3, sourceIds: ["federal-register-api", "whitehouse-briefing"], unit: "count", cadence: "daily", awareness: "structural", rationale: "Executive action volume." }),
  // 15. OPEC
  I({ id: "opec-quota-vs-output", name: "OPEC+ production vs quota", domain: "opec", direction: "risk-up", weight: 0.5, sourceIds: ["opec-press", "opec-momr", "eia-international"], unit: "mb/d over quota", cadence: "monthly", awareness: "structural", rationale: "Follow-through on quota decisions, measured by others." }),
  I({ id: "opec-statements-90d", name: "OPEC communiqués, 90-day", domain: "opec", direction: "risk-up", weight: 0.3, sourceIds: ["opec-press"], unit: "count", cadence: "irregular", awareness: "visible", rationale: "Decision frequency rises in price wars." }),
  // 16. Sanctions
  I({ id: "sanctions-designations-30d", name: "New sanctions designations, 30-day (all regimes)", domain: "sanctions", direction: "risk-up", weight: 0.6, sourceIds: ["opensanctions", "ofac", "eu-sanctions-map"], unit: "count", cadence: "daily", awareness: "structural", rationale: "Each designation pushes a corridor out of the dollar." }),
  I({ id: "russia-fossil-revenue-daily", name: "Russian fossil-fuel export revenue, daily", domain: "sanctions", direction: "risk-up", weight: 0.4, sourceIds: ["crea-fossil-tracker"], unit: "EUR mn / day", cadence: "daily", awareness: "structural", rationale: "Sanctions leakage, measured." }),
  // 19. Trade and shipping
  I({ id: "wto-trade-volume", name: "World merchandise trade volume (WTO)", domain: "trade-shipping", direction: "risk-down", weight: 0.4, sourceIds: ["wto-stats"], unit: "index", cadence: "quarterly", awareness: "visible", rationale: "The denominator of every corridor share." }),
  I({ id: "gta-harmful-measures-30d", name: "Harmful trade interventions, 30-day (Global Trade Alert)", domain: "trade-shipping", direction: "risk-up", weight: 0.5, sourceIds: ["global-trade-alert"], unit: "count", cadence: "daily", awareness: "structural", rationale: "Protectionism announced and enacted." }),
  I({ id: "container-rate-wci", name: "Drewry World Container Index", domain: "trade-shipping", direction: "risk-up", weight: 0.4, sourceIds: ["drewry-wci"], unit: "USD / FEU", cadence: "weekly", awareness: "visible", rationale: "Chokepoint stress in one number." }),
  // 23. Financial stability
  I({ id: "ofr-fsi", name: "OFR Financial Stress Index", domain: "fin-stability", direction: "risk-up", weight: 0.7, sourceIds: ["ofr-fsi"], unit: "index", cadence: "daily", awareness: "visible", rationale: "Daily composite stress." }),
  I({ id: "hy-oas", name: "US high-yield OAS", domain: "fin-stability", direction: "risk-up", weight: 0.6, sourceIds: ["fred-hy-oas"], unit: "bp", cadence: "daily", awareness: "visible", rationale: "Credit stress." }),
  I({ id: "cftc-lev-funds-ust-short", name: "Leveraged funds net short in Treasury futures (CFTC)", domain: "fin-stability", direction: "risk-up", weight: 0.6, sourceIds: ["cftc-cot"], unit: "contracts", cadence: "weekly", awareness: "latent", rationale: "The basis trade is the amplifier of any foreign sale." }),
  I({ id: "gscpi", name: "Global Supply Chain Pressure Index", domain: "fin-stability", direction: "risk-up", weight: 0.4, sourceIds: ["nyfed-gscpi"], unit: "sd", cadence: "monthly", awareness: "structural", rationale: "Supply-side inflation pressure." }),
  // 24. Political risk
  I({ id: "gdelt-taiwan-volume", name: "GDELT news volume, 'Taiwan blockade', 30-day", domain: "political-risk", direction: "risk-up", weight: 0.4, sourceIds: ["gdelt-doc-api"], unit: "% of coverage", cadence: "daily", awareness: "visible", rationale: "Attention precedes and follows events; the lead is what the pattern detector tests." }),
  I({ id: "gdelt-treasury-dump-volume", name: "GDELT news volume, 'China Treasury sell-off', 30-day", domain: "political-risk", direction: "risk-up", weight: 0.3, sourceIds: ["gdelt-doc-api"], unit: "% of coverage", cadence: "daily", awareness: "visible", rationale: "The narrative's temperature." }),
  I({ id: "ucdp-active-conflicts", name: "Active state-based armed conflicts (UCDP)", domain: "political-risk", direction: "risk-up", weight: 0.4, sourceIds: ["ucdp"], unit: "count", cadence: "annual", awareness: "structural", rationale: "The base rate the Taiwan priors are re-derived from." }),
  // 11. ECB
  I({ id: "ecb-mro", name: "ECB main refinancing rate", domain: "ecb", direction: "risk-up", weight: 0.5, sourceIds: ["ecb-data-portal"], unit: "%", cadence: "irregular", awareness: "visible", rationale: "The euro leg of the dollar's rate differential." }),
  I({ id: "target2-de", name: "Bundesbank TARGET balance", domain: "ecb", direction: "risk-up", weight: 0.5, sourceIds: ["target2-balances"], unit: "EUR bn", cadence: "monthly", awareness: "latent", rationale: "Intra-euro capital flight, measured." }),
  // 12. OECD
  I({ id: "oecd-cli-us", name: "OECD Composite Leading Indicator, United States", domain: "oecd", direction: "risk-down", weight: 0.5, sourceIds: ["oecd-data-explorer", "oecd-cli"], unit: "index", cadence: "monthly", awareness: "visible", rationale: "The standard turning-point signal." }),
  // 13. UN
  I({ id: "fao-food-price-index", name: "FAO Food Price Index", domain: "un", direction: "risk-up", weight: 0.5, sourceIds: ["fao-fpi"], unit: "index", cadence: "monthly", awareness: "visible", rationale: "Food-driven unrest and inflation." }),
  I({ id: "unhcr-displaced", name: "Forcibly displaced, global", domain: "un", direction: "risk-up", weight: 0.3, sourceIds: ["unhcr-data"], unit: "millions", cadence: "annual", awareness: "structural", rationale: "Conflict's slow measure." }),
  // 14. China party-state
  I({ id: "cn-gdp-target-gap", name: "China GDP outturn minus Work Report target", domain: "china-party", direction: "risk-up", weight: 0.5, sourceIds: ["cn-gov-work-report", "cn-nbs"], unit: "pp", cadence: "annual", awareness: "latent", rationale: "The years the target was missed are the tell." }),
  I({ id: "cn-politburo-tone", name: "Politburo economic readout tone (coded)", domain: "china-party", direction: "risk-up", weight: 0.4, sourceIds: ["cn-politburo-readouts", "csis-interpret-china"], unit: "index", cadence: "quarterly", awareness: "structural", rationale: "The top-line economic line, four times a year." }),
  // 15. Food
  I({ id: "food-export-restrictions-active", name: "Active food and fertilizer export restrictions", domain: "food", direction: "risk-up", weight: 0.4, sourceIds: ["ifpri-export-restrictions"], unit: "count", cadence: "weekly", awareness: "structural", rationale: "2008 and 2022 price spikes were amplified by bans." }),
  I({ id: "enso-oni", name: "Oceanic Niño Index", domain: "food", direction: "risk-up", weight: 0.3, sourceIds: ["noaa-enso"], unit: "°C anomaly", cadence: "monthly", awareness: "latent", rationale: "Harvests, hydro, hurricanes." }),
  // 16. BoE
  I({ id: "boe-bank-rate", name: "Bank Rate", domain: "boe", direction: "risk-up", weight: 0.4, sourceIds: ["boe-iadb"], unit: "%", cadence: "irregular", awareness: "visible", rationale: "Sterling's leg." }),
  // 17. MDB
  I({ id: "wb-rule-of-law-avg", name: "World Bank Rule of Law estimate, tracked economies", domain: "mdb", direction: "risk-down", weight: 0.3, sourceIds: ["wb-wgi"], unit: "estimate", cadence: "annual", awareness: "latent", rationale: "Governance precedes default." }),
  // 18. SWF
  I({ id: "nbim-ust-share", name: "NBIM U.S. Treasury share of fixed income", domain: "swf", direction: "risk-down", weight: 0.4, sourceIds: ["nbim-holdings"], unit: "%", cadence: "annual", awareness: "latent", rationale: "The most transparent large allocator's revealed preference." }),
  // 19. NEA allies
  I({ id: "kr-exports-20d", name: "Korea exports, first twenty days, y/y", domain: "nea-allies", direction: "risk-down", weight: 0.5, sourceIds: ["kr-customs-20day"], unit: "%", cadence: "monthly", awareness: "structural", rationale: "The fastest hard read on world demand." }),
  I({ id: "tw-export-orders", name: "Taiwan export orders, y/y", domain: "nea-allies", direction: "risk-down", weight: 0.4, sourceIds: ["tw-moea-export-orders"], unit: "%", cadence: "monthly", awareness: "structural", rationale: "Chip demand nowcast." }),
  // 20. India
  I({ id: "rbi-repo-rate", name: "RBI policy repo rate", domain: "india", direction: "risk-up", weight: 0.3, sourceIds: ["rbi-dbie", "rbi-mpc"], unit: "%", cadence: "irregular", awareness: "visible", rationale: "The rupee corridor's rate." }),
  // 21. EM central banks
  I({ id: "bcb-selic", name: "Brazil Selic target", domain: "em-central-banks", direction: "risk-up", weight: 0.3, sourceIds: ["bcb-sgs"], unit: "%", cadence: "irregular", awareness: "visible", rationale: "Keyless JSON; the EM rate bellwether." }),
  I({ id: "bcra-policy-rate", name: "Argentina policy rate", domain: "em-central-banks", direction: "risk-up", weight: 0.2, sourceIds: ["bcra-api"], unit: "%", cadence: "daily", awareness: "structural", rationale: "The default case, live." }),
  // 22. Minerals
  I({ id: "ember-china-coal-share", name: "China coal share of generation", domain: "minerals", direction: "risk-up", weight: 0.2, sourceIds: ["ember"], unit: "%", cadence: "monthly", awareness: "latent", rationale: "Energy-security posture." }),
  // 23. Demographics
  I({ id: "cn-births", name: "China births", domain: "demographics", direction: "risk-up", weight: 0.3, sourceIds: ["cn-nbs-births"], unit: "millions", cadence: "annual", awareness: "structural", rationale: "The long-run reason for the diversionary-war hypothesis, and against it." }),
  // 24. Catastrophe
  I({ id: "nhc-active-storms", name: "Active Atlantic tropical cyclones", domain: "catastrophe", direction: "risk-up", weight: 0.3, sourceIds: ["nhc-hurricanes"], unit: "count", cadence: "daily", awareness: "visible", rationale: "Insurer loss season, live." }),
  I({ id: "ambest-downgrades-30d", name: "A.M. Best downgrades, 30-day", domain: "catastrophe", direction: "risk-up", weight: 0.4, sourceIds: ["ambest-actions"], unit: "count", cadence: "daily", awareness: "structural", rationale: "The carriers in the rate-sheet table." }),
  // 25. WEF
  I({ id: "wef-top-risk-rank-geoeconomic", name: "WEF Global Risks rank of geoeconomic confrontation", domain: "wef", direction: "risk-up", weight: 0.1, sourceIds: ["wef-global-risks"], unit: "rank", cadence: "annual", awareness: "visible", rationale: "What the consensus fears; scored against what happened." }),
];
