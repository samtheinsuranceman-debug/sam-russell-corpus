import { createHmac } from "crypto";
import { getActiveWebhooksForEvent, markWebhookFailed, markWebhookTriggered } from "./db";

export const WEBHOOK_EVENTS = [
  "client.created",
  "client.updated",
  "deal.stage_changed",
  "deal.closed_won",
  "strategy.generated",
  "note.added",
  "team.member_invited",
  "team.member_joined",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function dispatchWebhook(workspaceId: number, event: WebhookEventType, data: Record<string, unknown>) {
  try {
    const hooks = await getActiveWebhooksForEvent(workspaceId, event);
    if (hooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    const body = JSON.stringify(payload);

    const results = await Promise.allSettled(
      hooks.map(async (hook) => {
        const signature = hook.secret ? signPayload(body, hook.secret) : undefined;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          "X-Webhook-Timestamp": payload.timestamp,
        };
        if (signature) headers["X-Webhook-Signature"] = `sha256=${signature}`;

        try {
          const res = await fetch(hook.url, {
            method: "POST",
            headers,
            body,
            signal: AbortSignal.timeout(10_000),
          });
          if (res.ok) {
            await markWebhookTriggered(hook.id);
            console.log(`[Webhook] ${event} → ${hook.url} (${res.status})`);
          } else {
            await markWebhookFailed(hook.id);
            console.warn(`[Webhook] ${event} → ${hook.url} failed (${res.status})`);
          }
        } catch (err) {
          await markWebhookFailed(hook.id);
          console.warn(`[Webhook] ${event} → ${hook.url} error:`, err);
        }
      })
    );

    return { dispatched: results.length, event };
  } catch (err) {
    console.error("[Webhook dispatch error]", err);
  }
}
