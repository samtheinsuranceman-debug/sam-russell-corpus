import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const RothConversionSTR = lazy(() => import("@/pages/portal/RothConversionSTR"));
const BackdoorRothCalc = lazy(() => import("@/pages/portal/BackdoorRothCalc"));
const BackdoorRothGuide = lazy(() => import("@/pages/portal/BackdoorRothGuide"));
const IULvsRoth = lazy(() => import("@/pages/portal/IULvsRoth"));
const InheritedRothPlanner = lazy(() => import("@/pages/portal/InheritedRothPlanner"));
const MegaBackdoorRoth = lazy(() => import("@/pages/portal/MegaBackdoorRoth"));
const MegaBackdoorRothCalc = lazy(() => import("@/pages/portal/MegaBackdoorRothCalc"));
const MultiGenerationalRothStrategy = lazy(() => import("@/pages/portal/MultiGenerationalRothStrategy"));
const RothConversionAnalyzer = lazy(() => import("@/pages/portal/RothConversionAnalyzer"));
const RothVsTraditionalCalc = lazy(() => import("@/pages/portal/RothVsTraditionalCalc"));

export default function RothStrategyHub() {
  return (
    <ToggleHub
      title="Roth Strategy"
      subtitle="10 tools consolidated into one window"
      tabs={[
        { id: "rothconversionstr", label: "Roth Conversion STR", element: RothConversionSTR },
        { id: "backdoorrothcalc", label: "Backdoor Roth Calc", element: BackdoorRothCalc },
        { id: "backdoorrothguide", label: "Backdoor Roth Guide", element: BackdoorRothGuide },
        { id: "iulvsroth", label: "IU Lvs Roth", element: IULvsRoth },
        { id: "inheritedrothplanner", label: "Inherited Roth Planner", element: InheritedRothPlanner },
        { id: "megabackdoorroth", label: "Mega Backdoor Roth", element: MegaBackdoorRoth },
        { id: "megabackdoorrothcalc", label: "Mega Backdoor Roth Calc", element: MegaBackdoorRothCalc },
        { id: "multigenerationalrothstrategy", label: "Multi Generational Roth Strategy", element: MultiGenerationalRothStrategy },
        { id: "rothconversionanalyzer", label: "Roth Conversion Analyzer", element: RothConversionAnalyzer },
        { id: "rothvstraditionalcalc", label: "Roth Vs Traditional Calc", element: RothVsTraditionalCalc }
      ]}
    />
  );
}
