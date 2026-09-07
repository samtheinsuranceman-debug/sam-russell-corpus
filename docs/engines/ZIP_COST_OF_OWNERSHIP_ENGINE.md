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

1. FHFA + Zillow ingestion, cohort filter, slider, client-zip lookup; feed the
   sourced rate into Mortgage Killer, House Recycling, Ultra Calculator with the
   flat rate as fallback. (One pass.)
2. ACS property tax and HOA; FEMA flood coverage gap; PMMS interest sheet. (One pass.)
3. NOAA hail, NAIC insurance, wildfire availability and rebuild records. (One pass.)
4. Vehicles, motorcycles, owner-entered luxury lines with the cost-per-hour and
   cost-per-round calculators. (One pass.)
