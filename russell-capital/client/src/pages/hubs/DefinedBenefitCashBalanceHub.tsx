import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const CashBalancePlanCalc = lazy(() => import("@/pages/portal/CashBalancePlanCalc"));
const CashBalancePlanDesigner = lazy(() => import("@/pages/portal/CashBalancePlanDesigner"));
const DefinedBenefitPlanDesigner = lazy(() => import("@/pages/portal/DefinedBenefitPlanDesigner"));
const DefinedBenefitPlanner = lazy(() => import("@/pages/portal/DefinedBenefitPlanner"));
const QualifiedPlanMaximizer = lazy(() => import("@/pages/portal/QualifiedPlanMaximizer"));

export default function DefinedBenefitCashBalanceHub() {
  return (
    <ToggleHub
      title="Defined Benefit / Cash Balance"
      subtitle="5 tools consolidated into one window"
      tabs={[
        { id: "cashbalanceplancalc", label: "Cash Balance Plan Calc", element: CashBalancePlanCalc },
        { id: "cashbalanceplandesigner", label: "Cash Balance Plan Designer", element: CashBalancePlanDesigner },
        { id: "definedbenefitplandesigner", label: "Defined Benefit Plan Designer", element: DefinedBenefitPlanDesigner },
        { id: "definedbenefitplanner", label: "Defined Benefit Planner", element: DefinedBenefitPlanner },
        { id: "qualifiedplanmaximizer", label: "Qualified Plan Maximizer", element: QualifiedPlanMaximizer }
      ]}
    />
  );
}
