# Carrier product intake

Where real Securian, Nationwide and Pacific Life terms go, and the standard
they have to meet before they can drive an illustration.

## Why this file exists

`shared/indexCreditingData.ts` holds three anonymised option sets — "A Mutual
Life", "A+ Mutual Life", "A- Mutual Life" — with caps, participation rates and
spreads. Not one of those numbers carries a source or a date. Three aliases
used to name them as Nationwide, Securian and Symetra; those were unused and
have been removed, because an unsourced cap presented as a named carrier's
product is a factual claim about a real company that nobody can check.

Real terms replace them, one field at a time, each carrying where it came from.

## What is needed per strategy

From the carrier's own current rate sheet or product guide — not a summary, not
a brochure page, not a competitor's comparison chart:

| Field | Notes |
|---|---|
| Carrier and product name | Exact, including the series |
| Strategy name | As the contract names it |
| Index or indices | With component weights if blended |
| Crediting method | **Point-to-point, monthly average, monthly sum, daily average.** This is the field that matters most and the one usually lost |
| Cap | Or "uncapped" |
| Participation rate | |
| Spread / threshold | Deducted before or after the cap — say which |
| Floor | |
| Strategy charge | And whether it is taken in a zero-credit year |
| Term | 1-year, 2-year, 5-year |
| Guaranteed minimums | The contractual floor under each of the above |
| As-of date | The date on the rate sheet |
| Source | Document name and page |

## Crediting method is not a detail

A 25% cap on a **monthly average** strategy credits far less than a 25% cap on
an **annual point-to-point** strategy, because the averaging strips out the
peak. That is exactly why a carrier can afford the higher cap.

The held data contains strategies named "Monthly Avg" that are modelled on
annual point-to-point returns. They produce 12.93% compound over 1996-2025,
which is above anything AG 49-A would let a carrier illustrate, and the partner
API refuses to run them for that reason. When the real method arrives they can
be modelled properly.

## The multiplier (Pacific Life and others)

`shared/policyMultiplier.ts` models the mechanism now and needs these terms to
model a specific product:

- The factor — 1.5x, 1.6x, and whether it varies by year or by strategy
- The annual charge, as a percentage of account value
- **Whether the charge is taken in a year the index credits nothing.** For
  every such rider seen so far it is, and that is the entire trade: over
  1996-2025 a capped S&P strategy credited zero in seven years out of thirty,
  and on those seven the rider is pure cost
- Whether the charge is guaranteed or current, and its guaranteed maximum
- Whether the factor applies to the credit or to the account value

## Cost of insurance

This is the largest gap in the whole system and the one that moves the
answer most.

`shared/policyMechanics.ts` is now the one place a premium becomes cash
value. Every projection on the platform steps through `stepPolicyYear()`,
which charges in order: premium less load, policy fee, per-unit charge,
cost of insurance **on the net amount at risk**, then the credit. Before
that, five different files each had their own version and all five were
wrong in different ways — mortality as a percentage of account value, as a
percentage of premium, charged after crediting, or not charged at all.

What is needed, per illustrated case:

| Field | Notes |
|---|---|
| Rate per $1,000 of net amount at risk | By attained age, ascending |
| Sex | The tables differ materially |
| Underwriting class | Preferred non-smoker to standard smoker is more than a factor of two at the same age |
| Guaranteed vs current | Both, if the policy publishes both |
| Policy fee | Per month |
| Per-unit charge | Per $1,000 of face, per month, and the years it applies |
| IRC 7702 corridor factors | By attained age. Where the corridor forces the death benefit above the specified amount, the amount at risk rises with it |
| As-of date and source | Document name and page |

Until a real table arrives, projections run on `ILLUSTRATIVE_COI_TABLE` —
five generic age bands carried over from the old inline code. It is
labelled as not a carrier schedule, and anything built on it reports
`reliable: false` with a note saying to treat the charge as an order of
magnitude. It exists only because a projection with no mortality charge at
all is wrong in the flattering direction.

**A projection with no death benefit charges no mortality.** Cost of
insurance is charged on the death benefit less the account value; with no
specified amount there is no amount at risk. Several pages had no death
benefit input at all, which is how they got away with the wrong mechanic.
They take one now, and where it is left blank the page says on screen that
the values are too high.

## Surrender charges

Needed as a percentage by policy year. Without one, every tool here shows
surrender value equal to account value and says so — which is wrong by a large
amount in the early years, and wrong in the flattering direction.

Surrender charges vary by issue age, gender, rating class and state. One
schedule per illustrated case, not one per product.

## The rule

A field without a source and an as-of date does not go in. If a document is
missing a number, the number stays absent and the tool reports it as absent.
Filling a gap with a plausible figure is how a rate sheet becomes fiction that
nobody can later distinguish from fact.
