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
