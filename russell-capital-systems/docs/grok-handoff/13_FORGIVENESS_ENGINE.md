# 13 — The Forgiveness Engine

`/portal/forgiveness` · `shared/forgiveness.ts` · `server/forgivenessSources.ts` ·
`server/forgivenessRouter.ts` · `client/src/pages/portal/Forgiveness.tsx` ·
`server/forgiveness.test.ts`

For the physician who leaves training with a median $205,000 of education
debt (AAMC, class of 2024; 71 % indebted; 63 % planning to use a forgiveness
or repayment program). A separate engine from the erosion engine, built on
the same machinery — a weighted authority panel, the harvest path, the power
layer — and every figure in it is cited.

## 1. The record (`PROGRAMS`, `EVENTS`)
Sixteen programs and rules since 1987, each with: the statute or regulation
it rests on and its enactment date; when it opened and closed (or that it is
open, sunsetting, enjoined or ended); who it is for (borrowers, employers,
degrees, institutions, loan types); what it pays or forgives; what it asks
(payments, service, certification cadence); its tax treatment with the code
section; and the outcomes it has published, each with its citation.

PSLF (Pub. L. 110-84, 2007; 20 U.S.C. §1087e(m)), TEPSLF (2018), the Limited
PSLF Waiver (Oct. 2021–Oct. 2022), the IDR account adjustment (2022–Jan.
2025), ICR (1993/1994, ends by July 2028), IBR (2007/2009; 2014 terms),
PAYE (2012, ends by 2028), REPAYE (2015), SAVE (2023; enjoined Aug. 2024 and
Feb. 2025; ended by settlement March 9, 2026), RAP (Pub. L. 119-21, 2025;
20 U.S.C. §1087e(q): 1–10 % of AGI by $10,000 bands less $50 per dependent,
unpaid interest not charged, principal matched up to $50, 360 payments), the
OBBBA professional borrowing cap ($50,000 a year, $200,000 aggregate, Grad
PLUS ended for new borrowers July 1, 2026), the 2021–2025 tax exclusion
(ARPA §9675, 26 U.S.C. §108(f)(5), not extended), NHSC LRP (PHSA §338B; 2026
awards $75,000 primary care / $50,000 other for two years, §108(f)(4)
tax-free), IHS LRP ($50,000 / two years), VA EDRP ($40,000 a year, $200,000
over five years, tax-free), NIH LRP ($50,000 a year).

Outcomes on the record: 55 PSLF discharges by April 2018 against 890,000
certifications (GAO-18-547); 1,062,870 borrowers and $78 billion by Dec. 26,
2024 (ED data); $57.1 billion for 1.45 million through the IDR adjustment and
$5.5 billion for 414,000 under SAVE (ED, Jan. 16, 2025); SAVE's estimated
$475 billion cost (PWBM, as cited by the 8th Circuit); CBO's 2020 finding
that graduate borrowers hold 61 % of IDR volume and account for 81 % of
forgiveness at a 16.9 % subsidy rate.

**The political correlation is computed, not asserted.** Every expansion and
contraction is an event stamped with the president, Senate and House of its
year from `shared/powerHistory.ts`. `politicalCorrelation()` reports the
counts by left-held / divided / right-held years, the mean Democratic lever
share behind expansions and contractions, and a point-biserial r with its n.
On the record as of September 2026: expansions have come under both parties
(2018's TEPSLF and the VA EDRP raise under a Republican trifecta; 1993, 2010
and 2021 under Democratic ones). Two of the four contractions are court
rulings (2024, 2026), which no elected lever controls and which are reported
separately (`courtEvents`, `rElected`); the other two — the 2025 law and the
expiry of the tax exclusion — came under a Republican trifecta. The page
prints the computed reading with the caveat that r on nineteen events is a
tendency.

## 2. The panel (`FORGIVENESS_SOURCES`, `FORGIVENESS_CLAIM_SEEDS`)
Eleven authorities registered as a second panel on the same tables
(`forecast_sources`, `forecast_claims`, `forecast_harvests`): Federal Student
Aid, CBO, GAO, AAMC, HRSA, the 8th Circuit, Penn Wharton, Urban, Brookings,
the Student Borrower Protection Center, the Federal Reserve. Same weights
(evidence × track record × consistency), same council review, same harvest
with the verbatim-quote guard and owner approval, same consistency
regrading. `registerPanel()` in `server/forecastSources.ts` makes
`updateSource`, `reviewHarvest`, `scorePanel` and `harvestAll` see both
panels; `listSources`, `listClaims` and `weightedClaims` take the panel's
definitions. Fourteen seeded claims, each cited and dated; the platform's
reading of each metric is in `FORGIVENESS_METRIC_READING`.

## 3. One borrower's outlook (`forgivenessOutlook()`)
Inputs (defaults from the assessment where it has them): balance, rate,
loan type, employer type, qualifying payments made, months of training left
and the stipend, post-training income and growth, household, plan, and the
service-program flags. Every path returns eligibility with reasons, months
and date to forgiveness, what is paid before, the amount forgiven split into
principal and accrued interest, the federal tax on it (2026 rule set), the
net benefit, the odds with their parts, the confidence, the notes ("the
thinking") and the references.

- **PSLF**: simulated monthly under the chosen plan (IBR 10 % of AGI above
  150 % of the 2026 HHS guideline, capped at the standard payment; RAP per
  statute) through training and practice; forgiven = balance at payment 120;
  tax-free (§108(f)(1)). Odds = program survival × borrower execution.
  Survival: no statutory change has removed PSLF from existing borrowers in
  19 years; the FY2018 and FY2019 budgets proposed ending it for new
  borrowers and Congress did not act; the 2025 law kept it. Base hazard is the
  Laplace estimate 1/(19+2) a year, tilted ×0.5 (fully left) to ×1.5 (fully
  right) by the expected lever share from the power layer over the pursuit
  period — an assumption, named on the page. Execution 0.9 with annual
  certification and an advisor watching, else 0.6 (GAO's 99 % early denial
  rate was execution, not program, failure).
- **IDR**: 20 / 25 / 30 years by plan; taxable at the federal level after
  2025; hazard 1.5× PSLF's because plan terms are partly regulatory and the
  8th Circuit narrowed regulatory forgiveness. At attending income the loan
  is usually repaid before the date, and the page says so.
- **Service programs**: published maxima capped at the balance, tax-free
  where the code says so, shown only when the borrower would serve; the odds
  are conditional on an award and the confidence is marked low.
- **The other side**: the 10-year standard payment minus the path's payment,
  invested monthly; after forgiveness the whole standard payment. A taxable
  account (return less a tax drag) against a tax-free wrapper (return less
  an explicit annual cost, default 1 %, meant to be replaced with the real
  policy's costs). Values at 20 and 30 years and the contributions behind
  them. Labelled an illustration, not a recommendation.

"Seal on my ledger" appends a `scenario` event with the inputs, the best
path, its odds and the 30-year values.

## Tested
`server/forgiveness.test.ts`: the record's completeness and the event
stamps (2007 divided, 2021 Democratic trifecta, 2025 Republican trifecta),
the computed correlation (every contraction in a right-held year), the 2026
guideline and every plan formula including RAP's bands, dependent
reduction and floor, the simulation (IBR grows during residency, RAP never
grows, standard retires in 120), the PSLF path for the AAMC profile (120
payments, tax-free, odds = survival × execution, ineligible for-profit and
private cases), survival's tilt and clean-record base, IDR's later taxable
date, the service maxima and caps, the investment side, and the panel seeds.

## Not done
State programs (West Virginia's SLRP and others) are named on the NHSC row
but not modelled, because their current award figures were not verified
from a primary source this pass. Award selection odds for NHSC, IHS and NIH
are not published as rates and are shown as conditional. State income tax
on IDR forgiveness is not modelled.
