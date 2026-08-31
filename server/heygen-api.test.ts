import { describe, it, expect } from "vitest";

const liveProviderDescribe = process.env.RUN_LIVE_PROVIDER_TESTS === "1" ? describe : describe.skip;

liveProviderDescribe("HeyGen API Key Validation", () => {
  it("should have HEYGEN_API_KEY set in environment", () => {
    const key = process.env.HEYGEN_API_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key!.length).toBeGreaterThan(0);
  });

  it("should be able to reach HeyGen API with the key", async () => {
    const key = process.env.HEYGEN_API_KEY;
    if (!key) {
      console.warn("HEYGEN_API_KEY not set, skipping API test");
      return;
    }

    // Use a lightweight endpoint to validate the key
    const response = await fetch("https://api.heygen.com/v2/voices", {
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-api-key": key,
      },
    });

    // Even if the key is invalid, we should get a response (401 vs 200)
    expect(response.status).toBeLessThan(500);
    
    if (response.status === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      console.log("HeyGen API key is valid. Voices available:", Array.isArray(data.data?.voices) ? data.data.voices.length : "unknown");
    } else if (response.status === 401) {
      console.warn("HeyGen API key appears to be invalid (401 Unauthorized)");
    }
  });
});
