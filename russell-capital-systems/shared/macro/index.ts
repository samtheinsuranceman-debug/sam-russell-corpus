/**
 * Global Macro Intelligence — public surface, and the port steps.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * One import for every consumer: the router, Thomas Goldman, the dashboard
 * and any calculator that mounts the scenario toggle. Pure modules only:
 * nothing in `shared/macro` fetches, reads a database or touches `process`.
 *
 * ─── PORT TO THE TRUNK (sam-russell-corpus/russell-capital-systems @ master)
 *
 * Written against the trunk's conventions (06_STANDING_ORDERS.md §3,
 * 08_MIGRATION_PLAN.md §4). Every step below was checked against the trunk
 * at `76ed5f2` on 22 Sep 2026.
 *
 *  1. Copy `shared/macro/` whole. No trunk file is overwritten. It depends only
 *     on `shared/macro/*` itself. TypeScript target: the trunk's tsconfig sets
 *     no `target`, so every Map/Set iteration here uses `Array.from(...)`;
 *     keep it that way.
 *  2. Replace the structural types at the top of `trunkBridge.ts` with the
 *     real imports (`./macroEngine`, `./marketRegimeClassifier`); the shapes
 *     match field for field. Then `macroPath()` and `regimeConditionedPaths()`
 *     take this layer's shocks through `overlayMacroEngine()` and
 *     `regimeForAdjustments()`.
 *  3. Copy `server/macroRouter.ts`, `server/macroContext.ts`,
 *     `server/macroConnectors.ts`, `server/macroConnectorsExpansion.ts` and
 *     the three test files (`server/macroIntelligence.test.ts`,
 *     `server/macroConnectors.test.ts`, `server/macroExpansion.test.ts`).
 *     Tests live in `server/` because the trunk's `vitest.config.ts` includes
 *     `server/**` only (decision D18 on the board asks whether to widen it).
 *  4. In `server/macroConnectors.ts`, wire `fredConnector` to the trunk's
 *     `server/_core/fred.ts` (`getBenchmark`) through `setBenchmarkProvider()`
 *     and delete the local CSV/JSON transports — the trunk already has both,
 *     with `market_data_points` persistence. The file header says exactly
 *     which lines go.
 *  5. Tables: append the four `macro_*` tables from `drizzle/schema.ts` (tail
 *     of this repo's file) to the trunk's `drizzle/schema.ts`, run
 *     `pnpm db:schema`, and check `databaseSchemaFile` + `persistence-schema`
 *     tests. **Do not copy `drizzle/0073_macro_intelligence.sql`** — the
 *     trunk has no migration chain; `database/rcs-schema.sql` is what Railway
 *     applies.
 *  6. `server/routers.ts`: `macro: macroRouter,` in the `router({ … })` map.
 *  7. `server/thomasGoldmanRouter.ts` (arrives with the Brain Hub port,
 *     `docs/synthesis/port/0001-brain-hub-on-trunk.patch`): apply the same
 *     three hunks this repo's file carries — import `macroContext`, add
 *     `macroBrief` to the system array, add the `MACRO_LOOKUP` round trip —
 *     or diff this repo's file against the patched one.
 *  8. `server/_core/index.ts`: the `/api/cron/macro-refresh` handler (one
 *     block, self-contained). Railway cron: daily, `?secret=$CRON_SECRET`.
 *  9. Client: `client/src/pages/portal/MacroIntelligence.tsx`,
 *     `client/src/components/MacroScenarioToggle.tsx`; two `<Route>` lines in
 *     `App.tsx`; **two rows in `shared/routeManifest.ts`**
 *     (`/portal/macro-intelligence`, `/portal/global-macro`) or the
 *     route-manifest test fails; one nav entry in `AppShell.tsx` under the AI
 *     group or `navReachability` fails.
 * 10. Calculators: `useMacroScenario()` + `applyMacro()` — four lines each;
 *     this repo's `SequenceOfReturnsRisk.tsx` and `MortgageKiller.tsx` are the
 *     pattern. On the trunk, `macroEngine.ts`'s toggles and these live side by
 *     side; `overlayMacroEngine()` is how one feeds the other.
 * 11. Railway variables: `FRED_API_KEY` (optional; keyless CSV otherwise),
 *     `EIA_API_KEY`, `COMTRADE_API_KEY`, `CRON_SECRET`.
 * 12. Proof of done: `pnpm check` 0; `pnpm test` adds 106 passing tests and no
 *     failures; `pnpm build` writes two more routes to `routes.json`; the
 *     route manifest equals the router; `/portal/macro-intelligence` renders
 *     the seed with "No live pull yet" until the first cron run.
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

export const MACRO_LAYER_VERSION = "2026.09.23a";
