# code/ — the engines from this session, plus the two façades

Verbatim copies from `russell-capital-systems/` on master, placed here so they can be read without cloning. They import each other by relative path and by the `@shared/…` alias; to *run* them, use the repository.

## The template's two names are now real files

The handoff template asked for `realEstateCapitalStackEngine.ts` and `historicalMarketRegimeEngine.ts`. In the previous handoff those names did not exist and I declined to rename a file to match, because a file named to fit a template is a fabrication.

**They now exist as real modules** — written this session, committed to `shared/`, and covered by `facadeEngines.test.ts` (17 tests). They are façades: they compute almost nothing of their own and route to the module that owns each answer. Each adds a genuine single-call API that did not exist before.

### `realEstateCapitalStackEngine.ts`
`capitalStack(situation)` → one object holding: which mechanisms are open and which are blocked **with the reason for each**; which of the fourteen thresholds actually bind *this* household and the best documented variant for each; the count of legal plans at a fixed depth so households are comparable; the ranked plans; and the nearest named archetype with a closeness score. Plus `describeStack()` for an advisor brief or an AI channel.
Owners: `cycleEngine`, `thresholds`, `sequenceOrderings`, `sequencePlanner`, `sequenceArchetypes`.

### `historicalMarketRegimeEngine.ts`
`regimeAt(year)` → control, lever share, bucket and every tax series' value that year. `conditionalOdds(series, horizon, bucket)` → a conditional base rate **with the window count that produced it**. `powerSwing()` → the spread between left-held and right-held odds, or `null` when either bucket is thin. `coverage()` → what the record does and does not hold.
Owners: `powerHistory`, `taxHistory`, `historicalShocks`, `erosion`.

The guarantee this engine exists to enforce: **a base rate never renders without its sample size.** At a ten-year horizon the left bucket holds 14 windows and the right holds 5 — both under the threshold of 15 — so `powerSwing` returns `null` rather than a confident-looking number. A test asserts that refusal.

## Every file here

| File | Purpose | Tests |
|---|---|---|
| `realEstateCapitalStackEngine.ts` | Capital-stack façade (above) | `facadeEngines.test.ts` |
| `historicalMarketRegimeEngine.ts` | Regime façade (above) | `facadeEngines.test.ts` |
| `facadeEngines.test.ts` | The 17 tests for both façades | — |
| `cycleEngine.ts` | Five mechanisms as data; `simulateCycle()`; the "no cycle is infinite" disclosure | `cycleEngine.test.ts` (15) |
| `cycleScenarios.ts` | 80 sequenced scenarios, four tiers, influence scores 1–10 | `cycleScenarios.test.ts` (21) |
| `sequenceOrderings.ts` | Role fitness; two hard covenant rules pruning 120 permutations to 40; 42 annotated orderings | `sequenceOrderings.test.ts` (26) |
| `sequencePlanner.ts` | Per-asset legality, 13 moves, stage projections, `enumeratePlans`, `rankPlans` | `sequencePlanner.test.ts` (30) |
| `sequenceArchetypes.ts` | Twelve named household shapes | same |
| `thresholds.ts` | 14 gates: standard, variants with source URLs and evidence scores, and the fixed ones with their statute | same |
| `mechanismDossiers.ts` | Mechanics with governing clauses, 39 providers, value and frequency kept apart | `mechanismDossiers.test.ts` (19) |
| `aiMemoryBank.ts` | 29 knowledge groups wired to the twelve channels | `cycleScenarios.test.ts` |
| `pageRatings.ts` | 52 pages rated for value and frequency with conditions | `integrationAudit.test.ts` (17) |
| `integrationAudit.ts` | Reads the repository, scores every page on ten wiring dimensions | same |
| `powerHistory.ts`, `taxHistory.ts`, `erosion.ts`, `historicalShocks.ts` | The historical record layer | `power.test.ts`, `erosion.test.ts` |

## The conventions these files follow

1. **`Verified<T>`** — `{verified:true, value, source, asOf}` or `{verified:false, whyNot, checkAt}`. No third shape.
2. **Silence ≠ evidence** — an unanswered factor contributes to neither numerator nor denominator; it lowers confidence.
3. **Legality per asset** — covenants bind the property they sit on; every refusal names the clause.
4. **Two numbers, never one** — value/frequency, confidence/likelihood, share/likelihood. Tests assert they differ.
5. **Amortisation is the dividing line** — obligations that pay themselves down stack; those that do not are counted as balloons and penalised.
6. **No contact detail, rate or term** unless read from the company's own material with a source and date.
7. **Nothing claims "patent pending"** until an application record exists; a test scans every surface.

## The convention these files should adopt next

`UnsourcedFindingError`, from `russell-capital/shared/council/aiCouncil.ts`. It makes an unsourced figure a runtime error rather than a documented rule. See `master_build_correlation.md` §4.
