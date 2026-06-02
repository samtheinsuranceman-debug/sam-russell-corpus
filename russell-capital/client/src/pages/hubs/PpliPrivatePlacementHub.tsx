import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const PrivatePlacementLifeInsurance = lazy(() => import("@/pages/portal/PrivatePlacementLifeInsurance"));
const PPLIModeler = lazy(() => import("@/pages/portal/PPLIModeler"));
const PrivatePlacement = lazy(() => import("@/pages/portal/PrivatePlacement"));
const PrivatePlacementAnnuity = lazy(() => import("@/pages/portal/PrivatePlacementAnnuity"));

export default function PpliPrivatePlacementHub() {
  return (
    <ToggleHub
      title="PPLI / Private Placement"
      subtitle="4 tools consolidated into one window"
      tabs={[
        { id: "privateplacementlifeinsurance", label: "Private Placement Life Insurance", element: PrivatePlacementLifeInsurance },
        { id: "pplimodeler", label: "PPLI Modeler", element: PPLIModeler },
        { id: "privateplacement", label: "Private Placement", element: PrivatePlacement },
        { id: "privateplacementannuity", label: "Private Placement Annuity", element: PrivatePlacementAnnuity }
      ]}
    />
  );
}
