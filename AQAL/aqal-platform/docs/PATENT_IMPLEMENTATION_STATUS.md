# Patent Family — Shared Component Implementation Status

Companion to "AQAL Patent Portfolio — The Path to 10/10." That specification
names five shared components that lift all six applications. This document
records, honestly, which embodiments are IMPLEMENTED in this codebase and
which remain hardware procurement — so the enablement statements in any
filing describe only what is real. **Do not represent unimplemented hardware
as built. A registered patent attorney must confirm all claim language before
filing.**

| # | Component | Status | Where |
|---|---|---|---|
| 1 | Immutable append-only ledger | **IMPLEMENTED (software embodiment)** — hash-chained, tamper-evident ledger recording every score event, norm version, served match set, and calibration update; full-chain verification; exportable chain head for external anchoring | `server/patents/ledger.ts`, `auditLedger` table (migration 0029), wired into `saveScores` and the matches procedure |
| 2 | FPGA parallel-compute co-processor | **SEAM IMPLEMENTED; HARDWARE NOT BUILT** — all panel fan-out now runs through one typed `ComputeFabric` interface with a bounded-concurrency software backend; the Xilinx systolic-array co-processor is a second backend behind the same interface and requires hardware procurement | `server/patents/computeFabric.ts`, wired into `server/platform/panel.ts` |
| 3 | Secure enclave isolation | **SOFTWARE EMBODIMENT IMPLEMENTED; HARDWARE NOT BUILT** — per-dimension frozen isolation views make cross-dimension reads impossible by construction; ARM TrustZone / AWS Nitro execution of the same contract requires enclave-capable hosting | `server/patents/dimensionIsolation.ts` |
| 4 | DSP voice-feature extractor | **MODULE PRESENT — WIRING GATED.** A pure-software prosodic/spectral pipeline (YIN pitch, pause/energy analysis, derived indices) was delivered in an owner-supplied build asserting written approval on 2026-08-30, then debugged here (subharmonic pitch bias and silent-frame false positives fixed, synthetic-tone tests added). NOW WIRED, OVERTLY: on the owner's directive to make the filings fully true, every uploaded assessment answer runs through in-process feature extraction (best-effort; a failed decode never blocks the upload) and persists to voice_features, and the assessment page carries a plain-language disclosure directly above the recorder. Audio never leaves the server for this analysis | `server/patents/voiceFeatures.ts`, `voice_features` table (migration 0030) |
| 5 | Calibration-weighted consensus bus | **IMPLEMENTED** — per-model, per-dimension calibration weights derived from accumulated distance to the settled panel consensus; equal-weight cold start below 5 samples; trimmed-mean outlier guard retained; observations recorded on every multi-model scoring run | `server/patents/calibrationBus.ts`, `modelCalibration` table (migration 0029), wired into the scoring procedure |

## Honest-enablement notes

- The ledger is tamper-EVIDENT (hash chain), not yet tamper-PROOF
  (hardware-signed). `exportChainHead()` provides the 64-hex commitment for
  HSM signing, RFC 3161 timestamping, or public-chain anchoring — that
  upgrade is operational, not a schema change.
- Calibration weights measure calibration-to-panel-consensus over real
  scoring runs. They are not a ground-truth validity claim; no instrument
  has population ground truth for these constructs yet, and filings should
  say so.
- AQAL-012's verified-floor engine is implemented AND ACTIVE: `server/patents/
  achievementFloors.ts` (ratchet via conditional GREATEST update, evidence
  hours accumulated, every accepted state committed to the ledger's
  "floor_event" kind). The `raised` flag reports true only when evidence
  actually moved the ratchet. Activation source: the repeated-demonstration
  rule (`repeatedFloorLevels`) — a level counts as demonstrated when produced
  on TWO separate completed assessments at ≥0.6 confidence, and the floor is
  the MINIMUM of the two scores. It runs automatically after every scoring
  pass (`recordRepeatedDemonstrationFloors` in the scoring procedure), with
  evidence hours taken from the current assessment's recorded answer time.
- AQAL-002's multiplicative rarity engine is implemented but DELIBERATELY
  UNWIRED from any displayed number: with ~32 terms and heuristic
  independence damping, typical profiles saturate its cap, and a ceiling
  artifact is not a defensible rarity claim. The displayed composite keeps
  the legacy calibrated curve until real inter-line correlations from the
  founding cohort justify more.
- AQAL-004's controlling-weakness argmin and the per-line research
  provenance table (`research_provenance`) are implemented AND ACTIVE.
  The provenance table is seeded at boot (`server/patents/provenanceSeed.ts`,
  idempotent upsert) with all 32 lines mapped to their real research
  traditions and scholars (CHC/Gf-Gc, mental rotation, reflective judgment,
  interoception, financial-literacy research, etc.). Honesty rules: `doi`
  is NULL on every row — DOIs are never invented; specific vetted paper
  DOIs can be added from the research catalog later. `peerReviewed=true`
  asserts the tradition rests on peer-reviewed literature, not that the row
  cites one specific paper. `sovereign.provenance` now returns real rows.
- All five ledger kinds now FIRE in production: `score` (every scoring run),
  `norm_version` (appended at boot only when the active norming version
  differs from the last recorded one), `floor_event` (every accepted floor
  ratchet), `match` (every served match set), and `calibration_update`
  (one digest per multi-model scoring run: participating models, axis
  count, observation count, mean absolute error vs. the settled consensus).
- Test coverage: `server/patents/patents.test.ts` (chain verification and
  tamper detection, calibration math and cold start, equal-weights
  equivalence to the classic consensus, fabric ordering/concurrency,
  isolation leak-proofing); `server/patents/provenanceSeed.test.ts` (32
  unique axes, real scholars named, doi strictly null everywhere);
  `server/patents/achievementFloors.test.ts` (min-of-two floor rule,
  confidence gating, both-runs-required, missing-confidence-is-zero).

## Sister-patent combinations (this cut)

- `server/patents/combinations/` implements the **26 ACTIVE combinations**
  (the 17 original sister combinations plus the 9 additions the Six-AI
  Consolidated Portfolio marked ACTIVE WITH SAFETY GATES — JQ-018/019/020/
  027/028/030/034/036/038, whose outputs carry the educational-only,
  non-clinical, inputs-disclosed, no-medical-claims gates) as composable
  combinators over the seven live engines
  (consensus, voice, weakness, coaching, stageBand, integral,
  transparency), each writing its result to the tamper-evident ledger.
  The registry is the single source of truth the filings reference;
  tests enforce registry↔combinator agreement.
- **INVOKED IN PRODUCTION:** after every scoring run the activation pass in
  the scoring procedure calls the combination engines over the REAL outputs
  of that run — `transparentCognitiveAssessment` always; `integralWeakness
  Consensus` when a controlling weakness resolves; and, when the assessment
  has a persisted `voice_features` row, `voiceDrivenCognitiveAssessment` and
  `voiceCognitiveAssessmentTransparent` over the actual prosodic digest.
  The pass is best-effort and can never block or fail a member's scoring.
- The Six-AI portfolio's 22 DEFERRED/BLOCKED ideas (JQ-021…026, 029,
  031…033, 035, 037, 039…) and the earlier emergent (6) and super-emergent
  (16) combinations span the RCS and Dr. Buddy codebases as well — they are
  SPECIFIED for cross-system filing but not implementable inside this
  repository alone, and no filing should claim they run here.

## Roadmap-bottom additions (the patent PDFs' "additional code" list)

The implementation roadmap at the bottom of the patent portfolio PDFs
(RarityForge → AQAL Sovereign, "END OF ROADMAP") named CODEBASE and MISSING
items per patent. This cut closes every item buildable inside this codebase:

- **VectorCore validation layer** — `shared/vector32.ts` enforces the
  fixed-width contract at the score write path: exactly 32 lines, indices
  0..31, no duplicates, scores on 0..1; a violating write is a hard error.
- **WeakLink interventions lookup** — `server/patents/weaknessInterventions.ts`
  maps each line to the evidence-carrying protocols that develop it, drawn
  from the audited THERAPY_LINE_MAP (real citations; DOIs pass through from
  the source and are never invented). Served as `sovereign.weaknessPlan`
  (the "Focus Here" payload) with an educational-only disclosure.
- **MatchForge constraint-satisfaction team formation** —
  `server/patents/teamFormation.ts`: greedy complementary assembly under the
  "no two members share a controlling weakness" constraint, maximizing
  per-axis team coverage; reports satisfied=false honestly when the pool
  cannot comply, and labels itself a heuristic (no optimality claim).
- **LogVault voice history** — `sovereign.voiceHistory` returns the member's
  time-series of persisted voice features (append-order, capped at 500).
- **NormChain as-of-version recompute** — `GET /api/norms/recompute
  ?version=&scores=` re-computes rarity under any frozen norming snapshot
  without mutating stored data.
- **AQAL Sovereign** — `sovereign.identityExport` now supports scoped
  read-only slices (`full | rarity | weakness | floors`) and a JSON-LD
  rendering with schema.org annotations; EVERY export access is written to
  the append-only `identity_access_log` table (migration 0031) and the
  member audits it via `sovereign.accessLog`. `GET /api/ledger/head`
  publishes the chain-head commitment for external anchoring (HSM, RFC 3161,
  DID, or public chain).
- Still OWNER/INFRA-DEPENDENT from that list, honestly: enterprise OAuth2
  scope grants (needs the production identity provider), the external
  evidence-ingestion pipeline (webhooks/certification uploads), S3/Glacier
  lifecycle policies, the multi-model cost-tracking orchestration layer's
  paid API accounts, and the DID/blockchain anchor *service* and
  `/marketplace` bidding module — specified, not represented as built.

## Transparency APIs (this cut)

- `GET /api/norms/changelog` — every norming snapshot with description
  (public; the re-norming transparency embodiment).
- `GET /api/ledger/verify` — public end-to-end chain verification
  (length + validity, never payloads).
- `sovereign.provenance` / `sovereign.identityExport` (tRPC) — per-line
  research provenance and the member's consolidated exportable identity
  document (scores, floors, controlling weakness, norming version,
  provenance). The research_provenance table is seeded at boot with the
  32 real research traditions (see above), so the endpoint returns real
  rows; DOIs remain null until specific vetted papers are attached.
