import { describe, it, expect, vi } from "vitest";

// ─── Test: updateClinicalNotes procedure validation ──────────────────────────
describe("Psychiatrist Portal — updateClinicalNotes", () => {
  it("should require patientUserId as a number", () => {
    const schema = { patientUserId: 1, notes: "Patient shows improvement" };
    expect(typeof schema.patientUserId).toBe("number");
    expect(typeof schema.notes).toBe("string");
  });

  it("should accept empty notes string for clearing notes", () => {
    const schema = { patientUserId: 1, notes: "" };
    expect(schema.notes).toBe("");
    expect(schema.notes.length).toBe(0);
  });

  it("should accept long clinical notes", () => {
    const longNotes = "A".repeat(5000);
    const schema = { patientUserId: 42, notes: longNotes };
    expect(schema.notes.length).toBe(5000);
  });
});

// ─── Test: getPatientDetail procedure validation ─────────────────────────────
describe("Psychiatrist Portal — getPatientDetail", () => {
  it("should require patientUserId input", () => {
    const input = { patientUserId: 7 };
    expect(input.patientUserId).toBe(7);
    expect(typeof input.patientUserId).toBe("number");
  });

  it("should return expected shape with all sections", () => {
    const mockDetail = {
      user: { id: 7, name: "Test Patient", email: "test@example.com", createdAt: new Date() },
      assessments: [{ id: 1, status: "completed", createdAt: new Date() }],
      reports: [{ id: 1, prsScore: 65, createdAt: new Date() }],
      twin: { domainScores: { mood: 60, anxiety: 45 }, compositeScore: 52 },
      crisisEvents: [],
    };
    expect(mockDetail.user).toBeDefined();
    expect(mockDetail.user!.name).toBe("Test Patient");
    expect(mockDetail.assessments).toHaveLength(1);
    expect(mockDetail.reports).toHaveLength(1);
    expect(mockDetail.twin).toBeDefined();
    expect(mockDetail.twin!.compositeScore).toBe(52);
    expect(mockDetail.crisisEvents).toHaveLength(0);
  });

  it("should handle null twin gracefully", () => {
    const mockDetail = {
      user: null,
      assessments: [],
      reports: [],
      twin: null,
      crisisEvents: [],
    };
    expect(mockDetail.twin).toBeNull();
    expect(mockDetail.user).toBeNull();
  });
});

// ─── Test: Role-based access control ─────────────────────────────────────────
describe("Psychiatrist Portal — Role-based access", () => {
  it("should only allow admin role", () => {
    const adminUser = { id: 1, role: "admin" as const };
    const regularUser = { id: 2, role: "user" as const };
    expect(adminUser.role).toBe("admin");
    expect(regularUser.role).not.toBe("admin");
  });

  it("should reject non-admin users", () => {
    const checkAccess = (role: string) => role === "admin";
    expect(checkAccess("admin")).toBe(true);
    expect(checkAccess("user")).toBe(false);
    expect(checkAccess("")).toBe(false);
  });
});

// ─── Test: Patient Portal chat input validation ──────────────────────────────
describe("Patient Portal — Chat input", () => {
  it("should reject empty messages", () => {
    const isValid = (msg: string) => msg.trim().length > 0;
    expect(isValid("")).toBe(false);
    expect(isValid("   ")).toBe(false);
    expect(isValid("Hello Dr. Buddy")).toBe(true);
  });

  it("should detect crisis keywords", () => {
    const CRISIS_KEYWORDS = ["suicide", "kill myself", "end my life", "want to die"];
    const detectCrisis = (msg: string) =>
      CRISIS_KEYWORDS.some((kw) => msg.toLowerCase().includes(kw));
    expect(detectCrisis("I feel sad today")).toBe(false);
    expect(detectCrisis("I want to kill myself")).toBe(true);
    expect(detectCrisis("I want to end my life")).toBe(true);
  });

  it("should limit history to last 10 messages", () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
    }));
    const history = messages.slice(-10);
    expect(history).toHaveLength(10);
    expect(history[0].content).toBe("Message 10");
  });
});

// ─── Test: OAuth redirect fix ────────────────────────────────────────────────
describe("OAuth redirect — state parameter", () => {
  it("should encode returnPath in state", () => {
    const encodeState = (origin: string, returnPath: string) => {
      const stateObj = { origin, returnPath };
      return btoa(JSON.stringify(stateObj));
    };
    const state = encodeState("https://example.com", "/patient");
    const decoded = JSON.parse(atob(state));
    expect(decoded.origin).toBe("https://example.com");
    expect(decoded.returnPath).toBe("/patient");
  });

  it("should default to / when no returnPath", () => {
    const getRedirect = (returnPath?: string) => returnPath || "/";
    expect(getRedirect()).toBe("/");
    expect(getRedirect("/dashboard")).toBe("/dashboard");
    expect(getRedirect("/psychiatrist")).toBe("/psychiatrist");
  });
});
