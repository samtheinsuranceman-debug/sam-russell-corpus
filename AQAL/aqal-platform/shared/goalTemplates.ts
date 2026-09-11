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
    key: "longevity", label: "Live longer, healthier",
    keywords: ["longevity", "live longer", "live to", "healthspan", "lifespan", "anti-aging", "antiaging", "aging", "ageing", "biological age", "100"],
    baselineMonths: 24, minMonthlyHours: 25,
    stages: [
      "Numbers on the table: ApoB or LDL, blood pressure, VO₂max estimate, grip strength, sleep hours",
      "The four movers running weekly: aerobic base, two strength sessions, 7–9h sleep, no tobacco",
      "Lipids and blood pressure at target with a clinician (or a plan to get there)",
      "One evidence-backed addition kept 90 days (the Research Library longevity shelf says which have human trials)",
      "Twelve months of logged effort and a re-measure of every number",
    ],
  },
  {
    key: "parenting", label: "Be a better parent",
    keywords: ["parent", "parenting", "dad", "mom", "toddler", "teenager", "raise my", "raising", "my kids", "my children", "memories"],
    baselineMonths: 12, minMonthlyHours: 20,
    stages: [
      "One daily ritual of undivided attention held for 30 days (reading, a walk, dinner without screens)",
      "Warmth-plus-structure routines in place: sleep, meals, chores, limits explained",
      "A repair habit — you name your own mistakes to your child and make it right",
      "Each child has one activity and one adult mentor beyond you",
      "A year of logged rituals, and the memories you set out to make are made",
    ],
  },
  {
    key: "debt", label: "Get out of debt",
    keywords: ["debt", "credit card", "pay off", "payoff", "owe", "loan", "collections", "bankrupt"],
    baselineMonths: 30, minMonthlyHours: 6,
    stages: [
      "Every balance, rate and minimum on one page; spending tracked for 30 days",
      "Automatic payments above the minimum, ordered by rate (or smallest balance if you need the wins)",
      "First account closed out",
      "Half the total gone and a $1,000 buffer held",
      "Debt-free, and the payment redirected to savings for 90 days",
    ],
  },
  {
    key: "happiness", label: "Be happy — wellbeing that lasts",
    keywords: ["happy", "happiness", "wellbeing", "well-being", "joy", "content", "fulfilled", "peace", "depress", "anxious", "lonely"],
    baselineMonths: 6, minMonthlyHours: 15,
    stages: [
      "Sleep, movement and one real conversation a day — the floor, held for 30 days",
      "One evidence-based practice (gratitude, savoring, kindness or behavioral activation) logged daily",
      "A weekly commitment that serves someone else",
      "A meaning statement written and one big decision aligned to it",
      "Ninety days of logged practice and a re-rated life satisfaction",
    ],
  },
  {
    key: "hobby", label: "Pick up a new hobby or skill",
    keywords: ["hobby", "skill", "learn to", "instrument", "guitar", "piano", "language", "chess", "paint", "craft", "garden", "cook", "woodwork"],
    baselineMonths: 9, minMonthlyHours: 12,
    stages: [
      "Gear in hand and a fixed practice slot on the calendar",
      "Twenty sessions logged (the habit exists)",
      "First real product or performance — a song, a dish, a piece, a conversation",
      "A teacher, class or group you meet regularly",
      "Six months in and the hobby is part of the week without effort",
    ],
  },
  {
    key: "college", label: "Graduate college and find the right career",
    keywords: ["college", "degree", "graduate", "university", "school", "semester", "gpa", "major", "vocation"],
    baselineMonths: 48, minMonthlyHours: 60,
    stages: [
      "Enrolled, funded for the year, and a study system that uses retrieval practice and spacing",
      "First full term passed with every course",
      "A field chosen by interest fit and a mentor in it",
      "Internship or real work in the field done",
      "Graduated, and an offer or a next step in hand",
    ],
  },
  {
    key: "family-time", label: "More time with family, kids and parents",
    keywords: ["time with", "family time", "quality time", "grandparent", "grandkids", "aging parent", "elderly parent", "presence", "work-life", "work life"],
    baselineMonths: 6, minMonthlyHours: 20,
    stages: [
      "The hours counted: where the week actually goes",
      "Family dinner or one protected ritual at least four nights a week, phones away",
      "One boundary at work that gives back an evening or a morning",
      "A monthly day with the wider family or a parent, on the calendar a year ahead",
      "Ninety days held and the family says they feel it",
    ],
  },
  {
    key: "legacy", label: "Memorialize a life in meaningful ways",
    keywords: ["legacy", "memorial", "memoir", "life story", "heirloom", "letters to", "leave behind", "generativity", "remembered"],
    baselineMonths: 12, minMonthlyHours: 8,
    stages: [
      "The list of what matters: people, stories, values, things",
      "Life-review conversations recorded (audio or written), one a week",
      "A legacy letter or ethical will drafted for each person who matters",
      "The practical side done with a professional: will, directives, beneficiaries",
      "The memoir, album or archive finished and given",
    ],
  },
  {
    key: "beauty-energy", label: "Health, energy and beauty for as long as possible",
    keywords: ["energy", "beauty", "skin", "hair", "look younger", "vitality", "tired", "fatigue", "glow"],
    baselineMonths: 6, minMonthlyHours: 20,
    stages: [
      "Sleep regular, daily sunscreen, no tobacco — the floor held for 30 days",
      "Resistance training twice a week and a diet built on whole foods",
      "Skin, hair and dental routines from the shelf's trial-backed list, kept 90 days",
      "Labs and a clinician's review of anything that drains energy (iron, thyroid, sleep apnea)",
      "Six months in: photos, energy rating and strength all moved",
    ],
  },
  {
    key: "athlete", label: "Become a better athlete",
    keywords: ["athlete", "athletic", "race", "triathlon", "faster", "compete", "sport", "personal record", "5k", "10k", "half marathon"],
    baselineMonths: 12, minMonthlyHours: 30,
    stages: [
      "Baseline tested (a time trial, a lift, a jump) and a periodized plan written",
      "Twelve unbroken weeks of the plan, sleep extended, protein at target",
      "First competition or test done and reviewed",
      "Strength, mobility and injury-prevention work built into every week",
      "Season goal hit and a recovery block taken on purpose",
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
