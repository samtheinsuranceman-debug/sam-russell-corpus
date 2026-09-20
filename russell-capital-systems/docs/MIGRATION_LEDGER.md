# Migration ledger

**Status:** Active · **Date opened:** 2026-09-20

Every capability imported into `russell-capital-systems`, with provenance
sufficient to trace it back to the exact donor bytes. Governed by
`REPOSITORY_INTAKE_POLICY.md`. Append-only: a superseded row is struck through,
never deleted.

---

## Ledger

| ID | Capability | Source repo | Source commit | Target paths | Status | Tests | PR | Rollback |
|---|---|---|---|---|---|---|---|---|
| **PR-2b** | Recursive navigation tree + renderer | `russell-capital-app` | `ef74f3fa8af2aad793820d966f75278cd0012566`<br>blob `251a9d8c1e3cf4d1da09bf99c35e6d653afe7ec1` | `client/src/navTree.ts`<br>`client/src/components/NavTree.tsx`<br>`server/navTree.test.ts`<br>`server/navTreeRouteTargets.test.ts` | **OPEN — see note** | 20 added · 4,158 pass / 0 fail | [#161](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/161) | `git revert --no-edit 3c47e00` |
| PR-3 | Route-layer metadata | `russell-capital-app` | To be recorded | To be recorded | **Not authorized** | Required | None | Revert PR |
| PR-4 | Shared client data model (`FinancialDataContext` / `useSharedField`) | `russell-capital-app` | To be recorded | To be recorded | **Not authorized** | Required | None | Revert PR |
| PR-5 | Engagement / gamification disposition (17 modules) | `russell-capital` | To be recorded | To be recorded | **Not authorized** | Required | None | Revert PR |
| PR-6 | Preview-deployment decision | n/a | n/a | n/a | **Not authorized** | n/a | None | n/a |

---

## PR-2b — status note

**The governing document lists PR-2b as "Planned / Not opened". It is open.**
Recorded accurately rather than to match the template, per the policy's rule
against papering over facts.

It was opened under the owner's previous instruction set, before the governing
document existed. Two deviations from the document's Phase B specification:

| Document | Actual |
|---|---|
| Branch `claude/port-navtree-pr2b` | Branch `claude/pr2b-navtree` |
| Title `PR-2b: Add recursive navigation tree with route-manifest validation` | `PR-2b: port navTree.ts and a recursive renderer into russell-capital-systems (additive, 4 new files, no route changes)` |
| Phase B begins only after Phase A approval | Ran before Phase A |

It is **unmerged** and awaiting owner disposition: adopt as-is, re-open on the
specified branch name, or close. No action has been taken on it.

### What PR-2b actually contains

Four new files, nothing modified. No route added — manifest unchanged at 330.

The donor tree carried **272 leaves; 124 pointed at pages that exist only in
`russell-capital-app`.** A verbatim import would have produced 124 menu links
that 404. Each became a `ph(...)` placeholder — the tree's own mechanism, which
already shipped 17 — preserving the label and its position in the taxonomy while
rendering as un-clickable text. One further leaf was demoted as a duplicate
path.

```
    272  source leaves
  − 124  targets absent from this repository          → ph(...)
  −   1  duplicate target (same path declared twice)  → ph(...)
  ─────
    147  live links, every one validated against shared/routeManifest.ts
```

**Deliberately not mounted into `AppShell`.** The tree covers 147 of 330
routes; switching the live sidebar now would strand the other 183. A test
asserts `AppShell.tsx` references neither `NavTree` nor `MEDICAL_TREE`, so the
swap cannot happen unreviewed.

### Gaps against the document's Phase B specification

Recorded so the owner can decide whether they block adoption:

- **Expand/collapse and active-node-expansion tests are not behavioural.**
  `vitest` runs `environment: "node"` with `include: ["server/**/*.test.ts"]`
  and no jsdom, so no component can be rendered. Collapse state and active
  highlighting are asserted against the renderer's **source text**, not a DOM.
  Behavioural tests would require adding jsdom and a testing library — a
  dependency change outside PR-2b's scope. **Flagged, not silently skipped.**
- **Route-layer metadata was not ported**, so "invalid route-layer values" is
  not yet checkable. That is PR-3's scope.
- **Reachability exemptions are not enforced.** The check that every active
  primary route is reachable through navigation would fail today: 160 of the
  330 routes have no menu entry at all. That is a pre-existing condition of the
  canonical app, not something PR-2b introduced, and closing it is its own PR.

---

## Recording rules

1. **Full 40-character SHAs.** A branch name moves; a SHA does not. Where a
   single file is the unit, record the blob SHA too.
2. **A row is added in the same PR as the code**, never afterwards.
3. **Status is one of:** Not authorized · Planned · Open · Merged · Rejected ·
   Superseded.
4. **Rollback is a command**, not a description.
5. **Tests column carries real numbers** from a real run. "Passing" is not a
   number.
6. **Nothing is deleted.** Supersede with a struck-through row and a pointer.
