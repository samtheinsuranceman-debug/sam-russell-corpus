/**
 * Video Analysis Service — Platinum Tier
 * 
 * Uses multimodal LLM (Gemini) to analyze video recordings for:
 * 1. Body language patterns (posture, gestures, micro-expressions)
 * 2. Eye-accessing cues (NLP eye movement patterns)
 * 3. Behavioral fusion (congruence between verbal and nonverbal)
 * 
 * Architecture:
 * - Video is uploaded to S3 via storagePut
 * - Analysis is triggered via tRPC mutation
 * - LLM processes video frames + audio transcript
 * - Results are stored in video_assessments table
 */

// Vision (Platinum) needs a real multimodal model; imports the provider
// directly rather than the mock-fallback seam. Feature-flag off if unconfigured.
import { invokeLLM } from "./_core/llm";
import { saveVideoAnalysisResults, updateVideoAssessmentStatus } from "./db";

// ============================================================
// BODY LANGUAGE ANALYSIS
// ============================================================

const BODY_LANGUAGE_PROMPT = `You are an expert body language analyst trained in Paul Ekman's FACS (Facial Action Coding System), 
Albert Mehrabian's nonverbal communication research, and Joe Navarro's behavioral profiling.

Analyze the video/audio content and provide a structured assessment of:

1. **Overall Body Language Metrics** (0.0 to 1.0 scale):
   - openness: How open/closed is their posture and gesturing?
   - confidence: Level of self-assurance shown through posture, eye contact, voice
   - engagement: How actively engaged are they in the conversation?
   - dominance: Power dynamics expressed through space-taking, gesture size
   - nervousness: Self-soothing behaviors, fidgeting, voice tremors
   - congruence: How well does their body language match their words?

2. **Gesture Patterns**: Identify recurring gesture types (illustrators, adaptors, emblems, regulators)
   with frequency and typical context.

3. **Posture Shifts**: Note significant posture changes, what triggered them, and what they suggest.

4. **Micro-Expressions**: Any fleeting facial expressions (< 0.5s) that reveal concealed emotions.

Return JSON with this exact structure:
{
  "bodyLanguage": { "openness": 0.0-1.0, "confidence": 0.0-1.0, "engagement": 0.0-1.0, "dominance": 0.0-1.0, "nervousness": 0.0-1.0, "congruence": 0.0-1.0 },
  "gesturePatterns": [{ "type": "illustrator|adaptor|emblem|regulator", "frequency": "high|medium|low", "context": "description" }],
  "postureShifts": [{ "timestamp": "MM:SS", "from": "description", "to": "description", "trigger": "what prompted the shift" }],
  "microExpressions": [{ "timestamp": "MM:SS", "emotion": "name", "duration": "brief|flash", "intensity": 0.0-1.0 }]
}`;

// ============================================================
// EYE-ACCESSING CUE ANALYSIS (NLP)
// ============================================================

const EYE_PATTERN_PROMPT = `You are an expert in NLP (Neuro-Linguistic Programming) eye-accessing cues, 
trained in the Bandler-Grinder model of representational systems.

Analyze the video for eye movement patterns during speech and thought. In NLP, eye movements indicate 
which representational system a person is accessing:

- **Up-Right (VR)**: Visual Recall — remembering images
- **Up-Left (VC)**: Visual Construct — creating new images  
- **Level-Right (AR)**: Auditory Recall — remembering sounds
- **Level-Left (AC)**: Auditory Construct — creating new sounds/words
- **Down-Right (K)**: Kinesthetic — accessing feelings/body sensations
- **Down-Left (AD)**: Auditory Digital/Internal Dialogue — self-talk

Note: These are from the subject's perspective (standard right-handed pattern).

Provide:
1. **Eye Pattern Distribution** (percentage of time in each position)
2. **Dominant Access Pattern**: Which system they default to most
3. **Lead System**: The first eye movement before they begin speaking (indicates their primary processing entry point)
4. **Eye Movement Sequences**: For key moments, track the sequence of eye positions and interpret what processing is occurring

Return JSON:
{
  "eyePatterns": {
    "visualConstruct": 0-100,
    "visualRecall": 0-100,
    "auditoryConstruct": 0-100,
    "auditoryRecall": 0-100,
    "kinesthetic": 0-100,
    "internalDialogue": 0-100
  },
  "dominantAccessPattern": "visual_recall|visual_construct|auditory_recall|auditory_construct|kinesthetic|internal_dialogue",
  "leadSystem": "visual|auditory|kinesthetic|digital",
  "eyeMovementSequences": [
    { "context": "what was being discussed", "sequence": ["VR", "K", "AD"], "interpretation": "what this sequence reveals" }
  ]
}`;

// ============================================================
// BEHAVIORAL FUSION (Combined Video + Audio)
// ============================================================

const BEHAVIORAL_FUSION_PROMPT = `You are a behavioral profiling expert combining insights from:
- Paul Ekman (micro-expressions, emotional leakage)
- Joe Navarro (FBI behavioral analysis)
- NLP meta-programs and representational systems
- Albert Mehrabian (verbal/nonverbal congruence)

Given the video analysis results for body language and eye patterns, now synthesize a 
FULL BEHAVIORAL PROFILE that fuses all modalities (visual, auditory, kinesthetic signals).

Assess:
1. **Congruence Score** (0.0-1.0): How aligned are verbal content, tone, and body language?
2. **Authenticity Markers**: Signals of genuine vs. performed behavior
3. **Stress Indicators**: Moments of elevated stress and their triggers
4. **Rapport Signals**: Mirroring, matching, pacing behaviors
5. **Behavioral Profile Summary**: A comprehensive 200+ marker profile covering:
   - Communication style (direct/indirect, visual/auditory/kinesthetic language)
   - Decision-making patterns (toward/away, options/procedures)
   - Emotional regulation (suppression, expression, modulation)
   - Social orientation (self/other, matcher/mismatcher)
   - Energy patterns (proactive/reactive, high/low arousal)

6. **Axis Adjustments**: Based on the behavioral evidence, suggest adjustments to the 
   user's intelligence profile axes. Format: [{ axisIndex, adjustment (-0.15 to +0.15), reason }]

Return JSON:
{
  "congruenceScore": 0.0-1.0,
  "authenticityMarkers": [{ "marker": "description", "confidence": 0.0-1.0, "evidence": "what was observed" }],
  "stressIndicators": [{ "type": "vocal_tension|self_touch|gaze_aversion|speech_rate_change", "timestamp": "MM:SS", "intensity": 0.0-1.0 }],
  "rapportSignals": [{ "type": "mirroring|matching|pacing|leading", "frequency": "high|medium|low", "context": "description" }],
  "behavioralProfile": {
    "communicationStyle": { "directness": 0.0-1.0, "sensoryLanguage": "visual|auditory|kinesthetic|mixed", "abstractionLevel": 0.0-1.0 },
    "decisionMaking": { "towardAway": 0.0-1.0, "optionsProcedures": 0.0-1.0, "internalExternal": 0.0-1.0 },
    "emotionalRegulation": { "expressiveness": 0.0-1.0, "stability": 0.0-1.0, "recovery": 0.0-1.0 },
    "socialOrientation": { "selfOther": 0.0-1.0, "matchMismatch": 0.0-1.0, "influenceStyle": "push|pull|balanced" },
    "energyPatterns": { "proactiveReactive": 0.0-1.0, "arousalLevel": 0.0-1.0, "sustainedFocus": 0.0-1.0 },
    "markerCount": 200
  },
  "axisAdjustments": [{ "axisIndex": 0, "adjustment": -0.15, "reason": "explanation" }]
}`;

// ============================================================
// MAIN ANALYSIS PIPELINE
// ============================================================

export interface VideoAnalysisInput {
  videoAssessmentId: number;
  videoUrl: string;
  audioTranscript?: string;
}

/**
 * Run the full video analysis pipeline.
 * This is called asynchronously after video upload.
 */
export async function runVideoAnalysis(input: VideoAnalysisInput): Promise<void> {
  const { videoAssessmentId, videoUrl, audioTranscript } = input;

  try {
    await updateVideoAssessmentStatus(videoAssessmentId, "processing");

    // Step 1: Body Language Analysis
    const bodyResult = await invokeLLM({
      messages: [
        { role: "system", content: BODY_LANGUAGE_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this video recording for body language patterns.${audioTranscript ? `\n\nTranscript for context:\n${audioTranscript}` : ""}` },
            { type: "file_url", file_url: { url: videoUrl, mime_type: "video/mp4" } },
          ],
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "body_language", strict: false, schema: { type: "object" } } },
    });

    let bodyData: any = {};
    try {
      const bodyContent = bodyResult.choices[0]?.message?.content;
      const bodyText = typeof bodyContent === "string" ? bodyContent : (bodyContent as any)?.[0]?.text || "{}";
      bodyData = JSON.parse(bodyText);
    } catch { /* fallback to empty */ }

    // Step 2: Eye-Accessing Cue Analysis
    const eyeResult = await invokeLLM({
      messages: [
        { role: "system", content: EYE_PATTERN_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this video for NLP eye-accessing cue patterns. Focus on eye movements during speech and thought pauses.${audioTranscript ? `\n\nTranscript:\n${audioTranscript}` : ""}` },
            { type: "file_url", file_url: { url: videoUrl, mime_type: "video/mp4" } },
          ],
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "eye_patterns", strict: false, schema: { type: "object" } } },
    });

    let eyeData: any = {};
    try {
      const eyeContent = eyeResult.choices[0]?.message?.content;
      const eyeText = typeof eyeContent === "string" ? eyeContent : (eyeContent as any)?.[0]?.text || "{}";
      eyeData = JSON.parse(eyeText);
    } catch { /* fallback to empty */ }

    // Step 3: Behavioral Fusion (uses results from steps 1 & 2)
    const fusionResult = await invokeLLM({
      messages: [
        { role: "system", content: BEHAVIORAL_FUSION_PROMPT },
        {
          role: "user",
          content: `Based on the following analysis results, create a full behavioral fusion profile.

Body Language Analysis:
${JSON.stringify(bodyData, null, 2)}

Eye-Accessing Cue Analysis:
${JSON.stringify(eyeData, null, 2)}

${audioTranscript ? `Audio Transcript:\n${audioTranscript}` : "No transcript available."}

Synthesize all modalities into a comprehensive behavioral profile.`,
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "behavioral_fusion", strict: false, schema: { type: "object" } } },
    });

    let fusionData: any = {};
    try {
      const fusionContent = fusionResult.choices[0]?.message?.content;
      const fusionText = typeof fusionContent === "string" ? fusionContent : (fusionContent as any)?.[0]?.text || "{}";
      fusionData = JSON.parse(fusionText);
    } catch { /* fallback to empty */ }

    // Save all results to database
    await saveVideoAnalysisResults(videoAssessmentId, {
      bodyLanguage: bodyData.bodyLanguage ?? null,
      gesturePatterns: bodyData.gesturePatterns ?? null,
      postureShifts: bodyData.postureShifts ?? null,
      microExpressions: bodyData.microExpressions ?? null,
      eyePatterns: eyeData.eyePatterns ?? null,
      dominantAccessPattern: eyeData.dominantAccessPattern ?? null,
      eyeMovementSequences: eyeData.eyeMovementSequences ?? null,
      leadSystem: eyeData.leadSystem ?? null,
      congruenceScore: fusionData.congruenceScore ?? null,
      authenticityMarkers: fusionData.authenticityMarkers ?? null,
      stressIndicators: fusionData.stressIndicators ?? null,
      rapportSignals: fusionData.rapportSignals ?? null,
      behavioralProfile: fusionData.behavioralProfile ?? null,
      axisAdjustments: fusionData.axisAdjustments ?? null,
    });

  } catch (error: any) {
    await updateVideoAssessmentStatus(videoAssessmentId, "failed", error.message || "Unknown error");
    throw error;
  }
}
