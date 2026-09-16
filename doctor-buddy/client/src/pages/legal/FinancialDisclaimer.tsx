import LegalShell from "./LegalShell";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";

export default function FinancialDisclaimer() {
  return <LegalShell title="Financial Education Disclaimer">
    <h2>Education, not advice</h2>
    <p>The Finance section contains educational calculators, strategy explainers and a readiness panel. Every figure is an illustration under stated assumptions that you can change. Nothing in it is individualized tax, legal, investment, insurance, or medical advice, an offer or recommendation of any product or security, or a determination that anything is suitable for you. Results are not guaranteed and past index or market history does not predict future results.</p>
    <h2>The readiness panel</h2>
    <p>{CLINICAL_TOOLS_ENABLED
      ? "In the clinical edition the readiness panel reads clinical information you or your care team have recorded and turns it into a set of constraints — cooling-off periods, a cash cushion, a borrowing limit — for a licensed advisor and your treating clinician to review together. It is not a suitability determination and it does not decide anything on its own."
      : "In the public wellness edition the readiness panel reads only the 1-5 wellness check-ins you save in this browser and any pause you set for yourself. It does not use a clinical instrument, does not produce a medical or psychiatric score, does not infer that you are in crisis or unable to decide, and does not send those ratings anywhere. The guardrails it shows are educational suggestions that only ever get more cautious as your ratings get lower; the pause is yours to set and yours to lift."}</p>
    <h2>Before you act</h2>
    <p>Talk with a licensed financial, tax, legal or insurance professional about your own situation before acting on anything you learn here. Insurance products, policy loans, real-estate leverage, practice transactions and tax elections have costs and risks that a general calculator cannot see. If a decision cannot be undone, take the cooling-off period the panel suggests, and take a longer one if you are not sure.</p>
    <h2>Your data</h2>
    <p>The financial fact finder and the readiness panel store what you enter in this browser only, and you can export or clear it from the fact finder at any time. Doctor Buddy does not sell this information or use it for advertising.</p>
    <h2>Safety</h2>
    <p>If you are thinking about harming yourself or someone else, money can wait. In the United States call or text 988, or call 911 for immediate danger. Elsewhere use local emergency services.</p>
  </LegalShell>;
}
