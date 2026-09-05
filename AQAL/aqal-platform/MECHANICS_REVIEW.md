# Website Mechanics Review — front to back

A static + build-level audit of every route and its interactive elements. What
Claude could verify from the code/build is marked ✅; what needs a live browser
session with auth + DB (Manus) is marked 🔍. No dead handlers were found except
the intentional "Coming Soon" placeholders and the internal demo page.

## Verified in this environment
- ✅ **All 37 routes are defined and lazy-loaded** in `client/src/App.tsx`, each
  wrapped in a `PageErrorBoundary` + `Suspense`. Routes: `/ /about /admin
  /assessment /blind-side /calibration /challenge/:token /coaching /commitment
  /evidence /influencer /intelligence-profile /leaderboard /login /membership
  /mensa /nlp-report /payment-cancel /payment-success /platinum /portal /pricing
  /pricing-structure /privacy /profile /research-library /results /science
  /signin /synergy-report /terms /ui-preview /verification /video-assessment
  /weakness-finder`.
- ✅ **Type-check passes** (`tsc --noEmit`, 0 errors).
- ✅ **Production build succeeds**; every page emits its own chunk (incl.
  `Commitment`, `CommitmentPanel`, `Portal`, `Results`).
- ✅ **175/175 unit/integration tests pass**, including `landing.test.ts` (live
  HTTP) when the dev server is up.
- ✅ **No dead click handlers** (`onClick={()=>{}}` / `href="#"`) except in
  `ComponentShowcase.tsx` (internal `/ui-preview` demo, not user-facing).
- ✅ **Internal links resolve** to defined routes (`/manus-storage/*` are static
  PDF assets served by the host).

## Needs a live click-through (Manus — auth + DB + keys required)
These render and compile; they can't be exercised without a logged-in user,
a database, and provider keys:
- 🔍 **Assessment flow** (`/assessment`): mic record → transcript → submit →
  analyze → results. Needs mic + STT + LLM keys. (Voice path verified to compile;
  browser SpeechRecognition + `commitment.transcribe` fallback exist.)
- 🔍 **Commitment flow** (`/commitment`, Portal tab): speak answers → sign →
  download → reminders → write-new-letter/supersede → archive. Needs auth + DB.
- 🔍 **Results / Outcome report** (`/results`): The Vision, The Gap, projections,
  30-day tracker download, testimonial capture. Report generation needs an LLM key
  (deterministic parts work without).
- 🔍 **Portal tabs** (`/portal`): Overview, Profile, Commitment, Network, Library,
  Tools, Settings — all render; data depends on a completed assessment.
- 🔍 **Payments** (`/pricing`, `/membership`): Stripe checkout → success/cancel.
  Needs Stripe keys.
- 🔍 **Free access / beta** (`#claim` on Home, `/login`): email + `Welcome1`
  passcode → account + email. Needs DB (+ RESEND_API_KEY to actually send).
- 🔍 **Admin** (`/admin`): Business Health, panel health, evidence review. Admin
  role + DB.

## Known intentional placeholders to wire (small)
- Portal → Tools: **"Profile Export (PDF)"**, **"Community Forum"**, **"Reflection
  Journal"** show a "Coming Soon" toast (`Portal.tsx` ~590–632). Wire or hide.
- **`/platinum`** (`PlatinumPreview.tsx`) is a "Coming Soon" teaser by design.
- `VideoAssessment.tsx` and several `toast.info(...)` calls are status messages,
  not dead buttons — leave as-is.

## Recommended live QA order for Manus
1. Free-access claim on Home `#claim` (DB + email).
2. Assessment end-to-end in Chrome (mic → report).
3. Commitment: speak → sign → download → new letter supersedes → archive (DB).
4. Reminders: opt into text, confirm the 8 PM-local hourly cron fires (see
   HANDOFF items 6–8) and STOP works.
5. Stripe checkout → success/cancel.
6. Admin panel health shows each funded AI green.
