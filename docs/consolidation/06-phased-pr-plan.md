# 6 — Phased PR Plan

Requirement: *"A phased PR plan with source paths, target paths, test criteria,
and rollback plan per migration."*

**Rules binding every PR below:**

- One bounded capability per PR. No PR does two things.
- Base paths are relative to `sam-russell-corpus/russell-capital-systems/`.
  Donor paths are fully qualified with their repo, because a `russell-capital/`
  directory also exists *inside* the base (risk R-1).
- **Test floor: ≥ 3,757 passing, 0 failing.** Any PR below the floor is blocked.
- Tag `master` before each merge (`05-ci-secrets-rollback.md` §5.4).
- Rollback is always `git revert -m 1 <merge-sha>`. `master` is never force-pushed.
- No PR touches DNS, domains, hosting, databases, credentials, or the deploy
  workflows.
- No PR modifies a protected registry without a documented comparison and
  regression proof.

---

## Phase 0 — Foundation

### PR-0 · Consolidation infrastructure
**Depends on:** this PR merged.
**Adds:** `.github/workflows/rcs-consolidation-gate.yml`; baseline tag
`consolidation-baseline-2026-09-20`; branch protection on `master`.
**Also resolves the open questions** blocking the plan:
- Confirm the "391 pages" set; re-cut `04-…` against it.
- Confirm what "live engine registry" and "behavioral schema" name.
- Decide the fate of the `russell-capital/` 21-page fragment inside the base.
- Inventory `Russell-Capital-Solutions-NEW` and `Really-Russell-Capital`.
- Stand up a throwaway MySQL instance and close the runtime gap from
  `03-base-verification.md`.

**Test criteria:** gate workflow green on its own PR; baseline reproduces
3,757 passing. **Rollback:** delete workflow file and tag; no app code touched.

---

## Phase 1 — Data layer (blocking; everything waits on this)

### PR-1 · MySQL → PostgreSQL port of the base schema
**Why first:** 3,757 tests currently pass against MySQL. Every later PR's test
criteria depend on this landing cleanly.

| | |
|---|---|
| **Source (reference only)** | `russell-capital-app`: `server/db.ts`, `drizzle.config.ts`, `drizzle/schema.ts`, `DEPLOY_NOTES.md` |
| **Target** | base `server/db.ts`, `drizzle.config.ts`, `drizzle/schema.ts`, `package.json` |
| **Carries forward** | the base's **155** tables — *not* the app's 116 |

**Conversions** (per the app's documented port): `mysqlTable`→`pgTable`;
`int().autoincrement().primaryKey()`→`serial().primaryKey()`; non-PK
`int`→`integer`; `json`→`jsonb`; `mysqlEnum("c",[…])`→`text("c",{enum:[…]})`;
`.$returningId()`→`.returning()`; `.onDuplicateKeyUpdate({set})`→
`.onConflictDoUpdate({target,set})`; `result.insertId`→`.returning()` + `.id`;
drop `.onUpdateNow()` and set `updatedAt` in app code. Add `postgres`; leave
`mysql2` in place until PR-1b.

**Test criteria:** ≥3,757 passing; `tsc` 0 errors; build clean;
`drizzle-kit push` against the **throwaway** instance creates all 155 tables;
`SELECT count(*) FROM information_schema.tables WHERE table_schema='public'`
returns 155. **No production database is touched.**
**Rollback:** revert; base returns to MySQL, tests return to 3,757.

### PR-1b · Remove `mysql2`
Only after PR-1 is green for one full cycle. **Rollback:** revert.

---

## Phase 2 — Adjudication (no code moves)

### PR-2 · Disposition of all 419 app-only portal pages
**Source:** `russell-capital-app/CONSOLIDATION_PLAN.json`; base
`docs/audit/pageRegistry.json`; [`data/pages-only-in-app.txt`](data/pages-only-in-app.txt).
**Target:** `docs/consolidation/07-page-dispositions.md` + `data/page-dispositions.tsv`.
**Output:** every one of the 419 assigned ADOPT / SUPERSEDED / DUPLICATE / DROP
with a reason; all 24 route collisions resolved; the Hub double-stacking check
answered for every Hub.
**Test criteria:** documentation only — CI must stay green; count of ADOPT pages
must equal the number of pages later migrated in Phase 4. **Rollback:** revert docs.

### PR-3 · Engine adjudication
**Source:** [`data/engines-in-both.txt`](data/engines-in-both.txt) (58 diffs),
[`data/engines-only-in-app.txt`](data/engines-only-in-app.txt) (4).
**Target:** `docs/consolidation/08-engine-dispositions.md`.
**Output:** a diff verdict for each of the 58 shared-name engines (identical /
base-newer / app-newer) and an adopt-or-reject call on the 4 app-only engines.
**Rollback:** revert docs.

---

## Phase 3 — Low-risk capability migration

### PR-4 · Sacred Seven verification (expected: no-op)
All seven pages are already in the base. **This PR verifies currency, it does
not migrate.** Diff base vs `russell-capital-app` copies of `TheArrival`,
`TheMirror`, `TheStrategyTable`, `TheField`, `TheMap`, `TheLegacy`,
`TheBrotherhood`; adopt only differences that are demonstrable improvements.
**Test criteria:** ≥3,757; all 7 routes render in build output.
**Rollback:** revert.

### PR-5 · 9 gamification pages
| | |
|---|---|
| **Source** | **`samtheinsuranceman-debug/russell-capital`** (the *repo*, not the in-base folder) → `client/src/pages/portal/` |
| **Target** | base `client/src/pages/portal/` |

`EliteShowdown, EntrainmentEngine, GamifiedPavlovianEngagement,
HolographicMirage, MoatFortress, PredictiveInsightArena,
StrategyComparisonArena, WealthOdyssey, WealthWarriorChallenges`

The other 8 are already in the base — **do not re-import them.**
**Test criteria:** ≥3,757 (no existing test may change); `tsc` 0; build clean;
9 new routes registered in `shared/routeManifest.ts` **by extension only**; no
collision with the 24 in `04-…`; `reconcile-route-manifest.mjs` reports no orphans.
**Rollback:** revert — 9 self-contained page files plus manifest entries.

---

## Phase 4 — Bulk page migration

### PR-6 … PR-N · ADOPT pages, batched by domain
Gated on PR-2. Batched by capability domain (tax, estate, annuity, real
estate, …), **≤ 25 pages per PR**, each with its engine dependencies from PR-3.

**Per batch — test criteria:** ≥3,757 plus any tests the batch brings; `tsc` 0;
build clean; every new route in the manifest; no collision reintroduced; no
page reachable by two paths.
**Rollback:** revert the batch; batches are independent by construction.

---

## Phase 5 — Navigation and deployment

### PR-8 · Navigation model
Gated on the page set being frozen. Chooses one nav model over the base's
`routeManifest.ts` + `pageRegistry.json`. **Records that the app's
`NAV_SECTIONS` is dead code** — only `MEDICAL_TREE` renders there — so nothing
is ported from it by mistake.
**Test criteria:** every route in the manifest reachable from the menu, or
explicitly listed as intentionally unlisted; no capability reachable twice.
**Rollback:** revert.

### PR-9 · Vercel deployment configuration — **config only, no deploy**
**Source:** `russell-capital-app`: `vercel.json`, `api/index.ts`.
**Target:** base root.
**Explicitly excluded:** DNS, domain assignment, project linking, environment
variables, production traffic. Adding the files is not deploying them.
**Test criteria:** build produces `dist/public` + `dist/index.js`; `vercel.json`
validates; **no deployment triggered**; `deploy-branch.yml`, `pages.yml`, and
both `railway-*` workflows untouched.
**Rollback:** delete both files.

### PR-10 · Deployment cutover — **REQUIRES SEPARATE EXPLICIT APPROVAL**
Out of scope for this plan. Not to be prepared or proposed until Phases 0–5 are
complete and the owner approves in a separate instruction. Note for whoever
reaches it: `russell-capital-app`'s latest production deployment is `BLOCKED` at
the Vercel account-configuration level, so that block is a prerequisite
regardless of which repo eventually deploys.

---

## Sequencing

```
This PR
   └─ PR-0  infrastructure + open questions
        └─ PR-1  Postgres port  ◀── blocks everything
             ├─ PR-1b  drop mysql2
             ├─ PR-2  page dispositions ─┐
             ├─ PR-3  engine dispositions┤
             ├─ PR-4  Sacred Seven (no-op verification)
             ├─ PR-5  9 gamification pages
             │                            │
             │   PR-6…N  ADOPT batches ◀──┘
             │        └─ PR-8  navigation
             │             └─ PR-9  Vercel config (no deploy)
             │                  └─ PR-10  cutover ⛔ separate approval
```

## Effort

| Phase | PRs | Note |
|---|---|---|
| 0 Foundation | 1 | plus answers to the open questions |
| 1 Data layer | 2 | blocking; the highest-risk PR in the plan |
| 2 Adjudication | 2 | docs only; determines Phase 4's size |
| 3 Low-risk | 2 | PR-4 likely a no-op |
| 4 Bulk pages | ~6–17 | depends entirely on PR-2's ADOPT count |
| 5 Nav + deploy | 2 (+1 gated) | |
| **Total** | **~15–26** | sized by PR-2 |

The range is wide because nobody yet knows how many of the 419 app-only pages
are genuine capability versus duplication. **PR-2 is what collapses the range**
— it is the highest-leverage item in the plan and should run as soon as PR-1
clears.
