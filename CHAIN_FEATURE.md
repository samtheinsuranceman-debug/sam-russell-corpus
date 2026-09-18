# The Calculator Chain (shipped 16 Sep 2026)

**Where:** `/portal/chain` (signed in). Every portal calculator page also carries the
chain dock (bottom-right): add that calculator to the row with its hand-off, or auto-fill
its inputs from the shared client profile.

## What the client can do
1. **Enter the picture once.** The builder reads the shared fact finder (`useClientData`,
   the same ~50-field profile 86 portal pages already read) or lets the client edit the
   twelve numbers that drive the engines.
2. **List calculators in a row.** Nine chain calculators (Investment Growth, Mortgage
   Killer, House Recycling, Real Estate & Rentals, Home Equity Deployment, Trust-Owned IUL,
   Income Annuity, Crypto Allocation, Retirement Income). Each runs for chosen years with
   its own assumptions.
3. **Save the final outcome and hand it off.** Per calculator: toggle, *in which year*,
   *what % of its cash value*, and *into what* (next calculator's default, or IUL premium,
   annuity premium, taxable, cash, a paid-off property, crypto, mortgage paydown). Everything
   not handed off keeps compounding.
4. **Use the ZIP's own record.** For any real-estate step: ZIP + window (from year, to year)
   → year-by-year home-value appreciation (FHFA index back-cast behind Zillow, from the
   1970s–1990s depending on ZIP) and rent growth (Zillow ZORI, 2015 onward; the record
   states its own coverage instead of estimating). "Use this window's rates" feeds the step.
5. **Switch the world on.** Federal Reserve money printing (M2 presets with sources) →
   consumer inflation with lag and pass-through; hard-asset inflation for real estate,
   equities and crypto; loan availability and mortgage rates; future taxation drift.
6. **Run the row** (deterministic) and **run 10,000 simulations** (seeded, reproducible;
   ~0.4 s server-side). Report: aggregate cards, per-calculator table (start/end net worth,
   contribution, cash value, hand-off, passive income, taxes), hand-off ledger, engine notes,
   year-by-year for every calculator, percentile bands (5–95) with charts, probabilities
   (ends above today, doubles, passive income covers expenses). JSON / CSV / print.

## Code
| Layer | File |
|---|---|
| Macro | `shared/macroEngine.ts` (+ `server/macroEngine.test.ts`) |
| Engine | `shared/ultraEngine.ts` (per-window modules, transfers, yearly overrides, crypto) |
| Chain | `shared/chainEngine.ts` (+ `server/chainEngine.test.ts`) |
| API | `server/chainRouter.ts` (`chain.catalog`, `chain.run`, `chain.monteCarlo`), `server/zipRouter.ts` (`zip.history`) |
| UI | `client/src/pages/portal/ChainBuilder.tsx`, `client/src/components/ChainDock.tsx`, `client/src/lib/chainStore.ts`, `client/src/lib/autofill.ts` |

## Honesty rules carried through
Every number is a projection under assumptions shown on screen; presets name the period
and the FRED series to verify; ZIP rents before 2015 are blank, not invented; the
disclosure travels with every result.

## Known limits
- The 36-year rent history by ZIP is not publicly available at ZIP level; the engine accepts
  any-length series, and HUD county Fair Market Rents (1983+) are the candidate source to add.
- Auto-fill on pages that keep local inputs is label-matching; pages that read the shared
  profile are already filled.
