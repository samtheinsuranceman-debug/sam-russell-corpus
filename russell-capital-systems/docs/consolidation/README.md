# Consolidation foundation audit

**Date:** 2026-09-20
**Consolidation base:** `samtheinsuranceman-debug/sam-russell-corpus`
**Branch:** `claude/consolidation-foundation-audit`, cut from `master` @ `76ed5f2`

Documentation only. No code, dependency, schema, route, credential or
infrastructure change is in this PR.

---

## Read in this order

| # | Document | Answers |
|---|---|---|
| [01](01_REPOSITORY_INVENTORY.md) | Repository inventory | What exists, in 21 repositories |
| [02](02_CAPABILITY_MATRIX.md) | Capability matrix | Which implementation is authoritative, and why |
| [03](03_VERIFICATION.md) | Verification | Does the base install, typecheck, build and test |
| [04](04_ROUTE_COLLISIONS_AND_DEPENDENCIES.md) | Collisions & dependencies | What breaks if the 391 pages land |
| [05](05_CI_AND_SECRET_SCAN.md) | CI & secret scan | How to run it; is anything leaking |
| [06](06_PHASED_MIGRATION_PLAN.md) | Phased migration plan | The 13 PRs, in order |

---

## The six findings that shape everything else

**1. `sam-russell-corpus` already contains the other projects.**
Designating it the base is not a migration — it is a decision to stop
maintaining the standalone copies. *(doc 01 §2)*

**2. 19 of 21 repositories have exactly one commit.**
They are snapshot dumps. Git cannot arbitrate which of two divergent files
came later, so every "which version wins" call is made on content and tests.
There are two real donors, not twenty-one. *(doc 01 §2-4)*

**3. The base is sound, but `npm install` fails.**
`pnpm install --frozen-lockfile` → exit 0. `npm install` → **exit 1**. The repo
is a pnpm project with a committed lockfile and a `packageManager` field; npm
is simply the wrong tool. A documentation defect, not a code defect.
Typecheck, build and all 4,138 tests pass. *(doc 03)*

**4. 160 of 330 existing routes have no menu entry — 48% of the application.**
They are built, routed and tested, and unreachable. This is fixed before
anything is imported, or donor pages get migrated to replace capabilities that
already exist. *(doc 04 §5)*

**5. The 391 pages are almost entirely additive, and blocked by five files.**
Zero route collisions. Only 2 file collisions, both trivial (Δ ≤ 132 bytes),
both resolved in favour of the live build. No page imports a missing engine.
But **15 missing components block 188 of 390 pages** — and five of them
(`CalculatorPDFExport`, `ProjectionChart50yr`, `CalculatorIntegration`,
`StateTaxSelector`, `UnifiedDataBusContext`) account for nearly all of it.
**202 pages are importable today with no missing dependency.** *(doc 04 §3-4)*

**6. One file can change who logs in, and only the owner can rule on it.**
`shared/accessControl.ts` exists in two incompatible forms — password model vs
email-allowlist model, no shared symbols, both with passing tests that encode
different expectations. It is excluded from every migration PR until the owner
decides. *(doc 02 §3.1, doc 06 §5)*

---

## Verification summary

| Check | Command | Exit | Result |
|---|---|:--:|---|
| Install (pnpm) | `pnpm install --frozen-lockfile` | 0 | ✅ 1.6s |
| Install (npm) | `npm install` | **1** | ❌ wrong package manager |
| Typecheck | `npx tsc --noEmit` | 0 | ✅ 0 errors |
| Build | `npm run build` | 0 | ✅ 330 routes, 402+ chunks |
| Tests (full) | `npx vitest run` | 0 | ✅ 4,138 passed / 82 skipped |
| Tests (CI) | `npm run test:ci` | 0 | ✅ 3,757 passed / 5 skipped |
| Secret scan | 2,039 tracked files, 14 patterns | — | ✅ **0 credentials** |
| History scan | 143 commits | — | ✅ **0 credentials** |

⚠️ `test:ci` excludes **22 files / 381 tests**, including the schema and
subscription-gate suites. Both suites pass today; the exposure is
forward-looking. Every migration PR therefore gates on the **full** suite.
*(doc 05 §4)*

---

## The first three PRs

| PR | Branch | Content | Pages | Risk |
|---|---|---|---:|---|
| **#1** | `consolidation/01-reachability` | Menu entries for the 160 hidden routes; fix 2 dead links; add a test that makes a hidden route impossible | 0 | Low |
| **#2** | `consolidation/02-shared-components` | The 5 components that block 188 pages, each with a test | 0 | Medium |
| **#3** | `consolidation/03-contested-shared-modules` | `taxBracketEngine`, `branding`; delete `householdWealth.bak.ts` | 0 | Medium |

Then six page batches (372 pages), the real-estate waterfall harvest, the
Organism subsystem (19 pages), and finally access control — blocked on an
owner decision. **13 PRs, 391 pages, ending at 721 fully reachable routes.**

---

## Out of scope for this PR and the plan

No merge to `master` · no deployment · no DNS, domain, GoDaddy, Railway or
Vercel change · no database, schema or credential change · no environment
variables · no repository deleted, archived or overwritten · **no page import
begins until this foundation PR is reviewed.**
