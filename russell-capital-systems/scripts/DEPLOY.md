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
  OAUTH_SERVER_URL      (your managed-auth server URL)
  OWNER_OPEN_ID         (your owner id — gates the Lead Inbox)
AI (any you use; skip-if-absent):
  ANTHROPIC_API_KEY  OPENAI_API_KEY  XAI_API_KEY  GEMINI_API_KEY
  PERPLEXITY_API_KEY  OPENROUTER_API_KEY  MISTRAL_API_KEY  GROQ_API_KEY
  BUILT_IN_FORGE_API_KEY   (Manus / built-in gateway)
Email + voice (optional):
  RESEND_API_KEY   ELEVENLABS_API_KEY   ELEVENLABS_VOICE_ID
> Rotate the 3 burned keys (OpenAI, Mistral, HeyGen) before using them.
> The Resend sender domain (russellcapitalsystems.com) must be verified in Resend.

## 4. Install dependencies
In the cPanel Node app's virtualenv terminal (or "Run NPM Install"):
  npm install --omit=dev
(The server bundle imports packages at runtime, so node_modules must exist.)

## 5. Create the new lead table (one time)
  npm install drizzle-kit drizzle-orm   # if not present
  npx drizzle-kit migrate               # applies drizzle/ migrations incl. public_leads
(or run your existing `db:push` flow against the production DB)

## 6. Start / Restart the app, then point the domain
Restart the Node app in cPanel. Map russellcapitalsystems.com to the app
(cPanel domain/subdomain → application URL). Load the site and verify:
  - homepage renders, mic + estimator work
  - a test lead lands in /portal/leads (owner login) and you get a notification
