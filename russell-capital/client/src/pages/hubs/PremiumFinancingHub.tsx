import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const PremiumFinancing = lazy(() => import("@/pages/portal/PremiumFinancing"));
const FIACollateralStrategy = lazy(() => import("@/pages/portal/FIACollateralStrategy"));
const PremiumFinancingArbitrage = lazy(() => import("@/pages/portal/PremiumFinancingArbitrage"));
const PremiumFinancingCalculator = lazy(() => import("@/pages/portal/PremiumFinancingCalculator"));
const PremiumFinancingEngine = lazy(() => import("@/pages/portal/PremiumFinancingEngine"));

export default function PremiumFinancingHub() {
  return (
    <ToggleHub
      title="Premium Financing"
      subtitle="5 tools consolidated into one window"
      tabs={[
        { id: "premiumfinancing", label: "Premium Financing", element: PremiumFinancing },
        { id: "fiacollateralstrategy", label: "FIA Collateral Strategy", element: FIACollateralStrategy },
        { id: "premiumfinancingarbitrage", label: "Premium Financing Arbitrage", element: PremiumFinancingArbitrage },
        { id: "premiumfinancingcalculator", label: "Premium Financing Calculator", element: PremiumFinancingCalculator },
        { id: "premiumfinancingengine", label: "Premium Financing Engine", element: PremiumFinancingEngine }
      ]}
    />
  );
}
