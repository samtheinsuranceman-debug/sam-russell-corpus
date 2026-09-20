# 7 · Base Repo Head-to-Head

**Date:** 2026-09-20 · **Status:** open decision, no code moved
**Question:** which repository becomes the single consolidated app repo?

Both candidates were put through identical gates in one session, on the same
machine, with no database and no credentials. This document records what came
back. It argues for one option but does not act on it.

---

## 0 · Settled, not in dispute

- **`russell-capital-domain-redirect` is the live repo.** It holds
  `CNAME → russellcapitalsystems.com`. Verified.
- **The platform must not be merged into it.** It is a GitHub Pages static site
  of three files (`index.html` 4,198 b, `404.html`, `CNAME`). A 330-route
  React + Express + tRPC application cannot live there.
- **The platform should be consolidated into one app repository.**

Only the choice of *that* repository is open.

---

## 1 · Gate results — identical commands, same session

| Gate | `russell-capital-systems` | `russell-capital-app` |
|---|---|---|
| `pnpm install` | ✅ 6.6 s | ✅ 8.4 s |
| typecheck | ✅ exit 0 | ✅ exit 0 |
| build | ✅ exit 0 | ✅ exit 0 |
| **tests** | ✅ **216 files / 4,138 tests, exit 0** | ❌ **25 files fail / 113 tests fail, exit 1** |
| curated CI suite | ✅ `test:ci` — 194 / 3,757 | ❌ none defined |

Both typecheck and build. They diverge on tests.

### The failures in `russell-capital-app` are real, not environmental

Checked individually rather than assumed:

| Test | Failure | Reading |
|---|---|---|
| `accessControl.test.ts` | `expected [] to have a length of 3` | **The approved-password list is empty.** The owner auth gate does not function. |
| `batch8-wiring.test.ts` | `ENOENT: … /pages/portal/Endgame.tsx` | The file cannot collect at all — it references a page that was deleted. |
| `organism-wiring.test.ts` | `expected App.tsx to contain 'strategy-comparison'` | Wiring assertions for routes that were removed. |

The pattern: **that repository's consolidation deleted pages but left the tests
that assert those pages exist.** The work was stopped partway and nothing has
been holding the line, because there is no CI test script.

For contrast, the 20 failing server tests in donor `russell-capital` *were*
verified environmental — they fail identically at that repo's own untouched
`HEAD` and need a live server on `:3000`. The failures above are a different
class.

---

## 2 · The five claimed advantages, each checked

### 2.1 Shared calculator-data layer — *half right, and it inverts on quality*

| | `russell-capital-app` | `russell-capital-systems` |
|---|---|---|
| Mechanism | `FinancialDataContext` + `useSharedField` | `ClientDataContext` (+ `StrategyContext`, `CalculationSyncBar`, `useCalculatorIntegration`) |
| Pages using it | **305 of 722 (42%)** | 113 of 325 (35%) |
| Persistence | **`localStorage` only** | **Server — tRPC + auth** |
| Schema | 11 named fields + open index signature | **~30 typed fields** in `ClientFactFinderData` |
| Bound to data model | no | **`clients` + `household_fact_finders` tables**, via `assessmentBridge` |

**Adoption is genuinely broader in `russell-capital-app` — that part of the claim
holds.** But the base's layer is the better one. It persists per client to the
database behind authentication; the app's persists to one browser.

For an advisor carrying a book of clients, `localStorage` **cannot** hold
per-client state — it is one blob per browser, with no notion of which client is
open. That is an architectural ceiling, not a gap in coverage.

**Implication:** widen the base's layer, don't adopt the weaker one. The 7-point
adoption difference is a porting exercise; the persistence model is not.

### 2.2 Recursive navigation — *correct, `russell-capital-app` wins*

| | `russell-capital-app` | `russell-capital-systems` |
|---|---|---|
| Structure | `navTree.ts` — **1,058 lines, 5-level recursive** | `AppShell.tsx` — 1,380 lines, flat |
| Layering | `navConfig.ts` — 640 lines, `ROUTE_LAYER` L1/L2/L3/CUT/MERGE | none |
| Extras | favourites, quality-score badges, breadcrumbs, placeholders | none |

**This is a real advantage and the base has no equivalent.** It is also two
files, and portable.

One caveat worth stating: the tree carrying this scheme still has **41 duplicate
routes**, so it did not prevent the failure it targets. Its value is *surfacing*
— choosing what belongs in the primary menu — not correctness.

### 2.3 Consolidation manifest — *the base is well ahead*

| `russell-capital-app` | `russell-capital-systems` |
|---|---|
| `CONSOLIDATION_PLAN.json` (1.0 MB) | `PARTS_MANIFEST.json` · `PROVENANCE.md` · `MASTER_BUILD_AND_STRATEGY.md` · `PAGE_AUDIT.csv` / `.md` · **`PLAN_RECONCILIATION.csv` / `.md`** · `PAGE_UPGRADE_SPEC.md` · `pageRegistry.json` (309 scored pages) · `audit/route_manifest.json` · `audit/full_page_audit_corpus.json` · `audit/page_inputs/` · `scripts/reconcile-route-manifest.mjs` |

The app's file is a **plan** — an input to a consolidation that was not
finished. The base's set includes **reconciliation** documents, which is the
record of consolidation actually performed.

### 2.4 API folder — *a deploy shim, not a capability*

`russell-capital-app/api/` contains **one file**, `index.ts`: a Vercel
serverless adapter wrapping the same Express + tRPC application the base runs at
`server/_core/index.ts`. It adds no capability.

### 2.5 Vercel configuration — *real, but host preference, not repo property*

`vercel.json` exists in `russell-capital-app`. The base has a working Railway
pipeline today (`deploy-branch.yml` → `deploy/rcs`).

**Either host can be served from either repo.** Porting `vercel.json` +
`api/index.ts` into the base is a small, self-contained PR. This point does not
bear on which repo is the base.

---

## 3 · What the other column holds

Measured, not asserted:

| | `russell-capital-systems` | `russell-capital-app` |
|---|---:|---:|
| Routes (declared / unique) | 330 / **330** | 653 / 612 |
| **Duplicate routes** | **0** | **41** |
| Route manifest, build-verified | **yes (330 = 330 = 330)** | none |
| Calculator catalogue, test-verified | **116** | none |
| Page registry | **309 scored** | none |
| Engines | **55** | 32 |
| `shared/` modules | **174** | ~63 |
| Test files | **225** | ~98 |
| Passing tests | **4,138** | 2,030 (113 failing) |

The 41 duplicates mean 41 components in that build are unreachable — `wouter`
matches the first declaration and shadows the rest.

---

## 4 · Cost of each direction

### A · Base = `russell-capital-systems` *(recommended)*

Port in from `russell-capital-app`:
1. `navTree.ts` + `navConfig.ts` — the recursive nav (2 files)
2. Widen `ClientDataContext` adoption from 113 → toward 305 pages, using the
   base's server-backed context rather than the app's localStorage one
3. Optionally `vercel.json` + `api/index.ts` if Vercel is wanted

≈ 5 files in, plus a bounded adoption pass. Registries, tests, engines and the
green suite are already in place.

### B · Base = `russell-capital-app`

Before any feature work:
1. Repair the owner auth gate (approved-password list is empty)
2. Reconcile tests against deleted pages (`Endgame.tsx` and others)
3. Fix **41** duplicate routes
4. Build a route manifest and wire it into the build
5. Build a calculator catalogue and its verifying test
6. Build a page registry
7. Port **23** engines and **127** test files from the base
8. Establish a `test:ci` boundary
9. Get from 113 failing tests to zero

Then migrate the base's route surface in.

---

## 5 · Recommendation

**Same destination, different vehicle.** Consolidate into
`russell-capital-systems`, and port the two things `russell-capital-app`
genuinely does better — the recursive nav tree, and broader data-layer
adoption applied to the base's stronger context.

The two claimed advantages that are real are both portable in a handful of
files. The governance, test coverage and engine surface that would have to move
the other way are not.

---

## 6 · If the decision is `russell-capital-app` anyway

This is a legitimate call — there may be reasons outside the code (Vercel
account, cost, team familiarity, existing pipelines) that outweigh the above.
If so, the sequence changes but the discipline does not:

1. Close PR #158; re-target the foundation package at `russell-capital-app`
2. **PR-A:** repair the auth gate — with a regression test
3. **PR-B:** reconcile tests against deleted pages
4. **PR-C:** de-duplicate the 41 routes
5. **PR-D:** add a route manifest + `test:ci` + the consolidation gate
6. **PR-E onward:** port registries, engines and tests from
   `russell-capital-systems`
7. Only then migrate features

Steps 2–5 are prerequisites, not optional cleanup: without them there is no
green baseline to measure any migration against, which is the thing the
foundation PR exists to establish.

---

## 7 · Reproducing

```bash
# base
cd sam-russell-corpus/russell-capital-systems
pnpm install && pnpm check && pnpm build && pnpm test      # expect exit 0, 4138 tests

# candidate
cd russell-capital-app
pnpm install && pnpm check && pnpm build && npx vitest run # expect exit 1, 113 failures
npx vitest run server/accessControl.test.ts                # empty password list
npx vitest run server/batch8-wiring.test.ts                # ENOENT Endgame.tsx
```
