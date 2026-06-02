import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const CaptiveInsuranceIUL = lazy(() => import("@/pages/portal/CaptiveInsuranceIUL"));
const CaptiveInsuranceCalc = lazy(() => import("@/pages/portal/CaptiveInsuranceCalc"));
const CaptiveInsuranceModeler = lazy(() => import("@/pages/portal/CaptiveInsuranceModeler"));
const CaptiveInsurancePlanner = lazy(() => import("@/pages/portal/CaptiveInsurancePlanner"));

export default function CaptiveInsuranceHub() {
  return (
    <ToggleHub
      title="Captive Insurance"
      subtitle="4 tools consolidated into one window"
      tabs={[
        { id: "captiveinsuranceiul", label: "Captive Insurance IUL", element: CaptiveInsuranceIUL },
        { id: "captiveinsurancecalc", label: "Captive Insurance Calc", element: CaptiveInsuranceCalc },
        { id: "captiveinsurancemodeler", label: "Captive Insurance Modeler", element: CaptiveInsuranceModeler },
        { id: "captiveinsuranceplanner", label: "Captive Insurance Planner", element: CaptiveInsurancePlanner }
      ]}
    />
  );
}
