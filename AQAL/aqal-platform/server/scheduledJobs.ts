export type ScheduledJob = {
  name: string;
  cron: string;
  path: string;
  description: string;
};

/**
 * Owner-controlled managed Heartbeat manifest.
 *
 * The handlers are Express routes under /api/scheduled/* and accept only
 * authenticated cron identities. Expressions use the required six-field UTC
 * format. Create or update these jobs only after the owner publishes callback
 * code; a development preview is not a valid callback target.
 */
export const SCHEDULED_JOBS: ScheduledJob[] = [
  {
    name: "aqal-finish-nudge",
    cron: "0 0 * * * *",
    path: "/api/scheduled/finish-nudge",
    description: "One-time finish-your-assessment email, 24–96 hours after signup.",
  },
  {
    name: "aqal-tracker-reengagement",
    cron: "0 0 17 1,15 * *",
    path: "/api/scheduled/tracker-reengagement",
    description: "Twice-monthly invitation for opted-in members to start their next tracker cycle.",
  },
  {
    name: "aqal-drift-alert",
    cron: "0 0 9 * * *",
    path: "/api/scheduled/drift-alert",
    description: "Daily evaluation-cadence drift check.",
  },
  {
    name: "aqal-message-digest",
    cron: "0 0 */2 * * *",
    path: "/api/scheduled/message-digest",
    description: "Unread-message count digest; never content; at most one per member per day.",
  },
  {
    name: "aqal-reentry",
    cron: "0 0 16 * * *",
    path: "/api/scheduled/reentry",
    description: "One-time re-entry email for members stalled mid-assessment for at least 30 days.",
  },
  {
    name: "aqal-question-of-day",
    cron: "0 0 13 * * *",
    path: "/api/scheduled/question-of-day",
    description: "Daily next-unanswered-question email, skipped when the member already answered that day.",
  },
  {
    name: "aqal-daily-reminders",
    cron: "0 0 * * * *",
    path: "/api/scheduled/daily-reminders",
    description: "Hourly timezone-aware Y/N check-ins, deduplicated per commitment and local date.",
  },
];

export async function ensureScheduledJobs(): Promise<void> {
  console.log(
    `[scheduledJobs] ${SCHEDULED_JOBS.length} managed Heartbeat callbacks are defined. Create or update schedules only after the owner publishes this version.`,
  );
}
