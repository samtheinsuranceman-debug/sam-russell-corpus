import { describe, expect, it } from "vitest";
import { SCHEDULED_JOBS } from "./scheduledJobs";

describe("managed Heartbeat manifest", () => {
  it("uses unique names, scheduled callback paths, and six-field cron expressions", () => {
    expect(new Set(SCHEDULED_JOBS.map((job) => job.name)).size).toBe(SCHEDULED_JOBS.length);
    for (const job of SCHEDULED_JOBS) {
      expect(job.path.startsWith("/api/scheduled/")).toBe(true);
      expect(job.cron.trim().split(/\s+/)).toHaveLength(6);
    }
  });

  it("includes the hourly, timezone-aware daily reminder callback", () => {
    expect(SCHEDULED_JOBS).toContainEqual(expect.objectContaining({
      name: "aqal-daily-reminders",
      cron: "0 0 * * * *",
      path: "/api/scheduled/daily-reminders",
    }));
  });
});
