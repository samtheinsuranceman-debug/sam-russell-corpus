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

## 1. Railway: let merges deploy themselves again (5 minutes, GitHub side)

Since 7 September GitHub has not been telling Railway about new merges
(the "GitHub Repo not found" panel you saw). I can force one build at a
time by re-attaching the repo (that is how #86 went green at 08:33 UTC),
but the automatic trigger is off until the Railway app on GitHub is given
the repository again. Railway's own troubleshooting page says the same:
https://docs.railway.com/deployments/github-autodeploys#cant-enable-autodeploy

1. Open https://github.com/settings/installations and sign in to GitHub as
   `samtheinsuranceman-debug`.
2. Find the row **Railway** → tap **Configure**.
3. If a yellow banner says the app has permission updates waiting, tap
   **Accept new permissions**.
4. Under **Repository access**, choose **Only select repositories** and make
   sure `sam-russell-corpus` is in the list (tap **Select repositories** to
   add it). Tap **Save**.
5. Open https://railway.com/project/a16ef4bb-3aea-4147-a751-20661ae76eb8 →
   tap the **web** card → **Settings** → the **Source** section. If it shows
   **Autodeploy: Disabled**, tap **Enable**. If it shows the repo with a
   red mark, tap **Disconnect**, then **Connect Repo** →
   `samtheinsuranceman-debug/sam-russell-corpus`, branch `master`.
6. Wait five minutes. Type to me "test the deploy" and I merge a one-line
   change and confirm it builds by itself.

Until you do this: after every merge I re-attach the repo to force the
build, or you can press **Cmd/Ctrl + K** on the Railway project page and
choose **Deploy Latest Commit**. The watch path stays as it is; do not
edit it.

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

## 7. The build is green. Three switches and one form (10 minutes)

The switches are variables with NO key: the VALUE is just a number I give
you. They turn on the readers that fill the pages with public data.

1. Open the Railway variables page:
   **https://railway.com/project/a16ef4bb-3aea-4147-a751-20661ae76eb8/service/e8d1eb7b-21e6-41ca-a567-aa2dc0e20f28/variables**
2. Tap **+ New Variable** → NAME `CAREER_DATA_DAYS` → VALUE `90` → **Add**.
   (Fills the doctor pages, the /for pages, with BLS pay by state and NCES
   tuition; re-reads quarterly.)
3. Tap **+ New Variable** → NAME `HAZARD_DATA_DAYS` → VALUE `180` → **Add**.
   (Reads FEMA's county hazard file so the Rental Enterprise can dock a zip
   for hurricane, flood, wildfire, hail and tornado risk; re-reads twice a year.)
4. Tap **Deploy** at the top. Wait three minutes for green.
5. Open https://web-production-4b215.up.railway.app/login and sign in.
6. Left menu → **Rental Properties** → **The Zip Engine** → tap **Read the
   files now**. It takes a few minutes. (The monthly automatic read is
   skipped on this box size on purpose; the button always works.)
7. Left menu → **Rental Properties** → **The Rental Enterprise**. Scroll to
   **8. The trust, and who draws it**. Add each attorney you vouch for:
   name, firm, city, two-letter state, credentials (for example "ACTEC
   Fellow"), website, phone, email. Only rows you add appear to clients;
   the page never invents a name. Find candidates at
   https://www.actec.org/find-a-lawyer/ (choose the state, tick the
   **Asset Protection** practice area).

## 8. Optional: let merges deploy themselves from GitHub

1. Open https://railway.com/account/tokens → **Create token** → name `github-deploy` → Copy.
2. Open https://github.com/samtheinsuranceman-debug/sam-russell-corpus/settings/secrets/actions → **New repository secret** → Name `RAILWAY_TOKEN` → Secret: paste → **Add secret**.

## 9. The engines still to build: which need a key from you (none), and which need a number typed once

Every engine below reads PUBLIC files that need no password. Nothing to
copy from any company's website. The one optional key that speeds up all
the FRED readers (inflation, Fed rate, money supply, Treasury yields):

- FRED (the St. Louis Fed's data service). Optional; without it the site
  reads the public CSV files instead, which works but is slower.
  Get it: https://fredaccount.stlouisfed.org/apikeys → sign in (free) →
  **Request API Key** → copy the 32-character string.
  Put it: Railway variables page → + New Variable → NAME `FRED_API_KEY` →
  VALUE paste → Add → Deploy.

| Engine | Where its numbers come from | Key? | What you do |
|---|---|---|---|
| Inheritance Engine | Your Fact Finder entries; CPI from FRED; the tax trajectory already on /portal/erosion | No | Nothing. When it is live, fill the new Inheritance section of your own Fact Finder so you can see it work. |
| Design documents (themes, five voices, integral line, reveal stack, HeyGen tiles) | The three documents you uploaded | No | Later: record the HeyGen clips per the shot list; I place them. |
| 40-year inflation panel, 12 sources | FRED CPI series, BLS CPI, Cleveland Fed expectations, Michigan survey, SPF, TIPS breakevens, CBO, Fed SEP, OECD, IMF WEO, World Bank, Treasury (all public pages) | No (FRED key optional) | Nothing. |
| Young-worker home-ownership odds | Census HVS, FHFA, Zillow, BLS wages, FRED mortgage rate | No | Nothing. |
| Credit availability vs the Fed | Fed SLOOS, Fed H.8, FEDFUNDS, NY Fed household credit | No | Nothing. |
| Money printing, debt-to-GDP, foreign Treasury holdings | FRED M2 and WALCL, Treasury FiscalData, TIC (treasury.gov), CBO | No | Nothing. |
| National car sales | BEA / FRED (TOTALSA), 36 years | No | Nothing. |
| Travel frequency | BTS T-100, NTTO, TSA throughput | No | Nothing. |
| Career Ledger pass 2 (malpractice, tuition by school) | AMA policy research, NPDB public use file, AAMC tuition tables, CODA, ABA 509 reports | No | Nothing. Practice-sale records come from your own closed deals: type them on the page when it exists. |
| Zip Engine passes 2–4 (property tax, HOA, flood/fire/hail, oil & gas, FIA/IUL by state, trusts by state) | Census ACS property tax, FEMA (already read), NOAA storm events, EIA, state statutes | No | HOA dues have no public source: clients type them. |
| Long-Term Care engine | Genworth/CareScout cost survey, state insurance department rate filings, each carrier's rider form | No | Nothing. |
| Income for Life + Longevity engine | SSA 2023 period life table (in the code), the cited studies, the carriers' published rate sheets you type in with URL and date | No | Add rate-sheet rows at `/portal/income-for-life` (owner button); tell me privately which carrier has the four-year exit so the row's "exit after" field is right. The page never prints the name. |
| Tax-Free Income for Life + Longevity | Carriers' published income rate sheets, SSA and SOA life tables, the Actuaries Longevity Illustrator, cited studies | No | Nothing. Later: tell me which carriers you place income plans with so I read their rate sheets first. |

## Not for you
Manus's DNS push, the code, the tests, the deploys, the docs. Those are mine.

## Key check: does each key actually work?
Open https://russellcapitalsystems.com/api/trpc/ultra.keyProbe in any browser.
The live server makes one read-only call per provider (Anthropic, OpenAI,
HeyGen, Resend, FRED) and prints a status word for each: `ok` means the
provider accepted the key, `rejected` means it refused it (wrong, revoked,
or pasted with a stray character), `missing` means no variable of that
name exists on the host. It never prints a key. Cached ten minutes.
