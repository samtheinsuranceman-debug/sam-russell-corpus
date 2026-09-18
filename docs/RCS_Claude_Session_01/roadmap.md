# Roadmap
## Every outstanding project, what is missing, and what completes it

Each entry states: what exists today, what is missing, exactly what completes it, who can do it, and the check that proves it is done. A criterion that cannot fail is not a criterion.

**Status as of 2026-09-18:** BASE branch `claude/base-consolidation`, typecheck 0 errors, 214 test files / 4,095 tests green, 330 routes, mean page wiring 3.3 / 10.

---

# P0 — Nothing else should ship before these

## P0.1 — The IUL model charges nothing for insurance

**Exists:** `shared/mortgageKiller.ts` projects indexed universal life cash value across 30 years and feeds the flagship page, the PDF export, and the strategy context that other pages consume.

**Missing:** any cost-of-insurance term. A search for `coi`, `costOfInsurance` and `insuranceCharge` across the engine returns nothing. The policy accumulates premium and credits interest, and is never charged for the mortality and expense the contract actually charges.

**Why it is first:** every downstream figure — years saved, net worth, the comparison against doing nothing — inherits the overstatement. This is not a rounding issue; a mid-size policy's cumulative charges over 30 years run to six figures.

**What completes it:**
1. A per-product COI table keyed by issue age, gender, rate class and policy year, taken from the carrier's illustration (the same document that supplies the AG 49-A cap).
2. A monthly deduction in the accumulation loop, before interest crediting, matching the contract's order of operations.
3. A test asserting that a zero-COI run and a real-COI run differ, and that the difference grows with issue age.

**Who:** a builder, with the carrier illustration in hand. **Perplexity** can supply the published rate tables where a carrier discloses them (see `data/questions.csv` Q-03).

**Done when:** a 45-year-old male preferred non-tobacco policy modelled here matches the carrier's own illustration within 2% at years 10, 20 and 30.

---

## P0.2 — Policy-loan drag is reported but never deducted

**Exists:** `loanDragCost` computed at `mortgageKiller.ts:297` as `cumulativePolicyLoans × loanDragRate`, written into the result row at `:342`, and rendered on the page.

**Missing:** any subtraction. No total, no net cash value, no net worth reduces by it.

**What completes it:** subtract from `netCashValue`, which flows into `netWorth` at `:565`. One line, plus a test asserting net worth falls when loans rise.

**Who:** a builder. Thirty minutes.

**Done when:** a run with policy loans shows a lower net worth than the identical run without them, by the cumulative drag.

---

## P0.3 — The default crediting rate exceeds the product's own cap

**Exists:** `iulCreditRate` defaults to `0.075` at `:645`; a header comment at `:14` asserts "AG 49 Compliance: 7.5% max illustrated rate". The illustrated product's actual AG 49-A maximum illustrated rate is **6.35%**, recorded correctly in `shared/pacificHorizonEcv.ts`.

**Missing:** the recognition that AG 49-A maximum illustrated rates are **product-specific**, calculated by each carrier's illustration actuary from that product's index parameters. There is no single industry number, so no global constant can be right.

**What completes it:**
1. `shared/agRates.ts` — one row per illustrated product: carrier, product, maximum illustrated rate, illustrated rate, allocation, disclosure URL, effective date.
2. The engine reads the selected product's cap and refuses to illustrate above it.
3. Delete the global constant and correct the header comment.
4. A compliance test asserting no illustration exceeds its product's cap.

**Who:** builder + **Perplexity** for the carrier disclosures (Q-03).

**Done when:** the compliance test passes and no global illustrated-rate constant exists in the repository.

---

## P0.4 — The index table is the wrong return series

**Exists:** `shared/ibbotsonModel.ts:104-110` holds annual returns including 2008 as `-0.3700` and 2009 as `0.2646`. These are **total return** (price plus dividends).

**Missing:** price return, which is what index crediting is calculated on. 2008 price return is −38.49%; 2009 is +23.45%. The correct series already exists in `shared/indexCreditingData.ts` as `RAW_INDEX_RETURNS`, and Session A's `historicalShocks.ts` already uses it correctly.

**What completes it:** repoint `ibbotsonModel` at `RAW_INDEX_RETURNS`, delete the local table, recompute the two `timeMachineCompliance` expectations that were written against the defective series, and add a test asserting the two modules agree year by year.

**Who:** a builder. Half a day including the expectation recompute.

**Done when:** `ibbotsonModel` and `historicalShocks` return identical credited rates for the same floor, cap and year.

---

## P0.5 — The evidence panel exists on exactly one page

**Exists:** `mortgageEvidence.withEvidence` in `server/rentalRouter.ts` and the toggle panel on `MortgageKiller.tsx` — ZIP and county inputs, five toggles, and a source ledger rendered above the results.

**Missing:** everything else. 114 other calculators show flat assumptions with no provenance.

**What completes it:**
1. `client/src/components/EvidencePanel.tsx` — the panel, extracted, taking a toggle state and a geography.
2. `server/_core/withEvidence.ts` — the server helper, generalised to take any pure engine plus its evidence-path requirements.
3. Apply to the ten highest-traffic calculators, then the remainder.
4. A scorecard detector for Rule 5, so coverage is counted rather than estimated.

**Who:** a builder. Extraction is a day; rollout is a page at a time and parallelisable.

**Done when:** a repository scan finds zero calculators displaying an unlabelled flat rate, and the scorecard's Rule 5 count reads 115 / 115.

---

# P1 — The spine

## P1.1 — The first real data sweep has never run

**Exists:** adapters for HUD Fair Market Rents, HUD Small Area FMRs, Census ACS, Eviction Lab and the FRED money and price series; the `rental_series` table; a boot-time schedule gated by `RENTAL_DATA_DAYS`.

**Missing:** data. The build sandbox could not reach huduser.gov, api.census.gov or fred.stlouisfed.org — every request returned empty. The adapters are unit-tested against the real file layouts but have never pulled a live file.

**What completes it:**
1. Set `RENTAL_DATA_DAYS=30`, `ZIP_DATA_DAYS=30` and `CENSUS_API_KEY` on Railway. *(Note: these are two variables beyond the nine the master roadmap lists — the list is now eleven.)*
2. Trigger `rentalMarket.refresh` (owner-only) or wait for the boot sweep.
3. Read `rentalMarket.status` and `zip.status` from an external client and confirm non-zero row counts per series.

**Who:** the **owner** sets the variables; anyone can verify.

**Done when:** `rentalMarket.status` reports a non-zero row count and a real as-of date for every series it claims to carry, read from outside the container.

---

## P1.2 — ZIP is not a field the household can enter

**Exists:** a fact finder, a client data context, and an evidence layer that needs a five-digit ZIP to do anything.

**Missing:** the ZIP. Also county FIPS, state, filing status, and a property list carrying bedroom and bathroom counts.

**Why this is the highest-leverage single change on the roadmap:** without a ZIP, every evidence toggle on every calculator stays inert. One field unlocks 51 years of appreciation, 17 years of property tax, 43 years of rent by bedroom, and the eviction context — across the entire catalogue at once.

**What completes it:** add the fields to `shared/factFinder.ts` and the fact-finder UI; thread them through `ClientDataContext`; default the evidence panel's geography from them on every page.

**Who:** a builder. One to two days.

**Done when:** entering a ZIP once in the fact finder makes every calculator's evidence toggles live without re-typing it.

---

## P1.3 — Two requested data series have no adapter

**Exists:** the owner asked for tenant length of stay and security deposit history.

**Missing:**
- **Tenure:** Census American Housing Survey publishes "year householder moved into unit" biennially from 1985 — 40 years. No adapter written.
- **Deposits:** no time series exists anywhere. Deposits are state statute — caps in months of rent, return deadlines, interest requirements.

**What completes it:**
- Tenure: an AHS adapter storing a `tenure_years` series, exposed via `rentalMarket.tenure`. Needs the table identifiers (`data/questions.csv` Q-07).
- Deposits: a 50-state rules table implementing `RulesTable<T>`, every row verified against primary statute text (Q-04). **Not from memory, not from a summary site.**

**Who:** **Perplexity** for both research halves; a builder for the code.

**Done when:** `rentalMarket.tenure` returns a real series for a queried geography, and the deposit table carries a statute citation and as-of date on all 51 rows.

---

## P1.4 — The Shiller series is not wired

**Exists:** simulators that need long-horizon equity history.

**Missing:** the Shiller dataset — S&P composite, dividends, earnings and CAPE from 1871. 155 years, freely published, no adapter.

**What completes it:** an adapter into `market_data_points`, plus recomputing the two `timeMachineCompliance` expectations that were written against the 688-era defective series.

**Who:** a builder. One day.

**Done when:** a simulator can run a 30-year projection resampled from 155 years rather than 68.

---

## P1.5 — Three abstractions both sessions are now asking for

**Exists:** two rules tables with different shapes (`thresholds.ts`, `divorceStateRules.ts`), two smoke tests holding a hard-coded route integer, and one evidence panel on one page.

**Missing:** the shared interfaces.

**What completes it:**
1. `shared/rulesTable.ts` — `RulesTable<T>` with `version`, `asOf`, `rows`, `neverPrinted`, `sourceFor()`. Both existing tables implement it; the deposit table is built on it.
2. `shared/routeManifest.ts` — a real list of routes replacing the integer in both smoke tests. **This removes the single most reliable merge conflict between parallel sessions.**
3. `EvidencePanel` + `withEvidence()` per P0.5.

**Who:** a builder. Two days for all three.

**Done when:** a repository scan asserts every statutory constant reaches a `RulesTable`, and two parallel branches adding different routes merge without conflict.

---

# P2 — One organism

## P2.1 — 101 of 115 pages have no genome route

**Missing:** a strategy that routes a household to them. A page the profile cannot reach is a page no user finds.

**What completes it:** a `relatedPaths` entry per strategy for every catalogued page, or the page is embedded into one that has a route. Session A's question Q10 asks exactly this — it is a mapping job, not a coding job.

**Done when:** every catalogue page is reachable from at least one genome strategy.

---

## P2.2 — 112 of 115 pages have no provenance trace

**What completes it:** a `FigureTrace` per headline figure — inputs, sourced steps, rules applied, arithmetic, assumptions — surfaced through the existing `/portal/how-a-figure-is-made` page, linked from beside every number.

**Done when:** any displayed figure reaches its engine, its ledger row and its rule row in one click.

---

## P2.3 — 104 of 115 pages have fewer than two inbound links

**Why it matters:** this is the measurable form of the owner's own complaint about getting lost in his own website.

**What completes it:** publish-and-consume on every page; a related-pages rail generated from the catalogue; hub embedding for pages that cannot earn two links on their own.

**Done when:** zero leaf pages, and the single-entry walk succeeds — a household entered once, walked through the full genome route, with no value typed twice and every figure tracing to a source or a labelled assumption.

---

## P2.4 — The scorecard sees six of ten dimensions

**Exists:** `server/integrationAudit.ts` reads six page-contract dimensions from source.

**Missing:** detectors for Rules 4 (Sourced), 5 (Toggled), 6 (Simulated) and 10 (Measured) — which could not exist before this session, because the things they detect did not exist.

**What completes it:** four detectors, then run the audit in CI under the staged enforcement schedule: report only now; new pages must ship at 8 once the site mean reaches 6; regressions below 8 fail the build once it reaches 8.

**Done when:** the score is computed entirely from code with no human judgement.

---

# P3 — Harvest and reach

## P3.1 — The 688-page build is audited but not mined

**Exists:** every page inventoried, scored and reconciled into buckets in `docs/audit/PLAN_RECONCILIATION.csv`.

**Missing:** the actual migration. Bucket A = 43 pages the owner rated 8 or higher that carry a blocking defect. Bucket B = 138 to embed as hub tabs. Bucket D = 119 to retire.

**What completes it:** fix Bucket A's defects then enhance or embed; embed Bucket B keeping every URL; retire Bucket D with redirects. **No URL dies** — the owner was explicit.

**Done when:** every one of the 688 URLs resolves to a live route, a hub tab, or a redirect.

---

## P3.2 — 39 providers are named from general knowledge

**Missing:** verified records. Six of 39 have one. Nothing may publish a rate, term or phone number without a dated primary source.

**What completes it:** Session A's `provider_verification_brief.md` executed by **Perplexity**, returning the JSON schema in its §8; ingested as `Verified<T>` records; every dossier's `registryId` pointed at its record; a 90-day freshness sweep flagging anything stale.

**Done when:** the "Verified record" link resolves for all 39, and no provider field renders without a source and date.

---

## P3.3 — Six capabilities are dark for want of credentials

**Missing:** OpenRouter, Speko and Stripe authorisation; and eleven Railway variables — the nine in the master roadmap plus `CENSUS_API_KEY` and `RENTAL_DATA_DAYS`.

**Consequence:** the multi-model council, payments, voice, video, USPTO probes and both data sweeps cannot run.

**Who:** the **owner**. Nobody else can.

---

## P3.4 — 57 patent claims are drafted and none is filed

**What completes it:** file one provisional. Add a record to `APPLICATIONS` in `shared/patentStatus.ts` and every surface flips to true "patent pending" language — a test currently enforces the honest version.

**Who:** owner plus counsel. A day of legal work.

---

# P4 — Owner decisions that block builders

| Decision | Options | Blocks |
|---|---|---|
| Merge BASE to master | Merge now; or hold | 12 commits of work reaching production |
| Default design system | Patent360; Concept 23; one of four physician concepts | Every marketing and homepage task |
| Gate password | Port `Welcome1@1` as an env var; or stay OAuth-only | The 688 migration's access model |
| Account aggregation | Plaid, MX, Yodlee, or none | The largest functional gap against incumbents |
| Client illustration publishing | Anonymised dated image with compliance review; or omit | The Athene 57%/20% claim the owner wants on the site |

---

# Sequencing summary

```
P0  ─ COI · loan drag · AG 49-A caps · price return · evidence panel extraction
      └─ gate: flagship agrees with the carrier illustration within 2%
P1  ─ data sweep · ZIP in fact finder · AHS + deposits · Shiller · three abstractions
      └─ gate: every calculator shows a ledger; zero unlabelled flat rates
P2  ─ genome routes · provenance traces · publish/consume · four scorecard detectors
      └─ gate: the single-entry walk succeeds; mean page score ≥ 8
P3  ─ 688 migration · provider verification · credentials · provisional filing
      └─ gate: every 688 URL resolves; all 39 providers verified
```

**The honest estimate.** P0 is days. P1 is one to two weeks. P2 is two to three weeks, and it is where the score moves from 3.3 to 8 — because eight of the ten contract rules are satisfied by shared infrastructure rather than per-page work. P3 is parallelisable and partly gated on the owner and on Perplexity rather than on a builder.

Build the spine once, attach the pages to it. That is the whole plan.
