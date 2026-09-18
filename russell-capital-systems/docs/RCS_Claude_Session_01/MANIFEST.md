# MANIFEST
## RCS_Claude_Session_01 — Session B

**Session:** `session_01GDyUsq4kDze9T1KGzUv8Vb` · 2026-09-08 → 2026-09-18
**Owner:** Samuel A. · **For:** Perplexity, and any AI continuing this build
**Subject:** Russell Capital Systems — consolidation, evidence layer, regime engine, and the path from 4.3 to 10

---

## 0. Read this before anything else

**Two Claude sessions built in parallel and both produced a folder named `RCS_Claude_Session_01`.** Neither supersedes the other; they contain different code and different research.

| | Session A | Session B (this folder) |
|---|---|---|
| On GitHub | `master` → `russell-capital-systems/docs/handoff/RCS_Claude_Session_01/` | `claude/base-consolidation` → `russell-capital-systems/docs/RCS_Claude_Session_01/` |
| Built | Sequencing, cycles, thresholds, provider dossiers, scorecard machinery | Evidence layer, regime engine, toggles, six-build consolidation |
| Research | 16 questions, provider-heavy | 10 questions, data-source-heavy |

**Read Session A's `provider_verification_brief.md` first** — it is the most detailed research specification either session produced. Then read this folder. `integration_with_master.md` explains exactly how the two join, overlap by overlap.

---

## 1. Contents

```
RCS_Claude_Session_01/
├── MANIFEST.md                      ← you are here
├── executive_summary.md             ← the state, what was built, what is urgent
├── integration_with_master.md       ← ★ the three latest master saves, correlated to this work
├── roadmap.md                       ← ★ every outstanding project and what completes it
├── ideas_utility_multipliers.md     ← ★ 25 ideas: predictable, objective, consistent, legal, UI
├── ideas_value_multipliers.md       ← ★ 25 ideas: what raises what the platform is worth
├── recommendations.md               ← the 10-rule page contract, 9 categories, wiring, toggles
├── architecture.md                  ← stack, layering, evidence flow, invariants, engines
├── transcript.md                    ← decision record: owner instructions + substantive replies
├── chat_history_part01.md           ← ★ complete history, turns 1–591
├── chat_history_part02.md           ← ★ turns 592–1067
├── chat_history_part03.md           ← ★ turns 1068–1533
├── chat_history_part04.md           ← ★ turns 1534–1631
├── code/
│   ├── README.md
│   ├── realEstateCapitalStackEngine.ts    533 lines, already in the build
│   └── historicalMarketRegimeEngine.ts    564 lines, written this session, 19 tests
├── data/
│   ├── questions.csv                10 research jobs with acceptance criteria
│   ├── assumptions.json             every engine assumption, sourced or not
│   └── sources.csv                  20 sources with real coverage windows
└── reports/
    └── scorecard.pdf                5 pages
```

★ = new since the previous version of this folder.

## 2. Reading order

| If you have | Read |
|---|---|
| Two minutes | `executive_summary.md` §2 and §4 |
| You are joining the two sessions | `integration_with_master.md` — start at §0 |
| You are doing research | `data/questions.csv`, after Session A's brief |
| You are deciding what to build next | `roadmap.md` |
| You want the improvement ideas | `ideas_utility_multipliers.md`, then `ideas_value_multipliers.md` |
| You are writing code | `architecture.md` → `code/README.md` → `data/assumptions.json` |
| You need the full record | `chat_history_part01..04.md` — 1,631 turns, beginning to end |

## 3. What each file is

**`executive_summary.md`** — What the platform is, the measured state, what this session built, the four flagship defects with a correction to two I reported wrongly, what the public record can and cannot supply against the 36-year requirement, and the research jobs.

**`integration_with_master.md`** — The three most recent commits on `master` (`dc4cacc`, `ec3d057`, `8203d3f`), what each contains, and three concrete joins between Session A's code and this session's: the regime engine extending the shock library back twenty-one years; a shared `RulesTable<T>` interface; four new scorecard detectors. Plus the overlap table saying which session's version wins where, and the recommended merge order.

**`roadmap.md`** — Every outstanding project as: what exists, what is missing, what completes it, who can do it, and a done-when check that can fail. Sequenced P0 through P4, with owner-only decisions separated out.

**`ideas_utility_multipliers.md`** — 25 ideas in five families: predictability (result IDs, frozen snapshots, seeded randomness, cross-engine reconciliation, golden masters), objectivity (the refusal contract, evidence as a type, evidence scores, effective-date rules, coverage reporting), consistency (one formatter, route manifest, one rules interface, shared chart primitives, one vocabulary), **legally safer language** (a banned-phrase lint with approved replacements, embedded disclosures, guaranteed-versus-illustrated columns, suitability capture, watermarks and expiry), and **user experience** (one number first, visible inheritance, comparison by default, a scenario stack, advisor versus client modes).

**`ideas_value_multipliers.md`** — 25 ideas in five tiers with the reasoning for each: account aggregation, the single-entry walk, provenance everywhere, the flagship fixes; then regime wiring, shock extension, adverse replay, inversion, decision-ending simulations, household rollup; then pre-filled CTAs, shareable scenarios, compliance-grade PDFs, a public scorecard, the partner API; then the brain as a tool-runner that refuses rather than generates; then honest comparison, freshness, the provisional filing, white-label, and the cinematic layer on real numbers.

**`recommendations.md`** — The ten-rule page contract with pass criteria; nine page categories with what each must have, add, connect, delete and measure; the eight wiring rules; the evidence-toggle specification.

**`architecture.md`** — Stack and compiler constraints, repository layout, the layering rule, the evidence flow end to end, the AI brain, test-enforced invariants, engine inventory, and where the architecture is currently violated.

**`transcript.md`** — 25 owner turns verbatim, 193 Claude replies in full, tool noise removed. The decision record.

**`chat_history_part01..04.md`** — All 1,631 turns from beginning to end, including reasoning summaries and tool calls. Split at ~230 KB so each part fits a chat window.

**`code/`** — Two engines with a README covering the modelling decisions that change the numbers, usage, how they satisfy the page contract, and their honest limits.

**`data/questions.csv`** — Ten research jobs with priority, why each matters, required output shape, and acceptance criteria. Five of them Session A does not ask.

**`data/assumptions.json`** — Every assumption with value, line number, whether sourced, and its replacement — including a `withdrawnClaims` block for the two findings I got wrong.

**`data/sources.csv`** — Twenty sources with publisher, geography, real window, wired status. Three rows record that a requested series does not exist.

**`reports/scorecard.pdf`** — Five pages: catalogue state, the ten-rule contract with per-rule status, the verified defect table with withdrawals, data coverage against the 36-year ask, and build order.

## 4. State of the build

| | |
|---|---|
| Repo | `samtheinsuranceman-debug/sam-russell-corpus` → `russell-capital-systems/` |
| Branch | `claude/base-consolidation` (12 commits ahead of `master`) |
| Typecheck | **0 errors** |
| Tests | **214 files / 4,095 passing** |
| Routes | 330 |
| Catalogue | 115+ pages |
| Memory groups wired to the brain | 29 (`unwiredGroups()` = 0) |
| Mean page wiring | **3.3 / 10** |

Production is `master`, deployed on Railway to www.russellcapitalsystems.com. **Never push to `master`** — merging is the owner's decision.

## 5. Priorities

| Priority | Work | Owner |
|---|---|---|
| **P0** | Add cost of insurance to the IUL model — it charges nothing today | Builder |
| **P0** | Deduct the policy-loan drag; reconcile the crediting rate to the product's 6.35% cap; repoint the index table at price return | Builder |
| **P0** | Extract `EvidencePanel` + `withEvidence()`; apply across the catalogue | Builder |
| **P0** | Provider verification; equity-share eligibility; AG 49-A caps per product | **Perplexity** |
| **P1** | First real data sweep (needs two Railway variables beyond the nine already listed) | **Owner** |
| **P1** | ZIP into the fact finder — the highest-leverage single change | Builder |
| **P1** | Deposit statutes; AHS tenure adapter; Shiller adapter; three shared abstractions | Perplexity + builder |
| **P2** | Genome routes for 101 pages; provenance traces for 112; four scorecard detectors | Builder |
| **P2** | Authorise OpenRouter, Speko, Stripe; set eleven Railway variables | **Owner** |
| **P3** | Mine the 688 build; file one provisional patent | Builder / owner + counsel |

## 6. Standing rules

1. **Never push to `master`.** Work on `claude/base-consolidation`.
2. **No pull requests** unless the owner asks.
3. **Every change gated:** `pnpm check` at 0 and `pnpm test` green before committing.
4. **Adding a route** also needs the nav entry, both smoke counts and the catalogue entry, or three tests fail.
5. **No purple.** A test enforces emerald and gold.
6. **ES5 output.** No spreading a `Set`, no `for…of` over a `Map`, no `.matchAll()`. Use `Array.from()`.
7. **Secrets never in `shared/`** — it ships to the browser.
8. **No number without a source.** Where none exists: `null` plus the reason.
9. **Nothing says "patent pending"** until a provisional is filed. A test enforces it.
10. **Research returns a cited, dated primary source, or an explicit "not found."** A guess is worse than a blank — a blank is honest, and a guess eventually gets printed on an illustration and handed to a family.

## 7. Two things to know before trusting this package

**I corrected myself.** Two of the four flagship defects I reported earlier this session were wrong — I had carried line numbers from the 688-page build into claims about the BASE build. There is no interest-savings double-count, and the cost-of-insurance problem is absence, not inversion. The corrections are in `executive_summary.md` §4, `data/assumptions.json` under `withdrawnClaims`, `integration_with_master.md` §5, and page 3 of the scorecard. A retracted finding left in circulation does more damage than one never made.

**One requested file did not exist.** Perplexity's structure named `historicalMarketRegimeEngine.ts`. It was in no repository. It is now written, tested with 19 tests, committed, and it answers a gap the roadmap had already identified — resampling conditioned on market regime rather than drawn blindly from the record. It also turns out to solve a problem in Session A's code: their shock library cannot show 1973 or 1987, and this engine can classify both.
