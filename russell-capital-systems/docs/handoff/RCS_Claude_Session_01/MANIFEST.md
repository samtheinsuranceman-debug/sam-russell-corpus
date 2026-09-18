# MANIFEST — RCS_Claude_Session_01

Handoff folder for Perplexity. Plain files, no archive. Also on GitHub at `russell-capital-systems/docs/handoff/RCS_Claude_Session_01/` in `samtheinsuranceman-debug/sam-russell-corpus`, branch `master`.

**Read in this order:** `executive_summary.md` → `recommendations.md` → `provider_verification_brief.md` → `data/questions.csv` → `architecture.md` → `code/README.md`. `transcript.md` is the full record if a decision needs its context.

| File | Bytes | SHA-256 (first 16) | Purpose |
|---|---:|---|---|
| `architecture.md` | 5,829 | `29a9f6727c883034` | The stack, the one object (Situation), the data flow, every registry and the test that guards it, the twelve live-data routers, how the integration audit reads the code, the seven conventions. |
| `executive_summary.md` | 4,455 | `c6ae3a5b7622fc09` | The session in two pages: what was asked, what was built, what stopped short, the three numbers to remember, where to start. |
| `provider_verification_brief.md` | 19,150 | `c9bc3f380b7c79b9` | Perplexity's first job: research instructions for the 39 named providers — per-field source rules, mechanism-specific thresholds, integration map, known conflicts, JSON return schema keyed to the threshold registry. |
| `recommendations.md` | 19,197 | `9062a13fc25d6671` | The roadmap to 10/10: blockers, unresolved tasks in build order (P0–P3) with dependencies and done-when criteria, integration principles, checkable criteria on five dimensions, definition of done. |
| `transcript.md` | 3,814,751 | `21f8da5552de5c14` | Every user and assistant turn in order (3.8 MB). Tool calls as one-line summaries, results as sizes. System-reminder blocks and the owner relay email scrubbed; zero secret-shaped strings. |
| `code/README.md` | 4,441 | `392d5e1143f98a6b` | Maps the template's engine names to the real files; describes each module and the test that covers it; the conventions the code follows. |
| `code/aiMemoryBank.ts` | 22,124 | `e28ae1d1b20cb0a2` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/cycleEngine.ts` | 34,130 | `27b2ab01d826b799` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/cycleScenarios.ts` | 168,160 | `ce78897b91d1e596` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/erosion.ts` | 18,157 | `de02b376be89d462` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/historicalShocks.ts` | 6,844 | `12a3b08c122fb58a` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/integrationAudit.ts` | 14,819 | `90bd6fc123e8713e` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/mechanismDossiers.ts` | 46,685 | `0f17018a9d24b209` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/pageRatings.ts` | 15,303 | `81758c679cda1eb4` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/powerHistory.ts` | 7,947 | `5d7fb42cb4450801` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/sequenceArchetypes.ts` | 20,953 | `52e41a9962fc2846` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/sequenceOrderings.ts` | 54,588 | `4b0d8231cfa24515` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/sequencePlanner.ts` | 40,293 | `ae1e7699a786ac9d` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/taxHistory.ts` | 7,019 | `0f10d2edf16364af` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `code/thresholds.ts` | 27,688 | `4d92704771abc05b` | Verbatim copy from russell-capital-systems/ on master; see code/README.md. |
| `data/assumptions.json` | 26,508 | `f1c0f4d9b149465b` | Every constant the engines run on — mechanism parameters, planner constants, thresholds, role fitness, ordering rules, archetype situations, scorecard summary — read from the modules at generation time, not typed by hand. |
| `data/questions.csv` | 5,133 | `d07d9e7dbc0c65d1` | Sixteen open questions with priority, why each matters, and the exact file where the answer goes. |
| `data/sources.csv` | 17,780 | `337a8e5c0e512ced` | 92 source rows: every threshold standard and variant URL with evidence score, every provider homepage, every live-data host, and which file uses each. |
| `reports/provider_verification_brief.pdf` | 20,989 | `b26eebada39283fe` | provider_verification_brief.md rendered to PDF (6 pages). |
| `reports/roadmap.pdf` | 22,946 | `31d7480a83e2fa50` | recommendations.md rendered to PDF (7 pages). |
| `reports/scorecard.md` | 81,290 | `44aeddb7d09b5cf3` | Same scorecard as markdown. |
| `reports/scorecard.pdf` | 68,030 | `ba6dc79952a9bab5` | Integration scorecard, 31 pages: 115 pages scored on ten wiring dimensions read from the code; 52 rated for value and frequency with connections to reach ten. |

27 files, 4,595,209 bytes total. Generated 2026-09-18.

## What is deliberately absent

- No zip. Every file is plain text or PDF.
- No secrets, no owner email, no client illustrations naming real people, no patent application PDFs (attorney-client work product).
- No phone numbers, rates or terms for the 39 providers — by the site's publishing rule they appear only once read from primary sources; the brief is the instruction set for that.
- No claim that anything is "patent pending"; 57 claims are drafted and none is filed, and a test enforces the language.
