# The Long-Term Care Engine — what care costs, how much people need, what the policy pays toward it

Dictated 7 September 2026; built the same day (`/portal/long-term-care`,
`shared/ltcEngine.ts`, `server/ltcRouter.ts`).

## Tier A: read and cited
| What | Source | How it lands |
|---|---|---|
| Six care settings with 2025 national medians (non-medical caregiver $35/hr, skilled nurse at home $90/hr, adult day $95/day, assisted living $6,200/mo, nursing semi-private $315/day, private $355/day) and the 2024 comparison | CareScout (Genworth) Cost of Care Survey, July–November 2025 | `CARE_SETTINGS`, with the survey's own definitions of each setting and what a person keeps and gives up, stated as attributes rather than a score |
| How much care people need: 70% of 65-year-olds; women 3.7 years, men 2.2; 20% more than five years; the table by type of care | LongTermCare.gov (ACL) | `NEED_STATS`; the default years of need per person |
| Chronically ill (two of six ADLs for 90 days), the per-diem exclusion ($175/day indexed), accelerated death benefits | 26 U.S.C. §7702B and §101(g) (LII, fetched) | `LTC_LAW` |
| The states' common approach to standalone premium increases | NAIC Multistate Rate Review Framework (2022) | linked beside the filings registry |
| Cost escalation | CPI medical-care category from the inflation ladder (FRED), ten-year annualised; 3% default when absent | `ltc.context.escalation` |

## Tier B: typed from a named page, dated
- The client's state (or metro) medians from the survey's calculator.
- The rider's terms from the policy form: monthly percentage of the death
  benefit, maximum months, elimination period, annual charge, form name.
- A standalone long-term care quote: annual premium, monthly benefit,
  benefit period.
- Standalone premium-increase filings: the owner adds rows (carrier,
  product, state, year, approved increase, the filing URL). No history is
  typed from memory; a thirty-six-year series by carrier does not exist as
  a public file and is built one filing at a time.

## Arithmetic
`riderBenefit` (monthly = death benefit × the form's percentage, months =
the form's cap or until the benefit is used), `escalate`, `coverageFor`
(each setting's cost over the years of need at the start of care, what the
rider covers, the shortfall, the months the rider buys at that cost), and
`premiumCompare` (rider charge ÷ standalone premium, both typed, with the
note that a rider reduces the death benefit as it pays and a standalone
premium can be raised with state approval).

## What the page will not say
- That a rider costs a fixed fraction of a standalone policy; the ratio is
  printed only from two typed quotes.
- A rate-increase history it has not read from a filing.
- A quality score for a care setting; it lists what each keeps and gives up.

## Not in pass 1
- State medians read automatically from the survey (the calculator is a
  form, not a file).
- Medicaid nursing-facility rates by state.
- The rider's effect on the Rental Enterprise loop's death benefit year by
  year (pass 2 join).
