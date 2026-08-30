// ============================================================
// PARALLEL COMPUTE FABRIC — the pluggable-backend seam.
// Patent family shared component 2 (lifts AQAL-001, 002, 007, 012).
//
// All heavy fan-out work (the 8-model panel, batch re-scoring,
// combinatorial matching) runs through this ONE typed interface,
// so the compute backend is swappable without touching callers.
//
// HONEST SCOPE:
// - Implemented backend: softwareFabric — bounded-concurrency
//   parallel execution on the host CPU. This is what runs today.
// - The FPGA systolic-array co-processor named in the patent spec
//   (Xilinx Zynq/UltraScale+) is a HARDWARE embodiment of this
//   same interface: a second ComputeFabric whose runParallel
//   dispatches to the co-processor. It requires hardware
//   procurement and is NOT implemented here; no code in this
//   repository claims otherwise.
// ============================================================

export interface ComputeFabric {
  /** Identifies the backend in logs and ledger entries. */
  readonly backend: string;
  /** Run `worker` over `items` in parallel, preserving input order in the output. */
  runParallel<T, R>(items: T[], worker: (item: T, index: number) => Promise<R>, opts?: { concurrency?: number }): Promise<R[]>;
}

// Bounded-concurrency software backend. Order-preserving; a worker rejection
// propagates (callers decide their own per-item error policy, exactly as they
// did with bare Promise.all).
export const softwareFabric: ComputeFabric = {
  backend: "software-cpu",
  async runParallel<T, R>(items: T[], worker: (item: T, index: number) => Promise<R>, opts?: { concurrency?: number }): Promise<R[]> {
    const concurrency = Math.max(1, Math.min(opts?.concurrency ?? items.length, items.length || 1));
    const results = new Array<R>(items.length);
    let next = 0;
    const lanes = Array.from({ length: concurrency }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await worker(items[i], i);
      }
    });
    await Promise.all(lanes);
    return results;
  },
};

let active: ComputeFabric = softwareFabric;

/** The fabric all fan-out work should use. */
export function computeFabric(): ComputeFabric {
  return active;
}

/** Install an alternative backend (hardware co-processor, test double). */
export function setComputeFabric(fabric: ComputeFabric): void {
  active = fabric;
}
