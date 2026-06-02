import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const AMTCalculator = lazy(() => import("@/pages/portal/AMTCalculator"));
const AMTAnalyzer = lazy(() => import("@/pages/portal/AMTAnalyzer"));
const AlternativeMinimumTaxPlanner = lazy(() => import("@/pages/portal/AlternativeMinimumTaxPlanner"));

export default function AmtHub() {
  return (
    <ToggleHub
      title="AMT"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "amtcalculator", label: "AMT Calculator", element: AMTCalculator },
        { id: "amtanalyzer", label: "AMT Analyzer", element: AMTAnalyzer },
        { id: "alternativeminimumtaxplanner", label: "Alternative Minimum Tax Planner", element: AlternativeMinimumTaxPlanner }
      ]}
    />
  );
}
