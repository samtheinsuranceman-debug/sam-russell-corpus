import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const EstateTax = lazy(() => import("@/pages/portal/EstateTax"));
const EstateFreezeComparison = lazy(() => import("@/pages/portal/EstateFreezeComparison"));
const EstateLiquidityCalc = lazy(() => import("@/pages/portal/EstateLiquidityCalc"));
const EstateLiquidityPlanner = lazy(() => import("@/pages/portal/EstateLiquidityPlanner"));
const EstateWealthTransfer = lazy(() => import("@/pages/portal/EstateWealthTransfer"));
const PostMortemTaxPlanner = lazy(() => import("@/pages/portal/PostMortemTaxPlanner"));
const TaxableEstateCalculator = lazy(() => import("@/pages/portal/TaxableEstateCalculator"));

export default function EstateTaxLiquidityHub() {
  return (
    <ToggleHub
      title="Estate Tax & Liquidity"
      subtitle="7 tools consolidated into one window"
      tabs={[
        { id: "estatetax", label: "Estate Tax", element: EstateTax },
        { id: "estatefreezecomparison", label: "Estate Freeze Comparison", element: EstateFreezeComparison },
        { id: "estateliquiditycalc", label: "Estate Liquidity Calc", element: EstateLiquidityCalc },
        { id: "estateliquidityplanner", label: "Estate Liquidity Planner", element: EstateLiquidityPlanner },
        { id: "estatewealthtransfer", label: "Estate Wealth Transfer", element: EstateWealthTransfer },
        { id: "postmortemtaxplanner", label: "Post Mortem Tax Planner", element: PostMortemTaxPlanner },
        { id: "taxableestatecalculator", label: "Taxable Estate Calculator", element: TaxableEstateCalculator }
      ]}
    />
  );
}
