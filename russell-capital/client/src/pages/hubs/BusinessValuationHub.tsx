import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const BusinessValuationCalc = lazy(() => import("@/pages/portal/BusinessValuationCalc"));
const BusinessValuationEstimator = lazy(() => import("@/pages/portal/BusinessValuationEstimator"));
const PracticeValuation = lazy(() => import("@/pages/portal/PracticeValuation"));

export default function BusinessValuationHub() {
  return (
    <ToggleHub
      title="Business Valuation"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "businessvaluationcalc", label: "Business Valuation Calc", element: BusinessValuationCalc },
        { id: "businessvaluationestimator", label: "Business Valuation Estimator", element: BusinessValuationEstimator },
        { id: "practicevaluation", label: "Practice Valuation", element: PracticeValuation }
      ]}
    />
  );
}
