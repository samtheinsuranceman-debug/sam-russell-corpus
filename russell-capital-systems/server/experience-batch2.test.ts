import { describe, it, expect } from "vitest";

describe("Ultra Domaine Batch 2 — Black Mirror, Social Narcotic, Endgame", () => {
  it("BlackMirror page exports a default component", async () => {
    const mod = await import("../client/src/pages/portal/BlackMirror");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("SocialNarcotic page exports a default component", async () => {
    const mod = await import("../client/src/pages/portal/SocialNarcotic");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("Endgame page exports a default component", async () => {
    const mod = await import("../client/src/pages/portal/Endgame");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("TAB_SCORES includes all 3 new experience routes", async () => {
    const { TAB_SCORES } = await import("../shared/tabScores");
    expect(TAB_SCORES["/portal/black-mirror"]).toBeGreaterThanOrEqual(9);
    expect(TAB_SCORES["/portal/social"]).toBeGreaterThanOrEqual(9);
    expect(TAB_SCORES["/portal/endgame"]).toBeGreaterThanOrEqual(9);
  });
});
