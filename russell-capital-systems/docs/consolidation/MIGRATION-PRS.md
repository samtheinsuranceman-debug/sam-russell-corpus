# The first three migration PRs

Exact scope, source paths, target paths, test criteria and rollback for each. **None of these opens until the foundation PR is reviewed.**

Every one of them: single squashed commit, CI green (`.github/workflows/consolidation-ci.yml`), reverted by `git revert <sha>`, no DNS / hosting / database / credential / environment change, no deployment.

Before the first one merges:

```bash
git tag -a consolidation-base-2026-09-20 76ed5f2 -m "Verified base before consolidation"
git push origin consolidation-base-2026-09-20
```

---

## PR 1 — Tax constant audit

**Branch:** `claude/consolidation-01-tax-audit`
**This is an audit of the base, not an import.** Nothing is migrated unless the audit finds a defect.

### Why first

In the donor, `shared/taxBracketEngine.ts` was labelled 2026 and its own comment described the figures as "projected from TCJA sunset provisions". They were the 2025 brackets — single bands starting 11,925 / 48,475 / 103,350, standard deduction 15,700 — a forecast made before OBBBA passed in July 2025, and the forecast did not survive the Act. **68 pages consumed them as fact.**

The base has its own tax data. If it shares that lineage it has the same defect, and every tax figure the platform shows is wrong by roughly the width of a bracket. Nothing else in the consolidation matters more than knowing this, and it is cheap to check.

### Step 1 — audit (no code moves)

Compare the base's tax constants against IRS Revenue Procedure 2025-32 (IR-2025-103, 9 Oct 2025):

| Figure | Correct 2026 |
|---|---|
| Single brackets | 12,400 / 50,400 / 105,700 / 201,775 / 256,225 / 640,600 |
| Joint brackets | 24,800 / 100,800 / 211,400 / 403,550 / 512,450 / 768,700 |
| Standard deduction | 16,100 single · 32,200 joint · 24,150 HoH |
| AMT exemption | 90,100 single · 140,200 joint |
| AMT phaseout | begins 500,000 / 1,000,000, at **50c per dollar** (OBBBA accelerated this from 25c) |

**If the base is correct:** the PR contains the audit record only. Done.

### Step 2 — remediate, only if the audit finds a defect

| | |
|---|---|
| **Source** | `russell-capital/shared/taxConstants2026.ts`<br>`russell-capital/shared/amtEngine.ts`<br>`russell-capital/server/amtEngine.test.ts` (32 tests) |
| **Target** | `russell-capital-systems/shared/taxConstants2026.ts`<br>`russell-capital-systems/shared/amtEngine.ts`<br>`russell-capital-systems/server/amtEngine.test.ts` |
| **Also** | Repoint the base's existing bracket engine at the sourced constants. Its bracket-walking logic is not touched — only the numbers it reads. |

### Test criteria

- Every constant asserted against Rev. Proc. 2025-32, **with the arithmetic shown in the test comment**. No expected value may be read back from the code — that proves only determinism, which is how the original defect survived.
- Bracket tables verified contiguous, ascending, starting at 0 and ending at Infinity.
- Full suite stays at zero failures. Typecheck clean.
- If any downstream page's displayed figure changes, that change is listed in the PR body with its before and after.

### Rollback

`git revert <sha>`. If the audit finds no defect, there is nothing to revert.

---

## PR 2 — Donor-only shared modules

**Branch:** `claude/consolidation-02-shared-modules`
**Scope:** 12 modules present in the donor and absent from the base. Purely additive — no base file is modified.

| Source (`russell-capital/shared/`) | What it is |
|---|---|
| `aiAdvisor.ts` | Advisor identity, prompt construction |
| `aiModelRegistry.ts` | Model catalogue |
| `aiProviders.ts` | 21-provider definitions, three wire formats |
| `clientOnboardingEngine.ts` | Onboarding flow |
| `complianceDocGeneratorEngine.ts` | Compliance document generation |
| `familyTreeFinancialEngine.ts` | Multi-generational modelling |
| `featureFlags.ts` | Flag definitions |
| `multiCurrencyWealthEngine.ts` | FX-aware wealth modelling |
| `pertinentLaws.ts` | Statute reference data |
| `statementDeviationEngine.ts` | Statement vs brochure deviation |

Plus, only if PR 1 did not already move them: `taxConstants2026.ts`, `amtEngine.ts`.

**Target:** `russell-capital-systems/shared/<same filename>`

### Deliberately excluded — three modules

| Module | Why held back |
|---|---|
| `identityVerification.ts` | Contains three legacy access codes in plaintext at line 110, and they are in the donor's git history. **Rotate the codes first.** Moving the file does not remove them from that history. |
| `plasticToLiquidEngine.ts` | Implements a strategy whose stated mechanics were found materially wrong — index credits do not land on a figure that survives withdrawal; rapid fund-and-withdraw triggers the 7-pay test under IRC §7702A and permanently makes the policy a MEC. See `IUL-MECHANICS-REVIEW.md` in the donor. |
| `creditCardSequencingEngine.ts` | Same review. Also touches Regulation Z §1026.51 ability-to-pay territory and needs legal review before it ships. |

### Test criteria

- Each module lands **with its tests**. A module with no test does not move in this PR; it gets one first.
- Typecheck clean. Full suite at zero failures.
- No base file modified — verified by the diff touching only new paths under `shared/` and `server/`.
- No new route registered, so the route manifest is unchanged.

### Rollback

`git revert <sha>`. Additive only, so the revert cannot orphan a base caller.

---

## PR 3 — First route batch (20 pages)

**Branch:** `claude/consolidation-03-routes-batch-01`
**Scope:** 20 of the 399 donor-only routes. **Zero collisions** — every path in this batch is verified absent from the base.

### Selection rules

1. **Donor-only.** Any path in `collisions.txt` is out — collisions are Phase 5 and need a named decision each.
2. **Excluded: the 44 pages with placeholder arithmetic.** Listed in the donor's `docs/PAGE-VALUE-REPORT.md`. A page that returns a confidently wrong number is worth less than no page, and importing it spreads the problem into a healthier codebase.
3. **Ordered by value**, after the two competing rubrics are reconciled — the base's own 231-page `audit/full_page_audit_corpus.json` and the donor's 635-page report. **That reconciliation happens in this PR's planning, and the resulting order goes in the PR body.**
4. Each page's dependencies must already be present — from PR 2, or already in the base. No page arrives with a missing import.

**Source:** `russell-capital/client/src/pages/portal/<Page>.tsx`
**Target:** `russell-capital-systems/client/src/pages/portal/<Page>.tsx`
**Also:** route registration in `client/src/App.tsx` **and** the path added to `shared/routeManifest.ts` **in the same commit**.

### Test criteria

- `node scripts/consolidation/route-collisions.mjs --check` green — manifest and `App.tsx` agree in both directions.
- Collision count unchanged at 230. A migration that creates a collision fails the PR.
- Typecheck clean **with `@ts-nocheck` removed from every imported page.** The donor is 99% `@ts-nocheck`; carrying that in would import the blindness along with the code. If a page cannot typecheck, it is not ready and it drops out of the batch.
- Full suite at zero failures.
- Every imported page reached in a browser and confirmed to render.

### Rollback

`git revert <sha>` removes the pages, their route registrations and their manifest lines together — which is precisely why registration and manifest live in the same commit.

---

## Sequencing

```
        ┌─ PR 1  tax audit ─────────────── must complete first
        │
        ├─ PR 2  shared modules ────────── may run parallel to PR 1
        │
        └─ PR 3  route batch 01 ────────── needs PR 2 merged (dependencies)
```

PR 1 and PR 2 are independent. PR 3 waits on PR 2 so no page arrives with a missing import.

**Phase 4 (gamification, 18 routes) remains blocked** — `russell-capital-app` is not attached to a session and its routes cannot be inventoried, scoped or costed until it is.
