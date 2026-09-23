# Macro factors — the twenty-five, with source, coverage and verdict

Generated from `shared/macro/indicators.ts` (`MACRO_FACTORS`) by `server/macroFactorsDoc.ts`; macro layer 2026.09.23a; rendered 2026-09-22. Do not edit by hand — the test `server/macroW8.test.ts` compares this file with the renderer's output.

**Counts:** 25 factors · 5 keyless sources (fred, nyfed-acm, nyfed-soma, fiscaldata-debt, wb-wdi-api) · verdicts: 0 signal, 0 context, 25 pending.

A factor is a data row: the series it is read from, a transform, the target it claims to lead and the horizon. Neutral point, span and plausibility bounds are rows in `assumptions.ts` (`factor.<id>.*`). The verdict is measured by `backtestFactor()` in `emergentPatterns.ts` over the stored history: **signal** means a lead correlation of at least 0.2 at the stated horizon and a directional hit rate of at least 55 % over at least 60 months; **context** means no such lead was measured and the row carries weight 0 in any model; **pending** means fewer than 60 months are stored (or none). "Coverage" is the span of stored rows, or the span the publisher offers when nothing is stored yet. Direction: ↑ a rise in the factor moves the target up; ↓ down.

| Factor | Name | Source (access) | Series | Transform | Cadence | Target @ horizon | Dir | Coverage, years | Backtest verdict |
|---|---|---|---|---|---|---|---|---|---|
| f-curve-10y3m | 10-year minus 3-month Treasury spread | fred (keyed-api) | `fred:T10Y3M` | level | daily | f-recession @ 12m | ↓ | 44.7 as published (from 1982-01-04); 0 stored | pending (no history stored) |
| f-curve-10y2y | 10-year minus 2-year Treasury spread | fred (keyed-api) | `fred:T10Y2Y` | level | daily | f-recession @ 18m | ↓ | 50.3 as published (from 1976-06-01); 0 stored | pending (no history stored) |
| f-fed-funds | Effective federal funds rate | fred (keyed-api) | `fred:DFF` | level | daily | f-recession @ 12m | ↑ | 72.2 as published (from 1954-07-01); 0 stored | pending (no history stored) |
| f-sahm | Sahm rule: 3-month unemployment average minus its 12-month low | fred (keyed-api) | `fred:UNRATE` | sahm | monthly | f-recession @ 3m | ↑ | 78.7 as published (from 1948-01-01); 0 stored | pending (no history stored) |
| f-claims-yoy | Initial jobless claims, year on year | fred (keyed-api) | `fred:ICSA` | yoy | weekly | f-unrate @ 6m | ↑ | 59.7 as published (from 1967-01-07); 0 stored | pending (no history stored) |
| f-cpi-yoy | CPI inflation, year on year | fred (keyed-api) | `fred:CPIAUCSL` | yoy | monthly | ust10y @ 6m | ↑ | 79.7 as published (from 1947-01-01); 0 stored | pending (no history stored) |
| f-m2-yoy | M2 money stock, year on year | fred (keyed-api) | `fred:M2SL` | yoy | monthly | f-cpi-yoy @ 18m | ↑ | 67.7 as published (from 1959-01-01); 0 stored | pending (no history stored) |
| f-baa-spread | Baa corporate minus 10-year Treasury | fred (keyed-api) | `fred:BAA10Y` | level | daily | f-recession @ 9m | ↑ | 40.7 as published (from 1986-01-02); 0 stored | pending (no history stored) |
| f-fed-assets-yoy | Federal Reserve total assets, year on year | fred (keyed-api) | `fred:WALCL` | yoy | weekly | ust10y @ 6m | ↓ | 23.8 as published (from 2002-12-18); 0 stored | pending (no history stored) |
| f-nfci | Chicago Fed National Financial Conditions Index | fred (keyed-api) | `fred:NFCI` | level | weekly | f-recession @ 6m | ↑ | 55.7 as published (from 1971-01-08); 0 stored | pending (no history stored) |
| f-vix | CBOE VIX | fred (keyed-api) | `fred:VIXCLS` | level | daily | f-recession @ 3m | ↑ | 36.7 as published (from 1990-01-02); 0 stored | pending (no history stored) |
| f-consumer-sentiment | University of Michigan consumer sentiment | fred (keyed-api) | `fred:UMCSENT` | level | monthly | f-recession @ 9m | ↓ | 73.9 as published (from 1952-11-01); 0 stored | pending (no history stored) |
| f-housing-starts-yoy | Housing starts, year on year | fred (keyed-api) | `fred:HOUST` | yoy | monthly | f-recession @ 12m | ↓ | 67.7 as published (from 1959-01-01); 0 stored | pending (no history stored) |
| f-indpro-yoy | Industrial production, year on year | fred (keyed-api) | `fred:INDPRO` | yoy | monthly | f-recession @ 3m | ↓ | 107.7 as published (from 1919-01-01); 0 stored | pending (no history stored) |
| f-oil-wti-yoy | WTI crude, year on year | fred (keyed-api) | `fred:DCOILWTICO` | yoy | daily | f-cpi-yoy @ 6m | ↑ | 40.7 as published (from 1986-01-02); 0 stored | pending (no history stored) |
| f-dollar-broad-yoy | Broad dollar index, year on year | fred (keyed-api) | `fred:DTWEXBGS` | yoy | daily | f-cpi-yoy @ 12m | ↓ | 20.7 as published (from 2006-01-02); 0 stored | pending (no history stored) |
| f-usdjpy-yoy | USD/JPY, year on year | fred (keyed-api) | `fred:DEXJPUS` | yoy | daily | tic:japan @ 6m | ↓ | 55.7 as published (from 1971-01-04); 0 stored | pending (no history stored) |
| f-usdcny-yoy | USD/CNY, year on year | fred (keyed-api) | `fred:DEXCHUS` | yoy | daily | tic:china @ 6m | ↓ | 45.7 as published (from 1981-01-02); 0 stored | pending (no history stored) |
| f-foreign-share-debt | Foreign-held share of federal debt | fred (keyed-api) | `fred:FDHBFIN` / `fred:GFDEBTN` | ratio-pct | quarterly | ust10y @ 12m | ↓ | 56.7 as published (from 1970-01-01); 0 stored | pending (no history stored) |
| f-debt-to-gdp | Federal debt held by the public, % of GDP | fred (keyed-api) | `fred:GFDEGDQ188S` | level | quarterly | ust10y @ 24m | ↑ | 60.7 as published (from 1966-01-01); 0 stored | pending (no history stored) |
| f-interest-outlays-gdp | Federal net interest outlays, % of GDP | fred (keyed-api) | `fred:FYOIGDA188S` | level | annual | ust10y @ 24m | ↑ | 86.2 as published (from 1940-06-30); 0 stored | pending (no history stored) |
| f-acm-term-premium | ACM 10-year term premium | nyfed-acm (open-api) | `nyfed:acm` | level | daily | ust10y @ 6m | ↑ | 65.3 as published (from 1961-06-14); 0 stored | pending (no history stored) |
| f-soma-treasury | SOMA Treasury holdings | nyfed-soma (open-api) | `nyfed:soma` | level | weekly | ust10y @ 12m | ↓ | 23.2 as published (from 2003-07-23); 0 stored | pending (no history stored) |
| f-avg-interest-marketable | Average interest rate on marketable Treasury debt | fiscaldata-debt (open-api) | `fiscaldata:avg_interest_rates` | level | monthly | f-interest-outlays-gdp @ 12m | ↑ | 25.6 as published (from 2001-01-31); 0 stored | pending (no history stored) |
| f-world-gdp-growth | World real GDP growth | wb-wdi-api (open-api) | `worldbank:NY.GDP.MKTP.KD.ZG` | level | annual | f-indpro-yoy @ 12m | ↑ | 64.7 as published (from 1961-12-31); 0 stored | pending (no history stored) |

## Targets

| Indicator | Series | Source | Published from | Plausible range |
|---|---|---|---|---|
| f-recession | `fred:USREC` | fred | 1854-12-01 | 0–1 |
| f-unrate | `fred:UNRATE` | fred | 1948-01-01 | 0–30 |
| ust10y | `fred:DGS10` | fred | 1962-01-02 | 0–20 |
| tic:japan | `tic:history:Japan` | us-tic-mfh | 2000-03-31 | 100–3000 |
| tic:china | `tic:history:China, Mainland` | us-tic-mfh | 2000-03-31 | 50–3000 |
| f-cpi-yoy, f-indpro-yoy, f-interest-outlays-gdp | (factor rows above, used as targets) | fred | — | — |

## How a verdict is earned

1. The daily refresh pulls each series in full (`fredgraph.csv`, the NY Fed CSV and JSON, Fiscal Data, the World Bank API, the TIC history file), drops readings outside the plausibility bounds, and stores month-end points plus the latest reading. If more than 5 % of readings fail the bounds the pull is refused as a format change and nothing is stored.
2. `backtestFactor()` aligns factor and target on a monthly grid; for each month it takes the factor's signal and the target's move over the horizon (level) or whether it fired inside the window (binary); it reports Pearson r at the horizon, the same r against the preceding window (does it lead or follow), and the directional hit rate outside the ±0.1 neutral band.
3. Signal or context is written to `macro_factor_scores`; `applyFactorVerdicts()` zeroes the weight of anything that is not a signal before a model consumes the row.
4. Every refresh logs one forecast per factor; when its horizon passes it is scored (Brier) against the stored target and the running score joins the verdict. Thomas quotes both.

_A factor with no measurable lead is kept as context, not signal. That is what makes "predictive" a measured word._
