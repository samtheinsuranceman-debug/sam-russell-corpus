import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("onboarding tour route scope", () => {
  const source = readFileSync("client/src/components/OnboardingTour.tsx", "utf8");

  it("requires an authenticated user on the portal dashboard", () => {
    expect(source).toContain('location !== "/portal/dashboard"');
    expect(source).toContain("!isAuthenticated || !user");
  });

  it("closes itself when navigation leaves the dashboard", () => {
    expect(source).toContain("setVisible(false)");
    expect(source).toContain("[isAuthenticated, user, location]");
  });
});
