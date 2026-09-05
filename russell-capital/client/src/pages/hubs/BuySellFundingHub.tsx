import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const BuySellFundingCalc = lazy(() => import("@/pages/portal/BuySellFundingCalc"));
const BuySellAgreement = lazy(() => import("@/pages/portal/BuySellAgreement"));
const CrossPurchaseAgreement = lazy(() => import("@/pages/portal/CrossPurchaseAgreement"));

export default function BuySellFundingHub() {
  return (
    <ToggleHub
      title="Buy-Sell Funding"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "buysellfundingcalc", label: "Buy Sell Funding Calc", element: BuySellFundingCalc },
        { id: "buysellagreement", label: "Buy Sell Agreement", element: BuySellAgreement },
        { id: "crosspurchaseagreement", label: "Cross Purchase Agreement", element: CrossPurchaseAgreement }
      ]}
    />
  );
}
