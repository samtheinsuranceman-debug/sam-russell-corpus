# Doctor Buddy Emergent 2.1 — Disassembly and Reassembly Notes

Five cycles, as the owner asked: take the merged build apart, verify each layer alone, put it back together, verify the whole, and write down what was learned. The layers are the same every cycle: pure engines (`shared/engines`, `shared/intake`, `shared/finance`), the tRPC routers with a mocked context, the browser gates and release policy, the production validator, and the express shell. "Verified" means `npm run check`, `npm test`, `npm run audit:emergent`, `npm run build`, and a booted `dist/index.js` answering `/healthz` and the finance routes.

## Cycle 1 — inventory and baseline

Taken apart: the delivered Emergent tree against the shared ancestor `ce4d05b` and against Claude's build (`diff -rq`, `git diff --stat`).

What broke when each piece was tested alone:

1. **The dependency install fails.** `npm ci` on the delivered lockfile stops on a peer conflict (`@builder.io/vite-plugin-jsx-loc` against vite 7.3.6). The Dockerfile runs the same `npm ci` twice, so the Railway build would have failed before the first byte was served. The build report admitted "a fresh npm ci ... timed out" and that no dependency-aware typecheck, test or bundle had ever run. Lesson: a build report that says "0 syntax diagnostics" from a parser is not a build.
2. **Two TypeScript errors** the parser-only check could not see: an implicit `any` in the health-data privacy page, and a `Map` iteration that needs an ES2015+ target (the tsconfig had no `target`, so `tsc` defaulted to ES5 semantics for iteration). Fixed with `target: ES2022` and `Array.from`.
3. **Nine stale tests in four files** described the ancestor's contracts, not Emergent's: sign-in now starts on the server (`/api/oauth/start`), the session cookie is `SameSite=Lax` not `None` (the better choice), state rights are deterministic (no model at runtime, also the better choice), and the crisis screen had changed. Tests were rewritten to pin the new contracts, including a new test that the OAuth return path refuses protocol-relative and external URLs.
4. **The public-edition crisis screen was weaker than the clinical one.** Emergent replaced the graded phrase library with a short keyword list in `PUBLIC_WELLNESS_MODE`, so "I have a plan" and "I wrote a note" produced no safety resources at all in the edition most people would use. The intent (no clinical instrument shown to a consumer) was right; the mechanism was wrong. Now one graded detector runs in both editions and only the wording differs. Lesson: reduce what is *presented*, never what is *detected*.
5. **A silent key mismatch in Claude's build.** The finance evidence hook read digital-twin domains as `mood`/`anxiety`/`sleep`, but the server writes `moodRegulation`/`anxietyManagement`/`sleepQuality`, so the twin never contributed and every index fell back to its default. Found only because the adapter was rewritten with a test that names the server's ids. Lesson: a fallback default hides a broken read; test the join, not just the ends.
6. **Emergent's own panel reviewer (GPT-5) flagged** build-time `VITE_*` flags, `trust proxy`, and Stripe raw-body order. Two of the three were already right in the code (`app.set("trust proxy", 1)`, `registerBillingWebhook` before `express.json`); the first is real and is handled in the Dockerfile in a later cycle.

Reassembled: typecheck clean, 299 tests, build, boot. Then the finance section was merged in the foundation's own patterns (see `PANEL_REVIEW.md`): 388 tests, audit passed, boot with `/finance` served and `finance.readiness` answering 403 in the public edition.

Notes carried forward: the tRPC error payload includes a `stack` outside production (tRPC's default); the assembled fuzz must prove no stack ever leaves the server in production posture. With no database, several procedures surface a raw internal error rather than a clean "unavailable" answer; cycle 2 gives them one.

## Cycle 2 — interface contracts

Taken apart: the express shell from the process (`buildApp()` in `server/_core/app.ts`; the entry point keeps the validator, the retention scheduler and the port), the tRPC error path from the resolvers, the gate from the procedure.

Learned:

1. **tRPC middleware does not see a throw.** `await next()` resolves to a result with `ok: false` and the error already wrapped; a `try/catch` around it catches nothing. The rewrite that strips stacks and internal messages has to act on the result. The first version of the sanitizer was silently a no-op, which the router fuzz exposed by leaking "Database unavailable".
2. **A gate written in the source is not a gate the machine can read.** The first harness parsed `routers.ts` by indentation and misplaced a nested router. Every procedure now carries `meta({ gate })`, and the harness fails if any procedure lacks one.
3. **The SPA fallback answered `DELETE /etc/passwd` with the home page.** Harmless, but wrong; page paths accept GET and HEAD only, and every `/api` path nothing else claimed is a JSON 404.

## Cycle 3 — fault injection

Taken apart: every pure engine under 10,000 adversarial inputs, the validator under 2,000 environments, every procedure under every role and edition with the database missing.

Learned:

1. **A TypeScript type is a promise the caller makes, not a guarantee the engine has.** Seven of nine engine families threw or produced NaN on inputs their types forbade. Each got one input seam and one test per seam (see `SIMULATION_REPORT.md`). The rule adopted: an engine may refuse an empty series with a plain Error, and nothing else; every other input degrades to a documented neutral value.
2. **`new Date(x)` is not safe for any `x`.** An object with an own `toString` field makes it throw "Cannot convert object to primitive value". Only strings, numbers and Date instances are parsed now.
3. **A fuzzer needs the same discipline as the code.** Three of the early failures were the harness's own: a lone surrogate in `encodeURIComponent`, non-Latin-1 header bytes the client refuses to send, and a `TRACE` the fetch API forbids. Each was fixed in the harness without weakening an invariant on the server.

## Cycle 4 — security and compliance

Taken apart: the internet-facing surface, assembled and booted, 10,000 requests in production posture with no database, gateway or portal.

Learned:

1. **Everything the foundation claimed about the surface held under fire**: HSTS and nosniff on every application answer, no-store on every API answer, cross-origin state changes refused, alg=none and wrong-secret cookies never became a session, the unsigned webhook never got a 2xx, the 1.5 MB body got a 413, the rate limiter engaged for one address and left its neighbour alone, and nothing in 10,000 bodies carried a stack, a path, a driver name or the canary planted in every input.
2. **What the harness first called failures were mostly honest answers**: a 503 "Sign-in is not configured" from OAuth start, a 503 "Paid subscriptions are disabled" from billing, tRPC's own plain-text 405/413/415, Node's own 414/431 with no application headers. The invariants were refined to name them; none was loosened on the server.
3. **The edition can drift between the bundle and the server.** Vite bakes `VITE_*` at build time and Railway only passes variables into a Docker build as declared build arguments. The Dockerfile now declares them, the build stamps `build-info.json`, and the validator refuses a bundle built for another edition, posture, privacy contact or processor list.
4. **The fail-closed validator is right, and it still needs a door for review.** The eight operator attestations are the owner's to make; the integrator cannot set them truthfully. `RELEASE_POSTURE=preview` opens the public edition for review with the blockers listed and a banner on every page, while still refusing a placeholder disclosure, paid mode or the clinical edition.

## Cycle 5 — performance and longevity

Taken apart: bursts of 100 in flight, a 220-request abuse run, heap measured before and after the soak.

Learned:

1. **The in-process rate limiter and retention scheduler are fine at one replica** and documented as such; the limiter's map is capped at 10,000 addresses and sweeps expired buckets. A second replica would double both; that is the first change to make if the service scales out.
2. **Heap growth over 10,000 requests was ≈ 50 MB before garbage collection and negative after it.** No handle or bucket leak.
3. **Median cost of the whole assembled soak was 13 seconds on one core**, so the harness can run on every push.

## Standing rules that came out of the five cycles

- Reduce what is presented, never what is detected.
- Every engine has one input seam and never throws on a shape it did not expect.
- Every procedure declares its gate where the machine can read it.
- Whatever the browser was built to say, the server checks before serving it.
- A build report that did not run the build is a description, not a verification.


## Cycle 6 (deploy to live, 2026-09-16)

- A literal dynamic `import("../../vite.config")` is still followed by esbuild: the config and its dev plugins were inlined and hoisted, and production failed on a dev-only package. Resolve development-only module paths at runtime (`pathToFileURL(path.resolve(cwd, "vite.config.ts"))`) so the bundler cannot see them.
- The delivered LLM client hardcoded a Gemini model and Manus-forge-only request fields. Any OpenAI-compatible endpoint rejects unknown fields and enforces per-model output limits. Model and ceiling are now operator-configured; forge fields only go to the forge.
- Host-preview plugins (Manus runtime, JSX loc, debug collector) belong to the preview host, not the product. The production CSP correctly blocked the inline script they emitted; the fix is to not ship them.
- Per-page titles and a path-normalizing consent bypass (`/crisis/` with a trailing slash was gated) came from the outside pass; a second pair of eyes on the live site finds what the harness cannot.
- Standing rule: an engine that speaks (the companion) must have its decision made in code and tested, with the model only rephrasing inside the decision; and it must never speak twice on the same silence.
