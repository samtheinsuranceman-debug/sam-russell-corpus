import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const GRATCalculator = lazy(() => import("@/pages/portal/GRATCalculator"));
const GRATPlanner = lazy(() => import("@/pages/portal/GRATPlanner"));

export default function GratPlannerHub() {
  return (
    <ToggleHub
      title="GRAT Planner"
      subtitle="2 tools consolidated into one window"
      tabs={[
        { id: "gratcalculator", label: "GRAT Calculator", element: GRATCalculator },
        { id: "gratplanner", label: "GRAT Planner", element: GRATPlanner }
      ]}
    />
  );
}
