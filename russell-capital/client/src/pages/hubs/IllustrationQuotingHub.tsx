import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const IllustrationCompare = lazy(() => import("@/pages/portal/IllustrationCompare"));
const BatchIllustration = lazy(() => import("@/pages/portal/BatchIllustration"));
const CarrierComparison = lazy(() => import("@/pages/portal/CarrierComparison"));
const CarrierQuotes = lazy(() => import("@/pages/portal/CarrierQuotes"));
const CarrierRatings = lazy(() => import("@/pages/portal/CarrierRatings"));
const CarrierStrengthMonitor = lazy(() => import("@/pages/portal/CarrierStrengthMonitor"));
const QuickQuote = lazy(() => import("@/pages/portal/QuickQuote"));

export default function IllustrationQuotingHub() {
  return (
    <ToggleHub
      title="Illustration & Quoting"
      subtitle="7 tools consolidated into one window"
      tabs={[
        { id: "illustrationcompare", label: "Illustration Compare", element: IllustrationCompare },
        { id: "batchillustration", label: "Batch Illustration", element: BatchIllustration },
        { id: "carriercomparison", label: "Carrier Comparison", element: CarrierComparison },
        { id: "carrierquotes", label: "Carrier Quotes", element: CarrierQuotes },
        { id: "carrierratings", label: "Carrier Ratings", element: CarrierRatings },
        { id: "carrierstrengthmonitor", label: "Carrier Strength Monitor", element: CarrierStrengthMonitor },
        { id: "quickquote", label: "Quick Quote", element: QuickQuote }
      ]}
    />
  );
}
