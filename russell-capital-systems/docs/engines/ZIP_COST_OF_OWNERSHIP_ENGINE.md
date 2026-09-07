# The Zip Engine — the true cost of owning things, by zip code, 1990 to now

Spec written 7 September 2026 from the owner's dictation. Every series in it
follows the platform's rule: a published, public record with its citation and
as-of date, or it is not shown. Where a series exists only at state or national
level, it is shown at that level and labelled. Where no authority publishes it,
the engine says "no public record" rather than inventing one.

## The one control that runs through everything

A **start-year slider** on every chart and every projection. Default is the
earliest year on record for that zip (1990 where the data goes back that far).
The client can drag it to 2020 and the engine re-averages from there, so "since
COVID" is one motion, and the projection forward uses whichever window is
selected. The window the client picked is printed on every figure it produced.

## Cohort rule

A zip is in the cohort when its median home value at the **start of the selected
window** was at least the threshold. Default threshold $100,000 (owner's
instruction); adjustable. The client's own zips (home and each rental from the
Fact Finder) are always shown beside the cohort, whether or not they qualify.

## Tier A — zip-level public records (build first)

| Series | Source | Coverage | Notes |
|---|---|---|---|
| Home price index, annual | FHFA House Price Index, 5-digit zip file | 1975/1990s → current, all zips with enough sales | Index, not dollars. Dollar level back-cast from Zillow 2000 base × FHFA ratio, method printed. |
| Median home value, monthly | Zillow ZHVI by zip (public CSV) | 2000 → current | Dollar level; the cohort threshold reads this. |
| Median rent, whole unit | Zillow ZORI by zip | 2015 → current | Whole-unit only. Per-room and basement rents: no public record at zip level; not shown. |
| Median real-estate tax paid, and tax as % of value | Census ACS 5-year, ZCTA tables B25103 / B25103-derived | 2009 → current | The "property taxes climbing by zip" chart. Pre-2009: Census 2000 SF3 gives one point. |
| Condo / HOA monthly fee | Census ACS B25xxx (monthly condominium fee), ZCTA | 2009 → current | Only for units that report a fee, which is the owner's ask: a separate index for fee-paying homes. Pre-2009: no public zip record. |
| Flood insurance: policies, coverage limits, premiums, claims | FEMA OpenFEMA NFIP policies + claims datasets, by zip | Claims 1978 →, policies 2009 → | Building coverage capped at $250,000 by statute; the engine shows coverage ÷ home value per zip, which is the Wilmington beach-house gap the owner described. |
| Hail and storm events | NOAA Storm Events Database, county → zip crosswalk | 1996 → current (hail from 1955 at county) | Event counts and reported damage. Insurance out-of-pocket per zip: no public record; not shown. |

## Tier B — state or national public records (shown, labelled by level)

| Series | Source | Level |
|---|---|---|
| 30-year fixed mortgage rate, weekly | Freddie Mac PMMS via FRED (MORTGAGE30US) | national, 1971 → |
| Total interest paid over 30 years at the year's rate on the zip's median price | computed from the two above, amortisation printed | zip × year |
| Homeowners insurance average premium | NAIC Dwelling Fire/Homeowners report | state, annual, 2000s → |
| Wildfire insurance availability and FAIR Plan share | California Dept of Insurance data releases | California, county |
| Time to rebuild after wildfire | County permit data (LA, Sonoma, Butte) and CAL FIRE / state reports where published | county, event-by-event; not a clean annual national series |
| Auto loan rates | FRED (TERMCBAUTO48NS, RIFLPBCIANM60NM) | national, 1972 → |
| New-vehicle price and depreciation | BLS CPI new vehicles; manufacturer MSRP archives; NADA/Manheim indices where public | national |
| Motorcycle fatality rates, miles, fuel | NHTSA FARS, FHWA VMT, EIA gasoline prices | national/state, annual |
| Gasoline | EIA weekly retail, by PADD/state | state |
| Maintenance cost of a home | BLS CPI "maintenance and repairs" and ACS "selected monthly owner costs" | national / zip (ACS) |

## Tier C — no public authority; not shown as data

Country club initiation fees and dues, boat purchase and dock fees by harbour,
per-room rents, per-zip HOA fees before 2009, per-zip hail out-of-pocket costs,
per-zip luxury-car prices. Trade surveys exist (Club Benchmarking, NMMA, iSeeCars)
but are proprietary or national and unverifiable at the level asked. The engine
offers **owner-entered lines** for these, each stored with the client's own
receipt or quote as the source, so a doctor who plays sixteen rounds a month can
see his cost per round from his own numbers, with the label "your figures".
A "cost per hour on the water" and "cost per round" calculator runs on those
entries; nothing is pre-filled.

## Outputs on the page (Observatory, beside Erosion)

1. The client's zips against the cohort: appreciation year by year, 10/20/30-year
   compounded, worst drawdown, all re-averaged from the slider year.
2. The true cost of the house: interest over 30 years at that year's rate,
   property tax trend, HOA trend where reported, insurance at state level, flood
   coverage gap where the zip is in a flood zone.
3. Rent trend for the zip where Zillow publishes it.
4. Vehicle and motorcycle cost sheets at national level with the client's own
   loan rate and mileage.
5. Every number with its source and as-of date; every gap labelled.

## Build order

Pass 1 built 7 September 2026: `shared/zipEngine.ts`, `server/zipData.ts`, `server/zipRouter.ts`, `/portal/zip-engine`, zip fields in the Fact Finder, hand-off to the Ultra Calculator.

1. FHFA + Zillow ingestion, cohort filter, slider, client-zip lookup; feed the
   sourced rate into Mortgage Killer, House Recycling, Ultra Calculator with the
   flat rate as fallback. (One pass.)
2. ACS property tax and HOA; FEMA flood coverage gap; PMMS interest sheet. (One pass.)
3. NOAA hail, NAIC insurance, wildfire availability and rebuild records. (One pass.)
4. Vehicles, motorcycles, owner-entered luxury lines with the cost-per-hour and
   cost-per-round calculators. (One pass.)

---

## Additions dictated 7 September 2026, sorted the same way

### Short-term rentals (built: `/portal/short-term-rentals`, pass 1)
- **What exists publicly by zip:** the value, appreciation, long-term rent trend
  and the year's mortgage rate (the Zip Engine). Property tax and HOA arrive in
  Zip Engine pass 2 (Census ACS).
- **What does not exist publicly:** a thirty-year history of short-term-rental
  income by zip. Airbnb began in 2008; its listing data is private. Rabbu
  (rabbu.com) publishes a current estimate for any address (nightly rate,
  occupancy, monthly revenue, refreshed weekly, gross of fees) and market pages
  by city and zip, but no historical series and no public API. It cannot be
  "coded into the database" as a record; it is linked from the page and its
  figures are taken as the client's dated inputs, labelled as Rabbu's.
- **The page:** the zip's record prefills price, appreciation, rent growth and
  mortgage rate; the client types or pastes nightly rate and occupancy; the
  engine (`shared/strEngine.ts`) shows every year: gross, operating costs,
  NOI, interest, principal, cash flow, straight-line depreciation, taxable
  income, the tax effect at the client's marginal rate, after-tax cash, value,
  loan balance, equity; cap rate, cash-on-cash, equity multiple, annualised
  return on cash. The accelerated tax mechanics stay on `/portal/str-strategy`
  with their statutes. A "Rental Properties" group now sits at the top of the
  portal navigation: Short-Term Rentals, STR Tax Strategy, the Zip Engine,
  House Recycling, Real Estate Mogul.
- **Pass 2, the sources protocol (`shared/strSources.ts`, `server/strSources.ts`):**
  ten sites, each checked on 7 September 2026 against its own page, with what
  it publishes, its lookup link, and its API in plain terms:

  | Site | Lookup | Developer API |
  |---|---|---|
  | Rabbu | address calculator; market pages by city, county, zip | none published |
  | AirDNA | Rentalizer by address | yes, private token by contract (api.airdna.co) |
  | Mashvisor | calculator by address, city, zip | yes, self-serve key, credits (`MASHVISOR_API_KEY`) |
  | AirROI | free revenue calculator by address | yes, self-serve, pay-as-you-go (`AIRROI_API_KEY`) |
  | PriceLabs | — | Revenue Estimator API (`PRICELABS_API_KEY`) |
  | Awning | free calculator by address, no sign-up | none published |
  | Airbnb | search by place | closed partner programme; no market data |
  | Vrbo | search by place | Expedia Rapid under partner agreement |
  | Inside Airbnb | quarterly CSV per city | direct download, no key |
  | Beyond Pricing | — | Partners API for listings the account runs |

  The AI's protocol (`STR_PROTOCOL`, in the advisor's system prompt): take
  the places from the client's own words (Fact Finder goals, relocation
  plans, what was just said); size the purchase from cash on hand at the
  stated down payment and closing costs (cash-limited price, with the
  lender's test named as separate); for each place name the registry sites
  and which have a key on the host; never state a rate, occupancy or revenue
  unless it was read from one of them on a stated date; hand the inputs to
  the Short-Term Rentals page and the depreciation to STR Tax Strategy. The
  page's "Where you like to go" card runs the same steps: places found,
  cash-limited price with the arithmetic, one row per site with **Open** (the
  button) and **Read with the AI** (the server fetches the registry page and
  keeps only figures whose sentence is on the page, shown as "read on <date>
  from <url>", never stored). Sites that draw their numbers in the browser
  (Rabbu, AirDNA, Mashvisor, AirROI, Airbnb, Vrbo) say so and stay buttons
  until a key is set.

### Oil and gas programmes, 36 years
- **Public:** the tax treatment is statute, citable year by year: intangible
  drilling costs deductible in year one (IRC §263(c)), percentage depletion
  at 15% (§613A), the working-interest exception to the passive rules
  (§469(c)(3)). SEC Form D data sets (2008 → present, quarterly, public bulk
  download) list every Regulation D private offering with issuer, industry
  group ("Oil & Gas"), amount offered and amount sold: the sponsor league table
  by dollars raised, 2008 onward, can be built from the record.
- **Not public:** returns of private drilling programmes, year-by-year
  depreciation actually taken, and anything before 2008 at sponsor level.
  Programme returns are in private K-1s; no authority aggregates them. The
  engine will show the tax schedule (statute) and the Form D league table
  (record) and say plainly that performance is not on the public record.

### Fixed indexed annuities and indexed universal life, by state, 36 years
- **Public:** state insurance departments and the NAIC publish annual premium
  by company by line by state (market-share reports); LIMRA and Wink publish
  headline totals in press releases. Product filings (rates, caps, bonuses,
  surrender schedules) are public through SERFF but not aggregated.
- **Not public:** product-level top-ten by state, average premium bonus,
  qualified vs non-qualified mix, average surrender year, income-rider payouts
  by state, maximum premium accepted by household income and net worth,
  realised returns on in-force policies. Those live in LIMRA, Wink and carrier
  data that is licensed, not published. Carrier product pages can be cited for
  today's caps and limits, one product at a time, each with its date.
- **What the engine can build honestly:** a company league table by state and
  year from the NAIC filings (life and annuity premium), with consistency
  scored by how many years and states a carrier appears in the top ten, and a
  hand-curated product sheet (Pacific Life, Securian and others) with each
  cap, bonus, surrender schedule and premium limit cited to the carrier's own
  page and dated. Not a thirty-six-year product history; that record does not
  exist in public.

### Trusts by state, 36 years
- **Public:** IRS Statistics of Income publishes fiduciary income-tax return
  (Form 1041) counts and amounts annually, with some state tables in some
  years, to be verified year by year; state court probate filings are public
  in some states.
- **Not public:** there is no registry of trusts. Marital status of grantors,
  purpose, and funding amounts at signing are not collected by any authority.
  The engine will show the Form 1041 record where it exists and state that the
  rest is not knowable from public sources.
