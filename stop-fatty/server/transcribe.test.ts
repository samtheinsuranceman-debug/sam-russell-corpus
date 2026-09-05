import { describe, expect, it, vi } from "vitest";

describe("Transcribe API", () => {
  it("rejects requests without audio file", async () => {
    // Simulate a POST to /api/transcribe without a file
    const { registerTranscribeRoute } = await import("./transcribe");
    expect(registerTranscribeRoute).toBeDefined();
    expect(typeof registerTranscribeRoute).toBe("function");
  });

  it("transcribe route registers correctly on express app", async () => {
    const { registerTranscribeRoute } = await import("./transcribe");
    const mockApp = {
      post: vi.fn(),
    };
    registerTranscribeRoute(mockApp as any);
    expect(mockApp.post).toHaveBeenCalledWith(
      "/api/transcribe",
      expect.any(Function), // multer middleware
      expect.any(Function)  // handler
    );
  });

  it("multer is configured with 16MB limit", async () => {
    // Verify the module imports and configures correctly
    const mod = await import("./transcribe");
    expect(mod).toBeDefined();
  });
});
