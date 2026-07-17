// ============================================================
// SMS seam — send a text message (daily accountability check-in)
// ============================================================
// Twilio by default; missing creds = mock (logs), so the app runs with no vendor.
// Mirrors the email/LLM/storage seams: real when configured, safe fallback else.

import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  smsProvider,
} from "./config";

export type SendSmsResult = { ok: boolean; mocked: boolean; error?: string };

export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  if (smsProvider() === "mock") {
    console.log(`[sms:mock] → ${to} · ${body.slice(0, 80)}`);
    return { ok: true, mocked: true };
  }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const form = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: body });
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, mocked: false, error: `Twilio ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true, mocked: false };
  } catch (err) {
    return { ok: false, mocked: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// The daily check-in copy. Deliberately tiny — one question, Y/N reply.
export function dailyCheckinSms(): string {
  return "AQAL daily check-in: did you complete today's tracking protocols? Reply Y or N. (Reply STOP to end.)";
}
