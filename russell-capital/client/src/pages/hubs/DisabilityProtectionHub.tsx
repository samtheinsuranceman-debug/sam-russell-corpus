import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const OverheadExpenseCalc = lazy(() => import("@/pages/portal/OverheadExpenseCalc"));
const DisabilityGapAnalysis = lazy(() => import("@/pages/portal/DisabilityGapAnalysis"));
const DisabilityGapAnalyzer = lazy(() => import("@/pages/portal/DisabilityGapAnalyzer"));
const DisabilityInsuranceCalc = lazy(() => import("@/pages/portal/DisabilityInsuranceCalc"));
const IncomeProtectionPlanner = lazy(() => import("@/pages/portal/IncomeProtectionPlanner"));
const OwnOccDisabilityCalc = lazy(() => import("@/pages/portal/OwnOccDisabilityCalc"));

export default function DisabilityProtectionHub() {
  return (
    <ToggleHub
      title="Disability Protection"
      subtitle="6 tools consolidated into one window"
      tabs={[
        { id: "overheadexpensecalc", label: "Overhead Expense Calc", element: OverheadExpenseCalc },
        { id: "disabilitygapanalysis", label: "Disability Gap Analysis", element: DisabilityGapAnalysis },
        { id: "disabilitygapanalyzer", label: "Disability Gap Analyzer", element: DisabilityGapAnalyzer },
        { id: "disabilityinsurancecalc", label: "Disability Insurance Calc", element: DisabilityInsuranceCalc },
        { id: "incomeprotectionplanner", label: "Income Protection Planner", element: IncomeProtectionPlanner },
        { id: "ownoccdisabilitycalc", label: "Own Occ Disability Calc", element: OwnOccDisabilityCalc }
      ]}
    />
  );
}
