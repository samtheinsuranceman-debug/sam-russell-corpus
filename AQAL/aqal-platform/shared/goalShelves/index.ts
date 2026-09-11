// The goal shelves, merged. Each shelf is one file exporting SECTIONS (section
// number → topic label) and CLUSTERS. This index builds the three maps the
// Research Library page needs and the flat cluster list the adapter merges.
import { GOAL_SHELF_META, GOAL_SHELF_BY_KEY, type GoalKey, type GoalShelfCluster } from "./types";
import * as marriage from "./marriage";
import * as parenting from "./parenting";
import * as debt from "./debt";
import * as happiness from "./happiness";
import * as retirement from "./retirement";
import * as business from "./business";
import * as hobby from "./hobby";
import * as educationCareer from "./educationCareer";
import * as partner from "./partner";
import * as home from "./home";
import * as travel from "./travel";
import * as familyTime from "./familyTime";
import * as legacy from "./legacy";
import * as healthEnergyBeauty from "./healthEnergyBeauty";
import * as athlete from "./athlete";

type ShelfModule = { SECTIONS: Record<string, string>; CLUSTERS: GoalShelfCluster[] };

export const GOAL_SHELF_MODULES: Record<GoalKey, ShelfModule> = {
  "marriage": marriage,
  "parenting": parenting,
  "debt": debt,
  "happiness": happiness,
  "retirement": retirement,
  "business": business,
  "hobby": hobby,
  "education-career": educationCareer,
  "partner": partner,
  "home": home,
  "travel": travel,
  "family-time": familyTime,
  "legacy": legacy,
  "health-energy-beauty": healthEnergyBeauty,
  "athlete": athlete,
};

export const GOAL_GROUP = "Goal shelves — protocols for the twelve goals people actually name";

// Long labels ("8001 · Marriage — Fairness at Home") and short labels
// ("Marriage: Fairness at Home"), keyed by section number, in shelf order.
export const GOAL_SECTIONS: Record<string, string> = {};
export const GOAL_SECTION_SHORT: Record<string, string> = {};
export const GOAL_SECTION_ORDER: string[] = [];
export const GOAL_SECTION_GOAL: Record<string, GoalKey> = {};
export const GOAL_EVIDENCE: GoalShelfCluster[] = [];

for (const meta of GOAL_SHELF_META) {
  const mod = GOAL_SHELF_MODULES[meta.key];
  for (const key of Object.keys(mod.SECTIONS).sort((a, b) => Number(a) - Number(b))) {
    GOAL_SECTIONS[key] = `${key} · ${meta.short} — ${mod.SECTIONS[key]}`;
    GOAL_SECTION_SHORT[key] = `${meta.short}: ${mod.SECTIONS[key]}`;
    GOAL_SECTION_ORDER.push(key);
    GOAL_SECTION_GOAL[key] = meta.key;
  }
  GOAL_EVIDENCE.push(...mod.CLUSTERS);
}

export function shelfClusters(goal: GoalKey): GoalShelfCluster[] {
  return GOAL_SHELF_MODULES[goal].CLUSTERS;
}

export { GOAL_SHELF_META, GOAL_SHELF_BY_KEY };
export type { GoalKey, GoalShelfCluster };
