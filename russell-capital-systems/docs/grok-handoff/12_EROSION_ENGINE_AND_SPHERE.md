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

### 4. Harvest — the council reads the sources' own pages
`harvestSource()` (server/forecastSources.ts) fetches a source's page (or a
URL the owner supplies), has every configured AI voice read it, and asks
each for figures in a fixed JSON shape: metric (one of `HARVEST_METRICS`),
horizon year, value, unit, base value, publication date, and **the verbatim
sentence the figure came from**. Three guards stand between a reply and the
queue:

1. `quoteVerified()`: the sentence must actually appear in the fetched text
   (whitespace and curly quotes normalised) *and* the number must appear in
   that sentence. A hallucinated sentence or a rounded number is dropped.
2. `readingFor()`: the platform's fixed reading of each metric supplies the
   direction and burden multiplier (revenue/GDP and top-rate figures give a
   multiplier; spending, deficit, debt and interest give direction only when
   a base value is present; trust-fund dates are always pressure; GDP
   effects are neutral). The AI never sets direction. Unknown metrics are
   discarded.
3. Corroboration: the same metric + year from several voices (values within
   1 %) collapses to one row that records every voice that agreed.

Survivors land in `forecast_harvests` (status `pending`). On the Purchasing
Power page the owner sees each one with its quote, the voices, and the
reading, and approves it into `forecast_claims` (citation = source, URL,
harvest date, voices; note = the quote) or rejects it. The trajectory
recomputes on approval. `erosion.harvestAll` sweeps every enabled source;
`EROSION_HARVEST_DAYS=7` on the host runs that sweep weekly, a minute after
boot and then on the interval. Nothing enters the panel without the owner.

### 5. Scoring — what actually happened
Every metric the panel forecasts maps to the series that records the outcome
(`ACTUAL_SERIES`: OMB/Treasury figures on FRED, fiscal-year basis — receipts,
outlays, deficit with the sign flipped, net interest, debt held by the
public). `scorePanel()` pairs each unscored claim whose year has fully closed
with the published observation for that year (`matchActuals()`), records it
with `recordActual()` — which recomputes the source's track record from every
scored claim (1 ÷ (1 + mean absolute relative error)) — and then regrades
every source's consistency with `consistencyFor()`: for each metric + year
the source has published more than once, the relative spread of its values;
consistency = 1 ÷ (1 + 4 × mean spread). A series that does not answer leaves
the claim unscored; nothing is typed in. "Score the panel" on the page runs
it; the scheduled sweep runs it after every harvest. As of September 2026 no
seeded claim has closed, so the pipeline is armed rather than exercised; the
first CBO 2035 figures score in 2036.

### PDF sources
`fetchSourceText()` reads PDFs as well as pages (content type or `.pdf` in
the URL) through `unpdf`, so the Trustees reports, the Financial Report and
CBO's own PDF can be harvested directly by pointing a harvest at the file.
Quotes are verified against the full extracted text (up to 40k characters);
the council reads the first 14k.

### 6. The power layer — who holds the levers (`shared/powerHistory.ts`, `server/power.ts`)
The tax path is read against political control, continuously.

**The record.** `CONTROL` gives, for every year 1945–2026, the party of the
president, the Senate majority and the House majority, verified against
senate.gov "Party Division", history.house.gov "Party Divisions" and
whitehouse.gov (the 2001 Jeffords flip and the 2021–22 50–50 Senate are
scored as the text explains). `demLeverShare(year)` weights president ½,
Senate ¼, House ¼. `conditionalWindowStats(series, h, bucket)` is
`windowStats` restricted to the h-year windows whose mean share was
left-held (≥ ⅔), divided, or right-held (≤ ⅓): the checkable record of what
happened to the top rate under each configuration. Buckets with fewer than
`MIN_WINDOWS` (15) windows are too thin and fall back to all windows.

**The pulse.** `powerSweep()` reads three keyless feeds and stores every
reading in `power_snapshots` (lever × measure × as-of date × source):
the unitedstates/congress-legislators current-members file (seats by party),
the Federal Judicial Center judges.csv (share of sitting Article III judges
appointed by Democratic presidents, by court level), and the prediction
markets — Polymarket's Gamma search and Kalshi's public markets list — for
the chance of Democratic control of the presidency, Senate and House at the
next election, with the market's own question stored beside the price and
Republican-framed questions flipped. Governors, state legislatures and mayors
go through the harvest path (council + verbatim quote + owner approval); they
are not machine feeds. `powerNow()` combines live seats (else the record),
the markets where they have spoken (else today's holder) into
`expectedShareNext`. The weekly sweep takes the pulse first, then harvests,
then scores; "Take the pulse now" on the page runs it on demand.

**The model.** `taxTrajectory({ power })`: the expected lever share over
each horizon is today's share until the next government is seated, the
market-implied share for one term, then the long-run mean since 1946
(`expectedShareOver`). The history term's `pUp` and typical move come from
the bucket that share lands in (`baseRateFor`), or the unconditional record
when the bucket is thin — and the page says which. Every horizon also
reports `pHigherIfLeft`, `pHigherIfRight` and `powerSwing` (their
difference): how much control alone moves the odds at that horizon.
`inflationByControl()` computes average December-over-December CPI inflation
under each configuration since 1947 from FRED's CPI series; it is shown as
history with a caveat and does not feed the ladder.

**Public check.** `erosion.powerStatus` reports which feeds have answered and
when, with no client data.

### Environment
`FRED_API_KEY` is now optional: without it the ladder and the Treasury
benchmarks use FRED's public CSV download (`fredgraph.csv`) for the same
series, same numbers, same as-of dates; with it the keyed JSON API is used.
`erosion.inflationStatus` (public, no client data) reports which transport
is live and the headline 20-year CPI rate, so a deploy can be checked from
outside. Any AI key enables the council and the harvest. `EROSION_HARVEST_DAYS`
turns on the scheduled sweep. No other secrets.

### What is deliberately not done
- A harvest reads one URL. Walking a source's site to find its newest report
  is not automated; the owner (or the sweep, on the fixed URLs) chooses the
  page or file.
- State income tax paths are not modelled; the record and the panel are
  federal.

## The Sphere (`/portal/sphere`, `shared/sphere.ts`)

One shape for the site. Every page is a point with two coordinates: a
meridian (twelve domains of a financial life, evenly around) and a latitude
(four layers, in: Facts → Erosion → Moves → Proof). The Plan Ledger is the
centre; every page is a facet of it. 42 pages are placed so far; a test
asserts each placed path is a real route. Adding a page means placing a
point, never adding a menu. The sidebar now has "Navigate by the Sphere":
one click swaps the section list for the twelve meridians, each opening
to its four layers with the placed pages, the Plan Ledger at the centre and
a link to the whole Sphere; the choice persists per browser
(`rcs_nav_sphere`), and the section list stays a click away for the
advisor's operations.

## Tested
`server/power.test.ts` (10 tests): the record's continuity and fifteen
anchor years against the official pages, lever shares and buckets, the
partition of every window into left/divided/right reproducing the
unconditional counts, the thin-bucket fallback, the expected-share path, the
trajectory's power point and swing, the Congress and FJC parsers on
fixtures, both market parsers including the Republican-framed flip, and the
inflation-by-control averages on a synthetic 3 % series.

`server/erosion.test.ts` (12 test blocks): FRED's CSV parsing and the keyless
transport (no api_key in any URL), the deterministic metric readings, the
verbatim-quote guard (curly quotes, whitespace, wrong number, sentence not
on the page), the harvest reply parser, and a three-voice harvest where a
hallucinated sentence is dropped and two voices corroborate one figure; outcome matching
(closed years only, sign flip, last quarter of a quarterly series, a failing
series leaves the claim unscored), the consistency grade, and a real PDF
round-trip through pdfkit → unpdf; plus the record's anchor values and
continuity, window statistics and change events, consensus weighting,
coverage and agreement, the trajectory's behaviour with and without panel
coverage, the seeds' citations and the CBO multiplier, annualisation, the
purchasing-power decay, the hurdle identity (17.0 %), the ladder builder, the
basket, both projections and their gap, and the Sphere's coordinates.
