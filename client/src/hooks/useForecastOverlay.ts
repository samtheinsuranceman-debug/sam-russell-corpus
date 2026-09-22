// ============================================================
// useForecastOverlay — one hook any calculator page can call:
//   const fo = useForecastOverlay({ domain: "equities", base: series, baseRate: 0.06, engine: "iulProjection" });
//   <ForecastToggle {...fo} />   and chart fo.result.points when fo.on
// Fetches the current forecast for the domain (with provenance), applies the
// pure overlay over 20/30/40 years, and informs the hive when toggled so
// Samuel Goldman knows the visitor ran this calculator with the forecast on.
// ============================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { applyForecastOverlay, type ForecastDomain, type ForecastHorizon, type OverlayResult, type ProjectionPoint } from "@shared/forecastOverlay";

export interface UseForecastOverlayOptions {
  domain: ForecastDomain;
  /** The calculator's own year-by-year projection. */
  base: ProjectionPoint[];
  /** The growth assumption the calculator used, so contributions are preserved. */
  baseRate?: number;
  /** Engine name recorded in the hive when the toggle changes. */
  engine?: string;
  /** For equities/housing/wages: the page's own sourced annual-rate history. */
  history?: number[];
  historySource?: string;
  historyAsOf?: string;
  defaultHorizon?: ForecastHorizon;
}

export interface UseForecastOverlayResult {
  on: boolean;
  setOn: (on: boolean) => void;
  horizon: ForecastHorizon;
  setHorizon: (h: ForecastHorizon) => void;
  result: OverlayResult;
  loading: boolean;
  unavailableReason?: string;
  ledger: OverlayResult["ledger"];
}

export function useForecastOverlay(opts: UseForecastOverlayOptions): UseForecastOverlayResult {
  const [on, setOnState] = useState(false); // off by default: page contract rule 5
  const [horizon, setHorizon] = useState<ForecastHorizon>(opts.defaultHorizon ?? 30);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const inform = trpc.hive.inform.useMutation();

  const forecast = trpc.forecast.current.useQuery(
    { domain: opts.domain, horizon, history: opts.history, historySource: opts.historySource, historyAsOf: opts.historyAsOf },
    { enabled: on, staleTime: 60 * 60_000 },
  );

  const result = useMemo(
    () => applyForecastOverlay(opts.base, on ? forecast.data ?? null : null, horizon, { baseRate: opts.baseRate }),
    [opts.base, on, forecast.data, horizon, opts.baseRate],
  );

  const setOn = useCallback((next: boolean) => {
    setOnState(next);
    if (isAuthenticated) inform.mutate({ kind: "forecast_toggle", routePath: location, engine: opts.engine, payload: { on: next, horizon, domain: opts.domain } });
  }, [isAuthenticated, inform, location, opts.engine, horizon, opts.domain]);

  // When the overlay is on and applied, publish the horizon result to the hive as a calc result with its ledger.
  useEffect(() => {
    if (!on || !result.applied || !isAuthenticated) return;
    const last = result.points[result.points.length - 1];
    if (!last) return;
    inform.mutate({
      kind: "calc_result",
      routePath: location,
      engine: opts.engine ?? `forecastOverlay:${opts.domain}`,
      payload: { horizonYears: horizon, base: Math.round(last.base), overlay: Math.round(last.overlay), p10: Math.round(last.p10), p90: Math.round(last.p90), deltaAtHorizon: Math.round(result.deltaAtHorizon), forecastOn: true },
      source: result.ledger?.source,
      asOf: result.ledger?.asOf,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, result.applied, horizon, result.ledger?.asOf]);

  return {
    on, setOn, horizon, setHorizon, result,
    loading: on && forecast.isLoading,
    unavailableReason: on ? forecast.data?.unavailableReason ?? result.reason : undefined,
    ledger: result.ledger,
  };
}
