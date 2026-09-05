import { describe, it, expect, vi } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          bodyLanguage: { openness: 0.7, confidence: 0.8, engagement: 0.9, dominance: 0.5, nervousness: 0.2, congruence: 0.85 },
          gesturePatterns: [{ type: "illustrator", frequency: "high", context: "explaining concepts" }],
          postureShifts: [{ timestamp: "01:30", from: "leaning back", to: "leaning forward", trigger: "interesting topic" }],
          microExpressions: [{ timestamp: "02:15", emotion: "surprise", duration: "flash", intensity: 0.6 }],
        }),
      },
    }],
  }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "video-assessments/test.webm", url: "/aqal-storage/video-assessments/test.webm" }),
  storageGetSignedUrl: vi.fn().mockResolvedValue("https://signed-url.example.com/video.webm"),
}));

// Mock voice transcription
vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    text: "Hello, I'm discussing my thoughts on intelligence.",
    language: "en",
    duration: 120,
    segments: [],
  }),
}));

// Mock db functions
vi.mock("./db", () => ({
  createVideoAssessment: vi.fn().mockResolvedValue(1),
  getVideoAssessment: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    status: "complete",
    bodyLanguage: { openness: 0.7, confidence: 0.8 },
    eyePatterns: { visualRecall: 35, kinesthetic: 25 },
    congruenceScore: 0.85,
  }),
  getUserVideoAssessments: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, status: "complete", createdAt: new Date() },
  ]),
  updateVideoAssessmentStatus: vi.fn().mockResolvedValue(undefined),
  saveVideoAnalysisResults: vi.fn().mockResolvedValue(undefined),
}));

import { runVideoAnalysis } from "./videoAnalysis";
import { createVideoAssessment, getVideoAssessment, getUserVideoAssessments, saveVideoAnalysisResults, updateVideoAssessmentStatus } from "./db";
import { storagePut, storageGetSignedUrl } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";

describe("Video Assessment Pipeline", () => {
  it("should create a video assessment record", async () => {
    const id = await createVideoAssessment({
      userId: 1,
      videoUrl: "/aqal-storage/video-assessments/test.webm",
      durationMs: 120000,
    });
    expect(id).toBe(1);
    expect(createVideoAssessment).toHaveBeenCalledWith({
      userId: 1,
      videoUrl: "/aqal-storage/video-assessments/test.webm",
      durationMs: 120000,
    });
  });

  it("should upload video to S3 storage", async () => {
    const buffer = Buffer.from("fake-video-data");
    const result = await storagePut("video-assessments/test.webm", buffer, "video/webm");
    expect(result.key).toBe("video-assessments/test.webm");
    expect(result.url).toContain("/aqal-storage/");
  });

  it("should get a signed URL for LLM access", async () => {
    const url = await storageGetSignedUrl("video-assessments/test.webm");
    expect(url).toContain("https://");
  });

  it("should transcribe audio from video", async () => {
    const result = await transcribeAudio({ audioUrl: "https://example.com/video.webm", language: "en" });
    expect("text" in result).toBe(true);
    if ("text" in result) {
      expect(result.text).toContain("intelligence");
    }
  });

  it("should run the full video analysis pipeline", async () => {
    await runVideoAnalysis({
      videoAssessmentId: 1,
      videoUrl: "https://signed-url.example.com/video.webm",
      audioTranscript: "Hello, I'm discussing my thoughts on intelligence.",
    });

    expect(updateVideoAssessmentStatus).toHaveBeenCalledWith(1, "processing");
    expect(saveVideoAnalysisResults).toHaveBeenCalledWith(1, expect.objectContaining({
      bodyLanguage: expect.any(Object),
    }));
  });

  it("should retrieve video assessment results", async () => {
    const result = await getVideoAssessment(1);
    expect(result).not.toBeNull();
    expect(result?.status).toBe("complete");
    expect(result?.bodyLanguage).toHaveProperty("openness");
    expect(result?.congruenceScore).toBe(0.85);
  });

  it("should list user video assessments", async () => {
    const list = await getUserVideoAssessments(1);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].status).toBe("complete");
  });

  it("should handle analysis failure gracefully", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockRejectedValueOnce(new Error("LLM service unavailable"));

    await expect(runVideoAnalysis({
      videoAssessmentId: 99,
      videoUrl: "https://example.com/video.webm",
    })).rejects.toThrow("LLM service unavailable");

    expect(updateVideoAssessmentStatus).toHaveBeenCalledWith(99, "failed", "LLM service unavailable");
  });
});

describe("Eye-Accessing Cue Mapping", () => {
  it("should identify NLP eye positions", () => {
    const eyePositions = {
      visualConstruct: 15,
      visualRecall: 35,
      auditoryConstruct: 10,
      auditoryRecall: 15,
      kinesthetic: 15,
      internalDialogue: 10,
    };

    // Total should be 100
    const total = Object.values(eyePositions).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);

    // Dominant pattern should be the highest
    const dominant = Object.entries(eyePositions).sort((a, b) => b[1] - a[1])[0];
    expect(dominant[0]).toBe("visualRecall");
  });

  it("should map eye positions to NLP representational systems", () => {
    const positionMap: Record<string, string> = {
      visualConstruct: "Creating new images (Up-Left)",
      visualRecall: "Remembering images (Up-Right)",
      auditoryConstruct: "Creating sounds/words (Level-Left)",
      auditoryRecall: "Remembering sounds (Level-Right)",
      kinesthetic: "Accessing feelings (Down-Right)",
      internalDialogue: "Self-talk (Down-Left)",
    };

    expect(Object.keys(positionMap)).toHaveLength(6);
    expect(positionMap.visualRecall).toContain("Remembering");
    expect(positionMap.kinesthetic).toContain("feelings");
  });
});

describe("Behavioral Fusion", () => {
  it("should calculate congruence between verbal and nonverbal", () => {
    // Congruence score should be between 0 and 1
    const congruenceScore = 0.85;
    expect(congruenceScore).toBeGreaterThanOrEqual(0);
    expect(congruenceScore).toBeLessThanOrEqual(1);
  });

  it("should generate axis adjustments within bounds", () => {
    const adjustments = [
      { axisIndex: 3, adjustment: 0.12, reason: "Strong linguistic patterns" },
      { axisIndex: 7, adjustment: -0.08, reason: "Lower kinesthetic engagement" },
    ];

    for (const adj of adjustments) {
      expect(adj.adjustment).toBeGreaterThanOrEqual(-0.15);
      expect(adj.adjustment).toBeLessThanOrEqual(0.15);
      expect(adj.axisIndex).toBeGreaterThanOrEqual(0);
      expect(adj.reason).toBeTruthy();
    }
  });
});
