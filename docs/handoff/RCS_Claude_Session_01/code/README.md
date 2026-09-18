# code/ — the engines built or extended in this session

These are verbatim copies of the TypeScript modules from `russell-capital-systems/` on master, placed here so they can be read without cloning. They import each other by relative path and `@shared/...` alias; to run them, use the repository, not this folder.

## The template's names, and the real files behind them

The handoff template asked for `realEstateCapitalStackEngine.ts` and `historicalMarketRegimeEngine.ts`. Those are not names in this codebase and no file was renamed to fit the template — a file named to match would have been a fabrication. The functions those names describe live here:

| Template name | Real files | What they do |
|---|---|---|
| realEstateCapitalStackEngine | `cycleEngine.ts`, `sequencePlanner.ts`, `sequenceOrderings.ts`, `thresholds.ts` | Five capital mechanisms (policy loan, velocity/HELOC, BRRRR+DSCR, equity share, seller wrap) with release rates, turn lengths, amortisation and settlement; a twenty-year simulation whose headline is the break year; per-property covenant legality; a beam-search planner that generates stage-by-stage plans with capital in/out, obligation, months and cost band; the threshold registry every stage reads. |
| historicalMarketRegimeEngine | `powerHistory.ts`, `taxHistory.ts`, `erosion.ts`, `historicalShocks.ts` | Who held the presidency, Senate and House each year since 1946; top marginal rate by year; conditional window statistics — P(rate higher after N years \| who held power) with sample sizes; the erosion trajectory ladder at 5–40 years; the recorded shocks (2000–02, 2007–09, 2018 Q4, 2022) for adverse replay. |

## Every file

| File | Purpose | Tests |
|---|---|---|
| `cycleEngine.ts` | The five mechanisms as data; `simulateCycle()`; the honest "no cycle is infinite" disclosure; the five infinite-banking questions. | `server/cycleEngine.test.ts` (15) |
| `cycleScenarios.ts` | 80 sequenced scenarios in four tiers with influence scores 1–10. | `server/cycleScenarios.test.ts` (21) |
| `sequenceOrderings.ts` | Position as a role (source/converter/sink); two hard covenant rules that prune 120 permutations to 40; 42 annotated orderings with share, confidence and likelihood kept as three numbers. | `server/sequenceOrderings.test.ts` (26) |
| `sequencePlanner.ts` | Assets, not just mechanisms. Thirteen moves, per-asset legality with reasons, stage projections, `enumeratePlans()` (9,387 legal at depth 4 on thirty houses), `rankPlans()` beam search to 24 stages. | `server/sequencePlanner.test.ts` (30) |
| `sequenceArchetypes.ts` | Twelve named household shapes, each a situation preset and a sequence up to 22 stages; run through the planner at render time. | same |
| `thresholds.ts` | Fourteen gates: standard figure, documented variants with source URL and evidence score, and the fixed ones with the statute or contract that fixes them. | same |
| `mechanismDossiers.ts` | Per mechanism: mechanics step by step with the governing clause, 39 providers (name + homepage only, by rule), best/worst conditions, interop with the other four, value and frequency ratings kept apart. | `server/mechanismDossiers.test.ts` (19) |
| `aiMemoryBank.ts` | 29 knowledge groups wired into the twelve channels' working memory; priority trimming; `unwiredGroups()`. | `server/cycleScenarios.test.ts` |
| `pageRatings.ts` | 52 pages rated for value and frequency with conditions and the connections that would take each to ten. | `server/integrationAudit.test.ts` (17) |
| `integrationAudit.ts` | Reads the repository and scores every catalogue page on ten wiring dimensions; every missing point is a to-do naming a file. Server-side. | same |
| `powerHistory.ts`, `taxHistory.ts`, `erosion.ts`, `historicalShocks.ts` | The regime layer described above. | `server/power.test.ts`, `server/erosion.test.ts` |

## Conventions these files follow

- `Verified<T>`: a fact is `{verified:true, value, source, asOf}` or `{verified:false, whyNot, checkAt}` — there is no third shape.
- Registries checked by tests: paths against the router, modules against disk, archetypes against the planner's legality.
- Two numbers, never one: value/frequency, confidence/likelihood, share/likelihood.
- No phone number, rate or term appears unless read from the company's own material with a source and date.
- Nothing says "patent pending" until an application record exists; a test scans every surface.
