import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const SocialSecurityBridge = lazy(() => import("@/pages/portal/SocialSecurityBridge"));
const SocialSecurityBridgeStrategy = lazy(() => import("@/pages/portal/SocialSecurityBridgeStrategy"));
const SocialSecurityMaximizer = lazy(() => import("@/pages/portal/SocialSecurityMaximizer"));
const SocialSecurityOptimizer = lazy(() => import("@/pages/portal/SocialSecurityOptimizer"));
const SpousalSSCalc = lazy(() => import("@/pages/portal/SpousalSSCalc"));
const SurvivorBenefitPlanner = lazy(() => import("@/pages/portal/SurvivorBenefitPlanner"));

export default function SocialSecurityOptimizerHub() {
  return (
    <ToggleHub
      title="Social Security Optimizer"
      subtitle="6 tools consolidated into one window"
      tabs={[
        { id: "socialsecuritybridge", label: "Social Security Bridge", element: SocialSecurityBridge },
        { id: "socialsecuritybridgestrategy", label: "Social Security Bridge Strategy", element: SocialSecurityBridgeStrategy },
        { id: "socialsecuritymaximizer", label: "Social Security Maximizer", element: SocialSecurityMaximizer },
        { id: "socialsecurityoptimizer", label: "Social Security Optimizer", element: SocialSecurityOptimizer },
        { id: "spousalsscalc", label: "Spousal SS Calc", element: SpousalSSCalc },
        { id: "survivorbenefitplanner", label: "Survivor Benefit Planner", element: SurvivorBenefitPlanner }
      ]}
    />
  );
}
