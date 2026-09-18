# MANIFEST — RCS_Claude_Session_01

Handoff folder for Perplexity. Plain files, no archive. Also on GitHub at `russell-capital-systems/docs/handoff/RCS_Claude_Session_01/` in `samtheinsuranceman-debug/sam-russell-corpus`, branch `master`.

## Read in this order

1. **`master_build_correlation.md`** — the finding that reorders everything: two codebases, one of which runs nowhere.
2. `executive_summary.md` — the session in three pages.
3. `recommendations.md` — the roadmap, starting at P0a.
4. `provider_verification_brief.md` — the first research job.
5. `value_multipliers_25.md` and `experience_upgrades_25.md` — what to build once the foundation is sound.
6. `data/master_build_inventory.csv` and `data/questions.csv` — the work, machine-readable.
7. `architecture.md` and `code/README.md` — how it fits together.

`transcript.md` is the full record if a decision ever needs its context.

| File | Bytes | SHA-256 (first 16) | Purpose |
|---|---:|---|---|
| `architecture.md` | 8,460 | `d77150c08acca8f8` | Two codebases, the stack, the façade layer, the one object, the data flow, every registry and the test that guards it, the twelve live-data routers, the seven conventions, and the one the codebase should adopt next. |
| `executive_summary.md` | 6,714 | `1ef92ac87eb5bfaf` | The session in three pages, opening with the two-codebase finding. What was asked, what was built, what stopped short, the numbers worth remembering, where to start. |
| `experience_upgrades_25.md` | 10,467 | `8f26717998ba807f` | 25 experience upgrades: the first five minutes, making figures legible, the 104-page navigation problem, the advisor, and trust. Each with who it serves and why it is worth what it is worth. |
| `master_build_correlation.md` | 13,258 | `eeb3baae54712bc4` | **Read first.** The three most recent master saves read file by file against what this session built. Contains the finding that reorders the roadmap: ~5,900 lines of finished engine code in a folder nothing imports. Integration order, the one genuine conflict between two ranking engines, and the best idea in the repository (which is not mine). |
| `provider_verification_brief.md` | 19,150 | `c9bc3f380b7c79b9` | Perplexity's first research job: the 39 named providers — per-field source rules, mechanism-specific thresholds, integration map, known conflicts, JSON return schema keyed to the threshold registry. |
| `recommendations.md` | 22,834 | `7ff85f30ef7dc309` | The roadmap to 10/10. Now opens with P0a — recover the orphaned codebase — ahead of the provider research. Blockers, tasks in build order with dependencies and done-when criteria, integration principles, checkable criteria on five dimensions, definition of done. |
| `transcript.md` | 3,834,766 | `0f0f9c2a67e78ed7` | The entire session, every user and assistant turn in order. Tool calls as one-line summaries, results as sizes. System-reminder blocks and the owner relay email scrubbed; zero secret-shaped strings. |
| `value_multipliers_25.md` | 15,535 | `dd21ddb5fd1f9afb` | 25 utility multipliers: determinism, connection, objectivity, legal-accuracy wording (with a replace/with table), and reach. Each with the change, the reasoning, the files and how you would know it worked. |
| `code/README.md` | 5,028 | `449d7ea37fefe683` | What each module is and which test covers it. Explains that the template's two engine names are now real façade modules, written and tested this session, and names the convention the codebase should adopt next. |
| `code/aiMemoryBank.ts` | 22,124 | `e28ae1d1b20cb0a2` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/cycleEngine.ts` | 34,130 | `27b2ab01d826b799` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/cycleScenarios.ts` | 168,160 | `ce78897b91d1e596` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/erosion.ts` | 18,157 | `de02b376be89d462` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/facadeEngines.test.ts` | 6,902 | `b3d29bbee2d19507` | The 17 tests for both façades, including the one asserting that a probability is never reported with a zero sample. |
| `code/historicalMarketRegimeEngine.ts` | 8,348 | `3c9b31eb7b9cc216` | **The template's name, now a real module.** Façade over the four record engines: control and rates by year, conditional base rates that always carry their window count, and a power swing that returns null rather than a number when a bucket is thin. |
| `code/historicalShocks.ts` | 6,844 | `12a3b08c122fb58a` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/integrationAudit.ts` | 14,819 | `90bd6fc123e8713e` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/mechanismDossiers.ts` | 46,685 | `0f17018a9d24b209` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/pageRatings.ts` | 15,303 | `81758c679cda1eb4` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/powerHistory.ts` | 7,947 | `5d7fb42cb4450801` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/realEstateCapitalStackEngine.ts` | 9,753 | `6ad8c5254d744064` | **The template's name, now a real module.** Façade over the five capital-stack engines: one Situation in, open/blocked mechanisms with reasons, binding thresholds, legal-plan count, ranked plans and nearest archetype out. Written and tested this session. |
| `code/sequenceArchetypes.ts` | 20,953 | `52e41a9962fc2846` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/sequenceOrderings.ts` | 54,588 | `4b0d8231cfa24515` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/sequencePlanner.ts` | 40,293 | `ae1e7699a786ac9d` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/taxHistory.ts` | 7,019 | `0f10d2edf16364af` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `code/thresholds.ts` | 27,688 | `4d92704771abc05b` | Verbatim copy from russell-capital-systems/shared on master; see code/README.md. |
| `data/assumptions.json` | 28,111 | `8fde056ef4ecb312` | Every constant the engines run on — mechanism parameters, planner constants, thresholds, role fitness, ordering rules, archetype situations, scorecard summary, façade outputs — read from the modules at generation time, not typed by hand. |
| `data/master_build_inventory.csv` | 5,444 | `9b34c9e49cc54ead` | 24 rows: every orphaned or duplicated engine with its line count, tests, commit, my counterpart, the relationship, the action, the priority and the done-when. |
| `data/questions.csv` | 6,962 | `33141cbdec1cc607` | 22 open questions with priority, why each matters, and the exact file where the answer goes. |
| `data/sources.csv` | 17,780 | `337a8e5c0e512ced` | 92 rows: every threshold standard and variant URL with evidence score, every provider homepage, every live-data host, and the file that uses each. |
| `reports/architecture.pdf` | 10,827 | `a77063bad4c9bb29` | architecture.md as PDF. |
| `reports/correlation.pdf` | 18,498 | `8516857560500835` | master_build_correlation.md as PDF. |
| `reports/executive_summary.pdf` | 8,567 | `6c3c0d929163453b` | executive_summary.md as PDF. |
| `reports/experience_upgrades.pdf` | 11,721 | `a2b0c56c60b4d9da` | experience_upgrades_25.md as PDF. |
| `reports/provider_verification_brief.pdf` | 20,989 | `b26eebada39283fe` | provider_verification_brief.md as PDF. |
| `reports/roadmap.pdf` | 27,207 | `60585a4299aae67e` | recommendations.md as PDF. |
| `reports/scorecard.md` | 81,290 | `44aeddb7d09b5cf3` | The same scorecard as markdown. |
| `reports/scorecard.pdf` | 68,030 | `ba6dc79952a9bab5` | Integration scorecard, 31 pages: 115 pages scored on ten wiring dimensions read from the code; 52 rated for value and frequency. |
| `reports/value_multipliers.pdf` | 17,448 | `f65057b6ce5c824b` | value_multipliers_25.md as PDF. |

**39 files, 4,768,799 bytes.** Generated 2026-09-18. Repository state at generation: 193 test files, 3,439 tests passing, 321 routes, clean build.

## What is deliberately absent

- **No zip.** Every file is plain text, CSV, JSON or PDF, readable one at a time.
- No secrets, no owner email, no client illustrations naming real people, no patent application PDFs (attorney-client work product).
- No phone numbers, rates or terms for the 39 providers — by the site's own publishing rule those appear only once read from a primary source with a date. `provider_verification_brief.md` is the instruction set for obtaining them.
- No claim that anything is "patent pending". 57 claims are drafted, none is filed, and a test enforces the language on every surface.
- No renamed files. The template asked for two engine names that did not exist; rather than rename something to fit, they were written as real façade modules with 17 tests.
