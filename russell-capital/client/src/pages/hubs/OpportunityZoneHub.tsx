import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const OpportunityZoneCalc = lazy(() => import("@/pages/portal/OpportunityZoneCalc"));
const OpportunityZonePlanner = lazy(() => import("@/pages/portal/OpportunityZonePlanner"));
const OpportunityZoneTracker = lazy(() => import("@/pages/portal/OpportunityZoneTracker"));
const QualifiedOpportunityFund = lazy(() => import("@/pages/portal/QualifiedOpportunityFund"));

export default function OpportunityZoneHub() {
  return (
    <ToggleHub
      title="Opportunity Zone"
      subtitle="4 tools consolidated into one window"
      tabs={[
        { id: "opportunityzonecalc", label: "Opportunity Zone Calc", element: OpportunityZoneCalc },
        { id: "opportunityzoneplanner", label: "Opportunity Zone Planner", element: OpportunityZonePlanner },
        { id: "opportunityzonetracker", label: "Opportunity Zone Tracker", element: OpportunityZoneTracker },
        { id: "qualifiedopportunityfund", label: "Qualified Opportunity Fund", element: QualifiedOpportunityFund }
      ]}
    />
  );
}
