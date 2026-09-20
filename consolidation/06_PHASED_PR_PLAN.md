# 6 · Phased PR Plan

**Date:** 2026-09-20 · **Rule:** one bounded capability per PR. Each lands green
before the next opens. No PR touches a registry except by *adding* through that
registry's own mechanism.

**Target branch for PR-05 onward depends on the §3 decision in
[05_CI_SECRETS_ROLLBACK.md](05_CI_SECRETS_ROLLBACK.md).** Under the recommended
Option A, every PR below targets `consolidation/integration`, and `master` is
touched once at the end with explicit approval.

Shorthand: **BASE** = `sam-russell-corpus/russell-capital-systems` ·
**RC** = `samtheinsuranceman-debug/russell-capital` @ `origin/main` ·
**APP** = `samtheinsuranceman-debug/russell-capital-app` @ `main`.

---

## Sequence

| PR | Capability | Files | Risk | Blocks |
|---|---|---:|---|---|
| **00** | Foundation (this PR) | 8 | none | everything |
| **01** | Correct `CLAUDE.md` | 1 | none | — |
| **02** | Resolve the duplicate `russell-capital/` subtree | decision | low | — |
| **03** | Deployment-coupling decision | 0–1 | **high** | PR-05+ |
| **04** | Sacred Seven comparison (read-only) | 0 | none | — |
| **05a** | `UnifiedDataBusContext` prerequisite | 1–2 | med | 05b, 05c |
| **05b** | 6 gamification pages | 7 | low | — |
| **05c** | 3 gamification pages + their deps | 6 | med | — |
| **06** | 4 engines + behavioral-schema diff | 4–6 | med | — |
| **07** | 3 APP-exclusive routes | 4 | low | gated on 10 |
| **08** | Triage the remaining 382 (report only) | 1 | none | — |
| **09** | Plastic to Cash + Mutual Carriers | 4 | low | — |
| **10** | Nav architecture decision | decision | **high** | 07 |

---

## PR-00 · Foundation *(this PR)*

**Source** — n/a. **Target** — `consolidation/`, `.github/workflows/`.

Adds 6 documents, 2 generated JSON artifacts, 1 regeneration script, 1 CI
workflow. **Touches no file under `russell-capital-systems/`**, so merging
cannot trigger `deploy-branch.yml`.

**Test criteria** — gate workflow green; `git diff --name-only master... | grep
russell-capital-systems/` returns empty.

**Rollback** — revert the merge; nothing else is affected.

---

## PR-01 · Correct `CLAUDE.md`

**Source** — n/a. **Target** — `CLAUDE.md` (repo root).

The file calls this repo "primarily a content corpus, not a software project,"
says "there is no repo-wide build, test, or lint," documents a
`russell-capital/` prototype — and **never mentions `russell-capital-systems/`**,
the 330-route application that is now the canonical base. Any agent or
contributor reading it is pointed at the wrong tree.

Add a section covering `russell-capital-systems/`: its scripts, its registries,
the three-way route-count invariant, and the deploy coupling.

**Test criteria** — docs only; gate green. **Rollback** — revert.

---

## PR-02 · Resolve the duplicate `russell-capital/` subtree

**Source** — n/a. **Target** — `russell-capital/` (repo root subtree).

The base repo contains **two** Russell Capital trees: `russell-capital/` (294
`.tsx`, documented in `CLAUDE.md` as a prototype) and
`russell-capital-systems/` (the base). A path filter or a careless search can
hit the wrong one — and `deploy-branch.yml` keys on a path prefix.

**Proposal:** confirm `russell-capital/` is superseded, then either move it to
`archive/russell-capital-prototype/` or remove it, retaining history.

**Needs your confirmation before acting** — it may hold something not in the
base. A file-level diff against the base ships with the PR.

**Test criteria** — full build + test suite unchanged; no import resolves into
the moved tree. **Rollback** — `git revert`; history retains the files either way.

---

## PR-03 · Deployment-coupling decision

**Blocks PR-05 onward.** See [05](05_CI_SECRETS_ROLLBACK.md) §3.

Under **Option A** (recommended) this PR creates `consolidation/integration` from
`master` and changes no file. Under B or C it modifies `deploy-branch.yml`.

**Test criteria** — Option A: branch exists, `deploy-branch.yml` unmodified.
**Rollback** — delete the branch.

---

## PR-04 · Sacred Seven comparison (read-only)

**Source** — BASE and APP. **Target** — `consolidation/07_SACRED_SEVEN_DIFF.md`.

The capability matrix concludes the Sacred Seven are already in the base, in a
fuller form ([02](02_CAPABILITY_MATRIX.md) §4). `TheStrategyTable.tsx` is **39%
larger** in the base (15,080 b vs 10,829 b); the other six differ by 5–20 bytes.

This PR records the byte-level diff to confirm the small deltas are cosmetic and
nothing in the donor copies is worth back-porting. **Migrates nothing.**

```bash
for f in TheArrival TheBrotherhood TheField TheLegacy TheMap TheMirror TheStrategyTable; do
  diff -u russell-capital-systems/client/src/pages/portal/$f.tsx \
          ../russell-capital-app/client/src/pages/portal/$f.tsx
done
```

**Test criteria** — docs only. **Rollback** — revert.

---

## PR-05a · `UnifiedDataBusContext` prerequisite

**Source** — `RC:client/src/contexts/UnifiedDataBusContext.tsx`
**Target** — `russell-capital-systems/client/src/contexts/UnifiedDataBusContext.tsx`

**8 of the 9** gamification pages import this, and the base has no equivalent
([04](04_ROUTE_COLLISION_REPORT.md) §4). It must land, or be mapped onto a base
context, before any of those pages can compile.

**Do first:** determine whether the base's existing `ClientDataContext` /
`AIBrainContext` / `StrategyContext` already cover its surface. If they do,
**adapt the 8 pages instead of adding a ninth context** — the base has 7
contexts and does not need an overlapping eighth.

**Test criteria** — `pnpm check` exit 0; `pnpm test:ci` ≥ 194 files / 3,757
tests; route counts unchanged at 330 (this PR adds no route); provider mounted in
`App.tsx` only if genuinely required.

**Rollback** — revert; no other file depends on it until 05b.

---

## PR-05b · Six gamification pages

**Source** (RC `client/src/pages/portal/`) → **Target** (BASE, same relative path):

| Component | Route | Lines |
|---|---|---:|
| `WealthWarriorChallenges.tsx` | `/portal/wealth-warrior` | 257 |
| `WealthOdyssey.tsx` | `/portal/wealth-odyssey` | 314 |
| `EliteShowdown.tsx` | `/portal/elite-showdown` | 260 |
| `HolographicMirage.tsx` | `/portal/holographic-mirage` | 247 |
| `PredictiveInsightArena.tsx` | `/portal/predictive-arena` | 315 |
| `MoatFortress.tsx` | `/portal/moat-fortress` | 278 |

Each depends only on `UnifiedDataBusContext` (PR-05a) plus modules already in the
base. **Zero route collisions.**

Also edit — **by addition only**:
- `client/src/App.tsx` — 6 lazy imports + 6 `<Route>` entries
- `shared/routeManifest.ts` — 6 paths (required; gate 3 fails otherwise)
- `docs/audit/pageRegistry.json` — 6 entries, following the existing schema

**Test criteria**
- `pnpm check` exit 0 — donor pages carry `// @ts-nocheck`; expect to fix real
  type errors here, and fix them rather than propagate the suppression
- `pnpm build` exit 0, **336 route patterns** emitted
- Route agreement: `App.tsx` = `routeManifest` = `routes.json` = **336**
- Zero duplicate routes
- `pnpm test:ci` ≥ 194 files / 3,757 tests
- Each of the 6 routes renders without console errors

**Rollback** — `git revert -m 1 <merge-sha>`; route count returns to 330.

---

## PR-05c · Three gamification pages + their dependencies

| Component | Route | Lines | Extra dependencies |
|---|---|---:|---|
| `GamifiedPavlovianEngagement.tsx` | `/portal/pavlovian-engagement` | 703 | `CalculatorIntegration`, `ComboPageWrapper` |
| `EntrainmentEngine.tsx` | `/portal/entrainment-engine` | 718 | `CalculatorIntegration`, `ComboPageWrapper` |
| `StrategyComparisonArena.tsx` | `/portal/strategy-comparison` | 119 | `CalculatorIntegration`, `useOrganismSkeleton` |

Separated from 05b because these three need modules the base lacks.

**Check first:** the base has `hooks/useCalculatorIntegration.ts`,
`components/RelatedCalculators.tsx` and `components/CalculationSyncBar.tsx` —
likely a refactored form of the donor's `components/CalculatorIntegration`.
Prefer adapting the three pages to the base's API over importing a parallel one.

Note the base **already has `contexts/EntrainmentEngine.tsx`** — the context
exists; only the page is missing. Confirm the donor page binds to the base's
context, not a second copy.

**Test criteria** — as 05b, at **339 routes**.
**Rollback** — revert; 05b is unaffected.

---

## PR-06 · Four engines + behavioral-schema diff

**Source** (RC `shared/`) → **Target** (BASE `shared/`):

`clientOnboardingEngine.ts` · `complianceDocGeneratorEngine.ts` ·
`familyTreeFinancialEngine.ts` · `multiCurrencyWealthEngine.ts`

The only four engines in RC absent from the base (base 55, RC 32).

Also in this PR, **report-only**: byte-diff
`shared/behavioralBiasEngine.ts` and `shared/clientRetentionEngine.ts` between
base and RC. Default is **BASE**; changing either requires the diff in the PR
body plus a passing test that demonstrates the donor behaviour is correct.

**Test criteria**
- `pnpm check` exit 0
- Engine count **59** (gate floor is 55 — growth is fine, shrinkage is not)
- `pnpm test:ci` ≥ 194 / 3,757
- Each migrated engine ships a unit test, or the PR states why not
- Route counts unchanged

**Rollback** — revert; engines are additive and nothing imports them until wired.

---

## PR-07 · Three `russell-capital-app`-exclusive routes

`/portal/lab` · `/portal/nav-placeholder` · `/portal/reveal-demo`

**Gated on PR-10.** All three exist to serve that tree's nav architecture; they
are meaningless without the decision in PR-10, and `/portal/nav-placeholder`
depends on `navConfig.ts`/`navTree.ts` specifically.

**Do not open before PR-10 is decided.**

---

## PR-08 · Triage the remaining 382 (report only)

**Target** — `consolidation/08_ROUTE_TRIAGE.md`. **Migrates nothing.**

For each of the 382 routes present in both donors but absent from the base,
record: does the base serve the capability under another route? does
`pageRegistry.json` already score it? is it one of APP's 41 shadowed routes? what
does it depend on? → verdict: `adopt` / `already-covered` / `dead-in-donor` /
`retire`.

Output is the backlog for any PR-11+. Each adopted route then gets its own
bounded PR — never a block import.

**Test criteria** — docs only; every one of the 382 carries a verdict.

---

## PR-09 · Plastic to Cash + Mutual Carriers

**Source** — branch `claude/russell-capital-consolidation-kbwl81` in RC
(an earlier session, superseded plan — **archive, not donor**):

| Source | Target |
|---|---|
| `client/src/data/plasticToCash.ts` | `russell-capital-systems/client/src/data/plasticToCash.ts` |
| `client/src/pages/portal/PlasticToCash.tsx` | same relative path under BASE |
| `client/src/pages/portal/MutualCarriers.tsx` | same relative path under BASE |

Net-new; exists nowhere else. Standalone — two pages plus one data module, no
registry edits beyond the additive route/manifest/registry entries.

**Re-review from scratch.** Specifically:
- Carrier credit-card acceptance is **unverified** — the `verify` status fields
  must stay truthful, and the page must keep saying so
- Compliance disclosures must match the base's `ComplianceFooter` /
  `ComplianceGate` conventions, which may differ from the donor's
- The IUL projection engine should be moved into `shared/` as a proper engine and
  registered, rather than living inline in the page, to match base conventions

**Test criteria** — as 05b, at **341 routes**; both routes in
`calculatorCatalog.ts` if they qualify as calculators (the catalogue test will
fail if a path does not resolve); disclosure text reviewed.

**Rollback** — revert; fully self-contained.

---

## PR-10 · Nav architecture decision

**Source** — `APP:client/src/navTree.ts` (1,058 lines) + `navConfig.ts` (640).

A 5-level recursive tree with `ROUTE_LAYER` tagging (L1/L2/L3/CUT/MERGE),
favourites, quality-score badges and breadcrumbs.

**Weigh honestly:** the tree that carries this scheme still has **41 duplicate
routes**; the base, without it, has **zero**. The scheme did not prevent the
failure it targets. Its real value is *surfacing* — deciding which of many routes
belong in the primary menu — which is a different problem from correctness, and
one the base's `pageRegistry.json` value scores may already address.

**Deliverable:** a written recommendation — adopt / adapt / decline — with the
base's existing `AppShell` navigation evaluated against it. **No code in this
PR.** If adopted, implementation follows as PR-10a with its own gates.

---

## Cumulative route budget

| After | Routes | Manifest | Emitted |
|---|---:|---:|---:|
| baseline | 330 | 330 | 330 |
| PR-05b | 336 | 336 | 336 |
| PR-05c | 339 | 339 | 339 |
| PR-09 | 341 | 341 | 341 |

All three numbers must agree at every step — CI gate 3.

---

## What is explicitly NOT in this plan

- Any DNS, domain, or hosting change
- Any database migration, including the MySQL → PostgreSQL port
- Any credential handling
- Any production deployment
- Any wholesale repository merge
- Any overwrite of `routeManifest.ts`, `calculatorCatalog.ts`,
  `pageRegistry.json`, the engine set, or an existing test

Each would need its own proposal and its own explicit approval.
