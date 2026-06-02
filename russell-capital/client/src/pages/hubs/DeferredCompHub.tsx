import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const DeferredCompCalc = lazy(() => import("@/pages/portal/DeferredCompCalc"));
const DeferredCompensation = lazy(() => import("@/pages/portal/DeferredCompensation"));
const DeferredCompensationAnalyzer = lazy(() => import("@/pages/portal/DeferredCompensationAnalyzer"));
const ExecutiveBonusPlan = lazy(() => import("@/pages/portal/ExecutiveBonusPlan"));
const ExecutiveCompOptimizer = lazy(() => import("@/pages/portal/ExecutiveCompOptimizer"));

export default function DeferredCompHub() {
  return (
    <ToggleHub
      title="Deferred Comp"
      subtitle="5 tools consolidated into one window"
      tabs={[
        { id: "deferredcompcalc", label: "Deferred Comp Calc", element: DeferredCompCalc },
        { id: "deferredcompensation", label: "Deferred Compensation", element: DeferredCompensation },
        { id: "deferredcompensationanalyzer", label: "Deferred Compensation Analyzer", element: DeferredCompensationAnalyzer },
        { id: "executivebonusplan", label: "Executive Bonus Plan", element: ExecutiveBonusPlan },
        { id: "executivecompoptimizer", label: "Executive Comp Optimizer", element: ExecutiveCompOptimizer }
      ]}
    />
  );
}
