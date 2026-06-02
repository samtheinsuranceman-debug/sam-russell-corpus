import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const PolicyReviewChecklist = lazy(() => import("@/pages/portal/PolicyReviewChecklist"));
const AIPolicyReviewGap = lazy(() => import("@/pages/portal/AIPolicyReviewGap"));
const PolicyLoans = lazy(() => import("@/pages/portal/PolicyLoans"));
const PolicyReplacementAnalyzer = lazy(() => import("@/pages/portal/PolicyReplacementAnalyzer"));
const PolicyReview = lazy(() => import("@/pages/portal/PolicyReview"));

export default function PolicyReviewHub() {
  return (
    <ToggleHub
      title="Policy Review"
      subtitle="5 tools consolidated into one window"
      tabs={[
        { id: "policyreviewchecklist", label: "Policy Review Checklist", element: PolicyReviewChecklist },
        { id: "aipolicyreviewgap", label: "AI Policy Review Gap", element: AIPolicyReviewGap },
        { id: "policyloans", label: "Policy Loans", element: PolicyLoans },
        { id: "policyreplacementanalyzer", label: "Policy Replacement Analyzer", element: PolicyReplacementAnalyzer },
        { id: "policyreview", label: "Policy Review", element: PolicyReview }
      ]}
    />
  );
}
