# Consolidation Foundation — Phased PR Plan

One bounded capability per pull request. Each PR states source path, target path, test criteria and
rollback. **No PR proceeds until the one before it is merged and green.**

Baseline every PR must match or beat: typecheck 0 errors · build 313+ routes · `test:ci` 2877 passing.

---

## PR 0 — This foundation *(current)*

| | |
|---|---|
| Source | — |
| Target | `docs/consolidation/*`, `.github/workflows/consolidation-ci.yml` |
| Changes | Documentation and one CI workflow. **No application code.** |
| Test criteria | CI workflow runs green on itself |
| Rollback | Revert the merge commit; nothing else is affected |

---

## PR 1 — Resolve the two dead sidebar links

| | |
|---|---|
| Source | `russell-capital-app/client/src/pages/ToolExplorer.tsx` (donor has a real `/portal/tool-explorer`) |
| Target | `client/src/pages/` + `App.tsx` + `AppShell.tsx` |
| Scope | `/portal/knowledge-library` → repoint to the existing orphan `/portal/knowledge`, or remove. `/portal/tool-explorer` → migrate the donor page, or remove the link. |
| Test criteria | `navigation-organization.test.ts` passes; no sidebar entry 404s; route count ≥ 313 |
| Rollback | Revert; both links return to their present broken state |

Smallest possible real migration. Proves the pipeline end to end.

---

## PR 2 — Orphan triage application

| | |
|---|---|
| Source | — (live build only) |
| Target | `AppShell.tsx` + `client/src/lib/secondaryCatalog.ts` |
| Scope | Apply the marked-up decisions in `docs/audit/ORPHAN_TRIAGE.md` (124 pages). Every promotion is a **coordinated two-file change**: add to the sidebar *and* remove from the secondary catalogue. |
| Test criteria | `navigation-organization.test.ts` passes; full `test:ci` green |
| Rollback | Revert; menu returns to 158 links |
| Blocked on | Your promote / merge / delete marks |

---

## PR 3 — Gamification schema (donor: `russell-capital-app`)

| | |
|---|---|
| Source | `server/experienceRouter.ts`, `shared/tabScores.ts`, related Drizzle tables |
| Target | `server/`, `shared/`, `drizzle/` |
| Scope | Schema and server router **only**. No pages, no routes. Additive migration; no existing table altered. |
| Test criteria | New tests for the router; `pnpm db:push` generates a clean additive migration; full suite green |
| Rollback | Revert; drop the added tables (they are additive, nothing depends on them yet) |
| Note | The live build already ships a 25-link "The Experience" section with Command/Compete/Earn/Explore/Transcend. **Overlap must be diffed before any code moves** — this may be a merge rather than an import. |

---

## PR 4 — Gamification routes

| | |
|---|---|
| Source | donor page components behind the gamification routes |
| Target | `client/src/pages/`, `App.tsx`, `AppShell.tsx` |
| Scope | Only routes in `04_ROUTE_COLLISIONS.md` §B (donor-only). Any colliding path is deferred to its own comparison PR. |
| Test criteria | Route count increases by exactly the number added; typecheck clean; suite green |
| Rollback | Revert; routes disappear, schema from PR 3 remains harmlessly |

---

## PR 5+ — Shared-engine adjudication, one module per PR

36 shared modules exist under the same filename in both builds (`02_CAPABILITY_MATRIX.md` §A).
Each gets its own PR:

1. Post the diff and a short rationale in the PR body.
2. Choose LIVE or DONOR explicitly.
3. If DONOR: migrate, keep the live module's tests, add the donor's tests, prove both pass.
4. If LIVE: record the decision in the matrix and close. No code change.

Suggested order — lowest blast radius first: `branding.ts`, `const.ts`, `carrierRatings.ts`,
`annuityData.ts`, then the engines (`mortgageKiller.ts`, `policyLoanOptimizer.ts`,
`monteCarloEngine.ts`, `estateTaxEngine.ts`), then `accessControl.ts` **last** — it is
security-relevant and must not move casually.

---

## PR N — Sacred Seven and behavioral schema (donor: `russell-capital`)

Not yet scoped. `russell-capital` has not been cloned or inventoried; this plan covers
`russell-capital-app` only. A second inventory pass is required before these PRs can be written.

---

## Out of scope until separately approved

- Any production deployment
- Any DNS or domain change
- Any database migration against a live database
- Any credential or hosting change
