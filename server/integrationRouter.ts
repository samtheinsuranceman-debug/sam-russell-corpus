// ============================================================
// THE INTEGRATION SCORECARD — tRPC. Runs the audit against the deployed code
// and merges the hand ratings, so the page shows how wired each page IS
// beside how much it is WORTH. Protected: it exposes file structure.
// ============================================================
import { protectedProcedure, router } from "./_core/trpc";
import { auditCatalogue, auditSummary, DIMENSION_WEIGHT, DIMENSION_LABEL } from "./integrationAudit";
import { PAGE_RATINGS, RATED_COUNT } from "@shared/pageRatings";

export const integrationRouter = router({
  scorecard: protectedProcedure.query(() => {
    const audits = auditCatalogue();
    const summary = auditSummary(audits);
    const ratings = new Map(PAGE_RATINGS.map((r) => [r.path, r]));
    return {
      summary,
      weights: DIMENSION_WEIGHT,
      labels: DIMENSION_LABEL,
      ratedCount: RATED_COUNT,
      pages: audits.map((a) => ({ ...a, rating: ratings.get(a.path) ?? null })),
    };
  }),
});
