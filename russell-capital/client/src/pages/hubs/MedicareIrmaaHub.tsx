import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const MedicareIRMAA = lazy(() => import("@/pages/portal/MedicareIRMAA"));
const MedicareIRMAACalc = lazy(() => import("@/pages/portal/MedicareIRMAACalc"));
const MedicareIRMAAPlanner = lazy(() => import("@/pages/portal/MedicareIRMAAPlanner"));
const MedicarePartDPlanner = lazy(() => import("@/pages/portal/MedicarePartDPlanner"));

export default function MedicareIrmaaHub() {
  return (
    <ToggleHub
      title="Medicare / IRMAA"
      subtitle="4 tools consolidated into one window"
      tabs={[
        { id: "medicareirmaa", label: "Medicare IRMAA", element: MedicareIRMAA },
        { id: "medicareirmaacalc", label: "Medicare IRMAA Calc", element: MedicareIRMAACalc },
        { id: "medicareirmaaplanner", label: "Medicare IRMAA Planner", element: MedicareIRMAAPlanner },
        { id: "medicarepartdplanner", label: "Medicare Part D Planner", element: MedicarePartDPlanner }
      ]}
    />
  );
}
