# Russell Capital Systems — Go-Live (Bluehost cPanel Node.js Selector)

This bundle is a VERIFIED production build. To make the site live:

## 1. Upload
Upload this whole folder to your Bluehost account (e.g. /home/USER/rcs) via
cPanel File Manager or SFTP. Keep the structure: `dist/`, `drizzle/`,
`package.json`, `pnpm-lock.yaml`, `drizzle.config.ts`.

## 2. cPanel → Setup Node.js App
- Node version: 20.19+ or 22
- Application root: the uploaded folder (…/rcs)
- Application startup file: dist/index.js
- Application mode: Production

## 3. Environment variables (cPanel "Environment variables" panel — NEVER in code)
Required:
  DATABASE_URL          mysql://USER:PASS@HOST:3306/DBNAME
  JWT_SECRET            (long random string)
  OWNER_EMAIL           (your sign-in email for /login and the Lead Inbox)
  OWNER_PASSWORD_HASH   (bcrypt hash from `npm run owner:password`)
  OWNER_NAME            (optional display name)
  OAUTH_SERVER_URL      (managed host only — leave unset on cPanel)
AI (any you use; skip-if-absent):
  ANTHROPIC_API_KEY  OPENAI_API_KEY  XAI_API_KEY  GEMINI_API_KEY
  PERPLEXITY_API_KEY  OPENROUTER_API_KEY  MISTRAL_API_KEY  GROQ_API_KEY
  COHERE_API_KEY  DEEPSEEK_API_KEY  TOGETHER_API_KEY
  BUILT_IN_FORGE_API_KEY   (Manus / built-in gateway)
Email — how you hear about new leads (pick one):
  SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS [SMTP_FROM]   (Gmail app password or a cPanel mailbox; nothing to verify)
  or RESEND_API_KEY                                    (needs the sender domain verified in Resend)
  LEAD_NOTIFY_EMAIL                                    (optional; defaults to OWNER_EMAIL)
  MAIL_FROM MAIL_REPLY_TO PUBLIC_BASE_URL              (deliverability; run `npm run mail:check`)
Text messages (optional):
  TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM     (or TWILIO_MESSAGING_SERVICE_SID)
  or SMS_WEBHOOK_URL [SMS_WEBHOOK_TOKEN]               (any relay that accepts {to, body})
  LEAD_NOTIFY_PHONE                                    (text you on every lead)
Automation: FOLLOWUPS_DISABLED=1 to turn the lead sequence off; SCHEDULER_TOKEN + cron
  `npm run followups:run` every 5 min on hosts that sleep the process.
Market data (optional): FRED_API_KEY
Voice (optional): ELEVENLABS_API_KEY ELEVENLABS_VOICE_ID
> Owner sign-in: set OWNER_EMAIL and OWNER_PASSWORD_HASH (make the hash with
> `npm run owner:password` on your own computer; never store the password).
> Then /login shows the owner form and /portal/leads opens for you.
> Rotate the 3 burned keys (OpenAI, Mistral, HeyGen) before using them.
> The Resend sender domain (russellcapitalsystems.com) must be verified in Resend.

## 4. Install dependencies
In the cPanel Node app's virtualenv terminal (or "Run NPM Install"):
  npm install --omit=dev
(The bundle ships an .npmrc with legacy-peer-deps=true, which npm needs to resolve
this tree. The server bundle imports packages at runtime, so node_modules must exist.)

## 5. Build the database (one time; safe to repeat)
Create an empty MySQL database in cPanel → MySQL Databases, grant the user ALL
privileges, and put its URL in DATABASE_URL. Then either:
  (a) in the app's terminal:   npm run db:build
      -> applies the full schema (115 tables, incl. public_leads) and verifies it
  (b) no terminal: phpMyAdmin -> select the database -> Import -> database/rcs-schema.sql
      (the same 115 tables as one plain SQL file; it's inside this bundle)
Do NOT run `drizzle-kit migrate` on a fresh database — the migration history is
incomplete; db:build and the SQL file are generated straight from the schema.

## 6. Start / Restart the app, then point the domain
Restart the Node app in cPanel. Map russellcapitalsystems.com to the app
(cPanel domain/subdomain → application URL). Then prove the lead pipeline:
  node scripts/smoke_lead_capture.mjs https://russellcapitalsystems.com
(prefix DATABASE_URL=... to also confirm the public_leads row). Then verify by hand:
  - homepage renders, mic + estimator work
  - a test lead lands in /portal/leads (owner login) and you get a notification
