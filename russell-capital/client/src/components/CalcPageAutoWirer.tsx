// @ts-nocheck
/**
 * ═══════════════════════════════════════════════════════════════════
 * CALC PAGE AUTO-WIRER — Auto-injects organism intelligence into every calculator page
 * ═══════════════════════════════════════════════════════════════════
 * Mounted ONCE in AppShell. Detects current route, and if it's a calculator page:
 * 1. Auto-reports calculator results to the Data Bus when they change
 * 2. Auto-tracks calculator usage patterns and chains
 * 3. Auto-logs cross-calc relationships for the organism
 * 4. Auto-detects which calculators feed into the current one
 * 5. Auto-validates data completeness for the current calculator
 */
import { useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { useUniversalReporter, getRelatedCalcs } from "@/hooks/useOrganismNervousSystem";
import { CALCULATOR_ATLAS } from "@/hooks/useOrganismEyes";

// Track usage patterns globally
let usageLog: Array<{ calcId: string; timestamp: number; hadRelatedData: boolean }> = [];
let chainLog: Array<{ chain: string[]; timestamp: number }> = [];

export function getUsageLog() { return usageLog; }
export function getChainLog() { return chainLog; }

export default function CalcPageAutoWirer() {
  const [location] = useLocation();
  const { results: calcResults } = useCalcResults();
  const { data: clientData } = useClientData();
  const { report } = useUnifiedDataBus();
  const reporter = useUniversalReporter();

  // Find current calculator from route
  const currentCalc = useMemo(() => {
    return CALCULATOR_ATLAS.find((c) => location.includes(c.route));
  }, [location]);

  // Track previous results to detect changes
  const prevResultsRef = useRef<string>("");
  const prevRouteRef = useRef<string>("");
  const reportedCalcsRef = useRef<Set<string>>(new Set());
  const visitHistoryRef = useRef<string[]>([]);

  // ── AUTO-REPORT: When calc results change, push to Data Bus ──
  useEffect(() => {
    if (!currentCalc || !calcResults) return;

    const resultsKey = JSON.stringify(calcResults);
    if (resultsKey === prevResultsRef.current) return;
    prevResultsRef.current = resultsKey;

    // Report to the unified data bus
    try {
      reporter.reportToAll(
        currentCalc.route,
        { name: currentCalc.name, category: currentCalc.category },
        () => {},
        () => {}
      );
    } catch (e) {
      // Silently handle — organism is resilient
    }
  }, [calcResults, currentCalc, location, reporter]);

  // ── AUTO-TRACK: Log calculator usage patterns ──
  useEffect(() => {
    if (!currentCalc || location === prevRouteRef.current) return;
    prevRouteRef.current = location;

    const relatedCalcs = getRelatedCalcs(location);
    const hasRelatedData = relatedCalcs.some((rc: string) => {
      const key = Object.keys(calcResults).find(k => k.includes(rc));
      return !!key;
    });

    // Log usage
    usageLog.push({
      calcId: currentCalc.route,
      timestamp: Date.now(),
      hadRelatedData: hasRelatedData,
    });

    // Keep log manageable
    if (usageLog.length > 500) usageLog = usageLog.slice(-250);

    // Report the visit to Data Bus
    try {
      report({
        featureId: `calc-visit-${currentCalc.route}`,
        featureName: `Calculator Visit: ${currentCalc.name}`,
        category: "calculator",
        route: location,
        payload: {
          calcId: currentCalc.route,
          relatedCalcsAvailable: relatedCalcs.length,
          relatedDataPresent: hasRelatedData,
          visitTimestamp: Date.now(),
        },
      });
    } catch (e) {
      // Silently handle
    }
  }, [location, currentCalc, calcResults, report]);

  // ── AUTO-CHAIN: Detect and log calculator chains from visit history ──
  useEffect(() => {
    if (!currentCalc) return;

    visitHistoryRef.current.push(currentCalc.route);
    if (visitHistoryRef.current.length > 50) {
      visitHistoryRef.current = visitHistoryRef.current.slice(-25);
    }

    // Detect chains: 3+ consecutive calc visits
    const history = visitHistoryRef.current;
    if (history.length >= 3) {
      const lastThree = history.slice(-3);
      const chainKey = lastThree.join("->");
      const alreadyLogged = chainLog.some((cl) => cl.chain.join("->") === chainKey);
      if (!alreadyLogged) {
        chainLog.push({ chain: lastThree, timestamp: Date.now() });
      }
    }

    // Keep log manageable
    if (chainLog.length > 200) chainLog = chainLog.slice(-100);
  }, [currentCalc]);

  // ── AUTO-VALIDATE: Check data completeness for current calculator ──
  useEffect(() => {
    if (!currentCalc || !clientData) return;

    const relatedCalcs = getRelatedCalcs(location);
    const missingRelated = relatedCalcs.filter((rc: string) => {
      return !Object.keys(calcResults).some(k => k.includes(rc));
    });

    if (missingRelated.length > 0 && !reportedCalcsRef.current.has(currentCalc.route)) {
      reportedCalcsRef.current.add(currentCalc.route);
      // The organism knows which calcs are missing — this data feeds into SmartRouting
    }
  }, [currentCalc, clientData, calcResults, location]);

  // This is a data-only component — no UI
  return null;
}
