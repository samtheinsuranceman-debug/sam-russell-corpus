# WHAT'S NEW — AUG 18P delta (since the AUG17 bundle)

Twenty-one commits, 79 files. Feature-by-feature, with the files each one touches.

---

## 00000. NEW IN 18P — WCAG AA accessibility, zero vulnerabilities, link audit

Accessibility: an axe-core WCAG 2.0 A/AA scan across every page family
now reports ZERO violations. Fixed: pinch-zoom re-enabled (viewport tag
no longer caps scale), footer muted-text contrast raised past 4.5:1,
the HARMFUL verdict red brightened to 6.2:1, both interactive dials
given role=group (their focusable points were illegal under role=img),
inline body-text links underlined (WCAG 1.4.1), and a skip-to-content
link added to the header on every public page.

Security: pnpm audit had 9 known vulnerabilities including a HIGH
drizzle-orm SQL-injection advisory. drizzle-orm upgraded 0.44.7 ->
0.45.2; mermaid, dompurify, and body-parser forced to patched versions
via pnpm overrides. Audit now: ZERO known vulnerabilities. THIS IS WHY
pnpm install IS MANDATORY FOR THIS PATCH.

Link integrity: 573 distinct internal links harvested from 33 rendered
pages across every family, verified against the sitemap and route
resolvers — zero broken links.

- MOD package.json, pnpm-lock.yaml (dependency security)
- MOD client/index.html (viewport), client/src/index.css (link
  underlines), components/PublicLayout.tsx (contrast + skip link),
  pages/Home.tsx (dial roles), lib/mythMuseum.ts (HARMFUL color)

---

## 0000. NEW IN 18O — the magnetism pass + the video system

Every description on the site — all 34 static page shorts (homepage
included) and all 14 dynamic family formulas covering 2,466 pages — was
rewritten for maximum pull, each still unique and under 60 characters
(build-enforced). Sample: the homepage now reads "IQ graded 4 lines of
you. We measure all 32."

NEW site-wide video system: client/src/lib/pageVideos.ts maps ANY page
path to a video URL (YouTube/Vimeo/direct file). The PageVideo component
is mounted on the protocol, myth, capacity, kind, wing, and verdict
families — a configured page renders a lazy 16:9 player, an unconfigured
one shows the slim "film briefing - in production" strip. Adding a video
is a one-line config edit + redeploy.

SEO checklist re-applied to all new families: BreadcrumbList JSON-LD on
every deep-page family (14 path prefixes), assessment CTAs on the
kind/wing/verdict pages, The Hidden Axes in the Explore menu.

- NEW client/src/lib/pageVideos.ts, components/PageVideo.tsx
- MOD shared/seo.ts (all static shorts), lib/pageShorts.ts (all
  formulas), components/RouteMeta.tsx (breadcrumbs),
  components/PublicLayout.tsx (menu), six detail pages (video slots,
  CTAs)

---

## 000. NEW IN 18N — the remaining library pieces: 36 pages in 4 families

Every held data structure that lacked its own URL now has one:

- **/capacity/:slug (8)** — the engine capacities with no /line/ display
  page (Adaptive, Architectural, Integrative, Intuitive, Philosophical,
  Reflective, Resilient, Tactical). Each page: the framework definition
  (explicitly labeled as our framework), why standardized testing
  structurally misses the capacity, strength and weakness portraits, and
  the cited protocols that build it, linking into /build and /protocol.
- **/kind/:id (11)** — one page per protocol kind (psychotherapy,
  relational, mindfulness, somatic, physical, skill, psychedelic,
  neuromodulation, lifestyle, expressive, community): dose, honest
  demands, honest durability, every member protocol.
- **/wing/:id (12)** — one page per Myth Museum wing with the family's
  full anatomy and every exhibit in the wing.
- **/verdict/:slug (5)** — one page per museum verdict (debunked,
  no-evidence, harmful, replication-failed, overclaimed): the evidential
  standard each applies, what meeting one means, and every exhibit that
  earned it.

All four wired into RouteMeta, pageShorts, sitemap, and the
Protocols/Myths index pages; shared-mirror drift is test-enforced. Also
fixes the stale "92 protocols" static meta (the library is 156).
Sitemap: 2,430 → 2,466.

- **NEW** `client/src/lib/capacityAxes.ts`, `pages/CapacityDetail.tsx`,
  `pages/KindDetail.tsx`, `pages/WingDetail.tsx`, `pages/VerdictDetail.tsx`
- **MOD** `shared/seo.ts`, `App.tsx`, `RouteMeta.tsx`, `pageShorts.ts`,
  `Protocols.tsx`, `Myths.tsx`, tests

---

## 00. NEW IN 18M — Myth Museum wave 2: 72 → 191 exhibits + wing anatomy

119 new documented failed, debunked, and overclaimed therapies join the
museum — historical medical overreach (bloodletting, radium tonics),
miracle-cure quackery (laetrile, Gerson, black salve), substitution harms
(alternative-only cancer care, coercive teen programs), devices and
frequencies (Rife machines, ionic foot baths, Power Balance), failed
supplements (Airborne, Prevagen, ginkgo), diet cults (blood-type,
carnivore-cure), pseudo-diagnostics (live blood analysis, IgG panels),
learning products (Doman-Delacato, Baby-Genius DVDs), the replication
graveyard (priming, the marshmallow test, the pencil smile), unlicensed
therapy cousins (tapping, Havening, family constellations), and
divination-as-counseling (biorhythms, indigo children). Every exhibit
anchors to a named ruling, trial, or case record; the pending-audit
disclosure is on the Corrections Ledger.

NEW depth system: `mythWings.ts` gives every exhibit the same structural
richness as a protocol page — twelve wing profiles rendering four
sections on each of the 191 pages: how the family claims to work, why it
FEELS like it works, the tell-tale signs, and the American-culture hook
(labeled as analysis). Coverage is test-enforced.

Page yield: +119 /myth/ pages, all with unique sub-60-character
descriptions. Sitemap: 2,311 → 2,430 URLs.

- **MOD** `client/src/lib/mythMuseum.ts` — the 119 new exhibits
- **NEW** `client/src/lib/mythWings.ts` — wing profiles + full coverage map
- **MOD** `client/src/pages/MythDetail.tsx` — the anatomy section
- **MOD** `client/src/pages/Corrections.tsx`, `shared/seo.ts`, tests

---

## 0. NEW IN 18L — Therapy library Batch 2: 92 → 156 protocols, 2,311 pages

64 additional real, landmark-literature interventions authored into the
therapy map (ACT, Exposure and Response Prevention, Unified Protocol,
Metacognitive Therapy, Triple P, Circle of Security, Integrative Behavioral
Couples Therapy, Multisystemic Therapy, HIIT, Loving-Kindness Meditation,
Mental Contrasting/WOOP, After-Action Reviews, Premortem Technique, JOBS
Program, and 50 more) — 67 new line mappings, each with an author-year-venue
citation and conservative role assignments. DOI fields are deliberately BLANK
pending the external citation audit — nothing is invented — and that
disclosure is the newest entry on the public Corrections Ledger.

Page yield, all generated automatically with unique sub-60-character
descriptions: +64 /protocol/ pages, +67 /build/ pages, +462 /compare/ pages.
Sitemap: 1,718 → 2,311 URLs.

- **MOD** `shared/therapyLineMap.ts` — the 67 new mappings
- **MOD** `client/src/lib/therapyKinds.ts` — kind profiles for all 64
- **MOD** `client/src/pages/Corrections.tsx` — the pending-audit ledger entry

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

## 16. 550 more pages: Power Combinations + Keystone Practices (AUG 18G)

- **/pair/<a>--<b>** — 496 pages, one per unordered pair of the 32 lines.
  A hand-written role engine (32 functional identities: the Prover, the
  Barometer, the Weaver…) composes with both lines' real content into:
  what each gives the other, the multiplication, both shadow
  configurations, independence/rarity logic, a compound "both ever
  tested" per-million estimate, and studies from both lines. Pair-level
  interaction claims are explicitly labeled framework synthesis.
- **/pairs** — pick-a-line index of all 496.
- **/practice/<id>** — 54 keystone-practice pages: the prescription, the
  research basis, honest evidence tier, horizon, what it lifts.
- **/practices** — index of all 54. Footer links added; line pages link
  into their pairings. Sitemap: 706 URLs.
- **NEW** `PairDetail.tsx`, `Pairs.tsx`, `PracticeDetail.tsx`,
  `Practices.tsx`, `client/src/lib/linePairs.ts`;
  **MOD** `shared/seo.ts`, `RouteMeta.tsx`, `LineDetail.tsx`,
  `PublicLayout.tsx`, `App.tsx`

## 17. Wave three: 541 more pages — sitemap 1,247 (AUG 18H)

Five new families, all composed from real held data:

- **/compare/<a>--vs--<b>** (225) — every pair of protocols both PRIMARY on
  a shared line: side-by-side dose/durability, each one's evidence on the
  shared capacity, honest choose-which-when logic, explicit
  not-medical-advice.
- **/goal/<keyword>** (96) — goal keywords carried by 2+ keystone practices
  (focus, stress, discipline…): evidence-sorted practice cards + the lines
  underneath.
- **/weak/<line>** (32) — signs, costs, and the repair plan per line.
- **/gift/<line>** (32) — signs you're gifted, why school missed it, the
  shadow of unexamined strength, best pairings.
- **/build/<line>/<therapy>** (156) — one page per therapy-map entry with
  that entry's own capacity, citation + DOI, finding, dose, alternatives.
- Cross-linking web extended: line pages → weak/gift; protocol pages →
  comparisons + capacity pages; practices index → goal chips.
- **NEW** `CompareDetail.tsx`, `GoalDetail.tsx`, `WeakLine.tsx`,
  `GiftLine.tsx`, `BuildDetail.tsx`; **MOD** `shared/seo.ts`,
  `RouteMeta.tsx`, `LineDetail.tsx`, `TherapyDetail.tsx`,
  `Practices.tsx`, `App.tsx`

## 18. Per-page one-liners, Explore nav, www canonical (AUG 18I)

- **Every one of the 1,644 pages now carries a UNIQUE short description
  under 60 characters** — what the page is and what it means to the
  reader — served as og:description/twitter:description (the long meta
  description stays). 32 hand-written for the core pages; the nine
  dynamic families compose theirs from real data.
- **Enforced automatically:** a new test suite fails the build if any
  page ever ships without a short, at 60+ characters, or duplicating
  another — so every future page family inherits the rule.
- **"Explore" menu in the site header on every page** (desktop + mobile):
  the 32 Lines, Power Combinations, Protocol Library, Keystone
  Practices, Sample Report, 2-Minute Quiz, Corrections Ledger, Help.
- **Canonical host is now www.joinaqal.com** across all canonicals,
  og:urls, the sitemap, robots.txt, and index.html. See the
  APPLY_INSTRUCTIONS env section — DNS for www is REQUIRED before deploy.
- **NEW** `client/src/lib/pageShorts.ts`, `pageShorts.test.ts`,
  `scripts/verify-shorts.ts`; **MOD** `shared/seo.ts`, `RouteMeta.tsx`,
  `PublicLayout.tsx`, `client/index.html`, `vitest.config.ts`

## 19. Sub-60 shorts sitewide + 622 comparisons + the therapy pipeline (AUG 18J)

- All page one-liners revised to UNDER 60 characters (was <69): 32
  statics rewritten, all dynamic templates tightened. Verified
  1,644/1,644 unique, longest 59. Tests enforce <60 from now on.
- Comparison pages expanded 225 → 622: now every pair of protocols
  sharing a line where at least one is PRIMARY — asymmetric pages
  render "direct road vs supporting road" copy with role-aware
  choose-logic. Sitemap: 1,644 URLs.
- The 1,000-therapy expansion pipeline: intake spec + research
  commission committed to handoffs. Verified batches of 100 real,
  DOI-backed therapies merge into the map and pages auto-generate
  (~300–600 per batch) with metadata, shorts, and tests enforced.
  No therapy publishes without a resolving citation.

## 20. The Myth Museum + Why We Fall (AUG 18K)

- **/myths + /myth/<id>** — 72 documented failed therapies, verdict-
  filterable (DEBUNKED / NO EVIDENCE / HARMFUL / REPLICATION FAILED /
  OVERCLAIMED). Every exhibit: the claim, why it failed with a named
  checkable source anchor, the cultural-appeal reading explicitly
  labeled as analysis, and the real library alternative. Exhibits never
  contradict our own cited protocols.
- **/why-we-fall** — the long-form essay on why America buys therapies
  that fail their tests: measured mechanisms tagged ESTABLISHED,
  cultural amplifiers tagged INTERPRETATION, one paragraph tagged
  SPECULATION. The house rule made visible.
- Explore nav gains The Myth Museum. Sitemap: 1,718 URLs, every page
  still carrying its unique sub-60-character description (enforced).
- **NEW** `client/src/lib/mythMuseum.ts`, `MythDetail.tsx`, `Myths.tsx`,
  `WhyWeFall.tsx`; **MOD** `shared/seo.ts`, `RouteMeta.tsx`,
  `pageShorts.ts`, `PublicLayout.tsx`, `App.tsx`, tests

---

**Verified before cutting this patch:** `pnpm check` clean, `pnpm build` green, 270/270 tests passing (including
live-server tests against a running dev instance), homepage dial + hero popup
browser-tested (desktop + touch), and the 13-page mobile viewport sweep passing
with zero layout overflow and zero DOM-validity warnings; hover-popup flow browser-verified 10/10 (hero + dial, content, close-stays-closed).
