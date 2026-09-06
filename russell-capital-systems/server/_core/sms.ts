// ============================================================
// SMS TRANSPORT — one sendSms() for the app, three ways to deliver:
//   1. Twilio           TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and either
//                       TWILIO_FROM (E.164 number) or TWILIO_MESSAGING_SERVICE_SID
//   2. Relay webhook    SMS_WEBHOOK_URL (+ optional SMS_WEBHOOK_TOKEN): the app
//                       POSTs {to, body} as JSON — bridges any provider that can
//                       accept a webhook (Inkbox, Speko, Zapier, Make, a phone app)
//   3. None             the message is not sent and the caller is told so
//
// Compliance is built in, not optional:
//   - numbers are normalised to E.164 (US default) before anything is sent
//   - a number that replied STOP is never messaged again (sms_opt_outs)
//   - marketing texts carry "Reply STOP to opt out" and consent is required
//   - inbound STOP/HELP is handled by the /api/sms/inbound webhook
// Secrets are read from the environment only.
// ============================================================
import type { Express, Request, Response } from "express";
import { isSmsOptedOut, recordSmsOptOut, clearSmsOptOut } from "../messagingDb";

export type SmsMessage = { to: string; body: string; category?: "transactional" | "marketing" };
export type SmsResult = { sent: boolean; via?: "twilio" | "webhook"; reason?: string; to?: string };

export type SmsEnv = {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
  TWILIO_MESSAGING_SERVICE_SID?: string;
  SMS_WEBHOOK_URL?: string;
  SMS_WEBHOOK_TOKEN?: string;
};

export const SMS_MAX_LENGTH = 1200;
export const STOP_WORDS = ["stop", "stopall", "unsubscribe", "cancel", "end", "quit"];
export const START_WORDS = ["start", "unstop", "yes"];
const OPT_OUT_FOOTER = "Reply STOP to opt out.";

export function smsMode(env: SmsEnv = process.env as SmsEnv): "twilio" | "webhook" | "none" {
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && (env.TWILIO_FROM || env.TWILIO_MESSAGING_SERVICE_SID)) return "twilio";
  if (env.SMS_WEBHOOK_URL) return "webhook";
  return "none";
}

/**
 * Normalise a phone number to E.164. US numbers are the default: 10 digits get
 * +1, 11 digits starting with 1 get +. Anything else must already carry a
 * country code. Returns null when the input cannot be a phone number.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export function smsBody(body: string, category: SmsMessage["category"] = "transactional"): string {
  const clean = body.replace(/\s+\n/g, "\n").trim().slice(0, SMS_MAX_LENGTH);
  if (category === "marketing" && !/reply stop/i.test(clean)) return `${clean}\n${OPT_OUT_FOOTER}`;
  return clean;
}

async function sendViaTwilio(to: string, body: string, env: SmsEnv): Promise<SmsResult> {
  const sid = env.TWILIO_ACCOUNT_SID!;
  const form = new URLSearchParams({ To: to, Body: body });
  if (env.TWILIO_MESSAGING_SERVICE_SID) form.set("MessagingServiceSid", env.TWILIO_MESSAGING_SERVICE_SID);
  else form.set("From", env.TWILIO_FROM!);
  const auth = Buffer.from(`${sid}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: { authorization: `Basic ${auth}`, "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return { sent: false, via: "twilio", reason: `SMS provider rejected the message (${res.status})`, to };
  return { sent: true, via: "twilio", to };
}

async function sendViaWebhook(to: string, body: string, env: SmsEnv): Promise<SmsResult> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (env.SMS_WEBHOOK_TOKEN) headers.authorization = `Bearer ${env.SMS_WEBHOOK_TOKEN}`;
  const res = await fetch(env.SMS_WEBHOOK_URL!, { method: "POST", headers, body: JSON.stringify({ to, body }), signal: AbortSignal.timeout(15000) });
  if (!res.ok) return { sent: false, via: "webhook", reason: `SMS relay rejected the message (${res.status})`, to };
  return { sent: true, via: "webhook", to };
}

/**
 * Send one text. Refuses silently-but-honestly when: no transport, the number
 * is not a phone number, or the number has opted out.
 */
export async function sendSms(msg: SmsMessage, env: SmsEnv = process.env as SmsEnv): Promise<SmsResult> {
  const mode = smsMode(env);
  if (mode === "none") return { sent: false, reason: "No SMS transport configured (set TWILIO_* or SMS_WEBHOOK_URL)" };
  const to = normalizePhone(msg.to);
  if (!to) return { sent: false, reason: "Not a valid phone number" };
  if (await isSmsOptedOut(to)) return { sent: false, reason: "This number has opted out of texts", to };
  const body = smsBody(msg.body, msg.category);
  if (!body) return { sent: false, reason: "Empty message", to };
  try {
    return mode === "twilio" ? await sendViaTwilio(to, body, env) : await sendViaWebhook(to, body, env);
  } catch (error) {
    console.warn("[SMS] delivery failed via", mode, String(error).slice(0, 200));
    return { sent: false, via: mode, reason: "SMS delivery failed", to };
  }
}

/** Classify an inbound text: opt-out, opt-in, help, or an ordinary reply. */
export function classifyInbound(body: string | undefined): "stop" | "start" | "help" | "message" {
  const word = (body ?? "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (STOP_WORDS.includes(word)) return "stop";
  if (START_WORDS.includes(word)) return "start";
  if (word === "help" || word === "info") return "help";
  return "message";
}

/**
 * Inbound webhook (Twilio-compatible form fields `From` and `Body`; JSON with
 * `from`/`body` also accepted). STOP records an opt-out, START clears it,
 * HELP answers with contact details. Replies are TwiML so Twilio sends them.
 */
export function registerSmsRoutes(app: Express): void {
  app.post("/api/sms/inbound", async (req: Request, res: Response) => {
    const src = (req.body ?? {}) as Record<string, unknown>;
    const from = normalizePhone(String(src.From ?? src.from ?? ""));
    const body = String(src.Body ?? src.body ?? "");
    const kind = classifyInbound(body);
    let reply = "";
    if (from && kind === "stop") { await recordSmsOptOut(from, "reply"); reply = "You are unsubscribed from Russell Capital Systems texts. No more messages will be sent. Reply START to resubscribe."; }
    else if (from && kind === "start") { await clearSmsOptOut(from); reply = "You are resubscribed to Russell Capital Systems texts. Reply STOP to opt out at any time."; }
    else if (kind === "help") reply = "Russell Capital Systems: reply STOP to opt out. For help email support@russellcapitalsystems.com.";
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?><Response>${reply ? `<Message>${reply.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))}</Message>` : ""}</Response>`);
  });
}
