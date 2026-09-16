# The AI Whisperer — live sales-call coach

Shipped 2026-09-16 on master. Page: `/portal/whisperer` (advisor). Card on `/portal/advisor`.

## What it does on a call
- **Ears.** Zoom Realtime Media Streams (transcript, audio, video) when the Zoom app is configured; otherwise this browser's microphone with an "I'm talking / They're talking" switch, plus a typed note box.
- **Eyes.** One frame every 20 s of the shared Zoom window (or the RTMS video of the active speaker) goes to the vision model (Claude, else GPT-4o) and comes back as a body-language signal (posture, expression, attention, −1..+1). Audio energy becomes a tone signal with no model.
- **Memory.** Previous Whisperer calls (one-line summaries, objections raised, decision type), CALL/MEETING notes on the client, the client record's balances, and Zoom cloud recordings with transcripts for the client's name.
- **Coaching, every 5 s on the page.** Airtime last 3 min and the running monologue; **stop talking** (35 s / 60 s, or >70% airtime); **ask now** (silence after their statement); **acknowledge** (mood ≤ −0.3); **close now** (buying signal); decision type (driver / analytical / amiable / expressive) with evidence; five questions for this phase and this person, personalised with their figures; the five objections most likely in the next five minutes with likelihood, signals, handling, a talk track, strategies and calculator links.
- **Texts.** Armed / urgent cue (≤ 1 per minute) / every cycle the full coaching text / the five report links / call ended. To the number in settings, default +1 910 747 1781. Reply STOP honoured (existing SMS opt-out).
- **Every 5 minutes** (settings: 1–30): five objection reports, each ≥ 20 pages, titled by the objection: psychology, six-move framework, five talk tracks by decision type, the client on paper, baseline projection, the chain projection year by year, side-by-side and the cost of waiting two years, 10,000-simulation bands, one page per strategy (mechanism, why it answers, risk, source, "say this"), risks in dollars, disclosures, five questions and five closes, 16 references, assumptions, full tables, glossary. Stored in `whisperer_reports` under the client (advisor-only; the client portal never lists them). Opened from the page (session cookie) or from the text (signed 14-day link).
- **End call.** One-line memory saved on the session and as a CALL note on the client; it feeds the next call.

## Files
- `shared/whispererEngine.ts` — the deterministic coach (talk stats, decision type, phase, mood, cues, question bank, 15-objection library, SMS text, VTT parser, memory line). Tests: `server/whispererEngine.test.ts`.
- `server/whispererReports.ts` — pdfkit report builder (≥ 20 pages, ~0.5 s each). Test: `server/whispererReports.test.ts`.
- `server/whispererVision.ts` — frame → body-language signal; energy → tone.
- `server/zoom.ts` — S2S OAuth token, recordings + VTT transcript download, webhook validation/signature, RTMS signaling + media websocket client (`ws`).
- `server/whispererDb.ts` — `whisperer_settings`, `whisperer_sessions`, `whisperer_reports` (self-bootstrapping `CREATE TABLE IF NOT EXISTS`; also in `drizzle/schema.ts` and `database/rcs-schema.sql`).
- `server/whisperer.ts` — tRPC `whisperer.*` (status, saveSettings, clients, start, ingest, coach, runCycleNow, end, sessions, reports, zoomHistory, importZoomTranscript, testText), the 20-second scheduler, `POST /api/zoom/webhook` (registered before the JSON parser), `GET /api/whisperer/reports/:id.pdf`.
- `client/src/pages/portal/Whisperer.tsx` — the page.

## Host environment (Railway → Variables)
| Purpose | Variables |
|---|---|
| Texts | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (or `TWILIO_MESSAGING_SERVICE_SID`), or `SMS_WEBHOOK_URL` (+`SMS_WEBHOOK_TOKEN`) |
| Zoom API (recordings, transcripts) | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` (Server-to-Server OAuth app; scopes for cloud recordings, meetings, users, RTMS) |
| Zoom live stream | `ZOOM_WEBHOOK_SECRET_TOKEN`; event subscription URL `https://<host>/api/zoom/webhook`; events `meeting.rtms_started`, `meeting.rtms_stopped`; RTMS enabled on the app and turned on in the meeting |
| Body language | `ANTHROPIC_API_KEY` (set) or `OPENAI_API_KEY` (set) |
| Defaults | `WHISPERER_ADVISOR_PHONE` (default +19107471781), `WHISPERER_ADVISOR_NAME` (default `OWNER_NAME`), `WHISPERER_DISABLED=1` stops the scheduler |

Status of each is shown at the top of the page, with the exact variable names still missing.
