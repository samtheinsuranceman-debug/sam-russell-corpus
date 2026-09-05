// @ts-nocheck

import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";

export default function ClientPortalEnhancer() {
  const [location] = useLocation();
  const { clientData } = useClientData();
  const calcResults = useCalcResults();
  const { dataBus } = useUnifiedDataBus();
  const lastInteractionRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());

  const handleInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    dataBus?.publish('interaction', { type: 'click' });
  }, [dataBus]);

  useEffect(() => {
    if (location.startsWith('/portal')) {
      startTimeRef.current = Date.now();
      document.addEventListener('click', handleInteraction);

      if (clientData && clientData.name) {
        const greeting = `Welcome back, ${clientData.name}!`;
        dataBus?.publish('greeting', greeting);
      }

      const monitorJourney = () => {
        if (calcResults) {
          dataBus?.publish('journeyProgress', calcResults.progress);
        }
      };
      const journeyInterval = setInterval(monitorJourney, 5000);

      const checkStuck = () => {
        if (Date.now() - lastInteractionRef.current > 60000) {
          dataBus?.publish('stuck', 'Suggest next steps');
        }
      };
      const stuckInterval = setInterval(checkStuck, 30000);

      if (clientData && clientData.milestones) {
        clientData.milestones.forEach(milestone => {
          if (milestone.achieved) {
            dataBus?.publish('milestoneAchieved', milestone);
          }
        });
      }

      return () => {
        const timeSpent = Date.now() - startTimeRef.current;
        dataBus?.publish('timeOnPage', timeSpent);
        document.removeEventListener('click', handleInteraction);
        clearInterval(journeyInterval);
        clearInterval(stuckInterval);
      };
    }
  }, [location, clientData, calcResults, dataBus, handleInteraction]);

  return null;
}
