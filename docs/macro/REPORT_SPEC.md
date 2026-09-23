# Report Generator — the 200-page brief with 75 references

What Thomas produces when asked for the long form. This is the specification;
the generator is `thomas.ask` at depth `integrated` driven section by section
by the outline below, with each section's figures pulled from the macro
engines through `MACRO_LOOKUP` and the tRPC endpoints, never from memory.

## Shape

- **Length:** 180–220 pages at ~350 words/page, i.e. 65–80k words. Generated as
  twelve chapters of 8–20 pages; each chapter is one model call at 16k output
  tokens, run through `secondOpinion` (a second brain reviews for fabricated
  numbers before the chapter is accepted).
- **Every figure** carries its source id inline `[us-tic-mfh, 2026-07-31]`.
- **References:** at least 75, listed at the end with the URL, entity, and the
  date accessed. Built from the `sourceIds` every engine result returns plus
  the retrieval tools' citations (Perplexity, Exa) for anything the engines
  do not carry. Fewer than 75 distinct references → the generator asks the
  retrieval arm for more before finishing, never pads.
- **Confidence grades** appear in every probability sentence.

## Chapters

1. Executive summary (2 pp) — the five daily numbers, one paragraph each.
2. Method (6 pp) — the confidence engine, the panels, the source tiers, what is estimated.
3. Treasury holdings: the measured record (12 pp) — TIC history, custody, the Belgium/Hong Kong problem, 2015–16 and 2022–23 episodes.
4. Japan (20 pp) — reserves, intervention, JGB pull, insurers and banks, FIMA, the political channel; daily confidence and 24-month forecast with the full driver table.
5. China (20 pp) — reserves, gold, CIPS, sanctions exposure, the follow-through ledger applied to the "nuclear option"; daily confidence and forecast.
6. Scenario engine (16 pp) — sell 10/25/50/100 % over 1/6/12/24 months for each holder, the yield paths, the transmission table, the Fed response, and the seller's own losses.
7. Oil outside the dollar (22 pp) — corridor ledger, currency breakdown, twenty-year history at each roll-up, ten-year forecast, the fifty ripple indicators.
8. Sovereign debt (24 pp) — the sixty-economy table, five-factor scores, the watch-list, contagion runs for the six most consequential trigger sets.
9. Taiwan (24 pp) — four scenarios, fifty indicators, published impact ranges by country, the below-awareness drivers, insurance and prediction-market tells.
10. Emergent patterns (14 pp) — every correlation, lead–lag and conditional triple above threshold, with the method and the caution that correlation is a hypothesis.
11. What this means for a household (16 pp) — the calculator toggles applied to a representative client: mortgage, IUL, sequence-of-returns, Roth timing.
12. Appendices (24 pp) — source registry with health, indicator definitions, statement ledger, glossary.

## Endpoint (to build next)

`macro.report.generate({ chapters?: number[], clientId?: number })` → streams
chapter markdown; stores the finished document in `report_exports` (existing
table) with the reference list; emails via Resend on request. Estimated cost
at frontier-model pricing: 12 chapters × ~20k tokens in/out ≈ $8–15 per report.
