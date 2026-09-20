# 4 — Route Collision and Dependency Report

Full data: `data/route-collisions.json` — all 438 candidates and all 236 collisions,
each with its source repository and component file.

---

## Method

Routes extracted from each repository's `client/src/App.tsx` by matching
`path="…"`, then resolved to their component source file by following the
`<Route component={gated(X)}>` reference back to the `lazy(() => import(...))`
declaration. This gives route → file, which is what makes a genuine comparison
possible: two repos can serve the same path from different files, and that is
exactly the case worth catching.

---

## Totals

| | Count |
|---|---|
| Live routes | **330** |
| `russell-capital` routes | 664 |
| `russell-capital-app` routes | 612 |
| Union of all three | 768 |
| **Candidates** — in a donor, not in live | **438** |
| **Collisions** — in live *and* a donor | **236** |

### Candidate breakdown

| Group | Count | Note |
|---|---|---|
| Present in **both** donors | **382** | One implementation must be chosen per route |
| `russell-capital` only | **53** | Includes the 9 gamification pages |
| `russell-capital-app` only | **3** | Postgres lineage — check DB coupling first |

### On the 41 `/portal/hub/*` candidates

41 of the 438 are `/portal/hub/<slug>` routes. These do **not** come from either
donor's original state — they were added to `russell-capital` earlier in this
session, before the canonical base was correctly identified. They are listed as
candidates for completeness but are **deferred indefinitely** per
`02_CAPABILITY_MATRIX.md`: live has 330 routes rather than 620, so the duplication
those hubs were built to absorb largely does not exist here, and importing them
would introduce a second consolidation scheme competing with the route manifest.

Net candidate pool excluding them: **397**.

---

## Collisions — the 236 that must not be overwritten

Every one of these paths already resolves in the live build. **Live wins by
default.** A donor version replaces it only with a documented comparison and a
regression proof in the PR that proposes the swap.

226 of the 236 resolve to a component whose file path matches between live and
donor — same route, same-named file, almost certainly the same lineage. Those are
low-interest.

**Ten are genuinely different implementations of the same route.** These are the
only collisions worth a comparison, and each needs an explicit keep-or-swap
decision before it is touched:

| Route | Live component | `russell-capital` component | Note |
|---|---|---|---|
| `/` | `FrontDoor` | `pages/Landing` | Live's front door is a deliberate rewrite — see `docs/HOMEPAGE_SEQUENCES.md`. **Keep live.** |
| `/register` | `pages/ManagedAuthLegacy` | `pages/Register` | Live routes auth through a managed layer. Architectural, not cosmetic |
| `/forgot-password` | `pages/ManagedAuthLegacy` | `pages/ForgotPassword` | Same |
| `/portal/long-term-care` | `LongTermCare` | `LongTermCarePlanner` | Compare feature-by-feature |
| `/portal/market-pulse` | `MarketPulsePage` | `MarketPulseSentinel` | Different names suggest different scope |
| `/portal/meeting-prep` | `MeetingPrepPage` | `AdvisorMeetingPrep` | Compare |
| `/portal/mortgage-killer-v2` | `MortgageKillerV2Page` | `MortgageKillerV2` | Likely same lineage, different location |
| `/portal/myga-waterfall` | `MygaWaterfallPage` | `MYGAWaterfallComparison` | Compare |
| *(2 further rows)* | | | See `data/route-collisions.json` |

The `ManagedAuthLegacy` pair is the highest-risk of these. **Do not touch auth
routes in any migration PR.** If they need attention it is a dedicated PR with its
own review.

---

## Dependency constraints

Ordering rules that fall out of the data. Violating any of these produces a broken
build rather than a merge conflict, so they are hard constraints, not preferences.

### 1. The route manifest is append-only

`shared/routeManifest.ts` has 330 entries and two smoke tests diff it against
`App.tsx` in both directions. Its header records why it stopped being an integer:
an integer was the repository's most reliable merge conflict.

**Every migration PR that adds a route must add one line to the manifest** — never
regenerate the file, never sort it wholesale. Line insertions merge cleanly; a
regenerated file does not.

### 2. Three-way route agreement must hold

`App.tsx` = `shared/routeManifest.ts` = `dist/public/routes.json` (emitted by the
build). All three read 330 today. A PR adding N routes must leave all three at
330 + N. This is checkable in CI and is checked by `rcs-verify.yml`.

### 3. Engines before the pages that call them

`docs/audit/pageRegistry.json` records each page's engine dependencies. A page
importing `familyTreeFinancialEngine` cannot land before that engine does. The four
candidate engines are therefore Phase 4–6, and the pages depending on them come
after.

### 4. Schema before the code that reads it

Eight candidate tables. Migration numbering in this repo continues from **0061**;
donor migrations numbered 0056/0057 are from a different lineage and **must be
renumbered on import**. Importing them at their original numbers would collide with
this repo's existing 0056 and 0057.

### 5. Dialect gate on anything from `russell-capital-app`

`-app` is `pg-core`. Live is `mysql-core`. Any `-app` artifact that imports from
`drizzle/schema` or writes SQL is a dialect migration, not a copy: `serial`,
`jsonb`, array columns, `ON CONFLICT`, and `RETURNING` all differ. **UI-only
imports from `-app` are fine; anything else needs a rewrite and its own tests.**

### 6. Audit artifacts are generated, not edited

`audit/route_manifest.json` regenerates via `scripts/reconcile-route-manifest.mjs`.
`docs/audit/pageRegistry.json` is static-analysis output. Hand-editing either
produces drift that no test catches. Run the generator; commit its output.

---

## What is not in this report

**Component-level dependency graphs for the 438 candidates.** Resolving every
candidate page's full import tree — its shared modules, contexts, UI components and
engines — is per-page work that belongs in each migration PR, where it can be done
against the actual files being moved rather than guessed at in bulk here.

What this report establishes is the *shape*: which routes are safe to add, which
236 are already spoken for, which 10 need a real decision, and what order the
layers have to move in.
