# Doctor Buddy — Health Data / HIPAA Safeguards

Updated: 2026-09-14

## Correct posture

Doctor Buddy now has two deliberately different release modes.

**Public consumer wellness edition (recommended public launch):** adults-only wellness, reflection, education, organization, and care preparation. HIPAA is not represented as automatically governing the product. Consumer-health privacy rules, FTC requirements, breach duties, recurring-billing rules, and applicable state laws can still apply.

**Covered-entity / business-associate clinician edition:** enable only when the real deployment relationship requires it and the appropriate BAAs/vendor terms, PHI safeguards, access/audit controls, risk analysis, incident response, retention policies, and other applicable controls actually exist.

## Public-edition safeguards in code

- Clinical namespaces/procedures are server-blocked unless the separately configured clinical edition is enabled.
- The browser cannot provide its own AI system prompt.
- Friend/Therapist/Psychiatrist Zones are style controls only; public AI cannot diagnose, prescribe, dose, taper, choose medications, or represent itself as a licensed professional.
- Raw public Doctor Buddy session persistence is disabled and stored health history is not silently forwarded into public AI prompts.
- Public AI requires an explicit production HTTPS processor endpoint and processor identity; required processor review/contracts are production gates.
- Research searches require authentication, current health-data consent, and paid entitlement; users are told that search terms go to NCBI/PubMed and not to include identifiers.
- Product telemetry is opt-in and excludes raw health-reflection/support payloads from ordinary activity logs.
- Medication mutations verify record ownership; public medication interaction analysis is blocked.
- Public journal/check-in behavior is self-tracking rather than automatic psychiatric risk scoring.
- Central middleware rejects sensitive authenticated processing after consumer-health-data consent is withdrawn.
- Consumer export, withdrawal, and active-store deletion controls remain accessible even without an active subscription.
- Marketing analytics are off by default and third-party health-data advertising/retargeting is not part of the approved public posture.
- Production uses secure cookies, server-signed OAuth state/nonce, HTTPS/HSTS expectations, CSP and related response headers, origin/Sec-Fetch checks, request limits, basic abuse limiting, no-store API responses, and public storage-proxy disablement.
- Production fails closed on placeholder disclosures, weak secrets, undeclared AI routing, unreviewed/uncontracted processors, incomplete encryption/security/incident/retention/deletion operations, or incomplete billing configuration.
- Public consent evidence snapshots the accepted legal-policy versions and processor disclosure; material processor changes invalidate prior sensitive-data consent.
- Public users can submit correction, access/export, deletion, withdrawal, complaint, and appeal requests; resolved request free text is automatically redacted after the published retention period.
- Sensitive routes are no-store/no-index and excluded from `robots.txt`; `/.well-known/security.txt` publishes the configured security contact.
- Application cleanup covers public telemetry/safety metadata; provider-managed backup retention and deletion must still be configured and verified outside the app.
- Incident tracking distinguishes consumer FTC/state analysis from HIPAA analysis and uses jurisdiction-aware media-threshold review rather than treating 500 total users as an automatic media-notice conclusion.

## Clinical/HIPAA deployment gate

The Emergent Edition adds several code-level clinical safeguards on top of the original clinical build: persistent assessments require authentication, assessment/report records are ownership-checked, diagnosis-linked research/life-map/life-event endpoints require authentication, share links are generated only on demand and can be revoked, report access/share/review actions are written to the dedicated clinical audit trail, and the consumer consent modal is not reused as a substitute for a covered entity's clinical privacy notice.

```env
PUBLIC_WELLNESS_MODE=false
VITE_PUBLIC_WELLNESS_MODE=false
ENABLE_CLINICAL_TOOLS=true
VITE_ENABLE_CLINICAL_TOOLS=true
HIPAA_DEPLOYMENT_MODE=baa
HIPAA_BAA_CONFIRMED=true
PHI_STORAGE_ENCRYPTION_CONFIRMED=true
CLINICAL_COVERED_ENTITY_NAME="Real covered entity / clinical operator"
VITE_CLINICAL_COVERED_ENTITY_NAME="Real covered entity / clinical operator"
CLINICAL_NPP_URL="https://real-domain.example/privacy-notice"
VITE_CLINICAL_NPP_URL="https://real-domain.example/privacy-notice"
HIPAA_SECURITY_RISK_ANALYSIS_CONFIRMED=true
HIPAA_ACCESS_CONTROL_REVIEW_CONFIRMED=true
HIPAA_AUDIT_CONTROLS_CONFIRMED=true
HIPAA_WORKFORCE_TRAINING_CONFIRMED=true
HIPAA_MINIMUM_NECESSARY_REVIEW_CONFIRMED=true
CLINICAL_HUMAN_REVIEW_REQUIRED=true
```

These are operator attestations, not certifications. Do not set them merely to unlock features.

## Important limitation

No codebase, toggle, or disclaimer can guarantee “HIPAA compliance,” FDA status, or regulator approval. Actual legal posture depends on the deployed environment, relationship between parties, contracts, data flows, processors/subprocessors, security and workforce practices, marketing claims, target jurisdictions, and law at the time of operation.
