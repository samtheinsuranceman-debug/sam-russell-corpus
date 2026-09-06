# The authority layer (handoff 11)

Built 2026-09-06 from handoff 10's "buildable now" list: items 1, 2, 3, 5, 13,
15 on the Plan Ledger and event bus, and 16, 25, 26 on data pipes that exist
today. Paths relative to `russell-capital-systems/`.

## What is here

| # | Idea | Where | What it does |
|---|---|---|---|
| 1 | Consent Ledger | `shared/consent.ts`, `consent_grants`, `controls.consent.*` | Scoped, time-boxed, revocable grants per grantee (person, agent, integration, advisor). Every grant/revoke is a `consent` ledger event. `consentFor(subject, granteeId, scope)` is the one gate every scoped read passes. |
| 2 | Fiduciary Transaction Firewall | `shared/firewall.ts`, `server/firewall.ts`, `money_movements`, `controls.firewall.*` | Every proposed movement is judged against the client's policy (latest `policy.firewall` status event), the proposer's mandate, spend this period, known payees and the reserve floor → allow / hold / block with reasons, sealed as a `control` event. Allowed agent movements execute at once (ledger-recorded; live rails attach here) inside a reversal window; held ones wait for a person. |
| 3 | Signed Advice Log | `server/advice.ts`, `controls.advice.log` | Every Financial Librarian answer is an `advice` event: question, answer, voices, the facts seen (key + value hash, never the figure), assumptions, rules, rule version, disclaimers, HMAC-SHA256 signature (`ADVICE_SIGNING_KEY`, falling back to `JWT_SECRET`). `verifyAdvice()` recomputes it. |
| 5 | Scoped Agent Mandates | `shared/mandates.ts`, `agent_mandates`, `controls.mandates.*` | Per agent: actions, accounts, per-action and per-period ceilings, the human-approval line, expiry. `mandateAllows()` is what the firewall consults. `mandate` ledger events. |
| 13 | Event-Driven Plan Runtime | `server/automations.ts`, `plan_automations`, `automation_runs`, `POST /api/events/inbound`, `controls.automations.*` | "When this event lands, do this." Actions: notify, propose_movement (through the firewall under the automation's mandate), append_status. One run per automation per event (content hash → unique index). Money runs are reversible inside the window. Events written by automations never trigger automations. Inbound events are HMAC-verified (`INBOUND_EVENT_SECRET` or `EVENT_WEBHOOK_SECRET`). |
| 15 | Provenance Document Vault | `server/provenance.ts`, `document_provenance`, `docs.upload`, `controls.provenance.*` | SHA-256 of every upload, version lineage (`supersedesDocumentId`), signed provenance record, and for estate papers a consistency check of the declared beneficiaries / trustees / executor / guardian / date against the plan. Conflicts appear in the `document` ledger event. |
| 16 | Consented Health-Financial Bridge | `server/_core/fhir.ts`, `server/healthBridge.ts`, `controls.suggestions.importHealth` | FHIR R4 Coverage + ExplanationOfBenefit → suggested values (plan type; out-of-pocket note). Requires `FHIR_BASE_URL`, `FHIR_ACCESS_TOKEN` and an active consent grant for `integration:fhir` with `health:coverage` + `health:claims`. Never touches underwriting. |
| 25 | Real-Time Tax Fact Feed | `server/taxFeed.ts`, `controls.suggestions.importTaxFeed` / `importTranscript` | IRS transcript text parsed locally; or any provider at `TAX_FEED_URL` (+`TAX_FEED_TOKEN`) returning the documented JSON record (the slot for an IRS-transcript API vendor or IRIS bridge). Requires consent for `integration:tax-feed`, scope `tax:transcripts`. |
| 26 | Versioned Tax-Rules Engine | `shared/taxRules.ts`, `controls.rules.*` | Rule sets `2025.rp-24-40+obbba` and `2026.rp-25-32` with every published figure and its source. `computeTaxPicture`, `saltAllowed`, `retirementLimits`, `diffRuleSets`, `recomputeUnderRules`. The legacy `taxBracketEngine.ts` now reads its brackets and standard deductions from the 2026 set (its old constants were 2025 brackets mislabelled as 2026 and a standard deduction that matched no published year). A recompute seals a `rules` event with the delta. |

Suggestions from 16 and 25 land in `fact_suggestions`; the client accepts or
rejects each one on `/portal/controls` → *Suggested values*. Accepting writes
the field through the normal assessment path with source `aggregator`, so the
ledger shows where the number came from.

## Ledger kinds added

`consent`, `mandate`, `advice`, `control`, `automation`, `rules` (in
`shared/planLedger.ts`, the `plan_events.kind` enum, and the ledger page).
`scripts/build_database.sh` now carries an idempotent `ALTER TABLE … MODIFY
kind ENUM(…)` so an existing database picks the new values up on the next
boot. `advice` events are never fanned out to webhooks (they carry the answer
text); the rest follow the usual `EVENT_WEBHOOK_KINDS` rules.

## Tables added

`consent_grants`, `agent_mandates`, `money_movements`, `plan_automations`,
`automation_runs`, `document_provenance`, `fact_suggestions` — all
`CREATE TABLE IF NOT EXISTS` in `database/rcs-schema.sql`.

## Environment variables added (all optional)

```
ADVICE_SIGNING_KEY       signs advice and provenance records (falls back to JWT_SECRET)
INBOUND_EVENT_SECRET     HMAC secret for POST /api/events/inbound (falls back to EVENT_WEBHOOK_SECRET)
FHIR_BASE_URL            FHIR R4 base, e.g. a payer Patient Access API
FHIR_ACCESS_TOKEN        bearer token for that server
TAX_FEED_URL             provider endpoint returning the TaxRecord JSON
TAX_FEED_TOKEN           bearer token for the provider
```

## Inbound event shape

```
POST /api/events/inbound
x-rcs-signature: hex(HMAC-SHA256(body, secret))
{ "subject": { "clientId": 12 }, "kind": "status", "source": "aggregator",
  "key": "cash.received", "summary": "Remittance posted", "value": { "amountCents": 1250000 } }
```

## Tested

`server/controls.test.ts` (17 tests): consent activity/expiry/wildcards,
mandate ceilings and approval line, every firewall rule, advice signing and
tamper detection, trigger matching / templates / event hashing / inbound
signatures, the 2025 and 2026 figures (including the IRS worked example of
$16,712 on $100,000 single taxable income and the published SALT example of
$25,000 at $550,000 MAGI), FHIR and transcript mappings, provenance signing
and the estate consistency check. `pnpm check` is clean.

## What is deliberately not done

- No live payment rails: an executed movement is recorded on the ledger with
  `rail = "ledger"`. Attaching a bank, RTP or tokenised-deposit rail is one
  function in `server/firewall.ts` (`executeMovement`), and it inherits the
  mandate, policy, approval and reversal logic unchanged.
- The advisor-side `docs.upload` passes only the client record's spouse name
  into the consistency check; the signed-in client's own assessment is the
  richer source and can be wired when client uploads exist.
- Rule sets carry only published figures; the 2025 AMT exemption is `null`
  because it was not verified in this pass.
