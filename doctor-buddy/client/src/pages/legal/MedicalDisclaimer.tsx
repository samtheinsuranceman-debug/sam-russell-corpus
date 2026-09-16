import LegalShell from "./LegalShell";
export default function MedicalDisclaimer() {
  return <LegalShell title="Wellness & Medical Disclaimer">
    <h2>General wellness only</h2>
    <p>The public edition is designed to support healthy routines, reflection, communication preparation, organization, and general education. It is not intended to diagnose, cure, mitigate, prevent, or treat a disease or condition.</p>
    <h2>Not professional care</h2>
    <p>No AI response is a medical diagnosis, psychotherapy session, psychiatric evaluation, medical order, or prescription. “Therapist Zone” and “Psychiatrist Zone” are communication styles only.</p>
    <h2>Medication</h2>
    <p>Medication features are organizational and educational. Do not start, stop, change, split, combine, taper, or alter medication because of Doctor Buddy. Discuss individualized medication questions with the licensed prescriber responsible for your care.</p>
    <h2>Crisis limitations</h2>
    <p>Automated safety language detection can miss important situations or flag harmless ones. Doctor Buddy is not continuously monitored. If you may act on thoughts of self-harm, harming someone else, or face immediate danger, use emergency or crisis services now rather than waiting for an app response.</p>
  </LegalShell>;
}
