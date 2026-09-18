/**
 * SISTER INVENTION SI-023: Automated Prospect Qualification Engine
 * Patent Reference: Extends PAT-015 (Practice Management Platform)
 * 
 * Scores and qualifies prospects based on financial profile,
 * insurance needs, and conversion probability.
 */

export interface ProspectProfile {
  name: string;
  age: number;
  income: number;
  netWorth: number;
  occupation: string;
  occupationCategory: "physician" | "attorney" | "business_owner" | "executive" | "professional" | "other";
  maritalStatus: "single" | "married" | "divorced" | "widowed";
  dependents: number;
  existingInsurance: boolean;
  existingInsuranceType: string[];
  homeOwner: boolean;
  businessOwner: boolean;
  businessRevenue: number;
  retirementSavings: number;
  hasEstatePlan: boolean;
  referralSource: "client" | "seminar" | "online" | "cold" | "partner" | "social_media";
  engagementLevel: "hot" | "warm" | "cold";
  painPoints: string[];
}

export interface QualificationScore {
  prospect: ProspectProfile;
  overallScore: number;          // 0-100
  financialFitScore: number;
  needsScore: number;
  conversionProbability: number;
  estimatedAnnualPremium: number;
  estimatedLifetimeValue: number;
  tier: "platinum" | "gold" | "silver" | "bronze" | "disqualified";
  recommendedProducts: string[];
  openingStrategy: string;
  keyTalkingPoints: string[];
  objectionHandlers: string[];
  nextBestAction: string;
}

export interface QualificationResult {
  qualifiedProspects: QualificationScore[];
  totalPipelineValue: number;
  avgConversionProbability: number;
  tierBreakdown: Record<string, number>;
  prioritizedList: string[];
}

/**
 * Qualify and score prospects
 */
export function qualifyProspects(prospects: ProspectProfile[]): QualificationResult {
  const scored: QualificationScore[] = prospects.map(prospect => {
    let financialFit = 0;
    let needsScore = 0;
    let conversionProb = 0;

    // Financial fit scoring
    if (prospect.income >= 500000) financialFit += 30;
    else if (prospect.income >= 250000) financialFit += 25;
    else if (prospect.income >= 150000) financialFit += 20;
    else if (prospect.income >= 100000) financialFit += 15;
    else financialFit += 5;

    if (prospect.netWorth >= 5000000) financialFit += 25;
    else if (prospect.netWorth >= 2000000) financialFit += 20;
    else if (prospect.netWorth >= 1000000) financialFit += 15;
    else if (prospect.netWorth >= 500000) financialFit += 10;
    else financialFit += 3;

    if (prospect.businessOwner && prospect.businessRevenue > 1000000) financialFit += 15;
    if (prospect.homeOwner) financialFit += 5;
    if (prospect.retirementSavings > 500000) financialFit += 10;

    financialFit = Math.min(100, financialFit);

    // Needs scoring
    if (prospect.dependents > 0 && !prospect.existingInsurance) needsScore += 25;
    if (prospect.dependents > 0 && prospect.existingInsurance) needsScore += 10;
    if (!prospect.hasEstatePlan && prospect.netWorth > 1000000) needsScore += 20;
    if (prospect.businessOwner) needsScore += 15;
    if (prospect.age >= 40 && prospect.age <= 60) needsScore += 10;
    if (prospect.maritalStatus === "married") needsScore += 10;
    if (prospect.painPoints.length > 0) needsScore += prospect.painPoints.length * 5;
    if (prospect.occupationCategory === "physician") needsScore += 15;
    needsScore = Math.min(100, needsScore);

    // Conversion probability
    if (prospect.referralSource === "client") conversionProb += 30;
    else if (prospect.referralSource === "partner") conversionProb += 25;
    else if (prospect.referralSource === "seminar") conversionProb += 20;
    else if (prospect.referralSource === "online") conversionProb += 10;
    else conversionProb += 5;

    if (prospect.engagementLevel === "hot") conversionProb += 30;
    else if (prospect.engagementLevel === "warm") conversionProb += 15;
    else conversionProb += 5;

    if (prospect.painPoints.length >= 3) conversionProb += 15;
    else if (prospect.painPoints.length >= 1) conversionProb += 8;

    conversionProb = Math.min(95, conversionProb);

    // Overall score
    const overall = Math.round(financialFit * 0.35 + needsScore * 0.35 + conversionProb * 0.30);

    // Tier assignment
    const tier = overall >= 80 ? "platinum" as const
      : overall >= 65 ? "gold" as const
      : overall >= 45 ? "silver" as const
      : overall >= 25 ? "bronze" as const
      : "disqualified" as const;

    // Estimated premium
    const basePremium = prospect.income * 0.10;
    const premiumMult = prospect.businessOwner ? 1.5 : prospect.occupationCategory === "physician" ? 1.3 : 1.0;
    const estPremium = Math.round(basePremium * premiumMult);
    const lifetimeValue = estPremium * 15; // 15-year average relationship

    // Recommended products
    const products: string[] = [];
    if (prospect.income > 200000) products.push("IUL (Indexed Universal Life)");
    if (prospect.businessOwner) products.push("Key Person Insurance", "Buy-Sell Agreement Funding");
    if (prospect.netWorth > 2000000) products.push("Estate Planning with ILIT");
    if (prospect.age >= 50) products.push("Fixed Indexed Annuity");
    if (prospect.dependents > 0 && !prospect.existingInsurance) products.push("Term Life Insurance");
    if (prospect.occupationCategory === "physician") products.push("Disability Income Insurance");
    if (products.length === 0) products.push("Comprehensive Financial Review");

    // Opening strategy
    const opening = prospect.referralSource === "client"
      ? `"${prospect.name}, [referrer] mentioned you might benefit from the same strategy that helped them save $X in taxes..."`
      : prospect.occupationCategory === "physician"
      ? `"${prospect.name}, I specialize in helping physicians protect their income and build tax-free wealth..."`
      : prospect.businessOwner
      ? `"${prospect.name}, I help business owners like you keep more of what you earn while protecting your family and business..."`
      : `"${prospect.name}, I noticed you might have a gap in your financial protection that could cost your family significantly..."`;

    // Talking points
    const talkingPoints: string[] = [];
    if (prospect.painPoints.includes("taxes")) talkingPoints.push("Tax-free retirement income via IUL policy loans");
    if (prospect.painPoints.includes("estate")) talkingPoints.push("Estate tax elimination with ILIT structure");
    if (prospect.painPoints.includes("retirement")) talkingPoints.push("Guaranteed floor protection with upside potential");
    if (prospect.painPoints.includes("protection")) talkingPoints.push("Living benefits for chronic/critical illness");
    if (prospect.businessOwner) talkingPoints.push("Business succession and key person protection");
    talkingPoints.push("Comprehensive financial review — no obligation");

    // Objection handlers
    const objections: string[] = [
      `"I already have insurance" → "Great — let me show you how your current coverage compares. Most people are surprised by the gaps."`,
      `"I need to think about it" → "Absolutely. What specific concerns can I address to help you decide?"`,
      `"It's too expensive" → "Let me show you the cost of NOT having this protection — it's usually much higher."`,
      `"I don't trust insurance companies" → "I understand. That's why I only work with A+ rated carriers with 100+ year track records."`,
    ];

    const nextAction = tier === "platinum" || tier === "gold"
      ? "Schedule in-person meeting within 48 hours"
      : tier === "silver"
      ? "Send personalized email with value proposition"
      : "Add to nurture campaign";

    return {
      prospect,
      overallScore: overall,
      financialFitScore: financialFit,
      needsScore,
      conversionProbability: conversionProb,
      estimatedAnnualPremium: estPremium,
      estimatedLifetimeValue: lifetimeValue,
      tier,
      recommendedProducts: products,
      openingStrategy: opening,
      keyTalkingPoints: talkingPoints,
      objectionHandlers: objections,
      nextBestAction: nextAction,
    };
  });

  scored.sort((a, b) => b.overallScore - a.overallScore);

  const totalPipeline = scored.reduce((s, q) => s + q.estimatedLifetimeValue, 0);
  const avgConversion = scored.reduce((s, q) => s + q.conversionProbability, 0) / Math.max(scored.length, 1);
  const tierBreakdown: Record<string, number> = {};
  scored.forEach(q => { tierBreakdown[q.tier] = (tierBreakdown[q.tier] ?? 0) + 1; });

  return {
    qualifiedProspects: scored,
    totalPipelineValue: totalPipeline,
    avgConversionProbability: Math.round(avgConversion),
    tierBreakdown,
    prioritizedList: scored.filter(q => q.tier !== "disqualified").map(q => `${q.prospect.name} (${q.tier}, ${q.conversionProbability}% conversion)`),
  };
}
