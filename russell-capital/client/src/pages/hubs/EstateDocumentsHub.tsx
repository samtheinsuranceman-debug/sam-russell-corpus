import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const EstateFlowChart = lazy(() => import("@/pages/portal/EstateFlowChart"));
const DigitalAssetEstatePlanner = lazy(() => import("@/pages/portal/DigitalAssetEstatePlanner"));
const DigitalEstatePlanner = lazy(() => import("@/pages/portal/DigitalEstatePlanner"));
const EstateDocumentGenerator = lazy(() => import("@/pages/portal/EstateDocumentGenerator"));
const EstatePlanningSimulator = lazy(() => import("@/pages/portal/EstatePlanningSimulator"));
const EstatePlanningTimeline = lazy(() => import("@/pages/portal/EstatePlanningTimeline"));
const TrustComparisonMatrix = lazy(() => import("@/pages/portal/TrustComparisonMatrix"));
const TrustDecantingPlanner = lazy(() => import("@/pages/portal/TrustDecantingPlanner"));
const TrustFundingChecklist = lazy(() => import("@/pages/portal/TrustFundingChecklist"));
const TrustsPage = lazy(() => import("@/pages/portal/TrustsPage"));
const WillWriter = lazy(() => import("@/pages/portal/WillWriter"));

export default function EstateDocumentsHub() {
  return (
    <ToggleHub
      title="Estate Documents"
      subtitle="11 tools consolidated into one window"
      tabs={[
        { id: "estateflowchart", label: "Estate Flow Chart", element: EstateFlowChart },
        { id: "digitalassetestateplanner", label: "Digital Asset Estate Planner", element: DigitalAssetEstatePlanner },
        { id: "digitalestateplanner", label: "Digital Estate Planner", element: DigitalEstatePlanner },
        { id: "estatedocumentgenerator", label: "Estate Document Generator", element: EstateDocumentGenerator },
        { id: "estateplanningsimulator", label: "Estate Planning Simulator", element: EstatePlanningSimulator },
        { id: "estateplanningtimeline", label: "Estate Planning Timeline", element: EstatePlanningTimeline },
        { id: "trustcomparisonmatrix", label: "Trust Comparison Matrix", element: TrustComparisonMatrix },
        { id: "trustdecantingplanner", label: "Trust Decanting Planner", element: TrustDecantingPlanner },
        { id: "trustfundingchecklist", label: "Trust Funding Checklist", element: TrustFundingChecklist },
        { id: "trustspage", label: "Trusts Page", element: TrustsPage },
        { id: "willwriter", label: "Will Writer", element: WillWriter }
      ]}
    />
  );
}
