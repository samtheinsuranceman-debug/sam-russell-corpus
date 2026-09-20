# 1 — Repository and Capability Inventory

All figures measured on 2026-09-20 from working clones, not from prior documents.

---

## The canonical base

| | |
|---|---|
| Repo | `samtheinsuranceman-debug/sam-russell-corpus` (public) |
| Branch | `master` @ `76ed5f2` |
| App subfolder | `russell-capital-systems/` |
| Package | `russell-capital-unified` v1.0.0 |
| Stack | React 19 + Vite SPA · Express + tRPC v11 · Drizzle ORM over **MySQL** |
| Host | **Railway** — project `RCS`, service `web` |
| Public origin | `https://www.russellcapitalsystems.com` → CNAME `dd56isi9.up.railway.app` |
| Apex | `russellcapitalsystems.com` on GitHub Pages, forwards to www |
| Deploy path | `deploy-branch.yml` splits `russell-capital-systems/` to branch `deploy/rcs`; Railway deploys that |
| Provenance | Checkpoint `bcfe0624`, 1,073 source files, SHA-256 verified against `PARTS_MANIFEST.json` — 0 missing, 0 mismatches |

### Measured scale

| Capability | Count |
|---|---|
| Routes registered in `App.tsx` | **330** |
| Entries in `shared/routeManifest.ts` | **330** — exactly in sync |
| Page components | 325 |
| Pages scored in `docs/audit/pageRegistry.json` | 309 |
| Shared modules (`shared/*.ts`) | **174** |
| Named engines (`*Engine.ts` and equivalents) | **55** |
| Server TypeScript files | 372 |
| Test files | 226 |
| Drizzle schema tables | **155** |
| Migrations | **65** — 5 in `drizzle/` (to 0069) + 60 in `drizzle/migrations/` (to 0073). Next safe number is **0074** |
| GitHub Actions workflows | 12 |

### Registries that exist — and must not be overwritten

There is **no** single `ENGINE_REGISTRY` or `CALCULATOR_REGISTRY` constant. What
actually plays the registry role, and what the brief's protection clause therefore
applies to:

| Artifact | Role | Protection |
|---|---|---|
| `shared/routeManifest.ts` | 330 route paths, one per line. Two smoke tests diff it against `App.tsx` in both directions | **Append only.** It was deliberately changed from an integer count to a list because the integer was the repo's most reliable merge conflict. Never rewrite it wholesale |
| `audit/route_manifest.json` | Per-route audit record: component, category, source file + hash, 18 metrics | Regenerate via `scripts/reconcile-route-manifest.mjs`, never hand-edit |
| `docs/audit/pageRegistry.json` | 309 pages with hub assignment, value score, engine dependencies, integrity flags | Regenerate, never hand-edit |
| `docs/CALCULATOR_CATALOG.md` | The calculator catalogue and its repair history | Narrative — update, do not replace |
| `shared/*Engine.ts` (55 files) | The engines themselves. No central index | Each is individually canonical |

The route manifest's design note is worth respecting literally: *"A list does not
collide. Two branches adding different routes produce two non-overlapping line
insertions."* Migration PRs should add lines to it, never regenerate it.

---

## Donors

### `russell-capital` (private) — MySQL, no host config

| Capability | Count | vs live |
|---|---|---|
| Routes | 664 | +435 not in live |
| Shared modules | 65 | 7 not in live |
| Engines | 32 | 4 not in live |
| Schema tables | 117 | MySQL, same dialect as live |

**Donates:** the 9 genuinely-missing gamification pages, 4 engines, and individually
selected page/content modules. **Does not** donate the Sacred Seven — it has none.

Its 664 routes are inflated by systemic duplication (13+ charitable-trust routes,
5 separate 1031 routes, 3 AMT routes). Route count is not a measure of capability
here; most of the excess is the same tool registered under several paths.

### `russell-capital-app` (private) — **Postgres, Vercel**

| Capability | Count | vs live |
|---|---|---|
| Routes | 612 | +385 not in live |
| Shared modules | 62 | identical set to `russell-capital` minus 3 |
| Engines | 32 | same 4 not in live |
| Schema tables | 116 | **`pg-core`** — different dialect |

**Donates:** implementation *patterns* only. Confirmed Postgres + `vercel.json` +
`api/index.ts` serverless entry. Also carries the Sacred Seven and 41 unrouted
`ToggleHub` consolidation pages.

**Treat as a reference, not a parts bin.** UI code can port with review. Anything
touching the database is a dialect migration. Vercel serverless patterns do not
map onto a long-lived Railway Express process.

### Everything else — 13 repositories

| Repo | Visibility | Classification |
|---|---|---|
| `russell-capital-patents` | private | Reference — patent filings |
| `russell-capital-nlp` | private | Reference — original 200-question instrument, cited by name in the live NLP corpus |
| `russell-capital-combinations` | private | Reference — strategy combination data |
| `russell-capital-analyses` | private | Reference |
| `russell-capital-reports` | private | Reference |
| `russell-capital-skills` | private | Reference — agent skills |
| `russell-capital-domain-redirect` | private | Infrastructure — **do not touch**, DNS-adjacent |
| `Russell-Capital-Solutions-NEW` | public | Archive — Brotherhood/NLP corpus, PDFs. Source of `knowledge/nlp/` material |
| `Russell-Capital-Calibrate-System` | public | Reference — 13-page calibration app, `ideas.md` unread |
| `Really-Russell-Capital` | public | Archive — docs only, no code |
| `sam-russell-corpus-backup` | private | Archive — backup of the canonical base |
| `sam-russell-catechism-brotherhood` | public | Archive — theological corpus |
| `russell-biomedical` | private | Out of scope — different vertical |

**None of these is a merge candidate.** Several are already represented inside the
canonical base: `sam-russell-corpus` contains `nlp-knowledge/`, `brotherhood/`,
`coaching_system/`, `patents/`, `russell-biomedical/` and `russell-capital/` as
subfolders. Check inside the base before importing from a sibling repo — the
material is frequently already there and newer.

---

## The capability the brief did not account for

`shared/nlpBrain.ts` (917 lines), `shared/compositeMind.ts` (251), and
`shared/council/nlpEngine.ts` (324) are a **complete, sourced, test-enforced NLP
layer already live**:

- **51 meta-programs**, each with elicitation question, poles, text markers, and a
  `speakTo` instruction per pole — with a test that fails if any pole lacks one
- Representational systems with predicate lexicons **tested to be disjoint**
- **32 language patterns** across Milton, Meta-model, reframing, and pacing
- A seven-phase emotional arc with a hard sentence cap per phase
- Twelve composite-mind channels as working memory, explicitly not personalities
- Per-block provenance to the corpus files each was lifted from

This materially outclasses the 29-axis module authored earlier in this session, and
it changes the disposition of that work. See `02_CAPABILITY_MATRIX.md`.
