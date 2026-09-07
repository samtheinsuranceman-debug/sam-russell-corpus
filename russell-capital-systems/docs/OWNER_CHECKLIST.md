# Sam's checklist — every step, every link, every word to type

Updated 7 September 2026. Read the two definitions, then do the sections in order.

**What an API key is.** A company (Anthropic, Resend, ElevenLabs) gives you a
long password so our website can use their service. You copy it from THEIR
website and paste it into RAILWAY. That is the whole job: copy from them,
paste into Railway.

**What Railway is.** The computer that runs the website. Its Variables page
is a list of labelled boxes. Each box has a NAME (left) and a VALUE (right).
The NAME is a fixed word I give you, typed exactly. The VALUE is the key you
copied. Never paste a key anywhere else: not in chat, not in a file, not in
email.

## 1. Railway: remove one slash so the site can deploy again (5 minutes)

1. Open https://railway.com/project/a16ef4bb-3aea-4147-a751-20661ae76eb8
2. Tap the card that says **web** (GitHub logo, `web-production-4b215.up.railway.app`). Not MySQL. Not Project Settings.
3. In the panel that opens, tap the **Settings** tab.
4. Scroll to the section titled **Build**. Find the field **Watch Paths**. It says `/russell-capital-systems/**`.
5. Delete the very first character, the `/`. It must now say exactly: `russell-capital-systems/**`
6. Tap outside the field so it saves.
7. Scroll to the top of the panel. Tap **Deploy** (it may say "Apply changes").
8. Wait four minutes. The web card turns green with a new time stamp.

Or type to me "change the watch path" and I do steps 4 to 7.

## 2. Railway: three keys (15 minutes)

The Railway page where every key goes:
**https://railway.com/project/a16ef4bb-3aea-4147-a751-20661ae76eb8/service/e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28/variables**

How to add one variable on that page:
1. Tap **+ New Variable**.
2. Left box: type the NAME exactly as printed below. Capitals, underscores, nothing else.
3. Right box: paste the VALUE you copied.
4. Tap **Add**.
After the last one, tap **Deploy** at the top.

### 2a. Anthropic (Claude). This is the advisor's brain.
Get it:
1. Open https://console.anthropic.com/settings/keys and sign in.
2. Tap **Create Key**. Name: `rcs-production`. Tap **Create**.
3. Tap **Copy**. It starts with `sk-ant-`. It is shown once.
Put it:
4. Railway variables page → + New Variable → NAME `ANTHROPIC_API_KEY` → VALUE paste → Add.
Then kill the old one:
5. Back on https://console.anthropic.com/settings/keys, the older key (the one that appeared in a screenshot) → the three dots at the end of its row → **Delete**.

### 2b. Resend. This is email: lead alerts, the answer PDFs, password resets.
Get it:
1. Open https://resend.com/api-keys and sign in.
2. Tap **Create API Key**. Name: `rcs`. Permission: **Sending access**. Domain: **russellcapitalsystems.com**. Tap **Add**.
3. Tap **Copy**. It starts with `re_`.
Put it:
4. Railway variables page → + New Variable → NAME `RESEND_API_KEY` → VALUE paste → Add.

### 2c. Scheduler token. Nobody gives you this one; you make it up.
1. Type 40 random letters and digits yourself, or use your password manager's generator. Do not use a word.
2. Railway variables page → the existing row named `SCHEDULER_TOKEN` → tap it → replace the VALUE with your new string → save.

### 2d. Optional: ElevenLabs, so the advisor and the homepage speak in your voice.
1. Open https://elevenlabs.io/app/settings/api-keys → **Create API Key** → Copy.
2. Railway → + New Variable → NAME `ELEVENLABS_API_KEY` → VALUE paste → Add.
3. Open https://elevenlabs.io/app/voice-lab → your cloned voice → the three dots → **Copy Voice ID**.
4. Railway → + New Variable → NAME `ELEVENLABS_VOICE_ID` → VALUE paste → Add.

Never delete these rows on Railway: `PUBLIC_BASE_URL`, `VITE_APP_ID`,
`DATABASE_URL`, `JWT_SECRET`, `CALENDLY_URL`, `ZIP_DATA_DAYS`, `MYSQL_DATABASE`,
`NODE_ENV`, `OWNER_EMAIL`, `OWNER_NAME`, `MAIL_FROM`, `MAIL_REPLY_TO`,
`LEAD_NOTIFY_EMAIL`, and anything starting `RAILWAY_`.

## 3. Gmail: turn off the auto-reply (2 minutes, both addresses)

It has been sending your credibility document to every incoming email since Saturday.

Phone: Gmail app → the three lines top left → scroll to **Settings** → tap
the address → scroll to **Vacation responder** → switch it **off** → Done.

Computer: open https://mail.google.com/mail/u/0/#settings/general → scroll
to the very bottom → **Vacation responder off** → **Save Changes**.
Then https://mail.google.com/mail/u/1/#settings/general for the second address.

## 4. Gmail: the keys sitting in email (10 minutes)

1. In Gmail search, type `Railway` → open the thread from 7 September titled "Railway" → delete it.
2. Search for the thread from 30 August whose subject is a key emoji (forwarded again 7 September) → delete it.
3. Open **Trash** → **Empty Trash now**.
4. Those keys are burned. Make new ones:
   - xAI: https://console.x.ai → API Keys → delete the old key → Create key → copy → Railway + New Variable → NAME `XAI_API_KEY` → paste → Add. (Optional: only if you want Grok on the council.)
   - OpenAI: https://platform.openai.com/api-keys → the old key → Revoke → Create new secret key → copy → Railway + New Variable → NAME `OPENAI_API_KEY` → paste → Add. (Optional.)

## 5. Two clients who got the auto-reply (2 minutes)

Killian Fultang (Roth call, Monday 7 September 11:00) and Bob Kehler
(Thursday 10 September 12:00). One line each: "That automatic reply was a
mistake; looking forward to our call."

## 6. Google Search Console for joinaqal.com (5 minutes, no DNS)

Manus never published the DNS record, so use the tag method instead.
1. Open https://search.google.com/search-console → **Add property**.
2. Pick the **URL prefix** box on the right. Type `https://joinaqal.com/` → **Continue**.
3. Under "Other verification methods" tap **HTML tag**. Tap **Copy**.
4. Open Manus, open the joinaqal project, and type: "Add this exact meta tag inside the head of every page and publish." Paste the tag. Wait for it to say published.
5. Back in Search Console tap **Verify**.
6. Left menu → **Sitemaps** → type `https://joinaqal.com/sitemap.xml` → **Submit**.

russellcapitalsystems.com and drasswealthmanagement.com are already done.

## 7. After the Railway build is green (3 minutes)

1. Open https://web-production-4b215.up.railway.app/login and sign in.
2. Left menu → **Rental Properties** → **The Zip Engine** → tap **Read the files now**. It takes a few minutes and repeats monthly by itself.
3. Railway variables page → + New Variable → NAME `CAREER_DATA_DAYS` → VALUE `90` → Add → Deploy. This fills the new doctor pages (the /for pages) with BLS pay and NCES tuition and re-reads them quarterly.

## 8. Optional: let merges deploy themselves from GitHub

1. Open https://railway.com/account/tokens → **Create token** → name `github-deploy` → Copy.
2. Open https://github.com/samtheinsuranceman-debug/sam-russell-corpus/settings/secrets/actions → **New repository secret** → Name `RAILWAY_TOKEN` → Secret: paste → **Add secret**.

## Not for you
Manus's DNS push, the code, the tests, the deploys, the docs. Those are mine.
