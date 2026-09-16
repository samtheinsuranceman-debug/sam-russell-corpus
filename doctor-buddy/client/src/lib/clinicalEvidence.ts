/**
 * Gather whatever evidence this edition may read about the person in front
 * of us and run the psychometric-financial bridge over it.
 *
 * Clinical edition, signed in: the server's authenticated finance.readiness
 * snapshot (digital-twin history, medication adherence, mental credit score)
 * merged with a locally scored intake. Safety fields take the worst reading
 * from any source; the intake always counts.
 *
 * Public wellness edition: the person's own 1-5 check-ins from /progress and
 * any pause they set, both kept in this browser. No clinical procedure is
 * called (the server would refuse it anyway), no stored clinical result is
 * read, and every string in the profile is rewritten so nothing reads as a
 * clinical instrument or a diagnosis.
 */

import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { loadLocalResult } from "@/lib/intakeStorage";
import { loadPause, loadWellnessCheckins } from "@/lib/financeStorage";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";
import { deriveRiskFeatures } from "@shared/intake/riskFeatures";
import {
  assessFinancialReadiness,
  snapshotFromIntake,
  type ClinicalSnapshot,
  type FinancialContext,
  type FinancialReadinessProfile,
} from "@shared/engines/psychFinancialBridge";
import {
  applyPause,
  mergeParts,
  publicSafeProfile,
  snapshotFromWellnessCheckins,
  type SelfPause,
} from "@shared/engines/readinessEvidence";

export interface ClinicalEvidence {
  snapshot: ClinicalSnapshot;
  profile: FinancialReadinessProfile;
  /** True when at least one real source contributed (clinical or check-in). */
  hasClinicalData: boolean;
  /** Clinical edition: a scored intake exists. Public edition: a check-in exists. */
  hasIntake: boolean;
  isAuthenticated: boolean;
  /** The pause the person set, if any. */
  pause: SelfPause | null;
}

export function useClinicalEvidence(context: FinancialContext = {}, pauseOverride?: SelfPause | null): ClinicalEvidence {
  const { isAuthenticated } = useAuth();
  const contextKey = JSON.stringify(context);

  // Clinical edition only. In the public edition this query never runs: the
  // procedure is server-blocked there and the hook does not even ask.
  const { data: serverEvidence } = trpc.finance.readiness.useQuery(JSON.parse(contextKey) as FinancialContext, {
    enabled: CLINICAL_TOOLS_ENABLED && isAuthenticated,
    retry: false,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const ctx = JSON.parse(contextKey) as FinancialContext;
    const pause = pauseOverride === undefined ? loadPause() : pauseOverride;

    if (!CLINICAL_TOOLS_ENABLED) {
      const checkins = snapshotFromWellnessCheckins(loadWellnessCheckins());
      const snapshot = mergeParts([checkins]);
      const profile = applyPause(publicSafeProfile(assessFinancialReadiness(snapshot, ctx)), pause);
      return { snapshot, profile, hasClinicalData: !!checkins, hasIntake: !!checkins, isAuthenticated, pause };
    }

    const parts: Array<ClinicalSnapshot | null> = [];
    const local = loadLocalResult();
    if (local?.result) parts.push(snapshotFromIntake(local.result, deriveRiskFeatures(local.answers ?? {})));
    if (isAuthenticated && serverEvidence?.snapshot) parts.push(serverEvidence.snapshot);
    const snapshot = mergeParts(parts);
    const profile = applyPause(assessFinancialReadiness(snapshot, ctx), pause);
    return {
      snapshot,
      profile,
      hasClinicalData: parts.filter(Boolean).length > 0,
      hasIntake: !!local?.result,
      isAuthenticated,
      pause,
    };
  }, [isAuthenticated, serverEvidence, contextKey, pauseOverride]);
}
