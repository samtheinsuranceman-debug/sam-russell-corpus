import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const QBICalculator = lazy(() => import("@/pages/portal/QBICalculator"));
const Section199ADeductionOptimizer = lazy(() => import("@/pages/portal/Section199ADeductionOptimizer"));
const Section199AOptimizer = lazy(() => import("@/pages/portal/Section199AOptimizer"));

export default function Section199AQbiHub() {
  return (
    <ToggleHub
      title="Section 199A / QBI"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "qbicalculator", label: "QBI Calculator", element: QBICalculator },
        { id: "section199adeductionoptimizer", label: "Section199A Deduction Optimizer", element: Section199ADeductionOptimizer },
        { id: "section199aoptimizer", label: "Section199A Optimizer", element: Section199AOptimizer }
      ]}
    />
  );
}
