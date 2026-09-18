# MANIFEST
## RCS_Claude_Session_01

**Session:** `session_01GDyUsq4kDze9T1KGzUv8Vb` · 2026-09-08 → 2026-09-18
**Owner:** Samuel A. · **Prepared for:** Perplexity, and any AI continuing this build
**Subject:** Russell Capital Systems — consolidation, evidence layer, and the path from 4.3 to 10

---

## 1. Contents

```
RCS_Claude_Session_01/
├── MANIFEST.md              ← you are here
├── executive_summary.md     ← start here: state, what was built, what is urgent
├── transcript.md            ← the decision record: every owner instruction, every substantive reply
├── recommendations.md       ← the 10-rule page contract, 9 page categories, wiring, toggles
├── architecture.md          ← stack, layering, evidence flow, invariants, engine inventory
├── code/
│   ├── README.md                          ← what both engines do and why
│   ├── realEstateCapitalStackEngine.ts    ← 533 lines, in the build, 308-line test
│   └── historicalMarketRegimeEngine.ts    ← 564 lines, written for this package, 19 tests
├── data/
│   ├── questions.csv        ← 10 research jobs for Perplexity, with acceptance criteria
│   ├── assumptions.json     ← every assumption in the engines: value, sourced?, replacement
│   └── sources.csv          ← 20 data sources with real coverage windows
└── reports/
    └── scorecard.pdf        ← 5-page integration scorecard
```

## 2. Reading order

| If you have | Read |
|---|---|
| Two minutes | `executive_summary.md` §2 and §4 |
| Fifteen minutes | `executive_summary.md` in full, then `reports/scorecard.pdf` |
| You are doing the research | `data/questions.csv` — that is your work order |
| You are writing code | `architecture.md`, then `code/README.md`, then `data/assumptions.json` |
| You are deciding priorities | `recommendations.md` Part 2, then §5 below |
| You want the history | `transcript.md` |

## 3. What each file is for

**`executive_summary.md`** — What the platform is, the measured state, what was built this session, the four flagship defects (including a correction to two I reported wrongly earlier), what the public record can and cannot supply against the 36-year requirement, and the seven research jobs.

**`transcript.md`** — Every instruction from the owner verbatim; Claude's substantive replies in full. Tool calls, tool output and internal reasoning removed. 25 owner turns, 193 Claude turns, ~200 KB. The raw 27 MB transcript exists separately if anyone needs it; this is the decision record.

**`recommendations.md`** — The ten-rule page contract with pass criteria; what each of nine page categories must have, add, connect, delete and measure; the eight wiring rules; the universal evidence-toggle specification; the auto-population chain.

**`architecture.md`** — Stack and compiler constraints, repository layout, the layering rule, the evidence flow end to end, the AI brain, the test-enforced invariants (and how to avoid breaking them), engine inventory, and an honest list of where the architecture is currently violated.

**`code/`** — Two engines and a README explaining the modelling decisions that change the numbers, usage, how they plug into the page contract, and their honest limits.

**`data/questions.csv`** — Ten research jobs, each with priority, why it matters, the required output shape, and acceptance criteria. Q-01 through Q-03 are P0.

**`data/assumptions.json`** — Every assumption in the engines with its current value, line number, whether it is sourced, and what would replace it. Includes a `withdrawnClaims` block for the two findings I got wrong.

**`data/sources.csv`** — Twenty data sources with publisher, geography, real coverage window, whether wired, and what each feeds. Three rows record that a requested series does not exist.

**`reports/scorecard.pdf`** — Five pages: where the catalogue stands, the ten-rule contract with per-rule status, the verified defect table with withdrawals, data coverage against the 36-year requirement, and build order.

## 4. State of the build

| | |
|---|---|
| Repo | `samtheinsuranceman-debug/sam-russell-corpus` → `russell-capital-systems/` |
| Branch | `claude/base-consolidation` |
| Typecheck | **0 errors** |
| Tests | **214 files / 4,095 passing** |
| Routes | 330 |
| Catalogue | 115+ pages |
| Memory groups wired to the brain | 29 (`unwiredGroups()` = 0) |
| Mean page wiring | **3.3 / 10** |

Production is `master` at `ec3d057`, deployed on Railway to www.russellcapitalsystems.com. **Never push to `master`** — merging is the owner's decision.

## 5. Priorities

| Priority | Work | Owner |
|---|---|---|
| **P0** | Four flagship defects: missing cost of insurance; undeducted loan drag; crediting rate above the product cap; total-return table where price return is required | Builder |
| **P0** | Provider verification (Q-01), equity-share eligibility (Q-02), AG 49-A caps (Q-03) | **Perplexity** |
| **P0** | Extract the shared evidence panel and `withEvidence()`; apply catalogue-wide | Builder |
| **P1** | Deposit statutes (Q-04); AHS tenure adapter; Shiller adapter | Perplexity + builder |
| **P1** | ZIP, county and property list into the fact finder — the highest-leverage single change | Builder |
| **P1** | Owner decisions: gate password; merge BASE to master; default design system | **Owner** |
| **P2** | Authorise OpenRouter, Speko, Stripe; set the Railway variables | **Owner** |
| **P2** | Mine the 688 build — Bucket A (43) fix, B (138) embed, D (119) retire | Builder |
| **P3** | File a provisional patent — 57 claims drafted, 0 filed | Owner + counsel |

## 6. Standing rules

1. **Never push to `master`.** Work on `claude/base-consolidation`.
2. **No pull requests** unless the owner asks.
3. **Every change gated:** `pnpm check` at 0 and `pnpm test` green before committing.
4. **Adding a route** also requires the nav entry, both smoke counts, and the catalogue entry — or three tests fail.
5. **No purple.** A test enforces emerald and gold.
6. **ES5 output.** No spreading a `Set`, no `for…of` over a `Map`, no `.matchAll()`. Use `Array.from()`.
7. **Secrets never in `shared/`** — that directory ships to the browser.
8. **No number without a source.** Where no public series exists: `null` plus the reason, never an estimate.
9. **Nothing says "patent pending"** until a provisional is filed. A test enforces it.
10. **For research: a cited, dated primary source, or an explicit "not found."** A plausible guess is worse than a blank — a blank is honest, and a guess eventually gets printed on an illustration and handed to a family.

## 7. Two things worth knowing before you trust this package

**I corrected myself.** Two of the four flagship defects I reported earlier in this session were wrong — I had carried line numbers from the 688-page build into claims about the BASE build. The corrected findings are in `executive_summary.md` §4, `data/assumptions.json` under `withdrawnClaims`, and page 3 of the scorecard. A retracted finding that stays in circulation is worse than one never made.

**One requested file did not exist.** Perplexity's structure named `historicalMarketRegimeEngine.ts`. It was in no repository. It is now written, tested (19 tests), committed, and it answers a real gap the roadmap had already identified — resampling conditioned on market regime rather than drawn blindly from the whole record.
