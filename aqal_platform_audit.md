# AQAL Platform Audit — What Claude Built, What's New, What's Left

*Buddy's audit of the 4aqal.zip upload — July 20, 2026*

---

## WHAT CLAUDE BUILT (New Code in This Zip)

### 1. 32-Line Model (was 22)
- **File:** `shared/axisModes.ts`
- **What changed:** Expanded from 22 axes to 32. Added Humor (demonstrated), Parenting (stance), Seduction (stance), Community-Founding (stance), Financial-Self-Management (stance).
- **Classification system:** 5 measurement modes (measured, calibration, altitude, demonstrated, stance) — each with explicit rules about what CAN and CANNOT be a percentile.
- **Stance lines** explicitly excluded from rarity composite.
- **Status:** ✅ COMPLETE in shared code. Needs UI propagation.

### 2. Commitment Page (Personal Commitment Agreement)
- **Files:** `shared/commitment.ts`, `server/db.ts` (lines 1167-1339)
- **What it is:** 8 spoken questions the user answers OUT LOUD (microphone, not typed). Their own words are transcribed and mirrored back as a private reference document.
- **Backend:** Full lifecycle — draft, save, sign, supersede, version, carry reminders forward. All DB operations implemented.
- **Daily check-in:** 8 PM local time, email or text, for 30 days. Email template exists (`server/platform/email.ts`).
- **Status:** ✅ Backend COMPLETE. ❌ Frontend/UI NOT in this zip (no .tsx files at all). Needs to be wired into the site.

### 3. Behavioral Tracker (Daily Dictation Journal)
- **File:** `shared/behavioralTracker.ts`
- **What it is:** Generates a 30-90 day markdown journal for users to dictate 5-7 min/day into any AI. Prescribed practices from their coaching report become the daily prompts.
- **Status:** ✅ Generator COMPLETE. Needs to be exposed in the UI (download button on results page).

### 4. Effective Performance Potential (Bottleneck Score)
- **File:** `shared/effectivePotential.ts`
- **What it is:** Liebig-weighted capability number. Weights the BOTTLENECK (weakest 3 lines) at 55% instead of a flat average. Shows the "cost of your weakest links."
- **Status:** ✅ COMPLETE. Needs UI display.

### 5. Bottleneck Roles (WHY a Weakness Hurts)
- **File:** `shared/bottleneckRoles.ts`
- **What it is:** Maps all 32 axes to one of 3 failure mechanisms (Liebig stave, O-Ring, Throughput constraint). Each has a plain-language failure mode.
- **Status:** ✅ COMPLETE. Needs UI display in coaching report.

### 6. Matching Engine (Two Modes)
- **File:** `shared/matchEngine.ts`
- **What it is:** Complementary (iron sharpens iron) vs. Resonance (peers who click). Includes generational affinity scoring.
- **Status:** ✅ COMPLETE in shared code. Needs Network UI page.

### 7. Cohort Norming (Age-Adjusted Rarity)
- **File:** `shared/cohort.ts`
- **What it is:** Adjusts rarity scores by generation so young people aren't penalized for not having had time to accumulate developmental lines.
- **Status:** ✅ COMPLETE. Needs integration into scoring pipeline.

### 8. Five New Intelligence Line Modules
- **File:** `references/new-intelligence-lines.md`
- **Lines:** Humor, Parenting, Seduction, Community-Founding, Financial Self-Management
- **Each has:** What it is, why it's independent, elicitation questions, 9-stage rubric, guardrails
- **Status:** ✅ COMPLETE as reference docs. Seduction has its own full module (`references/seduction-module.md`).

### 9. Research Integration Notes
- **File:** `references/integration-notes.md`
- **What it is:** 11 peer-reviewed sources across 4 themes (relationships shape health, resonance, complementarity, synthesis). Plus website integration plan.
- **Status:** ✅ Reference COMPLETE. ❌ Not yet built into Science page.

### 10. Keystone Practices (Prescribable Menu)
- **File:** `shared/keystonePractices.ts`
- **What it is:** 14 research-backed practices with evidence tiers, horizons, and goal-keyword matching. Powers the coaching report's prescriptions.
- **Status:** ✅ COMPLETE.

---

## WHAT'S MISSING / WHAT CLAUDE COULDN'T BUILD

### A. NO FRONTEND FILES IN THIS ZIP
The entire zip is `shared/` (TypeScript logic) + `server/` (backend) + `references/` (docs). There are **zero .tsx, .jsx, .html, or .css files**. This means:
- The Commitment Page UI doesn't exist yet
- The Behavioral Tracker download button doesn't exist yet
- The Effective Potential / Bottleneck display doesn't exist yet
- The new 5 stance lines aren't shown in the profile UI yet
- The DevelopmentalBand component (mentioned in integration-notes.md) doesn't exist yet
- The Science page "Evidence Base" section doesn't exist yet

### B. CLUSTER LIBRARY STILL AT 30 (Not Expanded)
- **File:** `shared/clusters.ts`
- **Current state:** 15 strength clusters + 15 growth clusters = 30 total
- **Problem 1:** Still references "22 axes" in comments
- **Problem 2:** Uses old lowercase-hyphenated axis IDs (`cognitive-complexity`, `purpose-clarity`) that don't match the new 32-line model's capitalized names (`Logical`, `Existential`, etc.)
- **Problem 3:** The matching functions (`topStrengthClusters`, `topGrowthClusters`) use simple averaging, not the new matchEngine
- **THIS IS THE BIG EXPANSION TASK** — going from 30 clusters to hundreds/thousands

### C. BUILD QUEUE (From `new-intelligence-lines.md`)
1. Adjudicate two fence lines (Branding, Street Smarts)
2. Verify sources for research/credibility page
3. Propagate profile UI to include new lines
4. Write the nine-stage rubric UI that governs the 5 stance lines

### D. WEBSITE INTEGRATION PLAN (From `integration-notes.md`)
1. Science page: "Evidence Base" section with 11 sources by theme
2. Science page: "Developmental Stance Lines" section
3. Results page: DevelopmentalBand component showing stage reads
4. Matching/Network: Reference research on resonance AND complementarity

---

## WHAT I (BUDDY) NEED TO DO

### Priority 1: Cluster Library Expansion
- Reconcile axis naming (old lowercase-hyphenated → new capitalized)
- Expand from 30 clusters to a meaningful library (hundreds, not thousands — 7,000 is aspirational and would be mostly noise)
- Each cluster needs: id, name, shortName, description, axes (mapped to new 32-line model), imageKey, color, emoji

### Priority 2: Wire Commitment Page into Live Site
- Build the frontend (React/TSX) for the commitment flow
- 8 spoken questions → transcription → bullet mirroring → sign → daily reminders
- Wire to existing backend (`server/db.ts` commitment section)

### Priority 3: UI Updates for New Lines
- Add stance lines to profile display
