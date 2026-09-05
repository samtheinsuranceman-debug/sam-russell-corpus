import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const TaxLossHarvestingScanner = lazy(() => import("@/pages/portal/TaxLossHarvestingScanner"));
const CapitalGainsTaxCalc = lazy(() => import("@/pages/portal/CapitalGainsTaxCalc"));
const TaxGainLossCalc = lazy(() => import("@/pages/portal/TaxGainLossCalc"));
const TaxLossHarvestCalc = lazy(() => import("@/pages/portal/TaxLossHarvestCalc"));
const TaxLossHarvesting = lazy(() => import("@/pages/portal/TaxLossHarvesting"));
const TaxLossHarvestingEngine = lazy(() => import("@/pages/portal/TaxLossHarvestingEngine"));

export default function TaxLossHarvestingHub() {
  return (
    <ToggleHub
      title="Tax Loss Harvesting"
      subtitle="6 tools consolidated into one window"
      tabs={[
        { id: "taxlossharvestingscanner", label: "Tax Loss Harvesting Scanner", element: TaxLossHarvestingScanner },
        { id: "capitalgainstaxcalc", label: "Capital Gains Tax Calc", element: CapitalGainsTaxCalc },
        { id: "taxgainlosscalc", label: "Tax Gain Loss Calc", element: TaxGainLossCalc },
        { id: "taxlossharvestcalc", label: "Tax Loss Harvest Calc", element: TaxLossHarvestCalc },
        { id: "taxlossharvesting", label: "Tax Loss Harvesting", element: TaxLossHarvesting },
        { id: "taxlossharvestingengine", label: "Tax Loss Harvesting Engine", element: TaxLossHarvestingEngine }
      ]}
    />
  );
}
