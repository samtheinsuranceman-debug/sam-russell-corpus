// ============================================================
// SITE MAP ROUTER — mounted as `siteMap`.
//   siteMap.tree         public   the seven-tab tree derived from the manifest + catalogue
//   siteMap.visits       auth     this user's visited routes (what turns neon green)
//   siteMap.opened       auth     a page was opened from the map (memory: page_visit)
//   siteMap.markVisited  auth     the page was closed (← or X): green + memory: page_close
//   siteMap.deeper       public   the "go deeper" buttons for a route
// ============================================================
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deeperLinks, siteMapTree } from "@shared/siteMapTree";
import { markRouteVisited, recordHiveEvent, visitedRoutes } from "./hiveMemoryDb";
import { VISITED_NEON_FOREST_GREEN } from "@shared/hiveMind";

const pathSchema = z.string().min(1).max(200).regex(/^\//);

export const siteMapRouter = router({
  tree: publicProcedure.query(() => {
    const t = siteMapTree();
    return { tabs: t.tabs, routeCount: t.routeCount, visitedColor: VISITED_NEON_FOREST_GREEN };
  }),

  visits: protectedProcedure.query(async ({ ctx }) => {
    const visits = await visitedRoutes(ctx.user.id);
    return { visits, color: VISITED_NEON_FOREST_GREEN };
  }),

  opened: protectedProcedure
    .input(z.object({ routePath: pathSchema, fromMap: z.boolean().default(true) }))
    .mutation(async ({ ctx, input }) => {
      const title = siteMapTree().byPath[input.routePath]?.title;
      await recordHiveEvent(ctx.user.id, { kind: "page_visit", routePath: input.routePath, payload: { title, fromMap: input.fromMap } });
      return { ok: true };
    }),

  markVisited: protectedProcedure
    .input(z.object({ routePath: pathSchema }))
    .mutation(async ({ ctx, input }) => {
      const rec = await markRouteVisited(ctx.user.id, input.routePath);
      const title = siteMapTree().byPath[input.routePath]?.title;
      await recordHiveEvent(ctx.user.id, { kind: "page_close", routePath: input.routePath, payload: { title, visitCount: rec.visitCount } });
      return { ...rec, color: VISITED_NEON_FOREST_GREEN };
    }),

  deeper: publicProcedure
    .input(z.object({ routePath: pathSchema, limit: z.number().int().min(1).max(12).default(8) }))
    .query(({ input }) => deeperLinks(input.routePath, input.limit)),
});
