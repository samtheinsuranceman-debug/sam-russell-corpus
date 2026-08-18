# WHAT'S NEW — AUG 18 delta (since the AUG17 bundle)

Six commits, 29 files. Feature-by-feature, with the files each one touches.

---

## 1. The Line Encyclopedia popup (both dials)

Tap ANY of the 32 points — on the hero medallion ring at the top of the
homepage, or on the big interactive dial further down — and a popup opens with:
the line's plain-English definition, 2–3 named researchers behind it, how
measurable it is, its correlation to g (color-banded), and an honest "have you
ever been tested for this?" note. Every list row also has an ⓘ button.

- **NEW** `client/src/lib/lineEncyclopedia.ts` — all 32 entries
- **NEW** `client/src/components/LineInfoModal.tsx` — the popup
- **MOD** `client/src/pages/Home.tsx` — wired into hero ring + dial
  (tap once to select, tap again to learn it; keyboard + touch accessible)

## 2. The Black Box — crash forensics module

Members record their major crashes/failures ("where you failed when you
thought you had everything under control"). The panel extracts an 8-layer
forensic analysis, and after 2+ coaching-scoped events builds a **Crash
Signature** ("When X, I do Y, which causes Z") plus a prevention architecture
(leading indicators, triggers, stop rules, replacement behavior,
accountability, recovery) and a cascade diagram. Contract: crashes ANNOTATE
the profile, never penalize it. Private-scoped entries are excluded from
coaching entirely.

- **NEW** `server/blackBox.ts` — extraction + signature engine
- **NEW** `client/src/pages/BlackBox.tsx` — the /black-box page
- **MOD** `server/routers.ts` — blackBox router (list/add/remove/extract/
  buildSignature/getSignature)
- **MOD** `drizzle/schema.ts` — `crash_events`, `crash_signatures` tables

## 3. The Final Three (assessment completion bridge)

After question 27, the completion screen now offers three OPTIONAL crash
prompts: "The one you never saw coming," "The one that cost the most," "The
near-miss you caught." Zero-pressure framing — "Your spot is already earned;
the 27 did that" — but explains this may be the most valuable information in
their entire file. 200-character minimum per story, skip any or all, crisis
support modal wired into that screen.

- **MOD** `client/src/pages/Assessment.tsx`

## 4. Support box → straight to Sam

Floating "? Support" button on every public page (bottom-left). Opens a box;
the message forwards directly to sam@russellcapitalsystems.com (rate-limited
3/hour/IP, HTML-escaped). Logged-out users can leave a reply-to email.

- **NEW** `client/src/components/SupportWidget.tsx`
- **MOD** `client/src/components/PublicLayout.tsx` — mounted in footer
- **MOD** `server/routers.ts` — support.send

## 5. Password reset + email verification

Full self-serve flow: request reset (no account enumeration, SHA-256 token,
1-hour expiry), reset page, email verification links on claim, resend
verification, unverified-email banner in the portal.

- **NEW** `client/src/pages/ResetPassword.tsx`, `client/src/pages/VerifyEmail.tsx`
- **MOD** `client/src/pages/Login.tsx`, `client/src/pages/Portal.tsx`,
  `server/routers.ts`, `drizzle/schema.ts` (4 new users columns),
  `server/platform/email.ts` (Resend integration; mock-logs without key)

## 6. The launch experience (Results page)

- **Panel Deliberation** — real 8-lab roster waiting screen while scores compute
- **Reveal Overlay** — 4-step staged unveiling of the report (once per report)
- **First Week Plan** — 7 personalized day-cards after the reveal
- **G-Free Profile** — panel of the independence-flagged lines
- **Stability Check** — client-side triage
- **Share Card** — canvas PNG with the member's founding number
- **Swap Suggestion** — 2 low ratings on a protocol → alternatives offered
- **Crash Concordance** — on the Master Weakness card, the member's own Crash
  Signature is quoted and asked: does it agree?
- Frozen-snapshot stamp on print; norming-version chip in the header
- **MOD** `client/src/pages/Results.tsx` (all of the above)

## 7. Founding numbers + sample report + help

- `myFoundingNumber` (rank among beta claims) shown in portal + share card
- **NEW** `client/src/pages/SampleReport.tsx` — fictional "Jordan, 41" full
  report so visitors see the deliverable before claiming (sticky ember banner
  marks it fictional)
- **NEW** `client/src/pages/Help.tsx` — 6-item FAQ
- **MOD** `client/src/pages/WhichArchetype.tsx` (minor), `client/src/App.tsx`
  (all new routes, lazy + error-boundaried)

## 8. Cost monitor + client-error intake

- Every panel/LLM call records token usage and estimated $ into analytics;
  `LLM_DAILY_BUDGET_USD` env var arms a once-daily overspend email to Sam;
  `admin.costSummary` + a budget-guard row on /launch-check
- Browser errors POST to `/api/client-error` (capped 5/page, 10/hr/IP) so
  real-user breakage is visible without any third-party tracker
- **NEW** `server/costMonitor.ts`
- **MOD** `server/platform/panel.ts`, `server/platform/llm.ts`,
  `server/_core/index.ts`, `client/src/App.tsx`

## 9. Honesty + trust passes

- Claims audit: "7,000 prescriptions" corrected to "6,500+" (counted: 6,521
  clusters, 12,341 source links — "10,000+ sources" stands)
- **PanelTrust** strip (the real 8-lab roster) on Pricing + Sample Report —
  **NEW** `client/src/components/PanelTrust.tsx`, **MOD**
  `client/src/pages/Pricing.tsx`
- Terms **8B**: Black Box privacy — deterministic safety scanner disclosed,
  never runs on DMs or marketing; crashes annotate, never penalize.
  Terms **8C**: "Free for life, in writing" for founding members + self-serve
  export + 30-day deletion rights — **MOD** `client/src/pages/Terms.tsx`
- **Data Sovereignty** section in Profile: one-click full JSON export of
  everything we hold, and a deletion request flow — **MOD**
  `client/src/pages/Profile.tsx`, `server/routers.ts` (account.exportData /
  requestDeletion)

## 10. Goals page upgrades

Quick-log hour chips (5/10/20/40h), limiting-belief warnings surfaced against
the active goal, achievement toast + testimonial-capture moment on completion.

- **MOD** `client/src/pages/Goals.tsx`

---

**Verified before cutting this patch:** `pnpm check` clean, `pnpm build`
green, 270/270 tests passing, homepage dial + hero popup browser-tested
(desktop + touch).
