# The Erosion Engine and the Sphere (handoff 12)

Built 2026-09-06 from the owner's brief: two erosion forces against every
plan, the tax force derived from history plus a weighted panel of published
forecasters, and one structure for the site instead of a pile of pages.
Paths relative to `russell-capital-systems/`.

## The Erosion Engine (`/portal/erosion`, router `erosion`)

### 1. The tax trajectory
- **The record** (`shared/taxHistory.ts`): top marginal federal rate 1913–2026,
  top corporate rate 1950–2026, maximum long-term capital-gains rate (verified
  eras only; 1968–1978 left null), estate basic exclusion 1987–2026, each with
  its source. `windowStats(series, h)` computes, over every h-year window since
  1946, the share of windows where the rate ended higher / lower / unchanged,
  the mean and mean-absolute change, and the largest rise and fall.
- **The panel** (`server/forecastSources.ts`): eleven published forecasters
  (CBO, Treasury Financial Report, Social Security and Medicare Trustees, JCT,
  Penn Wharton, Tax Policy Center, Tax Foundation, CRFB, GAO, Yale Budget Lab)
  with what each publishes, how, and how far out. Weight = evidence ×
  (½ + ½·track record) × (½ + ½·consistency). Evidence is a platform default
  the owner can edit or hand to the **AI council** (every configured model
  grades the source from its live page; the lead model reconciles). Track
  record accrues automatically: when an actual outcome is recorded against a
  claim, the source's mean absolute percentage error sets its score.
- **Claims** (`forecast_claims`): the figures the sources actually published,
  with as-of date and citation, plus the platform's reading (direction for
  the client's tax burden; a burden multiplier where the metric allows, e.g.
  CBO revenue 19.3 % of GDP in 2055 ÷ 17.1 % today = 1.129). The seed set is
  what was verified on 2026-09-06 and carries the caveat that CBO's March 2025
  baseline predates the One Big Beautiful Bill Act.
- **The blend** (`shared/erosion.ts`): at each horizon 5…40 years, history
  supplies the odds a rate is higher and the typical size of a move; the panel
  shifts the odds in proportion to how much of its weight spoke to that
  horizon. Output: P(higher), expected change, expected top rate, burden
  multiplier, confidence (history dispersion × panel coverage × agreement),
  and the weight placed on history. Where nothing is published (five years
  out today) the answer is the base rate alone, and the page says so.

### 2. The inflation ladder
- `server/inflation.ts` reads fourteen Bureau of Labor Statistics CPI series
  (all items, shelter, rent, medical, college tuition, day care, food at home,
  meats, gasoline, energy, electricity, motor-vehicle insurance, tobacco) and
  M2 from FRED and computes the annualised change over 1, 2, 5, 10, 15, 20,
  25, 30, 35 and 40 years, same month each year. Needs `FRED_API_KEY` (free);
  without it every cell reads "unavailable". Last-good values snapshot into
  `market_data_points`.
- The client sets basket weights (what they actually spend on); the basket's
  20-year rate becomes their inflation rate. `purchasingPower(rate, years)`
  is what a dollar buys; `hurdleRate(realTarget, inflation, taxOnGrowth)` is
  the nominal return needed to grow at all after both forces:
  ((1 + real)(1 + inflation) − 1) ÷ (1 − tax). With 7 % inflation, a 3 % real
  target and 40 % tax on growth that is 17.0 %, which is the owner's number.

### 3. Two projections
`project()` runs the client's income and savings for 40 years under current
law (2026 rule set, brackets indexed at the inflation rate) and under the
expected tax path (effective federal rate × the interpolated burden
multiplier), both deflated to today's dollars. `erosionSummary()` reports
real wealth at every horizon, the gap between the paths, cumulative extra tax,
the hurdle rate and the 40-year dollar. "Seal on my ledger" appends a
`scenario` event with every input and result.

### Environment
`FRED_API_KEY` (ladder), any AI key (council). No other secrets.

### What is deliberately not done
- The fetch-and-parse of new claims from the sources' pages is a manual step
  (`erosion.addClaim`) or the council path; automatic extraction of figures
  from PDFs is the next piece.
- State income tax paths are not modelled; the record and the panel are
  federal.

## The Sphere (`/portal/sphere`, `shared/sphere.ts`)

One shape for the site. Every page is a point with two coordinates: a
meridian (twelve domains of a financial life, evenly around) and a latitude
(four layers, in: Facts → Erosion → Moves → Proof). The Plan Ledger is the
centre; every page is a facet of it. 42 pages are placed so far; a test
asserts each placed path is a real route. Adding a page means placing a
point, never adding a menu. The next step is to let the Sphere replace the
sidebar for clients, with the sidebar kept for the advisor's operations.

## Tested
`server/erosion.test.ts` (10 tests): the record's anchor values and
continuity, window statistics and change events, consensus weighting,
coverage and agreement, the trajectory's behaviour with and without panel
coverage, the seeds' citations and the CBO multiplier, annualisation, the
purchasing-power decay, the hurdle identity (17.0 %), the ladder builder, the
basket, both projections and their gap, and the Sphere's coordinates.
