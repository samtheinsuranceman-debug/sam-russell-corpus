# Migration ledger

Every capability that enters `russell-capital-systems/` gets a row, before the
work starts and updated when it lands. Policy: `docs/REPOSITORY_INTAKE_POLICY.md`.

**Status vocabulary:** `Planned` · `Open` (PR exists, unmerged) · `Merged` ·
`Not authorized` (queued, needs owner approval before work begins) · `Rejected`.

## Ledger

| ID | Capability | Source repo | Source commit | Target paths | Status | Tests | PR | Rollback |
|---|---|---|---|---|---|---|---|---|
| PR-2b | Recursive navigation tree (`navTree.ts` + renderer) | `russell-capital` — file is **byte-identical** in `russell-capital-app` (1058 lines, sha256 `f5b453050d3b…`) | `15c36d7` (`russell-capital`) | `client/src/navTree.ts` (new)<br>`client/src/components/NavTree.tsx` (new)<br>`server/navTree.test.ts` (new)<br>`client/src/components/AppShell.tsx` (+26/−2) | **Open** | 17 added, all passing. Full suite 4237 tests, 0 failed (baseline 4220, 0 failed) | [#162](https://github.com/samtheinsuranceman-debug/sam-russell-corpus/pull/162) | `git revert -m 1 <merge-sha>` |
| — | Route-layer metadata | `russell-capital-app` | To be recorded | To be recorded | **Not authorized** | Required | None | Revert PR |
| — | Engagement/gamification disposition | `russell-capital` | To be recorded | To be recorded | **Not authorized** | Required | None | Revert PR |
| — | Shared client data model (`FinancialDataContext` / `useSharedField`) | `russell-capital-app` | To be recorded | To be recorded | **Not authorized** | Required | None | Revert PR |
| — | Preview-deployment environment | — | — | — | **Not authorized** | Required | None | Tear down preview |

## Notes on PR-2b

Opened before this ledger existed, under direct owner authorisation. Recorded
here rather than reopened. Details that belong in the ledger:

- **271 unique leaf targets** in the donor tree were validated against the
  authoritative route manifest (`dist/public/routes.json`, 330 routes).
- **147 resolve** and remain links. **124 do not** and became placeholders
  rather than dead links. **1 duplicate** (`/portal/mortgage-killer`, listed
  twice) became a placeholder on its second appearance.
- **Route delta: zero.** The build still emits 330 patterns.
- **New npm packages: zero.**
- **Database impact: none.**
- Found and did *not* fix: `NAV_SECTIONS` already carried two entries pointing
  at routes the build does not declare — `/portal/knowledge-library` and
  `/portal/tool-explorer` — present on `76ed5f2` before the change. Pinned as a
  known-orphan baseline in `server/navTree.test.ts` so a third cannot appear
  unnoticed.

## Disposition backlog — engagement/gamification

Queued under the fourth row; **no work authorized.** Each module needs a record
with source path, route, dependencies, test status, business role, proposed
navigation layer, decision, and restore path:

Arena · BlackMirror · EliteShowdown · Endgame · EntrainmentEngine ·
GamifiedPavlovianEngagement · HolographicMirage · InfiniteScroll · MoatFortress ·
PetSystem · PredictiveInsightArena · RewardsVault · SocialNarcotic ·
StrategyComparisonArena · ToiletDashboard · WealthOdyssey · WealthWarriorChallenges

**Measured caveat, recorded so the disposition starts from fact:** several of
these are **already in the canonical app** — `/portal/arena`,
`/portal/black-mirror`, `/portal/pet`, `/portal/rewards`, `/portal/social`,
`/portal/toilet` and others resolve against the 330-route manifest today, and
`server/experienceRouter.ts` (1130 lines, 13 sub-routers: XP, quests, streaks,
loot, achievements, skill tree, daily rewards, rivalry) is present. The
disposition is therefore largely *confirm what exists* rather than *restore what
is missing*. Verify per module before assuming either.
