// @ts-nocheck

import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";
import { getRelatedCalcs } from "@/hooks/useOrganismNervousSystem";
import { CALCULATOR_ATLAS } from "@/hooks/useOrganismEyes";

export function getRecommendations(calcResults: any, clientData: any) {
  const recommendations: string[] = [];
  
  // Analyze for optimization opportunities based on calc results
  if (calcResults && typeof calcResults === "object") {
    for (const [key, result] of Object.entries(calcResults)) {
      if (result && typeof result === "object" && (result as any).summary) {
        const summary = (result as any).summary;
        if (summary.taxSavings > 50000) {
          recommendations.push("Tax Optimization Calculator");
        }
      }
    }
  }
  
  // Suggest related calculators based on what's been used
  const usedCalcs = calcResults ? Object.keys(calcResults) : [];
  if (usedCalcs.length > 0) {
    const lastCalc = usedCalcs[usedCalcs.length - 1];
    const related = getRelatedCalcs(`/portal/${lastCalc}`);
    for (const rel of related.slice(0, 3)) {
      const atlas = CALCULATOR_ATLAS.find(c => c.route === rel);
      if (atlas) recommendations.push(atlas.name);
    }
  }
  
  // Recommend estate planning for high net worth
  if (clientData && clientData.netWorth > 1000000) {
    recommendations.push("Estate Planning Calculator");
  }
  
  return [...new Set(recommendations)];
}

export function getNextBestCalc(calcResults: any) {
  const recommendations = getRecommendations(calcResults, {});
  return recommendations[0] || "Default Calculator";
}

export function getTaxOpportunities(calcResults: any, clientData: any) {
  return getRecommendations(calcResults, clientData).filter(rec => rec.includes("Tax"));
}

const CrossCalcRecommendationEngine = () => {
  const { results: calcResults } = useCalcResults();
  const { data: clientData } = useClientData();
  
  // The component runs logic via hooks but renders null
  useEffect(() => {
    // Could log or process recommendations, but not required
  }, [calcResults, clientData]);
  
  return null;
};

export default CrossCalcRecommendationEngine;
