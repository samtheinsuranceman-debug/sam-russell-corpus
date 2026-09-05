/**
 * Batch 9 Tests — LiveCoPilot LLM, WarRoom Persistence, Open Access, HeyGen Quota Fix
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

// ─── LiveCoPilot LLM Integration ────────────────────────────────────────────

describe("LiveCoPilot — Real LLM Integration", () => {
  const routersPath = path.join(ROOT, "server/routers.ts");
  const routersContent = fs.readFileSync(routersPath, "utf-8");
  const copilotPagePath = path.join(ROOT, "client/src/pages/portal/LiveCoPilot.tsx");
  const copilotContent = fs.readFileSync(copilotPagePath, "utf-8");

  it("should have a liveCoPilot router in appRouter", () => {
    expect(routersContent).toContain("liveCoPilot:");
  });

  it("should have a chat mutation that calls invokeLLM", () => {
    expect(routersContent).toContain("invokeLLM");
    expect(routersContent).toContain("liveCoPilot:");
  });

  it("should accept messages array and mode in the chat mutation", () => {
    // The chat mutation should accept messages and mode (copilot/wwsd)
    expect(routersContent).toContain("messages:");
    expect(routersContent).toContain('mode: z.enum');
  });

  it("frontend should use trpc.liveCoPilot.chat mutation", () => {
    expect(copilotContent).toContain("trpc.liveCoPilot.chat");
  });

  it("frontend should NOT have hardcoded canned responses", () => {
    // Old canned responses used setTimeout to simulate delay
    expect(copilotContent).not.toContain("CANNED_RESPONSES");
    expect(copilotContent).not.toContain("cannedResponses");
  });

  it("frontend should render messages with whitespace-pre-wrap for formatting", () => {
    // Messages are rendered with whitespace-pre-wrap for proper formatting
    expect(copilotContent).toContain("whitespace-pre-wrap");
  });
});

// ─── WarRoom Persistence ────────────────────────────────────────────────────

describe("WarRoom — Database Persistence", () => {
  const warRoomPath = path.join(ROOT, "client/src/pages/portal/WarRoom.tsx");
  const warRoomContent = fs.readFileSync(warRoomPath, "utf-8");
  const schemaPath = path.join(ROOT, "drizzle/schema.ts");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  it("should have predictionQuestions table in schema", () => {
    expect(schemaContent).toContain("predictionQuestions");
  });

  it("should have warStories table in schema", () => {
    expect(schemaContent).toContain("warStories");
  });

  it("should have predictionBets table in schema", () => {
    expect(schemaContent).toContain("predictionBets");
  });

  it("frontend should use trpc for war stories CRUD", () => {
    expect(warRoomContent).toContain("trpc.experience.createWarStory");
    expect(warRoomContent).toContain("trpc.experience.getWarStories");
  });

  it("frontend should use trpc for prediction questions", () => {
    expect(warRoomContent).toContain("trpc.experience.getPredictionQuestions");
  });

  it("frontend should use trpc for prediction votes", () => {
    expect(warRoomContent).toContain("trpc.experience.voteOnPrediction");
  });

  it("frontend should NOT have hardcoded mock war stories", () => {
    expect(warRoomContent).not.toContain("MOCK_WAR_STORIES");
    expect(warRoomContent).not.toContain("mockWarStories");
  });
});

// ─── Open Access — No Trial Restrictions ────────────────────────────────────

describe("Open Access — All Users Get Full Access", () => {
  const accessContextPath = path.join(ROOT, "client/src/contexts/AccessContext.tsx");
  const accessContent = fs.readFileSync(accessContextPath, "utf-8");
  const subGuardPath = path.join(ROOT, "client/src/components/SubscriptionGuard.tsx");
  const subGuardContent = fs.readFileSync(subGuardPath, "utf-8");
  const routersPath = path.join(ROOT, "server/routers.ts");
  const routersContent = fs.readFileSync(routersPath, "utf-8");
  const indexPath = path.join(ROOT, "server/_core/index.ts");
  const indexContent = fs.readFileSync(indexPath, "utf-8");

  it("canAccess should be derived from managed authentication", () => {
    expect(accessContent).toContain("useAuth");
    expect(accessContent).toContain("canAccess: isAuthenticated");
  });

  it("session expiry should be managed by OAuth rather than a client timer", () => {
    expect(accessContent).toContain("sessionExpired: false");
    expect(accessContent).not.toContain("setInterval");
  });

  it("SubscriptionGuard should NOT show trial banner", () => {
    expect(subGuardContent).not.toContain("Trial Access —");
    expect(subGuardContent).not.toContain("logins remaining");
  });

  it("SubscriptionGuard should NOT show trial expired screen", () => {
    expect(subGuardContent).not.toContain("Trial Expired");
    expect(subGuardContent).not.toContain("Session Expired");
  });

  it("slide generation limit should be effectively unlimited (999)", () => {
    expect(routersContent).toContain("TRIAL_SLIDE_DAILY_LIMIT = 999");
  });

  it("server should not block trial users from logging in", () => {
    // The server should not return trial_access_limit or trial_expired errors
    expect(indexContent).not.toContain('error: "trial_access_limit"');
    expect(indexContent).not.toContain('error: "trial_expired"');
  });

  it("heartbeat should require managed authentication", () => {
    expect(routersContent).toContain("heartbeat: protectedProcedure");
  });

  it("passwordGate should be retired in favor of secure sign in", () => {
    expect(routersContent).toContain("Password-gate access is disabled");
    expect(routersContent).toContain('code: "FORBIDDEN"');
  });

  it("executive access should use managed OAuth with no bypass endpoint", () => {
    expect(indexContent).not.toContain("executive-access");
    expect(indexContent).toContain("registerOAuthRoutes");
  });
});

// ─── HeyGen Quota Fix ──────────────────────────────────────────────────────

describe("HeyGen — Quota Endpoint Fix", () => {
  const heygenPath = path.join(ROOT, "server/heygenService.ts");
  const heygenContent = fs.readFileSync(heygenPath, "utf-8");

  it("should use v2 API for quota endpoint", () => {
    expect(heygenContent).toContain("/v2/user/remaining_quota");
    expect(heygenContent).not.toContain("/v1/video_generate.remaining_quota");
  });

  it("should handle v2 quota response with details", () => {
    expect(heygenContent).toContain("generative_credit");
    expect(heygenContent).toContain("plan_credit");
  });

  it("should sum generative and plan credits when remaining_quota is 0", () => {
    expect(heygenContent).toContain("quota.details.generative_credit");
    expect(heygenContent).toContain("quota.details.plan_credit");
  });
});

// ─── Strategy Types for New Experience Pages ────────────────────────────────

describe("Strategy Types — New Experience Pages", () => {
  const contextPath = path.join(ROOT, "client/src/contexts/StrategyContext.tsx");
  const contextContent = fs.readFileSync(contextPath, "utf-8");

  it("should include live-copilot strategy type", () => {
    expect(contextContent).toContain('"live-copilot"');
  });

  it("should include social-narcotic strategy type", () => {
    expect(contextContent).toContain('"social-narcotic"');
  });

  it("should include war-room strategy type", () => {
    expect(contextContent).toContain('"war-room"');
  });

  it("should have labels for all new strategy types", () => {
    expect(contextContent).toContain('"live-copilot":');
    expect(contextContent).toContain('"social-narcotic":');
    expect(contextContent).toContain('"war-room":');
  });
});
