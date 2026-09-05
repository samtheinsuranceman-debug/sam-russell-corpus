/**
 * UnifiedDataBus — Central data interconnection layer for ALL platform features.
 * 
 * Every feature (105 calculators, 27 sister inventions, 32 AI Pro Suite) publishes
 * its key outputs here. The AI Brain and AI Advisor consume this unified data
 * to generate holistic, cross-feature recommendations.
 * 
 * Usage:
 *   const reportToHub = useReportToHub('feature-id', 'si-engine');
 *   reportToHub({ primaryResult: 50000, riskLevel: 'low' });
 * 
 *   const data = useFeatureData('other-feature-id');
 *   const allSI = useCategoryData('si-engine');
 */
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DataCategory = 'calculator' | 'si-engine' | 'ai-pro-suite';

export interface DataPayload {
  [key: string]: number | string | boolean | number[] | string[] | Record<string, any> | undefined;
}

export interface DataEntry {
  featureId: string;
  featureName: string;
  category: DataCategory;
  payload: DataPayload;
  timestamp: number;
  route: string;
}

export interface CrossFeatureLink {
  sourceId: string;
  targetId: string;
  relationship: 'feeds-into' | 'validates' | 'complements' | 'depends-on';
  dataKeys: string[];
}

interface UnifiedDataBusContextType {
  entries: DataEntry[];
  report: (entry: Omit<DataEntry, 'timestamp'>) => void;
  getFeatureData: (featureId: string) => DataPayload | null;
  getCategoryData: (category: DataCategory) => DataEntry[];
  getCategoryCount: (category: DataCategory) => number;
  getAllEntries: () => DataEntry[];
  getRecentEntries: (limit?: number) => DataEntry[];
  getTotalDataPoints: () => number;
  getFeatureLinks: (featureId: string) => CrossFeatureLink[];
  clearAll: () => void;
}

// ─── Cross-Feature Relationship Map ───────────────────────────────────────────
// Defines how features inform each other

export const FEATURE_RELATIONSHIPS: CrossFeatureLink[] = [
  // SI engines that feed calculators
  { sourceId: 'si-iul-compliance', targetId: 'calc-term-vs-whole', relationship: 'validates', dataKeys: ['complianceScore', 'violations'] },
  { sourceId: 'si-carrier-strength', targetId: 'calc-life-insurance-needs', relationship: 'feeds-into', dataKeys: ['carrierRating', 'financialStrength'] },
  { sourceId: 'si-premium-financing', targetId: 'calc-compound-interest', relationship: 'complements', dataKeys: ['arbitrageSpread', 'loanRate'] },
  { sourceId: 'si-tax-code-sim', targetId: 'calc-marginal-tax-rate', relationship: 'feeds-into', dataKeys: ['projectedRate', 'legislativeImpact'] },
  { sourceId: 'si-behavioral-bias', targetId: 'calc-asset-allocation', relationship: 'validates', dataKeys: ['biasScore', 'riskTolerance'] },
  { sourceId: 'si-disability-gap', targetId: 'calc-disability-insurance', relationship: 'feeds-into', dataKeys: ['coverageGap', 'monthlyShortfall'] },
  { sourceId: 'si-divorce-impact', targetId: 'calc-estate-tax', relationship: 'complements', dataKeys: ['assetDivision', 'taxImpact'] },
  { sourceId: 'si-social-security', targetId: 'calc-spousal-ss', relationship: 'feeds-into', dataKeys: ['optimalAge', 'bridgeAmount'] },
  { sourceId: 'si-generational-wealth', targetId: 'calc-estate-tax', relationship: 'feeds-into', dataKeys: ['transferAmount', 'taxEfficiency'] },
  { sourceId: 'si-client-retention', targetId: 'ai-pro-retention-assistant', relationship: 'feeds-into', dataKeys: ['churnRisk', 'engagementScore'] },
  { sourceId: 'si-prospect-qual', targetId: 'ai-pro-deal-closer', relationship: 'feeds-into', dataKeys: ['qualScore', 'conversionProb'] },
  { sourceId: 'si-commission-opt', targetId: 'ai-pro-strategy-lab', relationship: 'complements', dataKeys: ['optimalProduct', 'commission'] },
  
  // AI Pro Suite features that consume SI data
  { sourceId: 'ai-pro-risk-dashboard', targetId: 'si-iul-compliance', relationship: 'depends-on', dataKeys: ['riskScore'] },
  { sourceId: 'ai-pro-risk-dashboard', targetId: 'si-carrier-strength', relationship: 'depends-on', dataKeys: ['carrierRating'] },
  { sourceId: 'ai-pro-wealth-sim', targetId: 'si-generational-wealth', relationship: 'depends-on', dataKeys: ['wealthProjection'] },
  { sourceId: 'ai-pro-strategy-lab', targetId: 'si-premium-financing', relationship: 'depends-on', dataKeys: ['arbitrageSpread'] },
  { sourceId: 'ai-pro-executive-cmd', targetId: 'all', relationship: 'depends-on', dataKeys: ['*'] },
  
  // Calculators that feed AI Pro Suite
  { sourceId: 'calc-fire', targetId: 'ai-pro-wealth-projection', relationship: 'feeds-into', dataKeys: ['fireNumber', 'yearsToFIRE'] },
  { sourceId: 'calc-compound-interest', targetId: 'ai-pro-holographic', relationship: 'feeds-into', dataKeys: ['futureValue', 'totalGrowth'] },
  { sourceId: 'calc-marginal-tax-rate', targetId: 'ai-pro-strategy-lab', relationship: 'feeds-into', dataKeys: ['effectiveRate', 'bracket'] },
  { sourceId: 'calc-estate-tax', targetId: 'ai-pro-legacy-vault', relationship: 'feeds-into', dataKeys: ['estateTax', 'exemptionUsed'] },
  { sourceId: 'calc-retirement-savings', targetId: 'ai-pro-autopilot', relationship: 'feeds-into', dataKeys: ['projectedBalance', 'monthlyNeeded'] },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const UnifiedDataBusContext = createContext<UnifiedDataBusContextType>({
  entries: [],
  report: () => {},
  getFeatureData: () => null,
  getCategoryData: () => [],
  getCategoryCount: () => 0,
  getAllEntries: () => [],
  getRecentEntries: () => [],
  getTotalDataPoints: () => 0,
  getFeatureLinks: () => [],
  clearAll: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UnifiedDataBusProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DataEntry[]>([]);

  const report = useCallback((entry: Omit<DataEntry, 'timestamp'>) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.featureId !== entry.featureId);
      return [...filtered, { ...entry, timestamp: Date.now() }];
    });
  }, []);

  const getFeatureData = useCallback((featureId: string): DataPayload | null => {
    const entry = entries.find(e => e.featureId === featureId);
    return entry?.payload ?? null;
  }, [entries]);

  const getCategoryData = useCallback((category: DataCategory): DataEntry[] => {
    return entries.filter(e => e.category === category);
  }, [entries]);

  const getCategoryCount = useCallback((category: DataCategory): number => {
    return entries.filter(e => e.category === category).length;
  }, [entries]);

  const getAllEntries = useCallback(() => entries, [entries]);

  const getRecentEntries = useCallback((limit = 10): DataEntry[] => {
    return [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }, [entries]);

  const getTotalDataPoints = useCallback((): number => {
    return entries.reduce((sum, e) => sum + Object.keys(e.payload).length, 0);
  }, [entries]);

  const getFeatureLinks = useCallback((featureId: string): CrossFeatureLink[] => {
    return FEATURE_RELATIONSHIPS.filter(
      r => r.sourceId === featureId || r.targetId === featureId
    );
  }, []);

  const clearAll = useCallback(() => setEntries([]), []);

  const value = useMemo(() => ({
    entries,
    report,
    getFeatureData,
    getCategoryData,
    getCategoryCount,
    getAllEntries,
    getRecentEntries,
    getTotalDataPoints,
    getFeatureLinks,
    clearAll,
  }), [entries, report, getFeatureData, getCategoryData, getCategoryCount, getAllEntries, getRecentEntries, getTotalDataPoints, getFeatureLinks, clearAll]);

  return (
    <UnifiedDataBusContext.Provider value={value}>
      {children}
    </UnifiedDataBusContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Access the full data bus context */
export function useUnifiedDataBus() {
  return useContext(UnifiedDataBusContext);
}

/** Lightweight hook for publishing results to the hub (2 lines per page) */
export function useReportToHub(featureId: string, featureName: string, category: DataCategory, route: string) {
  const { report } = useContext(UnifiedDataBusContext);
  return useCallback(
    (payload: DataPayload) => report({ featureId, featureName, category, route, payload }),
    [report, featureId, featureName, category, route]
  );
}

/** Read another feature's data by ID */
export function useFeatureData(featureId: string): DataPayload | null {
  const { getFeatureData } = useContext(UnifiedDataBusContext);
  return getFeatureData(featureId);
}

/** Read all data from a category */
export function useCategoryData(category: DataCategory): DataEntry[] {
  const { getCategoryData } = useContext(UnifiedDataBusContext);
  return getCategoryData(category);
}

/** Get cross-feature links for a specific feature */
export function useFeatureLinks(featureId: string): CrossFeatureLink[] {
  const { getFeatureLinks } = useContext(UnifiedDataBusContext);
  return getFeatureLinks(featureId);
}
