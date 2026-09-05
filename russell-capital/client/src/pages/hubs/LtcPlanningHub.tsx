import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const LivingBenefitsProbability = lazy(() => import("@/pages/portal/LivingBenefitsProbability"));
const LTCCostCalc = lazy(() => import("@/pages/portal/LTCCostCalc"));
const LongTermCareHybrid = lazy(() => import("@/pages/portal/LongTermCareHybrid"));
const LongTermCarePlanner = lazy(() => import("@/pages/portal/LongTermCarePlanner"));

export default function LtcPlanningHub() {
  return (
    <ToggleHub
      title="LTC Planning"
      subtitle="4 tools consolidated into one window"
      tabs={[
        { id: "livingbenefitsprobability", label: "Living Benefits Probability", element: LivingBenefitsProbability },
        { id: "ltccostcalc", label: "LTC Cost Calc", element: LTCCostCalc },
        { id: "longtermcarehybrid", label: "Long Term Care Hybrid", element: LongTermCareHybrid },
        { id: "longtermcareplanner", label: "Long Term Care Planner", element: LongTermCarePlanner }
      ]}
    />
  );
}
