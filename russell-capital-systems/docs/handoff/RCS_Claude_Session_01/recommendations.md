# Roadmap to a 10 out of 10
## Russell Capital Systems — the unresolved work, how it integrates, and the criteria

Prepared 2026-09-18 for Perplexity Computer, from the Claude session that built the cycle engine, the mechanism dossiers, the sequence planner, the threshold registry, the memory bank and the integration scorecard. Repo: `samtheinsuranceman-debug/sam-russell-corpus`, folder `russell-capital-systems/`, branch `master`. Read `master_build_correlation.md` FIRST — it contains a finding that reorders this roadmap — then `reports/scorecard.md` and `provider_verification_brief.md`.

This document does three things. It says exactly where the previous builder got stuck and what it needed. It lists every unresolved task in build order with dependencies. And it states the criteria for "10 out of 10" on five dimensions as checks that can pass or fail — because a criterion that cannot fail is a slogan.

---

## 1. Where the system stands — numbers, not adjectives

| Fact | Value | Source |
|---|---|---|
| Catalogue pages | 115 | `shared/calculatorCatalog.ts` |
| Route patterns | 321 | `client/src/App.tsx`, asserted by two smoke tests |
| Test files / tests | 192 / 3,422 | `pnpm vitest run` |
| Memory-bank groups wired to the twelve channels | 29 | `shared/aiMemoryBank.ts` |
| tRPC routers that fetch external data sources | 12 | `server/integrationAudit.ts` → career, erosion, forgiveness, incomeLife, inheritance, ltc, outsideForces, rental, taxSchedule, unasked, zip, integration |
| **Mean page wiring** | **3.3 / 10** | `docs/INTEGRATION_SCORECARD.md` |
| Pages at 10 / below 5 | 0 / 76 | same |
| Pages no genome strategy routes to | 101 of 115 | same |
| Pages with no provenance trace | 112 of 115 | same |
| Pages with no live data | 104 of 115 | same |
| Pages fewer than two surfaces link to | 104 of 115 | same |
| **Deployed codebase** | `russell-capital-systems/` — 502 TS files, 125 engines, 201 test files | `find`/`ls` |
| **Orphaned codebase** | `russell-capital/` — 80 TS files, 20 engines, 11 tests, **no package.json, no router, nothing imports it** | `grep -rl "russell-capital/" russell-capital-systems/` returns nothing |
| Orphaned engine code | ~5,900 lines, finished and tested, executing nowhere | `master_build_correlation.md` |
| Built-but-unrouted in the deployed app | `timeMachine30.ts`, 666 lines + 287-line test | absent from App.tsx, catalogue and memory bank |
| Diverged duplicate modules | 4 (indexCreditingData, patentCatalog, patentStatus, policyLoanMechanics) | `comm -12` on the two shared/ folders |
| Patent claims drafted / filed | 57 / 0 | `shared/patentStatus.ts` — nothing may be called "patent pending" until a provisional is on file; a test enforces it |
| Lender directory records / with verified phone | 15 / 5 | `shared/altCredit/lenders.ts` |
| Named providers on the mechanism pages / with a verified record | 39 / 6 | `shared/mechanismDossiers.ts` |
| Legal plans for a thirty-property household at depth 4 / 5 | 9,387 / 79,035 | `shared/sequencePlanner.ts`, asserted by test |

The engines are strong. The wiring between them is the gap, and it is measured.

## 2. What the previous builder got stuck on, and what it needed

Each of these is a blocker, not a preference. Resolving them is the first phase.

1. **Provider facts from primary sources.** The 39 company names came from general knowledge. No rate, term, phone or eligibility could be published without a source and date. → `docs/PROVIDER_VERIFICATION_BRIEF.md` is the full instruction set with a JSON return schema. This is Perplexity's first job.
2. **Equity-share investment-property eligibility and subordinate-lien consent** at Point, Hometap, Unison, Unlock and Splitero could not be verified from their pages. The planner marks a rental equity share unavailable until a provider's own page says otherwise. This single fact changes the legal space for every portfolio owner.
3. **Kiavi and Griffin 90-day seasoning** is reported by market comparisons only (evidence 5). Confirm on the lenders' pages or leave it at "not verified".
4. **Railway variables the owner must set** — the builder cannot read or set them, and a request to read them was blocked by policy: `PERPLEXITY_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `HEYGEN_API_KEY`, `HEYGEN_VOICE_ID`, `MCP_API_KEY`, `USPTO_API_KEY`, `SESSION_SECRET`, `PARTNER_API_KEY`. Several features (voice, video, key probes) are dark until they exist. See `docs/API_KEYS_WHERE_TO_GET_THEM.md`.
5. **MCP servers needing the owner's authorisation**: OpenRouter, Speko, Stripe. Payments and the multi-model council cannot run without them.
6. **A provisional patent filing.** The code is ready: add one record to `APPLICATIONS` in `shared/patentStatus.ts` and every surface flips to true "patent pending" language. Until then the site correctly says 57 engines documented, none filed. This is a day's legal work and the cheapest honest route to the claim the owner wants to make.
7. **Client illustrations naming real people** (the Athene statement showing 57% and 20% in one crediting period) cannot enter the repository or be published. The claim can appear only as an anonymised, dated statement image with the carrier's product name, reviewed by compliance.
8. **Production verification from outside** — `erosion.powerStatus` and `inflationStatus` should be read from a public client after deploy to confirm the feeds answer. Not done this session.
9. **Master merges** need the owner's approval each time; the branch `claude/infinite-banking` always carries the latest.
10. **No account aggregation.** Every projection runs from typed inputs. This is the largest functional gap against JP Morgan and Edward Jones, and it is a product decision (Plaid / MX / Yodlee, custody, consent), not a coding one.

## 3. Unresolved tasks, in build order

Dependencies are stated. Do not reorder P0.

### P0a — recover the orphaned codebase (NEW, and ahead of everything else)

This did not appear in the previous roadmap because the finding is new. It is first
because the code already exists and is already tested: it is the cheapest capability
per hour available anywhere in the project. Full file-by-file table in
`master_build_correlation.md` §6; machine-readable in `data/master_build_inventory.csv`.

| # | Task | Why first | Done when |
|---|---|---|---|
| 0a.1 | Route, catalogue and brain-wire `timeMachine30.ts` | Finished engine, zero risk, ~1 hour, proves the pipeline end to end | `/portal/time-machine-30` live; its scorecard wiring ≥ 8 |
| 0a.2 | Create `shared/sourcing.ts` with `UnsourcedFindingError` + `assertSourced` | The other session's pattern is stronger than mine; everything built after this should stand on it | All twelve data routers route through it; a test asserts a source-less value throws |
| 0a.3 | Port `sequenceStress.ts` and wire it to `Plan` | It is upgrade branch 2 (adverse replay) already written | Every plan shows its break year under all four recorded shocks |
| 0a.4 | Port `realEstateMogul.ts`; replace the planner's internal amortisation | Makes every stage figure real rather than approximated by a 45% haircut | `Stage.after` carries a real schedule; planner tests still green |
| 0a.5 | Diff and resolve the four diverged duplicates | Must happen before more code depends on either copy | One copy of each; the loser deleted, not left to rot |
| 0a.6 | Reconcile `nextBestAction` with `genomeStrategyFit` (correlation §5, Option A) | Two ranking engines will disagree on the same page | One authoritative order; lens scores render as explanation |
| 0a.7 | Port `helocLenders`, `divorceStateRules`, `evidenceRetrieval`, `timeMachineCompliance` | Pure additions, no conflicts | Each routed, catalogued, tested, brain-wired |
| 0a.8 | Port `smallBusinessLending/*` as a new page group | Largest new surface; do it once the pattern is settled | Three pages live with full wiring |
| 0a.9 | Merge `nlpEngine` into `nlpBrain`; reconcile `aiCouncil` with `compositeMind` | Highest-risk merge; do it last with the pattern proven | One roster, one voice, tests green |
| 0a.10 | Delete `russell-capital/` or give it a README saying it is a staging folder and is not deployed | A folder that looks like an app and is not one is the root cause | Either gone, or labelled |

**0a.10 matters more than its position suggests.** Fixing the symptom without fixing the
cause means doing this again in a month.

### P0b — unblock the data
| # | Task | Depends on | Done when |
|---|---|---|---|
| 0.1 | Run the provider verification brief for all 39 (+ Roc Capital) | — | JSON returned per §8 of the brief |
| 0.2 | Ingest into `shared/altCredit/lenders.ts` as `Verified<T>` records; keep `notVerified` where the source was missing | 0.1 | `server/altCredit.test.ts` green; phone guard passes |
| 0.3 | Point every dossier provider's `registryId` at its record | 0.2 | `server/mechanismDossiers.test.ts` green |
| 0.4 | Raise threshold-variant evidence scores to the source found; add variants discovered (0-seasoning, 30-year HEI at other providers, non-direct recognition series) | 0.1 | `server/sequencePlanner.test.ts` green |
| 0.5 | Stage-level provider naming in the planner: each stage cites the lender whose threshold set its numbers, with cost band from that lender's dated sheet | 0.4 | planner stage `via` carries a registry id |
| 0.6 | 90-day freshness sweep: a scheduled job re-checks every dated provider field and flags anything older than 90 days on the page | 0.2 | flag renders; test asserts a stale fixture flags |

### P1 — close the scorecard gaps systematically
| # | Task | Depends on | Done when |
|---|---|---|---|
| 1.1 | **Genome routing**: add `relatedPaths` in `shared/genomeStrategies.ts` so every one of the 52 rated pages is reachable from at least one strategy; then the remaining 63 | — | `genome` gap ≤ 20 on the scorecard |
| 1.2 | **Provenance**: a `FigureTrace` in `shared/provenance.ts` for every featured page's headline figure (31), then the rest of the rated 52 | — | `provenance` gap ≤ 60 |
| 1.3 | **Brain**: every catalogue engine in a memory-bank group; new groups where none fits (estate planning, social security, withdrawal sequencing, oil & gas) | — | `brain` gap ≤ 20; `unwiredGroups()` empty |
| 1.4 | **Tests**: `mortgageKiller.ts` (highest-traffic untested engine), `householdWealth.ts`, `estateTaxEngine.ts`, `mygaWaterfall.ts`, `carrierRatings.ts`, `monteCarloEngine.ts`, `ibbotsonModel.ts`, `retirementDNA.ts` | — | each has a test reproducing a page figure |
| 1.5 | **Page imports**: 77 pages carry their arithmetic inline. Move each page's calculation into a named shared engine and import it; `taxBracketEngine` as a formatter does not count | 1.4 | `pageImports` gap ≤ 30 |
| 1.6 | **Cross-links**: every rated page linked from at least two related surfaces — dossier footers, planner stages, strategy cards | — | `crossLinked` gap ≤ 40 |
| 1.7 | **Live data**: pages that show a rate, a limit or a price call a router that fetches it with an as-of date; static pages say so on the page | 0.6 | `liveData` gap ≤ 60 |
| 1.8 | **Sphere**: place the 77 unplaced pages | — | `sphere` gap 0 |

### P1 — the universal object
| # | Task | Depends on | Done when |
|---|---|---|---|
| 1.9 | Make `Situation` (from `shared/sequencePlanner.ts`) the one object every engine reads: extend it with genome factor readings, household pairing weights, tax-return figures, and account balances; the fact finder emits it; the genome fills it; strategy fit reads it; the planner plans from it; provenance traces it | 1.1 | fact finder → planner works end to end with no re-typing |
| 1.10 | Strategy fit → planner handoff: each fit strategy opens a pre-filled planner situation; each planner archetype names the genome factors that gate it | 1.9 | link both ways, tested |
| 1.11 | Household genome → planner: primary-residence moves show the veto weight and require the recorded consent | 1.9 | refusal reason cites consent when absent |

### P1 — the ten upgrade branches (offered earlier, none chosen yet)
1. Sequence-of-settlements ladder — every balloon in a plan on one timeline with the cover for each date.
2. Adverse-scenario replay — run every plan through 2000–02, 2007–09, 2018 Q4 and 2022 from `shared/historicalShocks.ts` and show the break year under each.
3. Break-even inversion — for each stage, the input value at which it stops paying (the 1.34 uplift is the first of these).
4. Covenant registry — every contract term the planner enforces, with its source, in one file the thresholds page reads.
5. Liquidity waterfall — which pool pays which obligation, in order, when the surplus stops.
6. Execution checklists — per stage, the documents, parties and dates in the order they happen.
7. Drift scheduler — re-run every saved plan monthly against live data and flag drift.
8. Two-sided decision log — what the household chose, what the planner ranked first, and why they differ.
9. Counterparty concentration — payers, lenders, providers per plan, flagged above a share.
10. Fee-stack decomposition — every stage's fees itemised beside its cost of capital.

Build 2, 1, 3 first: they are the risk-mitigation criteria in §5 made concrete.

### P2 — outstanding from earlier sessions
- Nine lender records still thin: lendmire, arch, salt, unchained, coinbase-borrow, youhodler, cdfi-fund, sba; plus Roc Capital new (0.1 covers them).
- Homepage rework for the new engines (task #27): no visitor figures, no patent-pending language until filed.
- AQAL service on Railway (task #31): owner pastes keys.
- Production feed verification (§2.8).

### P3 — the product decisions
- Account aggregation (Plaid/MX) behind explicit consent; the fact finder pre-fills from it.
- Advisor CRM depth (HubSpot exists; two-way sync of plans and traces).
- Mobile: PWA first, native later.
- E-signature on consent and mandates (Jotform Sign is connected).

## 4. How it all integrates — the architecture the previous builder converged on

Seven principles. Every unresolved task above serves one of them.

1. **One object.** `Situation` is the household. Every engine takes it or a projection of it. Nothing is re-typed between pages. (Tasks 1.9–1.11.)
2. **Every figure carries its proof.** `Verified<T>` for facts (value, source, as-of, or why not); `FigureTrace` for computed figures (inputs → sourced → rule → arithmetic → assumption). A number without one does not render. (Tasks 0.2, 1.2.)
3. **Registries, verified by tests.** The catalogue is checked against the router; the memory bank against disk; the dossiers against the lender directory; the archetypes against the planner's legality. Adding a page means adding a row, and forgetting a wire fails the build instead of a client. (Task 1.3 and the scorecard itself.)
4. **The memory bank is the brain's index.** A page whose engine is in no group is invisible to the twelve channels; they can name it but not use it. Priority 1 is never trimmed. (Task 1.3.)
5. **Legality per asset, refusals with reasons.** Covenants bind the property they are on. A plan routes around one by acting on another asset. Every refusal names the clause. (Planner; task 4 of the branches.)
6. **Data on sweeps with dates.** FRED, FHFA, BLS, Zillow, FEMA, the power feeds — fetched on a schedule, stored with as-of, shown with the date, flagged when stale. (Tasks 0.6, 1.7.)
7. **Two numbers, never one.** Value and frequency. Confidence and likelihood. Share and likelihood. Wiring and worth. Every place marketing would collapse two facts into one, the system keeps them apart and a test asserts they differ.

Data flow, end to end:

```
Fact finder (typed, later aggregated)
   → Situation
   → Wealth Genome (factors, durability) → Household Genome (pairing, consent, veto)
   → Strategy Fit (signals, gates; silence ≠ evidence) → ranked strategies
   → Sequence Planner (moves, per-asset legality, thresholds, providers) → staged plans
   → Provenance (every stage figure traced) → Memory bank (every engine indexed)
   → Twelve channels (answer only with a source; name the page by its real path)
   → Advisor brief / client PDF / CRM
```

## 5. The criteria for 10 out of 10 — five dimensions, each checkable

A criterion is listed only if a test, a scorecard dimension or an outside read can fail it.

### 5.1 User experience
- First visit to first personalised figure in under five minutes, with no field asked twice (Situation).
- Every figure on every page is clickable to its trace (provenance gap → 0 on rated pages).
- Every recommendation states the condition under which it applies (pageRatings `conditions`, planner `shinesWhen`).
- Every page reads at grade 9 or below; every term of art has a one-line definition on first use.
- No dead link (catalogue test), no unsourced figure (Verified guard), no phone number not from the company's own site (phone guard), no "patent pending" until filed (patent guard).
- Phone width parity on every page (build-time screenshot harness on the 52 rated pages).
- The site says the true number even when the true number disappoints: the break year, the sell-eleven-to-clear-72% answer, the 3.3 mean wiring. A test asserts the simulator never uses the word "infinite".

### 5.2 Advisor experience
- One-page client brief generated from a Situation, with every figure traced and every disclosure attached (consent, mandates, disclaimers from `shared/compliance`).
- "What to ask next" (`shared/unaskedQuestions.ts`) on every page with a gap in the Situation.
- Every strategy card names the pages, the engine, the providers and the thresholds behind it.
- CRM two-way: plans and traces to HubSpot; meeting prep from the plan; decision log (branch 8).
- Audit trail of every figure shown to every client, with its as-of date (freshness sweep).
- The channels answer in the advisor's calibrated language (`shared/nlpBrain.ts`) and never invent a page.

### 5.3 Prediction engines
- Every projection carries its sample size and its conditional base rate, in the erosion pattern: P(rate higher after N years | who held power), with n.
- Every indexed-product claim is backtested through the Time Machine on the sourced series (`sp500SeriesAudit`), not on a brochure.
- The power layer is live: control per lever with as-of, market odds of a shift, week-by-week snapshots (`power_snapshots`), verified from outside after every deploy.
- Monte Carlo draws from sourced distributions (`ibbotsonModel`, `monteCarloEngine` — both currently untested; task 1.4).
- A calibration log: predictions recorded with a date, compared to what happened, published as a page. The zip engine's appreciation windows are the first candidate.
- Inflation is shown as history with the caveat, never as a forecast dressed as a finding.

### 5.4 Risk mitigation
- Per-asset covenant legality with a named clause on every refusal (built).
- Balloon count on every plan; the settlement ladder (branch 1) on one timeline with cover per date.
- Adverse-scenario replay (branch 2): every plan's break year under 2000–02, 2007–09, 2018 and 2022.
- Break-even inversion (branch 3): the input value at which each stage stops paying.
- Reserve floor enforced; a plan ending below zero is scored out (built).
- Lapse detector on policy loans: the year the loan line meets the cash-value line, shown before the loan.
- Due-on-sale exposure clock on every wrap: months of exposure, and the refinance that ends it.
- Counterparty concentration (branch 9) above a share flagged.
- Freshness flags on every dated field (task 0.6).

### 5.5 The right strategies to the right people, in the right frameworks
- Genome → strategy fit with signals and gates, where an unanswered factor lowers confidence rather than raising a score (silence ≠ evidence — built).
- External gates that no genome reading can settle (insurability, documentation, provider eligibility) are shown as BLOCKED with the reason (task 0.2 supplies provider eligibility).
- Household pairing with recorded consent and per-asset veto weight before any joint recommendation (built; task 1.11 wires it into the planner).
- Every strategy and every plan carries a likelihood score — how many ordinary households are in that position — so a rare plan is never presented as a common one.
- The five mechanisms are ranked for the household by the genome, not presented as a menu (task 1.10).
- The frequency rating is honoured in navigation: the most broadly applicable page leads, the most impressive one does not.

## 6. The comparison, stated fairly

What JP Morgan Wealth Plan, Edward Jones and Money Pro have that this site does not: custody and account aggregation; a human advisor network; a licensed compliance infrastructure; native mobile apps; brand trust measured in decades. Being "better than" them on that ground requires §3 P3 and a regulated entity — a product and legal decision, not code.

What this site has that none of them publish: a sequence planner that enforces contract covenants per property and counts the legal plans; provenance traces on figures; tax odds conditioned on who holds power, with sample sizes; a genome that pairs two spouses with consent and veto weights; an alternative-credit registry with verified sources; a cycle engine whose headline is the year the cycle breaks; and 57 drafted mechanisms with applications written. On that ground the site is already ahead, and the roadmap above is what makes the lead visible on every page instead of on the best twelve.

## 7. Definition of done

The site is a ten when all of the following are true and the tests that check them are green:

1. Scorecard mean wiring ≥ 8.0; no rated page below 7; `genome`, `provenance`, `brain` gaps at zero on the rated 52.
2. All 39 providers hold `Verified<T>` records with dated sources; freshness sweep live.
3. `Situation` flows from fact finder to planner to brief with no re-typing.
4. Branches 1, 2, 3 (settlement ladder, adverse replay, break-even inversion) on every plan.
5. Power layer verified from outside after the latest deploy.
6. Every featured page has a FigureTrace; every engine has a test.
7. A provisional is filed, and the site's patent language is true.
8. The owner's Railway variables are set and the key probes pass.
9. `russell-capital/` is either merged into the deployed app or labelled as staging; no engine in the repository is unreachable from a route, and a test asserts it.
10. `UnsourcedFindingError` is the house pattern: no client-visible figure can be produced without a source and an as-of date.

Everything in this document is checkable against the repository. Where it is not yet true, the scorecard says so by number.
