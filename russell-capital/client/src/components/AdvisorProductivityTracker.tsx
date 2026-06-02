// @ts-nocheck

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";

let sessionData = {
  pageTimes: {},
  completedCalculators: 0,
  bottlenecks: [],
  preparationComplete: false,
};

const AdvisorProductivityTracker = () => {
  const [location] = useLocation();
  const previousLocationRef = useRef(null);
  const currentPageStartTime = useRef(Date.now());
  const calcResults = useCalcResults();
  const clientData = useClientData();

  useEffect(() => {
    if (previousLocationRef.current) {
      const timeSpent = Date.now() - currentPageStartTime.current;
      if (!sessionData.pageTimes[previousLocationRef.current]) {
        sessionData.pageTimes[previousLocationRef.current] = 0;
      }
      sessionData.pageTimes[previousLocationRef.current] += timeSpent;
      if (timeSpent > 300000) {  // 5 minutes threshold
        if (!sessionData.bottlenecks.includes(previousLocationRef.current)) {
          sessionData.bottlenecks.push(previousLocationRef.current);
        }
      }
    }
    currentPageStartTime.current = Date.now();
    previousLocationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (calcResults && calcResults.completed) {
      sessionData.completedCalculators = calcResults.completed;
    }
  }, [calcResults]);

  useEffect(() => {
    if (clientData && clientData.isPreparationComplete !== undefined) {
      sessionData.preparationComplete = clientData.isPreparationComplete;
    }
  }, [clientData]);

  return null;
};

export function getProductivityScore() {
  const totalTime = Object.values(sessionData.pageTimes).reduce((a, b) => a + b, 0);
  return totalTime > 0 ? (sessionData.completedCalculators * 1000 / totalTime) : 0;
}

export function getSessionStats() {
  return {
    completedCalculators: sessionData.completedCalculators,
    preparationComplete: sessionData.preparationComplete,
  };
}

export function getBottlenecks() {
  return sessionData.bottlenecks;
}

export default AdvisorProductivityTracker;
