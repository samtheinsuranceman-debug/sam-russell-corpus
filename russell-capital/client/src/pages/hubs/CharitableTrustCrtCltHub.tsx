import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const CharitableLeadTrustEngine = lazy(() => import("@/pages/portal/CharitableLeadTrustEngine"));
const CRTCalculator = lazy(() => import("@/pages/portal/CRTCalculator"));
const CRTDeepDive = lazy(() => import("@/pages/portal/CRTDeepDive"));
const CRTWealthReplacement = lazy(() => import("@/pages/portal/CRTWealthReplacement"));
const CRUTDeepDive = lazy(() => import("@/pages/portal/CRUTDeepDive"));
const CharitableGivingDashboard = lazy(() => import("@/pages/portal/CharitableGivingDashboard"));
const CharitableGivingOptimizer = lazy(() => import("@/pages/portal/CharitableGivingOptimizer"));
const CharitableLeadTrust = lazy(() => import("@/pages/portal/CharitableLeadTrust"));
const CharitableLeadTrustPlanner = lazy(() => import("@/pages/portal/CharitableLeadTrustPlanner"));
const CharitableRemainderTrustEngine = lazy(() => import("@/pages/portal/CharitableRemainderTrustEngine"));
const CharitableRemainderUniTrust = lazy(() => import("@/pages/portal/CharitableRemainderUniTrust"));
const CharitableStockCalc = lazy(() => import("@/pages/portal/CharitableStockCalc"));
const DAFStrategicPlanner = lazy(() => import("@/pages/portal/DAFStrategicPlanner"));
const DAFvsDirectCalc = lazy(() => import("@/pages/portal/DAFvsDirectCalc"));
const PhilanthropyImpactDashboard = lazy(() => import("@/pages/portal/PhilanthropyImpactDashboard"));
const PrivateFoundationPlanner = lazy(() => import("@/pages/portal/PrivateFoundationPlanner"));

export default function CharitableTrustCrtCltHub() {
  return (
    <ToggleHub
      title="Charitable Trust (CRT/CLT)"
      subtitle="16 tools consolidated into one window"
      tabs={[
        { id: "charitableleadtrustengine", label: "Charitable Lead Trust Engine", element: CharitableLeadTrustEngine },
        { id: "crtcalculator", label: "CRT Calculator", element: CRTCalculator },
        { id: "crtdeepdive", label: "CRT Deep Dive", element: CRTDeepDive },
        { id: "crtwealthreplacement", label: "CRT Wealth Replacement", element: CRTWealthReplacement },
        { id: "crutdeepdive", label: "CRUT Deep Dive", element: CRUTDeepDive },
        { id: "charitablegivingdashboard", label: "Charitable Giving Dashboard", element: CharitableGivingDashboard },
        { id: "charitablegivingoptimizer", label: "Charitable Giving Optimizer", element: CharitableGivingOptimizer },
        { id: "charitableleadtrust", label: "Charitable Lead Trust", element: CharitableLeadTrust },
        { id: "charitableleadtrustplanner", label: "Charitable Lead Trust Planner", element: CharitableLeadTrustPlanner },
        { id: "charitableremaindertrustengine", label: "Charitable Remainder Trust Engine", element: CharitableRemainderTrustEngine },
        { id: "charitableremainderunitrust", label: "Charitable Remainder Uni Trust", element: CharitableRemainderUniTrust },
        { id: "charitablestockcalc", label: "Charitable Stock Calc", element: CharitableStockCalc },
        { id: "dafstrategicplanner", label: "DAF Strategic Planner", element: DAFStrategicPlanner },
        { id: "dafvsdirectcalc", label: "DA Fvs Direct Calc", element: DAFvsDirectCalc },
        { id: "philanthropyimpactdashboard", label: "Philanthropy Impact Dashboard", element: PhilanthropyImpactDashboard },
        { id: "privatefoundationplanner", label: "Private Foundation Planner", element: PrivateFoundationPlanner }
      ]}
    />
  );
}
