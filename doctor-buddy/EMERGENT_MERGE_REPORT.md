# Doctor Buddy Emergent Edition — Merge Report

**Release:** 2.0.0 Emergent Edition
**Merge basis:** PublicPaid Final (`9473fe1`) + Clinical/HIPAA build (`ce4d05b`)
**Architecture:** one codebase, two deliberately separated editions.

## Merge decision

The PublicPaid release is the skeleton because it has the stronger internet/commercial controls: public-vs-clinical server gating, versioned consumer-health consent, data rights, retention controls, processor disclosure/re-consent, billing entitlements, subscription cancellation, production fail-closed validation, and the 50 adaptive support inventions.

The Clinical build supplies the muscle: structured psychiatric intake, Psychiatric Risk Score, Digital Twin, Mental Health Vital Signs, Mental Credit Score, crisis engine, clinician review/sign-off, clinical portals, research support, OpenRouter/Grok routing, Mem0 continuity, and the patent engine portfolio.

## What the Emergent Edition does

### Public Wellness Edition
- 18+ wellness/support posture.
- Friend / Therapist / Psychiatrist communication styles are style choices, not licensed-care claims.
- 50 adaptive support invention kernels and Support Lab remain available.
- Diagnostic/risk/treatment-decision APIs are server-disabled.
- Consumer-health consent, export/deletion/correction/appeal/withdrawal, processor disclosures and paid entitlements remain enforced.
- Sensitive support sessions default toward minimal retention and no raw-session persistence.

### Clinical Decision-Support Edition
- Enabled only through an explicit, separately configured clinical deployment.
- Retains the structured psychiatric intake, PRS, Digital Twin, Vital Signs, MCS, crisis-support and clinician-review workflows.
- Persistent clinical records require authentication; anonymous intake can remain local-only.
- Full professional surfaces and raw model-console access are clinician/operator-admin only.
- Medication-interaction analysis, diagnosis-linked research and life-trajectory analysis are clinician/operator-admin only.
- Clinical reports enforce record ownership; bearer share links are explicit, rotated and revocable.
- Clinical PDF export never embeds a bearer share token.
- AI-generated clinical output is labeled as draft decision support for human clinician review.

## Clinical safeguards added during merge

- Server-side clinical/public route separation retained from PublicPaid.
- Added a dedicated Clinical Edition home and deployment banner.
- Added clinical authentication and clinician-role UI gates.
- Prevented pre-auth persistence of psychiatric intake data.
- Added assessment/report ownership checks and audit events.
- Changed report sharing from automatic to explicit, rotatable and revocable sharing.
- Removed share-token leakage from PDF exports.
- Restricted raw OpenRouter/model-console access to clinician/operator admin role.
- Restricted diagnosis-linked research, life maps, life-event analysis and medication-interaction analysis to clinician/operator admin role.
- Replaced runtime AI-generated legal/privacy-rights logic with deterministic policy logic.
- Retained production fail-closed prerequisites for BAA mode, encryption, access-control review, audit controls, risk analysis, workforce training, minimum-necessary review, covered-entity identity, NPP URL and human review.

## Build A clinical muscle preservation

The following Build A modules were verified byte-for-byte identical in the Emergent tree:

- `shared/engines/adaptiveAssessment.ts`
- `shared/engines/crisisDetection.ts`
- `shared/engines/mentalCreditScore.ts`
- `shared/engines/riskScoring.ts`
- `shared/engines/vitalSigns.ts`
- `shared/intake/questions.ts`
- `shared/intake/scoring.ts`
- `shared/intake/riskFeatures.ts`
- `server/mem0.ts`
- `server/openrouter.ts`
- `server/grok.ts`
- `client/src/pages/PsychiatricRiskScore.tsx`
- `client/src/pages/VitalSigns.tsx`
- `client/src/pages/PsychiatristPortal.tsx`

`DigitalTwin.tsx` and `DoctorPortal.tsx` retain the older functionality with narrow safety wording changes. In particular, the old "HIPAA Compliant" badge was not reintroduced.

## What was intentionally NOT merged back

- The old universal-HIPAA assumption for direct-to-consumer use.
- The legacy HIPAA consent modal as a substitute for a covered-entity Notice of Privacy Practices.
- Runtime AI-generated legal/privacy advice.
- Consumer access to raw diagnostic or clinician-only model-console APIs.
- "HIPAA Compliant" marketing badges or professional-impersonation claims.
- Autonomous diagnosis, prescribing, medication-change, or emergency-detector claims.

## Compliance posture

This code is designed to fail closed and reduce avoidable privacy/medical-product risk. It does **not** itself certify HIPAA compliance or regulatory approval. A real clinical deployment still depends on the actual covered-entity/business-associate relationship, BAAs and processor contracts, infrastructure configuration, risk analysis, policies, workforce training, incident response, access administration, retention, and legal review applicable to the operator and jurisdictions served.
