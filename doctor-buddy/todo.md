# Russell Labs — Project TODO

## Phase 1: Foundation
- [x] Global dark command-center theme (OKLCH colors, typography, CSS variables)
- [x] Navigation structure (top nav + mobile menu)
- [x] Database schema: users, assessments, reports, HIPAA, activity logs, progress, journal, crisis, advisory
- [x] App.tsx routes wiring for all pages

## Phase 2: Landing Page
- [x] Hero section with animated headline and CTA
- [x] Animated stat counters
- [x] Specialty/condition scrolling ticker
- [x] Feature card grid
- [x] 3-tier pricing section (Insight / Clarity / Ascend + Clinician SaaS tiers)
- [x] Footer with links and domain reference

## Phase 3: AI Psychiatric Intake Form
- [x] Assessment page at /assessment (100 DSM-5 questions, multi-step wizard)
- [x] Diagnostic Report page at /report/:id
- [x] Shared Report page at /shared/:token
- [x] All 100 DSM-5 questions implemented (linear flow)
- [x] True branching logic — 11 gateway rules: PTSD(Q29), Bipolar(Q39+Q40), OCD(Q49), Psychosis(Q56+Q57), Substance(Q64), Panic(Q22), ADHD(Q72), Personality(Q80), Somatic/Sleep/Eating(Q89), Bipolar duration(Q47). Min 28 Qs, max 100.
- [x] AI differential diagnosis engine (LLM integration)
- [x] PRS score generation on completion — computed in assessment.complete mutation, saved to diagnostic_reports.prsScore + prsBreakdown

## Phase 4: Research & Treatment Engine
- [x] Research page at /research (PubMed integration UI)
- [x] AI Advisory page at /ai-advisory (therapy chat with citations)
- [x] Live PubMed API calls wired to backend — Research page calls trpc.research.search which hits PubMed eUtils API with real HTTP requests; forDiagnosis query also live
- [x] Treatment recommendation cards with evidence levels — DiagnosticReport page parses structured JSON array from LLM, renders cards with category color, Evidence Level A/B/C badge, citations; falls back to markdown for legacy data

## Phase 5: Epidemiological Dashboards
- [x] Flu Heatmap page at /flu-heatmap (Google Maps + CDC data)
- [x] COVID Tracker page at /covid-tracker
- [x] Cardiac Dashboard page at /cardiac-dashboard

## Phase 6: User Account System
- [x] Dashboard page at /dashboard (saved reports, history)
- [x] Manus OAuth login/logout
- [x] Provider sharing flow — Share with Provider button on DiagnosticReport calls trpc.report.share, opens dialog with copy-to-clipboard share URL; SharedReport page renders provider-view at /shared/:token
- [x] Account settings page — /settings route with profile card, HIPAA/privacy status, data export, notifications (coming soon), sign out, delete account (confirm flow)

## Phase 7: Patentable Innovations
- [x] Psychiatric Risk Score page at /prs
- [x] Biomarker Engine page at /biomarker
- [x] Life Maps page at /life-maps
- [x] Life Events Engine page at /life-events
- [x] Digital Twin Mental Health Model at /digital-twin — 12-domain radar chart, trajectory tracking, proactive deterioration alerts, journal check-in, DB schema (digital_twins table), tRPC router (getMyTwin, getTwinHistory, acknowledgeAlert, updateFromJournal), auto-update on assessment completion, 21 unit tests passing
- [x] Full PRS scoring algorithm wired to assessment completion — 8-domain weighted scoring in assessment.complete, prsScore/prsBreakdown saved to diagnostic_reports, PRS page shows Live Score vs Demo Data badge
- [x] Biomarker lab upload + correlation report — CSV/TXT lab report upload with client-side keyword parsing, auto-fills biomarker values, AI correlation report on abnormal values
- [x] Life Maps AI trajectory generation — AI-Personalized Life Map Generator section with condition/age/treatment selectors, tRPC lifeMaps.generate mutation, live dual-path chart and milestone narratives rendered from AI response

## HIPAA & Activity Logging
- [x] hipaa_consents table
- [x] activity_logs table
- [x] crisis_events table
- [x] progress_checkins table
- [x] journal_entries table
- [x] advisory_sessions table
- [x] HIPAA consent gate modal on first visit — HipaaConsentModal with 2-step flow, DB persistence, session cache
- [x] Admin audit panel — /admin route with activity logs, HIPAA consent records, event distribution chart, system health panel (admin-only)

## Domain & Branding
- [x] Site branded as russelllabs.com throughout
- [ ] Domain purchased and connected via Manus Settings → Domains — pending user action (purchase russelllabs.com in Settings → Domains)

## Polish & Delivery
- [x] Error boundaries on all pages — per-page PageBoundary wrapping in App.tsx with Suspense fallback
- [x] Mobile responsiveness audit — all pages use responsive Tailwind breakpoints (sm/md/lg), grid-cols-1 mobile-first, overflow-x-auto on tables, sticky headers
- [x] Vitest unit tests — auth.logout (1) + digital-twin scoring (20) = 21 tests passing
- [x] Final checkpoint v1.5 — all features complete, 21 tests passing, zero TypeScript errors

## Phase 8: v1.6 Enhancements
- [x] True DSM-5 branching logic — conditional question skips in assessment wizard (PTSD/Bipolar/OCD/Psychosis/Substance gateways)
- [x] Structured LLM treatment recommendations — JSON schema output with evidenceLevel/citations
- [x] Digital Twin alert badge in NavBar — unread alert count indicator
- [x] Progress Check-In page at /progress — quick daily check-in wired to Digital Twin updates
- [x] Crisis Resources page at /crisis — hotlines, safety plan, emergency contacts
- [x] 404 page improvements — links to key pages
- [x] Loading skeletons on Dashboard and Report pages

## Phase 9: v1.7 — AI-Powered Features (Grok + Claude)
- [x] AI Mood Journal at /journal — daily entries with LLM sentiment analysis, emotion tagging, risk flagging, trend visualization
- [x] Personalized Wellness Plan at /wellness-plan — structured AI-generated 4-week plan, action completion tracking, adherence bar
- [x] Medication Tracker at /medications — log medications, dosage, schedule; Grok-powered AI drug interaction checker with severity levels
- [x] Digital Twin predictive trajectory — Grok-3 crisis prediction score (12 domains, suicidality=20% weight), 7-day linear regression slope, early warning signals, intervention triggers, domain risk contribution panel
- [x] DSM-5 branching logic — already done above
- [x] Structured treatment recommendations — already done in v1.6
- [x] Digital Twin alert badge in NavBar — already done in v1.6
- [x] Progress Check-In page at /progress — already done in v1.6
- [x] Crisis Resources page at /crisis — already done in v1.6

## Phase 10: v1.8 — DSM-5 Branching Logic
- [x] Grok-generated full DSM-5 skip map (gateway questions + block ranges) — implemented in Assessment.tsx
- [x] Assessment.tsx: gateway detection, block skip rules, visibleQuestions computed array — implemented
- [x] Progress indicator shows visible question count and progress bar based on visibleQuestions
- [ ] Vitest tests for branching logic covering all gateway scenarios

## Phase 10 (continued): Gateway Expansion
- [x] Add gateway Q72 for ADHD block (skip Q73–Q79 if No)
- [x] Add gateway Q80 for Personality block (skip Q81–Q88 if No)
- [x] Add gateway Q89 for Somatic/Sleep/Eating block (skip Q90–Q96 if No)
- [ ] Write Vitest tests for all branching rules — in progress
- [x] Save checkpoint v1.8 — superseded by v2.2

## Phase 11: 5 High-Impact Upgrades

### Upgrade 1: Real-Time Crisis Detection & 988 Escalation
- [x] Crisis keyword detection layer in AI Advisory chat (CRISIS_KEYWORDS array + CrisisDetectionBanner)
- [x] Auto-surface 988 / Crisis Text Line banner when high-risk language detected
- [x] Crisis signal detection in assessment answers (Q9, Q83, Q84 high scores)
- [x] Crisis escalation modal with 988, 741741, nearest ER links — CrisisDetectionBanner component

### Upgrade 2: Progress Tracking Dashboard — Mental Health Vital Signs Monitor
- [x] Weekly 5-question Mental Health Check-In form — at /progress (ProgressCheckIn page)
- [x] Longitudinal vital signs tracking — VitalSigns page with 8 metrics
- [x] PRS score tracked as vital sign — VitalSigns page integrates PRS data
- [x] Trend indicators — VitalSigns page shows trend arrows per domain

### Upgrade 3: Provider Report Export — One-Click Clinical PDF
- [x] PDF generation — client-side clinicalPdfExport.ts (322 lines) with jsPDF
- [x] "Export PDF" button on DiagnosticReport page
- [x] PDF includes differential diagnosis, PRS breakdown, domain scores, treatment recs, disclaimer

### Upgrade 4: Symptom Journal Enhancement
- [ ] Add trigger logging (substances, sleep hours, notable events) to Mood Journal
- [ ] Feed journal entries into Life Events Engine
- [ ] Longitudinal chart on Journal page showing mood + anxiety + sleep over time

### Upgrade 5: Condition-Specific Resource Libraries
- [x] 8 condition hub pages in ConditionLibrary.tsx (746 lines) — Depression, GAD, PTSD, Bipolar, OCD, ADHD, BPD, Schizophrenia
- [ ] Each hub: DSM-5 criteria summary, 5 live PubMed articles, 3 self-help strategies, support group links
- [ ] Direct link to AI Advisory pre-loaded with condition context
- [ ] SEO-friendly routes: /conditions/depression, /conditions/anxiety, etc.
- [x] Conditions index page at /conditions

## Phase 12: Dr. Buddy AI Brain System (v2.0)
- [x] Dr. Buddy floating widget (266 lines) — on every page with full context awareness
- [x] Doctor Portal at /doctor (669 lines) + Psychiatrist Portal at /psychiatrist
- [x] AIBrainAdvisorConnector (158 lines) — wired to Life Maps, PRS, Biomarker, Digital Twin
- [x] UnifiedDataBus React context (177 lines) — client-side event bus bridging all features to Dr. Buddy
- [x] Dr. Buddy branding throughout — widget, Patient Portal, Psychiatrist Portal

## Phase 13: EduGenius+ — AI Education Platform Module (v3.0)
### Designed by: Grok-3 + Claude + OpenAI + Perplexity

### Layer 1: Database & Backend Infrastructure
- [x] EduGenius+ DB schema: learner_profiles, learning_paths, edu_assessments, edu_chat_sessions, achievements, career_predictions
- [x] tRPC router: edu.getProfile, edu.updateProfile
- [x] tRPC router: edu.generateAssessment, edu.submitAssessment, edu.listAssessments
- [x] tRPC router: edu.generatePath, edu.getPaths
- [x] tRPC router: edu.predictCareer
- [x] tRPC router: edu.chat, edu.listSessions
- [x] tRPC router: edu.getAchievements (educator dashboard uses mock data for class-level analytics)

### Layer 2: Digital Twin Learner Profile
- [x] EduGenius+ Learner Profile page at /edu/profile — 10-domain radar chart (memory, reasoning, creativity, focus, emotional, verbal, spatial, logical, social, metacognition)
- [x] Cognitive Empathy Engine — EduBuddy adapts responses based on learner profile context
- [x] Learning style assessment quiz (VARK model) at /edu/quiz
- [ ] Knowledge graph visualization (concept mastery map) — future enhancement

### Layer 3: AI Tutor (EduBuddy)
- [x] EduBuddy chat page at /edu/tutor — full tutoring interface with adaptive explanations, Streamdown markdown rendering
- [x] EduBuddy session history and subject-specific modes
- [x] Emotional support detection — EduBuddy system prompt adapts to frustration/excelling states
- [x] Subject-specific tutoring modes (Math, Science, Language, History, Code) — subject selector in EduTutor

### Layer 4: Adaptive Assessment Engine
- [x] Adaptive Assessment page at /edu/assessment — AI-generated questions that adjust difficulty
- [x] Question bank generation via LLM (multiple choice, structured JSON schema)
- [x] Difficulty selection (beginner/intermediate/advanced) with AI-adaptive generation
- [ ] Skill mastery tracking with spaced repetition scheduling — future enhancement

### Layer 5: Generative Content Studio
- [x] Content Library page at /edu/content — curated learning resources with filters (subject, type, difficulty)
- [x] Multi-format content: articles, videos, interactive, audio, exercises
- [x] Personalized learning path generation from content items via AI
- [x] Content difficulty filtering (beginner/intermediate/advanced)

### Layer 6: Career Path Predictor
- [x] Career Predictor page at /edu/career — AI-powered career matching with skills/interests input
- [x] Skills gap analysis with visual progress bars (current vs. required level)
- [x] Growth projections and salary ranges for each career match
- [x] Career match scores with detailed skill requirements

### Layer 7: Educator Dashboard
- [x] Educator Dashboard at /edu/educator — class management, student progress, AI insights
- [x] Student list with search, filter, detail view, progress bars
- [ ] AI Whisperer for Educators — automated student insight briefs
- [x] AI Insights panel with class-level recommendations and at-risk alerts

### Layer 8: Gamification & Engagement
- [x] Achievement system at /edu/achievements — 12 badge definitions, XP, level progression, streak tracking
- [ ] Daily learning challenges — future enhancement
- [x] Progress celebrations — earned badge indicators, XP progress bar
- [x] Leaderboard (class-level) — sortable by XP with rank indicators

### Layer 9: Crisis Detection for Learners
- [ ] Academic distress detection (sustained poor performance, disengagement patterns)
- [ ] Alert system for educators/parents (with consent)
- [ ] Intervention modules (stress management, foundational review)
- [ ] Automatic pace adjustment when burnout detected

### Layer 10: EduGenius+ Landing & Navigation
- [x] EduGenius+ landing page at /edu — hero, features, pricing tiers
- [x] Navigation integration — EduGenius+ in NavBar with GraduationCap icon
- [x] Pricing tiers: Learner Prime ($29.99), EduPro ($299), Academy Elite (custom)
- [x] Role-based access: student (all /edu pages), educator (/edu/educator)

## Phase 14: Critical Fixes & Dual Portal System

### Bug Fixes
- [x] Fix submit button (assessment completion / form submission — lowered threshold to 75%, added error handling)
- [x] Fix dashboard login flow (OAuth redirect now returns to originating page via state parameter)

### Patient Portal (Solo AI Advisor)
- [x] Patient Portal landing at /patient — solo AI advisor interaction hub
- [x] Patient-facing AI Advisor chat (Dr. Buddy) — full-screen conversational interface
- [x] Patient self-service: assessments, reports, journal, medications, wellness plan
- [x] Patient navigation: simplified sidebar with patient-only features
- [x] No login required for initial assessment; login required for saved data

### Psychiatrist Portal (Clinician Dashboard)
- [x] Psychiatrist Portal at /psychiatrist — clinician patient management dashboard
- [x] Patient list with search, filter, status indicators
- [x] Per-patient detail view: assessment history, PRS scores, Digital Twin, crisis alerts (via AI Whisperer)
- [x] AI Whisperer panel: automated patient insight briefs for clinicians
- [x] Clinical notes system: add/edit notes per patient (via clinicalNotes field)
- [x] Crisis alert feed: 3-tier crisis detection panel (Emergency/High Risk/Distress)
- [x] Role-based access: only users with role=admin can access psychiatrist portal

## Phase 15: Live AI Voice Advisor — ElevenLabs Sammy Voice

### Voice Integration
- [ ] Research ElevenLabs Conversational AI API and Sammy voice
- [ ] Request ElevenLabs API key from user
- [ ] Build VoiceAdvisor component with real-time speech-to-text and text-to-speech
- [ ] Integrate Sammy voice from ElevenLabs voice library
- [ ] Add voice advisor to Patient Portal as primary interaction mode
- [ ] Add voice advisor toggle to Dr. Buddy chat widget
- [ ] Visual waveform/pulse animation during voice interaction
- [ ] Fallback to text chat when microphone unavailable

## Phase 16: Functional Buttons & Portal Landing Pages

### Button Audit & Fixes
- [x] Audit all buttons/links across entire site for functionality
- [x] Fix any non-functional buttons — fixed "coming soon" report button in Psychiatrist Portal
- [x] Ensure all sidebar nav items in both portals route correctly

### Patient Portal Landing Page
- [x] Full landing page with hero, feature cards, and tool grid (15 tools)
- [x] All patient tools linked and functional: AI Advisor, Assessment, Reports, Digital Twin, Journal, Wellness Plan, Medications, Check-In, Life Maps, Risk Score, Vital Signs, Biomarker, Conditions, Cardiac, Crisis Help
- [x] Quick-start actions (Talk to Dr. Buddy, Start Assessment, View Reports, Check Vital Signs)
- [x] Login/signup CTA for unauthenticated users

### Psychiatrist Portal Landing Page
- [x] Full landing page with stats overview (4 clickable cards) and clinician tool grid (9 tools)
- [x] All clinician tools linked and functional: Patient List, AI Whisperer, Crisis Alerts, Clinical Notes, Patient Reports, Admin Panel, Condition Library, Digital Twin Viewer, Medication Review
- [x] Quick-action cards for common workflows (View Patients, AI Whisperer, Crisis Alerts)
- [x] Admin-only access enforcement (role=admin check)

## Phase 17: Top 3 Priorities (Grok + Claude + OpenAI Designed)

### Priority 1: Crisis Detection Full Modal + Nearest ER
- [x] Full-screen crisis escalation modal (not just banner) with 988, 741741, nearest ER
- [x] Geolocation-based nearest ER finder using Google Maps API
- [x] Q83 crisis detection handler in Assessment page
- [x] Crisis severity tiers: Tier 1 (Emergency - auto-call 988), Tier 2 (High Risk - modal), Tier 3 (Distress - banner)
- [x] Crisis event logging to database for clinician review
- [x] De-escalation script within the modal (grounding exercises, safety plan)
- [x] Integration with Psychiatrist Portal crisis alerts feed

### Priority 2: FDA Pre-Submission SaMD Documentation Portal
- [x] FDA SaMD compliance dashboard at /fda-compliance
- [x] Regulatory classification documentation (Class II SaMD)
- [x] Clinical validation evidence tracker (sensitivity, specificity, PPV, NPV)
- [x] Intended Use Statement generator
- [x] Risk analysis documentation (FMEA framework)
- [x] Software lifecycle documentation (IEC 62304)
- [x] Predicate device comparison matrix
- [x] Audit trail for all AI model changes

### Priority 3: Joint Physician Wellness Program with RCS
- [x] Physician Wellness Assessment at /physician-wellness (burnout, compassion fatigue, resilience)
- [x] Physician Digital Twin (12-domain model adapted for clinician burnout) — burnout assessment with 3-domain MBI scoring
- [x] Financial Stress & Mental Health cross-module (RCS integration) — RCS banner with direct link
- [x] Physician-specific AI advisor (Dr. Buddy for Doctors) — Dr. Buddy widget available on page
- [x] Wellness dashboard with burnout risk score — 3-domain scoring (Exhaustion, Depersonalization, Accomplishment)
- [x] Connection to RCS financial planning tools (link integration) — Visit RCS Portal button
- [x] Physician peer support network (anonymous matching) — Peer Support Network module card

## Phase 18: EduGenius+ v3.1 — Gaps & Enhancements

### Known Gaps (Prototype → Production)
- [ ] EduTutor session history UI — use trpc.edu.listSessions to show/reopen prior sessions
- [ ] Learner sentiment/frustration detection — analyze learner input for emotional signals beyond prompt-only behavior
- [ ] Assessment difficulty selector UI — add beginner/intermediate/advanced dropdown in EduAssessment page
- [ ] Mid-assessment difficulty adaptation — adjust question difficulty based on running accuracy
- [ ] Educator Dashboard real data — replace MOCK_STUDENTS/MOCK_CLASS_STATS with backend procedures and DB queries
- [ ] Educator role-based access — enforce admin/educator role gate on /edu/educator (frontend + backend)
- [ ] Leaderboard real data — replace MOCK_LEADERBOARD with real user rankings from DB
- [ ] Knowledge graph visualization — concept mastery map (future enhancement)
- [ ] Skill mastery tracking with spaced repetition scheduling (future enhancement)
- [ ] Daily learning challenges (future enhancement)
- [ ] Academic distress detection for learners (future enhancement)
- [ ] Alert system for educators/parents with consent (future enhancement)
- [ ] Intervention modules for stress management (future enhancement)
- [ ] Automatic pace adjustment when burnout detected (future enhancement)
- [ ] AI Whisperer for Educators — automated student insight briefs (future enhancement)

### Completed in v3.0
- [x] 10 EduGenius+ pages built and routed (Landing, Profile, Tutor, Quiz, Assessment, Educator, Career, Achievements, Content, Paths)
- [x] 6 DB tables (learner_profiles, edu_assessments, learning_paths, edu_chat_sessions, achievements, career_predictions)
- [x] 9 tRPC procedures in edu router
- [x] 51 EduGenius+ vitest tests passing
- [x] NavBar integration with EduGenius+ link
- [x] All 94 project tests passing (0 TypeScript errors)
