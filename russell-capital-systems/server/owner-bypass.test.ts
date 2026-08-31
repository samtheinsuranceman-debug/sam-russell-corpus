import { describe, expect, it } from "vitest";
import { isOwnerBypassEmail, OWNER_BYPASS_EMAILS } from "@shared/accessControl";

describe("Managed OAuth — owner email bypass retirement", () => {
  const formerOwnerEmails = [
    "samtheinsuranceman@gmail.com",
    "sam@russellcapitalsystems.com",
    "samrussell@russellcapitalsystems.com",
  ];

  it("keeps the owner-email bypass allowlist empty", () => {
    expect(OWNER_BYPASS_EMAILS).toEqual([]);
  });

  it("never grants authorization from an email string", () => {
    for (const email of formerOwnerEmails) {
      expect(isOwnerBypassEmail(email)).toBe(false);
      expect(isOwnerBypassEmail(email.toUpperCase())).toBe(false);
      expect(isOwnerBypassEmail(` ${email} `)).toBe(false);
    }
  });

  it("rejects ordinary and spoofed addresses", () => {
    for (const email of [
      "other@gmail.com",
      "admin@russellcapitalsystems.com",
      "samtheinsuranceman@gmail.com.evil.com",
      "fake-samtheinsuranceman@gmail.com",
      "",
    ]) expect(isOwnerBypassEmail(email)).toBe(false);
  });

  it("keeps database compatibility helpers non-authoritative", async () => {
    const { isOwnerEmail, isAdminEmail } = await import("../server/db");
    for (const email of [...formerOwnerEmails, "other@gmail.com"]) {
      expect(isOwnerEmail(email)).toBe(false);
      expect(isAdminEmail(email)).toBe(false);
    }
  });
});
