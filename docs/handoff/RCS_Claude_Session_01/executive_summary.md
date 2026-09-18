# Executive summary — Claude session 01, Russell Capital Systems

**Date:** 2026-09-18 · **Repo:** `samtheinsuranceman-debug/sam-russell-corpus`, folder `russell-capital-systems/`, branch `master` · **Owner:** Samuel A. Russell V

---

## The finding that should be read first

**There are two codebases, and one of them runs nowhere.**

`russell-capital-systems/` is the deployed app: 502 TypeScript files, 125 shared engines, 201 test files, a `package.json`, a router, and Railway deploying from it.

`russell-capital/` holds 80 TypeScript files and 20 shared engines with 11 test files — and has **no `package.json`, no `server/routers.ts`, and nothing in the deployed app imports it.** Roughly **5,900 lines of finished, tested engine code executes nowhere.** Inside the deployed folder there is a smaller instance of the same problem: `timeMachine30.ts` (666 lines, 287-line test) appears in no route, no catalogue entry and no memory group.

This is not dead code. It is good code in the wrong folder — an adverse-scenario stress tester, a full property-and-loan amortisation engine, an illustration-compliance layer, a small-business lending vertical, a lender-ranking module. Recovering it is the highest-value task on the board, ahead of anything in the previous roadmap, because the work is already paid for. `master_build_correlation.md` has the file-by-file table; `data/master_build_inventory.csv` has it machine-readable with priorities.

**And the best idea in the repository is not mine.** The other session's `UnsourcedFindingError` and `UnsourcedQuoteError` make "no figure without a source" a runtime error that *throws*. My approach — `Verified<T>` plus guard tests that scan source text — catches a class of error at build time but cannot catch a value born at runtime. Theirs is strictly stronger and should become the house standard.

---

## What was asked, across the session

Turn the Wealth Genome from one insurability shape into two dozen strategies; add a spouse-pairing protocol with consent and per-asset veto weights; build the cycle engine behind "infinite banking" and say honestly whether any cycle is infinite; generate every useful combination and ordering of the five capital mechanisms with confidence and likelihood scores; research and encode the thresholds lenders actually apply and every legitimate way they move; produce thousands of legal, situation-specific, stage-by-stage plans for portfolio owners; wire all of it into the twelve-channel AI brain and a memory bank; rate every major page for value and frequency and measure how wired each one is; hand the unresolved work to Perplexity with a roadmap and criteria; and correlate everything against the most recent master saves.

## What was built

| Layer | Result |
|---|---|
| Genome | 24 strategies with signals, gates and allocation; **silence ≠ evidence** — an unanswered factor lowers confidence rather than raising a score. Household pairing: 21 factor rules, influence = title×0.5 + exposure×0.25 + dependence×0.25, veto pull = 2×min(w, 1−w). |
| Cycle engine | Five mechanisms with real constraints; twenty-year simulation whose headline is the **break year**. Proved the equity-share "infinite cycle" turns exactly once on one property. BRRRR break-even uplift ≈ 1.34. |
| Orderings | Position is a role (source / converter / sink). Two covenant rules prune 120 permutations to 40. 42 orderings carrying share, confidence and likelihood as three separate numbers. |
| Thresholds | 14 gates with source URLs: delayed financing = 0-month seasoning capped at documented cost; portfolio DSCR escapes the ten-property cap at 4–5 properties; **no Garn-St Germain exemption covers a wrap**. Fixed gates name the statute. |
| Planner | Covenants tracked **per property**. 13 moves. 9,423 legal plans at depth 4 for a thirty-house owner, 79,035 at depth 5 — counted by a test. Beam search to 24 stages in well under a second. On a payoff goal it says the unwelcome true thing: sell eleven of thirty to clear 72% of debt in 3.8 years. |
| Archetypes | Twelve named shapes, up to 22 stages, run through the planner at render time so prose cannot drift from arithmetic. |
| Dossiers | Per mechanism: mechanics with the governing clause, 39 providers, conditions, interop, and value and frequency rated **separately** (policy loan 7/2; velocity 5/6). |
| Façades (this turn) | `realEstateCapitalStackEngine.ts` and `historicalMarketRegimeEngine.ts` — one `Situation` in, the whole stack out; one year in, the regime and its conditional base rates out. 17 tests. |
| Brain + memory | 29 groups wired to the twelve channels; priority-1 never trimmed. |
| Scorecard | Every page scored on ten wiring dimensions **read from the code**. Mean **3.3 / 10**; none at ten; 76 of 115 below five. 52 pages rated for value and frequency with the connections to reach ten. |
| Tests | 193 files, 3,439 tests green. 321 routes. |

## What stopped short, and why

- 39 provider names come from general knowledge; by the site's own publishing rule they carry no rates, terms or contacts until read from primary sources. `provider_verification_brief.md` is the instruction set.
- Equity-share investment-property eligibility and subordinate-lien consent could not be verified at **any** of the five providers — the fact that most changes the planner's legal space.
- Owner-only: Railway variables, MCP authorisations (OpenRouter, Speko, Stripe), a provisional patent filing, production feed verification from outside.
- No account aggregation; every projection runs from typed inputs.

## The numbers worth remembering

**3.3 / 10** — mean page wiring. The engines are strong; the connections are the work.
**~5,900** — lines of finished engine code currently executing nowhere.
**9,423** — legal plans for a thirty-house owner at four stages, up from the 40 orderings a single-property model allowed.
**14 and 5** — historical windows behind the "left" and "right" ten-year tax buckets. Both thin, so the engine returns `null` for the power swing rather than a number. That refusal is the house style.
**0 of 57** — patent claims filed. One provisional record makes every "patent pending" surface true.

## Where to start

1. `master_build_correlation.md` — the two-codebase finding and the integration order.
2. `recommendations.md` §3 **P0a** (recover the orphaned code), then **P0b** (the provider research).
3. `provider_verification_brief.md` — Perplexity's first research job.
4. `value_multipliers_25.md` and `experience_upgrades_25.md` — what to build once the foundation is sound.
5. `data/questions.csv` — every open question with the exact file its answer belongs in.
