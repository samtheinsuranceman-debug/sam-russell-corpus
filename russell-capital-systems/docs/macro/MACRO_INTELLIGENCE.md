# Global Macro Intelligence — architecture, how it runs, how to extend it

Built 22 Sep 2026 on `claude/global-economic-prediction-2b2oev`, on top of the
forty-brain Thomas Goldman hub. It answers five questions every day, with a
confidence grade on every answer:

1. **Will Japan or China liquidate U.S. Treasuries, how likely, how much, over 24 months** — and what happens to everything else if they do, at any sell fraction.
2. **How much of the world's oil is settling outside the dollar** — daily where measurable, rolled monthly / quarterly / semi-annually / annually, back twenty years, forward ten.
3. **Which sovereigns are near distress** — every economy's debt-to-GDP, a five-factor default-risk score, and a contagion model.
4. **How likely is a Taiwan strike, blockade or quarantine** — four scenarios, fifty indicators, published impact ranges.
5. **What did Beijing say versus what did it do** — forty years of declared positions scored for follow-through, so a new threat is weighted by its channel's record.

## Files

```
shared/macro/
  index.ts                  public surface + the 12-step PORT TO THE TRUNK header
  assumptions.ts            the rules table: 112 rows, every rate / elasticity / prior / threshold with {source, asOf, basis, kind}; engines read via A()
  trunkBridge.ts            extends the trunk: overlayMacroEngine() onto shared/macroEngine.ts's MacroAssumptions; regimeForAdjustments() → marketRegimeClassifier's Regime
  types.ts                  Sourced<T>, Indicator, Evidence, ConfidenceBand, MacroToggles, MacroAdjustments
  sources.ts                the registry: CORE_SOURCES (98: 17 JP, 20 CN, 17 US, 5 TW, 27 multilateral, 12 other) + EXPANSION_SOURCES = MACRO_SOURCES (331 unique ids); each with tier/access/cadence
  sourcesExpansion.ts       the twenty-five-domain free tier: 233 sources (0 paid; open-api / keyed-api / page / manual), ≥10 per domain across the registry; EXPANSION_BUILD_ORDER (1–25, each with its reason)
  indicators.ts             five panels: Japan 15, China 15, petrodollar 50, Taiwan 50, global policy ~50; each row sourced, weighted, awareness-tagged
  indicatorsExpansion.ts    GLOBAL_POLICY: one to four indicators per expansion domain (fed-effr, bis-credit-gap-us, us-debt-to-penny, opec-quota-vs-output, ofr-fsi, gdelt-taiwan-volume, cn-politburo-tone, nbim-ust-share, kr-exports-20d, …)
  snapshot.ts               dated seed readings (TIC Jul 2026, MOF Aug 2026, IMF WEO Apr 2026, …) and the 60-economy debt table
  confidence.ts             the scoring engine: weighted log-odds, tier × freshness × corroboration, probability + interval + confidence grade
  treasuryLiquidation.ts    scenario engine (any holder, fraction, pace; 10,000 paths) and the 24-month amount forecast
  liquidationConfidence.ts  the daily Japan/China assessment that Thomas quotes
  petrodollar.ts            corridor ledger, currency breakdown, 20-year history at four roll-ups, S-curve forecast
  globalDebt.ts             five-factor sovereign risk, watch-list, contagion
  taiwanRisk.ts             four-scenario assessment, impact simulation by country
  statementFollowThrough.ts 1979–2026 ledger, follow-through rates by category/severity/environment/channel, credibility multiplier
  emergentPatterns.ts       correlation, lead–lag, conditional-triple detector with awareness tagging
  adjustments.ts            toggles → deltas for calculators; applyMacro()
  random.ts                 seeded RNG, triangular draws, percentiles; MACRO_SIMULATION_RUNS = 10,000
server/
  macroRouter.ts            tRPC: status, sources, indicators, liquidationConfidence, liquidationScenario, liquidationForecast,
                            petrodollar, debt, debtCountry, contagion, taiwan, taiwanImpact, statements, patterns, adjustments,
                            brief, refresh (owner), setStatementOutcome (owner), addStatement (owner)
  macroConnectors.ts        core: FRED (keyed + keyless CSV), TIC mfh.txt, IMF datamapper, World Bank, EIA, Xinhua RSS; runAllConnectors({connectors}) never throws; ConnectorOutput may carry StatementDrafts
  macroConnectorsExpansion.ts  free tier: generic parsers (SDMX CSV, IMF SDMX-JSON, Fiscal Data, Fed DDP, GDELT, OFR, CFTC, JSON path) → 16 number connectors; 16 official RSS feeds → statement connectors (ledger drafts + a daily count)
  macroContext.ts           buildMacroBrief() for Thomas; MACRO_LOOKUP directive parse/execute
  _core/index.ts            GET /api/cron/macro-refresh?secret=CRON_SECRET — runs core + expansion (38 connectors); statements land as "pending", deduplicated by source + link
  macroIntelligence.test.ts 68 tests · macroConnectors.test.ts 15 tests · macroExpansion.test.ts 23 tests
drizzle/
  0073_macro_intelligence.sql   macro_observations, macro_source_health, macro_statements, macro_forecast_log
client/src/
  pages/portal/MacroIntelligence.tsx   /portal/macro-intelligence (alias /portal/global-macro); seven tabs
  components/MacroScenarioToggle.tsx   useMacroScenario() + the panel; mounted on Sequence-of-Returns and Mortgage Killer
docs/macro/
  API_CATALOGUE.md          160 feeds, ranked
  REPORT_SPEC.md            the 200-page report generator
```

## The confidence engine, in one paragraph

Each indicator has a prior weight and a direction. Each observation becomes a
signal in [−1, 1] against a neutral point and a span set per indicator. The
signal is discounted by source tier (official 1.0 → state media 0.55 →
secondary 0.35), by freshness (exponential, half-life set by the series'
cadence) and boosted, with diminishing returns, by corroboration. Log-odds
start at the base rate and move by signal × effective weight × scale. The
probability is the sigmoid. **Confidence is separate:** 65 % coverage (how
much prior weight has a fresh reading) + 35 % mean quality; fewer than four
live indicators caps it at C. The interval widens as confidence falls. Every
driver is printed with its contribution so a reader can dispute one weight at
a time. Words (state-media threats, MFA rhetoric) are multiplied by the
follow-through ledger's rate for that category and environment before they
count.

## Packet W8 — factors, forty-year history, backtests, the ledger for people, the daily brief

Built 22 Sep 2026 on `claude/global-economic-prediction-2b2oev` to `docs/synthesis/packets/W8.md`. The shape that ports: everything under `shared/macro/`, `server/macro*.ts`, the `macro` router, the `macro_*` tables; no new AI entry point.

| Piece | Where | What |
|---|---|---|
| Factors as data | `shared/macro/indicators.ts` `MACRO_FACTORS` | 25 rows; each names its keyless series, transform (level / yoy / sahm / ratio-pct), target, horizon; neutral, span and plausibility bounds are read from `assumptions.ts` (`factor.<id>.*`, 100 rows + 11 thresholds). No `factorXyz.ts`. Full list with coverage and verdicts: `FACTORS.md` (generated, test-checked) |
| Arithmetic and backtest | `shared/macro/emergentPatterns.ts` | `monthEndPoints`, `yoyPct`, `sahmRule`, `ratioPct`, `transformSeries`, `factorSignal`, `backtestFactor` (lead r at the horizon, r against the preceding window, hit rate outside the neutral band → signal / context / pending), `applyFactorVerdicts` (context ⇒ weight 0) |
| Scoring | `shared/macro/scoring.ts` (pure) + `server/macroScoring.ts` (db) | one forecast per factor per day into `macro_forecast_log` (`factor:<id>`); scored with Brier when the horizon passes; running score per factor in `macro_factor_scores` beside the backtest verdict; `accuracyLine()` for the brief |
| History connectors | `server/macroHistory.ts` | series key → keyless URL + parser: FRED `fredgraph.csv` (full history), NY Fed ACM CSV and SOMA JSON, Fiscal Data average interest rates, World Bank WDI, TIC `mfhhis01.txt`; plausibility bounds (> 5 % dropped ⇒ refused as a format change); month-end downsample + first and latest reading; `macro_series_meta` records `earliestAsOf`, `latestAsOf`, `coverageYears`, `status` live / cached / unavailable + reason |
| Transport rules | `server/macroConnectors.ts` `getText` | host allow-list (every registry URL host + the data hosts), private / literal addresses refused before DNS, redirects followed only onto the list (3 hops), 15 s, 5 MB by header and by body, parse only, raw bodies never stored |
| Ledger for people | `shared/macro/people.ts` + `server/macroLedger.ts` | 24 tracked offices (never names: Wikidata resolves the current holder at run time); GDELT DOC API artlist → cited drafts (one per URL, English only); `macro_statements` gains `office`, `speakerQid`, `outcomeSourceUrl`, `resolvedAt`; the router refuses a statement without a URL and an outcome without an outcome URL |
| Brief | `server/macroContext.ts` | SINCE YESTERDAY block: movers (> 2 %), new statements with URLs, sources dark (fail streak ≥ 3), the accuracy line, FACTORS counts + coverage; fixed budget `brief.maxChars` = 7,000 chars, trimmed from the block never the model lines; `MACRO_LOOKUP` kinds `factor` and `statement` (in-process). Inputs are cached by `currentObservations()` so the Thomas router's one-line call needs no change |
| Cron | `server/_core/cronGuard.ts` (cherry-picked `8ffcccc`) | `/api/cron/*` 503 while `CRON_SECRET` is unset, 403 on a wrong secret; the macro route's own check removed (D23) |
| Tests | `server/macroW8.test.ts` | 37 tests, all offline: registry, rules-table rows, manifest, transport rules, six parser fixtures, pull/degrade, arithmetic, backtest (constructed lead ⇒ signal; noise ⇒ context; short ⇒ pending; binary target), verdict weighting, scoring, ledger + citations, brief + budget + lookups, FACTORS.md equality |

**Counts at commit (sandbox has no egress, so verdicts are the honest pending state):** sources wired with a fixture-tested connector: 6 core + 32 expansion + 6 history series kinds (FRED, NY Fed ACM, NY Fed SOMA, Fiscal Data, World Bank, TIC history) + GDELT + Wikidata; factors as signal: 0; factors as context: 0; factors pending backtest: 25. The first Railway cron run pulls the histories and writes the verdicts; `FACTORS.md` can then be re-rendered from `macro.factors`.

**Left for the trunk port (outside this packet's files):** `server/thomasGoldmanRouter.ts` line 324 should use `describeMacroLookup(q)` for the consultation label (today a factor lookup logs as "debt undefined"); `drizzle/0074_*.sql` is not written here (the trunk regenerates `database/rcs-schema.sql` from `schema.ts`).

## Household layer — what families pay and do (owner's ask, 22 Sep 2026)

| Piece | Where | What |
|---|---|---|
| Fifty signals | `shared/macro/household.ts` `HOUSEHOLD_SIGNALS` | car and house purchases (monthly, plus Redfin weekly for the daily cadence), the forty-year price records (mortgage rate since 1971, new-vehicle CPI since 1953, tuition CPI since 1978 plus NCES back to 1963, food, rent since 1914, medical, gasoline), the behaviour tells (saving rate, restaurant vs grocery sales, dollar stores and supercenters, McDonald's and Walmart from SEC filings, card delinquency), and the wealth references (SCF, DFA, OES, ACS). Each with publisher, first date, cadence, access, direction, what it signals and why. Generated document: `HOUSEHOLD_SIGNALS.md` (test-checked) |
| Twenty-five household factors | `indicators.ts` `HOUSEHOLD_FACTORS` | the same contract as the macro factors: keyless FRED series, 100 rules-table rows, targets and horizons, backtested and scored by the same loops (`ALL_FACTORS`) |
| College cost | `household.ts` `collegeCostProjection`; `macro.collegeCost` | package by school type grown to the start year, four years, books and living, the loan at the current federal rate with fee, the payment and interest over the term, and two opportunity costs at the owner's 6 % (payments invested; package compounded). Baselines are rules rows flagged VERIFY. The 529 planner reads it on one click |
| Relative wealth | `household.ts` `relativeWealth`; `macro.relativeWealth` | net worth vs the same age (SCF 2022 median and mean; log-normal percentile; nine deciles; gap to the next), vs all households, vs a profession peer (peer median income × the bracket's net-worth-to-income multiple × experience scale). Reference rows flagged VERIFY; refreshed from the DFA once that connector runs |
| Twenty-five ideas | `household.ts` `HOUSEHOLD_IDEAS` | data, so the document lists them with reasoning, sources and effort |
| Page | Household tab on `/portal/macro-intelligence` | the two estimators and the fifty-signal table with latest stored readings |
| Tests | `server/macroHousehold.test.ts` | catalogue integrity, the owner's asks by name, forty-year and keyless floors, factor contract, manifest, college arithmetic (growth, loan, opportunity, edge cases), relative wealth (bracketing, median at 50th, ordering, negative net worth, peer scaling), document equality |

## What runs daily

`/api/cron/macro-refresh` → `runAllConnectors()` → each connector's
observations land in `macro_observations` (append-only, source as-of date);
`macro_source_health` records who answered; `logForecasts()` writes the day's
Japan, China and Taiwan assessments to `macro_forecast_log` so the model can
be scored later. The engines then read the latest row per indicator layered
over the seed snapshot. The page header says how many readings are live and
when the last pull was.

A TIC pull whose Japan or China figure is more than 30 % from the snapshot is
treated as a parse fault and dropped, not published.

## Thomas Goldman

`buildMacroBrief()` goes into his system prompt after the carrier summary.
It carries the day's four headline numbers with their sources and four rules:
quote probability and confidence grade together; say these are model outputs;
emit `MACRO_LOOKUP` for a scenario at a stated fraction or a debt row; offer
the toggles when a calculator result is discussed. The lookup is an in-process
engine call (no network), two per turn, returned to him with its assumptions
and source ids, the same way carrier lookups work. `thomas.ask` now returns
`macroConsulted`.

## Calculators

`useMacroScenario()` returns `{ toggles, adjustments, panel }`. The calculator
mounts `panel` and applies `adjustments` with `applyMacro(baseInputs,
adjustments)` — which shifts only the fields it recognises (`expectedReturn`,
`volatility`, `inflationRate`, `mortgageRate`, `tenYearYield`). The panel
prints the rationale and sources; the PDF's evidence ledger should copy them.
Wired so far: Sequence-of-Returns Risk (mean return and volatility) and
Mortgage Killer (the IUL Monte Carlo). Every other predictive calculator
follows the same four lines.

## Numbers and their sources (seed, as of 22 Sep 2026)

| Figure | Value | Source | As of |
|---|---|---|---|
| Japan Treasury holdings | $1,103.9 bn | us-tic-mfh | 2026-07-31 |
| China Treasury holdings | $618.0 bn (lowest since Sep 2008) | us-tic-mfh | 2026-07-31 |
| All foreign holdings | $9,248.1 bn (record $9,489.4 bn Feb 2026) | us-tic-mfh | 2026-07-31 |
| Japan reserves / foreign securities change | $995 bn / −$87.8 bn | jp-mof-reserves | 2026-08-31 |
| Japan intervention | ¥15.4 tn ($98.6 bn), record | jp-mof-intervention | 2026-08-26 |
| 10-year JGB | 3.0 % | jp-mof-jgb | 2026-09-08 |
| China FX reserves / gold | $3,438.3 bn / 76.73 m oz, 22-month streak | cn-safe-reserves, cn-pboc-gold | 2026-08-31 |
| Non-USD oil settlement | ~20 % (15–22) | atlantic-council-dollar, carnegie, jpm-research | 2026-03-31 |
| COFER USD share | 56.3 % | imf-cofer | 2026-03-31 |
| Debt/GDP: US, Japan, China, Italy, world (2026) | 125.8 / 204.4 / 106.9 / 138.4 / 95.3 | imf-weo | 2026-04-15 |
| Taiwan: blockade / war first-year world GDP | −5.3 % / −9.6 % ($10.6 tn) | bloomberg-economics-taiwan | Feb 2026 |
| PLA ships around Taiwan, July 2026 | 244 (record) | tw-mnd-daily | 2026-07-31 |

Rows in the debt table marked `estimate: true` (43 of 60) are carried from
the WEO release but not yet confirmed by the connector; the page shows
"est." until the IMF pull replaces them.

## What could not be verified from the build sandbox

Egress to ticdata.treasury.gov, api.stlouisfed.org, imf.org, worldbank.org,
mof.go.jp and api.eia.gov is blocked here. The connectors are tested against
recorded fixtures shaped like the real responses. The first live pull happens
on Railway; if a parser breaks on the live shape, `macro_source_health`
shows it and the engines keep running on the seed.

## Extending

- **A new indicator:** one row in `indicators.ts` (sources must exist in `sources.ts`), one normalisation entry in `liquidationConfidence.ts` or `taiwanRisk.ts`, one seed reading in `snapshot.ts`. The tests enforce the source link.
- **A new connector:** implement `Connector` in `macroConnectors.ts`, add a fixture test, push to `CONNECTORS`.
- **A new toggle:** extend `MacroToggles`, add a block in `macroAdjustments()`, add the switch to the panel.
- **A new model:** a panel of indicators, a prior, `assess()`; write its daily result to `macro_forecast_log` in `logForecasts()`.

## Standing rules honoured

No DeepSeek (unchanged). No secrets in `shared/`. No model ids in artefacts.
Every figure carries `{source, asOf}` or renders null with a reason. Ten
thousand paths, seeded, reproducible. Owner-only writes.
