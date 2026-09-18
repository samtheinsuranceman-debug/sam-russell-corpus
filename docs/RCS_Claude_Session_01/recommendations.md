# Recommendations
## Taking Russell Capital Systems from 4.3 to 10 out of 10

---

## Part 1 — The principle

A 10 out of 10 is not a prettier page. It is a page that **cannot show a number without its source, cannot be reached without the brain knowing it exists, and cannot be left without feeding the next page.**

So the contract below scores *connection*, not appearance.

---

## Part 2 — The universal page contract

Ten rules. One point each. A page's score is the number it passes.

| # | Rule | Passes when | Why |
|---|---|---|---|
| 1 | **REGISTERED** | The route is in `shared/calculatorCatalog.ts` with category, purpose, inputs, outputs and memory group; the path resolves | A page absent from the catalogue is invisible to the brain, to navigation and to the scorecard |
| 2 | **BRAINED** | The engine is a module in `shared/aiMemoryBank.ts`; `unwiredGroups()` returns 0 | A page the brain cannot cite is a page it will never recommend |
| 3 | **FED** | Every field with a fact-finder counterpart reads its default from `ClientDataContext` | Re-asking is the most common reason a user abandons a financial tool |
| 4 | **SOURCED** | Every figure traces to `{source, asOf, window, method}`; no source means `null` plus a reason | This is the compliance floor: an advisor who shows a number must be able to say where it came from |
| 5 | **TOGGLED** | The shared `EvidencePanel` is present, defaults off, and each toggle adds a ledger row | The owner's standing order — history, taxes and inflation optional on every calculator |
| 6 | **SIMULATED** | Projections of five years or more offer 10,000 seeded paths with p10/p50/p90 and worst rolling decade | A single-line 30-year projection is a lie of precision |
| 7 | **RULED** | Every statutory, tax or product constant reads from a rules table with a version | Tax law changes annually; a constant in a component is a silent error waiting for the next session |
| 8 | **LINKED** | Two or more inbound links; publishes a result some other page consumes | 104 of 115 pages currently fail this. That is the arithmetic of getting lost |
| 9 | **TESTED** | Pure-function test on the engine, route test on the page, compliance test on any regulated claim | 4,095 tests are why this platform can change quickly without fear |
| 10 | **MEASURED** | Views, completions, time-to-first-number and abandonment reported to the scorecard | Without it, "which pages matter" is an opinion |

**Scoring.** `page_score` = rules passed. `site_score` = mean across the catalogue. Six of the ten are already read from code by `server/integrationAudit.ts`; adding checks for rules 4, 5, 6 and 10 makes the whole score automatic.

**Enforcement, staged** — turning the gate on today would fail 104 of 115 pages and stop all work:
1. **Now:** the scorecard reports; nothing fails the build.
2. **At site mean 6:** new pages must ship at 8 or higher.
3. **At site mean 8:** any regression below 8 fails the build.

### What each score means

| Score | Description |
|---|---|
| 0–3 | An orphan. Real math, no connections. Found by accident; everything typed by hand |
| 4–5 | Works in isolation. Catalogued, perhaps tested, but flat assumptions and no provenance |
| 6–7 | Connected but not sourced. Pre-fills and links out, still shows numbers it cannot defend |
| 8–9 | Defensible. Sourced, toggled, simulated, linked, tested. Missing measurement or one connection |
| 10 | Full organism member. Every figure traceable, every input inherited, every result consumed downstream |

---

## Part 3 — What each category of page must have

### A. Calculators
*Mortgage, IUL, annuity, tax, PSLF, divorce, LTC, disability, estate*

**Necessary** — pure engine in `shared/` (no arithmetic in components); zod schema at the router boundary; evidence ledger; toggles off by default; 10,000-path simulation on anything ≥5 years; every constant from a rules table; PDF export that prints the ledger, so a printed illustration is as defensible as the screen.

**Add** — a "how this figure is made" link beside every output; scenario comparison (four presets minimum); a worst-decade stress line drawn from the actual worst rolling period, not an invented downside; solve-for-input inversion.

**Connect** — reads the fact finder; publishes to the strategy context; appears in the genome; callable by the council as a named tool.

**Delete** — any product rate, statute, bracket or index return hard-coded in a `.tsx`; any chart fed a literal array instead of computed data; any `useMemo` with an empty dependency array feeding a chart (the data freezes while inputs change — the 688 audit found this repeatedly).

**Measure** — runs, exports, share of runs with a toggle on, **share of runs where a fallback fired** (the direct measure of data coverage), completion rate.

### B. Simulators and engines
*LifeForge, Time Machine, Wealth Genome, Sequence Planner, Monte Carlo*

**Necessary** — sourced series with the coverage window displayed; seeded resampling so results reproduce; percentile fans, never a single line; the assumption sheet printed with the result.

**Add** — the Shiller series from 1871; ZIP-level paths on every simulator; inversion mode; **regime awareness** — say which historical periods the resampled blocks came from (the engine in `code/` does this).

**Connect** — every simulator consumes the same household state and the same evidence tables. One `evidence/` namespace, never per-page copies of a series.

**Delete** — any fixed 5%, 7% or 8% default not explicitly labelled a fallback; total-return index tables anywhere crediting is calculated.

**Measure** — paths, seeds, p10–p90 spread, and **drift between simulators on identical inputs**, which should be zero. Any drift is a bug, and measuring it is how you find it.

### C. Hubs and workspaces
*RECIN, Rental Enterprise, Mechanisms, Alt Credit, The Field*

**Necessary** — tabs embedding child pages at their own URLs; one shared state across tabs; a summary strip updating live.

**Add** — the evidence panel at hub level so tabs inherit it; a "what changed since your last visit" line; cross-tab conflict detection.

**Connect** — the hub is the memory group for its children; the genome routes to the hub, the hub to the tab.

**Delete** — standalone routes duplicating a hub tab. Keep the URL as a redirect; the owner was explicit that URLs survive.

**Measure** — tab depth per visit, cross-tab navigation, exit points.

### D. Knowledge, education and rules pages
*Statutes, lending-law sequencing, product mechanics, glossary*

**Necessary** — every claim cited with a link and an as-of date; a `RULES_VERSION`; **the table the engines read is the same object the page renders.** Not a prose copy that drifts.

**Add** — a "used by" list per rule, making the blast radius of a legal change visible before you make it; a diff view when a rule changes; a staleness flag past 90 days.

**Connect** — indexed for council retrieval; each calculator's ledger links back to the rule row it used.

**Delete** — prose restating a rule the table holds; any claim without a citation.

**Measure** — citation count, citations older than 90 days, reads per rule by engines.

### E. Client portal, fact finder, onboarding
*The 200+ NLP calibration questions, genome inputs, document upload*

**Necessary** — one household state object; every question tagged with the engines it feeds; progress that rewards completion.

**Add** — **ZIP, county FIPS, state, filing status and a property list with bedroom and bathroom counts as first-class fields.** These gate the entire evidence layer: without a ZIP, no calculator can use local history. **This is the highest-leverage single addition on the roadmap.** Then extend document extraction beyond mortgage statements to tax returns and policy statements. Then gap-aware questioning: the brain asks only what is missing.

**Connect** — answering any question pre-fills every calculator consuming it, immediately; the genome reads the answered set and routes accordingly.

**Delete** — duplicated question sets across pages. One question, one home, many consumers.

**Measure** — completion percentage, questions per session, drop-off by question, and **fields consumed per engine** — a question no engine reads is a question to retire.

### F. AI brain, council and memory

**Necessary** — every engine callable as a named tool with its schema; every answer citing the page and the specific ledger row; one memory group per hub.

**Add** — "run this for me" from chat, opening the calculator pre-filled; an audit trail of which engine produced which number; **explicit refusal to state a figure with no ledger row** — the brain should say "I don't have a source for that" rather than generate one.

**Connect** — OpenRouter for the council (needs the owner's authorisation); Perplexity for public-fact retrieval only, never proprietary calculation.

**Delete** — any prompt text hard-coding a number the engines compute. The model reads the engine; it does not remember a figure.

**Measure** — tool-call success rate, citation rate, unanswered-question rate, council disagreement rate.

### G. Homepage, marketing, audience pages

**Necessary** — one design system as default (Patent360 or Concept 23 — the owner's call); brand guard passing; Core Web Vitals green; every CTA landing on a pre-filled calculator, not a lead form.

**Add** — at least one live number on the homepage from the evidence layer, with its as-of date. It proves the site is alive rather than a brochure. Make the five concept designs selectable themes.

**Connect** — audience page → hub → calculators, as one path.

**Delete** — any page marketing a feature not in the catalogue. Nothing erodes trust faster.

**Measure** — LCP, CLS, INP; CTA → calculator completion.

### H. Admin, data and status pages

**Necessary** — per series: window, as-of, last sweep, row count; a manual refresh; a staleness flag past 90 days.

**Add** — rental and ZIP ledgers on one page; a provider freshness sweep; **a rolled-up fallback report** showing every calculator's fallback reasons in one place, so the owner sees which sources are missing and what that costs.

**Delete** — nothing, but keep it behind admin auth.

**Measure** — sweep success, rows loaded, latency, series with zero coverage.

### I. Cinematic and media pages

**Necessary** — **the values shown are the household's real numbers from the engines, not decoration.** A vision board showing an invented figure is worse than no vision board. Reduced motion respected.

**Add** — the legacy thread reads the multi-generational transfer engine's actual output; vision-board imagery keyed to the genome.

**Connect** — HeyGen and ElevenLabs keys (owner action); the motion kit is already in the BASE.

**Delete** — any media element not driven by data.

**Measure** — session length, return visits.

---

## Part 4 — The eight wiring rules

1. **One household state.** `ClientDataContext` is the only source of client inputs. *Prevents two pages showing different answers for the same family.*
2. **One evidence namespace.** Every engine reads sourced data through shared adapters; no page fetches an external source directly. *Prevents fifteen pages each hitting FRED with different parameters and producing fifteen irreproducible inflation rates.*
3. **Publish and consume.** Every result publishes with its ledger; the next page consumes it and says so visibly. *Prevents re-entering one calculator's output as the next one's input, which is where transcription errors enter.*
4. **The genome routes everything.** 101 of 115 pages currently have no genome route. Each earns one or gets embedded in a page that has one. *This is the direct fix for getting lost in your own website.*
5. **Hubs own memory groups.** Retrieval is hub first, then page. *Prevents the brain answering from a leaf without the context that makes the answer correct.*
6. **Provenance one click away.** Any number → engine, inputs, ledger row, rule row. *Prevents an advisor in front of a client, asked "where does that come from," with no answer.*
7. **No page is a leaf.** Two inbound links minimum, one downstream consumer. Failing pages get embedded or retired with a redirect.
8. **The scorecard is the arbiter.** It runs in CI, enforced on the staged schedule above.

---

## Part 5 — The universal evidence toggles

**Off by default. Off means the engine's documented assumption, clearly labelled. On means a path built from the record.**

Off-by-default is not timidity: existing behaviour never changes silently, turning a toggle on is a deliberate act an advisor can explain, and the comparison between "flat assumption" and "actual history" becomes one click — which is itself among the most persuasive things this platform can show.

| Toggle | Source | Coverage | When off or missing |
|---|---|---|---|
| ZIP appreciation | FHFA ZIP5; Zillow ZHVI | 1975→ ; 2000→ | Engine flat rate, labelled |
| Pessimistic path | Same | Same | Median path |
| Real dollars | CPI rent of primary residence; M2 shown alongside, never blended | 1947→ ; 1959→ | Nominal |
| Property tax | ACS B25103 ÷ B25077 by ZCTA | 2009→ | Not modelled |
| Rate from benchmark | FRED DPRIME; Freddie Mac PMMS | 1955→ ; 1971→ | The page's slider |
| Rent by bedroom | HUD SAFMR → ACS → HUD FMR | 2018→ / 2009→ / 1983→ | `null` with the reason |
| Eviction context | Eviction Lab county | 2000–2018 | `null` with the reason |
| Index crediting | Trunk price-return series | 1957→ | Product cap |
| Tax and statute | Rules tables with versions | Varies | **Never guessed** — the calculation refuses |

**Built once, not 115 times:** one `EvidencePanel` client component and one `withEvidence(engine, input, toggles)` server helper. The working version is `mortgageEvidence.withEvidence` in `server/rentalRouter.ts`. **Generalise it; do not copy it.**

### What the ledger looks like to a user

```
✓ applied   appreciationPath
            FHFA five-digit ZIP index · as of 2025-Q4
            Median of 10,000 five-year-block bootstrap paths, 1975–2025

✗ fallback  inflationPath (CPI rent)
            Series not yet loaded for this geography
            → using the engine's flat 3.0% assumption

Projection, not prediction. A path marked fallback used the engine's
flat assumption and says why.
```

That block is the difference between a 4 and a 9. It is not decoration — it is the product.

---

## Part 6 — Auto-population, end to end

1. **The household answers once** — fact finder, document upload, or NLP calibration. ZIP, county, state, income, balances, property list.
2. **Every calculator inherits** on mount, marking inherited fields visibly so the user knows the site remembers them.
3. **Geography unlocks history.** The ZIP makes the toggles usable. Without it the panel says so and stays inert. *This is why adding ZIP to the fact finder is the highest-leverage single change on the roadmap.*
4. **Results cascade.** Each page publishes; downstream pages consume and name the source. The 10,000-path simulation runs on the inherited household plus whichever evidence paths are on, and its percentile bands feed the vision board — so the cinematic layer shows the family's actual modelled outcomes rather than illustrative art.

**The test that proves the chain works:** enter a household once, walk the entire genome route without typing any value a second time, and have every figure trace back to either a named source or a labelled assumption.

That walk is currently impossible. When it is possible, the site is a 10.

---

## Part 7 — What to delete

- Every hard-coded product rate, statute, bracket or index return inside a `.tsx`.
- Standalone routes duplicating a hub tab — keep the URL, redirect into the tab.
- The 119 pages in Bucket D of `PLAN_RECONCILIATION.csv` — embed or retire, but no URL dies.
- Total-return index tables used anywhere crediting is calculated.
- Any "patent pending" language until a provisional is actually filed. A test already enforces this.

## Part 8 — What to measure site-wide

Page score (0–10 by the contract) · fallback-fired rate · stale-source rate · fact-finder completion · calculator completion · toggle adoption · drift between simulators · council citation rate · Core Web Vitals · sweep health.
