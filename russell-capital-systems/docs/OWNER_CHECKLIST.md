# Sam's checklist — everything only you can do, in one place

Updated 7 September 2026. Do them in this order. Each one is a few minutes.
Nothing here needs a session search; every link and every name is on this page.

## 1. Railway — one setting, then one button (5 minutes)

Why: every merge since 02:39 UTC on 7 September has been ignored by Railway,
so the live app is stale. The cause is a watch-path with a leading slash.

1. Open https://railway.com/project/a16ef4bb-3aea-4147-a751-20661ae76eb8/service/e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28/settings
2. Scroll to **Build** → **Watch Paths**. Replace `/russell-capital-systems/**` with `russell-capital-systems/**` (no leading slash). Save.
3. Top right → **Deploy** (Apply changes). Wait about four minutes; a green build follows.

Or type to me: "change the watch path" and I do it.

## 2. Railway — three variables (5 minutes)

Same project → service `web` → **Variables** tab:
https://railway.com/project/a16ef4bb-3aea-4147-a751-20661ae76eb8/service/e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28/variables

Click **+ New Variable**. The NAME goes in the left box, exactly as printed:
capitals, digits, underscores only, never a dot, slash or website address.
The VALUE goes in the right box. After all three, press **Deploy**.

| NAME | VALUE | Where the value comes from |
|---|---|---|
| `RESEND_API_KEY` | the key, starts `re_` | https://resend.com/api-keys → Create API Key → Sending access → domain russellcapitalsystems.com |
| `ANTHROPIC_API_KEY` | a NEW key, starts `sk-ant-` | https://console.anthropic.com/settings/keys → Russell Capital Systems workspace → Create Key. Then delete the old key there; it appeared in a screenshot. |
| `SCHEDULER_TOKEN` | any long random string, 40+ characters | Make it up (or a password generator). It appeared in a screenshot, so it must change. |

Optional, when you want the founder voice and the advisor to speak:

| NAME | Where |
|---|---|
| `ELEVENLABS_API_KEY` | https://elevenlabs.io/app/settings/api-keys |
| `ELEVENLABS_VOICE_ID` | https://elevenlabs.io/app/voice-lab → your cloned voice → Copy Voice ID |

Never delete `PUBLIC_BASE_URL`, `VITE_APP_ID`, `DATABASE_URL`, `JWT_SECRET`,
`CALENDLY_URL`, `ZIP_DATA_DAYS` or anything starting `RAILWAY_`.

## 3. Gmail — turn off the auto-reply (1 minute)

Your account has been replying to every incoming email with your full
credibility document since Saturday night. Phone: Gmail app → menu → Settings
→ your account → **Vacation responder** → off. Computer: gear → See all
settings → General → bottom → Vacation responder off → Save. Do it for both
addresses if they are separate accounts.

## 4. Gmail — the keys sitting in email (5 minutes)

- Delete the thread titled with a key emoji (30 August, forwarded again 7 September). It holds your xAI and OpenAI keys in plain text.
- Delete the thread titled "Railway" (7 September). It holds a token.
- Empty Trash.
- Rotate those keys at their consoles: https://console.x.ai (API Keys) and https://platform.openai.com/api-keys. Put the new values in Railway as `XAI_API_KEY` and `OPENAI_API_KEY` if you want those voices on the council; otherwise just delete the old keys.

## 5. Two clients who got the auto-reply (2 minutes)

Killian Fultang (Roth call, Monday 7 September 11:00) and Bob Kehler
(Thursday 10 September 12:00) booked through Calendly and received the
credibility document as an automatic reply. A one-line personal note fixes it.

## 6. Google Search Console

- russellcapitalsystems.com: verified. If the Sitemaps page shows no rows, paste `https://russellcapitalsystems.com/sitemap.xml` and Submit.
- drasswealthmanagement.com: done.
- joinaqal.com: waiting on Manus to publish the corrected TXT record. Leave the Manus DNS table alone; I check it and tell you when to press Verify. Fallback: the CNAME method, five minutes, when I say.

## 7. After the Railway build is green (2 minutes)

Sign in → **Rental Properties** → **The Zip Engine** → **Read the files now**.
It reads FHFA, Zillow and Freddie Mac (a few minutes) and the Zip Engine and
Short-Term Rentals pages come alive. It repeats itself monthly after that.

## Not for you

Manus's DNS push, the code, the tests, the deploys, the docs. Those are mine.
