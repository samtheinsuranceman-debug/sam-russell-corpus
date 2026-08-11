/**
 * Boot-time Heartbeat registration for the scheduled jobs.
 *
 * The three job handlers are Express routes under /api/scheduled/* — they can
 * only RECEIVE calls. This module makes sure something actually CALLS them:
 * on server startup it registers each job with the platform Heartbeat cron
 * service, idempotently (list first, create only what's missing by name).
 *
 * Safe by construction:
 * - No Forge credentials (local dev, or a non-Manus host using an external
 *   scheduler per LAUNCH_RUNBOOK §5b) → logs one line and does nothing.
 * - Any Heartbeat API failure → warn and continue; boot is never blocked.
 * - Already registered → left untouched, so cadence edits made in the
 *   dashboard survive restarts.
 */

import { createHeartbeatJob, listHeartbeatJobs, type HeartbeatJob } from "./_core/heartbeat";
import { ENV } from "./_core/env";

// 6-field cron with seconds, UTC (see _core/heartbeat.ts).
const JOBS: HeartbeatJob[] = [
  {
    name: "aqal-finish-nudge",
    cron: "0 0 * * * *", // hourly
    path: "/api/scheduled/finish-nudge",
    description: "One-time 'finish your assessment' email, 24-96h after signup, for members with no completed assessment.",
  },
  {
    name: "aqal-tracker-reengagement",
    cron: "0 0 17 1,15 * *", // 1st + 15th, 17:00 UTC (~twice a month)
    path: "/api/scheduled/tracker-reengagement",
    description: "Invites opted-in members to start their next behavioral-tracker cycle.",
  },
  {
    name: "aqal-drift-alert",
    cron: "0 0 9 * * *", // daily 09:00 UTC
    path: "/api/scheduled/drift-alert",
    description: "Daily evaluation-cadence drift check.",
  },
  {
    name: "aqal-message-digest",
    cron: "0 0 */2 * * *", // every 2 hours
    path: "/api/scheduled/message-digest",
    description: "Unread-messages email digest (count only, never content; max one per member per day).",
  },
  {
    name: "aqal-reentry",
    cron: "0 0 16 * * *", // daily 16:00 UTC
    path: "/api/scheduled/reentry",
    description: "One-time 'before you quit' re-entry email for members 30+ days stalled mid-assessment.",
  },
];

export async function ensureScheduledJobs(): Promise<void> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.log("[scheduledJobs] Heartbeat not configured — register an external scheduler for /api/scheduled/* (see LAUNCH_RUNBOOK §5b).");
    return;
  }
  try {
    // Empty userSession = project-owner identity (see heartbeat.ts).
    const existing = await listHeartbeatJobs("", { pageSize: 100 });
    const have = new Set(existing.jobs.map((j) => j.name));
    for (const job of JOBS) {
      if (have.has(job.name)) continue;
      try {
        const created = await createHeartbeatJob(job, "");
        console.log(`[scheduledJobs] registered ${job.name} (${job.cron}) → ${job.path} [${created.taskUid}]`);
      } catch (err) {
        console.warn(`[scheduledJobs] could not register ${job.name}:`, err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    console.warn("[scheduledJobs] Heartbeat registration skipped:", err instanceof Error ? err.message : err);
  }
}
