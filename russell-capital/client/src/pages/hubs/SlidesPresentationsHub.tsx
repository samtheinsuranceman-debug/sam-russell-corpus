import { lazy } from "react";
import ToggleHub from "@/components/ToggleHub";

const SeminarGenerator = lazy(() => import("@/pages/portal/SeminarGenerator"));
const AISlideGenerator = lazy(() => import("@/pages/portal/AISlideGenerator"));
const BatchSlides = lazy(() => import("@/pages/portal/BatchSlides"));
const ClientPresentationBuilder = lazy(() => import("@/pages/portal/ClientPresentationBuilder"));
const MySlides = lazy(() => import("@/pages/portal/MySlides"));
const PresentationBuilder = lazy(() => import("@/pages/portal/PresentationBuilder"));
const PresentationVault = lazy(() => import("@/pages/portal/PresentationVault"));
const VideoProposalGenerator = lazy(() => import("@/pages/portal/VideoProposalGenerator"));

export default function SlidesPresentationsHub() {
  return (
    <ToggleHub
      title="Slides & Presentations"
      subtitle="8 tools consolidated into one window"
      tabs={[
        { id: "seminargenerator", label: "Seminar Generator", element: SeminarGenerator },
        { id: "aislidegenerator", label: "AI Slide Generator", element: AISlideGenerator },
        { id: "batchslides", label: "Batch Slides", element: BatchSlides },
        { id: "clientpresentationbuilder", label: "Client Presentation Builder", element: ClientPresentationBuilder },
        { id: "myslides", label: "My Slides", element: MySlides },
        { id: "presentationbuilder", label: "Presentation Builder", element: PresentationBuilder },
        { id: "presentationvault", label: "Presentation Vault", element: PresentationVault },
        { id: "videoproposalgenerator", label: "Video Proposal Generator", element: VideoProposalGenerator }
      ]}
    />
  );
}
