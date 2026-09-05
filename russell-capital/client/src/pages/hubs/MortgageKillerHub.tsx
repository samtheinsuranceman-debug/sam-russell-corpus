import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const MortgageKiller = lazy(() => import("@/pages/portal/MortgageKiller"));
const MortgageKillerV2 = lazy(() => import("@/pages/portal/MortgageKillerV2"));
const MortgageKillerV3 = lazy(() => import("@/pages/portal/MortgageKillerV3"));

export default function MortgageKillerHub() {
  return (
    <ToggleHub
      title="Mortgage Killer"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "mortgagekiller", label: "Mortgage Killer", element: MortgageKiller },
        { id: "mortgagekillerv2", label: "Mortgage Killer V2", element: MortgageKillerV2 },
        { id: "mortgagekillerv3", label: "Mortgage Killer V3", element: MortgageKillerV3 }
      ]}
    />
  );
}
