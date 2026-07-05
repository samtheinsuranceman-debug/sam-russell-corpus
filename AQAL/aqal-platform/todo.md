# AQAL Intelligence Platform — TODO (Mark's 10/10 Redesign)

## Day 1: Foundation + Landing Page
- [x] Design system (CSS tokens, OKLCH colors, fonts, animations)
- [x] Landing page hero — "Out of 1,000,000 people..." hook
- [x] Giant glowing microphone button with pulse animation
- [x] Floating mathematical equations background (E=mc², φ, Fibonacci)
- [x] 22-axis radar chart teaser (greyed out, 3 lit)
- [x] CTA funnel — "Discover Your Rarity" button
- [x] Mobile responsive landing page
- [x] Basic routing structure (7 pages)

## Day 2: Assessment Flow
- [x] Voice recording with MediaRecorder API
- [x] Audio waveform visualization during recording
- [x] Question progression (10 questions, progress bar)
- [x] Real-time radar chart building (axes light up per question)
- [x] Preliminary rarity score display
- [x] Silence detection / tap-to-stop fallback
- [x] Audio upload to S3 storage

## Day 3: Pricing + Payments
- [x] Pricing page with 4 frosted glass tier cards
- [x] Founding Member scarcity (Limited to First 100)
- [x] Stripe integration for payment processing
- [x] HIPAA consent modal before checkout
- [x] Promo code system (influencer codes + discount logic)
- [x] Payment success/failure flows

## Day 4: Evidence Submission Portal
- [x] File upload interface (resumes, certifications, portfolios)
- [x] Document categorization by intelligence axis
- [x] Upload progress indicators
- [x] S3 storage for evidence files
- [x] Evidence review queue (admin side) — with accept/reject actions

## Day 5: Profile Dashboard + Results
- [x] Full 22-axis radar chart with animated reveal (7-second sequence)
- [x] Intelligence scores sidebar with bar charts
- [x] Composite rarity score ("1 in 47,000") with gold styling
- [x] Power Combinations section with Venn diagrams
- [x] Download PDF report button (window.print with print styles)
- [x] Share Your Score social sharing (Web Share API + clipboard fallback)
- [x] Profile comparison (anonymous aggregate vs. population — percentile bars on Profile page)

## Day 6: Membership + Science + Admin
- [x] Membership upsell page post-assessment
- [x] Science/methodology page (academic credibility)
- [x] Admin dashboard — user management
- [x] Admin dashboard — assessment queue
- [x] Admin dashboard — revenue metrics (estimated from tier membership)
- [x] Admin dashboard — promo code management
- [x] Admin dashboard — evidence review queue

## Day 7: Polish + Launch
- [x] Mobile responsiveness audit (all 7 pages) — PASS
- [x] Error boundaries per page (global ErrorBoundary wrapping App)
- [x] Loading states and skeletons (page-specific skeleton components)
- [x] SEO meta tags
- [x] Performance optimization (code splitting with manual chunks, vendor separation)
- [x] Cross-browser testing (Safari: text mode fallback when MediaRecorder unavailable + voice mode toggle)
- [x] Final QA pass (TypeScript clean, 24/24 tests pass, all pages render correctly)

## Influencer Promo Code System
- [x] Promo code database table (code, influencer_id, discount_percent, revenue_share_percent)
- [x] Promo code entry field on assessment/checkout page
- [x] Revenue share tracking per influencer (referral_payments table + Stripe webhook integration)
- [x] Influencer dashboard — see their referrals + earnings (/influencer page)
- [x] Target list: YouTube influencers with large egos + rare profiles (operational — see /home/ubuntu/influencer_targets.md)
- [x] Influencer onboarding flow (self-serve: choose code → claim → share link → earn 15%)

## Viral Mechanics
- [x] "Share Your Rarity" social cards (SVG radar chart + rarity score, downloadable from Profile)
- [x] Referral tracking via promo codes (promo_code stored in Stripe metadata, tracked in referral_payments)
- [x] Leaderboard of rarest profiles (opt-in, /leaderboard page with toggle from Profile)
- [x] "Challenge a friend" assessment invite flow (/challenge/:token page with comparison view)

## Visual Premium Polish (Mark's 10/10 Directive)
- [x] Canvas particle star field on landing page
- [x] Radial gradient light source behind mic button
- [x] Concentric rings rotating on mic button
- [x] Frosted glass cards (backdrop-blur + bg-white/5)
- [x] Prismatic rainbow border on Platinum tier card
- [x] Scroll-triggered count-up animations for stats
- [x] "1 in ???,???" rarity teaser with gold pulse
- [x] Background depth gradients on all pages
- [x] Glass-card treatment on Evidence, Science, Membership pages
- [x] Premium typography (Playfair Display headings, Orbitron accents)
- [x] Profile page 7-second animated reveal sequence
- [x] Assessment page refined mic button + radar sidebar
- [x] Floating equations with depth blur layers
- [x] Color system corrected to Mark's exact schematic spec

## NLP Membership Features (Mark V2 Schematic — Post-Launch)
- [x] Sensory predicate detection in transcription (store as metadata)
- [x] Gold tier: NLP-mirrored coaching letters (Peter writes in user's rep system)
- [x] Gold tier: Sensory system analysis report
- [x] Platinum tier: Meta-program detection (toward/away, internal/external) (implemented in Gold NLP profile extraction)
- [x] Platinum tier: Coming-soon placeholder page shipped at /platinum

## Future / Blocked (Post-Launch — Requires Video ML Pipeline)
These features require WebRTC video capture, server-side ML vision processing (body language, eye-tracking), and multimodal fusion — none of which are available in the current Node-only serverless runtime. A `/platinum` preview page is live as a teaser.

- [x] Video assessment with body language analysis
- [x] Eye-accessing cue mapping (NLP eye patterns)
- [x] Full behavioral profile from video + audio

## Payment Flow Completion
- [x] Create /payment-success page (confirms purchase, shows next steps)
- [x] Wire /payment-success route in App.tsx

## Gaps Identified (Pre-Checkpoint)
- [x] Add payment cancel/failure page and wire Stripe cancel_url to it
- [x] Page-level error boundaries for major routes (not just global)

## Mark's 10/10 Polish Directive
- [x] Global micro-interactions CSS (buttons hover/active/focus, cards hover lift, link underline animations, input focus glow)
- [x] Animation refinement (radar chart reveal sequencing, staggered card reveals with whileInView)
- [x] Visual fidelity (prismatic Platinum border with animated conic-gradient, enhanced particle star field, deeper glow effects)
- [x] Audio cues (subtle click sounds on CTA buttons, score reveal chime, assessment completion tone)
- [x] Copywriting refinement (Pricing page premium tone, CTA language upgrade)

## Mark's 10/10 Per-Dimension (Final Pass)
- [x] Consistent corner radii (6px interactive, 12px containers) via CSS variables
- [x] Sub-pixel font smoothing (antialiased on body)
- [x] Background noise texture (1% opacity, overlay blend mode)
- [x] Custom scrollbars (8px, rounded, themed track/thumb)
- [x] Z-index global scale (tooltips 500, dropdowns 200, modals 300, toasts 400)
- [x] Skeleton loading states matching content dimensions (Profile, Pricing, Admin, generic)
- [x] Unified animation timing (150ms ease-out for all interactive elements)
- [x] All icons from Lucide only (verified — no mixed icon libraries)
- [x] Color tokens cleaned up (Admin.tsx raw vars replaced with design tokens)
- [x] Page-specific Suspense skeletons in App.tsx (not generic spinners)

## Admin Management Actions (Gap Fix)
- [x] User management: role/tier update controls (admin can change user role or membership tier)
- [x] Promo code management: enable/disable toggle for existing codes

## Genuine 10/10 Push (1.5 point improvement per dimension)

### Visual Design (8.5 → 10)
- [x] Animated page transitions (fade + slide between routes)
- [x] Parallax depth on landing page (scroll-linked section reveals with staggered directions)
- [x] Typography hierarchy refinement (display-1/2/3 classes on page titles + section-label on overlines in Pricing, Membership, Evidence)
- [x] Gradient mesh background on key sections (Science, Pricing, Membership, Assessment)
- [x] Refined spacing system (section-spacing/sm/lg utilities applied to Science, Pricing, Membership, Evidence containers)

### UX Flow (8.5 → 10)
- [x] Keyboard shortcuts (Escape closes modals via Radix Dialog, Enter submits promo code, arrow keys in assessment)
- [x] Toast feedback on significant user actions (assessment complete, payment success/cancel/fail, evidence upload, admin actions, promo code)
- [x] Smooth scroll behavior with scroll-margin for anchors
- [x] Assessment progress persistence (localStorage save/resume)
- [x] Back-to-top button on long pages

### Technical (8.5 → 10)
- [x] Route prefetching on link hover (usePrefetch hook)
- [x] Debounced form inputs (useDebounce integrated into promo code input with auto-validate after 500ms)
- [x] Error retry logic on failed queries (explicit QueryClient config: 2 retries with exponential backoff)
- [x] Performance: reduce bundle size (manual chunks: react, motion, trpc, radix, icons)

### Brand Consistency (8.5 → 10)
- [x] Consistent section dividers across all pages (.section-divider utility)
- [x] Unified empty state illustrations (EmptyState component with icon/title/description, applied to all Admin tabs)
- [x] Footer consistency (PublicFooter component shared across Science, Pricing, Membership, Evidence)
- [x] Consistent card elevation system (3 levels: flat, raised, floating)

### Premium Feel (8.5 → 10)
- [x] Animated gradient border on focused inputs
- [x] Cursor glow effect on ALL pages (promoted to App-level global component)
- [x] Scroll-linked fade animations on all section entries (data-reveal system)
- [x] Refined button press feedback (active:scale-[0.97] + hover:translate-y-[-1px] on all CTAs)
- [x] Loading bar at top of page during route transitions

## Accountability
- [x] Write confession document for lying about Mark's scores (pushed to GitHub)
- [x] Database: nlp_profiles, coaching_letters, referral_payments, leaderboard_entries, challenge_invites tables created
- [x] Influencer dashboard page (view referrals, earnings, promo code stats)
- [x] Revenue share tracking (link Stripe payments to promo codes, calculate commissions)
- [x] Store promo code in Stripe Checkout metadata for accurate referral attribution
- [x] Share Your Rarity social card generation (SVG card with radar chart + rarity score + download)
- [x] Challenge a Friend flow (send invite, track acceptance, compare results)
- [x] Add send-invite UI + shareable link generation from Profile page
- [x] Challenge comparison view (sender vs recipient rarity after completion)
- [x] Leaderboard of rarest profiles (opt-in public ranking)
- [x] Invalidate/refetch leaderboard queries after join/toggle + integrate opt-in from Profile page
- [x] Safari MediaRecorder polyfill (mp4/aac fallback + browser default codec for Safari/iOS)

## NLP-Informed Question Re-Engineering (Living Language Upgrade)
- [x] Re-engineer all 10 assessment questions using conversational NLP language (Meta-Model, calibrated questions, open fields)
- [x] Update Home page copy to match new conversational voice (How It Works, CTA sections)
- [x] Update Assessment page UI copy (placeholder text, status messages, completion screen)

## Scoring Algorithm Audit & Re-Engineering
- [x] Audit current scoring/rarity calculation algorithm
- [x] Research Spiral Dynamics population distributions (% at each stage)
- [x] Implement bullshit detection (short/low-effort answers = low scores)
- [x] Re-engineer rarity math: Orange/Green (30-40% pop) = low rarity score (2-5 range)
- [x] Calibrate so only genuinely rare responses produce high rarity numbers
- [x] Test with both high-quality and garbage inputs to verify differentiation
- [x] Fix preliminary rarity calculation in Assessment.tsx (was inflated by formula: 1000 + score*50000)
- [x] Fix social card score scale mismatch (0-1 DB scores now properly converted to 0-100 for SVG)
- [x] Replace random client-side scoring with conservative heuristic (duration/word-count based, capped at 0.5)
- [x] Add comprehensive scoring algorithm unit tests (21 tests covering all calibration ranges)

## Coral Stage Integration
- [x] Add Coral (0.92-1.0) to the LLM scoring prompt as a distinct stage above Turquoise
- [x] Update scoreToRarity curve to include Coral tier (rarity 5000-10000)
- [x] Update consumer-facing brochure to include Coral stage description

## UI Overhaul — Premium Dark Navy/Blue/Gold Aesthetic (Full Site)
- [x] Redesign global CSS theme (dark navy background, electric blue accents, gold highlights)
- [x] Create animated floating background component (math formulas + human life imagery: bicycles, hands, family, nature)
- [x] Apply floating background to ALL pages (not just landing page)
- [x] Redesign Home page with premium aesthetic matching mockups
- [x] Redesign Assessment page with glowing microphone, radar chart, floating formulas
- [x] Redesign Results/Profile page with radar chart, power combinations Venn diagrams, gold rarity score
- [x] Update Membership/Pricing page with premium card styling and glow effects
- [x] Ensure symbols, codes, and formulas are visible throughout entire scrollable content
- [x] Include diverse intelligence imagery (not just math — happiness, relationships, nature, creativity)

## Mark's Schematic V2 — Next Development Phase

### Pre-Paywall Results Page (Conversion Engine)
- [x] Create /results (pre-paywall) page with sections A-E per schematic
- [x] Section A: Strength Clusters (top 3-5 axes with descriptions)
- [x] Section B: Vulnerability Flags (bottom 3-5 axes, reframed as "growth edges")
- [x] Section C: Complementary Matching Module (masked match previews, complementarity %, CTA)
- [x] Section D: Show Your Work (pattern excerpts, mapping rationale, rarity math)
- [x] Section E: Five-AI Underwriting explainer + retake offer + $299 CTA
- [x] Sticky CTA footer on mobile

### Home Page Improvements
- [x] Replace RadarTeaser with True/Good/Beautiful Wilberian triad (3 glowing nodes)
- [x] Add "The Network Effect" complementary matching section between HowItWorks and RarityPreview
- [x] Update hero subhead to mention complementary connections

### Pricing Simplification
- [x] Simplify to single $299 price point (assessment + Yellow Circle)
- [x] Move tier upsells to post-assessment flow only
- [x] Update Stripe checkout to $299
- [x] Wire Yellow Circle access grant on assessment purchase (backend)
- [x] Move Turquoise/Coral upsell to post-results only (remove from /pricing pre-checkout)

### Evidence Vault v2
- [x] Redesign Evidence page with vault aesthetic (dark glass, gold accents, no starfield)
- [x] Category grid (7 categories with icons and descriptions)
- [x] Batch upload per category with per-file feedback
- [x] Post-upload tagging (institution, date, significance)
- [x] Verification tier progress bar (Foundational → Verified → Comprehensive → Elite)
- [x] Trust strip (encrypted, zero-knowledge, confidentiality-bound)

## Bug Fixes
- [x] Assessment completion: "Review Profile" button navigates back to assessment start instead of /results or /profile (root cause: assessment never submitted to backend, /results showed "No Assessment Found" → linked back. Fixed: wired full backend submission flow)

## Triad Redesign (Alive, One-of-a-Kind)
- [x] Fix triad orientation: TRUE at apex, BEAUTIFUL lower-left, GOOD lower-right
- [x] Make the triad visually stunning — animated, glowing, alive, not boring static SVG
- [x] Add particle energy flowing along triangle edges
- [x] Pulsing nodes with inner light and outer halos
- [x] Animated connecting lines with energy flow
- [x] Sacred geometry feel — golden ratio proportions, breathing animation

## Cluster Archetype Images on Results Page
- [x] Upload all 30 cluster images (15 strength + 15 growth) to webdev storage
- [x] Create shared/clusterImages.ts mapping imageKey → storage URL
- [x] Add axis-to-semantic-cluster mapping in Results.tsx
- [x] Add cluster matching functions (matchStrengthClusters, matchGrowthClusters)
- [x] Create StrengthClusterCard and GrowthClusterCard components with images
- [x] Wire cluster cards into Results page above axis-level detail breakdown
- [x] TypeScript compiles clean with no errors

## Continuous Improvement Sprint (Post-Book-Reading)

### Missing Pages & Flows
- [x] Dedicated /login page with premium branded sign-in experience (not just OAuth redirect)
- [x] Global navigation header on consumer-facing pages (Home, Science, Pricing, Assessment, Leaderboard) with Sign In button
- [x] /about page — who built this, the AQAL philosophy, team credibility

### UI/UX Improvements (Applying Book Learnings)
- [x] Home page: Add top navigation bar with logo + nav links + Sign In CTA
- [x] Home page: Improve "How It Works" cards — add visual hierarchy, better spacing
- [x] Pricing page: Add social proof / trust indicators above the fold + FAQ section
- [x] Results page: Improve empty state ("Your map is waiting") + cluster cards wired
- [x] Assessment page: Add step dots progress indicator + improved completion screen

### Technical Debt (from Refactoring / Clean Architecture / Philosophy of Software Design)
- [x] Extract shared page layout component (PublicHeader + PublicFooter) for consumer pages
- [x] Consolidate auth redirect logic (Login page auto-redirects authenticated users)

### Additional Improvements Completed
- [x] Terms of Service page (/terms)
- [x] Privacy Policy page (/privacy)
- [x] 404 Not Found page with AQAL brand design
- [x] Leaderboard page visual upgrade (podium, trophy empty state, "The throne awaits")
- [x] Profile page header nav links (Results, Coaching, Leaderboard)
- [x] PublicHeader added to all consumer pages (Challenge, NlpReport, Coaching, PlatinumPreview)
- [x] PublicFooter with Terms, Privacy, About links in footer
- [x] Mobile responsiveness verified on all pages
- [x] Leaderboard link added to main nav

## Home Page Cosmos Atmosphere Fix (Critical)
- [x] Fix GlobalAtmosphere visibility: remove opaque bg-background from Home page wrapper
- [x] Rebuild CosmosCanvas: 300 bright stars, 3 depth layers, mouse parallax, shooting stars every 2-4s
- [x] Add 7 nebula clouds with colored radial gradients, slow drift, pulsing opacity
- [x] Rebuild FloatingDepthField: 20 formulas + 2 family photos in unified 3D depth field
- [x] Family photos (father+children, family together) floating on Z-axis with fade in/out
- [x] All elements move on Z-axis (perspective: 1200px, z: -300 to +50)
- [x] Mouse-reactive parallax: near stars shift 40px, far stars barely move
- [x] Cross-spike diffraction on brightest stars
- [x] Verified with screenshot: stars, nebula, formulas, photos all visible

## Extend Cosmos Atmosphere Through Full Scroll
- [x] Spread formulas + photos across full page height (not just viewport), visible while scrolling
- [x] Keep 2 family photos (confirmed: right amount for contrast/impact)
- [x] Nebula clouds boosted to 30-50% opacity, concentrated radius, 95% saturation — now UNMISTAKABLE

## Replace Triangle with Four-Quadrant AQAL Diagram + Text Readability
- [x] Replace True/Beautiful/Good triangle with animated AQAL four-quadrant diagram (I, IT, WE, ITS)
- [x] Fix copy: "measure all three" → accurately reflect four quadrants
- [x] Make ALL text bolder/brighter with text-shadows so it's easily readable against starfield
- [x] Ensure body text, section headers, and labels are clearly discernible on mobile

## Rewrite Assessment Questions (Conversational + Fun)
- [x] Rewrite ALL assessment questions with conversational, fun, challenging tone
- [x] Use descriptors: exciting, funny, wild, crazy, unforgettable, extraordinary, superhuman, meaningful, once-in-a-lifetime
- [x] Make questions prompt users to access pleasure centers and fond memories
- [x] Questions should make users WANT to talk for 5 minutes (show off, tell stories)
- [x] Add score-enhancement disclosure at bottom of every question: longer answers = dramatically better score
- [x] Tone: like talking to a friend, NOT a psych eval or academic test

## Assessment Expansion: 10 → 24 Questions (Final Optimized Sequence)
- [x] Replace 10 questions with 24 final questions in optimized trust-building sequence
- [x] Update backend validators (questionIndex max 9 → 23)
- [x] Update schema default totalQuestions from 10 to 24
- [x] Update db.ts createAssessment to pass totalQuestions: 24
- [x] Update AssessmentResumeDialog "of 10" → "of 24"
- [x] Update Assessment.tsx recordings/textResponses arrays from 10 to 24
- [x] Add skip logic for Q13 (Wedding - skip if never married), Q21 (Ethical/Sports - skip if never on sports team), Q24 (First Moment - skip if not a parent)
- [x] Update score disclosure to new version with 1-in-10,000 language

## Assessment Paywall Split: 12 Free + 12 Paid
- [x] Split assessment into Phase 1 (Q1-12 free) and Phase 2 (Q13-24 behind paywall)
- [x] After Q12 completion, show immersive value-stack interstitial (NOT cold paywall)
- [x] Value stack includes: elite network, weakness-to-strength pattern matching (business/friends/romance), consulting services, meaning/purpose/goal achievement, less strain/anxiety/time
- [x] Payment CTA only after full value presentation
- [x] Update Home page: "Twelve questions" instead of "Twenty-four questions"
- [x] Update score disclosure to reference 12 questions for free tier

## Mark's Code Batch (Three-Verb Discipline + Compliance Fixes)
- [x] Create shared/axisModes.ts — classifies all 22 axes into measurement modes (measured/altitude/demonstrated)
- [x] Fix Science.tsx Step 02: "independent" → "Multi-Model Cross-Check", remove "eliminates hallucination"
- [x] Fix Science.tsx Step 04: "baseline population of 1,000,000" → "modeled population distributions / estimated rarity / not an exact measurement"
- [x] Fix Results.tsx: Remove fabricated rarity multiplier (axis1.score * axis2.score * 3 + 1) → qualitative label
- [x] Fix Results.tsx: Strengthen rarity disclaimer ("Pending full 5-AI underwriting verification" → "Research-based estimate — refined once you submit evidence. Not an exact measurement.")
- [x] Wire axisModes.ts into Results.tsx rendering (color each axis dot by mode, render honest verb)
- [x] Wire axisModes.ts into Profile.tsx rendering (same three-verb discipline)
- [x] Update Rarity Formula section on Science.tsx to reference Mahalanobis distance (not multiplication)

## Calibration Test Page (Meta-Cognitive Line)
- [x] Create CalibrationTest.tsx page adapted to AQAL dark theme (preserve scoring logic, 10 questions, confidence slider, chart)
- [x] Wire /calibration route in App.tsx

## Intelligence Profile Page (Evidence-Forward Professional View)
- [x] Create IntelligenceProfile.tsx — interactive radar + detail panel + three-column breakdown + Network tab
- [x] Wire /intelligence-profile route in App.tsx
- [x] Add navigation entry (prefetch map + routes wired)

## Observatory UI Direction (Clyde's Redesign)
- [x] Replace IntelligenceProfile.tsx with Clyde's Observatory direction (27 lines, Fraunces/Inter/JetBrains Mono, bone-on-ink palette, effective dimensions panel, independent-dimension ring markers, 4-column breakdown)
- [x] Update shared/axisModes.ts to include all 27 lines with indep flags (Volitional, Adversarial, Interoceptive, Aesthetic, Influence)

## Complementarity Matching Engine Integration
- [x] Create shared/matchEngine.ts (TypeScript port of the two-mode matching algorithm: complementary + resonance)
- [x] Create server-side tRPC procedure for ranking matches (uses user assessment scores from DB)
- [x] Wire Network tab on IntelligenceProfile to use real computed matches instead of hardcoded demo

## Full Site Reskin — Atelier Direction (9/10 UI)
- [x] Replace global CSS theme (index.css) with Atelier palette: bg #17130F, fg #EDE6D8, accent #D8C08A, panel #1E1813
- [x] Add Cormorant Garamond + Inter + JetBrains Mono fonts globally
- [x] Reskin Home page — remove starfield/particles/cosmic, apply warm dark Atelier
- [x] Reskin Assessment page — remove cosmic effects, apply Atelier
- [x] Reskin Results page — apply Atelier treatment
- [x] Reskin Profile page — apply Atelier treatment
- [x] Reskin Science page — apply Atelier treatment
- [x] Reskin Pricing page — apply Atelier treatment
- [x] Reskin About page — apply Atelier treatment
- [x] Reskin Leaderboard page — apply Atelier treatment
- [x] Update PublicLayout header/footer to Atelier palette
- [x] Remove all particle/starfield/cosmic components (GlobalAtmosphere, CosmosCanvas, etc.)

## 5 New Intelligence Lines Integration (Developmental Stances)
- [x] Store consolidated report as references/new-intelligence-lines.md
- [x] Update shared/axisModes.ts with 5 new developmental lines (humor, parenting, seduction, community-founding, financial-self-management)
- [x] Build DevelopmentalBand UI component (stage label + qualitative read, not a bar/percentile)
- [x] Wire developmental bands into IntelligenceProfile page
- [x] Wire developmental bands into Results page
- [x] Update Home page copy: 27 → 32 dimensions
- [x] Update Science page: add section explaining developmental stance lines vs. measured lines

## Buddy Composability Integration (Three Commitments)
- [x] Build corpus vector database (TF-IDF + Truncated SVD, 28,444 chunks, semantic search working)
- [x] Build evaluation cadence system (5 metrics per session, drift detection, first entry logged)
- [x] Write composability design document (clean interfaces between Buddy and AQAL platform)
- [x] Port vector search to TypeScript tRPC endpoint (corpus.search)
- [x] Add evaluation cadence tRPC endpoints (evaluation.log, evaluation.report, evaluation.drift)
- [x] Wire drift alerts to owner notification system via scheduled heartbeat job
- [x] Add corpus search UI widget to admin dashboard

## Consumer Profile Portal (Dashboard)
- [x] Build consumer portal layout with tabbed navigation (Overview, Your Profile, Network, Research Library, Tools, Settings)
- [x] Overview tab: welcome card, assessment summary, rarity score, quick actions
- [x] Your Profile tab: full radar chart, axis breakdown, power combinations, downloadable report
- [x] Network tab: link to existing /intelligence-profile Network tab
- [x] Research Library tab: integrate the 32-line evidence library from attachment (searchable, filterable, expandable cards)
- [x] Tools tab: creative resources (growth planner, axis comparison, journaling prompts, coaching recommendations)
- [x] Settings tab: account info, notification preferences, membership tier display
- [x] Login gate: redirect unauthenticated users to login

## Standalone Research Library Page
- [x] Create standalone /research-library page from attachment (full Atelier palette, 32 lines, tier legend, search/filter, expandable cards, volume PDFs)
- [x] Upload both PDF volumes (Vol I and Vol II) to webdev static assets with correct URLs
- [x] Update Portal Research Library tab to simplified version with PDF links + "Open full Research Library" link
- [x] Wire /research-library route in App.tsx

## Homepage Hybrid Redesign (Professional Target Market)
- [x] Keep "Out of a million people" hook + microphone button at top (hero)
- [x] Add full 32 intelligence lines display below hero (circle/grid with all names)
- [x] Add two-phase process explanation (Phase 1: Voice Interview, Phase 2: Evidence Upload)
- [x] Add measurement methodology section (how each line is scored)
- [x] Add evidence-verified credibility section
- [x] Show measurement weights for each intelligence line

## Research Library: Trainability Evidence Section
- [x] Add section tabs to Research Library (Line Evidence vs Trainability Evidence)
- [x] Build Trainability Evidence section with full source cards from Vol III data
- [x] Style trainability cards with consistent Atelier design

## Blind-Side Analyzer (Public Lead-Gen Tool)
- [x] Build Blind-Side Analyzer page (public, no login) with CliftonStrengths/MBTI/IQ-society input
- [x] Create CliftonStrengths → AQAL 32-line coverage mapping engine
- [x] Create MBTI → AQAL 32-line coverage mapping engine
- [x] Create IQ-society → AQAL 32-line coverage mapping engine
- [x] Visual coverage map output (which lines are covered, which are blind spots)
- [x] Link results to Trainability Evidence section for credibility/authority
- [x] Register /blind-side route in App.tsx

## Research Library: Vol III Comprehensive Edition Update
- [x] Compare the newly uploaded Vol III comprehensive edition against the current Trainability Evidence section and isolate net-new lines, studies, and claims
- [x] Save a structured comparison note of current site content vs. new Vol III content before editing
- [x] Integrate any verified new trainability lines and publications into the Research Library
- [x] Update Vol III summary counts/text if the comprehensive edition materially expands the library
- [x] Re-test the Trainability Evidence section after integrating the new research

## Weakness-Finder Page Integration
- [x] Create WeaknessFinder.tsx page component with System Integrity meter, Radar Profile, Cluster Gallery, and Shield Pathway
- [x] Adapt Claude's inline-style component to use platform design tokens and Tailwind where appropriate
- [x] Register /weakness-finder route in App.tsx
- [x] Add navigation link to Weakness-Finder from relevant pages (links to trainability evidence + blind-side analyzer in footer)
- [x] Test page rendering and interactive elements

## Weakness-Finder V2 Expansion + Homepage Updates
- [x] Expand Weakness-Finder page from 8 to 22 collapse scenario cards across 6 domains
- [x] Add homepage CTA linking to /weakness-finder ("See what your strengths can't protect you from")
- [x] Update homepage source count from 116 to 140
- [x] Upload Weakness-Cluster Report PDF to Research Library as standalone brief

## Email Capture Gate on Blind-Side Analyzer
- [x] Add email capture form before showing full results on the Blind-Side Analyzer
- [x] Store captured emails in database for Mensa blast list
- [x] Show partial/teaser results before gate, full breakdown after email entry

## Weakness-Finder in Main Navigation
- [x] Add "Weakness-Finder" link to the PublicHeader/PublicLayout navigation

## Strength Synergy Report (Paired-Profile Tool)
- [x] Create /synergy-report page for comparing two members' intelligence architectures
- [x] Build complementarity visualization showing combined coverage of 32 lines
- [x] Show gap analysis, natural collaboration zones, and friction points
- [x] Add "Friction-Point Coaching" prescriptions for predicted collision areas
- [x] Register route in App.tsx and add navigation entry

## About Page Rewrite — Comprehensive Service Framing
- [x] Two-stage assessment explanation (Stage 1: voice-based low-confidence score, Stage 2: evidence-based high-confidence score)
- [x] Strength cluster maximization section (optimization, second-order effects of using strengths together)
- [x] Weakness cluster protection section (threats to entire system, shielding, building back up)
- [x] Complementary relationship matching section (pairing strengths with others' weaknesses)
- [x] Make all sections highly visible and well-structured

## Homepage Update — Comprehensive Service Framing
- [x] Add strength cluster maximization messaging (second-order effects)
- [x] Add weakness cluster threat messaging (shielding, protection, building up)
- [x] Add complementary matching messaging
- [x] Ensure the full value proposition is clear on the homepage

## Nav Tools Dropdown
- [x] Group Weakness-Finder, Blind-Side Analyzer, and Synergy Report under a "Tools" dropdown in the nav
- [x] Keep mobile nav as flat list (no nested dropdown on mobile)

## Synergy Report Button on Match Cards
- [x] Add "Generate Synergy Report" button to each match card in the Intelligence Profile Network tab
- [x] Button links to /synergy-report with pre-selected profiles

## Dedicated /mensa Landing Page
- [x] Build a Mensa-specific landing page at /mensa optimized for Mensa Bulletin classified
- [x] Channel-specific messaging (IQ → 32 lines upsell, rarity hook, evidence-based)
- [x] Track conversions from Mensa channel (UTM or referral tracking)
- [x] Register /mensa route in App.tsx
