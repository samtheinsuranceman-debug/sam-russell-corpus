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
| 4 | DSP voice-feature extractor | **NOT BUILT — DECLINED by owner policy.** The owner's standing product decision excludes voice-tone analysis. If that decision is ever reversed in writing, prosodic/spectral extraction can be added and this row updated; until then no filing should claim it | — |
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
- The "floor_event" ledger kind is reserved: AQAL-012's verified-floor
  engine writes to it when floor tracking ships.
- Test coverage: `server/patents/patents.test.ts` (chain verification and
  tamper detection, calibration math and cold start, equal-weights
  equivalence to the classic consensus, fabric ordering/concurrency,
  isolation leak-proofing).
