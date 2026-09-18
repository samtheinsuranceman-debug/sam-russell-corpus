# code/
## The two engines in this package

Both are **pure functions**: no I/O, no `Date.now()`, no fetching. Given the same inputs they return the same outputs forever, which is what makes the platform's 4,095 tests fast and meaningful. Historical series arrive as arguments, supplied by the adapters in `server/zipData.ts`, `server/rentalData.ts` and `server/_core/fred.ts`.

Both live in `shared/` in the BASE build, branch `claude/base-consolidation`.

---

## 1. `realEstateCapitalStackEngine.ts`
**533 lines · already in the build · test: `server/realEstateCapitalStack.test.ts` (308 lines)**

Models a levered real-estate investment end to end: sources and uses, monthly-accurate debt amortization aggregated to annual reporting periods, coverage and leverage metrics per year, disposition, and an IRR-lookback promote waterfall.

### The modelling decisions that change the numbers

| Decision | Why |
|---|---|
| Debt amortizes **monthly**, rolled up to annual rows | Annual-only amortization materially understates interest and overstates DSCR |
| DSCR computed on NOI **net of the capital reserve** | That is the conservative lender definition. Underwriting on gross NOI flatters coverage by exactly the reserve |
| Exit value capitalizes **forward** NOI (the year after disposition) at the exit cap rate | The convention a buyer actually underwrites to |
| A tranche maturing before disposition **keeps being serviced on existing terms** | This implicitly assumes a refinance at the same rate, which is optimistic — so `refinanceRequired` is set and the findings engine raises it. The alternative, letting the debt vanish at maturity, would silently hand the deal free money |
| The waterfall runs on the **combined common equity pool** (LP + GP co-invest), hurdles split pro-rata by contribution, promote paid to the GP on top | How a real LP/GP deal settles |

### Exported helpers worth knowing

- `pmt(ratePerPeriod, periods, principal)` — level payment for a fully amortizing loan.
- `npv(rate, cashFlows)` — index 0 is today.
- IRR by **bracketed bisection**, not Newton. Newton diverges on the sign-flipping flows a levered deal produces, and silently returning a wrong IRR is worse than returning `NaN`.

Types live in `shared/realEstateCapitalTypes.ts` (839 lines).

---

## 2. `historicalMarketRegimeEngine.ts`
**Written for this package · test: `server/historicalMarketRegime.test.ts` — 19 tests, all passing**

This engine did not exist in any repository. Perplexity's requested structure named it, and it turned out to answer a real gap already flagged in the roadmap: *"regime awareness — say which historical periods the resampled blocks came from."*

### Why it exists

A plain block bootstrap treats 1979 and 2013 as equally likely neighbours for the year ahead. They are not. Inflation, policy rates and asset prices move in **persistent states**, and a household sitting in a rate-shock year faces a different distribution from one sitting in an expansion. Sampling without that conditioning produces a fan that is too narrow in the tails and too wide in the middle — it understates the run of bad years that actually ruins a plan.

### The eight regimes

`deflation` · `stagflation` · `inflation-shock` · `rate-shock` · `contraction` · `recovery` · `bubble` · `expansion`
plus `unclassified` for years the record cannot label.

### Design decisions that matter

**Classification is rule-based and every threshold is named.** No fitted model, no hidden state. A label can be checked against the year it describes by anyone holding the same series. Every threshold used is reported verbatim in the evidence string, so a reader disagrees with a specific number rather than with "the model" — and all of them are caller-overridable.

**Precedence is fixed and documented.** A year can satisfy several rules. `deflation` and `stagflation` outrank the single-factor labels because they are the states that break the ordinary relationships between debt, prices and assets.

**An unclassifiable year is excluded, not defaulted.** Where any input series is blank, the year is labelled `unclassified` and dropped from sampling. Defaulting to the benign state is how a model quietly becomes optimistic.

**Sparse transition rows are flagged.** A matrix row built on three observations is a description of three years, not a probability. Rows below `MIN_OBSERVATIONS` (5) carry `sparse: true`.

**A gap never bridges a transition.** If 2001 is unclassified, no transition is recorded from 2000 to 2002. A transition across a hole in the record is not an observation; it is a guess.

**Blocks stay contiguous.** Conditioned draws take whole runs of consecutive years whose *first* year carries the drawn regime. Shuffling years inside a regime would destroy the autocorrelation the regime exists to capture.

**Fallbacks are counted and reported.** When a drawn regime has no block that can start in it, the draw falls back to the unconditioned record — and the share of draws that did so appears in the evidence string, with a warning above 25%. A silent fallback would make a conditioned fan indistinguishable from an unconditioned one.

### Usage

```ts
import {
  classifyRegimes, regimeConditionedPaths, percentilePath, compound,
} from "@shared/historicalMarketRegimeEngine";

const classification = classifyRegimes({
  cpi:        cpiSeries,        // AnnualSeries, index levels
  assetIndex: zipHomePriceIndex,
  policyRate: primeRateSeries,  // optional — without it, rate-shock is never labelled
});

// What state does the record actually end in?
classification.stats;        // per regime: years, mean growth, worst year, sparse flag
classification.transitions;  // observed year-to-year move rates
classification.evidence;     // source, as-of, window, and every threshold used

const fan = regimeConditionedPaths(classification, {
  horizon: 30,
  paths: 10000,
  blockYears: 5,
  seed: 42,
  // startRegime defaults to the regime the record ends in
});

const p10 = percentilePath(fan.paths, 0.1);
const p50 = percentilePath(fan.paths, 0.5);
const p90 = percentilePath(fan.paths, 0.9);
const medianLevels = compound(p50);

fan.regimeTrace[0];   // which regimes path 0 actually walked — chartable
fan.evidence.method;  // includes the fallback share
fan.reason;           // set when conditioning is weak
```

### How it plugs into the platform

It satisfies **Rule 6 (SIMULATED)** of the page contract with conditioning the plain bootstrap lacks. Any simulator running five years or more can swap `blockBootstrapPaths` for `regimeConditionedPaths` and gain, at no cost to determinism:

1. A fan whose tails reflect the persistence of bad states.
2. A `regimeTrace` that lets a chart say *which history this path walked* — which is exactly the provenance the evidence ledger exists to provide, extended to the simulation itself.

### Honest limits

- The transition matrix is **observed, not forecast**. It says how the record moved, not how the future will.
- Regimes are defined on CPI, an asset index and optionally a policy rate. Unemployment, credit spreads and yield-curve shape are not inputs — a richer classifier would use them.
- Thresholds are conventions. Reasonable people would set `highCpi` at 4% or 6%. That is why every threshold is reported and overridable rather than buried.
- With no policy-rate series supplied, `rate-shock` is never labelled — and the evidence string says so explicitly rather than leaving the absence silent.

---

## Compiler constraints (both files)

`tsconfig.json` sets no `target` and no `downlevelIteration`, so the build emits **ES5**. Spreading a `Set`, iterating a `Map` with `for…of`, or calling `.matchAll()` will not compile. Use `Array.from()`. Both engines in this folder are written accordingly.
