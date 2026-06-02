import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const IDRComparisonCalc = lazy(() => import("@/pages/portal/IDRComparisonCalc"));
const PSLFCalculator = lazy(() => import("@/pages/portal/PSLFCalculator"));
const ResidencyToAttendingCalc = lazy(() => import("@/pages/portal/ResidencyToAttendingCalc"));
const StudentLoanOptimizer = lazy(() => import("@/pages/portal/StudentLoanOptimizer"));
const StudentLoanVsInvestCalc = lazy(() => import("@/pages/portal/StudentLoanVsInvestCalc"));

export default function StudentLoanHub() {
  return (
    <ToggleHub
      title="Student Loan"
      subtitle="5 tools consolidated into one window"
      tabs={[
        { id: "idrcomparisoncalc", label: "IDR Comparison Calc", element: IDRComparisonCalc },
        { id: "pslfcalculator", label: "PSLF Calculator", element: PSLFCalculator },
        { id: "residencytoattendingcalc", label: "Residency To Attending Calc", element: ResidencyToAttendingCalc },
        { id: "studentloanoptimizer", label: "Student Loan Optimizer", element: StudentLoanOptimizer },
        { id: "studentloanvsinvestcalc", label: "Student Loan Vs Invest Calc", element: StudentLoanVsInvestCalc }
      ]}
    />
  );
}
