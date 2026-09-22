# Doctor Buddy — Public Paid Release Candidate Hardening Report

Date: 2026-09-14

## Release posture

The default internet-facing edition is an adults-only, direct-to-consumer wellness / reflection / education / organization / care-preparation product. It is not presented as a medical practice, psychotherapy or psychiatry service, diagnostic system, prescribing service, emergency-monitoring service, FDA-cleared device, or universally HIPAA-covered product.

“Friend Zone,” “Therapist Zone,” and “Psychiatrist Zone” remain selectable **communication styles**. Server-owned prompts and user-facing disclosures state that the names do not create licensed professional services or a professional-patient relationship.

This report does not certify legal compliance, regulator approval, FDA clearance, clinical validation, patentability, or HIPAA compliance. The code is intentionally fail-closed around the main release boundaries; real operator identity, contracts, hosting controls, processor terms, tax treatment, jurisdictional obligations, and the final dependency-aware build must still be truthful and complete in the deployed environment.

## Controls completed

### Product / medical boundary

- Public and clinical editions are mutually exclusive in production.
- Public server enforcement blocks diagnostic reports, psychiatric risk scoring, clinical Digital Twin outputs, clinician whisperers, medication-interaction analysis, clinician treatment-planning functions, clinical report sharing, and other clinical-only namespaces.
- Public check-ins/journaling are self-reflection and self-tracking rather than diagnosis or psychiatric risk scoring.
- Public medication tools are organizational/educational only; ownership checks are server-side and interaction analysis remains clinical-only.
- Public AI cannot accept a browser-supplied system prompt and is instructed not to diagnose, prescribe, select medication, recommend individualized dose/taper/start/stop changes, or claim professional credentials.
- Crisis resources do not claim continuous monitoring or guaranteed detection.

### Consumer-health privacy and consent evidence

- Current consumer-health-data consent is version **4.0** and is separate from recurring-payment consent and optional telemetry consent.
- Consent evidence snapshots adult status, Terms version, Privacy Policy version, Consumer Health Data Policy version, Medical Disclaimer version, and the exact processor disclosure accepted at the time.
- A withdrawn, outdated, or processor-mismatched consent does not unlock sensitive server processing; material processor-list changes require fresh consent.
- Access/export, correction, deletion, consent withdrawal, complaint, and appeal requests are available through Account & Privacy. Administrative status/resolution support exists for privacy requests.
- Raw public Doctor Buddy AI sessions are not persisted by default; optional activity logging stores sparse event metadata rather than raw support/journal content.
- Public activity/telemetry metadata and minimal safety-event metadata are automatically cleaned after 90 days; resolved privacy-request free text is redacted after 90 days.
- Published production backup retention is capped at 35 days. Application code cannot purge provider-managed backups, so production startup requires the real backup/processor retention-deletion workflow to be confirmed separately.
- Marketing analytics are forced off for the minimum-risk production release; the policies prohibit health-data targeted advertising under the current release posture.

### Processor / data-flow controls

- Production AI has no silent endpoint fallback. It requires an explicit HTTPS endpoint, credential, legal AI-processor identity, processor disclosure, privacy review, and required processor/service-provider terms.
- The configured AI processor and authentication provider must appear in the public processor disclosure; Stripe must appear when paid subscriptions are enabled.
- Public Research is authenticated, consent-gated, entitlement-gated, and discloses that research queries are sent to NCBI/PubMed; the UI warns against placing identifiers in searches.
- Diagnosis-derived research logic is clinical-only in the public edition.

### Paid membership / consumer protection

- Public checkout is one clearly described recurring monthly membership rather than unenforced feature tiers.
- Checkout is server-created and verifies the configured Stripe Price is active, USD, monthly, and equal to the price displayed by Doctor Buddy.
- Separate affirmative 18+ and recurring-billing authorization is stored with the current subscription-terms version.
- Signed Stripe webhooks, event deduplication, stored subscription status, duplicate-subscription prevention, and server-side entitlement checks are implemented.
- Hosted Stripe Customer Portal access provides an online cancellation path; privacy/legal/billing-management surfaces remain available when a paid entitlement is inactive.
- Paid production refuses startup until the subscription lifecycle and sales-tax treatment have been reviewed and explicitly attested.

### Authentication / internet security baseline

- Production cookies are Secure/HttpOnly/SameSite.
- OAuth state is generated and HMAC-signed by the server, tied to a short-lived nonce cookie, expiry-checked, and return paths are constrained.
- Production requires HTTPS and sets HSTS, CSP, frame denial, MIME sniffing protection, restrictive referrer/permissions policy, COOP/CORP, cross-origin mutation checks, body-size limits, basic API abuse limiting, no-store API/sensitive-page handling, and record-ownership checks.
- Sensitive application routes receive no-index/no-follow/no-archive directives and are excluded from generated `robots.txt`.
- `/.well-known/security.txt` publishes the configured monitored security contact.
- The generic storage proxy is disabled in public wellness mode.
- Production rejects placeholder disclosures, weak secrets, ambiguous edition flags, undeclared AI routing, missing processor review/contracts, missing security/encryption/incident/retention/deletion attestations, unreviewed marketing analytics, or incomplete paid configuration.

### Incident response

- Incident records use a conservative 60-day outer notification date while warning that applicable law may require action sooner.
- Affected-resident counts are tracked by jurisdiction rather than assuming a total-user count alone determines a media-notice duty.
- Public incidents are routed for FTC Health Breach Notification Rule / applicable state consumer-health analysis rather than automatically being labeled HIPAA breaches.

## Database migrations required

Apply in order before production:

1. `drizzle/0010_public_subscription_controls.sql`
2. `drizzle/0011_breach_jurisdiction_context.sql`
3. `drizzle/0012_privacy_rights_and_consent_evidence.sql`

## Verification completed in this workspace

- `npm run audit:release`: **PASS**.
- `git diff --check`: **PASS** at the final source-audit stage.
- TypeScript/TSX parser validation: **179 files, 0 syntax diagnostics**.
- Local/alias TypeScript import resolution: **602 imports checked, 0 unresolved local targets**.
- Navigation integrity: **33 registered routes, 59 literal internal links, 0 unresolved**.
- Release audit verifies required legal/privacy/billing files, consent versioning, retention/security controls, no-index/robots handling, billing safeguards, and forbidden positive medical/regulatory claims.

## Dependency-aware gate still required in the deployment environment

The workspace dependency directory is incomplete. `npm run check` reaches TypeScript but cannot begin normal project typechecking because `@types/node` and `vite/client` are absent from the installed dependency tree. A fresh dependency restore could not be completed in this runtime. Therefore **do not publicly launch** until a normal networked build environment successfully runs:

```bash
npm ci
npm run audit:release
npm run check
npm test
npm run build
npm audit --omit=dev
```

A failure in any of those commands is a release blocker until investigated.

## Real-world values and operations code cannot invent

Before production startup, supply the real legal operator name/address, monitored privacy and security contacts, exact processors, HTTPS domain, database/OAuth/AI/Stripe credentials, processor contracts/terms, encryption-at-rest verification, provider backup lifecycle, processor deletion workflow, incident-response procedure, managed edge/WAF controls, tax treatment, and final dependency/security results. The production server is designed to refuse startup when the required release-mode configuration and attestations are absent.
