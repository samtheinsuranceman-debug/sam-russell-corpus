import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const PensionVsLumpSumCalc = lazy(() => import("@/pages/portal/PensionVsLumpSumCalc"));
const PensionMaxCalc = lazy(() => import("@/pages/portal/PensionMaxCalc"));
const PensionMaximization = lazy(() => import("@/pages/portal/PensionMaximization"));
const PensionMaximizationEngine = lazy(() => import("@/pages/portal/PensionMaximizationEngine"));

export default function PensionMaximizationHub() {
  return (
    <ToggleHub
      title="Pension Maximization"
      subtitle="4 tools consolidated into one window"
      tabs={[
        { id: "pensionvslumpsumcalc", label: "Pension Vs Lump Sum Calc", element: PensionVsLumpSumCalc },
        { id: "pensionmaxcalc", label: "Pension Max Calc", element: PensionMaxCalc },
        { id: "pensionmaximization", label: "Pension Maximization", element: PensionMaximization },
        { id: "pensionmaximizationengine", label: "Pension Maximization Engine", element: PensionMaximizationEngine }
      ]}
    />
  );
}
