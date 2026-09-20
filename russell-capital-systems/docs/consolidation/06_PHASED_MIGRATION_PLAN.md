# 06 — Phased migration plan

**Date:** 2026-09-20
**Base:** `sam-russell-corpus/russell-capital-systems`
**Scope:** 391 proposed pages · 15 missing components · 2 contested shared modules

---

## 1. Principles

1. **Reachability before acquisition.** A page that exists here and is merely
   hidden is not missing. 160 such pages exist today.
2. **One bounded capability per PR.** Every PR below is independently
   reviewable and independently revertible.
3. **Tests gate on the full suite.** `npx vitest run`, not `npm run test:ci` —
   the CI script excludes 381 tests including the schema suite (doc 05 §4).
4. **Nothing is deleted, archived or overwritten.** No donor repository is
   modified. No live file is overwritten except where this document names it.
5. **`accessControl.ts` is excluded from every PR** until the owner rules on
   the auth model. It is the one file that can change who can log in.
6. **No infrastructure.** No DNS, domain, Railway, Vercel, database,
   credential or environment-variable change appears in any PR below.

---

## 2. Dependency order

```
  PR #1  Reachability            ──┐  (no imports; unblocks judgement)
                                   │
  PR #2  5 shared components     ──┼─→ converts ~188 blocked pages to importable
                                   │
  PR #3  Contested shared modules ─┘  (taxBracketEngine, branding)
            │
            ├─→ PR #4-#9   page batches (391 pages, ~50 per PR)
            │
            ├─→ PR #10     real-estate waterfall harvest
            ├─→ PR #11     Organism subsystem (19 pages)
            └─→ PR #12     accessControl — OWNER DECISION REQUIRED
```

---

## 3. THE FIRST THREE PRs — in full

### ► PR #1 — `consolidation/01-reachability`

**Make all 330 existing routes reachable before importing anything**

| | |
|---|---|
| **Files touched** | `client/src/components/AppShell.tsx`, `client/src/App.tsx`, `server/navReachability.test.ts` (new) |
| **Pages imported** | **0** |
| **Donor code** | **none** |
| **Risk** | **Low** — navigation and tests only; no engine, schema or auth change |

**What it does**

1. Adds menu entries for the **160 routes that currently have none** (48% of
   the application), organised into an explicit section/subgroup taxonomy
   rather than a flat list.
2. Fixes the **2 dead menu links** that 404 today —
   `/portal/knowledge-library` and `/portal/tool-explorer` — by pointing them
   at real routes or removing them.
3. Adds `server/navReachability.test.ts`, which permanently fails the build if
   a route is registered in `App.tsx` with no menu entry, if a menu link points
   at a non-existent route, or if any path appears in the menu twice.
4. Adds a duplicate-declaration assertion on `App.tsx` itself — the donors each
   carry 41 duplicated route declarations (doc 04 §2.1) and the live build must
   not inherit them.

**Why first.** Until this lands, nobody can tell whether a donor page is a new
capability or a duplicate of a hidden one. It also prevents the failure mode
where importing 391 pages produces a 721-route application with 551
unreachable routes.

**Acceptance**
- `npx vitest run` green, including the new reachability test
- `stranded routes == 0`, `dead menu links == 0`, `duplicate menu paths == 0`
- `npm run build` emits 330 route patterns (unchanged)
- Menu search present and filtering by item, subgroup and section label

---

### ► PR #2 — `consolidation/02-shared-components`

**Port the five components that block 188 of the 390 pages**

| | |
|---|---|
| **Files touched** | 5 new under `client/src/components/` and `client/src/contexts/`, plus tests |
| **Pages imported** | **0** |
| **Donor code** | `russell-capital` — 5 modules |
| **Risk** | **Medium** — new shared surface; every later page batch depends on it |

**What it ports**

| Component | Pages it unblocks |
|---|---:|
| `@/components/CalculatorPDFExport` | 131 |
| `@/components/ProjectionChart50yr` | 122 |
| `@/components/CalculatorIntegration` | 116 |
| `@/components/StateTaxSelector` | 104 |
| `@/contexts/UnifiedDataBusContext` | 65 |

**Explicitly NOT in this PR:** `OrganismContext`, `useOrganism*` (5 hooks),
`NeuralMeshInterceptor`, `ComboPageWrapper`, `physicianSpecialtyDefaults`,
`toolSearchIndex`. The `Organism*` family is a subsystem, not a component, and
gets its own PR (#11).

**Constraints**
- Each component arrives with a test. Donor tests are ported where they exist;
  where they do not, tests are written. A donor component with no test does not
  land untested.
- `CalculatorIntegration` must be checked against the live build's existing
  calculator wiring before import — it is the highest collision risk of the
  five.
- ES5 emit rules apply (doc 05 §2.4).

**Acceptance**
- `npx tsc --noEmit` clean
- `npx vitest run` green, with ≥1 new test per ported component
- A throwaway smoke page importing all five compiles and renders
- `dist` size delta recorded in the PR body

---

### ► PR #3 — `consolidation/03-contested-shared-modules`

**Resolve the two shared modules whose ownership is still open**

| | |
|---|---|
| **Files touched** | `shared/taxBracketEngine.ts`, `shared/branding.ts`, `shared/householdWealth.bak.ts`, + tests |
| **Pages imported** | **0** |
| **Donor code** | `russell-capital` — 2 modules, symbol-diffed first |
| **Risk** | **Medium** — `taxBracketEngine` is load-bearing for many calculators |

**What it does**

1. **`taxBracketEngine.ts`** (live 23,123 B vs donor 23,451 B, Δ 328). Produce
   the exported-symbol diff, decide, and record the reasoning inline. If the
   donor adds a bracket year or a filing status the live build lacks, take it
   *additively* — do not replace the module.
2. **`branding.ts`** (live 2,988 B vs donor 3,405 B, Δ 417). Cosmetic surface,
   low risk. Resolve and move on.
3. **Delete or promote `shared/householdWealth.bak.ts`** — a `.bak` file
   committed into `shared/`, untested, sitting beside a live counterpart. It is
   a second implementation by accident.

**Explicitly NOT in this PR:** `accessControl.ts` and
`realEstateCapitalStackEngine.ts`. Those are PR #12 and PR #10.

**Acceptance**
- Symbol-level diff for each module pasted into the PR body
- `npx vitest run` green — in particular the tax and calculator suites
- No net reduction in exported symbols from any live module
- `householdWealth.bak.ts` is gone from `shared/`, with its disposition stated

---

## 4. Remaining phases — outline

| PR | Branch | Content | Pages | Risk |
|---|---|---|---:|---|
| **#4** | `consolidation/04-pages-batch-1` | First ~50 of the 202 zero-dependency pages | 50 | Low |
| **#5** | `consolidation/05-pages-batch-2` | Next ~50 zero-dependency pages | 50 | Low |
| **#6** | `consolidation/06-pages-batch-3` | Remaining ~102 zero-dependency pages | 102 | Low |
| **#7** | `consolidation/07-pages-batch-4` | Pages unblocked by PR #2, batch 1 | ~60 | Medium |
| **#8** | `consolidation/08-pages-batch-5` | Pages unblocked by PR #2, batch 2 | ~60 | Medium |
| **#9** | `consolidation/09-pages-batch-6` | Pages unblocked by PR #2, batch 3 | ~50 | Medium |
| **#10** | `consolidation/10-realestate-waterfall` | `runWaterfall`, `STANDARD_WATERFALL`, `debtConstant`, `goingInCapRate`, `weightedAverageDebtCost`, `amortizeLayer` — into the existing modules, reusing live `irr`/`npv`/`pmt`. Port the donor's `realEstateCapitalStack.test.ts` **first**. | 0 | Medium |
| **#11** | `consolidation/11-organism-subsystem` | `OrganismContext`, 5 `useOrganism*` hooks, `NeuralMeshInterceptor` + the 19 pages that need them | 19 | Medium |
| **#12** | `consolidation/12-access-control` | **BLOCKED — owner decision required.** Password model vs email-allowlist model. | 0 | **HIGH** |

Every page batch carries, in its PR body: the exact route list, confirmation of
no route collision, the `dist` size delta, and a menu entry for every page added
(PR #1's test enforces this automatically).

---

## 5. PR #12 — the decision only the owner can make

`shared/accessControl.ts` exists in two incompatible forms:

| | Live | Donor |
|---|---|---|
| Model | password | email allowlist |
| Exports | `ETERNAL_PASSWORDS`, `isValidPassword` | `AUTHORIZED_EMAIL`, `PORTAL_ALLOWED_EMAILS`, `SESSION_VERSION`, `isAuthorizedEmail`, `isPortalAllowedEmail` |

No symbol is shared. Both sides ship an `accessControl.test.ts` encoding
different expectations, so a green suite on either side proves nothing about
the other. Taking the donor, or taking the union, **changes who can log into
the portal**.

**Three questions the owner must answer before PR #12 can be drafted:**

1. Which model is intended going forward — password, email allowlist, or both?
2. If allowlist: who is on it, and is `PORTAL_ALLOWED_EMAILS` the live source
   of truth or a stale snapshot?
3. What is `SESSION_VERSION` for — forced logout on deploy? If it ships, every
   existing session is invalidated.

Until these are answered, `accessControl.ts` is untouched by every PR above.

---

## 6. What this plan explicitly does not do

- ❌ No merge to `master` — every PR is opened for review
- ❌ No deployment
- ❌ No DNS, domain, GoDaddy, Railway, Vercel change
- ❌ No database migration, schema change or credential touch
- ❌ No environment-variable change
- ❌ No repository deleted, archived or overwritten — the standalone copies stay
     exactly where they are and simply stop being maintained
- ❌ No page import begins until this foundation PR is reviewed

---

## 7. Totals

| Phase | PRs | Pages | Net new files (est.) |
|---|---:|---:|---:|
| Foundation (this PR) | 1 | 0 | 7 docs |
| Reachability + components + shared | 3 | 0 | ~10 |
| Page batches | 6 | 372 | ~372 |
| Waterfall + Organism | 2 | 19 | ~27 |
| Access control | 1 | 0 | 1 |
| **Total** | **13** | **391** | **~417** |

Ending state: **721 routes, all reachable from the menu**, one authoritative
implementation per capability, and a test that makes a hidden page impossible
to add again.
