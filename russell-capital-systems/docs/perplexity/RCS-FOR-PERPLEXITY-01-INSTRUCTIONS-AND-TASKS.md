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
