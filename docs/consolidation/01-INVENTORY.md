# 01 — Repository and Capability Inventory

**Foundation PR, deliverable 1 of 6.**
**Base:** `sam-russell-corpus/russell-capital-systems` (`russell-capital-unified`)
**Branch:** `claude/russell-capital-consolidation-6dwkg2` off `76ed5f2`
**Date:** 2026-09-20

No application code is changed by this PR.

---

## 1.1 — THE DIRECTIVE IS CORRECT. AN EARLIER FINDING IN THIS SESSION WAS WRONG.

`sam-russell-corpus` **is** the live build. Verified two ways today, read-only:

**Railway — `russell-capital-systems` project, service `web`, state `live`:**

| | |
|---|---|
| Source | `samtheinsuranceman-debug/sam-russell-corpus`, branch **`master`**, root `russell-capital-systems` |
| Custom domain | **`www.russellcapitalsystems.com`**, verified, certificate VALID |
| DNS | `www` CNAME → `tjkj8nc5.up.railway.app` — required value matches current value, status **PROPAGATED** |
| Latest deployment | **SUCCESS**, 2026-09-18 23:26 UTC — matching HEAD `76ed5f2` |
| Environment | production, `sfo`, 35 environment variables set |

**Correcting my own earlier finding.** Earlier in this session I reported that
`russellcapitalsystems.com` was served from `russell-capital-app` via Vercel, and
that production had been frozen on a June build. **That was wrong.** I queried
Vercel, found the domain configured on the `russell-capital-app` project, and
stopped there. The domain had since moved to Railway; the Vercel project still
carries stale domain configuration, which is what misled me. Checking one host
and concluding is the error — the same class of mistake as trusting a heuristic
instead of opening a diff.

What that means concretely:

- The live site is **current**, deployed two days ago — not a stale June build.
- The BLOCKED Vercel deployments are on an **abandoned project**, not production.
- Any consolidation plan built on my earlier finding would have targeted the
  wrong repository.

**The base is the live build, and this branch is based on it.**

### The consequence that governs everything below

`.github/workflows/deploy-branch.yml` fires on **push to `master`** with
`paths: ["russell-capital-systems/**"]`. It splits the subtree to `deploy/rcs`,
force-pushes it, and calls Railway's deploy mutation.

**Merging any migration PR into `master` is a production deployment of the live
site.** The directive requires separate explicit approval for that. The
integration-branch design in `05-CI-AND-ROLLBACK.md` exists to keep those two
events apart.

---

## 1.2 — REPOSITORY INVENTORY

### Canonical base

| | |
|---|---|
| Repo | `samtheinsuranceman-debug/sam-russell-corpus` |
| App path | `russell-capital-systems/` |
| Package | `russell-capital-unified@1.0.0` |
| HEAD at branch point | `76ed5f2` — *"Route manifest replaces the hard-coded count; each façade becomes one front door"* (2026-09-18) |
| Workspace | pnpm workspace (`pnpm-workspace.yaml`) |
| Repo shape | Multi-project corpus — the app is one of several projects alongside `Patent360/`, `doctor-buddy/`, `AQAL/`, `stop-fatty/` |

**Measured capability counts:**

| Capability | Count |
|---|---|
| Route patterns emitted by the build (`dist/public/routes.json`) | **330** |
| Page registry entries (`docs/audit/pageRegistry.json`) | **309** |
| Route manifest (`shared/routeManifest.ts`) | 380 lines |
| Shared engine modules (`shared/*Engine.ts`) | **54** |
| Shared modules total (`shared/*.ts`) | **174** |
| `.ts` / `.tsx` under the app | **1,097** |
| Page components | **325** |
| Test files | **225** |
| Wealth Genome modules | **6** |

**Infrastructure the base already owns that donors do not:**

- `PARTS_MANIFEST.json` — checkpointed archive with `source_sha256` and
  `reconstruction_verified`
- `PROVENANCE.md`
- `audit/` — prior page audits, vitest runs, route smoke results, colour-token
  inventory (26 artifacts)
- `database/`, `live/`, `showcase/`, `docs/`
- Owner auth with password + TOTP (`owner:password`, `owner:totp`)
- Backup / restore (`db:backup`, `db:restore`), schema export
- Scheduler with follow-ups, mail DNS check, `security:audit`
- Custom build pipeline (`scripts/build.mjs`) with esbuild code splitting
- `scripts/smoke-production-routes.mjs`

### Donors

| Repo | Role | Routes | Verified contribution |
|---|---|---|---|
| `russell-capital-app` | Donor — gamification + Postgres/Vercel patterns | 631 | **9 missing gamification pages**; Postgres data layer; `vercel.json` + `api/index.ts`; 41 ToggleHub pages; `CONSOLIDATION_PLAN.json` (687 scored rows) |
| `russell-capital` | Donor — per directive: Sacred Seven, behavioral schema, selected modules | 622 | **1 route not already in base or app.** See 1.3 — both named contributions are already in the base. |

### Reference / archive only

`Russell-Capital-Solutions-NEW` (docs + a source zip that unpacks to an older
snapshot of `russell-capital-app`), `Really-Russell-Capital` (7 docs),
`russell-capital-patents`, `-reports`, `-analyses`, `-combinations`, `-nlp`,
`-skills`, `Russell-Capital-Calibrate-System`, `russell-capital-domain-redirect`.
Out of scope: `russell-biomedical`, `joinaqal-superior-build`, `AQAL`,
`aqal-platform`, `Patent360`.

---

## 1.3 — TWO DONOR ASSIGNMENTS ARE ALREADY SATISFIED BY THE BASE

The directive assigns `russell-capital` as donor for the Sacred Seven and the
behavioral schema. Both were checked against the filesystem:

### Sacred Seven — already in the base, nothing to import

The term resolves to the seven cinematic pages, confirmed by the base's own audit
inputs (`audit/page_inputs/221_portal-the-arrival.json` … `227_portal-the-brotherhood.json`)
and by `server/fieldRouter.ts`:

`TheArrival · TheMirror · TheStrategyTable · TheField · TheMap · TheLegacy · TheBrotherhood`

Present in all three repos — **7/7 in the base.** No migration required.

### Behavioral schema / Wealth Genome — base is the only holder

Six modules, present **only** in the base:

`shared/wealthGenome.ts` · `shared/wealthGenomeFactors.ts` ·
`shared/wealthGenomeDurability.ts` · `shared/householdGenome.ts` ·
`shared/genomeStrategies.ts` · `shared/genomeStrategyFit.ts`

Neither donor contains any of them. **No migration required — and importing from
`russell-capital` here would be a downgrade, not an upgrade.**

**Consequence: `russell-capital`'s donor scope reduces to 1 route plus any
individually selected content modules.** That is a reduction in both work and
risk. It is recorded here rather than acted on; if the intent behind "Sacred
Seven" or "behavioral schema" is something other than what was found, say so and
this section gets revised before any migration PR.

### Resonance breathing — base already has the correct tuning

`client/src/index.css` in the base:

> *Medical basis: Coherent / resonance breathing at exactly 6 breaths/min*
> *Nature (2025): Light-guided resonant breathing at ~6 breaths/min*

This is the 0.1 Hz resonance figure, with a cited basis. It matches
`russell-capital` and supersedes `russell-capital-app`, which had drifted to 8
breaths/min. **No migration required.**

---

## 1.4 — THE ACTUAL GAP: 9 GAMIFICATION PAGES

The directive describes `russell-capital-app` as donor for "18 gamification
routes." The measured gap is smaller. The base already holds 8 of the 17 pages:

| Present in base (8) | Missing from base (9) |
|---|---|
| Arena | EliteShowdown |
| BlackMirror | WealthOdyssey |
| Endgame | MoatFortress |
| PetSystem | HolographicMirage |
| RewardsVault | PredictiveInsightArena |
| SocialNarcotic | StrategyComparisonArena |
| ToiletDashboard | WealthWarriorChallenges |
| InfiniteScroll | GamifiedPavlovianEngagement |
| | EntrainmentEngine *(page; the context already exists in base)* |

Both donors hold 17/17. Migration scope is **9 page components plus their
routes** — handled as a single bounded capability in `06-PHASED-PR-PLAN.md`.

---

## 1.5 — WHAT IS NOT IN ANY REPOSITORY

Neither the base nor any donor contains:

1. **Live external data connectors.** No IRS, SSA, Morningstar, or banking
   integration exists. Every tax bracket, contribution limit, IRMAA threshold and
   carrier rate is hardcoded or user-entered. The IRS re-indexes ~60 figures each
   November, so these silently go stale every January.
2. **A `tax_year_constants` table.** The fix for the above, and it needs no
   vendor — a versioned table with a source URL and effective date per figure.

Both are out of scope for this consolidation and are logged as follow-on work,
not migration candidates.
