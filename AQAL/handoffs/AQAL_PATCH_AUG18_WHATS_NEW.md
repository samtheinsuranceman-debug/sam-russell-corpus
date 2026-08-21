# WHAT'S NEW — AUG 18F delta (since the AUG17 bundle)

Eleven commits, 49 files. Feature-by-feature, with the files each one touches.

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

## 11. The unconstrained-roadmap five (AUG 18B additions)

- **Pre-Mortem Engine** — on every goal card: "It's six months from now and
  this goal is dead. What killed it?" Up to three named causes, each with the
  earliest warning sign and the prevention move — written BEFORE they happen,
  in the member's own words. No probabilities, no scores.
  **MOD** `client/src/pages/Goals.tsx`, `server/goals.ts`, `server/routers.ts`,
  `drizzle/schema.ts` (goals.premortem column)
- **The Corrections Ledger** — `/corrections`, public and append-only: every
  claim we corrected (7,000 → 6,500+), every open challenge (the DOI audit),
  every challenge sustained. Linked from the footer under Trust & Security.
  **NEW** `client/src/pages/Corrections.tsx`
- **Zero-trace audio retention** — raw assessment voice recordings are
  permanently purged from storage 72 hours after scoring completes (the
  transcript — the scored record — stays, and says so in Terms and Help).
  Opportunistic self-throttled sweep, no cron needed.
  **NEW** `server/audioRetention.ts`; **MOD** `server/routers.ts`,
  `client/src/pages/Terms.tsx`, `client/src/pages/Help.tsx`
- **The Owner's Runbook** — `/runbook`: Sam's one-page, no-jargon operations
  manual. Nine plays (voice broken, emails missing, panel down, site down,
  deploys, spend alarm, crisis flags, key rotation, backups) each ending in
  "point at Claude" or "point at Manus." **NEW** `client/src/pages/Runbook.tsx`
- **Mobile funnel audit** — 13 public pages driven at iPhone size (390×844):
  zero horizontal overflow everywhere; fixed 17 invalid nested `<a>` elements
  (wouter 3 Links wrapping raw anchors) across 13 pages — these were producing
  React hydration warnings on most page loads.
  **MOD** small `<Link>` fixes in 13 page files

## 12. Hover-to-learn encyclopedia (AUG 18C addition)

- On desktop, RESTING THE MOUSE on any point of the hero ring or the big
  32-line dial now opens the full encyclopedia popup by itself (350ms hover
  intent; touch devices keep the tap-then-tap flow unchanged).
- Every one of the 32 entries gained two new sections: an honest
  "~N in 1,000 adults have ever been formally tested on this line" odds meter
  (labeled as our estimate, with a visual bar), and a "What a measurement
  buys you" benefit paragraph.
- The popup now states the g relationship in plain English: "Part of general
  intelligence — IQ tests DO measure this line" / "Partially overlaps g" /
  "NOT part of general intelligence — an IQ test cannot see this line at all."
- Fixed a reopen loop: closing the popup while the mouse still rests on a
  point no longer re-triggers it instantly.
- **MOD** `client/src/lib/lineEncyclopedia.ts`,
  `client/src/components/LineInfoModal.tsx`, `client/src/pages/Home.tsx`

## 13. The SEO, security & performance layer (AUG 18D addition)

Sam's website checklist (technical SEO, on-page SEO, images, speed, security,
privacy), implemented directly in code — no CMS or plugins involved:

- **`shared/seo.ts`** — unique SEO title + meta description for all 29 public
  pages; noindex list for member/admin surfaces. One table drives everything.
- **NEW `client/src/components/RouteMeta.tsx`** — on every navigation sets the
  page title, meta description, per-route canonical URL, og: tags, and
  noindex where appropriate; injects FAQPage JSON-LD on /help.
- **`client/index.html`** — Organization + WebSite JSON-LD structured data.
- **Server** — `/robots.txt` and `/sitemap.xml` generated from the same table;
  HTTPS + canonical-host 301 redirects (set `CANONICAL_HOST=joinaqal.com`);
  security headers on every response (HSTS, nosniff, X-Frame-Options,
  Referrer-Policy, Permissions-Policy).
- **Caching** — hashed `/assets` files: 1-year immutable cache; index.html:
  no-cache so deploys are picked up instantly.
- **Core Web Vitals** — first-party LCP/CLS/INP/TTFB beacon → `/api/vitals`
  → analytics. Page speed is monitored from real users, no Google Analytics,
  no cookie banner needed.
- **Support form** — honeypot field; bots get a fake success and no email.
- **Images** — founder photo compressed 2.0MB → 103KB with lazy loading;
  `og-cover.png` (1200×630) actually created — the old build referenced a
  PNG that didn't exist, so link previews on social/messaging were broken.
- **Audits passed** — exactly one H1 per public page; zero broken internal
  links; clean descriptive URLs already in place.

## 14. The 32 line landing pages (AUG 18E addition)

Every intelligence line now has its own real page at /line/<slug> — no popup
to block, a shareable URL, and a Google-indexable landing page per line:

- Full breakdown per line: the hook, what it actually is, the
  "~N in 1,000 ever tested" odds meter, the plain-English g verdict,
  "if you measure it" (outcomes), "if it's weak and invisible" (the honest
  threat), keystone practice + member-library protocols, and 3 landmark
  peer-reviewed studies each (96 citations, flagged pending the audit).
- Reachable from everywhere: second click/tap on any hero-ring or dial point
  navigates there; the hover popup and the /lines glossary link there too.
- Video slots: `client/src/lib/lineVideos.ts` is Sam's config file — paste a
  YouTube/Vimeo/mp4 URL per line and it renders on that page; `HOME_VIDEO`
  adds a film to the homepage. Empty = elegant "in production" frame on line
  pages, nothing on the homepage.
- SEO: all 32 pages carry unique titles/descriptions and sit in the sitemap
  (61 URLs total).
- **NEW** `client/src/pages/LineDetail.tsx`, `client/src/lib/lineDeepDives.ts`,
  `client/src/lib/lineVideos.ts`; **MOD** `Home.tsx`, `Lines.tsx`,
  `LineInfoModal.tsx`, `RouteMeta.tsx`, `App.tsx`, `shared/seo.ts`

## 15. The Protocol Library — 92 public pages (AUG 18F addition)

Every distinct citation-backed therapy in the mapped library now has its own
indexable landing page at /protocol/<slug>, plus a /protocols index (grouped
by kind, footer-linked). Each page carries: which intelligence lines it
builds (PRIMARY/SECONDARY/ADJUNCT with the exact capacity), literature-
typical dose & frequency, honest intensity, honest durability, "Direction
One" (how it compounds WITH an individual strength and the strength
cluster), "Direction Two" (how it operates AGAINST the weakness cluster and
the dominant governing weakness — fragility reduction), the peer-reviewed
citations with DOIs, and an explicit "our estimate — not a guarantee" block
with a medical-advice disclaimer. Line pages and the /lines glossary now
link into the protocol pages and back — a full internal-linking web.
Sitemap: 154 URLs.

- **NEW** `client/src/pages/TherapyDetail.tsx`, `client/src/pages/Protocols.tsx`,
  `client/src/lib/therapyKinds.ts`
- **MOD** `shared/seo.ts`, `RouteMeta.tsx`, `LineDetail.tsx`, `Lines.tsx`,
  `PublicLayout.tsx`, `App.tsx`

---

**Verified before cutting this patch:** `pnpm check` clean, `pnpm build` green, 270/270 tests passing (including
live-server tests against a running dev instance), homepage dial + hero popup
browser-tested (desktop + touch), and the 13-page mobile viewport sweep passing
with zero layout overflow and zero DOM-validity warnings; hover-popup flow browser-verified 10/10 (hero + dial, content, close-stays-closed).
