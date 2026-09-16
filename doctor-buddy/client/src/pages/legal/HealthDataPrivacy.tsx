import LegalShell from "./LegalShell";
import { HEALTH_DATA_PROCESSORS, LEGAL_BUSINESS_ADDRESS, LEGAL_BUSINESS_NAME, PRIVACY_CONTACT_EMAIL } from "@/lib/releasePolicy";
export default function HealthDataPrivacy() {
  return <LegalShell title="Consumer Health Data Privacy Policy">
    <p>This separate policy covers consumer health data and health-related information you choose to provide to the public Doctor Buddy service operated by {LEGAL_BUSINESS_NAME}.</p>
    <h2>Categories we may collect</h2>
    <ul><li>Self-described mood, stress, sleep, goals, habits, experiences, and wellness reflections.</li><li>Journal and check-in content you choose to save.</li><li>Medication names or schedules you choose to organize; the public edition does not prescribe or change them.</li><li>Support prompts, conversations, and saved takeaways when you choose persistence instead of ephemeral use.</li><li>Account and subscription information needed to provide paid access.</li></ul>
    <h2>Sources</h2>
    <p>Consumer health data comes directly from you and from product interactions you intentionally save. The public edition does not silently import medical records, wearable data, precise location, or third-party health records.</p>
    <h2>Purposes</h2>
    <p>We use consumer health data only to provide the feature you requested, personalize that feature according to your choices, maintain saved history when enabled, protect the service, satisfy your privacy requests, and meet legal obligations. We do not use consumer health data for targeted advertising.</p>
    <h2>Processors and disclosures</h2>
    <p>We do not sell consumer health data. We disclose only the information reasonably necessary to service providers that host, secure, bill for, authenticate, or provide an AI feature you choose to use, under the production contracts and settings adopted by the operator. The app records the processor disclosure in effect when you give health-data consent so later changes do not silently rewrite the historical consent record.</p>
    <p>If you use the Research Library, the research terms you submit are sent by our server to the U.S. National Library of Medicine's NCBI/PubMed service to retrieve literature results. Research searches should not contain names or other identifying details.</p>
    {HEALTH_DATA_PROCESSORS.length ? <><p>The production operator identifies the following service providers as capable of processing consumer health data for requested product functions:</p><ul>{HEALTH_DATA_PROCESSORS.map((name: string) => <li key={name}>{name}</li>)}</ul></> : <p>No production processor disclosure has been configured. Production startup is designed to fail until the operator supplies the real processor list.</p>}
    <h2>Your consent</h2>
    <p>Sensitive product features require affirmative consumer-health-data consent before collection. Subscription purchase consent is separate from health-data consent. You may withdraw health-data consent in Settings; future sensitive features then require fresh affirmative consent. If the policy or processor disclosure materially changes, the consent version must be updated and fresh consent is required before sensitive processing resumes.</p>
    <h2>Your rights</h2>
    <p>You may request access, correction, export, deletion, or withdrawal of consent. Where applicable law grants additional consumer health data rights, including an appeal or authorized-agent process, those rights also apply. Authenticated users can submit correction requests, complaints, and appeals in Account &amp; Privacy; authorized agents or users who cannot access an account may contact {PRIVACY_CONTACT_EMAIL}. We may verify a request as reasonably necessary and will not discriminate against you for exercising applicable privacy rights.</p>
    <h2>Deletion and retention</h2>
    <p>Authenticated users can delete consumer health data from active product systems. Privacy-request free text is redacted while a minimal request/status receipt may remain. Production launch is blocked until the operator has verified the processor and backup deletion workflow. Public telemetry and minimal safety-event metadata are limited to 90 days, and production backups must cycle within a maximum of 35 days; a valid deletion request must not be defeated by later restoring an old backup into ordinary active use.</p>
    <h2>No geofencing of healthcare</h2>
    <p>Doctor Buddy does not use geofencing around healthcare facilities to identify, track, infer, or target people based on seeking healthcare services.</p>
    <h2>Contact</h2><p>{PRIVACY_CONTACT_EMAIL}<br/>{LEGAL_BUSINESS_ADDRESS}</p>
  </LegalShell>;
}
