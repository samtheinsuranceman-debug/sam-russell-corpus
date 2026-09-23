/**
 * useCalculatorIntegration — Reusable hook that wires any calculator page to the backend.
 * Provides:
 * 1. Client selector (the workspace's real clients, clients.list)
 * 2. Save/load scenarios, stored in saved_scenarios through the scenarios router and
 *    tagged with the calculator's name so each calculator lists only its own
 * 3. Audit logging for compliance (complianceAudit.logCalculation)
 * 4. StrategyContext publishing
 */
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useStrategy, type StrategyType, type StrategyResult } from "@/contexts/StrategyContext";
import { useAuth } from "@/_core/hooks/useAuth";

export interface CalculatorIntegrationConfig {
  calculatorName: string;
  strategyType: StrategyType;
}

export function useCalculatorIntegration(config: CalculatorIntegrationConfig) {
  const { calculatorName, strategyType } = config;
  const { user } = useAuth();
  const { publishResult, results: strategyResults } = useStrategy();

  // Client selector state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  // Scenario state
  const [scenarioName, setScenarioName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const clientsQuery = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  // Saved scenarios for this calculator only.
  const scenariosQuery = trpc.scenarios.list.useQuery(
    { tag: calculatorName },
    { enabled: !!user, staleTime: 30_000 },
  );

  const saveScenarioMutation = trpc.scenarios.save.useMutation({
    onSuccess: () => {
      setLastSavedAt(new Date());
      setIsSaving(false);
      void scenariosQuery.refetch();
    },
    onError: () => setIsSaving(false),
  });

  const logCalculationMutation = trpc.complianceAudit.logCalculation.useMutation();

  const selectClient = useCallback((clientId: number, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
  }, []);

  const saveScenario = useCallback(
    async (inputs: Record<string, unknown>, results: Record<string, unknown>) => {
      setIsSaving(true);
      try {
        await saveScenarioMutation.mutateAsync({
          name: scenarioName || `${calculatorName} - ${new Date().toLocaleDateString()}`,
          clientId: selectedClientId ?? undefined,
          inputs,
          projectionData: results,
          tags: calculatorName,
        });
      } catch {
        setIsSaving(false);
      }
    },
    [saveScenarioMutation, scenarioName, calculatorName, selectedClientId],
  );

  const logCalculation = useCallback(
    async (inputs: Record<string, unknown>, results: Record<string, unknown>) => {
      try {
        await logCalculationMutation.mutateAsync({
          calculationType: calculatorName,
          clientId: selectedClientId ?? undefined,
          clientName: selectedClientName || undefined,
          pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
          inputs,
          outputs: results,
          summary: `Calculated via ${calculatorName} for ${selectedClientName || "no client selected"}`,
        });
      } catch {
        // Non-critical
      }
    },
    [logCalculationMutation, calculatorName, selectedClientId, selectedClientName],
  );

  // Publish results to StrategyContext for cross-calculator sync
  const publishToStrategy = useCallback(
    (results: Record<string, unknown>) => {
      publishResult({
        type: strategyType,
        data: { label: `${calculatorName}${selectedClientName ? ` - ${selectedClientName}` : ""}`, ...results },
      } as unknown as StrategyResult);
    },
    [publishResult, strategyType, calculatorName, selectedClientName],
  );

  const getFromStrategy = useCallback((type: StrategyType) => strategyResults[type], [strategyResults]);

  const loadScenario = useCallback((scenario: { inputs?: unknown } | null | undefined) => scenario?.inputs ?? null, []);

  return {
    // Client selector
    clients: clientsQuery.data ?? [],
    clientsLoading: clientsQuery.isLoading && !!user,
    selectedClientId,
    selectedClientName,
    selectClient,

    // Scenario management
    scenarios: scenariosQuery.data ?? [],
    scenariosLoading: scenariosQuery.isLoading && !!user,
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
