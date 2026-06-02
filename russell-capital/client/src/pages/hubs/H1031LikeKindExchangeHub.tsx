import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const TaxDeferredExchangeTimeline = lazy(() => import("@/pages/portal/TaxDeferredExchangeTimeline"));
const DSTAnalyzer = lazy(() => import("@/pages/portal/DSTAnalyzer"));
const Exchange1031Analyzer = lazy(() => import("@/pages/portal/Exchange1031Analyzer"));
const Exchange1031Calc = lazy(() => import("@/pages/portal/Exchange1031Calc"));
const LikeKindExchangeCalc = lazy(() => import("@/pages/portal/LikeKindExchangeCalc"));
const Section1031AdvancedExchange = lazy(() => import("@/pages/portal/Section1031AdvancedExchange"));

export default function H1031LikeKindExchangeHub() {
  return (
    <ToggleHub
      title="1031 / Like-Kind Exchange"
      subtitle="6 tools consolidated into one window"
      tabs={[
        { id: "taxdeferredexchangetimeline", label: "Tax Deferred Exchange Timeline", element: TaxDeferredExchangeTimeline },
        { id: "dstanalyzer", label: "DST Analyzer", element: DSTAnalyzer },
        { id: "exchange1031analyzer", label: "Exchange1031Analyzer", element: Exchange1031Analyzer },
        { id: "exchange1031calc", label: "Exchange1031Calc", element: Exchange1031Calc },
        { id: "likekindexchangecalc", label: "Like Kind Exchange Calc", element: LikeKindExchangeCalc },
        { id: "section1031advancedexchange", label: "Section1031Advanced Exchange", element: Section1031AdvancedExchange }
      ]}
    />
  );
}
