// ─── Landing Page Copy ────────────────────────────────────────────────────────
export const LANDING_COPY = {
  heroHeadline: "Adaptive Wellness Support for Adults",
  heroSubheadline: "Reflection, education, organization, and care preparation with clear boundaries",
  heroDescription:
    "Doctor Buddy helps adults organize thoughts, practice low-risk wellness skills, and prepare better questions for licensed professionals. The public edition does not diagnose, prescribe, or provide medical or psychotherapy services.",
  stats: [
    { value: "50", label: "Adaptive Support Engines", description: "User-directed reflection and decision tools" },
    { value: "3", label: "Communication Zones", description: "Style changes only—not professional identity" },
    { value: "18+", label: "Adult Public Edition", description: "Consumer wellness use" },
    { value: "0", label: "Targeted Health Ads", description: "Health data is not ad inventory" },
  ],
  conditionTicker: [],
  pricingTiers: [
    {
      name: "Doctor Buddy Membership",
      price: "$99",
      period: "/month",
      description: "Public wellness, reflection, education, organization, and care-preparation tools.",
      features: [
        "50-engine Adaptive Support Lab",
        "Wellness check-ins",
        "Private reflection journal",
        "AI education and reflection",
        "Research and care-preparation tools",
      ],
      cta: "Review Membership Terms",
      highlighted: true,
    },
  ],
  testimonials: [],
};

// ─── Life Events Library ──────────────────────────────────────────────────────
export interface LifeEvent {
  id: string;
  name: string;
  category: "family" | "health" | "career" | "trauma" | "achievement" | "relationship" | "loss" | "transition";
  icon: string;
  description: string;
  impactScores: { depression: number; anxiety: number; ptsd: number; substanceUse: number; bipolar: number; ocd: number };
  growthPotential: number;
  resilienceBoost: number;
  typicalAge: string;
  valence: "positive" | "negative" | "mixed";
}

export const LIFE_EVENTS: LifeEvent[] = [
  // Family
  { id: "birth-child", name: "Birth of a Child", category: "family", icon: "Baby", description: "Welcoming a new child into the family.", impactScores: { depression: 35, anxiety: 45, ptsd: 10, substanceUse: 10, bipolar: 30, ocd: 25 }, growthPotential: 85, resilienceBoost: 70, typicalAge: "25-40", valence: "mixed" },
  { id: "parent-death", name: "Parent's Death", category: "loss", icon: "HeartCrack", description: "Loss of a parent or primary caregiver.", impactScores: { depression: 80, anxiety: 60, ptsd: 55, substanceUse: 50, bipolar: 65, ocd: 40 }, growthPotential: 60, resilienceBoost: 55, typicalAge: "40-65", valence: "negative" },
  { id: "marriage", name: "Marriage", category: "family", icon: "Heart", description: "Entering into a committed marriage.", impactScores: { depression: 20, anxiety: 35, ptsd: 5, substanceUse: 15, bipolar: 25, ocd: 20 }, growthPotential: 80, resilienceBoost: 75, typicalAge: "25-35", valence: "positive" },
  { id: "divorce", name: "Divorce", category: "relationship", icon: "Unlink", description: "Legal dissolution of a marriage.", impactScores: { depression: 75, anxiety: 70, ptsd: 45, substanceUse: 60, bipolar: 70, ocd: 40 }, growthPotential: 55, resilienceBoost: 45, typicalAge: "30-50", valence: "negative" },
  { id: "baby-walking", name: "Child's First Steps", category: "family", icon: "Footprints", description: "Witnessing your child's developmental milestone.", impactScores: { depression: 5, anxiety: 10, ptsd: 0, substanceUse: 0, bipolar: 10, ocd: 5 }, growthPotential: 90, resilienceBoost: 80, typicalAge: "25-35", valence: "positive" },
  { id: "grandchild-birth", name: "Grandchild Born", category: "family", icon: "Star", description: "Becoming a grandparent.", impactScores: { depression: 10, anxiety: 15, ptsd: 0, substanceUse: 5, bipolar: 15, ocd: 10 }, growthPotential: 85, resilienceBoost: 75, typicalAge: "50-70", valence: "positive" },
  { id: "spouse-death", name: "Spouse's Death", category: "loss", icon: "HeartCrack", description: "Loss of a life partner.", impactScores: { depression: 90, anxiety: 75, ptsd: 70, substanceUse: 65, bipolar: 80, ocd: 50 }, growthPotential: 50, resilienceBoost: 40, typicalAge: "50-80", valence: "negative" },
  { id: "child-leaving", name: "Empty Nest", category: "transition", icon: "Home", description: "Children leaving home for independence.", impactScores: { depression: 45, anxiety: 40, ptsd: 10, substanceUse: 30, bipolar: 40, ocd: 25 }, growthPotential: 65, resilienceBoost: 55, typicalAge: "45-60", valence: "mixed" },
  { id: "adoption", name: "Adoption", category: "family", icon: "Users", description: "Adopting a child into the family.", impactScores: { depression: 25, anxiety: 50, ptsd: 10, substanceUse: 10, bipolar: 30, ocd: 30 }, growthPotential: 85, resilienceBoost: 70, typicalAge: "28-45", valence: "mixed" },
  { id: "miscarriage", name: "Miscarriage", category: "loss", icon: "HeartCrack", description: "Loss of a pregnancy.", impactScores: { depression: 75, anxiety: 65, ptsd: 60, substanceUse: 40, bipolar: 60, ocd: 35 }, growthPotential: 50, resilienceBoost: 45, typicalAge: "25-40", valence: "negative" },
  // Health
  { id: "cancer-diagnosis", name: "Cancer Diagnosis", category: "health", icon: "Activity", description: "Receiving a cancer diagnosis.", impactScores: { depression: 80, anxiety: 85, ptsd: 65, substanceUse: 45, bipolar: 60, ocd: 40 }, growthPotential: 70, resilienceBoost: 65, typicalAge: "any", valence: "negative" },
  { id: "quit-smoking", name: "Quit Smoking", category: "achievement", icon: "Wind", description: "Successfully quitting tobacco use.", impactScores: { depression: 30, anxiety: 40, ptsd: 5, substanceUse: 20, bipolar: 25, ocd: 15 }, growthPotential: 90, resilienceBoost: 85, typicalAge: "any", valence: "positive" },
  { id: "sobriety-milestone", name: "Sobriety Milestone", category: "achievement", icon: "Award", description: "Reaching a significant sobriety anniversary.", impactScores: { depression: 20, anxiety: 30, ptsd: 15, substanceUse: 10, bipolar: 20, ocd: 10 }, growthPotential: 95, resilienceBoost: 90, typicalAge: "any", valence: "positive" },
  { id: "chronic-illness", name: "Chronic Illness Diagnosis", category: "health", icon: "Stethoscope", description: "Diagnosed with a long-term medical condition.", impactScores: { depression: 70, anxiety: 75, ptsd: 40, substanceUse: 40, bipolar: 55, ocd: 35 }, growthPotential: 60, resilienceBoost: 55, typicalAge: "any", valence: "negative" },
  { id: "surgery", name: "Major Surgery", category: "health", icon: "Scissors", description: "Undergoing a significant surgical procedure.", impactScores: { depression: 50, anxiety: 65, ptsd: 45, substanceUse: 35, bipolar: 45, ocd: 30 }, growthPotential: 55, resilienceBoost: 50, typicalAge: "any", valence: "mixed" },
  { id: "addiction-relapse", name: "Addiction Relapse", category: "health", icon: "RefreshCw", description: "Returning to substance use after a period of sobriety.", impactScores: { depression: 75, anxiety: 70, ptsd: 50, substanceUse: 90, bipolar: 70, ocd: 40 }, growthPotential: 60, resilienceBoost: 40, typicalAge: "any", valence: "negative" },
  { id: "weight-loss", name: "Significant Weight Loss", category: "achievement", icon: "TrendingDown", description: "Achieving meaningful weight loss goals.", impactScores: { depression: 15, anxiety: 20, ptsd: 5, substanceUse: 10, bipolar: 15, ocd: 10 }, growthPotential: 85, resilienceBoost: 80, typicalAge: "any", valence: "positive" },
  { id: "near-death", name: "Near-Death Experience", category: "trauma", icon: "Zap", description: "Surviving a life-threatening situation.", impactScores: { depression: 60, anxiety: 75, ptsd: 85, substanceUse: 50, bipolar: 55, ocd: 45 }, growthPotential: 75, resilienceBoost: 65, typicalAge: "any", valence: "mixed" },
  // Career
  { id: "job-loss", name: "Job Loss", category: "career", icon: "Briefcase", description: "Unexpected unemployment or layoff.", impactScores: { depression: 70, anxiety: 75, ptsd: 30, substanceUse: 55, bipolar: 60, ocd: 35 }, growthPotential: 60, resilienceBoost: 50, typicalAge: "25-60", valence: "negative" },
  { id: "promotion", name: "Major Promotion", category: "career", icon: "TrendingUp", description: "Significant career advancement.", impactScores: { depression: 10, anxiety: 30, ptsd: 5, substanceUse: 10, bipolar: 35, ocd: 20 }, growthPotential: 85, resilienceBoost: 75, typicalAge: "25-55", valence: "positive" },
  { id: "retirement", name: "Retirement", category: "transition", icon: "Sunset", description: "Transitioning out of the workforce.", impactScores: { depression: 45, anxiety: 40, ptsd: 10, substanceUse: 35, bipolar: 40, ocd: 25 }, growthPotential: 70, resilienceBoost: 60, typicalAge: "60-70", valence: "mixed" },
  { id: "business-failure", name: "Business Failure", category: "career", icon: "XCircle", description: "Closure or bankruptcy of a business.", impactScores: { depression: 75, anxiety: 80, ptsd: 40, substanceUse: 60, bipolar: 65, ocd: 40 }, growthPotential: 65, resilienceBoost: 50, typicalAge: "30-55", valence: "negative" },
  { id: "start-business", name: "Start a Business", category: "career", icon: "Rocket", description: "Launching an entrepreneurial venture.", impactScores: { depression: 20, anxiety: 55, ptsd: 5, substanceUse: 15, bipolar: 45, ocd: 25 }, growthPotential: 90, resilienceBoost: 75, typicalAge: "25-50", valence: "mixed" },
  { id: "bankruptcy", name: "Bankruptcy", category: "career", icon: "AlertTriangle", description: "Filing for financial bankruptcy.", impactScores: { depression: 80, anxiety: 85, ptsd: 45, substanceUse: 65, bipolar: 70, ocd: 45 }, growthPotential: 55, resilienceBoost: 40, typicalAge: "30-60", valence: "negative" },
  // Trauma
  { id: "assault", name: "Physical Assault", category: "trauma", icon: "ShieldAlert", description: "Experiencing physical violence.", impactScores: { depression: 75, anxiety: 80, ptsd: 90, substanceUse: 60, bipolar: 60, ocd: 50 }, growthPotential: 55, resilienceBoost: 45, typicalAge: "any", valence: "negative" },
  { id: "natural-disaster", name: "Natural Disaster", category: "trauma", icon: "CloudLightning", description: "Surviving a natural disaster event.", impactScores: { depression: 60, anxiety: 70, ptsd: 75, substanceUse: 45, bipolar: 50, ocd: 40 }, growthPotential: 65, resilienceBoost: 60, typicalAge: "any", valence: "negative" },
  { id: "domestic-violence", name: "Domestic Violence", category: "trauma", icon: "AlertOctagon", description: "Experiencing intimate partner violence.", impactScores: { depression: 85, anxiety: 85, ptsd: 90, substanceUse: 65, bipolar: 70, ocd: 55 }, growthPotential: 55, resilienceBoost: 40, typicalAge: "any", valence: "negative" },
  { id: "accident", name: "Serious Accident", category: "trauma", icon: "Car", description: "Involvement in a serious accident.", impactScores: { depression: 55, anxiety: 65, ptsd: 70, substanceUse: 40, bipolar: 45, ocd: 35 }, growthPotential: 60, resilienceBoost: 55, typicalAge: "any", valence: "negative" },
  { id: "abuse-childhood", name: "Childhood Abuse", category: "trauma", icon: "Shield", description: "History of childhood abuse or neglect.", impactScores: { depression: 85, anxiety: 80, ptsd: 90, substanceUse: 70, bipolar: 75, ocd: 65 }, growthPotential: 65, resilienceBoost: 50, typicalAge: "any", valence: "negative" },
  { id: "suicide-attempt", name: "Survived Suicide Attempt", category: "trauma", icon: "Heart", description: "Surviving a personal suicide attempt.", impactScores: { depression: 90, anxiety: 80, ptsd: 75, substanceUse: 70, bipolar: 80, ocd: 50 }, growthPotential: 70, resilienceBoost: 60, typicalAge: "any", valence: "mixed" },
  // Achievement
  { id: "graduation", name: "Graduation", category: "achievement", icon: "GraduationCap", description: "Completing an educational degree.", impactScores: { depression: 10, anxiety: 25, ptsd: 5, substanceUse: 15, bipolar: 20, ocd: 15 }, growthPotential: 90, resilienceBoost: 80, typicalAge: "18-30", valence: "positive" },
  { id: "publish-book", name: "Publishing a Book", category: "achievement", icon: "BookOpen", description: "Successfully publishing a written work.", impactScores: { depression: 5, anxiety: 20, ptsd: 0, substanceUse: 5, bipolar: 25, ocd: 15 }, growthPotential: 90, resilienceBoost: 80, typicalAge: "any", valence: "positive" },
  { id: "therapy-breakthrough", name: "Therapy Breakthrough", category: "achievement", icon: "Lightbulb", description: "A major insight or healing moment in therapy.", impactScores: { depression: 15, anxiety: 15, ptsd: 20, substanceUse: 15, bipolar: 15, ocd: 20 }, growthPotential: 95, resilienceBoost: 90, typicalAge: "any", valence: "positive" },
  { id: "spiritual-awakening", name: "Spiritual Awakening", category: "achievement", icon: "Sparkles", description: "A profound spiritual or existential transformation.", impactScores: { depression: 20, anxiety: 20, ptsd: 15, substanceUse: 15, bipolar: 30, ocd: 15 }, growthPotential: 90, resilienceBoost: 85, typicalAge: "any", valence: "positive" },
  { id: "new-home", name: "Buying First Home", category: "achievement", icon: "Home", description: "Purchasing a first home.", impactScores: { depression: 10, anxiety: 40, ptsd: 5, substanceUse: 10, bipolar: 25, ocd: 20 }, growthPotential: 80, resilienceBoost: 70, typicalAge: "25-40", valence: "positive" },
  // Relationship
  { id: "first-heartbreak", name: "First Heartbreak", category: "relationship", icon: "HeartCrack", description: "Experiencing a first significant romantic loss.", impactScores: { depression: 60, anxiety: 50, ptsd: 20, substanceUse: 35, bipolar: 50, ocd: 30 }, growthPotential: 75, resilienceBoost: 65, typicalAge: "15-25", valence: "negative" },
  { id: "first-love", name: "First Love", category: "relationship", icon: "Heart", description: "Experiencing first romantic love.", impactScores: { depression: 5, anxiety: 20, ptsd: 0, substanceUse: 10, bipolar: 30, ocd: 10 }, growthPotential: 85, resilienceBoost: 75, typicalAge: "14-22", valence: "positive" },
  { id: "coming-out", name: "Coming Out", category: "transition", icon: "Rainbow", description: "Disclosing LGBTQ+ identity to others.", impactScores: { depression: 40, anxiety: 55, ptsd: 25, substanceUse: 30, bipolar: 35, ocd: 25 }, growthPotential: 90, resilienceBoost: 80, typicalAge: "15-35", valence: "mixed" },
  { id: "bullying", name: "Bullying / Harassment", category: "trauma", icon: "UserX", description: "Experiencing sustained bullying or harassment.", impactScores: { depression: 65, anxiety: 70, ptsd: 55, substanceUse: 40, bipolar: 55, ocd: 45 }, growthPotential: 60, resilienceBoost: 50, typicalAge: "8-25", valence: "negative" },
  { id: "relocation", name: "Major Relocation", category: "transition", icon: "MapPin", description: "Moving to a new city, state, or country.", impactScores: { depression: 40, anxiety: 50, ptsd: 15, substanceUse: 30, bipolar: 35, ocd: 25 }, growthPotential: 75, resilienceBoost: 65, typicalAge: "any", valence: "mixed" },
  { id: "military-deployment", name: "Military Deployment", category: "trauma", icon: "Shield", description: "Deployment to a combat or high-stress military zone.", impactScores: { depression: 65, anxiety: 70, ptsd: 85, substanceUse: 60, bipolar: 55, ocd: 45 }, growthPotential: 65, resilienceBoost: 70, typicalAge: "18-40", valence: "mixed" },
  { id: "incarceration", name: "Incarceration", category: "trauma", icon: "Lock", description: "Experiencing imprisonment.", impactScores: { depression: 80, anxiety: 75, ptsd: 70, substanceUse: 75, bipolar: 70, ocd: 50 }, growthPotential: 55, resilienceBoost: 40, typicalAge: "any", valence: "negative" },
  { id: "college-rejection", name: "College Rejection", category: "transition", icon: "XCircle", description: "Being rejected from a desired educational institution.", impactScores: { depression: 50, anxiety: 55, ptsd: 10, substanceUse: 30, bipolar: 40, ocd: 30 }, growthPotential: 65, resilienceBoost: 55, typicalAge: "17-22", valence: "negative" },
  { id: "college-acceptance", name: "College Acceptance", category: "achievement", icon: "CheckCircle", description: "Being accepted into a desired educational institution.", impactScores: { depression: 5, anxiety: 20, ptsd: 0, substanceUse: 15, bipolar: 20, ocd: 10 }, growthPotential: 90, resilienceBoost: 80, typicalAge: "17-22", valence: "positive" },
  { id: "pet-death", name: "Death of a Pet", category: "loss", icon: "PawPrint", description: "Losing a beloved animal companion.", impactScores: { depression: 45, anxiety: 30, ptsd: 20, substanceUse: 20, bipolar: 35, ocd: 20 }, growthPotential: 50, resilienceBoost: 45, typicalAge: "any", valence: "negative" },
  { id: "parent-dementia", name: "Parent with Dementia", category: "health", icon: "Brain", description: "Caring for a parent with dementia or Alzheimer's.", impactScores: { depression: 70, anxiety: 65, ptsd: 40, substanceUse: 45, bipolar: 55, ocd: 35 }, growthPotential: 60, resilienceBoost: 55, typicalAge: "40-65", valence: "negative" },
  { id: "infertility", name: "Infertility Diagnosis", category: "health", icon: "AlertCircle", description: "Receiving an infertility diagnosis.", impactScores: { depression: 70, anxiety: 65, ptsd: 35, substanceUse: 35, bipolar: 55, ocd: 30 }, growthPotential: 60, resilienceBoost: 50, typicalAge: "25-45", valence: "negative" },
  { id: "immigration", name: "Immigration", category: "transition", icon: "Globe", description: "Moving to a new country.", impactScores: { depression: 50, anxiety: 60, ptsd: 30, substanceUse: 35, bipolar: 40, ocd: 30 }, growthPotential: 80, resilienceBoost: 70, typicalAge: "any", valence: "mixed" },
  { id: "abuse-disclosure", name: "Abuse Disclosure", category: "achievement", icon: "MessageCircle", description: "Disclosing past abuse to others for the first time.", impactScores: { depression: 50, anxiety: 60, ptsd: 55, substanceUse: 30, bipolar: 45, ocd: 35 }, growthPotential: 85, resilienceBoost: 75, typicalAge: "any", valence: "mixed" },
  { id: "school-failure", name: "Academic Failure", category: "career", icon: "BookX", description: "Failing a grade or being expelled from school.", impactScores: { depression: 60, anxiety: 65, ptsd: 20, substanceUse: 45, bipolar: 50, ocd: 35 }, growthPotential: 60, resilienceBoost: 50, typicalAge: "8-25", valence: "negative" },
  { id: "winning-award", name: "Major Award / Recognition", category: "achievement", icon: "Trophy", description: "Receiving significant public recognition.", impactScores: { depression: 5, anxiety: 15, ptsd: 0, substanceUse: 5, bipolar: 30, ocd: 10 }, growthPotential: 90, resilienceBoost: 80, typicalAge: "any", valence: "positive" },
  { id: "learning-disability", name: "Learning Disability Diagnosis", category: "health", icon: "BookOpen", description: "Receiving a learning disability diagnosis.", impactScores: { depression: 45, anxiety: 50, ptsd: 15, substanceUse: 25, bipolar: 35, ocd: 30 }, growthPotential: 70, resilienceBoost: 65, typicalAge: "5-25", valence: "mixed" },
  { id: "autism-diagnosis", name: "Autism Diagnosis", category: "health", icon: "Puzzle", description: "Receiving an autism spectrum disorder diagnosis.", impactScores: { depression: 40, anxiety: 55, ptsd: 15, substanceUse: 20, bipolar: 30, ocd: 40 }, growthPotential: 80, resilienceBoost: 70, typicalAge: "any", valence: "mixed" },
];

// ─── Life Maps Conditions ─────────────────────────────────────────────────────
export interface LifeMilestone {
  age: number;
  qualityOfLife: number;
  careerStatus: string;
  relationshipStatus: string;
  healthStatus: string;
  financialStatus: string;
  keyEvent: string;
  riskLevel: "low" | "moderate" | "high" | "critical";
  narrative?: string;
}

export interface LifeMapCondition {
  id: string;
  name: string;
  category: string;
  treated: { milestones: LifeMilestone[] };
  untreated: { milestones: LifeMilestone[] };
}

export const LIFE_MAP_CONDITIONS: LifeMapCondition[] = [
  {
    id: "mdd",
    name: "Major Depressive Disorder",
    category: "Mood Disorders",
    treated: {
      milestones: [
        { age: 15, qualityOfLife: 55, careerStatus: "Struggling in school", relationshipStatus: "Withdrawn from peers", healthStatus: "Depressive episodes", financialStatus: "Dependent", keyEvent: "Diagnosis and therapy begins", riskLevel: "moderate" },
        { age: 20, qualityOfLife: 68, careerStatus: "College with accommodations", relationshipStatus: "Building friendships", healthStatus: "Medication stabilizing", financialStatus: "Student loans", keyEvent: "Finds effective medication", riskLevel: "moderate" },
        { age: 25, qualityOfLife: 75, careerStatus: "Entry-level career", relationshipStatus: "First stable relationship", healthStatus: "Managed with therapy", financialStatus: "Entry income", keyEvent: "Graduates, starts career", riskLevel: "low" },
        { age: 30, qualityOfLife: 80, careerStatus: "Mid-level professional", relationshipStatus: "Long-term partnership", healthStatus: "Occasional episodes managed", financialStatus: "Stable savings", keyEvent: "Marriage and career growth", riskLevel: "low" },
        { age: 35, qualityOfLife: 82, careerStatus: "Senior role", relationshipStatus: "Family established", healthStatus: "Resilient, therapy maintenance", financialStatus: "Home ownership", keyEvent: "Promotion and family milestones", riskLevel: "low" },
        { age: 40, qualityOfLife: 80, careerStatus: "Leadership position", relationshipStatus: "Strong family bonds", healthStatus: "Occasional stress episodes", financialStatus: "Investments growing", keyEvent: "Career peak, parenting challenges", riskLevel: "low" },
        { age: 50, qualityOfLife: 78, careerStatus: "Executive level", relationshipStatus: "Stable partnership", healthStatus: "Managed chronic condition", financialStatus: "Retirement planning", keyEvent: "Children leave home, refocuses", riskLevel: "low" },
        { age: 60, qualityOfLife: 75, careerStatus: "Winding down career", relationshipStatus: "Grandchildren arriving", healthStatus: "Age-related + managed MDD", financialStatus: "Comfortable retirement", keyEvent: "Retirement planning, grandchildren", riskLevel: "low" },
        { age: 70, qualityOfLife: 72, careerStatus: "Retired", relationshipStatus: "Close family network", healthStatus: "Well-managed, active life", financialStatus: "Secure retirement", keyEvent: "Active retirement, community involvement", riskLevel: "low" },
        { age: 80, qualityOfLife: 68, careerStatus: "Retired", relationshipStatus: "Cherished family bonds", healthStatus: "Aging with dignity", financialStatus: "Legacy planning", keyEvent: "Reflects on full, meaningful life", riskLevel: "low" },
      ],
    },
    untreated: {
      milestones: [
        { age: 15, qualityOfLife: 35, careerStatus: "Failing classes", relationshipStatus: "Isolated, no friends", healthStatus: "Severe depression", financialStatus: "Dependent", keyEvent: "Drops out of activities", riskLevel: "high" },
        { age: 20, qualityOfLife: 28, careerStatus: "Dropped out of school", relationshipStatus: "No relationships", healthStatus: "Chronic severe depression", financialStatus: "Unemployed", keyEvent: "First hospitalization", riskLevel: "critical" },
        { age: 25, qualityOfLife: 32, careerStatus: "Minimum wage jobs", relationshipStatus: "Unstable relationships", healthStatus: "Self-medicating with alcohol", financialStatus: "Debt accumulating", keyEvent: "Substance use begins", riskLevel: "critical" },
        { age: 30, qualityOfLife: 30, careerStatus: "Frequent job loss", relationshipStatus: "Relationship failures", healthStatus: "Comorbid substance use", financialStatus: "Financial crisis", keyEvent: "Divorce, job loss", riskLevel: "critical" },
        { age: 35, qualityOfLife: 28, careerStatus: "Disability or gig work", relationshipStatus: "Isolated", healthStatus: "Multiple hospitalizations", financialStatus: "Poverty level", keyEvent: "Second hospitalization", riskLevel: "critical" },
        { age: 40, qualityOfLife: 25, careerStatus: "Disability benefits", relationshipStatus: "Estranged from family", healthStatus: "Chronic physical illness emerging", financialStatus: "Government assistance", keyEvent: "Physical health deteriorates", riskLevel: "critical" },
        { age: 50, qualityOfLife: 22, careerStatus: "Unable to work", relationshipStatus: "Severely isolated", healthStatus: "Cardiovascular disease, diabetes", financialStatus: "Poverty", keyEvent: "Major health crisis", riskLevel: "critical" },
        { age: 60, qualityOfLife: 20, careerStatus: "Disabled", relationshipStatus: "Alone", healthStatus: "Multiple comorbidities", financialStatus: "Dependent on state", keyEvent: "Nursing home consideration", riskLevel: "critical" },
        { age: 70, qualityOfLife: 18, careerStatus: "Disabled", relationshipStatus: "Estranged", healthStatus: "Severe decline", financialStatus: "State dependent", keyEvent: "Significant cognitive decline", riskLevel: "critical" },
        { age: 80, qualityOfLife: 15, careerStatus: "Disabled", relationshipStatus: "Alone", healthStatus: "End of life complications", financialStatus: "None", keyEvent: "Premature death risk elevated", riskLevel: "critical" },
      ],
    },
  },
  {
    id: "gad",
    name: "Generalized Anxiety Disorder",
    category: "Anxiety Disorders",
    treated: {
      milestones: [
        { age: 15, qualityOfLife: 58, careerStatus: "High achiever, stressed", relationshipStatus: "Selective friendships", healthStatus: "Anxiety managed with CBT", financialStatus: "Dependent", keyEvent: "CBT therapy begins", riskLevel: "moderate" },
        { age: 25, qualityOfLife: 74, careerStatus: "Successful career start", relationshipStatus: "Healthy relationships", healthStatus: "Medication + therapy", financialStatus: "Stable", keyEvent: "Therapy breakthrough", riskLevel: "low" },
        { age: 35, qualityOfLife: 79, careerStatus: "Senior professional", relationshipStatus: "Married with children", healthStatus: "Well-managed", financialStatus: "Comfortable", keyEvent: "Career and family flourish", riskLevel: "low" },
        { age: 50, qualityOfLife: 77, careerStatus: "Leadership role", relationshipStatus: "Strong family", healthStatus: "Occasional flares managed", financialStatus: "Retirement savings", keyEvent: "Career peak", riskLevel: "low" },
        { age: 70, qualityOfLife: 73, careerStatus: "Retired", relationshipStatus: "Grandchildren", healthStatus: "Active, managed anxiety", financialStatus: "Secure", keyEvent: "Fulfilling retirement", riskLevel: "low" },
      ],
    },
    untreated: {
      milestones: [
        { age: 15, qualityOfLife: 40, careerStatus: "Perfectionism, burnout", relationshipStatus: "Difficulty trusting others", healthStatus: "Chronic worry, insomnia", financialStatus: "Dependent", keyEvent: "School avoidance begins", riskLevel: "moderate" },
        { age: 25, qualityOfLife: 35, careerStatus: "Underperforming", relationshipStatus: "Relationship anxiety", healthStatus: "Panic attacks, IBS", financialStatus: "Unstable", keyEvent: "First panic disorder onset", riskLevel: "high" },
        { age: 35, qualityOfLife: 30, careerStatus: "Career stagnation", relationshipStatus: "Strained marriage", healthStatus: "Cardiovascular stress", financialStatus: "Financial anxiety", keyEvent: "Marriage strain, health issues", riskLevel: "high" },
        { age: 50, qualityOfLife: 28, careerStatus: "Early retirement forced", relationshipStatus: "Isolated", healthStatus: "Hypertension, chronic pain", financialStatus: "Depleted savings", keyEvent: "Health crisis forces retirement", riskLevel: "critical" },
        { age: 70, qualityOfLife: 22, careerStatus: "Disabled", relationshipStatus: "Alone", healthStatus: "Multiple comorbidities", financialStatus: "Struggling", keyEvent: "Severe health decline", riskLevel: "critical" },
      ],
    },
  },
  {
    id: "ptsd",
    name: "Post-Traumatic Stress Disorder",
    category: "Trauma Disorders",
    treated: {
      milestones: [
        { age: 20, qualityOfLife: 45, careerStatus: "Struggling to work", relationshipStatus: "Hypervigilant in relationships", healthStatus: "EMDR therapy beginning", financialStatus: "Unstable", keyEvent: "Trauma-focused therapy starts", riskLevel: "high" },
        { age: 30, qualityOfLife: 68, careerStatus: "Stable employment", relationshipStatus: "Trust slowly rebuilding", healthStatus: "Significant symptom reduction", financialStatus: "Improving", keyEvent: "EMDR breakthrough", riskLevel: "moderate" },
        { age: 40, qualityOfLife: 76, careerStatus: "Career advancement", relationshipStatus: "Healthy long-term relationship", healthStatus: "Managed, resilient", financialStatus: "Stable", keyEvent: "Advocacy work, helping others", riskLevel: "low" },
        { age: 60, qualityOfLife: 74, careerStatus: "Fulfilling career", relationshipStatus: "Strong family bonds", healthStatus: "Well-managed", financialStatus: "Comfortable", keyEvent: "Retirement with purpose", riskLevel: "low" },
      ],
    },
    untreated: {
      milestones: [
        { age: 20, qualityOfLife: 25, careerStatus: "Unable to maintain work", relationshipStatus: "Avoidant, isolated", healthStatus: "Severe flashbacks, nightmares", financialStatus: "Dependent", keyEvent: "Trauma response intensifies", riskLevel: "critical" },
        { age: 30, qualityOfLife: 22, careerStatus: "Disability", relationshipStatus: "Relationship failures", healthStatus: "Substance use, self-harm", financialStatus: "Crisis", keyEvent: "Substance abuse escalates", riskLevel: "critical" },
        { age: 40, qualityOfLife: 20, careerStatus: "Unemployable", relationshipStatus: "Estranged from all", healthStatus: "Chronic pain, addiction", financialStatus: "Poverty", keyEvent: "Incarceration or hospitalization", riskLevel: "critical" },
        { age: 60, qualityOfLife: 18, careerStatus: "Disabled", relationshipStatus: "Alone", healthStatus: "Severe decline", financialStatus: "State dependent", keyEvent: "Premature mortality risk", riskLevel: "critical" },
      ],
    },
  },
  {
    id: "adhd",
    name: "ADHD",
    category: "Neurodevelopmental Disorders",
    treated: {
      milestones: [
        { age: 10, qualityOfLife: 62, careerStatus: "School with accommodations", relationshipStatus: "Active social life", healthStatus: "Medication + behavioral therapy", financialStatus: "Dependent", keyEvent: "Diagnosis and treatment begins", riskLevel: "low" },
        { age: 20, qualityOfLife: 72, careerStatus: "College with support", relationshipStatus: "Good friendships", healthStatus: "Well-managed", financialStatus: "Student", keyEvent: "Finds career passion", riskLevel: "low" },
        { age: 30, qualityOfLife: 80, careerStatus: "Entrepreneurial success", relationshipStatus: "Stable relationship", healthStatus: "Thriving with structure", financialStatus: "Growing wealth", keyEvent: "Leverages creativity in career", riskLevel: "low" },
        { age: 50, qualityOfLife: 82, careerStatus: "Business owner / leader", relationshipStatus: "Strong family", healthStatus: "Managed, energetic", financialStatus: "Wealthy", keyEvent: "Peak career success", riskLevel: "low" },
        { age: 70, qualityOfLife: 78, careerStatus: "Retired, consulting", relationshipStatus: "Close family", healthStatus: "Active retirement", financialStatus: "Secure", keyEvent: "Fulfilling legacy", riskLevel: "low" },
      ],
    },
    untreated: {
      milestones: [
        { age: 10, qualityOfLife: 38, careerStatus: "Failing school", relationshipStatus: "Rejected by peers", healthStatus: "Impulsive, disruptive", financialStatus: "Dependent", keyEvent: "Expelled or held back", riskLevel: "high" },
        { age: 20, qualityOfLife: 32, careerStatus: "Dropped out", relationshipStatus: "Unstable friendships", healthStatus: "Risk-taking behaviors", financialStatus: "Unemployed", keyEvent: "Legal troubles begin", riskLevel: "high" },
        { age: 30, qualityOfLife: 35, careerStatus: "Job hopping", relationshipStatus: "Multiple failed relationships", healthStatus: "Substance use, accidents", financialStatus: "Debt", keyEvent: "Divorce, job loss cycle", riskLevel: "high" },
        { age: 50, qualityOfLife: 30, careerStatus: "Underemployed", relationshipStatus: "Isolated", healthStatus: "Comorbid depression, addiction", financialStatus: "Financial crisis", keyEvent: "Health and financial collapse", riskLevel: "critical" },
        { age: 70, qualityOfLife: 25, careerStatus: "Disabled", relationshipStatus: "Estranged", healthStatus: "Multiple comorbidities", financialStatus: "Poverty", keyEvent: "Premature aging", riskLevel: "critical" },
      ],
    },
  },
  {
    id: "bipolar",
    name: "Bipolar I Disorder",
    category: "Mood Disorders",
    treated: {
      milestones: [
        { age: 20, qualityOfLife: 52, careerStatus: "College with challenges", relationshipStatus: "Relationships strained by episodes", healthStatus: "Mood stabilizers beginning", financialStatus: "Dependent", keyEvent: "Diagnosis after first manic episode", riskLevel: "moderate" },
        { age: 30, qualityOfLife: 70, careerStatus: "Stable career", relationshipStatus: "Understanding partner", healthStatus: "Lithium stabilized", financialStatus: "Stable income", keyEvent: "Medication optimization", riskLevel: "moderate" },
        { age: 40, qualityOfLife: 74, careerStatus: "Senior professional", relationshipStatus: "Married, children", healthStatus: "Managed with monitoring", financialStatus: "Comfortable", keyEvent: "Career and family stability", riskLevel: "low" },
        { age: 60, qualityOfLife: 71, careerStatus: "Winding down", relationshipStatus: "Strong bonds", healthStatus: "Managed, kidney monitoring", financialStatus: "Retirement ready", keyEvent: "Successful retirement", riskLevel: "moderate" },
      ],
    },
    untreated: {
      milestones: [
        { age: 20, qualityOfLife: 30, careerStatus: "Expelled or dropped out", relationshipStatus: "Destroyed by manic behavior", healthStatus: "Severe manic episodes", financialStatus: "Bankrupt from spending sprees", keyEvent: "First hospitalization", riskLevel: "critical" },
        { age: 30, qualityOfLife: 25, careerStatus: "Unemployable", relationshipStatus: "Divorced, estranged", healthStatus: "Psychosis, hospitalizations", financialStatus: "Bankruptcy", keyEvent: "Multiple hospitalizations", riskLevel: "critical" },
        { age: 40, qualityOfLife: 22, careerStatus: "Disability", relationshipStatus: "Alone", healthStatus: "Substance abuse, self-harm", financialStatus: "Poverty", keyEvent: "Criminal charges from manic episode", riskLevel: "critical" },
        { age: 60, qualityOfLife: 18, careerStatus: "Institutionalized", relationshipStatus: "No contact with family", healthStatus: "Severe decline", financialStatus: "State care", keyEvent: "Permanent institutionalization", riskLevel: "critical" },
      ],
    },
  },
];
