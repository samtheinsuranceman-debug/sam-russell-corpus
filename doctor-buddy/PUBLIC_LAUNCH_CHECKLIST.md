# Doctor Buddy — Minimum Public Paid Launch Checklist

Updated: 2026-09-14

Doctor Buddy's recommended public release is a **direct-to-consumer, adults-only wellness / reflection / education / organization product**, not a medical practice, psychotherapy service, psychiatry service, diagnostic system, prescribing service, or emergency-monitoring service. The repository contains technical guardrails, but no code or disclaimer can itself certify legal compliance.

## 1. Lock the public release mode

```env
PUBLIC_WELLNESS_MODE=true
VITE_PUBLIC_WELLNESS_MODE=true
ENABLE_CLINICAL_TOOLS=false
VITE_ENABLE_CLINICAL_TOOLS=false
HIPAA_DEPLOYMENT_MODE=consumer
```

The public server blocks diagnostic assessment/report generation, psychiatric risk scoring, clinical Digital Twin functions, clinician whisperers, medication-interaction analysis, clinician treatment planning, raw saved Doctor Buddy clinical sessions, and other clinical namespaces. Do not weaken the server gate merely because a page is hidden in the UI.

## 2. Supply truthful operator disclosures

Set the same real values on server and browser:

- `PRIVACY_CONTACT_EMAIL` / `VITE_PRIVACY_CONTACT_EMAIL`
- `SECURITY_CONTACT_EMAIL` — monitored address published through `/.well-known/security.txt`.
- `LEGAL_BUSINESS_NAME` / `VITE_LEGAL_BUSINESS_NAME`
- `LEGAL_BUSINESS_ADDRESS` / `VITE_LEGAL_BUSINESS_ADDRESS`
- `HEALTH_DATA_PROCESSORS` / `VITE_HEALTH_DATA_PROCESSORS`
- `AI_PROCESSOR_NAME` — legal name of the processor receiving public AI prompts.
- `AUTH_PROCESSOR_NAME` — legal name of the authentication provider.
- `BUILT_IN_FORGE_API_URL` — explicit HTTPS production AI endpoint; there is no silent production fallback.

Production refuses placeholder/example values or mismatched disclosures. The disclosed processor list must include the configured AI/auth provider names and Stripe when paid subscriptions are enabled.

## 3. Complete the minimum operational controls

Set these to `true` **only after the described work is real and tested**:

- `PRIVACY_SECURITY_REVIEW_CONFIRMED` — production auth, access controls, secrets, database permissions, logging, hosting, dependency/vulnerability posture, and abuse controls reviewed.
- `CONSUMER_DATA_ENCRYPTION_CONFIRMED` — TLS in transit and encryption at rest verified for every sensitive datastore/backup.
- `AI_PROCESSOR_PRIVACY_REVIEW_CONFIRMED` — AI/data processors reviewed for health-data use, retention, training, deletion, subprocessors, and security.
- `PROCESSOR_CONTRACTS_CONFIRMED` — required processor/service-provider privacy and data-processing terms/contracts are actually in place.
- `EXTERNAL_RESEARCH_QUERY_REVIEW_CONFIRMED` — the NCBI/PubMed research-query flow and disclosure were reviewed; the UI warns users not to put identifiers into research searches.
- `INCIDENT_RESPONSE_PLAN_CONFIRMED` — written security/privacy incident workflow exists, including analysis of FTC Health Breach Notification Rule and applicable state notification duties. The incident tracker records affected-resident counts by jurisdiction because the FTC media threshold is not determined by total affected users alone.
- `DATA_RETENTION_POLICY_CONFIRMED` — active data, logs, exports, backups, billing records, deletion receipts, and retention periods are documented and followed.
- `CONSUMER_HEALTH_DATA_DELETION_WORKFLOW_CONFIRMED` — deletion has been tested through active stores and the documented backup/processor lifecycle.

## 4. Authentication/security

- Use a strong random `JWT_SECRET` of at least 32 characters.
- Use only an HTTPS `PUBLIC_BASE_URL` in production.
- Keep the server-owned OAuth state/nonce flow.
- Put an appropriate managed WAF/rate-limit layer in front of the app for production traffic.
- Run dependency vulnerability scanning and patch material findings before release.
- Do not log raw journal/support/crisis content to ordinary telemetry.

## 5. Consumer-health consent and rights

The product collects affirmative consumer-health-data consent separately from payment consent. Account & Privacy remains reachable after consent withdrawal so the consumer can export or delete data without being forced to re-consent.

Do not sell consumer health data or use health-related activity for targeted advertising under the current public policy. Do not add Meta Pixel, Snap Pixel, ad retargeting, session replay, or similar tracking to journal, medication, check-in, support, crisis, account, or health-data surfaces without new legal/privacy review.

Consent records must snapshot the accepted Terms, Privacy Policy, Consumer Health Data Policy, Medical Disclaimer, adult status, and exact processor disclosure. A material processor-list change must force fresh consent for sensitive processing. Test correction, access/export, deletion, withdrawal, complaint, and appeal requests end to end and assign an internal owner for those requests.

Keep the currently published public-retention values synchronized with actual operations:

```env
PUBLIC_USAGE_LOG_RETENTION_DAYS=90
PUBLIC_SAFETY_EVENT_RETENTION_DAYS=90
PUBLIC_BACKUP_MAX_RETENTION_DAYS=35
PUBLIC_PRIVACY_REQUEST_DETAIL_RETENTION_DAYS=90
```

Application cleanup handles public telemetry/safety metadata and resolved privacy-request free text; the database/hosting provider must separately enforce backup expiration. Verify sensitive routes use no-store/no-index/no-archive behavior and remain excluded from `robots.txt`. Keep marketing analytics disabled for this minimum-risk release.

## 6. Charging money

Apply `drizzle/0010_public_subscription_controls.sql`, `drizzle/0011_breach_jurisdiction_context.sql`, and `drizzle/0012_privacy_rights_and_consent_evidence.sql`, configure Stripe Checkout/webhooks/Customer Portal, and test the complete entitlement lifecycle. Then—and only then—enable:

```env
ENABLE_PAID_SUBSCRIPTIONS=true
VITE_ENABLE_PAID_SUBSCRIPTIONS=true
SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED=true
SALES_TAX_REVIEW_CONFIRMED=true
```

Before enabling paid production, review the sales-tax treatment of the software subscription in the jurisdictions where it will be sold and configure the payment/tax workflow as required. The server verifies that the configured Stripe Price is active, USD, monthly, and matches the displayed membership amount. The purchase flow records affirmative 18+ and recurring-billing authorization. Paid feature APIs enforce subscription status server-side. Privacy/export/deletion/billing-management surfaces remain available without an active entitlement.

## 7. Public claims

Do not market the public edition as diagnosing, treating, curing, mitigating, preventing disease, prescribing, providing psychotherapy/psychiatry, replacing a clinician, being “clinical-grade,” being “FDA approved/cleared” unless actually authorized, guaranteeing crisis detection, producing validated medical/psychiatric risk scores, or being “HIPAA compliant.”

“Friend Zone,” “Therapist Zone,” and “Psychiatrist Zone” must always be presented as user-selected **communication styles only**.

## 7a. Financial education claims

The Finance section is education, not individualized tax, legal, investment, insurance or medical advice. Do not market it as advice, as a suitability determination, or as guaranteeing any return, income or protection. The readiness panel in the public edition reads only the person's own check-ins and a pause they chose; do not describe it as detecting a crisis, measuring capacity to decide, or protecting anyone from loss. Keep `/financial-disclaimer` linked from the hub, the panel and the footer. The public release audit fails on guaranteed-return and individualized-advice wording.

## 8. Adults/crisis

Public use is 18+. Doctor Buddy is not continuously monitored and cannot guarantee detection of a crisis. U.S. users are directed to 988/911 when appropriate; people elsewhere are directed to local crisis/emergency services.

## 9. HIPAA/clinical deployments

A standalone consumer app is not automatically governed by HIPAA merely because users enter health information. If Doctor Buddy is later operated on behalf of a covered entity/business associate and handles PHI in that role, treat that as a **separate clinical deployment** with the required agreements, safeguards, operations, validation, and legal review. The public edition should not be advertised as HIPAA compliant.

## 10. Final release commands

```bash
npm ci
npm run audit:release
npm run check
npm test
npm run build
npm audit --omit=dev
```

Do not release if any check fails without investigation.

## Official references used for this hardening pass

- FDA — *General Wellness: Policy for Low Risk Devices* (January 2026)
- HHS — Health-app / business-associate guidance and HIPAA business-associate resources
- FTC — Health Breach Notification Rule
- FTC — recurring subscription / negative-option enforcement materials
- Washington Attorney General — My Health My Data resources

Have qualified counsel review the final deployed product, actual data flows/processors, exact business entity and target jurisdictions before relying on the product for legal compliance conclusions.
