import { TRPCError } from "@trpc/server";
import { ENV } from "./env";
import { sendMail } from "./mailer";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/** Where owner notifications go: LEAD_NOTIFY_EMAIL, else OWNER_EMAIL. */
export function ownerNotificationAddress(env = ENV): string {
  return (env.leadNotifyEmail || env.ownerEmail || "").trim();
}

/**
 * Sends a project-owner notification by email through the site's own mail
 * transport (server/_core/mailer.ts: Resend or SMTP). Returns `true` when the
 * message was handed to the transport and `false` when no recipient or no
 * transport is configured or delivery failed, so callers can carry on.
 * Validation errors bubble up as TRPC errors so callers can fix the payload.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  const to = ownerNotificationAddress();
  if (!to) {
    console.warn("[Notification] Owner notifications are not configured (set LEAD_NOTIFY_EMAIL or OWNER_EMAIL).");
    return false;
  }

  try {
    const result = await sendMail({ to, subject: title.slice(0, 200), text: content, category: "transactional" });
    if (!result.sent) {
      console.warn(`[Notification] Owner notification not sent: ${result.reason ?? "unknown reason"}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error sending owner notification:", String(error));
    return false;
  }
}
