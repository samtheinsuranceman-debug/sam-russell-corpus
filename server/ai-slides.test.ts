import { describe, expect, it, vi, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-slides",
    email: "advisor@russellcapital.com",
    name: "Test Advisor",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

/**
 * Mock the LLM to return a deterministic slide deck.
 * This avoids calling the real LLM API in tests.
 */
/**
 * Mock the db rate-limiting functions so the test user is never rate-limited.
 */
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    getTrialSlideCountToday: vi.fn().mockResolvedValue(0),
    logSlideUsage: vi.fn().mockResolvedValue(undefined),
    getAdvisorAccountByEmail: vi.fn().mockImplementation((email: string) => {
      // Return unlimited tier so tests aren't rate-limited
      return Promise.resolve({ id: 1, email, accessTier: "unlimited", trialSecondsUsed: 0, trialAccessCount: 0 });
    }),
  };
});

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "test-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            slides: [
              {
                title: "Roth Conversion Strategy",
                subtitle: "Tax-Optimized Wealth Building",
                bullets: [
                  "Convert $50,000 annually to Roth IRA",
                  "Stay within the 24% tax bracket",
                  "Projected tax savings of $120,000 over 10 years",
                ],
                speakerNotes: "Open with the client's current tax situation.",
                layout: "title",
              },
              {
                title: "Year-by-Year Conversion Plan",
                subtitle: "5-Year Roth Ladder",
                bullets: [
                  "Year 1: $45,000 conversion — $10,800 tax",
                  "Year 2: $47,000 conversion — $11,280 tax",
                  "Year 3: $49,000 conversion — $11,760 tax",
                ],
                speakerNotes: "Walk through each year's conversion amount.",
                layout: "content",
              },
              {
                title: "Next Steps",
                subtitle: "Action Items for Implementation",
                bullets: [
                  "Schedule follow-up meeting",
                  "Review current IRA custodian options",
                  "Prepare tax projection worksheet",
                ],
                speakerNotes: "Close with clear action items.",
                layout: "summary",
              },
            ],
          }),
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

describe("AI Slide Generator", () => {
  describe("ai.generateSlides — tool context export", () => {
    it("generates slides from structured tool data", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlides({
        toolName: "Roth Conversion Ladder",
        clientName: "John Smith",
        clientAge: 58,
        clientIncome: 150000,
        clientIraBalance: 1200000,
        sections: [
          {
            title: "Conversion Plan",
            items: [
              { label: "Year 1 Conversion", value: "$45,000" },
              { label: "Year 1 Tax", value: "$10,800" },
              { label: "5-Year Total", value: "$225,000" },
            ],
          },
          {
            title: "Tax Impact",
            items: [
              { label: "Current Bracket", value: "24%" },
              { label: "Projected Savings", value: "$120,000" },
            ],
          },
        ],
        bullets: ["Tax savings of $120,000 over 10 years", "Stay within 24% bracket"],
        slideCount: 3,
        audience: "client",
      });

      expect(result).toBeDefined();
      expect(result.slides).toBeInstanceOf(Array);
      expect(result.slides.length).toBe(3);
      expect(result.toolName).toBe("Roth Conversion Ladder");
      expect(result.clientName).toBe("John Smith");

      // Verify slide structure
      const firstSlide = result.slides[0];
      expect(firstSlide).toHaveProperty("title");
      expect(firstSlide).toHaveProperty("subtitle");
      expect(firstSlide).toHaveProperty("bullets");
      expect(firstSlide).toHaveProperty("speakerNotes");
      expect(firstSlide).toHaveProperty("layout");
      expect(firstSlide.bullets).toBeInstanceOf(Array);
      expect(firstSlide.bullets.length).toBeGreaterThan(0);
    });

    it("handles missing optional fields gracefully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlides({
        toolName: "Strategy Lab",
        sections: [
          {
            title: "Overview",
            items: [{ label: "Status", value: "Active" }],
          },
        ],
        slideCount: 3,
        audience: "advisor",
      });

      expect(result).toBeDefined();
      expect(result.slides).toBeInstanceOf(Array);
      expect(result.toolName).toBe("Strategy Lab");
      expect(result.clientName).toBeNull();
    });

    it("validates slide count bounds", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // slideCount below minimum should fail validation
      await expect(
        caller.ai.generateSlides({
          toolName: "Test",
          sections: [{ title: "T", items: [{ label: "A", value: "B" }] }],
          slideCount: 1,
          audience: "client",
        })
      ).rejects.toThrow();

      // slideCount above maximum should fail validation
      await expect(
        caller.ai.generateSlides({
          toolName: "Test",
          sections: [{ title: "T", items: [{ label: "A", value: "B" }] }],
          slideCount: 25,
          audience: "client",
        })
      ).rejects.toThrow();
    });

    it("validates audience enum", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.ai.generateSlides({
          toolName: "Test",
          sections: [{ title: "T", items: [{ label: "A", value: "B" }] }],
          slideCount: 5,
          audience: "invalid" as any,
        })
      ).rejects.toThrow();
    });

    it("returns correct layout types", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlides({
        toolName: "Tax Waterfall",
        sections: [{ title: "Tax", items: [{ label: "Rate", value: "24%" }] }],
        slideCount: 3,
        audience: "client",
      });

      const validLayouts = ["title", "content", "comparison", "metrics", "timeline", "summary"];
      for (const slide of result.slides) {
        expect(validLayouts).toContain(slide.layout);
      }
    });
  });

  describe("ai.generateSlidesFromPrompt — freeform generation", () => {
    it("generates slides from a natural language prompt", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlidesFromPrompt({
        prompt: "Create a Roth conversion strategy presentation for a 58-year-old client with $1.2M IRA",
        slideCount: 3,
        audience: "client",
      });

      expect(result).toBeDefined();
      expect(result.slides).toBeInstanceOf(Array);
      expect(result.slides.length).toBe(3);
    });

    it("accepts optional topic preset", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlidesFromPrompt({
        prompt: "Build a comprehensive overview of IUL benefits and historical performance",
        slideCount: 3,
        audience: "advisor",
        topic: "iul_strategy",
      });

      expect(result).toBeDefined();
      expect(result.slides).toBeInstanceOf(Array);
    });

    it("validates prompt minimum length", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.ai.generateSlidesFromPrompt({
          prompt: "short",
          slideCount: 5,
          audience: "client",
        })
      ).rejects.toThrow();
    });

    it("validates prompt maximum length", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const longPrompt = "x".repeat(2001);
      await expect(
        caller.ai.generateSlidesFromPrompt({
          prompt: longPrompt,
          slideCount: 5,
          audience: "client",
        })
      ).rejects.toThrow();
    });

    it("handles all audience types", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      for (const aud of ["client", "advisor", "team"] as const) {
        const result = await caller.ai.generateSlidesFromPrompt({
          prompt: "Create a tax planning overview presentation",
          slideCount: 3,
          audience: aud,
        });
        expect(result.slides).toBeInstanceOf(Array);
      }
    });
  });

  describe("slide structure validation", () => {
    it("all slides have required fields", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlides({
        toolName: "Estate Flow Chart",
        sections: [{ title: "Estate", items: [{ label: "Value", value: "$5M" }] }],
        slideCount: 3,
        audience: "client",
      });

      for (const slide of result.slides) {
        expect(typeof slide.title).toBe("string");
        expect(typeof slide.subtitle).toBe("string");
        expect(Array.isArray(slide.bullets)).toBe(true);
        expect(typeof slide.speakerNotes).toBe("string");
        expect(typeof slide.layout).toBe("string");
        expect(slide.title.length).toBeGreaterThan(0);
      }
    });

    it("bullets are non-empty strings", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlides({
        toolName: "Income Gap Analyzer",
        sections: [{ title: "Gap", items: [{ label: "Monthly Gap", value: "$2,500" }] }],
        slideCount: 3,
        audience: "client",
      });

      for (const slide of result.slides) {
        for (const bullet of slide.bullets) {
          expect(typeof bullet).toBe("string");
          expect(bullet.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
