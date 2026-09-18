# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 00 — START HERE (read this file first)

**Prepared:** 2026-09-18 · **From:** Claude session `session_01GDyUsq4kDze9T1KGzUv8Vb` · **For:** Perplexity (chat or Computer), and any AI that continues this build.

### How this briefing is packaged

Seven plain-markdown files. No zip, no archive, nothing to unpack. Each file is self-contained and small enough to paste into a chat window on its own. Read them in order, or jump to the one you need.

| File | What it answers |
|---|---|
| **00 — START HERE** (this file) | What the platform is, where the code lives, how to run it, the rules you must not break |
| **01 — INSTRUCTIONS & TASK LEDGER** | Every instruction the owner gave, what is finished (with commit hashes), what is outstanding and in what priority |
| **02 — BLOCKERS** | Every place the previous builder got stuck, why, and exactly what unblocks it — including who has to do it |
| **03 — THE 10/10 PAGE CONTRACT** | The ten rules every page must pass, how each one is checked in code, and how a page scores itself |
| **04 — PER-CATEGORY REQUIREMENTS** | For each of nine page types: what is necessary, what to add, what to connect, what to delete, what to measure |
| **05 — ONE ORGANISM** | The wiring rules that turn 115 pages into one system, plus the universal evidence-toggle specification |
| **06 — BUILD ORDER + DATA REGISTRY** | P0→P5 phases with pass/fail completion checks, and every public data source with its real coverage window |

### What this platform is

Russell Capital Systems is a wealth-technology platform: ~115 catalogued financial calculators and simulators (mortgage acceleration, indexed universal life, annuities, tax, PSLF, divorce, long-term care, real-estate sequencing), a behavioral-intelligence layer (200+ NLP calibration questions feeding a "Wealth Genome" profile), and an AI brain (composite mind + council) that can reason over all of it. It is a React 19 / Vite / Tailwind 4 front end on a tRPC v11 + drizzle-orm (MySQL) back end, deployed on Railway.

### Where the code is

GitHub org/user: `samtheinsuranceman-debug`

| What | Repo → folder | Branch | Head |
|---|---|---|---|
| **BASE reference build** — the trunk plus every harvested feature. **All work happens here.** | `sam-russell-corpus` → `russell-capital-systems/` | `claude/base-consolidation` | `72a5fac` |
| Production (Railway → www.russellcapitalsystems.com) | same folder | `master` | `ec3d057` |
| The 688-page build — audited and being mined, **not** the base | `russell-capital` | `claude/homepage-portrait-day-sign-5o0l9d` | `b12e85e` |
| Pure engine kit (engines, no UI) | `sam-russell-corpus` → `russell-capital/` | `master` | — |
| Doctor-buddy site | `sam-russell-corpus` → `doctor-buddy/` | `master` | — |
| Patent360 design system | `sam-russell-corpus` → `Patent360/` | `master` | — |

The full handoff also lives in the repos as `docs/MASTER_HANDOFF_2026-09-18.md` (BASE) and `docs/audit/MASTER_HANDOFF_2026-09-18.md` (688 build). These Perplexity files live at `docs/perplexity/` in BASE.

### Current measured state — numbers, not adjectives

| Fact | Value | Where it is measured |
|---|---|---|
| TypeScript errors | 0 | `pnpm check` |
| Test files / tests | 213 / 4,076 green | `pnpm test` |
| Route patterns | 330 | asserted by two smoke tests |
| Catalogue pages | 115+ | `shared/calculatorCatalog.ts` |
| Memory-bank groups wired to the brain | 29 | `shared/aiMemoryBank.ts` (`unwiredGroups()` = 0) |
| **Mean page wiring score** | **3.3 / 10** | `docs/INTEGRATION_SCORECARD.md` |
| 688-build audit average (utility-weighted) | 4.3 / 10 | `docs/audit/PAGE_AUDIT_688.md` |
| Pages at 10 / below 5 | 0 / 76 | integration scorecard |
| Pages no genome strategy routes to | 101 of 115 | integration scorecard |
| Pages with no provenance trace | 112 of 115 | integration scorecard |
| Pages with no live data | 104 of 115 | integration scorecard |
| Pages fewer than two surfaces link to | 104 of 115 | integration scorecard |
| Patent claims drafted / filed | 57 / 0 | `shared/patentStatus.ts` |
| Named providers / with a verified record | 39 / 6 | `shared/mechanismDossiers.ts` |
| Lender records / with verified phone | 15 / 5 | `shared/altCredit/lenders.ts` |

**The diagnosis in one sentence: the engines are strong; the wiring between them is the gap, and the gap is measured.**

### How to run it

```bash
cd russell-capital-systems
pnpm install
pnpm check      # TypeScript — must be 0 errors
pnpm test       # vitest, ~4 minutes — must be green
pnpm dev        # http://localhost:3000
```

Environment: `DATABASE_URL` (MySQL) is required. Optional but unlocking: `FRED_API_KEY`, `CENSUS_API_KEY`, `ZIP_DATA_DAYS=30`, `RENTAL_DATA_DAYS=30`. See `docs/API_KEYS_WHERE_TO_GET_THEM.md`.

Database schema: `database/rcs-schema.sql`, regenerated with `scripts/export_schema_sql.sh` (runs offline).

### Rules you must not break

1. **Never push to `master`.** It deploys to production on Railway. All work goes on `claude/base-consolidation`. Merging to master is the owner's decision, made by the owner.
2. **Never open a pull request** unless the owner explicitly asks for one.
3. **Every change is gated.** `pnpm check` must be 0 and `pnpm test` must be green before any commit. No exceptions, no "I'll fix it next commit."
4. **Adding a route breaks three tests unless you also:** add the nav entry in `client/src/components/AppShell.tsx`, bump the counts in `server/managed-port.smoke.test.ts` and `server/grok-merge.smoke.test.ts`, and add the catalogue entry in `shared/calculatorCatalog.ts`.
5. **Changing the database schema** requires regenerating `database/rcs-schema.sql` or `databaseSchemaFile.test.ts` fails.
6. **No purple.** `concept16Homepage.test.ts` fails the build on any `violet-`, `purple-`, `#a78bfa`, `#8b5cf6`, `#7c3aed`, or `rgba(124,58,237)` anywhere in `client/src`. The palette is emerald and gold. This guard is deliberate.
7. **No modern iteration.** `tsconfig.json` has no `target` and no `downlevelIteration`, so it compiles to ES5. Do not use `[...someSet]`, `for…of` over a `Map` or `Set`, or `.matchAll()`. Use `Array.from()`.
8. **Secrets never go in `shared/`.** That folder is bundled to the browser.
9. **No number without a source.** Any figure shown to a user carries `{source, asOf, window, method}`. Where no public series exists, return `null` with the reason — never an estimate dressed as a fact.
10. **Nothing says "patent pending"** until a provisional is actually filed. A test enforces this.

### The one-line summary of what needs to happen

Take a platform whose engines are excellent and whose pages are islands, and wire every page to the same household state, the same sourced data, the same rules tables, and the same AI brain — so that no figure appears without its provenance, no page is a dead end, and every calculator can optionally run on 36 years of real history instead of a flat assumption.

**Next file: 01 — INSTRUCTIONS & TASK LEDGER.**
