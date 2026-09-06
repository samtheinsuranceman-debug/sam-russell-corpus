# Which apps need a key, where to get it, and what it switches on

Every key goes in ONE place: **Railway → project → service `web` → Variables**
(https://railway.app/project/a16ef4bb-3aea-4147-a751-20661ae76eb8). Type the
variable name exactly as shown, paste the value, then **Redeploy**. Never put
a key in chat, in a file, or in the repo — a key that has ever appeared
outside the panel is burned; rotate it at the provider.

Currently set on Railway: `DATABASE_URL`, `JWT_SECRET`, `OWNER_EMAIL`,
`OWNER_NAME`, `PUBLIC_BASE_URL`, `MAIL_FROM`, `MAIL_REPLY_TO`,
`LEAD_NOTIFY_EMAIL`, `SCHEDULER_TOKEN`. Everything below is NOT set yet.

## 1. The AI advisors (the mic button, the concierge, the council, the harvest)
One key makes the site answer. The rest add voices to the panel.

| App | Variable | Get the key | What it turns on |
|---|---|---|---|
| **Anthropic (Claude) — the lead, set this first** | `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | Every advisor answer, the six answer modes, journeys, unasked questions, the erosion harvest, the PDF emails |
| OpenAI (ChatGPT) | `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Second opinion in the council |
| xAI (Grok) | `XAI_API_KEY` | https://console.x.ai/ | Council voice |
| Google (Gemini) | `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey | Council voice |
| Perplexity | `PERPLEXITY_API_KEY` | https://www.perplexity.ai/settings/api | Web-grounded research voice |
| OpenRouter | `OPENROUTER_API_KEY` | https://openrouter.ai/settings/keys | One key that reaches many models |
| Mistral | `MISTRAL_API_KEY` | https://console.mistral.ai/api-keys | Council voice |
| Groq | `GROQ_API_KEY` | https://console.groq.com/keys | Fast council voice + speech-to-text |
| Cohere | `COHERE_API_KEY` | https://dashboard.cohere.com/api-keys | Council voice |
| Together AI | `TOGETHER_API_KEY` | https://api.together.xyz/settings/api-keys | Council voice |

DeepSeek is excluded by your rule.

## 2. Voice and video
| App | Variable | Get the key | What it turns on |
|---|---|---|---|
| ElevenLabs | `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` | https://elevenlabs.io/app/settings/api-keys · voice id from https://elevenlabs.io/app/voice-lab | The advisor speaks its answers in your cloned voice |
| HeyGen | `HEYGEN_API_KEY` | https://app.heygen.com/settings?nav=API | Video proposals |

## 3. Email and texts (leads, follow-ups, the answer PDFs)
| App | Variable | Get the key | What it turns on |
|---|---|---|---|
| **Resend — set this** | `RESEND_API_KEY` | https://resend.com/api-keys (domain already DKIM-verified) | Lead alerts, follow-up sequences, the six-way answer PDF by email, password resets |
| or SMTP (Google Workspace) | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Google account → Security → App passwords: https://myaccount.google.com/apppasswords | Same, without Resend |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | https://console.twilio.com/ | Texts to leads and clients, STOP handling |
| or any SMS relay | `SMS_WEBHOOK_URL` (+ `SMS_WEBHOOK_TOKEN`) | Your relay's endpoint | Texts through Inkbox / Speko / any relay |
| Slack | `SLACK_WEBHOOK_URL` | https://api.slack.com/apps → Incoming Webhooks | Lead alerts into a channel |
| Calendly | `CALENDLY_URL` (a link, not a key) | https://calendly.com/event_types/user/me | Booking link in every follow-up |

## 4. Data feeds
| App | Variable | Get the key | What it turns on |
|---|---|---|---|
| FRED (St. Louis Fed) | `FRED_API_KEY` (optional — the site already reads FRED keyless) | https://fredaccount.stlouisfed.org/apikeys | Faster rate/CPI pulls |
| Plaid | `PLAID_CLIENT_ID`, `PLAID_SECRET` | https://dashboard.plaid.com/developers/keys | Account aggregation into the Financial Assessment |

## 5. CRM, billing, automation
| App | Variable | Get the key | What it turns on |
|---|---|---|---|
| HubSpot | `HUBSPOT_ACCESS_TOKEN` | https://app.hubspot.com/ → Settings → Integrations → Private Apps | Every lead and client becomes a contact |
| Stripe | `STRIPE_SECRET_KEY` (+ `STRIPE_WEBHOOK_SECRET`) | https://dashboard.stripe.com/apikeys | Client billing and subscriptions |
| Zapier | `ZAPIER_HOOK_URL` | Zap → "Catch Hook" trigger URL: https://zapier.com/app/zaps | Every ledger event to 9,000 apps |
| Make | `MAKE_HOOK_URL` | Scenario → Webhooks → Custom webhook: https://us2.make.com/ | Same, into Make |
| n8n | `N8N_HOOK_URL` | Your n8n Webhook node URL | Same, into n8n |
| Any receivers | `EVENT_WEBHOOK_URLS` (+ `EVENT_WEBHOOK_SECRET`) | Comma-separated URLs | Signed events to anything |

## 6. Analytics and monitoring (public ids, not secrets)
| App | Variable | Get it | What it turns on |
|---|---|---|---|
| Google Analytics 4 | `GA_MEASUREMENT_ID` (G-…) | https://analytics.google.com/ → Admin → Data streams | Traffic and organic reporting |
| Google Search Console | `GOOGLE_SITE_VERIFICATION` | https://search.google.com/search-console → Add property → HTML tag (the `content` value) | Verification tag on every page; then submit `/sitemap.xml` |
| PostHog | `POSTHOG_KEY` (+ `POSTHOG_HOST`) | https://app.posthog.com/settings/project | Which portal pages clients use |
| Sentry | `SENTRY_LOADER_URL` | https://sentry.io/ → Project → Loader Script | Browser error alerts |
| Intercom | `INTERCOM_APP_ID` | https://app.intercom.com/ → Settings → Installation | Support chat in the portal |
| Google Business Profile | `GOOGLE_BUSINESS_PROFILE_URL` + the `BUSINESS_*` address/phone/hours | https://business.google.com/ | Local SEO: same name/address/phone in the footer and the schema |

## 7. Hosting, backups, security
| App | Variable | Get it | What it turns on |
|---|---|---|---|
| Railway (deploy trigger from GitHub) | `RAILWAY_TOKEN` — as a **GitHub repository secret**, not a Railway variable | https://railway.app/account/tokens → then GitHub repo → Settings → Secrets → Actions | Every merge deploys itself; today I trigger it by hand |
| Off-site backups (any S3-compatible: AWS S3, Cloudflare R2, Backblaze B2) | `BACKUP_S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | R2: https://dash.cloudflare.com/ → R2 → Manage API tokens · B2: https://secure.backblaze.com/app_keys.htm · AWS: IAM user keys | Daily database backup leaves the host |
| Cloudflare | `CLOUDFLARE_API_TOKEN` | https://dash.cloudflare.com/profile/api-tokens | DNS and edge (optional) |
| Owner password | `OWNER_PASSWORD_HASH` | Run `pnpm owner:password` on your own machine; paste the hash | Owner sign-in |
| Owner MFA | `OWNER_TOTP_SECRET` | Run `pnpm owner:totp` on your own machine; paste the secret, add the printed URI to your authenticator app | Six-digit code after the password |
| Canonical domain | `CANONICAL_HOST` = `www.russellcapitalsystems.com` (once the domain points at Railway) | No key | http → https and apex/www redirects, HSTS |

## The minimum that makes the site feel alive today
1. `ANTHROPIC_API_KEY` — every advisor feature wakes up.
2. `RESEND_API_KEY` — leads, follow-ups and the answer PDFs go out.
3. `OWNER_PASSWORD_HASH` (+ `OWNER_TOTP_SECRET`) — you can sign in as owner.
4. `GA_MEASUREMENT_ID` + `GOOGLE_SITE_VERIFICATION` — traffic and search reporting.
5. `RAILWAY_TOKEN` as a GitHub secret — merges deploy themselves.
