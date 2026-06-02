/**
 * ═══════════════════════════════════════════════════════════════════
 * ORGANISM STATUS BAR — Persistent heartbeat indicator on every page
 * ═══════════════════════════════════════════════════════════════════
 */
import { useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Heart, Activity, Zap, AlertTriangle, Network, Shield } from "lucide-react";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";
import {
  useCrossCalcAggregation,
  useClientDataCompleteness,
  useProactiveAlerts,
  useRiskAlerts,
} from "@/hooks/useOrganism";
import { getMeshHealth } from "@/components/NeuralMeshInterceptor";

export function OrganismStatusBar() {
  const [location] = useLocation();
  const { results: calcResults } = useCalcResults();
  const { data: clientData } = useClientData();
  const crossAgg = useCrossCalcAggregation();
  const completeness = useClientDataCompleteness();
  const proactiveAlerts = useProactiveAlerts(calcResults, clientData || {});
  const riskAlerts = useRiskAlerts(calcResults, clientData || {});

  const meshHealth = useMemo(() => getMeshHealth(), [calcResults, clientData]);
  const alertCount = useMemo(() => proactiveAlerts.length + riskAlerts.length, [proactiveAlerts, riskAlerts]);

  const overallHealth = useMemo(() => {
    const d = completeness.percentage;
    const c = Math.min(100, (crossAgg.calcsUsed / 10) * 100);
    const a = Math.max(0, 100 - alertCount * 15);
    const m = meshHealth.healthScore;
    return Math.round((d + c + a + m) / 4);
  }, [completeness, crossAgg, alertCount, meshHealth]);

  // Don't show on the organism dashboard itself
  if (location === "/portal/organism-dashboard") return null;

  const healthColor = overallHealth >= 70 ? "text-emerald-400" : overallHealth >= 40 ? "text-amber-400" : "text-red-400";
  const pulseColor = overallHealth >= 70 ? "bg-emerald-400" : overallHealth >= 40 ? "bg-amber-400" : "bg-red-400";

  return (
    <Link href="/portal/organism-dashboard">
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 flex items-center justify-center gap-6 px-4 text-xs text-gray-400 cursor-pointer hover:bg-gray-800/95 transition-colors z-40">
        {/* Pulse indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${pulseColor} animate-pulse`} />
          <Heart className={`w-3.5 h-3.5 ${healthColor}`} />
          <span className={`font-bold ${healthColor}`}>{overallHealth}%</span>
        </div>

        <div className="w-px h-4 bg-gray-700" />

        {/* Calculators active */}
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>{crossAgg.calcsUsed} calcs</span>
        </div>

        <div className="w-px h-4 bg-gray-700" />

        {/* Data completeness */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>{completeness.percentage}% data</span>
        </div>

        <div className="w-px h-4 bg-gray-700 hidden sm:block" />

        {/* Alerts */}
        <div className={`items-center gap-1.5 hidden sm:flex ${alertCount > 0 ? "text-orange-400" : ""}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{alertCount} alerts</span>
        </div>

        <div className="w-px h-4 bg-gray-700 hidden md:block" />

        {/* Mesh connections */}
        <div className="items-center gap-1.5 hidden md:flex">
          <Network className="w-3.5 h-3.5 text-purple-400" />
          <span>{meshHealth.connectedPages}/{meshHealth.totalPages}</span>
        </div>

        <div className="w-px h-4 bg-gray-700 hidden lg:block" />

        {/* Last heartbeat */}
        <div className="items-center gap-1.5 hidden lg:flex">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>{new Date(meshHealth.lastHeartbeat).toLocaleTimeString()}</span>
        </div>
      </div>
    </Link>
  );
}
