import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const Education529VsIULCalc = lazy(() => import("@/pages/portal/Education529VsIULCalc"));
const CollegeAidOptimizer = lazy(() => import("@/pages/portal/CollegeAidOptimizer"));
const Education529Planner = lazy(() => import("@/pages/portal/Education529Planner"));

export default function H529EducationHub() {
  return (
    <ToggleHub
      title="529 / Education"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "education529vsiulcalc", label: "Education529Vs IUL Calc", element: Education529VsIULCalc },
        { id: "collegeaidoptimizer", label: "College Aid Optimizer", element: CollegeAidOptimizer },
        { id: "education529planner", label: "Education529Planner", element: Education529Planner }
      ]}
    />
  );
}
