import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const SLATDeepDive = lazy(() => import("@/pages/portal/SLATDeepDive"));
const SLATPlanner = lazy(() => import("@/pages/portal/SLATPlanner"));
const SpousalLifetimeAccess = lazy(() => import("@/pages/portal/SpousalLifetimeAccess"));
const SpousalLifetimeAccessTrust = lazy(() => import("@/pages/portal/SpousalLifetimeAccessTrust"));

export default function SlatSpousalTrustHub() {
  return (
    <ToggleHub
      title="SLAT / Spousal Trust"
      subtitle="4 tools consolidated into one window"
      tabs={[
        { id: "slatdeepdive", label: "SLAT Deep Dive", element: SLATDeepDive },
        { id: "slatplanner", label: "SLAT Planner", element: SLATPlanner },
        { id: "spousallifetimeaccess", label: "Spousal Lifetime Access", element: SpousalLifetimeAccess },
        { id: "spousallifetimeaccesstrust", label: "Spousal Lifetime Access Trust", element: SpousalLifetimeAccessTrust }
      ]}
    />
  );
}
