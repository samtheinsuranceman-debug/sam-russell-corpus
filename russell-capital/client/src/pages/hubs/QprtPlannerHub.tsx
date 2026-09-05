import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const QPRTCalculator = lazy(() => import("@/pages/portal/QPRTCalculator"));
const QPRTAdvancedPlanner = lazy(() => import("@/pages/portal/QPRTAdvancedPlanner"));
const QPRTPlanner = lazy(() => import("@/pages/portal/QPRTPlanner"));

export default function QprtPlannerHub() {
  return (
    <ToggleHub
      title="QPRT Planner"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "qprtcalculator", label: "QPRT Calculator", element: QPRTCalculator },
        { id: "qprtadvancedplanner", label: "QPRT Advanced Planner", element: QPRTAdvancedPlanner },
        { id: "qprtplanner", label: "QPRT Planner", element: QPRTPlanner }
      ]}
    />
  );
}
