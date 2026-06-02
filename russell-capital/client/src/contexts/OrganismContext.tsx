/**
 * ═══════════════════════════════════════════════════════════════════
 * ORGANISM CONTEXT — Global intelligence aggregation layer
 * ═══════════════════════════════════════════════════════════════════
 * Makes all organism data available to every component via useOrganismContext()
 */
// @ts-nocheck
import React, { createContext, useContext, useMemo } from "react";
import {
  useCrossCalcAggregation,
  useClientDataCompleteness,
  useProactiveAlerts,
  useRiskAlerts,
  useRelatedCalculators,
  useSmartRouting,
  formatCurrency,
  CALCULATOR_ATLAS,
} from "@/hooks/useOrganism";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";
import { getMeshHealth } from "@/components/NeuralMeshInterceptor";
import { useLocation } from "wouter";

interface OrganismContextType {
  health: { overall: number; color: string; label: string };
  calcAgg: ReturnType<typeof useCrossCalcAggregation>;
  completeness: ReturnType<typeof useClientDataCompleteness>;
  alerts: {
    proactive: ReturnType<typeof useProactiveAlerts>;
    risk: ReturnType<typeof useRiskAlerts>;
    total: number;
  };
  mesh: ReturnType<typeof getMeshHealth>;
  routing: ReturnType<typeof useSmartRouting>;
  relationships: ReturnType<typeof useRelatedCalculators>;
  calculatorAtlas: typeof CALCULATOR_ATLAS;
  formatCurrency: typeof formatCurrency;
}

const OrganismContext = createContext<OrganismContextType | undefined>(undefined);

export function OrganismProvider({ children }: { children: React.ReactNode }) {
  const { results: calcResults } = useCalcResults();
  const { data: clientData } = useClientData();
  const [location] = useLocation();

  const calcAgg = useCrossCalcAggregation();
  const completeness = useClientDataCompleteness();
  const proactiveAlerts = useProactiveAlerts(calcResults, clientData || {});
  const riskAlerts = useRiskAlerts(calcResults, clientData || {});
  const relationships = useRelatedCalculators(location);
  const routing = useSmartRouting(location, calcResults);
  const meshHealth = useMemo(() => getMeshHealth(), [calcResults, clientData]);

  const alerts = useMemo(
    () => ({
      proactive: proactiveAlerts,
      risk: riskAlerts,
      total: proactiveAlerts.length + riskAlerts.length,
    }),
    [proactiveAlerts, riskAlerts]
  );

  const health = useMemo(() => {
    const overall = meshHealth.healthScore;
    const color = overall > 70 ? "emerald" : overall > 40 ? "amber" : "red";
    const label = overall > 70 ? "Healthy" : overall > 40 ? "Warming" : "Critical";
    return { overall, color, label };
  }, [meshHealth.healthScore]);

  const value = useMemo(
    () => ({
      health,
      calcAgg,
      completeness,
      alerts,
      mesh: meshHealth,
      routing,
      relationships,
      calculatorAtlas: CALCULATOR_ATLAS,
      formatCurrency,
    }),
    [health, calcAgg, completeness, alerts, meshHealth, routing, relationships]
  );

  return <OrganismContext.Provider value={value}>{children}</OrganismContext.Provider>;
}

const FALLBACK_ORGANISM: OrganismContextType = {
  health: { overall: 0, color: 'gray', label: 'Offline' },
  calcAgg: { totalSavings: 0, totalProjected: 0, completedCalcs: 0, topInsight: '' } as any,
  completeness: { score: 0, missing: [], suggestions: [] } as any,
  alerts: { proactive: [], risk: [], total: 0 },
  mesh: { healthScore: 0, connectedFeatures: 0, totalFeatures: 0 } as any,
  routing: { next: '', reason: '' } as any,
  relationships: [] as any,
  calculatorAtlas: CALCULATOR_ATLAS,
  formatCurrency,
};

export function useOrganismContext() {
  const ctx = useContext(OrganismContext);
  if (!ctx) return FALLBACK_ORGANISM;
  return ctx;
}

export default OrganismContext;
