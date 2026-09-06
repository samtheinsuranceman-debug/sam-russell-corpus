// ============================================================
// EVENT BUS — the plan ledger is the spine; this is how the outside world
// hears it. Every appended ledger event is fanned out, best-effort, to:
//   - ZAPIER_HOOK_URL, MAKE_HOOK_URL, N8N_HOOK_URL, EVENT_WEBHOOK_URLS (JSON)
//   - SLACK_WEBHOOK_URL (a short message for the kinds a human wants to see)
// Facts (financial values) are NOT sent unless EVENT_WEBHOOK_INCLUDE_FACTS=1,
// and EVENT_WEBHOOK_KINDS can narrow the kinds further. A shared secret goes
// in the X-RCS-Signature header (HMAC-SHA256 of the body) when
// EVENT_WEBHOOK_SECRET is set, so receivers can verify the sender.
// ============================================================
import { createHmac } from "node:crypto";
import type { LedgerEventInput, LedgerKind } from "@shared/planLedger";

export type BusEnv = Partial<Record<"ZAPIER_HOOK_URL" | "MAKE_HOOK_URL" | "N8N_HOOK_URL" | "EVENT_WEBHOOK_URLS" | "EVENT_WEBHOOK_SECRET" | "EVENT_WEBHOOK_KINDS" | "EVENT_WEBHOOK_INCLUDE_FACTS" | "SLACK_WEBHOOK_URL" | "PUBLIC_BASE_URL", string>>;

export const SLACK_KINDS: LedgerKind[] = ["status", "decision", "outcome", "note"];
const DEFAULT_KINDS: LedgerKind[] = ["status", "journey", "message", "decision", "note", "outcome", "scenario", "document", "assumption"];

export function webhookTargets(env: BusEnv = process.env as BusEnv): Array<{ name: string; url: string }> {
  const out: Array<{ name: string; url: string }> = [];
  if (env.ZAPIER_HOOK_URL) out.push({ name: "zapier", url: env.ZAPIER_HOOK_URL });
  if (env.MAKE_HOOK_URL) out.push({ name: "make", url: env.MAKE_HOOK_URL });
  if (env.N8N_HOOK_URL) out.push({ name: "n8n", url: env.N8N_HOOK_URL });
  for (const u of (env.EVENT_WEBHOOK_URLS ?? "").split(",").map((s) => s.trim()).filter(Boolean)) out.push({ name: "webhook", url: u });
  return out;
}

export function allowedKinds(env: BusEnv = process.env as BusEnv): Set<LedgerKind> {
  const listed = (env.EVENT_WEBHOOK_KINDS ?? "").split(",").map((s) => s.trim()).filter(Boolean) as LedgerKind[];
  const kinds = new Set<LedgerKind>(listed.length ? listed : DEFAULT_KINDS);
  if (env.EVENT_WEBHOOK_INCLUDE_FACTS === "1" || env.EVENT_WEBHOOK_INCLUDE_FACTS === "true") kinds.add("fact");
  return kinds;
}

export type BusEvent = {
  event: "plan.ledger";
  kind: LedgerKind;
  source: string;
  key: string | null;
  label: string | null;
  summary: string;
  value: unknown;
  actorName: string | null;
  occurredAt: string;
  subject: { userId: number | null; clientId: number | null; leadId: number | null; workspaceId: number | null };
  site: string | null;
};

export function toBusEvent(e: LedgerEventInput, env: BusEnv = process.env as BusEnv): BusEvent {
  return {
    event: "plan.ledger", kind: e.kind, source: e.source, key: e.key ?? null, label: e.label ?? null, summary: e.summary,
    value: e.kind === "fact" ? e.value ?? null : e.value ?? null, actorName: e.actorName ?? null, occurredAt: (e.occurredAt ?? new Date()).toISOString(),
    subject: { userId: e.userId ?? null, clientId: e.clientId ?? null, leadId: e.leadId ?? null, workspaceId: e.workspaceId ?? null },
    site: env.PUBLIC_BASE_URL ?? null,
  };
}

export function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function slackText(e: BusEvent): string {
  const who = e.subject.clientId ? `client #${e.subject.clientId}` : e.subject.leadId ? `lead #${e.subject.leadId}` : e.subject.userId ? `user #${e.subject.userId}` : "system";
  return `*${e.kind}* · ${e.summary}\n_${who} · ${e.source}${e.actorName ? ` · ${e.actorName}` : ""} · ${new Date(e.occurredAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT_`;
}

type Fetcher = typeof fetch;
let _fetch: Fetcher = (...a) => fetch(...a);
export function _setFetchForTests(f: Fetcher | null) { _fetch = f ?? ((...a) => fetch(...a)); }

async function post(url: string, body: string, headers: Record<string, string>): Promise<boolean> {
  try {
    const r = await _fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body, signal: AbortSignal.timeout(8000) });
    return r.ok;
  } catch { return false; }
}

/** Fan events out. Never throws; returns how many deliveries were attempted and how many succeeded. */
export async function fanOut(events: LedgerEventInput[], env: BusEnv = process.env as BusEnv): Promise<{ attempted: number; delivered: number }> {
  const targets = webhookTargets(env);
  const kinds = allowedKinds(env);
  const chosen = events.filter((e) => kinds.has(e.kind));
  let attempted = 0, delivered = 0;
  if (targets.length && chosen.length) {
    for (const e of chosen) {
      const body = JSON.stringify(toBusEvent(e, env));
      const headers: Record<string, string> = {};
      if (env.EVENT_WEBHOOK_SECRET) headers["x-rcs-signature"] = signBody(body, env.EVENT_WEBHOOK_SECRET);
      const results = await Promise.all(targets.map((t) => post(t.url, body, headers)));
      attempted += results.length;
      delivered += results.filter(Boolean).length;
    }
  }
  if (env.SLACK_WEBHOOK_URL) {
    for (const e of events.filter((x) => SLACK_KINDS.includes(x.kind))) {
      attempted += 1;
      if (await post(env.SLACK_WEBHOOK_URL, JSON.stringify({ text: slackText(toBusEvent(e, env)) }), {})) delivered += 1;
    }
  }
  return { attempted, delivered };
}
