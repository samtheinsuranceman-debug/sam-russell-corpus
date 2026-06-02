import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const KeyPersonInsuranceCalc = lazy(() => import("@/pages/portal/KeyPersonInsuranceCalc"));
const KeyPersonInsurance = lazy(() => import("@/pages/portal/KeyPersonInsurance"));
const KeyPersonInsurancePlanner = lazy(() => import("@/pages/portal/KeyPersonInsurancePlanner"));

export default function KeyPersonInsuranceHub() {
  return (
    <ToggleHub
      title="Key Person Insurance"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "keypersoninsurancecalc", label: "Key Person Insurance Calc", element: KeyPersonInsuranceCalc },
        { id: "keypersoninsurance", label: "Key Person Insurance", element: KeyPersonInsurance },
        { id: "keypersoninsuranceplanner", label: "Key Person Insurance Planner", element: KeyPersonInsurancePlanner }
      ]}
    />
  );
}
