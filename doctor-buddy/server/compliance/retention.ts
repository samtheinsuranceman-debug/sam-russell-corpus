import { lt } from "drizzle-orm";
import { activityLogs, brainEvents, crisisEvents, privacyRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { PUBLIC_WELLNESS_MODE } from "./releasePolicy";

function envDays(name: string, fallback: number, min = 1, max = 3650) {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function getPublicRetentionSchedule() {
  return {
    usageLogsDays: envDays("PUBLIC_USAGE_LOG_RETENTION_DAYS", 90),
    safetyEventDays: envDays("PUBLIC_SAFETY_EVENT_RETENTION_DAYS", 90),
    backupMaxDays: envDays("PUBLIC_BACKUP_MAX_RETENTION_DAYS", 35),
    privacyRequestDetailDays: envDays("PUBLIC_PRIVACY_REQUEST_DETAIL_RETENTION_DAYS", 90),
  };
}

/**
 * Minimum-necessary automated retention for public-edition telemetry.
 * User-saved journals, medication lists and saved wellness content are not
 * silently expired; consumers control those through deletion/export tools.
 */
export async function applyPublicRetentionPolicy() {
  if (!PUBLIC_WELLNESS_MODE) return { skipped: true };
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const schedule = getPublicRetentionSchedule();
  const now = Date.now();
  const usageCutoff = new Date(now - schedule.usageLogsDays * 86400_000);
  const safetyCutoff = new Date(now - schedule.safetyEventDays * 86400_000);
  const privacyDetailCutoff = new Date(now - schedule.privacyRequestDetailDays * 86400_000);

  await db.delete(activityLogs).where(lt(activityLogs.createdAt, usageCutoff));
  await db.delete(brainEvents).where(lt(brainEvents.createdAt, usageCutoff));
  await db.delete(crisisEvents).where(lt(crisisEvents.createdAt, safetyCutoff));
  await db.update(privacyRequests).set({ details: null, resolutionNotes: null }).where(lt(privacyRequests.resolvedAt, privacyDetailCutoff));

  return { skipped: false, ...schedule, appliedAt: new Date().toISOString() };
}

export function startPublicRetentionScheduler() {
  if (!PUBLIC_WELLNESS_MODE) return;
  const run = () => applyPublicRetentionPolicy().catch(error => {
    console.error("[Retention] automated cleanup failed", error instanceof Error ? error.message : error);
  });
  void run();
  const timer = setInterval(run, 24 * 60 * 60 * 1000);
  timer.unref?.();
}
