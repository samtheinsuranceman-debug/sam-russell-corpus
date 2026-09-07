# The Rental Enterprise — one house or four, every loan written, the trust loop on the tax saved

Dictated 7 September 2026. Sorted the way the Zip Engine and Career Ledger
specs are sorted: Tier A is read by the server from the publisher's own file;
Tier B is published but read by hand (the client copies a figure from a site
with its date); Tier C is arithmetic on what the client enters, labelled as
theirs. "If you can't cite it, don't do it."

## Pass 1 — built (`/portal/rental-enterprise`, `shared/rentalEnterprise.ts`, `shared/mutualIulCarriers.ts`, `server/rentalEnterprise.ts`, `server/enterpriseRouter.ts`)

### What the page does, in the order the client reads it
1. **Capacity.** Income lines, cash on hand, the mortgage and student-loan
   payments and the credit score from the Fact Finder; Fannie Mae's published
   rules for an investment purchase (85% LTV on one unit, 75% on two to four;
   Desktop Underwriter's 45% debt-to-income cap; six months of reserves). Two
   limits are solved by bisection, the cash rule and the income rule, and the
   smaller is the purchasing power; the page says which rule binds.
2. **Candidates.** Every zip the Zip Engine stores, in the states or zips the
   client names, scored as gross rent yield + annualised appreciation over the
   chosen window (six years since COVID by default; the whole record on the
   toggle) − a hazard penalty from the county's FEMA rating − a drawdown
   penalty. Every term is printed beside the score. Zips with no rent record
   are shown unscored, never guessed.
3. **Plan A and Plan B.** One property near the whole purchasing power in the
   best zip whose typical home fits, or the same money over three to four zips
   near a quarter each. The page states why the smaller houses resell into a
   wider pool of buyers.
4. **The loans, written.** Purchase month (staggered by the months the client
   chooses), price, down, principal, the rate (Freddie Mac's latest annual
   average from the record + the lender's investor add-on the client types +
   any Fed scenario shift), interest-only years then level amortisation,
   interest-only payment as a share of monthly income, total interest, payoff
   year.
5. **The enterprise, year by year, 20 or 30 years.** Gross, operating, NOI,
   interest, principal, cash flow, depreciation (cost-segregated share and
   furnishing at 100% bonus in year one, straight-line on the rest), tax saved
   at the marginal rate, value, debt, equity; per property and summed.
6. **The hundred hours.** The log the client keeps (recorded calls, screen
   recordings, cleaner visits, bookkeeping, repairs) and the regulation each
   line satisfies.
7. **The trust loop.** Tax saved (plus any share of after-tax cash the client
   assigns) becomes premium into policies held by an irrevocable trust;
   crediting follows the backtester's history for the chosen index account;
   the trustee borrows up to the cap from the first allowed policy year and
   pays principal on the properties, split by remaining balance; a new policy
   opens when a year's premium crosses the threshold. The plan is run twice,
   with and without the loop, and the interest saved is the difference.
8. **The carriers, mutual only.** The registry in `shared/mutualIulCarriers.ts`
   with each rating's date and page, the mutual structure cited, product and
   strategies where the carrier's page was read, and every item that could
   not be read flagged unverified on the page.
9. **The trust and the attorney.** Notes with their authorities; ACTEC's Find a
   Fellow directory; the owner's vetted attorneys for the client's state,
   empty until the owner adds rows (no name is ever invented).

### Tier A: read by the server, stored with the file's own version and URL
| What | Source | How it lands |
|---|---|---|
| Typical value, rent, appreciation over the window and the record, worst fall, county and metro per zip | Zillow ZHVI and ZORI, FHFA back-cast, as the Zip Engine already stores them | `zip_series` → `enterpriseCandidates()` |
| Mortgage rate of the day | Freddie Mac PMMS annual average via FRED (`MORTGAGE30US`) | `rateContext().mortgage` |
| Federal funds rate, monthly since 1990, folded to annual averages, and the latest reading | FRED `FEDFUNDS` | `rateContext().fedFunds`; the page's Fed scenario slider shifts every loan's rate and shows the history beside it |
| Cost growth | FRED `CPIAUCSL` twelve-month change | `rateContext().cpi` → default `expenseGrowthPct` |
| County hazard record: overall rating, expected annual loss to buildings, and a rating for each of eighteen hazards (hail, wildfire, riverine and coastal flood, hurricane, tornado, …) | FEMA National Risk Index county table v1.20 (`NRI_Table_Counties.zip`) | `county_hazards`; columns found by header name; joined to a zip through Zillow's county name |

### Tier B: published, read by hand with its date
- Short-term nightly rate and occupancy: from the ten-site registry on
  `/portal/short-term-rentals`, typed with the site and date.
- HOA dues, the property's insurance premium and its history, the maximum
  insurable value: no public body publishes these by zip; the client types
  them from the HOA statement and the insurer's declarations page, and the
  page says so.
- Each carrier's current caps, participation rates and loan provision (first
  policy year a loan is allowed): read from the carrier's rate sheet and
  policy form on the day, per `CARRIER_READ_PROTOCOL`.

### Tier C: arithmetic on the client's entries
- Purchasing power (`purchasingPower`), the two plans (`pickPlans`), the loan
  month by month (`loanSchedule`), the property year by year (`runProperty`),
  the loop (`trustLoop`), the enterprise (`runEnterprise`).
- Policy loads, charges, loan rate and the new-policy threshold are typed
  assumptions and printed as such; the crediting is the backtester's index
  history (`shared/indexCreditingData.ts`, 1994–2025), repeated after its last
  year, never a promised return.

### What the page will not do
- Name an attorney it has not been given. The vetted table is the owner's.
- Quote a carrier's cap or loan provision from memory.
- Put a figure on a hazard's future; the county's rating is shown as FEMA
  published it.
- Treat a backtest as a result any policy received.

### Env (all optional, names only)
- `HAZARD_DATA_DAYS=180` re-reads FEMA's county file twice a year (first pass
  three minutes after boot); the owner can also call `rental.refreshHazards`.
- The FRED reads use the existing `FRED_API_KEY` when set and the public CSV
  otherwise.

## Pass 2 — not built
- Insurance premium history and maximum insurable value by county from the
  state insurance departments' rate filings (NAIC SERFF), harvested with
  quotes through the council path.
- HOA dues by subdivision (no public source; a client-entered registry).
- Rent-growth sensitivity to the federal funds rate estimated from the
  record (ZORI against FEDFUNDS by metro), shown as history with the caveat.
- The carrier registry read from each carrier's own pages on a schedule, so
  the unverified flags clear themselves.
- Attorney directories beyond ACTEC (state bar certified-specialist lists),
  each verified before it is linked.
