# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 00 — START HERE (read this file first)

**Prepared:** 2026-09-18 · **From:** Claude session `session_01GDyUsq4kDze9T1KGzUv8Vb` · **For:** Perplexity (chat or Computer), and any AI that continues this build.

### How this briefing is packaged

Seven plain-markdown files. No zip, no archive, nothing to unpack. Each file is self-contained and small enough to paste into a chat window on its own. Read them in order, or jump to the one you need.

| File | What it answers |
|---|---|
| **00 — START HERE** (this file) | What the platform is, where the code lives, how to run it, the rules you must not break |
| **01 — INSTRUCTIONS & TASK LEDGER** | Every instruction the owner gave, what is finished (with commit hashes), what is outstanding and in what priority |
| **02 — BLOCKERS** | Every place the previous builder got stuck, why, and exactly what unblocks it — including who has to do it |
| **03 — THE 10/10 PAGE CONTRACT** | The ten rules every page must pass, how each one is checked in code, and how a page scores itself |
| **04 — PER-CATEGORY REQUIREMENTS** | For each of nine page types: what is necessary, what to add, what to connect, what to delete, what to measure |
| **05 — ONE ORGANISM** | The wiring rules that turn 115 pages into one system, plus the universal evidence-toggle specification |
| **06 — BUILD ORDER + DATA REGISTRY** | P0→P5 phases with pass/fail completion checks, and every public data source with its real coverage window |

### What this platform is

Russell Capital Systems is a wealth-technology platform: ~115 catalogued financial calculators and simulators (mortgage acceleration, indexed universal life, annuities, tax, PSLF, divorce, long-term care, real-estate sequencing), a behavioral-intelligence layer (200+ NLP calibration questions feeding a "Wealth Genome" profile), and an AI brain (composite mind + council) that can reason over all of it. It is a React 19 / Vite / Tailwind 4 front end on a tRPC v11 + drizzle-orm (MySQL) back end, deployed on Railway.

### Where the code is

GitHub org/user: `samtheinsuranceman-debug`

| What | Repo → folder | Branch | Head |
|---|---|---|---|
| **BASE reference build** — the trunk plus every harvested feature. **All work happens here.** | `sam-russell-corpus` → `russell-capital-systems/` | `claude/base-consolidation` | `72a5fac` |
| Production (Railway → www.russellcapitalsystems.com) | same folder | `master` | `ec3d057` |
| The 688-page build — audited and being mined, **not** the base | `russell-capital` | `claude/homepage-portrait-day-sign-5o0l9d` | `b12e85e` |
| Pure engine kit (engines, no UI) | `sam-russell-corpus` → `russell-capital/` | `master` | — |
| Doctor-buddy site | `sam-russell-corpus` → `doctor-buddy/` | `master` | — |
| Patent360 design system | `sam-russell-corpus` → `Patent360/` | `master` | — |

The full handoff also lives in the repos as `docs/MASTER_HANDOFF_2026-09-18.md` (BASE) and `docs/audit/MASTER_HANDOFF_2026-09-18.md` (688 build). These Perplexity files live at `docs/perplexity/` in BASE.

### Current measured state — numbers, not adjectives

| Fact | Value | Where it is measured |
|---|---|---|
| TypeScript errors | 0 | `pnpm check` |
| Test files / tests | 213 / 4,076 green | `pnpm test` |
| Route patterns | 330 | asserted by two smoke tests |
| Catalogue pages | 115+ | `shared/calculatorCatalog.ts` |
| Memory-bank groups wired to the brain | 29 | `shared/aiMemoryBank.ts` (`unwiredGroups()` = 0) |
| **Mean page wiring score** | **3.3 / 10** | `docs/INTEGRATION_SCORECARD.md` |
| 688-build audit average (utility-weighted) | 4.3 / 10 | `docs/audit/PAGE_AUDIT_688.md` |
| Pages at 10 / below 5 | 0 / 76 | integration scorecard |
| Pages no genome strategy routes to | 101 of 115 | integration scorecard |
| Pages with no provenance trace | 112 of 115 | integration scorecard |
| Pages with no live data | 104 of 115 | integration scorecard |
| Pages fewer than two surfaces link to | 104 of 115 | integration scorecard |
| Patent claims drafted / filed | 57 / 0 | `shared/patentStatus.ts` |
| Named providers / with a verified record | 39 / 6 | `shared/mechanismDossiers.ts` |
| Lender records / with verified phone | 15 / 5 | `shared/altCredit/lenders.ts` |

**The diagnosis in one sentence: the engines are strong; the wiring between them is the gap, and the gap is measured.**

### How to run it

```bash
cd russell-capital-systems
pnpm install
pnpm check      # TypeScript — must be 0 errors
pnpm test       # vitest, ~4 minutes — must be green
pnpm dev        # http://localhost:3000
```

Environment: `DATABASE_URL` (MySQL) is required. Optional but unlocking: `FRED_API_KEY`, `CENSUS_API_KEY`, `ZIP_DATA_DAYS=30`, `RENTAL_DATA_DAYS=30`. See `docs/API_KEYS_WHERE_TO_GET_THEM.md`.

Database schema: `database/rcs-schema.sql`, regenerated with `scripts/export_schema_sql.sh` (runs offline).

### Rules you must not break

1. **Never push to `master`.** It deploys to production on Railway. All work goes on `claude/base-consolidation`. Merging to master is the owner's decision, made by the owner.
2. **Never open a pull request** unless the owner explicitly asks for one.
3. **Every change is gated.** `pnpm check` must be 0 and `pnpm test` must be green before any commit. No exceptions, no "I'll fix it next commit."
4. **Adding a route breaks three tests unless you also:** add the nav entry in `client/src/components/AppShell.tsx`, bump the counts in `server/managed-port.smoke.test.ts` and `server/grok-merge.smoke.test.ts`, and add the catalogue entry in `shared/calculatorCatalog.ts`.
5. **Changing the database schema** requires regenerating `database/rcs-schema.sql` or `databaseSchemaFile.test.ts` fails.
6. **No purple.** `concept16Homepage.test.ts` fails the build on any `violet-`, `purple-`, `#a78bfa`, `#8b5cf6`, `#7c3aed`, or `rgba(124,58,237)` anywhere in `client/src`. The palette is emerald and gold. This guard is deliberate.
7. **No modern iteration.** `tsconfig.json` has no `target` and no `downlevelIteration`, so it compiles to ES5. Do not use `[...someSet]`, `for…of` over a `Map` or `Set`, or `.matchAll()`. Use `Array.from()`.
8. **Secrets never go in `shared/`.** That folder is bundled to the browser.
9. **No number without a source.** Any figure shown to a user carries `{source, asOf, window, method}`. Where no public series exists, return `null` with the reason — never an estimate dressed as a fact.
10. **Nothing says "patent pending"** until a provisional is actually filed. A test enforces this.

### The one-line summary of what needs to happen

Take a platform whose engines are excellent and whose pages are islands, and wire every page to the same household state, the same sourced data, the same rules tables, and the same AI brain — so that no figure appears without its provenance, no page is a dead end, and every calculator can optionally run on 36 years of real history instead of a flat assumption.

**Next file: 01 — INSTRUCTIONS & TASK LEDGER.**

---

# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 01 — INSTRUCTIONS GIVEN, WORK COMPLETED, WORK OUTSTANDING

### Part A — Every instruction the owner gave, in order

These are the owner's own directives from the session, restated faithfully. They remain in force unless he changes them.

1. **Identify the master build.** Which build is largest and most complex, where is it served, should there be three domains or one, and how do the builds merge?
   → *Answered:* the trunk `sam-russell-corpus/russell-capital-systems` is live at www.russellcapitalsystems.com via Railway. Keep three domains with one canonical. The apex → GitHub Pages route was broken.

2. **Audit all 688 pages.** Rank every page 1–10 with a reason. For anything below 8, say what it takes to reach 9. For anything below 5, decide: enhance it, or embed it as a tab inside a hub. Embed pages inside hubs while keeping their URLs. Link everything to the AI brain and the memory bank. Explain what functionality is actually proven. Assess rarity. Give 20 improvement suggestions. Build a team of AIs. Report how much better the site would be.

3. **Produce an upgrade spec against the base.** Start from the 688-page build. Add API connectors. Research web links related to the content. Bring in **36 years of source references**. Add predictive modelling based on historical trends. If reaching a 10 means changing 80% of the content, say so. Embed pages inside the most important tabs. And first: **scan every build**, determine the most comprehensive one, and harvest the best features into it — including "the user interface with different colors and textures, which I already did, but I don't remember which one it is."

4. **Confirm before acting.** Wait for the merges to finish. Confirm on GitHub that a merge actually happened before starting an audit. Stop musing, stop searching, look at what was provided, then move.

5. **Mark the BASE.** Take the most comprehensive build, mark it the BASE reference build, and copy or extract every specialised feature from the incomplete builds into it — utilities, controls, toggle buttons, mechanics, API connections, database libraries, additional functional pages, the sequencing of laws around real-estate lending, the cryptocurrency build and library — until the base holds the best of all of them. Only then audit the 688.

6. **Put the real 36-year history into the engines.** By ZIP code, into the Mortgage Killer calculator: home appreciation, inflation driven by money printing (as an optional toggle), property taxes rising over 36 years, and rents year over year — for one room or the whole house, across every bedroom/bathroom configuration (1br/1ba apartment and townhouse, 2br/1ba apartment, 2br/1ba house, 2br/2ba, 3br/1ba, 3br/2ba, 4br/1ba through 4br/4ba, 5br/1ba through 5br/5ba), from every possible ZIP code in the country. Also 36 years of security deposits, average tenant length of stay, eviction counts and percentages, and the percentage of owners suing their tenants. Bring in other AIs if needed — bring Perplexity.

7. **Usage and pricing.** How much capacity remains on Opus 5, and what plan upgrade keeps this pace?

8. **Absorb the uploaded archives.** Anything inside the ten uploaded zip folders that is not already in any Russell Capital repo gets added to the BASE immediately.

9. **Explain and fix the 4-out-of-10 failures.** Explain what a 4/10 failure is. Say what engine-to-rules-table wiring, factors, domains and areas must be built so they are never skipped again. Where it needs an API, find the right source and wire it in — 36 years or whatever the record allows. Build it now and make it all work.

10. **Package everything.** Every build in zip sets under five megabytes, with the instructions given, tasks completed, tasks outstanding, priorities, trouble areas, what finishing them needs, and overall recommendations to take the site from 4.3 to a 10 — including the rules every page must follow, how pages interconnect as one organism, how they connect to the AI brain, how values auto-populate into the calculators and the 10,000-path simulation, and the toggles for 36-year history of taxes and inflation on every calculator. Plus the complete chat history.

11. **Reformat for Perplexity.** He cannot always open a zip folder — reformat the material so he can absorb it. *(This briefing is that reformat.)*

**Standing constraints in force throughout:** never push to `master`; no pull requests unless asked; secrets never in `shared/`; no proprietary source code sent to external AI services (public-data questions only); every commit carries the session trailer; no model identifiers in code or commit bodies.

---

### Part B — Work completed, with evidence

Every item below is committed and pushed to `claude/base-consolidation`. The commit hash is the evidence.

| # | Task | Commit / artifact |
|---|---|---|
| 1 | Master build identified and documented | `docs/audit/MASTER_BUILD_AND_STRATEGY.md` |
| 2 | All 688 pages inventoried with metadata | `docs/audit/pageRegistry.json` |
| 3 | All 688 pages scored and ranked 1–10 with reasons | `docs/audit/PAGE_AUDIT_688.md` / `.csv` |
| 4 | Capability inventory, rarity assessment, 20 improvements | `docs/audit/MASTER_BUILD_AND_STRATEGY.md` |
| 5 | Embedding architecture and AI-brain wiring designed | `docs/audit/PAGE_UPGRADE_SPEC.md` |
| 6 | BASE established on the merged trunk, toolchain green | branch `claude/base-consolidation` |
| 7 | Engine kit harvested (incl. `policyLoanRules` port, liveResearch shim) | `a12853e` |
| 8 | RECIN workspace + orchestrator + cinematic layer harvested | `199b231`, `412cf84` |
| 9 | Patent360 design system (opt-in), AQAL research gate, motion kit, doctor-buddy routers, council + NLP engine + evidence retrieval | `63cc15d`, `ec5c8b1` |
| 10 | Audit pipeline ported and re-pointed at the trunk | `scripts/audit/*.py` (parameterised by `RCS_ROOT`, `RCS_COMPARE_ROOT`) |
| 11 | 688 build audited against BASE; the owner's 687-row consolidation plan reconciled against measured scores into buckets A/B/C/D | `docs/audit/PLAN_RECONCILIATION.md` / `.csv` |
| 12 | **Divorce engine wired to the state rules table** — community-property vs equitable distribution resolved per state; non-statutory ratios now carry `statutory: false` plus a plain-language basis; `rulesVersion` and `neverPrinted` returned with every result; four previously skipped tests now pass | `9c27947` |
| 13 | **Mortgage engine given evidence-driven paths** — `appreciationPath`, `inflationPath`, `propertyTaxRatePath`, `helocRatePath`, all backward compatible (absent = the old flat constants) | `9c27947` |
| 14 | **Rental-market evidence layer built** — `rental_series` table; adapters for HUD Fair Market Rents, HUD Small Area FMRs by ZIP, Census ACS by ZCTA, Eviction Lab county data, and FRED money/CPI series; `rentalMarketEngine` with block-bootstrap resampling and an evidence ledger; routers `rentalMarket.*` and `mortgageEvidence.withEvidence`; scheduled sweep wired into server boot | `2787be6` |
| 15 | **36-year evidence toggles live on the Mortgage Killer page** — ZIP + county input, five toggles, and a source ledger rendered above the results showing every path as applied or fallback with its reason | `73cca24` |
| 16 | Ten uploaded archives harvested — 30 sister-invention engines (SI-001 through SI-035), 8 portal pages with routes and nav, two routers, patent notes, five homepage concept images | `2787be6` |
| 17 | Master's integration scorecard and roadmap merged into BASE | `9a9f8e6` |
| 18 | Master handoff written to both repos | `72a5fac` (BASE), `b12e85e` (688) |

---

### Part C — Work outstanding, in priority order

| Priority | Task | Why it matters | Who can do it |
|---|---|---|---|
| **P0** | **Fix four flagship math defects.** (a) `shared/mortgageKiller.ts:686` double-counts interest savings. (b) `loanDragCost` is computed and never used. (c) Cost-of-insurance is inverted at `:237`. (d) `mortgageKiller.ts:14` uses a 7.5% AG 49-A cap while `shared/pacificHorizonEcv.ts:88` correctly uses the product-specific 6.35%. | A wrong number on the most-used calculator outweighs every cosmetic improvement. These are the reason the flagship is not a 9. | Any builder |
| **P0** | **Fix the index-return table.** `shared/ibbotsonModel.ts:107-108` holds total-return values (2008 as −0.37, 2009 as 0.2646) where index crediting requires price-return (2008 = −38.3%, 2009 = +23.5%). The trunk's `indexCreditingData.ts` is already correct — use it. | Every IUL and annuity illustration built on this table is overstated. | Any builder |
| **P0** | **Roll the evidence toggles out to every calculator.** Mortgage Killer is wired; the other ~114 are not. Extract a shared `EvidencePanel` component and a `withEvidence()` server helper rather than copying the code. | This is the owner's standing order: 36-year history, inflation, and taxes optional on **every** calculator. | Any builder |
| **P1** | **AHS tenant-tenure adapter** (Census American Housing Survey, "year householder moved in", biennial from 1985) and a **sourced 50-state security-deposit rules table** (cap in months' rent, return deadline, interest requirement, statute citation, as-of date) with a `RULES_VERSION` and `neverPrinted` list. | Two of the rental facts the owner asked for have no adapter yet. | **Perplexity for the statute sourcing** (see file 02); a builder for the code |
| **P1** | **Shiller adapter** (1871→ CAPE, dividends, real returns) and recompute two `timeMachineCompliance` expectations from the trunk's sourced series rather than the 688-era defective one. | Time Machine still tests against a bad fixture. | Any builder |
| **P1** | **Owner decisions:** whether to port the gate password (`Welcome1@1` — the trunk is OAuth-only), and whether to merge `claude/base-consolidation` into `master`. | Only the owner can decide these. | Owner |
| **P2** | **Authorise the MCP servers** (OpenRouter, Speko, Stripe) and **set the Railway variables**: `PERPLEXITY_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `HEYGEN_API_KEY`, `HEYGEN_VOICE_ID`, `MCP_API_KEY`, `USPTO_API_KEY`, `SESSION_SECRET`, `PARTNER_API_KEY`, `CENSUS_API_KEY`, `ZIP_DATA_DAYS=30`, `RENTAL_DATA_DAYS=30`. | The multi-model council, payments, voice, video, and the data sweeps are all dark until these exist. | Owner |
| **P2** | **Provider verification** — 39 named providers plus Roc Capital, per `docs/PROVIDER_VERIFICATION_BRIEF.md`, returning the JSON schema in §8 of that brief. | No rate, term, phone number or eligibility rule may be published without a dated primary source. | **Perplexity — this is the single highest-value research job** |
| **P2** | **Mine the 688 build.** Bucket A = 43 pages the owner rated 8 or higher that carry a blocking defect; Bucket B = 138 pages to embed as hub tabs keeping their URLs; Bucket D = 119 pages to retire with redirects. All listed in `docs/audit/PLAN_RECONCILIATION.csv`. | This is the page-by-page harvest the owner asked for. | Any builder |
| **P3** | **File a provisional patent.** The code is ready — add one record to `APPLICATIONS` in `shared/patentStatus.ts` and every surface flips to true "patent pending" language. | 57 claims drafted, zero filed. A day of legal work is the cheapest honest route to the claim the owner wants. | Owner + counsel |

**Next file: 02 — BLOCKERS AND WHAT UNBLOCKS THEM.**

---

# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 02 — WHERE THE WORK GOT STUCK, AND WHAT UNBLOCKS IT

Each entry states the problem honestly, what was tried, and the specific action that finishes it. Several of these are jobs Perplexity is better placed to do than a coding agent — those are marked **→ PERPLEXITY**.

---

### 1. Sandbox could not reach the government data hosts

**What happened.** The adapters for HUD (huduser.gov), Census (api.census.gov) and FRED (fred.stlouisfed.org) were written and unit-tested against the real file layouts, but every live request from the build sandbox returned an empty response. Eviction Lab's S3 bucket was reachable; the others were not. This is an egress restriction in the build environment, not a bug in the adapters.

**What unblocks it.** Run the first real sweep from an environment that can reach them — the Railway production container, or a local machine. Set `RENTAL_DATA_DAYS=30`, `ZIP_DATA_DAYS=30`, and `CENSUS_API_KEY`, then call the `rentalMarket.refresh` mutation (owner-only) or wait for the boot schedule. Verify afterwards by reading `rentalMarket.status` and `zip.status` from outside — they report, per series, the earliest year, the latest as-of date, and the row count.

**Do not** conclude the adapters are broken because the sandbox returned nothing. Confirm from a reachable host first.

---

### 2. Rent by **bathroom count** does not exist in any public dataset

**What happened.** The owner asked for rents across specific bedroom/bathroom configurations — 2br/1ba versus 2br/2ba, 4br/1ba through 4br/4ba, and so on. Bedroom counts are well covered. **No United States statistical agency has ever collected rent by bathroom count.** HUD's Fair Market Rents are published by bedroom count only. The Census ACS gross-rent tables are by bedroom count only. There is no series to wire.

**What was done instead.** Every configuration row returns a real bedroom-based rent with its source, and a `bathroomAdjustment` of `null` carrying the explicit reason. The matrix the owner asked for is rendered in full — it simply tells the truth in the bathroom column rather than inventing a multiplier.

**What would finish it, if the owner wants a number there.**
- **Option A (current, and the honest default):** leave it null with the reason shown.
- **Option B:** license listing-level data — Zillow Rental Network, CoStar, Apartments.com, or RentCafe — where individual listings carry both bedroom and bathroom counts. This is a commercial contract, not a coding task.
- **Option C:** build an owner-curated adjustment table with a cited source per row and a visible "not a public statistic" label.

**→ PERPLEXITY:** confirm or refute this finding independently. If a public series with rent by bathroom count exists anywhere — a state housing agency, a university housing survey, a metropolitan planning organisation — name it with a URL and its coverage window. A negative answer is a useful answer; say so plainly.

---

### 3. Security deposits have no 36-year time series

**What happened.** The owner asked for 36 years of security-deposit history. Deposits are not a measured economic series — they are **statute**. Each state caps them (commonly one or two months' rent, some states uncapped), sets a return deadline (14 to 60 days), and some require interest to be paid to the tenant. There is nothing to chart; there is something to tabulate.

**What finishes it.** A 50-state rules table in the same shape as the divorce rules table already in the codebase, with one row per state carrying: the cap expressed in months' rent (or "no statutory cap"), the return deadline in days, whether interest is required and at what rate, any separate-account requirement, the statute citation, and an as-of date. Plus a `RULES_VERSION` and a `neverPrinted` list of claims the table must never be used to support.

**→ PERPLEXITY — this is a direct research job.** For all 50 states plus DC, return JSON rows of exactly this shape, each field verified against the **primary statute text**, not a summary site, not a landlord blog, not memory:

```json
{
  "state": "NC",
  "capMonths": 2.0,
  "capNote": "1.5 months for month-to-month; 2 months for terms longer than month-to-month",
  "returnDeadlineDays": 30,
  "interestRequired": false,
  "separateAccountRequired": true,
  "statuteCitation": "N.C. Gen. Stat. § 42-50 to § 42-56",
  "sourceUrl": "https://www.ncleg.gov/...",
  "asOf": "2026-09-18"
}
```

If a field cannot be verified from the statute, return `null` for it and put the reason in a `notes` field. Do not fill a gap with a plausible number.

---

### 4. Tenant length of stay — the adapter is not written

**What happened.** The data exists. The Census **American Housing Survey** publishes "year householder moved into unit", nationally and for selected metropolitan areas, biennially from 1985. That is 40 years of tenure data. The adapter to pull it into `rental_series` simply has not been built yet.

**What finishes it.** Write the adapter against the AHS table files, store as a `tenure_years` series keyed by geography, and expose it through `rentalMarket.tenure`. Straightforward work, maybe half a day.

**→ PERPLEXITY (helpful, not required):** confirm the current AHS table identifiers and download URLs for "year moved in" across the 1985–2025 series, and whether metropolitan-level files are available for all years or only selected ones.

---

### 5. Perplexity's own deep-research tool timed out

**What happened.** The `perplexity_research` endpoint was called twice from the build session and timed out at sixty seconds both times. Exa was used as a substitute for source verification.

**What works better.** Break the question into smaller pieces and use the faster ask/search endpoints, or run the research inside Perplexity Computer where a long job has room to finish. The provider-verification brief in the repo already has a JSON return schema designed for exactly this.

---

### 6. Two constants disagree about the maximum illustrated rate

**What happened.** `shared/mortgageKiller.ts:14` carries 7.5% as an AG 49-A maximum illustrated rate. `shared/pacificHorizonEcv.ts:88` carries 6.35% for the Pacific Horizon ECV product. These cannot both be the cap for the same illustration. The 7.5% appears to be a loan charge rate that was conflated with a crediting cap at some point.

**What finishes it.** AG 49-A maximum illustrated rates are **product-specific** — calculated by each carrier's illustration actuary from that product's own index parameters. There is no single industry number. Build a per-product table holding each product's current maximum illustrated rate, its effective date, and the carrier's disclosure document as the source. The engine reads the product's cap; no global constant survives.

**→ PERPLEXITY:** for each product the platform illustrates, find the carrier's current published maximum illustrated rate under AG 49-A, with the disclosure document URL and its effective date. Where a carrier does not publish it, say so — that is a real finding and means the product cannot be illustrated until the carrier supplies it.

---

### 7. A shell quirk caused two commits to claim work that had not landed

**What happened.** In this build environment, `set -e` does not abort on a failing Python heredoc. Two early commits therefore described changes that had not actually been written to disk.

**How it was handled.** Corrected forward with explicit commits stating the false claim. Every subsequent commit was gated by checking the actual tool output, then `pnpm check`, then `pnpm test`, before committing.

**The lesson for whoever continues:** verify the file changed before you describe it as changed. Read the diff, do not trust the script's exit code.

---

### 8. Adding a route quietly breaks three tests

**What happened.** The trunk enforces its own coherence. Adding a page route without the matching nav entry fails `navigation-organization.test.ts`; without bumping the expected counts it fails `managed-port.smoke.test.ts` and `grok-merge.smoke.test.ts`; a schema change without regenerating the SQL file fails `databaseSchemaFile.test.ts`. This cost two rounds of rework during the harvest.

**The rule for whoever continues:** after adding any route, run

```bash
pnpm test -- navigation-organization managed-port grok-merge databaseSchemaFile
```

before running the full suite. These guards are a feature — they are what keeps 330 routes coherent.

---

### 9. The colours-and-textures interface the owner could not find

**What happened.** The owner remembered building a distinctive UI with different colours and textures and could not recall which build held it. Three candidates were found and all three are now in the BASE: the **Patent360 design system**, five **homepage concept images** at `client/public/concepts/` (one general, four physician-facing), and the **cinematic layer** harvested in commit `412cf84`.

**What finishes it.** An owner decision: pick one as the default. Once chosen, applying it site-wide is mechanical.

---

### 10. Gate password versus OAuth

**What happened.** The 688-page build was gated behind a shared password (`Welcome1@1`). The production trunk uses OAuth only. The password was deliberately not ported.

**What finishes it.** An owner decision. If he wants a shared-passphrase gate, it should read from an environment variable — never a literal committed to the repository.

---

### 11. Account aggregation does not exist

**What happened.** Every projection on the platform runs from typed inputs. There is no connection to real bank, brokerage or retirement accounts.

**Why it matters.** This is the largest functional gap against JP Morgan, Edward Jones and similar incumbents. A household that has to type its balances will type them once and never update them; a household whose accounts are connected sees a living plan.

**What finishes it.** This is a product and compliance decision before it is a coding one: choose an aggregator (Plaid, MX, or Yodlee), settle custody and consent, then build. Not a task an AI can complete unilaterally.

**→ PERPLEXITY (useful research):** current pricing, data coverage and compliance requirements for Plaid versus MX versus Yodlee for a registered investment advisor or insurance-licensed platform, with sources.

---

### Summary — what Perplexity can finish that a coding agent cannot

1. **Provider verification for 39 providers + Roc Capital** (`docs/PROVIDER_VERIFICATION_BRIEF.md`) — the highest-value job on the list.
2. **50-state security-deposit statutes** in the JSON shape above.
3. **AG 49-A maximum illustrated rates per product**, from carrier disclosures.
4. **Equity-share investment-property eligibility** at Point, Hometap, Unison, Unlock and Splitero — specifically whether each permits a non-owner-occupied property and whether each consents to a subordinate lien. This single fact changes the legal option space for every portfolio owner on the platform.
5. **Kiavi and Griffin 90-day seasoning** — currently supported only by market-comparison sites. Confirm on the lenders' own pages or leave it marked unverified.
6. **Confirm or refute** the "no public bathroom-level rent data" finding.
7. **Account-aggregation vendor comparison.**

For every one of these: a cited, dated primary source, or an explicit "not found." Never a plausible guess.

**Next file: 03 — THE 10/10 PAGE CONTRACT.**

---

# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 03 — THE 10/10 PAGE CONTRACT

### The principle

A 10 out of 10 is not a prettier page. It is a page that **cannot show a number without its source, cannot be reached without the brain knowing it exists, and cannot be left without feeding the next page.**

Two independent measurements found the same gap. The platform's own integration scorecard puts mean page wiring at **3.3 / 10**. The 688-page audit put the utility-weighted average at **4.3 / 10**. Both say the engines are strong and the connections between them are missing.

So the contract below scores *connection*, not appearance. Ten rules. One point each. A page's score is the number of rules it passes. A 10 passes all ten.

---

### The ten rules

#### Rule 1 — REGISTERED
**The page exists in the catalogue.**

The route appears in `shared/calculatorCatalog.ts` (or `SECONDARY_CATALOG` for supporting pages) with: its category, a one-line statement of purpose, its inputs, its outputs, and the memory group it belongs to.

*Passes when:* the catalogue entry exists and `calculatorCatalog.test.ts` verifies the path resolves to a real route.
*Why it matters:* a page absent from the catalogue is invisible to the brain, to navigation, and to the scorecard. It might as well not exist.

#### Rule 2 — BRAINED
**The AI can find and cite this page.**

The page's engine is registered as a module in `shared/aiMemoryBank.ts`, belongs to a memory group, and is reachable by the composite mind so the AI can name it, describe it, and run it.

*Passes when:* `unwiredGroups()` returns 0 and the page's module appears in the instrument block fed to the model's prompt.
*Why it matters:* the owner's core requirement is that everything connects to the AI brain. A page the brain cannot cite is a page the brain will never recommend.

#### Rule 3 — FED
**The household never types the same fact twice.**

Every input the household has already answered anywhere on the site is pre-filled from the shared client state. The page asks only for what is genuinely new.

*Passes when:* every field with a counterpart in the fact finder reads its default from `ClientDataContext`, and a site-wide audit finds no field asked on two pages without pre-fill.
*Why it matters:* re-asking is the single most common reason a user abandons a financial tool. It also signals to the user that the site is a collection of disconnected forms rather than one system that knows them.

#### Rule 4 — SOURCED
**No figure appears without its provenance.**

Every number carries an evidence record: `{source, asOf, window, method}`. Where no public series exists, the value is `null` with the reason shown — never an estimate presented as a measurement.

*Passes when:* every displayed figure traces to an evidence record, and the page renders a ledger or per-figure provenance link.
*Why it matters:* this is what separates this platform from a spreadsheet with nice fonts. It is also the compliance floor: an advisor who shows a client a number must be able to say where it came from.

#### Rule 5 — TOGGLED
**Real history is available, and it is the user's choice.**

The page offers the standard evidence toggles, every one **off by default**. Off means the engine's own documented assumption, clearly labelled as an assumption. On means a path built from the actual record. The toggle set: ZIP-level appreciation, pessimistic (10th-percentile) path, real dollars (inflation-adjusted), property tax from the local record, rate from a published benchmark.

*Passes when:* the shared `EvidencePanel` is present, defaults are off, and switching any toggle on changes the result and adds a ledger row.
*Why it matters:* this is the owner's explicit standing order — 36-year history, taxes and inflation optional on every calculator. Off-by-default matters too: it means turning a toggle on is a deliberate, explainable act, and the old behaviour is never silently changed.

#### Rule 6 — SIMULATED
**Long projections show their uncertainty.**

Any projection running five years or longer offers a 10,000-path block-bootstrap simulation, reporting the 10th, 50th and 90th percentile paths plus the worst rolling decade in the record.

*Passes when:* the page calls the shared `blockBootstrapPaths` implementation with a fixed seed (so results reproduce), and renders a percentile fan rather than a single line.
*Why it matters:* a single-line projection of a 30-year outcome is a lie of precision. The percentile fan is honest, and the worst-decade line is what actually protects a family.

#### Rule 7 — RULED
**Law and product terms live in tables, not in components.**

Every legal, tax or product constant — a statute, a bracket, a contribution limit, a product cap — reads from a rules table carrying a `RULES_VERSION` and a `neverPrinted` list. No such constant is hard-coded in a `.tsx` file.

*Passes when:* a repository scan finds zero statutory or product constants inside components, and every rules table exports its version.
*Why it matters:* tax law changes annually and product caps change quarterly. A constant buried in a component is a silent error waiting for the next legislative session. The divorce rules table now in the codebase is the reference implementation.

#### Rule 8 — LINKED
**No page is an island.**

At least two surfaces link into the page (a hub tab, a related-pages rail, or a genome strategy route), and the page publishes its result so at least one other page consumes it.

*Passes when:* the inbound-link count is ≥ 2 and the page calls `publishResult`, with a named consumer.
*Why it matters:* 104 of 115 pages currently have fewer than two inbound links. That is the arithmetic of getting lost in your own website.

#### Rule 9 — TESTED
**The math is guarded.**

The engine has a pure-function test. The page has a route and navigation test. Any regulated claim — an AG 49-A rate, "patent pending" language, NAIC-governed wording — has a compliance test that fails the build if the claim drifts.

*Passes when:* all three test classes exist and pass.
*Why it matters:* 4,076 tests are why this platform can be changed quickly without fear. Every untested engine is a place where that stops being true.

#### Rule 10 — MEASURED
**The page reports on itself.**

Views, completions, time-to-first-number, and abandonment are tracked per page, and the numbers appear on the integration scorecard.

*Passes when:* the page emits its events and appears in the scorecard with live figures.
*Why it matters:* without this, "which pages matter" is an opinion. With it, the next quarter's work sorts itself.

---

### How the score is computed

```
page_score = number of rules passed (0–10)
site_score = mean page_score across the catalogue
```

Six of these ten rules are already read from the code by `server/integrationAudit.ts`. Adding checks for Rules 4, 5, 6 and 10 makes the entire score automatic — no human judgement, no argument.

**Enforcement, staged:**
1. **Now:** the scorecard reports. Nothing fails the build.
2. **When site mean reaches 6:** any *new* page must ship at 8 or higher.
3. **When site mean reaches 8:** any page that regresses below 8 fails the build.

Staging matters. Turning the gate on today would fail 104 of 115 pages and stop all work.

---

### What the score means in practice

| Score | What it describes | Example |
|---|---|---|
| **0–3** | An orphan. Real math, no connections. The user must find it by accident and type everything. | Most of the 76 pages currently below 5 |
| **4–5** | Works in isolation. Catalogued, maybe tested, but flat assumptions and no provenance. | The Mortgage Killer *before* this session's work |
| **6–7** | Connected but not sourced. Pre-fills, links out, but still shows numbers it cannot defend. | Several hub pages today |
| **8–9** | Defensible. Sourced, toggled, simulated, linked, tested. Missing measurement or one connection. | The Mortgage Killer *now* — pending the four math fixes |
| **10** | Full organism member. Every figure traceable, every input inherited, every result consumed downstream, self-measuring. | None yet |

---

### The honest read on "4.3 to 10"

Going from 4.3 to 10 across 115 pages is roughly **six rules × 115 pages** of wiring work. That sounds enormous, and it would be if each page were done by hand.

It is not enormous, because **eight of the ten rules are satisfied by shared infrastructure, not per-page code**:

- Rule 3 (FED) is one context provider consumed everywhere.
- Rule 4 (SOURCED) and Rule 5 (TOGGLED) are one `EvidencePanel` component plus one `withEvidence()` server helper.
- Rule 6 (SIMULATED) is one already-written resampling function.
- Rule 7 (RULED) is a set of rules tables written once per legal domain.
- Rule 8 (LINKED) is largely generated from the catalogue and the genome.
- Rule 10 (MEASURED) is one analytics hook.

Build the shared pieces once, apply them, and most of the catalogue moves from 3 to 8 in a matter of weeks rather than a page at a time over a year. **That is the whole strategy: build the spine, then attach the pages to it.**

**Next file: 04 — PER-CATEGORY PAGE REQUIREMENTS.**

---

# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 04 — WHAT EACH TYPE OF PAGE MUST HAVE

Nine categories. For each: what is **necessary**, what to **add**, what to **connect**, what to **delete**, and what to **measure**. These are the category-specific requirements that sit on top of the ten universal rules in file 03.

---

### A. CALCULATORS
*Mortgage acceleration, IUL, annuities, tax, PSLF, divorce, long-term care, disability, estate.*

**Necessary**
- The math lives in a pure function in `shared/` — no arithmetic inside a React component.
- A zod input schema on the tRPC router validates every field at the boundary.
- An evidence ledger accompanies every result.
- The standard toggles, off by default.
- A 10,000-path simulation on anything projecting five years or more.
- Every legal, tax or product constant reads from a rules table.
- PDF export that prints the ledger on the final page — so a printed illustration is as defensible as the screen.

**Add**
- A "how this figure is made" link beside every output, opening the provenance page that already exists at `/portal/how-a-figure-is-made`.
- Scenario comparison — at minimum four presets run side by side.
- A worst-decade stress line on every chart, drawn from the actual worst rolling period in the record rather than an invented downside.
- A solve-for-input inversion: "what would have to be true for this to work?"

**Connect**
- Reads the fact finder for every input it shares with the household profile.
- Publishes its result to the strategy context so downstream pages consume it.
- Appears in the household genome so the profile routes users here.
- Callable by name from the AI council as a tool.

**Delete**
- Any product rate, statute, bracket or index return hard-coded in a `.tsx`.
- Any chart fed a literal array instead of computed data — the 688 audit found this pattern repeatedly and it is how a chart silently stops reflecting the inputs.
- Any `useMemo` with an empty dependency array feeding a chart: the data freezes while the inputs change.

**Measure**
Runs, exports, share of runs with at least one toggle enabled, share of runs where a data fallback fired (this is the direct measure of data coverage), and completion rate.

---

### B. SIMULATORS AND ENGINES
*LifeForge, Time Machine, Wealth Genome, Sequence Planner, Monte Carlo.*

**Necessary**
- Sourced historical series — FRED, FHFA, Shiller, HUD — with the coverage window displayed, not assumed.
- Seeded resampling so a result reproduces exactly.
- Percentile fans, never a single line.
- The full assumption sheet printed with the result.

**Add**
- The Shiller series from 1871 for long-horizon equity and CAPE work.
- ZIP-level paths as an option on every simulator, not just the mortgage engine.
- Inversion mode — solve for the input that produces a target outcome.
- A regime-awareness note: say which historical periods the resampled blocks came from.

**Connect**
- Every simulator consumes the same household state and the same evidence tables. One `evidence/` namespace, never per-page copies of a series.
- Simulator outputs feed the vision board and the legacy thread, so the cinematic layer shows real numbers.

**Delete**
- Any fixed 5%, 7% or 8% growth default that is not explicitly labelled a fallback.
- Total-return index tables used anywhere crediting is calculated. Index crediting uses price return. This distinction is currently wrong in `ibbotsonModel.ts` and it materially overstates results.

**Measure**
Paths generated, seed values, the p10–p90 spread, and **drift between simulators given identical household inputs** — which should be zero. Any drift is a bug, and measuring it is how you find it.

---

### C. HUBS AND WORKSPACES
*RECIN, Rental Enterprise, Mechanisms, Alt Credit, The Field.*

**Necessary**
- Tabs that embed child pages at their own URLs — the owner's explicit requirement: embed inside hubs while keeping the URL.
- One shared state across all tabs in the hub.
- A summary strip that updates live as any tab changes.

**Add**
- The 36-year ZIP evidence panel at the hub level, so every tab inherits the setting rather than each asking separately.
- A "what changed since your last visit" line.
- Cross-tab conflict detection: if two tabs assume different things about the same household, say so.

**Connect**
- The hub is the memory group for its children. Brain retrieval goes hub-first, then page.
- The genome routes to the hub; the hub routes to the right tab.

**Delete**
- Standalone routes that duplicate a hub tab. Keep the URL alive as a redirect into the tab — the owner was explicit that URLs must survive.

**Measure**
Tab depth per visit, cross-tab navigation rate, exit points.

---

### D. KNOWLEDGE, EDUCATION AND RULES PAGES
*Statutes, real-estate lending law sequencing, product mechanics, glossary.*

**Necessary**
- Every claim carries a citation link and an as-of date.
- A `RULES_VERSION` on every rules table.
- **The rules table the engines read is the same object the page renders.** One source of truth, displayed and consumed. Not a prose copy that drifts from the table.

**Add**
- A "used by" list on each rule — which calculators consume it. This makes the blast radius of a legal change visible before you make it.
- A diff view when a rule changes, so an advisor can see what moved.
- A staleness flag on any citation older than 90 days.

**Connect**
- Indexed for council retrieval, so the AI can cite the rule directly.
- Each calculator's evidence ledger links back to the specific rule row it used.

**Delete**
- Prose that restates a rule the table already holds — it will drift, and then the page and the engine disagree.
- Any claim with no citation.

**Measure**
Citation count, count of citations older than 90 days, and how often each rule is read by an engine.

---

### E. CLIENT PORTAL, FACT FINDER AND ONBOARDING
*The 200+ NLP calibration questions, Wealth Genome inputs, document upload.*

**Necessary**
- One household state object — the single source for every client input on the platform.
- Every question tagged with the engines it feeds, so its value is visible.
- Progress that rewards completion — the reinforcement loop the owner designed.

**Add**
- **ZIP, county FIPS, state, filing status, and a property list with bedroom and bathroom counts as first-class fields.** These gate the entire evidence layer: without a ZIP, no calculator can use 36 years of local history. This is the highest-leverage single addition on the list.
- Extend document extraction beyond mortgage statements to tax returns and policy statements — the extractor pattern already exists.
- Gap-aware questioning: the brain sees what is answered and asks only what is missing.

**Connect**
- Answering any question pre-fills every calculator that consumes it, immediately.
- The genome reads the answered set and routes the household to the pages that fit.

**Delete**
- Duplicated question sets across pages. One question, one home, many consumers.

**Measure**
Completion percentage, questions answered per session, drop-off point by question, and **fields consumed per engine** — a question no engine reads is a question to retire.

---

### F. AI BRAIN, COUNCIL AND MEMORY
*Composite mind, multi-model council, whisperer, memory bank.*

**Necessary**
- Every engine callable as a named tool with its zod schema.
- Every answer cites the page and the specific ledger row behind each number.
- One memory-bank group per hub.

**Add**
- "Run this for me" from chat: the calculator opens pre-filled with the result already computed.
- An audit trail recording which engine produced which number in a conversation.
- Explicit refusal to state a figure with no ledger row — the brain should say "I don't have a source for that" rather than generate one.

**Connect**
- OpenRouter for the multi-model council (requires the owner's authorisation).
- Perplexity for public-fact retrieval only — never for proprietary calculation.

**Delete**
- Any prompt text that hard-codes a number the engines compute. The model must read the engine, not remember a figure.

**Measure**
Tool-call success rate, citation rate, unanswered-question rate, and disagreement rate between council models.

---

### G. HOMEPAGE, MARKETING AND AUDIENCE PAGES
*`/for/:slug`, the concept designs, landing pages.*

**Necessary**
- One design system chosen as default — Patent360 or Concept 23, the owner's call.
- The brand guard passing (no purple; emerald and gold).
- Core Web Vitals green.
- Every call-to-action lands on a pre-filled calculator, not a lead form.

**Add**
- At least one live number on the homepage drawn from the evidence layer — this month's prime rate, or a named ZIP's 36-year appreciation rate — with its as-of date. It proves the site is alive rather than a brochure.
- Make the five concept designs selectable themes rather than static images.

**Connect**
- Audience page → its hub → its calculators, as one path.

**Delete**
- Any page marketing a feature that does not exist in the catalogue. Nothing erodes trust faster.

**Measure**
LCP, CLS and INP; and call-to-action → calculator completion rate.

---

### H. ADMIN, DATA AND STATUS PAGES
*Zip engine, rental status, site health, integration scorecard.*

**Necessary**
- Per series: coverage window, as-of date, last sweep time, row count.
- A "read the files now" button for a manual refresh.
- A staleness flag on anything older than 90 days.

**Add**
- The rental ledger and the ZIP ledger on one status page.
- A provider freshness sweep that re-checks every dated provider field and flags what has aged out.
- **A rolled-up fallback report:** every calculator's fallback reasons in one place, so the owner can see at a glance which sources are missing and what that is costing.

**Connect**
- Every engine's fallback reasons roll up here.

**Delete**
- Nothing. But keep it behind admin authentication.

**Measure**
Sweep success rate, rows loaded, latency, and series with zero coverage.

---

### I. CINEMATIC AND MEDIA PAGES
*Breathing UI, 90 BPM pulse, vision boards, voice, video, legacy thread.*

**Necessary**
- **The values shown are the household's real numbers from the engines, not decoration.** A vision board displaying an invented figure is worse than no vision board.
- Reduced-motion preference respected.

**Add**
- The legacy thread reads the multi-generational transfer engine's actual output.
- Vision-board imagery keyed to the genome profile.

**Connect**
- HeyGen and ElevenLabs keys (owner action); the motion kit is already in the BASE.

**Delete**
- Any media element not driven by data.

**Measure**
Session length, return visit rate.

---

### The rule that spans all nine categories

**If a page shows a number, that number is traceable. If a page collects a fact, no other page asks for it again. If a page produces a result, some other page consumes it.**

Everything else in this file is the specific application of those three sentences.

**Next file: 05 — ONE ORGANISM.**

---

# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 05 — ONE ORGANISM: WIRING RULES AND THE EVIDENCE TOGGLES

The owner's phrasing was exact: the pages must be *"interconnected, wired in, connected as one organism, connected to the AI brain, connected to everything, their values automatically populated into the calculators and the 10,000 simulation, and the toggle of different options of 36-year history of taxes and inflation — those are all optional on every calculator with toggle buttons."*

This file is that specification.

---

## Part A — The eight wiring rules

### 1. One household state
`ClientDataContext` is the **only** source of client inputs. No engine keeps its own copy of the household. No page caches a value it did not compute.

*Failure mode this prevents:* two pages showing different answers for the same family because each remembered a different version of their income.

### 2. One evidence namespace
Every engine reads sourced data through shared adapters — `zip_series`, `rental_series`, `market_data_points`, and the rules tables. **No page fetches an external source directly.**

*Failure mode this prevents:* fifteen pages each hitting FRED with slightly different parameters, producing fifteen slightly different inflation rates, none reproducible.

### 3. Publish and consume
Every result is published with its evidence ledger attached. The next page in the genome route consumes it and says so, visibly: *"Your Mortgage Killer result from 2:02pm is used here."*

*Failure mode this prevents:* the user re-entering the output of one calculator as the input to the next — which is both tedious and where transcription errors enter.

### 4. The genome routes everything
Currently 101 of 115 catalogued pages have **no** genome strategy routing to them. Every page either earns a genome route or gets embedded into a page that has one.

*Failure mode this prevents:* the owner's own complaint — *"I had 700 pages and I was getting lost in my own website."* If the profile cannot route a user to a page, no user will find it.

### 5. Hubs own memory groups
Brain retrieval is hierarchical: hub first, then page. A hub is the unit of context the AI loads.

*Failure mode this prevents:* the brain retrieving one leaf page and answering without the surrounding context that makes the answer correct.

### 6. Provenance is one click away
Any number on any page → "how this figure is made" → the engine, the inputs, the ledger row, the rule row.

*Failure mode this prevents:* an advisor in front of a client, asked "where does that come from," with no answer.

### 7. No page is a leaf
Minimum two inbound links, minimum one downstream consumer. A page failing this is either embedded into a hub or retired with a redirect.

### 8. The scorecard is the arbiter
The integration scorecard runs in continuous integration. Staged enforcement: report only today; new pages must ship at 8 once the site mean reaches 6; regressions below 8 fail the build once the site mean reaches 8.

---

## Part B — The universal evidence toggles

### The design principle

**Off by default. Off means the engine's documented assumption, clearly labelled as an assumption. On means a path built from the actual historical record, with every figure carrying its source.**

Off-by-default is not timidity. It means (a) existing behaviour never changes silently, (b) turning a toggle on is a deliberate act the advisor can explain to a client, and (c) a comparison between "flat assumption" and "actual history" becomes a single click — which is itself one of the most persuasive things this platform can show.

### The toggle set

| Toggle | Source | Real coverage | Method | When off, or data missing |
|---|---|---|---|---|
| **ZIP appreciation** | FHFA five-digit ZIP house price index; Zillow ZHVI | 1975→ (FHFA), 2000→ (Zillow) | Median of 10,000 five-year-block bootstrap paths, seeded | Engine's flat rate, labelled as an assumption |
| **Pessimistic path** | Same series | Same | 10th-percentile path instead of the median | Median path |
| **Real dollars** | CPI rent of primary residence (CUSR0000SEHA); M2 money stock (M2SL) shown alongside | 1947→ (CPI), 1959→ (M2) | Deflate nominal by CPI. **M2 is displayed beside it, never blended into it** | Nominal dollars |
| **Property tax** | Census ACS tables B25103 (taxes paid) ÷ B25077 (home value), by ZCTA | 2009→ | Effective rate, carried forward with observed drift | Not modelled — the current default |
| **Rate from benchmark** | FRED bank prime loan rate (DPRIME); Freddie Mac PMMS | 1955→ (prime), 1971→ (PMMS) | Benchmark plus a user-set margin | The page's rate slider |
| **Rent by bedroom** | HUD Small Area FMR (by ZIP) → Census ACS (by ZCTA) → HUD FMR (by county) | 2018→, 2009→, 1983→ | Finest geography that has a value wins; the source used is named | `null` with the reason |
| **Eviction context** | Eviction Lab county estimates | 2000–2018 | Filing rate, eviction rate, undercount flag | `null` with the reason |
| **Index crediting** | The trunk's price-return series | 1957→ | Price return, never total return | Product cap |
| **Tax and statute values** | Rules tables with `RULES_VERSION` | Varies | Table lookup | **Never guessed** — the calculation refuses |

### How it is built — once, not 115 times

Two shared pieces, already prototyped on the Mortgage Killer page:

**1. `EvidencePanel`** — a client component taking the toggle state, a ZIP and optional county, and rendering the switches plus the resulting source ledger. One implementation, imported everywhere.

**2. `withEvidence(engine, input, toggles)`** — a server helper that, for whichever toggles are on, builds the corresponding paths from the stored series, runs the pure engine, and returns `{ result, ledger, toggles, disclosure }`. The ledger marks each path **applied** or **fallback** with its source, as-of date, method, and — when it fell back — the reason.

The working version lives in `server/rentalRouter.ts` as `mortgageEvidence.withEvidence`. **Generalise it; do not copy it.**

### What the ledger looks like to a user

```
✓ applied   appreciationPath
            FHFA five-digit ZIP index · as of 2025-Q4
            Median of 10,000 five-year-block bootstrap paths, 1975–2025

✓ applied   propertyTaxRatePath
            Census ACS B25103 ÷ B25077, ZCTA 28429 · as of 2023
            Effective rate 1.09%, carried forward at +0.4 bp/yr

✗ fallback  inflationPath (CPI rent)
            Series not yet loaded for this geography
            → using the engine's flat 3.0% assumption

Projection, not prediction. Every path above names its source and
as-of date. A path marked fallback used the engine's flat assumption
and says why.
```

That block is the difference between a 4 and a 9. It is not decoration — it is the product.

---

## Part C — Auto-population, end to end

The owner's requirement that values populate automatically into the calculators and the simulation is a chain of four links:

**1. The household answers once.** Fact finder, document upload, or the NLP calibration sequence. ZIP, county, state, income, balances, property list with bedroom and bathroom counts.

**2. Every calculator inherits.** On mount, each page reads `ClientDataContext`. A field the household has already answered is filled and marked inherited — visibly, so the user knows the site remembers them.

**3. Geography unlocks history.** The ZIP makes the toggles usable. Without it the panel says so and stays inert. With it, every toggle can build a real path. *This is why adding ZIP to the fact finder is the highest-leverage single change on the roadmap.*

**4. Results cascade.** Each page publishes its result; downstream pages consume it and name the source. The 10,000-path simulation runs on the inherited household plus whichever evidence paths are switched on, and its percentile bands feed the vision board — so the cinematic layer shows the family's actual modelled outcomes rather than illustrative art.

**The test that proves the chain works:** enter a household once, then walk the entire genome route without typing a single value a second time, and have every figure along the way trace back to either a named source or a labelled assumption.

That walk is currently impossible. When it is possible, the site is a 10.

**Next file: 06 — BUILD ORDER AND DATA REGISTRY.**

---

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

---

