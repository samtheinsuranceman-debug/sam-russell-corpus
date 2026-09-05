/**
 * CalcDataBusBridge — Bridges the existing CalculatorIntegration (105 calculators)
 * into the UnifiedDataBus so all calculator results flow into the AI Brain and AI Advisor.
 * 
 * This component sits inside both providers and syncs data automatically.
 * It watches the CalculatorIntegration results and publishes each to the UnifiedDataBus.
 */
import { useEffect, useRef } from 'react';
import { useCalcResults } from './CalculatorIntegration';
import { useUnifiedDataBus } from '@/contexts/UnifiedDataBusContext';

const CALC_TITLES: Record<string, string> = {
  "compound-interest": "Compound Interest",
  "fire-calculator": "FIRE Calculator",
  "marginal-tax-rate": "Marginal Tax Rate",
  "estate-tax": "Estate Tax",
  "life-insurance-needs": "Life Insurance Needs",
  "retirement-savings": "Retirement Savings",
  "asset-allocation": "Asset Allocation",
  "net-worth-tracker": "Net Worth Tracker",
  "safe-withdrawal-rate": "Safe Withdrawal Rate",
  "roth-vs-traditional": "Roth vs Traditional",
  "debt-payoff-optimizer": "Debt Payoff Optimizer",
  "disability-insurance-needs": "Disability Insurance",
};

export function CalcDataBusBridge() {
  const { results: calcResults } = useCalcResults();
  const { report } = useUnifiedDataBus();
  const prevKeysRef = useRef<string>('');

  useEffect(() => {
    const entries = Object.entries(calcResults);
    const currentKeys = entries.map(([k]) => k).sort().join(',');
    
    // Only sync when calculator results actually change
    if (currentKeys === prevKeysRef.current) return;
    prevKeysRef.current = currentKeys;

    for (const [route, result] of entries) {
      if (!result?.summary) continue;
      
      const featureId = `calc-${route}`;
      const featureName = CALC_TITLES[route] || route.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      // Extract numeric/string/boolean values from the summary (max 15 fields)
      const payload: Record<string, any> = { computed: true };
      const summaryEntries = Object.entries(result.summary);
      let fieldCount = 0;
      for (const [key, value] of summaryEntries) {
        if (fieldCount >= 15) break;
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
          payload[key] = value;
          fieldCount++;
        }
      }

      report({
        featureId,
        featureName,
        category: 'calculator',
        route: `/portal/${route}`,
        payload,
      });
    }
  }, [calcResults, report]);

  return null; // This is a data-only bridge, no UI
}
