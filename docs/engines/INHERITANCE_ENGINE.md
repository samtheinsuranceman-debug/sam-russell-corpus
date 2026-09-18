# The Inheritance Engine — what you expect to receive, after tax, in that year's dollars

Dictated 7 September 2026. Built as pass 1 the same day.

## What the page does (`/portal/inheritance`, `shared/inheritanceEngine.ts`, `server/inheritanceRouter.ts`)
1. **Item by item.** Each expected inheritance is one row: what it is, which
   kind of asset (twelve classes), amount today, the year expected, who it is
   from, how sure the client is (1 to 5), and, for an annuity or a trust
   distribution, the gain or income share from the statement. Rows live in
   the Fact Finder's Estate section (`lists.inheritances`) so every other
   engine sees them; the page saves back to it. The old single field
   "inheritance you expect to receive" seeds one row when the list is empty.
2. **How each kind arrives.** Every class carries a one-line rule and the
   Code section it rests on, each fetched and read before it was cited:
   §102 (cash), §1014 (step-up: brokerage, real estate, business,
   collectibles), §401(a)(9) with §691 (pre-tax retirement accounts, ordinary
   income, ten-year rule, no step-up under §1014(c)), §408A (Roth), §101(a)
   (life insurance), §72 (annuity gain), §223(f)(8) (HSA to a non-spouse,
   income in the year of death), §529, §652/§662 (trust distributions).
3. **The arithmetic.** Tax today = amount × taxable share × (marginal federal
   + state). Tax in the year received = tax today × the erosion trajectory's
   burden multiplier for that horizon, capped at the taxable amount, with the
   trajectory's probability that the top rate is higher printed beside it.
   Today's dollars = after-tax × the CPI-U ladder's purchasing-power factor
   for the nearest horizon at or above the years out. Weighted = today's
   dollars × (sureness − 1) ÷ 4. When the host has no trajectory or no CPI
   reading the column is blank and the assumptions line says so.
4. **The estate-level check.** If the client knows the whole estate they
   expect from, it is compared with the IRS's filing threshold for the year
   of the earliest item (the IRS table 2011–2026, read 7 September 2026; later
   years use the 2026 figure and are flagged as indexed).
5. **Only if they ask.** One invitation, then three questions about a
   benefactor's remarriage or step-family, three ways to test the waters
   (see the plan, check the beneficiary forms, offer the attorney meeting),
   and three moves that cannot be undone (an irrevocable trust funded now;
   being named directly on the accounts, with the 401(k) spousal-consent
   caveat under §401(a)(11); a lifetime gift under §2503(b) or a policy the
   client owns). The advisor is told to offer it once.
6. **Partner pre-planning.** Elite Tax Strategists and My Taxes Made EZ
   (Ralph Ryanberg) with the no-guarantee line. The partner's own
   "thirty to fifty percent" figure is in the code with `approved: false` and
   the server withholds it until the owner approves it as the partner's quote.

## Sources read
- IRS, Estate tax: filing threshold by year of death.
- LII: 26 U.S.C. §§ 72, 101, 223, 401, 691, 1014, 2503 (each fetched 7 September 2026).

## Not in pass 1
- State inheritance and estate taxes by state (each state's own page,
  harvested with quotes through the council path).
- Property-tax reassessment on transfer by state.
- The ten-year IRA schedule year by year against the client's own brackets
  (the tax waterfall page does the bracket work; a link is the pass-2 join).
