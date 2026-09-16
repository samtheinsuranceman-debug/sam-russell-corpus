import LegalShell from "./LegalShell";
import { LEGAL_BUSINESS_ADDRESS, LEGAL_BUSINESS_NAME, PRIVACY_CONTACT_EMAIL } from "@/lib/releasePolicy";
export default function Privacy() {
  return <LegalShell title="Privacy Policy">
    <h2>Who operates Doctor Buddy</h2>
    <p>{LEGAL_BUSINESS_NAME} operates the public Doctor Buddy service. Privacy requests may be sent to {PRIVACY_CONTACT_EMAIL} or mailed to {LEGAL_BUSINESS_ADDRESS}.</p>
    <h2>Data minimization</h2>
    <p>We collect only information needed to provide the feature you request, secure the service, manage your account, process billing, respond to privacy requests, or comply with law. We intentionally do not require a legal name or email merely to record the consumer-health-data acknowledgement.</p>
    <h2>Account and security information</h2>
    <p>We may process account identifiers, email supplied through the authentication provider, subscription status, billing-consent records, timestamps, browser/user-agent information, and limited security/audit records needed to authenticate users, prevent abuse, document consent, and operate the service.</p>
    <h2>Cookies and local storage</h2>
    <p>Doctor Buddy uses essential session/OAuth cookies and limited local browser storage to keep you signed in, maintain security state, remember consent state, and preserve user-selected settings. The minimum-risk public edition does not use advertising cookies or health-data retargeting pixels.</p>
    <h2>Health-related information</h2>
    <p>Health-related reflections, journals, medication lists, check-ins, and support prompts are treated as sensitive. Their collection, use, service-provider processing, and rights are described separately in the Consumer Health Data Privacy Policy.</p>
    <h2>Advertising and analytics</h2>
    <p>Doctor Buddy does not sell consumer health data and does not use health-related activity, prompts, journal content, medication data, or support content for targeted advertising. The minimum-risk public release keeps optional marketing analytics disabled.</p>
    <h2>Security</h2>
    <p>Production deployment is designed to require encrypted transport, encrypted storage, access controls, least privilege, rate limits, security headers, authenticated ownership checks, no-store API responses, reviewed processors, and a monitored security-reporting contact. No internet service can promise perfect security.</p>
    <h2>Retention</h2>
    <p>User-saved journals, medication lists, and wellness content remain available until you delete them or the account/service no longer needs them. Public-edition product/security telemetry is automatically limited to 90 days, minimal crisis/safety event metadata is limited to 90 days, and production backups must expire or be cycled within a maximum of 35 days. Billing, consent, deletion, dispute, tax, or legal records may be retained longer where reasonably necessary or required by law.</p>
    <h2>Your choices</h2>
    <p>You may withdraw consumer-health-data consent, export account data, delete consumer health data, request correction, submit a privacy complaint, and appeal a privacy decision from Account &amp; Privacy. Withdrawal stops future sensitive processing until you consent again; it does not erase prior data by itself. Deletion is a separate control.</p>
    <h2>HIPAA</h2>
    <p>HIPAA does not automatically apply to every consumer health app. If Doctor Buddy is separately deployed by or for a HIPAA covered entity or business associate and handles PHI on its behalf, that clinician deployment must use the required agreements and safeguards. The direct-to-consumer public edition does not represent that HIPAA applies merely because health information is involved.</p>
    <h2>Contact</h2><p>{PRIVACY_CONTACT_EMAIL}<br/>{LEGAL_BUSINESS_ADDRESS}</p>
  </LegalShell>;
}
