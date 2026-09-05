import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useCalcResults, CALCULATOR_RELATIONSHIPS, type FinancialHealthScore } from '../components/CalculatorIntegration';
import { useUnifiedDataBus, type DataEntry, FEATURE_RELATIONSHIPS } from './UnifiedDataBusContext';

type ConnectionStatus = 'connected' | 'syncing' | 'offline';

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  pageContext: string;
  relatedTools: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'tax' | 'retirement' | 'debt' | 'insurance' | 'investment' | 'estate' | 'physician' | 'si-engine' | 'ai-pro' | 'cross-feature';
}

interface CalculatorResultEntry {
  calculatorId: string;
  result: Record<string, number>;
  timestamp: number;
}

interface AIBrainState {
  connectionStatus: ConnectionStatus;
  activeCalculators: number;
  activeSIEngines: number;
  activeAIProFeatures: number;
  totalConnectedFeatures: number;
  dataPointsProcessed: number;
  confidenceScore: number;
  lastSync: Date;
  recommendations: AIRecommendation[];
  pageConnections: Map<string, ConnectionStatus>;
  calculatorResults: CalculatorResultEntry[];
  financialHealthScore: number;
  healthBreakdown: { category: string; score: number; label: string }[];
  unifiedDataSnapshot: DataEntry[];
}

interface AIBrainContextType {
  state: AIBrainState;
  getRecommendations: (pageContext: string) => AIRecommendation[];
  getAllRecommendations: () => AIRecommendation[];
  reportData: (pageContext: string, data: any) => void;
  reportCalculatorResult: (calculatorId: string, result: Record<string, number>) => void;
  checkConnection: () => ConnectionStatus;
  getCrossToolSuggestions: (pageContext: string) => string[];
  getFinancialHealth: () => { score: number; breakdown: { category: string; score: number; label: string }[] };
  getUnifiedSnapshot: () => { calculators: number; siEngines: number; aiProFeatures: number; totalDataPoints: number; entries: DataEntry[] };
}

const AIBrainContext = createContext<AIBrainContextType | undefined>(undefined);

const FALLBACK_AI_BRAIN: AIBrainContextType = {
  state: {
    connectionStatus: 'offline' as ConnectionStatus,
    activeCalculators: 0,
    activeSIEngines: 0,
    activeAIProFeatures: 0,
    totalConnectedFeatures: 0,
    dataPointsProcessed: 0,
    confidenceScore: 0,
    lastSync: new Date(),
    recommendations: [],
    pageConnections: new Map(),
    calculatorResults: [],
    financialHealthScore: 0,
    healthBreakdown: [],
    unifiedDataSnapshot: [],
  },
  getRecommendations: () => [],
  getAllRecommendations: () => [],
  reportData: () => {},
  reportCalculatorResult: () => {},
  checkConnection: () => 'offline' as ConnectionStatus,
  getCrossToolSuggestions: () => [],
  getFinancialHealth: () => ({ score: 0, breakdown: [] }),
  getUnifiedSnapshot: () => ({ calculators: 0, siEngines: 0, aiProFeatures: 0, totalDataPoints: 0, entries: [] }),
};

export const useAIBrain = () => {
  const context = useContext(AIBrainContext);
  if (context === undefined) {
    return FALLBACK_AI_BRAIN;
  }
  return context;
};

// ─── Generate recommendations from calculator results ─────────────────────────
function generateCalcRecommendations(results: CalculatorResultEntry[]): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  let id = 1;
  const getResult = (calcId: string) => results.find(r => r.calculatorId === calcId)?.result;

  const marginalTax = getResult('marginal-tax-rate');
  const rothConversion = getResult('roth-conversion');
  if (marginalTax && marginalTax.effectiveRate > 30) {
    recs.push({
      id: `calc-${id++}`, title: 'High Tax Burden Detected',
      description: `Your effective tax rate is ${marginalTax.effectiveRate?.toFixed(1)}%. Consider Roth conversions, tax-loss harvesting, and charitable giving strategies to reduce your tax liability by $${((marginalTax.totalTax || 0) * 0.15).toLocaleString()}/year.`,
      confidence: 94, pageContext: 'tax-optimization', relatedTools: ['Roth Conversion', 'Tax-Loss Harvesting', 'Charitable Giving'],
      priority: 'critical', category: 'tax'
    });
  }
  if (rothConversion && rothConversion.taxSavings > 50000) {
    recs.push({
      id: `calc-${id++}`, title: 'Roth Conversion Opportunity',
      description: `Analysis shows potential lifetime tax savings of $${rothConversion.taxSavings?.toLocaleString()} through strategic Roth conversions. Optimal conversion amount: $${rothConversion.optimalConversion?.toLocaleString()}/year.`,
      confidence: 91, pageContext: 'roth-conversion', relatedTools: ['Marginal Tax Rate', 'RMD Calculator'],
      priority: 'high', category: 'tax'
    });
  }

  const fire = getResult('fire-calculator');
  const retirement = getResult('retirement-savings');
  if (fire && fire.yearsToFIRE > 20) {
    recs.push({
      id: `calc-${id++}`, title: 'Retirement Gap Alert',
      description: `At current savings rate, FIRE target is ${fire.yearsToFIRE?.toFixed(0)} years away. Increasing savings by 5% or optimizing investment returns could reduce this by ${Math.min(5, fire.yearsToFIRE * 0.2).toFixed(0)} years.`,
      confidence: 87, pageContext: 'retirement', relatedTools: ['FIRE Calculator', 'Compound Interest', '401k Optimizer'],
      priority: 'high', category: 'retirement'
    });
  }
  if (retirement && retirement.projectedBalance < retirement.targetBalance * 0.7) {
    recs.push({
      id: `calc-${id++}`, title: 'Retirement Savings Shortfall',
      description: `Projected retirement balance ($${(retirement.projectedBalance || 0).toLocaleString()}) is ${((1 - (retirement.projectedBalance || 0) / (retirement.targetBalance || 1)) * 100).toFixed(0)}% below target. Consider maximizing 401(k) contributions and catch-up contributions if over 50.`,
      confidence: 89, pageContext: 'retirement-savings', relatedTools: ['401k Optimizer', 'Backdoor Roth', 'Mega Backdoor Roth'],
      priority: 'critical', category: 'retirement'
    });
  }

  const debtPayoff = getResult('debt-payoff-optimizer');
  const studentLoan = getResult('student-loan-vs-invest');
  if (debtPayoff && debtPayoff.totalInterestPaid > 100000) {
    recs.push({
      id: `calc-${id++}`, title: 'Debt Interest Optimization',
      description: `You're projected to pay $${debtPayoff.totalInterestPaid?.toLocaleString()} in interest. Switching to avalanche method could save $${((debtPayoff.totalInterestPaid || 0) * 0.12).toLocaleString()} in interest charges.`,
      confidence: 85, pageContext: 'debt-optimization', relatedTools: ['Debt Payoff Optimizer', 'Student Loan vs Invest'],
      priority: 'high', category: 'debt'
    });
  }
  if (studentLoan && studentLoan.investAdvantage > 0) {
    recs.push({
      id: `calc-${id++}`, title: 'Invest vs. Pay Down Student Loans',
      description: `Analysis shows investing excess cash produces $${studentLoan.investAdvantage?.toLocaleString()} more wealth over 30 years vs. accelerated loan payoff. Consider minimum payments + investing the difference.`,
      confidence: 82, pageContext: 'student-loans', relatedTools: ['Student Loan vs Invest', 'PSLF Calculator', 'IDR Comparison'],
      priority: 'medium', category: 'debt'
    });
  }

  const disability = getResult('own-occ-disability');
  const lifeInsurance = getResult('life-insurance-needs');
  if (disability && disability.coverageGap > 50000) {
    recs.push({
      id: `calc-${id++}`, title: 'Disability Coverage Gap',
      description: `Your own-occupation disability coverage is $${disability.coverageGap?.toLocaleString()}/year below recommended levels. As a physician, own-occ coverage is critical to protect your specialty income.`,
      confidence: 93, pageContext: 'disability-insurance', relatedTools: ['Own-Occ Disability', 'Life Insurance Needs'],
      priority: 'critical', category: 'insurance'
    });
  }
  if (lifeInsurance && lifeInsurance.coverageGap > 500000) {
    recs.push({
      id: `calc-${id++}`, title: 'Life Insurance Shortfall',
      description: `Life insurance gap of $${lifeInsurance.coverageGap?.toLocaleString()} detected. Your dependents would face a significant financial shortfall. Consider term life to cover the gap at approximately $${((lifeInsurance.coverageGap || 0) / 1000000 * 50).toFixed(0)}/month.`,
      confidence: 90, pageContext: 'life-insurance', relatedTools: ['Life Insurance Needs', 'Estate Tax Calculator'],
      priority: 'high', category: 'insurance'
    });
  }

  const compoundInterest = getResult('compound-interest');
  if (compoundInterest && compoundInterest.futureValue > 1000000) {
    recs.push({
      id: `calc-${id++}`, title: 'Compound Growth Projection',
      description: `Your investments are projected to grow to $${compoundInterest.futureValue?.toLocaleString()} over 50 years. Tax-advantaged accounts could add an additional $${((compoundInterest.futureValue || 0) * 0.08).toLocaleString()} through tax-deferred compounding.`,
      confidence: 86, pageContext: 'investment-growth', relatedTools: ['Compound Interest', 'Asset Allocation', 'Tax-Loss Harvesting'],
      priority: 'medium', category: 'investment'
    });
  }

  const estateTax = getResult('estate-tax-calculator');
  if (estateTax && estateTax.estimatedEstateTax > 100000) {
    recs.push({
      id: `calc-${id++}`, title: 'Estate Tax Exposure',
      description: `Estimated estate tax liability of $${estateTax.estimatedEstateTax?.toLocaleString()}. Irrevocable life insurance trusts (ILITs), GRATs, and charitable remainder trusts could reduce this by 40-60%.`,
      confidence: 88, pageContext: 'estate-planning', relatedTools: ['Estate Tax Calculator', 'Trust Comparison', 'Charitable Giving'],
      priority: 'high', category: 'estate'
    });
  }

  const pslf = getResult('pslf-calculator');
  if (pslf && pslf.totalForgiveness > 100000) {
    recs.push({
      id: `calc-${id++}`, title: 'PSLF Forgiveness Opportunity',
      description: `You qualify for $${pslf.totalForgiveness?.toLocaleString()} in Public Service Loan Forgiveness. Ensure you're on the optimal IDR plan and making qualifying payments. ${pslf.paymentsRemaining || 0} payments remaining.`,
      confidence: 91, pageContext: 'pslf', relatedTools: ['PSLF Calculator', 'IDR Comparison', 'Student Loan vs Invest'],
      priority: 'critical', category: 'physician'
    });
  }

  const contract = getResult('physician-contract');
  if (contract && contract.totalCompensation > 0) {
    recs.push({
      id: `calc-${id++}`, title: 'Contract Optimization',
      description: `Your total first-year compensation is $${contract.totalCompensation?.toLocaleString()}. Consider negotiating wRVU thresholds, signing bonus structure, and tail coverage to maximize long-term value.`,
      confidence: 84, pageContext: 'physician-contract', relatedTools: ['Physician Contract Analyzer', 'Marginal Tax Rate'],
      priority: 'medium', category: 'physician'
    });
  }

  return recs;
}

// ─── Generate recommendations from SI engine data ─────────────────────────────
function generateSIRecommendations(siEntries: DataEntry[]): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  let id = 1;

  for (const entry of siEntries) {
    const p = entry.payload;
    
    // IUL Compliance
    if (entry.featureId === 'si-iul-compliance' && typeof p.complianceScore === 'number') {
      if (p.complianceScore < 70) {
        recs.push({
          id: `si-${id++}`, title: 'IUL Compliance Risk Detected',
          description: `Compliance score of ${p.complianceScore}/100 indicates potential regulatory issues. ${p.violations || 0} violations found. Review illustration assumptions and suitability documentation immediately.`,
          confidence: 95, pageContext: 'iul-compliance', relatedTools: ['Risk Dashboard', 'Compliance Command Center'],
          priority: 'critical', category: 'si-engine'
        });
      }
    }

    // Carrier Strength
    if (entry.featureId === 'si-carrier-strength' && typeof p.overallRating === 'number') {
      if (p.overallRating < 75) {
        recs.push({
          id: `si-${id++}`, title: 'Carrier Strength Warning',
          description: `Carrier overall rating is ${p.overallRating}/100. Consider diversifying across stronger-rated carriers for client protection. Financial strength and claims-paying ability should be monitored.`,
          confidence: 90, pageContext: 'carrier-strength', relatedTools: ['Risk Dashboard', 'Moat Fortress'],
          priority: 'high', category: 'si-engine'
        });
      }
    }

    // Client Retention
    if (entry.featureId === 'si-client-retention' && typeof p.churnRisk === 'number') {
      if (p.churnRisk > 60) {
        recs.push({
          id: `si-${id++}`, title: 'High Client Churn Risk',
          description: `Churn risk score is ${p.churnRisk}%. Engagement score: ${p.engagementScore || 'N/A'}. Immediate outreach recommended. Use the Client Retention Assistant for targeted follow-up strategies.`,
          confidence: 88, pageContext: 'client-retention', relatedTools: ['Client Retention Assistant', 'AI Deal Closer', 'Client Journey Navigator'],
          priority: 'critical', category: 'si-engine'
        });
      }
    }

    // Generational Wealth
    if (entry.featureId === 'si-generational-wealth' && typeof p.totalLegacyValue === 'number') {
      recs.push({
        id: `si-${id++}`, title: 'Generational Wealth Projection',
        description: `Multi-generational wealth projection shows $${Number(p.totalLegacyValue).toLocaleString()} legacy value. Use the Wealth Simulator and Heartfire Legacy Forge to explore dynasty trust and ILIT strategies.`,
        confidence: 85, pageContext: 'generational-wealth', relatedTools: ['Wealth Simulator', 'Heartfire Legacy Forge', 'Legacy Vault'],
        priority: 'medium', category: 'si-engine'
      });
    }

    // Premium Financing
    if (entry.featureId === 'si-premium-financing' && typeof p.arbitrageSpread === 'number') {
      if (p.arbitrageSpread > 2) {
        recs.push({
          id: `si-${id++}`, title: 'Premium Financing Opportunity',
          description: `Arbitrage spread of ${p.arbitrageSpread}% detected. Net benefit: $${Number(p.netBenefit || 0).toLocaleString()}. This strategy could significantly enhance policy funding efficiency.`,
          confidence: 87, pageContext: 'premium-financing', relatedTools: ['AI Strategy Lab Pro', 'Engine Fusion Lab'],
          priority: 'high', category: 'si-engine'
        });
      }
    }

    // Behavioral Bias
    if (entry.featureId === 'si-behavioral-bias' && typeof p.biasScore === 'number') {
      if (p.biasScore > 50) {
        recs.push({
          id: `si-${id++}`, title: 'Behavioral Bias Alert',
          description: `Behavioral bias score of ${p.biasScore}/100 detected. Key biases: ${p.dominantBias || 'loss aversion, anchoring'}. Use Financial DNA Profiler to build a bias-aware strategy.`,
          confidence: 83, pageContext: 'behavioral-bias', relatedTools: ['Financial DNA Profiler', 'Persona Hub'],
          priority: 'medium', category: 'si-engine'
        });
      }
    }

    // Disability Gap
    if (entry.featureId === 'si-disability-gap' && typeof p.monthlyGap === 'number') {
      if (p.monthlyGap > 3000) {
        recs.push({
          id: `si-${id++}`, title: 'Disability Income Gap',
          description: `Monthly disability income gap of $${Number(p.monthlyGap).toLocaleString()} identified. This represents ${p.gapPercentage || 'significant'}% of your income. Own-occupation coverage is essential for physicians.`,
          confidence: 92, pageContext: 'disability-gap', relatedTools: ['Risk Dashboard', 'Compliance Command Center'],
          priority: 'critical', category: 'si-engine'
        });
      }
    }
  }

  return recs;
}

// ─── Generate recommendations from AI Pro Suite data ──────────────────────────
function generateAIProRecommendations(aiProEntries: DataEntry[]): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  let id = 1;

  for (const entry of aiProEntries) {
    const p = entry.payload;

    // Risk Dashboard
    if (entry.featureId === 'ai-pro-risk-dashboard' && typeof p.overallRiskScore === 'number') {
      if (p.overallRiskScore > 70) {
        recs.push({
          id: `aipro-${id++}`, title: 'Elevated Portfolio Risk',
          description: `Overall risk score is ${p.overallRiskScore}/100. ${p.criticalAlerts || 0} critical alerts detected. Review the Risk Dashboard for detailed compliance and carrier analysis.`,
          confidence: 91, pageContext: 'risk-dashboard', relatedTools: ['Compliance Command Center', 'Moat Fortress'],
          priority: 'critical', category: 'ai-pro'
        });
      }
    }

    // Strategy Lab
    if (entry.featureId === 'ai-pro-strategy-lab' && typeof p.scenariosRun === 'number') {
      if (p.scenariosRun > 0) {
        recs.push({
          id: `aipro-${id++}`, title: 'Strategy Lab Results Available',
          description: `${p.scenariosRun} multi-engine scenarios analyzed. Best strategy: ${p.bestStrategy || 'balanced approach'}. Use the Presentation Vault to package these results for client delivery.`,
          confidence: 86, pageContext: 'strategy-lab', relatedTools: ['Presentation Vault', 'AI Deal Closer', 'Engine Fusion Lab'],
          priority: 'medium', category: 'ai-pro'
        });
      }
    }

    // Client Retention Assistant
    if (entry.featureId === 'ai-pro-retention-assistant' && typeof p.atRiskClients === 'number') {
      if (p.atRiskClients > 0) {
        recs.push({
          id: `aipro-${id++}`, title: 'At-Risk Clients Identified',
          description: `${p.atRiskClients} clients flagged as at-risk for churn. Average engagement score: ${p.avgEngagement || 'N/A'}. Immediate outreach recommended via Client Journey Navigator.`,
          confidence: 89, pageContext: 'retention-assistant', relatedTools: ['Client Journey Navigator', 'AI Deal Closer', 'Peer Trust Network'],
          priority: 'high', category: 'ai-pro'
        });
      }
    }

    // Impact Scorecard
    if (entry.featureId === 'ai-pro-impact-scorecard' && typeof p.overallScore === 'number') {
      recs.push({
        id: `aipro-${id++}`, title: 'Impact Score Update',
        description: `Your overall impact score is ${p.overallScore}/100. ${p.achievementsUnlocked || 0} achievements unlocked. Use the Mastery Nexus to identify areas for improvement.`,
        confidence: 84, pageContext: 'impact-scorecard', relatedTools: ['Mastery Nexus', 'Wealth Warrior Challenges', 'Financial Fluency Academy'],
        priority: 'medium', category: 'ai-pro'
      });
    }
  }

  return recs;
}

// ─── Generate cross-feature recommendations ───────────────────────────────────
function generateCrossFeatureRecommendations(
  calcEntries: CalculatorResultEntry[],
  siEntries: DataEntry[],
  aiProEntries: DataEntry[]
): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  let id = 1;

  const hasCalcData = calcEntries.length > 0;
  const hasSIData = siEntries.length > 0;
  const hasAIProData = aiProEntries.length > 0;
  const totalSources = (hasCalcData ? 1 : 0) + (hasSIData ? 1 : 0) + (hasAIProData ? 1 : 0);

  // Cross-feature: Calculator + SI Engine synergy
  const hasRetirement = calcEntries.some(e => e.calculatorId.includes('retirement') || e.calculatorId.includes('fire'));
  const hasGenWealth = siEntries.some(e => e.featureId === 'si-generational-wealth');
  if (hasRetirement && hasGenWealth) {
    recs.push({
      id: `cross-${id++}`, title: 'Retirement + Legacy Synergy Detected',
      description: 'Your retirement projections and generational wealth analysis are both active. The AI Brain has identified optimization opportunities by combining these data streams. Visit the Wealth Projection Theater for a cinematic view.',
      confidence: 92, pageContext: 'cross-feature', relatedTools: ['Wealth Projection Theater', 'Generational Wealth Simulator', 'Heartfire Legacy Forge'],
      priority: 'high', category: 'cross-feature'
    });
  }

  // Cross-feature: Tax + Insurance synergy
  const hasTaxData = calcEntries.some(e => e.calculatorId.includes('tax') || e.calculatorId.includes('roth'));
  const hasInsuranceData = siEntries.some(e => e.featureId.includes('iul') || e.featureId.includes('carrier'));
  if (hasTaxData && hasInsuranceData) {
    recs.push({
      id: `cross-${id++}`, title: 'Tax-Optimized Insurance Strategy',
      description: 'Tax analysis and insurance engine data are both flowing. The AI Brain can model tax-advantaged insurance strategies including IUL cash value optimization and premium financing arbitrage.',
      confidence: 89, pageContext: 'cross-feature', relatedTools: ['AI Strategy Lab Pro', 'Engine Fusion Lab', 'Risk Dashboard'],
      priority: 'high', category: 'cross-feature'
    });
  }

  // Cross-feature: All three data sources active
  if (totalSources === 3) {
    recs.push({
      id: `cross-${id++}`, title: 'Full Data Fusion Active',
      description: `All ${calcEntries.length + siEntries.length + aiProEntries.length} data sources are feeding the AI Brain. Holistic recommendations are at maximum accuracy. Visit the Executive Command Center for your unified dashboard.`,
      confidence: 96, pageContext: 'full-fusion', relatedTools: ['Executive Command Center', 'Mastery Nexus', 'AI Wealth Concierge'],
      priority: 'high', category: 'cross-feature'
    });
  }

  // Suggest missing data sources
  if (!hasCalcData && (hasSIData || hasAIProData)) {
    recs.push({
      id: `cross-${id++}`, title: 'Calculator Data Missing',
      description: 'SI engines and AI Pro features are active, but no calculator results have been submitted. Run key calculators (Tax, Retirement, Insurance) to unlock full cross-feature intelligence.',
      confidence: 95, pageContext: 'onboarding', relatedTools: ['Marginal Tax Rate', 'Retirement Savings', 'FIRE Calculator'],
      priority: 'high', category: 'cross-feature'
    });
  }

  if (!hasSIData && hasCalcData) {
    recs.push({
      id: `cross-${id++}`, title: 'Unlock Sister Invention Insights',
      description: 'Calculator data is flowing but no SI engine results detected. Run the IUL Compliance, Carrier Strength, or Client Retention engines to unlock deeper cross-feature analysis.',
      confidence: 90, pageContext: 'onboarding', relatedTools: ['Risk Dashboard', 'Client Retention Assistant', 'Compliance Command Center'],
      priority: 'medium', category: 'cross-feature'
    });
  }

  return recs;
}

export const AIBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AIBrainState>({
    connectionStatus: 'syncing',
    activeCalculators: 105,
    activeSIEngines: 0,
    activeAIProFeatures: 0,
    totalConnectedFeatures: 0,
    dataPointsProcessed: 0,
    confidenceScore: 85,
    lastSync: new Date(),
    recommendations: [],
    pageConnections: new Map<string, ConnectionStatus>(),
    calculatorResults: [],
    financialHealthScore: 0,
    healthBreakdown: [],
    unifiedDataSnapshot: [],
  });

  // ─── Consume calculator results ──────────────────────────────────────────
  let calcResults: Record<string, { route: string; timestamp: number; summary: Record<string, any> }> = {};
  let calcHealthScore: FinancialHealthScore | null = null;
  try {
    const ctx = useCalcResults();
    calcResults = ctx.results;
    calcHealthScore = ctx.getFinancialHealthScore();
  } catch {
    // CalculatorResultsProvider may not be available yet
  }

  // ─── Consume UnifiedDataBus ──────────────────────────────────────────────
  let busEntries: DataEntry[] = [];
  let busTotalDataPoints = 0;
  try {
    const bus = useUnifiedDataBus();
    busEntries = bus.getAllEntries();
    busTotalDataPoints = bus.getTotalDataPoints();
  } catch {
    // UnifiedDataBusProvider may not be available yet
  }

  const siEntries = useMemo(() => busEntries.filter(e => e.category === 'si-engine'), [busEntries]);
  const aiProEntries = useMemo(() => busEntries.filter(e => e.category === 'ai-pro-suite'), [busEntries]);
  const calcBusEntries = useMemo(() => busEntries.filter(e => e.category === 'calculator'), [busEntries]);

  // ─── Build calculator result entries ─────────────────────────────────────
  const resultEntries = useMemo(() => {
    return Object.entries(calcResults).map(([calcId, data]) => ({
      calculatorId: calcId,
      result: data.summary as Record<string, number>,
      timestamp: data.timestamp,
    }));
  }, [calcResults]);

  // ─── Generate ALL recommendations from all sources ───────────────────────
  const allRecommendations = useMemo(() => {
    const calcRecs = generateCalcRecommendations(resultEntries);
    const siRecs = generateSIRecommendations(siEntries);
    const aiProRecs = generateAIProRecommendations(aiProEntries);
    const crossRecs = generateCrossFeatureRecommendations(resultEntries, siEntries, aiProEntries);

    const combined = [...calcRecs, ...siRecs, ...aiProRecs, ...crossRecs];

    // Default recommendations if nothing is active yet
    if (combined.length === 0) {
      combined.push(
        { id: 'default-1', title: 'Start Your Financial Physical', description: 'Run 3-5 key calculators to unlock personalized AI recommendations. Start with Marginal Tax Rate, Retirement Savings, and Debt Payoff.', confidence: 95, pageContext: 'onboarding', relatedTools: ['Marginal Tax Rate', 'Retirement Savings', 'Debt Payoff'], priority: 'high', category: 'tax' },
        { id: 'default-2', title: 'Activate Sister Invention Engines', description: 'Run the IUL Compliance, Carrier Strength, and Client Retention engines to unlock AI-powered cross-feature insights.', confidence: 90, pageContext: 'si-engines', relatedTools: ['Risk Dashboard', 'Client Retention Assistant', 'Compliance Command Center'], priority: 'high', category: 'si-engine' },
        { id: 'default-3', title: 'Explore AI Pro Suite', description: 'Visit the Executive Command Center, AI Strategy Lab Pro, or Engine Fusion Lab to experience the full power of the interconnected platform.', confidence: 88, pageContext: 'ai-pro-suite', relatedTools: ['Executive Command Center', 'AI Strategy Lab Pro', 'Engine Fusion Lab'], priority: 'medium', category: 'ai-pro' },
      );
    }

    return combined.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [resultEntries, siEntries, aiProEntries]);

  // ─── Health data ─────────────────────────────────────────────────────────
  const healthData = useMemo(() => {
    if (calcHealthScore) {
      return {
        overall: calcHealthScore.overall,
        breakdown: Object.entries(calcHealthScore.categories).map(([cat, score]) => ({
          category: cat,
          score: score as number,
          label: cat.replace(/([A-Z])/g, ' $1').trim(),
        })),
      };
    }
    return { overall: 0, breakdown: [] as { category: string; score: number; label: string }[] };
  }, [calcHealthScore]);

  // ─── Sync state ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const totalDataPoints = resultEntries.length + busTotalDataPoints;
      const activeSI = siEntries.length;
      const activeAIPro = aiProEntries.length;
      const totalConnected = resultEntries.length + activeSI + activeAIPro + calcBusEntries.length;
      
      // Confidence scales with data sources
      const baseConfidence = 85;
      const dataBonus = Math.min(10, totalConnected * 0.5);
      const sourceBonus = (resultEntries.length > 0 ? 2 : 0) + (activeSI > 0 ? 2 : 0) + (activeAIPro > 0 ? 1 : 0);

      setState(prev => ({
        ...prev,
        connectionStatus: 'connected',
        recommendations: allRecommendations,
        dataPointsProcessed: totalDataPoints,
        activeSIEngines: activeSI,
        activeAIProFeatures: activeAIPro,
        totalConnectedFeatures: totalConnected,
        confidenceScore: Math.min(99, baseConfidence + dataBonus + sourceBonus),
        financialHealthScore: healthData.overall,
        healthBreakdown: healthData.breakdown,
        unifiedDataSnapshot: busEntries,
        lastSync: prev.lastSync,
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [allRecommendations, resultEntries.length, healthData, busEntries.length, busTotalDataPoints, siEntries.length, aiProEntries.length, calcBusEntries.length]);

  // Update lastSync only once on mount
  useEffect(() => {
    setState(prev => ({ ...prev, lastSync: new Date() }));
  }, []);

  // ─── Context methods ─────────────────────────────────────────────────────
  const getRecommendations = useCallback(
    (pageContext: string) => state.recommendations.filter(r =>
      r.pageContext === pageContext ||
      r.relatedTools.some(t => t.toLowerCase().includes(pageContext.toLowerCase()))
    ),
    [state.recommendations]
  );

  const getAllRecommendations = useCallback(() => state.recommendations, [state.recommendations]);

  const reportDataRef = useRef<Set<string>>(new Set());
  const reportData = useCallback((pageContext: string, _data: any) => {
    // Deduplicate: only update state once per unique pageContext
    if (reportDataRef.current.has(pageContext)) return;
    reportDataRef.current.add(pageContext);
    setState(prev => {
      const updatedConnections = new Map(prev.pageConnections);
      if (updatedConnections.get(pageContext) === 'connected') return prev; // no-op if already connected
      updatedConnections.set(pageContext, 'connected');
      return {
        ...prev,
        dataPointsProcessed: prev.dataPointsProcessed + 1,
        pageConnections: updatedConnections,
      };
    });
  }, []);

  const reportCalculatorResult = useCallback((calculatorId: string, result: Record<string, number>) => {
    setState(prev => {
      const existing = prev.calculatorResults.filter(r => r.calculatorId !== calculatorId);
      const updated = [...existing, { calculatorId, result, timestamp: Date.now() }];
      return {
        ...prev,
        calculatorResults: updated,
        dataPointsProcessed: prev.dataPointsProcessed + 1,
        lastSync: new Date(),
      };
    });
  }, []);

  const checkConnection = useCallback(() => state.connectionStatus, [state.connectionStatus]);

  const getCrossToolSuggestions = useCallback(
    (pageContext: string) => {
      // Check CALCULATOR_RELATIONSHIPS first
      const relationships = CALCULATOR_RELATIONSHIPS[pageContext] || [];
      if (relationships.length > 0) {
        return relationships.slice(0, 3).map(rel =>
          `Based on your ${pageContext.replace(/-/g, ' ')} results, run the ${rel.replace(/-/g, ' ')} calculator next for deeper insights.`
        );
      }
      // Check FEATURE_RELATIONSHIPS from the UnifiedDataBus
      const featureRels = FEATURE_RELATIONSHIPS.filter(r => r.sourceId === pageContext || r.targetId === pageContext);
      if (featureRels.length > 0) {
        return featureRels.slice(0, 3).map(rel => {
          const other = rel.sourceId === pageContext ? rel.targetId : rel.sourceId;
          return `${other.replace(/-/g, ' ')} ${rel.relationship.replace(/-/g, ' ')}s this feature. Run it for enhanced cross-feature intelligence.`;
        });
      }
      const related = state.recommendations.find(r => r.pageContext === pageContext)?.relatedTools || [];
      return related.map(tool => `Based on ${pageContext} results, try ${tool} next.`);
    },
    [state.recommendations]
  );

  const getFinancialHealth = useCallback(() => ({
    score: state.financialHealthScore,
    breakdown: state.healthBreakdown,
  }), [state.financialHealthScore, state.healthBreakdown]);

  const getUnifiedSnapshot = useCallback(() => ({
    calculators: resultEntries.length + calcBusEntries.length,
    siEngines: siEntries.length,
    aiProFeatures: aiProEntries.length,
    totalDataPoints: state.dataPointsProcessed,
    entries: busEntries,
  }), [resultEntries.length, calcBusEntries.length, siEntries.length, aiProEntries.length, state.dataPointsProcessed, busEntries]);

  const value = {
    state,
    getRecommendations,
    getAllRecommendations,
    reportData,
    reportCalculatorResult,
    checkConnection,
    getCrossToolSuggestions,
    getFinancialHealth,
    getUnifiedSnapshot,
  };

  return <AIBrainContext.Provider value={value}>{children}</AIBrainContext.Provider>;
};

// ─── AI Advisor Floating Widget ───────────────────────────────────────────────
export const AIAdvisorWidget: React.FC = () => {
  const { state, getAllRecommendations, getFinancialHealth, getUnifiedSnapshot } = useAIBrain();
  const [isExpanded, setIsExpanded] = useState(false);
  const allRecs = getAllRecommendations();
  const health = getFinancialHealth();
  const snapshot = getUnifiedSnapshot();

  const priorityColors = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-amber-500/50 bg-amber-500/10',
    medium: 'border-blue-500/50 bg-blue-500/10',
    low: 'border-gray-500/50 bg-gray-500/10',
  };

  const priorityBadge = {
    critical: 'bg-red-500 text-white',
    high: 'bg-amber-500 text-white',
    medium: 'bg-blue-500 text-white',
    low: 'bg-gray-500 text-white',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-[#1e293b]/95 backdrop-blur-md p-6 rounded-lg shadow-2xl w-[440px] max-h-[650px] overflow-y-auto border border-emerald-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-semibold flex items-center">
              AI Financial Advisor
              <span className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </h3>
            <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
          </div>

          {/* Unified Data Sources */}
          <div className="mb-4 p-3 bg-[#0f172a] rounded-lg border border-indigo-500/20">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Connected Data Sources</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-indigo-400 font-bold text-lg">{snapshot.calculators}</div>
                <div className="text-gray-500 text-[10px]">Calculators</div>
              </div>
              <div>
                <div className="text-purple-400 font-bold text-lg">{snapshot.siEngines}</div>
                <div className="text-gray-500 text-[10px]">SI Engines</div>
              </div>
              <div>
                <div className="text-cyan-400 font-bold text-lg">{snapshot.aiProFeatures}</div>
                <div className="text-gray-500 text-[10px]">AI Pro</div>
              </div>
            </div>
          </div>

          {/* Financial Health Score */}
          {health.score > 0 && (
            <div className="mb-4 p-3 bg-[#0f172a] rounded-lg border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm font-medium">Financial Health Score</span>
                <span className={`text-2xl font-bold ${health.score >= 80 ? 'text-emerald-400' : health.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                  {health.score}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${health.score >= 80 ? 'bg-emerald-500' : health.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${health.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 bg-[#0f172a] rounded text-center">
              <div className="text-emerald-400 font-bold text-lg">{state.dataPointsProcessed}</div>
              <div className="text-gray-400 text-xs">Data Points</div>
            </div>
            <div className="p-2 bg-[#0f172a] rounded text-center">
              <div className="text-emerald-400 font-bold text-lg">{allRecs.length}</div>
              <div className="text-gray-400 text-xs">Insights</div>
            </div>
            <div className="p-2 bg-[#0f172a] rounded text-center">
              <div className="text-emerald-400 font-bold text-lg">{state.confidenceScore}%</div>
              <div className="text-gray-400 text-xs">Confidence</div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3 mb-4">
            <h4 className="text-gray-300 text-sm font-semibold uppercase tracking-wider">AI Recommendations</h4>
            {allRecs.slice(0, 7).map(rec => (
              <div key={rec.id} className={`p-3 rounded-md border ${priorityColors[rec.priority]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityBadge[rec.priority]}`}>
                    {rec.priority}
                  </span>
                  <p className="text-white font-medium text-sm">{rec.title}</p>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">{rec.description}</p>
                {rec.relatedTools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.relatedTools.slice(0, 3).map(tool => (
                      <span key={tool} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">{tool}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {allRecs.length === 0 && (
            <div className="p-4 bg-[#0f172a] rounded-md text-center">
              <p className="text-gray-300 text-sm">Run calculators and SI engines to unlock personalized AI recommendations</p>
              <p className="text-gray-500 text-xs mt-1">Start with Marginal Tax Rate, Retirement Savings, or IUL Compliance</p>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center bg-[#1e293b]/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-emerald-500/30 hover:bg-[#1e293b]/100 transition-all group"
        >
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-white font-medium">AI Advisor</span>
          {state.recommendations.filter(r => r.priority === 'critical').length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {state.recommendations.filter(r => r.priority === 'critical').length}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

// ─── AI Brain Banner ──────────────────────────────────────────────────────────
export const AIBrainBanner: React.FC = () => {
  const { state, getAllRecommendations, getFinancialHealth, getUnifiedSnapshot } = useAIBrain();
  const allRecs = getAllRecommendations();
  const health = getFinancialHealth();
  const snapshot = getUnifiedSnapshot();
  const criticalCount = allRecs.filter(r => r.priority === 'critical').length;
  const lastSyncMinutes = Math.floor((Date.now() - state.lastSync.getTime()) / 60000);

  return (
    <div className="bg-[#1e293b] p-4 flex items-center justify-between border-b border-emerald-500/20">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-white font-medium">AI Brain Connected</span>
        </div>
        {health.score > 0 && (
          <span className={`font-semibold ${health.score >= 80 ? 'text-emerald-400' : health.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            Health: {health.score}/100
          </span>
        )}
        <span className="text-gray-300">{allRecs.length} insights</span>
        {criticalCount > 0 && (
          <span className="text-red-400 font-medium">{criticalCount} critical</span>
        )}
        <span className="text-gray-400 text-sm">Synced {lastSyncMinutes}m ago</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-indigo-400 text-sm">{snapshot.calculators} calc</span>
        <span className="text-purple-400 text-sm">{snapshot.siEngines} SI</span>
        <span className="text-cyan-400 text-sm">{snapshot.aiProFeatures} AI Pro</span>
        <span className="text-gray-400 text-sm">{state.dataPointsProcessed} data points</span>
      </div>
    </div>
  );
};

// ─── Page AI Connection Hook ──────────────────────────────────────────────────
export const usePageAIConnection = (pageName: string, dataCallback: (data: any) => any) => {
  const { state, reportData, getRecommendations } = useAIBrain();

  useEffect(() => {
    reportData(pageName, dataCallback({}));
  }, [pageName, dataCallback, reportData]);

  return {
    recommendations: getRecommendations(pageName),
    reportData: (data: any) => reportData(pageName, data),
    isConnected: state.pageConnections.get(pageName) === 'connected',
  };
};
