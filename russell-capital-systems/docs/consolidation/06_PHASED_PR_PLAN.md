# Consolidation Foundation — Phased PR Plan

**Base: `russell-capital-app`.** One bounded capability per PR. No PR proceeds until the previous one
is merged and green.

## Scope, now that the base has flipped

Measured, not estimated:

| | |
|---|---|
| Base already carries | 612 routes · 722 page components |
| **Donor-only routes to migrate in** | **86** |
| Colliding paths (base wins by default) | 227 |

The job is **86 routes plus selected engines**, not a 391-page import. Most of the surface already
exists in the base.

---

## PR 1 — Stabilise the base, then adopt it

| | |
|---|---|
| Repository | `russell-capital-app` |
| Scope | Make `pnpm test` green without external services. 59 of 113 failures are `Error: DB unavailable`; 14 are `ENOENT`; 6 are network fetches. Gate them on `process.env.DATABASE_URL` and skip cleanly, the way `russell-capital-systems` already does. Port `consolidation-ci.yml`. Run a full secret-scan baseline. Tag `pre-consolidation-base-<date>`. |
| Changes | Test harness, CI workflow. **No application logic.** |
| Test criteria | `pnpm check` 0 errors · `pnpm build` exit 0 · `pnpm test` **0 failures** |
| Rollback | Revert; base returns to its present state |
| Why first | A regression baseline must be reproducible. Every later PR is measured against this number. |

---

## PR 2 — Navigation consolidation

| | |
|---|---|
| Source | `russell-capital-systems` `AppShell.tsx` `NAV_SECTIONS` + `secondaryCatalog.ts` |
| Target | `russell-capital-app` `client/src/navTree.ts` |
| Scope | Fold the donor's 158 sidebar links and its secondary catalogue into the base's recursive `NavNode` tree. This is where collapsible, arbitrarily-nested tiering finally works — the thing the flat donor structure could not express. |
| Test criteria | Every path in the tree resolves to a route; no duplicates; route count unchanged; suite green |
| Rollback | Revert; base navigation unchanged |
| Note | The donor enforces sidebar/catalogue disjointness via `navigation-organization.test.ts`. If the catalogue migrates, that test migrates with it. |

---

## PR 3 — The 86 donor-only routes, in batches

| | |
|---|---|
| Source | `russell-capital-systems/client/src/pages/**` for the 86 paths in `04_ROUTE_COLLISIONS.md` §A |
| Target | `russell-capital-app/client/src/pages/`, `App.tsx`, `navTree.ts` |
| Scope | Split into 4–5 PRs by domain (rental/real-estate, career, longevity, compliance, misc). No colliding path is touched. |
| Test criteria | Route count rises by exactly the batch size; typecheck clean; suite green; each page renders |
| Rollback | Revert the batch; earlier batches unaffected |

---

## PR 4+ — Shared-engine adjudication, one module per PR

Modules sharing a filename across both trees each get a PR: post the diff, choose BASE or DONOR
explicitly, migrate tests either way, prove both pass. Lowest blast radius first — data and
branding modules, then engines, `accessControl.ts` **last** because it is security-relevant.

---

## PR N — `russell-capital` donor

Sacred Seven, behavioural schema, selected page/content modules. **Not yet scoped** — that repository
has not been cloned or inventoried. A second inventory pass is required before these PRs exist.

---

## Out of scope until separately approved

- Any deployment, DNS or domain change
- Any database migration against a live database
- Any credential, hosting or environment-variable change
- Anything touching `russell-capital-domain-redirect`
