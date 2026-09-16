# Doctor Buddy Emergent 2.1 — Panel Review of Both Builds

Date: 2026-09-16. Convened before any integration work, as the owner directed.

Panel: **Grok 4.3** (xAI, via OpenRouter), **ChatGPT GPT-5** (OpenAI, via OpenRouter; reviewing its own team's Emergent foundation), **Perplexity** (web-grounded, with citations), **Perplexity Computer** (agent), and **Claude** (integrator, author of the second build). Grok 4 is deprecated at OpenRouter and was replaced by Grok 4.3.

The brief sent to every model is in the session scratchpad (`panel/brief.md`) and summarized here: two builds share ancestor `ce4d05b`; the Emergent build adds the two-edition release policy, fail-closed production validator, consumer-health consent and data rights, Stripe billing, security baseline, Support Lab, legal pages, migrations 0010–0012 and a Dockerfile; Claude's build adds the medically-driven financial planning section (`shared/finance/*` with 56 calculators, `shared/engines/psychFinancialBridge.ts`, four `/finance*` pages). Nothing else differs. Emergent is the foundation.

## 1. Consensus decisions

| Question | Decision | Who |
|---|---|---|
| Foundation | Emergent build, unchanged in posture | all |
| Where the calculators go | `shared/finance/*` verbatim, pure, browser-first, no server import except tests | all |
| Where the bridge goes | `shared/engines/psychFinancialBridge.ts` unchanged API, side-effect free | all |
| Finance routes' gate | `paid()` in the public edition (passes through while paid subscriptions are off), `clinicalProtected()` in the clinical edition; never `ClinicalToolsUnavailable`, the calculators are not medical | ChatGPT, Perplexity Computer, Claude (Grok wanted clinical-only; outvoted, see §3) |
| tRPC namespace | None for the calculators. One clinical-only procedure `finance.readiness` for a server-side clinical snapshot, registered in `CLINICAL_TRPC_PROCEDURES` (exact path, not a prefix) | ChatGPT, Claude |
| Bridge in the public edition | Allowed, driven by **wellness-safe proxies** (self-reported stress/urgency, the local check-in, a user-chosen pause), never by clinical scale names or numbers; the lock is a reversible user-chosen cooling-off period; copy says "educational estimate", never "crisis detected" or "protects you from loss" | Perplexity (regulatory), Perplexity Computer, ChatGPT, Claude |
| Unknown wellness state | Conservative default: irreversible actions locked until the user supplies a check-in | ChatGPT, Perplexity Computer |
| `HipaaConsentModal` | Not reintroduced | all |
| Framing | Education, not individualized advice; no product-specific "buy/borrow/invest" outputs keyed to health state; financial disclaimer page linked from the hub | Perplexity |

## 2. Integration plan (file level)

1. `shared/finance/**` — copied as is.
2. `shared/engines/psychFinancialBridge.ts` + `server/psychFinancialBridge.test.ts` — copied as is; a public-proxy adapter added beside it rather than inside it.
3. `client/src/pages/finance/{FinanceHub,FactFinder,FinanceCalculator,FinanceStrategy}.tsx`, `client/src/components/finance/{CalcRunner,ReadinessPanel}.tsx`, `client/src/lib/{financeStorage,clinicalEvidence}.ts` — copied, then `ReadinessPanel` split by edition: clinical + authenticated → `trpc.finance.readiness`; otherwise local proxies.
4. `client/src/App.tsx` — four routes with `CLINICAL_TOOLS_ENABLED ? clinicalProtected(X) : paid(X)`.
5. `client/src/components/NavBar.tsx` — "Finance" in the wellness nav, "Fact Finder" secondary; `client/src/pages/Home.tsx` and `ClinicalHome.tsx` feature card.
6. `server/compliance/releasePolicy.ts` — `finance.readiness` added to `CLINICAL_TRPC_PROCEDURES`; compliance test asserts it is FORBIDDEN in the public edition.
7. `server/routers.ts` — `finance` router with the single procedure.
8. `test/navRoutes.test.ts` — parameterized `/finance/calc/` and `/finance/strategy/`.
9. `scripts/emergent-release-audit.mjs` — finance links resolved; forbidden-claim scan extended with "guaranteed return", "financial advice", "crisis detected".
10. `client/src/pages/legal/FinancialDisclaimer.tsx` at `/financial-disclaimer`, linked from the hub and the legal footer.
11. `.env.example`, `DEPLOYMENT.md`, `PUBLIC_LAUNCH_CHECKLIST.md` — finance section; no new env vars needed.

## 3. Dissent recorded

Grok 4.3 argued the bridge must be clinical-edition-only because "it reads only from clinical engines" and public exposure risks clinical-signal leakage, and proposed adding `finance.` as a clinical prefix. The panel majority and the regulatory read (Perplexity) favor keeping the harm-reducing levers in the public edition on non-clinical proxies, with clinical-grade inputs behind `ENABLE_CLINICAL_TOOLS`. Grok's leakage concern is honored by the invariant in §5.4 (no clinical field name, scale, or severity number in any public-edition finance output) and by keeping `finance.readiness` server-blocked in the public edition.

## 4. Risks in the Emergent foundation (agreed, ranked)

1. **Build-time edition flags.** `VITE_PUBLIC_WELLNESS_MODE` and `VITE_ENABLE_CLINICAL_TOOLS` are baked by Vite at build; Railway does not pass service variables into a Docker build unless declared as `ARG` and forwarded (Railway docs, Perplexity citation). A promoted image can carry the wrong edition. Fix: `ARG`/`ENV` for every `VITE_*` in the Dockerfile and a boot-time check that the baked edition matches the runtime edition.
2. **`npm ci` fails on the delivered lockfile** (peer conflict `@builder.io/vite-plugin-jsx-loc` vs vite 7.3.6). Found by Claude while installing; the Dockerfile would fail the same way. Fix: `.npmrc` `legacy-peer-deps=true` or drop the dev-only plugin.
3. **`trust proxy`** must be set behind Railway's edge or secure cookies, `req.secure`, HSTS logic and express-rate-limit (which throws on an unexpected `X-Forwarded-For`) misbehave.
4. **Stripe webhook body order**: `express.raw` on `/api/billing/webhook` before any `express.json`.
5. **In-memory rate limiter and in-process retention cron** reset per replica and can double-fire; acceptable at one replica, must be documented; advisory lock around retention.
6. **Hand-applied migrations + fail-closed validator** can produce a boot loop; `/healthz` should report "migrations pending" rather than the app crashing.
7. **Error and log hygiene**: tRPC/express error paths must never serialize input or user email; superjson can serialize deeply.
8. **`/healthz`** should be shallow (Railway restart loop otherwise) but a separate `/readyz` may check the DB.
9. **Determinism**: engines must have no unseeded randomness.
10. **OAuth callback** must validate the host against `PUBLIC_BASE_URL`.

## 5. Chaos and fuzz design (adopted)

- **Seeding**: root seed = sha256(commit + run id); per-layer seeds derived; every failure persisted with its seed and a shrunk reproducer.
- **Apart (10,000)**: engines (all six + 56 calculators) with NaN, ±Infinity, negative, 1e308, empty, unicode, prototype-pollution keys, wrong types, deep objects; validator with random env permutations including placeholders; every tRPC procedure enumerated from `appRouter._def.procedures` and invoked with mocked ctx across edition × role × subscription; gates rendered under each state.
- **Assembled (10,000)**: booted server on an ephemeral port with the fake db; request-shape fuzz on every express route (methods, headers, cookies, JWT alg=none/expired/nbf, oversized bodies, garbage JSON, slow bodies), tRPC random walks, concurrent bursts, db outage and LLM timeout/5xx/garbage injected mid-run, clock skew.
- **Invariants, every run**: (1) no crash or unhandled rejection; (2) no 500 with a stack or secret in the body; (3) no clinical procedure returns data in the public edition; (4) no PHI or email in logs; (5) crisis lock and finance safety lock never bypassed and monotone in risk; (6) validator never passes with a placeholder or mismatched pair; (7) engines never throw, never emit NaN/Infinity, deterministic; (8) monetary conservation within one cent where a calculator promises it; (9) no clinical field name or severity number in public-edition finance output; (10) rate limiter never negative or global-locking.

## 6. Disassembly protocol (five cycles)

Cycle 1 inventory and baseline; cycle 2 interface contracts per boundary; cycle 3 fault injection; cycle 4 security and compliance (authz, JWT, SSRF, gate bypass); cycle 5 performance and longevity (soak, cron overlap, memory). Each cycle: take the app apart into engines, routers, gates, validator, express shell; verify each alone; reassemble; run check, test, build, boot, `/healthz`; write what broke and what was learned into `LESSONS.md`.

## 7. Top hardening changes (merged ranking)

1. `.npmrc` legacy-peer-deps so the Docker build succeeds.
2. Dockerfile `ARG`/`ENV` for `VITE_*` and a baked-vs-runtime edition check at boot.
3. `app.set("trust proxy", 1)` in production.
4. Stripe raw body before JSON parser, verified by test.
5. Central error redaction for tRPC and express; no input echo in production.
6. Engine input guards: every exported engine and calculator coerces non-finite numbers and rejects prototype keys.
7. `finance.readiness` registered clinical-only with a test.
8. Retention cron advisory lock and single-runner guard.
9. `/healthz` shallow; migrations-pending surfaced.
10. Release audit extended to finance links and claims.

## 8. Honest production flags for the first public deployment

Set now: `PUBLIC_WELLNESS_MODE=true`, `ENABLE_CLINICAL_TOOLS=false`, `HIPAA_DEPLOYMENT_MODE=consumer`, `ENABLE_PAID_SUBSCRIPTIONS=false`, real `PRIVACY_CONTACT_EMAIL`, `SECURITY_CONTACT_EMAIL`, `LEGAL_BUSINESS_NAME`, `LEGAL_BUSINESS_ADDRESS`, `HEALTH_DATA_PROCESSORS` (Railway, the AI gateway's legal name, the auth provider), `AI_PROCESSOR_NAME`, `AUTH_PROCESSOR_NAME`, `PUBLIC_BASE_URL`, `JWT_SECRET`, `DATABASE_URL`, retention values 90/90/35/90, `VITE_ENABLE_MARKETING_ANALYTICS=false`.

The eight operator attestations (`PRIVACY_SECURITY_REVIEW_CONFIRMED`, `CONSUMER_DATA_ENCRYPTION_CONFIRMED`, `AI_PROCESSOR_PRIVACY_REVIEW_CONFIRMED`, `PROCESSOR_CONTRACTS_CONFIRMED`, `EXTERNAL_RESEARCH_QUERY_REVIEW_CONFIRMED`, `INCIDENT_RESPONSE_PLAN_CONFIRMED`, `DATA_RETENTION_POLICY_CONFIRMED`, `CONSUMER_HEALTH_DATA_DELETION_WORKFLOW_CONFIRMED`) are statements that the owner has done the described work. They are the owner's to set, not the integrator's; the validator refuses to start production without them, which is the foundation working as designed. Until the owner sets them, the service runs with `NODE_ENV=production` unset for the validator (staging posture) or the owner confirms them.
