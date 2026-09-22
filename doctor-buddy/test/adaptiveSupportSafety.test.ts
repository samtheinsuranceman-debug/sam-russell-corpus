import { describe, expect, it } from "vitest";
import fs from "fs";

describe("adaptive support safety architecture", () => {
  const routers = fs.readFileSync("server/routers.ts", "utf8");
  const widget = fs.readFileSync("client/src/components/DrBuddyWidget.tsx", "utf8");
  const inventions = fs.readFileSync("client/src/lib/supportInventions.ts", "utf8");

  it("ships exactly 50 adaptive support invention kernels", () => {
    const numbers = [...inventions.matchAll(/number:\s*(\d+)/g)].map((m) => Number(m[1]));
    expect(numbers).toHaveLength(50);
    expect(numbers).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  });

  it("supports Friend, Therapist, and Psychiatrist communication modes", () => {
    expect(routers).toContain('z.enum(["friend", "therapist", "psychiatrist"])');
    expect(widget).toContain("SupportModeSelector");
  });

  it("keeps advisory system instructions server-controlled", () => {
    const advisoryStart = routers.indexOf("advisory: router");
    const drBuddyStart = routers.indexOf("drBuddy: router", advisoryStart);
    const advisory = routers.slice(advisoryStart, drBuddyStart);
    expect(advisory).not.toContain("systemPrompt: z.string");
    expect(advisory).toContain("CORE SAFETY BOUNDARIES");
  });

  it("fails closed in HIPAA BAA mode until processor approval is confirmed", () => {
    expect(routers).toContain('process.env.HIPAA_DEPLOYMENT_MODE === "baa"');
    expect(routers).toContain('process.env.HIPAA_BAA_CONFIRMED !== "true"');
  });

  it("does not duplicate raw crisis messages into the brain-event payload", () => {
    const crisisEvent = routers.slice(
      routers.indexOf('"crisis_detected"'),
      routers.indexOf("return result", routers.indexOf('"crisis_detected"')),
    );
    expect(crisisEvent).toContain("messageLength");
    expect(crisisEvent).not.toContain("input.message.slice");
  });
});
