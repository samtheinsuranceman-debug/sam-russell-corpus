import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { FORCES, HORIZONS, outsideStatus, readAllForces, readForce, weightedSources } from "./outsideForces";

export const outsideForcesRouter = router({
  /** The registry: forces, their series and their weighted source panels. No network. */
  registry: publicProcedure.query(() => ({
    horizons: HORIZONS,
    forces: FORCES.map((f) => ({ id: f.id, title: f.title, question: f.question, caveat: f.caveat, series: f.series, sources: weightedSources(f) })),
  })),
  /** Every force read live (or from the last-good snapshot). */
  all: protectedProcedure.query(async () => ({ horizons: HORIZONS, forces: await readAllForces() })),
  one: protectedProcedure.input(z.object({ id: z.enum(["prices", "fiat", "home", "credit", "debt", "cars", "travel"]) })).query(async ({ input }) => {
    const f = FORCES.find((x) => x.id === input.id)!;
    return { horizons: HORIZONS, force: await readForce(f) };
  }),
  /** Public: which feeds answered and their as-of dates. */
  status: publicProcedure.query(() => outsideStatus()),
});
