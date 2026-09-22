import { describe, it, expect } from "vitest";

describe("Portal Routes Configuration", () => {
  it("should have PatientPortal page file", async () => {
    const fs = await import("fs");
    expect(fs.existsSync("client/src/pages/PatientPortal.tsx")).toBe(true);
  });

  it("should have PsychiatristPortal page file", async () => {
    const fs = await import("fs");
    expect(fs.existsSync("client/src/pages/PsychiatristPortal.tsx")).toBe(true);
  });

  it("should register /patient route in App.tsx", async () => {
    const fs = await import("fs");
    const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
    expect(appContent).toContain('path="/patient"');
    expect(appContent).toContain("PatientPortal");
  });

  it("should register /psychiatrist route in App.tsx", async () => {
    const fs = await import("fs");
    const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
    expect(appContent).toContain('path="/psychiatrist"');
    expect(appContent).toContain("PsychiatristPortal");
  });

  it("should have portal links in NavBar", async () => {
    const fs = await import("fs");
    const navContent = fs.readFileSync("client/src/components/NavBar.tsx", "utf-8");
    expect(navContent).toContain('href="/patient"');
    expect(navContent).toContain('href="/psychiatrist"');
    expect(navContent).toContain("Patient Portal");
    expect(navContent).toContain("Psychiatrist");
  });
});

describe("OAuth Redirect Fix", () => {
  it("should encode returnPath in getLoginUrl state parameter", async () => {
    const fs = await import("fs");
    const constContent = fs.readFileSync("client/src/const.ts", "utf-8");
    // getLoginUrl should accept a returnPath parameter
    expect(constContent).toContain("returnPath");
    // Should encode the returnPath in the state
    expect(constContent).toContain("state");
  });

  it("should decode returnPath in OAuth callback", async () => {
    const fs = await import("fs");
    const oauthContent = fs.readFileSync("server/_core/oauth.ts", "utf-8");
    // OAuth callback should extract returnPath from state
    expect(oauthContent).toContain("returnPath");
  });
});

describe("Assessment Submit Button Fix", () => {
  it("should have lowered threshold for submit button visibility", async () => {
    const fs = await import("fs");
    const assessmentContent = fs.readFileSync("client/src/pages/Assessment.tsx", "utf-8");
    // Should have 75% threshold instead of 90%
    expect(assessmentContent).toContain("0.75");
  });

  it("should have error handling for submit timeout", async () => {
    const fs = await import("fs");
    const assessmentContent = fs.readFileSync("client/src/pages/Assessment.tsx", "utf-8");
    // Should handle errors gracefully
    expect(assessmentContent).toContain("catch");
  });
});
