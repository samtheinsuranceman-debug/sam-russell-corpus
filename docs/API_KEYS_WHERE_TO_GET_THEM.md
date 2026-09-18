# The keys: which app, which key, from where, into where

Every key goes into ONE place and one place only:

**Railway → project → service `web` → Variables tab**
https://railway.com/project/a16ef4bb-3aea-4147-a751-20661ae76eb8/service/e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28/variables

On that page: click **+ New Variable**, type the variable NAME exactly as
written below, paste the VALUE, click **Add**. After the last one, click
**Deploy** (top right, "Apply changes") so the app restarts with the keys.

**The NAME is the left box, and it must be typed exactly as printed here:
capital letters, digits and underscores only.** A name with a dot, a slash
or a space (`Resend.com/apikey`, `Www.russellcapitalsystems.com`) stops
every build on the service with "secret … not found" until it is deleted.
The name never contains the website address or the key itself. The VALUE
is the right box, and that is where the key goes.

Never delete `PUBLIC_BASE_URL`, `VITE_APP_ID`, `DATABASE_URL`, `JWT_SECRET`
or any variable that starts with `RAILWAY_`; the app does not start without
them.

Never paste a key into chat, a file, or the repo. A key that has been seen
anywhere but that Variables page is burned: go back to the provider and
rotate it.

Already set on Railway: `DATABASE_URL`, `JWT_SECRET`, `OWNER_EMAIL`,
`OWNER_NAME`, `PUBLIC_BASE_URL`, `MAIL_FROM`, `MAIL_REPLY_TO`,
`LEAD_NOTIFY_EMAIL`, `SCHEDULER_TOKEN`.

## Do these five first. Each takes under three minutes.

### 1. Anthropic (Claude): every advisor answer, all six answer modes, the PDFs
1. Open https://console.anthropic.com/settings/keys and sign in.
2. Click **Create Key**. Name it `rcs-production`. Click **Create**.
3. Copy the key (starts with `sk-ant-`). It is shown once.
4. Railway Variables → **+ New Variable** → NAME `ANTHROPIC_API_KEY` → VALUE the key → **Add**.

### 2. Resend: lead alerts, follow-ups, the answer PDFs by email, password resets
1. Open https://resend.com/api-keys and sign in.
2. Click **Create API Key**. Name `rcs-production`, permission **Sending access**, domain `russellcapitalsystems.com`. Click **Add**.
3. Copy the key (starts with `re_`).
4. Railway → NAME `RESEND_API_KEY` → VALUE the key.

### 3. ElevenLabs: the advisor speaks, and the founder message on the homepage, in your cloned voice
1. Open https://elevenlabs.io/app/settings/api-keys. Click **Create API Key**, name `rcs`, copy it.
2. Railway → NAME `ELEVENLABS_API_KEY` → VALUE the key.
3. Open https://elevenlabs.io/app/voice-lab. Find your cloned voice, click the **⋯** menu → **Copy Voice ID** (or open the voice and copy the ID from the URL).
4. Railway → NAME `ELEVENLABS_VOICE_ID` → VALUE the id.
   The homepage player at "Hear it from Sam Russell" appears on its own once both are set.

### 4. Owner sign-in: your password hash and authenticator secret
These are generated on your own computer, never typed by hand.
1. In a terminal inside the repo: `cd russell-capital-systems && pnpm install`.
2. `pnpm owner:password` → type a password (10+ characters, a letter and a digit) → it prints a hash starting with `$2b$`.
3. Railway → NAME `OWNER_PASSWORD_HASH` → VALUE the whole hash.
4. `pnpm owner:totp` → it prints a base32 secret and an `otpauth://` link.
5. Railway → NAME `OWNER_TOTP_SECRET` → VALUE the secret. Add the `otpauth://` link to Google Authenticator or 1Password (scan or paste).

### 5. Railway token as a GitHub secret: merges deploy themselves
This one goes into GitHub, not Railway.
1. Open https://railway.com/account/tokens. Click **Create Token**, name `github-deploy`, copy it.
2. Open https://github.com/samtheinsuranceman-debug/sam-russell-corpus/settings/secrets/actions.
3. Click **New repository secret** → NAME `RAILWAY_TOKEN` → SECRET the token → **Add secret**.

## The AI council: more voices in the panel (optional, any or all)

| App | Where to get it | Railway NAME |
|---|---|---|
| OpenAI (ChatGPT) | https://platform.openai.com/api-keys → **Create new secret key** | `OPENAI_API_KEY` |
| xAI (Grok) | https://console.x.ai/ → **API Keys** → **Create API key** | `XAI_API_KEY` |
| Google (Gemini) | https://aistudio.google.com/app/apikey → **Create API key** | `GEMINI_API_KEY` |
| Perplexity | https://www.perplexity.ai/settings/api → **Generate** | `PERPLEXITY_API_KEY` |
| OpenRouter | https://openrouter.ai/settings/keys → **Create Key** | `OPENROUTER_API_KEY` |
| Mistral | https://console.mistral.ai/api-keys → **Create new key** | `MISTRAL_API_KEY` |
| Groq | https://console.groq.com/keys → **Create API Key** | `GROQ_API_KEY` |
| Cohere | https://dashboard.cohere.com/api-keys → **New Trial/Production key** | `COHERE_API_KEY` |
| Together AI | https://api.together.xyz/settings/api-keys → **Create** | `TOGETHER_API_KEY` |

DeepSeek is excluded by your rule.

## Traffic and search (public ids, not secrets)

| App | Where to get it | Railway NAME |
|---|---|---|
| Google Analytics 4 | https://analytics.google.com/ → **Admin** → **Data streams** → your web stream → copy **Measurement ID** (`G-…`) | `GA_MEASUREMENT_ID` |
| Google Search Console | https://search.google.com/search-console → **Add property** → URL prefix `https://www.russellcapitalsystems.com/` → verification method **HTML tag** → copy only the `content="…"` value | `GOOGLE_SITE_VERIFICATION` |
| Google Business Profile | https://business.google.com/ → your profile → **Share** → copy the link | `GOOGLE_BUSINESS_PROFILE_URL` |
| Your address and hours (for the footer and search schema) | Type them | `BUSINESS_NAME`, `BUSINESS_PHONE`, `BUSINESS_EMAIL`, `BUSINESS_STREET`, `BUSINESS_CITY`, `BUSINESS_STATE`, `BUSINESS_POSTAL_CODE`, `BUSINESS_COUNTRY`, `BUSINESS_HOURS` (e.g. `Mo-Fr 09:00-17:00`) |

After Search Console verifies, go to **Sitemaps** in its left menu and submit `https://www.russellcapitalsystems.com/sitemap.xml`.

## Texts, calendar, video (optional)

| App | Where to get it | Railway NAME |
|---|---|---|
| Twilio | https://console.twilio.com/ → **Account Info** on the home page: copy **Account SID** and **Auth Token**; your number is under **Phone Numbers → Manage → Active numbers** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` |
| Calendly | https://calendly.com/event_types/user/me → your event → **Copy link** | `CALENDLY_URL` |
| HeyGen | https://app.heygen.com/settings?nav=API → **Create API key** | `HEYGEN_API_KEY` |
| Slack | https://api.slack.com/apps → your app → **Incoming Webhooks** → **Add New Webhook** → copy URL | `SLACK_WEBHOOK_URL` |

## Data, CRM, billing, automation (optional)

| App | Where to get it | Railway NAME |
|---|---|---|
| FRED | https://fredaccount.stlouisfed.org/apikeys → **Request API key** | `FRED_API_KEY` |
| Plaid | https://dashboard.plaid.com/developers/keys → copy **client_id** and the **Production** secret | `PLAID_CLIENT_ID`, `PLAID_SECRET` |
| HubSpot | https://app.hubspot.com/ → **Settings** (gear) → **Integrations → Private Apps** → **Create private app** → Scopes: contacts read/write → **Create** → copy token | `HUBSPOT_ACCESS_TOKEN` |
| Stripe | https://dashboard.stripe.com/apikeys → **Secret key** → **Reveal** → copy | `STRIPE_SECRET_KEY` |
| Zapier | https://zapier.com/app/zaps → new Zap → trigger **Webhooks by Zapier → Catch Hook** → copy the URL | `ZAPIER_HOOK_URL` |
| Make | https://us2.make.com/ → new scenario → **Webhooks → Custom webhook** → **Add** → copy the URL | `MAKE_HOOK_URL` |

## Short-term rental data (optional; every site works as a button without a key)

| NAME | Where the key comes from | What it unlocks |
|---|---|---|
| `AIRROI_API_KEY` | https://www.airroi.com/api → Get API Key (pay-as-you-go from $0.01 a call, no contract) | Market metrics, revenue estimates, listing search by radius |
| `MASHVISOR_API_KEY` | https://www.mashvisor.com/explore/profile/developers (free account has a few requests; paid plans are credits) | Occupancy, nightly rate, historical Airbnb performance by zip or city |
| `PRICELABS_API_KEY` | https://developers.pricelabs.co/ (from a PriceLabs account) | Revenue Estimator API |
| `AIRDNA_API_KEY` | https://apidocs.airdna.co/ → "Contact us" (private token, enterprise pricing) | AirDNA market and listing data |
| `EXPEDIA_RAPID_API_KEY` | https://developers.expediagroup.com/rapid (partner agreement) | Vrbo supply through Rapid |
| `BEYOND_API_TOKEN` | https://developers.beyondpricing.com/ (personal access token) | Pricing and comp sets for listings you already run |

Rabbu, Awning, Airbnb, Vrbo search and Inside Airbnb have no key to set.

## Hosting, backups, domain

| What | Where | NAME |
|---|---|---|
| Off-site database backups on Cloudflare R2 | https://dash.cloudflare.com/ → **R2** → **Create bucket** `rcs-backups` → **Manage R2 API Tokens** → **Create API token** (Object Read & Write) → copy Access Key ID, Secret Access Key and the S3 endpoint shown | `BACKUP_S3_BUCKET`=`rcs-backups`, `S3_ENDPOINT`, `S3_REGION`=`auto`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` |
| Canonical domain (once DNS points at Railway) | No key | `CANONICAL_HOST`=`www.russellcapitalsystems.com` |
| Sentry browser errors | https://sentry.io/ → project → **Settings → Loader Script** → copy the script URL | `SENTRY_LOADER_URL` |
