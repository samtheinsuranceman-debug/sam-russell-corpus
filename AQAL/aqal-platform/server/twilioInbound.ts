import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { localDateInZone } from "./accountability";
import {
  getCurrentTextCommitmentByPhone,
  recordDailyAccountabilityReply,
  stopTextRemindersForCommitment,
} from "./db";
import { TWILIO_AUTH_TOKEN } from "./platform/config";

type Reply = "yes" | "no" | "stop";

export function normalizeAccountabilityReply(body: unknown): Reply | null {
  const value = String(body ?? "").trim().toUpperCase();
  if (value === "Y" || value === "YES") return "yes";
  if (value === "N" || value === "NO") return "no";
  if (value === "STOP") return "stop";
  return null;
}

export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!authToken || !signature || !url) return false;
  const payload = Object.keys(params).sort().reduce((out, key) => out + key + params[key], url);
  const expected = createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requestUrl(req: Request): string {
  const proto = String(req.headers["x-forwarded-proto"] ?? req.protocol).split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").split(",")[0].trim();
  return `${proto}://${host}${req.originalUrl}`;
}

function twiml(message?: string): string {
  const escaped = String(message ?? "").replace(/[<>&'\"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[c] ?? c));
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${escaped ? `<Message>${escaped}</Message>` : ""}</Response>`;
}

export async function twilioInboundHandler(req: Request, res: Response) {
  res.type("application/xml");
  if (!TWILIO_AUTH_TOKEN) return res.status(503).send(twiml());

  const params = Object.fromEntries(Object.entries(req.body ?? {}).map(([key, value]) => [key, String(value ?? "")]));
  const signature = String(req.headers["x-twilio-signature"] ?? "");
  if (!validateTwilioSignature(TWILIO_AUTH_TOKEN, signature, requestUrl(req), params)) {
    return res.status(403).send(twiml());
  }

  const reply = normalizeAccountabilityReply(params.Body);
  if (!reply) return res.status(200).send(twiml("Reply Y or N. Reply STOP to end daily check-ins."));
  const target = await getCurrentTextCommitmentByPhone(params.From ?? "");
  if (!target) return res.status(200).send(twiml());

  const outcome = await recordDailyAccountabilityReply({
    commitmentId: target.commitmentId,
    userId: target.userId,
    localDate: localDateInZone(target.reminderTimezone),
    reply,
    sourceMessageSid: params.MessageSid || null,
  });
  if (reply === "stop") {
    await stopTextRemindersForCommitment(target.commitmentId);
    return res.status(200).send(twiml(outcome === "duplicate" ? undefined : "AQAL daily check-ins are now off."));
  }
  return res.status(200).send(twiml(outcome === "duplicate" ? undefined : "Recorded. Thank you."));
}
