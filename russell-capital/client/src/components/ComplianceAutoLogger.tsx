// @ts-nocheck

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";

let complianceLog: any[] = [];
let auditTrail: any[] = [];
let suitabilityFlags: any[] = [];

const ComplianceAutoLogger = () => {
  const calcResults = useCalcResults();
  const clientData = useClientData();
  const [location] = useLocation();

  useEffect(() => {
    if (calcResults) {
      complianceLog.push({ timestamp: new Date(), event: 'calcResultChange', data: calcResults });
    }
  }, [calcResults]);

  useEffect(() => {
    if (clientData) {
      auditTrail.push({ timestamp: new Date(), event: 'clientDataAccessed', data: clientData });
    }
  }, [clientData]);

  useEffect(() => {
    auditTrail.push({ timestamp: new Date(), event: 'navigation', location });
  }, [location]);

  useEffect(() => {
    if (calcResults && calcResults.value > 1000) {  // Example suitability check
      suitabilityFlags.push({ timestamp: new Date(), issue: 'High value detected' });
    }
  }, [calcResults]);

  return null;
};

export default ComplianceAutoLogger;
export function getComplianceLog() { return complianceLog; }
export function getAuditTrail() { return auditTrail; }
export function getSuitabilityFlags() { return suitabilityFlags; }
