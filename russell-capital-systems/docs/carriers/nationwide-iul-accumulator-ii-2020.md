# Nationwide IUL Accumulator II 2020 — rate guide

**Source:** *Nationwide® IUL Accumulator II 2020 IUL Rate Guide*, document
FLM-1491AO.10 (02/25), held in the owner's Drive as
"Nationwide Accumulator II Interest Rates.pdf".
**Current and guaranteed rates as of:** 15 March 2025.
**Look-back rates as of:** 15 January 2025, updated annually by Nationwide.
**Issuer:** Nationwide Life and Annuity Insurance Company, Columbus, Ohio.

Every figure below is transcribed from that document. Nothing here is inferred.

## Current and guaranteed rates

| Strategy | Cap | Participation | Spread | Floor | Strategy charge |
|---|---|---|---|---|---|
| **Core** | | | | | |
| One-Year Multi-Index Monthly Average | 13.00% *(gtd 4.0%)* | 100% | — | 0.0% | 0.0% *(gtd 0.5%)* |
| One-Year S&P 500 Point-to-Point | 10.25% *(gtd 4.0%)* | 100% | — | 0.0% | 0.0% *(gtd 0.5%)* |
| One-Year Uncapped S&P 500 Point-to-Point | none | 100% | 6.00% *(gtd 10.0%)* | 0.0% | 0.0% *(gtd 0.5%)* |
| **High cap** | | | | | |
| One-Year High Cap Multi-Index Monthly Average | 25.00% *(gtd 4.0%)* | 100% | — | 0.0% | 0.85% *(gtd 1.5%)* |
| One-Year High Cap S&P 500 Point-to-Point | 13.00% *(gtd 4.0%)* | 100% | — | 0.0% | 1.0% *(gtd 1.5%)* |
| **Volatility control — Plus** | | | | | |
| J.P. Morgan Mercury Plus | none | 185% *(gtd 65%)* | — | 0.0% | 0.0% + 0.6% Plus credit |
| BNPP Global H-Factor Plus | none | 235% *(gtd 65%)* | — | 0.0% | 0.0% + 0.6% Plus credit |
| **Volatility control — High participation** | | | | | |
| J.P. Morgan Mercury High Par | none | 210% *(gtd 65%)* | — | 0.0% | 0.0% |
| BNPP Global H-Factor High Par | none | 265% *(gtd 65%)* | — | 0.0% | 0.0% |
| **Volatility control — High par select** | | | | | |
| J.P. Morgan Mercury High Par Select | none | 250% *(gtd 65%)* | — | 0.0% | 1.0% *(gtd 1.5%)* |
| BNPP Global H-Factor High Par Select | none | 315% *(gtd 65%)* | — | 0.0% | 1.0% *(gtd 1.5%)* |
| **Fixed** | | | | | |
| Fixed interest strategy | credited 4.00% *(gtd 1.0%)* | — | — | — | — |

## Nationwide's own published look-back rates

Invaluable, because they are the carrier's answer to the question our engine
also answers — so they are the benchmark our model is checked against.

| Strategy | 30-yr | 25-yr | 20-yr | 15-yr | 10-yr | 5-yr |
|---|---|---|---|---|---|---|
| Multi-Index Monthly Average | 7.52% | 6.54% | 7.32% | 7.93% | 7.86% | 8.46% |
| S&P 500 Point-to-Point | 6.98% | 6.47% | 7.03% | 7.51% | 7.18% | 7.22% |
| Uncapped S&P 500 Point-to-Point | 8.68% | 7.20% | 8.17% | 8.81% | 9.57% | 13.98% |
| High-Cap Multi-Index Monthly Average | 9.32% | 7.54% | 8.40% | 8.90% | 9.15% | 11.08% |
| High-Cap S&P 500 Point-to-Point | 8.42% | 7.74% | 8.48% | 9.10% | 8.77% | 9.05% |
| *S&P 500 index itself, no cap or par applied* | 9.71% | 7.33% | 9.67% | 12.49% | 12.53% | 15.63% |

Nationwide's stated method, verbatim in effect: the look-backs "are an average
of the 1-year rates calculated for each of the strategies" — an **arithmetic**
average, not a compound one — and they **exclude** the strategy charges for the
High-Cap and High-Par Select strategies and the 0.60% Plus credit.

## How the Multi-Index strategy is actually defined

From the document: a weighted blend of **50% from the best-performing index,
30% from the second-best and 20% from the third-best**, across the **S&P 500,
Nasdaq-100 and Dow Jones Industrial Average** (excluding dividends).

This matters. An earlier note in `server/partnerApi.ts` called that weighting
hindsight bias. It is not — it is the contract. The correction is recorded
because the original claim was wrong and was published in a commit message.

## What our held data had wrong

`shared/indexCreditingData.ts` carries an anonymised set, "A Mutual Life",
whose terms match this product closely enough that it plainly is it.

| Field | Was | Should be |
|---|---|---|
| Multi-Index cap | 14% | **13.00%** |
| Multi-Index third component | Russell 2000 | **Dow Jones Industrial Average** |
| Uncapped S&P spread | 5.75% | **6.00%** |
| High-Cap S&P cap | 13.25% | **13.00%** |
| High-Cap S&P charge | 1.5% (the guaranteed figure) | 1.0% current / 1.5% guaranteed |
| High-Cap Multi-Index charge | 1.5% (the guaranteed figure) | 0.85% current / 1.5% guaranteed |

Using the guaranteed charge with the current cap mixes two columns of the rate
sheet. It errs conservatively, which is the right direction, but it is still
two different scenarios stitched together.

## The defect that remains after those fixes

**We hold no Dow Jones Industrial Average series.** `RAW_INDEX_RETURNS` has
SP500, NASDAQ100 and RUSSELL2000 only. The Multi-Index strategies cannot be
modelled faithfully until DJIA annual returns are added from a source.

**And the monthly average is still modelled as annual point-to-point.** Every
strategy above with "Monthly Average" in its name averages the index across
the year; our engine takes the year's start-to-end change. Averaging strips
the peak, which is precisely why Nationwide can offer a 25% cap on one. Our
model returned 12.93% compound over 1996-2025 where Nationwide publishes 9.32%
arithmetic over 30 years — and an arithmetic average runs *higher* than a
compound one, so the true gap is wider than 3.6 points.

Those two are why the partner API refuses to run the Multi-Index strategies.
The refusal stands; the reason given has been corrected.

## Still needed for this product

- Dow Jones Industrial Average annual returns, sourced
- The monthly-average mechanic: which monthly figure, averaged how
- Surrender charge schedule by policy year, issue age and class
- Whether the indexed strategy charge is taken in a zero-credit year
