# Architecture — how the pieces connect

## Two codebases — read this before anything else

| | `russell-capital-systems/` | `russell-capital/` |
|---|---|---|
| TypeScript files | 502 | 80 |
| Shared engines | 125 | 20 |
| Test files | 201 | 11 |
| `package.json` / router | yes / yes | **no / no** |
| Imported by the deployed app | — | **nothing imports it** |

`russell-capital-systems/` is the deployed app. `russell-capital/` is a staging folder that
looks like an app and is not one: ~5,900 lines of finished, tested engine code that executes
nowhere, including an adverse-scenario stress tester, a full property-and-loan amortisation
engine, an illustration-compliance layer and a small-business lending vertical. Four module
names exist in **both** folders and have diverged.

**Before writing any new engine, search both folders for its name.** The file-by-file
correlation and the integration order are in `master_build_correlation.md`; the machine-readable
version is `data/master_build_inventory.csv`.

## The stack

Express + tRPC 11 server · Vite/React 19 client with wouter · Drizzle ORM on MySQL · Vitest · Tailwind 4. Railway deploys from `master`. Shared TypeScript modules under `shared/` hold every engine so the server, the client and the tests run the same arithmetic.

## The façade layer (added this session)

Six domains, each reachable in one call. Two exist:

- `realEstateCapitalStackEngine.ts` — `capitalStack(situation)` returns open and blocked
  mechanisms with reasons, the thresholds that actually bind, the legal-plan count at a fixed
  depth, ranked plans, and the nearest archetype with a closeness score.
- `historicalMarketRegimeEngine.ts` — `regimeAt(year)`, `conditionalOdds(series, horizon, bucket)`
  carrying the window count, `powerSwing()` returning `null` rather than a number when a bucket
  is thin, and `coverage()`.

Four are still owed: `taxEngine`, `insuranceEngine`, `householdEngine`, `careerEngine`. The
façade pattern is what makes the system addressable by an AI channel, a partner API or a mobile
client without knowing five module names and their call order.

## The one object

`Situation` (`shared/sequencePlanner.ts`) is the household: rentals, values, LTVs, rent, primary residence, surplus, reserve, documentation, goal, horizon, insurability, off-market access, uplift, appreciation, rate. Every engine should take it or a projection of it. Today the fact finder, the genome and the planner each hold their own shape; making them one is P1 task 1.9 in `recommendations.md`.

## Data flow

```
Fact finder (shared/clientFactFinder.ts)
  └─ Situation
       ├─ Wealth Genome  (wealthGenomeFactors, wealthGenomeDurability)
       │     └─ Household Genome (householdGenome: combination rules, influence, veto, consent)
       ├─ Strategy Fit   (genomeStrategyFit over genomeStrategies: signals, gates, silence ≠ evidence)
       ├─ Sequence Planner (sequencePlanner: moves, per-asset legality, thresholds → stages)
       │     ├─ cycleEngine (mechanism parameters, simulateCycle)
       │     ├─ sequenceOrderings (roles, hard rules, plausibility)
       │     ├─ thresholds (standards, variants, fixed)
       │     └─ sequenceArchetypes (named presets)
       ├─ Provenance     (provenance: FigureTrace per headline figure — 3 exist, 31 featured pages need one)
       └─ Memory bank    (aiMemoryBank: 29 groups → compositeMind → twelve channels)
                             └─ channels answer only with a source and name pages by real path
```

## Registries and the tests that guard them

| Registry | Guarded by | Fails when |
|---|---|---|
| `calculatorCatalog.ts` (115 pages) | `server/calculatorCatalog.test.ts` | a path has no route (literal or :param), a page file is missing, an engine is named that is not on disk, a route is declared twice |
| `aiMemoryBank.ts` (29 groups) | `server/cycleScenarios.test.ts` | a module named in a group is not on disk; a group is unwired |
| `altCredit/lenders.ts` (15 records) | `server/altCredit.test.ts` | any phone-shaped string outside a verified phone field; a `Verified` value without source and date |
| `mechanismDossiers.ts` (39 providers) | `server/mechanismDossiers.test.ts` | a registryId with no record; a phone, email, percentage or dollar figure attached to a named company; value and frequency collapse |
| `sequenceOrderings.ts` (42 orderings) | `server/sequenceOrderings.test.ts` | an annotated ordering is illegal; shares + residual ≠ 100; the hand-picked top ordering lands in the bottom half by the independent plausibility score |
| `sequenceArchetypes.ts` (12) | `server/sequencePlanner.test.ts` | any archetype's sequence is refused by the planner against its own situation |
| `thresholds.ts` (14) | same | a figure without a source URL; a threshold neither fixed nor movable |
| `pageRatings.ts` (52) | `server/integrationAudit.test.ts` | a rated path not in the catalogue; a featured page unrated |
| `patentStatus.ts` | `server/patentClaimGuard.test.ts` | any surface says "patent pending" while `APPLICATIONS` is empty |
| Façades (2) | `server/facadeEngines.test.ts` | a capital-stack refusal lacks a reason; a regime figure lacks its sample size; `powerSwing` states a number from a thin bucket |
| App routes (321) | `grok-merge.smoke.test.ts`, `managed-port.smoke.test.ts` | the route count changes without the test being updated |

## Live data

Twelve tRPC routers fetch external sources on sweeps and store with as-of dates: `zip` (FHFA, Zillow, PMMS), `erosion` (FRED CPI, tax history, power feeds), `outsideForces` (40+ series), `career` (BLS OEWS, NCES), `rental` (FRED, FEMA NRI, Fannie), `ltc`, `incomeLife` (SSA), `inheritance`, `forgiveness`, `taxSchedule`, `unasked`, `integration` (reads the repo). Pages that show a rate, limit or price and do not call one of these are flagged `liveData: false` on the scorecard — 104 of them today.

## The integration audit

`server/integrationAudit.ts` reads the router, the catalogue, each page component's `@shared/` imports, the memory-bank module lists, the test files' imports, the genome's `relatedPaths`, `sphere.ts`, `provenance.ts`, and which routers' files (plus their local imports) reference an external data host. Ten dimensions, weights visible (brain 1.5, sphere 0.5), summing to ten. `taxBracketEngine` imported as a formatter on ~60 pages is deliberately not counted as an engine wire. Served live by `integration.scorecard`; generated to `reports/scorecard.md` by `server/integrationScorecard.script.ts`.

## Conventions that hold everything together

1. **Verified<T>** — `{verified:true,value,source,asOf} | {verified:false,whyNot,checkAt}`. No third shape.
2. **Silence ≠ evidence** — an unanswered genome factor contributes to neither numerator nor denominator; it lowers confidence.
3. **Gates vs signals** — gates can BLOCK at any fit; `external: true` gates cannot be settled by any genome reading.
4. **Legality per asset** — covenants bind the property they are on; refusals name the clause.
5. **Two numbers, never one** — value/frequency, confidence/likelihood, share/likelihood, wiring/worth. Tests assert they differ.
6. **Amortisation is the dividing line** — obligations that pay themselves down stack; those that don't are counted as balloons and penalised.
7. **Priority trimming is a decision** — memory groups at priority 1 are never trimmed; 3 drops first.

## The convention this codebase should adopt

`UnsourcedFindingError` (in `russell-capital/shared/council/aiCouncil.ts`) and
`UnsourcedQuoteError` (in `helocLenders.ts`) make an unsourced figure a runtime error that
throws. `Verified<T>` plus guard tests make the *shape* hard to get wrong and catch source-text
violations at build time — but no test can scan a value that did not exist when the test ran.
The two together are belt and braces: the type makes it hard, the test makes it visible, the
error makes it impossible. Promote both classes into `shared/sourcing.ts` and route every
client-visible number through `assertSourced`.

## What to build next, structurally

The universal `Situation` (P1 1.9), then provenance on every featured page (1.2), then genome routing to every rated page (1.1). Those three raise the scorecard mean more than anything else because they are the dimensions with the largest gaps and the ones the other criteria depend on.
