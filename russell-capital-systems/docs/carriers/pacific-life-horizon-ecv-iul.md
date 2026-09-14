# Pacific Horizon ECV IUL — sourced record

**Carrier:** Pacific Life Insurance Company, Omaha NE. Licensed in all states
except New York. Form series **P21IUL, S22ECV**.

**Sources, both held in the owner's Drive:**
- `IUF3957-00 9/25` (22-VER-87E) — description page. Charges, loan rates,
  rider factors, account list. *For financial professional use only.*
- `IUC4009-1124-WH 11/24 E1127` (22-VER-104D) — "Understanding Your Account
  Choices". Caps, participation, floors, and Pacific Life's published
  hypothetical crediting rates.

Encoded in `shared/pacificHorizonEcv.ts`. Every figure below is transcribed.
Nothing is inferred.

## Why this is the most useful document received so far

The Nationwide rate guide gave crediting and nothing else. This one gives
**charges and loan rates** — the two things the platform was missing.

## Charges

| Charge | Current | Guaranteed |
|---|---|---|
| Premium load, non-qualified | **5.20%** | 6.20% max |
| Premium load, qualified | **4.20%** | 6.20% max |
| Premium load, internal non-qual | **3.25%** | 6.20% max |
| Premium load, internal qualified | **2.25%** | 6.20% max |
| Monthly administrative charge | **$10** to age 121 | — |
| Surplus premium load (yr 1, above the lesser of 16× target / $3m / face) | **0%** | 20% |

**Cost of insurance:** "Rate per $1,000 of Net Amount at Risk, applies up to
age 121." The mechanic — and confirmation that `shared/policyMechanics.ts`
charges it correctly. **No rates given.**

**Coverage charge** (the per-unit charge): per $1,000 of initial Basic, ARTR
and SVER-3 coverage plus a flat rate on the basic layer, first 10 coverage
years current, to age 121 guaranteed. **No rates given.**

**Surrender charge:** applies within 10 years of any Basic Coverage layer
issue date. **No schedule given.**

## Loans — the answer to the gap

| | Charged | Credited | Net cost |
|---|---|---|---|
| Standard, current yrs 1–5 | 2.25% | 2.00% | **0.25%** |
| Standard, current yrs 6+ | 2.25% | 2.25% | **0%** |
| Standard, guaranteed | 2.25% | 1.00% | **1.25%** |
| Alternate (participating) | not published (7.5% guaranteed max) | one-year indexed accounts' interest on maturing segments | volatile |

**The standard loan is a contractual wash from policy year 6 on a current
basis.** On the guaranteed basis it costs 1.25% every year — five times the
current cost. An illustration run current and a policy performing guaranteed
are different products.

Pacific Life's own words on the alternate loan: *"may result in lower or
higher net loan costs, are more volatile, and carry greater risk than Standard
Loans."* That is the carrier describing the mechanism
`shared/policyLoanMechanics.ts` models — in a year the index credits nothing,
the alternate loan is charged its full rate against a credit of zero.

## Accounts — 1 fixed, 8 indexed

| Account | Index | Term | Current cap | Gtd cap | Current par | Gtd par | Charge |
|---|---|---|---|---|---|---|---|
| Fixed | — | 1yr | — | — | — | — | 1.0% gtd min rate |
| 1-Year | S&P 500 ex-div | 1 | 10.0% | 2.0% | 100% | 100% | — |
| 1-Year High Cap | S&P 500 ex-div | 1 | 12.0% | 4.0% | 100% | 100% | 0.80%/yr of AV |
| 1-Year No Cap Dynamic Par | S&P 500 ex-div | 1 | uncapped | — | **50%** | **5%** | — |
| 1-Year Invesco QQQ | QQQ ETF | 1 | 10.5% | 1.0% | 100% | 100% | — |
| 2-Year | S&P 500 ex-div | 2 | 24.0% *(term)* | 6.0% | 100% | 100% | — |
| High Par 5-Year | S&P 500 ex-div | 5 | uncapped | 10% *(term)* | 110% | 105% | — |
| 1-Year Volatility Control | BlackRock Endura | 1 | uncapped | — | n/p | n/p | +0.40% EABR credit |
| 1-Year High Par Vol Control | BlackRock Endura | 1 | uncapped | — | n/p | n/p | — |

**The Dynamic Par account carries a tenfold gap.** The illustration assumes
50% participation; the contractual guaranteed minimum is **5%**, and the rate
is declared as often as monthly. That gap is the entire risk of that account
and it is easy to miss on an illustration.

## Enhanced Performance Factor Rider — the multiplier, with real factors

`Segment's Indexed Interest Credit × Performance Factor = Total Credit`.
Factors for policy years 10–20, as of May 2025:

| Design | Current factor | Gtd factor | Monthly charge | Annualized |
|---|---|---|---|---|
| Classic (A) | 1.00 | 1.00 | 0% | **0%** |
| Performance (B) | 1.91 | 1.49 | 0.415% | **4.98%** |
| Performance Plus (C) | 2.36 | 1.72 | 0.625% | **7.50%** |

The charge is of the segment balance, in all years from policy year 2. So in a
year the index credits nothing, the multiplier multiplies nothing and the
7.50% runs anyway. That is exactly the trade `shared/policyMultiplier.ts`
exists to make visible — now with real numbers in it.

## Pacific Life's own published hypothetical rates

**Method is not ours:** segments created *monthly* and reallocated, 20-year
holding periods (S&P), monthly rates annualized. Our engine runs annual
point-to-point on calendar years. These will not agree and neither is wrong.

| Account | Period | Best | Worst | **Average** |
|---|---|---|---|---|
| 1-Year | 1988–2023 | 6.73% | 6.00% | 6.40% |
| No Cap Dynamic Par (@50%) | 1988–2023 | 6.48% | 4.75% | 5.70% |
| 1-Year High Cap | 1988–2023 | 6.97% | 6.02% | 6.51% |
| 2-Year | 1988–2023 | 7.82% | 6.03% | 6.89% |
| High Par 5-Year | 1988–2023 | 9.24% | 5.30% | **7.16%** |
| *S&P 500 ex-dividends* | 1988–2023 | 7.85% | 4.01% | *6.18%* |
| 1-Year Invesco QQQ | 2003–2023 | 9.85% | 4.92% | 7.71% |
| *Invesco QQQ ETF* | 2003–2023 | 25.95% | −0.17% | *13.49%* |
| 1-Yr High Par Vol Control | 2004–2023 | 13.55% | 5.02% | 10.09% |
| 1-Yr Vol Control | 2004–2023 | 12.21% | 4.53% | 9.10% |
| *BlackRock Endura* | 2004–2023 | 6.80% | 1.71% | *4.67%* |

The floor and the cap are both visible here: every S&P account's *worst* beats
the index's worst (4.01%), and the capped accounts' *best* trails the index's
best (7.85%). That is the trade the product makes, in the carrier's own
numbers.

## What cannot be modelled, and why

- **Fixed account** — current declared rate not published, only the 1.0% floor.
- **Both volatility control accounts** — no BlackRock iBLD Endura VC 5.5 ER
  series held, *and* participation rates not published.
- **Invesco QQQ account** — no QQQ *ETF* series held. The Nasdaq-100 series we
  hold is the index, not the ETF; they differ by the ETF's fees and tracking.

That leaves **five S&P 500 accounts** modellable. `modellableAccounts()` is
defined as "`cannotModel` returns null" so the two can never drift apart.

## Still needed for this product

1. **An illustration ledger** — closes the COI table, coverage charge rates and
   surrender schedule in one document. See `WHAT_TO_UPLOAD.md`.
2. The current declared fixed-account rate and current alternate loan rate.
3. Participation rates for the two volatility control accounts.
4. A BlackRock Endura series and an Invesco QQQ ETF series.
