/**
 * Derive patent-04 risk features from a completed DSM-5 intake.
 *
 * The risk engine consumes behavioural and clinical signals the intake does not
 * all collect — days since last contact, medication adherence, sleep deviation
 * against a personal baseline. Those come from longitudinal data a signed-in
 * patient accumulates, not from a one-off questionnaire.
 *
 * So this maps what the intake genuinely establishes and reports the rest as
 * absent, rather than inventing values. A feature we cannot observe is set to
 * its population-typical value AND named in `unobserved`, so the UI can say which
 * parts of the score rest on assumption. Quietly defaulting them would produce a
 * confident-looking number built on data that was never collected.
 */

import { scoreIntake, type IntakeResult } from "./scoring";
import type { RiskFeatures } from "../engines/riskScoring";

/** Population-typical values, used only where the intake observes nothing. */
export const NEUTRAL_FEATURES: RiskFeatures = {
  daysSinceContact: 14,
  sleepDelta: 0,
  socialRatio: 1,
  adherence: 0.9,
  priorHospitalizations: 0,
  cssrsLevel: 0,
  substanceUseDays: 0,
  symptomSeverity: 30,
};

export interface DerivedRiskFeatures {
  features: RiskFeatures;
  /** Feature keys the intake could not observe, left at population defaults. */
  unobserved: Array<keyof RiskFeatures>;
  /** Feature keys genuinely derived from the answers. */
  observed: Array<keyof RiskFeatures>;
  /** The intake result the features were derived from. */
  intake: IntakeResult;
}

function domainSeverity(result: IntakeResult, domain: string): number | null {
  const d = result.domains.find(x => x.domain === domain);
  if (!d || d.scored === 0) return null;
  return d.severity;
}

/**
 * Map the intake's safety endorsement onto the C-SSRS scale.
 *
 * The intake asks two safety items, not the full C-SSRS, so this is a floor
 * rather than a precise level: passive ideation maps to 1, recurrent behaviour
 * or daily ideation to 4. It never claims a level the items cannot establish
 * (a stated plan is level 5 and the intake does not ask about plans).
 */
export function cssrsFloorFromIntake(result: IntakeResult): number {
  if (!result.safety.flagged) return 0;
  return result.safety.urgency === "immediate" ? 4 : 1;
}

export function deriveRiskFeatures(answers: Record<string, string>): DerivedRiskFeatures {
  const intake = scoreIntake(answers);

  const features: RiskFeatures = { ...NEUTRAL_FEATURES };
  const observed: Array<keyof RiskFeatures> = [];
  const unobserved: Array<keyof RiskFeatures> = [];

  // Symptom severity: the intake's strongest signal. Use the highest scored
  // domain, since overall mean would dilute a single severe presentation.
  const peak = intake.candidates.length > 0 ? intake.candidates[0].severity : null;
  if (peak !== null) {
    features.symptomSeverity = peak;
    observed.push("symptomSeverity");
  } else {
    unobserved.push("symptomSeverity");
  }

  // C-SSRS floor from the two safety items.
  if (intake.safety.flagged) {
    features.cssrsLevel = cssrsFloorFromIntake(intake);
    observed.push("cssrsLevel");
  } else if (intake.completeness > 0) {
    // A completed intake with no endorsement is genuine evidence of level 0.
    features.cssrsLevel = 0;
    observed.push("cssrsLevel");
  } else {
    unobserved.push("cssrsLevel");
  }

  // Substance use: the domain score scaled onto days-in-30. The intake asks
  // about pattern, not day counts, so this is an estimate and flagged as such
  // by being derived rather than measured.
  const substance = domainSeverity(intake, "Substance Use");
  if (substance !== null) {
    features.substanceUseDays = Math.round((substance / 100) * 30);
    observed.push("substanceUseDays");
  } else {
    unobserved.push("substanceUseDays");
  }

  // Sleep: the intake's sleep items are frequency-of-disturbance, not hours.
  // Map severity onto a negative deviation, capped at -3h.
  const sleep = domainSeverity(intake, "Sleep");
  if (sleep !== null) {
    features.sleepDelta = -Math.round((sleep / 100) * 3 * 10) / 10;
    observed.push("sleepDelta");
  } else {
    unobserved.push("sleepDelta");
  }

  // Everything below needs longitudinal or historical data the intake never
  // collects. Left at population defaults and named, never silently assumed.
  for (const key of ["daysSinceContact", "socialRatio", "adherence", "priorHospitalizations"] as const) {
    unobserved.push(key);
  }

  return { features, observed, unobserved, intake };
}
