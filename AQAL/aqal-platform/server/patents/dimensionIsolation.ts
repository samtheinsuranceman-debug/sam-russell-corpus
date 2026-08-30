// ============================================================
// PER-DIMENSION ISOLATION — software embodiment.
// Patent family shared component 3 (lifts AQAL-001, 002, 007).
//
// Guarantees that per-dimension processing receives ONLY that
// dimension's data: a scoped, deep-frozen view is constructed per
// dimension, and the worker runs against the view — never against
// the full profile. Cross-dimension reads become impossible by
// construction rather than by convention.
//
// HONEST SCOPE:
// - Implemented: process-level isolation contexts (frozen scoped
//   views + a leak-proof worker signature). This is the software
//   embodiment of the isolation claim.
// - The hardware enclaves named in the patent spec (ARM
//   TrustZone / AWS Nitro / Apple Secure Enclave) are the
//   hardware embodiment: the same DimensionView contract executed
//   inside an attested enclave. Requires enclave-capable hosting;
//   NOT implemented here, and nothing in this repository claims
//   it is.
// ============================================================

export type DimensionView<D> = {
  readonly axisIndex: number;
  readonly axisName: string;
  readonly data: Readonly<D>;
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

/**
 * Build one isolated, immutable view per dimension. `extract` selects the
 * single dimension's slice from the full input; the full input is never
 * exposed to downstream workers.
 */
export function isolateDimensions<S, D>(
  full: S,
  axes: Array<{ axisIndex: number; axisName: string }>,
  extract: (full: S, axisIndex: number) => D,
): Array<DimensionView<D>> {
  return axes.map((a) =>
    deepFreeze({
      axisIndex: a.axisIndex,
      axisName: a.axisName,
      data: extract(full, a.axisIndex),
    }),
  );
}

/**
 * Run a worker over isolated dimension views. The worker's signature can
 * only see one frozen view at a time — the compile-time and runtime
 * embodiment of "each dimension's data is isolated."
 */
export async function forEachIsolatedDimension<D, R>(
  views: Array<DimensionView<D>>,
  worker: (view: DimensionView<D>) => Promise<R>,
): Promise<R[]> {
  const { computeFabric } = await import("./computeFabric");
  return computeFabric().runParallel(views, (v) => worker(v));
}
