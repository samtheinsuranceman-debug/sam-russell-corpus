# 1 — Repository and Capability Inventory

All counts are reproducible from [`data/`](data/). Repositories were inspected
at the commits noted; `pushed_at` is from the GitHub API at inventory time.

## 1.1 Candidate bases

| Repo | Commit | Portal pages | Top pages | Shared engines | Routes | DB | Tables | Provenance | Deployed |
|---|---|---|---|---|---|---|---|---|---|
| **`sam-russell-corpus` → `russell-capital-systems/`** | `76ed5f2` | 261 | 64 | **174** | 330 | **MySQL** | **155** | ✅ SHA-256 manifest | ✗ |
| `russell-capital-app` | `ef74f3f` (master) | 620 | 61 | 62 | 652 | PostgreSQL | 116 | ✗ | ✅ **serves the domain** |
| `russell-capital` | branch `…hvzdvq` | 630 | 59 | 64 | 621 | PostgreSQL | 116 | ✗ | ✗ |

## 1.2 Full repository roster

Sixteen repositories match Russell Capital naming. Classification per the
owner's instruction that every repo other than the three above is a donor,
reference, or archive candidate — never an automatic merge candidate.

| Repository | Vis. | Classification | Rationale |
|---|---|---|---|
| `sam-russell-corpus` | public | **CANONICAL BASE** | Verified checkpoint `bcfe0624`; also contains 5 embedded platforms and the document corpus |
| `russell-capital-app` | private | **DONOR** — Postgres/Vercel patterns; Sacred Seven (already present in base) | Only deployed build |
| `russell-capital` | private | **DONOR** — gamification pages, selected modules | Engagement layer lives only here |
| `Russell-Capital-Solutions-NEW` | public | Reference — not yet inventoried | Pending Phase 0 |
| `Really-Russell-Capital` | public | Reference — not yet inventoried | Pending Phase 0 |
| `Russell-Capital-Calibrate-System` | public | Donor candidate — NLP calibration | Behavioral schema source |
| `russell-capital-nlp` | private | Donor candidate — NLP engine | Behavioral schema source |
| `russell-capital-patents` | private | Reference | Base already has `shared/patentCatalog.ts` |
| `russell-capital-combinations` | private | Donor candidate — strategy combos | Content, not code |
| `russell-capital-analyses` | private | Reference | Content |
| `russell-capital-skills` | private | Reference | Agent skills, not app code |
| `russell-capital-reports` | private | Archive | Generated output |
| `russell-capital-domain-redirect` | private | Archive | Superseded by Vercel redirects |
| `sam-russell-corpus-backup` | private | Archive | Backup of base |
| `sam-russell-catechism-brotherhood` | public | Reference | Doctrinal corpus |
| `russell-biomedical` | private | **Out of scope** | Different vertical |

## 1.3 What else lives inside the canonical repo

`sam-russell-corpus` is not only an application repo. It contains **five**
embedded platforms plus 6,008 tracked files (1,083 `.md`, 231 `.pdf`, 116
`.sql`, 58 `.mp3`).

| Path | What it is | Consolidation status |
|---|---|---|
| `russell-capital-systems/` | **The canonical build.** 261 portal pages, 174 engines, 155 tables | ✅ base |
| `russell-capital/` | Fragment — 21 portal pages only | ⚠️ ambiguous; see risk below |
| `AQAL/aqal-platform/` | Separate platform | Out of scope |
| `Patent360/client/` | Separate platform | Out of scope |
| `doctor-buddy/` | Separate platform | Out of scope |
| `stop-fatty/` | Separate platform | Out of scope |

> **Risk R-1 — name collision inside the base.** `sam-russell-corpus/russell-capital/`
> is a 21-page fragment whose name matches the separate GitHub repo
> `samtheinsuranceman-debug/russell-capital` (630 pages). Any migration
> instruction saying "from russell-capital" is ambiguous. **Every path in
> `06-phased-pr-plan.md` is therefore fully qualified** — repo name plus path.
> Recommend resolving the fragment (promote, merge, or archive) in Phase 0.

## 1.4 Capability inventory of the base

### Registries — the owner's do-not-overwrite list

These exist in the base and are protected. No migration PR may modify them
without the documented comparison and regression proof the decision requires.

| Capability | Path (within `russell-capital-systems/`) | Size |
|---|---|---|
| Route manifest | `shared/routeManifest.ts` | 380 lines |
| Calculator registry | `shared/calculatorCatalog.ts` | 495 lines |
| Patent catalog | `shared/patentCatalog.ts` | 237 lines |
| Journey catalog | `shared/journeyCatalog.ts` | 86 lines |
| Home manifesto | `shared/homeManifesto.json` | 162 lines |
| Page registry (audit) | `docs/audit/pageRegistry.json` | 5,985 lines |
| Route manifest (audit) | `audit/route_manifest.json` | 7,003 lines |
| Manifest reconciler | `scripts/reconcile-route-manifest.mjs` | 25 lines |

> **Note:** there is **no** file named `engineRegistry` in the base. The
> decision refers to a "live engine registry"; the closest artifacts are
> `shared/calculatorCatalog.ts` and `shared/routeManifest.ts`. Treating both as
> protected. Confirm if a different file was meant.

### Engines

174 shared engines in `shared/*.ts`. **116 exist in no other repo** — see
[`data/engines-only-in-corpus.txt`](data/engines-only-in-corpus.txt). Only 4
engines exist in the app and not the base
([`data/engines-only-in-app.txt`](data/engines-only-in-app.txt)).

### Schema

155 Drizzle tables in `drizzle/schema.ts`, currently **MySQL** (`mysqlTable`,
`drizzle-orm/mysql2`, `dialect: "mysql"`). The app has 116 tables already
ported to PostgreSQL. The base carries 39 tables the app does not.

### Tests

194 test files, 3,762 tests. See [`03-base-verification.md`](03-base-verification.md).

## 1.5 Two evidenced corrections to the donor assignments

Both are load-bearing: followed as written, the migration PRs would pull from
repositories that do not contain the assets.

### Correction A — Sacred Seven is already in the base

The decision assigns `russell-capital` as donor for the Sacred Seven. Verified
file presence:

| Page | `sam-russell-corpus` | `russell-capital-app` | `russell-capital` |
|---|---|---|---|
| `TheArrival` | ✅ | ✅ | ✗ |
| `TheMirror` | ✅ | ✅ | ✗ |
| `TheStrategyTable` | ✅ | ✅ | ✗ |
| `TheField` | ✅ | ✅ | ✗ |
| `TheMap` | ✅ | ✅ | ✗ |
| `TheLegacy` | ✅ | ✅ | ✗ |
| `TheBrotherhood` | ✅ | ✅ | ✗ |

**All seven are already in the canonical base.** `russell-capital` has none of
them. The base also carries `server/fieldRouter.ts` (329 lines) and audit page
inputs `221_portal-the-arrival` … `227`. **No Sacred Seven migration is
required** — only verification that the base copies are current. Migration
effort: **zero**.

### Correction B — the gamification routes are in `russell-capital`, not `russell-capital-app`

The decision assigns `russell-capital-app` as donor for 18 gamification routes.
On `russell-capital-app` **master**, none of them exist. They exist in
`russell-capital`. Eight are already in the base.

| Page | base | app (master) | twin | Action |
|---|---|---|---|---|
| `Arena` | ✅ | ✗ | ✅ | none |
| `BlackMirror` | ✅ | ✗ | ✅ | none |
| `Endgame` | ✅ | ✗ | ✅ | none |
| `InfiniteScroll` | ✅ | ✗ | ✅ | none |
| `PetSystem` | ✅ | ✗ | ✅ | none |
| `RewardsVault` | ✅ | ✗ | ✅ | none |
| `SocialNarcotic` | ✅ | ✗ | ✅ | none |
| `ToiletDashboard` | ✅ | ✗ | ✅ | none |
| `EliteShowdown` | ✗ | ✗ | ✅ | **migrate from twin** |
| `EntrainmentEngine` | ✗ | ✗ | ✅ | **migrate from twin** |
| `GamifiedPavlovianEngagement` | ✗ | ✗ | ✅ | **migrate from twin** |
| `HolographicMirage` | ✗ | ✗ | ✅ | **migrate from twin** |
| `MoatFortress` | ✗ | ✗ | ✅ | **migrate from twin** |
| `PredictiveInsightArena` | ✗ | ✗ | ✅ | **migrate from twin** |
| `StrategyComparisonArena` | ✗ | ✗ | ✅ | **migrate from twin** |
| `WealthOdyssey` | ✗ | ✗ | ✅ | **migrate from twin** |
| `WealthWarriorChallenges` | ✗ | ✗ | ✅ | **migrate from twin** |

**Net: 9 pages to migrate, sourced from `russell-capital`, not 18 from
`russell-capital-app`.**

> Why the confusion is understandable: an unmerged branch on the app repo,
> `claude/russell-capital-consolidation-6dwkg2`, *does* contain these pages —
> another session ported them there. They are not on `master` and are not
> deployed.

### What `russell-capital-app` is genuinely the donor for

Its real, unique value is the **MySQL → PostgreSQL port** (`server/db.ts`,
`drizzle.config.ts`, `drizzle/schema.ts`, documented in `DEPLOY_NOTES.md`) and
the **Vercel deployment pattern** (`vercel.json`, `api/index.ts`). That half of
the donor instruction is correct and is the highest-value item in the plan.
