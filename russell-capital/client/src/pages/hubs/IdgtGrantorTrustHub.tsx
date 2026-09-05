import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const IDGTAdvancedModeler = lazy(() => import("@/pages/portal/IDGTAdvancedModeler"));
const GrantorTrustStrategy = lazy(() => import("@/pages/portal/GrantorTrustStrategy"));
const IDGTModeler = lazy(() => import("@/pages/portal/IDGTModeler"));

export default function IdgtGrantorTrustHub() {
  return (
    <ToggleHub
      title="IDGT / Grantor Trust"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "idgtadvancedmodeler", label: "IDGT Advanced Modeler", element: IDGTAdvancedModeler },
        { id: "grantortruststrategy", label: "Grantor Trust Strategy", element: GrantorTrustStrategy },
        { id: "idgtmodeler", label: "IDGT Modeler", element: IDGTModeler }
      ]}
    />
  );
}
