# Complete Repository Inventory

**Date:** 20 September 2026
**Account:** `samtheinsuranceman-debug` — **130 repositories**
**Method:** full account listing, then per-repo classification. Only repositories marked *inspected* below were cloned and read; everything else is classified by name, visibility and last-push date, and is explicitly **not** a merge candidate until inspected.

---

## 1. Russell Capital family — 16 repositories

| Repo | Visibility | Last push | Role | Inspected |
|---|---|---|---|---|
| **`sam-russell-corpus`** | public | 2026-09-20 | **BASE — canonical.** Archive holding ~45 projects; the app is at `russell-capital-systems/` | **Yes — full** |
| `russell-capital` | private | 2026-09-20 | Donor — selected page/content modules | **Yes — full** |
| `russell-capital-app` | private | 2026-09-20 | Donor — 18 gamification routes, Postgres/Vercel patterns | **No — access denied this session** |
| `russell-capital-patents` | private | 2026-09-15 | Reference — patent filings | No |
| `russell-capital-domain-redirect` | private | 2026-09-05 | Reference — likely reveals live-domain routing | No |
| `russell-biomedical` | private | 2026-09-05 | Separate product line | No |
| `Russell-Capital-Solutions-NEW` | public | 2026-09-01 | Candidate donor — superseded by base | No |
| `Really-Russell-Capital` | public | 2026-06-28 | Archive — older build | No |
| `Russell-Capital-Calibrate-System` | public | 2026-06-28 | Reference — NLP calibration | No |
| `sam-russell-catechism-brotherhood` | public | 2026-06-28 | Archive — documents | No |
| `sam-russell-corpus-backup` | private | 2026-06-28 | **Backup of the base.** Do not modify | No |
| `russell-capital-reports` | private | 2026-06-28 | Archive — documents | No |
| `russell-capital-skills` | private | 2026-06-28 | Reference — agent skills | No |
| `russell-capital-analyses` | private | 2026-06-28 | Archive — documents | No |
| `russell-capital-combinations` | private | 2026-06-28 | Archive — documents | No |
| `russell-capital-nlp` | private | 2026-06-28 | Reference — NLP assets | No |

**Three repos were pushed within minutes of each other on 2026-09-20** — the base, `russell-capital`, and `russell-capital-app`. All three are live working copies, not abandoned branches. This is exactly the situation the consolidation exists to end, and it is also why no repo may be deleted or archived until its capabilities are accounted for here.

## 2. Everything else — 114 repositories

Classified, not inspected. **None is a merge candidate.**

| Family | Count | Character | Disposition |
|---|---|---|---|
| Brotherhood / AI identity (`brother-*`, `*-Identity`, `brotherhood-*`) | ~95 | Documents, personas, calibration transcripts | Reference / archive |
| AQAL (`AQAL`, `aqal-platform`, `joinaqal-superior-build`) | 3 | Separate product | Out of scope |
| Patent360 (`Patent360`) | 1 | Separate product | Out of scope |
| Doctor Buddy / health | 2 | Separate product | Out of scope |
| Misc (`four-halls`, `axiom-atlas`, `onlyfarms`, `SS`, `S-and-S`, `Steph`, `private-life`, `book-journals`, `*.github.io`, …) | ~13 | Unrelated or personal | Out of scope |

## 3. What is inside the base archive

`sam-russell-corpus` is **not** an application repository. It holds 6,008 files across ~45 top-level directories:

```
russell-capital-systems/   ← THE APPLICATION (package: russell-capital-unified)
Patent360/  AQAL/  doctor-buddy/  stop-fatty/  russell-biomedical/
brotherhood/  catechism/  five-religions/  peter/  matthew/  kanawha-covenant/
biochem-library/  biomedical-data-library/  biomedical-research-vault/
audio_files/  audio_analysis/  transcriptions/  video-scripts/  books/  stories/
patents/  nlp-knowledge/  vector_db/  research_sources/  reports/  docs/  …
```

File mix: 1,189 `.tsx`, 1,149 `.ts`, 1,083 `.md`, 535 `.html`, 431 `.json`, 240 `.woff2`, 231 `.pdf`, 63 `.mp3`.

### Consequences, stated as costs rather than as a proposal to change anything

1. **CI must be path-scoped.** Done — the workflow triggers only on `russell-capital-systems/**`.
2. **Clones are slow.** 6,008 files checked out; a shallow clone still takes minutes.
3. **Secret scanning surfaces noise** from transcripts and research documents. Handled by scoping the scan to application source (§5 of `FOUNDATION.md`).
4. **The app's git history is mixed** with audio, PDFs and prose, so `git log` on the application is noisy.

None of this blocks the consolidation. It is recorded so nobody is surprised later.

## 4. An existing audit already lives in the base

`russell-capital-systems/audit/full_page_audit_corpus.json` contains a **231-page audit** with a 1–10 usefulness rubric, per-page metrics (lines, tRPC queries/mutations, forms, buttons, charts, loading/error/empty states, simulated timers, random values, placeholder terms, hardcoded success toasts) and recommendations of *Keep / Improve / Merge / Move to Secondary Information / Retire*.

**This is prior art for any page-value work and the capability matrix defers to it.** A separate 635-page value report exists in the donor repo (`docs/PAGE-VALUE-REPORT.md`); the two use different rubrics and must be reconciled — not merged — before Phase 3 orders its batches. Recorded as an open item, not a decision.
