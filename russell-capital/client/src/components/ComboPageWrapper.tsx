/**
 * ComboPageWrapper — Universal layout wrapper for all COMBO/NEW pages.
 * Provides a 2-column layout:
 *   LEFT:  Main page content (children)
 *   RIGHT: Intelligence sidebar with:
 *     • ClientIntelligenceSummary (S16)
 *     • RussellNumberBadge (S6)
 *     • NextBestAction (S17)
 *     • AdvisorCommandScore (S18)
 *
 * Also handles:
 *   • S15: Breadcrumb navigation showing feature context
 *   • S19: Page-level AI Brain reporting (useReportToHub)
 *   • S20: Cross-page data sharing via UnifiedDataBus
 */
import { useEffect, useState } from "react";
import { ClientIntelligenceSummary } from "./ClientIntelligenceSummary";
import { RussellNumberBadge } from "./RussellNumberBadge";
import { NextBestAction } from "./NextBestAction";
import { AdvisorCommandScore } from "./AdvisorCommandScore";
import { useReportToHub, type DataCategory } from "@/contexts/UnifiedDataBusContext";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { ChevronRight, Home, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Link } from "wouter";

interface ComboPageWrapperProps {
  children: React.ReactNode;
  title: string;
  featureId: string;
  featureName: string;
  category: DataCategory;
  pageContext?: string;
  route?: string;
}

export function ComboPageWrapper({
  children,
  title,
  featureId,
  featureName,
  category,
  pageContext = "",
  route = "",
}: ComboPageWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // S19 + S20: Report page visit to Data Bus + AI Brain Hub
  const reportToHub = useReportToHub(featureId, featureName, category, route);

  // S3: Get AI recommendations for this page context
  const { getRecommendations } = useAIBrain();

  useEffect(() => {
    // Report visit to hub (sends payload to data bus)
    reportToHub({ pageVisit: true, visitedAt: Date.now() });
    // Get recommendations for this context
    getRecommendations?.(pageContext || featureId);
  }, [featureId]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryLabel =
    category === "ai-pro-suite" ? "AI Pro Suite" : category === "si-engine" ? "Sister Inventions" : "Calculators";

  return (
    <div className="min-h-screen">
      {/* Breadcrumb (S15) */}
      <div className="flex items-center gap-2 text-xs text-white/40 mb-4 px-1">
        <Link href="/portal" className="hover:text-white/60 transition-colors">
          <Home className="w-3.5 h-3.5" />
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white/30">{categoryLabel}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white/70 font-medium">{title}</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-auto text-white/30 hover:text-white/60 transition-colors"
          title={sidebarOpen ? "Hide intelligence panel" : "Show intelligence panel"}
        >
          {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Intelligence Sidebar */}
        {sidebarOpen && (
          <div className="w-72 shrink-0 space-y-4 hidden xl:block">
            <RussellNumberBadge />
            <AdvisorCommandScore />
            <ClientIntelligenceSummary />
            <NextBestAction pageContext={pageContext || featureId} maxActions={3} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ComboPageWrapper;
