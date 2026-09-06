# AI platform roster + the automation layer (handoff for Grok)

What every connected platform is for, what the platform now automates on its
own, and what only the owner can switch on. Paths relative to
`russell-capital-systems/`. Keys live **only** in the host's environment panel.

## 1. The AI team the site can call at runtime (`server/ultraAI.ts`)

| Provider | Env key | Role |
|---|---|---|
| Claude | `ANTHROPIC_API_KEY` | lead model: synthesises the other voices, polishes journeys |
| ChatGPT | `OPENAI_API_KEY` | second opinion on every advisor answer |
| Grok | `XAI_API_KEY` | second opinion; also the builder this handoff is for |
| Gemini | `GEMINI_API_KEY` | second opinion |
| Perplexity | `PERPLEXITY_API_KEY` | web-grounded research voice |
| OpenRouter | `OPENROUTER_API_KEY` | gateway to models without their own key |
| Mistral · Groq · Cohere · DeepSeek · Together | `MISTRAL_API_KEY` … `TOGETHER_API_KEY` | additional voices, skip-if-absent |
| Manus / built-in gateway | `BUILT_IN_FORGE_API_KEY` | managed-host model + notifications + heartbeat cron |
| ElevenLabs | `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` | the tape recorder's cloned voice (`ultra.speak`) |

All are optional; the Financial Librarian answers from the assessment alone
with zero keys. Every provider is fanned out in parallel and the lead model
synthesises one voice.

## 2. Platforms connected to the build session (what they did / can do)

These are connected to the *builder's* chat, not to the website. They were
used this pass for research, verification and inventory. Nothing was written
to any of them.

| Platform | Status found | Use for this build |
|---|---|---|
| Perplexity (ask/research/reason) | live | current TCPA / 10DLC and Gmail-Yahoo sender rules — the compliance built into `sms.ts` / `mailer.ts` |
| OpenRouter | live | model catalogue + credit checks for the runtime gateway |
| ElevenLabs | live, 4 cloned voices on the account | the advisor's voice; agents/knowledge bases if a phone agent is wanted later |
| Speko (voice agents + phone) | live, **no phone numbers yet** | outbound/inbound voice agent for leads once a number is bought (KYB form) |
| Resend | live, **no verified domains** | transactional + marketing mail — unusable until `russellcapitalsystems.com` is verified there |
| Inkbox | email verified on `samrussell@inkboxmail.com`, iMessage on, **no SMS number** | can relay texts via `SMS_WEBHOOK_URL` once a number is assigned |
| Gmail · Google Calendar · Google Drive | live | owner's inbox/calendar; Calendly for booking links |
| Calendly | live | booking page for the "reply with a time" follow-ups |
| Neon · Supabase · Cloudflare · Netlify · Vercel | live | hosting/DB alternatives; the app targets MySQL/MariaDB today |
| GitHub | live | PRs to `master` (never force-push) |
| Jina · Exa · Firecrawl · Parallel | live | research base (arXiv/SSRN/web) for the reference essays |
| Era Context · PocketSmith | live | personal-finance aggregation APIs — candidate sources for the fact finder (see §6) |
| Notion · Linear · Asana · monday.com | live | project tracking if the owner wants the ledger mirrored |
| Canva · Figma · Adobe · HeyGen HyperFrames · 21st.dev | live | design and video assets |
| Ahrefs · Apollo.io · Webflow · GoDaddy | live | SEO, prospect enrichment, site builder, domains |
| Otter · Zoom · Wispr Flow · Superhuman | live | meeting transcripts → client notes |

## 3. What is now automated (this pass)

### Lead capture → follow-up sequence (`server/followups.ts`)
1. Visitor completes the homepage estimate with consent → lead saved.
2. Owner alert by email (`LEAD_NOTIFY_EMAIL`) **and by text** (`LEAD_NOTIFY_PHONE`).
3. Prospect gets the acknowledgement email at once, then the sequence:
   text +1 h · email day 1 · email day 3 · text day 5 · email day 7.
4. The sequence **stops** when the owner marks the lead contacted/qualified/
   client, messages the lead by hand from the inbox, or the person replies STOP /
   clicks unsubscribe.
5. Runs in-process every minute (`startFollowupScheduler`) and/or from an
   external cron: `POST /api/scheduled/followups` with `x-scheduler-token`.
   `FOLLOWUPS_DISABLED=1` turns it off.

No follow-up ever contains a figure. Content: `followupContent()`.

### Messaging from the website (`server/messaging.ts`, `messagesRouter.ts`)
- **Clients:** the client page has *Message this client* — email or text,
  six editable templates (check-in, finish your assessment, journey ready,
  report ready, meeting reminder, thank you), delivery log, activity entry.
- **Leads:** the Lead Inbox has *Reach out* (email/text) plus the live state
  of the automated sequence and every message sent.
- Every send → `outbound_messages` (status sent/failed/suppressed, via, reason).

### Deliverability (`server/_core/mailer.ts`, `scripts/check_mail_dns.mjs`)
- Marketing mail carries RFC 8058 one-click `List-Unsubscribe` headers, a
  signed unsubscribe link (`/api/mail/unsubscribe`), a plain-text part and a
  Reply-To; opted-out addresses are never sent marketing again.
- Transactional mail (reports, sign-in, acknowledgements) has none of that and
  is never suppressed.
- All older Resend-only templates in `server/email.ts` now fall through to
  SMTP automatically when Resend is not configured.
- `pnpm mail:check [domain]` resolves the **real** SPF / DKIM / DMARC records
  and says what to add. Run on 2026-09-06 for `russellcapitalsystems.com`:
  MX (Google) ✔, SPF ✔, DMARC `p=quarantine` ✔, **DKIM ✘ (no key published)**.
  With DMARC at quarantine and no DKIM, mail that fails SPF alignment is
  quarantined — that is the spam problem. Fix: publish the DKIM record from
  the sending provider (Resend → Domains → add `russellcapitalsystems.com`, or
  Google Workspace → Apps → Gmail → Authenticate email), then re-run the check.

### SMS (`server/_core/sms.ts`)
- Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` or
  `TWILIO_MESSAGING_SERVICE_SID`) **or** any relay via `SMS_WEBHOOK_URL`
  (+`SMS_WEBHOOK_TOKEN`), which POSTs `{to, body}` — Inkbox, Speko, Zapier.
- Inbound webhook `POST /api/sms/inbound` (Twilio form fields): STOP → opt-out,
  START → clear, HELP → contact line. Point the number's messaging webhook here.
- Compliance: E.164 normalisation, `Reply STOP to opt out` on marketing texts,
  opt-out table checked before every send, consent required (the lead form's
  consent checkbox is the record; `consentedAt`/`consentVersion` are stored).
  **10DLC:** before texting from a US long code the brand + campaign must be
  registered with the carrier registry (Twilio does this in-console).

### Market data (`server/_core/fred.ts`, `dataFeedService.ts`)
- With `FRED_API_KEY` (free, St. Louis Fed) the Treasury curve, CPI (annual,
  monthly, core), the 30-year mortgage rate and the Fed funds rate are live,
  dated, and cached in `market_data_points` so a restart never blanks them.
- The Market Data page shows a *Benchmark rates* strip; the snapshot exposes
  `benchmarks[]` and `dataFeeds.benchmarks` for any calculator to read.
- Without the key the previous managed-API path and dated reference values
  remain, labelled `static`. Nothing is ever invented.

## 4. Tables added (`drizzle/schema.ts`, `database/rcs-schema.sql`)

`sms_opt_outs`, `email_opt_outs`, `lead_followups`, `outbound_messages`,
`market_data_points`. All are `CREATE TABLE IF NOT EXISTS` in the schema SQL;
`pnpm db:build` adds them to an existing database.

## 5. Environment variables added

```
LEAD_NOTIFY_PHONE            text the owner on every new lead (E.164 or 10 digits)
TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM | TWILIO_MESSAGING_SERVICE_SID
SMS_WEBHOOK_URL [SMS_WEBHOOK_TOKEN]     alternative SMS relay
MAIL_FROM                    "Name <addr@domain>" on a domain that passes mail:check
MAIL_REPLY_TO                where replies go (defaults to the From address)
PUBLIC_BASE_URL              https://russellcapitalsystems.com (links in messages)
FOLLOWUPS_DISABLED=1         switch the sequence off
SCHEDULER_TOKEN              enables POST /api/scheduled/followups for external cron
FRED_API_KEY                 live benchmark rates
```

## 6. Next: super-accurate financial gathering

The assessment (`shared/clientFactFinder.ts`) is typed by hand. To make it
*gather* rather than *ask*:

1. **Account aggregation.** Era Context and PocketSmith are connected to the
   build session and both expose balances, transactions, recurring charges and
   cash-flow. A `factFinder.importFromAggregator` mutation would map: account
   balances → `investments.*`/`cash.*`, recurring mortgage payment + rate →
   `realEstate.*`, payroll deposits → `income.*`, recurring premiums →
   `insurance.*`. Keep the human in the loop: import fills *suggested* values
   the client confirms field by field (the UI already supports per-field edit).
2. **Documents.** Tax returns and statements uploaded to the Document Vault
   → the AI team extracts AGI, federal tax paid, filing status, W-2 wages
   (`taxes.*`) with the source page cited; the client confirms.
3. **Benchmarks.** Wherever a calculator defaults a rate (mortgage, inflation,
   Treasury), read `dataFeeds.benchmarks` first and show "as of" — see
   `MarketDataDashboard.tsx` for the pattern.
4. **Validation.** `factFinderCompleteness` gates the advisor; add
   cross-field checks (mortgage balance ≤ home value, take-home ≤ income,
   emergency months = savings ÷ fixed expenses) that flag, never auto-correct.

## 7. Owner switches (nothing here can be done from code)

- Publish DKIM for `russellcapitalsystems.com` (see §3) and re-run `pnpm mail:check`.
- Verify the domain in Resend **or** set `SMTP_*` for Google Workspace.
- Buy a number: Twilio (register 10DLC brand + campaign) or assign one in
  Inkbox/Speko and set `SMS_WEBHOOK_URL`. Point the inbound webhook at
  `/api/sms/inbound`.
- `FRED_API_KEY` from fred.stlouisfed.org (free).
- Set `PUBLIC_BASE_URL`, `MAIL_FROM`, `MAIL_REPLY_TO`, `LEAD_NOTIFY_PHONE`.
- Rotate the previously published credentials (still burned).
