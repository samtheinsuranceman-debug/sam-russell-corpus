# RUSSELL CAPITAL SYSTEMS — MASTER HANDOFF, 2026-09-18

Prepared from Claude session `session_01GDyUsq4kDze9T1KGzUv8Vb` for Samuel A. and for Perplexity / any brother AI that continues the work. This file is inside every zip set so it can never be separated from the code.

Repos and branches (GitHub, `samtheinsuranceman-debug`):

| What | Repo / path | Branch | Head |
|---|---|---|---|
| **BASE reference build** (production trunk + every harvest) | `sam-russell-corpus` → `russell-capital-systems/` | `claude/base-consolidation` | `9a9f8e6` |
| Production (Railway → www.russellcapitalsystems.com) | same folder | `master` | `ec3d057` — **never push here without the owner** |
| 688-page build (audited, mined, not the base) | `russell-capital` | `claude/homepage-portrait-day-sign-5o0l9d` | `4db531b` |
| Engine kit (pure engines, no UI) | `sam-russell-corpus` → `russell-capital/` | `master` | — |
| Doctor-buddy site | `sam-russell-corpus` → `doctor-buddy/` | `master` | — |
| Patent360 design system | `sam-russell-corpus` → `Patent360/` | `master` | — |

BASE gate at head: `pnpm check` 0 errors; `pnpm test` 213 files / 4,076 tests green. Routes 330. Catalogue 115+. Memory-bank groups 29.

---

## 1. The instructions you gave (in order, this session)

1. Which build is the largest/most complex, where is it served, three domains or one, how to merge. → Trunk `russell-capital-systems` is live on Railway; keep three domains, one canonical; apex→GitHub Pages route was broken.
2. Full 688-page audit: rank every page 1–10 with reason; <8 say how to reach 9/10; <5 say enhance or embed as a tab; embed pages inside hubs keeping URLs; link everything to the AI brain + memory bank; explain proven functionality; rarity; 20 improvements; team of AIs; how much better the site would be.
3. Upgrade spec: start with the 688 build, full audit, add API connectors, research web links, **36 years of source references**, predictive modelling on historical trends, adjust up to 80% of content, embed inside the most important tabs. Scan ALL builds first, find the most comprehensive, harvest the best features (including the colours/textures UI you built and could not find), then audit the 688 against that.
4. Wait for merges to complete; **confirm merges on GitHub before acting**; look at the photos; stop musing / searching / Excel.
5. "Go!" on Fable 5.1 — re-baseline against the merged trunk.
6. Mark the most comprehensive build as **BASE**; copy/extract every specialised feature (utilities, toggles, mechanics, API connections, database libraries, functional pages, real-estate lending law sequencing, crypto build/library) from the incomplete builds into BASE before auditing the 688.
7. Put the **actual 36-year history by ZIP** into the Mortgage Killer engine: appreciation, inflation from money printing (optional toggle), property taxes, rents year-over-year by bedroom/bath configuration for every ZIP, security deposits, tenant length of stay, evictions count/percentage, share of owners suing tenants. Bring Perplexity if needed.
8. Usage / plan pricing to keep moving at this rate.
9. Ten uploaded zips: add anything not already in any RCS repo to BASE immediately.
10. Explain the 4/10 failures; wire every engine to its rules table; API in 36 years where a source exists; "build it in now, make it all work".
11. **This request:** everything in ≤5 MB zips (all builds), this handoff, and the complete chat history.

Standing constraints honoured: never push `master`; no PRs unless asked; secrets never in `shared/`; no proprietary code to external AIs; commit trailer with session link; no model IDs in code.

---

## 2. Tasks — completed, outstanding, priority

### Completed (pushed)
| # | Task | Evidence |
|---|---|---|
| 1–5 | Master build identified; 688 pages inventoried, scored, ranked; capability inventory, rarity, 20 improvements; embedding + AI-brain wiring design | `docs/audit/MASTER_BUILD_AND_STRATEGY.md`, `PAGE_AUDIT_688.md/.csv`, `PAGE_UPGRADE_SPEC.md`, `pageRegistry.json` (both repos) |
| 6 | BASE established, toolchain green | branch `claude/base-consolidation` |
| 7 | Engine kit harvested (policyLoanRules port, liveResearch shim) | `a12853e` |
| 8 | RECIN + orchestrator + cinematic layer harvested | `199b231`, `412cf84` |
| 9 | Patent360 design system (opt-in), AQAL research gate, motion kit, doctor-buddy routers, council/nlpEngine/evidenceRetrieval | `63cc15d`, `ec5c8b1` |
| 10 | Audit pipeline ported and re-pointed at the trunk (`RCS_ROOT`, `RCS_COMPARE_ROOT`) | `scripts/audit/*.py` |
| 11 | 688 audited against BASE; owner's 687-row plan reconciled (buckets A/B/C/D) | `docs/audit/PLAN_RECONCILIATION.md/.csv` |
| 12 | Divorce engine wired to the state rules table (`statutory`, `basis`, `rulesVersion`, `neverPrinted`); 4 skipped tests now pass | `9c27947` |
| 14 | Rental-market evidence layer: `rental_series` table; HUD FMR (1983→), SAFMR by ZIP (2018→), Census ACS by ZCTA (2009→), Eviction Lab county (2000–2018), FRED M2/WALCL/CPI-rent; `rentalMarketEngine`; routers `rentalMarket.*` + `mortgageEvidence.withEvidence`; boot schedule `RENTAL_DATA_DAYS`; **Mortgage Killer toggle panel + evidence ledger** | `2787be6`, `73cca24` |
| 15 | Ten zips harvested: 30 sister-invention engines (SI-001–035), 8 pages, routers, patent notes, 5 concept PNGs | `2787be6` |
| — | Master's scorecard + roadmap merged into BASE | `9a9f8e6` |

### Outstanding, in priority order
| Pri | # | Task | Why it matters |
|---|---|---|---|
| **P0** | 16 | Fix the four flagship math defects: `mortgageKiller.ts:686` interest-savings double-count; dead `loanDragCost`; COI inversion `:237`; AG 49-A 7.5% (`mortgageKiller.ts:14`) vs product cap 6.35% (`pacificHorizonEcv.ts:88`); `ibbotsonModel.ts:107-108` total-return table where price-return is required (2008 −0.37 vs −38.3%) | These are the reasons the flagship is not a 9. A wrong number on the most-visited calculator outweighs every cosmetic fix |
| **P0** | — | Roll the evidence toggles out to every calculator (see §5.4) — Mortgage Killer is the only one wired | The user's standing order: 36-year history, inflation, taxes optional on **every** calculator |
| P1 | 17 | AHS tenant-tenure adapter (Census AHS "year moved in", biennial 1985→); sourced 50-state security-deposit rules table with statute citations, `RULES_VERSION`, `neverPrinted` | Two of the requested rental facts have no adapter yet |
| P1 | 13 | Re-derive 2 `timeMachineCompliance` expectations from the trunk's sourced index series; Shiller adapter (1871→ CAPE, dividends) | Time Machine shows a 688-era defective series in its test fixture |
| P1 | — | Owner decisions: gate password (`Welcome1@1`) — trunk is OAuth-only; merge `claude/base-consolidation` → `master` | Only the owner can decide these |
| P2 | — | Authorise MCP servers OpenRouter, Speko, Stripe; set Railway vars `PERPLEXITY_API_KEY`, `ELEVENLABS_API_KEY/VOICE_ID`, `HEYGEN_API_KEY/VOICE_ID`, `MCP_API_KEY`, `USPTO_API_KEY`, `SESSION_SECRET`, `PARTNER_API_KEY`, `CENSUS_API_KEY`, `RENTAL_DATA_DAYS=30`, `ZIP_DATA_DAYS=30` | Council, payments, voice, video, the data sweeps are dark until these exist |
| P2 | — | Bucket A (43 pages the owner rated ≥8 that have a blocking defect) and Bucket B (138 pages) from `PLAN_RECONCILIATION.csv` — enhance or embed per the spec | The 688 mining, page by page |
| P3 | — | Provider verification brief (39 providers + Roc Capital) per master's `docs/PROVIDER_VERIFICATION_BRIEF.md` | Nothing may print a rate, phone or term without a dated source |

---

## 3. Where I had trouble, and what finishing needs

| Area | What happened | What is needed to finish |
|---|---|---|
| **Sandbox egress** | huduser.gov, api.census.gov, fred.stlouisfed.org returned 000 from the sandbox; Eviction Lab S3 worked | The adapters are written and unit-tested on real file layouts; the first real sweep must run on Railway (`RENTAL_DATA_DAYS=30`) or locally. Confirm with `rentalMarket.status` after deploy |
| **Perplexity tools** | `perplexity_research` timed out at 60 s twice | Use `perplexity_ask`/`perplexity_search` in smaller questions, or run the brief in Perplexity Computer with the JSON schema in `docs/PROVIDER_VERIFICATION_BRIEF.md` |
| **Bathroom-count rents** | No public agency has ever collected rent by bathroom count | Cannot be finished from public data. Options: (a) keep `null + reason` (current, honest); (b) license Zillow/CoStar/Apartments.com listing data; (c) an owner-curated table with source per row |
| **Security deposits, 36 years** | No time series exists; deposits are statute (caps, interest, return deadline) | Build the 50-state rules table with a statute citation per row, verified against the primary statute (not memory). Task 17 |
| **Tenant tenure** | AHS tables exist but the adapter is not written | Task 17; AHS national/metro tables, biennial |
| **`set -e` + python heredocs** | Two early commits claimed work that had not landed | Fixed forward; every later commit was gated by explicit output checks, `pnpm check`, `pnpm test` |
| **Trunk invariants** | Adding a route breaks 3 tests unless nav entry, smoke counts (now 330) and `rcs-schema.sql` are updated | Rule for any builder: after adding a route run `pnpm test -- navigation-organization managed-port grok-merge databaseSchemaFile` |
| **Brand guard** | Any `violet-`/`purple-`/`#a78bfa`/`#8b5cf6`/`#7c3aed` in `client/src` fails `concept16Homepage.test.ts` | Use emerald/gold; the guard is deliberate |
| **AG 49-A conflict** | Two different "max illustrated rate" constants | Product-specific max from the carrier's illustration actuary; store per product in `pacificHorizonEcv.ts`-style tables; the engine reads the product's cap, never a global 7.5% |
| **Gate password** | The 688 build gated with `Welcome1@1`; trunk is OAuth-only | Owner decision. If wanted, implement as an env-var passphrase, never a literal in the repo |
| **The colours/textures UI you could not find** | Found: Patent360 design system + the 5 homepage concepts (`client/public/concepts/`) + the cinematic layer (`412cf84`) | All in BASE, opt-in; choose one as default and I apply it |

---

## 4. Recommendations — 4.3 → 10 out of 10

Master's own scorecard measures mean page wiring at 3.3/10; my audit of the 688 build averaged 4.3 (utility-weighted). Same diagnosis from two directions: **the engines are strong, the wiring between them is the gap.** A 10 is not a prettier page; it is a page that cannot show a number without its source, cannot be reached without the brain knowing it exists, and cannot be left without feeding the next page.

### 4.1 The universal page contract — every page, no exceptions (10 rules, 1 point each)

| # | Rule | Passes when |
|---|---|---|
| 1 | **Registered** | The route is in `calculatorCatalog.ts` (or `SECONDARY_CATALOG`) with category, one-line purpose, inputs, outputs, and a `memoryGroup` |
| 2 | **Brained** | The page's engine is a module in `aiMemoryBank.ts`; `unwiredGroups()` stays 0; the composite mind can cite it by name |
| 3 | **Fed** | Every input the household already answered is pre-filled from `ClientDataContext` / fact finder — no field asked twice on the site |
| 4 | **Sourced** | Every figure carries `{source, asOf, window, method}` — the evidence-ledger pattern; a figure with no source renders as `null + reason`, never a guess |
| 5 | **Toggled** | Evidence toggles present and off by default: ZIP history, inflation/real dollars, property tax, rate-from-benchmark, pessimistic path (§4.4) |
| 6 | **Simulated** | Any projection ≥5 years offers the 10,000-path block-bootstrap with p10/p50/p90 and worst rolling decade — same seed, same code (`rentalMarketEngine.blockBootstrapPaths`) |
| 7 | **Ruled** | Any legal/tax/product constant reads from a rules table with `RULES_VERSION` and `neverPrinted` (divorceStateRules pattern) — no statute, cap or bracket lives in a component |
| 8 | **Linked** | ≥2 surfaces link in (hub tab, related-pages rail, genome strategy route) and the page publishes its result via `useStrategy().publishResult` so ≥1 page consumes it |
| 9 | **Tested** | Engine has a pure-function test; page has a route/nav test; a compliance test guards any regulated claim (AG 49-A, "patent pending", NAIC language) |
| 10 | **Measured** | Views, completions, time-to-first-number and abandonment tracked per page; the number appears on the Integration Scorecard |

Score = rules passed. A 10 passes all ten. The scorecard (`server/integrationAudit.ts`) already reads six of these from code; add rules 4, 5, 6, 10 as checks and the score becomes automatic.

### 4.2 What each page category must have (necessary, added, connected, deleted, measured)

**A. Calculators (mortgage, IUL, annuity, tax, PSLF, divorce, LTC…)**
- Necessary: pure engine in `shared/`, zod input schema on the router, evidence ledger, toggles, 10k sim on anything ≥5 yr, rules table for every constant, PDF export with the ledger printed on the last page.
- Add: "How this figure is made" link per output (provenance page exists — `/portal/how-a-figure-is-made`); scenario compare (4 presets minimum); worst-decade stress line on every chart.
- Connect: reads fact finder; publishes to Strategy; appears in the household genome; council can run it by name.
- Delete: any constant that is a product rate, a statute, or an index return hard-coded in a `.tsx`.
- Measure: runs, exports, share of runs with ≥1 toggle on, share where a fallback fired.

**B. Simulators / engines (LifeForge, Time Machine, Wealth Genome, Sequence Planner)**
- Necessary: sourced series (FRED, FHFA, Shiller, HUD) with the window shown; seeded resampling; percentile fans; the assumption sheet printed with the result.
- Add: Shiller 1871→ adapter; ZIP-level paths as an option on every simulator; "what would have to be true" inversion (solve for the input).
- Connect: every simulator consumes the same household state and the same evidence tables — one `evidence/` namespace, never per-page copies.
- Delete: any fixed 5%/7%/8% growth default that is not a fallback labelled as such.
- Measure: paths generated, seeds, p10/p50/p90 spread; drift between simulators on the same household (should be zero for the same inputs).

**C. Hubs / workspaces (RECIN, Rental Enterprise, Mechanisms, Alt Credit, Field)**
- Necessary: tabs that embed the child pages at their own URLs (`/portal/hub/:slug`); one shared state across tabs; a summary strip that updates as any tab changes.
- Add: the 36-year ZIP panel at the hub level so every tab inherits it; a "what changed since last visit" line.
- Connect: hub is the memory group for its children; the genome routes to the hub, the hub routes to the tab.
- Delete: standalone duplicates of a tab that exist as separate routes (keep the URL, redirect to the tab).
- Measure: tab depth per visit, cross-tab navigation, exits.

**D. Knowledge / education / rules pages (statutes, sequencing of lending law, product mechanics, glossary)**
- Necessary: every claim cited with a link and an as-of date; a `RULES_VERSION`; the rules table that the engines read is the *same* object the page renders (single source).
- Add: "used by" list — which calculators consume this rule; diff view when a rule changes.
- Connect: council retrieval index (`evidenceRetrieval`) includes the page; the calculator's ledger links back to the rule row.
- Delete: prose that restates a rule the table already holds; anything without a citation.
- Measure: citations count, stale (>90 days) citations, rule reads by engines.

**E. Client portal / fact finder / onboarding (200+ NLP questions, Wealth Genome inputs)**
- Necessary: one household state object; every question tagged with the engines it feeds; progress that rewards completion (the dopamine loop you specified).
- Add: ZIP, county FIPS, state, filing status, property list with bed/bath as first-class fields (they gate the evidence layer); import from statements (the mortgage extractor exists — extend to tax returns, policy statements).
- Connect: answering a question pre-fills every calculator that uses it; the brain sees the answered set and asks only the gaps.
- Delete: duplicated question sets across pages.
- Measure: completion %, questions answered per session, fields consumed per engine.

**F. AI brain / council / memory (composite mind, council, whisperer, memory bank)**
- Necessary: every engine callable as a tool by name with its zod schema; every answer cites the page and the ledger row; the memory bank group per hub.
- Add: "run this for me" from chat → the calculator page opens pre-filled with the result; an audit trail of which engine produced which number in a conversation.
- Connect: OpenRouter for the multi-model council (needs authorisation); Perplexity for public-fact retrieval only.
- Delete: prompt text that hard-codes numbers the engines compute.
- Measure: tool-call success rate, citation rate, unanswered-question rate.

**G. Homepage / marketing / audience pages (`/for/:slug`, concepts)**
- Necessary: one design system as default (Patent360 or Concept 23 — owner choice); the brand guard; Core Web Vitals green; every CTA lands on a pre-filled calculator, not a form.
- Add: one live number on the homepage from the evidence layer (e.g. this month's prime, this ZIP's 36-year CAGR) to prove the site is alive.
- Connect: audience page → its hub → its calculators; the concepts folder becomes selectable themes.
- Delete: any page that markets a feature that does not exist in the catalogue.
- Measure: LCP/CLS/INP, CTA → calculator completion.

**H. Admin / data / status pages (zip engine, rental status, site health, integration scorecard)**
- Necessary: per-series window, as-of, last sweep, rows loaded; a "read the files now" button; a stale flag (>90 days).
- Add: the rental ledger and ZIP ledger on one status page; provider freshness sweep (master roadmap P0.6).
- Connect: every calculator's fallback reasons roll up here so the owner sees which sources are missing.
- Delete: nothing — but hide behind admin.
- Measure: sweep success, rows, latency, series with zero coverage.

**I. Cinematic / media / vision-board pages (breathing UI, 90 BPM, vision boards, voice, video)**
- Necessary: the values shown are the household's real numbers from the engines, not decoration; reduced-motion respected.
- Add: the Legacy Thread reads the multi-gen transfer engine output; vision board images keyed to the genome.
- Connect: HeyGen / ElevenLabs keys; the motion kit already in BASE.
- Delete: media that is not driven by data.
- Measure: session length, return visits.

### 4.3 One organism — the interconnection rules

1. **One household state.** `ClientDataContext` is the only source of client inputs. Engines never keep their own copy.
2. **One evidence namespace.** `zip_series`, `rental_series`, `market_data_points`, rules tables — every engine reads through the same adapters; no page fetches a source itself.
3. **Publish/consume.** Every result is published (`useStrategy().publishResult`) with its ledger; the next page in the genome route consumes it and says so ("Your Mortgage Killer result from 14:02 is used here").
4. **Genome routes everything.** 101 of 115 catalogue pages have no genome strategy routing to them — every page gets a route or is embedded into one that does.
5. **Hubs own memory groups.** Brain retrieval is by hub, then by page.
6. **Provenance is a right-click away.** Any number → "How this figure is made" → engine, inputs, ledger row, rule row.
7. **No page is a leaf.** Minimum two inbound links, one outbound consumer.
8. **The scorecard is the truth.** The integration scorecard runs in CI; a page that regresses below 8 fails the build once the site reaches 8 overall.

### 4.4 The universal evidence toggles (every calculator, off by default)

| Toggle | Source | Window | Fallback when off/missing |
|---|---|---|---|
| ZIP appreciation | FHFA ZIP5 + Zillow ZHVI | 1975→ | engine flat rate, labelled |
| Pessimistic (p10) | same, 10,000 block-bootstrap | — | median |
| Real dollars | CPI rent-of-primary-residence; M2 shown beside | 1947→ / 1959→ | nominal |
| Property tax | ACS B25103 ÷ B25077 by ZIP | 2009→ | none |
| Rate from benchmark | FRED prime / PMMS / 10-yr + margin | 1955→ / 1971→ | slider |
| Rent by bedroom | HUD SAFMR (ZIP) → ACS (ZCTA) → FMR (county) | 2018→ / 2009→ / 1983→ | null + reason |
| Eviction context | Eviction Lab county | 2000–2018 | null + reason |
| Index crediting | trunk price-return series (never total-return) | 1957→ | product cap |
| Tax brackets / statutes | rules tables with `RULES_VERSION` | — | never guessed |

Implementation is one shared component (`EvidencePanel`) + one server helper (`withEvidence(engine, input, toggles)`) — the Mortgage Killer version in `server/rentalRouter.ts` is the template; generalise it rather than copying.

### 4.5 What to delete
- Every hard-coded product rate, statute, bracket or index return inside a `.tsx`.
- Standalone routes that duplicate a hub tab (keep URL, redirect).
- Pages in Bucket D of `PLAN_RECONCILIATION.csv` (119 pages) — embed as tabs or retire; keep the URL.
- Total-return index tables used for crediting.
- Any "patent pending" language until a provisional is filed (`shared/patentStatus.ts` enforces this).

### 4.6 What to measure (site-wide)
Page score (0–10 by the contract), fallback-fired rate, stale-source rate, fact-finder completion, calculator completion, toggle adoption, drift between simulators, council citation rate, Core Web Vitals, sweep health.

---

## 5. Perplexity roadmap — build order to a 10/10 master build

Work on `claude/base-consolidation`. Every phase ends with `pnpm check` 0 and `pnpm test` green. Never push `master`.

**P0 — truth in the flagship (1–2 days)**
1. Fix the four math defects (task 16); recompute expectations; add a regression test per defect.
2. Product-specific AG 49-A caps table; engine reads the product's cap.
3. Replace `ibbotsonModel` total-return table with the trunk price-return series.
Done when: Mortgage Killer, IUL, Time Machine agree on the same household within rounding; compliance tests green.

**P1 — evidence everywhere (3–5 days)**
1. Extract `EvidencePanel` + `withEvidence()` from the Mortgage Killer wiring; apply to every calculator in the catalogue (start with the 10 most-visited).
2. First real data sweep on Railway (`ZIP_DATA_DAYS=30`, `RENTAL_DATA_DAYS=30`, `CENSUS_API_KEY`); verify `rentalMarket.status` and `zip.status` from outside.
3. Task 17: AHS tenure adapter; 50-state deposit rules table, each row cited to the statute.
4. Shiller adapter (task 13).
Done when: every calculator shows the ledger; zero pages with an unlabelled flat rate.

**P2 — one organism (1 week)**
1. ZIP, county, state, property list (bed/bath) as first-class fact-finder fields; pre-fill audit — no question asked twice.
2. Genome routes for the 101 unrouted pages; publish/consume on every page; two inbound links minimum.
3. Provenance link on every figure.
4. Scorecard adds rules 4, 5, 6, 10; runs in CI.
Done when: mean page score ≥ 8; no leaf pages.

**P3 — the 688 mining (1–2 weeks)**
1. Bucket A (43) — fix the blocking defect, then embed/enhance per `PAGE_UPGRADE_SPEC.md`.
2. Bucket B (138) — embed as hub tabs, keep URLs.
3. Bucket D (119) — retire with redirects.
Done when: `pageRegistry.json` shows every 688 URL resolving to a BASE route.

**P4 — brain and providers (parallel)**
1. Authorise OpenRouter/Speko/Stripe; set the Railway variables.
2. Provider verification brief (39 + Roc) → `Verified<T>` records; 90-day freshness sweep.
3. Every engine registered as a council tool; citation rate measured.
Done when: council answers cite a page + ledger row ≥ 95% of the time.

**P5 — the living surface**
1. Default design system chosen (Patent360 / Concept 23); brand guard green; Web Vitals green.
2. Cinematic layer driven only by engine outputs; voice/video keys live.
3. Provisional patent filed → `patentStatus.ts` flips the language site-wide.
Done when: the scorecard reads 10 on every page in the top 30 and ≥ 9 site-wide.

---

## 6. How to run the BASE build

```
cd russell-capital-systems
pnpm install
pnpm check          # tsc
pnpm test           # vitest (≈4 min)
pnpm dev            # http://localhost:3000
```
Env: `DATABASE_URL` (MySQL), OAuth vars per `docs/API_KEYS_WHERE_TO_GET_THEM.md`, optional `FRED_API_KEY`, `CENSUS_API_KEY`, `ZIP_DATA_DAYS`, `RENTAL_DATA_DAYS`. Schema: `database/rcs-schema.sql` (regenerate with `scripts/export_schema_sql.sh`).

Invariants a builder must respect: add a route → nav entry in `AppShell.tsx` + smoke counts in `managed-port.smoke.test.ts` / `grok-merge.smoke.test.ts` + catalogue entry; schema change → regenerate `rcs-schema.sql`; no purple; no ES2015 iteration on Map/Set (`Array.from`); secrets never in `shared/`.
