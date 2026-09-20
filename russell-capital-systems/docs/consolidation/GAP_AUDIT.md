# Gap Audit — donors vs. the canonical build

**Canonical:** `sam-russell-corpus/russell-capital-systems` (this directory).
**Measured:** 2026-09-20, `master` @ `76ed5f2`, clean checkout.
**Donors:** `russell-capital-app` @ `ef74f3f`, `russell-capital` @ `1e83c10`.

Every number below came from running the extraction against all three working
trees, not from reading a manifest. Reproduce with `docs/consolidation/` scripts
or the commands quoted inline.

---

## 1 — The measured gap

| | canonical | `russell-capital-app` | `russell-capital` |
|---|---|---|---|
| Routes in `App.tsx` | **330** | 612 | 622 |
| Page components (`.tsx`) | **325** | 722 | 741 |
| Shared modules (`shared/*.ts`) | **174** | 62 | 62 |
| Shared engines | **55** | 31 | 31 |
| Test files | **227** | 98 | — |
| Tests passing / failing | **4,162 / 0** | 2,030 / 113 | — |

Read that table carefully, because it cuts both ways:

- The donors have **roughly twice the pages and routes**.
- Canonical has **almost three times the shared modules**, **nearly twice the
  engines**, and is the only one of the three whose test suite is green.

Neither side is a superset. The donors hold breadth (pages); canonical holds
depth (engines, modules, tests, auth, backup/restore, provenance). That is why
this is a migration into canonical and not a repository swap.

**Missing from canonical:**

- **385** routes present in `russell-capital-app`
- **462** page components present in `russell-capital-app`
- **11** routes and **11** pages unique to `russell-capital` (the gamification set)
- **4** shared engines: `clientOnboardingEngine`, `complianceDocGeneratorEngine`,
  `familyTreeFinancialEngine`, `multiCurrencyWealthEngine`

---

## 2 — The finding that governs the whole plan

The 462 missing pages are **not 462 independent ports**. Their blocking
dependencies concentrate almost entirely in **seven files**:

| Blocking import | Pages blocked |
|---|---:|
| `@/context/FinancialDataContext` | 250 |
| `@/components/CalculatorPDFExport` | 131 |
| `@/components/ProjectionChart50yr` | 122 |
| `@/components/CalculatorIntegration` | 113 |
| `@/components/StateTaxSelector` | 104 |
| `@/contexts/UnifiedDataBusContext` | 58 |
| `@/components/ToggleHub` | 41 |
| *(organism hooks, misc — long tail)* | ~9 |

Triage of the 462:

| Class | Count |
|---|---:|
| Portable with no new infrastructure | 113 |
| Blocked **only** by the seven files above | ~340 |
| Blocked by the long tail (organism hooks, `toolSearchIndex`) | ~9 |
| Stubs under 40 lines — **do not port** | 39 |

So: **port seven files, unblock about 340 pages.** That is the entire reason
PR-3a exists and why it comes before any page migration.

### Substance of what's on offer

Pages bucketed by line count — a crude proxy, but it separates real tools from
placeholder shells:

| | stub (<40L) | thin (40–120L) | solid (120–300L) | rich (300L+) |
|---|---:|---:|---:|---:|
| Portable now (113) | 0 | 1 | 103 | 9 |
| Blocked (349) | 39 | 11 | 270 | 29 |

Median missing page is **230 lines**. The 39 stubs are the only clearly
disposable group. The rest are substantive enough to be worth reviewing
individually — which is the phase-by-phase work below, not a bulk copy.

---

## 3 — What is genuinely worth taking

Reviewed before porting, as required. Three things in the donor are better than
anything canonical has, and one is worth more than the other two combined.

### 3.1 `useSharedField` — the one-line conversion

`FinancialDataContext` exposes a hook with **exactly the `useState` signature**,
backed by a shared store:

```ts
const [income, setIncome] = useState(100000);
// becomes
const [income, setIncome] = useSharedField("annualIncome", 100000);
```

Same tuple, same call shape. Converting a calculator is a one-line edit, and
every other tool using that key is instantly in sync. That is why 306 files in
the donor adopted it — the migration cost per page is one line.

Canonical has **zero** files using it. This is the single largest capability
canonical is missing.

### 3.2 `useCalculatorAutoFill` — profile-aware pre-fill

`CalculatorIntegration.tsx` carries a per-calculator mapping from one client
profile to that calculator's specific inputs, including derived values:

```ts
"safe-withdrawal-rate": { portfolioValue: taxable + ira + roth + cash },
"rmd-calculator":       { balance: iraBalance + k401Balance },
```

It reads `ClientDataContext` — **which canonical already has**. All **26** fields
it needs are present in canonical's `ClientFactFinderData`, verified field by
field. It drops in with no schema change. Enter the Fact Finder once and every
ported calculator pre-fills correctly.

### 3.3 `CALCULATOR_RELATIONSHIPS` — the cross-link graph

A hand-curated graph, 101 calculators × ~5 related each, driving a "Related
Calculators" strip. Real editorial work; not something to regenerate.

**But it does not work here yet, and that matters.** It was authored against the
donor's 612-route build. Against canonical's 330 routes:

```
relationship keys: 101 | resolve here: 0 | dead: 101
distinct targets:   95 | resolve here: 0 | dead:  95
```

Zero. Partly different slugs for the same tool (`medicare-irmaa` here vs
`medicare-irmaa-calc` there), mostly calculators canonical simply does not have
yet. Rendered raw, it would put dead links on every calculator page.

**Resolution:** every target is filtered through `ROUTE_MANIFEST` at render time
(`servedRelated`). Links appear only for routes actually served, and each newly
ported calculator lights up its own cross-links with no edit to the graph. The
graph is imported intact and becomes progressively more useful as pages land.

### 3.4 Also taken

- `UnifiedDataBusContext` — features publish results other features read.
- `ProjectionChart50yr` — 50-year projection chart plus its generator.
- `StateTaxSelector` + `stateTaxEngine` — all 50 states + DC, bracket-level.
- `CalculatorPDFExport` — client-side PDF of any calculator's result.
- `ToggleHub` — mounts existing pages as tabs under one route, unchanged. This
  is how the donor collapsed ~166 pages into 41 parent routes, and is the
  mechanism for the menu consolidation.

### 3.5 Deliberately NOT taken

| | Why |
|---|---|
| The donor's `App.tsx` / route table | Canonical's `routeManifest.ts` is the better design and is test-enforced. |
| The donor's Postgres/Vercel config | Explicitly out of scope. Configuration files present in a donor are not an infrastructure decision. |
| 39 stub pages | Under 40 lines, no content. |
| `server/analyticsRouter`, `engineChainingRouter`, `reportBuilderRouter` | Appeared in the closure only through the donor's own `routers.ts`. **No client file in PR-3a imports tRPC**, so none is needed. Deferred until a page actually calls them. |
| 4 missing shared engines | Only reachable through those three server routers. Deferred with them. |

---

## 4 — Defects found and fixed on the way in

Recorded because they were real, and because the donor still has them.

1. **Rules-of-Hooks violation** — `useFinancialData` called `useState` *inside*
   `if (!ctx)`. Hook order changes the moment a subtree gains or loses the
   provider. Rewritten so all hooks run unconditionally and only the return is
   branched. Behaviour identical, order legal.
2. **Banned palette** — `CalculatorIntegration` tinted its `purple` category
   `violet-500`. `server/concept16Homepage.test.ts` greps all of `client/src`
   for `violet-|purple-|…`. Retinted indigo; the `purple` key is kept because
   category metadata names it.
3. **Dead link** — the "View all 100+ calculators" footer pointed at
   `/portal/calculator-hub`, which canonical does not serve. Repointed at
   `/calculators`, which it does.
4. **Dead cross-links** — §3.3 above.

Items 2–4 are the same class of failure: donor content assuming the donor's
world. Every page batch below must be checked the same way, which is why the
route/palette assertions in `server/sharedCalcLayer.test.ts` are written to be
reusable.

---

## 5 — A duplicate worth knowing about

Canonical has **both** `client/src/context/` and `client/src/contexts/`, each
containing a `StrategyContext.tsx`. Pre-existing, not introduced here, and not
touched by this PR. New contexts are landing in `contexts/` (the populated one)
rather than deepening the split. Flagged for a later cleanup decision — two
directories differing by one letter is a live footgun.

---

## 6 — Phased plan

Each phase is one PR. No phase merges itself, deploys, or touches DNS,
databases, credentials or hosting.

| Phase | Content | Routes added | Status |
|---|---|---:|---|
| **3a** | The seven infrastructure files + `stateTaxEngine`; providers wired; 24 tests | **0** | **this PR** |
| 3b | The 113 pages that need no new infrastructure, in reviewed batches | ~113 | next |
| 3c | `ToggleHub` parents — collapse ported pages into tabbed hubs, no double-stacking | ~41 parents | after 3b |
| 3d | The ~340 infrastructure-dependent pages, by theme, batched | ~340 | after 3c |
| 3e | The 11 gamification routes from `russell-capital` | ~11 | after 3d |
| 3f | The 3 server routers + 4 engines, **only if** a ported page calls them | 0 | conditional |
| 3g | Nav rebuild over the enlarged route set; `navTree` reconciled | 0 | last |

Ordering is forced by dependencies, not preference: 3b is everything that can
land without 3a's consumers; 3d cannot start before 3a; 3g cannot be meaningful
until the route set stops moving.

**Stubs are never ported.** Pages are reviewed in batches before import, not
bulk-copied.

---

## 7 — Verification, this commit

```
pnpm check   → 0 errors
pnpm build   → exit 0, 330 route patterns written to dist/public/routes.json
pnpm test    → 217 files passed | 9 skipped;  4,162 passed | 82 skipped | 0 failed
```

Baseline before this PR was 216 files / 4,138 passing / 0 failing. The deltas
(+1 file, +24 tests) are exactly `server/sharedCalcLayer.test.ts`. No existing
test changed, and the route count is unchanged at 330 — this PR registers no
routes.
