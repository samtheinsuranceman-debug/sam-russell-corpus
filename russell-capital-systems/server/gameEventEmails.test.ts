import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gameEventEmailsEnabled } from "./experienceRouter";

const src = readFileSync(resolve("server/experienceRouter.ts"), "utf8");

describe("game-event owner e-mails are muted", () => {
  it("are off unless GAME_EVENT_EMAILS=on", () => {
    expect(gameEventEmailsEnabled({})).toBe(false);
    expect(gameEventEmailsEnabled({ GAME_EVENT_EMAILS: "off" })).toBe(false);
    expect(gameEventEmailsEnabled({ GAME_EVENT_EMAILS: " ON " })).toBe(true);
  });

  it("routes every game event through the gate", () => {
    for (const title of ["Level Up!", "Quest Complete", "Streak Milestone", "New Pet Adopted", "Pet Evolution!", "Morning Ritual Complete!"]) {
      const at = src.indexOf(title);
      expect(at, title).toBeGreaterThan(0);
      const before = src.slice(Math.max(0, at - 200), at);
      expect(before.lastIndexOf("notifyGameEvent("), title).toBeGreaterThan(before.lastIndexOf("notifyOwner("));
    }
  });
});
