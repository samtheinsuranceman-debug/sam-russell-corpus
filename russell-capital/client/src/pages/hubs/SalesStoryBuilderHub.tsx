import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const SalesStoryBuilder = lazy(() => import("@/pages/portal/SalesStoryBuilder"));
const ClientStoryGenerator = lazy(() => import("@/pages/portal/ClientStoryGenerator"));
const WarStoryGenerator = lazy(() => import("@/pages/portal/WarStoryGenerator"));

export default function SalesStoryBuilderHub() {
  return (
    <ToggleHub
      title="Sales Story Builder"
      subtitle="3 tools consolidated into one window"
      tabs={[
        { id: "salesstorybuilder", label: "Sales Story Builder", element: SalesStoryBuilder },
        { id: "clientstorygenerator", label: "Client Story Generator", element: ClientStoryGenerator },
        { id: "warstorygenerator", label: "War Story Generator", element: WarStoryGenerator }
      ]}
    />
  );
}
