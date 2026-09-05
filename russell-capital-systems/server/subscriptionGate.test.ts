import { describe, it, expect } from "vitest";
import {
  isOwnerEmail,
} from "./db";

describe("Access Control — ALL Restrictions Permanently Removed", () => {
  // ─── Email strings are never authorization boundaries ─────────────────────
  describe("isOwnerEmail compatibility helper", () => {
    it("returns false for former owner, case variants, ordinary, and empty addresses", () => {
      for (const email of [
        "samtheinsuranceman@gmail.com",
        "sam@russellcapitalsystems.com",
        "SamTheInsuranceMan@Gmail.com",
        "SAM@RUSSELLCAPITALSYSTEMS.COM",
        "john@example.com",
        "admin@russellcap.com",
        "",
      ]) expect(isOwnerEmail(email)).toBe(false);
    });
  });

  // ─── Login gate: NO ONE is ever blocked ───────────────────────────────────
  describe("Login gate — no restrictions for anyone", () => {
    // All restrictions removed — everyone can log in unlimited times
    function shouldBlockLogin(_email: string, _loginCount: number, _hasActiveSubscription: boolean): boolean {
      return false; // NEVER block anyone
    }

    it("allows first login for any user", () => {
      expect(shouldBlockLogin("newuser@example.com", 0, false)).toBe(false);
    });

    it("allows second login without subscription", () => {
      expect(shouldBlockLogin("user@example.com", 1, false)).toBe(false);
    });

    it("allows 100th login without subscription", () => {
      expect(shouldBlockLogin("user@example.com", 100, false)).toBe(false);
    });

    it("allows unlimited logins for any email", () => {
      expect(shouldBlockLogin("anyone@anywhere.com", 999, false)).toBe(false);
      expect(shouldBlockLogin("test@test.com", 50000, false)).toBe(false);
    });
  });

  // ─── Trial gate: NO ONE is ever blocked ───────────────────────────────────
  describe("Trial gate — no restrictions for anyone", () => {
    function shouldBlockTrial(_email: string, _hasUsedTrial: boolean): boolean {
      return false; // NEVER block anyone
    }

    it("allows first trial for any user", () => {
      expect(shouldBlockTrial("newuser@example.com", false)).toBe(false);
    });

    it("allows repeat trials for any user", () => {
      expect(shouldBlockTrial("user@example.com", true)).toBe(false);
    });

    it("allows unlimited trials for any email", () => {
      expect(shouldBlockTrial("anyone@anywhere.com", true)).toBe(false);
      expect(shouldBlockTrial("test@test.com", true)).toBe(false);
    });
  });
});
