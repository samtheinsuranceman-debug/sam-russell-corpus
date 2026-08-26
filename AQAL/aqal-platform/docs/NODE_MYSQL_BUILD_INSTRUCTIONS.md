# joinaqal.com — Node.js + MySQL Build & Deployment Instructions

**Audience:** any hosting provider, systems administrator, or developer asked
to put this application online. Everything needed is in the `aqal-platform/`
folder of this package. No other source is required.

## What this application is

- **Runtime:** Node.js **22.x** (the app pins `>=22 <23` in `package.json`)
- **Package manager:** pnpm 10 (`npm install -g pnpm@10`)
- **Database:** MySQL **8.x** (one schema, 33 tables, created by the included
  migration files — no manual SQL needed)
- **Server:** a single Node process (Express) that serves BOTH the API and the
  pre-built website files. No PHP, no Apache document root, no separate
  frontend host needed.
- **Not compatible with:** shared PHP hosting, static-file hosting, or any
  plan without a long-running Node process.

## Step-by-step build

Run these from inside the `aqal-platform/` directory.

### 1. Install prerequisites

```bash
node --version    # must print v22.x
npm install -g pnpm@10
```

### 2. Install dependencies (exact locked versions)

```bash
pnpm install --frozen-lockfile
```

This must complete without changing `pnpm-lock.yaml`. It also applies a
required patch to the `wouter` router package automatically.

### 3. Create the database and user

In MySQL:

```sql
CREATE DATABASE aqal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aqal'@'%' IDENTIFIED BY '<choose-a-strong-password>';
GRANT ALL PRIVILEGES ON aqal.* TO 'aqal'@'%';
```

### 4. Set environment variables

Set these in the host's environment/secrets panel (NOT in a file committed to
the source). The complete annotated list is in
`aqal-platform/docs/ENVIRONMENT_VARIABLES_REQUIRED.md`.

**Required minimum to go live:**

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | whatever port the host routes public traffic to |
| `DATABASE_URL` | `mysql://aqal:<password>@<db-host>:3306/aqal` |
| `JWT_SECRET` | a long random string — generate with `openssl rand -hex 32` |

**Optional (each one simply enables a feature; the site boots without them):**
AI-panel keys (OpenAI/Anthropic/Google/xAI/Groq/Mistral/OpenRouter/
Perplexity), Stripe keys (payments), Resend key (email), Twilio token (SMS
replies), S3/R2 credentials (file storage — falls back to local disk). The
owner supplies these values directly into the host's secrets panel; never ask
for them by email or chat.

### 5. Apply the database migrations

```bash
DATABASE_URL="mysql://aqal:<password>@<db-host>:3306/aqal" npx drizzle-kit migrate
```

This replays the 30 included migration files (`drizzle/*.sql`) in order and
creates all 33 tables. It is additive and safe to re-run; it never drops data.

### 6. Build

```bash
pnpm build
```

Produces `dist/` — the bundled server (`dist/index.js`) and the compiled
website (`dist/public/`, all fonts and assets self-contained).

### 7. Start

```bash
pnpm start          # runs: NODE_ENV=production node dist/index.js
```

Keep it alive with the host's process manager (systemd, PM2, or the
platform's own supervisor). The server binds `0.0.0.0:$PORT` exactly and
exits loudly if the port is unavailable — it will never silently run on a
different port.

### 8. Verify (all four must pass)

```bash
curl -s  http://localhost:$PORT/api/health         # -> 200 JSON
curl -s  http://localhost:$PORT/sitemap.xml | grep -c "<loc>"   # -> 11659
curl -sI http://localhost:$PORT/ | grep -i content-security     # CSP header present
curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/rankings  # -> 200
```

## Domain & HTTPS

- Terminate HTTPS at the host's load balancer / reverse proxy and forward to
  the Node process with `X-Forwarded-Proto` and `X-Forwarded-Host` headers set
  (standard on Railway, Render, and nginx configs).
- **`www.joinaqal.com` is the canonical host.** Point `www` at the app; the
  application itself 301-redirects HTTP→HTTPS and bare-domain→`www`. At the
  DNS/CDN edge, apex should redirect one way to `www` — never `www` to apex.
- After DNS changes, purge any cached redirects at the CDN.

## Easiest managed path (no server administration)

Railway (railway.app) runs this stack as-is: create a project from this
source, add the MySQL plugin (it supplies `DATABASE_URL`), set the variables
from step 4, and deploy — build command `pnpm build`, start command
`pnpm start`, plus the one-time migrate from step 5. The owner's step-by-step
version is `START_HERE_DEPLOYMENT_RUNBOOK.md` in this package.

## Known outstanding items (do not block boot)

- 36 owner media files (4 PDFs + 32 PNGs, listed in
  `aqal-platform/docs/required-storage-assets.txt`) are pending from the
  owner; pages render with built-in fallbacks until they are added to storage
  under `/aqal-storage/`.
- Videos are not yet linked; video slots show a tasteful placeholder until
  the owner supplies links.

## Support checks if something fails

| Symptom | Likely cause |
|---|---|
| `pnpm install` errors about Node version | Not Node 22 — install Node 22.x |
| Server exits at boot naming the port | `PORT` mismatch with the host's routing |
| `/api/health` 200 but login/save fails | `DATABASE_URL` wrong or migrations not applied |
| Emails/SMS/AI scoring "unavailable" | The corresponding optional key is not set — by design, not a crash |
