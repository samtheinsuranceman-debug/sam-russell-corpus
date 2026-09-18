# Tax-Free Income for Life + the Longevity Engine — the sequence, the years, the studies

Dictated 7 September 2026; built the same day (`/portal/income-for-life`,
`shared/incomeForLife.ts`, `shared/longevityEngine.ts`,
`server/incomeForLifeRouter.ts`, router key `incomeLife`).

## The sequence the page enforces
1. **Never on taxable money.** A lifetime-income plan is not illustrated on
   a taxable account; the page refuses and says why. The pre-tax account
   goes through the Roth conversion pass first (`/portal/roth-conversion`);
   the conversion tax is typed from that pass (0 when the pass zeroes it).
2. **The payout from a rate sheet.** Every payout, bonus and deferral is a
   row the owner typed from a carrier's published rate sheet, with the
   sheet's URL and date (`income_rate_sheets`). The page prints no rate of
   its own and ranks nothing it has not read. The "top ten" is whatever
   rows the owner has added, ordered by payout.
3. **Sized by the Longevity Engine.** Expected years of payment for one
   life, or while at least one of two is alive, from the Social Security
   Administration's 2023 period life table; the expected total is the level
   payment times those years (undiscounted, the record's dollars).
4. **What tax would take.** The same income at the client's marginal rate,
   for the same years, beside the tax-free figure.
5. **The studies first.** The research on guaranteed income and wellbeing
   is at the top of the page, before any number, and prints first when the
   page is saved as a PDF.

## Tier A: read and cited
| What | Source | How it lands |
|---|---|---|
| One-year death probabilities q(x), ages 50–119, by sex | SSA Period Life Table 2023 (2026 Trustees Report), ssa.gov/oact/STATS/table4c6.html, read 2026-09-07 | `Q_MALE`, `Q_FEMALE`; `survivalTo`, `expectedRemainingYears`, `survivalTable`, `expectedYearsEitherAlive` |
| Retirees with lifelong guaranteed income more satisfied, fewer depressive symptoms (HRS) | Panis, RAND working paper DRU-3021 (2003); Panis in *Pension Design and Structure* (2004) | `WELLBEING_STUDIES`, each with the finding in its own terms and a caveat |
| Annuitized income and financial wellbeing across the pandemic: mixed | *Journal of Risk and Financial Management* 16(10):432 (2023) | shown because it cuts the other way |
| Retirees with guaranteed income 30% more likely to report high financial security | October Three, 2026 Lifetime Income Report (survey, 2025) | marked as an industry survey |
| Roth conversions, the exclusion ratio and §72(q), modified endowment contracts, grantor trusts | 26 U.S.C. §408A, §72, §7702A, §676 (LII) | `INCOME_SOURCES`, `FLOW_THROUGH` authorities |
| Other tables an actuary reads | Actuaries Longevity Illustrator (AAA/SOA), CDC/NCHS life tables, ACL care-need figures, the carrier's own mortality basis | `LONGEVITY_SOURCES`, named for the client to open |

The framing sentence on the page states what the evidence is and is not:
none of the studies read measured longer life. "Guaranteed income raises
longevity" is on the never-printed list.

## Tier B: typed from a named page, dated
- Rate-sheet rows: carrier, product, age band, single or joint, payout %,
  bonus %, deferral years, whether the principal keeps growing (as the
  contract states it), surrender-charge years, the year after which the
  owner may exit without charge, the sheet URL, the sheet date.
- The conversion tax from the conversion pass.
- The exit provision: described on the page without a company name. The
  carrier is never printed beside it; Sam tells the client in the room.

## The flow-through policy
Sam's design: the income is paid into a revocable trust that owns an
indexed universal life policy; within one to three days the trustee returns
the money. The page shows it as the four questions that decide whether it
works (withdrawal or loan under §72(e); seven-pay under §7702A; how long the
money must sit under the trust instrument and state law; revocable versus
irrevocable under §676) and states that until the carrier's illustration
and the attorney's letter answer them, the page shows the questions, not a
multiplier. When they do, the Rental Enterprise's trust loop runs the
policy year by year with the premium pattern typed from the illustration.

## Arithmetic
`survivalTo(sex, from, to)` = ∏(1 − q); `expectedRemainingYears` = Σ
survival to each later age (curtate); `survivalTable(first, second,
milestones)` gives first, second, either = 1 − (1 − p₁)(1 − p₂), both =
p₁p₂ at each milestone on the first person's age scale;
`expectedYearsEitherAlive` sums "either" year by year;
`expectedLifetimePayments(annual, first, second)` = annual × those years.
`incomePlan`: after-conversion = balance × (1 − tax); base = × (1 + bonus);
income = base × payout; expected years from the start age (age + deferral);
taxable comparison at the marginal rate.

## What the page will not say
- A payout, bonus or ranking not on a dated rate sheet.
- The company beside the exit provision.
- That guaranteed income lengthens life.
- A multiplier for the flow-through before the illustration and the
  attorney's letter exist.

## Not in pass 1
- Health-rated survival (the Longevity Illustrator does it; linked).
- Discounting the expected total to present value (the record's dollars are
  shown; the Erosion page holds the purchasing-power arithmetic).
- Reading rate sheets automatically (carriers publish PDFs behind logins).
- The flow-through loop's year-by-year run (pass 2, once the four questions
  are answered).
