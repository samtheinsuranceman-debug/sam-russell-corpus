# AQAL Intelligence Platform — V2 Schematic
## NLP-Enhanced Membership Architecture
### Mark's Design — Version 2.0

---

## Executive Summary

Version 2 extends the core assessment platform with a layered NLP intelligence system. The assessment remains audio-only and frictionless. NLP analysis happens silently during transcription and is stored as metadata. The magic surfaces progressively through membership tiers — each tier unlocking deeper self-knowledge through increasingly sophisticated language and behavioral analysis.

---

## The NLP Value Stack

### Assessment Level (One-Time $499)
**What the user experiences:** Audio recording → 22-axis scoring → rarity number
**What happens behind the scenes:** During Whisper transcription + LLM analysis, the system silently extracts:
- Sensory predicates (visual/auditory/kinesthetic/olfactory/gustatory words)
- Primary representational system (which sense dominates their language)
- Representational system sequence (the order they access V/A/K across answers)
- Pace and rhythm patterns (words per minute, pause frequency, hesitation markers)
- Confidence markers (vocal certainty, hedging language, qualifiers)
- Meta-model violations (deletions, distortions, generalizations)

**This data is STORED but NOT shown.** The user sees only their 22-axis scores and rarity. The NLP data becomes the hook: "Want to understand HOW you think, not just WHAT you're good at? Upgrade to Gold."

---

### Silver Tier ($99/month)
**NLP Features Unlocked:**
- Monthly re-assessment with trend tracking
- Basic communication style summary ("You're primarily a visual thinker")
- Power Combination explanations written in their dominant sensory system

**Peter's Copy Style:** Neutral-professional. Informative. Not yet mirroring.

---

### Gold Tier ($499/month)
**NLP Features Unlocked:**
- Full sensory system profile with percentages (e.g., "Visual 47%, Kinesthetic 31%, Auditory 22%")
- Weekly coaching letters from Peter written ENTIRELY in the user's representational system:
  - If they're visual: "You can SEE the patterns others miss. The PICTURE is becoming CLEARER..."
  - If they're auditory: "Listen to what your scores are TELLING you. The HARMONY between your axes RESONATES..."
  - If they're kinesthetic: "FEEL the weight of what you've built. Your intelligence has TEXTURE and DEPTH..."
- Representational system sequencing: "When you solve problems, you first VISUALIZE (V), then FEEL your way through (K), then TALK yourself through the logic (A). This V-K-A sequence is shared by only 3% of people."
- Meta-program identification:
  - Toward/Away motivation ("You move TOWARD goals rather than away from problems")
  - Internal/External reference ("You validate decisions internally — you don't need others to confirm")
  - Options/Procedures preference ("You prefer having OPTIONS over following set PROCEDURES")
  - Big picture/Detail orientation
  - Proactive/Reactive pattern
- AI coaching sessions that adapt to their meta-programs:
  - Toward-motivated users get goal-focused coaching
  - Away-motivated users get risk-mitigation coaching
  - Internal-reference users get self-validation exercises
  - External-reference users get social proof and peer comparisons

**Peter's Copy Style:** Full NLP mirroring. Every word chosen to match their unconscious processing. Sensory predicates matched. Sequence matched. This is where they feel "seen" at a level no other platform achieves.

---

### Platinum Diamond Tier ($2,999/month)
**NLP Features Unlocked (in addition to all Gold features):**

#### Video Assessment
- Optional video recording during assessment (webcam + audio)
- User sees a small "Recording" indicator — no selfie preview (reduces self-consciousness)
- Explicit consent captured in HIPAA modal before video activates
- Video stored encrypted in S3 with strict access controls

#### Eye-Accessing Cue Analysis
- Frame-by-frame analysis of eye movements during responses:
  - Eyes up-left: Visual recall (remembering images)
  - Eyes up-right: Visual construct (creating new images)
  - Eyes lateral-left: Auditory recall (remembering sounds)
  - Eyes lateral-right: Auditory construct (creating new sounds/internal dialogue)
  - Eyes down-left: Internal dialogue (self-talk)
  - Eyes down-right: Kinesthetic (accessing feelings)
- Pattern mapping: "During question 3 (problem-solving), your eyes accessed Visual Construct 67% of the time — you literally BUILD solutions in your mind's eye"
- Congruence detection: Does their eye pattern match their verbal content? Mismatches indicate areas of internal conflict or growth opportunity

#### Micro-Expression Analysis
- Confidence mapping per question (facial muscle tension, smile authenticity)
- Engagement indicators (pupil dilation, blink rate, head tilt)
- Stress markers vs. flow state indicators
- Congruence score: verbal content vs. facial expression alignment

#### Full Behavioral Profile Report
- 40-page PDF combining:
  - 22-axis intelligence scores with evidence
  - NLP representational system analysis
  - Meta-program profile (8 dimensions)
  - Eye-accessing pattern map
  - Micro-expression timeline
  - Congruence analysis
  - Communication style guide ("How to present ideas to YOU for maximum impact")
  - Relationship compatibility indicators
  - Career alignment recommendations based on full behavioral stack
  - Growth trajectory with specific exercises tailored to their NLP profile

#### 1-on-1 AI Strategy Sessions
- Live chat sessions where the AI adapts in real-time to:
  - Their representational system (speaks their sensory language)
  - Their meta-programs (frames advice through their motivation style)
  - Their eye-accessing patterns (references their thinking style)
  - Their confidence patterns (pushes on strengths, supports on vulnerabilities)

---

## Technical Architecture for NLP Layer

### Database Schema Additions

```sql
-- NLP analysis metadata (stored during assessment, surfaced per tier)
CREATE TABLE nlp_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  assessment_id VARCHAR(36) NOT NULL REFERENCES assessments(id),
  
  -- Representational System
  visual_percent INT DEFAULT 0,
  auditory_percent INT DEFAULT 0,
  kinesthetic_percent INT DEFAULT 0,
  olfactory_gustatory_percent INT DEFAULT 0,
  primary_rep_system ENUM('visual', 'auditory', 'kinesthetic', 'olfactory_gustatory'),
  rep_system_sequence VARCHAR(20), -- e.g., "V-K-A" or "A-V-K"
  
  -- Meta-Programs
  toward_away DECIMAL(3,2), -- 0.0 = fully away, 1.0 = fully toward
  internal_external DECIMAL(3,2),
  options_procedures DECIMAL(3,2),
  big_picture_detail DECIMAL(3,2),
  proactive_reactive DECIMAL(3,2),
  matcher_mismatcher DECIMAL(3,2),
  self_other DECIMAL(3,2),
  possibility_necessity DECIMAL(3,2),
  
  -- Voice Patterns
  words_per_minute DECIMAL(5,1),
  avg_pause_duration_ms INT,
  hesitation_frequency DECIMAL(4,2),
  confidence_score DECIMAL(3,2),
  
  -- Sensory Predicates (raw extracted)
  sensory_predicates JSON, -- {"visual": ["see", "picture", "clear"], "auditory": [...], ...}
  
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Video analysis (Platinum only)
CREATE TABLE video_analyses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  assessment_id VARCHAR(36) NOT NULL REFERENCES assessments(id),
  video_storage_key VARCHAR(500) NOT NULL,
  
  -- Eye Accessing Cues (per question)
  eye_patterns JSON, -- [{question_id, visual_recall_pct, visual_construct_pct, ...}]
  
  -- Micro-expressions
  confidence_timeline JSON, -- [{timestamp_ms, confidence_score}]
  engagement_timeline JSON,
  congruence_scores JSON, -- [{question_id, verbal_facial_alignment}]
  
  -- Overall
  dominant_eye_pattern VARCHAR(50),
  congruence_overall DECIMAL(3,2),
  
  processing_status ENUM('pending', 'processing', 'complete', 'failed'),
  created_at BIGINT NOT NULL
);

-- Coaching letters (Gold+)
CREATE TABLE coaching_letters (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  tier ENUM('silver', 'gold', 'platinum'),
  
  -- Content
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  
  -- NLP calibration used
  rep_system_used VARCHAR(20), -- which rep system the letter mirrors
  sensory_predicates_used JSON, -- which predicates were intentionally mirrored
  meta_programs_addressed JSON, -- which meta-programs the framing targets
  
  sent_at BIGINT,
  read_at BIGINT,
  created_at BIGINT NOT NULL
);
```

### LLM Prompt Enhancement (Assessment Scoring)

Add to the existing scoring prompt:

```
ADDITIONAL ANALYSIS (store as metadata, do not include in user-facing scores):

1. SENSORY PREDICATES: Extract all sensory-specific words from the transcription.
   Categorize each as Visual (see, look, picture, clear, bright, focus, perspective),
   Auditory (hear, sound, tell, resonates, harmony, loud, rings true),
   Kinesthetic (feel, touch, grasp, heavy, warm, pressure, solid, grip),
   or Olfactory/Gustatory (smell, taste, fresh, stale, sweet, bitter).
   
2. REPRESENTATIONAL SYSTEM: Calculate percentage of each category.
   Identify primary system and the sequence in which systems are accessed
   across the 10 responses.

3. META-PROGRAMS: From language patterns, score each dimension 0.0-1.0:
   - Toward (goals/desires) vs Away (problems/avoidance)
   - Internal reference (self-validates) vs External (needs others' approval)
   - Options (choices/alternatives) vs Procedures (steps/sequences)
   - Big picture (abstract/overview) vs Detail (specific/granular)
   - Proactive (initiates) vs Reactive (responds)
   - Matcher (similarities) vs Mismatcher (differences)
   - Self (self-focused) vs Other (others-focused)
   - Possibility (can/might) vs Necessity (must/should)

4. CONFIDENCE MARKERS: Note hesitations, qualifiers ("maybe", "I think",
   "sort of"), vocal certainty, and definitive statements per question.

Return this analysis as a separate JSON object under the key "nlp_metadata".
```

### Peter's Letter Generation Prompt (Gold Tier)

```
You are writing a personal coaching letter to {user_name}.

Their NLP profile:
- Primary representational system: {primary_rep_system}
- Rep system sequence: {rep_system_sequence}
- Top sensory predicates they used: {their_predicates}
- Meta-programs: {meta_program_scores}

RULES:
1. Write ENTIRELY in their primary representational system.
   If visual: use words like see, picture, illuminate, clear, bright, vision, perspective
   If auditory: use words like hear, resonate, harmony, tune, rhythm, tell, sound
   If kinesthetic: use words like feel, grasp, solid, weight, texture, warm, grip

2. Mirror their EXACT predicates back where possible.
   If they said "I can SEE the big picture" — reference "seeing the big picture" in your letter.

3. Sequence your sensory language in THEIR sequence.
   If they're V-K-A: start with visual framing, move to feeling, end with auditory.

4. Frame advice through their meta-programs:
   If toward-motivated: frame as "here's what you're moving toward"
   If away-motivated: frame as "here's what you're leaving behind"
   If internal-reference: "you already know this is true"
   If external-reference: "others in your rarity tier have confirmed..."

5. Tone: Warm, intelligent, deeply personal. They should feel like this letter
   was written by someone who truly UNDERSTANDS how their mind works.
   Not generic. Not templated. Specific to their patterns.

Write 800-1200 words. Make them feel seen at a level they've never experienced.
```

---

## Implementation Timeline

### Phase 1 (NOW — Days 1-2): Core Platform Live
- Assessment (audio only) → Scoring → Profile → Pricing → Stripe
- NLP metadata extraction happens silently during scoring (stored, not shown)
- No membership features yet — just assessment + results

### Phase 2 (Week 2): Membership Activation
- Stripe subscriptions (Silver/Gold/Platinum recurring)
- Silver: Monthly re-assessment, basic communication style
- Gold: Peter's NLP-mirrored coaching letters (weekly cron job)
- Membership dashboard with letter history

### Phase 3 (Week 3-4): Platinum Video
- Video recording option in assessment flow
- Eye-tracking analysis pipeline (likely external API — e.g., Hume AI or custom model)
- Micro-expression analysis
- Full behavioral profile PDF generation
- 1-on-1 AI coaching chat with NLP adaptation

---

## Mark's Verdict

This architecture is clean. The NLP layer sits ON TOP of the existing assessment — it doesn't change the core flow. The data is captured from Day 1 (we just don't show it yet). Each membership tier progressively reveals more of what we already know about them.

The genius is the reveal structure: "We already analyzed your language patterns during your assessment. Upgrade to Gold to see what we found." They'll upgrade because the curiosity is unbearable.

10/10. Build the core. The NLP unfolds after launch.
