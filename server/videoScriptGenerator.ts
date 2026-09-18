/**
 * AI Script Generator for Video Proposals
 * 
 * Uses the built-in LLM to generate personalized chapter scripts
 * based on client financial data and strategy recommendations.
 */

import { invokeLLM } from "./_core/llm";

export interface ClientDataForScript {
  name: string;
  age?: number;
  spouseName?: string;
  spouseAge?: number;
  income?: number;
  filingStatus?: string;
  totalNetWorth?: number;
  retirementAge?: number;
  // Financial details
  iraBalance?: number;
  rothBalance?: number;
  k401Balance?: number;
  taxableAssets?: number;
  realEstateEquity?: number;
  lifeInsuranceCv?: number;
  lifeInsuranceDb?: number;
  mortgageBalance?: number;
  mortgageRate?: number;
  socialSecurityEstimate?: number;
  annuityValue?: number;
  monthlyExpenses?: number;
  cashSavings?: number;
}

export interface StrategyDataForScript {
  summary?: string;
  taxPlan?: string;
  insurancePlan?: string;
  investmentPlan?: string;
  // Calculator results
  projectedTaxSavings?: number;
  projectedEquityGrowth?: number;
  projectedIncome?: number;
  projectedDeathBenefit?: number;
  projectedCashValue?: number;
  interestSaved?: number;
  netPositiveResult?: number;
  twentyYearProjection?: Array<{
    year: number;
    netWorth: number;
    taxSavings: number;
    income: number;
  }>;
}

export interface ChapterScript {
  chapterType: "introduction" | "current_situation" | "recommended_strategy" | "twenty_year_projection" | "next_steps" | "custom";
  title: string;
  script: string;
  durationEstimate: number; // seconds
}

const CHAPTER_TEMPLATES = {
  introduction: {
    title: "Welcome & Introduction",
    systemPrompt: `You are a professional financial advisor creating a personalized video proposal introduction. 
    Speak directly to the client by name. Be warm, professional, and confident.
    Keep it under 45 seconds of speaking time (about 120 words).
    Mention that this video was created specifically for them and briefly preview what you'll cover.
    Do NOT use markdown formatting — write as natural spoken text.`,
  },
  current_situation: {
    title: "Your Current Financial Picture",
    systemPrompt: `You are a professional financial advisor presenting a client's current financial situation.
    Reference their specific numbers (income, assets, debts, insurance) naturally.
    Identify 2-3 key opportunities or concerns based on their data.
    Keep it under 90 seconds of speaking time (about 240 words).
    Be empathetic and solution-oriented, not alarmist.
    Do NOT use markdown formatting — write as natural spoken text.`,
  },
  recommended_strategy: {
    title: "Your Recommended Strategy",
    systemPrompt: `You are a professional financial advisor presenting a recommended strategy.
    Explain the strategy clearly using the client's actual numbers.
    Focus on the "why" — connect the strategy to their specific goals and situation.
    Mention specific products or approaches (IUL, MYGA, Roth conversion, oil & gas, etc.) if relevant.
    Keep it under 120 seconds of speaking time (about 320 words).
    Be confident but not pushy. Use phrases like "based on your situation" and "what I recommend".
    Do NOT use markdown formatting — write as natural spoken text.`,
  },
  twenty_year_projection: {
    title: "Your 20-Year Financial Projection",
    systemPrompt: `You are a professional financial advisor presenting a 20-year financial projection.
    Reference specific projected numbers: tax savings, equity growth, income generation, death benefit.
    Highlight key milestones (year 5, 10, 15, 20) with specific dollar amounts.
    Compare "do nothing" vs "recommended strategy" outcomes.
    Keep it under 90 seconds of speaking time (about 240 words).
    Be specific with numbers but keep the narrative compelling and easy to follow.
    Do NOT use markdown formatting — write as natural spoken text.`,
  },
  next_steps: {
    title: "Next Steps Together",
    systemPrompt: `You are a professional financial advisor closing a video proposal with clear next steps.
    Summarize the key benefit in one sentence.
    Provide 2-3 specific, actionable next steps.
    Include a clear call to action (schedule a call, review documents, etc.).
    Express confidence and enthusiasm about working together.
    Keep it under 45 seconds of speaking time (about 120 words).
    End with a warm, professional closing.
    Do NOT use markdown formatting — write as natural spoken text.`,
  },
};

function formatCurrency(amount: number | undefined): string {
  if (!amount) return "not specified";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function buildClientContext(client: ClientDataForScript): string {
  const lines: string[] = [];
  lines.push(`Client Name: ${client.name}`);
  if (client.age) lines.push(`Age: ${client.age}`);
  if (client.spouseName) lines.push(`Spouse: ${client.spouseName}${client.spouseAge ? ` (age ${client.spouseAge})` : ""}`);
  if (client.income) lines.push(`Annual Income: ${formatCurrency(client.income)}`);
  if (client.filingStatus) lines.push(`Filing Status: ${client.filingStatus}`);
  if (client.totalNetWorth) lines.push(`Total Net Worth: ${formatCurrency(client.totalNetWorth)}`);
  if (client.retirementAge) lines.push(`Target Retirement Age: ${client.retirementAge}`);
  if (client.iraBalance) lines.push(`IRA Balance: ${formatCurrency(client.iraBalance)}`);
  if (client.rothBalance) lines.push(`Roth Balance: ${formatCurrency(client.rothBalance)}`);
  if (client.k401Balance) lines.push(`401(k) Balance: ${formatCurrency(client.k401Balance)}`);
  if (client.taxableAssets) lines.push(`Taxable Assets: ${formatCurrency(client.taxableAssets)}`);
  if (client.realEstateEquity) lines.push(`Real Estate Equity: ${formatCurrency(client.realEstateEquity)}`);
  if (client.lifeInsuranceCv) lines.push(`Life Insurance Cash Value: ${formatCurrency(client.lifeInsuranceCv)}`);
  if (client.lifeInsuranceDb) lines.push(`Life Insurance Death Benefit: ${formatCurrency(client.lifeInsuranceDb)}`);
  if (client.mortgageBalance) lines.push(`Mortgage Balance: ${formatCurrency(client.mortgageBalance)}`);
  if (client.mortgageRate) lines.push(`Mortgage Rate: ${client.mortgageRate}%`);
  if (client.socialSecurityEstimate) lines.push(`Social Security Estimate: ${formatCurrency(client.socialSecurityEstimate)}/mo`);
  if (client.annuityValue) lines.push(`Annuity Value: ${formatCurrency(client.annuityValue)}`);
  if (client.monthlyExpenses) lines.push(`Monthly Expenses: ${formatCurrency(client.monthlyExpenses)}`);
  if (client.cashSavings) lines.push(`Cash Savings: ${formatCurrency(client.cashSavings)}`);
  return lines.join("\n");
}

function buildStrategyContext(strategy: StrategyDataForScript): string {
  const lines: string[] = [];
  if (strategy.summary) lines.push(`Strategy Summary: ${strategy.summary}`);
  if (strategy.taxPlan) lines.push(`Tax Plan: ${strategy.taxPlan}`);
  if (strategy.insurancePlan) lines.push(`Insurance Plan: ${strategy.insurancePlan}`);
  if (strategy.investmentPlan) lines.push(`Investment Plan: ${strategy.investmentPlan}`);
  if (strategy.projectedTaxSavings) lines.push(`Projected Tax Savings: ${formatCurrency(strategy.projectedTaxSavings)}`);
  if (strategy.projectedEquityGrowth) lines.push(`Projected Equity Growth: ${formatCurrency(strategy.projectedEquityGrowth)}`);
  if (strategy.projectedIncome) lines.push(`Projected Income: ${formatCurrency(strategy.projectedIncome)}`);
  if (strategy.projectedDeathBenefit) lines.push(`Projected Death Benefit: ${formatCurrency(strategy.projectedDeathBenefit)}`);
  if (strategy.projectedCashValue) lines.push(`Projected Cash Value: ${formatCurrency(strategy.projectedCashValue)}`);
  if (strategy.interestSaved) lines.push(`Interest Saved: ${formatCurrency(strategy.interestSaved)}`);
  if (strategy.netPositiveResult) lines.push(`Net Positive Result: ${formatCurrency(strategy.netPositiveResult)}`);
  if (strategy.twentyYearProjection?.length) {
    lines.push(`\n20-Year Projection Milestones:`);
    for (const yr of strategy.twentyYearProjection) {
      lines.push(`  Year ${yr.year}: Net Worth ${formatCurrency(yr.netWorth)}, Tax Savings ${formatCurrency(yr.taxSavings)}, Income ${formatCurrency(yr.income)}`);
    }
  }
  return lines.join("\n");
}

export async function generateChapterScripts(
  client: ClientDataForScript,
  strategy: StrategyDataForScript,
  advisorName: string,
  chapterTypes?: Array<keyof typeof CHAPTER_TEMPLATES>,
): Promise<ChapterScript[]> {
  const types = chapterTypes || ["introduction", "current_situation", "recommended_strategy", "twenty_year_projection", "next_steps"];
  const clientContext = buildClientContext(client);
  const strategyContext = buildStrategyContext(strategy);
  
  const scripts: ChapterScript[] = [];
  
  for (const type of types) {
    const template = CHAPTER_TEMPLATES[type];
    if (!template) continue;
    
    const userPrompt = `Generate a video script chapter for a financial proposal video.

Advisor Name: ${advisorName}

CLIENT DATA:
${clientContext}

STRATEGY DATA:
${strategyContext}

Write the script as natural spoken text that the advisor avatar will speak. 
Address the client by their first name. Be specific with their numbers.
Do not include stage directions, timestamps, or formatting — just the spoken words.`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: template.systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      
      const rawContent = response?.choices?.[0]?.message?.content;
      const script = typeof rawContent === "string" ? rawContent : "";
      const wordCount = script.split(/\s+/).length;
      const durationEstimate = Math.ceil(wordCount / 2.5); // ~150 words per minute = 2.5 words per second
      
      scripts.push({
        chapterType: type,
        title: template.title,
        script: script.trim(),
        durationEstimate,
      });
    } catch (error) {
      console.error(`[VideoScript] Failed to generate ${type} chapter:`, error);
      scripts.push({
        chapterType: type,
        title: template.title,
        script: `[Script generation failed for ${template.title}. Please edit manually.]`,
        durationEstimate: 30,
      });
    }
  }
  
  return scripts;
}

export async function regenerateChapterScript(
  chapterType: keyof typeof CHAPTER_TEMPLATES,
  client: ClientDataForScript,
  strategy: StrategyDataForScript,
  advisorName: string,
  customInstructions?: string,
): Promise<ChapterScript> {
  const template = CHAPTER_TEMPLATES[chapterType];
  if (!template) throw new Error(`Unknown chapter type: ${chapterType}`);
  
  const clientContext = buildClientContext(client);
  const strategyContext = buildStrategyContext(strategy);
  
  let systemPrompt = template.systemPrompt;
  if (customInstructions) {
    systemPrompt += `\n\nAdditional instructions from the advisor: ${customInstructions}`;
  }
  
  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a video script chapter for a financial proposal video.

Advisor Name: ${advisorName}

CLIENT DATA:
${clientContext}

STRATEGY DATA:
${strategyContext}

Write the script as natural spoken text. Address the client by their first name. Be specific with their numbers.` },
    ],
  });
  
  const rawContent2 = response?.choices?.[0]?.message?.content;
  const script = typeof rawContent2 === "string" ? rawContent2 : "";
  const wordCount = script.split(/\s+/).length;
  
  return {
    chapterType,
    title: template.title,
    script: script.trim(),
    durationEstimate: Math.ceil(wordCount / 2.5),
  };
}
