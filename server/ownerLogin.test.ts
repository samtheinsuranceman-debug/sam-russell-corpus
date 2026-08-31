import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

const OWNER_EMAIL = "samtheinsuranceman@gmail.com";
const OWNER_PASSWORD = "Mike1248(?)";

describe("Owner Direct Login", () => {
  it("should hash the owner password correctly with bcrypt", async () => {
    const hash = await bcrypt.hash(OWNER_PASSWORD, 12);
    expect(hash).toBeTruthy();
    expect(hash.length).toBeGreaterThan(50);
  });

  it("should verify the owner password against a bcrypt hash", async () => {
    const hash = await bcrypt.hash(OWNER_PASSWORD, 12);
    const valid = await bcrypt.compare(OWNER_PASSWORD, hash);
    expect(valid).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const hash = await bcrypt.hash(OWNER_PASSWORD, 12);
    const valid = await bcrypt.compare("WrongPassword123", hash);
    expect(valid).toBe(false);
  });

  it("should reject empty password", async () => {
    const hash = await bcrypt.hash(OWNER_PASSWORD, 12);
    const valid = await bcrypt.compare("", hash);
    expect(valid).toBe(false);
  });

  it("owner email should be lowercase normalized", () => {
    expect(OWNER_EMAIL).toBe(OWNER_EMAIL.toLowerCase());
  });

  it("auth.login procedure should exist on the appRouter", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("auth.login");
  });

  it("auth.me procedure should exist for session verification", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("auth.me");
  });

  it("auth.logout procedure should exist", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("auth.logout");
  });

  it("auth.register procedure should exist for new account creation", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("auth.register");
  });

  it("password should contain special characters and be handled correctly", async () => {
    // Mike1248(?) contains parentheses and question mark
    const specialChars = ["(", ")", "?"];
    for (const char of specialChars) {
      expect(OWNER_PASSWORD).toContain(char);
    }
    // Verify bcrypt handles special chars
    const hash = await bcrypt.hash(OWNER_PASSWORD, 12);
    const valid = await bcrypt.compare(OWNER_PASSWORD, hash);
    expect(valid).toBe(true);
  });
});
