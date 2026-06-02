import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const SplitDollarLifeInsurance = lazy(() => import("@/pages/portal/SplitDollarLifeInsurance"));
const SplitDollarLife = lazy(() => import("@/pages/portal/SplitDollarLife"));

export default function SplitDollarHub() {
  return (
    <ToggleHub
      title="Split-Dollar"
      subtitle="2 tools consolidated into one window"
      tabs={[
        { id: "splitdollarlifeinsurance", label: "Split Dollar Life Insurance", element: SplitDollarLifeInsurance },
        { id: "splitdollarlife", label: "Split Dollar Life", element: SplitDollarLife }
      ]}
    />
  );
}
