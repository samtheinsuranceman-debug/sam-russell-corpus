# Environment Variables — Names and Purposes Only

This guide intentionally contains **no values**. Set real values only in the
deployment platform's environment/secrets screen (e.g. Railway → Variables).
Never paste a real key into source, chat, logs, tests, fixtures, or docs.
`.env.example` in the repo root mirrors this list with blank values.

## Required to run at all

| Name | Purpose |
|---|---|
| `NODE_ENV` | `production` in deployment; `development` locally. |
| `PORT` | The exact port the platform routes traffic to; production binds it exactly. |
| `DATABASE_URL` | MySQL connection string for the app database. |
| `JWT_SECRET` | Session-signing secret. Generate a long random string (e.g. `openssl rand -hex 32`). |

## Auth (optional — app boots without; login falls back)

`OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `VITE_OAUTH_PORTAL_URL`, `CLERK_SECRET_KEY`

## AI scoring panel (each empty key skips that panel member; mock fallback exists)

`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `OPENAI_TRANSCRIBE_MODEL`,
`ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`,
`GOOGLE_API_KEY`, `GOOGLE_MODEL`, `XAI_API_KEY`, `XAI_MODEL`,
`GROQ_API_KEY`, `GROQ_MODEL`, `MISTRAL_API_KEY`, `MISTRAL_MODEL`,
`OPENROUTER_API_KEY`, `COHERE_API_KEY`, `COHERE_MODEL`, `AI21_API_KEY`, `AI21_MODEL`,
`PERPLEXITY_API_KEY`, `PERPLEXITY_MODEL`,
`STT_PROVIDER`, `GROQ_STT_BASE`, `GROQ_STT_MODEL`,
`BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` (legacy gateway fallback)

## Storage (optional — falls back to local filesystem)

`S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`,
`S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`

## Payments, email, messaging (each empty value disables that feature cleanly)

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`,
`TWILIO_AUTH_TOKEN` (also validates inbound webhook signatures)

## Access gates

| Name | Purpose |
|---|---|
| `BETA_ACCESS_CODE` | Shared passcode unlocking evidence-verified scoring for early users. |
| `BETA_MAX_REDEMPTIONS` | How many redemptions the beta code allows. |
| `FREE_ACCESS_CODE` | Universal free-signup passcode (a server default applies if unset). |

## Deployment shape

| Name | Purpose |
|---|---|
| `CANONICAL_HOST` | The single public hostname (defaults to `www.joinaqal.com`). |
| `BIND_HOST` | Interface to bind (defaults to `0.0.0.0`). |
| `VITE_APP_ID` | Client app identifier. |

## Rotation rule

Any credential that has ever appeared in chat, a screenshot, a log, or a file
is burned: rotate it at the provider and set the new value only in the
deployment platform's secrets screen.
