# Executive Summary
## Russell Capital Systems — Claude Session 01

**Session:** `session_01GDyUsq4kDze9T1KGzUv8Vb` · 2026-09-08 → 2026-09-18
**Owner:** Samuel A. · **Prepared for:** Perplexity and any AI continuing this build

---

## 1. What this platform is

Russell Capital Systems is a wealth-technology platform: roughly 115 catalogued financial calculators and simulators, a behavioural-intelligence layer (200+ NLP calibration questions feeding a "Wealth Genome" profile), and an AI brain that can reason across all of it. React 19 / Vite / Tailwind 4 on tRPC v11 + drizzle-orm (MySQL), deployed on Railway at www.russellcapitalsystems.com.

## 2. The finding in one sentence

**The engines are strong; the wiring between them is the gap — and the gap is measured.**

Two independent measurements agree. The platform's own integration scorecard puts mean page wiring at **3.3 / 10**. The 688-page audit conducted this session put the utility-weighted average at **4.3 / 10**. The arithmetic behind those numbers:

| Measure | Value |
|---|---|
| Pages with no live data | 104 of 115 |
| Pages with no provenance trace | 112 of 115 |
| Pages no genome strategy routes to | 101 of 115 |
| Pages fewer than two surfaces link to | 104 of 115 |
| Pages scoring 10 / below 5 | 0 / 76 |

The owner described the consequence himself: *"I had 700 pages and I was getting lost in my own website."* That is not a design complaint. It is the direct consequence of 104 pages with fewer than two inbound links.

## 3. What was built this session

A BASE reference build was established on `claude/base-consolidation`, consolidating the production trunk with every feature worth keeping from five other builds and ten uploaded archives.

**Consolidation.** Engine kit, RECIN real-estate workspace, orchestrator, cinematic layer, Patent360 design system, AQAL research gate, motion kit, doctor-buddy routers, AI council, NLP engine, evidence retrieval, 30 sister-invention engines (SI-001 through SI-035) with 8 portal pages, and five homepage concept designs — all harvested into one build, each step gated by a clean typecheck and a green test suite.

**Two engines wired to truth rather than to constants.**

- The **divorce engine** now reads a state rules table. Community-property versus equitable-distribution resolves per state; any ratio no statute produces is flagged `statutory: false` with a plain-language basis; every result carries a rules version and a list of claims it must never be used to support. Four previously skipped tests now pass.
- The **mortgage engine** now accepts evidence-driven paths for appreciation, inflation, property tax and HELOC rate — all backward compatible, so their absence reproduces the old behaviour exactly.

**A rental-market evidence layer.** A `rental_series` table, adapters for HUD Fair Market Rents (1983→), HUD Small Area FMRs by ZIP (2018→), Census ACS by ZCTA (2009→), Eviction Lab county data (2000–2018) and the FRED money and price series, a pure engine with block-bootstrap resampling, two tRPC routers, and a scheduled sweep wired into server boot.

**Thirty-six-year evidence toggles, live on the Mortgage Killer page.** ZIP and county inputs, five toggles — all off by default — and a source ledger rendered above the results showing every path as *applied* or *fallback*, with its source, as-of date, method, and where it fell back, the reason.

**A historical market regime engine** (written for this package; see §6).

**Final state:** TypeScript 0 errors, **214 test files / 4,095 tests green**, 330 routes, 29 memory-bank groups fully wired to the AI brain.

## 4. What is most urgent — and a correction

Four defects sit in the flagship calculator. Before listing them: **two of the four I reported earlier in this session were wrong**, because I had carried line numbers from the 688-page build into claims about the BASE build. Verified against the actual BASE source, the accurate findings are:

| # | Finding | Location | Effect |
|---|---|---|---|
| 1 | **The IUL policy has no cost of insurance.** A search for `coi`, `costOfInsurance` or `insuranceCharge` returns nothing in the engine. | `shared/mortgageKiller.ts` — absent entirely | A policy accumulating with no mortality or expense charges materially overstates cash value. This is the most serious of the four. |
| 2 | **Policy-loan drag is reported but never deducted.** `loanDragCost` is computed and written into the result row; no total subtracts it. | lines 297, 342 | The user is shown a cost that reduces nothing. |
| 3 | **The default crediting rate exceeds the product's own cap.** The engine defaults `iulCreditRate = 0.075`, and a header comment asserts a 7.5% AG 49-A maximum. The illustrated product's actual maximum illustrated rate is 6.35%. | line 645; comment line 14; versus `shared/pacificHorizonEcv.ts` | Illustrating above a product's maximum illustrated rate is a compliance problem, not a modelling preference. |
| 4 | **The index table is total return where price return is required.** 2008 is −0.3700 and 2009 is 0.2646 — total-return figures. Index crediting uses price return (−38.49%, +23.45%). The correct series already exists in the trunk. | `shared/ibbotsonModel.ts:104-110` | Every illustration built on this table is overstated. |

**Withdrawn:** the "interest-savings double-count" I previously reported does not exist in the BASE file. Net worth is computed as home equity plus net cash value minus cumulative property tax; interest saved is not added into it. Home equity correctly nets both the mortgage and the HELOC balance. I was wrong about that one, and about a cost-of-insurance "inversion" — the real issue is absence, not inversion.

## 5. What no amount of work can produce

The owner asked for 36 years of history across several dimensions. Where the public record supports it, it now does — and in several cases exceeds it. Where it does not, the platform says so rather than estimating:

| Requested | What exists |
|---|---|
| Home appreciation by ZIP | **51 years** (FHFA, 1975→) |
| Mortgage rates | **55 years** (Freddie Mac PMMS, 1971→) |
| Prime rate | **71 years** (FRED DPRIME, 1955→) |
| Rent inflation | **79 years** (CPI rent of primary residence, 1947→) |
| Rent by bedroom count | **43 years** by county (HUD FMR, 1983→); 8 years by ZIP |
| Property tax by ZIP | **17 years** (Census ACS, 2009→) — not 36 |
| Evictions | **19 years**, and the series ends in 2018 |
| Tenant tenure | 40 years available (Census AHS, 1985→) — adapter not yet built |
| **Rent by bathroom count** | **No public dataset exists.** No US statistical agency has ever collected it. Returned as null with the reason. |
| **Security deposits over time** | **Not a time series.** Deposits are state statute — a rules table, not a history. |

A platform that says "17 years of property tax history for your ZIP, 2009 through 2025" is worth more than one that claims 36 and quietly extrapolates.

## 6. The regime engine, written for this package

Perplexity's requested structure named `historicalMarketRegimeEngine.ts`. It did not exist in any repository. It does now, and it answers a real gap in the roadmap.

A plain block bootstrap treats 1979 and 2013 as equally likely neighbours for the year ahead. They are not — inflation, policy rates and asset prices move in persistent states. The engine classifies every year of the record into one of eight regimes by named, checkable rules, estimates the observed transition matrix, and draws resampling blocks conditioned on regime rather than blindly from the whole record.

Design choices that matter: a year the record cannot classify is labelled `unclassified` and **excluded** from sampling rather than defaulted to expansion (defaulting to the benign state is how a model quietly becomes optimistic); transition rows built on fewer than five observations are flagged `sparse`; and when a conditioned draw cannot find a block in the drawn regime, the fallback is counted and reported — because a silent fallback makes a conditioned fan indistinguishable from an unconditioned one.

19 tests. Shipped in commit on `claude/base-consolidation`.

## 7. What Perplexity is being asked to do

Seven research jobs, ranked. Full specification in `data/questions.csv`.

1. **Provider verification** — 39 named providers plus Roc Capital. Highest value on the list; nothing may publish a rate, term or phone number without a dated primary source.
2. **Equity-share eligibility** at Point, Hometap, Unison, Unlock and Splitero: does each permit a non-owner-occupied investment property, and does each consent to a subordinate lien? This single fact changes the legal option space for every portfolio owner on the platform.
3. **Fifty-state security-deposit statutes**, verified against primary statute text.
4. **AG 49-A maximum illustrated rates** per product, from carrier disclosures — this resolves defect #3 above.
5. **Kiavi and Griffin 90-day seasoning** — confirm on the lenders' own pages or leave unverified.
6. **Confirm or refute** the finding that no public dataset carries rent by bathroom count.
7. **Account-aggregation vendors** — Plaid vs MX vs Yodlee for an insurance-licensed advisory platform.

The standing rule for all seven: **a cited, dated primary source, or an explicit "not found."** A plausible guess is worse than a blank, because a blank is honest and a guess eventually gets printed on an illustration and handed to a family.

## 8. The path from 4.3 to 10

Going from 4.3 to 10 across 115 pages sounds like six rules times 115 pages of work. It is not, because **eight of the ten rules in the page contract are satisfied by shared infrastructure rather than per-page code**: one context provider, one evidence panel, one server helper, one resampling function, a set of rules tables, a link generator, one analytics hook.

Build the spine once, attach the pages to it, and most of the catalogue moves from 3 to 8 in weeks rather than a page at a time over a year.

Full detail in `recommendations.md`. Build order with pass/fail checks in `MANIFEST.md` §4.
