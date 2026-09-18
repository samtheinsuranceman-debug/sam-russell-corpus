# Executive summary — Claude session 01, Russell Capital Systems

**Date:** 2026-09-18 · **Repo:** `samtheinsuranceman-debug/sam-russell-corpus`, folder `russell-capital-systems/`, branch `master` · **Owner:** Samuel A. Russell V

## What was asked

Turn the Wealth Genome from one insurability shape into two dozen strategies; add a spouse-pairing protocol with consent and per-asset veto weights; build the cycle engine behind "infinite banking" and say honestly whether any cycle is infinite; generate every useful combination and ordering of the five capital mechanisms with confidence and likelihood scores; research and encode the thresholds lenders and providers actually apply and every legitimate way they move; produce thousands of legal, situation-specific, stage-by-stage plans for portfolio owners; wire all of it into the twelve-channel AI brain and a memory bank that survives any prompt rewrite; rate every major page for value and frequency and measure how wired each is; and hand the unresolved work to Perplexity with a roadmap and criteria.

## What was built

| Layer | Result |
|---|---|
| Genome | 24 strategies with signals, gates and allocation; silence ≠ evidence (an unanswered factor lowers confidence, never raises a score). Household pairing: 21 factor combination rules, influence = title×0.5 + exposure×0.25 + dependence×0.25, veto pull = 2×min(w, 1−w). |
| Cycle engine | Five mechanisms with real constraints; twenty-year simulation whose headline is the break year. Proved the equity-share "infinite cycle" turns exactly once on one property. BRRRR break-even uplift ≈ 1.34. |
| Orderings | Position is a role (source/converter/sink). Two covenant rules prune 120 permutations to 40. 42 orderings with share, confidence, likelihood kept as three numbers. |
| Thresholds | 14 gates researched with source URLs: delayed financing = 0-month seasoning capped at cost; portfolio DSCR escapes the ten-property cap at 4–5 properties; no Garn-St Germain exemption covers a wrap. Fixed ones say why and cite the authority. |
| Planner | Covenants tracked per property. 13 moves. 9,387 legal plans at depth 4 for a thirty-house owner, 79,035 at depth 5 — counted by a test. Beam search to 24 stages in under half a second. On a payoff goal it says the true thing: sell eleven of thirty to clear 72% of debt in 3.8 years. |
| Archetypes | Twelve named shapes from the first-time household to the thirty-house operator, up to 22 stages, run through the planner at render time. |
| Dossiers | Per mechanism: mechanics with governing clause, 39 providers, conditions, interop, value and frequency rated separately (policy loan 7/2; velocity 5/6). |
| Brain + memory | 29 groups wired to the twelve channels; priority-1 never trimmed; file is the durable record. |
| Scorecard | Every page scored on ten wiring dimensions read from the code. **Mean 3.3/10; none at ten; 76 of 115 below five.** 52 pages rated for value and frequency with the connections to reach ten. |
| Pages | /portal/infinite-banking, /portal/mechanisms + 15 dossier views, /portal/sequence-planner, /portal/thresholds, /portal/integration-scorecard, /portal/genome-strategies, /portal/household-genome, /portal/alt-credit + detail. |
| Tests | 192 files, 3,422 tests green. 321 routes. |

## What stopped short, and why

- 39 provider names come from general knowledge; by the site's publishing rule they carry no rates, terms or contacts until read from primary sources. `provider_verification_brief.md` is the instruction set.
- Equity-share investment-property eligibility and subordinate-lien consent could not be verified at any provider — the fact that most changes the planner's legal space.
- Owner-only items: Railway variables, MCP authorisations (OpenRouter, Speko, Stripe), a provisional patent filing, production feed verification from outside.
- No account aggregation; every projection runs from typed inputs.

## The three numbers to remember

**3.3** — mean page wiring out of ten. The engines are strong; the connections are the work.
**9,387** — legal plans for a thirty-house owner at four stages, up from the 40 orderings a single-house model allowed.
**0 of 57** — patent claims filed. One provisional record makes every "patent pending" surface true.

## Where to start

`recommendations.md` §3 P0, then `provider_verification_brief.md`. `data/questions.csv` lists every open question with where its answer goes.
