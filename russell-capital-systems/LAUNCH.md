# Russell Capital Systems — Launch Runbook

**Audience:** an operating agent or engineer with real access to a host machine
(VPS, dedicated server, or Bluehost cPanel with Node.js Selector) and a MySQL
database. This document is self-contained: follow it top to bottom to take the
site from source to live.

**What this app is:** a full‑stack web app — React 19 + Vite SPA on the client,
an Express + tRPC (v11) server, Drizzle ORM over MySQL. It is **not** a static
site; it needs a running Node process and a database.

**Source of truth**
- Repo: `samtheinsuranceman-debug/sam-russell-corpus`
- Branch: `master` (work lands via PRs from `claude/claude-md-docs-0qgcvw`)
- App subfolder: `russell-capital-systems/` (run everything from here)

---

## ⚡ Fastest path: the homepage live today, no server

The public homepage also exists as a **single self-contained HTML file** with no
server, database, or keys: `docs/index.html` at the repo root (built from
`russell-capital-systems/live/rcs-live-homepage.template.html`). It has the full
page — every image, the AI concierge (falls back to email), the lead fact-finder
(pre-filled email to the advisor), and Calendly booking.

**One click makes it public on GitHub Pages** (a workflow does the rest):

1. Open https://github.com/samtheinsuranceman-debug/sam-russell-corpus/settings/pages
2. Under **Build and deployment → Source** choose **GitHub Actions**. That's it —
   there is nothing to save separately.
3. Open https://github.com/samtheinsuranceman-debug/sam-russell-corpus/actions/workflows/pages.yml
   and click **Run workflow** (or just wait for the next merge to `master`).
   Within a minute or two the homepage is live at
   **https://samtheinsuranceman-debug.github.io/sam-russell-corpus/**
4. (Optional) Add a custom domain on the Pages settings page and point its DNS
   `CNAME` at `samtheinsuranceman-debug.github.io`.

The workflow (`.github/workflows/pages.yml`) republishes `docs/` on every push to
`master`. It cannot switch Pages on by itself — GitHub only lets a repository
admin do that, which is step 2.

Every later `pnpm release` + merge to `master` updates the live page automatically.
The full app (portal, lead inbox, nine-AI panel, database) still deploys per the
sections below.

## 🎙 What a new client gets in the portal (New Client Welcome List)

1. **Financial Assessment** (`/portal/financial-assessment`) — the 15-section,
   ~190-question fact finder with autosave and a printable Financial Analysis
   Document. Nothing is advised until it is complete.
2. **AI Financial Advisor** (`/portal/ai-advisor`) — the tape recorder. The whole
   AI team answers as one Financial Librarian, by voice or text, only once the
   assessment is complete. Press **JOURNEY** and it distils everything asked into
   3–5 core questions, names the question the client hasn't asked, and lays out
   10–15 pages of this site — calculators included — in order.
3. **Wealth Genome Analysis**, then **The Arrival → The Brotherhood** (the seven
   journey pages).

Voice output uses `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` when set; otherwise
the browser's own voice. With no AI keys the librarian still answers from the
assessment alone (no invented figures). Builder notes for the next engineer are in
`docs/grok-handoff/`.

## ⚙ One command to regenerate everything

From `russell-capital-systems/`:

```bash
pnpm release
```

runs typecheck → builds `docs/index.html` → public-surface tests (including the
live-page ↔ React parity test) → production build → `rcs-deploy-<date>.zip` →
`rcs-code-book/`. Any failing step aborts, so stale artifacts are never produced
from a broken build. Then commit and push.

---

## 0. Security contract (do not violate)

- **API keys and secrets live ONLY in the host's environment variables.** Never
  put them in the code, the repo, logs, or any chat. The app reads every key
  from `process.env` and skips any provider whose key is absent.
- **Rotate the three burned keys before use:** OpenAI, Mistral, HeyGen.
- The Resend sender domain (`russellcapitalsystems.com`) must be **verified in
  Resend** or acknowledgement emails will not send.
- **Never fabricate** financial figures, results, or patent statuses. The app is
  built to keep figures out of the public view; keep it that way.

---

## 1. Prerequisites

- **Node.js 20.19+ or 22** (`node -v`)
- **pnpm** (`npm i -g pnpm`) — the repo ships `pnpm-lock.yaml`
- **MySQL 8** database (host, port 3306, a database name, user, password)
- Outbound HTTPS from the server (the AI/email providers are called server‑side)

---

## 2. Get the code

```bash
git clone https://github.com/samtheinsuranceman-debug/sam-russell-corpus.git
cd sam-russell-corpus/russell-capital-systems   # master is the release branch
```

## 3. Install dependencies

```bash
pnpm install --frozen-lockfile
# npm also works: `npm install` (the repo's .npmrc sets legacy-peer-deps, which
# npm needs here — without it npm refuses to resolve the tree)
```

## 4. Configure environment variables

Set these in the host's environment (cPanel "Environment variables" panel, a
systemd unit, a `.env` loaded by your process manager, etc.) — **not** in the repo.

### Required (app will not run correctly without these)
| Variable | Value |
|---|---|
| `DATABASE_URL` | `mysql://USER:PASS@HOST:3306/DBNAME` |
| `JWT_SECRET` | long random string (session signing) |
| `OWNER_EMAIL` | the owner's sign‑in email — **this is how you reach `/portal/leads` on your own host** |
| `OWNER_PASSWORD_HASH` | bcrypt hash of the owner password; generate with `pnpm owner:password` (never store the password itself) |
| `OWNER_NAME` | display name for the owner account (optional) |
| `OWNER_OPEN_ID` | the owner's user id (optional; defaults to `owner`). Also gates the inbox for a managed‑OAuth user |
| `OAUTH_SERVER_URL` | **managed host only** (Manus). Leave unset on cPanel/VPS — the owner sign‑in above replaces it |
| `NODE_ENV` | `production` |
| `PORT` | port to listen on (default `3000`) |

### AI advisors (optional — each is skip‑if‑absent; add the ones you use)
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY`,
`PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`,
`BUILT_IN_FORGE_API_KEY` (Manus / built‑in gateway; also powers `BUILT_IN_FORGE_API_URL` if self‑hosted).
> With zero AI keys the homepage concierge degrades gracefully to a written teaser.

### Email (pick one — this is how you hear about new leads)
- **Plain SMTP, nothing to verify:** `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`,
  `SMTP_PASS`, optional `SMTP_FROM`. For Gmail: host `smtp.gmail.com`, port `587`,
  user = your Gmail address, pass = a Google **App Password** (Google Account →
  Security → 2‑Step Verification → App passwords). Bluehost's own mail server
  works the same way with a cPanel mailbox.
- **Or Resend:** `RESEND_API_KEY` (the sender domain `russellcapitalsystems.com`
  must be verified in Resend first).
- `LEAD_NOTIFY_EMAIL` — where "new lead" alerts go (defaults to `OWNER_EMAIL`).

Every new homepage lead then emails you (name, contact, best time, their question,
and a link to the inbox — never the figures) and sends the prospect a warm
acknowledgement. With no mail configured, leads are still saved to the inbox;
you just won't be emailed.

### Voice (optional)
`ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` (spoken answers).

### Client build‑time (optional)
`VITE_APP_ID`.

## 5. Create / migrate the database

The homepage lead capture needs the `public_leads` table (plus the existing
schema — 115 tables in all). Create an empty database first (cPanel → MySQL
Databases, or `CREATE DATABASE rcs CHARACTER SET utf8mb4;`), then build it in
**either** of two ways:

**A. With shell access (recommended)**
```bash
# DATABASE_URL must be exported in this shell
DATABASE_URL="mysql://USER:PASS@HOST:3306/DBNAME" pnpm db:build
```
`db:build` applies `drizzle/schema.ts` directly to the database and then verifies
that every table exists (it prints `✔ database is complete`). Safe to re-run:
existing tables are kept, missing tables/columns are added, nothing is dropped
without drizzle-kit telling you first.

**B. No shell access (phpMyAdmin)**
Import `russell-capital-systems/database/rcs-schema.sql` — the complete schema
as one plain SQL file (regenerated by `pnpm db:schema` / `pnpm release`).
phpMyAdmin → select the database → **Import** → choose the file → Go. You
should see 115 tables afterwards.

> Do **not** use `drizzle-kit migrate` on a fresh database: the historical
> migration chain in `drizzle/` is incomplete (files 0001–0066 were never
> committed), so it cannot replay from zero. `db:build` and the SQL export
> both come straight from the schema and don't depend on that history.

## 6. Build

```bash
pnpm check            # typecheck (optional but recommended)
pnpm build            # client -> dist/public, server -> dist/index.js
```

## 7. Run

```bash
pnpm start            # = NODE_ENV=production node dist/index.js
```
The server serves the SPA (from `dist/public`) and the tRPC API on `PORT`.

### Keep it alive (VPS / dedicated) — pick one
**pm2**
```bash
npm i -g pm2
PORT=3000 NODE_ENV=production pm2 start dist/index.js --name rcs
pm2 save && pm2 startup
```
**systemd** (`/etc/systemd/system/rcs.service`)
```ini
[Service]
WorkingDirectory=/path/to/russell-capital-systems
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/path/to/rcs.env      # holds DATABASE_URL, JWT_SECRET, keys, ...
ExecStart=/usr/bin/node dist/index.js
Restart=always
[Install]
WantedBy=multi-user.target
```
```bash
systemctl daemon-reload && systemctl enable --now rcs
```

### Bluehost cPanel (Node.js Selector) alternative
- Node 20.19+/22, **Application root** = the app folder, **Startup file** =
  `dist/index.js`, **Mode** = Production.
- Add every env var in the panel, "Run NPM Install" (`--omit=dev`), run the
  step‑5 migration in the app's virtualenv terminal, then Restart.

## 8. Put it on the domain

Point `russellcapitalsystems.com` at the running app.

**nginx reverse proxy** (VPS)
```nginx
server {
  server_name russellcapitalsystems.com www.russellcapitalsystems.com;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme; }
}
```
Then issue TLS (e.g. `certbot --nginx`). On cPanel, map the domain/subdomain to
the Node app and enable AutoSSL. The app already respects `X-Forwarded-Proto`
for secure cookies.

## 9. Verify it's live

**Automated check (30 seconds):** from the app directory on the host, or from
any machine that can reach the site:
```bash
node scripts/smoke_lead_capture.mjs https://russellcapitalsystems.com
# add DATABASE_URL=... in front to also confirm the row landed in public_leads
```
It submits a clearly-fake test lead through the real API, checks that the
visitor sees only the qualitative teaser (no figures), that the returning-visitor
cookie works, and (with `DATABASE_URL`) that the `public_leads` row exists with
the advisor analysis. Delete "Smoke Test" from `/portal/leads` afterwards.

Add `SMOKE_OWNER_EMAIL=… SMOKE_OWNER_PASSWORD=…` to also sign in as the owner and
confirm the lead is visible in the inbox.

**Manual check:**
- Homepage loads at the domain over HTTPS.
- **Sign in**: `/login` shows the owner email + password form (it appears only when
  `OWNER_EMAIL` and `OWNER_PASSWORD_HASH` are set). Five wrong attempts lock that
  client out for 15 minutes.
- **Ask AI Brain Trust**: press the mic / type a question → an answer returns
  (or the graceful teaser if no AI keys are set).
- **Tax & Savings Estimate**: submit a test lead with consent → you see the
  qualitative teaser (no dollar figures).
- Owner login → **`/portal/leads`** shows the test lead with the illustrative
  advisor figures; the CSV export works; you receive an owner notification and
  (if Resend is configured) the test address gets an acknowledgement email.
- Returning-visitor greeting shows your name on reload.

## 10. Troubleshooting

- **Blank page / 502:** app not started or wrong startup file → confirm
  `dist/index.js` exists (`pnpm build`) and the process is running on `PORT`.
- **DB errors / leads not saving:** `DATABASE_URL` wrong or migration not run →
  re-run step 5; confirm the DB user can `CREATE TABLE`.
- **Concierge says "not configured":** no AI keys set → add at least one AI key
  (e.g. `ANTHROPIC_API_KEY`) in the env and restart.
- **No acknowledgement emails:** `RESEND_API_KEY` missing or sender domain not
  verified in Resend.
- **Owner inbox 403:** `OWNER_OPEN_ID` doesn't match your logged-in user, or the
  user's role isn't `admin`.

---

*Build is verified: `pnpm check`, the test suite, and `pnpm build` all pass on
this branch. Everything above is standard Node deployment — no repo‑specific
magic beyond the scripts named here (`build`, `start`, `check`, `db:push`).*
