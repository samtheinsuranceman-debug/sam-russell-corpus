import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const ExistingAnnuities = lazy(() => import("@/pages/portal/ExistingAnnuities"));
const AnnuityAccumulationDB = lazy(() => import("@/pages/portal/AnnuityAccumulationDB"));
const AnnuityComparisonCalc = lazy(() => import("@/pages/portal/AnnuityComparisonCalc"));
const AnnuityHiddenFee = lazy(() => import("@/pages/portal/AnnuityHiddenFee"));
const AnnuityMemory = lazy(() => import("@/pages/portal/AnnuityMemory"));
const AnnuityWaterfallEngine = lazy(() => import("@/pages/portal/AnnuityWaterfallEngine"));
const AtheneGuaranteedIncome = lazy(() => import("@/pages/portal/AtheneGuaranteedIncome"));
const AthenePEPlus15 = lazy(() => import("@/pages/portal/AthenePEPlus15"));
const FIATop10 = lazy(() => import("@/pages/portal/FIATop10"));
const GrowthAnnuities = lazy(() => import("@/pages/portal/GrowthAnnuities"));
const MYGAFixedRate = lazy(() => import("@/pages/portal/MYGAFixedRate"));
const MYGAWaterfallComparison = lazy(() => import("@/pages/portal/MYGAWaterfallComparison"));
const StructuredSettlementPlanner = lazy(() => import("@/pages/portal/StructuredSettlementPlanner"));
const VariableAnnuityAnalyzer = lazy(() => import("@/pages/portal/VariableAnnuityAnalyzer"));

export default function AnnuityComparisonReviewHub() {
  return (
    <ToggleHub
      title="Annuity Comparison & Review"
      subtitle="14 tools consolidated into one window"
      tabs={[
        { id: "existingannuities", label: "Existing Annuities", element: ExistingAnnuities },
        { id: "annuityaccumulationdb", label: "Annuity Accumulation DB", element: AnnuityAccumulationDB },
        { id: "annuitycomparisoncalc", label: "Annuity Comparison Calc", element: AnnuityComparisonCalc },
        { id: "annuityhiddenfee", label: "Annuity Hidden Fee", element: AnnuityHiddenFee },
        { id: "annuitymemory", label: "Annuity Memory", element: AnnuityMemory },
        { id: "annuitywaterfallengine", label: "Annuity Waterfall Engine", element: AnnuityWaterfallEngine },
        { id: "atheneguaranteedincome", label: "Athene Guaranteed Income", element: AtheneGuaranteedIncome },
        { id: "athenepeplus15", label: "Athene PE Plus15", element: AthenePEPlus15 },
        { id: "fiatop10", label: "FIA Top10", element: FIATop10 },
        { id: "growthannuities", label: "Growth Annuities", element: GrowthAnnuities },
        { id: "mygafixedrate", label: "MYGA Fixed Rate", element: MYGAFixedRate },
        { id: "mygawaterfallcomparison", label: "MYGA Waterfall Comparison", element: MYGAWaterfallComparison },
        { id: "structuredsettlementplanner", label: "Structured Settlement Planner", element: StructuredSettlementPlanner },
        { id: "variableannuityanalyzer", label: "Variable Annuity Analyzer", element: VariableAnnuityAnalyzer }
      ]}
    />
  );
}
