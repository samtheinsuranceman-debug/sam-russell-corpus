import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const MultiGenWealthTransfer = lazy(() => import("@/pages/portal/MultiGenWealthTransfer"));
const DynastyTrustArchitect = lazy(() => import("@/pages/portal/DynastyTrustArchitect"));
const DynastyTrustPlanner = lazy(() => import("@/pages/portal/DynastyTrustPlanner"));
const GenerationalWealthSim = lazy(() => import("@/pages/portal/GenerationalWealthSim"));
const GenerationalWealthSimulator = lazy(() => import("@/pages/portal/GenerationalWealthSimulator"));
const MultiGenerationalWealthEngine = lazy(() => import("@/pages/portal/MultiGenerationalWealthEngine"));
const WealthTransferScoreboard = lazy(() => import("@/pages/portal/WealthTransferScoreboard"));
const WealthTransferScorecard = lazy(() => import("@/pages/portal/WealthTransferScorecard"));
const WealthTransferTimeline = lazy(() => import("@/pages/portal/WealthTransferTimeline"));
const WealthTransferVehicleComparison = lazy(() => import("@/pages/portal/WealthTransferVehicleComparison"));

export default function DynastyMultiGenTransferHub() {
  return (
    <ToggleHub
      title="Dynasty / Multi-Gen Transfer"
      subtitle="10 tools consolidated into one window"
      tabs={[
        { id: "multigenwealthtransfer", label: "Multi Gen Wealth Transfer", element: MultiGenWealthTransfer },
        { id: "dynastytrustarchitect", label: "Dynasty Trust Architect", element: DynastyTrustArchitect },
        { id: "dynastytrustplanner", label: "Dynasty Trust Planner", element: DynastyTrustPlanner },
        { id: "generationalwealthsim", label: "Generational Wealth Sim", element: GenerationalWealthSim },
        { id: "generationalwealthsimulator", label: "Generational Wealth Simulator", element: GenerationalWealthSimulator },
        { id: "multigenerationalwealthengine", label: "Multi Generational Wealth Engine", element: MultiGenerationalWealthEngine },
        { id: "wealthtransferscoreboard", label: "Wealth Transfer Scoreboard", element: WealthTransferScoreboard },
        { id: "wealthtransferscorecard", label: "Wealth Transfer Scorecard", element: WealthTransferScorecard },
        { id: "wealthtransfertimeline", label: "Wealth Transfer Timeline", element: WealthTransferTimeline },
        { id: "wealthtransfervehiclecomparison", label: "Wealth Transfer Vehicle Comparison", element: WealthTransferVehicleComparison }
      ]}
    />
  );
}
