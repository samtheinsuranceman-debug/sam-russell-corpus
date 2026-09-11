// The goal shelves, merged. Each shelf is one file exporting SECTIONS (section
// number → topic label) and CLUSTERS. This index builds the three maps the
// Research Library page needs and the flat cluster list the adapter merges.
import { GOAL_SHELF_META, GOAL_SHELF_BY_KEY, type GoalKey, type GoalShelfCluster } from "./types";
import * as marriage from "./marriage";
import * as marriageW2 from "./wave2/marriage";
import * as marriageW3 from "./wave3/marriage";
import * as parenting from "./parenting";
import * as parentingW2 from "./wave2/parenting";
import * as parentingW3 from "./wave3/parenting";
import * as debt from "./debt";
import * as debtW2 from "./wave2/debt";
import * as debtW3 from "./wave3/debt";
import * as happiness from "./happiness";
import * as happinessW2 from "./wave2/happiness";
import * as happinessW3 from "./wave3/happiness";
import * as retirement from "./retirement";
import * as retirementW2 from "./wave2/retirement";
import * as retirementW3 from "./wave3/retirement";
import * as business from "./business";
import * as businessW2 from "./wave2/business";
import * as businessW3 from "./wave3/business";
import * as hobby from "./hobby";
import * as hobbyW2 from "./wave2/hobby";
import * as hobbyW3 from "./wave3/hobby";
import * as educationCareer from "./educationCareer";
import * as educationCareerW2 from "./wave2/educationCareer";
import * as educationCareerW3 from "./wave3/educationCareer";
import * as partner from "./partner";
import * as partnerW2 from "./wave2/partner";
import * as partnerW3 from "./wave3/partner";
import * as home from "./home";
import * as homeW2 from "./wave2/home";
import * as homeW3 from "./wave3/home";
import * as travel from "./travel";
import * as travelW2 from "./wave2/travel";
import * as travelW3 from "./wave3/travel";
import * as familyTime from "./familyTime";
import * as familyTimeW2 from "./wave2/familyTime";
import * as familyTimeW3 from "./wave3/familyTime";
import * as legacy from "./legacy";
import * as legacyW2 from "./wave2/legacy";
import * as legacyW3 from "./wave3/legacy";
import * as healthEnergyBeauty from "./healthEnergyBeauty";
import * as healthEnergyBeautyW2 from "./wave2/healthEnergyBeauty";
import * as healthEnergyBeautyW3 from "./wave3/healthEnergyBeauty";
import * as athlete from "./athlete";
import * as athleteW2 from "./wave2/athlete";
import * as athleteW3 from "./wave3/athlete";

type ShelfModule = { SECTIONS: Record<string, string>; CLUSTERS: GoalShelfCluster[] };

// A shelf is authored in waves — wave 1 (base..base+49, with the read-me
// section), wave 2 (base+50..base+99) and wave 3 (the shelf's extra block,
// 10000+) — kept as separate files so waves can be researched in parallel
// without touching each other's file.
const merge = (...mods: ShelfModule[]): ShelfModule => ({
  SECTIONS: Object.assign({}, ...mods.map((m) => m.SECTIONS)),
  CLUSTERS: mods.flatMap((m) => m.CLUSTERS),
});

export const GOAL_SHELF_MODULES: Record<GoalKey, ShelfModule> = {
  "marriage": merge(marriage, marriageW2, marriageW3),
  "parenting": merge(parenting, parentingW2, parentingW3),
  "debt": merge(debt, debtW2, debtW3),
  "happiness": merge(happiness, happinessW2, happinessW3),
  "retirement": merge(retirement, retirementW2, retirementW3),
  "business": merge(business, businessW2, businessW3),
  "hobby": merge(hobby, hobbyW2, hobbyW3),
  "education-career": merge(educationCareer, educationCareerW2, educationCareerW3),
  "partner": merge(partner, partnerW2, partnerW3),
  "home": merge(home, homeW2, homeW3),
  "travel": merge(travel, travelW2, travelW3),
  "family-time": merge(familyTime, familyTimeW2, familyTimeW3),
  "legacy": merge(legacy, legacyW2, legacyW3),
  "health-energy-beauty": merge(healthEnergyBeauty, healthEnergyBeautyW2, healthEnergyBeautyW3),
  "athlete": merge(athlete, athleteW2, athleteW3),
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
