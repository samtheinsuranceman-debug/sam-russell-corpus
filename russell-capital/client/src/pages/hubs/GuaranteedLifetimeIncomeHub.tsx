import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const WithdrawalSequencing = lazy(() => import("@/pages/portal/WithdrawalSequencing"));
const AnnuityIncomeBridge = lazy(() => import("@/pages/portal/AnnuityIncomeBridge"));
const IncomeAnnuityTop10 = lazy(() => import("@/pages/portal/IncomeAnnuityTop10"));
const LifetimeGuaranteedIncome = lazy(() => import("@/pages/portal/LifetimeGuaranteedIncome"));
const LongitudinalRiskOptimizer = lazy(() => import("@/pages/portal/LongitudinalRiskOptimizer"));
const RetirementGuardrails = lazy(() => import("@/pages/portal/RetirementGuardrails"));
const RetirementSpendingGuardrails = lazy(() => import("@/pages/portal/RetirementSpendingGuardrails"));
const SafeWithdrawalCalc = lazy(() => import("@/pages/portal/SafeWithdrawalCalc"));
const WithdrawalRateOptimizer = lazy(() => import("@/pages/portal/WithdrawalRateOptimizer"));

export default function GuaranteedLifetimeIncomeHub() {
  return (
    <ToggleHub
      title="Guaranteed Lifetime Income"
      subtitle="9 tools consolidated into one window"
      tabs={[
        { id: "withdrawalsequencing", label: "Withdrawal Sequencing", element: WithdrawalSequencing },
        { id: "annuityincomebridge", label: "Annuity Income Bridge", element: AnnuityIncomeBridge },
        { id: "incomeannuitytop10", label: "Income Annuity Top10", element: IncomeAnnuityTop10 },
        { id: "lifetimeguaranteedincome", label: "Lifetime Guaranteed Income", element: LifetimeGuaranteedIncome },
        { id: "longitudinalriskoptimizer", label: "Longitudinal Risk Optimizer", element: LongitudinalRiskOptimizer },
        { id: "retirementguardrails", label: "Retirement Guardrails", element: RetirementGuardrails },
        { id: "retirementspendingguardrails", label: "Retirement Spending Guardrails", element: RetirementSpendingGuardrails },
        { id: "safewithdrawalcalc", label: "Safe Withdrawal Calc", element: SafeWithdrawalCalc },
        { id: "withdrawalrateoptimizer", label: "Withdrawal Rate Optimizer", element: WithdrawalRateOptimizer }
      ]}
    />
  );
}
