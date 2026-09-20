# 1 · Repository and Capability Inventory

**Date:** 2026-09-20 · **Canonical base:** `sam-russell-corpus/russell-capital-systems`

Sixteen repositories under `samtheinsuranceman-debug` match Russell Capital /
RCS / Russell Cap. This document states what each one is, what it holds, and
what role it plays in the consolidation.

---

## 1.1 Role definitions

| Role | Meaning |
|---|---|
| **BASE** | The single canonical tree. All migration targets it. Never overwritten wholesale. |
| **DONOR** | Holds one or more capabilities selected for migration, one bounded PR at a time. |
| **REFERENCE** | Consulted for content or patterns. Nothing is migrated from it without a new decision. |
| **ARCHIVE** | Superseded or non-code. Retain as history; no migration path. |

---

## 1.2 The base

### `sam-russell-corpus` → `russell-capital-systems/` — **BASE**

The repository as a whole is a 2.2 GB content corpus (6,008 files: ~1,083 `.md`,
231 `.pdf`, 63 `.mp3` under Git LFS). The application lives in one subtree.

> **Note on `CLAUDE.md`:** the repo's own guidance file describes this repository
> as "primarily a content corpus, not a software project," documents a
> `russell-capital/` prototype, and states "there is no repo-wide build, test, or
> lint." It does **not mention `russell-capital-systems/` at all.** That file is
> stale with respect to the application subtree, which is the largest, most
> governed, and most current code in the repository. Updating `CLAUDE.md` is
> proposed as PR-01 in [06_PHASED_PR_PLAN.md](06_PHASED_PR_PLAN.md).

**`russell-capital-systems/` — verified capabilities**

| Capability | Measure |
|---|---|
| Routes registered in `client/src/App.tsx` | **330** (zero internal duplicates) |
| `shared/routeManifest.ts` entries | **330** — matches exactly |
| Route patterns emitted to `dist/public/routes.json` at build | **330** — matches exactly |
| Page registry `docs/audit/pageRegistry.json` | **309** pages, each scored + capability-tagged |
| Page components | 65 top-level + 261 portal = **326** |
| Shared engines (`shared/*Engine*.ts`) | **55** |
| Calculator catalogue (`shared/calculatorCatalog.ts`) | **116** entries, route-verified by test |
| Test files | **225** |
| Database | **MySQL** — `drizzle-orm/mysql2`, `dialect: "mysql"` |
| Deploy target | Railway, via the `deploy/rcs` split branch |
| CI workflows | 12, at repo root `.github/workflows/` |

**Governance assets that make this the correct base.** These do not exist in
either donor:

- **`shared/routeManifest.ts`** — a hand-maintained list, not a count. Its header
  explains the design: an integer count was "the single most reliable merge
  conflict in the repository," and a count cannot detect a route deleted and
  another added in the same change, nor a duplicate path (a `Set` swallows it).
  Smoke tests diff this list against the real router in both directions.
- **`shared/calculatorCatalog.ts`** — one registry, route-verified by
  `server/calculatorCatalog.test.ts`. Its header records why: the catalogue page
  once carried hand-written JSX where **18 of 35 cards pointed at routes that did
  not exist**, so "half the visible catalogue was broken."
- **`scripts/reconcile-route-manifest.mjs`** — keeps the manifest honest.
- **`docs/audit/pageRegistry.json`** — 309 pages with value scores, hub
  assignment, engines used, persistence/chart/PDF capability flags.
- **`audit/route_manifest.json`**, **`audit/full_page_audit_corpus.json`**,
  **`audit/page_inputs/`** — a per-page audit corpus with source hashes.
- **`PARTS_MANIFEST.json`**, **`PROVENANCE.md`** — provenance tracking.
- **`package.json` → `test:ci`** — a curated suite with 26 documented exclusions.

---

## 1.3 Donors

### `russell-capital-app` — **DONOR** (Postgres/Vercel patterns; 3 routes)

| Property | Value |
|---|---|
| Routes | 653 declared / **612 unique** |
| **Internal duplicate routes** | **41** — see below |
| Routes not in base | 385 |
| Routes **exclusive** to it | **3** — `/portal/lab`, `/portal/nav-placeholder`, `/portal/reveal-demo` |
| Gamification routes | **0 of 18** |
| Database | PostgreSQL (`drizzle-orm/postgres-js`), ported from MySQL |
| Deploy | `vercel.json` + `api/` serverless entry |

**Defect — 41 internally duplicated routes.** Its `App.tsx` registers the same
path twice in 41 cases (e.g. `/portal/mortgage-killer`, `/portal/roth-conversion`,
`/portal/premium-financing`). `wouter` matches the first declaration, so **41
components in that build are unreachable**. This is precisely the class of error
the base's route manifest exists to prevent, and it is the strongest argument
against merging this tree wholesale. Full list in
`data/route_collision_report.json → donor_app_internal_duplicates`.

**What it is actually good for:**
- The **MySQL → PostgreSQL port** (11 server files + all 117 tables converted),
  as a *reference implementation* — not as a migration in itself.
- The **Vercel deployment pattern** (`vercel.json`, `api/index.ts`).
- Three exclusive routes, if wanted.
- `navTree.ts` / `navConfig.ts` — a 5-level nav tree with a `ROUTE_LAYER`
  de-duplication scheme. Evaluate against the base's existing nav before
  adopting; the base may already solve this differently.

### `russell-capital` — **DONOR** (gamification; selected modules)

| Property | Value |
|---|---|
| Routes at `origin/main` | **620** (zero internal duplicates) |
| Routes not in base | **391** ← this is where the 391 figure comes from |
| Routes exclusive to it | **9** |
| Gamification routes | **18 of 18** |
| Sacred Seven | **0 of 7** — absent at `origin/main` |
| Database | MySQL — same dialect as the base |

Its MySQL dialect matches the base, which makes schema-adjacent migration from
here lower-risk than from `russell-capital-app`.

> **Branch `claude/russell-capital-consolidation-kbwl81` in this repo is not a
> donor.** It was created in an earlier session under a superseded plan and
> contains a 380-file wholesale client merge from `russell-capital-app`. It was
> never merged to `main`. Under the current direction it should be treated as
> **ARCHIVE**. Do not source migrations from it; source them from `origin/main`.
> It does contain two net-new pages (Plastic to Cash, Mutual Carriers) that exist
> nowhere else — see [06_PHASED_PR_PLAN.md](06_PHASED_PR_PLAN.md) PR-09.

---

## 1.4 Reference and archive

| Repo | Role | Contents |
|---|---|---|
| `russell-capital-domain-redirect` | **REFERENCE** | 3 files: `index.html` (4,198 b static brochure), `404.html`, `CNAME` → `russellcapitalsystems.com`. Documents current DNS only. **No action — DNS is out of scope.** |
| `Russell-Capital-Calibrate-System` | **REFERENCE** | Standalone NLP calibration app, 125 files. Separate product. |
| `Russell-Capital-Solutions-NEW` | **ARCHIVE** | 59 files — Brotherhood docs, SCUBA method, identity docs. No web code. |
| `Really-Russell-Capital` | **ARCHIVE** | 7 files — NLP calibration profiles, Dewey-grade questions. |
| `sam-russell-corpus-backup` | **ARCHIVE** | Backup of the base repo. |
| `russell-capital-patents` | **REFERENCE** | Patent portfolio. Base already carries `shared/patentCatalog.ts` and `docs/patents/`. |
| `russell-capital-nlp` | **REFERENCE** | NLP assets. |
| `russell-capital-combinations` | **REFERENCE** | Strategy combinations. |
| `russell-capital-skills` | **REFERENCE** | Skill definitions. |
| `russell-capital-analyses` | **ARCHIVE** | Generated analyses. |
| `russell-capital-reports` | **ARCHIVE** | Generated reports. |
| `russell-biomedical` | **ARCHIVE** | Unrelated domain. |
| `sam-russell-catechism-brotherhood` | **ARCHIVE** | Theological corpus. |

---

## 1.5 Other application trees inside the base repo

The corpus repo contains five further app subtrees. **None are consolidation
targets.** Listed so they are not mistaken for donors:

| Path | Files | What it is |
|---|---|---|
| `russell-capital/` | 294 `.tsx` | Older prototype of the same product. Superseded by `russell-capital-systems/`. **ARCHIVE candidate** — confirm before removal. |
| `AQAL/aqal-platform/` | 179 `.tsx` | AQAL / Ken Wilber platform. Separate product. |
| `doctor-buddy/` | 126 `.tsx` | Separate product. |
| `stop-fatty/` | 73 `.tsx` | NLP weight-loss prototype. Separate product. |
| `Patent360/client/` | 30 `.tsx` | Patent tooling. Separate product. |

> The presence of **two** Russell Capital trees inside the base repo
> (`russell-capital/` and `russell-capital-systems/`) is itself a consolidation
> hazard: a path-based CI filter or a careless `grep` can hit the wrong one.
> Resolving `russell-capital/` is proposed as PR-02.

---

## 1.6 Verification commands

```bash
# Route counts per tree
grep -c '<Route path=' <tree>/client/src/App.tsx

# Base registries
grep -cE '^\s+"' russell-capital-systems/shared/routeManifest.ts     # 330
ls russell-capital-systems/shared/*[Ee]ngine*.ts | wc -l              # 55
python3 -c "import json;print(json.load(open('russell-capital-systems/docs/audit/pageRegistry.json'))['count'])"  # 309

# Sacred Seven in donor russell-capital (expect: all ABSENT)
for f in TheArrival TheBrotherhood TheField TheLegacy TheMap TheMirror TheStrategyTable; do
  git cat-file -e origin/main:client/src/pages/portal/$f.tsx 2>/dev/null \
    && echo "$f PRESENT" || echo "$f ABSENT"
done
```
