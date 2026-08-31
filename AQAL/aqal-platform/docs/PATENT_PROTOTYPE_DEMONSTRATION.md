# Working Prototype Demonstration — Transcript

Generated live by `scripts/patentBenchmarks.test.ts` against the engines as
shipped in this repository (Node v22.22.2, single commodity container CPU, 2026-08-31). Each section is a real invocation with
real output — the "working prototype demonstration" the filings reference,
for the software embodiments only.

### Consensus engine (PAT-001)
8 synthetic models scored 32 lines with deliberate disagreement; the calibration-weighted trimmed consensus settled line 0 ("Logical") at 0.5580 with confidence 0.794 — reasoning emitted: "Consensus of 8 models · 79% agreement."

### Voice-feature engine (PAT-002)
30 s of synthetic audio produced: pitchMean 219.2 Hz, rmsEnergy 0.354, pauses 0, speakingRate 16.0 WPM. Tone-accuracy: 110 Hz→110.3 Hz (0.3% err); 220 Hz→219.2 Hz (0.4% err); 330 Hz→333.3 Hz (1.0% err).

### Immutable ledger
10,000 chained entries built and verified valid in 36.90 ms. A single payload edit at entry 5001 was then detected at exactly id 5001.

### Controlling-weakness engine (PAT-004)
Given a 32-line vector with a planted minimum, the argmin returned axis 19 ("Adaptive") at 0.11 with constraint impact 0.511.

### Compute fabric
The same 8-task workload ran 7.9× faster through the fabric's parallel software backend — the seam the hardware co-processor slots into.

### Sister combinations (17 registered)
Live invocation of "Voice-Based Weakness Identification" over the real voice + weakness outputs returned engines [voice, weakness] and logged to the ledger path.

### Platform context
These engines run inside the live joinaqal.com application: the consensus
bus and voice pipeline execute on every scored assessment; the ledger
records scores, matches, floors, and calibration updates; /api/ledger/verify
exposes public chain verification.
