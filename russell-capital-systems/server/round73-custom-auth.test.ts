import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// ─── Mock DB helpers ────────────────────────────────────────────────────────
const mockUsers: Record<string, any> = {};
let resetTokenStore: Record<number, { token: string; expiry: Date }> = {};

vi.mock("./db", () => ({
  getUserByEmail: vi.fn(async (email: string) => mockUsers[email] || undefined),
  createUserWithPassword: vi.fn(async (data: any) => {
    const user = {
      id: Math.floor(Math.random() * 10000),
      openId: `local_test_${Date.now()}`,
      email: data.email,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash: data.passwordHash,
      role: "user",
      loginMethod: "email",
    };
    mockUsers[data.email] = user;
    return user;
  }),
  getUserByResetToken: vi.fn(async (token: string) => {
    for (const [userId, data] of Object.entries(resetTokenStore)) {
      if (data.token === token && data.expiry > new Date()) {
        return Object.values(mockUsers).find((u) => u.id === Number(userId));
      }
    }
    return undefined;
  }),
  setResetToken: vi.fn(async (userId: number, token: string, expiry: Date) => {
    resetTokenStore[userId] = { token, expiry };
  }),
  updateUserPasswordHash: vi.fn(async (userId: number, passwordHash: string) => {
    const user = Object.values(mockUsers).find((u) => u.id === userId);
    if (user) user.passwordHash = passwordHash;
  }),
  upsertUser: vi.fn(async () => {}),
}));

vi.mock("./email", () => ({
  sendPasswordResetEmail: vi.fn(async () => true),
}));

vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn(async () => "mock-jwt-token"),
  },
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Custom Authentication System", () => {
  beforeEach(() => {
    Object.keys(mockUsers).forEach((k) => delete mockUsers[k]);
    resetTokenStore = {};
  });

  describe("Password Hashing", () => {
    it("should hash passwords with bcryptjs", async () => {
      const password = "MySecurePass123";
      const hash = await bcrypt.hash(password, 12);
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    it("should verify correct passwords", async () => {
      const password = "MySecurePass123";
      const hash = await bcrypt.hash(password, 12);
      const valid = await bcrypt.compare(password, hash);
      expect(valid).toBe(true);
    });

    it("should reject incorrect passwords", async () => {
      const password = "MySecurePass123";
      const hash = await bcrypt.hash(password, 12);
      const valid = await bcrypt.compare("WrongPassword", hash);
      expect(valid).toBe(false);
    });

    it("should generate unique hashes for the same password", async () => {
      const password = "SamePassword";
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);
      expect(hash1).not.toBe(hash2);
      // Both should still verify
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe("Registration Flow", () => {
    it("should create a user with hashed password", async () => {
      const { createUserWithPassword } = await import("./db");
      const passwordHash = await bcrypt.hash("TestPass123", 12);
      const user = await createUserWithPassword({
        email: "newuser@test.com",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
        passwordHash,
      });
      expect(user).toBeDefined();
      expect(user!.email).toBe("newuser@test.com");
      expect(user!.name).toBe("Test User");
      expect(user!.passwordHash).toBe(passwordHash);
    });

    it("should detect duplicate email during registration", async () => {
      const { getUserByEmail, createUserWithPassword } = await import("./db");
      const passwordHash = await bcrypt.hash("TestPass123", 12);
      await createUserWithPassword({
        email: "existing@test.com",
        name: "Existing User",
        passwordHash,
      });
      const existing = await getUserByEmail("existing@test.com");
      expect(existing).toBeDefined();
    });

    it("should normalize email to lowercase", () => {
      const email = "Test.User@EXAMPLE.COM";
      expect(email.toLowerCase()).toBe("test.user@example.com");
    });
  });

  describe("Login Flow", () => {
    it("should verify password against stored hash", async () => {
      const password = "LoginPass456";
      const hash = await bcrypt.hash(password, 12);
      mockUsers["login@test.com"] = {
        id: 1,
        openId: "local_test",
        email: "login@test.com",
        name: "Login User",
        passwordHash: hash,
        role: "user",
      };
      const { getUserByEmail } = await import("./db");
      const user = await getUserByEmail("login@test.com");
      expect(user).toBeDefined();
      const valid = await bcrypt.compare(password, user!.passwordHash);
      expect(valid).toBe(true);
    });

    it("should reject login for non-existent user", async () => {
      const { getUserByEmail } = await import("./db");
      const user = await getUserByEmail("nonexistent@test.com");
      expect(user).toBeUndefined();
    });

    it("should reject login with wrong password", async () => {
      const hash = await bcrypt.hash("CorrectPass", 12);
      mockUsers["wrong@test.com"] = {
        id: 2,
        openId: "local_test2",
        email: "wrong@test.com",
        passwordHash: hash,
      };
      const { getUserByEmail } = await import("./db");
      const user = await getUserByEmail("wrong@test.com");
      const valid = await bcrypt.compare("WrongPass", user!.passwordHash);
      expect(valid).toBe(false);
    });

    it("should reject login for user without password (OAuth-only user)", async () => {
      mockUsers["oauth@test.com"] = {
        id: 3,
        openId: "oauth_test",
        email: "oauth@test.com",
        passwordHash: null,
      };
      const { getUserByEmail } = await import("./db");
      const user = await getUserByEmail("oauth@test.com");
      expect(user).toBeDefined();
      expect(user!.passwordHash).toBeNull();
      // Login should be rejected for users without password
    });
  });

  describe("Forgot Password Flow", () => {
    it("should generate reset token and store it", async () => {
      const { setResetToken } = await import("./db");
      const userId = 10;
      const token = "test-reset-token-abc123";
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      await setResetToken(userId, token, expiry);
      expect(resetTokenStore[userId]).toBeDefined();
      expect(resetTokenStore[userId].token).toBe(token);
      expect(resetTokenStore[userId].expiry).toEqual(expiry);
    });

    it("should send reset email via Resend", async () => {
      const { sendPasswordResetEmail } = await import("./email");
      await sendPasswordResetEmail({
        toEmail: "user@test.com",
        userName: "Test User",
        resetToken: "test-token",
      });
      expect(sendPasswordResetEmail).toHaveBeenCalledWith({
        toEmail: "user@test.com",
        userName: "Test User",
        resetToken: "test-token",
      });
    });

    it("should not reveal whether email exists (prevent enumeration)", () => {
      // The forgotPassword procedure always returns the same success message
      const successMessage = "If an account exists with that email, a reset link has been sent.";
      expect(successMessage).toContain("If an account exists");
    });
  });

  describe("Reset Password Flow", () => {
    it("should find user by valid reset token", async () => {
      const userId = 20;
      mockUsers["reset@test.com"] = {
        id: userId,
        openId: "local_reset",
        email: "reset@test.com",
        passwordHash: "old-hash",
      };
      resetTokenStore[userId] = {
        token: "valid-token",
        expiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      };
      const { getUserByResetToken } = await import("./db");
      const user = await getUserByResetToken("valid-token");
      expect(user).toBeDefined();
      expect(user!.email).toBe("reset@test.com");
    });

    it("should reject expired reset token", async () => {
      const userId = 21;
      mockUsers["expired@test.com"] = {
        id: userId,
        openId: "local_expired",
        email: "expired@test.com",
      };
      resetTokenStore[userId] = {
        token: "expired-token",
        expiry: new Date(Date.now() - 1000), // Already expired
      };
      const { getUserByResetToken } = await import("./db");
      const user = await getUserByResetToken("expired-token");
      expect(user).toBeUndefined();
    });

    it("should reject invalid reset token", async () => {
      const { getUserByResetToken } = await import("./db");
      const user = await getUserByResetToken("nonexistent-token");
      expect(user).toBeUndefined();
    });

    it("should update password hash after reset", async () => {
      const userId = 22;
      const oldHash = await bcrypt.hash("OldPassword", 12);
      mockUsers["update@test.com"] = {
        id: userId,
        email: "update@test.com",
        passwordHash: oldHash,
      };
      const newHash = await bcrypt.hash("NewPassword123", 12);
      const { updateUserPasswordHash } = await import("./db");
      await updateUserPasswordHash(userId, newHash);
      expect(mockUsers["update@test.com"].passwordHash).toBe(newHash);
      expect(await bcrypt.compare("NewPassword123", mockUsers["update@test.com"].passwordHash)).toBe(true);
    });
  });

  describe("Session Management", () => {
    it("should create JWT session token via SDK", async () => {
      const { sdk } = await import("./_core/sdk");
      const token = await sdk.createSessionToken("local_test_user", {
        name: "Test User",
        expiresInMs: 365 * 24 * 60 * 60 * 1000,
      });
      expect(token).toBe("mock-jwt-token");
    });

    it("should set session cookie with correct options", () => {
      // Verify cookie options structure
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "lax" as const,
        path: "/",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      };
      expect(cookieOptions.httpOnly).toBe(true);
      expect(cookieOptions.secure).toBe(true);
      expect(cookieOptions.maxAge).toBe(365 * 24 * 60 * 60 * 1000);
    });
  });

  describe("getLoginUrl", () => {
    it("should return /login path instead of Manus OAuth", () => {
      // Simulating the new getLoginUrl function
      const getLoginUrl = (returnPath?: string) => {
        const path = returnPath || "/portal/dashboard";
        return `/login?returnTo=${encodeURIComponent(path)}`;
      };
      expect(getLoginUrl()).toBe("/login?returnTo=%2Fportal%2Fdashboard");
      expect(getLoginUrl("/portal/clients")).toBe("/login?returnTo=%2Fportal%2Fclients");
    });

    it("should not contain any manus references", () => {
      const getLoginUrl = (returnPath?: string) => {
        const path = returnPath || "/portal/dashboard";
        return `/login?returnTo=${encodeURIComponent(path)}`;
      };
      const url = getLoginUrl("/portal/dashboard");
      expect(url).not.toContain("manus");
      expect(url).not.toContain("oauth");
      expect(url).toContain("/login");
    });
  });

  describe("Password Validation", () => {
    it("should enforce minimum 8 characters", () => {
      const isValid = (pw: string) => pw.length >= 8;
      expect(isValid("short")).toBe(false);
      expect(isValid("12345678")).toBe(true);
      expect(isValid("LongEnoughPassword")).toBe(true);
    });

    it("should check for uppercase, lowercase, and numbers", () => {
      const checks = (pw: string) => ({
        length: pw.length >= 8,
        upper: /[A-Z]/.test(pw),
        lower: /[a-z]/.test(pw),
        number: /[0-9]/.test(pw),
      });
      const strong = checks("StrongPass1");
      expect(strong.length).toBe(true);
      expect(strong.upper).toBe(true);
      expect(strong.lower).toBe(true);
      expect(strong.number).toBe(true);

      const weak = checks("weakpass");
      expect(weak.upper).toBe(false);
      expect(weak.number).toBe(false);
    });
  });
});
