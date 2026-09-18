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
