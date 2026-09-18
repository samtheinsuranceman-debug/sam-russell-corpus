# Invention disclosure (draft for patent counsel): the Erosion Engine

Status: **draft disclosure, not filed.** Nothing here is a granted or pending
patent until counsel files. Inventor: Samuel A. Russell V. Prepared
2026-09-06 from the working implementation in `russell-capital-systems/`.

## Title
System and method for projecting a household's purchasing power under a
probabilistic long-horizon tax trajectory derived from historical statutory
records and a weighted panel of published fiscal forecasters, combined with a
category-level inflation ladder.

## Field
Computer-implemented financial planning; forecasting; data fusion.

## Problem
Financial projections assume current tax law for forty years and a single
inflation rate. Both assumptions are false over any real horizon: statutory
rates have changed dozens of times since 1946, and the cost of the things a
household actually buys (housing, education, medical care, food, energy) has
diverged sharply from the headline index. Plans built this way overstate
future purchasing power and understate the return required to grow at all.

## Summary of the invention
1. **A historical base-rate module** ingests the published statutory record
   (top marginal rate, corporate rate, capital-gains rate, estate exclusion)
   and, for each planning horizon h, computes over every h-year window the
   probability the rate ended higher, lower, or unchanged, and the
   distribution of the change.
2. **A forecaster panel module** maintains a registry of published
   long-horizon fiscal projections, each claim stored with its metric,
   horizon year, value, base value, as-of date and citation, and mapped by a
   rule set to a direction and, where the metric permits, a burden
   multiplier for a taxpayer. Each source carries three graded factors,
   evidence, track record and consistency, combined into a weight. Track
   record is computed automatically from recorded outcomes (mean absolute
   percentage error). Evidence may be graded by a council of independent
   language models reading the source's current publication, reconciled by
   a lead model.
3. **A blending module** produces, per horizon, a probability that taxes are
   higher, an expected change sized by the historical typical move, an
   expected rate, a burden multiplier and a confidence score, weighting the
   panel only in proportion to how much of its weight addressed that horizon
   ("coverage") and how much it agreed ("agreement").
4. **An inflation-ladder module** computes annualised category price change
   over 1–40 years from official index series, forms a client-specific basket
   from their own spending weights, and derives the purchasing-power decay
   of a unit of currency and the nominal return required to achieve a target
   real growth after inflation and tax on growth.
5. **A dual-projection module** runs the client's income and savings under
   current law with indexed brackets and under the expected tax path (the
   effective rate scaled by the interpolated burden multiplier), deflates both
   to present dollars, and reports the wealth gap, cumulative extra tax and
   hurdle rate at every horizon.
6. **A ledger module** appends every projection, with its inputs and the
   rule version, to an append-only hash-chained record.

## Novelty as understood by the inventor (for counsel to assess)
- Fusing an empirical base rate from the statutory record with a weighted,
  self-scoring panel of published forecasters, with coverage-proportional
  weighting, to yield horizon-specific probabilities and confidence scores
  for a taxpayer's future burden.
- Automatic track-record scoring of forecasters from recorded outcomes
  feeding the weights.
- A council of independent AI models grading source evidence from live
  publications, reconciled into a single grade.
- Presenting a plan under two erosion paths with a client-specific inflation
  basket and the resulting real hurdle rate, sealed on a tamper-evident
  ledger.

## Prior art to search (starting points)
CBO extended baseline methodology; Monte Carlo retirement planners with
tax-rate sensitivity; MoneyGuidePro / eMoney "tax rate increase" toggles;
academic work on forecast combination (Bates & Granger 1969; Clemen 1989),
superforecasting track-record scoring (Brier), and inflation-basket
personalisation (BLS R-CPI-E; personal inflation calculators).

## Reduction to practice
`shared/taxHistory.ts`, `shared/erosion.ts`, `server/forecastSources.ts`,
`server/inflation.ts`, `server/erosionRouter.ts`,
`client/src/pages/portal/Erosion.tsx`; tests in `server/erosion.test.ts`;
first commit 2026-09-06.
