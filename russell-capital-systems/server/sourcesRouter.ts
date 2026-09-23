// ============================================================
// SOURCES ROUTER — "where every number comes from", as data.
//   sources.all   public   every versioned rule set, the retirement-limits
//                          notice, the tax authority panel, the live feed
//                          benchmarks with their configuration state, and
//                          the latest verification outcome per engine.
//
// WHY. The site's rule is that every figure carries a source and an as-of.
// A page that lists them is the proof of that rule; the builder's overlap
// check names it as gap G6. Nothing here is computed: it is the registries
// read back, so it cannot disagree with the calculators.
// ============================================================
import { publicProcedure, router } from "./_core/trpc";
import { TAX_RULE_VERSIONS } from "@shared/taxRules";
import { LIMITS_SOURCE, RETIREMENT_LIMITS_2026, isStale, staleNote } from "@shared/retirementLimits";
import { TAX_SOURCES } from "./taxSources";
import { getRateBenchmarks } from "./dataFeedService";
import { fredConfigured } from "./_core/fred";
import { recentHiveEvents } from "./hiveMemoryDb";
import { buildHiveContext } from "@shared/hiveContext";
import { HIVE_VERIFIERS } from "./hiveMind";

export const SYSTEM_USER_ID = 0;

export const sourcesRouter = router({
  all: publicProcedure.query(async () => {
    const now = new Date();
    const benchmarks = await getRateBenchmarks().catch(() => []);
    const verification = buildHiveContext(await recentHiveEvents(SYSTEM_USER_ID, 200)).verifications;
    const byEngine = new Map(verification.map((v) => [v.engine, v]));
    return {
      generatedAt: now.toISOString(),
      taxRules: TAX_RULE_VERSIONS.map((r) => ({
        version: r.version, taxYear: r.taxYear, source: r.source, effectiveFrom: r.effectiveFrom,
        socialSecurity: { wageBase: r.socialSecurity.wageBase, cola: r.socialSecurity.cola, source: r.socialSecurity.source },
        current: r.taxYear === now.getFullYear(),
      })),
      retirementLimits: { ...LIMITS_SOURCE, count: RETIREMENT_LIMITS_2026.length, stale: isStale(now), note: staleNote(now) },
      taxAuthorities: TAX_SOURCES.map((s) => ({ id: s.id, name: s.name, org: s.org, url: s.url, publishes: s.publishes, method: s.method })),
      liveFeeds: { fredConfigured: fredConfigured(), benchmarks },
      verifiers: HIVE_VERIFIERS.map((engine) => ({ engine, outcome: byEngine.get(engine)?.outcome ?? "unverified", at: byEngine.get(engine)?.at ?? null })),
    };
  }),
});
