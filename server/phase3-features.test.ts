import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Slide Themes ──────────────────────────────────────────────────────
describe("Slide Themes", () => {
  it("exports 4 themes with required fields", async () => {
    const { SLIDE_THEMES } = await import("../shared/slideThemes");
    expect(SLIDE_THEMES.length).toBe(4);
    for (const theme of SLIDE_THEMES) {
      expect(theme.id).toBeTruthy();
      expect(theme.name).toBeTruthy();
      expect(theme.bgColor).toBeTruthy();
      expect(theme.textColor).toBeTruthy();
      expect(theme.accentColor).toBeTruthy();
      expect(theme.titleFont).toBeTruthy();
      expect(theme.bodyFont).toBeTruthy();
    }
  });

  it("getThemeById returns correct theme or fallback", async () => {
    const { getThemeById, DEFAULT_THEME_ID } = await import("../shared/slideThemes");
    const exec = getThemeById("executive-dark");
    expect(exec.id).toBe("executive-dark");
    const clean = getThemeById("clean-light");
    expect(clean.id).toBe("clean-light");
    const fallback = getThemeById("nonexistent");
    expect(fallback.id).toBeTruthy(); // returns first theme as fallback
  });

  it("DEFAULT_THEME_ID is executive-dark", async () => {
    const { DEFAULT_THEME_ID } = await import("../shared/slideThemes");
    expect(DEFAULT_THEME_ID).toBe("executive-dark");
  });

  it("each theme has previewGradient for UI", async () => {
    const { SLIDE_THEMES } = await import("../shared/slideThemes");
    for (const theme of SLIDE_THEMES) {
      expect(theme.previewGradient).toBeTruthy();
      expect(theme.previewGradient).toContain("gradient");
    }
  });
});

// ── Managed OAuth Owner Authorization ────────────────────────────────
describe("Managed OAuth Owner Authorization", () => {
  it("does not derive authorization from an email string", async () => {
    const { isOwnerBypassEmail } = await import("../shared/accessControl");
    expect(isOwnerBypassEmail("samtheinsuranceman@gmail.com")).toBe(false);
    expect(isOwnerBypassEmail("sam@russellcapitalsystems.com")).toBe(false);
    expect(isOwnerBypassEmail("SAMTHEINSURANCEMAN@GMAIL.COM")).toBe(false);
    expect(isOwnerBypassEmail("random@example.com")).toBe(false);
  });

  it("keeps the legacy owner-email allowlist empty", async () => {
    const { OWNER_BYPASS_EMAILS } = await import("../shared/accessControl");
    expect(OWNER_BYPASS_EMAILS).toEqual([]);
  });
});

// ── Slide Collaboration DB Helpers ────────────────────────────────────
describe("Slide Collaboration DB Helpers", () => {
  it("addSlideComment is a function", async () => {
    const db = await import("./db");
    expect(typeof db.addSlideComment).toBe("function");
  });

  it("getSlideComments is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getSlideComments).toBe("function");
  });

  it("createSlideShare is a function", async () => {
    const db = await import("./db");
    expect(typeof db.createSlideShare).toBe("function");
  });

  it("getSlideShares is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getSlideShares).toBe("function");
  });

  it("deleteSlideShare is a function", async () => {
    const db = await import("./db");
    expect(typeof db.deleteSlideShare).toBe("function");
  });
});

// ── IP Trust DB Helpers ───────────────────────────────────────────────
describe("IP Trust DB Helpers", () => {
  it("addOwnerTrustedIp is a function", async () => {
    const db = await import("./db");
    expect(typeof db.addOwnerTrustedIp).toBe("function");
  });

  it("getOwnerTrustedIps is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getOwnerTrustedIps).toBe("function");
  });

  it("removeOwnerTrustedIp is a function", async () => {
    const db = await import("./db");
    expect(typeof db.removeOwnerTrustedIp).toBe("function");
  });
});

// ── Owner Analytics DB Helpers ────────────────────────────────────────
describe("Owner Analytics DB Helpers", () => {
  it("getOwnerAnalyticsSummary is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getOwnerAnalyticsSummary).toBe("function");
  });

  it("getTopPages is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getTopPages).toBe("function");
  });

  it("getRecentLogins is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getRecentLogins).toBe("function");
  });

  it("getConversionFunnel is a function", async () => {
    const db = await import("./db");
    expect(typeof db.getConversionFunnel).toBe("function");
  });
});

// ── Schema Tables ─────────────────────────────────────────────────────
describe("Schema Tables", () => {
  it("ownerTrustedIps table exists in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.ownerTrustedIps).toBeTruthy();
  });

  it("slideComments table exists in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.slideComments).toBeTruthy();
  });

  it("slideShares table exists in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.slideShares).toBeTruthy();
  });

  it("savedSlideDecks table exists in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.savedSlideDecks).toBeTruthy();
  });
});

// ── Access Control Tiers ──────────────────────────────────────────────
describe("Access Control", () => {
  it("keeps owner-email shortcuts retired", async () => {
    const { isOwnerBypassEmail } = await import("../shared/accessControl");
    expect(isOwnerBypassEmail("samtheinsuranceman@gmail.com")).toBe(false);
    expect(isOwnerBypassEmail("sam@russellcapitalsystems.com")).toBe(false);
  });

  it("isOwnerBypassEmail is a function", async () => {
    const ac = await import("../shared/accessControl");
    expect(typeof ac.isOwnerBypassEmail).toBe("function");
  });
});
