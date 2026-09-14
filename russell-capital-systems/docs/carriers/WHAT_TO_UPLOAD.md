# What to upload next, and what each one buys

You said you'd keep uploading illustrations. This is the order that gets the
most out of the fewest, and what each one actually closes.

## What you've already given, and what it bought

The **Nationwide IUL Accumulator II 2020 rate guide** (FLM-1491AO.10 (02/25),
rates as of 15 March 2025) is transcribed in full in
`nationwide-iul-accumulator-ii-2020.md`. It bought all of the crediting:
twelve strategies with caps, participation rates, spreads, floors and strategy
charges, current and guaranteed, plus the carrier's own published look-backs
over six windows. Our model now reproduces those look-backs to within a point
using the carrier's own arithmetic method, which is the closest thing to proof
we can get without an illustration.

It bought none of the cost. A rate guide is not an illustration, and cost is
most of the answer.

## The one number that decides how much this matters

How funded the design is. The uncertainty in the mortality charge alone,
across a plausible range, moves the thirty-year account value by:

| Design | Swing from mortality uncertainty alone |
|---|---|
| $50k × 10 years into $1.0M face | **7.8%** |
| $25k × 20 years into $1.5M face | **32.9%** |
| $8k × 30 years into $1.0M face | **131.5%** |

That last row is $518,548 against $28,484 on the same premium — the range spans
"comfortable" and "lapsed". Those figures are measured by running the engine at
each end of the band, and `server/unpricedParameters.test.ts` re-measures them
on every test run so they cannot quietly stop being true.

**The practical reading:** the max-funded designs you actually sell are the
forgiving case, which is why the platform can run at all today. A thin
protection design cannot be projected honestly without a real mortality table,
and no disclaimer fixes that.

## Upload 1 — a max-funded ledger on the Nationwide product

**What:** an illustration on Accumulator II, max-funded (premiums stopping
after 5–10 years, not level for life), showing the year-by-year ledger:
policy year, attained age, premium, accumulation value, **surrender value**,
**death benefit**. Any age and class — tell me which.

**What it closes, exactly, with no fitting at all:**

- **Total charges for every policy year.** The account value recursion runs
  backwards: `charges = priorValue + premium − accountValue ÷ (1 + rate)`.
  Every term is printed on the page. Nothing is assumed.
- **The surrender charge schedule.** It is the printed difference between the
  account value and the surrender value columns.
- **The corridor factors** wherever the death benefit exceeds the face amount.

**What it closes by fitting, with a confidence grade attached:** the split of
those total charges into premium load, fixed annual charge and mortality. The
premiums stopping is what makes this work — while a premium is level, a
percentage of it is arithmetically identical to a flat annual fee, and no
amount of cleverness separates them.

This single document is worth more than every other item on this list combined.

## Upload 2 — the same product at a different face amount

**What:** same age, same class, same premium if possible — just a materially
different death benefit.

**What it closes:** the split between the **monthly policy fee** and the
**per-unit charge**. These never separate from one illustration at any funding
level, because both are flat dollars per year. Only the per-unit charge scales
with face, so two face amounts is the only thing that can do it.

Until this arrives the fitted charges are right at the face amount they were
fitted to and wrong at every other one. The code parks the whole undivided
amount on the policy fee and says so rather than splitting it blind.

## Upload 3 — a thin or protection-oriented ledger

**What:** a level-premium design on the same product, minimum non-MEC funding
or close to it.

**What it closes:** it tests the fitted mortality curve where it actually
bites. A curve fitted on a max-funded policy is fitted where the amount at risk
is collapsing and the charge is small; this checks it where the charge is
carrying the whole policy. If the two disagree, the reference curve shape is
wrong and I'd rather find that out from your documents than from a client.

## Upload 4 — the product guide's loan section (now only two numbers)

**What:** the pages covering policy loans — the rate charged on the balance,
and the rate credited to collateral on a fixed loan. Also whether a wash loan
is offered and whether it is *contractually guaranteed* or a current declared
practice the carrier can change.

**What it closes:** those two rates are the only quotes left. Everything built
around them is already done in `shared/policyLoanMechanics.ts` and needed no
document:

- a **wash loan** costs zero by contract; a **fixed loan** costs a known
  spread; a **participating loan** is charged its full rate in every year the
  index credits nothing — seven years in thirty on the 1996–2025 record, which
  the engine counts rather than averaging away
- the **crossover year** is closed-form whenever the charged rate exceeds the
  credited rate: `ln(cashValue / loan) ÷ ln((1+charged)/(1+credited))`
- **charged in advance**, the interest comes out of the proceeds — a $60,000
  draw at 5% hands over $57,000, so the illustration's income column is not
  what reaches the bank
- **on lapse**, the discharged loan is part of the amount realised, so the
  whole accumulated gain is ordinary income while the cash value goes to repay
  the loan and the client receives nothing. The engine computes that bill and
  the cheque they have to write from elsewhere.

## Upload 5 — anything at all on Securian, Pacific Life or Lafayette

Right now those are placeholder option sets with no source and no date, and the
carrier names have been removed from the app for exactly that reason. A rate
guide gets crediting; an illustration gets crediting *and* cost.

Lafayette specifically needs the whole-life side: the guaranteed cash value
table, the current dividend scale, the paid-up additions rider load, whether
it's direct or non-direct recognition, and the loan rate. The infinite-banking
engine is built and tested but has no carrier data in it at all.

## Two things you cannot fix by uploading illustrations

**The DJIA annual series.** The Multi-Index strategies blend 50% of the
best-performing index, 30% of the second and 20% of the third across the S&P
500, Nasdaq-100 and Dow Jones Industrial Average. We hold the first two.
Without the third the blend cannot be computed, which is why those strategies
are refused rather than approximated. This needs a sourced price-return series,
not a carrier document.

**The IRC 7702 corridor table.** ~~Needs transcribing.~~ **Done** —
`shared/irc7702.ts` carries the ten brackets of 26 U.S.C. 7702(d)(2),
interpolated ratably as the statute directs, and it now defaults into every
projection. Interpolating reproduces all 32 of the commonly published integer
percentages exactly, which is a real check on the transcription.

Switching it on raised the mortality sensitivity on a max-funded design from
5.0% to 7.8% — the corridor drags the death benefit up, which drags the amount
at risk up. The gap got more expensive by being modelled correctly.

One thing still outstanding: every direct fetch of the statute
(law.cornell.edu, uscode.house.gov, govinfo.gov, uscode.ecfr.io, law.justia.com)
is blocked by this environment's egress proxy, so the table was confirmed
against two independent searches rather than read beside the primary text.
`VERIFIED_AGAINST_PRIMARY_TEXT` in that file is the flag to flip once somebody
spends ten minutes with the statute. Worth doing before it drives a client
illustration.

## How to send them

Ledger figures are fine in any form — a PDF, a screenshot, or typed-out
columns. What matters is that each row carries the policy year, the attained
age, the premium and the accumulation value, plus the surrender value and death
benefit if the illustration prints them, and that you tell me **the rate the
illustration was run at**. That last one is the only thing that cannot be
recovered from the ledger itself, because the credited rate and the charges
trade off against each other exactly — a ledger alone cannot tell a generous
rate with high charges from a modest rate with low ones.

Keep client illustrations with names on them out of the repository. The ledger
columns and the case parameters are what the calibration needs; the name on the
front page is not, and it should not end up in version control.

## What happens when one arrives

`shared/illustrationCalibration.ts` does the work — `calibrateFromIllustration`
returns the exact figures, the fitted split, a per-year residual, and a
`nextUpload` list naming whatever the ledger still could not determine. A
round-trip test builds a ledger from known charges, hands the solver only the
ledger, and checks it gives the charges back. The method is proven before your
document touches it.
