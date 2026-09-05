import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const ReverseHeloc = lazy(() => import("@/pages/portal/ReverseHeloc"));
const HomeAffordabilityCalc = lazy(() => import("@/pages/portal/HomeAffordabilityCalc"));
const LeaseVsBuyCalc = lazy(() => import("@/pages/portal/LeaseVsBuyCalc"));
const PhysicianMortgageAnalyzer = lazy(() => import("@/pages/portal/PhysicianMortgageAnalyzer"));
const RefinanceBreakEvenCalc = lazy(() => import("@/pages/portal/RefinanceBreakEvenCalc"));
const ReverseMortgageCalc = lazy(() => import("@/pages/portal/ReverseMortgageCalc"));

export default function MortgageRefiToolsHub() {
  return (
    <ToggleHub
      title="Mortgage & Refi Tools"
      subtitle="6 tools consolidated into one window"
      tabs={[
        { id: "reverseheloc", label: "Reverse Heloc", element: ReverseHeloc },
        { id: "homeaffordabilitycalc", label: "Home Affordability Calc", element: HomeAffordabilityCalc },
        { id: "leasevsbuycalc", label: "Lease Vs Buy Calc", element: LeaseVsBuyCalc },
        { id: "physicianmortgageanalyzer", label: "Physician Mortgage Analyzer", element: PhysicianMortgageAnalyzer },
        { id: "refinancebreakevencalc", label: "Refinance Break Even Calc", element: RefinanceBreakEvenCalc },
        { id: "reversemortgagecalc", label: "Reverse Mortgage Calc", element: ReverseMortgageCalc }
      ]}
    />
  );
}
