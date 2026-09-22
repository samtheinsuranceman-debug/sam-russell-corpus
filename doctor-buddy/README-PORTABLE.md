# Doctor Buddy — Portable Build

Doctor Buddy is a full-stack React/TypeScript adaptive wellness-support platform. The default internet-facing edition is an adults-only consumer product for reflection, education, organization, healthy-routine support, and care preparation. The repository also contains server-disabled clinician R&D modules and patent-engine prototypes that are not part of the default public edition.

## Stack

- React 19 + Vite 7 + Tailwind CSS 4
- Express 4 + tRPC 11
- Drizzle ORM + MySQL/TiDB
- Vitest
- Node.js 22+

## Run locally

```bash
npm ci
cp .env.example .env
npm run dev
```

The default port is `3000` unless `PORT` is set.

## Verify a production build

```bash
npm run verify
```

That runs TypeScript checking, the Vitest suite, and the production build.

## Production

```bash
npm run build
npm start
```

The server serves the compiled client from `dist/public` and exposes tRPC under `/api/trpc`.

A lightweight process health check is available at:

```text
GET /healthz
```

## Environment

Copy `.env.example` and configure the services you use. Public marketing/legal pages remain available without a subscription. Sensitive wellness features require authentication, current consumer-health-data consent, and—when paid mode is enabled—a server-verified active entitlement. AI, database persistence, research, and billing require their corresponding production configuration.

## Database

Apply the SQL migrations in `drizzle/` in numeric order before using persistent production features.

## Deployment

A production `Dockerfile`, `railway.json`, and full deployment notes are included. See `DEPLOYMENT.md`.

## Important scope

The public edition is wellness/support software, not a medical practice, psychotherapy or psychiatry service, diagnostic system, prescribing service, or emergency-monitoring service. The repository does not itself establish HIPAA compliance, FDA clearance, regulator approval, clinical validation, or a production security certification. Follow `PUBLIC_LAUNCH_CHECKLIST.md`, `HIPAA_SAFEGUARDS.md`, and `DEPLOYMENT.md`; production is intentionally fail-closed until required real-world configuration and attestations are supplied.
