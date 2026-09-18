# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 06 — BUILD ORDER, AND THE DATA SOURCE REGISTRY

---

## Part A — The roadmap, P0 through P5

All work happens on `claude/base-consolidation`. Every phase ends with `pnpm check` at zero errors and `pnpm test` green. Never push to `master`. Each phase states a **done-when** check that can actually fail — a criterion that cannot fail is a slogan.

---

### P0 — Truth in the flagship
*Estimated: 1–2 days. Nothing else should start before this.*

1. Fix the interest-savings double-count at `shared/mortgageKiller.ts:686`.
2. Remove or wire the dead `loanDragCost` computation.
3. Correct the cost-of-insurance inversion at `shared/mortgageKiller.ts:237`.
4. Build a per-product AG 49-A maximum-illustrated-rate table; the engine reads the product's cap. Delete the global 7.5% constant.
5. Replace the total-return table at `shared/ibbotsonModel.ts:107-108` with the trunk's price-return series.
6. Add one regression test per defect, so none can return.

**Done when:** the Mortgage Killer, the IUL illustration and the Time Machine, given the same household, agree within rounding; every compliance test is green; no global illustrated-rate constant remains in the repository.

**Why first:** every hour spent on wiring before this is an hour spent connecting pages to a wrong number.

---

### P1 — Evidence everywhere
*Estimated: 3–5 days.*

1. Extract `EvidencePanel` and `withEvidence()` from the Mortgage Killer implementation into shared modules.
2. Apply them to the ten highest-traffic calculators, then the rest of the catalogue.
3. Run the first real data sweep from Railway with `ZIP_DATA_DAYS=30`, `RENTAL_DATA_DAYS=30` and `CENSUS_API_KEY` set. Verify `rentalMarket.status` and `zip.status` from an external client.
4. Build the AHS tenure adapter.
5. Build the 50-state security-deposit rules table from Perplexity's statute research.
6. Build the Shiller adapter and recompute the two Time Machine expectations.

**Done when:** every calculator renders a ledger; a repository scan finds zero unlabelled flat rates; `rentalMarket.status` reports a non-zero row count for every series it claims to carry.

---

### P2 — One organism
*Estimated: one week.*

1. Add ZIP, county FIPS, state, filing status and a property list (with bedroom and bathroom counts) to the fact finder as first-class fields.
2. Run a pre-fill audit: no field may be asked on two pages without inheritance.
3. Create genome routes for the 101 unrouted pages, or embed them into pages that have routes.
4. Implement publish-and-consume on every page; enforce two inbound links minimum.
5. Add the provenance link beside every displayed figure.
6. Extend the scorecard to check Rules 4, 5, 6 and 10; run it in continuous integration.

**Done when:** the single-entry walk succeeds — a household entered once, then walked through the full genome route without re-typing any value, with every figure tracing to a source or a labelled assumption. Mean page score ≥ 8. Zero leaf pages.

---

### P3 — Mine the 688-page build
*Estimated: 1–2 weeks.*

1. **Bucket A — 43 pages** the owner rated 8 or higher that carry a blocking defect. Fix the defect, then enhance or embed per `docs/audit/PAGE_UPGRADE_SPEC.md`.
2. **Bucket B — 138 pages.** Embed as hub tabs, keeping every URL alive.
3. **Bucket D — 119 pages.** Retire with redirects. No URL dies.

**Done when:** `docs/audit/pageRegistry.json` shows every one of the 688 URLs resolving to a live BASE route — whether as its own page, a hub tab, or a redirect.

---

### P4 — Brain and providers
*Runs in parallel with P2 and P3.*

1. Owner authorises OpenRouter, Speko and Stripe; sets the Railway variables.
2. Perplexity completes the provider verification brief for 39 providers plus Roc Capital; results ingested as `Verified<T>` records with `notVerified` preserved wherever a source was missing.
3. Every dossier provider's `registryId` points at its verified record.
4. The 90-day freshness sweep goes live.
5. Every engine registered as a council tool; citation rate measured.

**Done when:** the council cites a page and a ledger row in at least 95% of factual answers; no provider field displays without a dated source; `server/altCredit.test.ts` and `server/mechanismDossiers.test.ts` are green with the verified data.

---

### P5 — The living surface
1. Default design system chosen and applied; brand guard green; Core Web Vitals green.
2. The cinematic layer driven exclusively by engine outputs.
3. Voice and video keys live.
4. Provisional patent filed — one record added to `APPLICATIONS` in `shared/patentStatus.ts` flips the language site-wide, honestly.

**Done when:** the scorecard reads 10 on every page in the top 30 by traffic, and 9 or better site-wide.

---

## Part B — The data source registry

Every public source wired or wireable, with its **real** coverage — not its advertised coverage. Where the owner asked for 36 years and the record is shorter, the shorter number is stated. That honesty is the point.

### Housing and property

| Source | Series | Geography | Coverage | Feeds |
|---|---|---|---|---|
| FHFA House Price Index | Five-digit ZIP annual index | ZIP | **1975→** | Appreciation paths, equity projections |
| Zillow ZHVI | Home value index, monthly | ZIP, metro | 2000→ | Appreciation cross-check, current values |
| Zillow ZORI | Observed rent index, monthly | ZIP, metro | 2015→ | Rent trend cross-check |
| Freddie Mac PMMS | 30- and 15-year mortgage rates, weekly | National | **1971→** | Rate environment, refinance modelling |
| HUD Fair Market Rents | Rent by bedroom count (0–4) | County | **1983→ (43 years)** | Rent by configuration, fallback tier |
| HUD Small Area FMR | Rent by bedroom count | **ZIP** | 2018→ | Rent by configuration, preferred tier |
| Census ACS 5-year | B25031 (rent by bedrooms), B25103 (taxes), B25077 (value) | ZCTA | 2009→ | Rent, property tax rate, home value |

### Money, rates and prices

| Source | Series | Coverage | Feeds |
|---|---|---|---|
| FRED `M2SL` | M2 money stock | 1959→ | Monetary-expansion overlay (displayed beside CPI, never blended) |
| FRED `WALCL` | Federal Reserve total assets | 2002→ | Balance-sheet context |
| FRED `CUSR0000SEHA` | CPI, rent of primary residence | **1947→** | Real-dollar deflation |
| FRED `DPRIME` | Bank prime loan rate | **1955→** | HELOC and variable-rate paths |
| Shiller dataset | S&P composite, dividends, earnings, CAPE | **1871→** | Long-horizon equity modelling *(adapter not yet built)* |
| Trunk index crediting data | S&P 500 **price** return | 1957→ | Index crediting — the correct series, unlike `ibbotsonModel` |

### Tenancy and risk

| Source | Series | Geography | Coverage | Feeds |
|---|---|---|---|---|
| Eviction Lab | Filings, judgments, filing rate, eviction rate, renter households | County | **2000–2018** | Eviction exposure, "share of owners suing tenants" |
| Census AHS | Year householder moved in | National, selected metros | 1985→ biennial | Tenant tenure *(adapter not yet built)* |

### What does not exist — stated plainly

| Requested | Status |
|---|---|
| **Rent by bathroom count** | No public series exists anywhere in United States federal statistics. Returned as `null` with the reason. Requires licensed listing data to fill. |
| **Security deposits over time** | Not a time series. It is state statute — build the rules table. |
| **Property tax before 2009 by ZIP** | ACS does not reach back that far at ZCTA level. State and county aggregates exist further back but not by ZIP. |
| **Eviction data after 2018** | Eviction Lab's county series ends at 2018. Nothing public replaces it at national coverage. |

### The honest summary on "36 years"

The owner asked for 36 years everywhere. Here is what the record actually supports:

- **Appreciation: yes, and more.** 51 years by ZIP, from 1975.
- **Mortgage rates: yes, and more.** 55 years, from 1971.
- **Prime rate: yes, and more.** 71 years, from 1955.
- **Rent inflation: yes, and far more.** 79 years, from 1947.
- **Rent by bedroom: yes at county level.** 43 years, from 1983. Only 8 years at ZIP level, from 2018.
- **Property tax: no.** 17 years at ZIP level, from 2009.
- **Evictions: no.** 19 years, and the series stops in 2018.
- **Tenure: yes.** 40 years, from 1985 — once the adapter is built.
- **Bathrooms and deposits: no series exists at all.**

Every one of these windows is displayed to the user alongside the figure it produced. A platform that says "17 years of property tax history for your ZIP, 2009 through 2025" is more trustworthy than one that claims 36 and quietly extrapolates.

---

## Part C — The request to Perplexity

Highest value first:

1. **Provider verification** — 39 providers plus Roc Capital, per `docs/PROVIDER_VERIFICATION_BRIEF.md`, returning the JSON schema in §8.
2. **Equity-share eligibility** at Point, Hometap, Unison, Unlock and Splitero: does each permit a non-owner-occupied investment property, and does each consent to a subordinate lien? From the providers' own pages.
3. **50-state security-deposit statutes** in the JSON shape given in file 02.
4. **AG 49-A maximum illustrated rates** per illustrated product, from carrier disclosure documents with effective dates.
5. **Kiavi and Griffin 90-day seasoning** — confirm on the lenders' own pages or leave marked unverified.
6. **Confirm or refute** the finding that no public dataset carries rent by bathroom count.
7. **AHS table identifiers and URLs** for "year moved in", 1985–2025.
8. **Account aggregation vendors** — Plaid versus MX versus Yodlee: pricing, coverage, and compliance requirements for an insurance-licensed advisory platform.

**The standing rule for every one of these:** a cited, dated primary source, or an explicit "not found." A plausible guess is worse than a blank, because a blank is honest and a guess is a liability that will eventually be printed on an illustration and handed to a family.

---

*End of briefing. Files 00 through 06 are self-contained; this set can be pasted in whole or in part.*
