// ============================================================
// GOAL TEMPLATES — staged requirement decompositions for common life goals
// ============================================================
// The founder's spec: every big goal is a staircase of requirement stages
// ("financial advisor → licenses → capital → pipeline"; "family → partner →
// trust → kids"). Templates cover the most-stated goals; anything unmatched
// gets the generic scaffold and the member edits the stages.
//
// baselineMonths = honest typical time at minMonthlyHours of real effort.
// These are starting estimates the clock adjusts from logged behavior —
// stated as estimates in the UI, never guarantees.

export type GoalTemplate = {
  key: string;
  label: string;
  keywords: string[]; // matched against the member's stated goal text
  baselineMonths: number;
  minMonthlyHours: number;
  stages: string[];
};

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    key: "own-business", label: "Start & run a business",
    keywords: ["business", "startup", "company", "entrepreneur", "founder", "self-employed"],
    baselineMonths: 36, minMonthlyHours: 40,
    stages: [
      "Pick the offer & the customer (validated by 10 real conversations)",
      "First paying customer",
      "Repeatable sales process (10+ customers)",
      "Replace half your income",
      "Full-time on the business, 6 months of runway",
    ],
  },
  {
    key: "family-kids", label: "Marriage & family",
    keywords: ["kids", "children", "family", "married", "marriage", "wife", "husband", "father", "mother", "grandkids"],
    baselineMonths: 48, minMonthlyHours: 20,
    stages: [
      "Actively meeting people (real hours, every month)",
      "Committed relationship",
      "Built trust — merged lives (living together / engaged)",
      "Married / partnered for life",
      "First child",
    ],
  },
  {
    key: "financial-advisor", label: "Become a licensed financial professional",
    keywords: ["financial advisor", "series 7", "series 65", "insurance license", "advisor"],
    baselineMonths: 24, minMonthlyHours: 30,
    stages: [
      "Pass licensing exams (Series / state insurance)",
      "Join a firm or broker-dealer",
      "First 25 clients",
      "$50K marketing/lead budget deployed",
      "Self-sustaining book of business",
    ],
  },
  {
    key: "write-book", label: "Write & publish a book",
    keywords: ["book", "write", "author", "publish", "novel", "memoir"],
    baselineMonths: 18, minMonthlyHours: 20,
    stages: [
      "Outline + first chapter",
      "Complete first draft",
      "Revised draft through beta readers",
      "Edited, designed, publication-ready",
      "Published & first 100 readers",
    ],
  },
  {
    key: "fitness-body", label: "Transform health & body",
    keywords: ["weight", "fit", "fitness", "muscle", "health", "shape", "marathon", "strong", "lose"],
    baselineMonths: 12, minMonthlyHours: 16,
    stages: [
      "Consistent training habit (4 weeks unbroken)",
      "Nutrition baseline locked in",
      "First measurable milestone (strength / distance / weight)",
      "Halfway to target",
      "Target reached & held for 90 days",
    ],
  },
  {
    key: "financial-freedom", label: "Financial freedom / retire",
    keywords: ["retire", "financial freedom", "passive income", "wealth", "million", "invest", "debt"],
    baselineMonths: 120, minMonthlyHours: 10,
    stages: [
      "Full financial picture on paper (net worth, burn, debts)",
      "Automatic savings/investing running monthly",
      "High-interest debt gone",
      "One year of expenses invested",
      "Work optional (25x annual expenses)",
    ],
  },
  {
    key: "career-change", label: "Change careers / land the role",
    keywords: ["career", "job", "promotion", "role", "industry", "switch"],
    baselineMonths: 12, minMonthlyHours: 15,
    stages: [
      "Target role & gap analysis (skills, credentials)",
      "Credential/skill gap closed",
      "Network inside the target field (10 real conversations)",
      "Interviews in progress",
      "Offer accepted",
    ],
  },
  {
    key: "home", label: "Buy a home",
    keywords: ["house", "home", "property", "mortgage", "real estate"],
    baselineMonths: 24, minMonthlyHours: 8,
    stages: [
      "Budget + mortgage pre-qualification",
      "Down payment fund at 25%",
      "Down payment fund complete",
      "Actively viewing / offers in",
      "Keys in hand",
    ],
  },
  {
    key: "relationship", label: "Find a life partner",
    keywords: ["partner", "girlfriend", "boyfriend", "relationship", "love", "date", "dating", "soulmate"],
    baselineMonths: 24, minMonthlyHours: 12,
    stages: [
      "Actively meeting people (logged hours, monthly)",
      "Dating with intention",
      "Exclusive relationship",
      "Six months of built trust",
      "Committed for the long term",
    ],
  },
  {
    key: "travel", label: "Travel goal",
    keywords: ["travel", "trip", "country", "world", "visit", "abroad"],
    baselineMonths: 12, minMonthlyHours: 5,
    stages: [
      "Destination list + budget",
      "Fund at 50%",
      "Fully funded & time blocked",
      "Booked",
      "Boarding pass scanned",
    ],
  },
];

export const GENERIC_TEMPLATE: GoalTemplate = {
  key: "custom", label: "Custom goal",
  keywords: [],
  baselineMonths: 24, minMonthlyHours: 10,
  stages: [
    "Define what done looks like (measurable)",
    "First real action taken",
    "Quarter of the way (first milestone)",
    "Halfway — the habit is holding",
    "Done — and held for 30 days",
  ],
};

/** Best template for a stated goal, by keyword hit count (generic if none). */
export function templateForGoal(title: string): GoalTemplate {
  const t = title.toLowerCase();
  let best = GENERIC_TEMPLATE;
  let bestHits = 0;
  for (const tpl of GOAL_TEMPLATES) {
    const hits = tpl.keywords.filter((k) => t.includes(k)).length;
    if (hits > bestHits) { best = tpl; bestHits = hits; }
  }
  return best;
}
