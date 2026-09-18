import { describe, it, expect } from "vitest";

/**
 * Smoke tests for the Ultra Domaine Experience pages.
 * Verifies that all 5 new pages export default components and that
 * the navigation configuration includes the new section.
 */

describe("Ultra Domaine Experience Pages", () => {
  it("NerveCenter exports a default component", async () => {
    const mod = await import("../client/src/pages/portal/NerveCenter");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("Arena exports a default component", async () => {
    const mod = await import("../client/src/pages/portal/Arena");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("MyWorld exports a default component", async () => {
    const mod = await import("../client/src/pages/portal/MyWorld");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("WarRoom exports a default component", async () => {
    const mod = await import("../client/src/pages/portal/WarRoom");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("RewardsVault exports a default component", async () => {
    const mod = await import("../client/src/pages/portal/RewardsVault");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("tabScores includes all 5 Experience paths", async () => {
    const { TAB_SCORES } = await import("../shared/tabScores");
    const experiencePaths = [
      "/portal/nerve-center",
      "/portal/arena",
      "/portal/my-world",
      "/portal/war-room",
      "/portal/rewards",
    ];
    for (const path of experiencePaths) {
      expect(TAB_SCORES[path]).toBeDefined();
      expect(TAB_SCORES[path]).toBeGreaterThanOrEqual(9);
    }
  });
});
