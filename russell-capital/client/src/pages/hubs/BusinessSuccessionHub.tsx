import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const SuccessionPlanningWizard = lazy(() => import("@/pages/portal/SuccessionPlanningWizard"));
const BusinessExitPlanner = lazy(() => import("@/pages/portal/BusinessExitPlanner"));
const BusinessSuccession = lazy(() => import("@/pages/portal/BusinessSuccession"));
const SuccessionPlanCalc = lazy(() => import("@/pages/portal/SuccessionPlanCalc"));
const SuccessionPlanningEngine = lazy(() => import("@/pages/portal/SuccessionPlanningEngine"));
const SuccessionPlanningHub = lazy(() => import("@/pages/portal/SuccessionPlanningHub"));
const SuccessionValuation = lazy(() => import("@/pages/portal/SuccessionValuation"));

export default function BusinessSuccessionHub() {
  return (
    <ToggleHub
      title="Business Succession"
      subtitle="7 tools consolidated into one window"
      tabs={[
        { id: "successionplanningwizard", label: "Succession Planning Wizard", element: SuccessionPlanningWizard },
        { id: "businessexitplanner", label: "Business Exit Planner", element: BusinessExitPlanner },
        { id: "businesssuccession", label: "Business Succession", element: BusinessSuccession },
        { id: "successionplancalc", label: "Succession Plan Calc", element: SuccessionPlanCalc },
        { id: "successionplanningengine", label: "Succession Planning Engine", element: SuccessionPlanningEngine },
        { id: "successionplanninghub", label: "Succession Planning Hub", element: SuccessionPlanningHub },
        { id: "successionvaluation", label: "Succession Valuation", element: SuccessionValuation }
      ]}
    />
  );
}
