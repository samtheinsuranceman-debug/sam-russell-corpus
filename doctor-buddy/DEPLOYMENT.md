# Doctor Buddy Deployment

## Recommended paid public edition

Use the consumer-wellness edition for an ordinary public internet launch. Start from `.env.example` and keep the clinical edition off.

```env
NODE_ENV=production
PUBLIC_WELLNESS_MODE=true
VITE_PUBLIC_WELLNESS_MODE=true
ENABLE_CLINICAL_TOOLS=false
VITE_ENABLE_CLINICAL_TOOLS=false
HIPAA_DEPLOYMENT_MODE=consumer
```

Production startup is fail-closed. You must provide the real HTTPS site URL, monitored privacy **and security** contacts, legal operator name and mailing address, disclosed health-data processors, database, strong JWT secret, explicit AI/auth processor identities and endpoint, and the operational confirmations in `PUBLIC_LAUNCH_CHECKLIST.md`. Server and browser copies of public disclosures must match exactly.

## Authentication

Configure the external OAuth service and portal:

```env
OAUTH_SERVER_URL=...
OAUTH_PORTAL_URL=...
VITE_OAUTH_PORTAL_URL=...
VITE_APP_ID=...
```

Authentication starts at `/api/oauth/start`; the server creates and signs OAuth state and ties it to a short-lived HttpOnly nonce cookie. Do not replace this with browser-generated OAuth state.

## Email-link sign-in (no OAuth portal)

Where no OAuth portal is available, set `EMAIL_AUTH_ENABLED=true`, `RESEND_API_KEY`, `MAIL_FROM` (a verified sender), `OWNER_EMAIL` (that address signs in as admin), a non-empty `VITE_APP_ID`, and build with `VITE_EMAIL_AUTH=true`. People request a link at `/login`; it is HMAC-signed, single-use, expires in fifteen minutes, is rate-limited five per address per fifteen minutes, and only redirects to a path on this site. No password exists anywhere. Name the mail provider in `AUTH_PROCESSOR_NAME` and `HEALTH_DATA_PROCESSORS`.

## Database migrations at deploy

`node dist/migrate.js` applies `drizzle/*.sql` in order, once each, recording name and checksum in `__doctor_buddy_migrations`, and creates the database named in `DATABASE_URL` if it does not exist. Set it as the Railway pre-deploy command so a schema mismatch fails the deploy instead of booting a broken revision.

## AI and external research processors

The public AI route has no silent production fallback. Configure the exact HTTPS model gateway and identify the legal processor name:

```env
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=...
BUILT_IN_FORGE_MODEL=gpt-4o-mini   # any chat model at that endpoint; vision-capable models also power the companion's camera reads
AI_PROCESSOR_NAME=...
AUTH_PROCESSOR_NAME=...
```

`AI_PROCESSOR_NAME` and `AUTH_PROCESSOR_NAME` must appear in the disclosed `HEALTH_DATA_PROCESSORS` list. If paid subscriptions are enabled, that list must also include Stripe. Set `AI_PROCESSOR_PRIVACY_REVIEW_CONFIRMED`, `PROCESSOR_CONTRACTS_CONFIRMED`, and `EXTERNAL_RESEARCH_QUERY_REVIEW_CONFIRMED` only after the real data flows/terms/contracts have been reviewed. The Research Library sends search terms to NCBI/PubMed; users are warned not to include identifiers.

## Paid membership

Billing is server-created Stripe Checkout + verified webhook + Stripe Customer Portal. There are no hard-coded client checkout URLs.

```env
ENABLE_PAID_SUBSCRIPTIONS=true
VITE_ENABLE_PAID_SUBSCRIPTIONS=true
MEMBERSHIP_PRICE_CENTS=9900
VITE_MEMBERSHIP_PRICE_CENTS=9900
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_INSIGHT=price_...
SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED=true
SALES_TAX_REVIEW_CONFIRMED=true
```

Before setting the final confirmation to `true`:

1. Apply `drizzle/0010_public_subscription_controls.sql`, `drizzle/0011_breach_jurisdiction_context.sql`, and `drizzle/0012_privacy_rights_and_consent_evidence.sql`.
2. Configure the Stripe Price as active, USD, monthly, and exactly the same amount advertised by Doctor Buddy.
3. Configure the Stripe webhook endpoint as `https://YOUR-DOMAIN/api/billing/webhook` and subscribe at minimum to `checkout.session.completed` and `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
4. Enable/configure the Stripe Customer Portal so a subscriber can cancel online.
5. Test a successful subscription, failed/abandoned checkout, cancellation at period end, subscription deletion, webhook replay, and access denial after entitlement becomes inactive.
6. Review sales-tax obligations for the jurisdictions where subscriptions will be sold and configure collection/remittance as required; then set `SALES_TAX_REVIEW_CONFIRMED=true`.
7. Only after the access lifecycle is tested set `SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_CONFIRMED=true`.

## Consumer-health privacy operations

The code exposes current consent, withdrawal, export, correction/complaint/appeal requests, and active-store deletion controls. Consent evidence snapshots the accepted Terms, Privacy Policy, Health Data Policy, Medical Disclaimer, and disclosed processor list; a material processor-list change forces fresh sensitive-data consent.

Configure a monitored security address and keep these published public-edition retention values unless the policy/code are deliberately updated together:

```env
SECURITY_CONTACT_EMAIL=security@YOUR-DOMAIN
PUBLIC_USAGE_LOG_RETENTION_DAYS=90
PUBLIC_SAFETY_EVENT_RETENTION_DAYS=90
PUBLIC_BACKUP_MAX_RETENTION_DAYS=35
PUBLIC_PRIVACY_REQUEST_DETAIL_RETENTION_DAYS=90
```

The application automatically purges public activity/telemetry metadata and minimal safety-event metadata after 90 days and redacts resolved privacy-request free text after 90 days. Provider/database backups are **not** deleted by application code; configure the hosting/database backup lifecycle to a maximum of 35 days and verify processor-side deletion/expiration separately before confirming the production retention/deletion attestations.

Sensitive application routes return no-store/no-index headers and are excluded from the generated `robots.txt`. `/.well-known/security.txt` publishes the configured security contact. These are defense-in-depth controls, not a replacement for authentication or access control.

Set the production attestation flags only after retention, backup deletion/expiration, processor deletion, incident response, and security procedures actually exist and have been tested.

Do not add ad pixels, retargeting SDKs, session replay, or third-party marketing trackers to health/support surfaces without a new privacy/legal analysis.

## Clinical/HIPAA edition

Do not enable clinical tools simply to unlock features. A clinician edition is a separate deployment and requires the actual covered-entity/business-associate relationship, appropriate BAAs/vendor agreements, PHI safeguards, access/audit controls, retention policy, incident response, and any other applicable regulatory work. Production code requires the clinical flags and confirmations before the clinical edition can start.

The Emergent Edition also requires the real clinical operator identity and its Notice of Privacy Practices URL, plus explicit confirmation that the organization has completed its security-risk analysis, access-control review, audit-control review, workforce training, minimum-necessary review, encryption verification, BAA review, and human-review policy. Persistent clinical assessments, reports, diagnosis-linked research, life-map/life-event workflows, and portal surfaces require authenticated access. Patient report share links rotate when enabled and can be revoked.

```env
PUBLIC_WELLNESS_MODE=false
VITE_PUBLIC_WELLNESS_MODE=false
ENABLE_CLINICAL_TOOLS=true
VITE_ENABLE_CLINICAL_TOOLS=true
HIPAA_DEPLOYMENT_MODE=baa
HIPAA_BAA_CONFIRMED=true
PHI_STORAGE_ENCRYPTION_CONFIRMED=true
CLINICAL_COVERED_ENTITY_NAME="..."
VITE_CLINICAL_COVERED_ENTITY_NAME="..."
CLINICAL_NPP_URL="https://..."
VITE_CLINICAL_NPP_URL="https://..."
HIPAA_SECURITY_RISK_ANALYSIS_CONFIRMED=true
HIPAA_ACCESS_CONTROL_REVIEW_CONFIRMED=true
HIPAA_AUDIT_CONTROLS_CONFIRMED=true
HIPAA_WORKFORCE_TRAINING_CONFIRMED=true
HIPAA_MINIMUM_NECESSARY_REVIEW_CONFIRMED=true
CLINICAL_HUMAN_REVIEW_REQUIRED=true
```

## Finance section

The Finance section (`/finance`, `/finance/fact-finder`, `/finance/calc/:id`, `/finance/strategy/:slug`) is educational: fifty-six pure calculators, six strategy explainers and a resumable fact finder that stores what the person enters in their own browser. It needs no environment variables and no database.

- Public wellness edition: the routes take the ordinary `paid()` gate. The readiness panel reads only the person's own wellness check-ins (`/progress`) and a pause they set for themselves, rewrites every string so nothing reads as a clinical instrument, and links `/financial-disclaimer`. It never calls a clinical procedure.
- Clinical edition: the routes take `clinicalProtected()`. `finance.readiness` (registered clinical-only in `server/compliance/releasePolicy.ts`) returns the authenticated clinical snapshot the panel merges with a locally scored intake.

The release audit checks the gates, the disclaimer link and that the public panel goes through `publicSafeProfile`.

## Docker image and the edition

The image is built from `Dockerfile` with `npm ci` (which needs the repository's `.npmrc`). Vite bakes every `VITE_*` value into the browser bundle at build time, and Railway passes service variables into a Docker build only as declared build arguments, so the Dockerfile declares them all. The build writes `dist/public/build-info.json`; in production the server refuses to start when the bundle was built for a different edition, posture, privacy contact or processor list than the server is configured with. Change a public disclosure → rebuild, not just restart.

## Preview posture

`RELEASE_POSTURE=preview` (and `VITE_RELEASE_POSTURE=preview` at build time) lets the public wellness edition run on the internet for review before the operator attestations are true. The outstanding blockers are counted at `/healthz` and printed at boot, a banner sits on every page, and paid subscriptions and clinical tools cannot be enabled. A placeholder disclosure, a mismatched edition, or a mismatched bundle still stops the boot. Switch to `production` once every attestation is honestly true.

## Health check

`GET /healthz` reports process health without returning health data.

## Release verification

In the deployment environment:

```bash
npm ci
npm run audit:emergent
npm run check
npm test
npm run build
npm audit --omit=dev
```

This workspace does not contain a complete dependency installation, so a fresh typecheck/test/build and dependency vulnerability scan must be completed in the networked deployment environment before public launch.


## Companion, recording consent and the NLP layer (2.2)

- Migration `0013_recording_consent.sql` adds `agreedToAudioAnalysis` / `agreedToVideoAnalysis` to `hipaa_consents`; the consent version is 4.1, so every visitor is shown the notice again (two new optional checkboxes).
- `BUILT_IN_FORGE_MODEL` should name a vision-capable chat model (default `gpt-4o-mini` on an OpenAI endpoint); the companion's camera reads use the same key and endpoint as the AI chat. Frames are sent about every 20 s per person, at low detail, and are not stored.
- The Content-Security-Policy stays `script-src 'self'`: production builds no longer include the Manus host runtime plugin (an inline script) or the JSX source-location plugin; those are development-only.
- Speech recognition and synthesis run in the browser (Web Speech API). Browsers without recognition fall back to typing; everything else is unchanged.
- Sign-in mail: Resend answers 422 when the `from` address is not on a verified domain; the server log now includes Resend's message. `MAIL_FROM` must be an address on a domain verified in the Resend account.
