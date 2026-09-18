# RCS Integration Notes — Real Estate Capital / RECIN

**Last updated:** 2026-09-18 (Sprints A–D + UI)
**Audience:** the next AI or developer picking this up.

Read this before touching `shared/realEstate*` or `server/realEstate*`. It records
decisions that are not obvious from the code and that cost time to rediscover.

---

## 1. There are TWO real-estate engines, deliberately

They share a domain and a types file. They are not interchangeable and neither
replaces the other.

| | `realEstateCapitalStackEngine.ts` | `realEstateCapacityEngine.ts` |
|---|---|---|
| Question | "How does this deal split?" | "How much can this client borrow?" |
| Point of view | **Sponsor / syndication** | **Borrower / household** |
| Entry point | `analyzeCapitalStack()` | `analyzeRealEstateCapitalScenario()` |
| Models | Senior/mezz/pref/common, IRR-lookback promote waterfall, exit IRR | Collateral + income capacity, prudent sizing, stress, tax guardrails |
| Output | `CapitalStackResult` | `RealEstateCapitalScenarioResult` |

**Why the split.** The integration blueprint named
`shared/realEstateCapitalStackEngine.ts` for the borrower-side contract, but that
file already held a working, tested syndication engine. Blueprint §13.2 says do
not overwrite existing financial engines, so the borrower-side engine went into
a new isolated module. If you were looking for `analyzeRealEstateCapitalScenario`
in the stack engine, that is why it is not there.

Both sets of types live in `realEstateCapitalTypes.ts`, split by a banner
comment. Above the banner is syndication; below is RECIN capacity.

### Naming collisions already resolved

- `StressResult` (syndication) vs `CapacityStressResult` (RECIN). Different shapes.
- `Finding` is **shared**. RECIN added optional fields — `confidence`,
  `materiality`, `affectedMetric`, `evidenceIds`, `requiredReviewer`,
  `invalidatedBy`. The syndication engine omits them; do not make them required.
- `PropertyProfile` (syndication) vs `PropertyInput` (RECIN).

---

## 2. Compiler constraint that will bite you

`tsconfig.json` sets **no `target`**, so it defaults to ES5 and there is no
`downlevelIteration`. Consequences:

```ts
// ✗ Compile error (TS2802), even though vitest runs it fine
for (const x of someSet) {}
const a = [...someMap.values()];
text.matchAll(re);

// ✓ Do this instead
someMap.forEach((v, k) => {});
const a = Array.from(someMap.values());
let m; while ((m = re.exec(text)) !== null) {}
```

Tests are **excluded** from `tsconfig` (`"exclude": ["**/*.test.ts"]`), so test
files may use modern syntax. Source files may not. `npx vitest run` passing is
**not** evidence that `npx tsc --noEmit` passes. Always run both.

---

## 3. Modelling decisions that change the numbers

Do not "simplify" these. Each was chosen over an easier alternative for a reason.

**Capacity engine**

- **NOI is underwritten, not pro forma.** Effective occupancy is
  `min(reported occupancy, 1 − assumed vacancy)` — an advisor's 100%-occupied
  claim cannot override a vacancy stress. Operating expenses include taxes,
  insurance, HOA, management **and the maintenance reserve**. Dropping the
  reserve is the classic way a pro forma flatters DSCR.
- **DSCR sizes on TOTAL coverage**, `NOI ÷ (existing + new debt service)`, not
  incremental. Incremental testing lets a second lien pass while the property
  as a whole cannot carry itself.
- **Undrawn credit lines count against CLTV in full.** A lender underwrites the
  whole line, not the drawn balance.
- **Lender maximum ≠ prudent maximum.** Two separate numbers, both reported.
  Prudent = lender max cut down to what survives the *conservative* stress.
  The gap is the margin of safety; the product is that gap.
- **Reserves are counted once.** Earmarks that exceed the balance produce a
  negative unallocated figure, which fires `LIQUIDITY_COLLISION` (critical).
- **Fixed-rate debt is not rate-shocked.** It genuinely is insulated until
  maturity; the exposure there is refinance risk, surfaced separately.

**Stack engine**

- Debt amortizes **monthly**, rolled up to annual rows. Annual-only understates
  interest and overstates DSCR.
- DSCR is net of the capital reserve (conservative lender definition).
- Exit capitalizes **forward** NOI.
- Debt maturing inside the hold keeps being serviced and sets
  `refinanceRequired`. Letting it vanish at maturity would hand the deal free money.
- IRR uses **bracketed bisection**, not Newton — Newton diverges on sign-flipping
  levered flows, and a silently wrong IRR is worse than `NaN`.

---

## 4. Hard compliance rules (do not relax)

These are enforced in code and asserted in tests. Breaking one is a product
defect, not a style choice.

1. **Never** state or imply that a loan is approved, available, suitable, or
   that anything is tax-free or deductible. The engine emits review flags
   instead. `realEstateCapital.test.ts` scans claim-bearing output for these words.
2. **Debt payoff never reduces taxable gain.** `computeSaleAnalysis` returns a
   cash column and a tax column that must never be netted. There is a test that
   adds debt and asserts the tax column does not move.
3. **Interest is a deduction, not a credit**, and deductibility follows the
   **use of proceeds**, not the collateral. Both emitted as `TaxFlag`s whenever
   an equity line is present.
4. **Loan terms without a live source are illustrative, never quotes.**
   `DebtOption.termsSource.status` carries this.
5. **The LLM is never the calculator.** All money math is deterministic
   TypeScript. Agents consume engine output and cite it.

---

## 5. Grounding enforcement in the agent layer

`server/workingMemoryOrchestrator.ts` does not merely *ask* the model not to
invent numbers. `verifyGrounding()` extracts every figure from an agent's output
and checks it against the context that agent was given; ungrounded figures are
rejected before reaching working memory. Engine output is **pinned** in memory so
model opinion can never evict ground truth.

If you add an agent, set `citesOnly: true` unless it reviews prose rather than
restating figures (the compliance reviewer is the only current exception).

Watch out: `extractNumbers` uses a regex where **every alternative must consume at
least one digit**. An earlier version had all-optional components, could match the
empty string, and hung `exec()` forever. There is a termination test guarding this.

---

## 6. What is built vs. what is not

**Built and tested (272 tests across 8 files):**

- **Sprint A** — syndication stack engine, stress, findings; RECIN borrower-side
  capacity engine (collateral / income / LTC / ARV sizing, binding constraint,
  payment schedules, prepayment, bridge exit + take-out readiness, base /
  conservative / severe stress, sale cash-vs-tax split, tax flags, missing-input
  detection, fragility ranking)
- **Sprint B** — `shared/realEstateStructuredFinanceEngine.ts`: CMBS flexibility
  cost, nonrecourse carveout classification (springing vs standard), mezz/pref
  control-asymmetry scoring, all-in subordinate cost, subordinate tax flags
- **Sprint C** — source ledger with a consent gate, staleness by value kind,
  LLM redaction, advisor review queue with a client-release gate; RECIN tables
  in `drizzle/schema.ts`; the 12-perspective agent roster
- **Sprint D** — external data channel registry (21 channels across the four
  phases), adapter contract, feature flags, credential detection, consent
  enforcement, channel status
- **UI** — all seven §14 screens at `/portal/recin`

**Not built:**

- **Sprint D providers.** Every adapter is a shell that returns `unavailable`.
  Wiring a real provider means implementing `fetch()` and nothing else — the
  gate, provenance and ledger recording are already in place.
- **Persistence wiring.** The RECIN tables exist in the drizzle schema but no
  migration has been generated (`pnpm db:push`) and the router still computes
  in-memory rather than reading and writing them. `SourceLedger` takes an
  injectable `LedgerStore`; implementing a DB-backed one is the hook.
- **Advisor review persistence.** The queue prioritizes and gates correctly but
  decisions are not yet saved to `recin_findings`.

---

## 6b. Decisions made during Sprints B–D

**`requiresOneOf` on agents.** Putting `underwriter` and `capital_markets` into
the 12-roster exposed a gap: they required `stack_result` (syndication) and so
could never run on a RECIN capacity pipeline, and `compliance_reviewer` required
`investor_summary`, which no agent in the 12 produces. Rather than duplicate the
agents per engine, `AgentDefinition` gained `requiresOneOf: MemoryKind[]` —
satisfied by the first alternative present. Engine-agnostic agents now declare
`requiresOneOf: ["stack_result", "capacity_result"]`.

**MySQL, not Postgres.** Blueprint §9 specifies Postgres DDL. This platform is
MySQL via drizzle-orm/mysql-core. The RECIN tables are mapped to the repo's
existing conventions (`mysqlTable`, `mysqlEnum`, `int` autoincrement PKs).

**Adapters refuse rather than degrade.** A channel that is disabled, missing a
credential, or missing consent returns a typed `unavailable` result with a
machine-readable reason. It never falls back to an estimate. The base class owns
the gate so a new provider cannot skip it by forgetting to call it.

**`asOf` and `retrievedAt` are separate.** An appraisal dated eight months ago
that we pulled this morning is fresh data about a stale fact. Staleness is
measured from `asOf`, with a per-kind threshold (`STALENESS_DAYS`), because a
rate goes stale in a week and an adjusted basis essentially never does.

**Redaction happens before the prompt AND before grounding.** `redactForLlm`
strips identifying keys, and `verifyGrounding` then checks against the REDACTED
set — otherwise a redacted field could "ground" a figure the agent invented.

**A UI contract test instead of a screenshot.** The workspace consumes tRPC
output as `any` at the render boundary, so a renamed engine field would fail
silently in production. `server/recinUiContract.test.ts` asserts every field
path the seven screens read exists with the right shape on real engine output.
The page itself could not be screenshotted here: it sits behind
`SubscriptionGuard` + `ComplianceGate` and its procedures are `protectedProcedure`,
so rendering it needs real credentials.

## 7. Where things are mounted

```
server/routers.ts  →  realEstateCapital: realEstateCapitalRouter
```

Procedures (all `protectedProcedure`):

| Procedure | Purpose |
|---|---|
| `defaults`, `capacityDefaults` | Reference data + policy thresholds |
| `analyze`, `stress`, `findings`, `underwrite`, `scenarios`, `breakEvens`, `monteCarlo` | Syndication side |
| `analyzeScenario`, `compareStrategies`, `saleAnalysis` | RECIN capacity side |
| `cmbsFlexibility`, `subordinateCapital`, `compareSubordinate` | Sprint B structured finance |
| `dataChannels` | Which external channels are actually live |
| `reviewQueue` | Prioritized advisor queue + client-release gate |

UI route: `/portal/recin` → `client/src/pages/portal/RECINWorkspace.tsx`.

Monte Carlo `runs` is capped at 10,000 — an unbounded run count from a client is
a cheap way to pin a server core.

Blueprint §11 specifies REST paths. This platform is tRPC throughout, and §13.3
says align with existing conventions, so the procedures mirror the REST intent
rather than adding a parallel REST surface. Revisit if an external consumer
needs real REST.

---

## 8. Policy thresholds are configurable and must be displayed

`DEFAULT_REAL_ESTATE_POLICY` lives in `realEstateCapitalTypes.ts`. Every result
echoes `policyUsed`. **Any report that relies on a threshold must print it** — a
finding is only defensible if the reader can see the threshold it was judged
against. Do not hardcode a threshold inside a rule; read it from policy.
