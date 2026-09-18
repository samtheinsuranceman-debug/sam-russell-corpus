# Architecture
## Russell Capital Systems — how the system is put together

---

## 1. Stack

| Layer | Technology |
|---|---|
| Front end | React 19, Vite, Tailwind 4, wouter (routing) |
| API | tRPC v11 over Express |
| Data | drizzle-orm → MySQL (155 tables) |
| Tests | vitest — 214 files, 4,095 tests |
| Deploy | Railway → www.russellcapitalsystems.com |
| Package manager | pnpm |

**Two compiler constraints that bite.** `tsconfig.json` sets no `target` and no `downlevelIteration`, so the build emits ES5. Spreading a `Set`, iterating a `Map` with `for…of`, or calling `.matchAll()` will not compile. Use `Array.from()`. Second, secrets must never appear under `shared/` — that directory is bundled to the browser.

---

## 2. Repository layout

```
sam-russell-corpus/                    ← the corpus monorepo
├── russell-capital-systems/           ← THE BASE BUILD — all work happens here
│   ├── client/src/
│   │   ├── pages/portal/              ← ~115 catalogued pages
│   │   ├── components/AppShell.tsx    ← navigation; a new route must be added here
│   │   └── contexts/ClientDataContext ← the single household state
│   ├── server/
│   │   ├── _core/                     ← boot, tRPC, auth, FRED adapter
│   │   ├── routers.ts                 ← the tRPC surface
│   │   ├── zipData.ts                 ← FHFA / Zillow / PMMS adapters
│   │   ├── rentalData.ts              ← HUD / ACS / Eviction Lab / FRED money adapters
│   │   └── rentalRouter.ts            ← rentalMarket.* and mortgageEvidence.withEvidence
│   ├── shared/                        ← PURE ENGINES — no I/O, browser-safe
│   │   ├── calculatorCatalog.ts       ← the page registry (115 entries)
│   │   ├── aiMemoryBank.ts            ← 29 groups wiring engines to the brain
│   │   ├── compositeMind.ts           ← 12 channels feeding the model's prompt
│   │   ├── mortgageKiller.ts          ← the flagship engine
│   │   ├── rentalMarketEngine.ts      ← evidence ledger, resampling, rent by config
│   │   ├── historicalMarketRegimeEngine.ts  ← regime classification + conditioned draws
│   │   ├── realEstateCapitalStackEngine.ts  ← sources/uses, debt, waterfall
│   │   ├── divorceStateRules.ts       ← the rules-table reference implementation
│   │   └── …30 sister-invention engines (SI-001…035)
│   ├── drizzle/schema.ts              ← table definitions
│   ├── database/rcs-schema.sql        ← generated; a test asserts it matches
│   └── docs/                          ← audit, scorecard, roadmap, handoff, perplexity/
├── russell-capital/                   ← pure engine kit, no UI
├── doctor-buddy/                      ← physician-facing site
└── Patent360/                         ← design system

russell-capital/                       ← separate repo: the 688-page build (being mined)
```

**Branches.** `claude/base-consolidation` is where work happens. `master` deploys to production and is never pushed to without the owner. The 688 build lives on `claude/homepage-portrait-day-sign-5o0l9d`.

---

## 3. The layering rule

```
  ┌─────────────────────────────────────────────────────┐
  │  client/src/pages/          presentation only        │
  │    · no arithmetic, no constants, no fetching        │
  └────────────────────────┬────────────────────────────┘
                           │ trpc
  ┌────────────────────────▼────────────────────────────┐
  │  server/*Router.ts          boundary                 │
  │    · zod validation · auth · builds evidence paths   │
  └────────────────────────┬────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
  ┌─────▼──────────────────┐   ┌──────────────▼─────────┐
  │  shared/*Engine.ts     │   │  server/*Data.ts        │
  │  PURE FUNCTIONS        │   │  ADAPTERS               │
  │  · deterministic       │   │  · fetch, parse, store  │
  │  · no I/O, no Date.now │   │  · scheduled sweeps     │
  └────────────────────────┘   └──────────────┬─────────┘
                                              │
                               ┌──────────────▼─────────┐
                               │  MySQL evidence tables  │
                               │  zip_series             │
                               │  rental_series          │
                               │  market_data_points     │
                               └────────────────────────┘
```

Two rules make this hold:

- **Engines never fetch.** A pure function given the same inputs returns the same outputs forever, which is what makes 4,095 tests fast and meaningful. Series arrive as arguments.
- **Pages never compute.** Arithmetic in a component cannot be tested, cannot be reused by the AI brain, and cannot be audited.

---

## 4. The evidence flow

This is the spine the whole "4.3 to 10" plan hangs from.

```
  Public source                Adapter              Table              Engine            Page
  ─────────────                ───────              ─────              ──────            ────
  FHFA ZIP5 1975→        ┐
  Zillow ZHVI 2000→      ├──→  zipData.ts    ──→  zip_series    ┐
  Freddie Mac PMMS 1971→ ┘                                      │
                                                                ├──→ withEvidence() ──→ EvidencePanel
  HUD FMR 1983→          ┐                                      │      builds paths       + ledger
  HUD SAFMR 2018→        ├──→  rentalData.ts ──→  rental_series ┤      from toggles
  Census ACS 2009→       │                                      │           │
  Eviction Lab 2000-2018 ┘                                      │           ▼
                                                                │   runMortgageKillerAnalysis(
  FRED M2 1959→          ┐                                      │     input, appreciationPath,
  FRED CPI-rent 1947→    ├──→  _core/fred.ts ──→ market_data    ┘     inflationPath,
  FRED DPRIME 1955→      ┘                        _points             propertyTaxRatePath,
                                                                       helocRatePath )
```

**The contract at every hop:** a figure carries `{source, asOf, window, method}`. Where the record is blank, the value is `null` with the reason — never an estimate.

**Toggles are off by default.** Off reproduces the engine's original flat constants exactly, so turning the evidence layer on never silently changes an existing illustration.

---

## 5. The AI brain

```
  calculatorCatalog.ts  ──┐
   (115 pages: purpose,   │
    inputs, outputs)      │
                          ├──→  compositeMind.instrumentBlock()  ──→  model prompt
  aiMemoryBank.ts       ──┤        (12 channels)
   (29 groups, 86         │
    modules → engines)    │
                          │
  evidenceRetrieval.ts  ──┘
   (rules tables, docs)
```

`unwiredGroups()` returns 0 — every memory group resolves to real engines. The council layer (`shared/council/`) fans a question across models; it is dark until OpenRouter is authorised.

**The rule that makes the brain trustworthy:** it cites the page and the ledger row behind every number, and refuses to state a figure that has no ledger row rather than generating one.

---

## 6. Invariants enforced by tests

These are guards, not bureaucracy. They are why 330 routes stay coherent.

| Test | Enforces | What breaks it |
|---|---|---|
| `navigation-organization.test.ts` | Every static portal route appears in the nav or a secondary catalogue | Adding a route without an `AppShell.tsx` entry |
| `managed-port.smoke.test.ts` | Exact route count (currently 330) | Adding or removing a route without updating the count |
| `grok-merge.smoke.test.ts` | Same count, plus imported delta modules still present | Same |
| `databaseSchemaFile.test.ts` | `rcs-schema.sql` matches `drizzle/schema.ts` | A schema change without `scripts/export_schema_sql.sh` |
| `concept16Homepage.test.ts` | No purple anywhere in `client/src` | Any `violet-`, `purple-`, `#a78bfa`, `#8b5cf6`, `#7c3aed` |
| `calculatorCatalog.test.ts` | Every catalogue path resolves to a real route | A catalogue entry pointing nowhere |
| `patentStatus.test.ts` | No "patent pending" language while zero applications are filed | Claiming a status that does not exist |

**After adding any route, run these four before the full suite:**

```bash
pnpm test -- navigation-organization managed-port grok-merge databaseSchemaFile
```

---

## 7. Engine inventory (selected)

| Engine | Does | Wired to a rules table? |
|---|---|---|
| `mortgageKiller` | Mortgage acceleration via IUL + HELOC; 30-year cascading projection | Partly — evidence paths yes; AG 49-A cap no |
| `divorceFinancialEngine` | Property division scenarios | **Yes** — `divorceStateRules`, the reference implementation |
| `rentalMarketEngine` | Rent by configuration, property tax path, eviction exposure, resampling | Yes — evidence ledger throughout |
| `historicalMarketRegimeEngine` | Regime classification; conditioned resampling | Yes — thresholds named and reported |
| `realEstateCapitalStackEngine` | Sources and uses, monthly debt amortization, IRR-lookback promote waterfall | N/A — deal inputs, not statute |
| `ibbotsonModel` | Historical index crediting backtest | **No — and its table is the wrong return series** |
| `pacificHorizonEcv` | Product-specific illustration | Yes — carries the real 6.35% product cap |
| `sequencePlanner` | Legal orderings for a property portfolio | Partly |
| SI-001…035 | 30 sister-invention engines | Varies |

---

## 8. Where the architecture is currently violated

Stated plainly, because these are the work:

1. **Constants in components.** Product rates, statutes and brackets appear inside `.tsx` files in several places, bypassing the rules-table layer.
2. **Per-page data assumptions.** Pages that hard-code a growth rate rather than accepting an evidence path — 104 of 115 pages show no live data at all.
3. **No shared evidence component yet.** The toggle panel and `withEvidence()` exist only on the Mortgage Killer path; they need extraction before they can be applied everywhere.
4. **Missing cost of insurance.** `mortgageKiller` models an IUL with no mortality or expense charges.
5. **Wrong return series.** `ibbotsonModel` holds total return where price return is required.
6. **Unrouted pages.** 101 of 115 catalogue pages have no genome route reaching them.

Items 3 through 6 are the P0 and P1 work. Items 1, 2 and 6 are P2.

---

## 9. Running it

```bash
cd russell-capital-systems
pnpm install
pnpm check     # tsc — must be 0
pnpm test      # vitest, ~4 min — must be green
pnpm dev       # http://localhost:3000
```

**Required:** `DATABASE_URL`.
**Unlocking:** `FRED_API_KEY`, `CENSUS_API_KEY`, `ZIP_DATA_DAYS=30`, `RENTAL_DATA_DAYS=30`.
**Dark until set:** `PERPLEXITY_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `HEYGEN_API_KEY`, `HEYGEN_VOICE_ID`, `MCP_API_KEY`, `USPTO_API_KEY`, `SESSION_SECRET`, `PARTNER_API_KEY`.

The data sweeps are scheduled at boot and gated by their `*_DAYS` variables — unset means off. The build sandbox used for this session could not reach huduser.gov, api.census.gov or fred.stlouisfed.org, so the first real sweep must run from Railway or a local machine, then be verified through `rentalMarket.status` and `zip.status`.
