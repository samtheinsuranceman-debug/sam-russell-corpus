// @ts-nocheck

import React, { useState, useEffect, useMemo } from 'react';
import { runPortfolioSimulation } from './engine_montecarlo';
import { calculateTaxes } from './engine_tax';
import { calculateRetirement } from './engine_retirement';
import { calculatePortfolioMetrics } from './engine_portfolio';
import { calculateInsuranceEstate } from './engine_insurance_estate';

export function useMonteCarloForCalc(params: { initialPortfolio: any; years: number; numTrials?: number; inflationRate?: number; }) {
  const [results, setResults] = useState<any>(null);
  const [percentiles, setPercentiles] = useState<any>(null);
  const [probabilityOfRuin, setProbabilityOfRuin] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsRunning(true);
    setError(null);
    try {
      const simulationResult = runPortfolioSimulation(params);
      setResults(simulationResult.results);
      setPercentiles(simulationResult.percentiles);
      setProbabilityOfRuin(simulationResult.probabilityOfRuin);
    } catch (err: any) {
      setError(err.message || 'Error running simulation');
    } finally {
      setIsRunning(false);
    }
  }, [params]);

  const memoizedOutput = useMemo(() => ({
    results,
    percentiles,
    probabilityOfRuin,
    isRunning,
    error,
  }), [results, percentiles, probabilityOfRuin, isRunning, error]);

  return memoizedOutput;
}

export function useTaxCalcEngine(params: { income: number; filingStatus: string; deductions?: number; capitalGains?: number; }) {
  const [federalTax, setFederalTax] = useState<number | null>(null);
  const [stateTax, setStateTax] = useState<number | null>(null);
  const [effectiveRate, setEffectiveRate] = useState<number | null>(null);
  const [marginalRate, setMarginalRate] = useState<number | null>(null);
  const [capitalGainsTax, setCapitalGainsTax] = useState<number | null>(null);
  const [niit, setNiit] = useState<number | null>(null);
  const [amt, setAmt] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsRunning(true);
    setError(null);
    try {
      const taxResult = calculateTaxes(params);
      setFederalTax(taxResult.federalTax);
      setStateTax(taxResult.stateTax);
      setEffectiveRate(taxResult.effectiveRate);
      setMarginalRate(taxResult.marginalRate);
      setCapitalGainsTax(taxResult.capitalGainsTax);
      setNiit(taxResult.niit);
      setAmt(taxResult.amt);
    } catch (err: any) {
      setError(err.message || 'Error calculating taxes');
    } finally {
      setIsRunning(false);
    }
  }, [params]);

  const memoizedOutput = useMemo(() => ({
    federalTax,
    stateTax,
    effectiveRate,
    marginalRate,
    capitalGainsTax,
    niit,
    amt,
    isRunning,
    error,
  }), [federalTax, stateTax, effectiveRate, marginalRate, capitalGainsTax, niit, amt, isRunning, error]);

  return memoizedOutput;
}

export function useRetirementEngine(params: { age: number; earnings?: number; birthYear?: number; claimingAge?: number; portfolioValue?: number; }) {
  const [pia, setPia] = useState<number | null>(null);
  const [aime, setAime] = useState<number | null>(null);
  const [ssOptimalAge, setSsOptimalAge] = useState<number | null>(null);
  const [rmd, setRmd] = useState<number | null>(null);
  const [withdrawalStrategy, setWithdrawalStrategy] = useState<any>(null);
  const [incomeGap, setIncomeGap] = useState<number | null>(null);
  const [longevityRisk, setLongevityRisk] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsRunning(true);
    setError(null);
    try {
      const retirementResult = calculateRetirement(params);
      setPia(retirementResult.pia);
      setAime(retirementResult.aime);
      setSsOptimalAge(retirementResult.ssOptimalAge);
      setRmd(retirementResult.rmd);
      setWithdrawalStrategy(retirementResult.withdrawalStrategy);
      setIncomeGap(retirementResult.incomeGap);
      setLongevityRisk(retirementResult.longevityRisk);
    } catch (err: any) {
      setError(err.message || 'Error calculating retirement data');
    } finally {
      setIsRunning(false);
    }
  }, [params]);

  const memoizedOutput = useMemo(() => ({
    pia,
    aime,
    ssOptimalAge,
    rmd,
    withdrawalStrategy,
    incomeGap,
    longevityRisk,
    isRunning,
    error,
  }), [pia, aime, ssOptimalAge, rmd, withdrawalStrategy, incomeGap, longevityRisk, isRunning, error]);

  return memoizedOutput;
}

export function usePortfolioEngine(params: { returns: number[]; benchmarkReturns?: number[]; riskFreeRate?: number; }) {
  const [sharpe, setSharpe] = useState<number | null>(null);
  const [sortino, setSortino] = useState<number | null>(null);
  const [treynor, setTreynor] = useState<number | null>(null);
  const [beta, setBeta] = useState<number | null>(null);
  const [alpha, setAlpha] = useState<number | null>(null);
  const [maxDrawdown, setMaxDrawdown] = useState<number | null>(null);
  const [var95, setVar95] = useState<number | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsRunning(true);
    setError(null);
    try {
      const portfolioResult = calculatePortfolioMetrics(params);
      setSharpe(portfolioResult.sharpe);
      setSortino(portfolioResult.sortino);
      setTreynor(portfolioResult.treynor);
      setBeta(portfolioResult.beta);
      setAlpha(portfolioResult.alpha);
      setMaxDrawdown(portfolioResult.maxDrawdown);
      setVar95(portfolioResult.var95);
      setCorrelationMatrix(portfolioResult.correlationMatrix);
    } catch (err: any) {
      setError(err.message || 'Error calculating portfolio metrics');
    } finally {
      setIsRunning(false);
    }
  }, [params]);

  const memoizedOutput = useMemo(() => ({
    sharpe,
    sortino,
    treynor,
    beta,
    alpha,
    maxDrawdown,
    var95,
    correlationMatrix,
    isRunning,
    error,
  }), [sharpe, sortino, treynor, beta, alpha, maxDrawdown, var95, correlationMatrix, isRunning, error]);

  return memoizedOutput;
}

export function useInsuranceEstateEngine(params: { age: number; income?: number; estateValue?: number; dependents?: number; }) {
  const [lifeInsuranceNeed, setLifeInsuranceNeed] = useState<number | null>(null);
  const [ltcNeed, setLtcNeed] = useState<number | null>(null);
  const [disabilityNeed, setDisabilityNeed] = useState<number | null>(null);
  const [estateTax, setEstateTax] = useState<number | null>(null);
  const [umbrellaRecommendation, setUmbrellaRecommendation] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsRunning(true);
    setError(null);
    try {
      const insuranceResult = calculateInsuranceEstate(params);
      setLifeInsuranceNeed(insuranceResult.lifeInsuranceNeed);
      setLtcNeed(insuranceResult.ltcNeed);
      setDisabilityNeed(insuranceResult.disabilityNeed);
      setEstateTax(insuranceResult.estateTax);
      setUmbrellaRecommendation(insuranceResult.umbrellaRecommendation);
    } catch (err: any) {
      setError(err.message || 'Error calculating insurance/estate data');
    } finally {
      setIsRunning(false);
    }
  }, [params]);

  const memoizedOutput = useMemo(() => ({
    lifeInsuranceNeed,
    ltcNeed,
    disabilityNeed,
    estateTax,
    umbrellaRecommendation,
    isRunning,
    error,
  }), [lifeInsuranceNeed, ltcNeed, disabilityNeed, estateTax, umbrellaRecommendation, isRunning, error]);

  return memoizedOutput;
}

export function useUnifiedFinancialPicture() {
  const monteCarloData = useMonteCarloForCalc({ initialPortfolio: {}, years: 0 });  // Placeholder params
  const taxData = useTaxCalcEngine({ income: 0, filingStatus: '' });  // Placeholder params
  const retirementData = useRetirementEngine({ age: 0 });  // Placeholder params
  const portfolioData = usePortfolioEngine({ returns: [] });  // Placeholder params
  const insuranceData = useInsuranceEstateEngine({ age: 0 });  // Placeholder params

  const memoizedOutput = useMemo(() => ({
    netWorth: 0,  // Simplified aggregation
    riskScore: monteCarloData.probabilityOfRuin || 0,
    retirementReadiness: retirementData.incomeGap || 0,
    taxEfficiency: taxData.effectiveRate || 0,
    insuranceCoverage: insuranceData.lifeInsuranceNeed || 0,
    estateHealth: insuranceData.estateTax || 0,
  }), [
    monteCarloData.probabilityOfRuin,
    retirementData.incomeGap,
    taxData.effectiveRate,
    insuranceData.lifeInsuranceNeed,
    insuranceData.estateTax,
  ]);

  return memoizedOutput;
}
