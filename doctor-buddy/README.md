# Doctor Buddy

**Emergent Edition: one codebase, two deliberately separated products — Public Wellness and Clinical Decision Support.**

Doctor Buddy is configured to launch publicly as a direct-to-consumer wellness product. The public edition does **not** diagnose, prescribe, provide psychotherapy or psychiatry, make medication decisions, determine level of care, continuously monitor users, or act as an emergency service. “Friend Zone,” “Therapist Zone,” and “Psychiatrist Zone” are communication styles only; they do not create a professional-patient relationship or turn the software into a licensed professional.

The repository also contains the full clinician decision-support stack and patent-engine prototypes inherited from the clinical build. They are **server-disabled in the public edition** and cannot be exposed merely by changing the UI. When Clinical Edition is deliberately selected, the app swaps to a clinical home/entry experience, requires authenticated access for persistent clinical surfaces, and enables the retained intake, Psychiatric Risk Score, Digital Twin, Mental Health Vital Signs, clinician-review, research, crisis-support, and portal workflows behind the server gate.

Before any production deployment, follow `PUBLIC_LAUNCH_CHECKLIST.md`, `HIPAA_SAFEGUARDS.md`, `DEPLOYMENT.md`, and `EMERGENT_MERGE_REPORT.md`. Production startup is intentionally fail-closed when required operator disclosures, security attestations, billing configuration, clinical safeguards, or release-mode settings are missing.

## Two deployment editions

- **Public Wellness Edition** — paid adult wellness/support software with the 50-engine Adaptive Support Lab, Friend/Therapist/Psychiatrist communication styles, wellness check-ins, journaling, education, medication organization, research/care-preparation, privacy rights, and subscription controls. Clinical APIs remain server-blocked.
- **Clinical Edition** — separately configured decision-support software retaining the richer clinical build: DSM-oriented intake, PRS, 12-domain Digital Twin, Mental Health Vital Signs, clinician review/sign-off, provider portals, diagnosis-linked evidence retrieval, crisis-support logic, and the same adaptive-support layer. Persistent clinical functions require authenticated access and the production gate requires the configured HIPAA/BAA/security/human-review prerequisites.

## Public product boundaries

The public edition is designed around:

- user-directed wellness and reflection exercises;
- journaling, organization, and personal progress tracking;
- general health and mental-health education;
- preparation of questions for licensed professionals;
- medication **organization** without interaction analysis or individualized medication recommendations;
- crisis-resource surfacing without claiming continuous monitoring or guaranteed detection;
- privacy controls, export, correction/complaint/appeal requests, consent withdrawal, and consumer-health-data deletion;
- paid software access with explicit recurring-billing consent and online cancellation.

The following are blocked in the public server release: diagnostic assessment/report generation, psychiatric risk scoring, clinical Digital Twin outputs, clinician whisperers, medication-interaction analysis, clinician-only wellness/treatment planning, clinical report sharing, and other clinical tRPC namespaces listed in `server/compliance/releasePolicy.ts`.

## Financial readiness

Both editions carry the medically-driven financial planning section merged from the Claude build: fifty-six educational calculators (indexed life, whole-life banking, retirement, tax, debt and mortgage, protection, estate, business, real estate, growth), six strategy explainers and a resumable fact finder, all pure TypeScript that runs in the browser. A psychometric-financial bridge turns how the person is doing into guardrails that only ever tighten: a cooling-off period before anything irreversible, a cash cushion, a borrowing limit, a maximum single move, and a hold while a safety note is active. In the public edition the bridge reads only the person's own wellness check-ins and a pause they set for themselves; in the clinical edition it reads the authenticated clinical record through the clinical-only `finance.readiness` procedure. See `PANEL_REVIEW.md` for the four-model review that decided the integration and `/financial-disclaimer` for the boundary.

## Three communication zones

- **Friend Zone** — warm, plainspoken reflection and practical next steps.
- **Therapist Zone** — structured reflective-listening style, values clarification, and low-risk coping-skill education; not psychotherapy.
- **Psychiatrist Zone** — clinically literate educational wording and preparation for a licensed-clinician conversation; not psychiatry, diagnosis, prescribing, dosing, tapering, or medication selection.

Server-owned prompts enforce these boundaries. The browser cannot supply its own system prompt.

## Privacy and paid access

The public edition separates consumer-health-data consent from recurring-billing consent. Sensitive support surfaces require affirmative consumer-health-data consent. Withdrawal, export, and deletion controls remain reachable even when consent is withdrawn or a subscription is inactive.

Paid access uses a server-created Stripe Checkout Session, signed Stripe webhooks, stored subscription status, a hosted customer portal for online cancellation, and server-side entitlement checks. Production will not enable paid mode unless the configured Stripe price matches the advertised monthly price and the operator confirms that entitlement enforcement has been tested. The public AI route also fails closed unless its real HTTPS processor endpoint and legal processor identity are explicitly configured and disclosed.

## Security baseline

Production includes secure/HttpOnly session cookies, server-signed OAuth state with a nonce, HTTPS-only production configuration, HSTS, CSP and other response headers, cross-origin mutation checks, body-size limits, basic API rate limiting, record-ownership checks, no-store/no-index handling for sensitive routes, a restrictive `robots.txt`, `/.well-known/security.txt`, automated short-retention cleanup for public telemetry/safety metadata, and a `/healthz` endpoint. These controls are a baseline—not a substitute for hosting/WAF controls, vulnerability management, incident response, backups, encryption verification, vendor review, or legal review.

## Running and verification

Use Node 22+ in a normal networked build environment:

```bash
npm ci
npm run audit:emergent
npm run check
npm test
npm run build
# or all source/build checks:
npm run verify
```

Database changes for subscription controls, jurisdiction-aware breach tracking, and versioned consent/privacy-rights evidence are in `drizzle/0010_public_subscription_controls.sql`, `drizzle/0011_breach_jurisdiction_context.sql`, and `drizzle/0012_privacy_rights_and_consent_evidence.sql`; apply all three before production.

**Do not use real patient/consumer health data in development or test environments unless those environments have been intentionally secured and approved for that use.**

## Clinical/patent material

Patent-engine and clinician-module source remains available for continued R&D. Its presence in the repository does not make those functions part of the public product and does not establish FDA clearance, HIPAA compliance, clinical validation, efficacy, safety, or patentability. Draft patent materials should be reviewed by qualified patent counsel before filing, and any future regulated clinical product should receive an independent regulatory and clinical-validation review before release.


## 2.2 — the NLP foundation and the Companion

`shared/nlp/` holds the representational-system languaging engine, the Meta-Model (Structure of Magic), the 51 meta-programs (Hall & Bodenhamer), the 77 Sourcebook of Magic patterns with Dilts' 14 Sleight of Mouth reframes, and the companion engine that decides whether, when and how to speak. The AI chat's system prompt is built from it on every turn; `/companion` is the live voice version with optional, separately consented voice and camera analysis. See `NLP_FOUNDATION.md`.
