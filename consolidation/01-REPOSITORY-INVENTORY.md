# 1 — Repository and capability inventory

Survey date: 2026-09-20. Eighteen repositories under `samtheinsuranceman-debug`
were cloned and measured. Every number below is counted from git-tracked files,
not estimated. The commands that produced them are in `tools/`.

## 1.1 The estate

| Repository | Last commit | Commits | Tracked files | ts/tsx | server files | test files | Markdown | PDF |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **sam-russell-corpus** | 2026-09-19 | 112 | 4232 | 2338 | 597 | 341 | 1083 | 231 |
| russell-capital | 2026-09-20 | 33 | 2187 | 1506 | 337 | 201 | 14 | 3 |
| russell-capital-app | 2026-09-05 | 1 | 1349 | 1159 | 149 | 98 | 9 | 0 |
| joinaqal | 2026-09-16 | 5 | 583 | 408 | 134 | 67 | 64 | 3 |
| joinaqal-superior-build | 2026-08-30 | 1 | 546 | 401 | 128 | 65 | 45 | 1 |
| aqal | 2026-08-12 | 1 | 359 | 268 | 93 | 38 | 20 | 3 |
| patent360 | 2026-09-11 | 1 | 218 | 50 | 0 | 0 | 6 | 0 |
| aqal-platform | 2026-06-30 | 1 | 184 | 149 | 33 | 8 | 3 | 0 |
| Russell-Capital-Calibrate-System | 2026-06-28 | 1 | 125 | 90 | 5 | 1 | 12 | 1 |
| russell-capital-reports | 2026-06-28 | 1 | 124 | 0 | 0 | 0 | 29 | 1 |
| russell-capital-patents | 2026-09-13 | 1 | 79 | 0 | 0 | 0 | 24 | 53 |
| russell-capital-solutions-new | 2026-09-01 | 1 | 59 | 0 | 0 | 0 | 38 | 18 |
| russell-capital-analyses | 2026-06-28 | 1 | 35 | 0 | 0 | 0 | 8 | 1 |
| russell-capital-skills | 2026-06-28 | 1 | 17 | 0 | 0 | 0 | 14 | 1 |
| russell-biomedical | 2026-09-05 | 1 | 14 | 0 | 0 | 0 | 9 | 0 |
| russell-capital-combinations | 2026-06-28 | 1 | 12 | 0 | 0 | 0 | 9 | 1 |
| russell-capital-nlp | 2026-06-28 | 1 | 12 | 0 | 0 | 0 | 9 | 1 |
| Really-Russell-Capital | 2026-06-28 | 7 | 7 | 0 | 0 | 0 | 4 | 1 |

Scoped to the application itself, `sam-russell-corpus/russell-capital-systems`
carries 2004 tracked files: 1097 ts/tsx, 373 under `server/`, 226 test files,
188 under `shared/`, and 325 page components.

## 1.2 Disposition

The decision recorded by the owner: **`sam-russell-corpus` is the sole canonical
consolidation base**, specifically the `russell-capital-systems/` subtree. This
survey supports that decision and does not reopen it. An earlier independent
survey reached the same verdict (`russell-capital/docs/consolidation/BASE_BUILD_DETERMINATION.md`,
2026-09-18) on different evidence — server file count, provenance manifest, and
build pipeline.

| Repository | Disposition | Why |
|---|---|---|
| **sam-russell-corpus** | **BASE** | Only build with a real backend, database layer, provenance manifest and custom build pipeline. Its suite runs 4220 tests with zero failures (§3). Owner decision. |
| russell-capital-app | DONOR (narrow) | Richest implementation of the shared page surface (§2.3). Postgres/Vercel patterns — but see the dialect blocker in §2.5. |
| russell-capital | DONOR (narrow) | Nine portal routes not present anywhere else; behavioural schema; page/content modules selected individually. |
| joinaqal | REFERENCE | AQAL is a **separate product**, not a Russell Capital surface: 96 routes, only 8 of which overlap the live app. Its newest copy is already vendored at `sam-russell-corpus/AQAL/aqal-platform` with an identical route set. |
| joinaqal-superior-build | ARCHIVE | Route set byte-identical to `joinaqal`; superseded. |
| aqal, aqal-platform | ARCHIVE | 42 and 23 routes; strict subsets of the joinaqal lineage. |
| patent360 | REFERENCE | 6 routes; already vendored at `sam-russell-corpus/Patent360`. |
| Russell-Capital-Calibrate-System | REFERENCE | 13 routes, 10 not in live; calibration instrument, not platform. |
| russell-capital-patents | ARCHIVE (content) | 53 PDFs, 24 documents. No code. Patent record. |
| russell-capital-reports, -analyses, -nlp, -combinations, -skills, russell-biomedical, russell-capital-solutions-new, Really-Russell-Capital | ARCHIVE (content) | No TypeScript at all. Markdown and PDF corpora. |

**Nothing in this table is scheduled for deletion or archiving by this PR.**
"Archive candidate" is a description, not an action.

## 1.3 What is actually at stake

The live build already contains far more of the proposed migration surface than
the plan assumed. Two findings change the shape of the work and are evidenced in
§2 and §4:

1. The gamification engine and its 20 portal routes are **already in the live
   build**. Only 2 of the 385 proposed pages carry any gamification code.
2. The Sacred Seven are **already in the live build**, and one of the seven
   (`TheStrategyTable`) is larger in live than in the donor.
3. `master` is converging on its own. Measured first against an older branch and
   then against `origin/master`, the donor-only engine count fell from 40 to 10
   and the live route count rose from 266 to 330 — inside this survey. Every
   count in these documents is therefore stamped to commit `76ed5f2` and must be
   recomputed at the start of each migration PR, not carried forward.
