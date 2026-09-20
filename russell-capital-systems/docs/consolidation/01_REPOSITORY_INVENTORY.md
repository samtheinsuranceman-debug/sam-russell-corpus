# 01 — Repository inventory

**Date:** 2026-09-20
**Consolidation base (owner-designated):** `samtheinsuranceman-debug/sam-russell-corpus`
**Subject of this audit:** `sam-russell-corpus/russell-capital-systems`
**Branch:** `claude/consolidation-foundation-audit`, cut from `master` at `76ed5f2`

---

## 1. Method

Every directory under `/home/user` carrying a `.git` was surveyed directly —
git remote, branch, commit count, last commit date — and then measured for
route declarations, page components, shared modules, test files and total
TypeScript files. Nothing in this table is estimated. The counting script is
reproduced in §6 so the numbers can be re-derived rather than trusted.

`node_modules` is excluded everywhere.

---

## 2. The headline structural fact

**`sam-russell-corpus` is not a peer of the other repositories. It contains
them.**

It already carries `russell-capital-systems`, `russell-capital`, `AQAL`,
`Patent360`, `russell-biomedical`, `doctor-buddy`, `stop-fatty`, `the-new-plan`
and `rcs-code-book` as subdirectories. Designating it the consolidation base is
therefore not a migration of one repo into another — it is a decision to stop
maintaining the standalone copies and let the copies already inside it become
canonical.

**Second structural fact: 19 of the 21 repositories have exactly one commit.**

They are snapshot dumps, not development histories. There is no branch to
merge, no history to preserve, and no way to tell from git which of two
divergent files came later. Only two repositories have real history:

| Repository | Commits |
|---|---|
| `sam-russell-corpus` | **143** |
| `russell-capital` | 14 |
| every other repository | **1** |

This materially changes the migration strategy. Where two copies of a file
differ, git cannot arbitrate. Arbitration has to come from tests, exported
API surface and file content — which is what document 02 does.

---

## 3. Full inventory — 21 repositories

Sorted by TypeScript file count. `routes` counts `path="..."` declarations in
any `App.tsx`; `shared` counts non-test `.ts` files under any `shared/`.

| # | Repository | Remote (`samtheinsuranceman-debug/…`) | Branch | Last commit | Commits | Routes | Pages | Shared | Tests | TS files |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **sam-russell-corpus** | `sam-russell-corpus` | `claude/engine-harvest-catalog-backlink` | 2026-09-20 | **143** | 1031¹ | 622 | 376 | **511** | **13,589** |
| 2 | russell-capital-app | `russell-capital-app` | `master` | 2026-09-05 | 1 | 653 | 722 | 63 | 98 | 1,159 |
| 3 | russell-capital | `russell-capital` | `claude/homepage-portrait-day-sign-5o0l9d` | 2026-09-18 | 14 | 621 | 688 | 69 | 107 | 1,143 |
| 4 | joinaqal-superior-build | `joinaqal-superior-build` | `main` | 2026-08-30 | 1 | 0 | 94 | 32 | 65 | 401 |
| 5 | aqal | `aqal` | `main` | 2026-08-12 | 1 | 0 | 46 | 24 | 38 | 268 |
| 6 | aqal-platform | `aqal-platform` | `main` | 2026-06-30 | 1 | 0 | 24 | 5 | 8 | 149 |
| 7 | rcs-russell-capital-calibrate-system | `Russell-Capital-Calibrate-System` | `main` | 2026-06-28 | 1 | 13 | 13 | 1 | 1 | 90 |
| 8 | patent360 | `patent360` | `main` | 2026-09-11 | 1 | 6 | 23 | 0 | 0 | 50 |
| 9 | rcs-axiom-atlas | `axiom-atlas` | `main` | 2026-09-05 | 1 | 0 | 0 | 0 | 0 | 0 |
| 10 | rcs-four-halls | `four-halls` | `main` | 2026-09-13 | 1 | 0 | 0 | 0 | 0 | 0 |
| 11 | rcs-new-new-new | `New-New-New` | `main` | 2026-06-28 | 1 | 0 | 0 | 0 | 0 | 0 |
| 12 | rcs-really-russell-capital | `Really-Russell-Capital` | `main` | 2026-06-28 | 1 | 0 | 0 | 0 | 0 | 0 |
| 13 | rcs-samtheinsuranceman-debug.github.io | `samtheinsuranceman-debug.github.io` | `main` | 2026-09-06 | 1 | 0 | 0 | 0 | 0 | 0 |
| 14 | rcs-solutions-new | `Russell-Capital-Solutions-NEW` | `main` | 2026-09-01 | 1 | 0 | 0 | 0 | 0 | 0 |
| 15 | rcs-the-new-plan | `The-New-Plan` | `main` | 2026-06-28 | 1 | 0 | 0 | 0 | 0 | 0 |
| 16 | russell-biomedical | `russell-biomedical` | `main` | 2026-09-05 | 1 | 0 | 0 | 0 | 0 | 0 |
| 17 | russell-capital-analyses | `russell-capital-analyses` | `master` | 2026-06-28 | 1 | 0 | 0 | 0 | 0 | 0 |
| 18 | russell-capital-combinations | `russell-capital-combinations` | `master` | 2026-06-28 | 1 | 0 | 0 | 0 | 0 | 0 |
| 19 | russell-capital-nlp | `russell-capital-nlp` | `master` | 2026-06-28 | 1 | 0 | 0 | 0 | 0 | 0 |
| 20 | russell-capital-patents | `russell-capital-patents` | `master` | 2026-09-13 | 1 | 0 | 0 | 0 | 0 | 0 |
| 21 | russell-capital-skills | `russell-capital-skills` | `master` | 2026-06-28 | 1 | 0 | 0 | 0 | 0 | 0 |

¹ The corpus figure is the sum across all six `App.tsx` files it contains
(`russell-capital-systems`, `russell-capital`, `Patent360`, `doctor-buddy`,
`stop-fatty`, `AQAL/aqal-platform`). The live application's own figure is
**330** on `master`. The corpus totals are not one application.

---

## 4. Classification

**Tier A — the application (1 repo).**
`sam-russell-corpus/russell-capital-systems`. 330 routes, 155 database tables,
110 server modules, 190 shared modules, 4,138 passing tests. This is the
artifact everything else is measured against.

**Tier B — full-size donors (2 repos, ~1,150 TS files each).**
`russell-capital` and `russell-capital-app`. Near-identical to each other:
both declare 41 duplicate routes in the same pattern and share 260-261 page
filenames with the live build. `russell-capital-app` is the larger snapshot;
`russell-capital` is the only one of the two with real commit history. These
are the only repositories that can contribute pages at volume.

**Tier C — separate products (5 repos).**
`aqal`, `aqal-platform`, `joinaqal-superior-build`, `patent360`,
`russell-biomedical`, plus `doctor-buddy` and `stop-fatty` inside the corpus.
These are distinct applications with their own domains and user models. They
are **not** RCS pages and must not be counted toward the page total. Their
43 non-RCS routes are excluded from the 394 in document 04.

**Tier D — empty or content-only (13 repos).**
Zero TypeScript files. `rcs-axiom-atlas`, `rcs-four-halls`, `rcs-new-new-new`,
`rcs-really-russell-capital`, `rcs-samtheinsuranceman-debug.github.io`,
`rcs-solutions-new`, `rcs-the-new-plan`, `russell-capital-analyses`,
`russell-capital-combinations`, `russell-capital-nlp`,
`russell-capital-patents`, `russell-capital-skills`, `russell-biomedical`.

Several are large on disk (`rcs-solutions-new` 22 MB, `russell-capital-patents`
9.7 MB, `rcs-the-new-plan` 8.7 MB) because they hold documents, PDFs and
assets. **Content is not nothing** — the patent corpus in particular is
referenced by `shared/patentCatalog.ts`. But none of them contains code to
merge, so none of them generates a migration PR.

---

## 5. What this means for the consolidation

1. **There are two donors, not twenty-one.** Tier B is the whole code-migration
   surface. Tiers C and D generate zero code PRs between them.
2. **Git will not arbitrate.** One commit per donor means no ancestry. Every
   "which version wins" question is answered by content and tests, never by date.
3. **The donors are near-duplicates of each other.** Migrating from both would
   double-import. Document 06 picks one donor per capability and says why.
4. **No repository is deleted, archived or altered by this plan.** The standalone
   copies stay exactly where they are; they simply stop being maintained.

---

## 6. Reproducing this table

```bash
for d in /home/user/*/; do
  name=$(basename "$d"); [ -d "$d/.git" ] || continue; cd "$d" || continue
  remote=$(git remote get-url origin 2>/dev/null); branch=$(git branch --show-current)
  last=$(git log -1 --format=%cs); commits=$(git rev-list --count HEAD)
  routes=$(grep -rho 'path="[^"]*"' --include=App.tsx . | wc -l)
  pages=$(find . -path ./node_modules -prune -o -path '*/pages/*' -name '*.tsx' -print | wc -l)
  shared=$(find . -path ./node_modules -prune -o -path '*/shared/*' -name '*.ts' -print | grep -v '\.test\.' | wc -l)
  tests=$(find . -path ./node_modules -prune -o -name '*.test.ts' -print -o -name '*.test.tsx' -print | wc -l)
  ts=$(find . -path ./node_modules -prune -o \( -name '*.ts' -o -name '*.tsx' \) -print | wc -l)
  echo "$name|$remote|$branch|$last|$commits|$routes|$pages|$shared|$tests|$ts"
done
```
