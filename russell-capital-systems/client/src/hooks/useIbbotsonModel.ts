/**
 * useIbbotsonModel — React hook that wraps the shared Ibbotson model utility
 * for easy integration into any IUL calculator page.
 *
 * Provides:
 *   • Year selector state (default 2005)
 *   • Cap / floor / participation rate state (default 7.5% / 0% / 100%)
 *   • Computed year-by-year results, summary stats, and cash value projections
 *   • Helper to get credited rate for a specific year
 */

import { useState, useMemo } from "react";
import {
  type IbbotsonConfig,
  type IbbotsonYearResult,
  type IbbotsonSummary,
  type IbbotsonCashValueYear,
  runIbbotsonModel,
  getIbbotsonSummary,
  getIbbotsonCAGR,
  getAverageAnnualCreditedRate,
  projectCashValueWithIbbotson,
  calculateCreditedRate,
  SP500_ANNUAL_RETURNS,
  IBBOTSON_DEFAULT_START_YEAR,
  IBBOTSON_END_YEAR,
  IBBOTSON_START_YEAR,
  getAvailableYears,
  IBBOTSON_DISCLAIMER,
  IBBOTSON_SHORT_DISCLAIMER,
} from "@shared/ibbotsonModel";

export interface UseIbbotsonModelOptions {
  /** Initial start year. Default: 2005 */
  defaultStartYear?: number;
  /** Initial end year. Default: latest available */
  defaultEndYear?: number;
  /** Initial cap rate as decimal. Default: 0.075 */
  defaultCapRate?: number;
  /** Initial floor rate as decimal. Default: 0.0 */
  defaultFloorRate?: number;
  /** Initial participation rate as decimal. Default: 1.0 */
  defaultParticipationRate?: number;
}

export function useIbbotsonModel(options: UseIbbotsonModelOptions = {}) {
  const {
    defaultStartYear = IBBOTSON_DEFAULT_START_YEAR,
    defaultEndYear = IBBOTSON_END_YEAR,
    defaultCapRate = 0.075,
    defaultFloorRate = 0.0,
    defaultParticipationRate = 1.0,
  } = options;

  // ─── State ──────────────────────────────────────────────────────────────
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [endYear, setEndYear] = useState(defaultEndYear);
  const [capRate, setCapRate] = useState(defaultCapRate);
  const [floorRate, setFloorRate] = useState(defaultFloorRate);
  const [participationRate, setParticipationRate] = useState(defaultParticipationRate);

  // ─── Config object ──────────────────────────────────────────────────────
  const config: IbbotsonConfig = useMemo(() => ({
    capRate,
    floorRate,
    participationRate,
    startYear,
    endYear,
  }), [capRate, floorRate, participationRate, startYear, endYear]);

  // ─── Computed results ───────────────────────────────────────────────────
  const yearResults: IbbotsonYearResult[] = useMemo(
    () => runIbbotsonModel(config),
    [config]
  );

  const summary: IbbotsonSummary = useMemo(
    () => getIbbotsonSummary(config),
    [config]
  );

  const cagr = useMemo(
    () => getIbbotsonCAGR(config),
    [config]
  );

  const averageCreditedRate = useMemo(
    () => getAverageAnnualCreditedRate(config),
    [config]
  );

  // ─── Helper: get credited rate for a specific year ──────────────────────
  const getCreditedRateForYear = (year: number): number => {
    const raw = SP500_ANNUAL_RETURNS[year];
    if (raw === undefined) return 0;
    return calculateCreditedRate(raw, capRate, floorRate, participationRate);
  };

  // ─── Helper: get S&P 500 return for a specific year ─────────────────────
  const getSP500ReturnForYear = (year: number): number | undefined => {
    return SP500_ANNUAL_RETURNS[year];
  };

  // ─── Helper: project cash values ────────────────────────────────────────
  const projectCashValues = (
    annualPremium: number,
    premiumYears?: number,
    loadFee?: number,
    coiRate?: number,
  ): IbbotsonCashValueYear[] => {
    return projectCashValueWithIbbotson({
      ...config,
      annualPremium,
      premiumYears,
      loadFee,
      coiRate,
    });
  };

  // ─── Available years for selectors ──────────────────────────────────────
  const availableYears = useMemo(() => getAvailableYears(), []);

  return {
    // State
    startYear,
    setStartYear,
    endYear,
    setEndYear,
    capRate,
    setCapRate,
    floorRate,
    setFloorRate,
    participationRate,
    setParticipationRate,

    // Config
    config,

    // Computed
    yearResults,
    summary,
    cagr,
    averageCreditedRate,

    // Helpers
    getCreditedRateForYear,
    getSP500ReturnForYear,
    projectCashValues,
    availableYears,

    // Constants
    IBBOTSON_DISCLAIMER,
    IBBOTSON_SHORT_DISCLAIMER,
    IBBOTSON_START_YEAR,
    IBBOTSON_END_YEAR,
    IBBOTSON_DEFAULT_START_YEAR,
  };
}

export default useIbbotsonModel;

// Re-export types and constants for convenience
export {
  type IbbotsonConfig,
  type IbbotsonYearResult,
  type IbbotsonSummary,
  type IbbotsonCashValueYear,
  SP500_ANNUAL_RETURNS,
  IBBOTSON_DISCLAIMER,
  IBBOTSON_SHORT_DISCLAIMER,
  calculateCreditedRate,
  runIbbotsonModel,
  getIbbotsonSummary,
  getIbbotsonCAGR,
  projectCashValueWithIbbotson,
} from "@shared/ibbotsonModel";
