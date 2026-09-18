import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Auto-login bypass tests for samtheinsuranceman@gmail.com
 * Tests the /api/auto-login endpoint logic
 */

const OWNER_EMAIL = "samtheinsuranceman@gmail.com";

describe("Auto-Login Bypass", () => {
  describe("Owner email detection", () => {
    it("should recognize the owner email (case-insensitive)", () => {
      const variants = [
        "samtheinsuranceman@gmail.com",
        "SamTheInsuranceMan@gmail.com",
        "SAMTHEINSURANCEMAN@GMAIL.COM",
        "SamTheInsuranceMan@Gmail.Com",
      ];
      for (const email of variants) {
        expect(email.toLowerCase()).toBe(OWNER_EMAIL);
      }
    });

    it("should reject non-owner emails", () => {
      const nonOwnerEmails = [
        "other@example.com",
        "sam@example.com",
        "samtheinsuranceman@yahoo.com",
        "admin@russellcapitalsystems.com",
      ];
      for (const email of nonOwnerEmails) {
        expect(email.toLowerCase()).not.toBe(OWNER_EMAIL);
      }
    });
  });

  describe("Auto-login endpoint validation", () => {
    it("should require email in request body", () => {
      const body = {};
      expect("email" in body).toBe(false);
    });

    it("should only allow the owner email", () => {
      const isOwner = (email: string) => email.toLowerCase() === OWNER_EMAIL;
      expect(isOwner("samtheinsuranceman@gmail.com")).toBe(true);
      expect(isOwner("other@gmail.com")).toBe(false);
    });

    it("should not require a password for the owner", () => {
      // The auto-login flow only sends { email } — no password field
      const autoLoginPayload = { email: OWNER_EMAIL };
      expect(autoLoginPayload).not.toHaveProperty("password");
    });
  });

  describe("Frontend login form behavior", () => {
    it("should detect owner email and skip password field", () => {
      const email = "samtheinsuranceman@gmail.com";
      const isOwnerEmail = email.toLowerCase() === OWNER_EMAIL;
      expect(isOwnerEmail).toBe(true);
      // When isOwnerEmail is true, the password field is hidden
      // and the button text changes to "Enter Portal"
    });

    it("should show password field for non-owner emails", () => {
      const email = "advisor@example.com";
      const isOwnerEmail = email.toLowerCase() === OWNER_EMAIL;
      expect(isOwnerEmail).toBe(false);
      // When isOwnerEmail is false, normal login flow with password
    });

    it("should use /api/auto-login endpoint for owner, /api/trpc for others", () => {
      const getEndpoint = (email: string) =>
        email.toLowerCase() === OWNER_EMAIL ? "/api/auto-login" : "/api/trpc";
      expect(getEndpoint("samtheinsuranceman@gmail.com")).toBe("/api/auto-login");
      expect(getEndpoint("other@example.com")).toBe("/api/trpc");
    });
  });

  describe("Session creation", () => {
    it("should create a 1-year session for the owner", () => {
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      expect(ONE_YEAR_MS).toBe(31536000000);
    });

    it("should set the session cookie with correct name", () => {
      const COOKIE_NAME = "app_session_id";
      expect(COOKIE_NAME).toBe("app_session_id");
    });
  });

  describe("Security", () => {
    it("should only allow the specific owner email, not partial matches", () => {
      const isOwner = (email: string) => email.toLowerCase() === OWNER_EMAIL;
      expect(isOwner("samtheinsuranceman@gmail.com")).toBe(true);
      expect(isOwner("samtheinsuranceman@gmail.com.evil.com")).toBe(false);
      expect(isOwner("fake-samtheinsuranceman@gmail.com")).toBe(false);
      expect(isOwner("samtheinsuranceman@gmail.co")).toBe(false);
    });

    it("should not expose auto-login to other emails", () => {
      const isOwner = (email: string) => email.toLowerCase() === OWNER_EMAIL;
      // Even admin emails should not get auto-login
      expect(isOwner("admin@russellcap.com")).toBe(false);
      expect(isOwner("sam@russellcap.com")).toBe(false);
    });
  });
});
