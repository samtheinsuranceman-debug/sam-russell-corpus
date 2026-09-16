# Doctor Buddy Emergent 2.1 — Handoff, September 16, 2026

Where it lives: `doctor-buddy/` in this repository (the Emergent build as delivered, then everything below, in its own patterns). Railway service `doctor-buddy` in project `russell-capital-systems`, root directory `doctor-buddy`, Dockerfile build, pre-deploy `node dist/migrate.js`, health check `/healthz`. Domain: https://doctor-buddy-production.up.railway.app

Read in this order: `doctor-buddy/PANEL_REVIEW.md` (the four-model review that decided the merge), `doctor-buddy/LESSONS.md` (five disassembly cycles), `doctor-buddy/SIMULATION_REPORT.md` (10,000 apart + 10,000 assembled), `doctor-buddy/DEPLOYMENT.md`.

## What was done

1. Emergent (ChatGPT) build taken as the foundation. Its posture is unchanged: two editions, fail-closed validator, consumer-health consent, data rights, Stripe billing (off), security baseline, Support Lab, legal pages.
2. Claude's delta merged in the foundation's patterns: 56 calculators, six strategies, resumable fact finder, psych-financial bridge; `paid()` gate in the public edition, `clinicalProtected()` in the clinical edition; `finance.readiness` registered clinical-only; public edition reads only the person's own check-ins and a self-chosen pause; every string rewritten so no clinical word reaches a public screen; financial disclaimer page.
3. Baseline defects fixed: `npm ci` failed on the delivered lockfile; two type errors; nine stale tests; the public crisis screen missed "I have a plan"; a silent twin-domain key mismatch in Claude's build.
4. Five disassembly cycles and 20,000+ simulations; engines hardened with input seams; sanitized errors; gate metadata on every procedure; JSON answers for every API edge; build-info edition check; Dockerfile build args and non-root user; migration runner; passwordless email-link sign-in (Resend); preview posture.
5. Verification: typecheck clean, 26 test files, 414 tests, both release audits pass, build succeeds, local boot verified.

## Owner actions that only you can take

- **Attestations.** The eight `*_CONFIRMED` flags on the Railway service are `false` and the site runs as `RELEASE_POSTURE=preview` (banner on every page, blockers counted at `/healthz`). Set each to `true` only after the described work is real, then set `RELEASE_POSTURE=production` and `VITE_RELEASE_POSTURE=production` and redeploy.
- **Legal address.** `LEGAL_BUSINESS_ADDRESS` / `VITE_LEGAL_BUSINESS_ADDRESS` carry "Castle Hayne, NC 28429, USA (full mailing address to be confirmed by the operator)". Replace with the real mailing address (both variables identical) and redeploy.
- **Processors.** The disclosure names Railway, OpenAI (the AI gateway is `https://api.openai.com` with the RCS key) and Resend (sign-in mail). Change the list if you change providers; the validator refuses a mismatch.
- **Stripe.** Off. Follow `DEPLOYMENT.md` before enabling.
- **Clinical edition.** Off, and stays off until a covered-entity deployment with its own attestations exists.
- **Theme photo.** Not received yet. When it arrives, the theme (colors, textures, hero) gets applied across the site.

## Sign-in

No OAuth portal exists for this host, so sign-in is by email link (`/login`): HMAC-signed, single-use, fifteen-minute expiry, five per address per fifteen minutes. `OWNER_EMAIL` signs in as admin. Mail goes through the RCS Resend key and sender (`${{web.RESEND_API_KEY}}`, `${{web.MAIL_FROM}}`); the sender domain must be verified in Resend for delivery.

## Database

`mysql://…@MySQL.railway.internal:3306/doctor_buddy` on the project's existing MySQL service; the migration runner creates the database and applies `drizzle/0000`–`0012` on every deploy, once each, with checksums. Doctor Buddy shares the MySQL server with the RCS site but uses its own database.
