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
- AQAL-012's verified-floor engine is now implemented: `server/patents/
  achievementFloors.ts` (ratchet via conditional GREATEST update, evidence
  hours accumulated, every accepted state committed to the ledger's
  "floor_event" kind). The `raised` flag reports true only when evidence
  actually moved the ratchet.
- AQAL-002's multiplicative rarity engine is implemented but DELIBERATELY
  UNWIRED from any displayed number: with ~32 terms and heuristic
  independence damping, typical profiles saturate its cap, and a ceiling
  artifact is not a defensible rarity claim. The displayed composite keeps
  the legacy calibrated curve until real inter-line correlations from the
  founding cohort justify more.
- AQAL-004's controlling-weakness argmin and the per-line research
  provenance table (`research_provenance`, to be seeded from the cited
  sources) are implemented as callable modules.
- Test coverage: `server/patents/patents.test.ts` (chain verification and
  tamper detection, calibration math and cold start, equal-weights
  equivalence to the classic consensus, fabric ordering/concurrency,
  isolation leak-proofing).

## Sister-patent combinations (this cut)

- `server/patents/combinations/` implements the **17 named sister-patent
  combinations** as composable combinators over the seven live engines
  (consensus, voice, weakness, coaching, stageBand, integral,
  transparency), each writing its result to the tamper-evident ledger.
  The registry is the single source of truth the filings reference;
  tests enforce registry↔combinator agreement.
- The additional emergent (6) and super-emergent (16) combinations in the
  portfolio span the RCS and Dr. Buddy codebases as well — they are
  SPECIFIED for cross-system filing but not implementable inside this
  repository alone, and no filing should claim they run here.

## Transparency APIs (this cut)

- `GET /api/norms/changelog` — every norming snapshot with description
  (public; the re-norming transparency embodiment).
- `GET /api/ledger/verify` — public end-to-end chain verification
  (length + validity, never payloads).
- `sovereign.provenance` / `sovereign.identityExport` (tRPC) — per-line
  research provenance and the member's consolidated exportable identity
  document (scores, floors, controlling weakness, norming version,
  provenance). The research_provenance table ships empty and is to be
  seeded from the cited research library; the endpoint honestly returns
  an empty list until then.
