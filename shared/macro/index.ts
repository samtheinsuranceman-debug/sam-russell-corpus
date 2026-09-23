/**
 * Global Macro Intelligence — public surface, and the port steps.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * One import for every consumer: the router, Thomas Goldman, the dashboard
 * and any calculator that mounts the scenario toggle. Pure modules only:
 * nothing in `shared/macro` fetches, reads a database or touches `process`.
 *
 * ─── STATE ON PRODUCTION (sam-russell-corpus/russell-capital-systems)
 *
 * The layer is already on production (22 modules, router `macro`, the
 * portal-wide `PredictiveContext` and the `PredictiveFooter`). Release
 * 2026.09.23 (agent A22's port of the archive's working tree onto
 * master `90254e7`) adds, without renaming or removing anything:
 *
 *  1. `treasuryPool.ts` (fifty Treasury-pool series, forty hypotheses,
 *     fifteen episodes, the dry-up indicator and its playbook, the
 *     prediction grid), `globalTreasuries.ts` (twenty-five countries and the
 *     flow calculus), `projection.ts` (the projection horizon: per-year
 *     confidence and fading scenario deltas) and `combinations.ts` (joint
 *     moves and combinations not yet seen). `emergentPatterns.ts` gains the
 *     archaeology scans (domino chains, turning points, loudest movers,
 *     regime split, latest z-scores). `assumptions.ts` gains the
 *     `dryup.*`, `flow.*`, `proj.*` and `combo.*` rows; production's
 *     verified rows (college, SCF, Census, `projection.horizon.*`) are kept.
 *  2. Server: `server/macroTreasury.ts` (new) and additions to
 *     `server/macroHistory.ts` (Fiscal Data debt and auctions, BIS policy
 *     rates, IMF IFS/WEO, World Bank by country) and `server/macroRouter.ts`
 *     (`treasuryPool`, `globalTreasuries`, `projection`,
 *     `projectionReport`). No new table: the pool and the countries are
 *     stored through the existing series tables of `macroHistory.ts`.
 *  3. Client: `useMacroScenario()` returns `averaged`, `horizon`,
 *     `forYear()` and `confidentYears` besides `adjustments`;
 *     `PredictiveContext` exposes the same through `usePredictive()` and
 *     `useCalculatorMacro({ years })` for pages.
 *  4. Relationship to the regime engines: `trunkBridge.ts` (production's
 *     version, real `MacroAssumptions` / `Regime` imports) remains the only
 *     link to `shared/macroEngine.ts` and `shared/marketRegimeClassifier.ts`;
 *     nothing here re-implements a market regime. `DryUpRegime` is a
 *     Treasury-liquidity state, not a market regime, and `regimeSplit()` is a
 *     statistical scan. `projectionConfidence.ts` (the footer's graded bands)
 *     and `projection.ts` (the scenario's per-year fade) coexist; see
 *     DECISIONS D-A22-3 in the port package.
 *
 * TypeScript target: production's tsconfig sets no `target`, so every
 * Map/Set iteration here uses `Array.from(...)`; keep it that way.
 *
 * Standing rules honoured: no China-linked AI and no Chinese government or
 * state source; no secret in `shared/`; every rate,
 * elasticity, prior and threshold in `assumptions.ts` with `{source, asOf}`;
 * 10,000 seeded paths; owner-only writes.
 */
export * from "./types";
export * from "./random";
export * from "./assumptions";
export * from "./confidence";
export * from "./sources";
export * from "./sourcesExpansion";
export * from "./indicators";
export * from "./indicatorsExpansion";
export * from "./snapshot";
export * from "./treasuryLiquidation";
export * from "./liquidationConfidence";
export * from "./petrodollar";
export * from "./globalDebt";
export * from "./taiwanRisk";
export * from "./statementFollowThrough";
export * from "./emergentPatterns";
export * from "./adjustments";
export * from "./trunkBridge";
export * from "./scoring";
export * from "./people";
export * from "./household";
export * from "./treasuryPool";
export * from "./globalTreasuries";
export * from "./projection";
export * from "./combinations";

export const MACRO_LAYER_VERSION = "2026.09.23b";
export * from "./cycles";
export * from "./validation";
export * from "./reverseWalk";
export * from "./sequences";
export * from "./clusters";
export * from "./states";
export * from "./keystone";
