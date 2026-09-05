/**
 * THE BRAIN — Section B: AI Brain & Advisor Intelligence (S41-S70)
 *
 * S41: AI page-specific recommendations    S56: Tax law interpreter
 * S42: AI learning from patterns           S57: Insurance analyzer
 * S43: AI conversation memory              S58: Estate narrator
 * S44: AI proactive alerts                 S59: Retirement storyteller
 * S45: AI meeting prep                     S60: Market commentary
 * S46: AI objection handler                S61: AI onboarding guide
 * S47: AI compliance check                 S62: Feature discovery
 * S48: AI product matching                 S63: Calculator tutor
 * S49: AI scenario suggestions             S64: Workflow optimizer
 * S50: AI risk alerts                      S65: Data entry assistant
 * S51: AI writing assistant                S66: Anomaly detector
 * S52: AI email drafts                     S67: Goal tracker
 * S53: AI report narratives                S68: Progress narrator
 * S54: AI client talking points            S69: Celebration engine
 * S55: AI strategy explanations            S70: AI personality
 */

import { useCallback, useMemo, useRef, useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// S41: PAGE-SPECIFIC AI RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════

interface AIRecommendation {
  id: string;
  type: "action" | "insight" | "warning" | "opportunity" | "celebration";
  title: string;
  description: string;
  priority: number; // 1-10
  relatedCalc?: string;
  confidence: number; // 0-1
}

/** S41: Generate page-specific recommendations based on current context */
export function usePageRecommendations(
  pageName: string,
  calcResults: Record<string, any>,
  clientData: Record<string, any>
) {
  return useMemo((): AIRecommendation[] => {
    const recs: AIRecommendation[] = [];
    const income = clientData?.annualIncome || 0;
    const age = clientData?.age || 45;
    const netWorth = clientData?.netWorth || 0;

    // Universal recommendations based on data gaps
    if (!clientData?.clientName) {
      recs.push({
        id: "fill-fact-finder", type: "action", title: "Complete Client Fact Finder",
        description: "Fill in client data for personalized recommendations across all calculators",
        priority: 10, relatedCalc: "fact-finder", confidence: 1,
      });
    }

    // Tax-specific
    if (pageName.toLowerCase().includes("tax") || pageName.toLowerCase().includes("roth")) {
      if (income > 200000 && !calcResults["mega-backdoor-roth"]) {
        recs.push({
          id: "mega-backdoor", type: "opportunity", title: "Mega Backdoor Roth Opportunity",
          description: `Income of $${(income/1000).toFixed(0)}K qualifies for mega backdoor Roth — could shelter $46K+ annually`,
          priority: 9, relatedCalc: "mega-backdoor-roth", confidence: 0.85,
        });
      }
      if (age > 59.5 && calcResults["roth-vs-traditional"]?.summary?.rothAdvantage) {
        recs.push({
          id: "roth-convert", type: "opportunity", title: "Roth Conversion Window",
          description: "Client is past 59.5 — Roth conversion ladder could eliminate future RMDs",
          priority: 8, relatedCalc: "roth-vs-traditional", confidence: 0.8,
        });
      }
    }

    // Insurance-specific
    if (pageName.toLowerCase().includes("insurance") || pageName.toLowerCase().includes("iul")) {
      if (!calcResults["life-insurance-needs"]) {
        recs.push({
          id: "run-life-needs", type: "action", title: "Run Life Insurance Needs Analysis",
          description: "No life insurance needs analysis on file — critical for accurate IUL sizing",
          priority: 9, relatedCalc: "life-insurance-needs", confidence: 1,
        });
      }
      if (income > 150000 && !calcResults["iul-projection"]) {
        recs.push({
          id: "iul-projection", type: "opportunity", title: "IUL Tax-Free Income Strategy",
          description: `High income ($${(income/1000).toFixed(0)}K) makes IUL an excellent tax-free retirement income vehicle`,
          priority: 8, relatedCalc: "iul-projection", confidence: 0.75,
        });
      }
    }

    // Estate-specific
    if (pageName.toLowerCase().includes("estate") || pageName.toLowerCase().includes("trust")) {
      if (netWorth > 5000000 && !calcResults["estate-tax-calculator"]) {
        recs.push({
          id: "estate-tax", type: "warning", title: "Estate Tax Exposure",
          description: `Net worth of $${(netWorth/1000000).toFixed(1)}M may trigger estate taxes — run Estate Tax Calculator immediately`,
          priority: 10, relatedCalc: "estate-tax-calculator", confidence: 0.9,
        });
      }
    }

    // Retirement-specific
    if (pageName.toLowerCase().includes("retire") || pageName.toLowerCase().includes("income")) {
      if (age > 55 && !calcResults["social-security-optimizer"]) {
        recs.push({
          id: "ss-optimize", type: "action", title: "Optimize Social Security Strategy",
          description: "Client is approaching SS eligibility — claiming strategy could add $100K+ lifetime",
          priority: 9, relatedCalc: "social-security-optimizer", confidence: 0.85,
        });
      }
    }

    return recs.sort((a, b) => b.priority - a.priority).slice(0, 8);
  }, [pageName, calcResults, clientData]);
}

// ═══════════════════════════════════════════════════════════════
// S42-S43: LEARNING & MEMORY
// ═══════════════════════════════════════════════════════════════

/** S42: Track advisor usage patterns for learning */
export function useAdvisorPatternLearning() {
  const trackAction = useCallback((action: string, context: Record<string, any>) => {
    try {
      const key = "rc_advisor_patterns";
      const patterns = JSON.parse(localStorage.getItem(key) || "[]");
      patterns.push({ action, context, timestamp: Date.now() });
      if (patterns.length > 500) patterns.splice(0, patterns.length - 500);
      localStorage.setItem(key, JSON.stringify(patterns));
    } catch {}
  }, []);

  const getMostUsedCalcs = useCallback((): Array<{ route: string; count: number }> => {
    try {
      const patterns = JSON.parse(localStorage.getItem("rc_advisor_patterns") || "[]");
      const counts: Record<string, number> = {};
      patterns.filter((p: any) => p.action === "calc_visit").forEach((p: any) => {
        counts[p.context.route] = (counts[p.context.route] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch { return []; }
  }, []);

  const getCommonSequences = useCallback((): Array<{ from: string; to: string; count: number }> => {
    try {
      const patterns = JSON.parse(localStorage.getItem("rc_advisor_patterns") || "[]");
      const visits = patterns.filter((p: any) => p.action === "calc_visit");
      const sequences: Record<string, number> = {};
      for (let i = 1; i < visits.length; i++) {
        const key = `${visits[i-1].context.route}→${visits[i].context.route}`;
        sequences[key] = (sequences[key] || 0) + 1;
      }
      return Object.entries(sequences)
        .map(([key, count]) => {
          const [from, to] = key.split("→");
          return { from, to, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch { return []; }
  }, []);

  return { trackAction, getMostUsedCalcs, getCommonSequences };
}

/** S43: Conversation memory — persist AI chat context across sessions */
export function useConversationMemory(clientId?: string) {
  const memoryKey = `rc_ai_memory_${clientId || "default"}`;

  const [memory, setMemory] = useState<Array<{ role: string; content: string; timestamp: number }>>(() => {
    try { return JSON.parse(localStorage.getItem(memoryKey) || "[]"); } catch { return []; }
  });

  const addMessage = useCallback((role: string, content: string) => {
    setMemory(prev => {
      const next = [...prev, { role, content, timestamp: Date.now() }];
      if (next.length > 100) next.splice(0, next.length - 100);
      localStorage.setItem(memoryKey, JSON.stringify(next));
      return next;
    });
  }, [memoryKey]);

  const getContextSummary = useCallback((): string => {
    if (memory.length === 0) return "No previous conversation history.";
    const recent = memory.slice(-10);
    return recent.map(m => `${m.role}: ${m.content.slice(0, 200)}`).join("\n");
  }, [memory]);

  const clearMemory = useCallback(() => {
    setMemory([]);
    localStorage.removeItem(memoryKey);
  }, [memoryKey]);

  return { memory, addMessage, getContextSummary, clearMemory };
}

// ═══════════════════════════════════════════════════════════════
// S44-S50: PROACTIVE INTELLIGENCE
// ═══════════════════════════════════════════════════════════════

/** S44: Proactive alerts based on data changes */
export function useProactiveAlerts(calcResults: Record<string, any>, clientData: Record<string, any>) {
  return useMemo((): Array<{ type: "warning" | "opportunity" | "reminder"; message: string; action?: string }> => {
    const alerts: Array<{ type: "warning" | "opportunity" | "reminder"; message: string; action?: string }> = [];
    const age = clientData?.age || 0;
    const income = clientData?.annualIncome || 0;

    // Age-based alerts
    if (age === 59) alerts.push({ type: "reminder", message: "Client turns 59.5 soon — penalty-free IRA withdrawals available", action: "retirement-income-gap" });
    if (age === 62) alerts.push({ type: "reminder", message: "Client eligible for early Social Security — run optimizer", action: "social-security-optimizer" });
    if (age === 65) alerts.push({ type: "reminder", message: "Medicare enrollment window — check IRMAA exposure", action: "irmaa-calculator" });
    if (age === 72) alerts.push({ type: "warning", message: "RMD required this year — calculate distribution", action: "rmd-calculator" });

    // Income-based alerts
    if (income > 250000 && !calcResults["amt-estimator"]) {
      alerts.push({ type: "warning", message: "High income may trigger AMT — run AMT estimator", action: "amt-estimator" });
    }

    // Stale data alerts
    const resultEntries = Object.entries(calcResults);
    const staleCount = resultEntries.filter(([_, r]: [string, any]) => Date.now() - r.timestamp > 90 * 24 * 60 * 60 * 1000).length;
    if (staleCount > 5) {
      alerts.push({ type: "reminder", message: `${staleCount} calculator results are over 90 days old — consider refreshing` });
    }

    // Coverage gaps
    if (!calcResults["life-insurance-needs"] && clientData?.numberOfDependents > 0) {
      alerts.push({ type: "warning", message: "Client has dependents but no life insurance analysis on file" });
    }
    if (!calcResults["disability-insurance-needs"] && income > 100000) {
      alerts.push({ type: "warning", message: "No disability insurance analysis — client's largest asset is their income" });
    }

    return alerts;
  }, [calcResults, clientData]);
}

/** S45: Meeting prep generator */
export function generateMeetingPrep(
  clientData: Record<string, any>,
  calcResults: Record<string, any>,
  previousNotes?: string
): {
  agenda: string[];
  talkingPoints: string[];
  openItems: string[];
  recentChanges: string[];
} {
  const agenda: string[] = [];
  const talkingPoints: string[] = [];
  const openItems: string[] = [];
  const recentChanges: string[] = [];

  const name = clientData?.clientName || "Client";
  const age = clientData?.age || 0;
  const income = clientData?.annualIncome || 0;

  agenda.push(`Review ${name}'s current financial position`);
  agenda.push("Discuss any life changes since last meeting");

  // Check recent calc results
  const recent = Object.entries(calcResults)
    .filter(([_, r]: [string, any]) => Date.now() - r.timestamp < 30 * 24 * 60 * 60 * 1000)
    .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.timestamp - a.timestamp);

  if (recent.length > 0) {
    agenda.push("Review recent analysis results");
    recent.slice(0, 5).forEach(([route]) => {
      recentChanges.push(`New analysis: ${route.replace(/-/g, " ")}`);
    });
  }

  // Generate talking points based on profile
  if (income > 200000) talkingPoints.push("Discuss tax optimization strategies — Roth conversions, backdoor Roth, mega backdoor");
  if (age > 55) talkingPoints.push("Review retirement timeline and income gap analysis");
  if (clientData?.hasChildren) talkingPoints.push("Education funding and legacy planning update");
  if (clientData?.hasRealEstate) talkingPoints.push("Real estate portfolio review and tax implications");

  // Open items from incomplete analyses
  if (!calcResults["life-insurance-needs"]) openItems.push("Complete life insurance needs analysis");
  if (!calcResults["estate-tax-calculator"] && (clientData?.netWorth || 0) > 2000000) openItems.push("Run estate tax analysis");
  if (!calcResults["retirement-income-gap"]) openItems.push("Complete retirement income gap analysis");

  return { agenda, talkingPoints, openItems, recentChanges };
}

/** S46: Objection handler — common client objections with responses */
export const OBJECTION_HANDLERS: Record<string, { objection: string; response: string; supportingCalc?: string }> = {
  "too-expensive": {
    objection: "Life insurance is too expensive",
    response: "Let me show you the cost of NOT having coverage. The life insurance needs calculator shows your family would need $X to maintain their lifestyle. The premium is actually less than 1% of the coverage amount.",
    supportingCalc: "life-insurance-needs",
  },
  "market-timing": {
    objection: "I want to wait for the market to go down",
    response: "Time in the market beats timing the market. Let me show you the cost of waiting calculator — even a 1-year delay can cost $X in compound growth.",
    supportingCalc: "compound-interest",
  },
  "already-have-401k": {
    objection: "I already have a 401k, that's enough",
    response: "Your 401k is a great start, but it's 100% taxable in retirement. Let me show you how an IUL creates tax-FREE income alongside your 401k.",
    supportingCalc: "iul-vs-401k",
  },
  "too-young": {
    objection: "I'm too young to think about retirement",
    response: "Actually, starting early is your biggest advantage. Let me show you — starting 10 years earlier with the same contributions results in 2-3x more wealth at retirement.",
    supportingCalc: "compound-interest",
  },
  "dont-trust-insurance": {
    objection: "I don't trust insurance companies",
    response: "I understand the concern. Let me show you the carrier strength ratings and the regulatory protections in place. These companies have paid claims through every economic crisis.",
    supportingCalc: "carrier-ratings",
  },
  "roth-not-worth-it": {
    objection: "Roth conversions aren't worth the tax hit now",
    response: "Let me run the numbers. With current tax rates at historic lows and your bracket, paying taxes now at 24% could save you from paying 32%+ in retirement.",
    supportingCalc: "roth-vs-traditional",
  },
  "estate-planning-later": {
    objection: "I'll do estate planning later",
    response: "The estate tax exemption is set to drop by 50% in 2026. Every year of delay could cost your heirs millions. Let me show you the estate tax calculator.",
    supportingCalc: "estate-tax-calculator",
  },
};

/** S48: Product matching based on client profile */
export function matchProducts(clientData: Record<string, any>): Array<{
  product: string;
  reason: string;
  priority: number;
  calcRoute: string;
}> {
  const matches: Array<{ product: string; reason: string; priority: number; calcRoute: string }> = [];
  const age = clientData?.age || 45;
  const income = clientData?.annualIncome || 0;
  const netWorth = clientData?.netWorth || 0;
  const riskTolerance = clientData?.riskTolerance || 5;

  if (income > 100000 && age < 60) {
    matches.push({ product: "Indexed Universal Life (IUL)", reason: "Tax-free growth and income for high earners", priority: 9, calcRoute: "iul-projection" });
  }
  if (age > 55 && riskTolerance < 5) {
    matches.push({ product: "Fixed Indexed Annuity (FIA)", reason: "Protected growth with guaranteed income floor", priority: 8, calcRoute: "fixed-indexed-annuity" });
  }
  if (netWorth > 2000000) {
    matches.push({ product: "Irrevocable Life Insurance Trust (ILIT)", reason: "Remove life insurance from taxable estate", priority: 9, calcRoute: "ilit-calculator" });
  }
  if (income > 200000) {
    matches.push({ product: "Mega Backdoor Roth", reason: "Shelter $46K+ annually in tax-free growth", priority: 10, calcRoute: "mega-backdoor-roth" });
  }
  if (age > 60 && !clientData?.hasPension) {
    matches.push({ product: "MYGA (Multi-Year Guaranteed Annuity)", reason: "Guaranteed returns for conservative allocation", priority: 7, calcRoute: "myga-calculator" });
  }
  if (clientData?.hasRealEstate && income > 150000) {
    matches.push({ product: "Cost Segregation Study", reason: "Accelerate depreciation for immediate tax savings", priority: 8, calcRoute: "cost-segregation-calculator" });
  }
  if (clientData?.numberOfDependents > 0 && !clientData?.hasLifeInsurance) {
    matches.push({ product: "Term Life Insurance", reason: "Critical protection gap — dependents at risk", priority: 10, calcRoute: "life-insurance-needs" });
  }

  return matches.sort((a, b) => b.priority - a.priority);
}

/** S49: Scenario suggestions based on current calc results */
export function suggestScenarios(
  currentCalc: string,
  currentResults: Record<string, any>
): Array<{ label: string; description: string; overrides: Record<string, number> }> {
  const suggestions: Array<{ label: string; description: string; overrides: Record<string, number> }> = [];

  if (currentCalc.includes("iul")) {
    suggestions.push(
      { label: "Increase Premium 25%", description: "See impact of higher funding on cash value", overrides: { annualPremium: (currentResults.annualPremium || 10000) * 1.25 } },
      { label: "Extend to Age 100", description: "Project long-term performance", overrides: { years: 50 } },
      { label: "Lower Credit Rate", description: "Conservative scenario with 8% cap", overrides: { creditRate: 0.08 } },
    );
  }
  if (currentCalc.includes("retire") || currentCalc.includes("fire")) {
    suggestions.push(
      { label: "Retire 5 Years Earlier", description: "Impact of early retirement", overrides: { retirementAge: (currentResults.retirementAge || 65) - 5 } },
      { label: "Increase Savings 20%", description: "Boost annual contributions", overrides: { annualSavings: (currentResults.annualSavings || 20000) * 1.2 } },
      { label: "Market Crash Scenario", description: "30% portfolio decline in year 1", overrides: { firstYearReturn: -0.30 } },
    );
  }
  if (currentCalc.includes("tax") || currentCalc.includes("roth")) {
    suggestions.push(
      { label: "Income Increase 20%", description: "Impact of raise or bonus", overrides: { income: (currentResults.income || 100000) * 1.2 } },
      { label: "Max Roth Conversion", description: "Fill current tax bracket completely", overrides: { conversionAmount: currentResults.bracketRoom || 50000 } },
      { label: "Tax Rate Increase", description: "Prepare for potential tax law changes", overrides: { futureTaxRate: 0.35 } },
    );
  }

  return suggestions;
}

/** S50: Risk alerts based on portfolio analysis */
export function useRiskAlerts(calcResults: Record<string, any>, clientData: Record<string, any>) {
  return useMemo((): Array<{ severity: "critical" | "high" | "medium"; message: string; action: string }> => {
    const alerts: Array<{ severity: "critical" | "high" | "medium"; message: string; action: string }> = [];
    const age = clientData?.age || 0;
    const income = clientData?.annualIncome || 0;
    const netWorth = clientData?.netWorth || 0;

    // Critical: No life insurance with dependents
    if (clientData?.numberOfDependents > 0 && !calcResults["life-insurance-needs"]) {
      alerts.push({ severity: "critical", message: "Dependents at risk — no life insurance analysis", action: "Run Life Insurance Needs Calculator" });
    }

    // High: Concentration risk
    if (calcResults["asset-allocation"]?.summary?.largestPosition > 30) {
      alerts.push({ severity: "high", message: `Single position exceeds 30% of portfolio — concentration risk`, action: "Review Asset Allocation" });
    }

    // High: No disability coverage for high earners
    if (income > 150000 && !clientData?.hasDisability) {
      alerts.push({ severity: "high", message: "No disability coverage — income is largest asset at risk", action: "Run Disability Insurance Calculator" });
    }

    // Medium: Estate tax exposure
    if (netWorth > 5000000 && !calcResults["estate-tax-calculator"]) {
      alerts.push({ severity: "medium", message: "Potential estate tax exposure — no analysis on file", action: "Run Estate Tax Calculator" });
    }

    // Medium: Approaching RMD age without plan
    if (age > 70 && !calcResults["rmd-calculator"]) {
      alerts.push({ severity: "medium", message: "Approaching RMD age — no distribution strategy", action: "Run RMD Calculator" });
    }

    return alerts.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2 };
      return order[a.severity] - order[b.severity];
    });
  }, [calcResults, clientData]);
}

// ═══════════════════════════════════════════════════════════════
// S51-S60: AI WRITING & NARRATIVE GENERATION
// ═══════════════════════════════════════════════════════════════

/** S51-S60: Generate narrative text for various purposes */
export function generateNarrative(
  type: "email" | "report" | "talking-points" | "strategy-explanation" | "tax-summary" | "insurance-analysis" | "estate-narrative" | "retirement-story" | "market-commentary" | "client-letter",
  clientData: Record<string, any>,
  calcResults: Record<string, any>
): string {
  const name = clientData?.clientName || "Client";
  const age = clientData?.age || 45;
  const income = clientData?.annualIncome || 0;
  const netWorth = clientData?.netWorth || 0;
  const resultsCount = Object.keys(calcResults).length;

  switch (type) {
    case "email":
      return `Dear ${name},\n\nThank you for our recent meeting. I've completed a comprehensive analysis of your financial position using ${resultsCount} specialized calculators.\n\nKey findings include opportunities in tax optimization, retirement planning, and risk management that could significantly impact your long-term wealth.\n\nI'd like to schedule a follow-up to discuss these findings in detail. Would next week work for you?\n\nBest regards`;

    case "report":
      return `# Financial Analysis Report for ${name}\n\n## Executive Summary\nBased on our comprehensive analysis using ${resultsCount} financial calculators, we've identified several key opportunities and areas requiring attention.\n\n## Client Profile\n- Age: ${age}\n- Annual Income: $${income.toLocaleString()}\n- Net Worth: $${netWorth.toLocaleString()}\n\n## Key Findings\n${Object.entries(calcResults).slice(0, 10).map(([route, r]: [string, any]) => `- **${route.replace(/-/g, " ")}**: ${Object.entries(r.summary).slice(0, 3).map(([k, v]) => `${k}: ${typeof v === "number" ? "$" + Number(v).toLocaleString() : v}`).join(", ")}`).join("\n")}`;

    case "talking-points":
      return `## Talking Points for ${name}\n\n1. **Current Position**: Net worth of $${netWorth.toLocaleString()} with annual income of $${income.toLocaleString()}\n2. **Tax Strategy**: ${income > 200000 ? "High income qualifies for advanced tax strategies" : "Focus on maximizing deductions and Roth contributions"}\n3. **Retirement**: ${age > 55 ? "Approaching retirement — income gap analysis critical" : "Time is your greatest asset — compound growth focus"}\n4. **Protection**: Review insurance coverage gaps\n5. **Estate**: ${netWorth > 2000000 ? "Estate planning critical at this net worth level" : "Basic estate documents should be in place"}`;

    case "strategy-explanation":
      return `## Strategy Overview for ${name}\n\nBased on your profile (age ${age}, income $${income.toLocaleString()}, net worth $${netWorth.toLocaleString()}), we recommend a multi-layered approach:\n\n**Layer 1 — Tax Optimization**: ${income > 200000 ? "Mega backdoor Roth + Roth conversion ladder to minimize lifetime tax burden" : "Maximize 401k contributions and consider Roth IRA"}\n\n**Layer 2 — Protected Growth**: IUL for tax-free income with downside protection\n\n**Layer 3 — Income Security**: ${age > 55 ? "Social Security optimization + annuity income floor" : "Build diversified income streams for future flexibility"}\n\n**Layer 4 — Legacy**: ${netWorth > 2000000 ? "ILIT + dynasty trust for multi-generational wealth transfer" : "Basic estate planning with life insurance"}`;

    case "tax-summary":
      return `## Tax Analysis Summary\n\nCurrent bracket: ${income > 578125 ? "37%" : income > 231250 ? "35%" : income > 182100 ? "32%" : income > 95375 ? "24%" : "22%"}\nEstimated annual tax: $${Math.round(income * (income > 200000 ? 0.28 : 0.22)).toLocaleString()}\n\n${income > 200000 ? "**High-Priority Tax Strategies:**\n- Mega Backdoor Roth ($46,500 annual shelter)\n- Roth Conversion Ladder\n- Charitable Giving Optimization\n- Cost Segregation (if real estate)" : "**Recommended Tax Strategies:**\n- Maximize 401k contributions\n- Roth IRA (backdoor if needed)\n- Tax-loss harvesting"}`;

    case "insurance-analysis":
      return `## Insurance Coverage Analysis for ${name}\n\nBased on income of $${income.toLocaleString()} and ${clientData?.numberOfDependents || 0} dependents:\n\n**Life Insurance Need**: $${Math.round(income * 10).toLocaleString()} (10x income rule)\n**Disability Coverage**: $${Math.round(income * 0.6 / 12).toLocaleString()}/month (60% income replacement)\n**Umbrella**: $${Math.round(Math.max(1000000, netWorth)).toLocaleString()} recommended\n**Long-Term Care**: ${age > 50 ? "Consider hybrid LTC policy" : "Monitor — not urgent yet"}`;

    case "estate-narrative":
      return `## Estate Planning Overview for ${name}\n\nCurrent estate value: $${netWorth.toLocaleString()}\nFederal exemption: $13,610,000 (2024)\n${netWorth > 13610000 ? `**WARNING: Estate exceeds exemption by $${(netWorth - 13610000).toLocaleString()} — potential 40% estate tax**` : "Estate is within federal exemption"}\n\n**Recommended Structures:**\n${netWorth > 5000000 ? "- ILIT for life insurance\n- Dynasty Trust for multi-generational transfer\n- GRAT for appreciating assets\n- Charitable Remainder Trust for income + philanthropy" : "- Revocable Living Trust\n- Pour-over Will\n- Durable Power of Attorney\n- Healthcare Directive"}`;

    case "retirement-story":
      return `## ${name}'s Retirement Journey\n\nAt age ${age} with $${netWorth.toLocaleString()} in assets, ${name} is ${age > 60 ? "approaching" : age > 50 ? "preparing for" : "building toward"} retirement.\n\n**Current Trajectory**: ${calcResults["fire-calculator"]?.summary?.yearsToFire ? `FIRE in ${calcResults["fire-calculator"].summary.yearsToFire} years` : "Run FIRE calculator for timeline"}\n**Income Gap**: ${calcResults["retirement-income-gap"]?.summary?.gap ? `$${Number(calcResults["retirement-income-gap"].summary.gap).toLocaleString()} annual gap to fill` : "Needs analysis"}\n**Social Security**: ${age > 62 ? "Eligible — optimize claiming strategy" : `Estimated ${67 - age} years until full retirement age`}`;

    case "market-commentary":
      return `## Market Context for ${name}'s Portfolio\n\nCurrent market conditions should be viewed through the lens of ${name}'s ${67 - age}-year investment horizon.\n\n**Key Considerations:**\n- Long-term average returns: 10% nominal, 7% real\n- Sequence of returns risk: ${age > 55 ? "HIGH — approaching distribution phase" : "LOW — time to recover from downturns"}\n- Inflation impact: $${income.toLocaleString()} today = $${Math.round(income / Math.pow(1.03, 20)).toLocaleString()} in purchasing power in 20 years`;

    case "client-letter":
      return `Dear ${name},\n\nI wanted to share an update on your financial plan. After running ${resultsCount} analyses, I'm pleased to report several opportunities that could significantly improve your long-term financial position.\n\n${income > 200000 ? "Your income level qualifies you for several advanced tax strategies that could save you tens of thousands annually." : ""}\n\n${netWorth > 1000000 ? "Your growing net worth means estate planning should be a priority to protect your family's wealth." : ""}\n\nI look forward to discussing these findings at our next meeting.\n\nWarm regards`;

    default:
      return `Analysis for ${name} — ${resultsCount} calculators analyzed.`;
  }
}

// ═══════════════════════════════════════════════════════════════
// S61-S70: ONBOARDING, DISCOVERY, TUTORING, CELEBRATION
// ═══════════════════════════════════════════════════════════════

/** S61: Onboarding guide — step-by-step for new advisors */
export function useOnboardingGuide() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("rc_onboarding_completed");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const steps = useMemo(() => [
    { id: "fact-finder", title: "Complete Client Fact Finder", description: "Enter client data for personalized analysis", route: "/portal/fact-finder" },
    { id: "net-worth", title: "Run Net Worth Tracker", description: "Establish baseline financial position", route: "/portal/net-worth-tracker" },
    { id: "tax-bracket", title: "Analyze Tax Bracket", description: "Understand current tax exposure", route: "/portal/marginal-tax-rate" },
    { id: "insurance", title: "Life Insurance Needs", description: "Ensure adequate protection", route: "/portal/life-insurance-needs" },
    { id: "retirement", title: "Retirement Income Gap", description: "Identify income shortfall", route: "/portal/retirement-income-gap" },
    { id: "iul", title: "IUL Projection", description: "Model tax-free growth strategy", route: "/portal/iul-projection" },
    { id: "estate", title: "Estate Tax Analysis", description: "Plan for wealth transfer", route: "/portal/estate-tax-calculator" },
    { id: "strategy", title: "Build Strategy", description: "Combine tools into comprehensive plan", route: "/portal/strategy-builder" },
  ], []);

  const completeStep = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(stepId);
      localStorage.setItem("rc_onboarding_completed", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const progress = completedSteps.size / steps.length;
  const nextStep = steps.find(s => !completedSteps.has(s.id));

  return { steps, completedSteps, completeStep, progress, nextStep };
}

/** S62: Feature discovery — suggest unused features */
export function useFeatureDiscovery(visitedRoutes: string[]) {
  return useMemo(() => {
    const allFeatures = [
      { route: "/portal/ai-brain", name: "AI Brain Advisor", category: "AI" },
      { route: "/portal/scenario-warfare", name: "Scenario Warfare", category: "Analysis" },
      { route: "/portal/calculator-hub", name: "Calculator Hub", category: "Tools" },
      { route: "/portal/strategy-builder", name: "Strategy Builder", category: "Planning" },
      { route: "/portal/client-digital-twin", name: "Client Digital Twin", category: "Intelligence" },
      { route: "/portal/report-builder", name: "Report Builder", category: "Reporting" },
      { route: "/portal/batch-illustration", name: "Batch Illustration", category: "Efficiency" },
      { route: "/portal/compliance-dashboard", name: "Compliance Dashboard", category: "Compliance" },
    ];

    return allFeatures.filter(f => !visitedRoutes.includes(f.route));
  }, [visitedRoutes]);
}

/** S66: Anomaly detector — flag unusual values */
export function detectAnomalies(inputs: Record<string, number>): Array<{ field: string; value: number; issue: string }> {
  const anomalies: Array<{ field: string; value: number; issue: string }> = [];

  if (inputs.age && (inputs.age < 18 || inputs.age > 100)) anomalies.push({ field: "age", value: inputs.age, issue: "Unusual age value" });
  if (inputs.income && inputs.income > 10000000) anomalies.push({ field: "income", value: inputs.income, issue: "Income exceeds $10M — verify" });
  if (inputs.returnRate && inputs.returnRate > 0.20) anomalies.push({ field: "returnRate", value: inputs.returnRate, issue: "Return rate above 20% is unrealistic" });
  if (inputs.taxRate && inputs.taxRate > 0.50) anomalies.push({ field: "taxRate", value: inputs.taxRate, issue: "Tax rate above 50% — verify" });
  if (inputs.inflationRate && inputs.inflationRate > 0.10) anomalies.push({ field: "inflationRate", value: inputs.inflationRate, issue: "Inflation above 10% is extreme" });
  if (inputs.mortgageRate && inputs.mortgageRate > 0.12) anomalies.push({ field: "mortgageRate", value: inputs.mortgageRate, issue: "Mortgage rate above 12% — verify" });

  return anomalies;
}

/** S67: Goal tracker */
export function useGoalTracker() {
  const [goals, setGoals] = useState<Array<{
    id: string;
    title: string;
    target: number;
    current: number;
    deadline?: string;
    category: string;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_goals") || "[]"); } catch { return []; }
  });

  const addGoal = useCallback((goal: { title: string; target: number; current: number; deadline?: string; category: string }) => {
    setGoals(prev => {
      const next = [...prev, { ...goal, id: `goal_${Date.now()}` }];
      localStorage.setItem("rc_goals", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateProgress = useCallback((goalId: string, current: number) => {
    setGoals(prev => {
      const next = prev.map(g => g.id === goalId ? { ...g, current } : g);
      localStorage.setItem("rc_goals", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeGoal = useCallback((goalId: string) => {
    setGoals(prev => {
      const next = prev.filter(g => g.id !== goalId);
      localStorage.setItem("rc_goals", JSON.stringify(next));
      return next;
    });
  }, []);

  return { goals, addGoal, updateProgress, removeGoal };
}

/** S69: Celebration engine — trigger celebrations for milestones */
export function checkCelebrations(calcResults: Record<string, any>, clientData: Record<string, any>): Array<{
  type: "milestone" | "achievement" | "breakthrough";
  title: string;
  message: string;
  emoji: string;
}> {
  const celebrations: Array<{ type: "milestone" | "achievement" | "breakthrough"; title: string; message: string; emoji: string }> = [];
  const calcsUsed = Object.keys(calcResults).length;

  if (calcsUsed === 10) celebrations.push({ type: "milestone", title: "10 Calculators!", message: "You've run 10 different analyses — comprehensive planning underway", emoji: "🎯" });
  if (calcsUsed === 25) celebrations.push({ type: "achievement", title: "Quarter Century!", message: "25 calculators completed — you're in the top 5% of advisors", emoji: "🏆" });
  if (calcsUsed === 50) celebrations.push({ type: "breakthrough", title: "Half Century!", message: "50 calculators — truly comprehensive financial planning", emoji: "🌟" });

  if (clientData?.netWorth > 1000000) celebrations.push({ type: "milestone", title: "Millionaire Client!", message: "Client has crossed the $1M net worth threshold", emoji: "💎" });

  return celebrations;
}

/** S70: AI personality configuration */
export type AIPersonality = "professional" | "friendly" | "analytical" | "motivational";

export function getAIPersonalityPrompt(personality: AIPersonality): string {
  switch (personality) {
    case "professional":
      return "You are a seasoned financial advisor. Be precise, data-driven, and authoritative. Use formal language and cite specific numbers.";
    case "friendly":
      return "You are a trusted financial friend. Be warm, encouraging, and use simple language. Make complex topics approachable.";
    case "analytical":
      return "You are a financial analyst. Focus on data, trends, and quantitative analysis. Present findings with charts and comparisons.";
    case "motivational":
      return "You are a financial coach. Be energetic, positive, and action-oriented. Celebrate progress and push for next steps.";
  }
}
