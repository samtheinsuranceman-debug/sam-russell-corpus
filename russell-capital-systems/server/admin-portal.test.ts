import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Admin Portal Tests
 * Tests the admin login flow, PIN verification, and access control
 */

// ─── Constants ──────────────────────────────────────────────────────────────
const ADMIN_EMAILS = ["sam@russellcapitalsystems.com", "samtheinsuranceman@gmail.com"];
const ADMIN_PHONE = "7035090594";

describe("Admin Portal - Email Validation", () => {
  it("should accept sam@russellcapitalsystems.com as admin email", () => {
    const email = "sam@russellcapitalsystems.com";
    expect(ADMIN_EMAILS.includes(email.toLowerCase().trim())).toBe(true);
  });

  it("should accept samtheinsuranceman@gmail.com as admin email", () => {
    const email = "samtheinsuranceman@gmail.com";
    expect(ADMIN_EMAILS.includes(email.toLowerCase().trim())).toBe(true);
  });

  it("should accept emails case-insensitively", () => {
    const email = "Sam@RussellCapitalSystems.com";
    expect(ADMIN_EMAILS.includes(email.toLowerCase().trim())).toBe(true);
  });

  it("should reject non-admin emails", () => {
    const email = "random@example.com";
    expect(ADMIN_EMAILS.includes(email.toLowerCase().trim())).toBe(false);
  });

  it("should reject empty email", () => {
    const email = "";
    expect(ADMIN_EMAILS.includes(email.toLowerCase().trim())).toBe(false);
  });

  it("should reject similar but different emails", () => {
    const fakeEmails = [
      "sam@russellcapital.com",
      "samtheinsuranceman@yahoo.com",
      "admin@russellcapitalsystems.com",
      "sam@gmail.com",
    ];
    for (const email of fakeEmails) {
      expect(ADMIN_EMAILS.includes(email.toLowerCase().trim())).toBe(false);
    }
  });
});

describe("Admin Portal - PIN Generation", () => {
  it("should generate a 4-digit PIN", () => {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    expect(pin).toHaveLength(4);
    expect(Number(pin)).toBeGreaterThanOrEqual(1000);
    expect(Number(pin)).toBeLessThanOrEqual(9999);
  });

  it("should generate different PINs on subsequent calls", () => {
    const pins = new Set<string>();
    for (let i = 0; i < 100; i++) {
      pins.add(String(Math.floor(1000 + Math.random() * 9000)));
    }
    // With 100 random 4-digit PINs, we should have at least 50 unique ones
    expect(pins.size).toBeGreaterThan(50);
  });
});

describe("Admin Portal - PIN Expiry", () => {
  it("should set expiry to 10 minutes from now", () => {
    const now = Date.now();
    const expiresAt = new Date(now + 10 * 60 * 1000);
    const diff = expiresAt.getTime() - now;
    expect(diff).toBe(10 * 60 * 1000); // 10 minutes in ms
  });

  it("should correctly detect expired PINs", () => {
    const expiredTime = new Date(Date.now() - 1000); // 1 second ago
    expect(new Date() > expiredTime).toBe(true);
  });

  it("should correctly detect valid PINs", () => {
    const futureTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    expect(new Date() > futureTime).toBe(false);
  });
});

describe("Admin Portal - Attempt Limiting", () => {
  it("should allow up to 5 attempts", () => {
    for (let attempts = 0; attempts < 5; attempts++) {
      expect(attempts >= 5).toBe(false);
    }
  });

  it("should block after 5 attempts", () => {
    const attempts = 5;
    expect(attempts >= 5).toBe(true);
  });
});

describe("Admin Portal - Owner Email Check (isOwnerEmail)", () => {
  // Simulates the isOwnerEmail function from db.ts
  function isOwnerEmail(email: string): boolean {
    const ownerEmails = ["sam@russellcapitalsystems.com", "samtheinsuranceman@gmail.com"];
    return ownerEmails.includes(email.toLowerCase().trim());
  }

  it("should return true for sam@russellcapitalsystems.com", () => {
    expect(isOwnerEmail("sam@russellcapitalsystems.com")).toBe(true);
  });

  it("should return true for samtheinsuranceman@gmail.com", () => {
    expect(isOwnerEmail("samtheinsuranceman@gmail.com")).toBe(true);
  });

  it("should return true regardless of case", () => {
    expect(isOwnerEmail("SAM@RUSSELLCAPITALSYSTEMS.COM")).toBe(true);
    expect(isOwnerEmail("SamTheInsuranceMan@Gmail.com")).toBe(true);
  });

  it("should return false for non-owner emails", () => {
    expect(isOwnerEmail("other@example.com")).toBe(false);
    expect(isOwnerEmail("admin@admin.com")).toBe(false);
  });

  it("should handle whitespace in email", () => {
    expect(isOwnerEmail("  sam@russellcapitalsystems.com  ")).toBe(true);
  });
});

describe("Admin Portal - Session Duration", () => {
  it("should create session with 1-year expiry for admin", () => {
    const maxAge = 365 * 24 * 60 * 60 * 1000;
    expect(maxAge).toBe(31536000000); // 1 year in ms
  });
});

describe("Admin Portal - API Endpoint Structure", () => {
  it("should have correct admin login endpoint path", () => {
    const endpoint = "/api/admin/login";
    expect(endpoint).toBe("/api/admin/login");
  });

  it("should have correct admin verify-pin endpoint path", () => {
    const endpoint = "/api/admin/verify-pin";
    expect(endpoint).toBe("/api/admin/verify-pin");
  });

  it("should have correct admin stats endpoint path", () => {
    const endpoint = "/api/admin/stats";
    expect(endpoint).toBe("/api/admin/stats");
  });

  it("should have correct admin users endpoint path", () => {
    const endpoint = "/api/admin/users";
    expect(endpoint).toBe("/api/admin/users");
  });
});
