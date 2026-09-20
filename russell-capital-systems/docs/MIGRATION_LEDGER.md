# Migration Ledger

**Status:** Active · **Created:** 20 September 2026

Every capability imported into the canonical application, with provenance. Governed by
`docs/REPOSITORY_INTAKE_POLICY.md`. Rows are added when a PR opens, not after it merges.

| ID | Capability | Source repo | Source commit | Target paths | Status | Tests | PR | Rollback |
|---|---|---|---|---|---|---|---|---|
| PR-2b | Recursive navigation tree | `russell-capital-app` | `ef74f3f` | `client/src/lib/navTree.ts`, `client/src/components/NavTree.tsx`, `server/navTree.test.ts` | **Open — awaiting review** | 9 passing; suite 3439 → 3448 | [#159](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/159) | Revert PR / delete branch |
| PR-3 | Route-layer metadata | `russell-capital-app` | To be recorded | To be recorded | Not authorized | Required | None | Revert PR |
| PR-4 | Shared client data model (`FinancialDataContext` / `useSharedField`) | `russell-capital-app` | To be recorded | To be recorded | Not authorized | Required | None | Revert PR |
| PR-5 | Engagement / gamification disposition (17 modules) | `russell-capital` | To be recorded | To be recorded | Not authorized | Required | None | Revert PR |
| PR-6 | Preview-deployment decision | — | — | — | Not authorized | Required | None | N/A |

## PR-2b — full record

The program document lists PR-2b as *planned, not opened*. **It is open.** It was authorised and
executed in the working session immediately before this document was issued. Recording it as
"planned" would be inaccurate, so it is recorded as it stands.

| Field | Value |
|---|---|
| Source repository | `samtheinsuranceman-debug/russell-capital-app` |
| Source commit | `ef74f3f` |
| Source paths read | `client/src/navTree.ts` (1058 lines), `client/src/components/AppShell.tsx` (`NavTreeNode` renderer) |
| Target paths | `client/src/lib/navTree.ts`, `client/src/components/NavTree.tsx`, `server/navTree.test.ts` |
| Capability | Recursive navigation model + renderer + route-target validation |
| Dependencies added | None — uses `wouter` and `lucide-react`, both already present |
| Route impact | **None.** No route added, changed or removed. Manifest unchanged at 321 |
| Data / database impact | **None** |
| Test evidence | 9 new tests passing; full suite 3439 → 3448; typecheck 0 errors; build exit 0 |
| Secret scan | Clean |
| Branch | `consolidation/navtree-port` (program document specifies `claude/port-navtree-pr2b`; the branch was created before the document was issued) |
| Rollback | `git push origin --delete consolidation/navtree-port` before merge; `git revert -m 1 <merge-sha>` after |

### A finding worth carrying forward

A direct port of the donor's `MEDICAL_TREE` was measured before any code was written: **of its 271
unique leaf paths, only 147 resolve against this application's route manifest — 124 would have
shipped as dead links.** The tree content is therefore generated from this application's own
navigation, not copied. This is the concrete case for rule 2 of the intake policy: compare before
copying.
