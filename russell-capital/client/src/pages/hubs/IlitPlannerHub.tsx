import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const ILITCalculator = lazy(() => import("@/pages/portal/ILITCalculator"));
const ILITAnalyzer = lazy(() => import("@/pages/portal/ILITAnalyzer"));
const ILITDeepDive = lazy(() => import("@/pages/portal/ILITDeepDive"));

export default function IlitPlannerHub() {
  return (
    <ToggleHub
      title="ILIT Planner"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "ilitcalculator", label: "ILIT Calculator", element: ILITCalculator },
        { id: "ilitanalyzer", label: "ILIT Analyzer", element: ILITAnalyzer },
        { id: "ilitdeepdive", label: "ILIT Deep Dive", element: ILITDeepDive }
      ]}
    />
  );
}
