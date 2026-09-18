# The Plan Ledger (handoff for Grok)

Idea 1 of doc 06, built. One append-only, hash-chained record per subject;
everything else becomes a projection of it. Paths relative to
`russell-capital-systems/`.

## What exists

| Piece | File | Notes |
|---|---|---|
| Pure logic | `shared/planLedger.ts` | `diffFactFinder(prev, next)` → one fact event per changed field (labelled from `FACT_FINDER_SECTIONS`, lists compared whole); `replayFacts(events, asOf?)` → the assessment as it stood; `canonicalEvent()` (the hashed string); `ledgerSubject()`; `groupByDay()`; `formatFactValue()`. |
| Storage | `drizzle/schema.ts` → `plan_events`, `server/ledgerDb.ts` | Columns: subject, seq, userId/clientId/leadId/workspaceId, kind, source, key, label, value, prevValue, summary, actorName, occurredAt, prevHash, hash. Unique index on (subject, seq); indexes on client/user/lead — the first secondary indexes in the schema. `appendEvents()` chains with SHA-256 over `prevHash | canonicalEvent`; `verifyChain()` recomputes every hash. Rows are never updated or deleted. |
| Writers | `server/ledger.ts` | `recordAssessmentChange(ids, prev, next, source)`, `recordEvent(e)`, `assessmentResetEvent(ids)`. Never throw. |
| Router | `server/ledgerRouter.ts` (`ledger.*`) | `timeline` (newest first, `beforeSeq` pages back), `replay` (`asOf`), `diff` (`from`, `to`), `append` (decision / note / assumption / outcome), `verify`. Scope: no ids → the caller's own chain (`u:<userId>`); `clientId` → a client in the caller's workspace (`c:<id>`); `leadId` → owner only (`l:<id>`). |
| Client page | `client/src/pages/portal/PlanLedger.tsx` → `/portal/plan-ledger` ("Plan Ledger" in New Client Welcome List) | Timeline grouped by day, kind filters, chain-verified badge, and a time scrubber that replays the assessment as it stood at any fact. |
| Advisor panel | `client/src/components/ClientLedgerPanel.tsx` (on the client page) | The client's chain: messages, decisions, outcomes; "Record" appends a decision/assumption/note/outcome. |

## Who writes to it today

| Event | kind | source | where |
|---|---|---|---|
| Every changed assessment field | fact | client | `factFinder.save` (diff of previous vs new) |
| Assessment completed for the first time | status `assessment.completed` | system | `factFinder.save` |
| Assessment reset | status `assessment.reset` | client | `factFinder.reset` (replay honours it) |
| Journey built | journey `journey.<id>` | ai | `librarian.journey` |
| Journey page opened (first time) | journey `journey.<id>.<step>` | client | `librarian.markVisited` |
| Email / text sent, suppressed, or failed | message | advisor or automation | `messaging.deliver()` (clients and leads; follow-ups included) |
| Lead captured with consent | status `lead.captured` | client | `leads.capture` |
| Lead status changed | status `lead.status` | advisor | `leads.updateStatus` |
| Advisor decision / note / assumption / outcome | as chosen | advisor | `ledger.append` |

## Subjects and the join that is still missing

A signed-in client's chain is `u:<userId>`; the advisor's client record is
`c:<clientId>`; a lead is `l:<leadId>`. They are separate chains because the
client record and the assessment are still keyed differently (doc 05, item
1). When that merge lands, add `clientId` to the assessment writers and the
two chains become one. Until then the advisor sees messages and decisions on
the client chain, and the client sees facts and journeys on theirs.

## Rules

1. Append only. No procedure updates or deletes a `plan_events` row.
2. Every writer goes through `server/ledger.ts` so a failed write never breaks the action it records.
3. Facts are diffs, never snapshots: a save that changes nothing writes nothing.
4. The summary is human-readable and figure-honest (facts show the number; messages never do).
5. Verify before trusting: `ledger.verify` recomputes the chain; a break points at the first altered entry.

## Next projections to derive from the ledger

- Wealth Genome history (score after each fact batch) — a sparkline on The Mirror.
- "What changed since your last visit" on My Secret Journey (`ledger.diff` from the last `journey` event).
- Compliance audit trail page reading `plan_events` instead of random data (doc 05, item 2).
- Scenario events from every calculator save (doc 06, idea 2 makes this one line per instrument).

## Tests

`server/ledger.test.ts` (10): diff labelling and blank handling, list comparison, replay with resets, day grouping, chain append/verify through the router, tamper detection, workspace scoping, diff between moments.
