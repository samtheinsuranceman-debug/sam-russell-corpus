# 14 — The Tax Optimisation Schedule

`/portal/tax-schedule` · `shared/taxStrategies.ts` · `shared/taxSchedule.ts` ·
`server/taxSources.ts` · `server/taxScheduleRouter.ts` ·
`client/src/pages/portal/TaxSchedule.tsx` · `server/taxSchedule.test.ts`

Year by year, strategy by strategy: an amount, the tax it saves, the
statute and the reason, for one client's goals. The site's hundred named
combinations (`client/src/data/strategies.json`) are the front door; behind
each is a family with a real statute and the 2026 numbers verified from the
primary sources on 2026-09-06.

## The catalogue (`FAMILIES`)
Twenty-nine families. Each carries: kind (what it does to the return),
repeat (annual / once / episodic), the IRC sections, a plain-words summary,
the 2026 parameters each with its source and a `verified` flag, what the
profile must have for it to be sized, the goals it serves, the risks in
words, an authority weight (settled statute and regulations 1.0; regulatory
and contested less), the keywords that map the site's titles to it, and
citations. Every one of the hundred titles maps to at least one family (a
test proves it).

Verified this pass, with the sources the file cites: Rev. Proc. 2025-32
(2026 brackets, §179 $2,560,000 / $4,090,000, §831(b) $2,900,000, §461(l)
$256,000 / $512,000, §199A thresholds and the $400 minimum, SALT $40,400
with the $505,000 phase-down); Notice 2025-67 (402(g) $24,500, 415(c)
$72,000, 415(b) $290,000, the 60–63 catch-up $11,250, the $360,000
compensation limit, SIMPLE $17,000); Rev. Proc. 2025-19 (HSA $4,400 /
$8,750); Pub. L. 119-21 and CRS R48550 (100 % bonus depreciation permanent
for property acquired after Jan. 19, 2025; QSBS 50/75/100 % tiers, the
$15 million cap and the $75 million asset test; the 0.5 % charitable floor,
the 60 % cash limit, the $1,000/$2,000 non-itemizer deduction and the new
§68 35-cent cap; opportunity zones permanent with the 10 %/30 % step-ups;
§174A domestic research expensing and the $31 million small-business
election; §163(h)(3) $750,000 and home-equity interest permanently
non-deductible; §179D/45L ending June 30, 2026; the tips, overtime and
senior deductions with their phase-outs; Trump accounts $5,000 / $1,000);
T.D. 10029 (captive loss-ratio tests 30 % / 60 %); SSA (2026 IRMAA first
tiers $109,000 / $218,000); IRB 2026-29 (estate $15 million, gift $19,000).
Marked unverified and never used to size a step: the typical IDC share of a
drilling investment (an industry range) and the 2026 QCD limit.

## The scheduler (`buildSchedule()`)
Ordering per the council's design review (GPT-5 via OpenRouter, Sept. 6,
2026) and the platform's rules, for each year:
1. Baseline the year with the bracket engine (`shared/taxRules.ts`).
2. Reducers that need no structure: the plan deferral (to §415(c) for an
   owner), a cash balance plan from age 45 sized to age and income (the
   actuary sets the real figure), the HSA, the PTET election, the Augusta
   rule, the children on payroll.
3. The deduction engines, sized to the headroom above the target bracket
   (or toward zero for the "zero federal tax this year" goal) and capped by
   §461(l) and by risk capacity (low 0 %, medium 10 %, high 20 % of income
   a year): the short-term rental with cost segregation in year one where
   the profile allows it, then the oil and gas working interest, whose
   amount therefore differs every year.
4. Charitable bunching every third year; the sale year routed by goal
   (1031 for real estate, a CRT where charity is a goal, otherwise an
   opportunity fund).
5. The Roth conversion last, filled exactly to the top of the target
   bracket after everything above has lowered its cost, and counted as a
   cost, not a saving.
6. The once-only structures in the year their prerequisites are met: SLAT
   above $15 million of net worth, an IDGT sale in year two above $5
   million, a captive in year three for a practice above $1.5 million of
   income (run as insurance, loss ratio above 60 %), the IUL funded from
   home equity when the loan rate is below 6.5 %, an ESOP for a C
   corporation with an exit goal.

Every step prints amount, tax saved (re-running the bracket engine), the
statute, the reason in the client's words, prerequisites, risks, and a
confidence that blends the family's authority weight with the share of its
parameters that are verified. The year prints baseline and planned tax and
effective rates; the schedule prints totals, the once-only structures used,
and its assumptions. "Seal on my ledger" appends a `scenario` event.

## The panel (`TAX_SOURCES`, `TAX_CLAIM_SEEDS`)
Thirteen authorities on the shared panel machinery: the Code and
regulations, IRS guidance, the enacted law, CRS, JCT, the Tax Court, SSA,
AICPA, Bloomberg Tax, Thomson Reuters Checkpoint, Kitces, the Tax
Foundation, CBO — weighted by credentialing (the tiers are printed on the
page), track record and consistency. The claims are the 2026 parameters
themselves, dated and cited, so the harvest path can bring in the 2027
revenue procedure for the owner to approve and the scoring path can grade
the sources that got a figure wrong.

## Tested
`server/taxSchedule.test.ts` (8): every parameter cited and the unverified
ones flagged, the hundred titles mapped, the ordering (plan first, engines
after, Roth last), the caps (risk capacity and §461(l)), once-only
structures placed once and annual ones every year at changing amounts, the
sale year routed by goal, the zero-federal objective filling the engine
further within the same caps, the printed assumptions, and the panel seeds.

## Not done
State tax, AMT and the net investment income tax are named in the risks and
not computed. The amounts for the cash balance plan, the cost segregation
share and the Augusta rate are typical placeholders that the professional
named in each step replaces. The engine does not yet read the client's
answers from the assessment beyond income and filing; the "questions you
have not asked" engine (next) is how the profile gets the rest.
