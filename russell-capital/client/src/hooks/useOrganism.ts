/**
 * THE ORGANISM — Unified Entry Point
 * 
 * All 250 hooks, utilities, and systems re-exported from one location.
 * Import anything from "@/hooks/useOrganism" for full platform interoperability.
 * 
 * Section A (S1-S40):   Nervous System — Data Flow & Calculator Interoperability
 * Section B (S41-S70):  Brain — AI Intelligence & Advisor Recommendations
 * Section C-D (S71-S130): Hands — Client Experience & Advisor Workflow
 * Section E (S131-S170): Skeleton — Platform Architecture & Performance
 * Section F-G (S171-S225): Eyes & Immune — Navigation, Compliance & Security
 * Section H (S226-S250): Voice — Visual Design, Charts & Reporting
 */

// Section A: The Nervous System
export {
  useUniversalReporter,
  useUniversalAutoFill,
  useUniversalAIConnection,
  getRelatedCalcs,
  useTimestampedData,
  useCalcDependencyGraph,
  useRecalculateAll,
  useCalcHistory,
  calcResultsDiff,
  useCrossCalcAggregation,
  useCalculatorSequencer,
  useWhatIfAnalysis,
  useCalculatorChainRunner,
  exportCalcResults,
  useStrategyComparison,
  scoreStrategy,
  useClientDataCompleteness,
  validateCalcInputs,
  getDataQuality,
  DEFAULT_ASSUMPTIONS,
  runProjection,
  adjustForInflation,
  nominalToReal,
  sensitivityAnalysis,
  monteCarloSimulation,
  ASSUMPTION_PRESETS,
  searchCalcResults,
  useResultTags,
  useCalcTemplates,
  generateShareableResult,
  parseSharedResult,
  useCalcVersioning,
} from "./useOrganismNervousSystem";

// Section B: The Brain
export {
  usePageRecommendations,
  useAdvisorPatternLearning,
  useConversationMemory,
  useProactiveAlerts,
  generateMeetingPrep,
  OBJECTION_HANDLERS,
  matchProducts,
  suggestScenarios,
  useRiskAlerts,
  generateNarrative,
  useOnboardingGuide,
  useFeatureDiscovery,
  detectAnomalies,
  useGoalTracker,
  checkCelebrations,
  getAIPersonalityPrompt,
} from "./useOrganismBrain";

// Section C-D: The Hands
export {
  useClientPortalDashboard,
  useDocumentVault,
  useSecureMessaging,
  useEducationalContent,
  FINANCIAL_TOOLTIPS,
  useReferralSystem,
  useClientSatisfaction,
  useQuickClientSwitch,
  useClientSession,
  useFavorites,
  useRecentCalculations,
  useBatchMode,
  useWorkflowTemplates,
  useUndoSystem,
  useMeetingMode,
  useClientComparison,
  useClientSegments,
  useTaskManager,
  usePipelineDashboard,
  calculateClientHealthScore,
  useRevenueForecasting,
  useCommunicationLog,
  calculateClientLifetimeValue,
  useCapacityPlanning,
} from "./useOrganismHands";

// Section E: The Skeleton
export {
  useErrorHandler,
  useLoadingState,
  useRetry,
  useOnlineStatus,
  useAutoSave,
  useSessionTimeout,
  usePerformanceMonitor,
  useDebounce,
  useThrottle,
  useCache,
  usePersistentState,
  useEventBus,
  useFeatureFlags,
  useAnalytics,
  useAccessibility,
  useResponsive,
  usePrintMode,
  useKeyboardShortcuts,
  useBreadcrumbs,
  usePageTitle,
  useScrollMemory,
  useFormValidation,
  formatCurrency,
  formatNumber,
  formatPercentage,
  sanitizeInput,
  deepClone,
  FinancialMath,
} from "./useOrganismSkeleton";

// Section F-G: The Eyes & Immune System
export {
  CALCULATOR_ATLAS,
  useCalculatorSearch,
  useRelatedCalculators,
  useCalculatorCategories,
  useSmartRouting,
  useContextualHelp,
  useWizardMode,
  useQuickAccess,
  WORKFLOW_CHAINS,
  useGuidedTour,
  VALIDATION_RULES,
  validateFinancialInput,
  useAuditTrail,
  useExportCompliance,
  useBackupRestore,
  useResultVersionHistory,
  checkSuitability,
  calculateDataQuality,
  detectDuplicateClients,
  checkDataIntegrity,
} from "./useOrganismEyes";

// Section H: The Voice
export {
  CHART_PALETTES,
  getChartColor,
  getGradientPair,
  transformToLineChart,
  transformToBarChart,
  transformToPieChart,
  useChartSize,
  CHART_ANIMATIONS,
  exportChartAsCSV,
  assembleReportData,
  generateExecutiveSummary,
  buildPresentationSlides,
  getComplianceDisclosures,
  generateMilestoneAnnotations,
  formatTooltip,
  generateComparisonTable,
  generateTimelineData,
  generateGaugeData,
  generateSparklineData,
  generateWaterfallData,
  generateRadarData,
  generateFunnelData,
  useUniversalChartConfig,
} from "./useOrganismVoice";

// Re-export types
export type { CalcEntry } from "./useOrganismEyes";
export type { ReportSection, ChartAnnotation } from "./useOrganismVoice";
export type { DataQuality, ProjectionAssumptions } from "./useOrganismNervousSystem";
export type { AIPersonality } from "./useOrganismBrain";
