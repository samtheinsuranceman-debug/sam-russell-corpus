# Doctor Buddy Emergent 2.1 — Simulation Report

Date: 2026-09-16. Root seed 20260916 (replay any run with `CHAOS_SEED=<seed> npm run test:chaos`). Harness: `test/chaos/`.

The owner asked for 10,000 simulations of the best, worst and terrible environments while the build is taken apart and 10,000 more while it is put together, and for the code to be changed until it survives as many of them as possible. This is what was run, what broke, and what changed.

## Apart: every layer alone

| Layer | Runs | Generators | Invariants | Result |
|---|---|---|---|---|
| C-SSRS text screen | 1,500 | 65 KB strings, unicode, control characters, injection strings, objects | never throws; level 0–5; deterministic; appending a stated plan never lowers the level and always reaches ≥ 4 | pass |
| DSM-5 intake scoring + risk features | 1,500 | random answer maps with prototype-pollution keys, garbage values, extra keys | never throws; no NaN; cssrsLevel 0–5; deterministic | pass |
| Risk scoring with conformal intervals | 1,000 | NaN/±Infinity/1e308 features, garbage calibration outcomes, impossible coverage | never throws; nothing non-finite; deterministic | pass after fix |
| Mental credit score | 1,000 | non-array observations, null rows, bad dates, out-of-range scores | never throws; score 0–1000; zone valid and consistent | pass after fix |
| Mental-health vital signs | 1,000 | missing/garbage streams, objects for numbers | never throws with ≥ 1 point; no NaN; valid interpretation; deterministic | pass after fix |
| Crisis fusion + forecast | 1,000 | garbage telemetry, non-string text | never throws with ≥ 1 day; escalation 0–4; a stated plan on the last day always clears the crisis threshold and escalation ≥ 3 | pass after fix |
| Adaptive assessment | 500 | random and invalid (NaN, 9, −1) responses | theta and sd always finite; differential finite | pass after fix |
| Psych-financial bridge + evidence seam | 1,500 | garbage snapshots, garbage context, junk check-ins, junk pauses | no NaN; capacity 0–100; tier consistent; safety only caps (≤ 15 with an active signal); pause never loosens; no clinical word in public text; deterministic | pass after fix |
| 56 financial calculators (guarded door) | 2,000 | strings for numbers, NaN, Infinity, negatives, missing fields, prototype keys | never throws; no NaN/Infinity/undefined in any output, chart or table; coerced values always in range | pass |
| **Engines total** | **10,000** | | | **10,000 / 10,000** |
| Production validator | 2,055 + 5 + 4 | 55 catalogued defects, 2,000 random mixes of 0–4 defects plus irrelevant noise, 5 bundle defects, 4 preview cases | a complete honest environment passes; every defect fails; noise never fails; a bundle built for another edition fails; preview lists blockers but refuses a placeholder, paid, or clinical | pass |
| tRPC routers, no database | 3,210 | 107 procedures × 2 editions × 3 roles × 5 inputs (undefined, empty, random, prototype-polluted, schema-shaped) | only TRPCError escapes; public edition FORBIDDEN on every clinical path; anonymous never past protected/admin; user never past admin; internal errors carry one generic message, never the input, never a stack | pass after fix |

## Assembled: the booted server

10,000 requests against `buildApp()` on an ephemeral port in production posture (HSTS, CSP, cross-origin checks), with no database, no model gateway and no OAuth portal, in bursts of 100 in flight, health-checked between bursts. Mix: pages and traversal attempts, tRPC GET with six kinds of session cookie (none, valid, expired, wrong secret, alg=none, garbage), tRPC POST with JSON/garbage/1.5 MB/array/batch/empty bodies from allowed and hostile origins, the Stripe webhook without a valid signature, OAuth start and callback with junk, billing routes, six HTTP methods, header fuzz up to 7 KB, then 220 requests from one address and one from its neighbour.

| Outcome | Count |
|---|---|
| Requests | 10,000 |
| Process crashes / unhandled rejections | 0 |
| Health check failures between bursts | 0 |
| Answers ≥ 500 other than a documented "not configured / disabled" 503 | 0 |
| Bodies with a stack frame, internal path, driver name or the input canary | 0 |
| Clinical procedure answered with data in the public edition | 0 |
| Session produced from a bad cookie | 0 |
| Cross-origin state change accepted | 0 |
| Unsigned webhook accepted | 0 |
| 1.5 MB JSON body accepted | 0 (413) |
| Rate limiter engaged for the abusive address | 40 of 220 (429, Retry-After 60) |
| Rate limit bled into the neighbouring address | no |
| Heap growth over the soak | ≈ 50 MB before GC, negative after |

## What the simulations changed

1. **Engines took input on trust.** Every engine assumed the shape its own TypeScript said. Fed NaN, an object where a number belongs, or a non-array, they threw or emitted NaN that propagated into risk bands and guardrails. Each now has one input seam: `sanitizeFeatures` (risk), `rows`/`num` (mental credit score), stream fallback to the population mean clipped to ±6 sd (vital signs), `cleanDay`/`cleanBaseline` (crisis), a clamped response value (adaptive), `dollars` and a finite-volatility check (bridge), `whenMs` for dates (evidence), and `runCalc` → `coerceValues` → `sanitizeResult` for all 56 calculators. An impossible conformal coverage now falls back to 90% instead of throwing on a clinical page.
2. **Dates were parsed with `new Date(anything)`**, which throws on an object that has its own `toString` field. Three call sites now parse only strings, numbers and Date instances.
3. **Plain `Error("Forbidden")` in three router handlers** left the server as a 500 with the word "Forbidden" in the body. They are typed `FORBIDDEN`/`NOT_FOUND` now, and a middleware rewrites any remaining internal error to one generic sentence and strips the stack in every environment.
4. **Every procedure now declares its gate in tRPC metadata** (`public` / `protected` / `admin`), so the harness and the audit read the truth from the router instead of the source text.
5. **The HTTP shell** answers unknown `/api` paths, non-GET/POST API methods, and non-GET page requests in JSON with the right status; malformed and oversized bodies get JSON 400/413 with no stack; a missing client build is a 503 rather than a crash.
6. **The image and the edition.** `npm ci` failed on the delivered lockfile (fixed with `.npmrc`); the Dockerfile now declares every `VITE_*` build argument, ships migrations, and runs as a non-root user; the build writes `dist/public/build-info.json` and the production validator refuses to serve a bundle built for another edition, posture, privacy contact or processor list.
7. **Preview posture.** `RELEASE_POSTURE=preview` lets the public wellness edition run for review before the operator's attestations are true: blockers are listed at `/healthz`, a banner sits on every page, paid and clinical stay off, and any placeholder disclosure or wrong edition still stops the boot.

## What the simulations could not reach

No MySQL is available in the build sandbox, so authenticated, database-backed flows were exercised "apart" through the router with the database absent (every procedure's guards, validation and error path) but not "assembled" with real rows. The Stripe webhook was exercised only for signature refusal. The model gateway was exercised only through its absence. These are the first things to run against the Railway service with a real database attached.
