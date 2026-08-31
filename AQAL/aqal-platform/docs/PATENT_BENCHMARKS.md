# Patent Engine Benchmarks — Software Embodiments

Measured by `scripts/patentBenchmarks.test.ts` (rerun it to regenerate).
Environment: Node v22.22.2, single commodity container CPU, 2026-08-31. These are SOFTWARE-embodiment numbers on commodity
hardware — they are not hardware co-processor figures, and no filing should
present them as such. Hardware embodiments inherit the same interfaces.

| Benchmark | Measured | Rate / note |
|---|---|---|
| 8-model × 32-line consensus combine | 0.11 ms per full combine | 9,440 combines/sec |
| Voice feature extraction (30 s audio, full pipeline) | 5270.28 ms | 6× faster than real time |
| Pitch recovery accuracy (synthetic tones) | 110 Hz→110.3 Hz (0.3% err); 220 Hz→219.2 Hz (0.4% err); 330 Hz→333.3 Hz (1.0% err) | all within 10% |
| Ledger: hash-chain 10,000 entries | 54.72 ms (182,759 appends/sec) | full-chain verify 36.90 ms |
| Controlling-weakness argmin (32-line vector) | 0.11 µs/op | 8,745,295 ops/sec |
| Floor-gated multiplicative rarity (32 lines) | 2.30 µs/op | engine benchmarked; deliberately unwired from display |
| Compute fabric: 8 × 25 ms tasks | serial 202.71 ms → parallel 25.68 ms | 7.9× speedup (software backend) |
