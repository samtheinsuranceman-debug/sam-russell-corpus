# 2 — Authoritative Capability Matrix

Requirement: *"An authoritative capability matrix identifying the one chosen
implementation of each engine, calculator, route, schema, and shared module."*

**Selection rule, applied in order:**

1. **The base wins by default.** `sam-russell-corpus/russell-capital-systems/`
   is canonical. A capability already present there is chosen unless a donor is
   demonstrably superior *and* the difference is proven by comparison.
2. **Protected registries are never replaced** — only extended, with regression
   proof (`01-repository-inventory.md` §1.4).
3. **A donor wins only with evidence**, recorded in the "Why" column.
4. **Anything unproven is `DEFER`** — it does not enter a migration PR until a
   comparison exists. No capability is chosen on vibes.

---

## 2.1 Layer-level decisions

| Layer | Chosen implementation | Source | Why |
|---|---|---|---|
| **Shared engines** | Base, all 174 | base | Base holds 116 engines no other repo has; app holds only 4 the base lacks. Base is the engine repository. |
| **Database schema** | Base's 155 tables, **ported to PostgreSQL using the app's port as reference** | base structure + app pattern | Base has 39 more tables. App has already solved MySQL→Postgres and documented it. Take the base's content, the app's technique. |
| **DB driver / config** | App's `drizzle-orm/postgres-js` pattern | **app** | Base is still MySQL. The port is the app's single most valuable contribution. |
| **Deployment config** | App's `vercel.json` + `api/index.ts` | **app** | Base has no deploy config at all. |
| **Route manifest** | Base `shared/routeManifest.ts` | base | Protected. Extend only. |
| **Calculator registry** | Base `shared/calculatorCatalog.ts` (495 lines) | base | Protected. Extend only. |
| **Patent / journey catalogs** | Base | base | Protected. |
| **Sacred Seven** | Base — **already present** | base | All 7 pages verified in base. Zero migration. |
| **Gamification pages** | Base for 8; **twin for 9** | base + **twin** | See §2.3. Not the app — they are not on app master. |
| **Portal pages (419 app-only)** | **DEFER** — per-page adjudication | — | Largest open item. No blanket rule. §2.4. |
| **Navigation** | **DEFER** | — | Three incompatible systems. §2.5. |
| **Test suites** | Base, all 194 files | base | Protected baseline: 3,757 passing. |
| **Operational scripts** | Base | base | `security:audit`, `db:backup/restore`, `release`, `owner:totp` exist only here. |

---

## 2.2 Engines — base wins, with 4 exceptions to adjudicate

- **116 engines exist only in the base** → chosen, no action.
  [`data/engines-only-in-corpus.txt`](data/engines-only-in-corpus.txt)
- **58 engines exist in both** → base chosen by rule 1. **Each still needs a
  diff before its dependent page migrates** — same filename does not mean same
  implementation. Tracked in PR-3.
  [`data/engines-in-both.txt`](data/engines-in-both.txt)
- **4 engines exist only in the app** → `DEFER`, adjudicate individually in PR-3.
  [`data/engines-only-in-app.txt`](data/engines-only-in-app.txt)

## 2.3 Gamification — corrected source

| Status | Count | Chosen source | Action |
|---|---|---|---|
| Already in base | 8 | base | none |
| Missing from base | **9** | **`russell-capital`** | migrate (PR-5) |

`Arena, BlackMirror, Endgame, InfiniteScroll, PetSystem, RewardsVault,
SocialNarcotic, ToiletDashboard` — present, no action.

`EliteShowdown, EntrainmentEngine, GamifiedPavlovianEngagement,
HolographicMirage, MoatFortress, PredictiveInsightArena,
StrategyComparisonArena, WealthOdyssey, WealthWarriorChallenges` — migrate from
`russell-capital`. **Not from `russell-capital-app`; they are not on its
master.** Full evidence in `01-repository-inventory.md` §1.5 Correction B.

## 2.4 The 419 app-only portal pages — the real open question

This is the largest single decision and it is deliberately **not** resolved
here, because resolving it without comparison would violate the decision's own
constraint against replacing things without documented proof.

[`data/pages-only-in-app.txt`](data/pages-only-in-app.txt) lists all 419.

They cannot be migrated as a block. Each falls into one of four dispositions,
and the disposition cannot be assigned from filenames alone:

| Disposition | Meaning | Handling |
|---|---|---|
| **ADOPT** | Genuine capability the base lacks | Migrate with its engine dependencies |
| **SUPERSEDED** | Base already covers it under a different filename | Do not migrate; record the mapping |
| **DUPLICATE** | Two app pages cover one capability | Migrate the better one only |
| **DROP** | Demo, stub, or dead route | Archive |

**Input that already exists and should drive this:**
`russell-capital-app/CONSOLIDATION_PLAN.json` — a per-page scored disposition
(Tier, Score, Layer, Verdict `KEEP-L1`/…, client story, discovery questions,
wiring status, consolidation target). It was authored for exactly this purpose.
PR-2 adjudicates all 419 against it plus the base's
`docs/audit/pageRegistry.json` (5,985 lines).

**Until PR-2 lands, no app-only page migrates.**

## 2.5 Navigation — three incompatible systems, all deferred

| Repo | Structure | Status |
|---|---|---|
| Base | `shared/routeManifest.ts` (380) + `docs/audit/pageRegistry.json` (5,985) | protected |
| App | `client/src/navTree.ts` → `MEDICAL_TREE`, rendered via `NavTreeNode`. Its `NAV_SECTIONS` is **declared and never read** — dead code | — |
| Twin | `NAV_SECTIONS` in `AppShell.tsx`, actually rendered | — |

Navigation is **`DEFER`** until the page set is settled (PR-2). Choosing a nav
model before knowing the final page inventory would guarantee rework. Deciding
in PR-8, after the page set is frozen.

> Recorded so it is not rediscovered: the app's `NAV_SECTIONS` is dead code —
> only two comments in `ToolUsageTracker.tsx` mention it, and no render path
> reads it. Any work targeting `NAV_SECTIONS` in the app repo changes nothing
> on screen.

## 2.6 Explicitly unresolved

| Item | Why unresolved | Needed |
|---|---|---|
| "391 pages" | Reconciles to no derivable set (261 / 325 / 680 / 691) | Owner confirmation |
| "Live engine registry" | No file by that name in base | Owner confirmation of intended file |
| "Behavioral schema" | Not located; `russell-capital` has no Sacred Seven and no file matching this name | Owner pointer, or Phase 0 inventory of `russell-capital-nlp` / `Russell-Capital-Calibrate-System` |
| 2 uninventoried repos | `Russell-Capital-Solutions-NEW`, `Really-Russell-Capital` | Phase 0 |
| `russell-capital/` fragment inside base | 21-page fragment, name collides with the separate repo | Phase 0 decision |
