import { DAILY_CHECKIN_HOUR, shouldSendCheckinNow } from "@shared/commitment";
import {
  claimDailyAccountabilitySend,
  finishDailyAccountabilitySend,
  getActiveReminderCommitments,
  recordEvent,
} from "./db";
import { dailyCheckinEmailHtml } from "./platform/email";
import { sendMarketingEmail } from "./marketingEmail";
import { dailyCheckinSms, sendSms } from "./platform/sms";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const FALLBACK_TIMEZONE = "America/New_York";

export function localDateInZone(timezone: string | null | undefined, now = new Date()): string {
  const zone = timezone?.trim() || FALLBACK_TIMEZONE;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
    return `${part("year")}-${part("month")}-${part("day")}`;
  } catch {
    return localDateInZone(FALLBACK_TIMEZONE, now);
  }
}

export type DailyReminderRun = {
  total: number;
  sent: number;
  skipped: number;
  duplicates: number;
  failed: number;
};

export async function runDailyAccountability(input: {
  now?: Date;
  targetHour?: number;
  ignoreTime?: boolean;
} = {}): Promise<DailyReminderRun> {
  const targets = await getActiveReminderCommitments();
  const appUrl = `https://${(process.env.CANONICAL_HOST || "www.joinaqal.com").trim()}`;
  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const targetHour = input.targetHour ?? DAILY_CHECKIN_HOUR;
  const result: DailyReminderRun = { total: targets.length, sent: 0, skipped: 0, duplicates: 0, failed: 0 };

  for (const target of targets) {
    const start = target.reminderStartAt ? new Date(target.reminderStartAt).getTime() : nowMs;
    const dayNumber = Math.floor((nowMs - start) / 86_400_000) + 1;
    if (nowMs < start || nowMs - start > WINDOW_MS) { result.skipped++; continue; }
    if (!input.ignoreTime && !shouldSendCheckinNow(target.reminderTimezone, now, targetHour)) {
      result.skipped++;
      continue;
    }

    const localDate = localDateInZone(target.reminderTimezone, now);
    const claimed = await claimDailyAccountabilitySend({
      commitmentId: target.commitmentId,
      userId: target.userId,
      localDate,
      channel: target.reminderChannel,
    });
    if (!claimed) { result.duplicates++; continue; }

    let ok = false;
    if (target.reminderChannel === "text" && target.reminderPhone) {
      ok = (await sendSms(target.reminderPhone, dailyCheckinSms())).ok;
    } else if (target.reminderChannel === "email" && target.email) {
      ok = (await sendMarketingEmail(
        target.email,
        "Your AQAL daily check-in — reply Y or N",
        dailyCheckinEmailHtml({ dayNumber }),
        appUrl,
      )).ok;
    }

    await finishDailyAccountabilitySend(target.commitmentId, localDate, ok ? "sent" : "failed");
    if (ok) result.sent++; else result.failed++;
  }

  await recordEvent({ type: "reminders_daily", numericValue: result.sent, ok: result.failed === 0, meta: result });
  return result;
}
