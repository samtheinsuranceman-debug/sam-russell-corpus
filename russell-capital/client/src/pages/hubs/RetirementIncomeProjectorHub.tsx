import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const RetirementIncomeProjection = lazy(() => import("@/pages/portal/RetirementIncomeProjection"));
const IncomeGapAnalyzer = lazy(() => import("@/pages/portal/IncomeGapAnalyzer"));
const IncomeShiftingCalc = lazy(() => import("@/pages/portal/IncomeShiftingCalc"));
const IncomeTimeline = lazy(() => import("@/pages/portal/IncomeTimeline"));
const RetirementIncomeFloorPlanner = lazy(() => import("@/pages/portal/RetirementIncomeFloorPlanner"));
const RetirementIncomeFloorStrategy = lazy(() => import("@/pages/portal/RetirementIncomeFloorStrategy"));
const RetirementIncomeProjector = lazy(() => import("@/pages/portal/RetirementIncomeProjector"));

export default function RetirementIncomeProjectorHub() {
  return (
    <ToggleHub
      title="Retirement Income Projector"
      subtitle="7 tools consolidated into one window"
      tabs={[
        { id: "retirementincomeprojection", label: "Retirement Income Projection", element: RetirementIncomeProjection },
        { id: "incomegapanalyzer", label: "Income Gap Analyzer", element: IncomeGapAnalyzer },
        { id: "incomeshiftingcalc", label: "Income Shifting Calc", element: IncomeShiftingCalc },
        { id: "incometimeline", label: "Income Timeline", element: IncomeTimeline },
        { id: "retirementincomefloorplanner", label: "Retirement Income Floor Planner", element: RetirementIncomeFloorPlanner },
        { id: "retirementincomefloorstrategy", label: "Retirement Income Floor Strategy", element: RetirementIncomeFloorStrategy },
        { id: "retirementincomeprojector", label: "Retirement Income Projector", element: RetirementIncomeProjector }
      ]}
    />
  );
}
