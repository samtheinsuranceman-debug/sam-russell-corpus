# Consolidation Foundation

**Date:** 20 September 2026
**Base (canonical):** `sam-russell-corpus/russell-capital-systems` — package `russell-capital-unified`
**Branch:** `claude/consolidation-foundation`
**Scope of this PR:** documentation, CI, and tooling only. **No application code is imported here.**

This PR exists to be read and argued with before any code moves. It imports nothing, changes no route, and touches no engine, registry, manifest or test.

---

## 0. Two corrections to the directive, before anything else

Both were found by inspection, and both change what should be migrated. Neither is a reason to stop; they are a reason this PR exists.

### 0.1 The Sacred Seven is already in the base, and is *not* in `russell-capital`

The directive says to treat `russell-capital` as the donor for the Sacred Seven. It is the other way round.

| | "Sacred Seven" references | The seven pages |
|---|---|---|
| **Base** (`russell-capital-systems`) | **9 files** | `TheArrival`, `TheBrotherhood`, `TheField`, `TheLegacy`, `TheMap`, `TheMirror`, `TheStrategyTable` — all present |
| Donor (`russell-capital`) | **0 files** | none |

Importing the Sacred Seven from `russell-capital` would import nothing. Worse, a wholesale directory copy in that area would *overwrite* the real implementation with absence. **Recommendation: strike the Sacred Seven from the migration list entirely. It is already home.**

### 0.2 The behavioral schema is split, not donor-owned

| | Behavioral-schema files |
|---|---|
| **Base** | 7 |
| Donor | 2 — `behavioralBiasEngine.ts`, `clientRetentionEngine.ts` |

The base has the larger implementation. The two donor modules need a file-level diff against their base counterparts before either is chosen. Listed in §2 as **UNRESOLVED**, not as a migration.

---

## 1. Repository and capability inventory

### 1.1 Repositories

| Repo | Role | Status |
|---|---|---|
| `sam-russell-corpus` → `russell-capital-systems/` | **BASE — canonical** | Cloned, installed, verified (§3) |
| `russell-capital` | Donor — selected page/content modules | Attached and inventoried |
| `russell-capital-app` | Donor — 18 gamification routes, Postgres/Vercel patterns | **NOT ATTACHED — access denied this session.** Its 18 routes are **not** inventoried below and must not be assumed. See §6, Phase 4. |
| All others | Reference / archive | Not examined |

> **`sam-russell-corpus` is an archive, not an app repo.** It holds 6,008 files across ~45 top-level projects — brotherhood documents, audio, PDFs, biomedical research — with the application in one subdirectory. That is where the live code is and the directive says not to move hosting, so this PR works in place. But it means CI must be path-scoped (done, §5), clones are slow, and secret scanning will surface noise from non-application directories. Flagging as a known cost, not proposing a change.

### 1.2 Capability counts

| Capability | Base | Donor (`russell-capital`) |
|---|---|---|
| Routes registered | **330** | 629 |
| Portal pages | 260 | 635 |
| All pages | 325 | — |
| Shared modules | **174** | 73 |
| Shared engines | **55** | 36 |
| Server modules | 110 | 43 |
| Migrations | 5 | 11 |
| Test files | **225** | ~108 |
| Pages with `@ts-nocheck` | **189 / 260 (73%)** | 627 / 635 (99%) |

The base is healthier on every quality axis. The donor is larger on raw page count only.

---

## 2. Authoritative capability matrix

**Default for every capability: the base implementation wins.** A donor implementation is chosen only where the row says so and a documented comparison exists.

| Capability | Chosen | Rationale |
|---|---|---|
| Route registry | **Base** `shared/routeManifest.ts` | A list, not an integer — merge-safe by design, catches duplicates and swaps a count cannot. Donor has no manifest. |
| Engine registry | **Base** `shared/*Engine.ts` (55) | Larger, typechecked, test-covered. |
| Calculator pages | **Per page.** Base wins on collision | 230 paths exist in both (§4). No bulk overwrite. |
| Test suite | **Base** (225 files) | 4,138 passing, zero failures. Donor has 95 failing. |
| DB schema / migrations | **Base** (5) | Donor's 11 include MySQL-specific migrations incompatible with the base. Migration is a separate, later phase. |
| Sacred Seven | **Base** | Donor has none — see §0.1. |
| Behavioral schema | **UNRESOLVED** | Base 7 files vs donor 2. Needs file-level diff. |
| Gamification (18 routes) | **UNRESOLVED — cannot assess** | `russell-capital-app` not attached. |

### 2.1 Donor-only shared modules (15)

Present in `russell-capital`, absent from the base. These are the genuine additive candidates:

```
aiAdvisor.ts              aiModelRegistry.ts        aiProviders.ts
amtEngine.ts              clientOnboardingEngine.ts complianceDocGeneratorEngine.ts
creditCardSequencingEngine.ts  familyTreeFinancialEngine.ts  featureFlags.ts
identityVerification.ts   multiCurrencyWealthEngine.ts       pertinentLaws.ts
plasticToLiquidEngine.ts  statementDeviationEngine.ts        taxConstants2026.ts
```

Two carry a caveat that must travel with them:

- **`taxConstants2026.ts` + `amtEngine.ts`** — built and hand-verified against IRS Rev. Proc. 2025-32 this week. **The base must be checked for the same defect before these land:** the donor's `taxBracketEngine.ts` was labelled 2026 and held 2025 brackets, consumed as fact by 68 pages. If the base shares that lineage it has the same bug. **This is the highest-priority item in the entire consolidation** and is scheduled first in §6.
- **`plasticToLiquidEngine.ts`, `creditCardSequencingEngine.ts`** — related to a strategy whose stated mechanics were found to be materially wrong (see `IUL-MECHANICS-REVIEW.md` in the donor repo). **Do not migrate until reviewed.**

---

## 3. Verification of the live build

Run on the clone at `sam-russell-corpus/russell-capital-systems`, commit `76ed5f2`, on 20 September 2026.

| Step | Command | Result |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | **PASS** — lockfile honoured, 8.9s |
| Typecheck | `pnpm run check` | **PASS** — exit 0, zero errors |
| Build | `pnpm run build` | **PASS** — 330 route patterns written to `dist/public/routes.json` |
| Tests (CI subset) | `pnpm run test:ci` | **PASS** — 194 files, 3,757 passed, 5 skipped, **0 failed** |
| Tests (full) | `pnpm test` | **PASS** — 216 files, 4,138 passed, 82 skipped, **0 failed** |

**Finding: the `test:ci` exclude list is stale.** It excludes 28 test files, and the full suite shows all of them now pass. The exclusions are suppressing 381 passing tests and, more importantly, would suppress them if they later broke. **Recommendation: delete the exclude list and make `test:ci` an alias for `test`.** Not done in this PR — it changes the test configuration, which the directive puts behind a documented comparison. The comparison is above.

**Comparative baseline:** the donor (`russell-capital`) currently reports 2,275 passing and **95 failing**. The base is the healthier codebase by a wide margin, which independently supports the decision to make it canonical.

---

## 4. Route collision and dependency report

Generated by `scripts/consolidation/route-collisions.mjs`, which runs in CI and fails on regression.

| | Count |
|---|---|
| Base routes | 330 |
| Donor routes | 629 |
| **Collisions — same path in both** | **230** |
| **Donor-only — migration candidates** | **399** |
| Base-only — keep untouched | 100 |

Full lists: `collisions.txt`, `donor_only.txt`, `base_only.txt`, `base_routes.txt`, `donor_routes.txt` in this directory.

### 4.1 Reconciling the "391 pages" figure

The directive proposes 391 pages. By route path the figure is **399**. The gap is 8 and is not yet explained — likely differing treatment of parameterised routes (`/client-portal/:token`) or of non-portal routes. **The 399 list in this directory is the authoritative one** until someone reconciles it against wherever 391 came from.

### 4.2 The 230 collisions are the main risk in this project

Every one is a path where the base already serves a working page and the donor has a different implementation at the same address. A directory-level copy would silently replace 230 working pages — including `/`, `/login`, `/portal`, `/portal/admin` — with donor versions that have 99% `@ts-nocheck` coverage and come from a suite with 95 failing tests.

**Rule: no collision is resolved by import. Each requires a named decision, recorded in this file, with the losing route left registered and redirected rather than deleted.** An old link in a client's email must not 404.

---

## 5. CI, secret scanning, rollback

### 5.1 CI

`.github/workflows/consolidation-ci.yml` (added here) runs on any PR touching `russell-capital-systems/**`:

1. `pnpm install --frozen-lockfile`
2. `pnpm run check` — typecheck must be clean
3. `pnpm test` — full suite, **not** the stale `test:ci` subset
4. `pnpm run build`
5. Route manifest reconciliation — manifest vs `App.tsx`, both directions
6. Secret scan — high-entropy keys, AWS IDs, private key headers

Path-scoped so the archive's other ~45 projects do not trigger it.

### 5.2 Secret scanning

A scan of `server/`, `shared/` and `client/src/` for `sk-` keys, `AKIA` identifiers and private-key headers returned **zero findings** at `76ed5f2`. `PROVENANCE.md` records that nine Slack placeholder patterns were previously neutered for exactly this reason. CI enforces it going forward.

> **Carried over from the donor:** three legacy access codes sit in plaintext in `russell-capital` at `shared/identityVerification.ts:110` and in its git history. `identityVerification.ts` is on the donor-only migration list (§2.1). **It must not be migrated as-is.** Rotate the codes first; moving the file will not remove them from the donor's history.

### 5.3 Rollback

Before any migration PR merges, tag the current base:

```bash
git tag -a consolidation-base-2026-09-20 76ed5f2 -m "Verified base before consolidation"
git push origin consolidation-base-2026-09-20
```

Every migration PR is a single squashed commit against `master`, so rollback is `git revert <sha>`. Each phase in §6 names its own revert. No phase may span two capabilities — that is what makes a clean revert possible.

**No production deployment, DNS change, or environment-variable change is part of any phase.** Each requires separate explicit approval.

---

## 6. Phased PR plan

Each phase is one PR. Each merges only with §5.1 green. Each is independently revertible.

### Phase 0 — this PR
Docs, CI, collision tooling. No application code. **Revert:** delete the branch.

### Phase 1 — Tax constant audit *(highest priority)*
**Not a migration — an audit of the base.** Determine whether the base's tax bracket data shares the donor's defect (labelled 2026, holding 2025 figures, consumed by 68 pages).
- **Source:** `russell-capital/shared/taxConstants2026.ts`, `amtEngine.ts` (+ 32 hand-verified tests)
- **Target:** `russell-capital-systems/shared/`
- **Test criteria:** every constant asserted against IRS Rev. Proc. 2025-32 with the arithmetic shown; no expected value read back from the code.
- **Revert:** single commit; base constants untouched until the audit says otherwise.

### Phase 2 — Donor-only shared modules, excluding the flagged four
13 of the 15 in §2.1. Excludes `identityVerification.ts` (pending code rotation), `plasticToLiquidEngine.ts` and `creditCardSequencingEngine.ts` (pending mechanics review).
- **Test criteria:** each module lands with its tests; suite stays at zero failures; typecheck clean.

### Phase 3 — Donor-only routes, in batches of 20
399 candidates, ordered by the value report in the donor repo (`docs/PAGE-VALUE-REPORT.md`). Highest-value first; the 44 pages with placeholder arithmetic are **excluded** until fixed.
- **Test criteria:** route manifest updated in the same commit; reconciliation check green; no collision introduced.

### Phase 4 — Gamification (18 routes)
**Blocked.** Requires `russell-capital-app` to be attached to a session. Cannot be scoped, costed or planned until then.

### Phase 5 — Collision resolution, one capability at a time
The 230 collisions. Per capability: diff both, record the decision here, keep the losing route registered as a redirect.

### Phase 6 — Schema and migrations
Last, deliberately. The donor's migrations are MySQL-specific; the base must be confirmed compatible before any of this is attempted.

---

## 7. What is explicitly not happening

- No DNS, domain, traffic, hosting, database or credential changes.
- No wholesale repository merge.
- No overwrite of the engine registry, calculator registry, route manifest or tests without the comparison recorded above.
- No production deployment.
