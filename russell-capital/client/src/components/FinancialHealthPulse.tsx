// @ts-nocheck
/**
 * FINANCIAL HEALTH PULSE — Monitors overall client financial health
 * Mounted once in AppShell. Aggregates all calculator results into
 * a single health score, tracks changes, identifies weak areas.
 */
import { useEffect, useRef } from "react";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";

let _healthScore = 0;
let _healthHistory: Array<{ score: number; timestamp: number }> = [];
let _weakestArea = "unknown";
let _alerts: string[] = [];

export function getHealthScore() { return _healthScore; }
export function getHealthHistory() { return _healthHistory; }
export function getWeakestArea() { return _weakestArea; }
export function getAlerts() { return _alerts; }

export default function FinancialHealthPulse() {
  const { results: calcResults } = useCalcResults();
  const { data: clientData } = useClientData();

  useEffect(() => {
    if (!calcResults) return;
    const areas = [
      { name: "tax", keywords: ["tax", "roth", "bracket"] },
      { name: "insurance", keywords: ["insurance", "iul", "life"] },
      { name: "estate", keywords: ["estate", "trust", "legacy"] },
      { name: "retirement", keywords: ["retirement", "401k", "ira"] },
    ];
    const resultKeys = Object.keys(calcResults);
    const areaScores = areas.map(area => {
      const matches = resultKeys.filter(k => area.keywords.some(kw => k.toLowerCase().includes(kw)));
      return { name: area.name, score: Math.min(100, matches.length * 25) };
    });
    _healthScore = Math.round(areaScores.reduce((s, a) => s + a.score, 0) / areaScores.length);
    _healthHistory = [..._healthHistory, { score: _healthScore, timestamp: Date.now() }].slice(-50);
    const weakest = areaScores.reduce((m, a) => a.score < m.score ? a : m, areaScores[0]);
    _weakestArea = weakest?.name || "unknown";
    const newAlerts: string[] = [];
    if (_healthScore < 25) newAlerts.push("CRITICAL: Financial health critically low");
    else if (_healthScore < 50) newAlerts.push("WARNING: Financial health below optimal");
    areaScores.forEach(a => { if (a.score === 0) newAlerts.push(`No ${a.name} calculators completed`); });
    _alerts = newAlerts;
  }, [calcResults, clientData]);

  return null;
}
