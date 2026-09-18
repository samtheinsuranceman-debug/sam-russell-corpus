// @ts-nocheck
/**
 * useCalculatorIntegration — Reusable hook that wires any calculator page to the backend.
 * Provides:
 * 1. Client selector (load real client data)
 * 2. Save/load scenarios via tRPC
 * 3. Audit logging for compliance
 * 4. StrategyContext publishing
 */
import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useStrategy, StrategyType } from "@/contexts/StrategyContext";
import { useAuth } from "@/_core/hooks/useAuth";

export interface CalculatorIntegrationConfig {
  calculatorName: string;
  strategyType: StrategyType;
}

export function useCalculatorIntegration(config: CalculatorIntegrationConfig) {
  const { calculatorName, strategyType } = config;
  const { user } = useAuth();
  const { publishResult, getResult } = useStrategy();

  // Client selector state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  // Scenario state
  const [scenarioName, setScenarioName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Client list query
  const clientsQuery = trpc.clients?.list?.useQuery?.(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  // Saved scenarios query
  const scenariosQuery = trpc.complianceAudit?.getScenarios?.useQuery?.(
    { calculatorType: calculatorName },
    { enabled: !!user, staleTime: 30_000 }
  );

  // Save scenario mutation
  const saveScenarioMutation = trpc.complianceAudit?.saveScenario?.useMutation?.({
    onSuccess: () => {
      setLastSavedAt(new Date());
      setIsSaving(false);
      scenariosQuery?.refetch?.();
    },
    onError: () => setIsSaving(false),
  });

  // Audit log mutation
  const logCalculationMutation = trpc.complianceAudit?.logCalculation?.useMutation?.();

  // Select a client
  const selectClient = useCallback((clientId: number, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
  }, []);

  // Save scenario
  const saveScenario = useCallback(async (inputs: Record<string, any>, results: Record<string, any>) => {
    if (!saveScenarioMutation) return;
    setIsSaving(true);
    try {
      await saveScenarioMutation.mutateAsync({
        name: scenarioName || `${calculatorName} - ${new Date().toLocaleDateString()}`,
        calculatorType: calculatorName,
        clientId: selectedClientId ?? undefined,
        inputs,
        results,
      });
    } catch (e) {
      setIsSaving(false);
    }
  }, [saveScenarioMutation, scenarioName, calculatorName, selectedClientId]);

  // Log calculation for compliance
  const logCalculation = useCallback(async (inputs: Record<string, any>, results: Record<string, any>) => {
    if (!logCalculationMutation) return;
    try {
      await logCalculationMutation.mutateAsync({
        calculatorType: calculatorName,
        clientId: selectedClientId ?? undefined,
        inputs,
        results,
        complianceNotes: `Calculated via ${calculatorName} for ${selectedClientName || "no client selected"}`,
      });
    } catch (e) {
      // Non-critical
    }
  }, [logCalculationMutation, calculatorName, selectedClientId, selectedClientName]);

  // Publish results to StrategyContext for cross-calculator sync
  const publishToStrategy = useCallback((results: Record<string, any>) => {
    publishResult(strategyType, {
      label: `${calculatorName}${selectedClientName ? ` - ${selectedClientName}` : ""}`,
      ...results,
    });
  }, [publishResult, strategyType, calculatorName, selectedClientName]);

  // Get data from another calculator
  const getFromStrategy = useCallback((type: StrategyType) => {
    return getResult(type);
  }, [getResult]);

  // Load scenario
  const loadScenario = useCallback((scenario: any) => {
    if (scenario?.inputs) {
      return scenario.inputs;
    }
    return null;
  }, []);

  return {
    // Client selector
    clients: clientsQuery?.data ?? [],
    clientsLoading: clientsQuery?.isLoading ?? false,
    selectedClientId,
    selectedClientName,
    selectClient,

    // Scenario management
    scenarios: scenariosQuery?.data ?? [],
    scenariosLoading: scenariosQuery?.isLoading ?? false,
    scenarioName,
    setScenarioName,
    saveScenario,
    loadScenario,
    isSaving,
    lastSavedAt,

    // Audit logging
    logCalculation,

    // Strategy context
    publishToStrategy,
    getFromStrategy,

    // User
    user,
  };
}
