// ============================================================
// Goal protocols — the monthly tiered menu for the goal a member picked
// ============================================================
// The founder's spec: alongside the five-to-seven recommendations for a member's
// intelligences, the coach hands them five-to-seven for the ONE goal they chose
// this month — one or two fundamental, one or two moderate, one or two advanced,
// one or two elite — so the menu is diverse and every level has a next step.
// The picks rotate month by month (deterministic on the calendar month) so a
// member who keeps the same goal sees the shelf's breadth over a year, and a
// pick is never repeated until the tier has been exhausted.
import { GOAL_SHELF_META, GOAL_SHELF_BY_KEY, shelfClusters, type GoalKey, type GoalShelfCluster } from "./goalShelves/index";
import { GOAL_TIERS, TIER_LABEL, type GoalTier } from "./goalShelves/types";

export type GoalMenuPick = {
  tier: GoalTier;
  tierLabel: string;
  id: string;
  section: string;
  title: string;
  action: string;
  evidenceTag: GoalShelfCluster["evidenceTag"];
  magnitude: number;
  reinforcement: NonNullable<GoalShelfCluster["reinforcement"]>;
};

export type GoalMenu = {
  goal: GoalKey;
  label: string;
  monthKey: string;   // "2026-09"
  picks: GoalMenuPick[];
};

/** The shelf whose keywords best match a stated goal (most hits wins; ties go to shelf order). */
export function shelfForGoal(goalText: string): GoalKey | undefined {
  const t = (goalText || "").toLowerCase();
  if (!t.trim()) return undefined;
  let best: GoalKey | undefined;
  let bestHits = 0;
  for (const m of GOAL_SHELF_META) {
    const hits = m.keywords.filter((k) => t.includes(k)).length;
    if (hits > bestHits) { best = m.key; bestHits = hits; }
  }
  return best;
}

// A practice, not a verdict: floor-rated (debunked) clusters and the read-me
// cluster are shown on the shelf but never handed out as a monthly move.
function prescribable(c: GoalShelfCluster): boolean {
  return !!c.impact && c.impact.magnitude > 1 && !c.id.endsWith("-read-me-first");
}

function monthIndex(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

/**
 * The month's menu for a goal: `perTier` picks (1 or 2) from each tier, rotating
 * through the tier's clusters by calendar month. Tiers with fewer clusters than
 * `perTier` return what they have; an empty shelf returns no picks.
 */
export function goalMenuForMonth(goal: GoalKey, date = new Date(), perTier: 1 | 2 = 2): GoalMenu {
  const meta = GOAL_SHELF_BY_KEY[goal];
  const all = shelfClusters(goal).filter(prescribable);
  const mi = monthIndex(date);
  const picks: GoalMenuPick[] = [];
  for (const tier of GOAL_TIERS) {
    // Highest-leverage first within the tier, then a stable id order, so the
    // rotation is reproducible across builds.
    const pool = all
      .filter((c) => c.tier === tier)
      .sort((a, b) => (b.impact!.magnitude - a.impact!.magnitude) || a.id.localeCompare(b.id));
    if (!pool.length) continue;
    const n = Math.min(perTier, pool.length);
    const start = (mi * n) % pool.length;
    for (let i = 0; i < n; i++) {
      const c = pool[(start + i) % pool.length];
      picks.push({
        tier, tierLabel: TIER_LABEL[tier], id: c.id, section: c.section, title: c.title, action: c.action,
        evidenceTag: c.evidenceTag, magnitude: c.impact!.magnitude, reinforcement: c.reinforcement ?? [],
      });
    }
  }
  const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  return { goal, label: meta.label, monthKey, picks };
}

/** Convenience: the month's menu for a free-text goal, or undefined when no shelf matches. */
export function goalMenuForText(goalText: string, date = new Date(), perTier: 1 | 2 = 2): GoalMenu | undefined {
  const key = shelfForGoal(goalText);
  return key ? goalMenuForMonth(key, date, perTier) : undefined;
}

/** Plain-text rendering for the coach prompt and the mock report. */
export function goalMenuLines(menu: GoalMenu): string {
  return menu.picks
    .map((p) => `- [${p.tier}] ${p.title} (${p.evidenceTag}, leverage ${p.magnitude}/5; Library §${p.section}): ${p.action}`)
    .join("\n");
}
