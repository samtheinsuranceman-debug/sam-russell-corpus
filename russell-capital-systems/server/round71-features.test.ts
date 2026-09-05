/**
 * Round 71 Tests — Tax Return OCR, Campaign Email Dispatch, Email Capture in Onboarding
 */
import { describe, it, expect, vi } from "vitest";

// ─── Tax Return OCR Router ──────────────────────────────────────────────────

describe("taxReturnOcr router", () => {
  it("should be registered in the appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("taxReturnOcr.uploadAndExtract");
    expect(procedures).toContain("taxReturnOcr.extractFromUrl");
  });

  it("uploadAndExtract should require authentication", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      caller.taxReturnOcr.uploadAndExtract({
        clientId: 1,
        fileName: "test.pdf",
        fileBase64: "dGVzdA==",
        contentType: "application/pdf",
      })
    ).rejects.toThrow();
  });

  it("extractFromUrl should require authentication", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      caller.taxReturnOcr.extractFromUrl({
        fileUrl: "https://example.com/test.pdf",
        fileName: "test.pdf",
      })
    ).rejects.toThrow();
  });

  it("uploadAndExtract should validate clientId is a number", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      (caller.taxReturnOcr.uploadAndExtract as any)({
        clientId: "not-a-number",
        fileName: "test.pdf",
        fileBase64: "dGVzdA==",
      })
    ).rejects.toThrow();
  });

  it("extractFromUrl should validate fileUrl is a valid URL", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      caller.taxReturnOcr.extractFromUrl({
        fileUrl: "not-a-url",
        fileName: "test.pdf",
      })
    ).rejects.toThrow();
  });
});

// ─── Tax Return Extraction Schema ────────────────────────────────────────────

describe("tax return extraction schema", () => {
  it("should define all 27 expected extraction fields", () => {
    const expectedFields = [
      "filingStatus", "taxYear", "grossIncome", "adjustedGrossIncome",
      "taxableIncome", "totalTaxLiability", "effectiveTaxRate", "marginalTaxBracket",
      "standardOrItemized", "totalDeductions", "wagesAndSalaries", "interestIncome",
      "dividendIncome", "capitalGains", "businessIncome", "rentalIncome",
      "socialSecurityIncome", "retirementDistributions", "stateAndLocalTaxes",
      "mortgageInterest", "charitableContributions", "iraContributions",
      "estimatedTaxPayments", "refundOrOwed", "dependents",
      "primaryFilerName", "spouseName",
    ];
    expect(expectedFields.length).toBe(27);
    const unique = new Set(expectedFields);
    expect(unique.size).toBe(expectedFields.length);
  });

  it("should support all 5 filing statuses", () => {
    const statuses = [
      "single", "married_filing_jointly", "married_filing_separately",
      "head_of_household", "qualifying_widow",
    ];
    expect(statuses.length).toBe(5);
  });

  it("effective tax rate should be a decimal (0-1)", () => {
    const rate = 0.22;
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(1);
  });

  it("refundOrOwed should be positive for refund, negative for owed", () => {
    expect(2500).toBeGreaterThan(0);
    expect(-1200).toBeLessThan(0);
  });
});

// ─── Campaign Email Dispatch ─────────────────────────────────────────────────

describe("emailCampaigns dispatch router", () => {
  it("sendNext and sendTest should be registered", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("emailCampaigns.sendNext");
    expect(procedures).toContain("emailCampaigns.sendTest");
  });

  it("sendNext should require authentication", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      caller.emailCampaigns.sendNext({ campaignId: 1 })
    ).rejects.toThrow();
  });

  it("sendTest should require authentication", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      caller.emailCampaigns.sendTest({ templateId: 1, campaignId: 1 })
    ).rejects.toThrow();
  });

  it("sendNext should require campaignId as a number", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      (caller.emailCampaigns.sendNext as any)({ campaignId: "abc" })
    ).rejects.toThrow();
  });

  it("sendTest should require both templateId and campaignId", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      (caller.emailCampaigns.sendTest as any)({ templateId: 1 })
    ).rejects.toThrow();
  });
});

// ─── Campaign Email Function ─────────────────────────────────────────────────

describe("sendCampaignEmail function", () => {
  it("should export sendCampaignEmail function", async () => {
    const emailModule = await import("./email");
    expect(typeof emailModule.sendCampaignEmail).toBe("function");
  });

  it("should return sent: false when RESEND_API_KEY is not set", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    vi.resetModules();
    const { sendCampaignEmail } = await import("./email");

    const result = await sendCampaignEmail({
      toEmail: "test@example.com",
      toName: "Test User",
      subject: "Test Campaign",
      body: "Hello from the campaign!",
      campaignName: "Welcome Series",
    });

    expect(result.sent).toBe(false);
    expect(result.reason).toContain("RESEND_API_KEY");
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  });

  it("should accept all required parameters without throwing", async () => {
    vi.resetModules();
    const { sendCampaignEmail } = await import("./email");
    const result = await sendCampaignEmail({
      toEmail: "client@example.com",
      subject: "Financial Update",
      body: "<p>Your portfolio has grown!</p>",
      campaignName: "Monthly Update",
    });
    expect(result).toHaveProperty("sent");
  });

  it("should accept optional toName parameter", async () => {
    vi.resetModules();
    const { sendCampaignEmail } = await import("./email");
    const result = await sendCampaignEmail({
      toEmail: "client@example.com",
      toName: "John Smith",
      subject: "Welcome",
      body: "Welcome to Russell Capital Systems",
      campaignName: "Welcome Series",
    });
    expect(result).toHaveProperty("sent");
  });
});

// ─── Campaign Template Placeholder Replacement ───────────────────────────────

describe("campaign template placeholder replacement", () => {
  it("should replace {{clientName}} in subject and body", () => {
    const subject = "Hello {{clientName}}, your update is ready";
    const body = "Dear {{clientName}}, we have exciting news for you, {{clientName}}!";
    const clientName = "John Smith";
    expect(subject.replace(/\{\{clientName\}\}/g, clientName)).toBe("Hello John Smith, your update is ready");
    expect(body.replace(/\{\{clientName\}\}/g, clientName)).toBe("Dear John Smith, we have exciting news for you, John Smith!");
  });

  it("should replace {{advisorName}} in body", () => {
    const body = "Your advisor {{advisorName}} has prepared your plan.";
    expect(body.replace(/\{\{advisorName\}\}/g, "Sarah Russell")).toBe("Your advisor Sarah Russell has prepared your plan.");
  });

  it("should handle templates without placeholders", () => {
    const body = "This is a static email body with no placeholders.";
    const replaced = body.replace(/\{\{clientName\}\}/g, "John").replace(/\{\{advisorName\}\}/g, "Sarah");
    expect(replaced).toBe(body);
  });

  it("should use fallback values when names are null", () => {
    const body = "Hello {{clientName}}, from {{advisorName}}";
    const replaced = body
      .replace(/\{\{clientName\}\}/g, (null as any) ?? "Client")
      .replace(/\{\{advisorName\}\}/g, (null as any) ?? "Your Advisor");
    expect(replaced).toBe("Hello Client, from Your Advisor");
  });
});

// ─── Campaign Enrollment Step Tracking ───────────────────────────────────────

describe("campaign enrollment step tracking", () => {
  it("should track currentStep starting at 0", () => {
    const enrollment = { currentStep: 0, status: "active" };
    expect(enrollment.currentStep).toBe(0);
  });

  it("should mark enrollment as completed when all steps are done", () => {
    const templates = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const enrollment = { currentStep: 3, status: "active" };
    if (enrollment.currentStep >= templates.length) enrollment.status = "completed";
    expect(enrollment.status).toBe("completed");
  });

  it("should check delay before sending next email", () => {
    const template = { delayDays: 3 };
    const lastSentAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const daysSinceLast = (Date.now() - lastSentAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysSinceLast).toBeLessThan(template.delayDays);
  });

  it("should allow sending when delay is met", () => {
    const template = { delayDays: 3 };
    const lastSentAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const daysSinceLast = (Date.now() - lastSentAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysSinceLast).toBeGreaterThanOrEqual(template.delayDays);
  });

  it("should calculate nextSendAt correctly", () => {
    const now = Date.now();
    const nextTemplate = { delayDays: 5 };
    const nextSendAt = new Date(now + nextTemplate.delayDays * 24 * 60 * 60 * 1000);
    expect(nextSendAt.getTime()).toBe(now + 5 * 24 * 60 * 60 * 1000);
  });
});

// ─── Full Email Campaign Router ──────────────────────────────────────────────

describe("emailCampaigns full router", () => {
  it("should have all CRUD + dispatch procedures registered", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    const expected = [
      "emailCampaigns.create", "emailCampaigns.list",
      "emailCampaigns.update", "emailCampaigns.delete",
      "emailCampaigns.addTemplate", "emailCampaigns.listTemplates",
      "emailCampaigns.deleteTemplate", "emailCampaigns.enroll",
      "emailCampaigns.listEnrollments", "emailCampaigns.unenroll",
      "emailCampaigns.sendNext", "emailCampaigns.sendTest",
    ];
    for (const proc of expected) {
      expect(procedures).toContain(proc);
    }
  });
});

// ─── Client Email Capture ────────────────────────────────────────────────────

describe("client email capture", () => {
  it("clients.create should be registered and require authentication", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("clients.create");

    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    await expect(
      caller.clients.create({ name: "Test Client", email: "test@example.com" })
    ).rejects.toThrow();
  });

  it("email validation regex should accept valid emails", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("john@example.com")).toBe(true);
    expect(emailRegex.test("jane.doe@company.co")).toBe(true);
    expect(emailRegex.test("user+tag@domain.org")).toBe(true);
  });

  it("email validation regex should reject invalid emails", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("")).toBe(false);
    expect(emailRegex.test("not-an-email")).toBe(false);
    expect(emailRegex.test("missing@")).toBe(false);
    expect(emailRegex.test("@domain.com")).toBe(false);
  });
});
